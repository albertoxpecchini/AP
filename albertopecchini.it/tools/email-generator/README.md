# Generatore di email HTML

Trasforma materiale grezzo (appunti, testo disordinato, file) in un'email HTML
autosufficiente, pronta da copiare nel composer di Yahoo, Proton o Gmail.

Il risultato di ogni generazione è **un solo file da leggere**: `report.md`.
L'email non viene mai stampata a schermo.

## Indice

- [Avvio rapido](#avvio-rapido)
- [Comandi](#comandi)
- [Dove si mettono i file](#dove-si-mettono-i-file)
- [Compilare il file di input](#compilare-il-file-di-input)
- [Account mittente](#account-mittente)
- [Firme](#firme)
- [Come si invia l'email](#come-si-invia-lemail)
- [Cosa viene generato](#cosa-viene-generato)
- [Stile e carattere](#stile-e-carattere)
- [Validazione](#validazione)
- [Architettura](#architettura)

## Avvio rapido

Richiede **Node 20.19 o superiore**, lo stesso del sito. Nessuna dipendenza
aggiuntiva: il generatore usa solo i moduli di Node.

```bash
npm run email:new preventivo-studio    # crea emails/in/2026-09-18-preventivo-studio.md
# …si compila il file…
npm run email emails/in/2026-09-18-preventivo-studio.md
```

L'ultima riga stampa il percorso del report. Tutto il resto è lì dentro.

## Comandi

```bash
npm run email <file.md>        # genera l'email
npm run email:new <nome>       # crea un input da EMAIL_INPUT_TEMPLATE.md
npm run email:list             # elenca gli input in emails/in/
npm run email:profiles         # mostra gli account configurati e i loro alias
npm run email:theme            # rigenera il tema dal CSS del sito
```

Il nome del file basta da solo se è dentro `emails/in/`:
`npm run email 2026-09-18-preventivo-studio`.

## Dove si mettono i file

```
emails/
  in/            i file di input, uno per email
  out/           gli output, una cartella per email
  attachments/   allegati e fonti da riutilizzare
  archive/       email già inviate (spostate a mano)
  logs/          registro delle generazioni
config/
  sender-profiles.json   gli account mittente
  email-theme.json       tema derivato dal CSS del sito (rigenerabile)
profiles/
  footers.json   archivio firme versionato
  footers.md     specchio leggibile, generato
```

## Compilare il file di input

Si parte sempre da `EMAIL_INPUT_TEMPLATE.md`, nella radice del sito.
`npm run email:new <nome>` ne fa una copia con id e data già compilati.

Le sezioni indispensabili:

| Sezione | A cosa serve |
| --- | --- |
| `METADATI` | mittente, destinatario, oggetto, tono |
| `MATERIALE GREZZO` | il contenuto: testo, appunti, Markdown |
| `FILE DA LEGGERE` | fonti da cui attingere — **non** vengono allegate |
| `FILE DA ALLEGARE` | i soli file che vanno allegati davvero |

Le altre sono facoltative.

### Markdown nel materiale grezzo

Funzionano titoli `##`, elenchi puntati e numerati, `**grassetto**`, `*corsivo*`,
`` `codice` ``, blocchi di codice, citazioni `>`, tabelle e link `[testo](url)`.
Per una nota evidenziata:

```text
:::nota
Il preventivo resta valido 30 giorni.
:::
```

Per un pulsante (etichetta e URL su righe proprie; sotto compare anche il link
in chiaro). Con la variante `whatsapp` il pulsante prende verde e logo di
WhatsApp; senza variante usa i colori del tema:

```text
:::bottone whatsapp
Entra nel gruppo WhatsApp
https://chat.whatsapp.com/CODICE
:::
```

Se il materiale contiene a sua volta un blocco di codice, si racchiude la sezione
in una recinzione più lunga (quattro apici inversi invece di tre).

### Saluto e chiusura

Vengono aggiunti solo se non ci sono già.
Il saluto è personale quando il destinatario è scritto con il nome:

```yaml
to:
  - "Mario Rossi <mario.rossi@dominio.it>"   # → «Gentile Mario Rossi,»
  - "mario.rossi@dominio.it"                 # → «Buongiorno,»
```

Da un indirizzo nudo il nome **non** viene dedotto: `m.rossi@…` non diventa
«M Rossi». Il report lo segnala.

## Account mittente

Il campo `from_profile` è obbligatorio e accetta molte forme:

| Profilo | Indirizzo | Si può scrivere |
| --- | --- | --- |
| `yahoo` | pzkko@yahoo.com | `yahoo`, `personale`, `privato`, l'indirizzo |
| `proton` | pecchini@protonmail.com | `proton`, `lavoro`, `azienda`, l'indirizzo |
| `gmail` | 398893@studenti.unimore.it | `gmail`, `università`, `unimore`, l'indirizzo |

Accenti e maiuscole non contano: `Università` e `universita` sono equivalenti.
Se il valore non è riconoscibile la generazione si ferma con
`MISSING_REQUIRED_DATA`: nessun profilo viene scelto d'ufficio.

Gli account si modificano in `config/sender-profiles.json`, che è l'unico posto
dove sono scritti.

## Firme

Ogni profilo ha la sua firma in `profiles/footers.json`, con **versioni**.
Per insegnarne una nuova si compila la sezione «FOOTER DA IMPARARE» e si indica
l'azione:

```text
[INIZIO FOOTER]
Alberto Pecchini
Studente — Matricola: 398893
Università degli Studi di Modena e Reggio Emilia
Email: 398893@studenti.unimore.it
[FINE FOOTER]
```

```text
Azione footer: ADD_VERSION
```

| Azione | Effetto |
| --- | --- |
| `KEEP_EXISTING` | la firma scritta viene ignorata (comportamento predefinito) |
| `ADD_VERSION` | si aggiunge una versione, che diventa quella attiva |
| `REPLACE` | come sopra, ma dichiarando la sostituzione |

Nessuna versione viene mai cancellata: restano tutte nel file e per tornare
indietro basta riportare `current` all'id precedente. Il report dice sempre cosa
è cambiato, e `profiles/footers.md` è lo specchio leggibile dell'archivio.

Con `footer_profile` si può usare la firma di un profilo diverso dal mittente.

## Come si invia l'email

Il composer di Yahoo, Proton e Gmail non accetta il codice HTML incollato: lo
mostrerebbe come testo. Va incollato il contenuto **renderizzato**.

1. Apri `preview.html` nel browser
2. Premi **«Copia email formattata»**
3. Incolla nel composer con `Ctrl+V`

Se il browser nega l'accesso agli appunti, apri `email.html` in una scheda,
seleziona tutto con `Ctrl+A` e copia con `Ctrl+C`: il risultato è lo stesso.

Gli allegati vanno aggiunti a mano: il generatore li elenca ma non li invia.

## Cosa viene generato

In `emails/out/<data>_<nome>/`:

| File | Cos'è |
| --- | --- |
| `report.md` | **l'unico file da leggere**: dati, stato, avvisi, istruzioni |
| `email.html` | l'email completa, con il carattere incorporato |
| `email-lite.html` | la stessa email senza carattere incorporato, per Gmail |
| `preview.html` | anteprima con il pulsante di copia |
| `email.txt` | versione in testo semplice |
| `attachments.md` | elenco degli allegati, se dichiarati |

Ogni generazione lascia una riga in `emails/logs/generations.log`.

## Stile e carattere

Il tema dell'email è **derivato dal CSS del sito**: `tools/email-generator/src/theme.js`
legge `src/styles/tokens.css` ed estrae colori, scala tipografica, spazi e raggi.
Il CSS del sito non viene mai modificato.

I valori che nella posta non esistono vengono tradotti: le `clamp()` diventano
misure fisse, le `var()` vengono risolte, i colori con trasparenza diventano
tinte piene. Il layout **non** è quello del sito: una colonna da 600px, tabelle
annidate, nessuna unità viewport.

Se i token del sito cambiano, il tema si rigenera da solo alla generazione
successiva; `npm run email:theme` lo forza.

### Il carattere

**Archivo Variable** (lo stesso del sito) viene incorporato in base64, nel
sottoinsieme latino: circa 34 KB che diventano 45 KB nell'HTML.

Non tutti i client lo applicano, ed è normale:

| Client | Carattere |
| --- | --- |
| Apple Mail, client WebKit | Archivo |
| Gmail, Outlook per Windows | ripiego: Helvetica Neue → Segoe UI → Arial |

La gerarchia, i colori e le spaziature restano identici: cambia solo il disegno
dei caratteri. Per questo esiste `email-lite.html`, più leggera: **Gmail tronca
i messaggi oltre 102 KB** e mostra «Visualizza messaggio completo». Con il
carattere incorporato un'email media pesa 60 KB e sta sotto la soglia, ma con
molto testo conviene la variante leggera, che a Gmail non toglie nulla.

## Validazione

Prima di dichiarare l'email pronta si controllano mittente, destinatario,
oggetto, corpo, firma, esistenza degli allegati, validità dei link, assenza di
JavaScript e di CSS esterno, presenza del viewport e delle media query.

| Stato | Significato |
| --- | --- |
| `READY` | nessun rilievo |
| `WARNING` | email generata, ci sono avvisi da leggere |
| `MISSING_REQUIRED_DATA` | dati obbligatori mancanti, email **non** pronta |

Con dati mancanti il comando esce con codice 2 e l'email non va considerata
inviabile, anche se i file esistono.

## Architettura

Un modulo per responsabilità, in `tools/email-generator/src/`:

| File | Responsabilità |
| --- | --- |
| `parse-input.js` | lettura del template Markdown e dei metadati |
| `senders.js` | normalizzazione dell'account mittente |
| `sources.js` | lettura delle fonti, verifica degli allegati |
| `theme.js` | derivazione del tema dal CSS del sito |
| `fonts.js` | incorporamento del carattere |
| `footers.js` | archivio firme versionato, logo della firma in data URI |
| `footer-html.js` | resa del footer in HTML e testo (modulo puro) |
| `assets.js` | icone dei pulsanti in data URI |
| `font-css.js` | regola @font-face del carattere incorporato (modulo puro) |
| `compose.js` | saluto, chiusura, struttura del corpo |
| `markdown.js` | Markdown → HTML con stili inline, e → testo |
| `template.js` | impianto HTML dell'email |
| `preview.js` | anteprima locale e copia del contenuto renderizzato |
| `validate.js` | controlli, errori e avvisi |
| `report.js` | report e riga di log |
| `generate.js` | orchestrazione |

Il JavaScript vive solo nell'anteprima: dentro l'email non ce n'è.

I moduli di resa — `compose.js`, `markdown.js`, `template.js`, `footer-html.js`,
`font-css.js`, `validate.js`, `report.js`, `util.js` — non toccano il disco: gli
stessi file girano anche nel browser, nel compositore in pagina (`/email/`, vedi
il README del sito), che produce email identiche a quelle di `npm run email`.
Lettura di file, firme, tema e immagini restano nei moduli Node (`footers.js`,
`assets.js`, `fonts.js`, `theme.js`, `sources.js`, `generate.js`).

## Regola sui dati

Il generatore dà forma al testo — saluto, chiusura, impaginazione — ma **non
inventa fatti**. Nomi, date, importi, indirizzi, link e allegati vengono solo
dal file di input e dalle fonti lette. Quando manca un'informazione, il report
la segnala invece di riempire il vuoto.
