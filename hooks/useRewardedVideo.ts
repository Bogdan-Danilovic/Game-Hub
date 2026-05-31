'use client';

import { useState, useCallback, useRef } from 'react';

export type VideoState = 'idle' | 'loading' | 'playing' | 'completed' | 'no-fill' | 'error';

export type RewardResult = {
  completed: boolean;
  totalEstUsd: number;
  videosWatched: number;
};

type Options = {
  onEarned?: (estUsd: number) => void;
};

// TODO: Zameniti sa pravim Adsterra VAST SDK pozivom
async function loadAdsterraVAST(): Promise<boolean> {
  // Produkcija: window.adsterra.requestAd(vastTagUrl)
  return new Promise(resolve => setTimeout(() => resolve(true), 800));
}

async function playVASTAd(onProgress?: () => void): Promise<boolean> {
  // Produkcija: čekaj VAST impression + completion event
  return new Promise(resolve => {
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 500;
      onProgress?.();
      if (elapsed >= 1500) {
        clearInterval(interval);
        resolve(true);
      }
    }, 500);
  });
}

export function useRewardedVideo({ onEarned }: Options = {}) {
  const [state, setState] = useState<VideoState>('idle');
  const [watched, setWatched] = useState(0);
  const abortRef = useRef(false);

  const play = useCallback(
    async (count: number): Promise<RewardResult> => {
      abortRef.current = false;
      let videosWatched = 0;
      let totalEst = 0;

      for (let i = 0; i < count; i++) {
        if (abortRef.current) break;

        setState('loading');
        const hasFill = await loadAdsterraVAST();

        if (!hasFill) {
          setState('no-fill');
          return { completed: false, totalEstUsd: totalEst, videosWatched };
        }

        setState('playing');
        const ok = await playVASTAd();

        if (!ok) {
          setState('error');
          return { completed: false, totalEstUsd: totalEst, videosWatched };
        }

        videosWatched++;
        setWatched(v => v + 1);
        // TODO: eCPM po geo-lokaciji (lib/monetization/estimate.ts)
        const estUsd = 0.005;
        totalEst += estUsd;
        onEarned?.(estUsd);
      }

      setState('completed');
      return { completed: true, totalEstUsd: totalEst, videosWatched };
    },
    [onEarned],
  );

  const reset = useCallback(() => {
    abortRef.current = true;
    setState('idle');
    setWatched(0);
  }, []);

  return { state, watched, play, reset };
}
