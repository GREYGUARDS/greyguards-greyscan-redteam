import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

// Threat-pattern queries: we look for emerging mis/dis/mal-information activity
// generally, then work out which organisations are caught in it.
const PATTERNS: Record<string, string[]> = {
  disinformation: [
    "\"disinformation campaign\" company",
    "\"false claims\" brand statement",
    "\"coordinated campaign\" boycott brand",
  ],
  deepfake: [
    "deepfake CEO scam",
    "\"AI-generated\" fake advert brand",
  ],
  boycott: [
    "boycott campaign brand backlash",
    "\"viral post\" false brand accusation",
  ],
  fraud: [
    "\"impersonating\" brand scam customers",
    "fake website impersonation company warning",
  ],
};

interface Article {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  pattern: string;
}

function decode(input: string): string {
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, "&")
    .replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

async function googleNews(query: string, windowHours: number, pattern: string): Promise<Article[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(`${query} when:${windowHours}h`)}&hl=en-GB&gl=GB&ceid=GB:en`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": BROWSER_UA, Accept: "application/rss+xml, application/xml, text/xml" },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const out: Article[] = [];
    for (const block of xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || []) {
      const title = decode((block.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "");
      const link = decode((block.match(/<link[^>]*>([\s\S]*?)<\/link>/i) || [])[1] || "");
      const pub = decode((block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) || [])[1] || "");
      const source = decode((block.match(/<source[^>]*>([\s\S]*?)<\/source>/i) || [])[1] || "Google News");
      if (!title || !link) continue;
      const ts = pub ? new Date(pub).getTime() : Date.now();
      out.push({ title, url: link, source, publishedAt: new Date(Number.isFinite(ts) ? ts : Date.now()).toISOString(), pattern });
      if (out.length >= 12) break;
    }
    return out;
  } catch (error) {
    console.warn("Google News sweep failed:", error instanceof Error ? error.message : error);
    return [];
  }
}

async function gdelt(query: string, windowHours: number, pattern: string): Promise<Article[]> {
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(`${query} sourcelang:english`)}` +
    `&mode=ArtList&maxrecords=12&format=json&sort=DateDesc&timespan=${windowHours}h`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": BROWSER_UA }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return [];
    const text = await res.text();
    let data: any;
    try { data = JSON.parse(text); } catch { return []; }
    return (data.articles || [])
      .filter((a: any) => a?.title && a?.url)
      .map((a: any) => {
        const m = String(a.seendate || "").match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
        return {
          title: decode(String(a.title)),
          url: String(a.url),
          source: String(a.domain || "GDELT"),
          publishedAt: m
            ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6])).toISOString()
            : new Date().toISOString(),
          pattern,
        } as Article;
      })
      .slice(0, 12);
  } catch (error) {
    console.warn("GDELT sweep failed:", error instanceof Error ? error.message : error);
    return [];
  }
}

const ANALYSE_PROMPT = `You are a narrative intelligence analyst running a prospecting sweep. You receive REAL headlines found by searching for mis/dis/mal-information threat patterns. Your job is to identify which named ORGANISATIONS or BRANDS are the subject or target of an emerging narrative threat, so a consultancy can approach them.
Return ONLY JSON, no markdown fences:
{"prospects":[{"organisation":"name","sector":"short sector label","threatType":"Misinformation"|"Disinformation"|"Malinformation"|"Deepfake"|"Impersonation"|"Coordinated boycott","severity":0-100,"summary":"2 sentences on the emerging threat in UK English","approachAngle":"one sentence on the offer/angle to approach them with","items":[<headline numbers>]}],"sweepSummary":"2 sentences on the overall threat picture"}
Rules: only include an organisation if it is clearly named and clearly implicated as a target or subject of a narrative threat. Ignore governments, political parties and generic mentions in passing. Never invent organisations, headlines or URLs. severity reflects urgency and reputational exposure. Return at most 10 prospects, highest severity first.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Admin-only: this is a private prospecting tool.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email || user.is_anonymous) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: adminRow } = await supabase
      .from("app_admins").select("email").eq("email", user.email.toLowerCase()).maybeSingle();
    if (!adminRow) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const allowedWindows = [6, 12, 24, 48, 72];
    const requested = Number(body?.windowHours);
    const windowHours = allowedWindows.includes(requested) ? requested : 24;
    const requestedPatterns: string[] = Array.isArray(body?.patterns)
      ? body.patterns.filter((p: unknown) => typeof p === "string" && p in PATTERNS)
      : Object.keys(PATTERNS);
    const patterns = requestedPatterns.length ? requestedPatterns : Object.keys(PATTERNS);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Service configuration error" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Prospect radar sweep: patterns=${patterns.join(",")} window=${windowHours}h`);

    const jobs: Promise<Article[]>[] = [];
    for (const pattern of patterns) {
      for (const query of PATTERNS[pattern]) {
        jobs.push(googleNews(query, windowHours, pattern));
        jobs.push(gdelt(query, windowHours, pattern));
      }
    }
    const results = await Promise.all(jobs);

    const seen = new Set<string>();
    const articles: Article[] = [];
    for (const a of results.flat()) {
      const key = a.title.toLowerCase().slice(0, 90);
      if (seen.has(key)) continue;
      seen.add(key);
      articles.push(a);
    }
    articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    const shortlist = articles.slice(0, 60);

    if (shortlist.length === 0) {
      return new Response(JSON.stringify({
        prospects: [], sweepSummary: "No qualifying threat signals found in this window.",
        articleCount: 0, windowHours, sweptAt: new Date().toISOString(),
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const list = shortlist.map((a, i) => `${i + 1}. [${a.source} · ${a.pattern}] ${a.title}`).join("\n");
    let prospects: any[] = [];
    let sweepSummary = "";
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: ANALYSE_PROMPT },
            { role: "user", content: `Headlines:\n${list}` },
          ],
          max_completion_tokens: 3000,
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (res.ok) {
        const data = await res.json();
        const raw = (data.choices?.[0]?.message?.content ?? "").replace(/```json|```/g, "").trim();
        const start = raw.indexOf("{");
        const parsed = start >= 0 ? JSON.parse(raw.slice(start, raw.lastIndexOf("}") + 1)) : null;
        prospects = Array.isArray(parsed?.prospects) ? parsed.prospects : [];
        sweepSummary = typeof parsed?.sweepSummary === "string" ? parsed.sweepSummary : "";
      } else {
        console.error("Sweep analysis gateway error:", res.status, (await res.text()).slice(0, 300));
      }
    } catch (error) {
      console.warn("Sweep analysis failed:", error instanceof Error ? error.message : error);
    }

    const shaped = prospects.slice(0, 10).map((p: any) => {
      const idx: number[] = Array.isArray(p?.items) ? p.items.map(Number).filter(Number.isFinite) : [];
      const severity = Number(p?.severity);
      return {
        organisation: String(p?.organisation || "Unknown").slice(0, 120),
        sector: String(p?.sector || "").slice(0, 60),
        threatType: String(p?.threatType || "Misinformation").slice(0, 40),
        severity: Number.isFinite(severity) ? Math.max(0, Math.min(100, Math.round(severity))) : 0,
        summary: String(p?.summary || "").slice(0, 600),
        approachAngle: String(p?.approachAngle || "").slice(0, 400),
        sources: idx
          .map((i) => shortlist[i - 1])
          .filter(Boolean)
          .slice(0, 5)
          .map((a) => ({ title: a.title, url: a.url, source: a.source, publishedAt: a.publishedAt })),
      };
    }).filter((p) => p.organisation !== "Unknown" && p.sources.length > 0)
      .sort((a, b) => b.severity - a.severity);

    return new Response(JSON.stringify({
      prospects: shaped,
      sweepSummary,
      articleCount: shortlist.length,
      windowHours,
      sweptAt: new Date().toISOString(),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error("Error in prospect-radar-sweep:", { errorId, error: error instanceof Error ? error.message : "Unknown" });
    return new Response(JSON.stringify({ error: "An error occurred", errorId, prospects: [] }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
