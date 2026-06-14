# ANGOLI — Blueprint completo (struttura 100% replicabile)

Questo documento descrive **al 100%** la struttura del gioco *Angoli*, così com'è
nel codice reale del progetto. Serve per:

1. **Ricreare Angoli identico** da zero.
2. **Clonare lo stesso pattern** su un nuovo gioco (es. "Frazioni", "Capitali", "Note musicali"),
   ottenendo un risultato funzionante al 100% con lo stesso look, le stesse animazioni,
   la stessa architettura.

Tutto ciò che leggi qui è **derivato dal codice**, non inventato. Dove serve, sono
indicati i nomi esatti di file, classi CSS, variabili e funzioni.

---

## 0. Indice

1. Stack e architettura del progetto
2. Albero dei file di un gioco
3. I 4 strati di un gioco (Menu → Tutorial → Header/Modebar → Stage)
4. Macchina a stati e flusso utente
5. Sistema di design (token, colori, dark mode, tipografia)
6. Componenti riusabili condivisi (GameIntro, utils)
7. Anatomia di ogni schermata (DOM + CSS chiave)
8. Animazioni (catalogo completo)
9. Persistenza (localStorage)
10. Registrazione del gioco (routing + card nel portfolio)
11. Dipendenze
12. **CHECKLIST: creare un nuovo gioco da zero**
13. Glossario classi CSS prefissate

---

## 1. Stack e architettura del progetto

| Aspetto | Scelta |
|---|---|
| Framework | **React 18** (function components + hooks) |
| Linguaggio | **TypeScript** |
| Build | **Vite** |
| Routing | **react-router** (`BrowserRouter` in `src/main.tsx`) |
| Icone | **lucide-react** (UI) + **react-icons/si** (brand, solo nel portfolio) |
| Effetti | **canvas-confetti** (vittorie/trofei) |
| Design system base | **Bootstrap Italia 2.18.1** (Kit Italia) — token e pattern visivi |
| Stile dei giochi | **CSS-in-JS inline** dentro `<style>{...}</style>` nel componente, **non** file `.css` separati |
| Persistenza | `localStorage` |
| Font | `"Titillium Web", Geneva, Tahoma, sans-serif` |

**Principio chiave:** ogni gioco è una **SPA autonoma in un solo file** (più un file menu),
montata su una rotta dedicata. Tutto il CSS del gioco vive **inline** in un blocco
`<style>` alla fine del JSX, con classi prefissate (`ang-` per Angoli). Niente CSS globale,
niente conflitti tra giochi.

---

## 2. Albero dei file di un gioco

```
src/
├─ main.tsx                      # router: registra la rotta /angoli (lazy import)
├─ app/
│  ├─ App.tsx                    # portfolio/home: array PROJECTS → card del gioco
│  ├─ components/
│  │  └─ GameIntro.tsx           # tutorial RIUSABILE (condiviso tra tutti i giochi)
│  ├─ utils/
│  │  ├─ device.ts               # isIOS()
│  │  └─ local.ts                # isLocalhost(), activateLocalMode()
│  └─ angoli/
│     ├─ Angoli.tsx              # IL GIOCO (stato, logica, header, stage, CSS)
│     └─ AngoliMenu.tsx          # menu iniziale (scelta modalità + stats)
public/
└─ angoli-logo.png               # logo del gioco (quadrato, ~512px)
```

Un gioco = **2 file propri** (`Gioco.tsx` + `GiocoMenu.tsx`) + **1 logo** in `public/`
+ **1 riga** nel router + **1 oggetto** nell'array `PROJECTS` del portfolio.
Tutto il resto (`GameIntro`, utils) è condiviso e **non va duplicato**.

---

## 3. I 4 strati di un gioco

Ogni gioco è composto, nell'ordine, da **quattro livelli sovrapposti** controllati da stato:

```
┌─────────────────────────────────────────────┐
│  z-300  TUTORIAL  (GameIntro, overlay)        │  ← showTutorial
├─────────────────────────────────────────────┤
│  z-200  MENU      (AngoliMenu, fixed inset:0) │  ← showMenu
├─────────────────────────────────────────────┤
│  z-100  OVERLAY trofeo (modale)               │  ← trophy
├─────────────────────────────────────────────┤
│  z-20   HEADER (sticky) + MODEBAR             │
│  z-0    STAGE  (figura + pannello di gioco)   │  ← sempre montato
└─────────────────────────────────────────────┘
```

Il **gioco vero** (header + modebar + stage) è **sempre montato**. Menu e Tutorial sono
overlay `position:fixed; inset:0` che lo coprono. Questo permette transizioni morbide e
mantiene lo stato del gioco vivo sotto.

**z-index reali usati:** header `20`, trophy overlay `100`, menu `200`, tutorial `300`,
autofill dev `999`.

---

## 4. Macchina a stati e flusso utente

### Stato React principale (in `Angoli.tsx`)

```ts
showMenu      : boolean      // true all'apertura → mostra il menu
showTutorial  : boolean      // overlay tutorial
step          : StepMode     // difficoltà corrente (20|10|5|2|1)
angle         : number       // valore segreto da indovinare
rotation      : number       // rotazione casuale della figura (0–359°)
palette       : Palette      // colori vivi del round (random)
spin          : number       // contatore round → forza remount SVG (key)
input         : string       // cifre digitate (max 3)
attempts      : number       // tentativi nel round
history       : {guess,hint}[]  // tentativi sbagliati + indizio ↑/↓
gameState     : "playing"|"won"
strike        : number       // vittorie consecutive
best          : number       // record (localStorage)
achieved      : number[]     // soglie trofeo già sbloccate
trophy        : Trophy|null  // trofeo da mostrare in modale
score         : number       // punteggio 0–100 del round vinto
msg           : string       // messaggio errore effimero (1.7s)
shake         : boolean      // anima l'input box in caso di errore
elapsed       : number       // ms del cronometro
dark          : boolean      // tema scuro
```

### Flusso

```
APRE LA PAGINA
   └─ showMenu = true  → AngoliMenu
         │  utente sceglie modalità + "Gioca"
         ▼
   onPlay(step):
     setStep, goNext(step)
     se NON ha mai visto il tutorial → showTutorial = true (resta sopra il menu)
     altrimenti → showMenu = false  (entra nel gioco)
         │
         ▼
   TUTORIAL (prima volta obbligatorio)
     onDone → showTutorial=false, showMenu=false → GIOCO
         │
         ▼
   PLAYING
     - digita cifre (tastiera fisica 0-9 / numpad a schermo)
     - INVIO/Enter → handleSubmit()
         · validazioni (numero, range 1–399, multiplo di step, non già provato)
         · se sbagliato → push in history con indizio "maggiore"/"minore"
         · se giusto → gameState="won", confetti, +1 strike, salva best
              · se strike sblocca un trofeo nuovo → modale trofeo
              · altrimenti → auto-avanza al round dopo 1.9s
         ▼
   WON  → pannello reveal (angolo, punteggio, tentativi, tempo)
        → "Prossimo angolo" o auto → goNext() → torna a PLAYING
```

### Funzioni chiave (firma esatta)

```ts
randomAngle(step): number          // (rand(floor(399/step))+1)*step  → 1..399 multiplo di step
randomRotation(): number           // 0..359
randomPalette(): Palette           // coppia colori HSL armonici (raggi + arco complementare)
gradToRad(g): number               // g*π/200  (gradianti, non gradi!)
getScore(attempts): number         // max(0, 100-(a-1)*15) → 100,85,70,55,40,25...
getScoreEmoji(s): string           // 🏆≥100 ⭐≥85 🎯≥70 👏≥55 😅≥40 😮‍💨
getTrophyForStrike(n): Trophy|null // match esatto su soglia 3/5/7/10
fmtTime(ms): string                // "mm:ss.cc" (centesimi)

goNext(step?)        // nuovo round: nuovo angolo/rotazione/palette, spin++, reset
changeStep(step)     // cambia difficoltà: azzera strike+score, goNext
handleSubmit()       // valida e processa il tentativo
numpad(key)          // gestisce i tasti del numpad a schermo ("CANC"/"INVIO"/cifra)
flash(msg)           // messaggio errore effimero (1.7s)
doShake()            // shake input 0.5s
toggleDark()         // tema + persist
```

### Ref usati (per evitare stale closure)

`msgT`, `autoT` (timeout), `stRef` (gameState), `subRef` (handleSubmit corrente),
`stepR` (step corrente), `startT` (inizio round), `rafRef` (requestAnimationFrame del cronometro).
Pattern: i ref vengono aggiornati in `useEffect` (commit phase), non in render.

---

## 5. Sistema di design

### 5.1 Token CSS (definiti su `.ang-page`, tema chiaro)

Sono variabili CSS, derivate da Bootstrap Italia. **Da copiare 1:1** in un nuovo gioco:

```css
/* Brand / Kit Italia */
--green:       hsl(160,100%,25%);   /* primario */
--green-dark:  hsl(160,100%,19%);
--amber:       hsl(36,100%,30%);
--absent:      hsl(350,60%,50%);    /* errore/rosso */
--bs-100:      hsl(0,0%,96%);
--bs-200:      hsl(0,0%,90%);
--bs-300:      hsl(0,0%,83%);
--radius:      8px;
--radius-sm:   4px;
--focus-ring:  0 0 0 .25rem rgba(0,127.5,85,.25);
--shadow-key:  0 .125rem .25rem rgba(0,0,0,.075);
--shadow-card: 0 .5rem 1rem rgba(0,0,0,.12);
--hdr-h:       52px;   /* altezza header (56px su desktop) */
--bar-h:       53px;   /* altezza barra modalità */

/* Token tematici (chiaro; sovrascritti in .dark) */
--surface, --bar-bg, --bar-border, --panel, --panel-bd,
--key-bg, --key-bg-h, --key-bg-a, --key-fg,
--chip-bg, --chip-bd, --chip-fg, --chip-step-bg, --chip-step-fg,
--text, --text-soft, --stat-bg, --stat-bd, --legend-sep,
--kbd-bg, --kbd-bd, --kbd-fg
```

### 5.2 Dark mode

Si attiva con la classe `.ang-page.dark`, che **ridefinisce gli stessi token** con valori scuri.
Tutti i componenti leggono i token → cambiano insieme automaticamente. Solo pochi elementi
(header, stage gradient, alcune tinte) hanno override espliciti `.ang-page.dark .xxx`.

Toggle persistito in `localStorage["games-dark"]` (`"1"`/`"0"`); default = `prefers-color-scheme`.
**Nota:** la chiave è condivisa tra i giochi (`games-dark`), così il tema è coerente ovunque.

### 5.3 Palette dei colori "vivi" del round

Ad ogni round una palette **casuale ma armonica** colora la figura:

```ts
type Palette = { ray:string; arc:string; arcFill:string; dot:string };
// h = random 0..360
// arcH = h + 150 + random(0..80)   → colore complementare/triadico
ray  = hsl(h, 75%, 45%)
dot  = hsl(h, 80%, 36%)
arc  = hsl(arcH, 85%, 45%)
arcFill = hsl(arcH, 85%, 45% / 0.18)
```

### 5.4 Brand verde del portfolio (override di Bootstrap Italia)

In `App.tsx`, `:root` ridefinisce `--bs-primary: #2F7D4A` (neroverde Sassuolo) e i link.
Tutti i `bg-primary`, `text-primary`, `btn-primary` diventano verdi.

---

## 6. Componenti riusabili condivisi

### 6.1 `GameIntro.tsx` — Tutorial universale

**Questo è il pezzo più riusabile del progetto. Non duplicarlo: usalo per ogni gioco.**

Esporta:
- `default GameTutorial` — il componente overlay.
- `hasSeenTutorial(gameKey)`, `resetTutorial(gameKey)` — gestiscono la chiave
  `localStorage["game-tutorial-seen-<gameKey>"]`.
- tipo `IntroStep = { title:string; body:string; visual?:ReactNode }`.
- alias retro-compat: `hasSeenIntro`, `resetIntro`.

Props:
```ts
{ gameKey:string; steps:IntroStep[]; accentColor:string; darkBg:string; dark?:boolean; onDone:()=>void }
```

Comportamento:
- Card **quadrata** (`aspect-ratio: 1/1`): area visual in alto (con padding fisso 1.75rem,
  la figura non tocca mai i bordi) + titolo/testo sotto.
- Header "Tutorial · Passo N di M" + bottone "Salta".
- Dot di progresso (quello attivo si allunga a 22px).
- CTA: "Avanti →" o "Ho capito, si gioca!" sull'ultimo passo.
- Alla fine (o "Salta") scrive la chiave seen e chiama `onDone` dopo 280ms (fade-out).

I **visual** di ogni passo sono componenti SVG/HTML animati passati dal gioco. Le animazioni
del tutorial vivono in una stringa CSS che il gioco inietta una volta (`ANGOLI_TUTORIAL_CSS`)
con classi prefissate `gtv-` (game-tutorial-visual).

### 6.2 `utils/device.ts` → `isIOS()`
### 6.3 `utils/local.ts` → `isLocalhost()`, `activateLocalMode(cb)`

`activateLocalMode` esegue la callback solo su localhost (usato per la pill "Local" e per
l'autofill in dev).

---

## 7. Anatomia di ogni schermata

### 7.1 MENU (`AngoliMenu.tsx`)

Struttura dati delle modalità:
```ts
interface Mode { step:StepMode; name:string; desc:string; tag:string; color:string; bg:string; bgDark:string }
const MODES: Mode[] = [ /* 5 voci: 20,10,5,2,1 */ ]
```

Props: `{ dark, bestStrike, trophiesCount, onPlay(step), onTutorial() }`.

**Due layout completamente separati nel DOM**, switchati via media query (non riflusso):
- `.anm-mobile` (visibile <760px): **colonna unica** → hero verde (logo+titolo+tagline) →
  body (stats card, lista modalità, bottone Play, "Come si gioca", "Torna ai progetti").
- `.anm-desktop` (visibile ≥760px): **2 colonne centrate** (max-width 900px) → sinistra hero
  verde pieno con stats, destra selezione modalità.

Elementi condivisi costruiti come variabili JSX (`ModeList`, `PlayBtn`, `BackBtn`) e
riusati in entrambi i layout.

Ogni voce modalità: badge step (es. "20 g"), nome, tag colorato, descrizione, check ✓ se
selezionata. Il bottone Play prende il colore della modalità selezionata.

Lo stile del menu è **inline `style={{}}`** (con valori derivati da `dark`) + un blocco
`<style>` con classi `anm-`. È l'unico file del gioco che usa molto inline-style per i colori
dinamici per-modalità.

### 7.2 HEADER (in `Angoli.tsx`)

`.ang-header` sticky, sfondo `#103820` (verde scurissimo), 3 zone:
- **left:** freccia indietro (`<a href="/#progetti">`) + titolo `ANG<span>OL</span>I` (accento verde chiaro).
- **center:** pill "Menu" (riapre `showMenu`).
- **right:** 3 icon-button → nuova partita (`RotateCcw`), tema (`Moon`/`Sun`), aiuto (`HelpCircle`).

Su desktop diventa `grid-template-columns: 1fr auto 1fr`.

### 7.3 MODEBAR (in `Angoli.tsx`)

`.ang-modebar`: striscia con i 5 chip difficoltà sempre visibili. Chip attivo verde pieno.
Click su un chip diverso → `changeStep` (azzera strike/score e riparte).

### 7.4 STAGE (in `Angoli.tsx`)

`.ang-stage`: occupa esattamente viewport − header − modebar, **senza scroll** (`overflow:hidden`,
`height:100dvh` sulla pagina). Mobile = colonna; desktop (≥760px) = riga (figura | pannello).

**Sinistra — figura:** `.ang-fig-wrap` con `<AngleDisplay>` (SVG 400×400) + cronometro badge.
Dimensione responsiva con `min(72vw, 38vh, 300px)` (mobile) e `clamp(...)` legato all'altezza utile (desktop).

**Destra — pannello `.ang-ctrl-block`** (card Kit Italia), contiene:
- **Stats row:** Streak (🔥) + Record (🏆).
- **Pannello scambiabile** `playing` ↔ `won`:
  - *playing:* legenda comandi (kbd) → input box → history → **numpad** (3×4: 1-9, CANC, 0, INVIO).
  - *won:* reveal (emoji punteggio, "L'angolo era Ng", griglia punteggio/tentativi/tempo) → "Prossimo angolo".

### 7.5 La figura SVG (`AngleDisplay`)

- viewBox `0 0 400 400`, vertice al centro (200,200), raggi lunghi 150, arco r=64.
- `key={spin}` → **remount ad ogni round** → riparte l'animazione di disegno.
- Strati: **glow** (copia sfocata via `feGaussianBlur`, pulsa in opacità) sotto, **tracciato nitido** sopra.
- Arco grande se angolo > 200g (= >180°): flag `large-arc`.
- `arrowHead()` calcola le punte freccia; `rotation` ruota l'intero gruppo.
- Animazione "disegno": `stroke-dasharray/offset` impostati **inline** con la lunghezza reale
  (`arcLen = arcR*rad`), così l'arco si scopre sempre per intero anche su angoli grandi.

### 7.6 MODALE TROFEO

`.ang-overlay` (z-100) + `.ang-tcard`: header colorato con la tinta del trofeo (`trophy.accent`),
emoji, label, descrizione, CTA "Continua". 4 trofei: soglie **3/5/7/10** strike.

---

## 8. Catalogo animazioni

Tutte le animazioni del gioco (classi `ang-`), con keyframe reali:

| Nome | Cosa anima | Keyframe / tecnica |
|---|---|---|
| `ang-pulse` | alone neon della figura | opacità .4↔.7, 3s infinito |
| `ang-draw` | disegno raggi/arco | `stroke-dashoffset` → 0 |
| `ang-pop` | vertice / emoji | `scale(0)`→`scale(1)`, cubic-bezier elastica |
| `ang-fade` | punte freccia, fill arco, label | `opacity`→1 |
| `ang-panel-in` | cambio pannello play/won | translateY(6px)+fade |
| `ang-shake` | input box errato | translateX a zig-zag 0.45s |
| `ang-slide-up` | reveal vittoria, modale, CTA | translateY+scale, bezier 1.56 |
| `ang-slide-in` | righe history | translateX(-6px)+fade |
| `ang-chrono-stop` | cronometro alla vittoria | scale 1→1.12→1 |
| `ang-fadein` | overlay trofeo | opacity |
| `ang-drop` | (titolo, definita) | translateY(-10px)+fade |

Tempistiche di disegno figura (delay a catena): ray1 0s, ray2 .12s, arc .35s, fill .5s, head1 .55s, head2 .67s.

**Tutorial** (classi `gtv-`): `gtv-draw`, `gtv-fade`, `gtv-pop`, `gtv-slide-in`, `gtv-bar-in`,
`gtv-grow`, `gtv-trophy-pop`. Più `gt-up` e `gt-vis-in` interni a `GameIntro`.

Confetti: vittoria `particleCount 55–110`; trofeo `220`, spread `110`.

---

## 9. Persistenza (localStorage)

| Chiave | Tipo | Significato |
|---|---|---|
| `angoli-best-strike` | number | record streak |
| `angoli-trophies` | JSON number[] | soglie trofeo sbloccate |
| `games-dark` | `"1"`/`"0"` | tema scuro (**condiviso tra giochi**) |
| `game-tutorial-seen-angoli` | `"1"` | tutorial già visto (gestito da GameIntro) |

Per un nuovo gioco "X": usa prefisso `x-` (`x-best-...`) e `gameKey="x"`; **riusa** `games-dark`.

---

## 10. Registrazione del gioco

### 10.1 Router — `src/main.tsx`
```tsx
const Angoli = lazy(() => import("./app/angoli/Angoli.tsx"));
// ...
<Route path="/angoli" element={<Suspense fallback={null}><Angoli /></Suspense>} />
```

### 10.2 Card nel portfolio — `src/app/App.tsx`
Oggetto in `const PROJECTS = [...]`:
```ts
{ category:"Web game", date:"30 mag 2026", title:"Angoli", url:"/angoli",
  thumb:"angoli", desc:"...", tags:["React","TypeScript","SVG","Game design"] }
```
+ una miniatura SVG `AngoliThumb()` mappata in `ProjectThumb({name})`.

---

## 11. Dipendenze (package.json)

`react`, `react-dom`, `react-router`, `lucide-react`, `react-icons`, `canvas-confetti`.
Dev: `vite`, `typescript`, `@types/*`. Design system: `bootstrap-italia` (servito da `public/`).

---

## 12. ✅ CHECKLIST — creare un nuovo gioco da zero

Esempio: gioco **"Frazioni"** (key `frazioni`, prefisso classi `fra-`, accento `#2F7D4A`).

1. **Logo:** metti `public/frazioni-logo.png` (quadrato).
2. **Cartella:** `src/app/frazioni/`.
3. **`FrazioniMenu.tsx`** — copia `AngoliMenu.tsx`:
   - rinomina classi `anm-`→ (puoi tenere `anm-`, sono condivise solo nel file) ;
   - aggiorna `MODES` (difficoltà del nuovo gioco), titolo, tagline, logo `src`.
4. **`Frazioni.tsx`** — copia `Angoli.tsx`:
   - rinomina tutte le classi `ang-` → `fra-` (così il CSS non collide);
   - sostituisci la **logica di dominio**: `randomAngle`→`randomFrazione`, validazioni,
     condizione di vittoria, indizi (`history`), figura SVG (`AngleDisplay`→il tuo visual);
   - aggiorna i `TROPHIES` (testi) e i label difficoltà;
   - aggiorna le chiavi localStorage (`frazioni-best-strike`, `frazioni-trophies`);
   - **riusa** `games-dark` (non rinominare il tema).
5. **Tutorial:** definisci `FRAZIONI_INTRO_STEPS: IntroStep[]` (4 passi con visual animati) +
   `FRAZIONI_TUTORIAL_CSS` (classi `gtv-` o un tuo prefisso). Usa `GameTutorial` con
   `gameKey="frazioni"`, `accentColor`, `darkBg`. **Non duplicare `GameIntro.tsx`.**
6. **Router:** in `src/main.tsx` aggiungi `lazy` + `<Route path="/frazioni" .../>`.
7. **Portfolio:** in `App.tsx` aggiungi l'oggetto in `PROJECTS` (`url:"/frazioni"`) e,
   se vuoi la miniatura, una `FrazioniThumb()` mappata in `ProjectThumb`.
8. **Verifica:** `npm run dev` → `/frazioni`. Controlla: menu → tutorial (prima volta) →
   gioco → vittoria + confetti → trofeo → dark mode → responsive <760 / ≥760.

**Cosa NON cambiare (è la "spina dorsale" replicabile):**
- I 4 strati (menu/tutorial/header+modebar/stage) e i loro z-index.
- I token CSS (sezione 5.1) e la struttura dark-mode a token.
- Il pattern card Kit Italia, il numpad, l'input box con shake, lo stats-row.
- `GameIntro` e gli utils (condivisi).
- Le chiavi/pattern localStorage.

---

## 13. Glossario classi CSS prefissate (`ang-`)

**Pagina/layout:** `ang-page`(+`.dark`), `ang-header`, `ang-hdr-left/center/right`,
`ang-title`, `ang-accent`, `ang-iconbtn`, `ang-mode-pill`, `ang-modebar`, `ang-chip`(+`--active`),
`ang-chip-label`, `ang-chip-step`, `ang-stage`.

**Figura:** `ang-game`, `ang-fig-wrap`, `ang-svg`, `ang-glow`, `ang-arc`, `ang-arcfill`,
`ang-ray`(`1/2`), `ang-head`(`1/2`), `ang-vertex`, `ang-chrono`(+`--stop`), `ang-chrono-val`.

**Pannello:** `ang-ctrl-block`, `ang-card-stats`, `ang-card-stat`(+`--mid`), `ang-card-stat-ico/val/lbl`,
`ang-panel`(+`--play`/`--won`), `ang-legend-list/keys/dash/txt`, `ang-kbd-up/dn`,
`ang-input-box`, `ang-iv`, `ang-iu`, `ang-input-msg`, `ang-shake`.

**History:** `ang-hist`, `ang-hrow`(+`--maggiore`/`--minore`), `ang-hn/hv/ha/hl`.

**Numpad:** `ang-keyboard`, `ang-krow`, `ang-key`(+`--del`/`--ok`).

**Vittoria:** `ang-win-reveal`, `ang-wr-e/label/a/grid/cell/num/sub`, `ang-next`.

**Trofeo:** `ang-overlay`, `ang-tcard`, `ang-thead`, `ang-tgrade/tico/tlbl`, `ang-tbody`,
`ang-tdesc/tsub/tcta`. **Dev:** `ang-autofill`.

**Menu (`anm-`):** `anm-root/mobile/desktop`, `anm-hero`, `anm-logo-wrap/img`, `anm-title/accent/tagline/kicker`,
`anm-body`, `anm-stats-card`(+`-dark`), `anm-stat`(+`-val/-lbl/-sep`), `anm-section-label`,
`anm-tut-btn`, `anm-back-btn`, `anm-desktop-left/right`.

**Tutorial visual (`gtv-`):** `gtv-angle/ray/arc/head/vertex/label`, `gtv-hints/hint-row/...`,
`gtv-scale/...`, `gtv-trophy/...`.

---

*Fine blueprint. Tutto verificato sul codice in `src/app/angoli/`, `src/app/components/GameIntro.tsx`,
`src/app/utils/`, `src/main.tsx`, `src/app/App.tsx`.*
