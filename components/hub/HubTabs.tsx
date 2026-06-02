'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { subscribeToFriendRequests } from '@/lib/firestore/social';
import { HubScreen } from './HubScreen';
import { FriendsList } from './FriendsList';

type Tab = 'igre' | 'prijatelji';

const TABS: { id: Tab; label: string }[] = [
  { id: 'igre', label: 'Igre' },
  { id: 'prijatelji', label: 'Prijatelji' },
];

export function HubTabs() {
  const { user } = useAuth();
  const [active, setActive] = useState<Tab>('igre');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    return subscribeToFriendRequests(user.uid, (reqs) => setPendingCount(reqs.length));
  }, [user]);

  return (
    <div className="w-full">
      {/* Tab toggle */}
      <div className="mb-6 flex gap-2">
        {TABS.map(({ id, label }) => {
          const on = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm transition-all duration-200 ${
                on ? 'font-bold text-white' : 'font-medium text-white/50'
              }`}
              style={{
                background: on
                  ? 'linear-gradient(135deg, #8b5cf6, rgba(139,92,246,0.7))'
                  : 'rgba(255,255,255,0.08)',
                border: `1px solid ${on ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                boxShadow: on ? '0 8px 24px rgba(139,92,246,0.27)' : 'none',
              }}
            >
              {label}
              {id === 'prijatelji' && pendingCount > 0 && (
                <span
                  className="flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold"
                  style={{ background: '#ef4444', color: '#fff' }}
                >
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {active === 'igre' ? <HubScreen /> : <FriendsList />}
    </div>
  );
}
