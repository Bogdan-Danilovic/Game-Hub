'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AliasRoom } from '@/lib/types/alias';
import { advanceToExplaining } from '@/lib/firestore/alias';
import { hexA } from '@/lib/utils';

interface Props {
  room: AliasRoom;
  playerId: string;
}

const TEAM_COLORS = {
  a: { label: 'Tim A', accent: '#0891b2', accent2: '#06b6d4' },
  b: { label: 'Tim B', accent: '#f59e0b', accent2: '#fbbf24' },
};

export function RoundStartScreen({ room, playerId }: Props) {
  const [countdown, setCountdown] = useState(3);

  const team = room.currentTeam;
  const colors = TEAM_COLORS[team];
  const teamPlayerIds = room.teams[team];
  const explainerIndex = room.currentExplainerIndex[team];
  const explainerId = teamPlayerIds[explainerIndex];
  const explainer = room.players.find((p) => p.id === explainerId);
  const isExplainer = playerId === explainerId;

  useEffect(() => {
    if (countdown <= 0) {
      if (isExplainer) advanceToExplaining(room.code);
      return;
    }
    const t = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, room.code, isExplainer]);

  return (
    <div className="relative flex flex-col items-center justify-center flex-1 px-8 h-screen-safe overflow-hidden">
      {/* Ambient orb */}
      <div
        className="pointer-events-none fixed rounded-full"
        style={{
          width: 400, height: 400,
          top: '10%', left: '50%', transform: 'translateX(-50%)',
          background: `radial-gradient(circle, ${hexA(colors.accent, 0.10)}, transparent 70%)`,
          filter: 'blur(60px)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-[340px] flex flex-col items-center gap-8 text-center"
      >
        {/* Team + round card */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="w-full rounded-2xl border border-white/10 bg-white/[0.05] p-6"
          style={{ backdropFilter: 'blur(12px)' }}
        >
          <p className="text-[10px] text-white/30 tracking-[0.25em] uppercase mb-2">Runda {room.round}</p>
          <h2
            className="text-[36px] font-extrabold tracking-[-0.5px]"
            style={{ color: colors.accent2, textShadow: `0 0 30px ${hexA(colors.accent, 0.5)}` }}
          >
            {colors.label}
          </h2>

          <div className="mt-5 pt-4 border-t border-white/[0.07] flex flex-col items-center gap-1">
            <p className="text-[10px] text-white/30 tracking-[0.2em] uppercase">Objašnjava</p>
            <p className="text-[22px] font-bold text-white">
              {isExplainer ? 'Ti!' : (explainer?.name ?? '...')}
            </p>
            {isExplainer && (
              <p className="text-[11px] text-white/40 mt-1">Pripremi se za objašnjavanje</p>
            )}
          </div>
        </motion.div>

        {/* Score preview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-6"
        >
          <div className="text-center">
            <p
              className="text-[28px] font-bold tabular-nums leading-none"
              style={{ color: '#06b6d4', textShadow: `0 0 20px ${hexA('#0891b2', 0.5)}` }}
            >
              {room.scores.a}
            </p>
            <p className="text-[8px] text-white/30 uppercase tracking-wider mt-1">Tim A</p>
          </div>
          <div className="text-[24px] text-white/15 font-light">:</div>
          <div className="text-center">
            <p
              className="text-[28px] font-bold tabular-nums leading-none"
              style={{ color: '#fbbf24', textShadow: `0 0 20px ${hexA('#f59e0b', 0.5)}` }}
            >
              {room.scores.b}
            </p>
            <p className="text-[8px] text-white/30 uppercase tracking-wider mt-1">Tim B</p>
          </div>
        </motion.div>

        {/* Countdown */}
        <AnimatePresence mode="wait">
          {countdown > 0 && (
            <motion.span
              key={countdown}
              initial={{ scale: 3, opacity: 0, filter: 'blur(8px)' }}
              animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
              exit={{ scale: 0.3, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="text-[80px] font-bold leading-none tabular-nums mt-4"
              style={{ color: colors.accent2, textShadow: `0 0 30px ${hexA(colors.accent, 0.6)}` }}
            >
              {countdown}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
