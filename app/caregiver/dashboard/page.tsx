"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { orderBy } from "firebase/firestore";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { isValidPairingCode } from "@/lib/streak";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import {
  lookupPairingCode,
  createLink,
  watchLinkedRecoveringUids,
  watchStreakStatus,
  watchCaregiverAlerts,
  type StreakSnapshot,
  type AlertDoc,
} from "@/lib/db";

type LinkedUser = { uid: string } & StreakSnapshot;

export default function CaregiverDashboardPage() {
  const router = useRouter();
  const { user, role, loading: authLoading } = useCurrentUser();

  const [code, setCode] = useState("");
  const [pairError, setPairError] = useState<string | null>(null);
  const [pairing, setPairing] = useState(false);

  const [linkedUsers, setLinkedUsers] = useState<Record<string, LinkedUser>>({});
  const [alerts, setAlerts] = useState<AlertDoc[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/caregiver");
      return;
    }
    if (role === "recovering") {
      router.push("/user/home");
    }
  }, [authLoading, user, role, router]);

  // Live: which recovering users are linked to this caregiver, then a live
  // streak-status listener per user - genuinely real-time, not a one-time
  // snapshot re-fetched only when the link list itself changes.
  useEffect(() => {
    if (!user) return;
    const userUnsubs = new Map<string, () => void>();

    const unsubLinks = watchLinkedRecoveringUids(user.uid, (uids) => {
      for (const [uid, unsub] of userUnsubs) {
        if (!uids.includes(uid)) {
          unsub();
          userUnsubs.delete(uid);
          setLinkedUsers((prev) => {
            const next = { ...prev };
            delete next[uid];
            return next;
          });
        }
      }
      for (const uid of uids) {
        if (userUnsubs.has(uid)) continue;
        userUnsubs.set(
          uid,
          watchStreakStatus(uid, (status) => {
            setLinkedUsers((prev) => ({ ...prev, [uid]: { uid, ...status } }));
          })
        );
      }
    });

    return () => {
      unsubLinks();
      for (const unsub of userUnsubs.values()) unsub();
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    return watchCaregiverAlerts(user.uid, orderBy, setAlerts);
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
      const recoveringUid = await lookupPairingCode(upperCode);
      if (!recoveringUid) {
        throw new Error("No one found with that code.");
      }
      await createLink(recoveringUid, user.uid);
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
            <Button type="submit" size="md" disabled={pairing || code.length !== 6} className="!rounded-lg">
              {pairing ? "…" : "Link"}
            </Button>
          </div>
          {pairError && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {pairError}
            </p>
          )}
        </form>

        <div className="flex flex-col gap-3">
          {Object.keys(linkedUsers).length === 0 && (
            <p className="text-sm text-zinc-500">No one linked yet.</p>
          )}
          {Object.values(linkedUsers).map((u) => (
            <Card key={u.uid} className="text-sm">
              <p className="font-semibold text-brand">{u.currentStreak}-day streak</p>
              <p className="text-xs text-zinc-500">Longest: {u.longestStreak} days</p>
              <p className="text-xs text-zinc-500">
                {u.metBuddyToday ? "Checked in with you today" : "Hasn't checked in with you today"}
              </p>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
