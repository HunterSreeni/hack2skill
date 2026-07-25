import { EMPTY_STREAK_STATE, type StreakState } from "@/lib/streak";

export type UserRole = "recovering" | "caregiver";

export type UserDoc = StreakState & {
  role: UserRole;
  pairingCode?: string; // recovering users only
  metBuddyToday: boolean;
  lastMetDate: string | null;
  createdAt: number;
};

export function newUserDoc(role: UserRole): UserDoc {
  return {
    role,
    ...EMPTY_STREAK_STATE,
    metBuddyToday: false,
    lastMetDate: null,
    createdAt: Date.now(),
  };
}
