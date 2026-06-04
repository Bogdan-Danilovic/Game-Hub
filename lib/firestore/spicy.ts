'use client';

import { getDoc, setDoc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SpicyRoom, SpicyFirestorePlayer } from '@/lib/games/spicy/firestoreTypes';
import { SpicyCard, SpicyClaim } from '@/lib/games/spicy/types';
import { createAndDeal } from '@/lib/games/spicy/cardFactory';
import { resolveChallenge } from '@/lib/games/spicy/challengeResolver';
import { generateRoomCode, generatePlayerId } from '@/lib/utils';
import { roomRef, subscribeToRoom } from './core';

export { subscribeToRoom };

const MIN = 2;
const MAX = 6;

function newPlayer(id: string, name: string, isHost: boolean): SpicyFirestorePlayer {
  return { id, name, isConnected: true, isHost, joinedAt: Date.now(), hand: [], wonCardsCount: 0, trophies: 0 };
}

function newRoom(code: string, hostId: string, player: SpicyFirestorePlayer): SpicyRoom {
  return {
    code, gameType: 'spicy', status: 'lobby', hostId,
    players: [player], settings: {},
    drawPile: [], pile: [], lastClaim: null, isFirstOnPile: true,
    currentPlayerIndex: 0, trophiesLeft: 3,
    challengeResult: null, lastCardPlayerIndex: null, lastCardChallengeWon: null,
    noChallengeVotes: [], winnerId: null, lastEvent: null,
    createdAt: Date.now(), expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  };
}

function scoreOf(p: SpicyFirestorePlayer) {
  return p.trophies * 10 + p.wonCardsCount - p.hand.length;
}

function bestWinner(players: SpicyFirestorePlayer[]): SpicyFirestorePlayer {
  return players.reduce((b, p) => scoreOf(p) > scoreOf(b) ? p : b);
}

// Draw cards directly on a mutable copy of the room; returns gameEnded flag
function drawCards(room: SpicyRoom, playerIndex: number, count: number): boolean {
  for (let i = 0; i < count; i++) {
    if (room.drawPile.length === 0) return false;
    const [card, ...rest] = room.drawPile;
    room.drawPile = rest;
    if (card.type === 'enough') {
      room.status = 'finished';
      room.winnerId = bestWinner(room.players).id;
      return true;
    }
    room.players = room.players.map((p, idx) =>
      idx === playerIndex ? { ...p, hand: [...p.hand, card] } : p
    );
  }
  return false;
}

function dedup(name: string, existing: string[]): string {
  if (!existing.includes(name)) return name;
  let n = 2;
  while (existing.includes(`${name} ${n}`)) n++;
  return `${name} ${n}`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function createRoom(playerName: string): Promise<{ code: string; playerId: string }> {
  const playerId = generatePlayerId();
  const player = newPlayer(playerId, playerName, true);
  for (let i = 0; i < 5; i++) {
    const code = generateRoomCode();
    const ref = roomRef(code);
    if (!(await getDoc(ref)).exists()) {
      await setDoc(ref, newRoom(code, playerId, player));
      return { code, playerId };
    }
  }
  throw new Error('Nije moguće kreirati sobu.');
}

export async function joinRoom(code: string, playerName: string): Promise<{ playerId: string; error?: string }> {
  const ref = roomRef(code);
  try {
    const playerId = await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error('Soba ne postoji.');
      const room = snap.data() as SpicyRoom;
      if (room.status !== 'lobby') throw new Error('Igra je već u toku.');
      if (room.players.length >= MAX) throw new Error(`Soba je puna (max ${MAX}).`);
      const id = generatePlayerId();
      const p = newPlayer(id, dedup(playerName, room.players.map((p) => p.name)), false);
      tx.update(ref, { players: [...room.players, p] });
      return id;
    });
    return { playerId };
  } catch (err) {
    return { playerId: '', error: err instanceof Error ? err.message : 'Greška.' };
  }
}

export async function startGame(code: string): Promise<void> {
  const ref = roomRef(code);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const room = snap.data() as SpicyRoom;
    if (room.status !== 'lobby' || room.players.length < MIN) return;

    const { hands, drawPile } = createAndDeal(room.players.length);
    const players = room.players.map((p, i) => ({ ...p, hand: hands[i], wonCardsCount: 0, trophies: 0 }));

    tx.update(ref, {
      status: 'playing', players, drawPile, pile: [],
      lastClaim: null, isFirstOnPile: true, currentPlayerIndex: 0,
      trophiesLeft: 3, challengeResult: null,
      lastCardPlayerIndex: null, lastCardChallengeWon: null,
      noChallengeVotes: [], winnerId: null,
      lastEvent: `Igra počinje! Na potezu: ${players[0].name}`,
    });
  });
}

export async function playCard(code: string, playerId: string, cardId: string, claim: SpicyClaim): Promise<void> {
  const ref = roomRef(code);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const room = snap.data() as SpicyRoom;
    if (room.status !== 'playing') return;

    const idx = room.currentPlayerIndex;
    if (room.players[idx].id !== playerId) return;

    const player = room.players[idx];
    const cardIdx = player.hand.findIndex((c) => c.id === cardId);
    if (cardIdx === -1) return;

    const card = player.hand[cardIdx];
    const newHand = player.hand.filter((_, i) => i !== cardIdx);
    const pile = [...room.pile, card];
    const players = room.players.map((p, i) => i === idx ? { ...p, hand: newHand } : p);

    const isLastCard = newHand.length === 0;
    const status = isLastCard ? 'last_card_window' : 'challenge_window';

    tx.update(ref, {
      players, pile, lastClaim: claim, isFirstOnPile: false,
      status, noChallengeVotes: [],
      lastCardPlayerIndex: isLastCard ? idx : null,
      lastCardChallengeWon: null,
      challengeResult: null,
      lastEvent: `${player.name} objavljuje ${claim.value} ${claim.spice}`,
    });
  });
}

export async function passTurn(code: string, playerId: string): Promise<void> {
  const ref = roomRef(code);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const room = snap.data() as SpicyRoom;
    if (room.status !== 'playing') return;
    const idx = room.currentPlayerIndex;
    if (room.players[idx].id !== playerId) return;

    // mutable copy for drawCards helper
    const r: SpicyRoom = { ...room, players: room.players.map((p) => ({ ...p, hand: [...p.hand] })), drawPile: [...room.drawPile] };
    const ended = drawCards(r, idx, 1);

    const nextIdx = (idx + 1) % r.players.length;
    const updates: Record<string, unknown> = {
      players: r.players, drawPile: r.drawPile,
      currentPlayerIndex: ended ? idx : nextIdx,
      status: ended ? 'finished' : 'playing',
      winnerId: r.winnerId ?? null,
      lastEvent: ended ? 'DOSTA karta! Igra se završava.' : `${room.players[idx].name} kaže Dalje. Na potezu: ${r.players[nextIdx].name}`,
    };
    tx.update(ref, updates);
  });
}

export async function challengePlay(code: string, playerId: string, type: 'spice' | 'number'): Promise<void> {
  const ref = roomRef(code);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const room = snap.data() as SpicyRoom;
    if (room.status !== 'challenge_window' && room.status !== 'last_card_window') return;
    if (!room.lastClaim || room.pile.length === 0) return;

    const challengerIdx = room.players.findIndex((p) => p.id === playerId);
    if (challengerIdx === -1) return;

    const cardPlayerIdx = room.status === 'last_card_window'
      ? (room.lastCardPlayerIndex ?? room.currentPlayerIndex)
      : room.currentPlayerIndex;

    if (challengerIdx === cardPlayerIdx) return; // can't challenge yourself

    const topCard = room.pile[room.pile.length - 1];
    const outcome = resolveChallenge(topCard, room.lastClaim, type);
    const winnerIdx = outcome === 'challenger_wins' ? challengerIdx : cardPlayerIdx;
    const loserIdx = outcome === 'challenger_wins' ? cardPlayerIdx : challengerIdx;
    const pileCards = [...room.pile];

    // Winner takes pile
    const r: SpicyRoom = {
      ...room,
      players: room.players.map((p, i) =>
        i === winnerIdx ? { ...p, wonCardsCount: p.wonCardsCount + pileCards.length } : p
      ),
      pile: [],
    };

    // Loser draws 2
    const ended = drawCards(r, loserIdx, 2);

    const challengeResult = {
      topCard, challengeType: type, outcome,
      challengerIndex: challengerIdx, playerIndex: cardPlayerIdx,
      winnerIndex: winnerIdx, loserIndex: loserIdx, pileCount: pileCards.length,
    };

    const isLastCardPhase = room.status === 'last_card_window';

    tx.update(ref, {
      players: r.players, drawPile: r.drawPile, pile: [],
      currentPlayerIndex: ended ? loserIdx : loserIdx,
      isFirstOnPile: true, lastClaim: null,
      status: ended ? 'finished' : 'challenge_result',
      winnerId: r.winnerId ?? null,
      challengeResult,
      lastCardChallengeWon: isLastCardPhase ? (outcome === 'player_wins') : null,
      lastEvent: `${room.players[challengerIdx].name} izaziva ${type === 'number' ? 'broj' : 'začin'}! ${outcome === 'challenger_wins' ? 'Blef!' : 'Tačno!'}`,
    });
  });
}

export async function voteNoChallenge(code: string, playerId: string): Promise<void> {
  const ref = roomRef(code);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const room = snap.data() as SpicyRoom;
    if (room.status !== 'challenge_window' && room.status !== 'last_card_window') return;

    const cardPlayerIdx = room.status === 'last_card_window'
      ? (room.lastCardPlayerIndex ?? room.currentPlayerIndex)
      : room.currentPlayerIndex;

    const voterIdx = room.players.findIndex((p) => p.id === playerId);
    if (voterIdx === -1 || voterIdx === cardPlayerIdx) return;
    if (room.noChallengeVotes.includes(playerId)) return;

    const votes = [...room.noChallengeVotes, playerId];
    const nonCardPlayers = room.players.filter((_, i) => i !== cardPlayerIdx);
    const allPassed = votes.length >= nonCardPlayers.length;

    if (!allPassed) {
      tx.update(ref, { noChallengeVotes: votes });
      return;
    }

    // All passed
    if (room.status === 'last_card_window') {
      // trophy
      tx.update(ref, { noChallengeVotes: votes, status: 'spicy_trophy', lastEvent: 'Niko nije izazvao! Trofej!' });
    } else {
      const nextIdx = (room.currentPlayerIndex + 1) % room.players.length;
      tx.update(ref, {
        noChallengeVotes: votes, status: 'playing',
        currentPlayerIndex: nextIdx,
        lastEvent: `Nema izazova. Na potezu: ${room.players[nextIdx].name}`,
      });
    }
  });
}

export async function confirmChallengeResult(code: string, playerId: string): Promise<void> {
  const ref = roomRef(code);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const room = snap.data() as SpicyRoom;
    if (room.status !== 'challenge_result') return;

    const isLastCard = room.lastCardChallengeWon !== null;
    if (isLastCard && room.lastCardChallengeWon) {
      tx.update(ref, { status: 'spicy_trophy', lastEvent: 'Izazov pobeden! Trofej!' });
    } else {
      const nextPlayer = room.players[room.currentPlayerIndex];
      tx.update(ref, {
        status: 'playing',
        lastCardPlayerIndex: null, lastCardChallengeWon: null,
        lastEvent: `Nova gomila. Na potezu: ${nextPlayer.name}`,
      });
    }
  });
}

export async function collectTrophy(code: string, playerId: string): Promise<void> {
  const ref = roomRef(code);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const room = snap.data() as SpicyRoom;
    if (room.status !== 'spicy_trophy') return;

    const tIdx = room.lastCardPlayerIndex ?? room.currentPlayerIndex;
    if (room.players[tIdx].id !== playerId) return;

    const players = room.players.map((p, i) =>
      i === tIdx ? { ...p, trophies: p.trophies + 1 } : p
    );
    const trophiesLeft = room.trophiesLeft - 1;
    const tp = players[tIdx];

    // Auto-win: 2 trophies
    if (tp.trophies >= 2) {
      tx.update(ref, { players, trophiesLeft, status: 'finished', winnerId: tp.id, lastEvent: `${tp.name} osvaja 2. trofej — automatska pobeda!` });
      return;
    }
    // All trophies distributed
    if (trophiesLeft === 0) {
      const winner = bestWinner(players);
      tx.update(ref, { players, trophiesLeft, status: 'finished', winnerId: winner.id, lastEvent: 'Svi trofeji podeljeni. Kraj igre!' });
      return;
    }

    // Draw 6 new cards
    const r: SpicyRoom = {
      ...room, players: players.map((p) => ({ ...p, hand: [...p.hand] })), drawPile: [...room.drawPile],
    };
    const ended = drawCards(r, tIdx, 6);

    tx.update(ref, {
      players: r.players, drawPile: r.drawPile, trophiesLeft,
      status: ended ? 'finished' : 'playing',
      currentPlayerIndex: tIdx,
      lastCardPlayerIndex: null, lastCardChallengeWon: null,
      winnerId: r.winnerId ?? null,
      lastEvent: ended ? 'DOSTA karta! Igra se završava.' : `${tp.name} vuče 6 novih karata. Na potezu: ${tp.name}`,
    });
  });
}

export async function setConnected(code: string, playerId: string, isConnected: boolean): Promise<void> {
  const ref = roomRef(code);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const room = snap.data() as SpicyRoom;
    tx.update(ref, { players: room.players.map((p) => p.id === playerId ? { ...p, isConnected } : p) });
  });
}
