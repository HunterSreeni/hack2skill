import { describe, it, expect } from "vitest";
import { scoreCheckIn } from "@/lib/data/assist-lite";

describe("scoreCheckIn", () => {
  it("bands an all-Never check-in as low risk", () => {
    const { score, band } = scoreCheckIn({ frequency: 0, problems: 0, concern: 0 });
    expect(score).toBe(0);
    expect(band).toBe("low");
  });

  it("bands a moderate combination correctly", () => {
    const { score, band } = scoreCheckIn({ frequency: 2, problems: 1, concern: 1 });
    expect(score).toBe(4);
    expect(band).toBe("moderate");
  });

  it("bands a high-frequency, high-problem combination as high risk", () => {
    const { score, band } = scoreCheckIn({ frequency: 4, problems: 3, concern: 3 });
    expect(score).toBe(10);
    expect(band).toBe("high");
  });

  it("is monotonic: a strictly higher-answered check-in never scores lower", () => {
    const lower = scoreCheckIn({ frequency: 1, problems: 1, concern: 1 });
    const higher = scoreCheckIn({ frequency: 2, problems: 2, concern: 2 });
    expect(higher.score).toBeGreaterThan(lower.score);
  });
});
