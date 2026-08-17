import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Bluesky's public AppView blocks some datacenter ranges with a 403 HTML page.
// Try the known public hosts in order and degrade gracefully instead of erroring.
const HOSTS = [
  'https://public.api.bsky.app',
  'https://api.bsky.app',
];

serve(async (req) => {
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

    let data: any = null;
    let lastStatus = 0;

    for (const host of HOSTS) {
      const searchUrl = `${host}/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(cleanBrand)}&limit=50`;
      try {
        const response = await fetch(searchUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'GreyscanBot/1.0 (narrative monitoring)',
          },
          signal: AbortSignal.timeout(8000),
        });

        lastStatus = response.status;
        const contentType = response.headers.get('content-type') || '';

        if (!response.ok || !contentType.includes('json')) {
          console.warn(`Bluesky host ${host} unavailable:`, response.status);
          continue;
        }

        data = await response.json();
        break;
      } catch (hostError) {
        console.warn(`Bluesky host ${host} error:`, hostError instanceof Error ? hostError.message : hostError);
      }
    }

    if (!data) {
      // Degrade gracefully: no posts, but don't fail or slow down the overall scan.
      console.warn("Bluesky unavailable from this network, last status:", lastStatus);
      return new Response(
        JSON.stringify({ posts: [], unavailable: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
