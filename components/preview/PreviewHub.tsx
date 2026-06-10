'use client';

/**
 * REDESIGN PREVIEW — potpuno nova kompozicija hub ekrana u postojećem
 * vizuelnom jeziku (dark #080b14, violet #8b5cf6 → cyan gradijenti,
 * glassmorphism, Framer Motion spring 300/20, mobile-first 480px kolona).
 * Namerno self-contained: bez Firebase poziva, čita samo GAMES registry.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  Clock,
  Compass,
  Gamepad2,
  Search,
  Sparkles,
  Trophy,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { GAMES, GameDefinition } from '@/lib/games/registry';

const SPRING = { type: 'spring' as const, stiffness: 300, damping: 20 };
const SPRING_SOFT = { type: 'spring' as const, stiffness: 300, damping: 25 };

function hexA(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ── Pozadina: orbovi + deterministične čestice ───────────────────────── */

function Backdrop() {
  const reduce = useReducedMotion();
  // determinističke pozicije — bez Math.random u renderu
  const dots = Array.from({ length: 18 }, (_, i) => ({
    left: (i * 41 + 7) % 100,
    top: (i * 59 + 23) % 100,
    dur: 14 + (i % 5) * 3,
    delay: (i * 0.9) % 6,
    size: 1 + (i % 3),
  }));

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 mx-auto max-w-[480px] overflow-hidden">
      <motion.div
        className="absolute rounded-full"
        style={{
          top: -220,
          left: -120,
          width: 520,
          height: 520,
          background: 'radial-gradient(circle, rgba(139,92,246,0.16) 0%, transparent 70%)',
        }}
        animate={reduce ? undefined : { y: [0, 30, 0], x: [0, 16, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          top: 340,
          right: -200,
          width: 440,
          height: 440,
          background: 'radial-gradient(circle, rgba(0,200,255,0.1) 0%, transparent 70%)',
        }}
        animate={reduce ? undefined : { y: [0, -26, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      {dots.map((d, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: d.size,
            height: d.size,
            background: i % 3 === 0 ? '#00c8ff' : '#8b5cf6',
          }}
          animate={reduce ? undefined : { opacity: [0, 0.5, 0], y: [0, -18, 0] }}
          transition={{ duration: d.dur, delay: d.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

/* ── Header ───────────────────────────────────────────────────────────── */

function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING_SOFT}
      className="flex items-center justify-between"
    >
      <div>
        <p className="text-[12px] font-medium tracking-[0.18em] uppercase text-white/35">Game Hub</p>
        <h1 className="mt-0.5 text-[26px] font-bold tracking-[-0.03em] text-white">
          Dobro veče{' '}
          <motion.span
            className="inline-block"
            animate={{ rotate: [0, 18, -8, 0] }}
            transition={{ duration: 1.6, delay: 0.8, repeat: Infinity, repeatDelay: 6 }}
          >
            👋
          </motion.span>
        </h1>
      </div>
      <div
        className="relative flex h-11 w-11 items-center justify-center rounded-full"
        style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.35), rgba(0,200,255,0.2))',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 8px 24px rgba(139,92,246,0.25)',
        }}
      >
        <User size={20} className="text-white/80" />
        <span
          className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2"
          style={{ background: '#10b981', borderColor: '#080b14' }}
        />
      </div>
    </motion.header>
  );
}

/* ── Hero: auto-rotirajuća istaknuta igra ─────────────────────────────── */

function Hero({ games, onPlay }: { games: GameDefinition[]; onPlay: (g: GameDefinition) => void }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const game = games[index];
  const accent = game.accentColor;

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % games.length), 5000);
    return () => clearInterval(id);
  }, [games.length]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING_SOFT, delay: 0.08 }}
    >
      <div className="mb-3 flex items-center gap-2">
        <Sparkles size={14} style={{ color: '#8b5cf6' }} />
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-white/40">Večeras igramo</p>
      </div>

      <div
        className="relative overflow-hidden rounded-3xl border border-white/10"
        style={{ background: '#0a0e1a' }}
      >
        <AnimatePresence mode="wait">
          <motion.button
            key={game.id}
            type="button"
            onClick={() => onPlay(game)}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={SPRING_SOFT}
            className="relative block w-full cursor-pointer text-left"
            aria-label={`Igraj ${game.name}`}
          >
            {/* accent radial pozadina */}
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background: `radial-gradient(130% 110% at 80% 0%, ${hexA(accent, 0.32)} 0%, transparent 60%)`,
              }}
            />
            {/* animirani mesh blob */}
            <motion.div
              aria-hidden
              className="absolute inset-[-40%]"
              style={{
                background: `radial-gradient(38% 38% at 50% 50%, ${hexA(accent, 0.3)} 0%, transparent 70%)`,
                filter: 'blur(40px)',
              }}
              animate={reduce ? undefined : { x: ['-10%', '12%', '-10%'], y: ['8%', '-10%', '8%'] }}
              transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            />

            <div className="relative px-6 pb-6 pt-7">
              <motion.div
                className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl text-[34px]"
                style={{
                  background: hexA(accent, 0.16),
                  border: `1px solid ${hexA(accent, 0.3)}`,
                  boxShadow: `0 12px 32px ${hexA(accent, 0.3)}`,
                }}
                animate={reduce ? undefined : { y: [0, -5, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                {game.icon}
              </motion.div>

              <h2 className="text-[28px] font-bold tracking-[-0.03em] text-white">{game.name}</h2>
              <p className="mt-1 max-w-[290px] text-[13px] leading-relaxed text-white/55">{game.description}</p>

              <div className="mt-4 flex items-center gap-4 text-[11px] font-medium text-white/45">
                <span className="inline-flex items-center gap-1.5">
                  <Users size={13} /> {game.minPlayers}–{game.maxPlayers}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={13} /> {game.avgDuration}
                </span>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <span
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-bold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${accent}, ${hexA(accent, 0.7)})`,
                    boxShadow: `0 8px 24px ${hexA(accent, 0.35)}`,
                  }}
                >
                  Igraj odmah <ArrowRight size={15} />
                </span>
                <div className="flex gap-1.5 pr-1">
                  {game.tags.slice(0, 2).map((t) => (
                    <span
                      key={t}
                      className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/50"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.button>
        </AnimatePresence>

        {/* indikator tačkice */}
        <div className="absolute right-5 top-5 flex gap-1.5">
          {games.map((g, i) => (
            <button
              key={g.id}
              type="button"
              aria-label={`Prikaži ${g.name}`}
              onClick={() => setIndex(i)}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === index ? 18 : 6,
                background: i === index ? game.accentColor : 'rgba(255,255,255,0.2)',
              }}
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
}

/* ── Brzo pridruživanje kodom ─────────────────────────────────────────── */

function QuickJoin() {
  const [code, setCode] = useState('');
  const valid = code.trim().length >= 4;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING_SOFT, delay: 0.16 }}
      className="flex items-center gap-2 rounded-2xl border border-white/10 p-2 pl-4"
      style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
    >
      <Search size={16} className="shrink-0 text-white/30" />
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="Imaš kod sobe? Upiši ga…"
        maxLength={8}
        className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold tracking-[0.2em] text-white placeholder:font-medium placeholder:tracking-normal placeholder:text-white/30 focus:outline-none"
        aria-label="Kod sobe"
      />
      <motion.button
        type="button"
        whileTap={{ scale: 0.92 }}
        disabled={!valid}
        aria-label="Pridruži se sobi"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-opacity"
        style={{
          background: valid
            ? 'linear-gradient(135deg, #8b5cf6, #00c8ff)'
            : 'rgba(255,255,255,0.06)',
          opacity: valid ? 1 : 0.5,
          boxShadow: valid ? '0 6px 20px rgba(139,92,246,0.4)' : 'none',
        }}
      >
        <ArrowRight size={17} className="text-white" />
      </motion.button>
    </motion.div>
  );
}

/* ── Filter čipovi ────────────────────────────────────────────────────── */

const FILTERS: { id: string; label: string; match: (g: GameDefinition) => boolean }[] = [
  { id: 'sve', label: 'Sve', match: () => true },
  { id: 'dedukcija', label: '🕵️ Dedukcija', match: (g) => g.tags.includes('dedukcija') || g.tags.includes('uloge') },
  { id: 'karte', label: '🃏 Karte', match: (g) => g.tags.includes('karte') },
  { id: 'crtanje', label: '✏️ Crtanje', match: (g) => g.tags.includes('crtanje') },
  { id: 'blef', label: '😏 Blef', match: (g) => g.tags.includes('blef') },
];

function FilterChips({ active, onChange }: { active: string; onChange: (id: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING_SOFT, delay: 0.22 }}
      className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {FILTERS.map(({ id, label }) => {
        const on = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`shrink-0 rounded-full px-4 py-2 text-[12px] transition-all duration-200 ${
              on ? 'font-bold text-white' : 'font-medium text-white/50'
            }`}
            style={{
              background: on
                ? 'linear-gradient(135deg, #8b5cf6, rgba(139,92,246,0.7))'
                : 'rgba(255,255,255,0.06)',
              border: `1px solid ${on ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
              boxShadow: on ? '0 8px 24px rgba(139,92,246,0.27)' : 'none',
            }}
          >
            {label}
          </button>
        );
      })}
    </motion.div>
  );
}

/* ── Kartica igre u gridu ─────────────────────────────────────────────── */

function GridCard({ game, onPlay, i }: { game: GameDefinition; onPlay: (g: GameDefinition) => void; i: number }) {
  const accent = game.accentColor;
  const unavailable = !game.available;

  return (
    <motion.button
      layout
      type="button"
      onClick={() => !unavailable && onPlay(game)}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ ...SPRING_SOFT, delay: 0.05 * i }}
      whileTap={unavailable ? undefined : { scale: 0.97 }}
      className="relative overflow-hidden rounded-2xl border border-white/10 p-4 text-left"
      style={{
        background: `radial-gradient(120% 100% at 50% 0%, ${hexA(accent, unavailable ? 0.08 : 0.16)} 0%, rgba(15,19,32,0.85) 70%)`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        cursor: unavailable ? 'default' : 'pointer',
      }}
      aria-label={unavailable ? `${game.name} — uskoro` : `Igraj ${game.name}`}
    >
      {unavailable && (
        <span
          className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
          style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' }}
        >
          Uskoro
        </span>
      )}
      <div
        className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl text-[22px]"
        style={{
          background: hexA(accent, 0.14),
          border: `1px solid ${hexA(accent, 0.25)}`,
          filter: unavailable ? 'grayscale(0.7)' : 'none',
        }}
      >
        {game.icon}
      </div>
      <h3 className={`text-[15px] font-bold tracking-[-0.02em] ${unavailable ? 'text-white/40' : 'text-white'}`}>
        {game.name}
      </h3>
      <p className="mt-0.5 line-clamp-1 text-[11px] text-white/40">{game.shortDescription}</p>
      <div className="mt-3 flex items-center gap-3 text-[10px] font-medium text-white/35">
        <span className="inline-flex items-center gap-1">
          <Users size={11} /> {game.minPlayers}–{game.maxPlayers}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock size={11} /> {game.avgDuration}
        </span>
      </div>
    </motion.button>
  );
}

/* ── Donji glass dock ─────────────────────────────────────────────────── */

const DOCK: { id: string; label: string; Icon: LucideIcon }[] = [
  { id: 'home', label: 'Otkrij', Icon: Compass },
  { id: 'play', label: 'Igraj', Icon: Gamepad2 },
  { id: 'rank', label: 'Rang', Icon: Trophy },
  { id: 'profile', label: 'Profil', Icon: User },
];

function Dock() {
  const [active, setActive] = useState('home');

  return (
    <motion.nav
      initial={{ y: 80 }}
      animate={{ y: 0 }}
      transition={{ ...SPRING_SOFT, delay: 0.3 }}
      aria-label="Hub navigacija"
      className="fixed bottom-4 left-1/2 z-20 flex w-[calc(100%-40px)] max-w-[440px] -translate-x-1/2 items-center justify-around rounded-[26px] border border-white/10 px-2 py-2.5"
      style={{
        background: 'rgba(8,11,20,0.85)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.55)',
      }}
    >
      {DOCK.map(({ id, label, Icon }) => {
        const on = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setActive(id)}
            aria-current={on ? 'page' : undefined}
            className="relative flex flex-col items-center gap-0.5 rounded-2xl px-4 py-1.5"
          >
            {on && (
              <motion.span
                layoutId="dock-pill"
                className="absolute inset-0 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(0,200,255,0.12))',
                  border: '1px solid rgba(139,92,246,0.3)',
                }}
                transition={SPRING}
              />
            )}
            <Icon
              size={21}
              strokeWidth={2}
              className="relative transition-transform duration-200"
              style={{ color: on ? '#fff' : 'rgba(255,255,255,0.35)', transform: on ? 'scale(1.08)' : 'scale(1)' }}
            />
            <span
              className="relative text-[10px] font-semibold transition-colors duration-200"
              style={{ color: on ? '#fff' : 'rgba(255,255,255,0.35)' }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </motion.nav>
  );
}

/* ── Glavna kompozicija ───────────────────────────────────────────────── */

export function PreviewHub() {
  const router = useRouter();
  const [filter, setFilter] = useState('sve');

  const available = GAMES.filter((g) => g.available);
  const featured = available.slice(0, 4);
  const match = FILTERS.find((f) => f.id === filter) ?? FILTERS[0];
  const visible = GAMES.filter(match.match);

  const onPlay = (g: GameDefinition) => router.push(g.path);

  return (
    <main className="relative min-h-dvh" style={{ background: '#080b14' }}>
      <Backdrop />

      {/* Preview traka */}
      <div
        className="fixed left-1/2 top-3 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 px-3.5 py-1.5"
        style={{ background: 'rgba(8,11,20,0.9)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: '#8b5cf6', boxShadow: '0 0 8px rgba(139,92,246,0.9)' }}
        />
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">Redesign Preview</span>
        <Link href="/" className="text-[10px] font-semibold text-white/35 underline-offset-2 hover:text-white/70 hover:underline">
          nazad na hub
        </Link>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[480px] flex-col gap-7 px-5 pb-36 pt-20">
        <Header />
        <Hero games={featured} onPlay={onPlay} />
        <QuickJoin />

        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-[17px] font-bold tracking-[-0.02em] text-white">Sve igre</h2>
            <span className="text-[11px] font-medium text-white/35">{visible.length} dostupno</span>
          </div>
          <FilterChips active={filter} onChange={setFilter} />
          <motion.div layout className="mt-4 grid grid-cols-2 gap-3">
            <AnimatePresence mode="popLayout">
              {visible.map((g, i) => (
                <GridCard key={g.id} game={g} onPlay={onPlay} i={i} />
              ))}
            </AnimatePresence>
          </motion.div>
        </section>
      </div>

      <Dock />
    </main>
  );
}
