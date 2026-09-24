# Tavole — dal DWG e dal PDF al visualizzatore

Come nascono i file in `public/media/tavole/<slug>/` che il visualizzatore del sito
(`/portfolio/tavole/` e la sezione Tavole dei case study) ingrandisce e fa scaricare.

Per ogni tavola servono quattro file, con il numero della tavola come nome:

| File | Cosa è | Come si fa |
| --- | --- | --- |
| `NN.svg` | il disegno vettoriale, quello che si ingrandisce | dal DWG con `dxf2svg.py`, dal PDF con `pdftocairo -svg`; poi `svgopt.py` |
| `NN.webp` | miniatura larga 1200 px (anteprima, galleria, social) | screenshot dell’SVG a 1600 px con Chromium, WebP qualità 80 |
| `NN-mini.webp` | miniatura da 320 px per l’elenco delle tavole | dalla precedente, WebP qualità 72 |
| `NN.pdf` | il file da scaricare | il PDF stampato da AutoCAD; per le tavole prese dal DWG, l’SVG stampato in PDF da Chromium |

Più `copertina.webp` (2000 px) per la copertina del progetto. Poi la tavola si
dichiara in `src/data/projects.js` con `sheet(slug, 'NN', { … })`: `h` è l’altezza
della miniatura da 1200 px.

## Dal DWG

Servono [LibreDWG](https://www.gnu.org/software/libredwg/) (`dwg2dxf`) e Python con
`ezdxf`. I file di lavoro vanno in `tools/tavole/lavoro/`, che Git ignora.

```bash
cd tools/tavole
dwg2dxf -y -o lavoro/strada.dxf "PECCHINI ALBERTO - TRACCIOLINO + RETTIFILO + CURVE + PICCHETTI (2).dwg"
python fixdxf.py lavoro/strada                    # → lavoro/strada.fixed.dxf
python dxf2svg.py progetto-stradale.json          # → lavoro/strada-01.raw.svg …
python svgopt.py lavoro/strada-01.raw.svg ../../public/media/tavole/progetto-stradale/01.svg 3
```

Il file JSON dice quale DXF leggere e, per ogni tavola, il riquadro del model space
da esportare (`box`: x0, y0, x1, y1 in unità di disegno). Le tavole del bar-caffetteria
sono le squadrature A3 in scala 1:100 (42 × 29,7 unità); quelle della strada sono i
riquadri delle fasi del progetto.

L’SVG esce come in AutoCAD con lo **sfondo bianco**: il colore 7 diventa nero, gli
altri colori restano quelli del file, le maschere dei testi prendono il colore dello
sfondo. Con `"darken": true` i tratti troppo chiari (curve di livello grigio chiaro e
rosa, giallo, ciano: colori scelti per lo sfondo scuro) vengono scuriti mantenendo la
tinta; i riempimenti no.

### Cosa correggono gli script

LibreDWG 0.13 legge bene la geometria ma lascia alcuni difetti che ezdxf non perdona:

- `fixdxf.py` — testi lunghi spezzati da un a capo vero e pezzi dei testi multilinea
  (MTEXT) scritti in ordine sbagliato: il primo pezzo finiva in fondo.
- `heal.py` — spline dei contorni dei tratteggi con il vettore dei nodi della
  lunghezza sbagliata; motivi dei tratteggi con la scala applicata due volte quando
  stanno in un blocco (un prato diventava centinaia di milioni di trattini).
- `dxf2svg.py` — colore dei tratteggi letto come blu puro (il campo del colore vero
  contiene un solo byte): si torna al colore ACI.

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
