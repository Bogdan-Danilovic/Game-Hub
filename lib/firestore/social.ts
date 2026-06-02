'use client';

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  writeBatch,
  query,
  where,
  documentId,
  serverTimestamp,
  onSnapshot,
  arrayUnion,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ONLINE_THRESHOLD_MS } from '@/lib/firestore/players';
import type { FriendRequest, FriendProfile } from '@/lib/types/social';

const REQUEST_COL = 'friendRequests';
const USERS_COL = 'users';

function toFriendProfile(uid: string, data: Record<string, unknown>): FriendProfile {
  const lastSeen = (data.lastSeen as Timestamp | null) ?? null;
  const isOnline =
    lastSeen !== null && Date.now() - lastSeen.toMillis() < ONLINE_THRESHOLD_MS;
  return {
    uid,
    name: (data.displayName as string) ?? '',
    avatar: (data.avatar as string) ?? '',
    color: (data.color as string) ?? '',
    isOnline,
    lastSeen: lastSeen ?? Timestamp.now(),
  };
}

export async function sendFriendRequest(fromUid: string, toUid: string): Promise<void> {
  try {
    await addDoc(collection(db, REQUEST_COL), {
      from: fromUid,
      to: toUid,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    throw new Error(
      `sendFriendRequest failed (${fromUid} → ${toUid}): ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
}

export async function acceptFriendRequest(requestId: string): Promise<void> {
  try {
    const reqRef = doc(db, REQUEST_COL, requestId);
    const reqSnap = await getDoc(reqRef);
    if (!reqSnap.exists()) throw new Error(`Request ${requestId} not found`);

    const { from, to } = reqSnap.data() as FriendRequest;

    // 3 writes — batch required
    const batch = writeBatch(db);
    batch.update(reqRef, { status: 'accepted' });
    batch.update(doc(db, USERS_COL, from), { friends: arrayUnion(to) });
    batch.update(doc(db, USERS_COL, to), { friends: arrayUnion(from) });
    await batch.commit();
  } catch (err) {
    throw new Error(
      `acceptFriendRequest failed (${requestId}): ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
}

export async function declineFriendRequest(requestId: string): Promise<void> {
  try {
    await updateDoc(doc(db, REQUEST_COL, requestId), { status: 'declined' });
  } catch (err) {
    throw new Error(
      `declineFriendRequest failed (${requestId}): ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
}

export async function getFriends(uid: string): Promise<FriendProfile[]> {
  try {
    const userSnap = await getDoc(doc(db, USERS_COL, uid));
    if (!userSnap.exists()) return [];

    const friendIds: string[] = (userSnap.data().friends as string[] | undefined) ?? [];
    if (friendIds.length === 0) return [];

    // Firestore 'in' is capped at 30 items per query
    const chunks: string[][] = [];
    for (let i = 0; i < friendIds.length; i += 30) {
      chunks.push(friendIds.slice(i, i + 30));
    }

    const profiles: FriendProfile[] = [];
    for (const chunk of chunks) {
      const snap = await getDocs(
        query(collection(db, USERS_COL), where(documentId(), 'in', chunk)),
      );
      snap.docs.forEach((d) =>
        profiles.push(toFriendProfile(d.id, d.data() as Record<string, unknown>)),
      );
    }
    return profiles;
  } catch (err) {
    throw new Error(
      `getFriends failed for ${uid}: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
  }
}

export function subscribeToFriendRequests(
  uid: string,
  callback: (requests: FriendRequest[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, REQUEST_COL),
    where('to', '==', uid),
    where('status', '==', 'pending'),
  );
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({ id: d.id, ...d.data() } as FriendRequest)),
    );
  });
}
