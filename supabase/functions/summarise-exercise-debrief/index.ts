import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DecisionInput {
  injectType?: string;
  responseLabel?: string;
  effectiveness?: number;
  responseTime?: number;
}

const buildFallback = (
  brandName: string,
  narrativeControl: number,
  decisions: DecisionInput[],
  avgResponseTime: number,
) => {
  if (decisions.length === 0) {
    return `No decisions were logged for ${brandName}, so there is nothing to assess yet. The single biggest gap is simply engagement — the exercise only tests you once you commit to an action against a live inject.`;
  }

  const scored = [...decisions].sort((a, b) => (b.effectiveness ?? 0) - (a.effectiveness ?? 0));
  const best = scored[0];
  const worst = scored[scored.length - 1];
  const avgEff = Math.round(
    decisions.reduce((sum, d) => sum + (d.effectiveness ?? 0), 0) / decisions.length,
  );

  const wentWell = `Your strongest move was "${best.responseLabel ?? "your chosen action"}" at ${Math.round(best.effectiveness ?? 0)}% — it engaged the claim directly rather than talking around it, and it is the pattern that held narrative control at ${Math.round(narrativeControl)}%.`;
  const gap = avgResponseTime > 45
    ? `The single biggest gap was speed: an average of ${Math.round(avgResponseTime)} seconds per decision gave the hostile network room to set the frame before you answered.`
    : avgEff < 60
      ? `The single biggest gap was substance: at an average of ${avgEff}% your actions leaned on general reassurance instead of evidence, and "${worst.responseLabel ?? "the weakest action"}" gave the attackers something to quote back.`
      : `The single biggest gap was consistency: "${worst.responseLabel ?? "your weakest action"}" at ${Math.round(worst.effectiveness ?? 0)}% broke the evidence-led line you had established elsewhere.`;

  return `${wentWell} ${gap}`;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let brandName = "the organisation";
  let narrativeControl = 50;
  let decisions: DecisionInput[] = [];
  let avgResponseTime = 0;

  try {
    const body = await req.json();
    brandName = typeof body?.brandName === "string" && body.brandName.trim() ? body.brandName.slice(0, 120) : brandName;
    narrativeControl = Number(body?.narrativeControl ?? 50);
    avgResponseTime = Number(body?.avgResponseTime ?? 0);
    decisions = Array.isArray(body?.decisions) ? body.decisions.slice(0, 30) : [];

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ summary: buildFallback(brandName, narrativeControl, decisions, avgResponseTime) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const timeline = decisions
      .map((d, i) =>
        `${i + 1}. [${d.injectType ?? "inject"}] action: "${(d.responseLabel ?? "").slice(0, 200)}" — ${Math.round(d.effectiveness ?? 0)}% effective, ${Math.round(d.responseTime ?? 0)}s to decide`,
      )
      .join("\n");

    const systemPrompt = `You are a crisis communications assessor writing the closing note of a Red Team disinformation exercise debrief for ${brandName}.
British English spelling. Direct, second person ("you"), no bullet points, no headings, no praise inflation, no sales pitch, and never mention Greyguards or any consultancy.

FINAL NARRATIVE CONTROL: ${Math.round(narrativeControl)}%
AVERAGE DECISION TIME: ${Math.round(avgResponseTime)}s
DECISIONS TAKEN:
${timeline || "(none)"}

Write 2-3 sentences total: first what genuinely went well (cite a specific action), then the single biggest gap and why it mattered. Return JSON: {"summary": "..."}`;

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
          { role: "user", content: "Write the closing assessment." },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      return new Response(
        JSON.stringify({ summary: buildFallback(brandName, narrativeControl, decisions, avgResponseTime) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    const parsed = content ? JSON.parse(content) : {};
    const summary = typeof parsed.summary === "string" && parsed.summary.trim().length > 20
      ? parsed.summary.trim()
      : buildFallback(brandName, narrativeControl, decisions, avgResponseTime);

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error summarising debrief:", error instanceof Error ? error.message : "Unknown");
    return new Response(
      JSON.stringify({ summary: buildFallback(brandName, narrativeControl, decisions, avgResponseTime) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
