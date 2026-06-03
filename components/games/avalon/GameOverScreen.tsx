'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AvalonRoom } from '@/lib/types/avalon';
import { playAgain, leaveRoom } from '@/lib/firestore/avalon';
import { useAuth } from '@/hooks/useAuth';
import { recordGameResult } from '@/lib/firestore/players';
import { Button } from '@/components/ui/Button';
import { hexA } from '@/lib/utils';

interface Props {
  room: AvalonRoom;
  playerId: string;
}

const ACCENT = '#7c3aed';
const ACCENT2 = '#8b5cf6';

const ROLE_LABELS: Record<string, string> = {
  merlin: 'Merlin',
  assassin: 'Asasin',
  percival: 'Percival',
  mordred: 'Mordred',
  morgana: 'Morgana',
  oberon: 'Oberon',
  good: 'Vitez',
  evil: 'Sluga Zla',
};

const WIN_MESSAGES: Record<string, string> = {
  missions: 'pobjedom na misijama',
  assassin: 'ubistvom Merlina',
  rejects: 'haos — 5 uzastopnih odbijanja',
};

export function GameOverScreen({ room, playerId }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const hasSaved = useRef(false);

  useEffect(() => {
    if (!user || hasSaved.current || room.winner === null) return;
    hasSaved.current = true;
    const myLoyalty = room.players.find((p) => p.id === playerId)?.loyalty;
    const won = room.winner === 'good' ? myLoyalty === 'good' : myLoyalty === 'evil';
    recordGameResult({
      playerId: user.uid,
      gameType: 'avalon',
      gameName: 'avalon',
      won,
      isHost: room.hostId === playerId,
      roomCode: room.code,
      gameKey: `${room.code}_${room.createdAt}`,
      playerNames: room.players.map((p) => p.name),
    }).catch((e) => console.error('[stats] avalon', e));
  }, [user, room.winner]);

  const isHost = room.hostId === playerId;
  const goodWon = room.winner === 'good';
  const winColor = goodWon ? '#3b82f6' : '#ef4444';
  const winColor2 = goodWon ? '#60a5fa' : '#f87171';

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
        animate={{
          background: `radial-gradient(ellipse at center, ${hexA(winColor, 0.08)} 0%, transparent 70%)`,
        }}
      />

      <div className="relative my-auto flex w-full max-w-[400px] flex-col items-center gap-8">

        {/* Winner hero card */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 150, damping: 12 }}
          className="w-full rounded-3xl p-6 text-center"
          style={{
            background: `linear-gradient(160deg, ${hexA(winColor, 0.22)} 0%, rgba(0,0,0,0.85) 100%)`,
            border: `1px solid ${hexA(winColor, 0.25)}`,
            boxShadow: `0 20px 60px ${hexA(winColor, 0.20)}`,
          }}
        >
          <span className="mb-3 block text-6xl">{goodWon ? '🛡️' : '💀'}</span>
          <h2
            className="text-[40px] font-extrabold tracking-[-0.5px]"
            style={{ color: winColor2, textShadow: `0 0 30px ${hexA(winColor, 0.45)}` }}
          >
            {goodWon ? 'Dobro' : 'Zlo'}
          </h2>
          <p className="mt-1 text-[14px] text-white/50">pobjeđuje!</p>
          {room.winReason && (
            <p className="mt-2 text-[12px] text-white/30">
              {WIN_MESSAGES[room.winReason] ?? ''}
            </p>
          )}
        </motion.div>

        {/* Role reveal */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full rounded-2xl border border-white/10 bg-white/[0.05] p-4"
          style={{ backdropFilter: 'blur(12px)' }}
        >
          <p className="text-[10px] text-white/30 tracking-[0.2em] uppercase mb-3">Otkrivanje uloga</p>
          {room.players.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.08 }}
              className="flex items-center justify-between py-2.5 px-3 rounded-xl"
              style={{
                background: p.loyalty === 'evil' ? 'rgba(239,68,68,0.06)' : 'rgba(59,130,246,0.06)',
                borderBottom: i < room.players.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-white/80">{p.name}</span>
                {p.id === playerId && (
                  <span className="text-[9px] text-white/30 uppercase">ti</span>
                )}
              </div>
              <span className={`text-[12px] font-medium ${p.loyalty === 'evil' ? 'text-red-400' : 'text-blue-400'}`}>
                {ROLE_LABELS[p.role ?? 'good']}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Mission dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex gap-3"
        >
          {[1, 2, 3, 4, 5].map((m) => {
            const result = room.missionResults.find((r) => r.missionNumber === m);
            return (
              <div
                key={m}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold border-2 ${
                  result?.result === 'success'
                    ? 'bg-blue-500/20 border-blue-400 text-blue-400'
                    : result?.result === 'fail'
                      ? 'bg-red-500/20 border-red-400 text-red-400'
                      : 'border-white/10 text-white/25'
                }`}
              >
                {m}
              </div>
            );
          })}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="w-full flex flex-col gap-3 pt-2"
        >
          {isHost && (
            <Button
              fullWidth
              onClick={handlePlayAgain}
              className="!rounded-2xl !text-white"
              style={{
                background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
                boxShadow: `0 4px 16px ${hexA(ACCENT, 0.4)}`,
              }}
            >
              Igraj ponovo
            </Button>
          )}
          <Button variant="ghost" fullWidth onClick={handleLeave} className="!text-white/40 hover:!text-white/70">
            Napusti sobu
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
