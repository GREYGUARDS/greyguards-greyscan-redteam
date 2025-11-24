import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { brandName } = await req.json();
    console.log('Discovering people for brand:', brandName);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid user token');
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
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
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
    console.error('Error in discover-brand-people:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});