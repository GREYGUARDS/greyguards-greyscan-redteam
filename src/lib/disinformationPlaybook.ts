export interface PlaybookInject {
  id: string;
  inject_type: string;
  content: string;
  source: string;
  is_sent: boolean | null;
  sent_at: string | null;
  timestamp_offset: number;
  phase?: string | null;
  narrative_category?: string | null;
  created_by: string;
}
export interface PlaybookResponse {
  id: string;
  team_id: string;
  inject_id: string;
  response_label: string;
  custom_response: string | null;
  effectiveness: number;
  response_time_seconds: number;
}
export interface DecisionPathEntry {
  beatId: string;
  beatTitle: string;
  condition: string;
  route: string;
  atSeconds: number;
  frozen: boolean;
}

export function parseDecisionPath(value: unknown): DecisionPathEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter((d): d is DecisionPathEntry => !!d && typeof d === 'object' &&
    typeof d.beatId === 'string' && typeof d.beatTitle === 'string' &&
    typeof d.condition === 'string' && typeof d.route === 'string' &&
    typeof d.atSeconds === 'number' && Number.isFinite(d.atSeconds))
    .sort((a, b) => a.atSeconds - b.atSeconds);
}

/** Training analogues, not forensic attribution or official DISARM technique IDs. */
export function mapAttack(inject: PlaybookInject) {
  const text = `${inject.content} ${inject.source}`.toLowerCase();
  if (inject.narrative_category === 'public_reaction' || inject.narrative_category === 'press') {
    return { tactic: 'Audience reaction / media pickup', lesson: 'Coverage and concern are not proof of coordination. Verify the original claim before treating reactions as hostile activity.', counter: 'Narrative monitoring / early warning; proactive transparency' };
  }
  if (/deepfake|impersonat|forged|fake.*notice|doctored|fabricat/.test(text)) {
    return { tactic: 'Fabricated evidence / impersonation', lesson: 'Borrowed authority can make a false claim look credible. Check the original document, speaker and official channel.', counter: 'Debunking / fact-checking; labelling / contextual warnings' };
  }
  if (inject.narrative_category === 'malinformation' || /out.of.context|undated|resurfac|edited|selectively/.test(text)) {
    return { tactic: 'Recontextualising genuine material', lesson: 'A real fact can be weaponised by removing its date or context. Acknowledge what is true and restore what was omitted.', counter: 'Proactive transparency; truth-sandwich messaging' };
  }
  if (inject.inject_type === 'amplification' || /bot network|coordinated|200\+ accounts/.test(text)) {
    return { tactic: 'Coordinated amplification', lesson: 'Repeated claims can manufacture apparent consensus. Preserve evidence of account behaviour rather than assuming reach proves coordination.', counter: 'Attribution & public exposure; platform escalation for network disruption' };
  }
  if (inject.inject_type === 'leak') return { tactic: 'Purported leak', lesson: 'Check authenticity and provenance before either denying or repeating the claim.', counter: 'Debunking / fact-checking; proactive transparency' };
  if (inject.inject_type === 'influencer') return { tactic: 'Influencer amplification', lesson: 'Trusted personalities can transfer credibility to an unverified story. Provide checkable evidence without feeding a public confrontation.', counter: 'Counter-messaging / displacement; crowdsourced correction' };
  if (inject.inject_type === 'news_article') return { tactic: 'Media laundering of a claim', lesson: 'Publication can make a rumour appear independently verified. Trace reporting back to its original source.', counter: 'Debunking / fact-checking; counter-messaging / displacement' };
  return { tactic: 'Narrative seeding', lesson: 'An early unverified claim tests the information gap. Verify, monitor spread and prepare an evidence-led holding line.', counter: 'Narrative monitoring / early warning; truth-sandwich messaging' };
}

export function mapResponse(response: PlaybookResponse) {
  const text = (response.custom_response || response.response_label).toLowerCase();
  if (/truth.sandwich|holding line/.test(text)) return 'Truth-sandwich messaging';
  if (/regulator|underwriter|legal/.test(text)) return 'Legal & regulatory action — via authorised legal or regulatory channels';
  if (/takedown|remove|platform|label/.test(text)) return 'Labelling / contextual warnings; content takedown — request through the platform';
  if (/attribut|expos|network/.test(text)) return 'Attribution & public exposure — only with supporting evidence';
  if (/monitor|gather|investigat|verify quietly/.test(text)) return 'Narrative monitoring / early warning';
  if (/editor|correct|fact|evidence|debunk|clarif/.test(text)) return 'Debunking / fact-checking';
  if (/transparen|acknowledge|publish/.test(text)) return 'Proactive transparency';
  if (/influencer|third.party|community/.test(text)) return 'Counter-messaging / displacement; crowdsourced correction';
  if (/denial|deny|statement|respond/.test(text)) return 'Counter-messaging / displacement — verify facts before rebutting';
  return 'Unmapped action — review its evidence, audience and purpose with the facilitator';
}

export function buildPlaybookPath(injects: PlaybookInject[], responses: PlaybookResponse[], teamId: string, startedAt: string | null) {
  const start = startedAt ? Date.parse(startedAt) : NaN;
  return injects.filter(i => i.is_sent).map(inject => {
    const sent = inject.sent_at ? Date.parse(inject.sent_at) : NaN;
    const elapsed = Number.isFinite(start) && Number.isFinite(sent) ? Math.max(0, (sent - start) / 1000) : inject.timestamp_offset;
    return { inject, elapsed, attack: mapAttack(inject), responses: responses.filter(r => r.inject_id === inject.id && r.team_id === teamId) };
  }).sort((a, b) => a.elapsed - b.elapsed || a.inject.id.localeCompare(b.inject.id));
}