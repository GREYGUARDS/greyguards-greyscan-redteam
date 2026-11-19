/** Live GreyScan scanning is restricted to confirmed Greyguards/GreyScan staff accounts. */
export const OPERATOR_DOMAINS = ["greyguards.com", "greyscan.com"];

export function isGreyscanOperator(
  user: { email?: string | null; email_confirmed_at?: string | null; is_anonymous?: boolean } | null | undefined,
): boolean {
  if (!user || user.is_anonymous || !user.email || !user.email_confirmed_at) return false;
  const domain = user.email.trim().toLowerCase().split("@")[1] ?? "";
  return OPERATOR_DOMAINS.includes(domain);
}

export const SCAN_WINDOWS = [
  { value: 1, label: "Past 24 hours", short: "24h" },
  { value: 7, label: "Past week", short: "7d" },
  { value: 30, label: "Past 30 days", short: "30d" },
] as const;
export const DEFAULT_SCAN_WINDOW_DAYS = 7;

export const RISK_TERMS = ["scandal", "lawsuit", "investigation", "boycott", "fake", "leak"];

/** Splits the "widen search" box into at most 8 distinct extra queries. */
export function parseExtraTerms(raw: string): string[] {
  const seen = new Set<string>();
  return raw
    .split(/[,\n]/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && t.length <= 60 && !seen.has(t.toLowerCase()) && seen.add(t.toLowerCase()))
    .slice(0, 8);
}

export function withinWindow(date: Date | string | undefined, days: number, now = Date.now()): boolean {
  const t = date ? new Date(date).getTime() : NaN;
  return Number.isFinite(t) && t >= now - days * 86400000 && t <= now + 3600000;
}

/** GDELT uses compact timestamps like 20261118T120000Z, which Date cannot parse. */
export function parseGdeltDate(v: string | undefined): Date {
  const m = typeof v === "string" ? v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/) : null;
  return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6])) : new Date(v ?? NaN);
}
