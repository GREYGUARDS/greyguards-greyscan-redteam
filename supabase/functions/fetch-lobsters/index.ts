import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Lobste.rs removed its search.json endpoint (returns 400 "Unpermitted query or form parameter").
// We now pull the public story feeds and filter locally.
const FEEDS = [
  'https://lobste.rs/newest.json',
  'https://lobste.rs/hottest.json',
];

async function fetchFeed(url: string): Promise<any[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GreyscanBot/1.0 (narrative monitoring)',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.warn(`Lobsters feed ${url} failed:`, response.status);
      return [];
    }
    const data = await response.json();
    return Array.isArray(data) ? data : (data.stories || []);
  } catch (error) {
    console.warn(`Lobsters feed ${url} error:`, error instanceof Error ? error.message : error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { brand } = await req.json();

    if (!brand || typeof brand !== 'string' || brand.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Brand name required", posts: [] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanBrand = brand.trim().substring(0, 100);
    const needle = cleanBrand.toLowerCase();
    console.log("Fetching Lobsters posts for:", cleanBrand);

    const results = await Promise.all(FEEDS.map(fetchFeed));
    const stories = results.flat();

    const seen = new Set<string>();
    const posts = stories
      .filter((story: any) => {
        const haystack = `${story?.title || ''} ${story?.description || ''} ${(story?.tags || []).join(' ')}`.toLowerCase();
        return haystack.includes(needle);
      })
      .filter((story: any) => {
        const id = story.short_id || story.comments_url;
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .slice(0, 40)
      .map((story: any) => ({
        id: story.short_id,
        title: story.title || '',
        text: story.description || story.title || '',
        url: story.url || story.comments_url,
        commentsUrl: story.comments_url,
        author: story.submitter_user?.username || story.submitter_user || 'unknown',
        created: story.created_at || new Date().toISOString(),
        score: story.score || 0,
        commentCount: story.comment_count || 0,
        tags: story.tags || [],
      }));

    console.log(`Found ${posts.length} Lobsters posts (scanned ${stories.length} stories)`);

    return new Response(
      JSON.stringify({ posts }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Lobsters error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage, posts: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
