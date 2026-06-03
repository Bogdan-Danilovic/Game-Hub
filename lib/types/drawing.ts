import { BasePlayer, BaseRoom } from './core';

export interface DrawingPlayer extends BasePlayer {
  score: number;
}

export interface Stroke {
  id: string;
  points: [number, number][];
  color: string;
  width: number;
  tool: 'pen' | 'eraser';
}

export interface PartialStroke {
  drawerId: string;
  points: [number, number][];
  color: string;
  width: number;
  tool: 'pen' | 'eraser';
}

export interface ChatMessage {
  playerId: string;
  playerName: string;
  text: string;
  isCorrectGuess: boolean;
  timestamp: number;
}

export type DrawingStatus =
  | 'lobby'
  | 'word-selection'
  | 'drawing'
  | 'round-results'
  | 'finished';

export interface DrawingRoom extends BaseRoom {
  gameType: 'drawing';
  status: DrawingStatus;
  players: DrawingPlayer[];

  currentDrawer: string;
  currentWord: string;
  wordHint: string;
  currentRound: number;
  totalRounds: number;

  roundStartedAt: number;
  roundDuration: number;

  strokes: Stroke[];
  currentStroke: PartialStroke | null;

  chat: ChatMessage[];
  guessedPlayers: string[];

  drawerOrder: string[];
  scores: Record<string, number>;
}
