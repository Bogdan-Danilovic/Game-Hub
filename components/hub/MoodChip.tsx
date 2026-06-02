'use client';

import { hexA } from '@/lib/utils';

interface MoodChipProps {
  label: string;
  accent: string;
  active: boolean;
  onClick: () => void;
}

/**
 * Pill filter button. Fills with an accent gradient, lifts and scales up when active.
 */
export function MoodChip({ label, accent, active, onClick }: MoodChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-[20px] px-[18px] py-2 text-sm capitalize text-white transition-all duration-[250ms] ${
        active ? 'font-bold' : 'font-medium'
      }`}
      style={{
        background: active ? `linear-gradient(135deg, ${accent}, ${hexA(accent, 0.7)})` : 'rgba(255,255,255,0.08)',
        border: `1px solid ${active ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
        boxShadow: active ? `0 8px 24px ${hexA(accent, 0.27)}` : 'none',
        transform: active ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      {label}
    </button>
  );
}
