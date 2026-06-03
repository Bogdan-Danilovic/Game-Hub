'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AvalonRoom, TeamVote } from '@/lib/types/avalon';
import { castTeamVote, resolveTeamVote } from '@/lib/firestore/avalon';
import { Button } from '@/components/ui/Button';
import { hexA } from '@/lib/utils';

interface Props {
  room: AvalonRoom;
  playerId: string;
}

const ACCENT = '#7c3aed';
const ACCENT2 = '#8b5cf6';

export function MissionVoteScreen({ room, playerId }: Props) {
  const [voting, setVoting] = useState(false);

  const myVote = room.teamVotes[playerId] as TeamVote | undefined;
  const hasVoted = !!myVote;
  const connectedPlayers = room.players.filter((p) => p.isConnected);
  const totalExpected = connectedPlayers.length;
  const totalVoted = Object.keys(room.teamVotes).length;
  const allVoted = totalVoted >= totalExpected;
  const isHost = room.hostId === playerId;

  const proposedNames = room.proposedTeam
    .map((id) => room.players.find((p) => p.id === id)?.name)
    .filter(Boolean);

  const leader = room.players.find((p) => p.isLeader);

  useEffect(() => {
    if (allVoted && isHost) {
      resolveTeamVote(room.code);
    }
  }, [allVoted, isHost, room.code]);

  async function handleVote(vote: TeamVote) {
    if (hasVoted || voting) return;
    setVoting(true);
    await castTeamVote(room.code, playerId, vote);
    setVoting(false);
  }

  return (
    <div className="relative flex flex-col items-center justify-center flex-1 px-5 h-screen-safe overflow-hidden">
      <div className="relative w-full max-w-[360px] flex flex-col items-center gap-8">

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <p className="text-[10px] text-white/30 tracking-[0.2em] uppercase mb-2">
            Misija {room.currentMission} · Glasanje za tim
          </p>
          <p className="text-[13px] text-white/50">{leader?.name} predlaže:</p>
        </motion.div>

        {/* Proposed team */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full rounded-2xl border border-white/10 bg-white/[0.05] p-5"
          style={{ backdropFilter: 'blur(12px)' }}
        >
          <div className="flex flex-wrap justify-center gap-3">
            {proposedNames.map((name) => (
              <span
                key={name}
                className="px-4 py-2 rounded-xl text-[13px] font-medium"
                style={{ background: hexA(ACCENT, 0.15), border: `1px solid ${hexA(ACCENT, 0.35)}`, color: ACCENT2 }}
              >
                {name}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Vote buttons */}
        {!hasVoted ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="w-full flex gap-4"
          >
            <Button fullWidth disabled={voting} onClick={() => handleVote('approve')} className="!bg-blue-600/80 hover:!bg-blue-500 !rounded-2xl">
              ✓ Odobri
            </Button>
            <Button fullWidth disabled={voting} onClick={() => handleVote('reject')} className="!bg-red-600/60 hover:!bg-red-500/70 !rounded-2xl">
              ✗ Odbij
            </Button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <p className="text-[14px] text-white/50">
              Glasao si:{' '}
              <span className={myVote === 'approve' ? 'text-blue-400 font-bold' : 'text-red-400 font-bold'}>
                {myVote === 'approve' ? 'Odobri' : 'Odbij'}
              </span>
            </p>
          </motion.div>
        )}

        {/* Vote progress */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-white/30 tracking-[0.2em] uppercase">Glasovi</p>
            <p className="text-[12px] text-white/40">{totalVoted}/{totalExpected}</p>
          </div>
          <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT2})` }}
              animate={{ width: `${(totalVoted / totalExpected) * 100}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            />
          </div>
        </motion.div>

        {/* Player vote status */}
        <div className="w-full flex flex-wrap justify-center gap-2">
          {connectedPlayers.map((p) => {
            const voted = p.id in room.teamVotes;
            return (
              <motion.div
                key={p.id}
                animate={voted ? { scale: [1, 1.1, 1] } : { opacity: [0.4, 0.7, 0.4] }}
                transition={voted ? { duration: 0.3 } : { repeat: Infinity, duration: 2 }}
                className="px-3 py-1.5 rounded-xl text-[11px]"
                style={{
                  background: voted ? hexA(ACCENT, 0.15) : 'rgba(255,255,255,0.02)',
                  color: voted ? ACCENT2 : '#475569',
                }}
              >
                {p.name}{p.id === playerId ? ' (ti)' : ''}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
