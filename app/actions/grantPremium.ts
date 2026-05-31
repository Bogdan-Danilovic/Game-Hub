'use server';

// TODO: Migrirati na firebase-admin SDK za produkciju
// npm install firebase-admin + GOOGLE_APPLICATION_CREDENTIALS env var
// Za sad koristi Firestore REST API — ne zahteva novi paket

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

type PremiumResult = { ok: boolean; error?: string };

export async function grantPremium(roomCode: string): Promise<PremiumResult> {
  if (!roomCode || !PROJECT_ID) return { ok: false, error: 'Nedostaje konfiguracija' };

  const premiumUntilMs = Date.now() + 24 * 60 * 60 * 1000;

  const url =
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/rooms/${roomCode}` +
    `?updateMask.fieldPaths=premiumUntil&updateMask.fieldPaths=premiumSource&updateMask.fieldPaths=premiumGrantedAt`;

  const body = {
    fields: {
      premiumUntil: { timestampValue: new Date(premiumUntilMs).toISOString() },
      premiumSource: { stringValue: 'host-unlock-rewarded' },
      premiumGrantedAt: { timestampValue: new Date().toISOString() },
    },
  };

  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    return { ok: false, error: `Firestore greška: ${res.status}` };
  }

  return { ok: true };
}
