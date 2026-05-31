---
datum: 2026-05-31
tip: plan
status: predlog (čeka odobrenje za GitHub issues)
tagovi: [game-hub, plan, backlog, monetizacija, technical-debt]
---

# Prioritizovani plan — Game-Hub (Faza 2)

> Izvor: Faza 1 analiza. Vezano: [[2026-05-31-monetizacija-i-arhitektura]] · [[AUDIT_REPORT]] · [[ARCHITECTURE_REPORT]] · [[UX_REPORT]]
> Impact = uticaj na monetizaciju (1–10). Predlog: svaki red → 1 GitHub issue.

## HITNO (blokira monetizaciju / integritet repoa)
| # | Task | Label | h | Impact | Rizik |
|---|------|-------|---|--------|-------|
| 1 | Dodaj i deployuj `firestore.rules` (deny client `tier` upis) | monetization, bug | 8 | 10 | srednji |
| 2 | Izbaci `%USERPROFILE%` tree + junk fajlove iz gita | technical-debt | 0.5 | 9 | nizak |
| 3 | Firebase Anonymous Auth (`uid` umesto `localStorage`) | monetization | 15 | 10 | srednji |
| 4 | Server rute + Stripe Checkout/Webhook + Admin SDK | monetization | 20 | 10 | visok |
| 5 | `users/{uid}` profili + entitlement model | monetization | 8 | 8 | srednji |
| 6 | Premium gating (igre / veličina lobija) | monetization | 6 | 7 | nizak |

## VAŽNO (retention / kvalitet)
| # | Task | Label | h | Impact | Rizik |
|---|------|-------|---|--------|-------|
| 7 | Fix `useLadyOfTheLake` rules-of-hooks bug (`lib/firestore/avalon.ts`, poziv `LadyOfTheLakeModal.tsx:45`) | bug | 0.25 | 2 | nizak |
| 10 | Minimalni test harness (Playwright/Vitest setup) | technical-debt | 16 | 6 | srednji |
| 11 | Skala: izdvoji volatile polja iz room doc-a (fan-out) | enhancement | 12 | 5 | visok |
| 12 | Mobile: header/title overlap na 4 `HomeScreen`-a (`pt-16`) | bug | 0.5 | 6 | nizak |
| 13 | A11y: RoleReveal → `<button>` + keyboard, aria labele | enhancement | 4 | 4 | nizak |

## NICE TO HAVE
| # | Task | Label | h | Impact | Rizik |
|---|------|-------|---|--------|-------|
| 8 | Obriši `components/screens/` + spoji `shared/`→`ui/` | technical-debt | 1.5 | 3 | nizak |
| 9 | Obriši orphan `lib/firestore.ts` + `lib/types.ts` | technical-debt | 0.5 | 2 | nizak |
| 14 | `game.config.json` za Impostor & Alias; standardizuj design `MASTER.md` | technical-debt | 3 | 3 | nizak |

## TOP 3 hitna
1. **#1 Firestore rules** — bez pravila premium se ne može osigurati.
2. **#3 Anon Auth** — plaćanje mora imati identitet; čuva no-reg UX.
3. **#4 Server Stripe infra** — app nema nijednu server rutu; kičma naplate.
