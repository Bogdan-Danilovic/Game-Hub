'use client';

import { useRouter } from 'next/navigation';
import type { GameDefinition } from '@/lib/games/registry';

export function HotCard({ game, delay = 0 }: { game: GameDefinition; delay?: number }) {
  const router = useRouter();
  const a = game.accentColor;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => game.available && router.push(game.path)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (game.available) router.push(game.path);
        }
      }}
      className="relative rounded-[18px] overflow-hidden cursor-pointer"
      style={{ background: `linear-gradient(145deg, ${a}55 0%, ${a}22 100%)`, minHeight: 100, touchAction: 'pan-y' }}
    >
      <div
        className="gh-bob absolute right-2 bottom-2 text-[38px] opacity-[0.22] select-none leading-none"
        style={{ animationDelay: `${delay}s` }}
      >
        {game.icon}
      </div>
      <div className="relative p-3">
        <div
          className="inline-block rounded-md px-2 py-0.5 mb-2 text-[9px] font-bold text-white"
          style={{ background: '#ef4444' }}
        >
          🔥 HOT
        </div>
        <div
          className="text-[13px] font-bold text-white leading-tight mb-1 truncate"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {game.name}
        </div>
        <div className="text-[11px] text-white/55">
          {game.minPlayers}–{game.maxPlayers} igrača
        </div>
      </div>
    </div>
  );
}
