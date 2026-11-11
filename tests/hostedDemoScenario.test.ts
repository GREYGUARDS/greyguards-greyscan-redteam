import { describe, expect, test } from 'bun:test';
import { getHostedDemoScript, toHostedDemoArtefact, fromHostedDemoArtefact } from '../src/lib/hostedDemoScenario';
import { getDemoScenario } from '../src/lib/simulationCompanies';
import { getDemoInjects } from '../src/lib/demoInjects';

const companies = ['ashworth-reilly', 'meridian-vale', 'bristow-calder'];

describe('hosted fictional-company scripts', () => {
  for (const companyId of companies) {
    test(`${companyId} uses only its canonical scenario and nine existing injects`, () => {
      const hosted = getHostedDemoScript(companyId);
      const demo = getDemoScenario(companyId);
      const injects = getDemoInjects(companyId);
      expect(hosted?.scenario.title).toBe(demo?.title);
      expect(hosted?.scenario.narrative).toBe(demo?.narrative);
      expect(hosted?.injects.map(inject => inject.id)).toEqual(injects?.map(inject => inject.id));
      expect(hosted?.injects).toHaveLength(9);
    });
  }

  test('durable demo injects retain their exact media and response options', () => {
    const inject = getDemoInjects('ashworth-reilly')?.find(item => item.demoVideo);
    expect(inject).toBeDefined();
    const restored = fromHostedDemoArtefact(toHostedDemoArtefact(inject!, 'ashworth-reilly'));
    expect(restored?.companyId).toBe('ashworth-reilly');
    expect(restored?.inject.demoVideo).toEqual(inject?.demoVideo);
    expect(restored?.inject.responseOptions).toEqual(inject?.responseOptions);
  });

  test('real companies do not receive a fictional demo script', () => {
    expect(getHostedDemoScript()).toBeNull();
    expect(getHostedDemoScript('real-company')).toBeNull();
  });
});
