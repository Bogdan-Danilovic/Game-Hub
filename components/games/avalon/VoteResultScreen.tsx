'use client';

import { motion } from 'framer-motion';
import { AvalonRoom } from '@/lib/types/avalon';
import { advanceFromVoteResult } from '@/lib/firestore/avalon';
import { Button } from '@/components/ui/Button';
import { hexA } from '@/lib/utils';

interface Props {
  room: AvalonRoom;
  playerId: string;
}

const ACCENT = '#7c3aed';
const ACCENT2 = '#8b5cf6';

export function VoteResultScreen({ room, playerId }: Props) {
  const isHost = room.hostId === playerId;
  const connectedPlayers = room.players.filter((p) => p.isConnected);
  const votes = room.teamVotes;
  const approves = Object.values(votes).filter((v) => v === 'approve').length;
  const rejects = Object.values(votes).filter((v) => v === 'reject').length;
  const approved = approves > connectedPlayers.length / 2;

  return (
    <div className="relative flex flex-col items-center justify-center flex-1 px-5 h-screen-safe overflow-hidden">
      <div className="relative w-full max-w-[360px] flex flex-col items-center gap-8">

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <p className="text-[10px] text-white/30 tracking-[0.2em] uppercase mb-4">Rezultat glasanja</p>
          <motion.h2
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className={`text-[36px] font-bold ${approved ? 'text-blue-400' : 'text-red-400'}`}
            style={{ textShadow: `0 0 20px ${approved ? 'rgba(59,130,246,0.4)' : 'rgba(239,68,68,0.4)'}` }}
          >
            {approved ? 'Odobreno!' : 'Odbijeno!'}
          </motion.h2>
        </motion.div>

        {/* Vote count */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-8 rounded-2xl border border-white/10 bg-white/[0.05] px-8 py-4"
        >
          <div className="text-center">
            <p className="text-[32px] font-bold text-blue-400">{approves}</p>
            <p className="text-[10px] text-white/30 uppercase tracking-wider">Odobri</p>
          </div>
          <div className="w-px h-10 bg-white/[0.06]" />
          <div className="text-center">
            <p className="text-[32px] font-bold text-red-400">{rejects}</p>
            <p className="text-[10px] text-white/30 uppercase tracking-wider">Odbij</p>
          </div>
        </motion.div>

        {/* Vote reveal rows */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full rounded-2xl border border-white/10 bg-white/[0.05] overflow-hidden"
        >
          {connectedPlayers.map((p, i) => {
            const vote = votes[p.id];
            const isApprove = vote === 'approve';
            return (
              <motion.div
                key={p.id}
                initial={{ rotateX: 90, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.1, type: 'spring', stiffness: 200 }}
                className="flex items-center justify-between py-2.5 px-4"
                style={{
                  background: isApprove ? 'rgba(59,130,246,0.06)' : 'rgba(239,68,68,0.06)',
                  borderBottom: i < connectedPlayers.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                }}
              >
                <span className="text-[13px] text-white/70">
                  {p.name}{p.id === playerId ? ' (ti)' : ''}
                </span>
                <span className={`text-[12px] font-bold ${isApprove ? 'text-blue-400' : 'text-red-400'}`}>
                  {isApprove ? '✓ Odobri' : '✗ Odbij'}
                </span>
              </motion.div>
            );
          })}
        </motion.div>

        {!approved && room.consecutiveRejects > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-[11px] text-red-400/60"
          >
            Uzastopna odbijanja: {room.consecutiveRejects}/5
          </motion.p>
        )}

        {isHost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="w-full"
          >
            <Button
              fullWidth
              onClick={() => advanceFromVoteResult(room.code)}
              className="!rounded-2xl !text-white"
              style={{
                background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})`,
                boxShadow: `0 4px 16px ${hexA(ACCENT, 0.4)}`,
              }}
            >
              {approved ? 'Kreni na misiju →' : 'Sljedeći lider →'}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
