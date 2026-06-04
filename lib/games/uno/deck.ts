import { UnoCard, UnoColor, UnoActionType } from '@/lib/types/uno';

const COLORS: UnoColor[] = ['red', 'blue', 'green', 'yellow'];
const ACTIONS: UnoActionType[] = ['skip', 'reverse', 'draw2'];

let _idCounter = 0;
function uid(): string {
  return `u${Date.now()}_${_idCounter++}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createShuffledUnoDeck(): UnoCard[] {
  const cards: UnoCard[] = [];

  for (const color of COLORS) {
    // One 0 per color
    cards.push({ id: uid(), kind: 'number', color, value: 0 });
    // Two of each 1-9 per color
    for (let v = 1; v <= 9; v++) {
      const val = v as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
      cards.push({ id: uid(), kind: 'number', color, value: val });
      cards.push({ id: uid(), kind: 'number', color, value: val });
    }
    // Two of each action per color
    for (const action of ACTIONS) {
      cards.push({ id: uid(), kind: 'action', color, value: action });
      cards.push({ id: uid(), kind: 'action', color, value: action });
    }
  }

  // 4 Wild + 4 Wild Draw 4
  for (let i = 0; i < 4; i++) {
    cards.push({ id: uid(), kind: 'wild', value: 'wild' });
    cards.push({ id: uid(), kind: 'wild', value: 'wild4' });
  }

  return shuffle(cards);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function reshuffleDiscard(discard: UnoCard[]): { deck: UnoCard[]; newDiscard: UnoCard[] } {
  if (discard.length === 0) return { deck: createShuffledUnoDeck(), newDiscard: [] };
  const newDiscard: UnoCard[] = [];
  const toShuffle = discard.map((c) => {
    if (c.kind === 'wild') return { ...c, chosenColor: undefined } as UnoCard;
    return c;
  });
  return { deck: shuffle(toShuffle), newDiscard };
}

export function drawCards(
  deck: UnoCard[],
  discardPile: UnoCard[],
  count: number
): { drawn: UnoCard[]; deck: UnoCard[]; discardPile: UnoCard[] } {
  let d = [...deck];
  let disc = [...discardPile];
  const drawn: UnoCard[] = [];

  for (let i = 0; i < count; i++) {
    if (d.length === 0) {
      const reshuffled = reshuffleDiscard(disc);
      d = reshuffled.deck;
      disc = reshuffled.newDiscard;
    }
    if (d.length === 0) break;
    drawn.push(d.pop()!);
  }

  return { drawn, deck: d, discardPile: disc };
}
