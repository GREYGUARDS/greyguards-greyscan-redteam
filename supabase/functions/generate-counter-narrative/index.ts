import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const CounterNarrativeInputSchema = z.object({
  brand: z.string().min(1).max(100),
  topTopics: z.string().max(5000).optional().default(""),
  sentimentSummary: z.string().max(1000).optional().default(""),
  riskLevel: z.string().max(50).optional().default("unknown"),
});

async function callAIWithRetry(body: object, maxRetries = 3): Promise<Response> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      // Don't retry on client errors (4xx) except for rate limits
      if (response.status === 429 && attempt < maxRetries) {
        console.log(`Rate limited, retrying attempt ${attempt + 1}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }

      // Retry on server errors (5xx)
      if (response.status >= 500 && attempt < maxRetries) {
        console.log(`Server error ${response.status}, retrying attempt ${attempt + 1}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }

      return response;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      throw error;
    }
  }
  
  throw new Error('Max retries exceeded');
}

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
    const parseResult = CounterNarrativeInputSchema.safeParse(body);
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

    const prompt = `Brand: ${brand}. Current narratives: ${topTopics}. Sentiment: ${sentimentSummary}. Risk level: ${riskLevel}. Draft a 3–5 sentence counter-narrative statement suitable for public channels (press or social). Begin directly with the key message and focus on facts and reassurance.`;

    console.log(`Generating counter-narrative for: ${brand}`);

    const response = await callAIWithRetry({
      model: 'google/gemini-2.5-flash',
      messages: [
        { 
          role: 'system', 
          content: 'You are a senior communications strategist writing concise, factual statements that counter misinformation or clarify a brand position. You avoid spin and keep the tone balanced, transparent and professional.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.6,
      max_completion_tokens: 250,
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
    const statement = data.choices[0].message.content;

    console.log('Successfully generated counter-narrative');

    return new Response(JSON.stringify({ statement }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error('Error in generate-counter-narrative function:', { errorId, error: error instanceof Error ? error.message : "Unknown", timestamp: new Date().toISOString() });
    return new Response(
      JSON.stringify({ error: 'An error occurred', errorId }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
