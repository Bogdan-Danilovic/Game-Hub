'use client';

import { useEffect, useState } from 'react';

export function useGameTimer(
  roundStartedAt: number,
  roundDuration: number
): { secondsLeft: number; progress: number } {
  // Drzimo "sat" u state-u, a preostalo vreme racunamo tokom rendera —
  // tako nema setState poziva sinhrono u efektu.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!roundStartedAt) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [roundStartedAt]);

  const totalSeconds = roundDuration / 1000;
  // elapsed klampujemo na 0 jer `now` moze biti stariji od starta runde
  const elapsed = roundStartedAt ? Math.max(0, (now - roundStartedAt) / 1000) : 0;
  const secondsLeft = roundStartedAt
    ? Math.ceil(Math.max(0, totalSeconds - elapsed))
    : totalSeconds;

  const progress = secondsLeft / totalSeconds;
  return { secondsLeft, progress };
}
