'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { ProfileCard } from '@/components/profile/ProfileCard';
import { FriendsList } from '@/components/profile/FriendsList';
import { FriendSearch } from '@/components/auth/FriendSearch';
import {
  ensureGuestProfile,
  setPlayerProfile,
  guestAvatarFor,
  guestColorFor,
} from '@/lib/firestore/players';
import { GAMES } from '@/lib/games/registry';
import type { GameHistoryEntry } from '@/types/auth';

const AVATAR_CHOICES = ['🎮', '👾', '🦊', '🐼', '🦁', '🐙', '🦄', '🐸', '🦉', '🐺'];
const COLOR_CHOICES = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export default function ProfilePage() {
  const { user, profile, loading } = useAuth();

  return (
    <main className="relative flex flex-col items-center min-h-dvh overflow-x-hidden">
      <div aria-hidden className="fixed inset-0 -z-10 bg-grid" />
      <div
        aria-hidden
        className="breathing-orb"
        style={{
          width: 520,
          height: 520,
          top: '-16%',
          right: '-12%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.40), transparent 70%)',
        }}
      />

      <div className="relative z-10 w-full max-w-[440px] px-4 pt-20 pb-16 flex flex-col gap-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm transition-colors"
          style={{ color: '#94a3b8' }}
        >
          <ChevronLeft size={16} /> Hub
        </Link>

        {loading && <p className="text-sm" style={{ color: '#64748b' }}>Učitavam profil...</p>}

        {!loading && !user && (
          <div
            className="rounded-2xl p-5 text-sm"
            style={{ background: '#0f1320', border: '1px solid rgba(139,92,246,0.15)', color: '#94a3b8' }}
          >
            Gost identitet trenutno nije dostupan. Omogući „Anonymous“ prijavu u Firebase
            konzoli ili se prijavi nalogom.
          </div>
        )}

        {!loading && user && profile && <ProfileCard uid={user.uid} profile={profile} />}

        {/* Guest can set/edit name + avatar + color */}
        {!loading && user && (profile == null || profile.isGuest) && (
          <GuestEditor
            uid={user.uid}
            initialName={profile?.displayName ?? ''}
            initialAvatar={profile?.avatar ?? guestAvatarFor(user.uid)}
            initialColor={profile?.color ?? guestColorFor(user.uid)}
            hasProfile={profile != null}
          />
        )}

        {user && <GameHistorySection uid={user.uid} />}

        {user && profile && (
          <div
            className="rounded-2xl p-5 flex flex-col gap-5"
            style={{ background: '#0f1320', border: '1px solid rgba(139,92,246,0.15)' }}
          >
            <FriendSearch />
            <FriendsList friendIds={profile.friends} />
          </div>
        )}
      </div>
    </main>
  );
}

function GuestEditor({
  uid,
  initialName,
  initialAvatar,
  initialColor,
  hasProfile,
}: {
  uid: string;
  initialName: string;
  initialAvatar: string;
  initialColor: string;
  hasProfile: boolean;
}) {
  const [name, setName] = useState(initialName);
  const [avatar, setAvatar] = useState(initialAvatar);
  const [color, setColor] = useState(initialColor);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function save(): Promise<void> {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await ensureGuestProfile(uid, name || undefined);
      await setPlayerProfile(uid, {
        displayName: name.trim() || `Gost-${uid.slice(0, 4)}`,
        avatar,
        color,
      });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Čuvanje nije uspjelo');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: '#0f1320', border: '1px solid rgba(139,92,246,0.15)' }}
    >
      <p className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>
        {hasProfile ? 'Uredi gost profil' : 'Napravi gost profil'}
      </p>

      <input
        type="text"
        value={name}
        maxLength={20}
        onChange={(e) => setName(e.target.value)}
        placeholder="Tvoje ime"
        className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
        style={{ background: '#161b2e', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.08)' }}
      />

      <div className="flex flex-wrap gap-2">
        {AVATAR_CHOICES.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAvatar(a)}
            className="h-10 w-10 rounded-xl text-xl transition"
            style={{
              background: avatar === a ? `${color}22` : '#161b2e',
              border: avatar === a ? `1px solid ${color}` : '1px solid transparent',
            }}
          >
            {a}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {COLOR_CHOICES.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Boja ${c}`}
            onClick={() => setColor(c)}
            className="h-8 w-8 rounded-full transition"
            style={{ background: c, outline: color === c ? '2px solid #f1f5f9' : 'none', outlineOffset: 2 }}
          />
        ))}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}
      {saved && <p className="text-xs" style={{ color: '#10b981' }}>Sačuvano!</p>}

      <button
        type="button"
        onClick={() => void save()}
        disabled={saving}
        className="w-full rounded-xl py-3 text-sm font-semibold transition disabled:opacity-40"
        style={{ background: '#8b5cf6', color: '#fff' }}
      >
        {saving ? 'Čuvam...' : 'Sačuvaj'}
      </button>
    </div>
  );
}

function GameHistorySection({ uid }: { uid: string }) {
  const [games, setGames] = useState<GameHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prevUid, setPrevUid] = useState(uid);

  // Reset pri promeni korisnika (adjust-during-render)
  if (prevUid !== uid) {
    setPrevUid(uid);
    setGames([]);
    setLoading(true);
    setError(null);
  }

  useEffect(() => {
    let active = true;
    const q = query(
      collection(db, 'gameHistory', uid, 'games'),
      orderBy('playedAt', 'desc'),
      limit(10),
    );
    getDocs(q)
      .then((snap) => {
        if (!active) return;
        setGames(snap.docs.map((d) => d.data() as GameHistoryEntry));
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Greška pri učitavanju istorije');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [uid]);

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{ background: '#0f1320', border: '1px solid rgba(139,92,246,0.15)' }}
    >
      <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: '#64748b' }}>
        Istorija (posljednjih 10)
      </p>

      {loading && <p className="text-xs" style={{ color: '#64748b' }}>Učitavam...</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
      {!loading && !error && games.length === 0 && (
        <p className="text-xs" style={{ color: '#64748b' }}>Još nema odigranih partija.</p>
      )}

      {games.map((g, i) => {
        const meta = GAMES.find((x) => x.id === g.gameName);
        return (
          <div
            key={`${g.roomCode}-${i}`}
            className="flex items-center justify-between rounded-lg px-3 py-2"
            style={{ background: 'rgba(255,255,255,0.025)' }}
          >
            <span className="flex items-center gap-2 text-sm min-w-0" style={{ color: '#cbd5e1' }}>
              <span className="text-base">{meta?.icon ?? '🎮'}</span>
              <span className="truncate">{meta?.name ?? g.gameName}</span>
              <span className="text-[11px]" style={{ color: '#475569' }}>· {g.roomCode}</span>
            </span>
            <span
              className="text-xs font-semibold shrink-0"
              style={{ color: g.isWinner ? '#10b981' : '#64748b' }}
            >
              {g.isWinner ? 'Pobjeda' : 'Poraz'}
            </span>
          </div>
        );
      })}
    </div>
  );
}
