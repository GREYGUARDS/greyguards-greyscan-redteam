import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  ArrowLeft,
  Play,
  Pause,
  Plus,
  Send,
  Users,
  Shield,
  Target,
  Zap,
  MessageSquare,
  Newspaper,
  Radio,
  AlertTriangle,
  Trophy,
  Clock,
  Eye,
  Copy,
  FileText,
  Save,
  RefreshCw,
  BookOpen
} from "lucide-react";
import { ExerciseConfig, Inject, Scenario } from "@/pages/RedTeam";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ConsultantDashboardProps {
  config: ExerciseConfig;
  onBack: () => void;
  onScenarioGenerated?: (scenario: Scenario) => void;
  currentScenario?: Scenario | null;
}

interface TeamState {
  name: string;
  score: number;
  narrativeControl: number;
  reputationDamage: number;
  decisions: number;
  isConnected: boolean;
}

interface SavedScenario {
  refCode: string;
  scenario: Scenario;
  injects: Inject[];
  brandName: string;
  savedAt: string;
}

const ConsultantDashboard = ({ config, onBack, onScenarioGenerated, currentScenario }: ConsultantDashboardProps) => {
  const [isExerciseActive, setIsExerciseActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(config.duration * 60);
  const [isPaused, setIsPaused] = useState(true);
  const [sessionCode, setSessionCode] = useState(() => 
    Math.random().toString(36).substring(2, 8).toUpperCase()
  );

  // Scenario preview state
  const [scenario, setScenario] = useState<Scenario | null>(currentScenario || null);
  const [previewInjects, setPreviewInjects] = useState<Inject[]>([]);
  const [isGeneratingScenario, setIsGeneratingScenario] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [loadRefCode, setLoadRefCode] = useState("");
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>(() => {
    const saved = localStorage.getItem('greyguards_saved_scenarios');
    return saved ? JSON.parse(saved) : [];
  });

  const [blueTeam, setBlueTeam] = useState<TeamState>({
    name: "Blue Team",
    score: 0,
    narrativeControl: 50,
    reputationDamage: 20,
    decisions: 0,
    isConnected: false
  });

  const [redTeam, setRedTeam] = useState<TeamState>({
    name: "Red Team",
    score: 0,
    narrativeControl: 50,
    reputationDamage: 20,
    decisions: 0,
    isConnected: config.teamMode === "team-vs-team"
  });

  const [customInject, setCustomInject] = useState({
    type: "social_post" as Inject["type"],
    content: "",
    source: "",
    reach: 10000,
    sentiment: "hostile" as Inject["sentiment"],
    isAggressive: false
  });

  const [injectedEvents, setInjectedEvents] = useState<Array<{
    id: string;
    time: Date;
    type: string;
    content: string;
    targetTeam: "blue" | "red" | "both";
  }>>([]);

  const presetInjects = [
    {
      label: "Viral Social Post",
      type: "social_post" as const,
      content: "BREAKING: Major allegations surface against [BRAND]",
      source: "@AnonymousTipper",
      reach: 50000
    },
    {
      label: "News Pickup",
      type: "news_article" as const,
      content: "Media outlet picks up the story with sensational headline",
      source: "DailyNews.com",
      reach: 200000
    },
    {
      label: "Influencer Amplification",
      type: "influencer" as const,
      content: "Major influencer shares and adds their take",
      source: "@BigInfluencer (500K)",
      reach: 500000
    },
    {
      label: "Fake Document Leak",
      type: "leak" as const,
      content: "Forged internal document surfaces claiming to prove allegations",
      source: "Anonymous paste site",
      reach: 100000
    },
    {
      label: "Bot Amplification",
      type: "amplification" as const,
      content: "Coordinated inauthentic behavior detected - 100+ accounts amplifying",
      source: "Bot network",
      reach: 300000
    },
    {
      label: "Competitor Opportunism",
      type: "official_response" as const,
      content: "Competitor makes thinly-veiled reference to the crisis",
      source: "@CompetitorBrand",
      reach: 150000
    }
  ];

  const handleSendInject = (targetTeam: "blue" | "red" | "both") => {
    if (!customInject.content.trim()) return;

    const newEvent = {
      id: crypto.randomUUID(),
      time: new Date(),
      type: customInject.type,
      content: customInject.content.replace("[BRAND]", config.brandName),
      targetTeam
    };

    setInjectedEvents(prev => [newEvent, ...prev]);

    // Reset form
    setCustomInject({
      type: "social_post",
      content: "",
      source: "",
      reach: 10000,
      sentiment: "hostile",
      isAggressive: false
    });
  };

  const handlePresetInject = (preset: typeof presetInjects[0], targetTeam: "blue" | "red" | "both") => {
    const newEvent = {
      id: crypto.randomUUID(),
      time: new Date(),
      type: preset.type,
      content: preset.content.replace("[BRAND]", config.brandName),
      targetTeam
    };

    setInjectedEvents(prev => [newEvent, ...prev]);
  };

  const getInjectIcon = (type: string) => {
    switch (type) {
      case "social_post": return <MessageSquare className="h-4 w-4" />;
      case "news_article": return <Newspaper className="h-4 w-4" />;
      case "influencer": return <Users className="h-4 w-4" />;
      case "official_response": return <Radio className="h-4 w-4" />;
      case "leak": return <AlertTriangle className="h-4 w-4" />;
      case "amplification": return <Zap className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  // Generate scenario and injects for preview
  const handleGenerateScenario = async () => {
    setIsGeneratingScenario(true);
    try {
      // Generate scenario
      const { data: scenarioData, error: scenarioError } = await supabase.functions.invoke('generate-redteam-scenario', {
        body: { brandName: config.brandName }
      });

      if (scenarioError) throw scenarioError;

      const generatedScenario: Scenario = {
        ...scenarioData.scenario,
        refCode: generateRefCode()
      };

      // Generate injects
      const { data: injectsData, error: injectsError } = await supabase.functions.invoke('generate-redteam-injects', {
        body: {
          scenario: generatedScenario,
          brandName: config.brandName,
          duration: config.duration
        }
      });

      if (injectsError) throw injectsError;

      setScenario(generatedScenario);
      setPreviewInjects(injectsData.injects || []);
      onScenarioGenerated?.(generatedScenario);
      toast.success("Scenario generated successfully!");
    } catch (error) {
      console.error("Error generating scenario:", error);
      toast.error("Failed to generate scenario. Using fallback.");
      // Fallback scenario
      const fallbackScenario: Scenario = {
        id: crypto.randomUUID(),
        refCode: generateRefCode(),
        title: `${config.brandName} Crisis Scenario`,
        narrative: `A coordinated disinformation campaign targeting ${config.brandName} has begun spreading across social media platforms.`,
        basedOnTruth: false,
        implicatedParties: ["Anonymous actors", "Competitor interests"],
        severity: "severe",
        spreadPattern: "coordinated"
      };
      setScenario(fallbackScenario);
      onScenarioGenerated?.(fallbackScenario);
    } finally {
      setIsGeneratingScenario(false);
    }
  };

  const generateRefCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'GG-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleSaveScenario = () => {
    if (!scenario) return;

    const savedScenario: SavedScenario = {
      refCode: scenario.refCode || generateRefCode(),
      scenario: { ...scenario, refCode: scenario.refCode || generateRefCode() },
      injects: previewInjects,
      brandName: config.brandName,
      savedAt: new Date().toISOString()
    };

    const updated = [...savedScenarios.filter(s => s.refCode !== savedScenario.refCode), savedScenario];
    setSavedScenarios(updated);
    localStorage.setItem('greyguards_saved_scenarios', JSON.stringify(updated));
    toast.success(`Scenario saved with code: ${savedScenario.refCode}`);
    navigator.clipboard.writeText(savedScenario.refCode);
  };

  const handleLoadScenario = (refCode: string) => {
    const found = savedScenarios.find(s => s.refCode === refCode);
    if (found) {
      setScenario(found.scenario);
      setPreviewInjects(found.injects);
      onScenarioGenerated?.(found.scenario);
      toast.success(`Loaded scenario: ${found.scenario.title}`);
      setLoadRefCode("");
    } else {
      toast.error("Scenario not found with that reference code");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b-4 border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onBack} className="uppercase tracking-wider">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Exit
              </Button>
              <div>
                <span className="font-bold uppercase tracking-wider">{config.brandName}</span>
                <span className="block text-xs text-muted-foreground uppercase">Consultant Dashboard</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Session Code */}
              <div className="flex items-center gap-2 px-4 py-2 bg-muted border-2 border-border">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Session:</span>
                <code className="font-mono text-lg font-bold text-primary">{sessionCode}</code>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => navigator.clipboard.writeText(sessionCode)}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>

              {/* Timer */}
              <div className="flex items-center gap-2 px-4 py-2 border-2 border-border">
                <Clock className="h-4 w-4 text-warning" />
                <span className="font-mono text-xl font-bold">
                  {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                </span>
              </div>

              {/* Controls */}
              <div className="flex gap-2">
                {/* Scenario Preview Button */}
                <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="uppercase tracking-wider">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="uppercase tracking-wider flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Scenario Preview & Management
                      </DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-6 mt-4">
                      {/* Load by Ref Code */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter reference code (e.g., GG-ABC123)"
                          value={loadRefCode}
                          onChange={(e) => setLoadRefCode(e.target.value.toUpperCase())}
                          className="font-mono uppercase"
                        />
                        <Button onClick={() => handleLoadScenario(loadRefCode)} disabled={!loadRefCode}>
                          <BookOpen className="h-4 w-4 mr-2" />
                          Load
                        </Button>
                        <Button onClick={handleGenerateScenario} disabled={isGeneratingScenario}>
                          <RefreshCw className={`h-4 w-4 mr-2 ${isGeneratingScenario ? 'animate-spin' : ''}`} />
                          Generate New
                        </Button>
                      </div>

                      {/* Current Scenario */}
                      {scenario ? (
                        <Card className="border-2 border-primary">
                          <CardHeader className="border-b border-border py-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm uppercase tracking-wider">{scenario.title}</CardTitle>
                              <div className="flex items-center gap-2">
                                <code className="font-mono text-sm bg-muted px-2 py-1">{scenario.refCode}</code>
                                <Button size="sm" variant="outline" onClick={handleSaveScenario}>
                                  <Save className="h-3 w-3 mr-1" />
                                  Save
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => {
                                    navigator.clipboard.writeText(scenario.refCode || '');
                                    toast.success("Reference code copied!");
                                  }}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 space-y-4">
                            <p className="text-sm text-muted-foreground">{scenario.narrative}</p>
                            <div className="flex gap-2 flex-wrap">
                              <Badge variant="outline">Severity: {scenario.severity}</Badge>
                              <Badge variant="outline">Pattern: {scenario.spreadPattern}</Badge>
                              <Badge variant={scenario.basedOnTruth ? "destructive" : "secondary"}>
                                {scenario.basedOnTruth ? "Based on Truth" : "Fabricated"}
                              </Badge>
                            </div>
                            {scenario.implicatedParties.length > 0 && (
                              <div>
                                <span className="text-xs uppercase tracking-wider text-muted-foreground">Implicated:</span>
                                <p className="text-sm">{scenario.implicatedParties.join(", ")}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ) : (
                        <Card className="border-2 border-dashed border-muted">
                          <CardContent className="p-8 text-center">
                            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">No scenario loaded. Generate one or load by reference code.</p>
                          </CardContent>
                        </Card>
                      )}

                      {/* Preview Injects */}
                      {previewInjects.length > 0 && (
                        <div>
                          <h4 className="text-sm uppercase tracking-wider font-bold mb-3 flex items-center gap-2">
                            <Zap className="h-4 w-4 text-warning" />
                            Planned Injects ({previewInjects.length})
                          </h4>
                          <ScrollArea className="h-[200px] border rounded">
                            <div className="p-3 space-y-2">
                              {previewInjects.map((inject, i) => (
                                <div key={inject.id || i} className="flex items-start gap-3 p-2 bg-muted/50 text-xs">
                                  <span className="font-mono text-muted-foreground w-16">
                                    {Math.floor(inject.timestamp / 60)}:{(inject.timestamp % 60).toString().padStart(2, '0')}
                                  </span>
                                  <Badge variant="outline" className="text-[10px]">{inject.type.replace('_', ' ')}</Badge>
                                  <span className="flex-1 line-clamp-1">{inject.content}</span>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      )}

                      {/* Saved Scenarios */}
                      {savedScenarios.length > 0 && (
                        <div>
                          <h4 className="text-sm uppercase tracking-wider font-bold mb-3 flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-primary" />
                            Saved Scenarios ({savedScenarios.length})
                          </h4>
                          <div className="space-y-2">
                            {savedScenarios.slice(0, 5).map((saved) => (
                              <div 
                                key={saved.refCode} 
                                className="flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-muted/50"
                                onClick={() => handleLoadScenario(saved.refCode)}
                              >
                                <div>
                                  <code className="font-mono text-sm text-primary">{saved.refCode}</code>
                                  <span className="ml-2 text-sm">{saved.scenario.title}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(saved.savedAt).toLocaleDateString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                {!isExerciseActive ? (
                  <Button 
                    onClick={() => setIsExerciseActive(true)}
                    className="uppercase tracking-wider bg-success hover:bg-success/90"
                    disabled={!scenario}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Exercise
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant="outline"
                      onClick={() => setIsPaused(!isPaused)}
                      className="uppercase tracking-wider"
                    >
                      {isPaused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                      {isPaused ? "Resume" : "Pause"}
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => setIsExerciseActive(false)}
                      className="uppercase tracking-wider"
                    >
                      End Exercise
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel - Team Status */}
          <div className="lg:col-span-3 space-y-6">
            {/* Blue Team */}
            <Card className="border-4 border-primary bg-card">
              <CardHeader className="border-b-4 border-primary bg-primary/10 py-3">
                <CardTitle className="flex items-center justify-between uppercase tracking-wider text-sm">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    Blue Team
                  </div>
                  <Badge variant={blueTeam.isConnected ? "default" : "outline"} className="text-xs">
                    {blueTeam.isConnected ? "Connected" : "Waiting"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs uppercase text-muted-foreground">Score</span>
                  <span className="font-bold text-success">{blueTeam.score}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs uppercase text-muted-foreground">Narrative Control</span>
                  <span className="font-bold">{blueTeam.narrativeControl}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs uppercase text-muted-foreground">Rep Damage</span>
                  <span className="font-bold text-destructive">{blueTeam.reputationDamage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs uppercase text-muted-foreground">Decisions</span>
                  <span className="font-bold">{blueTeam.decisions}</span>
                </div>
              </CardContent>
            </Card>

            {/* Red Team (if team vs team) */}
            {config.teamMode === "team-vs-team" && (
              <Card className="border-4 border-destructive bg-card">
                <CardHeader className="border-b-4 border-destructive bg-destructive/10 py-3">
                  <CardTitle className="flex items-center justify-between uppercase tracking-wider text-sm">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-destructive" />
                      Red Team
                    </div>
                    <Badge variant={redTeam.isConnected ? "destructive" : "outline"} className="text-xs">
                      {redTeam.isConnected ? "Connected" : "Waiting"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-xs uppercase text-muted-foreground">Score</span>
                    <span className="font-bold text-destructive">{redTeam.score}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs uppercase text-muted-foreground">Narrative Spread</span>
                    <span className="font-bold">{100 - redTeam.narrativeControl}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs uppercase text-muted-foreground">Damage Dealt</span>
                    <span className="font-bold text-destructive">{redTeam.reputationDamage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs uppercase text-muted-foreground">Attacks</span>
                    <span className="font-bold">{redTeam.decisions}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Leaderboard */}
            {config.teamMode === "team-vs-team" && (
              <Card className="border-4 border-warning bg-card">
                <CardHeader className="border-b-4 border-warning bg-warning/10 py-3">
                  <CardTitle className="flex items-center gap-2 uppercase tracking-wider text-sm">
                    <Trophy className="h-4 w-4 text-warning" />
                    Leaderboard
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className={`flex justify-between p-2 ${blueTeam.score >= redTeam.score ? 'bg-primary/10' : ''}`}>
                      <span className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        Blue Team
                      </span>
                      <span className="font-bold">{blueTeam.score}</span>
                    </div>
                    <div className={`flex justify-between p-2 ${redTeam.score > blueTeam.score ? 'bg-destructive/10' : ''}`}>
                      <span className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-destructive" />
                        Red Team
                      </span>
                      <span className="font-bold">{redTeam.score}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Center Panel - Inject Controls */}
          <div className="lg:col-span-6">
            <Tabs defaultValue="quick" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="quick" className="uppercase tracking-wider">Quick Injects</TabsTrigger>
                <TabsTrigger value="custom" className="uppercase tracking-wider">Custom Inject</TabsTrigger>
              </TabsList>

              <TabsContent value="quick">
                <Card className="border-4 border-border bg-card">
                  <CardHeader className="border-b-4 border-border">
                    <CardTitle className="flex items-center gap-2 uppercase tracking-wider text-sm">
                      <Zap className="h-4 w-4 text-warning" />
                      Preset Injects
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {presetInjects.map((preset, i) => (
                        <div key={i} className="border-2 border-border p-4 hover:border-warning transition-colors">
                          <div className="flex items-center gap-2 mb-2">
                            {getInjectIcon(preset.type)}
                            <span className="font-bold uppercase tracking-wider text-sm">{preset.label}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-3">{preset.content}</p>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="flex-1 uppercase tracking-wider text-xs border-primary text-primary hover:bg-primary/10"
                              onClick={() => handlePresetInject(preset, "blue")}
                            >
                              <Shield className="h-3 w-3 mr-1" />
                              Blue
                            </Button>
                            {config.teamMode === "team-vs-team" && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="flex-1 uppercase tracking-wider text-xs border-destructive text-destructive hover:bg-destructive/10"
                                onClick={() => handlePresetInject(preset, "red")}
                              >
                                <Target className="h-3 w-3 mr-1" />
                                Red
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              className="flex-1 uppercase tracking-wider text-xs"
                              onClick={() => handlePresetInject(preset, "both")}
                            >
                              Both
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="custom">
                <Card className="border-4 border-border bg-card">
                  <CardHeader className="border-b-4 border-border">
                    <CardTitle className="flex items-center gap-2 uppercase tracking-wider text-sm">
                      <Plus className="h-4 w-4 text-primary" />
                      Custom Inject
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs uppercase tracking-wider">Type</Label>
                        <Select 
                          value={customInject.type} 
                          onValueChange={(v) => setCustomInject({...customInject, type: v as Inject["type"]})}
                        >
                          <SelectTrigger className="border-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="social_post">Social Post</SelectItem>
                            <SelectItem value="news_article">News Article</SelectItem>
                            <SelectItem value="influencer">Influencer</SelectItem>
                            <SelectItem value="leak">Leak</SelectItem>
                            <SelectItem value="amplification">Amplification</SelectItem>
                            <SelectItem value="official_response">Official Response</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs uppercase tracking-wider">Sentiment</Label>
                        <Select 
                          value={customInject.sentiment} 
                          onValueChange={(v) => setCustomInject({...customInject, sentiment: v as Inject["sentiment"]})}
                        >
                          <SelectTrigger className="border-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hostile">Hostile</SelectItem>
                            <SelectItem value="confused">Confused</SelectItem>
                            <SelectItem value="neutral">Neutral</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs uppercase tracking-wider">Source</Label>
                      <Input
                        value={customInject.source}
                        onChange={(e) => setCustomInject({...customInject, source: e.target.value})}
                        placeholder="e.g., @AnonymousTipper (50K followers)"
                        className="border-2"
                      />
                    </div>

                    <div>
                      <Label className="text-xs uppercase tracking-wider">Content</Label>
                      <Textarea
                        value={customInject.content}
                        onChange={(e) => setCustomInject({...customInject, content: e.target.value})}
                        placeholder="Enter the inject content..."
                        className="border-2 min-h-[100px]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs uppercase tracking-wider">Reach</Label>
                        <Input
                          type="number"
                          value={customInject.reach}
                          onChange={(e) => setCustomInject({...customInject, reach: parseInt(e.target.value) || 0})}
                          className="border-2"
                        />
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={customInject.isAggressive}
                            onChange={(e) => setCustomInject({...customInject, isAggressive: e.target.checked})}
                            className="w-4 h-4"
                          />
                          <span className="text-sm uppercase tracking-wider text-destructive">Aggressive</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-border">
                      <Button 
                        variant="outline"
                        className="flex-1 uppercase tracking-wider border-primary text-primary"
                        onClick={() => handleSendInject("blue")}
                        disabled={!customInject.content.trim()}
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Send to Blue
                      </Button>
                      {config.teamMode === "team-vs-team" && (
                        <Button 
                          variant="outline"
                          className="flex-1 uppercase tracking-wider border-destructive text-destructive"
                          onClick={() => handleSendInject("red")}
                          disabled={!customInject.content.trim()}
                        >
                          <Target className="h-4 w-4 mr-2" />
                          Send to Red
                        </Button>
                      )}
                      <Button 
                        className="flex-1 uppercase tracking-wider"
                        onClick={() => handleSendInject("both")}
                        disabled={!customInject.content.trim()}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send to All
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Panel - Event Log */}
          <div className="lg:col-span-3">
            <Card className="border-4 border-border bg-card h-full">
              <CardHeader className="border-b-4 border-border py-3">
                <CardTitle className="flex items-center gap-2 uppercase tracking-wider text-sm">
                  <Eye className="h-4 w-4 text-primary" />
                  Activity Log
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <div className="p-4 space-y-2">
                    {injectedEvents.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No events yet. Send injects to see them here.
                      </p>
                    ) : (
                      injectedEvents.map((event) => (
                        <div 
                          key={event.id} 
                          className={`text-xs p-3 border-l-4 ${
                            event.targetTeam === "blue" ? "border-primary bg-primary/5" :
                            event.targetTeam === "red" ? "border-destructive bg-destructive/5" :
                            "border-warning bg-warning/5"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              {getInjectIcon(event.type)}
                              <span className="uppercase font-bold">{event.type.replace("_", " ")}</span>
                            </div>
                            <Badge variant="outline" className="text-[10px]">
                              {event.targetTeam === "both" ? "All Teams" : `${event.targetTeam.toUpperCase()} Team`}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">{event.content}</p>
                          <span className="text-[10px] text-muted-foreground/60 block mt-1">
                            {event.time.toLocaleTimeString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ConsultantDashboard;
