/** Hosted Red Team session lengths (minutes). Public demo stays at 10. */
export const HOSTED_DURATIONS = [90, 240] as const;
export type HostedDuration = (typeof HOSTED_DURATIONS)[number];

export const HOSTED_DURATION_LABELS: Record<HostedDuration, { value: string; unit: string; caption: string }> = {
  90: { value: "90", unit: "minutes", caption: "Board half-day" },
  240: { value: "4", unit: "hours", caption: "Full day working session" },
};

/** Map any saved minutes (e.g. legacy 60/120/180) to the closest hosted option. */
export function normaliseHostedDuration(minutes: number): HostedDuration {
  return Math.abs(minutes - 90) <= Math.abs(minutes - 240) ? 90 : 240;
}

/** Suggested freeze-frame minutes for a session length. */
export function suggestedFreezeMinutes(minutes: number): number[] {
  return minutes === 90 ? [20, 50, 75] : [];
}

export function formatDuration(minutes: number): string {
  return minutes >= 120 ? `${minutes / 60}h` : `${minutes} min`;
}
