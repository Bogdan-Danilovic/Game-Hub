'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { DrawingRoom } from '@/lib/types/drawing';
import { selectWord } from '@/lib/firestore/drawing';
import { getRandomWords } from '@/lib/prompts/drawing-words';

const ACCENT = '#f59e0b';
const SELECTION_TIMEOUT = 15;

interface Props {
  room: DrawingRoom;
  playerId: string;
}

export function WordSelectionScreen({ room, playerId }: Props) {
  const isDrawer = room.currentDrawer === playerId;
  const drawerName = room.players.find((p) => p.id === room.currentDrawer)?.name ?? 'Crtač';

  const words = useMemo(() => getRandomWords(3), []);
  const [timeLeft, setTimeLeft] = useState(SELECTION_TIMEOUT);
  const selectedRef = useRef(false);

  useEffect(() => {
    if (!isDrawer) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          if (!selectedRef.current) {
            selectedRef.current = true;
            selectWord(room.code, words[0]);
          }
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
      <div className="flex flex-col items-center justify-center flex-1 h-screen-safe gap-6 px-5">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-5xl"
        >
          ✏️
        </motion.div>
        <div className="text-center">
          <p className="text-[22px] font-bold text-white mb-2">{drawerName}</p>
          <p className="text-[14px] text-white/40">bira pojam za crtanje...</p>
        </div>
        <div className="flex gap-1.5 mt-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.2, 0.8, 0.2] }}
              transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
              className="w-2 h-2 rounded-full bg-amber-400/60"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 h-screen-safe px-5">
      <div className="w-full max-w-[360px] flex flex-col gap-6">
        <div className="text-center">
          <div className="text-[11px] text-white/40 tracking-[0.2em] uppercase mb-2">
            Tvoja runda · Crta{' '}
            <span className="text-amber-400">{drawerName}</span>
          </div>
          <h2 className="text-[26px] font-bold text-white">Izaberi pojam</h2>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div
              className="h-1 rounded-full bg-amber-400/30 overflow-hidden"
              style={{ width: 120 }}
            >
              <motion.div
                className="h-full bg-amber-400"
                animate={{ width: `${(timeLeft / SELECTION_TIMEOUT) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-[12px] text-amber-400 tabular-nums w-5">{timeLeft}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {words.map((word, i) => (
            <motion.button
              key={word}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => handleSelect(word)}
              className="w-full py-5 px-6 rounded-2xl text-[18px] font-bold text-white cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'rgba(245,158,11,0.08)',
                border: `1px solid rgba(245,158,11,0.2)`,
                boxShadow: '0 0 0 0 rgba(245,158,11,0)',
              }}
              whileHover={{
                background: 'rgba(245,158,11,0.18)',
                boxShadow: '0 0 20px rgba(245,158,11,0.25)',
                borderColor: 'rgba(245,158,11,0.5)',
              }}
            >
              {word}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
