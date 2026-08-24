import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

// ---------------------------------------------------------------------------
// Regions: drive Google News editions and GDELT country filters
// ---------------------------------------------------------------------------
interface RegionConfig {
  label: string;
  editions: { hl: string; gl: string; ceid: string }[];
  gdeltCountries: string[];
  hint: string;
}

const REGIONS: Record<string, RegionConfig> = {
  uk: {
    label: "United Kingdom & Ireland",
    editions: [{ hl: "en-GB", gl: "GB", ceid: "GB:en" }, { hl: "en-IE", gl: "IE", ceid: "IE:en" }],
    gdeltCountries: ["UK", "EI"],
    hint: "UK and Irish press, broadcast, regional titles and UK-facing social platforms.",
  },
  europe: {
    label: "Europe",
    editions: [
      { hl: "en-GB", gl: "DE", ceid: "DE:en" },
      { hl: "en-GB", gl: "FR", ceid: "FR:en" },
      { hl: "en-GB", gl: "NL", ceid: "NL:en" },
    ],
    gdeltCountries: ["GM", "FR", "IT", "SP", "NL", "PL", "SW", "EZ", "BE"],
    hint: "Continental European press including German, French, Nordic, Benelux and Central European titles.",
  },
  middle_east: {
    label: "Middle East & North Africa",
    editions: [
      { hl: "en-AE", gl: "AE", ceid: "AE:en" },
      { hl: "en-EG", gl: "EG", ceid: "EG:en" },
      { hl: "en-IL", gl: "IL", ceid: "IL:en" },
    ],
    gdeltCountries: ["AE", "SA", "IS", "EG", "QA", "KU", "JO", "LE", "TU", "MO"],
    hint: "Gulf, Levant and North African press plus regional broadcasters and diaspora social channels.",
  },
  north_america: {
    label: "North America",
    editions: [{ hl: "en-US", gl: "US", ceid: "US:en" }, { hl: "en-CA", gl: "CA", ceid: "CA:en" }],
    gdeltCountries: ["US", "CA"],
    hint: "US and Canadian national and regional press, cable news and high-velocity US social platforms.",
  },
};

// ---------------------------------------------------------------------------
// Entity scopes: who we are looking for, not just brands
// ---------------------------------------------------------------------------
interface ScopeConfig {
  label: string;
  terms: string[];
  guidance: string;
}

const SCOPES: Record<string, ScopeConfig> = {
  brands: {
    label: "Brands & companies",
    terms: ["company", "brand", "retailer", "bank"],
    guidance: "commercial companies, brands, retailers, banks, insurers and listed corporates",
  },
  institutions: {
    label: "Institutions",
    terms: ["hospital", "university", "regulator", "charity"],
    guidance: "hospitals and health trusts, universities, schools, regulators, charities and professional bodies",
  },
  governments: {
    label: "Governments & agencies",
    terms: ["government department", "ministry", "agency", "council", "police force"],
    guidance: "government departments, ministries, national agencies, councils, police and defence bodies",
  },
  international: {
    label: "International bodies",
    terms: ["ICRC", "Red Cross", "United Nations", "WHO", "UNHCR", "NATO", "European Commission", "humanitarian agency"],
    guidance:
      "international and multilateral bodies such as the ICRC, UN agencies, WHO, UNHCR, NATO, the EU institutions, the World Bank and major NGOs",
  },
};

// Threat-pattern queries: emerging mis/dis/mal-information activity in general.
const PATTERNS: Record<string, string[]> = {
  disinformation: [
    "\"disinformation campaign\"",
    "\"false claims\" statement denies",
    "\"coordinated campaign\" backlash",
  ],
  deepfake: ["deepfake video fake statement", "\"AI-generated\" fake footage"],
  boycott: ["boycott campaign backlash", "\"viral post\" false accusation"],
  fraud: ["\"impersonating\" scam warning", "fake website impersonation warning"],
};

interface Article {
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  pattern: string;
  region: string;
  channel: string;
}

function decode(input: string): string {
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, "&")
    .replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

async function googleNews(
  query: string,
  windowHours: number,
  pattern: string,
  region: string,
  edition: { hl: string; gl: string; ceid: string },
): Promise<Article[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(`${query} when:${windowHours}h`)}` +
    `&hl=${edition.hl}&gl=${edition.gl}&ceid=${edition.ceid}`;
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
      out.push({
        title, url: link, source,
        publishedAt: new Date(Number.isFinite(ts) ? ts : Date.now()).toISOString(),
        pattern, region, channel: "press",
      });
      if (out.length >= 10) break;
    }
    return out;
  } catch (error) {
    console.warn("Google News sweep failed:", error instanceof Error ? error.message : error);
    return [];
  }
}

async function gdelt(
  query: string,
  windowHours: number,
  pattern: string,
  region: string,
  countries: string[],
): Promise<Article[]> {
  const countryFilter = countries.length
    ? `(${countries.map((c) => `sourcecountry:${c}`).join(" OR ")})`
    : "";
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(`${query} sourcelang:english ${countryFilter}`.trim())}` +
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
          pattern, region, channel: "global media",
        } as Article;
      })
      .slice(0, 12);
  } catch (error) {
    console.warn("GDELT sweep failed:", error instanceof Error ? error.message : error);
    return [];
  }
}

// Public social/forum discussion sweep (no API key required).
async function redditSearch(query: string, windowHours: number, pattern: string, region: string): Promise<Article[]> {
  const t = windowHours <= 24 ? "day" : "week";
  const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=new&t=${t}&limit=15`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": BROWSER_UA }, signal: AbortSignal.timeout(12000) });
    if (!res.ok) return [];
    const data = await res.json();
    const cutoff = Date.now() - windowHours * 3600 * 1000;
    return (data?.data?.children || [])
      .map((c: any) => c?.data)
      .filter((d: any) => d?.title && d?.permalink && (d.created_utc || 0) * 1000 >= cutoff)
      .map((d: any) => ({
        title: decode(String(d.title)),
        url: `https://www.reddit.com${d.permalink}`,
        source: `r/${d.subreddit || "reddit"}`,
        publishedAt: new Date((d.created_utc || Date.now() / 1000) * 1000).toISOString(),
        pattern, region, channel: "social",
      } as Article))
      .slice(0, 8);
  } catch (error) {
    console.warn("Reddit sweep failed:", error instanceof Error ? error.message : error);
    return [];
  }
}

// Bluesky public search — open AppView, no auth required.
async function blueskySearch(query: string, windowHours: number, pattern: string, region: string): Promise<Article[]> {
  const since = new Date(Date.now() - windowHours * 3600 * 1000).toISOString();
  const url = `https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(query)}&limit=15&sort=latest&since=${encodeURIComponent(since)}`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": BROWSER_UA }, signal: AbortSignal.timeout(12000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.posts || [])
      .filter((p: any) => p?.record?.text)
      .map((p: any) => ({
        title: decode(String(p.record.text)).slice(0, 220),
        url: `https://bsky.app/profile/${p.author?.handle}/post/${String(p.uri).split("/").pop()}`,
        source: `@${p.author?.handle || "bsky"}`,
        publishedAt: p.record?.createdAt || new Date().toISOString(),
        pattern, region, channel: "social",
      } as Article))
      .slice(0, 8);
  } catch (error) {
    console.warn("Bluesky sweep failed:", error instanceof Error ? error.message : error);
    return [];
  }
}

const ANALYSE_PROMPT = (regionLabels: string, scopeGuidance: string, hints: string) =>
  `You are a narrative intelligence analyst running a prospecting sweep for a UK consultancy. You receive REAL headlines and social posts found by searching mis/dis/mal-information threat patterns across ${regionLabels}.
Regional context: ${hints}
Identify named ENTITIES that are the subject or target of an emerging narrative threat. In scope: ${scopeGuidance}.
Return ONLY JSON, no markdown fences:
{"prospects":[{"organisation":"name","entityType":"Brand"|"Institution"|"Government"|"International body","sector":"short sector label","region":"UK"|"Europe"|"Middle East"|"North America"|"Global","threatType":"Misinformation"|"Disinformation"|"Malinformation"|"Deepfake"|"Impersonation"|"Coordinated boycott","severity":0-100,"summary":"2 sentences on the emerging threat in UK English","approachAngle":"one sentence on the offer/angle to approach them with","wideSignals":["1-3 short lines on where else this is likely spreading (platforms, diaspora media, closed channels) that our APIs do not cover"],"precedent":"one sentence naming a comparable past event and what happened next","evolution":[{"horizon":"24-72h"|"1-2 weeks"|"1 month+","likelihood":"low"|"medium"|"high","development":"one sentence on how the narrative is likely to evolve"}],"items":[<headline numbers>]}],"sweepSummary":"3 sentences on the overall threat picture across the selected regions"}
Rules: only include an entity if it is clearly named and clearly implicated as a target or subject of a narrative threat. Ignore political parties and generic passing mentions. Never invent entities, headlines or URLs — but you MAY use your own knowledge of the wider information environment and of historical precedent for the wideSignals, precedent and evolution fields, clearly framed as assessment rather than fact. UK English throughout. Return at most 12 prospects, highest severity first.`;

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
    const allowedWindows = [6, 12, 24, 48, 72, 168];
    const requested = Number(body?.windowHours);
    const windowHours = allowedWindows.includes(requested) ? requested : 24;

    const requestedPatterns: string[] = Array.isArray(body?.patterns)
      ? body.patterns.filter((p: unknown) => typeof p === "string" && (p as string) in PATTERNS)
      : Object.keys(PATTERNS);
    const patterns = requestedPatterns.length ? requestedPatterns : Object.keys(PATTERNS);

    const requestedRegions: string[] = Array.isArray(body?.regions)
      ? body.regions.filter((r: unknown) => typeof r === "string" && (r as string) in REGIONS)
      : ["uk"];
    const regions = requestedRegions.length ? requestedRegions : ["uk"];

    const requestedScopes: string[] = Array.isArray(body?.scopes)
      ? body.scopes.filter((s: unknown) => typeof s === "string" && (s as string) in SCOPES)
      : Object.keys(SCOPES);
    const scopes = requestedScopes.length ? requestedScopes : Object.keys(SCOPES);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Service configuration error" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(
      `Prospect radar sweep: patterns=${patterns.join(",")} regions=${regions.join(",")} scopes=${scopes.join(",")} window=${windowHours}h`,
    );

    // Build the query matrix: pattern x scope-term x region channel.
    const scopeTerms = scopes.flatMap((s) => SCOPES[s].terms).slice(0, 10);
    const jobs: Promise<Article[]>[] = [];
    for (const region of regions) {
      const cfg = REGIONS[region];
      for (const pattern of patterns) {
        for (const base of PATTERNS[pattern]) {
          for (const edition of cfg.editions.slice(0, 2)) {
            jobs.push(googleNews(base, windowHours, pattern, region, edition));
          }
          jobs.push(gdelt(base, windowHours, pattern, region, cfg.gdeltCountries));
        }
        // Scope-flavoured queries widen beyond generic brand language.
        for (const term of scopeTerms.slice(0, 6)) {
          const q = `${PATTERNS[pattern][0]} ${term}`;
          jobs.push(googleNews(q, windowHours, pattern, region, cfg.editions[0]));
        }
      }
    }
    // Social / forum layer (region-agnostic, deduped later).
    for (const pattern of patterns) {
      for (const base of PATTERNS[pattern].slice(0, 2)) {
        jobs.push(redditSearch(base, windowHours, pattern, regions[0]));
        jobs.push(blueskySearch(base, windowHours, pattern, regions[0]));
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
    const shortlist = articles.slice(0, 90);

    const regionLabels = regions.map((r) => REGIONS[r].label).join(", ");
    const hints = regions.map((r) => REGIONS[r].hint).join(" ");
    const scopeGuidance = scopes.map((s) => SCOPES[s].guidance).join("; ");

    if (shortlist.length === 0) {
      return new Response(JSON.stringify({
        prospects: [], sweepSummary: "No qualifying threat signals found in this window.",
        articleCount: 0, windowHours, regions, scopes, sweptAt: new Date().toISOString(),
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const list = shortlist
      .map((a, i) => `${i + 1}. [${a.source} · ${a.channel} · ${REGIONS[a.region]?.label || a.region} · ${a.pattern}] ${a.title}`)
      .join("\n");

    let prospects: any[] = [];
    let sweepSummary = "";
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: ANALYSE_PROMPT(regionLabels, scopeGuidance, hints) },
            { role: "user", content: `Signals:\n${list}` },
          ],
          max_completion_tokens: 6000,
        }),
        signal: AbortSignal.timeout(60000),
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

    const shaped = prospects.slice(0, 12).map((p: any) => {
      const idx: number[] = Array.isArray(p?.items) ? p.items.map(Number).filter(Number.isFinite) : [];
      const severity = Number(p?.severity);
      return {
        organisation: String(p?.organisation || "Unknown").slice(0, 140),
        entityType: String(p?.entityType || "Brand").slice(0, 40),
        sector: String(p?.sector || "").slice(0, 60),
        region: String(p?.region || "").slice(0, 40),
        threatType: String(p?.threatType || "Misinformation").slice(0, 40),
        severity: Number.isFinite(severity) ? Math.max(0, Math.min(100, Math.round(severity))) : 0,
        summary: String(p?.summary || "").slice(0, 600),
        approachAngle: String(p?.approachAngle || "").slice(0, 400),
        wideSignals: (Array.isArray(p?.wideSignals) ? p.wideSignals : [])
          .slice(0, 3).map((s: unknown) => String(s).slice(0, 260)),
        precedent: String(p?.precedent || "").slice(0, 400),
        evolution: (Array.isArray(p?.evolution) ? p.evolution : []).slice(0, 3).map((e: any) => ({
          horizon: String(e?.horizon || "").slice(0, 30),
          likelihood: ["low", "medium", "high"].includes(String(e?.likelihood))
            ? String(e.likelihood) : "medium",
          development: String(e?.development || "").slice(0, 320),
        })).filter((e: any) => e.development),
        sources: idx
          .map((i) => shortlist[i - 1])
          .filter(Boolean)
          .slice(0, 6)
          .map((a) => ({
            title: a.title, url: a.url, source: a.source,
            publishedAt: a.publishedAt, channel: a.channel,
          })),
      };
    }).filter((p) => p.organisation !== "Unknown" && p.sources.length > 0)
      .sort((a, b) => b.severity - a.severity);

    return new Response(JSON.stringify({
      prospects: shaped,
      sweepSummary,
      articleCount: shortlist.length,
      channelCounts: {
        press: shortlist.filter((a) => a.channel === "press").length,
        global: shortlist.filter((a) => a.channel === "global media").length,
        social: shortlist.filter((a) => a.channel === "social").length,
      },
      windowHours,
      regions,
      scopes,
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
