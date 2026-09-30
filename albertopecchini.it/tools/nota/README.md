# Nota — interventi e totale in un PDF A4

Alberto scrive una «nota» (per esempio la chiusura di stagione di una piscina:
periodo, titolo con il cliente, un intervento per riga con la data, il riepilogo
con gli importi e il totale) e lo script la impagina in un PDF A4 con i caratteri
del sito: Archivo per il testo, Instrument Serif corsivo nel titolo e nei giorni,
IBM Plex Mono per mesi ed etichette, un tocco di minio.

**Il testo non cambia**: niente parole aggiunte (intestazioni di colonna,
carta intestata, firme, IVA), niente tolte, niente corrette. Lo script tocca
solo la tipografia: spazi doppi, apostrofi (`‘26` → `’26`), numero e parola
sulla stessa riga, `100€` → `100 €`.

## Uso

```bash
node tools/nota/nota.mjs "C:/Users/pzkko/Documents/Note/2026-09-30 Nota piscina Affini.txt"
node tools/nota/nota.mjs <testo.txt> <uscita.pdf>     # altrove
node tools/nota/nota.mjs <testo.txt> --html           # lascia accanto anche l'HTML stampato
```

Il PDF va accanto al testo con lo stesso nome. Lo stampa Edge headless
(`--print-to-pdf`), con i caratteri presi da `node_modules/@fontsource*` e messi
nella pagina come data URI. Se il PDF è aperto in un lettore che lo blocca,
Edge non riesce a sovrascriverlo: chiuderlo e rilanciare.

Le note hanno nomi e importi dei clienti: il testo e il PDF stanno in
`Documents\Note\`, **fuori dal repository**. Qui c'è solo lo strumento.

## Come legge il testo

| Riga | Diventa |
| --- | --- |
| `periodo: stagione 2026` | l'etichetta in alto, dopo il quadratino minio |
| la prima che comincia con `Nota` | le prime due parole sono il titolo (la seconda in corsivo graziato), il resto è il cliente |
| `• 29 mag: …` (anche `-`, `*`, o solo `29 mag: …`) | un intervento: giorno, mese, testo; tra un mese e l'altro un filo più scuro |
| `… = 365€` | una voce del riepilogo, con l'importo a destra; le parole prima del numero (`forfait`) diventano un'etichetta accanto |
| `Totale … = 928€` | il totale, grande e in minio |
| qualunque altra riga | resta, sotto gli interventi, e lo script avvisa |

Dentro gli interventi: `= già regolato` in coda diventa un'etichetta minio,
`(offerto)`/`(offerta)` va in corsivo, gli importi in neretto.

Alla fine lo script scrive quanti interventi e voci ha letto, la somma delle
voci, il totale e il numero di pagine, e avvisa se la somma non torna col totale
scritto (il totale resta comunque quello di Alberto) o se una riga è fuori schema.
