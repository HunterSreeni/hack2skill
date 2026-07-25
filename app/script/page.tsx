"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc, addDoc, collection, query, where, getDocs } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { computeStreakUpdate, EMPTY_STREAK_STATE, type StreakState } from "@/lib/streak";
import type { UserDoc } from "@/lib/data/user-doc";
import { nextMilestone, unlockedMilestones } from "@/lib/data/rewards";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function ScriptPage() {
  const router = useRouter();
  const { user, role, loading: authLoading } = useCurrentUser();

  const [script, setScript] = useState<string | null>(null);
  const [streak, setStreak] = useState<StreakState>(EMPTY_STREAK_STATE);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [crisisMessage, setCrisisMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (role === "caregiver") {
      router.push("/caregiver");
      return;
    }

    (async () => {
      const [scriptSnap, userSnap] = await Promise.all([
        getDoc(doc(getFirebaseDb(), "scripts", user.uid)),
        getDoc(doc(getFirebaseDb(), "users", user.uid)),
      ]);
      setScript(scriptSnap.exists() ? (scriptSnap.data().script as string) : null);
      const userData = userSnap.data() as UserDoc | undefined;
      if (userData) {
        setStreak({
          currentStreak: userData.currentStreak,
          longestStreak: userData.longestStreak,
          lastCheckInDate: userData.lastCheckInDate,
          lapseHistory: userData.lapseHistory ?? [],
        });
        setPairingCode(userData.pairingCode ?? null);
      }
    })();
  }, [authLoading, user, role, router]);

  async function getLinkedCaregiverIds(recoveringUid: string): Promise<string[]> {
    const q = query(collection(getFirebaseDb(), "links"), where("recoveringUid", "==", recoveringUid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data().caregiverUid as string);
  }

  async function handleMetBuddy() {
    if (!user) return;
    await setDoc(
      doc(getFirebaseDb(), "users", user.uid),
      { metBuddyToday: true, lastMetDate: todayStr() },
      { merge: true }
    );
  }

  async function handleDailyCheckIn(isLapse: boolean) {
    if (!user) return;
    const updated = computeStreakUpdate(streak, todayStr(), isLapse);
    setStreak(updated);
    await setDoc(doc(getFirebaseDb(), "users", user.uid), updated, { merge: true });

    if (isLapse) {
      const caregiverIds = await getLinkedCaregiverIds(user.uid);
      if (caregiverIds.length > 0) {
        await addDoc(collection(getFirebaseDb(), "alerts"), {
          userId: user.uid,
          caregiverIds,
          type: "lapse",
          createdAt: Date.now(),
          acknowledged: false,
        });
      }
    }
  }

  async function handleNeedHelp() {
    if (!script || !user || loading) return;
    setLoading(true);
    setError(null);
    setCrisisMessage(null);

    try {
      const [res, caregiverIds] = await Promise.all([
        fetch("/api/crisis-response", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ script }),
        }),
        getLinkedCaregiverIds(user.uid),
      ]);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setCrisisMessage(data.message);

      if (caregiverIds.length > 0) {
        await addDoc(collection(getFirebaseDb(), "alerts"), {
          userId: user.uid,
          caregiverIds,
          type: "crisis",
          createdAt: Date.now(),
          acknowledged: false,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || !user) {
    return <div className="flex flex-1 items-center justify-center p-8 text-sm">Loading…</div>;
  }

  if (script === null) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No script found yet — let&apos;s create yours.
        </p>
        <a href="/checkin" className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background">
          Start check-in
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <main className="flex w-full max-w-md flex-col gap-6">
        <div className="flex items-center justify-between rounded-2xl border border-zinc-200 p-4 text-sm dark:border-zinc-800">
          <div>
            <p className="font-semibold">{streak.currentStreak}-day streak</p>
            <p className="text-xs text-zinc-500">Longest: {streak.longestStreak} days</p>
          </div>
          {pairingCode && (
            <div className="text-right">
              <p className="text-xs text-zinc-500">Share code with your caregiver</p>
              <p className="font-mono text-lg tracking-widest">{pairingCode}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleDailyCheckIn(false)}
            className="flex-1 rounded-full border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
          >
            I stayed clear today
          </button>
          <button
            onClick={() => handleDailyCheckIn(true)}
            className="flex-1 rounded-full border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
          >
            I used today
          </button>
        </div>

        {pairingCode && (
          <button
            onClick={handleMetBuddy}
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
          >
            Have you met your caregiver today? Mark as done
          </button>
        )}

        <h1 className="text-2xl font-semibold tracking-tight">Your script</h1>
        <p className="whitespace-pre-line rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-sm leading-6 dark:border-zinc-800 dark:bg-zinc-900">
          {script}
        </p>

        <button
          onClick={handleNeedHelp}
          disabled={loading}
          className="flex h-14 w-full items-center justify-center rounded-full bg-red-600 px-6 text-base font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "…" : "I need help right now"}
        </button>

        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        {crisisMessage && (
          <p
            role="status"
            className="whitespace-pre-line rounded-2xl border border-red-200 bg-red-50 p-5 text-sm leading-6 dark:border-red-900 dark:bg-red-950"
          >
            {crisisMessage}
          </p>
        )}

        <div className="rounded-2xl border border-zinc-200 p-4 text-sm dark:border-zinc-800">
          <p className="font-semibold">Rewards</p>
          <p className="mt-1 text-xs text-zinc-500">
            Illustrative catalog for the demo - not a live redemption system yet.
          </p>
          {nextMilestone(streak.currentStreak) && (
            <p className="mt-2">
              Next: <strong>{nextMilestone(streak.currentStreak)!.badge}</strong> at{" "}
              {nextMilestone(streak.currentStreak)!.days} days —{" "}
              {nextMilestone(streak.currentStreak)!.example}
            </p>
          )}
          {unlockedMilestones(streak.longestStreak).length > 0 && (
            <p className="mt-2 text-xs text-zinc-500">
              Unlocked: {unlockedMilestones(streak.longestStreak).map((m) => m.badge).join(", ")}
            </p>
          )}
        </div>

        <a href="/checkin" className="text-center text-xs text-zinc-500 underline">
          Redo check-in
        </a>
      </main>
    </div>
  );
}
