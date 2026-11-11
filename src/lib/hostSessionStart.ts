export function canStartPreparedSession(session: { status: string; scenario_narrative: string | null }): boolean {
  return ['preparing', 'waiting'].includes(session.status) && Boolean(session.scenario_narrative?.trim());
}