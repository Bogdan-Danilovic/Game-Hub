'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { GAMES, GameDefinition } from '@/lib/games/registry';

const SPRING = { type: 'spring' as const, stiffness: 280, damping: 28 };

function getCardStyle(offset: number) {
  const sign = offset < 0 ? -1 : 1;
  const abs = Math.abs(offset);
  if (abs === 0) return { x: 0,        rotateY: 0,          scale: 1.03, z: 100, opacity: 1,    blur: 0   };
  if (abs === 1) return { x: sign*272,  rotateY: -sign*38,   scale: 0.83, z: 0,   opacity: 0.62, blur: 0.5 };
  if (abs === 2) return { x: sign*468,  rotateY: -sign*56,   scale: 0.66, z: -80, opacity: 0.28, blur: 2   };
  return               { x: sign*580,  rotateY: -sign*65,   scale: 0.52, z: -160,opacity: 0,    blur: 4   };
}

function CarouselCard({ game, active }: { game: GameDefinition; active: boolean }) {
  return (
    <div
      className="relative h-full rounded-2xl overflow-hidden flex flex-col p-7 gap-4"
      style={{
        background: active
          ? 'linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)'
          : 'var(--bg-card)',
        border: `1px solid ${active ? 'rgba(255,255,255,0.13)' : 'var(--border-card)'}`,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {active && (
        <div
          className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{
            background: `radial-gradient(ellipse at 50% -10%, ${game.accentColor}28, transparent 65%)`,
          }}
        />
      )}

      {!game.available && (
        <span className="absolute top-4 right-4 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/8 text-slate-400 z-10">
          Uskoro
        </span>
      )}

      <div className="relative z-10 flex flex-col h-full gap-3">
        <span className="text-5xl leading-none select-none">{game.icon}</span>
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {game.name}
          </h2>
          <p className="text-sm text-slate-400 mt-1 leading-relaxed line-clamp-3">
            {game.description}
          </p>
        </div>
        <div className="flex gap-2 text-xs text-slate-500 mt-auto flex-wrap">
          <span>{game.minPlayers}–{game.maxPlayers} igrača</span>
          <span className="opacity-40">·</span>
          <span>{game.avgDuration}</span>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {game.tags.map(t => (
            <span
              key={t}
              className="text-[10px] px-2 py-0.5 rounded-full text-slate-500"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HubPage() {
  const [active, setActive] = useState(0);
  const router = useRouter();
  const wasDragging = useRef(false);

  const prev = useCallback(() => setActive(i => Math.max(0, i - 1)), []);
  const next = useCallback(() => setActive(i => Math.min(GAMES.length - 1, i + 1)), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft')  { prev(); return; }
      if (e.key === 'ArrowRight') { next(); return; }
      if (e.key === 'Enter') {
        const g = GAMES[active];
        if (g.available) router.push(g.path);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, prev, next, router]);

  function onDragEnd(_: unknown, info: PanInfo) {
    wasDragging.current = Math.abs(info.offset.x) > 8;
    if      (info.offset.x < -55 || info.velocity.x < -280) next();
    else if (info.offset.x >  55 || info.velocity.x >  280) prev();
  }

  const game = GAMES[active];

  return (
    <main
      className="relative flex flex-col items-center justify-center min-h-dvh overflow-hidden"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Dynamic background orbs */}
      <motion.div
        key={game.id + '-orb-a'}
        className="pointer-events-none fixed rounded-full"
        animate={{ opacity: [0.06, 0.15, 0.06] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: 680, height: 680,
          top: '-18%', left: '-18%',
          background: `radial-gradient(circle, ${game.accentColor}44, transparent 70%)`,
          filter: 'blur(80px)',
        }}
      />
      <motion.div
        className="pointer-events-none fixed rounded-full"
        animate={{ opacity: [0.04, 0.09, 0.04] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 3.5 }}
        style={{
          width: 520, height: 520,
          bottom: '-14%', right: '-14%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.28), transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Title */}
      <div className="z-20 mb-10 text-center pt-16">
        <h1
          className="text-4xl sm:text-5xl font-bold tracking-tight"
          style={{ color: 'var(--text-primary)', textShadow: '0 0 40px rgba(139,92,246,0.35)' }}
        >
          GameHub
        </h1>
        <p className="text-slate-500 text-sm mt-2 tracking-wide">Tvoj hub za društvene igre</p>
      </div>

      {/* 3D Coverflow */}
      <div
        className="relative z-10 flex items-center justify-center w-full"
        style={{ perspective: '1100px', height: 380 }}
      >
        {GAMES.map((g, i) => {
          const offset = i - active;
          if (Math.abs(offset) > 2) return null;
          const st = getCardStyle(offset);
          const isActive = offset === 0;

          return (
            <motion.div
              key={g.id}
              drag={isActive ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.08}
              onDragEnd={onDragEnd}
              onClick={() => {
                if (wasDragging.current) { wasDragging.current = false; return; }
                if (!isActive) { setActive(i); return; }
                if (g.available) router.push(g.path);
              }}
              animate={{
                x:       st.x,
                rotateY: st.rotateY,
                scale:   st.scale,
                z:       st.z,
                opacity: st.opacity,
                filter:  `blur(${st.blur}px)`,
              }}
              transition={SPRING}
              style={{
                position: 'absolute',
                width: 290,
                height: 360,
                cursor: !isActive ? 'pointer' : g.available ? 'pointer' : 'default',
                transformOrigin: 'center center',
                userSelect: 'none',
                boxShadow: isActive
                  ? `0 0 40px ${g.accentColor}55, 0 24px 60px rgba(0,0,0,0.55)`
                  : '0 8px 32px rgba(0,0,0,0.4)',
                zIndex: isActive ? 10 : 5 - Math.abs(offset),
              }}
              className="rounded-2xl"
            >
              <CarouselCard game={g} active={isActive} />
            </motion.div>
          );
        })}
      </div>

      {/* CTA + dots */}
      <motion.div
        key={active}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="relative z-20 mt-12 flex flex-col items-center gap-4"
      >
        {game.available ? (
          <button
            onClick={() => router.push(game.path)}
            className="px-10 py-3.5 rounded-2xl text-sm font-bold text-white transition-transform duration-150 hover:scale-105 active:scale-95 cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${game.accentColor} 0%, ${game.accentColor}bb 100%)`,
              boxShadow: `0 0 24px ${game.accentColor}55, 0 8px 24px rgba(0,0,0,0.45)`,
            }}
          >
            Igraj {game.name}
          </button>
        ) : (
          <div
            className="px-10 py-3.5 rounded-2xl text-sm font-medium text-slate-500"
            style={{ border: '1px solid rgba(255,255,255,0.07)' }}
          >
            Uskoro dostupno
          </div>
        )}

        <div className="flex gap-2 items-center">
          {GAMES.map((g, i) => (
            <button
              key={g.id}
              onClick={() => setActive(i)}
              className="rounded-full transition-all duration-200 cursor-pointer"
              aria-label={`Prebaci na ${g.name}`}
              style={{
                height: 6,
                width: i === active ? 22 : 6,
                background: i === active ? game.accentColor : 'rgba(255,255,255,0.18)',
                boxShadow: i === active ? `0 0 8px ${game.accentColor}80` : 'none',
              }}
            />
          ))}
        </div>
      </motion.div>
    </main>
  );
}
