'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { GarticRoom } from '@/lib/types/gartic';
import { submitTextEntry } from '@/lib/firestore/gartic';
import { useGameTimer } from '@/hooks/useGameTimer';
import { getMyBookId } from '@/lib/rotation';
import { hexA } from '@/lib/utils';
import { StaticCanvas } from './StaticCanvas';

const ACCENT = '#ec4899';
const MAX_CHARS = 120;

interface Props { room: GarticRoom; playerId: string; }

export function DescribingScreen({ room, playerId }: Props) {
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const submittedRef = useRef(false);
  const { secondsLeft, progress } = useGameTimer(room.stepStartedAt, room.stepDuration);
  const timerColor = secondsLeft > 30 ? '#22c55e' : secondsLeft > 10 ? ACCENT : '#ef4444';

  const playerIds = room.players.map((p) => p.id);
  const bookId = getMyBookId(playerIds, room.currentStep, playerId);
  const book = room.books[bookId];
  const prevEntry = book?.entries.find((e) => e.step === room.currentStep - 1);
  const drawingStrokes = prevEntry?.type === 'drawing' ? (prevEntry.strokes ?? []) : [];

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
    <div className="flex flex-1 flex-col gap-2 px-4 pb-4 pt-4 overflow-hidden" style={{ minHeight: 0 }}>

      <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-pink-200/50">
              Korak {room.currentStep + 1}/{room.totalSteps} · Opisivanje
            </p>
            <p className="mt-0.5 text-sm text-white/50">Opiši crtež jednom rečenicom</p>
          </div>
          <div className="flex items-center gap-2 min-w-[90px] justify-end">
            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden w-14">
              <motion.div className="h-full rounded-full" animate={{ width: `${progress * 100}%` }}
                style={{ background: timerColor }} transition={{ duration: 0.5 }} />
            </div>
            <span className="text-[20px] font-extrabold tabular-nums" style={{ color: timerColor }}>{secondsLeft}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 rounded-2xl overflow-hidden border border-white/10 bg-white">
        <StaticCanvas strokes={drawingStrokes} />
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.05] overflow-hidden shrink-0">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
          disabled={submitted}
          placeholder="Šta vidiš na crtežu?"
          rows={3}
          className="w-full resize-none bg-transparent px-5 py-4 text-[15px] text-white placeholder-white/20 outline-none disabled:opacity-40"
        />
        <div className="flex items-center justify-between border-t border-white/[0.07] px-5 py-3">
          <span className="text-[11px] text-white/25">{text.length}/{MAX_CHARS}</span>
          <motion.button type="button" disabled={submitted || !text.trim()} onClick={handleSubmit}
            whileTap={{ scale: 0.96 }}
            className="rounded-xl px-5 py-2 text-[13px] font-bold text-white disabled:opacity-30 transition-opacity"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, ${hexA(ACCENT, 0.8)})`, boxShadow: `0 4px 12px ${hexA(ACCENT, 0.4)}` }}>
            {submitted ? 'Poslano ✓' : 'Pošalji'}
          </motion.button>
        </div>
      </div>

    </div>
  );
}
