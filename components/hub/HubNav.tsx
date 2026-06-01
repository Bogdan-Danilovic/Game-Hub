'use client';

import Link from 'next/link';
import { Trophy, UserRound } from 'lucide-react';

const linkClass =
  'flex h-9 w-9 items-center justify-center rounded-lg transition-colors';

export function HubNav() {
  return (
    <nav className="mr-auto flex items-center gap-1" aria-label="Glavna navigacija">
      <Link
        href="/leaderboard"
        aria-label="Rang lista"
        title="Rang lista"
        className={linkClass}
        style={{ color: '#94a3b8' }}
      >
        <Trophy size={18} />
      </Link>
      <Link
        href="/profile"
        aria-label="Profil"
        title="Profil"
        className={linkClass}
        style={{ color: '#94a3b8' }}
      >
        <UserRound size={18} />
      </Link>
    </nav>
  );
}
