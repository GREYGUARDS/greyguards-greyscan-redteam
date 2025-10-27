import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

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

    console.log("Searching Daily Mail RSS for:", brand);

    // Fetch Daily Mail RSS feed
    const rssUrl = `https://www.dailymail.co.uk/home/search.rss?searchPhrase=${encodeURIComponent(brand)}&sort=relevance`;
    
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Daily Mail RSS error:", response.status, errorText);
      throw new Error(`Daily Mail RSS error: ${response.status}`);
    }

    const xmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, "text/xml");
    
    if (!doc) {
      throw new Error("Failed to parse RSS feed");
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
    console.error("Error in fetch-dailymail:", error);
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
