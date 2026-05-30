'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Flip7Room } from '@/lib/types/flip7';
import { Button } from '@/components/ui/Button';
import { nextRound } from '@/lib/firestore/flip7';

interface Props {
  room: Flip7Room;
  playerId: string;
}

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
    <div className="relative flex flex-col flex-1 px-6 pt-20 pb-10 h-screen-safe overflow-y-auto">
      <div className="relative w-full max-w-[380px] mx-auto flex flex-col gap-6 flex-1">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <p className="text-[10px] text-amber-200/40 tracking-[0.2em] uppercase">Kraj runde {room.roundNumber}</p>
          <h2 className="text-[26px] font-bold text-amber-400 mt-1" style={{ textShadow: '0 0 22px rgba(245,158,11,0.35)' }}>
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
                  border: `1px solid ${isLeader ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.06)'}`,
                  background: isLeader
                    ? 'linear-gradient(145deg, rgba(245,158,11,0.12), rgba(245,158,11,0.02))'
                    : 'rgba(255,255,255,0.025)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[13px] font-bold text-amber-200/40 tabular-nums w-4">{i + 1}</span>
                    <span className="text-[14px] font-semibold text-amber-50 truncate">{p.name}</span>
                    {p.id === playerId && <span className="text-[9px] text-amber-400/70 uppercase">ti</span>}
                    {isFlip7 && <span className="text-[11px]">✨</span>}
                    {isBusted && <span className="text-[11px]">💥</span>}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-[13px] font-semibold tabular-nums ${isBusted ? 'text-red-400/70' : 'text-amber-400'}`}>
                      {isBusted ? '+0' : `+${p.roundScore}`}
                    </span>
                    <span className="text-[17px] font-bold text-amber-100 tabular-nums w-11 text-right">{p.totalScore}</span>
                  </div>
                </div>
                <div className="mt-2 w-full h-1 rounded-full bg-white/[0.05] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-amber-500/70"
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
              className="!bg-amber-500 !text-[#0a1626] hover:!bg-amber-400 active:!bg-amber-600"
            >
              {advancing ? 'Učitavanje...' : 'Sledeća runda'}
            </Button>
          ) : (
            <motion.p
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="text-[12px] text-amber-100/40 text-center py-3"
            >
              Čekamo da host nastavi…
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
}
