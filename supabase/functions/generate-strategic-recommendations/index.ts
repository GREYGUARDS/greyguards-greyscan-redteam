import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const RecommendationsInputSchema = z.object({
  brand: z.string().min(1).max(100),
  topTopics: z.string().max(5000).optional().default(""),
  sentimentSummary: z.string().max(1000).optional().default(""),
  riskLevel: z.string().max(50).optional().default("unknown"),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Require authentication (anonymous/guest sessions count as authenticated)
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Authentication required" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    
    // Validate input
    const parseResult = RecommendationsInputSchema.safeParse(body);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { brand, topTopics, sentimentSummary, riskLevel } = parseResult.data;
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: "Service configuration error" }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating strategic recommendations for:', brand);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert communications strategist for Greyguards – The Grey Zone Intelligence System. Your tone is concise, confident, and actionable. You provide short recommendations (max 3–4 bullet points or a 4-sentence paragraph). Avoid long explanations.'
          },
          {
            role: 'user',
            content: `Brand: ${brand}. Current narratives: ${topTopics}. Sentiment: ${sentimentSummary}. Risk level: ${riskLevel}. Provide succinct recommendations that outline actions AND suggest which Greyguards services (Grey Zone Audit, Narrative Monitoring, Counter-Narrative Strategy, Influencer Engagement) could assist.`
          }
        ],
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errorId = crypto.randomUUID();
      console.error('AI gateway error:', { errorId, status: response.status, timestamp: new Date().toISOString() });
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable', errorId }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const recommendations = data.choices[0].message.content;

    console.log('Successfully generated recommendations');

    return new Response(
      JSON.stringify({ recommendations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error('Error in generate-strategic-recommendations:', { errorId, error: error instanceof Error ? error.message : "Unknown", timestamp: new Date().toISOString() });
    return new Response(
      JSON.stringify({ error: 'An error occurred', errorId }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
