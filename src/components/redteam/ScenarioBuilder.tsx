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
  Eye
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

const ScenarioBuilder = ({ config, onScenarioReady, onBack }: ScenarioBuilderProps) => {
  const [buildMode, setBuildMode] = useState<BuildMode | null>(null);
  const [userScenario, setUserScenario] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewScenario, setPreviewScenario] = useState<Scenario | null>(null);
  const [isReady, setIsReady] = useState(false);

  const generateScenario = async (baseScenario?: string) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-redteam-scenario', {
        body: {
          brandName: config.brandName,
          duration: config.duration,
          userScenario: baseScenario || null,
          scenarioCategory: config.scenarioCategory || "random"
        }
      });

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
      toast.error("Failed to generate scenario. Please try again.");
      
      // Fallback scenario for demo purposes
      const fallbackScenario: Scenario = {
        id: crypto.randomUUID(),
        title: `${config.brandName} Executive Misconduct Allegations`,
        narrative: `Anonymous sources have begun circulating claims that a senior executive at ${config.brandName} has been involved in financial impropriety and workplace misconduct. Initial posts appeared on fringe social media platforms before being picked up by a pseudonymous "investigative journalist" account with 50,000 followers. The allegations mix verifiable public information about the executive with fabricated claims designed to damage the company's reputation.`,
        basedOnTruth: true,
        truthElement: "The named executive did recently attend a conference mentioned in the allegations, but all other claims are fabricated.",
        implicatedParties: ["[REDACTED - Senior Executive]", "[REDACTED - Board Member]"],
        severity: "severe",
        spreadPattern: "coordinated"
      };
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
              <Button
                onClick={handleConfirmScenario}
                className="uppercase tracking-widest font-bold h-14 px-8 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                <Target className="h-5 w-5 mr-3" />
                I'm Ready - Begin Exercise
              </Button>
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
