'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  linkWithPopup,
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

      if (!firebaseUser) {
        // No session yet → establish a guest identity so every visitor has a
        // stable uid for stats/presence/friends, without loosening Firestore rules.
        setUser(null);
        setProfile(null);
        signInAnonymously(auth).catch((err) => {
          // Requires the Anonymous provider to be enabled in the Firebase console.
          // If not enabled, guests stay signed-out and guest features degrade gracefully.
          setError(err instanceof Error ? err.message : 'Guest sign-in failed');
          setLoading(false);
        });
        return;
      }

      setUser(firebaseUser);

      // Load the profile for BOTH guest (anonymous) and logged-in users.
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
      const current = auth.currentUser;
      // Upgrade a guest account in place so its stats/friends survive the sign-in.
      if (current?.isAnonymous) {
        try {
          await linkWithPopup(current, provider);
          return;
        } catch (linkErr) {
          const code = (linkErr as { code?: string }).code;
          // Google account already exists → fall through to a normal sign-in.
          if (code !== 'auth/credential-already-in-use' && code !== 'auth/email-already-in-use') {
            throw linkErr;
          }
        }
      }
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
