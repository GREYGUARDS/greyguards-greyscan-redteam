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
    console.log("Fetching Lemmy posts for:", cleanBrand);

    // Lemmy is federated - search across major instances
    const instances = [
      "lemmy.world",
      "lemmy.ml", 
      "programming.dev",
      "lemm.ee"
    ];

    let allPosts: any[] = [];

    // Try searching on multiple Lemmy instances
    for (const instance of instances) {
      try {
        const searchUrl = `https://${instance}/api/v3/search?q=${encodeURIComponent(cleanBrand)}&type_=Posts&limit=25&sort=New`;
        
        const response = await fetch(searchUrl, {
          headers: {
            'Accept': 'application/json',
          }
        });

        if (response.ok) {
          const data = await response.json();
          const posts = (data.posts || []).map((item: any) => ({
            id: item.post?.id,
            title: item.post?.name || '',
            text: item.post?.body || item.post?.name || '',
            url: item.post?.url || `https://${instance}/post/${item.post?.id}`,
            author: item.creator?.name || 'anonymous',
            community: item.community?.name || 'unknown',
            instance: instance,
            created: item.post?.published || new Date().toISOString(),
            score: (item.counts?.upvotes || 0) - (item.counts?.downvotes || 0),
            comments: item.counts?.comments || 0,
          }));
          allPosts = [...allPosts, ...posts];
        }
      } catch (instanceErr) {
        console.warn(`Lemmy instance ${instance} failed:`, instanceErr);
      }
    }

    // Deduplicate by title
    const seen = new Set();
    const uniquePosts = allPosts.filter(post => {
      if (seen.has(post.title)) return false;
      seen.add(post.title);
      return true;
    }).slice(0, 50);

    console.log(`Found ${uniquePosts.length} Lemmy posts across ${instances.length} instances`);

    return new Response(
      JSON.stringify({ posts: uniquePosts }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Lemmy error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage, posts: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
