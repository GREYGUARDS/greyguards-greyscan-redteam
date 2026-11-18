import { expect, test } from 'bun:test';
import { getDemoInjects } from '../src/lib/demoInjects';
import pharmacore from '../src/assets/pharmacore_forged_log_opening.mp4.asset.json';
import trustinsure from '../src/assets/trustinsure_manipulated_opening.mp4.asset.json';
import pigeebank from '../src/assets/pigeebank_forged_spreadsheet_opening.mp4.asset.json';

for (const [company, asset] of [
  ['ashworth-reilly', pharmacore],
  ['meridian-vale', trustinsure],
  ['bristow-calder', pigeebank],
] as const) {
  test(`${company} opens with its replacement film before the spread inject`, () => {
    const injects = getDemoInjects(company);
    expect(injects?.[0]?.demoVideo?.url).toBe(asset.url);
    expect(injects?.[0]?.timestamp).toBe(15);
    expect(injects?.[1]?.timestamp).toBe(60);
    expect(injects?.[1]?.demoVideo).toBeUndefined();
  });
}