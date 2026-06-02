'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { BasePlayer } from '@/lib/types/core';
import { PlayerAvatar } from './PlayerAvatar';

interface Props {
  players: BasePlayer[];
  selfId?: string;
  hostId?: string;
  accentColor?: string;
  canKick?: boolean;
  onKick?: (playerId: string) => void;
}

const PLAYER_COLORS = [
  'rgba(139,92,246,0.8)',
  'rgba(16,185,129,0.8)',
  'rgba(245,158,11,0.8)',
  'rgba(59,130,246,0.8)',
  'rgba(239,68,68,0.8)',
  'rgba(236,72,153,0.8)',
  'rgba(20,184,166,0.8)',
  'rgba(168,85,247,0.8)',
];

function playerColor(_id: string, index: number): string {
  return PLAYER_COLORS[index % PLAYER_COLORS.length];
}

export function LobbyPlayerList({ players, selfId, hostId, accentColor = 'rgba(139,92,246,0.8)', canKick, onKick }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      <AnimatePresence mode="popLayout">
        {players.map((p, i) => {
          const isSelf = p.id === selfId;
          const isHost = p.id === hostId;
          const color = isSelf ? accentColor : playerColor(p.id, i);

          return (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: p.isConnected ? 1 : 0.35, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative flex flex-col items-center gap-2 p-3 rounded-2xl"
              style={{
                background: isSelf
                  ? 'linear-gradient(145deg, rgba(139,92,246,0.18), rgba(139,92,246,0.06))'
                  : 'linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                border: `1px solid ${isSelf ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.07)'}`,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            >
              <PlayerAvatar name={p.name} color={color} size="md" />

              <span
                className="text-[11px] font-semibold truncate w-full text-center leading-tight"
                style={{ color: isSelf ? '#c4b5fd' : '#cbd5e1' }}
              >
                {p.name}
              </span>

              {isHost && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                  host
                </span>
              )}
              {isSelf && !isHost && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>
                  ti
                </span>
              )}

              {canKick && !isSelf && onKick && (
                <button
                  onClick={() => onKick(p.id)}
                  className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full cursor-pointer"
                  style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}
                >
                  <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                    <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
