# La regia di Claude

La finestra dove Alberto vede quello che Claude sta facendo, in qualsiasi lavoro. È nata il
3 novembre 2026 come cruscotto della macchina del tempo; poi Alberto: «mostra quel cmd e impara
per qualsiasi task di aprirlo, poi mentre che è aperto tu lavora per migliorarlo al massimo per
i miei bisogni».

```sh
powershell -File tools\cruscotto\cruscotto.ps1   # la apre al centro del 24", o la riporta davanti
powershell -File tools\cruscotto\cruscotto.ps1 -Riavvia   # la chiude e la riapre (se cambia il guscio)
node tools/cruscotto/diretta.mjs "testo"         # la nota di Claude
node tools/cruscotto/diretta.mjs --piano "a|b|c" # i passi del lavoro
node tools/cruscotto/diretta.mjs --passo 2       # il passo in corso (--passo fine)
node tools/cruscotto/diretta.mjs --barra id "Nome" 3 10 "testo"   # una barra qualsiasi
node tools/cruscotto/diretta.mjs --log "testo"   # una riga nel log
```

## Cosa mostra

Dall'alto:

- lo stato: **LAVORA** (verde), **TOCCA A TE** (giallo, ha finito il turno), **TI ASPETTA**
  (rosso, un permesso o una domanda); il progetto e il ramo; con più sessioni, la sigla di
  quella in cima;
- la richiesta di Alberto, la nota di Claude, lo strumento in corso con da quanto e il numero
  nel turno; a fine turno quanto ci ha messo, con quanti strumenti, e l'inizio della risposta;
- **Altre**: le altre sessioni di Claude aperte (al massimo quattro), ognuna col suo colore:
  progetto, stato, richiesta, cosa sta facendo o cosa ha risposto;
- il piano dei passi, con quello in corso (i fatti si riassumono quando non ci stanno);
- le barre: i download, i siti della macchina del tempo, le barre di qualsiasi lavoro;
- sistema (CPU, RAM, dischi), server di casa (pzkko 8787, regia 8788, tempo 8789, Vite 5173),
  il sito pubblico e il tunnel della macchina del tempo, git (ramo, avanti e indietro, file
  cambiati, ultimo commit), la sessione (quanti strumenti e quali, gli ultimi file toccati, gli
  errori);
- il log in diretta: con più sessioni, ogni riga di Claude ha a sinistra il segno colorato della
  sua.

In cima va la sessione a cui Alberto ha chiesto qualcosa per ultima fra quelle che lavorano (o
aspettano): così non salta a ogni strumento quando ne lavorano due insieme. Se nessuna lavora,
l'ultima che si è mossa.

Suona quando Claude ha finito il turno o aspetta, in qualsiasi sessione. Tasti: `a` tutto, `c`
solo Claude, `l` solo i lavori, `e` solo gli errori, `s` fissa una sessione (e poi la prossima,
e di nuovo tutte: il log mostra solo le sue righe), `p` pausa, `↑` `↓` (e pagina su/giù) per
scorrere, `x` toglie le barre dei lavori finiti e le sessioni chiuse, `q` esce. Un clic dentro
non la blocca più (la «modifica rapida» è spenta).

## Come funziona

- `diretta.mjs`: chi lavora scrive in `C:\Users\Alberto\.cruscotto` (`CRUSCOTTO` per un'altra
  cartella): `stati/<chi>.json`, `log.txt` (oltre 4 MB ricomincia, il vecchio in `log-1.txt`),
  `sessioni/<sigla>.json`, `piano-<sigla>.json`, `finestra.json`. Scritture atomiche. I comandi
  di Claude ereditano `CLAUDE_CODE_SESSION_ID`: la nota (`stati/claude-nota-<sigla>.json`), il
  piano e le righe `claude#<sigla>` del log sono della sessione che li scrive. La sigla sono i
  primi quattro caratteri dell'id della sessione.
- `gancio.mjs`: lo lanciano i ganci di Claude Code in `~/.claude/settings.json` (a livello
  utente, quindi in qualsiasi progetto e in tutte le sessioni aperte), in background:
  `SessionStart` e `UserPromptSubmit` aprono la regia se è chiusa (via WMI,
  `Win32_Process.Create`: un figlio del gancio moriva con lui) e scrivono la richiesta;
  `PreToolUse` lo strumento in corso; `PostToolUseFailure` gli errori; `Notification` lo stato
  e il suono; `Stop` lo stato, il suono, la durata del turno e l'inizio della risposta (dalla
  coda della trascrizione); `SessionEnd` chiude la sessione. Ogni sessione nel suo file, perché
  i ganci arrivano da tutte. Una sessione vista per la prima volta a metà (ganci nuovi,
  compattazione) ripesca la richiesta dalla trascrizione. Le sessioni ferme da tre giorni si
  cancellano. Non blocca mai e esce sempre con 0 (`CRUSCOTTO_DEBUG=1` per vedere gli errori).
- `cruscotto.mjs`: il guscio (il tasto `q`, il battito ogni secondo in `finestra.json`, le misure
  del pc, dei server, di git e dei siti pubblici); `vista.mjs`: il disegno, gli altri tasti e la
  scelta della sessione in cima, che il guscio ricarica da solo quando il file cambia: la regia
  si migliora mentre è aperta. Un cambio del guscio vuole `cruscotto.ps1 -Riavvia`.
- `cruscotto.ps1`: trova lo schermo con la diagonale più vicina ai 24 pollici (dalle misure EDID
  del monitor), apre `conhost` con `cmd` e `node`, la centra, spegne la modifica rapida; se la
  regia è già aperta la riporta davanti. `-Nuova` ne apre un'altra, `-Riavvia` chiude quella che
  c'è e la riapre.

Per fotografarla (per controllare il disegno) si usa `PrintWindow` sulla finestra «Regia di
Claude», mai una foto dello schermo: Windows non lascia portare davanti una finestra mentre
Alberto ne usa un'altra, e la foto dello schermo prendeva quella.

Solo simboli che Consolas ha davvero (√ × ● • ∙ ► █ ░): ✓ e i puntini braille uscivano come
quadratini. La macchina del tempo (`tools/tempo/diretta.mjs`, `cruscotto.*`) usa questa.
