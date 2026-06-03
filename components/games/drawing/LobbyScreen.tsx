'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DrawingRoom } from '@/lib/types/drawing';
import { Button } from '@/components/ui/Button';
import { LobbyPlayerList } from '@/components/shared/LobbyPlayerList';
import { startGame, leaveRoom } from '@/lib/firestore/drawing';
import { useRouter } from 'next/navigation';

const ACCENT = '#f59e0b';
const ACCENT2 = '#fbbf24';

interface Props {
  room: DrawingRoom;
  playerId: string;
}

function DecryptCode({ code }: { code: string }) {
  const [revealed, setReveled] = useState(0);
  const chars = 'ABCDEFGHKLMNPQRSTUVWXYZ23456789';
  useEffect(() => {
    if (revealed >= code.length) return;
    const t = setTimeout(() => setReveled((r) => r + 1), 120);
    return () => clearTimeout(t);
  }, [revealed, code.length]);
  return (
    <span className="inline-flex tracking-[0.4em]">
      {code.split('').map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={i < revealed ? 'text-amber-400' : 'text-slate-600'}
        >
          {i < revealed ? char : chars[Math.floor(Math.random() * chars.length)]}
        </motion.span>
      ))}
    </span>
  );
}

export function LobbyScreen({ room, playerId }: Props) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);

  const isHost = room.hostId === playerId;
  const playerCount = room.players.length;
  const canStart = playerCount >= 3;

  function copyCode() {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleStart() {
    setStarting(true);
    await startGame(room.code);
  }

  async function handleLeave() {
    await leaveRoom(room.code, playerId);
    router.push('/');
  }

  return (
    <div
      className="relative flex flex-col flex-1 px-5 py-8 h-screen-safe overflow-y-auto"
      style={{ background: 'var(--bg-base)' }}
    >
      <div className="w-full max-w-[400px] mx-auto flex flex-col gap-7 flex-1">
        {/* Room code */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <div
            className="rounded-2xl border border-white/10 bg-white/[0.05] p-5"
            style={{ backdropFilter: 'blur(12px)' }}
          >
            <p className="text-[10px] text-slate-500 tracking-[0.2em] uppercase mb-2">
              Pristupni kod
            </p>
            <button onClick={copyCode} className="block cursor-pointer">
              <span className="text-[36px] font-bold">
                <DecryptCode code={room.code} />
              </span>
            </button>
            <div className="h-4 mt-1">
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.span
                    key="c"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-[10px] text-emerald-400"
                  >
                    Kopirano
                  </motion.span>
                ) : (
                  <motion.span
                    key="h"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    exit={{ opacity: 0 }}
                    className="text-[10px] text-slate-500"
                  >
                    tapni da kopiraš
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Players */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-baseline justify-between mb-3">
            <p className="text-[10px] text-slate-500 tracking-[0.2em] uppercase">
              Igrači · {playerCount}
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

          <div className="w-full h-px mb-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <motion.div
              className={`h-px ${canStart ? 'bg-emerald-500/50' : 'bg-amber-500/40'}`}
              animate={{ width: `${Math.min((playerCount / 3) * 100, 100)}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            />
          </div>

          <LobbyPlayerList
            players={room.players}
            selfId={playerId}
            hostId={room.hostId}
            canKick={false}
          />
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 flex flex-col gap-1"
        >
          <p className="text-[11px] text-white/40">
            Svako od <span className="text-amber-400">{playerCount}</span> igrača crta jednom.
          </p>
          <p className="text-[11px] text-white/30">
            80 sekundi po rundi · 3–8 igrača
          </p>
        </motion.div>

        {!isHost && (
          <motion.p
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="text-[12px] text-slate-600 text-center py-4"
          >
            Čekamo da host pokrene igru...
          </motion.p>
        )}

        <div className="mt-auto pt-4 flex flex-col gap-3">
          {isHost && (
            <Button
              fullWidth
              disabled={!canStart || starting}
              onClick={handleStart}
              className="!rounded-2xl !text-white"
              style={{
                background: canStart
                  ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`
                  : undefined,
                boxShadow: canStart ? '0 4px 16px rgba(245,158,11,0.4)' : undefined,
              }}
            >
              {starting
                ? 'Pokretanje...'
                : canStart
                ? 'Pokreni igru'
                : `Još ${3 - playerCount} igrača`}
            </Button>
          )}

          <button
            onClick={handleLeave}
            className="text-[12px] text-slate-600 hover:text-slate-400 transition-colors py-2 cursor-pointer"
          >
            Napusti sobu
          </button>
        </div>
      </div>
    </div>
  );
}
