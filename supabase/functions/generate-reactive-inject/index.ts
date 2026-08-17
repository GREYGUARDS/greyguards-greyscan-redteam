import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const InputSchema = z.object({
  brandName: z.string().min(1).max(100),
  scenarioTitle: z.string().max(200).optional(),
  scenarioNarrative: z.string().max(5000).optional(),
  previousInject: z.object({
    type: z.string().max(50).optional(),
    content: z.string().max(3000),
    source: z.string().max(200).optional(),
    sentiment: z.string().max(30).optional(),
  }),
  playerAction: z.string().min(1).max(2000),
  actionEffectiveness: z.number().min(0).max(100).optional(),
  actionFeedback: z.string().max(2000).optional(),
  narrativeControl: z.number().min(0).max(100).optional(),
  elapsedSeconds: z.number().min(0).max(7200).optional(),
  remainingSeconds: z.number().min(0).max(7200).optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Authentication required" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const parsed = InputSchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ inject: null, error: "Invalid input" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      brandName, scenarioTitle, scenarioNarrative, previousInject, playerAction,
      actionEffectiveness, actionFeedback, narrativeControl, elapsedSeconds, remainingSeconds,
    } = parsed.data;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ inject: null, error: "Service configuration error" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const effectiveness = actionEffectiveness ?? 55;
    const direction = effectiveness >= 70
      ? "The action largely worked: the hostile network should show friction, doubt, defections or a more balanced media framing — but it must not fully resolve the crisis."
      : effectiveness >= 50
        ? "The action was partially effective: the narrative continues but shifts angle, with some actors seizing on gaps in what was said."
        : "The action backfired or was too weak: hostile actors should quote it, mock it, or use it as fresh proof of the original claim.";

    const systemPrompt = `You are the adversary engine for a live crisis-simulation exercise about ${brandName}.
British English spelling throughout.

SCENARIO: ${scenarioTitle || "Coordinated disinformation campaign"}
${scenarioNarrative ? `NARRATIVE: ${scenarioNarrative}` : ""}

The most recent hostile inject was:
[${previousInject.type || "social_post"}] ${previousInject.source || "unknown"}: "${previousInject.content}"

The defending team just took THIS action:
"${playerAction}"
Assessed effectiveness: ${effectiveness}%${actionFeedback ? ` — ${actionFeedback}` : ""}
Current narrative control: ${narrativeControl ?? 50}%. Elapsed: ${elapsedSeconds ?? 0}s, remaining: ${remainingSeconds ?? 300}s.

Produce the SINGLE next inject that is a DIRECT CONSEQUENCE of that specific action. It must:
1. Explicitly react to what the team actually did — quote it, reference its wording, or exploit what it omitted.
2. Stay inside the same storyline as the previous inject (same claims, same actors).
3. ${direction}
4. Feel like real platform content (X/Twitter post with handle and hashtags, Reddit thread title, broadcast/news headline with outlet, leaked screenshot description, or bot-amplification report).
5. Offer 3 response options that make sense specifically for THIS new inject, with realistic effectiveness (no comment 20-40, legal threats 40-60, specific evidence-led rebuttal 70-85, credible third-party validation 75-90).

Return JSON only, shaped exactly:
{
  "inject": {
    "id": "string",
    "type": "social_post" | "news_article" | "influencer" | "official_response" | "leak" | "amplification",
    "content": "string",
    "source": "string",
    "reach": number,
    "sentiment": "hostile" | "confused" | "neutral",
    "isAggressive": boolean,
    "consequence": "one sentence stating how the team's action caused this",
    "responseOptions": [
      { "id": "string", "label": "string", "description": "string", "type": "statement" | "social_response" | "internal_action" | "media_outreach" | "legal" | "greyguards_service", "effectiveness": number, "riskLevel": "low" | "medium" | "high", "timeToExecute": number }
    ]
  }
}`;

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
          { role: "user", content: "Generate the next inject that reacts to the team's action." },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorId = crypto.randomUUID();
      console.error("AI gateway error:", { errorId, status: response.status });
      return new Response(
        JSON.stringify({ inject: null, error: "Service temporarily unavailable", errorId }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    if (!content) throw new Error("No content in AI response");

    const data = JSON.parse(content);
    const inject = data.inject ?? data;

    return new Response(JSON.stringify({ inject }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error("Error generating reactive inject:", { errorId, error: error instanceof Error ? error.message : "Unknown" });
    return new Response(
      JSON.stringify({ inject: null, error: "An error occurred", errorId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
