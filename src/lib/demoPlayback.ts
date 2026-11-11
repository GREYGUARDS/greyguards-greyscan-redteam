import type { ExerciseConfig, Scenario, Inject, ResponseRecord } from '@/pages/RedTeam';
export const DEMO_SESSION_KEY = 'greyguards_demo_session';
export const DEMO_PROGRESS_KEY = 'greyguards_demo_progress';
export interface DemoSession { config: ExerciseConfig; scenario: Scenario }
export interface DemoProgress {
  scenarioId: string; timeRemaining: number; isPaused: boolean; injects: Inject[]; activeInject: Inject | null;
  narrativeControl: number; reputationDamage: number; decisionsCorrect: number; decisionsTotal: number;
  responseTimes: number[]; injectStartTime: number | null; responseHistory: ResponseRecord[];
  eventLog: Array<{ time: number; message: string; type: 'inject' | 'response' | 'system' }>;
  firedCount: number;
}
export function readDemoSession(storage: Pick<Storage, 'getItem'>): DemoSession | null {
  try {
    const raw = JSON.parse(storage.getItem(DEMO_SESSION_KEY) || 'null');
    return raw?.config?.simulationCompanyId && raw?.config?.duration === 10 && typeof raw?.scenario?.id === 'string' && typeof raw?.scenario?.title === 'string' ? raw : null;
  } catch { return null; }
}
export function readDemoProgress(storage: Pick<Storage, 'getItem'>, scenarioId: string): DemoProgress | null {
  try {
    const raw = JSON.parse(storage.getItem(DEMO_PROGRESS_KEY) || 'null');
    return raw?.scenarioId === scenarioId && Number.isFinite(raw.timeRemaining) && Array.isArray(raw.injects) && Array.isArray(raw.responseHistory) && Array.isArray(raw.eventLog) ? raw : null;
  } catch { return null; }
}
export function demoActionConsequence(label: string, effectiveness: number): string {
  return effectiveness >= 78 ? `${label}: the facts are gaining ground. The attack continues.` : effectiveness >= 50 ? `${label}: some reassurance, but doubts remain.` : `${label}: uncertainty grows and the rumour spreads.`;
}