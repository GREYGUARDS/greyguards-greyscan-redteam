import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Each entry is a real model queried live through the Lovable AI gateway.
const ENGINES = [
  { label: "Gemini 2.5 Flash", model: "google/gemini-2.5-flash" },
  { label: "GPT-5 Mini", model: "openai/gpt-5-mini" },
  { label: "Gemini 2.5 Flash Lite", model: "google/gemini-2.5-flash-lite" },
];

const SYSTEM_PROMPT = `You are auditing what large language models say about an organisation when asked about it by the public.
Answer ONLY with JSON, no markdown fences, in this exact shape:
{"narrative":"2-3 sentences summarising what you would tell a user who asked about this organisation, including any criticism, controversy or negative framing you associate with it","riskScore":0-10,"trend":"Stable"|"Escalating"|"De-escalating","sourcesKnown":["short source or topic labels"]}
riskScore reflects reputational risk in what you say (0 = wholly positive/neutral, 10 = severe). Use UK English. If you know nothing about the organisation, say so plainly and set riskScore to 0.`;

async function queryEngine(engine: typeof ENGINES[0], brand: string, apiKey: string) {
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: engine.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Organisation: ${brand}. What do you say about it, and what negative narratives do you associate with it?` },
        ],
        max_completion_tokens: 1600,
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!res.ok) {
      const detail = (await res.text()).slice(0, 300);
      console.error(`AI gateway error for ${engine.model}:`, res.status, detail);
      return { engine: engine.label, model: engine.model, unavailable: true, status: res.status };
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const jsonStart = cleaned.indexOf("{");
    const parsed = jsonStart >= 0 ? JSON.parse(cleaned.slice(jsonStart, cleaned.lastIndexOf("}") + 1)) : null;

    if (!parsed?.narrative) {
      console.warn(`${engine.label} returned unparsable content:`, raw.slice(0, 200));
      return { engine: engine.label, model: engine.model, unavailable: true };
    }

    const score = Number(parsed.riskScore);
    return {
      engine: engine.label,
      model: engine.model,
      narrative: String(parsed.narrative).slice(0, 900),
      riskScore: Number.isFinite(score) ? Math.max(0, Math.min(10, Math.round(score))) : 0,
      trend: ["Stable", "Escalating", "De-escalating"].includes(parsed.trend) ? parsed.trend : "Stable",
      sourcesKnown: Array.isArray(parsed.sourcesKnown) ? parsed.sourcesKnown.slice(0, 6).map(String) : [],
    };
  } catch (error) {
    console.warn(`${engine.label} failed:`, error instanceof Error ? error.message : error);
    return { engine: engine.label, model: engine.model, unavailable: true };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { brand } = await req.json();
    if (!brand || typeof brand !== "string" || brand.length > 100) {
      return new Response(JSON.stringify({ error: "Invalid input", engines: [] }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "Service configuration error", engines: [] }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Checking AI engine exposure for:", brand);
    const engines = await Promise.all(ENGINES.map((e) => queryEngine(e, brand, apiKey)));
    const usable = engines.filter((e: any) => !e.unavailable);
    console.log(`AI engines answered: ${usable.length}/${ENGINES.length}`);

    return new Response(JSON.stringify({ engines, checkedAt: new Date().toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error("Error in check-ai-engines:", { errorId, error: error instanceof Error ? error.message : "Unknown" });
    return new Response(JSON.stringify({ error: "An error occurred", errorId, engines: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
