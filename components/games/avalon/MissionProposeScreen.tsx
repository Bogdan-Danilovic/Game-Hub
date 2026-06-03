'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AvalonRoom, getMissionTeamSize } from '@/lib/types/avalon';
import { proposeTeam } from '@/lib/firestore/avalon';
import { Button } from '@/components/ui/Button';
import { hexA } from '@/lib/utils';

interface Props {
  room: AvalonRoom;
  playerId: string;
}

const ACCENT = '#7c3aed';
const ACCENT2 = '#8b5cf6';

export function MissionProposeScreen({ room, playerId }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const leader = room.players.find((p) => p.isLeader);
  const isLeader = leader?.id === playerId;
  const teamSize = getMissionTeamSize(room.players.length, room.currentMission);
  const canSubmit = selected.length === teamSize;

  function togglePlayer(id: string) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < teamSize
          ? [...prev, id]
          : prev
    );
  }

  async function handleSubmit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      await proposeTeam(room.code, selected);
    } catch {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex flex-col flex-1 px-5 py-10 h-screen-safe overflow-y-auto no-scrollbar">
      <div className="relative w-full max-w-[400px] mx-auto flex flex-col gap-8 flex-1">

        {/* Mission tracker */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
          <p className="text-[10px] text-white/30 tracking-[0.2em] uppercase">
            Misija {room.currentMission} od 5
          </p>

          <div className="flex gap-3">
            {[1, 2, 3, 4, 5].map((m) => {
              const result = room.missionResults.find((r) => r.missionNumber === m);
              const isCurrent = m === room.currentMission;
              return (
                <motion.div
                  key={m}
                  animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                  transition={isCurrent ? { repeat: Infinity, duration: 2 } : {}}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-bold border-2 ${
                    result?.result === 'success'
                      ? 'bg-blue-500/20 border-blue-400 text-blue-400'
                      : result?.result === 'fail'
                        ? 'bg-red-500/20 border-red-400 text-red-400'
                        : isCurrent
                          ? 'text-white'
                          : 'border-white/10 text-white/25'
                  }`}
                  style={isCurrent ? { border: `2px solid ${ACCENT2}`, color: ACCENT2 } : {}}
                >
                  {m}
                </motion.div>
              );
            })}
          </div>

          {room.consecutiveRejects > 0 && (
            <p className="text-[11px] text-red-400/70">
              Odbijanja: {room.consecutiveRejects}/5
            </p>
          )}
        </motion.div>

        {/* Leader info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-4 text-center"
          style={{ backdropFilter: 'blur(12px)' }}
        >
          <p className="text-[10px] text-white/30 tracking-[0.2em] uppercase mb-2">Lider</p>
          <p
            className="text-[18px] font-bold"
            style={{ color: ACCENT2, textShadow: `0 0 12px ${hexA(ACCENT, 0.4)}` }}
          >
            {leader?.name ?? '...'}
          </p>
          <p className="text-[12px] text-white/40 mt-1">
            {isLeader ? `Izaberi ${teamSize} vitezova za misiju` : `${leader?.name} bira tim...`}
          </p>
        </motion.div>

        {/* Player selection */}
        {isLeader && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col gap-2"
          >
            <p className="text-[10px] text-white/30 tracking-[0.2em] uppercase mb-1">
              Tim · {selected.length}/{teamSize}
            </p>
            {room.players
              .filter((p) => p.isConnected)
              .map((p) => {
                const isSelected = selected.includes(p.id);
                return (
                  <motion.button
                    key={p.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => togglePlayer(p.id)}
                    className="flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-200"
                    style={{
                      background: isSelected ? hexA(ACCENT, 0.15) : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isSelected ? hexA(ACCENT, 0.4) : 'transparent'}`,
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors"
                      style={{
                        borderColor: isSelected ? ACCENT2 : '#475569',
                        background: isSelected ? hexA(ACCENT, 0.25) : 'transparent',
                      }}
                    >
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: ACCENT2 }}
                        />
                      )}
                    </div>
                    <span className="text-[14px] font-medium" style={{ color: isSelected ? ACCENT2 : '#94a3b8' }}>
                      {p.name}
                    </span>
                    {p.id === playerId && (
                      <span className="text-[9px] text-white/30 tracking-[0.15em] uppercase">ti</span>
                    )}
                  </motion.button>
                );
              })}
          </motion.div>
        )}

        {!isLeader && (
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="flex flex-col items-center gap-3 py-8"
          >
            <span className="text-3xl">⏳</span>
            <p className="text-[12px] text-white/30">Čekamo liderov izbor...</p>
          </motion.div>
        )}

        {isLeader && (
          <div className="mt-auto pt-6">
            <Button
              fullWidth
              disabled={!canSubmit || submitting}
              onClick={handleSubmit}
              className="!rounded-2xl !text-white"
              style={{
                background: canSubmit ? `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` : 'rgba(255,255,255,0.05)',
                boxShadow: canSubmit ? `0 4px 16px ${hexA(ACCENT, 0.4)}` : 'none',
              }}
            >
              {submitting ? 'Šaljem...' : canSubmit ? 'Predloži tim' : `Izaberi još ${teamSize - selected.length}`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
