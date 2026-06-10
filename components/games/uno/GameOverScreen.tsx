'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { UnoRoom } from '@/lib/types/uno';
import { Button } from '@/components/shared/Button';
import { playAgain } from '@/lib/firestore/uno';
import { hexA } from '@/lib/utils';

interface Props {
  room: UnoRoom;
  playerId: string;
}

const ACCENT = '#f97316';

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

export function GameOverScreen({ room, playerId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isHost = room.hostId === playerId;

  const sorted = [...room.players].sort((a, b) => b.totalScore - a.totalScore);
  const champion = room.winnerId
    ? room.players.find((p) => p.id === room.winnerId)
    : sorted[0];
  const iWon = champion?.id === playerId;

  async function handlePlayAgain() {
    setLoading(true);
    await playAgain(room.code);
    setLoading(false);
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="mx-auto flex w-full max-w-[400px] flex-col gap-6 px-5 pb-14 pt-20">
        {/* Hero */}
        <motion.div
          {...fadeIn(0.1)}
          className="rounded-3xl p-6 text-center"
          style={{
            background: `linear-gradient(160deg, ${hexA(ACCENT, 0.32)} 0%, rgba(0,0,0,0.88) 100%)`,
            border: `1px solid ${hexA(ACCENT, 0.3)}`,
            boxShadow: `0 24px 72px ${hexA(ACCENT, 0.3)}`,
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 250, damping: 16 }}
            className="text-6xl mb-4"
          >
            {iWon ? '🏆' : '🎮'}
          </motion.div>
          <div className="text-[28px] font-extrabold text-white mb-2">
            {iWon ? 'Pobijedio si!' : 'Igra završena!'}
          </div>
          {champion && (
            <div className="text-[16px] font-semibold text-white/80 mb-1">
              {iWon ? 'Bravo!' : (
                <>
                  <span style={{ color: ACCENT }}>{champion.name}</span> pobjeđuje!
                </>
              )}
            </div>
          )}
          <div className="text-[13px] text-white/50 mt-2">
            {champion?.totalScore} bodova
          </div>
        </motion.div>

        {/* Final standings */}
        <motion.div {...fadeIn(0.25)}>
          <div className="text-lg font-extrabold text-white mb-3">Konačni poredak</div>
          <div className="flex flex-col gap-2">
            {sorted.map((p, i) => {
              const isSelf = p.id === playerId;
              const isChamp = p.id === champion?.id;
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.08, duration: 0.4 }}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
                  style={{
                    background: isChamp ? hexA(ACCENT, 0.18) : 'rgba(255,255,255,0.04)',
                    border: isChamp
                      ? `1px solid ${hexA(ACCENT, 0.35)}`
                      : '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[14px] font-extrabold"
                    style={{
                      background: i === 0
                        ? `linear-gradient(135deg, ${ACCENT}, #fbbf24)`
                        : i === 1
                        ? 'linear-gradient(135deg, #94a3b8, #64748b)'
                        : 'rgba(255,255,255,0.1)',
                      color: 'white',
                    }}
                  >
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i + 1}
                  </div>
                  <span className="flex-1 text-[15px] font-bold text-white truncate">
                    {isSelf ? 'Ti' : p.name}
                  </span>
                  <span className="text-[16px] font-extrabold text-white tabular-nums">
                    {p.totalScore}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Buttons */}
        <motion.div {...fadeIn(0.5)} className="flex flex-col gap-3">
          {isHost && (
            <Button
              fullWidth
              disabled={loading}
              onClick={handlePlayAgain}
              className="!rounded-2xl !text-white"
              style={{
                background: `linear-gradient(135deg, ${ACCENT}, ${hexA(ACCENT, 0.8)})`,
                boxShadow: `0 4px 16px ${hexA(ACCENT, 0.4)}`,
              }}
            >
              {loading ? 'Učitavanje...' : 'Igraj ponovo'}
            </Button>
          )}
          {!isHost && (
            <motion.p
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="text-center text-[12px] text-orange-100/40"
            >
              Čekamo host...
            </motion.p>
          )}
          <Button
            variant="ghost"
            fullWidth
            onClick={() => router.push('/')}
            className="!text-orange-100/40 hover:!text-orange-100/70"
          >
            Nazad na Hub
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
