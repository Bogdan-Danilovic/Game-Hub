import type { Timestamp } from 'firebase/firestore';

export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  gamesHosted: number;
}

export interface UserProfile {
  displayName: string;
  username: string;
  photoURL: string;
  createdAt: Timestamp;
  stats: UserStats;
  premiumUntil: Timestamp | null;
  friends: string[];
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
