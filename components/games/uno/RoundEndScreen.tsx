'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { UnoRoom } from '@/lib/types/uno';
import { Button } from '@/components/shared/Button';
import { nextRound } from '@/lib/firestore/uno';
import { hexA } from '@/lib/utils';

interface Props {
  room: UnoRoom;
  playerId: string;
}

const ACCENT = '#f97316';

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

export function RoundEndScreen({ room, playerId }: Props) {
  const [loading, setLoading] = useState(false);
  const isHost = room.hostId === playerId;

  const sorted = [...room.players].sort((a, b) => b.totalScore - a.totalScore);
  const winner = sorted[0];

  async function handleNext() {
    setLoading(true);
    await nextRound(room.code);
    setLoading(false);
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="mx-auto flex w-full max-w-[400px] flex-col gap-6 px-5 pb-14 pt-20">
        {/* Round winner */}
        <motion.div
          {...fadeIn(0.1)}
          className="rounded-3xl p-6 text-center"
          style={{
            background: `linear-gradient(160deg, ${hexA(ACCENT, 0.28)} 0%, rgba(0,0,0,0.85) 100%)`,
            border: `1px solid ${hexA(ACCENT, 0.25)}`,
            boxShadow: `0 20px 60px ${hexA(ACCENT, 0.25)}`,
          }}
        >
          <div className="text-5xl mb-3">🃏</div>
          <div className="text-[22px] font-extrabold text-white mb-1">Runda {room.roundNumber} završena!</div>
          <div className="text-sm text-white/60 mb-3">
            {room.lastEvent ?? 'Runda je završena.'}
          </div>
          <div className="text-[13px] font-semibold" style={{ color: ACCENT }}>
            Cilj: {room.settings.targetScore} bodova
          </div>
        </motion.div>

        {/* Scoreboard */}
        <motion.div {...fadeIn(0.2)} className="flex flex-col gap-2">
          <div className="text-lg font-extrabold text-white mb-1">Rezultati</div>
          {sorted.map((p, i) => {
            const isSelf = p.id === playerId;
            const isLeader = i === 0;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.07, duration: 0.4 }}
                className="flex items-center gap-3 rounded-2xl px-4 py-3"
                style={{
                  background: isLeader
                    ? hexA(ACCENT, 0.15)
                    : 'rgba(255,255,255,0.04)',
                  border: isLeader
                    ? `1px solid ${hexA(ACCENT, 0.3)}`
                    : '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold"
                  style={{
                    background: isLeader
                      ? `linear-gradient(135deg, ${ACCENT}, ${hexA(ACCENT, 0.7)})`
                      : 'rgba(255,255,255,0.1)',
                    color: 'white',
                  }}
                >
                  {i + 1}
                </div>
                <span className="flex-1 text-[15px] font-bold text-white">
                  {isSelf ? 'Ti' : p.name}
                  {!p.isConnected && <span className="ml-1.5 text-[11px] text-red-400/70">offline</span>}
                </span>
                <div className="text-right">
                  <div className="text-[15px] font-extrabold text-white tabular-nums">{p.totalScore}</div>
                  {p.roundScore > 0 && (
                    <div className="text-[11px] font-semibold" style={{ color: ACCENT }}>
                      +{p.roundScore}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Progress to target */}
        <motion.div {...fadeIn(0.45)} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-semibold text-white/50">Napredak prema cilju ({room.settings.targetScore})</span>
          </div>
          {sorted.map((p) => (
            <div key={p.id} className="mb-2">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[12px] text-white/70 truncate max-w-[120px]">{p.id === playerId ? 'Ti' : p.name}</span>
                <span className="text-[12px] text-white/70 tabular-nums">{p.totalScore}/{room.settings.targetScore}</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.08]">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: winner.id === p.id ? `linear-gradient(90deg, ${ACCENT}, #fbbf24)` : 'rgba(255,255,255,0.2)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((p.totalScore / room.settings.targetScore) * 100, 100)}%` }}
                  transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>
          ))}
        </motion.div>

        {isHost && (
          <motion.div {...fadeIn(0.55)}>
            <Button
              fullWidth
              disabled={loading}
              onClick={handleNext}
              className="!rounded-2xl !text-white"
              style={{
                background: `linear-gradient(135deg, ${ACCENT}, ${hexA(ACCENT, 0.8)})`,
                boxShadow: `0 4px 16px ${hexA(ACCENT, 0.4)}`,
              }}
            >
              {loading ? 'Učitavanje...' : 'Sljedeća runda'}
            </Button>
          </motion.div>
        )}

        {!isHost && (
          <motion.p
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="text-center text-[12px] text-orange-100/40"
          >
            Čekamo host da pokrene sljedeću rundu...
          </motion.p>
        )}
      </div>
    </div>
  );
}
