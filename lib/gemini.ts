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
