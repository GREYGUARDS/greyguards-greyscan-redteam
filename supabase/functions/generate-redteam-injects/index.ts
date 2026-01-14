import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const ScenarioSchema = z.object({
  title: z.string().max(200),
  narrative: z.string().max(5000),
  severity: z.string().max(50),
}).passthrough();

const InjectsInputSchema = z.object({
  scenario: ScenarioSchema,
  brandName: z.string().min(1).max(100),
  duration: z.number().min(1).max(60),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const parseResult = InjectsInputSchema.safeParse(body);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ injects: [], error: "Invalid input" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { scenario, brandName, duration } = parseResult.data;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ injects: [], error: "Service configuration error" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const totalSeconds = duration * 60;
    const numInjects = Math.min(Math.floor(duration / 2), 10);

    const systemPrompt = `You are creating crisis simulation injects for a ${duration}-minute exercise. The scenario is:

Title: ${scenario.title}
Narrative: ${scenario.narrative}
Severity: ${scenario.severity}
Brand: ${brandName}

Generate ${numInjects} realistic crisis injects that escalate throughout the exercise. Each inject should:
- Have a timestamp (in seconds from start, spread evenly but not too predictably)
- Represent realistic social media posts, news articles, influencer mentions, leaks, or coordinated amplification
- Include 3 response options with varying effectiveness
- Some should be aggressive (marked isAggressive: true) to increase pressure

Return a JSON object with an "injects" array. Each inject should have:
- id: unique string
- timestamp: number (seconds from start, ranging from 15 to ${totalSeconds - 60})
- type: "social_post" | "news_article" | "influencer" | "official_response" | "leak" | "amplification"
- content: the inject content (realistic social post, headline, etc.)
- source: who posted it (e.g., "@AnonymousTipper (50K followers)")
- reach: number (estimated reach)
- sentiment: "hostile" | "confused" | "neutral"
- requiresResponse: true
- isAggressive: boolean
- responseOptions: array of 3 options, each with:
  - id: unique string
  - label: short action name
  - description: what this response involves
  - type: "statement" | "social_response" | "internal_action" | "media_outreach" | "legal" | "greyguards_service"
  - effectiveness: 0-100
  - riskLevel: "low" | "medium" | "high"
  - timeToExecute: seconds

Make the exercise progressively more challenging. Include at least one "greyguards_service" response option to subtly promote Greyguards capabilities.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate ${numInjects} crisis injects for this ${duration}-minute exercise targeting ${brandName}.` }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorId = crypto.randomUUID();
      console.error("AI gateway error:", { errorId, status: response.status, timestamp: new Date().toISOString() });
      return new Response(
        JSON.stringify({ injects: [], error: "Service temporarily unavailable", errorId }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in AI response");
    }

    const injectsData = JSON.parse(content);

    return new Response(JSON.stringify(injectsData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error("Error generating injects:", { errorId, error: error instanceof Error ? error.message : "Unknown", timestamp: new Date().toISOString() });
    
    return new Response(
      JSON.stringify({ injects: [], error: "An error occurred", errorId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
