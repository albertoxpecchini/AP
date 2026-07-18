# Capitoli del quiz Trivia

Questa cartella contiene i **capitoli** del quiz: i file `.md` qui (uno per
capitolo, es. `villa-savoye.md`) vengono caricati automaticamente al build e diventano
i capitoli selezionabili nel gioco. Il titolo del capitolo è l'intestazione `#` in cima.

Per aggiungere un capitolo basta creare qui un nuovo `.md` che rispetti il formato
descritto sotto: il build lo prende da solo, non serve registrarlo da nessuna parte.

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
