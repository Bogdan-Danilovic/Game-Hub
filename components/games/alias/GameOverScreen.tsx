'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { AliasRoom } from '@/lib/types/alias';
import { playAgain, leaveRoom } from '@/lib/firestore/alias';
import { useAuth } from '@/hooks/useAuth';
import { recordGameResult } from '@/lib/firestore/players';
import { hexA } from '@/lib/utils';
import { Button } from '@/components/shared/Button';

interface Props {
  room: AliasRoom;
  playerId: string;
}

const ACCENT_A = '#0891b2';
const ACCENT_A2 = '#06b6d4';
const ACCENT_B = '#f59e0b';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

function Confetti() {
  const [particles] = useState(() =>
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
      color: [ACCENT_A, ACCENT_A2, ACCENT_B, '#8b5cf6', '#10b981'][Math.floor(Math.random() * 5)],
      size: 4 + Math.random() * 6,
      rotate: 360 + Math.random() * 360,
      borderRadius: Math.random() > 0.5 ? '50%' : '2px',
    }))
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
          animate={{ y: '110vh', opacity: 0, rotate: p.rotate }}
          transition={{ delay: p.delay, duration: p.duration, ease: 'linear', repeat: Infinity }}
          style={{ position: 'absolute', width: p.size, height: p.size, backgroundColor: p.color, borderRadius: p.borderRadius }}
        />
      ))}
    </div>
  );
}

export function GameOverScreen({ room, playerId }: Props) {
  const router = useRouter();
  const isHost = room.hostId === playerId;

  const winner = room.scores.a >= room.settings.targetScore ? 'a' :
                 room.scores.b >= room.settings.targetScore ? 'b' : null;
  const isDraw = room.scores.a === room.scores.b;
  const aborted = !winner && !isDraw;

  const playerTeam = room.players.find((p) => p.id === playerId)?.teamId;
  const isWinner = winner !== null && playerTeam === winner;

  const { user } = useAuth();
  const hasSaved = useRef(false);
  useEffect(() => {
    if (!user || hasSaved.current || winner === null) return;
    hasSaved.current = true;
    recordGameResult({
      playerId: user.uid,
      gameType: 'alias',
      gameName: 'alias',
      won: isWinner,
      isHost: room.hostId === playerId,
      roomCode: room.code,
      gameKey: `${room.code}_${room.createdAt}`,
      playerNames: room.players.map((p) => p.name),
    }).catch((e) => console.error('[stats] alias', e));
  }, [user, winner, isWinner]);

  const winnerAccent = winner === 'a' ? ACCENT_A : winner === 'b' ? ACCENT_B : null;
  const winnerAccent2 = winner === 'a' ? ACCENT_A2 : winner === 'b' ? ACCENT_B : null;
  const winnerLabel = winner === 'a' ? 'Tim A pobjeđuje!' : winner === 'b' ? 'Tim B pobjeđuje!' : null;

  async function handleLeave() {
    await leaveRoom(room.code, playerId);
    localStorage.removeItem('playerId');
    router.push('/');
  }

  return (
    <div className="relative flex flex-1 flex-col items-center overflow-y-auto no-scrollbar px-5 pb-12 pt-20">
      {winner && <Confetti />}
      <motion.div
        className="pointer-events-none fixed inset-0"
        animate={{
          background: winnerAccent
            ? `radial-gradient(ellipse at center, ${hexA(winnerAccent, 0.10)} 0%, transparent 70%)`
            : 'none',
        }}
      />

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="relative my-auto flex w-full max-w-[400px] flex-col items-center gap-8"
      >
        {/* Winner hero */}
        <motion.div
          variants={fadeUp}
          className="w-full rounded-3xl p-6 text-center"
          style={{
            background: winnerAccent
              ? `linear-gradient(160deg, ${hexA(winnerAccent, 0.28)} 0%, rgba(0,0,0,0.85) 100%)`
              : 'rgba(255,255,255,0.04)',
            border: `1px solid ${winnerAccent ? hexA(winnerAccent, 0.25) : 'rgba(255,255,255,0.10)'}`,
            boxShadow: winnerAccent ? `0 20px 60px ${hexA(winnerAccent, 0.25)}` : 'none',
          }}
        >
          <span className="mb-3 block text-6xl">
            {aborted ? '🚫' : isDraw ? '🤝' : '🏆'}
          </span>
          <h2
            className="text-[34px] font-extrabold tracking-[-0.5px]"
            style={{
              color: winnerAccent ?? '#f1f5f9',
              textShadow: winnerAccent ? `0 0 30px ${hexA(winnerAccent, 0.45)}` : 'none',
            }}
          >
            {aborted ? 'Igra prekinuta' : isDraw ? 'Neriješeno!' : winnerLabel}
          </h2>
          {aborted && <p className="mt-1 text-[13px] text-white/50">Premalo igrača za nastavak</p>}
          {isWinner && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-2 text-[13px] text-emerald-400"
            >
              Čestitamo, bio/la si u pobjedničkom timu!
            </motion.p>
          )}
        </motion.div>

        {/* Final scores */}
        <motion.div
          variants={fadeUp}
          className="flex w-full items-center justify-center gap-8 rounded-2xl border border-white/10 bg-white/[0.05] p-6"
        >
          <div className="text-center">
            <p
              className="text-[52px] font-bold tabular-nums leading-none"
              style={{
                color: winner === 'a' ? ACCENT_A2 : '#475569',
                textShadow: winner === 'a' ? `0 0 25px ${hexA(ACCENT_A, 0.5)}` : 'none',
              }}
            >
              {room.scores.a}
            </p>
            <p className="mt-2 text-[10px] uppercase tracking-wider text-white/40">Tim A</p>
          </div>
          <div className="text-[28px] font-light text-white/20">:</div>
          <div className="text-center">
            <p
              className="text-[52px] font-bold tabular-nums leading-none"
              style={{
                color: winner === 'b' ? ACCENT_B : '#475569',
                textShadow: winner === 'b' ? `0 0 25px ${hexA(ACCENT_B, 0.5)}` : 'none',
              }}
            >
              {room.scores.b}
            </p>
            <p className="mt-2 text-[10px] uppercase tracking-wider text-white/40">Tim B</p>
          </div>
        </motion.div>

        {/* Stats HUD chips */}
        <motion.div variants={fadeUp} className="flex w-full gap-2">
          {[
            { v: room.round, l: room.round === 1 ? 'runda' : 'rundi' },
            { v: room.players.length, l: 'igrača' },
            { v: room.scores.a + room.scores.b, l: 'ukupno poena' },
          ].map((s, i) => (
            <div
              key={i}
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.05] py-3 text-center"
            >
              <p className="text-[16px] font-bold tabular-nums text-white">{s.v}</p>
              <p className="mt-0.5 text-[8px] uppercase tracking-[0.15em] text-white/40">{s.l}</p>
            </div>
          ))}
        </motion.div>

        {/* Actions */}
        <motion.div variants={fadeUp} className="flex w-full flex-col gap-3 pt-2">
          {isHost ? (
            <Button
              fullWidth
              onClick={() => playAgain(room.code)}
              className="!rounded-2xl !text-white"
              style={{
                background: `linear-gradient(135deg, ${ACCENT_A}, ${ACCENT_A2})`,
                boxShadow: `0 4px 16px ${hexA(ACCENT_A, 0.4)}`,
              }}
            >
              Nova igra
            </Button>
          ) : (
            <p className="py-2 text-center text-[11px] text-white/30">Čekamo host-a...</p>
          )}
          <Button variant="ghost" fullWidth onClick={handleLeave} className="!text-white/40 hover:!text-white/70">
            Napusti sobu
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
