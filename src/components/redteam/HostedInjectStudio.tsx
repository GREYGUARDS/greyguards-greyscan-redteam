import { useEffect, useRef, useState } from 'react';
import { Video, Newspaper, Globe, MessageCircle, Send, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PLATFORM_LABELS, suggestStats, type OverlayPlatform, type VideoOverlay, type EngagementStats } from './InjectOverlay';
import { OverlayFrame } from './HostedInjectMedia';
import { suggestForBeat } from '@/lib/injectSuggestions';
import type { StorylineBeat } from '@/lib/hostedScenarios';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HostedArtefactView, type HostedArtefact } from './HostedInjectMedia';
import { toast } from 'sonner';

type RedRequest = { id: string; format: string; brief: string; claim: string; reach: number; status: string; phase: string | null };
type Kind = 'influencer' | 'news' | HostedArtefact['kind'];
type Job = { id: string; status: string; progress?: number; error?: string | null; accessPaused?: boolean; videoUrl?: string | null; artefact?: HostedArtefact; sent?: boolean; kind?: Kind };
const formats: { value: Kind; label: string; icon: typeof Video }[] = [
  { value: 'influencer', label: 'Influencer video', icon: Video },
  { value: 'news', label: 'News footage', icon: Newspaper },
  { value: 'website', label: 'Website story', icon: Globe },
  { value: 'x', label: 'X post', icon: MessageCircle },
  { value: 'whatsapp', label: 'WhatsApp thread', icon: MessageCircle },
  { value: 'telegram', label: 'Telegram channel', icon: Send },
  { value: 'facebook', label: 'Facebook page post', icon: MessageCircle },
];

async function invoke(endpoint: string, body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke(endpoint, { body });
  if (error) {
    const details = await error.context?.json?.().catch(() => null);
    throw Object.assign(new Error(details?.error ?? error.message), { accessPaused: details?.accessPaused, status: error.context?.status, retryAfter: details?.retryAfter });
  }
  return data;
}

export default function HostedInjectStudio({ sessionId, isActive, onSent, brand = 'the company', currentBeat = null, scenario, onPrepared }: { onPrepared?: () => void; sessionId: string | null; isActive: boolean; onSent: (id: string, content: string, type: string) => void; brand?: string; currentBeat?: StorylineBeat | null; scenario?: string | null }) {
  const [platform, setPlatform] = useState<OverlayPlatform>('tiktok');
  const [overlay, setOverlay] = useState<VideoOverlay>({ platform: 'tiktok', handle: '', caption: '', channel: 'NEWS 24', headline: '', ticker: '', ...suggestStats('medium') });
  const [stats, setStats] = useState<EngagementStats>(suggestStats('medium'));
  const setO = (patch: Partial<VideoOverlay>) => setOverlay(o => ({ ...o, ...patch }));
  const suggest = () => {
    const p = kind === 'news' ? 'news' : platform;
    const s = suggestForBeat(kind, p, brand, currentBeat, scenario);
    if (kind === 'influencer' || kind === 'news') { setBrief(s.script); setSpeaker(s.speaker); } else setBrief(s.brief);
    setO({ platform: p, handle: s.handle, caption: s.caption, headline: s.headline, ticker: s.ticker, channel: overlay.channel || s.channel });
  };
  const [kind, setKind] = useState<Kind>('influencer');
  const [brief, setBrief] = useState('');
  const [speaker, setSpeaker] = useState('A fictional adult commentator, casually dressed, speaking calmly to camera.');
  const [fictional, setFictional] = useState(false);
  const [cost, setCost] = useState(false);
  const [videoJob, setVideoJob] = useState<Job | null>(null);
  const [artefactJob, setArtefactJob] = useState<Job | null>(null);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const started = useRef(0);
  const stopped = useRef(false);
  const [pollStopped, setPollStopped] = useState(false);
  const video = kind === 'influencer' || kind === 'news';
  const job = video ? videoJob : artefactJob;
  const endpoint = video ? 'hosted-video-inject' : 'hosted-artefact-inject';
  const [redRequests, setRedRequests] = useState<RedRequest[]>([]);
  const [activeRed, setActiveRed] = useState<RedRequest | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  useEffect(() => {
    if (!sessionId) return;
    const load = async () => {
      const { data } = await supabase.from('red_visual_requests').select('*').eq('session_id', sessionId).in('status', ['requested', 'generating']).order('created_at');
      setRedRequests((data ?? []) as RedRequest[]);
    };
    void load();
    const channel = supabase.channel(`red-requests-${sessionId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'red_visual_requests', filter: `session_id=eq.${sessionId}` }, () => void load()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);
  const takeRed = async (r: RedRequest) => {
    const k: Kind = r.format === 'news_clip' ? 'news' : r.format === 'short_video' ? 'influencer' : 'facebook';
    setKind(k); setActiveRed(r); setError(null);
    setBrief(k === 'facebook' ? `${r.brief}\nOn-screen claim: ${r.claim}` : (r.claim || r.brief).slice(0, 240));
    if (k !== 'facebook') setSpeaker(r.brief.slice(0, 300));
    if (k === 'news') setO({ headline: r.claim.slice(0, 120) }); else setO({ caption: r.claim.slice(0, 200) });
    await supabase.from('red_visual_requests').update({ status: 'generating' }).eq('id', r.id);
  };
  const rejectRed = async () => {
    if (!activeRed) return;
    await supabase.from('red_visual_requests').update({ status: 'rejected', host_note: rejectNote.slice(0, 300) || 'Rejected by host' }).eq('id', activeRed.id);
    setActiveRed(null); setRejectNote(''); toast.success('Red request rejected.');
  };
  const generatingVideo = Boolean(videoJob && ['creating', 'queued', 'in_progress'].includes(videoJob.status));

  useEffect(() => {
    if (!sessionId) return;
    stopped.current = false;
    setPollStopped(false);
    let cancelled = false;
    void Promise.all(['hosted-video-inject', 'hosted-artefact-inject'].map(name => invoke(name, { action: 'latest', sessionId }))).then(([v, a]) => {
      if (cancelled) return;
      setVideoJob(v.job); setArtefactJob(a.job);
      setPaused(Boolean(v.job?.accessPaused || a.job?.accessPaused));
      if (v.job && ['creating', 'queued', 'in_progress'].includes(v.job.status)) started.current = Date.now();
    }).catch(failure => { if (!cancelled) setError(failure.message); });
    return () => { cancelled = true; };
  }, [sessionId]);

  useEffect(() => {
    if (!generatingVideo && !busy) return;
    if (!started.current) started.current = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - started.current) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [generatingVideo, busy]);

  useEffect(() => {
    if (!sessionId || !generatingVideo || stopped.current) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let failures = 0;
    const poll = async () => {
      let delay = 7000;
      try {
        const data = await invoke('hosted-video-inject', { action: 'status', sessionId, jobId: videoJob?.id });
        if (cancelled) return;
        setVideoJob(data.job);
        failures = 0;
        setError(null);
        if (!['creating', 'queued', 'in_progress'].includes(data.job.status)) return;
      } catch (failure: any) {
        if (cancelled) return;
        setError(failure.message);
        setPaused(Boolean(failure.accessPaused));
        // Stop on terminal errors; transient polling errors wait with bounded backoff.
        const status = failure.status;
        failures += 1;
        if (failure.accessPaused || !status || (status < 500 && status !== 429) || failures >= 3) { stopped.current = true; setPollStopped(true); return; }
        const retrySeconds = Number(failure.retryAfter);
        delay = Number.isFinite(retrySeconds) && retrySeconds > 0 ? retrySeconds * 1000 : 7000 * 2 ** failures;
      }
      timer = setTimeout(poll, delay);
    };
    timer = setTimeout(poll, 7000);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [sessionId, generatingVideo, videoJob?.id, pollStopped]);

  const generate = async () => {
    if (!sessionId || busy) return;
    setBusy(true); setError(null); setElapsed(0); started.current = Date.now(); stopped.current = false; setPollStopped(false);
    try {
      if (video) {
        const data = await invoke(endpoint, { action: 'create', sessionId, kind, script: brief, speaker, fictionalConfirmed: fictional, costConfirmed: cost });
        setVideoJob(data.job);
      } else {
        const { data: auth } = await supabase.auth.getSession();
        if (!auth.session) throw new Error('Sign in to generate an inject.');
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hosted-artefact-inject`, { method: 'POST', headers: { Authorization: `Bearer ${auth.session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'generate', sessionId, kind, brief, fictionalConfirmed: fictional, costConfirmed: cost }) });
        if (!response.ok) {
          const details = await response.json();
          throw Object.assign(new Error(details.error ?? 'Generation failed.'), { accessPaused: details.accessPaused });
        }
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No generation response received.');
        const decoder = new TextDecoder(); let buffer = ''; let completed = false;
        while (true) {
          const { value, done } = await reader.read();
          buffer += decoder.decode(value, { stream: !done });
          const lines = buffer.split('\n'); buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.trim()) continue;
            const event = JSON.parse(line);
            if (event.error) throw Object.assign(new Error(event.error), { accessPaused: event.accessPaused });
            if (event.job) { setArtefactJob(event.job); completed = true; }
          }
          if (done) break;
        }
        if (!completed) throw new Error('Generation ended without a finished inject.');
      }
    } catch (failure: any) { setError(failure.message); setPaused(Boolean(failure.accessPaused)); }
    finally { setBusy(false); }
  };
  const send = async (prepare = false) => {
    if (!sessionId || !job || sending) return;
    setSending(true); setError(null);
    try {
      const red = activeRed ? { redRequestId: activeRed.id } : {};
      const data = await invoke(endpoint, video ? { action: 'send', prepare, sessionId, jobId: job.id, ...red, overlay: { ...overlay, platform: kind === 'news' ? 'news' : platform } } : { action: 'send', prepare, sessionId, jobId: job.id, ...red, stats });
      if (video) setVideoJob(data.job); else setArtefactJob(data.job);
      if (data.returnedToRed) { setActiveRed(null); toast.success('Returned to Red. They decide when to fire it.'); return; }
      if (prepare) { onPrepared?.(); toast.success('Inject saved to ready shelf.'); return; }
      onSent(data.injectId, job.artefact?.body ?? brief, video ? 'Video' : kind);
      toast.success('Inject sent to session participants.');
    } catch (failure: any) { setError(failure.message); } finally { setSending(false); }
  };
  return <section className="space-y-5 border border-border bg-card p-4">
    <h3 className="text-sm font-semibold uppercase">Inject Studio</h3>
    {redRequests.length > 0 && <div className="space-y-2 border border-destructive/60 p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-destructive">Red requests · {redRequests.length}</p>
      {redRequests.map(r => <button key={r.id} type="button" onClick={() => void takeRed(r)} className={`w-full border p-2 text-left text-xs ${activeRed?.id === r.id ? 'border-destructive bg-destructive/10' : 'border-border hover:border-foreground/40'}`}>
        <span className="block uppercase text-muted-foreground">{r.format.replace('_', ' ')} · {r.reach.toLocaleString()} reach · {r.status}</span>
        <span className="block font-medium">{r.claim || r.brief}</span>
      </button>)}
      {activeRed && <div className="flex gap-2"><Input placeholder="Reason for rejecting (optional)" value={rejectNote} maxLength={300} onChange={e => setRejectNote(e.target.value)} /><Button type="button" size="sm" variant="outline" onClick={() => void rejectRed()}>Reject</Button></div>}
      {activeRed && <p className="text-[11px] text-muted-foreground">Studio is filled from Red's request. Generate, review, then use "Return to Red".</p>}
    </div>}
    <div className="space-y-2"><Label htmlFor="inject-format">Format</Label><Select value={kind} onValueChange={value => { setKind(value as Kind); setError(null); }} disabled={busy}><SelectTrigger id="inject-format"><SelectValue /></SelectTrigger><SelectContent>{formats.map(format => <SelectItem key={format.value} value={format.value}><span className="flex items-center gap-2"><format.icon className="h-4 w-4" />{format.label}</span></SelectItem>)}</SelectContent></Select></div>
    <div className="space-y-2 border border-border bg-secondary/40 p-3">
      <div className="flex items-center justify-between gap-2"><p className="text-xs text-muted-foreground">{currentBeat ? <>Story is at: <span className="font-semibold text-foreground">{currentBeat.title}</span></> : 'No storyline step yet — suggestions use the scenario.'}</p><Button type="button" size="sm" variant="outline" onClick={suggest} disabled={busy}><Sparkles className="mr-1 h-3 w-3" />Suggest text</Button></div>
      <p className="text-[11px] text-muted-foreground">Instantly fills the {video ? (kind === 'news' ? 'newsreader script, headline and ticker' : 'influencer script and caption') : 'post brief'} for where the story is now. Edit before generating.</p>
    </div>
    {video && kind === 'influencer' && <div className="space-y-2"><Label>Platform look</Label><Select value={platform} onValueChange={v => { setPlatform(v as OverlayPlatform); setO({ platform: v as OverlayPlatform }); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(['tiktok', 'instagram', 'youtube', 'x', 'facebook'] as OverlayPlatform[]).map(p => <SelectItem key={p} value={p}>{PLATFORM_LABELS[p]}</SelectItem>)}</SelectContent></Select>
      <div className="grid grid-cols-2 gap-2"><Input placeholder="@handle" value={overlay.handle} maxLength={60} onChange={e => setO({ handle: e.target.value })} /><Input placeholder="Caption & hashtags" value={overlay.caption} maxLength={200} onChange={e => setO({ caption: e.target.value })} /></div></div>}
    {video && kind === 'news' && <div className="space-y-2"><Label>News graphics</Label>
      <div className="grid grid-cols-3 gap-2"><Input placeholder="Channel" value={overlay.channel} maxLength={40} onChange={e => setO({ channel: e.target.value })} /><Input className="col-span-2" placeholder="Breaking headline" value={overlay.headline} maxLength={120} onChange={e => setO({ headline: e.target.value })} /></div>
      <Input placeholder="Scrolling ticker text" value={overlay.ticker} maxLength={300} onChange={e => setO({ ticker: e.target.value })} /></div>}
    {kind !== 'news' && kind !== 'website' && <div className="space-y-2"><div className="flex items-center justify-between"><Label>Engagement numbers</Label><div className="flex gap-1">{(['low', 'medium', 'viral'] as const).map(l => <Button key={l} type="button" size="sm" variant="ghost" className="h-6 px-2 text-[10px] uppercase" onClick={() => { const n = suggestStats(l); setStats(n); setO(n); }}>{l}</Button>)}</div></div>
      <div className="grid grid-cols-4 gap-2">{(['views', 'likes', 'comments', 'shares'] as const).map(k => <div key={k}><p className="mb-1 text-[10px] uppercase text-muted-foreground">{k}</p><Input value={video ? overlay[k] : stats[k]} maxLength={12} onChange={e => { setStats(s => ({ ...s, [k]: e.target.value })); setO({ [k]: e.target.value }); }} /></div>)}</div></div>}
    <div className="space-y-2"><Label htmlFor="inject-brief">{kind === 'news' ? 'Newsreader script' : video ? 'Influencer script' : 'Story brief'}</Label><Textarea id="inject-brief" value={brief} onChange={event => setBrief(event.target.value)} maxLength={video ? 240 : 1500} placeholder={video ? 'A short claim the fictional speaker will say…' : 'The claim, who shares it, and how the story spreads…'} className="min-h-[96px]" disabled={busy} /><p className="text-right text-xs text-muted-foreground">{video ? `${brief.length}/240 · 8-second clip` : `${brief.length}/1500`}</p></div>
    {video && <div className="space-y-2"><Label htmlFor="inject-speaker">Fictional speaker & setting</Label><Textarea id="inject-speaker" value={speaker} onChange={event => setSpeaker(event.target.value)} maxLength={300} disabled={busy} /></div>}
    <div className="space-y-3 text-xs">
      <label className="flex items-start gap-2"><Checkbox checked={fictional} onCheckedChange={value => setFictional(value === true)} /><span>This is fictional exercise material, not an imitation of a real person.</span></label>
      <label className="flex items-start gap-2"><Checkbox checked={cost} onCheckedChange={value => setCost(value === true)} /><span>{video ? 'Generate one paid AI clip using workspace credits. Typical wait: 1–3 minutes.' : 'Generate one AI inject using workspace credits.'}</span></label>
    </div>
    <Button onClick={() => void generate()} disabled={!sessionId || !fictional || !cost || brief.trim().length < 5 || (video && speaker.trim().length < 5) || busy || generatingVideo || paused} className="w-full">{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Video className="mr-2 h-4 w-4" />}{video ? 'Generate Video' : 'Generate Inject'}</Button>
    {(generatingVideo || busy) && <div role="status" className="space-y-2"><div className="flex items-center justify-between text-xs"><span>{generatingVideo ? 'Rendering footage' : 'Creating inject'}</span><span>{elapsed}s elapsed</span></div>{generatingVideo && <Progress value={videoJob?.progress ?? 0} />}<p className="text-xs text-muted-foreground">The exercise continues while this generates.</p></div>}
    {(error || job?.error) && <p role="alert" className="text-sm text-destructive break-words">{error ?? job?.error}</p>}
    {pollStopped && !paused && <Button variant="outline" size="sm" onClick={() => { stopped.current = false; setPollStopped(false); }}><RefreshCw className="mr-2 h-4 w-4" />Check existing video</Button>}
    {paused && <Button variant="outline" size="sm" onClick={async () => { try { await invoke(endpoint, { action: 'resume', sessionId }); setPaused(false); setError(null); } catch (failure: any) { setError(failure.message); } }}><RefreshCw className="mr-2 h-4 w-4" />Access restored — resume</Button>}
    {job?.status === 'completed' && <div className="space-y-3 border-t border-border pt-4">
      <p className="text-xs text-crimson">FICTIONAL EXERCISE · Preview</p>
      {job.videoUrl && <OverlayFrame overlay={{ ...overlay, platform: kind === 'news' ? 'news' : platform }}><video aria-label="Generated inject preview" src={job.videoUrl} controls playsInline className="max-h-[480px] w-full rounded-md bg-background object-contain" /></OverlayFrame>}
      {job.artefact && <HostedArtefactView artefact={kind === 'website' ? job.artefact : { ...job.artefact, stats }} />}
      {!activeRed && <Button variant="outline" onClick={() => void send(true)} disabled={sending || job.sent} className="w-full">Save to ready injects</Button>}
      <Button onClick={() => void send()} disabled={!isActive || sending || job.sent} className="w-full"><Send className="mr-2 h-4 w-4" />{job.sent ? 'Inject sent' : sending ? 'Sending…' : activeRed ? 'Return to Red' : 'Send Inject'}</Button>
      {!isActive && !job.sent && <p className="text-xs text-muted-foreground">Start the exercise before sending.</p>}
    </div>}
  </section>;
}