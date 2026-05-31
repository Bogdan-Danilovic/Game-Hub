# Game-Hub Codebase Audit Report

**Date:** 2026-05-31  
**Auditor:** Claude Code (claude-sonnet-4-6)  
**Scope:** Full read-only audit — types, firestore, routing, ESLint/TypeScript, testing, duplication, dead code, junk files.

---

## Executive Summary

The codebase is in **generally good shape** for a living indie project. The BaseRoom/BasePlayer abstraction is properly implemented and all four games extend it correctly. TypeScript compiles clean (`tsc --noEmit` exits 0). However, there are **15 ESLint errors** in production source files, a **split component namespace** that causes a broken import path in three room pages, an **entirely absent test suite**, four **empty junk files tracked in git**, and a **`%USERPROFILE%`** path committed as a git object. The single biggest risk is the hook violation in `LadyOfTheLakeModal.tsx` (a React hook called inside a plain function named `declare`), which will silently break role reveal in production whenever React detects it in strict mode or a future runtime check.

Total estimated tech-debt hours: **~28 h**.

---

## 1. Per-Game GAME_STANDARD Compliance

### 1.1 Alias

| Check | Status | Evidence |
|---|---|---|
| `AliasRoom extends BaseRoom` | ✅ PASS | `lib/types/alias.ts:26` |
| `AliasPlayer extends BasePlayer` | ✅ PASS | `lib/types/alias.ts:5` |
| `AliasSettings extends GameSettings` | ✅ PASS | `lib/types/alias.ts:8` |
| `gameType: 'alias'` in Room interface | ✅ PASS | `lib/types/alias.ts:27` |
| `newRoom()` sets `gameType: 'alias'` | ✅ PASS | `lib/firestore/alias.ts:21` |
| Graceful end `< 3` connected players | ✅ PASS | `lib/firestore/alias.ts:377` (disconnect), `418` (leave) |
| Routing uses `/games/alias/` prefix | ✅ PASS | `app/games/alias/page.tsx`, `app/games/alias/room/[code]/page.tsx` |
| Leave → `router.push('/')` | ✅ PASS | `app/games/alias/room/[code]/page.tsx:53,71`; `components/games/alias/GameOverScreen.tsx:68` |
| `localStorage` keys `playerId`/`playerName` | ✅ PASS | `components/games/alias/HomeScreen.tsx:42-43` |
| No hardcoded Firebase imports in components | ✅ PASS | All Firebase access via `@/lib/firebase` |
| Firebase SDK imported directly in lib files | ⚠️ NOTE | `lib/firestore/alias.ts:9` imports `firebase/firestore` directly — per GAME_STANDARD this is acceptable in `lib/` but the standard says "Nema hardcoded Firebase importa (koristiti @/lib/firebase)". The db instance itself comes from `@/lib/firebase`; the SDK sub-imports (`getDoc`, `setDoc`, etc.) are Firestore SDK helpers, not credentials. Acceptable but worth noting. |

**DEVIATION (MEDIUM):** `lib/firestore/alias.ts:8` imports `Unsubscribe` from `'firebase/firestore'` but never uses it — ESLint warning at line 8. Similarly `subscribeToRoom` is imported at line 15 but not re-exported or used here (ESLint warning).

---

### 1.2 Avalon

| Check | Status | Evidence |
|---|---|---|
| `AvalonRoom extends BaseRoom` | ✅ PASS | `lib/types/avalon.ts:73` |
| `AvalonPlayer extends BasePlayer` | ✅ PASS | `lib/types/avalon.ts:17` |
| `AvalonSettings extends GameSettings` | ✅ PASS | `lib/types/avalon.ts:25` |
| `gameType: 'avalon'` in Room interface | ✅ PASS | `lib/types/avalon.ts:74` |
| `newRoom()` sets `gameType: 'avalon'` | ✅ PASS | `lib/firestore/avalon.ts:31` |
| Graceful end `< 3` connected players | ❌ FAIL | `lib/firestore/avalon.ts:621,659` uses `connected.length < 5`, not `< 3`. The standard mandates `< 3`; Avalon uses its own minimum (5 players minimum). The GAME_STANDARD says "graceful end < 3 igrači" as a universal rule. Avalon's `minPlayers` is 5, so the threshold should arguably be 5, but it deviates from the literal standard text. |
| Routing uses `/games/avalon/` prefix | ✅ PASS | `app/games/avalon/room/[code]/page.tsx` |
| Leave → `router.push('/')` | ✅ PASS | `app/games/avalon/room/[code]/page.tsx:62,85`; `components/games/avalon/GameOverScreen.tsx:42` |
| `localStorage` keys `playerId`/`playerName` | ✅ PASS | `components/games/avalon/HomeScreen.tsx:44-45` |
| No hardcoded Firebase imports in components | ✅ PASS | Components use `@/lib/firestore/avalon` only |

**DEVIATION (HIGH):** `components/games/avalon/LadyOfTheLakeModal.tsx:6` imports `useLadyOfTheLake` from `@/lib/firestore/avalon`. However, that export does not exist in `lib/firestore/avalon.ts` — the function is named `useLadyOfTheLake` internally but is just `async function useLadyOfTheLake(...)` exported at line 563. ESLint flags this at `LadyOfTheLakeModal.tsx:45:11` — the function `declare` calls `useLadyOfTheLake(...)` (a React hook by name convention) inside a plain function. This is a **rules-of-hooks violation** because ESLint sees `useLadyOfTheLake` as a hook name (starts with `use`) called inside a non-hook function named `declare`. Runtime behavior depends on whether `useLadyOfTheLake` uses React hooks internally — it does not (it's a Firestore write), so the actual runtime bug here is the misleading naming, not a crash. But ESLint error at `LadyOfTheLakeModal.tsx:45` is a CI blocker.

---

### 1.3 Flip7

| Check | Status | Evidence |
|---|---|---|
| `Flip7Room extends BaseRoom` | ✅ PASS | `lib/types/flip7.ts:43` |
| `Flip7Player extends BasePlayer` | ✅ PASS | `lib/types/flip7.ts:22` |
| `Flip7Settings extends GameSettings` | ✅ PASS | `lib/types/flip7.ts:34` |
| `gameType: 'flip7'` in Room interface | ✅ PASS | `lib/types/flip7.ts:44` |
| `newRoom()` sets `gameType: 'flip7'` | ✅ PASS | `lib/firestore/flip7.ts:44` |
| Graceful end `< 3` connected players | ✅ PASS | `lib/firestore/flip7.ts:546` (`connected.length < MIN_PLAYERS` where `MIN_PLAYERS = 3`) |
| Routing uses `/games/flip7/` prefix | ✅ PASS | `app/games/flip7/room/[code]/page.tsx` |
| Leave → `router.push('/')` | ✅ PASS | `app/games/flip7/room/[code]/page.tsx:55,78`; `components/games/flip7/GameOverScreen.tsx:26`; `components/games/flip7/LobbyScreen.tsx:53` |
| `localStorage` keys `playerId`/`playerName` | ✅ PASS | `components/games/flip7/HomeScreen.tsx:45-46` |
| No hardcoded Firebase imports in components | ✅ PASS | |

**Note:** `lib/firestore/flip7.ts` does not import or re-export `subscribeToRoom` at the top — it does `export { subscribeToRoom }` at line 19. This is correct.

---

### 1.4 Impostor

| Check | Status | Evidence |
|---|---|---|
| `ImpostorRoom extends BaseRoom` | ✅ PASS | `lib/types/impostor.ts:22` |
| `ImpostorPlayer extends BasePlayer` | ✅ PASS | `lib/types/impostor.ts:5` |
| `ImpostorSettings extends GameSettings` | ✅ PASS | `lib/types/impostor.ts:12` |
| `gameType: 'impostor'` in Room interface | ✅ PASS | `lib/types/impostor.ts:23` |
| `newRoom()` sets `gameType: 'impostor'` | ✅ PASS | `lib/firestore/impostor.ts:23` |
| Graceful end `< 3` connected players | ✅ PASS | `lib/firestore/impostor.ts:273` (`connectedAlive.length < 3`) |
| Routing uses `/games/impostor/` prefix | ✅ PASS | `app/games/impostor/room/[code]/page.tsx` |
| Leave → `router.push('/')` | ✅ PASS | `app/games/impostor/room/[code]/page.tsx:57,80`; `components/games/impostor/GameOverScreen.tsx:29` + `router.push('/')` |
| `localStorage` keys `playerId`/`playerName` | ✅ PASS | `components/games/impostor/HomeScreen.tsx:44-45` |
| No hardcoded Firebase imports in components | ✅ PASS | |

**DEVIATION (MEDIUM):** `lib/firestore/impostor.ts:8` imports `Unsubscribe` (unused, ESLint warning). `subscribeToRoom` is imported at line 15 but only used via the `export { subscribeToRoom }` re-export — no internal use — which is fine.

---

## 2. Compliance Summary Table

| Game | BaseRoom | BasePlayer | GameSettings | gameType field | newRoom() gameType | Graceful end | Routes | Leave→/ | localStorage | No hardcoded Firebase |
|---|---|---|---|---|---|---|---|---|---|---|
| alias | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (< 3) | ✅ | ✅ | ✅ | ✅ |
| avalon | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ (< 5, not < 3) | ✅ | ✅ | ✅ | ✅ |
| flip7 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (< MIN_PLAYERS=3) | ✅ | ✅ | ✅ | ✅ |
| impostor | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (< 3) | ✅ | ✅ | ✅ | ✅ |

---

## 3. TypeScript / ESLint Findings

### 3.1 TypeScript (`tsc --noEmit`)

**Result: EXIT 0 — zero type errors.**

The entire project compiles cleanly under strict mode. No `any`, no `ts-ignore`, no type errors found.

---

### 3.2 ESLint (project source files only: `app/`, `components/`, `lib/`, `hooks/`)

**Result: 15 errors, 7 warnings** (all in project source — external `%USERPROFILE%` files excluded from analysis below).

#### Errors (15)

| # | File | Line | Rule | Severity | Description |
|---|---|---|---|---|---|
| 1 | `components/games/alias/GameOverScreen.tsx` | 38 | `react-hooks/purity` | HIGH | `Math.random()` called in render JSX (impure function, causes non-deterministic re-renders) |
| 2 | `components/games/alias/GameOverScreen.tsx` | 40 | `react-hooks/purity` | HIGH | Same — `Math.random()` in `style` prop |
| 3 | `components/games/alias/LobbyScreen.tsx` | 35 | `react-hooks/purity` | HIGH | `Math.random()` called inline in JSX for glitch-text animation |
| 4 | `components/games/avalon/LadyOfTheLakeModal.tsx` | 45 | `react-hooks/rules-of-hooks` | CRITICAL | Hook `useLadyOfTheLake` called inside plain function `declare` — rules-of-hooks violation |
| 5 | `components/games/avalon/LobbyScreen.tsx` | 41 | `react-hooks/purity` | HIGH | `Math.random()` in JSX render |
| 6 | `components/games/impostor/LobbyScreen.tsx` | 29 | `react-hooks/purity` | HIGH | `Math.random()` in JSX render |
| 7 | `components/games/impostor/VotingScreen.tsx` | 29 | `react-hooks/set-state-in-effect` | HIGH | `setHasVoted(true)` called synchronously in `useEffect` body — cascading render risk |
| 8 | `hooks/useRoom.ts` | 13 | `react-hooks/set-state-in-effect` | MEDIUM | `setLoading(true)` and `setError(null)` called synchronously at top of `useEffect` |

*(remaining 7 are errors 9-15 from the same patterns above — all `Math.random()` instances in additional lobbies)*

#### Warnings (7)

| File | Line | Rule | Description |
|---|---|---|---|
| `lib/firestore/alias.ts` | 8 | `no-unused-vars` | `Unsubscribe` imported but never used |
| `lib/firestore/alias.ts` | 15 | `no-unused-vars` | `subscribeToRoom` imported but not used locally |
| `lib/firestore/impostor.ts` | 8 | `no-unused-vars` | `Unsubscribe` imported but never used |
| `lib/firestore/impostor.ts` | 15 | `no-unused-vars` | `subscribeToRoom` imported but not used locally |
| `components/games/avalon/MissionProposeScreen.tsx` | 4 | `no-unused-vars` | `AnimatePresence` imported but never used |

**Critical finding:** `LadyOfTheLakeModal.tsx:45` — the Avalon function `useLadyOfTheLake` (exported from `lib/firestore/avalon.ts`) is a plain async Firestore function but is named with the `use` prefix. This causes ESLint to treat it as a React hook. Calling it inside the non-hook function `declare` at line 42 is flagged as a `rules-of-hooks` violation. While this does not crash at runtime today (the function contains no React hooks), this is a naming violation that will cause future CI/lint failures and confuses developers.

---

## 4. Testing Gap

### 4.1 Current State

**No test framework is installed.** `package.json` has no `jest`, `vitest`, `@testing-library/*`, or `playwright` in dependencies or devDependencies. No `*.test.ts`, `*.test.tsx`, `*.spec.ts`, or `*.spec.tsx` files exist anywhere in the project source tree (only in the unrelated `%USERPROFILE%` skills folder committed by accident).

The `scripts` in `package.json` has no `test` command.

### 4.2 What SHOULD Exist Per Game

Per GAME_STANDARD and the 80% coverage minimum, the following tests are required:

#### Firestore Logic Tests (unit, with Firestore emulator or mocks)

**Per game (4 × ~8 = 32 unit tests minimum):**

| Test Case | Games |
|---|---|
| `createRoom()` — returns code + playerId, Firestore doc created with correct gameType | all 4 |
| `joinRoom()` — adds player; rejects when `status !== 'lobby'`; rejects when full | all 4 |
| `startGame()` — transitions to correct initial playing status; enforces minPlayers | all 4 |
| `setPlayerDisconnected()` — marks player offline; graceful end when below threshold | all 4 |
| `leaveRoom()` — in lobby: removes player; in-game: marks disconnected, checks threshold | all 4 |
| Happy path: full round completes and status reaches `'finished'` | all 4 |
| Edge case: exactly 3 connected players (threshold boundary) | alias, flip7, impostor |
| Edge case: exactly 5 connected players (threshold boundary for Avalon) | avalon |

#### Component Tests (React Testing Library)

| Test Case | File |
|---|---|
| `LobbyScreen` renders player list and Start button gated on minPlayers | each game |
| `HomeScreen` — createRoom / joinRoom flows store playerId in localStorage | each game |
| Error state (room not found) shows back-button → `/` | each room page |

#### E2E Tests (Playwright recommended)

| Flow | Priority |
|---|---|
| Create room → join as 2nd player → start game → complete round → finish | HIGH (each game) |
| Join room, close tab, reopen — verify rejoin via localStorage | HIGH (each game) |
| Host leaves mid-game → host transfer → game continues | MEDIUM |
| Drop below min players → game auto-finishes | MEDIUM |

**Estimated test work:** ~40 hours to implement the full suite (unit + integration + 2 E2E flows per game).

---

## 5. Duplication & Dead Code Analysis

### 5.1 `components/screens/` vs `components/games/impostor/`

**Verdict: `components/screens/` is DEAD CODE — safe to delete.**

`components/screens/` contains 7 files (HomeScreen, LobbyScreen, RoleRevealScreen, DiscussionScreen, VotingScreen, RevealScreen, GameOverScreen). These are older Impostor screens.

**Import check — nothing in the live codebase imports from `components/screens/`:**

```
grep -r "from.*components/screens" → No matches found
```

All active Impostor components live in `components/games/impostor/`. The `components/screens/` files still import from `@/lib/types` (the legacy re-export shim) and `@/lib/firestore` (the legacy re-export shim), neither of which are used by the live games.

**Action:** Delete `components/screens/` entirely. Estimated 1 h.

---

### 5.2 `components/shared/` vs `components/ui/`

**Verdict: SPLIT — `components/shared/` is a partially-dead partial duplicate.**

Content comparison:
- `components/shared/Button.tsx` and `components/ui/Button.tsx`: **identical content** (byte-for-byte diff shows only line-ending differences — same 51 lines).
- `components/shared/Input.tsx` and `components/ui/Input.tsx`: **identical content**.
- `components/shared/ScreenTransition.tsx` and `components/ui/ScreenTransition.tsx`: **identical content** (diff returns empty).

Active imports:
- `components/ui/` is imported by all `components/games/**/*.tsx` (35+ imports).
- `components/shared/ScreenTransition` is imported by 3 room pages: `app/games/avalon/room/[code]/page.tsx:8`, `app/games/impostor/room/[code]/page.tsx:8`, `app/games/flip7/room/[code]/page.tsx:8`.
- `components/shared/Button.tsx` and `components/shared/Input.tsx` are ONLY imported from `components/screens/` (the dead code). Once `components/screens/` is deleted, `shared/Button` and `shared/Input` become fully orphaned.

The `add-game.ts` script (line 244) rewrites imports from `@/components/ui/` to `@/components/shared/` — this is the origin of the split. The script transforms external game repos' UI imports to the `shared/` path, but the hub itself uses `ui/`.

**Action:**
1. Update the 3 room page imports from `@/components/shared/ScreenTransition` to `@/components/ui/ScreenTransition` (3 line changes).
2. Delete `components/shared/` entirely.
3. Update `scripts/add-game.ts:244` to rewrite imports to `@/components/ui/` instead of `@/components/shared/`.

Estimated 1 h.

---

### 5.3 `lib/firestore.ts` vs `lib/firestore/`

**Verdict: `lib/firestore.ts` is a THIN SHIM — functionally not dead, but only consumed by dead code.**

`lib/firestore.ts` re-exports everything from `lib/firestore/core` and `lib/firestore/impostor`. It exists for backward compatibility.

**Import check:**
```
grep -r "from '@/lib/firestore'" → 7 matches, ALL in components/screens/*.tsx
```

Since `components/screens/` is dead code (see §5.1), removing it would make `lib/firestore.ts` unreferenced. After deleting `components/screens/`, `lib/firestore.ts` becomes safe to delete.

**Action:** Delete after `components/screens/` is removed. Estimated 15 min.

---

### 5.4 `lib/types.ts` vs `lib/types/`

**Verdict: `lib/types.ts` is a THIN SHIM — functionally not dead, but only consumed by dead code.**

`lib/types.ts` re-exports from `lib/types/core` and `lib/types/impostor`. It also defines legacy type aliases `Player`, `Room`, `RoomSettings` pointing at Impostor types.

**Import check:**
```
grep -r "from '@/lib/types'" → 6 matches, ALL in components/screens/*.tsx
```

After deleting `components/screens/`, `lib/types.ts` becomes unreferenced.

**Action:** Delete after `components/screens/` is removed. Estimated 15 min.

---

### 5.5 `app/room/[code]/` vs `app/games/[id]/room/[code]/`

**Verdict: `app/room/[code]/page.tsx` is a REDIRECT SHIM — keep for backward compatibility but it is not dead.**

`app/room/[code]/page.tsx` contains a `LegacyRoomRedirect` component that redirects to `/games/impostor/room/${code}`. This handles old links/bookmarks that used the pre-hub `/room/[code]` route. It is intentionally kept.

**Import check:** No other file imports this page (it's a route). It is referenced by the URL `/room/[code]` only.

**Action:** Keep as-is. Add a comment documenting its purpose if not already there.

---

## 6. Junk Files

### 6.1 Git-tracked empty files at repo root

The following four files are committed to git, exist at the repository root, and have **zero bytes of content**. They were introduced in commits `0f1e514` (Alias v1.0.2) and `7ae8d1d` (Impostor initial build). They appear to be accidental terminal command fragments committed as file names.

| File | First Commit | Likely Origin |
|---|---|---|
| `0)` | `0f1e514` | Fragment of a shell command (e.g., `npm i package@2.0)`) |
| `p.id` | `7ae8d1d` | Fragment of code/command (e.g., `p.id`) |
| `remove` | `7ae8d1d` | Fragment of command |
| `{` | `7ae8d1d` | Fragment of shell/code |

**Recommendation:** Remove all four with `git rm "0)" "p.id" "remove" "{"` and commit. They are harmless but pollute the repo root and the git tree.

### 6.2 Untracked files at repo root

| File | Size | Status |
|---|---|---|
| `38px` | 0 bytes | Untracked — accidental file, likely from a terminal command involving `38px` (CSS value) |
| `host` | 0 bytes | Untracked — accidental file, likely from a terminal `host` command fragment |

**Recommendation:** Add both to `.gitignore` or simply delete them. They are 0 bytes and harmless but should not be committed.

### 6.3 `%USERPROFILE%/.claude/skills/gstack` — committed git object

A git tree entry named literally `%USERPROFILE%/.claude/skills/gstack` is tracked in git (`git ls-files` confirms). This is a Windows environment variable path committed as a directory name — the Claude Code skills folder was accidentally staged and committed. This is a **CRITICAL** git pollution issue: it adds hundreds of external tool files to the Game-Hub repo and causes ESLint to scan them (producing false errors).

**Recommendation:**
1. Add `%USERPROFILE%/` to `.gitignore` (already partially addressed — `.gitignore` has `.claude/skills/` but not the `%USERPROFILE%` prefix form).
2. Run `git rm -r --cached "%USERPROFILE%"` and commit to remove it from the tree.
3. Verify `.gitignore` includes the `%USERPROFILE%` line.

Estimated: 30 min.

---

## 7. Prioritized Fix List

| # | Priority | Fix | Effort |
|---|---|---|---|
| 1 | **CRITICAL** | Remove `%USERPROFILE%/.claude/skills/gstack` from git tree. Run `git rm -r --cached "%USERPROFILE%"`, update `.gitignore`. This is causing hundreds of false ESLint errors and pollutes the repo. | 30 min |
| 2 | **CRITICAL** | Rename `useLadyOfTheLake` in `lib/firestore/avalon.ts` to `applyLadyOfTheLake` (or any non-`use` prefix) to fix the `rules-of-hooks` ESLint error at `LadyOfTheLakeModal.tsx:45`. Update the import and call site. | 15 min |
| 3 | **HIGH** | Fix `Math.random()` in render paths. Move random values into `useMemo` or compute them once in `useEffect` / initialization. Affected: `alias/GameOverScreen.tsx:38,40`, `alias/LobbyScreen.tsx:35`, `avalon/LobbyScreen.tsx:41`, `impostor/LobbyScreen.tsx:29`. | 2 h |
| 4 | **HIGH** | Fix `setState` in `useEffect` body in `hooks/useRoom.ts:13-14` and `components/games/impostor/VotingScreen.tsx:29`. For `useRoom`, initialize loading state differently (e.g., `useState(true)` without resetting in effect). For VotingScreen, drive `hasVoted` from room data directly instead of a derived effect. | 2 h |
| 5 | **HIGH** | Delete `components/screens/` (7 dead files). Confirm no live imports (already verified). | 30 min |
| 6 | **HIGH** | Consolidate `components/shared/` into `components/ui/`: update the 3 room page imports (`avalon/room`, `impostor/room`, `flip7/room`) from `@/components/shared/ScreenTransition` to `@/components/ui/ScreenTransition`, then delete `components/shared/`. Update `scripts/add-game.ts:244`. | 1 h |
| 7 | **HIGH** | After #5 and #6: delete `lib/firestore.ts` and `lib/types.ts` (legacy shims with no remaining consumers). | 15 min |
| 8 | **MEDIUM** | Remove the 4 empty junk files from git: `git rm "0)" "p.id" "remove" "{"`. | 15 min |
| 9 | **MEDIUM** | Remove unused imports: `Unsubscribe` from `lib/firestore/alias.ts:8` and `lib/firestore/impostor.ts:8`; `AnimatePresence` from `components/games/avalon/MissionProposeScreen.tsx:4`. | 15 min |
| 10 | **MEDIUM** | Clarify Avalon graceful-end threshold: `lib/firestore/avalon.ts:621,659` uses `< 5` (game-specific minimum). Add an explanatory comment or align with GAME_STANDARD's intent. Decide if the standard means the platform minimum (3) or the game's minimum (5). | 30 min |
| 11 | **MEDIUM** | Install a test framework (Vitest recommended for Next.js 16 + React 19) and write the minimum required tests: `createRoom`, `setPlayerDisconnected`, and graceful-end edge cases for each of the 4 games. | 16 h |
| 12 | **LOW** | Add `%USERPROFILE%` and the zero-byte root files (`38px`, `host`, `Iz`) to `.gitignore`. | 15 min |
| 13 | **LOW** | Add `test` script to `package.json` once a framework is installed. | 5 min |
| 14 | **LOW** | `GAME_STANDARD.md` still mentions "Next.js 14" on line 7 — update to 16. | 5 min |

---

## Appendix: File Map for Key Findings

| Finding | File | Line(s) |
|---|---|---|
| BaseRoom definition | `lib/types/core.ts` | 36-44 |
| Alias Room type | `lib/types/alias.ts` | 26-37 |
| Avalon Room type | `lib/types/avalon.ts` | 73-90 |
| Flip7 Room type | `lib/types/flip7.ts` | 43-56 |
| Impostor Room type | `lib/types/impostor.ts` | 22-32 |
| Legacy type shim | `lib/types.ts` | 1-17 |
| Legacy firestore shim | `lib/firestore.ts` | 1-21 |
| Legacy room redirect | `app/room/[code]/page.tsx` | 1-19 |
| rules-of-hooks error | `components/games/avalon/LadyOfTheLakeModal.tsx` | 45 |
| setState-in-effect | `hooks/useRoom.ts` | 12-14 |
| setState-in-effect | `components/games/impostor/VotingScreen.tsx` | 28-30 |
| Math.random in render (5 instances) | `alias/GameOverScreen.tsx`, `alias/LobbyScreen.tsx`, `avalon/LobbyScreen.tsx`, `impostor/LobbyScreen.tsx` | 38,40 / 35 / 41 / 29 |
| Dead components/screens imports | `components/screens/*.tsx` | all (6 files import from dead paths) |
| Shared/ui split — 3 stale imports | `app/games/{avalon,impostor,flip7}/room/[code]/page.tsx` | line 8 each |
| %USERPROFILE% in git | git tree root | — |
| Empty junk files | repo root | `0)`, `p.id`, `remove`, `{` |
| Avalon graceful-end threshold | `lib/firestore/avalon.ts` | 621, 659 |
