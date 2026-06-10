'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DrawingRoom, Stroke } from '@/lib/types/drawing';
import { clearCanvas, endRound, submitGuess } from '@/lib/firestore/drawing';
import { useGameTimer } from '@/hooks/useGameTimer';
import { useDrawingSync } from '@/hooks/useDrawingSync';
import { DrawingCanvas } from './DrawingCanvas';
import { hexA } from '@/lib/utils';

const ACCENT = '#f59e0b';

const COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899',
];

const WIDTHS: { label: string; value: number }[] = [
  { label: 'S', value: 0.003 },
  { label: 'M', value: 0.005 },
  { label: 'L', value: 0.009 },
];

interface Props { room: DrawingRoom; playerId: string; }

export function DrawingScreen({ room, playerId }: Props) {
  const isDrawer = room.currentDrawer === playerId;
  const { secondsLeft, progress } = useGameTimer(room.roundStartedAt, room.roundDuration);

  const [color, setColor] = useState('#000000');
  const [width, setWidth] = useState(0.005);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [localStrokes, setLocalStrokes] = useState<Stroke[]>([]);
  const [localPartial, setLocalPartial] = useState<[number, number][] | undefined>(undefined);
  const hasEndedRef = useRef(false);

  // Sinhronizuj lokalne poteze sa serverskim (adjust-during-render)
  const [prevStrokes, setPrevStrokes] = useState(room.strokes);
  if (prevStrokes !== room.strokes) {
    setPrevStrokes(room.strokes);
    setLocalStrokes(room.strokes);
  }

  useEffect(() => {
    if (secondsLeft === 0 && !hasEndedRef.current && isDrawer) {
      hasEndedRef.current = true;
      endRound(room.code);
    }
  }, [secondsLeft, isDrawer, room.code]);

  const handleLocalStroke = useCallback((stroke: Stroke) => {
    setLocalStrokes((prev) => [...prev, stroke]);
    setLocalPartial(undefined);
  }, []);

  const handleLocalPartial = useCallback((points: [number, number][]) => {
    setLocalPartial(points);
  }, []);

  const { canvasRef, handlers } = useDrawingSync({
    code: room.code,
    drawerId: playerId,
    color: tool === 'eraser' ? '#080b14' : color,
    width,
    tool,
    enabled: isDrawer,
    onLocalStroke: handleLocalStroke,
    onLocalPartial: handleLocalPartial,
  });

  const timerColor = secondsLeft > 30 ? '#22c55e' : secondsLeft > 10 ? ACCENT : '#ef4444';

  if (isDrawer) {
    return (
      <DrawerView
        room={room} secondsLeft={secondsLeft} progress={progress} timerColor={timerColor}
        color={color} setColor={setColor} width={width} setWidth={setWidth}
        tool={tool} setTool={setTool}
        localStrokes={localStrokes} localPartial={localPartial}
        localPartialColor={tool === 'eraser' ? '#080b14' : color}
        localPartialWidth={width} localPartialTool={tool}
        canvasRef={canvasRef} handlers={handlers}
      />
    );
  }

  return <GuesserView room={room} playerId={playerId} secondsLeft={secondsLeft} progress={progress} timerColor={timerColor} />;
}

function TimerBar({ secondsLeft, progress, timerColor }: { secondsLeft: number; progress: number; timerColor: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <motion.div className="h-full rounded-full" animate={{ width: `${progress * 100}%` }}
          style={{ background: timerColor }} transition={{ duration: 0.5 }} />
      </div>
      <span className="text-[20px] font-extrabold tabular-nums leading-none"
        style={{ color: timerColor }}>{secondsLeft}</span>
    </div>
  );
}

function DrawerView({
  room, secondsLeft, progress, timerColor,
  color, setColor, width, setWidth, tool, setTool,
  localStrokes, localPartial, localPartialColor, localPartialWidth, localPartialTool,
  canvasRef, handlers,
}: {
  room: DrawingRoom; secondsLeft: number; progress: number; timerColor: string;
  color: string; setColor: (c: string) => void;
  width: number; setWidth: (w: number) => void;
  tool: 'pen' | 'eraser'; setTool: (t: 'pen' | 'eraser') => void;
  localStrokes: Stroke[]; localPartial?: [number, number][];
  localPartialColor: string; localPartialWidth: number; localPartialTool: 'pen' | 'eraser';
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  handlers: {
    onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
    onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
    onMouseUp: () => void; onMouseLeave: () => void;
    onTouchStart: (e: React.TouchEvent<HTMLCanvasElement>) => void;
    onTouchMove: (e: React.TouchEvent<HTMLCanvasElement>) => void;
    onTouchEnd: (e: React.TouchEvent<HTMLCanvasElement>) => void;
  };
}) {
  const guessedCount = room.guessedPlayers.length;
  const totalGuessers = room.players.filter((p) => p.id !== room.currentDrawer).length;

  return (
    <div className="flex flex-1 flex-col gap-2 px-4 pb-4 pt-4 overflow-hidden" style={{ minHeight: 0 }}>

      {/* Top bar */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-200/50">
              Runda {room.currentRound}/{room.totalRounds} · Ti crtaš
            </p>
            <p className="text-[20px] font-extrabold tracking-[-0.3px] text-amber-400 truncate mt-0.5">
              {room.currentWord}
            </p>
          </div>
          <div className="shrink-0 text-right min-w-[90px]">
            <p className="text-[11px] text-white/30 mb-1.5">
              <span className="text-emerald-400 font-bold">{guessedCount}</span>/{totalGuessers} pogodilo
            </p>
            <TimerBar secondsLeft={secondsLeft} progress={progress} timerColor={timerColor} />
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 min-h-0 rounded-2xl overflow-hidden border border-white/10">
        <DrawingCanvas
          strokes={localStrokes} currentStroke={null}
          localPartialPoints={localPartial}
          localPartialColor={localPartialColor} localPartialWidth={localPartialWidth}
          localPartialTool={localPartialTool}
          isDrawer canvasHandlers={handlers} canvasRef={canvasRef}
        />
      </div>

      {/* Guessed players */}
      <AnimatePresence>
        {room.guessedPlayers.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            className="flex flex-wrap gap-1.5 shrink-0">
            {room.players.filter((p) => room.guessedPlayers.includes(p.id)).map((p) => (
              <span key={p.id}
                className="text-[11px] px-2.5 py-0.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-400">
                ✓ {p.name}
              </span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 flex flex-col gap-2.5 shrink-0">
        <div className="flex gap-2 flex-wrap">
          {COLORS.map((c) => (
            <button key={c} type="button" onClick={() => { setColor(c); setTool('pen'); }}
              className="h-7 w-7 rounded-full border-2 transition-transform active:scale-90"
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
              <button key={w.label} type="button" onClick={() => { setWidth(w.value); setTool('pen'); }}
                className="px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all"
                style={{
                  background: active ? hexA(ACCENT, 0.2) : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${active ? hexA(ACCENT, 0.4) : 'rgba(255,255,255,0.07)'}`,
                  color: active ? ACCENT : 'rgba(255,255,255,0.3)',
                }}>
                {w.label}
              </button>
            );
          })}

          <button type="button" onClick={() => setTool(tool === 'eraser' ? 'pen' : 'eraser')}
            className="px-3 py-1.5 rounded-xl text-[11px] font-bold ml-1 transition-all"
            style={{
              background: tool === 'eraser' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${tool === 'eraser' ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.07)'}`,
              color: tool === 'eraser' ? '#ef4444' : 'rgba(255,255,255,0.3)',
            }}>
            Guma
          </button>

          <button type="button" onClick={() => clearCanvas(room.code)}
            className="ml-auto px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.25)',
            }}>
            Obriši
          </button>
        </div>
      </div>

    </div>
  );
}

function GuesserView({ room, playerId, secondsLeft, progress, timerColor }: {
  room: DrawingRoom; playerId: string;
  secondsLeft: number; progress: number; timerColor: string;
}) {
  const [guess, setGuess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const hasGuessed = room.guessedPlayers.includes(playerId);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const drawerName = room.players.find((p) => p.id === room.currentDrawer)?.name ?? 'Crtač';

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [room.chat]);

  async function handleGuess(e: React.FormEvent) {
    e.preventDefault();
    if (!guess.trim() || hasGuessed || submitting) return;
    setSubmitting(true);
    const text = guess.trim();
    setGuess('');
    await submitGuess(
      room.code, playerId,
      room.players.find((p) => p.id === playerId)?.name ?? '',
      text, room.currentWord, room.roundDuration, room.roundStartedAt,
      room.guessedPlayers.length + 1,
    );
    setSubmitting(false);
    inputRef.current?.focus();
  }

  return (
    <div className="flex flex-1 flex-col gap-2 px-4 pb-4 pt-4 overflow-hidden" style={{ minHeight: 0 }}>

      {/* Top bar */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-200/50">
              Runda {room.currentRound}/{room.totalRounds}
            </p>
            <p className="text-sm font-semibold text-white/60 mt-0.5">{drawerName} crta</p>
          </div>
          <div className="shrink-0 min-w-[90px]">
            <TimerBar secondsLeft={secondsLeft} progress={progress} timerColor={timerColor} />
          </div>
        </div>
        <div className="mt-2.5 text-center">
          <span className="text-[20px] font-mono tracking-[0.3em] text-white/80">{room.wordHint}</span>
          <p className="mt-0.5 text-[10px] text-white/25">
            {room.currentWord.length} slova
            {room.currentWord.includes(' ') ? ` · ${room.currentWord.split(' ').length} reči` : ''}
          </p>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 min-h-0 rounded-2xl overflow-hidden border border-white/10">
        <DrawingCanvas strokes={room.strokes} currentStroke={room.currentStroke} isDrawer={false} />
      </div>

      {/* Chat */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2 flex flex-col gap-1 max-h-[100px] overflow-y-auto shrink-0">
        {room.chat.length === 0 && (
          <p className="text-[11px] text-white/20 py-1 text-center">Niko još nije pogađao...</p>
        )}
        {room.chat.slice(-10).map((msg, i) => (
          <div key={i}
            className={`text-[11px] px-2 py-0.5 rounded-lg ${
              msg.isCorrectGuess ? 'text-emerald-400 bg-emerald-500/10'
              : msg.playerId === playerId ? 'text-white/60' : 'text-white/30'
            }`}>
            <span className="font-semibold">{msg.playerName}:</span>{' '}
            {msg.isCorrectGuess ? '🎉 Pogodio!' : msg.text}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Guess input */}
      <AnimatePresence mode="wait">
        {hasGuessed ? (
          <motion.div key="guessed"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="shrink-0 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-3 text-center">
            <p className="text-[13px] font-bold text-emerald-400">Pogodio si!</p>
            <p className="mt-0.5 text-[11px] text-white/30">Gledaj kako drugi pogađaju...</p>
          </motion.div>
        ) : (
          <motion.form key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            onSubmit={handleGuess} className="flex gap-2 shrink-0">
            <input
              ref={inputRef} value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Napiši odgovor..." autoComplete="off"
              className="flex-1 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-[14px] text-white placeholder-white/20 outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20" />
            <button type="submit" disabled={!guess.trim() || submitting}
              className="rounded-2xl px-5 py-3 text-[15px] font-extrabold text-black disabled:opacity-40 transition-opacity"
              style={{ background: `linear-gradient(135deg, ${ACCENT}, #fbbf24)`, boxShadow: `0 4px 12px ${hexA(ACCENT, 0.4)}` }}>
              →
            </button>
          </motion.form>
        )}
      </AnimatePresence>

    </div>
  );
}
