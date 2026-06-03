'use client';

import { useEffect, useState } from 'react';

export function useGameTimer(
  roundStartedAt: number,
  roundDuration: number
): { secondsLeft: number; progress: number } {
  const [secondsLeft, setSecondsLeft] = useState(roundDuration / 1000);

  useEffect(() => {
    if (!roundStartedAt) {
      setSecondsLeft(roundDuration / 1000);
      return;
    }

    function tick() {
      const elapsed = (Date.now() - roundStartedAt) / 1000;
      const remaining = Math.max(0, roundDuration / 1000 - elapsed);
      setSecondsLeft(Math.ceil(remaining));
    }

    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [roundStartedAt, roundDuration]);

  const progress = secondsLeft / (roundDuration / 1000);
  return { secondsLeft, progress };
}
