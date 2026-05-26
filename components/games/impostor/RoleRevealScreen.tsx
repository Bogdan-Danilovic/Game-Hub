'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { ImpostorRoom } from '@/lib/types/impostor';
import { advanceToDiscussion, shufflePrompt } from '@/lib/firestore/impostor';
import { Button } from '@/components/ui/Button';

interface Props {
  room: ImpostorRoom;
  playerId: string;
}

export function RoleRevealScreen({ room, playerId }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [hasSeen, setHasSeen] = useState(false);
  const holdProgress = useMotionValue(0);
  const holdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isHost = room.hostId === playerId;
  const isImpostor = room.impostorIds.includes(playerId);
  const prompt = isImpostor ? room.currentPrompt.impostor : room.currentPrompt.crew;
  const role = isImpostor ? 'Impostor' : 'Crewmate';

  const barWidth = useTransform(holdProgress, [0, 1], ['0%', '100%']);
  const barColor = useTransform(holdProgress, [0, 0.5, 1],
    isImpostor
      ? ['rgba(239,68,68,0.3)', 'rgba(239,68,68,0.6)', 'rgba(239,68,68,0.9)']
      : ['rgba(139,92,246,0.3)', 'rgba(139,92,246,0.6)', 'rgba(139,92,246,0.9)']
  );

  const startHold = useCallback(() => {
    if (revealed) return;
    holdRef.current = setInterval(() => {
      const current = holdProgress.get();
      if (current >= 1) {
        if (holdRef.current) clearInterval(holdRef.current);
        setRevealed(true);
        setHasSeen(true);
        return;
      }
      holdProgress.set(current + 0.02);
    }, 16);
  }, [revealed, holdProgress]);

  const stopHold = useCallback(() => {
    if (holdRef.current) clearInterval(holdRef.current);
    if (!revealed) holdProgress.set(0);
  }, [revealed, holdProgress]);

  const dismiss = useCallback(() => {
    setRevealed(false);
    holdProgress.set(0);
  }, [holdProgress]);

  useEffect(() => {
    return () => { if (holdRef.current) clearInterval(holdRef.current); };
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center flex-1 px-8 h-screen-safe overflow-hidden">
      {/* Ambient color shift */}
      <motion.div
        className="fixed inset-0 pointer-events-none"
        animate={{
          background: revealed
            ? isImpostor
              ? 'radial-gradient(ellipse at center, rgba(239,68,68,0.06) 0%, transparent 70%)'
              : 'radial-gradient(ellipse at center, rgba(139,92,246,0.06) 0%, transparent 70%)'
            : 'none',
        }}
        transition={{ duration: 0.8 }}
      />

      <div className="relative w-full max-w-[320px] flex flex-col items-center gap-8">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[10px] text-slate-500 tracking-[0.2em] uppercase"
        >
          Runda {room.round}
        </motion.p>

        {/* Hold zone */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring' as const, stiffness: 250, damping: 22 }}
          className="w-full aspect-[3/4] max-h-[440px] relative select-none touch-none"
          onPointerDown={revealed ? dismiss : startHold}
          onPointerUp={revealed ? undefined : stopHold}
          onPointerLeave={revealed ? undefined : stopHold}
          onPointerCancel={revealed ? undefined : stopHold}
        >
          <AnimatePresence mode="wait">
            {!revealed ? (
              <motion.div
                key="locked"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-surface/30 rounded-2xl overflow-hidden"
              >
                {/* Hold progress bar — thermometer */}
                <motion.div
                  className="absolute bottom-0 left-0 right-0"
                  style={{ height: barWidth, backgroundColor: barColor as unknown as string }}
                />

                <motion.div
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  className="text-4xl mb-6 relative z-10"
                >
                  🔒
                </motion.div>
                <p className="text-[13px] text-slate-400 relative z-10">
                  Zadrži da otključaš
                </p>
                <p className="text-[11px] text-slate-600 mt-1 relative z-10">
                  svoju ulogu
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="revealed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`
                  absolute inset-0 flex flex-col items-center justify-center rounded-2xl p-8
                  ${isImpostor ? 'bg-red-950/20 glow-d' : 'bg-violet-950/15 glow-v'}
                `}
              >
                {/* Glitch flash */}
                <motion.div
                  className="absolute inset-0 bg-white/5 rounded-2xl"
                  animate={{ opacity: [0.3, 0, 0.1, 0] }}
                  transition={{ duration: 0.3 }}
                />

                <p className="text-[10px] text-slate-500 tracking-[0.2em] uppercase mb-4">
                  Ti si
                </p>

                {/* Role with glitch effect */}
                <h2
                  className={`glitch-text text-[40px] font-bold tracking-[-0.03em] mb-8 ${
                    isImpostor ? 'text-red-400 text-glow-d' : 'text-violet-400 text-glow-v'
                  }`}
                  data-text={role}
                >
                  {role}
                </h2>

                <div className="w-12 h-px bg-white/[0.06] mb-8" />

                <p className="text-[9px] text-slate-500 tracking-[0.2em] uppercase mb-2">
                  {room.gameMode === 'sentences' ? 'Tvoje pitanje' : 'Tvoj pojam'}
                </p>
                <p className="text-[15px] text-center text-slate-200 font-medium leading-relaxed max-w-[260px]">
                  {prompt}
                </p>

                {/* Tap to dismiss hint */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="absolute bottom-6 text-[10px] text-slate-600"
                >
                  tapni da sakriješ
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {hasSeen && !revealed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <p className="text-[10px] text-slate-500">
              🔒 Zapamti. Ne pravi screenshot.
            </p>
          </motion.div>
        )}

        {isHost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="w-full flex flex-col gap-2"
          >
            <Button fullWidth onClick={() => advanceToDiscussion(room.code)}>
              Svi su videli → Diskusija
            </Button>
            <Button variant="ghost" fullWidth onClick={() => shufflePrompt(room.code)}>
              Zameni pitanje
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
