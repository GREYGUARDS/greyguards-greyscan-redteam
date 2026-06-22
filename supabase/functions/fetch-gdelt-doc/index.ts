import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const maxrecords = "250";
    const query = encodeURIComponent(brand);
    const timespan = "1d"; // Last 24 hours
    
    const gdeltUrl = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=${mode}&format=${format}&maxrecords=${maxrecords}&timespan=${timespan}&sort=datedesc`;
    
    console.log("GDELT DOC URL:", gdeltUrl);
    const response = await fetch(gdeltUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("GDELT DOC error:", response.status, errorText);
      throw new Error(`GDELT DOC error: ${response.status}`);
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
