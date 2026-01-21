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
    const { injectContent, injectType, customResponse, brandName, scenarioTitle } = await req.json();
    
    if (!injectContent || !customResponse) {
      return new Response(
        JSON.stringify({ error: "Missing required fields", effectiveness: 50, feedback: "Unable to evaluate response" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      // Fallback to improved heuristic evaluation
      const effectiveness = evaluateHeuristically(customResponse, injectContent, injectType);
      return new Response(
        JSON.stringify({ 
          effectiveness: effectiveness.score, 
          feedback: effectiveness.feedback,
          wasCorrect: effectiveness.score >= 65
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are a crisis communications expert evaluating a response to a disinformation attack.

SCENARIO: ${scenarioTitle || 'Crisis simulation exercise'}
BRAND: ${brandName || 'Target organization'}

INCOMING THREAT (${injectType || 'social media post'}):
"${injectContent}"

PROPOSED RESPONSE:
"${customResponse}"

Evaluate this response on a scale of 0-100 based on crisis management best practices:

SCORING CRITERIA:
- Speed & Decisiveness (0-20): Does the response address the issue promptly? Vague or delayed responses score lower.
- Accuracy & Factual Basis (0-25): Does it stick to facts? Making claims that can't be backed up reduces score.
- Tone & Professionalism (0-20): Is it measured and professional? Defensive, aggressive, or emotional responses score lower.
- Strategic Thinking (0-20): Does it consider second-order effects? Will this response create new problems?
- Stakeholder Consideration (0-15): Does it address concerns of customers, employees, media, regulators?

COMMON MISTAKES (reduce score significantly):
- "No comment" or ignoring = 20-35%
- Threatening legal action without substance = 35-50%
- Attacking the messenger instead of addressing claims = 25-40%
- Making promises that can't be kept = 40-55%
- Being too vague or corporate = 45-60%

EFFECTIVE STRATEGIES (increase score):
- Specific factual rebuttal with evidence = 75-90%
- Transparent acknowledgment + action plan = 70-85%
- Engaging credible third parties = 75-90%
- Proactive stakeholder communication = 70-85%
- Monitoring + measured response = 60-75%

Return a JSON object with:
- effectiveness: number 0-100
- feedback: string (1-2 sentences explaining the score)
- strengths: array of strings (what the response did well)
- weaknesses: array of strings (what could be improved)`;

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
          { role: "user", content: "Evaluate this crisis response and provide a score with feedback." }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      console.error("AI gateway error:", response.status);
      const effectiveness = evaluateHeuristically(customResponse, injectContent, injectType);
      return new Response(
        JSON.stringify({ 
          effectiveness: effectiveness.score, 
          feedback: effectiveness.feedback,
          wasCorrect: effectiveness.score >= 65
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in AI response");
    }

    const evaluation = JSON.parse(content);
    
    return new Response(
      JSON.stringify({
        effectiveness: Math.min(100, Math.max(0, evaluation.effectiveness || 50)),
        feedback: evaluation.feedback || "Response evaluated",
        strengths: evaluation.strengths || [],
        weaknesses: evaluation.weaknesses || [],
        wasCorrect: (evaluation.effectiveness || 50) >= 65
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error evaluating response:", error);
    return new Response(
      JSON.stringify({ 
        effectiveness: 50, 
        feedback: "Unable to evaluate response - using default score",
        wasCorrect: false
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function evaluateHeuristically(response: string, inject: string, injectType: string): { score: number; feedback: string } {
  const lowerResponse = response.toLowerCase();
  const responseLength = response.length;
  
  let score = 40; // Base score
  let feedback = "";
  
  // Negative indicators
  if (lowerResponse.includes("no comment") || lowerResponse === "") {
    return { score: 25, feedback: "\"No comment\" rarely works in a crisis - it suggests you have something to hide." };
  }
  
  if (lowerResponse.includes("sue") || lowerResponse.includes("legal action") || lowerResponse.includes("lawyer")) {
    if (!lowerResponse.includes("investigate") && !lowerResponse.includes("evidence")) {
      return { score: 40, feedback: "Legal threats without addressing the substance can backfire and appear defensive." };
    }
  }
  
  if (lowerResponse.includes("fake news") || lowerResponse.includes("lies") || lowerResponse.includes("haters")) {
    return { score: 35, feedback: "Attacking critics or dismissing concerns outright damages credibility." };
  }
  
  // Positive indicators
  const positiveKeywords = [
    { words: ['fact', 'evidence', 'data', 'documented', 'verified'], bonus: 10, msg: "Good use of factual grounding." },
    { words: ['investigate', 'review', 'audit', 'looking into'], bonus: 8, msg: "Commitment to investigation shows accountability." },
    { words: ['customer', 'stakeholder', 'community', 'employee'], bonus: 7, msg: "Good consideration of stakeholders." },
    { words: ['transparent', 'open', 'honest', 'directly'], bonus: 8, msg: "Transparency builds trust." },
    { words: ['statement', 'announce', 'confirm', 'clarify'], bonus: 5, msg: "Clear communication approach." },
    { words: ['monitor', 'track', 'assess'], bonus: 5, msg: "Measured approach to the situation." },
    { words: ['greyguards', 'elf', 'counter-narrative', 'intelligence'], bonus: 10, msg: "Leveraging specialized crisis capabilities." }
  ];
  
  for (const group of positiveKeywords) {
    if (group.words.some(w => lowerResponse.includes(w))) {
      score += group.bonus;
      if (!feedback) feedback = group.msg;
    }
  }
  
  // Length considerations
  if (responseLength < 20) {
    score -= 15;
    feedback = "Response is too brief to address the situation effectively.";
  } else if (responseLength > 50 && responseLength < 300) {
    score += 5;
  } else if (responseLength > 500) {
    score -= 5;
    feedback = feedback || "Response may be too long for rapid crisis communication.";
  }
  
  // Inject-type specific bonuses
  if (injectType === "news_article" && (lowerResponse.includes("editor") || lowerResponse.includes("correction") || lowerResponse.includes("journalist"))) {
    score += 10;
    feedback = "Good approach to engage with media directly.";
  }
  
  if (injectType === "influencer" && (lowerResponse.includes("dm") || lowerResponse.includes("direct") || lowerResponse.includes("reach out"))) {
    score += 8;
    feedback = "Direct engagement with influencers can be effective.";
  }
  
  score = Math.min(90, Math.max(15, score));
  
  if (!feedback) {
    if (score >= 70) feedback = "Solid crisis response approach.";
    else if (score >= 55) feedback = "Adequate response but could be more strategic.";
    else feedback = "Response needs more strategic consideration.";
  }
  
  return { score, feedback };
}