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
