'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { GAMES } from '@/lib/games/registry';
import {
  subscribeLeaderboard,
  guestAvatarFor,
  guestColorFor,
  type LeaderboardRow,
} from '@/lib/firestore/players';

interface Filter {
  id: string | null;
  label: string;
}

const FILTERS: Filter[] = [
  { id: null, label: 'Sve' },
  ...GAMES.filter((g) => g.available).map((g) => ({ id: g.id, label: g.name })),
];

const MEDALS = ['🥇', '🥈', '🥉'];

function winsFor(row: LeaderboardRow, gameType: string | null): number {
  if (!gameType) return row.profile.stats.gamesWon;
  return row.profile.stats.gamesPerGame?.[gameType]?.wins ?? 0;
}

export function LeaderboardTable() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<string | null>(null);
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const unsub = subscribeLeaderboard(
      filter,
      (data) => {
        setRows(data.filter((r) => winsFor(r, filter) > 0));
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [filter]);

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {FILTERS.map((f) => {
          const active = f.id === filter;
          return (
            <button
              key={f.label}
              type="button"
              onClick={() => setFilter(f.id)}
              className="shrink-0 px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors"
              style={{
                background: active ? '#8b5cf6' : '#161b2e',
                color: active ? '#fff' : '#94a3b8',
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {loading && <p className="text-sm text-center py-8" style={{ color: '#64748b' }}>Učitavam...</p>}
      {error && <p className="text-sm text-center py-8 text-red-400">{error}</p>}
      {!loading && !error && rows.length === 0 && (
        <p className="text-sm text-center py-8" style={{ color: '#64748b' }}>
          Još nema rezultata. Odigraj partiju!
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        {rows.map((row, i) => {
          const { uid, profile } = row;
          const isMe = user?.uid === uid;
          const color = profile.color ?? guestColorFor(uid);
          const avatar = profile.avatar ?? guestAvatarFor(uid);
          return (
            <motion.div
              key={uid}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: Math.min(i * 0.03, 0.3) }}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5"
              style={{
                background: isMe ? 'rgba(139,92,246,0.12)' : '#0f1320',
                border: isMe ? '1px solid rgba(139,92,246,0.4)' : '1px solid transparent',
              }}
            >
              <span className="w-7 text-center text-sm font-bold tabular-nums shrink-0" style={{ color: '#64748b' }}>
                {i < 3 ? MEDALS[i] : i + 1}
              </span>
              {profile.photoURL ? (
                <Image
                  src={profile.photoURL}
                  alt={profile.displayName}
                  width={32}
                  height={32}
                  className="rounded-full object-cover shrink-0"
                />
              ) : (
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full text-base shrink-0"
                  style={{ background: `${color}22`, border: `1px solid ${color}55` }}
                >
                  {avatar}
                </span>
              )}
              <span className="flex-1 min-w-0 text-sm font-medium truncate" style={{ color: '#f1f5f9' }}>
                {profile.displayName}
                {isMe && <span className="text-[10px] uppercase ml-2" style={{ color: '#8b5cf6' }}>ti</span>}
              </span>
              <span className="text-base font-bold tabular-nums shrink-0" style={{ color: '#8b5cf6' }}>
                {winsFor(row, filter)}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
