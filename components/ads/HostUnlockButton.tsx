'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RewardedVideo } from '@/components/ads/RewardedVideo';
import { grantPremium } from '@/app/actions/grantPremium';
import type { RewardResult } from '@/hooks/useRewardedVideo';

type Props = {
  roomCode: string;
};

export function HostUnlockButton({ roomCode }: Props) {
  const [phase, setPhase] = useState<'idle' | 'watching' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleComplete(result: RewardResult) {
    if (!result.completed) return;

    const res = await grantPremium(roomCode);
    if (res.ok) {
      setPhase('success');
    } else {
      setErrorMsg(res.error ?? 'Greška');
      setPhase('error');
    }
  }

  if (phase === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 text-[12px] text-emerald-400 py-3"
      >
        <span>✓</span>
        <span>Premium aktivan — 24h bez reklama</span>
      </motion.div>
    );
  }

  if (phase === 'watching') {
    return (
      <RewardedVideo
        count={1}
        label="Pogledaj 1 video → 24h premium"
        onComplete={handleComplete}
        onCancel={() => setPhase('idle')}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => setPhase('watching')}
        className="w-full py-3 rounded-xl text-[12px] font-medium text-violet-300 transition-all duration-200 active:scale-95 cursor-pointer"
        style={{
          background: 'rgba(124,58,237,0.08)',
          border: '1px solid rgba(139,92,246,0.2)',
        }}
      >
        Otključaj premium (24h) — pogledaj kratak video
      </button>

      <AnimatePresence>
        {phase === 'error' && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-[11px] text-red-400 text-center"
          >
            {errorMsg}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
