import { BasePlayer, BaseRoom, GameSettings } from '@/lib/types/core';
import { SpicyCard, SpicyClaim } from '@/lib/games/spicy/types';

export interface SpicyFirestorePlayer extends BasePlayer {
  hand: SpicyCard[];
  wonCardsCount: number;
  trophies: number;
}

export interface SpicyFirestoreChallengeResult {
  topCard: SpicyCard;
  challengeType: 'spice' | 'number';
  outcome: 'challenger_wins' | 'player_wins';
  challengerIndex: number;
  playerIndex: number;
  winnerIndex: number;
  loserIndex: number;
  pileCount: number;
}

export interface SpicyRoom extends Omit<BaseRoom, 'players'> {
  gameType: 'spicy';
  players: SpicyFirestorePlayer[];
  settings: GameSettings;
  drawPile: SpicyCard[];
  pile: SpicyCard[];
  lastClaim: SpicyClaim | null;
  isFirstOnPile: boolean;
  currentPlayerIndex: number;
  trophiesLeft: number;
  challengeResult: SpicyFirestoreChallengeResult | null;
  lastCardPlayerIndex: number | null;
  lastCardChallengeWon: boolean | null;
  noChallengeVotes: string[];
  winnerId: string | null;
  lastEvent: string | null;
}
