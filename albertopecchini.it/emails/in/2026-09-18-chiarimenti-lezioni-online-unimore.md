# EMAIL INPUT TEMPLATE

> Duplica questo file per ogni nuova email.
> Esempio nome file: `2026-09-18-universita-segreteria.md`
>
> Scorciatoia: `node tools/email-generator/cli.js new segreteria` crea già la copia
> in `emails/in/` con id e data compilati.

---

## METADATI

```yaml
id: "2026-09-18-chiarimenti-lezioni-online"
date: "2026-09-18"
from_profile: "gmail"
to:
  - "Prof. Luca Lanzoni <luca.lanzoni@unimore.it>"
cc: []
bcc: []
reply_to: ""
subject: "Richiesta di chiarimenti sulle lezioni online di San Marino — L-P01, matricola 398893"
language: "it"
tone: "formale"
priority: "high"
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
praticamente è saltato fuori un messaggio (arrivato tramite whatsapp e non da fonte ufficiale) da parte di questo "presidente del corso" detto da i miei colleghi di studio del corso: L-P01 - Professioni tecniche per l'edilizia e il territorio; Cari studenti, trasmetto in allegato l'orario di San Marino aggiornato. Di questo orario dovete guardare SOLO le lezioni di "Analisi matematica e geometria" e "Fisica" (e le relative esercitazioni). Vi ricordo che tali lezioni verranno erogate ONLINE e videoregistrate. Le lezioni a San Marino iniziano lunedì 21/9. A breve l'orario verrà aggiornato anche sulla pagina WEB dell'orario del nostro Corso di Studi UniMoRe. Saluti. prof. Lanzoni.
stiamo parlando con: Presidente
Prof. Luca Lanzoni
luca.lanzoni@unimore.it
+390592056116
vorrei avere ulteriori informazioni essendo che questa cosa non è ancora sul sito, non abbiamo dati o accessi ma solo questo PDF: "C:\Users\pzkko\Downloads\26-27 Orario CGT I sem. - con aule (2).pdf"
```

---

## ISTRUZIONI DI SCRITTURA

Indica qui eventuali richieste particolari.

```text
- tono: professionale e tranquillo senza innervosire
- lunghezza: media
- cosa enfatizzare: accessi/modalità/cosa cambierà/quanto tempo durerà questa sessione di videolezioni nel semestre?
- cosa evitare: frustazione/complicazioni personali essendo pendolare/fastidio del fatto che sarò un mercoledì per 7 ore con gli occhi allo schermo (il mio orario: "C:\Users\pzkko\Downloads\LPCostruzionieGestionedelTerritorio_LaureaTriennale_1_Comune_20-219 (1).pdf")
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
sono Alberto Pecchini, matricola 398893, iscritto al primo anno del corso
L-P01 — Professioni tecniche per l'edilizia e il territorio.

Nei giorni scorsi mi è stato girato da alcuni colleghi un messaggio a Suo nome,
con in allegato l'orario aggiornato di San Marino e l'indicazione che le lezioni
di **Analisi matematica e geometria** e **Fisica** saranno erogate online e
videoregistrate, con inizio lunedì 21 settembre.

Il messaggio mi è arrivato per vie informali e al momento non trovo l'informazione
sulla pagina web dell'orario del Corso di Studi. Prima dell'inizio delle lezioni
vorrei quindi assicurarmi di avere il quadro corretto.

## Le informazioni che mi mancano

1. **Accesso alle lezioni.** Su quale piattaforma si terranno e con quali
   credenziali? Serve un'iscrizione preventiva o un codice di accesso?
2. **Videoregistrazioni.** Dove verranno pubblicate e con quali tempi rispetto
   alla lezione dal vivo?
3. **Durata.** Questa modalità vale per l'intero primo semestre o è prevista
   per un periodo più breve?
4. **Esercitazioni.** Le esercitazioni di Analisi e di Fisica seguono la stessa
   modalità online delle lezioni?

## Una differenza fra i due orari

Confrontando l'orario di San Marino con quello pubblicato su EasyStaff per il
mio curriculum ho notato alcune difformità, e non so quale dei due debba
considerare valido:

| | Orario EasyStaff (UniMoRe) | Orario San Marino |
| --- | --- | --- |
| Fisica | martedì, prof. Andrea Baraldi | venerdì, prof. N. Lanconelli |
| Analisi | mercoledì, prof.ssa C. Giacomoni | mercoledì, prof.ssa C. Giacomoni |

Le chiedo cortesemente di indicarmi quale orario fa fede per la frequenza e se
la pagina web del Corso di Studi verrà aggiornata di conseguenza.

La ringrazio per la disponibilità e resto in attesa di un Suo riscontro.
```

---

## FILE DA LEGGERE

Questi file servono per costruire il contenuto dell'email, ma NON devono essere allegati automaticamente.

```text
- C:\Users\pzkko\Downloads\LPCostruzionieGestionedelTerritorio_LaureaTriennale_1_Comune_20-219 (1).pdf
- C:\Users\pzkko\Downloads\26-27 Orario CGT I sem. - con aule (2).pdf
```

---

## FILE DA ALLEGARE

Solo i file elencati qui devono essere considerati allegati dell'email.

```text
```

---

## LINK DA INSERIRE

```text
```

Se non servono, lascia vuoto.

---

## FOOTER DA IMPARARE / AGGIORNARE

> Compila questa sezione quando vuoi insegnare al programma una nuova firma.
> Il footer verrà associato al profilo indicato in `from_profile`.

```text
[INIZIO FOOTER]
Alberto Pecchini
Matricola 398893
Dipartimento di Ingegneria "Enzo Ferrari" — Costruzioni e Gestione del Territorio (classe L-P01)
Email: 398893@studenti.unimore.it
[FINE FOOTER]
```

### Regola aggiornamento footer

```text
Azione footer: ADD_VERSION
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
[x] destinatario corretto
[x] oggetto corretto
[x] account mittente corretto
[x] file da leggere indicati
[x] allegati indicati separatamente
[x] footer presente o richiesto
[x] eventuali link controllati
```

---

## COMANDO DESIDERATO

```text
GENERATE_EMAIL
```

Il programma deve leggere questo file e tutte le fonti indicate, generare gli output e creare il report `.md` finale.
