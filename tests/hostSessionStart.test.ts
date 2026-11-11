import { expect, test } from 'bun:test';
import { canStartPreparedSession } from '../src/lib/hostSessionStart';

test('prepared cases can start directly without visiting the sandpit', () => {
  expect(canStartPreparedSession({ status: 'preparing', scenario_narrative: 'Prepared case' })).toBe(true);
  expect(canStartPreparedSession({ status: 'waiting', scenario_narrative: 'Prepared case' })).toBe(true);
});
test('unfinished and completed cases cannot be directly started', () => {
  expect(canStartPreparedSession({ status: 'preparing', scenario_narrative: '' })).toBe(false);
  expect(canStartPreparedSession({ status: 'completed', scenario_narrative: 'Prepared case' })).toBe(false);
  expect(canStartPreparedSession({ status: 'active', scenario_narrative: 'Prepared case' })).toBe(false);
});