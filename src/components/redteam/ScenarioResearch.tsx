import { ExternalLink, Users } from 'lucide-react';
import type { Scenario } from '@/pages/RedTeam';

export default function ScenarioResearch({ scenario }: { scenario: Scenario | null }) {
  const research = scenario?.research;
  if (!research) return null;
  return <section className="my-4 space-y-3 border-y border-border py-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-semibold">GreyScan company background</h3><span className="text-[10px] text-muted-foreground">Scanned {new Date(research.scannedAt).toLocaleString('en-GB')}</span></div>
    <p className="text-xs text-muted-foreground">{research.status === 'unavailable' ? 'Live sources returned no usable background. This is a generic fictional exercise; company and board details are unconfirmed.' : 'Published background informs this exercise. The attack story is fictional, not an allegation of wrongdoing.'}</p>
    {research.unavailableSources.length > 0 && <p className="text-[10px] text-muted-foreground">Unavailable feeds: {research.unavailableSources.join(', ').replace(/fetch-/g, '')}</p>}
    {scenario?.researchBasis?.length ? <ul className="space-y-1 text-xs">{scenario.researchBasis.map((reason, i) => <li key={i}>{reason}</li>)}</ul> : null}
    <div className="space-y-2"><h4 className="flex items-center gap-1 text-xs font-medium"><Users className="h-3 w-3" />Board / leadership background</h4>{scenario?.boardContext?.length ? scenario.boardContext.map((person, i) => <p key={i} className="text-xs">{person.name} · {person.role} <span className="text-muted-foreground">[{person.sourceId}]</span></p>) : <p className="text-xs text-muted-foreground">No source-supported names and roles found. The exercise uses board responsibilities rather than assumed identities.</p>}<p className="text-[10px] text-muted-foreground">Public sources may be out of date; review names and roles before running the session.</p></div>
    <details className="text-xs"><summary className="cursor-pointer">Source links ({research.sources.length})</summary><div className="mt-2 max-h-48 space-y-2 overflow-y-auto">{research.sources.map(source => <a key={source.id} href={source.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 break-words text-primary underline"><ExternalLink className="mt-0.5 h-3 w-3 shrink-0" /><span>[{source.id}] {source.title}</span></a>)}</div></details>
  </section>;
}