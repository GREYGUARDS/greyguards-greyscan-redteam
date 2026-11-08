import { useEffect, useState } from 'react';
import { Eye, Send, Video, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import HostedInjectMedia, { HostedArtefactView, OverlayFrame, type HostedArtefact } from './HostedInjectMedia';
import type { VideoOverlay } from './InjectOverlay';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type ReadyInject = Tables<'exercise_injects'>;
function Thumbnail({ inject }: { inject: ReadyInject }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!inject.video_storage_path) return;
    let cancelled = false;
    void supabase.functions.invoke('hosted-video-inject', { body: { action: 'status', sessionId: inject.session_id, jobId: inject.id } }).then(({ data }) => { if (!cancelled) setUrl(data?.job?.videoUrl ?? null); });
    return () => { cancelled = true; };
  }, [inject.id, inject.session_id, inject.video_storage_path]);
  const visual = inject.artefact as unknown as HostedArtefact | null;
  return <div className="relative aspect-video overflow-hidden border-b border-border bg-secondary pointer-events-none" aria-hidden="true">
    {inject.video_storage_path ? url ? <video src={`${url}#t=0.1`} muted playsInline preload="metadata" className="h-full w-full object-cover" /> : <Video className="mx-auto mt-8 h-8 w-8 text-muted-foreground" /> : visual && visual.kind !== ('video' as string) ? <div className="origin-top-left w-[200%] scale-50"><HostedArtefactView artefact={visual} /></div> : <div className="p-3"><MessageSquare className="mb-2 h-4 w-4 text-primary" /><p className="line-clamp-4 text-xs">{inject.content}</p></div>}
  </div>;
}
export default function PreparedInjectShelf({ sessionId, isActive, refreshKey, onSent }: { sessionId: string; isActive: boolean; refreshKey: number; onSent: (id: string, content: string, type: string) => void }) {
  const [injects, setInjects] = useState<ReadyInject[]>([]);
  const [selected, setSelected] = useState<ReadyInject | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const load = async () => {
    const { data, error: failure } = await supabase.from('exercise_injects').select('*').eq('session_id', sessionId).eq('created_by', 'consultant').order('timestamp_offset').order('created_at');
    if (failure) setError('Ready injects could not be loaded.'); else { setInjects(data ?? []); setError(''); }
  };
  useEffect(() => { void load(); const timer = setInterval(() => void load(), 15000); return () => clearInterval(timer); }, [sessionId, refreshKey]);
  const preview = async (inject: ReadyInject) => {
    setSelected(inject); setPreviewUrl(null);
    if (inject.video_storage_path) {
      const { data, error } = await supabase.functions.invoke('hosted-video-inject', { body: { action: 'status', sessionId, jobId: inject.id } });
      if (error) toast.error('Video preview could not be loaded.'); else setPreviewUrl(data?.job?.videoUrl ?? null);
    }
  };
  const fire = async (inject: ReadyInject) => {
    setBusy(inject.id);
    const { error } = await supabase.rpc('host_fire_prepared_inject', { _inject_id: inject.id });
    if (error) toast.error('Start or resume the session before sending this inject.'); else { onSent(inject.id, inject.content, inject.inject_type); toast.success('Prepared inject sent.'); await load(); }
    setBusy(null);
  };
  return <section className="mb-6 space-y-3 border-b border-border pb-6">
    <div className="flex items-center justify-between gap-2"><h2 className="text-sm font-semibold uppercase">Ready injects</h2><Badge variant="outline">{injects.filter(i => !i.is_sent).length} ready</Badge></div>
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    {injects.length === 0 ? <p className="text-xs text-muted-foreground">No injects prepared yet.</p> : <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">{injects.map(i => <article key={i.id} className="min-w-0 overflow-hidden rounded-md border border-border bg-card">
      <Thumbnail inject={i} /><div className="space-y-2 p-3"><div className="flex flex-wrap items-center justify-between gap-1"><span className="text-[10px] text-muted-foreground">{i.inject_type.split('_').join(' ')} · {Math.floor(i.timestamp_offset / 60)}m</span><Badge variant={i.is_sent ? 'secondary' : 'outline'}>{i.is_sent ? 'Sent' : 'Ready'}</Badge></div><p className="line-clamp-2 break-words text-xs">{i.content}</p><div className="flex gap-2"><Button size="sm" variant="outline" aria-label={`Preview inject: ${i.content.slice(0, 30)}`} onClick={() => void preview(i)}><Eye className="h-3 w-3" /></Button><Button size="sm" className="flex-1" disabled={!isActive || i.is_sent || busy === i.id} onClick={() => void fire(i)}><Send className="mr-1 h-3 w-3" />Send</Button></div></div>
    </article>)}</div>}
    <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Prepared inject preview</DialogTitle></DialogHeader>{selected && <><p className="whitespace-pre-wrap break-words text-sm">{selected.content}</p>{selected.video_storage_path ? previewUrl && <OverlayFrame overlay={(selected.artefact as unknown as { overlay?: VideoOverlay })?.overlay ?? null}><video src={previewUrl} controls playsInline className="w-full" /></OverlayFrame> : <HostedInjectMedia artefact={selected.artefact} />}</>}</DialogContent></Dialog>
  </section>;
}