import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};


// GDELT enforces roughly one request every 5 seconds per source IP and answers 429 otherwise.
// Retry with backoff so a shared-IP collision doesn't silently kill the source.
async function gdeltFetch(url: string, label: string): Promise<Response | null> {
  const delays = [0, 5500, 6500];
  for (let attempt = 0; attempt < delays.length; attempt++) {
    if (delays[attempt] > 0) {
      await new Promise((r) => setTimeout(r, delays[attempt]));
    }
    const response = await fetch(url, {
      headers: { "User-Agent": "GreyscanBot/1.0 (narrative monitoring)" },
      signal: AbortSignal.timeout(20000),
    });
    if (response.ok) return response;
    if (response.status !== 429) {
      console.error(`${label} error:`, response.status, (await response.text()).slice(0, 200));
      return null;
    }
    console.warn(`${label} rate limited (429), retry ${attempt + 1}/${delays.length - 1}`);
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Require authentication (anonymous/guest sessions count as authenticated)
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Authentication required" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const { brand } = await req.json();
    
    if (!brand) {
      throw new Error("Brand name is required");
    }

    console.log("Fetching GDELT DOC data for:", brand);

    // GDELT DOC API - Articles from last 24 hours
    const mode = "artlist";
    const format = "json";
    const maxrecords = "150";
    const query = encodeURIComponent(brand);
    const timespan = "1d"; // Last 24 hours
    
    const gdeltUrl = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=${mode}&format=${format}&maxrecords=${maxrecords}&timespan=${timespan}&sort=datedesc`;
    
    console.log("GDELT DOC URL:", gdeltUrl);
    const response = await gdeltFetch(gdeltUrl, "GDELT DOC");

    if (!response) {
      // Degrade gracefully so the overall scan isn't blocked or marked as an error
      return new Response(JSON.stringify({ articles: [], totalArticles: 0, unavailable: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("json")) {
      console.warn("GDELT DOC returned non-JSON response");
      return new Response(JSON.stringify({ articles: [], totalArticles: 0, unavailable: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    console.log("GDELT DOC response:", data.articles?.length || 0, "articles");

    // Transform GDELT articles to match our format
    const articles = (data.articles || []).map((article: any) => ({
      title: article.title || "Untitled",
      text: article.title || "",
      url: article.url || "",
      publishedAt: article.seendate || new Date().toISOString(),
      source: article.domain || "GDELT",
      country: article.sourcelang || "Unknown",
      tone: article.tone ? parseFloat(article.tone) : 0, // GDELT tone score
      socialimage: article.socialimage || null,
    }));

    return new Response(JSON.stringify({ 
      articles,
      totalArticles: data.articles?.length || 0,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in fetch-gdelt-doc:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage, articles: [] }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
