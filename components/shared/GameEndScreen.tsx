'use client';

import { motion } from 'framer-motion';
import { BasePlayer } from '@/lib/types/core';
import { PlayerAvatar } from './PlayerAvatar';

interface Props {
  winner: string | null;
  players: BasePlayer[];
  onPlayAgain: () => void;
  accentColor?: string;
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 20 } },
};

const PLAYER_COLORS = [
  'rgba(139,92,246,0.8)',
  'rgba(16,185,129,0.8)',
  'rgba(245,158,11,0.8)',
  'rgba(59,130,246,0.8)',
  'rgba(239,68,68,0.8)',
  'rgba(236,72,153,0.8)',
];

export function GameEndScreen({ winner, players, onPlayAgain, accentColor = '#a78bfa' }: Props) {
  return (
    <div className="relative flex flex-col items-center justify-center flex-1 px-8 py-10 h-screen overflow-y-auto"
      style={{ background: 'var(--bg-base)' }}>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="w-full max-w-[340px] flex flex-col gap-6"
      >
        {/* Result */}
        <motion.div variants={fadeUp} className="text-center">
          <motion.p
            className="text-5xl mb-4"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ delay: 0.3, duration: 0.5, ease: 'easeOut' }}
          >
            {winner ? '🎉' : '⚠️'}
          </motion.p>
          <h2 className="text-[28px] font-bold text-white tracking-[-0.03em] leading-tight">
            {winner ?? 'Igra završena'}
          </h2>
        </motion.div>

        {/* Player list */}
        <motion.div variants={fadeUp}>
          <p className="text-[9px] text-slate-500 tracking-[0.25em] uppercase mb-4">Igrači</p>
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.05, delayChildren: 0.4 } } }}
            className="flex flex-col gap-0.5"
          >
            {players.map((p, i) => (
              <motion.div
                key={p.id}
                variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
                className="flex items-center gap-3 py-2.5 px-1"
              >
                <PlayerAvatar
                  name={p.name}
                  color={PLAYER_COLORS[i % PLAYER_COLORS.length]}
                  size="sm"
                />
                <span className="text-[13px] text-slate-300 font-medium">{p.name}</span>
                {!p.isConnected && (
                  <span className="ml-auto text-[10px] text-slate-600">offline</span>
                )}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Actions */}
        <motion.div variants={fadeUp} className="flex flex-col gap-2 mt-4">
          <button
            onClick={onPlayAgain}
            className="w-full py-3.5 rounded-2xl font-bold text-[15px] text-white transition-opacity active:opacity-80 cursor-pointer"
            style={{ background: `linear-gradient(135deg, ${accentColor}cc, ${accentColor})` }}
          >
            Igraj ponovo
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
