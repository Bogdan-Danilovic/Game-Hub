'use client';

import { arrayUnion, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { Book, BookEntry, GarticPlayer, GarticRoom, GarticStroke } from '@/lib/types/gartic';
import { generatePlayerId, generateRoomCode } from '@/lib/utils';
import { roomRef, subscribeToRoom } from './core';

export { subscribeToRoom };

// RDP point simplification
function perpendicularDistance(
  point: [number, number],
  start: [number, number],
  end: [number, number]
): number {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  if (dx === 0 && dy === 0) {
    return Math.hypot(point[0] - start[0], point[1] - start[1]);
  }
  const t = ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / (dx * dx + dy * dy);
  return Math.hypot(point[0] - (start[0] + t * dx), point[1] - (start[1] + t * dy));
}

function rdp(points: [number, number][], epsilon: number): [number, number][] {
  if (points.length < 3) return points;
  let maxDist = 0;
  let maxIdx = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], points[0], points[points.length - 1]);
    if (d > maxDist) { maxDist = d; maxIdx = i; }
  }
  if (maxDist > epsilon) {
    return [
      ...rdp(points.slice(0, maxIdx + 1), epsilon),
      ...rdp(points.slice(maxIdx), epsilon).slice(1),
    ];
  }
  return [points[0], points[points.length - 1]];
}

function simplifyStrokes(strokes: GarticStroke[]): GarticStroke[] {
  return strokes.map((s) => ({ ...s, points: rdp(s.points, 0.002) }));
}

function newRoom(code: string, hostId: string, player: GarticPlayer): GarticRoom {
  return {
    code,
    status: 'lobby',
    hostId,
    gameType: 'gartic',
    players: [player],
    currentStep: 0,
    totalSteps: 0,
    stepStartedAt: 0,
    stepDuration: 90000,
    books: {},
    readyPlayers: [],
    revealBookIndex: -1,
    revealEntryIndex: 0,
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

export async function createRoom(playerName: string): Promise<{ code: string; playerId: string }> {
  const playerId = generatePlayerId();
  const player: GarticPlayer = { id: playerId, name: playerName, isConnected: true };
  for (let i = 0; i < 5; i++) {
    const code = generateRoomCode();
    const ref = roomRef(code);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, newRoom(code, playerId, player));
      return { code, playerId };
    }
  }
  throw new Error('Nije moguće kreirati sobu. Pokušaj ponovo.');
}

export async function joinRoom(
  code: string,
  playerName: string
): Promise<{ playerId: string; error?: string }> {
  const ref = roomRef(code);
  const snap = await getDoc(ref);
  if (!snap.exists()) return { playerId: '', error: 'Soba ne postoji.' };
  const room = snap.data() as GarticRoom;
  if (room.status !== 'lobby') return { playerId: '', error: 'Igra je već počela.' };
  if (room.players.length >= 8) return { playerId: '', error: 'Soba je puna.' };

  const existingNames = room.players.map((p) => p.name);
  const name = deduplicateName(playerName, existingNames);
  const playerId = generatePlayerId();
  const player: GarticPlayer = { id: playerId, name, isConnected: true };
  await updateDoc(ref, { players: arrayUnion(player) });
  return { playerId };
}

export async function rejoinRoom(code: string, playerId: string): Promise<void> {
  const snap = await getDoc(roomRef(code));
  if (!snap.exists()) return;
  const room = snap.data() as GarticRoom;
  const idx = room.players.findIndex((p) => p.id === playerId);
  if (idx === -1) return;
  const updated = room.players.map((p) => p.id === playerId ? { ...p, isConnected: true } : p);
  await updateDoc(roomRef(code), { players: updated });
}

export async function setPlayerDisconnected(code: string, playerId: string): Promise<void> {
  const snap = await getDoc(roomRef(code));
  if (!snap.exists()) return;
  const room = snap.data() as GarticRoom;
  const updated = room.players.map((p) => p.id === playerId ? { ...p, isConnected: false } : p);
  const connected = updated.filter((p) => p.isConnected).length;
  const patch: Record<string, unknown> = { players: updated };
  if (connected < 3 && room.status !== 'lobby' && room.status !== 'finished') {
    patch.status = 'finished';
  }
  await updateDoc(roomRef(code), patch);
}

export async function leaveRoom(code: string, playerId: string): Promise<void> {
  const snap = await getDoc(roomRef(code));
  if (!snap.exists()) return;
  const room = snap.data() as GarticRoom;
  const remaining = room.players.filter((p) => p.id !== playerId);
  if (remaining.length === 0) return;
  const newHostId = room.hostId === playerId ? remaining[0].id : room.hostId;
  await updateDoc(roomRef(code), { players: remaining, hostId: newHostId });
}

export async function startGame(roomCode: string): Promise<void> {
  const snap = await getDoc(roomRef(roomCode));
  if (!snap.exists()) return;
  const room = snap.data() as GarticRoom;
  const playerIds = room.players.map((p) => p.id);

  const books: Record<string, Book> = {};
  playerIds.forEach((id) => {
    books[id] = { id, ownerId: id, entries: [] };
  });

  await updateDoc(roomRef(roomCode), {
    status: 'writing',
    currentStep: 0,
    totalSteps: playerIds.length,
    stepStartedAt: Date.now(),
    stepDuration: 90000,
    books,
    readyPlayers: [],
  });
}

export async function submitTextEntry(
  roomCode: string,
  bookId: string,
  playerId: string,
  step: number,
  text: string
): Promise<void> {
  const entry: BookEntry = { step, authorId: playerId, type: 'text', text };
  await updateDoc(roomRef(roomCode), {
    [`books.${bookId}.entries`]: arrayUnion(entry),
    readyPlayers: arrayUnion(playerId),
  });
}

export async function submitDrawingEntry(
  roomCode: string,
  bookId: string,
  playerId: string,
  step: number,
  strokes: GarticStroke[],
  thumbnailDataUrl: string
): Promise<void> {
  const entry: BookEntry = {
    step,
    authorId: playerId,
    type: 'drawing',
    strokes: simplifyStrokes(strokes),
    thumbnailDataUrl,
  };
  await updateDoc(roomRef(roomCode), {
    [`books.${bookId}.entries`]: arrayUnion(entry),
    readyPlayers: arrayUnion(playerId),
  });
}

export async function advanceStep(roomCode: string): Promise<void> {
  const snap = await getDoc(roomRef(roomCode));
  if (!snap.exists()) return;
  const room = snap.data() as GarticRoom;
  const nextStep = room.currentStep + 1;
  const isLastStep = nextStep >= room.totalSteps;

  const nextStatus = isLastStep
    ? 'reveal'
    : nextStep % 2 === 1
      ? 'drawing'
      : 'writing';

  await updateDoc(roomRef(roomCode), {
    currentStep: nextStep,
    status: nextStatus,
    stepStartedAt: Date.now(),
    stepDuration: nextStatus === 'drawing' ? 120000 : 90000,
    readyPlayers: [],
  });
}

export async function setRevealBook(roomCode: string, bookIndex: number): Promise<void> {
  await updateDoc(roomRef(roomCode), { revealBookIndex: bookIndex, revealEntryIndex: 0 });
}

export async function advanceRevealEntry(roomCode: string): Promise<void> {
  const snap = await getDoc(roomRef(roomCode));
  if (!snap.exists()) return;
  const room = snap.data() as GarticRoom;
  await updateDoc(roomRef(roomCode), { revealEntryIndex: room.revealEntryIndex + 1 });
}

export async function finishReveal(roomCode: string): Promise<void> {
  await updateDoc(roomRef(roomCode), { status: 'finished' });
}

export async function playAgain(roomCode: string): Promise<void> {
  const snap = await getDoc(roomRef(roomCode));
  if (!snap.exists()) return;
  const room = snap.data() as GarticRoom;
  await updateDoc(roomRef(roomCode), {
    status: 'lobby',
    currentStep: 0,
    totalSteps: 0,
    stepStartedAt: 0,
    books: {},
    readyPlayers: [],
    revealBookIndex: -1,
    revealEntryIndex: 0,
    players: room.players.map((p) => ({ ...p, isConnected: true })),
  });
}
