import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-4 border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={greyguardsLogo} alt="Greyguards" className="h-8 sm:h-10 w-auto object-contain" />
            <div>
              <span className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">Greyguards – Red Team</span>
              <span className="block text-muted-foreground text-xs sm:text-sm hidden sm:block">Crisis Simulation using GreyScan</span>
            </div>
          </Link>
          <Badge variant="outline" className="border-destructive text-destructive uppercase tracking-wider animate-pulse-glow">
            <Crosshair className="h-3 w-3 mr-1" />
            Crisis Simulation
          </Badge>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-transparent to-warning/5" />
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-10 w-32 h-32 bg-destructive/10 blur-3xl animate-pulse-glow" />
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-warning/10 blur-3xl animate-pulse-glow" style={{ animationDelay: "1s" }} />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-destructive/10 border border-destructive/30 mb-6">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm uppercase tracking-widest text-destructive font-medium">Threat Simulation Training</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight uppercase mb-6">
              <span className="text-foreground">Crisis</span>
              <span className="text-destructive"> Red Team</span>
              <span className="text-foreground"> Exercise</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Navigate evolving disinformation narratives in real-time. Test your team's crisis response capabilities under pressure.
            </p>

            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground mb-8">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-warning" />
                <span>10-30 min exercises</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-destructive" />
                <span>Real-time injects</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span>Team vs Team mode</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Configuration Section */}
      <section className="py-12 bg-card border-y-4 border-border">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto border-4 border-border bg-background">
            <CardHeader className="border-b-4 border-border">
              <CardTitle className="flex items-center gap-3 uppercase tracking-wider">
                <Target className="h-5 w-5 text-destructive" />
                Configure Your Exercise
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              {/* Brand Name */}
              <div className="space-y-3">
                <Label className="text-sm uppercase tracking-wider font-medium">Target Brand / Organization</Label>
                <Input
                  value={config.brandName}
                  onChange={(e) => setConfig({ ...config, brandName: e.target.value })}
                  placeholder="Enter brand or organization name..."
                  className="border-2 border-border bg-input h-12 text-lg uppercase tracking-wide"
                />
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, brandName: "Anon Business" })}
                  className="text-xs uppercase tracking-wider text-muted-foreground hover:text-crimson underline-offset-4 hover:underline transition-colors"
                >
                  Or use "Anon Business" (generic demo target)
                </button>
              </div>

              {/* Exercise Mode */}
              <div className="space-y-3">
                <Label className="text-sm uppercase tracking-wider font-medium">Exercise Mode</Label>
                <RadioGroup
                  value={config.mode}
                  onValueChange={(value: ExerciseMode) => setConfig({ ...config, mode: value })}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                  <div className={`relative border-2 p-4 cursor-pointer transition-all ${config.mode === 'self' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'}`}>
                    <RadioGroupItem value="self" id="self" className="absolute top-4 right-4" />
                    <Label htmlFor="self" className="cursor-pointer">
                      <div className="flex items-center gap-3 mb-2">
                        <Shield className="h-5 w-5 text-primary" />
                        <span className="font-bold uppercase tracking-wider">Self-Navigated</span>
                      </div>
                      <p className="text-sm text-muted-foreground">Run the exercise independently with AI-generated scenarios and injects</p>
                    </Label>
                  </div>

                  <div className={`relative border-2 p-4 cursor-pointer transition-all ${config.mode === 'consultant' ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'}`}>
                    <RadioGroupItem value="consultant" id="consultant" className="absolute top-4 right-4" />
                    <Label htmlFor="consultant" className="cursor-pointer">
                      <div className="flex items-center gap-3 mb-2">
                        <Users className="h-5 w-5 text-warning" />
                        <span className="font-bold uppercase tracking-wider">Consultant Hosted</span>
                      </div>
                      <p className="text-sm text-muted-foreground">A Greyguards consultant controls injects and narrative events live</p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Duration */}
              <div className="space-y-3">
                <Label className="text-sm uppercase tracking-wider font-medium">Exercise Duration</Label>
                <RadioGroup
                  value={config.duration.toString()}
                  onValueChange={(value) => setConfig({ ...config, duration: parseInt(value) as ExerciseDuration })}
                  className="grid grid-cols-3 gap-4"
                >
                  {[10, 20, 30].map((mins) => (
                    <div 
                      key={mins}
                      className={`relative border-2 p-4 cursor-pointer transition-all text-center ${config.duration === mins ? 'border-warning bg-warning/5' : 'border-border hover:border-muted-foreground'}`}
                    >
                      <RadioGroupItem value={mins.toString()} id={`dur-${mins}`} className="absolute top-2 right-2" />
                      <Label htmlFor={`dur-${mins}`} className="cursor-pointer">
                        <Timer className="h-6 w-6 mx-auto mb-2 text-warning" />
                        <span className="font-bold text-2xl">{mins}</span>
                        <span className="block text-xs uppercase tracking-wider text-muted-foreground">minutes</span>
                        <span className="block text-[10px] text-muted-foreground mt-1">
                          {mins === 10 ? 'Quick drill' : mins === 20 ? 'Standard' : 'Deep dive'}
                        </span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Team Mode (only for consultant) */}
              {config.mode === "consultant" && (
                <div className="space-y-3">
                  <Label className="text-sm uppercase tracking-wider font-medium">Team Configuration</Label>
                  <RadioGroup
                    value={config.teamMode}
                    onValueChange={(value: TeamMode) => setConfig({ ...config, teamMode: value })}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    <div className={`relative border-2 p-4 cursor-pointer transition-all ${config.teamMode === 'solo' ? 'border-success bg-success/5' : 'border-border hover:border-muted-foreground'}`}>
                      <RadioGroupItem value="solo" id="solo" className="absolute top-4 right-4" />
                      <Label htmlFor="solo" className="cursor-pointer">
                        <span className="font-bold uppercase tracking-wider">Single Team (Blue)</span>
                        <p className="text-sm text-muted-foreground mt-1">One team defends against the scenario</p>
                      </Label>
                    </div>

                    <div className={`relative border-2 p-4 cursor-pointer transition-all ${config.teamMode === 'team-vs-team' ? 'border-destructive bg-destructive/5' : 'border-border hover:border-muted-foreground'}`}>
                      <RadioGroupItem value="team-vs-team" id="team-vs-team" className="absolute top-4 right-4" />
                      <Label htmlFor="team-vs-team" className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <span className="font-bold uppercase tracking-wider text-primary">Blue</span>
                          <span className="text-muted-foreground">vs</span>
                          <span className="font-bold uppercase tracking-wider text-destructive">Red</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Competitive mode: attackers vs defenders</p>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Scenario Category */}
              <div className="space-y-3">
                <Label className="text-sm uppercase tracking-wider font-medium">Crisis Category</Label>
                <p className="text-xs text-muted-foreground -mt-1">Choose a specific scenario type or let AI surprise you</p>
                <RadioGroup
                  value={config.scenarioCategory}
                  onValueChange={(value: ScenarioCategory) => setConfig({ ...config, scenarioCategory: value })}
                  className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                >
                  {[
                    { value: "random", label: "Random", icon: "shuffle" },
                    { value: "product_safety", label: "Product Safety", icon: "alert-triangle" },
                    { value: "data_breach", label: "Data Breach", icon: "lock-open" },
                    { value: "environmental", label: "Environmental", icon: "leaf" },
                    { value: "labor_practices", label: "Labor Practices", icon: "hard-hat" },
                    { value: "financial_fraud", label: "Financial", icon: "dollar-sign" },
                    { value: "astroturfing", label: "Astroturfing", icon: "bot" },
                    { value: "supply_chain", label: "Supply Chain", icon: "package" },
                    { value: "ai_ethics", label: "AI Ethics", icon: "cpu" },
                    { value: "health_claims", label: "Health Claims", icon: "pill" },
                    { value: "political_ties", label: "Political Ties", icon: "landmark" },
                  ].map((cat) => (
                    <div 
                      key={cat.value}
                      className={`relative border-2 p-3 cursor-pointer transition-all text-center ${config.scenarioCategory === cat.value ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'}`}
                    >
                      <RadioGroupItem value={cat.value} id={`cat-${cat.value}`} className="absolute top-2 right-2 h-3 w-3" />
                      <Label htmlFor={`cat-${cat.value}`} className="cursor-pointer">
                        <ScenarioIcon name={cat.icon} className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                        <span className="text-xs font-medium uppercase tracking-wider">{cat.label}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Start Button */}
              <Button
                onClick={handleStartExercise}
                disabled={!config.brandName.trim()}
                className="w-full h-14 text-lg uppercase tracking-widest font-bold bg-destructive hover:bg-destructive/90 text-destructive-foreground border-4 border-destructive/50 hover:border-destructive transition-all group"
              >
                <Target className="h-5 w-5 mr-3 group-hover:animate-pulse" />
                Start Red Teaming
                <ArrowRight className="h-5 w-5 ml-3 group-hover:translate-x-1 transition-transform" />
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              {/* Join Session Button */}
              <Button 
                variant="outline" 
                onClick={() => setPhase("team-join")}
                className="w-full h-12 border-2 border-primary text-primary hover:bg-primary/10 uppercase tracking-wider"
              >
                <Users className="h-4 w-4 mr-2" />
                Join Existing Session
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-4 border-border bg-card hover:border-primary transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto bg-destructive/10 flex items-center justify-center mb-4">
                  <Zap className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="font-bold uppercase tracking-wider mb-2">Dynamic Injects</h3>
                <p className="text-sm text-muted-foreground">Realistic crisis events unfold in real-time, testing your team's adaptability</p>
              </CardContent>
            </Card>

            <Card className="border-4 border-border bg-card hover:border-warning transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto bg-warning/10 flex items-center justify-center mb-4">
                  <Clock className="h-8 w-8 text-warning" />
                </div>
                <h3 className="font-bold uppercase tracking-wider mb-2">Time Pressure</h3>
                <p className="text-sm text-muted-foreground">Countdown timer adds jeopardy - make critical decisions under real pressure</p>
              </CardContent>
            </Card>

            <Card className="border-4 border-border bg-card hover:border-success transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto bg-success/10 flex items-center justify-center mb-4">
                  <Target className="h-8 w-8 text-success" />
                </div>
                <h3 className="font-bold uppercase tracking-wider mb-2">Scoring & Analysis</h3>
                <p className="text-sm text-muted-foreground">Detailed performance metrics measure your crisis response effectiveness</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-4 border-border bg-card py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground uppercase tracking-wider">
            Powered by <span className="text-foreground font-medium">Greyguards</span> Intelligence
          </p>
        </div>
      </footer>
    </div>
  );
};

export default RedTeam;
