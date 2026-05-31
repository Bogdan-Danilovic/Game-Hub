'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { GoogleSignInButton } from './GoogleSignInButton';

const STORAGE_KEY = 'guest_banner_dismissed';

export function GuestBanner() {
  const { isGuest } = useAuth();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === 'true');
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setDismissed(true);
  };

  if (!isGuest || dismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between gap-3 bg-gray-900/95 backdrop-blur-sm border-t border-white/10 px-4 py-3">
      <p className="text-xs text-gray-300 flex-1 min-w-0">
        Prijavi se da sačuvaš statistike i dodaš prijatelje
      </p>
      <div className="flex items-center gap-2 shrink-0">
        <GoogleSignInButton className="!min-w-0 !px-3 !py-2 !text-xs" />
        <button
          type="button"
          onClick={dismiss}
          aria-label="Zatvori baner"
          className="text-gray-500 hover:text-gray-300 transition text-xl leading-none px-1"
        >
          ×
        </button>
      </div>
    </div>
  );
}
