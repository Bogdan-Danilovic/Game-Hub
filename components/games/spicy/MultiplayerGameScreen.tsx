'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { SpicyRoom, SpicyFirestorePlayer } from '@/lib/games/spicy/firestoreTypes';
import { SpicyCard, SpicyClaim, Spice } from '@/lib/games/spicy/types';
import { isValidClaim } from '@/lib/games/spicy/claimValidator';
import { buildScoreboard } from '@/lib/games/spicy/scoring';
import { playCard, passTurn, challengePlay, voteNoChallenge, confirmChallengeResult, collectTrophy } from '@/lib/firestore/spicy';
import { SpicyCardComponent } from '@/components/games/spicy/SpicyCard';
import { SpiceChip, SPICE_CFG } from '@/components/games/spicy/SpiceChip';
import { Button } from '@/components/shared/Button';
import { X, CheckCircle, Home } from 'lucide-react';

const SPICES: Spice[] = ['chili', 'wasabi', 'pepper'];
const VALUES = Array.from({ length: 10 }, (_, i) => i + 1);

// ─── Claim Modal ──────────────────────────────────────────────────────────────
function ClaimModal({ hand, lastClaim, isFirstOnPile, onConfirm, onClose }: {
  hand: SpicyCard[]; lastClaim: SpicyClaim | null; isFirstOnPile: boolean;
  onConfirm: (cardId: string, claim: SpicyClaim) => void; onClose: () => void;
}) {
  const [sel, setSel] = useState<string | null>(null);
  const [spice, setSpice] = useState<Spice>('chili');
  const [value, setValue] = useState(1);
  const claim = { spice, value };
  const valid = sel !== null && isValidClaim(claim, lastClaim, isFirstOnPile);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-t-3xl"
        style={{ background: '#0f1320', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none' }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="text-base font-bold text-white">Odigraj kartu</div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}><X size={16} className="text-white/50" /></button>
        </div>
        <div className="px-5 pb-3">
          <p className="mb-3 text-xs uppercase tracking-wider text-white/40">Izaberi kartu</p>
          <div className="flex gap-2 overflow-x-auto pb-2">{hand.map((c) => <SpicyCardComponent key={c.id} card={c} faceUp selected={sel === c.id} onClick={() => setSel(c.id)} />)}</div>
        </div>
        <div className="px-5 pb-3">
          <p className="mb-2 text-xs uppercase tracking-wider text-white/40">Začin</p>
          <div className="flex gap-2">
            {SPICES.map((s) => { const cfg = SPICE_CFG[s]; const active = spice === s; return (
              <button key={s} onClick={() => setSpice(s)} className="flex-1 rounded-xl py-2.5 text-sm font-semibold"
                style={{ background: active ? `${cfg.color}22` : 'rgba(255,255,255,0.05)', border: `1.5px solid ${active ? cfg.color : 'rgba(255,255,255,0.1)'}`, color: active ? cfg.color : '#94a3b8' }}>
                {cfg.emoji} {cfg.label}
              </button>
            ); })}
          </div>
        </div>
        <div className="px-5 pb-3">
          <p className="mb-2 text-xs uppercase tracking-wider text-white/40">Broj</p>
          <div className="grid grid-cols-5 gap-2">
            {VALUES.map((v) => { const avail = isValidClaim({ spice, value: v }, lastClaim, isFirstOnPile); const active = value === v; return (
              <button key={v} onClick={() => avail && setValue(v)} disabled={!avail} className="rounded-xl py-2.5 text-sm font-bold disabled:opacity-30"
                style={{ background: active ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.05)', border: `1.5px solid ${active ? '#ef4444' : 'rgba(255,255,255,0.1)'}`, color: active ? '#ef4444' : '#e2e8f0' }}>
                {v}
              </button>
            ); })}
          </div>
        </div>
        {sel && (
          <div className="mx-5 mb-3 rounded-xl px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
            Objava: <span className="font-bold text-white">{value} </span>
            <span style={{ color: SPICE_CFG[spice].color }}>{SPICE_CFG[spice].emoji} {SPICE_CFG[spice].label}</span>
            {valid ? <CheckCircle size={14} className="ml-2 inline text-green-400" /> : <span className="ml-2 text-red-400 text-xs">Nevažeće</span>}
          </div>
        )}
        <div className="px-5 pb-8">
          <Button fullWidth disabled={!valid} onClick={() => valid && sel && onConfirm(sel, claim)}
            style={{ background: valid ? 'linear-gradient(135deg,#ef4444,#dc2626)' : undefined, boxShadow: valid ? '0 4px 16px rgba(239,68,68,0.4)' : undefined }}>
            Odigraj
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Game Screen ─────────────────────────────────────────────────────────
interface Props { room: SpicyRoom; playerId: string; }

export function SpicyMultiplayerGameScreen({ room, playerId }: Props) {
  const router = useRouter();
  const [claimOpen, setClaimOpen] = useState(false);

  const myIdx = room.players.findIndex((p) => p.id === playerId);
  const me = room.players[myIdx] as SpicyFirestorePlayer | undefined;
  const isMyTurn = room.currentPlayerIndex === myIdx;

  const cardPlayerIdx = (room.status === 'last_card_window' || room.status === 'challenge_result')
    ? (room.lastCardPlayerIndex ?? room.currentPlayerIndex)
    : room.currentPlayerIndex;
  const isCardPlayer = cardPlayerIdx === myIdx;
  const alreadyVoted = room.noChallengeVotes.includes(playerId);

  function handlePlay(cardId: string, claim: SpicyClaim) {
    setClaimOpen(false);
    playCard(room.code, playerId, cardId, claim);
  }

  // ── Finished ────────────────────────────────────────────────────────────────
  if (room.status === 'finished') {
    const scores = buildScoreboard(room.players.map((p) => ({
      id: p.id, name: p.name, hand: p.hand, wonCards: new Array(p.wonCardsCount).fill(null), trophies: p.trophies,
    })));
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex min-h-dvh flex-col items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-6 text-center">
            <div className="text-5xl mb-3">🌶️</div>
            <div className="text-2xl font-black text-white">Kraj igre!</div>
            {room.winnerId && <div className="mt-2 text-sm font-semibold text-yellow-400">🏆 {room.players.find((p) => p.id === room.winnerId)?.name}</div>}
          </div>
          <div className="mb-5 space-y-2">
            {scores.map((s, i) => (
              <div key={s.player.id} className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
                style={{ background: i === 0 ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${i === 0 ? 'rgba(251,191,36,0.3)' : 'rgba(255,255,255,0.08)'}` }}>
                <span className="w-6 text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white truncate">{s.player.name}</div>
                  <div className="text-xs text-white/40">🏆×{s.player.trophies} 🃏×{s.player.wonCards.length} ✋−{s.player.hand.length}</div>
                </div>
                <div className="text-xl font-black text-white">{s.score}</div>
              </div>
            ))}
          </div>
          <Button variant="ghost" fullWidth onClick={() => router.push('/')} className="gap-2"><Home size={16} /> Početak</Button>
        </div>
      </motion.div>
    );
  }

  // ── Pile section helper ──────────────────────────────────────────────────────
  const pileSection = (
    <div className="rounded-2xl p-4 mb-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-white/40">Paprena gomila</span>
        <span className="text-xs text-white/30">Špil: {room.drawPile.length}</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-12 flex-shrink-0">
          {room.pile.length === 0 ? (
            <div className="h-full w-full rounded-xl border-2 border-dashed border-white/15 flex items-center justify-center"><span className="text-xs text-white/30">Prazna</span></div>
          ) : (
            <>
              {[...Array(Math.min(2, room.pile.length - 1))].map((_, k) => (
                <div key={k} className="absolute h-full w-full rounded-xl" style={{ background: 'linear-gradient(160deg,#1a0a0a,#0f0808)', border: '1.5px solid rgba(239,68,68,0.2)', transform: `translate(${(k + 1) * 2}px,${(k + 1) * -2}px)`, zIndex: k }} />
              ))}
              <div className="absolute inset-0 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(160deg,#1a0a0a,#0f0808)', border: '1.5px solid rgba(239,68,68,0.4)', zIndex: 10 }}>
                <span className="text-lg">🌶️</span>
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: '#ef4444', zIndex: 20 }}>{room.pile.length}</div>
            </>
          )}
        </div>
        <div className="flex-1">
          {room.lastClaim ? (
            <div>
              <div className="text-xs text-white/40 mb-1">Objava: {room.players[cardPlayerIdx]?.name}</div>
              <div className="flex items-center gap-2"><span className="text-2xl font-black text-white">{room.lastClaim.value}</span><SpiceChip spice={room.lastClaim.spice} size="md" /></div>
            </div>
          ) : <span className="text-sm text-white/30">{room.isFirstOnPile ? 'Prva karta — 1, 2 ili 3' : ''}</span>}
        </div>
      </div>
    </div>
  );

  // ── Players strip ────────────────────────────────────────────────────────────
  const playersStrip = (
    <div className="flex gap-2 overflow-x-auto pb-1 mb-3">
      {room.players.map((p, i) => (
        <div key={p.id} className="flex-shrink-0 rounded-xl px-2.5 py-2 text-xs"
          style={{ background: i === room.currentPlayerIndex ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${i === room.currentPlayerIndex ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.07)'}` }}>
          <div className="font-semibold text-white max-w-[70px] truncate">{p.name}{p.id === playerId ? ' (ti)' : ''}</div>
          <div className="text-white/40 mt-0.5">{'🏆'.repeat(p.trophies)} 🃏{p.wonCardsCount} ✋{p.hand.length}</div>
        </div>
      ))}
    </div>
  );

  // ── Challenge_window / last_card_window ──────────────────────────────────────
  if (room.status === 'challenge_window' || room.status === 'last_card_window') {
    const isLastCard = room.status === 'last_card_window';
    return (
      <div className="flex min-h-dvh flex-col px-5 py-5" style={{ background: '#080b14' }}>
        {pileSection}
        {playersStrip}
        <div className="flex-1 flex flex-col items-center justify-center gap-5">
          {isLastCard && <div className="text-4xl">🏆</div>}
          <div className="text-center">
            <div className="text-xs uppercase tracking-widest text-red-400/70 mb-1">{isLastCard ? 'Poslednja karta!' : 'Objava'}</div>
            {room.lastClaim && (
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl font-black text-white">{room.lastClaim.value}</span>
                <SpiceChip spice={room.lastClaim.spice} size="lg" />
              </div>
            )}
          </div>

          {isCardPlayer ? (
            <div className="text-sm text-white/40 text-center">Čekamo odgovor ostalih igrača...</div>
          ) : alreadyVoted ? (
            <div className="rounded-xl px-4 py-3 text-sm text-white/50" style={{ background: 'rgba(255,255,255,0.05)' }}>Čekamo ostale...</div>
          ) : (
            <div className="w-full max-w-xs space-y-3">
              <Button fullWidth onClick={() => challengePlay(room.code, playerId, 'number')}
                style={{ background: 'rgba(249,115,22,0.15)', border: '1.5px solid rgba(249,115,22,0.4)', color: '#fb923c' }}
                className="!rounded-2xl">
                ❌ Nije {room.lastClaim?.value}!
              </Button>
              <Button fullWidth onClick={() => challengePlay(room.code, playerId, 'spice')}
                style={{ background: 'rgba(239,68,68,0.15)', border: '1.5px solid rgba(239,68,68,0.4)', color: '#f87171' }}
                className="!rounded-2xl">
                ❌ Nije začin!
              </Button>
              <Button variant="ghost" fullWidth onClick={() => voteNoChallenge(room.code, playerId)} className="!text-white/40">
                ✓ Prihvatam ({room.noChallengeVotes.length}/{room.players.length - 1})
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Challenge result ─────────────────────────────────────────────────────────
  if (room.status === 'challenge_result' && room.challengeResult) {
    const res = room.challengeResult;
    const winner = room.players[res.winnerIndex];
    const loser = room.players[res.loserIndex];
    const challengerWon = res.outcome === 'challenger_wins';
    return (
      <div className="flex min-h-dvh items-center justify-center px-5" style={{ background: '#080b14' }}>
        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm rounded-3xl p-6 text-center"
          style={{ background: '#0f1320', border: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="mb-3 text-xs uppercase tracking-widest text-white/40">Otkrivena karta</p>
          <div className="flex justify-center mb-3">
            <motion.div initial={{ rotateY: 180, scale: 0.5 }} animate={{ rotateY: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 18 }}>
              <SpicyCardComponent card={res.topCard} faceUp size="lg" />
            </motion.div>
          </div>
          {res.topCard.type === 'spicy' && res.topCard.spice && (
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-xl font-black text-white">{res.topCard.value}</span>
              <SpiceChip spice={res.topCard.spice} size="md" />
            </div>
          )}
          <div className="mb-4 rounded-2xl px-4 py-3" style={{ background: challengerWon ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', border: `1px solid ${challengerWon ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}` }}>
            <div className={`text-xl font-black mb-1 ${challengerWon ? 'text-red-400' : 'text-green-400'}`}>{challengerWon ? '❌ Blef uhvaćen!' : '✅ Objava tačna!'}</div>
            <div className="text-sm text-white/80"><span className="font-semibold text-white">{winner.name}</span> pobedio!</div>
          </div>
          <div className="mb-4 space-y-2 text-sm">
            {[
              { l: `${winner.name} uzima`, v: `${res.pileCount} karte`, c: 'text-white' },
              { l: `${loser.name} vuče`, v: '2 karte', c: 'text-orange-400' },
            ].map(({ l, v, c }) => (
              <div key={l} className="flex items-center justify-between rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <span className="text-white/60">{l}</span><span className={`font-bold ${c}`}>{v}</span>
              </div>
            ))}
          </div>
          <Button fullWidth onClick={() => confirmChallengeResult(room.code)}
            style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 4px 16px rgba(239,68,68,0.4)' }}>
            Nastavi
          </Button>
        </motion.div>
      </div>
    );
  }

  // ── Trophy ───────────────────────────────────────────────────────────────────
  if (room.status === 'spicy_trophy') {
    const tIdx = room.lastCardPlayerIndex ?? room.currentPlayerIndex;
    const tPlayer = room.players[tIdx];
    const isTrophyPlayer = tPlayer?.id === playerId;
    const newTrophyCount = tPlayer ? tPlayer.trophies + 1 : 0;
    return (
      <div className="flex min-h-dvh items-center justify-center px-5" style={{ background: '#080b14' }}>
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="w-full max-w-sm rounded-3xl p-8 text-center"
          style={{ background: '#0f1320', border: '1px solid rgba(251,191,36,0.3)', boxShadow: '0 20px 60px rgba(251,191,36,0.15)' }}>
          <motion.div animate={{ rotate: [0, -10, 10, -5, 5, 0], scale: [1, 1.2, 1] }} transition={{ duration: 0.6, delay: 0.2 }} className="mb-4 text-6xl">🏆</motion.div>
          <div className="mb-2 text-2xl font-black text-white">{tPlayer?.name}</div>
          <div className="mb-1 text-sm text-white/60">osvaja trofej!</div>
          <div className="mb-4 text-4xl">{'🏆'.repeat(newTrophyCount)}{'⬜'.repeat(Math.max(0, 2 - newTrophyCount))}</div>
          {newTrophyCount >= 2 && <p className="mb-4 text-sm font-bold text-yellow-400">2 trofeja — automatska pobeda! 🎉</p>}
          {isTrophyPlayer ? (
            <Button fullWidth onClick={() => collectTrophy(room.code, playerId)}
              style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', boxShadow: '0 4px 16px rgba(245,158,11,0.4)' }}
              className="!text-black font-black">
              {newTrophyCount >= 2 ? 'Pogledaj rezultate' : 'Uzmi trofej'}
            </Button>
          ) : (
            <div className="text-sm text-white/40">Čekamo {tPlayer?.name}...</div>
          )}
        </motion.div>
      </div>
    );
  }

  // ── Playing ──────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="flex min-h-dvh flex-col px-5 py-5" style={{ background: '#080b14' }}>
        <div className="mb-3 flex items-center justify-between">
          <div className="rounded-xl px-3 py-1.5 text-sm font-bold text-white"
            style={{ background: isMyTurn ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)', border: `1px solid ${isMyTurn ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'}` }}>
            {isMyTurn ? '🌶️ Tvoj red' : `Na potezu: ${room.players[room.currentPlayerIndex]?.name}`}
          </div>
          <div className="flex gap-2 text-xs text-white/40">
            {[0, 1, 2].map((i) => <span key={i}>{i < room.trophiesLeft ? '🏆' : '⬜'}</span>)}
          </div>
        </div>

        {pileSection}
        {playersStrip}

        {/* My hand */}
        <div className="flex-1">
          <div className="mb-2 text-xs uppercase tracking-wider text-white/40">Moje karte ({me?.hand.length ?? 0})</div>
          <div className="flex flex-wrap gap-2">
            {me?.hand.map((c) => <SpicyCardComponent key={c.id} card={c} faceUp size="md" />) ?? []}
          </div>
        </div>

        {/* Actions */}
        {isMyTurn && me && (
          <div className="mt-5 flex gap-3">
            <Button variant="ghost" className="flex-1 !border !border-white/15" onClick={() => passTurn(room.code, playerId)}>
              Dalje (+1)
            </Button>
            <Button className="flex-1" disabled={me.hand.length === 0} onClick={() => setClaimOpen(true)}
              style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 4px 16px rgba(239,68,68,0.35)' }}>
              🌶️ Odigraj
            </Button>
          </div>
        )}

        {!isMyTurn && (
          <div className="mt-5 rounded-xl px-4 py-3 text-center text-sm text-white/40" style={{ background: 'rgba(255,255,255,0.04)' }}>
            Čekaj — na potezu je {room.players[room.currentPlayerIndex]?.name}
          </div>
        )}

        {room.lastEvent && (
          <div className="mt-3 text-center text-xs text-white/30 truncate">{room.lastEvent}</div>
        )}
      </div>

      <AnimatePresence>
        {claimOpen && me && (
          <ClaimModal hand={me.hand} lastClaim={room.lastClaim} isFirstOnPile={room.isFirstOnPile} onConfirm={handlePlay} onClose={() => setClaimOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
