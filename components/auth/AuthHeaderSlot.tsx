'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserAvatar } from './UserAvatar';
import { Login1 } from '@/components/ui/login-1';

export function AuthHeaderSlot() {
  const { isLoggedIn } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);

  // Zatvori modal cim se korisnik uloguje (adjust-during-render)
  if (isLoggedIn && loginOpen) setLoginOpen(false);

  if (isLoggedIn) {
    return <UserAvatar size={32} />;
  }

  return (
    <>
      <button
        onClick={() => setLoginOpen(true)}
        className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-150 cursor-pointer active:scale-95"
        style={{ background: '#f59e0b', color: '#0f1219' }}
      >
        Prijavi se
      </button>
      <Login1
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        heading="Dobrodošao nazad"
        buttonText="Prijavi se"
        googleText="Nastavi sa Google-om"
        signupText="Nemaš nalog?"
        signupUrl="/register"
      />
    </>
  );
}
