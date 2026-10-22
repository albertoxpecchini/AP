# Handoff — la chat col bot dei $pzk (pzkko.it)

22.10.2026, dal PC di casa/ufficio al Victus. **Nessun codice scritto ancora**: questa sessione ha solo letto il codice e
preparato il piano. Da cancellare quando la chat è online (il repo è pubblico, gli handoff vecchi sono stati tolti).

## La richiesta di Alberto (testuale)

> sotto il portafoglio c'è un tasto chat, parli con un bot, quasi uguale a dank memer. puoi lavorare, pescare, cacciare,
> scommettere nei miei giochi con solo dei comandi, dei quiz da rispondere dopo pochi secondi, delle parole da riscrivere
> velocemente. studiati le funzioni di dank memer, prendi spunto. tutto italiano. comando pzk sottinteso perché sei in
> una chat bot solo con lui. usa replicate per loghi e simbolini. le emoji non sono quelle di sistema ma usa quelle
> fatte da te.

Quindi: il tasto **non esiste ancora**, va creato sotto `.wallet-tasto`. Si scrive `pesca`, non `pzk pesca` (ma
accettare anche `pzk pesca` e `/pesca`). Niente emoji di sistema da nessuna parte nella chat: solo icone nostre.

## Cosa c'è già (letto in questa sessione)

**I soldi — `albertopecchini.it/pzkko/games/pzk.js`** (lo usano tutti i giochi e il wallet):
- `saldo()`, `punta(gioco, n)`, `ritira(gioco, n)`, `regola(gioco, giocato, torna)`, `aSecco()`, `ricarica()`,
  `perche()`, `ascolta(fn)`, `osserva(fn)`, `fmt`, `fmtEur`, `conto()`, `token()`, `euro()`, `invia(ind, n)`,
  `apriWallet(sezione)`, `oggi()` (giorno di Mantova).
- Due modi: **sessione** (1.000 $pzk in sessionStorage, non si salvano) e **conto** (nome + PIN, salvato su Vercel Blob).
- Per dare $pzk dalla chat (lavoro, pesca, vendite): `regola('chat', 0, n)` aggiunge n al saldo e lo salva da solo.
  Meglio aggiungere a pzk.js un `guadagna(n)` esplicito. Per le scommesse: `punta('chat-roulette', n)` → `regola(...)`.
- Il server (`pzkko/api/wallet.mjs`, `accogli`) si fida del saldo che manda il browser ma rifiuta salti oltre
  `20000 + 1200 × secondi dall'ultimo salvataggio`: le paghe della chat devono stare molto sotto.

**Il wallet — `pzkko/wallet/wallet.js` + `wallet.css`**: estetica Pip-Boy/Fallout, led verdi `#46ff7d`, ambra
`#ffb02e`, carta crema coi font Anton / Special Elite / Permanent Marker. Il tasto in alto a sinistra:
- CSS in `pzkko/index.html` righe ~353–372 (`.wallet-tasto`, fixed top-left, 112×52, 96×46 sotto 900px).
- HTML riga ~779. Loader righe ~1176–1193: il modulo si carica in `requestIdleCallback`, nascosto se
  `navigator.webdriver` salvo `?wallet`, `#wallet` lo apre. **La chat deve copiare questo schema** (`?chat`, `#chat`,
  evento `pzkko-chat`, modulo `/chat/chat.js` + `/chat/chat.css` caricati pigri).

**L'archivio — `pzkko/api/_archivio.mjs`**: un JSON privato per funzione su Vercel Blob, scritto con `ifMatch`
sull'ETag (`aggiorna(store, cambia)` riprova da solo). In locale (`npm run dev:pzkko`) sta in memoria.
- `corpo(req, max = 4 KB)`: per salvare lo zaino serve alzarlo (es. 16 KB) solo per quell'azione.
- Le funzioni stanno in `pzkko/api/*.mjs` e sono ripubblicate da `albertopecchini.it/api/*.js` (una riga di
  re-export). Oggi in `albertopecchini.it/api/` ci sono **7 funzioni**: se il piano Vercel è Hobby il limite è 12.
  Proposta: niente funzione nuova, aggiungere l'azione `zaino` a `wallet.mjs` ma con **un file Blob separato**
  (`pzkko/chat.json`, `{ [idConto]: zaino }`) per non gonfiare `wallet.json` (che si riscrive a ogni salvataggio).

**I giochi da usare via comando** (le regole sono già separate dalla grafica):
- `games/roulette/regole.js`: `PUNTATE`, `PUNTATE_PER_ID`, `esito(giocate, numero)`, `PAGA`.
- `games/blackjack/regole.js`: `Tavolo`, `sabot`, `punti`, `LIMITI` (5–1000), side bet `PAGA_PP`, `PAGA_T3`.
- `games/mine/regole.js`: `Partita` (provably fair con semi HMAC), `vincita`, `LATO` 5, `MINE` 1–24, `LIMITI` 1–1000.
- `games/dado/regole.js`: `REGOLE` per variante, `PUNTATE`, `PER_ID`, `esito(giocate, dadi, R)`, `leggi(dadi)` —
  da leggere per capire le puntate prima di farne il comando.
- `games/moneta/`: la fisica è in `lancio.js`; per la chat basta testa/croce 50/50 con `crypto.getRandomValues`.

**Replicate**: `albertopecchini.it/tools/replicate.mjs` (gpt-image-2, qualità sempre high, `predict`, `salva`,
`upload`) e `tools/pzkko/immagini.mjs` + `tools/pzkko/fogli.js`: un «foglio» = N pezzi in griglia su magenta pieno,
poi `node tools/pzkko/immagini.mjs genera <foglio>` e `usa <foglio> <file.png>` scontorna e scrive
`pzkko/art/<foglio>/<nome>.webp` + `art/pezzi.json`. Prompt in inglese, niente magenta/rosa/viola sui pezzi.
**Su questo PC il token non c'è** (`.env.local` ha solo `PZKKO_ADMIN_KEY`, niente `REPLICATE_API_TOKEN`
nell'ambiente): controllare sul Victus.

## Dank Memer → pzk: il piano

Dank Memer (bot Discord): comandi economici con cooldown, oggetti che sbloccano attività, minigiochi a tempo con
pulsanti, lavori con livello minimo, morte che fa perdere i soldi del portafoglio (non della banca), eventi casuali.
Qui la «banca» sono gli EUR€ del wallet: morire fa perdere i $pzk liberi (una parte), non gli EUR€.

### Il bot
Si chiama **pzk**; avatar: la chiocciola della banca $pzk (è sulle banconote e nel favicon) con gli occhiali da sole.
Risponde con «embed» stile Discord: barra colorata, titolo, testo, campi, piè di pagina, riga di pulsanti.

### Comandi (alias fra parentesi)
| comando | cosa | attesa |
|---|---|---|
| `aiuto` (help, comandi) | elenco per categorie, `aiuto pesca` spiega un comando | — |
| `saldo` (bal, soldi) | $pzk, EUR€, livello, moltiplicatore | — |
| `giornaliero` (daily) / `settimanale` / `mensile` | premio + serie di giorni di fila | 24h / 7g / 30g |
| `elemosina` (beg) | un personaggio di Mantova/del muro ti dà 0–150 $pzk, un oggetto o una risposta acida | 30s |
| `cerca` (search) | tre posti a caso fra ~25 (fontana di piazza Sordello, cassonetto, divano della nonna, parcheggio unimore…), qualcuno uccide | 30s |
| `crimine` (crime) | tre crimini, più rischio più paga | 45s |
| `altobasso` (hl) | numero 1–100 come indizio: più alto / più basso / jackpot | 20s |
| `posta` (postmemes) | serve il telefono: piattaforma + tipo di meme → like → $pzk | 40s |
| `scava` (dig) | serve la pala: vermi, formiche, monete di Virgilio, anfora dei Gonzaga | 40s |
| `pesca` (fish) | serve la canna: nel Mincio (alborella, cavedano, persico, carpa, luccio, pesce gatto, anguilla, gambero killer, siluro, scarpa; leggendaria la carpa d'oro dei Gonzaga). Pesce raro → minigioco «prendilo» | 40s |
| `caccia` (hunt) | serve la fionda/fucile: nutria, piccione, fagiano, lepre, anatra, cinghiale, zanzara tigre; raro il drago del Mincio → minigioco «schiva» | 40s |
| `lavora` | `lavora lista`, `lavora come <mestiere>`, `lavora` (turno), `lavora licenziati` | 1h (forse 20 min) |
| `quiz` (trivia) | 4 risposte, 12 s, facile/media/difficile → 30/60/120 | 30s |
| `veloce` | una parola compare dopo un'attesa a caso: riscrivila, paga in base al tempo | 30s |
| `gratta` | gratta e vinci (si compra), 3×3 da grattare coi clic | — |
| `slot` | tre rulli con le nostre icone | 10s |
| `dadi` (gamble) | tu contro il bot, vince il dado più alto | 10s |
| `roulette <n> <cosa>` | rosso/nero/pari/dispari/1-18/19-36/dozzina 1-3/colonna 1-3/numero | — |
| `blackjack <n>` (bj) | pulsanti carta / stai / raddoppia / dividi | — |
| `mine <n> <mine>` | griglia 5×5 di pulsanti + incassa | — |
| `dado <n> <puntata>` | dalle `PUNTATE` di dado/regole.js | — |
| `moneta <n> testa\|croce` (cf) | | — |
| `zaino` (inv) / `negozio` (shop) / `compra` / `vendi` / `usa` / `info` / `apri` | oggetti e casse | — |
| `profilo` (livello) | xp, livello, mestiere, statistiche | — |
| `attese` (cd) | i cooldown che mancano | — |
| `classifica` (lb) | i conti più ricchi (GET su wallet, solo nomi e $pzk) | — |
| `dai <pzk123456> <n>` | = `pzk.invia` (regola delle 48 ore) | — |

**Lavori** (livello minimo, paga a turno): rider, cameriere alla sagra, barista, bidello a unimore, salumiere,
tatuatore, streamer, sviluppatore web, prof di analisi, influencer, avvocato, sindaco di Mantova.
**Minigiochi del turno** (uno a caso; riuscito = paga intera, sbagliato = una briciola):
riscrivi la frase (niente incolla, testo con caratteri invisibili o su canvas), anagramma, memoria (5 parole per
4 s, poi in ordine), colori (di che colore era la parola X), icona (vista 2 s, poi scegli fra 5), calcio (tira dove
il portiere non c'è), al contrario (la parola rovesciata), quiz del mestiere.
**Eventi casuali**: ogni tanto, dopo un comando, «una banconota vola dalla finestra: scrivi PRENDILA» in 5 s.
**Morte** (cerca/crimine/caccia andati male): perdi il 20 % dei $pzk liberi (max 5.000) se non hai il salvavita
(il cornetto rosso), che si consuma.
**Negozio**: canna da pesca, fionda, pala, telefono, cornetto (salvavita), caffè (−50 % attese per 10 min),
lattina che mette le ali (moltiplicatore +10 % per 30 min, vedi il manifesto della chiocciola), mortadella (xp ×2),
gratta e vinci, tre casse (comune, rara, dei Gonzaga). Pesci, animali e reperti si vendono.

### Stato del giocatore («zaino»)
`{ v:1, xp, livello, mestiere, turni, oggetti:{id:n}, attese:{cmd:ts}, effetti:{id:scade}, serie:{giorno, n}, stat:{…} }`
- Sessione → sessionStorage (coerente coi 1.000 che non si salvano).
- Conto → `api/wallet.mjs` azione `zaino` (leggi senza dati, scrivi con dati; ≤ 8 KB; forma controllata) su
  `pzkko/chat.json`, salvato con debounce come il saldo. Stesso modello di fiducia del saldo.

### Le icone (Replicate)
Fogli nuovi in `tools/pzkko/fogli.js`, griglie 4×4 su magenta, stile coerente (adesivi/disegni a pennarello come il
muro, contorno nero spesso, leggibili a 24–32 px), uscita in `pzkko/art/chat/`. Nel testo del bot: `:canna:` →
`<img class="emo" src="/art/chat/canna.webp" alt="canna">`. Servono ~100 icone:
1. il bot (chiocciola con occhiali: normale, ride, arrabbiata, morta) + il tasto chat (un **cercapersone** con lo
   schermo lcd verde, spento e con «1 msg», così sta col portafoglio Pip-Boy);
2. attrezzi e negozio (16); 3. pesci (12–16); 4. animali (12); 5. reperti dello scavo (8–12);
6. stati/reazioni: $pzk, EUR€, xp, livello, clessidra, teschio, trofeo, regalo, sì, no, fuoco, sirena, lucchetto…;
7. giochi e slot (ciliegia, limone, 7, campana, diamante, chiocciola d'oro…); 8. mestieri (12).
Costo: un'immagine high per foglio, 8–9 fogli.

### File da creare
- `pzkko/chat/chat.js` (pannello, input con suggerimenti dei comandi, cronologia), `chat/chat.css`,
  `chat/comandi/*.js` (un file per famiglia: soldi, attività, lavoro, giochi, negozio), `chat/zaino.js`,
  `chat/testi.js` (battute, personaggi, posti), `chat/minigiochi.js`.
- Tasto in `index.html` sotto `.wallet-tasto` (top ≈ 12 + 52 + 10 px) + loader come il wallet.
- README di pzkko: sezione «La chat col bot».
- Prove: `npm run dev:pzkko` (store in memoria), poi `foto.mjs` come da memoria (Chrome, Intel UHD 630).

## Da decidere con Alberto (se non risponde, vanno bene le proposte sopra)
- Attesa del lavoro: 1 ora come Dank Memer o 20 minuti?
- La morte: 20 % dei $pzk liberi va bene o è troppo cattiva?
- Il tasto: cercapersone con lcd verde (proposta) o altro?

## Se si vuole continuare questa stessa sessione invece di ripartire
Questa conversazione vive sul PC dove è partita. Da lì, `/remote-control` la rende pilotabile da claude.ai/code o
dall'app sul Victus (il PC deve restare acceso). Altrimenti: sul Victus `git pull`, apri Claude Code nel repo e dagli
questo file.
