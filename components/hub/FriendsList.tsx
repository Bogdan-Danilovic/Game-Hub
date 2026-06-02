'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  subscribeFriendProfiles,
  ONLINE_THRESHOLD_MS,
  guestAvatarFor,
  guestColorFor,
  type LeaderboardRow,
} from '@/lib/firestore/players';
import {
  acceptFriendRequest,
  declineFriendRequest,
  subscribeToFriendRequests,
} from '@/lib/firestore/social';
import type { FriendRequest } from '@/lib/types/social';

const TICK_MS = 30_000;

export function FriendsList() {
  const { user, profile } = useAuth();
  const friends = profile?.friends ?? [];
  const friendsKey = friends.join(',');
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [pending, setPending] = useState<FriendRequest[]>([]);

  useEffect(() => {
    if (friends.length === 0) {
      setRows([]);
      return;
    }
    return subscribeFriendProfiles(friends, setRows, () => setRows([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friendsKey]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!user) return;
    return subscribeToFriendRequests(user.uid, setPending);
  }, [user]);

  const sorted = [...rows].sort((a, b) => {
    const aOn = a.profile.lastSeen != null && now - a.profile.lastSeen.toMillis() < ONLINE_THRESHOLD_MS;
    const bOn = b.profile.lastSeen != null && now - b.profile.lastSeen.toMillis() < ONLINE_THRESHOLD_MS;
    return Number(bOn) - Number(aOn);
  });

  return (
    <div className="w-full max-w-[500px] mx-auto px-4 pb-8 flex flex-col gap-6">
      {pending.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: '#64748b' }}>
            Zahtjevi · {pending.length}
          </p>
          {pending.map((req) => (
            <div
              key={req.id}
              className="flex items-center justify-between rounded-xl px-4 py-3"
              style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}
            >
              <span className="text-sm font-medium truncate" style={{ color: '#f1f5f9' }}>
                {req.from.slice(0, 8)}…
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => acceptFriendRequest(req.id)}
                  className="text-xs px-3 py-1 rounded-full font-semibold"
                  style={{ background: '#8b5cf6', color: '#fff' }}
                >
                  Prihvati
                </button>
                <button
                  type="button"
                  onClick={() => declineFriendRequest(req.id)}
                  className="text-xs px-3 py-1 rounded-full font-semibold"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    color: '#94a3b8',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  Odbij
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-[11px] uppercase tracking-[0.2em]" style={{ color: '#64748b' }}>
          Prijatelji · {friends.length}
        </p>
        {friends.length === 0 ? (
          <p className="text-sm" style={{ color: '#475569' }}>Još nemaš prijatelja.</p>
        ) : (
          sorted.map(({ uid, profile: p }) => {
            const color = p.color ?? guestColorFor(uid);
            const avatar = p.avatar ?? guestAvatarFor(uid);
            const isOnline =
              p.lastSeen != null && now - p.lastSeen.toMillis() < ONLINE_THRESHOLD_MS;
            return (
              <div
                key={uid}
                className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="relative shrink-0">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full text-xl"
                    style={{ background: `${color}22`, border: `1px solid ${color}55` }}
                  >
                    {avatar}
                  </span>
                  <span
                    aria-hidden
                    className="absolute bottom-0 right-0 h-3 w-3 rounded-full"
                    style={{
                      background: isOnline ? '#10b981' : '#334155',
                      border: '2px solid #080b14',
                    }}
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate" style={{ color: '#f1f5f9' }}>
                    {p.displayName}
                  </span>
                  <span className="text-[11px]" style={{ color: isOnline ? '#10b981' : '#475569' }}>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
