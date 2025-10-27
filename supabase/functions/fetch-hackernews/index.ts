import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { brand } = await req.json();
    
    if (!brand) {
      throw new Error("Brand name is required");
    }

    console.log("Searching Hacker News for:", brand);

    // Search Algolia HN API
    const searchUrl = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(brand)}&tags=story&hitsPerPage=50`;
    
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Hacker News API error:", response.status, errorText);
      throw new Error(`Hacker News API error: ${response.status}`);
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
    console.error("Error in fetch-hackernews:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage, posts: [] }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
