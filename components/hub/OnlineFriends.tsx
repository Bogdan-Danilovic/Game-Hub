'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import {
  subscribeFriendProfiles,
  ONLINE_THRESHOLD_MS,
  guestAvatarFor,
  guestColorFor,
  type LeaderboardRow,
} from '@/lib/firestore/players';

const TICK_MS = 30_000;

export function OnlineFriends() {
  const { profile } = useAuth();
  const friends = profile?.friends ?? [];
  const friendsKey = friends.join(',');
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [now, setNow] = useState(() => Date.now());

  // Ocisti redove kad se lista prijatelja promeni (adjust-during-render)
  const [prevFriendsKey, setPrevFriendsKey] = useState(friendsKey);
  if (prevFriendsKey !== friendsKey) {
    setPrevFriendsKey(friendsKey);
    setRows([]);
  }

  useEffect(() => {
    if (friends.length === 0) return;
    const unsub = subscribeFriendProfiles(friends, setRows, () => setRows([]));
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friendsKey]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  // Spec: only render the section when the player actually has friends.
  if (friends.length === 0) return null;

  const online = rows.filter(
    (r) => r.profile.lastSeen != null && now - r.profile.lastSeen.toMillis() < ONLINE_THRESHOLD_MS,
  );

  return (
    <section className="relative z-10 w-full max-w-[500px] px-4 pb-8 mx-auto">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: '#64748b' }}>
          Prijatelji online · {online.length}
        </p>
        <Link href="/profile" className="text-[11px]" style={{ color: '#8b5cf6' }}>
          Svi →
        </Link>
      </div>

      {online.length === 0 ? (
        <p className="text-xs" style={{ color: '#475569' }}>Trenutno niko nije online.</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto no-scrollbar">
          {online.map(({ uid, profile: p }) => {
            const color = p.color ?? guestColorFor(uid);
            const avatar = p.avatar ?? guestAvatarFor(uid);
            return (
              <div key={uid} className="flex flex-col items-center gap-1.5 shrink-0 w-16">
                <div className="relative">
                  {p.photoURL ? (
                    <Image
                      src={p.photoURL}
                      alt={p.displayName}
                      width={48}
                      height={48}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <span
                      className="flex h-12 w-12 items-center justify-center rounded-full text-2xl"
                      style={{ background: `${color}22`, border: `1px solid ${color}55` }}
                    >
                      {avatar}
                    </span>
                  )}
                  <span
                    aria-hidden
                    className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full"
                    style={{ background: '#10b981', border: '2px solid #080b14' }}
                  />
                </div>
                <span className="text-[11px] truncate w-full text-center" style={{ color: '#cbd5e1' }}>
                  {p.displayName}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
