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

    // Use Reddit's public JSON API (no auth required for search)
    const redditUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(brand)}&limit=10&sort=top&t=week`;
    
    console.log("Fetching Reddit posts for:", brand);
    const response = await fetch(redditUrl, {
      headers: {
        "User-Agent": "NarrativeTracker/1.0",
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Reddit API error:", response.status, errorText);
      throw new Error(`Reddit API error: ${response.status}`);
    }

    const data = await response.json();
    const posts = data.data?.children?.map((child: any) => child.data) || [];
    console.log("Reddit posts found:", posts.length);

    return new Response(JSON.stringify({ posts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in fetch-reddit:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage, posts: [] }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
