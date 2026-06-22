import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 10;

function checkRateLimit(clientIp: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(clientIp);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count };
}

function getClientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         req.headers.get('x-real-ip') || 
         'unknown';
}

// Input validation schema
const ScenarioSchema = z.object({
  title: z.string().max(200),
  narrative: z.string().max(5000),
  severity: z.string().max(50),
}).passthrough();

const InjectsInputSchema = z.object({
  scenario: ScenarioSchema,
  brandName: z.string().min(1).max(100),
  duration: z.number().min(1).max(60),
});

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

  // Rate limiting check
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(clientIp);
  
  if (!rateLimit.allowed) {
    console.warn("Rate limit exceeded:", { clientIp, timestamp: new Date().toISOString() });
    return new Response(
      JSON.stringify({ injects: [], error: "Rate limit exceeded. Try again later." }),
      { 
        status: 429, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-RateLimit-Remaining": "0",
          "Retry-After": "3600"
        } 
      }
    );
  }

  try {
    const body = await req.json();
    
    // Validate input
    const parseResult = InjectsInputSchema.safeParse(body);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ injects: [], error: "Invalid input" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { scenario, brandName, duration } = parseResult.data;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ injects: [], error: "Service configuration error" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const totalSeconds = duration * 60;
    const numInjects = Math.max(duration, Math.min(Math.floor(duration * 1.5), 20));
    const lastInjectTime = totalSeconds - 30;

    const systemPrompt = `You are creating crisis simulation injects for a ${duration}-minute exercise about ${brandName}. 

SCENARIO CONTEXT:
Title: ${scenario.title}
Narrative: ${scenario.narrative}
Severity: ${scenario.severity}

Generate EXACTLY ${numInjects} realistic crisis injects that are DIRECTLY RELATED to this specific scenario about ${brandName}.

CRITICAL REQUIREMENTS:
1. ALL injects must be SPECIFIC to the scenario narrative - reference the same claims, accusations, and storyline
2. Show the crisis EVOLVING over time - early injects should be discovery/early spread, middle should be peak virality, late should be media attention or resolution pressure
3. Include realistic platform-specific content (Twitter/X posts with hashtags, Reddit threads, news headlines, etc.)
4. Response options must be CONTEXTUALLY APPROPRIATE to the specific inject

TIMING REQUIREMENTS:
- First inject at 10-15 seconds
- Injects spaced 30-90 seconds apart (vary the gaps)
- MUST have injects in the final 2 minutes
- LAST inject between ${lastInjectTime - 60} and ${lastInjectTime} seconds

RESPONSE OPTIONS - Make them SPECIFIC and ACCURATE:
Each inject needs 3 response options that are DIRECTLY relevant to that inject's content:
- Options should have REALISTIC effectiveness scores based on crisis management best practices
- A well-crafted public statement addressing specific allegations should score 70-85%
- "No comment" or ignoring should score 20-40%
- Aggressive legal threats should score 40-60% (can backfire)
- Engaging credible third-party validators should score 75-90%
- Greyguards services (monitoring, counter-narrative, elf network) should score 80-90%

Return a JSON object with an "injects" array. Each inject should have:
- id: unique string
- timestamp: number (seconds from start, ranging from 10 to ${lastInjectTime})
- type: "social_post" | "news_article" | "influencer" | "official_response" | "leak" | "amplification"
- content: the inject content (realistic, platform-appropriate, SPECIFIC to the scenario)
- source: who posted it (e.g., "@WhistleblowerX (120K followers)", "BBC News", "r/technology")
- reach: number (estimated reach)
- sentiment: "hostile" | "confused" | "neutral"
- requiresResponse: true
- isAggressive: boolean
- responseOptions: array of 3 options, each with:
  - id: unique string
  - label: short action name (e.g., "Issue Factual Rebuttal", "Request Correction", "Deploy Greyguards ELF Network")
  - description: specific description of what this response involves and why it might work or fail
  - type: "statement" | "social_response" | "internal_action" | "media_outreach" | "legal" | "greyguards_service"
  - effectiveness: 0-100 (be realistic - not everything is 70-80%)
  - riskLevel: "low" | "medium" | "high"
  - timeToExecute: seconds`;

    console.log("Generating injects:", { brandName, duration, numInjects, scenario: scenario.title, clientIp, remaining: rateLimit.remaining });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Generate ${numInjects} crisis injects for this ${duration}-minute exercise. The scenario is "${scenario.title}" targeting ${brandName}. Make every inject directly connected to the scenario narrative and ensure response options are realistic and specific to each situation.` }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorId = crypto.randomUUID();
      console.error("AI gateway error:", { errorId, status: response.status, timestamp: new Date().toISOString() });
      return new Response(
        JSON.stringify({ injects: [], error: "Service temporarily unavailable", errorId }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in AI response");
    }

    const injectsData = JSON.parse(content);

    return new Response(JSON.stringify(injectsData), {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json",
        "X-RateLimit-Remaining": String(rateLimit.remaining)
      },
    });
  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error("Error generating injects:", { errorId, error: error instanceof Error ? error.message : "Unknown", timestamp: new Date().toISOString() });
    
    return new Response(
      JSON.stringify({ injects: [], error: "An error occurred", errorId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});