# Prompt — «Virtual», le scommesse sul calcio inventato di pzkko.it

## Il gioco in una frase

Un nuovo gioco di pzkko.it, `games/virtual/`, nella stessa finestra degli altri
(roulette, blackjack, mine, dado, moneta): un campionato di calcio **inventato e
infinito**, una partita sola alla volta, quattro minuti per scommettere e un minuto
di partita animata in uno schermino in stile tamagotchi. Si gioca coi **$pzk** di
`games/pzk.js`: niente soldi veri, mai.

## Prima di scrivere una riga

1. Leggi `pzkko/README.md` per intero, poi apri e studia **almeno due giochi già
   fatti** (consiglio `games/moneta/` e `games/mine/`) e `games/pzk.js`,
   `games/crt.js`/`crt.css`, `wallet/`. Il nuovo gioco deve sembrare nato insieme a
   loro: stessa finestra, stessa apertura dal muro, stesse fiches, stesso modo di
   prendere e restituire i $pzk (sessione da 1.000 o conto del wallet), stesso
   rispetto di `prefers-reduced-motion`, stesso italiano nei commenti e nei testi.
2. Guarda come la home aggancia i giochi (volantino sul muro, apertura della
   finestra, regia) e aggancia `virtual` allo stesso modo.
3. Niente build, niente framework: file statici come il resto di `pzkko/`.

## Il calendario: la partita di ogni minuto, uguale per tutti

- Il tempo è diviso in **cicli di 5 minuti** allineati all'orologio:
  - minuti 0–4 del ciclo: **scommesse aperte** (es. 12:55:00 → 12:58:59);
  - ultimo minuto: **partita in diretta** (12:59:00 → 12:59:59);
  - a 13:00:00 la partita è finita, si paga e si apre la successiva
    (13:00 → 13:04 scommesse, 13:04 → 13:05 partita, e così via all'infinito).
  - Nota per te: «ogni minuto c'è una partita sola» significa che sullo schermo
    c'è sempre **una sola** partita, mai due insieme; il ritmo è 4+1.
- **Tutto è deterministico dall'orario**: l'indice della partita è
  `Math.floor(Date.now() / 300000)`; da quell'indice, con un PRNG seminato
  (stile `regole.js` delle mine, che già decide le mine dal seme), escono
  squadre, quote, meteo e l'intera cronaca minuto per minuto. Così due persone
  sullo stesso sito vedono la **stessa partita** nello stesso momento, chi apre
  il gioco a metà partita la vede dal punto giusto, e un ricaricamento non cambia
  niente. Mostra sempre un conto alla rovescia grande e chiaro («si chiude tra
  2:41», «IN DIRETTA 34'», «FINALE»).
- Le scommesse si accettano solo nella finestra dei 4 minuti; a partita iniziata
  il pulsante si spegne. Le scommesse fatte restano visibili nella schedina e si
  pagano al fischio finale anche se la finestra è stata chiusa (salvale come fanno
  gli altri giochi; se l'utente torna dopo, trova l'esito).

## Le squadre: Serie A e Serie B storpiate

- Tutte le squadre di Serie A e Serie B 2026/27 con **nomi storpiati ma
  riconoscibili** (stile videogioco senza licenza: «Juvenclub», «Inder»,
  «Milano Rossonera», «Napule», «Atalanto», «Fiorentoina», «Mantua»…, inventane
  di divertenti ma non offensivi) e **stemmi originali disegnati da te** in SVG o
  canvas: stessi colori sociali e lo stesso «spirito» (una zebra stilizzata, un
  biscione, un giglio), ma **mai** il logo vero, mai i marchi registrati, mai i
  nomi veri dei giocatori. Cognomi dei giocatori inventati anche quelli.
- Ogni squadra ha: nome storpiato, sigla di 3 lettere, città, colori maglia
  casa/trasferta (le maglie si vedono addosso agli omini in campo), stemma, e una
  **forza** da 1 a 100 presa dalla realtà (le big alte, le neopromosse e le
  squadre di B basse).
- Gli accoppiamenti: casuali dal seme, di solito A contro A o B contro B, ogni
  tanto un incrocio A–B (che dà quote più sbilanciate e più divertenti).

## Le quote: seguono la realtà, i risultati no

Questo è il cuore, rispettalo alla lettera:

- **Le quote seguono la forza reale**: la squadra forte è quotata bassa, quella
  scarsa alta; fattore campo leggero per chi gioca in casa; un pizzico di rumore
  dal seme così due partite uguali non hanno quote identiche.
- **I risultati sono completamente casuali** e **non** dipendono dalla forza: il
  risultato esce da una distribuzione indipendente dalle squadre (gol per
  squadra, per esempio, con una Poisson di media fissa ~1,35 uguale per tutte).
  Quindi la sfavorita vince spesso quanto la favorita: è voluto, è la battuta del
  gioco. Scrivilo in una riga nella schermata delle regole («le quote copiano la
  Serie A vera, i risultati no»).
- Le quote devono comunque essere **proporzionate e credibili** come quelle di un
  bookmaker: calcola le probabilità implicite dalla forza, applica un margine
  (~6–8%), arrotonda a due decimali, mai sotto 1,05, coerenti tra loro (1 X 2 che
  sommano a ~106%, Over e Under della stessa soglia complementari).

### Le scommesse possibili

Solo queste, niente altro:

- **1 X 2** (esito finale).
- **Over / Under** sul totale dei gol con soglie **1,5 · 2,5 · 3,5 · 4,5**
  (le «maggiore/minore di 2, 3, 4…» della richiesta originale: le soglie a mezzo
  gol evitano il pareggio della scommessa).

Si possono mettere più puntate sulla stessa partita (anche 1 e Over 2,5 insieme),
con le fiches dei $pzk come negli altri giochi; vincita = puntata × quota.
Schedina chiara: cosa hai giocato, quota, possibile vincita, esito.

## La partita: un minuto di schermino tamagotchi

Uno **schermino LCD/pixel** (canvas, rendering `image-rendering: pixelated`,
palette ridotta, animazioni a pochi fotogrammi, «clean da tamagotchi»: carino,
leggibile, mai confuso) dentro la finestra del gioco, con sotto o accanto il
tabellone (stemmi, nomi, punteggio, minuto, cartellini).

- **Campo da calcio a 5 in erba**, con le righe, le due porte, e i giocatori a
  **cinque per parte** con le **maglie della propria squadra** (colori casa e,
  se si somigliano, trasferta per gli ospiti) e un portiere di colore diverso.
- Il minuto vero di partita corre come **90' + recupero compressi in 60
  secondi**. La cronaca è una lista di eventi decisi dal seme prima che la
  partita inizi; l'animazione li mette in scena all'istante giusto.
- **Eventi animati**, ognuno con una piccola sequenza riconoscibile:
  gol (esultanza, rete che si gonfia, scritta GOL), tiro fuori / palo / parata
  (quasi gol), rimessa laterale, fallo, **cartellino giallo**, **cartellino
  rosso** (il giocatore esce e la squadra resta in quattro), **rigore**
  (dischetto, rincorsa, gol o parata), **infortunio** (giocatore a terra, barella
  pixel, cambio), fischio d'inizio, intervallo, fischio finale. Rara ma possibile:
  la **vittoria a tavolino** (partita sospesa, 3–0 a tavolino scritto sul
  tabellone; decidi tu una causa buffa e innocua, tipo «nebbia», «blackout dei
  riflettori», «invasione di nutrie»). Le scommesse si pagano sul risultato
  ufficiale, tavolino compreso.
- **Telecamera che si muove**: segue la palla con un po' di inerzia, zooma sulle
  azioni pericolose; **inquadrature diverse** che cambiano (campo largo, mezzo
  campo, dietro la porta per i rigori, primo piano sul cartellino, replay rapido
  del gol a velocità ridotta).
- **Contorno**: spalti con **tifosi pixel** nei colori delle due squadre che si
  alzano ed esultano al gol, sbandieratori, cori come onde di pixel; panchine.
- **Meteo della città di chi gioca in casa**, deciso dal seme ma **coerente col
  clima e la stagione reale** di quella città nel giorno di oggi (a ottobre a
  Bergamo può piovere o esserci nebbia, a Palermo è sereno e caldo, al nord
  d'inverno può nevicare; se sei in dubbio usa la media climatica della zona).
  Effetti: sereno, nuvole, pioggia (pozzanghere e scivolate), nebbia (si vede
  poco, bellissimo nello schermino), neve (palla arancione), vento. **Luce in
  base all'ora vera**: partite serali coi riflettori accesi.
  Ma il meteo **non cambia mai il risultato**: è solo scena.
- Suoni opzionali coerenti con `suono/` (fischietto, boato, «uuuh» sul palo),
  sintetizzati come il resto del sito, spenti se l'utente ha spento il suono.

## Durante le scommesse (i 4 minuti)

Lo schermino non è vuoto: squadre che si scaldano, tifosi che entrano, meteo
già visibile, presentazione della partita (stemmi, forza, ultimi «risultati»
inventati, che ovviamente non contano). Tutto deve far venire voglia di giocare
ma senza schermate rumorose.

## Qualità e dettagli che contano

- Funziona bene da **telefono** (molti aprono pzkko.it da lì): schermino che si
  ridimensiona tenendo i pixel netti, pulsanti grandi, niente scroll orizzontale.
- Prestazioni: un solo canvas, `requestAnimationFrame`, si ferma quando la
  finestra è chiusa o la scheda nascosta (riprende al punto giusto grazie al
  determinismo).
- `prefers-reduced-motion`: niente telecamera che si muove, solo il tabellone e
  le scritte degli eventi.
- Le regole del gioco in una schermata breve e simpatica nello stesso tono degli
  altri giochi, con la frase su quote vere e risultati a caso, e che si gioca coi
  $pzk, che non valgono niente fuori da pzkko.it.
- Nessuna immagine generata da un modello è necessaria: disegna tutto in canvas/SVG.
  Se proprio ti serve un'immagine, segui il metodo di `tools/pzkko/fogli.js`, ma
  preferisci di no.

## Consegna

1. Lavora su un ramo `pzkko/virtual`, a partire da `main` aggiornato.
2. Aggiorna `pzkko/README.md` con una voce `games/virtual/` nello stesso stile
   delle altre (cosa fa ogni file), e la `regia` se gli altri giochi ci compaiono.
3. Provalo davvero: apri la pagina in locale (`npm run dev:pzkko` dalla radice),
   apri il gioco, guarda almeno un ciclo completo scommesse → partita → pagamento,
   verifica che due schede aperte vedano la stessa partita e che le quote siano
   sensate (favorita bassa, sfavorita alta) mentre i risultati su ~1.000 partite
   simulate siano indipendenti dalla forza. Controlla anche il telefono
   (viewport stretto).
4. Commit chiari in italiano, come quelli già nel repo; push del ramo e apri una
   pull request verso `main` con una descrizione breve in italiano di cosa c'è e
   come provarlo. Non fare merge su `main` da solo.
