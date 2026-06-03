'use client';

import { useRouter } from 'next/navigation';

export default function DrawingError({ reset }: { reset: () => void }) {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center flex-1 h-screen-safe gap-4">
      <p className="text-sm text-slate-400">Nešto je pošlo po krivu.</p>
      <div className="flex gap-3">
        <button onClick={reset} className="text-sm text-amber-400 hover:text-amber-300 transition-colors">
          Pokušaj ponovo
        </button>
        <button onClick={() => router.push('/')} className="text-sm text-slate-500 hover:text-slate-400 transition-colors">
          Nazad na Hub
        </button>
      </div>
    </div>
  );
}
