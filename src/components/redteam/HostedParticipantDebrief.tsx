import { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { buildPlaybookPath, mapResponse, parseDecisionPath, type PlaybookInject, type PlaybookResponse } from '@/lib/disinformationPlaybook';

interface Props { sessionId: string; teamId?: string; onBack?: () => void }
interface Team { id: string; team_type: string; team_name: string | null }
interface Session { brand_name: string; started_at: string | null; decision_log: unknown }
const time = (seconds: number) => `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;

export default function HostedParticipantDebrief({ sessionId, teamId, onBack }: Props) {
  const [data, setData] = useState<{ session: Session; injects: PlaybookInject[]; responses: PlaybookResponse[]; teams: Team[] } | null>(null);
  const [selectedTeam, setSelectedTeam] = useState(teamId || '');
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setError(false);
    const load = async () => {
      const [session, injects, responses, teams] = await Promise.all([
        supabase.from('exercise_sessions').select('brand_name, started_at, decision_log').eq('id', sessionId).single(),
        supabase.from('exercise_injects').select('id, inject_type, content, source, is_sent, sent_at, timestamp_offset, phase, narrative_category, created_by').eq('session_id', sessionId).eq('is_sent', true),
        supabase.from('exercise_responses').select('id, team_id, inject_id, response_label, custom_response, effectiveness, response_time_seconds').eq('session_id', sessionId).order('created_at'),
        supabase.from('exercise_teams').select('id, team_type, team_name').eq('session_id', sessionId).in('team_type', ['blue', 'red']),
      ]);
      if (cancelled) return;
      if (session.error || injects.error || responses.error || teams.error || !session.data) { setError(true); return; }
      const list = teams.data || [];
      setData({ session: session.data, injects: injects.data || [], responses: responses.data || [], teams: list });
      setSelectedTeam(current => list.some(t => t.id === current) ? current : list.find(t => t.team_type === 'blue')?.id || list[0]?.id || '');
    };
    void load().catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [sessionId, attempt]);

  const wrap = onBack ? 'min-h-screen bg-background px-4 py-8' : '';
  if (error) return <div className={wrap}><p className="text-sm text-muted-foreground">The saved debrief could not be loaded.</p><Button variant="outline" onClick={() => setAttempt(a => a + 1)}>Retry</Button>{onBack && <Button variant="ghost" onClick={onBack}>Return to Red Team</Button>}</div>;
  if (!data) return <div className={wrap}><Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Loading saved debrief" /></div>;
  const team = data.teams.find(t => t.id === selectedTeam);
  const isRed = team?.team_type === 'red';
  const path = buildPlaybookPath(data.injects, data.responses, selectedTeam, data.session.started_at);
  const decisions = parseDecisionPath(data.session.decision_log);
  const ownResponses = data.responses.filter(r => r.team_id === selectedTeam);
  const average = ownResponses.length ? Math.round(ownResponses.reduce((sum, r) => sum + r.response_time_seconds, 0) / ownResponses.length) : null;
  const redInjects = path.filter(p => p.inject.created_by === 'red_team');

  return <div className={wrap}>
    <div className={onBack ? 'mx-auto max-w-4xl space-y-6' : 'space-y-6'}>
      {onBack && <Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-2 h-4 w-4" />Return to Red Team</Button>}
      <header className="space-y-3 border-b border-border pb-4">
        <p className="text-xs uppercase text-primary">Exercise debrief · After-Action</p>
        <h2 className="font-display text-3xl uppercase break-words">{data.session.brand_name}</h2>
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-sm font-semibold">Decision path & disinformation playbook</h3>
          {data.teams.length > 0 && <Select value={selectedTeam} onValueChange={setSelectedTeam}><SelectTrigger className="w-full sm:w-64" aria-label="Debrief team"><SelectValue /></SelectTrigger><SelectContent>{data.teams.map(t => <SelectItem key={t.id} value={t.id}>{t.team_name || `${t.team_type === 'red' ? 'Red' : 'Blue'} team`} · {t.team_type === 'red' ? 'Attack' : 'Defence'}</SelectItem>)}</SelectContent></Select>}
        </div>
        <p className="text-xs text-muted-foreground">Fictional exercise. Tactic matches are training interpretations, not proof of a real campaign or official technique classifications.</p>
      </header>
      <dl className="grid grid-cols-2 gap-4 border-b border-border pb-4 text-sm sm:grid-cols-3">
        <div><dt className="text-xs text-muted-foreground">{isRed ? 'Red injects delivered' : 'Actions recorded'}</dt><dd className="text-2xl font-semibold">{isRed ? redInjects.length : ownResponses.length}</dd></div>
        <div><dt className="text-xs text-muted-foreground">{isRed ? 'Defender responses to Red injects' : 'Average response time'}</dt><dd className="text-2xl font-semibold">{isRed ? data.responses.filter(r => redInjects.some(p => p.inject.id === r.inject_id)).length : average === null ? '—' : `${average}s`}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Host-recorded routes</dt><dd className="text-2xl font-semibold">{decisions.length}</dd></div>
      </dl>
      <section className="space-y-4">
        <h3 className="text-sm font-semibold uppercase">Shared decision path</h3>
        {decisions.length === 0 && <p className="text-sm text-muted-foreground">No branch routes were recorded by the host. Saved injects and actions are shown below.</p>}
        {decisions.map((decision, index) => {
          // A recorded route marks the decision point at the end of this interval.
          const previous = decisions[index - 1]?.atSeconds ?? -1;
          const linked = path.filter(p => p.elapsed > previous && p.elapsed <= decision.atSeconds);
          return <article key={decision.beatId} className="space-y-2 border-l-2 border-primary pl-4 text-sm">
            <p className="text-xs text-muted-foreground">{time(decision.atSeconds)}{decision.frozen ? ' · Freeze frame' : ''} · Host-recorded branch</p>
            <h4 className="font-semibold">{decision.beatTitle}</h4>
            <p>{decision.condition}</p><p className="text-muted-foreground">Storyline consequence: {decision.route}</p>
            <div className="flex flex-wrap gap-2">{linked.map(p => <a key={p.inject.id} href={`#playbook-${p.inject.id}`} className="text-xs text-primary underline underline-offset-4">{p.inject.source} · {time(p.elapsed)}</a>)}</div>
            {linked.length === 0 && <p className="text-xs text-muted-foreground">No delivered inject in this decision interval.</p>}
          </article>;
        })}
      </section>
      <section className="space-y-4 border-t border-border pt-5">
        <h3 className="text-sm font-semibold uppercase">{isRed ? 'Attack choices & defender reaction' : 'Injects & team choices'}</h3>
        {path.length === 0 && <p className="text-sm text-muted-foreground">No injects were delivered during this exercise.</p>}
        {path.map(({ inject, elapsed, attack, responses }) => {
          const reactions = isRed ? data.responses.filter(r => r.inject_id === inject.id) : responses;
          return <article id={`playbook-${inject.id}`} key={inject.id} className="scroll-mt-8 space-y-3 border border-border p-4 text-sm">
            <p className="text-xs text-muted-foreground">{time(elapsed)} · {inject.source} · {inject.created_by === 'red_team' ? 'Red team' : 'Host'}{inject.phase ? ` · ${inject.phase}` : ''}</p>
            <p className="whitespace-pre-line break-words">{inject.content}</p>
            <div className="border-l-2 border-destructive pl-3"><p className="font-semibold text-destructive">Training analogue: {attack.tactic}</p><p className="mt-1 text-muted-foreground">{attack.lesson}</p></div>
            {reactions.map(response => <div key={response.id} className="space-y-1 border-l-2 border-defender pl-3">
              <p className="text-xs text-muted-foreground">{data.teams.find(t => t.id === response.team_id)?.team_name || 'Blue team'} · {Math.round(response.response_time_seconds)}s · Recorded effectiveness {Math.round(response.effectiveness)}%</p>
              <p className="break-words">{response.custom_response || response.response_label}</p>
              <p className="text-xs text-primary">Response spectrum: {mapResponse(response)}</p>
            </div>)}
            {reactions.length === 0 && <p className="text-xs text-muted-foreground">No saved defender action for this inject.</p>}
            <p className="text-xs"><span className="font-medium">Real-world next step:</span> {attack.counter}. Assign an owner, retain source evidence and agree an escalation threshold.</p>
          </article>;
        })}
      </section>
      <footer className="space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
        <p>Playbook basis: DISARM framework for disinformation behaviours; DMMI response spectrum for countermeasures. Host branches describe the exercise storyline, not independently measured effects of a team’s action.</p>
        <a href="https://www.disarm.foundation/framework" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary underline">DISARM framework<ExternalLink className="h-3 w-3" /></a>
        <p>Legal or coercive measures require the appropriate authority. Teams should seek advice or escalate, not act beyond their remit.</p>
      </footer>
    </div>
  </div>;
}