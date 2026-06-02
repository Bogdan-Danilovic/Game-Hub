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

/**
 * Frosted-glass bottom navigation bar with a dot indicator under the active item.
 * Visual-only for now (local state, no routing) — wired to routes in a later pass.
 */
export function HubBottomNav() {
  const [active, setActive] = useState('home');
  return (
    <nav
      aria-label="Hub navigacija"
      className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-[480px] -translate-x-1/2 justify-around rounded-t-[20px] border-t border-white/10 pb-7 pt-3"
      style={{
        background: 'rgba(20,20,20,0.85)',
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
      }}
    >
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
            <span className="text-[11px] font-semibold" style={{ color }}>
              {label}
            </span>
            <span
              className="h-1 w-1 rounded-full bg-white transition-opacity duration-200"
              style={{ opacity: on ? 1 : 0 }}
            />
          </button>
        );
      })}
    </nav>
  );
}
