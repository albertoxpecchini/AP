# Capitoli del quiz Trivia

Questa cartella contiene i **capitoli generati** del quiz: i file `.md` qui (uno per
capitolo, es. `villa-savoye.md`) vengono caricati automaticamente al build e diventano
i capitoli selezionabili nel gioco. Il titolo del capitolo è l'intestazione `#` in cima.

## Da dove vengono (pipeline di import)

I capitoli **non si scrivono a mano**: si generano dai sorgenti "formato libro" in
[`raw/`](./raw/) tramite lo script di import.

```
content/trivia/raw/*.md   →  node scripts/import-trivia.mjs  →  content/trivia/*.md
   (formato del libro)            (convertitore)                  (capitoli del gioco)
```

- Metti/aggiorna i sorgenti del libro in `content/trivia/raw/` (un file = un argomento).
- Lancia `node scripts/import-trivia.mjs` dalla root del progetto.
- Lo script: sistema l'encoding, importa le **multiple**, **salta i Vero/Falso**
  (in attesa delle risposte), **deduce i completamenti** dalle multiple dello stesso
  argomento, assegna titoli puliti e una keyword `foto:` per capitolo.
- Produce anche `content/trivia/raw/_IMPORT_REPORT.md` con conteggi e i (pochi)
  completamenti la cui risposta non è deducibile con certezza, da rivedere a mano
  (override possibili nella tabella `COMPLETION_OVERRIDE` dentro lo script).

> Non modificare a mano i file generati: verrebbero sovrascritti al prossimo import.
> Per correggere una risposta dedotta, agisci sul sorgente in `raw/` o sull'override.

## Formato di una domanda (capitolo generato)

Ogni domanda inizia con `## Domanda` e ha una riga `type:` tra:
`multipla`, `vero-falso`, `aperta`.

## Formato di una domanda

Ogni domanda inizia con `## Domanda` e ha una riga `type:` tra:
`multipla`, `vero-falso`, `aperta`.

```markdown
# Architettura Gotica

## Domanda
type: multipla
Che cos'è una volta a crociera?
- [ ] Un arco a tutto sesto
- [x] L'incrocio di due volte a botte
- [ ] Una cupola
> Spiegazione: testo facoltativo

## Domanda
type: vero-falso
La Sagrada Família è in stile gotico.
risposta: falso
> Spiegazione: è modernismo catalano.

## Domanda
type: aperta
Chi progettò la cupola di Santa Maria del Fiore?
risposta: Brunelleschi
accetta: Filippo Brunelleschi; Brunelleschi
foto: Cattedrale di Santa Maria del Fiore Firenze
> Spiegazione: completata nel 1436.
```

## Regole

- **multipla**: almeno 2 opzioni `- [ ]`, **esattamente una** segnata `- [x]`.
- **vero-falso**: `risposta: vero` oppure `risposta: falso`.
- **aperta**: `risposta:` (la risposta principale) + facoltativo `accetta:` con varianti
  separate da `;`. Il confronto ignora maiuscole/accenti/spazi e tollera piccoli refusi.
- `> Spiegazione:` è facoltativa per ogni tipo.
- `foto:` è facoltativa: forza la parola chiave per cercare l'immagine (Wikipedia).
  Se manca, viene dedotta dal testo della domanda e dalla risposta corretta.

Se una domanda è scritta male, `npm run build` si ferma con un messaggio chiaro
(es. `[trivia] gotico.md · Domanda 3: ...`).
