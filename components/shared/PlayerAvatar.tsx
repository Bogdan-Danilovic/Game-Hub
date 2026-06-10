'use client';

import { motion } from 'framer-motion';

type Size = 'sm' | 'md' | 'lg';

interface Props {
  name: string;
  avatar?: string;
  color: string;
  size?: Size;
}

const SIZE: Record<Size, { container: string; text: string }> = {
  sm: { container: 'w-8 h-8 rounded-lg', text: 'text-[11px]' },
  md: { container: 'w-10 h-10 rounded-xl', text: 'text-[12px]' },
  lg: { container: 'w-14 h-14 rounded-2xl', text: 'text-[14px]' },
};

export function PlayerAvatar({ name, avatar, color, size = 'md' }: Props) {
  const initials = name.slice(0, 2).toUpperCase();
  const s = SIZE[size];

  return (
    <motion.div
      className={`${s.container} relative flex items-center justify-center font-bold flex-shrink-0`}
      style={{ background: color }}
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element -- avatar URL dolazi sa proizvoljnog auth providera; next/image bi pukao za domen van remotePatterns liste
        <img
          src={avatar}
          alt={name}
          className="w-full h-full object-cover rounded-[inherit]"
        />
      ) : (
        <span className={`${s.text} text-white font-bold select-none`}>{initials}</span>
      )}
    </motion.div>
  );
}
