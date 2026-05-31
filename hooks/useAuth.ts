'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { UserProfile } from '@/types/auth';

interface UseAuthReturn {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  isGuest: boolean;
  isLoggedIn: boolean;
  isPremium: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      unsubscribeProfile?.();
      unsubscribeProfile = undefined;

      setUser(firebaseUser);

      if (!firebaseUser || firebaseUser.isAnonymous) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const profileRef = doc(db, 'users', firebaseUser.uid);
      unsubscribeProfile = onSnapshot(
        profileRef,
        (snap) => {
          setProfile(snap.exists() ? (snap.data() as UserProfile) : null);
          setLoading(false);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProfile?.();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      const e = err as { code?: string; message?: string };
      console.log('[AUTH DIAG] google →', e.code, '|', e.message);
      setError(err instanceof Error ? err.message : 'Prijava nije uspela');
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      await firebaseSignOut(auth);
      setProfile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Odjava nije uspela');
    }
  }, []);

  const isPremium =
    profile?.premiumUntil != null &&
    profile.premiumUntil.toDate() > new Date();

  const isLoggedIn = user !== null && !user.isAnonymous;
  const isGuest = !isLoggedIn;

  return {
    user,
    profile,
    isGuest,
    isLoggedIn,
    isPremium,
    signInWithGoogle,
    signOut,
    loading,
    error,
  };
}
