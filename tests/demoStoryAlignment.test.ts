import { describe, expect, test } from 'bun:test';
import { getDemoInjects } from '../src/lib/demoInjects';
import { SIMULATION_DEMO_COMPANIES } from '../src/lib/simulationDemoData';
import { getDemoScenario } from '../src/lib/simulationCompanies';

const cases = [
  {
    companyId: 'ashworth-reilly',
    companyName: 'Pharmacore International',
    sharedTerms: ['depot log', 'amoxicillin', 'doncaster'],
    removedStory: 'foreign-controlled nhs supply chain',
  },
  {
    companyId: 'meridian-vale',
    companyName: 'TrustInsureUK PLC',
    sharedTerms: ['thomas reeve', 'flood payouts', 'claims-freeze'],
    removedStory: 'lower-income postcodes',
  },
  {
    companyId: 'bristow-calder',
    companyName: 'PigeeBank!.com',
    sharedTerms: ['£40m', 'treasury spreadsheet', 'withdrawals'],
    removedStory: 'synthetic executive voice',
  },
] as const;

describe('GreyScan and Red Team demo alignment', () => {
  for (const { companyId, companyName, sharedTerms, removedStory } of cases) {
    test(`${companyName} leads with the same fabricated claim in both demos`, () => {
      const greyScan = SIMULATION_DEMO_COMPANIES[companyName];
      const openingInject = getDemoInjects(companyId)?.[0];
      const primaryNarrative = greyScan.mdmNarratives[0].narrative_description.toLowerCase();
      const redTeamCopy = `${getDemoScenario(companyId)?.narrative ?? ''} ${openingInject?.content ?? ''}`.toLowerCase();

      for (const term of sharedTerms) {
        expect(primaryNarrative).toContain(term.toLowerCase());
        expect(redTeamCopy).toContain(term.toLowerCase());
      }
    });

    test(`${companyName} removes the superseded GreyScan storyline`, () => {
      const greyScan = SIMULATION_DEMO_COMPANIES[companyName];
      const reportCopy = JSON.stringify({
        narratives: greyScan.mdmNarratives,
        predictions: greyScan.emergingPredictions,
        mentions: greyScan.mentions,
        stories: greyScan.trackedStories,
        queries: greyScan.trendsData.related_queries.rising,
      }).toLowerCase();

      expect(reportCopy).not.toContain(removedStory);
    });
  }
});
