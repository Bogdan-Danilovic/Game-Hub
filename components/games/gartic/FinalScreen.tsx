'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { GarticRoom } from '@/lib/types/gartic';
import { playAgain } from '@/lib/firestore/gartic';
import { Button } from '@/components/ui/Button';
import { hexA } from '@/lib/utils';

const ACCENT = '#ec4899';

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

interface Props { room: GarticRoom; playerId: string; }

export function FinalScreen({ room, playerId }: Props) {
  const router = useRouter();
  const [restarting, setRestarting] = useState(false);
  const isHost = room.hostId === playerId;

  const playerIds = room.players.map((p) => p.id);

  function getMutationDistance(bookId: string): number {
    const book = room.books[bookId];
    if (!book || book.entries.length < 2) return 0;
    const first = book.entries.find((e) => e.step === 0);
    const last = book.entries[book.entries.length - 1];
    if (!first || !last || first.type !== 'text' || last.type !== 'text') return 0;
    const a = first.text?.toLowerCase() ?? '';
    const b = last.text?.toLowerCase() ?? '';
    let diff = 0;
    const words1 = a.split(' ');
    const words2 = b.split(' ');
    const maxLen = Math.max(words1.length, words2.length);
    words1.forEach((w, i) => { if (w !== words2[i]) diff++; });
    diff += Math.abs(words1.length - words2.length);
    return maxLen > 0 ? diff / maxLen : 0;
  }

  const booksByMutation = [...playerIds]
    .map((id) => ({ id, dist: getMutationDistance(id) }))
    .sort((a, b) => b.dist - a.dist);

  const mostMutated = booksByMutation[0];
  const mostMutatedOwner = room.players.find((p) => p.id === mostMutated?.id)?.name ?? '';

  async function handlePlayAgain() {
    setRestarting(true);
    await playAgain(room.code);
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto no-scrollbar">
      <div className="mx-auto flex w-full max-w-[400px] flex-col gap-6 px-5 pb-14 pt-14">

        <motion.div {...fadeIn(0.05)} className="rounded-3xl p-6 text-center"
          style={{
            background: `linear-gradient(160deg, ${hexA(ACCENT, 0.28)} 0%, rgba(0,0,0,0.85) 100%)`,
            border: `1px solid ${hexA(ACCENT, 0.25)}`,
            boxShadow: `0 20px 60px ${hexA(ACCENT, 0.25)}`,
          }}>
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
            className="text-[64px] mb-3">📞</motion.div>
          <h1 className="text-[26px] font-extrabold tracking-[-0.5px] text-white">Igra gotova!</h1>
          <p className="mt-1 text-sm text-white/50">Svaka poruka je prošla kroz {room.totalSteps} koraka</p>
        </motion.div>

        {mostMutated && (
          <motion.div {...fadeIn(0.2)} className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-pink-200/50">
              Najhaotičnija knjiga 🏆
            </p>
            <p className="text-lg font-extrabold text-white">Knjiga od: <span style={{ color: ACCENT }}>{mostMutatedOwner}</span></p>
            <div className="mt-3 flex flex-col gap-2">
              {room.books[mostMutated.id]?.entries
                .filter((e) => e.type === 'text')
                .slice(0, 2)
                .map((e, i) => (
                  <div key={i} className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-white/25 mb-1">
                      {i === 0 ? 'Original' : 'Na kraju'}
                    </p>
                    <p className="text-[13px] text-white/80 italic">&ldquo;{e.text}&rdquo;</p>
                  </div>
                ))}
            </div>
          </motion.div>
        )}

        <motion.div {...fadeIn(0.3)} className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-pink-200/50">Sve knjige</p>
          <div className="flex flex-col gap-1.5">
            {playerIds.map((pid, i) => {
              const owner = room.players.find((p) => p.id === pid)?.name ?? 'Igrač';
              const entries = room.books[pid]?.entries.length ?? 0;
              const isSelf = pid === playerId;
              return (
                <div key={pid} className="flex items-center gap-3 rounded-xl px-4 py-2.5"
                  style={{ background: isSelf ? hexA(ACCENT, 0.07) : 'rgba(255,255,255,0.02)', border: `1px solid ${isSelf ? hexA(ACCENT, 0.18) : 'rgba(255,255,255,0.05)'}` }}>
                  <span className="text-[18px]">{['📕','📗','📘','📙','📒','📓','📔','📃'][i % 8]}</span>
                  <span className="flex-1 text-[13px] font-medium text-white/70">{owner}{isSelf && <span className="ml-1.5 text-[11px]" style={{ color: hexA(ACCENT, 0.8) }}>(ti)</span>}</span>
                  <span className="text-[11px] text-white/30">{entries} unosa</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div {...fadeIn(0.45)} className="flex flex-col gap-3">
          {isHost && (
            <Button fullWidth disabled={restarting} onClick={handlePlayAgain}
              className="!rounded-2xl !text-white"
              style={{ background: `linear-gradient(135deg, ${ACCENT}, ${hexA(ACCENT, 0.8)})`, boxShadow: `0 4px 16px ${hexA(ACCENT, 0.4)}` }}>
              {restarting ? 'Restart...' : 'Igraj ponovo'}
            </Button>
          )}
          {!isHost && <p className="py-2 text-center text-[12px] text-white/30">Čekamo host...</p>}
          <Button variant="ghost" fullWidth onClick={() => router.push('/')}
            className="!text-pink-100/40 hover:!text-pink-100/70">
            Nazad na Hub
          </Button>
        </motion.div>

      </div>
    </div>
  );
}
