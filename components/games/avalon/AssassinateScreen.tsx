'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AvalonRoom } from '@/lib/types/avalon';
import { castAssassinVote, resolveAssassination } from '@/lib/firestore/avalon';
import { Button } from '@/components/ui/Button';

interface Props {
  room: AvalonRoom;
  playerId: string;
}

export function AssassinateScreen({ room, playerId }: Props) {
  const [submitting, setSubmitting] = useState(false);

  const assassin = room.players.find((p) => p.role === 'assassin');
  const isAssassin = assassin?.id === playerId;
  const isEvil = room.players.find((p) => p.id === playerId)?.loyalty === 'evil';

  const goodPlayers = room.players.filter((p) => p.loyalty === 'good' && p.isConnected);

  async function handleSelect(targetId: string) {
    if (!isAssassin) return;
    await castAssassinVote(room.code, targetId);
  }

  async function handleConfirm() {
    if (!room.assassinTarget || submitting) return;
    setSubmitting(true);
    await resolveAssassination(room.code);
  }

  const targetName = room.assassinTarget
    ? room.players.find((p) => p.id === room.assassinTarget)?.name
    : null;

  return (
    <div className="relative flex flex-col items-center justify-center flex-1 px-8 h-screen-safe overflow-hidden">
      <motion.div
        className="fixed inset-0 pointer-events-none"
        animate={{
          background: 'radial-gradient(ellipse 300px 300px at center, rgba(239,68,68,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-[320px] flex flex-col items-center gap-8">

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <p className="text-[10px] text-slate-500 tracking-[0.2em] uppercase mb-2">
            Dobro je osvojilo 3 misije, ali...
          </p>
          <h2 className="text-[28px] font-bold text-red-400" style={{ textShadow: '0 0 20px rgba(239,68,68,0.3)' }}>
            Asasin bira!
          </h2>
          <p className="text-[13px] text-slate-500 mt-2">
            {isAssassin
              ? 'Izaberi ko je Merlin. Pogodi i Zlo pobjeđuje!'
              : isEvil
                ? `${assassin?.name} bira ko je Merlin...`
                : 'Asasin pokušava da otkrije Merlina...'}
          </p>
        </motion.div>

        {isAssassin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full flex flex-col gap-2"
          >
            <p className="text-[10px] text-slate-500 tracking-[0.2em] uppercase mb-1">
              Ko je Merlin?
            </p>
            {goodPlayers.map((p) => {
              const isSelected = room.assassinTarget === p.id;
              return (
                <motion.button
                  key={p.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSelect(p.id)}
                  className={`flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-200 ${
                    isSelected
                      ? 'bg-red-600/20 border border-red-500/40'
                      : 'bg-white/[0.02] border border-transparent hover:bg-white/[0.04]'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isSelected ? 'border-red-400 bg-red-500/30' : 'border-slate-600'
                  }`}>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2.5 h-2.5 rounded-full bg-red-400"
                      />
                    )}
                  </div>
                  <span className={`text-[14px] font-medium ${isSelected ? 'text-red-300' : 'text-slate-300'}`}>
                    {p.name}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        )}

        {!isAssassin && (
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="flex flex-col items-center gap-3 py-8"
          >
            <span className="text-4xl">🗡️</span>
            <p className="text-[12px] text-slate-600">
              {room.assassinTarget
                ? `${assassin?.name} je izabrao ${targetName}...`
                : `${assassin?.name} razmišlja...`}
            </p>
          </motion.div>
        )}

        {isAssassin && room.assassinTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full"
          >
            <Button
              fullWidth
              disabled={submitting}
              onClick={handleConfirm}
              className="!bg-red-600 hover:!bg-red-500"
            >
              {submitting ? 'Otkrivam...' : `Ubij ${targetName}!`}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
