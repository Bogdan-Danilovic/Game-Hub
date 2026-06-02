import type { GameDefinition } from '@/lib/games/registry';
import { hexA } from '@/lib/utils';

interface GameIconProps {
  game: Pick<GameDefinition, 'icon' | 'accentColor'>;
  size?: number;
}

/**
 * Rounded-square game icon with an accent gradient and layered inner/outer shadow.
 * Shared visual primitive used by the Hub list, hero, lobby, and floating action bar.
 */
export function GameIcon({ game, size = 56 }: GameIconProps) {
  const { icon, accentColor } = game;
  return (
    <div
      className="flex shrink-0 select-none items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.39,
        fontSize: Math.round(size * 0.55),
        background: `linear-gradient(135deg, ${accentColor}, ${hexA(accentColor, 0.55)})`,
        boxShadow: `inset 0 1px 1px rgba(255,255,255,0.35), inset 0 -2px 5px rgba(0,0,0,0.28), 0 6px 18px ${hexA(accentColor, 0.34)}`,
      }}
    >
      {icon}
    </div>
  );
}
