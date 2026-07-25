"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { computeStreakUpdate, EMPTY_STREAK_STATE, type StreakState } from "@/lib/streak";
import { nextMilestone, unlockedMilestones } from "@/lib/data/rewards";
import { speak, stopSpeaking, isVoiceOutputSupported, useDistressListener } from "@/lib/voice";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { GroundingExercise } from "@/components/GroundingExercise";
import {
  getScriptDoc,
  getUserDoc,
  updateUserDoc,
  getLinkedCaregiverIds,
  createAlert,
  streakStateFromUserDoc,
  todayStr,
} from "@/lib/db";

export default function UserHomePage() {
  const router = useRouter();
  const { user, role, loading: authLoading } = useCurrentUser();

  const [script, setScript] = useState<string | null>(null);
  const [streak, setStreak] = useState<StreakState>(EMPTY_STREAK_STATE);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [crisisMessage, setCrisisMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [pendingCountdown, setPendingCountdown] = useState<number | null>(null);

  const distressListener = useDistressListener(() => setPendingCountdown(3));

  useEffect(() => {
    if (pendingCountdown === null) return;
    const timer = setTimeout(() => {
      if (pendingCountdown <= 0) {
        setPendingCountdown(null);
        handleNeedHelp();
      } else {
        setPendingCountdown((c) => (c ?? 1) - 1);
      }
    }, 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCountdown]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/user");
      return;
    }
    if (role === "caregiver") {
      router.push("/caregiver/dashboard");
      return;
    }

    (async () => {
      const [scriptText, userData] = await Promise.all([getScriptDoc(user.uid), getUserDoc(user.uid)]);
      setScript(scriptText);
      if (userData) {
        setStreak(streakStateFromUserDoc(userData));
        setPairingCode(userData.pairingCode ?? null);
      }
    })();
  }, [authLoading, user, role, router]);

  useEffect(() => () => stopSpeaking(), []);

  function handleListen() {
    if (!script) return;
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    speak(script, () => setSpeaking(false));
    setSpeaking(true);
  }

  async function handleMetBuddy() {
    if (!user) return;
    await updateUserDoc(user.uid, { metBuddyToday: true, lastMetDate: todayStr() });
  }

  async function handleDailyCheckIn(isLapse: boolean) {
    if (!user) return;
    const updated = computeStreakUpdate(streak, todayStr(), isLapse);
    setStreak(updated);
    await updateUserDoc(user.uid, updated);

    if (isLapse) {
      const caregiverIds = await getLinkedCaregiverIds(user.uid);
      await createAlert(user.uid, caregiverIds, "lapse");
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
      speak(data.message, () => setSpeaking(false)); // read the crisis response aloud - highest cognitive load moment, hearing beats reading
      setSpeaking(true);
      await createAlert(user.uid, caregiverIds, "crisis");
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
          No script found yet - let&apos;s create yours.
        </p>
        <a href="/user/checkin" className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background">
          Start check-in
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <main className="flex w-full max-w-md flex-col gap-6">
        <Card className="flex items-center justify-between">
          <div>
            <p className="font-semibold">{streak.currentStreak}-day streak</p>
            <p className="text-xs text-zinc-500">Longest: {streak.longestStreak} days</p>
          </div>
          {pairingCode && (
            <div className="text-right">
              <p className="text-xs text-zinc-500">Share code with your caregiver</p>
              <p className="font-mono text-lg tracking-widest text-brand">{pairingCode}</p>
            </div>
          )}
        </Card>

        <div className="flex gap-2">
          <Button variant="secondary" size="md" onClick={() => handleDailyCheckIn(false)} className="flex-1">
            I stayed clear today
          </Button>
          <Button variant="secondary" size="md" onClick={() => handleDailyCheckIn(true)} className="flex-1">
            I used today
          </Button>
        </div>

        {pairingCode && (
          <Button variant="secondary" size="md" onClick={handleMetBuddy}>
            Have you met your caregiver today? Mark as done
          </Button>
        )}

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Your script</h1>
          {isVoiceOutputSupported() && (
            <Button variant="secondary" size="sm" onClick={handleListen}>
              {speaking ? "Stop" : "Listen"}
            </Button>
          )}
        </div>
        <Card className="whitespace-pre-line bg-brand-soft text-sm leading-6">{script}</Card>

        <Button variant="danger" size="lg" onClick={handleNeedHelp} disabled={loading} className="w-full">
          {loading ? "…" : "I need help right now"}
        </Button>

        {distressListener.supported && (
          <Button
            variant="secondary"
            size="sm"
            onClick={distressListener.toggle}
            aria-pressed={distressListener.enabled}
          >
            {distressListener.enabled ? "Listening for distress phrases - tap to stop" : "Listen for distress phrases"}
          </Button>
        )}
        {distressListener.error && (
          <p className="text-xs text-red-600 dark:text-red-400">{distressListener.error}</p>
        )}

        {pendingCountdown !== null && (
          <div
            role="alert"
            className="flex items-center justify-between rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-950"
          >
            <span>Heard something concerning - getting support in {pendingCountdown}s.</span>
            <Button variant="secondary" size="sm" onClick={() => setPendingCountdown(null)}>
              Cancel
            </Button>
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        {crisisMessage && (
          <>
            <GroundingExercise />
            <p
              role="status"
              className="whitespace-pre-line rounded-2xl border border-red-200 bg-red-50 p-5 text-sm leading-6 dark:border-red-900 dark:bg-red-950"
            >
              {crisisMessage}
            </p>
          </>
        )}

        <div className="rounded-2xl border border-zinc-200 p-4 text-sm dark:border-zinc-800">
          <p className="font-semibold">Rewards</p>
          <p className="mt-1 text-xs text-zinc-500">
            Illustrative catalog for the demo - not a live redemption system yet.
          </p>
          {nextMilestone(streak.currentStreak) && (
            <p className="mt-2">
              Next: <strong>{nextMilestone(streak.currentStreak)!.badge}</strong> at{" "}
              {nextMilestone(streak.currentStreak)!.days} days -{" "}
              {nextMilestone(streak.currentStreak)!.example}
            </p>
          )}
          {unlockedMilestones(streak.longestStreak).length > 0 && (
            <p className="mt-2 text-xs text-zinc-500">
              Unlocked: {unlockedMilestones(streak.longestStreak).map((m) => m.badge).join(", ")}
            </p>
          )}
        </div>

        <a href="/user/checkin" className="text-center text-xs text-zinc-500 underline">
          Redo check-in
        </a>
      </main>
    </div>
  );
}
