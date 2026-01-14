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

    console.log("Searching Mastodon for:", brand);

    // Use mastodon.social public API (no auth needed for public timeline search)
    const searchUrl = `https://mastodon.social/api/v2/search?q=${encodeURIComponent(brand)}&type=statuses&limit=40`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      const errorId = crypto.randomUUID();
      console.error("Mastodon API error:", { errorId, status: response.status, timestamp: new Date().toISOString() });
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable", errorId, posts: [] }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
    const errorId = crypto.randomUUID();
    console.error("Error in fetch-mastodon:", { errorId, error: error instanceof Error ? error.message : "Unknown", timestamp: new Date().toISOString() });
    return new Response(
      JSON.stringify({ error: "An error occurred", errorId, posts: [] }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
