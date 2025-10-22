import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { brand } = await req.json();
    
    if (!brand) {
      throw new Error("Brand name is required");
    }

    const apiKey = Deno.env.get("NEWS_API_KEY");
    if (!apiKey) {
      throw new Error("NEWS_API_KEY not configured");
    }

    // Fetch from NewsAPI
    const newsUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(brand)}&pageSize=20&sortBy=publishedAt&language=en&apiKey=${apiKey}`;
    
    console.log("Fetching news for:", brand);
    const response = await fetch(newsUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("NewsAPI error:", response.status, errorText);
      throw new Error(`NewsAPI error: ${response.status}`);
    }

    const data = await response.json();
    console.log("NewsAPI response:", data.status, "articles:", data.articles?.length || 0);

    return new Response(JSON.stringify({ articles: data.articles || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in fetch-news:", error);
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
