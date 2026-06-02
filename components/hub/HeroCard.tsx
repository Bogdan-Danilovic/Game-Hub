import type { GameDefinition } from '@/lib/games/registry';
import { hexA } from '@/lib/utils';

interface HeroCardProps {
  game: GameDefinition;
  active: boolean;
}

/**
 * Featured-game hero slide (200px) with a radial accent gradient, drop-shadowed
 * emoji, tag badge and status line. Rendered inside the Hub carousel.
 */
export function HeroCard({ game, active }: HeroCardProps) {
  const a = game.accentColor;
  return (
    <div
      className={`box-border w-full shrink-0 px-5 transition-opacity duration-500 ${
        active ? 'opacity-100' : 'opacity-30'
      }`}
    >
      <div
        className="relative h-[200px] overflow-hidden rounded-3xl"
        style={{
          background: `linear-gradient(145deg, ${hexA(a, 0.33)} 0%, rgba(0,0,0,0.9) 100%)`,
          boxShadow: `0 20px 60px ${hexA(a, 0.27)}`,
        }}
      >
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(circle at 30% 50%, ${hexA(a, 0.2)} 0%, transparent 70%)` }}
        />
        <div className="relative box-border flex h-full flex-col justify-between p-6">
          <div className="flex items-start justify-between">
            <span
              className="rounded-lg px-2.5 py-[3px] text-[10px] font-extrabold uppercase tracking-[1px]"
              style={{ color: a, background: hexA(a, 0.16) }}
            >
              {(game.tags[0] || '').toUpperCase()}
            </span>
            <div className="text-[52px] leading-none" style={{ filter: `drop-shadow(0 0 20px ${hexA(a, 0.53)})` }}>
              {game.icon}
            </div>
          </div>
          <div>
            <div className="mb-1 text-[26px] font-extrabold tracking-[-0.5px] text-white">{game.name}</div>
            <div className="flex items-center gap-2">
              <div className="h-[7px] w-[7px] rounded-full" style={{ background: a, boxShadow: `0 0 8px ${a}` }} />
              <span className="text-[13px] text-white/60">{game.shortDescription}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
