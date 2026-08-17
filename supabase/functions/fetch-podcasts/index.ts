import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Apple's iTunes Search API is free and requires no key or auth.
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
      return new Response(JSON.stringify({ error: "Invalid input", episodes: [] }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(brand)}&media=podcast&entity=podcastEpisode&limit=40&country=GB`;
    console.log("Fetching podcast episodes for:", brand);

    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "greyscan/1.0" },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.warn("iTunes Search failed:", res.status);
      return new Response(
        JSON.stringify({ episodes: [], unavailable: true, error: "Podcast index temporarily unavailable" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await res.json();
    const needle = brand.toLowerCase();

    const episodes = (data.results || [])
      .filter((r: any) => r.trackName)
      .map((r: any) => ({
        title: r.trackName,
        text: `${r.trackName} ${(r.description || r.shortDescription || "").slice(0, 600)}`.trim(),
        show: r.collectionName || "Unknown show",
        url: r.trackViewUrl,
        publishedAt: r.releaseDate || new Date().toISOString(),
        durationSeconds: r.trackTimeMillis ? Math.round(r.trackTimeMillis / 1000) : 0,
      }))
      .filter((e: any) => e.text.toLowerCase().includes(needle) || e.show.toLowerCase().includes(needle))
      .slice(0, 25);

    console.log(`Podcast episodes found: ${episodes.length}`);

    return new Response(JSON.stringify({ episodes }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error("Error in fetch-podcasts:", { errorId, error: error instanceof Error ? error.message : "Unknown" });
    return new Response(JSON.stringify({ error: "An error occurred", errorId, episodes: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
