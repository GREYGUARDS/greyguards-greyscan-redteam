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

  // Require authentication (anonymous/guest sessions count as authenticated)
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Authentication required" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
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

    const clientId = Deno.env.get('REDDIT_CLIENT_ID')?.trim();
    const clientSecret = Deno.env.get('REDDIT_CLIENT_SECRET')?.trim();

    if (!clientId || !clientSecret) {
      console.error("Reddit API credentials not configured");
      return new Response(
        JSON.stringify({ error: "Service configuration error", posts: [] }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
      const errorId = crypto.randomUUID();
      console.error("Reddit OAuth error:", { errorId, status: tokenResponse.status, timestamp: new Date().toISOString() });
      return new Response(
        JSON.stringify({ posts: [], error: "Service temporarily unavailable", errorId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
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
      const errorId = crypto.randomUUID();
      console.error("Reddit API error:", { errorId, status: response.status, timestamp: new Date().toISOString() });
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable", errorId, posts: [] }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const posts = data.data?.children?.map((child: any) => child.data) || [];
    console.log("Reddit posts found:", posts.length);

    return new Response(JSON.stringify({ posts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error("Error in fetch-reddit:", { errorId, error: error instanceof Error ? error.message : "Unknown", timestamp: new Date().toISOString() });
    return new Response(
      JSON.stringify({ error: "An error occurred", errorId, posts: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
