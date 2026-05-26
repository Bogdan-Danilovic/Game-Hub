'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AvalonRoom, AvalonPlayer } from '@/lib/types/avalon';
import { advanceFromNight } from '@/lib/firestore/avalon';
import { Button } from '@/components/ui/Button';

interface Props {
  room: AvalonRoom;
  playerId: string;
}

interface NightStep {
  text: string;
  subtext?: string;
  duration: number;
}

function buildNightSteps(room: AvalonRoom): NightStep[] {
  const steps: NightStep[] = [
    { text: 'Svi zatvaraju oči', subtext: 'Noć pada na Camelot...', duration: 3000 },
    { text: 'Zli otvaraju oči', subtext: 'Sluge Mordreda se prepoznaju', duration: 3500 },
    { text: 'Zli zatvaraju oči', duration: 2000 },
    { text: 'Merlin otvara oči', subtext: 'I vidi sluge Zla', duration: 3500 },
    { text: 'Merlin zatvara oči', duration: 2000 },
  ];

  const hasPercival = room.players.some((p) => p.role === 'percival');
  if (hasPercival) {
    const hasMorgana = room.players.some((p) => p.role === 'morgana');
    steps.push({
      text: 'Percival otvara oči',
      subtext: hasMorgana ? 'I vidi Merlina... ili Morganu?' : 'I vidi Merlina',
      duration: 3500,
    });
    steps.push({ text: 'Percival zatvara oči', duration: 2000 });
  }

  steps.push({ text: 'Svi otvaraju oči', subtext: 'Dan je svanuo', duration: 3000 });

  return steps;
}

export function NightPhaseScreen({ room, playerId }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const isHost = room.hostId === playerId;
  const steps = buildNightSteps(room);
  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex >= steps.length - 1;

  useEffect(() => {
    if (isLastStep) return;
    const t = setTimeout(() => setStepIndex((i) => i + 1), currentStep.duration);
    return () => clearTimeout(t);
  }, [stepIndex, isLastStep, currentStep.duration]);

  const me = room.players.find((p) => p.id === playerId);
  const evilPlayers = room.players.filter((p) => p.loyalty === 'evil');
  const showEvil = stepIndex === 1 && me?.loyalty === 'evil' && me.role !== 'oberon';
  const showMerlinView = stepIndex === 3 && me?.role === 'merlin';

  const hasPercival = room.players.some((p) => p.role === 'percival');
  const showPercivalView = hasPercival && stepIndex === 5 && me?.role === 'percival';

  function getVisibleNames(): { names: string[]; label: string } {
    if (showEvil) {
      const others = evilPlayers.filter((p) => p.id !== playerId && p.role !== 'oberon');
      return { names: others.map((p) => p.name), label: 'Tvoji saveznici u Zlu' };
    }
    if (showMerlinView) {
      const visible = room.players.filter((p) => p.loyalty === 'evil' && p.role !== 'mordred');
      return { names: visible.map((p) => p.name), label: 'Sluge Zla' };
    }
    if (showPercivalView) {
      const targets: AvalonPlayer[] = room.players.filter(
        (p) => p.role === 'merlin' || p.role === 'morgana'
      );
      return { names: targets.map((p) => p.name), label: 'Merlin je među njima' };
    }
    return { names: [], label: '' };
  }

  const { names, label } = getVisibleNames();
  const showNames = names.length > 0;

  return (
    <div className="relative flex flex-col items-center justify-center flex-1 px-8 h-screen-safe overflow-hidden">
      <motion.div
        className="fixed inset-0 pointer-events-none"
        animate={{
          background: `radial-gradient(ellipse 300px 300px at center, rgba(217,119,6,${showNames ? 0.08 : 0.03}) 0%, transparent 70%)`,
        }}
        transition={{ duration: 1.2 }}
      />

      <div className="relative w-full max-w-[320px] flex flex-col items-center gap-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[10px] text-slate-500 tracking-[0.2em] uppercase"
        >
          Noćna faza
        </motion.div>

        <div className="w-full min-h-[200px] flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={stepIndex}
              initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center gap-4 text-center"
            >
              <h2 className="text-[28px] font-bold text-white tracking-tight">
                {currentStep.text}
              </h2>
              {currentStep.subtext && (
                <p className="text-[13px] text-slate-500">
                  {currentStep.subtext}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {showNames && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full p-5 rounded-xl bg-amber-950/20 border border-amber-500/10"
            >
              <p className="text-[10px] text-amber-400/70 tracking-[0.2em] uppercase mb-3 text-center">
                {label}
              </p>
              <div className="flex flex-col items-center gap-2">
                {names.map((n) => (
                  <motion.span
                    key={n}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[15px] font-medium text-amber-300"
                  >
                    {n}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <motion.div
              key={i}
              className={`h-1 rounded-full transition-colors duration-300 ${
                i <= stepIndex ? 'bg-amber-500/60' : 'bg-white/[0.06]'
              }`}
              animate={{ width: i === stepIndex ? 24 : 8 }}
              transition={{ type: 'spring' as const, stiffness: 300, damping: 25 }}
            />
          ))}
        </div>

        {isHost && isLastStep && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="w-full"
          >
            <Button
              fullWidth
              onClick={() => advanceFromNight(room.code)}
              className="!bg-amber-600 hover:!bg-amber-500"
            >
              Otkrij uloge
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
