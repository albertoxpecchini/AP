# pzkko.it

Il sito di **pzkko.it**: file statici, niente build. Sta nel repository del sito
serio ma è un progetto Vercel a parte.

- `index.html` — la home: «il muro», una saracinesca grigia coperta di graffiti
  e di volantini attaccati col nastro: ogni social, gioco e strumento è un
  volantino. CSS e JS in linea.
- `art/` — le immagini del muro, generate con openai/gpt-image-2 su Replicate
  il 9.10.2026 e ritagliate da `../tools/pzkko/immagini.mjs` (prompt in
  `../tools/pzkko/fogli.js`): `muro.webp` (la lamiera, si ripete), `insegna.webp`
  (il cassonetto con le lettere «pzkko»), `carta/` (nove fogli vuoti con nastro
  e graffette: i testi veri li scrive la pagina sopra), `arte/` (le illustrazioni
  stampate sui volantini, solo inchiostro), `tag/` (graffiti), `nastro/` (nastri,
  resti strappati, adesivo, puntina, graffette), `manifesti1/` e `manifesti2/`
  (otto manifesti interi, inventati, che riempiono il muro: il concerto della
  chiocciola, il gatto che risponde al nome di git… sono finzione, non annunci),
  `scritte/` (le parole sprayate social, games, tools). Ogni WebP porta dentro
  il prompt con cui è nato; le misure stanno in `pezzi.json`.
- `fonts/` — Anton e Archivo Black (SIL OFL), Special Elite e Permanent Marker
  (Apache 2.0), da Google Fonts, serviti da qui.
- `404.html` — pagina non trovata: lo stesso muro, con i resti del volantino
  strappato e un foglio che rimanda alla home
- `favicon.png`, `apple-touch-icon.png` — l'adesivo con la chiocciola sulla lamiera
- `og.jpg` — anteprima per i link condivisi (1200 × 630)
- `robots.txt`, `sitemap.xml`
- `vercel.json` — intestazioni di sicurezza, URL puliti

## Com'è fatta la home

La pagina è la saracinesca (la foto di riferimento: la serranda di un negozio
chiuso a Bologna, con l'insegna «coin» sopra e i manifesti attaccati sotto).

- **Il portale**: pietra scura (CSS, con una grana SVG) intorno; sopra la
  porta l'insegna, un cassonetto retroilluminato con le lettere «pzkko» a
  scatola (immagine; l'`h1` è il suo testo).
- **La lamiera**: `art/muro.webp`, la foto di una saracinesca ritagliata a un
  numero intero di doghe e specchiata in larghezza, così si ripete senza
  giunte (`background-size: 2200px`).
- **I volantini** (`.vol`): un foglio fotografato (`.c-bianco`, `.c-giallo`…
  con la sua proporzione e i bordi veri della carta misurati) e sopra il testo
  vero in HTML, misurato in `cqw` del volantino: Anton per i titoli, Special
  Elite per il corpo, Permanent Marker per le note a mano, Archivo Black per
  la seconda voce. L'illustrazione è solo inchiostro e si stampa sulla carta
  con `mix-blend-mode: multiply`. Il volantino cresce se il testo è più lungo
  della carta. Il link copre tutto il foglio (`h3 a::after`); al passaggio il
  foglio si solleva.
- **I tagliandi**: i volantini dei social finiscono con una fila di tagliandi
  da strappare, fette della stessa carta (lo script dà a ogni tagliando il
  suo pezzo di foglio come sfondo): toccarne uno lo strappa, copia il contatto
  e lascia il buco col muro dietro; una nota a pennarello dice «copiato». Con
  `prefers-reduced-motion` lo strappo è immediato.
- **La disposizione**: ogni cosa sul muro è posizionata in assoluto in
  1280esimi della parete (`--x`, `--y`, `--w`, `--r`) e, sotto i 900 px, in
  390esimi (`--mx`, `--my`, `--mw`, `--mr`), due volantini per riga; su un
  tablet la parete non supera i 600 px e la lamiera riempie i lati. I graffiti
  stanno sotto i fogli (`.tag`, in multiply), i manifesti inventati fra i
  fogli (`.man`), le parole sprayate `social`, `games`, `tools` sono le
  intestazioni delle zone e gli anchor.
- **La sera a Mantova**: la pagina calcola alba e tramonto di Mantova (calcolo
  NOAA, al minuto, senza rete) e vive a quell'ora da qualunque posto la si
  guardi. Da 40 minuti prima del tramonto cala un velo blu notte (`.buio`, in
  multiply) e la lamiera si spegne; al tramonto preciso i led dietro l'insegna si
  accendono (strobo d'accensione, poi la luce tiene); 12 minuti dopo si accendono
  i lampioni, al sodio a sinistra e al neon a destra (`.lampioni`, in screen);
  la notte è piena 50 minuti dopo il tramonto e all'alba tutto si spegne a
  ritroso. Le luci al neon sfarfallano: la rete a 50 Hz fa pulsare i tubi a
  100 Hz e il browser, campionando a 60, ne restituisce il tremolio; in più
  ogni tanto un tubo «sputa» (`--f-insegna`, `--f-lampioni`). Con
  `prefers-reduced-motion` niente sfarfallio né strobo. Senza script la notte
  segue il tema del sistema. Prove: `?ora=18:30` (ora di Mantova di oggi),
  `?veloce=60` (il tempo corre 60 volte più in fretta), `?notte=1`.
- **La strada** (9.10 sera): i lampioni sono veri (`art/strada1/`: una lanterna
  al sodio a sinistra e un tubo al neon a destra dell'insegna, fotografati
  spenti e accesi, con il cono di luce dalla testa della lampada); l'insegna
  di notte è una seconda fotografia (`art/insegna-notte.webp`, generata dalla
  prima) con i tubi al neon visibili dentro le lettere; intorno, sulla pietra,
  cavi, la condensa dei condizionatori sul tetto, fuori vista (la goccia cade
  dall'alto ogni 3–9 s sulla lamiera e lascia il rivolo), intonaco che si sfoglia, umidità, una crepa, gomme
  schiacciate, un topo a stencil e le scritte degli altri (`art/strada2/`:
  «ti amo giulia», «NO», «ciao mamma», «ACC 19», «w la pizza», «zio», «qui»,
  «tvb 4ever»); cinque formiche (`art/bestiole/`) camminano lungo il bordo
  basso della lamiera. Di notte **passano le auto**: ogni 20–90 secondi (mai
  più di tre al minuto) i fari (alogeni caldi, led freddi, xeno) spazzano il
  muro e i fogli, poi dal lato in cui l'auto se ne va restano i fanali rossi,
  con una frenata ogni tanto; una su sette ha il neon sotto la scocca. La
  lamiera riflette le luci: `.muro::after` è la stessa foto a contrasto alto,
  in screen, mascherata dove battono lampioni e fari. `?auto=1` fa passare
  un'auto subito. Con `prefers-reduced-motion` niente auto, gocce né formiche.
- **404**: generata dalla home da `tools/pzkko/genera-404.mjs`
  (`node tools/pzkko/genera-404.mjs` dalla cartella `albertopecchini.it`), da
  rilanciare dopo ogni modifica a `index.html`.

Ogni strumento o gioco nuovo è una pagina in questa cartella (es.
`tools/nome/index.html`) e il suo volantino «in arrivo» diventa un link.

## Le immagini

`node tools/pzkko/immagini.mjs genera <foglio|tutti>` disegna i fogli su fondo
magenta in `tools/pzkko/lavoro/` (fuori dal repository), `usa <foglio|tutti>`
toglie il magenta con la chiave cromatica, separa i pezzi per cella e li scrive
qui. Le illustrazioni nascono su un cartoncino crema che `usa` rende
trasparente; lo scotch resta traslucido; la lamiera si taglia sul passo delle
doghe.

## Vercel

Progetto `pzkko` dal repository `albertoxpecchini/AP`:

- Root Directory: dovrebbe essere `albertopecchini.it/pzkko` con preset Other
  (nessuna build, output = la cartella). Finché resta `albertopecchini.it` con
  preset Vite, ci pensa `tools/pzkko/build.mjs` (il `buildCommand` di
  `albertopecchini.it/vercel.json`): se la build gira per pzkko.it copia questa
  cartella in `dist/` così com'è, altrimenti lancia la build normale del sito.
- Domini: `www.pzkko.it` (principale), `pzkko.it` → 308 verso www
- Ogni push su `main` pubblica da solo.

## In locale

```bash
npx serve albertopecchini.it/pzkko
```

## Crediti

La home e la 404 non hanno piè di pagina: credito e badge FrogDR sono stati tolti su
richiesta di Alberto il 9.10.2026 (è il suo sito; i giochi portano ancora il credito).
Le immagini del muro sono generate con openai/gpt-image-2 su Replicate; i
caratteri sono di Google Fonts con le licenze dette sopra.
