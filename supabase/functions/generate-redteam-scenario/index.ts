import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiter (resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per hour per IP

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
const ScenarioInputSchema = z.object({
  brandName: z.string().min(1).max(100),
  duration: z.number().min(1).max(60),
  userScenario: z.string().max(5000).optional(),
  scenarioCategory: z.string().max(50).optional(),
  brandContext: z.string().max(12000).optional(),
});

// Brand-specific scenario categories for more variety
const SCENARIO_CATEGORIES = [
  { type: "product_safety", name: "Product Safety Crisis", description: "Claims about defective or dangerous products" },
  { type: "data_breach", name: "Data Breach Allegations", description: "Rumours of customer data being compromised" },
  { type: "environmental", name: "Environmental Violation", description: "False claims about pollution or eco damage" },
  { type: "labor_practices", name: "Labour Practice Scandal", description: "Disinformation about worker treatment" },
  { type: "financial_fraud", name: "Financial Misconduct", description: "Rumours of accounting irregularities" },
  { type: "supply_chain", name: "Supply Chain Controversy", description: "Allegations about unethical sourcing" },
  { type: "ai_ethics", name: "AI Ethics Scandal", description: "Claims about harmful AI use or bias" },
  { type: "health_claims", name: "Health Misinformation", description: "False claims about health impacts of products" },
  { type: "political_ties", name: "Political Entanglement", description: "Fabricated connections to controversial figures" },
];

// Generate a varied fallback based on brand characteristics
function generateFallbackScenario(brandName: string, categoryType?: string): any {
  // Honour the requested category when there is one; otherwise vary by brand and
  // run so repeat sessions don't always land on the same crisis.
  const requested = categoryType && categoryType !== "random"
    ? SCENARIO_CATEGORIES.find((c) => c.type === categoryType)
    : undefined;
  const seed = brandName.toLowerCase().split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    + Math.floor(Math.random() * SCENARIO_CATEGORIES.length);
  const category = requested || SCENARIO_CATEGORIES[seed % SCENARIO_CATEGORIES.length];
  
  const fallbacks: Record<string, any> = {
    product_safety: {
      title: `${brandName} Product Safety Claims Spread`,
      narrative: `Posts on fringe forums claim ${brandName} products contain hazardous materials. Bot accounts pushed the claim onto X and TikTok overnight, using a fake "whistleblower" quote and doctored test photos. The hashtag is now trending.`,
      basedOnTruth: false,
      implicatedParties: ["[REDACTED - Product Manager]", "[REDACTED - Quality Assurance Lead]"],
      severity: "severe",
      spreadPattern: "coordinated"
    },
    data_breach: {
      title: `Alleged ${brandName} Customer Data Leak`,
      narrative: `Anonymous accounts claim ${brandName} suffered a data breach affecting millions of customers. Screenshots of supposed leaked records are spreading on X and Telegram. No breach has been confirmed, but journalists are starting to ask questions.`,
      basedOnTruth: false,
      implicatedParties: ["[REDACTED - CTO]", "[REDACTED - Security Director]"],
      severity: "critical",
      spreadPattern: "viral"
    },
    environmental: {
      title: `${brandName} Hit by Dumping Claims`,
      narrative: `Fake satellite images claim ${brandName} is illegally dumping waste. Activist accounts — some identified as bots — are sharing the images and calling for a boycott.`,
      basedOnTruth: false,
      implicatedParties: ["[REDACTED - Operations Director]", "[REDACTED - Sustainability Lead]"],
      severity: "severe",
      spreadPattern: "coordinated"
    },
    labor_practices: {
      title: `${brandName} Worker Treatment Claims`,
      narrative: `Accounts on TikTok and Reddit allege poor conditions at ${brandName} sites, using out-of-context video and fabricated staff quotes. A boycott hashtag is gaining traction. A small number of the complaints echo real concerns raised internally.`,
      basedOnTruth: true,
      truthElement: "Some employees have previously raised minor workplace concerns through proper channels",
      implicatedParties: ["[REDACTED - HR Director]", "[REDACTED - Facility Manager]"],
      severity: "moderate",
      spreadPattern: "organic"
    },
    financial_fraud: {
      title: `${brandName} Accounting Rumours Circulate`,
      narrative: `Anonymous finance accounts claim ${brandName} is hiding losses, sharing fake "leaked" accounts on investor forums. The timing, days before results, suggests a coordinated short-seller play.`,
      basedOnTruth: false,
      implicatedParties: ["[REDACTED - CFO]", "[REDACTED - Board Member]"],
      severity: "critical",
      spreadPattern: "coordinated"
    },
    supply_chain: {
      title: `${brandName} Sourcing Under Attack`,
      narrative: `Fake shipping documents claim ${brandName} sources from sanctioned regions. Activist groups are sharing the documents without checking them.`,
      basedOnTruth: false,
      implicatedParties: ["[REDACTED - Procurement Lead]", "[REDACTED - Compliance Officer]"],
      severity: "severe",
      spreadPattern: "organic"
    },
    ai_ethics: {
      title: `${brandName} AI Bias Claims Trend`,
      narrative: `Posts claim ${brandName}'s AI systems discriminate, using cherry-picked examples. #${brandName.replace(/\s/g, '')}Bias is trending and commentators are weighing in before any facts are checked.`,
      basedOnTruth: false,
      implicatedParties: ["[REDACTED - AI Lead]", "[REDACTED - Data Science Director]"],
      severity: "moderate",
      spreadPattern: "viral"
    },
    health_claims: {
      title: `${brandName} Health Scare Spreads`,
      narrative: `Wellness influencers claim ${brandName} products cause health problems, citing fake experts. A recall petition is gathering signatures.`,
      basedOnTruth: false,
      implicatedParties: ["[REDACTED - Product Development]", "[REDACTED - Regulatory Affairs]"],
      severity: "severe",
      spreadPattern: "organic"
    },
    political_ties: {
      title: `${brandName} Donation Story Fabricated`,
      narrative: `Forged documents claim ${brandName} secretly funded extremist groups. Bot networks on both sides of politics are pushing boycott calls.`,
      basedOnTruth: false,
      implicatedParties: ["[REDACTED - CEO]", "[REDACTED - Government Affairs]"],
      severity: "critical",
      spreadPattern: "coordinated"
    }
  };
  
  return fallbacks[category.type] || fallbacks.product_safety;
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

  // Rate limiting check
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(clientIp);
  
  if (!rateLimit.allowed) {
    console.warn("Rate limit exceeded:", { clientIp, timestamp: new Date().toISOString() });
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Try again later." }),
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
    const parseResult = ScenarioInputSchema.safeParse(body);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { brandName, duration, userScenario, scenarioCategory, brandContext } = parseResult.data;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      const fallback = generateFallbackScenario(brandName);
      return new Response(
        JSON.stringify({ error: "Service configuration error", ...fallback }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use selected category or pick random
    let selectedCategory;
    if (scenarioCategory && scenarioCategory !== "random") {
      selectedCategory = SCENARIO_CATEGORIES.find(c => c.type === scenarioCategory) || SCENARIO_CATEGORIES[Math.floor(Math.random() * SCENARIO_CATEGORIES.length)];
    } else {
      selectedCategory = SCENARIO_CATEGORIES[Math.floor(Math.random() * SCENARIO_CATEGORIES.length)];
    }

    const canonBlock = brandContext
      ? `\n\nCANON BRIEFING — you MUST build the scenario inside these facts. Use the named (fictional) executives verbatim rather than "[REDACTED]" placeholders, and reference the listed trade publications and prior incidents where useful. Do not contradict the briefing.\n${brandContext}\n`
      : "";

    const systemPrompt = `You write short, realistic but fictional disinformation crisis scenarios for executive training exercises.

Task: a ${selectedCategory.name} scenario (${selectedCategory.description}) for "${brandName}", a ${duration}-minute exercise.

Work out what ${brandName} actually does and fit the crisis to that sector (e.g. for a military body, "product safety" means equipment reliability; for a charity, "financial fraud" means donation misuse).

Style: plain English for busy executives who skim. Short sentences, no corporate jargon. Say what is claimed, where it started, where it is spreading — in that order.

Return a JSON object with these exact fields:
- title: A concise, impactful title mentioning ${brandName} by name (max 8 words)
- narrative: ONE short paragraph, 3-4 sentences, 60 words maximum. Cover: what the false claim is, where it started, where it's spreading now. Plain English, no jargon.
- basedOnTruth: Boolean - whether the narrative contains any real/true elements that are being twisted
- truthElement: If basedOnTruth is true, explain what the kernel of truth is
- implicatedParties: Array of 2-3 roles appropriate to ${brandName}'s organization type (use generic titles like "[REDACTED - Senior Officer]" or "[REDACTED - Department Head]" instead of real names)
- severity: "moderate", "severe", or "critical"
- spreadPattern: "viral" (organic fast spread), "coordinated" (bot/troll farm), or "organic" (slow natural spread)${canonBlock}`;

    const userPrompt = userScenario 
      ? `The user has provided this scenario outline. Tighten it into a short, plain-English scenario while keeping the core concept:\n\n"${userScenario}"\n\nKeep the narrative under 60 words, one paragraph. Specific to what ${brandName} actually does.`
      : `First, determine what "${brandName}" most likely is (their industry, purpose, and operations). Then create a short, original ${selectedCategory.name.toLowerCase()} disinformation scenario specific to that organisation. Name real platforms (X, Reddit, TikTok, Telegram). Keep the narrative under 60 words, one paragraph, plain English a busy executive can absorb in seconds.`;

    console.log("Generating scenario:", { brandName, duration, category: selectedCategory.type, clientIp, remaining: rateLimit.remaining });

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
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        // Keep generation snappy: this is a short JSON payload and the preview
        // must land well inside the client's wait window.
        reasoning_effort: "low",
        max_completion_tokens: 600
      }),
    });

    if (!response.ok) {
      const errorId = crypto.randomUUID();
      console.error("AI gateway error:", { errorId, status: response.status, timestamp: new Date().toISOString() });
      const fallback = generateFallbackScenario(brandName, selectedCategory.type);
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable", errorId, ...fallback }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in AI response");
    }

    let parsed = JSON.parse(content);
    // The model sometimes wraps the object in an array or a container key
    if (Array.isArray(parsed)) parsed = parsed[0];
    if (parsed && typeof parsed === "object" && !parsed.title) {
      const nested = Object.values(parsed).find(
        (v) => v && typeof v === "object" && !Array.isArray(v) && (v as any).title
      );
      const nestedArray = Object.values(parsed).find(
        (v) => Array.isArray(v) && v[0] && typeof v[0] === "object" && (v[0] as any).title
      ) as any[] | undefined;
      if (nested) parsed = nested;
      else if (nestedArray) parsed = nestedArray[0];
    }
    if (!parsed || !parsed.title || !parsed.narrative) {
      throw new Error("Malformed AI scenario response");
    }
    const scenario = parsed;

    return new Response(JSON.stringify(scenario), {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json",
        "X-RateLimit-Remaining": String(rateLimit.remaining)
      },
    });
  } catch (error) {
    const errorId = crypto.randomUUID();
    console.error("Error generating scenario:", { errorId, error: error instanceof Error ? error.message : "Unknown", timestamp: new Date().toISOString() });
    const fallback = generateFallbackScenario("Brand");
    return new Response(
      JSON.stringify({ error: "An error occurred", errorId, ...fallback }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});