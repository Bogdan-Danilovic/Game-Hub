'use client';

import { doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Atomični increment — nikad direktno postavljanje totalEarned
export async function recordDonation(videosWatched: number, estUsd: number): Promise<void> {
  await updateDoc(doc(db, 'stats', 'donations'), {
    totalEarned: increment(estUsd),
    totalVideosWatched: increment(videosWatched),
    updatedAt: serverTimestamp(),
  });
}
