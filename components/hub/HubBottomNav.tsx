'use client';

import { useState } from 'react';
import { Compass, Gamepad2, User, type LucideIcon } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  Icon: LucideIcon;
}

const ITEMS: NavItem[] = [
  { id: 'home', label: 'Otkrij', Icon: Compass },
  { id: 'play', label: 'Igraj', Icon: Gamepad2 },
  { id: 'profile', label: 'Profil', Icon: User },
];

export function HubBottomNav() {
  const [active, setActive] = useState('home');
  const activeIndex = ITEMS.findIndex((i) => i.id === active);

  return (
    <nav
      aria-label="Hub navigacija"
      className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-[480px] -translate-x-1/2 justify-around rounded-t-[20px] border-t border-white/10 pb-7 pt-3"
      style={{
        background: 'rgba(8,11,20,0.94)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
      }}
    >
      {/* Sliding indicator line */}
      <div
        className="absolute top-0 h-[2px] rounded-full transition-all duration-300"
        style={{
          width: 36,
          background: 'linear-gradient(90deg, #8b5cf6, #00c8ff)',
          boxShadow: '0 0 8px rgba(139,92,246,0.8)',
          left: `calc(${activeIndex} * ${100 / ITEMS.length}% + ${100 / ITEMS.length / 2}% - 18px)`,
        }}
      />

      {ITEMS.map(({ id, label, Icon }) => {
        const on = active === id;
        const color = on ? '#fff' : 'rgba(255,255,255,0.3)';
        return (
          <button
            key={id}
            type="button"
            onClick={() => setActive(id)}
            className="flex flex-col items-center gap-1 px-5"
            aria-current={on ? 'page' : undefined}
          >
            <Icon
              size={24}
              strokeWidth={2}
              className="transition-transform duration-200"
              style={{ color, transform: on ? 'scale(1.12)' : 'scale(1)' }}
            />
            <span className="text-[11px] font-semibold transition-colors duration-200" style={{ color }}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
