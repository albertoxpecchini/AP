# EMAIL INPUT TEMPLATE

---

## METADATI

```yaml
id: "2026-09-23-gruppo-whatsapp-colleghi"
date: "2026-09-23"
from_profile: "gmail"
to:
  - "Alberto Pecchini <398893@studenti.unimore.it>"
cc: []
bcc: []
reply_to: ""
subject: "Gruppo WhatsApp del corso e orario del I semestre"
language: "it"
tone: "cordiale"
priority: "normal"
footer_profile: "auto"
request_confirmation: false
```

---

## SCOPO DELL'EMAIL

```text
Far entrare i colleghi del primo anno in un gruppo WhatsApp che sia l'unico
canale per tenerci aggiornati: in presenza ci vediamo solo 5 ore a settimana
(Informatica a Modena), tutto il resto è videolezione da San Marino.

Con l'email mando anche l'orario del I semestre in PDF, così ognuno ha il
quadro completo delle lezioni.

Email funzionale: presentazione in una riga, perché il gruppo, pulsante,
allegato, chiusura. Nessun saluto da «ci vediamo presto»: siamo in videolezione.
```

---

## ISTRUZIONI DI SCRITTURA

```text
- tono: amichevole tra colleghi, dare del «voi», ma asciutto e pratico
- lunghezza: corta
- cosa enfatizzare: un solo canale per gli aggiornamenti; il pulsante; l'orario
  allegato e la sovrapposizione del giovedì 11–13
- cosa evitare: saluti da incontro di persona, elenchi di buoni propositi,
  lamentele sulle videolezioni
- eventuale call to action: entrare nel gruppo e girare l'email a chi manca
```

---

## MATERIALE GREZZO

```text
Ciao a tutti,

sono Alberto Pecchini, un vostro collega del primo anno di Costruzioni e
Gestione del Territorio: anch'io seguo da remoto Analisi e Fisica da San
Marino. Vi scrivo all'indirizzo di ateneo che compare tra i partecipanti della
videolezione.

In presenza ci vediamo solo 5 ore a settimana, a Informatica: per questo ho
creato un **gruppo WhatsApp**, così abbiamo un unico canale in cui tenerci
aggiornati su avvisi, cambi di orario o di aula, problemi di collegamento,
appunti ed esercizi.

:::bottone whatsapp
Entra nel gruppo WhatsApp
https://chat.whatsapp.com/CkIc5drfvYvA6Fv0buRn0M
:::

In allegato trovate l'**orario del I semestre** in PDF: Analisi e Fisica in
videolezione, Informatica in presenza. Attenzione al **giovedì 11–13**:
Informatica si sovrappone alle esercitazioni di Fisica.

Se conoscete qualcuno del corso che non ha ricevuto questa email, giratela
pure.

Ci sentiamo nel gruppo.

Un saluto,  
Alberto
```

---

## FILE DA LEGGERE

```text
```

---

## FILE DA ALLEGARE

```text
- emails/attachments/Orario-I-semestre-2026-27.pdf
```

---

## LINK DA INSERIRE

```text
```

---

## FOOTER DA IMPARARE / AGGIORNARE

```text
```

### Regola aggiornamento footer

```text
Azione footer: KEEP_EXISTING
```

---

## NOTE INTERNE

```text
Destinatari: gli indirizzi @studenti.unimore.it visibili tra i partecipanti
della videolezione Teams. Vanno messi in CCN (bcc), non in A: così nessuno
vede gli indirizzi degli altri e le risposte non partono «a tutti». In A resta
il mio indirizzo.

Link di invito ripulito dai parametri di condivisione (?s=cl&p=a&mlu=3), che
non servono all'invito: il codice del gruppo è CkIc5drfvYvA6Fv0buRn0M.

Allegato: copia di «Downloads/Orario I semestre 2026-27 - A4 orizzontale.pdf»
(714 KB), rinominata Orario-I-semestre-2026-27.pdf.
Ore in presenza: Informatica lun 13–16 + gio 11–13 = 5 h.
```

---

## CHECK FINALE UMANO

```text
[ ] destinatari in CCN
[ ] oggetto corretto
[ ] account mittente corretto
[ ] link del gruppo provato
[ ] PDF dell'orario allegato
[ ] footer presente
```

---

## COMANDO DESIDERATO

```text
GENERATE_EMAIL
```
