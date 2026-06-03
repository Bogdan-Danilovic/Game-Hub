# Gartic — Implementacija za Game Hub

## Kontekst projekta

Ti si senior developer koji radi na Game Hub platformi — Jackbox-inspirisanoj
platformi za društvene igre u browseru.

**Live platforma:** https://game-hub-wine-delta.vercel.app
**Hub repo:** https://github.com/Bogdan-Danilovic/Game-Hub
**Referentna igra (Impostor):** https://github.com/Bogdan-Danilovic/Impostor-Web
**Stack:** Next.js 14 App Router, TypeScript strict, Firebase Firestore,
Tailwind, Framer Motion, Space Grotesk
**Deployment:** Vercel (autodeploy na push)

Prije nego što počneš pisati i jedan red koda, pročitaj:
- `GAME_STANDARD.md` u Hub repou — obavezna pravila kojih se moraš držati
- `CLAUDE.md` i `AGENTS.md` u Hub repou
- Cijeli Impostor-Web repo — to je referentna arhitektura, prati isti pattern

---

## Igra koju implementiraš: "Gartic"

**Jedna rečenica:** Svako piše rečenicu, neko je nacrta, neko opiše crtež,
i tako dalje — na kraju se otkriva koliko je originalna poruka mutirala.

**Igrači:** 3–8
**Trajanje stepa:** 90s pisanje / opisivanje, 120s crtanje
**Broj koraka:** jednak broju igrača (svako jednom drži svaku ulogu)

---

## Firestore struktura

```typescript
interface GarticRoom extends BaseRoom {
  gameType: 'gartic';
  status: 'lobby' | 'writing' | 'drawing' | 'describing' | 'reveal' | 'finished';

  currentStep: number;       // 0 = početno pisanje, 1 = prvi crtež, 2 = prvi opis...
  totalSteps: number;        // = broj igrača
  stepStartedAt: number;     // server timestamp za timer sync
  stepDuration: number;      // 90000ms pisanje/opisivanje, 120000ms crtanje

  books: Record<string, Book>;  // bookId → Book (svaki igrač = jedna knjiga)
  readyPlayers: string[];       // playerIdi koji su submitovali trenutni step
}

interface Book {
  id: string;
  ownerId: string;     // igrač koji je napisao originalnu rečenicu
  entries: BookEntry[];
}

interface BookEntry {
  step: number;
  authorId: string;
  type: 'text' | 'drawing';

  // Za type === 'text':
  text?: string;

  // Za type === 'drawing':
  strokes?: Stroke[];
  thumbnailDataUrl?: string;  // base64 JPEG 120×90 za reveal preview
}

interface Stroke {
  points: [number, number][];  // normalizovane koordinate 0–1
  color: string;
  width: number;
  tool: 'pen' | 'eraser';
}
```

---

## Rotacija knjiga — KRITIČNO

Rotacija mora biti deterministička — svaki klijent izračunava lokalno bez
dodatnih Firestore poziva.

```typescript
// lib/rotation.ts

/**
 * Za dati step i listu igrača, vraća koji igrač radi na kojoj knjizi.
 *
 * Primjer sa 4 igrača [A, B, C, D], knjige [bA, bB, bC, bD]:
 * Step 0: A→bA, B→bB, C→bC, D→bD  (svako svoju)
 * Step 1: A→bD, B→bA, C→bB, D→bC  (pomak za 1)
 * Step 2: A→bC, B→bD, C→bA, D→bB  (pomak za 2)
 * Step 3: A→bB, B→bC, C→bD, D→bA  (pomak za 3)
 */
export function getBookAssignments(
  playerIds: string[],
  step: number
): Record<string, string> {
  const n = playerIds.length;
  const assignments: Record<string, string> = {};

  playerIds.forEach((playerid, playerIndex) => {
    const bookIndex = (playerIndex - step + n) % n;
    assignments[playerid] = playerIds[bookIndex];
  });

  return assignments;
}
```

---

## Canvas — nema real-time sync

Za razliku od igre crtanja, ovdje **nema `currentStroke` real-time synca**.
Svako crta lokalno na svom canvasu i šalje kompletan crtež jednom kad
pritisne "Završi". Ovo drastično smanjuje Firestore writeove.

Koordinate OBAVEZNO normalizuj 0–1:
```typescript
point: [x / canvas.width, y / canvas.height]
```

Ramer-Douglas-Peucker kompresija (epsilon: 0.002) obavezna prije slanja —
reducira broj točaka za ~60%.

### Thumbnail generisanje

Generiši mali snapshot prije submitovanja — koristi se u reveal pregledu:

```typescript
async function generateThumbnail(canvas: HTMLCanvasElement): Promise<string> {
  const thumb = document.createElement('canvas');
  thumb.width = 120;
  thumb.height = 90;
  const ctx = thumb.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 120, 90);
  ctx.drawImage(canvas, 0, 0, 120, 90);
  return thumb.toDataURL('image/jpeg', 0.7);  // ~3-5KB
}
```

---

## Timer sinkronizacija — KRITIČNO

Nikad ne koristi lokalni `setTimeout` za countdown.
Svi klijenti računaju iz istog Firestore timestampa:

```typescript
const elapsed = (Date.now() - stepStartedAt) / 1000;
const remaining = Math.max(0, stepDuration / 1000 - elapsed);
// Tick svakih 500ms je sasvim dovoljno
```

---

## Firestore operacije

```typescript
// Pokretanje igre
export async function startGame(roomCode: string, playerIds: string[]) {
  const books: Record<string, Book> = {};
  playerIds.forEach(id => {
    books[id] = { id, ownerId: id, entries: [] };
  });

  await updateDoc(roomRef(roomCode), {
    status: 'writing',
    currentStep: 0,
    totalSteps: playerIds.length,
    stepStartedAt: serverTimestamp(),
    stepDuration: 90000,
    books,
    readyPlayers: [],
  });
}

// Submit teksta (WritingScreen ili DescribingScreen)
export async function submitTextEntry(
  roomCode: string,
  bookId: string,
  playerId: string,
  step: number,
  text: string
) {
  const entry: BookEntry = { step, authorId: playerId, type: 'text', text };
  await updateDoc(roomRef(roomCode), {
    [`books.${bookId}.entries`]: arrayUnion(entry),
    readyPlayers: arrayUnion(playerId),
  });
}

// Submit crteža (DrawingScreen)
export async function submitDrawingEntry(
  roomCode: string,
  bookId: string,
  playerId: string,
  step: number,
  strokes: Stroke[],
  thumbnailDataUrl: string
) {
  const compressed = strokes.map(s => ({
    ...s,
    points: simplifyPoints(s.points, 0.002),
  }));

  const entry: BookEntry = {
    step,
    authorId: playerId,
    type: 'drawing',
    strokes: compressed,
    thumbnailDataUrl,
  };

  await updateDoc(roomRef(roomCode), {
    [`books.${bookId}.entries`]: arrayUnion(entry),
    readyPlayers: arrayUnion(playerId),
  });
}

// Prelaz na sljedeći step — izvršava SAMO host
export async function advanceStep(room: GarticRoom, roomCode: string) {
  const nextStep = room.currentStep + 1;
  const isLastStep = nextStep >= room.totalSteps;

  const nextStatus = isLastStep
    ? 'reveal'
    : nextStep % 2 === 1
      ? 'drawing'
      : 'writing';  // 'writing' status pokriva i opisivanje

  await updateDoc(roomRef(roomCode), {
    currentStep: nextStep,
    status: nextStatus,
    stepStartedAt: serverTimestamp(),
    stepDuration: nextStatus === 'drawing' ? 120000 : 90000,
    readyPlayers: [],
  });
}
```

---

## Ekrani koje moraš napraviti

### 1. HomeScreen (`app/page.tsx`)
- Input za ime (localStorage `playerName`)
- "Kreiraj sobu" → generiše 4-slovna kod, redirect na `/room/[code]`
- "Pridruži se" + input za kod

### 2. LobbyScreen
- Lista igrača real-time
- Host vidi "Pokreni" (disabled ispod 3 igrača)
- Pokretanje → `startGame()`

### 3. WritingScreen
- Prazan textarea, limit 120 znakova
- Svako piše za svoju knjigu (`myBookId = playerIds[myIndex]`)
- Timer 90s, po isteku auto-submit ili prazan string
- Submit → `submitTextEntry()` + prikaži WaitingScreen

### 4. WaitingScreen
- Prikaži listu igrača s checkmarkovima (`readyPlayers`)
- Host listener: kad `readyPlayers.length === totalPlayers` → `advanceStep()`
- Svi ostali čekaju pasivno na `onSnapshot`

### 5. DrawingScreen
- Na vrhu: tekst iz prethodnog entry u knjizi (read-only)
- Canvas ispod: pen, eraser, boje, clear
- Boje: `#000000`, `#ffffff`, `#ef4444`, `#3b82f6`, `#22c55e`, `#f59e0b`, `#8b5cf6`, `#ec4899`
- Veličine: 4px, 8px, 16px
- Timer 120s
- Submit → `generateThumbnail()` + kompresija + `submitDrawingEntry()`

### 6. DescribingScreen
- Na vrhu: read-only canvas koji replayuje strokes iz prethodnog entry
- Ispod: textarea za opis, limit 120 znakova
- Timer 90s
- Submit → `submitTextEntry()`
- `status === 'writing' && currentStep > 0` → ovaj ekran (ne WritingScreen)

### 7. RevealScreen
- Prikaži grid svih knjiga kao thumbnailovi (ili naziv autora ako nema crteza)
- Host klika "Otvori knjigu" → jedna po jedna
- Za svaku knjigu: otkrivaj entry po entry s animacijom (Framer Motion)
- Naizmjenično: tekst kartica → crtež kartica (read-only canvas replay) → tekst...
- Na kraju svake knjige pauza 3s, host klika "Sljedeća"
- Kad sve knjige → status → `'finished'`

### 8. FinalScreen
- "Kraj igre!" poruka
- Prikaži najsmješniji/najdalji par (original vs. finalni unos)
- "Igraj ponovo" → novi lobby isti igrači

---

## Određivanje ekrana iz statusa

```typescript
// app/room/[code]/page.tsx

function getCurrentScreen(room: GarticRoom, playerId: string) {
  switch (room.status) {
    case 'lobby':      return <LobbyScreen />;
    case 'writing':
      if (room.currentStep === 0) return <WritingScreen />;
      return <DescribingScreen />;  // isti status, drugačiji step
    case 'drawing':    return <DrawingScreen />;
    case 'reveal':     return <RevealScreen />;
    case 'finished':   return <FinalScreen />;
  }

  // Igrač koji je submitovao vidi WaitingScreen dok čeka ostale
  if (room.readyPlayers.includes(playerId)) return <WaitingScreen />;
}
```

---

## Folder struktura

```
gartic/
├── game.config.json
├── lib/
│   ├── types.ts
│   ├── firestore.ts
│   └── rotation.ts
├── hooks/
│   ├── useRoom.ts          # onSnapshot wrapper
│   └── useGameTimer.ts     # timer iz stepStartedAt
├── components/
│   ├── Canvas.tsx          # dijeljeni canvas komponenta
│   ├── StaticCanvas.tsx    # read-only replay crteža
│   └── screens/
│       ├── HomeScreen.tsx
│       ├── LobbyScreen.tsx
│       ├── WritingScreen.tsx
│       ├── WaitingScreen.tsx
│       ├── DrawingScreen.tsx
│       ├── DescribingScreen.tsx
│       ├── RevealScreen.tsx
│       └── FinalScreen.tsx
└── app/
    ├── page.tsx
    └── room/
        └── [code]/
            └── page.tsx
```

---

## game.config.json

```json
{
  "id": "gartic",
  "name": "Gartic",
  "description": "Pišeš, neko crta, neko opisuje — vidi gdje završi tvoja poruka.",
  "shortDescription": "Telefon koji se crta",
  "icon": "📞",
  "accentColor": "#ec4899",
  "minPlayers": 3,
  "maxPlayers": 8,
  "avgDuration": "20-30 min",
  "tags": ["crtanje", "pisanje", "haos", "kreativnost"],
  "version": "1.0.0",
  "gameType": {
    "id": "gartic",
    "statuses": ["lobby", "writing", "drawing", "describing", "reveal", "finished"]
  },
  "files": {
    "types": "lib/types.ts",
    "firestore": "lib/firestore.ts",
    "components": "components/screens/",
    "pages": {
      "home": "app/page.tsx",
      "room": "app/room/[code]/page.tsx"
    }
  }
}
```

---

## Obavezna pravila iz GAME_STANDARD.md

- `GarticRoom` extends `BaseRoom` sa `gameType: 'gartic'`
- `Player` extends `BasePlayer`
- `newRoom()` mora imati `gameType: 'gartic'`
- Graceful end: ako < 3 connected igrača → `status: 'finished'`, `winner: null`
- Leave → `router.push('/')`
- Sve rute koriste `/games/gartic/` prefix u Hubu
- Nema hardcoded Firebase importa — sve kroz `@/lib/firebase`
- `localStorage` ključevi: `'playerId'` i `'playerName'`

---

## Dizajn sistem

- Pozadina: `#080b14`
- Surfaces: `#0f1320` / `#161b2e`
- Tekst: `#f1f5f9`
- Akcent: `#ec4899` (pink — asocija na kreativnost i zabavu)
- Font: Space Grotesk
- Animacije: Framer Motion, `spring { stiffness: 300, damping: 20 }`
- Mobile-first, `100dvh` ne `100vh`
- CSS klase iz globals.css: `.breathing-orb`, `.glitch-text`, `.glow-v`

---

## Firestore limit — važno za 6+ igrača

Sa 6+ igrača × 3 crteža, `books` field može pribliziti 1MB Firestore limit.
Za 3–5 igrača jedan dokument je sasvim siguran.
Ako planiraš 6+ igrača, prebaci crteže u subcollection:

```
rooms/{code}/entries/{bookId}_{step} → { strokes, thumbnailDataUrl }
```

Glavni dokument tada čuva samo `thumbnailDataUrl` inline.

---

## Redosljed implementacije

1. `lib/types.ts` + `lib/rotation.ts` — napiši i testiraj rotaciju sa mock podacima
2. `lib/firestore.ts` — sve operacije
3. `hooks/useRoom.ts` + `hooks/useGameTimer.ts`
4. `components/Canvas.tsx` + `components/StaticCanvas.tsx`
5. HomeScreen + LobbyScreen (soba mora raditi end-to-end)
6. WritingScreen + WaitingScreen
7. DrawingScreen
8. DescribingScreen
9. RevealScreen — posveti najviše vremena ovdje, to je klimaks igre
10. FinalScreen
11. `game.config.json`

---

## Checklist prije pusha

- [ ] `tsc --noEmit` prolazi bez greške
- [ ] `npm run build` prolazi lokalno
- [ ] Rotacija testirana sa 3, 4, 5 igrača na papiru
- [ ] Canvas submit testiran sa dva browsera — strokes se ispravno replayuju
- [ ] Timer sinkronizovan (provjeri sa dva uređaja)
- [ ] Touch eventi rade na mobilnom
- [ ] Graceful end na disconnect implementiran
- [ ] Leave vodi na `/`
- [ ] Nema `any`, nema `// @ts-ignore`
- [ ] Svi Firestore importi kroz `@/lib/firebase`
- [ ] Reveal animacija radi glatko na mobilnom

Nakon pusha, integracija u Hub:
```bash
npx tsx scripts/add-game.ts https://github.com/[tvoj-repo]
```
