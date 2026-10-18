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
- `scena/` — la scena 3D della home (vedi sotto): `scena.js` (la telecamera,
  l'inquadratura allineata al DOM, il giro), `mondo.js` (il posto: facciata,
  saracinesca, insegna, porta a vetri, marciapiede, strada, palazzi, lampada,
  auto), `fogli.js` (i volantini e i graffiti presi dalla pagina), `luci.js`
  (il sole di Mantova, il cielo, le luci della notte), `materiali.js` (le trame
  disegnate al volo e il profilo delle doghe), `scena.css`, `lib/` (three.js
  r186 con gli addon, MIT, `tools/pzkko/scena/motore.mjs`).
- `art/scena/` — quello che serve alla scena: `lamiera.webp` e `lamiera-r.webp`
  (il colore e la rugosità della saracinesca, tirati fuori dalla foto `muro.webp`
  togliendole la luce, `tools/pzkko/scena/mappe.mjs`), `pannello.svg` e
  `colature.svg` (il pannello dell'insegna e le colature, da `insegna.svg`),
  `vol/` e `vol.json` (le foto dei volantini, `tools/pzkko/scena/cattura.mjs`).
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

Dal 18.10.2026, sui computer con WebGL2 (finestra da 900 px in su), la home
non è più una pagina ma un posto: la stessa saracinesca coi suoi volantini,
disegnata dalla scheda grafica con three.js come la scena di un videogioco,
con luci, ombre e riflessi veri. `?muro=1` tiene il muro di sempre; sotto i
900 px e senza WebGL2 resta quello, senza che la pagina se ne accorga.

- **Com'è fatto il trucco**: la pagina di sempre resta lì, sotto, invisibile
  (`html.scena3d` in `scena.css`): i link dei volantini, i tagliandi, i giochi,
  le mosche, le formiche e la goccia sono ancora i suoi; la scena si disegna in
  una tela fissa dietro e **l'inquadratura è calcolata perché la saracinesca 3D
  stia esattamente dove sta il muro nel DOM** (proiezione decentrata: la
  telecamera sta un po' a destra e più in basso del centro, come una persona sul
  marciapiede con un obiettivo decentrabile, ma il piano della parete finisce
  pixel per pixel sui pixel della pagina). La telecamera è fissa davanti alla
  vetrina e sale e scende con lo scorrimento. `?allinea=1` mostra il DOM in
  trasparenza sopra la scena per controllare che combacino.
- **Il posto** (`mondo.js`, tutto in metri: 1 unità della parete = 1,6 mm, la
  saracinesca è larga 2,05 m): le doghe sono poligoni (bombate, col canale al
  giunto e qualche ammaccatura; la vernice è la foto della lamiera senza la
  sua luce, con la rugosità dove c'è sporco e ruggine), le guide, la barra con
  la serratura, la facciata d'intonaco col buco e le spalle, lo zoccolo di
  pietra, il pluviale, il citofono, la targa del civico, le finestre del piano
  di sopra. L'insegna è il cassonetto d'alluminio col pannello sporco
  (`pannello.svg`) e le lettere «pzkko» come tubi di metacrilato lungo la stessa
  traccia di `insegna.svg`, col filo del neon davanti. A destra la porta a vetri
  del negozio: il vetro è uno specchio vero della strada (Reflector), dentro il
  buio con bancone, scaffali, il cartello «chiuso» appeso e la spia dell'allarme
  che lampeggia. Davanti il marciapiede di lastre bagnate (le pozzanghere sono un
  secondo specchio), il cordolo, l'asfalto, e di là dalla strada cinque palazzi
  con le finestre che la sera si accendono, e due lampioni. In `scena.css` il
  muro è un po' più stretto e spostato a sinistra (`66vw`), così la porta e la
  lampada entrano nell'inquadratura anche a 1440 px.
- **I fogli** (`fogli.js`): ogni elemento `.it` della parete diventa un foglio
  di poligoni nel suo posto esatto (le stesse `--x --y --w --r`), suddiviso con
  lo stesso passo delle doghe e piegato sulla loro bombatura; i graffiti stanno
  attaccati al metallo, la carta un filo sopra, uno strato per foglio
  nell'ordine di sovrapposizione della pagina (z-index e ordine nel DOM). I
  volantini usano le foto fatte da `cattura.mjs` (testo in HTML sopra la carta,
  fotografati in Chromium a 3 px per unità, con un margine per l'adesivo che
  sporge); quelli coi tagliandi hanno la fascia tolta e **ogni tagliando è un
  foglietto suo**, che cade quando la pagina gli mette `.cade` e sparisce con
  `.via`. Il foglio sotto il puntatore (o col fuoco) si alza di 2 cm con una
  molla. La carta lucida (`c-lucido`) ha la vernice (clearcoat).
- **Le luci** (`luci.js`): il sole è dove sta davvero sopra Mantova a quest'ora
  (lo stesso calcolo NOAA della pagina, più altezza e azimut; la facciata guarda
  a sud-sud-ovest, 200°), con le ombre; il cielo (addon `Sky`) fa da sfondo, da
  luce d'ambiente e da riflesso (PMREM, rifatto quando il sole si sposta). Di
  notte la scena legge ogni fotogramma le variabili CSS della pagina
  (`--notte`, `--insegna` con lo sfarfallio, `--lampioni`, `--auto-x`,
  `--auto-l`, `--auto-c`, `--freno`, `--neon-auto`) e accende i poligoni: le
  lettere e il filo del neon (emissivi, col bagliore), tre lampade davanti al
  pannello, la lampada a muro sopra la porta (un faro con le ombre), i lampioni
  di là, le finestre dei palazzi; e **l'auto che passa è un'auto**: una berlina
  sulla strada dietro la telecamera, coi fari che spazzano la saracinesca e la
  porta, i fanali rossi, il neon sotto. Si riflette nel vetro e nelle
  pozzanghere. Prove: `?ora=18:30`, `?notte=1`, `?auto=1` come per la pagina.
- **Il costo**: MSAA 4×, bloom, due specchi (che si rifanno un fotogramma sì e
  uno no, alternandosi, senza multisample) e due mappe d'ombra (sole 2048,
  lampada 1024; quella di chi è spento non si rifà). Su una RTX 3060 Ti
  ~130–160 fotogrammi al secondo a 1440 × 900. Se nei primi due secondi la media
  supera i 30 ms a fotogramma si scende a risoluzione 1× e specchi più piccoli;
  `?qualita=bassa` parte già così (senza bloom né palazzi).
- **Blender**: `?glb=1` scarica la scena così com'è in glTF binario
  (`pzkko.glb`, GLTFExporter), da aprire con File › Import › glTF.
- **Le prove**: `node tools/pzkko/scena/foto.mjs --ora=22:00 --scroll=0.5`
  (dalla cartella `albertopecchini.it`) fotografa la scena in Chromium headless
  (che usa la scheda grafica vera) in `tools/pzkko/lavoro/scena-*.png` e dice i
  fotogrammi al secondo; `--larg`, `--alt`, `--q=notte=1`, `--vars=--auto-l:0.9;--auto-x:0.5`
  (ferma un'auto), `--hover=.vol.c-giallo`, `--prova=<js>`, `--pagina=/404.html`
  (da Git Bash con `MSYS_NO_PATHCONV=1`).
- **Dopo ogni modifica ai testi dei volantini** (e dopo `genera-404.mjs`):
  `node tools/pzkko/scena/cattura.mjs`, che rifà le foto in `art/scena/vol/`.
  La 404 ha la sua scena (il suo volantino è fotografato con gli altri).

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
