# La regia di Claude

La finestra dove Alberto vede quello che Claude sta facendo, in qualsiasi lavoro. È nata il
3 novembre 2026 come cruscotto della macchina del tempo; poi Alberto: «mostra quel cmd e impara
per qualsiasi task di aprirlo, poi mentre che è aperto tu lavora per migliorarlo al massimo per
i miei bisogni».

```sh
powershell -File tools\cruscotto\cruscotto.ps1   # la apre al centro del 24", o la riporta davanti
node tools/cruscotto/diretta.mjs "testo"         # la nota di Claude
node tools/cruscotto/diretta.mjs --piano "a|b|c" # i passi del lavoro
node tools/cruscotto/diretta.mjs --passo 2       # il passo in corso (--passo fine)
node tools/cruscotto/diretta.mjs --barra id "Nome" 3 10 "testo"   # una barra qualsiasi
node tools/cruscotto/diretta.mjs --log "testo"   # una riga nel log
```

## Cosa mostra

Dall'alto:

- lo stato: **LAVORA** (verde), **TOCCA A TE** (giallo, ha finito il turno), **TI ASPETTA**
  (rosso, un permesso o una domanda); il progetto e il ramo;
- la richiesta di Alberto, la nota di Claude, lo strumento in corso con da quanto;
- il piano dei passi, con quello in corso;
- le barre: i download, i siti della macchina del tempo, le barre di qualsiasi lavoro;
- sistema (CPU, RAM, dischi), server di casa (pzkko 8787, regia 8788, tempo 8789, Vite 5173) e
  il sito pubblico, git (ramo, avanti e indietro, file cambiati, ultimo commit), la sessione
  (quanti strumenti e quali, gli ultimi file toccati, gli errori);
- il log in diretta.

Suona quando Claude ha finito il turno o aspetta. Tasti: `a` tutto, `c` solo Claude, `l` solo i
lavori, `e` solo gli errori, `p` pausa, `↑` `↓` (e pagina su/giù) per scorrere, `x` toglie le
barre dei lavori finiti, `q` esce. Un clic dentro non la blocca più (la «modifica rapida» è spenta).

## Come funziona

- `diretta.mjs`: chi lavora scrive in `C:\Users\Alberto\.cruscotto` (`CRUSCOTTO` per un'altra
  cartella): `stati/<chi>.json`, `log.txt` (oltre 4 MB ricomincia, il vecchio in `log-1.txt`),
  `piano.json`, `claude.json`, `finestra.json`. Scritture atomiche.
- `gancio.mjs`: lo lanciano i ganci di Claude Code in `~/.claude/settings.json` (a livello
  utente, quindi in qualsiasi progetto), in background: `SessionStart` e `UserPromptSubmit`
  aprono la regia se è chiusa (via WMI, `Win32_Process.Create`: un figlio del gancio moriva con
  lui) e scrivono la richiesta; `PreToolUse` lo strumento in corso; `PostToolUseFailure` gli
  errori; `Notification` e `Stop` lo stato e il suono. Non blocca mai e esce sempre con 0
  (`CRUSCOTTO_DEBUG=1` per vedere gli errori).
- `cruscotto.mjs`: il guscio (tasti, battito ogni secondo in `finestra.json`, misure del pc, dei
  server, di git e del sito); `vista.mjs`: il disegno, che il guscio ricarica da solo quando il
  file cambia: la regia si migliora mentre è aperta.
- `cruscotto.ps1`: trova lo schermo con la diagonale più vicina ai 24 pollici (dalle misure EDID
  del monitor), apre `conhost` con `cmd` e `node`, la centra, spegne la modifica rapida; se la
  regia è già aperta la riporta davanti. `-Nuova` ne apre un'altra.

Solo simboli che Consolas ha davvero (√ × ● • ∙ ► █ ░): ✓ e i puntini braille uscivano come
quadratini. La macchina del tempo (`tools/tempo/diretta.mjs`, `cruscotto.*`) usa questa.
