// Le pagine di servizio di pzkkopedia (2.11): la Pagina principale e i suoi riquadri, le pagine Aiuto:, Pzkkopedia:, i
// Portali e le descrizioni delle Categorie. Il formato e i titoli canonici: tools/pzkko/wiki/README.md.
const F = ['albertopecchini.it/pzkko/wiki/wiki.js', 'albertopecchini.it/pzkko/wiki/voci.js', 'albertopecchini.it/tools/pzkko/wiki/README.md']
const F_AGG = ['albertopecchini.it/tools/pzkko/wiki/aggiorna.mjs', 'albertopecchini.it/tools/pzkko/wiki/controlla.mjs', 'albertopecchini.it/tools/pzkko/wiki/genera.mjs', 'albertopecchini.it/tools/pzkko/wiki/foto.mjs', 'CLAUDE.md', '.github/workflows/build.yml']
const D = '2026-11-02'

export const VOCI = {
  'Pagina principale/Benvenuti': { data: D, fonti: F, testo: `'''pzkkopedia''' è l’enciclopedia di [[pzkko.it]]: una voce per ogni cosa del [[Il muro|muro]], della [[La scena 3D|scena 3D]], dei [[I giochi|giochi]], dei [[I $pzk|$pzk]], del [[Il cercapersone zero|cercapersone zero]] e delle sue [[Le app di pzk os|app]], della [[La chat col bot|chat col bot]], di quello che si compra, si pesca e si scava, degli [[Gli strumenti di pzkko|strumenti]], del [[Il repository AP|repository]] e dei suoi commit, del [[Il server dei dati in casa|server in casa]], degli [[Gli strumenti di albertopecchini.it|altri siti e strumenti]] di [[Alberto Pecchini]], e della [[La memoria di Claude|memoria di Claude]] che lo aiuta a farli. Tutto collegato: ogni link porta a una voce, ogni voce dice da quali file del repository nasce e quali commit li hanno toccati.

Si scrive nel repository, non qui ([[Pzkkopedia:Come si aggiorna|come si aggiorna]]): la regola di Alberto del 2.11.2026 è che '''a ogni push la wiki si aggiorna'''.` },
  'Pagina principale/Voce in vetrina': { data: D, fonti: F, testo: `[[File:zero-aperto.webp|thumb|left|180px|il cercapersone zero aperto, col cavo che entra]]
'''[[Il cercapersone zero]]''' è il mockup 3D del 29.10.2026, bianco coi tasti arancioni, con dentro [[pzk os]]: un lcd di 256 × 128 pixel a un bit sotto il vetro trasparente del modello, 22 app riscritte a 8 bit, i sei tasti del Flipper che si premono davvero col mouse e con la tastiera, il led rosso che sfarfalla come la spia del disco, il cavo da 60 cm che entra nella porta usb-c quando il computer è in carica. Dal 1.11 è il cercapersone di tutti: [[Chiocciola zero|versione 4.0.0 «chiocciola zero»]]. Le [[Le regole per le app|regole per le app]] e il [[Il collaudo delle app|collaudo]] che preme tutti i tasti e guarda ogni foto dell’lcd sono il modo in cui Alberto e Claude lo fanno senza bug.

<span class="pulisci"></span>''Altre voci da leggere:'' [[La scena 3D]] · [[Il caricamento è il pomodoro]] · [[La petizione]] · [[La lumachina]] · [[I lotti numerati]] · [[La banca sul server]] · [[Il lettore DWG]]` },
  'Pagina principale/Lo sapevi che': { data: D, fonti: F, testo: `* …che la saracinesca di pzkko è [[La saracinesca di Bologna|quella vera della Coin di via Rizzoli]], fotografata il 22 settembre 2024 alle 12:28 con un iPhone 16 Pro che aveva due giorni?
* …che la lamiera è l’unica foto vera del muro, e [[L'insegna|l’insegna]], l’[[Le lettere dell'insegna|intonaco e le lettere]] sono disegnati in SVG?
* …che le [[Le lettere dell'insegna|lettere «pzkko»]] della scena 3D sono quelle della «coin» vera, misurate dalla foto a piena risoluzione, con il tubo al neon da 13 mm dentro?
* …che il [[Il PC con Ubuntu|PC dietro il vetro]] si pianta e si riavvia in loop ogni 25 secondi, kernel panic compreso, e nessuno lo dice?
* …che la [[La moneta|moneta]] d’ottone ha un mezzo giro a caso del pollice perché la fisica da sola faceva uscire l’opposta il 52,2 % delle volte?
* …che la [[La lumachina|lumachina]] del tuo conto decide ogni giorno da sola cosa fare coi tuoi $pzk, e non ci si può fare niente?
* …che un telefono vede la vincita fatta dal pc dopo [[Il canale diretto|19 millisecondi]]?
* …che i [[I soldi sporchi|soldi sporchi]] delle rapine si puliscono da soli dopo 96 giorni, o in dieci minuti nella [[La lavatrice|lavatrice]] da 5.000 $pzk?
* …che il [[Il meteo|meteo]] della scena è quello vero di Mantova, chiesto a Open-Meteo una volta ogni dieci minuti per tutti?
* …che le [[Le campane|campane]] suonano solo se il tempo passa da sé, e che i grilli d’estate cantano al ritmo della temperatura vera (7·T − 30 cri al minuto)?
* …che il [[Il lettore DWG|lettore DWG]] di albertopecchini.it è scritto da zero, senza librerie, e disegna le tavole con la scheda grafica in 3 ms?
* …che [[Vercel Blob]] si è bloccato la notte del 28.10 e da allora i dati di pzkko stanno sul [[Il server dei dati in casa|pc di Alberto]], dietro un tunnel?` },
  'Pagina principale/Ricorrenze': { data: D, fonti: F, testo: `* '''24 maggio 2026''': il primo commit del [[Il repository AP|repository AP]] («Initial commit», poi «Add files from Figma Make»).
* '''22 settembre 2024''': le tre foto della [[La saracinesca di Bologna|saracinesca di Bologna]], a mezzogiorno e mezzo.
* '''17 settembre 2026''': «fine.» e «hello»: il [[Il sito precedente (React)|sito React]] azzerato, il giorno dopo il [[albertopecchini.it|portfolio statico]].
* '''7 ottobre 2026''': nasce pzkko.it, prima [[Il portafoglio MagSafe|portafoglio MagSafe]] (bocciato), poi [[La scrivania di pzkko|scrivania]].
* '''9 ottobre 2026''': [[Il muro (versione 2.0)|il muro]], la saracinesca coi volantini.
* '''18 ottobre 2026''': la [[La scena 3D|scena 3D]], «la home diventa un posto vero».
* '''22 ottobre 2026''': la [[La petizione|petizione]], il [[Il wallet|wallet]] e la [[La borsa|borsa]], la [[La chat col bot|chat col bot]].
* '''23 ottobre 2026''': [[Lumaca catodica|versione 3.0 «lumaca catodica»]].
* '''26 ottobre 2026''': la [[La barra in alto|barra]], la wiki vuota, i traguardi, la musica.
* '''28 ottobre 2026''': [[Vercel Blob]] bloccato; il [[Il server dei dati in casa|server in casa]].
* '''29 ottobre 2026''': il [[Il cercapersone zero|cercapersone zero]] e i [[I lotti numerati|lotti numerati]].
* '''31 ottobre 2026''': la [[La banca sul server|banca sul server]]: «il browser non decide più niente».
* '''1 novembre 2026''': [[Chiocciola zero|versione 4.0.0 «chiocciola zero»]].
* '''2 novembre 2026''': pzkkopedia si riempie.` },
  'Pagina principale/Eventi correnti': { data: D, fonti: F, testo: `* pzkko.it è alla {{Versione|4.0.0|chiocciola zero|1.11.2026}} ed è ancora [[La beta|in beta]]: le cose cambiano spesso.
* Il 2.11 nel cercapersone zero sono arrivati la [[Lavatrice (app)|lavatrice]] e il [[Decifratore (app)|decifratore]], e l’apertura col 3D non blocca più il sito (da 5,8 s di pagina ferma a 60 ms).
* In lavorazione il 2.11: i [[I consigliati|consigliati]] della chat e il [[Quiz (app)|quiz]] che passa da solo alla domanda dopo.
* Il [[Il server dei dati in casa|server in casa]] fa anche da [[La banca sul server|banca]]: le regole dei giochi esistono in due copie (il repo per disegnare, il server per decidere) e vanno cambiate insieme.
* Il dominio dell’[[Ing. Dario Donelli|ing. Dario Donelli]] aspetta ancora: il suo volantino sul muro dice «presto online».` },
  'Pagina principale/Nelle altre lingue': { data: D, fonti: F, testo: `pzkkopedia esiste in una lingua sola: l’italiano in minuscolo di [[pzkko.it]]. La versione inglese del 2008 è [[Better Call Pekko]] (bettercallpekko.it), dove [[Alberto Pecchini|Alberto]] si chiama [[Pekko]] e «SI PARLA ITALIANO» è l’unica riga in italiano; quella seria è [[albertopecchini.it]]. Le pagine di «Better Call Pekko» hanno i «video di consulenza», il forum phpBB e il listino 2009, non una wiki.` },
  'Pagina principale/Portali': { data: D, fonti: F, testo: `* [[Portale:Il muro|Il muro]]: la home, i volantini, la sera, le pagine della barra, le versioni.
* [[Portale:La scena 3D|La scena 3D]]: il posto, le luci, il meteo, le bestie, il suono, la regia.
* [[Portale:I giochi|I giochi]]: roulette, blackjack, mine, dado, moneta, virtual.
* [[Portale:I soldi|I soldi]]: i $pzk, il wallet, la borsa, i conti, l’economia, la banca.
* [[Portale:Il cercapersone|Il cercapersone]]: lo zero, pzk os, le app, la chat col bot.
* [[Portale:Gli strumenti|Gli strumenti]]: quelli di pzkko e quelli di albertopecchini.it.
* [[Portale:Il repository|Il repository]]: AP, i rami, i workflow, Vercel, il server in casa.
* [[Portale:La memoria di Claude|La memoria di Claude]]: le memorie, CLAUDE.md, le skill, come lavora Alberto con Claude.` },
  'Pagina principale/Progetti fratelli': { data: D, fonti: F, testo: `* [[albertopecchini.it]]: il portfolio di Alberto, statico e senza framework, con le tavole vere e il lettore DWG.
* [[Better Call Pekko]]: l’assistenza informatica come un sito americano del 2008.
* [[rivaltasulmincio.it]]: il sito della Pro Loco di Rivalta sul Mincio.
* [[cascinafontana.xyz]]: la società agricola di famiglia.
* [[Ing. Dario Donelli]]: il sito dell’ingegnere, in attesa del dominio.
* [[Il repository AP]] su GitHub, dove vivono tutti e tre i siti e questa wiki.` },

  // ---------------------------------------------------------------------------------------------------- aiuto
  'Aiuto:Aiuto': { data: D, fonti: F, testo: `'''Come si usa pzkkopedia.'''

== Leggere ==
* La '''ricerca''' in alto cerca nei titoli e nel testo; scrivendo il titolo esatto si apre la voce. Una voce a caso: nel menu.
* Ogni voce ha l’'''indice''' a sinistra (sul telefono, in cima), le '''linguette''' Leggi / Modifica / Cronologia, e sotto «Strumenti» le pagine che puntano qui, le modifiche correlate, le informazioni e il testo su GitHub.
* I '''link blu''' portano a una voce che c’è; i '''rossi''' a una che manca (sono elencati in [[Speciale:LinkRossi|Pagine richieste]]).
* Le '''categorie''' stanno in fondo a ogni voce e in [[Speciale:Categorie]]; i '''portali''' nel menu raggruppano le voci per area.
* La '''cronologia''' di una voce sono i commit veri del repository che hanno toccato i suoi file (le «fonti», in fondo alla pagina).
* Le '''immagini''' si aprono nel visore a tutto schermo (le frecce o ← → passano alle altre immagini della pagina, Esc chiude); da lì «Pagina del file» porta alla pagina «File:», che dice da dove viene l’immagine e chi la usa ([[Speciale:Immagini|Elenco dei file]]).

== Scrivere ==
Le voci non si salvano dal browser: stanno nel repository, in <code>albertopecchini.it/pzkko/wiki/voci/*.js</code>. Vedi [[Aiuto:Modificare una pagina]] e [[Aiuto:Wikitesto]], e [[Pzkkopedia:Come si aggiorna]] per la regola del push.

{{Vedi anche|Pzkkopedia:Informazioni|Pzkkopedia}}
[[Categoria:Pzkkopedia]]` },
  'Aiuto:Modificare una pagina': { data: D, fonti: F, testo: `'''Le voci di pzkkopedia si scrivono nel repository''' [[Il repository AP|AP]], non nel browser: la linguetta «Modifica» mostra l’editor e l’anteprima per provare, ma «Salva pagina» non salva.

== Dove ==
Una voce è una proprietà dell’oggetto <code>VOCI</code> in uno dei moduli di <code>albertopecchini.it/pzkko/wiki/voci/</code>: <code>sito.js</code> (il muro), <code>scena.js</code> (la scena 3D e il suono), <code>giochi.js</code>, <code>cercapersone.js</code> (lo zero e le app), <code>chat.js</code> (la chat e l’economia), <code>dietro.js</code> (repository, server, siti, strumenti), <code>memoria.js</code> (la memoria di Claude, le persone, i luoghi), <code>principale.js</code> (queste pagine). <code>dati.js</code> e <code>cronologia.js</code> sono generati: non si toccano.

== Come ==
<code>'Titolo': { data: 'AAAA-MM-GG', fonti: ['albertopecchini.it/pzkko/…'], testo: '…wikitesto…' }</code>. La data è quella dell’ultimo cambiamento vero della cosa; le fonti sono i file del repository di cui la voce parla (da lì la cronologia e l’avviso «voce indietro»). Il testo è una stringa con gli apici inversi, senza apici inversi dentro. Poi <code>node tools/pzkko/wiki/aggiorna.mjs</code>, che controlla tutto, e il push.

{{Vedi anche|Aiuto:Wikitesto|Pzkkopedia:Come si aggiorna}}
[[Categoria:Pzkkopedia]]` },
  'Aiuto:Wikitesto': { data: D, fonti: F, testo: `'''Quello che l’interprete di pzkkopedia capisce''' (<code>wikitesto()</code> in <code>wiki/wiki.js</code>, ~150 righe, scritto qui senza librerie).

{| class="wikitable"
|-
! si scrive !! esce
|-
| <nowiki>'''grassetto''', ''corsivo''</nowiki> || '''grassetto''', ''corsivo''
|-
| <nowiki>== Titolo ==, === Sotto ===</nowiki> || le sezioni, nell’indice
|-
| <nowiki>[[Voce]], [[Voce|testo]], [[Voce#Sezione]]</nowiki> || [[Il muro]], [[Il muro|il muro]], [[Il muro#Com’è fatto|una sezione]]
|-
| <nowiki>[https://… testo]</nowiki> || [https://www.pzkko.it un link esterno]
|-
| <nowiki>* elenco, # numerato, ; termine : definizione</nowiki> || elenchi e definizioni
|-
| <nowiki>[[File:nome.webp|thumb|didascalia]]</nowiki> || un’immagine di <code>wiki/img/</code> in un riquadro; <code>left</code>, <code>center</code>, <code>200px</code>, <code>upright</code>
|-
| <nowiki>[[File:/art/chat-app/app-chat.webp|48px]]</nowiki> || [[File:/art/chat-app/app-chat.webp|48px]] un file del sito, in linea
|-
| <nowiki>{{Infobox| titolo = … | immagine = … | campo = valore}}</nowiki> || la scheda a destra
|-
| <nowiki>{{Vedi anche|A|B}}, {{Principale|A}}</nowiki> || i rimandi
|-
| <nowiki>{{Citazione|testo|chi}}</nowiki> || {{Citazione|ricorda che ad ogni push nuovo bisogna aggiornarla|Alberto, 2.11.2026}}
|-
| <nowiki>{{Avviso|testo}}, {{Versione|4.0.0|nome|data}}</nowiki> || un avviso; {{Versione|4.0.0|chiocciola zero|1.11.2026}}
|-
| <nowiki>{| class="wikitable" … |}</nowiki> || una tabella come questa
|-
| <nowiki><ref>nota</ref> e <references/></nowiki> || le note<ref>Come questa.</ref>
|-
| <nowiki><code>, <kbd>, <br>, <small>, <sup>, <sub>, <s>, <nowiki></nowiki> || gli unici tag ammessi
|-
| <nowiki>#RINVIA [[Voce]]</nowiki> || un reindirizzamento
|-
| <nowiki>[[Categoria:Nome]]</nowiki> || la categoria, in fondo
|}

<references/>

{{Vedi anche|Aiuto:Modificare una pagina|Pzkkopedia}}
[[Categoria:Pzkkopedia]]` },

  // ---------------------------------------------------------------------------------------------------- pzkkopedia:
  'Pzkkopedia': { data: D, fonti: [...F, ...F_AGG, 'albertopecchini.it/pzkko/wiki/wiki.css', 'albertopecchini.it/pzkko/wiki/index.html', 'albertopecchini.it/pzkko/sitemap.xml', 'albertopecchini.it/pzkko/robots.txt', 'albertopecchini.it/tools/pzkko/wiki/prova.mjs'], testo: `{{Infobox
| titolo = pzkkopedia
| immagine = wiki.webp
| didascalia = la pagina principale
| dove = pzkko.it/wiki/
| nata = 26 ottobre 2026 (vuota), 2 novembre 2026 (piena)
| file = wiki/index.html, wiki.js, wiki.css, voci.js, voci/*.js
| strumenti = tools/pzkko/wiki/ (aggiorna, controlla, genera, foto)
| voce della barra = «wiki», carta grigia, Bungee
}}
'''pzkkopedia''', «l’enciclopedia libera del muro», è la wiki di [[pzkko.it]]: la voce «wiki» della [[La barra in alto|barra in alto]]. È nata il 26.10.2026 come scheletro vuoto, «copia fedele nella grafica e nella struttura della skin Vector 2022 di Wikipedia in italiano» (intestazione con menu, logo e ricerca; colonna col menu e l’indice; linguette Voce/Discussione e Leggi/Modifica/Cronologia; piè di pagina), col tocco di pzkko: Anton per i titoli, la fascia di ruggine col filo giallo sotto la barra, il logo di una chiocciola col guscio a pezzo di puzzle disegnato qui, nessun testo altrui. Il 2.11.2026 si è riempita.

{{Citazione|costruisci la wiki completissima con qualsiasi cosa del sito collegata tra cose. ricorda che ad ogni push nuovo bisogna aggiornarla. sii dannatamente specifico e una immagine del sito per spiegare. collega memoria claude e memoria di tutti i miei repo|Alberto, 2.11.2026}}

== Com’è fatta ==
Una pagina sola, <code>wiki/index.html</code>, con l’indirizzo della voce nell’hash (<code>/wiki/#/Titolo_della_voce</code>, <code>#/Speciale:Cerca?q=…</code>, <code>#/Titolo?action=history</code>). Tutta l’interfaccia è in <code>wiki.js</code> (un modulo ES, senza dipendenze né CDN) e <code>wiki.css</code>. Le voci stanno in <code>voci.js</code>, che unisce i moduli di <code>voci/</code>: un oggetto titolo → <code>{ data, fonti, testo }</code>. L’interprete del wikitesto ([[Aiuto:Wikitesto]]) capisce grassetto, corsivo, titoli, link (rossi se la voce manca), elenchi, definizioni, tabelle, immagini, i template Infobox, Vedi anche, Principale, Citazione, Avviso e Versione, le note, i rinvii e le categorie. All’avvio costruisce gli indici: chi sta in quale categoria, chi punta a chi ([[Speciale:PuntanoQui/Pzkkopedia|«Puntano qui»]] è vero), chi usa quale file.

=== La cronologia è quella del repository ===
Non ci sono utenze né salvataggi dal browser: le voci si scrivono nel [[Il repository AP|repository]] e ogni modifica è un commit. Ogni voce dichiara le sue '''fonti''' (i file del repository di cui parla) e la sua cronologia sono i commit veri che le hanno toccate, letti da <code>wiki/cronologia.js</code>, che <code>tools/pzkko/wiki/genera.mjs</code> scrive da <code>git log</code>. «Ultime modifiche» elenca tutti i commit con le voci che toccano; «Statistiche» dice a quale commit la wiki è allineata.

=== Le voci dai dati ===
<code>voci/dati.js</code> è generato: una voce per ogni [[Elenco degli oggetti|oggetto dello shop]], [[Elenco dei pesci|pesce]], [[Elenco delle bestie|bestia]], [[Elenco dei reperti|reperto]], [[Elenco dei mestieri|mestiere]], [[Elenco delle side quest|side quest]] (con tutta la storia a bivi), [[Elenco delle squadre di virtual|squadra]], [[Elenco dei pezzi della miniera|pezzo della miniera]] e [[Elenco dei traguardi|traguardo]], più le liste, [[Le giornate della lumachina|le giornate della lumachina]] e [[Elenco delle foto dei quiz|le foto dei quiz]]. Vengono dai moduli puri del sito (<code>chat/testi.js</code>, <code>chat/oggetti.js</code>, <code>chat/missioni-dati.js</code>…), quindi dicono sempre quello che il sito fa.

=== Le immagini ===
Un’immagine cliccata si apre nel visore a tutto schermo, come il MediaViewer di Wikipedia (frecce, tastiera, didascalia, link alla pagina «File:» e all’originale). <code>wiki/img/</code>: le foto del sito fatte da <code>foto.mjs</code> (le pagine senza 3D in Chromium) e le foto di collaudo copiate da <code>tools/pzkko/lavoro/</code> (la scena 3D, il cercapersone zero, l’lcd di ogni app). Le catture del sito serio si usano dal loro indirizzo su albertopecchini.it, dove si rifanno da sole ogni ora ([[Le catture dei siti (workflow)]]). [[Speciale:Immagini|L’elenco dei file]] le mostra tutte.

== La regola del push ==
{{Principale|Pzkkopedia:Come si aggiorna}}
Prima di ogni push su <code>main</code> la wiki si aggiorna: lo dice [[CLAUDE.md]], lo controlla <code>controlla.mjs</code> (in locale, nel workflow [[Il controllo della build (workflow)|Build]] e in un gancio di [[Claude Code]] che ferma <code>git push</code> se la wiki è indietro), e <code>aggiorna.mjs</code> rigenera dati, cronologia e stato dicendo quali voci rileggere.

{{Vedi anche|Pzkkopedia:Informazioni|Aiuto:Aiuto|La barra in alto|La memoria di Claude}}
[[Categoria:Pzkkopedia]]` },
  'Pzkkopedia:Come si aggiorna': { data: D, fonti: F_AGG, testo: `{{Avviso|'''La regola di Alberto (2.11.2026):''' «ricorda che ad ogni push nuovo bisogna aggiornarla». Prima di ogni push su main la wiki si aggiorna.}}
'''Come si tiene in pari pzkkopedia''' col sito, in quattro passi, dalla cartella <code>albertopecchini.it</code>.

== 1. Cosa è cambiato ==
<code>node tools/pzkko/wiki/aggiorna.mjs</code> (o solo <code>controlla.mjs</code>) confronta il commit scritto in <code>wiki/stato.json</code> con adesso (HEAD più le modifiche non committate) ed elenca i file del sito cambiati e '''quali voci li dichiarano fra le fonti''': quelle si rileggono. Un file che nessuna voce dichiara è il segno che serve una voce nuova (o una fonte in più).

== 2. Le voci ==
Si correggono a mano in <code>pzkko/wiki/voci/*.js</code> ([[Aiuto:Modificare una pagina]]), con la data nuova e le parole di Alberto se ci sono. Le voci generate (<code>dati.js</code>) non si toccano: le rifà il passo 3.

== 3. Rigenerare ==
<code>node tools/pzkko/wiki/aggiorna.mjs</code> rifà <code>voci/dati.js</code> (dai dati del sito), <code>cronologia.js</code> (da <code>git log</code>: i commit e, per ogni voce, quelli che hanno toccato le sue fonti) e <code>stato.json</code> (il commit a cui la wiki è allineata), poi controlla: fonti che non esistono, immagini mancanti, link rossi, titoli doppi. Con <code>--foto</code> rifà anche le foto del sito (serve un browser); con <code>--copie</code> solo le copie delle foto di collaudo.

== 4. Il push ==
Si committano le voci e i file generati insieme al resto. Se la wiki è rimasta indietro:
* in locale, il gancio di [[Claude Code]] (<code>.claude/settings.json</code>, PreToolUse su Bash) lancia <code>controlla.mjs --hook</code> e '''ferma <code>git push</code>''' dicendo cosa rileggere;
* su GitHub, il workflow [[Il controllo della build (workflow)|Build]] ha il passo «Controllo di pzkkopedia»: il commit prende la ❌ e arriva un’email.

== Cosa conta come «cambiato» ==
I file in <code>albertopecchini.it/</code>, <code>.github/</code>, <code>CLAUDE.md</code>, le skill, <code>README.md</code>, <code>PRODUCT.md</code>, <code>DESIGN.md</code>; non le catture automatiche del bot (<code>public/media/web/</code>, <code>src/data/catture.js</code>), non le cartelle <code>lavoro/</code>, non la wiki stessa. Se fra quei file ne è cambiato uno e nessuna voce è stata toccata, la wiki è indietro.

{{Vedi anche|Pzkkopedia|CLAUDE.md|Il repository AP|La memoria di Claude}}
[[Categoria:Pzkkopedia]]` },
  'Pzkkopedia:Informazioni': { data: D, fonti: F, testo: `'''pzkkopedia''' è un pezzo di [[pzkko.it]], fatto da [[Alberto Pecchini]] con [[Claude Code]]. I testi, le immagini e il codice sono suoi (© 2026), dove non è scritto altro; i nomi e i marchi citati sono dei loro proprietari e non c’entrano col sito. Non è Wikipedia e non ha niente di Wikipedia: ne copia la skin Vector 2022 nella grafica e nella struttura, per scherzo, con un logo e un nome suoi.

Le voci dicono come è fatto il sito al commit a cui la wiki è allineata ([[Speciale:Statistiche]]): se una voce e il sito non vanno d’accordo, vale il sito, e la voce va corretta ([[Pzkkopedia:Come si aggiorna]]).

{{Vedi anche|Pzkkopedia|Pzkkopedia:Avvertenze|Le licenze}}
[[Categoria:Pzkkopedia]]` },
  'Pzkkopedia:Avvertenze': { data: D, fonti: F, testo: `* I '''$pzk''' e gli '''EUR€''' sono finti: non si comprano, non si vendono, non valgono niente fuori da pzkko. I giochi sono per ridere ([[Cosa si salva]]).
* Le voci descrivono il sito com’era all’ultimo aggiornamento della wiki: pzkko è [[La beta|in beta]] e cambia spesso.
* I numeri delle prove (i giri della roulette, i lanci della moneta, i fotogrammi al secondo) sono quelli misurati il giorno scritto, sulla macchina scritta.
* Le voci sulla [[La memoria di Claude|memoria di Claude]] raccontano file che stanno fuori dal repository, sul pc di Alberto: non contengono segreti, chiavi né password, e non devono mai contenerne.

[[Categoria:Pzkkopedia]]` },
  'Pzkkopedia:Informativa sulla privacy': { data: D, fonti: F, testo: `pzkkopedia non raccoglie niente: nessuna utenza, nessun cookie, nessun contatore. Nel browser restano solo due preferenze dell’interfaccia (<code>pzkkopedia-menu</code> e <code>pzkkopedia-mobile</code>, in localStorage: il menu nascosto e la «versione mobile»). Le immagini dei quiz elencate in [[Elenco delle foto dei quiz]] si caricano da Wikimedia Commons e Imgur quando le apri nel sito, non qui. Per il resto di pzkko: [[Cosa si salva]].

[[Categoria:Pzkkopedia]]` },
  'Pzkkopedia:Codice di condotta': { data: D, fonti: F, testo: `Una regola sola: le voci dicono il vero sul sito, con i numeri, i nomi dei file e le date, e le parole di Alberto fra virgolette quando ci sono. Niente riassunti vaghi, niente cose inventate. Se una cosa non si sa, si scrive che non si sa.

[[Categoria:Pzkkopedia]]` },
  'Pzkkopedia:Dichiarazione sui cookie': { data: D, fonti: F, testo: `Nessun cookie. Vedi [[Pzkkopedia:Informativa sulla privacy]].

[[Categoria:Pzkkopedia]]` },
  'Pzkkopedia:Portale comunità': { data: D, fonti: F, testo: `La comunità di pzkkopedia sono [[Alberto Pecchini]] e [[Claude Code]]: le voci nascono nelle sessioni di Claude dentro la cartella del repository, con le parole di Alberto, e si aggiornano a ogni push ([[Pzkkopedia:Come si aggiorna]]). Le cose da fare stanno nelle [[Speciale:LinkRossi|pagine richieste]] (i link rossi) e nei file del sito che nessuna voce dichiara fra le fonti (li elenca <code>controlla.mjs</code>).

{{Vedi anche|Come lavora Alberto con Claude|La memoria di Claude}}
[[Categoria:Pzkkopedia]]` },

  // ---------------------------------------------------------------------------------------------------- i portali
  'Portale:Il muro': { data: D, fonti: F, testo: `[[File:home-giorno.webp|thumb|la home di pzkko.it, il muro]]
'''Il muro''': la home di [[pzkko.it]] senza 3D, la saracinesca coi volantini.
* Com’è fatta: [[Il muro]] · [[La saracinesca di Bologna]] · [[La storia del muro]] · [[L'insegna]] · [[La lamiera]] · [[I volantini]] · [[I tagliandi]] · [[Le carte dei volantini]] · [[I caratteri del muro]] · [[I manifesti e la roba degli altri]] · [[Le zone del muro]] · [[I siti in cima]] · [[La roba per terra (2D)]]
* Le cose vive: [[La petizione]] · [[Le penne della petizione]] · [[Le firme della petizione]] · [[La sera a Mantova]] · [[La strada di notte]] · [[Le auto che passano]] · [[Le mosche e le formiche del muro]] · [[La goccia della condensa]] · [[Il meme degli auguri]] · [[Gli adesivi degli amici]]
* Come parte e come sta ferma: [[Come parte la home]] · [[Ferma quando è ferma]] · [[Lo scontrino delle novità]]
* La disposizione: [[La disposizione]] · [[Le pile]] · [[La serranda]] · [[Skill serranda]]
* Le pagine: [[La barra in alto]] · [[Gadget (pagina)]] · [[Oggetti (pagina)]] · [[Traguardi (pagina)]] · [[Info (pagina)]] · [[La 404]] · [[Gli strumenti di pzkko]] · [[pzk$meeting]] · [[Pzkkopedia]]
* Le immagini: [[Le immagini del muro]] · [[I fogli di gpt-image-2]] · [[Le foto vere]] · [[La favicon e l'og]] · [[I crediti di pzkko]]
* Le versioni: [[Le versioni di pzkko]] · [[Il portafoglio MagSafe]] · [[La scrivania di pzkko]] · [[Il muro (versione 2.0)]] · [[Lumaca catodica]] · [[Chiocciola zero]]
* Online: [[Vercel (pzkko)]] · [[In locale (pzkko)]]
[[Categoria:Il muro]]` },
  'Portale:La scena 3D': { data: D, fonti: F, testo: `[[File:scena-cima.webp|thumb|la scena 3D vista dalla cima della saracinesca]]
'''La scena 3D''': dove c’è WebGL2 e lo si accende, la home è un posto.
* Il posto: [[La scena 3D]] · [[Il posto]] · [[Il fronte del negozio]] · [[La porta a vetri]] · [[La targa del civico 28]] · [[Il citofono]] · [[Il lucchettone]] · [[I graffiti e gli adesivi della facciata]] · [[L'intonaco vero]] · [[Dentro il negozio]] · [[Il PC con Ubuntu]] · [[Le lettere dell'insegna]] · [[I fogli (scena)]] · [[Il marciapiede]] · [[Le pozzanghere]] · [[La spazzatura per terra]] · [[Il chiusino di pzkkonet]] · [[Il portachiavi della banca $pzk]] · [[Le banconote per terra]] · [[I grissini alla pizza]]
* L’arrivo: [[Il caricamento è il pomodoro]] · [[Il pomodoro]] · [[L'arrivo]] · [[L'altra pagina già scaricata]] · [[La vetrina]] · [[La scena sul telefono]]
* Luci, acqua, meteo, bestie: [[Le luci a insiemi]] · [[L'acqua]] · [[Il muro bagnato]] · [[Il meteo]] · [[Le bestie]] · [[Le formiche]] · [[Le mosche]] · [[Le zanzare tigre]] · [[Le blatte]] · [[Le cose che si toccano]]
* Il costo: [[Il costo e la qualità]] · [[Il tetto della scheda]] · [[Le trappole della compilazione]] · [[Il contesto perso]] · [[three.js]] · [[Rapier]]
* Gli strumenti: [[Le prove della scena]] · [[Le foto dei volantini]] · [[Le foto del caricamento]] · [[Le trame]] · [[I disegni della scena]] · [[Gli atlanti]] · [[La scena in Blender]]
* La regia: [[La regia]]
* Il suono: [[Il suono]] · [[Il suono della strada]] · [[Le campane]] · [[Gli uccelli]] · [[I corpi percossi]] · [[I suoni dell'interfaccia]] · [[La musica]] · [[Le sigle delle app]] · [[La cornice]] · [[Il nastro suono]] · [[Le prove del suono]]
[[Categoria:La scena 3D]]` },
  'Portale:I giochi': { data: D, fonti: F, testo: `[[File:roulette.webp|thumb|la roulette aperta sul muro]]
'''I sei giochi''' del muro, coi $pzk finti e la fisica vera.
* [[I giochi]] · [[La finestra dei giochi]] · [[Le fiches]] · [[Le prove dei giochi]] · [[Le trappole della fisica]]
* [[La roulette]] · [[Il blackjack]] · [[Le mine]] · [[Il dado]] · [[La moneta]]
* [[Virtual]] · [[Il calendario di virtual]] · [[Le squadre di virtual]] · [[Elenco delle squadre di virtual]] · [[Le quote di virtual]] · [[Lo schermino di virtual]] · [[La schedina]] · [[Virtual (app)]]
* I giochi della chat: [[I minigiochi della chat]] · [[Il gratta e vinci]] · [[Le casse]] · [[I quiz]] · [[La cucina]]
[[Categoria:I giochi]]` },
  'Portale:I soldi': { data: D, fonti: F, testo: `[[File:wallet.webp|thumb|il wallet aperto]]
'''I $pzk''', i soldi finti di pzkko, e tutto quello che li muove.
* Il portafoglio: [[I $pzk]] · [[La sessione]] · [[Il conto]] · [[I conti]] · [[I portafogli separati]] · [[I lotti numerati]] · [[Il libro dei conti]] · [[Le classifiche]] · [[I numeri corti]]
* Il wallet e la borsa: [[Il wallet]] · [[Il banner del wallet]] · [[La batteria]] · [[Gli EUR€]] · [[La borsa]] · [[Il cambio PZK/EUR€]] · [[I fattori del mondo]] · [[Gli invii]] · [[Le operazioni della banca]] · [[Il conto di Alberto]] · [[Banca (app)]] · [[Account (app)]]
* I soldi che arrivano: [[Il sussidio]] · [[Il regalo di Instagram]] · [[Le banconote della banca $pzk]] · [[Il premio giornaliero]] · [[Il lavoro]] · [[La lumachina]] · [[La salute della lumachina]] · [[Le giornate della lumachina]]
* L’economia: [[L'economia]] · [[L'offerta di $pzk]] · [[La cassa di pzk]] · [[I portafogli smarriti]] · [[I soldi sporchi]] · [[La rapina]] · [[La galera]] · [[La cauzione]] · [[La lavatrice]] · [[Il decifratore]] · [[Il pzkstore]] · [[I lavori rischiosi]] · [[La morte]]
* Dietro: [[La banca sul server]] · [[Il contratto della banca]] · [[Il wallet (API)]] · [[La borsa (API)]] · [[Il canale diretto]] · [[Il canale sempre aperto]]
[[Categoria:I soldi]]` },
  'Portale:Il cercapersone': { data: D, fonti: F, testo: `[[File:zero-menu.webp|thumb|il menu di pzk os]]
'''Il cercapersone zero''' e tutto quello che ci gira dentro.
* Lo zero: [[Il cercapersone zero]] · [[Il cercapersone nero]] · [[Il modello dello zero]] · [[Il tasto sul muro]] · [[La luce dello zero]] · [[La scritta PZKKO]] · [[Il cavo di ricarica]] · [[Il led rosso]] · [[L'inclinazione col mouse]] · [[Il saluto]] · [[Cercapersone zero (memoria)]]
* pzk os: [[pzk os]] · [[L'lcd]] · [[Il carattere 5×7]] · [[Le icone di pzk os]] · [[I sei tasti]] · [[Il clic del mouse]] · [[La home di pzk os]] · [[La guida di pzk os]] · [[Il menu di pzk os]] · [[La barra di stato]] · [[Le regole per le app]] · [[Il collaudo delle app]] · [[Regole app pzk os (memoria)]]
* Le app: [[Le app di pzk os]] · [[Le app di pzk os (tabella)]] · [[Chat (app)]] · [[Profilo (app)]] · [[Account (app)]] · [[Shop (app)]] · [[Pzkstore (app)]] · [[Sfide (app)]] · [[Quiz (app)]] · [[Quest (app)]] · [[Giocatori (app)]] · [[Zaino (app)]] · [[Miniera (app)]] · [[Foto (app)]] · [[Virtual (app)]] · [[Banca (app)]] · [[Rapina (app)]] · [[Lavatrice (app)]] · [[Decifratore (app)]] · [[Bin·hex (app)]] · [[Calcoli (app)]] · [[Codice C (app)]] · [[Cucina (app)]] · [[Impostazioni (app)]]
* La chat col bot: [[La chat col bot]] · [[Il bot pzk]] · [[I comandi della chat]] · [[Il testo predittivo]] · [[I consigliati]] · [[I tasti rapidi]] · [[Le attività]] · [[La pesca]] · [[La caccia]] · [[Lo scavo]] · [[Il lavoro]] · [[I mestieri]] · [[Elenco dei mestieri]] · [[Lo spazzino di uffici]] · [[I minigiochi della chat]] · [[La morte]] · [[Il cercapersone scassato]] · [[Il tomodachi]]
* Le cose: [[Lo zaino]] · [[I bonus]] · [[Lo shop]] · [[Elenco degli oggetti]] · [[Elenco dei pesci]] · [[Elenco delle bestie]] · [[Elenco dei reperti]] · [[Le casse]] · [[Le sfide giornaliere]] · [[I quiz]] · [[Le side quest]] · [[Elenco delle side quest]] · [[I traguardi]] · [[Elenco dei traguardi]] · [[Le facce del profilo]] · [[La miniera]] · [[Elenco dei pezzi della miniera]] · [[La cucina]] · [[Il compilatore C]] · [[La calcolatrice del geometra]] · [[Le conversioni fra basi]] · [[Le foto vere dei quiz]] · [[Il database dei giocatori]] · [[Le notizie della banca]]
* La sincronia: [[La sincronizzazione fra dispositivi]] · [[Il canale sempre aperto]] · [[Il canale diretto]]
[[Categoria:Il cercapersone]]` },
  'Portale:Gli strumenti': { data: D, fonti: F, testo: `'''Gli strumenti''': i programmi che fanno il sito, dentro il repository.
* Di pzkko: [[Gli strumenti di pzkko]] · [[La serranda]] · [[La disposizione]] · [[Le immagini del muro]] · [[Le foto vere]] · [[Le prove della scena]] · [[Le foto dei volantini]] · [[Le foto del caricamento]] · [[Le trame]] · [[I disegni della scena]] · [[Gli atlanti]] · [[Le prove dei giochi]] · [[Le prove del suono]] · [[Il collaudo delle app]] · [[Il modello dello zero]] · [[pzk$meeting]] · [[Lezioni (strumento)]] · [[Pzkkopedia:Come si aggiorna]]
* Di albertopecchini.it: [[Gli strumenti di albertopecchini.it]] · [[Le catture]] · [[Le copertine]] · [[Le figurine]] · [[Le mascotte]] · [[I burattini]] · [[L'aragosta e l'inchiostro]] · [[La cartina]] · [[Il generatore di email]] · [[Il compositore email]] · [[La nota in PDF]] · [[L'anteprima og]] · [[L'indirizzo .onion]] · [[Le tavole]] · [[Il lettore DWG]] · [[Wrapped 5BT]] · [[Le immagini di Better Call Pekko]] · [[Il contatore di Better Call Pekko]] · [[Il controllo delle pagine]]
* I servizi: [[Replicate]] · [[gpt-image-2]] · [[retro-diffusion rd-plus]] · [[bria/remove-background]] · [[Open-Meteo]] · [[Compiler Explorer]] · [[Wikimedia Commons]] · [[Google Fonts]] · [[three.js]] · [[Rapier]]
* Le skill di Claude: [[Le skill di Claude Code]] · [[Skill lezione]] · [[Skill nota]] · [[Skill serranda]]
[[Categoria:Gli strumenti]]` },
  'Portale:Il repository': { data: D, fonti: F, testo: `'''Il repository AP''' e tutto quello che gli sta intorno.
* [[Il repository AP]] · [[I rami del repository]] · [[I messaggi di commit]] · [[La storia del repository]] · [[Il sito precedente (React)]] · [[Il GitHub di Alberto]] · [[Elenco dei commit]] · [[Speciale:UltimeModifiche|Ultime modifiche]]
* I workflow: [[Le catture dei siti (workflow)]] · [[Il controllo della build (workflow)]]
* Online: [[Vercel]] · [[Il progetto Vercel pzkko]] · [[Vercel (pzkko)]] · [[Vercel Blob]]
* Il server in casa: [[Il server dei dati in casa]] · [[La banca sul server]] · [[Il contratto della banca]] · [[La regia del server]] · [[Il tunnel Tailscale]] · [[Il custode del server]] · [[Lo storico del server]] · [[Il ponte firmato]] · [[Riavvio server di casa (memoria)]] · [[Server in casa (memoria)]] · [[Banca sul server (memoria)]]
* Le API: [[Le API di pzkko]] · [[Le firme (API)]] · [[Il meteo di Mantova (API)]] · [[Il wallet (API)]] · [[La borsa (API)]] · [[I giocatori (API)]] · [[Il canale (API)]]
* I siti: [[albertopecchini.it]] · [[Better Call Pekko]] · [[rivaltasulmincio.it]] · [[cascinafontana.xyz]] · [[Ing. Dario Donelli]] · [[Il credito nei siti dei clienti]]
* Le regole: [[CLAUDE.md]] · [[PRODUCT.md]] · [[DESIGN.md]] · [[I file fuori dal repository]] · [[Le licenze]]
[[Categoria:Il repository]]` },
  'Portale:La memoria di Claude': { data: D, fonti: F, testo: `'''La memoria di Claude''': i file che Claude Code tiene fuori dal repository per ricordare le regole di Alberto da una sessione all’altra, e il modo in cui lavorano insieme.
* [[La memoria di Claude]] · [[Claude Code]] · [[Come lavora Alberto con Claude]] · [[CLAUDE.md]] · [[Le skill di Claude Code]]
* Le otto memorie: [[Icone sempre rd-plus (memoria)]] · [[Firma per i PDF (memoria)]] · [[Server in casa (memoria)]] · [[Rami per sito (memoria)]] · [[Cercapersone zero (memoria)]] · [[Regole app pzk os (memoria)]] · [[Banca sul server (memoria)]] · [[Riavvio server di casa (memoria)]]
* Le skill: [[Skill lezione]] · [[Skill nota]] · [[Skill serranda]]
* Le regole scritte nel repository: [[CLAUDE.md]] · [[Le regole per le app]] · [[Il contratto della banca]] · [[Il credito nei siti dei clienti]] · [[Pzkkopedia:Come si aggiorna]]
* Le persone e i luoghi: [[Alberto Pecchini]] · [[pzkko (il nome)]] · [[Pekko]] · [[La chiocciola gigante africana]] · [[La nutria]] · [[Mantova]] · [[Rivalta sul Mincio]] · [[Il Mincio]] · [[Bologna]] · [[Unimore]]
[[Categoria:La memoria di Claude]]` },

  // ---------------------------------------------------------------------------------------------------- le categorie
  'Categoria:Il muro': { data: D, fonti: F, testo: `La home di [[pzkko.it]] senza 3D: la saracinesca, i volantini, la sera, le pagine della barra, le versioni. Il portale: [[Portale:Il muro]].` },
  'Categoria:La scena 3D': { data: D, fonti: F, testo: `La home come posto in 3D: il negozio, le luci, il meteo, le bestie, la regia. Il portale: [[Portale:La scena 3D]].` },
  'Categoria:Il suono': { data: D, fonti: F, testo: `Tutto quello che si sente: la strada sintetizzata, le campane, la musica a 16 bit, i suoni dell’interfaccia. Vedi [[Il suono]].` },
  'Categoria:I giochi': { data: D, fonti: F, testo: `I sei giochi grandi del muro e quelli della chat. Il portale: [[Portale:I giochi]].` },
  'Categoria:I soldi': { data: D, fonti: F, testo: `I $pzk, il wallet, la borsa, i conti, l’economia e la banca. Il portale: [[Portale:I soldi]].` },
  'Categoria:Il cercapersone': { data: D, fonti: F, testo: `Il cercapersone zero e pzk os. Il portale: [[Portale:Il cercapersone]].` },
  'Categoria:Le app di pzk os': { data: D, fonti: F, testo: `Le 22 app a 8 bit del cercapersone zero, una voce ciascuna. Vedi [[Le app di pzk os]] e [[Le app di pzk os (tabella)]].` },
  'Categoria:La chat': { data: D, fonti: F, testo: `La chat col bot pzk: i comandi, le attività, i quiz, le sfide, le side quest. Vedi [[La chat col bot]].` },
  'Categoria:Gli oggetti': { data: D, fonti: F, testo: `Tutto quello che si compra nello shop e che si trova in giro, una voce per cosa (generate da <code>chat/testi.js</code> e <code>chat/oggetti.js</code>). Vedi [[Elenco degli oggetti]].` },
  'Categoria:I pesci': { data: D, fonti: F, testo: `Quello che si pesca nel Mincio col comando <code>pesca</code>. Vedi [[Elenco dei pesci]].` },
  'Categoria:Le bestie': { data: D, fonti: F, testo: `Quello che si caccia col comando <code>caccia</code>, e le bestie della scena 3D. Vedi [[Elenco delle bestie]] e [[Le bestie]].` },
  'Categoria:I reperti': { data: D, fonti: F, testo: `Quello che si scava col comando <code>scava</code>. Vedi [[Elenco dei reperti]].` },
  'Categoria:I mestieri': { data: D, fonti: F, testo: `I venti mestieri del comando <code>lavora</code>, onesti e rischiosi. Vedi [[Elenco dei mestieri]].` },
  'Categoria:Le side quest': { data: D, fonti: F, testo: `Le tredici storie a bivi, con tutta la storia in ogni voce. Vedi [[Elenco delle side quest]].` },
  'Categoria:Le squadre di virtual': { data: D, fonti: F, testo: `Le quaranta squadre del campionato inventato. Vedi [[Elenco delle squadre di virtual]].` },
  'Categoria:La miniera': { data: D, fonti: F, testo: `I 75 pezzi e gli otto PC pronti della miniera. Vedi [[Elenco dei pezzi della miniera]].` },
  'Categoria:I traguardi': { data: D, fonti: F, testo: `I 47 achievement. Vedi [[Elenco dei traguardi]].` },
  'Categoria:Gli strumenti': { data: D, fonti: F, testo: `I programmi che fanno i siti: in <code>tools/</code> e <code>tools/pzkko/</code>. Il portale: [[Portale:Gli strumenti]].` },
  'Categoria:Il repository': { data: D, fonti: F, testo: `Il repository AP, i rami, i workflow, i commit. Il portale: [[Portale:Il repository]].` },
  'Categoria:Il server': { data: D, fonti: F, testo: `Il server dei dati sul pc di Alberto: la banca, la regia, il tunnel, le API. Vedi [[Il server dei dati in casa]].` },
  'Categoria:Vercel': { data: D, fonti: F, testo: `I tre progetti Vercel e come pubblicano. Vedi [[Vercel]].` },
  'Categoria:I siti di Alberto': { data: D, fonti: F, testo: `albertopecchini.it, bettercallpekko.it, pzkko.it e i siti dei clienti. Vedi [[Alberto Pecchini]].` },
  'Categoria:La memoria di Claude': { data: D, fonti: F, testo: `I file della memoria di Claude Code e le regole di lavoro. Il portale: [[Portale:La memoria di Claude]].` },
  'Categoria:Le persone': { data: D, fonti: F, testo: `Chi c’è dietro e chi ci vive dentro: Alberto, Pekko, la chiocciola, la nutria.` },
  'Categoria:I luoghi': { data: D, fonti: F, testo: `Mantova, Rivalta sul Mincio, il Mincio, Bologna, unimore.` },
  'Categoria:Le versioni': { data: D, fonti: F, testo: `Le versioni di pzkko.it, dal portafoglio MagSafe alla chiocciola zero. Vedi [[Le versioni di pzkko]].` },
  'Categoria:Pzkkopedia': { data: D, fonti: F, testo: `Le pagine della wiki su sé stessa: l’aiuto, le informazioni, come si aggiorna. Vedi [[Pzkkopedia]].` },
  'Categoria:Le immagini': { data: D, fonti: F, testo: `Come nascono le immagini del sito: gpt-image-2, retro-diffusion, le foto vere, le catture. Vedi [[Le immagini del muro]].` },
}
