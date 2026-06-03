'use client';

import { motion } from 'framer-motion';
import { AliasRoom } from '@/lib/types/alias';
import { nextRound, finishGame } from '@/lib/firestore/alias';
import { hexA } from '@/lib/utils';

interface Props {
  room: AliasRoom;
  playerId: string;
}

const ACCENT_A = '#0891b2';
const ACCENT_A2 = '#06b6d4';
const ACCENT_B = '#f59e0b';

export function ScoreboardScreen({ room, playerId }: Props) {
  const isHost = room.hostId === playerId;
  const target = room.settings.targetScore;
  const aLeading = room.scores.a >= room.scores.b;
  const gameOver = room.scores.a >= target || room.scores.b >= target;

  const teamAPlayers = room.players.filter((p) => p.teamId === 'a');
  const teamBPlayers = room.players.filter((p) => p.teamId === 'b');

  return (
    <div className="relative flex flex-col items-center justify-center flex-1 px-5 h-screen-safe overflow-y-auto no-scrollbar">
      {/* Ambient orbs */}
      <div className="pointer-events-none fixed rounded-full"
        style={{ width: 300, height: 300, top: '5%', left: '-10%', background: `radial-gradient(circle, ${hexA(ACCENT_A, 0.07)}, transparent 70%)`, filter: 'blur(60px)' }} />
      <div className="pointer-events-none fixed rounded-full"
        style={{ width: 280, height: 280, bottom: '10%', right: '-10%', background: `radial-gradient(circle, ${hexA(ACCENT_B, 0.07)}, transparent 70%)`, filter: 'blur(60px)' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-[400px] flex flex-col items-center gap-6"
      >
        <p className="text-[10px] text-white/30 tracking-[0.25em] uppercase">Rezultat</p>

        {/* Score hero card */}
        <div
          className="w-full rounded-2xl border border-white/10 bg-white/[0.05] p-6"
          style={{ backdropFilter: 'blur(12px)' }}
        >
          <div className="flex items-center justify-center gap-8 mb-6">
            <div className="text-center">
              <motion.p
                key={room.scores.a}
                initial={{ scale: 1.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="text-[56px] font-bold tabular-nums leading-none"
                style={{
                  color: aLeading ? ACCENT_A2 : '#475569',
                  textShadow: aLeading ? `0 0 25px ${hexA(ACCENT_A, 0.5)}` : 'none',
                }}
              >
                {room.scores.a}
              </motion.p>
              <p className="text-[10px] text-white/30 uppercase tracking-wider mt-2">Tim A</p>
            </div>
            <div className="text-[32px] text-white/15 font-light">:</div>
            <div className="text-center">
              <motion.p
                key={room.scores.b}
                initial={{ scale: 1.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="text-[56px] font-bold tabular-nums leading-none"
                style={{
                  color: !aLeading ? ACCENT_B : '#475569',
                  textShadow: !aLeading ? `0 0 25px ${hexA(ACCENT_B, 0.5)}` : 'none',
                }}
              >
                {room.scores.b}
              </motion.p>
              <p className="text-[10px] text-white/30 uppercase tracking-wider mt-2">Tim B</p>
            </div>
          </div>

          {/* Progress bars */}
          <div className="flex flex-col gap-2">
            {[
              { label: 'Tim A', score: room.scores.a, gradient: `linear-gradient(90deg, ${ACCENT_A}, ${ACCENT_A2})`, textColor: hexA(ACCENT_A, 0.8) },
              { label: 'Tim B', score: room.scores.b, gradient: `linear-gradient(90deg, ${ACCENT_B}, #fbbf24)`, textColor: hexA(ACCENT_B, 0.8) },
            ].map(({ label, score, gradient, textColor }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="text-[9px] uppercase tracking-wider w-10" style={{ color: textColor }}>{label}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden bg-white/[0.04]">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: gradient }}
                    animate={{ width: `${Math.min((score / target) * 100, 100)}%` }}
                    transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                  />
                </div>
                <span className="text-[9px] text-white/20 w-6 text-right">{target}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Team rosters */}
        <div
          className="flex w-full rounded-2xl overflow-hidden border border-white/10 bg-white/[0.05]"
          style={{ backdropFilter: 'blur(12px)' }}
        >
          <div className="flex-1 p-4">
            <p className="text-[9px] tracking-[0.2em] uppercase mb-3" style={{ color: hexA(ACCENT_A, 0.7) }}>Tim A</p>
            {teamAPlayers.map((p) => (
              <p key={p.id} className="text-[11px] text-white/60 py-0.5">
                {p.name}{p.id === playerId && <span className="text-[8px] text-white/30 ml-1">ti</span>}
              </p>
            ))}
          </div>
          <div className="w-px bg-white/[0.05]" />
          <div className="flex-1 p-4">
            <p className="text-[9px] tracking-[0.2em] uppercase mb-3" style={{ color: hexA(ACCENT_B, 0.7) }}>Tim B</p>
            {teamBPlayers.map((p) => (
              <p key={p.id} className="text-[11px] text-white/60 py-0.5">
                {p.name}{p.id === playerId && <span className="text-[8px] text-white/30 ml-1">ti</span>}
              </p>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col gap-2">
          {isHost ? (
            <>
              <button
                onClick={() => nextRound(room.code)}
                className="w-full py-3.5 rounded-2xl text-[13px] font-semibold text-white transition-all duration-200 active:scale-95 cursor-pointer"
                style={{
                  background: `linear-gradient(135deg, ${ACCENT_A}, ${ACCENT_A2})`,
                  border: `1px solid ${hexA(ACCENT_A, 0.5)}`,
                  boxShadow: `0 4px 20px ${hexA(ACCENT_A, 0.3)}`,
                }}
              >
                {gameOver ? 'Završi igru' : 'Sljedeća runda'}
              </button>
              <button
                onClick={() => finishGame(room.code)}
                className="w-full py-3 rounded-2xl text-[13px] font-medium transition-all duration-200 active:scale-95 cursor-pointer text-white/30 hover:text-white/60"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                Završi partiju
              </button>
            </>
          ) : (
            <p className="text-[11px] text-white/30 text-center py-2">Čekamo host-a...</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
