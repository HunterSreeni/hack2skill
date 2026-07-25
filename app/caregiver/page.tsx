"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { isValidPairingCode } from "@/lib/streak";
import type { UserDoc } from "@/lib/data/user-doc";

type LinkedUser = { uid: string } & Pick<
  UserDoc,
  "currentStreak" | "longestStreak" | "metBuddyToday"
>;

type Alert = {
  id: string;
  userId: string;
  type: "crisis" | "lapse";
  createdAt: number;
  acknowledged: boolean;
};

export default function CaregiverPage() {
  const router = useRouter();
  const { user, role, loading: authLoading } = useCurrentUser();

  const [code, setCode] = useState("");
  const [pairError, setPairError] = useState<string | null>(null);
  const [pairing, setPairing] = useState(false);

  const [linkedUsers, setLinkedUsers] = useState<LinkedUser[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (role === "recovering") {
      router.push("/script");
    }
  }, [authLoading, user, role, router]);

  // Real-time: linked recovering users' streak status.
  useEffect(() => {
    if (!user) return;
    const q = query(collection(getFirebaseDb(), "links"), where("caregiverUid", "==", user.uid));
    const unsub = onSnapshot(q, async (snap) => {
      const users = await Promise.all(
        snap.docs.map(async (d) => {
          const recoveringUid = d.data().recoveringUid as string;
          const userSnap = await getDoc(doc(getFirebaseDb(), "users", recoveringUid));
          const data = userSnap.data();
          return {
            uid: recoveringUid,
            currentStreak: data?.currentStreak ?? 0,
            longestStreak: data?.longestStreak ?? 0,
            metBuddyToday: data?.metBuddyToday ?? false,
          };
        })
      );
      setLinkedUsers(users);
    });
    return unsub;
  }, [user]);

  // Real-time: unacknowledged alerts for this caregiver.
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(getFirebaseDb(), "alerts"),
      where("caregiverIds", "array-contains", user.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setAlerts(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Alert, "id">) }))
      );
    });
    return unsub;
  }, [user]);

  async function handlePair(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setPairing(true);
    setPairError(null);

    try {
      const upperCode = code.toUpperCase();
      if (!isValidPairingCode(upperCode)) {
        throw new Error("That code doesn't look right - check and try again.");
      }
      const codeSnap = await getDoc(doc(getFirebaseDb(), "pairingCodes", upperCode));
      if (!codeSnap.exists()) {
        throw new Error("No one found with that code.");
      }
      const recoveringUid = codeSnap.data().uid as string;
      await setDoc(doc(getFirebaseDb(), "links", `${recoveringUid}_${user.uid}`), {
        recoveringUid,
        caregiverUid: user.uid,
        createdAt: Date.now(),
      });
      setCode("");
    } catch (err) {
      setPairError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPairing(false);
    }
  }

  if (authLoading || !user) {
    return <div className="flex flex-1 items-center justify-center p-8 text-sm">Loading…</div>;
  }

  const unacknowledged = alerts.filter((a) => !a.acknowledged);

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <main className="flex w-full max-w-md flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">Your people</h1>

        {unacknowledged.map((alert) => (
          <div
            key={alert.id}
            role="alert"
            className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm dark:border-red-800 dark:bg-red-950"
          >
            <p className="font-semibold text-red-700 dark:text-red-300">
              {alert.type === "crisis" ? "Crisis moment right now" : "Logged a lapse"}
            </p>
            <p className="mt-1 text-red-600 dark:text-red-400">
              Someone you support {alert.type === "crisis" ? "just hit \"I need help right now\"" : "just logged a lapse"}.
              Consider reaching out.
            </p>
          </div>
        ))}

        <form onSubmit={handlePair} className="flex flex-col gap-2">
          <label htmlFor="pairCode" className="text-sm font-medium">
            Enter their share code
          </label>
          <div className="flex gap-2">
            <input
              id="pairCode"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              className="flex-1 rounded-lg border border-zinc-300 bg-transparent px-3 py-2 font-mono uppercase tracking-widest dark:border-zinc-700"
              placeholder="ABCDEF"
            />
            <button
              type="submit"
              disabled={pairing || code.length !== 6}
              className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-40"
            >
              {pairing ? "…" : "Link"}
            </button>
          </div>
          {pairError && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {pairError}
            </p>
          )}
        </form>

        <div className="flex flex-col gap-3">
          {linkedUsers.length === 0 && (
            <p className="text-sm text-zinc-500">No one linked yet.</p>
          )}
          {linkedUsers.map((u) => (
            <div
              key={u.uid}
              className="rounded-2xl border border-zinc-200 p-4 text-sm dark:border-zinc-800"
            >
              <p className="font-semibold">{u.currentStreak}-day streak</p>
              <p className="text-xs text-zinc-500">Longest: {u.longestStreak} days</p>
              <p className="text-xs text-zinc-500">
                {u.metBuddyToday ? "Checked in with you today" : "Hasn't checked in with you today"}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
