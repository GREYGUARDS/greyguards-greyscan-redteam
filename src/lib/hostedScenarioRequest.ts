import type { ExerciseConfig } from '@/pages/RedTeam';

export function hostedScenarioRequest(config: ExerciseConfig) {
  const outline = config.narrativeSeed?.trim();
  if (config.scenarioCategory === 'custom' && !outline) {
    throw new Error('Enter a custom scenario outline.');
  }
  return {
    brandName: config.brandName.trim(),
    duration: config.duration,
    researchCompany: !config.simulationCompanyId,
    scenarioCategory: config.scenarioCategory === 'custom' ? 'random' : config.scenarioCategory,
    ...(outline ? { userScenario: `Fictional disinformation narrative: ${outline}` } : {}),
    ...(config.brandContext ? { brandContext: config.brandContext } : {}),
  };
}