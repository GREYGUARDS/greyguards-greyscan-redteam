import { expect, test } from 'bun:test';
import { readDemoSession, readDemoProgress, demoActionConsequence } from '../src/lib/demoPlayback';
const storage = (raw: string) => ({ getItem: () => raw });
test('refresh recovers a ten-minute demo session', () => {
  expect(readDemoSession(storage(JSON.stringify({ config: { simulationCompanyId: 'bristow-calder', duration: 10 }, scenario: { id: 'bank-run', title: 'Withdrawal rumour' } })))?.scenario.id).toBe('bank-run');
  expect(readDemoSession(storage('broken'))).toBeNull();
});
test('refresh never applies another scenario progress', () => {
  const raw = JSON.stringify({ scenarioId: 'bank-run', timeRemaining: 590, injects: [], responseHistory: [], eventLog: [] });
  expect(readDemoProgress(storage(raw), 'bank-run')?.timeRemaining).toBe(590);
  expect(readDemoProgress(storage(raw), 'other')).toBeNull();
});
test('scripted continuation reflects action quality without waiting for monitoring', () => {
  expect(demoActionConsequence('Publish facts', 85)).toContain('facts are gaining ground');
  expect(demoActionConsequence('Ignore it', 20)).toContain('uncertainty grows');
});