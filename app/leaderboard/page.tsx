'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable';

export default function LeaderboardPage() {
  return (
    <main className="relative flex flex-col items-center min-h-dvh overflow-x-hidden">
      <div aria-hidden className="fixed inset-0 -z-10 bg-grid" />
      <div
        aria-hidden
        className="breathing-orb"
        style={{
          width: 560,
          height: 560,
          top: '-18%',
          left: '-10%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.40), transparent 70%)',
        }}
      />

      <div className="relative z-10 w-full max-w-[520px] px-4 pt-20 pb-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm mb-6 transition-colors"
          style={{ color: '#94a3b8' }}
        >
          <ChevronLeft size={16} /> Hub
        </Link>

        <header className="mb-6">
          <h1
            className="text-glow-v"
            style={{ fontWeight: 700, fontSize: 30, color: '#f1f5f9', letterSpacing: '-0.02em' }}
          >
            Rang lista
          </h1>
          <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
            Top 20 igrača po pobjedama
          </p>
        </header>

        <LeaderboardTable />
      </div>
    </main>
  );
}
