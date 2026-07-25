"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { useCurrentUser } from "@/lib/useCurrentUser";
import {
  SUBSTANCES,
  FREQUENCY_OPTIONS,
  ASSIST_LITE_QUESTIONS,
  type Substance,
} from "@/lib/data/assist-lite";

const ANSWER_KEYS = ["frequency", "problems", "concern"] as const;

export default function CheckInPage() {
  const router = useRouter();
  const { user, role, loading: authLoading } = useCurrentUser();
  const [substance, setSubstance] = useState<Substance>(SUBSTANCES[0]);
  const [answers, setAnswers] = useState<Record<(typeof ANSWER_KEYS)[number], number | null>>({
    frequency: null,
    problems: null,
    concern: null,
  });
  const [triggerNote, setTriggerNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allAnswered = ANSWER_KEYS.every((key) => answers[key] !== null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (role === "caregiver") {
      router.push("/caregiver");
    }
  }, [authLoading, user, role, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allAnswered || loading || !user) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          substance,
          frequency: answers.frequency,
          problems: answers.problems,
          concern: answers.concern,
          triggerNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong.");
      }

      await setDoc(doc(getFirebaseDb(), "scripts", user.uid), {
        script: data.script,
        substance,
        band: data.band,
        updatedAt: Date.now(),
      });
      router.push("/script");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Quick check-in</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            A few honest questions, adapted from the WHO ASSIST screening
            tool. Takes about a minute.
          </p>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">What are you checking in about?</legend>
          <select
            value={substance}
            onChange={(e) => setSubstance(e.target.value as Substance)}
            className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
            aria-label="Substance"
          >
            {SUBSTANCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </fieldset>

        {ASSIST_LITE_QUESTIONS.map((q, i) => {
          const key = ANSWER_KEYS[i];
          return (
            <fieldset key={q.id} className="flex flex-col gap-2">
              <legend className="text-sm font-medium">{q.text}</legend>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={q.text}>
                {FREQUENCY_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    role="radio"
                    aria-checked={answers[key] === opt.value}
                    onClick={() => setAnswers((a) => ({ ...a, [key]: opt.value }))}
                    className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                      answers[key] === opt.value
                        ? "border-foreground bg-foreground text-background"
                        : "border-zinc-300 dark:border-zinc-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </fieldset>
          );
        })}

        <fieldset className="flex flex-col gap-2">
          <label htmlFor="triggerNote" className="text-sm font-medium">
            In your own words: what&apos;s your biggest trigger, and why do you
            want to stay clear of it? (optional, but this is what makes your
            script personal)
          </label>
          <textarea
            id="triggerNote"
            value={triggerNote}
            onChange={(e) => setTriggerNote(e.target.value)}
            maxLength={500}
            rows={4}
            className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700"
            placeholder="e.g. Friday evenings after work, alone — I want to be present for my daughter's exams next month."
          />
        </fieldset>

        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!allAnswered || loading}
          className="flex h-12 w-full items-center justify-center rounded-full bg-foreground px-6 text-base font-medium text-background transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Writing your script…" : "Generate my script"}
        </button>
      </form>
    </div>
  );
}
