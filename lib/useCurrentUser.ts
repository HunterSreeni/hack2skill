"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase";
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
    const unsubDoc = onSnapshot(doc(getFirebaseDb(), "users", user.uid), (snap) => {
      const data = snap.data();
      setRole((data?.role as UserRole) ?? null);
      setLoading(false);
    });
    return unsubDoc;
  }, [user]);

  return { user, role, loading };
}
