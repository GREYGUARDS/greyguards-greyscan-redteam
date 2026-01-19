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
    console.log("Fetching Dev.to articles for:", cleanBrand);

    // Dev.to public API - free and public, no API key needed for read operations
    const searchUrl = `https://dev.to/api/articles?per_page=50&tag=${encodeURIComponent(cleanBrand.toLowerCase().replace(/\s+/g, ''))}`;
    const searchUrl2 = `https://dev.to/search/feed_content?per_page=50&search_fields=${encodeURIComponent(cleanBrand)}`;
    
    // Try tag-based search first, then fallback to general search
    let articles: any[] = [];
    
    // Fetch by search query
    const response = await fetch(`https://dev.to/api/articles?per_page=50`, {
      headers: {
        'Accept': 'application/json',
      }
    });

    if (response.ok) {
      const data = await response.json();
      // Filter articles that mention the brand
      const brandLower = cleanBrand.toLowerCase();
      articles = (data || [])
        .filter((article: any) => {
          const title = (article.title || '').toLowerCase();
          const description = (article.description || '').toLowerCase();
          const tags = (article.tag_list || []).join(' ').toLowerCase();
          return title.includes(brandLower) || description.includes(brandLower) || tags.includes(brandLower);
        })
        .slice(0, 30)
        .map((article: any) => ({
          id: article.id,
          title: article.title || '',
          text: article.description || '',
          url: article.url,
          author: article.user?.name || article.user?.username || 'unknown',
          username: article.user?.username,
          created: article.published_at || new Date().toISOString(),
          readingTime: article.reading_time_minutes || 0,
          reactions: article.positive_reactions_count || 0,
          comments: article.comments_count || 0,
          tags: article.tag_list || [],
          coverImage: article.cover_image,
        }));
    }

    console.log(`Found ${articles.length} Dev.to articles`);

    return new Response(
      JSON.stringify({ articles }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Dev.to error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage, articles: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
