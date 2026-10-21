# Lezioni — la lezione registrata, trascritta e messa in appunti

Mentre la lezione va su Teams (o qualunque video sullo schermo), Lezioni registra
l'audio del PC e lo schermo, trascrive la voce con Whisper **sincronizzata parola per
parola con le schermate della lavagna**, legge le formule in LaTeX e, a lezione finita,
ne fa degli appunti per argomento in un PDF A4. Gira tutto sul PC: niente cloud, tranne
la lettura della lavagna con Claude se la si accende.

Nato il 21.10.2026 seguendo una lezione di Analisi (limiti di funzione); da lì è
cresciuto fino a questa cartella. Di Alberto Pecchini — pagina pubblica e download su
<https://www.pzkko.it/tools/lezioni/>.

## Installazione

Windows 10 o 11. Una GPU NVIDIA è consigliata (su una RTX 3060 Ti Whisper large-v3
trascrive sei-dieci volte più in fretta di quanto si parla); senza, Whisper gira sulla
CPU con il modello `small`, meno preciso ma al passo. Servono ~5 GB liberi con la GPU, ~1 GB senza.

```powershell
powershell -ExecutionPolicy Bypass -File installa.ps1
```

(oppure tasto destro su `installa.ps1` → *Esegui con PowerShell*). Lo script:

1. prende [uv](https://astral.sh/uv) se non c'è (nella cartella utente, senza permessi da amministratore);
2. crea in `%LOCALAPPDATA%\Lezioni\venv` un Python 3.12 tutto suo con le librerie di
   `requisiti.txt`, e con una GPU NVIDIA anche cuBLAS e cuDNN (`requisiti-gpu.txt`);
3. scarica il modello di Whisper (large-v3 ~3 GB con la GPU, small ~0,5 GB senza);
4. prova GPU, audio e schermi e dice cosa ha trovato;
5. crea `Documenti\Lezioni` e sul desktop i collegamenti **Lezione** e **Fine lezione**.

Il Python di sistema non viene toccato. Rilanciarlo aggiorna le dipendenze. Per togliere
tutto basta cancellare `%LOCALAPPDATA%\Lezioni` e i due collegamenti (le lezioni restano).

## Uso

1. Apri la lezione su Teams sullo schermo che vuoi registrare (con due schermi, quello
   dove c'è la finestra di Teams; Lezioni la trova da solo).
2. **Lezione** (o `lezione.ps1`): partono registratore, trascrittore e la barra.
3. **Fine lezione** (o `fine.ps1`) quando la lezione è finita.

Non mettere in muto Teams e non cambiare uscita audio durante la lezione: si registra
quello che esce dall'uscita predefinita di Windows (cuffie o casse), con il loopback
WASAPI; il volume del PC non conta.

Impostazioni fisse, facoltative, in `%LOCALAPPDATA%\Lezioni\config.json`:

```json
{ "schermo": "auto", "materia": "analisi matematica", "lingua": "it", "cartella": "D:\\Università\\Lezioni" }
```

`schermo` è `auto`, un pezzo del nome del monitor (`"HP 24f"`) o il numero; `materia`
aiuta Whisper coi termini; `cartella` cambia dove vanno le lezioni (anche con la
variabile `LEZIONI_DIR`). Gli stessi valori si passano anche a `lezione.ps1`
(`-Schermo`, `-Materia`, `-Lingua`, `-Cartella`).

## La barra

Un foglio attaccato col nastro a un pezzo di saracinesca, sempre in primo piano sul
bordo sinistro dello schermo principale: rec e durata, livello audio, l'ultima
schermata (la cornice si accende a ogni scatto), «voce −15 s» (trascritta fino a 15
secondi fa), «ocr −2 min» (lavagna letta fino a 2 minuti fa) e l'ultima frase sentita.
Diagnosi in un colpo: `%LOCALAPPDATA%\Lezioni\venv\Scripts\python.exe controlla.py`
(GPU, modello, audio, schermi, Edge, chiave).
Clic sulla linguetta «lezione»: il foglio rientra nel bordo e resta solo la linguetta
col pallino rec; trascinarla la sposta su e giù; doppio clic sul foglio la chiude. Se si
registra proprio lo schermo principale (un solo monitor) parte chiusa, per non finire
nelle schermate. Immagini e caratteri sono quelli di pzkko.it.

## Cosa c'è nella cartella di una lezione

```
Lezioni\2026-10-21\
├─ grezzo.md             voce e lavagna su una linea del tempo, aggiornato mentre si registra
├─ appunti\              appunti.md, appunti.pdf e figure\ (a lezione finita)
├─ audio\c_00000.wav …   l'audio in pezzi da 10 s (il pezzo k comincia a k×10 s)
├─ frames\t_000754.jpg   le schermate, col secondo nel nome; frames.jsonl le elenca
├─ trascrizione.jsonl    una frase per riga, con i tempi di ogni parola
├─ ritagli\  provini\    la lavagna ritagliata e i fogli 3×3 per leggerla
├─ ocr\ocr_000.json …    la lettura della lavagna, a blocchi
├─ meta.json  log\       stato del registratore; i log di ogni processo
├─ claude_costo.json     solo con la chiave API: token e costo di ogni chiamata a Claude
└─ FINE                  c'è quando la registrazione è chiusa
```

Tempi in secondi dall'inizio della registrazione, uguali per voce e schermate: nel grezzo
ogni schermata sta accanto a quello che veniva detto in quel momento, e sotto c'è la sua
lettura in LaTeX.

## Come funziona

- **`registra.py`** — l'audio dal loopback WASAPI (PyAudioWPatch), ricampionato e salvato
  a pezzi; i buchi diventano silenzio, così l'audio resta sull'orologio. Lo schermo (mss)
  si guarda una volta al secondo: si salva una schermata quando la lavagna cambia e si
  ferma, o ogni 20 s se continua a cambiare. Se cade, il guardiano lo rilancia e riprende
  sullo stesso orologio.
- **`trascrivi.py`** — faster-whisper su finestre di ~25 s che si sovrappongono; la frase
  a cavallo si chiude alla pausa migliore, così la voce resta 15–40 s dietro la diretta.
  Il contesto (la coda del parlato) aiuta coi termini; le frasi che Whisper inventa sul
  silenzio o sul rumore («Grazie per la visione», «Grazie.» a catena) vengono scartate.
  Riprende da dove era rimasto se rilanciato; `FERMA_TRASCRIZIONE` lo ferma pulito.
- **`componi.py`** — rifà `grezzo.md` da trascrizione, schermate e letture.
- **`prepara.py`** — per un giro di lettura: ritaglia il riquadro video di Teams (lo trova
  dalla cornice viola; regge al cambio di disposizione, alla chat aperta, allo schermo
  intero) e fa i provini 3×3; **`aspetta.py`** aspetta che ci sia abbastanza da leggere.
- **`barra.py`** — la barra (tkinter).
- **`impagina.py`** — Markdown con `$…$` → HTML con KaTeX → PDF A4 stampato da Edge, coi
  caratteri di albertopecchini.it (Archivo, Instrument Serif, IBM Plex Mono) e il minio
  come solo accento. `` `⏱ 1:05:04` `` diventa l'etichetta del minuto,
  `![didascalia](figure/x.png)` una figura con didascalia.

## La lettura della lavagna e gli appunti

Whisper sente la voce ma non legge la lavagna: per le formule serve un modello che veda.
Due modi:

- **Con Claude Code** (quello di Alberto): nel repository AP c'è la skill `lezione`.
  Scrivendo «lezione» Claude avvia tutto, legge la lavagna a giri di ~2 minuti
  (`aspetta.py` → `prepara.py` → guarda provini e ritagli → `ocr\ocr_NNN.json` →
  `componi.py`) e a fine lezione scrive gli appunti, ridisegna i grafici con matplotlib e
  li impagina. Il formato di `ocr_NNN.json` è una lista di
  `{"frame", "nuovo", "lavagna"}`, `{"frame", "uguale": true}` o `{"frame", "salta": true}`.
- **Automatica, con una chiave API di Anthropic**: con `ANTHROPIC_API_KEY` impostata
  (`setx ANTHROPIC_API_KEY sk-ant-…`, poi riaprire), `lezione.ps1` accende anche
  `ocr_claude.py` e `fine.ps1` lancia `appunti_claude.py`. `ocr_claude.py` legge la
  lavagna a lotti (ogni 2 minuti o 5 schermate nuove): a Claude vanno i provini 3×3, i
  ritagli a piena risoluzione dei momenti in cui la lavagna cambia, la frase detta in quel
  momento e le ultime letture; la risposta è JSON con schema, controllata prima di essere
  scritta. `appunti_claude.py` scrive gli appunti dal grezzo, con i ritagli veri della
  lavagna come figure, e li impagina; non sovrascrive un `appunti.md` scritto da altri
  (scrive `appunti_claude.md`). A pagamento, sull'account della chiave: per una lezione di
  2 h 30 circa 6–7 $ di lettura e 1–1,5 $ di appunti con Claude Opus 5.5 (il predefinito),
  circa la metà con Sonnet 5.5 (`--modello claude-sonnet-5-5`); il conto va in
  `claude_costo.json` nella cartella della lezione. Con la chiave attiva la lavagna non va
  letta anche a mano: si leggerebbero due volte le stesse schermate.

Senza nessuno dei due resta comunque il grezzo: voce trascritta e schermate, in ordine.

## Robustezza

Registratore, trascrittore e lettura hanno ciascuno un guardiano (un PowerShell nascosto)
che li rilancia se si chiudono con un errore; i log vanno in `log\`. Provato il 21.10.2026
su 2 h 27 min di lezione con una disconnessione di Teams, il browser passato a schermo
intero, la telecamera spostata e un crash del trascrittore (ripartito senza perdere audio).
Teams che dice «non trovo un altoparlante» dopo una riconnessione nel browser non ferma
la registrazione: conta il livello audio sulla barra.

## Limiti

- Si registra solo quello che esce dal PC: gli interventi degli studenti in aula si sentono
  se il microfono dell'aula li prende.
- Whisper storpia qualche termine («è alla x» per $e^x$): negli appunti fa fede la lavagna.
- Registra solo le lezioni che hai il diritto di registrare, e tienile per te.

## Licenze

Il codice è di Alberto Pecchini. Dentro ci sono cose di altri, con le loro licenze:
[faster-whisper](https://github.com/SYSTRAN/faster-whisper) e i pesi di
[Whisper](https://github.com/openai/whisper) (MIT), [KaTeX](https://katex.org) (MIT, in
`stile/katex/`), PyAudioWPatch (MIT), mss (MIT), markdown-it-py (MIT), i caratteri
Archivo, Instrument Serif, IBM Plex Mono, Anton, Special Elite e Permanent Marker (SIL Open
Font License 1.1), le immagini della barra da pzkko.it.
