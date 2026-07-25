"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, type User } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { signInWithGoogle, resetPassword } from "@/lib/auth-actions";
import { getUserDoc, updateUserDoc, createPairingCode } from "@/lib/db";
import { newUserDoc } from "@/lib/data/user-doc";
import { generatePairingCode } from "@/lib/streak";
import { Button } from "@/components/Button";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  async function routeAfterAuth(user: User) {
    const userData = await getUserDoc(user.uid);

    if (!userData) {
      // First time this account has signed in (e.g. brand-new Google
      // sign-in that skipped the signup form's role picker). Default to
      // the primary persona rather than leaving them stuck with no profile.
      await updateUserDoc(user.uid, newUserDoc("recovering"));
      const code = generatePairingCode();
      await createPairingCode(user.uid, code);
      await updateUserDoc(user.uid, { pairingCode: code });
      router.push("/checkin");
      return;
    }

    router.push(userData.role === "caregiver" ? "/caregiver" : "/checkin");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      await routeAfterAuth(cred.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setLoading(true);
    setError(null);
    try {
      const cred = await signInWithGoogle();
      await routeAfterAuth(cred.user);
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
        <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>

        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={handleGoogleLogin}
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
              className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-700"
            />
          </label>

          <button
            type="button"
            onClick={handleForgotPassword}
            className="self-start text-xs text-zinc-500 underline"
          >
            Forgot password?
          </button>

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
            {loading ? "Logging in…" : "Log in"}
          </Button>
        </form>

        <a href="/signup" className="text-center text-xs text-zinc-500 underline">
          Need an account? Sign up
        </a>
      </div>
    </div>
  );
}
