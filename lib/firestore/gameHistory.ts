'use client';

import {
  doc,
  setDoc,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { GameHistoryEntry } from '@/types/auth';

/**
 * Writes a single game result to gameHistory/{uid}/games/{gameId}.
 * Called after a game ends, only if the player is authenticated.
 */
export async function writeGameHistory(
  uid: string,
  gameId: string,
  entry: GameHistoryEntry
): Promise<void> {
  const ref = doc(db, 'gameHistory', uid, 'games', gameId);
  await setDoc(ref, entry);
}

/**
 * Atomically increments the stats sub-fields on users/{uid}.
 * Does NOT touch premiumUntil — that is server-action territory.
 */
export async function incrementStats(
  uid: string,
  isWinner: boolean,
  isHost: boolean
): Promise<void> {
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, {
    'stats.gamesPlayed': increment(1),
    ...(isWinner && { 'stats.gamesWon': increment(1) }),
    ...(isHost && { 'stats.gamesHosted': increment(1) }),
  });
}
