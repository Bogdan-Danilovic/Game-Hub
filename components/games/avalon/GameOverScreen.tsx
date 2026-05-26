'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AvalonRoom } from '@/lib/types/avalon';
import { playAgain, leaveRoom } from '@/lib/firestore/avalon';
import { Button } from '@/components/ui/Button';

interface Props {
  room: AvalonRoom;
  playerId: string;
}

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
  const isHost = room.hostId === playerId;
  const goodWon = room.winner === 'good';

  async function handlePlayAgain() {
    await playAgain(room.code);
  }

  async function handleLeave() {
    await leaveRoom(room.code, playerId);
    router.push('/');
  }

  return (
    <div className="relative flex flex-col items-center justify-center flex-1 px-8 h-screen-safe overflow-y-auto py-10">
      <motion.div
        className="fixed inset-0 pointer-events-none"
        animate={{
          background: goodWon
            ? 'radial-gradient(ellipse at center, rgba(59,130,246,0.08) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at center, rgba(239,68,68,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-[340px] flex flex-col items-center gap-8">

        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring' as const, stiffness: 150, damping: 12 }}
          className="text-center"
        >
          <span className="text-6xl block mb-4">{goodWon ? '🛡️' : '💀'}</span>
          <h2
            className={`text-[40px] font-bold ${goodWon ? 'text-blue-400' : 'text-red-400'}`}
            style={{ textShadow: `0 0 30px ${goodWon ? 'rgba(59,130,246,0.4)' : 'rgba(239,68,68,0.4)'}` }}
          >
            {goodWon ? 'Dobro' : 'Zlo'}
          </h2>
          <p className="text-[14px] text-slate-400 mt-1">pobjeđuje!</p>
          {room.winReason && (
            <p className="text-[12px] text-slate-600 mt-2">
              {WIN_MESSAGES[room.winReason] ?? ''}
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full flex flex-col gap-2"
        >
          <p className="text-[10px] text-slate-500 tracking-[0.2em] uppercase mb-2">Otkrivanje uloga</p>
          {room.players.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.08 }}
              className={`flex items-center justify-between py-2.5 px-4 rounded-lg ${
                p.loyalty === 'evil' ? 'bg-red-500/5' : 'bg-blue-500/5'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-slate-300">{p.name}</span>
                {p.id === playerId && (
                  <span className="text-[9px] text-amber-500/60 uppercase">ti</span>
                )}
              </div>
              <span className={`text-[12px] font-medium ${
                p.loyalty === 'evil' ? 'text-red-400' : 'text-blue-400'
              }`}>
                {ROLE_LABELS[p.role ?? 'good']}
              </span>
            </motion.div>
          ))}
        </motion.div>

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
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold border-2 ${
                  result?.result === 'success'
                    ? 'bg-blue-500/20 border-blue-400 text-blue-400'
                    : result?.result === 'fail'
                      ? 'bg-red-500/20 border-red-400 text-red-400'
                      : 'border-slate-700 text-slate-600'
                }`}
              >
                {m}
              </div>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="w-full flex flex-col gap-3 pt-4"
        >
          {isHost && (
            <Button
              fullWidth
              onClick={handlePlayAgain}
              className="!bg-amber-600 hover:!bg-amber-500"
            >
              Igraj ponovo
            </Button>
          )}
          <Button variant="ghost" fullWidth onClick={handleLeave}>
            Napusti sobu
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
