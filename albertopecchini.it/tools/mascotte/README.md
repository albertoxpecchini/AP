# Mascotte — la chiocciola e la tartaruga

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
