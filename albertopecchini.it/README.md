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
- [Generatore di email](#generatore-di-email)
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
├─ api/
│  └─ contatti.js          funzione serverless del modulo contatti (Resend + CallMeBot)
├─ tools/
│  ├─ email-generator/     generatore di email HTML (vedi il suo README)
│  └─ tavole/              conversione DWG e PDF → SVG per il visualizzatore (vedi il suo README)
├─ emails/                 input, output e allegati delle email generate
├─ config/                 account mittente e tema email derivato dal CSS
├─ profiles/               archivio firme versionato
├─ public/                 servito così com’è alla radice del sito
│  ├─ favicon.svg · favicon-32.png · apple-touch-icon.png · icon-512.png · site.webmanifest
│  ├─ og.png               immagine per le anteprime social (1200×630)
│  ├─ icons.svg            sprite delle icone
│  └─ media/
│     ├─ mockup/           cornici dei dispositivi dal file Figma (MacBook, iPad, iPhone)
│     ├─ studio/           fotografie dello studio (ritratto.webp)
│     ├─ tavole/           le tavole vere, una cartella per progetto: NN.svg, NN.webp, NN-mini.webp, NN.pdf, copertina.webp
│     └─ web/              screenshot dei progetti web (<prefisso>-desktop.webp, -tablet, -mobile, -*-tall)
├─ src/
│  ├─ data/                CONTENUTI: l’unica cosa da toccare per aggiornare il sito
│  │  ├─ site.js           identità, contatti, dati legali, social, navigazione, CTA, numeri, segnaposto
│  │  ├─ projects.js       portfolio: categorie, aree, progetti e i due interruttori di pubblicazione
│  │  ├─ services.js       tre aree di servizi, pacchetti, FAQ
│  │  ├─ method.js         le sette fasi del metodo
│  │  ├─ studio.js         biografia, fotografie, fatti, timeline, approccio, valori, strumenti, curriculum
│  │  └─ stile.js          sistema visivo: tavole, palette, ruoli, caratteri, scala, spazi, raggi, movimento
│  ├─ templates/
│  │  ├─ routes.js         tabella delle rotte (percorso, title, description, dati strutturati) + sitemap, robots, miniature
│  │  ├─ layout.js         <html> completo: head, header, footer, JSON-LD, firma
│  │  ├─ html.js           tag `html`, `esc`, `attrs`, `cx`, `pad`, `jsonLd`
│  │  ├─ components/
│  │  │  ├─ ui.js          icone, monogramma, bottoni, intestazioni di sezione, media, mockup, schede dati
│  │  │  ├─ project.js     card, riga d’indice, copertina e anteprima di un progetto
│  │  │  └─ viewer.js      visualizzatore delle tavole (case study e pagina Tavole)
│  │  └─ pages/            una funzione per pagina: home, portfolio, case-study, info (servizi, metodo, studio, profilo), contact, legal (privacy, cookie, 404), stile (sistema visivo), tavole (visualizzatore)
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
│  │  ├─ canvas.js         piano della pagina Stile: zoom, spostamento, tavole inquadrate e animate, griglia in WebGL
│  │  ├─ viewer.js         visualizzatore delle tavole: zoom vettoriale, spostamento, gesti, tastiera, schermo intero
│  │  └─ utils.js          selettori, scroll, focus trap, reduced motion
│  ├─ styles/              token → base → componenti → layout → pagine → stile → stampa
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
| `/portfolio/tecnico/` · `/portfolio/web/` | Le aree pubblicate (Grafica è nascosta, vedi [Progetti](#progetti)) |
| `/portfolio/<slug>/` | Case study in nove sezioni, uno per ogni progetto in `projects.js` |
| `/servizi/` | Servizi per area, con ciò che viene consegnato; pacchetti e FAQ |
| `/metodo/` | Le sette fasi del lavoro |
| `/studio/` | Chi sono: biografia, ritratto, timeline, approccio, valori, strumenti |
| `/studio/profilo/` | Curriculum sintetico, stampabile |
| `/contatti/` | Modulo di contatto, recapiti, area operativa |
| `/portfolio/tavole/` | Il visualizzatore di tutte le tavole vere, raggruppate per progetto; `#<slug>-<NN>` apre una tavola precisa |
| `/stile/` | Il sistema visivo in cinque tavole (home a 1440 px, colore, tipografia, forma e movimento, componenti) su un piano con zoom e spostamento, come in un programma di disegno |
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
| aggiungere una tavola al visualizzatore | i file in `public/media/tavole/<slug>/` (vedi `tools/tavole/`), poi `sheets` in `src/data/projects.js` |
| pubblicare (o rinascondere) i progetti dimostrativi | `src/data/projects.js → showSamples` |
| rimettere online un’area del portfolio | `src/data/projects.js → allAreas` (togliere `hidden`) |
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
- `sheets`: le tavole vere (DWG, PDF, relazioni) da sfogliare nel visualizzatore. Se ci sono, nel case study la galleria diventa la sezione **Tavole** e il progetto compare in `/portfolio/tavole/`. Vedi [Tavole vere](#tavole-vere).
- `featured: true` porta il progetto nello scorrimento orizzontale della home.
- `sample: true` lo contrassegna come **dimostrativo**: mostra come si presenta un lavoro di quel tipo, ma oggi non viene pubblicato (vedi sotto).

### Progetti dimostrativi

Il file contiene 24 progetti, ma **online ne vanno solo 9**: quelli reali. Gli altri
sono modelli scritti per mostrare come si presenta un lavoro di quel tipo, e restano
nel file come traccia da riempire.

A decidere è un interruttore solo, in cima ai selettori di `src/data/projects.js`:

```js
export const showSamples = false   // true = pubblica anche i dimostrativi, col rombo ◇
```

`projects` è la vista filtrata che usa tutto il sito (pagine, filtri, sitemap, numeri);
`allProjects` resta l’array completo. Per promuovere un dimostrativo a lavoro vero basta
sostituirne i contenuti e togliergli `sample: true`: compare da solo.

I nove reali: il PCTO in Caem Group, i quattro lavori di quinta con le tavole vere
(progetto stradale, bar-caffetteria del tema d’esame, layout di cantiere, relazione
sul Museo dei Mestieri del Fiume), rivaltasulmincio.it, cascinafontana.xyz,
dariodonelli (sul dominio Vercel finché dariodonelli.it non è attivo) e questo sito.

### Aree nascoste

Senza i dimostrativi l’area **Grafica** resterebbe a zero progetti, così è nascosta —
la pagina non viene generata e l’area sparisce da menù, indici, sitemap e rimandi:

```js
grafica: { label: 'Progetti grafici', …, hidden: true }   // src/data/projects.js → allAreas
```

Togliendo `hidden` torna tutto, a patto che l’area abbia almeno un progetto pubblicato.
`areas` sono le aree pubblicate, `allAreas` tutte quante: le briciole di navigazione dei
singoli progetti leggono `allAreas`, così un case study funziona anche se la sua area è
nascosta. La grafica resta comunque fra le tre discipline in home e fra i servizi: la
scheda rimanda a `/servizi/#grafica` invece che al portfolio.

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

### Tavole vere

I disegni dei lavori tecnici non sono tavole generate: sono i file veri, esportati dal
DWG o dal PDF di AutoCAD in SVG vettoriale, così nel visualizzatore si ingrandiscono
fino ai dettagli senza sgranare. Ogni tavola ha quattro file in
`public/media/tavole/<slug>/` — `NN.svg`, la miniatura `NN.webp` (1200 px),
`NN-mini.webp` (320 px) per l’elenco e `NN.pdf` da scaricare — e si dichiara in
`sheets` con l’aiuto `sheet(slug, 'NN', { title, alt, note, h, scale, from })`.
Le pagine di una relazione sono immagini: `full` indica la versione grande (1600 px).

Il visualizzatore (`src/templates/components/viewer.js` e `src/client/viewer.js`)
muove il foglio con `transform` durante i gesti e, a vista ferma, gli dà la misura vera
perché il browser ridisegni l’SVG nitido a quella scala. Trascinare sposta, Ctrl +
rotella o due dita ingrandiscono, il doppio clic avvicina, le frecce cambiano tavola,
F adatta; c’è lo schermo intero. Nei case study la rotella e il dito scorrono la
pagina finché la tavola non è ingrandita.

Come si convertono i file, e cosa si controlla prima di pubblicarli (indirizzi, nomi,
volti), è spiegato in [`tools/tavole/README.md`](tools/tavole/README.md).

### Ritratto

`public/media/studio/ritratto.webp` (1400×1750, rapporto 4:5, senza metadati) è ricavato da una fotografia del 2024 in formato DNG. Su Windows il DNG si decodifica con il codec **Raw Image Extension** di Microsoft (PowerShell, `System.Windows.Media.Imaging.BitmapDecoder`; il codec non applica l’orientamento EXIF, quindi la rotazione va fatta a parte), poi si ritaglia e si converte con ffmpeg. È l’unica fotografia del sito: la pagina Studio
mostra il ritratto e basta. Per aggiungere una fotografia dello studio serve rimettere sia
la voce in `photos` sia la fascia a tutta larghezza in `src/templates/pages/info.js`.

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

I mockup usano le cornici del file Figma [Device Mockups (iMac, Macbook, iPad, iPhone)](https://www.figma.com/design/7c1VwTtOkwA0GmVSf23dFg/Device-Mockups--iMac--Macbook--iPad--iPhone---Community-) (Figma Community): `deviceMockup(kind, …)` in `ui.js` le usa in copertine, hero, home e scene dei progetti.

| `kind` | Dispositivo | Screenshot | File in `public/media/mockup/` |
| --- | --- | --- | --- |
| `laptop` | MacBook Pro | `web.desktop` / `desktopTall` | `macbook-pro.webp` (1244×736) |
| `tablet` | iPad Pro 12,9″ | `web.tablet` | `ipad-pro.webp` (906×1180) |
| `phone` | iPhone 14 Pro | `web.mobile` / `mobileTall` | `iphone-14-pro.webp` (720×1466) + isola e fotocamera in PNG |

Le immagini vengono dai livelli del file, con il bordo trasparente ritagliato e convertite in WebP; nell’iPad lo schermo (sempre coperto dallo screenshot) è riempito di nero per alleggerire il file. Lo schermo è un riquadro sopra l’immagine con le quote del livello «Paste image here», in percentuale in `components.css`: se si cambia un’immagine vanno ricalcolate. Lo screenshot riempie lo schermo dall’alto (`object-fit: cover`); sull’iPhone l’isola dinamica sta sopra lo screenshot, come nel file. L’iMac e l’Apple Watch del file non si usano: lo schermo dell’iMac è 16:9 e taglierebbe gli screenshot 16:10.

## Modulo contatti

Con `site.form.endpoint` vuoto il modulo, dopo la validazione, compone una email nel programma di posta del visitatore. Indicando un endpoint i dati partono in `POST` come JSON; una risposta 2xx mostra lo stato di successo, qualsiasi altra lo stato di errore. Tipi di progetto e fasce di budget si cambiano in `site.form`.

Oggi l’endpoint è `/api/contatti`: una funzione serverless (`api/contatti.js`, eseguita da Vercel) che consegna la richiesta via email con **Resend** e via WhatsApp con **CallMeBot**. Legge tutto dalle variabili d’ambiente — `RESEND_API_KEY`, `CONTACT_FROM`, `CONTACT_TO`, `CALLMEBOT_PHONE`, `CALLMEBOT_APIKEY`, `TURNSTILE_SECRET_KEY` — che vanno impostate nel progetto Vercel e **non stanno nel repository**. L’antispam Cloudflare Turnstile si attiva compilando `site.form.turnstileSiteKey` (chiave pubblica, finisce nell’HTML); lasciandola vuota il riquadro sparisce e il modulo resta funzionante.

## Dati personali e titolo professionale

Scelte fatte apposta, da non cambiare senza motivo:

- Il titolo è **«Diplomato geometra»**: «Geometra» e «Perito geometra» sono titoli riservati agli iscritti all’albo.
- `site.legal.piva` e `site.legal.albo` sono `null`: i template nascondono da soli i blocchi che li mostrerebbero e al loro posto compare `site.legal.note`.
- In footer e contatti si pubblica solo il comune. L’indirizzo completo (`site.location.address`) compare unicamente nella privacy policy, dove il titolare del trattamento va identificato per legge. Non va nei dati strutturati.
- Le fotografie pubblicate sono prive di metadati EXIF.

## Stili

`src/style.css` importa i fogli in quest’ordine: `fonts` → `tokens` → `base` → `art` → `components` → `layout` → `home` → `portfolio` → `pages` → `stile` → `viewer` → `print`.

- **Token** (`tokens.css`): palette carta / inchiostro / minio (`#E5481F`), scala tipografica, spazi, raggi, durate ed easing. È il primo file da aprire per cambiare l’aspetto.
- **Caratteri**: Archivo Variable (asse `wdth`) per i testi, IBM Plex Mono per etichette e dati, Instrument Serif per gli accenti in corsivo. Ospitati localmente via `@fontsource`, nessuna richiesta a Google Fonts.
- **Reveal** (`base.css`): `data-reveal` con i tipi `fade`, `up`, `clip`, `line`, `draw`; tutto disattivato con `prefers-reduced-motion`.
- **Footer** (`layout.css`): composizione unica, palette scoperta su `footer.site-footer`, firma con monogramma a tratto sottile.
- **Stile** (`stile.css`): il piano navigabile della pagina `/stile/` e le sue tavole, a misure fisse in px (sono fogli inquadrati dalla finestra, non layout fluidi).
- **Visualizzatore** (`viewer.css`): le tavole vere, nel case study, nella pagina `/portfolio/tavole/` e a schermo intero.
- **Stampa** (`print.css`): la pagina `/studio/profilo/` è pensata per essere stampata come curriculum.

## JavaScript del browser

`src/main.js` avvia in sequenza i moduli di `src/client/`; ognuno cerca i propri elementi e, se non li trova, non fa nulla. Un modulo che fallisce non ferma gli altri (l’errore finisce in console con il prefisso `[site]`). Non ci sono dipendenze: niente librerie di animazione, niente polyfill.

Quel che fa: header che si nasconde scendendo, menu mobile con focus trap, orologio, barra di avanzamento, transizioni tra pagine, reveal allo scorrimento, contatori, parallasse, cursore personalizzato (solo con puntatore fine), elementi magnetici, anteprime flottanti e scorrevoli, filtri del portfolio con stato nell’URL, lightbox, confronto prima/dopo, copia negli appunti, modulo contatti, piano con zoom e spostamento della pagina Stile, visualizzatore delle tavole.

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

- [x] Segnaposto: `placeholders` in `src/data/site.js` è vuoto e la build non segnala più niente. LinkedIn è stato tolto dai social (il link puntava alla homepage del servizio), la fotografia dello studio è stata rimossa insieme alla sua sezione.
- [x] Progetti dimostrativi: non vengono pubblicati (`showSamples: false`), l’area Grafica è nascosta perché ne restava senza. Vanno sostituiti con lavori veri, uno alla volta — vedi [Progetti](#progetti).
- [ ] Rileggere privacy e cookie policy (`src/templates/pages/legal.js`) e aggiornare `site.legal.updated`. Se si aggiungono strumenti di analisi o servizi di terze parti, la cookie policy va aggiornata.
- [ ] Modulo contatti: `site.form.endpoint` punta a `/api/contatti`. Verificare che su Vercel siano impostate le variabili d’ambiente che la funzione si aspetta (`RESEND_API_KEY`, `CONTACT_FROM`, `CONTACT_TO`, `CALLMEBOT_PHONE`, `CALLMEBOT_APIKEY`, `TURNSTILE_SECRET_KEY`) e provare un invio vero in produzione.
- [ ] Antispam: `site.form.turnstileSiteKey` è vuota, quindi il riquadro Turnstile non compare. Compilarla (chiave pubblica, non è un segreto) se il modulo inizia a ricevere spam.
- [ ] Sistemare il DNS di albertopecchini.it: il dominio senza www ha ancora un record A verso il vecchio hosting Aruba (62.149.128.40) accanto a quello di Vercel (216.198.79.1). Deve restare solo quello di Vercel, altrimenti chi digita l’indirizzo senza www ottiene a caso il sito o un errore di connessione.
- [ ] Controllare `public/og.png` e il manifest (`public/site.webmanifest`).

## Pubblicazione

`dist/` è un sito statico e funziona su qualsiasi hosting. Il progetto Vercel `albertopecchini.it` è collegato a questo repository GitHub (`albertoxpecchini/AP`) con **Root Directory** = `albertopecchini.it`, framework Vite, Node 24: ogni push su `main` produce un deploy di produzione, gli altri rami un’anteprima.

Domini di produzione: `www.albertopecchini.it` e `albertopecchini.it` (che rimanda a www con un 308). Gli indirizzi `*.vercel.app` del progetto sono protetti da Vercel Authentication (accesso solo con login Vercel), i domini personalizzati no.

`vercel.json` imposta URL puliti con barra finale (come i percorsi generati), cache di un anno sugli asset con hash, cache di trenta giorni su `media/` e `art/`, e le intestazioni `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`. `404.html` viene servita in automatico.

## Generatore di email

`tools/email-generator/` trasforma appunti e file in un'email HTML autosufficiente,
pronta da incollare nel composer di Yahoo, Proton o Gmail. Vive nello stesso
repository perché **riusa il linguaggio visivo del sito**: legge `src/styles/tokens.css`
e ne ricava colori, scala tipografica e spazi, senza mai modificarlo.

```bash
npm run email:new preventivo-studio    # copia EMAIL_INPUT_TEMPLATE.md in emails/in/
npm run email emails/in/2026-09-18-preventivo-studio.md
```

Il risultato è un solo file da leggere: `emails/out/<data>_<nome>/report.md`.

Gli account mittente stanno in `config/sender-profiles.json`, le firme — versionate —
in `profiles/footers.json`. Istruzioni complete in
[`tools/email-generator/README.md`](tools/email-generator/README.md).

## Convenzioni

- Contenuti in `src/data`, struttura in `src/templates`, aspetto in `src/styles`: niente testo nei template che non venga dai dati, salvo le etichette di interfaccia.
- Nessun framework a runtime e nessuna dipendenza client: se serve un comportamento, si scrive in `src/client/`.
- Messaggi di commit in italiano, con prefisso (`feat`, `fix`, `docs`, `chore`) e ambito tra parentesi.
- Il codice usa fine riga LF; Git su Windows avvisa della conversione CRLF, l’avviso è innocuo.

© Alberto Pecchini. Contenuti, fotografie e tavole non sono riutilizzabili senza permesso.
