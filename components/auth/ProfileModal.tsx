'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { FriendSearch } from './FriendSearch';
import type { GameHistoryEntry } from '@/types/auth';

interface Props {
  onClose: () => void;
}

export function ProfileModal({ onClose }: Props) {
  const { user, profile, signOut } = useAuth();
  const [games, setGames] = useState<GameHistoryEntry[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [gamesError, setGamesError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'gameHistory', user.uid, 'games'),
      orderBy('playedAt', 'desc'),
      limit(10)
    );
    getDocs(q)
      .then((snap) => {
        setGames(snap.docs.map((d) => d.data() as GameHistoryEntry));
      })
      .catch((err: unknown) => {
        setGamesError(err instanceof Error ? err.message : 'Greška pri učitavanju igara');
      })
      .finally(() => setGamesLoading(false));
  }, [user]);

  if (!profile) return null;

  const initials = profile.displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-gray-900 text-white p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-4">
          {profile.photoURL ? (
            <Image
              src={profile.photoURL}
              alt={profile.displayName}
              width={56}
              height={56}
              className="rounded-full object-cover"
            />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-xl font-bold">
              {initials}
            </span>
          )}
          <div>
            <p className="font-semibold text-lg leading-tight">{profile.displayName}</p>
            <p className="text-sm text-gray-400">@{profile.username}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: 'Igara', value: profile.stats.gamesPlayed },
            { label: 'Pobeda', value: profile.stats.gamesWon },
            { label: 'Hosted', value: profile.stats.gamesHosted },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl bg-gray-800 py-3">
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-gray-400">{label}</p>
            </div>
          ))}
        </div>

        {/* Game history */}
        <div>
          <p className="text-sm font-medium text-gray-300 mb-2">Poslednjih 10 igara</p>
          {gamesLoading && <Skeleton rows={3} />}
          {gamesError && <p className="text-xs text-red-400">{gamesError}</p>}
          {!gamesLoading && !gamesError && games.length === 0 && (
            <p className="text-xs text-gray-500">Još nema odigranih igara.</p>
          )}
          {games.length > 0 && (
            <ul className="flex flex-col gap-1">
              {games.map((g, i) => (
                <li
                  key={i}
                  className="flex justify-between text-sm py-1 border-b border-gray-800 last:border-0"
                >
                  <span>
                    {g.gameName} · {g.roomCode}
                  </span>
                  <span className={g.isWinner ? 'text-green-400' : 'text-gray-500'}>
                    {g.isWinner ? 'Pobeda' : 'Poraz'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Friend search */}
        <FriendSearch />

        {/* Sign out */}
        <button
          type="button"
          onClick={async () => {
            await signOut();
            onClose();
          }}
          className="w-full rounded-xl bg-red-600/20 py-3 text-sm font-medium text-red-400 hover:bg-red-600/30 transition"
        >
          Odjavi se
        </button>
      </div>
    </div>
  );
}

function Skeleton({ rows }: { rows: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-4 rounded bg-gray-700 animate-pulse" />
      ))}
    </div>
  );
}
