'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { GarticRoom, GarticStroke } from '@/lib/types/gartic';
import { submitDrawingEntry } from '@/lib/firestore/gartic';
import { useGameTimer } from '@/hooks/useGameTimer';
import { getMyBookId } from '@/lib/rotation';
import { hexA } from '@/lib/utils';
import { GarticCanvas } from './Canvas';
import { StaticCanvas } from './StaticCanvas';

const ACCENT = '#ec4899';
const COLORS = ['#000000','#ffffff','#ef4444','#3b82f6','#22c55e','#f59e0b','#8b5cf6','#ec4899'];
const WIDTHS: { label: string; value: number }[] = [
  { label: 'S', value: 0.003 },
  { label: 'M', value: 0.007 },
  { label: 'L', value: 0.014 },
];

interface Props { room: GarticRoom; playerId: string; }

export function DrawingScreen({ room, playerId }: Props) {
  const [color, setColor] = useState('#000000');
  const [width, setWidth] = useState(0.007);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [strokes, setStrokes] = useState<GarticStroke[]>([]);
  const [clearCount, setClearCount] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const submittedRef = useRef(false);
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);
  const { secondsLeft, progress } = useGameTimer(room.stepStartedAt, room.stepDuration);
  const timerColor = secondsLeft > 45 ? '#22c55e' : secondsLeft > 15 ? ACCENT : '#ef4444';

  const playerIds = room.players.map((p) => p.id);
  const bookId = getMyBookId(playerIds, room.currentStep, playerId);
  const book = room.books[bookId];
  const prevEntry = book?.entries.find((e) => e.step === room.currentStep - 1);
  const textToDraw = prevEntry?.type === 'text' ? prevEntry.text ?? '' : '';

  async function doSubmit(currentStrokes: GarticStroke[]) {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitted(true);
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    let thumb = '';
    if (canvas) {
      const t = document.createElement('canvas');
      t.width = 120; t.height = 90;
      const ctx = t.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 120, 90);
      ctx.drawImage(canvas, 0, 0, 120, 90);
      thumb = t.toDataURL('image/jpeg', 0.7);
    }
    await submitDrawingEntry(room.code, bookId, playerId, room.currentStep, currentStrokes, thumb);
  }

  useEffect(() => {
    if (secondsLeft === 0 && !submittedRef.current) doSubmit(strokes);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  return (
    <div className="flex flex-1 flex-col gap-2 px-4 pb-4 pt-4 overflow-hidden" style={{ minHeight: 0 }}>

      <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-pink-200/50">
              Korak {room.currentStep + 1}/{room.totalSteps} · Crtanje
            </p>
            <p className="mt-1 text-[16px] font-extrabold text-white leading-snug line-clamp-2">
              {textToDraw || '(nema teksta)'}
            </p>
          </div>
          <div className="shrink-0 min-w-[80px] text-right">
            <div className="flex items-center gap-2 justify-end">
              <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden w-16">
                <motion.div className="h-full rounded-full" animate={{ width: `${progress * 100}%` }}
                  style={{ background: timerColor }} transition={{ duration: 0.5 }} />
              </div>
              <span className="text-[20px] font-extrabold tabular-nums" style={{ color: timerColor }}>{secondsLeft}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 rounded-2xl overflow-hidden border border-white/10">
        {submitted ? (
          <StaticCanvas strokes={strokes} />
        ) : (
          <GarticCanvas
            onStrokesChange={(s) => { setStrokes(s); }}
            color={color} width={width} tool={tool}
            externalClear={clearCount}
          />
        )}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 flex flex-col gap-2.5 shrink-0">
        <div className="flex gap-2 flex-wrap">
          {COLORS.map((c) => (
            <button key={c} type="button" disabled={submitted}
              onClick={() => { setColor(c); setTool('pen'); }}
              className="h-7 w-7 rounded-full border-2 transition-transform disabled:opacity-40"
              style={{
                background: c,
                borderColor: color === c && tool === 'pen' ? ACCENT : 'rgba(255,255,255,0.15)',
                transform: color === c && tool === 'pen' ? 'scale(1.25)' : 'scale(1)',
                boxShadow: c === '#ffffff' ? '0 0 0 1px rgba(255,255,255,0.12)' : undefined,
              }} />
          ))}
        </div>
        <div className="flex items-center gap-2">
          {WIDTHS.map((w) => {
            const active = width === w.value && tool === 'pen';
            return (
              <button key={w.label} type="button" disabled={submitted}
                onClick={() => { setWidth(w.value); setTool('pen'); }}
                className="px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all disabled:opacity-40"
                style={{
                  background: active ? hexA(ACCENT, 0.2) : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${active ? hexA(ACCENT, 0.4) : 'rgba(255,255,255,0.07)'}`,
                  color: active ? ACCENT : 'rgba(255,255,255,0.3)',
                }}>
                {w.label}
              </button>
            );
          })}
          <button type="button" disabled={submitted}
            onClick={() => setTool(tool === 'eraser' ? 'pen' : 'eraser')}
            className="px-3 py-1.5 rounded-xl text-[11px] font-bold ml-1 transition-all disabled:opacity-40"
            style={{
              background: tool === 'eraser' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${tool === 'eraser' ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.07)'}`,
              color: tool === 'eraser' ? '#ef4444' : 'rgba(255,255,255,0.3)',
            }}>
            Guma
          </button>
          <button type="button" disabled={submitted}
            onClick={() => { setClearCount((n) => n + 1); setStrokes([]); }}
            className="ml-auto px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.25)' }}>
            Obriši
          </button>
          <button type="button" disabled={submitted}
            onClick={() => doSubmit(strokes)}
            className="px-4 py-1.5 rounded-xl text-[12px] font-extrabold text-white disabled:opacity-40 transition-opacity"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, ${hexA(ACCENT, 0.8)})`, boxShadow: `0 3px 10px ${hexA(ACCENT, 0.4)}` }}>
            {submitted ? '✓' : 'Završi'}
          </button>
        </div>
      </div>

    </div>
  );
}
