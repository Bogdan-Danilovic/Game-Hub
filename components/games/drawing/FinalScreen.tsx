'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { DrawingRoom } from '@/lib/types/drawing';
import { playAgain } from '@/lib/firestore/drawing';
import { Button } from '@/components/ui/Button';
import { hexA } from '@/lib/utils';

const ACCENT = '#f59e0b';
const ACCENT2 = '#fbbf24';

interface Props {
  room: DrawingRoom;
  playerId: string;
}

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
    <div className="flex flex-col flex-1 px-5 py-8 h-screen-safe overflow-y-auto">
      <div className="w-full max-w-[400px] mx-auto flex flex-col gap-8">
        {/* Winner banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="text-center"
        >
          <div className="text-6xl mb-4">
            {isSelfWinner ? '🏆' : '🎨'}
          </div>
          <h1 className="text-[28px] font-bold text-white mb-2">
            {isSelfWinner ? 'Pobijedio si!' : `${winner?.name ?? ''} pobijedio!`}
          </h1>
          <p className="text-[13px] text-white/40">
            {room.scores[winner?.id] ?? 0} bodova
          </p>
        </motion.div>

        {/* Final scoreboard */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col gap-2"
        >
          <p className="text-[10px] text-slate-500 tracking-[0.2em] uppercase mb-1">
            Konačni rezultati
          </p>

          {sortedPlayers.map((player, i) => {
            const score = room.scores[player.id] ?? 0;
            const isSelf = player.id === playerId;
            const isWinner = i === 0;

            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.07 }}
                className="flex items-center gap-4 px-4 py-4 rounded-2xl"
                style={{
                  background: isWinner
                    ? `linear-gradient(135deg, ${hexA(ACCENT, 0.12)}, ${hexA(ACCENT2, 0.06)})`
                    : isSelf
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isWinner ? 'rgba(245,158,11,0.3)' : isSelf ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
                }}
              >
                <span
                  className="text-[16px] font-bold w-7 text-center"
                  style={{ color: isWinner ? ACCENT : '#475569' }}
                >
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                </span>
                <span className="flex-1 text-[14px] font-medium text-white/80">
                  {player.name}
                  {isSelf && <span className="text-amber-400/60 ml-1.5 text-[11px]">(ti)</span>}
                </span>
                <span
                  className="text-[18px] font-bold"
                  style={{ color: isWinner ? ACCENT : '#64748b' }}
                >
                  {score}
                </span>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col gap-3"
        >
          {isHost && (
            <Button
              fullWidth
              disabled={restarting}
              onClick={handlePlayAgain}
              className="!rounded-2xl !text-black font-bold"
              style={{
                background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
                boxShadow: `0 4px 16px ${hexA(ACCENT, 0.4)}`,
              }}
            >
              {restarting ? 'Restart...' : 'Igraj ponovo'}
            </Button>
          )}

          {!isHost && (
            <p className="text-[12px] text-white/30 text-center py-2">
              Čekamo host da ponovo pokrene...
            </p>
          )}

          <button
            onClick={() => router.push('/')}
            className="text-[12px] text-slate-600 hover:text-slate-400 transition-colors py-2 cursor-pointer text-center"
          >
            Nazad na Hub
          </button>
        </motion.div>
      </div>
    </div>
  );
}
