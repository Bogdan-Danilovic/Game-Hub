'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createRoom, joinRoom } from '@/lib/firestore/impostor';

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

const shake = {
  x: [0, -6, 6, -4, 4, -2, 2, 0],
  transition: { duration: 0.35 },
};

export function HomeScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');
  const [errorKey, setErrorKey] = useState(0);
  const [loading, setLoading] = useState<'create' | 'join' | null>(null);

  const NAME_REGEX = /^[\p{L}\p{N} ]+$/u;
  const trimmedName = name.trim();
  const nameValid = trimmedName.length >= 2 && trimmedName.length <= 16 && NAME_REGEX.test(trimmedName);

  function showError(msg: string) {
    setError(msg);
    setErrorKey((k) => k + 1);
  }

  async function handleCreate() {
    if (!nameValid) return;
    setError('');
    setLoading('create');
    try {
      const { code, playerId } = await createRoom(trimmedName);
      localStorage.setItem('playerId', playerId);
      localStorage.setItem('playerName', trimmedName);
      router.push(`/games/impostor/room/${code}`);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Greška pri kreiranju sobe.');
      setLoading(null);
    }
  }

  async function handleJoin() {
    if (!nameValid || roomCode.trim().length !== 5) return;
    setError('');
    setLoading('join');
    try {
      const code = roomCode.trim().toUpperCase();
      const { playerId, error: joinError } = await joinRoom(code, trimmedName);
      if (joinError) { showError(joinError); setLoading(null); return; }
      localStorage.setItem('playerId', playerId);
      localStorage.setItem('playerName', trimmedName);
      router.push(`/games/impostor/room/${code}`);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Greška pri pridruživanju.');
      setLoading(null);
    }
  }

  return (
    <div className="relative flex flex-col items-center justify-center flex-1 px-8 h-screen-safe overflow-hidden">
      <div className="relative w-full max-w-[320px] flex flex-col gap-12">

        {/* Identity mark */}
        <motion.div {...fadeIn(0.2)} className="flex flex-col items-start gap-6">
          <motion.div
            className="text-4xl"
            animate={{ rotate: [0, -5, 5, -3, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            🎭
          </motion.div>

          <div>
            <h1 className="text-[48px] font-bold tracking-[-0.04em] leading-[0.9] text-white">
              Impostor
            </h1>
            <p className="mt-3 text-[13px] text-slate-500 leading-relaxed max-w-[260px]">
              Jedan od vas laže. Ostali moraju da otkriju ko.
            </p>
          </div>
        </motion.div>

        {/* Name */}
        <motion.div {...fadeIn(0.4)}>
          <Input
            label="Tvoje ime"
            placeholder="Unesi ime"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={16}
            autoComplete="off"
          />
        </motion.div>

        {/* Actions */}
        <motion.div {...fadeIn(0.6)} className="flex flex-col gap-4">
          <Button
            fullWidth
            disabled={!nameValid || loading !== null}
            onClick={handleCreate}
          >
            {loading === 'create' ? (
              <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                Kreiranje...
              </motion.span>
            ) : 'Napravi sobu'}
          </Button>

          {/* Join row */}
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Input
                label="Kod sobe"
                placeholder="_ _ _ _ _"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={5}
                className="text-center tracking-[0.4em] uppercase font-bold text-[16px]"
              />
            </div>
            <Button
              variant="secondary"
              disabled={!nameValid || roomCode.trim().length !== 5 || loading !== null}
              onClick={handleJoin}
              className="shrink-0 mb-[1px]"
            >
              {loading === 'join' ? '...' : 'Uđi'}
            </Button>
          </div>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.p
            key={errorKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, ...shake }}
            className="text-[13px] text-red-400/90 -mt-4"
          >
            {error}
          </motion.p>
        )}
      </div>
    </div>
  );
}
