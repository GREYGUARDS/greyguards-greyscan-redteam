import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { brand } = await req.json();
    
    if (!brand || typeof brand !== 'string' || brand.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Brand name required", posts: [] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanBrand = brand.trim().substring(0, 100);
    console.log("Fetching Lobsters posts for:", cleanBrand);

    // Lobste.rs search API - free and public
    const searchUrl = `https://lobste.rs/search.json?q=${encodeURIComponent(cleanBrand)}&what=stories&order=newest`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'IntelligenceBot/1.0',
      }
    });

    if (!response.ok) {
      console.error("Lobsters API error:", response.status);
      return new Response(
        JSON.stringify({ error: "Failed to fetch Lobsters", posts: [] }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
    const posts = (data.results || data || []).slice(0, 40).map((story: any) => ({
      id: story.short_id,
      title: story.title || '',
      text: story.description || story.title || '',
      url: story.url || story.comments_url,
      commentsUrl: story.comments_url,
      author: story.submitter_user?.username || 'unknown',
      created: story.created_at || new Date().toISOString(),
      score: story.score || 0,
      commentCount: story.comment_count || 0,
      tags: story.tags || [],
    }));

    console.log(`Found ${posts.length} Lobsters posts`);

    return new Response(
      JSON.stringify({ posts }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Lobsters error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage, posts: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
