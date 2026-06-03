'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { GarticRoom } from '@/lib/types/gartic';
import { submitTextEntry } from '@/lib/firestore/gartic';
import { useGameTimer } from '@/hooks/useGameTimer';
import { getMyBookId } from '@/lib/rotation';
import { hexA } from '@/lib/utils';

const ACCENT = '#ec4899';
const MAX_CHARS = 120;

interface Props { room: GarticRoom; playerId: string; }

export function WritingScreen({ room, playerId }: Props) {
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const submittedRef = useRef(false);
  const { secondsLeft, progress } = useGameTimer(room.stepStartedAt, room.stepDuration);
  const playerIds = room.players.map((p) => p.id);
  const bookId = getMyBookId(playerIds, room.currentStep, playerId);
  const timerColor = secondsLeft > 30 ? '#22c55e' : secondsLeft > 10 ? ACCENT : '#ef4444';

  useEffect(() => {
    if (secondsLeft === 0 && !submittedRef.current) {
      submittedRef.current = true;
      submitTextEntry(room.code, bookId, playerId, room.currentStep, text.trim());
      setSubmitted(true);
    }
  }, [secondsLeft, room.code, bookId, playerId, room.currentStep, text]);

  async function handleSubmit() {
    if (submittedRef.current || !text.trim()) return;
    submittedRef.current = true;
    setSubmitted(true);
    await submitTextEntry(room.code, bookId, playerId, room.currentStep, text.trim());
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto no-scrollbar">
      <div className="mx-auto flex w-full max-w-[400px] flex-col gap-5 px-5 pb-14 pt-16">

        <div className="rounded-3xl p-6"
          style={{
            background: `linear-gradient(160deg, ${hexA(ACCENT, 0.24)} 0%, rgba(0,0,0,0.85) 100%)`,
            border: `1px solid ${hexA(ACCENT, 0.22)}`,
            boxShadow: `0 20px 60px ${hexA(ACCENT, 0.18)}`,
          }}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-pink-200/50">
            Korak {room.currentStep + 1} od {room.totalSteps} · Pisanje
          </p>
          <h2 className="mt-2 text-[22px] font-extrabold tracking-[-0.4px] text-white">
            Napiši rečenicu
          </h2>
          <p className="mt-1 text-sm text-white/50">Budi kreativan — ovo je početak tvoje knjige!</p>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div className="h-full rounded-full" animate={{ width: `${progress * 100}%` }}
                style={{ background: timerColor }} transition={{ duration: 0.5 }} />
            </div>
            <span className="text-[20px] font-extrabold tabular-nums" style={{ color: timerColor }}>{secondsLeft}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.05] overflow-hidden">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
            disabled={submitted}
            placeholder="Napiši svoju rečenicu ovdje..."
            rows={5}
            className="w-full resize-none bg-transparent px-5 py-4 text-[15px] text-white placeholder-white/20 outline-none disabled:opacity-40"
          />
          <div className="flex items-center justify-between border-t border-white/[0.07] px-5 py-3">
            <span className="text-[11px] text-white/25">{text.length}/{MAX_CHARS}</span>
            <motion.button
              type="button"
              disabled={submitted || !text.trim()}
              onClick={handleSubmit}
              whileTap={{ scale: 0.96 }}
              className="rounded-xl px-5 py-2 text-[13px] font-bold text-white disabled:opacity-30 transition-opacity"
              style={{ background: `linear-gradient(135deg, ${ACCENT}, ${hexA(ACCENT, 0.8)})`, boxShadow: `0 4px 12px ${hexA(ACCENT, 0.4)}` }}>
              {submitted ? 'Poslano ✓' : 'Pošalji'}
            </motion.button>
          </div>
        </div>

      </div>
    </div>
  );
}
