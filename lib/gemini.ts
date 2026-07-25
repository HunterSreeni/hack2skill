import { GoogleGenAI } from "@google/genai";

// Server-side only. Never import this file from a "use client" component.
let client: GoogleGenAI | null = null;

/**
 * Lazy singleton so a missing GEMINI_API_KEY only throws when a request
 * actually needs Gemini, not at module import time (which would otherwise
 * break `next build`, since Next imports route handler modules to build
 * the route manifest even when the handler never runs during the build).
 */
export function getAI(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY is not set. Add it to .env.local (see .env.example)."
      );
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

export const GEMINI_MODEL = "gemini-2.5-flash";

/**
 * Shared generation config for every call in the app.
 *
 * `thinkingBudget: 0` disables gemini-2.5-flash's default reasoning pass.
 * Both prompts produce a short, well-specified piece of supportive prose from
 * fully structured input - there is no multi-step reasoning to do, so the
 * thinking tokens were pure cost and latency on the one flow that must feel
 * instant (the crisis button).
 *
 * `maxOutputTokens` caps spend even if the model ignores the word limits in
 * the prompts; 512 comfortably fits the 120-word script plus its closing.
 */
export const GENERATION_CONFIG = {
  temperature: 0.7,
  maxOutputTokens: 512,
  thinkingConfig: { thinkingBudget: 0 },
} as const;
