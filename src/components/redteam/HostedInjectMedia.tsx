import { VideoOverlaySlot } from './InjectVideoPlayer';
import InjectVideoPlayer from './InjectVideoPlayer';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { VideoOverlayLayer, StatsBar, type VideoOverlay, type EngagementStats } from './InjectOverlay';
import { RefreshCw, MessageCircle, Repeat2, Heart, Globe, Users, Send } from 'lucide-react';
import HostedPhotoMedia, { asPhoto } from './HostedPhotoMedia';
import InjectVisual from './InjectVisual';
import { fromHostedDemoArtefact } from '@/lib/hostedDemoScenario';
import { getSimulationCompany } from '@/lib/simulationCompanies';

export interface HostedArtefact {
  kind: 'website' | 'x' | 'whatsapp' | 'telegram' | 'facebook';
  title: string;
  author: string;
  handle: string;
  body: string;
  messages: { sender: string; text: string; time: string }[];
  reactions: string;
  stats?: EngagementStats;
}

export function HostedArtefactView({ artefact }: { artefact: HostedArtefact }) {
  const messaging = artefact.kind === 'whatsapp' || artefact.kind === 'telegram';
  return <div className="my-4 overflow-hidden rounded-md border border-border bg-card text-card-foreground">
    <div className="flex items-center justify-between gap-2 border-b border-border bg-secondary px-4 py-2 text-xs">
      <span className="font-semibold">{artefact.kind === 'x' ? 'X' : artefact.kind === 'website' ? 'Website' : artefact.kind === 'facebook' ? 'Facebook' : artefact.kind === 'whatsapp' ? 'WhatsApp' : 'Telegram'}</span>
      <span className="text-crimson">FICTIONAL EXERCISE</span>
    </div>
    {artefact.kind === 'website' ? <>
      <div className="flex items-center gap-2 border-b border-border px-4 py-2 text-xs text-muted-foreground"><Globe className="h-3 w-3" />{artefact.handle}</div>
      <article className="space-y-3 p-5"><p className="text-xs uppercase text-muted-foreground">{artefact.author}</p><h3 className="text-lg font-semibold break-words">{artefact.title}</h3><p className="whitespace-pre-wrap text-sm leading-relaxed break-words">{artefact.body}</p></article>
    </> : messaging ? <>
      <div className="flex items-center gap-2 border-b border-border p-3"><Users className="h-4 w-4" /><span className="text-sm font-medium break-words">{artefact.title}</span>{artefact.kind === 'telegram' && <Send className="ml-auto h-4 w-4 text-primary" />}</div>
      <div className="space-y-3 bg-muted/30 p-4">{artefact.messages.map((message, index) => <div key={index} className="max-w-[92%] rounded-md border border-border bg-background p-3"><p className="mb-1 text-xs font-semibold text-primary break-words">{message.sender}</p><p className="whitespace-pre-wrap text-sm break-words">{message.text}</p><p className="mt-1 text-right text-[10px] text-muted-foreground">{message.time}</p></div>)}</div>
    </> : <div className="p-4">
      <div className="mb-3 flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-xs">{artefact.author.slice(0, 2).toUpperCase()}</span><div className="min-w-0"><p className="text-sm font-semibold break-words">{artefact.author}</p><p className="text-xs text-muted-foreground break-words">{artefact.handle} · just now</p></div></div>
      {artefact.kind === 'facebook' && <h3 className="mb-2 text-sm font-medium break-words">{artefact.title}</h3>}
      <p className="whitespace-pre-wrap text-sm leading-relaxed break-words">{artefact.body}</p>
      {artefact.stats ? <StatsBar stats={artefact.stats} platform={artefact.kind} /> : <div className="mt-4 flex items-center gap-5 border-t border-border pt-3 text-xs text-muted-foreground"><MessageCircle className="h-4 w-4" /><Repeat2 className="h-4 w-4" /><Heart className="h-4 w-4" /><span className="break-words">{artefact.reactions}</span></div>}
    </div>}
  </div>;
}

export default function HostedInjectMedia({ storagePath, artefact }: { storagePath?: string | null; artefact?: unknown }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (!storagePath) return;
    setError(null);
    const { data, error: failure } = await supabase.storage.from('exercise-videos').createSignedUrl(storagePath, 3600);
    if (failure) { setError('The exercise video could not be loaded.'); return; }
    setUrl(data.signedUrl);
  }, [storagePath]);
  useEffect(() => { setUrl(null); void load(); }, [load]);
  const raw = artefact && typeof artefact === 'object' && 'kind' in artefact ? artefact as { kind: string; overlay?: VideoOverlay; videoKind?: string } : null;
  const overlay = raw?.kind === 'video' ? raw.overlay ?? null : null;
  const photo = asPhoto(artefact);
  const demo = fromHostedDemoArtefact(artefact);
  const visual = raw && raw.kind !== 'video' && raw.kind !== 'demo' && !photo ? raw as unknown as HostedArtefact : null;
  return <>
    {demo && <InjectVisual inject={demo.inject} company={getSimulationCompany(demo.companyId)} />}
    {photo && <HostedPhotoMedia photo={photo} />}
    {visual && <HostedArtefactView artefact={visual} />}
    {storagePath && <div className="my-4 space-y-2">
      <p className="text-xs font-medium text-crimson">{raw?.videoKind === 'board' ? 'DEEPFAKE · AI-GENERATED · FICTIONAL EXERCISE' : 'FICTIONAL EXERCISE · AI-generated footage'}</p>
      {url ? <OverlayFrame overlay={overlay}><InjectVideoPlayer key={storagePath} label="Exercise inject video" src={url} frameClassName="max-h-[480px]" onError={() => setError('Video playback failed. Reload the clip to try again.')} /></OverlayFrame> : !error && <p className="text-xs text-muted-foreground" role="status">Loading exercise video…</p>}
      {error && <div role="alert" className="text-sm text-destructive">{error}<Button size="sm" variant="outline" onClick={() => void load()} className="ml-2"><RefreshCw className="mr-2 h-3 w-3" />Reload clip</Button></div>}
    </div>}
  </>;
}
export function OverlayFrame({ overlay, children }: { overlay: VideoOverlay | null; children: React.ReactNode }) {
  if (!overlay) return <>{children}</>;
  return <div className={`mx-auto overflow-hidden rounded-md bg-background ${overlay.platform === 'news' ? 'w-full' : 'max-w-[300px]'}`}><VideoOverlaySlot.Provider value={<VideoOverlayLayer overlay={overlay} />}>{children}</VideoOverlaySlot.Provider></div>;
}
