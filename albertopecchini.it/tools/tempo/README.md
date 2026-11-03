# La macchina del tempo

La pagina `/tempo/` è una copia della Wayback Machine: la barra in cima con l'istogramma
dei commit per giorno e le frecce fra una cattura e l'altra, sotto il sito com'era quel
giorno. Dal 3 novembre 2026 i siti sono cinque, scelti col selettore nella barra (al posto
del campo dell'indirizzo), ognuno col suo repository:

| id | sito | repository | ramo / linea | dal |
|---|---|---|---|---|
| `ap` | albertopecchini.it | ygpzk/AP (fuori pzkko e BCP) | HEAD | 24.5.2026 |
| `rivalta` | rivaltasulmincio.it | ygpzk/rivaltasulmincio | main, `--first-parent` | 9.5.2026 |
| `cascina` | cascinafontana.xyz | ygpzk/cascinafontana | tutti i rami (`--all`) | 16.4.2026 |
| `pzkko` | pzkko.it | ygpzk/AP, `albertopecchini.it/pzkko` | HEAD | 7.10.2026 |
| `bcp` | bettercallpekko.it | ygpzk/AP, lo stesso Vite con `SITE=bcp` | HEAD | 28.9.2026 |

Le definizioni stanno in `siti.mjs`. Cascina Fontana ha `main` che ricomincia da zero il 16
luglio 2026: i commit di aprile e maggio (il sito statico, Next.js, il «RESET») vivono solo
sui rami di allora, quindi si prendono tutti i rami e di ogni giorno vince il commit più recente.

```sh
node tools/tempo/giro.mjs                  # tutto: scarica, ripassa, versioni, foto, prova
powershell -File tools\tempo\cruscotto.ps1 # la finestra coi progressi, al centro dello schermo da 24"

node tools/tempo/scarica.mjs               # la storia intera dei repository (barre di download nel cruscotto)
node tools/tempo/tempo.mjs                 # tutti i siti: prima le versioni che mancano, poi le foto
node tools/tempo/tempo.mjs --sito=rivalta  # un sito (anche più, separati da virgola)
node tools/tempo/tempo.mjs --fase=versioni # solo ricostruire e depositare
node tools/tempo/tempo.mjs --fase=foto     # solo le foto, dal deposito
node tools/tempo/tempo.mjs --forza         # rifà anche quello che c'è già
node tools/tempo/tempo.mjs --solo=<sha>    # una versione sola (più sha separati da virgola)
node tools/tempo/tempo.mjs --da=2026-09-01 # solo da quel giorno in poi
node tools/tempo/tempo.mjs --limite=5      # al massimo cinque versioni per sito
node tools/tempo/tempo.mjs --manifesto     # riscrive solo i manifesti e le statistiche
node tools/tempo/tempo.mjs --corte         # rifà le foto rimaste al primo schermo (alte 600 px)
node tools/tempo/tempo.mjs --ripassa       # riapplica le regole del deposito, senza ricompilare
node tools/tempo/prova.mjs                 # apre ogni versione depositata come dal tunnel
node tools/tempo/diretta.mjs "testo"       # la nota in cima al cruscotto
```

Il deposito è `C:\pzkko-server\tempo` se non si dice `--deposito=<cartella>`.

## Il giro, nell'ordine

Alberto, 3.11.2026: «prima tutti i commit scaricati in locale e per ultimo le foto anteprime
fatte bene». `giro.mjs` fa:

1. **Lo scarico** (`scarica.mjs`): Rivalta e Cascina diventano copie `mirror` in
   `lavoro/repo/<id>.git` (tutti i rami, tutti i commit), AP fa `git fetch`.
2. **Il ripasso** delle versioni di albertopecchini.it già depositate: le regole nuove senza
   ricompilare.
3. **Le versioni**: un processo per sito, tutti insieme. Ognuno ha la sua cartella di lavoro
   (`lavoro/<id>/`) e il suo manifesto, così non si pestano i piedi.
4. **Le foto**, solo quando tutte le versioni sono depositate: dal deposito, come le vede il
   pubblico.
5. **La prova** (`prova.mjs`).

Ogni processo scrive lo stato in `lavoro/diretta/<chi>.json` e le righe in
`lavoro/diretta/log.txt` (`diretta.mjs`); il cruscotto (`cruscotto.mjs`) li ridisegna quattro
volte al secondo: la nota di Claude, le barre dei download, una barra per sito con la
versione in corso e il passo (git archive, npm ci, build, raccolgo, deposito, foto), il
totale con la fine stimata, il log in diretta. `cruscotto.ps1` apre il cmd al centro dello
schermo che dichiara la diagonale più vicina ai 24 pollici (l'HP 24f, `\\.\DISPLAY2`) e
spegne la modifica rapida, che a un clic congelava il disegno.

## Come si ricostruisce un giorno

L'ultimo commit di ogni giorno (ora italiana) sulla linea del sito, fuori da quello che
produce la macchina stessa (foto, manifesti, `tools/tempo`): altrimenti ogni aggiornamento
delle foto diventerebbe il «giorno di oggi» da rifotografare. Poi `git archive` del commit
nella cartella di lavoro (le dipendenze restano se `package-lock.json` non è cambiato) e,
secondo com'era fatto il sito quel giorno:

- **build**: c'è lo script `build` → `npm ci` (se il lock di allora non va più d'accordo,
  `npm install`), `npm run build`, la cartella `dist` (o `build`, `out`, `_site`). BCP con
  `SITE=bcp`. Se la build di allora non va più ma c'è un `index.html` vero in cima, si serve
  quello e la versione lo dice in una nota.
- **statico**: niente build ma un `index.html` che non è il sorgente di Vite (Cascina ad
  aprile, Rivalta ad agosto, pzkko sempre): la cartella così com'era, senza documenti, script,
  `package.json` e simili (per pzkko anche `api/`, `server/`, `tools/`).
- **server**: Rivalta dal 9 al 26 maggio 2026 era un `server.js` con le pagine senza
  estensione e le parti incluse. Lo si accende (sulla porta data, o su quella che annuncia:
  a metà maggio era scritta nel codice, 2858) e lo si raccoglie come fa la Wayback Machine:
  Chromium apre la home e le pagine a cui porta (al più 40) e ogni risposta dello stesso
  indirizzo diventa un file, `/node_modules/…` compresi.

Una versione che non si ricostruisce resta nel manifesto col suo errore in una riga che si
legge (quella con `Error:`, senza percorsi del computer): il 18.10.2026 BCP non si compilava
nemmeno su Vercel (`media/mascotte/tartaruga.webp` non c'era ancora), e la pagina lo dice.

## Il deposito per il server di casa

Ogni versione va in `C:\pzkko-server\tempo\versioni\<sha>\` (albertopecchini.it, com'era
prima) o `versioni\<id>\<sha>\` (gli altri), servita a `/tempo/<sha>/` e `/tempo/<id>/<sha>/`.
I file di testo (HTML, CSS, JS, JSON, manifest, SVG, XML) hanno gli indirizzi assoluti
riscritti sulla versione: sempre gli attributi dell'HTML e i `url(/x)` del CSS; le stringhe
del JS solo se il primo pezzo del percorso è un file o una cartella in cima alla versione
(«8.5/10» non diventa «8.5/tempo/540d403/10»); mai un indirizzo che ha già il prefisso. I
binari stanno una volta sola in `store\<hash>` con collegamenti fisici; i documenti (`.md`,
`.sql`) non si depositano. `stato.json` elenca le versioni pronte: `versioni` (quelle di
albertopecchini.it, la pagina di prima legge quella) e `siti.<id>`.

Le regole, tutte ripassabili con `--ripassa`:

- **La riservatezza** (`C:\pzkko-server\tempo\privato.mjs`, fuori da GitHub perché contiene
  quello che nasconde): via l'indirizzo di casa (resta il paese), i link alle mappe con
  quell'indirizzo, le coordinate della cascina (diventano il centro di Rodigo), il fisso di
  casa, il nome del papà nei modelli delle email; il cellulare che non è più pubblicato
  diventa quello di oggi. L'ambulatorio pubblico di Rivalta (1A) non si tocca. Le foto si
  fanno dal deposito, quindi sono pulite anche loro.
- **Lo scudo** in cima a ogni pagina: niente service worker; archivio in sola lettura (niente
  POST, PUT, DELETE, moduli inviati, `sendBeacon`, verso nessun server: i moduli di contatto,
  le iscrizioni, Supabase e Vercel Blob restano in pace); le richieste costruite dal JS a
  indirizzi assoluti dello stesso server finiscono dentro la versione.
- **Alla radice**: le app a pagina singola col router (React Router; albertopecchini.it dal
  24.5 al 17.9.2026) sotto `/tempo/<sha>/` non riconoscevano la home e mostravano «non
  trovata». Se il `package.json` di allora ha un router, uno script a fondo pagina toglie il
  prefisso dall'indirizzo prima che l'app parta: l'app crede di stare alla radice, i file
  restano quelli della versione.
- **L'aiutante di Vite** che carica i pezzi a richiesta (`function(t){return"/"+t}`) prende il
  prefisso; **gli script di Vercel** (`/_vercel/…`) si riscrivono e il server risponde vuoto.

Il server (`C:\pzkko-server\tempo\server.mjs`, 127.0.0.1:8789, Funnel di Tailscale sul
percorso `/tempo`) dà la home delle app a pagina singola solo a chi naviga: una `fetch` del JS
di allora (`Sec-Fetch-Dest: empty`) a un'API che non c'è più riceve «non c'è», non una pagina
HTML al posto dei dati.

## Le foto

Dal deposito, servito da un `server.mjs` acceso apposta, con ogni richiesta fuori da
`/tempo/` bloccata come dal tunnel. La pagina si fa scorrere piano fino in fondo (immagini
pigre e animazioni all'ingresso), le immagini pigre si caricano subito, si aspetta che siano
tutte arrivate, poi animazioni e transizioni vanno al loro stato finale e spariscono i
pannelli che coprirebbero (cookie, modali, chat). Tre foto in `public/media/tempo/<id>/`:
`<sha>-d.webp` (1280 px → 960, a tutta altezza fino a 6000), `-m.webp` (390 px a
risoluzione doppia → 390) e `-t.webp` (il primo schermo, 320 px: l'anteprima sopra
l'istogramma).

## Le statistiche e i momenti

I manifesti (`src/data/tempo/<id>.js`, GENERATI; `src/data/tempo.js` li mette in fila) hanno
per ogni versione le statistiche del giorno: commit, ora del primo e dell'ultimo, righe
aggiunte e tolte, file, tipi (feat, fix…), dove (le cartelle), quanti con un assistente,
giorno di lavoro e giorni di fila, e il sito di quel giorno (pagine, file, peso, JS, CSS,
immagini, tempo di build). Per tutto il sito i «momenti»: la griglia settimana × ora, la
serie più lunga, il giorno più intenso, la giornata più lunga, l'ora e il giorno preferiti,
di notte, il più tardi, il più mattiniero, il fine settimana, gli assistenti, le righe. I
commit uno per uno stanno in `public/media/tempo/<id>/commit.json`, che la pagina carica
solo quando si apre «Momenti».

Riservatezza (Alberto: «ripercorrere i momenti di quando committavo senza violare la mia
privacy»): ore e giorni in ora italiana dai commit già pubblici; niente nomi né indirizzi
email di nessuno (dell'autore si guarda solo se era un assistente, per contarlo); dai
messaggi si tolgono indirizzi email, telefoni, percorsi del computer, nomi di macchine di
Tailscale, indirizzi IP e quello che toglie `privato.mjs`.

## La prova

`node tools/tempo/prova.mjs` apre ogni versione depositata di ogni sito come dal tunnel (ogni
richiesta fuori da `/tempo/` bloccata) e dice: errori JavaScript, richieste fallite o fuori
dall'archivio, file che ricevono HTML al posto del loro tipo, pagine vuote o «non trovata»,
dati riservati rimasti. Le richieste ai servizi esterni di allora e le API che non ci sono
più non contano. Se il server di casa non risponde ne accende uno suo. Esce con 1 se
qualcosa non va.

## Quanto ci mette

Il 3.11.2026, da zero per Rivalta, Cascina, pzkko e BCP: le versioni in una decina di minuti
(Rivalta è la più lunga), le foto una ventina (AP, 108 versioni, la più lunga). Le foto
pesano 30–150 KB l'una.
