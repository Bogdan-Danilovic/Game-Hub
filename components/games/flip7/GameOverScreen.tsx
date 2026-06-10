'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Flip7Room } from '@/lib/types/flip7';
import { Button } from '@/components/shared/Button';
import { playAgain, leaveRoom } from '@/lib/firestore/flip7';
import { useAuth } from '@/hooks/useAuth';
import { recordGameResult } from '@/lib/firestore/players';
import { hexA } from '@/lib/utils';

interface Props {
  room: Flip7Room;
  playerId: string;
}

const ACCENT = '#f59e0b'; // Flip 7 amber identity

export function GameOverScreen({ room, playerId }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const hasSaved = useRef(false);

  useEffect(() => {
    if (!user || hasSaved.current) return;
    hasSaved.current = true;
    recordGameResult({
      playerId: user.uid,
      gameType: 'flip7',
      gameName: 'flip7',
      won: room.winnerId === playerId,
      isHost: room.hostId === playerId,
      roomCode: room.code,
      gameKey: `${room.code}_${room.createdAt}`,
      playerNames: room.players.map((p) => p.name),
    }).catch((e) => console.error('[stats] flip7', e));
  }, [user]);

  const isHost = room.hostId === playerId;
  const winner = room.players.find((p) => p.id === room.winnerId);
  const ranked = [...room.players].sort((a, b) => b.totalScore - a.totalScore);

  async function handlePlayAgain() {
    await playAgain(room.code);
  }

  async function handleLeave() {
    await leaveRoom(room.code, playerId);
    router.push('/');
  }

  return (
    <div className="relative flex flex-1 flex-col items-center overflow-y-auto no-scrollbar px-5 pb-12 pt-20">
      <motion.div
        className="pointer-events-none fixed inset-0"
        animate={{ background: 'radial-gradient(ellipse at center, rgba(245,158,11,0.10) 0%, transparent 70%)' }}
      />
      <div className="relative my-auto flex w-full max-w-[400px] flex-col items-center gap-8">
        {/* Winner hero */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 150, damping: 12 }}
          className="w-full rounded-3xl p-6 text-center"
          style={{
            background: `linear-gradient(160deg, ${hexA(ACCENT, 0.28)} 0%, rgba(0,0,0,0.85) 100%)`,
            border: `1px solid ${hexA(ACCENT, 0.25)}`,
            boxShadow: `0 20px 60px ${hexA(ACCENT, 0.25)}`,
          }}
        >
          <span className="mb-3 block text-6xl">🏆</span>
          <h2 className="text-[34px] font-extrabold tracking-[-0.5px] text-amber-400" style={{ textShadow: '0 0 30px rgba(245,158,11,0.45)' }}>
            {winner ? winner.name : 'Kraj igre'}
          </h2>
          <p className="mt-1 text-[13px] text-amber-100/70">
            {winner ? `pobeđuje sa ${winner.totalScore} poena!` : 'igra je završena'}
          </p>
        </motion.div>

        {/* Final standings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex w-full flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.05] p-4"
        >
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-200/50">Konačni poredak</p>
          {ranked.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.07 }}
              className="flex items-center justify-between rounded-xl px-4 py-2.5"
              style={{
                background: i === 0 ? hexA(ACCENT, 0.12) : 'rgba(255,255,255,0.03)',
                border: `1px solid ${i === 0 ? hexA(ACCENT, 0.3) : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="w-4 text-[13px] font-bold tabular-nums text-amber-200/40">{i + 1}</span>
                <span className="truncate text-[14px] text-amber-50">{p.name}</span>
                {p.id === playerId && <span className="text-[9px] uppercase text-amber-400/70">ti</span>}
              </div>
              <span className="text-[15px] font-bold tabular-nums text-amber-100">{p.totalScore}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex w-full flex-col gap-3 pt-2"
        >
          {isHost && (
            <Button
              fullWidth
              onClick={handlePlayAgain}
              className="!rounded-2xl !text-white"
              style={{
                background: `linear-gradient(135deg, ${ACCENT}, ${hexA(ACCENT, 0.8)})`,
                boxShadow: `0 4px 16px ${hexA(ACCENT, 0.4)}`,
              }}
            >
              Igraj ponovo
            </Button>
          )}
          <Button variant="ghost" fullWidth onClick={handleLeave} className="!text-amber-100/50 hover:!text-amber-100/80">
            Napusti sobu
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
