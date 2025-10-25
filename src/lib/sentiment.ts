import { pipeline } from "@huggingface/transformers";
import { supabase } from "@/integrations/supabase/client";

export interface Mention {
  text: string;
  source: string;
  date: Date;
  score?: number;
}

export interface AnalysisResult {
  sentimentDistribution: { name: string; value: number; fill: string }[];
  timeline: { date: string; mentions: number }[];
  keywords: { word: string; count: number }[];
  threatLevel: "low" | "medium" | "high" | "critical";
  threatScore: number;
  shortTermSentiment: number;
  longTermSentiment: number;
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

export async function analyzeSentiment(mentions: Mention[], brandName: string = "default"): Promise<AnalysisResult> {
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

  // Calculate threat score
  const negativeRatio = negative / mentions.length;
  const avgReach = mentions.reduce((sum, m) => sum + (m.score || 1), 0) / mentions.length;
  const threatScore = Math.round(negativeRatio * avgReach * 100);

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
  });

  // Retrieve historical sentiment data (last 10 scans)
  const { data: historyData } = await supabase
    .from("sentiment_history")
    .select("sentiment_score")
    .eq("brand_name", brandName)
    .order("created_at", { ascending: false })
    .limit(10);

  // Calculate long-term average
  const history = historyData?.map((h) => Number(h.sentiment_score)) || [shortTermSentiment];
  const longTermSentiment = history.reduce((a, b) => a + b, 0) / history.length;

  return {
    sentimentDistribution,
    timeline,
    keywords,
    threatLevel,
    threatScore,
    shortTermSentiment: Number(shortTermSentiment.toFixed(1)),
    longTermSentiment: Number(longTermSentiment.toFixed(1)),
  };
}
