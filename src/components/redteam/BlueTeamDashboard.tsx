import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Loader2,
  Volume2,
  VolumeX,
  CheckCircle2,
  XCircle,
  Pause,
  ChevronDown,
  ChevronUp,
  Send,
  Clock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import CountdownTimer from "./CountdownTimer";
import { useSoundEffects } from "@/hooks/use-sound-effects";
import { useIsMobile } from "@/hooks/use-mobile";
import HostedInjectMedia from './HostedInjectMedia';
import HostedParticipantDebrief from './HostedParticipantDebrief';
import { createInjectArrivalTracker } from '@/lib/injectArrivalTracker';
import { Meter, InjectThumb, PostCard, timeAgo, reachLabel, formatLabel, firstLine, clock, type ConsoleInject } from "./ConsoleParts";

interface BlueTeamDashboardProps {
  sessionId: string;
  teamId: string;
  sessionData: any;
  onLeave: () => void;
  onComplete: (score: any) => void;
  /** Observer seat: sees the defenders' feed but cannot respond. */
  readOnly?: boolean;
}

type Inject = ConsoleInject;

interface ResponseOption {
  id: string;
  label: string;
  description: string;
  type: string;
  effectiveness: number;
  riskLevel: "low" | "medium" | "high";
}

interface ResultCard {
  injectId: string;
  effectiveness: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  wasCorrect: boolean;
}

const BlueTeamDashboard = ({ sessionId, teamId, sessionData, onLeave, onComplete, readOnly = false }: BlueTeamDashboardProps) => {
  const [session, setSession] = useState(sessionData);
  const [injects, setInjects] = useState<Inject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [responded, setResponded] = useState<Set<string>>(new Set());
  const [narrativeControl, setNarrativeControl] = useState(50);
  const [reputationDamage, setReputationDamage] = useState(20);
  const [decisionsCorrect, setDecisionsCorrect] = useState(0);
  const [decisionsTotal, setDecisionsTotal] = useState(0);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(sessionData.duration * 60);
  const [isPaused, setIsPaused] = useState(true);
  const [customCountermeasure, setCustomCountermeasure] = useState("");
  const [chosenOption, setChosenOption] = useState<string | null>(null);
  const [eventLog, setEventLog] = useState<Array<{ time: number; message: string; type: string }>>([]);
  const [result, setResult] = useState<ResultCard | null>(null);
  const [resultOpen, setResultOpen] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [now, setNow] = useState(Date.now());
  // Phone-first view state
  const [mobileScreen, setMobileScreen] = useState<"feed" | "inject">("feed");
  const [sheetOpen, setSheetOpen] = useState(false);
  const firstSeen = useRef<Record<string, number>>({});
  const arrivalTracker = useRef(createInjectArrivalTracker());
  const isMobile = useIsMobile();

  const { playSound, setEnabled: setSoundEffectsEnabled } = useSoundEffects();
  const totalDuration = sessionData.duration * 60;

  const activeInject = useMemo(() => injects.find(i => i.id === selectedId) ?? null, [injects, selectedId]);
  const unanswered = injects.filter(i => !responded.has(i.id));

  useEffect(() => { setSoundEffectsEnabled(soundEnabled); }, [soundEnabled, setSoundEffectsEnabled]);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 5000); return () => clearInterval(t); }, []);

  // Response options are neutral: effectiveness and risk only appear in feedback.
  const generateResponseOptions = (inject: Inject): ResponseOption[] => {
    const options: ResponseOption[] = [
      { id: "1", label: "Issue denial statement", description: "Quickly deny the allegations publicly", type: "statement", effectiveness: 60, riskLevel: "medium" },
      { id: "2", label: "Monitor & gather intel", description: "Watch the situation develop before responding", type: "internal_action", effectiveness: 70, riskLevel: "low" },
      { id: "3", label: "Truth-sandwich holding line", description: "Lead with the verified fact, name the manipulation, restate the fact", type: "statement", effectiveness: 80, riskLevel: "low" },
    ];
    if (inject.inject_type === "news_article") {
      options.push({ id: "4", label: "Contact editor", description: "Request correction or balanced coverage", type: "media_outreach", effectiveness: 75, riskLevel: "low" });
    }
    if (inject.inject_type === "influencer") {
      options.push({ id: "5", label: "DM the influencer", description: "Privately reach out with facts", type: "social_response", effectiveness: 80, riskLevel: "low" });
    }
    return options;
  };

  const [incoming, setIncoming] = useState<Inject | null>(null);
  const [arrivedIds, setArrivedIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!incoming) return;
    const t = setTimeout(() => setIncoming(null), 4500);
    return () => clearTimeout(t);
  }, [incoming]);
  // Keep the feed live even if a realtime event is missed.
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === "visible") fetchInjects(); }, 8000);
    return () => clearInterval(t);
  }, [sessionId]);

  const alertNewInject = (inject: Inject) => {
    setIncoming(inject);
    setArrivedIds(prev => new Set(prev).add(inject.id));
    setTimeout(() => setArrivedIds(prev => { const n = new Set(prev); n.delete(inject.id); return n; }), 2600);
    playSound("inject");
    if (soundEnabled && typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate?.([120, 60, 120]); } catch { /* unsupported */ }
    }
    setEventLog(prev => [{
      time: totalDuration - timeRemaining,
      message: `[${inject.inject_type.toUpperCase()}] ${inject.source}: "${inject.content.substring(0, 50)}..."`,
      type: "inject"
    }, ...prev]);
    if (inject.is_aggressive) {
      setReputationDamage(prev => Math.min(100, prev + 5));
      setNarrativeControl(prev => Math.max(0, prev - 5));
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    fetchInjects();

    const sessionChannel = supabase
      .channel(`blue-session-${sessionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exercise_sessions', filter: `id=eq.${sessionId}` }, (payload) => {
        if (payload.new) {
          const newSession = payload.new as any;
          setSession(newSession);
          if (newSession.status === "active" && session.status === "waiting") {
            setIsPaused(false);
            toast.success("Exercise started!");
          }
        }
      })
      .subscribe();

    const injectChannel = supabase
      .channel(`blue-injects-${sessionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exercise_injects', filter: `session_id=eq.${sessionId}` }, () => fetchInjects())
      .subscribe();

    return () => {
      supabase.removeChannel(sessionChannel);
      supabase.removeChannel(injectChannel);
    };
  }, [sessionId, session.status]);

  // Timer effect
  useEffect(() => {
    if (isPaused || timeRemaining <= 0 || session.status !== "active") return;
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) { handleExerciseComplete(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, session.status]);

  // Update team stats in database
  useEffect(() => {
    if (readOnly) return;
    void supabase.from("exercise_teams").update({
      narrative_control: Math.round(narrativeControl),
      reputation_damage: Math.round(reputationDamage),
      decisions_correct: decisionsCorrect,
      decisions_total: decisionsTotal
    }).eq("id", teamId);
  }, [narrativeControl, reputationDamage, decisionsCorrect, decisionsTotal]);

  const fetchInjects = async () => {
    const { data } = await supabase
      .from("exercise_injects")
      .select("*")
      .eq("session_id", sessionId)
      .eq("is_sent", true)
      .order("sent_at", { ascending: false });
    if (!data) return;
    const list = data as Inject[];
    const fresh = arrivalTracker.current.accept(list);
    list.forEach(i => {
      if (!firstSeen.current[i.id]) firstSeen.current[i.id] = Date.now();
    });
    setInjects(list);
    fresh.forEach(alertNewInject);
    // Auto-select newest only when nothing unanswered is selected.
    setSelectedId(current => {
      const cur = list.find(i => i.id === current);
      if (cur && (readOnly || !respondedRef.current.has(cur.id))) return current;
      return list[0]?.id ?? current;
    });
  };
  const respondedRef = useRef(responded);
  useEffect(() => { respondedRef.current = responded; }, [responded]);

  const markResponded = (id: string) => setResponded(prev => new Set(prev).add(id));
  const elapsedFor = (id: string) => (Date.now() - (firstSeen.current[id] ?? Date.now())) / 1000;

  const handleResponse = async (option: ResponseOption) => {
    if (readOnly || !activeInject || responded.has(activeInject.id)) return;
    const inject = activeInject;
    const responseTime = elapsedFor(inject.id);
    const wasCorrect = option.effectiveness >= 65;
    playSound(wasCorrect ? "success" : "warning");
    setResponseTimes(prev => [...prev, responseTime]);
    setDecisionsTotal(prev => prev + 1);
    if (wasCorrect) {
      setDecisionsCorrect(prev => prev + 1);
      setNarrativeControl(prev => Math.min(100, prev + (option.effectiveness / 10)));
      setReputationDamage(prev => Math.max(0, prev - (option.effectiveness / 15)));
    } else {
      setNarrativeControl(prev => Math.max(0, prev - 5));
      if (option.riskLevel === "high") setReputationDamage(prev => Math.min(100, prev + 10));
    }
    markResponded(inject.id);
    await supabase.from("exercise_responses").insert({
      session_id: sessionId, team_id: teamId, inject_id: inject.id,
      response_label: option.label, response_type: option.type, effectiveness: option.effectiveness,
      response_time_seconds: responseTime, was_correct: wasCorrect
    });
    setEventLog(prev => [{ time: totalDuration - timeRemaining, message: `Response: ${option.label} (${option.effectiveness}% effective)`, type: "response" }, ...prev]);
    setResult({ injectId: inject.id, effectiveness: option.effectiveness, feedback: `You chose: ${option.label}. Risk level: ${option.riskLevel}.`, strengths: [], weaknesses: [], wasCorrect });
    setResultOpen(true);
    setChosenOption(null);
    setCustomCountermeasure("");
  };

  const handleCustomResponse = async () => {
    if (readOnly || !activeInject || !customCountermeasure.trim() || responded.has(activeInject.id)) return;
    const inject = activeInject;
    const text = customCountermeasure;
    const responseTime = elapsedFor(inject.id);
    let effectiveness = 50;
    let feedback = "";
    let strengths: string[] = [];
    let weaknesses: string[] = [];
    let wasCorrect = false;
    setIsEvaluating(true);
    try {
      const { data, error } = await supabase.functions.invoke("evaluate-crisis-response", {
        body: { injectContent: inject.content, injectType: inject.inject_type, customResponse: text, brandName: session.brand_name, scenarioTitle: session.scenario_title }
      });
      if (data && !error) {
        effectiveness = data.effectiveness || 50;
        feedback = data.feedback || "";
        strengths = data.strengths || [];
        weaknesses = data.weaknesses || [];
        wasCorrect = data.wasCorrect || effectiveness >= 65;
        playSound(wasCorrect ? "success" : "error");
      } else throw error ?? new Error("No evaluation");
    } catch (err) {
      console.error("Error evaluating response:", err);
      const hasKeywords = ['statement', 'media', 'respond', 'clarify', 'evidence', 'fact', 'truth', 'investigate'].some(k => text.toLowerCase().includes(k));
      const lengthBonus = Math.min(20, text.length / 10);
      effectiveness = Math.min(85, 50 + (hasKeywords ? 15 : 0) + lengthBonus);
      wasCorrect = effectiveness >= 65;
      feedback = wasCorrect ? "Solid response approach." : "Response could be more strategic.";
      strengths = hasKeywords ? ["Uses relevant crisis response language"] : [];
      weaknesses = !hasKeywords ? ["Consider using more specific crisis management terminology"] : [];
      playSound(wasCorrect ? "success" : "error");
    } finally {
      setIsEvaluating(false);
    }
    setResult({ injectId: inject.id, effectiveness, feedback, strengths, weaknesses, wasCorrect });
    setResultOpen(true);
    setResponseTimes(prev => [...prev, responseTime]);
    setDecisionsTotal(prev => prev + 1);
    if (wasCorrect) {
      setDecisionsCorrect(prev => prev + 1);
      setNarrativeControl(prev => Math.min(100, prev + (effectiveness / 10)));
      setReputationDamage(prev => Math.max(0, prev - (effectiveness / 15)));
    } else {
      setNarrativeControl(prev => Math.max(0, prev - 3));
    }
    markResponded(inject.id);
    await supabase.from("exercise_responses").insert({
      session_id: sessionId, team_id: teamId, inject_id: inject.id,
      response_label: text.substring(0, 50), response_type: "custom", effectiveness: Math.round(effectiveness),
      response_time_seconds: responseTime, was_correct: wasCorrect, custom_response: text
    });
    setEventLog(prev => [{ time: totalDuration - timeRemaining, message: `Custom Response: "${text.substring(0, 40)}..." (${Math.round(effectiveness)}% effective)`, type: "response" }, ...prev]);
    setCustomCountermeasure("");
    setChosenOption(null);
  };

  const submit = () => {
    if (!activeInject) return;
    if (customCountermeasure.trim()) return void handleCustomResponse();
    const option = generateResponseOptions(activeInject).find(o => o.id === chosenOption);
    if (option) void handleResponse(option);
  };

  const handleExerciseComplete = () => {
    const avgResponseTime = responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;
    onComplete({
      team: "blue",
      points: Math.round((narrativeControl * 10) + ((100 - reputationDamage) * 5)),
      reputationDamage, narrativeControl, responseTime: avgResponseTime, decisionsCorrect, decisionsTotal
    });
  };

  const select = (id: string) => { setSelectedId(id); setChosenOption(null); };
  const showTimer = session.status === "active" || (session.status === "paused" && !session.freeze_prompt);
  const answered = activeInject ? responded.has(activeInject.id) : false;

  const media = (inject: Inject, large = true) => (
    inject.video_storage_path || inject.artefact
      ? <HostedInjectMedia storagePath={inject.video_storage_path} artefact={inject.artefact} />
      : <PostCard source={inject.source} content={inject.content} label={formatLabel(inject)} large={large} />
  );

  const resultCard = result && activeInject && result.injectId === activeInject.id && (
    <div className={`border ${result.wasCorrect ? "border-success" : "border-destructive"} bg-card`}>
      <button type="button" onClick={() => setResultOpen(o => !o)} className="flex w-full items-center justify-between px-3 py-2 text-left">
        <span className="flex items-center gap-2 text-xs uppercase tracking-wider">
          {result.wasCorrect ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-destructive" />}
          {Math.round(result.effectiveness)}% · {result.wasCorrect ? "Effective" : "Needs improvement"}
        </span>
        {resultOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {resultOpen && (
        <div className="space-y-3 border-t border-border p-3 text-xs">
          {result.feedback && <p className="text-muted-foreground">{result.feedback}</p>}
          {result.strengths.length > 0 && <div><p className="mb-1 uppercase tracking-wider text-success">Strengths</p><ul className="space-y-1">{result.strengths.map((s, i) => <li key={i}>• {s}</li>)}</ul></div>}
          {result.weaknesses.length > 0 && <div><p className="mb-1 uppercase tracking-wider text-destructive">Areas to improve</p><ul className="space-y-1">{result.weaknesses.map((w, i) => <li key={i}>• {w}</li>)}</ul></div>}
        </div>
      )}
    </div>
  );

  const responseControls = activeInject && !readOnly && (
    answered ? (
      <p className="text-xs text-muted-foreground">Response submitted for this inject. Pick another from the feed.</p>
    ) : (
      <div className="space-y-2">
        {generateResponseOptions(activeInject).map(option => (
          <button
            key={option.id}
            type="button"
            onClick={() => { setChosenOption(option.id); setCustomCountermeasure(""); }}
            className={`w-full border p-3 text-left transition-colors ${chosenOption === option.id ? "border-defender bg-defender/10" : "border-border hover:border-foreground/40"}`}
          >
            <span className="block text-sm font-medium">{option.label}</span>
            <span className="block text-xs text-muted-foreground">{option.description}</span>
          </button>
        ))}
        <p className="pt-2 text-[10px] uppercase tracking-wider text-muted-foreground">Or draft your own</p>
        <Textarea
          value={customCountermeasure}
          onChange={e => { setCustomCountermeasure(e.target.value); if (e.target.value) setChosenOption(null); }}
          placeholder="Describe your countermeasure…"
          className="min-h-[110px] border focus-visible:ring-defender"
        />
        <Button onClick={submit} disabled={isEvaluating || (!chosenOption && !customCountermeasure.trim())} className="w-full bg-defender text-forest hover:bg-defender/90 uppercase tracking-wider">
          {isEvaluating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Evaluating…</> : <><Send className="mr-2 h-4 w-4" />Submit response</>}
        </Button>
      </div>
    )
  );

  const freeze = session.freeze_prompt && (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/90 p-4">
      <Card className="border-4 border-warning max-w-xl w-full">
        <CardContent className="p-8 space-y-4 text-center">
          <Pause className="h-10 w-10 mx-auto text-warning" />
          <p className="text-xs uppercase tracking-widest text-warning">Freeze frame · Clock stopped</p>
          <p className="text-lg leading-relaxed">{session.freeze_prompt}</p>
          <p className="text-xs text-muted-foreground">Discuss this with your team. The facilitator will resume the exercise.</p>
        </CardContent>
      </Card>
    </div>
  );

  const waiting = (
    <Card className="border border-border max-w-lg mx-auto mt-12">
      <CardContent className="p-10 text-center">
        <Loader2 className="h-12 w-12 mx-auto mb-6 text-defender animate-spin" />
        <h3 className="font-display text-xl uppercase tracking-wider mb-2">Waiting for exercise to start</h3>
        <p className="text-muted-foreground text-sm">The facilitator will start the exercise shortly. Stay ready!</p>
        {session.pre_brief && (
          <div className="mt-8 text-left border-l-2 border-warning pl-4">
            <p className="text-xs uppercase tracking-wider text-warning mb-2">Pre-brief</p>
            <p className="text-sm whitespace-pre-line">{session.pre_brief}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const soundToggle = (
    <Button variant="ghost" size="sm" onClick={() => setSoundEnabled(!soundEnabled)} className="p-2" title={soundEnabled ? "Mute sounds" : "Enable sounds"}>
      {soundEnabled ? <Volume2 className="h-4 w-4 text-muted-foreground" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
    </Button>
  );

  if (session.status === 'completed') {
    return <HostedParticipantDebrief sessionId={sessionId} teamId={teamId} onBack={onLeave} />;
  }

  // ===== Phone-first (below 768px) =====
  if (isMobile) {
    return (
      <div className="theme-blue min-h-[100dvh] bg-background text-foreground">
        {freeze}
        {incoming && (
          <Button type="button" variant="ghost" key={incoming.id} onClick={() => { select(incoming.id); setIncoming(null); if (isMobile) setMobileScreen("inject"); }}
            className="incoming-alert fixed inset-x-0 mx-auto top-4 z-[60] h-auto w-[min(92vw,420px)] flex-col items-start whitespace-normal rounded-none border-2 border-destructive bg-card p-4 text-left shadow-lg">
            <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-destructive">
              <span className="h-2 w-2 animate-ping rounded-full bg-destructive" />Incoming
            </span>
            <span className="mt-1 block text-[10px] uppercase tracking-wider text-muted-foreground">{formatLabel(incoming)} · {incoming.source}</span>
            <span className="mt-1 block text-sm font-semibold leading-snug">{firstLine(incoming.content, 90)}</span>
          </Button>
        )}
        {mobileScreen === "inject" && activeInject ? (
          <div className="fixed inset-0 z-40 flex flex-col bg-background">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <Button variant="ghost" size="sm" onClick={() => { setMobileScreen("feed"); setSheetOpen(false); }}><ArrowLeft className="mr-1 h-4 w-4" />Feed</Button>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{formatLabel(activeInject)} · {reachLabel(activeInject.reach)}</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className={`min-h-full flex flex-col justify-center ${activeInject.video_storage_path ? "" : "p-3"}`}>{media(activeInject)}</div>
            </div>
            {!readOnly && (
              <div className="border-t border-border p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <Button onClick={() => setSheetOpen(true)} className="h-12 w-full bg-defender text-forest hover:bg-defender/90 uppercase tracking-widest">{answered ? "View result" : "Respond"}</Button>
              </div>
            )}
            {readOnly && <p className="border-t border-border p-3 text-center text-xs text-muted-foreground">Observer view: the defending team is choosing their response.</p>}
            {sheetOpen && !readOnly && (
              <div className="fixed inset-0 z-50 flex flex-col justify-end bg-background/70" onClick={() => setSheetOpen(false)}>
                <div className="max-h-[80dvh] overflow-y-auto rounded-t-2xl border-t border-border bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))] animate-in slide-in-from-bottom" onClick={e => e.stopPropagation()}>
                  <div className="mx-auto mb-3 h-1 w-10 bg-muted" />
                  <p className="mb-3 font-display text-lg uppercase">How do you respond?</p>
                  <div className="space-y-3">{resultCard}{responseControls}</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="px-4 pb-16 pt-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={onLeave}><ArrowLeft className="mr-1 h-4 w-4" />Leave</Button>
              {soundToggle}
            </div>
            {session.status === "waiting" ? waiting : (
              <>
                <div className="py-6 text-center">
                  <p className="font-display text-6xl tabular-nums">{clock(timeRemaining)}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">{session.brand_name} · {readOnly ? "Observer" : "Blue team"} · {session.status === "paused" ? "Paused" : "Live"}</p>
                  <div className="mt-4 flex justify-center gap-6"><Meter label="Narrative" value={narrativeControl} tone="defender" /><Meter label="Damage" value={reputationDamage} tone="threat" /></div>
                </div>
                <div className="space-y-3">
                  {injects.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground"><Clock className="mx-auto mb-2 h-6 w-6" />Monitoring. Alerts appear here when they land.</p>}
                  {injects.map(inject => {
                    const isNew = !responded.has(inject.id);
                    return (
                      <button key={inject.id} type="button" onClick={() => { select(inject.id); setMobileScreen("inject"); }}
                        className={`w-full p-4 text-left ${arrivedIds.has(inject.id) ? "inject-arrive " : ""}${isNew && !readOnly ? "bg-bone text-forest" : "border border-border bg-card text-foreground"}`}>
                        <p className={`text-[10px] font-medium uppercase tracking-wider ${isNew && !readOnly ? "text-oxblood" : "text-muted-foreground"}`}>
                          {isNew && !readOnly ? "New inject" : "Responded"} · {inject.source} · {timeAgo(inject.sent_at, now)}
                        </p>
                        <p className="mt-1 font-semibold leading-snug">{firstLine(inject.content, 90)}</p>
                        <p className="mt-1 text-[11px] opacity-70">{formatLabel(inject)} · {reachLabel(inject.reach)}</p>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  // ===== Desktop / tablet (newsroom feed) =====
  return (
    <div className="theme-blue flex min-h-screen flex-col bg-background text-foreground lg:h-screen">
      {incoming && (
        <Button type="button" variant="ghost" key={incoming.id} onClick={() => { select(incoming.id); setIncoming(null); if (isMobile) setMobileScreen("inject"); }}
          className="incoming-alert fixed inset-x-0 mx-auto top-4 z-[60] h-auto w-[min(92vw,420px)] flex-col items-start whitespace-normal rounded-none border-2 border-destructive bg-card p-4 text-left shadow-lg">
          <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-destructive">
            <span className="h-2 w-2 animate-ping rounded-full bg-destructive" />Incoming
          </span>
          <span className="mt-1 block text-[10px] uppercase tracking-wider text-muted-foreground">{formatLabel(incoming)} · {incoming.source}</span>
          <span className="mt-1 block text-sm font-semibold leading-snug">{firstLine(incoming.content, 90)}</span>
        </Button>
      )}
      <header className="sticky top-0 z-50 border-b-2 border-defender bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onLeave} className="uppercase tracking-wider"><ArrowLeft className="h-4 w-4 mr-1" />Leave</Button>
            <div>
              <span className="font-display text-lg uppercase tracking-wider">{session.brand_name}</span>
              <span className="ml-3 text-[10px] uppercase tracking-widest text-defender">{readOnly ? "Observer · Read only" : "Blue team · Defenders"}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {showTimer ? (
              <CountdownTimer timeRemaining={timeRemaining} totalDuration={totalDuration} isPaused={isPaused} onPauseToggle={() => {}} />
            ) : (
              <Badge variant="secondary" className="uppercase">{session.status === "waiting" ? "Waiting for start" : session.status === "paused" ? "Paused" : "Ended"}</Badge>
            )}
            <Meter label="Narrative" value={narrativeControl} tone="defender" />
            <Meter label="Damage" value={reputationDamage} tone="threat" />
            {soundToggle}
          </div>
        </div>
      </header>

      {freeze}

      {session.status === "waiting" ? <main className="p-4">{waiting}</main> : (
        <main className="grid flex-1 grid-cols-1 gap-px bg-border lg:min-h-0 lg:grid-cols-[290px_1fr_330px]">
          {/* Incoming */}
          <section className="bg-background lg:min-h-0 lg:overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Incoming · {injects.length}</p>
              {!readOnly && unanswered.length > 0 && <span className="border border-destructive px-1.5 text-[10px] uppercase text-destructive">{unanswered.length} new</span>}
            </div>
            {injects.length === 0 && <p className="p-4 text-xs text-muted-foreground">Monitoring. Red team injects appear here when they strike.</p>}
            <div className="flex gap-2 overflow-x-auto p-2 lg:block lg:space-y-1 lg:overflow-visible">
              {injects.map(inject => {
                const isNew = !responded.has(inject.id);
                const active = inject.id === selectedId;
                return (
                  <button key={inject.id} type="button" onClick={() => select(inject.id)}
                    className={`flex w-64 shrink-0 items-center gap-2 border text-left lg:w-full ${arrivedIds.has(inject.id) ? "inject-arrive " : ""}${active ? "border-defender bg-secondary" : "border-border hover:bg-secondary/60"}`}>
                    <span className={`w-[3px] self-stretch ${inject.is_aggressive ? "bg-destructive" : "bg-warning"}`} />
                    <InjectThumb inject={inject} />
                    <span className="min-w-0 flex-1 py-2 pr-2">
                      <span className="block truncate text-xs font-medium">{firstLine(inject.content, 48)}</span>
                      <span className="block truncate text-[10px] text-muted-foreground">{formatLabel(inject)} · {reachLabel(inject.reach)} · {timeAgo(inject.sent_at, now)}</span>
                      <span className="block text-[10px]">{isNew && !readOnly ? <span className="text-destructive">● new</span> : <span className="text-muted-foreground">Responded</span>}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Selected inject */}
          <section className="bg-background p-4 lg:min-h-0 lg:overflow-y-auto">
            {activeInject ? (
              <div className="mx-auto max-w-3xl space-y-3">
                {media(activeInject)}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-muted-foreground">{activeInject.source}</span>
                  <span className="border border-border px-2 py-0.5">{reachLabel(activeInject.reach)}</span>
                  {!answered && !readOnly && <span className="border border-warning px-2 py-0.5 text-warning">Needs response · {timeAgo(new Date(firstSeen.current[activeInject.id] ?? Date.now()).toISOString(), now)}</span>}
                  {activeInject.created_by === "red_team" && <span className="border border-destructive px-2 py-0.5 text-destructive">Red team attack</span>}
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center">
                <Clock className="mb-4 h-12 w-12 text-muted-foreground animate-pulse" />
                <h3 className="font-display text-xl uppercase tracking-wider">Monitoring…</h3>
                <p className="text-sm text-muted-foreground">Watching for attacks.</p>
              </div>
            )}
          </section>

          {/* Your response */}
          <section className="bg-background p-3 lg:min-h-0 lg:overflow-y-auto">
            <p className="mb-3 text-[10px] uppercase tracking-widest text-muted-foreground">Your response</p>
            {readOnly ? (
              <p className="text-sm text-muted-foreground">Observer view: the defending team is choosing their response.</p>
            ) : activeInject ? (
              <div className="space-y-3">{resultCard}{responseControls}</div>
            ) : (
              <p className="text-xs text-muted-foreground">Select an inject to respond.</p>
            )}
          </section>
        </main>
      )}
    </div>
  );
};

export default BlueTeamDashboard;
