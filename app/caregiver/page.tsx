"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { signInWithGoogle, resetPassword } from "@/lib/auth-actions";
import { getUserDoc, updateUserDoc } from "@/lib/db";
import { newUserDoc } from "@/lib/data/user-doc";
import { Button } from "@/components/Button";

/**
 * Dedicated entry point for caregivers - separate from /user so each
 * persona's path can be split into its own deployment later without
 * touching the other.
 */
export default function CaregiverAuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  async function ensureProfileAndEnter(user: User, isNewSignup: boolean) {
    if (isNewSignup) {
      await updateUserDoc(user.uid, newUserDoc("caregiver"));
    } else {
      const existing = await getUserDoc(user.uid);
      if (!existing) {
        await updateUserDoc(user.uid, newUserDoc("caregiver"));
      }
    }
    router.push("/caregiver/dashboard");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
        await ensureProfileAndEnter(cred.user, true);
      } else {
        const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
        await ensureProfileAndEnter(cred.user, false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    setError(null);
    try {
      const cred = await signInWithGoogle();
      await ensureProfileAndEnter(cred.user, false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      setError("Enter your email above first, then tap \"Forgot password\".");
      return;
    }
    setError(null);
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-sm flex-col gap-5">
        <h1 className="text-2xl font-semibold tracking-tight">
          {mode === "signup" ? "Caregiver sign up" : "Caregiver log in"}
        </h1>

        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={handleGoogle}
          disabled={loading}
          className="w-full"
        >
          Continue with Google
        </Button>

        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <div className="h-px flex-1 bg-border" />
          or use email
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <label className="flex flex-col gap-1 text-sm">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Password
            <input
              type="password"
              required
              minLength={mode === "signup" ? 6 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700"
            />
          </label>

          {mode === "login" && (
            <button
              type="button"
              onClick={handleForgotPassword}
              className="self-start text-xs text-zinc-500 underline"
            >
              Forgot password?
            </button>
          )}

          {resetSent && (
            <p role="status" className="text-sm text-brand">
              Password reset email sent, check your inbox.
            </p>
          )}

          {error && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" disabled={loading} className="w-full">
            {loading ? "…" : mode === "signup" ? "Create account" : "Log in"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "signup" ? "login" : "signup")}
          className="text-center text-xs text-zinc-500 underline"
        >
          {mode === "signup" ? "Already have an account? Log in" : "New here? Create an account"}
        </button>

        <a href="/user" className="text-center text-xs text-zinc-400 underline">
          Signing in as someone in recovery instead?
        </a>
      </div>
    </div>
  );
}
