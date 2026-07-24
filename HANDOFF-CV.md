# Handoff — Sistema CV

Stato al 24 luglio 2026, branch `main`.

Documento in due parti: **A) il contenuto** (tutti i dati del CV) e **B) il sistema**
(pipeline, file, trappole).

---

# Parte A — Contenuto del CV

## A1. Anagrafica e contatti

| Campo | Valore |
|---|---|
| Nome | Alberto Pecchini |
| Ruolo | Designer & Front-end Developer |
| Email | pzkko@yahoo.com |
| Luogo | Mantova, Italia |
| Web | albertopecchini.it |

**Tagline:** «Studente di Costruzioni e gestione del territorio · Front-end Developer ·
Disponibile per web design, sviluppo front-end e branding»

**Nota privacy** — deliberata, documentata in [data.tsx:36-39](src/app/site/data.tsx#L36-L39):
**solo l'email è pubblica.** Telefono e WhatsApp sono stati rimossi dal sito *e* dal CV
per non esporre recapiti diretti. Chi ha bisogno di un contatto diretto lo chiede via email.
**Non reintrodurre numeri di telefono nei JSON del CV.**

**Formula GDPR in calce al PDF:** «Autorizzo il trattamento dei dati personali contenuti
nel presente CV ai sensi del Reg. UE 2016/679 (GDPR) e del D.lgs. 196/2003.»

### Social (footer del sito, non nel PDF)

Da `SOCIALS` in [data.tsx:52](src/app/site/data.tsx#L52) — 16 profili:
Instagram, TikTok, X, YouTube, GitHub, Telegram, Snapchat, Pinterest, Reddit, Twitch,
Spotify, Threads, Steam, Vinted, Subito.it, OpenStreetMap.

Handle ricorrente: `albertoxpecchini` (X: `ygpzk`, Reddit: `yungpzkko`, Twitch: `pzkko`).

## A2. Profilo

> Diplomato CAT (Costruzioni, Ambiente e Territorio) e studente di Costruzioni e gestione
> del territorio all'Università di Modena e Reggio Emilia, front-end developer & designer
> autodidatta. Unisco la formazione tecnica su progettazione e disegno con la passione per
> il web, costruendo interfacce moderne, veloci e curate nei dettagli. Lavoro con React,
> Next.js, TypeScript, Tailwind CSS e animazioni GSAP, con attenzione a user experience,
> tipografia e design minimalista, e integro l'intelligenza artificiale nel mio workflow
> di sviluppo.

## A3. Lingue, patenti, disponibilità

**Lingue** (la frazione disegna la barra nel PDF):
- Italiano — Madrelingua — `1.0`
- Inglese — C1 · IELTS — `0.85`

**Patente:** A1, B
**Alla guida di:** trattori, muletti, moto, furgoni, auto

**Punti di forza:** problem solving, autonomia, coordinamento, affidabilità,
cura del dettaglio, apprendimento rapido

**Disponibilità:** stage e collaborazioni · progetti freelance · lavoro da remoto

**Nel cassetto (wishlist):** «Fondare una mia testata giornalistica: andare sul campo
e raccontare storie vere, senza filtri.»

## A4. Competenze tecniche

| Gruppo | Voci |
|---|---|
| Sviluppo front-end | HTML5, CSS3, JavaScript, TypeScript, React, Next.js, Tailwind CSS, GSAP |
| Design & UX | UI/UX Design, Figma, Design System, Responsive Design, Motion |
| AI & sviluppo assistito | Claude Code, Codex, GitHub Copilot, Gemini |
| Strumenti & Workflow | Git & GitHub, Vite, Vercel, VS Code, PowerShell, Supabase |
| Area tecnica CAT | AutoCAD, cadwork, Topografia, Estimo, Disegno tecnico / CAD, Excel avanzato |
| IT & multimedia | Troubleshooting PC, Windows, Linux Ubuntu, Fotografia commerciale, DaVinci Resolve, Canva |

## A5. Formazione (5 voci)

**2026 — oggi · Università di Modena e Reggio Emilia — Dip. Ingegneria «Enzo Ferrari»**
Corso di Laurea in Costruzioni e gestione del territorio · Tempo pieno.
Immatricolazione in continuità con la formazione CAT. Ammissione tramite **test TOLC-LP
superato nel luglio 2026**.

**2021 — 2026 · I.T.T. «Carlo d'Arco» — Mantova**
Diploma CAT · Costruzioni, Ambiente e Territorio · Classe 5T.
Percorso quinquennale. Materie: progettazione e disegno tecnico (AutoCAD), topografia
e rilievo strumentale, estimo, gestione del cantiere, fisica applicata, inglese tecnico.
Codice scuola **MNTL009017**. Diploma conseguito nel 2026.

**11 — 25 ago 2024 · CES IELTS Test Centre — Dublino, Irlanda**
General English Intensive · 26 lezioni/settimana · Livello C1.
Sede di Dame Court, Dublin 2. Quattro settimane di full immersion su speaking, writing,
reading e listening a livello avanzato. **Esame IELTS superato a fine corso.**
Esplorazione autonoma: Howth, Balbriggan, North Bull Island, Bray, Greystones,
Glendalough, Powerscourt Estate, Galway.
→ PDF allegato: `/attestato-ces-ielts-c1.pdf`

**19 dic 2023 · Corso Sicurezza Lavoratori — Rischio Basso**
Attestato di frequenza · LTO Mantova / FORMA · Regione Lombardia (ATS Val Padana) ·
4 h e-learning. Conforme all'Accordo Stato-Regioni del 21/12/2011 (D.lgs. 81/08, art. 37).
Contenuti: rischio elettrico, cadute dall'alto, microclima e illuminazione, videoterminali,
organizzazione del lavoro e stress lavoro-correlato, primo soccorso, segnaletica,
antincendio ed evacuazione. Rilasciato in qualità di studente.
→ PDF allegato: `/attestato-sicurezza-lavoratori-rischio-basso.pdf`

**2018 — 2021 · Scuola secondaria di primo grado — Mantova**
Istituto Redentore · Fondazione «Casa dello studente B. Contardo Ferrini».
Base in italiano, matematica, storia, scienze, inglese. Diploma con profitto.

## A6. Esperienze & progetti (8 voci)

**2023 — 2026 · PCTO — Caem Group S.p.A., Castellucchio (MN)**
Ufficio tecnico · Reparto legno · AutoCAD 3D, cadwork.
Tre anni di alternanza scuola-lavoro: modellazione 3D di tettoie in AutoCAD, supporto
alla stesura dei preventivi, archiviazione della documentazione tecnica. Strutture in
legno lamellare e X-LAM.

**2019 — oggi · Vendite online — Vinted & Subito**
E-commerce · Fotografia commerciale · Customer care.
Gestione autonoma dell'intero ciclo di vendita: valutazione del prodotto, prezzo di
mercato, fotografia (Canon EOS 4000D e iPhone 16 Pro), pubblicazione, trattativa,
spedizione, gestione feedback. Prima vendita a dicembre 2019, attività sistematica
dall'autunno 2024. Categorie: abbigliamento, collezionabili da film, dispositivi tech
(Apple Watch, Nintendo Switch, Flipper Zero).

**continuativo · Cascina di famiglia — Rivalta sul Mincio**
Collaboratore agricolo · Logistica · Coordinamento operativo.
Cura e manutenzione delle piante (irrigazione, potature di vario tipo e taglia),
trasporto materiali e attrezzature su trattore con rimorchio, raccolta del fieno da
prato stabile, coordinamento delle operazioni con la squadra nei lavori intensivi,
supporto logistico. Gestione autonoma dei mezzi agricoli e problem-solving sul campo.

**22 — 23 mar 2026 · Scrutatore — Sezione 5, Rivalta sul Mincio**
Operazioni elettorali · Comune di Rodigo · Referendum.
Incarico ufficiale alla sezione n. 5. Verifica dell'identità dei votanti, gestione delle
operazioni di voto, scrutinio delle schede, redazione dei verbali e trasmissione dei
risultati. Incarico retribuito, compenso **119,60 €**.

**apr 2026 · Rivalta sul Mincio — Sito web** → `rivaltasulmincio.it`
Web design & sviluppo front-end. *(data precisa: 27 apr 2026)*
Sito istituzionale e turistico. Design editoriale minimalista, tipografia curata, palette
calda, animazioni avanzate con GSAP ScrollTrigger (pinning, stacking, parallax scrubbing).
Bento grid senza gutter, composizione guidata dalle immagini.
Stack: Next.js, TypeScript, GSAP, Tailwind CSS.

**apr 2026 · Cascina Fontana — Sito web** → `cascinafontana.xyz`
Web design & sviluppo front-end. *(data precisa: 20 apr 2026)*
Analisi delle esigenze del cliente, architettura dell'informazione, interfaccia responsive
ottimizzata per presentare prodotti e servizi. Collaborazione diretta con il cliente sui
contenuti. Stack: React, TypeScript, Tailwind CSS.

**2026 · Sito portfolio personale** → `albertopecchini.it`
Design & sviluppo front-end · «dark premium».
Portfolio personale e hub di giochi web. Design system «dark premium», animazioni in
entrata, piena accessibilità. Deploy continuo su Vercel.
Stack: React, TypeScript, Vite, Tailwind CSS, Supabase.
*(Questo repo.)*

**30 giu — 1 lug 2026 · Figurazione — Serie TV «House of Gonzaga»**
Comparsa · Scena tra il pubblico · Piazza Broletto, Mantova.
Girata nel centro storico di Mantova. Comparsa tra il pubblico di una scena notturna
con DJ set, due giorni di riprese, circa 10 ore sul set.

## A7. Esperienze internazionali (2 voci)

**23 lug — 1 ago 2025 · Parigi · Le Havre · Rouen · Étretat — Francia**
Viaggio culturale. Itinerario tra Normandia e Île-de-France: le falesie di Étretat,
la cattedrale gotica di Rouen, il porto storico di Le Havre, musei e quartieri di Parigi.

**26 — 29 dic 2025 · Edimburgo — Scozia, Regno Unito**
Viaggio culturale. La capitale scozzese durante le festività: Old Town, Castello di
Edimburgo, Royal Mile e l'atmosfera dei close storici a Natale.

> Il soggiorno a Dublino (ago 2024) è catalogato sotto **Formazione**, non qui.

## A8. Volontariato & attività extra (3 voci)

**2024 — 2025 · Grest parrocchiale · Parrocchia SS. Donato e Vigilio Martiri**
Animatore volontario · Rivalta sul Mincio · 6 settimane/anno · 2 edizioni.
Due edizioni consecutive (estate 2024 e 2025), dodici settimane in totale. Responsabilità
diretta su gruppi di bambini di età diverse, progettazione e conduzione di giochi,
laboratori e attività educative, gestione delle dinamiche di gruppo, mediazione,
comunicazione con i genitori. **Referente: don Andrea Grandi.**

**estate 2024 · CRED · Scuola Secondaria di Rodigo**
Supporto educativo volontario · Comune di Rodigo · 2 settimane.
Affiancamento agli educatori, gestione dei gruppi, supporto individualizzato agli alunni,
organizzazione del gioco strutturato e libero.

**2024 — 2025 · Festa del Pesce e del Luccio · Associazione Rivaltese**
Volontario logistico · 2 edizioni.
Supporto logistico e organizzativo: allestimento e gestione dei flussi di pubblico.

## A9. Cosa cambia fra le 4 lingue

Struttura **identica** in it/en/fr/de: 8 esperienze, 5 formazione, 2 viaggi, 3 volontariato.
Cambiano solo le stringhe tradotte:

| | it | en | fr | de |
|---|---|---|---|---|
| Ruolo | Designer & Front-end Developer | *(identico)* | Designer & développeur front-end | Designer & Frontend-Entwickler |
| Etichetta email | Email | Email | E-mail | E-Mail |
| Etichetta luogo | Luogo | Location | Lieu | Ort |
| Luogo | Mantova, Italia | Mantova, Italy | Mantova, Italie | Mantova, Italien |
| Lingue | Italiano/Inglese | Italian/English | Italien/Anglais | Italienisch/Englisch |

Email, sito, patenti (A1, B) e livelli lingua (`1.0` / `0.85`) sono identici ovunque.

---

# Parte B — Il sistema

## B1. Le due forme del CV

Il CV esiste in **due forme parallele**, da tenere allineate a mano:

1. **PDF scaricabili** — 4 lingue, generati da JSON con uno script Python.
2. **Timeline HTML** sul sito — sezione "Résumé" della home, dati **hardcoded in TSX**.

Non c'è una singola fonte di verità: vedi §B6.

## B2. Pipeline PDF

| File | Ruolo |
|---|---|
| [scripts/build-cv.py](scripts/build-cv.py) | Generatore: JSON → HTML → PDF via WeasyPrint |
| [scripts/cv-data.it.json](scripts/cv-data.it.json) | Dati IT (fonte principale) |
| [scripts/cv-data.en.json](scripts/cv-data.en.json) | Dati EN |
| [scripts/cv-data.fr.json](scripts/cv-data.fr.json) | Dati FR |
| [scripts/cv-data.de.json](scripts/cv-data.de.json) | Dati DE |
| [public/alberto-pecchini.jpg](public/alberto-pecchini.jpg) | Foto, embeddata come data-URI base64 |

**Output** (~330 KB ciascuno, committati nel repo, non generati in build):

```
public/cv-alberto-pecchini-{it,en,fr,de}.pdf
public/cv-alberto-pecchini.pdf     ← copia identica dell'IT (link storici + /archivio)
```

**Rigenerare:**

```bash
python3 scripts/build-cv.py           # tutte e 4 le lingue
python3 scripts/build-cv.py it en     # solo alcune
```

Requisiti: `weasyprint` e il font **Ubuntu** di sistema (`fc-list | grep Ubuntu`).
Il font viene embeddato e subsettato: senza Ubuntu installato lo script gira lo stesso
ma il PDF esce con un fallback e resa diversa, **senza errori**.

Non c'è uno script npm: `package.json` ha solo `prebuild`/`build`/`dev`/`zips`.
Va lanciato a mano e i PDF vanno committati.

### Schema dei JSON

Lo script assume **tutte** le chiavi presenti — nessuna è opzionale:

- `ui` — etichette tradotte (`profile`, `skills`, `experience`, `education`, `travel`,
  `volunteer`, `langs`, `license`, `canDrive`, `strengths`, `availability`, `wish`,
  `runningTitle`)
- `name`, `role`, `tagline`, `profile`, `wishlist`, `privacy` — stringhe
- `contacts` — array di coppie `[chiave, valore]`
- `languages` — array di triple `[nome, livello, frazione 0–1]`
- `patente`, `guida`, `strengths`, `availability` — array di stringhe (chip/lista)
- `skills` — array di coppie `[etichetta gruppo, [voci...]]`
- `experience`, `education`, `travel`, `volunteer` — array di
  `{period, title, role, desc, link}`

**Solo `experience` mostra il `link`** — le altre sezioni sono renderizzate con
`show_link=False` ([build-cv.py:164-176](scripts/build-cv.py#L164-L176)).

Il testo passa sempre da `esc()`: si può scrivere liberamente `&`, `<`, virgolette.

**Stile:** skin Ubuntu/Yaru identica al sito — crema `#faf8f6`, melanzana `#2c001e`
(fascia intestazione), arancio Yaru `#e95420`. CSS inline in `build_html()`, nessun
foglio separato. A4, paged media, numerazione "pagina / totale" in basso a destra.

## B3. Timeline sul sito

Dati in `const CV = [...]` a [App.tsx:37-140](src/app/App.tsx#L37-L140) — **duplicati**
rispetto ai JSON, **in inglese**, e **più dettagliati**: contengono informazioni che nei
PDF non ci sono (codice scuola MNTL009017, compenso da scrutatore, attrezzatura
fotografica, referente del Grest, itinerari irlandesi).

16 voci = 15 reali + 1 wishlist marcata `wish: true`.

**Ordinamento** ([App.tsx:195-200](src/app/App.tsx#L195-L200)): data decrescente via
`parsePeriodStart(period)`, con le `wish` spinte in fondo. Il parser
([App.tsx:149-170](src/app/App.tsx#L149-L170)) capisce:
- `"ongoing"` → 1900 (in fondo, collaborazione di lunga data)
- `"Summer YYYY"` → 21 giugno
- `"Mon D, YYYY"` / `"Mon D — D, YYYY"` → data esatta
- solo anno → 1° gennaio

**I mesi devono essere in inglese** (`jan`…`dec`): un `period` in italiano non viene
parsato e la voce finisce in posizione sbagliata, in silenzio.

Alcune voci hanno `pdf` + `pdfLabel` → bottone che apre il documento allegato
(i due attestati).

**Link al PDF** ([App.tsx:202](src/app/App.tsx#L202)):

```ts
const CV_PDF = `/cv-alberto-pecchini-${lang}.pdf`;
```

`lang` da [langCore.ts](src/app/i18n/langCore.ts) (`getLang()` + `subscribeLang()`),
tipo `"it" | "en" | "fr" | "de"`. **Il PDF segue la lingua del sito; la timeline resta
sempre in inglese.**

Due bottoni a [App.tsx:465-477](src/app/App.tsx#L465-L477): "View CV" e "Download (PDF)".

**Anteprima** — `openDoc()` a [App.tsx:207](src/app/App.tsx#L207):
- `< 576px` → nuova scheda (il viewer PDF nativo è meno invasivo)
- desktop → modale con `<iframe>` ([App.tsx:566-587](src/app/App.tsx#L566-L587))

**Archivio** — [projects.tsx:169-180](src/app/site/projects.tsx#L169-L180) registra il CV
in `MATERIALS` puntando a `/cv-alberto-pecchini.pdf` (copia IT, senza suffisso lingua),
con `modified: "2026-06-01"` hardcoded per l'ordinamento.

## B4. Serving e header

[vercel.json:44-54](vercel.json#L44-L54) — i PDF hanno header **separati** dal resto:

- `Cache-Control: public, max-age=0, must-revalidate` — sempre rivalidati, così un CV
  aggiornato si vede senza hard-refresh (commit `01b80b9`)
- `frame-ancestors 'self'` + `X-Frame-Options: SAMEORIGIN` — necessari per l'anteprima
  in iframe. La CSP generale usa `frame-ancestors 'none'`, che la bloccherebbe
  (commit `02ce389`)

La regola generale a [vercel.json:20](vercel.json#L20) esclude i `.pdf` con un negative
lookahead: `/((?!.*\.pdf$).*)`. **Se tocchi quella regex, riverifica l'anteprima.**

## B5. Documenti allegati

| File | Dimensione | Collegato a |
|---|---|---|
| `public/attestato-ces-ielts-c1.pdf` | 428 KB | Formazione — Dublino |
| `public/attestato-sicurezza-lavoratori-rischio-basso.pdf` | 155 KB | Formazione — Sicurezza |

Entrambi raggiungibili dalla timeline e dall'archivio.

## B6. Trappole note

**Doppia fonte di verità.** Aggiornare il CV richiede due modifiche scollegate: i JSON in
`scripts/` (PDF) e `const CV` in [App.tsx:37](src/app/App.tsx#L37) (timeline). Niente le
tiene in sync, niente segnala la divergenza. **Già divergono oggi**: la timeline ha
dettagli che i PDF non hanno (§B3).

**La timeline non è tradotta.** È in inglese fissa. Cambiando lingua il PDF cambia, la
timeline no. Il resto della UI passa da `translateDom`.

**Le 4 lingue divergono a mano.** Una voce nuova va replicata in 4 JSON. Nessuna
validazione controlla che abbiano le stesse chiavi o lo stesso numero di voci.

**I mesi della timeline vanno in inglese**, altrimenti l'ordinamento salta in silenzio.

**Date discordanti.** I JSON dicono «apr 2026» per entrambi i siti; la timeline ha le date
precise (Cascina Fontana 20 apr, Rivalta 27 apr). Non è un errore, ma sono due livelli di
precisione diversi da mantenere.

**Riferimento obsoleto.** [WorkflowModal.tsx:96](src/app/site/WorkflowModal.tsx#L96) cita
ancora `build-cv.ps1` (script PowerShell non più esistente). Il
[README.md:131](README.md#L131) è già corretto con `build-cv.py`.

**Il font è una dipendenza silenziosa** (vedi §B2).

**PDF pesanti.** ~1.6 MB totali nel repo; ogni rigenerazione produce 5 file binari nel diff.

**Niente telefono.** Scelta deliberata (§A1): non reintrodurlo.

## B7. Checklist — aggiornare il CV

1. Modifica la voce in `scripts/cv-data.it.json`
2. Replica in `en` / `fr` / `de` (stesse chiavi, stesso numero di voci)
3. `python3 scripts/build-cv.py` — deve stampare 5 righe `OK:`
4. Apri almeno un PDF: controlla che non ci siano interruzioni di pagina brutte
   (le `.entry` hanno `break-inside: avoid`, ma sezioni lunghe possono sfasarsi)
5. Se la voce va anche in timeline: aggiungila a `const CV`
   ([App.tsx:37](src/app/App.tsx#L37)), **in inglese**, con `period` in formato parsabile
6. Se cambia la data del documento in archivio: aggiorna `modified` in
   [projects.tsx](src/app/site/projects.tsx#L173)
7. Commit dei JSON **e** dei 5 PDF insieme
