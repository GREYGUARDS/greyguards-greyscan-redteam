import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { brand, mentions } = await req.json();
    
    if (!brand || !mentions || mentions.length === 0) {
      return new Response(
        JSON.stringify({ narratives: [], alerts: [], error: "Brand name and mentions required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get authenticated user - verify_jwt is already enabled in config.toml
    const authHeader = req.headers.get('Authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use service role for database operations
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    
    // Create client with user auth for getting user info
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader || '' } }
    });
    
    let userId: string | null = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || null;
    } catch (authError) {
      console.log('Auth check failed, but proceeding since JWT is verified at edge level');
    }
    
    // If we couldn't get user ID, try to extract from JWT
    if (!userId && authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const payload = JSON.parse(atob(token.split('.')[1]));
        userId = payload.sub;
      } catch {
        console.log('Could not extract user ID from token');
      }
    }
    
    if (!userId) {
      console.log('No user ID found, returning empty results');
      return new Response(JSON.stringify({ narratives: [], alerts: [], error: 'User identification failed' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Prepare context from mentions (limit to 50 most recent for token efficiency)
    const recentMentions = mentions.slice(0, 50);
    const mentionsContext = recentMentions
      .map((m: any, i: number) => `${i + 1}. [${m.source}] ${m.text}`)
      .join("\n");

    const systemPrompt = `You are an expert in narrative intelligence and information warfare. Your task is to identify and categorize potential Misinformation (false info shared without malicious intent), Disinformation (false info deliberately spread to deceive), and Malinformation (true info used to inflict harm) narratives about brands.

Analyze the provided mentions and identify distinct MDM narratives. For each narrative:
1. Classify it as Misinformation, Disinformation, or Malinformation
2. Provide a clear title (max 80 chars)
3. Write a concise description (2-3 sentences)
4. Estimate severity (low/medium/high/critical)
5. Count frequency in the dataset
6. Assign a unique stable ID (lowercase, underscore-separated, e.g., "data_breach_rumor")

Focus on patterns, recurring themes, and coordinated messaging rather than isolated mentions.`;

    const userPrompt = `Brand: ${brand}

Recent Mentions (${recentMentions.length} total):
${mentionsContext}

Identify up to 8 distinct MDM narratives from these mentions. Return ONLY valid JSON in this exact format:
{
  "narratives": [
    {
      "id": "unique_narrative_id",
      "type": "misinformation" | "disinformation" | "malinformation",
      "title": "Brief narrative title",
      "description": "2-3 sentence description of the narrative",
      "severity": "low" | "medium" | "high" | "critical",
      "frequency": number (estimated occurrences in dataset),
      "firstSeen": "YYYY-MM-DD" (estimate based on context),
      "keywords": ["keyword1", "keyword2", "keyword3"]
    }
  ]
}`;

    console.log("Analyzing MDM narratives for:", brand);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3, // Lower temperature for more consistent analysis
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later.", narratives: [], alerts: [] }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace.", narratives: [], alerts: [] }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";
    
    console.log("AI response received:", aiContent.substring(0, 200));

    // Parse AI response - handle JSON wrapped in markdown code blocks
    let narrativesData;
    try {
      // Try direct parse first
      narrativesData = JSON.parse(aiContent);
    } catch {
      // Extract JSON from markdown code block if present
      const jsonMatch = aiContent.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        narrativesData = JSON.parse(jsonMatch[1]);
      } else {
        // Try to find JSON object in text
        const jsonStart = aiContent.indexOf('{');
        const jsonEnd = aiContent.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          narrativesData = JSON.parse(aiContent.substring(jsonStart, jsonEnd + 1));
        } else {
          throw new Error("No valid JSON found in AI response");
        }
      }
    }

    const narratives = narrativesData.narratives || [];
    console.log(`Identified ${narratives.length} MDM narratives`);

    // Check for historical data to detect new narratives and surges
    const alerts: any[] = [];
    const now = new Date();
    
    // Fetch recent narrative history (last 7 days)
    const { data: historyData } = await supabaseAdmin
      .from('mdm_narratives_history')
      .select('*')
      .eq('brand_name', brand)
      .eq('user_id', userId)
      .gte('detected_at', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('detected_at', { ascending: false });

    const recentHistory = historyData || [];
    console.log(`Found ${recentHistory.length} historical narrative records`);
    
    // Store current narratives in history
    for (const narrative of narratives) {
      await supabaseAdmin.from('mdm_narratives_history').insert({
        user_id: userId,
        brand_name: brand,
        narrative_id: narrative.id,
        narrative_type: narrative.type,
        narrative_description: narrative.description,
        severity: narrative.severity,
        frequency: narrative.frequency,
        keywords: narrative.keywords,
        detected_at: now.toISOString()
      });
    }

    // Detect new narratives and surges
    for (const narrative of narratives) {
      const previousInstances = recentHistory.filter(
        h => h.narrative_id === narrative.id
      );

      // Check if this is a completely new narrative (not seen in last 7 days)
      if (previousInstances.length === 0) {
        const alert = {
          user_id: userId,
          brand_name: brand,
          alert_type: 'new_narrative',
          narrative_id: narrative.id,
          narrative_description: narrative.description,
          severity: narrative.severity,
          previous_frequency: null,
          current_frequency: narrative.frequency,
          frequency_change_percent: null,
          is_read: false
        };
        
        await supabaseAdmin.from('mdm_alerts').insert(alert);
        alerts.push(alert);
        console.log('🆕 New narrative detected:', narrative.id);
      } else {
        // Check for frequency surge (50%+ increase from last detection)
        const lastInstance = previousInstances[0];
        const frequencyIncrease = ((narrative.frequency - lastInstance.frequency) / lastInstance.frequency) * 100;
        
        if (frequencyIncrease >= 50) {
          const alert = {
            user_id: userId,
            brand_name: brand,
            alert_type: 'surge',
            narrative_id: narrative.id,
            narrative_description: narrative.description,
            severity: narrative.severity,
            previous_frequency: lastInstance.frequency,
            current_frequency: narrative.frequency,
            frequency_change_percent: frequencyIncrease,
            is_read: false
          };
          
          await supabaseAdmin.from('mdm_alerts').insert(alert);
          alerts.push(alert);
          console.log('📈 Narrative surge detected:', narrative.id, `+${frequencyIncrease.toFixed(0)}%`);
        }
      }
    }

    console.log(`Generated ${alerts.length} alerts`);

    return new Response(
      JSON.stringify({ narratives, alerts }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in analyze-mdm-narratives:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage, narratives: [], alerts: [] }),
      { 
        status: 200, // Return 200 to keep app working
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
