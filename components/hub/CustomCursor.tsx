'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';

export default function CustomCursor() {
  const reduce = useReducedMotion();
  const [onCard, setOnCard] = useState(false);
  const [accent, setAccent] = useState('#8b5cf6');

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 40, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 500, damping: 40, mass: 0.4 });

  useEffect(() => {
    if (reduce) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    document.documentElement.classList.add('cursor-hidden');

    const move = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    const over = (e: Event) => {
      const t = (e.target as HTMLElement | null)?.closest('[data-game-card]');
      if (t) {
        setOnCard(true);
        const a = t.getAttribute('data-accent');
        if (a) setAccent(a);
      }
    };
    const out = (e: Event) => {
      if ((e.target as HTMLElement | null)?.closest('[data-game-card]')) setOnCard(false);
    };

    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerover', over, true);
    document.addEventListener('pointerout', out, true);
    return () => {
      document.documentElement.classList.remove('cursor-hidden');
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerover', over, true);
      document.removeEventListener('pointerout', out, true);
    };
  }, [reduce, x, y]);

  return (
    <motion.div
      aria-hidden
      className="fixed top-0 left-0 z-[60] pointer-events-none"
      style={{ x: sx, y: sy }}
    >
      <motion.div
        className="rounded-full -translate-x-1/2 -translate-y-1/2"
        style={{ mixBlendMode: 'difference' }}
        initial={false}
        animate={{
          width: onCard ? 32 : 8,
          height: onCard ? 32 : 8,
          backgroundColor: onCard ? '#ffffff' : accent,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      />
    </motion.div>
  );
}
