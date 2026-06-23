<div align="center">

# Alberto Pecchini — Portfolio & Game Hub

**SPA React/TypeScript** che fonde un portfolio personale con un _hub_ di sei applicazioni ludico-didattiche a tema architettura, geografia e lingua, su design system **Bootstrap Italia** e palette neroverde Sassuolo.

<!-- ─────────────  METRICHE LIVE (shields.io → GitHub API, auto-aggiornanti)  ───────────── -->

[![Last commit](https://img.shields.io/github/last-commit/albertoxpecchini/AP/main?style=flat-square&logo=git&logoColor=white&color=2F7D4A)](https://github.com/albertoxpecchini/AP/commits/main)
[![Commit activity](https://img.shields.io/github/commit-activity/m/albertoxpecchini/AP?style=flat-square&color=1F6B3D)](https://github.com/albertoxpecchini/AP/pulse)
[![Created at](https://img.shields.io/github/created-at/albertoxpecchini/AP?style=flat-square&label=nato%20il&color=103820)](https://github.com/albertoxpecchini/AP)
[![Repo size](https://img.shields.io/github/repo-size/albertoxpecchini/AP?style=flat-square&color=2F7D4A)](https://github.com/albertoxpecchini/AP)
[![Code size](https://img.shields.io/github/languages/code-size/albertoxpecchini/AP?style=flat-square&label=code&color=1F6B3D)](https://github.com/albertoxpecchini/AP)
[![Top language](https://img.shields.io/github/languages/top/albertoxpecchini/AP?style=flat-square&color=3178C6)](https://github.com/albertoxpecchini/AP)
[![Languages](https://img.shields.io/github/languages/count/albertoxpecchini/AP?style=flat-square&label=lingue&color=7FC09A)](https://github.com/albertoxpecchini/AP)
[![Files in src](https://img.shields.io/github/directory-file-count/albertoxpecchini/AP/src?type=file&style=flat-square&label=file%20src&color=103820)](https://github.com/albertoxpecchini/AP/tree/main/src)
[![License](https://img.shields.io/github/license/albertoxpecchini/AP?style=flat-square&color=1F6B3D)](#-licenza)

<!-- ─────────────  STACK (badge logo statici)  ───────────── -->

[![React](https://img.shields.io/badge/React-18.3-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6.3-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind](https://img.shields.io/badge/Tailwind-4.1-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Radix UI](https://img.shields.io/badge/Radix_UI-primitives-161618?style=flat-square&logo=radixui&logoColor=white)](https://www.radix-ui.com)
[![Motion](https://img.shields.io/badge/Motion-12-FF4D8D?style=flat-square&logo=framer&logoColor=white)](https://motion.dev)
[![React Router](https://img.shields.io/badge/React_Router-7-CA4245?style=flat-square&logo=reactrouter&logoColor=white)](https://reactrouter.com)
[![Supabase](https://img.shields.io/badge/Supabase-backend-3FCF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Anthropic](https://img.shields.io/badge/Claude-Opus_4.8-D97757?style=flat-square&logo=anthropic&logoColor=white)](https://www.anthropic.com)
[![Bootstrap Italia](https://img.shields.io/badge/Bootstrap_Italia-AgID-0066CC?style=flat-square&logo=bootstrap&logoColor=white)](https://italia.github.io/bootstrap-italia/)

🔗 **Live:** [albertopecchini.it](https://albertopecchini.it) · **Repo:** [albertoxpecchini/AP](https://github.com/albertoxpecchini/AP) · **Autore:** [@albertoxpecchini](https://github.com/albertoxpecchini)

</div>

---

## 📊 Il progetto in numeri

> I badge di metrica derivano in tempo reale dall'API GitHub: si ricalcolano a ogni `git push`, senza manutenzione.

| Dominio | Valore | Dettaglio |
| :--- | :--- | :--- |
| **Codebase** | **~28.7k LOC** in `src/` | 74 `.tsx` · 27 `.ts` · 6 `.css` |
| **Componenti UI** | **48** primitivi | wrapper shadcn/ui su Radix in `src/app/components/ui/` |
| **Dipendenze** | **58 runtime** + 7 dev | `pnpm` workspace, lockfile riproducibile |
| **Applicazioni** | **6 giochi** + 1 portfolio | code-split via `React.lazy` per rotta |
| **Trivia — quiz** | **1005 domande** su 40 capitoli | 401 multipla · 401 vero/falso · 201 aperta |
| **Parole — lessico** | **~27,7k lemmi** (5–6 lettere) | dizionario di validazione + pool soluzioni curate |
| **Mappa — atlante** | **30 città** da satellite | riconoscimento da imagery zenitale |
| **Cronologia** | **176 commit** dal 2026-05-24 | 63 `feat` · 50 `fix` · 21 `style` · 6 `chore` · 4 altri |

[![GitHub stars](https://img.shields.io/github/stars/albertoxpecchini/AP?style=social)](https://github.com/albertoxpecchini/AP/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/albertoxpecchini/AP?style=social)](https://github.com/albertoxpecchini/AP/network/members)

---

## 🎮 Architettura a hub — le sei applicazioni

Ogni gioco è un sotto-applicativo autonomo (route dedicata, _lazy chunk_ indipendente, gating del nickname, leaderboard Supabase isolata). La home (`App.tsx`) funge da vetrina e da dispatcher di navigazione.

| Rotta | Gioco | Dominio | LOC | Badge versione |
| :--- | :--- | :--- | ---: | :--- |
| `/trivia` | **Trivia** | Storia dell'architettura — quiz a capitoli | 5.764 | ![v](https://img.shields.io/badge/auto--versioned-1.x-2F7D4A?style=flat-square) |
| `/parole` | **Parole** | Word game stile Wordle, IT 5–6 lettere | 6.750 | ![lessico](https://img.shields.io/badge/lessico-~27.7k-1F6B3D?style=flat-square) |
| `/angoli` | **Angoli** | Stima/misura di angoli e frazioni | 2.796 | ![math](https://img.shields.io/badge/math-geometria-7FC09A?style=flat-square) |
| `/mappa` | **Mappa** | Riconosci la città dal satellite | 2.779 | ![città](https://img.shields.io/badge/città-30-103820?style=flat-square) |
| `/movimento` | **Movimento** | Mobilità e trasporti | 1.577 | ![booking](https://img.shields.io/badge/UX-vetrina-1F6B3D?style=flat-square) |
| `/pcto` | **PCTO** | Modulo percorso scuola-lavoro | 879 | ![edu](https://img.shields.io/badge/edu-PCTO-2F7D4A?style=flat-square) |

**Pattern condiviso** per ogni gioco: `NicknameGate` (onboarding identità) → loop di gioco → `Leaderboard` + `leaderboardApi` (persistenza Supabase) → schermata di esito. Trivia aggiunge `Pagella`, `progressApi`, `gradesApi` e copertura statistica per capitolo.

---

## 🧠 Trivia — il modulo di punta

Pipeline **content-driven, zero-config**: i capitoli sono file Markdown in [`content/trivia/`](content/trivia/), importati a build-time via `import.meta.glob(..., { query: '?raw', eager: true })` e parsati una sola volta in `parseTrivia.ts`. Aggiungere un capitolo = aggiungere un `.md`; nessun codice da toccare.

- **40 capitoli** (`Neoclassicismo → … → CityLife`), ordinati dal campo `ordine:` con fallback alfabetico.
- **1005 domande** tipizzate: `multipla` (401), `vero`/falso (401), `aperta`/completamento (201).
- **Versionamento automatico** — `__TRIVIA_VERSION__` è iniettata da `vite.config.ts` come `1.<git rev-list --count -- src/app/trivia/>`: ogni deploy che tocca il modulo incrementa la _minor_ da solo.
- **Arricchimento AI** — middleware dev `/api/trivia` (`vite.config.ts`) interroga **Claude Haiku 4.5** (`@anthropic-ai/sdk`) per curiosità contestuali; chiave via `ANTHROPIC_API_KEY` nel `.env`.

---

## 🗂️ Struttura del repository

```
AP/
├── content/trivia/          # 40 capitoli .md → fonte unica delle domande Trivia
├── public/
│   ├── bootstrap-italia/     # Design System AgID (CSS/JS/font/svg)
│   ├── images/               # Asset hobby, passioni, copertine
│   └── site.webmanifest      # PWA: manifest + favicon/icone maskable 192/512
├── src/
│   ├── app/
│   │   ├── App.tsx           # Home/portfolio + dispatcher di navigazione
│   │   ├── trivia/  parole/  angoli/  mappa/  movimento/  pcto/   # 6 giochi
│   │   ├── components/ui/     # 48 primitivi shadcn/Radix
│   │   └── utils/            # keyboard guard, local mode, helper
│   ├── lib/                  # utilità trasversali (players, ecc.)
│   ├── styles/               # theme.css (token palette) · tailwind · fonts · index
│   └── main.tsx              # BrowserRouter + 7 Route lazy-loaded
├── scripts/                  # build_cv.py · build_favicon.py
└── vite.config.ts            # plugin React/Tailwind, asset resolver, versioning, dev-API
```

---

## 🧰 Stack tecnologico

| Layer | Tecnologie |
| :--- | :--- |
| **Core** | React 18.3 · TypeScript · Vite 6.3 |
| **Routing** | `react-router` 7 (BrowserRouter, route `lazy` + `Suspense`) |
| **Styling** | Tailwind CSS 4 · CSS custom properties · Bootstrap Italia (AgID) |
| **UI kit** | 48 primitivi Radix UI in chiave shadcn/ui · `class-variance-authority` · `tailwind-merge` |
| **Motion** | `motion` (Framer Motion 12), rispettoso di `prefers-reduced-motion` |
| **Dataviz / FX** | `recharts` · `canvas-confetti` · `embla-carousel` · `skinview3d` |
| **Form / input** | `react-hook-form` · `input-otp` · `cmdk` · `sonner` (toast) |
| **Backend** | Supabase (leaderboard, pagelle, progressi per gioco) |
| **AI** | `@anthropic-ai/sdk` → Claude Haiku 4.5 (curiosità Trivia) |
| **Tooling** | `pnpm` · `playwright` (E2E) · script Python per CV/favicon |

---

## 🚀 Getting started

**Requisiti:** Node ≥ 18 · `pnpm` ≥ 8 (compatibile npm/yarn).

```bash
git clone https://github.com/albertoxpecchini/AP.git && cd AP
pnpm install
pnpm dev          # http://localhost:5173 — HMR attivo, strictPort
pnpm build        # bundle di produzione in dist/
```

Per l'arricchimento AI di Trivia in locale, creare un `.env` con `ANTHROPIC_API_KEY=...`.

| Comando | Azione |
| :--- | :--- |
| `pnpm dev` | Dev server Vite + middleware `/api/trivia` (porta 5173) |
| `pnpm build` | Build statica in `dist/` |
| `python scripts/build_cv.py` | Rigenera il PDF del CV |
| `python scripts/build_favicon.py` | Rigenera set favicon + icone PWA |

---

## 🔌 Integrazioni esterne

- **Supabase** — persistenza realtime di leaderboard, pagelle e progressi, con API isolata per ciascun gioco (`*/leaderboardApi.ts`, `trivia/gradesApi.ts`, `trivia/progressApi.ts`).
- **Anthropic / Claude Haiku 4.5** — generazione di curiosità testuali on-demand.
- **GitHub REST API** — `App.tsx` legge `pushed_at` e ultima release dei repo dei progetti (no-auth, rate limit pubblico).
- **Microlink** — screenshot live 1200×630 come anteprima delle card progetto.
- **Google Fonts** — Titillium Web · Lora · Roboto Mono (`preconnect` + `display=swap`).

---

## ♿ Accessibilità & 🚀 Deploy

**A11y:** skiplink al contenuto/contatti · landmark semantici (`main`/`nav[aria-label]`/`header`/`footer`) · `aria-labelledby` sui modali · focus visibile · contrasto AA sull'intera palette · `prefers-reduced-motion` onorato · `Backspace` neutralizzato fuori dai campi testo (`disableBackspaceNavigation`).

**Deploy:** SPA statica → deploy su **Vercel** (autodetect Vite, `dist/`, branch `main` = produzione). Equivalente su Netlify, GitHub Pages o qualunque static host.

---

## 🎨 Palette — neroverde Sassuolo

Override completo del primario Bootstrap Italia (`--bs-primary`) propagato in `App.tsx`; token globali light/dark in `src/styles/theme.css`.

![#103820](https://img.shields.io/badge/Header-%23103820-103820?style=flat-square)
![#1F6B3D](https://img.shields.io/badge/Profondo-%231F6B3D-1F6B3D?style=flat-square)
![#2F7D4A](https://img.shields.io/badge/Primario-%232F7D4A-2F7D4A?style=flat-square)
![#7FC09A](https://img.shields.io/badge/Accent-%237FC09A-7FC09A?style=flat-square&labelColor=555)

---

## 📄 Licenza

Codice sotto licenza **MIT** — liberamente riutilizzabile. Testi, foto personali, CV e brand «Alberto Pecchini» sono **© Alberto Pecchini**, non riproducibili senza autorizzazione. Bootstrap Italia è BSD-3-Clause (Presidenza del Consiglio dei Ministri).

## 📬 Contatti

[![Email](https://img.shields.io/badge/Email-pzkko@yahoo.com-D14836?style=flat-square&logo=maildotru&logoColor=white)](mailto:pzkko@yahoo.com)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-+44_7340_995142-25D366?style=flat-square&logo=whatsapp&logoColor=white)](https://wa.me/447340995142)
[![GitHub](https://img.shields.io/badge/GitHub-@albertoxpecchini-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/albertoxpecchini)
[![Instagram](https://img.shields.io/badge/Instagram-@albertoxpecchini-E4405F?style=flat-square&logo=instagram&logoColor=white)](https://www.instagram.com/albertoxpecchini)

<div align="center"><sub>Costruito con ❤️ a Mantova · Forza Sassuolo ⚫🟢</sub></div>
