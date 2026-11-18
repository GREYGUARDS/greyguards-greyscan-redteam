import { expect, test } from 'bun:test';
import { getDemoInjects } from '../src/lib/demoInjects';
import pharmacore from '../src/assets/pharmacore_greenscreen_opening.mp4.asset.json';
import trustinsure from '../src/assets/trustinsure_truth_desk_opening.mp4.asset.json';
import pigeebank from '../src/assets/pigeebank_dim_studio_opening.mp4.asset.json';

for (const [company, asset, views, shares, reach] of [
  ['ashworth-reilly', pharmacore, '30K', '650', 30000],
  ['meridian-vale', trustinsure, '32K', '790', 32000],
  ['bristow-calder', pigeebank, '29K', '540', 29000],
] as const) {
  test(`${company} opens with its replacement film and early-detection metrics`, () => {
    const injects = getDemoInjects(company);
    expect(injects?.[0]?.demoVideo?.url).toBe(asset.url);
    expect(injects?.[0]?.demoVideo?.overlay.views).toBe(views);
    expect(injects?.[0]?.demoVideo?.overlay.shares).toBe(shares);
    expect(injects?.[0]?.reach).toBe(reach);
    expect(injects?.[0]?.hideCaption).not.toBe(true);
    expect(injects?.[0]?.timestamp).toBe(15);
    expect(injects?.[1]?.timestamp).toBe(60);
    expect(injects?.[1]?.demoVideo).toBeUndefined();
  });
}