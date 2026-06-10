'use client';

import { usePrefilledName } from '@/hooks/usePrefilledName';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Users } from 'lucide-react';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { GameIcon } from '@/components/GameIcon';
import { getGameById } from '@/lib/games/registry';
import { hexA } from '@/lib/utils';
import { createRoom, joinRoom } from '@/lib/firestore/drawing';
import { useAuth } from '@/hooks/useAuth';

const GAME = getGameById('drawing')!;
const ACCENT = GAME.accentColor;
const ONLINE = '#30d158';
const RULES = [
  'Svaki igrač crta jednom — bira pojam od 3 ponuđena.',
  'Ostali pogađaju — ko brže pogodi, više bodova osvaja.',
  'Crtač dobija 50 bodova za svakog igrača koji pogodi.',
];

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

const shake = { x: [0, -6, 6, -4, 4, -2, 2, 0], transition: { duration: 0.35 } };

export function HomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [name, setName] = usePrefilledName(profile?.displayName);

  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [errorKey, setErrorKey] = useState(0);
  const [loading, setLoading] = useState<'create' | 'join' | null>(null);

  const NAME_REGEX = /^[\p{L}\p{N} ]+$/u;
  const trimmedName = name.trim();
  const nameValid = trimmedName.length >= 2 && trimmedName.length <= 16 && NAME_REGEX.test(trimmedName);

  function showError(msg: string) { setError(msg); setErrorKey((k) => k + 1); }

  async function handleCreate() {
    if (!nameValid) return;
    setError(''); setLoading('create');
    try {
      const { code, playerId } = await createRoom(trimmedName);
      localStorage.setItem('playerId', playerId);
      localStorage.setItem('playerName', trimmedName);
      router.push(`/games/drawing/room/${code}`);
    } catch (err) { showError(err instanceof Error ? err.message : 'Greška.'); setLoading(null); }
  }

  async function handleJoin() {
    if (!nameValid || roomCode.trim().length !== 5) return;
    setError(''); setLoading('join');
    try {
      const code = roomCode.trim().toUpperCase();
      const { playerId, error: joinError } = await joinRoom(code, trimmedName);
      if (joinError) { showError(joinError); setLoading(null); return; }
      localStorage.setItem('playerId', playerId);
      localStorage.setItem('playerName', trimmedName);
      router.push(`/games/drawing/room/${code}`);
    } catch (err) { showError(err instanceof Error ? err.message : 'Greška.'); setLoading(null); }
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="mx-auto flex w-full max-w-[400px] flex-col gap-6 px-5 pb-14 pt-20">

        <motion.button
          {...fadeIn(0.05)}
          type="button"
          onClick={() => router.push('/')}
          aria-label="Nazad na hub"
          className="flex h-9 w-9 items-center justify-center self-start rounded-full text-white"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <ArrowLeft size={18} strokeWidth={2.2} />
        </motion.button>

        {/* Hero */}
        <motion.div
          {...fadeIn(0.15)}
          className="rounded-3xl p-6"
          style={{
            background: `linear-gradient(160deg, ${hexA(ACCENT, 0.28)} 0%, rgba(0,0,0,0.85) 100%)`,
            border: `1px solid ${hexA(ACCENT, 0.25)}`,
            boxShadow: `0 20px 60px ${hexA(ACCENT, 0.25)}`,
          }}
        >
          <div className="mb-4 flex items-center gap-4">
            <GameIcon game={GAME} size={64} />
            <div className="min-w-0 flex-1">
              <div className="text-[26px] font-extrabold tracking-[-0.5px] text-white">{GAME.name}</div>
              <div className="mt-1 inline-flex items-center gap-1.5">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: ONLINE, boxShadow: `0 0 6px ${ONLINE}`, animation: 'gh-pulse 2s ease-in-out infinite' }}
                />
                <span className="text-[13px] font-semibold" style={{ color: ONLINE }}>Dostupno</span>
              </div>
            </div>
          </div>
          <p className="m-0 text-sm leading-relaxed text-white/70">{GAME.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.08] px-3 py-1.5 text-[13px] font-semibold text-white">
              <Users size={14} strokeWidth={2} />{GAME.minPlayers}–{GAME.maxPlayers}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.08] px-3 py-1.5 text-[13px] font-semibold text-white">
              <Clock size={14} strokeWidth={2} />{GAME.avgDuration}
            </span>
            {GAME.tags.map((tag) => (
              <span key={tag} className="rounded-full px-3 py-1.5 text-[13px] font-semibold capitalize text-white"
                style={{ background: hexA(ACCENT, 0.18), border: `1px solid ${hexA(ACCENT, 0.35)}` }}>
                {tag}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Name + actions */}
        <motion.div {...fadeIn(0.3)} className="flex flex-col gap-4">
          <Input
            label="Tvoje ime"
            placeholder="Unesi ime"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={16}
            autoComplete="off"
            className="!rounded-2xl !border-white/10 !bg-white/[0.05] !text-white focus:!border-amber-500/60 focus:!ring-amber-500/25"
          />
          <Button fullWidth disabled={!nameValid || loading !== null} onClick={handleCreate}
            className="!rounded-2xl !text-white"
            style={{ background: `linear-gradient(135deg, ${ACCENT}, ${hexA(ACCENT, 0.8)})`, boxShadow: `0 4px 16px ${hexA(ACCENT, 0.4)}` }}>
            {loading === 'create'
              ? <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1 }}>Kreiranje...</motion.span>
              : 'Napravi sobu'}
          </Button>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Input label="Kod sobe" placeholder="_ _ _ _ _"
                value={roomCode} onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={5}
                className="!rounded-2xl !border-white/10 !bg-white/[0.05] !text-white text-center text-[16px] font-bold uppercase tracking-[0.4em] focus:!border-amber-500/60 focus:!ring-amber-500/25" />
            </div>
            <Button variant="secondary"
              disabled={!nameValid || roomCode.trim().length !== 5 || loading !== null}
              onClick={handleJoin}
              className="mb-[1px] shrink-0 !rounded-2xl !border-white/14 !text-white"
              style={{ background: 'rgba(255,255,255,0.08)' }}>
              {loading === 'join' ? '...' : 'Uđi'}
            </Button>
          </div>
          {error && (
            <motion.p key={errorKey} initial={{ opacity: 0 }} animate={{ opacity: 1, ...shake }}
              className="text-[13px] text-red-400/90">{error}</motion.p>
          )}
        </motion.div>

        {/* How to play */}
        <motion.div {...fadeIn(0.45)}>
          <div className="mb-3 text-lg font-extrabold tracking-[-0.3px] text-white">Kako se igra</div>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05]">
            {RULES.map((rule, i) => (
              <div key={rule} className={`flex items-center gap-3 px-4 py-3.5 ${i ? 'border-t border-white/[0.07]' : ''}`}>
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold text-white"
                  style={{ background: `linear-gradient(135deg, ${ACCENT}, ${hexA(ACCENT, 0.7)})` }}>
                  {i + 1}
                </div>
                <span className="text-sm leading-snug text-white/85">{rule}</span>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
