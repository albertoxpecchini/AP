# roulette di pzkko.it

La roulette europea di <https://www.pzkko.it/games/roulette/>: si gioca da soli
contro il banco, senza server, con i **$pzk** (gettoni senza valore) che stanno
nel browser (`localStorage`: saldo, ultimi numeri, maggiore età). Mille $pzk per
cominciare; finiti, il tavolo ne ridà mille. Tutto in italiano, minuscolo, nello
stile di pzkko.it e della sala del blackjack, da cui prende il croupier, le fiche
e la rastrelliera.

## Com'è fatta

| pezzo | file | cosa fa |
|---|---|---|
| fisica | `pzkko/games/roulette/fisica.js` | il rotore, la pallina sulla pista, l'orlo, lo scivolo con gli otto deflettori, la corona con i 37 separatori, la casella: funzioni pure in centimetri e secondi, caso con seme |
| scena | `pzkko/games/roulette/scena.js` | il mondo in scala, la prospettiva CSS rifatta in JS (`proj`/`inv`), i pezzi fotografati, il croupier con le braccia in 3D |
| ruota | `pzkko/games/roulette/ruota.js` | la conca e il rotore fotografati, la corona dei numeri in SVG, la torretta disegnata che gira, la pallina e la sua ombra |
| tappeto | `pzkko/games/roulette/tavolo.js` | il disegno delle caselle nelle due orientazioni, le zone (pieno, cavallo, terzina, carré, sestina, trio, 0-1-2-3, dozzine, colonne, chance), il tocco, quanto paga |
| gioco | `pzkko/games/roulette/gioco.js` | puntate, fiche sul tappeto, consolle, quadro di comando, memoria, la coreografia del croupier |
| prova | `tools/roulette/prova.mjs` | migliaia di giri senza browser: durate, rimbalzi, uniformità dei numeri |
| immagini | `tools/roulette/fogli.js`, `immagini.mjs`, `misura.mjs` | i prompt per gpt-image-2, lo scontorno, le misure vere dei fogli |

### La pallina (perché cade dove cade)

Il numero che esce è quello della casella in cui la pallina si ferma davvero:
non c'è un'estrazione a parte che poi guida l'animazione. La simulazione gira a
480 passi al secondo, in centimetri su una ruota da 80 cm:

1. **pista** (r = 33,2): lanciata in senso orario a 2–2,4 giri/s, rallenta per
   l'aria e l'attrito (`w' = −(0,5 + 0,003 w²)`) finché la pista non la tiene più
   (0,86–0,98 giri/s, diverso a ogni lancio); dura 8–10 s;
2. **orlo** (r = 31): scende il gradino e rotola contro l'orlo dello scivolo
   frenando forte, finché la forza centrifuga non basta più (`w < √(g·tan 15° / r)`);
3. **scivolo**: il cono (pendenza 15°) la porta dentro: `r'' = cos²β (r w² − g tan β) − 3,2 r'`,
   `w' = −0,95 w − 2 r' w / r`. Gli otto deflettori stanno dove li ha disegnati il
   modello (misurati con `misura.mjs`: 64 % del raggio, a 0°, 44°, 90°, 137°,
   182°, 227°, 270°, 314°): quelli «lunghi» le fermano quasi il giro e la fanno
   saltare, quelli «di traverso» le sbarrano la discesa;
4. **volo**: in aria niente attrito, `z'' = −g`; ricade e riprende da dove si trova;
5. **corona** (r ≤ 21,6): i 37 separatori girano col rotore; a ogni separatore
   incontrato, se la velocità relativa è sopra 20–30 cm/s la pallina salta
   (a volte torna indietro), altrimenti cade nella casella da cui veniva;
6. **casella**: un tremolio di 0,6 s, poi ferma col rotore.

Il rotore gira in senso antiorario a 0,33–0,43 giri/s (la spinta del croupier)
e rallenta in minuti. `node tools/roulette/prova.mjs 1480` fa 1480 giri: durata
11–16 s, 1–3 deflettori, 0–4 rimbalzi, chi² sui 37 numeri sotto la soglia del
95 %; `node tools/roulette/prova.mjs 1 --seme=7` racconta un giro passo passo.
Nella pagina `?seme=7` ripete lo stesso giro, `?veloce` accorcia i gesti del
croupier (per le prove).

### Il croupier (come si muove)

È il burattino del blackjack (busto, braccio, avambraccio, due mani su
fermacampioni), ma le braccia vivono in tre dimensioni: spalla, gomito e polso
sono punti (u, v, h) sopra al tavolo, la cinematica inversa a due segmenti
(30 + 27 cm, mano 19) trova il gomito dalla parte del «polo» (fuori e in
basso), e ogni pezzo viene disegnato fra le due articolazioni **proiettate** con
la stessa prospettiva CSS del piano (`scena.js`, `proj`): un braccio che scende
dalla spalla al tavolo si accorcia come uno vero visto da davanti. La larghezza
di ogni pezzo sta di traverso allo sguardo; la mano posata sul tavolo è piatta
nel piano. Le mani si muovono con il profilo di velocità dei gesti umani (jerk
minimo), con un arco in aria fra un punto e l'altro; il busto si sporge verso
la mano che lavora e cammina lungo il bordo. Per il lancio: la mano destra dà
la spinta alla torretta (il rotore accelera mentre la mano passa), prende la
pallina dalla casella (mirando a dove sarà la casella all'arrivo), la porta
sulla pista e la lascia; dopo il numero, la sinistra posa il dolly, passa dietro
alle fiche perse e le porta alla rastrelliera, prende le vincite dalla
rastrelliera, le posa accanto alle fiche vinte e spinge tutto verso il
giocatore, dove entrano nel saldo.

### Il tappeto

Le zone sono generate (`tavolo.js`) in due orientazioni: di lato sulla
scrivania (numeri in tre file orizzontali, chance sotto, colonne a destra), dalla
testata sul telefono (tre colonne, dozzine a sinistra, chance a destra, colonne
in fondo). Un tocco cerca prima i punti (cavalli, carré, terzine, sestine, trio,
0-1-2-3) entro il 30 % della casella, poi la casella che lo contiene; il tocco
prolungato evidenzia la zona e la riga in alto dice cosa si sta puntando prima
di lasciare. Paga: pieno 35, cavallo 17, terzina e trio 11, carré e 0-1-2-3 8,
sestina 5, dozzina e colonna 2, chance semplici 1; lo zero perde le esterne.

## Le immagini (gpt-image-2 su Replicate)

Quattro fogli generati l'8 ottobre 2026 (`fogli.js`, circa 1 $ in tutto):

- `ruota` → `art/ruota/conca.webp`: la conca da sopra, con un disco magenta al
  posto del rotore (sparisce con la chiave cromatica);
- `rotore` → `art/rotore/rotore.webp`: il rotore da sopra senza numeri; la
  corona la disegna la pagina in SVG così la pallina cade dove dice la fisica;
- `oggetti` → `art/oggetti/`: torretta (non usata: la torretta è disegnata, per
  girare col rotore), dolly, pallina;
- `tavolo` → `art/tavolo/tavolo.webp`: il feltro in pianta, senza segni.

Croupier, fiche e rastrelliera sono copie dei pezzi del blackjack
(`pzkko/games/blackjack/art/`).

```bash
node tools/roulette/immagini.mjs genera tutti
node tools/roulette/misura.mjs ruota tools/roulette/lavoro/ruota/<file>.png     # centro, buco, pista, deflettori
node tools/roulette/immagini.mjs intero ruota <file>.png conca --scala=0.5
node tools/roulette/immagini.mjs intero rotore <file>.png rotore --scala=0.5
node tools/roulette/immagini.mjs usa oggetti <file>.png torretta,dolly,pallina
node tools/roulette/immagini.mjs intero tavolo <file>.png tavolo --scala=0.6
```

Se si rigenera la `ruota`, le misure dei deflettori e dei raggi vanno rimesse
in `fisica.js` (`GEOM`, `DEFLETTORI`) da quello che stampa `misura.mjs`.

## In locale

```bash
node tools/blackjack/dev.mjs --port 5191      # serve pzkko/: http://localhost:5191/games/roulette/
node tools/roulette/prova.mjs                 # la fisica, 1480 giri
```

Per guardarla da un browser automatico (Playwright, puppeteer) la finestra va
portata in primo piano (`page.bringToFront()`): coperta da altre finestre Chrome
disegna un fotogramma al secondo e tutto sembra fermo.
