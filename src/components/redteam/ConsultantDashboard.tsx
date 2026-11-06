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
  Loader2,
  GitBranch
} from "lucide-react";
import { ExerciseConfig, Inject, Scenario } from "@/pages/RedTeam";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import HostedInjectStudio from './HostedInjectStudio';
import StorylineTimeline from './StorylineTimeline';
import {
  INJECT_MENU,
  INJECT_CATEGORY_LABELS,
  getHostedScenarioPack,
  type HostedScenarioPack,
  type InjectCategory,
  type InjectMenuItem,
  type StorylineInjectOption,
} from "@/lib/hostedScenarios";

const CATEGORY_BADGE_STYLES: Record<InjectCategory, string> = {
  public_reaction: "border-primary text-primary",
  press: "border-muted-foreground text-muted-foreground",
  misinformation: "border-warning text-warning",
  disinformation: "border-destructive text-destructive",
  malinformation: "border-crimson text-crimson",
};

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

const CONSULTANT_GENERATION_TIMEOUT_MS = 10000;

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

/** One inject-menu card. Module-level so its source/channel selections survive re-renders. */
const MenuInjectCard = ({
  item,
  isActive,
  teamMode,
  onSend,
}: {
  item: InjectMenuItem;
  isActive: boolean;
  teamMode: string;
  onSend: (item: InjectMenuItem, source: string, channel: string, targetTeam: "blue" | "red" | "both") => void;
}) => {
  const [source, setSource] = useState(item.sources[0]);
  const [channel, setChannel] = useState(item.channels[0]);
  return (
    <div className="border-2 border-border p-4 hover:border-warning transition-colors space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {getInjectIcon(item.type)}
          <span className="font-bold uppercase tracking-wider text-sm">{item.label}</span>
        </div>
        <Badge variant="outline" className={`text-[9px] uppercase ${CATEGORY_BADGE_STYLES[item.category]}`}>
          {INJECT_CATEGORY_LABELS[item.category]}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">{item.content}</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Source</Label>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="h-8 text-xs border-2"><SelectValue /></SelectTrigger>
            <SelectContent>
              {item.sources.map((s) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Channel</Label>
          <Select value={channel} onValueChange={setChannel}>
            <SelectTrigger className="h-8 text-xs border-2"><SelectValue /></SelectTrigger>
            <SelectContent>
              {item.channels.map((c) => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 uppercase tracking-wider text-xs border-primary text-primary hover:bg-primary/10"
          onClick={() => onSend(item, source, channel, "blue")}
          disabled={!isActive}
        >
          <Shield className="h-3 w-3 mr-1" />
          Blue
        </Button>
        {teamMode === "team-vs-team" && (
          <Button
            size="sm"
            variant="outline"
            className="flex-1 uppercase tracking-wider text-xs border-destructive text-destructive hover:bg-destructive/10"
            onClick={() => onSend(item, source, channel, "red")}
            disabled={!isActive}
          >
            <Target className="h-3 w-3 mr-1" />
            Red
          </Button>
        )}
        <Button
          size="sm"
          className="flex-1 uppercase tracking-wider text-xs"
          onClick={() => onSend(item, source, channel, "both")}
          disabled={!isActive}
        >
          Both
        </Button>
      </div>
    </div>
  );
};

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("Generation timed out")), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

export interface DecisionLogEntry {
  beatId: string;
  beatTitle: string;
  condition: string;
  route: string;
  atSeconds: number;
  frozen?: boolean;
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
    isAggressive: false,
    category: "disinformation" as InjectCategory,
    channel: "X"
  });

  // Pre-planned storyline pack for the selected simulation company
  const [storylinePack, setStorylinePack] = useState<HostedScenarioPack | null>(null);

  // Participant pre-brief, freeze-frame decision points, recorded decision path
  const [preBrief, setPreBrief] = useState("");
  const [freezePrompt, setFreezePrompt] = useState("");
  const [isFreezeOpen, setIsFreezeOpen] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [decisionLog, setDecisionLog] = useState<DecisionLogEntry[]>([]);
  const [observerCount, setObserverCount] = useState(0);
  const [hasEnded, setHasEnded] = useState(false);

  // Recent participant statements — used for reactionary malinformation injects
  const [recentResponses, setRecentResponses] = useState<Array<{ id: string; label: string; custom: string | null }>>([]);

  const [injectedEvents, setInjectedEvents] = useState<Array<{
    id: string;
    time: Date;
    type: string;
    content: string;
    targetTeam: "blue" | "red" | "both";
    category?: InjectCategory;
  }>>([]);



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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Sign in to host a session.');
        const { data, error } = await supabase
          .from('exercise_sessions')
          .insert({
            created_by_user_id: user.id,
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
        setObserverCount(teams.filter(t => t.team_type === 'observer' && t.is_connected).length);

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
          if (team.team_type === 'observer') { fetchTeams(); return; }
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

  // Auto-load the pre-planned storyline pack for the selected simulation company
  useEffect(() => {
    const pack = getHostedScenarioPack(config.simulationCompanyId);
    if (!pack) return;
    setStorylinePack(pack);
    if (pack) setPreBrief(prev => prev || `You are the crisis team for ${config.brandName}. ${pack.narrative}\n\nYou'll receive news, social posts and leaks as they break. Decide quickly, agree who signs off statements, and keep a note of why you chose each action.`);
    if (!scenario) {
      const packScenario: Scenario = {
        id: crypto.randomUUID(),
        refCode: generateRefCode(),
        title: pack.title,
        narrative: pack.narrative,
        basedOnTruth: true,
        implicatedParties: [],
        severity: pack.severity,
        spreadPattern: "coordinated",
      };
      setScenario(packScenario);
      onScenarioGenerated?.(packScenario);
      setPreviewInjects(
        pack.beats.flatMap((beat) =>
          beat.injects.map((inject, i) => ({
            id: `${beat.id}-${i}`,
            timestamp: Math.round(beat.offsetMinutes * (config.duration / 60)) * 60,
            type: inject.type,
            content: inject.content,
            source: `${inject.source} · ${inject.channel}`,
            reach: inject.reach,
            sentiment: "hostile" as const,
            requiresResponse: true,
          }))
        )
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.simulationCompanyId]);

  // Recent participant statements — feed the reactionary malinformation picker
  useEffect(() => {
    if (!sessionId) return;
    const fetchResponses = async () => {
      const { data } = await supabase
        .from('exercise_responses')
        .select('id, response_label, custom_response')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(10);
      if (data) {
        setRecentResponses(data.map((r) => ({ id: r.id, label: r.response_label, custom: r.custom_response })));
      }
    };
    fetchResponses();
    const interval = setInterval(fetchResponses, 15000);
    return () => clearInterval(interval);
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
        .update({ status: newStatus, freeze_prompt: null })
        .eq('id', sessionId);

      if (error) throw error;

      setIsFrozen(false);
      setIsPaused(!isPaused);
      toast.info(isPaused ? "Exercise resumed" : "Exercise paused");
    } catch (error) {
      console.error("Error toggling pause:", error);
    }
  };

  const elapsedSeconds = config.duration * 60 - timeRemaining;

  const currentBeat = (() => {
    if (!storylinePack) return null;
    const scale = config.duration / 60;
    let beat = storylinePack.beats[0] ?? null;
    for (const b of storylinePack.beats) if (elapsedSeconds / 60 >= Math.round(b.offsetMinutes * scale)) beat = b;
    return beat;
  })();

  const handleSavePreBrief = async () => {
    if (!sessionId) return;
    const { error } = await supabase.from('exercise_sessions').update({ pre_brief: preBrief.trim() || null }).eq('id', sessionId);
    if (error) { toast.error("Couldn't save the pre-brief"); return; }
    toast.success("Pre-brief shared with participants");
  };

  const openFreeze = () => {
    setFreezePrompt(currentBeat ? `Decision point: ${currentBeat.title}. What do you do next, and who signs it off?` : "Decision point: what do you do next, and who signs it off?");
    setIsFreezeOpen(true);
  };

  const handleFreeze = async () => {
    if (!sessionId || !freezePrompt.trim()) return;
    const { error } = await supabase.from('exercise_sessions').update({ status: 'paused', freeze_prompt: freezePrompt.trim() }).eq('id', sessionId);
    if (error) { toast.error("Couldn't freeze the exercise"); return; }
    setIsPaused(true);
    setIsFrozen(true);
    setIsFreezeOpen(false);
    toast.info("Freeze frame shown to participants");
  };

  const handleRecordBranch = async (beatId: string, beatTitle: string, condition: string, route: string) => {
    if (!sessionId) return;
    const next = [
      ...decisionLog.filter(d => d.beatId !== beatId),
      { beatId, beatTitle, condition, route, atSeconds: elapsedSeconds, frozen: isFrozen },
    ];
    setDecisionLog(next);
    const { error } = await supabase.from('exercise_sessions').update({ decision_log: next as any }).eq('id', sessionId);
    if (error) toast.error("Couldn't save that decision");
    else toast.success(`Route recorded for "${beatTitle}"`);
  };

  // End exercise
  const handleEndExercise = async () => {
    if (!sessionId) return;

    try {
      const { error } = await supabase
        .from('exercise_sessions')
        .update({
          status: 'completed',
          freeze_prompt: null,
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;

      setIsExerciseActive(false);
      setIsPaused(true);
      setIsFrozen(false);
      setHasEnded(true);
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
    category?: InjectCategory;
    channel?: string;
  }) => {
    if (!sessionId) return;

    try {
      const { data, error } = await supabase
        .from('exercise_injects')
        .insert({
          session_id: sessionId,
          inject_type: inject.type,
          content: inject.content,
          source: inject.channel ? `${inject.source} · ${inject.channel}` : inject.source,
          reach: inject.reach,
          sentiment: inject.sentiment,
          is_aggressive: inject.isAggressive,
          narrative_category: inject.category ?? null,
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
      isAggressive: customInject.isAggressive,
      category: customInject.category,
      channel: customInject.channel
    });

    const newEvent = {
      id: crypto.randomUUID(),
      time: new Date(),
      type: customInject.type,
      content,
      targetTeam,
      category: customInject.category
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
      isAggressive: false,
      category: "disinformation",
      channel: "X"
    });
  };

  const handleMenuInject = async (item: InjectMenuItem, source: string, channel: string, targetTeam: "blue" | "red" | "both") => {
    const content = item.content.replace("[BRAND]", config.brandName);

    await sendInjectToDatabase({
      type: item.type,
      content,
      source,
      reach: item.reach,
      sentiment: item.category === "public_reaction" || item.category === "press" ? "neutral" : "hostile",
      isAggressive: item.category === "disinformation",
      category: item.category,
      channel
    });

    setInjectedEvents(prev => [{
      id: crypto.randomUUID(),
      time: new Date(),
      type: item.type,
      content,
      targetTeam,
      category: item.category
    }, ...prev]);
    toast.success("Inject sent!");
  };

  // Storyline beat injects come pre-prepared from the scenario pack.
  const handleStorylineInject = async (inject: StorylineInjectOption) => {
    const content = inject.content.replace("[BRAND]", config.brandName);
    await sendInjectToDatabase({
      type: inject.type,
      content,
      source: inject.source,
      reach: inject.reach,
      sentiment: inject.category === "public_reaction" || inject.category === "press" ? "neutral" : "hostile",
      isAggressive: inject.category === "disinformation",
      category: inject.category,
      channel: inject.channel
    });
    setInjectedEvents(prev => [{
      id: crypto.randomUUID(),
      time: new Date(),
      type: inject.type,
      content,
      targetTeam: "both" as const,
      category: inject.category
    }, ...prev]);
    toast.success(`Storyline inject sent: ${inject.label}`);
  };

  // Generate scenario and injects for preview
  const handleGenerateScenario = async () => {
    setIsGeneratingScenario(true);
    try {
      const { data: scenarioData, error: scenarioError } = await withTimeout(
        supabase.functions.invoke('generate-redteam-scenario', {
          body: {
            brandName: config.brandName,
            duration: config.duration,
            scenarioCategory: config.scenarioCategory || "random",
            ...(config.brandContext ? { brandContext: config.brandContext } : {})
          }
        }),
        CONSULTANT_GENERATION_TIMEOUT_MS
      );

      if (scenarioError) throw scenarioError;

      const generatedScenario: Scenario = {
        ...scenarioData,
        id: scenarioData.id || crypto.randomUUID(),
        refCode: generateRefCode()
      };

      const { data: injectsData, error: injectsError } = await withTimeout(
        supabase.functions.invoke('generate-redteam-injects', {
          body: {
            scenario: generatedScenario,
            brandName: config.brandName,
            duration: config.duration,
            ...(config.brandContext ? { brandContext: config.brandContext } : {})
          }
        }),
        CONSULTANT_GENERATION_TIMEOUT_MS
      );

      if (injectsError) throw injectsError;

      setScenario(generatedScenario);
      setPreviewInjects(injectsData?.injects || []);
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
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <Button variant="ghost" onClick={onBack} className="uppercase tracking-wider">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Exit
              </Button>
              <div className="min-w-0 break-words">
                <span className="font-bold uppercase tracking-wider">{config.brandName}</span>
                <span className="block text-xs text-muted-foreground uppercase">Consultant Dashboard</span>
              </div>
            </div>

            <div className="flex min-w-0 flex-wrap items-center gap-3">
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
                      variant="outline"
                      onClick={openFreeze}
                      disabled={isFrozen}
                      className="uppercase tracking-wider border-warning text-warning"
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Freeze Frame
                    </Button>
                    <Dialog open={isFreezeOpen} onOpenChange={setIsFreezeOpen}>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="uppercase tracking-wider">Freeze Frame Decision Point</DialogTitle>
                        </DialogHeader>
                        <p className="text-sm text-muted-foreground">The clock stops and every participant sees this question full-screen until you resume.</p>
                        <Textarea value={freezePrompt} onChange={(e) => setFreezePrompt(e.target.value)} className="min-h-[100px]" />
                        <Button onClick={handleFreeze} disabled={!freezePrompt.trim()} className="uppercase tracking-wider">Freeze &amp; Show Question</Button>
                      </DialogContent>
                    </Dialog>
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
            {!isExerciseActive && !hasEnded && (
              <Card className="border-4 border-warning bg-card">
                <CardHeader className="border-b-4 border-warning bg-warning/10 py-3">
                  <CardTitle className="flex items-center gap-2 uppercase tracking-wider text-sm">
                    <BookOpen className="h-4 w-4 text-warning" />
                    Participant Pre-brief
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <p className="text-xs text-muted-foreground">Shown to participants while they wait for you to start.</p>
                  <Textarea value={preBrief} onChange={(e) => setPreBrief(e.target.value)} placeholder="Set the scene: who they are, what they know, house rules..." className="min-h-[140px] text-xs" />
                  <Button size="sm" onClick={handleSavePreBrief} disabled={!sessionId} className="w-full uppercase tracking-wider">
                    <Send className="h-3 w-3 mr-2" />
                    Share Pre-brief
                  </Button>
                </CardContent>
              </Card>
            )}

            {hasEnded && (
              <Card className="border-4 border-primary bg-card">
                <CardHeader className="border-b-4 border-primary bg-primary/10 py-3">
                  <CardTitle className="flex items-center gap-2 uppercase tracking-wider text-sm">
                    <GitBranch className="h-4 w-4 text-primary" />
                    After-Action: Decision Path
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {decisionLog.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No routes were recorded. Use "Record route" on the storyline during the exercise to build the decision path.</p>
                  ) : (
                    [...decisionLog].sort((a, b) => a.atSeconds - b.atSeconds).map((d) => (
                      <div key={d.beatId} className="border-l-2 border-primary pl-3 space-y-1">
                        <p className="text-[10px] font-mono text-muted-foreground">
                          {Math.floor(d.atSeconds / 60)}m {d.atSeconds % 60}s{d.frozen ? " · at freeze frame" : ""}
                        </p>
                        <p className="text-xs font-bold uppercase tracking-wider">{d.beatTitle}</p>
                        <p className="text-xs"><span className="text-muted-foreground">Team chose:</span> {d.condition}</p>
                        <p className="text-xs text-muted-foreground">Result: {d.route}</p>
                      </div>
                    ))
                  )}
                  <p className="text-[10px] text-muted-foreground border-t border-border pt-2">
                    {injectedEvents.length} injects sent · {storylinePack ? `${new Set(decisionLog.map(d => d.beatId)).size}/${storylinePack.beats.length} beats with a recorded decision` : "no storyline pack"}
                  </p>
                </CardContent>
              </Card>
            )}

            {observerCount > 0 && (
              <div className="flex items-center gap-2 border-2 border-border px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground">
                <Eye className="h-3 w-3" />
                {observerCount} observer{observerCount === 1 ? "" : "s"} watching
              </div>
            )}
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
            <Tabs defaultValue={storylinePack ? "storyline" : "menu"} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="storyline" className="uppercase tracking-wider">Storyline</TabsTrigger>
                <TabsTrigger value="menu" className="uppercase tracking-wider">Inject Menu</TabsTrigger>
                <TabsTrigger value="studio" className="uppercase tracking-wider">AI Studio</TabsTrigger>
                <TabsTrigger value="custom" className="uppercase tracking-wider">Custom</TabsTrigger>
              </TabsList>

              <TabsContent value="storyline">
                <Card className="border-4 border-border bg-card">
                  <CardHeader className="border-b-4 border-border">
                    <CardTitle className="flex items-center gap-2 uppercase tracking-wider text-sm">
                      <GitBranch className="h-4 w-4 text-primary" />
                      Storyline & Decision Tree
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    {storylinePack ? (
                      <StorylineTimeline
                        pack={storylinePack}
                        durationMinutes={config.duration}
                        elapsedSeconds={config.duration * 60 - timeRemaining}
                        isActive={isExerciseActive && !isPaused}
                        onSendInject={handleStorylineInject}
                        decisions={decisionLog}
                        canRecord={isExerciseActive}
                        onRecordBranch={handleRecordBranch}
                      />
                    ) : (
                      <div className="p-8 text-center text-muted-foreground text-sm">
                        <GitBranch className="h-10 w-10 mx-auto mb-3 opacity-50" />
                        <p>No pre-planned storyline for this target.</p>
                        <p className="text-xs mt-1">Select one of the three simulation companies on the setup screen to load its pre-planned scenario, or generate a scenario from the Preview dialog.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="studio">
                <HostedInjectStudio brand={config.brandName} currentBeat={currentBeat} scenario={scenario?.narrative} sessionId={sessionId} isActive={isExerciseActive} onSent={(id, content, type) => setInjectedEvents(previous => [{ id, content, type, time: new Date(), targetTeam: 'both' }, ...previous])} />
              </TabsContent>
              <TabsContent value="menu">
                <Card className="border-4 border-border bg-card">
                  <CardHeader className="border-b-4 border-border">
                    <CardTitle className="flex items-center gap-2 uppercase tracking-wider text-sm">
                      <Zap className="h-4 w-4 text-warning" />
                      Inject Menu
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-8">
                    {(["public_reaction", "disinformation", "malinformation"] as InjectCategory[]).map((category) => (
                      <div key={category} className="space-y-3">
                        <div className="flex items-center gap-2 border-b-2 border-border pb-2">
                          <Badge variant="outline" className={`uppercase ${CATEGORY_BADGE_STYLES[category]}`}>
                            {INJECT_CATEGORY_LABELS[category]}
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">
                            {category === "public_reaction" && "Genuine voices and organic coverage — the believable background noise."}
                            {category === "disinformation" && "Adversary fabrications — forged, synthetic or impersonated material."}
                            {category === "malinformation" && "Genuine material weaponised — real quotes, clips and data stripped of context."}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {INJECT_MENU.filter((item) => item.category === category).map((item) => (
                            <MenuInjectCard
                              key={item.label}
                              item={item}
                              isActive={isExerciseActive}
                              teamMode={config.teamMode}
                              onSend={handleMenuInject}
                            />
                          ))}
                        </div>
                        {category === "malinformation" && recentResponses.length > 0 && (
                          <div className="border-2 border-dashed border-crimson/40 p-3 space-y-2">
                            <Label className="text-[10px] uppercase tracking-wider text-crimson">
                              Reactionary — quote a participant statement out of context
                            </Label>
                            <Select
                              onValueChange={(responseId) => {
                                const response = recentResponses.find((r) => r.id === responseId);
                                if (!response) return;
                                const statement = response.custom || response.label;
                                setCustomInject({
                                  type: "news_article",
                                  content: `Quoted out of context: "${statement}" — presented as an admission that the situation is worse than the company admits.`,
                                  source: "Adversary account network",
                                  reach: 70000,
                                  sentiment: "hostile",
                                  isAggressive: false,
                                  category: "malinformation",
                                  channel: "X"
                                });
                                toast.info("Malinformation inject drafted — review and send from the Custom tab.");
                              }}
                            >
                              <SelectTrigger className="h-8 text-xs border-2">
                                <SelectValue placeholder="Pick a recent participant statement…" />
                              </SelectTrigger>
                              <SelectContent>
                                {recentResponses.map((r) => (
                                  <SelectItem key={r.id} value={r.id} className="text-xs">
                                    {(r.custom || r.label).slice(0, 80)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    ))}
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

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs uppercase tracking-wider">Category</Label>
                        <Select
                          value={customInject.category}
                          onValueChange={(v) => setCustomInject({...customInject, category: v as InjectCategory})}
                        >
                          <SelectTrigger className="border-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(INJECT_CATEGORY_LABELS) as InjectCategory[]).map((cat) => (
                              <SelectItem key={cat} value={cat}>{INJECT_CATEGORY_LABELS[cat]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs uppercase tracking-wider">Channel</Label>
                        <Select
                          value={customInject.channel}
                          onValueChange={(v) => setCustomInject({...customInject, channel: v})}
                        >
                          <SelectTrigger className="border-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["X", "Facebook", "Telegram", "WhatsApp", "Website", "YouTube", "TikTok", "Instagram", "LinkedIn", "Reddit", "Press wire", "TV"].map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
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
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                            {event.category && (
                              <Badge variant="outline" className={`text-[10px] uppercase ${CATEGORY_BADGE_STYLES[event.category]}`}>
                                {INJECT_CATEGORY_LABELS[event.category]}
                              </Badge>
                            )}
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
