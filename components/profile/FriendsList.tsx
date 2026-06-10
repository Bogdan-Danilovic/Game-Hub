'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  subscribeFriendProfiles,
  ONLINE_THRESHOLD_MS,
  guestAvatarFor,
  guestColorFor,
  type LeaderboardRow,
} from '@/lib/firestore/players';

interface Props {
  friendIds: string[];
}

const PRESENCE_TICK_MS = 30_000;

function isOnline(row: LeaderboardRow, now: number): boolean {
  const last = row.profile.lastSeen;
  return last != null && now - last.toMillis() < ONLINE_THRESHOLD_MS;
}

export function FriendsList({ friendIds }: Props) {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const idsKey = friendIds.join(',');

  // Reset pri promeni liste prijatelja (adjust-during-render)
  const [prevIdsKey, setPrevIdsKey] = useState(idsKey);
  if (prevIdsKey !== idsKey) {
    setPrevIdsKey(idsKey);
    setLoading(true);
    setError(null);
  }

  useEffect(() => {
    const unsub = subscribeFriendProfiles(
      friendIds,
      (data) => {
        setRows(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsub;
    // friendIds is derived from idsKey; depend on the stable string form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), PRESENCE_TICK_MS);
    return () => clearInterval(id);
  }, []);

  const sorted = [...rows].sort((a, b) => {
    const ao = isOnline(a, now) ? 0 : 1;
    const bo = isOnline(b, now) ? 0 : 1;
    if (ao !== bo) return ao - bo;
    return a.profile.displayName.localeCompare(b.profile.displayName);
  });

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: '#64748b' }}>
        Prijatelji
      </p>

      {loading && <p className="text-xs" style={{ color: '#64748b' }}>Učitavam...</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
      {!loading && !error && sorted.length === 0 && (
        <p className="text-xs" style={{ color: '#64748b' }}>Još nemaš prijatelja.</p>
      )}

      {sorted.map((row) => {
        const { uid, profile } = row;
        const online = isOnline(row, now);
        const color = profile.color ?? guestColorFor(uid);
        const avatar = profile.avatar ?? guestAvatarFor(uid);
        return (
          <div
            key={uid}
            className="flex items-center justify-between rounded-xl px-3 py-2.5"
            style={{ background: '#161b2e' }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                {profile.photoURL ? (
                  <Image
                    src={profile.photoURL}
                    alt={profile.displayName}
                    width={36}
                    height={36}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full text-lg"
                    style={{ background: `${color}22`, border: `1px solid ${color}55` }}
                  >
                    {avatar}
                  </span>
                )}
                <span
                  aria-hidden
                  className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full"
                  style={{
                    background: online ? '#10b981' : '#475569',
                    border: '2px solid #161b2e',
                  }}
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: '#f1f5f9' }}>
                  {profile.displayName}
                </p>
                <p className="text-[11px]" style={{ color: online ? '#10b981' : '#64748b' }}>
                  {online ? 'online' : 'offline'}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
