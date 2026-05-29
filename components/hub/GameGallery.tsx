'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Users, Clock, ArrowRight } from 'lucide-react';
import { GAMES, GameDefinition } from '@/lib/games/registry';

const ENTRANCE = { type: 'spring' as const, stiffness: 200, damping: 20 };
const FAN_SPRING = { type: 'spring' as const, stiffness: 300, damping: 25 };
const ICON_SPRING = { type: 'spring' as const, stiffness: 300, damping: 20 };
const CTA_SPRING = { type: 'spring' as const, stiffness: 300, damping: 25 };

function hexA(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function CardParticles({ accent }: { accent: string }) {
  const parts = Array.from({ length: 7 }, (_, i) => ({
    left: (i * 37 + 13) % 100,
    top: (i * 53 + 9) % 100,
    dur: 3 + (i % 3),
    delay: (i * 0.6) % 3,
  }));
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
      {parts.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{ left: `${p.left}%`, top: `${p.top}%`, width: 2, height: 2, background: accent }}
          animate={{ opacity: [0, 0.6, 0], y: [0, -14, 0] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

function GameCard({
  game,
  hovered,
  variant,
}: {
  game: GameDefinition;
  hovered: boolean;
  variant: 'desktop' | 'mobile';
}) {
  const reduce = useReducedMotion();
  const accent = game.accentColor;
  const unavailable = !game.available;
  const iconActive = hovered;
  const borderActive = hovered || variant === 'mobile';
  const overlayShown = hovered && variant === 'desktop';

  return (
    <div
      data-game-card
      data-accent={accent}
      className="relative w-full h-full rounded-2xl overflow-hidden select-none"
      style={{
        background: `radial-gradient(120% 120% at 50% 28%, ${hexA(accent, 0.2)} 0%, #080b14 70%)`,
        willChange: 'transform',
      }}
    >
      {/* Animated mesh gradient */}
      <motion.div
        aria-hidden
        className="absolute inset-[-45%] pointer-events-none"
        style={{
          background: `radial-gradient(42% 42% at 50% 50%, ${hexA(accent, 0.28)} 0%, transparent 70%)`,
          filter: 'blur(34px)',
        }}
        animate={reduce ? undefined : { x: ['-12%', '14%', '-12%'], y: ['9%', '-11%', '9%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Noise texture */}
      <div aria-hidden className="absolute inset-0 noise-overlay pointer-events-none" />

      {/* Animated border + glow */}
      <motion.div
        aria-hidden
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{ border: '1px solid', borderColor: hexA(accent, 0.15) }}
        initial={false}
        animate={{
          borderColor: borderActive ? hexA(accent, 0.6) : hexA(accent, 0.15),
          boxShadow: borderActive ? `0 0 20px ${hexA(accent, 0.3)}` : `0 0 0px ${hexA(accent, 0)}`,
        }}
        transition={FAN_SPRING}
      />

      {!reduce && <CardParticles accent={accent} />}

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-6 gap-2.5">
        {unavailable && (
          <span
            className="absolute top-0 right-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ background: hexA(accent, 0.16), color: hexA(accent, 0.92) }}
          >
            Uskoro
          </span>
        )}

        <div className="relative flex items-center justify-center pt-5 pb-1">
          <motion.span
            aria-hidden
            className="absolute rounded-full"
            style={{
              width: 92,
              height: 92,
              background: `radial-gradient(circle, ${hexA(accent, 0.5)} 0%, transparent 70%)`,
              filter: 'blur(10px)',
            }}
            initial={false}
            animate={{ opacity: iconActive ? 0.95 : 0.4 }}
            transition={ICON_SPRING}
          />
          <motion.span
            className="leading-none"
            style={{ fontSize: 64, filter: `drop-shadow(0 0 12px ${hexA(accent, 0.6)})` }}
            initial={false}
            animate={{ scale: iconActive ? 1.15 : 1 }}
            transition={ICON_SPRING}
          >
            {game.icon}
          </motion.span>
        </div>

        <h3 style={{ fontWeight: 700, fontSize: 18, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
          {game.name}
        </h3>
        <p className="text-[13px] leading-relaxed line-clamp-2" style={{ color: '#94a3b8' }}>
          {game.shortDescription}
        </p>

        <div className="flex items-center gap-4 text-[13px] mt-auto" style={{ color: '#94a3b8' }}>
          <span className="inline-flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" strokeWidth={2} />
            {game.minPlayers}–{game.maxPlayers}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" strokeWidth={2} />
            {game.avgDuration}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {game.tags.map((t) => (
            <span
              key={t}
              className="text-[11px] px-2 py-0.5 rounded-full"
              style={{ background: hexA(accent, 0.2), color: accent }}
            >
              {t}
            </span>
          ))}
        </div>

        {variant === 'mobile' && (
          <div
            className="inline-flex items-center gap-1.5 self-start mt-1 px-3.5 py-1.5 rounded-full text-xs font-bold"
            style={{ background: hexA(accent, 0.9), color: '#fff' }}
          >
            {unavailable ? 'USKORO' : 'IGRAJ'}
            {!unavailable && <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />}
          </div>
        )}
      </div>

      {/* Desktop hover CTA overlay */}
      <motion.div
        aria-hidden
        className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 py-3.5"
        style={{
          background: hexA(accent, 0.9),
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
        initial={false}
        animate={{ y: overlayShown ? '0%' : '115%' }}
        transition={CTA_SPRING}
      >
        <span className="text-sm font-bold tracking-wide" style={{ color: '#fff' }}>
          {unavailable ? 'USKORO' : 'IGRAJ'}
        </span>
        {!unavailable && <ArrowRight className="w-4 h-4" strokeWidth={2.5} style={{ color: '#fff' }} />}
      </motion.div>
    </div>
  );
}

function MobileCarousel({
  onOpen,
  reduce,
}: {
  onOpen: (g: GameDefinition) => void;
  reduce: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const resumeTimer = useRef<number | null>(null);

  useEffect(() => {
    if (reduce) return;
    const el = ref.current;
    if (!el) return;
    const id = window.setInterval(() => {
      if (paused.current) return;
      const cards = el.querySelectorAll<HTMLElement>('[data-slide]');
      if (!cards.length) return;
      const center = el.scrollLeft + el.clientWidth / 2;
      let cur = 0;
      let best = Infinity;
      cards.forEach((c, i) => {
        const cc = c.offsetLeft + c.clientWidth / 2;
        const d = Math.abs(cc - center);
        if (d < best) {
          best = d;
          cur = i;
        }
      });
      const target = cards[(cur + 1) % cards.length];
      el.scrollTo({
        left: target.offsetLeft - (el.clientWidth - target.clientWidth) / 2,
        behavior: 'smooth',
      });
    }, 3200);
    return () => window.clearInterval(id);
  }, [reduce]);

  const pause = useCallback(() => {
    paused.current = true;
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
  }, []);

  const resume = useCallback(() => {
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => {
      paused.current = false;
    }, 4500);
  }, []);

  return (
    <div
      ref={ref}
      className="flex lg:hidden w-full gap-4 px-[11vw] py-4 overflow-x-auto snap-x snap-mandatory no-scrollbar"
      onPointerDown={pause}
      onPointerUp={resume}
      onMouseEnter={pause}
      onMouseLeave={resume}
    >
      {GAMES.map((g) => (
        <button
          key={g.id}
          data-slide
          type="button"
          onClick={() => onOpen(g)}
          className="snap-center shrink-0 basis-[78vw] max-w-[360px] h-[380px] text-left"
          style={{ cursor: g.available ? 'pointer' : 'default' }}
          aria-label={g.available ? `Igraj ${g.name}` : `${g.name} — uskoro`}
        >
          <GameCard game={g} hovered={false} variant="mobile" />
        </button>
      ))}
    </div>
  );
}

export default function GameGallery() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [hovered, setHovered] = useState<number | null>(null);

  const open = useCallback(
    (g: GameDefinition) => {
      if (g.available) router.push(g.path);
    },
    [router]
  );

  const center = (GAMES.length - 1) / 2;

  return (
    <>
      {/* Desktop: 3D overlapping fan */}
      <div className="hidden lg:flex items-center justify-center w-full" style={{ perspective: '1200px' }}>
        <div className="flex items-center justify-center" style={{ transformStyle: 'preserve-3d' }}>
          {GAMES.map((g, i) => {
            const offset = i - center;
            const absO = Math.abs(offset);
            const baseRotate = offset * 13;
            const baseY = absO * 16;
            const isHovered = hovered === i;
            const dimmed = hovered !== null && !isHovered;

            const target = isHovered
              ? { rotateY: 0, y: baseY - 22, scale: 1.03, opacity: 1, z: 80 }
              : dimmed
                ? { rotateY: baseRotate, y: baseY + 10, scale: 0.97, opacity: 0.6, z: 0 }
                : { rotateY: baseRotate, y: baseY, scale: 1, opacity: 1, z: 0 };

            return (
              <motion.div
                key={g.id}
                initial={reduce ? false : { opacity: 0, y: 40, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ ...ENTRANCE, delay: reduce ? 0 : i * 0.08 }}
                style={{
                  marginLeft: i === 0 ? 0 : -70,
                  zIndex: isHovered ? 100 : Math.round(10 - absO * 2),
                }}
              >
                <motion.div
                  style={{
                    width: 264,
                    height: 360,
                    transformStyle: 'preserve-3d',
                    cursor: g.available ? 'pointer' : 'default',
                    willChange: 'transform',
                  }}
                  animate={target}
                  transition={FAN_SPRING}
                  onHoverStart={() => setHovered(i)}
                  onHoverEnd={() => setHovered((h) => (h === i ? null : h))}
                  onClick={() => open(g)}
                >
                  <GameCard game={g} hovered={isHovered} variant="desktop" />
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Mobile / tablet: auto-scrolling swipe carousel */}
      <MobileCarousel onOpen={open} reduce={!!reduce} />
    </>
  );
}
