'use client';

import { Users, Clock, ChevronRight } from 'lucide-react';
import type { GameDefinition } from '@/lib/games/registry';
import { GameIcon } from '@/components/GameIcon';

const ONLINE = '#30d158';

interface GameRowProps {
  game: GameDefinition;
  onOpen: (game: GameDefinition) => void;
}

/**
 * Single game list row: icon, name, animated availability dot, player range and
 * duration. Press feedback via Tailwind active: state (no JS state needed).
 */
export function GameRow({ game, onOpen }: GameRowProps) {
  const available = game.available;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(game)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(game);
        }
      }}
      className="flex cursor-pointer items-center gap-3.5 rounded-[14px] px-4 py-3 transition-all duration-150 active:scale-[0.98] active:bg-white/10"
      style={{ opacity: available ? 1 : 0.62 }}
    >
      <GameIcon game={game} size={56} />
      <div className="min-w-0 flex-1">
        <div className="mb-[3px] text-base font-semibold text-white">{game.name}</div>
        <div className="flex flex-wrap items-center gap-1.5 text-[13px] text-white/45">
          <span className="inline-flex items-center gap-[5px]">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background: available ? ONLINE : 'rgba(255,255,255,0.3)',
                boxShadow: available ? `0 0 6px ${ONLINE}` : 'none',
                animation: available ? 'gh-pulse 2s ease-in-out infinite' : 'none',
              }}
            />
            <span className="font-semibold" style={{ color: available ? ONLINE : 'rgba(255,255,255,0.4)' }}>
              {available ? 'Dostupno' : 'Uskoro'}
            </span>
          </span>
          <span className="opacity-60">·</span>
          <span className="inline-flex items-center gap-1">
            <Users size={13} strokeWidth={2} />
            {game.minPlayers}–{game.maxPlayers}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={13} strokeWidth={2} />
            {game.avgDuration}
          </span>
        </div>
      </div>
      <ChevronRight size={20} strokeWidth={2.5} className="shrink-0 text-white/25" />
    </div>
  );
}
