'use client';

import { getDoc, setDoc, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UnoRoom, UnoPlayer, UnoSettings, UnoColor, UnoCard } from '@/lib/types/uno';
import { generateRoomCode, generatePlayerId } from '@/lib/utils';
import { createShuffledUnoDeck, drawCards } from '@/lib/games/uno/deck';
import { nextIndex, handScore, canPlayCard, colorFromTop } from '@/lib/games/uno/engine';
import { roomRef, subscribeToRoom } from './core';

export { subscribeToRoom };

const MAX_PLAYERS = 10;
const MIN_PLAYERS = 2;
const DEFAULT_TARGET = 500;
const HAND_SIZE = 7;

function newPlayer(id: string, name: string): UnoPlayer {
  return {
    id,
    name,
    isConnected: true,
    hand: [],
    saidUno: false,
    totalScore: 0,
    roundScore: 0,
  };
}

function newRoom(code: string, hostId: string, player: UnoPlayer): UnoRoom {
  return {
    code,
    status: 'lobby',
    gameType: 'uno',
    hostId,
    players: [player],
    settings: { targetScore: DEFAULT_TARGET },
    deck: [],
    discardPile: [],
    topCard: { id: 'init', kind: 'number', color: 'red', value: 0 },
    currentColor: 'red',
    currentPlayerIndex: 0,
    direction: 1,
    pendingAction: { type: null, byPlayerId: null, isWild4: false },
    winnerId: null,
    roundNumber: 0,
    lastEvent: null,
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  };
}

function deduplicateName(name: string, existing: string[]): string {
  if (!existing.includes(name)) return name;
  let n = 2;
  while (existing.includes(`${name} ${n}`)) n++;
  return `${name} ${n}`;
}

function highestScorerId(players: UnoPlayer[]): string | null {
  const connected = players.filter((p) => p.isConnected);
  const pool = connected.length > 0 ? connected : players;
  if (pool.length === 0) return null;
  return pool.reduce((best, p) => (p.totalScore > best.totalScore ? p : best), pool[0]).id;
}

export async function createRoom(playerName: string): Promise<{ code: string; playerId: string }> {
  const playerId = generatePlayerId();
  const player = newPlayer(playerId, playerName);

  let attempts = 0;
  while (attempts < 5) {
    const code = generateRoomCode();
    const ref = roomRef(code);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, newRoom(code, playerId, player));
      return { code, playerId };
    }
    attempts++;
  }
  throw new Error('Nije moguće kreirati sobu. Pokušaj ponovo.');
}

export async function joinRoom(
  code: string,
  playerName: string
): Promise<{ playerId: string; error?: string }> {
  const ref = roomRef(code);
  try {
    const playerId = await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) throw new Error('Soba ne postoji.');
      const room = snap.data() as UnoRoom;
      if (room.status !== 'lobby') throw new Error('Igra je već u toku.');
      if (room.players.length >= MAX_PLAYERS) throw new Error(`Soba je puna (max ${MAX_PLAYERS}).`);

      const id = generatePlayerId();
      const player = newPlayer(id, deduplicateName(playerName, room.players.map((p) => p.name)));
      tx.update(ref, { players: [...room.players, player] });
      return id;
    });
    return { playerId };
  } catch (err) {
    return { playerId: '', error: err instanceof Error ? err.message : 'Greška.' };
  }
}

export async function rejoinRoom(code: string, playerId: string): Promise<void> {
  const ref = roomRef(code);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const room = snap.data() as UnoRoom;
    tx.update(ref, {
      players: room.players.map((p) => (p.id === playerId ? { ...p, isConnected: true } : p)),
    });
  });
}

export async function setPlayerDisconnected(code: string, playerId: string): Promise<void> {
  const ref = roomRef(code);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const room = snap.data() as UnoRoom;
    const players = room.players.map((p) =>
      p.id === playerId ? { ...p, isConnected: false } : p
    );
    const updates: Record<string, unknown> = { players };

    if (room.hostId === playerId) {
      const next = players.find((p) => p.id !== playerId && p.isConnected);
      if (next) updates.hostId = next.id;
    }

    if (room.status !== 'lobby' && room.status !== 'finished') {
      const connected = players.filter((p) => p.isConnected);
      if (connected.length < MIN_PLAYERS) {
        updates.status = 'finished';
        updates.winnerId = highestScorerId(players);
        updates.lastEvent = 'Premalo igrača — igra je završena.';
      }
    }

    tx.update(ref, updates);
  });
}

export async function leaveRoom(code: string, playerId: string): Promise<void> {
  const ref = roomRef(code);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const room = snap.data() as UnoRoom;

    if (room.status === 'lobby') {
      const players = room.players.filter((p) => p.id !== playerId);
      if (players.length === 0) return;
      const updates: Record<string, unknown> = { players };
      if (room.hostId === playerId) updates.hostId = players[0].id;
      tx.update(ref, updates);
      return;
    }

    const players = room.players.map((p) =>
      p.id === playerId ? { ...p, isConnected: false } : p
    );
    const updates: Record<string, unknown> = { players };
    if (room.hostId === playerId) {
      const next = players.find((p) => p.id !== playerId && p.isConnected);
      if (next) updates.hostId = next.id;
    }
    if (room.status !== 'finished') {
      const connected = players.filter((p) => p.isConnected);
      if (connected.length < MIN_PLAYERS) {
        updates.status = 'finished';
        updates.winnerId = highestScorerId(players);
        updates.lastEvent = 'Premalo igrača — igra je završena.';
      }
    }
    tx.update(ref, updates);
  });
}

export async function startGame(code: string): Promise<void> {
  const ref = roomRef(code);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const room = snap.data() as UnoRoom;
    if (room.players.length < MIN_PLAYERS)
      throw new Error(`Potrebno je najmanje ${MIN_PLAYERS} igrača.`);

    let deck = createShuffledUnoDeck();
    let discardPile: UnoCard[] = [];
    const players = room.players.map((p) => ({ ...p, hand: [] as UnoCard[], saidUno: false, roundScore: 0 }));

    // Deal 7 cards to each player
    for (const player of players) {
      const result = drawCards(deck, discardPile, HAND_SIZE);
      player.hand = result.drawn;
      deck = result.deck;
      discardPile = result.discardPile;
    }

    // Flip first card — skip Wild Draw 4 as starting card
    let topCard: UnoCard;
    do {
      const result = drawCards(deck, discardPile, 1);
      topCard = result.drawn[0];
      deck = result.deck;
      discardPile = result.discardPile;
      if (topCard.kind === 'wild' && topCard.value === 'wild4') {
        discardPile = [...discardPile, topCard];
      } else {
        break;
      }
    } while (true);

    const currentColor = topCard.kind === 'wild' ? 'red' : topCard.color;
    const startIndex = 0;

    // If first card is Skip/Reverse/Draw2, apply effect
    let currentPlayerIndex = startIndex;
    let direction: 1 | -1 = 1;
    let lastEvent = `Igra počinje! Prva karta: ${cardLabel(topCard)}.`;

    if (topCard.kind === 'action') {
      if (topCard.value === 'skip') {
        currentPlayerIndex = nextIndex(players, startIndex, direction);
        lastEvent += ` ${players[startIndex].name} preskače.`;
      } else if (topCard.value === 'reverse') {
        direction = -1;
        if (players.length === 2) {
          currentPlayerIndex = nextIndex(players, startIndex, direction);
          lastEvent += ' Smjer obrnut — ide isti igrač.';
        }
      } else if (topCard.value === 'draw2') {
        const drawn = drawCards(deck, discardPile, 2);
        players[startIndex].hand = [...players[startIndex].hand, ...drawn.drawn];
        deck = drawn.deck;
        discardPile = drawn.discardPile;
        currentPlayerIndex = nextIndex(players, startIndex, direction);
        lastEvent += ` ${players[startIndex].name} vuče 2 karte.`;
      }
    }

    tx.update(ref, {
      status: 'playing',
      players,
      deck,
      discardPile,
      topCard,
      currentColor,
      currentPlayerIndex,
      direction,
      pendingAction: { type: null, byPlayerId: null, isWild4: false },
      winnerId: null,
      roundNumber: 1,
      lastEvent,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });
  });
}

export async function playCard(
  code: string,
  playerId: string,
  cardId: string
): Promise<void> {
  const ref = roomRef(code);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const room = snap.data() as UnoRoom;

    if (room.status !== 'playing') return;
    if (room.pendingAction.type !== null) return;
    const me = room.players[room.currentPlayerIndex];
    if (!me || me.id !== playerId) return;

    const cardIndex = me.hand.findIndex((c) => c.id === cardId);
    if (cardIndex < 0) return;
    const card = me.hand[cardIndex];

    if (!canPlayCard(card, room.topCard, room.currentColor)) return;

    let players = room.players.map((p, i) =>
      i === room.currentPlayerIndex
        ? { ...p, hand: p.hand.filter((c) => c.id !== cardId), saidUno: false }
        : p
    );
    let deck = room.deck;
    let discardPile = [...room.discardPile, room.topCard];
    let direction = room.direction;
    let currentPlayerIndex = room.currentPlayerIndex;
    let currentColor = room.currentColor;

    const updates: Record<string, unknown> = {};

    // If Wild: need color choice before advancing
    if (card.kind === 'wild') {
      players = players.map((p, i) =>
        i === room.currentPlayerIndex ? { ...p, saidUno: p.hand.length === 1 } : p
      );
      updates.players = players;
      updates.deck = deck;
      updates.discardPile = discardPile;
      updates.topCard = card;
      updates.pendingAction = {
        type: 'choose_color',
        byPlayerId: playerId,
        isWild4: card.value === 'wild4',
      };
      updates.lastEvent = `${me.name} jogo ${card.value === 'wild4' ? 'Wild +4' : 'Wild'} — bira boju.`;
      tx.update(ref, updates);
      return;
    }

    // Non-wild: apply effects immediately
    if (card.kind === 'action') {
      currentColor = card.color;

      if (card.value === 'skip') {
        currentPlayerIndex = nextIndex(players, currentPlayerIndex, direction, 1); // skip next, land on one after
        updates.lastEvent = `${me.name} igra Skip — ${players[nextIndex(players, room.currentPlayerIndex, direction)].name} preskače.`;
      } else if (card.value === 'reverse') {
        direction = (direction * -1) as 1 | -1;
        if (players.length === 2) {
          // With 2 players Reverse acts as Skip
          updates.lastEvent = `${me.name} igra Reverse — smjer obrnut.`;
          // currentPlayerIndex stays the same (same player goes again — no, it passes)
          currentPlayerIndex = nextIndex(players, room.currentPlayerIndex, direction);
        } else {
          currentPlayerIndex = nextIndex(players, room.currentPlayerIndex, direction);
          updates.lastEvent = `${me.name} igra Reverse — smjer obrnut.`;
        }
      } else if (card.value === 'draw2') {
        const nextIdx = nextIndex(players, room.currentPlayerIndex, direction);
        const drawn = drawCards(deck, discardPile, 2);
        deck = drawn.deck;
        discardPile = drawn.discardPile;
        players = players.map((p, i) =>
          i === nextIdx ? { ...p, hand: [...p.hand, ...drawn.drawn] } : p
        );
        currentPlayerIndex = nextIndex(players, nextIdx, direction); // skip the one who drew
        updates.lastEvent = `${me.name} igra +2 — ${players[nextIdx].name} vuče 2 i preskače.`;
      }
    } else {
      // Number card
      currentColor = card.color;
      currentPlayerIndex = nextIndex(players, room.currentPlayerIndex, direction);
      updates.lastEvent = `${me.name} igra ${cardLabel(card)}.`;
    }

    // Check if current player won (after removing card)
    const currentPlayer = players[room.currentPlayerIndex];
    if (currentPlayer.hand.length === 0) {
      // Round over
      const score = players.reduce((sum, p, i) => {
        if (i === room.currentPlayerIndex) return sum;
        return sum + handScore(p.hand);
      }, 0);
      players = players.map((p, i) =>
        i === room.currentPlayerIndex
          ? { ...p, roundScore: score, totalScore: p.totalScore + score }
          : { ...p, roundScore: 0 }
      );
      updates.players = players;
      updates.deck = deck;
      updates.discardPile = discardPile;
      updates.topCard = card;
      updates.currentColor = currentColor;
      updates.direction = direction;
      updates.pendingAction = { type: null, byPlayerId: null, isWild4: false };
      updates.status = 'round_end';
      updates.lastEvent = `${currentPlayer.name} ostaje bez karata! Runda završena.`;
      tx.update(ref, updates);
      return;
    }

    updates.players = players;
    updates.deck = deck;
    updates.discardPile = discardPile;
    updates.topCard = card;
    updates.currentColor = currentColor;
    updates.direction = direction;
    updates.currentPlayerIndex = currentPlayerIndex;
    updates.pendingAction = { type: null, byPlayerId: null, isWild4: false };

    tx.update(ref, updates);
  });
}

export async function drawCard(code: string, playerId: string): Promise<void> {
  const ref = roomRef(code);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const room = snap.data() as UnoRoom;

    if (room.status !== 'playing') return;
    if (room.pendingAction.type !== null) return;
    const me = room.players[room.currentPlayerIndex];
    if (!me || me.id !== playerId) return;

    const result = drawCards(room.deck, room.discardPile, 1);
    if (result.drawn.length === 0) return;

    const drawn = result.drawn[0];
    const players = room.players.map((p, i) =>
      i === room.currentPlayerIndex ? { ...p, hand: [...p.hand, drawn], saidUno: false } : p
    );

    const nextIdx = nextIndex(players, room.currentPlayerIndex, room.direction);

    tx.update(ref, {
      players,
      deck: result.deck,
      discardPile: result.discardPile,
      currentPlayerIndex: nextIdx,
      lastEvent: `${me.name} vuče kartu i preskače.`,
    });
  });
}

export async function chooseColor(
  code: string,
  playerId: string,
  color: UnoColor
): Promise<void> {
  const ref = roomRef(code);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const room = snap.data() as UnoRoom;

    if (room.pendingAction.type !== 'choose_color') return;
    if (room.pendingAction.byPlayerId !== playerId) return;

    const isWild4 = room.pendingAction.isWild4;
    const me = room.players[room.currentPlayerIndex];
    const topCard = { ...room.topCard, chosenColor: color } as UnoCard;

    let players = room.players;
    let deck = room.deck;
    let discardPile = room.discardPile;
    let currentPlayerIndex = room.currentPlayerIndex;
    let lastEvent = `${me.name} bira boju: ${colorLabel(color)}.`;

    if (isWild4) {
      const nextIdx = nextIndex(players, currentPlayerIndex, room.direction);
      const drawn = drawCards(deck, discardPile, 4);
      deck = drawn.deck;
      discardPile = drawn.discardPile;
      players = players.map((p, i) =>
        i === nextIdx ? { ...p, hand: [...p.hand, ...drawn.drawn] } : p
      );
      currentPlayerIndex = nextIndex(players, nextIdx, room.direction); // skip the one who drew
      lastEvent += ` ${players[nextIdx].name} vuče 4 i preskače.`;
    } else {
      currentPlayerIndex = nextIndex(players, currentPlayerIndex, room.direction);
    }

    // Check win (wild was last card)
    const currentPlayer = players[room.currentPlayerIndex];
    if (currentPlayer.hand.length === 0) {
      const score = players.reduce((sum, p, i) => {
        if (i === room.currentPlayerIndex) return sum;
        return sum + handScore(p.hand);
      }, 0);
      players = players.map((p, i) =>
        i === room.currentPlayerIndex
          ? { ...p, roundScore: score, totalScore: p.totalScore + score }
          : { ...p, roundScore: 0 }
      );
      tx.update(ref, {
        players,
        deck,
        discardPile,
        topCard,
        currentColor: color,
        currentPlayerIndex,
        pendingAction: { type: null, byPlayerId: null, isWild4: false },
        status: 'round_end',
        lastEvent: `${currentPlayer.name} ostaje bez karata! Runda završena.`,
      });
      return;
    }

    tx.update(ref, {
      players,
      deck,
      discardPile,
      topCard,
      currentColor: color,
      currentPlayerIndex,
      direction: room.direction,
      pendingAction: { type: null, byPlayerId: null, isWild4: false },
      lastEvent,
    });
  });
}

export async function callUno(code: string, playerId: string): Promise<void> {
  const ref = roomRef(code);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const room = snap.data() as UnoRoom;
    const player = room.players.find((p) => p.id === playerId);
    if (!player || player.hand.length !== 1) return;
    tx.update(ref, {
      players: room.players.map((p) => (p.id === playerId ? { ...p, saidUno: true } : p)),
      lastEvent: `${player.name}: UNO!`,
    });
  });
}

export async function nextRound(code: string): Promise<void> {
  const ref = roomRef(code);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const room = snap.data() as UnoRoom;
    if (room.status !== 'round_end') return;

    const target = room.settings.targetScore ?? DEFAULT_TARGET;
    const maxScore = Math.max(...room.players.map((p) => p.totalScore));
    if (maxScore >= target) {
      const leaders = room.players.filter((p) => p.totalScore === maxScore);
      if (leaders.length === 1) {
        tx.update(ref, {
          status: 'finished',
          winnerId: leaders[0].id,
          lastEvent: `${leaders[0].name} pobjeđuje sa ${maxScore} bodova!`,
        });
        return;
      }
    }

    let deck = createShuffledUnoDeck();
    let discardPile: UnoCard[] = [];
    const players = room.players.map((p) => ({ ...p, hand: [] as UnoCard[], saidUno: false, roundScore: 0 }));

    for (const player of players) {
      const result = drawCards(deck, discardPile, HAND_SIZE);
      player.hand = result.drawn;
      deck = result.deck;
      discardPile = result.discardPile;
    }

    let topCard: UnoCard;
    do {
      const result = drawCards(deck, discardPile, 1);
      topCard = result.drawn[0];
      deck = result.deck;
      discardPile = result.discardPile;
      if (topCard.kind === 'wild' && topCard.value === 'wild4') {
        discardPile = [...discardPile, topCard];
      } else {
        break;
      }
    } while (true);

    const currentColor = topCard.kind === 'wild' ? 'red' : topCard.color;

    tx.update(ref, {
      status: 'playing',
      players,
      deck,
      discardPile,
      topCard,
      currentColor,
      currentPlayerIndex: 0,
      direction: 1,
      pendingAction: { type: null, byPlayerId: null, isWild4: false },
      roundNumber: room.roundNumber + 1,
      lastEvent: `Runda ${room.roundNumber + 1} počinje!`,
    });
  });
}

export async function playAgain(code: string): Promise<void> {
  const ref = roomRef(code);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const room = snap.data() as UnoRoom;
    tx.update(ref, {
      status: 'lobby',
      players: room.players.map((p) => ({
        ...p,
        hand: [],
        saidUno: false,
        totalScore: 0,
        roundScore: 0,
      })),
      deck: [],
      discardPile: [],
      topCard: { id: 'init', kind: 'number', color: 'red', value: 0 },
      currentColor: 'red',
      currentPlayerIndex: 0,
      direction: 1,
      pendingAction: { type: null, byPlayerId: null, isWild4: false },
      winnerId: null,
      roundNumber: 0,
      lastEvent: null,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });
  });
}

export async function updateSettings(
  code: string,
  settings: Partial<UnoSettings>
): Promise<void> {
  const ref = roomRef(code);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const room = snap.data() as UnoRoom;
    tx.update(ref, { settings: { ...room.settings, ...settings } });
  });
}

export async function kickPlayer(code: string, playerId: string): Promise<void> {
  const ref = roomRef(code);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const room = snap.data() as UnoRoom;
    tx.update(ref, { players: room.players.filter((p) => p.id !== playerId) });
  });
}

// ── helpers ──────────────────────────────────────────────────────────────────

function cardLabel(card: UnoCard): string {
  if (card.kind === 'wild') return card.value === 'wild4' ? 'Wild +4' : 'Wild';
  if (card.kind === 'action') {
    const map: Record<string, string> = { skip: 'Skip', reverse: 'Reverse', draw2: '+2' };
    return `${map[card.value]} ${colorLabel(card.color)}`;
  }
  return `${card.value} ${colorLabel(card.color)}`;
}

function colorLabel(color: UnoColor): string {
  const map: Record<UnoColor, string> = {
    red: 'Crvena',
    blue: 'Plava',
    green: 'Zelena',
    yellow: 'Žuta',
  };
  return map[color];
}
