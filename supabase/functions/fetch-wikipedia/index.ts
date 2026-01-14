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
        JSON.stringify({ error: "Invalid input", articles: [] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { brand } = parseResult.data;

    console.log("Searching Wikipedia for:", brand);

    // Search Wikipedia
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(brand)}&format=json&srlimit=20&origin=*`;
    
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      const errorId = crypto.randomUUID();
      console.error("Wikipedia API error:", { errorId, status: response.status, timestamp: new Date().toISOString() });
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable", errorId, articles: [] }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("Wikipedia results:", data.query?.search?.length || 0);

    // Transform to standard format
    const articles = data.query?.search?.map((result: any) => ({
      title: result.title,
      snippet: result.snippet.replace(/<[^>]*>/g, ''), // Strip HTML
      pageid: result.pageid,
      wordcount: result.wordcount,
      timestamp: result.timestamp,
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(result.title.replace(/ /g, '_'))}`,
      source: 'wikipedia'
    })) || [];

    return new Response(
      JSON.stringify({ articles }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error("Error in fetch-wikipedia:", { errorId, error: error instanceof Error ? error.message : "Unknown", timestamp: new Date().toISOString() });
    return new Response(
      JSON.stringify({ error: "An error occurred", errorId, articles: [] }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
