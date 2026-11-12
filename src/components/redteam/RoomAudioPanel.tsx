import { useEffect, useState } from 'react';
import { Radio } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

type Row = { id: string; transcript: string; created_at: string };

/** Host-only: switch room audio on/off for this session and read the live transcript feed. */
export default function RoomAudioPanel({ sessionId }: { sessionId: string | null }) {
  const [enabled, setEnabled] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    if (!sessionId) return;
    const load = async () => {
      const [{ data: s }, { data: t }] = await Promise.all([
        supabase.from('exercise_sessions').select('room_audio_enabled').eq('id', sessionId).maybeSingle(),
        supabase.from('exercise_room_transcripts').select('id, transcript, created_at').eq('session_id', sessionId).order('created_at', { ascending: false }).limit(20),
      ]);
      if (s) setEnabled(!!s.room_audio_enabled);
      setRows(t ?? []);
    };
    void load();
    const i = setInterval(load, 10000);
    return () => clearInterval(i);
  }, [sessionId]);
  const toggle = async (v: boolean) => {
    if (!sessionId) return;
    setEnabled(v);
    const { error } = await supabase.rpc('host_set_room_audio', { _session_id: sessionId, _enabled: v });
    if (error) { setEnabled(!v); toast.error('Could not change room audio.'); return; }
    toast.success(v ? 'Room audio on — Blue Team will be asked for consent.' : 'Room audio off.');
  };
  return <div className="space-y-2 border border-warning/40 p-3">
    <div className="flex items-center justify-between gap-2">
      <div><p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-warning"><Radio className="h-3 w-3" />Live room intercepts</p><p className="text-xs text-muted-foreground">Off by default. Blue Team must consent; audio is deleted after transcription.</p></div>
      <Switch checked={enabled} onCheckedChange={v => void toggle(v)} disabled={!sessionId} aria-label="Room audio" />
    </div>
    {enabled && <div className="max-h-48 space-y-1 overflow-y-auto">
      {rows.length ? rows.map(r => <p key={r.id} className="border-l-2 border-warning/50 pl-2 text-xs"><span className="text-muted-foreground">{new Date(r.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · </span>{r.transcript}</p>) : <p className="text-xs text-muted-foreground">Nothing overheard yet.</p>}
    </div>}
  </div>;
}
