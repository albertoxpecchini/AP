<div align="center">

# Alberto Pecchini — Portfolio & Personal Hub

**SPA React/TypeScript** — un portfolio personale che fa da _hub_ a un sito multi-pagina
(bio, approfondimenti, un gioco-quiz, strumenti e sezioni evento), servito **una pagina
= un sottodominio**, tradotto al volo in **4 lingue** e vestito con un design system
**«piattaforma»** — la grammatica `.sb-` rifatta sulla homepage di Supabase, verde brand
e tema chiaro/scuro nativo.

<!-- ─────────────  METRICHE LIVE (shields.io → GitHub API, auto-aggiornanti)  ───────────── -->

[![Last commit](https://img.shields.io/github/last-commit/albertoxpecchini/AP/main?style=flat-square&logo=git&logoColor=white&color=3ECF8E)](https://github.com/albertoxpecchini/AP/commits/main)
[![Commit activity](https://img.shields.io/github/commit-activity/m/albertoxpecchini/AP?style=flat-square&color=24B47E)](https://github.com/albertoxpecchini/AP/pulse)
[![Created at](https://img.shields.io/github/created-at/albertoxpecchini/AP?style=flat-square&label=nato%20il&color=1C8C63)](https://github.com/albertoxpecchini/AP)
[![Repo size](https://img.shields.io/github/repo-size/albertoxpecchini/AP?style=flat-square&color=3ECF8E)](https://github.com/albertoxpecchini/AP)
[![Top language](https://img.shields.io/github/languages/top/albertoxpecchini/AP?style=flat-square&color=3178C6)](https://github.com/albertoxpecchini/AP)
[![Languages](https://img.shields.io/github/languages/count/albertoxpecchini/AP?style=flat-square&label=lingue&color=6EE7B7)](https://github.com/albertoxpecchini/AP)
[![Files in src](https://img.shields.io/github/directory-file-count/albertoxpecchini/AP/src?type=file&style=flat-square&label=file%20src&color=24B47E)](https://github.com/albertoxpecchini/AP/tree/main/src)
[![License](https://img.shields.io/github/license/albertoxpecchini/AP?style=flat-square&color=1C8C63)](#-licenza)

> ⚠️ Il repository è **privato**: i badge qui sopra (e le API GitHub in generale) rispondono
> solo a chi ha accesso. Per questo il sito **non** interroga più `api.github.com` per l'albero
> dei file — se lo genera da `git` in fase di build (vedi [Archivio](#-archivio--lalbero-vero-del-repository)).

<!-- ─────────────  STACK (badge logo statici, allineati al package.json)  ───────────── -->

[![React](https://img.shields.io/badge/React-18.3-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6.3-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind](https://img.shields.io/badge/Tailwind-4.1-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![React Router](https://img.shields.io/badge/React_Router-7-CA4245?style=flat-square&logo=reactrouter&logoColor=white)](https://reactrouter.com)
[![GSAP](https://img.shields.io/badge/GSAP-3.15_+_ScrollTrigger-88CE02?style=flat-square&logo=greensock&logoColor=white)](https://gsap.com)
[![Motion](https://img.shields.io/badge/Motion-12-FF4D8D?style=flat-square&logo=framer&logoColor=white)](https://motion.dev)
[![PWA](https://img.shields.io/badge/PWA-Workbox-5A0FC8?style=flat-square&logo=pwa&logoColor=white)](https://vite-pwa-org.netlify.app/)
[![Supabase](https://img.shields.io/badge/Supabase-REST_+_Realtime-3FCF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Anthropic](https://img.shields.io/badge/Claude-Fable_5-D97757?style=flat-square&logo=anthropic&logoColor=white)](https://www.anthropic.com)
[![Vercel](https://img.shields.io/badge/Vercel-hosting_+_cron-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)

🔗 **Live:** [albertopecchini.it](https://albertopecchini.it) · **Repo:** [albertoxpecchini/AP](https://github.com/albertoxpecchini/AP) · **Autore:** [@albertoxpecchini](https://github.com/albertoxpecchini)

</div>

---

## 📊 Il progetto in numeri

> I badge di metrica derivano dall'API GitHub e si ricalcolano a ogni `git push`.
> La tabella qui sotto è misurata sull'albero versionato al momento della scrittura.

| Dominio | Valore | Dettaglio |
| :--- | :--- | :--- |
| **Codebase** | **~31,6k LOC** in `src/` | 93 file: 40 `.tsx` (17,6k) · 32 `.ts` (4,9k) · 21 `.css` (9,2k) |
| **Backend + tooling** | **~1,8k LOC** fuori da `src/` | 7 funzioni `api/` + `lib/` (889) · `scripts/` (893) |
| **Dipendenze** | **13 runtime** + 9 dev | niente framework pesanti, tutto essenziale |
| **Pagine** | **11 rotte** | 1 hub + 10 pagine `React.lazy`, code-split per rotta |
| **Lingue UI** | **4** — IT · EN · FR · DE | motore i18n che traduce il DOM live · 1011 voci generate |
| **Trivia — quiz** | **1003 domande** su 40 capitoli | 401 multipla · 401 vero/falso · 201 aperta |
| **Serverless** | **7 funzioni** in `api/` | trivia · notify · festa-rsvp · sponsor · ig-stats · d · cron |
| **Cronologia** | **336 commit** dal 2026-05-24 | 165 `feat` · 78 `fix` · 25 `style` · 15 `chore` · 6 `refactor` |

---

## 🎨 Il design system «piattaforma» (`.sb-`)

Il sito è stato **rifatto da zero sul layout della homepage di Supabase** e adattato ai contenuti
esistenti. Non è un tema applicato sopra: è la grammatica strutturale (nav sottile, hero a due
colonne, griglia prodotti a 12 colonne con card a bordo-gradiente, pannello «dashboard», switcher
dello stack con codice vero, story-card, muro community, sezione open source, CTA finale) portata
su ogni pagina.

- **Prefisso `.sb-`** — tutti i token e le classi vivono in [`src/app/home.css`](src/app/home.css) (1528 righe),
  ereditati da footer, ControlBar, archivio e pagine interne.
- **Tema chiaro/scuro NATIVO** — non due fogli di stile, ma un set di custom properties ridichiarate
  sotto `html.dark`. Il chiaro è il default.
- **Palette neutra + un solo colore** — grigi puri per fondali, bordi e testo; l'unica tinta è il
  **verde brand `hsl(153 60% 53%)`**. L'arancio Ubuntu resta come **identità storica** (documentato,
  non più dominante).
- **Un fondale solo, per tutta la pagina** — `.sb-bg` è `position: fixed`: due velature radiali
  (verde e ciano) e una griglia tecnica che si dissolve verso il basso, incollate alla finestra.
  Nessun bordo di sezione può tagliarlo mentre si scorre, quindi **fra una sezione e l'altra non
  c'è nessun confine**; il contenuto scorre sopra, trasparente. Anche il footer non comincia con un
  bordo: il suo colore entra in **dissolvenza** dall'alto.
- **Tipografia Ubuntu** — il carattere del sito resta Ubuntu (+ Ubuntu Mono; Lora solo per `/festa`),
  al posto del Circular di Supabase.
- **CSS per pagina** — ogni pagina ha il suo file accanto al componente
  (`bio.css`, `pcto.css`, `mestesso.css`, `instagram.css`, `sostieni.css`, `trivia.css`,
  `archivio.css`, `controlbar.css`, `palette.css`, `scrollprogress.css`, `workflow.css`), importato
  dal componente stesso: nessun foglio monolitico, e il code-splitting per rotta porta con sé anche
  lo stile.

**La palette per intero è consultabile dal sito**: footer → **«Palette»**
([`PaletteModal.tsx`](src/app/site/PaletteModal.tsx)) apre una finestra con tutte le tinte in uso —
verde brand, fondali, bordi, testo (con rapporto di contrasto), colori del codice, arancio Ubuntu,
grafico contribuzioni, linguaggi, il «dark premium» di Trivia, gradienti e ombre — mostrate
**nei due temi affiancati** e copiabili negli appunti.

---

## 🧩 La chrome globale — montata una volta, viva ovunque

Tre elementi stanno **fuori dal router**, in [`src/main.tsx`](src/main.tsx), e accompagnano ogni pagina:

| Componente | Dove | Cosa fa |
| :--- | :--- | :--- |
| **ControlBar** — [`theme/ControlBar.tsx`](src/app/theme/ControlBar.tsx) | in basso a sinistra | Un'unica pillola: **lingua · tema · sensore orario**. Sta rincantucciata oltre il bordo e lascia sporgere solo la linguetta; esce quando il puntatore le si **avvicina** (130 px), quando il fuoco da tastiera entra, o premendo la linguetta (unico modo sul touch, dove resta fissata). Rientra da sola dopo 620 ms, ma solo se non è sotto il puntatore, non ha il fuoco e non ha menu aperti. |
| **ScrollProgress** — [`site/ScrollProgress.tsx`](src/app/site/ScrollProgress.tsx) | bordo alto | Il filo di avanzamento della lettura. Non usa `ScrollTrigger` (le pagine sono lazy e cambiano altezza dopo il montaggio): rimisura a ogni frame utile e ammorbidisce con `gsap.quickTo`. Con lo scroll bloccato (modali) si **congela** invece di azzerarsi. |
| **SpeedInsights** — `@vercel/speed-insights` | invisibile | Core Web Vitals reali, solo in produzione. |

Il **tema globale** ([`theme/themeCore.ts`](src/app/theme/themeCore.ts)) ha una sola fonte di verità:
in modalità `auto` segue un **sensore orario** (08:00–19:59 chiaro, il resto scuro, con transizione
animata che parte un secondo prima del confine); in `manual` vince il tasto **fino al confine orario
successivo**, poi il sensore riprende il comando. Il tema si riflette su `<html>` (`.dark` +
`data-ap-theme`) e resta allineato ai meccanismi già esistenti dei giochi e di `/me-stesso`.

---

## 🌀 Movimento — GSAP, e soprattutto quello che è stato tolto

Il sito ha attraversato una fase in cui **ogni blocco si annunciava**: reveal a cascata allo scroll,
riflessi che seguivano il puntatore dentro i pannelli, lampi in diagonale all'ingresso nelle card,
alone della hero con inerzia, e una manciata di loop CSS infiniti (sheen dei bottoni, aurora, deriva
della griglia, shimmer degli scheletri, lancetta). **È stato quasi tutto rimosso**, con la
motivazione scritta nel codice dove stava l'effetto:

> Ogni blocco entrava in scena da opacità 0 salendo di una ventina di pixel: scendendo piano si
> vedeva la pagina «ricaricarsi» un blocco alla volta, con quella dissolvenza chiara che faceva
> sembrare lo scroll a scatti. Il contenuto adesso c'è e basta — **scorrere una pagina non è un
> evento da annunciare.**

Quel che resta è diviso per responsabilità, non sparso nei componenti:

- [`site/homeMotion.ts`](src/app/site/homeMotion.ts) — regia della home. Restano l'**intro della
  hero** (una timeline sola, che parte al caricamento) e i **contatori** che si accendono arrivando
  a vista. Nessun reveal allo scroll.
- [`site/footMotion.ts`](src/app/site/footMotion.ts) — regia **separata** del footer, perché il footer
  vive su ogni pagina e deve funzionare anche in fondo a Trivia o all'archivio (sulla home i suoi
  elementi sono esclusi a mano da `homeMotion`, così a comandare è sempre un file solo). Restano i
  contatori — armati da un `MutationObserver`, perché i numeri del widget GitHub arrivano dalla rete
  **dopo** il montaggio — e i **magneti**: card, icone social e chip che si sporgono al massimo di
  7 px verso il cursore, con un solo ascoltatore in delega su tutto il footer.
- [`site/homeLive.tsx`](src/app/site/homeLive.tsx) — i visual delle card non sono fermi immagine:
  orologio di Mantova in diretta, ticker dei progetti in corso, terminale che scrive, HUD di gioco,
  cubo, grafico contribuzioni. Ogni pezzo monta il suo loop e lo smonta da solo — sono **contenuto**
  della card, non decorazione della pagina.
- [`site/ScrollProgress.tsx`](src/app/site/ScrollProgress.tsx) — l'avanzamento della lettura. Prima
  cresceva sul filo del footer, cioè si vedeva **solo una volta arrivati in fondo**, quando non
  serviva più; ora sta in cima alla finestra, su ogni pagina. È l'unica cosa che **resta accesa
  anche con `prefers-reduced-motion`** (senza inerzia): è informazione sulla pagina, e a muoverla
  è lo scroll dell'utente.
- `gsap.matchMedia()` ovunque: **`prefers-reduced-motion` spegne ogni movimento autonomo**, e gli
  effetti da puntatore si montano solo con `(hover: hover) and (pointer: fine)`. Tutto si smonta con
  `mm.revert()` — niente doppioni al cambio pagina.
- Regola ferrea: **niente split del testo traducibile** — il motore i18n cammina sui nodi di testo
  e trovarsi uno `<span>` per lettera lo manderebbe fuori strada.

---

## 🧭 Architettura a sottodomini — le pagine

Ogni pagina è un sotto-applicativo autonomo: **rotta dedicata**, **_lazy chunk_ indipendente**,
CSS proprio. In produzione vale la regola **una pagina = un sottodominio**
(`bio.albertopecchini.it`, `trivia.albertopecchini.it`, …) e la pagina è servita **alla root del
sottodominio**, senza redirect né path aggiunto; in dev/preview resta una SPA a path su un'unica
origine. La logica sta in [`src/app/site/nav.tsx`](src/app/site/nav.tsx): `<SiteLink>` è un drop-in
di `<Link>` che in produzione diventa un `<a>` cross-origin e in locale resta React Router.
I redirect `www → sottodominio` sono in [`vercel.json`](vercel.json).

| Rotta | Sottodominio | Pagina | Cosa fa |
| :--- | :--- | :--- | :--- |
| `/` | `www` | **Home / hub** | Vetrina «piattaforma»: hero, prodotti, archivio incorporato, stack, pagine, lavori, curriculum, open source, contatti |
| `/bio` | `bio` | **Bio** | Pagina About: gallery + fatti essenziali |
| `/trivia` | `trivia` | **Trivia** | Quiz sulla storia dell'architettura — 1003 domande, leaderboard, curiosità AI |
| `/pcto` | `pcto` | **PCTO** | Alternanza scuola-lavoro (Caem Group) — timeline + racconto |
| `/me-stesso` | `me-stesso` | **Me stesso** | Presentazione personale (Esame di Stato 2026) |
| `/dubliners` | `dubliners` | **Dubliners** | Approfondimento «Gente di Dublino» (J. Joyce, 1914) |
| `/gattopardo` | `gattopardo` | **Gattopardo** | Approfondimento «Il Gattopardo» (Tomasi di Lampedusa, 1958) |
| `/festa` | `festa` | **Festa** | Inviti con token, RSVP e notifica email |
| `/archivio` | `archivio` | **Archivio** | Esploratore di progetti **e dell'albero vero del repo** |
| `/sostieni` | `sostieni` | **Sostieni** | Dati bonifico + libro firme dei donatori |
| `/instagram` | _(solo path)_ | **Compare Two Lists** | «Chi ti ha tolto il follow» — confronto di due liste, tutto in locale |

---

## 🗃️ Archivio — l'albero vero del repository

`/archivio` è un **esploratore di file** in veste piattaforma: side-nav delle posizioni, barra
strumenti, tabella o griglia, preferiti, menu contestuali (Radix) e finestra **Proprietà** con
README. `<ArchivioExplorer/>` è riusabile: la pagina lo pilota per intero, la home lo incorpora
in versione `embedded` come «dashboard».

Oltre ai progetti mostra il **codice sorgente reale**, e qui sta il pezzo interessante:

> **Perché non le API di GitHub.** Il repository è **privato**: `api.github.com` risponde `404`
> senza token, e un token nel front-end non si mette.

La soluzione è [`scripts/build-repo-tree.mjs`](scripts/build-repo-tree.mjs), che gira in `prebuild`
(quindi **anche su Vercel, a ogni commit deployato**) e scrive `public/repo-tree.json` — artefatto
rigenerabile, fuori dal versionamento:

- `git ls-files` → **esattamente** i file versionati, `.gitignore` incluso;
- dimensione reale di ogni file (`statSync`) e **data dell'ultimo commit che l'ha toccato**,
  ricavata in **una sola passata** su `git log --name-only`;
- metadati del commit corrente (sha, messaggio, autore, data, conteggio) e branch;
- i cloni **shallow** della CI vengono prima completati con `--unshallow`; se non si può, il JSON
  lo dichiara (`"history": "shallow"`) e le date mancanti ripiegano su quella del commit corrente;
- se `git` non c'è, lo script **non blocca la build**: avvisa e basta, e l'archivio nasconde la sezione.

Lato client [`site/repoTree.ts`](src/app/site/repoTree.ts) trasforma il JSON in albero navigabile
(cartelle che aggregano byte, date e conteggi dei figli) con link a file, storia e commit su GitHub.

---

## 🧠 Trivia — il modulo di punta

Pipeline **content-driven, zero-config**: i capitoli sono file Markdown in [`content/trivia/`](content/trivia/),
importati a build-time via `import.meta.glob(..., { query: '?raw', eager: true })` e parsati una sola
volta in [`parseTrivia.ts`](src/app/trivia/parseTrivia.ts). Aggiungere un capitolo = aggiungere un `.md`;
nessun codice da toccare, nessun registro da aggiornare.

- **40 capitoli** ordinati dal campo `ordine:` (fallback alfabetico).
- **1003 domande** tipizzate: `multipla` (401), `vero-falso` (401), `aperta` (201), ognuna con
  spiegazione facoltativa, sinonimi accettati (`accetta:`) e foto.
- **Versionamento automatico** — `__TRIVIA_VERSION__` è iniettata da [`vite.config.ts`](vite.config.ts) come
  `1.<git rev-list --count HEAD -- src/app/trivia/>`: ogni deploy che tocca il modulo incrementa la _minor_ da solo.
- **Arricchimento AI** — l'endpoint serverless [`/api/trivia`](api/trivia.ts) interroga **Claude Fable 5**
  (`@anthropic-ai/sdk`) per curiosità contestuali; accetta solo richieste dal sito (origin check +
  rate-limit), così non è usabile come proxy AI gratuito. In dev lo stesso endpoint è servito da un
  middleware di Vite, con la chiave letta dal `.env`.
- Punteggio con bonus velocità, serie con trofei, voto finale in stile americano (A–F), pagelle e
  classifica **live** (Supabase Realtime, con fallback `localStorage`).

---

## 🌍 i18n — traduzione del DOM al volo

Invece di internazionalizzare undici pagine una per una, il sito **traduce il testo già renderizzato**
([`i18n/translateDom.ts`](src/app/i18n/translateDom.ts)):

- un `MutationObserver` segue ogni cambiamento del DOM (cambio rotta, chunk lazy, ri-render di React)
  e ritraduce nodi di testo e attributi (`placeholder`, `title`, `aria-label`, `alt`);
- per ogni nodo si tengono **originale** e **ultimo valore scritto da noi**: se il valore attuale non
  è il nostro, ha riscritto React → quello diventa il nuovo originale (gestisce i testi dinamici);
- mentre scriviamo l'observer è **scollegato** (niente loop infiniti) e tutto è raggruppato in un
  solo passo per frame;
- la **chiave** del dizionario è il testo sorgente normalizzato — la home è in inglese, giochi e
  approfondimenti in italiano — e il valore elenca **solo** le altre lingue: la sorgente è il fallback.
  `SCRIPT`, `STYLE`, `TEXTAREA`, `CODE`, `PRE` e i nodi `data-no-i18n` non si toccano mai.

Dizionario: [`dictionary.ts`](src/app/i18n/dictionary.ts) (voci curate a mano) + **1010 voci** in
[`translations.json`](src/app/i18n/translations.json). Cambiare lingua non ricarica la pagina.

---

## 🗂️ Struttura del repository

```
AP/
├── api/                      # 7 funzioni serverless Vercel (Node)
│   ├── trivia.ts             #   curiosità AI (Claude Fable 5)
│   ├── notify.ts             #   email dei voti Festa (Resend)
│   ├── festa-rsvp.ts         #   scrittura RSVP blindata (service role)
│   ├── sponsor.ts            #   firma libro donatori blindata
│   ├── ig-stats.ts           #   contatore confronti Instagram
│   ├── d.ts                  #   link tracciabili: apertura + redirect + autodelete
│   └── cron-cleanup.ts       #   pulizia giornaliera dei link scaduti (cron)
├── content/trivia/           # 40 capitoli .md → fonte unica delle domande Trivia
├── email/                    # modello email HTML (le bozze NON si committano)
├── lib/serverSecurity.ts     # helper condivisi: origin check, rate-limit, diagnostica
├── public/                   # PDF (CV in 4 lingue + attestati), immagini, manifest PWA
├── scripts/
│   ├── build-cv.py           #   src/app/cv/data/*.json → 4 PDF statici (WeasyPrint)
│   ├── build-zips.mjs        #   ZIP del sorgente per ogni progetto d'archivio
│   ├── build-repo-tree.mjs   #   albero del repo da git → public/repo-tree.json
│   ├── make-link.mjs         #   link tracciabili usa-e-getta (solo in locale)
│   └── seed-*.js|.mjs        #   seed dei profili
├── src/
│   ├── app/
│   │   ├── App.tsx           # Home «piattaforma» + header/menu inline
│   │   ├── home.css          # il design system .sb- (token, layout, loop CSS)
│   │   ├── site/             # footer, nav, dati, progetti, README dei progetti,
│   │   │                     #   homeIcons/homeLive/homeMotion/footMotion,
│   │   │                     #   repoTree, PaletteModal, ScrollProgress,
│   │   │                     #   WorkflowModal + workflow.css (diagramma in CSS)
│   │   ├── cv/               # /cv: il curriculum come pagina (4 lingue) + stampa
│   │   │                     #   PDF; data/cv.<lingua>.json = fonte unica, la
│   │   │                     #   legge anche scripts/build-cv.py
│   │   ├── theme/            # ControlBar (lingua·tema·sensore) + themeCore
│   │   ├── trivia/           # gioco quiz + parser + API leaderboard/pagelle/progressi
│   │   ├── bio  pcto  me-stesso  dubliners  gattopardo  festa  archivio  sostieni  instagram
│   │   ├── i18n/             # motore di traduzione del DOM (IT · EN · FR · DE)
│   │   ├── utils/            # keyboard guard, scroll lock, device, prefs
│   │   └── _game/            # motore condiviso dei giochi (gate, tokens, leaderboard)
│   ├── lib/                  # utilità trasversali (players)
│   └── styles/               # theme.css · tailwind · fonts · ios · site · ubuntu
├── supabase/                 # schema .sql delle tabelle (scores, grades, players, link)
└── vite.config.ts            # plugin React/Tailwind/PWA, asset resolver, versioning, dev-API
```

---

## 🔀 Come funziona — il giro dei dati (dal codice all'online)

Dalla **sorgente** (testi, dati, immagini, codice) agli **artefatti** prodotti dagli script di build
(PDF · ZIP · `repo-tree.json` · bundle · service worker), fino al **deploy** su Vercel e ai **dati live**
che il browser richiede a runtime (GitHub, Supabase, `/api`).

> **Lo stesso schema è consultabile dal sito**: footer → **«Come funziona»**
> ([`WorkflowModal.tsx`](src/app/site/WorkflowModal.tsx)). Qui sotto è un blocco `mermaid`, che
> GitHub renderizza da sé; **il sito però non usa Mermaid**. Il diagramma di sequenza è disegnato
> a mano con una griglia CSS (`.apw-`, [`workflow.css`](src/app/site/workflow.css)): una colonna per
> partecipante, linea di vita tratteggiata, barra di attività verde, messaggi che scavalcano le
> colonne. Così segue il tema chiaro/scuro del sito, parla tutte e 4 le lingue, e **sotto i 780 px
> diventa un elenco di passi** — con lo stesso markup, è React a deciderlo via `matchMedia`.
> Il vantaggio vero: non si porta dietro una libreria intera per un solo diagramma.

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Alberto · dev
    participant CC as Claude Code
    participant GH as GitHub · main
    participant VC as Vercel · CI/hosting
    participant BR as Browser · PWA
    participant EXT as API e servizi esterni

    Note over Dev,CC: 1 · Sviluppo locale (codifiche)
    Dev->>CC: "fai la modifica X"
    activate CC
    Note over CC: build-cv.py → 4× PDF · make-link.mjs → link tracciabili
    CC->>GH: git commit + push → main
    deactivate CC

    Note over GH,VC: 2 · Build e deploy (CI)
    GH->>VC: webhook · nuovo commit su main
    activate VC
    Note over VC: prebuild · build-zips → ZIP · build-repo-tree → repo-tree.json
    Note over VC: vite build · Rollup → bundle JS/CSS (chunk per rotta)
    Note over VC: vite-plugin-pwa · Workbox → service worker
    VC-->>GH: deploy ok
    deactivate VC

    Note over BR,EXT: 3 · Un utente apre il sito
    BR->>VC: GET / (HTML · JS · CSS · WebP · font)
    VC-->>BR: SPA React + service worker (precache offline)

    Note over BR,EXT: 4 · Dati live a runtime
    BR->>EXT: GitHub API · profilo, repo, contribuzioni
    EXT-->>BR: JSON → mini-dashboard del footer
    BR->>VC: GET /repo-tree.json
    VC-->>BR: albero del repo (generato in build da git)
    BR->>EXT: Supabase · REST + Realtime WS
    EXT-->>BR: classifiche + aggiornamenti live
    BR->>VC: GET /api/trivia · parola
    activate VC
    VC->>EXT: Anthropic Claude (Fable 5)
    EXT-->>VC: curiosità (testo)
    VC-->>BR: JSON (cache 24 h)
    deactivate VC
    BR->>VC: POST /api/notify · voto Festa
    activate VC
    VC->>EXT: Resend · invio email
    EXT-->>VC: 202 accepted
    VC-->>BR: ok
    deactivate VC
```

| Servizio esterno | Uso | Dove |
| :--- | :--- | :--- |
| **GitHub API** (pubblica) | profilo, repo aggregati, linguaggi nel footer | client (cache 60 min) |
| **jogruber `github-contributions-api`** | grafico contribuzioni reale, senza token | client |
| **Supabase** (REST + Realtime WS) | classifiche, pagelle, progressi, presenze, libro donatori, link tracciabili (fallback `localStorage`) | client + serverless |
| **Anthropic Claude** (Fable 5) | curiosità del gioco Trivia | serverless `/api/trivia` |
| **Resend** | email dei voti Festa + avviso di apertura link tracciabili | serverless `/api/notify`, `/api/d` |

---

## 🧰 Stack tecnologico

| Layer | Tecnologie |
| :--- | :--- |
| **Core** | React 18.3 · TypeScript · Vite 6.3 |
| **Routing** | `react-router` 7 (BrowserRouter, `lazy` + `Suspense`) + mappa host → pagina per i sottodomini |
| **Styling** | design system `.sb-` in CSS puro (custom properties, tema nativo) · Tailwind CSS 4.1 · `tw-animate-css` |
| **Motion** | `gsap` 3.15 + ScrollTrigger (intro della hero, contatori, magneti, filo di lettura, card vive) · `motion` (Framer Motion 12) su home e switcher lingua · `canvas-confetti` in Trivia |
| **UI** | icone `homeIcons.tsx` disegnate a mano (outline 24×24, tratto 1.5) · `lucide-react` + `react-icons` dove serve · `@radix-ui/react-context-menu` (archivio) · diagrammi disegnati in CSS, senza librerie |
| **i18n** | motore proprietario che traduce il DOM in IT · EN · FR · DE |
| **PWA** | `vite-plugin-pwa` + Workbox (precache offline, auto-update) |
| **Backend** | Supabase via REST/Realtime · 7 funzioni serverless Vercel + `lib/serverSecurity` |
| **AI** | `@anthropic-ai/sdk` → Claude Fable 5 (curiosità Trivia) |
| **Insight** | `@vercel/speed-insights` (Core Web Vitals reali) |
| **Tooling** | `build-cv.py` (WeasyPrint → 4 PDF) · `archiver` per gli ZIP · `build-repo-tree.mjs` per l'albero |

> **Dipendenze rimaste indietro.** `three` e `vanta` (sfondi animati, sostituiti dalla regia GSAP)
> e `mermaid` (il diagramma «Come funziona», ora disegnato in CSS) sono ancora elencati in
> `package.json` — e `three`/`vanta` anche nelle esclusioni del service worker — ma **non sono più
> importati da nessun modulo di `src/`**: non finiscono nel bundle, solo in `node_modules`.

---

## 🔐 Sicurezza & privacy

Il sito è pensato per essere **a prova di abuso**, senza archiviare dati di terzi.

- **Solo l'email è pubblica** — niente telefono né WhatsApp sul sito o nel CV.
- **Scritture blindate** — RSVP, firme donatori e contatori non partono diretti dal client verso
  Supabase: passano da un endpoint serverless con **origin check + rate-limit** e `INSERT` con
  **service role** (la `anon key` non può iniettare dati fasulli). Le letture restano pubbliche.
- **Nessun token GitHub nel front-end** — il repo è privato e l'albero dei file arriva da `git` in
  build, non da un'API autenticata.
- **Link tracciabili usa-e-getta** — [`/api/d`](api/d.ts) apre, conta e reindirizza; **autodelete a 7 giorni**
  (cron [`/api/cron-cleanup`](api/cron-cleanup.ts), protetto da `CRON_SECRET`), avviso via email alla
  **prima apertura**. I link si creano **solo in locale** con [`make-link.mjs`](scripts/make-link.mjs) —
  nessun endpoint pubblico, meno superficie d'attacco. La diagnostica del «chi» (IP, device, area)
  finisce **solo nell'email**, mai archiviata.
- **Header di sicurezza + CSP** in [`vercel.json`](vercel.json): CSP con allow-list esplicita delle
  origini `connect-src`, HSTS 2 anni, `X-Frame-Options: DENY`, `Permissions-Policy` che spegne
  camera/microfono/geolocalizzazione/pagamenti, COOP `same-origin`.

---

## 🚀 Getting started

**Requisiti:** Node ≥ 18 (`npm`, `pnpm` o `yarn`). Per rigenerare i CV serve anche Python con
**WeasyPrint** e il font **Ubuntu** installato a sistema.

```bash
git clone https://github.com/albertoxpecchini/AP.git && cd AP
npm install
npm run dev       # http://localhost:5173 — HMR attivo, middleware /api/*
npm run build     # bundle di produzione in dist/ (prima: prebuild → ZIP + repo-tree)
```

Le chiavi vivono in un `.env` locale (non versionato, e **non** c'è un `.env.example` nel repo):
`ANTHROPIC_API_KEY` per le curiosità di Trivia, `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
per le letture dal client, `SUPABASE_SERVICE_ROLE_KEY` per gli endpoint blindati e i link
tracciabili, `RESEND_API_KEY` per le email, `CRON_SECRET` per il cron.

| Comando | Azione |
| :--- | :--- |
| `npm run dev` | Dev server Vite + middleware `/api/*` (porta 5173) |
| `npm run build` | Build statica in `dist/` (`prebuild` → ZIP + `repo-tree.json`, poi `vite build`) |
| `npm run zips` | Rigenera solo `public/zips/` + il manifest delle dimensioni |
| `npm run repo-tree` | Rigenera solo `public/repo-tree.json` dall'albero git |
| `python3 scripts/build-cv.py [it en fr de]` | Rigenera i PDF statici del CV da `src/app/cv/data/` (il CV "vivo" è la pagina `/cv`, che stampa sé stessa) |

---

## ♿ Accessibilità & 🚀 Deploy

**A11y:** skiplink al contenuto · landmark semantici (`main`/`nav[aria-label]`/`header`/`footer`) ·
`aria-labelledby` sui modali · focus visibile (`:focus-visible` con outline verde brand) ·
contrasto AA verificato nella finestra Palette · **`prefers-reduced-motion` onorato in tutta la
regia GSAP** · ControlBar raggiungibile da tastiera (esce al `focus`) ·
`Backspace` neutralizzato fuori dai campi testo (`disableBackspaceNavigation`).

**Deploy:** SPA statica → **Vercel** (`buildCommand: npm run build`, output `dist/`, branch `main`
= produzione), con funzioni serverless in `api/`, redirect `www → sottodominio`, rewrite di
`/d/:id` e un **cron** giornaliero alle 03:00 per la pulizia dei link.

---

## 🎨 Palette

Verde brand identico nei due temi, grigi puri intorno. L'arancio Ubuntu resta come identità storica.
Tutto il sistema colore è documentato e copiabile dal sito (footer → **«Palette»**).

![#3ECF8E](https://img.shields.io/badge/Brand-hsl(153_60%25_53%25)-3ECF8E?style=flat-square)
![#fcfcfc](https://img.shields.io/badge/Fondo_chiaro-%23FCFCFC-FCFCFC?style=flat-square&labelColor=555)
![#141414](https://img.shields.io/badge/Fondo_scuro-%23141414-141414?style=flat-square)
![#171717](https://img.shields.io/badge/Inchiostro-%23171717-171717?style=flat-square)
![#e95420](https://img.shields.io/badge/Ubuntu_storico-%23E95420-E95420?style=flat-square)

Carattere del sito: **Ubuntu** (+ Ubuntu Mono; Lora solo per `/festa`).

---

## 📄 Licenza

Codice sotto licenza **MIT** — liberamente riutilizzabile. Testi, foto personali, CV e brand
«Alberto Pecchini» sono **© Alberto Pecchini**, non riproducibili senza autorizzazione.

## 📬 Contatti

[![Email](https://img.shields.io/badge/Email-pzkko@yahoo.com-D14836?style=flat-square&logo=maildotru&logoColor=white)](mailto:pzkko@yahoo.com)
[![GitHub](https://img.shields.io/badge/GitHub-@albertoxpecchini-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/albertoxpecchini)
[![Instagram](https://img.shields.io/badge/Instagram-@albertoxpecchini-E4405F?style=flat-square&logo=instagram&logoColor=white)](https://www.instagram.com/albertoxpecchini)

<div align="center"><sub>Costruito con ❤️ a Mantova · <code>una pagina = un sottodominio</code></sub></div>
