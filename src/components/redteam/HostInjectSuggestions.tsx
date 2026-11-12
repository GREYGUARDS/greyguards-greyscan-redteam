import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export interface HostInjectSuggestion { type: string; channel: string; source: string; content: string; reacting_to: string; why: string; sentiment: 'hostile' | 'confused' | 'neutral'; reach: number }

/** Host-only: AI reads the team's latest written responses and proposes counter-injects. Nothing is sent until the host drafts and sends it. */
export default function HostInjectSuggestions({ sessionId, responseCount, onUse }: { sessionId: string | null; responseCount: number; onUse: (s: HostInjectSuggestion) => void }) {
  const [items, setItems] = useState<HostInjectSuggestion[]>([]);
  const [busy, setBusy] = useState(false);
  const [readAt, setReadAt] = useState<number | null>(null);
  const run = async () => {
    if (!sessionId) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('suggest-host-injects', { body: { sessionId } });
    setBusy(false);
    if (error) { const d = await error.context?.json?.().catch(() => null); toast.error(d?.error ?? 'Suggestions could not be generated.'); return; }
    setItems(data?.suggestions ?? []); setReadAt(responseCount);
    if (data?.message) toast.info(data.message);
  };
  const fresh = readAt !== null && responseCount > readAt;
  return <div className="space-y-3 border-2 border-dashed border-crimson/40 p-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><p className="text-[10px] font-semibold uppercase tracking-wider text-crimson">AI reaction suggestions</p><p className="text-xs text-muted-foreground">Reads what the team wrote and suggests what the attackers do next.</p></div>
      <Button size="sm" variant="outline" onClick={() => void run()} disabled={!sessionId || busy}>{busy ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}{items.length ? 'Refresh' : 'Suggest injects'}{fresh && <Badge className="ml-2 h-4 px-1 text-[9px]">new answers</Badge>}</Button>
    </div>
    {items.map((s, i) => <div key={i} className="space-y-1 rounded-md border border-border bg-background p-3 text-sm">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.channel} · {s.source}</p>
      <p className="break-words">{s.content}</p>
      <p className="text-xs text-muted-foreground"><span className="font-semibold">Reacting to:</span> “{s.reacting_to}”</p>
      <p className="text-xs text-muted-foreground">{s.why}</p>
      <Button size="sm" className="mt-1" onClick={() => onUse(s)}>Use as draft</Button>
    </div>)}
  </div>;
}
