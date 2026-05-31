'use client';

import { useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  size?: number;
}

const ProfileModalLazy = dynamic(
  () => import('./ProfileModal').then((m) => ({ default: m.ProfileModal })),
  { ssr: false }
);

export function UserAvatar({ size = 36 }: Props) {
  const { profile, isLoggedIn } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  if (!isLoggedIn || !profile) return null;

  const initials = profile.displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      <button
        type="button"
        title={profile.displayName}
        onClick={() => setModalOpen(true)}
        className="rounded-full ring-2 ring-white/30 hover:ring-white/70 transition focus:outline-none focus-visible:ring-white"
        style={{ width: size, height: size }}
        aria-label={`Profil: ${profile.displayName}`}
      >
        {profile.photoURL ? (
          <Image
            src={profile.photoURL}
            alt={profile.displayName}
            width={size}
            height={size}
            className="rounded-full object-cover"
          />
        ) : (
          <span
            className="flex items-center justify-center rounded-full bg-indigo-600 text-white font-semibold select-none"
            style={{ width: size, height: size, fontSize: size * 0.38 }}
          >
            {initials}
          </span>
        )}
      </button>
      {modalOpen && <ProfileModalLazy onClose={() => setModalOpen(false)} />}
    </>
  );
}
