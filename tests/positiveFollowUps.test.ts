import { expect, test } from 'bun:test';
import { getDemoInjects } from '../src/lib/demoInjects';
import fire from '../src/assets/trustinsure_firefighter_evening_positive.mp4.asset.json';
import rent from '../src/assets/pigeebank_renter_pub_positive.mp4.asset.json';

for (const [company, asset] of [['meridian-vale', fire], ['bristow-calder', rent]] as const) {
  test(`${company} inject 9 is the positive civilian follow-up film`, () => {
    const injects = getDemoInjects(company)!;
    expect(injects).toHaveLength(10);
    expect(injects[8].demoVideo?.url).toBe(asset.url);
    expect(injects[8].sentiment).toBe('neutral');
  });
}
