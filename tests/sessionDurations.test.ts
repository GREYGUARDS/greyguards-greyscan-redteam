import { describe, expect, test } from 'bun:test';
import { HOSTED_DURATIONS, normaliseHostedDuration, suggestedFreezeMinutes } from '../src/lib/sessionDurations';

describe('hosted session lengths', () => {
  test('only 90 minutes and 4 hours are offered', () => expect([...HOSTED_DURATIONS]).toEqual([90, 240]));
  test('legacy 60 and 120 open as 90 minutes', () => { expect(normaliseHostedDuration(60)).toBe(90); expect(normaliseHostedDuration(120)).toBe(90); });
  test('legacy 180 opens as 4 hours', () => expect(normaliseHostedDuration(180)).toBe(240));
  test('90-minute sessions suggest freezes at 20, 50 and 75', () => expect(suggestedFreezeMinutes(90)).toEqual([20, 50, 75]));
});
