# Figurine — un'immagine, nove illustrazioni

Le figurine sono le piccole illustrazioni scontornate che accompagnano i servizi,
le fasi del metodo (in `/metodo/` e in home), i lavori trasversali, gli strumenti
dello studio, le parti del sito che parlano di web (il foglio «computer»), la
pagina contatti e la 404. Hanno lo stesso stile delle copertine
(inchiostro, colori piatti, un solo tocco di minio) e un bordo chiaro sagomato:
sulla carta non si vede, sul fondo scuro le fa sembrare adesivi.

Ogni **foglio** è una sola immagine di **openai/gpt-image-2** su Replicate:
2048 × 2048, qualità high (sempre: è una scelta di Alberto), fondo trasparente,
nove figurine in una griglia 3 × 3. Lo script poi le ritaglia una per una.

| File | Cosa è |
| --- | --- |
| `fogli.js` | lo stile comune e i fogli (tecnico, digitale, grafica, informatica, informatica2, metodo, computer, chrome, tasti), nove figurine ciascuno, nell'ordine della griglia; un foglio può avere `stile` e `intro` propri e alzare la misura dei ritagli con `max` |
| `figurine.mjs` | lo script: genera un foglio, lo ritaglia, scarica un foglio già pagato |
| `lavoro/` | i fogli PNG con il JSON dell'input (esclusi da Git) |
| `../../src/data/figurine.js` | generato dal ritaglio: nomi e misure delle figurine pronte |
| `../../public/media/figurine/` | le figurine in WebP con trasparenza, lato lungo al massimo 440 px |

Token e chiamate a Replicate: `tools/replicate.mjs`, in comune con le copertine
(il token sta in `.env.local`, vedi [`tools/copertine/README.md`](../copertine/README.md)).

## Uso

```bash
node tools/figurine/figurine.mjs genera tecnico          # un foglio (o «tutti»)
node tools/figurine/figurine.mjs ritaglia tecnico tools/figurine/lavoro/tecnico/<file>.png
node tools/figurine/figurine.mjs recupera tecnico <id>   # se l'attesa si interrompe: il foglio è già pagato
```

Il ritaglio separa le figurine dalla trasparenza: raggruppa i pixel pieni in
blocchi connessi e assegna ogni blocco alla cella della griglia in cui cade il suo
baricentro, così un pezzo staccato (un raggio, una graffetta) resta con la sua
figurina e le briciole si scartano. Se il modello restituisce un fondo pieno
invece che trasparente, prima lo toglie riempiendo dai bordi. Per provarlo senza
toccare il sito: `FIGURINE_PROVA=<cartella> node tools/figurine/figurine.mjs ritaglia …`.

## Nel sito

`figurina(nome, { className })` in `src/templates/components/ui.js` disegna la
figurina se esiste in `src/data/figurine.js`, altrimenti niente: si può
aggiungere il posto nel template prima di avere l'immagine. I nomi si ricavano dai
dati con `figName()`:

| Dove | Nome |
| --- | --- |
| servizi (`/servizi/`) | `<area>-<titolo>`: `tecnico-rilievi`, `digitale-ui-ux` |
| lavori trasversali | `lavori-<codice>`: `lavori-a-c` |
| metodo (`/metodo/`, home) | `metodo-<key>`: `metodo-ascolto` |
| strumenti (`/studio/`) | `strumenti-<gruppo>`: `strumenti-rilievo-e-disegno` |
| contatti, 404 | `contatti`, `404` |
| piè di pagina (recapiti, social, torna su, note legali) | `chrome-email`, `chrome-telefono`, `chrome-sede`, `chrome-orari`, `chrome-instagram`, `chrome-github`, `chrome-su`, `chrome-privacy`, `chrome-crediti` |
| tasti «sasso» di testata e piè di pagina (`pebble()` in ui.js, sagome vuote senza bordo adesivo, ritagli fino a 960 px) | `tasto-carta-1…4`, `tasto-carta-tondo`, `tasto-minio-1…2`, `tasto-inchiostro-1`, `tasto-inchiostro-tondo` |
| home, sezione 03 «Web design e sviluppo» | `computer-postazione` accanto al titolo; `computer-mobile`, `computer-tastiera`, `computer-dominio` sui tre punti |
| home, sezione 02 «Siti web» | `computer-siti` |
| `/portfolio/web/` | `computer-codice` nella testata (`pageHead({ fig })`) |
| case study dei siti | `computer-lighthouse` (Risultato), `computer-stack` (Tecnologie), `computer-lancio` (Dati progetto): `WEB_FIGS` in `case-study.js` |

Un servizio nuovo: aggiungere la sua figurina a un foglio (o un foglio nuovo in
`fogli.js`), generare, ritagliare. Le figurine sono decorative (`alt=""`): il
testo accanto dice già cosa rappresentano. La fonte è dichiarata in `/crediti/`.
