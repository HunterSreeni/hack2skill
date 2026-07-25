/**
 * Simplified check-in questions adapted from the WHO ASSIST (Alcohol, Smoking
 * and Substance Involvement Screening Test) v3.0 - the validated instrument
 * used by NDDTC-AIIMS and India's national substance-use surveys.
 *
 * Step 1 scope: 3 of ASSIST's real involvement questions (frequency of use,
 * problems caused, concern expressed by others) instead of the full 8-item
 * per-substance instrument. The main challenge should implement ASSIST's
 * complete official scoring algorithm; this file uses a simplified linear
 * scoring band clearly separated from the official one (see scoreCheckIn).
 */

export const SUBSTANCES = [
  "Alcohol",
  "Cannabis (bhang/ganja/charas)",
  "Opioids",
  "Sedatives",
  "Other",
] as const;

export type Substance = (typeof SUBSTANCES)[number];

export const FREQUENCY_OPTIONS = [
  { label: "Never", value: 0 },
  { label: "Once or twice", value: 1 },
  { label: "Monthly", value: 2 },
  { label: "Weekly", value: 3 },
  { label: "Daily or almost daily", value: 4 },
] as const;

export const ASSIST_LITE_QUESTIONS = [
  {
    id: "frequency",
    text: "In the past 3 months, how often have you used this substance?",
  },
  {
    id: "problems",
    text: "In the past 3 months, how often has your use led to health, social, legal, or financial problems?",
  },
  {
    id: "concern",
    text: "In the past 3 months, how often has a friend, relative, or anyone else expressed concern about your use?",
  },
] as const;

export type CheckInAnswers = {
  substance: Substance;
  frequency: number;
  problems: number;
  concern: number;
  triggerNote: string;
};

export type RiskBand = "low" | "moderate" | "high";

/**
 * Simplified, Step-1-only scoring: sum of the 3 items (max 12), banded.
 * NOT the official ASSIST algorithm (which uses non-linear per-item weights
 * and substance-specific cutoffs) - flagged for main-challenge replacement.
 */
export function scoreCheckIn(answers: Pick<CheckInAnswers, "frequency" | "problems" | "concern">): {
  score: number;
  band: RiskBand;
} {
  const score = answers.frequency + answers.problems + answers.concern;
  const band: RiskBand = score >= 8 ? "high" : score >= 3 ? "moderate" : "low";
  return { score, band };
}
