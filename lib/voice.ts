"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Thin wrapper around the browser's native Web Speech API (SpeechRecognition
 * for voice-in, SpeechSynthesis for voice-out). Gemini remains the actual
 * reasoning engine throughout - this is purely the input/output transport
 * layer that lets a user speak instead of type/tap, and hear a response
 * instead of read it, for the "zero-typing... highest cognitive load"
 * moments the problem statement calls out.
 *
 * Not every browser supports SpeechRecognition (notably Firefox does not),
 * so every voice feature must have a working non-voice fallback - checked
 * via `supported` below, never assumed.
 */

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: unknown) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as
    | (new () => SpeechRecognitionLike)
    | null;
}

export function isVoiceInputSupported(): boolean {
  return getSpeechRecognitionCtor() !== null;
}

export function isVoiceOutputSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * @param onTranscript called directly from the recognition event with the
 * latest text, so the caller can set its own state straight from the real
 * event instead of mirroring `transcript` via a useEffect (avoids a
 * setState-in-effect cascade).
 */
export function useSpeechToText(onTranscript?: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setError("Voice input isn't supported in this browser.");
      return;
    }
    setError(null);
    setTranscript("");
    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onresult = (event: unknown) => {
      const e = event as { results: ArrayLike<{ 0: { transcript: string } }> };
      const text = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(" ");
      setTranscript(text);
      onTranscriptRef.current?.(text);
    };
    recognition.onerror = () => {
      setError("Couldn't hear that clearly - try again or type instead.");
      setListening(false);
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  return { listening, transcript, error, start, stop, supported: isVoiceInputSupported() };
}

// Deliberately multi-word phrases, not bare words like "help" alone - a
// single common word said in an unrelated sentence would false-positive
// too easily. Matched against the running transcript, case-insensitive.
export const DISTRESS_PHRASES = [
  "i need help",
  "help me now",
  "i want to use",
  "i wanna use",
  "i need to use",
  "i'm going to use",
  "i am going to use",
  "i want to relapse",
  "i can't stop",
] as const;

/** Pure, unit-testable: returns the first matching phrase, or null. */
export function matchDistressPhrase(text: string): string | null {
  const lower = text.toLowerCase();
  return DISTRESS_PHRASES.find((phrase) => lower.includes(phrase)) ?? null;
}

/**
 * Opt-in, continuous listening for distress phrases. OFF by default and
 * must be explicitly started by the user - an always-on microphone is a
 * real privacy tradeoff, not something to enable silently.
 *
 * Browsers stop `continuous` recognition after a period of silence, so
 * this auto-restarts on `onend` for as long as `enabled` stays true.
 */
export function useDistressListener(onDetected: (phrase: string) => void) {
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const enabledRef = useRef(false);
  const onDetectedRef = useRef(onDetected);
  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  const startListening = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setError("Voice input isn't supported in this browser.");
      return;
    }
    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onresult = (event: unknown) => {
      const e = event as { results: ArrayLike<{ 0: { transcript: string } }> };
      const text = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(" ");
      const match = matchDistressPhrase(text);
      if (match) {
        recognitionRef.current?.stop();
        onDetectedRef.current(match);
      }
    };
    recognition.onerror = (event: unknown) => {
      const e = event as { error?: string };
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setError("Microphone access was denied.");
        enabledRef.current = false;
        setEnabled(false);
      }
      // Other errors (e.g. "no-speech") are expected during long listening
      // sessions - onend below handles the restart.
    };
    recognition.onend = () => {
      if (enabledRef.current) recognition.start(); // keep listening
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const toggle = useCallback(() => {
    const next = !enabledRef.current;
    enabledRef.current = next;
    setEnabled(next);
    setError(null);
    if (next) {
      startListening();
    } else {
      recognitionRef.current?.stop();
    }
  }, [startListening]);

  useEffect(
    () => () => {
      enabledRef.current = false;
      recognitionRef.current?.stop();
    },
    []
  );

  return { enabled, toggle, error, supported: isVoiceInputSupported() };
}

export function speak(text: string, onEnd?: () => void): void {
  if (!isVoiceOutputSupported()) {
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel(); // don't stack multiple utterances
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  if (onEnd) utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (isVoiceOutputSupported()) window.speechSynthesis.cancel();
}
