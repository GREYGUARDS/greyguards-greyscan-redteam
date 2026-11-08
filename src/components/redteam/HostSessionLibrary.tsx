import { useEffect, useState } from 'react';
import { FolderOpen, Lock, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { ExerciseConfig } from '@/pages/RedTeam';
import type { Tables } from '@/integrations/supabase/types';

export type PreparedSession = Tables<'exercise_sessions'>;
export function sessionConfig(session: PreparedSession): ExerciseConfig {
  const saved = session.preparation_config as unknown as Partial<ExerciseConfig>;
  return { ...saved, brandName: session.brand_name, duration: session.duration as ExerciseConfig['duration'], teamMode: session.team_mode as ExerciseConfig['teamMode'], mode: 'consultant', scenarioCategory: saved?.scenarioCategory ?? 'random' };
}

export default function HostSessionLibrary({ onOpen }: { onOpen: (session: PreparedSession) => void }) {
  const [sessions, setSessions] = useState<PreparedSession[]>([]);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const load = async () => {
    setBusy(true); setError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBusy(false); return; }
    const { data, error: failure } = await supabase.from('exercise_sessions').select('*').eq('created_by_user_id', user.id).order('created_at', { ascending: false });
    if (failure) setError('Your saved sessions could not be loaded. Please retry.');
    else setSessions(data ?? []);
    setBusy(false);
  };
  useEffect(() => { void load(); }, []);
  const filtered = sessions.filter(s => `${s.brand_name} ${s.session_label ?? ''} ${s.scenario_title ?? ''}`.toLowerCase().includes(search.toLowerCase()));
  return <section className="space-y-3 border-t border-border pt-4">
    <div className="flex items-center justify-between gap-2"><h3 className="flex items-center gap-2 text-sm font-semibold"><FolderOpen className="h-4 w-4" />Prepared sessions</h3><Button variant="ghost" size="icon" aria-label="Refresh saved sessions" onClick={() => void load()} disabled={busy}><RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} /></Button></div>
    <p className="flex items-center gap-1 text-xs text-muted-foreground"><Lock className="h-3 w-3" />Private host library</p>
    <Input aria-label="Search saved sessions" placeholder="Search client or session…" value={search} onChange={e => setSearch(e.target.value)} />
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    {busy ? <p role="status" className="text-xs text-muted-foreground">Loading sessions…</p> : filtered.length === 0 ? <p className="text-xs text-muted-foreground">No saved sessions yet.</p> : <div className="max-h-72 space-y-2 overflow-y-auto">{filtered.map(s => <div key={s.id} className="flex items-center gap-3 rounded-md border border-border p-3">
      <div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">{s.session_label || s.brand_name}</p><p className="break-words text-xs text-muted-foreground">{s.brand_name} · {s.scenario_title || 'Scenario to prepare'}</p><div className="mt-2 flex flex-wrap items-center gap-2"><Badge variant="outline">{s.status === 'preparing' ? 'Sandpit' : s.status}</Badge><span className="text-[10px] text-muted-foreground">{s.duration / 60}h · {new Date(s.created_at).toLocaleDateString('en-GB')}</span></div></div>
      <Button size="sm" variant="outline" onClick={() => onOpen(s)}><FolderOpen className="mr-1 h-3 w-3" />Open</Button>
    </div>)}</div>}
  </section>;
}