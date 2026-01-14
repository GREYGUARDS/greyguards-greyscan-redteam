import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const BrandSearchSchema = z.object({
  brand: z.string().min(1, "Brand name is required").max(100, "Brand name too long"),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const parseResult = BrandSearchSchema.safeParse(body);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", articles: [] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { brand } = parseResult.data;

    const apiKey = Deno.env.get("NEWS_API_KEY");
    if (!apiKey) {
      console.error("NEWS_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Service configuration error", articles: [] }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch from NewsAPI
    const newsUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(brand)}&pageSize=20&sortBy=publishedAt&language=en&apiKey=${apiKey}`;
    
    console.log("Fetching news for:", brand);
    const response = await fetch(newsUrl);
    
    if (!response.ok) {
      const errorId = crypto.randomUUID();
      console.error("NewsAPI error:", { errorId, status: response.status, timestamp: new Date().toISOString() });
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable", errorId, articles: [] }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("NewsAPI response:", data.status, "articles:", data.articles?.length || 0);

    return new Response(JSON.stringify({ articles: data.articles || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error("Error in fetch-news:", { errorId, error: error instanceof Error ? error.message : "Unknown", timestamp: new Date().toISOString() });
    return new Response(
      JSON.stringify({ error: "An error occurred", errorId, articles: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
