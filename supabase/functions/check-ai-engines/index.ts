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

// ---------------------------------------------------------------------------
// Verifiable story sourcing: real, linkable articles inside a time window.
// Google News RSS supports "when:1h" style recency operators, so the URLs we
// hand back are genuine publisher links — never model-invented citations.
// ---------------------------------------------------------------------------
interface Story {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
}

function decode(input: string): string {
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchStories(brand: string, windowHours: number): Promise<Story[]> {
  const when = windowHours <= 1 ? "1h" : windowHours <= 6 ? "6h" : windowHours <= 12 ? "12h" : `${windowHours}h`;
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(`${brand} when:${when}`)}&hl=en-GB&gl=GB&ceid=GB:en`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; GreyscanBot/1.0)" },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) {
      console.warn("Story feed failed:", res.status);
      return [];
    }
    const xml = await res.text();
    const cutoff = Date.now() - windowHours * 3600 * 1000;
    const stories: Story[] = [];
    for (const block of xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || []) {
      const title = decode((block.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "");
      const link = decode((block.match(/<link[^>]*>([\s\S]*?)<\/link>/i) || [])[1] || "");
      const pub = decode((block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) || [])[1] || "");
      const source = decode((block.match(/<source[^>]*>([\s\S]*?)<\/source>/i) || [])[1] || "Google News");
      if (!title || !link) continue;
      const ts = pub ? new Date(pub).getTime() : Date.now();
      if (Number.isFinite(ts) && ts < cutoff) continue;
      stories.push({ title, url: link, source, publishedAt: new Date(Number.isFinite(ts) ? ts : Date.now()).toISOString() });
      if (stories.length >= 25) break;
    }
    return stories;
  } catch (error) {
    console.warn("Story fetch error:", error instanceof Error ? error.message : error);
    return [];
  }
}

const ASSESS_PROMPT = `You are a narrative intelligence analyst assessing news items about an organisation for reputational and MDM (mis/dis/mal-information) risk.
You are given a numbered list of REAL headlines. Never invent items or URLs — refer to items only by their number.
Return ONLY JSON, no markdown fences:
{"items":[{"i":<item number>,"angle":"one line on the narrative angle","mdmRisk":0-100,"mdmType":"Misinformation"|"Disinformation"|"Malinformation"|"None","verifiable":true|false,"note":"one short sentence on why this matters and what to verify"}],"summary":"2 sentences on the emerging narrative picture in this window"}
mdmRisk 0 = routine factual coverage, 100 = active coordinated falsehood. verifiable = the claim can be checked against a named primary source. Use UK English. Assess at most 12 items, prioritising the highest-risk ones.`;

async function assessStories(brand: string, stories: Story[], apiKey: string) {
  if (stories.length === 0) return { items: [], summary: "" };
  const list = stories.map((s, i) => `${i + 1}. [${s.source}] ${s.title}`).join("\n");
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: ASSESS_PROMPT },
          { role: "user", content: `Organisation: ${brand}\n\nHeadlines:\n${list}` },
        ],
        max_completion_tokens: 2200,
      }),
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) {
      console.error("Story assessment gateway error:", res.status, (await res.text()).slice(0, 300));
      return { items: [], summary: "" };
    }
    const data = await res.json();
    const raw = (data.choices?.[0]?.message?.content ?? "").replace(/```json|```/g, "").trim();
    const start = raw.indexOf("{");
    const parsed = start >= 0 ? JSON.parse(raw.slice(start, raw.lastIndexOf("}") + 1)) : null;
    const items = Array.isArray(parsed?.items) ? parsed.items : [];
    return { items, summary: typeof parsed?.summary === "string" ? parsed.summary : "" };
  } catch (error) {
    console.warn("Story assessment failed:", error instanceof Error ? error.message : error);
    return { items: [], summary: "" };
  }
}

async function buildStoryFeed(brand: string, windowHours: number, apiKey: string) {
  const stories = await fetchStories(brand, windowHours);
  const { items, summary } = await assessStories(brand, stories, apiKey);
  const byIndex = new Map<number, any>();
  for (const item of items) {
    const idx = Number(item?.i);
    if (Number.isFinite(idx)) byIndex.set(idx, item);
  }
  const enriched = stories.map((s, i) => {
    const a = byIndex.get(i + 1);
    const risk = Number(a?.mdmRisk);
    return {
      ...s,
      angle: typeof a?.angle === "string" ? a.angle.slice(0, 240) : "",
      mdmRisk: Number.isFinite(risk) ? Math.max(0, Math.min(100, Math.round(risk))) : null,
      mdmType: ["Misinformation", "Disinformation", "Malinformation", "None"].includes(a?.mdmType) ? a.mdmType : "None",
      verifiable: a?.verifiable === true,
      note: typeof a?.note === "string" ? a.note.slice(0, 300) : "",
      assessed: Boolean(a),
    };
  });
  enriched.sort((a, b) => (b.mdmRisk ?? -1) - (a.mdmRisk ?? -1));
  return { stories: enriched, storySummary: summary, windowHours, storyCount: enriched.length };
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
    const body = await req.json();
    const brand = body?.brand;
    if (!brand || typeof brand !== "string" || brand.length > 100) {
      return new Response(JSON.stringify({ error: "Invalid input", engines: [] }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const allowedWindows = [1, 6, 12, 24];
    const requested = Number(body?.windowHours);
    const windowHours = allowedWindows.includes(requested) ? requested : 6;
    // "stories" = story feed only (fast window switching), "engines" = model audit only
    const mode = body?.mode === "stories" || body?.mode === "engines" ? body.mode : "all";

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "Service configuration error", engines: [] }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Checking AI engine exposure for: ${brand} (mode=${mode}, window=${windowHours}h)`);

    const [engines, feed] = await Promise.all([
      mode === "stories" ? Promise.resolve([]) : Promise.all(ENGINES.map((e) => queryEngine(e, brand, apiKey))),
      mode === "engines"
        ? Promise.resolve({ stories: [], storySummary: "", windowHours, storyCount: 0 })
        : buildStoryFeed(brand, windowHours, apiKey),
    ]);

    const usable = (engines as any[]).filter((e) => !e.unavailable);
    console.log(`AI engines answered: ${usable.length}/${engines.length}; stories: ${feed.storyCount}`);

    return new Response(JSON.stringify({ engines, ...feed, checkedAt: new Date().toISOString() }), {
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
