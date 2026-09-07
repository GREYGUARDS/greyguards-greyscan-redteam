// Canonical mention accounting for the GreyScan report page.
//
// The report draws on two different things that both look like "mentions":
//   1. The analysed corpus  – every item collected from active sources in the
//      scan window. This is the ONLY number any percentage should divide by.
//   2. The illustrative feed – a short sample of individual posts/articles
//      shown in the live feed and ticker.
// Mixing the two is what made the page look self-contradictory, so every
// metric on the page now derives from this single helper.

export interface CanonicalSource {
  name: string;
  count: number;
  country?: string;
}

export interface CanonicalMentionStats {
  /** Total analysed mentions across all active sources in the window. */
  totalMentions: number;
  /** Number of individual mentions shown as examples in the feed/ticker. */
  sampleSize: number;
  /** 0-100 share of the corpus classed negative. */
  negativeShare: number;
  /** Negative mentions in the current window. */
  currentNegative: number;
  /** Negative mentions in the preceding window of equal length. */
  previousNegative: number;
  /** Negative volume split across sources, proportional to source volume. */
  negativeBySource: Array<{ source: string; count: number; percentage: number }>;
  /** Human label for the analysis window, e.g. "last 30 days". */
  windowLabel: string;
  /** Shorter label for badges, e.g. "30d". */
  windowShortLabel: string;
}

interface BuildArgs {
  sources: CanonicalSource[];
  sampleMentions: unknown[];
  sentimentDistribution: Array<{ name: string; value: number }>;
  previousSentiment: number;
  windowLabel: string;
  windowShortLabel: string;
}

export function buildCanonicalMentionStats({
  sources,
  sampleMentions,
  sentimentDistribution,
  previousSentiment,
  windowLabel,
  windowShortLabel,
}: BuildArgs): CanonicalMentionStats {
  const sourceTotal = sources.reduce((sum, s) => sum + (Number(s.count) || 0), 0);
  const sampleSize = sampleMentions.length;
  const totalMentions = Math.max(sourceTotal, sampleSize);

  const distTotal = sentimentDistribution.reduce((sum, s) => sum + (Number(s.value) || 0), 0);
  const negativeRaw = sentimentDistribution.find((s) => s.name === "Negative")?.value || 0;
  const negativeFraction = distTotal > 0 ? Math.min(1, Math.max(0, negativeRaw / distTotal)) : 0;

  const negativeShare = Math.round(negativeFraction * 100);
  const currentNegative = Math.min(totalMentions, Math.round(negativeFraction * totalMentions));

  const previousNegative = Math.min(
    totalMentions,
    previousSentiment < 0
      ? Math.abs(Math.round((previousSentiment * totalMentions) / 100))
      : Math.round(currentNegative * 0.9)
  );

  // Distribute the negative volume across sources in proportion to each
  // source's share of the corpus, so the parts always add up to the whole.
  const ranked = [...sources].sort((a, b) => b.count - a.count);
  let assigned = 0;
  const negativeBySource = ranked.map((s, idx) => {
    const isLast = idx === ranked.length - 1;
    const share = sourceTotal > 0 ? s.count / sourceTotal : 0;
    const count = isLast
      ? Math.max(0, currentNegative - assigned)
      : Math.min(currentNegative - assigned, Math.round(currentNegative * share));
    assigned += count;
    return {
      source: s.name,
      count,
      percentage: currentNegative > 0 ? Math.min(100, (count / currentNegative) * 100) : 0,
    };
  });

  return {
    totalMentions,
    sampleSize,
    negativeShare,
    currentNegative,
    previousNegative,
    negativeBySource,
    windowLabel,
    windowShortLabel,
  };
}
