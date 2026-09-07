import type { Inject } from "@/pages/RedTeam";

/**
 * A single beat of the attack timeline: one inject, its place in the running
 * order, the narrative phase it belongs to, and the in-world date/time it
 * "happened" (the exercise clock is a compressed version of a 72-hour attack).
 */
export interface TimelineBeat {
  inject: Inject;
  /** 1-based running order */
  order: number;
  phase: string;
  phaseNote: string;
  /** In-world moment, e.g. "Tue 08 Sep · 11:20" */
  clock: string;
  /** "Day 2" style label */
  dayLabel: string;
  /** Seconds into the exercise this beat is released */
  timestamp: number;
}

/** Narrative arc of a disinformation attack, expressed as ordered phases. */
const PHASES: Array<{ upTo: number; phase: string; note: string }> = [
  { upTo: 0.15, phase: "Seeding", note: "First fabricated claim placed in a low-trust space." },
  { upTo: 0.35, phase: "Amplification", note: "Coordinated accounts push the claim into wider view." },
  { upTo: 0.55, phase: "Escalation", note: "Named individuals and documents drawn in." },
  { upTo: 0.75, phase: "Mainstreaming", note: "Legitimate media and stakeholders start repeating it." },
  { upTo: 0.9, phase: "Institutional", note: "Regulators, partners and customers demand answers." },
  { upTo: 1.01, phase: "Resolution", note: "Narrative either corrected or hardened into record." },
];

const phaseFor = (fraction: number) =>
  PHASES.find((p) => fraction <= p.upTo) ?? PHASES[PHASES.length - 1];

/** Whole attack compresses into 72 in-world hours. */
const ATTACK_WINDOW_HOURS = 72;
const MIN_GAP_SECONDS = 18;

const formatClock = (date: Date) =>
  `${date.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" })} · ${date
    .toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}`;

/**
 * Turns whatever order the generator returned into a real, strictly ordered
 * timeline: sorted, spaced so two beats never collide, and dated.
 */
export const buildInjectTimeline = (
  injects: Inject[],
  totalSeconds: number,
  startOfAttack?: Date,
): TimelineBeat[] => {
  const start =
    startOfAttack ??
    (() => {
      const d = new Date();
      d.setHours(8, 40, 0, 0);
      d.setDate(d.getDate() - 2);
      return d;
    })();

  const ordered = [...injects].sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));

  let previous = -Infinity;
  return ordered.map((inject, index) => {
    const spaced = Math.max(inject.timestamp ?? 0, previous + MIN_GAP_SECONDS, 8);
    const timestamp = Math.min(spaced, Math.max(8, totalSeconds - 20));
    previous = timestamp;

    const fraction = totalSeconds > 0 ? Math.min(1, timestamp / totalSeconds) : 0;
    const { phase, note } = phaseFor(fraction);
    const when = new Date(start.getTime() + fraction * ATTACK_WINDOW_HOURS * 3600 * 1000);
    const dayIndex = Math.floor(
      (new Date(when).setHours(0, 0, 0, 0) - new Date(start).setHours(0, 0, 0, 0)) / 86_400_000,
    );

    return {
      inject: { ...inject, timestamp },
      order: index + 1,
      phase,
      phaseNote: note,
      clock: formatClock(when),
      dayLabel: `Day ${dayIndex + 1}`,
      timestamp,
    };
  });
};

/** The beat a given inject belongs to, matched by id then by content. */
export const findBeat = (timeline: TimelineBeat[], inject: Inject | null) => {
  if (!inject) return undefined;
  return (
    timeline.find((b) => b.inject.id === inject.id) ??
    timeline.find((b) => b.inject.content === inject.content)
  );
};
