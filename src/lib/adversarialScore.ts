export interface ScoreInject { id: string; created_by: string; is_sent: boolean | null; sent_at?: string | null }
export interface ScoreResponse { inject_id: string | null; effectiveness: number | null; response_time_seconds?: number | null }

export interface AdversarialScore {
  blue: number; red: number; fired: number; countered: number; unanswered: number; avgResponseSeconds: number | null;
}

/**
 * Head-to-head score over Red Team injects that have been fired.
 * Each fired inject is worth 100 points split between teams: Blue earns its best
 * response effectiveness (0 if unanswered), Red earns the remainder.
 * Scores are the share of points won, so blue + red = 100.
 */
export function scoreAdversarial(injects: ScoreInject[], responses: ScoreResponse[]): AdversarialScore {
  const fired = injects.filter(i => i.is_sent && i.created_by === "red_team");
  if (!fired.length) return { blue: 50, red: 50, fired: 0, countered: 0, unanswered: 0, avgResponseSeconds: null };
  let bluePts = 0, countered = 0, unanswered = 0; const times: number[] = [];
  for (const inj of fired) {
    const rs = responses.filter(r => r.inject_id === inj.id);
    if (!rs.length) { unanswered++; continue; }
    const best = Math.max(0, Math.min(100, Math.max(...rs.map(r => r.effectiveness ?? 0))));
    bluePts += best;
    if (best >= 65) countered++;
    const t = rs.map(r => Number(r.response_time_seconds)).filter(n => Number.isFinite(n) && n >= 0);
    if (t.length) times.push(Math.min(...t));
  }
  const blue = Math.round(bluePts / fired.length);
  return { blue, red: 100 - blue, fired: fired.length, countered, unanswered,
    avgResponseSeconds: times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null };
}
