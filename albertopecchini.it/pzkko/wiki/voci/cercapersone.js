// pzkkopedia: le voci dell'area «il cercapersone zero, pzk os e le sue app» (2.11.2026). Il formato e la sintassi stanno in
// tools/pzkko/wiki/README.md; wiki/voci.js unisce questo modulo agli altri. Fonte: pzkko/README.md («Il cercapersone zero»),
// telefono/zero/os/REGOLE.md, i file di telefono/zero/ e telefono/zero/os/, la memoria di Claude.

const ZERO = 'albertopecchini.it/pzkko/telefono/zero/'
const OS = ZERO + 'os/'
const README = 'albertopecchini.it/pzkko/README.md'
const PROVA = 'albertopecchini.it/tools/pzkko/zero/prova.mjs'
const TEL = 'albertopecchini.it/pzkko/telefono/telefono.js'

export const VOCI = {
  'Il cercapersone zero': {
    data: '2026-11-02',
    fonti: [ZERO + 'zero.js', ZERO + 'muro.js', ZERO + 'luce.js', ZERO + 'muro-dati.js', ZERO + 'zero.css', TEL, OS + 'os.js', 'albertopecchini.it/tools/pzkko/zero/modello.mjs', 'albertopecchini.it/tools/pzkko/zero/foto.mjs', 'albertopecchini.it/tools/pzkko/zero/motore.mjs', PROVA, README],
    testo: `{{Infobox
| titolo = Il cercapersone zero
| immagine = zero-aperto.webp
| didascalia = lo zero aperto sul computer: la telecamera guarda dritta il fronte, pzk os è acceso sotto il vetro, il cavo entra nella testata
| dove = sul [[Il muro|muro]] di pzkko.it, sotto il [[Il wallet|wallet]]
| dal = 29 ottobre 2026 (per tutti dal 31 ottobre)
| file = telefono/zero/zero.js, muro.js, luce.js, zero.css
| modello = art/zero/zero.glb (1,2 MB, 107.000 triangoli)
| schermo = [[L'lcd|lcd]] 256 × 128 a un bit, 37,6 × 22,4 mm
| sistema = [[pzk os]]
| motore = [[three.js]] r186, bundle a parte
| foto = art/zero/zero-piccolo.webp (1344 × 776)
}}
'''Il cercapersone zero''' (o solo '''lo zero''') è il cercapersone in 3D di [[pzkko.it]]: un mockup bianco coi tasti arancioni e lo schermo a retroilluminazione arancione, appeso al [[Il muro|muro]] con un pezzo di nastro, che si apre con un volo della telecamera e dentro ha [[pzk os]], il sistema a 8 bit con la [[Chat (app)|chat]] e le altre 21 [[Le app di pzk os|app]]. Dal 31 ottobre 2026 è l'unico cercapersone del sito: il [[Il cercapersone nero|nero]] è stato cancellato per sempre.

{{Citazione|voglio lui come mockup, deve aprirsi con le stesse logiche, ovviamente quando lo apro zoom sullo schermo e mettici pzkos, poi voglio retroill arancione e sfondi arancioni, le icone tieni le mie, fai una cosa su misura, anche il cavo della ricarica nel posto giusto, è in 3d mi raccomando. NON ELIMINARE IL VECCHIO CERCAPERSONE perché questa versione sarà a 9999pzk$ e lo sostituirà per sempre nell'account|Alberto, 29 ottobre 2026}}

I colori di riferimento sono quelli dell'immagine che Alberto ha mandato: corpo bianco, croce, tasto e scritta arancioni, lo schermo arancione a pixel scuri, il puntino nero del led.

== Com'è nato ==
Dal 29 al 31 ottobre lo zero si comprava nello [[Lo shop|shop]] (oggetto <code>zero</code>, 9.999 $pzk, da tenere: xp +10 %, attese −10 %) e chi non ce l'aveva vedeva il cercapersone nero. Il 31 ottobre Alberto ha deciso altrimenti:

{{Citazione|fai che cercapersone zero è predefinito e quello attuale si elimina per sempre|Alberto, 31 ottobre 2026}}

Da allora c'è solo lui: l'oggetto <code>zero</code> è <code>fuoriVendita</code> (nella [[La banca sul server|banca]] e nella copia del browser, <code>chat/oggetti.js</code>: <code>NEGOZIO</code> lo salta, <code>PER_ID</code> lo tiene), chi l'aveva comprato lo tiene coi suoi bonus, e il traguardo «il salto di qualità» non c'è più. È la versione 4.0.0 «[[Chiocciola zero]]» di pzkko (commit <code>6593e7b</code>, 1.11.2026).

== Il modello ==
{{Principale|Il modello dello zero}}
Il modello è l'OBJ di Rhino del mockup (34 MB, 169.000 vertici, in millimetri). <code>tools/pzkko/zero/modello.mjs</code> tiene solo quello che si vede e scrive <code>art/zero/zero.glb</code>: 1,2 MB, 107.000 triangoli, posizioni in int16, senza normali (le calcola il browser). Dal modello si è letto dove stanno le cose: lo schermo di vetro, la croce con OK in mezzo, INDIETRO in basso, il led, il foro dell'usb-c sulla testata destra.

== Il 3D ==
[[File:zero-muro.webp|thumb|left|il cercapersone sul muro, nella posa di tre quarti, con pzk os vivo sul vetro]]
<code>telefono/zero/zero.js</code> usa [[three.js]] r186 in un bundle a parte (<code>telefono/zero/lib/three.js</code>, con GLTFLoader, RoomEnvironment e RoundedBoxGeometry, da <code>tools/pzkko/zero/motore.mjs</code>: non è quello della [[La scena 3D|scena]]). Una tela a tutta finestra dentro il dialog del cercapersone, la stanza di luce per i riflessi della plastica, una luce chiave con le ombre, i materiali coi colori di riferimento. La scritta «pzkko» sotto lo schermo è disegnata a un tratto solo, tonda, arancione: niente carattere da caricare (vedi [[La scritta PZKKO]]). L'[[L'lcd|lcd]] è una tela arancione con la griglia dei pixel e, durante il volo e la chiusura, la chiocciolina del tasto.

La '''telecamera''' si scrive a mano (<code>makePerspective</code> coi quattro lati del tronco). La posa '''muro''' è di tre quarti, da destra-sopra-davanti, col tronco simmetrico sul centro del cercapersone. La posa '''aperta''' guarda dritta sul fronte: il piano dell'immagine è parallelo al fronte, così lo schermo si proietta in un rettangolo esatto e pzk os ci si appoggia nitido, senza prospettiva; ma sta spostata a destra oltre la testata, così si vede la testata destra col foro dell'usb-c e il cavo che entra. L'inquadratura va da poco prima dello schermo a poco oltre la porta (87,5 mm) quando ci stanno almeno 19 px per mm; se la finestra è stretta lo schermo vince e la testata esce dal bordo. Fra le due pose si interpola posizione, rotazione e i quattro lati.

== Le stesse logiche ==
[[File:zero-volo.webp|thumb|il volo: la telecamera parte dalla posa della foto sul muro e arriva sul fronte in 420 ms]]
<code>telefono.js</code> in modo zero fa come prima. Aprendo, la tela disegna il cercapersone esattamente sopra il [[Il tasto sul muro|tasto del muro]] (la stessa posa della foto, storto uguale: la telecamera ruota dei gradi del tasto, e il tronco si allarga a tutta la finestra attorno al rettangolo del tasto), il tasto si nasconde, la telecamera vola alla posa aperta in '''420 ms''' con la chiocciolina sull'lcd 3D; arrivata, pzk os (il piano HTML sull'lcd, <code>.z-piano</code>, nascosto durante il volo) si accende come un lcd in '''400 ms''': la retroilluminazione che sale con un colpo di luce, il contenuto che si riempie a scatti. In carica, il [[Il cavo di ricarica|cavo]] entra nella porta sulla testata.

I '''tasti sono veri''' ([[I sei tasti]]): si premono col mouse (il raggio sulla tela: INDIETRO si abbassa, la croce s'inclina dal lato premuto) e dalla tastiera (frecce, Invio, Backspace). INDIETRO fa una mossa indietro e nella home chiude (è l'unico tasto: fa anche da CHIUDI, come toccare fuori ed Esc); tenuto tre secondi spegne. Il [[Il led rosso|led]] 3D segue le classi del led di prima. Chiudendo: pzk os si spegne (si riempie di scuro a scatti e la luce cala), l'lcd 3D mostra la chiocciolina che [[Il saluto|saluta]] e la telecamera torna sul tasto. Sul cellulare pzk os è a tutta finestra: la tela sfuma via quando si accende e torna chiudendo.

== Il secondo giro ==
{{Citazione|è storto lo schermo… rifai icone in svg consumando pochissimo… pzkko sta solo sul lato sotto non a cavallo della smussatura… è troppo luminoso il modello 3d… in base a dove metto il mouse si inclini leggermente… rifai la home e al primo accesso spiega come funziona… fai impostazioni per regolare la luminosità, i suoni, il led rosso… la home con dati importanti come i miei soldi e le cose da fare oggi… evita di mettere negli angoli cose che con l'inclinazione non si vedono… la luce deve essere = a quella del sito… i riflessi identici delle auto, lampioni|Alberto, 29 ottobre 2026, sera}}

Da quel giro: le [[Le icone di pzk os|icone in SVG]], la [[La home di pzk os|home]] coi soldi e le cose da fare, la [[La guida di pzk os|guida]] al primo accesso, le [[Impostazioni (app)|impostazioni]], la [[La luce dello zero|luce del sito]] coi riflessi veri della scena, l'[[L'inclinazione col mouse|inclinazione col mouse]], lo schermo sul muro non più storto (i quattro angoli dell'lcd si prendono alla superficie del vetro, z 2,1, non a z 0,9 dove sta il piano dell'lcd).

== Il terzo giro ==
{{Citazione|quando premo a destra non si preme ma si solleva… nel tutorial c'è scritto avanti freccia destra ma devo premere ok… la presa deve entrare centratissima al buco… dal cavo esce un cilindro stondato… schermo storto neanche modificato… scritta pzkko inesistente… tasto indietro funziona ma non è animato… fai tutti i tasti che fin che non tolgo il dito lui rimane premuto|Alberto, 29 ottobre 2026, notte}}

Corretti: la croce girava col segno sbagliato (l'asse X del modello è «giù» nel mondo); tutti i tasti restano giù finché si tiene (<code>premi(…, { tieni: true })</code> e <code>lascia</code> al rilascio) e premuti si scuriscono; nel dialogo con un tasto solo anche destra va avanti; la spina rifatta con la sezione dell'usb-c vero (8,3 × 2,5 mm); il tasto sul muro rifotografato (foto.mjs non ripartiva per un MIME mancante); di notte il cercapersone era color sabbia, ora la lampada ha il colore di quella della scena (0xffe4c0) e metà forza.

== L'apertura senza fermare il sito ==
{{Citazione|quando c'è il 3D acceso lagga un casino l'avvio… si freeza tutto il sito per 5 s|Alberto, 2 novembre 2026}}
Misurato: '''5,8 s''' di pagina ferma, quasi tutti nella foto dei riflessi, che disegnava la scena della home dritta sullo schermo mentre lei col post-processing disegna in una tela intermedia (HalfFloat, lineare, senza tono): la scheda compilava al volo un'altra versione di ogni suo materiale. Ora (commit <code>f46c118</code>): <code>luce.cattura</code> disegna in una tela come quella del composer e legge le facce in un buffer della scheda ritirato a lavoro finito (<code>fenceSync</code>); la foto si fa nei momenti liberi (<code>requestIdleCallback</code>), mai nel clic o nel volo; i materiali dello zero si compilano con <code>compileAsync</code> prima del primo fotogramma, e così i programmi del filtro PMREM. Dopo: nessun blocco oltre i '''~60 ms''' all'apertura, con o senza 3D, di giorno e di notte.

== Mai più il vecchio per un attimo ==
{{Citazione|quando ricarico il local per qualche ms vedo il vecchio cercapersone e poi arriva il flipper: toglilo definitivamente, niente cache di quello vecchio|Alberto, 30 ottobre 2026}}
Le foto del tasto non hanno <code>src</code> nell'html: lo script scritto subito dopo il tasto decide prima del primo disegno e chiama <code>muro.js</code> subito; <code>zero.css</code> sta nella testa della pagina. Con lo zero non si scaricano mai <code>pager-piccolo.webp</code> né <code>pager-grande.webp</code>. Poi la chiocciolina della chat, partendo dopo pzk os, svuotava l'lcd del tasto: ora <code>chat/tomodachi.js</code> toglie tutto tranne <code>.ct-os</code>.

== Le prove ==
<code>tools/pzkko/zero/prova.mjs</code> apre la home in Chromium con uno zaino finto e fotografa il muro, il volo, lo schermo acceso, il cavo, la croce e la chiusura; con <code>--app=&lt;id&gt;</code> collauda un'app ([[Il collaudo delle app]]). Vuole la scheda video vera: su questo PC Edge senza finestra esce subito, quindi serve un Chrome scaricato in <code>%LOCALAPPDATA%\\pzkko-chrome</code> ([[Cercapersone zero (memoria)]]). In locale: http://localhost:5182/?zero.

{{Vedi anche|pzk os|Il cercapersone nero|Il modello dello zero|Il tasto sul muro|La luce dello zero|Le app di pzk os|Le regole per le app|Chiocciola zero|Cercapersone zero (memoria)}}
[[Categoria:Il cercapersone]]`,
  },

  'Il cercapersone nero': {
    data: '2026-11-01',
    fonti: [TEL, README],
    testo: `'''Il cercapersone nero''' è il cercapersone che pzkko.it ha avuto dal 23 al 31 ottobre 2026, prima del [[Il cercapersone zero|cercapersone zero]]: una foto di un pager nero (<code>art/chat-pager-grande/</code>, <code>chat-cercapersone</code>, con la spina e i simboli dei tasti), uno schermo in HTML con le app, un tubo catodico che si spegneva, la home a pagine 3 × 3 coi puntini.

== La sua vita ==
* '''23 ottobre''': nasce grande, con le app, la chat che scrive, il led che lavora (commit <code>7f33a8f</code>); si accende con ACCEDI e si spegne «come un tubo catodico» (<code>0b42030</code>); dopo la [[La morte|morte]] si [[Il cercapersone scassato|scassa]], e il cavo usb-c entra in carica (<code>19b2a52</code>).
* '''26 ottobre''': senza conto si apre solo sull'app Account; arrivano il profilo, le app veloci, la miniera, virtual.
* '''29 ottobre''': si accende in 400 ms, la home a pagine 3 × 3 coi puntini, la [[La barra di stato|barra di stato]] vera, indietro rosso (<code>7f98ca6</code>); «il cercapersone rosso anche per chi aveva la foto vecchia» (<code>39e1ec1</code>). La sera stessa nasce lo zero, che si comprava a 9.999 $pzk, e il nero restava a chi non l'aveva.
* '''31 ottobre''': Alberto decide «fai che cercapersone zero è predefinito e quello attuale si elimina per sempre». Il nero sparisce dal codice: la foto, <code>telefono.css</code>, la home a pagine, il tubo catodico e le app in HTML. Di <code>telefono/app/</code> restano solo le logiche che le app di [[pzk os]] importano: le regole, i cataloghi, le chiamate alla [[La banca sul server|banca]].

== Cosa ne resta ==
Le logiche: <code>telefono/app/profilo.js</code> esporta <code>compraFaccia</code> e <code>nomeAv</code>, <code>account.js</code> <code>RISERVATI</code> e <code>descriviMossa</code>, <code>negozio.js</code> <code>prodotti</code>, <code>compraRighe</code>, <code>ORDINI</code>, <code>contoAllaRovescia</code>, e così via per ogni app: le app a 8 bit dello zero sono «solo la faccia» ([[Le regole per le app]], regola 1.2), la testa è la stessa di prima. Niente <code>?vecchio</code>, niente <code>PROVA_ZERO</code>: la memoria di Claude dice di non rimetterlo mai ([[Cercapersone zero (memoria)]]).

{{Vedi anche|Il cercapersone zero|Le versioni di pzkko|Lumaca catodica|Chiocciola zero}}
[[Categoria:Il cercapersone]] [[Categoria:Le versioni]]`,
  },

  'Il modello dello zero': {
    data: '2026-10-29',
    fonti: ['albertopecchini.it/tools/pzkko/zero/modello.mjs', ZERO + 'zero.js', PROVA, README],
    testo: `{{Infobox
| titolo = Il modello dello zero
| immagine = zero-tasto.webp
| didascalia = il tasto sul muro a 4×, dal collaudo: lo schermo sta nel vetro
| sorgente = l'OBJ di Rhino del mockup, 34 MB, 169.000 vertici (fuori dal repository)
| uscita = art/zero/zero.glb, 1,2 MB, 107.000 triangoli
| strumento = tools/pzkko/zero/modello.mjs
| assi = Y il lato lungo, X il corto (il bordo di sopra a X−), Z lo spessore (il fronte a Z+)
}}
'''Il modello dello zero''' è la geometria 3D del [[Il cercapersone zero|cercapersone zero]]: l'OBJ di Rhino del mockup, in millimetri, ridotto a un glTF binario da <code>tools/pzkko/zero/modello.mjs</code>.

== Da 34 MB a 1,2 ==
<code>modello.mjs &lt;file.obj&gt;</code> tiene solo quello che si vede: i due gusci, la cornice dello schermo, croce, OK e INDIETRO, la staffa della porta usb-c, la finestra dell'IR, il vetro, il tubicino del led, i contatti dorati, le stampe sul retro. Via le viti, la micro sd, la scheda, il delfino disegnato sullo schermo e la scritta «FLIPPER» in rilievo. Scrive <code>art/zero/zero.glb</code>: 1,2 MB, 107.000 triangoli, posizioni in int16 (KHR_mesh_quantization), senza normali: le calcola il browser, perché i vertici sono già doppi sugli spigoli.

== Dove stanno le cose ==
Dal modello si è letto:
* lo schermo di vetro a x −0,1–39,1 e y 5,5–29,5 (l'lcd acceso dentro, 37,2 × 22 mm; poi lo schermo riempie tutta la finestra del vetro meno 0,8 mm di bordo scuro: 37,6 × 22,4 mm, angoli 2,2 mm, come nei render ufficiali);
* la croce a x 40–63 con OK in mezzo, INDIETRO a x 61,5–69,5 in basso;
* il led a x 40–43;
* il foro dell'usb-c in mezzo alla testata destra (x 76, in basso, 9 × 3,5 mm; sondato: y 4,6–13,9, z −10,1–−6,6, centro y 9,25 z −8,4), non il forellino in basso, che è quello del laccetto;
* lo slot della micro sd sul bordo di sotto, i fori del GPIO sul bordo di sopra.

== Misurare dal browser, non dai vertici ==
La [[La scritta PZKKO|scritta PZKKO]] all'inizio stava 1,4 mm dentro la plastica: dai vertici dell'OBJ si era presa la parete interna del guscio, perché le facce piatte hanno pochi vertici. Da allora il modello si misura col raggio nel browser: <code>rig.sonda(da, verso)</code> (un raggio nelle coordinate del corpo) e <code>prova.mjs --sonda</code>, che stampa il profilo della fascia e la mappa della testata; <code>rig.scritta(dz)</code> e <code>rig.dove(tasto)</code> per il collaudo. La memoria di Claude lo ricorda ([[Cercapersone zero (memoria)]]).

== Se serve rifarlo ==
Il modello sorgente non è nel repository (troppo grosso): sta nei Download di Alberto. Per rifare il glb: <code>node tools/pzkko/zero/modello.mjs &lt;obj&gt;</code>, poi <code>foto.mjs</code> per il [[Il tasto sul muro|tasto sul muro]], e guardare che abbia scritto davvero.

{{Vedi anche|Il cercapersone zero|Il tasto sul muro|La scritta PZKKO|Il cavo di ricarica|three.js}}
[[Categoria:Il cercapersone]]`,
  },

  'pzk os': {
    data: '2026-11-02',
    fonti: [OS + 'os.js', OS + 'lcd.js', OS + 'font.js', OS + 'icone.js', OS + 'pezzi.js', OS + 'suoni.js', OS + 'REGOLE.md', TEL, README],
    testo: `{{Infobox
| titolo = pzk os
| immagine = zero-menu.webp
| didascalia = il menu principale di pzk os: la lista delle app con l'icona, la voce scelta rovesciata, la barra di scorrimento
| dove = dentro lo schermo del [[Il cercapersone zero|cercapersone zero]]
| dal = 29 ottobre 2026 (sera)
| cartella = telefono/zero/os/
| nucleo = os.js
| schermo = [[L'lcd|lcd.js]], 256 × 128 a un bit
| carattere = [[Il carattere 5×7|font.js]]
| icone = [[Le icone di pzk os|icone.js]]
| pezzi comuni = pezzi.js
| suoni = suoni.js
| modello = il firmware del Flipper Zero, riscritto
}}
'''pzk os''' è il sistema a 8 bit del [[Il cercapersone zero|cercapersone zero]]: un lcd di 256 × 128 pixel a un bit DENTRO il 3D, sotto il vetro trasparente del modello, coi sei tasti del Flipper e le app di pzkko disegnate a pixel. Sta in <code>telefono/zero/os/</code>.

{{Citazione|non fare una finestra sopra il modello 3d come adesso (si vede e fa schifo)… il modello ha trasparenza quindi lo schermo lo metti esattamente dove è nel modello… prendi flipper zero os e riscrivilo con le mie app, impara come funziona e usalo per rifare le app, aumenta i pixel dello schermo ma mantieni stile 8bit, fai solo app chat completissima|Alberto, 29 ottobre 2026, sera}}

Prima c'era un piano HTML con le app di <code>telefono/app/</code> ricolorate sopra la tela, poi per un'ora il firmware vero del Flipper in WebAssembly: tolti tutti e due, bocciati ([[Cercapersone zero (memoria)]]).

== I pezzi ==
* '''[[L'lcd|lcd.js]]''': l'lcd 256 × 128 a un bit (il doppio del Flipper, 128 × 64), con pixel, righe, cornici smussate, testo, bitmap, inversione e ritaglio; la tela 768 × 384 (tre texel per pixel con un filo di griglia) con la tavolozza della retroilluminazione.
* '''[[Il carattere 5×7|font.js]]''': il carattere 5 × 7 disegnato a mano, glifo per glifo.
* '''[[Le icone di pzk os|icone.js]]''': le icone come tracciati SVG, ridotte a un bit; le webp di Alberto col retino di Bayer come riserva.
* '''os.js''': il nucleo, fatto come il firmware del Flipper: la [[La barra di stato|barra di stato]] in cima (ora, rete a tacche, nome del conto, batteria), il desktop con l'animazione a tutto schermo (la chiocciolina di <code>chat/tomodachi.js</code>, le sue 32 × 16 celle a 8 × 8 pixel: lì c'è il delfino), OK che apre il [[Il menu di pzk os|menu principale]], le app come viste impilate (INDIETRO torna sotto), i dialoghi con la cornice smussata, la tastiera sullo schermo che si usa con la croce (come la TextInput del Flipper). Un giro di disegno ogni 100 ms, solo se qualcosa è cambiato.
* '''pezzi.js''': i pezzi che le app si dividono: <code>txt</code> (il testo degli altri senza quadratini), <code>corto</code> (il taglio con «…»), <code>destra</code>, <code>centro</code>, <code>testata</code> (◀ icona nome · pallini ▶ delle app a pagine), <code>sposta</code> (la pagina che scorre di lato), <code>striscia</code> (l'esito o la rotellina in fondo), <code>pagine</code>, <code>elenco</code>, <code>puntini</code>, <code>impagina</code>, <code>scorrevole</code>, <code>bottoni</code>, <code>senzaHtml</code> (il testo lungo va a capo a 37: a destra restano le frecce).
* '''suoni.js''': il bip di ogni tasto e la sigla di ogni app che si apre, in un posto solo ([[I suoni dell'interfaccia]], [[Le sigle delle app]]).

== Cosa dà alle app ==
<code>os</code> dà a ogni vista: <code>BARRA</code> (12), <code>MARGINE</code> (6), <code>togli</code>, <code>spingi</code>, <code>ridisegna</code>, <code>corrente</code>, <code>apri</code> (anche <code>os.apri(id, { comando })</code>, che apre la chat con un comando pronto), <code>zona</code> (una zona del clic, vedi [[Il clic del mouse]]), <code>dialogo</code>, <code>cifre</code> (le caselle per PIN, indirizzi e quantità), <code>numero</code> (il tastierino dei numeri col meno, la virgola e, con <code>gradi: true</code>, ° ′ ″), <code>dopoAccesso</code>, <code>tastiera</code> (anche <code>nascosto</code> per i segreti e <code>simboli: true</code> per graffe e operatori), <code>suoni</code>. Le app pronte si registrano in '''<code>PRONTE</code>''' (una riga) e il menu smette da sé di dire «presto»; '''<code>LIBERE</code>''' è l'insieme delle due app che si aprono senza conto: account e impostazioni.

== I tasti ==
{{Principale|I sei tasti}}
I sei tasti sono quelli del Flipper: su, giu, sx, dx, ok, indietro. <code>telefono.js</code> li manda dai tasti 3D (<code>zero.js</code>, il raggio) e dalla tastiera vera: frecce, Invio, Backspace che cancella una lettera o, a riga vuota, è INDIETRO; tenuto tre secondi spegne; Esc è INDIETRO; le lettere si scrivono. In più [[Il clic del mouse|il clic del mouse]] sullo schermo 3D, che preme la zona che c'è lì.

== Senza conto non si entra ==
Dal 29 ottobre notte, anche sullo zero: la [[La home di pzk os|home]] diventa un lucchetto con «OK entra o crea il conto», all'accensione senza conto si apre [[Account (app)|l'account]], e un comando mandato alla chat aspetta il conto. Lo fa <code>apri</code>: un'app nuova non deve fare niente.

== Le regole ==
{{Principale|Le regole per le app}}
Ogni app segue <code>REGOLE.md</code>: un'app alla volta, la logica è quella del sito, sei tasti e il clic, tutto dentro il margine di 6 px e niente negli angoli stondati, solo i glifi di font.js, icone SVG, animazioni col <code>tic</code>, suoni del sistema, e il [[Il collaudo delle app|collaudo]] prima di dire «fatto».

== Il tasto sul muro ==
La stessa immagine dell'lcd va sul 3D e sul [[Il tasto sul muro|tasto del muro]]: <code>zero.js</code> stende la tela come trama di un piano a z 0,9 sotto il vetro, <code>muro.js</code> la ricopia sul tasto con una matrix3d.

{{Vedi anche|Il cercapersone zero|Le app di pzk os|L'lcd|Il carattere 5×7|Le icone di pzk os|I sei tasti|Il clic del mouse|La home di pzk os|Il menu di pzk os|Le regole per le app|Il collaudo delle app|Regole app pzk os (memoria)}}
[[Categoria:Il cercapersone]]`,
  },

  'L\'lcd': {
    data: '2026-10-29',
    fonti: [OS + 'lcd.js', ZERO + 'zero.js', ZERO + 'muro.js', README],
    testo: `{{Infobox
| titolo = L'lcd
| immagine = app-chat.webp
| didascalia = l'lcd 768 × 384 fotografato dal collaudo: 256 × 128 pixel a un bit, tre texel per pixel
| file = telefono/zero/os/lcd.js
| pixel = 256 × 128 a un bit (il Flipper ha 128 × 64)
| tela = 768 × 384 texel
| acceso = inchiostro #221408 su arancione #f7a13a
| spento = bruno, ma leggibile
| misura vera = 37,6 × 22,4 mm sul modello, angoli 2,2 mm
}}
'''L'lcd''' è lo schermo di [[pzk os]]: <code>telefono/zero/os/lcd.js</code>, la classe <code>Lcd</code> con <code>W</code> = 256 e <code>H</code> = 128, un buffer a un bit e una tela 768 × 384.

== Com'è fatto ==
Il buffer è di 256 × 128 pixel a un bit: il doppio del Flipper (128 × 64), lo stile a 8 bit resta («aumenta i pixel dello schermo ma mantieni stile 8bit»). La tela è 768 × 384: tre texel per pixel, con un filo di griglia fra un pixel e l'altro, così da vicino si vedono i pixel come su un lcd vero. La tavolozza è quella della retroilluminazione, con una luce da 0 a 1: accesa è arancione <code>#f7a13a</code> con l'inchiostro <code>#221408</code>, spenta è bruna ma leggibile. <code>lcd.regola</code> è la luce massima (le cinque tacche delle [[Impostazioni (app)|impostazioni]]), <code>lcd.accendi</code> fa l'accensione, lo spegnimento e il [[Il saluto|saluto]]: sono del sistema, non delle app.

== Cosa sa disegnare ==
Pixel (<code>px</code>), righe (<code>vert</code>, orizzontali), rettangoli pieni (<code>riempi</code>, anche a 0 per pulire), cornici smussate, testo (<code>testo</code>, con <code>scala</code> 1 o 2 e <code>inv: true</code> per il rovescio), bitmap (le [[Le icone di pzk os|icone]] e le foto), inversione, ritaglio (<code>ritaglia([x, y, w, h])</code> e poi <code>ritaglia(null)</code>). <code>Lcd.larghezza</code> misura un testo, <code>Lcd.acapo</code> lo manda a capo. Una riga ogni 9 pixel: ci stanno 40 caratteri a scala 1 e 20 a scala 2.

== Dove va ==
La stessa immagine va in due posti: <code>zero.js</code> la stende come trama di un piano a z 0,9 sotto il vetro del modello, che è trasparente e riflette la stanza; <code>muro.js</code> la ricopia sul [[Il tasto sul muro|tasto del muro]], su una tela grande quanto il vetro in pixel veri (la vecchia 256 stretta in 230 px saltava delle righe e le scritte venivano a gradini). Per questo le app disegnano '''un bit e basta''': nel buffer, mai sulla tela, mai a colori ([[Le regole per le app]], 4.9).

== Il margine e gli angoli ==
Le punte dello schermo sono stondate (un quarto d'ellisse 15 × 13 px per lato) e con l'[[L'inclinazione col mouse|inclinazione]] i pixel ai bordi spariscono sotto la cornice: tutto sta dentro un margine di 6 pixel (<code>MARGINE</code>), la [[La barra di stato|barra di stato]] occupa le righe 0–11, in basso solo cose centrate (x 40–216). Lo schermo riempie tutta la finestra del vetro meno 0,8 mm di bordo scuro, come nei render ufficiali del Flipper.

== Le foto ==
Il [[Il collaudo delle app|collaudo]] salva l'lcd a ogni passo in <code>tools/pzkko/lavoro/zero/prova-app-&lt;id&gt;-*.png</code>, 768 × 384, pixel per pixel: sono le immagini di questa wiki.

{{Vedi anche|pzk os|Il carattere 5×7|Le icone di pzk os|Il tasto sul muro|Le regole per le app}}
[[Categoria:Il cercapersone]]`,
  },

  'Il carattere 5×7': {
    data: '2026-10-31',
    fonti: [OS + 'font.js', OS + 'REGOLE.md', README],
    testo: `'''Il carattere 5×7''' è il carattere di [[pzk os]]: <code>telefono/zero/os/font.js</code>, ogni glifo disegnato a mano in una griglia di 5 × 7 pixel, passo 6, una riga ogni 9 pixel. In una riga ci stanno 40 caratteri a scala 1 e 20 a scala 2.

== Cosa c'è ==
ASCII, le accentate, €, ♥, le frecce ← → ↑ ↓, ▶ ◀, ■ □ • … ✓ ⏎ ⌫ × °. Dal 29 ottobre (la borsa dell'app [[Banca (app)|banca]]) ▲ ▼ ≈; dal 31 ottobre (le carte del blackjack, i lavori rischiosi) ♦ ♣ ♠ ⚠; per [[Calcoli (app)|calcoli]] √ π α β γ ² ³ ½ Δ θ ∞ ± ÷ Σ, coi pedici come lettere normali; le virgolette « » hanno il loro glifo (uscivano come &lt; &gt;).

== La regola ==
Un carattere che non c'è esce come un quadratino ([[Le regole per le app]], 4.3): il «›» del prompt della chat lo faceva, e il [[Il collaudo delle app|collaudo]] segnala «i caratteri senza glifo». Se serve, si disegna il glifo 5 × 7 in font.js o si aggiunge un alias. Il testo degli altri (nome, motto, titolo) passa da <code>txt</code> di pezzi.js: un carattere senza glifo diventa «?», e un a capo nel testo diventava «?» prima che <code>txt</code> lo gestisse (trovato nello [[Shop (app)|shop]]).

Nel [[Codice C (app)|codice C]] il cercapersone ha solo maiuscole: per questo l'app vecchia usava Cascadia Code, e quella a 8 bit l'editor a pixel.

{{Vedi anche|L'lcd|Le icone di pzk os|pzk os}}
[[Categoria:Il cercapersone]]`,
  },

  'Le icone di pzk os': {
    data: '2026-10-31',
    fonti: [OS + 'icone.js', 'albertopecchini.it/pzkko/chat/icone.js', README],
    testo: `'''Le icone di pzk os''' sono tracciati SVG scritti in <code>telefono/zero/os/icone.js</code> (la mappa <code>SVG</code>): viewBox 16 × 16, una lista di <code>path</code> per icona, solo forme piene, niente contorni, riempite su una tela della misura chiesta e ridotte a un bit. Niente immagini da scaricare, sagome pulite anche a 16 pixel.

{{Citazione|rifai icone in svg consumando pochissimo|Alberto, 29 ottobre 2026}}

== Prima ==
Il primo giro usava le icone di Alberto ([[Icone sempre rd-plus (memoria)|le webp a pixel di retro-diffusion]], <code>chat/icone.js</code>) a un bit col retino di Bayer 4 × 4: il bordo bianco dell'adesivo resta spento, il soggetto diventa inchiostro. Restano come riserva per i nomi che non hanno ancora un SVG (<code>icone.bitmap</code> torna null finché l'immagine non arriva, e lo schermo salta: per questo un'icona nuova non si fa mai così).

== Le regole ==
* L'icona di un'app si chiama <code>app-&lt;id&gt;</code>. Si usa a 16 (liste, titoli) e a 32 (le viste grandi): si guardano tutte e due le misure. Sulla riga scelta va rovesciata (<code>inv: true</code>).
* Le forme stanno sulla griglia intera, ogni dettaglio e ogni buco è largo almeno 1 unità.
* Un nome che non c'è lascia un buco: il [[Il collaudo delle app|collaudo]] lo segnala («icone che non ci sono»). È così che si è scoperto che <code>app-giocatori</code> mancava e nel menu non c'era.

== Quali ci sono ==
Le app, la chiocciola del bot, le gemme e le mine, i simboli della slot, il regalo, la clessidra, il trofeo, la matita e il lucchetto (profilo), la lente (giocatori), il sacco e la sirena (rapina), <code>wallet-pzk</code> e <code>chiavetta</code> (decifratore), la nonna con la crocchia, gli occhiali e il sorriso (cucina), la bottega con la tenda a righe (lo shop, che prima sembrava un lucchetto), <code>app-profilo</code> rifatta in un tracciato solo (in due, i dettagli si riempivano e nel menu era un blocco nero).

Le foto dei [[Le foto vere dei quiz|quiz]] e dell'app [[Foto (app)|foto]] arrivano a un bit con <code>icone.foto</code>: la diffusione dell'errore (Floyd–Steinberg a serpentina), che sulle foto dà più dettaglio del retino di Bayer.

{{Vedi anche|pzk os|L'lcd|Icone sempre rd-plus (memoria)|retro-diffusion rd-plus}}
[[Categoria:Il cercapersone]]`,
  },

  'I sei tasti': {
    data: '2026-10-29',
    fonti: [ZERO + 'zero.js', TEL, OS + 'os.js', OS + 'REGOLE.md', README],
    testo: `'''I sei tasti''' del [[Il cercapersone zero|cercapersone zero]] sono quelli del Flipper: la croce (su, giu, sx, dx), OK in mezzo alla croce e INDIETRO, il tasto tondo in basso a destra. Sul modello la croce sta a x 40–63 e INDIETRO a x 61,5–69,5.

== Cosa vogliono dire ==
{| class="wikitable"
! tasto !! dal 3D !! dalla tastiera !! in tutte le app
|-
| su, giu || la croce || ↑ ↓ || scorre, sceglie in una lista
|-
| sx, dx || la croce || ← → (e Tab per dx) || cambia un valore, cambia pagina, sceglie in fila
|-
| ok || il tasto in mezzo || Invio || conferma, apre, preme
|-
| indietro || il tasto tondo || Esc, Backspace a riga vuota || un passo indietro
|}

INDIETRO va sempre preso: dalla radice dell'app si esce con <code>os.togli()</code>; se torna false sulla [[La home di pzk os|home]], il cercapersone si chiude. Tenuto tre secondi spegne: è del sistema, nessuna app lo usa. Le liste girano in tondo, un tasto durante un'animazione non si perde. Niente doppio clic, niente tasti tenuti premuti (il «versa» della [[Cucina (app)|cucina]] si è rifatto per questo: OK apre il sacco e OK lo chiude).

== Nel 3D ==
Si premono col mouse (il raggio sulla tela): INDIETRO si abbassa di 0,9 mm, la croce s'inclina dal lato premuto e si abbassa anche un filo. Nel terzo giro Alberto ha trovato che «quando premo a destra non si preme ma si solleva»: destra e sinistra giravano col segno sbagliato, perché l'asse X del modello è «giù» nel mondo. Poi «fai tutti i tasti che fin che non tolgo il dito lui rimane premuto»: ora restano giù finché si tiene (mouse, dito e tastiera: <code>premi(…, { tieni: true })</code> e <code>lascia</code> al rilascio) e premuti si scuriscono, ogni tasto col suo materiale: da davanti l'abbassarsi quasi non si vede, il colore sì. Il tasto 3D che si abbassa è del modello (<code>zero.js</code>): le app non lo toccano.

== Dalla tastiera ==
Frecce, Invio, Backspace (cancella una lettera; a riga vuota è INDIETRO; tenuto tre secondi spegne), Esc, le lettere che si scrivono. Dove Invio va a capo (l'editor di [[Codice C (app)|codice C]]) il tasto OK della tastiera vera è Ctrl+Invio (<code>okvero</code> nel collaudo).

== Ogni scritta dice il vero ==
«Nel tutorial c'è scritto avanti freccia destra ma devo premere ok» (Alberto): ora se c'è ▶ sullo schermo, dx lo fa; in un dialogo con un tasto solo, OK e dx fanno la stessa cosa. I tasti si nominano per nome (OK, INDIETRO, ↑ ↓ ← →), ◀ e ▶ vogliono dire sx e dx, mai «indietro». Quando i tasti di una scelta sono direzioni (la consegna del [[Il rider|rider]], il rigore), le frecce li premono subito.

{{Vedi anche|Il clic del mouse|pzk os|Le regole per le app|Il cercapersone zero}}
[[Categoria:Il cercapersone]]`,
  },

  'Il clic del mouse': {
    data: '2026-10-29',
    fonti: [ZERO + 'zero.js', OS + 'os.js', OS + 'REGOLE.md', PROVA, README],
    testo: `'''Il clic del mouse''' sullo schermo 3D del [[Il cercapersone zero|cercapersone zero]] è un in più rispetto ai [[I sei tasti|sei tasti]]: tutto quello che si clicca si fa anche coi tasti.

{{Citazione|come faccio a premere quando faccio lavoro rider? le freccie non vanno per la sequenza, fammele andare, e metti per sicurezza anche il click del mous|Alberto, 29 ottobre 2026, notte}}

== Come funziona ==
<code>zero.js</code> colpisce il piano dell'[[L'lcd|lcd]] col raggio del puntatore e ne ricava il pixel (<code>rig.puntoLcd</code> fa il contrario, per le prove); [[pzk os]] preme la zona che c'è lì (<code>os.zona</code>, <code>os.tocca</code>). Mentre disegna, la vista segna con <code>os.zona(x, y, w, h, fn)</code> ogni cosa che si preme: i tasti, le righe di una lista, le frecce ◀ ▶ di un valore, i tasti dei dialoghi; il clic chiama <code>fn</code>, che fa la stessa cosa del tasto. Le zone sono in pixel dell'lcd e si rifanno a ogni disegno: vince l'ultima segnata (prima la riga, poi le frecce che ci stanno dentro); una zona dentro una parte ritagliata si taglia anche lei (<code>zonaChat</code>). Il bip lo fa il sistema, e la manina del mouse compare solo sopra una zona (<code>html.scena-tasto</code> non c'entra: qui è la manina sopra lo schermo). Le cose già fatte non si premono: un tasto disattivato o premuto ignora il clic.

== Cosa si clicca ==
I tasti, le azioni, i suggerimenti e il bollino «↓» della [[Chat (app)|chat]], le righe del [[Il menu di pzk os|menu]], le righe e le frecce delle [[Impostazioni (app)|impostazioni]], i tasti dei dialoghi e della tastiera, «OK menu» e «chat» della home, le miniature delle [[Foto (app)|foto]], i lati di una foto, il grafico della [[Banca (app)|borsa]], i quarti del mestolo in [[Cucina (app)|cucina]], ▲ ▼ della [[Lavatrice (app)|lavatrice]], le risposte del [[Decifratore (app)|decifratore]].

== La prova ==
<code>prova.mjs --rider</code> fa un turno intero da rider con due frecce dalla tastiera e due clic del mouse sullo schermo, e controlla che il turno sia contato. Nelle sequenze del collaudo <code>clic@80x121</code> è un clic sul pixel 80, 121 dell'lcd, attraverso il 3D vero.

{{Vedi anche|I sei tasti|Il rider|Il collaudo delle app|Le regole per le app}}
[[Categoria:Il cercapersone]]`,
  },

  'La home di pzk os': {
    data: '2026-11-02',
    fonti: [OS + 'os.js', README],
    testo: `[[File:zero-aperto.webp|thumb|la home di pzk os appena acceso: a sinistra la chiocciolina, a destra i $pzk e il livello, sotto le cose da fare oggi]]
'''La home di pzk os''' (<code>home_</code> in <code>os.js</code>) è quello che si vede appena il [[Il cercapersone zero|cercapersone zero]] si accende, se non c'era un'app aperta. Rifatta nel secondo giro:

{{Citazione|rifai la home… la home con dati importanti come i miei soldi e le cose da fare oggi… evita di mettere negli angoli cose che con l'inclinazione non si vedono|Alberto, 29 ottobre 2026}}

== Cosa c'è ==
* a sinistra la chiocciolina ([[Il tomodachi]], 128 × 64, le sue celle a 4 × 4);
* a destra i $pzk, grandi, il livello con la barra degli xp, le sfide fatte e se il [[Il premio giornaliero|premio giornaliero]] è pronto; la riga «liv 129 · 4614/15420 xp» usciva a destra: ora, se non ci sta, la percentuale;
* sotto, nel riquadro «da fare oggi», fino a tre righe: il premio da riscuotere, la [[La lumachina|lumachina]] che ha combinato qualcosa, le quest pronte, le sfide con avanzamento;
* in mezzo in basso il suggerimento «OK menu · ↓ chat».
Tutto dentro il margine di 6 pixel (<code>MARGINE</code>): le punte dello schermo sono stondate e con l'[[L'inclinazione col mouse|inclinazione]] sparirebbero. I dati si rileggono a ogni cambio dello [[Lo zaino|zaino]] o del conto.

== Senza conto ==
La home diventa un lucchetto con «OK entra o crea il conto»: senza conto non si entra (<code>LIBERE</code> in os.js: solo account e impostazioni). All'accensione senza conto si apre l'[[Account (app)|account]].

== I tasti ==
OK apre il [[Il menu di pzk os|menu principale]], ↓ apre la [[Chat (app)|chat]], INDIETRO chiude il cercapersone. Il clic su «OK menu» e «chat» fa lo stesso.

{{Vedi anche|pzk os|Il menu di pzk os|La guida di pzk os|Il tomodachi|Le app di pzk os}}
[[Categoria:Il cercapersone]]`,
  },

  'La guida di pzk os': {
    data: '2026-10-29',
    fonti: [OS + 'os.js', OS + 'impostazioni.js', README],
    testo: `[[File:zero-guida.webp|thumb|una pagina della guida, con la cornice smussata dei dialoghi e il tasto per andare avanti]]
'''La guida di pzk os''' (<code>os.guida</code>) sono quattro pagine di dialogo che spiegano i tasti, la [[La home di pzk os|home]], la [[Chat (app)|chat]] e come si spegne. Compare al primo accesso (localStorage <code>pzkko-zero-guida</code>) e si rivede dalle [[Impostazioni (app)|impostazioni]] («rivedi la guida»).

{{Citazione|rifai la home e al primo accesso spiega come funziona|Alberto, 29 ottobre 2026}}

== Il difetto famoso ==
Nel terzo giro Alberto ha trovato che «nel tutorial c'è scritto avanti freccia destra ma devo premere ok»: il tasto «avanti ▶» della guida andava solo con OK. Da lì la regola 3.3 di [[Le regole per le app|REGOLE.md]]: ogni scritta che nomina un tasto deve dire il vero, e in un dialogo con un tasto solo OK e dx fanno la stessa cosa.

{{Vedi anche|pzk os|La home di pzk os|I sei tasti|Impostazioni (app)}}
[[Categoria:Il cercapersone]]`,
  },

  'Il menu di pzk os': {
    data: '2026-10-31',
    fonti: [OS + 'os.js', TEL, README],
    testo: `[[File:zero-menu.webp|thumb|il menu: l'icona a sinistra, la voce scelta rovesciata, la barra di scorrimento a destra]]
'''Il menu di pzk os''' è la lista delle app che OK apre dalla [[La home di pzk os|home]], fatta come il menu del Flipper: l'icona a 16 pixel a sinistra, il nome, la voce scelta rovesciata (una fascia scura col testo in negativo), la barra di scorrimento a destra. Le liste girano in tondo: su dalla prima va all'ultima.

== Da dove vengono le voci ==
Da <code>APP</code> in <code>telefono/telefono.js</code>: id, nome e icona (<code>app-&lt;id&gt;</code>), nell'ordine chat, profilo, account, shop, pzkstore, sfide, quiz, quest, giocatori, zaino, miniera, foto, virtual, banca, rapina, lavatrice, decifra, bin·hex, calcoli, codice C, cucina, e in fondo le impostazioni. La [[La lavatrice|lavatrice]] e il [[Il decifratore|decifratore]] hanno <code>store: true</code> e <code>se</code>: ci sono solo se installati dal [[Il pzkstore|pzkstore]]; aperte senza averle portano alla loro scheda. Il menu si rifà quando lo [[Lo zaino|zaino]] cambia: un'app comprata compare subito. Un'app che non è in <code>PRONTE</code> dice «presto» (oggi nessuna: tutte e 22 sono pronte); fino al 29 ottobre le app non fatte aprivano la vista «in arrivo».

Il pallino sull'icona (il <code>badge</code> di <code>APP</code>) dice che c'è qualcosa: il [[Il premio giornaliero|giornaliero]] pronto, le [[Le sfide giornaliere|sfide]] da riscuotere, le [[Le side quest|quest]] pronte, la [[La lumachina|lumachina]] che ha combinato qualcosa, la [[La miniera|miniera]] piena, le vincite di [[Virtual (app)|virtual]] non viste, la [[La galera|galera]], il lavaggio finito, i wallet da decifrare, le app del pzkstore che servirebbero.

{{Vedi anche|pzk os|Le app di pzk os|La home di pzk os|Le icone di pzk os}}
[[Categoria:Il cercapersone]]`,
  },

  'La barra di stato': {
    data: '2026-10-29',
    fonti: [OS + 'os.js', TEL, README],
    testo: `'''La barra di stato''' di [[pzk os]] occupa le righe 0–11 dell'[[L'lcd|lcd]] (<code>BARRA</code> = 12: undici righe più la linea) ed è del sistema: le app disegnano sotto (<code>senzaBarra: true</code> la toglie, per le viste a schermo intero come la miniera, la foto e il campo di virtual). Dice l'ora, la rete a tacche, il nome del conto e la batteria.

{{Citazione|metti dati veri tipo quelli del pc tipo wifi|Alberto, 29 ottobre 2026}}

== I dati sono veri ==
Dal 29 ottobre (commit <code>7f98ca6</code>): la rete di chi guarda col ping vero, una HEAD a <code>/favicon.png</code> all'apertura e ogni 30 secondi; la batteria vera dove il browser la dice, se no quella del gioco come nel [[Il wallet|wallet]] ([[La batteria]]: 100 % alle 7 di mattina, 2 % alle 7 di sera, in carica di notte col cavo). Il collaudo ha trovato la riga della barra che arrivava fino nei due angoli stondati: ora si ferma prima.

{{Vedi anche|pzk os|L'lcd|La batteria|Il cavo di ricarica}}
[[Categoria:Il cercapersone]]`,
  },

  'Le regole per le app': {
    data: '2026-10-31',
    fonti: [OS + 'REGOLE.md', OS + 'os.js', PROVA, 'CLAUDE.md', README],
    testo: `{{Infobox
| titolo = Le regole per le app
| immagine = app-chat-collaudo.webp
| didascalia = il foglio del collaudo della chat: ogni passo una foto dell'lcd
| file = telefono/zero/os/REGOLE.md
| dal = 29 ottobre 2026 (notte)
| sezioni = 10: prima di cominciare, com'è fatta un'app, i tasti, lo schermo, le icone, le animazioni, i suoni, i dati e le attese, il collaudo, il modello da copiare
| memoria = [[Regole app pzk os (memoria)]]
| anche in = CLAUDE.md del repository
}}
'''Le regole per le app''' sono il documento <code>telefono/zero/os/REGOLE.md</code>: come si fa (o si cambia) un'app di [[pzk os]] senza bug. Ogni regola viene da un errore vero, scritto fra parentesi. Vanno lette per intero prima di toccare un'app, e lo dice anche il <code>CLAUDE.md</code> del repository ([[CLAUDE.md]]).

{{Citazione|fai delle regole e poi salvatele e memorizzale per sempre su come creare app in pzk os dentro al flipper senza bugs e usando i tasti presenti e senza bugs grafici con l'aggiunta di icone, animazioni e suoni tutti funzionanti|Alberto, 29 ottobre 2026, notte}}

Un'app è finita quando il [[Il collaudo delle app|collaudo]] dice «tutto a posto», le sue foto sono state guardate una per una, e Alberto ha detto ok.

== 1. Prima di cominciare ==
Un'app alla volta, e solo quando Alberto la chiede. La logica è quella del sito, pzk os è solo la faccia: prezzi, premi, regole e soldi passano dai moduli di <code>chat/</code>, <code>games/pzk.js</code>, <code>chat/zaino.js</code>; mai una seconda copia delle regole di un gioco, mai un nuovo posto dove salvare dati del server. L'id dell'app è quello di <code>APP</code> in <code>telefono/telefono.js</code>.

== 2. Com'è fatta un'app ==
Un file <code>os/&lt;id&gt;.js</code> che esporta <code>vista(os)</code>: un oggetto con <code>nome</code> e <code>app</code>, <code>disegna(l, t)</code> (disegna tutto lo schermo sotto la barra, ogni volta da capo), <code>tasto(n)</code> (torna true se l'ha usato), <code>entra()</code> ed <code>esci()</code>, <code>tic(t)</code> (dieci al secondo, solo per la vista in cima), <code>carattere</code>, <code>cancella</code>, <code>invio</code>, <code>scrivendo</code> per chi scrive, <code>senzaBarra</code>. Si registra in un posto solo: <code>PRONTE</code> in <code>os/os.js</code>, una riga. I pezzi in comune stanno in <code>os/pezzi.js</code>: un pezzo che serve a due app va lì, non copiato.

== 3. I tasti ==
{{Principale|I sei tasti}}
Solo i sei tasti del Flipper, più [[Il clic del mouse|il clic del mouse]]. INDIETRO sempre preso (<code>os.togli()</code>); tenuto tre secondi spegne ed è del sistema; ogni scritta che nomina un tasto dice il vero (la guida, «avanti ▶» che andava solo con OK); i tasti si nominano per nome; le liste girano in tondo; un tasto durante un'animazione non si perde; i numeri, i PIN e gli indirizzi con <code>os.cifre</code>, una misura con <code>os.numero</code>, un segreto a lettere con <code>os.tastiera({ nascosto: true })</code>; senza conto non si entra (<code>LIBERE</code>); chi scrive testo usa <code>os.tastiera</code> (con <code>simboli: true</code> per il codice C); il tasto 3D che si abbassa è del modello; quando i tasti di una scelta sono direzioni, le frecce li premono subito (il turno da rider). Il clic: <code>os.zona(x, y, w, h, fn)</code> per ogni cosa che si preme, in pixel dell'lcd, rifatte a ogni disegno; il bip lo fa il sistema; le cose già fatte non si premono.

== 4. Lo schermo ==
Tutto dentro il margine di 6 pixel e niente negli angoli stondati (un quarto d'ellisse 15 × 13 px per lato); il suggerimento in fondo centrato a <code>H − 9</code>; lettere 5 × 7, passo 6, una riga ogni 9 pixel, 40 caratteri a scala 1 e 20 a scala 2, il testo lungo va a capo con <code>Lcd.acapo</code> e quello che non sta si taglia con «…»; ogni scritta deve stare anche coi dati peggiori (niente, zero, 999.999.999 $pzk con <code>pzk.fmtCorto</code>, un nome di 20 lettere); solo i caratteri di [[Il carattere 5×7|font.js]]; la riga scelta è una fascia scura col testo rovesciato, e tutto il rovesciato sta dentro la fascia (il ▶ delle impostazioni stava fuori: arancione su arancione, invisibile); mai testo sopra altro testo (il «↓ 1» della chat finiva attaccato ai messaggi); un cursore non copre il testo (copriva la «s» di «scrivi»); le liste lunghe con <code>l.ritaglia</code> e la barra di scorrimento; <code>disegna</code> disegna e basta, non cambia lo stato (la barra del tempo della chat leggeva <code>m.tempo.fermo</code> quando <code>m.tempo</code> era già null: «reading 'fermo'» a ogni fotogramma); un bit e basta.

== 5. Le icone ==
{{Principale|Le icone di pzk os}}
Tracciati SVG in <code>os/icone.js</code>, viewBox 16 × 16, forme piene; <code>app-&lt;id&gt;</code> a 16 e a 32; un nome che non c'è lascia un buco; le webp di Alberto solo come riserva.

== 6. Le animazioni ==
Solo col <code>tic(t)</code> della vista, dieci al secondo, cambiando lo stato e chiamando <code>os.ridisegna()</code>; niente <code>setInterval</code> né <code>requestAnimationFrame</code> per disegnare; si ridisegna solo mentre si anima (ogni disegno rifà la tela 768 × 384, la trama del 3D e il tasto sul muro); corte, al massimo un secondo e mezzo; la retroilluminazione è del sistema.

== 7. I suoni ==
Il bip di ogni tasto e la sigla dell'app che si apre li fa il sistema (<code>os/suoni.js</code>): un'app non rifà il bip dei suoi tasti. Ogni app nuova ha la sua sigla in <code>suono/interfaccia.js</code> (<code>MUSICHE</code>) col nome dell'id, chiptune sintetizzato di uno o due secondi; senza, l'app si apre muta (le impostazioni si aprivano mute). I suoni dei momenti con <code>os.suoni.sigla(nome)</code> o <code>os.suoni.bip(tipo)</code>; mai un file audio, mai un <code>AudioContext</code> dentro un'app. L'interruttore dei suoni spegne tutto da sé.

== 8. I dati e le attese ==
Si legge e si scrive coi moduli del sito; i dati del server stanno sul server di Alberto ([[La banca sul server]]). Il localStorage usa la chiave <code>pzkko-zero-&lt;id&gt;</code> (e <code>:&lt;ind&gt;</code> se il dato è di un conto), sempre in try/catch. Chi ascolta smette in <code>esci()</code>. Dopo ogni <code>await</code> si controlla <code>os.corrente() === vista</code>. <code>os.dialogo</code> e <code>os.tastiera</code> tornano null con INDIETRO. Mentre si aspetta il server la rotellina in fondo (<code>striscia</code>) e niente doppi invii; un'azione che non si disfa si conferma con un dialogo. Una rete che non risponde non rompe l'app.

== 9. Il collaudo ==
{{Principale|Il collaudo delle app}}
<code>node --check</code>, poi <code>prova.mjs --giorno --suoni --app=&lt;id&gt;</code> deve dire «tutto a posto», poi la notte; si guardano tutte le foto; tutte le viste con <code>--tasti</code>; le app col conto con <code>--server-finto</code> e <code>--senzaconto</code>; i dati peggiori con <code>--peggiori</code>; il tasto sul muro con <code>--muro</code>; il clic davvero; i comandi della chat che toccano la pagina si provano anche nello zero; un paragrafo nel README.

== 10. Il modello da copiare ==
Un'app «esempio» di sessanta righe che passa il collaudo: una lista di sette voci con la riga scelta rovesciata, il ✓ dentro la sua fascia, la barra di scorrimento come il menu, il suggerimento centrato in fondo, il dialogo di conferma, il lampo, la sigla «moneta». Si copia, si rinomina, si cambia. Poi una riga in <code>PRONTE</code>, la sigla, l'icona e il collaudo.

== Se una regola è sbagliata ==
Si corregge REGOLE.md, non si aggira ([[Regole app pzk os (memoria)]]). Nella sessione in cui sono nate, Alberto aveva trovato a occhio, uno dopo l'altro, i bug che ora vietano; il collaudo scritto insieme ne ha trovati altri sei nella chat e nelle impostazioni prima che li vedesse lui.

{{Vedi anche|pzk os|Il collaudo delle app|Regole app pzk os (memoria)|CLAUDE.md|Le app di pzk os}}
[[Categoria:Il cercapersone]] [[Categoria:Le app di pzk os]]`,
  },

  'Il collaudo delle app': {
    data: '2026-11-02',
    fonti: [PROVA, OS + 'REGOLE.md', README],
    testo: `{{Infobox
| titolo = Il collaudo delle app
| immagine = app-profilo-collaudo.webp
| didascalia = il foglio del collaudo del profilo
| strumento = tools/pzkko/zero/prova.mjs
| comando = node tools/pzkko/zero/prova.mjs --giorno --suoni --app=&lt;id&gt;
| foto = tools/pzkko/lavoro/zero/prova-app-&lt;id&gt;-*.png (768 × 384)
| dal = 29 ottobre 2026
| vuole = la scheda video vera (ANGLE d3d11) e puppeteer-core in tools/catture
}}
'''Il collaudo delle app''' è <code>prova.mjs --app=&lt;id&gt;</code>: apre la home in Chromium con uno zaino finto e un conto finto, tocca il [[Il tasto sul muro|tasto sul muro]], apre l'app come il [[Il menu di pzk os|menu]], preme tutti e sei i [[I sei tasti|tasti]] (OK due volte, così si conferma anche un dialogo), salva l'[[L'lcd|lcd]] a ogni passo e controlla da solo gli angoli stondati, il margine, i caratteri senza glifo, le icone che non ci sono, gli errori della pagina e il bip. Deve finire con <code>COLLAUDO &lt;id&gt;: tutto a posto</code>.

== Le opzioni ==
{| class="wikitable"
! opzione !! cosa fa
|-
| <code>--app=&lt;id&gt;</code> || apre e collauda quell'app
|-
| <code>--giorno</code> || alle 12:00 col sole; senza, è notte (<code>21:00&amp;notte=1</code>: lampioni, l'auto)
|-
| <code>--suoni</code> || coi suoni accesi: il collaudo vuole anche il bip a ogni tasto; conta solo i suoni di <code>suono/interfaccia.js</code>, non la musica
|-
| <code>--tasti=dx,dx,ok,giu,…</code> || una sequenza a scelta; <code>clic@80x121</code> un clic sul pixel 80, 121 attraverso il 3D vero; <code>okvero</code> il tasto OK vero (Ctrl+Invio); <code>aspetta@3000</code> fermo tre secondi senza tasti (il quiz che passa alla domanda dopo); <code>scrivi@mine+50</code> scrive «mine 50»; <code>conta@statistica@n</code> lo zaino conta come dopo un'azione vera; <code>prendi@pezzo@n</code> mette un pezzo nello zaino
|-
| <code>--server-finto</code> || un wallet finto dentro il collaudo (entra col PIN 1234, crea, sincronizza, converti, invia, chi è, PIN, indirizzo), la borsa finta, il database dei giocatori finto, i colpi (<code>--rapina=presi</code>, <code>--rapina=galera</code>), il quiz finto (tre domande, la giusta è sempre la prima)
|-
| <code>--senzaconto</code> || nessun conto: il cercapersone chiuso, l'account
|-
| <code>--economia</code> || 73.500 sporchi di una rapina, lavatrice e decifratore installati, due wallet e una chiavetta nello zaino; <code>=vuota</code> niente sporchi, <code>=poveri</code> solo 1.200 puliti; <code>--lavaggio=gira</code> o <code>=pronto</code>
|-
| <code>--peggiori</code> || i dati peggiori: un nome di 20 lettere, un motto di 60, quasi un miliardo di $pzk, i soldi sporchi e un livello sopra 100
|-
| <code>--muro</code> || solo il tasto sul muro, a 4× (<code>prova-tasto.png</code> e, senza lcd, <code>prova-tasto-nudo.png</code>)
|-
| <code>--rider</code> || un turno intero da rider con due frecce e due clic, e il controllo che sia contato
|-
| <code>--telefono</code>, <code>--larga</code>, <code>--misura=3440x1440</code> || 390 × 844, 1920 × 1080, o una finestra qualsiasi (il cavo lungo)
|-
| <code>--sonda</code> || stampa il profilo della fascia della scritta e la mappa della testata del modello
|}

Segnala anche i testi più larghi dello schermo, pure quando il ritaglio li taglierebbe in silenzio. Niente server vero: le richieste alle api falliscono, e il sito deve stare in piedi lo stesso (regola 8.7).

== Poi si guardano le foto ==
Tutte, <code>tools/pzkko/lavoro/zero/prova-app-&lt;id&gt;-*.png</code>, 768 × 384 pixel per pixel. Il collaudo non vede il testo rovesciato fuori dalla fascia, le scritte sovrapposte e i suggerimenti che non dicono il vero: quelli si vedono solo guardando. Guardando le foto sono usciti, fra gli altri: «dal Invalid Date» nel profilo, il bollino «liv 129» fuori dal riquadro, le virgolette « » come «&lt;», il campione del colore invisibile nella riga scelta, la striscia dell'esito negli angoli stondati dell'account, il tasso grande che usciva.

== Cosa ha trovato al primo giro ==
Sei difetti, nella chat e nelle impostazioni: l'errore «reading 'fermo'» della barra del tempo, la barra delle schede a x 3 fuori dal margine, il «›» del prompt senza glifo, il cursore sopra la «s» di «scrivi», il bollino «↓ 1» attaccato ai messaggi, la riga della barra di stato fino nei due angoli stondati. A occhio: il ▶ delle impostazioni scritto fuori dalla fascia scura e «◀ indietro» nella vista «in arrivo».

== Il browser ==
Vuole la scheda video vera (ANGLE d3d11). Il 31 ottobre Edge senza finestra su questo PC usciva subito senza errori: il collaudo va con un Chrome scaricato in <code>%LOCALAPPDATA%\\pzkko-chrome</code> (<code>@puppeteer/browsers install chrome@stable</code> da tools/catture), passato con la variabile <code>CHROME</code> o <code>--chrome=</code> ([[Cercapersone zero (memoria)]]). Le prove pilotate vogliono <code>?chat</code> nell'indirizzo, se no la home non carica la chat. Il server del collaudo ha i MIME di json e mjs che pzk os importa dalla chat (<code>foto.mjs</code> non li aveva, e il tasto sul muro era rimasto vecchio).

{{Vedi anche|Le regole per le app|pzk os|Il tasto sul muro|Regole app pzk os (memoria)|Cercapersone zero (memoria)}}
[[Categoria:Il cercapersone]] [[Categoria:Gli strumenti]]`,
  },

  'Il tasto sul muro': {
    data: '2026-10-30',
    fonti: [ZERO + 'muro.js', ZERO + 'muro-dati.js', 'albertopecchini.it/tools/pzkko/zero/foto.mjs', 'albertopecchini.it/pzkko/chat/chat.js', 'albertopecchini.it/pzkko/chat/led.js', 'albertopecchini.it/pzkko/index.html', README],
    testo: `[[File:zero-tasto.webp|thumb|il tasto a 4×, dal collaudo <code>--muro</code>: la foto della posa muro, l'lcd vivo portato sul vetro con la matrix3d, il led, il nastro]]
'''Il tasto sul muro''' è il [[Il cercapersone zero|cercapersone zero]] com'è sul [[Il muro|muro]] prima di aprirlo: lo stesso tasto <code>.chat-tasto</code> di prima (<code>.chat-tasto.zero</code>), in cima alla seconda pila sotto il [[Il wallet|wallet]], vestito da zero da <code>telefono/zero/muro.js</code>.

== Com'è fatto ==
* la foto <code>art/zero/zero-piccolo.webp</code>: la scena 3D fotografata nella posa muro da <code>tools/pzkko/zero/foto.mjs</code>, 1344 × 776, le proporzioni del tasto di prima, scattata con una luce fissa di giorno (<code>FISSA</code>);
* l'[[L'lcd|lcd]] con la chiocciolina ([[Il tomodachi]]) portato sui quattro angoli dello schermo in foto con una <code>matrix3d</code>: l'omografia, scritta da foto.mjs in <code>muro-dati.js</code>; gli angoli si prendono alla superficie del vetro (z 2,1), non a z 0,9 dove sta il piano dell'lcd, se no la parallasse della vista di tre quarti lo spostava («è storto lo schermo»);
* il [[Il led rosso|led]] dov'è il tubicino;
* il nastro adesivo (<code>art/zero/attacco.svg</code>) al posto del chiodo del cercapersone nero.
Dal 26 ottobre il tasto è un pezzo della parete come i volantini, nelle [[Le pile|pile]] di <code>disposizione.js</code>, e scorre col muro; nella [[La scena 3D|scena 3D]] lo disegna una tela viva (<code>scena/fogli.js</code>, <code>viva</code>) che ricopia dieci volte al secondo la sua immagine.

La tela di pzk os sul tasto (<code>muro.js</code>, <code>vivo</code>) è grande quanto il vetro in pixel veri e si ridisegna al cambio di misura: la vecchia 256 stretta in 230 px con <code>image-rendering: pixelated</code> saltava delle righe. Appena la pagina è tranquilla si scaldano il modello e three.js, così al tocco il volo parte subito.

== Prima del primo disegno ==
Le foto del tasto non hanno <code>src</code> nell'html: lo script scritto subito dopo il tasto (in <code>index.html</code> e <code>storia/index.html</code>) decide prima del primo disegno e chiama muro.js subito; <code>zero.css</code> sta nella testa della pagina; lcd e led restano nascosti finché muro.js non li mette sul vetro (<code>.vestito</code>). Così non si vede mai il nero per un attimo.

== Rifarlo ==
Dopo ogni cambio al modello si rilancia <code>foto.mjs</code> e si guarda che abbia scritto davvero: una volta falliva in silenzio per un MIME mancante e Alberto ha visto il muro vecchio («neanche modificato»). <code>prova.mjs --muro</code> scatta il tasto a 4× per vedere se lo schermo sta nel vetro.

{{Vedi anche|Il cercapersone zero|L'lcd|Il led rosso|Il tomodachi|Le pile|Il modello dello zero}}
[[Categoria:Il cercapersone]]`,
  },

  'La luce dello zero': {
    data: '2026-11-02',
    fonti: [ZERO + 'luce.js', ZERO + 'zero.js', 'albertopecchini.it/pzkko/scena/luci.js', README],
    testo: `'''La luce dello zero''' (<code>telefono/zero/luce.js</code>) è la luce con cui si vede il [[Il cercapersone zero|cercapersone zero]] aperto: la stessa del sito, coi riflessi veri della strada.

{{Citazione|la luce deve essere = a quella del sito… i riflessi identici delle auto, lampioni|Alberto, 29 ottobre 2026}}

== Il sole e la notte ==
Il sole di Mantova a quest'ora (lo stesso calcolo NOAA di <code>scena/luci.js</code>, copiato per non caricare la scena; l'ora di <code>window.pzkkoOrologio</code>, anche quella della [[La regia|regia]]) fa la luce direzionale: direzione, colore rosso quando è basso, forza che va a zero la sera. Il cielo è la luce diffusa. Di notte, dalle variabili della pagina (<code>window.pzkkoPagina.luci</code>: notte, lampioni, auto-x/auto-l/auto-c) si accendono la lampada a muro sopra la saracinesca e i fari dell'[[Le auto che passano|auto che passa]], una luce che scorre da sinistra a destra davanti al cercapersone. Esposizione 0,7. Di notte il cercapersone era color sabbia: la lampada ha ora il colore di quella della scena (0xffe4c0) e metà forza, e il cielo disegnato per i riflessi è grigio-blu come il buio del sito.

== I riflessi ==
Se la [[La scena 3D|scena 3D]] della home è accesa (<code>window.pzkkoScena</code>), ogni 1,5 s si fotografano davvero le sei facce del posto dal punto del cercapersone (<code>luce.cattura</code>: la telecamera della scena girata sulle sei direzioni, 64 × 64) e diventano l'ambiente (PMREM); se no, un cielo disegnato con l'ora (il sole, l'orizzonte arancione dei lampioni, la striscia calda dei fari dove sta l'auto). La foto del tasto sul muro è scattata con una luce fissa di giorno (<code>FISSA</code>): aprendo, il 3D parte con quella e passa alla luce vera durante il volo (<code>luceMescola</code>), al ritorno il contrario, così non si vede mai un cambio secco.

== Senza fermare il sito ==
Il 2 novembre la foto dei riflessi fermava la pagina per 5,8 s («lagga un casino l'avvio… si freeza tutto il sito per 5 s»): disegnava la scena dritta sullo schermo mentre lei col post-processing disegna in una tela intermedia, e la scheda compilava al volo un'altra versione di ogni materiale. Ora <code>luce.cattura</code> disegna in una tela come quella del composer (il tono, ACES, e lo sRGB li fa lei a mano; sul telefono, <code>liv.diretta</code>, la scena disegna già sullo schermo e la foto pure), legge le facce in un buffer ritirato a lavoro finito (<code>fenceSync</code>), si fa nei momenti liberi (<code>requestIdleCallback</code>) e fra una foto e l'altra resta lei; i materiali dello zero e i programmi del filtro PMREM si compilano con <code>compileAsync</code> prima del primo fotogramma. Nessun blocco oltre i ~60 ms.

{{Vedi anche|Il cercapersone zero|La scena 3D|Le luci a insiemi|La sera a Mantova|Le auto che passano}}
[[Categoria:Il cercapersone]]`,
  },

  'La scritta PZKKO': {
    data: '2026-10-29',
    fonti: [ZERO + 'zero.js', PROVA, README],
    testo: `'''La scritta PZKKO''' è il logo stampato sul [[Il cercapersone zero|cercapersone zero]], sulla fascia inclinata a 30° sotto il fronte (sondata nel modello con <code>prova.mjs --sonda</code>: da y 1,0 z 1,97 a y −5,5 z −1,78), non a cavallo dello smusso.

{{Citazione|pzkko sta solo sul lato sotto non a cavallo della smussatura|Alberto, 29 ottobre 2026}}

È a pixel, maiuscola, inclinata, piena, coi tratti spessi tre celle e gli angoli smussati, come il logo «FLIPPER» stampato sul Flipper vero (le foto di Alberto, 29.10): disegnata a blocchi in <code>zero.js</code> (<code>scritta</code>), niente carattere. Prima era disegnata «a un tratto solo, tonda, arancione» sotto lo schermo; il carattere Fredoka è stato bocciato ([[Cercapersone zero (memoria)]]).

Nel terzo giro era «inesistente»: dai vertici dell'OBJ si era presa la parete interna del guscio, e la scritta stava 1,4 mm dentro la plastica, sul muro si vedeva e aprendo no. Da allora si misura col raggio (<code>rig.sonda</code>, <code>rig.scritta(dz)</code>), non coi vertici ([[Il modello dello zero]]).

{{Vedi anche|Il modello dello zero|Il cercapersone zero}}
[[Categoria:Il cercapersone]]`,
  },

  'Il cavo di ricarica': {
    data: '2026-10-29',
    fonti: [ZERO + 'zero.js', PROVA, README],
    testo: `[[File:zero-cavo.webp|thumb|il cavo entrato nella porta usb-c sulla testata destra, in una finestra larga]]
'''Il cavo di ricarica''' del [[Il cercapersone zero|cercapersone zero]] entra nella porta usb-c sulla testata destra quando il browser dice che il computer è in carica: un PC fisso dice sempre 100 % in carica, e lì il cavo c'è sempre.

== Come entra ==
Le stesse tappe del cavo del [[Il cercapersone nero|cercapersone nero]]: arriva da destra inclinato, tocca, si raddrizza cercando il buco, spinge e SCATTA dentro. La spina entra nel centro sondato del buco (y 9,25, z −8,4), «centratissima».

== Com'è fatto ==
Dal terzo giro («la presa deve entrare centratissima al buco… dal cavo esce un cilindro stondato»): la linguetta d'argento ha la sezione dell'usb-c vero (8,3 × 2,5 mm, i lati corti a semicerchio, <code>Shape</code> + <code>ExtrudeGeometry</code>), il corpo nero è squadrato (smusso 0,9 mm, non 2,2), la guaina è un tronco a sezione quadrata che si stringe dal corpo al filo (una RoundedBox coi vertici scalati), non un cilindro.

== Il cavo lungo ==
{{Citazione|fai un cavo più lungo almeno il triplo che esca dalla pagina|Alberto, 29 ottobre 2026, notte}}
Il filo scende per 60 cm invece di 16 (la stessa curva, poi giù dritto), così la sua fine non si vede in nessuna finestra. <code>prova.mjs --misura=3440x1440</code> prova una finestra qualsiasi (le foto <code>cavo-2560x1440</code>, <code>cavo-3440x1440</code>, <code>cavo-telefono</code>).

{{Vedi anche|Il cercapersone zero|La batteria|La barra di stato|Il modello dello zero}}
[[Categoria:Il cercapersone]]`,
  },

  'Il led rosso': {
    data: '2026-10-29',
    fonti: ['albertopecchini.it/pzkko/chat/led.js', ZERO + 'zero.js', ZERO + 'muro.js', OS + 'impostazioni.js', README],
    testo: `'''Il led rosso''' del [[Il cercapersone zero|cercapersone zero]] è il tubicino a x 40–43 del modello (e sul [[Il tasto sul muro|tasto del muro]] il puntino nel punto giusto della foto). Segue le classi del led di prima (<code>chat/led.js</code>): lampeggia piano quando c'è qualcosa da riscuotere, e sfarfalla come la spia del disco di un PC quando il sistema lavora: ogni richiesta al server, il bot che pensa e scrive. Nelle [[Impostazioni (app)|impostazioni]] si spegne, e spento resta spento anche sul muro.

{{Vedi anche|Il tasto sul muro|Impostazioni (app)|Il cercapersone zero}}
[[Categoria:Il cercapersone]]`,
  },

  'L\'inclinazione col mouse': {
    data: '2026-10-29',
    fonti: [ZERO + 'zero.js', OS + 'impostazioni.js', README],
    testo: `'''L'inclinazione col mouse''' (<code>inclinazione</code> in <code>zero.js</code>): da aperto il [[Il cercapersone zero|cercapersone zero]] (con l'lcd, la scritta e la spina, che stanno nel suo <code>corpo</code>) ruota piano attorno al suo centro verso il mouse, ±5° in su e in giù e ±7° di lato, e torna dritto quando il mouse esce. Si spegne nelle [[Impostazioni (app)|impostazioni]] («inclina col mouse»).

{{Citazione|in base a dove metto il mouse si inclini leggermente|Alberto, 29 ottobre 2026}}

È per questo che le app tengono tutto dentro il margine di 6 pixel e niente negli angoli stondati dell'[[L'lcd|lcd]]: con l'inclinazione i pixel ai bordi sparirebbero sotto la cornice ([[Le regole per le app]], 4.1).

{{Vedi anche|Il cercapersone zero|Impostazioni (app)|L'lcd}}
[[Categoria:Il cercapersone]]`,
  },

  'Il saluto': {
    data: '2026-10-29',
    fonti: [TEL, ZERO + 'zero.js', 'albertopecchini.it/pzkko/chat/tomodachi.js', README],
    testo: `[[File:zero-saluto.webp|thumb|la chiocciolina che saluta sull'lcd 3D mentre la telecamera torna sul tasto]]
'''Il saluto''' è quello che succede chiudendo il [[Il cercapersone zero|cercapersone zero]]: [[pzk os]] si spegne (si riempie di scuro a scatti e la luce cala, <code>lcd.accendi</code> del sistema), pzk os torna al desktop, l'[[L'lcd|lcd]] 3D mostra la chiocciolina ([[Il tomodachi]], <code>tomodachi.saluta</code>) che saluta, e la telecamera torna sul [[Il tasto sul muro|tasto]]. Sul cellulare la tela torna chiudendo. Si chiude con INDIETRO nella home, toccando fuori, con Esc; INDIETRO tenuto tre secondi spegne da qualunque app.

{{Vedi anche|Il cercapersone zero|Il tomodachi|I sei tasti}}
[[Categoria:Il cercapersone]]`,
  },

  'Le app di pzk os': {
    data: '2026-11-02',
    fonti: [TEL, OS + 'os.js', README],
    testo: `'''Le app di pzk os''' sono ventidue: le ventuno di <code>APP</code> in <code>telefono/telefono.js</code> più le [[Impostazioni (app)|impostazioni]], che stanno in fondo al [[Il menu di pzk os|menu]]. Tutte sono «maniacalmente perfette» su richiesta, tutte seguono [[Le regole per le app|REGOLE.md]] e passano il [[Il collaudo delle app|collaudo]], tutte usano la logica dell'app vecchia esportata e non copiata.

{{Citazione|crea uno alla volta shop, pzkstore, sfide, quiz, quest, giocatori, zaino, miniera, foto, virtual, banca, rapina, bin&hex, calcoli, codice C, cucina e impostazioni; falle tutte maniacalmente perfette|Alberto, 29 ottobre 2026, notte}}

{| class="wikitable"
! icona !! app !! id !! cosa fa !! dal
|-
| [[File:/art/chat-app/app-chat.webp|32px]] || [[Chat (app)|chat]] || chat || il bot dei $pzk coi comandi veri || 29.10
|-
| [[File:/art/chat-app3/app-profilo.webp|32px]] || [[Profilo (app)|profilo]] || profilo || sei pagine: cartellino, soldi, giochi, bot, progressi, classifiche; la modifica || 29.10
|-
| [[File:/art/chat-app3/app-account.webp|32px]] || [[Account (app)|account]] || account || crea o entra; conto, mosse, cambio, invia, altro || 29.10
|-
| [[File:/art/chat-app/app-shop.webp|32px]] || [[Shop (app)|shop]] || negozio || offerte, tutto, i cinque reparti, il carrello, lo scontrino || 29.10
|-
| [[File:/art/chat-app3/app-pzkstore.webp|32px]] || [[Pzkstore (app)|pzkstore]] || pzkstore || le app da comprare: lavatrice e decifratore || 29.10
|-
| [[File:/art/chat-app/app-sfide.webp|32px]] || [[Sfide (app)|sfide]] || sfide || le tre sfide del giorno e il bonus || 29.10
|-
| [[File:/art/chat-app/app-quiz.webp|32px]] || [[Quiz (app)|quiz]] || quiz || i quiz retributivi, che avanzano da soli || 2.11
|-
| [[File:/art/chat-app/app-quest.webp|32px]] || [[Quest (app)|quest]] || missioni || le tredici side quest a bivi || 29.10
|-
| [[File:/art/chat-app/app-giocatori.webp|32px]] || [[Giocatori (app)|giocatori]] || giocatori || classifiche, notizie, cerca, io (la lumachina) || 29.10
|-
| [[File:/art/chat-app/app-zaino.webp|32px]] || [[Zaino (app)|zaino]] || zaino || i filtri, gli effetti, le schede dei pezzi || 29.10
|-
| [[File:/art/chat-miniera/app-miniera.webp|32px]] || [[Miniera (app)|miniera]] || miniera || la postazione a un bit, i pezzi, i PC pronti || 29.10
|-
| [[File:/art/chat-app/app-foto.webp|32px]] || [[Foto (app)|foto]] || foto || le 126 foto vere dei quiz, a un bit || 29.10
|-
| [[File:/art/chat-app2/app-virtual.webp|32px]] || [[Virtual (app)|virtual]] || virtual || la partita, le quote, la schedina || 29.10
|-
| [[File:/art/chat-app/app-banca.webp|32px]] || [[Banca (app)|banca]] || banca || il wallet a un bit: saldo, borsa, numeri || 29.10
|-
| [[File:/art/chat-app3/app-rapina.webp|32px]] || [[Rapina (app)|rapina]] || rapina || il colpo alla cassa, la cella || 29.10
|-
| [[File:/art/chat-app3/app-lavatrice.webp|32px]] || [[Lavatrice (app)|lavatrice]] || lavatrice || i soldi sporchi (dal pzkstore) || 1.11
|-
| [[File:/art/chat-app3/app-decifratore.webp|32px]] || [[Decifratore (app)|decifra]] || decifratore || i wallet e le chiavette (dal pzkstore) || 1.11
|-
| [[File:/art/chat-app3/app-conversioni.webp|32px]] || [[Bin·hex (app)|bin·hex]] || conversioni || le basi, il complemento a 2, come si fa || 29.10
|-
| [[File:/art/chat-app3/app-calcolatrice.webp|32px]] || [[Calcoli (app)|calcoli]] || calcolatrice || la scientifica del geometra || 29.10
|-
| [[File:/art/chat-app3/app-compilatore.webp|32px]] || [[Codice C (app)|codice C]] || compilatore || l'editor e GCC vero || 29.10
|-
| [[File:/art/chat-app3/app-cucina.webp|32px]] || [[Cucina (app)|cucina]] || cucina || le ricette alla Cooking Mama coi tasti || 29.10
|-
| || [[Impostazioni (app)|impostazioni]] || impostazioni || luminosità, suoni, led, inclinazione, guida, di fabbrica || 29.10
|}

Le app sono viste impilate: ogni app è un file <code>os/&lt;id&gt;.js</code> che esporta <code>vista(os)</code> e si registra in <code>PRONTE</code>; le app a pagine usano <code>testata</code>, <code>pagine</code>, <code>puntini</code> e <code>sposta</code> di <code>pezzi.js</code>, e ← → (o ↑ ↓) le sfogliano. Tutte hanno la loro [[Le sigle delle app|sigla]] e la loro [[Le icone di pzk os|icona]] SVG. Senza conto si apre solo l'account (e le impostazioni).

Chi le vuole aprire da fuori: il link della pagina [[Gadget (pagina)|gadget]] («#chat»), <code>telefono.vai(id)</code>, i comandi della chat (<code>telefono</code>, <code>shop</code>, <code>virtual</code>, <code>pzkstore</code>, <code>lavatrice</code>), e il [[Il wallet|wallet]], i cui quattro tasti gialli portano all'account.

{{Vedi anche|pzk os|Il menu di pzk os|Le regole per le app|Il collaudo delle app|Le app di pzk os (tabella)}}
[[Categoria:Il cercapersone]] [[Categoria:Le app di pzk os]]`,
  },

  'Chat (app)': {
    data: '2026-11-02',
    fonti: [OS + 'chat.js', 'albertopecchini.it/pzkko/chat/chat.js', 'albertopecchini.it/pzkko/chat/predittivo.js', 'albertopecchini.it/pzkko/chat/minigiochi.js', 'albertopecchini.it/pzkko/chat/zaino.js', OS + 'os.js', README],
    testo: `{{Infobox
| titolo = Chat (app)
| immagine = app-chat.webp
| didascalia = la prima schermata, dal collaudo: la scheda del bot, la riga da scrivere e i consigliati
| id = chat
| file = telefono/zero/os/chat.js
| logica = chat/chat.js, chat/comandi/*, chat/predittivo.js, chat/minigiochi.js
| icona = app-chat
| sigla = chat
| dal = 29 ottobre 2026 (la prima app di pzk os)
| serve il conto = sì (senza conto girava nella sessione finché non c'era l'account)
}}
'''Chat''' è la prima app vera di [[pzk os]], l'unica che Alberto ha chiesto subito («fai solo app chat completissima»): la [[La chat col bot|chat col bot pzk]] disegnata a pixel sull'[[L'lcd|lcd]], coi comandi veri del sito.

== I comandi sono quelli veri ==
<code>os/chat.js</code> usa lo stesso motore di <code>chat/chat.js</code> e gli stessi [[I comandi della chat|comandi]] di <code>chat/comandi/*</code>: attese, eventi casuali, scassato, soldi, morte. Ogni comando riceve un <code>ctx</code> come quello della chat in HTML, ma le schede, i tasti, le griglie dei [[I minigiochi della chat|minigiochi]] (mine, gratta e vinci), i rulli della slot, le barre del tempo e la riga da scrivere si disegnano a pixel. Una '''maniglia finta''' fa da elemento per i comandi che toccano il DOM: <code>querySelector</code> dei rulli, dei tasti, del testo; un selettore <code>[data-…]</code> che la maniglia non conosce scrive nel corpo della scheda. È stato il guasto del [[Il rider|rider]]: <code>[data-fatte]</code> tornava null e alla prima svolta la consegna andava in errore.

== Com'è fatta ==
Le schede: la barra a sinistra, l'icona di Alberto (il [[Il bot pzk|bot]]) e il titolo, il testo a 40 colonne, i campi, il piè, i tasti di seguito. Si scrive dalla tastiera vera (Invio manda) o, con OK a riga vuota, da quella sullo schermo. Sopra la riga i suggerimenti del [[Il testo predittivo|testo predittivo]] (comandi e argomenti: sinistra/destra scelgono, OK o Tab completano). Il bollino «↓ 1» coi nuovi messaggi, che prima finiva attaccato ai messaggi (ora pulisce il suo posto). La storia resta (sessione o conto).

== I consigliati ==
{{Principale|I consigliati}}
{{Citazione|fai che la chat mostri subito dei tasti da dove cominciare e con i comandi consigliati|Alberto, 2 novembre 2026}}
A riga vuota, sopra la riga, i tasti incorniciati coi comandi pronti adesso: giornaliero se il premio c'è, missioni se una quest è pronta, lavora e pesca se non c'è attesa; poi le ultime righe scritte (<code>zaino.rapidi</code>) e saldo, negozio, aiuto, al più otto; ◀ ▶ ai lati quando non ci stanno tutti. ← → li scelgono (la riga li mostra) e OK li manda, il clic li manda subito. Se l'ultima scheda ha le sue azioni di seguito, ← → vanno a quelle e i consigliati spariscono.

== I tasti ==
Su e giù scorrono; quando un minigioco aspetta una scelta la croce va sui suoi tasti o sulle celle della griglia e OK preme; quando aspetta una parola la riga lo dice. Quando i tasti di una scelta sono direzioni (sinistra, dritto o centro, destra, giù: la consegna del rider, il rigore) le frecce li premono subito (<code>scegli</code>), il tasto porta la sua freccia e sotto c'è scritto «premi ← ↑ → o fai clic». Si cliccano i tasti, le azioni, i suggerimenti e il bollino «↓». Da scassato ([[Il cercapersone scassato]]) propone solo <code>lavora</code> e <code>compra cercapersone</code>.

== Il collaudo ==
[[File:app-chat-collaudo.webp|thumb|left|il cercapersone zero durante il collaudo della chat (prova.mjs --app=chat)]]
Al primo giro il [[Il collaudo delle app|collaudo]] ha trovato sei difetti, quattro qui: l'errore «reading 'fermo'» della barra del tempo (la barra leggeva <code>m.tempo.fermo</code> quando <code>m.tempo</code> era già null), la barra delle schede a x 3 fuori dal margine, il «›» del prompt senza glifo, il cursore sopra la «s» di «scrivi», il bollino «↓ 1» attaccato ai messaggi. <code>prova.mjs --rider</code> fa un turno intero da rider. Resta da fare: il nastro dei cestini dello [[Lo spazzino di uffici|spazzino]] costruisce pezzi HTML veri, che nello zero non si vedono.

{{Vedi anche|La chat col bot|I comandi della chat|Il testo predittivo|I consigliati|I tasti rapidi|Il bot pzk|I minigiochi della chat|Il rider|pzk os}}
[[Categoria:Le app di pzk os]]`,
  },

  'Profilo (app)': {
    data: '2026-10-29',
    fonti: [OS + 'profilo.js', 'albertopecchini.it/pzkko/telefono/app/profilo.js', OS + 'pezzi.js', README],
    testo: `{{Infobox
| titolo = Profilo (app)
| immagine = app-profilo.webp
| didascalia = il cartellino: la faccia, il bollino del livello, il nome, l'indirizzo, il motto, la barra degli xp
| id = profilo
| file = telefono/zero/os/profilo.js
| logica = telefono/app/profilo.js (esporta compraFaccia e nomeAv)
| icona = app-profilo (rifatta in un tracciato solo)
| sigla = profilo
| dal = 29 ottobre 2026 (notte)
| serve il conto = sì
}}
'''Profilo''' è la seconda app vera di [[pzk os]] dopo la chat: il cartellino e tutti i numeri del giocatore.

{{Citazione|ora crea app profilo fatta benissimo|Alberto, 29 ottobre 2026, notte}}

== Le sei pagine ==
Si sfogliano con ← → (e ↑ ↓) coi pallini in alto e lo scorrimento di lato (<code>pagine</code> di pezzi.js):
# il '''cartellino''': la faccia, il bollino del livello, il nome, l'indirizzo e la data, il titolo, i [[I soldi sporchi|soldi sporchi]] o la [[La galera|galera]], il motto, la barra degli xp che si riempie entrando, tutto dentro la cornice scelta disegnata davvero (nastro, oro doppia, neon a puntini, pixel a gradini);
# i '''soldi''' (coi puntini fra nome e numero);
# i '''giochi grandi''' (la tabella mani, vinte, netto, colpo);
# la '''vita col bot''';
# i '''progressi''';
# le '''classifiche''' (col conto, da <code>chat/db.js</code>; senza, o col server che non risponde, lo dice).

== La modifica ==
OK apre la modifica: l'anteprima del cartellino sopra, e quattro righe: la faccia, il colore come trama a un bit, la cornice, il motto con la tastiera. La faccia: la griglia di tutte le 33 [[Le facce del profilo|facce]], quelle non tue sbiadite, quella in uso sottolineata, sotto la scelta in grande con la rarità e cosa fa OK; si compra con un dialogo (sigla «negozio»), le chiuse dicono cosa manca. L'acquisto è <code>compraFaccia</code> dell'app vecchia: una regola sola per tutti e due. Tutto si clicca anche col mouse. Il testo degli altri (nome, motto, titolo) passa da <code>txt</code>.

== Trovati guardando le foto ==
«dal Invalid Date» senza data di creazione, il campione del colore invisibile nella riga scelta, il bollino «liv 129» fuori dal riquadro, le virgolette « » del motto che uscivano come «&lt;». Il collaudo ha guadagnato qui <code>--tasti</code> (anche <code>clic@x×y</code>), <code>--peggiori</code> e <code>--misura</code>; il profilo ne ha usate quattro sequenze: le sei pagine, l'acquisto e la faccia chiusa, i clic, i dati peggiori. Icone SVG nuove: trofeo, matita, lucchetto.

{{Vedi anche|Le facce del profilo|Le classifiche|Il libro dei conti|I traguardi|Le app di pzk os}}
[[Categoria:Le app di pzk os]]`,
  },

  'Account (app)': {
    data: '2026-10-29',
    fonti: [OS + 'account.js', 'albertopecchini.it/pzkko/telefono/app/account.js', 'albertopecchini.it/pzkko/games/pzk.js', OS + 'os.js', README],
    testo: `{{Infobox
| titolo = Account (app)
| immagine = app-account.webp
| didascalia = l'account col conto: la pagina del conto, OK sincronizza o esce
| id = account
| file = telefono/zero/os/account.js
| logica = telefono/app/account.js (esporta RISERVATI e descriviMossa), games/pzk.js
| icona = app-account
| sigla = account
| dal = 29 ottobre 2026 (notte)
| serve il conto = no: è lei che lo fa
}}
'''Account''' è l'app del conto: la porta di [[pzk os]], perché senza conto non si entra. È una delle due app <code>LIBERE</code> (con le impostazioni).

{{Citazione|fai app account con stesse serietà|Alberto, 29 ottobre 2026, notte}}

== Senza conto ==
Crea (il nome, la chiave nascosta per i nomi riservati di Alberto, il PIN due volte perché non si recupera) o entra (nome e PIN); dopo, si apre l'app che si voleva (<code>os.dopoAccesso</code>). All'accensione senza conto si apre l'account, e un comando mandato alla chat aspetta il conto. Il conto nuovo parte con 1.000 $pzk ([[Il conto]]).

== Col conto, cinque pagine ==
# il '''conto''' (OK: sincronizza o esci; l'uscita si conferma);
# le '''mosse''' (le ultime, descritte da <code>descriviMossa</code>: le stesse parole dell'app vecchia e del wallet);
# il '''cambio''' (il verso, il cursore 0–100 %, la conferma: [[Gli EUR€]]);
# '''invia''' (l'indirizzo a cifre e il nome di chi è, quanti, la conferma: [[Gli invii]] si aprono 48 ore dopo la nascita del conto);
# '''altro''' (l'indirizzo, che si cambia una volta sola, il PIN vecchio-nuovo-ripetuto, il [[Il regalo di Instagram|regalo di instagram]]).
Mentre si aspetta il server, la rotellina in fondo e nessun doppio invio; l'esito resta in fondo.

== Nuovi in pzk os per lei ==
<code>os.cifre</code> (le caselle per PIN, indirizzi e quantità: ↑ ↓ cambiano la cifra, ← → si spostano), la tastiera <code>nascosto</code>, i titoli troppo lunghi tagliati da soli, <code>os/pezzi.js</code> (i pezzi comuni di profilo e account). Il collaudo: <code>--server-finto</code> (entra col PIN 1234, crea, sincronizza, converti, invia, chi è, PIN, indirizzo), <code>--senzaconto</code>, e i testi più larghi dello schermo. Corretti: la striscia dell'esito negli angoli stondati, il tasso grande che usciva (il centro misurava a scala 1), «invii … dal» senza data, un titolo e una riga troppo lunghi.

== In locale ==
Sul server di prova si è sempre dentro come pzkko (<code>/__dev/accesso</code> di tools/dev.mjs, solo da questo computer o dalla rete Tailscale); <code>?ospite</code> lascia senza conto.

{{Vedi anche|Il conto|I conti|Gli EUR€|Gli invii|Il wallet|Le app di pzk os}}
[[Categoria:Le app di pzk os]]`,
  },

  'Shop (app)': {
    data: '2026-10-29',
    fonti: [OS + 'negozio.js', 'albertopecchini.it/pzkko/telefono/app/negozio.js', 'albertopecchini.it/pzkko/chat/oggetti.js', 'albertopecchini.it/pzkko/chat/mercato.js', README],
    testo: `{{Infobox
| titolo = Shop (app)
| immagine = app-negozio.webp
| didascalia = le offerte del giorno, col conto alla rovescia a mezzanotte
| id = negozio
| file = telefono/zero/os/negozio.js
| logica = telefono/app/negozio.js (esporta prodotti, compraRighe, ORDINI, contoAllaRovescia, le chiavi del carrello e dei preferiti), chat/mercato.js
| icona = app-shop (una bottega con la tenda a righe)
| sigla = negozio
| dal = 29 ottobre 2026 (notte)
| serve il conto = sì
}}
'''Shop''' è [[Lo shop|lo shop]] di pzkko a un bit: i 46 pezzi dei cinque [[I reparti dello shop|reparti]], da comprare coi $pzk puliti.

== Le pagine ==
Le offerte del giorno (col conto alla rovescia a mezzanotte), tutto, i cinque reparti, il carrello. In cima a ogni lista la riga dell'ordine (OK: le opzioni: ordine, «posso comprarli», cerca); scrivendo dalla tastiera si cerca, INDIETRO toglie la ricerca.

== La scheda ==
L'icona grande, il prezzo pieno barrato e quello d'oggi, la descrizione che scorre con ↑ ↓, i [[I bonus|bonus]], i tasti ♥ − + carrello compra (comprare si conferma).

== Il carrello ==
OK su una riga (togli, uno in meno, uno in più), paga (si conferma), svuota. Lo scontrino si stampa riga per riga col ticchettio e la sigla della cassa. Carrello e preferiti hanno le stesse chiavi dell'app vecchia.

== Corretti strada facendo ==
Comprando subito dalla scheda il carrello si svuotava (anche nel vecchio), l'a capo nel testo diventava «?» (<code>txt</code>), l'icona dello shop sembrava un lucchetto, le virgolette « » uscivano come &lt; &gt; (ora hanno il loro glifo). Gli acquisti passano tutti da <code>mercato.compra</code> e, dal 31 ottobre, dalla [[La banca sul server|banca]].

{{Vedi anche|Lo shop|I reparti dello shop|Elenco degli oggetti|I bonus|Le casse|Il gratta e vinci|Le app di pzk os}}
[[Categoria:Le app di pzk os]]`,
  },

  'Pzkstore (app)': {
    data: '2026-10-29',
    fonti: [OS + 'pzkstore.js', 'albertopecchini.it/pzkko/telefono/app/pzkstore.js', OS + 'pezzi.js', README],
    testo: `{{Infobox
| titolo = Pzkstore (app)
| immagine = app-pzkstore.webp
| didascalia = la vetrina: le app con icona, nome, una riga, prezzo o «installata»
| id = pzkstore
| file = telefono/zero/os/pzkstore.js
| logica = telefono/app/pzkstore.js (CATALOGO, l'acquisto, la rimozione)
| icona = app-pzkstore (la freccia verde che scende nella vaschetta, sul rosso)
| sigla = pzkstore (lo scaricamento)
| dal = 29 ottobre 2026 (notte)
| serve il conto = sì
}}
'''Pzkstore''' è [[Il pzkstore|il negozio delle app]] del cercapersone: le due app da comprare, la [[La lavatrice|lavatrice]] (5.000 $pzk puliti) e il [[Il decifratore|decifratore]] (1.500).

== La vetrina e la scheda ==
La vetrina: due righe, le app con icona, nome, una riga, prezzo o «installata», «!» se ti servirebbe, i puliti che hai e gli [[I soldi sporchi|sporchi]] che qui non valgono. La scheda: l'icona grande, genere e versione, lo stato, il testo intero che scorre con ↑ ↓ (cosa fa, in breve, come si usa, cosa serve, le novità, togliere), sotto compra e scarica o apri e togli, tutto confermato. Catalogo, prezzi, acquisto e rimozione sono quelli del pzkstore vecchio: si paga coi puliti alla [[La cassa di pzk|cassa di pzk]], in galera non si compra, si toglie senza rimborso.

== Nuovi in pzk os ==
La sigla «pzkstore», il [[Il menu di pzk os|menu]] che si rifà quando lo zaino cambia (un'app comprata compare subito), e in pezzi.js <code>impagina</code>, <code>scorrevole</code>, <code>bottoni</code> e <code>senzaHtml</code> (il testo lungo va a capo a 37: a destra restano le frecce).

{{Vedi anche|Il pzkstore|Lavatrice (app)|Decifratore (app)|Le app installate|Le app di pzk os}}
[[Categoria:Le app di pzk os]]`,
  },

  'Sfide (app)': {
    data: '2026-10-29',
    fonti: [OS + 'sfide.js', 'albertopecchini.it/pzkko/chat/sfide.js', 'albertopecchini.it/pzkko/telefono/app/sfide.js', README],
    testo: `{{Infobox
| titolo = Sfide (app)
| immagine = app-sfide.webp
| didascalia = i giorni di fila, i tre pallini di oggi, le tre sfide con la barra
| id = sfide
| file = telefono/zero/os/sfide.js
| logica = chat/sfide.js, telefono/app/sfide.js (esporta DOVE e aMezzanotte)
| icona = app-sfide
| sigla = sfide
| dal = 29 ottobre 2026 (notte)
| serve il conto = sì
}}
'''Sfide''' mostra [[Le sfide giornaliere|le tre sfide del giorno]]: in cima i giorni di fila, quante oggi coi tre pallini (pieno fatta, a metà pronta) e fra quanto arrivano le nuove; sotto le tre sfide (icona, difficoltà e cosa fare, la barra, a che punto, il premio) e il bonus del giorno.

OK: «riscuoti» se è pronta (con la moneta), «vai» se no, che apre l'app dove si fa: la [[Chat (app)|chat]] col comando giusto (<code>os.apri(id, { comando })</code>, nato qui), lo [[Shop (app)|shop]], il [[Quiz (app)|quiz]], le [[Quest (app)|quest]]. Il collaudo ha guadagnato <code>conta@statistica@n</code> (lo zaino conta come dopo un'azione vera), per portare le sfide a «pronta».

{{Vedi anche|Le sfide giornaliere|Elenco delle sfide|Il premio giornaliero|Le app di pzk os}}
[[Categoria:Le app di pzk os]]`,
  },

  'Quiz (app)': {
    data: '2026-11-02',
    fonti: [OS + 'quiz.js', 'albertopecchini.it/pzkko/chat/quiz.js', 'albertopecchini.it/pzkko/chat/quiz-dati.js', 'albertopecchini.it/pzkko/chat/immagini.js', README],
    testo: `{{Infobox
| titolo = Quiz (app)
| immagine = app-quiz.webp
| didascalia = l'ingresso: le regole in una riga, le pagate di oggi, il record, gli argomenti
| id = quiz
| file = telefono/zero/os/quiz.js
| logica = chat/quiz.js (le domande le manda la banca, una alla volta, senza la giusta)
| icona = app-quiz
| sigla = quiz
| dal = 29 ottobre 2026; avanza da sola dal 2 novembre
| serve il conto = sì
}}
'''Quiz''' sono [[I quiz|i quiz retributivi]] a pixel: partite da 8 domande su un argomento, 15 secondi l'una.

== Le viste ==
L'ingresso: le regole in una riga, le pagate di oggi, il record, gli [[Elenco degli argomenti dei quiz|argomenti]]. La domanda: a che punto e i pallini, la barra dei 15 secondi che si accorcia e gli ultimi tre che ticchettano, la difficoltà col premio, la serie, il testo, le risposte A–D con ↑ ↓ e OK o coi tasti a–d e 1–4, la scelta lunga che scorre da sola. Risposto: la giusta col ✓ e la tua sbagliata con la x incorniciate, la spiegazione al posto della domanda, il premio in fondo. INDIETRO in partita chiede se lasciare (e il tempo si ferma). Il riepilogo: quante giuste, i pallini, il guadagno, argomenti e ancora.

== Avanza da sola ==
{{Citazione|fai che i quiz avanzino senza premere ogni volta enter|Alberto, 2 novembre 2026}}
La prossima domanda arriva da sola: 2,5 s dopo una giusta, 4,5 s dopo una sbagliata, con una barretta sopra l'esito che si accorcia; OK la chiama subito, il dialogo di INDIETRO ferma anche questa attesa, e dopo l'ultima arriva da solo il riepilogo. Nel collaudo lo prova <code>aspetta@3000</code>.

== Le foto ==
Le [[Le foto vere dei quiz|foto dei quiz]] (Wikimedia, imgur) arrivano a un bit col retino di Bayer e i livelli stirati; se il browser non le lascia leggere, si tira a indovinare. Domande, premi e tetto sono quelli di chat/quiz.js, e dal 31 ottobre le domande stanno sulla [[La banca sul server|banca]]: la risposta giusta non arriva mai al browser prima della risposta. Nel server finto del collaudo la giusta è sempre la prima.

{{Vedi anche|I quiz|Le foto vere dei quiz|Elenco degli argomenti dei quiz|Foto (app)|Le app di pzk os}}
[[Categoria:Le app di pzk os]]`,
  },

  'Quest (app)': {
    data: '2026-10-29',
    fonti: [OS + 'missioni.js', 'albertopecchini.it/pzkko/chat/missioni.js', 'albertopecchini.it/pzkko/chat/missioni-dati.js', 'albertopecchini.it/pzkko/chat/missioni-altre.js', README],
    testo: `{{Infobox
| titolo = Quest (app)
| immagine = app-missioni.webp
| didascalia = l'elenco delle storie: quante finite, ogni storia con icona, nome, stato e una riga
| id = missioni
| file = telefono/zero/os/missioni.js
| logica = chat/missioni.js, chat/missioni-dati.js, chat/missioni-altre.js
| icona = app-quest
| sigla = missioni
| dal = 29 ottobre 2026 (notte)
| serve il conto = sì
}}
'''Quest''' sono [[Le side quest|le tredici side quest]] a bivi, nel cercapersone.

== L'elenco e la storia ==
L'elenco: quante finite, ogni storia con icona, nome, stato e una riga; il lucchetto o la stella sull'icona. La storia in due tempi: il testo a tutto schermo che si scrive da solo in un secondo col ticchettio (OK lo finisce, poi OK le scelte), le scelte una per riga col costo, il rischio o perché non si può, e «lascia la quest» confermato. INDIETRO dalle scelte rilegge, dal testo torna all'elenco (la quest resta in corso). Cosa ha fatto la scelta di prima passa nella striscia; la fine ha il premio su due righe. Una bloccata dice cosa manca e porta allo shop; una che consuma un oggetto lo dice prima di cominciare. Tutto da chat/missioni.js.

{{Vedi anche|Le side quest|Elenco delle side quest|Le app di pzk os}}
[[Categoria:Le app di pzk os]]`,
  },

  'Giocatori (app)': {
    data: '2026-10-29',
    fonti: [OS + 'giocatori.js', 'albertopecchini.it/pzkko/telefono/app/giocatori.js', 'albertopecchini.it/pzkko/chat/db.js', 'albertopecchini.it/pzkko/chat/lumaca-avvisi.js', README],
    testo: `{{Infobox
| titolo = Giocatori (app)
| immagine = app-giocatori.webp
| didascalia = le classifiche: il podio coi numeri rovesciati, la faccia, il nome, il valore
| id = giocatori
| file = telefono/zero/os/giocatori.js
| logica = telefono/app/giocatori.js (esporta fa, giornoBreve, pctTesto, pzkTesto, semeSessione), chat/db.js
| icona = app-giocatori (mancava: nel menu non c'era)
| sigla = giocatori
| dal = 29 ottobre 2026 (notte)
| serve il conto = sì
}}
'''Giocatori''' è [[Il database dei giocatori|il database dei giocatori]] in quattro pagine, più la [[La lumachina|lumachina]].

# le '''classifiche''' (in cima quale, OK le diciassette; il podio coi numeri rovesciati, la faccia, il nome, il valore);
# le '''notizie''' (icona, testo su due righe, quanto fa: [[Le notizie della banca]]);
# '''cerca''' (scrivendo dalla tastiera o OK sulla riga in cima);
# '''io''': l'avviso urgente della lumachina con «ho capito», la sua [[La salute della lumachina|salute]] con la barra, oggi, gli ultimi giorni, il tuo profilo, i rivali, la banca in numeri (scorre con ↑ ↓).
La scheda di un giocatore: la faccia, il titolo, il livello con la barra, i numeri, le classifiche, i leggendari, «manda $pzk» (la chat, comando <code>manda</code>). Ogni pagina dice se il server non risponde. Nuovi: la lente, le barre in <code>impagina</code>, e nel collaudo il database dei giocatori finto (<code>--server-finto</code>).

{{Vedi anche|Il database dei giocatori|Le classifiche|Le notizie della banca|La lumachina|Le app di pzk os}}
[[Categoria:Le app di pzk os]]`,
  },

  'Zaino (app)': {
    data: '2026-10-29',
    fonti: [OS + 'zaino.js', 'albertopecchini.it/pzkko/telefono/app/zaino.js', 'albertopecchini.it/pzkko/chat/zaino.js', README],
    testo: `{{Infobox
| titolo = Zaino (app)
| immagine = app-zaino.webp
| didascalia = il filtro «tutto»: gli effetti in corso in cima, sotto i pezzi con icona, nome e quanti
| id = zaino
| file = telefono/zero/os/zaino.js
| logica = telefono/app/zaino.js (esporta FILTRI, tipoDi, azioniDi, usa, nomeCorto, resto), chat/zaino.js
| icona = app-zaino
| sigla = zaino
| dal = 29 ottobre 2026 (notte)
| serve il conto = sì
}}
'''Zaino''' mostra [[Lo zaino|lo zaino]]: le pagine sono i filtri (tutto, da usare, da tenere, attrezzi, casse, da vendere); in cima gli effetti in corso col tempo che resta e i [[I bonus|bonus]] di adesso, sotto i pezzi con icona, nome e quanti.

La scheda: icona grande, nome, quanti e quanto vale, cosa fa e il bonus (scorre se serve), i tasti usa (si consuma qui, con la sigla dello zaino), gratta, apri, vendi, vendi tutto (la chat), allo shop o compra ancora. Il collaudo ha guadagnato <code>prendi@pezzo@n</code>.

{{Vedi anche|Lo zaino|Elenco degli oggetti|Le casse|I bonus|Le app di pzk os}}
[[Categoria:Le app di pzk os]]`,
  },

  'Miniera (app)': {
    data: '2026-10-29',
    fonti: [OS + 'miniera.js', 'albertopecchini.it/pzkko/telefono/app/miniera.js', 'albertopecchini.it/pzkko/chat/miniera.js', 'albertopecchini.it/pzkko/chat/miniera-dati.mjs', 'albertopecchini.it/pzkko/chat/miniera-pixel.js', README],
    testo: `{{Infobox
| titolo = Miniera (app)
| immagine = app-miniera.webp
| didascalia = la postazione: la scena in piccolo, i maturati con la barra della memoria, produzione, temperatura, hash, resa
| id = miniera
| file = telefono/zero/os/miniera.js
| logica = telefono/app/miniera.js (esporta statsTesto, perOra, montatoDi), chat/miniera.js, chat/miniera-dati.mjs, chat/miniera-pixel.js
| icona = app-miniera
| sigla = miniera
| dal = 29 ottobre 2026 (notte)
| serve il conto = sì
}}
'''Miniera''' è [[La miniera|la miniera]] a un bit: la pixel art di <code>chat/miniera-pixel.js</code> portata a un bit (la luce col retino di Bayer; la scena in negativo, perché è una stanza buia con le cose accese: il colore del muro diventa carta, le luci inchiostro).

== Le pagine ==
La '''postazione''': la scena in piccolo, i maturati che crescono da soli con la barra della memoria, produzione, temperatura, hash, resa; OK incassa (la moneta), ↓ la guardi a schermo intero, senza barra, coi pixel veri del disegno (200 × 125). I '''pezzi''': le dodici categorie col pezzo montato o «manca!»; OK il negozio della categoria (disegno a metà, nome, numeri, prezzo o «ne hai»), la scheda (il disegno 38 × 38, i numeri, se va bene col resto, compra confermato, monta o monta +1, smonta, vendi confermato). I '''[[I PC pronti della miniera|PC pronti]]''': la scheda col disegno, la produzione, il prezzo (il listino barrato) e «compra e monta».

{{Vedi anche|La miniera|Elenco dei pezzi della miniera|I PC pronti della miniera|Le app di pzk os}}
[[Categoria:Le app di pzk os]]`,
  },

  'Foto (app)': {
    data: '2026-10-29',
    fonti: [OS + 'foto.js', OS + 'icone.js', 'albertopecchini.it/pzkko/chat/immagini.js', README],
    testo: `{{Infobox
| titolo = Foto (app)
| immagine = app-foto.webp
| didascalia = la galleria: miniature cinque per riga con la cornice doppia sulla scelta
| id = foto
| file = telefono/zero/os/foto.js
| logica = chat/immagini.js (le 126 foto di Wikimedia e Imgur)
| icona = app-foto
| sigla = foto
| dal = 29 ottobre 2026 (notte)
| serve il conto = sì
}}
'''Foto''' sono [[Le foto vere dei quiz|le 126 foto vere dei quiz]] da guardare: la galleria con le miniature cinque per riga e la cornice doppia sulla scelta, le frecce si muovono e la riga scorre, sotto cosa è. La foto: a tutto schermo senza la barra (dentro le punte stondate), sotto cosa è e il credito; ← → la prima e la dopo (anche il clic sui lati), OK o INDIETRO tornano.

Il caricamento a un bit sta in <code>icone.foto</code> (lo usa anche il [[Quiz (app)|quiz]]) e fa la diffusione dell'errore (Floyd–Steinberg a serpentina): sulle foto più dettaglio del retino di Bayer, che faceva la griglia. Una foto che il browser non lascia leggere ha il punto di domanda.

{{Vedi anche|Le foto vere dei quiz|Elenco delle foto dei quiz|Wikimedia Commons|Le app di pzk os}}
[[Categoria:Le app di pzk os]]`,
  },

  'Virtual (app)': {
    data: '2026-10-29',
    fonti: [OS + 'virtual.js', 'albertopecchini.it/pzkko/games/virtual/partita.js', 'albertopecchini.it/pzkko/games/virtual/schedina.js', 'albertopecchini.it/pzkko/games/virtual/schermo.js', README],
    testo: `{{Infobox
| titolo = Virtual (app)
| immagine = app-virtual.webp
| didascalia = la partita: lo schermino a metà, il tabellone, la voce
| id = virtual
| file = telefono/zero/os/virtual.js
| logica = games/virtual/partita.js, schedina.js, schermo.js
| icona = app-virtual
| sigla = virtual (e virtual-fischio, virtual-gol, virtual-palo, virtual-fiche, virtual-vinta)
| dal = 23 ottobre 2026 (nel nero); 29 ottobre nello zero
| serve il conto = sì
}}
'''Virtual''' è [[Virtual|il campionato virtuale]] nel cercapersone: la stessa partita del gioco grande (<code>partita.js</code>, il [[Il calendario di virtual|ciclo di cinque minuti]] deciso dall'orario) e la stessa [[La schedina|schedina]].

== Lo schermino a un bit ==
[[Lo schermino di virtual|Lo schermino]] è quello del gioco (<code>schermo.js</code>) con le due primitive, il pixel e il rettangolo, che scrivono la luce in un buffer (<code>lumi</code>); poi la luce diventa trama a un bit. In campo la resa si adatta al fotogramma: le due luci più frequenti sono l'erba, a puntini radi, il più scuro pieno, il più chiaro carta (di notte e con la pioggia gli omini non spariscono più).

== Tre pagine ==
La partita (lo schermino a metà, il tabellone, la voce; ↓ a schermo intero, senza barra, dieci fotogrammi al secondo), le [[Le quote di virtual|quote]] (la fiche, 1 X 2 e gli over/under, si punta nei quattro minuti prima del fischio) e la schedina. Finita la partita la schedina paga e lo dice, coi suoni del gioco. Le due interfacce, la finestra grande e l'app, si avvisano a vicenda (<code>ascolta</code>).

{{Vedi anche|Virtual|La schedina|Lo schermino di virtual|Le squadre di virtual|Le app di pzk os}}
[[Categoria:Le app di pzk os]]`,
  },

  'Banca (app)': {
    data: '2026-10-29',
    fonti: [OS + 'banca.js', 'albertopecchini.it/pzkko/games/pzk.js', 'albertopecchini.it/pzkko/api/borsa.mjs', OS + 'font.js', README],
    testo: `{{Infobox
| titolo = Banca (app)
| immagine = app-banca.webp
| didascalia = il portafoglio: i $pzk a sette segmenti, gli euro che valgono, gli EUR€, la targhetta
| id = banca
| file = telefono/zero/os/banca.js
| logica = games/pzk.js, api/borsa.mjs
| icona = app-banca
| sigla = banca
| dal = 29 ottobre 2026 (notte)
| serve il conto = sì
}}
'''Banca''' è [[Il wallet|il wallet]] della home a un bit («in portafoglio solo saldo e borsa»). Sullo zero non apre più il wallet: <code>telefono.js</code> fa l'<code>azione</code> di un'app solo se pzk os non ha la sua.

== Tre pagine ==
Il '''portafoglio''': i $pzk liberi a sette segmenti come i led del wallet (i segmenti spenti a puntini sottili), gli euro che valgono, i sporchi e quelli sul tavolo, gli [[Gli EUR€|EUR€]] e la targhetta con l'indirizzo. Aprendo si fa la prova dei segmenti, e quando il saldo cambia le cifre corrono fino al numero nuovo con la moneta. OK porta all'[[Account (app)|account]]. La '''[[La borsa|borsa]]''' (api/borsa.mjs): il [[Il cambio PZK/EUR€|cambio]] grande, la variazione del periodo, la linea che si disegna da sinistra con l'area a puntini, l'apertura tratteggiata e l'ultimo punto che lampeggia. ↑ ↓ cambiano il periodo, che si ricorda insieme al pomello del wallet. OK, o il clic sul grafico, accende il cursore: ← → lo spostano e in cima c'è il cambio di quel momento. I '''numeri''': il cambio e l'inverso, le variazioni, i $pzk in giro, quanto valgono e su quanti conti. Senza rete dice che la borsa è chiusa.

Il carattere ha preso ▲ ▼ ≈ per lei, e il collaudo col <code>--server-finto</code> ha anche una borsa finta.

{{Vedi anche|Il wallet|La borsa|Il cambio PZK/EUR€|Gli EUR€|Le app di pzk os}}
[[Categoria:Le app di pzk os]]`,
  },

  'Rapina (app)': {
    data: '2026-10-29',
    fonti: [OS + 'rapina.js', 'albertopecchini.it/pzkko/telefono/app/rapina.js', 'albertopecchini.it/pzkko/api/wallet.mjs', README],
    testo: `{{Infobox
| titolo = Rapina (app)
| immagine = app-rapina.webp
| didascalia = la cassa: quanto c'è dentro, organizza o entra col codice
| id = rapina
| file = telefono/zero/os/rapina.js
| logica = telefono/app/rapina.js (esporta le probabilità, il bottino a testa, la cauzione e le ore di galera), api/wallet.mjs
| icona = app-rapina (più il sacco e la sirena)
| sigla = rapina (e rapina-colpo, rapina-sirena)
| dal = 29 ottobre 2026 (notte)
| serve il conto = sì, di almeno 48 ore
}}
'''Rapina''' è [[La rapina|il colpo alla cassa di pzk]], con le regole del server. La prima pagina cambia secondo com'è messo il colpo.

* La '''cassa''': quanto c'è dentro, organizza o entra col codice (quattro lettere dalla tastiera).
* Il '''colpo aperto''': il codice grande, i secondi che corrono, la banda con la riuscita; chi organizza ha «via!» con la conferma. Lo stato si chiede ogni tre secondi.
* Il '''via''': la cassaforte che si scassina per un secondo (un tasto la salta).
* '''Riuscito''': il sacco che salta, la quota e il bottino, la [[Lavatrice (app)|lavatrice]] o la sua scheda nel pzkstore.
* '''Presi''': il lampeggiante, poi la cella con le sbarre che si scuotono, quando esci e la [[La cauzione|cauzione]]. In [[La galera|galera]] l'app è la cella.
Con un colpo aperto ← → scelgono i tasti, e allora la pagina delle regole sparisce dalla testata, così ◀ ▶ non mentono. L'esito già visto si ricorda per conto: il server ridà l'ultimo colpo per due ore, e «va bene» prima lo rifaceva vedere (anche nell'app vecchia). Nel collaudo: <code>--server-finto --rapina=presi</code> e <code>--rapina=galera</code>.

{{Vedi anche|La rapina|La galera|La cauzione|I soldi sporchi|La cassa di pzk|Le app di pzk os}}
[[Categoria:Le app di pzk os]]`,
  },

  'Lavatrice (app)': {
    data: '2026-11-01',
    fonti: [OS + 'lavatrice.js', 'albertopecchini.it/pzkko/telefono/app/lavatrice.js', README],
    testo: `{{Infobox
| titolo = Lavatrice (app)
| immagine = app-lavatrice.webp
| didascalia = la macchina ferma a sinistra, a destra quanto lavare, la commissione, i puliti di dopo
| id = lavatrice
| file = telefono/zero/os/lavatrice.js
| logica = telefono/app/lavatrice.js, le regole della banca (azione lava)
| icona = app-lavatrice
| sigla = lavatrice (e lavatrice-pronta)
| dal = 1 novembre 2026
| serve il conto = sì, e l'app comprata nel pzkstore (5.000 $pzk puliti)
}}
'''Lavatrice''' è [[La lavatrice|la lavatrice dei soldi sporchi]] in pzk os. Alberto ha detto «sì» a rifarla dopo che il [[Il cercapersone nero|cercapersone nero]] se n'era andato con la sua (commit <code>f46c118</code>).

== Com'è ==
Le regole della banca: al più 50.000 a lavaggio, 2.000 puliti di commissione, dieci minuti, una alla volta, in galera non parte. A sinistra la macchina disegnata, e nell'oblò quello che succede: il sacco degli sporchi, il cestello che gira con l'acqua (due volte al secondo, e la macchina che vibra), la moneta pronta, il lucchetto della galera. A destra, ferma: quanto lavare (di serie il massimo; ↑ ↓, o il clic su ▲ ▼, di 5.000 in 5.000), la commissione e quanto pesa, i puliti di dopo, gli sporchi che restano coi lavaggi che servono, l'avviso se si lava meno della commissione, «lava» con la conferma. Gira: quanto manca, la barra, a che ora è pronta (si può chiudere: lava da sola). Pronta: i tre bip di fine lavaggio se finisce mentre la guardi, e «ritira». Senza sporchi, senza i 2.000 puliti o in galera dice perché. Le altre pagine: la storia dei soldi sporchi (rapine, commissioni, lavaggi, puliti dal tempo) e come funziona.

Il collaudo: <code>--server-finto --economia</code> (<code>--lavaggio=gira</code> o <code>=pronto</code>, <code>--economia=vuota</code>, <code>=poveri</code>).

{{Vedi anche|La lavatrice|I soldi sporchi|Il pzkstore|Rapina (app)|Le app di pzk os}}
[[Categoria:Le app di pzk os]]`,
  },

  'Decifratore (app)': {
    data: '2026-11-01',
    fonti: [OS + 'decifratore.js', 'albertopecchini.it/pzkko/telefono/app/decifratore.js', README],
    testo: `{{Infobox
| titolo = Decifratore (app)
| immagine = app-decifratore.webp
| didascalia = la lista: quanti aperti oggi, i wallet e le chiavette nello zaino
| id = decifratore
| file = telefono/zero/os/decifratore.js
| logica = telefono/app/decifratore.js, la banca (decifratore.apri, decifratore.risolvi, azione decifra)
| icona = app-decifratore (più wallet-pzk e chiavetta)
| sigla = decifratore (e decifratore-giusto, -aperto, -bloccato)
| dal = 1 novembre 2026
| serve il conto = sì, e l'app comprata nel pzkstore (1.500 $pzk puliti)
}}
'''Decifratore''' è [[Il decifratore|il decifratore]] dei wallet pzk e delle chiavette che lo [[Lo spazzino di uffici|spazzino di uffici]] trova. I codici li prepara la banca e la banca paga (tre al giorno).

La lista: quanti se ne sono aperti oggi (tre caselle), i wallet e le chiavette nello zaino con quanto c'è dentro; senza pezzi dice che li trova lo spazzino. OK apre il codice: il pezzo, a che codice sei, le vite (♥), la domanda (le parole stanno in <code>DOMANDE</code>, testo semplice e non più html), il codice grande nel riquadro, le quattro risposte in due file, che la croce sceglie (anche col clic). Giusta: il prossimo; sbagliata: un altro codice e una vita in meno; al terzo errore il lucchetto chiuso, «bloccato» (il pezzo resta nello zaino). Risolti tutti e tre: la moneta che salta e i $pzk puliti. I giochini: il cifrario di Cesare, il binario, la sequenza, la parola allo specchio. Nel server finto la risposta giusta è sempre la prima.

{{Vedi anche|Il decifratore|Lo spazzino di uffici|I portafogli smarriti|Il pzkstore|Le app di pzk os}}
[[Categoria:Le app di pzk os]]`,
  },

  'Bin·hex (app)': {
    data: '2026-10-29',
    fonti: [OS + 'conversioni.js', 'albertopecchini.it/pzkko/telefono/app/conversioni.js', README],
    testo: `{{Infobox
| titolo = Bin·hex (app)
| immagine = app-conversioni.webp
| didascalia = il numero, la base, i bit e i risultati nelle altre basi
| id = conversioni
| file = telefono/zero/os/conversioni.js
| logica = telefono/app/conversioni.js (BigInt, la parte dopo la virgola, il complemento a 2, «come si fa» fatto di dati)
| icona = app-conversioni
| sigla = conversioni
| dal = 29 ottobre 2026 (notte)
| serve il conto = sì
}}
'''Bin·hex''' sono [[Le conversioni fra basi|le conversioni fra le basi]] coi conti dell'app vecchia: un numero in decimale, binario, ottale o esadecimale e subito nelle altre basi, grande quanto si vuole (BigInt), con la virgola (frazioni esatte: i periodici finiscono coi «…»), il complemento a 2 su 8/16/32/64 bit.

Le righe, in tondo con ↑ ↓: il numero (OK la tastiera, o la tastiera vera; il cursore lampeggia), la base in cui è scritto e i bit (◀ ▶ sul valore, anche col clic), i risultati che si riscrivono da sinistra quando il numero cambia (OK lo vedi intero, e lì OK lo copia), e «come si fa verso». I passaggi: le divisioni coi resti, le potenze o i gruppi di bit, in colonne allineate, l'esito in una fascia; ← → cambiano la base d'arrivo, coi pallini in testata. «Come si fa» ora è fatto di dati (<code>passi</code>: testi, tabelle, l'esito) che l'app vecchia trasforma in html come prima (uguale su 56 casi provati) e pzk os in righe.

{{Vedi anche|Le conversioni fra basi|Calcoli (app)|Le app di pzk os}}
[[Categoria:Le app di pzk os]]`,
  },

  'Calcoli (app)': {
    data: '2026-10-29',
    fonti: [OS + 'calcolatrice.js', 'albertopecchini.it/pzkko/telefono/app/calcolatrice.js', OS + 'os.js', OS + 'font.js', README],
    testo: `{{Infobox
| titolo = Calcoli (app)
| immagine = app-calcolatrice.webp
| didascalia = il calcolo: l'espressione, il risultato mentre scrivi, gon gradi o radianti
| id = calcolatrice
| file = telefono/zero/os/calcolatrice.js
| logica = telefono/app/calcolatrice.js (esporta l'espressione, registra, i triangoli, polari, fraDue, gauss, leggiAngolo)
| icona = app-calcolatrice
| sigla = calcolatrice
| dal = 29 ottobre 2026 (notte)
| serve il conto = sì
}}
'''Calcoli''' è [[La calcolatrice del geometra|la scientifica del geometra]]: la stessa calcolatrice con due facce, la scheda aperta si ricorda per tutte e due.

== Quattro pagine ==
Il '''calcolo''': l'espressione, il risultato mentre scrivi, gon, gradi o radianti, gli ultimi da riprendere; OK, o scrivere dalla tastiera vera, apre il tastierino coi 34 tasti della vecchia, dove Invio è l'uguale. I '''triangoli''': tre dati, e a destra il triangolo vero quando si chiude, col pezzo scelto segnato; il risultato coi passaggi e la seconda soluzione (Carnot, i seni, Erone, il caso ambiguo). Le '''coordinate''': da A con distanza e azimut a B, fra due punti, l'area di Gauss coi vertici uno per uno. Gli '''angoli''': le quattro misure (sessagesimali, sessadecimali, centesimali, radianti) e il goniometro che lo disegna.

Nuovi in pzk os per lei: <code>os.numero</code>, il tastierino dei numeri (il meno, la virgola, e per gli angoli ° ′ ″), perché la tastiera di lettere non ha né il meno né la virgola; e nel carattere √ π α β γ ² ³ ½ Δ θ ∞ ± ÷ Σ.

{{Vedi anche|La calcolatrice del geometra|Bin·hex (app)|Le app di pzk os}}
[[Categoria:Le app di pzk os]]`,
  },

  'Codice C (app)': {
    data: '2026-10-29',
    fonti: [OS + 'compilatore.js', 'albertopecchini.it/pzkko/telefono/app/compilatore.js', README],
    testo: `{{Infobox
| titolo = Codice C (app)
| immagine = app-compilatore.webp
| didascalia = l'editor coi numeri di riga e il cursore che lampeggia
| id = compilatore
| file = telefono/zero/os/compilatore.js
| logica = telefono/app/compilatore.js (esporta compila e gli esempi)
| icona = app-compilatore
| sigla = compilatore
| dal = 29 ottobre 2026 (notte)
| serve il conto = sì
}}
'''Codice C''' è [[Il compilatore C|il compilatore C]] vero nel cercapersone: GCC 14.2 su [[Compiler Explorer]], e Wandbox se il primo non risponde; il codice e l'input sono lo stesso stato dell'app vecchia.

Una vista sola, perché ← → muovono il cursore: l'editor coi numeri di riga, il cursore che lampeggia, le righe con un errore col numero rovesciato, e dalla tastiera vera Invio va a capo tenendo il rientro, la graffa chiusa torna indietro, Backspace cancella. OK apre il menu: esegui, scrivi qui, a capo, cancella, l'input per scanf, l'ultimo output, gli esempi. L'output: mentre compila la rotellina e i punti che corrono, poi gli avvisi rovesciati, quello che ha stampato, il codice d'uscita, i secondi e dove; OK lo rifà. Provato davvero: «ciao alberto, benvenuto su pzkko!».

Nuovi: la tastiera di sistema con <code>simboli: true</code> (graffe, parentesi, punto e virgola, operatori), Ctrl+Invio sullo zero è il tasto OK (prima la tastiera vera lo ignorava), e nel collaudo il token <code>okvero</code>. Il codice esce dal sito: la pagina avvisa di non scriverci password ([[Cosa si salva]]).

{{Vedi anche|Il compilatore C|Compiler Explorer|Cascadia Code|Le app di pzk os}}
[[Categoria:Le app di pzk os]]`,
  },

  'Cucina (app)': {
    data: '2026-10-29',
    fonti: [OS + 'cucina.js', 'albertopecchini.it/pzkko/telefono/app/cucina.js', README],
    testo: `{{Infobox
| titolo = Cucina (app)
| immagine = app-cucina.webp
| didascalia = le ricette, con la nonna nel fumetto
| id = cucina
| file = telefono/zero/os/cucina.js
| logica = telefono/app/cucina.js (esporta anche chiudi: i $pzk, gli xp, il piatto nello zaino e il record)
| icona = app-cucina (più la nonna: la crocchia, gli occhiali, il sorriso)
| sigla = cucina
| dal = 29 ottobre 2026 (notte)
| serve il conto = sì
}}
'''Cucina''' sono [[La cucina|le ricette del Mincio alla Cooking Mama]] coi [[I sei tasti|sei tasti]]: tortelli di zucca, risotto alla pilota, sbrisolona, luccio in salsa, con la nonna che commenta nel fumetto.

I sei minigiochi sono rifatti per i tasti, con la barra del tempo e il clic che fa OK. '''Taglia''': OK quando il coltello è sulla riga. '''Ordina''': ← → e OK, quelli già nella pentola col ✓ e la scelta che salta al prossimo. '''Mescola''': → ↓ ← ↑ in giro, col mestolo che segue (o il clic sui quarti). '''Impasta''': OK più in fretta che puoi. '''Versa''': OK apre il sacco e OK lo chiude (la vecchia si teneva premuta, e le regole non vogliono tasti tenuti), il getto che scende e la fascia segnata anche fuori dal bicchiere. '''Cuoci''': OK ferma la lancetta. Il voto lampeggia, la fine dà medaglia, record e premi, e «rifalla» o «le ricette». Le prime tre ricette del giorno con una medaglia pagano $pzk e xp, l'oro dà il piatto vero una volta al giorno.

{{Vedi anche|La cucina|I traguardi|Le app di pzk os}}
[[Categoria:Le app di pzk os]]`,
  },

  'Impostazioni (app)': {
    data: '2026-10-31',
    fonti: [OS + 'impostazioni.js', OS + 'lcd.js', 'albertopecchini.it/pzkko/suono/interfaccia.js', README],
    testo: `{{Infobox
| titolo = Impostazioni (app)
| immagine = app-impostazioni.webp
| didascalia = le impostazioni: luminosità, suoni, led rosso, inclinazione, la guida, il cercapersone, di fabbrica
| id = impostazioni
| file = telefono/zero/os/impostazioni.js
| icona = app-impostazioni
| sigla = impostazioni (in suono/interfaccia.js: prima si aprivano mute)
| dal = 29 ottobre 2026; riviste il 31
| serve il conto = no (è in LIBERE)
| salva in = localStorage pzkko-zero-impostazioni
}}
'''Impostazioni''' è l'ultima voce del [[Il menu di pzk os|menu]], una delle due app che si aprono senza conto.

{{Citazione|fai impostazioni per regolare la luminosità, i suoni, il led rosso|Alberto, 29 ottobre 2026}}

== Le righe ==
'''Luminosità''' (cinque tacche: la luce massima dell'[[L'lcd|lcd]], <code>lcd.regola</code>; con OK gira in tondo, prima al massimo si fermava), '''suoni''' (lo stesso interruttore del sito, <code>pzkko-suono</code>: spegne tutto da sé, e accendendoli si sente un bip di conferma), '''[[Il led rosso|led rosso]]''' (spento resta spento anche sul muro), '''[[L'inclinazione col mouse|inclina col mouse]]''', '''rivedi la [[La guida di pzk os|guida]]'''. Dal 31 ottobre due righe nuove: '''il cercapersone''' (modello, sistema, schermo, tasti, il conto, la luminosità e i suoni di adesso) e '''come di fabbrica''' (con la conferma rimette luminosità, led e inclinazione, e la riga lampeggia; i suoni restano, perché sono l'interruttore di tutto il sito). Riviste anche la testata e il suggerimento in fondo (prima non dicevano quali tasti premere) e il › sulle righe che aprono qualcosa. Chi usa le impostazioni si mette in ascolto.

Il primo collaudo ha trovato il ▶ scritto fuori dalla fascia scura (invisibile, arancione su arancione): da lì la regola 4.4.

{{Vedi anche|pzk os|L'lcd|Il led rosso|L'inclinazione col mouse|Il nastro suono|Le app di pzk os}}
[[Categoria:Le app di pzk os]]`,
  },
}
