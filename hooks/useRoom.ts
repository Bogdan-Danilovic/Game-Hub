'use client';

import { useEffect, useState } from 'react';
import { BaseRoom } from '@/lib/types/core';
import { subscribeToRoom } from '@/lib/firestore/core';

export function useRoom<T extends BaseRoom = BaseRoom>(code: string) {
  const [room, setRoom] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prevCode, setPrevCode] = useState(code);

  // Reset state when navigating to a different room (adjust-during-render,
  // see react.dev "You Might Not Need an Effect")
  if (prevCode !== code) {
    setPrevCode(code);
    setRoom(null);
    setLoading(true);
    setError(null);
  }

  useEffect(() => {
    const unsubscribe = subscribeToRoom<T>(
      code,
      (data) => {
        setRoom(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [code]);

  return { room, loading, error };
}
