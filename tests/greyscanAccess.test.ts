import { describe, it, expect } from "bun:test";
import { parseGdeltDate, isGreyscanOperator, DEFAULT_SCAN_WINDOW_DAYS, withinWindow, parseExtraTerms } from "../src/lib/greyscanAccess";

const c = "2026-01-01T00:00:00Z";
describe("GreyScan access", () => {
  it("allows confirmed greyguards.com and greyscan.com", () => {
    expect(isGreyscanOperator({ email: "grant@greyguards.com", email_confirmed_at: c })).toBe(true);
    expect(isGreyscanOperator({ email: "a@GreyScan.com", email_confirmed_at: c })).toBe(true);
  });
  it("blocks other domains, unconfirmed and guests", () => {
    expect(isGreyscanOperator({ email: "x@bursonglobal.com", email_confirmed_at: c })).toBe(false);
    expect(isGreyscanOperator({ email: "grant@greyguards.com", email_confirmed_at: null })).toBe(false);
    expect(isGreyscanOperator({ email: "x@greyguards.com.evil.io", email_confirmed_at: c })).toBe(false);
    expect(isGreyscanOperator({ is_anonymous: true })).toBe(false);
  });
  it("defaults to one week", () => expect(DEFAULT_SCAN_WINDOW_DAYS).toBe(7));
  it("24h window excludes 2-day-old story", () => {
    const now = Date.now();
    expect(withinWindow(new Date(now - 2 * 86400000), 1, now)).toBe(false);
    expect(withinWindow(new Date(now - 2 * 86400000), 7, now)).toBe(true);
  });
  it("caps extra terms at 8", () => expect(parseExtraTerms("a1,b2,c3,d4,e5,f6,g7,h8,i9").length).toBe(8));
  it("parses GDELT dates", () => expect(parseGdeltDate("20261118T120000Z").toISOString()).toBe("2026-11-18T12:00:00.000Z"));
});
