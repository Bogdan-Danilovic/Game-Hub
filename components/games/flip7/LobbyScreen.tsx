'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Flip7Room } from '@/lib/types/flip7';
import { Button } from '@/components/ui/Button';
import { PlayerCard } from '@/components/ui/PlayerCard';
import { updateSettings, kickPlayer, startGame, leaveRoom } from '@/lib/firestore/flip7';
import { AdBanner } from '@/components/ads/AdBanner';
import { HostUnlockButton } from '@/components/ads/HostUnlockButton';
import { DonationModal } from '@/components/ads/DonationModal';
import { hexA } from '@/lib/utils';

interface Props {
  room: Flip7Room;
  playerId: string;
}

const MIN_PLAYERS = 2;
const TARGET_OPTIONS = [100, 150, 200, 250];
const ACCENT = '#f59e0b'; // Flip 7 amber identity

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

export function LobbyScreen({ room, playerId }: Props) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [donationOpen, setDonationOpen] = useState(false);

  const isHost = room.hostId === playerId;
  const playerCount = room.players.length;
  const canStart = playerCount >= MIN_PLAYERS;
  const targetScore = room.settings.targetScore;

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      startGame(room.code);
      return;
    }
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

  async function handleLeave() {
    await leaveRoom(room.code, playerId);
    router.push('/');
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto no-scrollbar">
      <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col gap-6 px-5 pb-12 pt-20">
        {/* Access code hero */}
        <motion.div
          {...fadeIn(0.05)}
          className="rounded-3xl p-6 text-center"
          style={{
            background: `linear-gradient(160deg, ${hexA(ACCENT, 0.28)} 0%, rgba(0,0,0,0.85) 100%)`,
            border: `1px solid ${hexA(ACCENT, 0.25)}`,
            boxShadow: `0 20px 60px ${hexA(ACCENT, 0.25)}`,
          }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-200/50">Pristupni kod</p>
          <button type="button" onClick={copyCode} className="mt-3 block w-full" aria-label="Kopiraj kod sobe">
            <span
              className="text-[44px] font-extrabold tracking-[0.28em] text-amber-400"
              style={{ textShadow: '0 0 28px rgba(245,158,11,0.45)' }}
            >
              {room.code}
            </span>
          </button>
          <div className="mt-1 h-4 text-[11px]">
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.span key="c" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-emerald-400">
                  Kopirano
                </motion.span>
              ) : (
                <motion.span key="h" initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} className="text-amber-100/50">
                  tapni da kopiraš
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Players */}
        <motion.div {...fadeIn(0.15)} className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <span className="text-lg font-extrabold tracking-[-0.3px] text-white">
              Igrači <span className="text-amber-400/80">{playerCount}</span>
            </span>
            {playerCount < MIN_PLAYERS && (
              <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-[11px] font-semibold text-amber-400/70"
              >
                čekamo još {MIN_PLAYERS - playerCount}
              </motion.span>
            )}
          </div>

          <div className="relative mb-5 h-px w-full bg-white/[0.06]">
            <motion.div
              className={`absolute left-0 top-0 h-px ${canStart ? 'bg-emerald-500/60' : 'bg-amber-500/60'}`}
              animate={{ width: `${Math.min((playerCount / MIN_PLAYERS) * 100, 100)}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
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

        {/* Target score */}
        <motion.div {...fadeIn(0.25)} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-200/50">Ciljni rezultat</p>
          <div className="grid grid-cols-4 gap-2">
            {TARGET_OPTIONS.map((opt) => {
              const active = opt === targetScore;
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={!isHost}
                  onClick={() => updateSettings(room.code, { targetScore: opt })}
                  className={`min-h-[48px] rounded-xl text-[15px] font-bold tabular-nums transition-colors ${
                    active ? 'text-white' : 'border border-white/10 bg-white/[0.04] text-amber-100/65'
                  } ${isHost && !active ? 'hover:bg-white/[0.08] active:bg-white/[0.12]' : ''} ${
                    isHost ? '' : 'cursor-default'
                  }`}
                  style={
                    active
                      ? {
                          background: `linear-gradient(135deg, ${ACCENT}, ${hexA(ACCENT, 0.8)})`,
                          boxShadow: `0 4px 16px ${hexA(ACCENT, 0.4)}`,
                        }
                      : undefined
                  }
                >
                  {opt}
                </button>
              );
            })}
          </div>
          {!isHost && <p className="text-[11px] text-amber-100/35">Samo host menja podešavanja</p>}
        </motion.div>

        {!isHost && (
          <motion.p
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="py-1 text-center text-[12px] text-amber-100/40"
          >
            Čekamo da host započne igru...
          </motion.p>
        )}

        {/* TODO: zameniti slot ID — prikazuje se samo u lobby fazi */}
        <AdBanner slot="TODO_SLOT_LOBBY" format="horizontal" className="overflow-hidden rounded-xl" />

        {isHost && <HostUnlockButton roomCode={room.code} />}

        <button
          type="button"
          onClick={() => setDonationOpen(true)}
          className="w-full rounded-xl py-2.5 text-[11px] text-amber-100/30 transition-colors hover:text-amber-100/50"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          Podržite razvoj — gledaj video
        </button>

        <DonationModal isOpen={donationOpen} onClose={() => setDonationOpen(false)} />

        {/* Footer */}
        <div className="mt-auto flex flex-col gap-3 pt-4">
          {isHost && (
            <Button
              fullWidth
              disabled={!canStart || starting}
              onClick={handleStart}
              className="!rounded-2xl !text-white"
              style={{
                background: `linear-gradient(135deg, ${ACCENT}, ${hexA(ACCENT, 0.8)})`,
                boxShadow: `0 4px 16px ${hexA(ACCENT, 0.4)}`,
              }}
            >
              {starting ? 'Pokretanje...' : canStart ? 'Započni igru' : `Još ${MIN_PLAYERS - playerCount} igrača`}
            </Button>
          )}
          <Button variant="ghost" fullWidth onClick={handleLeave} className="!text-amber-100/40 hover:!text-amber-100/70">
            Napusti sobu
          </Button>
        </div>
      </div>

      {/* Countdown overlay */}
      <AnimatePresence>
        {countdown !== null && countdown > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(7,13,24,0.95)' }}
          >
            <motion.span
              key={countdown}
              initial={{ scale: 4, opacity: 0, filter: 'blur(10px)' }}
              animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
              exit={{ scale: 0.3, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="text-[140px] font-bold leading-none tabular-nums text-amber-400"
              style={{ textShadow: '0 0 40px rgba(245,158,11,0.5)' }}
            >
              {countdown}
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
