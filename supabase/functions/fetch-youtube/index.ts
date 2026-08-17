import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Public Piped instances expose YouTube search with no API key required.
const PIPED_HOSTS = [
  "https://pipedapi.kavin.rocks",
  "https://api.piped.private.coffee",
  "https://pipedapi.adminforge.de",
  "https://pipedapi.drgns.space",
];

function relativeToDate(text: string | undefined): string {
  if (!text) return new Date().toISOString();
  const m = text.match(/(\d+)\s+(second|minute|hour|day|week|month|year)/i);
  if (!m) return new Date().toISOString();
  const n = parseInt(m[1], 10);
  const unitMs: Record<string, number> = {
    second: 1000,
    minute: 60000,
    hour: 3600000,
    day: 86400000,
    week: 604800000,
    month: 2592000000,
    year: 31536000000,
  };
  return new Date(Date.now() - n * (unitMs[m[2].toLowerCase()] || 0)).toISOString();
}

async function searchPiped(brand: string) {
  for (const host of PIPED_HOSTS) {
    try {
      const url = `${host}/search?q=${encodeURIComponent(brand)}&filter=videos`;
      const res = await fetch(url, {
        headers: { Accept: "application/json", "User-Agent": "greyscan/1.0" },
        signal: AbortSignal.timeout(9000),
      });
      if (!res.ok) {
        console.warn(`Piped ${host} returned ${res.status}`);
        continue;
      }
      const data = await res.json();
      const items = (data.items || data || []).filter((i: any) => i?.title);
      if (items.length === 0) continue;

      return items.slice(0, 25).map((i: any) => ({
        title: i.title,
        text: `${i.title} ${i.shortDescription || i.description || ""}`.trim(),
        url: i.url ? `https://www.youtube.com${i.url}` : undefined,
        channel: i.uploaderName || i.uploader || "Unknown channel",
        views: typeof i.views === "number" ? i.views : 0,
        publishedAt: i.uploaded && i.uploaded > 0
          ? new Date(i.uploaded).toISOString()
          : relativeToDate(i.uploadedDate),
      }));
    } catch (error) {
      console.warn(`Piped ${host} error:`, error instanceof Error ? error.message : error);
    }
  }
  return null;
}

// Fallback: parse ytInitialData out of the public results page (no key, no auth).
async function scrapeYouTube(brand: string) {
  const res = await fetch(
    `https://www.youtube.com/results?search_query=${encodeURIComponent(brand)}&sp=CAI%253D`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        "Accept-Language": "en-GB,en;q=0.9",
      },
      signal: AbortSignal.timeout(10000),
    },
  );
  if (!res.ok) throw new Error(`YouTube HTML ${res.status}`);
  const html = await res.text();
  const match = html.match(/var ytInitialData\s*=\s*(\{[\s\S]*?\});<\/script>/);
  if (!match) throw new Error("ytInitialData not found");
  const data = JSON.parse(match[1]);

  const results: any[] = [];
  const walk = (node: any) => {
    if (!node || typeof node !== "object" || results.length >= 25) return;
    if (node.videoRenderer?.title?.runs?.[0]?.text) {
      const v = node.videoRenderer;
      results.push({
        title: v.title.runs.map((r: any) => r.text).join(""),
        text: [
          v.title.runs.map((r: any) => r.text).join(""),
          v.detailedMetadataSnippets?.[0]?.snippetText?.map((s: any) => s.text).join("") || "",
        ].join(" ").trim(),
        url: v.videoId ? `https://www.youtube.com/watch?v=${v.videoId}` : undefined,
        channel: v.ownerText?.runs?.[0]?.text || "Unknown channel",
        views: parseInt((v.viewCountText?.simpleText || "0").replace(/[^\d]/g, ""), 10) || 0,
        publishedAt: relativeToDate(v.publishedTimeText?.simpleText),
      });
      return;
    }
    for (const key of Object.keys(node)) walk(node[key]);
  };
  walk(data);
  return results;
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
      return new Response(JSON.stringify({ error: "Invalid input", videos: [] }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Fetching YouTube videos for:", brand);
    let videos = await searchPiped(brand);

    if (!videos) {
      try {
        videos = await scrapeYouTube(brand);
        console.log("YouTube HTML fallback returned", videos.length);
      } catch (error) {
        console.warn("YouTube fallback failed:", error instanceof Error ? error.message : error);
        return new Response(
          JSON.stringify({ videos: [], unavailable: true, error: "YouTube temporarily unavailable" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    const needle = brand.toLowerCase();
    const filtered = videos.filter((v: any) => v.text?.toLowerCase().includes(needle));
    const out = filtered.length > 0 ? filtered : videos;
    console.log(`YouTube videos found: ${out.length}`);

    return new Response(JSON.stringify({ videos: out }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error("Error in fetch-youtube:", { errorId, error: error instanceof Error ? error.message : "Unknown" });
    return new Response(JSON.stringify({ error: "An error occurred", errorId, videos: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
