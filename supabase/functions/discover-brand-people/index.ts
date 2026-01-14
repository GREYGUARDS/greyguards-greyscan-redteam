import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const DiscoverPeopleInputSchema = z.object({
  brandName: z.string().min(1).max(100),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const parseResult = DiscoverPeopleInputSchema.safeParse(body);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", success: false, people: [], count: 0 }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { brandName } = parseResult.data;
    console.log('Discovering people for brand:', brandName);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required", success: false, people: [], count: 0 }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Authentication required", success: false, people: [], count: 0 }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!lovableApiKey) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Service configuration error", success: false, people: [], count: 0 }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use Lovable AI to discover key people
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
            content: 'You are an expert researcher. Your task is to identify key people associated with brands/organizations including CEOs, board members, executives, and other notable figures. Return results in JSON format.'
          },
          {
            role: 'user',
            content: `Research and identify key people associated with "${brandName}". Include CEOs, board members, C-level executives, and other notable figures. For each person, provide their name and role/title. Return ONLY a JSON array with format: [{"name": "Person Name", "role": "Their Role"}]. Limit to top 10 most notable people.`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorId = crypto.randomUUID();
      console.error('AI API error:', { errorId, status: aiResponse.status, timestamp: new Date().toISOString() });
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable", errorId, success: false, people: [], count: 0 }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0]?.message?.content || '[]';
    
    console.log('AI response:', aiContent);
    
    // Parse the AI response
    let people = [];
    try {
      // Extract JSON array from response
      const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        people = JSON.parse(jsonMatch[0]);
      } else {
        console.error('No JSON array found in AI response');
        people = [];
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      people = [];
    }

    // Insert discovered people into database
    const insertedPeople = [];
    for (const person of people) {
      if (!person.name || !person.role) continue;
      
      const { data, error } = await supabase
        .from('brand_people')
        .upsert({
          brand_name: brandName,
          user_id: user.id,
          person_name: person.name,
          person_role: person.role,
        }, {
          onConflict: 'brand_name,user_id,person_name',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (!error && data) {
        insertedPeople.push(data);
      } else if (error) {
        console.error('Error inserting person:', error);
      }
    }

    console.log(`Discovered and stored ${insertedPeople.length} people for ${brandName}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        people: insertedPeople,
        count: insertedPeople.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error('Error in discover-brand-people:', { errorId, error: error instanceof Error ? error.message : "Unknown", timestamp: new Date().toISOString() });
    return new Response(
      JSON.stringify({ error: "An error occurred", errorId, success: false, people: [], count: 0 }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
