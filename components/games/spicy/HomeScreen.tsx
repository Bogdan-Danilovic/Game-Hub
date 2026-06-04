'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { hexA } from '@/lib/utils';
import { getGameById } from '@/lib/games/registry';
import { createRoom, joinRoom } from '@/lib/firestore/spicy';
import { useAuth } from '@/hooks/useAuth';

const GAME = getGameById('spicy')!;
const ACCENT = GAME.accentColor;

const shake = { x: [0, -6, 6, -4, 4, -2, 2, 0], transition: { duration: 0.35 } };
const fadeIn = (delay = 0) => ({
  initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

const RULES = [
  'Odigraj kartu licem nadole — objavi broj i začin (istinito ili ne).',
  'Svaka sledeća objava mora biti veći broj, isti začin.',
  'Izazovi objavu! Pobednik uzima gomilu, gubitnik vuče 2.',
  'Posle 10 → resetuje se na 1–3, začin ostaje isti.',
  'Odigraj poslednju kartu → osvoji trofej (10 poena)!',
];

export function SpicyHomeScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [errKey, setErrKey] = useState(0);
  const [loading, setLoading] = useState<'create' | 'join' | null>(null);

  useEffect(() => {
    if (profile?.displayName && !name) setName(profile.displayName);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.displayName]);

  const NAME_RE = /^[\p{L}\p{N} ]+$/u;
  const trimName = name.trim();
  const nameOk = trimName.length >= 2 && trimName.length <= 16 && NAME_RE.test(trimName);

  function showErr(msg: string) { setError(msg); setErrKey((k) => k + 1); }

  async function handleCreate() {
    if (!nameOk) return;
    setLoading('create');
    try {
      const { code: c, playerId } = await createRoom(trimName);
      localStorage.setItem('playerId', playerId);
      localStorage.setItem('playerName', trimName);
      router.push(`/games/spicy/room/${c}`);
    } catch (e) { showErr(e instanceof Error ? e.message : 'Greška.'); setLoading(null); }
  }

  async function handleJoin() {
    if (!nameOk || code.trim().length !== 5) return;
    setLoading('join');
    try {
      const c = code.trim().toUpperCase();
      const { playerId, error: err } = await joinRoom(c, trimName);
      if (err) { showErr(err); setLoading(null); return; }
      localStorage.setItem('playerId', playerId);
      localStorage.setItem('playerName', trimName);
      router.push(`/games/spicy/room/${c}`);
    } catch (e) { showErr(e instanceof Error ? e.message : 'Greška.'); setLoading(null); }
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="mx-auto flex w-full max-w-[400px] flex-col gap-6 px-5 pb-14 pt-20">
        <motion.button {...fadeIn(0.05)} type="button" onClick={() => router.push('/')} aria-label="Nazad na hub"
          className="flex h-9 w-9 items-center justify-center self-start rounded-full text-white"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
          <ArrowLeft size={18} strokeWidth={2.2} />
        </motion.button>

        {/* Hero */}
        <motion.div {...fadeIn(0.15)} className="rounded-3xl p-6"
          style={{ background: `linear-gradient(160deg, ${hexA(ACCENT, 0.22)} 0%, rgba(0,0,0,0.85) 100%)`, border: `1px solid ${hexA(ACCENT, 0.25)}`, boxShadow: `0 20px 60px ${hexA(ACCENT, 0.18)}` }}>
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl text-3xl"
              style={{ background: hexA(ACCENT, 0.2), border: `1px solid ${hexA(ACCENT, 0.35)}` }}>
              {GAME.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[26px] font-extrabold tracking-[-0.5px] text-white">{GAME.name}</div>
              <div className="mt-0.5 text-sm text-white/60">Blefirај. Izazivaj. Pobeđuj.</div>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-white/70">{GAME.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.08] px-3 py-1.5 text-[13px] font-semibold text-white">
              <Users size={14} /> {GAME.minPlayers}–{GAME.maxPlayers}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.08] px-3 py-1.5 text-[13px] font-semibold text-white">
              <Clock size={14} /> {GAME.avgDuration}
            </span>
          </div>
        </motion.div>

        {/* Name + actions */}
        <motion.div {...fadeIn(0.3)} className="flex flex-col gap-4">
          <Input label="Tvoje ime" placeholder="Unesi ime" value={name} onChange={(e) => setName(e.target.value)} maxLength={16} autoComplete="off"
            className="focus:!border-red-500/60 focus:!ring-red-500/25" />
          <Button fullWidth disabled={!nameOk || loading !== null} onClick={handleCreate} className="!rounded-2xl !text-white"
            style={{ background: nameOk ? `linear-gradient(135deg,${ACCENT},#dc2626)` : undefined, boxShadow: nameOk ? `0 4px 16px ${hexA(ACCENT, 0.4)}` : undefined }}>
            {loading === 'create' ? <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1 }}>Kreiranje...</motion.span> : 'Napravi sobu'}
          </Button>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Input label="Kod sobe" placeholder="_ _ _ _ _" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={5}
                className="text-center text-[16px] font-bold uppercase tracking-[0.4em] focus:!border-red-500/60 focus:!ring-red-500/25" />
            </div>
            <Button variant="secondary" disabled={!nameOk || code.trim().length !== 5 || loading !== null} onClick={handleJoin}
              className="mb-[1px] shrink-0 !rounded-2xl !border-white/14 !text-white" style={{ background: 'rgba(255,255,255,0.08)' }}>
              {loading === 'join' ? '...' : 'Uđi'}
            </Button>
          </div>
          {error && (
            <motion.p key={errKey} initial={{ opacity: 0 }} animate={{ opacity: 1, ...shake }} className="text-[13px] text-red-400/90">{error}</motion.p>
          )}
        </motion.div>

        {/* Rules */}
        <motion.div {...fadeIn(0.45)}>
          <div className="mb-3 text-lg font-extrabold tracking-[-0.3px] text-white">Kako se igra</div>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            {RULES.map((rule, i) => (
              <div key={rule} className={`flex items-start gap-3 px-4 py-3.5 ${i ? 'border-t border-white/[0.06]' : ''}`}>
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-extrabold text-white"
                  style={{ background: `linear-gradient(135deg,${ACCENT},#dc2626)` }}>{i + 1}</div>
                <span className="text-sm leading-snug text-white/80">{rule}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
