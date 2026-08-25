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
  | "supply_chain"
  | "ai_ethics"
  | "health_claims"
  | "political_ties";

export const SCENARIO_CATEGORIES: { value: ScenarioCategory; label: string; icon: string }[] = [
  { value: "random", label: "Random", icon: "shuffle" },
  { value: "product_safety", label: "Product Safety", icon: "alert-triangle" },
  { value: "data_breach", label: "Data Breach", icon: "lock-open" },
  { value: "environmental", label: "Environmental", icon: "leaf" },
  { value: "labor_practices", label: "Labour Practices", icon: "hard-hat" },
  { value: "financial_fraud", label: "Financial Fraud", icon: "dollar-sign" },
  { value: "supply_chain", label: "Supply Chain", icon: "package" },
  { value: "ai_ethics", label: "AI Ethics", icon: "cpu" },
  { value: "health_claims", label: "Health Claims", icon: "pill" },
  { value: "political_ties", label: "Political Ties", icon: "landmark" },
];


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
  /** Set on AI-generated follow-ups: how the team's last action caused this inject */
  consequence?: string;
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
  const [consultantAction, setConsultantAction] = useState<"host" | "join">("join");
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [exerciseResults, setExerciseResults] = useState<ExerciseResults | null>(null);
  const [teamSession, setTeamSession] = useState<TeamSessionData | null>(null);

  // Non-admins are locked to the brand assigned to their login.
  useEffect(() => {
    if (access.loading) return;
    if (!access.isAdmin) {
      setConfig((prev) => ({
        ...prev,
        brandName: access.lockedBrand || "",
      }));
      setConsultantAction("join");
    } else {
      setConsultantAction("host");
    }
  }, [access.loading, access.isAdmin, access.lockedBrand]);


  const handleStartExercise = () => {
    if (config.mode === "consultant") {
      if (consultantAction === "join" || !access.isAdmin) {
        setPhase("team-join");
      } else {
        setPhase("consultant-dashboard");
      }
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
          {/* Brand — assigned at login */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider font-medium">Target Brand / Organisation</Label>
            <Input
              value={config.brandName}
              onChange={(e) => access.isAdmin && setConfig({ ...config, brandName: e.target.value })}
              placeholder={access.isAdmin ? "Enter brand name..." : "No brand assigned to this account"}
              disabled={!access.isAdmin}
              className="border-2 border-border bg-input h-11 uppercase tracking-wide"
            />
            {access.isAdmin ? (
              <p className="text-[11px] text-muted-foreground">
                Staff account — you may set any target brand.
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Lock className="h-3 w-3" />
                {config.brandName
                  ? "Your brand is assigned at login and cannot be changed."
                  : "No brand is assigned to your login. Contact Greyguards to be provisioned."}
              </p>
            )}
          </div>


          {/* Exercise Mode */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider font-medium">Exercise Mode</Label>
            <RadioGroup
              value={config.mode}
              onValueChange={(value: ExerciseMode) => {
                setConfig({ ...config, mode: value });
                if (value === "consultant" && !access.isAdmin) setConsultantAction("join");
              }}
              className="grid gap-3 grid-cols-1 sm:grid-cols-2"
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

              <div className={`relative border-2 p-3 cursor-pointer transition-all ${config.mode === 'consultant' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'}`}>
                <RadioGroupItem value="consultant" id="consultant" className="absolute top-3 right-3" />
                <Label htmlFor="consultant" className="cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-warning" />
                    <span className="font-bold uppercase tracking-wider text-sm">Consultant Hosted</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Host a live session or join one by code</p>
                </Label>
              </div>
            </RadioGroup>

            {config.mode === "consultant" && (
              <div className="space-y-2 pt-2">
                <RadioGroup
                  value={consultantAction}
                  onValueChange={(value: "host" | "join") => {
                    if (value === "host" && !access.isAdmin) return;
                    setConsultantAction(value);
                  }}
                  className="grid grid-cols-2 gap-2"
                >
                  {access.isAdmin && (
                    <div className={`relative border-2 p-3 cursor-pointer transition-all ${consultantAction === 'host' ? 'border-warning bg-warning/5' : 'border-border hover:border-muted-foreground'}`}>
                      <RadioGroupItem value="host" id="ch-host" className="absolute top-2 right-2 h-3 w-3" />
                      <Label htmlFor="ch-host" className="cursor-pointer text-xs">
                        <div className="font-bold uppercase tracking-wider">Host Session</div>
                        <span className="text-[10px] text-muted-foreground">Consultant controls injects</span>
                      </Label>
                    </div>
                  )}
                  <div className={`relative border-2 p-3 cursor-pointer transition-all ${consultantAction === 'join' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'}`}>
                    <RadioGroupItem value="join" id="ch-join" className="absolute top-2 right-2 h-3 w-3" />
                    <Label htmlFor="ch-join" className="cursor-pointer text-xs">
                      <div className="font-bold uppercase tracking-wider">Join Existing Session</div>
                      <span className="text-[10px] text-muted-foreground">Enter a session code</span>
                    </Label>
                  </div>
                </RadioGroup>
                {!access.isAdmin && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Hosting is available to Greyguards staff only — you can join a session by code.
                  </p>
                )}
              </div>
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

          {/* Crisis Category — compact dropdown */}
          {!(config.mode === "consultant" && consultantAction === "join") && (
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider font-medium">Crisis Category</Label>
              <Select
                value={config.scenarioCategory}
                onValueChange={(value: ScenarioCategory) => setConfig({ ...config, scenarioCategory: value })}
              >
                <SelectTrigger className="border-2 border-border bg-input h-11 text-xs uppercase tracking-wider">
                  <SelectValue placeholder="Select a crisis category…" />
                </SelectTrigger>
                <SelectContent className="bg-card border-2 border-border z-50 max-h-72">
                  {SCENARIO_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value} className="cursor-pointer">
                      <span className="flex items-center gap-2">
                        <ScenarioIcon name={cat.icon} className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs uppercase tracking-wider">{cat.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Start */}
          <Button
            onClick={handleStartExercise}
            disabled={
              config.mode === "consultant" && consultantAction === "join"
                ? false
                : !config.brandName.trim()
            }
            className="w-full h-12 text-base uppercase tracking-widest font-bold bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            <Target className="h-4 w-4 mr-2" />
            {config.mode === "consultant" && consultantAction === "join"
              ? "Join Session"
              : "Start Red Teaming"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>

        </CardContent>
      </Card>
    </div>
  );
};


export default RedTeam;
