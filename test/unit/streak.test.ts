import { describe, it, expect } from "vitest";
import {
  computeStreakUpdate,
  EMPTY_STREAK_STATE,
  generatePairingCode,
  isValidPairingCode,
} from "@/lib/streak";

describe("computeStreakUpdate", () => {
  it("starts a streak at 1 on the first check-in", () => {
    const result = computeStreakUpdate(EMPTY_STREAK_STATE, "2026-07-25", false);
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
    expect(result.lastCheckInDate).toBe("2026-07-25");
  });

  it("increments on a consecutive day", () => {
    const day1 = computeStreakUpdate(EMPTY_STREAK_STATE, "2026-07-25", false);
    const day2 = computeStreakUpdate(day1, "2026-07-26", false);
    expect(day2.currentStreak).toBe(2);
    expect(day2.longestStreak).toBe(2);
  });

  it("is idempotent for a repeated check-in on the same day", () => {
    const day1 = computeStreakUpdate(EMPTY_STREAK_STATE, "2026-07-25", false);
    const sameDay = computeStreakUpdate(day1, "2026-07-25", false);
    expect(sameDay).toEqual(day1);
  });

  it("restarts current streak at 1 after a gap, but preserves longestStreak", () => {
    let state = EMPTY_STREAK_STATE;
    state = computeStreakUpdate(state, "2026-07-20", false);
    state = computeStreakUpdate(state, "2026-07-21", false);
    state = computeStreakUpdate(state, "2026-07-22", false); // streak of 3
    expect(state.currentStreak).toBe(3);

    // gap of several days
    state = computeStreakUpdate(state, "2026-07-28", false);
    expect(state.currentStreak).toBe(1);
    expect(state.longestStreak).toBe(3); // preserved, not wiped
  });

  it("a lapse resets currentStreak to 0 but never touches longestStreak or history", () => {
    let state = EMPTY_STREAK_STATE;
    state = computeStreakUpdate(state, "2026-07-20", false);
    state = computeStreakUpdate(state, "2026-07-21", false);
    state = computeStreakUpdate(state, "2026-07-22", false); // streak of 3

    const afterLapse = computeStreakUpdate(state, "2026-07-23", true, "stressful day at work");
    expect(afterLapse.currentStreak).toBe(0);
    expect(afterLapse.longestStreak).toBe(3);
    expect(afterLapse.lapseHistory).toHaveLength(1);
    expect(afterLapse.lapseHistory[0]).toEqual({
      date: "2026-07-23",
      note: "stressful day at work",
    });
  });

  it("a lapse does not delete prior lapse history (non-punitive, preserved record)", () => {
    let state = EMPTY_STREAK_STATE;
    state = computeStreakUpdate(state, "2026-07-01", true, "first lapse");
    state = computeStreakUpdate(state, "2026-07-10", false);
    state = computeStreakUpdate(state, "2026-07-15", true, "second lapse");
    expect(state.lapseHistory).toHaveLength(2);
  });

  it("can recover and set a new longestStreak after a lapse", () => {
    let state = EMPTY_STREAK_STATE;
    state = computeStreakUpdate(state, "2026-07-01", false);
    state = computeStreakUpdate(state, "2026-07-02", false); // streak 2
    state = computeStreakUpdate(state, "2026-07-03", true); // lapse, longest=2
    state = computeStreakUpdate(state, "2026-07-04", false);
    state = computeStreakUpdate(state, "2026-07-05", false);
    state = computeStreakUpdate(state, "2026-07-06", false); // streak 3
    expect(state.currentStreak).toBe(3);
    expect(state.longestStreak).toBe(3);
  });
});

describe("pairing codes", () => {
  it("generates a 6-character code from the unambiguous alphabet", () => {
    const code = generatePairingCode();
    expect(code).toHaveLength(6);
    expect(isValidPairingCode(code)).toBe(true);
  });

  it("rejects codes with ambiguous characters (0, O, 1, I) or wrong length", () => {
    expect(isValidPairingCode("ABC12O")).toBe(false); // contains O
    expect(isValidPairingCode("ABC1I0")).toBe(false); // contains I and 0
    expect(isValidPairingCode("ABCDE")).toBe(false); // too short
    expect(isValidPairingCode("ABCDEFG")).toBe(false); // too long
    expect(isValidPairingCode("abcdef")).toBe(false); // lowercase not in alphabet
  });

  it("generates codes that vary across calls (not a constant)", () => {
    const codes = new Set(Array.from({ length: 20 }, () => generatePairingCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});
