---
date: 2026-05-31
project: Game-Hub
type: decision
status: planirano
tags: [monetizacija, adsense, adsterra, firestore]
---

# Odluka: Monetizacija implementacija (GameHub)

> Povezano: [[2026-05-31-monetizacija-i-arhitektura]] (šira strateška ADR — Model B pretplata).
> Ovaj zapis pokriva konkretnu **AdSense + Adsterra rewarded-video** implementaciju.

## Kontekst
Transformacija GameHub-a iz hobi projekta ka prihodnom proizvodu. Dva odvojena zadatka:
1. **AdSense verifikacija** (hitno, urađeno danas).
2. **Monetizacija arhitektura** (plan pripremljen, implementacija čeka odobrenje).

## Urađeno 2026-05-31
- ✅ AdSense verifikacioni skript dodat u `app/layout.tsx` (`<head>`), klijent `ca-pub-3801758630975994`.
- ✅ Deploy na Vercel.
- ✅ `MONETIZATION_PLAN.md` kreiran u root-u repoa (puni plan).

## Sažetak plana (detalji u `MONETIZATION_PLAN.md`)

### Prihodni tokovi
1. **Pasivni AdSense baneri** — samo waiting/lobby screen, viewable, CLS=0, lazy-load.
2. **Adsterra VAST rewarded video:**
   - **Host unlock:** 1–2 videa → 24h premium, čuva se kao `premiumUntil`.
   - **Donacija:** malo=1 (~15s), srednje=2 (~30s), puno=3–4 (~60–90s) videa.
   - Posle svakog videa: prikaz procenjenog zarađenog iznosa (geo-bazirano).
   - Globalni counter: `stats/donations.totalEarned`.
3. **Placeholder komponente** sa `TODO: insert ad unit ID` za sve formate.

### Ključna nerešena odluka
⚠️ Prompt navodi `sessions/{id}.premiumUntil`, ali postojeći kod
(`lib/firestore/core.ts`) koristi kolekciju **`rooms/{code}`**.
→ **Preporuka:** upisivati u `rooms/{code}.premiumUntil` radi usklađenosti.
Alternativa (`sessions/{id}`) znači veći refaktor.

### Firestore šema (predlog)
```
rooms/{code}        → premiumUntil: Timestamp, premiumSource, premiumGrantedAt
stats/donations     → totalEarned: number, totalVideosWatched: number, updatedAt
```

### Sigurnost (obavezno pre produkcije)
- Premium grant i donations increment moraju kroz Security Rules / server action.
- Čisto client-side write = trivijalno lažiranje iz konzole.

## Otvorena pitanja
1. Kolekcija premium: `rooms/{code}` vs `sessions/{id}`.
2. Broj videa za host unlock (default 1).
3. Adsterra VAST zone ID-evi.
4. AdSense slot ID-evi.
5. Realne eCPM vrednosti po geo.
6. Scope „24h premium" feature-a.

## Sledeći prioritet
➡️ **Google Auth sistem** (ne monetizacija implementacija). Monetizacija faze 1–5
čekaju eksplicitno odobrenje i odgovore na otvorena pitanja.
