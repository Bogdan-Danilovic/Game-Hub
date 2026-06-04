import { BasePlayer, BaseRoom, GameSettings } from './core';

export type { RoomStatus } from './core';

export type UnoColor = 'red' | 'blue' | 'green' | 'yellow';
export type UnoActionType = 'skip' | 'reverse' | 'draw2';
export type UnoWildType = 'wild' | 'wild4';

export type UnoCard =
  | { id: string; kind: 'number'; color: UnoColor; value: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 }
  | { id: string; kind: 'action'; color: UnoColor; value: UnoActionType }
  | { id: string; kind: 'wild'; value: UnoWildType; chosenColor?: UnoColor };

export interface UnoPlayer extends BasePlayer {
  hand: UnoCard[];
  saidUno: boolean;
  totalScore: number;
  roundScore: number;
}

export interface UnoPendingAction {
  type: 'choose_color' | null;
  byPlayerId: string | null;
  isWild4: boolean;
}

export interface UnoSettings extends GameSettings {
  targetScore: number;
}

export type UnoStatus = 'lobby' | 'playing' | 'round_end' | 'finished';

export interface UnoRoom extends BaseRoom {
  gameType: 'uno';
  status: UnoStatus;
  players: UnoPlayer[];
  settings: UnoSettings;
  deck: UnoCard[];
  discardPile: UnoCard[];
  topCard: UnoCard;
  currentColor: UnoColor;
  currentPlayerIndex: number;
  direction: 1 | -1;
  pendingAction: UnoPendingAction;
  winnerId: string | null;
  roundNumber: number;
  lastEvent: string | null;
}
