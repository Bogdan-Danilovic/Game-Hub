'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { DrawingRoom } from '@/lib/types/drawing';
import { advanceToNextRound } from '@/lib/firestore/drawing';

const ACCENT = '#f59e0b';
const AUTO_ADVANCE_SEC = 6;

interface Props {
  room: DrawingRoom;
  playerId: string;
}

export function RoundResultsScreen({ room, playerId }: Props) {
  const [countdown, setCountdown] = useState(AUTO_ADVANCE_SEC);
  const advancedRef = useRef(false);
  const isHost = room.hostId === playerId;

  useEffect(() => {
    if (!isHost) return;
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(id);
          if (!advancedRef.current) {
            advancedRef.current = true;
            advanceToNextRound(room.code);
          }
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isHost, room.code]);

  const drawerName = room.players.find((p) => p.id === room.currentDrawer)?.name ?? 'Crtač';
  const isLastRound = room.currentRound >= room.totalRounds;

  const sortedPlayers = [...room.players].sort(
    (a, b) => (room.scores[b.id] ?? 0) - (room.scores[a.id] ?? 0)
  );

  return (
    <div className="flex flex-col flex-1 px-5 py-8 h-screen-safe overflow-y-auto">
      <div className="w-full max-w-[400px] mx-auto flex flex-col gap-6">
        {/* Round summary */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-[11px] text-white/30 tracking-[0.2em] uppercase mb-2">
            Runda {room.currentRound} od {room.totalRounds}
          </p>
          <p className="text-[14px] text-white/50 mb-1">
            <span className="text-amber-400 font-semibold">{drawerName}</span> je crtao
          </p>
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 mt-2">
            <span className="text-[22px] font-bold text-amber-400 tracking-wide">
              {room.currentWord}
            </span>
          </div>
          <p className="text-[12px] text-white/30 mt-3">
            {room.guessedPlayers.length} od{' '}
            {room.players.filter((p) => p.id !== room.currentDrawer).length} igrača pogodilo
          </p>
        </motion.div>

        {/* Scoreboard */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col gap-2"
        >
          <p className="text-[10px] text-slate-500 tracking-[0.2em] uppercase mb-1">
            Ukupni bodovi
          </p>
          {sortedPlayers.map((player, i) => {
            const score = room.scores[player.id] ?? 0;
            const isDrawer = player.id === room.currentDrawer;
            const guessed = room.guessedPlayers.includes(player.id);
            const isSelf = player.id === playerId;

            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.06 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{
                  background: isSelf ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isSelf ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)'}`,
                }}
              >
                <span className="text-[13px] font-bold text-white/30 w-5">{i + 1}</span>
                <span className="flex-1 text-[13px] font-medium text-white/80">
                  {player.name}
                  {isSelf && <span className="text-amber-400 ml-1 text-[11px]">(ti)</span>}
                  {isDrawer && <span className="text-white/30 ml-1 text-[10px]">✏️</span>}
                </span>
                {(guessed || isDrawer) && (
                  <span className="text-[10px] text-emerald-400/70">
                    {isDrawer
                      ? `+${room.guessedPlayers.length * 50}`
                      : guessed
                      ? '+bodovi'
                      : ''}
                  </span>
                )}
                <span className="text-[15px] font-bold" style={{ color: i === 0 ? ACCENT : '#94a3b8' }}>
                  {score}
                </span>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Next round / countdown */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center py-4"
        >
          {isLastRound ? (
            <p className="text-[13px] text-white/40">
              Zadnja runda završena. {isHost ? 'Učitavanje rezultata...' : 'Čekamo host...'}
            </p>
          ) : (
            <p className="text-[13px] text-white/40">
              {isHost
                ? `Sljedeća runda za ${countdown}s...`
                : 'Čekamo host da nastavi...'}
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
