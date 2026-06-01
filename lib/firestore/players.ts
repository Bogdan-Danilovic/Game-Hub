'use client';

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  documentId,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { writeGameHistory } from '@/lib/firestore/gameHistory';
import type { UserProfile } from '@/types/auth';

/** How long after `lastSeen` a player is still considered "online". */
export const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;

const GUEST_AVATARS = [
  '🎮', '👾', '🦊', '🐼', '🦁', '🐙', '🦄', '🐸',
  '🦉', '🐺', '🦅', '🐯', '🦖', '🐨', '🦝', '🐲',
];
const GUEST_COLORS = [
  '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#ec4899', '#3b82f6', '#a78bfa',
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function guestAvatarFor(uid: string): string {
  return GUEST_AVATARS[hashString(uid) % GUEST_AVATARS.length];
}

export function guestColorFor(uid: string): string {
  return GUEST_COLORS[hashString(uid + 'c') % GUEST_COLORS.length];
}

export interface LeaderboardRow {
  uid: string;
  profile: UserProfile;
}

/**
 * Atomically increments aggregate + per-game stats on `users/{playerId}`.
 * The document must already exist (call `ensureGuestProfile` first for guests).
 * Shared entry point used by every game at round end — also from other game repos
 * via `@/lib/firestore/players`.
 */
export async function updatePlayerStats(
  playerId: string,
  gameType: string,
  won: boolean,
): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', playerId), {
      'stats.gamesPlayed': increment(1),
      'stats.gamesWon': increment(won ? 1 : 0),
      [`stats.gamesPerGame.${gameType}.played`]: increment(1),
      [`stats.gamesPerGame.${gameType}.wins`]: increment(won ? 1 : 0),
    });
  } catch (err) {
    throw new Error(
      `updatePlayerStats failed for ${playerId}/${gameType}: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
}

/**
 * Creates a guest profile doc for an anonymous user if one does not exist yet.
 * No-op when the document already exists, so it is safe to call on every game end.
 */
export async function ensureGuestProfile(
  playerId: string,
  displayName?: string,
): Promise<void> {
  try {
    const ref = doc(db, 'users', playerId);
    const snap = await getDoc(ref);
    if (snap.exists()) return;
    await setDoc(ref, {
      displayName: displayName?.trim() || `Gost-${playerId.slice(0, 4)}`,
      username: `gost_${playerId.slice(0, 6).toLowerCase()}`,
      photoURL: '',
      createdAt: serverTimestamp(),
      stats: { gamesPlayed: 0, gamesWon: 0, gamesHosted: 0, gamesPerGame: {} },
      premiumUntil: null,
      friends: [],
      isGuest: true,
      lastSeen: serverTimestamp(),
      avatar: guestAvatarFor(playerId),
      color: guestColorFor(playerId),
    });
  } catch (err) {
    throw new Error(
      `ensureGuestProfile failed for ${playerId}: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
}

/** Updates a player's editable presentation fields (name / emoji avatar / color). */
export async function setPlayerProfile(
  playerId: string,
  fields: { displayName?: string; avatar?: string; color?: string },
): Promise<void> {
  const patch: Record<string, string> = {};
  if (fields.displayName !== undefined) patch.displayName = fields.displayName.trim();
  if (fields.avatar !== undefined) patch.avatar = fields.avatar;
  if (fields.color !== undefined) patch.color = fields.color;
  if (Object.keys(patch).length === 0) return;
  try {
    await updateDoc(doc(db, 'users', playerId), patch);
  } catch (err) {
    throw new Error(
      `setPlayerProfile failed for ${playerId}: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
}

/** Best-effort presence heartbeat. Requires an existing profile doc. */
export async function touchLastSeen(playerId: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', playerId), { lastSeen: serverTimestamp() });
  } catch {
    // Presence is non-critical: a missing doc or transient failure must never
    // surface to the user. Intentionally swallowed (documented best-effort write).
  }
}

/**
 * Records a finished game for a player: ensures a profile exists, increments
 * stats (aggregate + per-game, plus hosted), and writes a game-history entry.
 * Safe to call for both logged-in and guest (anonymous) accounts.
 */
export async function recordGameResult(params: {
  playerId: string;
  gameType: string;
  gameName: string;
  won: boolean;
  isHost: boolean;
  roomCode: string;
  gameKey: string;
  playerNames: string[];
}): Promise<void> {
  const { playerId, gameType, gameName, won, isHost, roomCode, gameKey, playerNames } = params;
  await ensureGuestProfile(playerId);
  await updatePlayerStats(playerId, gameType, won);
  if (isHost) {
    await updateDoc(doc(db, 'users', playerId), { 'stats.gamesHosted': increment(1) });
  }
  const { Timestamp } = await import('firebase/firestore');
  await writeGameHistory(playerId, gameKey, {
    roomCode,
    gameName,
    playedAt: Timestamp.now(),
    isWinner: won,
    players: playerNames,
  });
}

/**
 * Real-time top-20 leaderboard. `gameType === null` ranks by total wins,
 * otherwise by wins within that game.
 */
export function subscribeLeaderboard(
  gameType: string | null,
  onData: (rows: LeaderboardRow[]) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  const field = gameType ? `stats.gamesPerGame.${gameType}.wins` : 'stats.gamesWon';
  const q = query(collection(db, 'users'), orderBy(field, 'desc'), limit(20));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ uid: d.id, profile: d.data() as UserProfile }))),
    (err) => onError(err),
  );
}

/**
 * Real-time subscription to a list of friend profiles (chunked into Firestore's
 * 10-item `in` limit). Online status is derived in the UI from `lastSeen`.
 */
export function subscribeFriendProfiles(
  friendIds: string[],
  onData: (rows: LeaderboardRow[]) => void,
  onError: (err: Error) => void,
): Unsubscribe {
  if (friendIds.length === 0) {
    onData([]);
    return () => {};
  }

  const chunks: string[][] = [];
  for (let i = 0; i < friendIds.length; i += 10) {
    chunks.push(friendIds.slice(i, i + 10));
  }

  const byChunk = new Map<number, LeaderboardRow[]>();
  const emit = (): void => {
    const merged: LeaderboardRow[] = [];
    for (const rows of byChunk.values()) merged.push(...rows);
    onData(merged);
  };

  const unsubs = chunks.map((chunk, index) =>
    onSnapshot(
      query(collection(db, 'users'), where(documentId(), 'in', chunk)),
      (snap) => {
        byChunk.set(index, snap.docs.map((d) => ({ uid: d.id, profile: d.data() as UserProfile })));
        emit();
      },
      (err) => onError(err),
    ),
  );

  return () => unsubs.forEach((u) => u());
}
