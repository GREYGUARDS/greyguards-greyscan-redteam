import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { brand } = await req.json();
    
    if (!brand) {
      throw new Error("Brand name is required");
    }

    console.log("Fetching GDELT GKG data for:", brand);

    // GDELT GKG API - Global Knowledge Graph
    const mode = "artgkg";
    const format = "json";
    const maxrecords = "250";
    const query = encodeURIComponent(brand);
    const timespan = "1d";
    
    const gdeltUrl = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=${mode}&format=${format}&maxrecords=${maxrecords}&timespan=${timespan}`;
    
    console.log("GDELT GKG URL:", gdeltUrl);
    const response = await fetch(gdeltUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("GDELT GKG error:", response.status, errorText);
      throw new Error(`GDELT GKG error: ${response.status}`);
    }

    // Check if response is JSON before parsing
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("GDELT GKG returned non-JSON response:", text.substring(0, 200));
      throw new Error("GDELT API returned non-JSON response. The API may be rate limiting or experiencing issues.");
    }

    const data = await response.json();
    console.log("GDELT GKG response:", data.articles?.length || 0, "articles with GKG data");

    // Extract entities, themes, and locations
    const entities = new Map<string, number>();
    const themes = new Map<string, number>();
    const locations = new Map<string, { count: number; lat?: number; lon?: number }>();
    const toneScores: number[] = [];

    (data.articles || []).forEach((article: any) => {
      // Extract themes (GDELT's 2,300+ detected themes)
      if (article.themes) {
        article.themes.split(";").forEach((theme: string) => {
          if (theme) {
            themes.set(theme, (themes.get(theme) || 0) + 1);
          }
        });
      }

      // Extract locations with coordinates
      if (article.locations) {
        article.locations.split(";").forEach((loc: string) => {
          if (loc) {
            const parts = loc.split("#");
            const name = parts[1] || loc;
            const lat = parts[3] ? parseFloat(parts[3]) : undefined;
            const lon = parts[4] ? parseFloat(parts[4]) : undefined;
            
            const existing = locations.get(name);
            locations.set(name, {
              count: (existing?.count || 0) + 1,
              lat: lat || existing?.lat,
              lon: lon || existing?.lon,
            });
          }
        });
      }

      // Extract persons/organizations
      if (article.persons) {
        article.persons.split(";").forEach((person: string) => {
          if (person) {
            entities.set(person, (entities.get(person) || 0) + 1);
          }
        });
      }

      if (article.organizations) {
        article.organizations.split(";").forEach((org: string) => {
          if (org) {
            entities.set(org, (entities.get(org) || 0) + 1);
          }
        });
      }

      // Collect tone scores
      if (article.tone) {
        toneScores.push(parseFloat(article.tone));
      }
    });

    // Convert maps to arrays and sort by frequency
    const topEntities = Array.from(entities.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([name, count]) => ({ name, count }));

    const topThemes = Array.from(themes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([name, count]) => ({ name, count }));

    const topLocations = Array.from(locations.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 15)
      .map(([name, data]) => ({ 
        name, 
        count: data.count,
        lat: data.lat,
        lon: data.lon,
      }));

    // Calculate average tone
    const avgTone = toneScores.length > 0
      ? toneScores.reduce((a, b) => a + b, 0) / toneScores.length
      : 0;

    return new Response(JSON.stringify({ 
      entities: topEntities,
      themes: topThemes,
      locations: topLocations,
      averageTone: avgTone,
      totalArticles: data.articles?.length || 0,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in fetch-gdelt-gkg:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    // Return 200 with error field so frontend continues working
    return new Response(
      JSON.stringify({ 
        error: errorMessage, 
        entities: [], 
        themes: [], 
        locations: [],
        averageTone: 0,
        totalArticles: 0,
      }),
      { 
        status: 200, // Changed from 500 to keep app working
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
