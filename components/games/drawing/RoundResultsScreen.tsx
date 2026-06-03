'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { DrawingRoom } from '@/lib/types/drawing';
import { advanceToNextRound } from '@/lib/firestore/drawing';
import { hexA } from '@/lib/utils';

const ACCENT = '#f59e0b';
const AUTO_ADVANCE = 6;

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

interface Props { room: DrawingRoom; playerId: string; }

export function RoundResultsScreen({ room, playerId }: Props) {
  const [countdown, setCountdown] = useState(AUTO_ADVANCE);
  const advancedRef = useRef(false);
  const isHost = room.hostId === playerId;
  const isLastRound = room.currentRound >= room.totalRounds;
  const drawerName = room.players.find((p) => p.id === room.currentDrawer)?.name ?? 'Crtač';

  useEffect(() => {
    if (!isHost) return;
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(id);
          if (!advancedRef.current) { advancedRef.current = true; advanceToNextRound(room.code); }
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isHost, room.code]);

  const sortedPlayers = [...room.players].sort(
    (a, b) => (room.scores[b.id] ?? 0) - (room.scores[a.id] ?? 0)
  );

  return (
    <div className="flex flex-1 flex-col overflow-y-auto no-scrollbar">
      <div className="mx-auto flex w-full max-w-[400px] flex-col gap-5 px-5 pb-14 pt-14">

        {/* Word reveal hero */}
        <motion.div {...fadeIn(0.05)}
          className="rounded-3xl p-6 text-center"
          style={{
            background: `linear-gradient(160deg, ${hexA(ACCENT, 0.22)} 0%, rgba(0,0,0,0.85) 100%)`,
            border: `1px solid ${hexA(ACCENT, 0.22)}`,
            boxShadow: `0 20px 60px ${hexA(ACCENT, 0.18)}`,
          }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-200/50">
            Runda {room.currentRound} od {room.totalRounds}
          </p>
          <p className="mt-2 text-sm text-white/50">
            <span className="font-bold text-amber-400">{drawerName}</span> je crtao
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-6 py-2.5">
            <span className="text-[24px] font-extrabold text-amber-400 tracking-wide">{room.currentWord}</span>
          </div>
          <p className="mt-3 text-[12px] text-white/30">
            {room.guessedPlayers.length} od{' '}
            {room.players.filter((p) => p.id !== room.currentDrawer).length} igrača pogodilo
          </p>
        </motion.div>

        {/* Scoreboard */}
        <motion.div {...fadeIn(0.15)} className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-200/50">Ukupni bodovi</p>
          <div className="flex flex-col gap-2">
            {sortedPlayers.map((player, i) => {
              const score = room.scores[player.id] ?? 0;
              const isDrawer = player.id === room.currentDrawer;
              const guessed = room.guessedPlayers.includes(player.id);
              const isSelf = player.id === playerId;

              return (
                <motion.div key={player.id}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.06 }}
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                  style={{
                    background: isSelf ? hexA(ACCENT, 0.07) : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isSelf ? hexA(ACCENT, 0.18) : 'rgba(255,255,255,0.05)'}`,
                  }}>
                  <span className="w-5 text-[13px] font-bold text-white/25">{i + 1}</span>
                  <span className="flex-1 text-[13px] font-medium text-white/80 truncate">
                    {player.name}
                    {isSelf && <span className="ml-1.5 text-[11px] text-amber-400/70">(ti)</span>}
                    {isDrawer && <span className="ml-1 text-[10px] text-white/30">✏️</span>}
                  </span>
                  {(guessed || isDrawer) && (
                    <span className="text-[11px] font-semibold text-emerald-400/70">
                      {isDrawer ? `+${room.guessedPlayers.length * 50}` : '+pts'}
                    </span>
                  )}
                  <span className="text-[16px] font-extrabold"
                    style={{ color: i === 0 ? ACCENT : 'rgba(255,255,255,0.5)' }}>
                    {score}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Next / final indicator */}
        <motion.div {...fadeIn(0.35)} className="py-2 text-center">
          {isLastRound ? (
            <p className="text-[13px] text-white/40">
              Zadnja runda završena.{' '}
              {isHost ? 'Učitavanje finalnih rezultata...' : 'Čekamo host...'}
            </p>
          ) : (
            <p className="text-[13px] text-white/40">
              {isHost ? (
                <>Sljedeća runda za <span className="font-bold text-amber-400">{countdown}s</span>...</>
              ) : 'Čekamo host da nastavi...'}
            </p>
          )}
        </motion.div>

      </div>
    </div>
  );
}
