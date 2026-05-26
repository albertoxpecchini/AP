# Alberto Pecchini — Portfolio

[![Stack](https://img.shields.io/badge/stack-React%2018%20%C2%B7%20TypeScript%20%C2%B7%20Vite%206-2F7D4A?style=flat-square)](#stack-tecnologico)
[![Design System](https://img.shields.io/badge/design%20system-Bootstrap%20Italia-103820?style=flat-square)](https://italia.github.io/bootstrap-italia/)
[![License](https://img.shields.io/badge/license-MIT-1F6B3D?style=flat-square)](#licenza)

Sito personale di **Alberto Pecchini** — studente CAT all'ITT «Carlo d'Arco» di Mantova, designer e front-end developer. Single-page application costruita su React + Vite con il design system **Bootstrap Italia**, palette ispirata al neroverde del Sassuolo, interazioni curate e integrazione live con l'API di GitHub per le metadata dei progetti.

🔗 **Sito live:** [albertopecchini.it](https://albertopecchini.it) · **Repo:** [github.com/albertoxpecchini/Ap](https://github.com/albertoxpecchini/Ap)

---

## Indice

- [Caratteristiche](#caratteristiche)
- [Stack tecnologico](#stack-tecnologico)
- [Struttura del progetto](#struttura-del-progetto)
- [Sezioni del sito](#sezioni-del-sito)
- [Getting started](#getting-started)
- [Script disponibili](#script-disponibili)
- [Palette & tema](#palette--tema)
- [Integrazioni esterne](#integrazioni-esterne)
- [Accessibilità](#accessibilità)
- [Deploy](#deploy)
- [Roadmap](#roadmap)
- [Licenza](#licenza)
- [Contatti](#contatti)

---

## Caratteristiche

- **SPA in React 18** con bundler Vite 6 e TypeScript.
- **Bootstrap Italia** come design system di base (componenti, griglia, tipografia ufficiali AgID).
- **Palette neroverde Sassuolo** con override completo del primario `--bs-primary` e tonalità chiare/scure coerenti.
- **Animazioni** declarate con `motion/react` (Framer Motion v12) e rispetto di `prefers-reduced-motion`.
- **Card progetti dinamiche**: anteprime screenshot via API Microlink + versione e data ultimo push lette dall'API GitHub.
- **Modali hobby/passioni** con immagine, icona e descrizione, chiusura via overlay, `Esc` o pulsante.
- **Visualizzatore CV** integrato (iframe PDF + fallback download).
- **Local mode** opzionale per anteprime offline (badge visibile in header).
- **PWA-ready**: manifest, set completo di favicon, icone maskable 192/512.
- **Tipografia ufficiale**: Titillium Web, Lora, Roboto Mono.
- **17 social** linkati nel footer (Instagram, TikTok, X, YouTube, GitHub, WhatsApp, Telegram, Snapchat, Pinterest, Reddit, Twitch, Spotify, Threads, Steam, Vinted, Subito, OpenStreetMap).

---

## Stack tecnologico

| Categoria              | Tecnologie                                                                 |
| ---------------------- | -------------------------------------------------------------------------- |
| **Framework**          | React 18, TypeScript                                                       |
| **Build tool**         | Vite 6                                                                     |
| **Design System**      | Bootstrap Italia (CSS + JS bundle, hosted in `/public/bootstrap-italia/`) |
| **Styling**            | Tailwind CSS 4, CSS-in-JS via `<style>` inline, CSS custom properties      |
| **Animazioni**         | motion (Framer Motion v12)                                                 |
| **Icone**              | lucide-react, react-icons (Simple Icons brand pack)                        |
| **Componenti UI**      | Radix UI primitives + shadcn/ui style                                      |
| **Package manager**    | pnpm (workspace), compatibile con npm                                      |
| **CV / asset script**  | Python (`scripts/build_cv.py`, `scripts/build_favicon.py`)                 |

---

## Struttura del progetto

```
Ap/
├── public/
│   ├── bootstrap-italia/       # Design System AgID (CSS, JS, fonts, assets)
│   ├── images/                 # Foto hobby & passioni
│   ├── cv-alberto-pecchini.pdf # CV pronto al download
│   ├── favicon*, icon-*        # Set completo PWA
│   └── site.webmanifest        # Manifest PWA
├── src/
│   ├── app/
│   │   ├── App.tsx             # Componente principale (hero, sezioni, footer, modali)
│   │   ├── components/         # UI primitives shadcn/Radix
│   │   └── utils/local.ts      # Attivazione local mode
│   ├── styles/
│   │   ├── theme.css           # Design tokens (palette verde, dark mode)
│   │   ├── tailwind.css        # Entry Tailwind
│   │   ├── fonts.css           # Caricamento font
│   │   └── index.css           # Aggregatore
│   └── main.tsx                # Entry React
├── scripts/
│   ├── build_cv.py             # Genera il PDF del CV
│   └── build_favicon.py        # Genera set completo favicon/PWA
├── guidelines/                  # Guidelines di sviluppo
├── CV-IDEE.md                  # Brainstorm CV
├── CONTENUTI.md                # Inventario contenuti
├── index.html
├── package.json
├── vite.config.ts
└── README.md
```

---

## Sezioni del sito

1. **Hero** — kicker, titolo, sottotitolo, due CTA, scroll hint animato.
2. **01 — Chi sono** — ritratto + bio (include nota da tifoso del Sassuolo).
3. **02 — Competenze** — 8 card raggruppate (Front-end, Design/UX, AI, Strumenti, Windows/IT, Multimedia, Area tecnica CAT, Lingue).
4. **03 — Curriculum** — timeline verticale + download CV + visualizzatore PDF integrato.
5. **04 — Progetti** — card con screenshot live, tag, versione e data ultimo push da GitHub.
6. **05 — Hobby** — 6 card cliccabili → modale con foto e descrizione.
7. **06 — Passioni** — 6 card cliccabili → modale con foto e descrizione.
8. **07 — Contatti** — CTA mail, WhatsApp, telefono.
9. **Footer** — branding + 17 social + crediti.

---

## Getting started

### Requisiti

- **Node.js** ≥ 18
- **pnpm** ≥ 8 (consigliato) oppure npm/yarn

### Installazione

```bash
git clone https://github.com/albertoxpecchini/Ap.git
cd Ap
pnpm install      # oppure: npm install
```

### Avvio in sviluppo

```bash
pnpm dev          # oppure: npm run dev
```

Apri http://localhost:5173. Hot Module Replacement attivo.

### Build di produzione

```bash
pnpm build        # oppure: npm run build
```

Output in `dist/`. Servi con qualsiasi static host (Vercel, Netlify, GitHub Pages, Nginx, ecc.).

---

## Script disponibili

| Comando          | Descrizione                                |
| ---------------- | ------------------------------------------ |
| `npm run dev`    | Dev server Vite con HMR (porta 5173)       |
| `npm run build`  | Build di produzione in `dist/`             |

### Script Python ausiliari

```bash
python scripts/build_cv.py        # Rigenera public/cv-alberto-pecchini.pdf
python scripts/build_favicon.py   # Rigenera set completo favicon + icone PWA
```

---

## Palette & tema

Palette **neroverde Sassuolo** (sostituisce il blu di default di Bootstrap Italia):

| Token         | Hex       | Uso                                                |
| ------------- | --------- | -------------------------------------------------- |
| Verde scuro   | `#103820` | Header (slim/center/navbar) e footer-main          |
| Verde profondo| `#1F6B3D` | Testo `text-primary`, kicker, timeline, icone hover|
| Verde primario| `#2F7D4A` | `--primary`, `bg-primary`, bordi, pallini timeline |
| Verde chiaro  | `#7FC09A` | `--accent`                                         |
| Verde overlay | `rgba(47, 125, 74, 0.12)` | Sfondi card/chip/icone soft        |

Override implementato in `src/app/App.tsx` con `--bs-primary` per propagare ai componenti Bootstrap Italia, e in `src/styles/theme.css` per i token globali del tema (light/dark).

---

## Integrazioni esterne

- **GitHub REST API** — letta da `App.tsx` per recuperare `pushed_at` e ultima release/tag dei repo dei progetti (no auth, rate limit pubblico).
- **Microlink API** — genera screenshot live (1200×630) dei siti dei progetti come anteprima nelle card.
- **Google Fonts** — Titillium Web, Lora, Roboto Mono (preconnect + display=swap).

---

## Accessibilità

- **Skiplinks** all'inizio della pagina (al contenuto e ai contatti).
- **Marker semantici** `<main>`, `<nav aria-label>`, `<header>`, `<footer>`, `aria-labelledby` sui modali.
- **Focus visibile** su CTA, social e card interattive.
- **`prefers-reduced-motion`** rispettato: niente animazioni di ingresso, scroll hint e hover transform.
- **Contrasto** AA su tutta la palette verde.
- **Modali**: chiusura via overlay, `Esc`, pulsante; trap su `body { overflow: hidden }`.

---

## Deploy

Il sito è una SPA statica → qualsiasi host che serva file statici è sufficiente.

### Vercel (consigliato)

```bash
vercel        # detect automatico: Vite, output dir = dist
```

### GitHub Pages

```bash
pnpm build
# pubblica il contenuto di dist/ su gh-pages branch
```

### Manualmente

```bash
pnpm build
rsync -av dist/ user@server:/var/www/albertopecchini.it/
```

---

## Roadmap

- [ ] Cascina Fontana — pubblicazione sito (in produzione)
- [ ] Rivalta sul Mincio — pubblicazione sito
- [ ] Blog tecnico con MDX
- [ ] Dark mode toggle persistente
- [ ] i18n (it/en) per la versione internazionale
- [ ] Lighthouse score 100 su tutte le metriche

---

## Licenza

Distribuito sotto licenza **MIT**. Il codice è liberamente riutilizzabile; testi, foto personali, CV e contenuti del brand "Alberto Pecchini" sono **© Alberto Pecchini** e non riproducibili senza autorizzazione.

Bootstrap Italia è rilasciato sotto licenza BSD-3-Clause da Presidenza del Consiglio dei Ministri.

---

## Contatti

- **Email** — [pzkko@yahoo.com](mailto:pzkko@yahoo.com)
- **WhatsApp** — [+44 7340 995142](https://wa.me/447340995142)
- **Telefono** — +39 331 407 4198
- **GitHub** — [@albertoxpecchini](https://github.com/albertoxpecchini)
- **Instagram** — [@albertoxpecchini](https://www.instagram.com/albertoxpecchini)
- **Sede** — Mantova, Italia

---

<p align="center">
  <sub>Costruito con ❤️ a Mantova · Forza Sassuolo ⚫🟢</sub>
</p>
