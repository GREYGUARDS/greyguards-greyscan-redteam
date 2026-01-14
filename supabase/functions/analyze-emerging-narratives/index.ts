import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const MentionSchema = z.object({
  text: z.string().max(5000),
  source: z.string().max(100).optional(),
}).passthrough();

const NarrativeSchema = z.object({
  title: z.string().max(200).optional(),
  type: z.string().max(50).optional(),
  severity: z.string().max(50).optional(),
}).passthrough();

const EmergingNarrativesInputSchema = z.object({
  brand: z.string().min(1).max(100),
  mentions: z.array(MentionSchema).max(100),
  mdmNarratives: z.array(NarrativeSchema).max(50).optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const parseResult = EmergingNarrativesInputSchema.safeParse(body);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ predictions: [], error: "Invalid input" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { brand, mentions, mdmNarratives } = parseResult.data;
    
    if (mentions.length === 0) {
      return new Response(
        JSON.stringify({ predictions: [], error: "No mentions provided" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ predictions: [], error: "Service configuration error" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare context from recent mentions (already limited by schema)
    const recentMentions = mentions.slice(0, 50);
    const mentionsContext = recentMentions
      .map((m: any, i: number) => `${i + 1}. [${m.source || 'unknown'}] ${m.text}`)
      .join("\n");

    // Include MDM context if available
    const mdmContext = mdmNarratives && mdmNarratives.length > 0
      ? `\n\nExisting MDM Narratives:\n${mdmNarratives.map((n: any) => `- ${n.title} (${n.type}, ${n.severity})`).join("\n")}`
      : "";

    const systemPrompt = `You are an expert in predictive narrative intelligence and forecasting. Your task is to analyze current mentions and identify emerging narratives - stories or themes that are BEGINNING to form but haven't yet reached critical mass.

Focus on:
1. Growing patterns in recent mentions (last 24-48 hours especially)
2. Early warning signals of potential narrative shifts
3. Weak signals that could amplify into major stories
4. Emerging connections between topics, entities, or events
5. Nascent trends that differ from established MDM narratives

For each emerging narrative:
1. Provide a clear predictive title (max 80 chars)
2. Explain the early indicators (2-3 sentences)
3. Assess confidence level (low/medium/high)
4. Estimate growth trajectory (declining/stable/growing/surging)
5. Identify key signals that support this prediction`;

    const userPrompt = `Brand: ${brand}

Recent Mentions (${recentMentions.length} total):
${mentionsContext}${mdmContext}

Identify up to 5 distinct EMERGING narratives from these mentions - focus on NEW patterns that are just beginning to form, not established stories. Return ONLY valid JSON in this exact format:
{
  "predictions": [
    {
      "title": "Brief predictive narrative title",
      "indicators": "2-3 sentence description of early warning signals",
      "confidence": "low" | "medium" | "high",
      "trajectory": "declining" | "stable" | "growing" | "surging",
      "signals": ["signal1", "signal2", "signal3"],
      "estimatedEmergence": "YYYY-MM-DD" (estimated date when this could peak),
      "mentionTrend": number (estimated % change in mentions over next 7 days, e.g., +45 or -20)
    }
  ]
}`;

    console.log("Analyzing emerging narratives for:", brand);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const errorId = crypto.randomUUID();
      console.error("AI gateway error:", { errorId, status: response.status, timestamp: new Date().toISOString() });
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable", errorId, predictions: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await response.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";
    
    console.log("AI response received:", aiContent.substring(0, 200));

    // Parse AI response - handle JSON wrapped in markdown code blocks
    let predictionsData;
    try {
      // Try direct parse first
      predictionsData = JSON.parse(aiContent);
    } catch {
      // Extract JSON from markdown code block if present
      const jsonMatch = aiContent.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        predictionsData = JSON.parse(jsonMatch[1]);
      } else {
        // Try to find JSON object in text
        const jsonStart = aiContent.indexOf('{');
        const jsonEnd = aiContent.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          predictionsData = JSON.parse(aiContent.substring(jsonStart, jsonEnd + 1));
        } else {
          throw new Error("No valid JSON found in AI response");
        }
      }
    }

    const predictions = predictionsData.predictions || [];
    console.log(`Identified ${predictions.length} emerging narratives`);

    return new Response(
      JSON.stringify({ predictions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error("Error in analyze-emerging-narratives:", { errorId, error: error instanceof Error ? error.message : "Unknown", timestamp: new Date().toISOString() });
    return new Response(
      JSON.stringify({ error: "An error occurred", errorId, predictions: [] }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
