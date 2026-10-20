# pzkko.it

Il sito di **pzkko.it**: file statici, niente build. Sta nel repository del sito
serio ma è un progetto Vercel a parte.

- `index.html` — la home: «il muro», una saracinesca grigia coperta di graffiti
  e di volantini attaccati col nastro: ogni sito, social, gioco e strumento è un
  volantino. CSS e JS in linea.
- `art/` — le immagini del muro, generate con openai/gpt-image-2 su Replicate
  il 9.10.2026 e ritagliate da `../tools/pzkko/immagini.mjs` (prompt in
  `../tools/pzkko/fogli.js`): `muro.webp` (la lamiera, si ripete), `intonaco.svg` (il muro del palazzo,
  disegnato in SVG, si ripete), `insegna.svg` e `insegna-notte.svg` (l'insegna
  disegnata in SVG, di giorno e i tubi al neon accesi), `carta/` (nove fogli vuoti con nastro
  e graffette: i testi veri li scrive la pagina sopra), `arte/` (le illustrazioni
  stampate sui volantini, solo inchiostro), `tag/` (graffiti), `nastro/` (nastri,
  resti strappati, adesivo, puntina, graffette), `manifesti1/` e `manifesti2/`
  (otto manifesti interi, inventati, che riempiono il muro: il concerto della
  chiocciola, il gatto che risponde al nome di git… sono finzione, non annunci),
  `scritte/` (le parole sprayate social, games, tools). Il 17.10.2026 sono
  arrivati `arte3/` (le illustrazioni dei volantini dei siti), `manifesti3/` e
  `manifesti4/` (la roba degli altri in cima: il meme unimore contro unibo,
  lyca mobile contro tim, l'avvistamento starlink, moncler, brat, la cartolina
  di piazza tre torri, le frisk attaccate con lo scotch, il biglietto del
  parcheggio di milano) e `scritte2/` (siti, brat summer, unimore ≥ unibo).
  Ogni WebP porta dentro il prompt con cui è nato; le misure stanno in
  `pezzi.json`. I marchi e i nomi veri su quei manifesti (Moncler, Frisk,
  Lyca Mobile, TIM, Starlink, brat, Unimore, Unibo) sono quelli che si trovano
  su un muro di città, disegnati dal modello: non sono pubblicità né
  collaborazioni, e nessuno di loro ha a che fare con questo sito.
  `auguri.webp` è il meme degli auguri a @~matti (17.10.2026, torta e scritte
  disegnate tutte da gpt-image-2): si apre entrando nella home fino al
  18.10.2026 alle 20:30, poi lo script lo toglie; dopo si può cancellare.
- `games/roulette/` — la roulette, che si apre in una finestra sopra il muro
  (vedi sotto): `roulette.js` e `roulette.css` (la finestra, il tavolo, le
  fiches), `ruota.js` (la forma della ruota e la sua fisica), `regole.js` (le
  puntate e i pagamenti), `lib/` (three.js r186, MIT, e Rapier 0.21, Apache 2.0,
  con le licenze). Le immagini ferme sono in `art/fiches/` (le cinque fiches e
  il segnaposto, viste dall'alto) e `art/roulette/` (il foglio della finestra
  e il legno della ruota), generate il 17.10.2026 come le altre.
- `games/blackjack/` — il blackjack, nella stessa finestra (vedi sotto):
  `blackjack.js` e `blackjack.css` (la finestra, il tavolo, le fiches, la
  partita), `regole.js` (il sabot, i punti, i tre regolamenti, le laterali),
  `scena.js` (le carte 3D, il sabot e la vaschetta in three.js, lo stesso
  `../roulette/lib/three.js`), `carte.js` (le facce e il dorso disegnati in un
  canvas). Le figure delle carte sono in `art/blackjack/` (le dodici mezze
  figure, gpt-image-2 il 17.10.2026, `tools/pzkko/blackjack/figure.mjs`).
- `games/pzk.js` — i $pzk, gli stessi per tutti i giochi.
- `regia/` — la regia, il pannello nascosto per provare il sito (vedi sotto):
  `regia.js` e `regia.css`.
- `scena/` — la scena 3D della home (vedi sotto): `scena.js` (la telecamera,
  l'inquadratura allineata al DOM, il giro), `mondo.js` (il posto: facciata,
  saracinesca, insegna, porta a vetri, marciapiede, strada, palazzi, lampada,
  auto), `neon.js` (i tubi al neon dell'insegna e la chiocciola del logo),
  `fogli.js` (i volantini e i graffiti presi dalla pagina, e la superficie su cui
  camminano le bestie), `acqua.js` (la condensa che scende sulla lamiera e il muro
  bagnato), `bestie.js` (formiche, mosche, zanzare e blatte), `marciapiede.js`
  (le lastre e le pozzanghere, disegnate dallo shader), `luci.js` (il sole di
  Mantova, il cielo, le luci della notte), `materiali.js` (le trame disegnate, il
  profilo e la griglia delle doghe), `scena.css`, `lib/` (three.js r186 con gli
  addon, MIT, `tools/pzkko/scena/motore.mjs`; `gltf.js` è l'esportatore glTF a
  parte, si scarica solo con `?glb=1`).
- `art/scena/` — quello che serve alla scena: `lamiera.webp` e `lamiera-r.webp`
  (il colore e la rugosità della saracinesca, tirati fuori dalla foto `muro.webp`
  togliendole la luce, `tools/pzkko/scena/mappe.mjs`), `pannello.svg` e
  `colature.svg` (il pannello dell'insegna, senza l'adesivo: la chiocciola ora è
  un neon, e le colature, da `insegna.svg`),
  `vol/` e `vol.json`, `vol-m/` e `vol-m.json` (le foto dei volantini per il
  computer e per il telefono, `tools/pzkko/scena/cattura.mjs`), `trame/`
  (intonaco e asfalto, colore e normali, 37 KB in tutto: le disegna una volta
  `tools/pzkko/scena/trame.mjs` con le funzioni di `materiali.js`, che nella
  pagina costavano due secondi fermi; le lastre del marciapiede dal 20.10 le
  disegna lo shader, `marciapiede.js`).
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

- **Il muro e l'insegna** (17.10): l'unica foto vera è la lamiera; sopra è
  tutto SVG. Il muro del palazzo è `art/intonaco.svg` (una piastrella di
  640 px: rumori `feTurbulence` che si ripetono senza giunte, la grana della
  sabbia illuminata con `feDiffuseLighting`, chiazze di colore), un'ombra
  sotto la gronda in CSS. L'insegna è `art/insegna.svg`: telaio d'alluminio,
  pannello bianco sporco, colature dal bordo alto, ruggine in basso, viti,
  l'adesivo con la chiocciola, le lettere «pzkko» a scatola (un tratto unico
  arrotondato con fianchi, bordo, faccia e ombra) e le colature sul muro
  sotto il cassonetto. L'`h1` è il suo `alt`. Niente lampioni, cavi o
  scritte intorno.
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
- **I siti in cima** (17.10): la saracinesca si è allungata verso l'alto e le
  cose nuove stanno sopra. La zona `siti` ha un volantino per sito, che si
  apre in una scheda nuova: albertopecchini.it, bettercallpekko.it,
  rivaltasulmincio.it, cascinafontana.xyz e «ti serve un sito?» (la pagina dei
  contatti di albertopecchini.it); quello dell'ing. Dario Donelli non è un link
  («presto online»: aspetta il suo dominio). In mezzo, la roba degli altri:
  manifesti, meme e cose attaccate con lo scotch, che non portano da nessuna
  parte.
- **In primo piano**: i fogli nuovi coprono i vecchi, ma il volantino o il
  manifesto sotto il puntatore viene davanti a tutti (`z-index: 20`); sul
  telefono basta toccarlo (lo script gli mette `.sopra`).
- **La disposizione**: ogni cosa sul muro è posizionata in assoluto in
  1280esimi della parete (`--x`, `--y`, `--w`, `--r`, alta 2258) e, sotto i
  900 px, in 390esimi (`--mx`, `--my`, `--mw`, `--mr`, alta 3777); su un
  tablet la parete non supera i 600 px e la lamiera riempie i lati. Dal 17.10
  la composizione è a pile: cinque colonne da ~250 unità sul desktop e due sul
  telefono, ogni pezzo sovrapposto di poco a quello sopra, graffiti e nastri
  ancorati ai fogli vicini; dopo ogni cambio di testo si rimisurano le altezze
  vere dei fogli (crescono col testo) e si rifanno le pile. I graffiti
  stanno sotto i fogli (`.tag`, in multiply), i manifesti inventati fra i
  fogli (`.man`), le parole sprayate `siti`, `social`, `games`, `tools` sono
  le intestazioni delle zone e gli anchor.
- **La sera a Mantova**: la pagina calcola alba e tramonto di Mantova (calcolo
  NOAA, al minuto, senza rete) e vive a quell'ora da qualunque posto la si
  guardi. Da 40 minuti prima del tramonto cala un velo blu notte (`.buio`, in
  multiply) e la lamiera si spegne; al tramonto preciso i tubi al neon dell'insegna si
  accendono (strobo d'accensione, poi la luce tiene); 12 minuti dopo i lampioni
  della strada, fuori vista (da lì passano anche le auto);
  la notte è piena 50 minuti dopo il tramonto e all'alba tutto si spegne a
  ritroso. Le luci al neon sfarfallano: la rete a 50 Hz fa pulsare i tubi a
  100 Hz e il browser, campionando a 60, ne restituisce il tremolio; in più
  ogni tanto un tubo «sputa» (`--f-insegna`, `--f-lampioni`). Con
  `prefers-reduced-motion` niente sfarfallio né strobo. Senza script la notte
  segue il tema del sistema. Prove: `?ora=18:30` (ora di Mantova di oggi),
  `?veloce=60` (il tempo corre 60 volte più in fretta), `?notte=1`.
- **La strada di notte**: al tramonto si accende `art/insegna-notte.svg`
  (stessa tela dell'insegna: i tubi al neon lungo la stessa traccia delle
  lettere, la faccia calda, la luce sul pannello), con un alone e un cono di
  luce in screen sul muro e sulla saracinesca. La condensa dei condizionatori sul tetto, fuori
  vista: la goccia cade dall'alto ogni 3–9 s sulla lamiera e lascia il rivolo;
  sulla lamiera gomme schiacciate e le scritte degli altri (`art/strada2/`:
  «ti amo giulia», «NO», «ciao mamma», «w la pizza», «zio», «qui»); cinque formiche (`art/bestiole/`) camminano lungo il bordo
  basso della lamiera. Tre mosche (`art/mosche/`: posata, che si pulisce
  le zampe, due battiti d'ali) si posano sul muro e sui fogli, si girano, fanno
  due passi, si puliscono e volano via a zig zag; scappano dal puntatore. Di notte **passano le auto**: ogni 20–90 secondi (mai
  più di tre al minuto) i fari (alogeni caldi, led freddi, xeno) spazzano il
  muro e i fogli, poi dal lato in cui l'auto se ne va restano i fanali rossi,
  con una frenata ogni tanto; una su sette ha il neon sotto la scocca. La
  lamiera riflette le luci: `.muro::after` è la stessa foto a contrasto alto,
  in screen, mascherata dove battono lampioni e fari. `?auto=1` fa passare
  un'auto subito. Con `prefers-reduced-motion` niente auto, gocce né formiche.
- **404**: generata dalla home da `tools/pzkko/genera-404.mjs`
  (`node tools/pzkko/genera-404.mjs` dalla cartella `albertopecchini.it`), da
  rilanciare dopo ogni modifica a `index.html`.

## La scena 3D (scena/)

Dal 18.10.2026 (dal 19.10 anche sul telefono), dove c'è WebGL2 la home non è
più una pagina ma un posto: la stessa saracinesca coi suoi volantini, disegnata
dalla scheda grafica con three.js come la scena di un videogioco, con luci,
ombre e riflessi veri. `?muro=1` tiene il muro di sempre; senza WebGL2 resta
quello, senza che la pagina se ne accorga.

- **La schermata di caricamento**: il caricatore in fondo a `index.html` mette
  subito `html.scena-carico` (la pagina trasparente su nero, il muro di sempre
  non si vede mai), chiede insieme il foglio di stile e i sei moduli
  (`modulepreload`) e mostra la schermata (`.carico`): una barra in cui
  scorrono le foto dei volantini, ripetute, accese fin dove è arrivato il
  caricamento (col bordo giallo) e grigie dopo. Sono le stesse foto che la scena
  metterà sui fogli (stesso nome, `vol/` o `vol-m/`): il browser le scarica una
  volta sola, e intanto si vedono. Il nastro acceso sta in una finestra ferma
  che si allarga (un ritaglio sul nastro che scorre il browser a volte non lo
  disegnava); lo scorrimento è un'animazione CSS di `transform`, che va avanti
  anche quando la pagina è occupata. Il numero è per metà le foto scaricate
  (le conta la pagina) e per metà la scena (`window.pzkkoCarico(0..1)` da
  `scena.js`: moduli, costruzione, shader, foto sulla scheda). La scena intanto
  si costruisce coi fogli vuoti, compila gli shader e **gira già, nascosta
  dietro la schermata**: le foto si decodificano per conto loro e si caricano
  nella scheda a tempo, fino a 4 ms per fotogramma, come ImageBitmap già
  capovolti (da un `<img>` il browser li ricapovolgerebbe sul filo principale).
  Quando sono **tutte a bordo** (al massimo dopo 25 s) la schermata se ne va e
  la strada compare in dissolvenza dal nero, già completa.
- **L'arrivo**: la strada si vede prima **da lontano**: dall'altra parte del
  marciapiede, ad altezza d'occhio, tutto il negozio nell'inquadratura (sul
  telefono la parte alta della saracinesca, con l'insegna); dopo 0,9 s la
  telecamera **vola dritta** fino all'inquadratura di sempre in 2,6 s: la
  distanza cala in scala logaritmica (l'avvicinamento ha sempre la stessa
  velocità a vista) e il centro si sposta in proporzione alla distanza, come in
  un volo in linea retta; il punto d'arrivo segue lo scorrimento, quindi si può
  scorrere anche durante il volo. Arrivata, la pagina sotto torna a rispondere
  (si toglie `scena-carico`). Con `prefers-reduced-motion` (o `?intro=0`) niente
  volo: la scena compare già arrivata (dopo la schermata, che resta). Se
  qualcosa va storto si torna al muro di sempre. La console dice «costruita,
  shader, primi fotogrammi», «foto a bordo in N s» e «pronta, vista, arrivata».
  Da scaricare ~2 MB sul computer (three.js 627 KB, 171 compresso; i volantini
  1,3 MB; le trame 74 KB) e ~1,5 MB sul telefono (i volantini 0,8 MB).
- **Le luci a insiemi**: ogni luce visibile si calcola per ogni pixel di ogni
  materiale illuminato, anche spenta (su una Intel UHD le undici luci di notte
  costavano metà del fotogramma, anche a mezzogiorno). Quindi le luci vanno a
  insiemi (`luci.js`): «giorno» = il sole e il cielo; «sera» = anche le luci
  della notte (insegna, lampada, lampioni, l'auto), da quando la pagina ne
  accende una; «notte» = senza il sole, sotto l'orizzonte. Ogni insieme vuole i
  suoi programmi (il numero delle luci entra in tutti): quello di partenza si
  compila a tela nascosta, gli altri in sottofondo quando servono, un pezzo per
  fotogramma (mettere in coda un programma costa ~40 ms sul filo principale),
  intanto si va avanti con le luci di prima e si cambia quando è tutto pronto.
  Sui livelli «poche luci» (le integrate, il telefono) l'insegna ha una lampada
  invece di quattro, i lampioni di là sono solo lampadine accese, l'auto ha un
  faro solo e niente rosso dei freni né neon sotto.
- **Le trappole della compilazione**: un programma che manca al momento di
  disegnare si compila lì, bloccando (su Windows ~200 ms l'uno: erano 5 s di
  nero). La chiave di un programma comprende la destinazione (dentro la tela del
  post-processing three toglie il tone mapping; l'ultimo passaggio va sullo
  schermo), le luci e la nebbia della scena in cui si disegna, gli attributi della geometria
  e se il materiale è opaco. Quindi (`compila` in `scena.js`) la scena si
  compila dentro la sua tela, col cielo già pronto come ambiente (il PMREM entra
  nei materiali), con la carrozzeria dell'auto (nascosta finché non passa) e con
  la carta sia trasparente sia opaca; i quadri del bagliore (di giorno è spento:
  si compilerebbero al tramonto, con uno scatto) e l'OutputPass (che decide le
  sue `#define` al primo render: gli si danno prima) attraverso la mesh del loro
  `FullScreenQuad` (un triangolo con solo posizione e uv: con un piano qualunque
  la chiave non combaciava), l'OutputPass sullo schermo. Restano al primo
  fotogramma, a tela nascosta, i due materiali di profondità delle ombre, che
  three crea da sé (~0,3 s). `?programmi=1` dice in console cosa si compila ai
  primi fotogrammi e dopo: deve essere +2 e poi niente.
  Il cielo come ambiente si rifà solo quando il sole si sposta di 0,6°; le
  variabili della pagina si leggono da `html.style`, non con `getComputedStyle`
  (che a ogni fotogramma ricalcolerebbe lo stile di tutta la pagina), e la
  posizione della parete si rilegge solo quando la pagina cambia misura (a ogni
  fotogramma basta lo scorrimento).
- **Il telefono**: la parete è quella del telefono (due colonne, 390esimi, alta
  3777), quindi la saracinesca è larga 0,95 m e alta ~9 m (i volantini restano
  grandi come quelli veri, ~45 cm); l'insegna, la lampada e il piano di sopra si
  mettono rispetto a lei. Le foto dei volantini sono fatte apposta nella
  disposizione del telefono (`vol-m/`: lì il testo è un po' più grande). Di notte
  la luce di un lampione dall'altra parte della strada prende tutta la parete
  alta. Meno luci accese insieme (ognuna costa a ogni pixel): una lampada
  nell'insegna invece di quattro, i lampioni di là senza luce, niente neon sotto
  l'auto. La tela è alta `100lvh`, così la barra del browser che va e viene non
  la ridimensiona. Girando il telefono (o allargando la finestra oltre i 900 px)
  la pagina si ricarica, perché cambia la disposizione dei fogli.
- **Attenzione**: gli strumenti che misurano o fotografano la pagina 2D
  (`disponi.mjs`, `cattura.mjs`) la aprono con `?muro=1`, altrimenti la scena
  sposta il muro e le misure vengono sbagliate.

- **Com'è fatto il trucco**: la pagina di sempre resta lì, sotto, invisibile
  (`html.scena3d` in `scena.css`): i link dei volantini, i tagliandi e i giochi
  sono ancora i suoi (le sue mosche, formiche e la goccia no: nascoste e ferme,
  nella scena sono 3D); la scena si disegna in
  una tela fissa dietro e **l'inquadratura è calcolata perché la saracinesca 3D
  stia esattamente dove sta il muro nel DOM** (proiezione decentrata: la
  telecamera sta un po' a destra e più in basso del centro, come una persona sul
  marciapiede con un obiettivo decentrabile, ma il piano della parete finisce
  pixel per pixel sui pixel della pagina). La telecamera è fissa davanti alla
  vetrina e sale e scende con lo scorrimento, ma mai sotto mezzo metro da terra:
  più giù, in fondo alla pagina, guarderebbe il marciapiede da sotto (il piano si
  vede da una faccia sola, sotto c'è il cielo); essendo la proiezione
  decentrata, la parete resta dov'è lo stesso. `?allinea=1` mostra il DOM in
  trasparenza sopra la scena per controllare che combacino.
- **Il posto** (`mondo.js`, tutto in metri: 1 unità della parete = 1,6 mm, la
  saracinesca è larga 2,05 m): le doghe sono poligoni (bombate, col canale al
  giunto e qualche ammaccatura; otto righe per doga, fitte al giunto e larghe
  sulla pancia, e una colonna ogni 17 cm: 6000 triangoli, erano 36 000; la
  vernice è la foto della lamiera senza la
  sua luce, con la rugosità dove c'è sporco e ruggine), le guide, la barra con
  la serratura, la facciata d'intonaco col buco e le spalle, lo zoccolo di
  pietra, il pluviale, il citofono, la targa del civico, le finestre del piano
  di sopra. L'insegna è il cassonetto d'alluminio (1,5 m: più stretto della
  saracinesca e centrato su di lei), appena sopra l'architrave, col pannello
  sporco (`pannello.svg`) e davanti l'insegna al neon (vedi sotto, *Il neon*);
  sopra il cassonetto il trasformatore. A destra la porta a vetri
  del negozio: il vetro è uno specchio vero della strada (Reflector), dentro il
  buio con bancone, scaffali, il cartello «chiuso» appeso e la spia dell'allarme
  che lampeggia. Davanti il marciapiede di lastre bagnate con le pozzanghere (vedi
  sotto, *Il marciapiede*), il cordolo, l'asfalto, e di là dalla strada cinque palazzi
  con le finestre che la sera si accendono, e due lampioni. In `scena.css` il
  muro è un po' più stretto (`64vw`) e messo in modo che al centro dello schermo
  stia tutto il fronte del negozio, saracinesca e porta: così la porta e la
  lampada (sopra, su un braccio da un metro) entrano nell'inquadratura anche a
  1440 px.
- **I fogli** (`fogli.js`): ogni elemento `.it` della parete diventa un foglio
  di poligoni nel suo posto esatto (le `--px --py --pw --pr` già risolte dal CSS:
  sul computer le `--x --y --w --r`, sul telefono le `--mx --my --mw --mr`), suddiviso in
  sei righe per doga e una colonna ogni 12 cm e piegato sulla loro bombatura
  (concava: fra le righe la lamiera sta sotto la curva e la carta, 0,8 mm sopra,
  resta sopra la lamiera); i graffiti stanno
  attaccati al metallo (quelli scuri sono vernice che si moltiplica col metallo,
  come il `multiply` della pagina: l'inchiostro resta nero e si legge; quelli
  chiari, `.chiaro` e `.bianco`, coprono). **I graffiti stanno sugli stessi
  triangoli della lamiera** (le sue righe e colonne dentro il rettangolo del
  graffito, `lamiera()` in `materiali.js`), un decimo di millimetro sopra, con la
  foto stesa in coordinate del mondo: fino al 20.10 avevano una griglia loro, e
  carta e graffiti contavano le doghe da H invece che dal giunto in cima al
  rotolo (H + 30 cm), sfasati di 0,4 doghe: la lamiera li bucava a strisce, e il
  `polygonOffset` che li teneva su, nella proiezione obliqua degli specchi, li
  tirava sopra i manifesti (le pozzanghere sotto la saracinesca). La vernice non
  si alza col puntatore. La carta un filo sopra, uno strato per foglio
  nell'ordine di sovrapposizione della pagina (z-index e ordine nel DOM); finita
  la dissolvenza la carta diventa opaca e si disegna prima della lamiera, che
  sotto di lei non si calcola più (i fogli coprono metà saracinesca). I
  volantini usano le foto fatte da `cattura.mjs` (testo in HTML sopra la carta,
  fotografati in Chromium a 2 px per unità, con un margine per l'adesivo che
  sporge); quelli coi tagliandi hanno la fascia tolta e **ogni tagliando è un
  foglietto suo**, che cade quando la pagina gli mette `.cade` e sparisce con
  `.via`. Il foglio sotto il puntatore (o col fuoco) si alza di 2 cm con una
  molla. La carta lucida (`c-lucido`) ha la vernice (clearcoat). **La
  nitidezza**: i fogli si vedono rimpiccioliti (sul computer ~2,8 pixel di foto
  per pixel di schermo) e la scheda li leggerebbe da un livello di mipmap che li
  sfoca; si legge mezzo livello più in qua (il «bias» di `texture2D`, −0,6, in
  `nitida`), così il testo è netto senza tremolare.
- **Le luci** (`luci.js`): il sole è dove sta davvero sopra Mantova a quest'ora
  (lo stesso calcolo NOAA della pagina, più altezza e azimut; la facciata guarda
  a sud-sud-ovest, 200°), con le ombre; il cielo (addon `Sky`) fa da sfondo, da
  luce d'ambiente e da riflesso (PMREM, rifatto quando il sole si sposta). Di
  notte la scena legge ogni fotogramma le variabili CSS della pagina
  (`--notte`, `--insegna` con lo sfarfallio, `--lampioni`, `--auto-x`,
  `--auto-l`, `--auto-c`, `--freno`, `--neon-auto`) e accende i poligoni: i
  tubi al neon (emissivi, col bagliore), quattro lampade davanti al pannello del
  colore dei tubi, la lampada a muro sopra la porta (un faro con le ombre), i lampioni
  di là, le finestre dei palazzi; e **l'auto che passa è un'auto**: una berlina
  sulla strada dietro la telecamera (da x = −10 a 12 m, così esce dallo specchio
  della porta prima di sparire), coi fari che spazzano la saracinesca e la
  porta, i fanali rossi, il neon sotto. Si riflette nel vetro e nelle
  pozzanghere. Prove: `?ora=18:30`, `?notte=1`, `?auto=1` come per la pagina.
- **Il neon** (`neon.js`, 20.10): l'insegna è un neon vero, non più lettere a
  scatola. Tubi di vetro da 13 mm lungo la traccia di `insegna.svg` («pzkko», alte
  26 cm) e, a sinistra, **la chiocciola del logo** (la traccia dell'adesivo e di
  `favicon.png`: guscio a spirale, piede, antenne con le perle degli occhi), a 3,6
  cm dal pannello. Come li piega un vetraio: gli spigoli sono curve, le aperture
  chiuse (la pancia della p, la o) restano aperte di un dito, ai due capi di ogni
  pezzo il tubo gira all'indietro (il gomito verniciato di nero) ed entra nel
  pannello da un passacavo di gomma; i supporti di plastica ogni ~16 cm, il
  trasformatore sopra il cassonetto. **Colori veri, quelli dei gas**: «pzkko» è
  neon, rosso arancio, la chiocciola argon e mercurio in vetro cobalto, blu. Il
  vetro tinge quello che ha dietro (due passate: una moltiplica il fondo per il
  colore del vetro, una aggiunge i riflessi), così di giorno i tubi spenti si
  vedono rossi e blu sul pannello bianco; di sera il gas riempie il tubo (oltre
  l'1, il bagliore lo allarga), la luce cade sul pannello (i tratti sfocati su
  una tela, la sua trama emissiva) e sul muro (le quattro lampade dell'insegna,
  tre rosse e una blu; sul telefono una rossa). **Il tone mapping**: AgX porta al
  pastello tutto ciò che è molto saturo e molto acceso (il rosso del neon veniva
  salmone); l'OutputPass (in `scena.js`) per quei pixel mescola una curva che tiene
  la tinta (il colore diviso per il suo massimo; il cuore più acceso schiarisce verso un
  bianco caldo, come nelle foto dei neon veri), e non tocca la carta e i muri,
  che così in alto non arrivano. Lo sfarfallio resta quello della pagina
  (`--insegna`, `--f-insegna`).
- **L'acqua** (`acqua.js`): la condensa dello split del primo piano esce dal muro
  sotto la finestra (il buco col rosone), scende in un tubo grigio fissato con le
  graffe, entra sotto l'architrave e finisce contro la lamiera a destra
  dell'insegna. La goccia si gonfia alla bocca (3–9 s), si stacca e scende a
  scatti come sulla vernice vera: più è grossa più corre, dove la lamiera la
  trattiene si ferma, quando la raggiunge un'altra si uniscono e ripartono, per
  strada perde acqua; in fondo resta appesa alla barra e cade sulla soglia:
  schizzo e cerchio. **Il muro bagnato** è uno shader solo (`bagnato(materiale,
  tipo)`), in coordinate del mondo, sulla lamiera, sulla carta, sull'intonaco e
  sulla pietra: il rivolo scuro e lucido lungo la stessa linea storta delle gocce,
  che si allarga verso il basso e nei giunti delle doghe, col velo d'acqua che
  scorre (la normale si muove verso il basso); la carta bagnata più scura e satura;
  sotto il buco del tubo la riga d'umido sull'intonaco; in basso gli schizzi della
  pioggia (20–40 cm); sull'intonaco l'umidità che sale dal terreno col bordo bianco
  del salnitro; ai piedi del rivolo la pozza. Il rivolo disegnato della pagina
  (`bestiole/rivolo.webp`, `data-scena="no"`) resta solo nel muro di sempre.
- **Le bestie** (`bestie.js`): al posto dei disegni piatti della pagina, in 3D,
  a grandezza vera o quasi. **Formiche** (13 mm) in fila alle gomme da masticare
  sulla lamiera: una pista dalla barra in fondo a `strada1/gomme`, una dalla guida
  di destra a `bestiole/gomme2`; storta, ognuna col suo scarto; si fermano ad
  antennarsi quando si incrociano, mangiano e tornano con la briciola rosa,
  rientrano e ripartono; col puntatore vicino si sparpagliano e poi ritrovano la
  pista. **Mosche** (13 mm) posate sul muro, sui fogli, sull'insegna: ferme, si
  girano, due passi, si strofinano le zampe davanti; volano a tratti dritti con
  virate secche (vicino alla meta rallentano, se no ci girano intorno), a volte una
  insegue l'altra, e si posano dentro la parte di strada che si vede; scappano dal
  puntatore, dai fari, dal foglio che si alza; di notte dormono. **Zanzare tigre**
  (nere a righe bianche, le zampe dietro alzate): di giorno in basso, ronzano
  piano, cercano il puntatore e ogni tanto vengono a ronzare davanti alla
  telecamera; di sera girano attorno alla lampada e all'insegna. **Blatte
  americane** (38 mm), solo di notte: escono da sotto la saracinesca, girano sul
  marciapiede a scatti, salgono sulla lamiera, si infilano sotto i fogli; con i
  fari o il puntatore corrono a nascondersi. Ogni specie è una mesh a istanze, le
  ali trasparenti un'altra: zampe (a tripode, la fase legata alla strada fatta: i
  piedi non scivolano), antenne e ali le muove lo shader. Camminano sulla
  superficie vera (`superficie(x, y)` di `fogli.js`: una griglia di 1 cm dice il
  foglio più in alto, con la sua alzata) e si inclinano sulle doghe. Niente mappe
  d'ombra (si rifarebbero a ogni fotogramma): un'ombra morbida sotto ognuna, che
  si allarga e sbiadisce quando si stacca. Con `prefers-reduced-motion` stanno
  ferme. Il puntatore nel mondo: dove il raggio dalla telecamera tocca la
  saracinesca o il marciapiede (anche il tocco sul telefono).
- **Il marciapiede** (`marciapiede.js`): le lastre e le pozzanghere le disegna lo
  shader in coordinate del mondo (niente trame da scaricare, niente piastrella che
  si ripete, e il dettaglio regge anche da vicino: in fondo alla pagina la
  telecamera è a mezzo metro da terra). Granito grigio in lastre 60 × 40 sfalsate:
  ogni lastra col suo tono (qualcuna rifatta più chiara), un filo d'inclinazione,
  quanto è affondata; la grana a tre misure, che sfuma nel suo grigio quando è più
  piccola di un pixel (senza anti-alias tremerebbe); fughe nette, sporco verso le
  fughe, gomme da masticare schiacciate, chiazze lucide di bagnato. Le pozzanghere
  stanno nelle lastre affondate, lungo le fughe vicine, verso il cordolo e ai piedi
  del rivolo; la pietra intorno è più scura e lucida. L'acqua è lo specchio della
  strada (Reflector, con lo shader delle pozze), appena sopra le lastre e disegnato
  solo dov'è acqua, col bordo netto, increspato dal vento, più forte radente
  (Fresnel). La pietra non scende mai sotto ruvidezza 0,2: i bordi smussati lucidi
  facevano scintille, di notte.
- **Il costo**: due specchi (ognuno un giro di scena, senza multisample) e due
  mappe d'ombra (sole, lampada) che si rifanno **solo quando serve**: gli
  specchi quando la telecamera si muove (uno sì e uno no, alternandosi), nel
  volo e mentre passa l'auto, quando qualcosa si muove, e comunque ogni mezzo
  secondo (la sera che avanza, lo sfarfallio); le ombre quando qualcosa si muove
  (un foglio che si alza o compare, un tagliando, l'auto), quando il sole si è
  spostato di 0,15° (ogni ~40 s) e quando una luce si è appena accesa; di chi è
  spento non si rifanno. Bloom solo quando fa buio. **Niente anti-alias** (né
  MSAA né altro: il 19.10.2026 sono stati tolti, insieme al filtro «da
  videogioco» alla Buckshot Roulette). Quattro livelli
  (`?qualita=alta|media|bassa|telefono`; con `?qualita=` o `?dpr=` la scena non
  si adatta da sola): alta = risoluzione interna 1,25×, specchi 768 (il vetro)
  e 1024 × 512 (le pozzanghere, dal 20.10: prima 512 × 256, troppo sfocate), ombra
  del sole 2048, tutte le luci; media = 1×, specchi 512 e 384 × 192, ombre 1024,
  bagliore a metà risoluzione, poche luci; bassa = come media con specchi
  256 e 256 × 128, niente bloom né palazzi; telefono = 1,5× (il testo dei volantini si
  deve leggere), specchi 384 e 384 × 192, ombre 1024/512, poche luci. **La risoluzione
  non scende mai**: è lei che decide se le immagini sono nitide, il resto si
  può togliere. Si parte da «alta», da «media» se la scheda grafica si presenta
  come integrata (Intel, Apple, Mali, Adreno) o il processore ha 4 core o meno,
  da «telefono» sotto i 900 px; poi, a foto tutte a bordo e mentre si guarda da
  lontano (il momento più pesante: tutti i fogli in vista), se la mediana dei
  fotogrammi passa i 24 ms si toglie qualcosa, fino a tre volte: prima specchi
  e bagliore a metà, poi le ombre a 512, poi gli specchi a un quarto e niente
  bagliore. Triangoli per fotogramma (con ombre e specchi): ~38 000 sul
  computer, ~32 000 sul telefono (erano 390 000 e 600 000). Su una Intel UHD 630
  (il portatile, dove Chrome gira sull'integrata anche se c'è una GeForce) a
  1440 × 900, senza il limite dello schermo (`--libero`): ~120 fotogrammi al
  secondo di giorno, ~90 di notte, il telefono 125–180 (erano 16 di giorno).
  Attenzione alle misure: un'altra pagina 3D aperta sulla stessa scheda (la
  stessa home in un'altra finestra) le dimezza, e un'auto che passa (specchi e
  ombre a ogni fotogramma) le abbassa: ripeterle. Il 20.10, su una RTX 3060 Ti di
  notte, 207–281 fotogrammi al secondo con neon, acqua e bestie e 124–304 con la
  versione di prima (`--radice=`, sotto); le bestie costano ~0,1 ms di processore
  a fotogramma.
- **Blender**: `?glb=1` scarica la scena così com'è in glTF binario
  (`pzkko.glb`, GLTFExporter), da aprire con File › Import › glTF.
- **Le prove**: `node tools/pzkko/scena/foto.mjs --ora=22:00 --scroll=0.5`
  (dalla cartella `albertopecchini.it`; prima `npm ci` in `tools/catture`, che
  ha puppeteer) fotografa la scena in Chromium headless (che usa la scheda
  grafica vera: il Chromium di Playwright se c'è, se no Edge; `--chrome=<exe>` o
  la variabile `CHROME` per un altro) in `tools/pzkko/lavoro/scena-*.png` e dice
  i fotogrammi al secondo e i tempi dei fotogrammi dell'arrivo (dalla comparsa);
  `--libero` toglie il ritmo dello schermo (senza, i fotogrammi al secondo
  vanno a scatti: 60, 30, 20); `--larg`, `--alt`,
  `--dpr` (telefono: `--larg=390 --alt=844 --dpr=3`), `--q=notte=1`,
  `--vars=--auto-l:0.9;--auto-x:0.5` (ferma un'auto), `--hover=.vol.c-giallo`,
  `--prova=<js>`, `--pagina=/404.html` (da Git Bash con `MSYS_NO_PATHCONV=1`),
  `--subito --attesa=1000` (la vista da lontano), `--subito --sequenza=8
  --passo=500` (il volo, una foto ogni mezzo secondo), `--q=programmi=1` (in
  console i programmi compilati ai primi fotogrammi: devono essere pochi).
  `--sequenza=N --passo=ms` anche a scena arrivata (le bestie, le gocce),
  `--ritaglio=x,y,l,a` (ritaglia e ingrandisce due volte: le bestie sono di
  pochi pixel), `--radice=<cartella>` (un'altra copia di `pzkko/`, per
  confrontare con la versione di prima: `git archive HEAD pzkko | tar -x -C
  <cartella>`). In `--prova` c'è `s` = `window.pzkkoScena`: `s.b.dentro` (le
  bestie: `mosche`, `zanzare`, `blatte`, `formiche`, `decolla`), `s.a` (l'acqua),
  `s.h.neon`; `--q=blatte=1` fa uscire le blatte anche di giorno.
- **Dopo ogni modifica ai testi dei volantini** (e dopo `genera-404.mjs`):
  `node tools/pzkko/scena/cattura.mjs`, che rifà le foto in `art/scena/vol/`
  (computer, 2 px per unità, ~1,3 MB) e `art/scena/vol-m/` (telefono, ~0,8 MB). La 404 ha la sua scena (il suo volantino
  è fotografato con gli altri).

## La roulette (games/roulette/)

Il volantino «roulette» apre una finestra (`<dialog>`, 800 × 600 sul computer,
a tutto schermo sul telefono) che sembra un foglio grande attaccato al muro col
nastro; `#roulette` nell'indirizzo la apre subito. Il codice si carica solo
quando la si apre (passando sul volantino si precarica).

- **Il tavolo e le fiches** sono cose ferme: il tavolo è un SVG stampato sul
  foglio (`multiply`, un filtro di grana e bordo irregolare come la stampa dei
  volantini), in verticale: lo zero in cima, tre colonne di numeri, a sinistra
  dozzine e semplici, sotto le colonne «2:1». Tutte le 157 puntate di una
  roulette europea (pieni, cavalli, terzine, quartine, sestine, colonne,
  dozzine, semplici; sullo zero le semplici si perdono, niente «la partage»);
  passando sopra una puntata l'evidenziatore giallo segna i numeri coperti e la
  voce a pennarello dice quanto paga. Le fiches (1, 5, 25, 100, 500) e il
  segnaposto di cristallo sono fotografie.
- **Le animazioni delle fiches**: posata, la fiche vola dal mucchio al tavolo
  con un arco (si avvicina, l'ombra si allarga) e la pila fa un colpetto;
  «togli» la riporta indietro; alla fine del giro sul numero uscito cade il
  segnaposto e il pennarello lo cerchia, le puntate perse scivolano via verso il
  banco una pila alla volta, la vincita arriva dal banco accanto alla pila e poi
  tutto vola al saldo, che conta. Niente mani. Con `prefers-reduced-motion` le
  fiches non volano.
- **La ruota** è 3D (three.js): la scodella in mogano laccato con la pista
  sopraelevata, il piano nero coi rombi cromati, il rotore con l'anello dei
  numeri (ordine europeo, cifre in Anton disegnate su una tela), le caselle, le
  palette d'ottone, l'intarsio e la torretta. La pallina la muove **Rapier** (un
  motore fisico vero, in WebAssembly) dentro la stessa forma: rotola sulla pista,
  rallenta per l'aria e il rotolamento, scende, sbatte sui rombi e sulle palette
  e si ferma dove si ferma; il numero è quello della casella sotto di lei. Come
  nelle ruote automatiche, la pallina salta fuori dalla casella da sola e
  riparte dalla pista. «×3» fa correre la pallina tre volte più in fretta.
- **Soldi finti**: i $pzk di `games/pzk.js`, gli stessi del blackjack (vedi
  sotto); gli ultimi numeri restano nel browser (`localStorage`,
  `pzkko-roulette`). Niente premi, niente pagamenti.
- **Le prove**: `node tools/pzkko/roulette/prova.mjs [4122]` (dalla cartella
  `albertopecchini.it`) fa girare la stessa ruota senza browser, in più thread,
  e per ogni giro controlla che la pallina non esca mai, che si fermi davvero in
  una casella e ci resti, che il numero sia quello giusto e che le vincite di
  puntate a caso tornino col conto fatto in un altro modo; fra un giro e
  l'altro passano 2–8 secondi come quando si punta. Alla fine la distribuzione
  dei 37 numeri e quella dei salti da un numero al successivo (chi quadro), i
  tempi e i giri. Il 17.10.2026 (ultima prova, seme 20261017): 4122 giri,
  nessun errore, nessun giro da rifare, ~10 s e ~10 giri sulla pista, ferma
  dopo ~12 s; numeri p = 0,17, salti p = 0,44. Con i giri attaccati uno
  all'altro e il rotore sempre alla stessa velocità i numeri venivano un po'
  troppo legati al giro prima (p ≈ 0,01): per questo il rotore parte fra 1,6
  e 2,6 rad/s e la pallina da un punto della pista che cambia di ±0,3 rad.
- **Le trappole della fisica** (scritte anche in `ruota.js`): Rapier non lascia
  girare un corpo oltre 120π rad/s, troppo poco per una pallina da 19 mm che
  corre a 4 m/s: la simulazione va al rallentatore (`TEMPO`) e fuori si
  riconverte; con l'attrito sulla pista Rapier non fa rotolare la pallina in
  tondo senza strisciare, quindi la pista non ha attrito e la frenata la danno
  rotolamento e aria a mano; `lengthUnit` sotto 1 e la distanza di previsione
  di serie (2 cm) frenano la pallina e costano dieci volte tanto.
- `tools/pzkko/roulette/motore.mjs` rifà `lib/three.js` (solo i pezzi che
  servono, con esbuild) e ricopia Rapier.

## Il blackjack (games/blackjack/)

Il volantino «blackjack» apre la stessa finestra della roulette (`#blackjack`
nell'indirizzo la apre subito): il foglio col nastro, il tavolo stampato sopra,
le fiches fotografate, e le carte vere in 3D.

- **Il tavolo** è un SVG stampato sul foglio come quello della roulette: la
  cassetta del banco in cima, le scritte ad arco («blackjack paga 3 a 2», la
  regola del banco, la fascia dell'assicurazione che paga 2 a 1, le regole del
  tavolo), tre caselle su un arco in basso con i cerchi delle laterali, i limiti
  (5–1.000, laterali 1–100). Si gioca su una, due o tre caselle; la casella 1 è
  quella a destra, la prima alla sinistra del banco: le carte si danno e si
  giocano da destra a sinistra, come al tavolo.
- **Le carte** sono 3D (three.js): carte da casinò a indice grande, 63 × 88,
  con gli angoli tondi, lo spessore e una curva appena accennata; la vernice è
  lucida (clearcoat) e riflette una stanza buia con le lampade di lato, così le
  carte ferme restano nitide e quelle che girano mandano un lampo. La
  telecamera guarda dall'alto e il piano delle carte coincide col foglio (un
  px = un'unità), le ombre cadono sulla carta. Le facce sono disegnate in un
  canvas (`carte.js`): valori in Anton, i semi disegnati a mano, le figure a
  due teste con la mezza figura di gpt-image-2 e la stessa girata di 180°; il
  dorso è rosso pzkko con una trama fine. Le carte escono dal **sabot**
  (acrilico fumé: dentro il mazzo coricato che si accorcia, la carta di taglio
  gialla, il dorso della prossima carta nella bocca), volano e si girano in
  aria, la carta del raddoppio va di traverso, la carta coperta del banco sta
  sotto la scoperta e il banco la **sbircia** alzandone il bordo; a fine mano
  il banco raccoglie da destra a sinistra e tutto finisce nella **vaschetta
  degli scarti**, che cresce. Quando esce la carta di taglio è l'ultima mano:
  alla successiva si mescola, gli scarti tornano nel sabot e si bruciano le
  prime carte.
- **Le regole** sono quelle vere, a scelta («regole di»):
  - *las vegas* — il gioco a sei mazzi della Strip: carta coperta e
    sbirciata col 10 o l'asso, il banco sta su tutti i 17, blackjack 3 a 2,
    raddoppio su due carte anche dopo la divisione, divisione fino a quattro
    mani (anche 10 e figura), assi divisi una carta sola e niente ridivisione
    degli assi, resa tardiva, assicurazione e «alla pari», una carta bruciata;
  - *atlantic city* — come il New Jersey: otto mazzi, al più tre mani divise
    (N.J.A.C. 13:69F-2.11 per i tavoli da sette posti), resa tardiva;
  - *venezia* — il regolamento del Casinò di Venezia (comune.venezia.it): sei
    mazzi, il banco si dà la seconda carta solo alla fine (niente carta
    coperta: se fa blackjack prende anche raddoppi e divisioni), raddoppio solo
    con 9, 10 e 11 (anche dopo la divisione), divisione solo di carte uguali
    fino a tre volte, obbligo di chiedere carta fino a 11, cinque carte
    bruciate, il banco finisce il colpo anche se tutti hanno sballato, da soli si
    punta su almeno due caselle, niente resa né laterali, alla pari pagata
    subito.
  Con las vegas e atlantic city ci sono le due **laterali** più diffuse:
  *perfect pairs* (coppia 6, colore 12, perfetta 25 a 1) e *21+3* sulle due
  carte e la scoperta del banco (colore 5, scala 10, tris 30, scala colore 40,
  tris uguale 100 a 1), pagate subito dopo la distribuzione. Il blackjack paga
  3 a 2 anche sulle puntate dispari: i conti vanno a mezzi $pzk.
- **Le mosse**: carta, stai, raddoppia, dividi, abbandona (dove c'è la resa),
  e all'asso del banco assicura o alla pari; da tastiera C S R D A, e S/N per
  l'assicurazione. Il cartellino accanto alla mano dice i punti (7/17 quando
  l'asso può valere 11), giallo quando tocca a lei; i timbri dicono come è
  andata. «×3» fa dare le carte tre volte più in fretta.
- **Le prove**: `node tools/pzkko/blackjack/prova.mjs [4122000]` (dalla
  cartella `albertopecchini.it`) gioca le mani di ogni regolamento con la
  strategia di base e poi a caso (anche con mosse vietate, che il tavolo deve
  rifiutare) e per ogni mano controlla il sabot (52 × mazzi carte, ognuna una
  volta, le bruciate, la carta di taglio), il banco (tira fino a 16, sta sui
  17, non tira se non serve, a venezia sì), che ogni $pzk puntato lasci il
  tavolo una volta sola, i pagamenti contro un calcolo dei punti fatto in un
  altro modo, i limiti di divisioni, assi e raddoppi, e le frequenze delle
  laterali contro le probabilità esatte del sabot. Il 17.10.2026, 4.122.000
  giri per regolamento: nessun errore; vantaggio del banco con la strategia di
  base 0,36% ± 0,08 (las vegas), 0,34% ± 0,08 (atlantic city), 0,65% ± 0,07
  (venezia); perfect pairs 6,11% (6 mazzi) e 4,10% (8 mazzi), 21+3 4,62% e
  3,70%, come le probabilità esatte.

## La regia (regia/)

Un pannello nascosto per provare il sito senza aspettare la sera o un'auto: si apre
**scrivendo «regia»** sulla tastiera (di nuovo per chiuderlo), con `#regia`
nell'indirizzo o **toccando cinque volte in fretta** la striscia in cima allo schermo.
Il codice si scarica solo allora. È un foglio col nastro come le finestre dei giochi,
ma di lato (sul telefono dal basso, «abbassa» lo riduce alla testata) e senza velo
scuro: la scena cambia dietro mentre si trascina. Ogni comando è una pista stampata
con l'inchiostro dei tavoli e **una fiche da trascinare**: lungo il binario (con
l'evidenziatore fino al valore, le tacche, l'alba e il tramonto segnati in rosso) o
nelle caselle, dove si posa nella più vicina con un colpetto; anche dalla tastiera
(frecce, pagina su e giù, inizio e fine). Ogni zona la sua fiche:

- **il tempo** (gialla): l'ora di Mantova, la velocità (ferma, ×1, ×10, ×60, ×600),
  alba, mezzogiorno, tramonto, sera, mezzanotte, adesso;
- **la sera** (nera): il buio (auto = col tramonto, o fisso), l'insegna e i lampioni
  (auto, spenti, accesi), lo sfarfallio;
- **le auto** (rossa): «passa un'auto» (anche di giorno), ogni quanti secondi, i fari
  (alogeni, led, xeno), il neon sotto, e un'auto ferma coi fari accesi dove si posa
  la fiche;
- **la scena** (verde): esposizione, bagliore, neon, specchi, il muro del DOM in
  trasparenza (`?allinea`), la qualità (ricarica), rifare l'arrivo, il muro senza 3D,
  il glTF;
- **le bestie** e **l'acqua** (blu): ogni specie sì o no, le blatte anche di giorno,
  la velocità, «spaventale», una zanzara davanti alla telecamera; le gocce più fitte
  o più rade, una goccia adesso.

In fondo i numeri della scena (fotogrammi al secondo, l'ora, il buio, qualità e
risoluzione, l'insieme di luci, i programmi) e «rimetti tutto». Niente si salva:
ricaricando torna tutto com'era, tranne l'ora e la velocità che le ricariche della
regia si portano nell'indirizzo. Quello che comanda: `window.pzkkoPagina` (in
`index.html`: l'orologio, che dal 20.10 è uno solo anche per la scena,
`window.pzkkoOrologio`; la sera forzata; le regole delle auto), `window.pzkkoRegia`
(i ritocchi che la scena legge a ogni fotogramma, `REGIA` in `scena/materiali.js`) e
`window.pzkkoScena` (le bestie, la goccia).

## I $pzk (games/pzk.js)

Un portafoglio solo per tutti i giochi: 1.000 $pzk all'inizio, altri 1.000
quando sono finiti (meno di 1 libero e niente sui tavoli). Ogni gioco sposta i
$pzk dal saldo al suo tavolo quando punta e li regola a fine giro; nel browser
(`localStorage`, `pzkko-pzk`) si salva il saldo più quello che c'è sui tavoli,
così se la pagina si chiude a metà giro le puntate tornano. Il saldo della
roulette di prima (`pzkko-roulette`) passa qui da solo la prima volta. Le fiches
(1, 5, 25, 100, 500) sono le stesse foto in tutti i giochi.

**Il regalo di Instagram**: sotto il saldo, in tutti e due i giochi, c'è
«seguimi su instagram: +1000 $pzk». Il link apre il profilo
(instagram.com/albertoxpecchini) e, quando si torna sulla pagina (o dopo 8
secondi), arrivano 1.000 $pzk, una volta sola per browser (`pzkko-pzk-ig`); poi
il link sparisce. Un sito non può sapere chi segue chi, quindi ci si fida.

Ogni strumento o gioco nuovo è una pagina in questa cartella (es.
`tools/nome/index.html`) e il suo volantino «in arrivo» diventa un link.

## Le immagini

`node tools/pzkko/immagini.mjs genera <foglio|tutti>` disegna i fogli su fondo
magenta in `tools/pzkko/lavoro/` (fuori dal repository), `usa <foglio|tutti>`
toglie il magenta con la chiave cromatica, separa i pezzi per cella e li scrive
qui. Le illustrazioni nascono su un cartoncino crema che `usa` rende
trasparente; lo scotch resta traslucido; la lamiera si taglia sul passo delle
doghe.

## La disposizione

Le posizioni non si scrivono a mano in `index.html`: stanno in
`../tools/pzkko/disposizione.js` come pile per colonna (cinque sul desktop, due
sul telefono) e pezzi ancorati ad altri, e `../tools/pzkko/disponi.mjs` le
riscrive nella pagina. `node tools/pzkko/disponi.mjs tutto --foto` (dalla
cartella `albertopecchini.it`) dispone, misura le altezze vere in Chromium, dispone
di nuovo e lascia le foto del muro in `tools/pzkko/lavoro/`; poi si rigenera la
404. Un pezzo nuovo: lo si aggiunge in `index.html` e lo si mette in una pila.

**La serranda** (20.10): `../tools/pzkko/serranda.mjs` fa tutto questo da riga di
comando, per chi ci lavora (Alberto o Claude: c'è anche la skill
`.claude/skills/serranda` alla radice del repository). Dalla cartella
`albertopecchini.it`:

```bash
node tools/pzkko/serranda.mjs                 # stato: parete (unità e metri in 3D), manopole, colonne, spazio libero
node tools/pzkko/serranda.mjs volantino --titolo="…" --testo="…" [--link=…] [--zona=games] [--carta=giallo] [--arte=arte2/dadi]
node tools/pzkko/serranda.mjs pezzo --img=manifesti2/x [--tipo=man|tag|pezzo]
node tools/pzkko/serranda.mjs allunga --sopra=400   # spazio nuovo in cima (o --sotto, --minimo; --telefono, --entrambi)
node tools/pzkko/serranda.mjs comprimi 10           # pile più fitte del 10% (--scala=0.9 pezzi più stretti, --annulla)
node tools/pzkko/serranda.mjs rifai                 # disponi, 404, foto dei volantini per il 3D, foto di prova della scena
```

Il pezzo nuovo va nella colonna più corta (o in `--colonna`, dopo `--dopo`), sul
computer e sul telefono. Le manopole stanno in una riga di `DESK` e `MOB`
(`top`, `bottom`, `minimo`, `passo`, `scala`, lette da `disponi.mjs`). La scena 3D
non vuole niente: la saracinesca è alta quanto la parete del DOM (e la scatola
dell'ombra del sole cresce con lei). `--prova` dice cosa farebbe senza scrivere.
Provato il 20.10 con +450 unità in cima, un volantino nuovo e le pile al 92%: poi
rimesso tutto com'era. `disponi.mjs`, `cattura.mjs`, `foto.mjs` e `trame.mjs`
trovano il browser con `../tools/pzkko/browser.mjs` (Chromium di Playwright, se
no Edge); con Edge le altezze dei volantini vengono qualche unità diverse.

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
cd albertopecchini.it
npm run dev:pzkko   # http://localhost:5182, si ricarica a ogni modifica
```

Il server (`tools/dev.mjs`) serve la cartella così com’è e fa come Vercel con
`vercel.json`: `/x` → `/x/`, `404.html` per le pagine che non ci sono, le stesse
intestazioni. Niente Vite: riscriverebbe `new URL('.', import.meta.url)` dei
giochi senza la barra finale.

## Crediti

La home e la 404 non hanno piè di pagina: credito e badge FrogDR sono stati tolti su
richiesta di Alberto il 9.10.2026 (è il suo sito; i giochi portano ancora il credito).
Le immagini del muro sono generate con openai/gpt-image-2 su Replicate, come le
figure delle carte del blackjack (`art/blackjack/`, il prompt nel `.json`
accanto a ogni figura); i caratteri sono di Google Fonts con le licenze dette
sopra.
