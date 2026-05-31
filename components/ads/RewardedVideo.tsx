'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRewardedVideo, VideoState, RewardResult } from '@/hooks/useRewardedVideo';

type Props = {
  count: number;
  onComplete: (result: RewardResult) => void;
  onCancel: () => void;
  label?: string;
};

const STATE_MESSAGES: Record<VideoState, string> = {
  idle: '',
  loading: 'Učitavanje reklame...',
  playing: 'Pogledaj video do kraja da bi dobio nagradu',
  completed: 'Gotovo!',
  'no-fill': 'Reklama trenutno nije dostupna. Pokušaj ponovo.',
  error: 'Greška pri učitavanju. Pokušaj ponovo.',
};

export function RewardedVideo({ count, onComplete, onCancel, label }: Props) {
  const { state, watched, play, reset } = useRewardedVideo();

  async function handleStart() {
    const result = await play(count);
    if (result.completed) {
      onComplete(result);
    }
  }

  function handleCancel() {
    reset();
    onCancel();
  }

  const isActive = state === 'loading' || state === 'playing';
  const canRetry = state === 'no-fill' || state === 'error';

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {/* Progress dots */}
      {count > 1 && (
        <div className="flex gap-2">
          {Array.from({ length: count }, (_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full transition-all duration-300"
              style={{
                background:
                  i < watched
                    ? '#10b981'
                    : i === watched && isActive
                      ? '#f59e0b'
                      : 'rgba(255,255,255,0.1)',
              }}
            />
          ))}
        </div>
      )}

      {/* Status poruka */}
      <AnimatePresence mode="wait">
        {state !== 'idle' && (
          <motion.p
            key={state}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-[12px] text-center"
            style={{
              color:
                state === 'completed'
                  ? '#10b981'
                  : state === 'no-fill' || state === 'error'
                    ? '#f87171'
                    : '#94a3b8',
            }}
          >
            {STATE_MESSAGES[state]}
            {isActive && watched > 0 && ` (${watched}/${count})`}
          </motion.p>
        )}
      </AnimatePresence>

      {/* TODO: Ovde će ići Adsterra VAST player iframe */}
      {state === 'playing' && (
        <div
          className="w-full rounded-xl flex items-center justify-center text-[11px] text-slate-600"
          style={{
            height: 180,
            background: 'rgba(255,255,255,0.02)',
            border: '1px dashed rgba(255,255,255,0.06)',
          }}
        >
          VAST player placeholder
        </div>
      )}

      <div className="flex gap-3 w-full">
        {state === 'idle' && (
          <button
            onClick={handleStart}
            className="flex-1 py-3 rounded-xl text-[13px] font-semibold text-white transition-all duration-200 active:scale-95 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
              border: '1px solid rgba(139,92,246,0.5)',
              boxShadow: '0 0 16px rgba(139,92,246,0.3)',
            }}
          >
            {label ?? `Pogledaj ${count > 1 ? `${count} videa` : 'video'}`}
          </button>
        )}

        {canRetry && (
          <button
            onClick={handleStart}
            className="flex-1 py-3 rounded-xl text-[13px] font-semibold text-white cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Pokušaj ponovo
          </button>
        )}

        {!isActive && state !== 'completed' && (
          <button
            onClick={handleCancel}
            className="px-5 py-3 rounded-xl text-[13px] text-slate-500 hover:text-slate-400 cursor-pointer transition-colors"
          >
            Odustani
          </button>
        )}
      </div>
    </div>
  );
}
