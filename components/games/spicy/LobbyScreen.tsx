'use client';

import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { SpicyRoom } from '@/lib/games/spicy/firestoreTypes';
import { startGame } from '@/lib/firestore/spicy';
import { Button } from '@/components/ui/Button';

interface Props { room: SpicyRoom; playerId: string; }

export function SpicyLobbyScreen({ room, playerId }: Props) {
  const [copied, setCopied] = useState(false);
  const isHost = room.hostId === playerId;

  function copyCode() {
    navigator.clipboard.writeText(room.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 20%, rgba(239,68,68,0.07) 0%, transparent 70%)' }}
      />
      <div className="relative z-10 w-full max-w-[380px] flex flex-col gap-5">
        {/* Code */}
        <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
          className="rounded-3xl p-6 text-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <div className="text-xs font-semibold uppercase tracking-widest text-red-400/70 mb-2">Kod sobe</div>
          <div className="text-5xl font-black tracking-[0.3em] text-white mb-3">{room.code}</div>
          <button onClick={copyCode} className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white/70 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.07)' }}>
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            {copied ? 'Kopirano!' : 'Kopiraj kod'}
          </button>
        </motion.div>

        {/* Players */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white/40" style={{ background: 'rgba(255,255,255,0.03)' }}>
            Igrači ({room.players.length}/6)
          </div>
          {room.players.map((p, i) => (
            <div key={p.id} className={`flex items-center gap-3 px-4 py-3 ${i ? 'border-t border-white/[0.06]' : ''}`}>
              <div className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ background: p.id === playerId ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)' }}>
                {p.name[0]?.toUpperCase()}
              </div>
              <span className="flex-1 text-sm font-semibold text-white">{p.name}</span>
              {p.isHost && <span className="text-[11px] font-semibold text-red-400 uppercase tracking-wide">Host</span>}
              {p.id === playerId && !p.isHost && <span className="text-[11px] text-white/30">Ti</span>}
            </div>
          ))}
        </motion.div>

        {/* Start */}
        {isHost ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <Button fullWidth disabled={room.players.length < 2} onClick={() => startGame(room.code)}
              style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 4px 20px rgba(239,68,68,0.4)' }}
              className="!rounded-2xl !text-white !font-bold">
              🌶️ Pokreni igru ({room.players.length} igrača)
            </Button>
            {room.players.length < 2 && <p className="text-center text-xs text-white/30 mt-2">Potrebno minimalno 2 igrača</p>}
          </motion.div>
        ) : (
          <div className="text-center text-sm text-white/40">Čekamo da domaćin pokrene igru...</div>
        )}
      </div>
    </div>
  );
}
