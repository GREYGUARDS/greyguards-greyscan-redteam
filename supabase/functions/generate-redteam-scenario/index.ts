import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const ScenarioInputSchema = z.object({
  brandName: z.string().min(1).max(100),
  duration: z.number().min(1).max(60),
  userScenario: z.string().max(5000).optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const parseResult = ScenarioInputSchema.safeParse(body);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { brandName, duration, userScenario } = parseResult.data;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ 
          error: "Service configuration error",
          title: "Executive Misconduct Allegations",
          narrative: "Anonymous sources have begun circulating unverified claims about senior leadership. The campaign appears coordinated.",
          basedOnTruth: false,
          implicatedParties: ["[REDACTED - Executive]"],
          severity: "severe",
          spreadPattern: "coordinated"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are an expert in crisis communications, disinformation campaigns, and brand reputation management. Your role is to create realistic but fictional crisis scenarios for training exercises.

Generate a detailed disinformation scenario targeting "${brandName}". The scenario should be:
- Realistic and plausible
- Based on common disinformation tactics (mixing truth with lies, emotional manipulation, coordinated amplification)
- Challenging but not impossible to counter
- Appropriate for a ${duration}-minute crisis simulation exercise

Return a JSON object with these exact fields:
- title: A concise, impactful title for the scenario
- narrative: A 2-3 paragraph description of the disinformation campaign, including how it started, what's being claimed, and how it's spreading
- basedOnTruth: Boolean - whether the narrative contains any real/true elements that are being twisted
- truthElement: If basedOnTruth is true, explain what the kernel of truth is
- implicatedParties: Array of 2-3 names/roles (use generic titles like "[REDACTED - Senior Executive]" instead of real names)
- severity: "moderate", "severe", or "critical"
- spreadPattern: "viral" (organic fast spread), "coordinated" (bot/troll farm), or "organic" (slow natural spread)`;

    const userPrompt = userScenario 
      ? `The user has provided this scenario outline. Enhance and professionalize it while keeping the core concept:\n\n"${userScenario}"\n\nMake it more realistic with specific details, spreading patterns, and implicated parties.`
      : `Create a completely original disinformation scenario targeting ${brandName}. Be creative but realistic. Consider common attack vectors like executive misconduct allegations, product safety concerns, data breaches, environmental violations, or financial impropriety.`;

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
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorId = crypto.randomUUID();
      console.error("AI gateway error:", { errorId, status: response.status, timestamp: new Date().toISOString() });
      return new Response(
        JSON.stringify({ 
          error: "Service temporarily unavailable",
          errorId,
          title: "Executive Misconduct Allegations",
          narrative: "Anonymous sources have begun circulating unverified claims about senior leadership. The campaign appears coordinated.",
          basedOnTruth: false,
          implicatedParties: ["[REDACTED - Executive]"],
          severity: "severe",
          spreadPattern: "coordinated"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in AI response");
    }

    const scenario = JSON.parse(content);

    return new Response(JSON.stringify(scenario), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error("Error generating scenario:", { errorId, error: error instanceof Error ? error.message : "Unknown", timestamp: new Date().toISOString() });
    return new Response(
      JSON.stringify({ 
        error: "An error occurred",
        errorId,
        title: "Executive Misconduct Allegations",
        narrative: "Anonymous sources have begun circulating unverified claims about senior leadership. The campaign appears coordinated.",
        basedOnTruth: false,
        implicatedParties: ["[REDACTED - Executive]"],
        severity: "severe",
        spreadPattern: "coordinated"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
