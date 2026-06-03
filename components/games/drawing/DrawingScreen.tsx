'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DrawingRoom, Stroke } from '@/lib/types/drawing';
import { clearCanvas, endRound, submitGuess } from '@/lib/firestore/drawing';
import { useGameTimer } from '@/hooks/useGameTimer';
import { useDrawingSync } from '@/hooks/useDrawingSync';
import { DrawingCanvas } from './DrawingCanvas';

const ACCENT = '#f59e0b';

const COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899',
];

const WIDTHS = [
  { label: 'S', value: 0.003 },
  { label: 'M', value: 0.005 },
  { label: 'L', value: 0.009 },
];

interface Props {
  room: DrawingRoom;
  playerId: string;
}

export function DrawingScreen({ room, playerId }: Props) {
  const isDrawer = room.currentDrawer === playerId;
  const { secondsLeft, progress } = useGameTimer(room.roundStartedAt, room.roundDuration);

  const [color, setColor] = useState('#000000');
  const [width, setWidth] = useState(0.005);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [localStrokes, setLocalStrokes] = useState<Stroke[]>([]);
  const [localPartial, setLocalPartial] = useState<[number, number][] | undefined>(undefined);

  const hasEndedRef = useRef(false);

  useEffect(() => {
    setLocalStrokes(room.strokes);
  }, [room.strokes]);

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
    color: tool === 'eraser' ? '#ffffff' : color,
    width,
    tool,
    enabled: isDrawer,
    onLocalStroke: handleLocalStroke,
    onLocalPartial: handleLocalPartial,
  });

  const timerColor =
    secondsLeft > 30 ? '#22c55e' : secondsLeft > 10 ? '#f59e0b' : '#ef4444';

  if (isDrawer) {
    return <DrawerView
      room={room}
      secondsLeft={secondsLeft}
      progress={progress}
      timerColor={timerColor}
      color={color}
      setColor={setColor}
      width={width}
      setWidth={setWidth}
      tool={tool}
      setTool={setTool}
      localStrokes={localStrokes}
      localPartial={localPartial}
      localPartialColor={tool === 'eraser' ? '#ffffff' : color}
      localPartialWidth={width}
      localPartialTool={tool}
      canvasRef={canvasRef}
      handlers={handlers}
    />;
  }

  return <GuesserView room={room} playerId={playerId} secondsLeft={secondsLeft} progress={progress} timerColor={timerColor} />;
}

function DrawerView({
  room, secondsLeft, progress, timerColor, color, setColor, width, setWidth, tool, setTool,
  localStrokes, localPartial, localPartialColor, localPartialWidth, localPartialTool,
  canvasRef, handlers,
}: {
  room: DrawingRoom;
  secondsLeft: number;
  progress: number;
  timerColor: string;
  color: string;
  setColor: (c: string) => void;
  width: number;
  setWidth: (w: number) => void;
  tool: 'pen' | 'eraser';
  setTool: (t: 'pen' | 'eraser') => void;
  localStrokes: Stroke[];
  localPartial?: [number, number][];
  localPartialColor: string;
  localPartialWidth: number;
  localPartialTool: 'pen' | 'eraser';
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  handlers: {
    onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
    onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
    onMouseUp: () => void;
    onMouseLeave: () => void;
    onTouchStart: (e: React.TouchEvent<HTMLCanvasElement>) => void;
    onTouchMove: (e: React.TouchEvent<HTMLCanvasElement>) => void;
    onTouchEnd: (e: React.TouchEvent<HTMLCanvasElement>) => void;
  };
}) {
  const guessedCount = room.guessedPlayers.length;
  const totalGuessers = room.players.filter((p) => p.id !== room.currentDrawer).length;

  return (
    <div className="flex flex-col flex-1 px-4 py-4 h-screen-safe overflow-hidden gap-3">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] text-white/30 uppercase tracking-wider">
            Runda {room.currentRound}/{room.totalRounds}
          </span>
          <span className="text-[18px] font-bold tracking-wider text-amber-400">
            {room.currentWord}
          </span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[28px] font-bold tabular-nums" style={{ color: timerColor }}>
            {secondsLeft}
          </span>
          <div className="w-16 h-1 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              animate={{ width: `${progress * 100}%` }}
              style={{ background: timerColor }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Guessed count */}
      <div className="text-[11px] text-white/30">
        <span className="text-emerald-400 font-semibold">{guessedCount}</span>/{totalGuessers} pogodilo
      </div>

      {/* Canvas */}
      <div className="flex-1 min-h-0">
        <DrawingCanvas
          strokes={localStrokes}
          currentStroke={null}
          localPartialPoints={localPartial}
          localPartialColor={localPartialColor}
          localPartialWidth={localPartialWidth}
          localPartialTool={localPartialTool}
          isDrawer
          canvasHandlers={handlers}
          canvasRef={canvasRef}
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        {/* Colors */}
        <div className="flex gap-2 flex-wrap">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => { setColor(c); setTool('pen'); }}
              className="w-8 h-8 rounded-full border-2 cursor-pointer transition-transform hover:scale-110"
              style={{
                background: c,
                borderColor: color === c && tool === 'pen' ? ACCENT : 'rgba(255,255,255,0.2)',
                transform: color === c && tool === 'pen' ? 'scale(1.2)' : undefined,
                boxShadow: c === '#ffffff' ? '0 0 0 1px rgba(255,255,255,0.15)' : undefined,
              }}
            />
          ))}
        </div>

        {/* Width + eraser + clear */}
        <div className="flex items-center gap-2">
          {WIDTHS.map((w) => (
            <button
              key={w.label}
              onClick={() => { setWidth(w.value); setTool('pen'); }}
              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-all"
              style={{
                background: width === w.value && tool === 'pen' ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${width === w.value && tool === 'pen' ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.08)'}`,
                color: width === w.value && tool === 'pen' ? ACCENT : '#64748b',
              }}
            >
              {w.label}
            </button>
          ))}

          <button
            onClick={() => setTool(tool === 'eraser' ? 'pen' : 'eraser')}
            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-all ml-1"
            style={{
              background: tool === 'eraser' ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${tool === 'eraser' ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)'}`,
              color: tool === 'eraser' ? '#ef4444' : '#64748b',
            }}
          >
            Guma
          </button>

          <button
            onClick={() => clearCanvas(room.code)}
            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer ml-auto transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: '#475569',
            }}
          >
            Obriši sve
          </button>
        </div>
      </div>

      {/* Chat preview — guessed players */}
      {room.guessedPlayers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {room.players
            .filter((p) => room.guessedPlayers.includes(p.id))
            .map((p) => (
              <span
                key={p.id}
                className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400"
              >
                ✓ {p.name}
              </span>
            ))}
        </div>
      )}
    </div>
  );
}

function GuesserView({
  room,
  playerId,
  secondsLeft,
  progress,
  timerColor,
}: {
  room: DrawingRoom;
  playerId: string;
  secondsLeft: number;
  progress: number;
  timerColor: string;
}) {
  const [guess, setGuess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const hasGuessed = room.guessedPlayers.includes(playerId);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room.chat]);

  const drawerName = room.players.find((p) => p.id === room.currentDrawer)?.name ?? 'Crtač';
  const guessPosition = room.guessedPlayers.length + 1;

  async function handleGuess(e: React.FormEvent) {
    e.preventDefault();
    if (!guess.trim() || hasGuessed || submitting) return;
    setSubmitting(true);
    const text = guess.trim();
    setGuess('');
    await submitGuess(
      room.code,
      playerId,
      room.players.find((p) => p.id === playerId)?.name ?? '',
      text,
      room.currentWord,
      room.roundDuration,
      room.roundStartedAt,
      guessPosition
    );
    setSubmitting(false);
    inputRef.current?.focus();
  }

  return (
    <div className="flex flex-col flex-1 px-4 py-4 h-screen-safe overflow-hidden gap-3">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] text-white/30 uppercase tracking-wider">
            Runda {room.currentRound}/{room.totalRounds}
          </span>
          <span className="text-[14px] font-semibold text-white/70">
            {drawerName} crta
          </span>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-[28px] font-bold tabular-nums" style={{ color: timerColor }}>
            {secondsLeft}
          </span>
          <div className="w-16 h-1 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              animate={{ width: `${progress * 100}%` }}
              style={{ background: timerColor }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* Word hint */}
      <div className="text-center">
        <span className="text-[20px] font-mono tracking-[0.3em] text-white/80">
          {room.wordHint}
        </span>
        <p className="text-[10px] text-white/25 mt-1">
          {room.currentWord.length} {room.currentWord.includes(' ') ? 'slova' : 'slovo'} ·{' '}
          {room.currentWord.split(' ').length > 1 ? `${room.currentWord.split(' ').length} riječi` : '1 riječ'}
        </p>
      </div>

      {/* Canvas */}
      <div className="flex-1 min-h-0">
        <DrawingCanvas
          strokes={room.strokes}
          currentStroke={room.currentStroke}
          isDrawer={false}
        />
      </div>

      {/* Chat */}
      <div className="flex flex-col gap-1 max-h-[120px] overflow-y-auto">
        {room.chat.slice(-12).map((msg, i) => (
          <div
            key={i}
            className={`text-[11px] px-2 py-0.5 rounded-lg ${
              msg.isCorrectGuess
                ? 'text-emerald-400 bg-emerald-500/10'
                : msg.playerId === playerId
                ? 'text-white/60'
                : 'text-white/30'
            }`}
          >
            <span className="font-semibold">{msg.playerName}:</span> {msg.isCorrectGuess ? '🎉 Pogodio!' : msg.text}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Guess input */}
      <AnimatePresence mode="wait">
        {hasGuessed ? (
          <motion.div
            key="guessed"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-3 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-center"
          >
            <p className="text-[13px] text-emerald-400 font-semibold">✓ Pogodio si!</p>
            <p className="text-[11px] text-white/30 mt-0.5">Gledaj kako drugi pogađaju...</p>
          </motion.div>
        ) : (
          <motion.form
            key="input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleGuess}
            className="flex gap-2"
          >
            <input
              ref={inputRef}
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Napiši odgovor..."
              autoComplete="off"
              className="flex-1 px-4 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-[14px] text-white placeholder-white/20 outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20"
            />
            <button
              type="submit"
              disabled={!guess.trim() || submitting}
              className="px-4 py-3 rounded-xl font-semibold text-[13px] cursor-pointer disabled:opacity-40 transition-all"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                color: '#000',
              }}
            >
              →
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
