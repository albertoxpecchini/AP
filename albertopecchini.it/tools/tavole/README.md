# Tavole — dal DWG e dal PDF al visualizzatore

Come nascono i file in `public/media/tavole/<slug>/` che il visualizzatore del sito
(`/portfolio/tavole/` e la sezione Tavole dei case study) ingrandisce e fa scaricare.

Per ogni tavola servono, con il numero della tavola come nome:

| File | Cosa è | Come si fa |
| --- | --- | --- |
| `NN.svg` | il disegno vettoriale delle tavole **da PDF** | dal PDF con `pdftocairo -svg`, poi `svgopt.py` |
| `NN.webp` | miniatura larga 1200 px (anteprima, galleria, social) | screenshot della tavola a 1600 px con Chromium (dal visualizzatore per i DWG, dall’SVG per i PDF), WebP qualità 80 |
| `NN-mini.webp` | miniatura da 320 px per l’elenco delle tavole | dalla precedente, WebP qualità 72 |
| `NN.pdf` | il file da scaricare | il PDF stampato da AutoCAD |

La copertina del progetto non è una tavola ma un'illustrazione: vedi
[`tools/copertine/`](../copertine/README.md). La tavola si
dichiara in `src/data/projects.js` con `sheet(slug, 'NN', { … })`: `h` è l’altezza
della miniatura da 1200 px.

## Dal DWG: nessuna conversione

Il DWG resta DWG. Si copia il file `.dwg` nella cartella della tavola (una copia per
progetto, non per tavola) e in `projects.js` si dichiara ogni tavola come riquadro
dello spazio modello:

```js
sheet(BAR, '01', { dwg: 'bar-caffetteria.dwg', box: [2296.2, 2014.13, 2338.22, 2043.85], … })
```

`box` è x0, y0, x1, y1 in unità di disegno (in AutoCAD: `ID` sugli angoli della
squadratura). Le tavole del bar-caffetteria sono le squadrature A3 in scala 1:100
(42 × 29,7 unità); quelle della strada sono i riquadri delle fasi del progetto.
Il browser legge il file con `src/dwg/` (lettore scritto da zero, senza librerie,
formati AutoCAD 2010–2018) e disegna il riquadro su canvas, come in AutoCAD con lo
**sfondo bianco**: il colore 7 diventa nero, gli altri colori restano quelli del file
(anche i colori veri e le trasparenze), le maschere dei testi prendono il colore dello
sfondo, i layer spenti, congelati o «non stampabili» non si vedono, l’ordine di
disegno (porta in primo/secondo piano) è rispettato. Con `darken: true` i tratti
troppo chiari (curve di livello grigio chiaro e rosa, giallo, ciano: colori scelti
per lo sfondo scuro) vengono scuriti mantenendo la tinta; i riempimenti no.

Gli script Python di questa cartella (`dxf2svg.py`, `fixdxf.py`, `heal.py`) e i file
JSON con i riquadri sono la vecchia strada DWG → DXF → SVG, non più usata dal sito:
restano come documentazione dei riquadri e dei difetti di LibreDWG che avevano reso
necessarie le correzioni.

## Dal PDF

I PDF stampati da AutoCAD sono già vettoriali:

```bash
pdftocairo -svg tavola.pdf lavoro/tavola.raw.svg
python svgopt.py lavoro/tavola.raw.svg ../../public/media/tavole/<slug>/NN.svg 3
```

`svgopt.py` arrotonda le coordinate dei tracciati a tre decimali (le matrici di
trasformazione restano esatte), porta i colori in esadecimale e toglie gli attributi
con il valore predefinito: i file scendono di circa un terzo.

## Riservatezza

Prima di pubblicare una tavola si guarda cosa c’è scritto sopra:

- **Indirizzi**: dal PDF dell’inquadramento del cantiere è stato tolto il nome della
  strada (redazione con PyMuPDF, rimuovendo i tratti del testo).
- **Persone**: nella relazione sul museo i nomi dei compagni sono coperti e le
  fotografie in cui si riconoscono sono sfocate, nel PDF e nelle pagine; il PDF
  pubblicato ha i metadati ripuliti.
