import { BasePlayer, BaseRoom } from './core';

// Gartic ne dodaje polja preko BasePlayer
export type GarticPlayer = BasePlayer;

export interface GarticStroke {
  points: [number, number][];
  color: string;
  width: number;
  tool: 'pen' | 'eraser';
}

export interface BookEntry {
  step: number;
  authorId: string;
  type: 'text' | 'drawing';
  text?: string;
  strokes?: GarticStroke[];
  thumbnailDataUrl?: string;
}

export interface Book {
  id: string;
  ownerId: string;
  entries: BookEntry[];
}

export type GarticStatus = 'lobby' | 'writing' | 'drawing' | 'reveal' | 'finished';

export interface GarticRoom extends BaseRoom {
  gameType: 'gartic';
  status: GarticStatus;
  players: GarticPlayer[];

  currentStep: number;
  totalSteps: number;
  stepStartedAt: number;
  stepDuration: number;

  books: Record<string, Book>;
  readyPlayers: string[];

  revealBookIndex: number;
  revealEntryIndex: number;
}
