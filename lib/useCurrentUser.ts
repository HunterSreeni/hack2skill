"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { watchUserDoc } from "@/lib/db";
import type { UserRole } from "@/lib/data/user-doc";

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(getFirebaseAuth(), (u) => {
      setUser(u);
      if (!u) {
        setRole(null);
        setLoading(false);
      }
    });
    return unsubAuth;
  }, []);

  useEffect(() => {
    if (!user) return;
    return watchUserDoc(user.uid, (data) => {
      setRole((data?.role as UserRole) ?? null);
      setLoading(false);
    });
  }, [user]);

  return { user, role, loading };
}
