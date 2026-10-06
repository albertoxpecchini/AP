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

- **`plugins/site-pages.js`** è un plugin Vite. In sviluppo intercetta le richieste HTML, carica `src/templates/routes.js` con `ssrLoadModule` e rende la pagina; in build, dopo il bundle di JS e CSS, scrive ogni rotta in `dist/`, aggiunge `404.html`, `sitemap.xml`, `robots.txt` e le miniature SVG, poi elimina il manifest di Vite. A ogni pagina collega i fogli delle pagine speciali che usa (`PAGE_CSS`) e passa l’HTML a **`plugins/responsive-images.js`**, che aggiunge `srcset`/`sizes` e scrive le versioni ridotte delle immagini (vedi [Build](#build)).
- **I template** sono moduli ESM puri: nessun import di CSS o immagini, così girano identici in Node e nel dev server. `src/templates/html.js` fornisce il tag `html` (appiattisce gli array e scarta `false` e `null`), `esc` per l’escape e `attrs` per gli attributi.
- **Vite** si occupa solo di `src/main.js` (JavaScript), `src/style.css` (CSS e font) e dei tre fogli delle pagine speciali (`stile.css`, `viewer.css`, `email.css`): i file finiscono in `dist/assets/` con hash nel nome e il layout li collega leggendo il manifest. Il font principale viene precaricato per evitare il flash sui titoli.
- **Le immagini segnaposto** non sono file: sono disegni SVG generati in build da `src/art/` (piante, prospetti, nuvole di punti, marchi, manifesti…). Si sostituiscono con fotografie reali cambiando una riga nei dati.
- **Progressive enhancement**: ogni pagina è completa senza JavaScript. I moduli client si attivano solo se trovano i propri elementi e rispettano `prefers-reduced-motion`.

## Struttura delle cartelle

```
albertopecchini.it/
├─ plugins/
│  ├─ site-pages.js        plugin Vite: rende le pagine in dev, le scrive in build
│  ├─ responsive-images.js in build: srcset, sizes e versioni ridotte delle immagini di /media/
│  └─ api-dev.js           in dev: serve le funzioni di api/
├─ api/
│  └─ contatti.js          funzione serverless del modulo contatti (Resend + CallMeBot)
├─ tools/
│  ├─ replicate.mjs        client di Replicate in comune tra copertine, figurine e scontorno
│  ├─ scontorna.mjs        toglie il fondo a una foto (bria/remove-background) e ne rifinisce i capelli
│  ├─ copertine/           copertine e gallerie illustrate dei progetti non web, gpt-image-2 su Replicate (vedi il suo README)
│  ├─ figurine/            figurine scontornate: nove per immagine, gpt-image-2 su Replicate; anche le sagome dei tasti e le mini immagini del piè di pagina (vedi il suo README)
│  ├─ mascotte/            la chiocciola e la tartaruga, e i burattini a pezzi (chiocciola, tartaruga, airone, gazza, vespa), gpt-image-2 su Replicate; occhi e perni trovati dallo script (vedi il suo README)
│  ├─ aragosta/            l’aragosta di fiume della home (intera, poi in pezzi di burattino), gpt-image-2 su Replicate (vedi il suo README)
│  ├─ cartina/             fondo illustrato della carta dell’area operativa (/contatti/), gpt-image-2 su Replicate
│  ├─ catture/             catture dei siti nei progetti web, rifatte da sole quando un sito cambia (vedi il suo README)
│  ├─ email-generator/     generatore di email HTML (vedi il suo README)
│  ├─ nota/                le «note» di fine stagione (interventi, riepilogo, totale) in PDF A4 coi caratteri del sito (vedi il suo README)
│  ├─ tavole/              tavole da PDF → SVG per il visualizzatore, riservatezza e pulizia dei PDF (vedi il suo README)
│  └─ wrapped/             l’analizzatore della chat dietro /wrapped5BT/: unisce gli export di WhatsApp e calcola le metriche delle slide (vedi il suo README)
├─ emails/                 input, output e allegati delle email generate
├─ config/                 account mittente e tema email derivato dal CSS
├─ profiles/               archivio firme versionato
├─ public/                 servito così com’è alla radice del sito
│  ├─ favicon.svg · favicon-32.png · apple-touch-icon.png · icon-512.png · site.webmanifest
│  ├─ og.png               immagine per le anteprime social (1200×630)
│  └─ media/
│     ├─ figurine/         figurine ritagliate (<nome>.webp con trasparenza), generate da tools/figurine; tasto-*.webp sono le sagome dei tasti, chrome-*.webp le mini immagini del piè di pagina
│     ├─ mascotte/         lumaca.webp e tartaruga.webp, le mascotte, e lumaca/ tartaruga/ airone/ gazza/ vespa/, i pezzi dei burattini, generati da tools/mascotte
│     ├─ aragosta/         i pezzi dell’aragosta di fiume della home (corpo, coda, chele, antenne, annaffiatoio), da tools/aragosta
│     ├─ assistenza/       ritagli, sfondi, foto stock, avatar e annunci (ad-*.jpg|gif) di «Better Call Pekko», da tools/assistenza
│     ├─ mockup/           cornici dei dispositivi dal file Figma (MacBook, iPad, iPhone) e l’iPhone 18 Pro vettoriale
│     ├─ progetti/         una cartella per progetto: fotografie NN.webp (griglia) e NN-full.webp (lightbox), copertina.webp e vista-NN.webp illustrate
│     ├─ studio/           fotografie reali (fototessera, avatar, figura scontornata)
│     ├─ tavole/           le tavole vere, una cartella per progetto: NN.svg, NN.webp, NN-mini.webp, NN.pdf (online solo se una pagina le mostra)
│     └─ web/              screenshot dei progetti web (<prefisso>-desktop.webp, -tablet, -mobile, -*-tall)
├─ src/
│  ├─ data/                CONTENUTI: l’unica cosa da toccare per aggiornare il sito
│  │  ├─ site.js           identità, contatti, dati legali, social, navigazione, CTA, numeri, segnaposto
│  │  ├─ projects.js       portfolio: categorie, aree, progetti e i due interruttori di pubblicazione
│  │  ├─ services.js       quattro aree di servizi (tecnico, digitale, grafica, informatica), pacchetti, FAQ
│  │  ├─ informatica.js    la pagina /servizi/informatica/: gruppi, versioni di Windows e Office, regalo, passaggi, regole, FAQ
│  │  ├─ method.js         le sette fasi del metodo
│  │  ├─ studio.js         biografia, fotografie, fatti, timeline, approccio, valori, strumenti, curriculum
│  │  ├─ stack.js          /studio/: gli strumenti con cui gira il sito (nome, cosa fa, colori, tracciato del marchio da Simple Icons)
│  │  ├─ tempo-libero.js   /studio/: Better Call Saul e bettercallpekko.it con la legenda dei riferimenti, domande personali (risposte vuote = non pubblicate)
│  │  ├─ stile.js          sistema visivo: tavole, palette, ruoli, caratteri, scala, spazi, raggi, movimento
│  │  ├─ figurine.js       generato da tools/figurine: nomi e misure delle figurine ritagliate
│  │  ├─ mascotte.js       generato da tools/mascotte: misure, occhi e naso delle mascotte
│  │  ├─ burattini-pezzi.js  generato da tools/mascotte: misure, perni e occhi dei pezzi dei burattini
│  │  ├─ aragosta.js       a mano: montaggio e pose dell’aragosta della home (aragosta-pezzi.js è generato da tools/aragosta)
│  │  ├─ burattini.js      a mano: il montaggio dei burattini (dove si attacca ogni pezzo, quanto gira, cosa segue)
│  │  ├─ assistenza.js     contenuti (in inglese) delle pagine «Better Call Pekko» (/assistenza/, /contatti/assistenza/)
│  │  ├─ assistenza-media.js  generato da tools/assistenza: misure delle immagini di public/media/assistenza/
│  ├─ templates/
│  │  ├─ routes.js         tabella delle rotte (percorso, title, description, dati strutturati) + sitemap, robots, miniature
│  │  ├─ layout.js         <html> completo: head, header e footer (centrati, tasti «sasso», mascotte e burattini), JSON-LD, firma
│  │  ├─ html.js           tag `html`, `esc`, `attrs`, `cx`, `pad`, `jsonLd`
│  │  ├─ components/
│  │  │  ├─ ui.js          icone, monogramma, bottoni, tasti «sasso» (pebble), mascotte, burattini (puppet), intestazioni di sezione, media, mockup, schede dati
│  │  │  ├─ project.js     card, riga d’indice, copertina e anteprima di un progetto
│  │  │  └─ viewer.js      visualizzatore delle tavole (case study e pagina Tavole)
│  │  └─ pages/            una funzione per pagina: home, portfolio, case-study, info (servizi, metodo, studio, profilo), informatica (assistenza informatica), contact, legal (privacy, cookie, 404), stile (sistema visivo), tavole (visualizzatore)
│  ├─ art/                 generatori SVG delle tavole segnaposto
│  │  ├─ index.js          registro: renderArt({ art, variant, tone, … })
│  │  ├─ kit.js            primitive di disegno (squadratura, quote, tratteggi, testi)
│  │  └─ floorplan · building · survey · axon · brand · web · misc
│  ├─ client/              JavaScript del browser, un modulo per ambito
│  │  ├─ chrome.js         header, sottomenu, menu mobile, avanzamento, transizioni
│  │  ├─ pebble.js         tasti «sasso»: inclinazione verso il puntatore, stato premuto
│  │  ├─ mascot.js         mascotte: occhi che seguono il puntatore, si incrociano sul naso, sbattono, si guardano intorno
│  │  ├─ puppet.js         burattini: pezzi su molle da tirare col puntatore, occhi indipendenti, il carattere di airone, gazza e vespa
│  │  ├─ motion.js         reveal, contatori, parallasse, cursore, elementi magnetici, anteprime
│  │  ├─ sections.js       hero, carosello dei siti, timeline del metodo, indice laterale
│  │  ├─ jelly.js          /studio/: le icone «gelatina» degli strumenti, su molle (gonfia, piega, schiaccia, rimbalza), nome al tocco
│  │  ├─ ink.js            l’aragosta della home e l’inchiostro del cognome: burattino, simulazione del liquido, gocce (solo in home)
│  │  ├─ filters.js        filtri del portfolio (stato nell’URL)
│  │  ├─ widgets.js        lightbox, confronto prima/dopo, copia negli appunti
│  │  ├─ form.js           validazione e invio del modulo contatti
│  │  ├─ phone.js          tastierino dell’iPhone nella pagina Contatti: ricompone il numero quando entra nello schermo
│  │  ├─ canvas.js         piano della pagina Stile: zoom, spostamento, tavole inquadrate e animate, griglia in WebGL
│  │  ├─ viewer.js         visualizzatore delle tavole: zoom, spostamento, gesti, tastiera, schermo intero, barra di scala, coordinate, mappa
│  │  ├─ gl-sheet.js       il foglio disegnato dalla scheda grafica (WebGL 2): shader, buffer, un fotogramma in quattro chiamate
│  │  ├─ dwg-sheet.js      la strada di riserva senza WebGL: il DWG su canvas 2D, worker, canvas base e di dettaglio
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
│  │  ├─ render.js         disegno della scena su canvas 2D (strada di riserva), impaginazione dei testi
│  │  └─ worker.js         scarica, legge e prepara il disegno fuori dal thread della pagina
│  ├─ gpu/                 dal disegno ai dati per la scheda grafica (vedi «Tavole vere»), nel worker
│  │  ├─ format.js         il formato dei tre elenchi: tratti, triangoli, lettere
│  │  ├─ tess.js           riempimenti qualunque → triangoli; segmenti ritagliati da un contorno
│  │  ├─ sdf.js            atlante delle lettere come campo di distanze
│  │  ├─ pack-dwg.js       dalla scena del DWG: archi veri, tratteggi ritagliati, testi lettera per lettera
│  │  └─ pack-svg.js       dalle tavole da PDF (SVG di pdftocairo): tracciati, ritagli, lettere, ordine di disegno
│  ├─ styles/              token → base → componenti → tasti (pebble) → mascotte (mascot) → layout → pagine → stampa; a parte stile, viewer, email
│  ├─ main.js              entry JavaScript: avvia i moduli client (piano, visualizzatore ed email a richiesta)
│  └─ style.css            entry CSS: importa src/styles/* nell’ordine giusto (tranne i fogli delle pagine speciali)
├─ vite.config.js
├─ vercel.json             URL puliti, cache, intestazioni di sicurezza
└─ package.json
```

## Pagine generate

| Percorso | Pagina |
| --- | --- |
| `/` | Home: hero con l’invito, il terminale dei mestieri e i siti online, progetti in evidenza, servizi, studio, numeri |
| `/portfolio/` | Indice completo con filtri (categoria, anno, settore, tecnologia, tipologia) |
| `/portfolio/tecnico/` · `/portfolio/web/` | Le aree pubblicate (Grafica è nascosta, vedi [Progetti](#progetti)) |
| `/portfolio/<slug>/` | Case study in nove sezioni, uno per ogni progetto in `projects.js` |
| `/servizi/` | Servizi per area (A tecnico, B digitale, C grafica, D informatica), con ciò che viene consegnato; pacchetti e FAQ |
| `/servizi/informatica/` | L’assistenza informatica sul serio: i servizi dell’area D in quattro gruppi, le versioni di Windows (XP → 11, LTSC, ARM64, Server) e di Office (Click-to-Run, installazione personalizzata, MSI, Mac), l’installazione di Windows o Office in regalo al primo intervento sopra i 50 € (il lavoro, non la licenza), come si svolge un intervento, regole, FAQ e invito con telefono, WhatsApp e modulo (`/contatti/?tipo=Assistenza%20informatica#modulo` preseleziona la voce). Dati in `src/data/informatica.js`, servizi in `src/data/services.js` (campo `group`) |
| `/metodo/` | Le sette fasi del lavoro |
| `/studio/` | Chi sono: biografia, ritratto, timeline, approccio, valori, strumenti; sotto gli strumenti «Con cosa gira» questo sito: diciannove icone sfalsate che si accavallano e fanno da gelatina al passaggio e al tocco, col nome e cosa fa in un fumetto (`src/data/stack.js`, `src/client/jelly.js`, caricato solo qui); in fondo «Tempo libero» (Better Call Saul, bettercallpekko.it e la legenda dei suoi riferimenti, spiegati con parole nostre: niente battute della serie citate alla lettera) e le domande personali (serie TV, natura e animali, veicoli, vacanze, amici). Testi in `src/data/tempo-libero.js`, compilati da Alberto nel documento «Studio — tempo libero e FAQ personali»: una risposta vuota non compare, le righe della legenda con `ok: false` aspettano la sua conferma, e finché ne mancano la build le elenca tra i segnaposto |
| `/studio/profilo/` | Curriculum sintetico, stampabile |
| `/contatti/` | Modulo di contatto, recapiti, telefono (un iPhone con il numero sul tastierino), area operativa |
| `/portfolio/tavole/` | Il visualizzatore di tutte le tavole vere, raggruppate per progetto; `#<slug>-<NN>` apre una tavola precisa. Esiste con `showSheets = true` (vedi [Tavole vere](#tavole-vere)) |
| `/stile/` | Il sistema visivo in cinque tavole (home a 1440 px, colore, tipografia, forma e movimento, componenti) su un piano con zoom e spostamento, come in un programma di disegno |
| `/wrapped5BT/` | Il Wrapped 5BT: frame 9:16 con 74 slide verticali a scatto sulla chat di classe (nove capitoli, ognuna col pannello «Come si calcola»), contenuti da `src/data/wrapped.js` e numeri da [`tools/wrapped`](tools/wrapped/README.md). Fuori da menu, sitemap e indicizzazione |
| `/privacy/` · `/cookie/` | Note legali |
| `/crediti/` | Crediti e fonti delle immagini (testi in `src/data/crediti.js`), linkata nel footer |
| `/assistenza/` | «Better Call Pekko»: l’assistenza informatica come il sito americano del 2008 di un «computer guy at law», tutto in inglese — 960 px fissi, colonna blu coi tasti gialli, video di consulenza, annunci di aziende che non esistono, profilo «About Pekko» in stile MySpace, listino 2009, forum phpBB, telefonini e provider del 2009, pagamenti e donazioni PayPal, e-card, coupon, commenti in stile SMS, webcam coi filtri brutti, colonne pubblicitarie ai lati dello schermo, pop-up d’ingresso; Alberto qui si chiama **Pekko** e il nome vero resta solo nel credito del footer. Pagina **autonoma** (`standalone` in `routes.js`): niente guscio del sito, stile e script in linea in `src/templates/pages/assistenza.js`; contenuti in `src/data/assistenza.js`, immagini da [`tools/assistenza`](tools/assistenza/README.md). Ogni banner porta a `/contatti/assistenza/`, tranne quelli della sezione **«Pekko makes websites»** (dal 29.09.2026), che portano ai siti veri: Pekko Explorer 6 (un browser del 2008 con una scheda per sito e la cattura vera da scorrere), gli annunci dei siti, l’infografica del metodo, servizi web, FAQ, «other stuff» (disegno, 3D, grafica), webring e bottoni 88×31; nella colonna destra «DID U KNOW???» con fatti veri; codice Konami (o cinque clic sulla tartaruga) per il segreto |
| `/contatti/assistenza/` | I contatti dell’assistenza, stesso stile e stessa lingua: telefono, WhatsApp, email e un modulo che parla con `api/contatti.js` come quello di `/contatti/` (`modulo: 'assistenza'`, voci in inglese per tipo di guaio e urgenza) |
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
| modificare versioni, regalo, passaggi e FAQ dell’assistenza informatica | `src/data/informatica.js` |
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
- `sheets`: le tavole vere (DWG, PDF, relazioni) da sfogliare nel visualizzatore. Si vedono solo con `showSheets = true`: allora nel case study, prima della galleria, c'è la sezione **Tavole** e il progetto compare in `/portfolio/tavole/`. Vedi [Tavole vere](#tavole-vere).
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

Le cartelle `lavoro/` degli strumenti (fogli e candidate di gpt-image-2, esclusi da Git) di copertine, figurine, mascotte e cartina, e le vecchie versioni dei banner di Pekko (`tools/assistenza/lavoro/vecchie/`), sono state archiviate il 29.09.2026 fuori dal repository, in `Documents\AP-archivio\lavoro-2026-09-29\`: servono solo per rifare un ritaglio da un foglio già pagato. Gli strumenti ricreano `lavoro/` da soli alla prossima generazione.

### Tavole generate (segnaposto)

Ogni voce di `images` può essere una **tavola generata**, un disegno vettoriale prodotto in build da `src/art/`:

```js
{ art: 'floorplan', variant: 'rustico', code: 'AP-25-011', alt: '…', caption: 'TAV. 02 — …' }
```

Tavole disponibili: `floorplan`, `elevation`, `section`, `pointcloud`, `ortho`, `cadastral`, `urban`, `sitelayout`, `canopy`, `bim`, `render`, `workspace`, `portrait`, `areamap`, `webpage`, `brandmark`, `restyle`, `stationery`, `poster`, `social`, `brochure`, `packaging`, `signage`, `icons`, `slides`, `titleblock`, `identity`, `sitespec`. Opzioni comuni: `variant`, `tone` (`paper` | `ink` | `tint`), `bare` (senza squadratura), `code`.

`identity` (`src/art/identity.js`) non è un segnaposto: è l’identità di questo sito con la costruzione quotata, e sta nella scheda «Grafica» della home. Quattro `variant`: `fogli` (tre fogli: marchio, icona, logotipo), `tavola` (il monogramma su un foglio da geometra), `notte` (il monogramma su fondo inchiostro, con i punti notevoli), `sistema` (marchio, colori, caratteri, logotipo, icona, spazi). Le misure sono copiate da `MARK` in `ui.js`, da `public/favicon.svg`, da `.logo` in `layout.css` e da `tokens.css`: se cambiano là, vanno aggiornate anche nella tavola.

`sitespec` (`src/art/sitespec.js`) fa lo stesso per il sito: il primo schermo della home ridisegnato in vettoriale e quotato, nella scheda «Digitale» della home. Quattro `variant`: `schermi` (desktop, tablet e telefono nella stessa scala), `rilievo` (il primo schermo a 1440 px su un foglio da geometra), `scala` (le formule `clamp()` dei caratteri come grafico), `sistema` (pagina, caratteri, margini, movimento, altezze delle sezioni). I numeri di `HOME` e `SECTIONS` vengono da un rilievo della pagina nel browser, con la data scritta nella tavola: quando l’hero o la testata cambiano, vanno rimisurati.

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

**Si mostrano**, dal 2 ottobre 2026 (richiesta di Alberto: «mostra nei progetti il
visualizzatore DWG e PDF»): nel case study la sezione **Tavole** con il visualizzatore,
subito prima della galleria delle illustrazioni, più la pagina `/portfolio/tavole/` e
la sua voce nel menù. `showSheets` in `src/data/projects.js` è l'interruttore: dal 26
settembre al 2 ottobre era spento («mai mostrare i documenti»). Spento, i progetti
escono senza `sheets`, il case study ha solo la galleria di `images` (le illustrazioni
di [`tools/copertine`](tools/copertine/README.md)), la pagina `/portfolio/tavole/` non
viene generata e la voce «Tavole» sparisce dal menù.

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
disegno). Una tavola è un riquadro dello spazio modello:
`sheet(slug, 'NN', { dwg: 'file.dwg', box: [x0, y0, x1, y1], darken })`, con il
riquadro in unità del disegno (`h` si ricava da solo). `darken` scurisce i colori
chiari pensati per lo sfondo nero di AutoCAD; `paper` (A3, A4…) dà la larghezza del
foglio, da cui gli spessori di linea in millimetri. Lo stesso DWG serve più tavole:
viene scaricato e letto una volta sola, in un worker, e ogni foglio ne mostra il suo
riquadro.

**Le disegna la scheda grafica.** Tutte le tavole vettoriali — i DWG e quelle da PDF —
passano da un motore WebGL 2 scritto apposta (`src/gpu/` nel worker,
`src/client/gl-sheet.js` nella pagina), senza librerie. Il worker prepara tre elenchi
già pronti per i buffer della scheda: i **tratti** (un rettangolo per segmento o per
pezzo d'arco: lo shader calcola per ogni pixel la distanza dalla linea, quindi bordi
sfumati esatti, estremità tonde, tratteggi, e archi veri, non spezzate), i
**triangoli** dei riempimenti (scomposti a fasce da `tess.js`, con buchi e contorni
intrecciati; li sfuma il multicampionamento, 8× o 4×) e le **lettere** (un atlante di
campi di distanze fatto con i caratteri del sistema: nitide a qualunque ingrandimento).
Le tavole da PDF sono gli SVG di `pdftocairo` letti da `pack-svg.js`; l'ordine dei
tracciati fa da profondità, così un bianco copre le linee venute prima. Ogni
fotogramma ridisegna tutta la tavola alla risoluzione dello schermo in quattro
chiamate: sul computer di sviluppo (RTX 3060 Ti) circa 3 ms, anche a 5120 px di
larghezza, cioè non perde un fotogramma a 165 Hz e la tavola resta nitida **mentre**
si ingrandisce. Prima ogni zoom lasciava l'immagine sfocata per 650–800 ms, il tempo
di ridisegnarla. Le linee più sottili di un pixel restano larghe un pixel e si
schiariscono in proporzione, senza scendere sotto il 72%: le tavole da PDF, che nel
browser erano quasi invisibili da lontano, si leggono come sulla carta.

Senza WebGL 2, o se un file non si lascia preparare (un SVG con dentro altro, un
browser senza `OffscreenCanvas` nei worker), c'è la strada di prima: il foglio si
muove con `transform` e, a vista ferma, prende la misura vera e il browser ridisegna
l'SVG (o `dwg-sheet.js` il DWG su canvas 2D: base a 2048 px più la parte visibile alla
scala dello schermo). Le pagine a immagine (la relazione) sono sempre `<img>`.

Il visualizzatore (`src/templates/components/viewer.js` e `src/client/viewer.js`) è una
finestra di programma, parente del terminale della home: barra del titolo con il nome
del file e la spia «gpu» (al passaggio dice quanti tratti e triangoli sta disegnando),
strumenti in una pillola, e sul piano la **barra di scala** (metri veri se la tavola
ha `scale`, o `unit: 'm'` per un riquadro DWG; altrimenti millimetri di foglio), le
**coordinate** del disegno sotto il puntatore per i DWG e, da ingrandito, la **mappa**
della tavola con il riquadro di ciò che si vede, da trascinare. Trascinare sposta (e
lasciato in corsa il foglio scivola ancora un po'), Ctrl + rotella o due dita
ingrandiscono, il doppio clic avvicina, le frecce cambiano tavola, F adatta; c’è lo
schermo intero. Nei case study la rotella e il dito scorrono la pagina finché la
tavola non è ingrandita. Senza JavaScript l’elenco apre il file stesso (il DWG o
l’SVG).

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

I mockup usano cinque immagini per progetto in `public/media/web/`, catturate con Chromium headless e convertite in WebP:

| Chiave | Viewport | File |
| --- | --- | --- |
| `web.desktop` | 1440×900 | 1200×750 |
| `web.desktopTall` | pagina intera, tagliata a 3400 px | 1200×2833 |
| `web.tablet` | 820×1180 | 720×1036 |
| `web.mobile` | 390×844 @2x | 600×1298 |
| `web.mobileTall` | pagina intera, tagliata a 2600 px | 600×4000 |

Le versioni `Tall` scorrono al passaggio del puntatore. Prima dello scatto: animazioni disattivate, `prefers-reduced-motion` emulato, tutta la pagina fatta scorrere perché reveal e immagini pigre partano, immagini e tessere delle mappe caricate.

**Si aggiornano da sole.** Le catture di Rivalta, Cascina Fontana, Dario Donelli e di questo sito (home, gallerie delle pagine interne, strisce dell’iPhone) le fa [`tools/catture`](tools/catture/README.md): ogni ora il workflow `.github/workflows/catture.yml` guarda se l’HTML dei siti online è cambiato e, se sì, li rifotografa e fa un commit con le immagini nuove (solo quelle che si vedono diverse). Misure e versione dei file stanno in `src/data/catture.js` (generato): `shot()` in `projects.js` ne prende larghezza e altezza e aggiunge `?v=<impronta>` all’indirizzo, così dopo un aggiornamento i browser non mostrano la copia vecchia rimasta in cache. Per aggiungere un sito o una cattura si tocca `tools/catture/siti.js`.

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

La pagina intera di `iphone.pages` (`public/media/web/ap-iphone-01.webp`, `-02`…) è una cattura della home online con un viewport di 402×812 a 2x (Chromium, user agent di iPhone, `prefers-reduced-motion` emulato, tutta la pagina fatta scorrere prima dello scatto perché le immagini si carichino), scattata a strisce con `clip` e `captureBeyondViewport` (oggi cinque, 804×4652) e convertita in WebP (qualità 78). Le strisce restano sotto i 16.384 px: oltre quel limite Chromium ripete i pezzi di pagina in una cattura unica. La rifà da sola `tools/catture` quando cambia la home: `strisce('ap-iphone', alt)` in `projects.js` prende numero e altezze delle strisce da `src/data/catture.js`.

### Figurine

Servizi, fasi del metodo (in `/metodo/` e in home), lavori trasversali, strumenti dello studio, le parti sul web (sezioni 02 e 03 della home, `/portfolio/web/`, case study dei siti), contatti e 404 hanno una piccola illustrazione scontornata: `figurina(nome)` in `ui.js`, file in `public/media/figurine/`, misure in `src/data/figurine.js` (generato). Nascono da [`tools/figurine`](tools/figurine/README.md): un’immagine di gpt-image-2 con nove figurine, ritagliate in automatico. Un nome senza file non disegna nulla. Dallo stesso strumento vengono le **sagome dei tasti** (`tasto-*.webp`, foglio `tasti`, senza bordo adesivo e con ritagli fino a 960 px) e le **mini immagini del piè di pagina** (`chrome-*.webp`: busta, telefono, mappa, calendario, macchina fotografica, scatola del codice, cartello «torna su», lucchetto, quadro; foglio `chrome2`: biscotto dei cookie, ventaglio di campioni dello stile).

### Mascotte

La **chiocciola gigante africana** e la **tartaruga di terra**, gli animali di Alberto, custodiscono il sito: la testa della chiocciola accanto al marchio nella testata, tutte e due — come burattini a pezzi — ai lati della firma nel piè di pagina; la tartaruga è stata rifatta da zero il 1º ottobre 2026, di profilo e con l’elmetto, e intera compare solo in «Better Call Pekko». Sono due immagini di gpt-image-2 (`public/media/mascotte/`) fatte da [`tools/mascotte`](tools/mascotte/README.md), che trova gli occhi da solo e scrive `src/data/mascotte.js`; il naso si segna a mano. `mascot(nome, { crop })` in `ui.js` mette sopra l’immagine gli occhi del sito e `src/client/mascot.js` li muove: ogni pupilla segue il puntatore per conto suo, sul naso gli occhi si incrociano e la mascotte vibra, ogni tanto sbattono le palpebre e senza puntatore (telefono, mouse fermo) si guardano intorno.

Accanto a loro, nel piè di pagina, tre **burattini di carta**: l’**airone** elegante (a sinistra), la **gazza** furbissima (a destra) e la **vespa** cattiva ma precisa, che si libra sopra la firma; sul telefono stanno in una fila sopra la firma. Ogni animale è fatto di pezzi separati (corpo, testa, collo, ali, zampe, coda, addome, antenne) uniti da fermacampioni: `tools/mascotte/burattini.mjs` fa disegnare a gpt-image-2 l’animale intero e poi lo stesso smontato, separa i pezzi e trova i perni (i fermacampioni dorati) e gli occhi (`src/data/burattini-pezzi.js`); il montaggio si scrive a mano in `src/data/burattini.js`. `puppet(nome)` in `ui.js` annida i pezzi (dietro o davanti al genitore) e `src/client/puppet.js` li muove su molle: collo, testa e pungiglione si voltano verso il puntatore, zampe, ali, code e antenne si tirano col mouse o col dito e ricadono oscillando, gli occhi seguono il puntatore ciascuno per conto suo (e senza puntatore vagano ognuno per sé). Il carattere: l’airone, toccato, fa l’inchino; la gazza muove la testa a scatti, gira il becco con la chiave se ti avvicini e, toccata, fa l’occhiolino; la vespa punta il pungiglione dove sei, si arrabbia se ti avvicini e, toccata, punge.

### L’hero sotto il nome (home)

Sotto il nome e il righello, su carta a puntini, l’hero parla al cliente (rifatto il 2 ottobre 2026; markup in `hero()` e `heroTerminal()` di `src/templates/pages/home.js`, stili in `home.css`, script `initHero` in `sections.js`):

- **L’invito**, a sinistra: la riga di commento `// casa · sito · marchio`, il luogo comune «Servono tre professionisti.» sbarrato col pennarello minio (un elemento `<s>`, una riga per colpo) e timbrato «Falso», la risposta «Ne basta uno.», il tasto «Parliamo del progetto», il tasto che copia l’indirizzo email (anche premendo **C** finché l’hero è in vista; se gli appunti non sono disponibili apre il programma di posta) e tre garanzie prese da Servizi e Metodo.
- **Il terminale**, a destra: `alberto.sh` con cinque comandi (`heroCommands()`: tutto, casa, sito, marchio, pc), quattro righe di fatti ciascuno e il rimando alla pagina dove continuare. I comandi girano da soli ogni 6,5 s (la barra sotto la voce attiva dice quanto manca), si fermano col puntatore sopra, col fuoco dentro e fuori schermo, e smettono quando il visitatore ne sceglie uno; il comando si scrive un carattere alla volta, poi escono le righe. Ogni comando ha il suo **adesivo** (`hero-*.webp`, foglio `hero` di [`tools/figurine`](tools/figurine/README.md)) appoggiato sull’angolo. Senza script resta il primo comando; con «riduci movimento» non gira e non si scrive.
- **I siti online**, in fondo: una card per ogni sito pubblicato (`heroSites()`), con la cattura vera, il dominio e lo stato; si aprono in una nuova scheda, tranne questo sito, che rimanda alla sua scheda («Sei qui»).

`tools/catture` prima di fotografare la home clicca `[data-hero-go="0"]`: il primo comando deve restare quello.

### L’aragosta e l’inchiostro (home)

Nella prima schermata della home un’**aragosta di fiume** rossa (il gambero rosso del Mincio) dorme sopra «Disponibile per nuovi incarichi», col suo annaffiatoio azzurro accanto. Quando il visitatore sta fermo per poco più di due secondi (niente puntatore, scroll, tasti o tocchi) si sveglia di colpo — salto, colpo di coda, «!» — e versa inchiostro nella prima i di «Pecchini»: in meno di tre secondi il cognome è pieno. Il cognome è un recipiente unico: l’inchiostro corre sul fondo da una lettera all’altra e sale in tutte insieme. Dopo cinque secondi pieno comincia a perdere, goccia a goccia dal fondo delle lettere sul righello, e l’aragosta torna a versare, all’infinito; una volta riempito non scende mai sotto la metà. Se l’hero esce dallo schermo si riaddormenta (e il cognome perde fino a metà), un tocco la sveglia subito; con «riduci movimento» dorme e basta.

- **Il liquido** è simulato davvero (`Liquid` in `src/client/ink.js`): acqua bassa su una griglia di colonne, 1 px = 1 mm e g = 9,8 m/s², flussi conservativi, così fa onde, sciaborda quando si scorre la pagina (l’accelerazione dello scroll lo spinge di lato) e quando il puntatore ci passa sopra, e si calma da solo. Tutto è in un SVG sopra l’hero: il contorno del cognome è un `<text>` con lo stesso carattere e le stesse misure dell’HTML, che nel frattempo nasconde il proprio (`.is-inked`), e il liquido è ritagliato dalla stessa parola. Il ciclo si ferma quando l’hero non si vede.
- **L’aragosta** è un burattino di carta come quelli del piè di pagina, ma con un montaggio suo: pezzi e pose in `src/data/aragosta.js`, immagini in `public/media/aragosta/`, fatte da [`tools/aragosta`](tools/aragosta/README.md). Occhi, palpebre, il getto (una parabola dal beccuccio all’apertura della I) e le gocce li disegna il codice.
- **Anche in /stile/**: la tavola «Mascotte e burattini» ha una fascia per l’aragosta con una scena sua (etichetta, «Pecchini» a 160 px, righello) che funziona come quella della home: `ink.js` monta una scena per ogni `[data-ink]` e riporta le misure a 1:1 anche quando il piano è ingrandito; spostare il piano fa sciabordare l’inchiostro.
- **Markup**: `data-ink` sull’`hero__wrap`, `data-ink-word` sul cognome, `data-ink-bed` sull’etichetta della disponibilità (per questo ora si vede anche sul telefono), `data-ink-rule` sul righello dove cadono le gocce. Il modulo si carica solo in home (`onDemand` in `main.js`). In locale `window.__ink` dice stato e livello e con `__ink.go('versa')` salta a uno stato.

## Fonti delle immagini

Le stesse informazioni sono pubblicate nella pagina [`/crediti/`](https://www.albertopecchini.it/crediti/), linkata nel footer (`src/data/crediti.js`). Quando entra un’immagine di provenienza nuova, va aggiunta in tutti e due i posti.

| Immagini | Dove stanno | Fonte |
| --- | --- | --- |
| Copertine e gallerie dei progetti non web (strada, bar-caffetteria, cantiere, tettoie, museo) | `public/media/progetti/<slug>/copertina.webp`, `vista-NN*.webp` | Generate con **openai/gpt-image-2** (OpenAI) su [Replicate](https://replicate.com/openai/gpt-image-2), con le tavole originali o le fotografie del museo come riferimento — [`tools/copertine`](tools/copertine/README.md) |
| Illustrazione dell’assistenza informatica | `public/media/servizi/informatica/copertina.webp` | Generata con **openai/gpt-image-2** su Replicate — [`tools/copertine`](tools/copertine/README.md) (voce `informatica`) |
| Figurine, adesivi dell’hero della home (`hero-*.webp`), sagome dei tasti (`tasto-*.webp`), mini immagini del piè di pagina (`chrome-*.webp`) | `public/media/figurine/` | Generate con **openai/gpt-image-2** su Replicate — [`tools/figurine`](tools/figurine/README.md) |
| Mascotte: chiocciola gigante africana e tartaruga di terra | `public/media/mascotte/` | Generate con **openai/gpt-image-2** su Replicate — [`tools/mascotte`](tools/mascotte/README.md); gli occhi mobili sono disegnati dal codice del sito |
| Burattini: airone, gazza, vespa | `public/media/mascotte/{airone,gazza,vespa}/` | Generati con **openai/gpt-image-2** su Replicate (l’animale intero con le due mascotte come riferimento di stile, poi i pezzi con l’intero come riferimento) — [`tools/mascotte`](tools/mascotte/README.md); montaggio, occhi e movimenti sono del codice del sito |
| Aragosta di fiume della home (con l’annaffiatoio) | `public/media/aragosta/` | Generata con **openai/gpt-image-2** su Replicate (intera con la chiocciola come riferimento di stile, poi i pezzi con l’intera come riferimento) — [`tools/aragosta`](tools/aragosta/README.md); montaggio, occhi, getto, inchiostro e gocce sono del codice del sito |
| Ingredienti e annunci di «Better Call Pekko» (/assistenza/) | `public/media/assistenza/` | Gli ingredienti (ritagli di Alberto in completi sgargianti e da web designer, balli per le silhouette, foto stock finte, icone lucide «Web 2.0», oggetti, avatar, quattro sfondi) sono generati con **openai/gpt-image-2** su Replicate, il volto dalla fototessera data come riferimento; gli annunci `ad-*` sono composti a strati in HTML da [`tools/assistenza`](tools/assistenza/README.md) (testo, starburst e nastri del sito) e fotografati con il browser headless; i banner `ad-web-*` e i bottoni `btn-*` (88×31) sono disegnati in vettoriale nel canvas di **Claude Design** e resi da `tools/assistenza/design.mjs`; le GIF montano i fotogrammi con ffmpeg; `shot-bcp.webp` è una cattura della pagina stessa |
| Fondo della carta dell’area operativa (/contatti/) | `public/media/mappa/area-operativa.webp` | Generato con **openai/gpt-image-2** su Replicate dal riferimento di lago e fiumi di `areamap({ solo: 'acque' })`; reticolo, raggi, città, nomi e scala restano vettoriali, da `areamap({ base })` in `src/art/misc.js` — `tools/cartina/cartina.mjs` |
| Ritratto e avatar | `public/media/studio/fototessera*.webp` | Fototessera di Alberto Pecchini, scontornata con bria/remove-background su Replicate (volto non ritoccato) |
| Figura scontornata di /studio/ | `public/media/studio/curioso-*.webp` | Fotografia di Alberto Pecchini, scontornata con l’IA su Replicate |
| Fotografie del museo | `public/media/progetti/museo-mestieri-del-fiume/` | Scattate durante l’uscita del 15.11.2025; le due fotografie d’epoca (60, 61) riprendono materiale esposto nel museo |
| Tavole (nel visualizzatore; riferimento delle illustrazioni) | `public/media/tavole/` | Elaborati originali di Alberto Pecchini (AutoCAD LT), I.T.T. «Carlo d’Arco» |
| Disegni dei progetti dimostrativi, piante e marchi di esempio | `src/art/` → `/art/<slug>.svg` | Disegnati dal codice del sito |
| Icone degli strumenti di /studio/ | `src/data/stack.js` (SVG in linea) | Tracciati di [Simple Icons](https://simpleicons.org) (CC0; VS Code e OpenAI dalla versione 10, poi tolti dalla raccolta); Figma a colori ridisegnato a mano. I marchi restano dei titolari |
| Screenshot dei siti | `public/media/web/` | Catture dei siti di Alberto Pecchini |
| MacBook, iPad, iPhone | `public/media/mockup/` | File della Figma Community [Device Mockups (iMac, Macbook, iPad, iPhone)](https://www.figma.com/community/file/1172125330560103197/device-mockups-imac-macbook-ipad-iphone), licenza CC BY 4.0 |
| iPhone 18 Pro (case study di questo sito, /contatti/) | `public/media/mockup/iphone-18-pro.svg` | [IPhone 18 Pro Vector.svg](https://commons.wikimedia.org/wiki/File:IPhone_18_Pro_Vector.svg) di Rafael Fernandez, Wikimedia Commons, licenza CC BY-SA 4.0; il credito compare sotto ogni telefono (`iphoneCredit()`) |
| Icone, monogramma, firma, favicon, `og.png` | `public/`, `ui.js` | Disegnati per il sito |
| Caratteri | `@fontsource/*` | Archivo, Cascadia Code, Instrument Serif — SIL Open Font License |

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

`src/style.css` importa i fogli in quest’ordine: `fonts` → `tokens` → `base` → `art` → `components` → `pebble` → `mascot` → `layout` → `home` → `portfolio` → `pages` → `print`. I fogli delle pagine speciali — `stile.css` (il piano di `/stile/`), `viewer.css` (le tavole vere), `email.css` (`/email/`) e `wrapped5bt.css` (`/wrapped5BT/`) — sono entry a parte: il plugin li collega, dopo il foglio comune, solo alle pagine che contengono il loro segno (`data-canvas`, `data-viewer`, `data-email`, `data-wrapped`; `PAGE_CSS` in `plugins/site-pages.js`). Le altre pagine scaricano un quarto di CSS in meno.

`/wrapped5BT/` è il frame 9:16 del Wrapped 5BT: le slide arrivano da `src/data/wrapped.js` (i numeri, a monte, da [`tools/wrapped`](tools/wrapped/README.md)), lo scorrimento a scatto è nativo e `src/client/wrapped.js` aggiunge avanzamento, contatore, tastiera e tocco. Ogni slide è una pila di blocchi (numero grande, barre, colonne, tabella, fumetto della chat, schede…) più la chiusa «In breve» e il pannello «Come si calcola» con definizioni e limiti del dato: i tipi sono elencati in testa a `src/data/wrapped.js`. Dentro al frame le misure sono in `cqi`, così il testo scala col riquadro. Resta `noindex` e fuori dalla sitemap; con `stato` diverso da `'pronto'` si vede la tela in attesa con le guide.

- **Token** (`tokens.css`): palette carta / inchiostro / minio (`#E5481F`), scala tipografica, spazi, raggi, durate ed easing. È il primo file da aprire per cambiare l’aspetto.
- **Caratteri**: Archivo Variable (asse `wdth`) per i testi, Cascadia Code (`--font-mono`, variabile sul peso 200–700, `@fontsource-variable/cascadia-code`; dal 2 ottobre 2026 al posto di IBM Plex Mono) per etichette, tasti, dati e il terminale della home, Instrument Serif per gli accenti in corsivo. Ospitati localmente via `@fontsource`, nessuna richiesta a Google Fonts.
- **Reveal** (`base.css`): `data-reveal` con i tipi `fade`, `up`, `clip`, `line`, `draw`, `words`; tutto disattivato con `prefers-reduced-motion`. Più in basso le rivelazioni partono con l’IntersectionObserver di `motion.js`; nel **primo schermo** (la testata di ogni pagina: `.hero`, `.phead`, `.cs-hero`, `.shero__grid`, `.cnt__intro`, `.nf`) sono invece animazioni CSS che partono al primo disegno, senza aspettare lo script: titolo e testo grande arrivano subito anche su una rete lenta. Lo stesso elenco sta in `FIRST_SCREEN` (`motion.js`). Dopo la tendina d’ingresso (classe `nav-in`) aspettano che la tendina si stia alzando.
- **Tutto minuscolo** (dal 2 ottobre 2026): `body { text-transform: lowercase }` in `base.css`, iniziali e sigle comprese. Nell’HTML il testo resta scritto normale (titoli della scheda, motori di ricerca e lettori di schermo lo leggono come si scrive); quello che il visitatore scrive nei campi resta com’è, i segnaposto sono minuscoli. Non si usa mai `text-transform: none`, che riporterebbe le maiuscole. Etichette e tasti in Cascadia Code a 14 px (`--fs-label` 0,875rem, `--track-label` 0, peso 400). Il nome in testata è «alberto pecchini» a tutta larghezza, con il posto sotto per la coda della p: `ink.js` legge le lettere come appaiono (anche il `text-transform` calcolato), prende le aste dalla tabella `STEM` (in em, misurate sul carattere a larghezza 86%) e fa nascere ogni goccia dal fondo della sua lettera. Fanno eccezione le pagine di Better Call Pekko (fuori dal foglio comune) e il compositore email (`.em`, dove si scrivono email vere).
- **Movimento**: durate `--t-1`…`--t-4` = 0,15 · 0,3 · 0,55 · 0,8 s, easing `--ease-out` per gli ingressi. Tendina tra le pagine: esce in 0,34 s (si naviga a 0,36 s), rientra in 0,5 s. Gli inseguimenti (cursore, anteprima, inclinazione dell’hero) usano `damp()` di `utils.js`, che dà la stessa velocità a 60 e a 120 Hz. Niente `will-change` permanenti, tranne dove un elemento si muove di continuo.
- **Header e footer** (`layout.css`): tutti e due centrati e simmetrici su una griglia `1fr auto 1fr`, con il marchio in mezzo. Nella testata: tre voci · chiocciola e marchio · due voci e invito (sotto i 1100 px: menu · marchio · contatti). Nel piè di pagina, dall’alto: invito e due tasti, fila delle pagine, firma custodita dalle due mascotte e dai tre burattini, recapiti con le mini immagini, note legali con il credito «Sito di Alberto Pecchini», torna su. Palette scoperta su `footer.site-footer`.
- **Tasti «sasso»** (`pebble.css`, markup da `pebble()` in `ui.js`): la sagoma irregolare è un’immagine di gpt-image-2 (`public/media/figurine/tasto-*.webp`) stirata sul tasto; sotto c’è lo spessore (la stessa sagoma come maschera, piena di un colore d’ombra, spostata di `--pb-depth`). Al passaggio la faccia si solleva e il tasto si inclina verso il puntatore (`--tx`/`--ty` da `pebble.js`), premendo scende sullo spessore. Tre toni (carta, minio, inchiostro), tre misure, la variante tonda per la sola icona; senza sagoma ritagliata la forma è disegnata in CSS.
- **Mascotte** (`mascot.css`, markup da `mascot()` in `ui.js`): sopra l’immagine, ai centri segnati in `src/data/mascotte.js`, stanno due occhi del sito (disco bianco, pupilla mossa da `--px`/`--py`, palpebra del colore della pelle) e la zona del naso; `.masc--crop` mostra un ritaglio (la testa della chiocciola in testata, sfumata in basso da una maschera).
- **Burattini** (`mascot.css`, markup da `puppet()` in `ui.js`): ogni `.pup__part` è il riquadro di un pezzo, messo in percentuale del genitore e girato intorno al perno (`--o`); i pezzi dietro al genitore hanno `z-index` negativo e restano sotto la sua immagine perché ogni pezzo isola il proprio impilamento. Gli occhi sono quelli delle mascotte; la vespa ha le palpebre inclinate e le ali che frullano.
- **Stile** (`stile.css`): il piano navigabile della pagina `/stile/` e le sue tavole, a misure fisse in px (sono fogli inquadrati dalla finestra, non layout fluidi).
- **Visualizzatore** (`viewer.css`): le tavole vere, nel case study, nella pagina `/portfolio/tavole/` e a schermo intero.
- **Stampa** (`print.css`): la pagina `/studio/profilo/` è pensata per essere stampata come curriculum.

## JavaScript del browser

`src/main.js` avvia in sequenza i moduli di `src/client/`; ognuno cerca i propri elementi e, se non li trova, non fa nulla. Un modulo che fallisce non ferma gli altri (l’errore finisce in console con il prefisso `[site]`). Non ci sono dipendenze: niente librerie di animazione, niente polyfill. Il piano di `/stile/` (`canvas.js`), il visualizzatore delle tavole (`viewer.js` con il motore grafico; il lettore DWG sta nel suo worker), il compositore email (`email.js`) e l’aragosta con l’inchiostro della home (`ink.js`) si caricano in pezzi a parte, solo sulle pagine che li contengono (`onDemand` in `main.js`): il JavaScript comune è la metà di prima.

Quel che fa: header che si nasconde scendendo, menu mobile con focus trap, tasti «sasso» che si inclinano e si premono, mascotte con gli occhi che seguono il puntatore (si incrociano sul naso, sbattono le palpebre, si guardano intorno senza puntatore), burattini a pezzi da tirare col mouse o col dito, barra di avanzamento, transizioni tra pagine, reveal allo scorrimento, contatori, parallasse, cursore personalizzato (solo con puntatore fine), elementi magnetici, anteprime flottanti e scorrevoli, filtri del portfolio con stato nell’URL, lightbox, confronto prima/dopo, copia negli appunti, modulo contatti, piano con zoom e spostamento della pagina Stile, visualizzatore delle tavole.

## Build

`npm run build` produce in `dist/`:

```
dist/
├─ index.html · portfolio/index.html · portfolio/<slug>/index.html · …   una cartella per rotta
├─ 404.html
├─ sitemap.xml · robots.txt
├─ assets/          JS, CSS e font con hash nel nome (cache lunga)
├─ art/<slug>.svg   miniature delle copertine generate
└─ favicon, og.png, media/…   copiati da public/, più le versioni ridotte <nome>-<larghezza>w.webp
```

**Immagini responsive** (`plugins/responsive-images.js`): per ogni `<img>` di `/media/` (WebP, JPEG, PNG) scrive in `dist/` le versioni larghe 120, 240, 360, 560, 800 e 1200 px che stanno sotto il 75% dell’originale (la 120 solo per le immagini piccole) e aggiunge `srcset` e `sizes`. Il `sizes` lo dà il template quando sa quanto è grande l’immagine (`figurina()`, `mascot()`, l’avatar dell’hero); altrimenti `auto, 100vw` per le immagini lazy (Chromium sceglie sulla misura vera) e `100vw` per quelle subito visibili. L’anteprima al passaggio negli indici (`data-preview`) prende la versione da 800. In `public/` restano solo gli originali e il dev server serve quelli; il lightbox apre sempre l’originale (o `data-full`). Le versioni si tengono in `node_modules/.cache/ap-varianti/` con l’impronta del file nel nome: una build successiva le ricopia, un’immagine cambiata (le catture rifatte dal bot) si ricalcola da sola. Serve `sharp` (devDependency); senza, le pagine restano com’erano.

**Tavole vere**: sono online solo se una pagina le mostra. Con `showSheets` spento nessuna pagina le cita e `dist/media/tavole/` viene tolta dopo la copia: PDF, DWG e SVG restano nel repository ma non sul sito.

In console la build riporta il numero di pagine e miniature scritte e, se ce ne sono, i **dati ancora segnaposto** dichiarati in fondo a `src/data/site.js` (`placeholders`). Compilato il dato, togliere la voce dalla lista.

## Prima di andare online

- [x] Segnaposto: `placeholders` in `src/data/site.js` è vuoto e la build non segnala più niente. LinkedIn è stato tolto dai social (il link puntava alla homepage del servizio), la fotografia dello studio è stata rimossa insieme alla sua sezione.
- [x] Progetti dimostrativi: non vengono pubblicati (`showSamples: false`), l’area Grafica è nascosta perché ne restava senza. Vanno sostituiti con lavori veri, uno alla volta — vedi [Progetti](#progetti).
- [ ] Rileggere privacy e cookie policy (`src/templates/pages/legal.js`) e aggiornare `site.legal.updated`. Se si aggiungono strumenti di analisi o servizi di terze parti, la cookie policy va aggiornata.
- [ ] Modulo contatti: `site.form.endpoint` punta a `/api/contatti`. Verificare che su Vercel siano impostate le variabili d’ambiente che la funzione si aspetta (`RESEND_API_KEY`, `CONTACT_FROM`, `CONTACT_TO`, `CALLMEBOT_PHONE`, `CALLMEBOT_APIKEY`, `TURNSTILE_SECRET_KEY`) e provare un invio vero in produzione.
- [ ] Antispam: `site.form.turnstileSiteKey` è vuota, quindi il riquadro Turnstile non compare. Compilarla (chiave pubblica, non è un segreto) se il modulo inizia a ricevere spam.
- [x] DNS di albertopecchini.it: il record A del vecchio hosting Aruba (62.149.128.40) è stato tolto il 28.09.2026; il dominio senza www punta solo a Vercel (216.198.79.1).
- [ ] Controllare `public/og.png` e il manifest (`public/site.webmanifest`).

## Pubblicazione

`dist/` è un sito statico e funziona su qualsiasi hosting. Il progetto Vercel `albertopecchini.it` è collegato a questo repository GitHub (`albertoxpecchini/AP`) con **Root Directory** = `albertopecchini.it`, framework Vite, Node 24: ogni push su `main` produce un deploy di produzione, gli altri rami un’anteprima.

Su `main` scrive anche il workflow delle catture (`.github/workflows/catture.yml`, vedi [`tools/catture`](tools/catture/README.md)): quando uno dei siti mostrati nel portfolio cambia, fa un commit con le immagini nuove. Prima di un push conviene quindi un `git pull --rebase`.

Domini di produzione: `www.albertopecchini.it` e `albertopecchini.it` (che rimanda a www con un 308). Gli indirizzi `*.vercel.app` del progetto sono protetti da Vercel Authentication (accesso solo con login Vercel), i domini personalizzati no.

**bettercallpekko.it** è il dominio delle sole pagine «Better Call Pekko» (`/assistenza/` e `/contatti/assistenza/`): un **secondo progetto Vercel** collegato allo stesso repository, con Root Directory `albertopecchini.it` e la variabile d’ambiente `SITE=bcp`. Con quella variabile la build produce solo la parodia alla radice (`/`), i contatti in `/contact/`, una `404.html` sua, `robots.txt` e `sitemap.xml` presi da `public/bcp/` e, di `public/`, soltanto `media/assistenza/`, `media/web/` (le catture dei siti veri, per la sezione «Pekko makes websites»), le due mascotte e le icone (`plugins/site-pages.js`, `bcpRoutes` in `routes.js`; i percorsi li sceglie `src/data/assistenza.js`). Le funzioni di `api/` ci sono anche lì: nel nuovo progetto vanno copiate le variabili del modulo di contatto (`RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM`, `CALLMEBOT_PHONE`, `CALLMEBOT_APIKEY`, ed eventualmente `TURNSTILE_SECRET_KEY`, aggiungendo il dominio al widget su Cloudflare). Le due pagine restano raggiungibili anche sul sito serio, con canonical sul dominio e fuori dalla sitemap (`sitemap: false`).

Per attivarlo: su Vercel «Add New Project» dallo stesso repository `albertoxpecchini/AP`, Root Directory `albertopecchini.it`, framework Vite, variabile `SITE=bcp` (Production e Preview), poi Settings → Domains con `bettercallpekko.it` e `www.bettercallpekko.it` (www che rimanda all’apice); nel DNS di Aruba i record che Vercel indica (A sull’apice, CNAME su www). In locale: `SITE=bcp npm run build && npm run preview`.

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
