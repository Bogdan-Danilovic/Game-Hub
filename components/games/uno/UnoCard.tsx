'use client';

import { motion } from 'framer-motion';
import { UnoCard as UnoCardType, UnoColor } from '@/lib/types/uno';

export const COLOR_HEX: Record<UnoColor, string> = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
};

const COLOR_DARK: Record<UnoColor, string> = {
  red: '#991b1b',
  blue: '#1d4ed8',
  green: '#15803d',
  yellow: '#a16207',
};

function cardSymbol(card: UnoCardType): string {
  if (card.kind === 'number') return String(card.value);
  if (card.kind === 'wild') return card.value === 'wild4' ? '+4' : '🌈';
  const map: Record<string, string> = { skip: '⊘', reverse: '⇄', draw2: '+2' };
  return map[card.value] ?? '?';
}

interface Props {
  card: UnoCardType;
  playable?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  faceDown?: boolean;
}

const SIZE = {
  sm: { w: 44, h: 64, text: 16, corner: 10 },
  md: { w: 56, h: 82, text: 22, corner: 13 },
  lg: { w: 72, h: 104, text: 30, corner: 16 },
};

export function UnoCardComponent({ card, playable, onClick, size = 'md', selected, faceDown }: Props) {
  const s = SIZE[size];

  if (faceDown) {
    return (
      <div
        className="shrink-0 rounded-xl"
        style={{
          width: s.w,
          height: s.h,
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
          border: '2px solid rgba(255,255,255,0.15)',
        }}
      />
    );
  }

  const isWild = card.kind === 'wild';
  const color = isWild ? null : card.color;
  const bg = isWild
    ? 'linear-gradient(135deg, #ef4444 0%, #3b82f6 33%, #22c55e 66%, #eab308 100%)'
    : COLOR_HEX[color!];
  const borderColor = isWild ? 'rgba(255,255,255,0.3)' : COLOR_DARK[color!];
  const symbol = cardSymbol(card);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={!playable && !onClick}
      whileHover={playable ? { y: -6, scale: 1.05 } : undefined}
      whileTap={playable ? { scale: 0.96 } : undefined}
      className="shrink-0 relative select-none"
      style={{
        width: s.w,
        height: s.h,
        borderRadius: 10,
        background: bg,
        border: selected
          ? '3px solid #fff'
          : `2px solid ${borderColor}`,
        boxShadow: selected
          ? '0 0 0 2px rgba(255,255,255,0.4), 0 8px 24px rgba(0,0,0,0.5)'
          : playable
          ? `0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px ${borderColor}`
          : '0 2px 8px rgba(0,0,0,0.3)',
        opacity: onClick && !playable ? 0.45 : 1,
        cursor: playable ? 'pointer' : 'default',
      }}
    >
      {/* Corner top-left */}
      <span
        className="absolute top-1 left-1.5 font-black leading-none text-white"
        style={{ fontSize: s.corner }}
      >
        {symbol}
      </span>

      {/* Center symbol */}
      <span
        className="absolute inset-0 flex items-center justify-center font-black text-white leading-none"
        style={{
          fontSize: s.text,
          textShadow: '0 1px 4px rgba(0,0,0,0.4)',
        }}
      >
        {symbol}
      </span>

      {/* Corner bottom-right (flipped) */}
      <span
        className="absolute bottom-1 right-1.5 font-black leading-none text-white rotate-180"
        style={{ fontSize: s.corner }}
      >
        {symbol}
      </span>

      {/* White oval overlay for non-wild */}
      {!isWild && (
        <div
          className="absolute inset-0 rounded-lg"
          style={{
            background: 'rgba(255,255,255,0.12)',
            transform: 'skewX(-8deg) scaleY(0.7)',
          }}
        />
      )}
    </motion.button>
  );
}

interface ColorPickerProps {
  onChoose: (color: UnoColor) => void;
  disabled?: boolean;
}

export function ColorPicker({ onChoose, disabled }: ColorPickerProps) {
  const colors: UnoColor[] = ['red', 'blue', 'green', 'yellow'];
  const labels: Record<UnoColor, string> = {
    red: 'Crvena',
    blue: 'Plava',
    green: 'Zelena',
    yellow: 'Žuta',
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm font-semibold text-white/80">Izaberi boju:</p>
      <div className="grid grid-cols-2 gap-3">
        {colors.map((c) => (
          <motion.button
            key={c}
            type="button"
            disabled={disabled}
            onClick={() => onChoose(c)}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            className="flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-bold text-white text-sm"
            style={{
              background: `linear-gradient(135deg, ${COLOR_HEX[c]}, ${COLOR_DARK[c]})`,
              boxShadow: `0 4px 12px ${COLOR_HEX[c]}60`,
              minWidth: 110,
            }}
          >
            {labels[c]}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
