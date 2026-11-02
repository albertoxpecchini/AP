// pzkkopedia (2.11.2026): le voci dell'area «i giochi, i $pzk, il wallet, la borsa, i conti». Il formato e i titoli canonici
// stanno in tools/pzkko/wiki/README.md; wiki/voci.js unisce questo modulo agli altri. Le regole di gioco qui descritte sono
// quelle del repo (le copie «per disegnare»): dal 31.10 gli esiti li decide la banca sul pc di Alberto (C:\pzkko-server\banca).

const G = 'albertopecchini.it/pzkko/games/'
const T = 'albertopecchini.it/tools/pzkko/'
const README = 'albertopecchini.it/pzkko/README.md'

export const VOCI = {
  // ───────────────────────────────────────────────────────────────────────────────────────────── i giochi
  'I giochi': {
    data: '2026-10-31',
    fonti: [G + 'pzk.js', G + 'roulette/roulette.js', G + 'blackjack/blackjack.js', G + 'mine/mine.js', G + 'dado/dado.js', G + 'moneta/moneta.js', G + 'virtual/virtual.js', README],
    testo: `[[File:roulette.webp|thumb|la roulette aperta nella sua finestra: il foglio col nastro sopra il muro]]
'''I giochi''' di [[pzkko.it]] sono i sei giochi da casinò che si aprono dai [[I volantini|volantini]] della zona «games» del [[Il muro|muro]]: la [[La roulette|roulette]], il [[Il blackjack|blackjack]], le [[Le mine|mine]], il [[Il dado|dado]] (il sic bo), la [[La moneta|moneta]] (testa o croce) e [[Virtual]] (le scommesse sul calcio inventato). Si giocano tutti con gli stessi soldi finti, [[I $pzk|i $pzk]], e nessuno di loro vale niente fuori dal sito: la pagina [[Info (pagina)|info]] lo dice in una riga, «i giochi sono per ridere: niente soldi veri, mai».

== Com'è fatto un gioco ==
Ogni gioco è una cartella di <code>games/</code> (<code>roulette/</code>, <code>blackjack/</code>, <code>mine/</code>, <code>dado/</code>, <code>moneta/</code>, <code>virtual/</code>) con il suo modulo principale, il suo foglio di stile, un file di regole e, dove c'è il 3D, una scena. Il codice si scarica solo quando si apre la finestra (passando sul volantino si precarica), e la finestra è sempre la stessa: [[La finestra dei giochi|un foglio grande attaccato al muro col nastro]], un <code>dialog</code> di 800 × 600 sul computer e a tutto schermo sul telefono. Il tavolo è un SVG stampato sulla carta in <code>multiply</code>, con un filtro di grana e il bordo irregolare come la stampa dei volantini; [[Le fiches|le fiches]] (1, 5, 25, 100, 500) sono fotografie, le stesse in tutti i giochi.

Il 3D, dove c'è (la ruota, le carte, le tessere, la campana, la moneta), è [[three.js]] r186 in <code>games/roulette/lib/three.js</code>, condiviso da tutti; la fisica della pallina, dei dadi e della moneta è [[Rapier]] 0.21 in WebAssembly. I suoni (la fiche posata, la vincita a 8 bit, il fischietto di virtual) passano dal motore della strada ([[Il suono della strada]]), quindi tacciono se chi guarda ha spento il [[Il nastro suono|nastro suono]]. Ogni gioco ha la sua sigla chiptune che parte quando la finestra si apre ([[Le sigle delle app]]).

== La storia ==
I primi due, blackjack e roulette, sono nati il 7 e l'8 ottobre 2026 come pagine a parte (il blackjack col banco bot e cinque posti, poi «il tavolo diventa una scena» con un croupier che distribuiva a mano, commit 02ff1b5), sono stati tolti il 17.10 (commit 533ca91, «via blackjack e roulette»: il PRODUCT.md annota la rinuncia) e sono tornati lo stesso giorno nella forma di adesso, la roulette 3D in una finestra sopra il muro (ae76bda). Il blackjack con le regole vere di Las Vegas, Atlantic City e Venezia è del 18.10 (cfe63fc), le mine, il dado e la moneta del 22.10 (7eae16a e 26c10f6), virtual del 23.10 (b9710fc).

== Chi decide gli esiti ==
Fino al 31.10.2026 ogni gioco girava nel browser e mandava al server i «[[I lotti numerati|lotti]]» col saldo. Da quel giorno ([[La banca sul server]], commit 92ef038) '''il browser non decide più niente''': la puntata va alla banca sul pc di Alberto con <code>pzk.fai('&lt;gioco&gt;.&lt;azione&gt;', args)</code> e le regole che contano stanno in <code>C:\\pzkko-server\\banca\\giochi\\casino-*.mjs</code> (roulette, blackjack, mine, dado, moneta, più <code>virtual.mjs</code>), con il caso sempre crittografico (<code>x.rnd</code>). Le regole che restano nel repository (<code>regole.js</code> di ogni gioco) servono a disegnare il tavolo, a dire quanto paga una casella e a far girare le prove; se cambiano devono cambiare anche sulla banca, in due copie.
{{Citazione|saldo sempre nel server immediatamente · browser modificato non può accedere · nessun codice accessibile da fuori · solo da me stanno i dati|Alberto, 31.10.2026}}

== I numeri in comune ==
* ogni gioco sposta i $pzk dal saldo al suo '''tavolo''' quando si punta e li regola a fine giro; il tavolo si vede in <code>conto.tavoli[gioco]</code> e le fiches sullo schermo sono solo da guardare (<code>pzk.punta</code> e <code>pzk.ritira</code> le mettono, <code>pzk.sgombra</code> le toglie quando la banca ha preso il giro);
* «togli» riporta indietro l'ultima fiche, «rifai» rimette la puntata di prima, «×3» fa andare tutto tre volte più in fretta;
* i giochi grandi contano da soli nel [[Profilo (app)|profilo]]: mani, vinte, puntato, netto, il colpo migliore (<code>zaino.giro</code> a ogni esito);
* una vincita di almeno 1.500 $pzk in un giro fa una [[Le notizie della banca|notizia della banca]];
* in [[La galera|galera]] non si gioca, e con i soli [[I soldi sporchi|soldi sporchi]] nemmeno: il tavolo dice la strada intera (la [[La lavatrice|lavatrice]], o aspettare 96 giorni).

== Le prove ==
Ogni gioco ha uno script in <code>tools/pzkko/&lt;gioco&gt;/prova.mjs</code> che fa girare la stessa fisica e le stesse regole senza browser, in più thread, e confronta i pagamenti con un conto fatto in un altro modo: [[Le prove dei giochi]] raccoglie i numeri (4.122 giri di roulette, 4.122.000 mani di blackjack per regolamento, un milione di giri di mine, 41.220 colpi di dadi, 20.000 lanci di moneta, 5.000 partite di virtual).

{{Vedi anche|I $pzk|La finestra dei giochi|Le fiches|La banca sul server|Gadget (pagina)|La chat col bot}}
[[Categoria:I giochi]]`,
  },

  'La finestra dei giochi': {
    data: '2026-10-23',
    fonti: [G + 'roulette/roulette.css', G + 'roulette/roulette.js', G + 'crt.css', G + 'crt.js', README],
    testo: `[[File:https://www.albertopecchini.it/media/web/pzk-roulette-tablet.webp|thumb|la finestra della roulette su un tablet, nella cattura che fa il sito serio]]
'''La finestra dei giochi''' è il foglio grande attaccato al [[Il muro|muro]] col nastro in cui si aprono tutti e sei [[i giochi|I giochi]]. È un elemento <code>&lt;dialog&gt;</code>: 800 × 600 pixel sul computer, a tutto schermo sul telefono; sotto c'è un velo scuro e la strada si abbassa di volume mentre si gioca (i giochi sono finestre modali, [[Il suono della strada]] lo sa).

== Il foglio ==
La carta è una fotografia come quelle dei [[I volantini|volantini]]: il foglio della roulette (<code>art/roulette/</code>, generato il 17.10.2026 come le altre immagini del muro) fa da fondo alla roulette, al dado e alla moneta (per questi due è capovolto), il blackjack e le mine hanno il loro. Sopra la carta il tavolo è un SVG stampato in <code>mix-blend-mode: multiply</code>, con un filtro di grana e di bordo irregolare che imita l'inchiostro dei volantini; passando su una puntata l'evidenziatore giallo segna i numeri coperti e una voce a pennarello dice quanto paga.

== Come si apre ==
* il link del volantino (il titolo copre tutto il foglio, <code>h3 a::after</code>);
* l'indirizzo: <code>#roulette</code>, <code>#blackjack</code>, <code>#mine</code>, <code>#dado</code>, <code>#moneta</code>, <code>#virtual</code> aprono subito la finestra;
* dalla [[La chat col bot|chat col bot]] con il comando omonimo (<code>roulette</code>, <code>blackjack</code>…).
Il codice del gioco si scarica solo a quel momento; passando col puntatore sul volantino si precarica. Niente «×»: si chiude toccando fuori o con Esc. Nella [[La scena 3D|scena 3D]] i volantini e i loro link sono ancora quelli della pagina sotto, quindi la finestra si apre allo stesso modo con e senza 3D.

== Cosa c'è dentro ==
In cima il saldo (col conto, sotto, la riga <code>rigaEuro()</code>: «hai anche EUR€ 12,50 nel wallet: convertili in $pzk», che apre il cambio dell'[[Account (app)|account]]), il mucchio delle [[Le fiches|fiches]], i tasti «togli», «rifai», «×3», il cerchio della puntata; a destra o sotto gli ultimi esiti (gli ultimi numeri, le ultime mani, i moltiplicatori incassati, le ultime uscite della moneta) che restano nel browser (<code>localStorage</code>: <code>pzkko-roulette</code>, <code>pzkko-dado</code>, <code>pzkko-moneta</code>, <code>pzkko-mine</code> per il seme del giocatore). Le tele 3D sono trasparenti e appoggiate sul foglio con la telecamera dall'alto, un pixel = un'unità, così le ombre delle carte e delle tessere cadono sulla carta stampata.

{{Vedi anche|I giochi|La roulette|Il blackjack|Le mine|Il dado|La moneta|Virtual}}
[[Categoria:I giochi]]`,
  },

  'La roulette': {
    data: '2026-10-31',
    fonti: [G + 'roulette/roulette.js', G + 'roulette/ruota.js', G + 'roulette/regole.js', G + 'roulette/roulette.css', T + 'roulette/prova.mjs', T + 'roulette/motore.mjs', README],
    testo: `{{Infobox
| titolo = La roulette
| immagine = roulette.webp
| didascalia = la ruota 3D e il tavolo stampato sul foglio
| dove = pzkko.it/#roulette
| dal = 8 ottobre 2026 (nella finestra dal 17.10)
| file = games/roulette/roulette.js, ruota.js, regole.js
| fisica = Rapier 0.21 (la pallina), three.js r186 (la ruota)
| prove = tools/pzkko/roulette/prova.mjs, 4.122 giri, nessun errore
| apre con = il volantino «roulette», #roulette, il comando roulette
}}
'''La roulette''' è il primo dei [[I giochi|giochi]] di [[pzkko.it]] com'è adesso: una roulette europea, tavolo stampato sul foglio e ruota in 3D, con la pallina mossa da un motore fisico vero. Il volantino «roulette» (la ruota è l'illustrazione della zona games) apre [[la finestra dei giochi|La finestra dei giochi]]; <code>#roulette</code> nell'indirizzo la apre subito.

== La storia ==
La prima roulette è dell'8 ottobre 2026 (commit e5b8c66, «la ruota di pzkko: single player con la fisica vera della pallina e il croupier che lancia, ritira e paga»), una pagina a sé della [[La scrivania di pzkko|scrivania]]. Il 17.10 è stata tolta insieme al blackjack (533ca91) e rifatta lo stesso giorno come finestra sopra il [[Il muro|muro]] (ae76bda, «il muro più alto coi siti in cima, la roulette 3D in una finestra, via le immagini che non servono»). Dal 31.10 l'esito di ogni giro lo decide la [[La banca sul server|banca sul server]] (<code>casino-roulette.mjs</code>): la pallina nel browser è da guardare.

== Il tavolo e le 157 puntate ==
Il tavolo è un SVG in verticale, stampato in <code>multiply</code> sulla carta: lo zero in cima, tre colonne di numeri, a sinistra le dozzine e le semplici, sotto le colonne «2:1». Ci sono '''tutte le 157 puntate di una roulette europea''': i pieni (37), i cavalli, le terzine, le quartine, le sestine, le tre colonne, le tre dozzine e le semplici (rosso/nero, pari/dispari, manque/passe). Sullo zero le semplici si perdono: niente «la partage». Passando sopra una puntata l'evidenziatore giallo segna i numeri coperti e la voce a pennarello dice quanto paga (35 a 1 il pieno, 17 il cavallo, 11 la terzina, 8 la quartina, 5 la sestina, 2 dozzine e colonne, 1 le semplici). Le [[Le fiches|fiches]] (1, 5, 25, 100, 500) e il segnaposto di cristallo sono fotografie.

== Le fiches che volano ==
Posata, la fiche vola dal mucchio al tavolo con un arco (si avvicina, l'ombra si allarga) e la pila fa un colpetto; «togli» la riporta indietro. A fine giro sul numero uscito cade il segnaposto e il pennarello lo cerchia, le puntate perse scivolano via verso il banco una pila alla volta, la vincita arriva dal banco accanto alla pila e poi tutto vola al saldo, che conta. Niente mani: il croupier del 7 ottobre non c'è più. Con <code>prefers-reduced-motion</code> le fiches non volano. Dal 29.10 ([[I lotti numerati]]) il saldo vero si aggiorna appena la pallina è ferma e le fiches che volano sono solo da vedere: il tavolo tiene fermo il saldo di prima (<code>mostrato</code>) finché non arrivano.

== La ruota ==
La scodella è in mogano laccato con la pista sopraelevata, il piano nero coi rombi cromati, il rotore con l'anello dei numeri (nell'ordine europeo, le cifre in Anton disegnate su una tela), le caselle, le palette d'ottone, l'intarsio e la torretta: tutto [[three.js]], nel pacchetto ridotto che fa <code>tools/pzkko/roulette/motore.mjs</code> con esbuild (solo i pezzi che servono) e che ricopia [[Rapier]]. La pallina rotola sulla pista, rallenta per l'aria e per il rotolamento, scende, sbatte sui rombi e sulle palette e si ferma dove si ferma: il numero è quello della casella sotto di lei. Come nelle ruote automatiche, la pallina salta fuori dalla casella da sola e riparte dalla pista. «×3» la fa correre tre volte più in fretta.

== Le trappole della fisica ==
Scritte anche in <code>ruota.js</code> ([[Le trappole della fisica]]): Rapier non lascia girare un corpo oltre 120π rad/s, troppo poco per una pallina da 19 mm che corre a 4 m/s, quindi la simulazione va al rallentatore (<code>TEMPO</code>) e fuori si riconverte; con l'attrito sulla pista Rapier non fa rotolare la pallina in tondo senza strisciare, quindi la pista non ha attrito e la frenata la danno a mano il rotolamento e l'aria; <code>lengthUnit</code> sotto 1 e la distanza di previsione di serie (2 cm) frenano la pallina e costano dieci volte tanto.

== Le prove ==
<code>node tools/pzkko/roulette/prova.mjs [4122]</code> fa girare la stessa ruota senza browser, in più thread, e per ogni giro controlla che la pallina non esca mai, che si fermi davvero in una casella e ci resti, che il numero sia quello giusto e che le vincite di puntate a caso tornino col conto fatto in un altro modo; fra un giro e l'altro passano 2–8 secondi come quando si punta. Il 17.10.2026 (seme 20261017): 4.122 giri, nessun errore, nessun giro da rifare, circa 10 secondi e 10 giri sulla pista, ferma dopo circa 12 s; chi quadro sui 37 numeri p = 0,17, sui salti da un numero al successivo p = 0,44. Con i giri attaccati e il rotore sempre alla stessa velocità i numeri venivano un po' troppo legati al giro prima (p ≈ 0,01): per questo il rotore parte fra 1,6 e 2,6 rad/s e la pallina da un punto della pista che cambia di ±0,3 rad.

== I soldi ==
Si gioca coi [[I $pzk|$pzk]] di <code>games/pzk.js</code>, gli stessi degli altri giochi e del [[Il wallet|wallet]]; gli ultimi numeri restano nel browser (<code>localStorage</code>, <code>pzkko-roulette</code>). Niente premi, niente pagamenti. Il comando <code>roulette</code> della [[La chat col bot|chat col bot]] accetta anche le puntate scritte (rosso, nero, pari, dispari, una dozzina 1–3, un numero).

{{Vedi anche|I giochi|La finestra dei giochi|Le fiches|Il blackjack|Le prove dei giochi|Rapier|three.js}}
[[Categoria:I giochi]]`,
  },

  'Il blackjack': {
    data: '2026-10-31',
    fonti: [G + 'blackjack/blackjack.js', G + 'blackjack/regole.js', G + 'blackjack/scena.js', G + 'blackjack/carte.js', G + 'blackjack/blackjack.css', T + 'blackjack/prova.mjs', T + 'blackjack/figure.mjs', README],
    testo: `{{Infobox
| titolo = Il blackjack
| immagine = blackjack.webp
| didascalia = il tavolo stampato, il sabot e le carte 3D
| dove = pzkko.it/#blackjack
| dal = 7 ottobre 2026 (regole vere dal 18.10)
| file = games/blackjack/blackjack.js, regole.js, scena.js, carte.js
| fisica = three.js r186 (le carte); niente motore fisico
| prove = tools/pzkko/blackjack/prova.mjs, 4.122.000 mani per regolamento
| apre con = il volantino «blackjack», #blackjack, il comando blackjack
}}
'''Il blackjack''' è il gioco di carte di [[pzkko.it]]: la stessa [[La finestra dei giochi|finestra]] della [[La roulette|roulette]], il foglio col nastro, il tavolo stampato sopra, le [[Le fiches|fiches]] fotografate, e le carte vere in 3D. Ha '''tre regolamenti veri''', a scelta: las vegas, atlantic city e venezia.

== La storia ==
Il 7 ottobre 2026 (67d4876) era «il tavolo con il banco bot, cinque posti e i $pzk», una pagina della [[La scrivania di pzkko|scrivania]]; lo stesso giorno «il tavolo diventa una scena: croupier che distribuisce a mano, giocatori con braccia vere, carte che si piegano» (02ff1b5) e l'8.10 il DESIGN.md di impeccable descriveva «la sala del blackjack (scena, consolle, burattini, telecamera)» (79b6a29). Tolto il 17.10 (533ca91), è tornato il 18.10 nella finestra, «con le regole vere di las vegas, atlantic city e venezia, carte 3D, $pzk in comune» (cfe63fc). Dal 31.10 il sabot, le carte coperte e i pagamenti sono della [[La banca sul server|banca sul server]] (<code>casino-blackjack.mjs</code>): il browser riceve una carta alla volta e non vede mai quella coperta del banco prima del tempo.

== Il tavolo ==
Un SVG stampato sul foglio come quello della roulette: la cassetta del banco in cima, le scritte ad arco («blackjack paga 3 a 2», la regola del banco, la fascia dell'assicurazione che paga 2 a 1, le regole del tavolo), tre caselle su un arco in basso con i cerchi delle laterali, i limiti (5–1.000, laterali 1–100). Si gioca su una, due o tre caselle; la casella 1 è quella a destra, la prima alla sinistra del banco: le carte si danno e si giocano da destra a sinistra, come al tavolo.

== Le carte ==
Carte da casinò a indice grande, 63 × 88, con gli angoli tondi, lo spessore e una curva appena accennata, in [[three.js]]; la vernice è lucida (clearcoat) e riflette una stanza buia con le lampade di lato, così le carte ferme restano nitide e quelle che girano mandano un lampo. La telecamera guarda dall'alto e il piano delle carte coincide col foglio (un px = un'unità), le ombre cadono sulla carta. Le facce sono disegnate in un canvas (<code>carte.js</code>): valori in Anton, i semi disegnati a mano, le figure a due teste con la mezza figura di [[gpt-image-2]] e la stessa girata di 180° (le dodici mezze figure in <code>art/blackjack/</code>, 17.10.2026, <code>tools/pzkko/blackjack/figure.mjs</code>, col prompt nel <code>.json</code> accanto); il dorso è rosso pzkko con una trama fine. Le carte escono dal '''sabot''' (acrilico fumé: dentro il mazzo coricato che si accorcia, la carta di taglio gialla, il dorso della prossima carta nella bocca), volano e si girano in aria, la carta del raddoppio va di traverso, la carta coperta del banco sta sotto la scoperta e il banco la '''sbircia''' alzandone il bordo; a fine mano il banco raccoglie da destra a sinistra e tutto finisce nella '''vaschetta degli scarti''', che cresce. Quando esce la carta di taglio è l'ultima mano: alla successiva si mescola, gli scarti tornano nel sabot e si bruciano le prime carte.

== I tre regolamenti ==
* '''las vegas''': il gioco a sei mazzi della Strip. Carta coperta e sbirciata col 10 o l'asso, il banco sta su tutti i 17, blackjack 3 a 2, raddoppio su due carte anche dopo la divisione, divisione fino a quattro mani (anche 10 e figura), assi divisi una carta sola e niente ridivisione degli assi, resa tardiva, assicurazione e «alla pari», una carta bruciata.
* '''atlantic city''': come il New Jersey. Otto mazzi, al più tre mani divise (N.J.A.C. 13:69F-2.11 per i tavoli da sette posti), resa tardiva.
* '''venezia''': il regolamento del Casinò di Venezia (comune.venezia.it). Sei mazzi, il banco si dà la seconda carta solo alla fine (niente carta coperta: se fa blackjack prende anche raddoppi e divisioni), raddoppio solo con 9, 10 e 11 (anche dopo la divisione), divisione solo di carte uguali fino a tre volte, obbligo di chiedere carta fino a 11, cinque carte bruciate, il banco finisce il colpo anche se tutti hanno sballato, da soli si punta su almeno due caselle, niente resa né laterali, alla pari pagata subito.
Con las vegas e atlantic city ci sono le due '''laterali''' più diffuse: ''perfect pairs'' (coppia 6, colore 12, perfetta 25 a 1) e ''21+3'' sulle due carte e la scoperta del banco (colore 5, scala 10, tris 30, scala colore 40, tris uguale 100 a 1), pagate subito dopo la distribuzione. Il blackjack paga 3 a 2 anche sulle puntate dispari: i conti vanno a mezzi $pzk.

== Le mosse ==
Carta, stai, raddoppia, dividi, abbandona (dove c'è la resa), e all'asso del banco assicura o alla pari; da tastiera C S R D A, e S/N per l'assicurazione. Il cartellino accanto alla mano dice i punti (7/17 quando l'asso può valere 11), giallo quando tocca a lei; i timbri dicono com'è andata. «×3» fa dare le carte tre volte più in fretta. Nella [[La chat col bot|chat col bot]] c'è il comando <code>blackjack</code>, e il carattere 5 × 7 di [[pzk os]] ha dal 31.10 i semi ♦ ♣ ♠ proprio per le carte.

== Le prove ==
<code>node tools/pzkko/blackjack/prova.mjs [4122000]</code> gioca le mani di ogni regolamento con la strategia di base e poi a caso (anche con mosse vietate, che il tavolo deve rifiutare) e per ogni mano controlla il sabot (52 × mazzi carte, ognuna una volta, le bruciate, la carta di taglio), il banco (tira fino a 16, sta sui 17, non tira se non serve, a venezia sì), che ogni $pzk puntato lasci il tavolo una volta sola, i pagamenti contro un calcolo dei punti fatto in un altro modo, i limiti di divisioni, assi e raddoppi, e le frequenze delle laterali contro le probabilità esatte del sabot. Il 17.10.2026, '''4.122.000 giri per regolamento''': nessun errore; vantaggio del banco con la strategia di base 0,36 % ± 0,08 (las vegas), 0,34 % ± 0,08 (atlantic city), 0,65 % ± 0,07 (venezia); perfect pairs 6,11 % (6 mazzi) e 4,10 % (8 mazzi), 21+3 4,62 % e 3,70 %, come le probabilità esatte.

{{Vedi anche|I giochi|La roulette|Le mine|Le prove dei giochi|I $pzk|gpt-image-2}}
[[Categoria:I giochi]]`,
  },

  'Le mine': {
    data: '2026-10-31',
    fonti: [G + 'mine/mine.js', G + 'mine/regole.js', G + 'mine/scena.js', G + 'mine/tessere.js', G + 'mine/mine.css', T + 'mine/prova.mjs', README],
    testo: `{{Infobox
| titolo = Le mine
| immagine = mine.webp
| didascalia = il campo 5 × 5 stampato e le venticinque tessere 3D
| dove = pzkko.it/#mine
| dal = 22 ottobre 2026
| file = games/mine/mine.js, regole.js, scena.js, tessere.js
| fisica = three.js r186 (le tessere, la gemma, la bomba); niente motore fisico
| prove = tools/pzkko/mine/prova.mjs, un milione di giri in 77 s
| apre con = il volantino «mine» (titolo in Black Ops One), #mine, il comando mine
}}
'''Le mine''' sono il gioco delle mine dei casinò online rifatto sul [[Il muro|muro]] di [[pzkko.it]], dal 22.10.2026: cinque per cinque caselle, si sceglie quante mine, si punta, ogni casella senza mina è una gemma che alza il moltiplicatore, si incassa quando si vuole, una mina si prende tutto. Il volantino ha il titolo nello stencil Black Ops One (la classe <code>t-stencil</code> dei [[I caratteri del muro|caratteri del muro]]) e la bomba disegnata, <code>art/arte2/bomba.webp</code>, è la stessa che compare sulle tessere a fine giro.

== Il gioco ==
Si sceglie quante mine (da 1 a 24, «con [3] mine» in alto; la scelta resta nel browser), si punta (1–1.000: c'è un posto solo, quindi toccare una [[Le fiches|fiche]] la punta; anche il cerchio «puntata» posa l'ultima fiche) e si gioca. Dopo l'ultima gemma, o arrivati al massimo, si incassa da sé. «a caso» scopre una casella qualunque; da tastiera le frecce nel campo, Invio, A (a caso) e I (incassa). «rifai» ripunta l'ultima puntata, «×3» fa girare tutto tre volte più in fretta.

== I moltiplicatori ==
Dopo k gemme con m mine il moltiplicatore è l'inverso della probabilità di arrivarci, C(25, k) / C(25 − m, k), meno l'1 % che tiene il banco, troncato ai centesimi: quello stampato è quello pagato. Con 3 mine ×1,12 alla prima gemma e ×2.277 a tutte e 22; con una mina ×1,03 e, alla fine, ×24,75 come con 24 mine alla prima. Si paga a mezzi $pzk per difetto, al più 1.000.000 $pzk a giro. La '''scala''' stampata a destra (sotto, sul telefono) dice quanto paga ogni gemma e quanto si vince con la puntata di adesso; l'evidenziatore sulla riga raggiunta, la freccia rossa sulla prossima.

== Provably fair ==
Le mine sono decise prima del primo tocco, come nei casinò «provably fair»: il seme del banco (32 byte a caso, nuovi a ogni giro), il seme del giocatore (8 byte, nel browser, <code>pzkko-mine</code>) e il numero del giro passano da '''HMAC-SHA256''' (chiave il seme del banco, messaggio «giocatore:giro:cursore»); ogni 4 byte fanno un numero fra 0 e 1, e 24 numeri pescano le caselle una alla volta fra quelle rimaste: le prime m sono le mine. Durante il giro, in piccolo sotto la colonna, c'è l'impronta (SHA-256) del seme del banco; a fine giro il seme: toccandola si copiano seme, impronta, mine e il modo di rifare il conto. SHA-256 e HMAC sono scritti in <code>regole.js</code> (quaranta righe) invece di <code>crypto.subtle</code>, che il browser dà solo in https o su localhost: così le mine si giocano anche dal telefono sulla rete di casa. Dal 31.10 il seme del banco e le mine stanno sulla [[La banca sul server|banca sul server]] (<code>casino-mine.mjs</code>, in <code>x.tavolo('mine')</code>, mai nel <code>vede</code> mandato al browser) ed escono solo a giro finito.

== Le tessere ==
Sono 3D come le carte del [[Il blackjack|blackjack]]: la stessa telecamera dall'alto, il foglio sul piano y = 0, un'unità = un px. Spesse, con lo smusso e gli angoli tondi, laccate: il dorso rosso pzkko con la trama delle carte e un rombo, la faccia color avorio con la cornice stampata. Sotto il puntatore (o col fuoco della tastiera) la tessera si alza un poco. Toccata si gira come una carta; se è una gemma ne salta fuori uno smeraldo sfaccettato (un brillante a otto lati, vernice e iridescenza, che prende le lampadine della stanza riflessa) che gira e ci si posa. Se è una mina esce la bomba nera laccata, col collare di ferro e la miccia di corda accesa (la scintilla come quella del volantino), trema e '''scoppia''': il lampo, il fumo che sale, i pezzi della tessera che volano, rimbalzano e restano sul foglio o sulle altre tessere, le tessere vicine che saltano e ricadono un po' spostate e storte, il foglio che sobbalza, il timbro «boom». Sul foglio resta la '''bruciatura''' (un SVG sotto le tessere, una macchia sfrangiata diversa ogni volta e la polvere intorno), che si vede fra le tessere anche nei giri dopo: restano le ultime quattro. A fine giro le altre caselle si girano a onda dall'ultima toccata, più scure: le gemme stampate e le mine con la bomba del volantino. Al giro dopo la tessera scoppiata ricade dall'alto con un rimbalzo. Con <code>prefers-reduced-motion</code> niente voli né scoppio.

== Le prove ==
<code>node tools/pzkko/mine/prova.mjs [200000]</code> controlla i moltiplicatori e le vincite contro i binomiali esatti in BigInt, SHA-256 e HMAC contro <code>node:crypto</code>, le mine contro lo stesso conto fatto con una pesca diversa, che ogni casella sia mina quanto le altre (chi quadro, anche sulle coppie), e poi gioca: gemme e mina giuste per le mine svelate, le mosse vietate rifiutate (la stessa casella, incassare senza gemme, giocare a giro finito), il conto (la puntata lascia il tavolo una volta, torna la vincita giusta) e il ritorno al giocatore. Il 22.10.2026, '''un milione di giri in 77 secondi''': nessun errore; caselle chi quadro 7,0 su 24 gradi, coppie 312 su 299; ritorno con le strategie che restano sotto il massimo 97,95 % misurato, 98,90 % atteso (z = −0,62). Chi si spinge fin dove il massimo taglia la vincita ci perde di più (84,8 % atteso, con le strategie a caso della prova).

{{Vedi anche|I giochi|Il blackjack|Il dado|Le prove dei giochi|I $pzk}}
[[Categoria:I giochi]]`,
  },

  'Il dado': {
    data: '2026-10-31',
    fonti: [G + 'dado/dado.js', G + 'dado/campana.js', G + 'dado/regole.js', G + 'dado/dado.css', T + 'dado/prova.mjs', README],
    testo: `{{Infobox
| titolo = Il dado
| immagine = dado.webp
| didascalia = il sic bo: la campana di vetro coi tre dadi e il tavolo di Macao
| dove = pzkko.it/#dado
| dal = 22 ottobre 2026
| file = games/dado/dado.js, campana.js, regole.js
| fisica = Rapier (i dadi nella campana), three.js (la campana)
| prove = tools/pzkko/dado/prova.mjs, 41.220 colpi in 18 thread
| apre con = il volantino «dado» (note in Rock Salt), #dado, il comando dado
}}
'''Il dado''' è il '''sic bo''' di [[pzkko.it]]: tre dadi, «grande e piccolo», il gioco di dadi dei casinò di Macao, nella stessa [[La finestra dei giochi|finestra]] degli altri [[I giochi|giochi]]. Il foglio col nastro è quello della [[La roulette|roulette]], capovolto; il volantino «dado» ha le note a mano in Rock Salt (<code>m-sale</code>). Da non confondere col comando <code>tira</code> della [[La chat col bot|chat col bot]], un dado per ridere senza soldi: «dado» coi soldi è il sic bo, e il comando <code>dadi</code> della chat è un altro giochino ancora.

== La campana ==
In alto a sinistra, 3D in [[three.js]]: una base bassa di mogano laccato (il legno della roulette), dentro il piatto nero col panno verde, il collare d'ottone, la campana di vetro col pomolo e i tre dadi d'avorio, lucidi, a spigoli tondi, coi punti incavati: neri, l'uno e il quattro rossi e l'uno grande, come i dadi cinesi. «scuoti» fa vibrare il piatto: su e giù (8,5–10,5 Hz, 7–9 mm), un po' di lato e inclinato avanti e indietro attorno a un asse che gira, per 1,6–2,2 s, poi si spegne piano. I dadi li muove [[Rapier]]: saltano fino a 5 cm, sbattono sul vetro e fra loro e si fermano dove si fermano; esce la faccia in alto. Se un dado resta storto (appoggiato al vetro o a un altro dado) il colpo non vale e la campana si riscuote, come al tavolo. Fra un colpo e l'altro i dadi restano dove sono, e alla volta dopo la campana riparte da lì; aprendo la finestra mostrano l'ultimo colpo. A dadi fermi la scena non si ridisegna. Dal 31.10 le facce le tira la [[La banca sul server|banca sul server]] (<code>casino-dado.mjs</code>, <code>x.rnd</code>): la campana nel browser le mostra.

== Il tavolo ==
Un SVG stampato sul foglio (<code>multiply</code>, il filtro di grana degli altri), come i tavoli di Macao: in alto piccolo e grande (小, 大) ai lati, pari e dispari (雙, 單) dove ci sono, le coppie, le triple e la qualsiasi tripla in mezzo; sotto i quattordici totali, le quindici combinazioni e i sei numeri; i dadi disegnati col pennino, l'uno e il quattro in rosso. Sul telefono lo stesso tavolo va a capo in righe più corte. Passando su una casella l'evidenziatore la segna e la voce a pennarello dice quanto paga; dopo il colpo '''il tavolo si illumina''' dove vince, le fiches perse scivolano al banco, la vincita arriva accanto alla pila e poi tutto vola al saldo. Accanto alla campana gli ultimi colpi, le tre facce e il totale.

== I pagamenti ==
Due tabelle a scelta («regole di»), coi pagamenti come li riporta wizardofodds.com/games/sic-bo:
{| class="wikitable"
! puntata !! macao !! atlantic city
|-
| piccolo (4–10) e grande (11–17) || 1 a 1, perdono con le triple || 1 a 1
|-
| pari e dispari || 1 a 1 (solo qui), perdono con le triple || non ci sono
|-
| totale 4 e 17 || 50 a 1 || 60 a 1
|-
| totale 5 e 16 || 18 a 1 || 30 a 1
|-
| totale 6 e 15 || 14 a 1 || 17 a 1
|-
| totale 7 e 14 || 12 a 1 || 12 a 1
|-
| totale 8 e 13 || 8 a 1 || 8 a 1
|-
| totale da 9 a 12 || 6 a 1 || 6 a 1
|-
| coppia (almeno due di quel numero, anche nella tripla) || 8 a 1 || 10 a 1
|-
| tripla di un numero || 150 a 1 || 180 a 1
|-
| qualsiasi tripla || 24 a 1 || 30 a 1
|-
| combinazione di due numeri || 5 a 1 || 5 a 1
|-
| numero singolo || 1, 2 o 3 a 1 se esce su uno, due o tre dadi || uguale
|}
Il vantaggio del banco va dal 2,78 % di piccolo, grande, pari e dispari al 47,22 % del totale 5 a macao.

== Le prove ==
<code>node tools/pzkko/dado/prova.mjs [41220]</code>: prima le 216 uscite, per ogni puntata e con tutte e due le tabelle, quanto rendono le regole contro un conto fatto al contrario, e il vantaggio del banco esatto contro quello di wizardofodds. Poi la stessa campana del gioco si scuote N volte di fila in più thread e per ogni colpo si controlla che i dadi restino dentro il vetro (nel riferimento della campana, che si muove), che si fermino dritti sul panno con quelle facce in alto e mezzo secondo dopo siano ancora lì, e le vincite di puntate a caso; alla fine le facce di ogni dado, i totali (chi quadro) e le facce da un colpo al successivo. Il 22.10.2026 (seme 4122, 41.220 colpi, circa 6 minuti in 18 thread): nessun errore; un colpo dura 2,3 s (mediana; fino a 9,6 quando si riscuote), l'1,63 % si riscuote; il vetro entra nei dadi al più 2,4 mm mentre si scuote; facce p = 0,31, 0,37 e 0,51 per dado, 0,95 tutte insieme; totali p = 0,63; da un colpo al successivo p = 0,50, stessa faccia il 16,90 % (16,67 % atteso). Col seme 2026: facce p = 0,43, passaggi p = 0,39, stessa faccia il 16,78 %.

== Le trappole della fisica ==
Scritte anche in <code>campana.js</code> ([[Le trappole della fisica]]): il vetro comincia un centimetro sotto il panno, perché sul bordo aperto della superficie i dadi che correvano contro la parete ci passavano attraverso (fino a 7 mm dentro); la campana ha la parete dritta in basso e la cupola sopra, perché nella mezza sfera un dado su dieci restava appoggiato storto; la vibrazione si spegne in 0,7 s, perché le ultime scosse piccole fanno ricadere dritti i dadi in bilico, e il panno ha poco attrito (0,4), perché un dado caduto contro la parete ci restava appoggiato di sbieco (insieme i colpi da rifare scendono dal 3,5 all'1,6 %). Una partenza più secca toglieva l'ultimo filo di memoria fra un colpo e l'altro ma faceva uscire un po' meno il quattro (p = 0,014): scartata. Contatti più rigidi (<code>contact_natural_frequency</code> 60) facevano entrare il vetro nei dadi di quasi 7 mm. La telecamera guarda la campana da 60° perché tutto il vetro stia davanti alla base: dove dietro non c'è niente three.js trasmette del bianco (la tela è trasparente) e la cupola sembrava di latte.

{{Vedi anche|I giochi|La moneta|La roulette|Le prove dei giochi|Rapier}}
[[Categoria:I giochi]]`,
  },

  'La moneta': {
    data: '2026-10-31',
    fonti: [G + 'moneta/moneta.js', G + 'moneta/lancio.js', G + 'moneta/scena.js', G + 'moneta/moneta.css', T + 'moneta/prova.mjs', T + 'moneta/facce.mjs', README],
    testo: `{{Infobox
| titolo = La moneta
| immagine = moneta.webp
| didascalia = testa o croce: la moneta d'ottone nel piatto di legno
| dove = pzkko.it/#moneta
| dal = 22 ottobre 2026
| file = games/moneta/moneta.js, lancio.js, scena.js
| fisica = Rapier (il lancio), three.js (il piatto, la moneta, la lente)
| prove = tools/pzkko/moneta/prova.mjs, 20.000 lanci in 162 s
| apre con = il volantino «moneta», #moneta, il comando moneta
}}
'''La moneta''' è testa o croce, nella stessa [[La finestra dei giochi|finestra]] degli altri [[I giochi|giochi]] di [[pzkko.it]]: il foglio col nastro è quello della [[La roulette|roulette]], capovolto. Il banco qui non ha vantaggio: testa e croce pagano 1 a 1 e la moneta è giusta. Il comando <code>sorte</code> della [[La chat col bot|chat col bot]] è un testa o croce per ridere; «moneta» coi soldi è questo.

== La moneta d'ottone ==
Ottone, '''32 mm''' e 2,6 mm di spessore, in [[three.js]]: sulla testa un profilo all'antica inventato con la corona d'alloro, «PZKKO» e «MMXXVI»; sulla croce una croce gigliata coi quattro punti e un giro di perline; il bordo zigrinato. Le facce le ha disegnate [[gpt-image-2]] come mappe delle altezze (<code>tools/pzkko/moneta/facce.mjs</code>, il prompt è lì e nei <code>.json</code>); da lì, una volta e non nel browser, il colore (l'ottone bruno nei fondi e chiaro sulle creste), le normali, il lucido e il ricalco a matita del tavolo, in <code>art/moneta/</code>; il bordo rialzato lo rifà il codice, tondo. Il primo foglio era una moneta illuminata invece di una mappa, e attorno alla croce la scritta girava in «CORSET»: rifatto, con la croce senza scritte.

== Il lancio ==
La moneta sta nel piatto, un vassoio di legno laccato da 25 cm (il legno della roulette) appoggiato sul foglio. «lancia»: sale dal fondo, a metà salita il pollice la gira sottosopra o no (a caso), poi la tira su a 1,7–2,2 m/s facendola girare 6–11 volte al secondo attorno a un asse orizzontale qualunque, con un filo di rotazione su se stessa; sale 20–30 cm sopra il foglio, ricade vicino al centro, rimbalza (di solito quattro volte), rotola, ondeggia e si ferma, in poco più di un secondo. La muove [[Rapier]], come la pallina della roulette, ed esce la faccia che resta in su. Se si ferma appoggiata al bordo il lancio non vale e si rilancia da lì (meno di uno su cento). Fra un lancio e l'altro la moneta resta dov'è. Dal 31.10 la faccia la decide la [[La banca sul server|banca sul server]] (<code>casino-moneta.mjs</code>): il lancio nel browser la fa uscire.

La '''telecamera''' guarda il piatto di sbieco e sale dietro alla moneta che vola (la gru: la metà della sua altezza); quando si ferma le va sopra e si gira, così la faccia uscita si legge dritta, e la tela sfuma in tondo nel foglio come una lente (<code>--lente</code>, una maschera CSS animata). Il timbro dice testa o croce. A moneta ferma la scena non si ridisegna.

== Il tavolo e lascia o raddoppia ==
Un SVG stampato sul foglio: due caselle, testa e croce, con la faccia ricalcata a matita, il nome, «paga 1 a 1» e il cerchio dove si punta (anche su tutte e due). Dopo il lancio il pennarello cerchia la faccia uscita, le fiches perse scivolano al banco, la vincita arriva accanto alla pila e le due pile diventano una. Sotto, le ultime uscite, quanti lanci in tutto con la percentuale di testa e croce, e quante volte di fila è uscita l'ultima. '''Lascia o raddoppia?''' Dopo una vincita tutto resta sul tavolo: «lascia» incassa, «raddoppia» rilancia tutto (toccando l'altra casella la puntata ci si sposta, prima). Si raddoppia quante volte si vuole, e perdendo si perde tutto. «rifai» rimette le puntate da cui era partita la serie. Le uscite restano nel browser (<code>pzkko-moneta</code>).

== Le prove e la preferenza del 50,8 % ==
<code>node tools/pzkko/moneta/prova.mjs [20000]</code> lancia la stessa moneta N volte di fila in più thread, ogni lancio da dove si è fermato il precedente, e controlla che non esca mai dal piatto né passi sotto il fondo, che quando si dice ferma sia piatta e mezzo secondo dopo sia ancora lì con la stessa faccia; alla fine testa contro croce, quante volte esce la faccia che era in su prima del lancio e quante la stessa del lancio prima (chi quadro), altezze, giri, rimbalzi e tempi. Il 22.10.2026 (seme 4122): '''20.000 lanci in 162 s''', nessun errore, 173 rifatti (0,86 %); testa 49,81 %, croce 50,19 % (p = 0,60); la faccia che era in su prima del lancio 50,28 % (p = 0,43), la stessa del lancio prima 50,28 % (p = 0,44); sale a 19–29 cm, 2,4–10,4 giri (mediana 5,3), 1–7 rimbalzi, ferma dopo 0,7–5 s (mediana 1,1).

La fisica da sola non è giusta ([[Le trappole della fisica]]): partendo con in su la faccia del lancio prima, usciva l'opposta il 52,2 % delle volte (10.000 lanci, p &lt; 0,001: chi puntava sempre sull'altra vinceva); le monete vere hanno una preferenza simile, per la stessa faccia, del '''50,8 %''' (Bartoš e altri, 2023, 350.757 lanci). Il mezzo giro a caso del pollice la pareggia: con la partenza metà e metà e una moneta uguale dalle due parti, testa e croce escono metà e metà per simmetria, qualunque sia la preferenza (che la prova misura ancora: la faccia in su quando il pollice la lascia esce il 47,3 % delle volte). Le tolleranze di Rapier restano quelle di serie, in metri: in centimetri (<code>lengthUnit</code> 0,01) la moneta che ondeggia affondava nel legno di 1–2 mm in un fotogramma su dieci; il cilindro arrotondato di Rapier va meglio di un poliedro a 48 lati, che entrava di 8 mm; passi più corti (1/1200 s) non servono.

{{Vedi anche|I giochi|Il dado|La roulette|Le prove dei giochi|Rapier|gpt-image-2}}
[[Categoria:I giochi]]`,
  },

  'Virtual': {
    data: '2026-10-31',
    fonti: [G + 'virtual/virtual.js', G + 'virtual/partita.js', G + 'virtual/squadre.js', G + 'virtual/schermo.js', G + 'virtual/schedina.js', G + 'virtual/virtual.css', T + 'virtual/prova.mjs', T + 'virtual/icona.mjs', 'albertopecchini.it/pzkko/games/PROMPT-virtual.md', README],
    testo: `{{Infobox
| titolo = Virtual
| immagine = virtual.webp
| didascalia = lo schermino a pixel, il tabellone e le quote stampate
| dove = pzkko.it/#virtual, e nel cercapersone (Virtual (app))
| dal = 23 ottobre 2026
| file = games/virtual/virtual.js, partita.js, squadre.js, schermo.js, schedina.js
| fisica = nessuna: un generatore seminato (mulberry32) e due Poisson
| prove = tools/pzkko/virtual/prova.mjs, 5.000 partite
| apre con = il volantino «virtual» (il pallone in SVG), #virtual, il comando virtual
}}
'''Virtual''' sono le scommesse sul calcio inventato di [[pzkko.it]] (23.10.2026, commit b9710fc; il prompt con cui è nato è in <code>games/PROMPT-virtual.md</code>): un campionato infinito, una partita sola alla volta, uguale per chiunque sia sul sito in quel momento, nella stessa [[La finestra dei giochi|finestra]] degli altri [[I giochi|giochi]]; si gioca coi [[I $pzk|$pzk]] e mai con soldi veri. L'illustrazione del volantino è <code>art/virtual/pallone.svg</code>, disegnata a mano; la piastrella dell'app del cercapersone la scrive <code>tools/pzkko/virtual/icona.mjs</code>. Dal 23.10 sera la stessa partita e la stessa [[La schedina|schedina]] vivono anche in [[Virtual (app)]] di [[pzk os]].

== Il calendario a cicli di cinque minuti ==
{{Principale|Il calendario di virtual}}
Il tempo è a cicli di cinque minuti allineati all'orologio: nei primi quattro minuti le scommesse sono aperte (12:55:00 → 12:58:59), l'ultimo minuto la partita è in diretta (90' più il recupero compressi in 60 secondi), allo scoccare del ciclo dopo è finita, si paga e si apre la successiva. L'indice della partita è <code>Math.floor(Date.now() / 300000)</code>; da lì, con un generatore seminato (mulberry32), escono squadre, quote, meteo, formazioni e tutta la cronaca. Due persone vedono la stessa partita nello stesso momento (provato con due schede: stesso punteggio allo stesso secondo).

== Le squadre, le quote, i risultati ==
Le venti di Serie A e le venti di Serie B 2026/27 coi nomi storpiati ma riconoscibili (Juvenclub, Inder, Milano Rossonera, Napule, Atalanto, Fiorentoina, Mantua, Verona Scaligera, Stabia Vespe…), ognuna con la sigla, la città, i colori, uno stemma originale in SVG e una forza da 1 a 100 presa dalla realtà: [[Le squadre di virtual]] e [[Elenco delle squadre di virtual]]. Le quote si calcolano come farebbe un bookmaker ([[Le quote di virtual]]): gol attesi dalla differenza di forza, probabilità da due Poisson, margine del 6,5 %. Dal 31.10.2026 anche il risultato esce dalle stesse Poisson («le quote copiano la Serie A vera, e anche i gol»); fino ad allora usava una Poisson di media fissa 1,35 a squadra uguale per tutte, e la sfavorita vinceva quanto la favorita: puntarci rendeva in media il 164 %. Una partita su 120 finisce a tavolino (3–0, per nebbia, blackout dei riflettori, invasione di nutrie, gli ospiti che sbagliano stadio…).

== Le puntate ==
1 X 2 e over/under con soglie 1,5 · 2,5 · 3,5 · 4,5, anche insieme, con le [[Le fiches|fiches]] degli altri giochi; vincita = puntata × quota. La [[La schedina|schedina]] dice cosa si è giocato, la quota, la possibile vincita e l'esito; le scommesse restano nel browser e si pagano al fischio finale anche a finestra chiusa (riaprendo si trova l'esito), i $pzk puntati stanno sul tavolo di <code>pzk.js</code> fino al pagamento. A partita iniziata le quote si spengono. Dal 31.10 la partita, le quote e il pagamento li fa la [[La banca sul server|banca sul server]] (<code>giochi/virtual.mjs</code>, coi dati in <code>banca\\dati\\virtual-partita.mjs</code> e <code>virtual-squadre.mjs</code>: la scena di virtual esiste in due copie, repo e banca, da cambiare insieme).

== Lo schermino e il tabellone ==
{{Principale|Lo schermino di virtual}}
Un solo canvas di 192 × 120 pixel grossi dentro una cornice di plastica da tamagotchi: il campo a cinque, cinque omini per parte con le maglie della loro squadra, gli spalti coi tifosi pixel, la telecamera che segue la palla e zooma sulle azioni, i gol col replay al rallentatore, il meteo della città di casa coerente col clima e la stagione, la luce che segue l'ora vera. Sotto, il tabellone: gli stemmi SVG, i nomi, città · forza, il punteggio che salta al gol, il minuto, i cartellini, il conto alla rovescia («si chiude tra 2:41», «IN DIRETTA · finisce tra 34s»); «come si gioca» apre le regole in un foglietto.

== I suoni ==
Il fischietto, il boato del gol, l'«uuuh» del palo, la fiche posata, la vincita a 8 bit (<code>suono/voci.js</code>, <code>suono/suono.js</code>): passano dal motore della strada ([[Il suono della strada]]), quindi spenti se chi guarda ha spento il suono. Nella [[La regia|regia]], scheda «suono», si provano.

== Le prove ==
<code>node tools/pzkko/virtual/prova.mjs [partite, 2000]</code> costruisce N partite di fila e controlla il determinismo, le quote (la favorita quotata più bassa, 1 X 2 al 106,5 %, over/under complementari, mai sotto 1,05), la cronaca (i gol della cronaca sono quelli del risultato, gli eventi in ordine e a distanza, mai a cavallo dell'intervallo, il rosso lascia in quattro, il tavolino 3–0) e le puntate contro un conto fatto al contrario. Il 23.10.2026, '''5.000 partite''': nessun errore; correlazione fra differenza di forza e quota dell'1 −0,77 (le quote seguono la forza); con i risultati ancora a caso: fra differenza di forza e differenza di gol +0,01, con una favorita netta (≥ 15 punti) vince la favorita il 38,8 %, pareggio 25,5 %, la sfavorita 35,7 % (chi quadro p = 0,54); gol a squadra media 1,364 e varianza 1,374 (Poisson); tavolini 0,5 %.

{{Vedi anche|Il calendario di virtual|Le squadre di virtual|Le quote di virtual|Lo schermino di virtual|La schedina|Virtual (app)|I giochi}}
[[Categoria:I giochi]]`,
  },

  'Il calendario di virtual': {
    data: '2026-10-23',
    fonti: [G + 'virtual/partita.js', README],
    testo: `'''Il calendario di virtual''' è il modo in cui [[Virtual]] fa giocare a tutti la stessa partita nello stesso momento, senza un server che la tenga: il tempo è a '''cicli di cinque minuti''' allineati all'orologio, e tutto nasce dal numero del ciclo.

== Il ciclo ==
* l'indice della partita è <code>Math.floor(Date.now() / 300000)</code> (cinque minuti in millisecondi);
* nei primi quattro minuti del ciclo le scommesse sono aperte (da 12:55:00 a 12:58:59, per dire);
* l'ultimo minuto la partita è in diretta: i 90 minuti più il recupero compressi in 60 secondi;
* allo scoccare del ciclo dopo è finita, la [[La schedina|schedina]] paga e si apre la successiva.
Il conto alla rovescia sta sul tabellone («si chiude tra 2:41», «IN DIRETTA · finisce tra 34s») e sullo [[Lo schermino di virtual|schermino]] («FISCHIO TRA 3:26»).

== Il seme ==
Dall'indice, con un generatore seminato (mulberry32, lo stesso tipo di caso col seme fisso che usa la [[La barra in alto|barra in alto]] per i suoi strappi), escono le due squadre, le quote, il meteo, le formazioni e tutta la cronaca minuto per minuto: quindi chi arriva a metà la vede dal punto giusto e ricaricare non cambia niente. Gli accoppiamenti: A contro A il 52 % delle volte, B contro B il 34 %, un incrocio A–B il 14 %. Il risultato esce da un altro seme con le stesse Poisson delle [[Le quote di virtual|quote]] (dal 31.10.2026). Il ciclo si ferma con la finestra chiusa o la scheda nascosta e riprende al secondo giusto; con <code>prefers-reduced-motion</code> la telecamera dello schermino sta ferma e larga e si disegna due volte al secondo.

== Durante le scommesse ==
Lo schermino non è vuoto: le squadre si scaldano nelle due metà, i tifosi entrano, il meteo c'è già, e a rotazione i cartelli della presentazione (gli stemmi, la forza, le ultime cinque «uscite», inventate; la città e il meteo). Chi apre per primo la schedina (<code>avvia</code>) rimette sul tavolo le puntate aperte e paga le partite finite nel frattempo.

{{Vedi anche|Virtual|Le quote di virtual|Le squadre di virtual|La schedina|Virtual (app)}}
[[Categoria:I giochi]]`,
  },

  'Le squadre di virtual': {
    data: '2026-10-23',
    fonti: [G + 'virtual/squadre.js', G + 'virtual/partita.js', README],
    testo: `'''Le squadre di virtual''' sono le quaranta squadre del campionato inventato di [[Virtual]]: le venti di Serie A e le venti di Serie B 2026/27, coi nomi storpiati ma riconoscibili, in <code>games/virtual/squadre.js</code> (e nella copia che decide, <code>banca\\dati\\virtual-squadre.mjs</code> sulla [[La banca sul server|banca sul server]]). L'elenco completo, una voce per squadra, è [[Elenco delle squadre di virtual]].

== Cosa ha ogni squadra ==
* il '''nome storpiato''' (Juvenclub, Inder, Milano Rossonera, Napule, Atalanto, Fiorentoina, Romma, Lazzio, Toro Granata, Sassolino, Parmigiano, Bolognese, Comodo, Genova Grifo, Cagliaritas, Leccese, Monzese, Frosinoni… e in B Mantua, Verona Scaligera, Stabia Vespe…), la sigla di tre lettere e la città;
* la '''serie''' (A o B) e il '''clima''' della città (nord, centro, sud, liguria…), che decide il meteo dello [[Lo schermino di virtual|schermino]] con pesi mese per mese: a ottobre a Bergamo nebbia o pioggia, a Palermo sereno, d'inverno al nord può nevicare;
* i '''colori''': la maglia di casa [primo, secondo] con un disegno (strisce verticali, due metà, tinta unita con dettagli, croce, fascia orizzontale, quarti) e la trasferta sempre in tinta unita; gli ospiti giocano in seconda maglia se la prima somiglia a quella di casa, e il portiere è di un colore che non c'è;
* uno '''stemma originale in SVG''' (<code>stemmaSVG</code>): la forma (scudo, tondo, ovale, rombo), il colore sociale e lo «spirito» (una zebra, un biscione, un giglio, un lupo, un ciuccio, una vespa, la dea, il grifone, il toro…): mai il logo vero;
* una '''forza da 1 a 100''' presa dalla realtà (Inder 92, Napule 90, Milano 86, Juvenclub 85, Atalanto 84, Romma 82… Frosinoni 45): da lì nascono i gol attesi delle [[Le quote di virtual|quote]].
I cognomi dei giocatori sono sillabe italiane a caso (<code>cognome(rand)</code>), diversi a ogni partita.

== Nel cercapersone ==
In [[Virtual (app)]] gli stemmi diventano a un bit e le maglie a strisce, a metà o a fascia restano riconoscibili sullo schermo 256 × 128; in campo la resa si adatta al fotogramma (le due luci più frequenti sono l'erba, a puntini radi).

{{Vedi anche|Elenco delle squadre di virtual|Virtual|Le quote di virtual|Il calendario di virtual}}
[[Categoria:I giochi]]
[[Categoria:Le squadre di virtual]]`,
  },

  'Le quote di virtual': {
    data: '2026-10-31',
    fonti: [G + 'virtual/partita.js', T + 'virtual/prova.mjs', README],
    testo: `'''Le quote di virtual''' sono i numeri stampati sul tavolo di [[Virtual]], e dal 31.10.2026 anche il modo in cui si decidono i gol: «le quote copiano la Serie A vera, e anche i gol», dice il foglietto delle regole.

== Come le fa il bookmaker ==
# i '''gol attesi''' di ciascuna squadra dalla differenza di forza ([[Le squadre di virtual]]), più 4 punti di fattore campo e un filo di rumore dal seme del ciclo;
# le '''probabilità''' di 1, X, 2 e dei totali da due distribuzioni di Poisson (una per squadra);
# il '''margine''' del 6,5 %: 1 X 2 sommano al 106,5 % in probabilità implicita, e così over e under della stessa soglia;
# centesimi, mai sotto 1,05.
Per esempio Inder–Vicentini dà 1,07 · 11,05 · 26,85; Juvenclub–Milano 2,29 · 3,66 · 2,82. Le soglie degli over/under sono 1,5 · 2,5 · 3,5 · 4,5.

== I risultati ==
Dal 31.10.2026 il risultato esce da un altro seme ma con le stesse Poisson (i gol attesi di casa e ospite): la forte vince più spesso, la sfavorita ogni tanto, e il banco tiene il suo margine. Fino a quel giorno il risultato usava una Poisson di media fissa 1,35 a squadra, uguale per tutte, e la sfavorita vinceva quanto la favorita: con le sue quote alte, puntarci rendeva in media il '''164 %'''. Le prove del 23.10 lo dicevano già coi numeri (correlazione fra quota dell'1 e «la casa vince» −0,00: i risultati non seguivano le quote), e il cartello dello schermino diceva «le quote copiano la Serie A vera, i risultati no». Una partita su 120 finisce a tavolino 3–0 e paga come tale. Il meteo non tocca il risultato.

== Dove si punta ==
Nella finestra grande la fiche va sulla casella stampata; in [[Virtual (app)]] la pagina «quote» del cercapersone ha la fiche, 1 X 2 e gli over/under, e si punta nei quattro minuti prima del fischio. A partita iniziata le quote si spengono. Vincita = puntata × quota, pagata dalla [[La schedina|schedina]] al fischio finale, anche a finestra chiusa.

{{Vedi anche|Virtual|Il calendario di virtual|Le squadre di virtual|La schedina|Le prove dei giochi}}
[[Categoria:I giochi]]`,
  },

  'Lo schermino di virtual': {
    data: '2026-10-23',
    fonti: [G + 'virtual/schermo.js', 'albertopecchini.it/pzkko/telefono/zero/os/virtual.js', README],
    testo: `[[File:virtual.webp|thumb|lo schermino dentro la cornice da tamagotchi, sopra il tabellone]]
'''Lo schermino di virtual''' è il piccolo schermo a pixel su cui si guarda la partita di [[Virtual]]: un solo canvas di '''192 × 120 pixel''', ingranditi di un fattore intero (<code>image-rendering: pixelated</code>: netti a ogni misura, anche sul telefono), dentro una cornice di plastica da tamagotchi. Il codice è <code>games/virtual/schermo.js</code>, e lo stesso modulo disegna la partita a un bit in [[Virtual (app)]] sul [[Il cercapersone zero|cercapersone zero]].

== Cosa si vede ==
Il campo da calcio a cinque in erba con le righe e le porte, cinque omini per parte con le maglie della loro squadra (strisce, metà, fascia, croce), gli spalti coi tifosi pixel nei colori delle due [[Le squadre di virtual|squadre]] (che entrano durante le scommesse, saltano al gol, fanno l'onda), le bandiere al vento, le panchine con le riserve. Tutto è funzione del tempo: niente stato che si accumula, e per questo chi apre a metà vede il minuto giusto.

== La telecamera e gli eventi ==
La telecamera segue la palla con inerzia e zooma sulle azioni (campo largo, mezzo campo, primo piano sui cartellini), per i rigori l'inquadratura da dietro la porta, il gol ha il replay al rallentatore. Gli eventi: fischio d'inizio, gol (il tiro, la rete che si gonfia, GOL!, l'esultanza, il replay), tiro fuori, palo e parata, rimessa, fallo, giallo e rosso (l'arbitro alza il cartellino, l'espulso esce e la squadra resta in quattro), rigore (gol, parato o fuori), infortunio (a terra, la barella gialla, entra la riserva), intervallo, fischio finale, la sospensione.

== Il meteo e la luce ==
Il meteo della città di casa è deciso dal seme ma coerente col clima e la stagione (cinque climi, pesi mese per mese): sereno, nuvole (le ombre che passano), pioggia (gocce, pozzanghere, scivolate), nebbia (si vede poco), neve (il prato bianco, la palla arancione), vento (le bandiere e le foglie). La luce segue l'ora vera: di sera la luce bassa, di notte i riflettori accesi e il buio intorno. Il meteo non tocca il risultato. Un fotogramma costa 0,2–2 ms anche a 6× (il telefono a 3×).

== Nel cercapersone ==
In [[pzk os]] le due primitive dello schermino, il pixel e il rettangolo, scrivono la luce in un buffer (<code>lumi</code>); poi la luce diventa trama a un bit: le due luci più frequenti sono l'erba, a puntini radi, il più scuro pieno, il più chiaro carta (di notte e con la pioggia gli omini non spariscono). La pagina «partita» lo mostra a metà, ↓ lo porta a schermo intero senza barra, dieci fotogrammi al secondo.

{{Vedi anche|Virtual|Virtual (app)|Il calendario di virtual|L'lcd}}
[[Categoria:I giochi]]`,
  },

  'La schedina': {
    data: '2026-10-31',
    fonti: [G + 'virtual/schedina.js', G + 'pzk.js', 'albertopecchini.it/pzkko/telefono/zero/os/virtual.js', README],
    testo: `'''La schedina''' è il modulo di [[Virtual]] che tiene le puntate, il tavolo dei [[I $pzk|$pzk]], il pagamento e l'unione fra le schede del browser: <code>games/virtual/schedina.js</code>, dal 23.10.2026 sera in un modulo solo (commit 3d06dc7, «virtual, la schedina in un modulo suo»), usato dalla finestra grande e da [[Virtual (app)]] del [[Il cercapersone zero|cercapersone zero]].

== Cosa fa ==
* dice cosa si è giocato, la quota, la possibile vincita e l'esito;
* le scommesse restano nel browser e si pagano al fischio finale anche a finestra chiusa: riaprendo si trova l'esito;
* i $pzk puntati stanno sul tavolo di <code>pzk.js</code> fino al pagamento e tornano sul tavolo dopo una ricarica;
* una copia per pagina: le due interfacce (la finestra e l'app) si avvisano a vicenda (<code>ascolta</code>) e con le altre schede via l'evento <code>storage</code>; chi apre per primo (<code>avvia</code>) rimette sul tavolo le puntate aperte e paga le partite finite nel frattempo;
* le puntate fra due schede si uniscono invece di sovrascriversi (commit c6fb233 del 23.10: «la schedina di due schede si unisce invece di sovrascriversi»), e «togli» toglie l'ultima fiche posata davvero (7a3ffba).

== Segue il portafoglio ==
Dal 26.10 ([[I portafogli separati]]) la schedina segue chi possiede i soldi: senza conto sta in <code>sessionStorage</code> (<code>pzkko-virtual</code>, sparisce con la sessione), col conto in <code>localStorage</code> (<code>pzkko-virtual:nome</code>); entrando o uscendo si cambia schedina e le puntate aperte si rimettono sul tavolo del portafoglio giusto. Le puntate vecchie nella chiave <code>pzkko-virtual</code> di <code>localStorage</code>, di proprietario ignoto, non si leggono più.
{{Citazione|senza account ho messo dei soldi su virtual e quando ho loggato ho visto ancora i vecchi soldi: rischio duplicazione|Alberto, 26.10.2026}}

== Dal 31.10 ==
Con la [[La banca sul server|banca sul server]] le puntate e il pagamento sono un'azione di <code>giochi/virtual.mjs</code>: la schedina nel browser chiede e mostra, il tavolo vero sta nel conto (<code>conto.tavoli.virtual</code>).

{{Vedi anche|Virtual|Virtual (app)|I portafogli separati|I $pzk|Le fiches}}
[[Categoria:I giochi]]
[[Categoria:I soldi]]`,
  },

  'Le fiches': {
    data: '2026-10-29',
    fonti: [G + 'pzk.js', G + 'roulette/roulette.js', README],
    testo: `'''Le fiches''' sono i gettoni con cui si punta in tutti e sei [[i giochi|I giochi]] di [[pzkko.it]]: cinque tagli, '''1, 5, 25, 100, 500''' $pzk, e il segnaposto di cristallo della roulette. Sono fotografie, le stesse in ogni gioco: <code>art/fiches/</code>, le cinque fiches e il segnaposto visti dall'alto, generate con [[gpt-image-2]] il 17.10.2026 come le altre immagini del muro.

== Come si muovono ==
Posata, la fiche vola dal mucchio al tavolo con un arco (si avvicina, l'ombra si allarga) e la pila fa un colpetto; «togli» la riporta indietro; a fine giro le puntate perse scivolano via verso il banco una pila alla volta, la vincita arriva dal banco accanto alla pila e poi tutto vola al saldo, che conta. Nelle [[Le mine|mine]] c'è un posto solo, quindi toccare una fiche la punta; nella [[La moneta|moneta]] dopo una vincita le due pile diventano una. Con <code>prefers-reduced-motion</code> le fiches non volano. Il suono della fiche posata e del colpetto sul panno passa dai [[I suoni dell'interfaccia|suoni dell'interfaccia]] e dal [[Il suono della strada|suono della strada]].

== Solo da guardare ==
Dal 29.10 ([[I lotti numerati]]) e ancora di più dal 31.10 ([[La banca sul server]]) le fiches sullo schermo non sono i soldi: <code>pzk.punta</code> e <code>pzk.ritira</code> le mettono e le tolgono dal tavolo per lo schermo, e <code>pzk.sgombra(gioco)</code> le toglie quando la banca ha preso il giro. Il saldo vero è quello del server, e i giochi pagano subito: le fiches che volano e il saldo che conta sono la messa in scena.

== Altrove ==
La fiche gialla da 500 è il logo del [[Il portachiavi della banca $pzk|portachiavi della banca $pzk]] per terra nella [[La scena 3D|scena 3D]], e nella [[La regia|regia]] i cursori hanno la fiche come pomello. In [[Virtual (app)]] la fiche si sceglie coi tasti del cercapersone.

{{Vedi anche|I giochi|I $pzk|La roulette|La finestra dei giochi}}
[[Categoria:I giochi]]`,
  },

  'Le prove dei giochi': {
    data: '2026-10-29',
    fonti: [T + 'roulette/prova.mjs', T + 'blackjack/prova.mjs', T + 'mine/prova.mjs', T + 'dado/prova.mjs', T + 'moneta/prova.mjs', T + 'virtual/prova.mjs', T + 'prova-lotti.mjs', README],
    testo: `'''Le prove dei giochi''' sono gli script di <code>tools/pzkko/</code> che fanno girare la fisica e le regole di ogni gioco di [[pzkko.it]] senza browser, in più thread, e confrontano ogni pagamento con un conto fatto in un altro modo. Si lanciano dalla cartella <code>albertopecchini.it</code>, e i loro numeri sono scritti nel README e nelle voci dei giochi.

{| class="wikitable"
! gioco !! comando !! cosa controlla !! l'ultima prova
|-
| [[La roulette]] || <code>node tools/pzkko/roulette/prova.mjs [4122]</code> || la pallina non esce, si ferma in una casella e ci resta, il numero è giusto, le vincite tornano; chi quadro sui numeri e sui salti || 17.10.2026, seme 20261017: 4.122 giri, nessun errore, numeri p = 0,17, salti p = 0,44
|-
| [[Il blackjack]] || <code>node tools/pzkko/blackjack/prova.mjs [4122000]</code> || il sabot, il banco, ogni $pzk lascia il tavolo una volta, i pagamenti, i limiti, le laterali contro le probabilità esatte || 17.10.2026: 4.122.000 giri per regolamento, vantaggio del banco 0,36 % / 0,34 % / 0,65 %
|-
| [[Le mine]] || <code>node tools/pzkko/mine/prova.mjs [200000]</code> || i moltiplicatori contro i binomiali in BigInt, SHA-256 e HMAC contro node:crypto, le mine uniformi, le mosse vietate || 22.10.2026: un milione di giri in 77 s, ritorno 97,95 % misurato
|-
| [[Il dado]] || <code>node tools/pzkko/dado/prova.mjs [41220]</code> || le 216 uscite contro wizardofodds, i dadi dentro il vetro e dritti, facce e totali chi quadro || 22.10.2026: 41.220 colpi in 18 thread, l'1,63 % riscossi, totali p = 0,63
|-
| [[La moneta]] || <code>node tools/pzkko/moneta/prova.mjs [20000]</code> || la moneta non esce dal piatto, è piatta quando si dice ferma, testa contro croce, la memoria del lancio prima || 22.10.2026: 20.000 lanci in 162 s, testa 49,81 %
|-
| [[Virtual]] || <code>node tools/pzkko/virtual/prova.mjs [2000]</code> || determinismo, quote (106,5 %, mai sotto 1,05), cronaca coerente, puntate || 23.10.2026: 5.000 partite, nessun errore, quote-forza −0,77
|-
| [[I lotti numerati]] || <code>node tools/pzkko/prova-lotti.mjs</code> || il wallet vero con l'archivio in memoria: la vincita mandata due volte, due dispositivi insieme, i lotti truccati, il libro dei conti, il browser di prima || 29.10.2026
|}

== Come sono fatte ==
Importano gli stessi moduli del gioco (<code>ruota.js</code>, <code>regole.js</code>, <code>campana.js</code>, <code>lancio.js</code>, <code>partita.js</code>) e li fanno girare in Node con <code>worker_threads</code>; il motore 3D non serve, la fisica di [[Rapier]] sì (la stessa WebAssembly). Un seme fisso rende la prova ripetibile (4122, 2026, 20261017). I conti si rifanno «al contrario»: dai dadi usciti alle puntate che vincono, dalle carte ai punti, dalle mine svelate alle gemme, così un errore nelle regole non si ripete nel controllo.

== Dal 31.10 ==
Le regole che contano stanno sulla [[La banca sul server|banca sul server]], che ha le sue prove (<code>node prove\\&lt;pezzo&gt;.mjs</code> dalla cartella <code>banca</code>, in memoria: <code>prove\\casino-*.mjs</code>); le prove del repo valgono per la copia che disegna. Cambiare una regola vuol dire cambiarla in due posti e far girare tutte e due le prove.

{{Vedi anche|I giochi|Il collaudo delle app|La banca sul server|Le trappole della fisica}}
[[Categoria:I giochi]]`,
  },

  'Le trappole della fisica': {
    data: '2026-10-22',
    fonti: [G + 'roulette/ruota.js', G + 'dado/campana.js', G + 'moneta/lancio.js', README],
    testo: `'''Le trappole della fisica''' sono le cose che [[Rapier]], il motore fisico dei [[I giochi|giochi]] di [[pzkko.it]], fa di testa sua, trovate una per una mentre si faceva girare la pallina, i dadi e la moneta. Sono scritte nei commenti di <code>ruota.js</code>, <code>campana.js</code> e <code>lancio.js</code> perché nessuno le ritrovi da capo.

== La pallina della roulette ==
* Rapier non lascia girare un corpo oltre 120π rad/s: troppo poco per una pallina da 19 mm che corre a 4 m/s. La simulazione va al rallentatore (<code>TEMPO</code>) e fuori si riconverte.
* Con l'attrito sulla pista Rapier non fa rotolare la pallina in tondo senza strisciare: la pista non ha attrito e la frenata la danno a mano il rotolamento e l'aria.
* <code>lengthUnit</code> sotto 1 e la distanza di previsione di serie (2 cm) frenano la pallina e costano dieci volte tanto.
* Con i giri attaccati e il rotore sempre alla stessa velocità i numeri venivano legati al giro prima (p ≈ 0,01): il rotore parte fra 1,6 e 2,6 rad/s e la pallina da un punto che cambia di ±0,3 rad.

== I dadi nella campana ==
* Il vetro comincia un centimetro sotto il panno: sul bordo aperto della superficie i dadi che correvano contro la parete ci passavano attraverso, fino a 7 mm dentro.
* La campana ha la parete dritta in basso e la cupola sopra: nella mezza sfera un dado su dieci restava appoggiato storto.
* La vibrazione si spegne in 0,7 s (le ultime scosse piccole fanno ricadere dritti i dadi in bilico) e il panno ha poco attrito (0,4): insieme i colpi da rifare scendono dal 3,5 all'1,6 %.
* Una partenza più secca faceva uscire un po' meno il quattro (p = 0,014): scartata. Contatti più rigidi (<code>contact_natural_frequency</code> 60) facevano entrare il vetro nei dadi di quasi 7 mm.
* La telecamera guarda da 60° perché tutto il vetro stia davanti alla base: dove dietro non c'è niente [[three.js]] trasmette del bianco e la cupola sembrava di latte.

== La moneta ==
* La fisica da sola non è giusta: partendo con in su la faccia del lancio prima usciva l'opposta il 52,2 % delle volte (10.000 lanci, p &lt; 0,001). Le monete vere preferiscono la stessa faccia il 50,8 % (Bartoš e altri, 2023, 350.757 lanci). Il mezzo giro a caso del pollice la pareggia per simmetria.
* In centimetri (<code>lengthUnit</code> 0,01) la moneta che ondeggia affondava nel legno di 1–2 mm un fotogramma su dieci: le tolleranze restano in metri, così affonda in meno di tre su cento e per un attimo.
* Il cilindro arrotondato di Rapier va meglio di un poliedro a 48 lati, che entrava di 8 mm; passi più corti (1/1200 s) non servono.

{{Vedi anche|Rapier|La roulette|Il dado|La moneta|Le prove dei giochi}}
[[Categoria:I giochi]]`,
  },

  // ───────────────────────────────────────────────────────────────────────────────────────────── i soldi
  'I $pzk': {
    data: '2026-10-31',
    fonti: [G + 'pzk.js', G + 'libro.mjs', 'albertopecchini.it/pzkko/api/wallet.mjs', 'albertopecchini.it/pzkko/api/_server.mjs', README],
    testo: `{{Infobox
| titolo = I $pzk
| immagine = wallet.webp
| didascalia = il saldo in $pzk a led verdi nel wallet
| dove = tutti i giochi, il wallet, la chat, il cercapersone
| dal = 7 ottobre 2026 (il blackjack); un portafoglio solo dal 18.10
| file = games/pzk.js, games/libro.mjs, api/wallet.mjs
| valgono = niente: «non ha corso legale · soldi finti»
}}
'''I $pzk''' sono i soldi finti di [[pzkko.it]]: la moneta della banca $pzk, con cui si gioca in tutti e sei [[i giochi|I giochi]], si compra nello [[Lo shop|shop]] e nel [[Il pzkstore|pzkstore]], si pagano i mestieri della [[La chat col bot|chat col bot]] e si tengono in [[Il wallet|wallet]]. Non si comprano, non si vendono e non valgono niente fuori dal sito ([[Info (pagina)]]). Un portafoglio solo per tutti i giochi e per il wallet, <code>games/pzk.js</code>, dal 18.10.2026 («$pzk in comune», commit cfe63fc); dal 22.10 notte due modi di averli: [[la sessione|La sessione]] e [[il conto|Il conto]].

== La sessione e il conto ==
* '''la sessione''': chi non entra ha 1.000 $pzk che durano la sessione del browser (<code>sessionStorage</code>, <code>pzkko-pzk-sessione</code>) e non cambiano mai; a secco (meno di 1 libero e niente sui tavoli) il gioco ne dà altri 1.000. Niente EUR€, niente borsa.
* '''il conto''': chi entra nel wallet (dal 26.10 nell'[[Account (app)|account]] del cercapersone) ha i suoi $pzk salvati sul server e soggetti alla [[La borsa|borsa]]. Il token e il conto com'è sul server stanno in <code>localStorage</code> (<code>pzkko-wallet</code>) e la pagina riparte con quelli mentre chiede al server. A secco: se ci sono [[Gli EUR€|EUR€]] si apre il cambio, se no il [[Il sussidio|sussidio]], 1.000 $pzk una volta al giorno.
I due sono [[I portafogli separati|portafogli separati]]: quello che era sui tavoli appartiene al portafoglio di prima.

== Da dove vengono e dove vanno ==
{{Principale|L'economia}}
L'[[L'offerta di $pzk|offerta di $pzk]] è la somma dei conti, della [[La cassa di pzk|cassa di pzk]] e dei [[I portafogli smarriti|portafogli smarriti]]. I soldi nascono dal nulla col lavoro, le quest, le sfide, i quiz, i premi giornalieri, la [[La miniera|miniera]], il sussidio, le [[Le banconote della banca $pzk|banconote per terra]], il [[Il regalo di Instagram|regalo di Instagram]], i miracoli della [[La lumachina|lumachina]]: il '''conio''', che fa scendere il cambio. Le puntate perse, gli acquisti, le commissioni e le multe vanno alla cassa; le vincite escono da lì. I trasferimenti ([[gli invii|Gli invii]]) non cambiano l'offerta. Il bottino delle rapine sono [[I soldi sporchi|soldi sporchi]], che si sommano al saldo ma non si spendono.

== Come arrivano al server ==
Fino al 29.10 il browser mandava il saldo intero un po' dopo ogni cambio; dal 29.10 ogni variazione è un [[I lotti numerati|lotto numerato]], e dal 31.10 ([[La banca sul server]]) il browser non decide più niente: <code>pzk.fai('&lt;gioco&gt;.&lt;azione&gt;', args)</code> chiede alla banca, e il conto della risposta diventa lo stato. Nel browser restano le letture (<code>pzk.saldo()</code>, <code>pzk.puliti()</code>, <code>pzk.inGalera()</code>, <code>pzk.ospite()</code>, <code>pzk.zainoBanca()</code>, <code>pzk.tavoloBanca(gioco)</code>) e le fiches sul tavolo per lo schermo. Il saldo che si vede è quello del server più i lotti in viaggio e le promesse (il sussidio, una banconota, instagram), e [[il canale diretto|Il canale diretto]] lo rimette in pari fra due dispositivi in una ventina di millisecondi. Il server accetta un salto del saldo solo se ha senso: non più di 20.000 + 1.200 $pzk al secondo dall'ultimo salvataggio (nessun gioco paga più di 35 a 1 su una fiche da 500).

== Cosa fanno nel resto del sito ==
* il [[Il banner del wallet|banner del wallet]] sulla serranda dice sempre il saldo, come un registratore di cassa, e nella [[La home di pzk os|home di pzk os]] i $pzk stanno grandi a destra della chiocciolina;
* i [[I numeri corti|numeri corti]] (999, 1,0K, 13,3K, 1,0M…) nei riquadri stretti;
* il [[Il libro dei conti|libro dei conti]] tiene i vinti ai giochi, il lavoro e i premi, i guadagnati in tutto, e da lì le [[Le classifiche|classifiche]];
* il [[Il conto di Alberto|conto di Alberto]] (pzk398893, «pzkko») non ha limiti;
* le banconote da 500, 100, 25 e 10 per terra nella scena 3D portano la chiocciola in smoking e la scritta «non ha corso legale · soldi finti».

{{Vedi anche|La sessione|Il conto|L'economia|Il wallet|La borsa|Gli EUR€|I lotti numerati|La banca sul server}}
[[Categoria:I soldi]]`,
  },

  'La sessione': {
    data: '2026-10-26',
    fonti: [G + 'pzk.js', README],
    testo: `'''La sessione''' è il portafoglio di chi usa [[pzkko.it]] senza un conto: '''1.000 $pzk''' che durano la sessione del browser e non cambiano mai. Dal 22.10.2026 notte è uno dei due modi di avere [[i $pzk|I $pzk]], l'altro è [[il conto|Il conto]].

== Come funziona ==
* i 1.000 $pzk stanno in <code>sessionStorage</code> (<code>pzkko-pzk-sessione</code>): chiudere la scheda li fa sparire, e [[lo zaino|Lo zaino]] della chat con loro;
* a secco (meno di 1 $pzk libero e niente sui tavoli) il gioco ne dà altri 1.000, senza limiti: la sessione non è una classifica;
* niente [[Gli EUR€|EUR€]], niente [[La borsa|borsa]], niente [[Gli invii|invii]]: sono cose del conto;
* [[la lumachina|La lumachina]] c'è lo stesso, una per browser, ma non tocca i 1.000: dice cosa avrebbe fatto;
* il [[Il regalo di Instagram|regalo di Instagram]] si prende una volta per browser nella sessione (<code>pzkko-pzk-ig</code>).
Dal 31.10 gli ospiti vivono nella memoria del server della [[La banca sul server|banca]]: anche la sessione chiede alla banca con <code>pzk.fai</code>, ma non ha un conto da scrivere (<code>x.db</code> è <code>null</code>, e le azioni con <code>conto: true</code> rispondono con un errore).

== Cosa non si può fare senza conto ==
Dal 26.10.2026 il [[Il cercapersone zero|cercapersone zero]] si apre solo sull'account finché non si entra («non puoi accedere al cercapersone se non ti registri/accedi», Alberto): la [[La home di pzk os|home di pzk os]] diventa un lucchetto con «OK entra o crea il conto», e un comando mandato alla chat aspetta il conto. I sei [[I giochi|giochi]] della pagina restano giocabili coi 1.000 della sessione. Quando si entra, quello che era sui tavoli appartiene alla sessione e non passa nel conto: [[I portafogli separati]].

{{Vedi anche|I $pzk|Il conto|I portafogli separati|Il sussidio}}
[[Categoria:I soldi]]`,
  },

  'Il conto': {
    data: '2026-10-31',
    fonti: [G + 'pzk.js', 'albertopecchini.it/pzkko/api/wallet.mjs', 'albertopecchini.it/pzkko/telefono/zero/os/account.js', README],
    testo: `'''Il conto''' è il portafoglio di chi si è registrato su [[pzkko.it]]: i [[I $pzk|$pzk]] salvati sul server e soggetti alla [[La borsa|borsa]], lo [[Lo zaino|zaino]] della chat sincronizzato fra i dispositivi, il profilo pubblico nelle [[Le classifiche|classifiche]]. Si crea e si apre dall'[[Account (app)|app Account]] del [[Il cercapersone zero|cercapersone zero]] (dal 26.10.2026; prima dalle pagine del [[Il wallet|wallet]]): un nome e un PIN di quattro cifre, niente di più, e il conto nuovo parte con 1.000 $pzk.

== Cosa c'è dentro ==
{{Principale|I conti}}
Il nome (2–20 lettere, unico, senza accenti né maiuscole), il PIN (scrypt con sale: non si legge e non si recupera), l'indirizzo «pzk» più sei cifre, i $pzk (puliti e [[I soldi sporchi|sporchi]]), gli [[Gli EUR€|EUR€]], le ultime 40 mosse, lo zaino (al più 12 KB), il [[Il libro dei conti|libro dei conti]], l'ultimo lotto visto di ogni dispositivo, la galera se c'è, il lavaggio in corso, le ultime 14 giornate della [[La lumachina|lumachina]]. L'accesso dà un token firmato (HMAC) che vale '''180 giorni''' e sta in <code>localStorage</code> (<code>pzkko-wallet</code>) insieme al conto com'è sul server, così la pagina riparte con quelli mentre chiede.

== Cosa si può fare solo col conto ==
* il cercapersone e le sue app (dal 26.10, <code>LIBERE</code> in <code>os.js</code> lascia fuori solo account e impostazioni);
* il cambio in EUR€ e il ritorno, al cambio del momento;
* [[gli invii|Gli invii]] fra conti, 48 ore dopo la nascita;
* i [[I traguardi|traguardi]] contati sullo zaino del conto, il [[Il libro dei conti|libro dei conti]], le posizioni nelle classifiche;
* la [[La rapina|rapina]] (il conto di almeno 48 ore), il [[Il pzkstore|pzkstore]], la [[La lavatrice|lavatrice]].

== I limiti ==
Al massimo 3 conti al giorno per IP, 8 tentativi di accesso in dieci minuti per nome; i nomi di Alberto (pzkko, alberto, admin, banca…) si creano solo con la chiave di amministrazione. Il [[Il conto di Alberto|conto di Alberto]] non ha limiti. Dal 31.10 il conto lo scrive solo la [[La banca sul server|banca sul server]], e un browser modificato non può più cambiarlo.
{{Citazione|tutti i dati degli account nel mio server · solo da me stanno i dati|Alberto, 31.10.2026}}

== Dove stanno ==
In <code>pzkko/wallet.json</code> sul [[Il server dei dati in casa|server dei dati in casa]] (<code>C:\\pzkko-server\\dati\\pzkko__wallet.json</code>; fino al 28.10 su [[Vercel Blob]]), con una copia compressa ogni dieci minuti nello [[Lo storico del server|storico]]. Moderazione: <code>node tools/pzkko/wallet.mjs</code> elenca i conti, <code>via &lt;nome&gt;</code> ne cancella uno (con la chiave in <code>.env.local</code>). Niente e-mail, nessun dato vero: [[Cosa si salva]].

{{Vedi anche|I conti|La sessione|Account (app)|I portafogli separati|Il conto di Alberto|Cosa si salva}}
[[Categoria:I soldi]]`,
  },

  'I lotti numerati': {
    data: '2026-10-29',
    fonti: [G + 'pzk.js', 'albertopecchini.it/pzkko/api/wallet.mjs', T + 'prova-lotti.mjs', README],
    testo: `'''I lotti numerati''' sono il modo in cui, dal 29.10.2026 notte (commit b402ac7, «le vincite salve al millesimo, due telefoni in sync»), ogni variazione dei [[I $pzk|$pzk]] viaggia dal browser al server di [[pzkko.it]]: non più il saldo intero, ma un pacchetto numerato per ogni giro finito, che il server controlla e applica una volta sola.
{{Citazione|ho giocato i dadi, ho vinto un botto, ho visto saldo 8000 e rotti e poi ctrl f5 sono spariti … quando vinco anche dopo 1 millesimo le cose si salvino subito … se entro con 2 telefoni e stesso account assieme devo vedere le cose sincronizzati al millisecondo … tu creami la struttura super solida|Alberto, 29.10.2026}}

== Il problema di prima ==
Fino al 29.10 il browser mandava il saldo intero un po' dopo ogni cambio. Due difetti: la vincita dei [[Il dado|dadi]] passava al saldo solo dopo le fiches che volano (due o tre secondi), e ricaricando in mezzo spariva; e due dispositivi si cancellavano a vicenda, perché chi salvava per ultimo rimetteva il suo saldo (il [[Il canale sempre aperto|canale sempre aperto]], apposta, non sincronizzava il saldo).

== Come funzionano ==
* '''ogni variazione è un lotto''' (<code>games/pzk.js</code>, <code>aggiungi</code>): un giro finito o una morte diventano <code>{ n, d, persi, v }</code>, quanto cambia il saldo e da dove, con le '''voci''' (<code>g:dado</code> col puntato, il tornato, la mano, se vinta e il colpo; <code>c:chat</code> i soldi nuovi del lavoro, della miniera, delle quest; <code>k:chat</code> la cassa fuori dai giochi, comprare e vendere). Il lotto finisce subito in <code>localStorage</code> (la coda della pagina, <code>pzkko-coda:&lt;conto&gt;:&lt;pagina&gt;</code>) e parte subito, una richiesta alla volta con dentro tutto quello che c'è; rete persa, si riprova a 2, 4, 8… 30 secondi. Ogni pagina aperta è un dispositivo, e una pagina ricaricata trova la coda di quella di prima;
* '''il server li controlla uno per uno''' (<code>api/wallet.mjs</code>, «I LOTTI NUMERATI», <code>lotti</code>): le voci devono fare esattamente la variazione, un gioco non rende più di 50 volte il puntato, il saldo non sale più di quello che si può vincere in quel tempo (20.000 più 1.200 al secondo), i nomi delle voci sono quelli giusti; un lotto che non va si scarta senza toccare il saldo. L'ultimo lotto visto di ogni dispositivo sta nel conto (<code>c.disp</code>, per tre giorni): un lotto già visto non si riapplica, quindi il browser può rimandarlo finché non ha la risposta (una risposta persa, un Ctrl+F5) senza che conti due volte;
* '''il saldo che si vede''' è quello del server più i lotti ancora in viaggio, più i premi che il server sta per dare (<code>promessa</code>); le schede dello stesso browser si sommano le code (l'evento <code>storage</code>), gli altri dispositivi lo sanno dal [[Il canale diretto|canale diretto]];
* '''la versione del conto''' (<code>conto.agg</code>, l'ora del server, sempre crescente): una risposta o un avviso più vecchi di quello che si sa non cambiano niente;
* '''i giochi pagano subito''': [[Il dado|dadi]], [[La roulette|roulette]], [[Le mine|mine]], [[La moneta|moneta]] e [[Il blackjack|blackjack]] chiamano <code>regola</code> appena il giro ha un esito, e le [[Le fiches|fiches]] che volano sono solo da vedere;
* il primo salvataggio di un browser col codice di prima (senza <code>agg</code>) partiva alla vecchia, col saldo intero, così chi aveva un saldo non ancora salvato non lo perdeva.

== Le prove e il dopo ==
<code>node tools/pzkko/prova-lotti.mjs</code>: il wallet vero con l'archivio in memoria, la vincita mandata due volte, due dispositivi insieme, i lotti truccati, il libro dei conti, il browser di prima. Due giorni dopo, il 31.10, la [[La banca sul server|banca sul server]] ha tolto al browser anche il diritto di scrivere i lotti: le azioni dei giochi si fanno sul server e <code>pzk.regola</code>, <code>pzk.via</code>, <code>pzk.perdi</code> sono spariti da <code>pzk.js</code>. Le voci dei lotti sono rimaste il linguaggio del [[Il libro dei conti|libro dei conti]].

{{Vedi anche|I $pzk|Il libro dei conti|Il canale diretto|La banca sul server|Le prove dei giochi}}
[[Categoria:I soldi]]`,
  },

  'Il libro dei conti': {
    data: '2026-10-31',
    fonti: [G + 'libro.mjs', 'albertopecchini.it/pzkko/api/wallet.mjs', 'albertopecchini.it/pzkko/api/giocatori.mjs', README],
    testo: `'''Il libro dei conti''' è il registro che il server di [[pzkko.it]] tiene per ogni [[Il conto|conto]] dal 29.10.2026 notte (<code>c.libro</code>): da lì vengono i numeri del [[Profilo (app)|profilo]] e delle [[Le classifiche|classifiche]], letti da un modulo solo, <code>games/libro.mjs</code>, uguale per il server e per il browser.
{{Citazione|non posso avere 5.5k in vinti ai giochi e 2.0k guadagnati in tutto, deve avere senso … rifai sistema classifiche mio e degli altri|Alberto, 29.10.2026}}

== Prima ==
I numeri li contava il browser nello [[Lo zaino|zaino]]: «vinti ai giochi» erano le sole mani vinte (le perse a parte) e «guadagnati» il solo lavoro, quindi i vinti potevano superare i guadagnati in tutto, e si potevano falsare.

== Adesso ==
Il libro è scritto dalle voci dei [[I lotti numerati|lotti numerati]] e dalle mosse del server (i premi, la [[La lumachina|lumachina]], le multe, la [[La lavatrice|lavatrice]], le [[La rapina|rapine]], gli [[Gli invii|invii]], i cambi), e <code>libro.mjs</code> lo legge così:
* '''vinti ai giochi''' = tornato − puntato, il netto (sotto zero sono «persi ai giochi»);
* '''lavoro e premi''' = i soldi nuovi, il conio;
* '''guadagnati in tutto''' = giochi + lavoro e premi + vendite − spese ± lumachina − morti + rapine; gli invii e i cambi in EUR€ non contano: spostano i soldi, non li fanno.
Le vincite di almeno 1.500 $pzk in un giro fanno notizia dal server (<code>notizieVincite</code>, [[Le notizie della banca]]). Gli altri numeri del profilo (pescati, quiz, comandi…) restano quelli dello zaino. Il comando <code>profilo</code> della [[La chat col bot|chat col bot]] e le classifiche di <code>api/_giocatori.mjs</code> leggono lo stesso modulo.

== Dal 31.10 ==
Con la [[La banca sul server|banca sul server]] è <code>banca\\libro.mjs</code> a scrivere il libro a ogni azione (<code>x.gioca</code>, <code>x.spendi</code>, <code>x.paga</code>, <code>x.perdi</code>), con l'ora del server; il browser lo legge e basta.

{{Vedi anche|Le classifiche|I lotti numerati|Profilo (app)|Giocatori (app)|L'economia}}
[[Categoria:I soldi]]`,
  },

  'Le classifiche': {
    data: '2026-10-29',
    fonti: ['albertopecchini.it/pzkko/api/giocatori.mjs', 'albertopecchini.it/pzkko/api/giocatori.mjs', 'albertopecchini.it/pzkko/chat/db.js', G + 'libro.mjs', README],
    testo: `[[File:app-giocatori.webp|thumb|le classifiche nell'app Giocatori del cercapersone zero: il podio coi numeri rovesciati]]
'''Le classifiche''' di [[pzkko.it]] ordinano i giocatori col conto per diciassette metriche: i $pzk, il livello, i vinti ai giochi, i guadagnati in tutto, i pescati, i cacciati, gli scavati, i comandi, i turni di lavoro, i quiz giusti, le sfide, le quest, le mani ai giochi grandi, il colpo migliore, i giorni di fila… Si vedono in [[Giocatori (app)]] del [[Il cercapersone zero|cercapersone zero]] (il podio coi numeri rovesciati, la faccia, il nome, il valore) e con il comando <code>classifica [metrica]</code> della [[La chat col bot|chat col bot]]; <code>rivale</code> mostra chi hai davanti e dietro.

== Da dove vengono i numeri ==
Dal [[Il database dei giocatori|database dei giocatori]] (<code>pzkko/giocatori.json</code>: la riga pubblica di ogni giocatore, aggiornata a ogni salvataggio dello zaino e unita ai conti del wallet a ogni richiesta, così i $pzk sono sempre quelli veri) e, dal 29.10.2026, dal [[Il libro dei conti|libro dei conti]] di ogni conto: i vinti ai giochi sono il netto, i guadagnati in tutto la somma vera. Prima li contava il browser nello zaino e si potevano falsare.

== L'API ==
<code>GET /api/giocatori/?top=&lt;metrica&gt;</code> la classifica, <code>?cerca=</code> la ricerca, <code>?ind=pzk123456</code> il profilo con la posizione in ogni classifica, <code>?stats=1</code> i numeri della banca, <code>?notizie=1</code> le [[Le notizie della banca|notizie]]; <code>POST { token, vicini }</code> per il proprio profilo e i rivali. Mai il PIN né gli oggetti uno per uno. Nel profilo pubblico vanno anche la faccia, il colore e il motto ([[Le facce del profilo]]) e i giochi grandi (<code>gi</code>).

== Nel profilo ==
Col conto, [[Profilo (app)]] mostra le posizioni in classifica nella sesta pagina; senza conto, o col server che non risponde, lo dice. Sullo zero le classifiche arrivano da <code>chat/db.js</code>, e nel collaudo c'è un database finto (<code>--server-finto</code>).

{{Vedi anche|Il libro dei conti|Il database dei giocatori|Giocatori (app)|Profilo (app)|Le notizie della banca}}
[[Categoria:I soldi]]`,
  },

  'Il regalo di Instagram': {
    data: '2026-10-22',
    fonti: [G + 'pzk.js', 'albertopecchini.it/pzkko/api/wallet.mjs', README],
    testo: `'''Il regalo di Instagram''' è la riga «seguimi su instagram: +1000 $pzk» che compare nei [[I giochi|giochi]], nel [[Il wallet|wallet]] e nella pagina «altro» dell'[[Account (app)|account]]: il link apre il profilo di [[Alberto Pecchini]] (instagram.com/albertoxpecchini) e, quando si torna sulla pagina (o dopo 8 secondi), arrivano '''1.000 [[I $pzk|$pzk]]''', una volta sola.

== Una volta per chi ==
* per browser nella [[La sessione|sessione]] (<code>pzkko-pzk-ig</code> in <code>sessionStorage</code>);
* per conto col [[Il conto|conto]]: lo segna il server (<code>c.ig</code>), così non si prende due volte da due dispositivi.
Un sito non può sapere chi segue chi, quindi ci si fida. I 1.000 sono una '''promessa''' ([[I lotti numerati]]): si vedono subito nel saldo e li conferma il server; per l'[[L'economia|economia]] sono conio, soldi nuovi che fanno crescere l'[[L'offerta di $pzk|offerta]].

== Instagram sul muro ==
Lo stesso profilo è il volantino «instagram» della zona social del [[Il muro|muro]], coi [[I tagliandi|tagliandi]] da strappare, e dal 21.10 c'è anche [[TikTok sul muro]] con lo stesso handle.

{{Vedi anche|I $pzk|Il sussidio|Alberto Pecchini|Le zone del muro}}
[[Categoria:I soldi]]`,
  },

  'Il sussidio': {
    data: '2026-10-22',
    fonti: [G + 'pzk.js', 'albertopecchini.it/pzkko/api/wallet.mjs', README],
    testo: `'''Il sussidio''' è quello che [[pzkko.it]] dà a chi ha [[il conto|Il conto]] ed è rimasto a secco: '''1.000 [[I $pzk|$pzk]] una volta al giorno''' (il giorno di Mantova), dato dal server (<code>api/wallet.mjs</code>) quando un gioco trova un conto con meno di 1 $pzk libero e niente sui tavoli.

== L'ordine delle cose ==
Un gioco a secco guarda prima se ci sono [[Gli EUR€|EUR€]]: se sì apre il cambio nell'[[Account (app)|account]] per convertirli al cambio del momento; se no chiede il sussidio, e <code>perche()</code> dice al gioco cosa scrivere. Con la [[La sessione|sessione]] non c'è sussidio: a secco si ricevono altri 1.000 senza limiti. Il sussidio è una promessa ([[I lotti numerati]]): si vede subito e lo conferma il server.

== Nell'economia ==
È conio: soldi nuovi che fanno crescere l'[[L'offerta di $pzk|offerta]] e, nella [[La borsa|borsa]], pesano sul cambio come gli altri soldi dal nulla. Nel [[Il libro dei conti|libro dei conti]] sta fra «lavoro e premi». Il comando <code>elemosina</code> della [[La chat col bot|chat col bot]] è un'altra cosa: un comando con la sua attesa, che dà spiccioli.

{{Vedi anche|I $pzk|Il conto|Gli EUR€|Il regalo di Instagram|L'economia}}
[[Categoria:I soldi]]`,
  },

  'Il wallet': {
    data: '2026-10-31',
    fonti: ['albertopecchini.it/pzkko/wallet/wallet.js', 'albertopecchini.it/pzkko/wallet/wallet.css', 'albertopecchini.it/pzkko/wallet/banner.js', 'albertopecchini.it/pzkko/api/wallet.mjs', 'albertopecchini.it/pzkko/api/borsa.mjs', README],
    testo: `{{Infobox
| titolo = Il wallet
| immagine = wallet.webp
| didascalia = il portafoglio di pelle aperto, con gli schermi accesi
| dove = pzkko.it/#wallet, il banner in cima alla prima pila del muro
| dal = 22 ottobre 2026 notte
| file = wallet/wallet.js, wallet/banner.js, wallet.css; api/wallet.mjs, api/borsa.mjs
| foto = art/wallet/portafoglio.webp, art/wallet-banner/banner.webp (gpt-image-2)
| dentro = il saldo in $pzk, gli EUR€, la batteria, l'indirizzo, la borsa
}}
'''Il wallet''' è il portafoglio di [[pzkko.it]] (22.10.2026 notte, commit 84bebc5: «il wallet dei $pzk, la borsa PZK/EUR€ e le banconote perse per terra»): un portafoglio di pelle usato, aperto, customizzato come un Pip-Boy di Fallout, in cui si leggono [[i $pzk|I $pzk]], [[gli EUR€|Gli EUR€]], la [[La batteria|batteria]] e [[la borsa|La borsa]]. Si apre dal [[Il banner del wallet|banner]] avvitato in cima alla prima pila del [[Il muro|muro]], con <code>#wallet</code> nell'indirizzo, dal comando <code>banca</code> della [[La chat col bot|chat]] e con <code>pzk.apriWallet()</code>.

== La foto ==
<code>art/wallet/portafoglio.webp</code> (foglio «wallet» di <code>tools/pzkko/fogli.js</code>, [[gpt-image-2]]): la pelle, la piastra d'acciaio rivettata, il nastro adesivo, i tasti gialli, la manopola, la porta usb-c sul fianco sinistro. Gli schermi nella foto sono spenti: li accende <code>wallet.js</code> in percentuale sulla foto (<code>POS</code>). Dal 23.10 si apre grande quanto entra nella finestra e nel mezzo, per leggere bene gli schermi; niente «×», si chiude toccando fuori. Aprendolo qualche '''mosca''' esce dalle taschine (quella sotto il saldo e quella delle banconote; otto se sei al verde), ronza e vola via (<code>mosche()</code>, le mosche di <code>art/mosche/</code>, le stesse del muro).

== Gli schermi ==
A sinistra il '''saldo in $pzk''' a led verdi (sotto, quanto vale in €), gli '''EUR€''' a led ambra, la '''batteria''' su un lcd e la targhetta incisa con l'indirizzo del conto (dal 23.10 misurata sulla foto, 66–71 %, perché «SESSIONE» stesse nel mezzo e non sul bordo, lontano dai rivetti). A destra la '''borsa''': il grafico del cambio PZK/EUR€, la manopola che gira il periodo (24 ore, 7 giorni, 30 giorni, da sempre: dal 23.10 il pomello gira davvero, un quarto di giro a scatto e sempre in senso orario, il pezzo di foto ritagliato tondo con la tacca gialla), il cambio e il suo inverso, la variazione del periodo, la capitalizzazione e i [[I fattori del mondo|fattori del momento]]. Le lettere sono il [[Il font Fake Receipt|font Fake Receipt]], dal 22.10 «il wallet tutto in Fake Receipt, la borsa come i grafici delle crypto, le scritte che non escono dai riquadri» (4d10809). Il cavo di ricarica è una foto (<code>art/wallet-cavo/</code>), un pezzo unico dalla spina allo schermo, che scende fino al bordo in basso e lì si taglia (i quattro commit del 22.10 sul cavo).

== Solo saldo e borsa ==
{{Citazione|in portafoglio solo saldo e borsa · l'account lo crei dal cercapersone|Alberto, 26.10.2026}}
Dal 23.10 al 26.10 i quattro tasti gialli aprivano dentro lo schermo del grafico le pagine conto, cambio, invia e altro; dal 26.10 quelle pagine sono [[Account (app)]] del [[Il cercapersone zero|cercapersone zero]], e i tasti gialli della foto ci portano, ognuno sulla sua scheda: il wallet si chiude e si apre il cercapersone. <code>pzk.apriWallet('entra' | 'converti' | 'invia' | 'altro')</code> apre direttamente l'app sulla scheda giusta (i giochi a secco con EUR€, la chat). Sullo zero il wallet non si apre nemmeno: [[Banca (app)]] è il wallet a un bit.

== Sulla serranda ==
{{Citazione|nella serranda, nulla in sospeso: avvitato, incollato, appeso… ma sono come dei volantini|Alberto, 26.10.2026}}
Prima il wallet e il cercapersone erano sospesi, fissi in alto a sinistra; dal 26.10 sono pezzi della parete (<code>#wallet-muro</code> in cima alla prima pila, avvitato con quattro viti, <code>art/muro/viti.svg</code>), nelle [[Le pile|pile]] di <code>disposizione.js</code> come gli altri, e scorrono col muro. Nella [[La scena 3D|scena 3D]] li disegna una tela viva (<code>scena/fogli.js</code>, <code>viva</code>) che ricopia dieci volte al secondo le loro immagini e i canvas accesi, e il bottone resta sopra, trasparente, per i clic. Gli strumenti che fotografano la pagina non lo vedono (<code>navigator.webdriver</code>), <code>?wallet</code> sì.

== Il server ==
Il wallet parla con <code>api/wallet.mjs</code> ([[Il wallet (API)]]) e <code>api/borsa.mjs</code> ([[La borsa (API)]]), riesportate da <code>albertopecchini.it/api/wallet.js</code> e <code>borsa.js</code> finché la Root Directory di Vercel resta lì; i conti stanno sul [[Il server dei dati in casa|server dei dati in casa]]. Senza il server rispondono «offline» e la home va avanti coi 1.000 della sessione (il wallet lo dice). Moderazione: <code>node tools/pzkko/wallet.mjs</code>.

{{Vedi anche|Il banner del wallet|La borsa|Gli EUR€|La batteria|I conti|Account (app)|Banca (app)|Il font Fake Receipt}}
[[Categoria:I soldi]]`,
  },

  'Il banner del wallet': {
    data: '2026-10-26',
    fonti: ['albertopecchini.it/pzkko/wallet/banner.js', 'albertopecchini.it/pzkko/index.html', README],
    testo: `[[File:/art/wallet-banner/banner.webp|thumb|la striscia di pelle cucita con la piastra rivettata e il pannello a led]]
'''Il banner del wallet''' è il pezzo del [[Il muro|muro]] da cui si apre [[il wallet|Il wallet]]: una striscia di pelle cucita con la piastra d'acciaio rivettata e un pannello a led lungo, dal 23.10.2026 sera (commit e3555a2: «il tasto del wallet diventa un banner di pelle col pannello a led»), al posto del tasto in alto a sinistra del 22.10. Dal 26.10 è avvitato in cima alla prima pila con quattro viti (<code>art/muro/viti.svg</code>) e scorre col muro.

== La foto e il vetro ==
<code>art/wallet-banner/banner.webp</code>, foglio «wallet-banner» di <code>tools/pzkko/fogli.js</code> ([[gpt-image-2]]); il vetro del pannello è misurato sulla foto, da x 62 a 713 e da y 63,5 a 154,5 su 792 × 214.

== Il pannello a led ==
Lo accende <code>wallet/banner.js</code>: dice '''sempre i $pzk''' a destra, come un registratore di cassa; '''col cursore sopra''' (o col fuoco della tastiera) ci scorrono tutti i dati del wallet come su un tabellone di borsa: saldo, sul tavolo, EUR€, quanto valgono in euro, PZK/EUR€ con ▲▼ delle 24 ore e dell'ultima ora, il grafico delle 24 ore fatto di led, min e max, 1 € in $pzk, capitalizzazione e conti, nome e indirizzo, batteria, ultima mossa, ora del cambio; ogni voce si scrive coi dati del momento in cui entra nel nastro. '''Col clic''' si apre il wallet; al tocco niente nastro, il dito apre direttamente. Quando il saldo cambia lampeggia la differenza e il numero corre al valore nuovo.

Le lettere sono il [[Il font Fake Receipt|Fake Receipt]] messo led per led: il carattere è una matrice di 5 × 8 puntini (passo 93 unità), i centri trovati con la trasformata di distanza e agganciati alla griglia; M, W, €, S, $, ° e la punteggiatura rifatti a mano sulla stessa griglia (la tabella <code>LETTERE</code>). Per non far lavorare la pagina a vuoto ([[Ferma quando è ferma]]) il pannello disegna solo quando cambia qualcosa.

== Nella scena 3D ==
Il banner è «vivo»: <code>scena/fogli.js</code> ricopia dieci volte al secondo il canvas acceso su una tela della saracinesca, con un filo di luce sua, e il bottone resta sopra, trasparente, per i clic; <code>cattura.mjs</code> non lo fotografa. Il [[Il cercapersone zero|cercapersone zero]], appeso a un chiodo in cima alla seconda pila, è vivo allo stesso modo.

{{Vedi anche|Il wallet|I $pzk|Il font Fake Receipt|Le pile|Ferma quando è ferma}}
[[Categoria:I soldi]]
[[Categoria:Il muro]]`,
  },

  'La batteria': {
    data: '2026-10-29',
    fonti: ['albertopecchini.it/pzkko/wallet/wallet.js', 'albertopecchini.it/pzkko/telefono/zero/os/os.js', 'albertopecchini.it/pzkko/index.html', README],
    testo: `'''La batteria''' è il piccolo lcd del [[Il wallet|wallet]] e la tacca nella [[La barra di stato|barra di stato]] del [[Il cercapersone zero|cercapersone zero]]: una batteria finta che segue l'ora vera di Mantova.

== Il ciclo del giorno ==
100 % alle 7 di mattina, 2 % alle 7 di sera, poi in carica fino alle 7 col cavo usb-c infilato nella porta (dalle 19 alle 7). L'ora è quella di <code>window.pzkkoOrologio</code>, e «la luce non è il gioco»: le batterie seguono l'ora vera anche quando la pagina sta ferma a mezzogiorno con «sempre giorno» scelto nella [[La regia|regia]] (<code>window.pzkkoOrologio.perGioco()</code>: l'ora vera se l'orologio è fermo a mezzogiorno, quella della regia se la si sposta per provare). Sul cercapersone zero, in carica, [[Il cavo di ricarica|il cavo]] entra nella porta sulla testata: arriva da destra inclinato, tocca, si raddrizza cercando il buco, spinge e scatta dentro.

== Quella vera ==
Dal 29.10 (Alberto: «metti dati veri tipo quelli del pc tipo wifi») la barra di stato di [[pzk os]] mostra la '''batteria vera''' dove il browser la dice (<code>navigator.getBattery</code>), e quella del gioco come nel wallet dove non la dice; un PC fisso dice sempre 100 % in carica, e lì il cavo c'è sempre. Accanto, il ping vero: una HEAD a <code>/favicon.png</code> all'apertura e ogni 30 secondi, mostrato a tacche.

{{Vedi anche|Il wallet|La barra di stato|Il cavo di ricarica|La sera a Mantova}}
[[Categoria:I soldi]]
[[Categoria:Il cercapersone]]`,
  },

  'Gli EUR€': {
    data: '2026-10-29',
    fonti: ['albertopecchini.it/pzkko/wallet/wallet.js', 'albertopecchini.it/pzkko/api/wallet.mjs', 'albertopecchini.it/pzkko/api/borsa.mjs', README],
    testo: `'''Gli EUR€''' sono l'«euroshit», l'euro finto del [[Il wallet|wallet]] di [[pzkko.it]]: il nome viene dall'album ''Euroshit'' di Yung Pips, il rapper torinese (lo stesso nome della palette «cemento e verde fluo» che il sito di Alberto aveva avuto l'11.9.2026, commit 701ff2d), un euro che vale quello che vale. Per finta non varia mai: a muoversi è solo il [[I $pzk|$pzk]], nel [[Il cambio PZK/EUR€|cambio PZK/EUR€]].

== A cosa servono ==
Non si prelevano, non si depositano, non si giocano: servono a '''parcheggiare''' i $pzk quando si pensa che scendano e a riprenderli quando conviene, sempre al cambio del momento. Il cambio è la seconda pagina dell'[[Account (app)|account]] (un cursore: $pzk → EUR€ o EUR€ → $pzk, con la conferma); nel wallet si leggono a led ambra, nel [[Il banner del wallet|banner]] scorrono nel nastro, in [[Banca (app)]] stanno sotto il saldo. Quando un gioco trova un [[Il conto|conto]] a secco con EUR€ dentro, apre il cambio invece del [[Il sussidio|sussidio]]; sotto il saldo di ogni gioco la riga <code>rigaEuro()</code> dice «hai anche EUR€ 12,50 nel wallet: convertili in $pzk».

== Le regole ==
* le conversioni usano il cambio di quando il wallet si è sincronizzato (il browser manda <code>t</code>, il server ricalcola <code>tassoA(t)</code>), purché non sia passata più di mezz'ora: dopo, il wallet si sincronizza da sé;
* gli EUR€ non entrano nell'[[L'offerta di $pzk|offerta]] né nella capitalizzazione: sono $pzk messi da parte;
* i [[I soldi sporchi|soldi sporchi]] non si cambiano in EUR€, e [[la lumachina|La lumachina]] non li tocca mai;
* i cambi non contano fra i «guadagnati in tutto» del [[Il libro dei conti|libro dei conti]]: spostano i soldi, non li fanno;
* con la [[La sessione|sessione]] non ci sono.

{{Vedi anche|Il wallet|La borsa|Il cambio PZK/EUR€|Account (app)|I $pzk}}
[[Categoria:I soldi]]`,
  },

  'La borsa': {
    data: '2026-10-29',
    fonti: ['albertopecchini.it/pzkko/api/borsa.mjs', 'albertopecchini.it/pzkko/api/borsa.mjs', 'albertopecchini.it/pzkko/wallet/wallet.js', 'albertopecchini.it/pzkko/telefono/zero/os/banca.js', README],
    testo: `[[File:app-banca.webp|thumb|la borsa a un bit in Banca (app): la linea che si disegna da sinistra, l'ultimo punto che lampeggia]]
'''La borsa''' di [[pzkko.it]] è il mercato dei [[I $pzk|$pzk]]: il cambio PZK/EUR€, una serie vera di punti che va avanti da sola dalla notte del 22.10.2026, quando 1 $pzk valeva 1 €, e che sale e scende per un umore a caso, per quello che succede nel mondo e per quanti soldi vengono coniati. Si legge nel [[Il wallet|wallet]] (il grafico con la manopola dei periodi), nel [[Il banner del wallet|banner]] (il grafico delle 24 ore fatto di led) e in [[Banca (app)]] del cercapersone.

== La serie ==
{{Principale|Il cambio PZK/EUR€}}
Un punto ogni dieci minuti (dieci minuti per l'ultima settimana, un'ora fino a tre mesi, poi un giorno), in <code>pzkko/borsa.json</code> sul [[Il server dei dati in casa|server dei dati in casa]]. Ogni passo è un caso deterministico dall'ora del punto (il passato non si riscrive) più una deriva: l''''umore del giorno''' (a caso fra −5 % e +5 % al giorno; con probabilità 4 % un giorno è un'eccezione, come le crypto: ±10–30 % e il doppio del nervosismo) e i [[I fattori del mondo|fattori del mondo]], misurati quando si aggiunge un punto. Dal 23.10 il grafico «sembra una crypto: onde, rumore, strappi e regimi sopra la tendenza» (commit 87f164a).

== L'inflazione ==
Dal 26.10 ([[L'economia]]) la borsa tiene conto del conio: metà della crescita dell'offerta nelle ultime 24 ore (al più ±5 % al giorno) si toglie dalla deriva del cambio (<code>_borsa.mjs</code>, <code>inflazione</code>). Più soldi nascono dal nulla, meno vale il singolo $pzk; i [[I portafogli smarriti|portafogli smarriti]] che si distruggono dopo 96 giorni fanno il contrario. La '''capitalizzazione''' è l'[[L'offerta di $pzk|offerta]] per il cambio (<code>api/borsa.mjs</code>, <code>cap</code>).

== Dove si legge ==
* nel wallet: il grafico, la manopola (24 ore, 7 giorni, 30 giorni, da sempre), il cambio e il suo inverso, la variazione del periodo, la capitalizzazione (i $pzk di tutti i conti, quanti conti) e i fattori del momento (il meteo, la temperatura, giorno o notte, se c'è stato un commit); il 23.10 la quota dell'asse non finisce più sotto l'etichetta del prezzo attuale (3c9e6d0);
* in Banca (app): il cambio grande, la linea che si disegna da sinistra con l'area a puntini, l'apertura tratteggiata, l'ultimo punto che lampeggia, ↑ ↓ cambiano il periodo (ricordato insieme al pomello del wallet), OK accende il cursore e ← → lo spostano con il cambio di quel momento in cima; senza rete «la borsa è chiusa»;
* da riga di comando: <code>node tools/pzkko/wallet.mjs borsa</code>;
* dall'API: <code>/api/borsa/?da=24h|7g|30g|tutto</code> ([[La borsa (API)]]) dà il cambio, le variazioni, i fattori, la serie e la capitalizzazione, con un minuto di cache sulla rete di Vercel.

== Cosa si può fare ==
Comprare e vendere [[Gli EUR€|EUR€]] al cambio del momento, e basta: niente ordini, niente leva, niente altri titoli. Per l'[[L'economia|economia]] un cambio è un trasferimento: non crea e non distrugge $pzk.

{{Vedi anche|Il cambio PZK/EUR€|I fattori del mondo|Gli EUR€|Il wallet|Banca (app)|L'economia|La borsa (API)}}
[[Categoria:I soldi]]`,
  },

  'Il cambio PZK/EUR€': {
    data: '2026-10-26',
    fonti: ['albertopecchini.it/pzkko/api/borsa.mjs', 'albertopecchini.it/pzkko/api/borsa.mjs', README],
    testo: `'''Il cambio PZK/EUR€''' è il prezzo di un [[I $pzk|$pzk]] in [[Gli EUR€|EUR€]], la serie che fa [[la borsa|La borsa]] di [[pzkko.it]]: nata a '''1 $pzk = 1 €''' la notte del 22.10.2026 (<code>api/_borsa.mjs</code>, <code>pzkko/borsa.json</code>).

== Come si muove ==
* '''un punto ogni dieci minuti''', tenuti a dieci minuti per l'ultima settimana, a un'ora fino a tre mesi, poi a un giorno;
* ogni passo è un caso '''deterministico''' dall'ora del punto, così il passato non si riscrive e chi guarda da due browser vede la stessa linea;
* più una '''deriva''': l'umore del giorno (a caso fra −5 % e +5 % al giorno; il 4 % dei giorni è un'eccezione, ±10–30 % e il doppio del nervosismo) e i [[I fattori del mondo|fattori del mondo]];
* meno l''''inflazione''' (dal 26.10): metà della crescita dell'[[L'offerta di $pzk|offerta]] nelle ultime 24 ore, al più ±5 % al giorno.

== Il cambio che vale per te ==
Le conversioni usano il cambio di quando il wallet si è sincronizzato: il browser manda <code>t</code> e il server ricalcola <code>tassoA(t)</code>, purché non sia passata più di mezz'ora; dopo, il wallet si sincronizza da sé e vale il cambio nuovo. Nel wallet e nel banner si leggono anche l'inverso (1 € in $pzk), le variazioni ▲▼ delle 24 ore e dell'ultima ora, min e max del periodo.

{{Vedi anche|La borsa|I fattori del mondo|Gli EUR€|La borsa (API)}}
[[Categoria:I soldi]]`,
  },

  'I fattori del mondo': {
    data: '2026-10-22',
    fonti: ['albertopecchini.it/pzkko/api/borsa.mjs', README],
    testo: `'''I fattori del mondo''' sono le cose vere che spingono [[il cambio PZK/EUR€|Il cambio PZK/EUR€]] quando [[la borsa|La borsa]] aggiunge un punto, ogni dieci minuti, misurate in quel momento dal server (<code>api/_borsa.mjs</code>):

{| class="wikitable"
! fattore !! da dove !! effetto sulla deriva
|-
| un '''commit''' di Alberto nelle ultime 24 ore || GitHub, il repository albertoxpecchini/AP ([[Il repository AP]]) || +3 % al giorno; nessun commit −2 %
|-
| il '''meteo''' di Mantova || [[Open-Meteo]], lo stesso di <code>/api/meteo</code> || sole +2 %, pioggia o temporale −2 %, neve −1 %
|-
| la '''temperatura''' || Open-Meteo || sopra i 26° −1,5 %, sotto gli 8° +1,5 %
|-
| '''giorno o notte''' || l'ora di Mantova (l'alba e il tramonto col calcolo NOAA) || il giorno +1,2 %, la notte −1,2 %
|}

Sotto di loro c'è l'umore del giorno a caso, e dal 26.10 l'inflazione del conio. I fattori del momento si leggono nel [[Il wallet|wallet]] accanto al grafico (il meteo, la temperatura, giorno o notte, se c'è stato un commit), nel nastro del [[Il banner del wallet|banner]] e dall'[[La borsa (API)|API della borsa]] (<code>fattori</code>). Le chiamate a GitHub senza token sono 60 l'ora per IP: dagli IP di Vercel possono finire, e allora il fattore commit non conta; <code>GITHUB_TOKEN</code> nel progetto Vercel lo evita. Quindi, letteralmente, ogni push su main fa salire i $pzk.

{{Vedi anche|La borsa|Il cambio PZK/EUR€|Open-Meteo|Il repository AP|La sera a Mantova}}
[[Categoria:I soldi]]`,
  },

  'I conti': {
    data: '2026-10-31',
    fonti: ['albertopecchini.it/pzkko/api/wallet.mjs', 'albertopecchini.it/pzkko/api/_server.mjs', T + 'wallet.mjs', README],
    testo: `'''I conti''' sono i record dei giocatori registrati di [[pzkko.it]], tenuti da <code>api/wallet.mjs</code> ([[Il wallet (API)]]) in <code>pzkko/wallet.json</code> sul [[Il server dei dati in casa|server dei dati in casa]] (fino al 28.10.2026 su [[Vercel Blob]]). La voce [[Il conto]] racconta cosa può fare chi ne ha uno; qui c'è com'è fatto il record e cosa controlla il server.

== Il record ==
* il '''nome''': 2–20 lettere, unico, senza accenti né maiuscole; i nomi riservati (pzkko, alberto, admin, banca…) si creano solo con la chiave di amministrazione (<code>PZKKO_ADMIN_KEY</code>, o la stessa <code>FIRME_ADMIN_KEY</code>: il repository è pubblico, un PIN nel codice non sarebbe un segreto), e la carta chiede la chiave quando il nome è quello, oppure <code>node tools/pzkko/wallet.mjs crea pzkko &lt;pin&gt;</code>;
* il '''PIN''' di quattro cifre, con scrypt e sale; non si recupera, si cambia dalla pagina «altro»;
* l''''indirizzo''' «pzk» più sei cifre, a caso ma uniche; si cambia '''una volta sola''' con sei cifre proprie (agli studenti unimore si consiglia il numero della loro e-mail);
* i $pzk, i puliti e gli [[I soldi sporchi|sporchi]], gli [[Gli EUR€|EUR€]], le ultime 40 mosse, lo [[Lo zaino|zaino]], il [[Il libro dei conti|libro]], <code>c.disp</code> (l'ultimo lotto di ogni dispositivo, tre giorni), <code>c.es</code> (i soldi arrivati da fuori), <code>c.lumaca</code> (le ultime 14 giornate), <code>c.agg</code> (la versione), la galera, il lavaggio, i colpi.

== I controlli ==
* l'accesso dà un token firmato (HMAC con <code>WALLET_SECRET</code>; senza, derivato dal token del Blob, e cambiando store i token scadono) che vale 180 giorni;
* il saldo che mandava il browser si accettava se aveva senso: non più di 20.000 + 1.200 $pzk al secondo dall'ultimo salvataggio; se no si rispondeva col saldo salvato e il browser si allineava; dal 29.10 [[I lotti numerati]], dal 31.10 la [[La banca sul server|banca sul server]];
* [[gli invii|Gli invii]] si aprono 48 ore dopo la creazione del conto, così creare conti nuovi per regalarsi i loro 1.000 non è una strada; al massimo 3 conti al giorno per IP, 8 tentativi di accesso in dieci minuti per nome;
* le [[Le banconote della banca $pzk|banconote per terra]] una volta al giorno ciascuna (il giorno di Mantova), il [[Il sussidio|sussidio]] una volta al giorno a chi è a secco;
* i soldi che arrivano da fuori (un invio ricevuto, un'[[Le operazioni della banca|operazione della banca]]) hanno un numero: il browser manda <code>es</code>, l'ultimo che conosce, e il server aggiunge quelli dopo al saldo che riceve, così un browser aperto col saldo di prima non li cancella;
* '''le chiamate vanno con la barra finale''' (<code>/api/wallet/</code>, <code>/api/giocatori/</code>, <code>/api/borsa/?…</code>, <code>/api/meteo/</code>): il sito ha <code>trailingSlash</code>, e senza barra ogni POST passava da un redirect 308 che alcuni browser facevano confermare a ogni salvataggio («inviare nuovamente i dati del modulo?», corretto il 23.10, cd1945d).

== In locale e la moderazione ==
Con <code>npm run dev:pzkko</code> l'archivio sta in memoria e si svuota a ogni avvio; dal 29.10 notte in locale si è sempre dentro come pzkko (<code>/__dev/accesso</code> di <code>tools/dev.mjs</code>, solo da questo computer o dalla rete Tailscale; <code>?ospite</code> lascia senza conto). <code>node tools/pzkko/wallet.mjs</code> elenca i conti, <code>via &lt;nome&gt;</code> ne cancella uno, <code>--locale</code> parla col server di prova. Il 22.10 la chiave di amministrazione è stata «ripulita da spazi, virgolette e PZKKO_ADMIN_KEY=» (e697652) e il 29.10 «il segreto del server si legge anche incollato male» (6a0d6bd).

{{Vedi anche|Il conto|Il wallet (API)|Gli invii|Il conto di Alberto|Il server dei dati in casa|La banca sul server|Cosa si salva}}
[[Categoria:I soldi]]`,
  },

  'Gli invii': {
    data: '2026-10-29',
    fonti: ['albertopecchini.it/pzkko/api/wallet.mjs', 'albertopecchini.it/pzkko/telefono/zero/os/account.js', 'albertopecchini.it/pzkko/chat/comandi/soldi.js', README],
    testo: `'''Gli invii''' sono i trasferimenti di [[I $pzk|$pzk]] fra due [[I conti|conti]] di [[pzkko.it]]: si fanno dalla pagina «invia» dell'[[Account (app)|account]] (l'indirizzo a cifre e il nome di chi è, quanti, la conferma) o con il comando <code>manda pzk123456 50</code> della [[La chat col bot|chat col bot]] (era <code>dai</code>/<code>invia</code>, che restano come alias; dal 23.10 «manda al posto di invia», ba0a038). Dalla scheda di un giocatore in [[Giocatori (app)]] c'è il tasto «manda $pzk».

== Le regole ==
* in $pzk, almeno 1, solo [[I soldi sporchi|puliti]];
* si aprono '''48 ore dopo la creazione del conto''': creare conti nuovi per regalarsi i loro 1.000 non è una strada; il [[Il conto di Alberto|conto di Alberto]] non aspetta;
* chi riceve ha un numero per ogni invio (<code>c.es</code>): il browser manda l'ultimo che conosce e il server aggiunge gli altri al saldo, così un browser aperto col saldo di prima non li cancella né li duplica a chi manda;
* non cambiano l'[[L'offerta di $pzk|offerta]] e non contano fra i «guadagnati in tutto» del [[Il libro dei conti|libro dei conti]]: spostano i soldi;
* finiscono fra le ultime 40 mosse di tutti e due i conti («ricevuto … da pzk111111», con il nome).
Il primo invio della storia è un'[[Le operazioni della banca|operazione della banca]]: 5.000 $pzk da pzk398893 a pzk113089, il 23.10.2026.

{{Vedi anche|I conti|Account (app)|Le operazioni della banca|Il conto di Alberto|I comandi della chat}}
[[Categoria:I soldi]]`,
  },

  'Le operazioni della banca': {
    data: '2026-10-23',
    fonti: ['albertopecchini.it/pzkko/api/wallet.mjs', README],
    testo: `'''Le operazioni della banca''' sono i passaggi di [[I $pzk|$pzk]] che [[Alberto Pecchini|Alberto]] chiede e che il server di [[pzkko.it]] fa da solo, una volta sola: la lista <code>OPERAZIONI</code> in <code>api/wallet.mjs</code>, eseguita alla prima richiesta di ogni istanza della funzione e segnata in <code>db.operazioni</code>; quelle non andate si ritentano, e <code>GET /api/wallet/?operazioni=1</code> dice com'è andata.

== La prima ==
5.000 $pzk da pzk398893 ([[il conto di Alberto|Il conto di Alberto]]) a pzk113089, il 23.10.2026 (commit f4ca651: «le operazioni della banca e i soldi da fuori che un browser vecchio non cancella»). Lo stesso giorno la correzione dei 5.000 di Alberto (2138696: «un browser col saldo di prima non rimette più i soldi già mandati»): da lì i soldi che arrivano da fuori hanno un numero (<code>c.es</code>) e un browser aperto col saldo vecchio non li cancella.

== E le altre ==
Dal 31.10 ([[La banca sul server]]) i movimenti della cassa passano dal server in casa, con la [[La regia del server|regia del server]] che li vede in diretta; un'operazione nuova si scrive lì. I colpi riusciti e le retate delle [[La rapina|rapine]] e le catastrofi della [[La lumachina|lumachina]] fanno le [[Le notizie della banca|notizie della banca]], che sono un'altra cosa: notizie, non passaggi.

{{Vedi anche|I conti|Gli invii|Il conto di Alberto|La cassa di pzk|Le notizie della banca}}
[[Categoria:I soldi]]`,
  },

  'Il conto di Alberto': {
    data: '2026-10-29',
    fonti: ['albertopecchini.it/pzkko/api/wallet.mjs', 'albertopecchini.it/tools/dev.mjs', README],
    testo: `'''Il conto di Alberto''' è «pzkko», indirizzo '''pzk398893''' (il numero della sua e-mail unimore): il [[Il conto|conto]] di [[Alberto Pecchini]] su [[pzkko.it]], che si distingue da tutti gli altri perché non ha limiti e perché non è la [[La cassa di pzk|cassa di pzk]].
{{Citazione|il mio account non ha limiti|Alberto, 23.10.2026}}

== Senza limiti ==
<code>illimitato</code> in <code>api/wallet.mjs</code>: niente attesa di 48 ore per [[gli invii|Gli invii]] e niente controllo dei salti del saldo; i soldi restano soldi, non manda più di quello che ha. Il nome «pzkko» (come alberto, admin, banca…) si crea solo con la chiave di amministrazione (<code>PZKKO_ADMIN_KEY</code>), o con <code>node tools/pzkko/wallet.mjs crea pzkko &lt;pin&gt;</code>.

== Non è la cassa ==
La cassa di pzk, dove finiscono le puntate perse e gli acquisti, è il conto «banca pzk», <code>pzk000001</code> (<code>BANCA</code> in <code>api/_economia.mjs</code>): non è quello di Alberto e non ci si entra. La prima delle [[Le operazioni della banca|operazioni della banca]] è partita però dal suo: 5.000 $pzk a pzk113089 il 23.10.

== In locale ==
Dal 29.10 notte, sul server di prova (localhost e gli indirizzi numerici), si è sempre dentro come pzkko (Alberto: «fai che in local abbia sempre il log fatto con pzkko»): <code>games/pzk.js</code> chiede <code>/__dev/accesso</code> a <code>tools/dev.mjs</code>, che lo dà solo a chi chiede da questo computer o dalla rete Tailscale (100.64.0.0/10; dalla rete di casa o dell'università 403); il token lo firma il wallet con <code>accessoLocale</code>, esportata ma non handler, quindi online non c'è nessun indirizzo che la chiami. L'archivio locale sta in memoria e il conto pzkko nasce lì, senza PIN, la prima volta che serve; <code>?ospite</code> lascia senza conto.

{{Vedi anche|Alberto Pecchini|I conti|La cassa di pzk|Le operazioni della banca|In locale (pzkko)}}
[[Categoria:I soldi]]
[[Categoria:Le persone]]`,
  },

  'La lumachina': {
    data: '2026-10-29',
    fonti: ['albertopecchini.it/pzkko/chat/lumaca.mjs', 'albertopecchini.it/pzkko/chat/lumaca-dati.mjs', 'albertopecchini.it/pzkko/chat/lumaca-avvisi.js', 'albertopecchini.it/pzkko/api/wallet.mjs', 'albertopecchini.it/pzkko/telefono/zero/os/giocatori.js', README],
    testo: `{{Infobox
| titolo = La lumachina
| immagine = app-giocatori.webp
| didascalia = la scheda «io» di Giocatori (app): la salute della lumachina e le giornate
| dove = Giocatori (app) → io; il riquadro «dalla banca» della home di pzk os
| dal = 23 ottobre 2026 sera
| file = chat/lumaca.mjs, chat/lumaca-dati.mjs, chat/lumaca-avvisi.js; api/wallet.mjs
| giornate = 300 (100 negative, 100 positive, 100 neutre) più 3 catastrofi e 3 miracoli
}}
'''La lumachina''' è la chiocciolina del cercapersone vista come essere vivente: ogni giorno di Mantova si sveglia con una salute e decide lei cosa fare coi [[I $pzk|$pzk]] liberi del tuo [[Il conto|conto]], senza che tu possa farci niente. È del 23.10.2026 sera (commit 262d6d4, «la salute della lumachina, che ogni giorno decide lei cosa fare coi $pzk del conto»); l'animazione sullo schermo è il [[Il tomodachi|tomodachi]], la lumachina è la sua vita economica.

== Ogni giorno ==
{{Principale|La salute della lumachina}}
Da mezzanotte a mezzanotte (ora di Mantova) si sveglia con una salute fra 0 e 100 %, con un decimale, che per il 70 % dipende da ieri: una lumachina malata resta malata qualche giorno. Poi decide la giornata: nera con probabilità 0,088 + 0,5 × (1 − salute), buona con 0,112 + 0,5 × salute, neutra il 30 %. Ogni giornata è un evento credibile con la salute di quel giorno, con la sua percentuale (coi decimali) dei $pzk liberi: medicine che spendono i tuoi soldi, visioni che fanno guadagnare o perdere, affari, disastri. Le 300 giornate stanno in <code>chat/lumaca-dati.mjs</code> ([[Le giornate della lumachina]]). Più rare, a qualunque salute, tre '''catastrofi''' e tre '''miracoli''' (0,5 % dei giorni per lato), a coppie rovesciate (−50 % e +100 %): nel lungo periodo non svuotano né gonfiano i conti (simulazione: dopo un anno il conto mediano resta dov'era).

== Il dado non si rigioca ==
La giornata la decide un dado deterministico dalla nascita del conto e dal giorno: è la stessa sul server e nel browser e non si rigioca. '''Il server la applica''' (<code>api/wallet.mjs</code>, alla prima richiesta del giorno: entra, stato, salva, ogni azione, la nascita del conto), vive anche i giorni in cui non c'eri (al più 30), ne fa una mossa del wallet («la lumachina −2,35 %») e, per catastrofi e miracoli, una [[Le notizie della banca|notizia della banca]]. Sposta la sua percentuale senza passare dal controllo dei salti, ricorda le ultime 14 giornate in <code>c.lumaca</code>; il browser manda <code>lg</code>, il giorno della lumachina che il suo saldo contiene già, così una risposta persa non la fa contare due volte né perdere.

== Cosa vedi tu ==
Se ha combinato qualcosa che non hai visto, il riquadro «dalla banca» della [[La home di pzk os|home di pzk os]] diventa '''urgente''' e porta a «io», l'app [[Giocatori (app)|Giocatori]] e la scheda «io» hanno il pallino (il [[Il led rosso|led rosso]] lampeggia), e in cima a «io» c'è l'avviso con le giornate, il racconto e i $pzk, finché non premi «ho capito» (<code>chat/lumaca-avvisi.js</code>). Nella scheda «io» c'è la sua salute con la barra, oggi e gli ultimi giorni. Nel [[Il libro dei conti|libro dei conti]] la lumachina pesa «±» sui guadagnati in tutto; nelle mosse del wallet dal 23.10 c'è la riga sua (a2c2693).

== Senza conto e gli EUR€ ==
Con la [[La sessione|sessione]] la lumachina c'è lo stesso (una per browser) ma non tocca i 1.000: dice cosa avrebbe fatto. [[Gli EUR€]] non li tocca mai: sono il posto dove parcheggiare i $pzk se si teme una giornata nera. I [[L'economia|miracoli]] sono conio e le giornate nere soldi che vanno alla [[La cassa di pzk|cassa]].

{{Vedi anche|La salute della lumachina|Le giornate della lumachina|Il tomodachi|Giocatori (app)|Le notizie della banca|La chiocciola gigante africana}}
[[Categoria:I soldi]]
[[Categoria:Il cercapersone]]`,
  },

  'La salute della lumachina': {
    data: '2026-10-23',
    fonti: ['albertopecchini.it/pzkko/chat/lumaca.mjs', 'albertopecchini.it/pzkko/chat/lumaca-dati.mjs', README],
    testo: `'''La salute della lumachina''' è il numero da cui parte ogni giornata della [[La lumachina|lumachina]] di [[pzkko.it]]: fra 0 e 100 %, con un decimale, nuova ogni giorno di Mantova.

== La formula ==
* la salute di oggi dipende per il '''70 %''' da quella di ieri e per il resto dal caso: una lumachina malata resta malata qualche giorno, una in forma non crolla da un giorno all'altro;
* '''giornata nera''' con probabilità 0,088 + 0,5 × (1 − salute): con la salute a zero il 58,8 %, a 100 % l'8,8 %;
* '''giornata buona''' con probabilità 0,112 + 0,5 × salute: da 11,2 % a 61,2 %;
* '''giornata neutra''' il 30 %, sempre.
Il punto e due in più alle buone compensa le nere, che nei dati tolgono in media un filo più di quanto diano le buone. Dentro ogni tipo l'evento scelto è credibile con la salute di quel giorno (una medicina quando sta male, un affare quando sta bene) e porta la sua percentuale dei $pzk liberi, coi decimali.

== Catastrofi e miracoli ==
A qualunque salute, tre catastrofi e tre miracoli con lo 0,5 % dei giorni per lato, a coppie rovesciate (−50 % e +100 %): la simulazione di un anno lascia il conto mediano dov'era. Questi fanno una [[Le notizie della banca|notizia della banca]].

== Il dado ==
Tutto esce da un dado deterministico dalla nascita del conto e dal giorno: uguale sul server e nel browser, non si rigioca, e il server ([[Il wallet (API)]]) vive anche i giorni in cui non c'eri, al più 30. Si vede in [[Giocatori (app)]], scheda «io», con la barra della salute, oggi e gli ultimi giorni.

{{Vedi anche|La lumachina|Le giornate della lumachina|Giocatori (app)}}
[[Categoria:I soldi]]`,
  },

  'I portafogli separati': {
    data: '2026-10-26',
    fonti: [G + 'pzk.js', G + 'virtual/schedina.js', 'albertopecchini.it/pzkko/telefono/telefono.js', README],
    testo: `'''I portafogli separati''' sono la regola del 26.10.2026 (commit 620bb29, «cercapersone solo col conto, e sessione e conto sono portafogli separati») per cui su [[pzkko.it]] [[la sessione|La sessione]] e ogni [[Il conto|conto]] sono portafogli distinti, e i soldi non passano mai dall'uno all'altro.
{{Citazione|senza account ho messo dei soldi su virtual e quando ho loggato ho visto ancora i vecchi soldi: rischio duplicazione|Alberto, 26.10.2026}}

== Le regole ==
* <code>proprietario()</code> in <code>games/pzk.js</code> dice di chi sono i soldi (<code>'s'</code> la sessione, <code>'c:nome'</code> un conto) e <code>alCambioConto(fn)</code> avvisa quando cambia: entrare, uscire, un altro conto aperto da un'altra scheda;
* quello che era sui tavoli appartiene al portafoglio di prima: i tavoli si svuotano e i giochi che avevano una puntata aperta diventano «stantii», quindi <code>regola</code> e <code>ritira</code> non pagano più. Una mano iniziata coi soldi della sessione e finita dopo il login non porta soldi nel conto;
* [[la schedina|La schedina]] di [[Virtual]] segue il portafoglio: senza conto in <code>sessionStorage</code> (<code>pzkko-virtual</code>), col conto in <code>localStorage</code> (<code>pzkko-virtual:nome</code>); entrando o uscendo si cambia schedina e le puntate aperte si rimettono sul tavolo giusto;
* il [[Il cercapersone zero|cercapersone zero]] senza conto si apre solo sull'[[Account (app)|account]]: l'app che si voleva aspetta in <code>daFare</code> e parte dopo <code>ctx.dopoAccesso()</code>; uscire dal conto, anche da un'altra scheda, riporta lì, e dal 26.10 sera il messaggio dice che «per il cercapersone serve di nuovo il conto» (03ef8a6).
I sei [[I giochi|giochi]] della pagina restano giocabili senza conto coi 1.000 della sessione.

{{Vedi anche|La sessione|Il conto|La schedina|Account (app)|I $pzk}}
[[Categoria:I soldi]]`,
  },

  'Le banconote della banca $pzk': {
    data: '2026-10-22',
    fonti: ['albertopecchini.it/pzkko/scena/banconote.js', 'albertopecchini.it/pzkko/scena/tocchi.js', 'albertopecchini.it/pzkko/api/wallet.mjs', README],
    testo: `'''Le banconote della banca $pzk''' sono le quattro banconote perse per terra davanti al negozio nella [[La scena 3D|scena 3D]] di [[pzkko.it]]: da '''500, 100, 25 e 10''' $pzk, con la [[La chiocciola gigante africana|chiocciola]] in smoking incisa come su una banconota vera e la scritta «non ha corso legale · soldi finti», cadute sul marciapiede e stropicciate come i volantini bagnati. Sono del 22.10.2026 notte, insieme al [[Il wallet|wallet]] (commit 84bebc5); le immagini stanno in <code>art/banconote/</code> (foglio «banconote» di <code>tools/pzkko/fogli.js</code>, [[gpt-image-2]]) e il modulo è <code>scena/banconote.js</code>.

== Raccoglierle ==
Si raccolgono toccandole ([[Le cose che si toccano]], <code>tocchi.js</code>, <code>banconota</code>): la banconota si alza verso la telecamera e svanisce, i suoi $pzk entrano nel saldo (il led del [[Il banner del wallet|banner]] li conta, «+500 $pzk» vola via dal tasto) e domani sono di nuovo lì. In tutto '''635 $pzk al giorno''' a chi passa a raccoglierli, una volta al giorno ciascuna (il giorno di Mantova, <code>trova</code> in <code>api/wallet.mjs</code>), come promessa che il server conferma. Per l'[[L'economia|economia]] sono conio. Nel muro senza 3D non ci sono: la scena si accende nella [[La regia|regia]] o con <code>?scena=1</code>.

== E le altre banconote ==
Le stesse banconote sono le immagini del wallet (foglio «wallet» e «banconote») e il [[Il portachiavi della banca $pzk|portachiavi della banca $pzk]], per terra accanto al chiusino, porta la fiche gialla da 500 come logo della banca.

{{Vedi anche|La scena 3D|Le cose che si toccano|Il wallet|I $pzk|La spazzatura per terra}}
[[Categoria:I soldi]]
[[Categoria:La scena 3D]]`,
  },

  'I numeri corti': {
    data: '2026-10-23',
    fonti: [G + 'pzk.js', README],
    testo: `'''I numeri corti''' sono il modo in cui [[pzkko.it]] scrive i [[I $pzk|$pzk]] nei riquadri stretti: <code>fmtCorto</code> in <code>games/pzk.js</code> (23.10.2026, con [[la miniera|La miniera]]: «i numeri corti e i menù che restano fermi», ee9b9c6).

== La scala ==
999 resta 999; da mille in su una cifra decimale con la virgola e la lettera: '''1,0K''', 13,3K, '''1,0M''', '''1,0B''', '''1,0T'''. Si usa nel saldo della home del cercapersone, nei numeri di [[Giocatori (app)]], nelle [[Le classifiche|classifiche]] e nei podi. Dove c'è posto il numero è intero, coi punti delle migliaia.

== Sul cercapersone zero ==
Lo schermo 256 × 128 di [[pzk os]] ha 40 colonne a scala 1 e 20 a scala 2, e [[le regole per le app|Le regole per le app]] vogliono che ogni scritta stia anche coi dati peggiori: «niente, zero, 999.999.999 $pzk (<code>pzk.fmtCorto</code>), un nome di 20 lettere». Il collaudo con <code>--peggiori</code> mette quasi un miliardo di $pzk nel conto per vedere cosa esce dai riquadri; nel profilo il bollino «liv 129» usciva, e nella home la riga «liv 129 · 4614/15420 xp» ora diventa la percentuale se non ci sta.

{{Vedi anche|I $pzk|Le regole per le app|Il collaudo delle app|Giocatori (app)}}
[[Categoria:I soldi]]`,
  },
}
