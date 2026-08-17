import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};


// GDELT enforces roughly one request every 5 seconds per source IP and answers 429 otherwise.
// Retry with backoff so a shared-IP collision doesn't silently kill the source.
async function gdeltFetch(url: string, label: string): Promise<Response | null> {
  const delays = [0, 5500, 6500];
  for (let attempt = 0; attempt < delays.length; attempt++) {
    if (delays[attempt] > 0) {
      await new Promise((r) => setTimeout(r, delays[attempt]));
    }
    const response = await fetch(url, {
      headers: { "User-Agent": "GreyscanBot/1.0 (narrative monitoring)" },
      signal: AbortSignal.timeout(20000),
    });
    if (response.ok) return response;
    if (response.status !== 429) {
      console.error(`${label} error:`, response.status, (await response.text()).slice(0, 200));
      return null;
    }
    console.warn(`${label} rate limited (429), retry ${attempt + 1}/${delays.length - 1}`);
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
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
    const { brand } = await req.json();
    
    if (!brand) {
      throw new Error("Brand name is required");
    }

    console.log("Fetching GDELT GKG data for:", brand);

    // GDELT GKG API - Global Knowledge Graph
    const mode = "artgkg";
    const format = "json";
    const maxrecords = "150";
    const query = encodeURIComponent(brand);
    const timespan = "1d";
    
    const gdeltUrl = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=${mode}&format=${format}&maxrecords=${maxrecords}&timespan=${timespan}`;
    
    console.log("GDELT GKG URL:", gdeltUrl);
    // Stagger behind the DOC call, which fires at the same moment from the same IP
    await new Promise((r) => setTimeout(r, 2500));
    const response = await gdeltFetch(gdeltUrl, "GDELT GKG");

    const emptyGkg = { articles: [], entities: [], themes: [], locations: [], unavailable: true };

    if (!response) {
      return new Response(JSON.stringify(emptyGkg), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("json")) {
      console.warn("GDELT GKG returned non-JSON response");
      return new Response(JSON.stringify(emptyGkg), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
