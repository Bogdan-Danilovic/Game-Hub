'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { UnoRoom, UnoCard as UnoCardType, UnoColor, UnoPlayer } from '@/lib/types/uno';
import { canPlayCard } from '@/lib/games/uno/engine';
import { playCard, drawCard, chooseColor, callUno, leaveRoom } from '@/lib/firestore/uno';
import { UnoCardComponent, ColorPicker, COLOR_HEX } from './UnoCard';
import { hexA } from '@/lib/utils';

interface Props {
  room: UnoRoom;
  playerId: string;
}

const ACCENT = '#f97316';

const DIR_ICON = { 1: '→', [-1]: '←' };

function cardCount(hand: UnoCardType[]): string {
  return `${hand.length}🃏`;
}

export function GameScreen({ room, playerId }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const me = room.players.find((p) => p.id === playerId) as UnoPlayer | undefined;
  const currentPlayer = room.players[room.currentPlayerIndex];
  const myTurn = currentPlayer?.id === playerId && room.pendingAction.type === null;
  const iChooseColor =
    room.pendingAction.type === 'choose_color' && room.pendingAction.byPlayerId === playerId;
  const colorChooser = room.pendingAction.byPlayerId
    ? room.players.find((p) => p.id === room.pendingAction.byPlayerId)
    : null;

  async function run(fn: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    try { await fn(); } finally { setBusy(false); }
  }

  async function handlePlayCard(cardId: string) {
    if (!myTurn) return;
    await run(() => playCard(room.code, playerId, cardId));
  }

  async function handleDraw() {
    if (!myTurn) return;
    await run(() => drawCard(room.code, playerId));
  }

  async function handleChooseColor(color: UnoColor) {
    if (!iChooseColor) return;
    await run(() => chooseColor(room.code, playerId, color));
  }

  async function handleUno() {
    await run(() => callUno(room.code, playerId));
  }

  async function handleLeave() {
    await leaveRoom(room.code, playerId);
    router.push('/');
  }

  return (
    <div className="relative flex flex-1 flex-col h-screen-safe overflow-hidden">
      {/* Status bar */}
      <div className="flex-shrink-0 px-4 pt-12 pb-2">
        <div className="flex items-center justify-between gap-2 text-[11px] font-semibold">
          <div className="flex gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 uppercase tracking-[0.12em] text-orange-200/60">
              Runda {room.roundNumber}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-orange-100/70">
              Špil {room.deck.length}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-orange-100/70">
              Smjer {DIR_ICON[room.direction]}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLeave}
            className="text-[10px] text-white/20 hover:text-white/50 transition-colors px-2 py-1"
          >
            Izlaz
          </button>
        </div>

        <AnimatePresence mode="wait">
          {room.lastEvent && (
            <motion.p
              key={room.lastEvent}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-2 min-h-[18px] text-center text-[13px] leading-snug text-orange-100/80"
            >
              {room.lastEvent}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Players row */}
      <div className="flex-shrink-0 px-4 pb-2">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {room.players.map((p, i) => {
            const isActive = i === room.currentPlayerIndex && room.pendingAction.type === null;
            const isChooser = room.pendingAction.byPlayerId === p.id;
            return (
              <div
                key={p.id}
                className="flex-shrink-0 flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition-colors"
                style={{
                  background: isActive || isChooser
                    ? hexA(ACCENT, 0.2)
                    : 'rgba(255,255,255,0.04)',
                  border: isActive || isChooser
                    ? `1px solid ${hexA(ACCENT, 0.4)}`
                    : '1px solid rgba(255,255,255,0.08)',
                  minWidth: 72,
                }}
              >
                <span className="text-[13px] font-bold text-white truncate max-w-[80px]">
                  {p.id === playerId ? 'Ti' : p.name}
                </span>
                <span className="text-[11px] text-white/50">{cardCount(p.hand)}</span>
                {p.saidUno && p.hand.length === 1 && (
                  <span
                    className="text-[10px] font-extrabold px-1.5 py-0.5 rounded"
                    style={{ background: hexA(ACCENT, 0.3), color: ACCENT }}
                  >
                    UNO!
                  </span>
                )}
                {!p.isConnected && (
                  <span className="text-[10px] text-red-400/70">offline</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current discard top + color indicator */}
      <div className="flex-shrink-0 flex flex-col items-center gap-3 py-3">
        <div className="flex items-center gap-4">
          {/* Deck (face-down) */}
          <div className="relative">
            <UnoCardComponent card={{ id: 'deck', kind: 'number', color: 'red', value: 0 }} faceDown size="lg" />
            <span
              className="absolute bottom-1 right-1 text-[10px] font-bold text-white/60 bg-black/40 px-1 rounded"
            >
              {room.deck.length}
            </span>
          </div>

          {/* Top card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={room.topCard.id}
              initial={{ scale: 0.8, opacity: 0, rotateY: 90 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            >
              <UnoCardComponent card={room.topCard} size="lg" />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Current color indicator */}
        <div
          className="flex items-center gap-1.5 rounded-full px-3 py-1"
          style={{
            background: hexA(COLOR_HEX[room.currentColor], 0.2),
            border: `1px solid ${hexA(COLOR_HEX[room.currentColor], 0.4)}`,
          }}
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: COLOR_HEX[room.currentColor] }}
          />
          <span className="text-[12px] font-semibold text-white/80">
            Aktivna boja
          </span>
        </div>
      </div>

      {/* My hand */}
      <div className="flex-1 flex flex-col justify-end overflow-hidden">
        {me && (
          <div className="px-4 pb-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">
                Tvoje karte ({me.hand.length})
              </span>
              {me.hand.length <= 2 && me.hand.length > 0 && (
                <motion.button
                  type="button"
                  onClick={handleUno}
                  disabled={busy || me.saidUno || me.hand.length !== 1}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-[13px] font-extrabold px-3 py-1 rounded-full transition-all"
                  style={{
                    background: me.saidUno
                      ? hexA(ACCENT, 0.15)
                      : `linear-gradient(135deg, ${ACCENT}, ${hexA(ACCENT, 0.8)})`,
                    color: me.saidUno ? hexA(ACCENT, 0.5) : 'white',
                    boxShadow: me.saidUno ? 'none' : `0 2px 12px ${hexA(ACCENT, 0.4)}`,
                  }}
                >
                  UNO!
                </motion.button>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {me.hand.map((card) => {
                const playable = myTurn && canPlayCard(card, room.topCard, room.currentColor);
                return (
                  <UnoCardComponent
                    key={card.id}
                    card={card}
                    playable={playable}
                    onClick={playable ? () => handlePlayCard(card.id) : undefined}
                    size="md"
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Action bar */}
      <div
        className="flex-shrink-0 border-t px-4 pb-8 pt-3"
        style={{
          borderColor: 'rgba(255,255,255,0.06)',
          background: 'rgba(7,13,24,0.7)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      >
        <AnimatePresence mode="wait">
          {iChooseColor ? (
            <motion.div key="choose-color" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <ColorPicker onChoose={handleChooseColor} disabled={busy} />
            </motion.div>
          ) : room.pendingAction.type === 'choose_color' ? (
            <motion.p key="wait-color" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-3 text-center text-[13px] text-orange-100/50">
              <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.8 }}>
                {colorChooser?.name ?? 'Igrač'} bira boju...
              </motion.span>
            </motion.p>
          ) : myTurn ? (
            <motion.div key="my-turn" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <p className="mb-2 text-center text-[12px] font-semibold" style={{ color: ACCENT }}>
                Tvoj potez — baci kartu ili vuci iz špila
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={handleDraw}
                className="w-full rounded-2xl py-3 text-[14px] font-bold text-white transition-colors"
                style={{
                  background: hexA(ACCENT, 0.15),
                  border: `1px solid ${hexA(ACCENT, 0.3)}`,
                }}
              >
                Vuci kartu iz špila
              </button>
            </motion.div>
          ) : (
            <motion.p key="wait" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-3 text-center">
              <span className="text-[12px] text-orange-100/40">Na potezu </span>
              <motion.span
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 1.8 }}
                className="text-[13px] font-semibold"
                style={{ color: ACCENT }}
              >
                {currentPlayer?.id === playerId ? 'Ti' : currentPlayer?.name ?? '—'}
              </motion.span>
              {currentPlayer && !currentPlayer.isConnected && (
                <span className="text-[12px] text-orange-100/30"> · nije povezan</span>
              )}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
