# Copertine e viste — le illustrazioni dei progetti non web

Il sito non mostra i documenti dei progetti (tavole, PDF, pagine della relazione):
ogni progetto non web ha un'illustrazione in assonometria come miniatura e copertina e
tre **viste** nella galleria del case study, disegnate da **openai/gpt-image-2** su
Replicate con le tavole (o, per il museo, le fotografie) come riferimento. Le tavole
vere restano nei dati, spente da `showSheets` in `src/data/projects.js`.

| File | Cosa è |
| --- | --- |
| `copertine.js` | lo stile comune (`STILE`) e, per ogni progetto, soggetto, tavole di riferimento e testo alternativo; sotto, `STILI` e `viste`, le tre immagini della galleria di ogni progetto |
| `genera.mjs` | lo script: genera le candidate, scarica una predizione già pagata, prepara la copertina scelta |
| `lavoro/` | le candidate PNG con il JSON dell'input (escluse da Git) |

## Token

`REPLICATE_API_TOKEN` (o `REPLICATE_API_KEY`) in `albertopecchini.it/.env.local`,
file escluso da Git. Il token si crea su replicate.com/account/api-tokens. Le
chiamate a Replicate stanno in `tools/replicate.mjs`, in comune con
[`tools/figurine`](../figurine/README.md). La qualità è sempre high: gli strumenti
non offrono versioni più economiche.

## Uso

```bash
node tools/copertine/genera.mjs progetto-stradale --n 2          # 2 candidate high, ~0,26 $ in tutto
node tools/copertine/genera.mjs tutte --n 2                      # tutte le voci di copertine.js
node tools/copertine/genera.mjs usa progetto-stradale tools/copertine/lavoro/progetto-stradale/<file>.png
node tools/copertine/genera.mjs recupera progetto-stradale <id>  # se l'attesa si interrompe, la predizione è già pagata
node tools/copertine/genera.mjs schema                           # gli input che il modello accetta oggi

node tools/copertine/genera.mjs vista layout-cantiere             # le tre viste, una predizione ciascuna (2048 × 1152)
node tools/copertine/genera.mjs vista layout-cantiere vista-02    # solo quella da rifare
node tools/copertine/genera.mjs usa-vista layout-cantiere vista-02 tools/copertine/lavoro/layout-cantiere/vista-02/<file>.png
node tools/copertine/genera.mjs recupera-vista layout-cantiere vista-02 <id>
```

Sotto i 10 $ di credito Replicate accetta al massimo 5 predizioni in un colpo e
risponde 429 alle altre (non partono e non si pagano): `tools/replicate.mjs` le
riprova da solo, ma conviene non lanciarne più di cinque insieme.

## Viste della galleria

Tre per progetto, in `viste`: la prima va a tutta larghezza nel case study, le altre
due in riga. `stile` sceglie il linguaggio, sempre con lo stesso tratto e la stessa
palette delle copertine: `scena` è un'inquadratura piena fino al bordo (dal vero, un
interno), `blocco` un oggetto che galleggia sulla carta (un esploso, una sezione),
`oggetti` una tavola da catalogo. `usa-vista` scrive `vista-NN.webp` (1600 px) e
`vista-NN-full.webp` (l'originale, per il lightbox) in `public/media/progetti/<slug>/`;
per `blocco` e `oggetti` aggiunge il margine di carta e bilancia i colori come per le
copertine, le `scena` restano come sono. In `projects.js` ogni vista si dichiara con
`drawnView(SLUG, 'NN', alt, didascalia)` dentro `images`, con l'alt che descrive
l'immagine uscita davvero.

I costi sono quelli segnati da Replicate il 25 settembre 2026 per 1536×1024.

`usa` scrive `public/media/progetti/<slug>/copertina.webp` a 1920×1280. Il modello
riempie quasi tutta la larghezza anche quando gli si chiede margine, e le copertine
si ritagliano a 4:3 (card, elenco tecnico) e a 16:9 (testata del case study). Per
questo `usa` allarga la tela di un ottavo per lato con il colore della carta e sfuma
il bordo dell'originale. Poi bilancia i colori perché la carta sia esattamente
`--c-paper` (`#f3f1ec`): così la copertina si fonde con la pagina.

In `src/data/projects.js` la copertina si dichiara con `drawnCover(slug, alt)`.

Una voce può non essere un progetto: `informatica` è l'illustrazione dell'area D dei
servizi (un piccolo studio in assonometria). Ha `stile: 'blocco'`, cioè il linguaggio
delle viste al posto del blocco di terreno, e `cartella`, dove `usa` scrive
`copertina.webp` (qui `public/media/servizi/informatica/`).

## Un progetto nuovo

1. Aggiungere la voce in `copertine.js`: `riferimenti` sono le tavole più leggibili
   (una pianta generale, i prospetti), `soggetto` descrive il progetto e dice dove sta
   cosa sulla tavola. Il minio va a un solo elemento, quello chiave.
2. `--n 2`, poi `usa` con la candidata migliore.
3. `cover: drawnCover(SLUG, '…')` in `projects.js`, con il testo alternativo della
   candidata scelta: descrive l'illustrazione, non la tavola.
