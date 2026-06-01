import type { Timestamp } from 'firebase/firestore';

export interface GamePerGameStat {
  played: number;
  wins: number;
}

export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  gamesHosted: number;
  /** Per-game breakdown keyed by gameType (e.g. "impostor", "flip7"). */
  gamesPerGame?: Record<string, GamePerGameStat>;
}

export interface UserProfile {
  displayName: string;
  username: string;
  photoURL: string;
  createdAt: Timestamp;
  stats: UserStats;
  premiumUntil: Timestamp | null;
  friends: string[];
  /** True for anonymous "guest identity" accounts (Firebase Anonymous Auth). */
  isGuest?: boolean;
  /** Presence heartbeat — updated every ~60s while the app is open. */
  lastSeen?: Timestamp | null;
  /** Emoji avatar fallback, used when there is no photoURL (guests). */
  avatar?: string;
  /** Hex accent color for the avatar chip (guests). */
  color?: string;
}

export interface GameHistoryEntry {
  roomCode: string;
  gameName: string;
  playedAt: Timestamp;
  isWinner: boolean;
  players: string[];
}

export interface UsernameRecord {
  uid: string;
}
