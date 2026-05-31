'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import Link from 'next/link';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/lib/firebase';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  heading?: string;
  buttonText?: string;
  googleText?: string;
  signupText?: string;
  signupUrl?: string;
};

function mapAuthError(code: string): string {
  switch (code) {
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'Pogrešna lozinka ili email adresa';
    case 'auth/user-not-found': return 'Korisnik sa ovim emailom ne postoji';
    case 'auth/invalid-email': return 'Nevažeća email adresa';
    case 'auth/too-many-requests': return 'Previše pokušaja. Pokušaj ponovo kasnije';
    case 'auth/user-disabled': return 'Nalog je onemogućen';
    default: return 'Prijava nije uspela';
  }
}

export function Login1({
  isOpen,
  onClose,
  heading = 'Dobrodošao nazad',
  buttonText = 'Prijavi se',
  googleText = 'Nastavi sa Google-om',
  signupText = 'Nemaš nalog?',
  signupUrl = '/register',
}: Props) {
  const { signInWithGoogle, loading: googleLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEmailSignIn() {
    if (!email || !password) return;
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onClose();
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      setError(mapAuthError(code));
    } finally {
      setLoading(false);
    }
  }

  const busy = loading || googleLoading;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(8,11,20,0.85)' }}
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3 }}
            className="relative w-full max-w-[360px] rounded-2xl px-6 pt-8 pb-7 mx-4"
            style={{ background: '#161b27', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-600 hover:text-slate-300 transition-colors duration-150 cursor-pointer"
            >
              <X size={18} />
            </button>

            <h2 className="text-[20px] font-bold text-white mb-6">{heading}</h2>

            <input
              type="email"
              placeholder="Email adresa"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={busy}
              className="w-full px-4 py-3 rounded-xl text-[14px] mb-3 outline-none transition-all duration-200 disabled:opacity-50"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white',
              }}
            />

            <input
              type="password"
              placeholder="Lozinka"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleEmailSignIn(); }}
              disabled={busy}
              className="w-full px-4 py-3 rounded-xl text-[14px] mb-4 outline-none transition-all duration-200 disabled:opacity-50"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white',
              }}
            />

            <button
              type="button"
              onClick={handleEmailSignIn}
              disabled={busy || !email || !password}
              className="w-full py-3 rounded-xl text-[14px] font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mb-3 cursor-pointer"
              style={{ background: '#f59e0b', color: '#0f1219' }}
            >
              {loading ? 'Prijavljivanje...' : buttonText}
            </button>

            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={busy}
              className="w-full py-3 rounded-xl text-[14px] font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 mb-5 cursor-pointer"
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.8)',
              }}
            >
              <GoogleIcon />
              {googleText}
            </button>

            {error && <p className="text-xs text-red-400 text-center mb-4">{error}</p>}

            <p className="text-center text-[12px] text-slate-500">
              {signupText}{' '}
              <Link
                href={signupUrl}
                className="text-amber-400 hover:text-amber-300 transition-colors duration-150"
                onClick={onClose}
              >
                Registruj se
              </Link>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
    </svg>
  );
}
