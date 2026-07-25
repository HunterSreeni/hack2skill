/**
 * Pure, unit-testable streak logic. No Firestore/network here - the caller
 * reads current state, calls this, and persists the result.
 *
 * Non-punitive by design (see project research doc §1a): a lapse resets the
 * *current* streak but never the longest streak or history, and the caller
 * is expected to reframe a lapse as a stage-of-change transition, not a
 * failure, per Prochaska-DiClemente (most lapses return to "contemplation,"
 * not to zero).
 */

export type LapseEntry = { date: string; note: string };

export type StreakState = {
  currentStreak: number;
  longestStreak: number;
  lastCheckInDate: string | null; // YYYY-MM-DD
  lapseHistory: LapseEntry[];
};

export const EMPTY_STREAK_STATE: StreakState = {
  currentStreak: 0,
  longestStreak: 0,
  lastCheckInDate: null,
  lapseHistory: [],
};

function daysBetween(a: string, b: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((Date.parse(b) - Date.parse(a)) / msPerDay);
}

/**
 * @param state current persisted streak state
 * @param today YYYY-MM-DD (injected, not Date.now(), so this stays pure/testable)
 * @param isLapse true if the user is logging a lapse today instead of a clean check-in
 * @param lapseNote optional free-text note attached to a lapse entry
 */
export function computeStreakUpdate(
  state: StreakState,
  today: string,
  isLapse: boolean,
  lapseNote = ""
): StreakState {
  if (isLapse) {
    return {
      currentStreak: 0,
      longestStreak: state.longestStreak,
      lastCheckInDate: today,
      lapseHistory: [...state.lapseHistory, { date: today, note: lapseNote }],
    };
  }

  if (state.lastCheckInDate === today) {
    // Already checked in today - idempotent, no double-count.
    return state;
  }

  const isConsecutive =
    state.lastCheckInDate !== null && daysBetween(state.lastCheckInDate, today) === 1;

  const currentStreak = isConsecutive ? state.currentStreak + 1 : 1;
  const longestStreak = Math.max(state.longestStreak, currentStreak);

  return {
    currentStreak,
    longestStreak,
    lastCheckInDate: today,
    lapseHistory: state.lapseHistory,
  };
}

export function generatePairingCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I ambiguity
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export function isValidPairingCode(code: string): boolean {
  return /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(code);
}
