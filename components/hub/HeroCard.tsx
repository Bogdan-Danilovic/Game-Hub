'use client';

import { useRouter } from 'next/navigation';
import type { GameDefinition } from '@/lib/games/registry';

export function HeroCard({ game }: { game: GameDefinition }) {
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
      className="relative rounded-[22px] overflow-hidden cursor-pointer"
      style={{ background: `linear-gradient(145deg, ${a}55 0%, ${a}1a 100%)`, minHeight: 178, touchAction: 'pan-y' }}
    >
      <div
        className="absolute rounded-full pointer-events-none"
        style={{ right: -25, top: -25, width: 130, height: 130, background: 'rgba(255,255,255,0.06)' }}
      />
      <div className="gh-bob absolute right-4 bottom-2 text-[70px] opacity-[0.22] select-none leading-none pointer-events-none">
        {game.icon}
      </div>
      <div className="relative p-5 flex flex-col" style={{ minHeight: 178 }}>
        <div
          className="inline-flex items-center self-start rounded-2xl px-3 py-1 mb-4"
          style={{ background: 'rgba(0,0,0,0.35)' }}
        >
          <span className="text-[10px] font-bold tracking-[1.4px] text-yellow-400">★ FEATURED</span>
        </div>
        <div className="text-[24px] font-bold text-white leading-tight mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
          {game.name}
        </div>
        <div className="text-[12px] text-white/60 mb-5">
          {game.shortDescription} · {game.minPlayers}–{game.maxPlayers} igrača
        </div>
        <div
          className="inline-flex items-center gap-1.5 self-start rounded-xl px-4 py-2 text-[12px] font-bold"
          style={{ background: 'rgba(255,255,255,0.92)', color: a }}
        >
          ▶ IGRAJ
        </div>
      </div>
    </div>
  );
}
