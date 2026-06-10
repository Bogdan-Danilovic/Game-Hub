'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import type { UserProfile } from '@/types/auth';

interface FoundUser {
  uid: string;
  profile: UserProfile;
}

export function FriendSearch() {
  const { user, profile } = useAuth();
  const [search, setSearch] = useState('');
  const [found, setFound] = useState<FoundUser | null>(null);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doSearch = useCallback(async (username: string) => {
    setSearching(true);
    setFound(null);
    setError(null);
    try {
      const q = query(collection(db, 'users'), where('username', '==', username));
      const snap = await getDocs(q);
      if (snap.empty) {
        setError('Korisnik nije pronađen.');
        return;
      }
      const d = snap.docs[0];
      setFound({ uid: d.id, profile: d.data() as UserProfile });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Greška pri pretrazi');
    } finally {
      setSearching(false);
    }
  }, []);

  // Ocisti rezultat cim upit postane prekratak (adjust-during-render)
  const [prevSearch, setPrevSearch] = useState(search);
  if (prevSearch !== search) {
    setPrevSearch(search);
    if (search.length < 3) {
      setFound(null);
      setError(null);
    }
  }

  useEffect(() => {
    if (search.length < 3) return;
    const id = setTimeout(() => void doSearch(search), 300);
    return () => clearTimeout(id);
  }, [search, doSearch]);

  const addFriend = async () => {
    if (!user || !found) return;
    if (found.uid === user.uid) {
      setError('Ne možeš dodati sebe.');
      return;
    }
    if (profile?.friends.includes(found.uid)) {
      setError('Već ste prijatelji.');
      return;
    }
    setAdding(true);
    setError(null);
    try {
      // One-directional add: write only to our own document. Firestore rules
      // allow a user to modify only `users/{their-own-uid}`, so a mutual write
      // to the other player's doc would be denied. Friends behave like "follows".
      await updateDoc(doc(db, 'users', user.uid), { friends: arrayUnion(found.uid) });
      setFound(null);
      setSearch('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Dodavanje nije uspelo');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-gray-300">Dodaj prijatelja</p>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Pretraži po username-u"
        className="w-full rounded-xl bg-gray-800 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
      />
      {searching && <p className="text-xs text-gray-400">Pretražujem...</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
      {found && (
        <div className="flex items-center justify-between rounded-xl bg-gray-800 px-4 py-3">
          <div className="flex items-center gap-3">
            {found.profile.photoURL ? (
              <Image
                src={found.profile.photoURL}
                alt=""
                width={32}
                height={32}
                className="rounded-full object-cover"
              />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold">
                {found.profile.displayName[0].toUpperCase()}
              </span>
            )}
            <div>
              <p className="text-sm font-medium">{found.profile.displayName}</p>
              <p className="text-xs text-gray-400">@{found.profile.username}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void addFriend()}
            disabled={adding}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium hover:bg-indigo-500 transition disabled:opacity-40"
          >
            {adding ? '...' : 'Dodaj'}
          </button>
        </div>
      )}
    </div>
  );
}
