---
name: lezione
description: Segue una lezione universitaria di Alberto in diretta con il tool Lezioni (albertopecchini.it/tools/lezioni) — registra audio e schermo di Teams, trascrive con Whisper sincronizzato, legge le formule della lavagna a giri di ~2 minuti e a fine lezione scrive gli appunti e li impagina in PDF. Usala quando Alberto scrive «lezione», «c'è lezione», «guarda la lezione», «ha finito», «appunti» o chiede gli appunti di una lezione.
---

# Lezione → grezzo sincronizzato → appunti PDF

Il tool è `albertopecchini.it/tools/lezioni/` (leggi il suo README.md: c'è tutto). Python e
librerie in `%LOCALAPPDATA%\Lezioni\venv` (`$py` qui sotto), la lezione in corso in
`%LOCALAPPDATA%\Lezioni\corrente.txt`, le lezioni in `Documenti\Lezioni\AAAA-MM-GG`.
Lezione di riferimento completa, da imitare: `Documenti\Lezioni\2026-10-21\` (`grezzo.md`,
`ocr\`, `appunti\appunti.md` e `appunti\figure\_figure_parte*.py`).

Se Alberto ha premuto «Lezione» da solo, controlla subito `log\trascrivi.log`: il 21.10 alle
14:08 il trascrittore non partiva (bug di `--materia` vuota, corretto) e nessuno se n'è accorto.

**Regola d'oro: registrazione e ascolto non si fermano mai** finché Alberto non dice che è
finita. I guardiani rilanciano registratore e trascrittore; per riavviare il trascrittore
si crea `FERMA_TRASCRIZIONE` nella cartella della lezione (mai uccidere il registratore).

## 1. Avvio (subito, prima di qualunque altra cosa)

- Se `corrente.txt` punta a una cartella con `meta.json` aggiornato da meno di 15 s e
  senza `FINE`, sta già registrando: non rilanciare.
- Altrimenti `powershell -ExecutionPolicy Bypass -File albertopecchini.it\tools\lezioni\lezione.ps1`
  (= il collegamento «Lezione» sul desktop; `-Materia "analisi matematica"` aiuta Whisper).
- Dopo ~30 s: `meta.json` con `audio.livello_db` sopra −60 quando la prof parla e
  `schermo.fotogrammi` che cresce; `log\*.log` se qualcosa non torna; `$py controlla.py`
  per la diagnosi.

## 2. Giri di lettura della lavagna (per tutta la lezione)

1. In background, dalla cartella del tool: `$py aspetta.py <cartella> --minuti 2 --fotogrammi 5 --almeno 60`.
2. Alla notifica: `$py prepara.py <cartella>` → ritagli in `ritagli\` (trova da solo il
   riquadro video di Teams), provini 3×3 in `provini\`, e per ogni fotogramma la frase detta.
3. Guarda i provini; per le formule leggi il ritaglio a piena risoluzione (ingrandisci col
   PIL la zona se serve). Scrivi il file dato da `comune.prossimo_ocr` (`ocr\ocr_NNN.json`):
   lista di `{"frame", "nuovo", "lavagna"}` (LaTeX per KaTeX), `{"frame", "uguale": true}`
   se non c'è niente di nuovo, `{"frame", "salta": true}` per schermate senza lezione. Ogni
   fotogramma in un solo file.
4. `$py componi.py <cartella>`, rilancia `aspetta.py` e scrivi ad Alberto una riga su cosa c'è
   alla lavagna, con la formula chiave.

Se c'è `ANTHROPIC_API_KEY` la lettura la fa già `ocr_claude.py` (lo avvia `lezione.ps1`):
non leggere anche tu, controlla solo che vada (`log\ocr.log`, la barra).

Cose già successe: Teams che si disconnette o dice «non trovo un altoparlante» (nel browser
l'audio passa lo stesso: guarda il livello); browser a schermo intero o chat aperta (il
ritaglio si adatta); telecamera spostata; Whisper che inventa «Grazie…» sul rumore e
storpia i termini («è alla x» = $e^x$, «mepero» = Nepero, «xen» = arcsen). La lavagna fa
fede sulla voce. Il nome della docente: non fidarti dell'account Teams della telecamera.

## 3. Fine lezione

1. `fine.ps1` (= «Fine lezione»): ferma, aspetta la trascrizione, rifà il grezzo; con la
   chiave API scrive anche gli appunti (`appunti_claude.py`).
2. Senza chiave: ultimo giro di lettura finché `aspetta.py` non ha più niente, poi gli
   appunti in `<cartella>\appunti\appunti.md`, **per argomento** come quelli del 21.10:
   regola + esempio svolto passo passo + il perché detto a voce, rimandi `⏱ h:mm:ss`,
   tabelle riassuntive, «Detto a voce», «Errori da non fare», «Prossima lezione»; grafici
   ridisegnati con matplotlib in `appunti\figure\` (copia e adatta `_figure_parte1.py`).
   Se la lezione è lunga o va fatta tutta a registrazione finita (Alberto ha usato i
   collegamenti da solo, come il 21.10 pomeriggio), dividila fra tre aiutanti per pezzi di
   tempo: ognuno legge la lavagna del suo pezzo (`ocr\ocr_pK_NNN.json`, provini `pK_*`,
   usando le funzioni `prepara.ritaglia`/`prepara.provino`, mai `prepara.py` intero) e scrive
   `appunti\parte_K.md` (solo sezioni «## »); poi `$py unisci.py <cartella> --titolo "…"`.
3. `$py impagina.py "<cartella>\appunti\appunti.md"` → HTML e PDF A4. Controlla le pagine
   (PyMuPDF non è nel venv: `uv pip install pymupdf` in un venv di lavoro, o guarda l'HTML),
   poi apri il PDF con `Start-Process`.
4. Se la riunione era già iniziata quando è partita la registrazione, ricordalo: Teams la
   registra, e dalla registrazione ufficiale si recupera l'inizio.
