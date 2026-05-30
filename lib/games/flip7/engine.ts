import { Flip7Card, Flip7Player, Flip7ModifierValue } from '@/lib/types/flip7';
import { shuffleArray } from '@/lib/utils';
import { FLIP7_TARGET_COUNT, FLIP7_BONUS } from './deck';

const FLAT_MODIFIER_POINTS: Record<Flip7ModifierValue, number> = {
  x2: 0,
  '+2': 2,
  '+4': 4,
  '+6': 6,
  '+8': 8,
  '+10': 10,
};

export function activePlayerCount(players: Flip7Player[]): number {
  return players.filter((p) => p.status === 'active').length;
}

/** Next clockwise player with status 'active'; -1 if none remain. */
export function nextActiveIndex(players: Flip7Player[], from: number): number {
  const n = players.length;
  for (let i = 1; i <= n; i++) {
    const idx = (from + i) % n;
    if (players[idx].status === 'active') return idx;
  }
  return -1;
}

export function hasNumberValue(player: Flip7Player, value: number): boolean {
  return player.numberCards.some(
    (c) => c.type.kind === 'number' && c.type.value === value
  );
}

function hasX2(player: Flip7Player): boolean {
  return player.modifierCards.some(
    (c) => c.type.kind === 'modifier' && c.type.value === 'x2'
  );
}

function flatModifierSum(player: Flip7Player): number {
  return player.modifierCards.reduce((sum, c) => {
    if (c.type.kind !== 'modifier') return sum;
    return sum + FLAT_MODIFIER_POINTS[c.type.value];
  }, 0);
}

/** Round score for one player: (numbers × x2) + flat modifiers + Flip7 bonus. */
export function computePlayerRoundScore(player: Flip7Player): number {
  if (player.status === 'busted') return 0;
  const numberSum = player.numberCards.reduce(
    (sum, c) => (c.type.kind === 'number' ? sum + c.type.value : sum),
    0
  );
  const base = hasX2(player) ? numberSum * 2 : numberSum;
  const bonus = player.status === 'flip7' ? FLIP7_BONUS : 0;
  return base + flatModifierSum(player) + bonus;
}

/** Sets roundScore for every player and folds it into totalScore. */
export function calculateRoundScores(players: Flip7Player[]): Flip7Player[] {
  return players.map((p): Flip7Player => {
    const roundScore = computePlayerRoundScore(p);
    return { ...p, roundScore, totalScore: p.totalScore + roundScore };
  });
}

export function reachedFlip7(player: Flip7Player): boolean {
  return player.numberCards.length >= FLIP7_TARGET_COUNT;
}

/** Draw the top card, reshuffling the discard pile into the deck if empty. */
export function drawCard(
  deck: Flip7Card[],
  discard: Flip7Card[]
): { card: Flip7Card | null; deck: Flip7Card[]; discard: Flip7Card[] } {
  let d = deck;
  let disc = discard;
  if (d.length === 0) {
    if (disc.length === 0) return { card: null, deck: d, discard: disc };
    d = shuffleArray(disc);
    disc = [];
  }
  const [card, ...rest] = d;
  return { card, deck: rest, discard: disc };
}
