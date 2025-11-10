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

    const clientId = Deno.env.get('REDDIT_CLIENT_ID')?.trim();
    const clientSecret = Deno.env.get('REDDIT_CLIENT_SECRET')?.trim();

    if (!clientId || !clientSecret) {
      throw new Error("Reddit API credentials not configured (REDDIT_CLIENT_ID/REDDIT_CLIENT_SECRET)");
    }

    // Get OAuth token
    console.log("Getting Reddit OAuth token");
    const authString = btoa(`${clientId}:${clientSecret}`);
    const tokenResponse = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'NarrativeTracker/1.0',
      },
      body: 'grant_type=client_credentials&scope=read',
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Reddit OAuth error:", tokenResponse.status, errorText);
      throw new Error(`Reddit OAuth error: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Use Reddit's OAuth API to search
    const redditUrl = `https://oauth.reddit.com/search?q=${encodeURIComponent(brand)}&limit=10&sort=top&t=week`;
    
    console.log("Fetching Reddit posts for:", brand);
    const response = await fetch(redditUrl, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
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
