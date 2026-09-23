# EMAIL INPUT TEMPLATE

---

## METADATI

```yaml
id: "2026-09-21-iscrizioni-teams-studenti-mancanti"
date: "2026-09-21"
from_profile: "gmail"
to:
  - "Francesco Ceccoli <francesco.ceccoli@unirsm.sm>"
cc:
  - "Prof. Luca Lanzoni <luca.lanzoni@unimore.it>"
bcc: []
reply_to: ""
subject: "Studenti L-P01 non iscritti ai TEAMS di Analisi matematica e geometria e di Fisica — elenco"
language: "it"
tone: "professionale"
priority: "high"
footer_profile: "auto"
request_confirmation: false
```

---

## SCOPO DELL'EMAIL

```text
Segnalare al dott. Ceccoli, in un'unica comunicazione, l'elenco dei compagni
del primo anno L-P01 che non risultano inseriti nei TEAMS di Analisi matematica
e geometria e/o di Fisica e che quindi non riescono ad accedere alle lezioni.
Il prof. Lanzoni è in copia perché è il presidente del corso e mi aveva già
indirizzato al dott. Ceccoli per i problemi di accesso ai TEAMS.

Non è il mio caso personale (quello è già oggetto della mia email del 19/9):
qui faccio da tramite per i colleghi, raccogliendo i dati in un solo messaggio
invece di farli scrivere uno a uno. Deve essere chiarissimo che l'obiettivo è
far risparmiare tempo a lui, non sollecitare.

Il messaggio deve dare tutto ciò che serve per cercare le persone a sistema:
nome, cognome, email istituzionale (= matricola) e quale dei due insegnamenti
manca. Le lezioni sono iniziate oggi, lunedì 21 settembre: l'urgenza c'è, ma
va lasciata implicita.
```

---

## ISTRUZIONI DI SCRITTURA

```text
- tono: cordiale, pratico, collaborativo; mai rivendicativo
- lunghezza: corta — una premessa di due righe, la tabella, una chiusura
- cosa enfatizzare: la tabella con i dati completi; il fatto che sia un elenco
  unico raccolto per comodità sua; la disponibilità a integrare se emergono
  altri nomi
- cosa evitare: lamentele sul fatto che le iscrizioni non siano state fatte,
  ricostruzioni della vicenda, elenchi puntati oltre alla tabella, toni da
  reclamo collettivo, la parola "diritto", qualsiasi accenno a disagi personali
- eventuale call to action: verificare le posizioni e inserire gli studenti nei
  rispettivi team
- eventuale scadenza: le lezioni sono iniziate oggi, lunedì 21 settembre
```

---

## MATERIALE GREZZO

```text
Gentile dott. Ceccoli,

Le scrivo in seguito alla mia email del 19 settembre sull'accesso ai TEAMS
degli insegnamenti erogati da UNIRSM.

Nei giorni scorsi è emerso che la stessa difficoltà riguarda diversi compagni
del primo anno: non risultano inseriti nei team di **Analisi matematica e
geometria** e/o di **Fisica** e non riescono quindi ad accedere alle lezioni.
Ho raccolto i loro dati in un unico elenco, così da evitarLe altrettante
segnalazioni separate.

| Cognome e nome | Email istituzionale | Team mancante |
| --- | --- | --- |
| Bombarda Francesco | 393845@studenti.unimore.it | Fisica |
| Ferraro Domenico | 389835@studenti.unimore.it | Fisica |
| Governatori Gabriele | 399889@studenti.unimore.it | Analisi matematica e geometria, Fisica |
| Ivancic Davide | 402202@studenti.unimore.it | Analisi matematica e geometria, Fisica |
| Fusari Federico | 380495@studenti.unimore.it | Analisi matematica e geometria, Fisica |
| Devoli Marco | 403387@studenti.unimore.it | Analisi matematica e geometria, Fisica |
| Sanfelice Andrea | 398994@studenti.unimore.it | Analisi matematica e geometria, Fisica |

Tutti frequentano il corso di laurea L-P01 — Professioni tecniche per l'edilizia
e il territorio dell'Università di Modena e Reggio Emilia.

Le sarei grato se potesse verificare le loro posizioni e procedere con
l'inserimento nei rispettivi team. Se nei prossimi giorni dovessero emergere
altri nominativi nella stessa situazione, provvederò a segnalarglieli con
un'unica comunicazione successiva.

La ringrazio per la cortesia e resto a disposizione.

Cordiali saluti,
Alberto Pecchini
```

---

## FILE DA LEGGERE

```text
```

---

## FILE DA ALLEGARE

```text
```

---

## LINK DA INSERIRE

```text
```

---

## FOOTER DA IMPARARE / AGGIORNARE

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
Azione footer: KEEP_EXISTING
```

---

## NOTE INTERNE

```text
Segue la mia email del 19/9 al dott. Ceccoli sulle credenziali TEAMS, nella
quale il prof. Lanzoni mi aveva indicato lui come referente per i problemi di
accesso. Qui il prof. Lanzoni è in CC (scelta dell'utente) in quanto presidente
del corso.

Dati raccolti dai diretti interessati tramite il gruppo del corso, 21/9.
Da verificare prima dell'invio:
- Devoli Marco e Sanfelice Andrea hanno fornito solo la matricola (403387,
  398994): l'email è stata ricostruita nel formato matricola@studenti.unimore.it
  coerente con gli altri.
- Governatori, Ivancic, Devoli e Sanfelice non hanno specificato a quale dei
  due insegnamenti manchino: indicati come mancanti da entrambi.
- Bombarda e Ferraro hanno dichiarato esplicitamente di essere già iscritti ad
  Analisi e di mancare solo da Fisica.
```

---

## CHECK FINALE UMANO

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
