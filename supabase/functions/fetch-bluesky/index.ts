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
    console.log("Fetching Bluesky posts for:", cleanBrand);

    // Bluesky public API - search posts (no auth needed for public search)
    const searchUrl = `https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(cleanBrand)}&limit=50`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Bluesky API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to fetch Bluesky", posts: [] }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
    const posts = (data.posts || []).map((post: any) => ({
      id: post.uri,
      text: post.record?.text || '',
      author: post.author?.handle || 'unknown',
      displayName: post.author?.displayName || post.author?.handle || 'Unknown',
      created: post.record?.createdAt || new Date().toISOString(),
      likes: post.likeCount || 0,
      reposts: post.repostCount || 0,
      replies: post.replyCount || 0,
      url: `https://bsky.app/profile/${post.author?.handle}/post/${post.uri.split('/').pop()}`,
    }));

    console.log(`Found ${posts.length} Bluesky posts`);

    return new Response(
      JSON.stringify({ posts }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Bluesky error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage, posts: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
