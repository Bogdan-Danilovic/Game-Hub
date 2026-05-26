'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ImpostorRoom } from '@/lib/types/impostor';
import { advanceToVoting, shufflePrompt } from '@/lib/firestore/impostor';
import { Button } from '@/components/ui/Button';

interface Props {
  room: ImpostorRoom;
  playerId: string;
}

export function DiscussionScreen({ room, playerId }: Props) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [timer, setTimer] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const isHost = room.hostId === playerId;
  const isImpostor = room.impostorIds.includes(playerId);
  const prompt = isImpostor ? room.currentPrompt.impostor : room.currentPrompt.crew;
  const alivePlayers = room.players.filter((p) => p.isAlive);

  useEffect(() => {
    if (!timerRunning || timer === null || timer <= 0) return;
    const id = setTimeout(() => setTimer((t) => (t !== null ? t - 1 : null)), 1000);
    return () => clearTimeout(id);
  }, [timerRunning, timer]);

  const toggleTimer = useCallback(() => {
    if (timer === null) { setTimer(60); setTimerRunning(true); }
    else setTimerRunning((r) => !r);
  }, [timer]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="relative flex flex-col flex-1 px-8 py-10 h-screen-safe">
      <div className="relative w-full max-w-[360px] mx-auto flex flex-col gap-6 flex-1">
        {/* Header */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="text-[10px] text-slate-500 tracking-[0.2em] uppercase mb-1">Runda {room.round}</p>
          <h2 className="text-[24px] font-bold text-white tracking-[-0.03em]">Diskusija</h2>
        </motion.div>

        {/* Timer */}
        {isHost && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
            {timer !== null && (
              <span className={`text-[32px] font-bold tabular-nums tracking-tight ${timer <= 10 ? 'text-red-400 text-glow-d' : 'text-white'}`}>
                {fmt(timer)}
              </span>
            )}
            <button
              onClick={toggleTimer}
              className="text-[10px] text-slate-500 tracking-[0.15em] uppercase hover:text-slate-300 transition-colors"
            >
              {timer === null ? '[ tajmer ]' : timerRunning ? '[ pauza ]' : '[ nastavi ]'}
            </button>
          </motion.div>
        )}

        {/* Prompt peek */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          onPointerDown={() => setShowPrompt(true)}
          onPointerUp={() => setShowPrompt(false)}
          onPointerLeave={() => setShowPrompt(false)}
          onPointerCancel={() => setShowPrompt(false)}
          className={`
            w-full py-5 px-5 text-left touch-none select-none rounded-lg transition-all duration-300
            ${showPrompt
              ? isImpostor
                ? 'bg-red-500/[0.04]'
                : 'bg-violet-500/[0.04]'
              : 'bg-white/[0.02]'
            }
          `}
        >
          {showPrompt ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.1 }}>
              <p className="text-[8px] text-slate-500 uppercase tracking-[0.2em] mb-1.5">
                {room.gameMode === 'sentences' ? 'Tvoje pitanje' : 'Tvoj pojam'}
              </p>
              <p className="text-[14px] text-slate-200 font-medium leading-relaxed">{prompt}</p>
            </motion.div>
          ) : (
            <p className="text-[12px] text-slate-500">Zadrži da vidiš pitanje</p>
          )}
        </motion.button>

        {/* Agents */}
        <div>
          <p className="text-[10px] text-slate-500 tracking-[0.2em] uppercase mb-4">
            Agenti u igri · {alivePlayers.length}
          </p>
          <div className="flex flex-col gap-0.5">
            {alivePlayers.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.04, type: 'spring' as const, stiffness: 300, damping: 24 }}
                className="flex items-center gap-3 py-2"
              >
                <div className={`w-1.5 h-1.5 rounded-full ${p.id === playerId ? 'bg-violet-400' : p.isConnected ? 'bg-emerald-400/50' : 'bg-slate-700'}`} />
                <span className={`text-[13px] ${p.id === playerId ? 'text-violet-300' : 'text-slate-400'}`}>
                  {p.name}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-slate-600 leading-relaxed">
          Diskutujte. Ko zvuči sumnjivo?
        </p>

        {/* Host controls */}
        <div className="mt-auto pt-6 flex flex-col gap-2">
          {isHost && (
            <>
              <Button fullWidth onClick={() => advanceToVoting(room.code)}>Počni glasanje</Button>
              <Button variant="ghost" fullWidth onClick={() => shufflePrompt(room.code)}>Zameni pitanje</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
