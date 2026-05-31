'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, Sparkles } from 'lucide-react';
import { RewardedVideo } from '@/components/ads/RewardedVideo';
import { estimateEarningUsd, getEcpmTier, type EcpmTier } from '@/lib/monetization/estimate';
import { recordDonation } from '@/lib/monetization/donations';
import type { RewardResult } from '@/hooks/useRewardedVideo';

type DonationLevel = 'malo' | 'srednje' | 'puno';

const LEVELS: Record<DonationLevel, { label: string; videos: number; seconds: number; emoji: string }> = {
  malo:    { label: 'Malo',    videos: 1, seconds: 15,  emoji: '☕' },
  srednje: { label: 'Srednje', videos: 2, seconds: 30,  emoji: '🍕' },
  puno:    { label: 'Puno',    videos: 3, seconds: 60,  emoji: '🎮' },
};

type Phase = 'pick' | 'watching' | 'done';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function DonationModal({ isOpen, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>('pick');
  const [selected, setSelected] = useState<DonationLevel | null>(null);
  const [tier, setTier] = useState<EcpmTier>('tier3');
  const [earned, setEarned] = useState(0);

  // Geo-lokacija: jednokratno, samo za procenu — ne šalje nigde
  useEffect(() => {
    if (!isOpen) return;
    fetch('https://ipapi.co/country/')
      .then(r => r.text())
      .then(cc => setTier(getEcpmTier(cc.trim())))
      .catch(() => setTier('tier3'));
  }, [isOpen]);

  function handleClose() {
    setPhase('pick');
    setSelected(null);
    setEarned(0);
    onClose();
  }

  async function handleComplete(result: RewardResult) {
    if (!result.completed || !selected) return;
    const est = estimateEarningUsd(result.videosWatched, tier);
    setEarned(est);
    try {
      await recordDonation(result.videosWatched, est);
    } catch {
      // Ne blokira UX ako increment ne uspe
    }
    setPhase('done');
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(8,11,20,0.85)' }}
          onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="w-full max-w-[440px] rounded-t-2xl px-5 pt-5 pb-8"
            style={{ background: 'var(--bg-surface, #0f1729)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            {/* Handle */}
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.1)' }} />

            {phase === 'pick' && (
              <>
                <p className="text-[14px] font-semibold text-white mb-1">Podržite razvoj</p>
                <p className="text-[11px] text-slate-500 mb-5">
                  Gledaj kratke video reklame — zarada ide direktno u razvoj igre.
                </p>

                <div className="flex flex-col gap-2.5">
                  {(Object.entries(LEVELS) as [DonationLevel, typeof LEVELS['malo']][]).map(([key, lvl]) => {
                    const est = estimateEarningUsd(lvl.videos, tier);
                    const isActive = selected === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setSelected(key)}
                        className="flex items-center justify-between px-4 py-3.5 rounded-xl text-left transition-all duration-200 cursor-pointer hover:scale-[1.02]"
                        style={{
                          background: '#161b27',
                          border: `1px solid ${isActive ? '#f59e0b' : 'rgba(255,255,255,0.06)'}`,
                          transform: isActive ? 'scale(1.02)' : undefined,
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[20px]">{lvl.emoji}</span>
                          <div>
                            <p className="text-[13px] font-medium text-white">{lvl.label}</p>
                            <p className="text-[10px] text-slate-500">
                              {lvl.videos} {lvl.videos === 1 ? 'video' : 'videa'} · ~{lvl.seconds}s
                            </p>
                          </div>
                        </div>
                        <span className="text-[13px] font-semibold" style={{ color: '#f59e0b' }}>~${est.toFixed(3)}</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  disabled={!selected}
                  onClick={() => selected && setPhase('watching')}
                  className="w-full mt-5 py-3.5 rounded-xl text-[13px] font-semibold transition-all duration-200 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                  style={{
                    background: selected ? '#f59e0b' : 'rgba(255,255,255,0.05)',
                    color: selected ? '#0f1219' : 'rgba(255,255,255,0.25)',
                    border: `1px solid ${selected ? '#f59e0b' : 'rgba(255,255,255,0.08)'}`,
                  }}
                >
                  <PlayCircle size={16} />
                  Pogledaj video
                </button>

                <button onClick={handleClose} className="w-full mt-2 py-2 text-[12px] text-slate-600 hover:text-slate-500 cursor-pointer transition-colors">
                  Možda drugi put
                </button>
              </>
            )}

            {phase === 'watching' && selected && (
              <>
                <p className="text-[14px] font-semibold text-white mb-4">
                  {LEVELS[selected].emoji} {LEVELS[selected].label} donacija
                </p>
                <RewardedVideo
                  count={LEVELS[selected].videos}
                  onComplete={handleComplete}
                  onCancel={() => setPhase('pick')}
                />
              </>
            )}

            {phase === 'done' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center gap-3 py-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.05 }}
                >
                  <Sparkles size={40} style={{ color: '#f59e0b' }} />
                </motion.div>
                <h1 className="text-[24px] font-bold text-white">Hvala ti!</h1>
                <p className="text-[14px] text-slate-500">Pomogao si razvoju GameHub-a</p>
                <div className="text-center mt-2">
                  <p className="text-[12px] text-slate-500 mb-1">Tvoj doprinos</p>
                  <p className="text-[32px] font-bold" style={{ color: '#f59e0b' }}>${earned.toFixed(3)}</p>
                </div>
                <button
                  onClick={handleClose}
                  className="mt-4 px-8 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer transition-all duration-200 hover:bg-amber-500/10 active:scale-95"
                  style={{ border: '1px solid #f59e0b', color: '#f59e0b', background: 'transparent' }}
                >
                  Zatvori
                </button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
