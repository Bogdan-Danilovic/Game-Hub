'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { GarticRoom } from '@/lib/types/gartic';
import { advanceStep } from '@/lib/firestore/gartic';
import { hexA } from '@/lib/utils';

const ACCENT = '#ec4899';

const stepLabel = (room: GarticRoom) => {
  if (room.status === 'drawing') return 'Crtanje';
  return room.currentStep === 0 ? 'Pisanje' : 'Opisivanje';
};

interface Props { room: GarticRoom; playerId: string; }

export function WaitingScreen({ room, playerId }: Props) {
  const isHost = room.hostId === playerId;
  const advancedRef = useRef(false);
  const readyCount = room.readyPlayers.length;
  const totalCount = room.players.filter((p) => p.isConnected).length;
  const allReady = readyCount >= totalCount;

  useEffect(() => {
    if (!isHost || !allReady || advancedRef.current) return;
    advancedRef.current = true;
    advanceStep(room.code);
  }, [isHost, allReady, room.code]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-5">

      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
        className="text-[56px]">
        📞
      </motion.div>

      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-pink-200/50">
          {stepLabel(room)} · Korak {room.currentStep + 1}/{room.totalSteps}
        </p>
        <h2 className="mt-2 text-[22px] font-extrabold tracking-[-0.3px] text-white">Poslano!</h2>
        <p className="mt-1 text-sm text-white/40">Čekamo ostale igrače...</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-6 py-5 w-full max-w-[320px]">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-pink-200/50">
          Čeka se <span style={{ color: ACCENT }}>{readyCount}</span>/{totalCount}
        </p>
        <div className="flex flex-col gap-2">
          {room.players.filter((p) => p.isConnected).map((p) => {
            const done = room.readyPlayers.includes(p.id);
            return (
              <motion.div key={p.id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 rounded-xl px-4 py-2.5"
                style={{ background: done ? hexA(ACCENT, 0.08) : 'rgba(255,255,255,0.03)' }}>
                <span className="text-[13px] flex-1 font-medium text-white/70">{p.name}</span>
                {done
                  ? <span className="text-emerald-400 text-sm">✓</span>
                  : <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }}
                      className="text-[11px] text-white/20">piše...</motion.span>
                }
              </motion.div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
