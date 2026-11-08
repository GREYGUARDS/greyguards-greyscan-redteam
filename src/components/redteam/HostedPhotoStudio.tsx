import { useEffect, useState } from 'react';
import { Camera, RefreshCw, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { streamImage } from '@/lib/streamImage';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type PhotoJob = Tables<'exercise_photo_jobs'> & { imageUrl?: string | null };
export default function HostedPhotoStudio({ sessionId, brand, scenario, onPrepared }: { sessionId: string | null; brand: string; scenario?: string | null; onPrepared?: () => void }) {
  const [subject, setSubject] = useState<'company' | 'director' | 'board'>('company');
  const [prompt, setPrompt] = useState(''); const [caption, setCaption] = useState('');
  const [confirmed, setConfirmed] = useState(false); const [cost, setCost] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [frame, setFrame] = useState<string | null>(null); const [final, setFinal] = useState(false);
  const [job, setJob] = useState<PhotoJob | null>(null); const [jobs, setJobs] = useState<PhotoJob[]>([]);
  const [targets, setTargets] = useState<Array<{ id: string; content: string }>>([]); const [target, setTarget] = useState('new');
  const [boardApproved, setBoardApproved] = useState(false);
  const [approvalLoaded, setApprovalLoaded] = useState(false);
  const [savingApproval, setSavingApproval] = useState(false);
  const [approvalDate, setApprovalDate] = useState<string | null>(null);
  const [useRealPeople, setUseRealPeople] = useState(false);
  const load = async () => {
    if (!sessionId) return;
    const [{ data }, { data: injects }] = await Promise.all([supabase.from('exercise_photo_jobs').select('*').eq('session_id', sessionId).order('created_at', { ascending: false }), supabase.from('exercise_injects').select('id,content').eq('session_id', sessionId).eq('created_by', 'consultant').eq('is_sent', false).is('artefact', null).is('video_storage_path', null)]);
    setJobs(data ?? []); setTargets(injects ?? []);
  };
  useEffect(() => { void load(); }, [sessionId]);
  const invoke = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke('hosted-photo-inject', { body: { sessionId, ...body } });
    if (error) { const details = await error.context?.json?.().catch(() => null); throw new Error(details?.error ?? error.message); }
    return data;
  };
  useEffect(() => {
    let cancelled = false;
    setBoardApproved(false); setApprovalLoaded(false); setUseRealPeople(false); setApprovalDate(null);
    if (sessionId) void invoke({ action: 'consent' }).then(data => {
      if (!cancelled) { setBoardApproved(data.approved === true); setApprovalDate(data.recordedAt); setApprovalLoaded(true); }
    }).catch(e => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [sessionId]);
  const saveApproval = async (approved: boolean) => {
    setSavingApproval(true); setError('');
    try {
      const data = await invoke({ action: 'setConsent', approved });
      setBoardApproved(data.approved === true); setApprovalDate(data.recordedAt);
      setUseRealPeople(false); setConfirmed(false);
      toast.success(approved ? 'Client approval saved for this session.' : 'Real board member use disabled for this session.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Approval could not be saved.'); }
    finally { setSavingApproval(false); }
  };
  const check = async (id: string) => {
    const data = await invoke({ action: 'status', jobId: id }); setJob(data.job);
    if (data.job.imageUrl) { setFrame(data.job.imageUrl); setFinal(true); }
    if (data.job.error_message) setError(data.job.error_message);
    return data.job as PhotoJob;
  };
  const generate = async () => {
    if (!sessionId) return;
    setBusy(true); setError(''); setFrame(null); setFinal(false); setJob(null);
    try {
      const created = await invoke({ action: 'create', prompt, subject, caption, fictionalConfirmed: confirmed, costConfirmed: cost, usesRealBoardMembers: useRealPeople && subject !== 'company' });
      setJob(created.job);
      const { data: auth } = await supabase.auth.getSession(); if (!auth.session) throw new Error('Sign in to create photos.');
      await streamImage(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hosted-photo-inject`, { action: 'generate', sessionId, jobId: created.job.id }, (url, isFinal) => { setFrame(url); setFinal(isFinal); }, undefined, { Authorization: `Bearer ${auth.session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY });
      // The stream completes before its durable storage task; read the saved job without regenerating.
      for (let i = 0; i < 12; i++) { const saved = await check(created.job.id); if (saved.status === 'completed' || saved.status === 'failed') break; await new Promise(resolve => setTimeout(resolve, 1000)); }
      await load();
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Photo generation failed.'); await load(); }
    finally { setBusy(false); }
  };
  const attach = async () => {
    if (!job) return;
    setBusy(true); setError('');
    try { await invoke({ action: 'attach', jobId: job.id, ...(target === 'new' ? {} : { injectId: target }) }); onPrepared?.(); toast.success('Photo attached to a ready inject.'); await load(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Attachment failed.'); }
    finally { setBusy(false); }
  };
  return <section className="space-y-4 border-t border-border pt-4">
    <div className="flex items-center justify-between"><h3 className="flex items-center gap-2 text-sm font-semibold"><Camera className="h-4 w-4" />Photo generator</h3><Button variant="ghost" size="icon" aria-label="Refresh saved photos" onClick={() => void load()}><RefreshCw className="h-4 w-4" /></Button></div>
    <div className="space-y-2 border-b border-border pb-4">
      <label className="flex items-start gap-2 text-xs"><Checkbox aria-label="Client approval for real board members" checked={boardApproved} disabled={!sessionId || !approvalLoaded || savingApproval || busy} onCheckedChange={v => void saveApproval(v === true)} />I confirm the client and the board members depicted have approved use of their names and likenesses in this private training session.</label>
      <p className="text-xs text-muted-foreground">{savingApproval ? 'Saving approval…' : boardApproved ? `Approval recorded${approvalDate ? ` · ${new Date(approvalDate).toLocaleDateString('en-GB')}` : ''}. AI images remain labelled as fictional training material.` : 'Off by default. Without approval, directors and board members remain fictional stand-ins.'}</p>
    </div>
    <div className="space-y-2"><Label htmlFor="photo-subject">Subject</Label><Select value={subject} onValueChange={v => { setSubject(v as typeof subject); setUseRealPeople(false); setConfirmed(false); }}><SelectTrigger id="photo-subject"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="company">Company premises / scene</SelectItem><SelectItem value="director">Director portrait</SelectItem><SelectItem value="board">Board meeting</SelectItem></SelectContent></Select></div>
    {subject !== 'company' && <label className="flex gap-2 text-xs"><Checkbox aria-label="Use approved real board members in this photo" checked={useRealPeople} disabled={!boardApproved || savingApproval || busy} onCheckedChange={v => { setUseRealPeople(v === true); setConfirmed(false); }} />Use approved real board members in this photo</label>}
    <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="photo-prompt">Photo description</Label><Button size="sm" variant="outline" onClick={() => { setPrompt(subject === 'company' ? `Editorial photo of ${brand}'s corporate reception and premises, suited to this exercise: ${scenario ?? 'company crisis'}. Natural daylight, realistic architecture.` : useRealPeople ? `Neutral editorial ${subject === 'director' ? 'portrait of [approved director name and role]' : 'board meeting featuring [approved board members’ names and roles]'} at ${brand}. Natural light, formal professional setting. No staged misconduct or fabricated statements. AI-generated private training illustration.` : subject === 'director' ? 'Editorial portrait of an invented adult company director in a modern office. Calm expression, formal business clothing, natural window light. Not a likeness of a real director.' : 'Realistic boardroom scene with a diverse group of invented adult directors reviewing a crisis briefing. Serious expressions, natural light, no real-person likenesses.'); }}><Sparkles className="mr-1 h-3 w-3" />Suggest</Button></div><Textarea id="photo-prompt" maxLength={2000} value={prompt} onChange={e => setPrompt(e.target.value)} placeholder={useRealPeople ? 'Approved names, roles and neutral professional setting…' : 'Describe the fictional training photo…'} /></div>
    <div className="space-y-2"><Label htmlFor="photo-caption">Inject text / caption</Label><Textarea id="photo-caption" maxLength={1500} value={caption} onChange={e => setCaption(e.target.value)} /></div>
    <label className="flex gap-2 text-xs"><Checkbox checked={confirmed} onCheckedChange={v => setConfirmed(v === true)} />{useRealPeople ? 'Private AI-generated training illustration, not a genuine photograph or evidence. Neutral depictions only; no fabricated wrongdoing or statements.' : 'Fictional training imagery; people are stand-ins, not genuine photographs of the company’s directors.'}</label>
    <label className="flex gap-2 text-xs"><Checkbox checked={cost} onCheckedChange={v => setCost(v === true)} />Generate one paid photo using workspace credits.</label>
    <Button className="w-full" onClick={() => void generate()} disabled={busy || savingApproval || !approvalLoaded || !sessionId || !confirmed || !cost || (useRealPeople && !boardApproved) || prompt.trim().length < 5}><Camera className="mr-2 h-4 w-4" />{busy ? 'Creating / saving photo…' : 'Generate photo'}</Button>
    {busy && <p role="status" className="text-xs text-muted-foreground">Preparing the image; preview frames appear as they arrive.</p>}
    {error && <p role="alert" className="break-words text-sm text-destructive">{error}</p>}
    {job?.access_paused && <Button variant="outline" onClick={async () => { try { await invoke({ action: 'resume' }); setError(''); setJob(null); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Access remains unavailable.'); } }}>Access restored — enable new request</Button>}
    {frame && <figure className="space-y-2"><img src={frame} alt="Generated fictional exercise photo" className={`max-h-[420px] w-full rounded-md object-contain ${final ? '' : 'blur-lg'}`} /><figcaption className="text-[10px] text-crimson">FICTIONAL EXERCISE · AI-generated, not evidence</figcaption></figure>}
    {job && <Button size="sm" variant="outline" onClick={() => void check(job.id).catch(e => setError(e.message))}>Check saved photo</Button>}
    {job?.status === 'completed' && <div className="space-y-2"><Label>Attach to inject</Label><Select value={target} onValueChange={setTarget}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="new">Create a new ready photo inject</SelectItem>{targets.map(i => <SelectItem key={i.id} value={i.id}>{i.content.slice(0, 80)}</SelectItem>)}</SelectContent></Select><Button className="w-full" onClick={() => void attach()} disabled={busy}>Attach photo to inject</Button></div>}
    {jobs.length > 0 && <div className="space-y-2"><Label>Saved photos</Label>{jobs.map(j => <Button key={j.id} variant="outline" className="h-auto w-full justify-start whitespace-normal text-left text-xs" onClick={() => { setFrame(null); setFinal(false); setError(''); void check(j.id).catch(e => setError(e.message)); }}>{j.subject} · {j.status} · {j.prompt.slice(0, 60)}</Button>)}</div>}
  </section>;
}