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
        JSON.stringify({ error: "Brand name required", questions: [] }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanBrand = brand.trim().substring(0, 100);
    console.log("Fetching Stack Exchange questions for:", cleanBrand);

    // Stack Exchange API - free, no key required for basic usage (300 req/day without key)
    // Search across multiple sites
    const sites = ["stackoverflow", "superuser", "serverfault", "softwareengineering"];
    
    let allQuestions: any[] = [];

    for (const site of sites) {
      try {
        // Search API with filter for questions mentioning the brand
        const searchUrl = `https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=activity&q=${encodeURIComponent(cleanBrand)}&site=${site}&pagesize=25&filter=withbody`;
        
        const response = await fetch(searchUrl, {
          headers: {
            'Accept-Encoding': 'gzip',
            'Accept': 'application/json',
          }
        });

        if (response.ok) {
          const data = await response.json();
          const questions = (data.items || []).map((q: any) => ({
            id: q.question_id,
            title: q.title || '',
            text: q.body_markdown || q.title || '',
            url: q.link,
            author: q.owner?.display_name || 'anonymous',
            authorReputation: q.owner?.reputation || 0,
            site: site,
            tags: q.tags || [],
            created: new Date((q.creation_date || 0) * 1000).toISOString(),
            lastActivity: new Date((q.last_activity_date || 0) * 1000).toISOString(),
            score: q.score || 0,
            answerCount: q.answer_count || 0,
            viewCount: q.view_count || 0,
            isAnswered: q.is_answered || false,
            acceptedAnswerId: q.accepted_answer_id,
          }));
          allQuestions = [...allQuestions, ...questions];
        }
      } catch (siteErr) {
        console.warn(`Stack Exchange site ${site} failed:`, siteErr);
      }
    }

    // Sort by activity date and limit
    allQuestions.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
    const topQuestions = allQuestions.slice(0, 50);

    console.log(`Found ${topQuestions.length} Stack Exchange questions across ${sites.length} sites`);

    return new Response(
      JSON.stringify({ questions: topQuestions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Stack Exchange error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage, questions: [] }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
