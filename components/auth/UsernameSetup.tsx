'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

type CheckStatus = 'idle' | 'checking' | 'taken' | 'free' | 'saving';

export function UsernameSetup() {
  const { user, profile } = useAuth();
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<CheckStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const needsSetup = user != null && !user.isAnonymous && profile?.username === '';

  const checkUniqueness = useCallback(async (name: string) => {
    setStatus('checking');
    try {
      const snap = await getDoc(doc(db, 'usernames', name));
      setStatus(snap.exists() ? 'taken' : 'free');
    } catch {
      setStatus('idle');
    }
  }, []);

  useEffect(() => {
    if (!USERNAME_RE.test(value)) {
      setStatus('idle');
      return;
    }
    const id = setTimeout(() => void checkUniqueness(value), 500);
    return () => clearTimeout(id);
  }, [value, checkUniqueness]);

  const handleSave = async () => {
    if (!user || status !== 'free') return;
    setStatus('saving');
    setError(null);
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'usernames', value), { uid: user.uid });
      batch.update(doc(db, 'users', user.uid), {
        username: value,
        createdAt: serverTimestamp(),
      });
      await batch.commit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Čuvanje nije uspelo');
      setStatus('free');
    }
  };

  if (!needsSetup) return null;

  const validFormat = USERNAME_RE.test(value);
  const canSave = status === 'free';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-gray-900 text-white p-6 flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Izaberi korisničko ime</h2>
        <p className="text-sm text-gray-400">3–20 karaktera, samo slova, brojevi i _</p>

        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value.toLowerCase())}
            placeholder="korisnicko_ime"
            maxLength={20}
            className="w-full rounded-xl bg-gray-800 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm select-none">
            {status === 'checking' && '⏳'}
            {status === 'taken' && <span className="text-red-400">✗</span>}
            {status === 'free' && <span className="text-green-400">✓</span>}
          </span>
        </div>

        {!validFormat && value.length > 0 && (
          <p className="text-xs text-red-400">Neispravan format korisničkog imena.</p>
        )}
        {status === 'taken' && (
          <p className="text-xs text-red-400">Korisničko ime je zauzeto.</p>
        )}
        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={!canSave}
          className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-medium hover:bg-indigo-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {status === 'saving' ? 'Čuvanje...' : 'Potvrdi'}
        </button>
      </div>
    </div>
  );
}
