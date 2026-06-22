import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  ArrowLeft, 
  Sparkles, 
  PenLine, 
  AlertTriangle, 
  ChevronRight,
  Loader2,
  Shield,
  Target,
  Eye,
  RefreshCw
} from "lucide-react";
import { ExerciseConfig, Scenario } from "@/pages/RedTeam";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Countdown component that actually counts down
const CountdownToStart = ({ onComplete }: { onComplete: () => void }) => {
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count <= 0) {
      onComplete();
      return;
    }

    const timer = setTimeout(() => {
      setCount(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [count, onComplete]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-32 h-32 mx-auto border-4 border-destructive flex items-center justify-center mb-8 animate-pulse">
          <span className="text-6xl font-bold text-destructive">{count}</span>
        </div>
        <h2 className="text-2xl font-bold uppercase tracking-wider mb-4">Exercise Starting...</h2>
        <p className="text-muted-foreground mb-8">The narrative is spreading. Counter it effectively.</p>
      </div>
    </div>
  );
};

interface ScenarioBuilderProps {
  config: ExerciseConfig;
  onScenarioReady: (scenario: Scenario) => void;
  onBack: () => void;
}

type BuildMode = "generate" | "write";

const SCENARIO_GENERATION_TIMEOUT_MS = 12000;

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("Scenario generation timed out")), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

const ScenarioBuilder = ({ config, onScenarioReady, onBack }: ScenarioBuilderProps) => {
  const [buildMode, setBuildMode] = useState<BuildMode | null>(null);
  const [userScenario, setUserScenario] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewScenario, setPreviewScenario] = useState<Scenario | null>(null);
  const [isReady, setIsReady] = useState(false);

  const generateScenario = async (baseScenario?: string) => {
    setIsGenerating(true);
    try {
      const { data, error } = await withTimeout(
        supabase.functions.invoke('generate-redteam-scenario', {
          body: {
            brandName: config.brandName,
            duration: config.duration,
            ...(baseScenario?.trim() ? { userScenario: baseScenario.trim() } : {}),
            scenarioCategory: config.scenarioCategory || "random"
          }
        }),
        SCENARIO_GENERATION_TIMEOUT_MS
      );

      if (error) throw error;

      const scenario: Scenario = {
        id: crypto.randomUUID(),
        title: data.title,
        narrative: data.narrative,
        basedOnTruth: data.basedOnTruth,
        truthElement: data.truthElement,
        implicatedParties: data.implicatedParties || [],
        severity: data.severity || "severe",
        spreadPattern: data.spreadPattern || "viral"
      };

      setPreviewScenario(scenario);
    } catch (error) {
      console.error("Error generating scenario:", error);
      toast.warning("Using a fallback scenario while generation recovers.");
 
      // Fallback scenario for demo purposes (avoid repeating the exec-misconduct scenario)
      const category = (config.scenarioCategory || "random") as string;
      const pick = (key: string) => key === "random" ? "product_safety" : key;
      const type = pick(category);

      const fallbacks: Record<string, Omit<Scenario, "id">> = {
        product_safety: {
          title: `${config.brandName} Product Safety Claims Go Viral`,
          narrative: `A coordinated campaign is alleging that ${config.brandName}'s products pose safety risks. Doctored images and out-of-context test results are circulating, and the narrative is spreading rapidly across social platforms. Some posts cite a legitimate past recall in the wider industry, but the core claims are unverified and exaggerated.`,
          basedOnTruth: true,
          truthElement: "A similar safety issue occurred in the industry previously, but the current claims about this product are unsubstantiated.",
          implicatedParties: ["[REDACTED - Product Lead]", "[REDACTED - Quality Lead]"],
          severity: "severe",
          spreadPattern: "coordinated",
        },
        data_breach: {
          title: `Alleged ${config.brandName} Customer Data Leak`,
          narrative: `Anonymous accounts are claiming that ${config.brandName} suffered a data breach. Screenshots of purported customer records are being shared, alongside a fake "breach notification" email. The story is gaining traction with tech commentators before any verification.`,
          basedOnTruth: false,
          truthElement: undefined,
          implicatedParties: ["[REDACTED - Security Lead]", "[REDACTED - Engineering Lead]"],
          severity: "critical",
          spreadPattern: "viral",
        },
        environmental: {
          title: `${config.brandName} Environmental Violation Rumours`,
          narrative: `A disinformation narrative alleges ${config.brandName} is responsible for environmental harm. Doctored documents and misleading images are circulating, prompting calls for boycotts. Activist accounts amplify the claims while key details remain unverified.`,
          basedOnTruth: false,
          truthElement: undefined,
          implicatedParties: ["[REDACTED - Operations Lead]", "[REDACTED - Sustainability Lead]"],
          severity: "severe",
          spreadPattern: "organic",
        },
        labor_practices: {
          title: `${config.brandName} Labour Practices Under Attack`,
          narrative: `Coordinated posts accuse ${config.brandName} of abusive labour practices. Some content uses real workplace anecdotes, but key allegations are embellished with fabricated screenshots and anonymous "whistleblower" claims. The narrative is spreading via short-form video and repost networks.`,
          basedOnTruth: true,
          truthElement: "There have been minor workplace complaints in the past, but the current claims are amplified and distorted.",
          implicatedParties: ["[REDACTED - HR Lead]", "[REDACTED - Site Manager]"],
          severity: "moderate",
          spreadPattern: "viral",
        },
        financial_fraud: {
          title: `${config.brandName} Financial Irregularities Alleged`,
          narrative: `Investor forums and anonymous accounts are spreading claims that ${config.brandName} is hiding financial issues. Fake documents and misleading charts are circulating, timed to coincide with a reporting cycle. The narrative aims to erode trust and trigger panic reactions.`,
          basedOnTruth: false,
          truthElement: undefined,
          implicatedParties: ["[REDACTED - Finance Lead]", "[REDACTED - Audit Committee]"],
          severity: "critical",
          spreadPattern: "coordinated",
        },
        astroturfing: {
          title: `${config.brandName} Accused of Astroturfing`,
          narrative: `A narrative claims ${config.brandName} runs a fake grassroots campaign using coordinated accounts and paid influencers. Cherry-picked evidence is presented as definitive proof, pushing a boycott movement across multiple platforms.`,
          basedOnTruth: false,
          truthElement: undefined,
          implicatedParties: ["[REDACTED - Marketing Lead]", "[REDACTED - Agency Partner]"],
          severity: "moderate",
          spreadPattern: "coordinated",
        },
        supply_chain: {
          title: `${config.brandName} Supply Chain Controversy`,
          narrative: `Posts allege ${config.brandName} sources from unethical suppliers. Fake shipping manifests and supplier lists circulate alongside emotional stories designed to provoke outrage. Pressure builds for an immediate public response before facts are established.`,
          basedOnTruth: false,
          truthElement: undefined,
          implicatedParties: ["[REDACTED - Procurement Lead]", "[REDACTED - Compliance Lead]"],
          severity: "severe",
          spreadPattern: "organic",
        },
        ai_ethics: {
          title: `${config.brandName} AI Ethics Allegations`,
          narrative: `A narrative claims ${config.brandName}'s AI systems are biased or harmful. Examples are cherry-picked and context removed. Tech influencers amplify the story, and stakeholders demand transparency and remediation steps.`,
          basedOnTruth: false,
          truthElement: undefined,
          implicatedParties: ["[REDACTED - AI Lead]", "[REDACTED - Data Lead]"],
          severity: "moderate",
          spreadPattern: "viral",
        },
        health_claims: {
          title: `Health Claims About ${config.brandName} Spread`,
          narrative: `Wellness accounts push claims that ${config.brandName}'s products cause health harms. Pseudo-scientific language and fake testimonials circulate, triggering anxiety and calls for recalls.`,
          basedOnTruth: false,
          truthElement: undefined,
          implicatedParties: ["[REDACTED - Regulatory Lead]", "[REDACTED - Product Lead]"],
          severity: "severe",
          spreadPattern: "organic",
        },
        political_ties: {
          title: `${config.brandName} Political Entanglement Narrative`,
          narrative: `Fabricated claims link ${config.brandName} to controversial political actors. Bot networks amplify contradictory takes to polarise audiences, driving reputational damage from multiple angles.`,
          basedOnTruth: false,
          truthElement: undefined,
          implicatedParties: ["[REDACTED - Comms Lead]", "[REDACTED - Government Affairs]"],
          severity: "critical",
          spreadPattern: "coordinated",
        },
      };

      const chosen = fallbacks[type] || fallbacks.product_safety;
      const fallbackScenario: Scenario = { id: crypto.randomUUID(), ...chosen };
      setPreviewScenario(fallbackScenario);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleModeSelect = async (mode: BuildMode) => {
    setBuildMode(mode);
    if (mode === "generate") {
      await generateScenario();
    }
  };

  const handleSubmitUserScenario = async () => {
    if (!userScenario.trim()) {
      toast.error("Please describe your scenario first");
      return;
    }
    await generateScenario(userScenario);
  };

  const handleConfirmScenario = () => {
    setIsReady(true);
  };

  const handleBeginExercise = () => {
    if (previewScenario) {
      onScenarioReady(previewScenario);
    }
  };

  // Initial mode selection
  if (!buildMode) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8">
        <div className="max-w-3xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={onBack} 
            className="mb-6 uppercase tracking-wider"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="text-center mb-8">
            <Badge variant="outline" className="mb-4 border-warning text-warning uppercase tracking-wider">
              Step 1 of 2
            </Badge>
            <h1 className="text-3xl font-bold uppercase tracking-wider mb-2">Build Your Scenario</h1>
            <p className="text-muted-foreground">Choose how to create the crisis scenario for {config.brandName}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card 
              className="border-4 border-border bg-card hover:border-primary transition-all cursor-pointer group"
              onClick={() => handleModeSelect("generate")}
            >
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 mx-auto bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Sparkles className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-wider mb-2">Generate Scenario</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  AI creates a realistic disinformation scenario tailored to your brand
                </p>
                <Button className="uppercase tracking-wider group-hover:bg-primary">
                  Generate <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <Card 
              className="border-4 border-border bg-card hover:border-warning transition-all cursor-pointer group"
              onClick={() => handleModeSelect("write")}
            >
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 mx-auto bg-warning/10 flex items-center justify-center mb-4 group-hover:bg-warning/20 transition-colors">
                  <PenLine className="h-10 w-10 text-warning" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-wider mb-2">Write Your Own</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Describe your scenario and AI will enhance and bring it to life
                </p>
                <Button variant="outline" className="uppercase tracking-wider border-warning text-warning hover:bg-warning/10">
                  Write <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // User writing their scenario
  if (buildMode === "write" && !previewScenario) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8">
        <div className="max-w-3xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => setBuildMode(null)} 
            className="mb-6 uppercase tracking-wider"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <Card className="border-4 border-border bg-card">
            <CardHeader className="border-b-4 border-border">
              <CardTitle className="flex items-center gap-3 uppercase tracking-wider">
                <PenLine className="h-5 w-5 text-warning" />
                Describe Your Scenario
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <Label className="text-sm uppercase tracking-wider font-medium mb-2 block">
                  Crisis Scenario Description
                </Label>
                <Textarea
                  value={userScenario}
                  onChange={(e) => setUserScenario(e.target.value)}
                  placeholder={`Describe a disinformation crisis scenario targeting ${config.brandName}. Include details like:
                  
• What false claims are being made?
• Who might be behind the attack?
• What platforms is it spreading on?
• Is there any kernel of truth being twisted?

The AI will enhance your scenario with realistic details and create dynamic injects for the exercise.`}
                  className="min-h-[250px] border-2 border-border"
                />
              </div>

              <Button
                onClick={handleSubmitUserScenario}
                disabled={!userScenario.trim() || isGenerating}
                className="w-full uppercase tracking-wider h-12"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enhancing Scenario...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Enhance & Continue
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Loading state
  if (isGenerating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-16 w-16 mx-auto mb-6 animate-spin text-primary" />
          <h2 className="text-2xl font-bold uppercase tracking-wider mb-2">Generating Scenario</h2>
          <p className="text-muted-foreground">Creating a realistic crisis scenario for {config.brandName}...</p>
        </div>
      </div>
    );
  }

  // Preview scenario before starting
  if (previewScenario && !isReady) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8">
        <div className="max-w-3xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => {
              setBuildMode(null);
              setPreviewScenario(null);
            }} 
            className="mb-6 uppercase tracking-wider"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="text-center mb-8">
            <Badge variant="outline" className="mb-4 border-destructive text-destructive uppercase tracking-wider animate-pulse">
              Scenario Preview
            </Badge>
            <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-wider mb-2">
              {previewScenario.title}
            </h1>
          </div>

          <Card className="border-4 border-destructive/30 bg-card mb-6">
            <CardContent className="p-6 space-y-6">
              <div className="flex flex-wrap gap-3 justify-center">
                <Badge variant="outline" className={`uppercase tracking-wider ${
                  previewScenario.severity === "critical" ? "border-destructive text-destructive" :
                  previewScenario.severity === "severe" ? "border-warning text-warning" :
                  "border-muted text-muted-foreground"
                }`}>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {previewScenario.severity} Threat
                </Badge>
                <Badge variant="outline" className="uppercase tracking-wider border-muted">
                  {previewScenario.spreadPattern} Spread
                </Badge>
                {previewScenario.basedOnTruth && (
                  <Badge variant="outline" className="uppercase tracking-wider border-warning text-warning">
                    Contains Truth Elements
                  </Badge>
                )}
              </div>

              <div className="p-4 bg-muted border-l-4 border-destructive">
                <p className="text-foreground leading-relaxed">{previewScenario.narrative}</p>
              </div>

              {previewScenario.basedOnTruth && previewScenario.truthElement && (
                <div className="p-4 bg-warning/10 border-l-4 border-warning">
                  <div className="flex items-start gap-2">
                    <Eye className="h-5 w-5 text-warning mt-0.5" />
                    <div>
                      <span className="font-bold uppercase tracking-wider text-sm text-warning">Truth Element</span>
                      <p className="text-sm text-muted-foreground mt-1">{previewScenario.truthElement}</p>
                    </div>
                  </div>
                </div>
              )}

              {previewScenario.implicatedParties.length > 0 && (
                <div className="p-4 bg-muted">
                  <span className="font-bold uppercase tracking-wider text-sm block mb-2">Implicated Parties</span>
                  <div className="flex flex-wrap gap-2">
                    {previewScenario.implicatedParties.map((party, i) => (
                      <Badge key={i} variant="secondary" className="uppercase">
                        {party}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-4 border-border bg-card">
            <CardContent className="p-6 text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-bold uppercase tracking-wider mb-2">Ready to Counter This Narrative?</h3>
              <p className="text-muted-foreground mb-6">
                You have {config.duration} minutes to respond to this crisis. Think carefully, the clock is ticking.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => generateScenario(buildMode === "write" ? userScenario : undefined)}
                  disabled={isGenerating}
                  className="uppercase tracking-widest font-bold h-14 px-6"
                >
                  <RefreshCw className={`h-5 w-5 mr-3 ${isGenerating ? 'animate-spin' : ''}`} />
                  Regenerate Scenario
                </Button>
                <Button
                  onClick={handleConfirmScenario}
                  disabled={isGenerating}
                  className="uppercase tracking-widest font-bold h-14 px-8 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  <Target className="h-5 w-5 mr-3" />
                  I'm Ready - Begin Exercise
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Ready confirmation - countdown to start
  if (isReady && previewScenario) {
    return <CountdownToStart onComplete={handleBeginExercise} />;
  }

  return null;
};

export default ScenarioBuilder;
