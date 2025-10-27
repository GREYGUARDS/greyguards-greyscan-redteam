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

    console.log("Searching Wikipedia for:", brand);

    // Search Wikipedia
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(brand)}&format=json&srlimit=20&origin=*`;
    
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Wikipedia API error:", response.status, errorText);
      throw new Error(`Wikipedia API error: ${response.status}`);
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
    console.error("Error in fetch-wikipedia:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage, articles: [] }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
