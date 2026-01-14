import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const AnalyzePersonInputSchema = z.object({
  personId: z.string().uuid(),
  brandName: z.string().min(1).max(100),
  personName: z.string().min(1).max(200),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const parseResult = AnalyzePersonInputSchema.safeParse(body);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", success: false }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { personId, brandName, personName } = parseResult.data;
    console.log('Analyzing data for person:', personName);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required", success: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Authentication required", success: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!lovableApiKey) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Service configuration error", success: false }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use Lovable AI to analyze person mentions and sentiment
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a sentiment analysis expert. Analyze mentions and sentiment for individuals in the context of their associated brand/organization. Also identify any misinformation, disinformation, or malinformation narratives.'
          },
          {
            role: 'user',
            content: `Analyze recent public mentions of "${personName}" in relation to "${brandName}". Provide: 1) Estimated mention count (integer), 2) Sentiment breakdown (positive/negative/neutral counts), 3) Any MDM narratives (misinformation/disinformation/malinformation) if present. Return as JSON: {"mentions": number, "positive": number, "negative": number, "neutral": number, "mdm_narratives": [{"type": "misinformation|disinformation|malinformation", "description": "...", "severity": "low|medium|high", "keywords": ["keyword1", "keyword2"]}]}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorId = crypto.randomUUID();
      console.error('AI API error:', { errorId, status: aiResponse.status, timestamp: new Date().toISOString() });
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable", errorId, success: false }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0]?.message?.content || '{}';
    
    console.log('AI response:', aiContent);
    
    // Parse the AI response
    let analysis;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        console.error('No JSON found in AI response');
        analysis = {
          mentions: 0,
          positive: 0,
          negative: 0,
          neutral: 0,
          mdm_narratives: []
        };
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      analysis = {
        mentions: 0,
        positive: 0,
        negative: 0,
        neutral: 0,
        mdm_narratives: []
      };
    }

    // Calculate sentiment score
    const totalSentiment = analysis.positive + analysis.negative + analysis.neutral;
    const sentimentScore = totalSentiment > 0 
      ? ((analysis.positive - analysis.negative) / totalSentiment) * 100 
      : 0;

    // Store person mentions history
    const { error: mentionsError } = await supabase
      .from('person_mentions_history')
      .insert({
        person_id: personId,
        brand_name: brandName,
        user_id: user.id,
        mention_count: analysis.mentions || 0,
        sentiment_score: sentimentScore,
        positive_count: analysis.positive || 0,
        negative_count: analysis.negative || 0,
        neutral_count: analysis.neutral || 0,
      });

    if (mentionsError) {
      console.error('Error storing mentions:', mentionsError);
    }

    // Store MDM narratives if any
    if (analysis.mdm_narratives && analysis.mdm_narratives.length > 0) {
      for (const narrative of analysis.mdm_narratives) {
        const narrativeId = `${personName.toLowerCase().replace(/\s+/g, '_')}_${narrative.type}_${Date.now()}`;
        
        const { error: narrativeError } = await supabase
          .from('person_mdm_narratives')
          .insert({
            person_id: personId,
            brand_name: brandName,
            user_id: user.id,
            narrative_id: narrativeId,
            narrative_type: narrative.type || 'misinformation',
            narrative_description: narrative.description || '',
            severity: narrative.severity || 'medium',
            keywords: narrative.keywords || [],
            frequency: 1,
          });

        if (narrativeError) {
          console.error('Error storing MDM narrative:', narrativeError);
        }
      }
    }

    console.log(`Analyzed data for ${personName}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        analysis: {
          mentions: analysis.mentions || 0,
          sentiment_score: sentimentScore,
          positive: analysis.positive || 0,
          negative: analysis.negative || 0,
          neutral: analysis.neutral || 0,
          mdm_count: analysis.mdm_narratives?.length || 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error('Error in analyze-person-data:', { errorId, error: error instanceof Error ? error.message : "Unknown", timestamp: new Date().toISOString() });
    return new Response(
      JSON.stringify({ error: "An error occurred", errorId, success: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
