<div align="center">

# Alberto Pecchini — Portfolio & Personal Hub

**SPA React/TypeScript** — un portfolio personale che fa da _hub_ a un sito multi-pagina
(bio, curriculum che stampa sé stesso, approfondimenti, un gioco-quiz, una console di viaggio,
strumenti e sezioni evento), servito **una pagina
= un sottodominio**, tradotto al volo in **4 lingue** e vestito con un design system
**«piattaforma»** — la grammatica `.sb-` rifatta sulla homepage di Supabase, azzurro brand
e tema chiaro/scuro nativo.

<!-- ─────────────  METRICHE LIVE (shields.io → GitHub API, auto-aggiornanti)  ───────────── -->

[![Last commit](https://img.shields.io/github/last-commit/albertoxpecchini/AP/main?style=flat-square&logo=git&logoColor=white&color=00B0FA)](https://github.com/albertoxpecchini/AP/commits/main)
[![Commit activity](https://img.shields.io/github/commit-activity/m/albertoxpecchini/AP?style=flat-square&color=24B47E)](https://github.com/albertoxpecchini/AP/pulse)
[![Created at](https://img.shields.io/github/created-at/albertoxpecchini/AP?style=flat-square&label=nato%20il&color=1C8C63)](https://github.com/albertoxpecchini/AP)
[![Repo size](https://img.shields.io/github/repo-size/albertoxpecchini/AP?style=flat-square&color=00B0FA)](https://github.com/albertoxpecchini/AP)
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
[![PWA](https://img.shields.io/badge/PWA-Workbox-5A0FC8?style=flat-square&logo=pwa&logoColor=white)](https://vite-pwa-org.netlify.app/)
[![Supabase](https://img.shields.io/badge/Supabase-REST_+_Realtime-3FCF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Anthropic](https://img.shields.io/badge/Claude-Fable_5-D97757?style=flat-square&logo=anthropic&logoColor=white)](https://www.anthropic.com)
[![Vercel](https://img.shields.io/badge/Vercel-hosting_+_cron-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)

🔗 **Live:** [albertopecchini.it](https://albertopecchini.it) · **Repo:** [albertoxpecchini/AP](https://github.com/albertoxpecchini/AP) · **Autore:** [@albertoxpecchini](https://github.com/albertoxpecchini)

</div>

---

## 📊 Il progetto in numeri

> I badge di metrica derivano dall'API GitHub e si ricalcolano a ogni `git push`.
> La tabella qui sotto è misurata sull'albero versionato all'**11 agosto 2026**.

| Dominio | Valore | Dettaglio |
| :--- | :--- | :--- |
| **Codebase** | **~41,9k LOC** in `src/` | 123 file versionati: 52 `.tsx` (24,3k) · 37 `.ts` (6,1k) · 27 `.css` (11,5k) |
| **Backend + tooling** | **~5,7k LOC** fuori da `src/` | 7 funzioni `api/` + `lib/` (185) · `scripts/` (4,9k, di cui 2,6k il programma di pulizia) |
| **Dipendenze** | **12 runtime** + 10 dev | niente framework pesanti, tutto essenziale |
| **Pagine** | **14 rotte** | 1 hub + 13 pagine `React.lazy`, code-split per rotta · `/cleaning` esiste **solo** in dev · `/shooting` è pubblica ma le sue foto no |
| **Lingue UI** | **4** — IT · EN · FR · DE | motore i18n che traduce il DOM live · 1020 voci, spacchettate in un pacchetto per lingua |
| **Trivia — quiz** | **1003 domande** su 40 capitoli | 401 multipla · 401 vero/falso · 201 aperta |
| **Serverless** | **7 funzioni** in `api/` | trivia · notify · festa-rsvp · sponsor · ig-stats · d · cron |
| **Cronologia** | **374 commit** dal 2026-05-24 | 181 `feat` · 88 `fix` · 27 `style` · 15 `chore` · 7 `docs` · 6 `refactor` |

---

## 🎨 Il design system «piattaforma» (`.sb-`)

Il sito è stato **rifatto da zero sul layout della homepage di Supabase** e adattato ai contenuti
esistenti. Non è un tema applicato sopra: è la grammatica strutturale (nav sottile, hero a due
colonne, griglia prodotti a 12 colonne con card a bordo-gradiente, pannello «dashboard», switcher
dello stack con codice vero, story-card, muro community, sezione open source, CTA finale) portata
su ogni pagina.

- **Prefisso `.sb-`** — tutti i token e le classi vivono in [`src/app/home.css`](src/app/home.css) (2333 righe),
  ereditati da footer, ControlBar, archivio e pagine interne.
- **Tema chiaro/scuro NATIVO** — non due fogli di stile, ma un set di custom properties ridichiarate
  sotto `html.dark`. Il chiaro è il default.
- **Palette neutra + un solo colore** — grigi puri per fondali, bordi e testo; l'unica tinta è il
  **azzurro brand `hsl(197 100% 49%)`**. Dal 2026-08 è l'unico accento su **tutte** le pagine:
  l'arancio Ubuntu sopravvive solo nelle email transazionali (`api/d.ts`).
- **Un fondale solo, per tutta la pagina** — è `position: fixed`, quindi resta incollato alla
  finestra: la griglia tecnica in `.sb-bg` (solo home) e **due velature radiali** — azzurro e ciano —
  su `::before`/`::after` di `.sb-home`, cioè su ogni pagina. Nessun bordo di sezione può tagliarlo
  mentre si scorre, quindi **fra una sezione e l'altra non c'è nessun confine**; il contenuto scorre
  sopra, trasparente. Anche il footer non comincia con un bordo: il suo colore entra in
  **dissolvenza** dall'alto.
- **Le card sono lastre di vetro** (token `--sb-glass-*`: fondo semitrasparente, `backdrop-filter`,
  rim chiaro). Una lastra però si legge come lastra solo se dietro passa qualcosa che cambia —
  sfocare una tinta piatta dà lo stesso risultato di non sfocare niente. Per questo i due aloni non
  stanno fermi: derivano con lo scroll (`site/GlassMotion.tsx`). È anche il motivo per cui sono
  saliti sugli pseudo-elementi di `.sb-home` invece di restare dentro `.sb-bg`, che esiste solo
  sulla home.
- **Tipografia Titillium Web** — il carattere del sito (+ Roboto Mono per il codice; Lora solo per `/festa`),
  al posto del Circular di Supabase.
- **CSS per pagina** — ogni pagina ha il suo file accanto al componente
  (`bio.css`, `pcto.css`, `mestesso.css`, `instagram.css`, `sostieni.css`, `trivia.css`,
  `archivio.css`, `controlbar.css`, `palette.css`, `scrollprogress.css`, `workflow.css`, più
  `approfondimento.css` condiviso da `/dubliners` e `/gattopardo`), importato
  dal componente stesso: nessun foglio monolitico, e il code-splitting per rotta porta con sé anche
  lo stile.

**La palette per intero è consultabile dal sito**: footer → **«Palette»**
([`PaletteModal.tsx`](src/app/site/PaletteModal.tsx)) apre una finestra con tutte le tinte in uso —
azzurro brand, fondali, bordi, testo (con rapporto di contrasto), colori del codice, token shadcn,
grafico contribuzioni, linguaggi, i pochi colori fissi di Trivia, arancio delle email — mostrate
**nei due temi affiancati** e copiabili negli appunti.

---

## 🧩 La chrome globale — montata una volta, viva ovunque

Quattro elementi stanno **fuori dal router**, in [`src/main.tsx`](src/main.tsx), e accompagnano ogni pagina:

| Componente | Dove | Cosa fa |
| :--- | :--- | :--- |
| **ControlBar** — [`theme/ControlBar.tsx`](src/app/theme/ControlBar.tsx) | in basso a sinistra | Un'unica pillola: **lingua · tema · sensore orario**. Sta rincantucciata oltre il bordo e lascia sporgere solo la linguetta; esce quando il puntatore le si **avvicina** (130 px), quando il fuoco da tastiera entra, o premendo la linguetta (unico modo sul touch, dove resta fissata). Rientra da sola dopo 620 ms, ma solo se non è sotto il puntatore, non ha il fuoco e non ha menu aperti. |
| **ScrollProgress** — [`site/ScrollProgress.tsx`](src/app/site/ScrollProgress.tsx) | bordo alto | Il filo di avanzamento della lettura. Non usa `ScrollTrigger` (le pagine sono lazy e cambiano altezza dopo il montaggio): rimisura a ogni frame utile e ammorbidisce con `gsap.quickTo`. Con lo scroll bloccato (modali) si **congela** invece di azzerarsi. |
| **GlassMotion** — [`site/GlassMotion.tsx`](src/app/site/GlassMotion.tsx) | non disegna niente | Monta il movimento del vetro: la **deriva** dei due aloni con lo scroll (senza cui il blur delle card non si leggerebbe), il **tilt** della card sotto il puntatore col rim che si sposta di conseguenza, e la **pozza** sui quadratini dei commit ([`puddle.ts`](src/app/site/puddle.ts)). La deriva sta dietro `prefers-reduced-motion`; tutto ciò che dipende dal puntatore anche dietro `(hover: hover) and (pointer: fine)`. |
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
- [`site/homeLive.tsx`](src/app/site/homeLive.tsx) — le **sette tavole** della griglia prodotti.
  Erano sette miniature di interfaccia (finestra di browser, terminale che digita, tabellone di
  gioco, cubo su un piano); adesso sono sette **disegni a tratto** sulla stessa tavola di 280×132,
  stesso spessore di linea e stesso azzurro — il progetto quotato di una pagina, un saggio
  tipografico, un prisma che apre un raggio in cinque, una traiettoria a tre rimbalzi, due insiemi
  e la loro intersezione, un globo con due satelliti, le curve di livello di un rilievo. Da lontano
  si legge una collezione, non sette schermate. Una sola cosa in movimento per riquadro, e il
  movimento sta **tutto in CSS**: qui dentro non è rimasta una riga di JavaScript di animazione.
- [`site/GlassMotion.tsx`](src/app/site/GlassMotion.tsx) — il movimento **del vetro**, montato una
  volta per tutte le pagine (vedi la tabella qui sopra). È l'unico posto in cui il puntatore comanda
  qualcosa, e quel che comanda sono solo `transform` e `opacity`: per un giro il moto dei visual
  delle card è passato di qui, e i numeri finivano in `left`, `top`, `clip-path` e `box-shadow` —
  cioè in proprietà che **ridisegnano**, con gli scatti che ne conseguono. Adesso quel moto è in
  keyframe CSS dentro `home.css`.
- [`site/homeFx.tsx`](src/app/site/homeFx.tsx) — il raccordo fra i due componenti «React Bits»
  ([`ClickSpark`](src/components/reactbits/ClickSpark.tsx), [`SpotlightCard`](src/components/reactbits/SpotlightCard.tsx))
  e questo sito: quelli non sanno niente di temi né di preferenze, e tutto ciò che li lega ai token
  `.sb-` (palette in chiaro per chi disegna su canvas, riaggancio a `subscribeTheme`, mancato
  montaggio con `prefers-reduced-motion`) sta lì. Da qui sono passati e **spariti** gli ultimi due
  cicli che giravano senza che nessuno li avesse chiesti: l'**aurora** (uno shader WebGL con un
  `rAF` che avanzava per sempre — il gradiente fermo tenuto come ripiego era già indistinguibile a
  occhio) e lo **shiny text** (una banda di luce ogni 3,4 s sulle brandline). La luce sulla
  brandline c'è ancora, ma passa quando passi tu: è la stessa `--gloss-x` del titolo della hero.
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
| `/` | `www` | **Home / hub** | Vetrina «piattaforma»: hero, prodotti, archivio incorporato, stack, pagine, lavori, curriculum, garage 3D, open source, contatti |
| `/bio` | `bio` | **Bio** | Pagina About: gallery + fatti essenziali |
| `/cv` | _(solo path)_ | **CV** | Il curriculum come pagina, nelle 4 lingue — e **stampa sé stessa**: nessun PDF da servire |
| `/trivia` | `trivia` | **Trivia** | Quiz sulla storia dell'architettura — 1003 domande, leaderboard, curiosità AI |
| `/pcto` | `pcto` | **PCTO** | Alternanza scuola-lavoro (Caem Group) — timeline + racconto |
| `/me-stesso` | `me-stesso` | **Me stesso** | Presentazione personale (Esame di Stato 2026) |
| `/dubliners` | `dubliners` | **Dubliners** | Approfondimento «Gente di Dublino» (J. Joyce, 1914) |
| `/gattopardo` | `gattopardo` | **Gattopardo** | Approfondimento «Il Gattopardo» (Tomasi di Lampedusa, 1958) |
| `/festa` | `festa` | **Festa** | Inviti con token, RSVP e notifica email |
| `/mima` | _(solo path)_ | **MiMa · album** | Le foto di Milano Marittima su mappa e scaletta, ordinate dagli EXIF |
| `/shooting` | _(solo path)_ | **Shooting** | I ritratti: data, luogo e attrezzatura per tutti; **le foto solo in locale** |
| `/archivio` | `archivio` | **Archivio** | Esploratore di progetti **e dell'albero vero del repo** |
| `/sostieni` | `sostieni` | **Sostieni** | Dati bonifico + libro firme dei donatori |
| `/instagram` | _(solo path)_ | **Compare Two Lists** | «Chi ti ha tolto il follow» — confronto di due liste, tutto in locale |

I **sottodomini sono nove**: le pagine senza sottodominio restano a path sotto `www`. C'è poi una
quindicesima rotta, `/cleaning`, che **esiste solo in sviluppo** — vedi
[l'officina](#cleaning--lofficina-in-pagina).

`/shooting` è pubblica, ma le sue foto no: le immagini stanno in `foto/shooting/`, fuori dal repo, e
l'unico indirizzo che le serve vive dentro `configureServer` — cioè solo sotto `vite dev`. Chi apre
la pagina dal sito pubblicato vede le schede delle sessioni (data, luogo, quanti scatti, con che
macchina) e nient'altro, perché di là le foto non sono mai state caricate. Vedi
`foto/shooting/LEGGIMI.md`.

**E il permesso**, per chi le foto ha motivo di vederle — chi c'è dentro, prima di tutti. Si chiede
dal modulo della scheda, serve un codice consegnato a voce (`SHOOTING_CODICE`), la richiesta finisce
in una tabella privata e arriva un'email con chi ha chiesto e da dove. La decisione si prende da una
pagina, **con un POST e non con un GET**: gli scanner delle caselle di posta pre-aprono i link, e un
link che autorizza da solo verrebbe cliccato dal primo antivirus di passaggio. Autorizzando parte un
link che vale **24 ore**, revocabile, e serve le immagini da un bucket **privato** con indirizzi
firmati che scadono in un'ora. Nel bucket ci va solo quello che ci metti tu, una sessione alla volta
(`npm run scatti:carica`). Codice: [lib/scattiAccesso.ts](lib/scattiAccesso.ts),
[api/scatti-richiesta.ts](api/scatti-richiesta.ts), [api/scatti-accesso.ts](api/scatti-accesso.ts),
schema [supabase/shooting_richieste.sql](supabase/shooting_richieste.sql).

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
- **Versionamento automatico, ma versionato** — la versione è `1.<numero di commit che hanno toccato
  src/app/trivia/>`, e il conteggio lo fa git. Git da solo però non basta: Vercel clona in
  **shallow**, e su un clone troncato `git rev-list --count` conta solo quel che ha sotto mano —
  lo stesso identico codice diceva `v1.56` in locale e `v1.2` in produzione. Quel numero misurava la
  profondità del clone, non il gioco. Ora il conteggio è un **dato committato**
  ([`version.json`](src/app/trivia/version.json)): [`build-trivia-version.mjs`](scripts/build-trivia-version.mjs)
  lo ricalcola solo dove la storia è intera (la macchina di sviluppo) e lo riscrive solo se è
  cresciuto; il builder usa il valore arrivato col checkout, e
  [`vite.config.ts`](vite.config.ts) lo inietta come `__TRIVIA_VERSION__`.
- **Foto pertinenti, a licenza libera** — [`photos.ts`](src/app/trivia/photos.ts) cerca un'immagine
  per la domanda in cascata (Wikipedia IT → EN, poi Wikimedia Commons, poi Openverse), con cache in
  `sessionStorage`, prefetch della domanda successiva e ripiego silenzioso su una card grafica: la
  ricerca non può mai far aspettare il gioco.
- **Arricchimento AI** — l'endpoint serverless [`/api/trivia`](api/trivia.ts) interroga **Claude Fable 5**
  (`@anthropic-ai/sdk`) per curiosità contestuali; accetta solo richieste dal sito (origin check +
  rate-limit), così non è usabile come proxy AI gratuito. In dev lo stesso endpoint è servito da un
  middleware di Vite, con la chiave letta dal `.env`.
- Punteggio con bonus velocità, serie con trofei, voto finale in stile americano (A–F), pagelle e
  classifica **live** (Supabase Realtime, con fallback `localStorage`).

---

## 🚗 Il garage — tre auto vere in WebGL, senza three.js

In fondo alla home (`#garage`) ci sono tre modelli 3D che si girano col dito: Aventador LP 700-4,
Alfa Romeo 4C, Audi R8 V10. Sono i modelli **come sono** — stessa geometria, stessi materiali,
stesse texture, stessi colori dei file di partenza (131 000 triangoli per l'Aventador, interni e
motore compresi, e trenta texture in tutto). Niente è stato semplificato o ricolorato.

- [`scripts/build-cars.mjs`](scripts/build-cars.mjs) cambia solo i **contenitori**: la geometria da
  testo (`v 1.234 5.678`) a interi binari — i tipi che WebGL vuole nei suoi buffer, quindi il file si
  carica così com'è — e le texture da PNG a WebP. I sorgenti (30 MB, modelli di terzi) **non stanno
  nel repository**; il risultato sì: `public/models/cars.bin` + `tex/`, con provenienza e licenze in
  `public/models/README.md`.
- **Niente three.js** — servirebbe un decimo della libreria (una mesh statica, una luce, nessuna
  ombra, nessun materiale PBR) e costerebbe 160 kB gzip, più di tutta la home.
  [`site/dreamCars.tsx`](src/app/site/dreamCars.tsx) ne pesa sei: due shader, un buffer per
  attributo, una texture per materiale, un `drawElements` per tratto di indici.
- Le tre cose che un visualizzatore del genere deve fare bene: il **buffer di profondità** (su un
  modello vero le cose si compenetrano dappertutto — il cerchio dentro la gomma, lo specchietto
  contro il montante — e un ordine giusto delle facce semplicemente non esiste: deve decidere il
  pixel); i **materiali trasparenti dipinti dopo gli opachi e senza scrivere in profondità**, o il
  parabrezza nasconde l'abitacolo; la **ripetizione delle texture** (le UV delle gomme arrivano a 60:
  senza `REPEAT` il battistrada diventa una striscia stirata — da cui le texture in potenze di due).
- La rotazione è una **matrice moltiplicata a sinistra** dallo spostamento del dito letto negli assi
  della camera, non due angoli sommati: quelli si incastrano ai poli. Comunque sia messa l'auto,
  trascinare a destra la fa girare verso destra. Da fermo il ciclo di rendering è **spento**, e tutto
  si scarica solo quando la sezione si avvicina (`WhenVisible`).

---

## 🏞️ Rivalta sul Mincio — il dossier del paese

[**rivaltasulmincio.it**](https://rivaltasulmincio.it) è il dossier di Rivalta sul Mincio, frazione
di Rodigo, provincia di Mantova, 46040. **Nove pagine**: il paese, i servizi, le attività, la
comunità, il muoversi, la natura, gli eventi, e una che spiega da dove viene tutto il resto.

- **HTML statico puro.** Zero dipendenze, zero framework, nessun `package.json`: su Vercel non gira
  nessuna build, le pagine si servono così come sono.
- **Un assemblatore di 142 righe**, che gira solo in locale: un guscio più nove frammenti. Tenere
  nove copie a mano della stessa nav significa che prima o poi otto sono aggiornate e una no — ed è
  sempre quella che qualcuno apre.
- **Indirizzi senza estensione** — `/paese`, non `/paese.html`. Il vecchio risponde comunque, con
  un `308`.
- **Il design system `.sb-` è portato da qui, non reinventato**: grigi puri più un solo azzurro, un
  fondale fisso per tutta la pagina — fra una sezione e l'altra nessuna riga di confine — e tema
  chiaro/scuro nativo, deciso dall'orologio **prima del primo paint**.
- **Il movimento è vetro, e risponde a un gesto**: la card si inclina sotto il puntatore, la
  pillola della nav segue la voce, il fondale scorre di un dodicesimo. Sta tutto in un file solo, e
  se quel file non arriva il sito resta identico e navigabile. Niente parte da sé, e sul touch non
  parte affatto.
- **Nessuna API chiamata a runtime.** I dati sono un estratto **OpenStreetMap dell'11 agosto 2026**
  — 330 punti, 74 vie, 106 incroci — pubblicato **grezzo e scaricabile**: dove il dossier e il
  dataset non vanno d'accordo, vince il dato che si può riverificare aprendo il JSON.
- Della **rassegna stampa** si pubblicano solo titolo, testata, data e link. Il resto è di chi
  l'ha scritto.

Da questa parte c'è solo la vetrina: [`site/FreshWork.tsx`](src/app/site/FreshWork.tsx) è la fascia
«just shipped» sotto la hero della home, col video del sito che gira in loop (3,0 MB in H.264, in
pausa fuori dalla finestra, fermo sul poster con `prefers-reduced-motion`). È **temporanea** e si
spegne con una riga sola: `SHOW = false` in cima al file.

---

## 🌍 i18n — traduzione del DOM al volo

Invece di internazionalizzare quindici pagine una per una, il sito **traduce il testo già renderizzato**
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

Dizionario: [`dictionary.ts`](src/app/i18n/dictionary.ts) (poche voci curate a mano, per le stringhe
dinamiche che il crawl non vede) + **1020 voci** in
[`translations.json`](src/app/i18n/translations.json), che resta la **fonte unica** e si continua a
modificare. Da lì [`build-i18n.mjs`](scripts/build-i18n.mjs) genera
`src/app/i18n/generated/<lingua>.json` — quattro mappe piatte, rigenerate a ogni `build` e a ogni
`dev`, fuori dal versionamento — e il motore ne carica con `import()` **solo quella attiva**:
il visitatore italiano non si scarica più anche francese, tedesco e inglese. Cambiare lingua non
ricarica la pagina.

---

## 🗂️ Struttura del repository

```
AP/
├── api/                      # 8 funzioni serverless Vercel (Node)
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
├── public/                   # PDF (CV + attestati), immagini, video, models/ (auto 3D),
│                             #   zips/, manifest PWA
├── scripts/
│   ├── build-cv.py           #   src/app/cv/data/*.json → 4 PDF statici (WeasyPrint)
│   ├── build-zips.mjs        #   ZIP del sorgente per ogni progetto d'archivio
│   ├── build-repo-tree.mjs   #   albero del repo da git → public/repo-tree.json
│   ├── build-i18n.mjs        #   translations.json → un pacchetto per lingua
│   ├── build-trivia-version.mjs #  versione di Trivia, contata dove la storia è intera
│   ├── build-cars.mjs        #   FBX/OBJ + PNG → cars.bin + texture WebP (fuori CI)
│   ├── build-foto-mima.mjs   #   foto/mima/ → EXIF (data + GPS) → album e mappa
│   ├── build-foto-shooting.mjs # foto/shooting/ → EXIF → due manifesti: uno pubblico, uno no
│   ├── shooting-api-dev.mjs  #   /scatti-privati/… — le foto dei ritratti, solo sotto vite dev
│   ├── dev/                  #   la sala macchine del dev server (vedi più sotto)
│   │   ├── avvia.mjs         #     supervisore: porta, preparativi, riavvii, log
│   │   ├── porta.mjs         #     chi occupa la 5173 — e se è Vite, di chi è
│   │   ├── preparativi.mjs   #     controlli, artefatti rigenerabili, diagnosi delle chiavi
│   │   ├── stato.mjs         #     .dev/: stato, impronte, log rotante, kill dell'albero
│   │   └── tinte.mjs         #     colori e righe di diagnosi, uguali per tutti i comandi
│   ├── make-link.mjs         #   link tracciabili usa-e-getta (solo in locale)
│   ├── lib/fbx.mjs           #   lettore FBX binario, per build-cars
│   ├── janitor/              #   il programma di pulizia + benchmark (vedi più sotto)
│   └── seed-*.js|.mjs        #   seed dei profili
├── src/
│   ├── app/
│   │   ├── App.tsx           # Home «piattaforma» + header/menu inline
│   │   ├── home.css          # il design system .sb- (token, layout, vetro, keyframe)
│   │   ├── site/             # footer, nav, dati, progetti, README dei progetti,
│   │   │                     #   homeIcons/homeLive/homeMotion/footMotion,
│   │   │                     #   GlassMotion + puddle, homeFx, WhenVisible,
│   │   │                     #   dreamCars (WebGL), FreshWork, RivaltaMap,
│   │   │                     #   repoTree, PaletteModal, ScrollProgress,
│   │   │                     #   WorkflowModal + workflow.css (diagramma in CSS)
│   │   ├── cv/               # /cv: il curriculum come pagina (4 lingue) + stampa
│   │   │                     #   PDF; data/cv.<lingua>.json = fonte unica, la
│   │   │                     #   legge anche scripts/build-cv.py
│   │   ├── theme/            # ControlBar (lingua·tema·sensore) + themeCore
│   │   ├── trivia/           # gioco quiz + parser + API leaderboard/pagelle/progressi
│   │   ├── cleaning/         # /cleaning: l'officina del repo — SOLO in dev
│   │   ├── bio  pcto  me-stesso  dubliners  gattopardo  festa  archivio  sostieni  instagram
│   │   ├── i18n/             # motore di traduzione del DOM (IT · EN · FR · DE)
│   │   ├── utils/            # keyboard guard, scroll lock, device, prefs
│   │   └── _game/            # motore condiviso dei giochi (gate, tokens, leaderboard)
│   ├── components/           # reactbits/ (ClickSpark, SpotlightCard) · ui/map (maplibre)
│   ├── lib/                  # utilità trasversali (players, utils)
│   └── styles/               # theme.css · tailwind · fonts · ios · site · ubuntu
├── supabase/                 # schema .sql delle tabelle (scores, grades, players, link)
└── vite.config.ts            # plugin React/Tailwind/PWA, asset resolver, versioning,
                              #   dev-API (/api/* e gli endpoint di /cleaning)
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
> partecipante, linea di vita tratteggiata, barra di attività azzurra, messaggi che scavalcano le
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
    Note over VC: prebuild · versione Trivia · ZIP · repo-tree.json · 4 pacchetti i18n
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
| **Wikipedia · Wikimedia Commons · Openverse** | foto pertinenti alle domande di Trivia, a licenza libera, senza API key | client (cascata, con cache) |
| **Open-Meteo** | previsioni e medie stagionali su `/festa` | client |
| **Carto basemaps** | tessere della mappa MapLibre in fondo alla home | client |

---

## 🧰 Stack tecnologico

| Layer | Tecnologie |
| :--- | :--- |
| **Core** | React 18.3 · TypeScript · Vite 6.3 |
| **Routing** | `react-router` 7 (BrowserRouter, `lazy` + `Suspense`) + mappa host → pagina per i sottodomini |
| **Styling** | design system `.sb-` in CSS puro (custom properties, tema nativo) · Tailwind CSS 4.1 · `tw-animate-css` |
| **Motion** | `gsap` 3.15 + ScrollTrigger (intro della hero, contatori, magneti, filo di lettura, deriva e tilt del vetro) · keyframe CSS per le sette tavole della griglia prodotti · `canvas-confetti` in Trivia |
| **UI** | icone `homeIcons.tsx` disegnate a mano (outline 24×24, tratto 1.5) · `lucide-react` + `react-icons` dove serve · `@radix-ui/react-context-menu` (archivio) · due componenti «React Bits» (ClickSpark, SpotlightCard) raccordati da `homeFx` · diagrammi disegnati in CSS, senza librerie |
| **3D & mappe** | visualizzatore WebGL scritto a mano per le tre auto (niente three.js) · `maplibre-gl` con tessere Carto, caricata solo all'avvicinarsi |
| **i18n** | motore proprietario che traduce il DOM in IT · EN · FR · DE, un pacchetto per lingua |
| **PWA** | `vite-plugin-pwa` + Workbox (precache offline, auto-update) |
| **Backend** | Supabase via REST/Realtime · 8 funzioni serverless Vercel + `lib/serverSecurity` |
| **AI** | `@anthropic-ai/sdk` → Claude Fable 5 (curiosità Trivia) |
| **Insight** | `@vercel/speed-insights` (Core Web Vitals reali) |
| **Tooling** | `build-cv.py` (WeasyPrint → 4 PDF) · `archiver` per gli ZIP · `build-repo-tree.mjs` per l'albero · `build-i18n.mjs` per i pacchetti lingua · `build-cars.mjs` per i modelli 3D · `exifr` + `sharp` in `build-foto-mima.mjs` per l'album MiMa · `scripts/janitor/` per pulizia e benchmark |

> **Peso del primo accesso.** Quattro cose che il browser scaricava e non guardava:
>
> - **maplibre-gl** (~275 kB gzip) partiva col resto della home. `React.lazy` è pigro rispetto al
>   *render*, non allo *scroll*: la mappina in fondo veniva renderizzata al primo frame come tutto
>   il resto, quindi il suo `import()` partiva subito. Adesso passa da
>   [`WhenVisible`](src/app/site/WhenVisible.tsx) e si scarica quando ci si avvicina.
> - **Le traduzioni** erano 230 kB di JSON con dentro tutte e quattro le lingue, importati in cima
>   a `dictionary.ts`. `build-i18n.mjs` li spacchetta in quattro pacchetti e se ne carica **uno**,
>   quello attivo.
> - **Framer Motion** (~40 kB gzip) stava nel bundle di ogni pagina per animare il menu a tendina
>   della lingua. Le sue tre animazioni sono tre transizioni CSS.
> - **`three`, `vanta`, `mermaid`, `motion`**: rimasti in `package.json` dopo essere spariti dal
>   codice. Disinstallati.
>
> Risultato: **−63 % sul percorso critico della home** (638 → 238 kB gzip) e **precache del service
> worker da 2,9 MB a 1,3 MB**, con `vendor-react` e `vendor-gsap` in chunk separati — così un
> commit sul sito non obbliga a riscaricare anche le librerie.

---

## 🔐 Sicurezza & privacy

Il sito è pensato per essere **a prova di abuso**, senza archiviare dati di terzi.

- **Solo l'email è pubblica** — niente telefono né WhatsApp sul sito o nel CV.
- **Scritture blindate** — RSVP, firme donatori e contatori non partono diretti
  dal client verso Supabase: passano da un endpoint serverless con **origin check + rate-limit** e
  `INSERT` con **service role** (la `anon key` non può iniettare dati fasulli). Le letture restano
  pubbliche, perché servono al realtime.
- **L'officina non esiste in produzione** — `/cleaning` legge e riscrive i file del repo e fa
  commit: la rotta è dietro `import.meta.env.DEV` e i suoi endpoint vivono in `configureServer`,
  cioè solo sotto `vite dev`. Verificato sul build vero, [più sotto](#cleaning--lofficina-in-pagina).
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
npm run dev       # http://localhost:5173 — HMR attivo, middleware /api/*, /cleaning
npm run build     # bundle di produzione in dist/ (prima il prebuild, vedi tabella)
```

Le chiavi vivono in un `.env` locale (non versionato, e **non** c'è un `.env.example` nel repo):
`ANTHROPIC_API_KEY` per le curiosità di Trivia, `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
per le letture dal client, `SUPABASE_SERVICE_ROLE_KEY` per gli endpoint blindati e i link
tracciabili, `RESEND_API_KEY` per le email, `CRON_SECRET` per il cron, `SHOOTING_CODICE` per il modulo di
/shooting (il codice che si consegna a voce: **senza, il modulo si chiude**, non si apre).

| Comando | Azione |
| :--- | :--- |
| `npm run dev` | Dev server sorvegliato: libera la porta 5173, prepara gli artefatti, tiene Vite in piedi. Ctrl+C spegne tutto (vedi «La sala macchine») |
| `npm run dev:sfondo` | Lo stesso, ma staccato: restituisce il terminale. È quello che lancia il tasto F5 di VS Code |
| `npm run dev:stato` | Chi è acceso, su che porta, da quanto — e cosa funziona davvero con le chiavi che ci sono |
| `npm run dev:ferma` | Spegne il dev server e tutti i suoi figli |
| `npm run dev:log` | Le ultime righe del server acceso (`-- --segui` per restare in ascolto) |
| `npm run build` | Build statica in `dist/`. Il `prebuild` fa quattro cose: versione di Trivia, ZIP dei progetti, `repo-tree.json`, pacchetti i18n |
| `npm run zips` | Rigenera solo `public/zips/` + il manifest delle dimensioni |
| `npm run repo-tree` | Rigenera solo `public/repo-tree.json` dall'albero git |
| `npm run i18n` | Rigenera solo `src/app/i18n/generated/<lingua>.json` da `translations.json` |
| `node scripts/build-cars.mjs <cartella>` | Rigenera `public/models/` dai modelli 3D sorgente (che **non** stanno nel repo) |
| `npm run foto` | Album MiMa: legge gli EXIF delle foto in `foto/mima/` (che **non** stanno nel repo), le rimpicciolisce in `public/images/mima/` e scrive `src/app/mima/foto.json` — posizioni dal GPS, ordine da `DateTimeOriginal` |
| `npm run scatti` | Shooting: legge gli EXIF di `foto/shooting/<sessione>/` e scrive **due** manifesti — `src/app/shooting/sessioni.json` (versionato: date, luoghi, conteggi) e `foto/shooting/.web/manifesto.json` (fuori dal repo: gli scatti). Le immagini restano in `foto/`, mai in `public/` || `python3 scripts/build-cv.py [it en fr de]` | Rigenera i PDF statici del CV da `src/app/cv/data/` (il CV "vivo" è la pagina `/cv`, che stampa sé stessa) |
| `npm run scatti:carica -- s1` | Porta UNA sessione nel bucket privato di Supabase (miniature, versione media e originali). Senza argomenti dice cosa c'è di sopra. È l'unico modo perché un autorizzato possa vederla da remoto |
| `npm run scatti:togli -- s1` | La toglie dal bucket: da lì in poi non la vede più nessuno, permessi già dati compresi |
| `npm run pulizia` | Cerca lo sporco e misura, **senza toccare niente** |
| `npm run pulizia:applica` | Pulisce, verifica con build + benchmark, annulla da solo se qualcosa peggiora |
| `npm run bench` | Solo benchmark: build, peso, fotogrammi — confrontati con l'ultima volta |
| `npm run pulizia:prove` | Le prove di sicurezza del programma di pulizia (pianta file veri e controlla cosa decide) |

---

## 🛠️ La sala macchine — `scripts/dev/`

`npm run dev` non lancia più `vite` e basta. Prima faceva questo, e in locale le cose andavano
male sempre negli stessi tre modi.

**La porta.** `strictPort: true` è una scelta voluta — il debug di Edge, il benchmark del
janitor e i link che ci si scambia puntano tutti alla 5173, e un Vite che ripiega da solo sulla
5174 è peggio di uno che non parte: le pagine si aprono, ma su un server che non è quello che
si sta guardando. Il prezzo era che il secondo `vite` moriva con `EADDRINUSE` e una riga sola,
senza dire chi ci fosse dentro. Il colpevole, nove volte su dieci, era un dev server rimasto
acceso da una sessione F5 di mezz'ora prima.

**I crash.** Sotto `vite dev` questo repo monta otto middleware `/api/*` scritti in casa
(`vite.config.ts`). Un errore non gestito in uno di quelli e il processo se ne va: chi stava
guardando la pagina vede solo che il sito ha smesso di rispondere, e la spiegazione è in un
terminale che nel frattempo è finito sotto altre finestre.

**Le chiavi.** I plugin leggono il `.env` una volta sola, all'avvio, e poi tacciono. Senza
`ANTHROPIC_API_KEY` `/api/trivia` risponde 500, senza `RESEND_API_KEY` le email si stampano in
console invece di partire: cose normalissime in locale, ma scoprirle dalla pagina costa
mezz'ora di indagine ogni volta.

**Cosa fa adesso.** All'avvio guarda chi c'è sulla 5173 e distingue tre casi: un dev server
nostro rimasto acceso (lo ferma e prende il posto), un Vite che non abbiamo avviato noi (idem,
dicendolo), o un programma che non c'entra niente — e lì non si spara a niente: si dice chi è,
con nome e pid, e si offre `--porta auto`. Poi prepara gli artefatti rigenerabili, ma solo
quelli che servono davvero: i pacchetti i18n si rifanno se `translations.json` si è mosso, la
versione di Trivia se `HEAD` si è mosso. Il vecchio `predev` li rifaceva entrambi a ogni avvio,
e siccome `version.json` è un file **versionato**, ogni `npm run dev` sporcava `git status`.

Poi accende Vite e resta a guardarlo. Se muore lo riaccende, con un'attesa che raddoppia a ogni
tentativo; se muore cinque volte in un minuto smette, perché a quel punto il problema è nel
codice e riavviare all'infinito non fa che seppellire l'errore vero sotto dieci stack trace
uguali. Ogni cinque secondi bussa a `/@vite/client`: un processo vivo non è un server che
risponde — un ciclo infinito in un middleware lascia `node.exe` nella lista dei processi e il
browser che gira a vuoto. Ma **rifiuto e ritardo non sono la stessa cosa**, e la prima versione
di questo pezzo li confondeva: contava per morto anche il server che ci metteva più di quattro
secondi, e ha spento un dev server sanissimo proprio mentre trasformava i moduli della prima
pagina aperta nel browser. Adesso tre connessioni rifiutate di fila valgono un riavvio; una
risposta lenta vale un'annotazione, e si interviene solo se dura due minuti.

E infine dice, in chiaro, cosa funzionerà: una riga per `/api/trivia`, le scritture Supabase, le
email, il modulo `/shooting`, le foto degli shooting. Verde = come in produzione, giallo =
funziona ma finge, rosso = chiuso. I valori delle chiavi non escono da lì: si guardano solo i
nomi.

```bash
npm run dev                      # in primo piano, Ctrl+C spegne tutto
npm run dev:sfondo               # staccato: restituisce il terminale (lo usa F5)
npm run dev:stato                # acceso? su che porta? da quanto? con quali chiavi?
npm run dev:ferma                # spegne il server e tutti i suoi figli
npm run dev:log -- --segui       # le ultime righe, e resta in ascolto
npm run dev -- --porta auto      # la prima porta libera dalla 5173 in su
npm run dev -- --rete --apri     # esponi sulla rete di casa e apri il browser
```

**Due dettagli che valgono il codice che costano.** Il primo: la sonda bussa sia a `127.0.0.1`
sia a `[::1]`. Su Windows `localhost` è tutti e due, e un dev server può restare in ascolto solo
sul secondo — chiedendo al solo IPv4 si riceve un rifiuto, si conclude «porta libera», e poi
Vite muore con `Port 5173 is already in use` da un processo che nessuno riesce a trovare
(anche `netstat -ano -p tcp` mostra solo l'IPv4: quel `-p tcp` è la ragione per cui il colpevole
sembrava invisibile). Il secondo: si ferma sempre l'**albero** dei processi, mai il solo padre.
Vite lancia esbuild e compagnia; uccidere il capo lasciava in giro figli che tenevano ancora la
porta, e al giro dopo «Vite non parte» — con la colpa addosso a Vite.

Tutto quello che il supervisore vede finisce anche in `.dev/log/`, un file per avvio, gli ultimi
cinque, ripulito dai colori. `.dev/` sta fuori dal repository: è roba della singola macchina.

---

## 🧹 Pulizia e benchmark — `scripts/janitor/`

Un programma locale che ogni due giorni toglie il peso morto dal repo e **dimostra** di non
aver rotto niente. Non è un `rm -rf` con un cron davanti: la parte interessante è tutta nel
come si assicura di poter girare da solo senza sorveglianza.

**Niente viene cancellato.** Quello che sembra inutile finisce in `.janitor/quarantena/<data>/`
con i percorsi originali intatti, poi la build gira davvero, poi un browser vero apre le pagine
davvero. Se la build non passa, o se compare un 404 che prima non c'era, o un errore in console
che prima non c'era, **tutto torna al suo posto da solo**. Il caso peggiore di un'esecuzione
automatica è un log che dice "annullato". Solo le quarantene sopravvissute a due settimane di
sito funzionante vengono svuotate per davvero.

**Cosa cerca** — sei categorie, e nel dubbio non è sporco:

| | Cosa | Come lo decide |
| :--- | :--- | :--- |
| 1 | Rigenerabili | `dist`, cache di Vite, log: già in `.gitignore` e ricostruiti da uno script dichiarato in `package.json` |
| 2 | Moduli orfani in `src/` | Irraggiungibili dal grafo degli import **e** mai nominati in nessun testo del repo — due prove indipendenti |
| 3 | Asset mai nominati in `public/` | Nessun file cita il percorso né il nome |
| 4 | Dipendenze mai importate | Nessun `import`, nessuna menzione |
| 5 | Duplicati esatti | Stesso SHA-1 in due percorsi — **solo segnalati**: quale sia quello buono non lo può sapere il programma |
| 6 | Git | `git gc`, rami già confluiti in `main` |

**Le eccezioni si dichiarano, col motivo.** `scripts/janitor/protetti.json` elenca le cose che
l'analisi segnalerebbe e che invece teniamo apposta — i CV in inglese, francese e tedesco, che il
sito non linka (la pagina `/cv` stampa sé stessa) ma che si mandano a mano in una candidatura.
Ogni voce ha la sua ragione scritta accanto: un elenco di eccezioni senza spiegazioni diventa in
sei mesi un elenco di cose che nessuno osa più togliere.

**Due cose che gli inventari generati insegnano.** `public/repo-tree.json` è l'albero dei
sorgenti che `/archivio` mostra: elenca 134 file di `public/`. Finché stava nel corpus di testo su
cui l'analisi chiede «questo nome è citato da qualche parte?», la risposta era sempre sì — e la
ricerca degli asset orfani era **spenta senza dirlo**, con ogni duplicato tenuto in vita. Le prove
non lo vedevano perché piantano un file *nuovo*, che in un elenco generato prima ovviamente non
c'è: ora ce n'è una che mette il nome anche dentro l'inventario. E la documentazione dentro
`public/` (i `CREDITI-IMMAGINI.md`, provenienza e licenza di ogni fotografia) non è un asset
servito: nessuno la importa per definizione, è scritta per chi legge. Anche quella ha la sua prova.

Le radici del grafo sono larghe di proposito (`index.html`, ogni file in `api/`, ogni script,
`vite.config.ts`): una radice dimenticata renderebbe "orfano" un ramo di codice vivo. E le
cartelle indirizzate a runtime — `/emoji/`, `/models/tex/`, `/zips/${slug}` — sono protette in
blocco, perché il loro contenuto non compare mai per esteso nel codice e cercarlo per nome darebbe
zero riscontri su file usatissimi.

**L'ordine conta.** I rigenerabili si tolgono **dopo** la verifica, non prima: messi all'inizio,
la build di verifica li ricreava tutti e il bilancio finale diceva onestamente `+0.0 MB`. Tolti
alla fine, la verifica è comunque avvenuta su un albero completo e lo spazio resta libero davvero.
Restano invece al loro posto `public/zips`, `repo-tree.json` e i pacchetti i18n (~440 kB): li rifà
il `prebuild`, che gira su `npm run build` ma **non** su `npm run dev`, e portarli via ogni due
giorni vorrebbe dire trovare `/archivio` senza ZIP da scaricare. Con `--tutto` se ne vanno anche
quelli. Il bilancio distingue sempre il risparmio **definitivo** (git, file del progetto) da
`dist` e cache, che tornano alla prima ricostruzione: spazio prestato, non guadagnato.

**La storia git non si riscrive mai.** `git gc` compatta e basta: servirebbe un push forzato, e un
push forzato automatico ogni due giorni è esattamente il modo di rompere tutto.

### Il benchmark

Un browser vero (Edge, via Chrome DevTools Protocol) apre le pagine costruite, le scorre tutte giù
e tutte su, e cronometra ogni singolo fotogramma. **Zero dipendenze aggiunte**: sarebbe assurdo
installare quaranta megabyte di Playwright dentro il programma che serve a togliere peso — Node ha
`WebSocket` di suo, e il protocollo si parla direttamente.

Si misura **due volte**, perché rispondono a due domande diverse:

- **a piena potenza** → "su questo computer siamo a 60?"
- **con la CPU 4× più lenta** → "e su un telefono di fascia media? e se domani qualcosa peggiora,
  me ne accorgo?"

La seconda non è un vezzo. Senza freno la misura **satura**: il browser non disegna oltre ~160 fps,
e una pagina vuota segna gli stessi fps di una pagina piena — verificato, `about:blank` fa 154.
Tutto ciò che costa meno di ~6 ms a fotogramma finisce appiattito sullo stesso numero, e un
peggioramento del 50% resterebbe invisibile. È quindi la passata frenata quella su cui si fa il
confronto nel tempo, ed è l'unica che sappia distinguere.

Ogni pagina si misura più volte e si tiene la **mediana**: una passata sola, su una macchina che
nel frattempo fa altro, racconta il rumore e non il sito. Le misure si accumulano in
`.janitor/bench/`, così il peggioramento lento si vede il giorno stesso e non fra sei mesi.

### Ogni due giorni, da solo

```powershell
powershell -ExecutionPolicy Bypass -File scripts\janitor\pianifica.ps1            # registra
powershell -ExecutionPolicy Bypass -File scripts\janitor\pianifica.ps1 -Ora 09:30 # a un'altra ora
powershell -ExecutionPolicy Bypass -File scripts\janitor\pianifica.ps1 -Stato     # com'è andata
powershell -ExecutionPolicy Bypass -File scripts\janitor\pianifica.ps1 -Rimuovi   # toglilo
```

Compito dell'utente, non di sistema: niente diritti di amministratore, niente password da
conservare. Finestra del browser invisibile, log in `.janitor/log/` (si tengono gli ultimi 20).
Se il computer era spento a quell'ora recupera al primo avvio utile.

I numeri di un'esecuzione automatica **non** sono confrontabili con quelli di `npm run bench`
lanciato a mano: l'Utilità di pianificazione fa girare i compiti a priorità ridotta, e il browser
misura mentre il resto del computer lavora. Il confronto prima/dopo dentro la stessa esecuzione
resta valido — le due misure girano nello stesso turno, nelle stesse condizioni — ed è quello che
decide se la pulizia si tiene.

<details>
<summary><strong>Cinque trappole di Windows</strong> — costate care, tutte con lo stesso sintomo: "sembra che non faccia niente"</summary>

- **`.ps1` senza BOM.** PowerShell 5.1 legge i file senza BOM come ANSI. Il trattino lungo `—`
  (UTF-8 `E2 80 94`) diventa `â€"`, e quell'ultimo carattere è una virgoletta tipografica che
  PowerShell accetta come delimitatore di stringa: le virgolette vanno in disequilibrio e lo
  script muore segnalando una riga che non c'entra niente. I due `.ps1` vanno tenuti **UTF-8 con
  BOM**.
- **`*>&1` con `$ErrorActionPreference = 'Stop'`.** PowerShell incapsula ogni riga di stderr di un
  programma esterno in un `NativeCommandError`, che con `Stop` è un errore *terminante*: il
  compito moriva a metà log pur essendo andato tutto bene. Si redirige a livello di processo, con
  `Start-Process -RedirectStandardOutput`.
- **`Start-Process -Wait` aspetta l'albero, non il processo.** Il benchmark apre un browser: un
  solo processo di Edge rimasto indietro teneva il compito "In esecuzione" a tempo indeterminato,
  con node già uscito e il log completo. Serve `$proc.WaitForExit()`, che guarda solo il processo
  lanciato — e dall'altra parte `taskkill /T` per non lasciare indietro nessuno.
- **Codepage OEM.** L'uscita UTF-8 di node, catturata da PowerShell, veniva decodificata con la
  codepage della console: nel log `già` diventava `gi├á`. Risolta anche questa redirigendo a
  livello di processo. I colori ANSI, poi, in un file sono solo rumore: il programma li mette solo
  se dall'altra parte c'è un terminale vero.
- **`.ExitCode` vuoto senza `.Handle`.** `Start-Process -PassThru` senza `-Wait` restituisce un
  oggetto `Process` che non conserva l'handle nativo: a processo finito `.ExitCode` torna vuoto e
  un fallimento di node passerebbe per riuscito (nel log si leggeva `uscita  ===`). Basta leggere
  `$null = $proc.Handle` **prima** di aspettare. Verificato: senza, `''`; con, `3`.

</details>

Per rimettere a mano quello che è stato messo da parte: `npm run pulizia:ripristina`
(o `npm run pulizia:elenco` per vedere le quarantene).

### Da terminale — `pulizia`

Gli `npm run …` funzionano, ma sono scomodi da scrivere (e le opzioni vanno passate dopo un
`--`). Alla radice del repo c'è `pulizia.cmd`, porta d'ingresso unica:

| | |
| :--- | :--- |
| `pulizia` | guarda e riferisce, non tocca niente |
| `pulizia applica` | pulisce, verifica, e se serve annulla da solo |
| `pulizia bench` | solo benchmark |
| `pulizia prove` | le prove di sicurezza |
| `pulizia elenco` | le quarantene esistenti |
| `pulizia ripristina` | rimette a posto l'ultima quarantena |
| `pulizia pianifica` · `togli` · `stato` | il compito ogni due giorni |

Quello che scrivi in più passa dritto al programma — `pulizia applica --tutto --rami`,
`pulizia bench --veloce --pagine /,/trivia` — e un'opzione da sola vale come analisi, quindi
`pulizia --niente-bench` fa la cosa che ci si aspetta. Il codice di uscita si propaga, così si
può incatenare.

**PowerShell vuole il `.\`** — `.\pulizia applica` — perché di suo non esegue i file della
cartella corrente. Non è un difetto: senza quella regola basterebbe entrare in una cartella
qualsiasi perché un file chiamato come un comando noto venisse eseguito al posto suo. Per
scrivere `pulizia` e basta, da qualunque cartella, una funzione nel profilo (`$PROFILE`):

```powershell
function pulizia { & 'C:\Users\pzkko\Documents\AP\pulizia.cmd' @args }
```

Da `cmd.exe`, invece, `pulizia` funziona già così com'è dalla cartella del repo: il Prompt dei
comandi cerca anche nella directory corrente. E attenzione a non incollare i commenti insieme al
comando: `::` è un commento di cmd, in PowerShell diventa un argomento.

Due dettagli che sembrano pignoleria e non lo sono. Il file **deve** avere fine riga CRLF: con
LF soli, `cmd.exe` legge il file a offset sbagliati, i salti a etichetta atterrano a metà riga e
finisce per eseguire pezzi dei commenti come comandi (`"solo" non è riconosciuto come comando…`).
È bloccato in `.gitattributes`, perché il guaio si manifesta solo dopo un clone. E la codepage si
porta a UTF-8 per la durata del comando e si rimette com'era: a schermo non servirebbe — per una
console vera node converte in UTF-16 e chiama `WriteConsoleW`, quindi gli accenti escono giusti
anche a 850 — ma serve quando l'uscita viene rediretta, `pulizia > rapporto.txt`.

### `/cleaning` — l'officina, in pagina

`npm run dev` → **http://localhost:5173/cleaning**. Le stesse cose del terminale, ma con lo
sporco elencato, i lavori che si guardano mentre succedono, un editor per i file del repo e il
commit lì sotto.

Veste `.sb-` come il resto del sito, non uno stile a parte: stesso guscio (fondale unico fisso,
nav sottile con briciola che prende il bordo solo dopo lo scroll, sezioni trasparenti senza
divisori), stessi `.sb-btn` e `.sb-panel`, classi proprie col prefisso di pagina `.sb-cl-*`, e
**palette neutra più il solo azzurro del marchio** — niente rosso per gli errori né arancio per gli
avvisi: si distinguono per peso e bordo. Tema scuro nativo, perché i colori vengono tutti da
`var(--sb-*)` e `html.dark .sb-home` ridichiara gli stessi token.

- **Sporco trovato** — cinque pastiglie per il colpo d'occhio (un numero, o una spunta), e sotto
  si aprono solo le categorie che hanno qualcosa da dire. Le voci che la pulizia di default *non*
  porta via (le rifà solo il `prebuild`) sono in grigio e dichiarate: `resta, salvo --tutto`.
- **Lavori** — «Pulisci e verifica», «Benchmark», «Prove», «Solo analisi». Il log arriva
  **mentre succede**, riga per riga, via Server-Sent Events: la pulizia completa ci mette
  qualche minuto e guardarla lavorare è meglio che fissare uno spinner. Chiudere la scheda
  ferma il processo. La prima riga della consolle è il **comando vero** che il bottone sta
  lanciando (`$ node ./scripts/janitor/pulisci.mjs --applica …`): un bottone che nasconde cosa
  esegue è un bottone di cui bisogna fidarsi, uno che lo dichiara si può controllare.
- **Prima e dopo** — il rendiconto dell'ultimo lavoro, comunque sia stato avviato (anche dal
  terminale: lo legge da `.janitor/ultimo.json`). Lo spazio prima → dopo riga per riga, i
  fotogrammi entro i 16.7 ms prima → dopo pagina per pagina, e **l'elenco di ciò che è
  sparito, uno per uno col suo peso** — perché «liberati 14.4 MB» è una promessa, mentre
  l'elenco è un rendiconto. Se i due numeri sembrano darsi torto (roba eliminata ma spazio
  invariato) la pagina lo dice invece di lasciarlo indovinare: succede quando quella roba
  all'inizio non c'era ed è stata la build di verifica a ricrearla.
- **File** — filtra, apri, modifica, `Ctrl+S`. Un file con modifiche non salvate si dichiara, e
  chiedere di chiudere la scheda costa una domanda.
- **Commit** — i file cambiati con le spunte, il messaggio, commit e push.

**Non esiste in produzione, e non per una svista evitata.** Gli endpoint stanno in un plugin che
vive dentro `configureServer`, l'aggancio che gira solo con `vite dev`: in `vite build` non viene
nemmeno chiamato. La rotta è dietro `import.meta.env.DEV`, che rollup risolve a `false` e porta
via insieme all'`import()`. Verificato sul build vero: nessun chunk, nessuna stringa
`api/cleaning`, nessuna classe `.cl-` nei CSS, nessun testo della pagina. L'unica occorrenza di
`cleaning` in `dist/` sta in `repo-tree.json`, che elenca `src/app/cleaning/Cleaning.tsx` fra i
file del repository — è l'albero dei sorgenti che `/archivio` mostra apposta, cioè metadato che
dice «questo file esiste», non codice che gira.

La seconda difesa è sui percorsi: tutto quello che arriva dal browser passa da `dentroIlRepo()`,
che risolve e pretende che il risultato stia sotto la radice del repo. Senza, un
`?p=../../../../Windows/...` sarebbe bastato. `.git`, `node_modules` e i `.env` restano fuori
comunque, e si scrivono solo file di testo — un PDF riscritto come stringa UTF-8 sarebbe corrotto
in silenzio. Provato: traversal `400`, `.git` `400`, `.env` `400`, PDF `415`, e nessun file
comparso fuori dal repo.

Un dettaglio pratico: salvare `vite.config.ts` o qualcosa che lui importa fa **riavviare** il dev
server, quindi la pagina si ricarica e un lavoro in corso si interrompe. È Vite che fa il suo
mestiere, non un guasto.

### Che le prove le faccia il programma stesso

`npm run pulizia:prove` pianta file veri nel repo, guarda cosa decide l'analisi e rimette tutto
com'era. **Otto prove**, non simmetriche di proposito: tre controllano che lo sporco venga
**trovato**, quattro che il pulito **non** venga toccato, una che quel che è stato messo da parte
torni indietro byte per byte — un falso negativo costa qualche kB, un falso positivo rompe una
pagina.

I nomi dei file piantati sono casuali, e non è un vezzo: scritti per esteso nel file di test
passavano per il motivo sbagliato. L'analisi cerca il nome di un file in tutto il testo del repo,
e il file di test fa parte del repo — bastava nominarlo perché venisse dichiarato "citato da
qualche parte", quindi vivo. La prova sull'orfano falliva e quelle sulla protezione passavano
senza aver verificato niente.

**Nessun file esistente viene mai toccato.** La prova che un modulo *importato* non venga
scambiato per orfano infilava l'import in cima a `src/main.tsx` e lo toglieva alla fine. Regge
finché il processo muore con grazia — e su Windows non muore con grazia: `SIGTERM` non è un vero
segnale, il processo viene terminato e `finally` non gira. Siccome `/cleaning` lancia queste
prove come processo figlio e lo ammazza se chiudi la scheda, è successo davvero: in `main.tsx`
sono rimasti due import verso file appena cancellati, e l'app non partiva. Ora la catena
radice → modulo si costruisce con **due file piantati** (uno in `scripts/`, che è già una radice
del grafo), tutto usa e getta. In più: il marchio `__prova-janitor-` nel nome è in `.gitignore`,
così un residuo non può finire in un commit, ogni corsa spazza quelli lasciati dalle precedenti,
e se un repo si trascina ancora il danno vecchio in `main.tsx` viene riparato da solo.

---

## ♿ Accessibilità & 🚀 Deploy

**A11y:** skiplink al contenuto · landmark semantici (`main`/`nav[aria-label]`/`header`/`footer`) ·
`aria-labelledby` sui modali · focus visibile (`:focus-visible` con outline azzurro brand) ·
contrasto AA verificato nella finestra Palette · **`prefers-reduced-motion` onorato in tutta la
regia GSAP** · ControlBar raggiungibile da tastiera (esce al `focus`) ·
`Backspace` neutralizzato fuori dai campi testo (`disableBackspaceNavigation`).

**Deploy:** SPA statica → **Vercel** (`buildCommand: npm run build`, output `dist/`, branch `main`
= produzione), con funzioni serverless in `api/`, redirect `www → sottodominio`, rewrite di
`/d/:id` e un **cron** giornaliero alle 03:00 per la pulizia dei link.

---

## 🎨 Palette

Azzurro brand identico nei due temi, grigi puri intorno. L'arancio Ubuntu resta solo nelle email.
Tutto il sistema colore è documentato e copiabile dal sito (footer → **«Palette»**).

![#00B0FA](https://img.shields.io/badge/Brand-hsl(197_100%25_49%25)-00B0FA?style=flat-square)
![#fcfcfc](https://img.shields.io/badge/Fondo_chiaro-%23FCFCFC-FCFCFC?style=flat-square&labelColor=555)
![#141414](https://img.shields.io/badge/Fondo_scuro-%23141414-141414?style=flat-square)
![#171717](https://img.shields.io/badge/Inchiostro-%23171717-171717?style=flat-square)
![#e95420](https://img.shields.io/badge/Ubuntu_email-%23E95420-E95420?style=flat-square)

Carattere del sito: **Titillium Web** (+ Roboto Mono; Lora solo per `/festa`).

---

## 📄 Licenza

Codice sotto licenza **MIT** — liberamente riutilizzabile. Testi, foto personali, CV e brand
«Alberto Pecchini» sono **© Alberto Pecchini**, non riproducibili senza autorizzazione.

## 📬 Contatti

[![Email](https://img.shields.io/badge/Email-pzkko@yahoo.com-D14836?style=flat-square&logo=maildotru&logoColor=white)](mailto:pzkko@yahoo.com)
[![GitHub](https://img.shields.io/badge/GitHub-@albertoxpecchini-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/albertoxpecchini)
[![Instagram](https://img.shields.io/badge/Instagram-@albertoxpecchini-E4405F?style=flat-square&logo=instagram&logoColor=white)](https://www.instagram.com/albertoxpecchini)

<div align="center"><sub>Costruito con ❤️ a Mantova · <code>una pagina = un sottodominio</code></sub></div>
