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
});

// Brand-specific scenario categories for more variety
const SCENARIO_CATEGORIES = [
  { type: "product_safety", name: "Product Safety Crisis", description: "Claims about defective or dangerous products" },
  { type: "data_breach", name: "Data Breach Allegations", description: "Rumours of customer data being compromised" },
  { type: "environmental", name: "Environmental Violation", description: "False claims about pollution or eco damage" },
  { type: "labor_practices", name: "Labour Practice Scandal", description: "Disinformation about worker treatment" },
  { type: "financial_fraud", name: "Financial Misconduct", description: "Rumours of accounting irregularities" },
  { type: "astroturfing", name: "Astroturfing Accusations", description: "Claims the brand uses fake grassroots support" },
  { type: "supply_chain", name: "Supply Chain Controversy", description: "Allegations about unethical sourcing" },
  { type: "ai_ethics", name: "AI Ethics Scandal", description: "Claims about harmful AI use or bias" },
  { type: "health_claims", name: "Health Misinformation", description: "False claims about health impacts of products" },
  { type: "political_ties", name: "Political Entanglement", description: "Fabricated connections to controversial figures" },
];

// Generate a varied fallback based on brand characteristics
function generateFallbackScenario(brandName: string): any {
  const seed = brandName.toLowerCase().split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const category = SCENARIO_CATEGORIES[seed % SCENARIO_CATEGORIES.length];
  
  const fallbacks: Record<string, any> = {
    product_safety: {
      title: `${brandName} Product Safety Concerns Go Viral`,
      narrative: `A coordinated campaign has emerged claiming that ${brandName}'s products contain hazardous materials. The initial posts appeared on fringe forums before being amplified by bot networks. Key claims include unverified "whistleblower" testimony and manipulated product testing images. The narrative is spreading rapidly across mainstream social platforms.`,
      basedOnTruth: false,
      implicatedParties: ["[REDACTED - Product Manager]", "[REDACTED - Quality Assurance Lead]"],
      severity: "severe",
      spreadPattern: "coordinated"
    },
    data_breach: {
      title: `Alleged ${brandName} Customer Data Exposed`,
      narrative: `Anonymous accounts are circulating claims that ${brandName} suffered a massive data breach affecting millions of customers. Screenshots purporting to show leaked customer records are being shared widely. The campaign appears timed to coincide with an industry event. No official confirmation exists, but the narrative is gaining traction with mainstream media.`,
      basedOnTruth: false,
      implicatedParties: ["[REDACTED - CTO]", "[REDACTED - Security Director]"],
      severity: "critical",
      spreadPattern: "viral"
    },
    environmental: {
      title: `${brandName} Environmental Scandal Emerges`,
      narrative: `A disinformation campaign is targeting ${brandName} with fabricated claims about illegal waste dumping. Doctored satellite images and fake regulatory documents are being circulated. Environmental activist accounts (some identified as bot networks) are amplifying the narrative and calling for boycotts.`,
      basedOnTruth: false,
      implicatedParties: ["[REDACTED - Operations Director]", "[REDACTED - Sustainability Lead]"],
      severity: "severe",
      spreadPattern: "coordinated"
    },
    labor_practices: {
      title: `${brandName} Worker Treatment Under Attack`,
      narrative: `Coordinated accounts are spreading allegations about poor working conditions at ${brandName} facilities. The campaign uses out-of-context video clips and fabricated employee testimonials. A trending hashtag has emerged calling for consumer boycotts. Some claims mix genuine workplace complaints with exaggerated falsehoods.`,
      basedOnTruth: true,
      truthElement: "Some employees have previously raised minor workplace concerns through proper channels",
      implicatedParties: ["[REDACTED - HR Director]", "[REDACTED - Facility Manager]"],
      severity: "moderate",
      spreadPattern: "organic"
    },
    financial_fraud: {
      title: `${brandName} Financial Irregularities Alleged`,
      narrative: `Short-seller networks and anonymous financial accounts are spreading claims about accounting fraud at ${brandName}. Fake "leaked" financial documents are circulating on investor forums. The timing coincides with quarterly earnings, suggesting a coordinated manipulation attempt.`,
      basedOnTruth: false,
      implicatedParties: ["[REDACTED - CFO]", "[REDACTED - Board Member]"],
      severity: "critical",
      spreadPattern: "coordinated"
    },
    astroturfing: {
      title: `${brandName} Accused of Fake Reviews Campaign`,
      narrative: `Investigative accounts claim to have evidence that ${brandName} operates a network of fake review accounts and paid influencers who don't disclose sponsorship. The allegations include screenshots of supposed internal communications about "reputation management" tactics.`,
      basedOnTruth: false,
      implicatedParties: ["[REDACTED - Marketing Director]", "[REDACTED - Agency Partner]"],
      severity: "moderate",
      spreadPattern: "viral"
    },
    supply_chain: {
      title: `${brandName} Supply Chain Ethics Under Fire`,
      narrative: `A campaign is spreading claims that ${brandName}'s supply chain involves unethical labour practices or sourcing from sanctioned regions. Fake shipping manifests and supplier documents are being shared. Activist groups are amplifying the narrative without verification.`,
      basedOnTruth: false,
      implicatedParties: ["[REDACTED - Procurement Lead]", "[REDACTED - Compliance Officer]"],
      severity: "severe",
      spreadPattern: "organic"
    },
    ai_ethics: {
      title: `${brandName} AI Systems Face Bias Allegations`,
      narrative: `Claims are circulating that ${brandName}'s AI systems exhibit discriminatory behaviour. The campaign uses cherry-picked examples and misleading statistics. Tech commentators are weighing in before any independent verification, and the hashtag #${brandName.replace(/\s/g, '')}Bias is trending.`,
      basedOnTruth: false,
      implicatedParties: ["[REDACTED - AI Lead]", "[REDACTED - Data Science Director]"],
      severity: "moderate",
      spreadPattern: "viral"
    },
    health_claims: {
      title: `Health Concerns Over ${brandName} Products`,
      narrative: `Wellness influencers and alternative health accounts are spreading unverified claims that ${brandName} products cause adverse health effects. The campaign uses pseudo-scientific language and fake expert testimonials. A petition calling for product recalls is gaining signatures.`,
      basedOnTruth: false,
      implicatedParties: ["[REDACTED - Product Development]", "[REDACTED - Regulatory Affairs]"],
      severity: "severe",
      spreadPattern: "organic"
    },
    political_ties: {
      title: `${brandName} Political Donation Controversy`,
      narrative: `Fabricated documents claiming ${brandName} made secret political donations to extremist groups are being circulated. The campaign is timed to exploit current political tensions. Bot networks are amplifying calls for boycotts from both sides of the political spectrum.`,
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
    
    const { brandName, duration, userScenario, scenarioCategory } = parseResult.data;
    
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

    const systemPrompt = `You are an expert in crisis communications, disinformation campaigns, and brand reputation management. Your role is to create realistic but fictional crisis scenarios for training exercises.

CRITICAL FIRST STEP - ANALYZE THE BRAND:
Before creating any scenario, you MUST first analyze "${brandName}" to understand:
1. What industry/sector is this brand in? (e.g., military, tech, healthcare, retail, government, NGO, etc.)
2. What is their primary purpose/mission? (e.g., national defense, selling products, providing services, etc.)
3. What are their likely operations, stakeholders, and public perception?
4. What types of crises would be MOST RELEVANT to this specific organization?

BRAND CONTEXT EXAMPLES:
- "British Army" → Military/Defense → Scenarios about recruitment practices, veterans treatment, operations transparency, equipment failures, leaked intelligence
- "Apple" → Consumer Tech → Product safety, privacy, supply chain, labor practices
- "NHS" → Healthcare → Patient data, treatment quality, resource allocation, staff conditions
- "Greenpeace" → NGO/Activism → Funding sources, campaign effectiveness, internal practices

Now generate a disinformation scenario for "${brandName}" in the category: ${selectedCategory.name} (${selectedCategory.description}).

ADAPT THE CRISIS CATEGORY TO THE BRAND:
The category "${selectedCategory.type}" should be interpreted through the lens of what "${brandName}" actually does:
- For military orgs: "product_safety" → equipment/weapons reliability; "data_breach" → intelligence/personnel data leaks
- For governments: "labor_practices" → civil servant treatment; "environmental" → policy failures
- For charities: "financial_fraud" → donation misuse; "astroturfing" → fake grassroots campaigns

The scenario should be:
- DEEPLY SPECIFIC to ${brandName}'s actual likely purpose and operations
- Reference realistic aspects of their work (not generic corporate scenarios)
- Based on common disinformation tactics (mixing truth with lies, emotional manipulation, coordinated amplification)
- Challenging but not impossible to counter
- Appropriate for a ${duration}-minute crisis simulation exercise

Return a JSON object with these exact fields:
- title: A concise, impactful title mentioning ${brandName} by name
- narrative: A 2-3 paragraph description of the disinformation campaign that is SPECIFIC to what ${brandName} does. Include how it started, what's being claimed, and how it's spreading. Be specific about platforms, tactics, and timeline.
- basedOnTruth: Boolean - whether the narrative contains any real/true elements that are being twisted
- truthElement: If basedOnTruth is true, explain what the kernel of truth is
- implicatedParties: Array of 2-3 roles appropriate to ${brandName}'s organization type (use generic titles like "[REDACTED - Senior Officer]" or "[REDACTED - Department Head]" instead of real names)
- severity: "moderate", "severe", or "critical"
- spreadPattern: "viral" (organic fast spread), "coordinated" (bot/troll farm), or "organic" (slow natural spread)`;

    const userPrompt = userScenario 
      ? `The user has provided this scenario outline. Enhance and professionalize it while keeping the core concept:\n\n"${userScenario}"\n\nMake it more realistic with specific details, spreading patterns, and implicated parties. Ensure it's deeply specific to what ${brandName} actually does as an organization.`
      : `First, determine what "${brandName}" most likely is (their industry, purpose, and operations). Then create a completely original ${selectedCategory.name.toLowerCase()} disinformation scenario that is HIGHLY RELEVANT to that type of organization. Do NOT use generic corporate scenarios - make it specific to what this brand actually does. Include specific platform names (Twitter/X, Reddit, TikTok, Telegram, etc.), realistic account types that would target this brand, and a clear timeline of how the narrative is developing.`;

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
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorId = crypto.randomUUID();
      console.error("AI gateway error:", { errorId, status: response.status, timestamp: new Date().toISOString() });
      const fallback = generateFallbackScenario(brandName);
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

    const scenario = JSON.parse(content);

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