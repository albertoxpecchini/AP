# albertopecchini.it

Portfolio di Alberto Pecchini — diplomato geometra, web designer, graphic designer. Rivalta sul Mincio (MN).

Sito **statico, senza framework**: le pagine HTML sono generate in fase di build da dati e template scritti in JavaScript; nel browser gira solo il JavaScript scritto a mano per le interazioni. Nessun cookie di tracciamento, nessuna dipendenza a runtime, font ospitati localmente.

Online su <https://www.albertopecchini.it> (albertopecchini.it rimanda a www).

## Indice

- [Avvio rapido](#avvio-rapido)
- [Com’è fatto](#comè-fatto)
- [Struttura delle cartelle](#struttura-delle-cartelle)
- [Pagine generate](#pagine-generate)
- [Dove si mettono le mani](#dove-si-mettono-le-mani)
- [Progetti](#progetti)
- [Immagini](#immagini)
- [Modulo contatti](#modulo-contatti)
- [Dati personali e titolo professionale](#dati-personali-e-titolo-professionale)
- [Stili](#stili)
- [JavaScript del browser](#javascript-del-browser)
- [Build](#build)
- [Prima di andare online](#prima-di-andare-online)
- [Pubblicazione](#pubblicazione)
- [Convenzioni](#convenzioni)

## Avvio rapido

Richiede **Node 20.19 o superiore** (in produzione gira su Node 24) e npm.

```bash
npm install
npm run dev       # sviluppo su http://localhost:5173 (se la porta è occupata Vite ne sceglie un’altra)
npm run build     # genera dist/: pagine, sitemap.xml, robots.txt, 404.html, miniature
npm run preview   # serve dist/ in locale, come farebbe l’hosting
```

In sviluppo la pagina si ricarica da sola quando cambiano dati, template o tavole. Da VS Code, **F5** avvia il server di sviluppo e apre Edge sul sito (configurazione in `.vscode/` alla radice del repository).

## Com’è fatto

```
src/data/*.js  ──►  src/templates/*.js  ──►  HTML
 (contenuti)         (funzioni che             │
                      restituiscono            ├─ dev:   reso al volo dal plugin a ogni richiesta
                      stringhe HTML)           └─ build: scritto in dist/<rotta>/index.html
```

- **`plugins/site-pages.js`** è un plugin Vite. In sviluppo intercetta le richieste HTML, carica `src/templates/routes.js` con `ssrLoadModule` e rende la pagina; in build, dopo il bundle di JS e CSS, scrive ogni rotta in `dist/`, aggiunge `404.html`, `sitemap.xml`, `robots.txt` e le miniature SVG, poi elimina il manifest di Vite.
- **I template** sono moduli ESM puri: nessun import di CSS o immagini, così girano identici in Node e nel dev server. `src/templates/html.js` fornisce il tag `html` (appiattisce gli array e scarta `false` e `null`), `esc` per l’escape e `attrs` per gli attributi.
- **Vite** si occupa solo di `src/main.js` (JavaScript) e `src/style.css` (CSS e font): i file finiscono in `dist/assets/` con hash nel nome e il layout li collega leggendo il manifest. Il font principale viene precaricato per evitare il flash sui titoli.
- **Le immagini segnaposto** non sono file: sono disegni SVG generati in build da `src/art/` (piante, prospetti, nuvole di punti, marchi, manifesti…). Si sostituiscono con fotografie reali cambiando una riga nei dati.
- **Progressive enhancement**: ogni pagina è completa senza JavaScript. I moduli client si attivano solo se trovano i propri elementi e rispettano `prefers-reduced-motion`.

## Struttura delle cartelle

```
albertopecchini.it/
├─ plugins/
│  └─ site-pages.js        plugin Vite: rende le pagine in dev, le scrive in build
├─ public/                 servito così com’è alla radice del sito
│  ├─ favicon.svg · favicon-32.png · apple-touch-icon.png · icon-512.png · site.webmanifest
│  ├─ og.png               immagine per le anteprime social (1200×630)
│  ├─ icons.svg            sprite delle icone
│  └─ media/
│     ├─ studio/           fotografie dello studio (ritratto.webp)
│     └─ web/              screenshot dei progetti web (<prefisso>-desktop.webp, -tablet, -mobile, -*-tall)
├─ src/
│  ├─ data/                CONTENUTI: l’unica cosa da toccare per aggiornare il sito
│  │  ├─ site.js           identità, contatti, dati legali, social, navigazione, CTA, numeri, segnaposto
│  │  ├─ projects.js       portfolio: categorie, aree e l’array dei progetti
│  │  ├─ services.js       tre aree di servizi, pacchetti, FAQ
│  │  ├─ method.js         le sette fasi del metodo
│  │  └─ studio.js         biografia, fotografie, fatti, timeline, approccio, valori, strumenti, curriculum
│  ├─ templates/
│  │  ├─ routes.js         tabella delle rotte (percorso, title, description, dati strutturati) + sitemap, robots, miniature
│  │  ├─ layout.js         <html> completo: head, header, footer, JSON-LD, firma
│  │  ├─ html.js           tag `html`, `esc`, `attrs`, `cx`, `pad`, `jsonLd`
│  │  ├─ components/
│  │  │  ├─ ui.js          icone, monogramma, bottoni, intestazioni di sezione, media, mockup, schede dati
│  │  │  └─ project.js     card, riga d’indice, copertina e anteprima di un progetto
│  │  └─ pages/            una funzione per pagina: home, portfolio, case-study, info (servizi, metodo, studio, profilo), contact, legal (privacy, cookie, 404)
│  ├─ art/                 generatori SVG delle tavole segnaposto
│  │  ├─ index.js          registro: renderArt({ art, variant, tone, … })
│  │  ├─ kit.js            primitive di disegno (squadratura, quote, tratteggi, testi)
│  │  └─ floorplan · building · survey · axon · brand · web · misc
│  ├─ client/              JavaScript del browser, un modulo per ambito
│  │  ├─ chrome.js         header, sottomenu, orologio, menu mobile, avanzamento, transizioni
│  │  ├─ motion.js         reveal, contatori, parallasse, cursore, elementi magnetici, anteprime
│  │  ├─ sections.js       hero, scorrimento orizzontale, timeline del metodo, indice laterale
│  │  ├─ filters.js        filtri del portfolio (stato nell’URL)
│  │  ├─ widgets.js        lightbox, confronto prima/dopo, copia negli appunti
│  │  ├─ form.js           validazione e invio del modulo contatti
│  │  └─ utils.js          selettori, scroll, focus trap, reduced motion
│  ├─ styles/              token → base → componenti → layout → pagine → stampa
│  ├─ main.js              entry JavaScript: avvia i moduli client
│  └─ style.css            entry CSS: importa src/styles/* nell’ordine giusto
├─ vite.config.js
├─ vercel.json             URL puliti, cache, intestazioni di sicurezza
└─ package.json
```

## Pagine generate

| Percorso | Pagina |
| --- | --- |
| `/` | Home: hero con i tre ruoli, progetti in evidenza, servizi, studio, numeri |
| `/portfolio/` | Indice completo con filtri (categoria, anno, settore, tecnologia, tipologia) |
| `/portfolio/tecnico/` · `/portfolio/web/` · `/portfolio/grafica/` | Le tre aree |
| `/portfolio/<slug>/` | Case study in nove sezioni, uno per ogni progetto in `projects.js` |
| `/servizi/` | Servizi per area, con ciò che viene consegnato; pacchetti e FAQ |
| `/metodo/` | Le sette fasi del lavoro |
| `/studio/` | Chi sono: biografia, ritratto, timeline, approccio, valori, strumenti |
| `/studio/profilo/` | Curriculum sintetico, stampabile |
| `/contatti/` | Modulo di contatto, recapiti, area operativa |
| `/privacy/` · `/cookie/` | Note legali |
| `404.html` | Pagina non trovata (servita in automatico da Vercel) |

Le rotte sono definite in `src/templates/routes.js`: ogni voce ha percorso, `title`, `description`, funzione di rendering e dati strutturati (schema.org: `WebSite`, `Person`, `Service`, `BreadcrumbList`, `CreativeWork` per i case study). Sitemap e robots derivano dalla stessa tabella.

## Dove si mettono le mani

| Voglio… | Apro… |
| --- | --- |
| cambiare nome, titolo, contatti, social, disponibilità, dati legali | `src/data/site.js` |
| cambiare titolo e invito del footer (`closing`), riga sotto il nome (`tagline`) | `src/data/site.js` |
| cambiare i numeri della sezione statistiche | `src/data/site.js → stats` |
| aggiungere, togliere o modificare un progetto | `src/data/projects.js` |
| modificare i servizi, i pacchetti, le FAQ | `src/data/services.js` |
| modificare le sette fasi del metodo | `src/data/method.js` |
| modificare biografia, fotografie, timeline, valori, curriculum | `src/data/studio.js` |
| cambiare title e description di una pagina | `src/templates/routes.js` |
| cambiare colori, caratteri, spazi, raggi, tempi delle animazioni | `src/styles/tokens.css` |
| rivedere privacy e cookie policy | `src/templates/pages/legal.js` |
| cambiare la struttura di una pagina | `src/templates/pages/*.js` |
| cambiare header, footer, `<head>` | `src/templates/layout.js` |

## Progetti

In `src/data/projects.js` copiare un oggetto dell’array `projects`, cambiare `slug` (diventa l’indirizzo `/portfolio/<slug>/`) e i contenuti. Card, filtri, pagina d’area, case study, sitemap e dati strutturati si aggiornano da soli.

Campi principali:

- `area`: `tecnico` | `web` | `grafica`, decide in quale pagina d’area compare.
- `categories`: una o più tra `tecnico`, `web`, `grafica`, `branding`, `3d`, `cad`, `altro`; sono i filtri principali.
- `types`, `technologies`, `sector`, `year` alimentano gli altri filtri.
- `client`, `location`, `services`, `code` compaiono nella scheda dati.
- `summary` (card e meta description), `description`, `goal`, `problem`, `strategy`, `process`, `result`, `metrics`, `learned`: le sezioni del case study.
- `cover` e `images`: copertina e galleria (vedi [Immagini](#immagini)).
- `web`: per i progetti web, gli screenshot dei mockup e il dominio (`url`).
- `featured: true` porta il progetto nello scorrimento orizzontale della home.
- `sample: true` lo contrassegna come **dimostrativo** (◇): mostra come si presenta un lavoro di quel tipo e va sostituito con un lavoro reale o rimosso.

Progetti reali oggi nel portfolio: rivaltasulmincio.it, cascinafontana.xyz, dariodonelli (sul dominio Vercel finché dariodonelli.it non è attivo), il sito stesso e il PCTO in Caem Group. Gli altri sono dimostrativi.

## Immagini

### Tavole generate (segnaposto)

Ogni voce di `images` può essere una **tavola generata**, un disegno vettoriale prodotto in build da `src/art/`:

```js
{ art: 'floorplan', variant: 'rustico', code: 'AP-25-011', alt: '…', caption: 'TAV. 02 — …' }
```

Tavole disponibili: `floorplan`, `elevation`, `section`, `pointcloud`, `ortho`, `cadastral`, `urban`, `sitelayout`, `canopy`, `bim`, `render`, `workspace`, `portrait`, `areamap`, `webpage`, `brandmark`, `restyle`, `stationery`, `poster`, `social`, `brochure`, `packaging`, `signage`, `icons`, `slides`, `titleblock`. Opzioni comuni: `variant`, `tone` (`paper` | `ink` | `tint`), `bare` (senza squadratura), `code`.

Le copertine generate vengono esportate anche come file `dist/art/<slug>.svg`, usati dalle anteprime al passaggio del puntatore.

### File reali

Per sostituire una tavola basta cambiare la voce; il file va in `public/`:

```js
{ src: '/media/progetti/annesso-rustico/01.webp', width: 1600, height: 1200, alt: '…', caption: '…' }
```

`width` e `height` servono a riservare lo spazio ed evitare salti di layout. Formato consigliato: WebP, lato lungo 1600–2000 px, senza metadati (una fotografia scattata con il telefono contiene le coordinate GPS).

Con ffmpeg, disponibile sulla macchina di sviluppo:

```bash
ffmpeg -i originale.jpg -map_metadata -1 -vf "scale=1600:-1:flags=lanczos" -c:v libwebp -quality 82 -compression_level 6 -preset photo public/media/progetti/<slug>/01.webp
```

### Ritratto

`public/media/studio/ritratto.webp` (1400×1750, rapporto 4:5, senza metadati) è ricavato da una fotografia del 2024 in formato DNG. Su Windows il DNG si decodifica con il codec **Raw Image Extension** di Microsoft (PowerShell, `System.Windows.Media.Imaging.BitmapDecoder`; il codec non applica l’orientamento EXIF, quindi la rotazione va fatta a parte), poi si ritaglia e si converte con ffmpeg. La fotografia dello studio (`photos.studio`) è ancora una tavola segnaposto.

### Screenshot dei progetti web

I mockup usano cinque immagini per progetto in `public/media/web/`, catturate con Edge headless e convertite in WebP:

| Chiave | Viewport | File |
| --- | --- | --- |
| `web.desktop` | 1440×900 | 1200×750 |
| `web.desktopTall` | pagina intera, tagliata a 3400 px | 1200×2833 |
| `web.tablet` | 820×1180 | 720×1036 |
| `web.mobile` | 390×844 @2x | 600×1298 |
| `web.mobileTall` | pagina intera, tagliata a 2600 px | 600×4000 |

Le versioni `Tall` scorrono al passaggio del puntatore; le loro altezze vanno riportate in `projects.js`. Prima dello scatto: animazioni disattivate, elementi `.reveal` visibili, immagini caricate (`loading=eager`), `prefers-reduced-motion` emulato per le pagine con hero a scorrimento.

## Modulo contatti

Con `site.form.endpoint` vuoto il modulo, dopo la validazione, compone una email nel programma di posta del visitatore. Indicando un endpoint (Formspree, Web3Forms, una propria API…) i dati partono in `POST` come JSON; una risposta 2xx mostra lo stato di successo, qualsiasi altra lo stato di errore. Tipi di progetto e fasce di budget si cambiano in `site.form`.

## Dati personali e titolo professionale

Scelte fatte apposta, da non cambiare senza motivo:

- Il titolo è **«Diplomato geometra»**: «Geometra» e «Perito geometra» sono titoli riservati agli iscritti all’albo.
- `site.legal.piva` e `site.legal.albo` sono `null`: i template nascondono da soli i blocchi che li mostrerebbero e al loro posto compare `site.legal.note`.
- In footer e contatti si pubblica solo il comune. L’indirizzo completo (`site.location.address`) compare unicamente nella privacy policy, dove il titolare del trattamento va identificato per legge. Non va nei dati strutturati.
- Le fotografie pubblicate sono prive di metadati EXIF.

## Stili

`src/style.css` importa i fogli in quest’ordine: `fonts` → `tokens` → `base` → `art` → `components` → `layout` → `home` → `portfolio` → `pages` → `print`.

- **Token** (`tokens.css`): palette carta / inchiostro / minio (`#E5481F`), scala tipografica, spazi, raggi, durate ed easing. È il primo file da aprire per cambiare l’aspetto.
- **Caratteri**: Archivo Variable (asse `wdth`) per i testi, IBM Plex Mono per etichette e dati, Instrument Serif per gli accenti in corsivo. Ospitati localmente via `@fontsource`, nessuna richiesta a Google Fonts.
- **Reveal** (`base.css`): `data-reveal` con i tipi `fade`, `up`, `clip`, `line`, `draw`; tutto disattivato con `prefers-reduced-motion`.
- **Footer** (`layout.css`): composizione unica, palette scoperta su `footer.site-footer`, firma con monogramma a tratto sottile.
- **Stampa** (`print.css`): la pagina `/studio/profilo/` è pensata per essere stampata come curriculum.

## JavaScript del browser

`src/main.js` avvia in sequenza i moduli di `src/client/`; ognuno cerca i propri elementi e, se non li trova, non fa nulla. Un modulo che fallisce non ferma gli altri (l’errore finisce in console con il prefisso `[site]`). Non ci sono dipendenze: niente librerie di animazione, niente polyfill.

Quel che fa: header che si nasconde scendendo, menu mobile con focus trap, orologio, barra di avanzamento, transizioni tra pagine, reveal allo scorrimento, contatori, parallasse, cursore personalizzato (solo con puntatore fine), elementi magnetici, anteprime flottanti e scorrevoli, filtri del portfolio con stato nell’URL, lightbox, confronto prima/dopo, copia negli appunti, modulo contatti.

## Build

`npm run build` produce in `dist/`:

```
dist/
├─ index.html · portfolio/index.html · portfolio/<slug>/index.html · …   una cartella per rotta
├─ 404.html
├─ sitemap.xml · robots.txt
├─ assets/          JS, CSS e font con hash nel nome (cache lunga)
├─ art/<slug>.svg   miniature delle copertine generate
└─ favicon, og.png, media/…   copiati da public/
```

In console la build riporta il numero di pagine e miniature scritte e, se ce ne sono, i **dati ancora segnaposto** dichiarati in fondo a `src/data/site.js` (`placeholders`). Compilato il dato, togliere la voce dalla lista.

## Prima di andare online

- [ ] Compilare i segnaposto elencati dalla build: profilo LinkedIn, numero di clienti, fotografia dello studio.
- [ ] Sostituire o rimuovere i progetti con `sample: true`; quando non ce ne sono più, portare `site.showSampleNotice` a `false`.
- [ ] Rileggere privacy e cookie policy (`src/templates/pages/legal.js`) e aggiornare `site.legal.updated`. Se si aggiungono strumenti di analisi o servizi di terze parti, la cookie policy va aggiornata.
- [ ] Decidere l’invio del modulo contatti (`site.form.endpoint`).
- [ ] Sistemare il DNS di albertopecchini.it: il dominio senza www ha ancora un record A verso il vecchio hosting Aruba (62.149.128.40) accanto a quello di Vercel (216.198.79.1). Deve restare solo quello di Vercel, altrimenti chi digita l’indirizzo senza www ottiene a caso il sito o un errore di connessione.
- [ ] Controllare `public/og.png` e il manifest (`public/site.webmanifest`).

## Pubblicazione

`dist/` è un sito statico e funziona su qualsiasi hosting. Il progetto Vercel `albertopecchini.it` è collegato a questo repository GitHub (`albertoxpecchini/AP`) con **Root Directory** = `albertopecchini.it`, framework Vite, Node 24: ogni push su `main` produce un deploy di produzione, gli altri rami un’anteprima.

Domini di produzione: `www.albertopecchini.it` e `albertopecchini.it` (che rimanda a www con un 308). Gli indirizzi `*.vercel.app` del progetto sono protetti da Vercel Authentication (accesso solo con login Vercel), i domini personalizzati no.

`vercel.json` imposta URL puliti con barra finale (come i percorsi generati), cache di un anno sugli asset con hash, cache di trenta giorni su `media/` e `art/`, e le intestazioni `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`. `404.html` viene servita in automatico.

## Convenzioni

- Contenuti in `src/data`, struttura in `src/templates`, aspetto in `src/styles`: niente testo nei template che non venga dai dati, salvo le etichette di interfaccia.
- Nessun framework a runtime e nessuna dipendenza client: se serve un comportamento, si scrive in `src/client/`.
- Messaggi di commit in italiano, con prefisso (`feat`, `fix`, `docs`, `chore`) e ambito tra parentesi.
- Il codice usa fine riga LF; Git su Windows avvisa della conversione CRLF, l’avviso è innocuo.

© Alberto Pecchini. Contenuti, fotografie e tavole non sono riutilizzabili senza permesso.
