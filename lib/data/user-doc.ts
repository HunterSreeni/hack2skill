import { EMPTY_STREAK_STATE, type StreakState } from "@/lib/streak";

export type UserRole = "recovering" | "caregiver";

// Streak/reward state belongs only to the person in recovery - a caregiver
// profile never gets these fields written at all, not just hidden in the UI.
export type UserDoc = Partial<StreakState> & {
  role: UserRole;
  pairingCode?: string; // recovering users only
  metBuddyToday?: boolean; // recovering users only
  lastMetDate?: string | null; // recovering users only
  createdAt: number;
};

export function newUserDoc(role: UserRole): UserDoc {
  if (role === "caregiver") {
    return { role, createdAt: Date.now() };
  }
  return {
    role,
    ...EMPTY_STREAK_STATE,
    metBuddyToday: false,
    lastMetDate: null,
    createdAt: Date.now(),
  };
}
