# EMAIL INPUT TEMPLATE

> Duplica questo file per ogni nuova email.
> Esempio nome file: `2026-09-18-universita-segreteria.md`
>
> Scorciatoia: `node tools/email-generator/cli.js new segreteria` crea già la copia
> in `emails/in/` con id e data compilati.

---

## METADATI

```yaml
id: "2026-09-18-nome-email"
date: "2026-09-18"
from_profile: "gmail"
to:
  - ""
cc: []
bcc: []
reply_to: ""
subject: ""
language: "it"
tone: "professionale"
priority: "normal"
footer_profile: "auto"
request_confirmation: false
```

### Valori ammessi per `from_profile`

```text
yahoo
proton
gmail
pzkko@yahoo.com
pecchini@protonmail.com
398893@studenti.unimore.it
personale
lavoro
azienda
università
universita
```

### Note sui campi

- `to` accetta sia `mario.rossi@dominio.it` sia `Mario Rossi <mario.rossi@dominio.it>`.
  Con la seconda forma il saluto diventa «Gentile Mario Rossi,»; senza nome resta «Buongiorno,».
- `tone` ammette: `professionale`, `formale`, `cordiale`, `informale`, `diretto`.
- `footer_profile` con `auto` usa la firma dell'account mittente; indicando un altro
  profilo (`yahoo`, `proton`, `gmail`) si usa quella firma.

---

## SCOPO DELL'EMAIL

Scrivi in poche righe cosa devo ottenere con questa email.

```text
...
```

---

## ISTRUZIONI DI SCRITTURA

Indica qui eventuali richieste particolari.

```text
- tono:
- lunghezza:
- cosa enfatizzare:
- cosa evitare:
- eventuale call to action:
- eventuale scadenza:
```

Lascia vuoto ciò che non serve.

---

## MATERIALE GREZZO

Incolla qui quello che vuoi trasformare in email.
Può essere testo disordinato, appunti, messaggi, informazioni copiate da altri documenti, ecc.

Il Markdown è supportato: `## titoli`, elenchi, `**grassetto**`, tabelle `| a | b |`,
citazioni `>`, codice fra apici inversi e blocchi ```.
Per una nota evidenziata usa:

```text
:::nota
Testo della nota.
:::
```

Saluto e chiusura vengono aggiunti in automatico se non li scrivi tu.

```text
...
```

---

## FILE DA LEGGERE

Questi file servono per costruire il contenuto dell'email, ma NON devono essere allegati automaticamente.

```text
- percorso/file-1.pdf
- percorso/file-2.docx
- percorso/file-3.md
```

---

## FILE DA ALLEGARE

Solo i file elencati qui devono essere considerati allegati dell'email.

```text
- percorso/allegato-1.pdf
- percorso/allegato-2.xlsx
```

---

## LINK DA INSERIRE

```text
- https://...
- https://...
```

Se non servono, lascia vuoto.

---

## FOOTER DA IMPARARE / AGGIORNARE

> Compila questa sezione quando vuoi insegnare al programma una nuova firma.
> Il footer verrà associato al profilo indicato in `from_profile`.

```text
[INIZIO FOOTER]

Inserisci qui la firma completa esattamente come vuoi che venga memorizzata.

Esempio:
Nome Cognome
Ruolo
Azienda / Università
Telefono
Email
Sito
Indirizzo

[FINE FOOTER]
```

### Regola aggiornamento footer

```text
Azione footer: KEEP_EXISTING
```

Valori ammessi:

- `KEEP_EXISTING` = non sostituire la firma esistente
- `ADD_VERSION` = salva questa come nuova versione
- `REPLACE` = sostituisce esplicitamente quella esistente

---

## NOTE INTERNE

Informazioni utili per il generatore ma che NON devono necessariamente finire nell'email.

```text
...
```

---

## CHECK FINALE UMANO

Prima della generazione puoi controllare rapidamente:

```text
[ ] destinatario corretto
[ ] oggetto corretto
[ ] account mittente corretto
[ ] file da leggere indicati
[ ] allegati indicati separatamente
[ ] footer presente o richiesto
[ ] eventuali link controllati
```

---

## COMANDO DESIDERATO

```text
GENERATE_EMAIL
```

Il programma deve leggere questo file e tutte le fonti indicate, generare gli output e creare il report `.md` finale.
