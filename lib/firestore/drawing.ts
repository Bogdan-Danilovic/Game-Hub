'use client';

import {
  arrayUnion,
  getDoc,
  runTransaction,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  ChatMessage,
  DrawingPlayer,
  DrawingRoom,
  DrawingStatus,
  PartialStroke,
  Stroke,
} from '@/lib/types/drawing';
import { generatePlayerId, generateRoomCode, shuffleArray } from '@/lib/utils';
import { buildWordHint } from '@/lib/prompts/drawing-words';
import { roomRef, subscribeToRoom } from './core';

export { subscribeToRoom };

function newRoom(code: string, hostId: string, player: DrawingPlayer): DrawingRoom {
  return {
    code,
    status: 'lobby',
    hostId,
    gameType: 'drawing',
    players: [player],
    currentDrawer: '',
    currentWord: '',
    wordHint: '',
    currentRound: 0,
    totalRounds: 0,
    roundStartedAt: 0,
    roundDuration: 80000,
    strokes: [],
    currentStroke: null,
    chat: [],
    guessedPlayers: [],
    drawerOrder: [],
    scores: { [player.id]: 0 },
    settings: {},
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

export async function createRoom(
  playerName: string
): Promise<{ code: string; playerId: string }> {
  const playerId = generatePlayerId();
  const player: DrawingPlayer = { id: playerId, name: playerName, isConnected: true, score: 0 };

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
      const room = snap.data() as DrawingRoom;
      if (room.status !== 'lobby') throw new Error('Igra je već u toku.');
      if (room.players.length >= 8) throw new Error('Soba je puna (max 8).');

      const existingNames = room.players.map((p) => p.name);
      const uniqueName = deduplicateName(playerName, existingNames);
      const id = generatePlayerId();
      const player: DrawingPlayer = { id, name: uniqueName, isConnected: true, score: 0 };
      tx.update(ref, {
        players: [...room.players, player],
        scores: { ...room.scores, [id]: 0 },
      });
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
    const room = snap.data() as DrawingRoom;
    tx.update(ref, {
      players: room.players.map((p) =>
        p.id === playerId ? { ...p, isConnected: true } : p
      ),
    });
  });
}

export async function startGame(code: string): Promise<void> {
  const ref = roomRef(code);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const room = snap.data() as DrawingRoom;
    const drawerOrder = shuffleArray(room.players.map((p) => p.id));
    const firstDrawer = drawerOrder[0];
    tx.update(ref, {
      status: 'word-selection' as DrawingStatus,
      drawerOrder,
      currentDrawer: firstDrawer,
      currentRound: 1,
      totalRounds: room.players.length,
      strokes: [],
      currentStroke: null,
      chat: [],
      guessedPlayers: [],
      scores: Object.fromEntries(room.players.map((p) => [p.id, 0])),
    });
  });
}

export async function selectWord(code: string, word: string): Promise<void> {
  const ref = roomRef(code);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    tx.update(ref, {
      status: 'drawing' as DrawingStatus,
      currentWord: word,
      wordHint: buildWordHint(word),
      roundStartedAt: Date.now(),
      strokes: [],
      currentStroke: null,
      chat: [],
      guessedPlayers: [],
    });
  });
}

export async function pushPartialStroke(
  code: string,
  stroke: PartialStroke
): Promise<void> {
  await updateDoc(roomRef(code), { currentStroke: stroke });
}

export async function commitStroke(
  code: string,
  stroke: Stroke
): Promise<void> {
  await updateDoc(roomRef(code), {
    strokes: arrayUnion(stroke),
    currentStroke: null,
  });
}

export async function clearCanvas(code: string): Promise<void> {
  await updateDoc(roomRef(code), { strokes: [], currentStroke: null });
}

export async function submitGuess(
  code: string,
  playerId: string,
  playerName: string,
  text: string,
  currentWord: string,
  roundDuration: number,
  roundStartedAt: number,
  guessPosition: number
): Promise<{ correct: boolean }> {
  const isCorrect =
    text.trim().toLowerCase() === currentWord.trim().toLowerCase();

  const msg: ChatMessage = {
    playerId,
    playerName,
    text,
    isCorrectGuess: isCorrect,
    timestamp: Date.now(),
  };

  if (!isCorrect) {
    await updateDoc(roomRef(code), { chat: arrayUnion(msg) });
    return { correct: false };
  }

  const timeLeft = Math.max(
    0,
    roundDuration / 1000 - (Date.now() - roundStartedAt) / 1000
  );
  const { guesserPoints, drawerPoints } = calculateGuessScore(
    timeLeft,
    roundDuration / 1000,
    guessPosition
  );

  const ref = roomRef(code);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const room = snap.data() as DrawingRoom;
    if (room.guessedPlayers.includes(playerId)) return;

    const newScores = { ...room.scores };
    newScores[playerId] = (newScores[playerId] ?? 0) + guesserPoints;
    newScores[room.currentDrawer] =
      (newScores[room.currentDrawer] ?? 0) + drawerPoints;

    const newGuessed = [...room.guessedPlayers, playerId];
    const nonDrawers = room.players
      .filter((p) => p.id !== room.currentDrawer && p.isConnected)
      .map((p) => p.id);
    const allGuessed = nonDrawers.every((id) => newGuessed.includes(id));

    tx.update(ref, {
      guessedPlayers: newGuessed,
      scores: newScores,
      chat: arrayUnion(msg),
      ...(allGuessed ? { status: 'round-results' as DrawingStatus } : {}),
    });
  });

  return { correct: true };
}

export async function endRound(code: string): Promise<void> {
  await updateDoc(roomRef(code), { status: 'round-results' as DrawingStatus });
}

export async function advanceToNextRound(code: string): Promise<void> {
  const ref = roomRef(code);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const room = snap.data() as DrawingRoom;

    if (room.currentRound >= room.totalRounds) {
      tx.update(ref, { status: 'finished' as DrawingStatus });
      return;
    }

    const nextRound = room.currentRound + 1;
    const nextDrawer = room.drawerOrder[nextRound - 1];
    tx.update(ref, {
      status: 'word-selection' as DrawingStatus,
      currentRound: nextRound,
      currentDrawer: nextDrawer,
      currentWord: '',
      wordHint: '',
      strokes: [],
      currentStroke: null,
      chat: [],
      guessedPlayers: [],
    });
  });
}

export async function playAgain(code: string): Promise<void> {
  const ref = roomRef(code);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const room = snap.data() as DrawingRoom;
    const drawerOrder = shuffleArray(room.players.map((p) => p.id));
    tx.update(ref, {
      status: 'lobby' as DrawingStatus,
      currentDrawer: '',
      currentWord: '',
      wordHint: '',
      currentRound: 0,
      totalRounds: 0,
      strokes: [],
      currentStroke: null,
      chat: [],
      guessedPlayers: [],
      drawerOrder,
      scores: Object.fromEntries(room.players.map((p) => [p.id, 0])),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });
  });
}

export async function setPlayerDisconnected(
  code: string,
  playerId: string
): Promise<void> {
  const ref = roomRef(code);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const room = snap.data() as DrawingRoom;

    const players = room.players.map((p) =>
      p.id === playerId ? { ...p, isConnected: false } : p
    );
    const updates: Partial<DrawingRoom> & { players: DrawingPlayer[] } = { players };

    if (room.hostId === playerId) {
      const nextHost = players.find((p) => p.id !== playerId && p.isConnected);
      if (nextHost) updates.hostId = nextHost.id;
    }

    if (room.status !== 'lobby') {
      const connected = players.filter((p) => p.isConnected);
      if (connected.length < 3) {
        updates.status = 'finished';
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
    const room = snap.data() as DrawingRoom;

    if (room.status === 'lobby') {
      const players = room.players.filter((p) => p.id !== playerId);
      if (players.length === 0) return;
      const updates: Partial<DrawingRoom> & { players: DrawingPlayer[] } = { players };
      if (room.hostId === playerId && players.length > 0) {
        updates.hostId = players[0].id;
      }
      tx.update(ref, updates);
    } else {
      const players = room.players.map((p) =>
        p.id === playerId ? { ...p, isConnected: false } : p
      );
      const updates: Partial<DrawingRoom> & { players: DrawingPlayer[] } = { players };
      if (room.hostId === playerId) {
        const nextHost = players.find((p) => p.id !== playerId && p.isConnected);
        if (nextHost) updates.hostId = nextHost.id;
      }
      const connected = players.filter((p) => p.isConnected);
      if (connected.length < 3) updates.status = 'finished';
      tx.update(ref, updates);
    }
  });
}

function calculateGuessScore(
  timeLeft: number,
  roundDuration: number,
  guessPosition: number
): { guesserPoints: number; drawerPoints: number } {
  const speedBonus = Math.floor((timeLeft / roundDuration) * 300);
  const positionBonus = Math.max(0, 100 - (guessPosition - 1) * 20);
  return {
    guesserPoints: 100 + speedBonus + positionBonus,
    drawerPoints: 50,
  };
}
