# MONETIZATION_PLAN.md

> **Datum:** 2026-05-31
> **Projekat:** GameHub (Next.js App Router + TypeScript + Firebase/Firestore)
> **AdSense klijent:** `ca-pub-3801758630975994`

---

## Status implementacije

| Komponenta | Status | Fajl |
|-----------|--------|------|
| AdSense JS skript (`adsbygoogle.js`) | ✅ | `app/layout.tsx` |
| AdSense meta tag verifikacija | ✅ | `app/layout.tsx` → `metadata.other` |
| `ads.txt` | ✅ | `public/ads.txt` |
| Google Auth + korisnički profili | ✅ | `components/auth/`, `hooks/useAuth.ts` |
| Game historija + stats | ✅ | `lib/firestore/gameHistory.ts` |
| `AdSenseBanner` komponenta | ⏳ Čeka odobrenje | vidi §1 |
| `RewardedVideo` infrastruktura | ⏳ Čeka odobrenje | vidi §2 |
| Host unlock (24h premium) | ⏳ Čeka odobrenje | vidi §3 |
| Donacija (rewarded video) | ⏳ Čeka odobrenje | vidi §4 |

---

## 0. Prihodnih tokovi

| Tok | Mreža | Format | Trigger |
|-----|-------|--------|---------|
| Pasivni baneri | Google AdSense | Display baner | Waiting screen (viewable) |
| Host unlock | Adsterra | VAST rewarded video | Host klikne „Otključaj premium" |
| Donacija | Adsterra | VAST rewarded video | Igrač bira nivo donacije |

**Ključni princip:** rewarded video je **opt-in**. Pasivni baneri samo na waiting/lobby ekranima — nikad tokom aktivne runde.

---

## 1. Pasivni AdSense baneri

### Placement pravila
- Samo na waiting/lobby ekranima, nikad tokom runde
- Jedan baner po ekranu
- Lazy-load (viewable impression = veći RPM)
- Fiksna visina rezervisana pre učitavanja (CLS = 0)

### Fajlovi za implementaciju
```
components/ads/AdSenseBanner.tsx
```

```tsx
'use client';
// Props: { slot: string; format?: 'auto' | 'rectangle' | 'horizontal' }
// - rezerviše min-height (CLS = 0)
// - poziva (window.adsbygoogle = window.adsbygoogle || []).push({}) u useEffect
// - ne renderuje ništa ako je korisnik premium (premiumUntil > now)
// TODO: data-ad-slot="XXXXXXXXXX" — kreirati u AdSense dashboard-u
```

### Integracija
- Dodati `<AdSenseBanner slot="..." />` na lobby ekrane svih igara
- Guard: `if (isPremium) return null`

---

## 2. Adsterra VAST rewarded video — infrastruktura

### Fajlovi za implementaciju
```
components/ads/RewardedVideo.tsx
hooks/useRewardedVideo.ts
```

**State machine:** `idle → loading → playing → completed | no-fill | error`

**API:**
```ts
playRewardedVideos(count: number, onEarned: (estUsd: number) => void): Promise<RewardResult>
// RewardResult: { completed: boolean; totalEstUsd: number; videosWatched: number }
```

- Guard: ne dozvoli skip pre reward uslova
- Fallback ako nema fill: poruka korisniku, ne blokira

---

## 3. Host unlock (24h premium)

### Flow
1. Host vidi dugme „Otključaj premium (24h) — pogledaj kratak video"
2. `playRewardedVideos(1)` → po završetku → server action upisuje `premiumUntil`
3. UI odmah reflektuje premium (sakrij banere, otključaj feature)

### Firestore zapis
```
rooms/{code}
  premiumUntil: Timestamp   // now + 24h  ← samo server action sme ovo
  premiumSource: 'host-unlock-rewarded'
  premiumGrantedAt: Timestamp
```

> ⚠️ `premiumUntil` **mora ići kroz server action** (`'use server'`), nikad direktan client write.

### Fajlovi za implementaciju
```
components/ads/HostUnlockButton.tsx
app/actions/grantPremium.ts          ← server action
lib/monetization/premium.ts
```

---

## 4. Donacija (skalabilni rewarded)

### Nivoi
| Nivo | Videa | Trajanje |
|------|-------|----------|
| Malo | 1 | ~15s |
| Srednje | 2 | ~30s |
| Puno | 3–4 | ~60–90s |

### Firestore
```
stats/donations
  totalEarned: number        // increment() — atomično
  totalVideosWatched: number
  updatedAt: Timestamp
```

> Security rule: increment samo pozitivan, samo kroz verifikovan put.

### Fajlovi za implementaciju
```
components/ads/DonationSection.tsx
components/ads/RewardEarnedToast.tsx
lib/monetization/estimate.ts     // eCPM po geo (Tier 1/2/3)
lib/monetization/donations.ts    // increment stats/donations
```

---

## 5. Otvorena pitanja

1. **Ad unit slot IDs** — kreirati u AdSense dashboard-u i uneti u `AdSenseBanner`
2. **Adsterra VAST tag URL** — potreban zone ID po formatu
3. **eCPM tabela** — placeholder dok ne stignu prvi izveštaji
4. **Premium scope** — šta tačno „24h premium" otključava (bez banera + ?)
5. **Security rules za `premiumUntil`** — rule koji dozvoljava write samo kroz server action

---

## 6. Faze implementacije

- [x] **Faza 0** — AdSense verifikacija (skript + meta tag + ads.txt) ✅
- [x] **Faza 0.5** — Google Auth + korisnički profili + game historija ✅
- [ ] **Faza 1** — `AdSenseBanner` + integracija na lobby ekrane
- [ ] **Faza 2** — `RewardedVideo` infrastruktura + Adsterra VAST
- [ ] **Faza 3** — Host unlock + `premiumUntil` server action + security rules
- [ ] **Faza 4** — Donacija + geo procena + globalni counter
- [ ] **Faza 5** — Testovi + anti-fraud review
