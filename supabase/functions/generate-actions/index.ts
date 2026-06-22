import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const ActionsInputSchema = z.object({
  brand: z.string().min(1).max(100),
  sentimentSummary: z.string().max(1000).optional().default(""),
  topTopics: z.string().max(5000).optional().default(""),
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
    const parseResult = ActionsInputSchema.safeParse(body);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { brand, sentimentSummary, topTopics, riskLevel } = parseResult.data;
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: "Service configuration error" }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `Brand: ${brand}. Sentiment summary: ${sentimentSummary}. Top narratives: ${topTopics}. Threat level: ${riskLevel}. Generate 3 clear, strategic actions for the comms team, written as numbered points in plain language. Tone: factual, calm, and authoritative.`;

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
            content: 'You are an expert in brand reputation, strategic communications, and misinformation response. You provide concise, actionable recommendations for how an organisation should respond to emerging online narratives.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_completion_tokens: 300,
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

    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error('Error in generate-actions function:', { errorId, error: error instanceof Error ? error.message : "Unknown", timestamp: new Date().toISOString() });
    return new Response(
      JSON.stringify({ error: 'An error occurred', errorId }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
