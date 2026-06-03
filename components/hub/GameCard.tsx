'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import type { GameDefinition } from '@/lib/games/registry';

const TAG_COLORS: Record<string, string> = {
  dedukcija: '#8b5cf6',
  blef: '#ef4444',
  tim: '#0891b2',
  brzina: '#f59e0b',
  karte: '#f59e0b',
  sreća: '#ec4899',
  uloge: '#ef4444',
  znanje: '#059669',
  kviz: '#059669',
  riječi: '#0891b2',
};

export function GameCard({ game, index }: { game: GameDefinition; index: number }) {
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const a = game.accentColor;
  const tagColor = TAG_COLORS[game.tags[0]] ?? a;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 26 }}
      role="button"
      tabIndex={0}
      onClick={() => game.available && router.push(game.path)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (game.available) router.push(game.path);
        }
      }}
      className={`rounded-[18px] overflow-hidden border border-white/[0.08] bg-white/[0.04] ${
        game.available ? 'cursor-pointer' : 'cursor-not-allowed opacity-55'
      }`}
      style={{ touchAction: 'pan-y' }}
    >
      {/* Thumbnail */}
      <div className="relative h-[90px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0" style={{ background: `linear-gradient(145deg, ${a}30 0%, ${a}10 100%)` }} />
        <div
          className="gh-bob text-[36px] relative select-none leading-none"
          style={{ animationDelay: `${index * 0.22}s`, animationDuration: `${2.4 + index * 0.1}s` }}
        >
          {game.icon}
        </div>
        <button
          type="button"
          aria-label={liked ? 'Ukloni iz omiljenih' : 'Dodaj u omiljene'}
          onClick={(e) => { e.stopPropagation(); setLiked((p) => !p); }}
          className="absolute top-2 left-2 w-[26px] h-[26px] flex items-center justify-center rounded-lg text-[12px] touch-target"
          style={{ background: 'rgba(0,0,0,0.5)' }}
        >
          {liked ? '❤️' : '🤍'}
        </button>
        {!game.available && (
          <div
            className="absolute top-2 right-2 rounded-md px-1.5 py-0.5 text-[8px] font-bold text-white/70"
            style={{ background: 'rgba(255,255,255,0.12)' }}
          >
            USKORO
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5">
        <div className="text-[12.5px] font-bold text-white truncate mb-1.5" style={{ fontFamily: 'var(--font-heading)' }}>
          {game.name}
        </div>
        <div className="flex items-center justify-between gap-1">
          <div
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-md truncate"
            style={{ color: tagColor, background: `${tagColor}22` }}
          >
            {game.tags[0]}
          </div>
          <div className="text-[10px] text-white/30 shrink-0">
            {game.minPlayers}–{game.maxPlayers}p
          </div>
        </div>
      </div>
    </motion.div>
  );
}
