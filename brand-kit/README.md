# Brand Kit — pacchetto per un nuovo sito

Tutto il "linguaggio visivo e tecnico" del sito attuale, impacchettato per costruire
**un nuovo sito da zero** (per l'azienda) senza reinventare nulla: colori, caratteri,
tema chiaro/scuro automatico, multilingua a 4 lingue, componenti UI e il motore giochi.

> È un **kit di partenza**, non un sito pronto. Copi le cartelle che ti servono nel
> nuovo progetto, importi gli stili, colleghi i due o tre widget globali e sei operativo.

---

## Cosa c'è dentro

```
brand-kit/
├─ README.md                  ← questa guida (parti da qui)
├─ docs/                      ← manuale, un file per argomento
│  ├─ 01-colori.md               palette, hex, quando usarle
│  ├─ 02-tipografia.md           i 3 caratteri e le regole
│  ├─ 03-tema-chiaro-scuro.md    il tema automatico (sensore orario) + widget
│  ├─ 04-multilingua.md          IT/EN/FR/DE senza reload, come tradurre
│  ├─ 05-motore-giochi.md        accenti per-gioco, leaderboard (opzionale)
│  ├─ 06-componenti-ui.md        i componenti shadcn/Radix
│  └─ 07-avvio-nuovo-sito.md     ★ ricetta passo-passo per il sito nuovo
│
├─ styles/                    ← CSS pronti da importare
│  ├─ design-tokens.css          ★ fonte unica dei colori (tutte le palette)
│  ├─ theme.css                  variabili shadcn (light + .dark)
│  ├─ theme-auto.css             stile della barra tema/lingua + tema chiaro pagine
│  ├─ ios.css                    fix per Safari iOS (safe-area, 100vh, ecc.)
│  └─ default_shadcn_theme.css   tema shadcn di riferimento (neutro)
│
├─ core/                      ← moduli TypeScript portabili (nessun accoppiamento)
│  ├─ theme/
│  │  ├─ themeCore.ts            logica del tema (auto/manuale, sensore orario)
│  │  └─ ThemeWidget.tsx         il tasto luna/sole + transizione animata
│  ├─ i18n/
│  │  ├─ langCore.ts             stato della lingua attiva
│  │  ├─ translateDom.ts         motore che traduce il DOM "al volo"
│  │  ├─ LanguageSwitcher.tsx    il selettore di lingua
│  │  └─ dictionary.template.ts  ★ l'unico file da riempire per tradurre
│  └─ game/
│     └─ tokens.ts               accenti neon per-gioco + superfici dark
│
├─ components/ui/             ← 30+ componenti shadcn/ui (Radix + Tailwind)
│
└─ config/                    ← configurazioni di riferimento
   ├─ vite.config.ts
   └─ postcss.config.mjs
```

---

## Lo stack tecnico (com'è fatto il sito attuale)

| Pezzo            | Scelta                                                        |
|------------------|--------------------------------------------------------------|
| Framework UI     | **React 18** + **react-router 7**                            |
| Build            | **Vite 6** + **@tailwindcss/vite** (Tailwind **v4**)         |
| Componenti       | **shadcn/ui** su **Radix UI** (in `components/ui`)           |
| Stile            | CSS custom properties (design tokens) + Tailwind v4          |
| Caratteri        | **Titillium Web** (Design System Italia), Lora, Roboto Mono  |
| Tema             | chiaro/scuro **automatico** (sensore orario) o manuale       |
| Lingue           | **IT / EN / FR / DE**, traduzione del DOM al volo, no reload |
| Deploy           | **Vercel** (build da `main`)                                 |
| Icone            | lucide-react, react-icons                                    |
| Animazioni       | `motion`, canvas-confetti                                    |
| Grafici          | recharts                                                     |

La lista completa delle dipendenze è in [docs/07-avvio-nuovo-sito.md](docs/07-avvio-nuovo-sito.md).

---

## Le due identità visive

Il sito attuale fa convivere **due look** — puoi tenerli entrambi o sceglierne uno
per l'azienda:

1. **Istituzionale "neroverde"** — sobrio, verde `#2F7D4A`, basato sul kit
   Bootstrap Italia. Adatto a pagine informative/aziendali.
2. **Dark premium "viola/indaco"** — superfici vetro, accento `#8b7bff`, tema
   scuro elegante con controparte chiara. Adatto a home, landing, sezioni "vive".

Dettagli e quando usarle: [docs/01-colori.md](docs/01-colori.md).

---

## Partenza rapida (3 mosse)

1. Copia `styles/`, `core/` e `components/ui/` nel nuovo progetto (React + Vite).
2. Nel tuo `main.tsx` importa gli stili e attiva i tre sistemi globali
   (tema, lingua, motore i18n) — la ricetta esatta è in
   [docs/07-avvio-nuovo-sito.md](docs/07-avvio-nuovo-sito.md).
3. Rinomina `dictionary.template.ts` → `dictionary.ts` e riempilo con le tue frasi.

Buon lavoro. Ogni file `.md` in `docs/` spiega un pezzo in modo autonomo.
