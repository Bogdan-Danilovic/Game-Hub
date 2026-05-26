import { Category, CategoryData } from '@/lib/types/impostor';
import { hrana } from './hrana';
import { filmovi } from './filmovi';
import { sport } from './sport';
import { zivotinje } from './zivotinje';
import { svakodnevica } from './svakodnevica';
import { muzika } from './muzika';
import { tehnologija } from './tehnologija';
import { priroda } from './priroda';
import { istorija } from './istorija';
import { popkultura } from './popkultura';

export const CATEGORIES: Record<Category, CategoryData> = {
  hrana,
  filmovi,
  sport,
  zivotinje,
  svakodnevica,
  muzika,
  tehnologija,
  priroda,
  istorija,
  popkultura,
};

export function getRandomPrompt(
  category: Category,
  mode: 'sentences' | 'concepts'
): { crew: string; impostor: string } {
  const prompts = CATEGORIES[category][mode];
  return prompts[Math.floor(Math.random() * prompts.length)];
}
