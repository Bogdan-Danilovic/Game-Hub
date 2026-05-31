# Game-Hub Architecture & Monetization Readiness Report

**Date:** 2026-05-31  
**Scope:** Read-only analysis of current state + monetization gap assessment  
**Platform:** game-hub-wine-delta.vercel.app  
**Stack:** Next.js 16.2 (App Router, React 19), Firebase SDK 12 (client-only), Tailwind 4

---

## 1. Firestore Data Model

### Collection Layout

```
rooms/                         ← single flat collection
  {code}/                      ← room document (e.g. "AB3X7F")
    code: string
    status: RoomStatus
    gameType: 'impostor'|'alias'|'avalon'|'flip7'
    hostId: string
    players: BasePlayer[]      ← ARRAY embedded in room doc (not subcollection)
    createdAt: number
    settings: GameSettings
    [game-specific fields]     ← all merged into the same document
```

**Sources:**
- Collection name: `lib/firestore/core.ts:11` — `doc(db, 'rooms', code)`
- Players as embedded array: `lib/types/core.ts:36-44` — `players: BasePlayer[]` on `BaseRoom`
- All game state (deck, votes, scores, cards) in the same doc — confirmed across all four `lib/firestore/*.ts` files

### Per-Game Document Shape (notable fields beyond base)

| Game | Key extra fields | Worst-case array sizes |
|------|-----------------|------------------------|
| Flip7 | `deck: Flip7Card[]`, `discardPile: Flip7Card[]`, `players[].numberCards`, `players[].modifierCards` | deck 94 cards × ~3 fields; 18 players each with up to 13 cards |
| Avalon | `teamVotes: Record<string,TeamVote>`, `questVotes: Record<string,QuestVote>`, `missionResults[]`, `lady.history[]` | bounded, small |
| Alias | `wordsQueue: string[]` — dynamically refilled to 30–50 words | moderate |
| Impostor | `votes: Record<string,string>` | small |

**No subcollections exist.** Every game phase state is stored in a single room document. This is the primary scaling constraint (see §2).

### Identity Model

`lib/hooks/usePlayer.ts:13-15` — `playerId` and `playerName` are read from `localStorage` only. There are no user accounts, no Firebase Auth, no server-side session. `playerId` is a random UUID generated at join time (`lib/utils.ts` via `generatePlayerId()`).

---

## 2. Real-Time & Scaling Bottlenecks

### Listener topology

`lib/firestore/core.ts:15-25` — `subscribeToRoom()` opens a single `onSnapshot` on the room document. `hooks/useRoom.ts:16-29` calls it once per component mount. Every player client holds one listener to the same room document.

**Result:** In a 10-player Avalon room, 10 clients each hold 1 listener = 10 `onSnapshot` connections on 1 document. On every write (each vote, team change, status update), Firestore pushes the **entire document** to all 10 clients. This is full-document fan-out, not field-level.

### Write amplification on the room document

Every game action — including high-frequency ones like `scoreWord` in Alias or `sayJosJednu` in Flip7 — calls `runTransaction` which reads then writes the full room document. A single explaining turn in Alias may generate 5–15 writes per minute (word scored → next word queued → round timer check). Each write wakes all N listeners.

**Firestore limits that apply:**

| Limit | Impact |
|-------|--------|
| 1 write/second sustained per document | Alias explaining phase can exceed this; flip7 card draws can also burst above 1/s |
| 1 MB document cap | Flip7 with 18 players × 13 cards + 94-card deck approaches ~50–80 KB serialized JSON — comfortable today but not infinitely scalable |
| onSnapshot billing: 1 read per listener per document change | 10 players × 20 Alias writes/minute = 200 reads/minute billed per room |

### Disconnect / presence handling

`setPlayerDisconnected()` is a client-side function called from `useEffect` cleanup or `beforeunload`. There is **no server-side TTL or Firestore presence mechanism** (no RTDB `.info/connected`, no Cloud Function on disconnect). If a client tab crashes without running cleanup, the player remains `isConnected: true` indefinitely. The host-skip feature (`flip7/hostSkipTarget`) partially mitigates game stalls but does not solve stale presence.

### Room cleanup / TTL

No Cloud Functions, no scheduled cleanup, no TTL field. Finished rooms accumulate in Firestore forever. At ~50 KB/room for a Flip7 game with full deck, 10,000 played rooms = ~500 MB of orphaned documents. The free Firestore tier (1 GB storage) would be consumed in ~20,000 games.

### Severity Summary

| Bottleneck | Severity | Threshold |
|------------|----------|-----------|
| 1 write/sec doc limit — Alias explaining phase | HIGH | Bursts of >1 card/sec hit this |
| No server-side disconnect cleanup | HIGH | Tab crash = permanent ghost players |
| Full-doc fan-out on every write | MEDIUM | Fine up to ~50 concurrent rooms; degrades at scale |
| No room TTL / cleanup | MEDIUM | Storage cost accumulates over months |
| Flip7 doc size with max players | LOW | Comfortable today; watch at 18 players |

---

## 3. Security Posture

### Firestore Security Rules — CRITICAL GAP

**`firestore.rules` does not exist in the repository.** `git ls-files` returns no `.rules` file. `firebase.json` is also absent. There is no `firestore.indexes.json` tracked in the repo.

This means one of two things:
1. Rules were set via the Firebase console and are not version-controlled (unauditable, drift-prone), OR
2. The project is running under the Firebase default rule set.

**The Firebase default rule for new projects is `allow read, write: if false;`** (deny-all). However, if a project was ever switched to test mode during development, the default becomes `allow read, write: if true;` (allow-all) with a time-limited expiry that many developers let lapse or ignore.

**Risk for monetization:** Without audited, version-controlled rules, any client can:
- Write arbitrary data to any room document (fake scores, bypass entitlement checks)
- Read other players' secret data (`impostorIds`, `teamVotes`, Avalon `role`/`loyalty`) directly from Firestore without going through the UI — a trivially exploitable cheat
- Write to a future `users/{uid}/entitlement` document, granting themselves premium access

This is a **CRITICAL blocker** before any premium feature or payment flow can be built. An entitlement field in Firestore means nothing if any authenticated (or even unauthenticated) client can write it.

### Firebase API Keys (NEXT_PUBLIC_*)

`lib/firebase.ts:6-13` — all Firebase config values are provided via `NEXT_PUBLIC_*` environment variables. This is **correct practice**: Firebase client-side API keys are not secrets (they are safe to expose — they are application identifiers, not authentication credentials). Access is controlled by Firestore Security Rules, not by key secrecy.

**No hardcoded Firebase config was found.** The `.gitignore` correctly excludes `.env*` files.

### No Server Routes

The app has **zero API routes** (`app/api/` does not exist). All Firestore operations run client-side via the Firebase JS SDK. This is architecturally important for monetization: a Stripe webhook **requires a server-side HTTP endpoint** to receive payment confirmation securely. Next.js App Router provides this via Route Handlers (`app/api/stripe/webhook/route.ts`), but none exist today.

---

## 4. Monetization Gap Analysis

### Current state

| Capability | Present? | Notes |
|-----------|---------|-------|
| User accounts / identity | No | localStorage UUID only (`hooks/usePlayer.ts:13-15`) |
| User profiles in DB | No | No `users` collection |
| Entitlements / tiers | No | No access control beyond room host logic |
| Payment infrastructure | No | No Stripe, no server routes |
| Server-side code | No | Fully client-side app |
| Firestore rules | No (untracked) | Critical gap |
| Room lifecycle management | Partial | No TTL, no Cloud Functions |

### Gap to First Paying Customer

To charge a user, the following must exist:
1. A verified user identity (Firebase Auth anonymous → linked, or email)
2. A server-side payment intent creation and webhook receiver (Route Handler)
3. An entitlement record in Firestore that rules verify before granting premium access
4. Firestore Security Rules that prevent clients from self-granting entitlements

---

## 5. Proposed Monetization Architecture

### Auth Strategy — Preserve "No Registration to Play" UX

**Proposal: Firebase Anonymous Auth → Upgrade to Email/Google**

```
Player arrives → Firebase Auth anonymous sign-in (automatic, invisible)
               → uid assigned, stored (replaces localStorage playerId)
               → Play games freely as anonymous user

When player wants to:
  - Save stats / play history   → Prompt: "Create account to save progress"
  - Access premium features     → Prompt: "Upgrade to unlock"
  → linkWithPopup(GoogleAuthProvider) or linkWithCredential(EmailAuthProvider)
  → uid stays the same — all history preserved
```

This preserves the Jackbox-style frictionless join while enabling permanent identity when the player opts in. Anonymous users can still play; premium features require a linked account.

**Implementation note:** Replace `localStorage.getItem('playerId')` in `hooks/usePlayer.ts` with `onAuthStateChanged` from Firebase Auth. On first visit, call `signInAnonymously()`. The Firebase Auth `uid` becomes the canonical player identity.

### Proposed Firestore Schema (additions only)

```
users/
  {uid}/
    displayName: string
    email: string | null
    isAnonymous: boolean
    createdAt: Timestamp
    tier: 'free' | 'premium'            ← written ONLY by server (webhook)
    stripeCustomerId: string | null      ← written ONLY by server
    entitlements: {
      premiumGames: boolean              ← e.g. access to upcoming games
      largeLobby: boolean                ← e.g. rooms > 12 players
      cosmetics: string[]                ← unlocked avatar frames, colors
    }
    stats: {
      gamesPlayed: number
      gamesHosted: number
    }

rooms/
  {code}/
    [existing fields]
    hostTier: 'free' | 'premium'        ← denormalized from users/{hostId} at room creation
    isPremium: boolean                   ← gates premium-only features in rules

subscriptions/                           ← optional, for Stripe subscription tracking
  {uid}/
    stripeSubscriptionId: string
    status: 'active' | 'canceled' | 'past_due'
    currentPeriodEnd: Timestamp
```

### Stripe Payment Flow

```
CLIENT                          NEXT.JS ROUTE HANDLER              STRIPE
  |                                      |                            |
  |-- POST /api/stripe/checkout -------->|                            |
  |   { priceId, uid }                   |-- createCheckoutSession -->|
  |                                      |<-- session.url ------------|
  |<-- { url } --------------------------|                            |
  |                                      |                            |
  |-- redirect to session.url ---------->|                            |
  |                             [user pays on Stripe hosted page]     |
  |                                      |<-- webhook POST -----------|
  |                                      |   checkout.session.completed
  |                                      |-- verify Stripe signature  |
  |                                      |-- write users/{uid}.tier = 'premium'
  |                                      |   (server SDK, bypasses rules)
  |<-- redirect to /success -------------|                            |
```

**Required new files (proposals):**
- `app/api/stripe/checkout/route.ts` — creates Stripe Checkout session
- `app/api/stripe/webhook/route.ts` — receives `checkout.session.completed`, `customer.subscription.*` events; writes to Firestore via **Admin SDK** (not client SDK)
- `lib/firebase-admin.ts` — server-only Firebase Admin initialization

**Critical:** The webhook handler must use the Firebase **Admin SDK** (server-side) to write entitlements. The client SDK would be blocked by the security rules that prevent clients from writing their own tier.

### Firestore Security Rules Sketch (proposal)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users: read own, write only server (Admin SDK bypasses rules)
    match /users/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if false;  // server-only via Admin SDK
    }

    // Rooms: any authenticated user can read; writes validated
    match /rooms/{code} {
      allow read: if request.auth != null;

      // Create room: authenticated, sets hostId to own uid
      allow create: if request.auth != null
        && request.resource.data.hostId == request.auth.uid;

      // Update room: only players already in the room
      allow update: if request.auth != null
        && (request.auth.uid in resource.data.players.map(p => p.id)
            || request.auth.uid == resource.data.hostId)
        // Prevent clients from changing their own tier or entitlement fields
        && !('hostTier' in request.resource.data.diff(resource.data).affectedKeys())
        && !('isPremium' in request.resource.data.diff(resource.data).affectedKeys());

      allow delete: if false;  // rooms deleted by server/TTL only
    }
  }
}
```

---

## 6. Monetization Models — Evaluation

### Model A: Premium Rooms / Cosmetics (Pay once, unlock features)

**What:** Host pays ~€3–5 to unlock: larger lobbies (18→30 players), room themes/colors, priority matchmaking (if added), exclusive game modes.

**Data model impact:** `users/{uid}.entitlements.largeLobby: boolean` checked at room creation time. Room document gets `isPremium: boolean`. Cosmetics stored as `entitlements.cosmetics: string[]`.

**Stripe flow:** One-time payment product, no subscription management complexity.

**Effort estimate:** 40–60 hours (auth 15h + rules 8h + Stripe one-time 12h + UI gates 10h + testing 15h)

**Monetization-impact:** 6/10 — low friction but small LTV; cosmetics need to feel meaningful in a group setting.

---

### Model B: Subscription Tier — Host Unlocks Premium Platform (RECOMMENDED)

**What:** Host pays €4–8/month for: bigger lobbies, access to all games including upcoming ones, room analytics ("who was the best Alias explainer?"), custom room codes, no ads (if ever added).

**Data model impact:** `users/{uid}.tier: 'premium'`, `users/{uid}.entitlements.*`. Subscription status tracked via Stripe webhooks → `subscriptions/{uid}`. Room creation checks `hostTier` (denormalized at creation, re-validated server-side).

**Stripe flow:** Subscription (`price.recurring`), handle `customer.subscription.updated` and `customer.subscription.deleted` webhooks to downgrade tier.

**Why recommended:** Matches the use case perfectly — groups play regularly, the host is a natural "buyer" (they organize the session), and recurring revenue gives a stable foundation. Games like Jackbox sell annually to the same group. A €5/month "Game-Hub Pro" aligns with this pattern. The subscription model also creates a reason to keep adding games (premium members get early access).

**Effort estimate:** 60–80 hours (auth 15h + rules 8h + Stripe subscription 20h + entitlement checks in UI 12h + subscription management UI 10h + testing 15h + Cloud Function for room TTL 8h)

**Monetization-impact:** 9/10 — recurring revenue, natural upsell as more games are added, low churn if group uses it weekly.

---

### Model C: Pay-Per-Game (Credits / Session Tokens)

**What:** Buy a bundle of game credits (e.g., 10 credits for €5); each hosted game costs 1 credit. Free games might have a 6-player cap.

**Data model impact:** `users/{uid}.credits: number` — but credits MUST NOT be writable by the client (anyone could increment their own). Requires server-side decrement on game start via a Cloud Function or Route Handler. Complex to implement correctly.

**Stripe flow:** One-time payment for credit bundles. No subscription complexity but higher Stripe fee ratio on small amounts.

**Effort estimate:** 70–90 hours — the credit decrement logic requires a server-side function that the current architecture (no server routes) completely lacks; more infrastructure work than Model B.

**Monetization-impact:** 5/10 — micropayment friction is high; players will forget they have credits; hard to predict revenue.

---

## 7. Prioritized Action List

### CRITICAL — Blockers before first paying customer

| # | Action | Effort | Monetization Impact |
|---|--------|--------|---------------------|
| C1 | **Write and deploy Firestore Security Rules** — deny-all by default, whitelist only valid room operations; prevent any client from writing `tier` or `entitlements` fields | 8h | 10/10 — without this, entitlements are meaningless |
| C2 | **Add Firebase Auth** — anonymous sign-in on first visit; replace `localStorage` playerId with Firebase Auth `uid`; preserve "no registration to play" UX | 15h | 10/10 — prerequisite for all paid features |
| C3 | **Add server-side Route Handlers** — `app/api/stripe/checkout/route.ts` + `app/api/stripe/webhook/route.ts`; install `firebase-admin` and `stripe` npm packages; write entitlements via Admin SDK only | 20h | 10/10 — the entire payment loop lives here |

### HIGH — Required for a stable monetized product

| # | Action | Effort | Monetization Impact |
|---|--------|--------|---------------------|
| H1 | **Add room TTL and cleanup** — Cloud Function (or Vercel cron) to delete rooms older than 24h with status 'finished'; prevents storage cost accumulation | 8h | 7/10 |
| H2 | **Fix disconnect presence** — use Firebase Auth presence + RTDB or a Cloud Function `onDocumentUpdated` to mark players offline after N minutes of inactivity; eliminates ghost players | 10h | 6/10 |
| H3 | **Alias write-rate fix** — move `wordsQueue` to a subcollection or debounce word-score writes to avoid the 1 write/sec Firestore limit during active explaining rounds | 12h | 5/10 — affects game quality, not directly monetization |
| H4 | **Create `users/{uid}` profile document** on first Auth sign-in; store `displayName`, `tier: 'free'`, initial `entitlements` | 4h | 8/10 |

### MEDIUM — Polish and growth

| # | Action | Effort | Monetization Impact |
|---|--------|--------|---------------------|
| M1 | **Subscription management UI** — show current plan, upgrade/downgrade, cancel; link to Stripe Customer Portal | 10h | 6/10 |
| M2 | **Track room stats in user profile** — games played/hosted; power the upgrade nudge ("You've hosted 12 games — unlock premium for unlimited players") | 6h | 7/10 |
| M3 | **Version-control firestore.indexes.json and firebase.json** — currently neither file exists in the repo; required for proper CI/CD of rules and indexes | 2h | 3/10 |
| M4 | **Implement Firestore rules integration tests** with the Firebase Emulator and `@firebase/rules-unit-testing` | 12h | 4/10 |
| M5 | **CSP headers** — add `Content-Security-Policy` and other security headers in `next.config.ts`; required for PCI DSS compliance baseline around Stripe | 4h | 5/10 |

---

## Summary

**Top scaling bottleneck:** The Alias game's explaining phase generates burst writes that can exceed Firestore's 1 write/second soft limit per document, because `wordsQueue`, `currentWord`, `roundResults`, and `scores` all update in the same document on every word score. At high frequency this creates write contention errors (`ABORTED` transactions). Fix: subcollection for word queue or client-side batching with a 1-second debounce.

**Security verdict:** CRITICAL risk. No `firestore.rules` file exists in the repository. The database may be running under permissive rules (depending on when the Firebase project was initialized). Any premium entitlement stored in Firestore can be self-granted by any client unless rules explicitly prevent it. This must be fixed before any paid feature is built.

**Recommended monetization model:** Model B — Monthly subscription (~€5/month) for the room host. Rationale: groups play weekly, the host is the natural purchaser, recurring revenue is predictable, and adding new games (Trivia is already scaffolded as `available: false`) creates a natural upsell cycle. LTV is higher than pay-per-game and implementation is simpler than a credit system.

**3 must-do items before first paying customer:**
1. Write and deploy Firestore Security Rules (C1) — without this, all paid features are bypassable
2. Add Firebase Anonymous Auth replacing localStorage identity (C2) — prerequisite for everything else
3. Implement Stripe Checkout + webhook Route Handler writing entitlements via Admin SDK (C3) — the actual money pipeline
