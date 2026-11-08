import { describe, expect, test } from 'bun:test';
import { buildPlaybookPath, mapAttack, mapResponse, parseDecisionPath, type PlaybookInject, type PlaybookResponse } from '../src/lib/disinformationPlaybook';
const inject: PlaybookInject = { id: 'notice', inject_type: 'leak', content: 'Forged regulator notice', source: 'Telegram', is_sent: true, sent_at: '2026-11-08T13:01:00Z', timestamp_offset: 0, created_by: 'red_team' };
const response: PlaybookResponse = { id: 'action', inject_id: 'notice', team_id: 'blue-a', response_label: 'Truth-sandwich holding line', custom_response: null, effectiveness: 80, response_time_seconds: 25 };
describe('participant decision path', () => {
  test('each team sees its actual saved choices against the matching inject', () => {
    const path = buildPlaybookPath([inject], [response, { ...response, id: 'other', team_id: 'blue-b' }], 'blue-a', '2026-11-08T13:00:00Z');
    expect(path[0].responses.map(r => r.id)).toEqual(['action']);
    expect(path[0].elapsed).toBe(60);
  });
  test('unsent preparation injects do not enter participant debrief', () => {
    expect(buildPlaybookPath([{ ...inject, is_sent: false }], [response], 'blue-a', null)).toEqual([]);
  });
  test('a forged notice maps to fabricated evidence and the evidence-checking playbook', () => {
    expect(mapAttack(inject).tactic).toBe('Fabricated evidence / impersonation');
    expect(mapAttack(inject).counter).toContain('Debunking / fact-checking');
    expect(mapResponse(response)).toBe('Truth-sandwich messaging');
  });
  test('public reaction is not labelled coordinated disinformation', () => {
    expect(mapAttack({ ...inject, narrative_category: 'public_reaction' }).tactic).toBe('Audience reaction / media pickup');
  });
  test('unrecognised custom actions remain unmapped instead of inventing a strategy', () => {
    expect(mapResponse({ ...response, custom_response: 'Wait for the chair' })).toContain('Unmapped action');
  });
  test('host-recorded branches are preserved and ordered by actual decision time', () => {
    const branch = { beatId: 'late', beatTitle: 'Forged notice', condition: 'Blue verified the notice', route: 'False claim loses momentum', atSeconds: 600, frozen: true };
    expect(parseDecisionPath([branch, { ...branch, beatId: 'early', atSeconds: 120 }, null]).map(d => d.beatId)).toEqual(['early', 'late']);
    expect(parseDecisionPath([branch])[0].route).toBe('False claim loses momentum');
  });
});