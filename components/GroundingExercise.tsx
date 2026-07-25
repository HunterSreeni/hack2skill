"use client";

import { useEffect, useState } from "react";

const PHASES = [
  { label: "Breathe in", seconds: 4 },
  { label: "Hold", seconds: 4 },
  { label: "Breathe out", seconds: 6 },
] as const;

/**
 * A calming box-breathing guide, not an alarm. Deliberate choice: a loud
 * alert sound raises panic in an already-distressed person rather than
 * lowering it (same principle as the "no flashing/agitating animation" rule
 * from the project's accessibility research). Shown alongside the crisis
 * response, not instead of it.
 */
export function GroundingExercise() {
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    const phase = PHASES[phaseIndex];
    const timer = setTimeout(() => {
      setPhaseIndex((i) => (i + 1) % PHASES.length);
    }, phase.seconds * 1000);
    return () => clearTimeout(timer);
  }, [phaseIndex]);

  const phase = PHASES[phaseIndex];
  const scale = phase.label === "Breathe in" ? "scale-100" : phase.label === "Hold" ? "scale-100" : "scale-50";

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-brand/30 bg-brand-soft p-6">
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">A few slow breaths, together</p>
      <div className="flex h-28 w-28 items-center justify-center">
        <div
          className={`h-20 w-20 rounded-full bg-brand transition-transform ease-in-out ${scale}`}
          style={{ transitionDuration: `${phase.seconds}s` }}
        />
      </div>
      <p className="text-lg font-semibold text-brand" aria-live="polite">
        {phase.label}
      </p>
    </div>
  );
}
