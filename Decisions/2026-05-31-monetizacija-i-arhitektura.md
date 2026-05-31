---
datum: 2026-05-31
tip: decision
status: predlog (čeka potvrdu)
tagovi: [game-hub, monetizacija, arhitektura, adr]
---

# Odluka: Monetizacija i arhitektura Game-Hub-a

> Konsolidovano iz Faze 1 analize (4 agenta). Detaljni izveštaji:
> [[AUDIT_REPORT]] · [[ARCHITECTURE_REPORT]] · [[UX_REPORT]] · [[PLATFORM_VISION]]

## Kontekst
Game-Hub je Jackbox-style multiplayer platforma. **Stvarni stack:** Next.js 16.2 (App Router, React 19), Firebase Firestore 12 (samo klijent), Tailwind 4, Framer Motion. 4 aktivne igre: impostor, alias, avalon, flip7. Trivia skafoldovana (`available:false`). Trenutno: **bez auth-a** (samo ime + `localStorage`), **bez server koda**, **bez naplate**.

## Odluka o monetizaciji — Model B: mesečna host pretplata (~€5/mes)
- **Kupac = host** (organizator večeri); ponavljajući, predvidiv prihod.
- Free tier ostaje potpuno igriv bez registracije; premium otključava host perkove (veći lobi, premium igre poput Trivije, kozmetika).
- Nove igre = prirodni upsell.
- Odbačeno: pay-per-game (niži LTV, veće trenje), čisto cosmetics (slab prihod na ovoj skali).

## Ciljna arhitektura naplate
```
Anon Auth (signInAnonymously → uid)
   → (opc.) upgrade na email/Google (čuva "igraj bez registracije")
   → Stripe Checkout (server ruta app/api/stripe/checkout)
   → Stripe webhook (app/api/stripe/webhook) + Firebase Admin SDK
   → upis users/{uid}.tier = 'premium'
   → Firestore rules: 'tier' upisiv SAMO sa servera
   → klijent čita tier i otključava premium
```

## Kritični blokeri pre prvog plaćajućeg korisnika
1. **Nema `firestore.rules` u repou** — baza neauditabilna; klijent može sebi upisati `tier`. (sec)
2. **Junk u gitu** (`%USERPROFILE%/...gstack`, `0)`, `p.id`, `remove`, `{`) — lažni ESLint/CI šum.
3. **Nema auth-a** — plaćanje se nema na šta vezati.
4. **Nula server-side koda** — Stripe webhook + entitlement upis nemogući bez API ruta + Admin SDK.
5. *(skala)* single-document „flat room" + full-doc fan-out → Alias probija Firestore limit 1 upis/s po dokumentu.

## Procene
- Čist tech-debt (čišćenje + ispravke postojećeg, uklj. ~16 h test harness): **~45 h**
- Novi monetization build (auth + rules + server + Stripe + profili): **~55 h**
- Do MVP monetizacije: **~4 nedelje** (1 čišćenje/hardening + 3 build), 1 developer. Gruba procena.

## Sledeći korak
Faza 2: kreiranje GitHub issue-a — vidi [[2026-05-31-prioritizovani-plan]]. Čeka potvrdu repoa i MCP auth.
