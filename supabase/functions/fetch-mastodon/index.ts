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

    console.log("Searching Mastodon for:", brand);

    // Use mastodon.social public API (no auth needed for public timeline search)
    const searchUrl = `https://mastodon.social/api/v2/search?q=${encodeURIComponent(brand)}&type=statuses&limit=40`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Mastodon API error:", response.status, errorText);
      throw new Error(`Mastodon API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Mastodon results:", data.statuses?.length || 0);

    // Transform to standard format
    const posts = data.statuses.map((status: any) => ({
      id: status.id,
      text: status.content.replace(/<[^>]*>/g, ''), // Strip HTML
      author: status.account.username,
      created: status.created_at,
      score: status.favourites_count + status.reblogs_count,
      num_comments: status.replies_count,
      url: status.url,
      source: 'mastodon'
    }));

    return new Response(
      JSON.stringify({ posts }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in fetch-mastodon:", error);
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
