'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { DrawingRoom } from '@/lib/types/drawing';
import { selectWord } from '@/lib/firestore/drawing';
import { getRandomWords } from '@/lib/prompts/drawing-words';
import { hexA } from '@/lib/utils';

const ACCENT = '#f59e0b';
const TIMEOUT = 15;

interface Props { room: DrawingRoom; playerId: string; }

export function WordSelectionScreen({ room, playerId }: Props) {
  const isDrawer = room.currentDrawer === playerId;
  const drawerName = room.players.find((p) => p.id === room.currentDrawer)?.name ?? 'Crtač';
  const words = useMemo(() => getRandomWords(3), []);
  const [timeLeft, setTimeLeft] = useState(TIMEOUT);
  const selectedRef = useRef(false);

  useEffect(() => {
    if (!isDrawer) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          if (!selectedRef.current) { selectedRef.current = true; selectWord(room.code, words[0]); }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [isDrawer, room.code, words]);

  async function handleSelect(word: string) {
    if (selectedRef.current) return;
    selectedRef.current = true;
    await selectWord(room.code, word);
  }

  if (!isDrawer) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-5">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-[64px]"
        >✏️</motion.div>
        <div className="text-center">
          <p className="text-[22px] font-extrabold tracking-[-0.3px] text-white">{drawerName}</p>
          <p className="mt-1 text-sm text-white/40">bira pojam za crtanje...</p>
        </div>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div key={i}
              animate={{ opacity: [0.2, 0.8, 0.2] }}
              transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
              className="h-2 w-2 rounded-full"
              style={{ background: ACCENT }} />
          ))}
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-6 py-4 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-200/50">
            Runda {room.currentRound} od {room.totalRounds}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto no-scrollbar">
      <div className="mx-auto flex w-full max-w-[400px] flex-col gap-6 px-5 pb-14 pt-20">

        {/* Header */}
        <div
          className="rounded-3xl p-6 text-center"
          style={{
            background: `linear-gradient(160deg, ${hexA(ACCENT, 0.28)} 0%, rgba(0,0,0,0.85) 100%)`,
            border: `1px solid ${hexA(ACCENT, 0.25)}`,
            boxShadow: `0 20px 60px ${hexA(ACCENT, 0.2)}`,
          }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-200/50">
            Runda {room.currentRound} od {room.totalRounds} · Tvoj red
          </p>
          <h2 className="mt-2 text-[26px] font-extrabold tracking-[-0.5px] text-white">Izaberi pojam</h2>
          <div className="mx-auto mt-4 flex w-32 items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
              <motion.div className="h-full rounded-full bg-amber-400"
                animate={{ width: `${(timeLeft / TIMEOUT) * 100}%` }}
                transition={{ duration: 0.5 }} />
            </div>
            <span className="w-5 text-right text-[13px] font-bold tabular-nums text-amber-400">{timeLeft}</span>
          </div>
        </div>

        {/* Word options */}
        <div className="flex flex-col gap-3">
          {words.map((word, i) => (
            <motion.button
              key={word}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              type="button"
              onClick={() => handleSelect(word)}
              className="w-full rounded-2xl px-6 py-5 text-left text-[18px] font-extrabold text-white transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${hexA(ACCENT, 0.18)}`,
              }}
              whileHover={{
                background: hexA(ACCENT, 0.15),
                borderColor: hexA(ACCENT, 0.45),
                scale: 1.02,
                boxShadow: `0 8px 24px ${hexA(ACCENT, 0.2)}`,
              }}
              whileTap={{ scale: 0.98 }}
            >
              {word}
            </motion.button>
          ))}
        </div>

      </div>
    </div>
  );
}
