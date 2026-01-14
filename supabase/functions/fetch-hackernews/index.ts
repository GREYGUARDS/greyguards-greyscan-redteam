import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const BrandSearchSchema = z.object({
  brand: z.string().min(1, "Brand name is required").max(100, "Brand name too long"),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const parseResult = BrandSearchSchema.safeParse(body);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", posts: [] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { brand } = parseResult.data;

    console.log("Searching Hacker News for:", brand);

    // Search Algolia HN API
    const searchUrl = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(brand)}&tags=story&hitsPerPage=50`;
    
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      const errorId = crypto.randomUUID();
      console.error("Hacker News API error:", { errorId, status: response.status, timestamp: new Date().toISOString() });
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable", errorId, posts: [] }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("Hacker News results:", data.hits?.length || 0);

    // Transform to standard format
    const posts = data.hits.map((hit: any) => ({
      id: hit.objectID,
      title: hit.title,
      text: hit.story_text || hit.title,
      author: hit.author,
      created: hit.created_at,
      score: hit.points,
      num_comments: hit.num_comments,
      url: `https://news.ycombinator.com/item?id=${hit.objectID}`,
      source: 'hackernews'
    }));

    return new Response(
      JSON.stringify({ posts }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error("Error in fetch-hackernews:", { errorId, error: error instanceof Error ? error.message : "Unknown", timestamp: new Date().toISOString() });
    return new Response(
      JSON.stringify({ error: "An error occurred", errorId, posts: [] }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
