'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImpostorRoom, Category, GameMode } from '@/lib/types/impostor';
import { CATEGORIES } from '@/lib/prompts/index';
import { Button } from '@/components/ui/Button';
import { PlayerCard } from '@/components/ui/PlayerCard';
import { updateRoomSettings, kickPlayer, startGame } from '@/lib/firestore/impostor';

interface Props { room: ImpostorRoom; playerId: string; }

const CATEGORY_KEYS = Object.keys(CATEGORIES) as Category[];
const MODE_LABELS: Record<GameMode, string> = { sentences: 'Rečenice', concepts: 'Pojmovi' };

function DecryptCode({ code }: { code: string }) {
  const [revealed, setRevealed] = useState(0);
  const chars = 'ABCDEFGHKLMNPQRSTUVWXYZ23456789';
  useEffect(() => {
    if (revealed >= code.length) return;
    const t = setTimeout(() => setRevealed(r => r + 1), 120);
    return () => clearTimeout(t);
  }, [revealed, code.length]);
  return (
    <span className="inline-flex tracking-[0.4em]">
      {code.split('').map((char, i) => (
        <motion.span key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className={i < revealed ? 'text-violet-400' : 'text-slate-600'}>
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

  const handleStart = useCallback(() => { setStarting(true); setCountdown(3); }, []);

  function copyCode() {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative flex flex-col flex-1 px-5 py-8 h-screen-safe overflow-y-auto"
      style={{ background: 'var(--bg-base)' }}>
      <div className="w-full max-w-[400px] mx-auto flex flex-col gap-7 flex-1">

        {/* Room code */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <p className="text-[10px] text-slate-500 tracking-[0.2em] uppercase mb-2">Pristupni kod</p>
          <button onClick={copyCode} className="block cursor-pointer">
            <span className="text-[36px] font-bold text-glow-v">
              <DecryptCode code={room.code} />
            </span>
          </button>
          <div className="h-4 mt-1">
            <AnimatePresence mode="wait">
              {copied
                ? <motion.span key="c" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-[10px] text-emerald-400">Kopirano</motion.span>
                : <motion.span key="h" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} className="text-[10px] text-slate-500">tapni da kopiraš</motion.span>
              }
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Players — 3-col grid */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-baseline justify-between mb-3">
            <p className="text-[10px] text-slate-500 tracking-[0.2em] uppercase">Agenti · {playerCount}</p>
            {playerCount < 3 && (
              <motion.p animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 2 }}
                className="text-[10px] text-amber-400/70">
                čekamo još {3 - playerCount}
              </motion.p>
            )}
          </div>

          <div className="w-full h-px mb-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <motion.div
              className={`h-px ${canStart ? 'bg-emerald-500/50' : 'bg-amber-500/40'}`}
              animate={{ width: `${Math.min((playerCount / 3) * 100, 100)}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <AnimatePresence mode="popLayout">
              {room.players.map(p => (
                <PlayerCard key={p.id} player={p}
                  isHost={p.id === room.hostId} isSelf={p.id === playerId}
                  canKick={isHost && room.status === 'lobby'}
                  onKick={() => kickPlayer(room.code, p.id)}
                  variant="grid" />
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Host settings */}
        {isHost && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
            className="flex flex-col gap-5">

            {/* Mode */}
            <div>
              <p className="text-[10px] text-slate-500 tracking-[0.2em] uppercase mb-3">Režim</p>
              <div className="flex gap-2">
                {(['sentences', 'concepts'] as GameMode[]).map(mode => {
                  const active = room.gameMode === mode;
                  return (
                    <button key={mode} onClick={() => updateRoomSettings(room.code, { gameMode: mode })}
                      className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold transition-all duration-200 cursor-pointer"
                      style={{
                        background: active ? 'linear-gradient(135deg, #7c3aed, #8b5cf6)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${active ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.06)'}`,
                        color: active ? '#fff' : '#64748b',
                        boxShadow: active ? '0 0 16px rgba(139,92,246,0.35)' : 'none',
                      }}>
                      {MODE_LABELS[mode]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category chips */}
            <div>
              <p className="text-[10px] text-slate-500 tracking-[0.2em] uppercase mb-3">Kategorija</p>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_KEYS.map(cat => {
                  const active = room.category === cat;
                  return (
                    <button key={cat} onClick={() => updateRoomSettings(room.code, { category: cat })}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 cursor-pointer"
                      style={{
                        background: active ? 'linear-gradient(135deg, rgba(124,58,237,0.7), rgba(139,92,246,0.5))' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${active ? 'rgba(139,92,246,0.45)' : 'rgba(255,255,255,0.05)'}`,
                        color: active ? '#e9d5ff' : '#475569',
                        boxShadow: active ? '0 0 10px rgba(139,92,246,0.25)' : 'none',
                      }}>
                      {CATEGORIES[cat].label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Impostor count */}
            {showImpostorSettings && (
              <div>
                <p className="text-[10px] text-slate-500 tracking-[0.2em] uppercase mb-3">Impostora</p>
                <div className="flex gap-2">
                  {Array.from({ length: maxImpostors }, (_, i) => i + 1).map(n => {
                    const active = room.settings.impostorCount === n;
                    return (
                      <button key={n}
                        onClick={() => updateRoomSettings(room.code, { settings: { impostorCount: n } })}
                        className="w-10 h-10 rounded-xl text-[13px] font-bold transition-all duration-200 cursor-pointer"
                        style={{
                          background: active ? 'linear-gradient(135deg, #7c3aed, #8b5cf6)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${active ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.06)'}`,
                          color: active ? '#fff' : '#475569',
                          boxShadow: active ? '0 0 12px rgba(139,92,246,0.3)' : 'none',
                        }}>
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {showImpostorSettings && room.settings.impostorCount > 1 && (
              <button
                onClick={() => updateRoomSettings(room.code, { settings: { revealOnVote: !room.settings.revealOnVote } })}
                className="flex items-center justify-between py-3 text-[12px] cursor-pointer">
                <span className="text-slate-400">Otkrij ulogu pri glasanju</span>
                <div className="w-8 h-[18px] rounded-full transition-colors duration-200 relative"
                  style={{ background: room.settings.revealOnVote ? '#7c3aed' : 'rgba(255,255,255,0.06)' }}>
                  <div className={`absolute top-[3px] w-3 h-3 rounded-full bg-white transition-transform duration-200 ${room.settings.revealOnVote ? 'translate-x-[14px]' : 'translate-x-[3px]'}`} />
                </div>
              </button>
            )}
          </motion.div>
        )}

        {!isHost && (
          <motion.p animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ repeat: Infinity, duration: 3 }}
            className="text-[12px] text-slate-600 text-center py-4">
            Čekamo da host započne misiju...
          </motion.p>
        )}

        <div className="mt-auto pt-4">
          {isHost && (
            <Button fullWidth disabled={!canStart || starting} onClick={handleStart}>
              {starting ? 'Pokretanje...' : canStart ? 'Započni misiju' : `Još ${3 - playerCount} agenta`}
            </Button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {countdown !== null && countdown > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(8,11,20,0.95)' }}>
            <motion.span key={countdown}
              initial={{ scale: 4, opacity: 0, filter: 'blur(10px)' }}
              animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
              exit={{ scale: 0.3, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="text-[140px] font-bold text-violet-400 text-glow-v leading-none tabular-nums">
              {countdown}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
