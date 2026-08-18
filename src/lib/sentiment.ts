import { pipeline } from "@huggingface/transformers";
import { supabase } from "@/integrations/supabase/client";

export interface Mention {
  text: string;
  source: string;
  date: Date;
  score?: number;
}

export interface ThreatScoreBreakdown {
  negativeShare: number;   // 0-100, share of mentions classed negative
  amplification: number;   // 0-100, share of negative mentions with above-median engagement
  momentum: number;        // 0-100, recent 24h negative share vs whole window
  weights: { negativeShare: number; amplification: number; momentum: number };
}

export interface AnalysisResult {
  sentimentDistribution: { name: string; value: number; fill: string }[];
  timeline: { date: string; mentions: number }[];
  keywords: { word: string; count: number }[];
  threatLevel: "low" | "medium" | "high" | "critical";
  threatScore: number;
  threatBreakdown: ThreatScoreBreakdown;
  shortTermSentiment: number;
  longTermSentiment: number;
  trendIcon: string;
  previousSentiment: number;
}


let sentimentPipeline: any = null;

async function getSentimentPipeline() {
  if (!sentimentPipeline) {
    sentimentPipeline = await pipeline(
      "sentiment-analysis",
      "Xenova/distilbert-base-uncased-finetuned-sst-2-english"
    );
  }
  return sentimentPipeline;
}

export async function analyzeSentiment(mentions: Mention[], brandName: string, userId: string): Promise<AnalysisResult> {
  const pipeline = await getSentimentPipeline();
  
  // Analyze sentiment for each mention
  const sentiments = await Promise.all(
    mentions.map(async (mention) => {
      try {
        const result = await pipeline(mention.text.slice(0, 512)); // Limit text length
        return {
          ...mention,
          sentiment: result[0].label.toLowerCase() as "positive" | "negative",
          confidence: result[0].score,
        };
      } catch (error) {
        console.error("Sentiment analysis error:", error);
        return {
          ...mention,
          sentiment: "positive" as const,
          confidence: 0.5,
        };
      }
    })
  );

  // Calculate sentiment distribution
  const positive = sentiments.filter((s) => s.sentiment === "positive").length;
  const negative = sentiments.filter((s) => s.sentiment === "negative").length;

  const sentimentDistribution = [
    { name: "Positive", value: positive, fill: "hsl(var(--chart-1))" },
    { name: "Negative", value: negative, fill: "hsl(var(--chart-2))" },
    { name: "Neutral", value: mentions.length - positive - negative, fill: "hsl(var(--chart-3))" },
  ];

  // Calculate timeline (last 7 days)
  const timeline = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    
    const count = mentions.filter((m) => {
      const mentionDate = new Date(m.date);
      return mentionDate.toDateString() === date.toDateString();
    }).length;
    
    timeline.push({ date: dateStr, mentions: count });
  }

  // Extract keywords (simple frequency analysis)
  const words = mentions
    .map((m) => m.text.toLowerCase())
    .join(" ")
    .split(/\W+/)
    .filter((w) => w.length > 4 && !["about", "their", "there", "which", "would"].includes(w));

  const wordFreq = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const keywords = Object.entries(wordFreq)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));

  // ---------------------------------------------------------------------------
  // Composite narrative risk score (0-100), explainable and bounded.
  //   Negative share  50%  — % of mentions classed negative
  //   Amplification   30%  — % of negative mentions with above-median engagement
  //   Momentum        20%  — negative share in the last 24h vs the whole window
  // ---------------------------------------------------------------------------
  const total = Math.max(1, sentiments.length);
  const negativeShare = (negative / total) * 100;

  const engagements = sentiments.map((s) => s.score || 1).sort((a, b) => a - b);
  const mid = Math.floor(engagements.length / 2);
  const medianEngagement = engagements.length === 0
    ? 0
    : engagements.length % 2 === 1
      ? engagements[mid]
      : (engagements[mid - 1] + engagements[mid]) / 2;

  const negativeMentions = sentiments.filter((s) => s.sentiment === "negative");
  const amplified = negativeMentions.filter((s) => (s.score || 1) > medianEngagement).length;
  const amplification = negativeMentions.length === 0 ? 0 : (amplified / negativeMentions.length) * 100;

  const dayAgo = Date.now() - 24 * 3600 * 1000;
  const recent = sentiments.filter((s) => new Date(s.date).getTime() >= dayAgo);
  const recentNegativeShare = recent.length === 0
    ? negativeShare
    : (recent.filter((s) => s.sentiment === "negative").length / recent.length) * 100;
  // Momentum is the worsening delta, scaled and capped so it can add but never dominate.
  const momentum = Math.max(0, Math.min(100, (recentNegativeShare - negativeShare) * 2));

  const threatBreakdown: ThreatScoreBreakdown = {
    negativeShare: Math.round(negativeShare),
    amplification: Math.round(amplification),
    momentum: Math.round(momentum),
    weights: { negativeShare: 50, amplification: 30, momentum: 20 },
  };

  const threatScore = Math.max(
    0,
    Math.min(100, Math.round(negativeShare * 0.5 + amplification * 0.3 + momentum * 0.2))
  );

  let threatLevel: "low" | "medium" | "high" | "critical";
  if (threatScore < 25) threatLevel = "low";
  else if (threatScore < 50) threatLevel = "medium";
  else if (threatScore < 75) threatLevel = "high";
  else threatLevel = "critical";


  // Calculate short-term sentiment (current scan)
  const neutral = mentions.length - positive - negative;
  const shortTermSentiment = ((positive - negative) / (positive + negative + neutral + 1)) * 100;

  // Store current sentiment in history
  await supabase.from("sentiment_history").insert({
    brand_name: brandName,
    sentiment_score: shortTermSentiment,
    positive_count: positive,
    negative_count: negative,
    neutral_count: neutral,
    total_mentions: mentions.length,
    user_id: userId,
  });

  // Retrieve historical sentiment data (last 10 scans)
  const { data: historyData } = await supabase
    .from("sentiment_history")
    .select("sentiment_score")
    .eq("brand_name", brandName)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  // Calculate long-term average
  const history = historyData?.map((h) => Number(h.sentiment_score)) || [shortTermSentiment];
  const longTermSentiment = history.reduce((a, b) => a + b, 0) / history.length;

  // Calculate trend vs previous scan
  const previousSentiment = history[1] || shortTermSentiment;
  const diff = shortTermSentiment - previousSentiment;
  let trendIcon = "➡️ Stable";
  if (diff > 3) trendIcon = "⬆️ Improving";
  if (diff < -3) trendIcon = "⬇️ Worsening";

  return {
    sentimentDistribution,
    timeline,
    keywords,
    threatLevel,
    threatScore,
    shortTermSentiment: Number(shortTermSentiment.toFixed(1)),
    longTermSentiment: Number(longTermSentiment.toFixed(1)),
    trendIcon,
    previousSentiment: Number(previousSentiment.toFixed(1)),
  };
}
