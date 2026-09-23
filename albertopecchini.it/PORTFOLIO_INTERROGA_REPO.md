# PORTFOLIO — INTERROGA IL REPO DI UN PROGETTO WEB

> Serve a raccogliere, dal repository di un sito fatto da me, tutto quello che
> occorre per la sua scheda su albertopecchini.it (`/portfolio/<slug>/`).
>
> **Come si usa**
> 1. Apri Claude Code **nella cartella del repo del progetto** (Rivalta, Donelli, …).
> 2. Allega questo file, o incollalo, e scrivi: «Segui le istruzioni di questo file».
> 3. Claude scrive `PORTFOLIO_SCHEDA.md` nella radice del repo del progetto.
> 4. Porta quella scheda nella sessione di albertopecchini.it: da lì si aggiornano
>    `src/data/projects.js`, `src/data/studio.js` e gli screenshot.
>
> Compila prima il blocco qui sotto. I campi che lasci vuoti Claude li ricava dal
> repo oppure li segna come `DA CHIEDERE`.

```yaml
progetto: ""            # es. "Rivalta sul Mincio", "Ing. Dario Donelli"
slug_portfolio: ""      # es. "rivalta-sul-mincio", "dario-donelli" (non cambia)
url_produzione: ""      # es. "https://www.rivaltasulmincio.it"
cliente: ""             # es. "Progetto indipendente", "Ing. Dario Donelli"
note: ""                # cosa è cambiato rispetto alla versione precedente, se lo sai
```

---

## ISTRUZIONI PER CLAUDE (nel repo del progetto)

Stai lavorando nel repository di un sito web che Alberto Pecchini ha progettato
e sviluppato. Devi produrre una scheda con i dati per il suo portfolio. **Non
modificare nessun file del repo**: l'unico file che scrivi è `PORTFOLIO_SCHEDA.md`
nella radice.

### Regole

- **Solo fatti verificabili.** Ogni numero, tecnologia o funzione deve avere
  accanto il file da cui l'hai ricavato (`percorso/file.ext:riga`, dove ha senso).
- **Niente invenzioni.** Non inventare clienti, referenze, numeri di visite,
  risultati commerciali o premi. Quello che il repo non dice va segnato come
  `DA CHIEDERE`, con una domanda precisa.
- **Stato reale, non storico.** Descrivi il sito com'è oggi sul ramo principale.
  Se trovi tracce di una versione precedente (cartelle vecchie, ramo `legacy`,
  commit di riscrittura), riportalo in «Cronologia», ma non mescolare le due versioni.
- **Italiano, tono sobrio**, in prima persona singolare quando parli del lavoro
  («ho raccolto», «ho disegnato»). Niente linguaggio da agenzia («soluzioni
  innovative», «esperienza unica»). Apostrofo tipografico ’ e virgolette «».
- Leggi almeno questi file, se ci sono: `package.json`, `README*`, la configurazione
  del framework (`next.config.*`, `vite.config.*`, `astro.config.*`, …),
  `tailwind.config.*`, i CSS globali e le variabili, le rotte e le pagine, i file
  di contenuto o dati (`content/`, `data/`, `*.json`, `*.md`), `vercel.json`,
  sitemap, robots, metadati SEO, le note legali e il footer, `git log`.

### Cosa scrivere in `PORTFOLIO_SCHEDA.md`

Usa esattamente queste sezioni, in questo ordine.

#### 1. Identità del progetto

| Campo | Valore | Fonte |
|---|---|---|
| Nome del sito | | |
| URL di produzione / dominio canonico | | (canonical, `metadataBase`, sitemap, `vercel.json`, README) |
| Domini alternativi o provvisori | | es. `*.vercel.app` |
| Committente | | note legali, footer, privacy, oppure `DA CHIEDERE` |
| Settore | | |
| Luogo | | |
| Anno | | anno del primo commit della versione attuale e dell'ultimo |
| Lingue del sito | | |

#### 2. Tecnologie

- L'elenco completo delle dipendenze **rilevanti**, con la versione: framework,
  linguaggio, stile, animazioni, mappe, grafici, form, analytics, CMS e hosting.
  Tralascia le dipendenze di servizio (linter, tipi, polyfill).
- **Proposta per il portfolio**: le 5–6 tecnologie da mostrare, in ordine di peso.
  Esempio di formato: `Next.js, TypeScript, Tailwind CSS, GSAP, OpenStreetMap, Vercel`.

#### 3. Struttura e funzioni

- L'elenco di tutte le pagine o sezioni, con la rotta e l'etichetta che compare nel menù.
- Il numero totale di sezioni o pagine, precisando cosa hai contato.
- Le funzioni degne di nota, ognuna con il file in cui è implementata: ricerca,
  mappe, dati in tempo reale, modulo di contatto, tema scuro, animazioni allo
  scorrimento, pagine evento, multilingua, accessibilità, prestazioni, SEO, dati
  strutturati, assenza di cookie o banner.
- Le fonti dei dati, se il sito ne usa di esterne: OpenStreetMap, API, open data,
  stampa.

#### 4. Identità visiva

- **Palette**: i 5 colori principali in HEX, nell'ordine sfondo, testo, accento 1,
  accento 2, accento 3 (o secondo il criterio che il progetto rende evidente), con
  il nome della variabile o del token e il file.
- **Caratteri**: la famiglia di ogni ruolo (titoli, testo, dettagli) e come vengono
  caricati.
- **Immagini**: fotografie, illustrazioni, icone, mappe. Da dove vengono e se sono
  state fatte apposta.
- Il concetto visivo, se il repo lo documenta (README, commenti, nomi dei token):
  riportalo con parole tue in 2–3 righe.

#### 5. Numeri verificabili

Almeno sei numeri candidati, ricavabili dal repo, con il modo in cui li hai
calcolati. Esempi: sezioni, pagine generate, voci di dati (edifici, strade,
eventi, prestazioni), immagini, componenti, cookie di profilazione (0?), peso
della pagina, punteggio Lighthouse se c'è un report.

| Valore | Etichetta (max 4 parole) | Come l'hai calcolato | Fonte |
|---|---|---|---|

Poi indica i **3 numeri più forti** per il portfolio. Scegli quelli che dicono
qualcosa del lavoro, non i numeri gonfiati.

#### 6. Cosa dice il sito di sé

Cita testualmente, tra virgolette, il testo dell'hero, il sottotitolo, l'eventuale
pagina «chi siamo» o «progetto», la descrizione nei metadati SEO. Servono per non
tradire il tono del sito nella scheda.

#### 7. Bozze dei testi della scheda

Sono proposte da rivedere e vanno scritte a partire dalle sezioni 1–6. Rispetta
le lunghezze indicate.

```js
subtitle: '',        // 4–9 parole, un'immagine del progetto, senza punto finale
types: [],           // 3–4 tra: 'Sito web', 'UI/UX', 'Sviluppo frontend', 'Identità visiva', 'Dati aperti', 'Responsive', …
sector: '',
services: [],        // 4–5 voci, cosa ho fatto io (es. 'Architettura dei contenuti', 'Web design', 'Sviluppo frontend')
technologies: [],    // dalla sezione 2
summary: '',         // 1–2 frasi, ~200 caratteri: la card nell'elenco dei progetti
description: '',     // 2–3 frasi: il contesto, chi è il committente o cos'è il luogo
goal: '',            // 1 frase: a chi serve il sito e per fare cosa
problem: '',         // 2 frasi: la difficoltà vera del progetto
strategy: '',        // 2–3 frasi: l'idea che ha risolto il problema
development: [       // esattamente 3 blocchi, titolo di una parola
  { title: '', text: '' },
  { title: '', text: '' },
  { title: '', text: '' },
],
result: '',          // 1–2 frasi, senza promettere risultati non misurati
metrics: [           // i 3 numeri scelti nella sezione 5
  { value: '', label: '' },
  { value: '', label: '' },
  { value: '', label: '' },
],
palette: [],         // i 5 HEX della sezione 4
```

E, per il curriculum e la cronologia dello studio:

```js
// studio.js — voce del CV
title: '',           // es. 'Rivalta sul Mincio — dossier informativo del paese'
role: '',            // es. 'Progetto, design e sviluppo · Next.js, TypeScript, GSAP'
detail: [],          // 1–3 frasi brevi, concrete
```

#### 8. Note per gli screenshot

Gli screenshot li scatto dal sito pubblicato: desktop 1440×900, tablet 820×1180,
smartphone 390×844 @2x, più la pagina intera su desktop e su smartphone. Mi serve
sapere:

- l'URL da fotografare, se non è quello di produzione;
- il comando e la porta per avviarlo in locale, se non è online;
- le animazioni d'ingresso o le classi che nascondono i contenuti prima dello
  scorrimento (`.reveal`, `opacity: 0`, IntersectionObserver…), con il file;
- gli hero a scorrimento lungo (`300vh`, `animation-timeline`, pinning con GSAP);
- gli elementi `position: fixed` o `sticky` da nascondere nella pagina intera
  (testata, barra di avanzamento, pulsanti flottanti);
- le immagini con `loading="lazy"` o caricate in modo differito;
- i banner di cookie o i popup che coprono la pagina;
- se il sito cambia aspetto in base a stagione, ora o tema del sistema, e quale
  variante conviene fotografare;
- altre 1–2 pagine interne che vale la pena mostrare oltre alla home, e perché.

#### 9. Cronologia

- La data del primo e dell'ultimo commit e il numero di commit (`git log`).
- Le fasi principali, ricavate dai messaggi di commit: 3–6 righe con la data.
- Se il sito è stato riscritto da zero: quando, e cosa è cambiato di sostanza
  (stack, struttura, identità).

#### 10. Domande aperte

L'elenco numerato di tutto ciò che è segnato `DA CHIEDERE`. Ogni voce è una
domanda chiusa, a cui si risponde in una riga.
