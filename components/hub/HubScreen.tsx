'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { GAMES } from '@/lib/games/registry';
import { HeroCard } from './HeroCard';
import { HotCard } from './HotCard';
import { MoodChip } from './MoodChip';
import { GameCard } from './GameCard';

const MOOD_ACCENTS = ['#8b5cf6', '#0891b2', '#ef4444', '#f59e0b', '#059669', '#64d2ff', '#bf5af2', '#ff375f'];

export function HubScreen() {
  const [activeMood, setActiveMood] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const available = useMemo(() => GAMES.filter((g) => g.available), []);
  const moods = useMemo(() => ['Sve', ...Array.from(new Set(GAMES.flatMap((g) => g.tags)))], []);

  const featuredGame = available[0];
  const hotGames = available.slice(1, 3);

  const visible = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let base = activeMood === 0 ? GAMES : GAMES.filter((g) => g.tags.includes(moods[activeMood]));
    if (q) {
      base = base.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.shortDescription.toLowerCase().includes(q) ||
          g.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return base;
  }, [activeMood, moods, searchQuery]);

  const showBento = !searchQuery && activeMood === 0;

  return (
    <div className="w-full" style={{ animation: 'gh-slide 0.3s ease both' }}>
      {/* Search */}
      <label className="mb-6 flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 focus-within:border-white/25 transition-colors">
        <Search size={16} strokeWidth={2} className="shrink-0 text-white/35" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setActiveMood(0); }}
          placeholder="Pretraži igrice…"
          className="flex-1 bg-transparent text-[15px] text-white placeholder:text-white/30 outline-none"
        />
      </label>

      {/* Bento hero — hidden when searching */}
      {showBento && (
        <div className="mb-6">
          {featuredGame && <HeroCard game={featuredGame} />}
          {hotGames.length > 0 && (
            <div className="mt-2.5 grid grid-cols-2 gap-2.5">
              {hotGames.map((g, i) => (
                <HotCard key={g.id} game={g} delay={i * 0.6} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Category filter */}
      <div className="mb-6">
        <div className="mb-3.5 flex items-center justify-between">
          <span className="text-[22px] font-extrabold tracking-[-0.5px] text-white">Istraži</span>
          {activeMood !== 0 && (
            <button
              type="button"
              onClick={() => setActiveMood(0)}
              className="text-[12px] font-semibold"
              style={{ color: '#8b5cf6' }}
            >
              Sve ›
            </button>
          )}
        </div>
        <div className="gh-noscroll -mx-5 flex gap-2.5 overflow-x-auto px-5">
          {moods.map((m, i) => (
            <MoodChip
              key={m}
              label={m}
              accent={MOOD_ACCENTS[i % MOOD_ACCENTS.length]}
              active={i === activeMood}
              onClick={() => setActiveMood(i)}
            />
          ))}
        </div>
      </div>

      {/* 2-col game grid */}
      <div className="mb-3 text-[22px] font-extrabold tracking-[-0.5px] text-white">
        {searchQuery ? `Rezultati (${visible.length})` : 'Sve igrice'}
      </div>
      {visible.length === 0 ? (
        <div className="py-12 text-center text-white/30 text-sm">
          Nema igrica za &ldquo;{searchQuery}&rdquo;
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3" style={{ animation: 'gh-fade 0.4s ease both' }}>
          {visible.map((g, i) => (
            <GameCard key={g.id} game={g} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
