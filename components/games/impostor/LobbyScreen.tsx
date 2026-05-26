'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImpostorRoom, Category, GameMode } from '@/lib/types/impostor';
import { CATEGORIES } from '@/lib/prompts/index';
import { Button } from '@/components/ui/Button';
import { PlayerCard } from '@/components/ui/PlayerCard';
import { updateRoomSettings, kickPlayer, startGame } from '@/lib/firestore/impostor';

interface Props {
  room: ImpostorRoom;
  playerId: string;
}

const CATEGORY_KEYS = Object.keys(CATEGORIES) as Category[];
const MODE_LABELS: Record<GameMode, string> = { sentences: 'Rečenice', concepts: 'Pojmovi' };

function DecryptCode({ code }: { code: string }) {
  const [revealed, setRevealed] = useState(0);
  const chars = 'ABCDEFGHKLMNPQRSTUVWXYZ23456789';

  useEffect(() => {
    if (revealed >= code.length) return;
    const t = setTimeout(() => setRevealed((r) => r + 1), 120);
    return () => clearTimeout(t);
  }, [revealed, code.length]);

  return (
    <span className="inline-flex tracking-[0.4em]">
      {code.split('').map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={i < revealed ? 'text-violet-400' : 'text-slate-600'}
        >
          {i < revealed ? char : chars[Math.floor(Math.random() * chars.length)]}
        </motion.span>
      ))}
    </span>
  );
}

export function LobbyScreen({ room, playerId }: Props) {
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const isHost = room.hostId === playerId;
  const playerCount = room.players.length;
  const canStart = playerCount >= 3;
  const maxImpostors = Math.max(1, Math.floor(playerCount / 3));
  const showImpostorSettings = playerCount >= 5;

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) { startGame(room.code); return; }
    const t = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, room.code]);

  const handleStart = useCallback(() => {
    setStarting(true);
    setCountdown(3);
  }, []);

  function copyCode() {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative flex flex-col flex-1 px-8 py-10 h-screen-safe overflow-y-auto">
      <div className="relative w-full max-w-[360px] mx-auto flex flex-col gap-8 flex-1">

        {/* Room code — decrypt style */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-[10px] text-slate-500 tracking-[0.2em] uppercase mb-3">
            Pristupni kod
          </p>
          <button onClick={copyCode} className="block">
            <span className="text-[36px] font-bold text-glow-v">
              <DecryptCode code={room.code} />
            </span>
          </button>
          <p className="text-[10px] mt-2 h-4">
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.span key="c" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-emerald-400">
                  Kopirano
                </motion.span>
              ) : (
                <motion.span key="h" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} className="text-slate-500">
                  tapni da kopiraš
                </motion.span>
              )}
            </AnimatePresence>
          </p>
        </motion.div>

        {/* Players — light dots */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-baseline justify-between mb-4">
            <p className="text-[10px] text-slate-500 tracking-[0.2em] uppercase">
              Ageniti · {playerCount}
            </p>
            {playerCount < 3 && (
              <motion.p
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-[10px] text-amber-400/70"
              >
                čekamo još {3 - playerCount}
              </motion.p>
            )}
          </div>

          {/* Progress line */}
          <div className="w-full h-px bg-white/[0.04] mb-5 relative">
            <motion.div
              className={`absolute top-0 left-0 h-px ${canStart ? 'bg-emerald-500/50' : 'bg-amber-500/40'}`}
              animate={{ width: `${Math.min((playerCount / 3) * 100, 100)}%` }}
              transition={{ type: 'spring' as const, stiffness: 300, damping: 25 }}
            />
          </div>

          <div className="flex flex-col gap-0.5">
            <AnimatePresence mode="popLayout">
              {room.players.map((p) => (
                <PlayerCard
                  key={p.id}
                  player={p}
                  isHost={p.id === room.hostId}
                  isSelf={p.id === playerId}
                  canKick={isHost && room.status === 'lobby'}
                  onKick={() => kickPlayer(room.code, p.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Settings */}
        {isHost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col gap-6"
          >
            {/* Mode */}
            <div>
              <p className="text-[10px] text-slate-500 tracking-[0.2em] uppercase mb-3">Režim</p>
              <div className="flex gap-2">
                {(['sentences', 'concepts'] as GameMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => updateRoomSettings(room.code, { gameMode: mode })}
                    className={`
                      flex-1 py-2.5 rounded-lg text-[12px] font-medium transition-all duration-200
                      ${room.gameMode === mode
                        ? 'bg-violet-600/80 text-white glow-v-sm'
                        : 'bg-white/[0.02] text-slate-500 hover:text-slate-400 hover:bg-white/[0.04]'
                      }
                    `}
                  >
                    {MODE_LABELS[mode]}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <p className="text-[10px] text-slate-500 tracking-[0.2em] uppercase mb-3">Kategorija</p>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_KEYS.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => updateRoomSettings(room.code, { category: cat })}
                    className={`
                      px-3 py-1.5 rounded-md text-[11px] font-medium transition-all duration-200
                      ${room.category === cat
                        ? 'bg-violet-600/80 text-white'
                        : 'text-slate-500 hover:text-slate-400 hover:bg-white/[0.03]'
                      }
                    `}
                  >
                    {CATEGORIES[cat].label}
                  </button>
                ))}
              </div>
            </div>

            {/* Impostor count */}
            {showImpostorSettings && (
              <div>
                <p className="text-[10px] text-slate-500 tracking-[0.2em] uppercase mb-3">Impostora</p>
                <div className="flex gap-2">
                  {Array.from({ length: maxImpostors }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => updateRoomSettings(room.code, { settings: { impostorCount: n } })}
                      className={`
                        w-9 h-9 rounded-lg text-[12px] font-bold transition-all duration-200
                        ${room.settings.impostorCount === n
                          ? 'bg-violet-600/80 text-white'
                          : 'text-slate-500 hover:bg-white/[0.03]'
                        }
                      `}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showImpostorSettings && room.settings.impostorCount > 1 && (
              <button
                onClick={() => updateRoomSettings(room.code, { settings: { revealOnVote: !room.settings.revealOnVote } })}
                className="flex items-center justify-between py-3 text-[12px]"
              >
                <span className="text-slate-400">Otkrij ulogu pri glasanju</span>
                <div className={`w-8 h-[18px] rounded-full transition-colors duration-200 relative ${room.settings.revealOnVote ? 'bg-violet-600' : 'bg-white/[0.06]'}`}>
                  <div className={`absolute top-[3px] w-3 h-3 rounded-full bg-white transition-transform duration-200 ${room.settings.revealOnVote ? 'translate-x-[14px]' : 'translate-x-[3px]'}`} />
                </div>
              </button>
            )}
          </motion.div>
        )}

        {!isHost && (
          <motion.p
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="text-[12px] text-slate-600 text-center py-6"
          >
            Čekamo da host započne misiju...
          </motion.p>
        )}

        {/* Start */}
        <div className="mt-auto pt-6">
          {isHost && (
            <Button fullWidth disabled={!canStart || starting} onClick={handleStart}>
              {starting ? 'Pokretanje...' : canStart ? 'Započni misiju' : `Još ${3 - playerCount} agenta`}
            </Button>
          )}
        </div>
      </div>

      {/* Countdown */}
      <AnimatePresence>
        {countdown !== null && countdown > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-void/95"
          >
            <motion.span
              key={countdown}
              initial={{ scale: 4, opacity: 0, filter: 'blur(10px)' }}
              animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
              exit={{ scale: 0.3, opacity: 0 }}
              transition={{ type: 'spring' as const, stiffness: 200, damping: 15 }}
              className="text-[140px] font-bold text-violet-400 text-glow-v leading-none tabular-nums"
            >
              {countdown}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
