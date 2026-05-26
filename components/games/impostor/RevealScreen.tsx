'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ImpostorRoom } from '@/lib/types/impostor';
import { nextRound, finishGame } from '@/lib/firestore/impostor';
import { Button } from '@/components/ui/Button';

interface Props {
  room: ImpostorRoom;
  playerId: string;
}

export function RevealScreen({ room, playerId }: Props) {
  const isHost = room.hostId === playerId;
  const eliminated = room.players.find((p) => p.id === room.eliminatedId);
  const wasImpostor = room.eliminatedId ? room.impostorIds.includes(room.eliminatedId) : false;
  const isSingleImpostor = room.impostorIds.length === 1;
  const gameOver = room.winner !== null;

  const showRole = useMemo(() => {
    if (!room.eliminatedId) return false;
    if (isSingleImpostor) return true;
    return room.settings.revealOnVote;
  }, [room.eliminatedId, isSingleImpostor, room.settings.revealOnVote]);

  return (
    <div className="relative flex flex-col items-center justify-center flex-1 px-8 h-screen-safe overflow-hidden">
      {/* Ambient pulse */}
      <motion.div
        className="fixed inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          background: wasImpostor
            ? 'radial-gradient(ellipse at center, rgba(239,68,68,0.05) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at center, rgba(139,92,246,0.04) 0%, transparent 70%)',
        }}
        transition={{ delay: 1, duration: 1.5 }}
      />

      <div className="relative w-full max-w-[320px] flex flex-col items-center gap-8">
        {room.eliminatedId && eliminated ? (
          <>
            {/* Dossier — opens from center */}
            <motion.div
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="w-full origin-center"
            >
              <div className="w-full bg-surface/40 rounded-lg p-6 relative overflow-hidden">
                {/* Top line accent */}
                <motion.div
                  className={`absolute top-0 left-0 right-0 h-[2px] ${wasImpostor ? 'bg-red-500/60' : 'bg-violet-500/40'}`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.4 }}
                />

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <p className="text-[9px] text-slate-500 tracking-[0.25em] uppercase mb-4">
                    Dosije agenta
                  </p>

                  <p className="text-[28px] font-bold text-white tracking-[-0.02em] mb-1">
                    {eliminated.name}
                  </p>

                  <p className="text-[10px] text-slate-500 tracking-[0.15em] uppercase mb-6">
                    Eliminisan u rundi {room.round}
                  </p>
                </motion.div>

                {/* Role reveal — stamped */}
                {showRole && (
                  <motion.div
                    initial={{ scale: 2, opacity: 0, rotate: -15 }}
                    animate={{ scale: 1, opacity: 1, rotate: -3 }}
                    transition={{ delay: 1.5, type: 'spring' as const, stiffness: 300, damping: 20 }}
                    className={`
                      inline-block px-4 py-2 rounded-sm text-[14px] font-black uppercase tracking-[0.15em] border-2
                      ${wasImpostor
                        ? 'text-red-400 border-red-500/40 bg-red-500/5'
                        : 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5'
                      }
                    `}
                  >
                    {wasImpostor ? '⛔ IMPOSTOR' : '✓ CREWMATE'}
                  </motion.div>
                )}

                {!showRole && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="text-[12px] text-slate-500 italic"
                  >
                    Klasifikovano — uloga ostaje tajna
                  </motion.p>
                )}
              </div>
            </motion.div>

            {/* Prompts */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2 }}
              className="w-full space-y-2"
            >
              <p className="text-[9px] text-slate-500 tracking-[0.2em] uppercase mb-1">Pitanja</p>
              <div className="flex gap-2 text-[11px]">
                <div className="flex-1 py-2 px-3 bg-violet-500/[0.04] rounded-md">
                  <p className="text-violet-400/50 text-[8px] uppercase tracking-wider mb-0.5">Crew</p>
                  <p className="text-slate-400">{room.currentPrompt.crew}</p>
                </div>
                <div className="flex-1 py-2 px-3 bg-red-500/[0.04] rounded-md">
                  <p className="text-red-400/50 text-[8px] uppercase tracking-wider mb-0.5">Imp</p>
                  <p className="text-slate-400">{room.currentPrompt.impostor}</p>
                </div>
              </div>
            </motion.div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <p className="text-3xl mb-4">—</p>
            <p className="text-[16px] font-bold text-slate-300 tracking-[-0.01em]">Nema eliminacije</p>
            <p className="text-[12px] text-slate-500 mt-1">Glasovi izjednačeni</p>
          </motion.div>
        )}

        {/* Game over */}
        {gameOver && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.3 }}
            className={`w-full text-center py-5 rounded-lg ${
              room.winner === 'crew' ? 'bg-emerald-500/[0.06]' : 'bg-red-500/[0.06]'
            }`}
          >
            <p className="text-[18px] font-bold tracking-[-0.02em]">
              {room.winner === 'crew' ? 'Crewmate tim pobeđuje' : 'Impostor pobeđuje'}
            </p>
          </motion.div>
        )}

        {/* Controls */}
        {isHost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: gameOver ? 2.8 : 2.4 }}
            className="w-full"
          >
            {gameOver ? (
              <Button fullWidth onClick={() => finishGame(room.code)}>Prikaži rezultate</Button>
            ) : (
              <Button fullWidth onClick={() => nextRound(room.code)}>Sledeća runda</Button>
            )}
          </motion.div>
        )}

        {!isHost && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 2.2 }}
            className="text-[10px] text-slate-500"
          >
            Čekamo host-a...
          </motion.p>
        )}
      </div>
    </div>
  );
}
