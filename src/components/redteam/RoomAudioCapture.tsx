import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { FORWARD_READ_PRIVACY_VERIFIED } from '../../../supabase/functions/_shared/forward-read-rules';

const CHUNK_MS = 15000;

/** Room agreement is host-recorded. Browser microphone permission remains mandatory. */
export default function RoomAudioCapture({ sessionId, teamId, enabled, active, version }: { sessionId: string; teamId: string; enabled: boolean; active: boolean; version: string | null }) {
  const [live, setLive] = useState(false);
  const [stoppedVersion, setStoppedVersion] = useState<string | null>(null);
  const stopCapture = useRef<() => void>(() => {});
  const run = FORWARD_READ_PRIVACY_VERIFIED && enabled && active && !!version && stoppedVersion !== version;
  useEffect(() => {
    if (!run || !version) return;
    let stopped = false;
    let recording: MediaRecorder | null = null;
    let stream: MediaStream | null = null;
    let timer: number | undefined;
    const requests = new Set<AbortController>();
    let nextSendAt = 0;
    const stop = () => {
      stopped = true; clearTimeout(timer);
      requests.forEach(r => r.abort()); requests.clear();
      if (recording?.state === 'recording') recording.stop();
      stream?.getTracks().forEach(t => t.stop()); stream = null; setLive(false);
    };
    stopCapture.current = stop;
    const send = async (blob: Blob) => {
      if (stopped || blob.size < 2000 || Date.now() < nextSendAt) return;
      // Sample at most ten times an hour; raw samples between requests are discarded.
      nextSendAt = Date.now() + 6 * 60_000;
      const controller = new AbortController(); requests.add(controller);
      try {
        const { data: s } = await supabase.auth.getSession();
        if (stopped) return;
        const fd = new FormData();
        fd.append('sessionId', sessionId); fd.append('teamId', teamId); fd.append('version', version);
        fd.append('file', new File([blob], 'room.webm', { type: blob.type.split(';')[0] || 'audio/webm' }));
        const r = await fetch(`https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/room-audio-transcribe`, { method: 'POST', headers: { Authorization: `Bearer ${s.session?.access_token ?? ''}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY }, body: fd, signal: controller.signal });
        if (!r.ok && r.status !== 499) {
          const data = await r.json().catch(() => null);
          if ([400, 401, 402, 403, 404, 429].includes(r.status)) { stop(); setStoppedVersion(version); }
          toast.error(data?.error ?? 'Forward Read is unavailable.');
        }
      } catch { if (!stopped) { stop(); setStoppedVersion(version); toast.error('Forward Read connection lost. Microphone stopped.'); } }
      finally { requests.delete(controller); }
    };
    const cycle = () => {
      if (stopped || !stream) return;
      const parts: Blob[] = [];
      const rec = new MediaRecorder(stream);
      recording = rec;
      rec.ondataavailable = e => { if (!stopped && e.data.size) parts.push(e.data); };
      rec.onstop = () => { if (!stopped) { void send(new Blob(parts, { type: rec.mimeType || 'audio/webm' })); cycle(); } parts.length = 0; };
      rec.start(); timer = window.setTimeout(() => { if (rec.state === 'recording') rec.stop(); }, CHUNK_MS);
    };
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { setStoppedVersion(version); return; }
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }).then(m => {
      if (stopped) { m.getTracks().forEach(t => t.stop()); return; }
      stream = m; setLive(true); cycle();
    }).catch(() => { stop(); setStoppedVersion(version); toast.error('Microphone permission is required for Forward Read.'); });
    return stop;
  }, [run, sessionId, teamId, version]);
  const switchOff = async () => {
    stopCapture.current(); setStoppedVersion(version);
    const { error } = await supabase.rpc('blue_disable_forward_read', { _session_id: sessionId });
    if (error) toast.error('Your microphone is stopped, but the room switch could not be updated. Tell the facilitator.');
    else toast.success('Forward Read off. Fresh room agreement is required to restart.');
  };
  if (!enabled || !FORWARD_READ_PRIVACY_VERIFIED) return null;
  return <div role="status" className="fixed inset-x-3 bottom-3 z-[80] mx-auto flex max-w-xl flex-wrap items-center justify-between gap-2 border border-warning bg-background px-3 py-2 shadow">
    <div className="min-w-0 flex-1 text-xs"><p className="font-semibold text-warning">Forward Read on – the attackers can hear this room</p><p className="flex items-center gap-1 text-muted-foreground">{live ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />}{live ? 'Microphone active' : 'Microphone stopped'}</p></div>
    <Button size="sm" variant="outline" onClick={() => void switchOff()}><MicOff className="mr-1 h-3 w-3" />Switch off</Button>
  </div>;
}
