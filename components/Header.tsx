"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { Button } from "@/components/Button";

export function Header() {
  const router = useRouter();
  const { user, role } = useCurrentUser();

  async function handleLogout() {
    await signOut(getFirebaseAuth());
    router.push("/");
  }

  return (
    <header className="flex w-full items-center justify-between border-b border-border px-6 py-4">
      <Link href="/" className="text-lg font-semibold tracking-tight text-brand">
        Steady
      </Link>
      {user && (
        <div className="flex items-center gap-3">
          {role && (
            <span className="hidden text-xs text-zinc-500 sm:inline">
              {role === "caregiver" ? "Caregiver" : "In recovery"}
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={handleLogout} className="no-underline">
            Log out
          </Button>
        </div>
      )}
    </header>
  );
}
