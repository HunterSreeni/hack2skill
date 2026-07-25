"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { getUserDoc } from "@/lib/db";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const cred = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      const userData = await getUserDoc(cred.user.uid);
      router.push(userData?.role === "caregiver" ? "/caregiver" : "/checkin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-5">
        <h1 className="text-2xl font-semibold tracking-tight">Log in</h1>

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

        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center rounded-full bg-foreground px-6 text-base font-medium text-background transition-colors hover:opacity-90 disabled:opacity-40"
        >
          {loading ? "Logging in…" : "Log in"}
        </button>

        <a href="/signup" className="text-center text-xs text-zinc-500 underline">
          Need an account? Sign up
        </a>
      </form>
    </div>
  );
}
