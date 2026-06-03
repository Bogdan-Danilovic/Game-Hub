'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { DrawingRoom } from '@/lib/types/drawing';
import { playAgain } from '@/lib/firestore/drawing';
import { Button } from '@/components/ui/Button';
import { hexA } from '@/lib/utils';

const ACCENT = '#f59e0b';

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

interface Props { room: DrawingRoom; playerId: string; }

export function FinalScreen({ room, playerId }: Props) {
  const router = useRouter();
  const [restarting, setRestarting] = useState(false);
  const isHost = room.hostId === playerId;

  const sortedPlayers = [...room.players].sort(
    (a, b) => (room.scores[b.id] ?? 0) - (room.scores[a.id] ?? 0)
  );
  const winner = sortedPlayers[0];
  const isSelfWinner = winner?.id === playerId;

  async function handlePlayAgain() {
    setRestarting(true);
    await playAgain(room.code);
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto no-scrollbar">
      <div className="mx-auto flex w-full max-w-[400px] flex-col gap-6 px-5 pb-14 pt-14">

        {/* Winner hero */}
        <motion.div {...fadeIn(0.05)}
          className="rounded-3xl p-6 text-center"
          style={{
            background: `linear-gradient(160deg, ${hexA(ACCENT, 0.28)} 0%, rgba(0,0,0,0.85) 100%)`,
            border: `1px solid ${hexA(ACCENT, 0.25)}`,
            boxShadow: `0 20px 60px ${hexA(ACCENT, 0.25)}`,
          }}>
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
            className="text-[64px] mb-3">
            {isSelfWinner ? '🏆' : '🎨'}
          </motion.div>
          <h1 className="text-[26px] font-extrabold tracking-[-0.5px] text-white">
            {isSelfWinner ? 'Pobijedio si!' : `${winner?.name ?? ''} pobijedio!`}
          </h1>
          <p className="mt-1 text-[14px]" style={{ color: hexA(ACCENT, 0.8) }}>
            {room.scores[winner?.id ?? ''] ?? 0} bodova
          </p>
        </motion.div>

        {/* Final scoreboard */}
        <motion.div {...fadeIn(0.2)} className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-200/50">Konačni rezultati</p>
          <div className="flex flex-col gap-2">
            {sortedPlayers.map((player, i) => {
              const score = room.scores[player.id] ?? 0;
              const isSelf = player.id === playerId;
              const isWinner = i === 0;
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;

              return (
                <motion.div key={player.id}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.07 }}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
                  style={{
                    background: isWinner
                      ? `linear-gradient(135deg, ${hexA(ACCENT, 0.12)}, ${hexA('#fbbf24', 0.06)})`
                      : isSelf ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isWinner ? hexA(ACCENT, 0.28) : isSelf ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
                  }}>
                  <span className="w-7 text-center text-[15px]">
                    {medal ?? <span className="text-[13px] font-bold text-white/25">{i + 1}</span>}
                  </span>
                  <span className="flex-1 text-[14px] font-medium text-white/80 truncate">
                    {player.name}
                    {isSelf && <span className="ml-1.5 text-[11px] text-amber-400/60">(ti)</span>}
                  </span>
                  <span className="text-[18px] font-extrabold"
                    style={{ color: isWinner ? ACCENT : 'rgba(255,255,255,0.4)' }}>
                    {score}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div {...fadeIn(0.45)} className="flex flex-col gap-3">
          {isHost && (
            <Button fullWidth disabled={restarting} onClick={handlePlayAgain}
              className="!rounded-2xl !text-black font-bold"
              style={{ background: `linear-gradient(135deg, ${ACCENT}, #fbbf24)`, boxShadow: `0 4px 16px ${hexA(ACCENT, 0.4)}` }}>
              {restarting ? 'Restart...' : 'Igraj ponovo'}
            </Button>
          )}
          {!isHost && (
            <p className="py-2 text-center text-[12px] text-white/30">
              Čekamo host da ponovo pokrene...
            </p>
          )}
          <Button variant="ghost" fullWidth onClick={() => router.push('/')}
            className="!text-amber-100/40 hover:!text-amber-100/70">
            Nazad na Hub
          </Button>
        </motion.div>

      </div>
    </div>
  );
}
