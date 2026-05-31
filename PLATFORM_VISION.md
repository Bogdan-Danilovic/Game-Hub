# Game Hub — Platforma Vizija

> Konsolidovani dokument: sve ideje, planovi, TODO stavke i dizajn odluke vezane za Game Hub platformu.
> Generisano: 2026-05-31

---

## Izvori koji su pročitani

| Izvor | Status |
|-------|--------|
| `GAME_STANDARD.md` | Pročitan — identičan sa `kompletna pravila za izradu igrice.txt` |
| `kompletna pravila za izradu igrice.txt` | Pročitan — kompletni standardni dokument za igre |
| `Pravila za pravljenje novih igara.txt` | Pročitan — originalni brief za add-game skriptu i GAME_STANDARD |
| `lib/games/registry.ts` | Pročitan — registar svih igara |
| `lib/types/core.ts` | Pročitan — bazni tipovi platforme |
| `lib/types/alias.ts`, `avalon.ts`, `flip7.ts` | Pročitani — tipovi za svaku igru |
| `game.config.json` | Pročitan — konfiguracija za Avalon i Flip7 |
| `design-system/game-hub/MASTER.md` | Pročitan — dizajn sistem |
| `scripts/add-game.ts` | Pročitan — automatizovana skripta za dodavanje igara |
| `app/page.tsx` | Pročitan — Hub početna stranica |
| Obsidian vault bilješke | **Nema zasebnih bilješki** — vault root sadrži samo `Projekti/` koji je direktno repo |

> **Napomena o Obsidian-u:** Vault IS repo. Nema zasebnih Obsidian bilješki izvan samog koda. Sve ideje i planovi žive u `.txt` fajlovima i `GAME_STANDARD.md` unutar repoa.

---

## 1. Vizija proizvoda i pozicioniranje

**Game Hub** je web platforma za društvene igre inspirisana Jackbox Games — igrači se spajaju sa bilo kog uređaja putem koda sobe, bez registracije. Sve igre dijele isti vizuelni identitet ali svaka ima jedinstvenu mehaniku.

**URL platforme:** `game-hub-wine-delta.vercel.app`
**GitHub:** `github.com/Bogdan-Danilovic/Game-Hub`

### Temeljni principi (Jackbox principi)

1. **JEDNOSTAVNA ZA OBJASNITI** — pravila u jednoj rečenici
2. **ZABAVNA U GRUPI** — minimum 3, optimum 5–8 igrača
3. **REPLAYABLE** — svaka partija drugačija
4. **EMOCIONALNA** — smijeh, napetost, iznenađenje
5. **BEZ AUTENTIFIKACIJE** — samo ime, bez registracije; LocalStorage za `playerId` i `playerName`

### Tehnički stack

| Dio | Tehnologija |
|-----|-------------|
| Frontend | Next.js + TypeScript (strict mode) |
| Baza | Firebase Firestore (real-time) |
| Stilovi | Tailwind CSS |
| Animacije | Framer Motion (spring: stiffness 300, damping 20) |
| Font | Space Grotesk |
| Deploy | Vercel (autodeploy na push) |

---

## 2. Postojeće igre i njihov status

### Impostor ✅ (dostupna)
- **Mehanika:** Blef + glasanje. Jedan igrač je uhoda — ostali pokušavaju da ga otkriju.
- **Igrači:** 3–12
- **Trajanje:** 10–20 min
- **Akcent boja:** `#8b5cf6` (violet)
- **Tagovi:** dedukcija, blef
- **Referentna implementacija** za cijelu platformu (Impostor-Web repo je "primjer dobre igre")
- **Status ekrana:** HomeScreen, LobbyScreen, RoleRevealScreen, DiscussionScreen, VotingScreen, RevealScreen, GameOverScreen

### Alias ✅ (dostupna)
- **Mehanika:** Timska igra — jedan objašnjava riječima, tim pogađa za 60 sekundi.
- **Igrači:** 4–16
- **Trajanje:** 15–30 min
- **Akcent boja:** `#0891b2` (cyan)
- **Tagovi:** riječi, tim, brzina
- **Posebnosti:** Timovi A i B, rotacija objašnjivača, kategorije (filmovi, hrana, istorija, muzika, pop kultura, priroda, sport, svakodnevica, tehnologija, životinje)
- **Status ekrana:** HomeScreen, LobbyScreen, RoundStartScreen, ExplainingScreen, RoundEndScreen, ScoreboardScreen, GameOverScreen
- **Podešavanja:** trajanje runde (30/60/90 sek), ciljni score

### Avalon ✅ (dostupna)
- **Mehanika:** Dedukcija i blef. Tajni ratnici dobra i zla. Merlin zna istinu ali ne smije otkriti ko je.
- **Igrači:** 5–10
- **Trajanje:** 30–60 min
- **Akcent boja:** `#ef4444` (crvena)
- **Tagovi:** uloge, dedukcija, blef
- **Posebnosti:**
  - Raspodjela dobro/zlo po broju igrača (5–10 igrača)
  - Misije sa timovima (5 misija, varijabilna veličina tima)
  - Lady of the Lake mehanika (opciona)
  - Opcione uloge: Percival, Mordred, Morgana, Oberon
  - Double sabotaža na misiji 4 za 7+ igrača
  - Assassin može ubiti Merlina na kraju
- **Status ekrana:** HomeScreen, LobbyScreen, NightPhaseScreen, RoleRevealScreen, MissionProposeScreen, MissionVoteScreen, VoteResultScreen, QuestPhaseScreen, QuestResultScreen, ScoreboardScreen, AssassinateScreen, GameOverScreen
- **Podešavanja:** enable/disable svake opcionalne uloge i Lady of the Lake

### Flip 7 ✅ (dostupna)
- **Mehanika:** Kartaška igra sreće — sakupljaj karte, ali ne smije biti duplikata!
- **Igrači:** 3–18
- **Trajanje:** 15–30 min
- **Akcent boja:** `#f59e0b` (amber)
- **Tagovi:** karte, sreća, blef
- **Posebnosti:**
  - Špil: 94 karte (79 brojeva 0–12, 6 modifikatora, 3×stop, 3×druga šansa, 3×okreni tri)
  - Cilj: 200 bodova (konfigurabilan)
  - Flip 7 bonus: 15 bodova za 7 različitih karata
  - x2 modifier udvostručuje zbir karata
  - Flat modifikatori: +2, +4, +6, +8, +10
  - Engine je potpuno čist (pure functions) — `applyDealtCard`, `calculateRoundScores`, `drawCard`
  - Specijalne akcije: Stop (završi tur), Druga šansa (zaštita od pukotine), Okreni tri (3 karte odjednom)
- **Status ekrana:** HomeScreen, LobbyScreen, GameScreen, RoundEndScreen, GameOverScreen
- **Podešavanja:** targetScore

### Trivia ❌ (nije dostupna — planirana)
- **Mehanika:** Opšte znanje — ko zna više, pobeđuje.
- **Igrači:** 2–20
- **Trajanje:** 20–40 min
- **Akcent boja:** `#059669` (zelena)
- **Tagovi:** znanje, kviz
- **Status:** U registru, zastavica `available: false` — nije implementirana

---

## 3. Planirane / idejne igre

### Trivia (kviz) — SLEDEĆA na redu
- Već u registru sa `available: false`
- Mehanika: opšte znanje, kviz format
- Neiskorišćena mehanika prema GAME_STANDARD-u
- Podrazumeva: kategorije pitanja, multiplayer scoring, možda timerski format

### Ostale preporučene mehanike (iz GAME_STANDARD-a — neiskorišćene)

| Mehanika | Opis | Potencijal |
|----------|------|-----------|
| **Crtanje + pogađanje** | Jackbox Drawful style | Visok |
| **Priča koja se gradi** | Igrači naizmjenično grade priču | Srednji |
| **Licitacija / ekonomija** | Resursi, kupovanje, bidding | Srednji |
| **Memorija / brzina** | Pamćenje karata, brzinsko pogađanje | Srednji |
| **Timska saradnja** | Kooperativna mehanika bez impostora | Srednji |

> **Pravilo:** Svaka nova igra mora imati JEDINSTVENU core mehaniku — zabranjena je kopija Impostor mehanike (blef + glasanje).

---

## 4. Dizajn sistem

### Paleta boja

| Uloga | Hex | CSS varijabla |
|-------|-----|---------------|
| Pozadina | `#080b14` | `--color-background` |
| Surface 1 | `#0f1320` | `--color-surface-1` |
| Surface 2 | `#161b2e` | `--color-surface-2` |
| Tekst | `#f1f5f9` | `--color-text` |
| Akcent | `#8b5cf6` | `--color-accent` |
| CTA | `#8b5cf6` | `--color-cta` |

> Per-game akcent override je dozvoljen (svaka igra može imati svoju boju).

### Stil
- **Retro-futurizam** — vintage sci-fi, 80s aesthetic, neon glow, CRT scanlines, synthwave
- Ultra tamna OLED pozadina
- Violet kao primarni akcent

### CSS klase (iz globals.css)

| Klasa | Efekat |
|-------|--------|
| `.breathing-orb` | Lebdeći orb u pozadini |
| `.glitch-text` | Glitch efekat na tekstu |
| `.scanline` | Scanline animacija |
| `.glow-v` / `.glow-v-sm` | Violet glow (box) |
| `.text-glow-v` / `.text-glow-d` | Glow na tekstu |
| `.bg-grid` | Grid pattern pozadina |
| `.glitch-hover` | Glitch na hover |

### Tipografija
- **Font:** Space Grotesk (heading i body)
- **Mood:** Bold + Impactful

### Animacije
- Framer Motion
- Spring: `stiffness: 300`, `damping: 20`
- Tranzicije: 150–300ms

### Responsivnost
- **Mobile-first**
- `dvh` umjesto `vh` (dynamic viewport height za mobile browsere)
- Breakpointi: 375px, 768px, 1024px, 1440px

### Anti-paterni (zabraniti)
- Emojis kao ikone — koristiti SVG (Heroicons, Lucide)
- Nedostajući `cursor: pointer` na klikabilnim elementima
- Layout-shifting hoveri (scale transformi koji pomiču layout)
- Low contrast tekst (minimum 4.5:1)
- Instant state changes (uvijek tranzicije 150–300ms)
- Nevidljivi focus states

---

## 5. Tehničke odluke koje su donesene

### Arhitektura

- **Hub + Game repos** — svaka igra je poseban GitHub repo koji se integriše u Hub
- **Automatska integracija:** `npx tsx scripts/add-game.ts <github-url>` — klonira, adaptira importe, dodaje u registry, build check, git push → Vercel autodeploy
- **Rollback:** Skripta čuva originalne fajlove i vraća ih ako build ne prođe

### Tipovi

- `BaseRoom`, `BasePlayer`, `GameSettings` iz `@/lib/types/core`
- Svaka igra proširuje bazne tipove
- `GameType` union u `core.ts` — `'impostor' | 'alias' | 'trivia' | 'avalon' | 'flip7'`
- TypeScript strict mode — zero `any`, zero `ts-ignore`

### Firebase / Firestore

- `roomRef()` i `subscribeToRoom()` iz `@/lib/firestore/core`
- **Obavezno:** Graceful end kada `connectedAlive.length < 3`
- `newRoom()` mora sadržati `gameType` polje
- Implementirati: `createRoom`, `joinRoom`, `leaveRoom`, `setPlayerDisconnected`, `startGame`

### Routing

- Home igre: `/games/{gameId}`
- Room: `/games/{gameId}/room/[code]`
- Leave: uvijek `router.push('/')` — vraća na Hub
- LocalStorage: `'playerId'` i `'playerName'`

### Build / Deploy

- Vercel (autodeploy na GitHub push)
- Railway pomenuto u starim bilješkama ali Vercel je aktivan
- `npm run build` mora proći lokalno prije pusha

---

## 6. Otvorena pitanja / TODO

### Igre

- [ ] **Trivia implementovati** — najhitniji TODO, već u registru kao `available: false`
- [ ] Odlučiti koja je NAREDNA igra nakon Trivia (crtanje? priča?)
- [ ] Razmotriti da li Alias ima dovoljno kategorija ili trebaju više
- [ ] Avalon: testirati LadyOfTheLake mehaniku sa punim brojem igrača

### Tehnika

- [ ] `scripts/add-game.ts` — testirati sa novim repoom od nule
- [ ] `game.config.json` u repou sadrži samo Avalon i Flip7 config (Impostor i Alias nemaju game.config.json jer su bili ranije integrisani)
- [ ] Komponente postoje i u `components/screens/` (stari put) i `components/games/{id}/` (novi put) — počistiti duplikate: `components/screens/DiscussionScreen.tsx` itd.
- [ ] `components/shared/Button.tsx` i `components/ui/Button.tsx` — duplikati, konsolidovati
- [ ] Provjeriti da li `app/room/[code]/page.tsx` (root ruta) treba da ostane ili je legacy

### Dizajn

- [ ] Design system MASTER.md ima miješane informacije (Inter font + Space Grotesk; gold akcent + violet) — počistiti i stanardizovati
- [ ] Komponente za hub (`GameCard.tsx`, `GameGallery.tsx`, `Particles.tsx`) — osvježiti na "Trivia" kad se doda
- [ ] `portfolio-gallery.tsx` u components/ — izgleda kao legacy/testni fajl, obrisati?

### Platforma

- [ ] Nema sistema korisničkih naloga — da li ostaje tako ili se dodaje opcioni auth?
- [ ] Nema analitike — razmišljati o grundnim metrikama (broj sesija, popularne igre)
- [ ] Room kodovi — trenutno kratki alfanumerički; da li su dovoljno koliziono-sigurni za veći saobraćaj?

---

## 7. Monetizacija (ideje)

> Iz dostupnih izvora **nema eksplicitnih bilješki o monetizaciji**. Platform je slobodan za igranje bez prijave.

Potencijalni modeli koji su kompatibilni sa Jackbox-style platformom (nisu zabilježeni ali prirodno proizilaze iz vizije):

- **Besplatan pristup** za sve igre (trenutni model)
- **Donacije / Patreon** za community podršku
- **Premium igre** — određene igre samo za premijum korisnike
- **Custom branding** za firme/eventi (teambuilding use case)

---

## 8. Roadmap teme

### Faza 1 — Stabilizacija (kratkoročno)
- [ ] Implementirati Trivia igru
- [ ] Počistiti duplikate komponenti (`components/screens/` → `components/games/`)
- [ ] Standardizovati Design System MASTER.md
- [ ] Dodati `game.config.json` za Impostor i Alias repoe (radi kompatibilnosti sa add-game skriptom)

### Faza 2 — Rast (srednji rok)
- [ ] Nova igra sa mehanikom crtanja (Drawful-style)
- [ ] Ili nova igra: priča koja se gradi
- [ ] Poboljšati UX onboardinga (bolji ekran dobrodošlice, tutorial)
- [ ] Mobilna optimizacija svih igara (touch targets, layout)

### Faza 3 — Platforma (dugoročno)
- [ ] Opcioni korisnički nalozi (leaderboard, historija igara)
- [ ] Analitika i metrike
- [ ] Višejezična podrška (lokalizacija)
- [ ] API za community-contributed igre

---

## Brza referenca — Dodavanje nove igre

```bash
# 1. Napravi novi GitHub repo po GAME_STANDARD-u
# 2. Dodaj game.config.json u repo
# 3. Pokreni:
npx tsx scripts/add-game.ts https://github.com/Bogdan-Danilovic/[nova-igra-repo]
# Skripta automatski:
# - Klonira repo
# - Adaptira importe (@/ putanje)
# - Kopira u lib/types/, lib/firestore/, components/games/, app/games/
# - Dodaje u registry i GameType union
# - Pokreće npm run build
# - Git commit + push → Vercel autodeploy
```

**Checklist prije push-a:**
- [ ] `game.config.json` postoji i validan
- [ ] `Room extends BaseRoom` sa `gameType` poljem
- [ ] `Player extends BasePlayer`
- [ ] `graceful end` kada `connectedAlive < 3`
- [ ] Leave vodi na `/`
- [ ] `npm run build` prolazi
- [ ] `tsc --noEmit` prolazi
- [ ] Nema hardcoded Firebase importa (koristiti `@/lib/firebase`)
