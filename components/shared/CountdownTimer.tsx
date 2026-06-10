'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  seconds: number;
  onEnd: () => void;
  accentColor?: string;
}

export function CountdownTimer({ seconds, onEnd, accentColor = '#a78bfa' }: Props) {
  const [remaining, setRemaining] = useState(seconds);
  const [prevSeconds, setPrevSeconds] = useState(seconds);

  // Restart countdown when the target changes (adjust-during-render)
  if (prevSeconds !== seconds) {
    setPrevSeconds(seconds);
    setRemaining(seconds);
  }

  useEffect(() => {
    if (remaining <= 0) {
      onEnd();
      return;
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onEnd]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(8,11,20,0.95)' }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={remaining}
          initial={{ scale: 4, opacity: 0, filter: 'blur(10px)' }}
          animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
          exit={{ scale: 0.3, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="text-[140px] font-bold leading-none tabular-nums"
          style={{ color: accentColor }}
        >
          {remaining}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
}
