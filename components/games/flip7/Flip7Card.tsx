'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { Flip7Card as Flip7CardData, Flip7NumberValue } from '@/lib/types/flip7';

export const FLIP7_NUMBER_COLORS: Record<Flip7NumberValue, string> = {
  0: '#6b7280',
  1: '#3b82f6',
  2: '#10b981',
  3: '#f59e0b',
  4: '#ef4444',
  5: '#8b5cf6',
  6: '#ec4899',
  7: '#14b8a6',
  8: '#f97316',
  9: '#06b6d4',
  10: '#84cc16',
  11: '#a855f7',
  12: '#e11d48',
};

export const FLIP7_NUMBER_NAMES: Record<Flip7NumberValue, string> = {
  0: 'NULA',
  1: 'JEDAN',
  2: 'DVA',
  3: 'TRI',
  4: 'ČETIRI',
  5: 'PET',
  6: 'ŠEST',
  7: 'SEDAM',
  8: 'OSAM',
  9: 'DEVET',
  10: 'DESET',
  11: 'JEDANAEST',
  12: 'DVANAEST',
};

type ActionValue = 'stop' | 'druga_sansa' | 'okreni_tri';

const ACTION_META: Record<ActionValue, { bg: string; ink: string; border: string; label: string }> = {
  stop: { bg: '#1d7fd4', ink: '#ffffff', border: '#bfe0ff', label: 'STOP' },
  druga_sansa: { bg: '#e63946', ink: '#ffffff', border: '#ffd0d4', label: 'DRUGA ŠANSA' },
  okreni_tri: { bg: '#f4c430', ink: '#1e3a5f', border: '#1e3a5f', label: 'OKRENI TRI' },
};

const BORDER = '#1e3a5f';
const CREAM = '#f5f0e8';
const FONT = 'Space Grotesk, system-ui, sans-serif';

type Props = {
  card?: Flip7CardData;
  faceDown?: boolean;
  busted?: boolean;
  index?: number;
  size?: number;
  className?: string;
};

function Ornament({ stroke }: { stroke: string }) {
  return (
    <g fill="none" stroke={stroke}>
      <rect x={2.5} y={2.5} width={95} height={135} rx={9} strokeWidth={2.5} />
      <rect x={6.5} y={6.5} width={87} height={127} rx={6} strokeWidth={1} opacity={0.45} />
      {[
        [11, 11],
        [89, 11],
        [11, 129],
        [89, 129],
      ].map(([cx, cy]) => (
        <rect
          key={`${cx}-${cy}`}
          x={cx - 2.5}
          y={cy - 2.5}
          width={5}
          height={5}
          rx={1}
          fill={stroke}
          stroke="none"
          transform={`rotate(45 ${cx} ${cy})`}
        />
      ))}
    </g>
  );
}

function NumberFace({ value }: { value: Flip7NumberValue }) {
  const color = FLIP7_NUMBER_COLORS[value];
  return (
    <g fontFamily={FONT}>
      <rect x={0} y={0} width={100} height={140} rx={11} fill={CREAM} />
      <Ornament stroke={BORDER} />
      <text x={50} y={22} textAnchor="middle" fontSize={6.5} fontWeight={700} letterSpacing={1.2} fill={BORDER}>
        ISKUŠAJ SVOJU SREĆU
      </text>
      <text x={14} y={20} textAnchor="middle" fontSize={11} fontWeight={700} fill={color}>
        {value}
      </text>
      <text x={86} y={128} textAnchor="middle" fontSize={11} fontWeight={700} fill={color} transform="rotate(180 86 124)">
        {value}
      </text>
      <text x={50} y={88} textAnchor="middle" fontSize={58} fontWeight={700} fill={color}>
        {value}
      </text>
      <text x={50} y={116} textAnchor="middle" fontSize={10} fontWeight={700} letterSpacing={1} fill={BORDER}>
        {FLIP7_NUMBER_NAMES[value]}
      </text>
    </g>
  );
}

function ModifierFace({ value }: { value: string }) {
  return (
    <g fontFamily={FONT}>
      <rect x={0} y={0} width={100} height={140} rx={11} fill="#f59e0b" />
      <rect x={0} y={0} width={100} height={140} rx={11} fill="url(#f7modGloss)" />
      <Ornament stroke="#7c2d12" />
      <text x={50} y={26} textAnchor="middle" fontSize={8} fontWeight={800} letterSpacing={2} fill="#7c2d12">
        BONUS
      </text>
      <text x={50} y={90} textAnchor="middle" fontSize={46} fontWeight={800} fill="#3b1d00">
        {value}
      </text>
    </g>
  );
}

function ActionIcon({ value, color }: { value: ActionValue; color: string }) {
  if (value === 'stop') {
    return (
      <g stroke={color} strokeWidth={3.4} fill="none" strokeLinecap="round">
        <path d="M41 58 v-7 a9 9 0 0 1 18 0 v7" />
        <rect x={37} y={58} width={26} height={22} rx={4} fill={color} stroke="none" />
        <circle cx={50} cy={67} r={3} fill="#1d7fd4" />
        <rect x={48.5} y={67} width={3} height={7} rx={1.5} fill="#1d7fd4" stroke="none" />
      </g>
    );
  }
  if (value === 'druga_sansa') {
    return (
      <path
        d="M50 80 C 30 66, 30 46, 43 46 C 48 46, 50 51, 50 53 C 50 51, 52 46, 57 46 C 70 46, 70 66, 50 80 Z"
        fill={color}
      />
    );
  }
  return (
    <g>
      <rect x={37} y={50} width={22} height={28} rx={3.5} fill={color} transform="rotate(-13 48 64)" />
      <rect x={44} y={52} width={22} height={28} rx={3.5} fill={color} opacity={0.55} transform="rotate(11 55 66)" />
      <path d="M62 47 l5 4 -5 4" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
}

function ActionFace({ value }: { value: ActionValue }) {
  const meta = ACTION_META[value];
  return (
    <g fontFamily={FONT}>
      <rect x={0} y={0} width={100} height={140} rx={11} fill={meta.bg} />
      <Ornament stroke={meta.border} />
      <ActionIcon value={value} color={meta.ink} />
      <text x={50} y={108} textAnchor="middle" fontSize={meta.label.length > 6 ? 11 : 14} fontWeight={800} letterSpacing={1} fill={meta.ink}>
        {meta.label}
      </text>
    </g>
  );
}

function CardBack() {
  return (
    <g fontFamily={FONT}>
      <rect x={0} y={0} width={100} height={140} rx={11} fill="#0b1f3a" />
      <Ornament stroke="#f59e0b" />
      <text x={50} y={64} textAnchor="middle" fontSize={26} fontWeight={800} letterSpacing={2} fill="#f59e0b">
        FLIP
      </text>
      <text x={50} y={96} textAnchor="middle" fontSize={34} fontWeight={800} fill="#f5f0e8">
        7
      </text>
    </g>
  );
}

function Face({ card }: { card?: Flip7CardData }) {
  if (!card) return <CardBack />;
  if (card.type.kind === 'number') return <NumberFace value={card.type.value} />;
  if (card.type.kind === 'modifier') return <ModifierFace value={card.type.value} />;
  return <ActionFace value={card.type.value} />;
}

export function Flip7Card({ card, faceDown = false, busted = false, index = 0, size = 66, className }: Props) {
  const reduce = useReducedMotion();
  const height = size * 1.4;

  const shake = busted && !reduce ? { x: [0, -5, 5, -4, 4, -2, 2, 0] } : { x: 0 };

  return (
    <motion.div
      className={className}
      style={{ width: size, height, willChange: 'transform', flex: '0 0 auto' }}
      initial={reduce ? false : { opacity: 0, y: -26, scale: 0.82, rotate: -6 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotate: 0, ...shake }}
      transition={
        reduce
          ? { duration: 0 }
          : { type: 'spring', stiffness: 320, damping: 22, delay: index * 0.05, x: { duration: 0.4, ease: 'easeInOut' } }
      }
    >
      <motion.div
        style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d', willChange: 'transform' }}
        animate={{ rotateY: faceDown ? 180 : 0 }}
        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 24 }}
      >
        <svg
          viewBox="0 0 100 140"
          width="100%"
          height="100%"
          style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', display: 'block' }}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="f7modGloss" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity={0.35} />
              <stop offset="45%" stopColor="#ffffff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Face card={card} />
        </svg>
        <svg
          viewBox="0 0 100 140"
          width="100%"
          height="100%"
          style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', display: 'block' }}
          aria-hidden="true"
        >
          <CardBack />
        </svg>
      </motion.div>
    </motion.div>
  );
}
