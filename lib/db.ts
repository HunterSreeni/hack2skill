"use client";

/**
 * Firestore data-access layer. UI components call these typed functions
 * instead of constructing raw doc()/collection()/query() calls inline -
 * keeps Firestore paths and shapes in one place instead of scattered
 * across every page component.
 */

import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import type { StreakState } from "@/lib/streak";
import type { UserDoc } from "@/lib/data/user-doc";

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getUserDoc(uid: string): Promise<UserDoc | undefined> {
  const snap = await getDoc(doc(getFirebaseDb(), "users", uid));
  return snap.data() as UserDoc | undefined;
}

export async function updateUserDoc(uid: string, data: Partial<UserDoc>): Promise<void> {
  await setDoc(doc(getFirebaseDb(), "users", uid), data, { merge: true });
}

export function watchUserDoc(uid: string, onChange: (data: UserDoc | undefined) => void): Unsubscribe {
  return onSnapshot(doc(getFirebaseDb(), "users", uid), (snap) => {
    onChange(snap.data() as UserDoc | undefined);
  });
}

export async function getScriptDoc(uid: string): Promise<string | null> {
  const snap = await getDoc(doc(getFirebaseDb(), "scripts", uid));
  return snap.exists() ? ((snap.data().script as string) ?? null) : null;
}

export async function saveScriptDoc(
  uid: string,
  data: { script: string; substance: string; band: string }
): Promise<void> {
  await setDoc(doc(getFirebaseDb(), "scripts", uid), { ...data, updatedAt: Date.now() });
}

export async function createPairingCode(uid: string, code: string): Promise<void> {
  await setDoc(doc(getFirebaseDb(), "pairingCodes", code), { uid });
}

export async function lookupPairingCode(code: string): Promise<string | null> {
  const snap = await getDoc(doc(getFirebaseDb(), "pairingCodes", code));
  return snap.exists() ? (snap.data().uid as string) : null;
}

export async function createLink(recoveringUid: string, caregiverUid: string): Promise<void> {
  await setDoc(doc(getFirebaseDb(), "links", `${recoveringUid}_${caregiverUid}`), {
    recoveringUid,
    caregiverUid,
    createdAt: Date.now(),
  });
}

export async function getLinkedCaregiverIds(recoveringUid: string): Promise<string[]> {
  const q = query(collection(getFirebaseDb(), "links"), where("recoveringUid", "==", recoveringUid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data().caregiverUid as string);
}

/** Live (not one-time) list of recovering-user uids linked to this caregiver. */
export function watchLinkedRecoveringUids(
  caregiverUid: string,
  onChange: (uids: string[]) => void
): Unsubscribe {
  const q = query(collection(getFirebaseDb(), "links"), where("caregiverUid", "==", caregiverUid));
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => d.data().recoveringUid as string));
  });
}

export type AlertDoc = {
  id: string;
  userId: string;
  type: "crisis" | "lapse";
  createdAt: number;
  acknowledged: boolean;
};

export function watchCaregiverAlerts(
  caregiverUid: string,
  orderByFn: typeof import("firebase/firestore").orderBy,
  onChange: (alerts: AlertDoc[]) => void
): Unsubscribe {
  const q = query(
    collection(getFirebaseDb(), "alerts"),
    where("caregiverIds", "array-contains", caregiverUid),
    orderByFn("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AlertDoc, "id">) })));
  });
}

export async function createAlert(
  userId: string,
  caregiverIds: string[],
  type: "crisis" | "lapse"
): Promise<void> {
  if (caregiverIds.length === 0) return;
  await addDoc(collection(getFirebaseDb(), "alerts"), {
    userId,
    caregiverIds,
    type,
    createdAt: Date.now(),
    acknowledged: false,
  });
}

export type StreakSnapshot = Pick<UserDoc, "currentStreak" | "longestStreak" | "metBuddyToday">;

/** Live per-user streak status - replaces one-time getDoc snapshots so the
 * caregiver dashboard reflects changes without a refresh. */
export function watchStreakStatus(uid: string, onChange: (status: StreakSnapshot) => void): Unsubscribe {
  return watchUserDoc(uid, (data) => {
    onChange({
      currentStreak: data?.currentStreak ?? 0,
      longestStreak: data?.longestStreak ?? 0,
      metBuddyToday: data?.metBuddyToday ?? false,
    });
  });
}

export function streakStateFromUserDoc(data: UserDoc | undefined): StreakState {
  return {
    currentStreak: data?.currentStreak ?? 0,
    longestStreak: data?.longestStreak ?? 0,
    lastCheckInDate: data?.lastCheckInDate ?? null,
    lapseHistory: data?.lapseHistory ?? [],
  };
}
