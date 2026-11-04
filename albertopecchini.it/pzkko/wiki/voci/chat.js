// pzkkopedia: le voci della chat col bot, delle attività, dello zaino e dell'economia dei $pzk (la cassa, la rapina, la
// galera, i soldi sporchi), e delle cose che si fanno dalla chat e dalle app (shop, quiz, sfide, quest, miniera, cucina,
// traguardi…). Il formato e le regole: tools/pzkko/wiki/README.md. Scritte il 2.11.2026 da pzkko/README.md, dai dati di
// chat/*.js e dal contratto della banca (C:\pzkko-server\banca\CONTRATTO.md).

const R = 'albertopecchini.it/pzkko/README.md'
const C = (f) => `albertopecchini.it/pzkko/chat/${f}`
const A = (f) => `albertopecchini.it/pzkko/telefono/app/${f}`
const O = (f) => `albertopecchini.it/pzkko/telefono/zero/os/${f}`

export const VOCI = {
  'La chat col bot': {
    data: '2026-11-02',
    fonti: [C('chat.js'), C('chat.css'), C('comandi/index.js'), C('predittivo.js'), O('chat.js'), R],
    testo: `{{Infobox
| titolo = La chat col bot
| immagine = app-chat.webp
| didascalia = la chat dentro pzk os, sullo schermo del cercapersone zero
| dove = l'app [[Chat (app)|chat]] del [[Il cercapersone zero|cercapersone zero]]
| dal = 22 ottobre 2026 (commit 730e268)
| file = chat/chat.js, chat/comandi/*.js, telefono/zero/os/chat.js
| chi risponde = [[Il bot pzk|pzk]], la chiocciola della banca con gli occhiali da sole
}}
'''La chat col bot''' è il cuore del gioco di [[pzkko.it]]: si scrive un comando e basta (<code>pesca</code>; anche <code>pzk pesca</code> e <code>/pesca</code>) e il bot [[Il bot pzk|pzk]] risponde con una scheda. Da lì si lavora, si pesca, si caccia, si scava, si compra, si gioca ai [[I minigiochi della chat|giochi a comando]], si entra nelle [[Le side quest|side quest]] e si guadagnano i [[I $pzk|$pzk]] che poi si spendono nei sei [[I giochi|giochi grandi]].

È nata il 22 ottobre 2026 come riquadro HTML sotto il [[Il wallet|wallet]] («la chat col bot dei $pzk, sotto il wallet», commit 730e268), scritta in Fake Receipt, il carattere degli scontrini (commit a0050f9). Dal 23.10 è l'app «chat» del cercapersone; dal 29.10 è stata riscritta a pixel dentro [[pzk os]] (<code>telefono/zero/os/chat.js</code>), e dal 31.10, col [[Il cercapersone nero|cercapersone nero]] eliminato, quella a 8 bit è l'unica.

== Com'è fatta ==
* Il bot risponde con una '''scheda che non spunta di colpo''': «sta scrivendo…» per 500 ms, poi il testo si scrive da solo in 1000 ms; una coda mostra le schede una alla volta, e i pulsanti e i timer dei minigiochi partono a scrittura finita.
* Le schede sono '''interattive''': ogni <code>comando</code> nel testo si tocca, sotto possono esserci tasti di seguito (i «tasti di seguito» delle scelte), i propri messaggi hanno il ↻ per rifarli; orari e giorni separano le giornate, il tasto ↓ coi nuovi arrivati.
* Sopra la riga ci sono [[I tasti rapidi|i tasti rapidi]] (le ultime 8 scelte, salvate nello [[Lo zaino|zaino]]) e, dal 29.10, [[Il testo predittivo|il testo predittivo]]; dal 2.11 a riga vuota [[I consigliati|i consigliati]].
* Niente emoji di sistema: solo le icone del sito (<code>chat/icone.js</code>, i fogli <code>art/chat-*</code>, dal 26.10 a pixel con [[retro-diffusion rd-plus]]).
* Nello zero la scheda si disegna a pixel: la barra a sinistra, l'icona di Alberto e il titolo, il testo a 40 colonne, i campi, il piè, i tasti di seguito. Una «maniglia» finta fa da elemento per i comandi che toccano il DOM (i rulli della slot, le griglie delle mine, il gratta e vinci): un selettore che la maniglia non conosce torna null, per questo le [[Le regole per le app|regole]] chiedono di provare nello zero ogni comando che tocca la pagina.

== Chi decide ==
Fino al 30 ottobre il browser tirava i dadi, pagava e scriveva lo zaino. Dal 31.10 ({{Citazione|saldo sempre nel server immediatamente · browser modificato non può accedere · nessun codice accessibile da fuori · solo da me stanno i dati|Alberto, 31.10.2026}}) '''il browser chiede e la [[La banca sul server|banca]] fa''': ogni comando è un'azione <code>pzk.fai('chat.pesca', args)</code> che arriva, attraverso il [[Il ponte firmato|ponte firmato]] di Vercel, alla banca sul [[Il server dei dati in casa|pc di Alberto]] (<code>C:\\pzkko-server\\banca\\giochi\\chat-*.mjs</code>). La banca tira il caso con crypto, controlla attese e limiti con la sua ora, paga, e risponde col conto intero; <code>chat/zaino.js</code> è solo una copia da leggere. Le carte coperte, le mine, la parola del «veloce» e le risposte giuste dei [[I quiz|quiz]] stanno sulla banca finché non tocca vederle: chi apre la console non le trova più.

== Senza conto e in locale ==
Senza [[Il conto|conto]] la chat gira nella [[La sessione|sessione]] (gli ospiti vivono nella memoria del server e spariscono con la scheda); dal 26.10 però il cercapersone si apre solo con l'[[Account (app)|account]]: «non puoi accedere al cercapersone se non ti registri/accedi». In locale <code>npm run dev:pzkko</code> serve la chat da sola su <code>http://localhost:5182/prova/chat/</code> (<code>tools/pzkko/prove/chat.html</code>), e il solo cercapersone su <code>/prova/cercapersone/</code>; dal 29.10 in locale si è sempre dentro come pzkko (<code>/__dev/accesso</code> di <code>tools/dev.mjs</code>, solo da quel pc o da Tailscale), <code>?ospite</code> lascia senza conto.

== La chat e il resto ==
<code>#chat</code> nell'indirizzo apre direttamente la chat, l'evento <code>pzkko-chat</code> (con <code>detail.comando</code>) la apre scrivendo un comando. Il led del [[Il tasto sul muro|tasto sul muro]] (<code>chat/led.js</code>) sfarfalla come la spia del disco di un PC quando il bot pensa e scrive. Gli strumenti che fotografano la pagina non vedono il tasto (<code>navigator.webdriver</code>), <code>?chat</code> lo fa vedere.

{{Vedi anche|I comandi della chat|Il bot pzk|Chat (app)|Le attività|Il lavoro|Lo zaino|L'economia|I $pzk}}
[[Categoria:La chat]]`,
  },

  'Il bot pzk': {
    data: '2026-10-26',
    fonti: [C('chat.js'), C('icone.js'), 'albertopecchini.it/tools/pzkko/fogli-chat.js', R],
    testo: `[[File:/art/chat-app/app-chat.webp|thumb|upright|la piastrella dell'app chat, col bot]]
'''pzk''' è il bot della [[La chat col bot|chat]]: la chiocciola della banca $pzk con gli occhiali da sole, la stessa che sta incisa sulle [[Le banconote della banca $pzk|banconote]] e sul [[Il peluche della chiocciola|peluche]]. Non è un modello di linguaggio: risponde con schede scritte in codice, a comandi, come i bot da gioco di Discord.

== Gli umori ==
Ha '''otto umori''' in <code>art/chat-bot/</code> (dal 26.10 disegnati a pixel con [[retro-diffusion rd-plus]], una predizione per icona): <code>bot</code>, <code>bot-pensa</code> (mentre tira i dadi), <code>bot-triste</code> (quando non puoi, o perde ai dadi), <code>bot-ride</code> (quando vince lui), <code>bot-ricco</code> (le vincite grosse: è anche una [[Le facce del profilo|faccia leggendaria]], sbloccata al livello 10), <code>bot-occhiolino</code>, <code>bot-morto</code> (la [[La morte|morte]]), <code>bot-saluta</code>. Il colore della scheda dice com'è andata: oro vinto, rosso perso, ambra «calma, aspetta», blu informazione, grigio pari.

== Come parla ==
Scrive in minuscolo, come tutto il sito, e con i fatti di Mantova: pesca nel Mincio, nutrie, tortelli, Gonzaga, Virgilio, il bidello di unimore. Ogni risposta dice cosa fare dopo con un <code>comando</code> da toccare. Nel [[Il cercapersone zero|cercapersone zero]] è l'icona a un bit dentro la scheda a 40 colonne; sulla home dello zero vive la sua versione piccola, [[Il tomodachi|il tomodachi]].

{{Vedi anche|La chat col bot|I comandi della chat|Il tomodachi|Le facce del profilo}}
[[Categoria:La chat]]`,
  },

  'I comandi della chat': {
    data: '2026-11-04',
    fonti: [C('comandi/index.js'), C('comandi/soldi.js'), C('comandi/attivita.js'), C('comandi/lavoro.js'), C('comandi/giochi.js'), C('comandi/negozio.js'), C('comandi/app.js'), C('comandi/giocatori.js'), C('comandi/svago.js'), C('comandi/eventi.js'), R],
    testo: `'''I comandi della chat''' sono tutto quello che si può dire al [[Il bot pzk|bot]]. Stanno in <code>chat/comandi/</code>, una famiglia per file; ogni comando ha <code>nomi</code> (il primo è quello vero, gli altri alias), la categoria dell'<code>aiuto</code>, l'icona, una riga <code>breve</code>, l'<code>uso</code>, l'<code>attesa</code> in secondi prima di poterlo rifare e <code>fai(ctx)</code>. Scrivere <code>aiuto</code> li elenca per categoria e porta dieci tasti per cominciare (giornaliero, lavora, pesca, caccia, scava, quiz, negozio, zaino, sfide, classifica); <code>aiuto pesca</code> ne spiega uno, col tasto «prova» (se il comando vuole qualcosa dopo, come <code>slot &lt;puntata&gt;</code>, apre la tastiera già scritta fin lì). Fino al 4.11.2026 «aiuto» diceva anche «le frecce in su ripetono gli ultimi», che nello [[Chat (app)|zero]] non è vero: ↑ scorre i messaggi. Il saluto del bot dice come si usa («← → scelgono un tasto, OK lo preme, oppure scrivi tu») e porta già «riscuoti il premio» e «cosa posso fare?». Un nome di oggetto scritto da solo (<code>luccio</code>) propone compra, usa, info.

== I soldi ==
{| class="wikitable"
! comando !! alias !! cosa fa !! attesa
|-
| <code>aiuto [comando]</code> || help, comandi, ? || l'elenco dei comandi, o la spiegazione di uno ||
|-
| <code>saldo</code> || bal, soldi, balance || i tuoi [[I $pzk|$pzk]], gli [[Gli EUR€|EUR€]], il livello ||
|-
| <code>profilo</code> || livello, profile, xp || xp, livello, mestiere, statistiche; col conto i numeri del [[Il libro dei conti|libro dei conti]] ||
|-
| <code>attese</code> || cd, cooldown || quanto manca per rifare i comandi ||
|-
| <code>giornaliero</code> || daily, giorno || il [[Il premio giornaliero|premio]]: 300 $pzk, +50 per ogni giorno di fila (al più 7) || 24 ore
|-
| <code>settimanale</code> || weekly, settimana || 1.500 $pzk, +200 a settimana di fila (al più 4) || 7 giorni
|-
| <code>mensile</code> || monthly, mese || 5.000 $pzk, +500 a mese di fila (al più 3) || 30 giorni
|-
| <code>elemosina</code> || beg, chiedi || chiedi a chi passa: 0–150 $pzk, o una risposta acida || 30 s
|-
| <code>manda pzk123456 50</code> || invia, dai, give, pay || manda $pzk a un conto (era «dai»/«invia», che restano alias; servono [[Gli invii|48 ore dal conto]]) ||
|}

== Le attività ==
{| class="wikitable"
! comando !! alias !! cosa fa !! attesa
|-
| <code>cerca</code> || search, fruga || fruga in un posto di Mantova (i <code>POSTI</code> di testi.js): $pzk, oggetti, o guai || 30 s
|-
| <code>crimine</code> || crime, reato || un crimine (i <code>CRIMINI</code>): più rischio, più paga; se va male [[La morte|muori]] || 45 s
|-
| <code>altobasso</code> || hl, highlow || un numero da 1 a 100 come indizio: il mio è più alto, più basso o uguale? || 20 s
|-
| <code>posta</code> || postmemes, meme || posta un meme (serve il telefono dello shop): i like diventano $pzk || 40 s
|-
| <code>scava</code> || dig || [[Lo scavo|scava]] (serve la pala): vermi, monete di Virgilio, anfore dei Gonzaga || 40 s
|-
| <code>pesca</code> || fish, pescare || [[La pesca|pesca]] nel Mincio (serve la canna): dall'alborella al siluro, e la carpa d'oro || 40 s
|-
| <code>caccia</code> || hunt, cacciare || [[La caccia|caccia]] (serve la fionda, o il fucile per le bestie grosse) || 40 s
|}

== Il lavoro ==
<code>lavora</code> (work, lavoro): un turno di lavoro, un minigioco e poi la paga; <code>lavora lista</code>, <code>lavora come rider</code>, <code>lavora licenziati</code>. Un turno ogni 20 minuti (<code>ATTESA_TURNO</code>). Vedi [[Il lavoro]] e [[I mestieri]].

== I giochi a comando ==
{| class="wikitable"
! comando !! alias !! cosa fa !! attesa
|-
| <code>quiz [argomento]</code> || trivia || una partita di 8 domande; <code>quiz lista</code> per gli argomenti ([[I quiz]]) ||
|-
| <code>veloce</code> || fast, riflessi || una parola compare all'improvviso: riscrivila, paga in base al tempo || 30 s
|-
| <code>slot 50</code> || slots || tre rulli, da 1 a 500 $pzk; tre chiocciole d'oro ×50 || 10 s
|-
| <code>dadi 100</code> || gamble, sfida || tu contro il bot, due dadi a testa, da 1 a 1.000 || 10 s
|-
| <code>moneta 50 testa</code> || cf, coinflip, testa, croce || testa o croce coi soldi ||
|-
| <code>roulette 50 rosso</code> || rl || nero, pari, dispari, basso, alto, dozzina 1-3, colonna 1-3, o un numero: i pagamenti della [[La roulette|roulette]] vera ||
|-
| <code>blackjack 25</code> || bj || una mano contro il banco, sei mazzi, il banco sta a 17, 3 a 2; da 5 a 1.000 (carta / stai / raddoppia) ||
|-
| <code>mine 50 3</code> || mines, campo || la griglia 5×5 delle [[Le mine|mine]], con 1–24 mine ||
|-
| <code>dado 50 piccolo</code> || sicbo || il [[Il dado|sic bo]] con le regole di Macao: grande, pari, dispari, totale 10, coppia 4, tripla 6, triple, 2 e 5, singolo 3 ||
|}
Dal 31.10 anche questi li tira la [[La banca sul server|banca]] (<code>chat-giochi.mjs</code>): paga, segna le attese, e la chat mostra quello che è uscito con le animazioni di prima (i rulli, i dadi, la pallina).

== Lo zaino e il negozio ==
{| class="wikitable"
! comando !! alias !! cosa fa
|-
| <code>zaino</code> || inv, inventario, oggetti || quello che hai ([[Lo zaino]])
|-
| <code>negozio [reparto]</code> || store || cosa si compra e a quanto, per reparto: offerte, cibo, attrezzi, fortuna, roba, pzk ([[Lo shop]])
|-
| <code>compra canna [quanti]</code> || buy || compra; da solo apre la vetrina dello shop
|-
| <code>vendi carpa 2</code>, <code>vendi tutto</code> || sell || vendi pesci, bestie e reperti
|-
| <code>usa caffe</code> || use || usa un consumabile
|-
| <code>info luccio</code> || cosa || cos'è una cosa
|-
| <code>apri comune / rara / gonzaga</code> || open, cassa || apre una [[Le casse|cassa]]
|-
| <code>gratta</code> || scratch || il [[Il gratta e vinci|gratta e vinci]]: 3×3, tre uguali e vinci
|}

== Le app ==
<code>telefono</code> (phone, app) apre il cercapersone; <code>shop</code> (ecommerce) lo shop; <code>virtual</code> (scommesse, calcio) le [[Virtual|scommesse]]; <code>sfide [riscuoti]</code> (sfida, daily, giornaliere) le [[Le sfide giornaliere|tre sfide di oggi]]; <code>missioni</code> (quests, sidequest) e <code>quest civico28 [2]</code> (missione) le [[Le side quest|side quest]]; dal 29.10 <code>pzkstore [app]</code> (appstore), <code>installa lavatrice</code> / <code>installa decifratore</code> (install, scarica) e <code>lavatrice</code> (lava, ricicla), che a chi non ce l'ha spiega tutta la strada ([[Il pzkstore]]).

== I giocatori ==
<code>classifica [metrica]</code> (lb, top, ricchi: le diciassette metriche di <code>chat/db.js</code>, da «$pzk liberi» a «giorni di vita»), <code>cerca mat</code> (trova, find), <code>giocatore mario</code> o <code>giocatore pzk398893</code> (chi, player), <code>notizie</code> (news, bacheca: [[Le notizie della banca|le ultime cose successe in banca]]), <code>rivale [metrica]</code> (rival, sfidante: chi ti sta sopra e sotto), <code>banca</code> (numeri, stats: i numeri di tutta la banca). Vedi [[Il database dei giocatori]].

== Lo svago (26.10) ==
Niente soldi e niente attese: <code>barzelletta</code> (joke, ridere: una barzelletta pessima), <code>palla8 vincerò?</code> (palla, 8ball, domanda), <code>oroscopo</code> (segno, stelle: l'oroscopo del Mincio, uguale per tutti per tutto il giorno), <code>sorte</code> (testaocroce, lancia: testa o croce per ridere), <code>tira [facce]</code> (d20, dice: un dado per scherzo). «Moneta» e «dado» coi soldi sono giochi veri.

== Gli eventi casuali ==
Dopo un comando la banca può tirare un '''evento''' (<code>chat/comandi/eventi.js</code>): il quiz lampo e, dal 26.10, il «vero o falso lampo» (6 secondi, paga come il quiz lampo). I comandi con <code>senzaEventi</code> (manda, le classifiche) non ne fanno partire.

{{Vedi anche|La chat col bot|Il testo predittivo|Le attività|I minigiochi della chat|Lo shop}}
[[Categoria:La chat]]`,
  },

  'Il testo predittivo': {
    data: '2026-10-29',
    fonti: [C('predittivo.js'), C('chat.js'), O('chat.js'), R],
    testo: `[[File:app-chat-collaudo.webp|thumb|lo zero durante il collaudo della chat: la home di pzk os col saldo finto]]
'''Il testo predittivo''' (29.10.2026, <code>chat/predittivo.js</code>) è il menù che si apre sopra la riga della [[La chat col bot|chat]] mentre si scrive, coi [[I comandi della chat|comandi]] che vanno bene.

{{Citazione|nei comandi quando scrivo lavora deve esserci quasi un testo predittivo con i comandi disponibili così da poter finire col mouse oppure premendo tab e scorrendo con le freccie|Alberto, 29.10.2026}}

== L'ordine ==
Prima i comandi il cui nome comincia così, poi gli alias (con l'etichetta: <code>work</code> = lavora), poi quelli che contengono le lettere; a parità prima i [[I tasti rapidi|tasti rapidi]], poi l'ordine dell'<code>aiuto</code>. Ogni voce ha l'icona, la riga <code>breve</code> e, se è in attesa, «fra 3 min».

== Gli argomenti ==
Dopo lo spazio propone gli argomenti che il comando conosce già, solo da liste che ci sono: le parole dell'<code>uso</code> (<code>lavora</code> lista / come / licenziati, <code>sfide riscuoti</code>, <code>moneta … testa|croce</code>, <code>roulette … rosso|nero|…|dozzina 1-3</code>), i [[I mestieri|mestieri]] dopo <code>lavora come</code> (spenti quelli di un livello che non hai), le app del [[Il pzkstore|pzkstore]] per <code>installa</code>, il [[Lo shop|negozio]] per <code>compra</code>, lo [[Lo zaino|zaino]] per <code>vendi</code> e <code>usa</code>, le [[Le casse|casse]] per <code>apri</code>, i reparti, gli argomenti del [[I quiz|quiz]], le metriche per <code>classifica</code> e <code>rivale</code>, le puntate del sic bo, i comandi per <code>aiuto</code>.

== I tasti ==
↑↓ scorrono; Tab completa con la voce evidenziata (se è l'unica o è già scritta tutta, aggiunge lo spazio e passa agli argomenti), Tab di nuovo e Maiusc+Tab passano alla voce dopo e a quella prima, come nei terminali; Invio fa quello che c'è scritto se è un comando intero, se no la voce evidenziata (<code>pe</code> → pesca); Esc chiude. Col mouse o col dito si tocca una voce. La voce scelta è in negativo, verde pieno come il cursore di un menù a cristalli liquidi; il menù copre al più metà dei messaggi (cinque voci e mezza sul telefono) e non ha animazioni. È una listbox legata alla riga (combobox, <code>aria-activedescendant</code>). Sta zitto durante i minigiochi che aspettano una risposta, e col [[Il cercapersone scassato|cercapersone scassato]] propone solo <code>lavora</code> e <code>compra cercapersone</code>. Le liste si leggono con <code>import * as</code>: se una cambia forma resta vuota, la chat no. Nello [[Il cercapersone zero|zero]] sinistra e destra scelgono, OK o Tab completano.

{{Vedi anche|I consigliati|I tasti rapidi|I comandi della chat}}
[[Categoria:La chat]]`,
  },

  'I consigliati': {
    data: '2026-11-04',
    fonti: [O('chat.js'), C('zaino.js'), R],
    testo: `'''I consigliati''' (2.11.2026) sono i tasti incorniciati che la [[Chat (app)|chat di pzk os]] mostra in fondo, sopra la riga: i [[I comandi della chat|comandi]] pronti adesso, da dove cominciare.

{{Citazione|fai che la chat mostri subito dei tasti da dove cominciare e con i comandi consigliati|Alberto, 2.11.2026}}

Nell'ordine: <code>giornaliero</code> se il [[Il premio giornaliero|premio]] c'è, <code>missioni</code> se una [[Le side quest|quest]] è pronta, <code>lavora</code> e <code>pesca</code> se non c'è attesa, poi le ultime righe scritte (i [[I tasti rapidi|tasti rapidi]] dello zaino) e <code>saldo</code>, <code>negozio</code>, <code>aiuto</code>, al più otto, e in fondo «scrivi…» (la tastiera sullo schermo); ◀ ▶ ai lati quando non ci stanno tutti. Sono la risposta a un cercapersone che si accendeva su una riga vuota e un cursore: nessuno sapeva cosa scrivere.

== Dal 4 novembre: un cursore solo ==
{{Citazione|in chat è buggato perché i tasti che premo danno comandi diversi da quel che hanno di nome|Alberto, 4.11.2026}}
Prima ← → li sceglievano scrivendo il comando nella riga, OK a vuoto apriva la tastiera, e se l'ultima scheda aveva i suoi tasti i consigliati sparivano e ← → andavano a quelli. Adesso i consigliati restano sempre, e c'è '''sempre un tasto scelto''': ← → lo portano in fila sui tasti dell'ultima scheda, poi sui consigliati, poi su «scrivi…», e OK preme quello rovesciato; il clic del mouse preme quello sotto. Il cursore si ricorda per chiave, non per posto: se un premio diventa pronto e la fila cambia, resta sullo stesso tasto. Sotto c'è scritto «← → scegli · OK premi». Il [[Il collaudo delle app|collaudo]] del 4.11 li ha scelti con ← (da «riscuoti il premio» si va in tondo a «scrivi…», poi «aiuto», «negozio») e mandati con OK e col clic.

{{Vedi anche|Il testo predittivo|I tasti rapidi|La chat col bot}}
[[Categoria:La chat]]`,
  },

  'I tasti rapidi': {
    data: '2026-10-23',
    fonti: [C('chat.js'), C('zaino.js'), R],
    testo: `'''I tasti rapidi''' sono le ultime otto scelte della [[La chat col bot|chat]], sopra la riga, con le freccette per scorrerle (23.10.2026, commit 884513c: «la chat ha i tasti rapidi con le ultime scelte e messaggi interattivi»). Si salvano nello [[Lo zaino|zaino]] (<code>rapidi</code>, <code>MAX_RAPIDI = 8</code>, <code>zaino.ricorda(riga)</code> e <code>zaino.scorda(riga)</code>), quindi col conto seguono il giocatore da un dispositivo all'altro. Nel [[Il testo predittivo|testo predittivo]] a parità di nome vengono prima loro, e nei [[I consigliati|consigliati]] stanno subito dopo i comandi pronti.

{{Vedi anche|I consigliati|Il testo predittivo}}
[[Categoria:La chat]]`,
  },

  'Le attività': {
    data: '2026-10-31',
    fonti: [C('comandi/attivita.js'), C('testi.js'), R],
    testo: `'''Le attività''' sono i [[I comandi della chat|comandi]] con cui si tirano su i [[I $pzk|$pzk]] senza un [[I mestieri|mestiere]]: <code>cerca</code>, <code>crimine</code>, <code>altobasso</code>, <code>posta</code>, <code>scava</code>, <code>pesca</code>, <code>caccia</code> (<code>chat/comandi/attivita.js</code>). Ognuna ha un'attesa (30, 45, 20, 40, 40, 40, 40 secondi; i consumabili con bonus «attese» la accorciano) e dal 31.10 è un'azione della [[La banca sul server|banca]] (<code>chat-attivita.mjs</code>), che tira il caso, pesca i pesci e le bestie, paga, rompe gli attrezzi e decide la [[La morte|morte]]. Le scelte col tempo (dove cerchi, il pesce raro che tira, la bestia che carica) le tiene la banca in <code>x.tavolo</code>: il browser risponde, la banca verifica tempo e risposta.

{| class="wikitable"
! attività !! serve !! cosa esce
|-
| [[La pesca|pesca]] || la [[Canna da pesca|canna]] (350 $pzk, ogni tanto si rompe); l'[[Esca viva|esca]] raddoppia la pescata || i 16 pesci di <code>PESCI</code>, dall'alborella (15 $pzk) al siluro (300), la [[Carpa d'oro dei Gonzaga|carpa d'oro]] leggendaria (1.500) e gli scarti (scarpa, bottiglia, rana)
|-
| [[La caccia|caccia]] || la [[Fionda|fionda]] (300) per le bestie piccole, il [[Fucile da caccia|fucile]] (1.500) per le grosse || le 12 bestie di <code>ANIMALI</code>: piccione 10, nutria 30, volpe 120, cervo 250, cinghiale 200 (ti carica), [[Il drago del Mincio|il drago]] 2.000
|-
| [[Lo scavo|scava]] || la [[Pala|pala]] (300) || i 12 reperti: vermi, il tappo del 1987, il bottone austriaco, la [[Moneta con la faccia di Virgilio|moneta di Virgilio]] 120, l'[[Anfora dei Gonzaga|anfora]] 400, [[Il tesoro dei Gonzaga|il tesoro]] 1.800
|-
| cerca || niente || uno dei <code>POSTI</code> di Mantova: $pzk, oggetti, o guai (anche la morte)
|-
| crimine || niente || uno dei <code>CRIMINI</code>: più rischio, più paga; «è andata male» = muori
|-
| posta || il [[Telefono (oggetto)|telefono]] (600) || un meme: i like diventano $pzk
|-
| altobasso || niente || un numero da 1 a 100: più alto, più basso o uguale
|}

Quello che si pesca, caccia e scava finisce nello [[Lo zaino|zaino]] e si vende con <code>vendi</code> (i bonus «vendita» dell'[[Zaino Eastpak|Eastpak]], del [[Tombino con i rilievi|tombino]] e del [[Portafoglio di pelle|portafoglio]] lo alzano); i [[I traguardi|traguardi]] contano pescati, cacciati e scavati (50 e 200), e i leggendari presi vanno nella riga pubblica del [[Il database dei giocatori|database]].

{{Vedi anche|La pesca|La caccia|Lo scavo|Elenco dei pesci|Elenco delle bestie|Elenco dei reperti}}
[[Categoria:La chat]]`,
  },

  'La pesca': {
    data: '2026-10-31',
    fonti: [C('comandi/attivita.js'), C('testi.js'), R],
    testo: `[[File:/art/chat-attrezzi/canna.webp|thumb|upright|la canna da pesca, a pixel]]
'''La pesca''' è il comando <code>pesca</code> (fish, pescare) della [[La chat col bot|chat]]: si pesca nel [[Il Mincio|Mincio]], serve la [[Canna da pesca|canna]] (350 $pzk nello [[Lo shop|shop]], «ogni tanto si rompe»), un'attesa di 40 secondi.

== Cosa si pesca ==
I pesci sono i 16 di <code>PESCI</code> in <code>chat/testi.js</code>, ognuno con un '''peso''' (quanto spesso esce) e un valore: alborella (peso 30, 15 $pzk), cavedano (22, 25), persico (18, 35), tinca (14, 45), carpa (12, 60), trota (10, 70), pesce gatto (10, 55), anguilla (7, 90), gambero killer (9, 40), lucioperca (6, 110), luccio (5, 150, raro), siluro (3, 300, raro), e '''LA CARPA D'ORO DEI GONZAGA''' (peso 1, 1.500 $pzk, leggendaria: il traguardo «re del Mincio»). Gli scarti: una scarpa (2), una bottiglia di plastica (1), una rana che ti guarda male (8). L'[[Esca viva|esca viva]] (60) fa pescare due volte alla prossima pescata. Il pesce raro che tira è una scelta col tempo: la banca aspetta la risposta.

I pesci si vendono con <code>vendi</code> (<code>vendi carpa 2</code>, <code>vendi tutto</code>) e valgono di più coi bonus «vendita». Le [[Le sfide giornaliere|sfide]] chiedono 3, 6 o 10 pesci; i [[I traguardi|traguardi]] 50 («pescatore del Mincio») e 200 («il Mincio è casa mia»); la metrica <code>pescati</code> ha la sua [[Le classifiche|classifica]].

{{Vedi anche|Le attività|Elenco dei pesci|La caccia|Lo scavo}}
[[Categoria:La chat]]`,
  },

  'La caccia': {
    data: '2026-10-31',
    fonti: [C('comandi/attivita.js'), C('testi.js'), R],
    testo: `'''La caccia''' è il comando <code>caccia</code> (hunt, cacciare): serve la [[Fionda|fionda]] (300 $pzk) per le bestie piccole, il [[Fucile da caccia|fucile da caccia]] (1.500) per quelle grosse («più paga, più rischio»); attesa 40 secondi.

== Le bestie ==
Le 12 di <code>ANIMALI</code>: piccione (peso 30, 10 $pzk), cornacchia (20, 15), [[La nutria|nutria]] (22, 30), anatra (16, 45), lepre (14, 60), fagiano (12, 80), riccio «ahi» (10, 20), volpe (7, 120), cervo (4, 250, raro), cinghiale (5, 200, raro, pericoloso: «il cinghiale ti carica. 120 chili di rabbia.»), la zanzara tigre enorme (15, 3, schifo) e '''IL DRAGO DEL MINCIO''' (peso 1, 2.000 $pzk, leggendario e pericoloso: «il drago non si fa cacciare. Il drago caccia.»). Quando una bestia carica, la banca apre una scelta col tempo: da che parte ti butti; «sei rimasto fermo» o «ti sei buttato proprio dove arrivava» è la [[La morte|morte]].

I traguardi: «cacciatore di nutrie» (50), «incubo delle nutrie» (200), «ammazzadraghi» (il drago). Il drago è anche una [[Le side quest|side quest]] di livello 3 ([[Il drago del Mincio]]).

{{Vedi anche|Le attività|Elenco delle bestie|La pesca|Lo scavo}}
[[Categoria:La chat]]`,
  },

  'Lo scavo': {
    data: '2026-10-31',
    fonti: [C('comandi/attivita.js'), C('testi.js'), R],
    testo: `'''Lo scavo''' è il comando <code>scava</code> (dig): serve la [[Pala|pala]] (300 $pzk), attesa 40 secondi. I 12 reperti di <code>REPERTI</code>: un verme (peso 30, 2 $pzk), un formicaio intero addosso (18, 1), un sasso («Un sasso.», 20, 1), una radice del platano (15, 5), un tappo di bottiglia del 1987 (16, 12), un bottone di una divisa austriaca (12, 40), un osso «di cosa, meglio non saperlo» (12, 25), una chiave di ferro vecchia (9, 60: è anche il premio della quest [[Il civico 28]]), una [[Moneta con la faccia di Virgilio|moneta con la faccia di Virgilio]] (7, 120), un fossile di ammonite (5, 180, raro), un'[[Anfora dei Gonzaga|anfora dei Gonzaga]] (3, 400, raro) e '''IL TESORO DEI GONZAGA''' (peso 1, 1.800, leggendario: il traguardo «il tesoro dei Gonzaga»). I traguardi degli scavi: «tombarolo gonzaghesco» (50) e «talpa umana» (200).

{{Vedi anche|Le attività|Elenco dei reperti|La pesca|La caccia}}
[[Categoria:La chat]]`,
  },

  'Il lavoro': {
    data: '2026-10-31',
    fonti: [C('comandi/lavoro.js'), C('minigiochi.js'), C('testi.js'), C('zaino.js'), R],
    testo: `'''Il lavoro''' è il comando <code>lavora</code> (work, lavoro) della [[La chat col bot|chat]]: un turno è un [[I minigiochi della chat|minigioco]] di pochi secondi, riuscito = la paga del [[I mestieri|mestiere]] per il moltiplicatore, più punti esperienza. Un turno ogni 20 minuti (<code>ATTESA_TURNO = 20 * 60</code>; i bonus «attese» lo accorciano).

== Come si fa ==
# <code>lavora lista</code>: la tabella dei mestieri con livello e paga.
# <code>lavora come barista</code>: si assume un mestiere (ogni mestiere vuole un livello: «serve il livello 3, sei al 1. Lavora, pesca, gioca»).
# <code>lavora</code>: il turno. Il minigioco del mestiere (riscrivi, anagramma, memoria, colori, icona, calcio, contrario, veloce, conti, ordine, strada, quiz, nastro), poi la paga.
# <code>lavora licenziati</code>: si lascia il mestiere.

La paga è quella di <code>MESTIERI</code> (da 120 $pzk del rider a 1.000 del sindaco; i [[I lavori rischiosi|lavori rischiosi]] fino a 2.200) moltiplicata per <code>zaino.moltiplicatore()</code>: 1 + 2 % per ogni livello sopra il primo + i [[I bonus|bonus]] «paga» (la [[Pzk-kola]] +15 %, la [[Hyundai Tucson]] +12 %, il [[Neon pzkko|neon]] +6 %…). Dal 31.10 il turno è l'azione <code>chat.lavora</code> della [[La banca sul server|banca]] (<code>chat-lavoro.mjs</code>): è lei che prepara il minigioco (la parola, la sequenza), tiene la risposta in <code>x.tavolo</code>, verifica risposta e tempo con un minimo umano, e per i lavori rischiosi tira il dado della [[La galera|galera]]. Nello [[Il cercapersone zero|zero]] i tasti di una scelta a direzioni (la consegna del rider, il rigore del calcio) si premono con le frecce (29.10: «le freccie non vanno per la sequenza, fammele andare»).

I turni contano per le [[Le sfide giornaliere|sfide]] (1, 2, 4 turni) e i [[I traguardi|traguardi]] «stakanovista» (50) e «schiavo del sistema» (200); «guadagnati in tutto» del [[Il libro dei conti|libro dei conti]] somma il lavoro ai premi.

{{Vedi anche|I mestieri|I minigiochi della chat|I lavori rischiosi|Lo spazzino di uffici|L'esperienza e i livelli}}
[[Categoria:La chat]]`,
  },

  'I mestieri': {
    data: '2026-10-26',
    fonti: [C('testi.js'), C('comandi/lavoro.js'), C('minigiochi.js'), R],
    testo: `[[File:/art/chat-mestieri/rider.webp|thumb|upright|il rider, il primo mestiere]]
'''I mestieri''' sono i venti di <code>MESTIERI</code> in <code>chat/testi.js</code>: ognuno con il '''livello''' minimo, la '''paga''' a turno (prima del moltiplicatore), la '''frase''' che lo descrive, il '''minigioco''' preferito e, per i quattro [[I lavori rischiosi|rischiosi]] (26.10), il rischio a turno, le ore di [[La galera|galera]] e la multa. Le icone sono a pixel in <code>art/chat-mestieri/</code>. Dal 31.10 i cataloghi che contano sono la copia sulla [[La banca sul server|banca]] (<code>banca\\dati\\testi.mjs</code>): paghe e probabilità vere sono lì.

== I dodici di partenza (22.10) ==
{| class="wikitable"
! mestiere !! livello !! paga !! la frase !! minigioco
|-
| [[Rider|rider]] || 1 || 120 || consegni pizze in bici col freddo || strada
|-
| [[Cameriere alla sagra|cameriere alla sagra]] || 2 || 160 || porti venti piatti di tortelli di zucca alla volta || memoria
|-
| [[Barista in piazza Erbe|barista in piazza Erbe]] || 3 || 200 || fai ottanta caffè prima delle nove || ordine
|-
| [[Bidello a unimore|bidello a unimore]] || 4 || 240 || apri e chiudi aule tutto il giorno || colori
|-
| [[Salumiere|salumiere]] || 5 || 290 || affetti la mortadella a 1 mm, non 2 || riscrivi
|-
| [[Tatuatore|tatuatore]] || 6 || 340 || tatui chiocciole su gente che se ne pentirà || icona
|-
| [[Streamer|streamer]] || 7 || 400 || urli a uno schermo per sei ore || veloce
|-
| [[Sviluppatore web|sviluppatore web]] || 8 || 480 || il sito di un cliente va giù di venerdì sera || contrario
|-
| [[Prof di analisi|prof di analisi]] || 10 || 560 || spieghi i limiti a chi non ne ha || conti
|-
| [[Influencer|influencer]] || 12 || 650 || fotografi i tortelli invece di mangiarli || anagramma
|-
| [[Avvocato|avvocato]] || 15 || 800 || difendi una nutria accusata di vandalismo || quiz
|-
| [[Sindaco di Mantova|sindaco di Mantova]] || 20 || 1.000 || inauguri una rotonda || calcio
|}

== Gli onesti aggiunti il 26.10 ==
{| class="wikitable"
! mestiere !! livello !! paga !! la frase !! minigioco
|-
| [[Imbianchino|imbianchino]] || 2 || 170 || dai la seconda mano a un portico di via Roma || colori
|-
| [[Pizzaiolo|pizzaiolo]] || 3 || 210 || sforni quaranta margherite il sabato sera || ordine
|-
| [[Meccanico|meccanico]] || 5 || 300 || rimetti in moto un Ciao del 1979 || icona
|-
| [[Bagnino del Mincio|bagnino del Mincio]] || 6 || 330 || fischi a chi fa il bagno con le nutrie || veloce
|}

== I rischiosi (26.10) ==
{| class="wikitable"
! mestiere !! livello !! paga !! la frase !! minigioco !! rischio a turno !! galera !! multa
|-
| [[Spazzino di uffici|spazzino di uffici]] || 2 || 260 || svuoti i cestini di un ufficio di notte: sul nastro passa di tutto || nastro || 4 % (+15 % per ogni chiavetta o wallet tenuto) || 2 ore || 500
|-
| [[Corriere di notte|corriere di notte]] || 4 || 700 || porti pacchi che è meglio non aprire || strada || 12 % || 3 ore || 800
|-
| [[Biscazziere|biscazziere]] || 8 || 1.400 || tieni il banco in una bisca dietro la stazione || conti || 18 % || 4 ore || 1.500
|-
| [[Contrabbandiere di tortelli|contrabbandiere di tortelli]] || 12 || 2.200 || porti tortelli di zucca oltre il confine con Cremona || memoria || 22 % || 6 ore || 2.500
|}

Il [[Il testo predittivo|testo predittivo]] dopo <code>lavora come</code> propone i mestieri e spegne quelli di un livello che non hai. Il mestiere sta nello [[Lo zaino|zaino]] (<code>mestiere</code>, <code>turni</code>) e nella riga pubblica del [[Il database dei giocatori|database]]: cambiare mestiere fa notizia.

{{Vedi anche|Il lavoro|I lavori rischiosi|Lo spazzino di uffici|Elenco dei mestieri|I minigiochi della chat}}
[[Categoria:La chat]]
[[Categoria:I mestieri]]`,
  },

  'Lo spazzino di uffici': {
    data: '2026-10-29',
    fonti: [C('minigiochi.js'), C('testi.js'), C('comandi/lavoro.js'), R],
    testo: `'''Lo spazzino di uffici''' è il [[I lavori rischiosi|lavoro rischioso]] di livello 2 (paga 260 $pzk, rischio 4 % a turno, 2 ore di [[La galera|galera]], multa 500): «svuoti i cestini di un ufficio di notte: sul nastro passa di tutto». Il suo turno non è un quiz ma un videogioco, '''il nastro''' (<code>chat/minigiochi.js</code>, <code>nastro</code>): 12 cose passano una al secondo, si tiene o si butta trascinando o con le frecce, al più tre in tasca, e poi il resto lo si guarda passare.

== Cosa passa sul nastro ==
Le cose di <code>UFFICIO</code> in <code>chat/testi.js</code>: una cartaccia (peso 30, vale 1), una lattina vuota (22, 2), una scatola di graffette (16, 6), una tazza «il capo sono io» (12, 18), un mouse senza filo (9, 45), delle cuffie col microfono (6, 90), un orologio da polso (3, 260, raro) e due cose '''sospette''' che valgono 0 a venderle: una [[Chiavetta usb|chiavetta usb]] (5) e un [[Wallet pzk cifrato|wallet pzk cifrato]] (4), «qualcuno l'ha perso: si apre con l'app [[Il decifratore|decifratore]], che si compra nel [[Il pzkstore|pzkstore]]». Ogni chiavetta o wallet tenuto alza il rischio di essere presi del 15 %: tre pezzi sospetti in tasca fanno 49 %.

Nello [[Il cercapersone zero|zero]] il nastro resta da fare: costruisce pezzi HTML veri (i cestini), che nella scheda finta di pzk os non si vedono (README, «Il rider e il clic»: «Resta da fare»).

{{Vedi anche|I lavori rischiosi|Il decifratore|I portafogli smarriti|I mestieri}}
[[Categoria:I mestieri]]`,
  },

  'I lavori rischiosi': {
    data: '2026-10-31',
    fonti: [C('testi.js'), C('comandi/lavoro.js'), 'albertopecchini.it/pzkko/api/wallet.mjs', R],
    testo: `'''I lavori rischiosi''' (26.10.2026) sono i quattro [[I mestieri|mestieri]] con <code>rischio</code>, <code>galera</code> e <code>multa</code>: «pagano tanto, ma a ogni turno si può essere presi (niente paga, la roba sequestrata, la galera, la multa)». Il [[Il bot pzk|bot]] avvisa prima di ogni turno, con la probabilità, e si può lasciar stare; servono il [[Il conto|conto]].

{| class="wikitable"
! mestiere !! livello !! paga !! rischio !! galera !! multa (puliti, alla cassa)
|-
| [[Lo spazzino di uffici|spazzino di uffici]] || 2 || 260 || 4 % + 15 % per pezzo sospetto tenuto || 2 ore || 500
|-
| [[Corriere di notte|corriere di notte]] || 4 || 700 || 12 % || 3 ore || 800
|-
| [[Biscazziere|biscazziere]] || 8 || 1.400 || 18 % || 4 ore || 1.500
|-
| [[Contrabbandiere di tortelli|contrabbandiere di tortelli]] || 12 || 2.200 || 22 % || 6 ore || 2.500
|}

L'arresto lo decide la [[La banca sul server|banca]] (dal 31.10: un'azione che manda in galera restituisce <code>{ arresto: { ore, multa, perche } }</code> e <code>wallet.mjs</code> lo applica nella stessa scrittura; «il browser non può più chiedere l'arresto»). La multa va alla [[La cassa di pzk|cassa di pzk]], come tutto ciò che si perde; in [[La galera|galera]] non si lavora, non si gioca e non si rapina.

{{Vedi anche|La galera|La cauzione|La rapina|L'economia}}
[[Categoria:I mestieri]]
[[Categoria:I soldi]]`,
  },

  'I minigiochi della chat': {
    data: '2026-10-31',
    fonti: [C('minigiochi.js'), C('comandi/lavoro.js'), O('chat.js'), R],
    testo: `'''I minigiochi della chat''' (<code>chat/minigiochi.js</code>, <code>MINIGIOCHI</code>) sono i tredici turni di [[Il lavoro|lavoro]], uno per [[I mestieri|mestiere]]:

{| class="wikitable"
! minigioco !! cosa si fa !! chi lo fa
|-
| riscrivi || riscrivi la frase che compare, senza errori || salumiere
|-
| anagramma || rimetti in ordine le lettere di una parola di <code>PAROLE</code> (chiocciola, sbrisolona, Rigoletto, euroshit…) || influencer
|-
| memoria || i piatti da ricordare, nell'ordine || cameriere, contrabbandiere
|-
| colori || il colore giusto, in fretta || bidello, imbianchino
|-
| icona || trova l'icona chiesta fra quelle mostrate || tatuatore, meccanico
|-
| calcio || il rigore: sinistra, centro o destra || sindaco
|-
| contrario || scrivi il contrario || sviluppatore web
|-
| veloce || la parola che compare all'improvviso, riscritta col tempo || streamer, bagnino
|-
| conti || un conto a mente || prof di analisi, biscazziere
|-
| ordine || metti in ordine le ordinazioni || barista, pizzaiolo
|-
| strada || la consegna: a ogni svolta sinistra, dritto, destra || rider, corriere
|-
| quiz || una domanda dei [[I quiz|quiz]] || avvocato
|-
| nastro || il videogioco dello [[Lo spazzino di uffici|spazzino]]: tieni o butta || spazzino
|}

Le risposte si scrivono con <code>normalizza</code> (accenti e maiuscole non contano); le parole si disegnano su una tela (<code>suTela</code>) perché non si copino. Dal 31.10 la banca prepara la prova e verifica la risposta e il tempo. Le scelte a direzioni (strada, calcio) si premono con le frecce anche nello [[Il cercapersone zero|zero]], e il tasto porta la sua freccia («premi ← ↑ → o fai clic»).

{{Vedi anche|Il lavoro|I mestieri|I comandi della chat}}
[[Categoria:La chat]]`,
  },

  'La morte': {
    data: '2026-10-31',
    fonti: [C('comandi/attivita.js'), C('zaino.js'), 'albertopecchini.it/pzkko/games/pzk.js', 'albertopecchini.it/pzkko/api/_server.mjs', R],
    testo: `[[File:/art/chat-bot/bot-morto.webp|thumb|upright|il bot morto]]
'''La morte''' è l'esito peggiore di <code>cerca</code>, <code>crimine</code> e <code>caccia</code> (il cinghiale, il drago, la bestia che carica mentre resti fermo). Si perde '''il 20 % dei $pzk liberi''' (al più 5.000); il [[Bonsai|bonsai]] (−25 %) e il [[Lucchettone (oggetto)|lucchettone]] (−30 %) ne fanno perdere meno, il [[Cornetto rosso|cornetto rosso]] (900 $pzk, uno per morte) si crepa al posto tuo.

== Dove vanno i soldi ==
I $pzk persi morendo non vanno alla [[La cassa di pzk|cassa]]: cadono per terra, nei [[I portafogli smarriti|portafogli smarriti]], e dopo 96 giorni si distruggono (l'offerta cala). Lo [[Lo spazzino di uffici|spazzino]] che trova un wallet e lo [[Il decifratore|decifra]] li rimette in giro.

== Il cercapersone scassato ==
Dal 23.10 morendo si rompe anche il [[Il cercapersone scassato|cercapersone]]: il vetro crepato, le app spente tranne la chat, che accetta solo <code>lavora</code> e <code>compra cercapersone</code> (700 $pzk, <code>mercato.ricompraPager</code>).

I traguardi: «anche questo è un traguardo» (muori una volta), «immortale (a metà)» (15), «abitué del purgatorio» (50); la metrica <code>morti</code> ha la sua classifica. Dal 31.10 la morte la decide la banca (<code>x.perdi(n)</code>); «guadagnati in tutto» del [[Il libro dei conti|libro]] la sottrae.

{{Vedi anche|Il cercapersone scassato|I portafogli smarriti|Le attività|Cornetto rosso}}
[[Categoria:La chat]]
[[Categoria:I soldi]]`,
  },

  'Il cercapersone scassato': {
    data: '2026-10-31',
    fonti: [C('zaino.js'), C('mercato.js'), C('predittivo.js'), 'albertopecchini.it/tools/pzkko/crepe-piccole.mjs', R],
    testo: `'''Il cercapersone scassato''' (23.10.2026, commit 19b2a52): dopo la [[La morte|morte]] il cercapersone si scassa (<code>zaino.pagerRotto()</code>). Il vetro è crepato (<code>art/chat-pager-crepe/</code>: <code>crepe.webp</code> nello schermo grande, <code>crepe-piccola.webp</code> nel tasto sul muro, ridotta col massimo da <code>tools/pzkko/crepe-piccole.mjs</code>), le app sono spente tranne la [[Chat (app)|chat]], e la chat accetta solo <code>lavora</code> e <code>compra cercapersone</code>: il [[Cercapersone (oggetto)|cercapersone]] dello shop costa 700 $pzk e lo rimette nuovo (<code>mercato.ricompraPager</code>, dal 31.10 l'azione della banca <code>aggiustaPager</code>). Il [[Il testo predittivo|testo predittivo]] da scassato propone solo quei due comandi. Nella pagina di prova (<code>/prova/cercapersone/</code>) ci sono i tasti «muori» e «ripara».

{{Vedi anche|La morte|Il cercapersone zero|Lo zaino}}
[[Categoria:La chat]]`,
  },

  'Lo zaino': {
    data: '2026-10-31',
    fonti: [C('zaino.js'), C('zaino-unisci.mjs'), 'albertopecchini.it/pzkko/api/wallet.mjs', 'albertopecchini.it/pzkko/games/pzk.js', R],
    testo: `[[File:app-zaino.webp|thumb|l'app zaino di pzk os: i filtri, i pezzi, gli effetti in corso]]
'''Lo zaino''' (<code>chat/zaino.js</code>) è tutto quello che un giocatore ha oltre ai soldi: i punti esperienza e il [[L'esperienza e i livelli|livello]], il [[I mestieri|mestiere]] e i turni, gli oggetti con quanti ne ha, le attese dei comandi, gli effetti dei consumabili, le serie di giorni, le statistiche, i [[I tasti rapidi|tasti rapidi]], le [[Le sfide giornaliere|sfide]], le [[Le side quest|quest]], lo stato del [[I quiz|quiz]], della [[La miniera|miniera]] e della [[La cucina|cucina]], il [[Le facce del profilo|profilo]], i leggendari presi (<code>rari</code>), le [[Le app installate|app installate]], i giri ai giochi grandi.

== Dove sta ==
Nella [[La sessione|sessione]] in <code>sessionStorage</code>; col [[Il conto|conto]] sul server (fino al 28.10 <code>pzkko/chat.json</code> su Vercel Blob, al più 12 KB a zaino; poi sul [[Il server dei dati in casa|server in casa]]) e in <code>localStorage</code>. Dal 31.10 ({{Citazione|tutti i dati degli account nel mio server|Alberto, 31.10.2026}}) '''lo zaino lo scrive solo la [[La banca sul server|banca]]''': <code>chat/zaino.js</code> è «SOLO una copia da leggere» (sono spariti <code>aggiungi</code>, <code>togli</code>, <code>daiXp</code>, <code>aspetta</code>, <code>installa</code>, <code>giro</code>…: ogni chiamata è diventata un'azione), e ogni risposta della banca porta il conto con lo zaino dentro (<code>pzk.zainoBanca()</code>).

== Cosa c'è dentro ==
<code>vuoto()</code> = <code>{ v: 1, t: 0, xp: 0, mestiere: null, turni: 0, oggetti: {}, attese: {}, effetti: {}, serie: {}, stat: {}, rapidi: [] }</code>. Le funzioni di lettura: <code>ha(id)</code>, <code>quanti(id)</code>, <code>oggetti()</code>, <code>manca(cmd)</code> (quanto manca a un'attesa), <code>effetto(id)</code>, <code>bonus(k)</code> e <code>bonusTutti()</code>, <code>moltiplicatore()</code>, <code>stat(k)</code>, <code>serie(id)</code>, <code>giochi()</code> (<code>GIOCHI = ['roulette', 'blackjack', 'mine', 'dado', 'moneta', 'virtual']</code>), <code>profilo()</code>, <code>installata(id)</code>, <code>REGALO</code> (il 28.10.2026 alle 23 UTC, il momento fisso in cui si è deciso chi tiene la lavatrice regalata). <code>zaino.ascolta(fn)</code> avvisa a ogni cambio: le app di [[pzk os]] si mettono in ascolto in <code>entra()</code> e smettono in <code>esci()</code>.

== Sincronizzato fra i dispositivi ==
Vedi [[La sincronizzazione fra dispositivi]]: dal 26.10 due zaini si '''uniscono''' (<code>chat/zaino-unisci.mjs</code>, lo stesso nel browser e sul server) invece di sovrascriversi.

== L'app ==
L'app [[Zaino (app)|zaino]] di pzk os ha le pagine coi filtri (tutto, da usare, da tenere, attrezzi, casse, da vendere), gli effetti in corso col tempo che resta, i bonus di adesso, e la scheda di ogni pezzo coi tasti usa, gratta, apri, vendi, vendi tutto. Il comando <code>zaino</code> (inv, inventario, oggetti) lo dice in chat.

{{Vedi anche|I bonus|Lo shop|La sincronizzazione fra dispositivi|Zaino (app)|Elenco degli oggetti}}
[[Categoria:La chat]]`,
  },

  'I bonus': {
    data: '2026-10-23',
    fonti: [C('oggetti.js'), C('zaino.js'), R],
    testo: `'''I bonus''' sono le frazioni che gli oggetti dello [[Lo shop|shop]] sommano allo [[Lo zaino|zaino]] (<code>chat/oggetti.js</code>): <code>{ paga: 0.15 }</code> = +15 % su tutte le paghe, <code>{ xp: 1 }</code> = punti esperienza doppi, <code>{ attese: -0.5 }</code> = attese dimezzate, <code>{ vendita: 0.1 }</code> = +10 % quando si vende, <code>{ morte: -0.25 }</code> = si perde il 25 % in meno di $pzk [[La morte|morendo]], <code>{ sfide: 0.1 }</code> = +10 % sui premi delle [[Le sfide giornaliere|sfide]]. Un '''consumabile''' (tipo «usa») dà il bonus per <code>effetto</code> millisecondi dopo che lo si usa (la [[Pzk-kola]] 20 minuti, il [[Pomodoro maturo|pomodoro]] due ore); una '''cosa da tenere''' (tipo «tieni») lo dà finché sta nello zaino, e se ne conta una sola. <code>zaino.bonus(k)</code> li somma; <code>testoBonus(b)</code> li scrive («paghe +15 % · attese −25 %»). Il moltiplicatore delle paghe è <code>1 + 0,02 × (livello − 1) + bonus('paga')</code>.

I vecchi oggetti di <code>testi.js</code> prendono il bonus da <code>BONUS_VECCHI</code>: il caffè attese −50 % per 10 minuti, la lattina che mette le ali paghe +10 % per 30, la mortadella xp doppi per 20.

{{Vedi anche|Lo zaino|Lo shop|Elenco degli oggetti|Il lavoro}}
[[Categoria:La chat]]
[[Categoria:Gli oggetti]]`,
  },

  'La sincronizzazione fra dispositivi': {
    data: '2026-10-31',
    fonti: [C('zaino.js'), C('zaino-unisci.mjs'), 'albertopecchini.it/pzkko/games/pzk.js', 'albertopecchini.it/pzkko/games/live.js', 'albertopecchini.it/pzkko/api/wallet.mjs', R],
    testo: `'''La sincronizzazione fra dispositivi''' è come lo stesso [[Il conto|conto]], aperto sul pc e sul telefono, resta uguale dappertutto. È passata per tre giri.

== Lo zaino unito (26.10) ==
{{Citazione|dal telefono mi dà livello 1, dal pc 4|Alberto, 26.10.2026}}
Prima vinceva lo zaino col <code>t</code> più recente, e due dispositivi usati a turno si sovrascrivevano a vicenda. Dal 26.10 (commit 1f0fb48) il browser chiede lo [[Lo zaino|zaino]] al server aprendo la pagina (e non salva finché non è arrivato), tornando sulla pagina e ogni due minuti, e i due zaini si '''uniscono''' (<code>chat/zaino-unisci.mjs</code>, lo stesso modulo nel browser e in <code>api/wallet.mjs</code>): esperienza, statistiche, giri ai giochi, leggendari, app, quest finite e record del quiz prendono il meglio dei due; oggetti, attese, effetti e mestiere vengono da chi ha l'ultima parola, cioè chi scrive avendo visto l'ultimo salvato (<code>visto</code>). Per le [[Le app installate|app installate]] vince la decisione più recente, a pari momento installata.

== Il canale sempre aperto (27.10) ==
[[Il canale sempre aperto]]: <code>/api/live/</code> avvisa entro ~3 secondi che zaino o conto sono cambiati da un altro dispositivo.

== I lotti e il canale diretto (29.10 notte) ==
{{Citazione|se entro con 2 telefoni e stesso account assieme devo vedere le cose sincronizzati al millisecondo … tu creami la struttura super solida|Alberto, 29.10.2026}}
Il saldo non si manda più intero: ogni variazione è un [[I lotti numerati|lotto numerato]], applicato dal server una volta sola; e il [[Il canale diretto|canale diretto]] al pc di Alberto manda il riassunto del conto nell'istante in cui lo scrive: il telefono ha visto la vincita del pc dopo '''19 ms'''.

== La banca (31.10) ==
Con la [[La banca sul server|banca]] il problema si è sciolto alla radice: nessun browser scrive più niente, il conto e lo zaino tornano in ogni risposta, e il canale diretto li porta agli altri dispositivi.

{{Vedi anche|Il canale sempre aperto|Il canale diretto|I lotti numerati|Lo zaino}}
[[Categoria:I soldi]]`,
  },

  'Il canale sempre aperto': {
    data: '2026-10-29',
    fonti: ['albertopecchini.it/pzkko/games/live.js', 'albertopecchini.it/pzkko/games/pzk.js', C('zaino.js'), 'albertopecchini.it/pzkko/vercel.json', R],
    testo: `'''Il canale sempre aperto''' (27.10.2026, commit 4e7c90d, <code>api/live.mjs</code> e <code>games/live.js</code>) è nato dalla richiesta di Alberto: {{Citazione|fai un server sempre connesso e che registra tutto subito|Alberto, 27.10.2026}}. Due pezzi, entrambi su Vercel:

# '''Si salva quasi subito''': il saldo (<code>games/pzk.js</code>) e lo [[Lo zaino|zaino]] partono 250 ms dopo l'ultimo cambio (prima 1,2 e 1,5 secondi: dieci puntate di fila restano una richiesta sola), un salvataggio non andato (429, rete, 5xx) si ritenta dopo 8 e 15 secondi, alla chiusura della pagina parte subito (<code>keepalive</code>); il limite del wallet è salito da 300 a 900 richieste ogni 10 minuti.
# '''Chi ha un conto tiene aperta una richiesta a <code>/api/live/</code>''' (POST col token, un avviso JSON per riga): il server dice, entro ~3 secondi, che lo zaino (<code>{ k: 'zaino', t }</code>) o il conto (<code>{ k: 'conto', pzk, es, fn }</code>) sono cambiati da un altro dispositivo, e il browser chiede i dati veri. Vercel chiude una funzione dopo una cinquantina di secondi (<code>maxDuration</code> 60): il server manda <code>{ k: 'riconnetti' }</code> e il browser riapre da sé. Dentro, un solo controllo comune a tutte le connessioni dell'istanza: ogni 3 secondi l'ETag dei due file su Blob (<code>head</code>).

'''Il costo''': due richieste <code>head</code> a Blob ogni 3 secondi per istanza accesa. «Fu proprio questo consumo a far bloccare Blob la notte del 28.10» (le soglie gratuite del piano Hobby, 10.000 letture al mese): da lì [[Vercel Blob]] è uscito per sempre e i dati sono andati sul [[Il server dei dati in casa|server in casa]]. Dal 29.10 notte il canale di prima è la riserva del [[Il canale diretto|canale diretto]]: se quello non c'è o cade tre volte di fila, per due minuti si usa <code>/api/live/</code>. Aperto solo a pagina in vista, col conto, e non nella pagina che dorme sotto la [[La cornice|cornice]] della musica.

{{Vedi anche|Il canale diretto|La sincronizzazione fra dispositivi|Il canale (API)|Vercel Blob}}
[[Categoria:I soldi]]
[[Categoria:Il server]]`,
  },

  'Il canale diretto': {
    data: '2026-10-31',
    fonti: ['albertopecchini.it/pzkko/games/live.js', 'albertopecchini.it/pzkko/games/pzk.js', 'albertopecchini.it/pzkko/api/wallet.mjs', R],
    testo: `'''Il canale diretto''' (29.10.2026 notte) va dritto al [[Il server dei dati in casa|server dei dati sul pc di Alberto]] (<code>GET /v1/live</code>, Server-Sent Events): è lui che scrive i conti e gli zaini, e '''nell'istante in cui li scrive''' manda a chi ascolta un conto il suo riassunto (<code>{ k: 'conto', pzk, eur, disp, agg }</code>: il saldo, gli EUR€, l'ultimo [[I lotti numerati|lotto]] visto di ogni dispositivo, la versione) e <code>{ k: 'zaino', t }</code>.

{{Citazione|se entro con 2 telefoni e stesso account assieme devo vedere le cose sincronizzati al millisecondo … stai usando il mio pc|Alberto, 29.10.2026}}

Il browser (<code>games/live.js</code>) lo dà a <code>pzk.dalCanale</code>, che prende il saldo nuovo subito (più nuovo per <code>agg</code>; i lotti di qui ancora in viaggio restano sopra, quelli già visti si tolgono) e fra 300 ms chiede il resto del conto (<code>sincronizza</code>: le mosse, i soldi sporchi, la galera). Provato con due browser sullo stesso conto: il telefono vede la vincita del pc '''19 ms''' dopo.

== Il biglietto ==
Per aprirlo serve un '''biglietto''' del conto (<code>api/wallet.mjs</code>, azione <code>biglietto</code>: <code>conto.scadenza.firma</code>, firmato col segreto del server <code>PZKKO_SERVER_SECRET</code>; dieci minuti per aprire); il server lo chiude dopo mezz'ora e il browser ne chiede un altro. Il server: solo lettura, solo il proprio conto, solo dalle pagine di pzkko (<code>Origin</code>: pzkko.it, le anteprime, localhost), al più 300 connessioni e 8 per conto, un battito ogni 20 secondi; il biglietto non finisce mai nel registro. Se il canale diretto non c'è (il pc spento, il tunnel giù) o cade tre volte di fila, per due minuti si usa [[Il canale sempre aperto|quello di prima]].

{{Vedi anche|Il canale sempre aperto|La sincronizzazione fra dispositivi|Il tunnel Tailscale|Il server dei dati in casa}}
[[Categoria:I soldi]]
[[Categoria:Il server]]`,
  },

  'L\'economia': {
    data: '2026-10-31',
    fonti: ['albertopecchini.it/pzkko/api/_server.mjs', 'albertopecchini.it/pzkko/api/wallet.mjs', 'albertopecchini.it/pzkko/api/borsa.mjs', 'albertopecchini.it/pzkko/games/pzk.js', R],
    testo: `{{Infobox
| titolo = L'economia dei $pzk
| immagine = /art/chat-pzk/portafoglio.webp
| didascalia = il portafoglio di pelle, uno degli oggetti «di pzk»
| dal = 26 ottobre 2026 (commit 209c4eb)
| file = api/_economia.mjs, api/wallet.mjs, api/_borsa.mjs; dal 31.10 C:\\pzkko-server\\banca\\economia.mjs
| moneta = il [[I $pzk|$pzk]], e gli [[Gli EUR€|EUR€]] per parcheggiarli
| cassa = il conto «banca pzk», pzk000001
}}
'''L'economia''' di [[pzkko.it]] è la regola, scritta il 26.10.2026, per cui i [[I $pzk|$pzk]] non spariscono mai e non nascono gratis.

{{Citazione|i soldi persi o mangiati da te dai giocatori non spariscono ma vanno nelle casse di pzk; se li genero dal nulla sono nuovi|Alberto, 26.10.2026}}

Le regole sono quelle di una moneta vera, e su un punto correggono l'idea di partenza:

== L'offerta ==
[[L'offerta di $pzk|L'offerta]] (i $pzk che esistono) = i conti dei giocatori + la [[La cassa di pzk|cassa di pzk]] + i [[I portafogli smarriti|portafogli smarriti]]. La capitalizzazione della [[La borsa|borsa]] è l'offerta per il cambio (<code>api/borsa.mjs</code>, <code>cap</code>).

== Il conio ==
I soldi che nascono dal nulla (il [[Il lavoro|lavoro]], le [[Le side quest|quest]], le [[Le sfide giornaliere|sfide]], i [[I quiz|quiz]], i [[Il premio giornaliero|premi giornalieri]], la [[La miniera|miniera]], il [[Il sussidio|sussidio]], le [[Le banconote per terra|banconote per terra]], [[Il regalo di Instagram|instagram]], i miracoli della [[La lumachina|lumachina]]) fanno crescere l'offerta. '''Più soldi valgono meno''': la capitalizzazione sale, il singolo $pzk scende. La borsa ne tiene conto: metà della crescita dell'offerta nelle ultime 24 ore (al più ±5 % al giorno) si toglie dalla deriva del cambio (<code>_borsa.mjs</code>, <code>inflazione</code>).

== La cassa ==
La [[La cassa di pzk|cassa]] è il conto «banca pzk» (<code>pzk000001</code>, <code>BANCA</code> in <code>_economia.mjs</code>; non è quello di Alberto, [[Il conto di Alberto|pzk398893]], e non ci si entra): il croupier, il negoziante, il banco. Le puntate perse, gli acquisti dello [[Lo shop|shop]] e delle [[Le facce del profilo|facce]], l'installazione delle app, le commissioni della [[La lavatrice|lavatrice]], le multe e le [[La cauzione|cauzioni]] vanno lì; le vincite, la roba venduta, le [[Le casse|casse]] e il [[Il gratta e vinci|gratta e vinci]], il cambio da EUR€ escono da lì. Se la cassa non basta per pagare, la differenza si conia. I trasferimenti non cambiano l'offerta.

== I portafogli smarriti ==
I $pzk persi [[La morte|morendo]] (il 20 %) non vanno alla cassa: cadono per terra; dopo 96 giorni si distruggono (deflazione, il cambio sale). Lo [[Lo spazzino di uffici|spazzino]] che trova un wallet e lo [[Il decifratore|decifra]] li rimette in giro: «soldi puliti, perché erano destinati a sparire».

== Come il server lo sa ==
Dal 26 al 30 ottobre i giochi giravano nel browser, e il browser etichettava ogni movimento (<code>pzk.regola(gioco, giocato, torna, tipo)</code>: <code>'casa'</code> di base, <code>'conio'</code> per il lavoro e i premi; <code>pzk.perdi(n)</code> per le morti) e mandava i flussi a lotti numerati (<code>flussi: { n, casa, persi }</code>); quello che la differenza di saldo non spiegava era conio, una perdita non spiegata andava alla cassa (<code>contabilizza</code>). Dal 31.10, con la [[La banca sul server|banca]], i soldi si muovono solo con <code>x.gioca</code>, <code>x.punta</code>/<code>x.regola</code>, <code>x.spendi</code> (alla cassa), <code>x.paga</code> (conio, moltiplicato per livello e bonus se non <code>puro</code>; <code>casa</code> = esce dalla cassa) e <code>x.perdi</code> (per terra): «non toccare <code>x.c.pzk</code> a mano».

== I soldi sporchi, la rapina, la galera ==
Il bottino delle [[La rapina|rapine]] è [[I soldi sporchi|sporco]]: si somma al saldo ma con pzk non si spende, si pulisce da solo dopo 96 giorni o nella [[La lavatrice|lavatrice]]. Chi viene preso finisce in [[La galera|galera]], da cui si esce prima con la [[La cauzione|cauzione]]. I [[I lavori rischiosi|lavori rischiosi]] pagano tanto ma possono finire allo stesso modo.

{{Vedi anche|I $pzk|La borsa|La cassa di pzk|I portafogli smarriti|I soldi sporchi|La rapina|La banca sul server|Il libro dei conti}}
[[Categoria:I soldi]]`,
  },

  'L\'offerta di $pzk': {
    data: '2026-10-26',
    fonti: ['albertopecchini.it/pzkko/api/_server.mjs', 'albertopecchini.it/pzkko/api/borsa.mjs', 'albertopecchini.it/pzkko/api/borsa.mjs', R],
    testo: `'''L'offerta di $pzk''' è quanti [[I $pzk|$pzk]] esistono: la somma dei conti dei giocatori, della [[La cassa di pzk|cassa di pzk]] e dei [[I portafogli smarriti|portafogli smarriti]]. È il numero che la [[La borsa|borsa]] chiama '''capitalizzazione''' (<code>cap</code> in <code>api/borsa.mjs</code>: l'offerta per il cambio) e che il [[Il banner del wallet|banner del wallet]] e l'app [[Banca (app)|banca]] mostrano con «i $pzk in giro, su quanti conti».

Cresce col conio (lavoro, premi, quiz, sfide, quest, miniera, sussidio, banconote, instagram, i miracoli della lumachina) e cala quando un portafoglio smarrito compie 96 giorni. L'inflazione è scritta nel cambio: metà della crescita dell'offerta nelle ultime 24 ore (al più ±5 % al giorno) si sottrae alla deriva (<code>_borsa.mjs</code>, <code>inflazione</code>); i trasferimenti fra conti, gli acquisti e le puntate perse non la cambiano, spostano soldi. Le [[Le operazioni della banca|operazioni della banca]] (5.000 $pzk da pzk398893 a pzk113089, il 23.10) sono anche loro trasferimenti.

{{Vedi anche|L'economia|La borsa|La cassa di pzk|I portafogli smarriti}}
[[Categoria:I soldi]]`,
  },

  'La cassa di pzk': {
    data: '2026-10-31',
    fonti: ['albertopecchini.it/pzkko/api/_server.mjs', 'albertopecchini.it/pzkko/api/wallet.mjs', A('rapina.js'), R],
    testo: `'''La cassa di pzk''' è il conto «banca pzk», indirizzo <code>pzk000001</code> (<code>BANCA</code> in <code>api/_economia.mjs</code>): il croupier, il negoziante, il banco di tutti i giochi. Non è il [[Il conto di Alberto|conto di Alberto]] (pzk398893) e non ci si entra.

== Cosa entra e cosa esce ==
{| class="wikitable"
! entra nella cassa !! esce dalla cassa
|-
| le puntate perse ai giochi grandi e a quelli della chat || le vincite
|-
| gli acquisti dello [[Lo shop|shop]] e delle [[Le facce del profilo|facce]] || la roba venduta (pesci, bestie, reperti, la roba degli uffici)
|-
| l'installazione delle app del [[Il pzkstore|pzkstore]] (5.000 la lavatrice, 1.500 il decifratore) || le [[Le casse|casse]] e il [[Il gratta e vinci|gratta e vinci]]
|-
| le commissioni della [[La lavatrice|lavatrice]] (2.000 a lavaggio) || il cambio da [[Gli EUR€|EUR€]]
|-
| le multe e le [[La cauzione|cauzioni]] della [[La galera|galera]] ||
|}
Se la cassa non basta per pagare, la differenza si conia. Dal 31.10 lo fa la [[La banca sul server|banca]]: <code>x.spendi(n, voce)</code> porta alla cassa, <code>x.paga(n, { casa: true })</code> fa uscire dalla cassa.

== La rapina ==
La cassa è anche il bersaglio della [[La rapina|rapina]]: il bottino è il 3 % della cassa più l'1 % a testa (al più 15.000 a testa). Con la cassa piccola non conviene: «a 21.000 $pzk un colpo in due dà circa 530 a testa». L'app [[Rapina (app)|rapina]] dice quanto c'è dentro; il comando <code>banca</code> della chat e l'app [[Giocatori (app)|giocatori]] («la banca in numeri») lo dicono anche loro.

{{Vedi anche|L'economia|La rapina|L'offerta di $pzk|Le notizie della banca}}
[[Categoria:I soldi]]`,
  },

  'I portafogli smarriti': {
    data: '2026-11-01',
    fonti: ['albertopecchini.it/pzkko/api/_server.mjs', 'albertopecchini.it/pzkko/api/wallet.mjs', A('decifratore.js'), C('testi.js'), R],
    testo: `'''I portafogli smarriti''' sono il terzo pezzo dell'[[L'offerta di $pzk|offerta]]: i [[I $pzk|$pzk]] persi [[La morte|morendo]] (il 20 % dei liberi, al più 5.000) non vanno alla [[La cassa di pzk|cassa]], «cadono per terra». Dopo '''96 giorni''' si distruggono: l'offerta cala, è deflazione, il cambio sale.

Si recuperano in un modo solo: lo [[Lo spazzino di uffici|spazzino di uffici]] trova sul nastro una [[Chiavetta usb|chiavetta usb]] o un [[Wallet pzk cifrato|wallet pzk cifrato]] (le cose sospette di <code>UFFICIO</code>, che alzano il rischio di essere presi del 15 % l'una), e il [[Il decifratore|decifratore]] (1.500 $pzk nel [[Il pzkstore|pzkstore]]) li apre con tre giochini: i $pzk escono dal fondo dei portafogli smarriti, tre al giorno, e sono puliti, «perché erano destinati a sparire».

{{Vedi anche|L'economia|La morte|Il decifratore|Lo spazzino di uffici}}
[[Categoria:I soldi]]`,
  },

  'I soldi sporchi': {
    data: '2026-11-01',
    fonti: ['albertopecchini.it/pzkko/api/_server.mjs', 'albertopecchini.it/pzkko/api/wallet.mjs', 'albertopecchini.it/pzkko/games/pzk.js', A('lavatrice.js'), R],
    testo: `'''I soldi sporchi''' sono il bottino delle [[La rapina|rapine]]. Si sommano al saldo ma '''con pzk non si spendono''' (né giochi, né shop, né app: <code>pzk.punta</code> accetta solo i puliti, <code>pzk.puliti()</code> li conta), non si mandano, non si cambiano in [[Gli EUR€|EUR€]]. Si puliscono da soli dopo 96 giorni o nella [[La lavatrice|lavatrice]] (fino a 50.000 in 10 minuti, 2.000 puliti di commissione). Nella bio (il profilo, l'account, la scheda dell'app giocatori) puliti e sporchi si vedono separati; nel cartellino del [[Profilo (app)|profilo]] c'è la riga dei soldi sporchi o della galera.

I [[I giochi|giochi]] a chi ha solo soldi sporchi dicono la strada intera (<code>pzk.perche</code>, <code>pzk.nonBasta</code>: la lavatrice, il pzkstore, i 5.000 puliti). Nel [[Il pzkstore|pzkstore]] «gli sporchi non valgono» e la vetrina dice i puliti che hai. Il pallino sull'icona del pzkstore si accende a chi ha soldi sporchi senza lavatrice.

{{Vedi anche|La rapina|La lavatrice|L'economia|I $pzk}}
[[Categoria:I soldi]]`,
  },

  'La rapina': {
    data: '2026-10-31',
    fonti: [A('rapina.js'), O('rapina.js'), 'albertopecchini.it/pzkko/api/wallet.mjs', 'albertopecchini.it/pzkko/api/_server.mjs', R],
    testo: `{{Infobox
| titolo = La rapina
| immagine = app-rapina.webp
| didascalia = l'app rapina di pzk os
| dal = 26 ottobre 2026
| file = telefono/app/rapina.js (le regole), telefono/zero/os/rapina.js (l'app), api/wallet.mjs (azione «colpo»)
| contro = la [[La cassa di pzk|cassa di pzk]]
| in quanti = da due a quattro
| icona = [[File:/art/chat-app3/app-rapina.webp|32px]]
}}
'''La rapina''' è il colpo alla [[La cassa di pzk|cassa di pzk]], l'unico modo per fare soldi insieme ad altri giocatori: almeno in due e al più in quattro.

== Come si fa ==
# Chi organizza apre il colpo nell'app [[Rapina (app)|rapina]] e ha un '''codice di quattro lettere'''.
# I complici entrano col codice, entro quindici minuti (dalla tastiera, nell'app).
# Chi ha organizzato dà il via («via!», con la conferma): la cassaforte che si scassina per un secondo.

== I numeri ==
{| class="wikitable"
! in quanti !! va a segno !! bottino
|-
| due || 32 % || 3 % della cassa + 1 % a testa, diviso
|-
| tre || 40 % || idem
|-
| quattro || 48 % || idem
|}
Il bottino è al più 15.000 a testa, ed è [[I soldi sporchi|sporco]]. Se va male: '''6 ore di [[La galera|galera]]''' e una multa del 20 % dei puliti (al più 5.000) alla cassa. Un colpo al giorno, col [[Il conto|conto]] di almeno 48 ore («così i conti nuovi non servono a rapinare»). I colpi riusciti e le retate finiscono nelle [[Le notizie della banca|notizie della banca]]. Lo stato del colpo si chiede al server ogni tre secondi (azione <code>colpo</code> di <code>api/wallet.mjs</code>); l'esito già visto si ricorda per conto, perché il server ridà l'ultimo colpo per due ore.

== Conviene? ==
La [[La lavatrice|lavatrice]] costa 5.000 puliti: «un terzo del bottino più grosso a testa (15.000), due lavaggi e mezzo di commissione, più della cauzione e del decifratore. Con un colpo buono si ripaga al primo lavaggio; con la cassa piccola (a 21.000 $pzk un colpo in due dà circa 530 a testa) conviene aspettare i 96 giorni, ed è una scelta».

== Nell'app di pzk os ==
La prima pagina cambia secondo com'è messo il colpo: la cassa (quanto c'è dentro, organizza o entra col codice), il colpo aperto (il codice grande, i secondi che corrono, la banda con la riuscita), il via, riuscito (il sacco che salta, la quota e il bottino, la lavatrice o la sua scheda nel pzkstore), presi (il lampeggiante, poi la cella con le sbarre che si scuotono, quando esci e la [[La cauzione|cauzione]]). Il collaudo la prova con <code>--server-finto --rapina=presi</code> e <code>--rapina=galera</code>.

{{Vedi anche|I soldi sporchi|La galera|La cauzione|La lavatrice|La cassa di pzk|Rapina (app)}}
[[Categoria:I soldi]]`,
  },

  'La galera': {
    data: '2026-10-31',
    fonti: ['albertopecchini.it/pzkko/api/wallet.mjs', 'albertopecchini.it/pzkko/games/pzk.js', A('rapina.js'), C('testi.js'), R],
    testo: `'''La galera''' è dove si finisce quando una [[La rapina|rapina]] va male (6 ore) o quando un [[I lavori rischiosi|lavoro rischioso]] finisce con l'arresto (da 2 a 6 ore secondo il mestiere, più la multa). In galera (<code>pzk.inGalera()</code>, <code>x.galera()</code> sulla banca): '''niente lavoro, niente giochi, niente colpi''', non si compra nel [[Il pzkstore|pzkstore]], la [[La lavatrice|lavatrice]] non parte (quella che gira finisce lo stesso). Si esce prima pagando la [[La cauzione|cauzione]] (3.000 puliti) nell'app [[Rapina (app)|rapina]], che in galera diventa la cella: le sbarre che si scuotono, quando esci, il tasto della cauzione. Il pallino sull'icona della rapina è acceso finché si è dentro; il cartellino del [[Profilo (app)|profilo]] lo dice al posto dei soldi sporchi. Dal 31.10 l'arresto lo scrive solo la [[La banca sul server|banca]] (<code>{ arresto: { ore, multa, perche } }</code>, applicato da <code>wallet.mjs</code> nella stessa scrittura).

{{Vedi anche|La cauzione|La rapina|I lavori rischiosi|L'economia}}
[[Categoria:I soldi]]`,
  },

  'La cauzione': {
    data: '2026-10-29',
    fonti: ['albertopecchini.it/pzkko/api/wallet.mjs', A('rapina.js'), R],
    testo: `'''La cauzione''' sono 3.000 $pzk puliti (azione <code>cauzione</code> di <code>api/wallet.mjs</code>) per uscire dalla [[La galera|galera]] prima delle ore stabilite. Si paga nell'app [[Rapina (app)|rapina]], che in galera è la cella, e va alla [[La cassa di pzk|cassa di pzk]] come le multe. Nel conto della [[La lavatrice|lavatrice]] (5.000) la cauzione è uno dei termini di paragone: «più della cauzione e del decifratore».

{{Vedi anche|La galera|La rapina|La cassa di pzk}}
[[Categoria:I soldi]]`,
  },

  'La lavatrice': {
    data: '2026-11-01',
    fonti: [A('lavatrice.js'), O('lavatrice.js'), A('pzkstore.js'), 'albertopecchini.it/pzkko/api/wallet.mjs', C('zaino.js'), R],
    testo: `{{Infobox
| titolo = La lavatrice
| immagine = app-lavatrice.webp
| didascalia = la lavatrice in pzk os: la macchina, l'oblò, i numeri
| dal = 26 ottobre 2026; nel pzkstore dal 29.10; in pzk os dall'1.11 (commit f46c118)
| file = telefono/app/lavatrice.js, telefono/zero/os/lavatrice.js, api/wallet.mjs (azione «lava»)
| prezzo = 5.000 $pzk puliti, una volta
| lava = fino a 50.000 in 10 minuti, 2.000 puliti di commissione, una alla volta
| icona = [[File:/art/chat-app3/app-lavatrice.webp|32px]]
}}
'''La lavatrice''' pulisce i [[I soldi sporchi|soldi sporchi]] delle [[La rapina|rapine]] senza aspettare i 96 giorni: fino a 50.000 $pzk in 10 minuti, con 2.000 $pzk puliti di commissione alla [[La cassa di pzk|cassa]], un lavaggio alla volta (azione <code>lava</code> di <code>api/wallet.mjs</code>).

== Si compra ==
Fino al 29.10 era nella home di tutti; dal 29.10 ({{Citazione|migliora app lavatrice e poi mettila in questo nuovo programma chiamato pzkstore dove si possono scaricare app nuove e a pagamento|Alberto, 29.10.2026}}) si compra nel [[Il pzkstore|pzkstore]] a 5.000 $pzk puliti, una volta, e vale su tutti i dispositivi del conto. La tiene regalata chi, quando è arrivato il pzkstore, aveva soldi sporchi, un lavaggio in corso o l'aveva già usata: la decisione (<code>lavatrice()</code> in telefono.js) si è scritta una volta nello [[Lo zaino|zaino]] al momento fisso <code>zaino.REGALO</code> (il 29.10.2026 a mezzanotte). Il server non controlla che sia stata comprata prima di lavare: gli acquisti stanno nello zaino, come quelli dello shop. Si toglie senza rimborso, e non mentre gira.

== L'app rifatta (29.10) ==
{{Citazione|migliora app lavatrice|Alberto, 29.10.2026}} A sinistra la macchina, ferma («il cestello che girava non c'è più: niente si muove da solo»), col display che dice pronta, il conto alla rovescia, fine, ferma (in galera) o vuota; a destra i tre numeri (gli sporchi e quando i primi si puliscono da soli, i puliti, la commissione), quanto lavare (di serie il massimo, perché la commissione è fissa; il cursore per lavarne meno) col tasto subito sotto, e come sarai dopo: sporchi e puliti adesso e fra dieci minuti, quanto pesa la commissione in percentuale, quanti lavaggi servono ancora sopra i 50.000, l'avviso se si lava meno della commissione. Finito, «ritira» (se no si puliscono la prossima volta che il conto parla col server). Sotto, la storia (rapine, commissioni, lavaggi, puliti dal tempo) e le regole. In [[La galera|galera]] il tasto è spento.

== In pzk os (1.11) ==
L'app [[Lavatrice (app)|lavatrice]] dello zero è arrivata dopo che il cercapersone nero se n'era andato con la sua (Alberto ha detto «sì» a rifarla): nell'oblò il sacco degli sporchi, il cestello che gira con l'acqua (due volte al secondo, e la macchina che vibra), la moneta pronta, il lucchetto della galera; ↑ ↓ di 5.000 in 5.000; i tre bip di fine lavaggio se finisce mentre la guardi; le sigle <code>lavatrice</code> e <code>lavatrice-pronta</code>. In chat <code>lavatrice</code> (lava, ricicla) la apre e a chi non ce l'ha spiega tutta la strada.

== Il prezzo ==
5.000 puliti: un terzo del bottino più grosso a testa (15.000), due lavaggi e mezzo di commissione, più della [[La cauzione|cauzione]] e del [[Il decifratore|decifratore]]. «È lei che rende spendibile il bottino senza aspettare 96 giorni.»

{{Vedi anche|I soldi sporchi|La rapina|Il pzkstore|Lavatrice (app)|Le app installate}}
[[Categoria:I soldi]]
[[Categoria:Le app di pzk os]]`,
  },

  'Il decifratore': {
    data: '2026-11-01',
    fonti: [A('decifratore.js'), O('decifratore.js'), A('pzkstore.js'), C('testi.js'), 'albertopecchini.it/pzkko/api/wallet.mjs', R],
    testo: `{{Infobox
| titolo = Il decifratore
| immagine = app-decifratore.webp
| didascalia = l'app decifra in pzk os: il codice, le vite, le quattro risposte
| dal = 26 ottobre 2026; in pzk os dall'1.11
| file = telefono/app/decifratore.js, telefono/zero/os/decifratore.js, api/wallet.mjs (azione «decifra»)
| prezzo = 1.500 $pzk puliti, nel pzkstore
| apre = i [[Wallet pzk cifrato|wallet pzk cifrati]] e le [[Chiavetta usb|chiavette]] dello spazzino, tre al giorno
| icona = [[File:/art/chat-app3/app-decifratore.webp|32px]]
}}
'''Il decifratore''' (nel menu di pzk os «decifra») apre i wallet pzk e le chiavette che lo [[Lo spazzino di uffici|spazzino di uffici]] trova sul nastro (<code>UFFICIO</code> in <code>chat/testi.js</code>), con tre giochini facili: '''il cifrario di Cesare''', '''il binario''', '''la sequenza''', '''la parola allo specchio'''; due errori perdonati, al terzo il lucchetto chiuso, «bloccato» (il pezzo resta nello zaino). I $pzk escono dal fondo dei [[I portafogli smarriti|portafogli smarriti]], '''tre al giorno''' (azione <code>decifra</code>), e sono puliti.

Si compra nel [[Il pzkstore|pzkstore]] (1.500 puliti) o in chat con <code>installa decifratore</code>, e solo allora compare nel cercapersone (<code>store: true</code> in <code>APP</code>). Il pallino sull'icona conta i wallet e le chiavette nello zaino; sul pzkstore il «!» avvisa chi ha wallet cifrati senza decifratore. Dal 31.10 i codici li prepara la [[La banca sul server|banca]] (<code>decifratore.apri</code>, <code>decifratore.risolvi</code>) e la banca paga: nel collaudo finto la risposta giusta è sempre la prima.

L'app di [[Decifratore (app)|pzk os]] (1.11): la lista con quanti se ne sono aperti oggi (tre caselle), i pezzi nello zaino con quanto c'è dentro, e il codice: il pezzo, a che codice sei, le vite (♥), la domanda (in <code>DOMANDE</code>, testo semplice), il codice grande nel riquadro, le quattro risposte in due file; le icone nuove <code>wallet-pzk</code> e <code>chiavetta</code> e le sigle <code>decifratore</code>, <code>-giusto</code>, <code>-aperto</code>, <code>-bloccato</code>.

{{Vedi anche|Lo spazzino di uffici|I portafogli smarriti|Il pzkstore|Decifratore (app)}}
[[Categoria:I soldi]]
[[Categoria:Le app di pzk os]]`,
  },

  'Il pzkstore': {
    data: '2026-11-01',
    fonti: [A('pzkstore.js'), O('pzkstore.js'), 'albertopecchini.it/pzkko/telefono/telefono.js', C('zaino.js'), C('comandi/app.js'), R],
    testo: `{{Infobox
| titolo = Il pzkstore
| immagine = app-pzkstore.webp
| didascalia = la vetrina del pzkstore in pzk os
| dal = 29 ottobre 2026 (commit b402ac7)
| file = telefono/app/pzkstore.js (CATALOGO), telefono/zero/os/pzkstore.js
| vende = la [[La lavatrice|lavatrice]] (5.000) e il [[Il decifratore|decifratore]] (1.500)
| icona = [[File:/art/chat-app3/app-pzkstore.webp|32px]]
}}
'''Il pzkstore''' è il negozio delle app del [[Il cercapersone zero|cercapersone]]. Le app di serie sono già nella home; nel pzkstore ci sono quelle da comprare (<code>CATALOGO</code>): la [[La lavatrice|lavatrice]] (5.000 $pzk puliti) e il [[Il decifratore|decifratore]] (1.500).

{{Citazione|migliora app lavatrice e poi mettila in questo nuovo programma chiamato pzkstore dove si possono scaricare app nuove e a pagamento|Alberto, 29.10.2026}}

== Come funziona ==
La vetrina ha l'icona, due righe, il prezzo o «installata»; la scheda dice tutto (cosa fa, quanto costa adesso e a ogni uso, come si usa passo per passo, cosa serve, la versione e le novità) e ha «compra e scarica» («scarica» per quelle gratis). Si paga come nello [[Lo shop|shop]], coi $pzk '''puliti''' alla [[La cassa di pzk|cassa]] (un lotto <code>k:pzkstore</code> e una spesa nel [[Il libro dei conti|libro dei conti]]): gli [[I soldi sporchi|sporchi]] non valgono, in [[La galera|galera]] non si compra, senza [[Il conto|conto]] nemmeno. L'app comprata si installa nello [[Lo zaino|zaino]] (vale su tutti i dispositivi del conto) e compare nella home; aperta senza averla (un link, il tasto della rapina, l'ultima app aperta) porta alla sua scheda (<code>vai</code> in telefono.js, le app con <code>store: true</code>). Si toglie dalla scheda, '''senza rimborso''' («i soldi sono già della cassa, come per tutto quello che si compra»), e la lavatrice non si toglie mentre gira. «Aggiornabile» non c'è: le app sono moduli del sito e arrivano nuove a tutti.

Il pallino sull'icona: le app che ti servirebbero e non hai (soldi sporchi senza lavatrice, wallet cifrati senza decifratore). L'icona (<code>art/chat-app3/app-pzkstore.webp</code>, [[retro-diffusion rd-plus]], <code>tools/pzkko/pixel.mjs</code>) è la freccia verde che scende nella vaschetta, sul rosso («gialla stava accanto alle sfide, gialle anche loro»).

== In chat ==
<code>installa lavatrice</code>, <code>installa decifratore</code> (anche <code>scarica</code>) comprano dallo stesso pzkstore, allo stesso prezzo e con le stesse regole; <code>installa</code> da solo fa l'elenco coi tasti; <code>pzkstore [app]</code> lo apre (sull'app se ce l'hai, se no sulla sua scheda).

== In pzk os ==
L'app [[Pzkstore (app)|pzkstore]]: la vetrina (due righe, le app con icona, nome, una riga, prezzo o «installata», «!» se ti servirebbe, i puliti che hai e gli sporchi che qui non valgono) e la scheda che scorre con ↑ ↓; la sigla «pzkstore» (lo scaricamento); il menu di pzk os si rifà quando lo zaino cambia, così un'app comprata compare subito.

{{Vedi anche|Le app installate|La lavatrice|Il decifratore|Pzkstore (app)|Le app di pzk os}}
[[Categoria:Le app di pzk os]]
[[Categoria:I soldi]]`,
  },

  'Le app installate': {
    data: '2026-10-29',
    fonti: [C('zaino.js'), C('zaino-unisci.mjs'), 'albertopecchini.it/pzkko/telefono/telefono.js', R],
    testo: `'''Le app installate''' stanno nello [[Lo zaino|zaino]] (<code>Z.app</code>): per ogni app del [[Il pzkstore|pzkstore]] il momento dell'ultima decisione, positivo installata e negativo tolta (<code>zaino.installata(id)</code>, <code>installataIl</code>, <code>decisa</code>). Fra due dispositivi vince la più recente, a pari momento installata (<code>chat/zaino-unisci.mjs</code>: prima si prendeva il massimo, e un'app tolta tornava dall'altro dispositivo). La [[La lavatrice|lavatrice]] di prima del pzkstore l'ha tenuta, regalata, chi al momento <code>zaino.REGALO</code> (il 29.10.2026 a mezzanotte) aveva soldi sporchi, un lavaggio in corso o l'aveva già usata. In <code>APP</code> di <code>telefono.js</code> le app comprabili hanno <code>store: true</code> e <code>se: () => zaino.installata(id)</code>: senza, non sono nel menu; aperte senza averle portano alla scheda nel pzkstore.

{{Vedi anche|Il pzkstore|Lo zaino|La sincronizzazione fra dispositivi}}
[[Categoria:Le app di pzk os]]`,
  },

  'Il tomodachi': {
    data: '2026-10-30',
    fonti: [C('tomodachi.js'), O('os.js'), 'albertopecchini.it/pzkko/telefono/zero/muro.js', R],
    testo: `[[File:zero-muro.webp|thumb|il tasto sul muro, con la chiocciolina nel vetro]]
'''Il tomodachi''' (<code>chat/tomodachi.js</code>, 22.10.2026, commit 4fc5ffb: «una chiocciolina a pixel che vive sullo schermo lcd») è la chiocciolina che abita lo schermo del [[Il cercapersone zero|cercapersone]], come un tamagotchi. È pixel art disegnata in codice, su una griglia di 32 × 16 celle: sulla home di [[pzk os]] le celle sono a 4 × 4 pixel (128 × 64) e sta a sinistra, nel desktop a tutto schermo a 8 × 8 («lì c'è il delfino» del Flipper); sul [[Il tasto sul muro|tasto sul muro]] vive nel vetro, e <code>muro.js</code> le passa il desktop appena arriva. Chiede il meteo vero solo con «meteo vero» scelto in regia; saluta quando si chiude il cercapersone (<code>tomodachi.saluta</code>) e l'lcd 3D la mostra durante il volo e la chiusura.

Il 30.10 era lei il guaio del «vedo tutto arancio»: partendo dopo pzk os svuotava l'lcd del tasto (<code>innerHTML = ''</code>) e si portava via la tela di pzk os; ora toglie tutto tranne <code>.ct-os</code>.

{{Vedi anche|La home di pzk os|Il tasto sul muro|Il bot pzk|Il saluto}}
[[Categoria:Il cercapersone]]`,
  },

  'Le facce del profilo': {
    data: '2026-10-29',
    fonti: [A('profilo.js'), O('profilo.js'), 'albertopecchini.it/pzkko/oggetti/oggetti.js', 'albertopecchini.it/pzkko/api/giocatori.mjs', R],
    testo: `[[File:app-profilo.webp|thumb|il cartellino del profilo in pzk os, con la faccia e la cornice]]
'''Le facce del profilo''' sono i 33 avatar fra cui si sceglie la propria faccia (<code>art/chat-avatar/</code> più gli adesivi del [[Il bot pzk|bot]], a pixel con [[retro-diffusion rd-plus]]; l'unica eccezione al bordo bianco di carta). Hanno '''una rarità''' (<code>RARITA</code> in <code>telefono/app/profilo.js</code>):

{{Citazione|rankale come comuni rare… e mettile a pagamento almeno il 70 %|Alberto, 26.10.2026}}

{| class="wikitable"
! rarità !! prezzo !! esempi
|-
| comune || 250 $pzk (ma cinque sono di tutti) || bot, bot-occhiolino, bot-ride, nutria, piccione, bot-pensa, rana, zanzara, riccio, zucca, tortelli
|-
| non comune || 600 || volpe, cinghiale, cervo, luccio, siluro, peluche, av-piccione, av-zucca, av-rana
|-
| raro || 1.500 ||
|-
| epico || 4.000 ||
|-
| leggendario || 12.000, e prima vanno sbloccate || bot-ricco (al livello 10), la carpa d'oro, il drago, il tesoro
|}
Solo cinque comuni sono di tutti; le altre 28 su 33 (85 %) si comprano coi $pzk (<code>Z.profilo.avs</code>): toccandone una non tua si apre la vetrina col prezzo. <code>compraFaccia</code> e <code>nomeAv</code> sono una regola sola per il profilo vecchio, per quello di pzk os e per la pagina [[Oggetti (pagina)|/oggetti/]], che le elenca con rarità e prezzo e segna quelle tue. Col conto la faccia va nella riga pubblica del [[Il database dei giocatori|database]] (<code>pr</code>): gli altri la vedono nelle [[Le classifiche|classifiche]], e il colore e il motto nella scheda. I traguardi «collezionista di facce» (10, le 5 di tutti contano) e «camerino dei travestimenti» (20).

Il profilo ha anche il '''colore''', la '''cornice''' (nastro, oro, neon, pixel, niente) e il '''motto''' (60 lettere; il traguardo «filosofo»).

{{Vedi anche|Profilo (app)|Il database dei giocatori|Elenco dei traguardi}}
[[Categoria:La chat]]`,
  },

  'I traguardi': {
    data: '2026-10-26',
    fonti: [C('traguardi.js'), 'albertopecchini.it/pzkko/traguardi/index.html', 'albertopecchini.it/pzkko/traguardi/traguardi.js', R],
    testo: `[[File:traguardi.webp|thumb|la pagina /traguardi/: quelli fatti e quelli da fare]]
'''I traguardi''' sono gli achievement di pzkko (<code>chat/traguardi.js</code>): la pagina [[Traguardi (pagina)|/traguardi/]] della [[La barra in alto|barra]] e la pagina «progressi» del [[Profilo (app)|profilo]]. Erano 26 il 26.10 mattina («barra e wiki vuota»), '''47''' dalla sera («altri obbiettivi/traguardi»): per lo più scaglioni più alti degli stessi contatori.

== Come funzionano ==
Non si salvano a parte: '''ogni traguardo è una funzione''' che legge lo [[Lo zaino|zaino]] (le statistiche, i giochi grandi, la cucina, le facce, i leggendari) e i soldi, e dice a che punto sei (<code>n</code> su <code>di</code>); quindi valgono anche quelli fatti prima che esistessero. Col conto lo zaino è quello del conto; senza, quello di questa scheda.

== I gruppi ==
{| class="wikitable"
! gruppo !! traguardi
|-
| la banca || mettersi in regola (crea il conto), riccone (50.000 liberi), miliardario in sedicesimi (500.000)
|-
| l'esperienza || si comincia (livello 5), veterano (10), ormai di casa (15), leggenda del muro (20), mito vivente (30)
|-
| la chat col bot || chiacchierone (100 comandi), amico del bot (500), stakanovista (50 turni), schiavo del sistema (200), pescatore del Mincio (50), il Mincio è casa mia (200), re del Mincio (la carpa d'oro), cacciatore di nutrie (50), incubo delle nutrie (200), ammazzadraghi (il drago), tombarolo gonzaghesco (50 scavi), talpa umana (200), il tesoro dei Gonzaga, anche questo è un traguardo (muori una volta), immortale (a metà) (15), abitué del purgatorio (50)
|-
| i giochi || giocatore (100 mani), habitué del tavolo (500), il banco ringrazia (2.000), girandola (una mano in tutti e sei), colpo grosso (1.000 in una mano), jackpot (5.000)
|-
| testa e costanza || cervellone (50 quiz giusti), enciclopedia ambulante (200), Quark in persona (500), curioso (100 domande), a raffica (8 di fila), costante (7 giorni di premio), puntuale come le tasse (30), ossessionato (30 sfide), sfida infinita (100), eroe di Mantova (5 quest), cavaliere del Mincio (10), ogni bivio è mio (tutte e 13)
|-
| la cucina || la nonna è fiera (una medaglia d'oro), chef del Mincio (l'oro in tutte e quattro le ricette)
|-
| il profilo || collezionista di facce (10), camerino dei travestimenti (20), filosofo (il motto)
|}
«Il salto di qualità» (comprare lo zero) non c'è più dal 31.10: lo zero è di serie. La tabella completa con le soglie è in [[Elenco dei traguardi]].

{{Vedi anche|Elenco dei traguardi|Traguardi (pagina)|Lo zaino|Le sfide giornaliere}}
[[Categoria:I traguardi]]`,
  },

  'Le sfide giornaliere': {
    data: '2026-10-31',
    fonti: [C('sfide.js'), O('sfide.js'), A('sfide.js'), R],
    testo: `[[File:app-sfide.webp|thumb|l'app sfide: i giorni di fila, le tre sfide, il bonus]]
'''Le sfide giornaliere''' (23.10.2026, <code>chat/sfide.js</code>): ogni giorno '''tre sfide''' (facile, media, difficile) fatte con quello che sai fare («niente pesca senza canna»), misurate sulle statistiche dello [[Lo zaino|zaino]]; tutte e tre danno il bonus del giorno con una [[Le casse|cassa]], e la serie di giorni di fila lo fa crescere. Cambiano a mezzanotte di Mantova; i premi che contano li dà la [[La banca sul server|banca]] (<code>sfide.riscuoti</code>, <code>sfide.bonus</code>).

{| class="wikitable"
! modello !! statistica !! facile / media / difficile
|-
| pesca || pescati || 3 / 6 / 10 pesci
|-
| caccia || cacciati || 2 / 5 / 8 bestie
|-
| scava || scavati || 2 / 5 / 8
|-
| comandi || comandi || 8 / 16 / 30 comandi al bot
|-
| guadagna || guadagnati || 200 / 600 / 1.500 $pzk
|-
| vinci || vinti || 60 / 250 / 800 $pzk ai giochi
|-
| compra || acquisti || 1 / 2 / 4 pezzi allo shop
|-
| quiz || quizGiusti || 2 / 5 / 8 risposte giuste
|-
| lavora || turniLavoro || 1 / 2 / 4 turni
|-
| missione || passiMissione || 1 / 3 / 5 passi in una side quest
|}
I premi (<code>PREMI</code>): 150 $pzk e 15 xp, 320 e 35, 650 e 70, prima del moltiplicatore; il bonus del giorno 500 $pzk e una cassa comune; il [[Coperchio pzkkonet|coperchio pzkkonet]] dà +10 % sui premi. In chat <code>sfide</code> e <code>sfide riscuoti</code>; nell'app [[Sfide (app)|sfide]] di pzk os OK fa «riscuoti» se è pronta o «vai» se no, che apre l'app dove si fa (la chat col comando giusto, lo shop, il quiz, le quest). I traguardi «ossessionato» (30) e «sfida infinita» (100).

{{Vedi anche|Elenco delle sfide|Sfide (app)|Il premio giornaliero|I traguardi}}
[[Categoria:La chat]]`,
  },

  'I quiz': {
    data: '2026-11-02',
    fonti: [C('quiz.js'), C('quiz-dati.js'), C('quiz-altre.js'), C('immagini.js'), O('quiz.js'), R],
    testo: `{{Infobox
| titolo = I quiz retributivi
| immagine = app-quiz.webp
| didascalia = una domanda del quiz in pzk os, con la barra dei 15 secondi
| dal = 23 ottobre 2026 (commit c3e9c91)
| file = chat/quiz.js, chat/quiz-dati.js, chat/quiz-altre.js, telefono/zero/os/quiz.js
| partita = 8 domande, 15 secondi l'una
| paga = 20 / 40 / 80 $pzk a risposta giusta, le prime 40 giuste del giorno
}}
'''I quiz''' sono partite da 8 domande su un argomento, 15 secondi l'una; ogni risposta giusta paga 20, 40 o 80 $pzk secondo la difficoltà, di più se veloce o in serie; pagano le prime 40 giuste del giorno. In chat <code>quiz [argomento]</code> (<code>quiz lista</code> per gli argomenti).

== Gli argomenti ==
I sette di serie (<code>ARGOMENTI</code> in <code>chat/quiz-dati.js</code>): Mantova, cucina, cultura, scienza, tech, giochi, pzk; più «foto» (che cos'è nella [[Le foto vere dei quiz|foto]]) e «giocatori» (domande fatte col [[Il database dei giocatori|database]]). Dal 26.10 otto nuovi in <code>quiz-altre.js</code>: geometra, informatica, storia, geografia, natura, musica, sport, matematica, più domande in coda ai vecchi: 262 voci. «I fatti di Mantova sono verificati sul web»; «solo fatti controllabili: le domande sull'economia di pzk sono state tolte se non verificate sul codice». Le VERO/FALSO (<code>['vero','falso']</code>: la prima è la giusta, <code>vf: true</code>, due tasti grandi).

== Dove stanno le domande ==
Dal 31.10 '''non nel browser''': «con le risposte giuste dentro, chi apriva la console le sapeva tutte». Stanno sulla [[La banca sul server|banca]] (<code>banca\\dati\\quiz-dati.mjs</code>), che le manda una alla volta senza la giusta (<code>quiz.nuova</code>, <code>quiz.prossima</code>, <code>quiz.rispondi</code>) e verifica risposta e tempo. In <code>quiz-dati.js</code> restano i nomi e le icone, per i menu.

== In pzk os ==
L'app [[Quiz (app)|quiz]]: l'ingresso (le regole in una riga, le pagate di oggi, il record, gli argomenti); la domanda con la barra dei 15 secondi che si accorcia e gli ultimi tre che ticchettano, le risposte A–D con ↑ ↓ e OK o coi tasti a–d e 1–4; risposto, la giusta col ✓ e la spiegazione; dal 2.11 ({{Citazione|fai che i quiz avanzino senza premere ogni volta enter|Alberto, 2.11.2026}}) la prossima arriva da sola: 2,5 s dopo una giusta, 4,5 dopo una sbagliata. Le foto arrivano a un bit col retino di Bayer. Il riepilogo: quante giuste, il guadagno, ancora.

== Il quiz lampo ==
Dopo un comando la banca può aprire un '''quiz lampo''' o, dal 26.10, un '''vero o falso lampo''' (6 secondi): pagano come il quiz. Il minigioco «quiz» è anche il turno dell'[[Avvocato|avvocato]]. I traguardi: cervellone (50), enciclopedia ambulante (200), Quark in persona (500), curioso (100 domande), a raffica (8 di fila).

{{Vedi anche|Elenco degli argomenti dei quiz|Le foto vere dei quiz|Quiz (app)|I traguardi}}
[[Categoria:La chat]]`,
  },

  'Le side quest': {
    data: '2026-10-31',
    fonti: [C('missioni.js'), C('missioni-dati.js'), C('missioni-altre.js'), O('missioni.js'), R],
    testo: `[[File:app-missioni.webp|thumb|l'app quest in pzk os: l'elenco delle storie]]
'''Le side quest''' (23.10.2026) sono storie a bivi per Mantova, con costi, rischi, oggetti che servono e un premio alla fine (<code>chat/missioni.js</code>; i dati in <code>missioni-dati.js</code> e, dal 26.10, <code>missioni-altre.js</code>). Erano cinque, sono '''tredici'''. In chat <code>missioni</code> le elenca, <code>quest civico28</code> comincia, <code>quest civico28 2</code> sceglie il bivio.

{| class="wikitable"
! quest !! livello !! serve !! premio
|-
| [[Il civico 28]] («una porta che dice "chiuso" dal 1987») || 1 || il [[Citofono, civico 28|citofono]] || 450 $pzk, 80 xp, una chiave di ferro vecchia
|-
| [[Il pomodoro che scoppia]] || 1 || un [[Pomodoro maturo|pomodoro]] (si consuma) || 220, 45, cassa comune
|-
| [[La petizione (quest)|La petizione]] («tre firme prima del tramonto») || 1 || la [[Petizione «pzkko.it è un bel sito?»|petizione]] || 350, 70, tè freddo
|-
| [[Il Landini non parte]] («testa calda del 1957») || 2 || il [[Landini L25 testa calda (1957)|Landini]] || 600, 90, cassa comune
|-
| [[Il drago del Mincio]] («dorme sotto il ponte, ha fame») || 3 || niente || 1.000, 150, cassa rara
|-
| [[La nutria sindacalista]] («sciopero sull'argine») || 1 || niente || 300, 60, cassa comune
|-
| [[Il ponte che non finisce]] || 1 || niente || 380, 70, tè freddo
|-
| [[La sagra dei tortelli]] («tre banchi, una giuria, una zucca») || 2 || niente || 520, 85, cassa comune
|-
| [[Il cliente fantasma]] («un tavolo prenotato da trent'anni») || 2 || niente || 480, 80, tè freddo
|-
| [[La rana che canta]] («un concerto nel fosso») || 1 || niente || 280, 55, cassa comune
|-
| [[La statua che parla]] («Virgilio vuole un favore») || 3 || niente || 800, 120, cassa rara
|-
| [[La campana stonata]] («suona le 13») || 2 || niente || 450, 75, tè freddo
|-
| [[La consegna impossibile]] («un indirizzo che non esiste») || 2 || niente || 420, 70, cassa comune
|}
Le otto nuove sono «tutte senza oggetti per cominciare»; il controllo: ogni <code>vai</code> esiste e ogni nodo si raggiunge. Nell'app [[Quest (app)|quest]] la storia si scrive da sola in un secondo col ticchettio, le scelte una per riga col costo e il rischio, «lascia la quest» confermato; una bloccata dice cosa manca e porta allo shop. I traguardi: eroe di Mantova (5), cavaliere del Mincio (10), ogni bivio è mio (13); le [[Le sfide giornaliere|sfide]] chiedono passi in una quest. Dal 31.10 i passi li fa la banca (<code>app-missioni.mjs</code>).

{{Vedi anche|Elenco delle side quest|Quest (app)|Lo shop}}
[[Categoria:Le side quest]]
[[Categoria:La chat]]`,
  },

  'Le foto vere dei quiz': {
    data: '2026-10-26',
    fonti: [C('immagini.js'), O('foto.js'), O('icone.js'), R],
    testo: `[[File:app-foto.webp|thumb|la galleria dell'app foto in pzk os]]
'''Le foto vere dei quiz''' (<code>chat/immagini.js</code>) sono le immagini dell'argomento «foto» («che cos'è nella foto») e della [[Foto (app)|app foto]]: 14 il 23.10 (monumenti di Mantova, il cibo, il Landini, il Ciao), '''126''' dal 26.10, da [[Wikimedia Commons]] (solo CC BY, CC BY-SA, CC0 e pubblico dominio, con autore e licenza stampati sotto la foto) e, per una foto da Imgur, una voce con <code>imgur: '<id>'</code> al posto di <code>url</code> (Imgur non si può cercare né caricare senza una chiave API: gli id li dà Alberto).

Ogni voce ha <code>cosa</code> (il Palazzo Ducale, la Sala dei Giganti di Palazzo Te, la Torre dell'Orologio, il Lago Superiore, la basilica di Sant'Andrea…), <code>autore</code>, <code>licenza</code>, <code>pagina</code> e <code>cat</code> (mantova 27, natura 20, tech 24, cibo 16, varie 14, geometra 13, arte 12), per scegliere i finti sbagliati nella stessa categoria. «Da controllare a occhio: alcune <code>cosa</code> sono ambigue» (agnolini, risottopilota, salame, sabbioneta accanto a ducale, borghetto che è in provincia di Verona). <code>src(id)</code> e <code>credito(id)</code> le danno a chi le mostra. Nello zero arrivano a un bit: nel quiz col retino di Bayer, nell'app foto con la diffusione dell'errore (Floyd–Steinberg a serpentina), «sulle foto più dettaglio del retino». Una foto che il browser non lascia leggere ha il punto di domanda.

{{Vedi anche|Elenco delle foto dei quiz|I quiz|Foto (app)}}
[[Categoria:La chat]]
[[Categoria:Le immagini]]`,
  },

  'Il database dei giocatori': {
    data: '2026-10-29',
    fonti: ['albertopecchini.it/pzkko/api/giocatori.mjs', 'albertopecchini.it/pzkko/api/giocatori.mjs', C('db.js'), C('comandi/giocatori.js'), O('giocatori.js'), R],
    testo: `[[File:app-giocatori.webp|thumb|l'app giocatori: le classifiche col podio]]
'''Il database dei giocatori''' (23.10.2026, <code>api/_giocatori.mjs</code>, <code>api/giocatori.mjs</code>, <code>chat/db.js</code>) è un file (fino al 28.10 <code>pzkko/giocatori.json</code> su Vercel Blob, poi sul [[Il server dei dati in casa|server in casa]]) con la riga pubblica di ogni giocatore: livello, statistiche, mestiere, serie, leggendari presi, ultima volta visto, la faccia e il profilo (<code>pr</code>), i giochi (<code>gi</code>). Si aggiorna a ogni salvataggio dello zaino e si unisce ai conti del wallet a ogni richiesta («i $pzk sono sempre quelli veri»). '''Mai il PIN né gli oggetti uno per uno.'''

== L'API ==
<code>GET ?top=metrica</code> (le classifiche), <code>?cerca=</code>, <code>?ind=pzk123456</code> (profilo con la posizione in ogni classifica), <code>?stats=1</code>, <code>?notizie=1</code>; <code>POST { token, vicini }</code> per il proprio profilo e i rivali. Con la barra finale (<code>/api/giocatori/</code>). Vedi [[I giocatori (API)]].

== Le metriche ==
Diciassette, in <code>db.METRICHE</code>: $pzk liberi, esperienza, livello, guadagnati in tutto, vinti ai giochi, persi ai giochi, pescati, cacciati, scavati, morti, comandi scritti, risposte giuste ai quiz, sfide fatte, side quest fatte, serie di giorni, acquisti, giorni di vita, EUR€. Dal 29.10 i numeri dei soldi li tiene il [[Il libro dei conti|libro dei conti]] del server.

In chat: <code>classifica [metrica]</code>, <code>cerca mat</code>, <code>giocatore mario</code>, <code>notizie</code>, <code>rivale</code>, <code>banca</code>; in pzk os l'app [[Giocatori (app)|giocatori]] (le classifiche col podio coi numeri rovesciati, le notizie, cerca, «io» con la [[La lumachina|lumachina]]). L'argomento «giocatori» dei [[I quiz|quiz]] fa domande col database.

{{Vedi anche|Le classifiche|Le notizie della banca|Giocatori (app)|I giocatori (API)|Il libro dei conti}}
[[Categoria:La chat]]
[[Categoria:Il server]]`,
  },

  'Le notizie della banca': {
    data: '2026-10-31',
    fonti: ['albertopecchini.it/pzkko/api/giocatori.mjs', C('comandi/giocatori.js'), O('giocatori.js'), R],
    testo: `'''Le notizie della banca''' sono la bacheca di quello che succede fra i giocatori: salite di livello, leggendari presi (la carpa d'oro, il drago, il tesoro), vincite grosse (dal 29.10 quelle di almeno 1.500 $pzk in un giro, dal server: <code>notizieVincite</code>), mestieri nuovi, serie di giorni, le catastrofi e i miracoli della [[La lumachina|lumachina]], i colpi riusciti e le retate della [[La rapina|rapina]]. Il server manda i dati (<code>?notizie=1</code> di [[I giocatori (API)|/api/giocatori/]]), «le parole le mette il browser». In chat <code>notizie</code> (news, bacheca); nell'app [[Giocatori (app)|giocatori]] la pagina «notizie» (icona, testo su due righe, quanto fa); nella home del cercapersone il riquadro «dalla banca», che diventa urgente se la lumachina ha combinato qualcosa.

{{Vedi anche|Il database dei giocatori|La lumachina|La rapina}}
[[Categoria:La chat]]`,
  },

  'Lo shop': {
    data: '2026-10-31',
    fonti: [C('testi.js'), C('oggetti.js'), C('mercato.js'), C('comandi/negozio.js'), A('negozio.js'), O('negozio.js'), R],
    testo: `{{Infobox
| titolo = Lo shop
| immagine = app-negozio.webp
| didascalia = lo shop in pzk os: le offerte del giorno
| dal = 22 ottobre 2026 (il negozio della chat); 23.10 lo shop del telefono (commit f5722b3)
| file = chat/testi.js (NEGOZIO), chat/oggetti.js (NUOVI, REPARTI), chat/mercato.js, telefono/app/negozio.js, telefono/zero/os/negozio.js
| pezzi = 46 in cinque reparti (più lo zero, fuori vendita)
| si paga = coi $pzk puliti, alla cassa di pzk
}}
'''Lo shop''' è dove si comprano gli oggetti coi [[I $pzk|$pzk]]: in chat con <code>negozio [reparto]</code> e <code>compra</code>, nel cercapersone con l'app [[Shop (app)|shop]] (offerte, carrello, tutto il catalogo). 46 pezzi in cinque [[I reparti dello shop|reparti]]; '''32 sono le cose citate da Alberto nelle sue chat''' («nello shop il cibo e le cose che Alberto ha citato nelle chat», 23.10): il cibo dei volantini e della spazzatura, la roba degli annunci e degli scontrini, le cose di pzk.

== I pezzi ==
* '''il cibo e le bevande''' (consumabili, tipo «usa», danno un [[I bonus|bonus]] a tempo): [[Pzk-kola]] 180, [[Tè freddo alla pesca]] 150, [[Mirtilli, fragole e lamponi]] 220, [[Zucca mantovana]] 120, [[Tortelli di zucca]] 450 (xp +50 % e paghe +5 % per 30 minuti), [[Grissini alla pizza]] 60, [[Ramen box Pechino]] 300, [[Sbrisolona]] 280, [[Mostarda mantovana]] 260, [[Pomodoro maturo]] 40 («Non scoppia. Quasi mai.»), e i vecchi [[Caffè]] 250, [[Lattina che mette le ali]] 500, [[Mortadella]] 200.
* '''gli attrezzi''': [[Canna da pesca]] 350, [[Esca viva]] 60, [[Fionda]] 300, [[Fucile da caccia]] 1.500, [[Pala]] 300, [[Telefono (oggetto)|Telefono]] 600 (gli attrezzi si hanno una volta sola).
* '''la fortuna''': [[Cornetto rosso]] 900, [[Gratta e vinci (oggetto)|gratta e vinci]] 100, [[Cassa comune]] 400, [[Cassa rara]] 1.200, [[Cassa dei Gonzaga]] 4.000.
* '''la roba''' (da tenere, bonus finché sta nello zaino): [[Zaino Eastpak]] 700, [[Piaggio Ciao PX]] 1.800, [[Landini L25 testa calda (1957)]] 6.000 (paghe +8 %), [[Stampante Epson ET-2825]] 900, [[IPhone Duo|iPhone Duo]] 3.625 («Costa quanto dice il volantino»), [[Stufa a legna]] 902 (dallo scontrino di Tecnomat: 1.803,10 € per due), [[Bonsai]] 450 (morte −25 %), [[Penne BIC con corda e scotch]] 30, [[Hyundai Tucson]] 12.000 (paghe +12 %), [[Manuale del Landini L25]] 120.
* '''le cose di pzk''': [[Pacchetto luckypzkko (vuoto)]] 80, [[Gomma masticata]] 5, [[Tombino con i rilievi]] 500, [[Lucchettone (oggetto)|Lucchettone]] 800 (morte −30 %), [[Citofono, civico 28]] 250 (serve per una quest), [[Coperchio pzkkonet]] 350 (sfide +10 %), [[Portachiavi col tasto luce]] 400 (attese −5 %), [[Petizione «pzkko.it è un bel sito?»]] 60, [[Neon pzkko]] 2.500 (paghe +6 %), [[Portafoglio di pelle]] 1.500 (vendite +8 %), [[Cercapersone (oggetto)|Cercapersone]] 700, [[Peluche della chiocciola]] 300; il [[Cercapersone zero (oggetto)|cercapersone zero]] (9.999, xp +10 %, attese −10 %) è '''fuori vendita''' dal 31.10, di serie per tutti, chi l'aveva lo tiene coi bonus.

== Il mercato ==
<code>chat/mercato.js</code> tiene i prezzi di oggi in un posto solo, per la chat e per l'app: le '''offerte del giorno''' sono tre pezzi a −20, −30, −40 % scelti a sorte col giorno di Mantova come seme (tutti vedono le stesse, cambiano a mezzanotte, con il conto alla rovescia nell'app). Dal 31.10 gli acquisti li fa la [[La banca sul server|banca]] (<code>chat-negozio.mjs</code>, coi prezzi e le offerte calcolati da lei): i soldi vanno alla [[La cassa di pzk|cassa]], gli [[I soldi sporchi|sporchi]] non valgono. Le icone sono nei fogli <code>chat-cibo</code>, <code>chat-roba</code>, <code>chat-pzk</code> (dal 26.10 a pixel).

== L'app ==
Le pagine offerte del giorno, tutto, i cinque reparti, il carrello; la riga dell'ordine (ordine, «posso comprarli», cerca; scrivendo dalla tastiera si cerca); la scheda col prezzo pieno barrato e quello d'oggi, i bonus, i tasti ♥ − + carrello compra; lo scontrino che si stampa riga per riga col ticchettio e la sigla della cassa. Il comando <code>shop</code> (ecommerce) la apre dalla chat; la pagina [[Oggetti (pagina)|/oggetti/]] della barra elenca tutto per reparto con rarità e prezzo.

{{Vedi anche|Elenco degli oggetti|I reparti dello shop|I bonus|Lo zaino|Shop (app)|Le casse}}
[[Categoria:Gli oggetti]]
[[Categoria:La chat]]`,
  },

  'I reparti dello shop': {
    data: '2026-10-23',
    fonti: [C('oggetti.js'), C('comandi/negozio.js'), R],
    testo: `'''I reparti dello shop''' sono i cinque di <code>REPARTI</code> in <code>chat/oggetti.js</code>, ognuno con un'icona-insegna: '''cibo e bevande''' (tortelli), '''attrezzi''' (canna), '''fortuna''' (cassa rara), '''la roba''' (landini), '''cose di pzk''' (peluche). In chat <code>negozio cibo</code>, <code>negozio roba</code>…: ogni pezzo in una riga col tasto «compra»; <code>negozio</code> da solo le offerte del giorno. I vecchi oggetti di <code>testi.js</code> prendono il reparto da <code>REPARTO_VECCHI</code> (canna, esca, fionda, fucile, pala, telefono → attrezzi; cornetto, gratta, le tre casse → fortuna; caffè, lattina, mortadella → cibo). Il [[Il testo predittivo|testo predittivo]] propone i reparti dopo <code>negozio</code>.

{{Vedi anche|Lo shop|Elenco degli oggetti}}
[[Categoria:Gli oggetti]]`,
  },

  'Le casse': {
    data: '2026-10-31',
    fonti: [C('testi.js'), C('comandi/negozio.js'), O('zaino.js'), R],
    testo: `'''Le casse''' sono i tre oggetti di tipo «cassa» del reparto fortuna, da aprire con <code>apri comune / rara / gonzaga</code> (open, cassa) o dall'app [[Zaino (app)|zaino]]: la [[Cassa comune]] (400 $pzk: «dentro: $pzk, un oggetto, o niente»), la [[Cassa rara]] (1.200: «più $pzk, attrezzi, qualcosa di raro»), la [[Cassa dei Gonzaga]] (4.000: «il tesoro di una dinastia. O una delusione da 4.000 $pzk»). Sono anche il premio del bonus delle [[Le sfide giornaliere|sfide]] (una cassa comune) e di molte [[Le side quest|side quest]]. Quello che esce lo paga la [[La cassa di pzk|cassa di pzk]] (dal 31.10 la banca lo tira con crypto): «le casse e il gratta e vinci escono da lì».

{{Vedi anche|Lo shop|Il gratta e vinci|Lo zaino}}
[[Categoria:Gli oggetti]]`,
  },

  'Il gratta e vinci': {
    data: '2026-10-31',
    fonti: [C('testi.js'), C('comandi/negozio.js'), O('chat.js'), R],
    testo: `'''Il gratta e vinci''' costa 100 $pzk nel reparto fortuna e si gioca con <code>gratta</code> (scratch): nove caselle in una griglia 3×3, tre uguali e vinci. Nella chat HTML la griglia si gratta col dito; nello [[Il cercapersone zero|zero]] la griglia si disegna a pixel e la croce sceglie la cella (è uno dei comandi con la «maniglia» finta). Dal 31.10 lo tira la [[La banca sul server|banca]], e il premio esce dalla [[La cassa di pzk|cassa]].

{{Vedi anche|Le casse|Lo shop}}
[[Categoria:Gli oggetti]]`,
  },

  'La miniera': {
    data: '2026-10-31',
    fonti: [A('miniera.js'), C('miniera.js'), C('miniera-dati.mjs'), C('miniera-pixel.js'), O('miniera.js'), 'albertopecchini.it/tools/pzkko/miniera-icona.mjs', R],
    testo: `{{Infobox
| titolo = La miniera
| immagine = app-miniera.webp
| didascalia = la postazione in pzk os, a un bit e in negativo
| dal = 23 ottobre 2026 (commit ee9b9c6)
| file = telefono/app/miniera.js, chat/miniera.js (le regole), chat/miniera-dati.mjs (il catalogo), chat/miniera-pixel.js (i disegni), telefono/zero/os/miniera.js
| pezzi = 75 su cinque livelli, in 12 categorie; 8 PC pronti
| produce = fino a 12 ore a pagina chiusa, al più 18.000 $pzk per incasso
| icona = [[File:/art/chat-miniera/app-miniera.webp|32px]]
}}
'''La miniera''': si minano [[I $pzk|$pzk]] col PC, ma prima bisogna comprare i pezzi e farsi la postazione.

== I pezzi ==
Dodici posti (<code>CATEGORIE</code>): tavolo, sedia, case, processore, schede video (più d'una), ram, ventole (più d'una), led, memoria, schermi (più d'uno), tastiera, mouse; tavolo, sedia, case, processore, ram, memoria, schermo, tastiera e mouse sono obbligatori. '''75 pezzi''' su cinque livelli, dal tavolo della sagra alla «lumaca rtx 4090». Tutto si incastra: il case sta sul tavolo se è abbastanza largo, le schede lunghe solo nei case che le tengono, gli schermi quanti ne porta il tavolo; il calore delle schede contro le ventole fa la temperatura, e '''sopra gli 80 °C il PC rallenta'''; la sedia, il tavolo, la ram, la memoria, i led, gli schermi, la tastiera e il mouse moltiplicano (la sedia fino a +30 %).

== I PC pronti ==
Otto, con uno sconto dal 5 al 12 %: dal [[Il muletto da ufficio|muletto da ufficio]] da 808 $pzk (16 $pzk/ora) alla [[La centrale della lumaca|centrale della lumaca]] da 366.080 (1.476 $pzk/ora). Vedi [[I PC pronti della miniera]].

== Produce da sola ==
Anche a pagina chiusa, fino a quante ore tiene la memoria (al più 12: un incasso non supera i 18.000 $pzk, sotto il controllo dei salti del server); il pallino sull'icona quando la memoria è piena. Lo stato sta nello [[Lo zaino|zaino]] (<code>Z.miniera</code>: posseduti, montati, dal, acc). Dal 31.10 compra, monta e incassa sono azioni della [[La banca sul server|banca]] (<code>app-miniera.mjs</code>), e il catalogo che conta è <code>banca\\dati\\miniera-dati.mjs</code>.

== I disegni ==
Pixel art piatta disegnata in codice (<code>chat/miniera-pixel.js</code>, come il [[Il tomodachi|tomodachi]]), su una griglia fissa, «perché ogni pezzo si combini con tutti gli altri al pixel»; le tele si scalano per multipli interi. Nello zero la scena va a un bit in negativo («una stanza buia con le cose accese: il colore del muro diventa carta, le luci inchiostro»), e ↓ la mostra a schermo intero coi pixel veri del disegno (200 × 125). I [[I numeri corti|numeri corti]] (999, 1,0K, 13,3K, 1,0M…) sono nati qui.

{{Vedi anche|I PC pronti della miniera|Elenco dei pezzi della miniera|Miniera (app)|L'economia}}
[[Categoria:La miniera]]`,
  },

  'I PC pronti della miniera': {
    data: '2026-10-23',
    fonti: [C('miniera-dati.mjs'), A('miniera.js'), O('miniera.js'), R],
    testo: `'''I PC pronti della miniera''' sono gli otto di <code>PRONTI</code> in <code>chat/miniera-dati.mjs</code>: una postazione intera con lo sconto sul listino (il prezzo barrato), da comprare e montare in un colpo.

{| class="wikitable"
! PC !! sconto !! com'è
|-
| [[Il muletto da ufficio]] || 5 % || il minimo per minare: un processore, un monitor e la scatola delle scarpe. 808 $pzk, 16 $pzk/ora
|-
| [[Il gaming della cameretta]] || 8 % || case medio, due schede video del cugino e due monitor sulla scrivania con gli adesivi
|-
| [[Il mini itx da bar]] || 8 % || piccolo, col vetro, dietro il bancone: una scheda sola e il monitorino curvo
|-
| [[La torre col vetro]] || 10 % || tre rtx del geometra, la sedia da corsa e due monitor curvi
|-
| [[La workstation del geometra]] || 10 % || la big tower bianca con quattro schede, tre monitor sulla scrivania di noce
|-
| [[Il mining rig della cantina]] || 10 % || sei lumache sul telaio aperto, lo sgabello e il monitor del ragioniere
|-
| [[Il trono del boss]] || 12 % || quattro lumaca rtx 4090, tre ultrawide curvi, i led arcobaleno e il trono d'oro
|-
| [[La centrale della lumaca]] || 12 % || il rig aperto con sei 4090, il trono e tutto il meglio: 366.080 $pzk, 1.476 $pzk/ora. «La lumachina approva.»
|}
Nell'app [[Miniera (app)|miniera]] di pzk os la scheda di un PC pronto ha il disegno, la produzione, il prezzo e «compra e monta».

{{Vedi anche|La miniera|Elenco dei pezzi della miniera}}
[[Categoria:La miniera]]`,
  },

  'La cucina': {
    data: '2026-10-31',
    fonti: [A('cucina.js'), O('cucina.js'), C('zaino.js'), R],
    testo: `[[File:app-cucina.webp|thumb|la cucina in pzk os, con la nonna nel fumetto]]
'''La cucina''' (26.10.2026, <code>telefono/app/cucina.js</code>) sono le ricette del Mincio alla Cooking Mama: '''tortelli di zucca''' («la vigilia di Natale, in tutta Mantova»), '''risotto alla pilota''' («quello dei piloti delle risaie, a Villimpenta»), '''torta sbrisolona''' («il dolce che si rompe col pugno»), '''luccio in salsa''' («il pesce del Mincio, con la salsa verde»). Ogni passo è un minigioco (taglia, ordina, mescola girando in tondo, impasta, versa, cuoci) che vale da 0 a 100, la nonna commenta, e la media dà la medaglia: oro da 90, argento da 70, bronzo da 45 (<code>MEDAGLIE</code>). Le prime tre ricette del giorno con una medaglia pagano $pzk (60, 35, 15 col moltiplicatore) e xp; l'oro dà il piatto vero nello zaino (tortelli, sbrisolona) una volta al giorno per ricetta (<code>Z.cucina</code>: pagate, piatti, record). Dal 31.10 all'ultimo passo la banca dà la medaglia e i premi, e controlla che i passi stiano nel tempo passato davvero.

Nello zero ([[Cucina (app)|l'app]]) i sei minigiochi sono rifatti per i tasti: taglia OK quando il coltello è sulla riga, ordina ← → e OK, mescola → ↓ ← ↑ in giro col mestolo che segue, impasta OK più in fretta che puoi, versa OK apre il sacco e OK lo chiude (le regole non vogliono tasti tenuti), cuoci OK ferma la lancetta; la nonna ha un'icona nuova (la crocchia, gli occhiali, il sorriso). I traguardi: «la nonna è fiera» (un oro), «chef del Mincio» (l'oro in tutte e quattro).

{{Vedi anche|Cucina (app)|Tortelli di zucca|Sbrisolona|I traguardi}}
[[Categoria:La chat]]`,
  },

  'Il compilatore C': {
    data: '2026-10-31',
    fonti: [A('compilatore.js'), O('compilatore.js'), R],
    testo: `[[File:app-compilatore.webp|thumb|l'editor di «codice C» in pzk os]]
'''Il compilatore C''' è l'app «codice C» (26.10.2026, <code>telefono/app/compilatore.js</code>): la copia di mycompiler.io per il C. A sinistra l'editor (numeri di riga, colori della sintassi, Tab e rientri, Ctrl+Invio esegue), a destra INPUT (lo stdin) e OUTPUT (l'uscita, gli errori in rosso, il codice d'uscita, i tempi), gli errori di GCC segnati sulle righe, sei esempi. Il C è '''vero e compilato fuori''': GCC 14.2 su [[Compiler Explorer]] (<code>godbolt.org/api</code>, gratis, senza chiave, CORS aperto), e Wandbox (<code>gcc-head-c</code>) se il primo non risponde; scelta di Alberto (26.10), la pagina avvisa che il codice esce dal sito («non scriverci password», dice la pagina [[Info (pagina)|info]]). Il carattere del codice è [[Cascadia Code]] (<code>fonts/cascadia-code.woff2</code>, OFL): «quello del cercapersone ha solo maiuscole».

Nello zero ([[Codice C (app)|l'app]]) l'editor è una vista sola coi numeri di riga e il cursore che lampeggia; OK apre il menu (esegui, scrivi qui, a capo, cancella, l'input per scanf, l'ultimo output, gli esempi); la tastiera di sistema con <code>simboli: true</code> (graffe, parentesi, punto e virgola, operatori); Ctrl+Invio è il tasto OK. Provato davvero: «ciao alberto, benvenuto su pzkko!».

{{Vedi anche|Codice C (app)|Compiler Explorer|Cascadia Code}}
[[Categoria:Le app di pzk os]]`,
  },

  'La calcolatrice del geometra': {
    data: '2026-10-31',
    fonti: [A('calcolatrice.js'), O('calcolatrice.js'), R],
    testo: `[[File:app-calcolatrice.webp|thumb|«calcoli» in pzk os: il triangolo disegnato]]
'''La calcolatrice del geometra''' è l'app «calcoli» (26.10.2026, <code>telefono/app/calcolatrice.js</code>): la scientifica di chi fa il geometra, in gon (o gradi o radianti). Quattro schede: '''CALCOLO''' (un'espressione col tastierino, la moltiplicazione sottintesa, ANS, gli ultimi risultati), '''TRIANGOLI''' (tre dati e il resto, con Carnot, il teorema dei seni, la somma degli angoli, Erone, e le due soluzioni del caso ambiguo), '''COORDINATE''' (polari → cartesiane, distanza e azimut fra due punti col reciproco, l'area con Gauss; azimut dal Nord in senso orario), '''ANGOLI''' (sessagesimali, sessadecimali, centesimali, radianti). La vecchia esporta l'espressione, l'uguale (<code>registra</code>), i triangoli, le coordinate (<code>polari</code>, <code>fraDue</code>, <code>gauss</code>) e gli angoli (<code>leggiAngolo</code>): «sono la stessa calcolatrice con due facce». Nello zero ([[Calcoli (app)|l'app]]) il tastierino ha i 34 tasti della vecchia, a destra il triangolo vero quando si chiude, il goniometro degli angoli, e il carattere ha guadagnato √ π α β γ ² ³ ½ Δ θ ∞ ± ÷ Σ.

{{Vedi anche|Calcoli (app)|Le conversioni fra basi|Alberto Pecchini}}
[[Categoria:Le app di pzk os]]`,
  },

  'Le conversioni fra basi': {
    data: '2026-10-31',
    fonti: [A('conversioni.js'), O('conversioni.js'), R],
    testo: `[[File:app-conversioni.webp|thumb|bin·hex in pzk os]]
'''Le conversioni fra basi''' sono l'app «bin·hex» (26.10.2026, <code>telefono/app/conversioni.js</code>): un numero in decimale, binario, ottale o esadecimale e subito nelle altre basi, grande quanto si vuole (BigInt) e con la virgola (frazioni esatte: i periodici finiscono coi «…»), il complemento a 2 su 8/16/32/64 bit, e «come si fa» verso la base scelta: le divisioni successive coi resti letti dal basso, le moltiplicazioni per la parte frazionaria, la somma delle potenze, i gruppi di bit. Per lo zero «come si fa» è diventato dati (<code>passi</code>: testi, tabelle, l'esito) che la vecchia trasforma in html («uguale su 56 casi provati») e [[Bin·hex (app)|pzk os]] in righe, con ← → che cambiano la base d'arrivo. È l'app per gli esercizi di informatica di [[Unimore]].

{{Vedi anche|Bin·hex (app)|La calcolatrice del geometra}}
[[Categoria:Le app di pzk os]]`,
  },

  'Il premio giornaliero': {
    data: '2026-10-31',
    fonti: [C('comandi/soldi.js'), O('os.js'), R],
    testo: `'''Il premio giornaliero''' (<code>giornaliero</code>, daily, giorno) è il regalo della banca a chi passa ogni giorno: 300 $pzk di base più 50 per ogni giorno di fila, al più 7 (<code>PREMI</code> in <code>chat/comandi/soldi.js</code>). Il '''settimanale''' (weekly) paga 1.500 più 200 a settimana di fila (al più 4), il '''mensile''' (monthly) 5.000 più 500 (al più 3). Dal 31.10 li dà la banca (<code>chat.premio</code>, in <code>chat-soldi.mjs</code>), con la serie. La home di [[pzk os]] lo mette fra le cose «da fare oggi» e il pallino sull'icona della chat si accende quando è pronto (<code>zaino.manca('giornaliero') === 0</code>); i [[I consigliati|consigliati]] lo propongono per primo. La serie (<code>zaino.serie('giornaliero').n</code>) fa i traguardi «costante» (7 giorni) e «puntuale come le tasse» (30), e la metrica «serie di giorni» delle classifiche. Diverso dal [[Il sussidio|sussidio]], che è per chi è a secco.

{{Vedi anche|I comandi della chat|Il sussidio|Le sfide giornaliere}}
[[Categoria:I soldi]]`,
  },

  'L\'esperienza e i livelli': {
    data: '2026-10-31',
    fonti: [C('zaino.js'), C('comandi/lavoro.js'), R],
    testo: `'''L'esperienza e i livelli''': i punti esperienza (xp) si prendono lavorando, pescando, giocando, rispondendo ai quiz, cucinando, e il livello si ricava da soli: <code>livelloDi(xp) = 1 + floor(sqrt(xp / 60))</code>, cioè livello 2 a 60 xp, 3 a 240, 5 a 960, 10 a 4.860, 20 a 21.660 (<code>xpPer(l) = 60 × (l − 1)²</code>). Il livello apre i [[I mestieri|mestieri]] (il rider al 1, il sindaco al 20) e alza il '''moltiplicatore delle paghe''' (2 % per livello sopra il primo, più i [[I bonus|bonus]] «paga»). I bonus «xp» (la mortadella raddoppia, i tortelli +50 %, lo zero +10 %) moltiplicano i punti; dal 31.10 li dà solo la banca (<code>x.z.daiXp</code>). Il livello sta nella riga pubblica del [[Il database dei giocatori|database]] (le salite fanno [[Le notizie della banca|notizia]]), nel cartellino del [[Profilo (app)|profilo]] col bollino e la barra, e nella home di pzk os («liv 129 · 4614/15420 xp» era la riga che usciva a destra: ora, se non ci sta, la percentuale). I traguardi: si comincia (5), veterano (10), ormai di casa (15), leggenda del muro (20), mito vivente (30); la faccia leggendaria bot-ricco si sblocca al 10.

{{Vedi anche|Lo zaino|Il lavoro|I traguardi}}
[[Categoria:La chat]]`,
  },

  'Il rider': {
    data: '2026-10-29',
    fonti: [C('testi.js'), C('minigiochi.js'), O('chat.js'), 'albertopecchini.it/tools/pzkko/zero/prova.mjs', R],
    testo: `[[File:/art/chat-mestieri/rider.webp|thumb|upright|il rider]]
'''Il rider''' è il primo [[I mestieri|mestiere]], livello 1, 120 $pzk a turno: «consegni pizze in bici col freddo». Il turno è il minigioco '''strada''': la consegna, a ogni svolta sinistra, dritto o destra, coi tre tasti in fila (lo fa anche il [[Corriere di notte|corriere di notte]]). È il mestiere che ha fatto scrivere due regole di [[Le regole per le app|pzk os]]: il 29.10 notte ({{Citazione|come faccio a premere quando faccio lavoro rider? le freccie non vanno per la sequenza, fammele andare, e metti per sicurezza anche il click del mous|Alberto, 29.10.2026}}) la scheda finta dello zero tornava null per <code>[data-fatte]</code> e la consegna andava in errore alla prima svolta, e i tre tasti volevano la croce per spostarsi e OK per premere. Da allora quando i tasti di una scelta sono direzioni le frecce li premono subito, il tasto porta la sua freccia e sotto c'è scritto «premi ← ↑ → o fai clic»; il collaudo <code>prova.mjs --rider</code> fa un turno intero con due frecce e due clic e controlla che sia contato. La voce generata [[Rider]] è la sua scheda.

{{Vedi anche|I mestieri|Il lavoro|Il clic del mouse|Il collaudo delle app}}
[[Categoria:I mestieri]]`,
  },
}
