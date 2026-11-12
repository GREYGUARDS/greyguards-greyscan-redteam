import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const CHUNK_MS = 15000;

/** Blue Team: opt-in room audio. Only runs when the host switched it on AND this device consented. Clips are transcribed then discarded. */
export default function RoomAudioCapture({ sessionId, teamId, enabled, active }: { sessionId: string; teamId: string; enabled: boolean; active: boolean }) {
  const key = `room-audio-consent-${sessionId}`;
  const [consent, setConsent] = useState<'yes' | 'no' | null>(() => (sessionStorage.getItem(key) as 'yes' | 'no' | null));
  const [muted, setMuted] = useState(false);
  const [live, setLive] = useState(false);
  const [halted, setHalted] = useState(false);
  const stream = useRef<MediaStream | null>(null);

  const decide = (v: 'yes' | 'no') => { sessionStorage.setItem(key, v); setConsent(v); };
  const run = enabled && active && consent === 'yes' && !muted && !halted;

  useEffect(() => {
    if (!run) return;
    let stopped = false; let rec: MediaRecorder | null = null; let timer: number | undefined;
    const send = async (blob: Blob) => {
      if (blob.size < 2000) return;
      const { data: s } = await supabase.auth.getSession();
      const fd = new FormData();
      fd.append('sessionId', sessionId); fd.append('teamId', teamId);
      fd.append('file', new File([blob], 'room.webm', { type: blob.type.split(';')[0] || 'audio/webm' }));
      const r = await fetch(`https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/room-audio-transcribe`, { method: 'POST', headers: { Authorization: `Bearer ${s.session?.access_token ?? ''}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY }, body: fd }).catch(() => null);
      if (r && (r.status === 402 || r.status === 403)) setHalted(true);
    };
    const cycle = () => {
      if (stopped || !stream.current) return;
      const parts: Blob[] = [];
      rec = new MediaRecorder(stream.current);
      rec.ondataavailable = e => { if (e.data.size) parts.push(e.data); };
      rec.onstop = () => { void send(new Blob(parts, { type: rec?.mimeType || 'audio/webm' })); if (!stopped) cycle(); };
      rec.start();
      timer = window.setTimeout(() => rec?.state === 'recording' && rec.stop(), CHUNK_MS);
    };
    navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }).then(m => {
      if (stopped) { m.getTracks().forEach(t => t.stop()); return; }
      stream.current = m; setLive(true); cycle();
    }).catch(() => { decide('no'); });
    return () => {
      stopped = true; window.clearTimeout(timer);
      if (rec?.state === 'recording') rec.stop();
      stream.current?.getTracks().forEach(t => t.stop()); stream.current = null; setLive(false);
    };
  }, [run, sessionId, teamId]);

  if (!enabled) return null;
  return <>
    <Dialog open={consent === null}>
      <DialogContent className="max-w-md" onPointerDownOutside={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="uppercase tracking-wider">Room audio monitoring</DialogTitle>
          <DialogDescription className="space-y-2 text-left">
            <span className="block">The facilitator has switched on room audio for this exercise. With your permission, this device's microphone listens to your team's discussion so the attacking side can react to it — just as a real adversary might.</span>
            <span className="block">Audio is turned into text and immediately deleted. Only the text is seen by the Greyguards facilitator, for this exercise and its debrief. You can mute at any time.</span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => decide('no')}>No thanks</Button>
          <Button onClick={() => decide('yes')}>I agree — turn on mic</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    {consent && <div className="fixed bottom-3 left-3 z-[55] flex items-center gap-2 rounded-full border border-warning/60 bg-background/95 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider shadow">
      {consent === 'yes' && live && !muted ? <><span className="h-2 w-2 animate-pulse rounded-full bg-warning" /><span className="text-warning">Mic active</span></> : <><MicOff className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">{halted ? 'Mic unavailable' : 'Mic off'}</span></>}
      {consent === 'yes'
        ? <button className="ml-1 underline" onClick={() => setMuted(m => !m)}>{muted ? 'Unmute' : 'Mute'}</button>
        : <button className="ml-1 inline-flex items-center gap-1 underline" onClick={() => decide('yes')}><Mic className="h-3 w-3" />Turn on</button>}
    </div>}
  </>;
}
