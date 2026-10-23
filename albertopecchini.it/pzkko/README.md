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
  disegnata in SVG, di giorno e coi tubi al neon accesi), `carta/` (nove fogli vuoti con nastro
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
  Il 21.10 `manifesti5/` (la chiocciola a cui red bull mette le ali, il brick
  di estathé attaccato con lo scotch, l'eastpak scarabocchiato, il cartello di
  fragole, mirtilli e lamponi), `landini/` (la copertina e la pagina
  dell'avviamento del libretto d'istruzioni del landini L 25 testacalda, 1957,
  disegnati dal modello: non è la scansione di un libretto vero) e `arte4/`
  (l'illustrazione del volantino di tiktok). Il 22.10, al posto dei tre meme della
  storia, `manifesti6/` (il cartello delle zucche mantovane dipinto su un'asse, il
  cartello stradale di Rivalta sul Mincio rubato e appeso col fil di ferro, il
  promemoria del dentista con l'appuntamento vero, l'offerta della Epson EcoTank
  ET-2825), `manifesti7/` (la pubblicità dell'iPhone Duo «da 3625 $», che non esiste,
  lo scontrino di Tecnomat delle due stufe a legna da 1.803,10 €, il corso di potatura
  dei bonsai, la gita in pullman «verona e l'arena tour»), `manifesti8/` (tre
  manifesti inventati: «MODENA e l'assalto al supermercato», il film; la protesta
  francese contro il carovita; «GEN. VANNACCI AL POTERE?», solo scritte e un berretto:
  niente facce né simboli di partito) e `penne/` (le tre bic cristal della petizione
  legate allo spago, più la nera e la rossa senza cappuccio e i cappucci a parte, che
  fa `../tools/pzkko/penne.mjs` dalla punta della blu; le misure in `penne.json`).
  Ogni WebP porta dentro il prompt con cui è nato; le misure stanno in
  `pezzi.json`. I marchi e i nomi veri su quei manifesti (Moncler, Frisk,
  Lyca Mobile, TIM, Starlink, brat, Unimore, Unibo, Red Bull, Estathé, Eastpak,
  Landini, Epson, Apple, Tecnomat) sono quelli che si trovano su un muro di città,
  disegnati dal modello: non sono pubblicità né collaborazioni, e nessuno di loro ha
  a che fare con questo sito.
  **Le foto vere** (21.10): `amici/` sono gli adesivi con le foto di Alberto e
  degli amici (la persona scontornata da bria/remove-background, col bordo
  bianco dell'adesivo fustellato; quello sul landini all'aratura è una foto di
  simo4gantos8, che firma l'adesivo) e `annunci/ciao.webp` la piaggio ciao del
  volantino «vendo il ciao», dal CR2 della canon. Li fa
  `../tools/pzkko/amici.mjs` (vedi «Le foto vere», sotto); niente metadati.
  `auguri.webp` è il meme degli auguri a @~matti (17.10.2026, torta e scritte
  disegnate tutte da gpt-image-2): si apre entrando nella home fino al
  18.10.2026 alle 20:30, poi lo script lo toglie; dopo si può cancellare.
  `tasto/` (21.10) è il tasto giallo della regia con la rotella, su e premuto
  (gpt-image-2, foglio «tasto» di `../tools/pzkko/fogli.js`).
  `lezioni/` (21.10) sono le immagini della pagina dello strumento lezioni e del
  suo volantino: non disegnate da un modello, fatte dal tool su una lezione
  inventata (vedi «Gli strumenti»).
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
- `games/mine/` — le mine, nella stessa finestra (vedi sotto): `mine.js` e
  `mine.css` (la finestra, il campo stampato, le fiches, il giro), `regole.js`
  (i moltiplicatori, le mine decise dal seme, la partita), `scena.js` (le
  tessere 3D, le gemme, la bomba e lo scoppio, con `../roulette/lib/three.js`),
  `tessere.js` (il dorso e le facce disegnati in un canvas; la mina stampata è
  `art/arte2/bomba.webp`, l'illustrazione del volantino).
- `games/dado/` — il dado, cioè il sic bo, nella stessa finestra (vedi sotto):
  `dado.js` e `dado.css` (la finestra, il tavolo, le fiches, il colpo e la
  campana 3D, con `../roulette/lib/three.js`), `campana.js` (la forma della
  campana e dei dadi e la loro fisica, con `../roulette/lib/rapier.mjs`),
  `regole.js` (le puntate e le due tabelle dei pagamenti). Niente immagini
  nuove: i dadi, il panno e il vetro si disegnano nella pagina, il legno della
  base è quello della roulette.
- `games/moneta/` — testa o croce, nella stessa finestra (vedi sotto):
  `moneta.js` e `moneta.css` (la finestra, il tavolo, le fiches, lascia o
  raddoppia), `lancio.js` (la moneta, il piatto e la loro fisica, con
  `../roulette/lib/rapier.mjs`), `scena.js` (il piatto e la moneta in 3D, la
  telecamera e la lente, con `../roulette/lib/three.js`). Le facce della moneta
  sono in `art/moneta/` (gpt-image-2 il 22.10.2026, `tools/pzkko/moneta/facce.mjs`).
- `games/pzk.js` — i $pzk, gli stessi per tutti i giochi e per il wallet: la sessione (1.000, non si
  salvano) o il conto (vedi «Il wallet e la borsa», sotto).
- `wallet/` — il wallet dei $pzk (22.10 notte), il portafoglio di pelle alla Fallout in alto a sinistra:
  `wallet.js` (gli schermi, la batteria, la borsa, la carta coi moduli) e `wallet.css`; la foto del
  portafoglio in `art/wallet/portafoglio.webp`, le banconote in `art/banconote/` (fogli «wallet» e
  «banconote» di `../tools/pzkko/fogli.js`, gpt-image-2). `../tools/pzkko/wallet.mjs` elenca e cancella
  i conti con la chiave di amministrazione.
- `api/wallet.mjs` — la funzione Vercel dei conti del wallet (nome, PIN, saldo, EUR€, indirizzi, invii,
  banconote trovate: su Vercel Blob), `api/borsa.mjs` la borsa (il cambio PZK/EUR€ e la sua serie);
  `api/_archivio.mjs`, `api/_borsa.mjs`, `api/_conti.mjs` i pezzi comuni (col trattino basso: non sono
  funzioni).
- `tools/lezioni/` — la pagina dello strumento lezioni (`index.html`), lo zip da
  scaricare (`lezioni.zip`, lo fa `../tools/lezioni/pacchetto.py`) e
  l'anteprima per i social (`og.jpg`). Vedi «Gli strumenti», sotto.
- `api/meteo.mjs` — la funzione Vercel che dà alla scena il meteo di Mantova (da
  Open-Meteo, dieci minuti in cache; vedi «Il meteo» e «Vercel», sotto).
- `api/firme.mjs` — la funzione Vercel della petizione (22.10): le firme vere, su Vercel
  Blob (vedi «Vercel», sotto).
- `petizione/` — la petizione «pzkko.it è un bel sito?» (vedi «Com'è fatta la home»):
  `firme.js` (le firme dal server e come si disegnano a mano, per il muro, la scena 3D e
  il foglio da vicino), `petizione.js` e `petizione.css` (il foglio che si avvicina, le
  penne, la scrittura).
- `regia/` — la regia, il pannello per provare e regolare il sito, che si apre scrivendo
  «regia», con `#regia` o con cinque tocchi in cima allo schermo (vedi sotto): `regia.js` e
  `regia.css`.
- `benvenuto/` — lo scontrino delle novità (23.10, versione 3.0 «lumaca catodica»): una
  volta per versione entrando nella home, con «come si accende il 3D»; `?novita` lo rifà vedere.
- `suono/` — i suoni della strada, tutti sintetizzati dal vivo (vedi «Il suono»,
  sotto): `suono.js` (chi ascolta, cosa suona quando e da dove) e `voci.js` (gli
  strumenti).
- `scena/` — la scena 3D della home (vedi sotto): `scena.js` (la telecamera,
  l'inquadratura allineata al DOM, il giro), `mondo.js` (il posto: facciata,
  saracinesca, insegna, porta a vetri, marciapiede, strada, palazzi, lampada,
  auto), `negozio.js` (dentro il negozio: il PC con Ubuntu che si pianta e si
  riavvia in loop, l'easter egg), `lettere.js` (le lettere a scatola dell'insegna, quelle della «coin» vera),
  `fogli.js` (i volantini e i graffiti presi dalla pagina, e la superficie su cui
  camminano le bestie), `acqua.js` (la condensa che scende sulla lamiera e il muro
  bagnato), `bestie.js` (formiche, mosche, zanzare e blatte), `marciapiede.js`
  (le lastre e le pozzanghere, disegnate dallo shader), `spazzatura.js` (la
  spazzatura della casa per terra e il chiusino di pzkkonet), `portachiavi.js` (il token
  della banca $pzk per terra accanto al chiusino, col display che dice i fotogrammi al
  secondo), `banconote.js` (i $pzk persi per terra, che si raccolgono), `tocchi.js` (le cose che si toccano: il citofono, la porta, la roba per terra, le
  pozzanghere), `penne.js` (le bic della petizione appese allo spago), `prossima.js` (l'altra
  pagina col 3D, scaricata in cache mentre si guarda questa: vedi «Il caricamento è il
  pomodoro»), `fronte.js` (il fronte
  del negozio: la porta a vetri, il citofono, la targa del 28, il cartello «chiuso», il
  lucchettone della saracinesca, i graffiti e gli adesivi della facciata), `disegni.js`
  (le immagini disegnate da gpt-image-2 che arrivano in due giri, anteprima e vera:
  quelle per terra e quelle del fronte), `meteo.js` (il meteo
  vero di Mantova: nuvole, nebbia, pioggia, temporale, neve), `luci.js` (il sole di
  Mantova, il cielo, le luci della notte), `materiali.js` (le trame disegnate, il
  profilo e la griglia delle doghe), `scena.css`, `lib/` (three.js r186 con gli
  addon, MIT, `tools/pzkko/scena/motore.mjs`; `gltf.js` è l'esportatore glTF a
  parte, si scarica solo con `?glb=1`).
- `art/scena/` — quello che serve alla scena: `lamiera.webp` e `lamiera-r.webp`
  (il colore e la rugosità della saracinesca, tirati fuori dalla foto `muro.webp`
  togliendole la luce, `tools/pzkko/scena/mappe.mjs`), `pannello.svg` e
  `colature.svg` (il pannello dell'insegna, senza telaio né lettere, e le
  colature, da `insegna.svg`),
  `vol/` e `vol.json`, `vol-m/` e `vol-m.json` (le foto dei volantini per il
  computer e per il telefono, `tools/pzkko/scena/cattura.mjs`), `trame/`
  (intonaco e asfalto, colore e normali, 37 KB in tutto: le disegna una volta
  `tools/pzkko/scena/trame.mjs` con le funzioni di `materiali.js`, che nella
  pagina costavano due secondi fermi; le lastre del marciapiede dal 20.10 le
  disegna lo shader, `marciapiede.js`), `terra/` (la roba per terra: le
  etichette di `kola`, `pechino` e `lucky`, i volantini bagnati `tucson`,
  `pzkkonet` e `menu`, il chiusino: `chiusino` il colore, `chiusino-alt` le
  altezze per la griglia, `chiusino-normali`, `chiusino-lucido`), `fronte/` (dal
  21.10: `citofono` col suo `-normali` e `-lucido`, `lucchetto` e `lucchetto-fondo`,
  `alluminio` e `zoccolo` della porta), `muro/` (gli atlanti della facciata:
  `graffiti.webp`, `adesivi.webp` e `pezzi.json`, con le loro anteprime a metà in
  `muro/lo/`; vedi *Il fronte del negozio*), `carico/` (le foto sfocate del caricamento,
  vedi «Il caricamento è il pomodoro»), `pomodoro/` (il pomodoro del caricamento:
  `matura.webp`, `scoppio.webp`, `macchia.webp`), e le
  **anteprime** `vol-lo/`, `vol-m-lo/`, `terra/lo/`, `fronte/lo/` (le stesse immagini a 128 px,
  2–6 KB l'una, che la scena mette subito: vedi «Il caricamento è il pomodoro»; le
  fa `tools/pzkko/scena/anteprime.mjs`, che `cattura.mjs` lancia da solo alla fine
  di ogni giro di foto).
- Le immagini disegnate di `art/scena/terra/` e `art/scena/fronte/` le fa **gpt-image-2 su
  Replicate**, non il codice: `tools/pzkko/scena/disegni.mjs`
  (`genera <nome…|tutti>`, `recupera <nome> <id>`, `usa <nome…|tutti>`; i prompt
  sono lì). `usa` ritaglia, riduce e scrive i webp; la mappa del chiusino, che il modello disegna come un rilievo
  illuminato, torna a tre livelli netti (fondo, piano, rilievi: le soglie
  dall'istogramma) e ne nascono, una volta lì e non nel browser, le normali e il
  lucido; il colore del chiusino si disegna **da quella mappa** (`input_images`),
  così rilievi e colore coincidono al pixel (lo stesso il citofono, dal 21.10: prima
  la mappa dei rilievi, poi il colore da lei, e dai rilievi le normali e il lucido; il
  fondo del lucchetto nasce dalla sua faccia). Più nomi insieme: un processo
  ciascuno, in parallelo (un errore non ferma gli altri). Il token in
  `albertopecchini.it/.env.local` (escluso da Git). Se l'attesa si interrompe con
  «fetch failed» (il 21.10 è capitato a tutti insieme) la predizione su Replicate di
  solito è finita lo stesso: `recupera <nome> <id>` (l'id dalla dashboard, o da
  `GET /v1/predictions`), senza pagarla due volte.
- `fonts/` — Anton e Archivo Black (SIL OFL), Special Elite e Permanent Marker
  (Apache 2.0), da Google Fonts, serviti da qui; dal 21.10 anche Abril Fatface,
  Shrikhand, Bungee, Black Ops One, Rubik Mono One, Alfa Slab One (SIL OFL) e
  Rock Salt (Apache 2.0), solo il sottoinsieme latino (13–59 KB l'uno).
- `404.html` — pagina non trovata: lo stesso muro, con i resti del volantino
  strappato e un foglio che rimanda alla home
- `storia/` — «com'è nato questo muro» (pzkko.it/storia/), il fun fact: la
  saracinesca vera di Bologna con le tre foto e le Live Photo, cosa è passato
  dalla foto al muro, i metadati come uno scontrino, i meme bolognesi nello stile
  di Better Call Pekko (vedi «La storia», sotto). Dal 21.10 è la home con un
  altro muro: stessa strada, stessa scena 3D, stesso script, rifatta dalla home
  da `../tools/pzkko/genera-storia.mjs`.
- `favicon.png`, `apple-touch-icon.png` — l'adesivo con la chiocciola sulla lamiera
- `og.jpg` — anteprima per i link condivisi (1200 × 630)
- `robots.txt`, `sitemap.xml` (la home e la storia)
- `vercel.json` — intestazioni di sicurezza, URL puliti

## Com'è fatta la home

La pagina è la saracinesca (la foto di riferimento: la serranda di un negozio
chiuso a Bologna, con l'insegna «coin» sopra e i manifesti attaccati sotto).

- **Come parte** (23.10, «per adesso avvialo sia da telefono che da pc in 2d con
  sempre luce sparata»): la home parte **sempre in 2D**, il muro di sempre, sul computer
  e sul telefono, anche dove c'è WebGL2, **a mezzogiorno col sole**: niente buio, niente
  insegna accesa, niente lampioni né auto coi fari, niente pioggia, neve, nebbia o nuvole.
  Il resto è una scelta di chi guarda, in cima alla scheda «grafica» della regia («come
  parte», vedi «La regia»), ricordata nel browser: **il 3D** (`localStorage` `pzkko-3d` =
  `si`; si accende e si spegne ricaricando la pagina), **l'ora vera** di Mantova con la sera
  e la notte (`pzkko-ora` = `vera`; se no `giorno`) e **il meteo vero** nella scena
  (`pzkko-meteo` = `vero`; se no `sole`); l'ora e il meteo cambiano subito. Lo decide uno
  script nella testa di `index.html` (`window.pzkkoScelte`: `scena`, `ora`, `meteo`, e
  `tempo`, il meteo con cui parte la scena); `window.pzkkoPagina.scegli(k, v)` le cambia.
  La luce non è il gioco: le batterie del wallet e del cercapersone (in carica dalle 19 alle 7,
  col cavo che s'infila) seguono l'ora vera anche quando la pagina sta ferma a mezzogiorno
  (`window.pzkkoOrologio.perGioco()`: l'ora vera se l'orologio è fermo a mezzogiorno, quella
  della regia se lo si sposta per provare); il tomodachi chiede il meteo vero solo con
  «meteo vero» scelto in regia.
  Per le prove `?scena=1` accende il 3D e `?muro=1` lo spegne (comanda lui); `?ora=`,
  `?veloce=` e `?notte=` vogliono l'ora vera come prima, `?meteo=` il suo tempo. Quando il
  3D non è scelto la pagina non chiede niente della scena (né moduli, né pomodoro, né
  anteprime, né `/api/meteo`) e non trattiene le illustrazioni dei volantini: provato il
  23.10 sul server di prova, la home di partenza fa 93 richieste e 5,5 MB sul computer
  (1300 × 860) e 67 e 3,9 MB sul telefono (390 × 844 a 3×), le stesse del vecchio
  `?muro=1`; col 3D che partiva da solo erano 411 richieste e 17,3 MB, 393 e 15,2 MB.
- **Il muro e l'insegna** (17.10): l'unica foto vera è la lamiera; sopra è
  tutto SVG. Il muro del palazzo è `art/intonaco.svg` (una piastrella di
  640 px: rumori `feTurbulence` che si ripetono senza giunte, la grana della
  sabbia illuminata con `feDiffuseLighting`, chiazze di colore), un'ombra
  sotto la gronda in CSS. L'insegna è `art/insegna.svg`: telaio d'alluminio,
  pannello bianco sporco, colature dal bordo alto, ruggine in basso, viti,
  le lettere «pzkko» a scatola (dal 20.10 quelle della «coin» vera, le stesse
  della scena 3D, vedi *Le lettere*: faccia bianca traslucida col tubo al
  neon che si intravede dentro, bordino scuro, fianchi grigi, la barra
  dietro, l'ombra) e le colature sul muro sotto il
  cassonetto. L'`h1` è il suo `alt`. Niente lampioni, cavi o scritte intorno.
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
- **Le altre tipografie** (21.10): non tutti i volantini escono dalla stessa
  stamperia. Una classe `t-*` sull'`article` cambia il carattere del titolo
  (`--fa`) e la sua misura (`--ts`: Anton è stretto, gli altri no):
  `t-didone` Abril Fatface (alberto pecchini), `t-tondo` Shrikhand, col titolo
  bruciato (cascina fontana), `t-insegna` Bungee (ti serve un sito?),
  `t-stencil` Black Ops One (mine), `t-mono` Rubik Mono One (tiktok), `t-slab`
  Alfa Slab One (vendo il ciao); `m-sale` scrive le note a mano in Rock Salt
  (ti serve un sito?, dado, vendo il ciao). Cambiando carattere cambia
  l'altezza del volantino: poi `serranda.mjs rifai`.
- **TikTok e la Ciao** (21.10): «tiktok» sta nella zona social sotto
  «instagram», coi tagliandi di @albertoxpecchini; «vendo il ciao» è un annuncio
  vero, con la foto della ciao stampata sopra, il link a whatsapp col messaggio
  già scritto e i tagliandi col numero.
- **Il primo strumento** (21.10): nella zona `tools` il foglio «cercasi
  strumenti» è diventato «lezioni», il link alla pagina dello strumento
  (`tools/lezioni/`, vedi «Gli strumenti», sotto). Sopra c'è la stampa vera degli
  appunti di esempio (`art/lezioni/volantino.webp`), in multiply come
  l'inchiostro delle illustrazioni. Dal 22.10 il suo nome è **pzk$meeting** (la
  registrazione delle videolezioni): il titolo del foglio, della pagina e il file
  scaricato (`download="pzk$meeting.zip"`; sul server resta `lezioni.zip`, e
  l'indirizzo resta `tools/lezioni/`). Il titolo è al 76% (`--ts:.76`): in Anton
  «pzk$meeting» usciva dal foglio. La chiave nelle pile è `vol:pzk$meeting`.
- **La petizione** (22.10, `#petizione`, nella quinta colonna sul computer e nella
  seconda sul telefono): un foglio a4 stampato, «petizione popolare · pzkko.it è un bel
  sito?», con la tabella (n., nome e cognome, data, ora, firma) e sotto tre bic cristal
  (blu senza cappuccio, nera, rossa) legate allo spago e attaccate al foglio con lo
  scotch, che dondolano al passaggio del puntatore. **Le firme sono vere**: le salva
  `api/firme.mjs` (vedi «Vercel») e le vede chiunque apra la pagina. Sul foglio del muro
  le ultime dieci, scritte a mano da `petizione/firme.js` su una tela (`.pet-firme`, in
  multiply come l'inchiostro): ognuna con la sua calligrafia (Caveat, Reenie Beanie,
  Nothing You Could Do, Homemade Apple), un po' storta, la data e l'ora di Mantova e uno
  scarabocchio per firma, tutti decisi dall'id della firma (uguali per tutti); il colore
  è quello della bic scelta. Toccando il foglio (o una penna) **si stacca dal muro e si
  avvicina** (`petizione/petizione.js` e `.css`): il foglio grande è già della sua misura
  finale e parte rimpicciolito e storto sopra quello del muro (FLIP: solo transform e
  opacity, composti dalla scheda grafica), così resta nitido e non scatta; la scena 3D
  sotto, a volo finito, si riposa (non disegna) fino al ritorno. Sul foglio da vicino
  scorrono le ultime 60 firme, la riga nuova è evidenziata: si sceglie la penna, si
  scrive il nome e la penna **va a scrivere davvero**: lo spago si allenta e si tende, il
  cappuccio della nera e della rossa salta via, la punta segue la scrittura (il nome, la
  data, l'ora, lo scarabocchio, ognuno col suo tempo e il suo suono), poi la penna torna a
  dondolare, «grazie! hai firmato alle…» a pennarello e il foglio torna al muro con la
  firma nuova in fondo. Il browser ricorda chi ha firmato (`pzkko-firma`): la sua riga è
  ripassata con l'evidenziatore, e c'è «firma per un'altra persona». Senza server
  (`offline`) il foglio si vede ma non si firma. `pzkko.it/#petizione` lo apre da solo.
  Gli strumenti che fotografano la pagina non caricano il modulo (`?petizione` sì): la
  foto del foglio per la scena è vuota e le firme le scrive la scena dal vivo.
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
  1280esimi della parete (`--x`, `--y`, `--w`, `--r`, alta 3191 dal 22.10, era 2989) e, sotto i
  900 px, in 390esimi (`--mx`, `--my`, `--mw`, `--mr`, alta 5486, era 5228); su un
  tablet la parete non supera i 600 px e la lamiera riempie i lati. Dal 17.10
  la composizione è a pile: cinque colonne da ~250 unità sul desktop e due sul
  telefono, ogni pezzo sovrapposto di poco a quello sopra, graffiti e nastri
  ancorati ai fogli vicini; dopo ogni cambio di testo si rimisurano le altezze
  vere dei fogli (crescono col testo) e si rifanno le pile. I graffiti
  stanno sotto i fogli (`.tag`, in multiply), i manifesti inventati fra i
  fogli (`.man`), le parole sprayate `siti`, `social`, `games`, `tools` sono
  le intestazioni delle zone e gli anchor.
- **La sera a Mantova**: la pagina calcola alba e tramonto di Mantova (calcolo
  NOAA, al minuto, senza rete) e, con l'ora vera scelta nella regia (dal 23.10; di
  partenza l'orologio sta fermo a mezzogiorno di Mantova, `window.pzkkoOrologio.fermo`),
  vive a quell'ora da qualunque posto la si
  guardi. Da 40 minuti prima del tramonto cala un velo blu notte (`.buio`, in
  multiply) e la lamiera si spegne; al tramonto preciso i neon dentro le lettere si
  accendono (strobo d'accensione, poi la luce tiene); 12 minuti dopo i lampioni
  della strada, fuori vista (da lì passano anche le auto);
  la notte è piena 50 minuti dopo il tramonto e all'alba tutto si spegne a
  ritroso. Le luci a scarica sfarfallano: la rete a 50 Hz fa pulsare i tubi a
  100 Hz e il browser, campionando a 60, ne restituisce il tremolio; in più
  ogni tanto un tubo «sputa» (`--f-insegna`, `--f-lampioni`; le variabili si
  scrivono su `html` solo col muro di sempre e solo quando cambiano, e la scena 3D
  legge gli stessi valori da `window.pzkkoPagina.luci`: vedi «La regia»). Con
  `prefers-reduced-motion` niente sfarfallio né strobo. Senza script è sempre
  giorno (fino al 23.10 la notte seguiva il tema scuro del sistema). Prove: `?ora=18:30` (ora di Mantova di oggi),
  `?veloce=60` (il tempo corre 60 volte più in fretta), `?notte=1`: con loro l'orologio
  corre come prima, anche senza l'ora vera scelta.
- **La strada di notte** (con l'ora vera): al tramonto si accende `art/insegna-notte.svg`
  (stessa tela dell'insegna: dentro ogni lettera il tubo al neon bianco
  caldo, la faccia che si scalda intorno a lui, gli elettrodi ai capi, la luce
  sul pannello; dal 23.10 si scarica solo la prima volta che si accende, `data-src`), con un alone e un cono di
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
- **Ferma quando è ferma** (23.10, «fai tutto velocissimo e super ottimizzato»): a pagina
  ferma il filo della pagina dorme, e niente cambia d'aspetto (foto al pixel prima e dopo,
  computer e telefono: identiche). Le mosche, quando sono tutte posate e ferme, non chiedono
  fotogrammi fino alla prossima mossa (o al puntatore che le fa scappare); le formiche, col
  fondo della lamiera lontano dallo schermo, stanno ferme e si riguarda ogni 0,3 s; la goccia,
  con la cima della lamiera fuori dallo schermo, non si anima (resta il plic); il pannello a led
  del wallet (`wallet/banner.js`) disegna solo quando cambia qualcosa; il giro dei suoni
  (`suono/suono.js`) va con un timer a 30 al secondo e non coi fotogrammi, e il motore parte
  dopo il primo gesto quando la pagina non scorre da 0,3 s (calcolare i rumori è mezzo secondo
  fermo sul telefono). **Le immagini lontane**: un IntersectionObserver con qualcosa da
  guardare, finché gira un'animazione (il tubo catodico del cercapersone non si ferma mai), fa
  lavorare la pagina a ogni fotogramma; quello del browser per le immagini `loading=lazy`
  guardava tutte quelle non ancora chieste. Quindi lo script le tiene da parte senza `src`
  (`data-poi`; la scatola resta della sua misura) e le rimette quando lo scorrimento le porta a
  1250 px dallo schermo (2500 con la rete lenta: le soglie di Chrome), senza pigrizia; le altre
  subito. Si scaricano quando si scaricavano prima. Negli strumenti che fotografano la pagina
  (`navigator.webdriver`) e col 3D niente. **La misura dei volantini** (`adatta`, `fette`) legge
  tutto e poi scrive tutto (una alla volta erano ~240 impaginazioni all'apertura, 0,16 s fermi
  sul telefono), tiene spenta la transizione dei fogli mentre li raddrizza (prima tutti si
  giravano al loro posto in 0,32 s all'apertura, e le fette dei tagliandi a volte si misuravano a
  metà giro) e si rifà solo se cambia la larghezza, non per la barra del telefono che va e viene.
  Misure (23.10, Chromium senza finestra, prima/dopo sulla stessa pagina): a riposo con le
  mosche posate il filo della pagina lavora 16 ms al secondo invece di 100 sul computer, 44
  invece di 320–415 sul telefono (390 × 844, processore 4 volte più lento), ~9 fotogrammi al
  secondo invece di 66; dopo un tocco, coi suoni accesi, 25 invece di 97 e 101 invece di 464;
  sul telefono il primo disegno a 184 ms invece di 312 e il compito più lungo all'apertura 96 ms
  invece di 154; scorrendo col dito il fotogramma più lungo della pagina 125–144 ms invece di
  470–500.
- **404**: generata dalla home da `tools/pzkko/genera-404.mjs`
  (`node tools/pzkko/genera-404.mjs` dalla cartella `albertopecchini.it`), da
  rilanciare dopo ogni modifica a `index.html`. Lo stesso per la storia:
  `tools/pzkko/genera-storia.mjs` (vedi «La storia»).

## La scena 3D (scena/)

Dal 18.10.2026 (dal 19.10 anche sul telefono), dove c'è WebGL2 la home non è
più una pagina ma un posto: la stessa saracinesca coi suoi volantini, disegnata
dalla scheda grafica con three.js come la scena di un videogioco, con luci,
ombre e riflessi veri. `?muro=1` tiene il muro di sempre; senza WebGL2 resta
quello, senza che la pagina se ne accorga.
**Dal 23.10 il 3D è una scelta**: di partenza la home è il muro di sempre (vedi «Come
parte» nella home), e la scena parte solo se la si accende nella regia («come parte», in
cima alla scheda «grafica»: `pzkko-3d` = `si` nel browser, la pagina si ricarica) o con
`?scena=1`. Acceso, parte **a mezzogiorno col sole** (l'orologio della pagina fermo, il
meteo `sole`: luci «giorno», `REGIA.meteo` = `window.pzkkoScelte.tempo`), e con l'ora vera
e il meteo vero scelti fa come prima: la sera, la notte, le auto, la pioggia di Mantova.
Gli strumenti che fotografano o registrano la scena (`foto.mjs`, `carico.mjs`,
`suono/ascolta.mjs strada`) la aprono con `?scena=1`.

- **Il caricamento è il pomodoro** (21.10 sera; dal 20.10 era «l'arrivo», senza schermata:
  davanti al nero e a un filo giallo di 2 px chi non lo sapeva ricaricava, credendo il sito
  rotto). Uno script nella testa di `index.html`, se il 3D partirà (scelto o `?scena=1`, WebGL2,
  niente `?muro`; se no non chiede niente e lo script del caricamento, in fondo, non parte),
  mette subito `html.scena-carico` (la pagina trasparente su nero: il muro non si vede
  nemmeno per un attimo) e chiede **per primi** il foglio di stile e i moduli della scena
  (`modulepreload`: chiesti in fondo alla pagina partivano dietro a tutte le sue immagini) e
  `art/scena/pomodoro/matura.webp` (per primo). Poi, nell'ordine:
  1. **subito il pomodoro che matura**, al centro, col contatore sotto («44%, si sta
     preparando…»), già al primo disegno della pagina: finché non arriva `matura.webp` si
     vede il suo primo fotogramma, piccolo, dentro la pagina (`PRIMO`, 2 KB). Fino al 21.10
     sera prima c'era un secondo di nero, che sul telefono diventava 3–4: il timer scattava
     solo quando la pagina era libera, e la scena la teneva ferma a costruirsi e a compilare
     gli shader. Ora la compilazione cede fra un programma e l'altro (`cedi` in `scena.js`:
     il pomodoro va avanti, a pochi fotogrammi), e il pomodoro respira con un'animazione CSS,
     che non si ferma nemmeno quando lo script è occupato. Col processore rallentato 4 volte
     (un telefono) il pomodoro c'è a 0,46 s invece che a 1,5, e la pagina ferma più a lungo
     è 0,24 s invece di uno;
  2. **la sfocatura**: appena arriva, dietro il pomodoro sfuma dal nero la strada da lontano
     com'è al primo fotogramma, sfocata (`.carico-foto`). La foto è alta 120 px sul computer e 160 sul telefono, WebP senza
     perdita (8–20 KB: quello normale, ingrandito 7–8 volte, era tutto a quadretti), e cade
     dove cadrà la tela: da lontano la telecamera sta in un punto fisso, che non dipende dalla
     forma della finestra (`lontano` in `scena.js`), e la finestra decide solo quanto del
     piano della saracinesca si vede, metà altezza 1,22 · max(bh, bw / forma). Le fa
     `tools/pzkko/scena/carico.mjs` in `art/scena/carico/` (la scena fotografata da
     lontano, poi ridotta e sfocata), per computer (forme da 0,7 a 2,1) e telefono (da 0,42
     a 0,8), quattro luci (giorno alle 13, tramonto 25 min prima del tramonto, sera 8 min
     dopo, notte alle 22:30: la pagina sceglie da `--notte`; di partenza, a mezzogiorno, il
     giorno), col sole (dal 23.10: il tempo con cui nasce la scena; prima il dopo pioggia), e scrive i numeri in `FOTO`,
     in fondo a `index.html`; la storia ha le sue (`storia-*`), la 404 niente (`FOTO =
     null`: il nero). Fuori da quelle forme, col movimento ridotto o `?intro=0`, niente
     foto. **Da rifare quando la strada da lontano cambia** (la parete, l'insegna, la
     facciata, le luci): lo fa `serranda.mjs rifai`.
     Il pomodoro matura quanto la scena è pronta (`window.pzkkoCarico` da `scena.js`: i
     moduli, la costruzione, gli shader, le anteprime fino a 0,45), morbido, e quando non
     arriva niente va avanti piano da solo (mai oltre il 97%, mai indietro); intanto cresce
     (da 0,55 a 1 volta). Otto fotogrammi, dal verde chiaro al rosso pieno, il secondo strato
     in dissolvenza sul primo; scoppio e macchia si chiedono solo quando la scena ha i suoi
     moduli (prima rubavano la banda alla scena);
  3. **lo scoppio**: la scena, pronta (le anteprime a bordo, i fogli comparsi del tutto e, se
     arriva entro 1,5 s, la risoluzione piena dei volantini), non si mostra da sola: lo dice
     al caricamento (`window.pzkkoScoppia`), che finisce di far maturare il pomodoro (mai più
     in fretta di 0,8 s dal verde al rosso), lo gonfia tremando (0,3 s), lo fa scoppiare in
     quattro fotogrammi che volano verso la telecamera (0,28 s, ~14 al secondo) e **macchia
     la telecamera**: la macchia copre lo schermo e lì sotto la tela compare di colpo, mentre
     la foto sfocata sfuma nella strada nitida (la messa a fuoco, 0,9 s). Dopo 0,4 s la
     macchia cola giù e sfuma in 1,1 s, piano all'inizio e poi in fretta. Per 0,3 s la
     telecamera non si muove nemmeno se si scorre, e il meteo resta quello della foto (dal
     23.10 il sole, `tieni` in `meteo.js`): col sole di partenza non cambia niente, col meteo
     vero poi va verso quello di Mantova sfumando, senza salti. (Fino al 23.10 la scena nasceva
     col dopo pioggia anche col sole scelto, e le pozze si asciugavano sotto gli occhi.)
     Col movimento ridotto niente scoppio: il pomodoro matura e sfuma. Se le immagini dello
     scoppio non sono arrivate 1,5 s dopo che il pomodoro è maturo, sfuma lo stesso;
  4. **lo zoom che finisce la risoluzione**: dopo mezzo secondo (sotto la macchia che cola)
     la telecamera si avvicina **quanto è arrivata la risoluzione piena** (le foto vere dei
     volantini all'80%, le trame vere per terra al 20%), che si chiede solo ora (chiesta
     insieme alle anteprime gli rubava la banda) e prende il posto delle anteprime man mano
     (una trama per fotogramma, fino a 4 ms; l'anteprima si toglie dalla scheda). Mai
     all'indietro, mai più veloce del volo (2,6 s, anche con tutto in cache), morbida (si
     ferma piano se aspetta una foto); quando è arrivata all'inquadratura di sempre è tutto
     nitido. Dopo 20 s arriva comunque. In basso il **filo giallo** di 2 px dice a che punto
     è; all'arrivo sparisce.
  Il pomodoro lo disegna **gpt-image-2 su Replicate** e lo scontorna **bria/remove-background**:
  `tools/pzkko/scena/pomodoro.mjs` (`genera <matura|scoppio|macchia|tutti>`, `recupera <nome>
  <id>`, `usa`; i prompt sono lì). Il modello disegna su un grigio neutro pieno, bria dà
  l'alfa e `usa` toglie dai pixel a metà il grigio del fondo: dove ne restasse un filo è
  neutro. La prima volta (21.10) era su un blu pieno tolto con la chiave cromatica, e nel succo
  e nei bordi trasparenti il blu si vedeva. `usa` mette i fotogrammi in fila col pomodoro
  allo stesso posto in tutti, sfuma lo scoppio verso i lati della sua cella (il modello lascia
  uscire gli schizzi dell'ultimo fotogramma, che sarebbero tagliati dritti) e scrive in
  `index.html` `PRIMO` e `SCOPPIO`, quante volte un fotogramma dello scoppio è più grande di
  uno di matura (il pomodoro che scoppia è grande quanto l'ultimo maturo); poi
  `genera-storia.mjs` e `genera-404.mjs`. L'uscita di bria resta in `lavoro/` accanto al
  disegno (`.alfa.png`): rifacendo `usa` non si ripaga. Pesano 94 KB (matura, chiesta per
  prima), 134 (scoppio) e 192 (macchia).
  Le illustrazioni dei volantini della pagina (`img.arte`, pigre) col 3D non si
  scaricano proprio (la scena ha le foto dei volantini): lo script nella testa
  le trattiene mentre la pagina si legge e le rimette solo se servono
  (`window.pzkkoTrattenute`: il 3D non parte, `?allinea`, il muro in trasparenza
  della regia).
  **L'altra pagina è già scaricata**: arrivata la telecamera, appena il browser è libero,
  `scena/prossima.js` scarica in cache l'altra pagina col 3D (la storia dalla home; la home
  dalla storia e dalla 404): la pagina e quello che vorrà la sua scena, coi nomi di
  `fogli.js` (le foto dei volantini, anteprime e vere, le immagini di graffiti, manifesti e
  pezzi, le Live Photo, la foto sfocata del caricamento con la luce di adesso); i moduli, la
  strada e il pomodoro sono gli stessi, già in cache. Coi `prefetch` del browser (Chrome li
  tiene cinque minuti senza ridomandarli), dove non ci sono (Safari) con `fetch` a priorità
  bassa; con «risparmia dati» o la rete 2G niente. Provato con un server che risponde come
  Vercel e la rete a 20 Mbit: la storia aperta dopo la home scarica 29 KB invece di 6,1 MB,
  e resta solo il tempo del pomodoro e della costruzione della scena; tornando indietro
  alla home Chrome la ridà dalla cache avanti/indietro, già arrivata, senza ricaricare
  niente (il WebGL non lo impedisce: niente `unload`, niente `no-store`).
- **L'arrivo**: da lontano, dall'altra parte del marciapiede, ad altezza
  d'occhio, tutto il negozio nell'inquadratura (sul telefono la parte alta della
  saracinesca, con l'insegna), fino all'inquadratura di sempre: la distanza cala
  in scala logaritmica (l'avvicinamento ha sempre la stessa velocità a vista) e
  il centro si sposta in proporzione alla distanza, come in un volo in linea
  retta; l'angolo di campo va da quello di lontano (dal 21.10 dipende dalla forma
  della finestra, vedi la foto qui sopra) a quello dell'arrivo con la stessa legge;
  il punto d'arrivo segue lo scorrimento, quindi si può scorrere anche
  durante il volo; toccare o scorrere da lontano fa partire subito. Arrivata, la
  pagina sotto torna a rispondere (si toglie `scena-carico`). Con
  `prefers-reduced-motion` (o `?intro=0`) niente volo: la scena compare già
  arrivata, e le foto vere prendono il posto delle anteprime lì. Se qualcosa va
  storto si torna al muro di sempre. La console dice «costruita, shader, primi
  fotogrammi», «anteprime a bordo in N s» e «pronta, vista, arrivata».
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
  invece di tre, i lampioni di là sono solo lampadine accese, l'auto ha un
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
  5486 dal 22.10), quindi la saracinesca è larga 0,95 m e alta ~13,4 m (i volantini restano
  grandi come quelli veri, ~45 cm); l'insegna, la lampada e il piano di sopra si
  mettono rispetto a lei. Le foto dei volantini sono fatte apposta nella
  disposizione del telefono (`vol-m/`: lì il testo è un po' più grande). Di notte
  la luce di un lampione dall'altra parte della strada prende tutta la parete
  alta. Meno luci accese insieme (ognuna costa a ogni pixel): una lampada
  nell'insegna invece di tre, i lampioni di là senza luce, niente neon sotto
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
- **La vetrina** (21.10): sul computer la telecamera sta più indietro (3,1 m
  dalla saracinesca, era 2,6) e la parete del DOM è più stretta (`54vw` in
  `scena.css`, era 64): si vede più strada, più porta, più marciapiede. **Col
  mouse sul fronte del negozio** (saracinesca, insegna, porta) la telecamera si
  avvicina di 1,25 volte (a 2,5 m: un carrello, non uno zoom, l'angolo di campo
  resta quello e la porta e il marciapiede girano come camminando) **tenendo fermo
  quello che sta sotto il puntatore**, come una lente: quello che c'è intorno si
  allarga attorno a lui, e spostando il mouse la lente lo segue. La parete del DOM
  si scala dello stesso fattore attorno allo stesso punto (`transform: scale()` su
  `.parete`, con `transform-origin` nel puntatore), così i link e i tagliandi
  restano pixel per pixel sotto i volantini (e `?allinea=1` lo mostra anche da
  vicino); la misura di base della parete si rilegge a transform tolta. Una molla
  smorzata porta avanti e indietro in ~0,7 s; fuori dal fronte si torna indietro.
  Solo col mouse e a scena arrivata (col tocco non c'è «sopra», e sul telefono la
  parete è già vicina); la regia la spegne («vetrina», `REGIA.vetrina`).
- **Il posto** (`mondo.js`, tutto in metri: 1 unità della parete = 1,6 mm, la
  saracinesca è larga 2,05 m): le doghe sono poligoni (bombate, col canale al
  giunto e qualche ammaccatura; otto righe per doga, fitte al giunto e larghe
  sulla pancia, e una colonna ogni 17 cm: 6000 triangoli, erano 36 000; la
  vernice è la foto della lamiera senza la
  sua luce, con la rugosità dove c'è sporco e ruggine), le guide, la barra con
  la serratura, la facciata d'intonaco col buco e le spalle (da −10 m a 11 m oltre la
  saracinesca, dal 21.10: da lontano, in una finestra larga, oltre la vecchia, da −5
  a +7, si vedeva il cielo), lo zoccolo di pietra, il pluviale, le cinque finestre del
  piano di sopra (porta, citofono, targa, lucchetto e graffiti: *Il fronte del
  negozio*, sotto). L'insegna è il cassonetto d'alluminio (1,5 m: più stretto della
  saracinesca e centrato su di lei), appena sopra l'architrave, col pannello
  sporco (`pannello.svg`) e davanti le lettere a scatola (vedi sotto, *Le
  lettere*); sopra il cassonetto il trasformatore del neon. A destra la porta a vetri
  del negozio: il vetro è uno specchio vero della strada (Reflector), dentro il
  buio con bancone, scaffali e la spia dell'allarme
  che lampeggia (la stanza fa ombra con le facce davanti, `shadowSide`: il sole e
  la lampada non entrano dai muri, dentro è buio anche di giorno). Davanti il marciapiede di lastre bagnate con le pozzanghere (vedi
  sotto, *Il marciapiede*), il cordolo, l'asfalto, e di là dalla strada cinque palazzi
  con le finestre che la sera si accendono, e due lampioni. In `scena.css` il
  muro è più stretto (`54vw`, dal 21.10; vedi *La vetrina*) e messo in modo che al centro dello schermo
  stia tutto il fronte del negozio, saracinesca e porta: così la porta e la
  lampada (sopra, su un braccio da un metro) entrano nell'inquadratura anche a
  1440 px.
- **Il fronte del negozio** (21.10, `fronte.js`): tutto disegnato da gpt-image-2 su
  Replicate, niente scritto dal codice (prima la targa «12» e il cartello «chiuso»
  erano testo su una tela, la porta e il citofono scatole grigie).
  - **La porta**: il telaio fisso nel muro, l'anta coi montanti da 6,5 cm, il
    traverso a un metro, lo zoccolo pestato dalle scarpe (`zoccolo.webp`), la
    soglia; l'alluminio anodizzato vecchio (`alluminio.webp`) è una trama sola,
    stesa in coordinate del mondo e specchiata, che sui montanti va in su e sui
    traversi per lungo, tutti i profili in una geometria. Il maniglione d'acciaio
    coi distanziali, il cilindro d'ottone con la fessura, tre cerniere. Sul vetro,
    fuori, gli adesivi: l'orario in lettere di vinile bianco, «vietato fumare»,
    «area videosorvegliata», «spingere»; sul montante pzkkonet e l'occhio. Dentro,
    il cartello «CHIUSO · torniamo presto» appeso coi due fili a una ventosa.
  - **La targa del civico 28**: smaltata blu, scheggiata attorno alle viti, con lo
    spessore della lamiera dietro.
  - **Il citofono**: piastra d'alluminio 12 × 18 cm. gpt-image-2 ha disegnato prima
    i rilievi (l'altoparlante a fori, la finestrella del nome, il pulsante, le
    viti), poi il colore **da quei rilievi** (il nome «pzkko» a penna, il pulsante
    d'ottone consumato), così coincidono; dai rilievi `disegni.mjs usa` fa le
    normali e il lucido. **Di notte la finestrella del nome si accende** (la carta
    che brilla coi suoi colori e il nome scuro sopra: `h.citofono`, che `luci.js`
    accende col buio).
  - **Il lucchettone**: un lucchetto d'ottone da 12 cm (`lucchetto.webp`, la faccia
    col marchio «PZKKO 90 mm»; `lucchetto-fondo.webp`, il fondo col cilindro della
    chiave) e il ferro da 18 mm, che tiene chiusa la saracinesca: passa
    nell'occhiello saldato davanti alla barra in fondo (una piastra col buco) e
    nella cambretta murata nella soglia. Gli occhielli sono a 6 cm da terra, quindi
    il corpo non pende: è coricato sul marciapiede, inclinato di 10°, la faccia in su
    e il fondo verso la strada. A sinistra del centro (sul computer 42 cm, sul
    telefono 20), si vede in fondo alla pagina e nella pozzanghera.
  - **I graffiti e gli adesivi della facciata**: i fogli `facciata`, `adesivi` e
    `porta` di `tools/pzkko/fogli.js` (gpt-image-2 su magenta, ritagliati da
    `immagini.mjs usa` in `art/<foglio>/`), messi in due atlanti da
    `tools/pzkko/scena/atlanti.mjs` (`art/scena/muro/`, con le anteprime a metà in
    `muro/lo/`: da lontano un graffito è largo quanto la sua anteprima), così sono
    due chiamate di disegno e non venticinque. Sull'intonaco, bagnati come lui: a
    sinistra del pluviale il pezzo «PZK» argento e la pittura del comune sopra un
    graffito vecchio, fra il pluviale e la guida la tag blu «pzk 2026», sopra la
    porta il pennarello rosso «pekko», a destra lo stencil «DIVIETO DI AFFISSIONE» e
    la tag verde «gimbo»; sulla pietra dello zoccolo la chiocciola col gesso, «mnt» e
    «46100». Gli adesivi sul pluviale sono curvi attorno al tubo (hello my name is
    pekko, unimore ≥ unibo, il teschio, uno strappato), altri sul muro vicino al
    citofono (la nutria, il concerto della chiocciola) e fra il pluviale e la guida
    (MN). Nel ritaglio la chiave del magenta lasciava una velatura rosa sui pezzi
    senza colore (il gesso diventava rosa, lo stencil viola): `atlanti.mjs` la toglie.
  Dopo un disegno nuovo: `disegni.mjs usa`, `anteprime.mjs`, o `immagini.mjs usa
  <foglio>` e `atlanti.mjs`; poi `carico.mjs` (la facciata si vede nella foto del
  caricamento). Dal 21.10 la scena ha ~12 chiamate di disegno in più.
- **L'intonaco vero** (21.10, `intonacoVivo` in `materiali.js`): la facciata
  era una trama procedurale da un metro ripetuta, piatta. Ora nello shader, in
  coordinate del mondo: la stessa trama letta anche a 9 m rompe la ripetizione e
  fa le chiazze larghe dello sporco (più ruvide); le **crepe** (nell'alfa della
  trama `intonaco.webp`: sei passeggiate a caso che si biforcano, `intonaco()`)
  si vedono solo a zone, così non si nota che tornano ogni metro; le **colature
  della pioggia**, righe verticali sottili, appena su tutta la facciata e più
  scure sotto i davanzali delle tre finestre e sotto il cassonetto; la **pittura
  scrostata** a chiazze dal bordo netto col filo d'ombra, sotto il cemento grigio;
  **l'intonaco caduto** in due buchi (fra la guida sinistra e il pluviale, e sopra
  la porta) coi mattoni dentro, i giunti di malta e l'ombra dell'orlo. Una decina
  di letture di rumore per pixel di facciata, come il bagnato. Dopo aver toccato
  `intonaco()` va rilanciato `tools/pzkko/scena/trame.mjs`.
- **Dentro il negozio** (21.10, `negozio.js`, un easter egg: nessuno lo dice):
  sul bancone, dietro il vetro, un PC da ufficio di vent'anni fa (monitor LCD
  beige, torre, tastiera) acceso, con **Ubuntu che si pianta e si riavvia in
  loop**, ~25 s a giro: il BIOS che conta la memoria, l'errore del CMOS e la
  schermata blu del Setup col cursore rosso che va a caricare i valori di
  default, GRUB col conto alla rovescia, i puntini arancioni di plymouth, la
  scrivania con la barra e la dock e un terminale in cui qualcuno scrive il
  comando che manda in crash il kernel (`echo c | sudo tee /proc/sysrq-trigger`),
  il kernel panic riga per riga, lo schermo morto, il nero, e da capo. Lo schermo
  è una tela 2D (320 × 240) disegnata al più dieci volte al secondo, solo quando
  cambia qualcosa e solo se la porta è nell'inquadratura; un materiale senza luci
  col colore oltre l'1, così di notte brilla col bagliore. Sul bancone il
  bagliore dello schermo (un piano sommato, col colore della fase), sulla torre
  il led verde (spento nel riavvio) e quello arancione del disco. Niente luci
  vere: ognuna costerebbe a ogni pixel di tutta la scena. Sei chiamate di
  disegno in tutto. `window.pzkkoScena.h.negozio.schermo` è la tela.
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
- **Le luci** (`luci.js`; dal 21.10 il posto è più chiaro: la luce del cielo,
  l'ambiente e l'esposizione di un terzo in più, di giorno e di notte, e la
  lampada e i lampioni un po' più forti): il sole è dove sta davvero sopra Mantova all'ora
  dell'orologio della pagina (di partenza mezzogiorno, fermo: dal 23.10; con l'ora vera, a quest'ora)
  (lo stesso calcolo NOAA della pagina, più altezza e azimut; la facciata guarda
  a sud-sud-ovest, 200°), con le ombre; il cielo (addon `Sky`) fa da sfondo, da
  luce d'ambiente e da riflesso (PMREM, rifatto quando il sole si sposta). Di
  notte la scena legge ogni fotogramma le luci della pagina
  (`notte`, `insegna` con lo sfarfallio `f-insegna`, `lampioni`, `auto-x`,
  `auto-l`, `auto-c`, `freno`, `neon-auto`, in `window.pzkkoPagina.luci`: dal 21.10
  non più dalle variabili CSS su `html`, vedi «La regia») e accende i poligoni: le
  tubi al neon dentro le lettere (emissivi, col bagliore) e la faccia accesa
  intorno a loro, tre lampade bianco caldo davanti al pannello, la lampada a muro sopra la porta (un faro con le ombre), i lampioni
  di là, le finestre dei palazzi; e **l'auto che passa è un'auto**: una berlina
  sulla strada dietro la telecamera (da x = −10 a 12 m, così esce dallo specchio
  della porta prima di sparire), coi fari che spazzano la saracinesca e la
  porta, i fanali rossi, il neon sotto. Si riflette nel vetro e nelle
  pozzanghere. Prove: `?ora=18:30`, `?notte=1`, `?auto=1` come per la pagina.
- **Le lettere** (`lettere.js`, 20.10): «pzkko» ha **le lettere della «coin» vera**,
  quella sopra la saracinesca di via Rizzoli (le foto in `art/storia/`). Le misure
  vengono da IMG_0334 a piena risoluzione (`D:\disco immagini\Rullino\Anno 2024\09`),
  raddrizzata: la foto guarda in su e in verticale tutto è schiacciato a 0,95;
  ridisegnata con quei pezzi, «coin» cade sul bordino delle lettere vere a un paio
  di pixel. In unità dove la x è alta 100: il tratto è 30; la o è un cerchio di 102
  (sborda di 1 sopra e sotto) col buco di 43; la c un semicerchio di 100 col buco di
  41 e le braccia tagliate dritte; la n un arco di 103 sulle gambe; la i un
  rettangolo di 30 (il puntino è un tamburo largo 71). Gli spazi: fra due tondi 2,
  fra un tondo e un'asta 7, fra due aste 9. La p, la z e la k sull'insegna vera non
  ci sono e sono fatte con gli stessi pezzi: la p è la o con l'asta (giù fino a 152),
  la z e la k col tratto di 30 e gli spigoli vivi come i tagli della c e le gambe
  della n (l'asta della k sale a −58). Le tracce sono in `lettere.js` e, uguali, in
  `art/insegna.svg` e `insegna-notte.svg`. Come quelle vere sono **lettere a scatola**
  (ExtrudeGeometry, dal 20.10 nel pacchetto di three.js della scena): la faccia
  di metacrilato bianco, i fianchi d'alluminio grigio profondi quasi
  mezza x (5,6 cm, con la x alta 12,5), il bordino che tiene la faccia (lo smusso
  della scatola, più scuro dei fianchi: è la riga che sulla foto disegna ogni
  lettera) e la barra su cui sono avvitate, che si vede fra una lettera e l'altra.
  **Dentro, il neon** (come l'insegna disegnata del 9.10, quella col neon che si
  vede dentro le lettere): la lettera è cava e bianca (il fondo è una
  ShapeGeometry delle stesse forme, i fianchi visti da dentro con BackSide), e a
  metà del tratto corre il tubo da 13 mm, a 2,4 cm dal fondo: la p dal piede
  dell'asta e poi il giro della pancia, la z in un pezzo, la k l'asta e poi
  braccio e gamba, la o il giro con un varco in basso a sinistra. Come lo piega un
  vetraio: gli spigoli sono curve, ai capi il tubo gira all'indietro nel fondo (il
  gomito nero dell'elettrodo, il passacavo di gomma), i supporti ogni ~12 cm. La
  faccia è traslucida (opacità 0,7, e non fa ombra: il sole entra e di giorno
  l'interno è chiaro): la lettera resta bianca e il tubo si intravede, spostato
  dalla prospettiva perché sta 3 cm più indietro. La stessa scatola sono tre mesh
  con un gruppo nascosto ciascuna (la faccia, i fianchi, l'interno). Di sera il
  tubo si accende bianco caldo (il gas oltre l'1, il bagliore lo allarga) e la
  faccia e il fondo prendono la sua luce, più forte vicino al tubo (una tela coi
  tubi sfocati, per `emissiveMap`: coperchi e fondo hanno per uv la loro x e y nel
  mondo). Era una faccia bianca accesa tutta insieme: troppa luce, e piatta.
  Hanno la loro **occlusione** sul pannello (`aoMap`: le lettere sfocate, più
  sotto che sopra), che tocca solo la luce del cielo e dell'ambiente: col cielo
  coperto le lettere bianche sul pannello bianco non spariscono. Di sera tre
  lampade bianco caldo davanti al pannello fanno la luce dei neon sul muro e sulla
  saracinesca (sul telefono una), deboli: illuminano anche le facce, da fuori.
  Niente chiocciola, niente rosso né blu: la chiocciola
  resta sull'adesivo della favicon. Le mosche si posano anche sulle facce delle
  lettere (`sopra(x, y)`). **Il tone mapping**: AgX porta al pastello tutto ciò
  che è molto saturo e molto acceso; l'OutputPass (in `scena.js`) per quei pixel
  (i fanali, il neon sotto l'auto) mescola una curva che tiene la tinta, e non
  tocca la carta e i muri, che così in alto non arrivano. Lo sfarfallio resta
  quello della pagina (`--insegna`, `--f-insegna`).
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
  del salnitro (dal 21.10 a chiazze, sfrangiato e granuloso, più tenue: era una riga
  bianca ondulata continua lungo tutta la facciata, finta); ai piedi del rivolo la pozza. Il rivolo disegnato della pagina
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
  facevano scintille, di notte. Quanto è bagnato e quanto sono larghe le pozze lo
  dice il meteo (sotto); la pozza ai piedi del rivolo c'è sempre.
- **Per terra** (`spazzatura.js`): la spazzatura della casa, tutta in 3D, con le
  immagini disegnate da gpt-image-2 (`art/scena/terra/`, `disegni.mjs`) adattate
  ai modelli: la lattina di **pzk-kola** schiacciata e piegata (l'etichetta
  srotolata le gira intorno), la scatola del ramen **pechino** rovesciata coi lembi
  aperti, il manico di ferro e i noodles che escono (la stessa faccia sui quattro
  lati), il pacchetto di **luckypzkko** accartocciato e nove mozziconi, **tre
  volantini bagnati** incollati alle lastre (la **Hyundai Tucson** di pzkko motors,
  **pzkkonet** «la fibra che arriva anche dove non c'è», il menu del ristorante
  **pechino**), sedici **gomme da masticare** appiccicate (vecchie e nere, qualcuna
  fresca rosa o menta) e, dal 22.10, **i grissini alla pizza**: il pacchetto di
  «grissin pzk · gusto pizza» schiacciato e aperto da un lato, sei grissini che escono a
  ventaglio, due per terra (uno rotto in tre pezzi) e le briciole (la faccia del
  pacchetto è `terra/grissini`, la trama dei grissini `terra/grissino`, ritagliata da
  `disegni.mjs usa grissino` dalla finestra del pacchetto). Se un'immagine non arriva
  resta il colore pieno: la scena parte lo stesso.
- **Le cose che si toccano** (22.10, `tocchi.js`): il raggio dalla telecamera passa per
  il puntatore e vince la cosa più vicina; col mouse si suona alla pressione, col dito al
  tocco (il clic: un dito che scorre non suona niente), e sopra le cose il puntatore è
  la manina. **Il citofono**: il pulsante d'ottone è un disco vero sopra quello disegnato
  (la stessa immagine), si abbassa di 2 mm e il campanello trilla dentro il negozio
  finché lo si tiene (fino a 4 s); a volte poi il citofono si apre, fruscia e si richiude
  senza che nessuno parli. **La porta**: il vetro si bussa, i profili d'alluminio
  suonano vuoti, il maniglione la fa sbattere sulla serratura (è chiusa a chiave). Il
  **lucchettone** (ottone contro ferro, dondola), il **portachiavi** (il tasto e le chiavi
  che tintinnano), il **muro**. Per terra **la lattina** (rotola avanti e indietro sulla
  pancia e scivola un filo), il pacchetto di sigarette, la scatola del ramen, i volantini
  bagnati, i grissini (sobbalzano), il **chiusino** (ghisa che dondola nel telaio), **le
  pozzanghere** (dove c'è acqua: il campo delle pozze di `marciapiede.js` rifatto in
  JavaScript, `acquaQui`; tre anelli si allargano dal dito nello specchio delle pozze,
  `ONDE`, quattro tocchi alla volta; sul telefono, senza specchi, solo il suono), la
  pietra, la neve. Sopra i fogli e i link comanda la pagina (i volantini, i tagliandi,
  la saracinesca nuda); l'evento che tocca una cosa porta `pzkkoTocco`, e suono.js non
  bussa anche la saracinesca che c'è dietro. `window.pzkkoScena.tc.trova(x, y)` dice cosa
  c'è sotto un punto della finestra.
- **Le penne della petizione** (22.10, `penne.js`): le tre bic sono modelli (il fusto
  esagonale trasparente col tubetto dentro, il tappino, la punta con la sfera d'ottone, il
  cappuccio con la clip), appese allo spago sotto il foglio della petizione con le misure
  del CSS della pagina; mesh a istanze, una per materiale: tre penne in cinque chiamate di
  disegno. Ognuna è un pendolo smorzato: il vento vero le fa dondolare (e staccare un filo
  dalla lamiera), il puntatore che ci passa sopra le spinge, il foglio che si alza le
  scuote; si appoggiano alle doghe (`superficie` di `fogli.js`). Mentre si muovono le
  ombre si rifanno. Il foglio della petizione, nella scena, ha sopra la sua foto le firme
  vere (`fogli.js`, la stessa `disegna` della pagina, dove `cattura.mjs` ha misurato la
  tabella: `firme` in `vol.json`); mentre il foglio si è avvicinato per firmare, qui
  spariscono foglio e penne (evento `pzkko-petizione`), e la scena si riposa.
- **Il chiusino di pzkkonet**: telaio quadrato di **80 cm** col coperchio tondo,
  **in squadra col marciapiede** (nessuna rotazione: prende due righe di lastre,
  coi lati sulle fughe) e **in mezzo all'inquadratura** in fondo alla pagina (sul
  computer x 1,7 m, z 1,3; sul telefono x 0,5, z 0,9); le lastre intorno sono
  **tagliate sul telaio**, con la loro fuga (`CHIUSINO` in `marciapiede.js`: il
  quadrato entra nella distanza dal bordo di `mLastra`, per le lastre e per le
  pozze). Il **rilievo è vero, in 3D**: una griglia di 192 × 192 quadretti (160 sul
  telefono) alzata dalla mappa delle altezze fino a 6,5 mm sopra le lastre, col
  bordo che scende a filo; la luce la fanno le normali a tutta risoluzione, la
  griglia fa la sagoma e la parallasse. Disegno, colore e altezze vengono da
  gpt-image-2 (vedi `disegni.mjs`): la fascia del bordo, le scritte in tondo
  «PZKKONET · TELECOMUNICAZIONI · ACCESSO VIETATO», i rombi antiscivolo, le due
  asole, negli angoli del telaio altri rombi, in mezzo la chiocciola, «pzkkonet» e
  «D400 · EN 124»; ghisa scura, i rilievi lucidati dalle scarpe, la terra nei fondi,
  la ruggine nella fessura e nelle asole. Le gomme e i mozziconi sparsi non ci
  finiscono sopra; con la neve resta scoperto, come i chiusini veri, scaldati da
  sotto. ~74 000 triangoli sul computer, 51 000 sul telefono.
- **Il portachiavi della banca $pzk** (21.10, `portachiavi.js`): perso per terra
  davanti all'angolo del chiusino verso la telecamera (sul telefono, dove in fondo
  si vede solo il coperchio, sopra il coperchio), il token delle password usa e
  getta che le banche danno ai clienti: stondato (un profilo estruso con una
  smussatura da 3,5 mm), grafite, con l'anello e due chiavi (una Yale d'ottone e una
  di ferro), «banca $pzk» e la fiche gialla da 500 come logo, «fps» in giallo. Il
  **display a led verdi** dice i fotogrammi al secondo della scena (contati in
  `scena.js`, ridisegnati due volte al secondo su una tela 608 × 320: tre cifre a
  sette segmenti in corsivo, i segmenti spenti che si intravedono, il riflesso del
  vetro), con un alone verde per terra (un velo che si somma, niente luce vera:
  una luce in più ricompilerebbe tutti i materiali) e il bagliore della scena di
  sera. Il **tasto giallo** accanto (gomma, con la lampadina stampata) si preme col
  mouse o col dito: si abbassa di 1,5 mm e torna su con un rimbalzo, e la luce si
  spegne (le cifre restano, scure, senza bagliore) o si riaccende; sopra il
  portachiavi il puntatore è la manina (`html.scena-tasto`). Il raggio del
  puntatore lo cerca con una scatola nel riferimento del portachiavi (niente
  `Raycaster`, che `lib/three.js` non ha). Com'era la luce resta nel browser
  (`localStorage` `pzkko-portachiavi`); la regia la comanda anche lei. È **un po'
  più grande** di quelli veri (9 × 4,6 cm invece di 6,5 × 3) e sta inclinato di 11°
  verso la strada, appoggiato sulle chiavi: in fondo alla pagina la telecamera è a
  mezzo metro da terra e un token piatto, da lì, sarebbe una riga; così le cifre
  (1,5 cm) sullo schermo di un computer sono alte una ventina di pixel. Sul livello
  1, come la roba per terra.
- Tutto sempre negli stessi posti (un numero a caso col seme fisso), diversi per
  computer e telefono (`P` in cima a `spazzatura()`: più una cosa è vicina alla
  telecamera, più deve stare in mezzo). Le cose piatte (gomme, mozziconi,
  volantini, il chiusino) sono unite in una geometria per tipo e stanno sul
  **livello 1**: la telecamera lo vede, gli specchi no. Il Reflector prende i
  livelli dalla telecamera, e `mondo.js` le spegne il livello 1 mentre uno specchio
  disegna (prima le pozze ridisegnavano anche il chiusino, e le gocce della
  pioggia).
- **Il meteo** (`meteo.js`, `api/meteo.mjs`): dal 23.10 di partenza è **sempre sole**
  (`REGIA.meteo` = `'sole'`) e i dati non si chiedono nemmeno; scelto il meteo vero nella
  regia (`pzkko-meteo` = `vero`, o il tempo «vero» della scheda meteo), è quello di Mantova, chiesto a
  `/api/meteo` da quel momento e ogni dieci minuti (la funzione lo prende da Open-Meteo,
  gratuito e senza chiave, e lo tiene dieci minuti nella cache di Vercel: Open-Meteo
  riceve una richiesta ogni dieci minuti, non una per visita). Dal codice WMO: sole,
  nuvoloso, nebbia, pioggia, temporale, neve; poi le nuvole (%), la pioggia
  dell'ultima ora e delle ultime 12 (il marciapiede resta bagnato quando ha smesso,
  e asciuga dopo giorni di sole), la visibilità, la neve per terra, il vento.
  - **Nuvole**: il sole si spegne (niente ombre nette), la luce del cielo cresce e
    si fa grigia, il cielo si copre (una cupola grigia davanti al cielo, anche nei
    riflessi: l'ambiente si rifà quando la copertura cambia di 0,1), l'esposizione
    sale un poco (un giorno coperto è piatto, non buio: ~75–85% del sereno).
  - **Nebbia**: la nebbia della scena a pochi metri (il muro, a 2,6 m, si vede
    velato), di notte grigio città; l'insegna e i lampioni col bagliore più largo.
  - **Pioggia e temporale**: le gocce fra la telecamera e il muro, storte col vento
    vero (strisce di 18 cm, il mosso di 1/40 di secondo; quelle a un palmo dalla
    telecamera sfumano), i cerchi nelle pozzanghere, le pozze che si allargano, il
    muro bagnato in basso; col temporale i lampi (ogni 4–14 s, due o tre colpi).
  - **Neve**: i fiocchi che scendono ondeggiando; per terra prima a chiazze nelle
    fughe, poi tutta (più e meno spessa, qualche chiazza pestata), le pozze sparite
    sotto; la pietra si imbianca dove guarda in su.
  Le gocce e i fiocchi sono una mesh ciascuno (3200 e 2200 sul computer, la metà
  abbondante sugli altri livelli), mossi tutti dallo shader in una scatola che segue
  l'inquadratura: niente calcoli a fotogramma. Le strisce sono larghe nel piano del
  muro: `cross( d, vista )`, tradotto in HLSL su Windows, le faceva sparire tutte.
  Tutto passa da uno stato all'altro in un paio di secondi (il bagnato e la neve per
  terra più piano), tranne all'arrivo: se i dati arrivano nei primi 4 s la scena ci
  salta subito. Senza risposta (in locale con un server di file, o se Open-Meteo
  tace) resta il dopo pioggia di sempre. Per le prove: `?meteo=sole|nuvoloso|nebbia|
  pioggia|temporale|neve`, o la regia.
- **Il costo**: due specchi (ognuno un giro di scena, senza multisample) e due
  mappe d'ombra (sole, lampada) che si rifanno **solo quando serve**: gli
  specchi quando la telecamera si muove (uno sì e uno no, alternandosi), nel
  volo e mentre passa l'auto, quando qualcosa si muove, e comunque ogni mezzo
  secondo (la sera che avanza, lo sfarfallio); le ombre quando qualcosa si muove
  (un foglio che si alza o compare, un tagliando, l'auto), quando il sole si è
  spostato di 0,15° (ogni ~40 s) e quando una luce si è appena accesa; di chi è
  spento non si rifanno. Bloom solo quando fa buio. **I pezzi fermi sono uniti**
  (21.10, `fisso`/`fondi` in `mondo.js`): le ~70 scatole, profili e tubi della
  facciata (guide, spalle, zoccolo, finestre, pluviale, telaio della porta,
  cassonetto, lampada, cordoli, lampioni, bancone) stanno in una mesh per
  materiale (e per ombre, e per gruppo), perché ogni mesh è una chiamata di
  disegno in ogni passaggio (lo schermo, due ombre, due specchi): le mesh della
  scena da 242 a 196, le chiamate di un fotogramma fermo da 128 a 116 (il resto
  sono i fogli, uno per volantino), e molte meno quando si rifanno ombre e
  specchi. In `index.html` il `modulepreload` chiedeva ancora `neon.js`, che non
  c'è più (un 404 a ogni visita): ora chiede `lettere.js` e `negozio.js`. Il
  21.10 sulla RTX 3060 Ti di notte, auto ferme, `--libero`: 200–256 fotogrammi
  al secondo con l'intonaco nuovo e il PC (248 prima: alla pari, dentro il
  ballo del 30% fra un giro e l'altro). **Niente anti-alias** (né
  MSAA né altro: il 19.10.2026 sono stati tolti, insieme al filtro «da
  videogioco» alla Buckshot Roulette): in «alta» e «ultra» gli spigoli li liscia la
  risoluzione in più. **La qualità** (dal 21.10 si cambia dal vivo dalla regia,
  senza ricaricare, e la scelta resta nel browser, `localStorage` `pzkko-grafica`;
  `?qualita=bassa|media|alta|ultra|telefono` e `?dpr=` comandano sopra tutto, per
  le prove). La risoluzione interna è una **scala** di quella dello schermo
  (`devicePixelRatio`), con un tetto in pixel per pixel CSS e uno in milioni di
  pixel della tela (`densita` in `scena.js`), e **non scende mai** sotto quella
  dello schermo fino a 1: è lei che decide se le immagini sono nitide, il resto si
  può togliere. bassa = 1×, specchi 256 e 256 × 128, ombre 1024, niente bagliore né
  palazzi, poche luci; media = 1×, specchi 512 e 384 × 192, ombre 1024, bagliore a
  metà risoluzione, poche luci; **alta** = **1,5×** dello schermo (fino a 3, al
  massimo 8,3 milioni di pixel: un 4K), specchi 1024 (il vetro) e 1024 × 512 (le
  pozzanghere), ombra del sole 2048 e della lampada 1024, tutte le luci; **ultra** =
  2× (fino a 4, al massimo 16,6 milioni), specchi 1536 e 2048 × 1024, ombre 4096 e
  2048. **Il telefono** (sotto i 900 px; dal 21.10 sera) ha una scena sola, la
  minima, e niente da scegliere (la regia lì non ha la qualità, e le scelte salvate
  del computer non contano): **alla risoluzione dello schermo** (3× su un iPhone,
  al massimo 12 milioni di pixel), senza anti-alias, **senza ombre** (la mappa d'ombra
  non c'è proprio: `shadowMap.enabled` spento, i materiali non la leggono), **senza
  specchi** (il vetro della porta e le pozzanghere nascosti, le loro tele da un
  pixel), **senza bagliore e senza post-processing**: si disegna dritto sullo schermo
  (`diretta`), e il tono AgX e l'sRGB li fa ogni materiale (alle particelle del meteo
  sono state aggiunte le due righe che lo fanno); la curva che tiene saturi i colori
  accesi (`AGX_NEON`, che sul computer sta nell'OutputPass) entra in ogni materiale
  con `conNeon` (come `bagnato` in `acqua.js`: dopo l'`onBeforeCompile` di prima, con
  la chiave del programma di prima più «neon»), se no sotto il lampione la carta
  veniva slavata. Poche luci, la pioggia e la neve al 40%. **Scorrendo** (21.10 sera)
  la risoluzione scende di un terzo (`moto`: 3× → 2× su un iPhone) e torna piena un
  quarto di secondo dopo che la telecamera si è fermata: da fermo un iPhone faceva 60
  fotogrammi al secondo, scorrendo 22–30, perché Safari compone anche la pagina che si
  muove e la scheda, già al limite a 3×, sforava i 16 ms (e il ritmo dello schermo
  dimezza: 60, 30, 20). Nella prova la scheda lavora 0,9 ms invece di 1,6 a
  fotogramma mentre si scorre. Sotto la scena, i fogli coi link dentro non hanno più
  ombre sfocate né fusioni (`scena.css`): con un link visibile il browser le
  calcolava lo stesso, scorrendo; e `misura` scrive le misure della pagina solo se
  cambiano (la barra di Safari che si nasconde manda un ridimensionamento dopo l'altro). Prima il telefono era 1,5×
  con ombre 1024/512, specchi 384 e bagliore, e un iPhone 16 Pro faceva 20 fotogrammi
  al secondo, un iPhone 14 10. Nella prova del 21.10 (390 × 844 a 3×, la scheda
  della 3060 Ti): di notte 0,9 ms a fotogramma invece di 5,9, con la pioggia 1,25
  invece di 7,1, a quattro volte i pixel. Fino al 21.10 «alta» era 1,25 al
  massimo, cioè su uno schermo normale (devicePixelRatio 1) uguale a «media», e
  cambiarla ricaricava la pagina con l'arrivo da capo: «il selettore non va in
  alta». Ora la regia cambia risoluzione, specchi, ombre, bagliore e palazzi al
  volo (`applica`), anche uno per uno («su misura»); le luci no: poche o tutte si
  decide costruendo, quindi vale il livello con cui si apre la pagina. Le mappe
  d'ombra, per cambiare misura, si buttano e si rifanno (`ombre`): three ne crea
  una alla misura del primo disegno e non la cambia più, e fino al 21.10 «ombre a
  512» cambiava solo il numero. **Il tetto della scheda** (21.10): la tela non passa
  mai `MAX_TEXTURE_SIZE` (né `MAX_RENDERBUFFER_SIZE` e `MAX_VIEWPORT_DIMS`) per lato,
  e nemmeno gli specchi, le ombre e il bagliore: le tele del post-processing sono trame
  grandi quanto lei, e una più grande non si disegna (errore GL 1281, la pagina nera).
  Con una scheda vera il tetto è 16384 e non si tocca mai; ma **LibreWolf**, e Firefox
  con `privacy.resistFingerprinting`, per non farsi riconoscere dicono 2048 di
  qualunque scheda, un `devicePixelRatio` di 2 e 4 core: «alta» chiedeva una tela di
  3820 × 2172 ed era nera, come `?dpr=2` e più. Ora la risoluzione si ferma prima
  (anche sotto 1 se la finestra è più larga di 2048) e la regia lo dice. Quella
  protezione tiene anche **ogni pagina a 60 fotogrammi al secondo** (provato il 21.10:
  LibreWolf 158 sulla 3060 Ti, 60 con la protezione e 165 senza); l'eccezione per un
  sito (`privacy.resistFingerprinting.exemptedDomains`) ridà i limiti veri della
  scheda, ma i 60 restano. Senza i nomi delle schede e con 4 core «auto» lì sceglie
  «media». **Auto** (quando non si è scelto niente): si parte
  da «alta», da «media» se la scheda grafica si presenta come integrata (Intel,
  Apple, Mali, Adreno) o il processore ha 4 core o meno; poi, a foto tutte a bordo e mentre si guarda da lontano (il momento più
  pesante: tutti i fogli in vista), se la mediana dei fotogrammi passa i 24 ms si
  scende di un livello (ultra → alta → media → bassa), fino a tre volte, e la regia
  dice da dove e perché. Il 21.10 sulla 3060 Ti, a 1903 × 951 senza limite
  (`--libero`), di notte scorrendo: «alta» (1,5×) 165–260 fotogrammi al secondo, in
  fondo sul marciapiede ~214; «media» (1×) ~310; «ultra» (2×) 118–229. La scheda
  fa tutta la scena in 2–5 ms anche a 2×: il tempo se ne andava nella pagina (le
  variabili CSS, vedi «La regia»). Triangoli per fotogramma (con ombre e specchi): ~38 000 sul
  computer, ~32 000 sul telefono (erano 390 000 e 600 000). Su una Intel UHD 630
  (il portatile, dove Chrome gira sull'integrata anche se c'è una GeForce) a
  1440 × 900, senza il limite dello schermo (`--libero`): ~120 fotogrammi al
  secondo di giorno, ~90 di notte, il telefono 125–180 (erano 16 di giorno).
  Attenzione alle misure: un'altra pagina 3D aperta sulla stessa scheda (la
  stessa home in un'altra finestra) le dimezza, e un'auto che passa (specchi e
  ombre a ogni fotogramma) le abbassa: ripeterle. Il 20.10, su una RTX 3060 Ti di
  notte, 207–281 fotogrammi al secondo con neon, acqua e bestie e 124–304 con la
  versione di prima (`--radice=`, sotto); le bestie costano ~0,1 ms di processore
  a fotogramma. Con la spazzatura e il meteo (stesso giorno, auto ferme, 900
  fotogrammi, mediana di cinque giri): ~180 contro ~215 della versione di prima,
  sia all'arrivo sia in fondo sul marciapiede (~0,9 ms in più a fotogramma, di cui
  ~0,25 di processore). Per misure così: `--prova` con le auto ferme
  (`window.pzkkoPagina.regola.ogni = 99999`) e più giri alternati, perché un giro
  solo balla del 30%.
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
  `s.h.lettere`; `--q=blatte=1` fa uscire le blatte anche di giorno.
- **Dopo ogni modifica ai testi dei volantini** (e dopo `genera-404.mjs`):
  `node tools/pzkko/scena/cattura.mjs`, che rifà le foto in `art/scena/vol/`
  (computer, 2 px per unità, ~1,3 MB) e `art/scena/vol-m/` (telefono, ~0,8 MB). La 404 ha la sua scena (il suo volantino
  è fotografato con gli altri), e così la storia (i suoi fogli, `storia-*`, e le scritte `.it.foto`). Due fogli con lo
  stesso nome (l'id, o il titolo) fermano `cattura.mjs`: la scena non saprebbe quale foto usare.

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

## Le mine (games/mine/)

Il volantino «mine» (22.10.2026) apre la stessa finestra degli altri giochi
(`#mine` nell'indirizzo la apre subito): il foglio col nastro, il campo stampato
sopra, le fiches fotografate, e venticinque tessere vere in 3D. Il titolo è nello
stencil del volantino (Black Ops One).

- **Il gioco** è quello delle mine dei casinò online: cinque per cinque caselle,
  si sceglie quante mine (da 1 a 24, «con [3] mine» in alto; la scelta resta nel
  browser), si punta (1–1.000: c'è un posto solo, quindi toccare una fiche la
  punta; anche il cerchio «puntata» posa l'ultima fiche) e si gioca; ogni casella
  senza mina è una gemma e alza il moltiplicatore, si incassa quando si vuole,
  una mina si prende tutto. Dopo l'ultima gemma, o arrivati al massimo, si
  incassa da sé. «a caso» scopre una casella qualunque; da tastiera le frecce
  nel campo, Invio, A (a caso) e I (incassa). «rifai» ripunta l'ultima puntata,
  «×3» fa girare tutto tre volte più in fretta.
- **I moltiplicatori** (`regole.js`): dopo k gemme con m mine, l'inverso della
  probabilità di arrivarci, C(25, k) / C(25 − m, k), meno l'1% che tiene il
  banco, troncato ai centesimi: quello stampato è quello pagato (con 3 mine
  ×1,12 alla prima gemma, ×2.277 a tutte e 22; con una mina ×1,03 e, alla fine,
  ×24,75 come con 24 mine alla prima). Si paga a mezzi $pzk per difetto, al più
  1.000.000 $pzk a giro. **La scala** stampata a destra (sotto, sul telefono)
  dice quanto paga ogni gemma e quanto si vince con la puntata di adesso;
  l'evidenziatore sulla riga raggiunta, la freccia rossa sulla prossima.
- **Le mine sono decise prima del primo tocco**, come nei casinò «provably
  fair»: il seme del banco (32 byte a caso, nuovi a ogni giro), il seme del
  giocatore (8 byte, nel browser, `pzkko-mine`) e il numero del giro passano da
  HMAC-SHA256 (chiave il seme del banco, messaggio «giocatore:giro:cursore»);
  ogni 4 byte fanno un numero fra 0 e 1, e 24 numeri pescano le caselle una alla
  volta fra quelle rimaste: le prime m sono le mine. Durante il giro, in piccolo
  sotto la colonna, c'è l'impronta (SHA-256) del seme del banco; a fine giro il
  seme: toccandola si copiano seme, impronta, mine e il modo di rifare il conto.
  SHA-256 e HMAC sono scritti in `regole.js` (quaranta righe) invece di
  `crypto.subtle`, che il browser dà solo in https o su localhost: così le mine
  si giocano anche dal telefono sulla rete di casa. Le mine stanno in un campo
  privato della partita e escono solo a giro finito.
- **Le tessere** (`scena.js`, `tessere.js`) sono 3D come le carte del blackjack:
  la stessa telecamera dall'alto, il foglio sul piano y = 0, un'unità = un px.
  Spesse, con lo smusso e gli angoli tondi, laccate: il dorso rosso pzkko con la
  trama delle carte e un rombo, la faccia color avorio con la cornice stampata.
  Sotto il puntatore (o col fuoco della tastiera) la tessera si alza un poco.
  Toccata si gira come una carta; se è una gemma, ne salta fuori uno smeraldo
  sfaccettato (un brillante a otto lati, vernice e iridescenza, che prende le
  lampadine della stanza riflessa) che gira e ci si posa. Se è una mina esce la
  bomba nera laccata, col collare di ferro e la miccia di corda accesa (la
  scintilla come quella del volantino), trema e **scoppia**: il lampo (la stanza
  si illumina), il fumo che sale, i pezzi della tessera che volano, rimbalzano
  e restano sul foglio o sulle altre tessere, le tessere vicine che saltano e
  ricadono un po' spostate e storte, il foglio che sobbalza, il timbro «boom». Sul
  foglio resta **la bruciatura** (SVG sotto le tessere, una macchia sfrangiata
  diversa ogni volta e la polvere intorno), che si vede fra le tessere anche nei
  giri dopo; restano le ultime quattro. A fine giro le altre caselle si girano a
  onda, a partire dall'ultima toccata, più scure: le gemme stampate e le mine con
  la bomba del volantino (`art/arte2/bomba.webp`, la stessa illustrazione).
  Al giro dopo le gemme spariscono, le tessere tornano coperte e dritte e quella
  scoppiata ricade dall'alto con un rimbalzo. Con `prefers-reduced-motion`
  niente voli né scoppio: le tessere si girano e basta.
- **I $pzk** sono quelli di tutti i giochi; le perdite volano alla cassetta del
  banco, le vincite arrivano da lì accanto alla puntata e poi al saldo. Gli
  ultimi giri sono in fondo alla colonna (il moltiplicatore incassato, o «boom»).
- **Le prove**: `node tools/pzkko/mine/prova.mjs [200000]` (dalla cartella
  `albertopecchini.it`) controlla i moltiplicatori e le vincite contro i
  binomiali esatti in BigInt, SHA-256 e HMAC contro node:crypto, le mine contro
  lo stesso conto fatto con node:crypto e una pesca diversa, che ogni casella sia
  mina quanto le altre (chi quadro, anche sulle coppie), e poi gioca: gemme e
  mina giuste per le mine svelate, le mosse vietate rifiutate (la stessa casella,
  incassare senza gemme, giocare a giro finito), il conto (la puntata lascia il
  tavolo una volta, torna la vincita giusta) e il ritorno al giocatore. Il
  22.10.2026, un milione di giri (77 s): nessun errore; caselle chi quadro 7,0 su
  24 gradi, coppie 312 su 299; ritorno con le strategie che restano sotto il
  massimo 97,95% misurato, 98,90% atteso (z = −0,62). Chi si spinge fin dove il
  massimo taglia la vincita ci perde di più (84,8% atteso, con le strategie a
  caso della prova).

## Il dado (games/dado/)

Il volantino «dado» apre il **sic bo** (tre dadi, «grande e piccolo», il gioco di
dadi dei casinò di Macao) nella stessa finestra degli altri giochi: `#dado`
nell'indirizzo lo apre subito. Il foglio col nastro è quello della roulette,
capovolto; il codice si carica solo quando si apre.

- **La campana** è 3D (three.js) in alto a sinistra: una base bassa di mogano
  laccato (il legno della roulette), dentro il piatto nero col panno verde, il
  collare d'ottone, la campana di vetro col pomolo e i tre dadi d'avorio, lucidi,
  a spigoli tondi, coi punti incavati: neri, l'uno e il quattro rossi e l'uno
  grande, come i dadi cinesi. «scuoti» fa vibrare il piatto: su e giù (8,5–10,5
  Hz, 7–9 mm), un po' di lato e inclinato avanti e indietro attorno a un asse che
  gira, per 1,6–2,2 s, poi si spegne piano. I dadi li muove **Rapier** (lo stesso
  della roulette): saltano fino a 5 cm, sbattono sul vetro e fra loro e si
  fermano dove si fermano; esce la faccia in alto. Se un dado resta storto
  (appoggiato al vetro o a un altro dado) il colpo non vale e la campana si
  riscuote, come al tavolo. Fra un colpo e l'altro i dadi restano dove sono, e
  alla volta dopo la campana riparte da lì; aprendo la finestra mostrano l'ultimo
  colpo. A dadi fermi la scena non si ridisegna.
- **Il tavolo** è un SVG stampato sul foglio (`multiply`, il filtro di grana
  degli altri), come i tavoli di Macao: in alto piccolo e grande (小, 大) ai lati,
  pari e dispari (雙, 單) dove ci sono, le coppie, le triple e la qualsiasi
  tripla in mezzo; sotto i quattordici totali, le quindici combinazioni e i sei
  numeri; i dadi disegnati col pennino, l'uno e il quattro in rosso. Sul telefono
  lo stesso tavolo va a capo in righe più corte. Passando su una casella
  l'evidenziatore la segna e la voce a pennarello dice quanto paga; dopo il colpo
  **il tavolo si illumina** dove vince (come quelli veri), le fiches perse
  scivolano al banco, la vincita arriva accanto alla pila e poi tutto vola al
  saldo. Accanto alla campana gli ultimi colpi, le tre facce e il totale.
- **Le regole** sono quelle vere, a scelta («regole di»), coi pagamenti come li
  riporta wizardofodds.com/games/sic-bo:
  - *macao* — piccolo (4–10) e grande (11–17) 1 a 1, pari e dispari 1 a 1 (ci
    sono solo lì), tutti e quattro perdono con le triple; totale 4 e 17 a 50, 5
    e 16 a 18, 6 e 15 a 14, 7 e 14 a 12, 8 e 13 a 8, da 9 a 12 a 6; coppia (almeno
    due di quel numero, anche nella tripla) 8 a 1; tripla di un numero 150 a 1,
    qualsiasi tripla 24 a 1; combinazione di due numeri 5 a 1; numero singolo 1,
    2 o 3 a 1 se esce su uno, due o tre dadi;
  - *atlantic city* — come il New Jersey: niente pari e dispari, totale 4 e 17 a
    60, 5 e 16 a 30, 6 e 15 a 17, coppia 10 a 1, tripla 180 a 1, qualsiasi
    tripla 30 a 1; il resto come a macao.
  Il vantaggio del banco va dal 2,78% di piccolo, grande, pari e dispari al
  47,22% del totale 5 a macao (vedi le prove).
- **Soldi finti**: i $pzk di `games/pzk.js`, gli stessi degli altri giochi; le
  regole scelte e gli ultimi colpi restano nel browser (`localStorage`,
  `pzkko-dado`). «togli», «rifai», «×3» (la campana tre volte più in fretta) come
  alla roulette.
- **Le prove**: `node tools/pzkko/dado/prova.mjs [41220]` (dalla cartella
  `albertopecchini.it`). Prima le 216 uscite: per ogni puntata, con tutte e due le
  tabelle, quanto rendono le regole contro un conto fatto al contrario (le
  puntate vincenti ricavate dai dadi), e il vantaggio del banco esatto contro
  quello di wizardofodds. Poi la stessa campana del gioco si scuote N volte di
  fila in più thread (i dadi ripartono da dove si erano fermati) e per ogni colpo
  si controlla che i dadi restino dentro il vetro (nel riferimento della campana,
  che si muove), che si fermino dritti sul panno con quelle facce in alto e mezzo
  secondo dopo siano ancora lì, e le vincite di puntate a caso; alla fine le facce
  di ogni dado, i totali (chi quadro) e le facce da un colpo al successivo (i dadi
  non devono ricordarsi da dove sono partiti). Il 22.10.2026 (seme 4122,
  41.220 colpi, ~6 minuti in 18 thread): nessun errore; un colpo dura 2,3 s
  (mediana; fino a 9,6 quando si riscuote), l'1,63% si riscuote (un dado
  storto); il vetro entra nei dadi al più 2,4 mm mentre si scuote; facce p =
  0,31, 0,37 e 0,51 per dado, 0,95 tutte insieme; totali p = 0,63; da un colpo
  al successivo p = 0,50, stessa faccia il 16,90% (16,67% atteso). Col seme
  2026: facce p = 0,43, passaggi p = 0,39, stessa faccia il 16,78%.
- **Le trappole della fisica** (scritte anche in `campana.js`): il vetro comincia
  un centimetro sotto il panno, perché sul bordo aperto della superficie i dadi
  che correvano contro la parete ci passavano attraverso (fino a 7 mm dentro);
  la campana ha la parete dritta in basso e la cupola sopra, perché nella mezza
  sfera un dado su dieci restava appoggiato storto; la vibrazione si spegne in
  0,7 s, perché le ultime scosse piccole fanno ricadere dritti i dadi in bilico,
  e il panno ha poco attrito (0,4), perché un dado caduto contro la parete ci
  restava appoggiato di sbieco (insieme i colpi da rifare scendono dal 3,5
  all'1,6%). Una partenza più secca e più forte toglieva l'ultimo filo di
  memoria fra un colpo e l'altro ma faceva uscire un po' meno il quattro (p =
  0,014) e legava i colpi in un altro modo: scartata. Contatti più rigidi
  (`contact_natural_frequency` 60) facevano entrare il vetro nei dadi di quasi 7
  mm. La telecamera guarda la campana da 60° perché tutto il vetro stia davanti
  alla base: dove dietro non c'è niente three.js trasmette del bianco (la tela è
  trasparente) e la cupola sembrava di latte.

## La moneta (games/moneta/)

Il volantino «moneta» apre **testa o croce** nella stessa finestra degli altri
giochi: `#moneta` nell'indirizzo lo apre subito. Il foglio col nastro è quello
della roulette, capovolto; il codice si carica solo quando si apre (passando sul
volantino si precarica).

- **La moneta** è d'ottone, 32 mm e 2,6 mm di spessore, in 3D (three.js): sulla
  testa un profilo all'antica inventato con la corona d'alloro, «PZKKO» e
  «MMXXVI»; sulla croce una croce gigliata coi quattro punti e un giro di
  perline; il bordo zigrinato. Le facce le ha disegnate gpt-image-2 come mappe
  delle altezze (`tools/pzkko/moneta/facce.mjs`, il prompt è lì e nei `.json`);
  da lì, una volta e non nel browser, il colore (l'ottone bruno nei fondi e
  chiaro sulle creste), le normali, il lucido e il ricalco a matita del tavolo,
  in `art/moneta/`; il bordo rialzato lo rifà il codice, tondo. Il primo foglio
  era una moneta illuminata invece di una mappa, e attorno alla croce la scritta
  girava in «CORSET»: rifatto, con la croce senza scritte.
- **Il lancio**: la moneta sta nel piatto, un vassoio di legno laccato da 25 cm
  (il legno della roulette) appoggiato sul foglio. «lancia»: sale dal fondo, a
  metà salita il pollice la gira sottosopra o no (a caso, vedi sotto), poi la
  tira su a 1,7–2,2 m/s facendola girare 6–11 volte al secondo attorno a un asse
  orizzontale qualunque, con un filo di rotazione su se stessa; sale 20–30 cm
  sopra il foglio, ricade vicino al centro, rimbalza (di solito quattro volte),
  rotola, ondeggia e si ferma, in poco più di un secondo. La muove **Rapier**,
  come la pallina della roulette, ed esce la faccia che resta in su. Se si ferma
  appoggiata al bordo il lancio non vale e si rilancia da lì (meno di uno su
  cento). Fra un lancio e l'altro la moneta resta dov'è.
- **La telecamera** guarda il piatto di sbieco e sale dietro alla moneta che vola
  (la gru: la metà della sua altezza); quando si ferma le va sopra e si gira, così
  la faccia uscita si legge dritta, e la tela sfuma in tondo nel foglio come una
  lente (`--lente`, una maschera CSS animata). Il timbro dice testa o croce. A
  moneta ferma la scena non si ridisegna.
- **Il tavolo** è un SVG stampato sul foglio come gli altri: due caselle, testa e
  croce, con la faccia ricalcata a matita, il nome, «paga 1 a 1» e il cerchio dove
  si punta (anche su tutte e due). Dopo il lancio il pennarello cerchia la faccia
  uscita, le fiches perse scivolano al banco, la vincita arriva accanto alla pila
  e le due pile diventano una. Sotto, le ultime uscite, quanti lanci in tutto con
  la percentuale di testa e croce, e quante volte di fila è uscita l'ultima.
- **Lascia o raddoppia?** Dopo una vincita tutto resta sul tavolo: «lascia»
  incassa, «raddoppia» rilancia tutto (toccando l'altra casella la puntata ci si
  sposta, prima). Si raddoppia quante volte si vuole, e perdendo si perde tutto.
  «rifai» rimette le puntate da cui era partita la serie.
- **Soldi finti**: i $pzk di `games/pzk.js`, gli stessi degli altri giochi; le
  uscite restano nel browser (`localStorage`, `pzkko-moneta`). Testa e croce
  pagano 1 a 1 e la moneta è giusta: il banco non ha vantaggio. «togli», «rifai»,
  «×3» (la moneta tre volte più in fretta) come alla roulette.
- **Le prove**: `node tools/pzkko/moneta/prova.mjs [20000]` (dalla cartella
  `albertopecchini.it`) lancia la stessa moneta del gioco N volte di fila in più
  thread, ogni lancio da dove si è fermato il precedente, e controlla che non esca
  mai dal piatto né passi sotto il fondo, che quando si dice ferma sia piatta e
  mezzo secondo dopo sia ancora lì con la stessa faccia; alla fine testa contro
  croce, quante volte esce la faccia che era in su prima del lancio e quante
  volte la stessa del lancio prima (chi quadro), altezze, giri, rimbalzi e tempi.
  Il 22.10.2026 (seme 4122): 20.000 lanci in 162 s, nessun errore, 173 rifatti
  (appoggiata al bordo, 0,86%); testa 49,81%, croce 50,19% (p = 0,60); la faccia
  che era in su prima del lancio 50,28% (p = 0,43), la stessa del lancio prima
  50,28% (p = 0,44); sale a 19–29 cm, 2,4–10,4 giri (mediana 5,3), 1–7 rimbalzi,
  ferma dopo 0,7–5 s (mediana 1,1).
- **Le trappole della fisica** (scritte anche in `lancio.js`): la fisica da sola
  non è giusta. Partendo con in su la faccia del lancio prima, usciva l'opposta il
  52,2% delle volte (10.000 lanci, p < 0,001: chi puntava sempre sull'altra
  vinceva); le monete vere hanno una preferenza simile, per la stessa faccia, del
  50,8% (Bartoš e altri, 2023, 350.757 lanci). Il mezzo giro a caso del pollice la
  pareggia: con la partenza metà e metà e una moneta uguale dalle due parti, testa
  e croce escono metà e metà per simmetria, qualunque sia la preferenza (che la
  prova misura ancora: la faccia in su quando il pollice la lascia esce il 47,3%
  delle volte). Le tolleranze di Rapier restano quelle di serie, in metri, come
  nella roulette: in centimetri (`lengthUnit` 0,01) la moneta che ondeggia
  affondava nel legno di 1–2 mm in un fotogramma su dieci, così in meno di tre su
  cento e per un attimo (negli urti di spigolo anche 5 mm, per un passo). Il
  cilindro arrotondato di Rapier va meglio di un poliedro a 48 lati, che entrava
  di 8 mm; passi più corti (1/1200 s) non servono.

## La regia (regia/)

Il pannello per provare e regolare il sito senza aspettare la sera o un'auto. Si apre
**scrivendo «regia»** sulla tastiera, con `#regia` nell'indirizzo o **toccando cinque
volte in fretta** la striscia in cima allo schermo (sul telefono). Dal 21.10 al 23.10 c'era
anche il tasto giallo in alto a destra (la rotella, `art/tasto/`, foglio «tasto» in
`tools/pzkko/fogli.js`): il 23.10 Alberto l'ha tolto («togli tasto regia»), e da allora lo
dice lo scontrino delle novità (`benvenuto/`), con «come si accende il 3D» e il tasto «apri
la regia adesso», che la apre sulla scheda «grafica» (in cima c'è «come parte»). Il codice
si scarica solo quando si apre. È un foglio col nastro come le finestre dei giochi, di lato in alto a destra (sul
telefono dal basso, «abbassa» lo riduce alla testata) e senza velo scuro: la scena
cambia dietro mentre si regola. **A schede**, una pagina alla volta (frecce per
passare dall'una all'altra; l'ultima aperta resta nel browser):

- **grafica**, e in cima (dal 23.10) **come parte**: le scelte di chi guarda, che restano
  nel browser, tre righe di caselle: **3D** spento / acceso (`pzkko-3d`; la pagina si
  ricarica, al posto di «muro senza 3D» e «con il 3D» che c'erano nelle prove), **ora**
  sempre giorno / vera (con la notte) (`pzkko-ora`) e **meteo** sempre sole / vero
  (`pzkko-meteo`), questi due subito, senza ricaricare. Di partenza: spento, sempre giorno,
  sempre sole (vedi «Come parte» nella home). Misurate il 23.10: sul computer i nomi a x 840
  e le caselle a 952 come tutti gli altri controlli della scheda, sul telefono 14 e 104,
  ogni gruppo centrato sulla sua riga, tutte le caselle su una riga sola. Le schede «ora e
  sera» e «meteo» dicono in cima come si parte e che lì si prova soltanto. Poi
  la qualità della scena 3D (auto, bassa, media, alta, ultra, su misura;
  vedi «Il costo» nella scena), con la riga che dice com'è adesso (il livello, i pixel
  per pixel, la tela, se «auto» è scesa e perché); i suoi pezzi uno per uno
  (risoluzione 1×, 1,5×, 2×; ombre 512–4096; riflessi spenti, bassi, medi, alti,
  tanti; bagliore spento, a metà, pieno; i palazzi di fronte), che la fanno «su
  misura»; i ritocchi (esposizione, forza del bagliore, luce dell'insegna), la vetrina
  col mouse, la luce del portachiavi per terra. Tutto dal vivo, niente ricariche; la
  qualità e la luce del portachiavi restano nel browser. Sul telefono la scena è una
  sola, la minima (sopra): la scheda dice com'è, e restano l'esposizione, la luce
  dell'insegna e il portachiavi;
- **ora e sera**: l'ora di Mantova (l'alba e il tramonto segnati in rosso), la
  velocità (ferma, ×1, ×10, ×60, ×600), alba, mezzogiorno, tramonto, sera, mezzanotte,
  adesso; il buio (auto = col tramonto, o fisso), l'insegna e i lampioni (auto,
  spenti, accesi), lo sfarfallio;
- **meteo**: il tempo (vero = Mantova adesso, sole, nuvole, nebbia, pioggia, tuoni,
  neve), quanto è forte, il bagnato e la neve per terra (auto = col meteo, o fissi),
  «un lampo», i dati veri di adesso;
- **strada**: le auto («passa un'auto», anche di giorno, ogni quanti secondi, i fari
  alogeni, led o xeno, il neon sotto, un'auto ferma coi fari accesi in un punto); le
  bestie (ogni specie sì o no, le blatte anche di giorno, la velocità, «spaventale»,
  una zanzara davanti alla telecamera); le gocce più fitte o più rade, una adesso;
- **suono**: i suoni della strada (`suono/`, sotto): acceso, il volume, e ognuno da
  provare;
- **prove**: il muro del DOM in trasparenza (`?allinea`), rifare l'arrivo, il glTF
  (questi due ricaricano la pagina; il muro senza 3D, dal 23.10, è l'interruttore in cima a
  «grafica»), e i numeri della scheda (il
  suo nome, i programmi, i disegni e i triangoli dell'ultimo passaggio, l'insieme di
  luci).

Le scelte sono **caselle stampate** come quelle del tavolo, con l'evidenziatore giallo
su quella scelta, e i valori continui **cursori** col binario stampato, l'evidenziatore
fino al valore e la fiche come pomello (la casella «auto» a sinistra, dove c'è, fa
seguire il valore da solo: il pomello mostra quello che segue); tastiera e lettori di
schermo sono quelli dei controlli del browser. In fondo i numeri della scena
(fotogrammi al secondo, l'ora, il buio, qualità e risoluzione, l'insieme di luci, il
meteo) e «rimetti tutto» (l'ora di partenza, mezzogiorno o quella vera, la sera col
tramonto, le auto a caso, il volume, i ritocchi, il meteo di partenza; la grafica e «come
parte» no: sono scelte). Il resto non si salva: ricaricando torna
com'era, tranne l'ora e la velocità che le ricariche della regia si portano
nell'indirizzo, se la regia le ha cambiate (dal 23.10: prima sempre, e così `?ora=` restava
attaccato all'indirizzo). Le ricariche mettono l'indirizzo nuovo con `history.replaceState`
e ricaricano: assegnato a `location.href`, se cambiava solo `#regia` il browser non
ricaricava. Quello che comanda: `window.pzkkoPagina` (in `index.html`: l'orologio,
che dal 20.10 è uno solo anche per la scena, `window.pzkkoOrologio`; la sera forzata;
le regole delle auto; le luci, `luci`; le scelte di «come parte», `scelte`, `scegli`,
`partenza` e `rimettiOra`), `window.pzkkoRegia` (i ritocchi che la scena
legge a ogni fotogramma, `REGIA` in `scena/materiali.js`) e `window.pzkkoScena` (la
grafica, `grafica()` e `imposta()`; i fotogrammi al secondo, `fps()`; il portachiavi,
`pc`; le bestie, la goccia, il meteo: `meteo` lo stato, `me.lampo()`).

**Lenta e pesante, fino al 21.10.** Sulla 3060 Ti di sera la scena faceva 66–127
fotogrammi al secondo, e con la regia aperta 55: la pagina scriveva le luci della sera
(lo sfarfallio dei neon, le auto) come variabili CSS su `html` **a ogni fotogramma**, e
ogni scrittura costringeva il browser a ricalcolare lo stile di tutta la pagina (~4 ms,
il muro sotto ha migliaia di elementi), e a ridipingere la regia, che era un foglio di
piste SVG col filtro dell'inchiostro (rumore e spostamento) in `multiply`, rifatte due
volte al secondo. La scheda grafica intanto finiva la scena in 2–5 ms. Ora la pagina
tiene le luci in `window.pzkkoPagina.luci`, da dove le legge la scena (`luci.js`), e
con la scena 3D (`html.scena3d`) le variabili non le scrive più (il muro sotto è
invisibile); senza, le scrive solo quando cambiano. La regia è HTML piatto (caselle,
cursori del browser; la carta su un livello suo che non si ridipinge) e tocca solo
quello che è cambiato, solo nella scheda aperta. Stessa sera, a risoluzione 1,5× invece
di 1×: ~165 fotogrammi al secondo con e senza regia, 310 a 1×. Il selettore della
qualità, poi, ricaricava la pagina (sette secondi con l'arrivo) e «alta» su uno schermo
normale era uguale a «media»: vedi «Il costo».

**Aperta prima della scena** (21.10): la regia aperta durante il caricamento, e quella
che si riapre da sé dopo ognuna delle sue ricariche («rifai l'arrivo», il glTF: tornano
con `#regia`, prima che il 3D ci sia), restava «senza 3D» per sempre, e «con il 3D»
ricaricava nello stesso punto: un giro da cui si usciva solo ricaricando da zero, senza
`#regia`. Ora, se il 3D sta arrivando (`html.scena-carico`), al posto delle parti della
scena c'è «il 3D arriva», che diventa la grafica, il meteo, le bestie e l'acqua appena
`window.pzkkoScena` c'è; «senza 3D» solo se il 3D non c'è davvero (dal 23.10 dice se è
spento, o acceso ma non partito: niente WebGL2, o un errore).

**Il contesto perso** (21.10, `scena.js`): se la scheda grafica perde il contesto WebGL
(un driver che si pianta, la memoria che finisce, un'altra pagina 3D), la tela restava
nera e bisognava ricaricare da zero. Ora la scena si ferma (niente disegni né
compilazioni su un contesto perso), e quando il browser lo ridà ricompila tutto in
parallelo come all'inizio, rifà il cielo come ambiente (`l.rifai()`), le ombre e gli
specchi, e riparte da dov'era; se non torna entro 8 s ricarica, ma senza l'arrivo
(`sessionStorage` `pzkko-subito`). `?perdi=1` lo prova: perso dopo 3 s, ridato dopo 1
(ricompilata in 0,1 s, la strada di nuovo intera).

## Il suono (suono/)

Dal 21.10.2026 la strada si sente. Niente file audio: ogni suono è sintetizzato dal vivo col
Web Audio (`voci.js`: oscillatori e rumori filtrati; le cose fatte di mille pezzi, come la
pioggia sulla lamiera, i grilli, i tuoni e la carta, calcolate una volta in un tampone; le
campane in un `OfflineAudioContext`), e si sente quello che c'è nella scena, da dove sta la
telecamera, all'ora di Mantova. Sono 70 KB di codice (23 compressi), che si scaricano solo
quando i suoni partono. Dal 23.10 seguono le scelte di «come parte» (la regia): di partenza
è mezzogiorno, fermo (il giorno, gli uccelli, il traffico di mezzogiorno; niente campane,
che suonano solo se il tempo passa da sé), e c'è il sole (l'asfalto asciutto: senza 3D il
bagnato è 0,15, col meteo vero 0,4 come prima; nel 3D quello della scena).

- **Come parte**: il browser lascia suonare una pagina solo dopo un gesto. Al primo tocco o
  tasto (non lo scorrimento) i suoni partono sfumando, in tre secondi; il nastro «suono» in
  basso a sinistra (carta gommata, a pennarello: barrato quando è spento, le onde respirano
  quando suona) li spegne e li riaccende, e il browser se lo ricorda (`pzkko-suono` in
  `localStorage`: chi li ha spenti non li sente più partire da soli). Il contesto audio nasce
  dentro il gesto (Safari lo vuole lì) e passa a `suono.js`; sull'iPhone è «ambient»: rispetta
  il tasto del silenzioso e non ferma la musica. Con la pagina nascosta tutto si ferma;
  mentre si gioca (i giochi sono finestre modali) la strada si abbassa.
  `window.pzkkoSuono`: `acceso`, `volume`, `accendi(sì, ricorda)`, `prova(nome)` per la
  regia, `evento(nome, dati)` per la pagina e la scena (finché il motore non c'è, gli eventi
  aspettano in coda: i vecchi si buttano, le auto si suonano da dove sono arrivate).
- **Chi ascolta**: la telecamera della scena, in metri come lei: ogni suono ha il suo posto e
  si sente più piano, più spento e più dalla sua parte quanto più è lontano; l'eco della strada
  (la coda e le riflessioni del palazzo di fronte, a 12 m, che rimbalzano fra le due facciate)
  se ne prende una parte. Quindi l'arrivo si sente avvicinarsi, l'insegna ronza di più in cima
  alla pagina e la goccia in fondo. Senza 3D gli stessi posti, con lo scorrimento della parete.
- **Sempre**: la città lontana (più forte nelle ore di punta, più piano di notte e la
  domenica; sull'asfalto bagnato sibila), le onde del traffico delle altre strade, il
  condizionatore lassù, il motorino a due tempi in un'altra via (col Doppler), un clacson, la
  tapparella di qualcuno al palazzo di fronte (su a strattoni al mattino, giù da sola la sera,
  col colpo in fondo).
- **Le campane**, oltre i tetti: le ore dalle 7 alle 22, un colpo alla mezza, a mezzogiorno
  il concerto di tre campane a slancio e al tramonto l'Ave Maria, nel momento in cui si accende
  l'insegna. Suonano solo se il tempo passa da sé (la regia che salta di ora non le fa partire).
  Ogni campana ha i suoi parziali (il ronzio, la terza minore, la quinta, la nominale…), e
  ognuno sono due toni vicinissimi che battono.
- **Gli uccelli**, secondo l'ora e la stagione: i passeri (di più all'alba e al tramonto), la
  tortora dal collare, i piccioni (che a volte volano via battendo le ali), la cornacchia; i
  rondoni da fine aprile ad agosto, il merlo all'alba e al tramonto in primavera; di notte la
  civetta e l'allocco (d'autunno di più). Le sere d'estate i grilli, al ritmo della temperatura
  vera di Mantova (la legge di Dolbear: 7·T − 30 cri al minuto), e nei pomeriggi caldi
  d'estate le cicale. Con la pioggia, la neve o la nebbia stanno zitti.
- **L'insegna**: il trasformatore che ronza (50 Hz e le armoniche pari) e il gas che
  sfrigola, con lo sfarfallio della pagina: a ogni salto di luce una scintilla, e
  l'accensione al tramonto crepita.
- **Le auto**: la pagina sceglie la prossima auto prima e la annuncia tre secondi prima dei
  fari (`evento('auto')` in `index.html`), così si sente arrivare; passa dietro la telecamera
  col Doppler (il volume, il lato, l'aria e la frequenza sono curve calcolate per tutto il
  passaggio), sul bagnato sibila, col neon sotto si sentono la cassa e il basso dei tamarri dai
  finestrini chiusi e la targa che vibra, ogni tanto i freni stridono. Quella ferma della regia
  tiene il motore al minimo, e lasciata andare riparte.
- **Il meteo vero**: la pioggia (il velo, le gocce sulla lamiera, quelle nelle pozze, il
  pluviale che si riempie piano e gorgoglia), il tuono dopo ogni lampo (tanto più tardi quanto
  è lontano, lo schianto solo se è vicino: `evento('lampo')` in `meteo.js`), il vento a
  raffiche col fischio nelle fessure e le doghe che sbattono, la nebbia e la neve che ovattano
  tutto; dopo la pioggia gocciola la gronda.
- **Le cose piccole**: la goccia della condensa che tocca la soglia (`evento('goccia')` in
  `acqua.js`); le mosche e le zanzare tigre che ronzano mentre volano, più acute quando
  scattano (quella che la regia manda davanti alla telecamera ronza all'orecchio, da un lato
  all'altro); le blatte che zampettano sulla pietra, solo da vicino.
- **Il negozio**: davanti alla porta (a meno di 7 m, col mouse sul fronte la vetrina ci
  porta), dietro il vetro, il PC di `negozio.js` (che ora dice la sua fase: `fase(now)`): si
  spegne e si riaccende (la ventola, il disco che prende i giri), il bip del POST, il floppy,
  il disco che lavora, qualcuno che va nel Setup con le frecce, le quattro note di legno della
  scrivania (non è il suono di Ubuntu), la password, il comando battuto, Invio; poi il panico,
  e da capo.
- **Le mani**: il foglio che si alza fruscia, il tagliando si strappa, il pomodoro del
  caricamento fa splat (se i suoni sono già accesi). Dal 22.10 (col mouse alla pressione, col
  dito al tocco): **un foglio toccato** schiocca contro la lamiera col suo materiale
  (`data-suono` in `index.html`: la carta, la carta lucida dei poster, il cartoncino del
  dentista, lo scontrino termico che crocchia, l'asse di legno delle zucche, il cartello di
  lamiera smaltata che ondeggia sul fil di ferro e ricade sulla saracinesca); **la saracinesca
  nuda**, rifatta: il tonfo delle nocche, il rombo grave del telo di doghe, la lamiera, le doghe
  che ballano nelle guide sempre più fitte e più piano, più secca in basso (la barra chiusa col
  lucchettone), più rimbombante a metà, più ballerina in alto. **Le cose della scena**
  (`tocchi.js`, evento `tocco`), ognuna col suo strumento e dal suo posto nel mondo: il
  campanello (il pulsante che scatta, il campanello elettrico dietro il vetro che trilla finché
  si tiene premuto, il citofono che a volte si apre e fruscia), il vetro, l'alluminio, il
  maniglione, il lucchettone, il portachiavi, la lattina, la carta bagnata, il pacchetto, il
  cartone, i grissini, la pozzanghera (lo schiaffo, il «plop» della bolla, gli schizzi), la
  pietra, la neve, il chiusino, il muro. Sono **corpi percossi** (`corpo` e `batti` in
  `voci.js`): i modi di vibrazione di ogni materiale calcolati una volta in un tampone, tre
  varianti un filo diverse, così due colpi di fila non sono mai uguali. **La petizione**: il
  foglio che si stacca e torna, le penne che si urtano, il cappuccio che salta via e torna con
  un clic, **la biro che scrive** (lo sfrigolio della sfera mosso dai tratti, il tamburo della
  carta sulla lamiera; la firma più veloce, a occhielli).
- **Il banco**: tutto passa da un filtro (la nebbia e la neve), da un compressore (i tuoni) e
  dal volume. I punti usa e getta (un uccello, una goccia) si staccano da soli dopo 30 secondi.
- **La regia** ha la scheda «suono»: acceso, il volume, e ogni suono che capita da solo da far
  partire adesso (dal 22.10 anche le cose che si toccano: campanello, vetro, maniglione, lattina,
  pozza, chiusino, cartello, l'asse delle zucche, la carta, la biro).
- **Le prove**: `node tools/pzkko/suono/ascolta.mjs strumenti [nome…]` registra ogni strumento
  da solo in un `OfflineAudioContext` di Chromium; `… strada [giorno|notte|temporale|tramonto|
  zanzara|negozio]` registra la home vera col 3D, dal vivo (20–30 s l'una). Per ognuno scrive in
  `tools/pzkko/lavoro/suono/` il WAV, lo spettrogramma (PNG: il tempo in orizzontale, la
  frequenza in scala logaritmica da 40 Hz a 16 kHz, le righe a 100 Hz, 1 e 10 kHz) e dice i
  livelli: RMS secondo per secondo e il picco, in dBFS. Il 21.10: il fondo della strada sta a
  −30 dBFS, gli uccelli e le auto vicine a −20/−10 di picco, l'Ave Maria a −22, un tuono vicino
  a −7. Il nastro, negli strumenti che fotografano la pagina, non c'è (`navigator.webdriver`);
  `?suono` lo fa vedere lo stesso.

## I $pzk (games/pzk.js)

Un portafoglio solo per tutti i giochi e per il wallet. Dal 22.10 notte due modi:

- **la sessione**: chi non entra ha 1.000 $pzk che durano la sessione del browser
  (`sessionStorage`, `pzkko-pzk-sessione`) e non cambiano mai; a secco (meno di 1 libero e
  niente sui tavoli) il gioco ne dà altri 1.000. Niente EUR€, niente borsa.
- **il conto**: chi entra nel wallet ha i suoi $pzk salvati sul server (`api/wallet.mjs`) e
  soggetti alla borsa. I giochi girano nel browser, quindi il saldo lo manda il browser (`salva`,
  un secondo dopo ogni cambio e subito quando la pagina si nasconde); il token e l'ultimo stato
  stanno in `localStorage` (`pzkko-wallet`) e la pagina riparte con quelli mentre chiede al server.
  A secco: se ci sono EUR€ si apre il wallet per convertirli, se no il **sussidio**, 1.000 $pzk una
  volta al giorno (`perche()` dice al gioco cosa dire).

Ogni gioco sposta i $pzk dal saldo al suo tavolo quando punta e li regola a fine giro; si salva il
saldo più quello che c'è sui tavoli, così se la pagina si chiude a metà giro le puntate tornano. Le
fiches (1, 5, 25, 100, 500) sono le stesse foto in tutti i giochi. Sotto il saldo di ogni gioco, col
conto, la riga `rigaEuro()`: «hai anche EUR€ 12,50 nel wallet: convertili in $pzk» apre il cambio.

**Il regalo di Instagram**: «seguimi su instagram: +1000 $pzk», nei giochi e nel wallet. Il link apre
il profilo (instagram.com/albertoxpecchini) e, quando si torna sulla pagina (o dopo 8 secondi),
arrivano 1.000 $pzk, una volta sola: per browser nella sessione (`pzkko-pzk-ig`), per conto col
conto (lo segna il server). Un sito non può sapere chi segue chi, quindi ci si fida.

## Il wallet e la borsa (wallet/, api/wallet.mjs, api/borsa.mjs)

**Il wallet** (22.10 notte) è il tasto in alto a sinistra. Dal 23.10 sera è un **banner**, alto come il tasto
di prima: una striscia di pelle cucita con la piastra d'acciaio rivettata e un pannello a led lungo (la foto
`art/wallet-banner/banner.webp`, foglio `wallet-banner` di `tools/pzkko/fogli.js`; il vetro misurato sulla foto, da x 62
a 713 e da y 63,5 a 154,5 su 792 × 214). Il pannello lo accende `wallet/banner.js`: dice **sempre i $pzk** (a destra,
come un registratore di cassa); **col cursore sopra** (o col fuoco della tastiera) ci scorrono tutti i dati del wallet
come su un tabellone di borsa (saldo, sul tavolo, EUR€, quanto valgono in euro, PZK/EUR€ con ▲▼ delle 24 ore e
dell'ultima ora, il grafico delle 24 ore fatto di led, min e max, 1 € in $pzk, capitalizzazione e conti, nome e
indirizzo, batteria, ultima mossa, ora del cambio; ogni voce si scrive coi dati del momento in cui entra nel nastro);
**col clic** si apre il wallet. Quando il saldo cambia lampeggia la differenza e il numero corre al valore nuovo. Le
lettere sono il Fake Receipt messo led per led: il carattere è una matrice di 5 × 8 puntini (passo 93 unità), i centri
trovati con la trasformata di distanza e agganciati alla griglia; M, W, €, S, $, ° e la punteggiatura rifatti a mano
sulla stessa griglia (la tabella `LETTERE` in banner.js). Al tocco niente nastro: il dito apre il wallet. Si apre (dal 23.10 grande quanto
entra nella finestra e nel mezzo, per leggere bene gli schermi; niente «×»: si chiude toccando fuori) su un
portafoglio di pelle usato, aperto, customizzato come un Pip-Boy di Fallout (la foto
`art/wallet/portafoglio.webp`: la pelle, la piastra d'acciaio rivettata, il nastro adesivo, i tasti
gialli, la manopola, la porta usb-c sul fianco sinistro; gli schermi nella foto sono spenti, li
accende `wallet.js` in percentuale sulla foto, `POS`). A sinistra il **saldo in $pzk** a led verdi
(sotto, quanto vale in €), gli **EUR€** a led ambra, la **batteria** su un lcd (100 % alle 7 di
mattina, 2 % alle 7 di sera, poi in carica fino alle 7 col cavo usb-c infilato nella porta, ora di
Mantova, `window.pzkkoOrologio`) e la targhetta incisa con l'**indirizzo**. A destra **la borsa**: il
grafico del cambio PZK/EUR€ (la manopola gira il periodo: 24 ore, 7 giorni, 30 giorni, da sempre; dal 23.10 il pomello
gira davvero, un quarto di giro a scatto e sempre in senso orario: è il pezzo di foto del pomello ritagliato tondo, con la
tacca gialla sul bordo),
il cambio e il suo inverso, la variazione del periodo, la capitalizzazione (i $pzk di tutti i
conti, quanti conti) e i fattori del momento (il meteo, la temperatura, giorno o notte, se c'è
stato un commit). Aprendo il wallet qualche **mosca** esce dalle taschine (quella sotto il saldo e quella delle
banconote; otto se sei al verde), ronza e vola via (`mosche()`, le mosche di `art/mosche/`). I quattro tasti gialli
aprono la loro pagina **dentro lo schermo del grafico**, al posto del grafico, coi fosfori verdi (dal 23.10: prima
sfilavano una carta sotto il portafoglio); ripremendo lo stesso tasto, o con Esc, torna il grafico. Sul telefono la pagina
si apre come uno schermo grande nel mezzo. Le pagine sono (la funzione si chiama ancora `carta()`) coi moduli: **conto**
(entra o crea il conto: un nome e un PIN di quattro cifre, niente di più; il conto nuovo parte con
1.000 $pzk; dentro, le ultime mosse, sincronizza, esci), **cambio** (il fader orizzontale come
quelli di regia: $pzk → EUR€ o EUR€ → $pzk, quanto dai e quanto ricevi al cambio dell'ultima
sincronizzazione), **invia** (a un indirizzo, dopo 48 ore dalla nascita del conto), **altro**
(l'indirizzo, il PIN, il regalo di instagram). La voce è una striscia di nastro dymo sulla pelle.
`#wallet` lo apre; i giochi lo aprono con `pzk.apriWallet('converti')` (evento `pzkko-wallet`). Gli
strumenti che fotografano la pagina non vedono il tasto (`navigator.webdriver`), `?wallet` sì.

**Gli EUR€** sono l'«euroshit», l'euro finto del wallet (il nome viene dall'album *Euroshit* di
Yung Pips, il rapper torinese: un euro che vale quello che vale). Per finta non varia mai: si muove
solo il $pzk. Non si prelevano, non si depositano, non si giocano: servono a parcheggiare i $pzk
quando si pensa che scendano e a riprenderli quando conviene, sempre al cambio del momento. Quando
un gioco trova un conto a secco con EUR€ dentro, apre il cambio.

**Il cambio** (`api/_borsa.mjs`, `pzkko/borsa.json` su Blob) è una serie vera, un punto ogni dieci
minuti (dieci minuti per l'ultima settimana, un'ora fino a tre mesi, poi un giorno), nata a
1 $pzk = 1 € la notte del 22.10.2026. Ogni passo è un caso deterministico (dall'ora del punto: il
passato non si riscrive) più una deriva: l'**umore del giorno** (a caso fra −5 % e +5 % al giorno;
con probabilità 4 % un giorno è un'eccezione, come le crypto: ±10–30 % e il doppio del nervosismo)
e i **fattori del mondo**, misurati quando si aggiunge un punto: un **commit** di Alberto nelle
ultime 24 ore (GitHub, `albertoxpecchini/AP`) +3 % al giorno, nessuno −2 %; il **meteo** di Mantova
(Open-Meteo) sole +2 %, pioggia o temporale −2 %, neve −1 %; la **temperatura** sopra i 26° −1,5 %,
sotto gli 8° +1,5 %; il **giorno** +1,2 %, la **notte** −1,2 %. Le conversioni usano il cambio di
quando il wallet si è sincronizzato (il browser manda `t`, il server ricalcola `tassoA(t)`), purché
non sia passata più di mezz'ora: dopo, il wallet si sincronizza da sé (il cambio è quello nuovo).
`/api/borsa?da=24h|7g|30g|tutto` dà il cambio, le variazioni, i fattori, la serie e la
capitalizzazione (un minuto di cache sulla rete di Vercel); `node tools/pzkko/wallet.mjs borsa` la
legge da riga di comando.

**I conti** (`api/wallet.mjs`, `pzkko/wallet.json` su Blob): nome (2–20 lettere, unico senza
accenti né maiuscole), PIN (scrypt con sale), indirizzo «pzk» più sei cifre (a caso ma uniche; si
cambia **una volta sola** con sei cifre proprie: agli studenti unimore si consiglia il numero della
loro e-mail), i $pzk, gli EUR€, le ultime 40 mosse. **pzk398893 è di Alberto**: il nome «pzkko» (e
alberto, admin, banca…) si crea solo con la chiave di amministrazione (`PZKKO_ADMIN_KEY`, o la
stessa `FIRME_ADMIN_KEY`: il repository è pubblico, un PIN nel codice non sarebbe un segreto; la
carta chiede la chiave quando il nome è quello, oppure `node tools/pzkko/wallet.mjs crea pzkko
<pin>`). L'accesso dà un token firmato (HMAC con `WALLET_SECRET`, o derivato dal token del Blob) che
vale 180 giorni. Il saldo che manda il browser si accetta se ha senso (non più di 20.000 + 1.200
$pzk al secondo dall'ultimo salvataggio: nessun gioco paga più di 35 a 1 su una fiche da 500); se
no si risponde col saldo salvato e il browser si allinea. **Gli invii** fra conti (in $pzk, almeno
1) si aprono 48 ore dopo la creazione del conto, così creare conti nuovi per regalarsi i loro 1.000
non è una strada; al massimo 3 conti al giorno per IP, 8 tentativi di accesso in dieci minuti per
nome. **Le banconote per terra** (`trova`) una volta al giorno ciascuna (il giorno di Mantova), il
**sussidio** una volta al giorno a chi è a secco. **La lumachina** (23.10 sera, `chat/lumaca.mjs`, vedi il
cercapersone) la vive il server, alla prima richiesta del giorno, dopo aver accolto il saldo del browser: sposta la sua
percentuale dei $pzk senza passare dal controllo dei salti, ricorda le ultime 14 giornate in `c.lumaca` e ne fa una mossa
`{ tipo: 'lumaca', n, verso, pct, g, ev }`. Il browser manda `lg`, il giorno della lumachina che il suo saldo contiene già:
se una risposta s'è persa, le giornate che non ha visto si aggiungono al saldo che manda (né perse né raddoppiate); se
un'azione dice di no nello stesso momento in cui la lumachina ha vissuto, la giornata si salva lo stesso. Moderazione: `node tools/pzkko/wallet.mjs` elenca
i conti, `via <nome>` ne cancella uno (con la chiave in `.env.local`; `--locale` parla col server
di prova); oppure il JSON dalla pagina dello store.

**Le banconote perse per terra** (`scena/banconote.js`, `art/banconote/`): quattro banconote della
banca $pzk, da 500, 100, 25 e 10 (la chiocciola in smoking incisa come su una banconota vera,
«non ha corso legale · soldi finti»), cadute sul marciapiede davanti al negozio, stropicciate come
i volantini bagnati. Si raccolgono toccandole (`tocchi.js`, `banconota`): la banconota si alza verso
la telecamera e svanisce, i suoi $pzk entrano nel saldo (il led del tasto li conta, «+500 $pzk» vola
via dal tasto) e domani sono di nuovo lì. 635 $pzk al giorno a chi passa a raccoglierli.

Ogni strumento o gioco nuovo è una pagina in questa cartella (es.
`tools/nome/index.html`) e il suo volantino «in arrivo» diventa un link.

## Il cercapersone e la chat col bot (chat/, telefono/, api/wallet.mjs azione «zaino», api/giocatori.mjs)

Sotto il wallet c'è un **cercapersone** nero (`.chat-tasto`, `art/chat-pager-grande/pager-piccolo.webp`): sul suo schermo
lcd vive il tomodachi (`chat/tomodachi.js`, la chiocciolina a pixel); il led rosso lampeggia piano quando c'è qualcosa da
riscuotere e **sfarfalla come la spia del disco di un PC** quando il sistema lavora (`chat/led.js`: ogni richiesta al
server, il bot che pensa e scrive, le app che si caricano). Al clic **il cercapersone si ingrandisce** e diventa lo stesso
cercapersone in alta qualità (`art/chat-pager-grande/pager-grande.webp`, gpt-image-2, foglio `chat-pager-grande`): il tasto
è la stessa foto rimpicciolita con l'lcd nelle stesse quote, così l'ingrandimento è puro e non si vede il cambio. Poi
(23.10 sera) **la porta**: sullo schermo resta il tomodachi, a tutto schermo, e compare il tasto **ACCEDI**; premuto, la
chiocciolina si sposta e a destra «pzk os» scrive quattro **baggianate** a caso (`BAGGIANATE` in telefono.js: «sveglio i
criceti nella ruota del server», «soffio nella cartuccia»…) mentre la barra si riempie, e si entra. Niente tasti con la
«×»: si chiude col **tasto rosso CHIUDI**, toccando fuori o con Esc dalla home: lo schermo **si spegne come un tubo
catodico** (si schiaccia in una riga bianca, poi in un punto, sul vetro nero), ricompare il tomodachi che **saluta**
(«CIAO» e il cuore, `tomodachi.saluta`) e dopo un paio di secondi il cercapersone si rimpicciolisce da solo nel tasto; un
secondo «chiudi» mentre saluta chiude subito. Il **tasto verde INDIETRO** torna indietro di una mossa (la pagina interna
dell'app, poi l'app di prima, poi la home) e si può premere a raffica; nella home non fa niente. La freccia in alto
nelle app fa lo stesso. Tutto il cercapersone, come il wallet, è scritto solo in Fake Receipt. Lo schermo è un **tubo
catodico che sfarfalla** (`games/crt.js`, come gli schermi del wallet) già sulla porta, e lo è anche lo schermino del
cercapersone piccolo: i tre tubi (tasto, doppione che vola, schermo grande) sono «insieme», agganciati all'orologio della
pagina, così allo zoom la banda e lo sfarfallio non saltano. Se è in carica (dalle 19 alle 7), all'apertura **il cavo
usb-c s'inserisce**: sale da sotto la finestra inclinato, trova la porta raddrizzandosi, spinge e scatta dentro
(`inserisciCavo` in telefono.js; la scatola `.t-cavo-scatola` taglia la punta quando entra). È l'unica animazione che
Alberto ha voluto oltre allo zoom: niente altro deve muoversi da solo.

**Il cercapersone grande** (`telefono/telefono.js` + `telefono.css`; il nome è rimasto dalla prima versione, che era un
telefono) è orizzontale come quello piccolo. Le quote sono misurate sul disegno (1341 × 774): lo schermo va da 8,35 % a
74,65 % in larghezza e da 24,68 % a 80,88 % in altezza; i due tasti sono veri (sopra, rosso: chiudi; sotto, verde: indietro), il led
è a 84,6 % / 25,6 %. Nello schermo, un palco di 760 punti ridimensionato allo schermo vero: barra di stato lcd (pzkkonet,
ora, batteria come quella del wallet), la home (ora, saldo, sfide, l'ultima notizia dei giocatori) e le **app**, una per
modulo in `telefono/app/`, caricate al primo uso e poi tenute montate; le icone sono adesivi disegnati (foglio `chat-app`).
Sul cellulare lo schermo prende tutta la finestra e i tasti diventano una barra in basso.

- **Chat**: il bot (sotto). **Shop**: un e-commerce: offerte del giorno (tre pezzi a −20/−30/−40 %, uguali per tutti,
  col conto alla rovescia a mezzanotte), reparti, ricerca, ordine, preferiti, la scheda del prodotto, il carrello, la cassa
  con lo scontrino. **Sfide**: le tre sfide di oggi. **Quiz**: i quiz retributivi. **Quest**: le side quest. **Giocatori**:
  il database (classifiche col podio, notizie, cerca, il tuo profilo coi rivali, i numeri della banca). **Zaino**: quello
  che hai, coi bonus in corso. **Foto**: le foto vere dei quiz. **Banca**: apre il wallet.

**La salute della lumachina** (23.10 sera; `chat/lumaca.mjs` il motore, `chat/lumaca-dati.mjs` le 300 giornate,
`chat/lumaca-avvisi.js` le notifiche, la scheda in `telefono/app/giocatori.js`): in Giocatori > **io** c'è la lumachina
del cercapersone con la sua salute. È indipendente e non ci si può fare niente: ogni giorno di Mantova, da mezzanotte a
mezzanotte, si sveglia con una salute (0–100 %, un decimale; per il 70 % dipende da ieri, quindi una lumachina malata
resta malata qualche giorno) e decide lei la giornata: nera con probabilità 0,088 + 0,5 × (1 − salute), buona con
0,112 + 0,5 × salute, neutra il 30 % (il punto e due in più alle buone compensa le nere, che nei dati tolgono in media un
filo più di quanto diano le buone). Ogni giornata è un evento (100 negativi, 100 positivi, 100 neutri: medicine che
spendono i tuoi soldi, visioni che fanno guadagnare o perdere, affari, disastri…) credibile con la salute di quel giorno,
con la sua percentuale (coi decimali) dei $pzk liberi del conto. Più rare, a qualunque salute, 3 **catastrofi** e 3
**miracoli** (0,5 % dei giorni per lato), a coppie rovesciate (−50 % e +100 %): nel lungo periodo non svuotano né gonfiano
i conti (simulazione: dopo un anno il conto mediano resta dov'era). La giornata la decide un dado deterministico (la
nascita del conto e il giorno): è la stessa sul server e nel browser e non si rigioca. **Il server la applica** ai conti
(`api/wallet.mjs`, alla prima richiesta del giorno: entra, stato, salva, ogni azione, la nascita del conto), vive anche i
giorni in cui non c'eri (al più 30), ne fa una mossa del wallet («la lumachina −2,35 %») e, per catastrofi e miracoli, una
notizia della banca. Se ha combinato qualcosa che non hai visto, il riquadro «dalla banca» della home diventa
**urgente** e porta a «io», l'app Giocatori e la scheda «io» hanno il pallino (il led lampeggia), e in cima a «io» c'è
l'avviso con le giornate, il racconto e i $pzk, finché non premi «ho capito». Senza conto la lumachina c'è lo stesso (una
per browser) ma non tocca i 1.000 della sessione: dice cosa avrebbe fatto. Gli EUR€ non li tocca mai.

**La chat** (`chat/chat.js` + `chat.css`): si scrive un comando e basta (`pesca`; anche `pzk pesca` e `/pesca`). Il bot,
**pzk** (la chiocciola della banca con gli occhiali da sole, otto umori in `art/chat-bot/`), risponde con una scheda che
non spunta di colpo: «sta scrivendo…» per 500 ms, poi il testo si scrive da solo in 1000 ms (una coda li mostra uno alla
volta; i pulsanti e i timer dei minigiochi partono a scrittura finita). Le schede sono interattive: ogni `<code>comando</code>`
nel testo si tocca, sotto possono esserci tasti di seguito, i propri messaggi hanno il ↻ per rifarli; orari e giorni, il
tasto ↓ coi nuovi. Sopra la riga, i **tasti rapidi**: le ultime 8 scelte (salvate nello zaino), con le freccette per
scorrerle. Niente emoji di sistema: solo le nostre icone (`chat/icone.js`, `art/chat-*`, `tools/pzkko/fogli-chat.js`).

**I comandi** (`aiuto` li elenca e ogni nome si tocca; `aiuto pesca` ne spiega uno):

- *soldi*: `saldo`, `profilo`, `attese`, `giornaliero` / `settimanale` / `mensile`, `elemosina`, `manda pzk123456 50`
  (era `dai`/`invia`, che restano come alias).
- *attività*: `cerca`, `crimine`, `altobasso`, `posta`, `scava`, `pesca`, `caccia`. *lavoro*: `lavora …` (dodici mestieri).
- *giochi*: `quiz [argomento]` (una partita intera, sotto), `veloce`, `slot`, `dadi`, `moneta`, `roulette`, `blackjack`,
  `mine`, `dado`.
- *negozio*: `negozio [reparto]` (offerte, cibo, attrezzi, fortuna, roba, pzk: ogni pezzo in una riga col tasto «compra»),
  `compra` (da solo apre la vetrina), `vendi`, `usa`, `info`, `zaino`, `apri`, `gratta`. Un nome di oggetto scritto da
  solo propone compra/usa/info.
- *app*: `telefono`, `shop`, `sfide [riscuoti]`, `missioni`, `quest <nome> [scelta]`.
- *giocatori* (il database): `classifica [metrica]`, `cerca <nome>`, `giocatore [nome|pzk123456]`, `notizie`, `rivale`,
  `banca`.

**Lo shop** (`chat/testi.js` + `chat/oggetti.js` + `chat/mercato.js`): 46 pezzi in cinque reparti; 32 sono le cose citate da
Alberto nelle sue chat (il cibo dei volantini e della spazzatura: pzk-kola, tè alla pesca, frutti di bosco, zucca,
tortelli, grissini alla pizza, ramen Pechino, sbrisolona, mostarda, pomodoro; la roba: Eastpak, Ciao PX, Landini L25,
Epson ET-2825, iPhone Duo, stufa a legna, bonsai, penne BIC, Tucson, il manuale del Landini; le cose di pzk: luckypzkko,
gomma, tombino, lucchettone, citofono 28, pzkkonet, portachiavi, petizione, neon, portafoglio, cercapersone, peluche),
disegnate nei fogli `chat-cibo`, `chat-roba`, `chat-pzk`. Ogni pezzo può avere **bonus** veri (`zaino.bonus(k)`): `paga`,
`xp`, `attese`, `vendita`, `morte`, `sfide`; i consumabili li danno a tempo, le cose da tenere finché sono nello zaino.
Gli acquisti della chat e dello shop passano tutti da `mercato.compra`.

**Le sfide giornaliere** (`chat/sfide.js`): ogni giorno tre sfide (facile, media, difficile) fatte con quello che sai fare
(niente pesca senza canna), misurate sulle statistiche dello zaino; tutte e tre danno il bonus del giorno con una cassa, e
la serie di giorni di fila lo fa crescere. **I quiz retributivi** (`chat/quiz.js` + `quiz-dati.js`): partite da 8 domande
su un argomento (Mantova, cucina, cultura, scienza, tech, giochi, pzk, «foto» — che cos'è nella foto —, «giocatori» —
domande fatte col database —), 15 secondi l'una; ogni risposta giusta paga 20/40/80 $pzk, di più se veloce o in serie;
pagano le prime 40 giuste del giorno. I fatti di Mantova sono verificati sul web. **Le side quest** (`chat/missioni.js` +
`missioni-dati.js`): cinque storie a bivi (il civico 28, il pomodoro che scoppia, la petizione, il Landini che non parte,
il drago del Mincio), con costi, rischi, oggetti che servono, un premio alla fine.

**Le foto vere** (`chat/immagini.js`): 14 foto da Wikimedia Commons (monumenti di Mantova, il cibo, il Landini, il Ciao),
caricate da lì con autore e licenza scritti sotto; per una foto da **Imgur** basta una voce con `imgur: '<id>'` al posto
di `url` (Imgur non si può cercare né caricare senza una chiave API, quindi gli id li deve dare Alberto).

**Il database dei giocatori** (`api/_giocatori.mjs`, `api/giocatori.mjs`, `chat/db.js`): un file su Blob,
`pzkko/giocatori.json`, con la riga pubblica di ogni giocatore (livello, statistiche, mestiere, serie, leggendari presi,
ultima volta visto), aggiornata a ogni salvataggio dello zaino e unita ai conti del wallet a ogni richiesta (i $pzk sono
sempre quelli veri). GET `?top=<metrica>`, `?cerca=`, `?ind=pzk123456` (profilo con la posizione in ogni classifica),
`?stats=1`, `?notizie=1` (salite di livello, leggendari, vincite grosse, mestieri, serie: dati, le parole le mette il
browser); POST `{ token, vicini }` per il proprio profilo e i rivali. Mai il PIN né gli oggetti uno per uno.

**La morte** si perde il 20 % dei $pzk liberi (al più 5.000; il bonsai e il lucchettone ne fanno perdere meno), il
cornetto si consuma al posto tuo. E il cercapersone si **scassa** (23.10, `zaino.pagerRotto()`): il vetro crepato
(`art/chat-pager-crepe/`: `crepe.webp` nello schermo grande, `crepe-piccola.webp` nel tasto, ridotta col massimo da
`tools/pzkko/crepe-piccole.mjs`; nel doppione dello zoom tutte e due, secondo la misura), le app spente tranne la chat, e
la chat accetta solo `lavora` e `compra cercapersone`, che costa quanto il cercapersone del negozio e lo rimette nuovo
(`mercato.ricompraPager`). Nella pagina di prova i tasti «muori» e «ripara» (a cercapersone chiuso). **Lo zaino** (`chat/zaino.js`) segue i soldi: nella sessione in `sessionStorage`, col
conto sul server (`pzkko/chat.json`, al più 12 KB) e in `localStorage`; ci stanno anche i tasti rapidi, le sfide, le
missioni, il quiz e i leggendari presi.

Il modulo si carica da solo appena la pagina è tranquilla e al clic; `#chat` apre direttamente la chat, l'evento
`pzkko-chat` (con `detail.comando`) la apre scrivendo un comando. Gli strumenti che fotografano la pagina non vedono il tasto
(`navigator.webdriver`), `?chat` lo fa vedere. **In locale**: `npm run dev:pzkko` e poi `http://localhost:5182/prova/chat/`
(`tools/pzkko/prove/chat.html`, non va online); `PZKKO_PORT=5190` per un secondo server. Il server ricarica la pagina solo
se un file cambia davvero (su Windows `fs.watch` segnala anche le letture).

## Gli strumenti (tools/)

Uno strumento è una pagina statica in `tools/<nome>/`, fuori dalla scena 3D: in
testa l'insegna (torna al muro), sotto un pezzo di saracinesca con i fogli
attaccati in colonne. Stesse carte, nastri e caratteri del muro, CSS in linea,
niente script. I fogli si allungano col testo (la carta si stira un po'):
`.testo` è alto almeno quanto la carta (`calc(100cqw / (var(--ar)))`), di più
se serve. Il volantino nella zona `tools` del muro porta lì.

- **pzk$meeting** (`tools/lezioni/`, 21.10.2026; fino al 22.10 si chiamava lezioni): lo strumento di Alberto per
  registrare le lezioni su Teams, trascriverle con Whisper in sincrono con la
  lavagna, leggerne le formule e farne gli appunti in PDF. È un programma per
  Windows, non una cosa da browser: la pagina lo spiega e dà
  `tools/lezioni/lezioni.zip`. Il codice vive in `../tools/lezioni/` (col suo
  README); lo zip lo fa `python ../tools/lezioni/pacchetto.py`, che scrive anche
  versione e peso nella pagina (fra `<!--versione-->` e `<!--peso-->`): va
  rilanciato dopo ogni modifica al tool, prima del commit. Le immagini
  (`art/lezioni/`: `appunti.webp` la pagina di appunti, `volantino.webp` il suo
  pezzo sul foglio del muro, `barra.webp` e `barra-chiusa.webp` la barra) e
  `tools/lezioni/og.jpg` vengono da una lezione **inventata**: la barra
  disegnata dal suo codice senza finestra su una cartella finta, gli appunti di
  esempio impaginati da `impagina.py`. Niente della lezione vera (voci, nomi,
  lavagna) va sulla pagina.

## La storia (storia/)

Il fun fact del muro (20.10.2026): la saracinesca di riferimento è vera. Domenica
22 settembre 2024 alle 12:28, in via Rizzoli a Bologna, un ingresso della Coin a
un centinaio di metri dalle Due Torri: Alberto era a Bologna per la prima volta,
con Veronica, e aveva l'iPhone 16 Pro da due giorni (nei negozi dal 20
settembre). Tre scatti in cinque secondi, tutti Live Photo. I numeri sulla pagina
vengono dai metadati delle foto (EXIF e QuickTime: ora, obiettivo, tempo, ISO,
posizione, quota, direzione e velocità del GPS); i fatti di contorno da fonti
pubbliche: la mostra DiscoBo del 21–22.09.2024 (dal volantino nella foto), la
chiusura della Coin di via Rizzoli il 31.07.2025 (il Resto del Carlino,
23.04.2025 e 4.06.2026), la ricetta del ragù depositata dall'Accademia Italiana
della Cucina alla Camera di Commercio di Bologna il 17.10.1982 e rivista nel 2023.

- **La pagina** (dal 21.10) funziona come la home, uno a uno: la stessa
  saracinesca coi fogli a pile (cinque colonne sul computer, due sul telefono),
  la sera di Mantova, le auto, le mosche, la regia, e dove c'è WebGL2 la stessa
  scena 3D con l'arrivo dalla strada, le foto del caricamento, il meteo, le
  bestie, la vetrina (dal 23.10, come la home, parte in 2D a mezzogiorno col sole, e
  il resto si sceglie nella regia: le scelte sono le stesse, nello stesso browser). Prima era una griglia che scorreva, senza scena 3D né sera
  (la versione di prima non era in Git). Le pile stanno in
  `../tools/pzkko/storia/disposizione.js` (le chiavi sono gli id `#storia-…`) e
  le scrive `disponi.mjs --pagina=storia`, come per la home; il passo è 1 e i
  fogli si sovrappongono solo sul margine bianco della carta, così si leggono
  fino in fondo. Sul computer la parete è alta almeno 2000 unità (3,2 m, la
  saracinesca 3D più bassa). Sopra, l'insegna è un link che riporta al muro;
  l'h1 è il titolo del primo volantino; il primo foglio in alto a sinistra
  («← torna al muro») e quello della fine portano alla home.
- **Com'è fatta**: `../tools/pzkko/genera-storia.mjs` rifà `storia/index.html`
  da `index.html` (come `genera-404.mjs`), e tiene della storia solo i suoi
  pezzi, che stanno nella pagina stessa fra i segni `storia:` — la testa
  (titolo, descrizione, og, dati strutturati), lo stile dei suoi fogli, la
  parete (`<div class="parete storia">`), lo script delle Live Photo — più
  l'altezza della parete e `FOTO`. I testi della storia si cambiano lì; dopo ogni
  modifica alla home si rilancia il generatore (lo fa `serranda.mjs rifai`).
- **I fogli** sono tutti `.vol`, fotografati da `cattura.mjs` per la scena come
  i volantini (in `art/scena/vol/storia-*.webp`): i volantini su carta, le tre
  stampe con la Live Photo (`.stampa`, carta lucida anche in 3D), i tre
  confronti fra la foto e il muro (l'insegna, l'adesivo, la roba degli altri),
  lo scontrino, «lo sapevi che…» e «e il ragù?», il banner di bologna 2.0 e i
  sei meme. Le scritte sprayate («com'è andata», «cosa è finito su pzkko») sono
  testo vero: `.it.foto`, fotografate anche loro, e nella scena sono vernice
  chiara sulla lamiera. Intorno graffiti, resti, nastri, le gomme da masticare
  (le formiche della scena ci vanno in fila), il rivolo, il manifesto di unimore
  contro unibo. **Attenzione**: le misure in `cqw` stanno sui figli del foglio
  (`.carta` dello scontrino, `.banner`, i margini della foto): sul foglio
  stesso, che è il contenitore, si riferirebbero al muro (lo scontrino veniva
  alto 4937 unità).
- **Le Live Photo**: la foto ferma col tasto «LIVE» come sull'iPhone; il video
  parte al passaggio del mouse, tenendo premuto col dito o col tasto, e una volta
  da solo quando la foto entra per metà nello schermo (non col movimento
  ridotto; col 3D dopo l'arrivo della telecamera); finito, torna la foto. Nella
  scena 3D la foto è quella fotografata e `fogli.js` stende il video della pagina
  sopra la foto (dove `cattura.mjs` l'ha misurata, `live` in `vol.json`): una
  trama ricaricata a ogni fotogramma solo mentre il video va, che entra e sfuma
  con `.va` come nella pagina. Il DOM della foto resta lì trasparente
  (`html.scena3d .live .live-foto`) a sentire il passaggio, il dito e il tasto.
  Nella scena, mentre va, il video copre il tasto «LIVE» stampato.
- **Le foto del caricamento** sono sue (`art/scena/carico/storia-*.webp`, la
  strada da lontano col muro della storia): `carico.mjs --pagina=storia`.
- **`art/storia/`**: `foto-1…3.webp` (1080 px) e `-m` (540 px), `live-1…3.mp4`
  (540 × 720, H.264, senza audio), i ritagli `insegna.webp`, `adesivo.webp`,
  `discobo.webp` e `og.jpg`, tutti senza metadati (niente GPS nei file). Li fa
  `node tools/pzkko/storia/storia.mjs foto` dai file dell'iPhone (IMG_0334–0336,
  JPG + MOV, di default in `D:\disco immagini\Rullino\Anno 2024\09`), che copia
  anche la prima foto e la sua Live Photo in `public/media/web/pzk-bologna*` per
  il fun fact del case study su albertopecchini.it. Serve ffmpeg.
- **`art/storia/meme/`**: sei foto finte di Pekko in completi sgargianti (gli
  spaghetti rifiutati, la nonna col mattarello, il ragù, la Garisenda, la
  mortadella, il fotografo di saracinesche), gpt-image-2 il 20.10.2026 con la
  fototessera come riferimento, come gli ingredienti di Better Call Pekko
  (`tools/assistenza/spot.js`); il prompt nel `.json` accanto. Le scritte dei meme
  sono HTML (Impact). `storia.mjs genera|recupera|usa <meme…|tutti>`.
  `storia.mjs muro` apre la storia senza 3D (`?muro=1`) e fotografa la stampa
  da sola su trasparente, come `cattura.mjs`: le tre stampe della home sono
  ancora quelle del 20.10, fatte dalla pagina di prima (scritte un po' più
  piccole).
- **Sul muro** la porta il volantino «da dove viene questo muro?», subito sotto
  «chi sono» (colonna 0, sul computer e sul telefono), con la prima foto stampata
  sopra. Fino al 22.10 c'erano anche tre meme stampati (`art/storia/muro/`: la
  mortadella, il fotografo di saracinesche, la nonna, le stampe della pagina della
  storia fotografate con `storia.mjs muro`): tolti su richiesta di Alberto per fare
  posto alla roba nuova (le immagini restano in `art/storia/muro/`).

## Le immagini

`node tools/pzkko/immagini.mjs genera <foglio|tutti>` disegna i fogli su fondo
magenta in `tools/pzkko/lavoro/` (fuori dal repository), `usa <foglio|tutti>`
toglie il magenta con la chiave cromatica, separa i pezzi per cella e li scrive
qui. Le illustrazioni nascono su un cartoncino crema che `usa` rende
trasparente; lo scotch resta traslucido; la lamiera si taglia sul passo delle
doghe. Se l'attesa si interrompe («fetch failed», è successo il 21.10 con tutti
e tre i fogli) la predizione è partita lo stesso e si paga: si guarda l'id fra le
ultime su Replicate e si scarica con `recupera <foglio> <id>`, senza rigenerare.
`usa` legge i PNG con ffmpeg, se c'è, se no con sharp (`leggiA` di
`tools/mascotte/immagine.mjs`, dal 21.10: su questo PC ffmpeg non c'è e `usa` si
fermava). Un pezzo va alla cella del suo baricentro: se il modello non fa le celle
uguali, `tagli` nel foglio dice dove finiscono colonne e righe (nel foglio `porta`
l'orario sbordava nella colonna del civico); `briciole` è la misura sotto cui un pezzo
si scarta (i due punti e i trattini dell'orario sparivano).

### Le foto vere

`node tools/pzkko/amici.mjs scontorna <nome…|tutti>` ruota la foto (EXIF), la
ritaglia attorno alle persone (`ritaglio` in `FOTO`: meno fondo, meno sbagli,
come la signora dietro nel negozio o l'auto dietro la ragazza), la porta a 2048 px
in `tools/pzkko/lavoro/amici/` e la manda a bria/remove-background; la maschera
resta lì e non si ripaga. `adesivi <nome…|tutti>` fa l'adesivo: la foto con l'alfa
del modello e sotto il vinile bianco, cioè la sagoma sfocata e tagliata bassa
(si allarga di ~1,75 σ, arrotonda gli angoli e chiude i buchi piccoli, come una
fustella); `credito` aggiunge un'etichetta col nome del fotografo. In sharp
sfocatura e soglia vanno in due passi: in una catena sola la soglia viene fatta
prima della sfocatura e il bordo esce sfumato. `ciao` prende il JPEG a piena
risoluzione dentro il CR2 della EOS 4000D (5184 × 3456: la macchina era di
traverso e l'anteprima non lo sa, si gira di 270°). Le foto restano sul disco di
Alberto (`D:\disco immagini\…`), qui solo i ritagli.

Sul muro gli adesivi sono `.man` (si alzano al passaggio come i manifesti): cinque
stanno in fondo alle pile, `amici/jager` è attaccato sopra il manifesto punk. Mai
sopra i volantini veri, che sono link.

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
node tools/pzkko/serranda.mjs rifai                 # disponi, 404, storia, foto dei volantini per il 3D, foto del caricamento, foto di prova della scena
node tools/pzkko/serranda.mjs stato --pagina=storia # lo stesso per il muro della storia (anche allunga e comprimi)
```

`rifai` rifà anche la storia: `genera-storia.mjs` (il CSS e lo script della home
cambiano anche lì), `disponi.mjs tutto --pagina=storia`, le sue foto dei fogli e del
caricamento, e una foto di prova (`scena-serranda-storia.png`). I fogli della storia
non si aggiungono con `volantino` e `pezzo`: si scrivono a mano in `storia/index.html`
(dentro `<div class="parete storia">`, con un id `storia-…`) e in
`tools/pzkko/storia/disposizione.js`.

Il pezzo nuovo va nella colonna più corta (o in `--colonna`, dopo `--dopo`), sul
computer e sul telefono. Le manopole stanno in una riga di `DESK` e `MOB`
(`top`, `bottom`, `minimo`, `passo`, `scala`, lette da `disponi.mjs`). La scena 3D
non vuole niente: la saracinesca è alta quanto la parete del DOM (e la scatola
dell'ombra del sole cresce con lei). `--prova` dice cosa farebbe senza scrivere.
Provato il 20.10 con +450 unità in cima, un volantino nuovo e le pile al 92%: poi
rimesso tutto com'era. Il 21.10 compresse davvero, su richiesta di Alberto: `comprimi 10
--entrambi` (passo 0,9) e la parete tenuta alta com'era col minimo (`allunga
--minimo=2989`, `--telefono --minimo=5228`), così lo spazio guadagnato resta libero in
fondo alle colonne (325–385 unità sul computer, 580–590 sul telefono) invece di
accorciare la saracinesca; a coprirsi di più sono i manifesti finti, i titoli dei
volantini veri si leggono tutti. `disponi.mjs`, `cattura.mjs`, `foto.mjs` e `trame.mjs`
trovano il browser con `../tools/pzkko/browser.mjs` (Chromium di Playwright, se
no Edge); con Edge le altezze dei volantini vengono qualche unità diverse.
Il 22.10 la roba nuova (i manifesti 6, 7 e 8, la petizione) ha preso il posto dei tre meme della
storia e lo spazio libero in fondo alle colonne, e la parete è cresciuta da sé (la colonna più
lunga più `bottom`): 3191 unità sul computer (5,1 m di saracinesca 3D), 5486 sul telefono.

## Vercel

Progetto `pzkko` dal repository `albertoxpecchini/AP`:

- Root Directory: dovrebbe essere `albertopecchini.it/pzkko` con preset Other
  (nessuna build, output = la cartella). Finché resta `albertopecchini.it` con
  preset Vite, ci pensa `tools/pzkko/build.mjs` (il `buildCommand` di
  `albertopecchini.it/vercel.json`): se la build gira per pzkko.it copia questa
  cartella in `dist/` così com'è, altrimenti lancia la build normale del sito.
- `/api/meteo`: la funzione è `api/meteo.mjs` qui dentro, così va online anche con
  la Root Directory in `albertopecchini.it/pzkko`; finché la radice è
  `albertopecchini.it` la pubblica `albertopecchini.it/api/meteo.js`, che la
  riesporta (e c'è anche su albertopecchini.it: male non fa). In locale la serve
  `npm run dev:pzkko`.
- `/api/firme` (22.10): la petizione. `api/firme.mjs` qui dentro, pubblicata come il meteo da
  `albertopecchini.it/api/firme.js` finché la radice è lì. Le firme stanno in un JSON privato su
  **Vercel Blob** (`pzkko/firme.json`), letto dall'origine e riscritto con `ifMatch` sull'ETag
  (due firme insieme non si cancellano: chi perde riprova), come il database di Better Call
  Pekko (`api/bcp.js`). **Va collegato uno store Blob al progetto pzkko** (Vercel › pzkko ›
  Storage › Connect, lo store privato di bcp o uno nuovo): Vercel aggiunge
  `BLOB_READ_WRITE_TOKEN` e al deploy dopo la petizione si accende; senza, risponde «offline» e
  il foglio si vede ma non si firma. Protezioni: campo trappola, 2,5 s minimi da quando il
  foglio si è avvicinato, al massimo 2 firme in 10 minuti e 6 al giorno per IP (in memoria,
  l'IP non si salva), lo stesso nome una volta al giorno, 120 firme l'ora in tutto, nomi di
  2–32 lettere senza link, numeri di telefono, emoji né parolacce (anche camuffate: «c4zz0»,
  «p u t t a n a»; non i cognomi veri come Negri o Negro), 5000 firme al massimo; a chi guarda
  vanno le ultime 300 (venti secondi di cache sulla rete di Vercel, cinque minuti di riuso mentre si
  rinfresca: le letture del Blob sul piano gratuito sono contate; chi firma vede subito la sua firma,
  gli altri entro una ventina di secondi). **Moderazione**: con
  `FIRME_ADMIN_KEY` nel progetto (e la stessa in `.env.local`), `node tools/pzkko/firme.mjs`
  elenca le firme e `node tools/pzkko/firme.mjs via <id>` ne cancella una; oppure si modifica
  `pzkko/firme.json` dalla pagina dello store. Se il progetto passa alla Root Directory
  `albertopecchini.it/pzkko`, lì serve un `package.json` con `@vercel/blob`.
- `/api/wallet` e `/api/borsa` (22.10 notte): il wallet dei $pzk e la borsa. `api/wallet.mjs` e `api/borsa.mjs` qui
  dentro, riesportate da `albertopecchini.it/api/wallet.js` e `borsa.js`. I conti in `pzkko/wallet.json` e la serie
  del cambio in `pzkko/borsa.json` sullo stesso **Vercel Blob** della petizione: senza store collegato rispondono
  «offline» e la home va avanti coi 1.000 $pzk della sessione (il wallet lo dice). Variabili nel progetto:
  `PZKKO_ADMIN_KEY` (o `FIRME_ADMIN_KEY`) per creare il conto «pzkko» di Alberto e moderare; a piacere
  `WALLET_SECRET` (la firma dei token: senza, deriva dal token del Blob, e cambiando store i token scadono),
  `GITHUB_TOKEN` (le chiamate a GitHub senza token sono 60 l'ora per IP: dagli IP di Vercel possono finire, e allora il
  fattore commit non conta). In locale (`npm run dev:pzkko`) tutto sta in memoria.
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
giochi senza la barra finale. Le firme della petizione, in locale, stanno in memoria finché
il server resta acceso (`node tools/pzkko/firme.mjs --locale` le elenca).

## Crediti

La home e la 404 non hanno piè di pagina: credito e badge FrogDR sono stati tolti su
richiesta di Alberto il 9.10.2026 (è il suo sito; i giochi portano ancora il credito).
Le immagini del muro sono generate con openai/gpt-image-2 su Replicate, come le
figure delle carte del blackjack (`art/blackjack/`, il prompt nel `.json`
accanto a ogni figura); i caratteri sono di Google Fonts con le licenze dette
sopra, e quelli delle firme della petizione (22.10, `fonts/`, solo il sottoinsieme latino,
16–51 KB, scaricati solo quando servono) Caveat, Reenie Beanie e Nothing You Could Do (SIL
OFL) e Homemade Apple (Apache 2.0). Le foto degli adesivi sono di Alberto e dei suoi amici; quella sul landini
è di simo4gantos8 (il credito è stampato sull'adesivo).
