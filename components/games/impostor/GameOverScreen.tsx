'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ImpostorRoom } from '@/lib/types/impostor';
import { playAgain, leaveRoom } from '@/lib/firestore/impostor';
import { useAuth } from '@/hooks/useAuth';
import { recordGameResult } from '@/lib/firestore/players';
import { Button } from '@/components/shared/Button';
import { hexA } from '@/lib/utils';

interface Props {
  room: ImpostorRoom;
  playerId: string;
}

const ACCENT = '#dc2626';
const ACCENT2 = '#ef4444';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

export function GameOverScreen({ room, playerId }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const hasSaved = useRef(false);

  useEffect(() => {
    if (!user || hasSaved.current || room.winner === null) return;
    hasSaved.current = true;
    const isImpostor = room.impostorIds.includes(playerId);
    const won = room.winner === 'crew' ? !isImpostor : isImpostor;
    recordGameResult({
      playerId: user.uid,
      gameType: 'impostor',
      gameName: 'impostor',
      won,
      isHost: room.hostId === playerId,
      roomCode: room.code,
      gameKey: `${room.code}_${room.createdAt}`,
      playerNames: room.players.map((p) => p.name),
    }).catch((e) => console.error('[stats] impostor', e));
  }, [user, room.winner]);

  const isHost = room.hostId === playerId;
  const crewWon = room.winner === 'crew';
  const impostorCount = room.impostorIds.length;
  const crewCount = room.players.length - impostorCount;

  const winColor = crewWon ? '#10b981' : ACCENT;
  const winColor2 = crewWon ? '#34d399' : ACCENT2;

  async function handleLeave() {
    await leaveRoom(room.code, playerId);
    localStorage.removeItem('playerId');
    router.push('/games/impostor');
  }

  return (
    <div className="relative flex flex-col items-center justify-center flex-1 px-5 py-10 h-screen-safe overflow-y-auto">
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="relative w-full max-w-[340px] flex flex-col gap-6"
      >
        {/* Winner hero card */}
        <motion.div
          variants={fadeUp}
          className="w-full rounded-2xl border border-white/10 overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${hexA(winColor, 0.18)}, ${hexA(winColor2, 0.08)})`,
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="p-6 text-center">
            <motion.p
              className="text-4xl mb-4"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ delay: 0.3, duration: 0.5, ease: 'easeOut' }}
            >
              {room.winner === null ? '⚠️' : crewWon ? '🎉' : '🎭'}
            </motion.p>
            <h2
              className="text-[28px] font-bold tracking-[-0.03em] leading-tight"
              style={{ color: winColor2, textShadow: `0 0 20px ${hexA(winColor, 0.4)}` }}
            >
              {room.winner === null
                ? 'Igra prekinuta'
                : crewWon
                  ? 'Crewmate tim pobeđuje'
                  : 'Impostor pobeđuje'}
            </h2>
            {room.winner === null && (
              <p className="text-[12px] text-slate-500 mt-2">Premalo igrača za nastavak</p>
            )}

            {/* HUD chips */}
            <div className="flex justify-center gap-4 mt-5">
              {[
                { v: room.round, l: room.round === 1 ? 'runda' : 'runde' },
                { v: room.players.length, l: 'agenata' },
                { v: `${crewCount}:${impostorCount}`, l: 'odnos' },
              ].map((s, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center px-3 py-2 rounded-xl border border-white/[0.06] bg-white/[0.04]"
                >
                  <p className="text-[16px] font-bold text-white tabular-nums">{s.v}</p>
                  <p className="text-[8px] text-slate-500 uppercase tracking-[0.15em] mt-0.5">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Declassified agents — glass list */}
        <motion.div variants={fadeUp}>
          <p className="text-[9px] text-slate-500 tracking-[0.25em] uppercase mb-3">
            Deklasifikovani agenti
          </p>
          <div
            className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden"
            style={{ backdropFilter: 'blur(12px)' }}
          >
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.05, delayChildren: 0.4 } } }}
            >
              {room.players.map((p, i) => {
                const isImp = room.impostorIds.includes(p.id);
                return (
                  <motion.div
                    key={p.id}
                    variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
                    className="flex items-center justify-between py-2.5 px-4"
                    style={{
                      borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      background: isImp ? 'rgba(220,38,38,0.04)' : 'transparent',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-1.5 h-1.5 rounded-full ${isImp ? 'bg-red-400' : 'bg-emerald-400/60'}`} />
                      <span className="text-[13px] text-slate-300 font-medium">
                        {p.name}
                        {p.id === playerId && (
                          <span className="text-[8px] text-red-400 ml-2 uppercase tracking-wider">ti</span>
                        )}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-[0.1em] ${isImp ? 'text-red-400/80' : 'text-slate-600'}`}>
                      {isImp ? 'impostor' : 'crewmate'}
                    </span>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </motion.div>

        {/* Prompts */}
        <motion.div variants={fadeUp} className="space-y-2">
          <p className="text-[9px] text-slate-500 tracking-[0.25em] uppercase mb-1">Pitanja</p>
          <div className="flex gap-2">
            <div className="flex-1 py-2.5 px-3 bg-emerald-500/[0.04] rounded-md">
              <p className="text-emerald-500/60 text-[8px] uppercase tracking-wider mb-0.5">Crew</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">{room.currentPrompt.crew}</p>
            </div>
            <div className="flex-1 py-2.5 px-3 bg-red-500/[0.04] rounded-md">
              <p className="text-red-500/60 text-[8px] uppercase tracking-wider mb-0.5">Imp</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">{room.currentPrompt.impostor}</p>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div variants={fadeUp} className="flex flex-col gap-2 mt-4">
          {isHost ? (
            <Button
              fullWidth
              onClick={() => playAgain(room.code)}
              className="!rounded-2xl !text-white"
              style={{
                background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
                boxShadow: `0 4px 16px ${hexA(ACCENT, 0.4)}`,
              }}
            >
              Nova misija
            </Button>
          ) : (
            <p className="text-[11px] text-slate-500 text-center py-2">Čekamo host-a...</p>
          )}
          <Button variant="ghost" fullWidth onClick={handleLeave} className="!rounded-2xl">
            Napusti sobu
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
