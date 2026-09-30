# Mascotte — la chiocciola, la tartaruga e i burattini

Gli animali di Alberto, la **chiocciola gigante africana** e la **tartaruga di
terra**, custodiscono il sito: la chiocciola (solo la testa, con gli occhi sui
peduncoli) sta accanto al marchio nella testata, tutte e due affiancano la firma
nel piè di pagina. Sono due immagini di **openai/gpt-image-2** su Replicate
(1536 × 1024, qualità high, fondo trasparente), nello stesso stile delle figurine
e con lo stesso bordo adesivo.

Gli **occhi** li muove il codice: il modello li disegna bianchi, tondi, con la
pupilla al centro; il sito ci mette sopra un occhio suo — disco bianco, pupilla che
segue il puntatore (ogni occhio per conto suo), palpebra del colore della pelle che
sbatte — e una zona «naso»: quando il puntatore ci sta sopra, gli occhi si
incrociano e la mascotte vibra. Senza puntatore (telefono, o mouse fermo) gli
occhi si guardano intorno. Con `prefers-reduced-motion` restano il solo
inseguimento del puntatore e niente battiti.

| File | Cosa è |
| --- | --- |
| `mascotte.js` | lo stile comune e le due mascotte: soggetto e testo alternativo |
| `mascotte.mjs` | lo script: genera, prepara (rifila, trova gli occhi, scrive il WebP e le misure), recupera una predizione già pagata |
| `lavoro/` | i PNG generati con il JSON dell'input (esclusi da Git) |
| `../../src/data/mascotte.js` | generato: misure dell'immagine, centro e semiassi degli occhi, colore delle palpebre; il **naso** si segna a mano e lo script lo conserva |
| `../../public/media/mascotte/` | `lumaca.webp`, `tartaruga.webp` (larghezza massima 1200 px) |
| `../../src/templates/components/ui.js` | `mascot(nome, { crop })` scrive il markup; `crop` mostra solo un ritaglio (la testa, in testata) |
| `../../src/client/mascot.js` | occhi, naso, palpebre, sguardo in giro |
| `../../src/styles/mascot.css` | occhi, palpebre, ritaglio |

Token e chiamate a Replicate: `tools/replicate.mjs`, in comune con copertine e
figurine (il token sta in `.env.local`, vedi [`tools/copertine/README.md`](../copertine/README.md)).

## Uso

```bash
node tools/mascotte/mascotte.mjs genera lumaca            # o tartaruga, o «tutte»
node tools/mascotte/mascotte.mjs usa lumaca tools/mascotte/lavoro/lumaca/<file>.png
node tools/mascotte/mascotte.mjs recupera lumaca <id>     # se l'attesa si interrompe: l'immagine è già pagata
```

`usa` pulisce la trasparenza (come le figurine: sotto 16 sparisce, sopra 240 è
pieno), rifila i margini vuoti, cerca gli occhi come macchie bianche quasi
circolari (anche ellittiche, per un occhio visto di tre quarti), campiona il
colore della pelle intorno a ciascuno per la palpebra e scrive `src/data/mascotte.js`.
Se trova un numero di occhi diverso da due lo dice: si correggono a mano. Le
percentuali sono dell'immagine rifilata: `x` e `rx` sulla larghezza, `y` e `ry`
sull'altezza.

Il **naso** (`nose: { x, y, rx, ry }`) va messo a mano guardando l'immagine (per
esempio con una griglia: `ffmpeg -i lumaca.webp -vf "drawgrid=w=iw/10:h=ih/10:c=red" griglia.png`).
Per la chiocciola è il muso sotto i peduncoli, per la tartaruga il becco tra gli
occhi. Il ritaglio della testata (`HEAD_CROP` in `src/templates/layout.js`) è in
percentuale dell'immagine, e la testata lo sfuma in basso con una maschera.

Se si rigenera una mascotte, gli occhi vengono ritrovati da soli, il naso resta
quello vecchio: va controllato che sia ancora al posto giusto. La fonte è
dichiarata in `/crediti/` e nel README del sito.

## Burattini — la chiocciola, la tartaruga, l'airone, la gazza e la vespa

Nel piè di pagina gli animali non sono un'immagine sola ma **burattini di
carta**: pezzi separati uniti da fermacampioni, che il sito rimonta e muove.
L'**airone elegante** (corpo con lo zaino da geometra, collo con il papillon,
testa, ala, due zampe), la **gazza furbissima** (corpo, testa con la chiave
rubata, ala, coda, due zampe), la **vespa cattiva ma precisa** (torace con le
zampe, testa, addome col pungiglione, due ali, due antenne), la **chiocciola**
smontata dalla mascotte (corpo, guscio, due peduncoli, stazione totale) e la
**tartaruga**, rifatta da zero il 1º ottobre 2026 (vedi sotto).

Due passaggi di gpt-image-2 per animale, sempre in qualità high:

1. **intero** (1536 × 1024): l'animale completo, con `lumaca.webp` e
   `tartaruga.webp` come riferimento di stile (per questo l'airone ha preso lo
   zaino della chiocciola); un animale può avere i suoi `riferimenti` e la sua
   `premessa` (la tartaruga ha solo la chiocciola, senza copiarne lo zaino);
   con `--candidati=2` il modello ne disegna due e si sceglie;
2. **pezzi** (2048 × 2048): lo stesso animale smontato, con l'intero come
   riferimento. Ogni pezzo che si muove finisce in una linguetta con un
   fermacampioni dorato: è il perno su cui gira. `ritaglia` in `burattini.js`
   tiene di un pezzo solo un riquadro (il collo della tartaruga: la parte che
   sta dentro il guscio uscirebbe da dietro quando la testa rientra).

Dal 30.09.2026 il modello rifiuta il fondo trasparente: i fogli si fanno su
magenta pieno e `usa` lo toglie con una chiave cromatica (`chiave()` in
`immagine.mjs`); lo stesso vale per `mascotte.mjs usa`.

### La tartaruga

Di profilo, in otto pezzi: il guscio è il corpo; **collo** (perno dentro al
guscio, scorre lungo il proprio asse, `hide.own`, e porta dentro la testa),
**testa** (sul collo), **mascella** (dietro alla testa, ridotta al 70% con
`scala`, si apre in negativo: sbadiglio e morso, con il buio della bocca
`mouth`), **elmetto** (davanti alla testa, `hide` manuale: salta, e nel sonno
scivola sugli occhi), **zampa anteriore** e **posteriore** (salgono e si
piegano sotto la corazza; quelle lontane riusano le stesse immagini con `img`,
più scure in CSS), **coda** (si tira sotto). `scena: { lift: true }` fa
prendere e sollevare il guscio col mouse. Il carattere (masticate, sbadiglio e
sonno dopo 16–28 s senza puntatore, spavento con capolino, mira e morso,
scalciare in aria, ritorno a passo di tartaruga) è `TARTARUGA` in
`src/client/puppet.js`; la stessa immagine intera, scontornata, è
`public/media/mascotte/tartaruga.webp` (la usa Better Call Pekko).

```bash
node tools/mascotte/burattini.mjs intero tartaruga --candidati=2
node tools/mascotte/burattini.mjs pezzi tartaruga tools/mascotte/lavoro/tartaruga/intero/<file>.png --candidati=2
node tools/mascotte/burattini.mjs usa tartaruga tools/mascotte/lavoro/tartaruga/pezzi/<file>.png testa,corpo,mascella,elmetto,collo,anteriore,posteriore,coda
node tools/mascotte/mascotte.mjs usa tartaruga tools/mascotte/lavoro/tartaruga/intero/<file>.png   # l'intera, per BCP
```

| File | Cosa è |
| --- | --- |
| `burattini.js` | lo stile, i due prompt e, per ciascun animale, il soggetto e l'elenco dei pezzi |
| `burattini.mjs` | lo script: `intero`, `pezzi`, `usa`, `recupera` |
| `burattini-usa.mjs` | `usa`: separa i pezzi del foglio (componenti della trasparenza), trova in ognuno il fermacampioni (macchia dorata quasi tonda) e, nella testa, gli occhi; scrive i WebP (metà misura) e `src/data/burattini-pezzi.js` |
| `immagine.mjs` | lettura del PNG, pulizia della trasparenza, rifilo, occhi, palpebre, WebP: in comune con `mascotte.mjs` |
| `../../src/data/burattini-pezzi.js` | generato: misure, perno e occhi di ogni pezzo, in pixel del suo WebP |
| `../../src/data/burattini.js` | **a mano**: il montaggio (genitore, punto d'attacco, davanti/dietro, angolo a riposo, escursione, cosa segue il puntatore, rigidità della molla); può correggere il perno e il colore delle palpebre |
| `../../public/media/mascotte/<nome>/` | i pezzi, `<pezzo>.webp` |
| `../../src/templates/components/ui.js` | `puppet(nome)`: annida i pezzi e calcola il riquadro del burattino a riposo |
| `../../src/client/puppet.js` | le molle, il trascinamento, gli occhi, il carattere di ciascuno |
| `../../src/styles/mascot.css` | sezione «Burattini» |

```bash
node tools/mascotte/burattini.mjs intero tutti                                   # o airone, gazza, vespa
node tools/mascotte/burattini.mjs pezzi airone tools/mascotte/lavoro/airone/intero/<file>.png
node tools/mascotte/burattini.mjs usa airone tools/mascotte/lavoro/airone/pezzi/<file>.png
#   elenca i pezzi trovati, numerati per righe da sinistra; poi si dà un nome a ciascuno:
node tools/mascotte/burattini.mjs usa airone tools/mascotte/lavoro/airone/pezzi/<file>.png testa,corpo,collo,zampaAlzata,ala,zampa
node tools/mascotte/burattini.mjs recupera airone pezzi <id>                     # se l'attesa si interrompe
```

I nomi dei pezzi sono chiavi JavaScript (niente trattini) e devono essere quelli
usati in `src/data/burattini.js`; la testa si chiama `testa` (o comincia così),
perché lo script ci cerca gli occhi. Il corpo può avere falsi fermacampioni (le
strisce gialle della vespa): non conta, il corpo non gira.

**Montare un pezzo**: `at` è il punto del genitore dove va il perno del pezzo,
in pixel del WebP del genitore. Per trovarlo conviene una griglia:
`ffmpeg -i corpo.webp -vf "drawgrid=w=50:h=50:c=red" griglia.png`. Poi si
guarda il risultato nel sito e si aggiusta; con
`.pup__part { outline: 1px dashed magenta }` si vedono i riquadri.

Costo del 30.09.2026: sei predizioni high (tre intere 3:2, tre fogli 2048²).
