import { test, expect } from 'bun:test';
import { hostedScenarioRequest } from '../src/lib/hostedScenarioRequest';
import type { ExerciseConfig } from '../src/pages/RedTeam';

const config: ExerciseConfig = { brandName: 'Tesco', mode: 'consultant', duration: 60, teamMode: 'solo', scenarioCategory: 'random' };
test('named hosted companies request GreyScan background research', () => {
  expect(hostedScenarioRequest(config).researchCompany).toBe(true);
  expect(hostedScenarioRequest({ ...config, simulationCompanyId: 'ashworth-reilly' }).researchCompany).toBe(false);
});
test('custom scenarios send the host outline alongside company research', () => {
  const request = hostedScenarioRequest({ ...config, scenarioCategory: 'custom', narrativeSeed: 'Forged board minutes claim stores are closing.' });
  expect(request.userScenario).toBe('Fictional disinformation narrative: Forged board minutes claim stores are closing.');
  expect(request.researchCompany).toBe(true);
  expect(request.scenarioCategory).toBe('random');
});
test('custom scenarios require a non-empty host outline', () => {
  expect(() => hostedScenarioRequest({ ...config, scenarioCategory: 'custom', narrativeSeed: '  ' })).toThrow('Enter a custom scenario outline.');
});