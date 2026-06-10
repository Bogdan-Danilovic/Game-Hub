'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flip7Room } from '@/lib/types/flip7';
import { Button } from '@/components/shared/Button';
import { Flip7PlayerPanel } from '@/components/games/flip7/Flip7PlayerPanel';
import { AdBanner } from '@/components/ads/AdBanner';
import { hexA } from '@/lib/utils';
import {
  sayJosJednu,
  sayDosta,
  applyStop,
  applyOkreniTri,
  hostSkipTarget,
} from '@/lib/firestore/flip7';

interface Props {
  room: Flip7Room;
  playerId: string;
}

const ACCENT = '#f59e0b'; // Flip 7 amber identity

const PENDING_COPY: Record<'stop' | 'okreni_tri', { title: string; desc: string }> = {
  stop: { title: 'Izvučen STOP', desc: 'Izaberi ko se bezbedno zaustavlja (banka poene)' },
  okreni_tri: { title: 'Izvučen OKRENI TRI', desc: 'Izaberi ko mora da okrene tri karte' },
};

const primaryBtn = {
  background: `linear-gradient(135deg, ${ACCENT}, ${hexA(ACCENT, 0.8)})`,
  boxShadow: `0 4px 16px ${hexA(ACCENT, 0.4)}`,
};

export function GameScreen({ room, playerId }: Props) {
  const [busy, setBusy] = useState(false);

  const target = room.players[room.currentTargetIndex];
  const pending = room.pendingAction;
  const me = room.players.find((p) => p.id === playerId);

  const myTurn = pending.type === null && target?.id === playerId && target?.status === 'active';
  const iResolve = pending.type !== null && pending.byPlayerId === playerId;
  const chooser = pending.byPlayerId ? room.players.find((p) => p.id === pending.byPlayerId) : null;
  const activePlayers = room.players.filter((p) => p.status === 'active');
  const focusedId = pending.type === null ? target?.id : pending.byPlayerId;

  const isHost = room.hostId === playerId;
  const blocker = focusedId ? room.players.find((p) => p.id === focusedId) : null;
  const canHostSkip = isHost && !!blocker && !blocker.isConnected;

  async function run(fn: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex flex-1 flex-col h-screen-safe">
      {/* Top bar */}
      <div className="flex-shrink-0 px-5 pb-3 pt-20">
        <div className="flex items-center justify-center gap-2 text-[11px] font-semibold">
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 uppercase tracking-[0.12em] text-amber-200/60">
            Runda {room.roundNumber}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 tabular-nums text-amber-100/70">
            Cilj {room.settings.targetScore}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 tabular-nums text-amber-100/70">
            Špil {room.deck.length}
          </span>
        </div>
        <AnimatePresence mode="wait">
          {room.lastEvent && (
            <motion.p
              key={room.lastEvent}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-2.5 min-h-[18px] text-center text-[13px] leading-snug text-amber-100/90"
            >
              {room.lastEvent}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Diskretan reklamni bar — statičan, ne smeta igri, lagana zarada */}
      <div className="flex-shrink-0 px-5 pb-1 opacity-70">
        {/* TODO: zameniti slot ID — prikazuje se tokom igre */}
        <AdBanner slot="TODO_SLOT_GAME" format="horizontal" className="rounded-lg" />
      </div>

      {/* Board */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto no-scrollbar px-5 pb-4">
        {room.players.map((p) => (
          <Flip7PlayerPanel
            key={p.id}
            player={p}
            isSelf={p.id === playerId}
            focused={p.id === focusedId}
          />
        ))}
      </div>

      {/* Action bar */}
      <div
        className="flex-shrink-0 border-t px-5 pb-8 pt-3"
        style={{
          borderColor: 'rgba(255,255,255,0.06)',
          background: 'rgba(7,13,24,0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        <AnimatePresence mode="wait">
          {canHostSkip ? (
            <motion.div key="host-skip" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-2.5">
              <p className="text-center text-[12px] text-amber-100/70">
                <span className="font-semibold text-amber-400">{blocker?.name ?? 'Igrač'}</span> nije povezan
                {pending.type
                  ? ` — treba da reši ${pending.type === 'stop' ? 'STOP' : 'OKRENI TRI'}`
                  : ' a na potezu je'}
              </p>
              <Button
                fullWidth
                disabled={busy}
                onClick={() => run(() => hostSkipTarget(room.code, playerId))}
                className="!rounded-2xl !text-white"
                style={primaryBtn}
              >
                Preskoči igrača
              </Button>
            </motion.div>
          ) : iResolve && pending.type ? (
            <motion.div key="resolve" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-wide text-amber-400">
                  {PENDING_COPY[pending.type].title}
                </p>
                <p className="text-[12px] text-amber-100/60">{PENDING_COPY[pending.type].desc}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {activePlayers.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      run(() =>
                        pending.type === 'stop'
                          ? applyStop(room.code, p.id)
                          : applyOkreniTri(room.code, p.id)
                      )
                    }
                    className="min-h-[46px] rounded-xl border border-amber-500/30 bg-amber-500/15 px-4 py-2.5 text-[14px] font-semibold text-amber-200 transition-colors hover:border-amber-400 hover:bg-amber-500/25 active:bg-amber-500/30 disabled:opacity-40"
                  >
                    {p.id === playerId ? 'Ti' : p.name}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : pending.type ? (
            <motion.p key="wait-pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-3 text-center text-[13px] text-amber-100/50">
              {chooser?.name ?? 'Igrač'} bira metu za {pending.type === 'stop' ? 'STOP' : 'OKRENI TRI'}…
              {chooser && !chooser.isConnected && <span className="text-amber-100/30"> · nije povezan</span>}
            </motion.p>
          ) : myTurn ? (
            <motion.div key="my-turn" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-3">
              <Button
                fullWidth
                disabled={busy}
                onClick={() => run(() => sayJosJednu(room.code, playerId))}
                className="!rounded-2xl !text-white"
                style={primaryBtn}
              >
                Još jednu
              </Button>
              <Button
                fullWidth
                variant="secondary"
                disabled={busy}
                onClick={() => run(() => sayDosta(room.code, playerId))}
                className="!rounded-2xl !border-emerald-500/40 !text-emerald-300 hover:!border-emerald-400 hover:!text-emerald-200"
              >
                Dosta
              </Button>
            </motion.div>
          ) : me && me.status !== 'active' ? (
            <motion.p key="im-out" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-3 text-center text-[13px] text-amber-100/40">
              Sačekaj kraj runde…
            </motion.p>
          ) : (
            <motion.p key="other-turn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-3 text-center">
              <span className="text-[12px] text-amber-100/40">Na potezu </span>
              <motion.span
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 1.8 }}
                className="text-[13px] font-semibold text-amber-300"
              >
                {target?.name ?? '—'}
              </motion.span>
              {target && !target.isConnected && (
                <span className="text-[12px] text-amber-100/30"> · nije povezan</span>
              )}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
