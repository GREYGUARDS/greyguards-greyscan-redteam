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
        JSON.stringify({ error: "Brand name required", articles: [] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanBrand = brand.trim().substring(0, 100);
    console.log("Fetching Google News RSS for:", cleanBrand);

    // Google News RSS feed - free and public
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(cleanBrand)}&hl=en-US&gl=US&ceid=US:en`;
    
    const response = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; IntelligenceBot/1.0)',
      }
    });

    if (!response.ok) {
      console.error("Google News RSS error:", response.status);
      return new Response(
        JSON.stringify({ error: "Failed to fetch Google News", articles: [] }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const xmlText = await response.text();
    
    // Parse RSS XML manually (simple parsing for items)
    const articles: any[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    
    while ((match = itemRegex.exec(xmlText)) !== null && articles.length < 30) {
      const itemXml = match[1];
      
      const titleMatch = itemXml.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>|<title>(.*?)<\/title>/);
      const linkMatch = itemXml.match(/<link>(.*?)<\/link>/);
      const pubDateMatch = itemXml.match(/<pubDate>(.*?)<\/pubDate>/);
      const sourceMatch = itemXml.match(/<source[^>]*>(.*?)<\/source>/);
      
      const title = titleMatch ? (titleMatch[1] || titleMatch[2]) : '';
      const link = linkMatch ? linkMatch[1] : '';
      const pubDate = pubDateMatch ? pubDateMatch[1] : '';
      const source = sourceMatch ? sourceMatch[1] : 'Google News';
      
      if (title && link) {
        articles.push({
          title: title.replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
          url: link,
          publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          source: source.replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
          text: title,
        });
      }
    }

    console.log(`Found ${articles.length} Google News articles`);

    return new Response(
      JSON.stringify({ articles }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Google News RSS error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage, articles: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
