'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Flip7Room } from '@/lib/types/flip7';
import { Button } from '@/components/ui/Button';
import { nextRound } from '@/lib/firestore/flip7';
import { hexA } from '@/lib/utils';

interface Props {
  room: Flip7Room;
  playerId: string;
}

const ACCENT = '#f59e0b'; // Flip 7 amber identity

export function RoundEndScreen({ room, playerId }: Props) {
  const isHost = room.hostId === playerId;
  const [advancing, setAdvancing] = useState(false);
  const target = room.settings.targetScore;
  const ranked = [...room.players].sort((a, b) => b.totalScore - a.totalScore);
  const leader = ranked[0]?.totalScore ?? 0;

  async function handleNext() {
    setAdvancing(true);
    await nextRound(room.code);
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto no-scrollbar">
      <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col gap-6 px-5 pb-12 pt-20">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-200/50">Kraj runde {room.roundNumber}</p>
          <h2 className="mt-1 text-[28px] font-extrabold tracking-[-0.5px] text-amber-400" style={{ textShadow: '0 0 22px rgba(245,158,11,0.35)' }}>
            Rezultati
          </h2>
        </motion.div>

        <div className="flex flex-col gap-2">
          {ranked.map((p, i) => {
            const isLeader = p.totalScore === leader && leader > 0;
            const isFlip7 = p.status === 'flip7';
            const isBusted = p.status === 'busted';
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}
                className="rounded-2xl p-3.5"
                style={{
                  border: `1px solid ${isLeader ? hexA(ACCENT, 0.4) : 'rgba(255,255,255,0.08)'}`,
                  background: isLeader
                    ? `linear-gradient(145deg, ${hexA(ACCENT, 0.14)}, ${hexA(ACCENT, 0.02)})`
                    : 'rgba(255,255,255,0.04)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="w-4 text-[13px] font-bold tabular-nums text-amber-200/40">{i + 1}</span>
                    <span className="truncate text-[14px] font-semibold text-amber-50">{p.name}</span>
                    {p.id === playerId && <span className="text-[9px] uppercase text-amber-400/70">ti</span>}
                    {isFlip7 && <span className="text-[11px]">✨</span>}
                    {isBusted && <span className="text-[11px]">💥</span>}
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-3">
                    <span className={`text-[13px] font-semibold tabular-nums ${isBusted ? 'text-red-400/70' : 'text-amber-400'}`}>
                      {isBusted ? '+0' : `+${p.roundScore}`}
                    </span>
                    <span className="w-11 text-right text-[17px] font-bold tabular-nums text-amber-100">{p.totalScore}</span>
                  </div>
                </div>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/[0.05]">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${hexA(ACCENT, 0.6)}, ${ACCENT})` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((p.totalScore / target) * 100, 100)}%` }}
                    transition={{ delay: 0.3 + i * 0.06, type: 'spring', stiffness: 120, damping: 20 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-auto pt-4">
          {isHost ? (
            <Button
              fullWidth
              disabled={advancing}
              onClick={handleNext}
              className="!rounded-2xl !text-white"
              style={{
                background: `linear-gradient(135deg, ${ACCENT}, ${hexA(ACCENT, 0.8)})`,
                boxShadow: `0 4px 16px ${hexA(ACCENT, 0.4)}`,
              }}
            >
              {advancing ? 'Učitavanje...' : 'Sledeća runda'}
            </Button>
          ) : (
            <motion.p
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="py-3 text-center text-[12px] text-amber-100/40"
            >
              Čekamo da host nastavi…
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
}
