import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";
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

    console.log("Searching Daily Mail RSS for:", brand);

    // Fetch Daily Mail RSS feed
    const rssUrl = `https://www.dailymail.co.uk/home/search.rss?searchPhrase=${encodeURIComponent(brand)}&sort=relevance`;
    
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
      }
    });
    
    if (!response.ok) {
      const errorId = crypto.randomUUID();
      console.error("Daily Mail RSS error:", { errorId, status: response.status, timestamp: new Date().toISOString() });
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable", errorId, articles: [] }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const xmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, "text/xml");
    
    if (!doc) {
      const errorId = crypto.randomUUID();
      console.error("Failed to parse RSS feed:", { errorId, timestamp: new Date().toISOString() });
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable", errorId, articles: [] }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const items = doc.querySelectorAll("item");
    console.log("Daily Mail results:", items.length);

    // Transform to standard format
    const articles = Array.from(items).slice(0, 30).map((item) => {
      const element = item as any; // Cast to allow querySelector access
      const titleEl = element.querySelector("title");
      const linkEl = element.querySelector("link");
      const descEl = element.querySelector("description");
      const pubDateEl = element.querySelector("pubDate");
      
      return {
        title: titleEl?.textContent || "",
        text: (descEl?.textContent || "").replace(/<[^>]*>/g, ''), // Strip HTML
        url: linkEl?.textContent || "",
        publishedAt: pubDateEl?.textContent || new Date().toISOString(),
        source: 'dailymail'
      };
    }).filter(article => article.title && article.url);

    return new Response(
      JSON.stringify({ articles }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error("Error in fetch-dailymail:", { errorId, error: error instanceof Error ? error.message : "Unknown", timestamp: new Date().toISOString() });
    return new Response(
      JSON.stringify({ error: "An error occurred", errorId, articles: [] }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
