import { useState, useEffect, useCallback } from "react";
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
  BookOpen,
  CheckCircle,
  Loader2
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
  id?: string;
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

interface DatabaseSession {
  id: string;
  session_code: string;
  brand_name: string;
  status: string;
  duration: number;
  team_mode: string;
  scenario_title: string | null;
  scenario_narrative: string | null;
  started_at: string | null;
  completed_at: string | null;
}

const ConsultantDashboard = ({ config, onBack, onScenarioGenerated, currentScenario }: ConsultantDashboardProps) => {
  const [isExerciseActive, setIsExerciseActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(config.duration * 60);
  const [isPaused, setIsPaused] = useState(true);
  const [sessionCode, setSessionCode] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(true);

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
      content: "Coordinated inauthentic behaviour detected - 100+ accounts amplifying",
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

  // Generate session code
  const generateSessionCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Create database session on mount
  useEffect(() => {
    const createSession = async () => {
      const code = generateSessionCode();
      setSessionCode(code);

      try {
        const { data, error } = await supabase
          .from('exercise_sessions')
          .insert({
            session_code: code,
            brand_name: config.brandName,
            duration: config.duration,
            team_mode: config.teamMode,
            status: 'waiting'
          })
          .select()
          .single();

        if (error) throw error;

        setSessionId(data.id);
        toast.success(`Session created: ${code}`);
      } catch (error) {
        console.error("Error creating session:", error);
        toast.error("Failed to create session");
      } finally {
        setIsCreatingSession(false);
      }
    };

    createSession();
  }, [config.brandName, config.duration, config.teamMode]);

  // Subscribe to team connections
  useEffect(() => {
    if (!sessionId) return;

    const fetchTeams = async () => {
      const { data: teams } = await supabase
        .from('exercise_teams')
        .select('*')
        .eq('session_id', sessionId);

      if (teams) {
        const blue = teams.find(t => t.team_type === 'blue');
        const red = teams.find(t => t.team_type === 'red');

        if (blue) {
          setBlueTeam(prev => ({
            ...prev,
            id: blue.id,
            name: blue.team_name || 'Blue Team',
            narrativeControl: blue.narrative_control || 50,
            reputationDamage: blue.reputation_damage || 20,
            decisions: blue.decisions_total || 0,
            isConnected: blue.is_connected || false
          }));
        }

        if (red) {
          setRedTeam(prev => ({
            ...prev,
            id: red.id,
            name: red.team_name || 'Red Team',
            narrativeControl: red.narrative_control || 50,
            reputationDamage: red.reputation_damage || 20,
            decisions: red.decisions_total || 0,
            isConnected: red.is_connected || false
          }));
        }
      }
    };

    fetchTeams();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`session-${sessionId}-teams`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'exercise_teams',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          const team = payload.new as any;
          if (team.team_type === 'blue') {
            setBlueTeam(prev => ({
              ...prev,
              id: team.id,
              name: team.team_name || 'Blue Team',
              narrativeControl: team.narrative_control || 50,
              reputationDamage: team.reputation_damage || 20,
              decisions: team.decisions_total || 0,
              isConnected: team.is_connected || false
            }));
          } else if (team.team_type === 'red') {
            setRedTeam(prev => ({
              ...prev,
              id: team.id,
              name: team.team_name || 'Red Team',
              narrativeControl: team.narrative_control || 50,
              reputationDamage: team.reputation_damage || 20,
              decisions: team.decisions_total || 0,
              isConnected: team.is_connected || false
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  // Timer effect
  useEffect(() => {
    if (!isExerciseActive || isPaused) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleEndExercise();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isExerciseActive, isPaused]);

  // Start exercise
  const handleStartExercise = async () => {
    if (!sessionId) return;

    try {
      // Update session status and scenario
      const { error } = await supabase
        .from('exercise_sessions')
        .update({
          status: 'active',
          started_at: new Date().toISOString(),
          scenario_title: scenario?.title || null,
          scenario_narrative: scenario?.narrative || null
        })
        .eq('id', sessionId);

      if (error) throw error;

      setIsExerciseActive(true);
      setIsPaused(false);
      toast.success("Exercise started!");
    } catch (error) {
      console.error("Error starting exercise:", error);
      toast.error("Failed to start exercise");
    }
  };

  // Pause/Resume exercise
  const handleTogglePause = async () => {
    if (!sessionId) return;

    const newStatus = isPaused ? 'active' : 'paused';

    try {
      const { error } = await supabase
        .from('exercise_sessions')
        .update({ status: newStatus })
        .eq('id', sessionId);

      if (error) throw error;

      setIsPaused(!isPaused);
      toast.info(isPaused ? "Exercise resumed" : "Exercise paused");
    } catch (error) {
      console.error("Error toggling pause:", error);
    }
  };

  // End exercise
  const handleEndExercise = async () => {
    if (!sessionId) return;

    try {
      const { error } = await supabase
        .from('exercise_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;

      setIsExerciseActive(false);
      setIsPaused(true);
      toast.success("Exercise ended!");
    } catch (error) {
      console.error("Error ending exercise:", error);
    }
  };

  // Send inject to database
  const sendInjectToDatabase = async (inject: {
    type: string;
    content: string;
    source: string;
    reach: number;
    sentiment: string;
    isAggressive: boolean;
  }) => {
    if (!sessionId) return;

    try {
      const { data, error } = await supabase
        .from('exercise_injects')
        .insert({
          session_id: sessionId,
          inject_type: inject.type,
          content: inject.content,
          source: inject.source,
          reach: inject.reach,
          sentiment: inject.sentiment,
          is_aggressive: inject.isAggressive,
          is_sent: true,
          sent_at: new Date().toISOString(),
          created_by: 'consultant',
          timestamp_offset: config.duration * 60 - timeRemaining
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error saving inject:", error);
      toast.error("Failed to save inject");
      return null;
    }
  };

  const handleSendInject = async (targetTeam: "blue" | "red" | "both") => {
    if (!customInject.content.trim()) return;

    const content = customInject.content.replace("[BRAND]", config.brandName);

    // Save to database
    await sendInjectToDatabase({
      type: customInject.type,
      content,
      source: customInject.source,
      reach: customInject.reach,
      sentiment: customInject.sentiment,
      isAggressive: customInject.isAggressive
    });

    const newEvent = {
      id: crypto.randomUUID(),
      time: new Date(),
      type: customInject.type,
      content,
      targetTeam
    };

    setInjectedEvents(prev => [newEvent, ...prev]);
    toast.success("Inject sent!");

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

  const handlePresetInject = async (preset: typeof presetInjects[0], targetTeam: "blue" | "red" | "both") => {
    const content = preset.content.replace("[BRAND]", config.brandName);

    // Save to database
    await sendInjectToDatabase({
      type: preset.type,
      content,
      source: preset.source,
      reach: preset.reach,
      sentiment: "hostile",
      isAggressive: false
    });

    const newEvent = {
      id: crypto.randomUUID(),
      time: new Date(),
      type: preset.type,
      content,
      targetTeam
    };

    setInjectedEvents(prev => [newEvent, ...prev]);
    toast.success("Inject sent!");
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
      const { data: scenarioData, error: scenarioError } = await supabase.functions.invoke('generate-redteam-scenario', {
        body: { brandName: config.brandName }
      });

      if (scenarioError) throw scenarioError;

      const generatedScenario: Scenario = {
        ...scenarioData.scenario,
        refCode: generateRefCode()
      };

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

  const copySessionCode = () => {
    navigator.clipboard.writeText(sessionCode);
    toast.success("Session code copied!");
  };

  // Loading state
  if (isCreatingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground uppercase tracking-wider">Creating session...</p>
        </div>
      </div>
    );
  }

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
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={copySessionCode}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>

              {/* Connected Teams Indicator */}
              <div className="flex items-center gap-2 px-3 py-2 border-2 border-border">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${blueTeam.isConnected ? 'bg-primary animate-pulse' : 'bg-muted-foreground/30'}`} />
                  <span className="text-xs text-muted-foreground">Blue</span>
                </div>
                {config.teamMode === "team-vs-team" && (
                  <div className="flex items-center gap-1 ml-2">
                    <div className={`w-2 h-2 rounded-full ${redTeam.isConnected ? 'bg-destructive animate-pulse' : 'bg-muted-foreground/30'}`} />
                    <span className="text-xs text-muted-foreground">Red</span>
                  </div>
                )}
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
                    onClick={handleStartExercise}
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
                      onClick={handleTogglePause}
                      className="uppercase tracking-wider"
                    >
                      {isPaused ? <Play className="h-4 w-4 mr-2" /> : <Pause className="h-4 w-4 mr-2" />}
                      {isPaused ? "Resume" : "Pause"}
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={handleEndExercise}
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
                    {blueTeam.isConnected ? (
                      <><CheckCircle className="h-3 w-3 mr-1" /> Connected</>
                    ) : "Waiting"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {blueTeam.name !== "Blue Team" && (
                  <div className="text-xs text-muted-foreground mb-2">
                    Team: <span className="font-medium text-foreground">{blueTeam.name}</span>
                  </div>
                )}
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
                      {redTeam.isConnected ? (
                        <><CheckCircle className="h-3 w-3 mr-1" /> Connected</>
                      ) : "Waiting"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {redTeam.name !== "Red Team" && (
                    <div className="text-xs text-muted-foreground mb-2">
                      Team: <span className="font-medium text-foreground">{redTeam.name}</span>
                    </div>
                  )}
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
                              disabled={!isExerciseActive}
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
                                disabled={!isExerciseActive}
                              >
                                <Target className="h-3 w-3 mr-1" />
                                Red
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              className="flex-1 uppercase tracking-wider text-xs"
                              onClick={() => handlePresetInject(preset, "both")}
                              disabled={!isExerciseActive}
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
                        disabled={!customInject.content.trim() || !isExerciseActive}
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Send to Blue
                      </Button>
                      {config.teamMode === "team-vs-team" && (
                        <Button 
                          variant="outline"
                          className="flex-1 uppercase tracking-wider border-destructive text-destructive"
                          onClick={() => handleSendInject("red")}
                          disabled={!customInject.content.trim() || !isExerciseActive}
                        >
                          <Target className="h-4 w-4 mr-2" />
                          Send to Red
                        </Button>
                      )}
                      <Button 
                        className="flex-1 uppercase tracking-wider"
                        onClick={() => handleSendInject("both")}
                        disabled={!customInject.content.trim() || !isExerciseActive}
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

          {/* Right Panel - Activity Log */}
          <div className="lg:col-span-3">
            <Card className="border-4 border-border bg-card h-full">
              <CardHeader className="border-b-4 border-border py-3">
                <CardTitle className="flex items-center justify-between uppercase tracking-wider text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Activity Log
                  </div>
                  <Badge variant="outline">{injectedEvents.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  {injectedEvents.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      No events yet. Start the exercise and send injects.
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {injectedEvents.map((event) => (
                        <div key={event.id} className="p-3 hover:bg-muted/50">
                          <div className="flex items-center gap-2 mb-1">
                            {getInjectIcon(event.type)}
                            <span className="text-xs font-mono text-muted-foreground">
                              {event.time.toLocaleTimeString()}
                            </span>
                            <Badge 
                              variant="outline" 
                              className={`text-[10px] ${
                                event.targetTeam === 'blue' ? 'border-primary text-primary' :
                                event.targetTeam === 'red' ? 'border-destructive text-destructive' :
                                ''
                              }`}
                            >
                              {event.targetTeam === 'both' ? 'ALL' : event.targetTeam.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm line-clamp-2">{event.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
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
