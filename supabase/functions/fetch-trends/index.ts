import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation function
function validateBrand(brand: any): string {
  if (!brand || typeof brand !== 'string') {
    throw new Error("Brand name is required and must be a string");
  }
  const trimmed = brand.trim();
  if (trimmed.length === 0) {
    throw new Error("Brand name cannot be empty");
  }
  if (trimmed.length > 100) {
    throw new Error("Brand name must be less than 100 characters");
  }
  // Allow alphanumeric, spaces, hyphens, underscores, ampersands, and periods
  if (!/^[a-zA-Z0-9\s\-_&.]+$/.test(trimmed)) {
    throw new Error("Brand name contains invalid characters");
  }
  return trimmed;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { brand: rawBrand } = await req.json();
    const brand = validateBrand(rawBrand);

    const apiKey = Deno.env.get('SERPAPI_API_KEY');
    
    if (!apiKey) {
      throw new Error("SerpAPI key not configured");
    }

    console.log("Fetching Google Trends for:", brand);
    
    const url = `https://serpapi.com/search.json?engine=google_trends&q=${encodeURIComponent(brand)}&api_key=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("SerpAPI error:", response.status, errorText);
      throw new Error(`SerpAPI error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Trends data received");

    return new Response(
      JSON.stringify(data),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in fetch-trends:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
