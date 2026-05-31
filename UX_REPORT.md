# Game-Hub UX & Frontend Report

Generated: 2026-05-31  
Stack: Next.js 16.2, React 19, Tailwind 4, Framer Motion, Space Grotesk  
Platform: Mobile-first (375px primary), all games played on phones.

---

## Executive Summary

Game-Hub is a well-structured, mobile-first party-game platform with a strong visual identity and consistent technical patterns. The biggest wins are: `dvh` is used almost everywhere via `h-screen-safe`, Framer Motion spring config is mostly standardised, Space Grotesk is loaded globally, and every room page has proper loading/error/not-in-room guards.

The main pain points are:

1. **Fixed `pt-20` top padding in all Flip7 screens** — the global header is 48 px tall but `pt-20` (80 px) is not responsive; on small phones content is pushed uncomfortably far down with no explanation.
2. **Zero ARIA labelling inside game screens** — all interactive elements inside game screens (voting buttons, player-select buttons, kick button, timer controls, prompt hold-button) have no `aria-label`, `role`, or screen-reader context. The hub's `GameGallery` does add `aria-label` to cards but the games themselves have none.
3. **`components/shared/` is a dead-code duplicate** — `shared/Button.tsx`, `shared/Input.tsx`, and `shared/ScreenTransition.tsx` are byte-for-byte copies of their `components/ui/` counterparts. Only the `ui/` versions are used in actual game screens; `shared/` is stale.
4. **Alias `HomeScreen` uses raw `<input>` and `<button>` instead of the shared `Input`/`Button` components** — the only game that breaks component reuse.
5. **`scanline` keyframe uses `translateY(100vh)` instead of `100dvh`** — minor correctness issue on mobile Safari.
6. **Cross-game coherence is high** (8/10): lobby pattern, room-code decrypt animation, countdown overlay, and game-over actions are structurally identical; accent colours differ by game which is intentional.

---

## 1. Design-System Consistency

### Per-Game Token Compliance Table

| Token / Requirement | Impostor | Avalon | Alias | Flip7 |
|---|---|---|---|---|
| `bg: #080b14` via `var(--bg-base)` | ✓ LobbyScreen style | ✗ Not set (inherits body) | ✓ ExplainingScreen, RoundStartScreen | ✗ Not set |
| Surface `#0f1320` / `#161b2e` | Partial (inline rgba) | Partial | Not used | Not used |
| Accent violet `#8b5cf6` | ✓ (primary) | ✗ Amber override (`#d97706`) | ✗ Cyan override (`#0891b2`) | ✗ Amber override (`#f59e0b`) |
| Space Grotesk | ✓ (global font) | ✓ | ✓ | ✓ |
| Spring stiffness:300 damping:20 | ✓ (mostly) | ✓ (mostly) | ✓ | ✓ |
| `dvh` via `h-screen-safe` | ✓ | ✓ | ✓ | ✓ |
| `useReducedMotion` respected | Partial (hub only) | ✗ Not used in game screens | ✗ | ✗ Only Flip7Card |

### Specific Inconsistencies

**Background colour**  
- `components/games/avalon/LobbyScreen.tsx:82` — no background set; the body's `bg-background` (shadcn default, light okclh!) would show through if CSS cascade changes.  
- `components/games/flip7/LobbyScreen.tsx:57`, `GameScreen.tsx:54`, `GameOverScreen.tsx:30` — same issue: no `background: var(--bg-base)`.  
- Compare: `components/games/alias/ExplainingScreen.tsx:98` and `components/games/impostor/LobbyScreen.tsx:63` correctly set `style={{ background: 'var(--bg-base)' }}`.

**Accent colour deviations**  
The standard says games "can have their own accent" so amber/cyan are intentional. However the Button component always defaults to `bg-violet-600` (the platform accent), requiring every game that uses amber/cyan to pass `className="!bg-amber-500 ..."` overrides — noisy, and easy to forget. There is no per-game accent prop.

**`DecryptCode` component is copy-pasted three times**  
- `components/games/impostor/LobbyScreen.tsx:16–34`  
- `components/games/avalon/LobbyScreen.tsx:22–46`  
- `components/games/alias/LobbyScreen.tsx:16–39`  
Identical logic, different accent colour only. Should be extracted to `components/shared/DecryptCode.tsx` with an `accent` prop.

**`fadeIn` / `shake` animation helpers are copy-pasted four times**  
- `components/games/impostor/HomeScreen.tsx:10–19`  
- `components/games/avalon/HomeScreen.tsx:10–19`  
- `components/games/alias/HomeScreen.tsx:8–17`  
- `components/games/flip7/HomeScreen.tsx:8–19`  
Identical. Should live in a shared util.

**`scanline` keyframe uses `vh` not `dvh`**  
`app/globals.css:232` — `100% { transform: translateY(100vh); }` — the scanline animation destination should use `100dvh`. Also `app/globals.css:102` — the `@supports not (height: 100dvh)` fallback path correctly falls back to `100vh`, but the animation keyframe always uses `vh`.

**shadcn `:root` defines light theme colours**  
`app/globals.css:277–316` — the `:root` block sets `--background: oklch(1 0 0)` (white) and `--foreground: oklch(0.145 0 0)` (near-black). The body applies `@apply bg-background text-foreground`. The dark custom-property overrides in `body { style={{ background: 'var(--bg-base)' }} }` in `layout.tsx` work, but any screen that forgets to set its own background will show a white flash on first render. **The `.dark` class is never applied anywhere**, so shadcn components (accordion, etc.) render in light mode if they fall back to CSS variables.

---

## 2. Mobile Experience (375px)

### Fixed `pt-20` in all Flip7 screens — CRITICAL

All four Flip7 game screens add `pt-20` (80px) of top padding to clear the fixed header:

- `components/games/flip7/LobbyScreen.tsx:57` — `px-6 pt-20 pb-10`  
- `components/games/flip7/GameScreen.tsx:56` — `px-5 pt-20 pb-3`  
- `components/games/flip7/RoundEndScreen.tsx:27` — `px-6 pt-20 pb-10`  
- `components/games/flip7/GameOverScreen.tsx:30` — `px-6 pt-20 pb-10`  

The fixed header in `app/layout.tsx:41` is `top-3` (12px) + `py-2.5` (20px) ≈ 52px total height. `pt-20` = 80px, which is 28px of unnecessary dead space. On a 375×667 iPhone SE this burns ~12% of the visible game area before any content appears.

Other games use `py-8` (32px) or `py-10` (40px) which is generous but not excessive. The inconsistency also means game screens look different in vertical rhythm when switching between games.

### Header overlap risk

The global fixed header (`layout.tsx:41–60`) uses `top-3 left-4 right-4`. No game screen sets `padding-top` to account for this on screens that use `h-screen-safe overflow-hidden` — e.g.:

- `components/games/avalon/NightPhaseScreen.tsx:88` — `px-8 h-screen-safe overflow-hidden` with no top offset. The header visually overlaps the "Noćna faza" label.
- `components/games/avalon/MissionVoteScreen.tsx:45` — same.
- `components/games/avalon/QuestPhaseScreen.tsx:46` — same.
- `components/games/avalon/AssassinateScreen.tsx:39` — same.
- `components/games/avalon/RoleRevealScreen.tsx:115` — same.
- `components/games/avalon/MissionProposeScreen.tsx:44` — has `py-10` which gives 40px. Header is ~52px. Content starts behind header.
- `components/games/impostor/HomeScreen.tsx:71` — `px-8 h-screen-safe overflow-hidden` no top padding. The 48px emoji is behind the header on 375px.
- `components/games/alias/HomeScreen.tsx:69` — same, no top padding.
- `components/games/avalon/HomeScreen.tsx:71` — same.
- `components/games/flip7/HomeScreen.tsx:76` — same.

All four `HomeScreen` components lack any top-safe-area clearance. The `h1` "Impostor/Alias/Avalon/Flip 7" title at 48px will be partially hidden behind the 52px header on real devices.

### Touch target sizes

The `Button` component enforces `min-h-[44px]` ✓. The shared `Input` enforces `min-h-[44px]` ✓.

Problematic small touch targets:

- `components/ui/PlayerCard.tsx:78` — kick button (grid variant): `w-5 h-5` = 20×20px. `touch-show` makes it visible on touch devices but 20px is below the 44px minimum.  
- `components/ui/PlayerCard.tsx:116` — kick button (list variant): `w-8 h-8` = 32×32px — below 44px.  
- `components/games/impostor/LobbyScreen.tsx:70–74` — room code copy button: `<button>` wrapping a `text-[36px]` span, no explicit height. Touch area depends on line height.  
- `components/games/avalon/LobbyScreen.tsx:89` — same: room code copy button.  
- `components/games/avalon/LobbyScreen.tsx:163–175` — role toggles: `py-3 px-3` = ~44px height ✓ but `py-3` ≈ 24px. With 13px text and 12px padding each side this is ~48px total. Acceptable but narrow.  
- `components/games/impostor/DiscussionScreen.tsx:52–58` — timer toggle: `text-[10px]` text button with no height constraint — likely under 20px.  
- `components/games/impostor/VotingScreen.tsx:130–137` — vote options: `py-3.5` with text-sm gives ~44px ✓ but `"Preskoči glasanje"` skip button at line 151–155 has only `py-3 text-[11px]` ≈ 34px — below 44px.

### Text size concerns

The label text `text-[10px]`, `text-[9px]`, `text-[8px]` appears throughout. WCAG requires minimum 12px for body copy at normal contrast ratios:

- `components/games/impostor/GameOverScreen.tsx:73` — `text-[9px]` for "Deklasifikovani agenti" label.
- `components/games/impostor/GameOverScreen.tsx:106` — `text-[10px]` for "impostor/crewmate" label.
- `components/games/alias/GameOverScreen.tsx:118` — `text-[10px]` for score labels.
- `components/hub/GameCard.tsx:77` — `text-[10px]` "Uskoro" badge.
- Multiple lobby screens: `text-[10px]` section labels (e.g., "PRISTUPNI KOD", "VITEZOVI").

These are primarily decorative labels so not a hard WCAG failure, but on real phones at 375px they are genuinely hard to read.

### Alias ExplainingScreen SVG timer layout

`components/games/alias/ExplainingScreen.tsx:130` — the timer SVG is `width="144" height="144"`, which is 38% of a 375px screen width. Paired with the score section, the row at line 127 uses `flex items-center justify-between`. On a 320px wide iPhone SE (narrower than 375px), the row will be very tight.

---

## 3. Accessibility

### Semantic HTML — game screens are div-soup

No game screen uses semantic landmarks (`<main>`, `<section>`, `<header>`, `<nav>`). Every screen root is a `<div>`. The room page wrappers are `<div>` too.

### Missing ARIA on interactive elements

The hub `GameGallery.tsx:266` correctly sets `aria-label` on carousel buttons. But inside game screens:

- **All voting buttons** (Impostor `VotingScreen.tsx:130–138`, Avalon `MissionVoteScreen.tsx:81–96`, `QuestPhaseScreen.tsx:97–110`, `AssassinateScreen.tsx:78–101`) — plain `<button>` or `<motion.button>` with only emoji/text children. No `aria-label`. When the label is just "✓ Odobri" or "✗ Odbij" a screen reader reads the checkmark characters literally.
- **Player-select buttons** (Avalon `MissionProposeScreen.tsx:113`, `AssassinateScreen.tsx:78`) — `<motion.button>` contains a custom radio-circle div + name text. No `role="radio"` or `aria-checked`. Screen readers see an anonymous button.
- **Lobby kick button** (`components/ui/PlayerCard.tsx:78`, `115`) — `<button>` with an inline SVG "X" and no `aria-label`. Screen reader says nothing meaningful.
- **Room code copy button** (all four lobby screens) — anonymous `<button>` wrapping the code display. No `aria-label="Kopiraj kod"`.
- **Role reveal hold area** (`components/games/avalon/RoleRevealScreen.tsx:139`) — `<motion.div>` with `onPointerDown`. Not a `<button>`, not keyboard accessible. A keyboard user cannot reveal their role.
- **Impostor discussion prompt** (`components/games/impostor/DiscussionScreen.tsx:63`) — `<motion.button>` with `onPointerDown`/`onPointerUp` to show/hide text. Keyboard users can focus it, but there is no `aria-pressed` or `aria-label`.
- **Flip7 player target buttons** (`components/games/flip7/GameScreen.tsx:128–142`) — action buttons to select a target have `{p.id === playerId ? 'Ti' : p.name}` as text. No `aria-label`.

### Focus management

- `focus-visible` ring is defined globally in `globals.css:267–271` ✓.
- `Button.tsx:37` has `focus-visible:outline-2 focus-visible:outline-violet-500/70` ✓.
- **Role reveal card** (`avalon/RoleRevealScreen.tsx:139`) — `<motion.div>` is not focusable. Should be `<button>` or have `tabIndex={0}` and keyboard handlers.
- **Hub desktop card** (`GameGallery.tsx:322`) — correctly uses `role="button" tabIndex={0}` with `onKeyDown` ✓.

### `prefers-reduced-motion`

- `globals.css:258–265` — CSS rule kills all animations globally for `prefers-reduced-motion`. This is correct and aggressive.  
- `GameGallery.tsx` and `Flip7Card.tsx` both use `useReducedMotion()` from Framer Motion ✓.  
- **No other game component uses `useReducedMotion()`** — all the Framer Motion animations in Impostor, Avalon, and Alias screens will technically still be suppressed by the CSS rule (since Framer Motion injects `transition` and `animation` properties), but the JavaScript timer callbacks, countdown effects, and shimmer sweeps are not affected by the CSS rule. The breathing orb background animation is correctly suppressed (`display: none` via CSS), but Alias's shimmer sweep (`ExplainingScreen.tsx:201–204`) and confetti particles (`GameOverScreen.tsx:33–45`) will still run in reduced-motion contexts.

### Colour contrast risks

All text on the dark background (#080b14) uses `text-slate-400` (#94a3b8) at minimum. Contrast against #080b14:
- `#94a3b8` on `#080b14` ≈ 5.5:1 — passes AA ✓
- `#64748b` (slate-500, used in many labels) on `#080b14` ≈ 3.3:1 — **fails AA** (minimum 4.5:1 for normal text)
- `#475569` (slate-600, used in "disabled" style states) ≈ 2.2:1 — **fails AA** (acceptable for placeholder/decorative if not conveying info, but many uses carry meaning)

Examples:
- `components/games/avalon/LobbyScreen.tsx:163` — role description text `text-slate-600` (`text-[10px]`). This is 10px + low contrast — double failure.
- `components/games/impostor/DiscussionScreen.tsx:116` — "Diskutujte. Ko zvuči sumnjivo?" in `text-slate-600`.
- `components/games/flip7/LobbyScreen.tsx:145` — "Samo host menja podešavanja" in `text-amber-100/30` — extremely low opacity.

---

## 4. Loading & Error State Coverage

### Room pages — all 4 games have correct guard structure

All four `app/games/*/room/[code]/page.tsx` files implement the same robust pattern:
1. `if (loading)` → pulsing "Učitavanje..." ✓  
2. `if (error || !room)` → error text + "Nazad na početnu" ✓  
3. `if (!player.id)` → loading state ✓  
4. `if (!isInRoom)` → "Nisi u ovoj sobi" + home link ✓  

**Gap**: There is no time-out or "Firestore offline" state. If the Firestore subscription silently stalls (which happens on flaky mobile connections), the user sees the spinner indefinitely. There is no `setTimeout` to surface "Connection lost — try reloading."

### Within game screens — optimistic/stale data assumed

Game screens receive `room` as a prop from the real-time subscription and assume all nested data is present:

- `components/games/flip7/GameScreen.tsx:29` — `room.players[room.currentTargetIndex]` — if `currentTargetIndex` is out of bounds (e.g., stale Firestore data mid-round), `target` is `undefined` and line 33 (`target?.id`) would silently produce wrong behaviour.
- `components/games/alias/ExplainingScreen.tsx:41` — `room.teams[team][room.currentExplainerIndex[team]]` — no guard if `teams[team]` is empty.
- `components/games/avalon/NightPhaseScreen.tsx:52` — `if (isLastStep) return;` timer guard is correct ✓.
- `components/games/impostor/VotingScreen.tsx:48–53` — reads `room.votes`, `room.players` — no null guards but these are always populated once status = 'voting'.

**Empty room / single player**: The lobby screens display "čekamo još N" with a counter which handles the empty-room case gracefully ✓.

**Disconnected players**: All games track `player.isConnected` and show "offline" text in the player list ✓. Flip7's host-skip feature for disconnected players (`GameScreen.tsx:101–116`) is a recent addition and works well.

---

## 5. Cross-Game UX Coherence

**Consistency score: 8/10**

### What is consistent (good)

- **Home screen pattern** — All 4 games: name input → create room / join with 5-char code → error shake. Structurally identical. `max-w-[320px]` constraint, `gap-12` between sections, 48px h1, 13px body copy.
- **Lobby screen pattern** — All 4 games: decrypt-code display (impostor/avalon/alias) or static code (flip7), player list with connection indicators, host-only settings, "čekamo još N" warning, 3-second countdown overlay before start.
- **Countdown overlay** — All 4 games use identical approach: fixed inset `bg-[#]/95`, 140px font countdown number, spring stiffness:200 damping:15.
- **Game-over actions** — All 4 games: host gets "play again", all players get "leave room" → router.push('/').
- **`h-screen-safe`** — Used in all game screens ✓.
- **Shared `Button` and `PlayerCard` components** — Used in impostor/avalon/flip7 lobbies ✓.

### What is inconsistent (needs attention)

| Pattern | Impostor | Avalon | Alias | Flip7 |
|---|---|---|---|---|
| Uses shared `Button` | ✓ | ✓ | ✗ (raw `<button>`) | ✓ |
| Uses shared `Input` | ✓ | ✓ | ✗ (raw `<input>`) | ✓ |
| "Leave room" button in lobby | ✗ (no leave button in lobby) | ✗ | ✗ | ✓ (has leave button) |
| Room code animation (DecryptCode) | ✓ | ✓ | ✓ | ✗ (static display) |
| Lobby player layout | 3-col grid | vertical list | 3-col grid | vertical list |
| Screen transition wrapper | `ScreenTransition` (spring) | `ScreenTransition` (spring) | Custom `motion.div` (fade) | `ScreenTransition` (spring) |
| Background explicitly set | Partial | ✗ | Partial | ✗ |

**"Leave room" gap**: Impostor, Avalon, and Alias lobbies have no "leave room" button — if you want to leave before the game starts, you must navigate away via browser back/address bar. Only Flip7 has an explicit leave button. This is a UX gap.

**Alias screen transition**: `alias/room/[code]/page.tsx:77–93` uses a custom `opacity: 0→1` fade instead of the `ScreenTransition` spring. Screens feel sluggish compared to other games.

**`components/screens/`** — Legacy Impostor-only screens in `components/screens/*.tsx` (7 files) appear to be dead code; they import from `@/lib/firestore` (generic, not game-specific), suggesting these predate the Hub integration. They are not imported anywhere in the current `app/` routes. Safe to delete.

---

## 6. Prioritised Fixes

### CRITICAL — Must fix

| # | Issue | File(s) | Est. Hours |
|---|---|---|---|
| C1 | All HomeScreens have no top clearance; content starts behind the fixed 52px header | `impostor/HomeScreen.tsx:71`, `avalon/HomeScreen.tsx:71`, `alias/HomeScreen.tsx:69`, `flip7/HomeScreen.tsx:76` — add `pt-16` or `pt-20` to outer div | 0.5 |
| C2 | Avalon/Flip7 screens have no explicit `background: var(--bg-base)` — will flash white on hydration if shadcn default overrides | `avalon/LobbyScreen.tsx:82`, `NightPhaseScreen.tsx:88`, `MissionProposeScreen.tsx:44`, all other Avalon and Flip7 screens lacking explicit bg | 1 |
| C3 | Avalon `RoleRevealScreen` hold-to-reveal is a `<div>`, not a `<button>` — keyboard inaccessible; player cannot reveal their role on desktop | `avalon/RoleRevealScreen.tsx:139` — convert to `<button>` + add keyboard shortcut (Space) | 1 |

### HIGH — Should fix

| # | Issue | File(s) | Est. Hours |
|---|---|---|---|
| H1 | Kick buttons are 20×20px (grid) / 32×32px (list) — below 44px minimum. On touch devices this is the primary moderation tool | `components/ui/PlayerCard.tsx:78,116` — enlarge to min 44×44px, possibly using padding on transparent area | 1 |
| H2 | Alias `HomeScreen` uses raw `<input>` / `<button>` instead of shared components — isolated inconsistency that will drift | `alias/HomeScreen.tsx:93–133` — replace with `<Input>` and `<Button>` | 0.5 |
| H3 | No "leave room" button in Impostor/Avalon/Alias lobbies — player is trapped unless they close the browser | `impostor/LobbyScreen`, `avalon/LobbyScreen`, `alias/LobbyScreen` — add ghost leave button following Flip7 pattern | 1.5 |
| H4 | Alias game-over "Play again" and "Leave" use raw `<button>` instead of shared `Button` — inconsistent active states | `alias/GameOverScreen.tsx:156–173` | 0.5 |
| H5 | `DecryptCode` is copy-pasted 3×; extract to `components/shared/DecryptCode.tsx` with `accent` prop | 3 lobby files | 1 |
| H6 | Firestore subscription has no timeout guard — mobile users on flaky connections see infinite spinner | `hooks/useRoom.ts` (add 15s timeout → "Connection problem. Reload?") | 1 |
| H7 | Confetti (`alias/GameOverScreen.tsx:21–45`) and Alias shimmer (`ExplainingScreen.tsx:201`) ignore `prefers-reduced-motion` | Add `useReducedMotion()` guard | 0.5 |

### MEDIUM — Consider fixing

| # | Issue | File(s) | Est. Hours |
|---|---|---|---|
| M1 | `text-[10px]` / `text-[9px]` labels at `text-slate-600` fail contrast AA | Multiple screens (see Section 3) — increase to `text-[11px] text-slate-500` minimum | 1 |
| M2 | Flip7 `pt-20` wastes 28px extra dead space vs other games; all games should use consistent `pt-safe` clearance | 4 Flip7 screen files | 0.5 |
| M3 | All voting / player-select buttons missing `aria-label` | Impostor `VotingScreen`, Avalon `MissionVoteScreen`/`QuestPhaseScreen`/`AssassinateScreen` | 2 |
| M4 | Alias screen transition uses opacity fade, not `ScreenTransition` spring | `alias/room/[code]/page.tsx` | 0.25 |
| M5 | `scanline` keyframe uses `translateY(100vh)` not `100dvh` | `app/globals.css:232` | 0.1 |
| M6 | `.dark` class is never applied — shadcn components render in light mode | `app/layout.tsx` — add `dark` class to `<html>` | 0.25 |
| M7 | `components/screens/` legacy dead code (7 files) | Delete directory | 0.25 |
| M8 | `components/shared/Button.tsx`, `Input.tsx`, `ScreenTransition.tsx` are duplicate dead code | Delete `components/shared/` | 0.25 |

### LOW — Nice to have

| # | Issue | File(s) | Est. Hours |
|---|---|---|---|
| L1 | `fadeIn`/`shake` animation config copy-pasted in all 4 HomeScreens | Extract to `lib/animations.ts` | 0.5 |
| L2 | Lobby screen layout varies (3-col grid vs vertical list) — consider standardising | Impostor/Alias vs Avalon/Flip7 | 2 |
| L3 | Hub header has no back-navigation / no current game indicator when player is in a game room | `app/layout.tsx` | 2 |
| L4 | No `<title>` override per game page — all pages show "GameHub" | Add per-game `export const metadata` | 0.5 |
| L5 | Room code copy button lacks `aria-label="Kopiraj pristupni kod"` | All 4 lobby files | 0.25 |

---

## Appendix: File Reference Map

| Component | Path |
|---|---|
| Design tokens | `app/globals.css` |
| Font / layout | `app/layout.tsx` |
| Hub home | `app/page.tsx`, `components/hub/GameGallery.tsx` |
| Shared button | `components/ui/Button.tsx` (authoritative) |
| Shared input | `components/ui/Input.tsx` (authoritative) |
| Shared player card | `components/ui/PlayerCard.tsx` |
| Duplicate shared | `components/shared/` (delete) |
| Legacy dead code | `components/screens/` (delete) |
| Impostor room page | `app/games/impostor/room/[code]/page.tsx` |
| Avalon room page | `app/games/avalon/room/[code]/page.tsx` |
| Alias room page | `app/games/alias/room/[code]/page.tsx` |
| Flip7 room page | `app/games/flip7/room/[code]/page.tsx` |
