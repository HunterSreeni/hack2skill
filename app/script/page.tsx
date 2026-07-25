"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ScriptPage() {
  const [script, setScript] = useState<string | null>(null);
  const [crisisMessage, setCrisisMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setScript(window.localStorage.getItem("steady-script"));
  }, []);

  async function handleNeedHelp() {
    if (!script || loading) return;
    setLoading(true);
    setError(null);
    setCrisisMessage(null);

    try {
      const res = await fetch("/api/crisis-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong.");
      }
      setCrisisMessage(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (script === null) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No script found yet — let&apos;s create yours.
        </p>
        <Link
          href="/checkin"
          className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background"
        >
          Start check-in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <main className="flex w-full max-w-md flex-col gap-6">
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

        <Link
          href="/checkin"
          className="text-center text-xs text-zinc-500 underline dark:text-zinc-500"
        >
          Redo check-in
        </Link>
      </main>
    </div>
  );
}
