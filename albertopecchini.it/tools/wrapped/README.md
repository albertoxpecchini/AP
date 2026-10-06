# Wrapped — l'analizzatore della chat

Lo strumento dietro la pagina `/wrapped5BT/`: legge gli export di WhatsApp
(«Esporta chat», senza media), li unisce e tira fuori i numeri veri da cui
nascono le slide. Niente rete, niente dipendenze: un solo script Node.

## Come si usa

```sh
node tools/wrapped/analizza.mjs lavoro/export1.zip lavoro/export2.zip --alias lavoro/alias.json
```

- Accetta `.zip` (serve `unzip` di sistema) o direttamente il `_chat.txt`.
- Capisce il formato inglese e quello italiano dell'export, anche mescolati:
  stesso gruppo esportato da due telefoni diversi.
- Il **primo** export passato è la fonte preferita quando lo stesso messaggio
  compare in entrambi; i doppioni si riconoscono per orario, mittente e inizio
  del testo (per i media, per tipo: i segnaposto cambiano lingua con l'export).
- `--alias` fonde i numeri e i nomi della stessa persona: copia
  `alias.esempio.json` in `lavoro/alias.json` e compilalo. Senza alias i numeri
  doppi restano persone separate, e lo script lo dice.

## Cosa produce

- `lavoro/dati.json` — tutte le metriche: volume, tempo, persone, linguaggio,
  sessioni, coppie, record, eventi, evoluzione per anno, anomalie. Ogni sezione
  dichiara le proprie definizioni (cosa conta come «messaggio», come «parola»,
  come «sessione») e la sezione `copertura` elenca i limiti: mesi quasi vuoti,
  periodi visti da una sola fonte, cose che l'export proprio non contiene
  (reaction, «rispondi a», contenuto dei media).
- `lavoro/chat_unificata.txt` — la chat fusa e normalizzata, per verificare a
  mano ogni citazione prima di metterla in una slide.

## Il patto con le slide

Le slide in `src/data/wrapped.js` si scrivono **solo** leggendo `dati.json` e
verificando le citazioni su `chat_unificata.txt`: nessun numero inventato,
nessuna frase attribuita senza riscontro. Se una metrica non è calcolabile,
nella slide si dice, non si approssima in silenzio.

## Privacy

`lavoro/` è nel `.gitignore`: gli export, gli alias con i nomi veri e i dati
calcolati non entrano mai nel repository. Qui dentro stanno solo lo script,
questo README e l'esempio di configurazione con nomi di fantasia.
