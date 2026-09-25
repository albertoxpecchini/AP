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
- [Fonti delle immagini](#fonti-delle-immagini)
- [Modulo contatti](#modulo-contatti)
- [Dati personali e titolo professionale](#dati-personali-e-titolo-professionale)
- [Stili](#stili)
- [JavaScript del browser](#javascript-del-browser)
- [Build](#build)
- [Prima di andare online](#prima-di-andare-online)
- [Pubblicazione](#pubblicazione)
- [Generatore di email](#generatore-di-email)
- [Compositore email online](#compositore-email-online)
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
│  ├─ replicate.mjs        client di Replicate in comune tra copertine, figurine e scontorno
│  ├─ scontorna.mjs        toglie il fondo a una foto (bria/remove-background) e ne rifinisce i capelli
│  ├─ copertine/           copertine e gallerie illustrate dei progetti non web, gpt-image-2 su Replicate (vedi il suo README)
│  ├─ figurine/            figurine scontornate: nove per immagine, gpt-image-2 su Replicate (vedi il suo README)
│  ├─ cartina/             fondo illustrato della carta dell’area operativa (/contatti/), gpt-image-2 su Replicate
│  ├─ email-generator/     generatore di email HTML (vedi il suo README)
│  └─ tavole/              tavole da PDF → SVG per il visualizzatore, riservatezza (vedi il suo README)
├─ emails/                 input, output e allegati delle email generate
├─ config/                 account mittente e tema email derivato dal CSS
├─ profiles/               archivio firme versionato
├─ public/                 servito così com’è alla radice del sito
│  ├─ favicon.svg · favicon-32.png · apple-touch-icon.png · icon-512.png · site.webmanifest
│  ├─ og.png               immagine per le anteprime social (1200×630)
│  ├─ icons.svg            sprite delle icone
│  └─ media/
│     ├─ figurine/         figurine ritagliate (<nome>.webp con trasparenza), generate da tools/figurine
│     ├─ mockup/           cornici dei dispositivi dal file Figma (MacBook, iPad, iPhone) e l’iPhone 18 Pro vettoriale
│     ├─ progetti/         una cartella per progetto: fotografie NN.webp (griglia) e NN-full.webp (lightbox), copertina.webp e vista-NN.webp illustrate
│     ├─ studio/           fotografie reali (primo piano, avatar, figura scontornata)
│     ├─ tavole/           le tavole vere, una cartella per progetto: NN.svg, NN.webp, NN-mini.webp, NN.pdf
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
│  │  ├─ sections.js       hero, carosello dei siti, timeline del metodo, indice laterale
│  │  ├─ filters.js        filtri del portfolio (stato nell’URL)
│  │  ├─ widgets.js        lightbox, confronto prima/dopo, copia negli appunti
│  │  ├─ form.js           validazione e invio del modulo contatti
│  │  ├─ phone.js          tastierino dell’iPhone nella pagina Contatti: ricompone il numero quando entra nello schermo
│  │  ├─ canvas.js         piano della pagina Stile: zoom, spostamento, tavole inquadrate e animate, griglia in WebGL
│  │  ├─ viewer.js         visualizzatore delle tavole: zoom vettoriale, spostamento, gesti, tastiera, schermo intero
│  │  ├─ dwg-sheet.js      una tavola letta dal DWG dentro il visualizzatore: worker, canvas base e di dettaglio
│  │  └─ utils.js          selettori, scroll, focus trap, reduced motion
│  ├─ dwg/                 lettore di file DWG scritto da zero, gira nel browser (vedi «Tavole vere»)
│  │  ├─ bits.js           lettore di bit: i tipi della specifica (B, BS, BD, DD, MC, MS, H, TU…)
│  │  ├─ file.js           struttura R2004+: intestazione cifrata, mappa delle pagine, sezioni, LZ77
│  │  ├─ objects.js        mappa degli oggetti, classi, intestazione comune, flussi stringhe e handle
│  │  ├─ entities.js       decodifica campo per campo di entità e tabelle (layer, tipi di linea, blocchi)
│  │  ├─ header.js         le variabili d’intestazione che servono (LTSCALE, PDMODE…)
│  │  ├─ dwg.js            lettura completa: indice, tabelle, spazio modello, blocchi, ordine di disegno
│  │  ├─ geom.js           trasformazioni, archi e bulge, NURBS, ellissi, motivi di tratteggio, palette ACI
│  │  ├─ mtext.js          interprete dei codici di formato dei testi multilinea
│  │  ├─ scene.js          dal modello alla scena: tracciati per stile, riempimenti, tratteggi, testi
│  │  ├─ render.js         disegno della scena su canvas 2D, impaginazione dei testi
│  │  └─ worker.js         scarica, legge e disegna fuori dal thread della pagina
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
| `/contatti/` | Modulo di contatto, recapiti, telefono (un iPhone con il numero sul tastierino), area operativa |
| `/portfolio/tavole/` | Il visualizzatore di tutte le tavole vere, raggruppate per progetto; `#<slug>-<NN>` apre una tavola precisa. **Oggi spenta**: esiste solo con `showSheets = true` (vedi [Tavole vere](#tavole-vere)) |
| `/stile/` | Il sistema visivo in cinque tavole (home a 1440 px, colore, tipografia, forma e movimento, componenti) su un piano con zoom e spostamento, come in un programma di disegno |
| `/privacy/` · `/cookie/` | Note legali |
| `/crediti/` | Crediti e fonti delle immagini (testi in `src/data/crediti.js`), linkata nel footer |
| `/email/` | Compositore email, strumento privato: non è nei menu né nella sitemap, ha `noindex` e si apre solo dal link con la chiave (vedi [Compositore email online](#compositore-email-online)) |
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
- `iphone`: per un progetto web, la pagina intera su iPhone 18 Pro (`{ lead, pages }`, `pages` = strisce della stessa cattura una sotto l’altra). Nel case study ha una sezione **iPhone** tutta sua, dopo la galleria; la pagina scorre al passaggio. Vedi [iPhone 18 Pro](#iphone-18-pro).
- `photos`: fotografie del progetto a gruppi (`{ lead, groups: [{ title, items }] }`). Nel case study hanno una sezione **Fotografie** tutta loro, subito dopo la galleria o le tavole, in colonne con le proporzioni vere; si aprono nel lightbox.
- `sheets`: le tavole vere (DWG, PDF, relazioni) da sfogliare nel visualizzatore. Si vedono solo con `showSheets = true`: allora nel case study la galleria diventa la sezione **Tavole** e il progetto compare in `/portfolio/tavole/`. Vedi [Tavole vere](#tavole-vere).
- Il carosello della home mostra tutti i progetti web (area `web` con `web` compilato): su desktop è una griglia ferma, su telefono e tablet scorre col dito. `featured: true` li mette in testa.
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
sul Museo dei Mestieri del Fiume, con 80 fotografie della giornata, compagni di classe
compresi), rivaltasulmincio.it, cascinafontana.xyz,
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

`width` e `height` servono a riservare lo spazio ed evitare salti di layout. Con `full` (per esempio `…/01-full.webp`) il lightbox apre una versione più grande di quella in pagina: le fotografie stanno in griglia a 720 px e a tutto schermo a 1600. Formato consigliato: WebP, lato lungo 1600–2000 px, senza metadati (una fotografia scattata con il telefono contiene le coordinate GPS).

Con ffmpeg, disponibile sulla macchina di sviluppo:

```bash
ffmpeg -i originale.jpg -map_metadata -1 -vf "scale=1600:-1:flags=lanczos" -c:v libwebp -quality 82 -compression_level 6 -preset photo public/media/progetti/<slug>/01.webp
```

### Tavole vere

**Oggi non si mostrano.** Dal 26 settembre 2026 il sito non fa vedere i documenti dei
progetti — tavole, PDF, pagine della relazione — ma solo illustrazioni: copertina e
galleria di ogni progetto non web vengono da [`tools/copertine`](tools/copertine/README.md)
(richiesta di Alberto: «mai mostrare i documenti»). I dati e il visualizzatore restano:
`showSheets` in `src/data/projects.js` è l'interruttore. Spento, i progetti escono
senza `sheets`, il case study mostra la galleria di `images`, la pagina
`/portfolio/tavole/` non viene generata e la voce «Tavole» sparisce dal menù. Acceso,
torna tutto com'era. I file in `public/media/tavole/` restano anche perché fanno da
riferimento alle illustrazioni.

I disegni dei lavori tecnici non sono tavole generate: sono i file veri. Ogni tavola
sta in `public/media/tavole/<slug>/` con la miniatura `NN.webp` (1200 px),
`NN-mini.webp` (320 px) per l’elenco e `NN.pdf` da scaricare, e si dichiara in
`sheets` con l’aiuto `sheet(slug, 'NN', { title, alt, note, h, scale, from })`.
Le pagine di una relazione sono immagini: `full` indica la versione grande (1600 px);
le tavole stampate da AutoCAD in PDF hanno il disegno in `NN.svg`.

**Le tavole DWG restano DWG.** Il file `.dwg` sta così com’è nella cartella della
tavola e il browser lo legge da solo: `src/dwg/` è un lettore del formato scritto da
zero (nessuna libreria, nessuna conversione) che apre i file di AutoCAD 2010–2018
(AC1024, AC1027, AC1032): decifra l’intestazione, ricompone le sezioni compresse,
decodifica bit per bit entità e tabelle (linee, polilinee, archi, cerchi, ellissi,
spline, testi e testi multilinea, quote, tratteggi pieni e a motivo, blocchi anche
annidati, layer, tipi di linea, spessori, colori veri e trasparenze, ordine di
disegno) e disegna tutto su canvas. Una tavola è un riquadro dello spazio modello:
`sheet(slug, 'NN', { dwg: 'file.dwg', box: [x0, y0, x1, y1], darken })`, con il
riquadro in unità del disegno (`h` si ricava da solo). `darken` scurisce i colori
chiari pensati per lo sfondo nero di AutoCAD; `paper` (A3, A4…) dà la larghezza del
foglio, da cui gli spessori di linea in millimetri. Lo stesso DWG serve più tavole:
viene scaricato e letto una volta sola, in un worker, e ogni foglio ne mostra il suo
riquadro. Su schermo il foglio ha una base a 2048 px e, ingrandendo, si ridisegna la
parte visibile alla scala dello schermo, quindi resta nitido a qualunque zoom.

Il visualizzatore (`src/templates/components/viewer.js` e `src/client/viewer.js`)
muove il foglio con `transform` durante i gesti e, a vista ferma, gli dà la misura vera
perché il browser ridisegni l’SVG o il DWG nitido a quella scala. Trascinare sposta,
Ctrl + rotella o due dita ingrandiscono, il doppio clic avvicina, le frecce cambiano
tavola, F adatta; c’è lo schermo intero. Nei case study la rotella e il dito scorrono
la pagina finché la tavola non è ingrandita. Senza JavaScript l’elenco apre il file
stesso (il DWG o l’SVG).

Come si preparano le tavole da PDF, e cosa si controlla prima di pubblicare qualunque
tavola (indirizzi, nomi, volti), è spiegato in
[`tools/tavole/README.md`](tools/tavole/README.md).

La tavola non fa né da copertina né da galleria: ogni progetto non web ha
un'illustrazione in assonometria come copertina (`drawnCover` in `projects.js`, file in
`public/media/progetti/<slug>/copertina.webp`) e tre viste nella galleria
(`drawnView`, file `vista-NN.webp` e `vista-NN-full.webp` nella stessa cartella),
disegnate da gpt-image-2 su Replicate con le tavole come riferimento. Come si generano:
[`tools/copertine/README.md`](tools/copertine/README.md).

### Fotografie

Le fotografie reali stanno in `public/media/studio/` e sono dichiarate in `photos` (`src/data/studio.js`):

- `fototessera.webp` (1000×1250, 4:5) e `fototessera-avatar.webp` (192×192): la fototessera `Downloads/_8006413_pp.jpg` (1240×1594) scontornata con `node tools/scontorna.mjs <foto>`, che manda la foto a bria/remove-background su Replicate e ne usa solo la maschera: i pixel restano quelli originali. Lo script rifinisce i bordi dei capelli dal colore (il fondo bianco è noto) e toglie l’alone chiaro che sulle pagine scure si vedrebbe. Il ritratto ha 106 px vuoti sopra la testa, perché la parallasse sposta l’immagine del 7% nel riquadro: `ffmpeg -i scontornata.png -vf "format=rgba,pad=1360:1700:60:106:color=0x00000000,scale=1000:1250:flags=lanczos,format=yuva420p" -c:v libwebp -quality 88 fototessera.webp`; l’avatar è il quadrato `crop=1240:1240:0:20` ridotto a 192 px, su un disco di carta (`background` in `.hero__avatar img`).
- `curioso-1600.webp` / `curioso-900.webp`: la figura scontornata (fondo trasparente) che in /studio/ esce dal riquadro scuro.

Se una fotografia arriva in DNG: il codec **Raw Image Extension** di Microsoft la decodifica da PowerShell (`System.Windows.Media.Imaging.BitmapDecoder`; non applica l’orientamento EXIF, quindi la rotazione va fatta a parte), poi si ritaglia e si converte con ffmpeg, sempre con `-map_metadata -1`.

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

### iPhone 18 Pro

Il case study di questo sito (sezione **iPhone**) e la pagina Contatti (sezione **Telefono**) usano una seconda cornice: `public/media/mockup/iphone-18-pro.svg`, il disegno vettoriale [IPhone 18 Pro Vector.svg](https://commons.wikimedia.org/wiki/File:IPhone_18_Pro_Vector.svg) di **Rafael Fernandez** da Wikimedia Commons, in licenza [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). La licenza chiede di citare l’autore dove l’immagine compare: `iphoneCredit()` in `ui.js` scrive la riga sotto ogni telefono, e non va tolta. Il file è quello originale, con in testa solo la nota di attribuzione.

- `iphone(screen)` in `ui.js` mette qualsiasi contenuto sullo schermo, sotto barra di stato, isola dinamica e indicatore home. Schermo e isola ricalcano le quote del disegno (73 × 150 mm) in percentuale in `components.css`; dentro lo schermo si misura in punti iOS con `--pt`, 1/402 della larghezza dello schermo (unità `cqi`), così tutto scala con il telefono.
- `iphoneSite({ domain, pages })` è un sito in Safari: la pagina parte sotto la barra di stato e scorre al passaggio dietro la barra degli indirizzi, con lo stesso `data-scroll-preview` degli altri mockup (più lento: `data-scroll-speed`, `data-scroll-max`).
- Il tastierino della pagina Contatti è in `src/templates/pages/contact.js` e prende il numero da `site.contact.phone`. Nell’HTML il numero è intero; `src/client/phone.js` lo ricompone cifra per cifra quando il telefono entra per metà nello schermo e lo azzera quando ne esce. Il tasto verde è un vero link `tel:`. Con il movimento ridotto il numero resta fermo.

La pagina intera di `iphone.pages` (`public/media/web/ap-iphone-01…05.webp`) è una cattura della home online con un viewport di 402×812 a 2x (Chromium, user agent di iPhone, `prefers-reduced-motion` emulato, tutta la pagina fatta scorrere prima dello scatto perché le immagini si carichino), scattata a strisce con `clip` e `captureBeyondViewport` (oggi cinque, 804×4652) e convertita in WebP (qualità 78). Le strisce restano sotto i 16.384 px: oltre quel limite Chromium ripete i pezzi di pagina in una cattura unica. Se cambia la home va rifatta: numero e altezze delle strisce vanno riportati in `projects.js`. Rifatta il 26.09.2026 sulla home nuova.

### Figurine

Servizi, fasi del metodo (in `/metodo/` e in home), lavori trasversali, strumenti dello studio, le parti sul web (sezioni 02 e 03 della home, `/portfolio/web/`, case study dei siti), contatti e 404 hanno una piccola illustrazione scontornata: `figurina(nome)` in `ui.js`, file in `public/media/figurine/`, misure in `src/data/figurine.js` (generato). Nascono da [`tools/figurine`](tools/figurine/README.md): un’immagine di gpt-image-2 con nove figurine, ritagliate in automatico. Un nome senza file non disegna nulla.

## Fonti delle immagini

Le stesse informazioni sono pubblicate nella pagina [`/crediti/`](https://www.albertopecchini.it/crediti/), linkata nel footer (`src/data/crediti.js`). Quando entra un’immagine di provenienza nuova, va aggiunta in tutti e due i posti.

| Immagini | Dove stanno | Fonte |
| --- | --- | --- |
| Copertine e gallerie dei progetti non web (strada, bar-caffetteria, cantiere, tettoie, museo) | `public/media/progetti/<slug>/copertina.webp`, `vista-NN*.webp` | Generate con **openai/gpt-image-2** (OpenAI) su [Replicate](https://replicate.com/openai/gpt-image-2), con le tavole originali o le fotografie del museo come riferimento — [`tools/copertine`](tools/copertine/README.md) |
| Figurine | `public/media/figurine/` | Generate con **openai/gpt-image-2** su Replicate — [`tools/figurine`](tools/figurine/README.md) |
| Fondo della carta dell’area operativa (/contatti/) | `public/media/mappa/area-operativa.webp` | Generato con **openai/gpt-image-2** su Replicate dal riferimento di lago e fiumi di `areamap({ solo: 'acque' })`; reticolo, raggi, città, nomi e scala restano vettoriali, da `areamap({ base })` in `src/art/misc.js` — `tools/cartina/cartina.mjs` |
| Ritratto e avatar | `public/media/studio/fototessera*.webp` | Fototessera di Alberto Pecchini, scontornata con bria/remove-background su Replicate (volto non ritoccato) |
| Figura scontornata di /studio/ | `public/media/studio/curioso-*.webp` | Fotografia di Alberto Pecchini, scontornata con l’IA su Replicate |
| Fotografie del museo | `public/media/progetti/museo-mestieri-del-fiume/` | Scattate durante l’uscita del 15.11.2025; le due fotografie d’epoca (60, 61) riprendono materiale esposto nel museo |
| Tavole (oggi non pubblicate, riferimento delle illustrazioni) | `public/media/tavole/` | Elaborati originali di Alberto Pecchini (AutoCAD LT), I.T.T. «Carlo d’Arco» |
| Disegni dei progetti dimostrativi, piante e marchi di esempio | `src/art/` → `/art/<slug>.svg` | Disegnati dal codice del sito |
| Screenshot dei siti | `public/media/web/` | Catture dei siti di Alberto Pecchini |
| MacBook, iPad, iPhone | `public/media/mockup/` | File della Figma Community [Device Mockups (iMac, Macbook, iPad, iPhone)](https://www.figma.com/community/file/1172125330560103197/device-mockups-imac-macbook-ipad-iphone), licenza CC BY 4.0 |
| iPhone 18 Pro (case study di questo sito, /contatti/) | `public/media/mockup/iphone-18-pro.svg` | [IPhone 18 Pro Vector.svg](https://commons.wikimedia.org/wiki/File:IPhone_18_Pro_Vector.svg) di Rafael Fernandez, Wikimedia Commons, licenza CC BY-SA 4.0; il credito compare sotto ogni telefono (`iphoneCredit()`) |
| Icone, monogramma, firma, favicon, `og.png` | `public/`, `ui.js` | Disegnati per il sito |
| Caratteri | `@fontsource/*` | Archivo, IBM Plex Mono, Instrument Serif — SIL Open Font License |

## Modulo contatti

Con `site.form.endpoint` vuoto il modulo, dopo la validazione, compone una email nel programma di posta del visitatore. Indicando un endpoint i dati partono in `POST` come JSON; una risposta 2xx mostra lo stato di successo, qualsiasi altra lo stato di errore. Tipi di progetto e fasce di budget si cambiano in `site.form`.

Oggi l’endpoint è `/api/contatti`: una funzione serverless (`api/contatti.js`, eseguita da Vercel) che consegna la richiesta via email con **Resend** e via WhatsApp con **CallMeBot**. Legge tutto dalle variabili d’ambiente — `RESEND_API_KEY`, `CONTACT_FROM`, `CONTACT_TO`, `CALLMEBOT_PHONE`, `CALLMEBOT_APIKEY`, `TURNSTILE_SECRET_KEY` — che vanno impostate nel progetto Vercel e **non stanno nel repository**. L’antispam Cloudflare Turnstile si attiva compilando `site.form.turnstileSiteKey` (chiave pubblica, finisce nell’HTML); lasciandola vuota il riquadro sparisce e il modulo resta funzionante.

## Dati personali e titolo professionale

Scelte fatte apposta, da non cambiare senza motivo:

- Il titolo è **«Diplomato geometra»**: «Geometra» e «Perito geometra» sono titoli riservati agli iscritti all’albo.
- `site.legal.piva` e `site.legal.albo` sono `null`: i template nascondono da soli i blocchi che li mostrerebbero e al loro posto compare `site.legal.note`.
- In footer e contatti si pubblica solo il comune. L’indirizzo completo (`site.location.address`) compare unicamente nella privacy policy, dove il titolare del trattamento va identificato per legge. Non va nei dati strutturati.
- Le fotografie pubblicate sono prive di metadati EXIF (niente coordinate GPS). Nelle fotografie di gruppo, uscite o visite non si pubblicano persone riconoscibili: si scelgono le foto senza persone o si ritagliano.

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

## Compositore email online

`/email/` è il generatore in pagina: si sceglie da dove parte l’email (scuola,
personale, aziendale — gli stessi account di `config/sender-profiles.json`, con le
firme di `profiles/footers.json`), si compila con i tasti della guida (il Markdown
del generatore funziona), si copia l’output, la si fa migliorare dall’IA (**Claude Opus** con l’abbonamento in locale, **IBM Granite 4.2 8B** online)
e si leggono statistiche, peso, lunghezza e segnalazioni. In fondo c’è la rubrica:
preferiti, indirizzi nuovi (salvati nel browser) e i contatti conosciuti di
`src/data/rubrica.js`.

**L’output è la stessa email del generatore da riga di comando**, non un’imitazione:
nel browser girano i suoi moduli puri (`compose.js`, `markdown.js`, `template.js`,
`footer-html.js`, `validate.js`, `report.js`), con tema, firma, logo e icone che
il template mette nel blocco JSON della pagina e il carattere Archivo scaricato e
incorporato in base64 come fa `fonts.js`. La zona «Output» mostra lo stato
(READY / WARNING / MISSING_REQUIRED_DATA) con errori e avvisi di `validate.js`,
l’anteprima in un iframe e le viste email.txt, report.md e sorgente; si scaricano
`email.html`, `email-lite.html`, `email.txt`, `report.md`, il file di input per
`emails/in/` (che rigenera la stessa email con `npm run email`) e una bozza `.eml`.
Verificato byte per byte: per lo stesso input pagina e CLI producono file identici.
Il modulo del browser (`src/client/email.js`) si carica solo su questa pagina, in un
pezzo a parte, così le altre non ne pagano il peso.

È uno strumento privato. La pagina non compare nei menu, nel footer, nella sitemap
né nei motori di ricerca (`noindex` nel `<head>` e `X-Robots-Tag` in `vercel.json`):
si raggiunge solo dal link diretto, che porta anche la chiave di accesso:

```
https://www.albertopecchini.it/email/?k=<EMAIL_TOOL_KEY>
```

Al primo accesso la chiave viene salvata nel browser e tolta dall’indirizzo. Senza
chiave la pagina funziona lo stesso, ma i tasti dell’IA restano spenti.

L’IA passa da `api/email-ai.js`. In locale usa Claude con l’abbonamento (vedi
[sotto](#in-locale-con-labbonamento-claude)); online è una funzione serverless
Vercel che parla con [Granite 4.2 8B](https://huggingface.co/ibm-granite/granite-4.2-8b) (IBM, Apache 2.0)
attraverso un qualsiasi endpoint compatibile con l’API OpenAI (Chat Completions),
con `fetch` e nessun SDK: il sito non ha dipendenze di runtime. In produzione il
modello lo serve **OpenRouter** (`ibm-granite/granite-4.2-8b`, qualche decina di centesimi di dollaro
ogni mille richieste); in locale **Ollama** (`granite4.2:8b`, Q4_K_M, 5,3 GB: sta in
8 GB di VRAM) o vLLM. La funzione su Vercel non vede il computer di casa: un modello
locale serve solo per le prove in locale.

Variabili d’ambiente, da impostare su Vercel in *Production*, *Preview* e
*Development*; i segreti **mai nel repository** (in locale stanno in `.env.local`,
escluso da Git):

| Variabile | Valore | Se manca |
|---|---|---|
| `EMAIL_TOOL_KEY` | una stringa casuale lunga: è la chiave del link | la funzione rifiuta ogni richiesta |
| `EMAIL_AI_API_KEY` | la chiave di OpenRouter (openrouter.ai → Keys) | l’IA risponde «non configurata»; con un server locale non serve |
| `EMAIL_AI_BASE_URL` | facoltativa; di serie `https://openrouter.ai/api/v1` | — (Ollama: `http://localhost:11434/v1`, vLLM: `http://localhost:8000/v1`) |
| `EMAIL_AI_MODEL` | facoltativa; di serie `ibm-granite/granite-4.2-8b` | — (Ollama: `granite4.2:8b`) |

Ogni richiesta porta la chiave nell’intestazione `X-Email-Key`; la funzione la
confronta a tempo costante, limita a 60 richieste l’ora per IP e chiede al modello
una risposta in JSON con schema (oggetto, testo, modifiche, consigli, oggetti
alternativi, voto); se il server non accetta schema o controlli del ragionamento,
ripiega sulla richiesta semplice. Lo «Sforzo» della pagina regola il ragionamento
di Granite: *Rapido* senza ragionamento (temperatura 0,2), *Normale* con ragionamento
breve — il miglior compromesso, 5–10 s in locale su una RTX 3060 Ti — e *Accurato*
con ragionamento esteso (migliaia di token: in locale oltre un minuto, su Vercel
rischia il limite di 60 s). Dopo la risposta la funzione rimette il congedo
dell’originale se il modello l’ha perso (con `hasClosing` del generatore) e gli
a capo Markdown tra «Cordiali saluti,» e il nome. Il costo mostrato è quello che
riporta OpenRouter; in locale è «gratis».

File: `src/templates/pages/email.js` (markup), `src/client/email.js` (logica),
`src/styles/email.css` (aspetto), `src/data/rubrica.js` (mittenti, toni, contatti),
`api/email-ai.js` (funzione).

### In locale, con l’abbonamento Claude

Alberto usa `/email/` solo dal suo computer, e lì l’IA è **Claude Opus con
l’abbonamento Claude** (Max), senza chiave API e senza costi in più. `npm run dev`
serve anche le funzioni di `api/` con le variabili di `.env.local`
(`plugins/api-dev.js`, solo in sviluppo: `vercel dev` non serve), e con
`EMAIL_AI_PROVIDER=claude-code` la funzione lancia Claude Code sul computer:

```bash
npm run dev                  # poi http://localhost:5173/email/
```

In locale la chiave di accesso non serve: la aggiunge il dev server alle
richieste che partono da questo computer e dalla pagina stessa
(`Sec-Fetch-Site: same-origin`); una richiesta da un altro sito aperto nel browser
resta senza chiave e riceve 401.

La funzione chiama `claude -p` con il prompt di sistema e lo schema JSON dello
strumento, `--model opus` e lo «Sforzo» della pagina come `--effort`. Claude
Code gira **senza strumenti** (`--tools ""`), in modalità `--restricted` (niente
impostazioni né hook dell’utente), senza MCP, comandi o sessioni salvate, in una
cartella temporanea vuota e senza le variabili `ANTHROPIC_*`: se vedesse
`ANTHROPIC_API_KEY` userebbe la chiave invece dell’abbonamento. Il testo
dell’email quindi non può far eseguire nulla sul computer. Tempi misurati:
10–18 s per richiesta. Le richieste consumano i limiti di utilizzo
dell’abbonamento, gli stessi delle sessioni di Claude Code; al limite la pagina
lo dice. Serve Claude Code da riga di comando (`claude` nel PATH) collegato
all’account: `claude auth status` deve dire `"authMethod": "claude.ai"`.

**Consumi in diretta.** Sotto l’IA c’è il pannello «Consumi dell’IA»:

- *Limiti dell’abbonamento* (sessione di 5 ore, settimana, settimana per modello)
  con l’ora dell’azzeramento. Li legge `GET /api/email-ai?limiti` lanciando
  `claude -p /usage`, che non consuma token: all’apertura, ogni minuto con la
  scheda in vista e con «Aggiorna limiti». Ogni richiesta li aggiorna anche
  dall’evento `rate_limit_event` di Claude Code.
- *Richiesta in corso*: con `Accept: application/x-ndjson` la funzione risponde
  in streaming (`--output-format stream-json`) e manda fase (attesa, ragiona,
  scrive), token di ragionamento stimati e token di risposta stimati; la riga
  «adesso» del registro e la riga di stato si aggiornano mentre Claude lavora.
- *Contatori* per oggi, 7 giorni o tutto: richieste ed errori, token in e out
  (con il ragionamento), tempo medio e totale, valore a prezzi API
  (`total_cost_usd`, una stima: con l’abbonamento non si paga).
- *Registro* delle ultime 30 richieste; ne tiene 500 nel localStorage del
  browser (`ap:email:usage`), si scarica in CSV per Excel e si azzera.

Variabili facoltative: `EMAIL_AI_CLAUDE_MODEL` (di serie `opus`),
`EMAIL_AI_CLAUDE_BIN` (di serie `claude`). **Su Vercel `EMAIL_AI_PROVIDER` non va
impostata**: lì Claude Code non c’è, e il login dell’abbonamento non si mette su un
server. Per tornare a Granite in locale basta togliere la riga da `.env.local`;
Ollama con il modello scaricato fa da ripiego gratuito:

```bash
ollama pull granite4.2:8b    # una volta, 5,3 GB
```

## Convenzioni

- Contenuti in `src/data`, struttura in `src/templates`, aspetto in `src/styles`: niente testo nei template che non venga dai dati, salvo le etichette di interfaccia.
- Nessun framework a runtime e nessuna dipendenza client: se serve un comportamento, si scrive in `src/client/`.
- Messaggi di commit in italiano, con prefisso (`feat`, `fix`, `docs`, `chore`) e ambito tra parentesi.
- Il codice usa fine riga LF; Git su Windows avvisa della conversione CRLF, l’avviso è innocuo.

© Alberto Pecchini. Contenuti, fotografie e tavole non sono riutilizzabili senza permesso.
