# Assistenza — «Better Call Pekko», le immagini

Le pagine [`/assistenza/`](https://www.albertopecchini.it/assistenza/) e
[`/contatti/assistenza/`](https://www.albertopecchini.it/contatti/assistenza/) raccontano
l'assistenza informatica come il sito americano del 2008 di **Pekko, «the computer guy»**
(Alberto, col suo soprannome): 960 px fissi, colonna blu coi tasti gialli, pannello dei
«video di consulenza», manifesto, striscia «WELCOME», colonne pubblicitarie ai lati,
annunci di aziende che non esistono, profilo in stile MySpace, listino 2009, forum,
telefonini e provider dell'epoca, donazioni PayPal, e-card, coupon, commenti in stile SMS,
webcam coi filtri brutti, pop-up d'ingresso. Tutto in inglese.

Le immagini nascono in due passi, così sembrano del 2008 e non del 2026:

1. **Ingredienti** (`spot.js` + `spot.mjs`): openai/gpt-image-2 su Replicate disegna solo
   materiale fotografico in stile foto stock economica — ritagli di Pekko in nove completi
   e pose (mezzo busto e figura intera, fondo trasparente, volto dalla fototessera),
   due fogli di foto stock finte, oggetti scontornati, selfie da webcam per gli avatar,
   tre sfondi (l'ufficio vuoto, la stampante che esplode, la strada di campagna).
2. **Annunci** (`annunci.js` + `rendi.mjs`): i banner si compongono **a strati** in HTML
   — sfondo fisso, ritagli appoggiati al bordo basso, testo **Impact bianco con il bordo
   colorato ed estruso in 3D** (regola di Alberto: colorato pieno non si legge), starburst,
   nastri, bottoni in rilievo — e si fotografano con Edge/Chromium headless alla misura
   esatta: JPEG (con i suoi artefatti) per i fissi, **GIF** a pochi fotogrammi per quelli
   animati, dove lo sfondo resta fermo e cambia solo Pekko (o lampeggia la scritta).

| File | Cosa è |
| --- | --- |
| `spot.js` | prompt degli ingredienti: `PERSONA` (il volto), `FOTO` (lo sguardo 2008), i `fogli` 3 × 3 (ritagli-a, ritagli-b, hero-punta, stock, stock2, props, avatar) e gli `spot` opachi (bg-ufficio, bg-esplosione, bg-campagna) |
| `spot.mjs` | genera, recupera, ritaglia i fogli (`--celle` quando le figure si toccano), sceglie gli sfondi (`usa`); aggiorna il manifest |
| `annunci.js` | gli storyboard: per ogni annuncio misure, ingredienti richiesti e i fotogrammi come strati (`img`, `t3d` coi `TONI`, `txt`, `star`, `arc`, `ribbon`, `btn`, `logo`) |
| `rendi.mjs` | fotografa i fotogrammi e scrive `public/media/assistenza/ad-<nome>.jpg\|gif`; `lista` dice cosa è pronto |
| `lavoro/` | PNG generati con il JSON dell'input; `lavoro/scelte/` gli ingredienti puliti (PNG con alpha) che gli annunci usano; `lavoro/annunci/` gli HTML e i PNG dei fotogrammi; `lavoro/vecchie/` la prima versione. Tutto escluso da Git |
| `../../src/data/assistenza-media.js` | generato: misure e percorso di ogni immagine in `public/media/assistenza/` |
| `../../src/data/assistenza.js` | i contenuti delle due pagine (in inglese): testi, listino, forum, commenti, coupon, social… |
| `../../src/templates/pages/assistenza.js` | le due pagine autonome (stile e script in linea) |

## Le parti vive (dal 29.09.2026)

Contavisite, persone online, like, condivisioni, sondaggio, classifica del gioco, forum,
guestbook, shoutbox ed e-card sono veri: li gestisce **`api/bcp.js`**, una funzione sola che
tiene tutto in un documento JSON privato su **Vercel Blob** (`bcp/db.json`). Legge sempre
dall'origine (`useCache: false`) e riscrive con `ifMatch` sull'ETag: due scritture insieme non
si cancellano, chi perde riprova. Il contenuto iniziale (discussioni e recensioni del 2009) sta in
`src/data/bcp-seed.js` e il template lo stampa nell'HTML, così la pagina regge anche senza
JavaScript o col database spento (l'API risponde `offline`).

- **Attivazione**: il database sta sul server dei dati di Alberto (`C:\pzkko-server`, vedi
  `pzkko/api/_server.mjs`; fino al 28.10.2026 su Vercel Blob, bloccato quella notte e tolto dal codice):
  nel progetto `bcp` servono `PZKKO_SERVER_URL` e `PZKKO_SERVER_SECRET`, poi un deploy.
- **Protezioni**: campo trappola, 3 s minimi dall'apertura, massimo 4 messaggi al minuto per IP
  (in memoria, l'IP non si salva), niente link né HTML, nomi 2–24 caratteri («pekko» è riservato),
  liste troncate (60 discussioni, 40 risposte, 150 firme, 60 messaggi nella shoutbox).
- **Moderazione**: con la variabile `BCP_ADMIN_KEY` impostata nel progetto, una POST a
  `/api/bcp` con `{ "a": "del", "key": "…", "what": "thread|reply|gb|shout", "id": "…" }` cancella
  (per le risposte `id` è `<id discussione>:<indice>`); oppure si modifica o cancella
  `bcp/db.json` dalla pagina dello store su Vercel.
- **In locale**: `BCP_STORE=memory npm run dev` usa un database in memoria (si azzera a ogni
  riavvio o modifica di `api/bcp.js`).
- **Costi**: sul piano gratuito di Vercel Blob ogni azione è una lettura e una scrittura del
  documento; le letture della pagina passano dalla cache della rete di Vercel per 8 secondi.

Token e chiamate a Replicate: `tools/replicate.mjs`, in comune con copertine, figurine e
mascotte (il token sta in `.env.local`, vedi [`tools/copertine/README.md`](../copertine/README.md)).

## Uso

```bash
node tools/assistenza/spot.mjs genera ritagli-a                  # un foglio 3 × 3 trasparente (2048², high)
node tools/assistenza/spot.mjs ritaglia ritagli-a tools/assistenza/lavoro/ritagli-a/<file>.png --celle
node tools/assistenza/spot.mjs genera bg-ufficio                 # uno sfondo opaco
node tools/assistenza/spot.mjs usa bg-ufficio tools/assistenza/lavoro/bg-ufficio/<file>.png
node tools/assistenza/spot.mjs recupera stock <id>               # se l'attesa si interrompe: l'immagine è già pagata

node tools/assistenza/rendi.mjs lista                            # annunci, misure, ingredienti mancanti
node tools/assistenza/rendi.mjs tutti                            # rende tutto ciò che ha gli ingredienti
node tools/assistenza/rendi.mjs header fashion --html            # solo gli HTML dei fotogrammi, per guardarli
```

`rendi.mjs` cerca Edge, poi il Chromium di Playwright, poi Chrome; `CHROME=<percorso>` per
forzarne uno. Serve ffmpeg nel PATH.

## Gli annunci

| Nome | Misura | Cosa è |
| --- | --- | --- |
| `header` (GIF, 3 pose) | 960 × 234 | testata: esplosione, pergamena con la EULA, PEKKO, Pekko che cambia posa |
| `welcome` | 960 × 86 | «WELCOME, PC ABUSERS!» con le bilance |
| `fixed-my-pc` (GIF) | 158 × 155 | il cliente che urla, scritta che lampeggia |
| `thumb-1…4` | 160 × 108 | i «video di consulenza» nell'ufficio |
| `portrait` | 160 × 190 | Pekko che punta, sul giallo |
| `poster` | 152 × 378 | il manifesto della colonna destra |
| `getspace` (GIF) | 301 × 389 | «GET $PACE NOW!!!», il bimbo col mouse |
| `vista` | 264 × 187 | «the tragedy of Windows Vista» |
| `hermanos` | 222 × 186 | Los Backups Hermanos |
| `fashion` (GIF) | 486 × 205 | PEKKO'S OUTFIT, la sfilata |
| `ecard-1…6` | 390 × 270 | le sei e-card |
| `million` (GIF) · `toolbar` | 468 × 60 | milionesimo visitatore · toolbar da scaricare |
| `mattress` · `pizza` · `dairy` · `mac` · `phones` | 300 × 250 | Mincio Discount Mattress Barn · Gino's Pizza & Data Recovery · Mincio Dairy Call Center · «Mac broken? Yes. It happens.» · Cell Phone Corner |
| `gino` · `tan` · `scooter` | 300 × 100 | Crazy Gino's · Rivalta Tan & Toner · Mincio Scooter Wireless |
| `salami` · `nonna` | 234 × 60 | Zio Beppe's Salami & Web Hosting · Nonna's Tortellini & Tech Support |
| `turtle` · `snail` · `fish` · `phon` | 180 × 150 | Turtle Insurance · Snail Express · Lake Garda Fish & Chips & Chips · Blow-Dry PC |
| `tv` (GIF, 4 pose) | 320 × 240 | lo spot dentro il televisore |
| `ambulance` (GIF) | 150 × 70 | il furgone col lampeggiante |
| `sky-outfit` (GIF) · `sky-mac` | 160 × 600 | i grattacieli delle colonne laterali |
| `sky-donate` · `sky-forum` | 160 × 300 | donazioni PayPal · il forum |

Le aziende non esistono e la pagina lo dichiara. Su Apple si scherza senza nominarla e
senza dire cose false («the bitten one», «no Genius required», «not affiliated with any fruit»).

## Il canvas di Claude Design (dal 29.09.2026)

I banner della sezione **«Pekko makes websites»** (i siti veri di Alberto) e i bottoni 88×31
non passano più da `annunci.js`: sono **artboard vettoriali** nel canvas di Claude Design
[«Better Call Pekko — banner»](https://claude.ai/artifact/EqJtdNAsANcHWZd8cLVBck), con font veri
presi da Google Fonts (Impact 3D del sito accanto a Comfortaa e Varela Round del «Web 2.0»,
Lobster, Bebas Neue e Alfa Slab One del 2012, Archivo e Instrument Serif del sito serio,
Open Sans «Metro», Silkscreen per i pixel, Black Ops One, Permanent Marker…). Le animazioni
sono CSS dentro l'artboard: il canvas le mostra in movimento, lo script le ferma fotogramma
per fotogramma.

- `design/project/` è la copia locale del canvas (`canvas.json` + un `.dc.html` per
  artboard, in markup letterale: niente `{{…}}`, così il browser headless lo legge com'è).
- `design/assets.json` dice da quale file viene ogni immagine caricata nel canvas
  (`/_blob/<id>`): di norma da `public/`, per il banner di pzkko.it da `pzkko/art/`.
- `design.mjs` apre ogni artboard con puppeteer-core (quello di `tools/catture`), aspetta i
  font, e per ogni elemento con `data-out="<nome>"` scrive `public/media/assistenza/<nome>`:
  JPEG a densità 2× per i fissi, PNG per i bottoni, GIF a 1× per quelli con
  `data-frames`/`data-period` (fotogrammi presi a metà di ogni intervallo del ciclo).
  Aggiorna il manifest come `rendi.mjs`.
- Se Alberto modifica un artboard a mano nel canvas, prima si rilegge il canvas (strumento
  Artifact, `read` del file) e si aggiorna la copia in `design/project/`, poi si rende.

```bash
node tools/assistenza/design.mjs lista                 # artboard e uscite
node tools/assistenza/design.mjs tutti --prova         # solo i PNG dei fotogrammi in lavoro/design/
node tools/assistenza/design.mjs tutti                 # rende tutto in public/media/assistenza/
node tools/assistenza/design.mjs ad-web-header btn-bcp # solo queste uscite
```

| Artboard | Uscita | Misura | Cosa è |
| --- | --- | --- | --- |
| `Main` | `ad-web-header` (GIF, 5) | 960 × 200 | «pekko web design 2.0 BETA — WEBSITES THAT DON’T SUCK!!!», Pekko che indica il finto browser dove girano i cinque siti veri (pzkko.it dal 18.10.2026) |
| `Top468` | `ad-web-468` (GIF, 3) | 468 × 60 | «NEED A WEBSITE? / PEKKO MAKES THEM TOO!!! / 4 REAL», in testata accanto al milionesimo visitatore |
| `Tile` | `ad-web-tile` (GIF, 2) | 158 × 155 | «PEKKO MAKES WEBSITES!!!» nella colonna blu |
| `Rivalta` | `ad-web-rivalta` | 300 × 250 | «184 PLACES. 1 VILLAGE. 0 TRACKERS.», mappa vera, spilli lucidi, «NOW IN BETA!» |
| `Cascina` | `ad-web-cascina` | 300 × 250 | «Hay! This website has 0 cookies», kraft e polaroid del 2012 |
| `Donelli` | `ad-web-donelli` | 300 × 250 | «Serious engineer. Serious website.», targa in bianco e nero, post-it di Pekko |
| `Twin` | `ad-web-twin` | 300 × 250 | «SAME GUY. Different font.»: Pekko contro Alberto, il sito serio |
| `Pzkko` | `ad-web-pzkko` | 300 × 250 | la saracinesca di pzkko.it di notte: insegna al neon, volantino giallo «all my sites & socials» coi tagliandi «pzkko.it» (uno strappato), il graffito «pzk★», Pekko che indica, «TEAR 1 OFF!!!» e «3D ROULETTE INSIDE!»; immagini prese da `pzkko/art/` |
| `Infografica` | `ad-web-howto` | 960 × 300 | «how pekko makes a website»: le 7 fasi vere del metodo, flat 2013 |
| `Metro` | `ad-web-metro` | 486 × 280 | la schermata Start di Windows 8 con cosa c’è in un sito di Pekko |
| `Dance` | `ad-web-dance` (GIF, 4) | 160 × 600 | silhouette che ballano: «3 KB of javascript. dance like nobody’s downloading» |
| `Cantiere` | `ad-web-cantiere` (GIF, 2) | 300 × 100 | «NO WEBSITE? PEKKO IS ALREADY DIGGING.», lampeggiante |
| `Bottoni` | `btn-*` (PNG; GIF `btn-bcp` e `btn-pzkko`, il neon che sfarfalla) | 88 × 31 | i bottoni dei siti veri, 0 cookies, hand coded, si parla italiano, secured by a nutria… |

Gli ingredienti nuovi (fogli di `spot.js`): `ritagli-c` (Pekko web designer a mezzo busto:
`web-*`), `ritagli-d` (figura intera: surf, balli per le silhouette, cantiere, freccia del
mouse…), `icone` (icone lucide «Web 2.0»: `ico-*`), `stock3` (foto stock finte sui siti),
`bg-web` (lo studio web vuoto). Cinque predizioni high il 29.09.2026. `shot-bcp.webp` è la
cattura della pagina stessa, per la scheda «bettercallpekko.it» di Pekko Explorer.

## Regole imparate

- **Il modello disegna bene gli ingredienti, male i banner finiti**: se gli si chiedono
  banner con testo escono puliti, vettoriali, «AI 2026». Le scritte le fa il browser.
- **Impact bianca coi bordi colorati** (`t3d` con `tone`): il testo colorato pieno con
  l'estrusione scura non si legge, come ha fatto notare Alberto sul numero blu.
- **Fogli con figure che si toccano** (i mezzi busti in colonna): il ritaglio per componenti
  connesse le fonde; `--celle` taglia sulla griglia rigida.
- **Le figure si appoggiano al bordo basso** (`bottom: 0`) e si dà solo la larghezza: le
  altezze variano da ritaglio a ritaglio. Le misure vere stanno in `lavoro/scelte/`.
- **GIF a strati**: stesso sfondo in ogni fotogramma, cambia il ritaglio (o lampeggia la
  scritta). Palette a 128 colori con dithering ordinato: pesa poco e ha la grana giusta.
- Tutti i testi in inglese; l'unica riga italiana è «SI PARLA ITALIANO», che è la battuta.

## Costi (27 settembre 2026)

Dieci predizioni high per gli ingredienti (sette fogli 2048²/3:4 trasparenti, tre sfondi 3:2 e
2:3), più dodici della prima versione poi accantonata (ora in `lavoro/vecchie/`); la cifra
esatta si legge nella dashboard di Replicate. Le fonti sono dichiarate in `/crediti/` e nel
README del sito.
