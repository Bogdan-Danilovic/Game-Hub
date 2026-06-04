import { UnoCard, UnoColor, UnoPlayer } from '@/lib/types/uno';

export function canPlayCard(card: UnoCard, topCard: UnoCard, currentColor: UnoColor): boolean {
  if (card.kind === 'wild') return true;

  if (topCard.kind === 'wild') {
    // After a wild: match by chosen color
    return card.color === currentColor;
  }

  if (card.color === currentColor) return true;
  if (card.kind === 'number' && topCard.kind === 'number') return card.value === topCard.value;
  if (card.kind === 'action' && topCard.kind === 'action') return card.value === topCard.value;

  return false;
}

export function nextIndex(
  players: UnoPlayer[],
  current: number,
  direction: 1 | -1,
  skip = 0
): number {
  const n = players.length;
  let idx = current;
  for (let i = 0; i < 1 + skip; i++) {
    idx = ((idx + direction) % n + n) % n;
  }
  return idx;
}

export function cardScore(card: UnoCard): number {
  if (card.kind === 'number') return card.value;
  if (card.kind === 'wild') return 50;
  return 20; // action
}

export function handScore(hand: UnoCard[]): number {
  return hand.reduce((sum, c) => sum + cardScore(c), 0);
}

export function hasPlayableCard(hand: UnoCard[], topCard: UnoCard, currentColor: UnoColor): boolean {
  return hand.some((c) => canPlayCard(c, topCard, currentColor));
}

export function colorFromTop(topCard: UnoCard): UnoColor {
  if (topCard.kind === 'wild') return topCard.chosenColor ?? 'red';
  return topCard.color;
}
