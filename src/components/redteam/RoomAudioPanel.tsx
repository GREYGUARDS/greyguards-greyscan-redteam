import { useEffect, useState } from 'react';
import { Radio } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { FORWARD_READ_PRIVACY_VERIFIED } from '../../../supabase/functions/_shared/forward-read-rules';

export default function RoomAudioPanel({ sessionId }: { sessionId: string | null }) {
  const [enabled, setEnabled] = useState(false);
  const [available, setAvailable] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setEnabled(false); setConfirming(false); setAgreed(false);
    if (!sessionId) return;
    let disposed = false;
    const load = async () => {
      const { data } = await supabase.from('exercise_sessions').select('room_audio_enabled, status, forward_read_paused_at').eq('id', sessionId).maybeSingle();
      if (disposed) return;
      const valid = data && (data.status === 'active' || (data.status === 'paused' && data.forward_read_paused_at && Date.now() - Date.parse(data.forward_read_paused_at) < 30 * 60_000));
      setEnabled(!!(valid && data?.room_audio_enabled)); setAvailable(!!valid && FORWARD_READ_PRIVACY_VERIFIED);
    };
    void load();
    const i = setInterval(load, 1500);
    return () => { disposed = true; clearInterval(i); };
  }, [sessionId]);
  const toggle = async (v: boolean) => {
    if (!sessionId) return;
    if (v) { setAgreed(false); setConfirming(true); return; }
    setBusy(true);
    const { error } = await supabase.rpc('host_set_room_audio', { _session_id: sessionId, _enabled: false });
    setBusy(false);
    if (error) { toast.error('Could not switch off Forward Read.'); return; }
    setEnabled(false); setAgreed(false); toast.success('Forward Read off.');
  };
  const enable = async () => {
    if (!sessionId || !agreed) return;
    setBusy(true);
    const { error } = await supabase.rpc('host_enable_forward_read', { _session_id: sessionId, _room_agreed: agreed });
    setBusy(false); setAgreed(false);
    if (error) { toast.error('Could not enable Forward Read. Start or resume the session and confirm room agreement.'); return; }
    setEnabled(true); setConfirming(false); toast.success('Forward Read on.');
  };
  return <div className="space-y-2 border border-warning/40 p-3">
    <div className="flex items-center justify-between gap-3">
      <div><p className="flex items-center gap-1 text-xs font-semibold uppercase text-warning"><Radio className="h-3 w-3" />Forward Read</p><p className="text-xs text-muted-foreground">{!FORWARD_READ_PRIVACY_VERIFIED ? 'Unavailable · Privacy verification pending' : enabled ? 'On · Room agreement recorded' : 'Off · Whole-room agreement required'}</p></div>
      <Switch checked={enabled} onCheckedChange={v => void toggle(v)} disabled={!sessionId || busy || !available} aria-label="Forward Read" />
    </div>
    <Dialog open={confirming} onOpenChange={open => { setConfirming(open); setAgreed(false); }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Enable Forward Read</DialogTitle><DialogDescription>Confirm agreement from everyone in the room before enabling listening.</DialogDescription></DialogHeader>
        <label className="flex items-start gap-3 text-sm"><Checkbox checked={agreed} onCheckedChange={v => setAgreed(v === true)} aria-label="The whole room has agreed to Forward Read" /><span>The whole room has agreed to Forward Read</span></label>
        <DialogFooter><Button variant="outline" onClick={() => { setConfirming(false); setAgreed(false); }}>Cancel</Button><Button disabled={!agreed || busy} onClick={() => void enable()}>Switch on</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </div>;
}
