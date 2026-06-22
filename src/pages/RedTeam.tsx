import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Target, 
  Clock, 
  Users, 
  Crosshair, 
  ArrowRight,
  Zap,
  AlertTriangle,
  Timer,
  Shuffle,
  LockOpen,
  Leaf,
  HardHat,
  DollarSign,
  Bot,
  Package,
  Cpu,
  Pill,
  Landmark,
  Lock,
  type LucideIcon
} from "lucide-react";
import greyguardsLogo from "@/assets/greyguards-logo.png";
import ScenarioBuilder from "@/components/redteam/ScenarioBuilder";
import ExercisePlayer from "@/components/redteam/ExercisePlayer";
import ConsultantDashboard from "@/components/redteam/ConsultantDashboard";
import ExerciseDebrief from "@/components/redteam/ExerciseDebrief";
import TeamJoin from "@/components/redteam/TeamJoin";
import BlueTeamDashboard from "@/components/redteam/BlueTeamDashboard";
import RedTeamDashboard from "@/components/redteam/RedTeamDashboard";
import { useAccessProfile } from "@/hooks/useAccessProfile";
import { DEMO_COMPANY_LIST, DEMO_COMPANIES } from "@/lib/demoData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


// Icon mapping for scenario categories
const scenarioIconMap: Record<string, LucideIcon> = {
  "shuffle": Shuffle,
  "alert-triangle": AlertTriangle,
  "lock-open": LockOpen,
  "leaf": Leaf,
  "hard-hat": HardHat,
  "dollar-sign": DollarSign,
  "bot": Bot,
  "package": Package,
  "cpu": Cpu,
  "pill": Pill,
  "landmark": Landmark,
};

const ScenarioIcon = ({ name, className }: { name: string; className?: string }) => {
  const IconComponent = scenarioIconMap[name] || AlertTriangle;
  return <IconComponent className={className} />;
};


export type ExerciseMode = "self" | "consultant";
export type ExerciseDuration = 10 | 20 | 30;
export type TeamMode = "solo" | "team-vs-team";

export type ScenarioCategory = 
  | "random"
  | "product_safety"
  | "data_breach"
  | "environmental"
  | "labor_practices"
  | "financial_fraud"
  | "astroturfing"
  | "supply_chain"
  | "ai_ethics"
  | "health_claims"
  | "political_ties";

export interface ExerciseConfig {
  brandName: string;
  mode: ExerciseMode;
  duration: ExerciseDuration;
  teamMode: TeamMode;
  scenarioCategory: ScenarioCategory;
}

export interface Scenario {
  id: string;
  refCode?: string; // Reference code for saving/loading scenarios
  title: string;
  narrative: string;
  basedOnTruth: boolean;
  truthElement?: string;
  implicatedParties: string[];
  severity: "moderate" | "severe" | "critical";
  spreadPattern: "viral" | "coordinated" | "organic";
  injects?: Inject[]; // Pre-generated injects for preview
}

export interface Inject {
  id: string;
  timestamp: number; // seconds into exercise
  type: "social_post" | "news_article" | "influencer" | "official_response" | "leak" | "amplification";
  content: string;
  source: string;
  reach: number;
  sentiment: "hostile" | "confused" | "neutral";
  requiresResponse: boolean;
  responseOptions?: ResponseOption[];
  isAggressive?: boolean;
}

export interface ResponseOption {
  id: string;
  label: string;
  description: string;
  type: "statement" | "social_response" | "internal_action" | "media_outreach" | "legal" | "greyguards_service";
  effectiveness: number; // 0-100
  riskLevel: "low" | "medium" | "high";
  timeToExecute: number; // seconds
}

export interface TeamScore {
  team: "red" | "blue";
  points: number;
  reputationDamage: number;
  narrativeControl: number;
  responseTime: number;
  decisionsCorrect: number;
  decisionsTotal: number;
}

export interface ResponseRecord {
  injectId: string;
  injectType: string;
  injectContent: string;
  responseLabel: string;
  responseType: string;
  effectiveness: number;
  responseTime: number;
  wasCorrect: boolean;
  timestamp: number;
}

type Phase = "landing" | "scenario-build" | "exercise" | "consultant-dashboard" | "results" | "team-join" | "team-dashboard";

interface ExerciseResults {
  score: TeamScore;
  responseHistory: ResponseRecord[];
  eventLog: Array<{ time: number; message: string; type: string }>;
}

interface TeamSessionData {
  sessionId: string;
  teamId: string;
  teamType: "blue" | "red";
  sessionData: any;
}

const RedTeam = () => {
  const [phase, setPhase] = useState<Phase>("landing");
  const access = useAccessProfile();
  const [config, setConfig] = useState<ExerciseConfig>({
    brandName: "",
    mode: "self",
    duration: 10,
    teamMode: "solo",
    scenarioCategory: "random"
  });
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [exerciseResults, setExerciseResults] = useState<ExerciseResults | null>(null);
  const [teamSession, setTeamSession] = useState<TeamSessionData | null>(null);

  // Lock non-admin users to their assigned brand and force self-navigated mode.
  useEffect(() => {
    if (access.loading) return;
    if (!access.isAdmin) {
      setConfig((prev) => ({
        ...prev,
        brandName: access.lockedBrand || prev.brandName,
        mode: "self",
      }));
    }
  }, [access.loading, access.isAdmin, access.lockedBrand]);


  const handleStartExercise = () => {
    if (config.mode === "consultant") {
      setPhase("consultant-dashboard");
    } else {
      setPhase("scenario-build");
    }
  };

  const handleScenarioReady = (generatedScenario: Scenario) => {
    setScenario(generatedScenario);
    setPhase("exercise");
  };

  const handleExerciseComplete = (
    score: TeamScore, 
    responseHistory: ResponseRecord[], 
    eventLog: Array<{ time: number; message: string; type: string }>
  ) => {
    setExerciseResults({ score, responseHistory, eventLog });
    setPhase("results");
  };

  const handleRestartExercise = () => {
    setPhase("landing");
    setConfig({
      brandName: "",
      mode: "self",
      duration: 10,
      teamMode: "solo",
      scenarioCategory: "random"
    });
    setScenario(null);
    setExerciseResults(null);
    setTeamSession(null);
  };

  const handleTeamJoin = (sessionId: string, teamId: string, teamType: "blue" | "red", sessionData: any) => {
    setTeamSession({ sessionId, teamId, teamType, sessionData });
    setPhase("team-dashboard");
  };

  const handleTeamComplete = (score: TeamScore) => {
    setExerciseResults({ score, responseHistory: [], eventLog: [] });
    setPhase("results");
  };

  const handleScenarioFromConsultant = (generatedScenario: Scenario) => {
    setScenario(generatedScenario);
  };

  // Team Join Phase
  if (phase === "team-join") {
    return (
      <TeamJoin 
        onJoinSession={handleTeamJoin}
        onBack={() => setPhase("landing")}
      />
    );
  }

  // Team Dashboard Phase
  if (phase === "team-dashboard" && teamSession) {
    if (teamSession.teamType === "blue") {
      return (
        <BlueTeamDashboard
          sessionId={teamSession.sessionId}
          teamId={teamSession.teamId}
          sessionData={teamSession.sessionData}
          onLeave={() => setPhase("landing")}
          onComplete={handleTeamComplete}
        />
      );
    } else {
      return (
        <RedTeamDashboard
          sessionId={teamSession.sessionId}
          teamId={teamSession.teamId}
          sessionData={teamSession.sessionData}
          onLeave={() => setPhase("landing")}
        />
      );
    }
  }

  if (phase === "consultant-dashboard") {
    return (
      <ConsultantDashboard 
        config={config} 
        onBack={() => setPhase("landing")}
        onScenarioGenerated={handleScenarioFromConsultant}
        currentScenario={scenario}
      />
    );
  }

  if (phase === "scenario-build" && config) {
    return (
      <ScenarioBuilder 
        config={config} 
        onScenarioReady={handleScenarioReady}
        onBack={() => setPhase("landing")}
      />
    );
  }

  if (phase === "exercise" && scenario && config) {
    return (
      <ExercisePlayer 
        config={config}
        scenario={scenario}
        onComplete={handleExerciseComplete}
        onBack={() => setPhase("landing")}
      />
    );
  }

  if (phase === "results" && exerciseResults) {
    return (
      <ExerciseDebrief 
        score={exerciseResults.score} 
        config={config}
        responseHistory={exerciseResults.responseHistory}
        eventLog={exerciseResults.eventLog}
        onRestart={handleRestartExercise}
      />
    );
  }

  const brandLocked = !access.isAdmin && !!access.lockedBrand;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-transparent to-warning/5 pointer-events-none" />
      <div className="absolute top-10 left-10 w-40 h-40 bg-destructive/10 blur-3xl animate-pulse-glow pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-48 h-48 bg-warning/10 blur-3xl animate-pulse-glow pointer-events-none" style={{ animationDelay: "1s" }} />

      <Card className="w-full max-w-xl border-4 border-border bg-card relative z-10 max-h-[92vh] overflow-y-auto">
        <CardHeader className="space-y-3 border-b-4 border-border bg-secondary">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src={greyguardsLogo} alt="Greyguards" className="h-10 w-auto object-contain" />
            </Link>
            <Badge variant="outline" className="border-destructive text-destructive uppercase tracking-wider animate-pulse-glow">
              <Crosshair className="h-3 w-3 mr-1" />
              Crisis Simulation
            </Badge>
          </div>
          <CardTitle className="text-center text-2xl uppercase tracking-wider">
            Red Team Exercise
          </CardTitle>
          <CardDescription className="text-center">
            Navigate evolving disinformation narratives in real-time
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Brand Name */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider font-medium">Target Brand / Organisation</Label>
            <Input
              value={config.brandName}
              onChange={(e) => !brandLocked && setConfig({ ...config, brandName: e.target.value })}
              placeholder="Enter brand name..."
              disabled={brandLocked}
              className="border-2 border-border bg-input h-11 uppercase tracking-wide"
            />
            {brandLocked ? (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Lock className="h-3 w-3" /> Your account is locked to this brand.
              </p>
            ) : (
              <div className="space-y-2">
                <Select
                  value={DEMO_COMPANY_LIST.includes(config.brandName) ? config.brandName : ""}
                  onValueChange={(value) => setConfig({ ...config, brandName: value })}
                >
                  <SelectTrigger className="border-2 border-border bg-input h-10 text-xs uppercase tracking-wider">
                    <SelectValue placeholder="Or pick a demo company…" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-2 border-border z-50 max-h-72">
                    {DEMO_COMPANY_LIST.map((company) => {
                      const data = DEMO_COMPANIES[company];
                      return (
                        <SelectItem key={company} value={company} className="cursor-pointer">
                          <div className="flex flex-col">
                            <span className="font-medium">{company}</span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                              {data.industry} · {data.threatLevel} threat
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {access.isAdmin && (
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, brandName: "Anon Business" })}
                    className="text-xs uppercase tracking-wider text-muted-foreground hover:text-destructive underline-offset-4 hover:underline"
                  >
                    Use "Anon Business" (generic demo)
                  </button>
                )}
              </div>
            )}

          </div>

          {/* Exercise Mode — Consultant Hosted hidden unless admin */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider font-medium">Exercise Mode</Label>
            <RadioGroup
              value={config.mode}
              onValueChange={(value: ExerciseMode) => {
                if (value === "consultant" && !access.isAdmin) return;
                setConfig({ ...config, mode: value });
              }}
              className={`grid gap-3 ${access.isAdmin ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}
            >
              <div className={`relative border-2 p-3 cursor-pointer transition-all ${config.mode === 'self' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'}`}>
                <RadioGroupItem value="self" id="self" className="absolute top-3 right-3" />
                <Label htmlFor="self" className="cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="font-bold uppercase tracking-wider text-sm">Self-Navigated</span>
                  </div>
                  <p className="text-xs text-muted-foreground">AI-generated scenarios and injects</p>
                </Label>
              </div>

              {access.isAdmin && (
                <div className={`relative border-2 p-3 cursor-pointer transition-all ${config.mode === 'consultant' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'}`}>
                  <RadioGroupItem value="consultant" id="consultant" className="absolute top-3 right-3" />
                  <Label htmlFor="consultant" className="cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-warning" />
                      <span className="font-bold uppercase tracking-wider text-sm">Consultant Hosted</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Greyguards consultant controls live injects</p>
                  </Label>
                </div>
              )}
            </RadioGroup>
            {!access.isAdmin && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Lock className="h-3 w-3" /> Consultant-Hosted is available to Greyguards staff only.
              </p>
            )}
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider font-medium">Duration</Label>
            <RadioGroup
              value={config.duration.toString()}
              onValueChange={(value) => setConfig({ ...config, duration: parseInt(value) as ExerciseDuration })}
              className="grid grid-cols-3 gap-2"
            >
              {[10, 20, 30].map((mins) => (
                <div key={mins} className={`relative border-2 p-3 cursor-pointer text-center transition-all ${config.duration === mins ? 'border-warning bg-warning/5' : 'border-border hover:border-muted-foreground'}`}>
                  <RadioGroupItem value={mins.toString()} id={`dur-${mins}`} className="absolute top-1 right-1 h-3 w-3" />
                  <Label htmlFor={`dur-${mins}`} className="cursor-pointer">
                    <Timer className="h-5 w-5 mx-auto mb-1 text-warning" />
                    <span className="font-bold text-xl">{mins}</span>
                    <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">min</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Team mode (consultant only, so admin only) */}
          {config.mode === "consultant" && access.isAdmin && (
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider font-medium">Team Configuration</Label>
              <RadioGroup
                value={config.teamMode}
                onValueChange={(value: TeamMode) => setConfig({ ...config, teamMode: value })}
                className="grid grid-cols-2 gap-2"
              >
                <div className={`relative border-2 p-3 cursor-pointer transition-all ${config.teamMode === 'solo' ? 'border-success bg-success/5' : 'border-border hover:border-muted-foreground'}`}>
                  <RadioGroupItem value="solo" id="solo" className="absolute top-2 right-2" />
                  <Label htmlFor="solo" className="cursor-pointer text-xs">
                    <div className="font-bold uppercase tracking-wider">Single (Blue)</div>
                  </Label>
                </div>
                <div className={`relative border-2 p-3 cursor-pointer transition-all ${config.teamMode === 'team-vs-team' ? 'border-destructive bg-destructive/5' : 'border-border hover:border-muted-foreground'}`}>
                  <RadioGroupItem value="team-vs-team" id="team-vs-team" className="absolute top-2 right-2" />
                  <Label htmlFor="team-vs-team" className="cursor-pointer text-xs">
                    <div className="font-bold uppercase tracking-wider"><span className="text-primary">Blue</span> vs <span className="text-destructive">Red</span></div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Crisis Category */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider font-medium">Crisis Category</Label>
            <RadioGroup
              value={config.scenarioCategory}
              onValueChange={(value: ScenarioCategory) => setConfig({ ...config, scenarioCategory: value })}
              className="grid grid-cols-3 gap-2"
            >
              {[
                { value: "random", label: "Random", icon: "shuffle" },
                { value: "product_safety", label: "Product", icon: "alert-triangle" },
                { value: "data_breach", label: "Data Breach", icon: "lock-open" },
                { value: "environmental", label: "Environ.", icon: "leaf" },
                { value: "labor_practices", label: "Labour", icon: "hard-hat" },
                { value: "financial_fraud", label: "Financial", icon: "dollar-sign" },
                { value: "astroturfing", label: "Astroturf", icon: "bot" },
                { value: "supply_chain", label: "Supply", icon: "package" },
                { value: "ai_ethics", label: "AI Ethics", icon: "cpu" },
                { value: "health_claims", label: "Health", icon: "pill" },
                { value: "political_ties", label: "Political", icon: "landmark" },
              ].map((cat) => (
                <div key={cat.value} className={`relative border-2 p-2 cursor-pointer transition-all text-center ${config.scenarioCategory === cat.value ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'}`}>
                  <RadioGroupItem value={cat.value} id={`cat-${cat.value}`} className="absolute top-1 right-1 h-3 w-3" />
                  <Label htmlFor={`cat-${cat.value}`} className="cursor-pointer">
                    <ScenarioIcon name={cat.icon} className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <span className="text-[10px] font-medium uppercase tracking-wider">{cat.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Start */}
          <Button
            onClick={handleStartExercise}
            disabled={!config.brandName.trim()}
            className="w-full h-12 text-base uppercase tracking-widest font-bold bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            <Target className="h-4 w-4 mr-2" />
            Start Red Teaming
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or</span></div>
          </div>

          <Button
            variant="outline"
            onClick={() => setPhase("team-join")}
            className="w-full h-11 border-2 border-primary text-primary hover:bg-primary/10 uppercase tracking-wider text-sm"
          >
            <Users className="h-4 w-4 mr-2" />
            Join Existing Session
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};


export default RedTeam;
