import { describe, it, expect } from "vitest";
import { scoreAdversarial } from "../src/lib/adversarialScore";

const red = (id: string, sent = true) => ({ id, created_by: "red_team", is_sent: sent });

describe("scoreAdversarial", () => {
  it("starts level before Red fires anything", () => {
    expect(scoreAdversarial([], [])).toMatchObject({ blue: 50, red: 50, fired: 0 });
  });
  it("gives Red the full point for an unanswered inject", () => {
    expect(scoreAdversarial([red("a")], [])).toMatchObject({ blue: 0, red: 100, unanswered: 1 });
  });
  it("uses Blue's best response and ignores unsent or host injects", () => {
    const s = scoreAdversarial([red("a"), red("b"), red("c", false), { id: "h", created_by: "host", is_sent: true }],
      [{ inject_id: "a", effectiveness: 40 }, { inject_id: "a", effectiveness: 80 }, { inject_id: "b", effectiveness: 60 }, { inject_id: "h", effectiveness: 100 }]);
    expect(s).toMatchObject({ blue: 70, red: 30, fired: 2, countered: 1, unanswered: 0 });
  });
});
