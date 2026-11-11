import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Pause, Plus, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import LiveLeaderboard from "./LiveLeaderboard";
import HostedInjectMedia from './HostedInjectMedia';
import HostedParticipantDebrief from './HostedParticipantDebrief';
import { Meter, InjectThumb, PostCard, reachLabel, formatLabel, firstLine, clock, type ConsoleInject } from "./ConsoleParts";

interface RedTeamDashboardProps {
  sessionId: string;
  teamId: string;
  sessionData: any;
  onLeave: () => void;
}

type Inject = ConsoleInject & { created_at: string };
type Mode = "compose" | "arsenal" | "fire";
type FormatKey = "news_clip" | "short_video" | "photo" | "post" | "leaked_doc" | "group_chat";
type Phase = "seed" | "amplify" | "escalate" | "break";
interface VisualRequest { id: string; format: string; brief: string; claim: string; reach: number; phase: string | null; status: string; inject_id: string | null; host_note: string | null; created_at: string }
interface BlueResponse { id: string; inject_id: string | null; response_label: string; custom_response: string | null; effectiveness: number | null; created_at: string }

const FORMATS: { key: FormatKey; label: string; injectType: string; visual: boolean }[] = [
  { key: "news_clip", label: "News clip", injectType: "news_article", visual: true },
  { key: "short_video", label: "Short video", injectType: "influencer", visual: true },
  { key: "photo", label: "Photo", injectType: "social_post", visual: true },
  { key: "post", label: "Post", injectType: "social_post", visual: false },
  { key: "leaked_doc", label: "Leaked doc", injectType: "leak", visual: false },
  { key: "group_chat", label: "Group chat", injectType: "group_chat", visual: false },
];
const REACH = [
  { label: "Niche", value: 5_000 },
  { label: "Regional", value: 50_000 },
  { label: "National", value: 500_000 },
  { label: "Viral", value: 2_000_000 },
];
const PHASES: Phase[] = ["seed", "amplify", "escalate", "break"];
const MODE_KEY = "greyscan.redteam.mode";

const chip = (active: boolean) => `border px-2 py-1 text-[11px] uppercase tracking-wider transition-colors ${active ? "border-bone bg-bone text-forest" : "border-border text-muted-foreground hover:text-foreground"}`;

const RedTeamDashboard = ({ sessionId, teamId, sessionData, onLeave }: RedTeamDashboardProps) => {
  const [session, setSession] = useState(sessionData);
  const [injects, setInjects] = useState<Inject[]>([]);
  const [requests, setRequests] = useState<VisualRequest[]>([]);
  const [responses, setResponses] = useState<BlueResponse[]>([]);
  const [blueTeamId, setBlueTeamId] = useState<string | null>(null);
  const [blueTeamStats, setBlueTeamStats] = useState({ narrativeControl: 50, reputationDamage: 20 });
  const statHistory = useRef<{ t: number; nc: number; rd: number }[]>([]);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [mode, setModeState] = useState<Mode>(() => {
    try { const v = localStorage.getItem(MODE_KEY); return v === "arsenal" || v === "fire" ? v : "compose"; } catch { return "compose"; }
  });
  const setMode = (m: Mode) => { setModeState(m); try { localStorage.setItem(MODE_KEY, m); } catch { /* storage unavailable */ } };

  // Compose form
  const [format, setFormat] = useState<FormatKey>("post");
  const [brief, setBrief] = useState("");
  const [claim, setClaim] = useState("");
  const [source, setSource] = useState("");
  const [reach, setReach] = useState(50_000);
  const [phase, setPhase] = useState<Phase>("seed");
  const [loadedId, setLoadedId] = useState<string | null>(null); // an existing inject or request opened from the arsenal
  const [frame, setFrame] = useState<"desktop" | "phone">("desktop");
  const [targetInjectId, setTargetInjectId] = useState<string | null>(null);

  // Arsenal filters
  const [fPhase, setFPhase] = useState<"all" | Phase>("all");
  const [fFormat, setFFormat] = useState<string>("all");
  const [fStatus, setFStatus] = useState<string>("all");
  const [dragId, setDragId] = useState<string | null>(null);

  const presetInjects = [
    { label: "Anonymous Tip", type: "social_post", content: `BREAKING: Anonymous source reveals shocking information about ${session.brand_name}...`, source: "@AnonymousTipper (12K)", reach: 12000 },
    { label: "Fake Leak", type: "leak", content: `LEAKED: Internal ${session.brand_name} documents show concerning practices`, source: "SecretDocs.io", reach: 50000 },
    { label: "Influencer Pile-on", type: "influencer", content: `I've heard some things about ${session.brand_name} that are deeply troubling. Who else knows about this?`, source: "@TechInfluencer (500K)", reach: 500000 },
    { label: "News Pickup", type: "news_article", content: `"Questions Emerge About ${session.brand_name} Following Social Media Claims"`, source: "DailyBuzz.net", reach: 200000 },
    { label: "Bot Amplification", type: "amplification", content: `Coordinated campaign detected: 200+ accounts now spreading narratives about ${session.brand_name}`, source: "Bot Network", reach: 300000 },
  ];

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  useEffect(() => {
    fetchInjects(); fetchBlueTeamStats(); fetchRequests();
    const channel = supabase
      .channel(`red-console-${sessionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exercise_sessions', filter: `id=eq.${sessionId}` }, (p) => { if (p.new) setSession(p.new); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exercise_injects', filter: `session_id=eq.${sessionId}` }, () => fetchInjects())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exercise_teams', filter: `session_id=eq.${sessionId}` }, () => fetchBlueTeamStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'red_visual_requests', filter: `session_id=eq.${sessionId}` }, () => fetchRequests())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'exercise_responses', filter: `session_id=eq.${sessionId}` }, () => fetchResponses())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  useEffect(() => { if (blueTeamId) fetchResponses(); }, [blueTeamId]);

  const fetchInjects = async () => {
    const { data } = await supabase.from("exercise_injects").select("*").eq("session_id", sessionId).eq("created_by", "red_team").order("created_at", { ascending: false });
    if (data) setInjects(data as Inject[]);
  };
  const fetchRequests = async () => {
    const { data } = await supabase.from("red_visual_requests").select("*").eq("session_id", sessionId).order("created_at", { ascending: false });
    if (data) setRequests(data as VisualRequest[]);
  };
  const fetchResponses = async () => {
    const { data } = await supabase.from("exercise_responses").select("id, inject_id, response_label, custom_response, effectiveness, created_at, team_id").eq("session_id", sessionId).order("created_at", { ascending: false });
    if (data) setResponses((blueTeamId ? data.filter(r => r.team_id === blueTeamId) : data) as BlueResponse[]);
  };
  const fetchBlueTeamStats = async () => {
    const { data } = await supabase.from("exercise_teams").select("*").eq("session_id", sessionId).eq("team_type", "blue").maybeSingle();
    if (data) {
      setBlueTeamId(data.id);
      const nc = data.narrative_control ?? 50, rd = data.reputation_damage ?? 20;
      setBlueTeamStats({ narrativeControl: nc, reputationDamage: rd });
      statHistory.current = [...statHistory.current.filter(s => Date.now() - s.t < 15 * 60_000), { t: Date.now(), nc, rd }];
    }
  };

  // Clock from the shared session start; elapsed / total
  const total = (session.duration ?? 60) * 60;
  const elapsed = session.started_at ? Math.min(total, (now - new Date(session.started_at).getTime()) / 1000) : 0;
  const statusLabel = session.status === "waiting" ? "Waiting" : session.status === "active" ? "LIVE" : session.status === "paused" ? "Paused" : "Ended";
  const live = session.status === "active";

  const change5 = (key: "nc" | "rd") => {
    const h = statHistory.current;
    if (h.length < 2) return 0;
    const ref = h.find(s => now - s.t <= 5 * 60_000) ?? h[0];
    return Math.round(h[h.length - 1][key] - ref[key]);
  };

  const fmt = FORMATS.find(f => f.key === format) ?? FORMATS[0];
  const loadedInject = injects.find(i => i.id === loadedId) ?? null;
  const loadedRequest = requests.find(r => r.id === loadedId) ?? null;
  const readyInjects = useMemo(() => injects.filter(i => !i.is_sent).sort((a, b) => (a.queue_position ?? 1e9) - (b.queue_position ?? 1e9) || a.created_at.localeCompare(b.created_at)), [injects]);
  const fired = injects.filter(i => i.is_sent).sort((a, b) => (b.sent_at ?? "").localeCompare(a.sent_at ?? ""));
  const openRequests = requests.filter(r => r.status === "requested" || r.status === "generating" || r.status === "rejected");

  const resetForm = () => { setBrief(""); setClaim(""); setSource(""); setReach(50_000); setLoadedId(null); };
  const textContent = () => (fmt.visual ? claim : claim || brief).trim();

  const insertText = async (fire: boolean) => {
    const content = textContent();
    if (content.length < 3) { toast.error("Write the claim Blue will read."); return null; }
    const { data, error } = await supabase.from("exercise_injects").insert({
      session_id: sessionId, created_by: "red_team", inject_type: fmt.injectType, content,
      source: source.trim() || "Anonymous Source", reach, sentiment: "hostile", is_aggressive: reach >= 500_000,
      is_sent: false, phase,
    }).select("id").single();
    if (error) { console.error(error); toast.error("Could not save the inject."); return null; }
    if (fire) await fireInject(data.id);
    else toast.success("Saved to arsenal.");
    return data.id as string;
  };

  const fireInject = async (id: string) => {
    if (!live) { toast.error("You can fire once the exercise is live."); return; }
    const { error } = await supabase.rpc("red_fire_inject", { _inject_id: id });
    if (error) { toast.error(error.message || "Could not fire."); return; }
    toast.success("Fired. Blue can see it now.");
    setTargetInjectId(id);
    if (loadedId === id) resetForm();
    void fetchInjects();
  };

  const requestVisual = async () => {
    if (brief.trim().length < 3) { toast.error("Describe the shot for the host."); return; }
    const { error } = await supabase.from("red_visual_requests").insert({
      session_id: sessionId, team_id: teamId, format, brief: brief.trim().slice(0, 1500), claim: claim.trim().slice(0, 300), reach, phase,
    });
    if (error) { console.error(error); toast.error("Could not send the request."); return; }
    toast.success("Visual requested. The host will review it before it comes back to you.");
    resetForm();
  };

  const primary = async () => {
    setBusy(true);
    try {
      if (loadedInject) return; // already exists; use Fire now
      if (fmt.visual) await requestVisual(); else await insertText(false);
    } finally { setBusy(false); }
  };

  const fireNow = async () => {
    setBusy(true);
    try {
      if (loadedInject) await fireInject(loadedInject.id);
      else if (!fmt.visual) { await insertText(true); resetForm(); }
    } finally { setBusy(false); }
  };

  const openInCompose = (id: string) => {
    const inj = injects.find(i => i.id === id);
    const req = requests.find(r => r.id === id);
    if (inj) {
      const f = inj.video_storage_path ? (inj.inject_type === "news_article" ? "news_clip" : "short_video") : inj.inject_type === "leak" ? "leaked_doc" : inj.inject_type === "group_chat" ? "group_chat" : inj.artefact ? "photo" : "post";
      setFormat(f as FormatKey); setClaim(inj.content); setSource(inj.source); setReach(inj.reach); setPhase((inj.phase as Phase) || "seed"); setBrief("");
    } else if (req) {
      setFormat(req.format as FormatKey); setBrief(req.brief); setClaim(req.claim); setReach(req.reach); setPhase((req.phase as Phase) || "seed");
    }
    setLoadedId(id);
    setMode("compose");
  };

  const usePreset = async (p: typeof presetInjects[0], fire: boolean) => {
    const { data, error } = await supabase.from("exercise_injects").insert({
      session_id: sessionId, created_by: "red_team", inject_type: p.type, content: p.content, source: p.source, reach: p.reach,
      sentiment: "hostile", is_aggressive: true, is_sent: false, phase: "seed",
    }).select("id").single();
    if (error) { toast.error("Could not add that attack."); return; }
    if (fire) await fireInject(data.id); else toast.success("Added to arsenal.");
  };

  const reorder = async (dropOn: string) => {
    if (!dragId || dragId === dropOn) return;
    const ids = readyInjects.map(i => i.id).filter(id => id !== dragId);
    ids.splice(ids.indexOf(dropOn), 0, dragId);
    setInjects(prev => prev.map(i => ids.includes(i.id) ? { ...i, queue_position: ids.indexOf(i.id) + 1 } : i));
    setDragId(null);
    const { error } = await supabase.rpc("red_set_queue", { _inject_ids: ids });
    if (error) toast.error("Could not save the queue order.");
  };

  // Status for the composer preview
  const previewStatus = loadedInject ? (loadedInject.is_sent ? "Sent" : "Ready") : loadedRequest ? (loadedRequest.status === "requested" ? "Requested" : loadedRequest.status === "generating" ? "Generating" : loadedRequest.status === "rejected" ? "Rejected" : "Ready") : "Draft";
  const canFire = live && (loadedInject ? !loadedInject.is_sent : !fmt.visual && textContent().length >= 3);

  const preview = (inj: Inject | null) => (
    inj && (inj.video_storage_path || inj.artefact)
      ? <HostedInjectMedia storagePath={inj.video_storage_path} artefact={inj.artefact} />
      : fmt.visual && !inj
        ? <div className="flex aspect-video items-center justify-center border border-dashed border-border bg-secondary/40 p-6 text-center text-xs text-muted-foreground">
            {claim || brief ? <span><span className="mb-2 block text-crimson">FICTIONAL EXERCISE · visual pending host review</span>{claim || brief}</span> : "Describe the shot. The host generates and reviews it before it returns here."}
          </div>
        : <PostCard source={inj?.source ?? (source || "Anonymous Source")} content={inj?.content ?? textContent()} label={inj ? formatLabel(inj) : fmt.label} large />
  );

  const lastResponse = targetInjectId ? responses.find(r => r.inject_id === targetInjectId) : responses[0];
  const targetInject = targetInjectId ? injects.find(i => i.id === targetInjectId) : null;

  const header = (
    <header className="sticky top-0 z-50 border-b-2 border-destructive bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onLeave} className="uppercase tracking-wider"><ArrowLeft className="h-4 w-4 mr-1" />Leave</Button>
          <span className="font-display text-lg uppercase tracking-wider">{session.brand_name}</span>
          <span className="text-[10px] uppercase tracking-widest text-destructive">Red team · Attackers</span>
          <Badge className={`uppercase ${live ? "bg-destructive text-destructive-foreground" : ""}`} variant={live ? "default" : "secondary"}>{statusLabel}</Badge>
        </div>
        <div className="flex border border-border">
          {(["compose", "arsenal", "fire"] as Mode[]).map(m => (
            <button key={m} type="button" onClick={() => setMode(m)} className={`px-3 py-1 text-[11px] uppercase tracking-wider ${mode === m ? "bg-destructive text-destructive-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {m === "fire" ? "Fire control" : m}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <span className={`font-display tabular-nums ${mode === "fire" ? "text-4xl" : "text-2xl"}`}>{clock(elapsed)}<span className="ml-1 text-xs text-muted-foreground">/ {clock(total)}</span></span>
          {mode !== "fire" && <><Meter label="Blue control" value={blueTeamStats.narrativeControl} tone="defender" /><Meter label="Damage" value={blueTeamStats.reputationDamage} tone="threat" /></>}
          {mode === "arsenal" && <Button size="sm" variant="outline" onClick={() => { resetForm(); setMode("compose"); }} className="uppercase"><Plus className="mr-1 h-3 w-3" />New inject</Button>}
        </div>
      </div>
      <div className="px-4 pb-2"><LiveLeaderboard sessionId={sessionId} /></div>
    </header>
  );

  const freeze = session.freeze_prompt && (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/90 p-4">
      <Card className="border-4 border-warning max-w-xl w-full">
        <CardContent className="p-8 space-y-4 text-center">
          <Pause className="h-10 w-10 mx-auto text-warning" />
          <p className="text-xs uppercase tracking-widest text-warning">Freeze frame · Clock stopped</p>
          <p className="text-lg leading-relaxed">{session.freeze_prompt}</p>
          <p className="text-xs text-muted-foreground">The facilitator will resume the exercise shortly.</p>
        </CardContent>
      </Card>
    </div>
  );

  const prebrief = session.status === "waiting" && session.pre_brief && (
    <div className="border border-warning m-4 p-4">
      <p className="text-xs uppercase tracking-wider text-warning mb-2">Pre-brief</p>
      <p className="text-sm whitespace-pre-line">{session.pre_brief}</p>
    </div>
  );

  if (session.status === 'completed') {
    return <HostedParticipantDebrief sessionId={sessionId} teamId={teamId} onBack={onLeave} />;
  }

  // ===== Arsenal =====
  type Card_ = { id: string; title: string; formatL: string; reach: number; phase: string | null; status: "ready" | "generating" | "requested" | "fired" | "rejected" | "quick"; inject?: Inject; note?: string | null; sentAt?: string | null; preset?: typeof presetInjects[0] };
  const cards: Card_[] = [
    ...injects.map(i => ({ id: i.id, title: firstLine(i.content, 50), formatL: formatLabel(i), reach: i.reach, phase: i.phase ?? null, status: (i.is_sent ? "fired" : "ready") as Card_["status"], inject: i, sentAt: i.sent_at })),
    ...openRequests.map(r => ({ id: r.id, title: firstLine(r.claim || r.brief, 50), formatL: FORMATS.find(f => f.key === r.format)?.label ?? r.format, reach: r.reach, phase: r.phase, status: r.status as Card_["status"], note: r.host_note })),
    ...presetInjects.map(p => ({ id: `preset-${p.label}`, title: p.label, formatL: "Quick attack", reach: p.reach, phase: null, status: "quick" as const, preset: p })),
  ];
  const fmtGroup = (c: Card_) => c.inject?.video_storage_path || c.formatL === "News clip" || c.formatL === "Short video" ? "video" : c.formatL === "Photo" ? "photo" : c.formatL === "Leaked doc" ? "docs" : c.formatL === "Group chat" ? "chats" : "posts";
  const visible = cards.filter(c =>
    (fStatus === "quick" ? c.status === "quick" : c.status !== "quick" || fStatus === "all") &&
    (fPhase === "all" || c.phase === fPhase) &&
    (fFormat === "all" || fmtGroup(c) === fFormat) &&
    (fStatus === "all" || fStatus === "quick" || (fStatus === "generating" ? c.status === "generating" || c.status === "requested" : c.status === fStatus))
  );
  const rail = (label: string, items: { k: string; l: string; n?: number }[], val: string, set: (v: any) => void) => (
    <div className="mb-4">
      <p className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      {items.map(it => <button key={it.k} type="button" onClick={() => set(it.k)} className={`block w-full px-2 py-1 text-left text-xs ${val === it.k ? "bg-bone text-forest" : "text-muted-foreground hover:text-foreground"}`}>{it.l}{it.n !== undefined && ` · ${it.n}`}</button>)}
    </div>
  );

  if (mode === "arsenal") return (
    <div className="min-h-screen bg-background">{header}{freeze}{prebrief}
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr]">
        <aside className="border-r border-border p-3">
          {rail("Phase", [{ k: "all", l: "All", n: cards.filter(c => c.status !== "quick").length }, ...PHASES.map(p => ({ k: p, l: p[0].toUpperCase() + p.slice(1), n: cards.filter(c => c.phase === p).length }))], fPhase, setFPhase)}
          {rail("Format", [{ k: "all", l: "All" }, { k: "video", l: "Video" }, { k: "photo", l: "Photo" }, { k: "posts", l: "Posts" }, { k: "docs", l: "Docs" }, { k: "chats", l: "Chats" }], fFormat, setFFormat)}
          {rail("Status", [{ k: "all", l: "All" }, { k: "ready", l: "Ready" }, { k: "generating", l: "Generating" }, { k: "fired", l: "Fired" }, { k: "quick", l: "Quick attacks" }], fStatus, setFStatus)}
        </aside>
        <main className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 xl:grid-cols-4">
          {visible.length === 0 && <p className="col-span-full p-6 text-sm text-muted-foreground">Nothing here yet. Use Compose to build an inject.</p>}
          {visible.map(c => {
            const pending = c.status === "generating" || c.status === "requested";
            return (
              <div key={c.id} className="flex flex-col border border-border bg-card">
                <button type="button" onClick={() => !c.preset && openInCompose(c.id)} className="block text-left">
                  <div className={`aspect-video overflow-hidden bg-secondary ${pending ? "opacity-40" : ""}`}>
                    {c.inject ? <InjectThumb inject={c.inject} className="h-full w-full" /> : <div className="flex h-full items-center justify-center p-3 text-center text-[11px] text-muted-foreground">{c.preset?.content.slice(0, 90) ?? c.title}</div>}
                  </div>
                  <div className="p-2">
                    <p className="truncate text-xs font-medium">{c.title}</p>
                    <p className="text-[10px] text-muted-foreground">{c.formatL} · {reachLabel(c.reach)}{c.phase ? ` · ${c.phase}` : ""}</p>
                    {c.note && c.status === "rejected" && <p className="mt-1 text-[10px] text-destructive">Host: {c.note}</p>}
                  </div>
                </button>
                <div className="mt-auto flex items-center justify-between p-2 pt-0">
                  <span className={`border px-1.5 text-[10px] uppercase ${c.status === "ready" || c.status === "quick" ? "border-success text-success" : pending ? "border-warning text-warning" : "border-border text-muted-foreground"}`}>
                    {c.status === "fired" ? `Fired ${c.sentAt ? new Date(c.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}` : c.status === "quick" ? "Ready" : c.status}
                  </span>
                  {(c.status === "ready" || c.status === "quick") && (
                    <Button size="sm" disabled={!live} onClick={() => c.preset ? usePreset(c.preset, true) : fireInject(c.id)} className="h-6 bg-destructive px-3 text-[10px] uppercase text-destructive-foreground hover:bg-destructive/90">Fire</Button>
                  )}
                </div>
              </div>
            );
          })}
        </main>
      </div>
    </div>
  );

  // ===== Fire control =====
  if (mode === "fire") {
    const next = readyInjects[0];
    const nc = change5("nc"), rd = change5("rd");
    return (
      <div className="flex min-h-screen flex-col bg-background">{header}{freeze}{prebrief}
        <div className="grid flex-1 grid-cols-1 gap-px bg-border md:grid-cols-[240px_1fr_260px]">
          <aside className="bg-background p-3">
            <p className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">Up next · drag to reorder</p>
            {readyInjects.length === 0 && <p className="text-xs text-muted-foreground">Nothing ready. Build injects in Compose.</p>}
            <div className="space-y-1">
              {readyInjects.map((i, idx) => (
                <div key={i.id} draggable onDragStart={() => setDragId(i.id)} onDragOver={e => e.preventDefault()} onDrop={() => void reorder(i.id)}
                  className={`flex cursor-grab items-center gap-2 border p-1 ${idx === 0 ? "border-destructive" : "border-border"} ${dragId === i.id ? "opacity-50" : ""}`}>
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <InjectThumb inject={i} />
                  <span className="min-w-0"><span className="block truncate text-xs">{firstLine(i.content, 40)}</span><span className="block text-[10px] text-muted-foreground">{formatLabel(i)} · {reachLabel(i.reach)}</span></span>
                </div>
              ))}
            </div>
          </aside>
          <main className="flex flex-col bg-background p-4">
            <div className="flex-1">{next ? (next.video_storage_path || next.artefact ? <HostedInjectMedia storagePath={next.video_storage_path} artefact={next.artefact} /> : <PostCard source={next.source} content={next.content} label={formatLabel(next)} large />) : <div className="flex h-full min-h-[300px] items-center justify-center text-muted-foreground">Queue empty</div>}</div>
            <button type="button" disabled={!next || !live || busy} onClick={async () => { if (!next) return; setBusy(true); await fireInject(next.id); setBusy(false); }}
              className="mt-4 h-20 w-full bg-destructive font-display text-[34px] uppercase tracking-widest text-destructive-foreground disabled:opacity-40">
              {live ? "Fire" : "Waiting for live"}
            </button>
          </main>
          <aside className="flex flex-col gap-px bg-border">
            {[{ l: "Blue control", v: blueTeamStats.narrativeControl, d: nc, cls: "text-destructive" }, { l: "Reputation damage", v: blueTeamStats.reputationDamage, d: rd, cls: "text-foreground" }].map(s => (
              <div key={s.l} className="flex flex-1 flex-col items-center justify-center bg-background p-6 text-center">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.l}</p>
                <p className={`font-display text-7xl ${s.cls}`}>{Math.round(s.v)}%</p>
                <p className="text-xs text-muted-foreground">{s.d === 0 ? "Steady" : s.d > 0 ? "Rising" : "Falling"} · {s.d > 0 ? "+" : s.d < 0 ? "−" : "±"}{Math.abs(s.d)} in 5 min</p>
              </div>
            ))}
          </aside>
        </div>
      </div>
    );
  }

  // ===== Compose (strike composer) =====
  return (
    <div className="flex min-h-screen flex-col bg-background pb-20 lg:pb-0">{header}{freeze}{prebrief}
      <div className="grid flex-1 grid-cols-1 gap-px bg-border lg:grid-cols-[330px_1fr_300px]">
        <section className="space-y-4 bg-background p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Compose{loadedId && <button type="button" onClick={resetForm} className="ml-2 underline">clear</button>}</p>
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Format</p>
            <div className="grid grid-cols-3 gap-1">{FORMATS.map(f => <button key={f.key} type="button" disabled={!!loadedId} onClick={() => setFormat(f.key)} className={chip(format === f.key)}>{f.label}</button>)}</div>
          </div>
          {fmt.visual && <div>
            <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Describe the shot</p>
            <Textarea value={brief} onChange={e => setBrief(e.target.value)} disabled={!!loadedInject} maxLength={1500} placeholder="Who is on screen, where, what they show…" className="min-h-[90px]" />
          </div>}
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">{fmt.visual ? "On-screen claim" : "The claim Blue reads"}</p>
            {fmt.visual
              ? <Input value={claim} onChange={e => setClaim(e.target.value)} disabled={!!loadedInject} maxLength={300} placeholder={`e.g. ${session.brand_name} "used secret AI" to reject claims`} />
              : <Textarea value={claim} onChange={e => setClaim(e.target.value)} disabled={!!loadedInject} maxLength={1500} placeholder={`Craft your disinformation attack against ${session.brand_name}…`} className="min-h-[90px]" />}
          </div>
          {!fmt.visual && <Input value={source} onChange={e => setSource(e.target.value)} disabled={!!loadedInject} placeholder="Source, e.g. @AccountName" maxLength={120} />}
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Reach</p>
            <div className="flex flex-wrap gap-1">{REACH.map(r => <button key={r.label} type="button" disabled={!!loadedInject} onClick={() => setReach(r.value)} className={chip(reach === r.value)}>{r.label}</button>)}</div>
          </div>
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Phase</p>
            <div className="flex flex-wrap gap-1">{PHASES.map(p => <button key={p} type="button" disabled={!!loadedInject} onClick={() => setPhase(p)} className={chip(phase === p)}>{p}</button>)}</div>
          </div>
          {!loadedInject && !loadedRequest && (
            <Button onClick={() => void primary()} disabled={busy} variant="outline" className="w-full uppercase tracking-wider">
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{fmt.visual ? "Request visual" : "Save to arsenal"}
            </Button>
          )}
          {fmt.visual && <p className="text-[11px] text-muted-foreground">Visuals are made and checked by the host, then come back here ready to fire.</p>}
        </section>

        <section className="bg-background p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Blue will see</p>
            <div className="flex border border-border">{(["desktop", "phone"] as const).map(f => <button key={f} type="button" onClick={() => setFrame(f)} className={`px-2 py-0.5 text-[10px] uppercase ${frame === f ? "bg-bone text-forest" : "text-muted-foreground"}`}>{f}</button>)}</div>
          </div>
          <div className="grid gap-4 xl:grid-cols-[1fr_140px]">
            <div className={`mx-auto w-full ${frame === "phone" ? "max-w-[360px]" : "max-w-3xl"}`}>{preview(loadedInject)}</div>
            <dl className="space-y-2 text-xs">
              <div><dt className="text-[10px] uppercase text-muted-foreground">Arrives as</dt><dd>{loadedInject ? formatLabel(loadedInject) : fmt.label}</dd></div>
              <div><dt className="text-[10px] uppercase text-muted-foreground">Platform</dt><dd>{loadedInject?.source ?? (fmt.visual ? (format === "news_clip" ? "News broadcast" : format === "photo" ? "Social photo" : "Short-form video") : source || "Anonymous Source")}</dd></div>
              <div><dt className="text-[10px] uppercase text-muted-foreground">Reach</dt><dd>{reachLabel(loadedInject?.reach ?? reach)}</dd></div>
              <div><dt className="text-[10px] uppercase text-muted-foreground">Status</dt><dd className={previewStatus === "Ready" ? "text-success" : previewStatus === "Draft" || previewStatus === "Sent" ? "" : "text-warning"}>{previewStatus}</dd></div>
              {loadedRequest?.host_note && <div><dt className="text-[10px] uppercase text-muted-foreground">Host note</dt><dd className="text-destructive">{loadedRequest.host_note}</dd></div>}
            </dl>
          </div>
        </section>

        <section className="space-y-4 bg-background p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Target</p>
          <div className="border border-border p-3">
            <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              {targetInject ? `Blue's response to "${firstLine(targetInject.content, 30)}"` : "Blue's last response"}{lastResponse && ` · ${new Date(lastResponse.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
            </p>
            {lastResponse ? <>
              <p className="text-sm">"{lastResponse.custom_response || lastResponse.response_label}"</p>
              {targetInject && lastResponse.effectiveness != null && <p className="mt-1 text-xs text-muted-foreground">Score: {Math.round(lastResponse.effectiveness)}%</p>}
            </> : <p className="text-xs text-muted-foreground">{targetInject ? "Blue hasn't responded to this yet." : "No response yet."}</p>}
          </div>
          <div className="fixed inset-x-0 bottom-0 z-40 space-y-2 border-t border-border bg-card p-3 lg:static lg:border-0 lg:bg-transparent lg:p-0">
            <Button onClick={() => void fireNow()} disabled={!canFire || busy} className="h-12 w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 font-display text-lg uppercase tracking-widest">Fire now</Button>
            {!fmt.visual && !loadedId && <Button variant="outline" onClick={() => void insertText(false).then(id => id && resetForm())} disabled={busy || textContent().length < 3} className="w-full uppercase tracking-wider">Save to arsenal</Button>}
            {fmt.visual && !loadedInject && <p className="text-[11px] text-muted-foreground">Visual injects can be fired once the host has returned them.</p>}
          </div>
        </section>
      </div>

      <div className="border-t border-border bg-background p-3">
        <p className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">Fired · {fired.length}</p>
        <div className="flex gap-2 overflow-x-auto">
          {fired.length === 0 && <p className="text-xs text-muted-foreground">Fire your first inject to see Blue's response to it.</p>}
          {fired.map(i => (
            <button key={i.id} type="button" onClick={() => setTargetInjectId(i.id)} className={`w-28 shrink-0 border text-left ${targetInjectId === i.id ? "border-destructive" : "border-border"}`}>
              <InjectThumb inject={i} className="h-14 w-full" />
              <span className="block truncate px-1 text-[10px]">{firstLine(i.content, 24)}</span>
              <span className="block px-1 text-[10px] text-muted-foreground">{i.sent_at ? new Date(i.sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RedTeamDashboard;
