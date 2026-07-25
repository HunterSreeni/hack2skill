"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { updateUserDoc, createPairingCode } from "@/lib/db";
import { newUserDoc, type UserRole } from "@/lib/data/user-doc";
import { generatePairingCode } from "@/lib/streak";

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("recovering");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const cred = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
      await updateUserDoc(cred.user.uid, newUserDoc(role));

      if (role === "recovering") {
        const code = generatePairingCode();
        await createPairingCode(cred.user.uid, code);
        await updateUserDoc(cred.user.uid, { pairingCode: code });
        router.push("/checkin");
      } else {
        router.push("/caregiver");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-5">
        <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">I am...</legend>
          <div className="flex gap-2" role="radiogroup">
            <button
              type="button"
              role="radio"
              aria-checked={role === "recovering"}
              onClick={() => setRole("recovering")}
              className={`flex-1 rounded-full border px-3 py-2 text-sm ${
                role === "recovering"
                  ? "border-foreground bg-foreground text-background"
                  : "border-zinc-300 dark:border-zinc-700"
              }`}
            >
              In recovery
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={role === "caregiver"}
              onClick={() => setRole("caregiver")}
              className={`flex-1 rounded-full border px-3 py-2 text-sm ${
                role === "caregiver"
                  ? "border-foreground bg-foreground text-background"
                  : "border-zinc-300 dark:border-zinc-700"
              }`}
            >
              A caregiver
            </button>
          </div>
        </fieldset>

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
            minLength={6}
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
          {loading ? "Creating…" : "Create account"}
        </button>

        <a href="/login" className="text-center text-xs text-zinc-500 underline">
          Already have an account? Log in
        </a>
      </form>
    </div>
  );
}
