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
    const editions = ['hl=en-GB&gl=GB&ceid=GB:en', 'hl=en-US&gl=US&ceid=US:en'];
    let response: Response | null = null;
    for (const ed of editions) {
      try {
        const r = await fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(cleanBrand)}&${ed}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
            'Accept': 'application/rss+xml, application/xml;q=0.9, */*;q=0.8',
            'Accept-Language': 'en-GB,en;q=0.9',
          },
          signal: AbortSignal.timeout(10000),
        });
        if (r.ok) { response = r; break; }
        console.warn('Google News edition failed', ed, r.status);
      } catch (e) { console.warn('Google News edition error', ed, e instanceof Error ? e.message : e); }
    }
    if (!response) {
      // Google often blocks cloud servers; fall back to Bing News RSS (free, no key).
      try {
        const q = cleanBrand.replace(/\s*when:\d+d\s*/g, ' ').trim();
        const r = await fetch(`https://www.bing.com/news/search?q=${encodeURIComponent(q)}&format=rss&setlang=en-GB`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36' },
          signal: AbortSignal.timeout(10000),
        });
        if (r.ok) {
          const xml = await r.text();
          const out: any[] = [];
          for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
            const it = m[1];
            const title = (it.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '').replace(/<!\[CDATA\[|\]\]>/g, '').trim();
            let link = (it.match(/<link>([\s\S]*?)<\/link>/)?.[1] || '').replace(/&amp;/g, '&');
            try { const u = new URL(link).searchParams.get('url'); if (u) link = u; } catch { /* keep */ }
            const pub = it.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1];
            const src = it.match(/<News:Source>([\s\S]*?)<\/News:Source>/i)?.[1] || 'Bing News';
            const desc = (it.match(/<description>([\s\S]*?)<\/description>/)?.[1] || '').replace(/<[^>]+>/g, '').trim();
            if (title && /^https?:/.test(link)) out.push({ title, url: link, publishedAt: pub ? new Date(pub).toISOString() : null, source: `${src} via Bing`, text: `${title} ${desc}`.trim() });
            if (out.length >= 30) break;
          }
          console.log(`Bing News fallback found ${out.length}`);
          return new Response(JSON.stringify({ articles: out, provider: 'bing' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      } catch (e) { console.warn('Bing fallback error', e instanceof Error ? e.message : e); }
      response = new Response('', { status: 502 });
    }

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
