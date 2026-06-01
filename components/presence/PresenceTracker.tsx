'use client';

import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { touchLastSeen } from '@/lib/firestore/players';

const HEARTBEAT_MS = 60_000;

/**
 * Invisible app-wide presence tracker. While a player (guest or logged-in) has a
 * profile, it refreshes `users/{uid}.lastSeen` immediately, every 60s, and on
 * tab re-focus. Depends only on `uid` + whether a profile exists — never on the
 * profile object identity — so our own `lastSeen` write does not retrigger it.
 */
export function PresenceTracker() {
  const { user, profile } = useAuth();
  const uid = user?.uid;
  const hasProfile = profile !== null;

  useEffect(() => {
    if (!uid || !hasProfile) return;

    void touchLastSeen(uid);
    const id = setInterval(() => void touchLastSeen(uid), HEARTBEAT_MS);
    const onVisible = (): void => {
      if (document.visibilityState === 'visible') void touchLastSeen(uid);
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [uid, hasProfile]);

  return null;
}
