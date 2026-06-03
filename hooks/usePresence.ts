'use client';

import { useEffect } from 'react';

export function usePresence(
  code: string,
  playerId: string | null | undefined,
  onDisconnect: (code: string, playerId: string) => Promise<void>,
  onReconnect: (code: string, playerId: string) => Promise<void>
) {
  useEffect(() => {
    if (!playerId) return;
    const pid = playerId;

    onReconnect(code, pid);

    const handleVisibility = () => {
      if (document.hidden) {
        onDisconnect(code, pid);
      } else {
        onReconnect(code, pid);
      }
    };
    const handleOnline = () => onReconnect(code, pid);
    const handleBeforeUnload = () => onDisconnect(code, pid);

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('online', handleOnline);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      onDisconnect(code, pid);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, playerId]);
}
