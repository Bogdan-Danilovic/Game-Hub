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

/** A fresh Druga šansa card for the discard pile (the held one is tracked as a flag). */
export function makeDrugaSansaCard(): Flip7Card {
  return {
    id: `ds-${Math.random().toString(36).slice(2, 9)}`,
    type: { kind: 'action', value: 'druga_sansa' },
  };
}

/** Hand a Druga šansa to players[idx]; pass it clockwise if taken, else discard. */
function giveDrugaSansa(
  players: Flip7Player[],
  idx: number,
  card: Flip7Card,
  discard: Flip7Card[]
): string {
  const p = players[idx];
  if (!p.hasDrugaSansa) {
    players[idx] = { ...p, hasDrugaSansa: true };
    return `${p.name} dobija Drugu šansu.`;
  }
  const n = players.length;
  for (let i = 1; i <= n; i++) {
    const j = (idx + i) % n;
    const q = players[j];
    if (q.status === 'active' && !q.hasDrugaSansa) {
      players[j] = { ...q, hasDrugaSansa: true };
      return `Druga šansa prelazi na ${q.name}.`;
    }
  }
  discard.push(card);
  return 'Druga šansa se odbacuje.';
}

export interface DealtCardResult {
  players: Flip7Player[];
  discard: Flip7Card[];
  flip7: boolean;
  busted: boolean;
  pendingStop: boolean;
  pendingOkreniTri: boolean;
  event: string;
}

/**
 * Apply one drawn card to players[idx]. Pure — does not advance the turn.
 * insideOkreniTri defers a revealed Stop (caller applies it) and discards a nested Okreni tri.
 */
export function applyDealtCard(
  players: Flip7Player[],
  idx: number,
  card: Flip7Card,
  discard: Flip7Card[],
  insideOkreniTri: boolean
): DealtCardResult {
  const next = [...players];
  const disc = [...discard];
  const p = next[idx];
  const result: DealtCardResult = {
    players: next,
    discard: disc,
    flip7: false,
    busted: false,
    pendingStop: false,
    pendingOkreniTri: false,
    event: '',
  };

  if (card.type.kind === 'number') {
    const value = card.type.value;
    if (hasNumberValue(p, value)) {
      if (p.hasDrugaSansa) {
        next[idx] = { ...p, hasDrugaSansa: false };
        disc.push(card, makeDrugaSansaCard());
        result.event = `${p.name} koristi Drugu šansu i ostaje u igri.`;
      } else {
        next[idx] = { ...p, numberCards: [...p.numberCards, card], status: 'busted' };
        result.busted = true;
        result.event = `${p.name} je pukao na ${value}.`;
      }
    } else {
      const numberCards = [...p.numberCards, card];
      if (numberCards.length >= FLIP7_TARGET_COUNT) {
        next[idx] = { ...p, numberCards, status: 'flip7' };
        result.flip7 = true;
        result.event = `${p.name} je sakupio 7 karata — FLIP 7!`;
      } else {
        next[idx] = { ...p, numberCards };
        result.event = `${p.name} izvlači ${value}.`;
      }
    }
    return result;
  }

  if (card.type.kind === 'modifier') {
    next[idx] = { ...p, modifierCards: [...p.modifierCards, card] };
    result.event = `${p.name} dobija ${card.type.value}.`;
    return result;
  }

  const action = card.type.value;
  if (action === 'stop') {
    disc.push(card);
    result.pendingStop = true;
    result.event = `${p.name} izvlači Stop.`;
    return result;
  }
  if (action === 'okreni_tri') {
    disc.push(card);
    if (insideOkreniTri) {
      result.event = 'Okreni tri se odbacuje.';
    } else {
      result.pendingOkreniTri = true;
      result.event = `${p.name} izvlači Okreni tri.`;
    }
    return result;
  }

  result.event = giveDrugaSansa(next, idx, card, disc);
  return result;
}
