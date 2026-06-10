'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { GarticRoom } from '@/lib/types/gartic';
import { setRevealBook, advanceRevealEntry, finishReveal } from '@/lib/firestore/gartic';
import { hexA } from '@/lib/utils';
import { StaticCanvas } from './StaticCanvas';

const ACCENT = '#ec4899';

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

interface Props { room: GarticRoom; playerId: string; }

export function RevealScreen({ room, playerId }: Props) {
  const isHost = room.hostId === playerId;
  const playerIds = room.players.map((p) => p.id);
  const { revealBookIndex, revealEntryIndex } = room;

  if (revealBookIndex === -1) {
    return <BookGrid room={room} playerIds={playerIds} isHost={isHost} />;
  }

  const bookOwnerId = playerIds[revealBookIndex];
  const book = room.books[bookOwnerId];
  const ownerName = room.players.find((p) => p.id === bookOwnerId)?.name ?? 'Igrač';

  if (!book) return null;

  const shownEntries = book.entries
    .slice()
    .sort((a, b) => a.step - b.step)
    .slice(0, revealEntryIndex);

  const allShown = revealEntryIndex >= book.entries.length;
  const isLastBook = revealBookIndex >= playerIds.length - 1;

  async function nextEntry() {
    if (allShown) {
      if (isLastBook) { await finishReveal(room.code); }
      else { await setRevealBook(room.code, revealBookIndex + 1); }
    } else {
      await advanceRevealEntry(room.code);
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto no-scrollbar">
      <div className="mx-auto flex w-full max-w-[400px] flex-col gap-5 px-5 pb-14 pt-14">

        <motion.div {...fadeIn(0)} className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-pink-200/50">
            Knjiga {revealBookIndex + 1}/{playerIds.length}
          </p>
          <h2 className="mt-1 text-[24px] font-extrabold tracking-[-0.4px] text-white">
            Knjiga od: <span style={{ color: ACCENT }}>{ownerName}</span>
          </h2>
        </motion.div>

        <AnimatePresence mode="popLayout">
          {shownEntries.map((entry, i) => {
            const author = room.players.find((p) => p.id === entry.authorId)?.name ?? 'Igrač';
            return (
              <motion.div key={`${entry.step}-${entry.type}`}
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 280, damping: 22, delay: 0.05 }}
                className="rounded-2xl overflow-hidden"
                style={{
                  border: `1px solid ${i === shownEntries.length - 1 ? hexA(ACCENT, 0.3) : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: i === shownEntries.length - 1 ? `0 8px 32px ${hexA(ACCENT, 0.15)}` : undefined,
                }}>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] border-b border-white/[0.06]">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/30">
                    {entry.type === 'text' ? '✏️ Tekst' : '🎨 Crtež'}
                  </span>
                  <span className="ml-auto text-[11px] text-white/25">{author}</span>
                </div>
                {entry.type === 'text' ? (
                  <div className="px-5 py-4">
                    <p className="text-[16px] font-semibold text-white leading-relaxed">{entry.text}</p>
                  </div>
                ) : (
                  <div className="h-[200px] bg-white">
                    <StaticCanvas strokes={entry.strokes ?? []} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isHost && (
          <motion.button
            key={revealEntryIndex}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            type="button" onClick={nextEntry}
            className="w-full rounded-2xl py-4 text-[15px] font-extrabold text-white transition-opacity"
            style={{
              background: `linear-gradient(135deg, ${ACCENT}, ${hexA(ACCENT, 0.8)})`,
              boxShadow: `0 4px 16px ${hexA(ACCENT, 0.4)}`,
            }}>
            {allShown
              ? isLastBook ? 'Završi reveal →' : 'Sljedeća knjiga →'
              : 'Sljedeći unos →'}
          </motion.button>
        )}

        {!isHost && (
          <p className="text-center text-[12px] text-white/30 py-2">Čekamo host...</p>
        )}

      </div>
    </div>
  );
}

function BookGrid({ room, playerIds, isHost }: { room: GarticRoom; playerIds: string[]; isHost: boolean }) {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto no-scrollbar">
      <div className="mx-auto flex w-full max-w-[400px] flex-col gap-5 px-5 pb-14 pt-14">

        <motion.div {...fadeIn(0)}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-pink-200/50">Reveal</p>
          <h2 className="mt-1 text-[26px] font-extrabold tracking-[-0.5px] text-white">Otkrivanje knjiga</h2>
          <p className="mt-1 text-sm text-white/40">Svaka knjiga je jedna priča koja je mutirala...</p>
        </motion.div>

        <div className="grid grid-cols-2 gap-3">
          {playerIds.map((pid, i) => {
            const book = room.books[pid];
            const owner = room.players.find((p) => p.id === pid)?.name ?? 'Igrač';
            const thumb = book?.entries.find((e) => e.type === 'drawing')?.thumbnailDataUrl;

            return (
              <motion.button
                key={pid}
                {...fadeIn(0.05 + i * 0.06)}
                type="button"
                disabled={!isHost}
                onClick={() => setRevealBook(room.code, i)}
                className="rounded-2xl overflow-hidden text-left transition-transform"
                style={{ border: `1px solid ${hexA(ACCENT, 0.2)}` }}
                whileHover={isHost ? { scale: 1.03, boxShadow: `0 8px 24px ${hexA(ACCENT, 0.25)}` } : {}}
                whileTap={isHost ? { scale: 0.97 } : {}}>
                <div className="h-[90px] bg-white flex items-center justify-center overflow-hidden">
                  {thumb
                    // eslint-disable-next-line @next/next/no-img-element -- thumb je canvas data-URL; next/image ga ne optimizuje
                    ? <img src={thumb} alt="thumbnail" className="w-full h-full object-cover" />
                    : <span className="text-[32px]">📞</span>
                  }
                </div>
                <div className="px-3 py-2.5" style={{ background: hexA(ACCENT, 0.08) }}>
                  <p className="text-[12px] font-bold text-white truncate">{owner}</p>
                  <p className="text-[11px] text-white/35">{book?.entries.length ?? 0} unosa</p>
                </div>
              </motion.button>
            );
          })}
        </div>

        {isHost && (
          <p className="text-center text-[12px] text-white/40 py-1">
            Klikni na knjigu da počneš reveal
          </p>
        )}
        {!isHost && (
          <p className="text-center text-[12px] text-white/30 py-1">Čekamo host da otvori prvu knjigu...</p>
        )}

      </div>
    </div>
  );
}
