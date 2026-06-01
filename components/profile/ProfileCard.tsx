'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import type { UserProfile } from '@/types/auth';
import { GAMES } from '@/lib/games/registry';
import { guestAvatarFor, guestColorFor } from '@/lib/firestore/players';

interface Props {
  uid: string;
  profile: UserProfile;
}

const spring = { type: 'spring' as const, stiffness: 300, damping: 20 };

export function ProfileCard({ uid, profile }: Props) {
  const avatar = profile.avatar ?? guestAvatarFor(uid);
  const color = profile.color ?? guestColorFor(uid);
  const played = profile.stats.gamesPlayed;
  const won = profile.stats.gamesWon;
  const winRate = played > 0 ? Math.round((won / played) * 100) : 0;
  const perGame = profile.stats.gamesPerGame ?? {};
  const playedGames = GAMES.filter((g) => perGame[g.id] && perGame[g.id].played > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={spring}
      className="w-full rounded-2xl p-5 flex flex-col gap-5"
      style={{ background: '#0f1320', border: '1px solid rgba(139,92,246,0.15)' }}
    >
      {/* Identity */}
      <div className="flex items-center gap-4">
        {profile.photoURL ? (
          <Image
            src={profile.photoURL}
            alt={profile.displayName}
            width={60}
            height={60}
            className="rounded-2xl object-cover"
          />
        ) : (
          <span
            className="flex h-[60px] w-[60px] items-center justify-center rounded-2xl text-3xl select-none"
            style={{ background: `${color}22`, border: `1px solid ${color}55` }}
          >
            {avatar}
          </span>
        )}
        <div className="min-w-0">
          <p className="text-lg font-bold leading-tight truncate" style={{ color: '#f1f5f9' }}>
            {profile.displayName}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-sm truncate" style={{ color: '#94a3b8' }}>
              @{profile.username}
            </p>
            {profile.isGuest && (
              <span
                className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}
              >
                Gost
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Aggregate stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Odigrano', value: played },
          { label: 'Pobjede', value: won },
          { label: 'Win %', value: `${winRate}%` },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl py-3 text-center"
            style={{ background: '#161b2e' }}
          >
            <p className="text-2xl font-bold tabular-nums" style={{ color: '#f1f5f9' }}>
              {value}
            </p>
            <p className="text-[10px] uppercase tracking-[0.12em] mt-0.5" style={{ color: '#64748b' }}>
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Per-game breakdown */}
      {playedGames.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: '#64748b' }}>
            Po igri
          </p>
          {playedGames.map((g) => {
            const s = perGame[g.id];
            return (
              <div
                key={g.id}
                className="flex items-center justify-between rounded-lg px-3 py-2"
                style={{ background: 'rgba(255,255,255,0.025)' }}
              >
                <span className="flex items-center gap-2 text-sm" style={{ color: '#cbd5e1' }}>
                  <span className="text-base">{g.icon}</span>
                  {g.name}
                </span>
                <span className="text-sm tabular-nums" style={{ color: '#94a3b8' }}>
                  <span style={{ color: g.accentColor, fontWeight: 700 }}>{s.wins}</span>
                  {' / '}
                  {s.played}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
