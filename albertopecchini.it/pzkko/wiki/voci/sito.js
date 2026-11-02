// Le voci di pzkkopedia sull'area «il muro»: la home 2D di pzkko.it, i volantini, la sera, le pagine della barra, le
// versioni, Vercel, in locale (2.11.2026). Il formato e il wikitesto: tools/pzkko/wiki/README.md. wiki/voci.js le unisce.
// Niente apici inversi né ${ dentro i testi: il codice sta in <code>.

const README = 'albertopecchini.it/pzkko/README.md'
const INDEX = 'albertopecchini.it/pzkko/index.html'

export const VOCI = {
  'Pzkko.it': {
    data: '2026-11-01',
    fonti: [INDEX, README, 'PRODUCT.md', 'albertopecchini.it/pzkko/vercel.json'],
    testo: `{{Infobox
| titolo = pzkko.it
| immagine = home-giorno.webp
| didascalia = la home di pzkko.it, il muro di giorno senza 3D
| indirizzo = https://www.pzkko.it
| autore = [[Alberto Pecchini]]
| nato = 7 ottobre 2026
| versione = 4.0.0 «chiocciola zero» (1.11.2026)
| cartella = albertopecchini.it/pzkko/
| build = nessuna: file statici
| hosting = [[Vercel (pzkko)|Vercel]], progetto pzkko
| dati = [[Il server dei dati in casa|il pc di Alberto]]
}}
'''pzkko.it''' è l'indirizzo personale di [[Alberto Pecchini]] (''pzkko'' è il suo nome in rete, vedi [[pzkko (il nome)]]): una saracinesca grigia coperta di graffiti e di volantini attaccati col nastro, dove ogni sito, social, gioco e strumento di Alberto è un foglio di carta. Sopra ci stanno [[Il wallet|un wallet]] dei [[I $pzk|$pzk]], [[Il cercapersone zero|un cercapersone]] con [[Le app di pzk os|le sue app]] e [[I giochi|sei giochi]] coi soldi finti. È ''in beta'': le cose cambiano spesso, e qualcosa si rompe (lo dice la pagina [[Info (pagina)|info]]).

== Cos'è ==
Non è un link-in-bio generico (così PRODUCT.md): è il sito di una persona che progetta siti, «e si vede dalla cura». I social confermati il 7.10.2026, nell'ordine: Instagram @albertoxpecchini, GitHub albertoxpecchini, WhatsApp +39 351 0355506, e-mail pzkko@yahoo.com, PayPal albertoxpecchini; dal 21.10 anche [[TikTok sul muro|TikTok]]. Le due zone «tools» e «games», nate vuote, sono diventate [[Gli strumenti di pzkko|gli strumenti]] ([[pzk$meeting]]) e [[I giochi|i sei giochi]]. Lingua: italiano, tutto in minuscolo. Il nome «pzkko», minuscolo, è il marchio; Alberto Pecchini è l'autore.

== Com'è fatto ==
File statici in <code>albertopecchini.it/pzkko/</code>, dentro il [[Il repository AP|repository AP]]: <code>index.html</code> con CSS e JS in linea, <code>404.html</code>, <code>robots.txt</code>, <code>sitemap.xml</code>, <code>vercel.json</code>, le cartelle <code>art/</code> ([[Le immagini del muro]]), <code>games/</code>, <code>scena/</code>, <code>chat/</code>, <code>telefono/</code>, <code>wallet/</code>, <code>regia/</code>, <code>suono/</code>, <code>barra/</code>, <code>petizione/</code>, <code>storia/</code>, <code>tools/</code>, <code>api/</code>, <code>wiki/</code>. Niente build: la cartella va online così com'è (vedi [[Vercel (pzkko)]]). Il dominio principale è <code>www.pzkko.it</code>, l'apice rimanda a www con un 308.

== Le parti ==
* [[Il muro]]: la home, la saracinesca coi [[I volantini|volantini]], i [[I tagliandi|tagliandi]], [[I manifesti e la roba degli altri|la roba degli altri]], [[La sera a Mantova|la sera]] e [[La strada di notte|la notte]].
* [[La scena 3D]]: dal 18.10.2026, dove c'è WebGL2, lo stesso muro disegnato dalla scheda grafica come un posto vero; dal 23.10 si accende a scelta nella [[La regia|regia]].
* [[Il suono|I suoni]] della strada, [[La musica|la musica]] a 16 bit, i [[I suoni dell'interfaccia|suonini]].
* [[Il wallet]] e [[La borsa|la borsa]] PZK/EUR€, [[Il cercapersone zero]] con [[pzk os]] e [[La chat col bot|la chat col bot]].
* [[I giochi]]: [[La roulette]], [[Il blackjack]], [[Le mine]], [[Il dado]], [[La moneta]], [[Virtual]].
* [[La barra in alto]] con le pagine [[La storia del muro|storia]], [[Gadget (pagina)|gadget]], [[Oggetti (pagina)|oggetti]], [[Traguardi (pagina)|traguardi]], account, [[Info (pagina)|info]] e [[Pzkkopedia|wiki]].
* [[La petizione]] «pzkko.it è un bel sito?», con le firme vere.
* [[La storia del muro]]: da dove viene la saracinesca.

== Da dove viene ==
La saracinesca di riferimento è vera: [[La saracinesca di Bologna|la serranda di un negozio chiuso in via Rizzoli a Bologna]], con l'insegna «coin» sopra e i manifesti sotto, fotografata da Alberto il 22 settembre 2024. Il sito è nato il 7.10.2026 come [[Il portafoglio MagSafe|portafoglio MagSafe]], bocciato lo stesso giorno, poi [[La scrivania di pzkko|una scrivania col dock]], e il 9.10 [[Il muro (versione 2.0)|il muro]]: vedi [[Le versioni di pzkko]].

== I soldi sono finti ==
I $pzk e gli [[Gli EUR€|EUR€]] non si comprano, non si vendono e non valgono niente fuori da qui: «niente soldi veri, mai». Col [[Il conto|conto]] si salvano sul [[Il server dei dati in casa|server di pzkko]] (il pc di Alberto): nome, PIN cifrato, $pzk, zaino, profilo. Vedi [[Cosa si salva]].

{{Vedi anche|Il muro|Le versioni di pzkko|Alberto Pecchini|albertopecchini.it|Better Call Pekko|Il repository AP}}
[[Categoria:Il muro]]
[[Categoria:I siti di Alberto]]`,
  },

  'Il muro': {
    data: '2026-10-29',
    fonti: [INDEX, README, 'albertopecchini.it/tools/pzkko/disposizione.js', 'DESIGN.md'],
    testo: `{{Infobox
| titolo = Il muro
| immagine = home-intera.webp
| didascalia = la parete intera, dal computer: cinque colonne di fogli
| dove = pzkko.it/
| file = index.html (CSS e JS in linea)
| dal = 9 ottobre 2026
| parete = 1280 unità di larghezza, alta 3191 (computer); 390 unità, alta 5486 (telefono)
| lamiera = art/muro.webp, si ripete ogni 2200 px
| sopra = tutto SVG: intonaco, insegna, graffiti
}}
'''Il muro''' è la home di [[pzkko.it]]: una saracinesca grigia abbassata, la parete d'intonaco sopra con l'insegna «pzkko», e sulla lamiera [[I volantini|i volantini]], [[I manifesti e la roba degli altri|i manifesti degli altri]], i graffiti, [[Gli adesivi degli amici|gli adesivi]], [[La petizione|la petizione]], [[Il wallet|il wallet]] avvitato e [[Il cercapersone zero|il cercapersone]] appeso a un chiodo. È il commit 38e14a2 del 9.10.2026, «la home come saracinesca coperta di graffiti e volantini», che ha preso il posto della [[La scrivania di pzkko|scrivania]] del 7.10.

[[File:home-giorno.webp|thumb|il primo schermo del muro di giorno, senza 3D]]

== La foto di riferimento ==
[[La saracinesca di Bologna|La serranda di un negozio chiuso a Bologna]], con l'insegna «coin» sopra e i manifesti attaccati sotto. L'unica fotografia vera che è rimasta nella pagina è [[La lamiera|la lamiera]]: tutto il resto è disegnato.

== Com'è fatto, dall'alto in basso ==
* '''il muro del palazzo''': <code>art/intonaco.svg</code>, una piastrella di 640 px che si ripete senza giunte (rumori <code>feTurbulence</code>, la grana della sabbia illuminata con <code>feDiffuseLighting</code>, chiazze di colore), con un'ombra sotto la gronda in CSS;
* '''[[L'insegna|l'insegna]]''': <code>art/insegna.svg</code>, il cassonetto d'alluminio coi tubi al neon dentro le lettere «pzkko», e di notte <code>insegna-notte.svg</code>;
* '''[[La lamiera|la lamiera]]''': la foto della saracinesca ritagliata a un numero intero di doghe e specchiata in larghezza (<code>background-size: 2200px</code>);
* '''i fogli''': [[I volantini|i volantini]] (classe <code>.vol</code>), [[I manifesti e la roba degli altri|i manifesti]] (<code>.man</code>), i graffiti (<code>.tag</code>, in <code>multiply</code> sotto i fogli), i nastri e i resti strappati;
* '''le scritte sprayate''' «siti», «social», «games», «tools»: le intestazioni delle [[Le zone del muro|zone]] e gli anchor;
* '''per terra''': [[La roba per terra (2D)|la roba per terra]] e le scritte degli altri sulla lamiera.

== La misura ==
Ogni cosa sul muro è posizionata in assoluto in 1280esimi della parete (<code>--x</code>, <code>--y</code>, <code>--w</code>, <code>--r</code>; la parete è alta 3191 unità dal 22.10, era 2989) e, sotto i 900 px, in 390esimi (<code>--mx</code>, <code>--my</code>, <code>--mw</code>, <code>--mr</code>; alta 5486, era 5228). Su un tablet la parete non supera i 600 px e la lamiera riempie i lati. Le posizioni non si scrivono a mano: stanno nelle [[Le pile|pile]] di <code>tools/pzkko/disposizione.js</code> e le riscrive [[La disposizione|disponi.mjs]] (vedi [[La serranda]]).

== Cosa fa ==
* [[Come parte la home|Parte sempre in 2D]], con l'ora vera di Mantova, il meteo vero e senza suoni (dal 29.10.2026).
* [[La sera a Mantova|Alla sera]] cala il velo blu, l'insegna si accende, poi i lampioni; [[La strada di notte|di notte]] passano [[Le auto che passano|le auto]].
* [[Le mosche e le formiche del muro|Mosche e formiche]] camminano sui fogli e sulla lamiera, [[La goccia della condensa|la goccia]] cade dall'alto.
* Il foglio sotto il puntatore viene davanti a tutti (<code>z-index: 20</code>); sul telefono basta toccarlo.
* [[I tagliandi]] dei social si strappano e copiano il contatto.
* [[Ferma quando è ferma|A pagina ferma non lavora]]: dal 23.10 il filo della pagina dorme.
* Toccando un foglio si sente il suo materiale ([[Il suono della strada]]).

== I colori e i caratteri ==
Da DESIGN.md: pietra <code>#665d56</code>, asfalto <code>#3a3937</code>, lamiera <code>#8e8e8a</code>, inchiostro <code>#161616</code>, il marker rosso <code>#a50d25</code>, blu <code>#1446a0</code>, verde <code>#0b5d2b</code>, il giallo fuoco <code>#ffd400</code>. [[I caratteri del muro|I caratteri]]: Anton per i titoli, Special Elite per il corpo, Permanent Marker per le note a mano, Archivo Black per la seconda voce, e dal 21.10 altre sette stamperie.

== Dove è andato a finire il resto ==
[[La scena 3D]] è lo stesso muro in tre dimensioni: la pagina resta lì sotto, invisibile, coi suoi link. [[La 404]] e [[La storia del muro|la storia]] sono lo stesso muro rigenerato da <code>index.html</code>. Nel [[albertopecchini.it|sito serio]] il muro è il case study di pzkko, con la cattura vera e la Live Photo di Bologna.

{{Vedi anche|Pzkko.it|I volantini|La disposizione|La scena 3D|Le versioni di pzkko|Il muro (versione 2.0)}}
[[Categoria:Il muro]]`,
  },

  'La saracinesca di Bologna': {
    data: '2026-10-21',
    fonti: ['albertopecchini.it/pzkko/storia/index.html', 'albertopecchini.it/tools/pzkko/storia/storia.mjs', README],
    testo: `{{Infobox
| titolo = La saracinesca di Bologna
| immagine = /art/storia/foto-1.webp
| didascalia = la prima delle tre foto: la serranda della Coin in via Rizzoli
| dove = via Rizzoli, Bologna, un ingresso della Coin
| quando = domenica 22 settembre 2024, 12:28
| con = iPhone 16 Pro, da due giorni
| foto = tre scatti in cinque secondi, tutti Live Photo
| file = art/storia/foto-1…3.webp, live-1…3.mp4
}}
'''La saracinesca di Bologna''' è la serranda vera da cui è nato [[Il muro|il muro]] di [[pzkko.it]]: un ingresso della Coin in via Rizzoli, a un centinaio di metri dalle Due Torri, chiuso di domenica, con l'insegna «coin» sopra e i manifesti attaccati sotto.

== Il giorno ==
Domenica 22 settembre 2024 alle 12:28. [[Alberto Pecchini|Alberto]] era a Bologna per la prima volta, con Veronica, e aveva l'iPhone 16 Pro da due giorni (nei negozi dal 20 settembre). Tre scatti in cinque secondi, tutti Live Photo. I numeri che la pagina della storia stampa come uno scontrino vengono dai metadati delle foto (EXIF e QuickTime: ora, obiettivo, tempo, ISO, posizione, quota, direzione e velocità del GPS). I fatti di contorno da fonti pubbliche: la mostra DiscoBo del 21–22.09.2024 (dal volantino nella foto), la chiusura della Coin di via Rizzoli il 31.07.2025 (il Resto del Carlino), la ricetta del ragù depositata dall'Accademia Italiana della Cucina alla Camera di Commercio di Bologna il 17.10.1982 e rivista nel 2023.

== Cosa è passato dalla foto al muro ==
* [[L'insegna|l'insegna]]: le lettere a scatola della «coin» vera, misurate su IMG_0334 a piena risoluzione, sono diventate le lettere di «pzkko» ([[Le lettere dell'insegna]]);
* [[La lamiera|la lamiera]]: la foto della saracinesca è l'unica fotografia rimasta nella pagina;
* i manifesti sotto, la roba attaccata col nastro, i graffiti: reinventati da gpt-image-2 ([[Le immagini del muro]]).

== I file ==
<code>art/storia/</code>: <code>foto-1…3.webp</code> (1080 px) e <code>-m</code> (540 px), <code>live-1…3.mp4</code> (540 × 720, H.264, senza audio), i ritagli <code>insegna.webp</code>, <code>adesivo.webp</code>, <code>discobo.webp</code> e <code>og.jpg</code>, tutti senza metadati (niente GPS). Li fa <code>node tools/pzkko/storia/storia.mjs foto</code> dai file dell'iPhone (IMG_0334–0336, JPG più MOV, sul disco delle immagini di Alberto), e copia anche la prima foto con la sua Live Photo in <code>public/media/web/pzk-bologna*</code> per il fun fact del case study su [[albertopecchini.it]]. Serve ffmpeg.

{{Vedi anche|La storia del muro|Il muro|Le lettere dell'insegna|Bologna}}
[[Categoria:Il muro]]
[[Categoria:I luoghi]]`,
  },

  'La storia del muro': {
    data: '2026-10-23',
    fonti: ['albertopecchini.it/pzkko/storia/index.html', 'albertopecchini.it/tools/pzkko/genera-storia.mjs', 'albertopecchini.it/tools/pzkko/storia/disposizione.js', 'albertopecchini.it/tools/pzkko/storia/storia.mjs', README],
    testo: `{{Infobox
| titolo = La storia del muro
| immagine = storia.webp
| didascalia = pzkko.it/storia/: lo stesso muro, con un'altra parete
| dove = pzkko.it/storia/
| file = storia/index.html, generato da index.html
| dal = 20 ottobre 2026 (dal 21.10 come la home)
| pile = tools/pzkko/storia/disposizione.js
| voce della barra = storia (carta scontrino, carattere macchina)
}}
'''La storia del muro''' («com'è nato questo muro», pzkko.it/storia/) è il fun fact di [[pzkko.it]]: [[La saracinesca di Bologna|la saracinesca di riferimento è vera]], e la pagina lo racconta con le tre foto, le Live Photo, cosa è passato dalla foto al muro, i metadati come uno scontrino, «lo sapevi che…» e «e il ragù?», e sei meme bolognesi nello stile di [[Better Call Pekko]].

[[File:storia-intera.webp|thumb|left|la parete intera della storia]]

== Com'è fatta ==
Dal 21.10.2026 è la home con un altro muro, uno a uno: la stessa saracinesca coi fogli a [[Le pile|pile]] (cinque colonne sul computer, due sul telefono), [[La sera a Mantova|la sera di Mantova]], [[Le auto che passano|le auto]], [[Le mosche e le formiche del muro|le mosche]], [[La regia|la regia]], e dove c'è WebGL2 [[La scena 3D|la stessa scena 3D]] con l'arrivo dalla strada, [[Le foto del caricamento|le foto del caricamento]] sue (<code>storia-*</code>), [[Il meteo|il meteo]], [[Le bestie|le bestie]], [[La vetrina|la vetrina]]. Prima (dal 20.10) era una griglia che scorreva, senza scena né sera, e quella versione non è in Git. Dal 23.10, come la home, [[Come parte la home|parte in 2D]] e il resto si sceglie in regia, con le stesse scelte nello stesso browser.

<code>tools/pzkko/genera-storia.mjs</code> rifà <code>storia/index.html</code> da <code>index.html</code> (come <code>genera-404.mjs</code> per [[La 404|la 404]]) e tiene della storia solo i suoi pezzi, che stanno nella pagina fra i segni <code>storia:</code>: la testa (titolo, descrizione, og, dati strutturati), lo stile dei suoi fogli, la parete (<code>div class="parete storia"</code>), lo script delle Live Photo, l'altezza della parete e <code>FOTO</code>. I testi si cambiano lì; dopo ogni modifica alla home si rilancia il generatore (lo fa [[La serranda|serranda.mjs rifai]]). Le pile stanno in <code>tools/pzkko/storia/disposizione.js</code> (le chiavi sono gli id <code>#storia-…</code>) e le scrive <code>disponi.mjs --pagina=storia</code>; il passo è 1 e i fogli si sovrappongono solo sul margine bianco della carta, così si leggono fino in fondo. Sul computer la parete è alta almeno 2000 unità (3,2 m di saracinesca 3D). Sopra, [[L'insegna|l'insegna]] è un link che riporta al muro; il primo foglio in alto a sinistra («← torna al muro») e quello della fine portano alla home.

== I fogli ==
Tutti <code>.vol</code>, fotografati da <code>cattura.mjs</code> per la scena come [[I volantini|i volantini]] (<code>art/scena/vol/storia-*.webp</code>): i volantini su carta, le tre stampe con la Live Photo (<code>.stampa</code>, carta lucida anche in 3D), i tre confronti fra la foto e il muro (l'insegna, l'adesivo, la roba degli altri), lo scontrino dei metadati, «lo sapevi che…» e «e il ragù?», il banner di bologna 2.0 e i sei meme. Le scritte sprayate («com'è andata», «cosa è finito su pzkko») sono testo vero, <code>.it.foto</code>, e nella scena sono vernice chiara sulla lamiera. Attenzione: le misure in <code>cqw</code> stanno sui figli del foglio (<code>.carta</code> dello scontrino, <code>.banner</code>, i margini della foto), non sul foglio stesso: lo scontrino veniva alto 4937 unità.

== Le Live Photo ==
La foto ferma col tasto «LIVE» come sull'iPhone; il video parte al passaggio del mouse, tenendo premuto col dito o col tasto, e una volta da solo quando la foto entra per metà nello schermo (non col movimento ridotto; col 3D dopo l'arrivo della telecamera); finito, torna la foto. Nella scena 3D [[I fogli (scena)|fogli.js]] stende il video della pagina sopra la foto, dove <code>cattura.mjs</code> l'ha misurata (<code>live</code> in <code>vol.json</code>).

== I meme ==
<code>art/storia/meme/</code>: sei foto finte di [[Pekko]] in completi sgargianti (gli spaghetti rifiutati, la nonna col mattarello, il ragù, la Garisenda, la mortadella, il fotografo di saracinesche), [[gpt-image-2]] il 20.10.2026 con la fototessera come riferimento, come gli ingredienti di Better Call Pekko; le scritte sono HTML in Impact. Fino al 22.10 tre di loro stavano anche sul muro, sotto il volantino «da dove viene questo muro?»: tolti per far posto alla roba nuova (le immagini restano in <code>art/storia/muro/</code>).

== Sul muro ==
Ci porta il volantino «da dove viene questo muro?», subito sotto «chi sono» (colonna 0, sul computer e sul telefono), con la prima foto stampata sopra. E la voce '''storia''' della [[La barra in alto|barra]], su carta scontrino.

{{Vedi anche|La saracinesca di Bologna|Il muro|La 404|La serranda|Bologna}}
[[Categoria:Il muro]]`,
  },

  "L'insegna": {
    data: '2026-10-20',
    fonti: [INDEX, 'albertopecchini.it/pzkko/art/insegna.svg', 'albertopecchini.it/pzkko/art/insegna-notte.svg', 'albertopecchini.it/pzkko/scena/lettere.js', README],
    testo: `{{Infobox
| titolo = L'insegna
| immagine = home-notte.webp
| didascalia = l'insegna accesa, di notte, col velo blu sul muro
| file = art/insegna.svg, art/insegna-notte.svg (2D); scena/lettere.js (3D)
| lettere = quelle della «coin» vera di via Rizzoli (dal 20.10.2026)
| si accende = al tramonto preciso di Mantova
| h1 = il suo alt
}}
'''L'insegna''' è il cassonetto sopra la saracinesca del [[Il muro|muro]], con le lettere «pzkko» a scatola e i tubi al neon dentro. È <code>art/insegna.svg</code> (dal 17.10.2026): telaio d'alluminio, pannello bianco sporco, colature dal bordo alto, ruggine in basso, viti, le lettere, e le colature sul muro sotto il cassonetto. L'<code>h1</code> della pagina è il suo <code>alt</code>. Niente lampioni, cavi o scritte intorno. Niente chiocciola, niente rosso né blu: la chiocciola resta sull'adesivo della [[La favicon e l'og|favicon]].

== Le lettere ==
Dal 20.10.2026 (commit dc3ca8f, «pzkko nell'insegna con le lettere dell'originale, a scatola col neon dentro») «pzkko» ha le lettere della «coin» vera di [[La saracinesca di Bologna|via Rizzoli]]: faccia bianca traslucida col tubo al neon che si intravede dentro, bordino scuro, fianchi grigi, la barra dietro, l'ombra. Le tracce sono in <code>scena/lettere.js</code> e, uguali, nei due SVG. Le misure (la o un cerchio di 102 col buco di 43, il tratto 30, gli spazi 2, 7 e 9) sono spiegate in [[Le lettere dell'insegna]].

== Di notte ==
Al tramonto preciso di Mantova ([[La sera a Mantova]]) i neon dentro le lettere si accendono con uno strobo d'accensione, poi la luce tiene: si accende <code>art/insegna-notte.svg</code>, la stessa tela con dentro ogni lettera il tubo bianco caldo, la faccia che si scalda intorno a lui, gli elettrodi ai capi, la luce sul pannello; dal 23.10 si scarica solo la prima volta che si accende (<code>data-src</code>). Intorno un alone e un cono di luce in screen sul muro e sulla saracinesca. Le luci a scarica sfarfallano: la rete a 50 Hz fa pulsare i tubi a 100 Hz e il browser, campionando a 60, ne restituisce il tremolio; ogni tanto un tubo «sputa» (<code>--f-insegna</code>). Con <code>prefers-reduced-motion</code> niente sfarfallio né strobo. [[Il suono della strada|Il suono]]: il trasformatore che ronza a 50 Hz e il gas che sfrigola, una scintilla a ogni salto di luce.

== Nella scena 3D ==
Nella [[La scena 3D|scena]] l'insegna è il cassonetto d'alluminio largo 1,5 m, più stretto della saracinesca e centrato su di lei, appena sopra l'architrave, col pannello sporco (<code>art/scena/pannello.svg</code>, senza telaio né lettere) e davanti le lettere a scatola in ExtrudeGeometry; sopra il cassonetto il trasformatore del neon. Nella storia e nella [[La 404|404]] l'insegna è un link che riporta al muro.

{{Vedi anche|Le lettere dell'insegna|La sera a Mantova|Il muro|La saracinesca di Bologna}}
[[Categoria:Il muro]]`,
  },

  'La lamiera': {
    data: '2026-10-17',
    fonti: [INDEX, 'albertopecchini.it/pzkko/art/muro.webp.json', 'albertopecchini.it/tools/pzkko/scena/mappe.mjs', README],
    testo: `'''La lamiera''' è l'unica fotografia vera rimasta sul [[Il muro|muro]] di [[pzkko.it]]: <code>art/muro.webp</code>, la foto di una saracinesca ritagliata a un numero intero di doghe e specchiata in larghezza, così si ripete senza giunte (<code>background-size: 2200px</code>). Il 17.10.2026 tutto il resto sopra di lei è diventato SVG: [[L'insegna|l'insegna]] e il muro del palazzo (<code>art/intonaco.svg</code>, una piastrella di 640 px).

== Cosa ci sta sopra ==
[[I volantini]] e [[I manifesti e la roba degli altri|i manifesti]] attaccati col nastro, i graffiti in <code>multiply</code> (la vernice che si moltiplica col metallo: l'inchiostro resta nero e si legge), [[La roba per terra (2D)|gomme schiacciate e le scritte degli altri]] (<code>art/strada2/</code>: «ti amo giulia», «NO», «ciao mamma», «w la pizza», «zio», «qui»), le cinque [[Le mosche e le formiche del muro|formiche]] lungo il bordo basso, [[La goccia della condensa|il rivolo della goccia]]. Di notte la lamiera si spegne sotto il velo blu, e riflette le luci: <code>.muro::after</code> è la stessa foto a contrasto alto, in screen, mascherata dove battono lampioni e fari ([[Le auto che passano]]).

== Nella scena 3D ==
Per la [[La scena 3D|scena]] la foto è stata smontata: <code>art/scena/lamiera.webp</code> e <code>lamiera-r.webp</code> sono il colore e la rugosità della saracinesca, tirati fuori da <code>muro.webp</code> togliendole la luce (<code>tools/pzkko/scena/mappe.mjs</code>). Le doghe lì sono poligoni bombati col canale al giunto e qualche ammaccatura (6000 triangoli), con la vernice che è la foto senza la sua luce e la rugosità dove c'è sporco e ruggine ([[Il posto]]). Nella [[Il muro bagnato|lamiera bagnata]] i giunti delle doghe trattengono il rivolo. Toccandola nuda si sente il tonfo delle nocche e il rombo grave del telo di doghe, più secca in basso (la barra chiusa col [[Il lucchettone|lucchettone]]), più rimbombante a metà, più ballerina in alto ([[I corpi percossi]]).

== Le misure ==
Nella scena 1 unità della parete = 1,6 mm: la saracinesca è larga 2,05 m sul computer e 0,95 m sul telefono (alta ~13,4 m: i volantini restano grandi come quelli veri, ~45 cm). Le doghe si contano dal giunto in cima al rotolo (H + 30 cm): fino al 20.10 carta e graffiti le contavano da H, sfasati di 0,4 doghe, e la lamiera li bucava a strisce.

{{Vedi anche|Il muro|Le immagini del muro|Il posto|Il muro bagnato}}
[[Categoria:Il muro]]
[[Categoria:Le immagini]]`,
  },

  'I volantini': {
    data: '2026-10-26',
    fonti: [INDEX, 'albertopecchini.it/tools/pzkko/disposizione.js', 'albertopecchini.it/tools/pzkko/serranda.mjs', README, 'DESIGN.md'],
    testo: `{{Infobox
| titolo = I volantini
| immagine = home-giorno.webp
| didascalia = i volantini del muro: carta fotografata, testo vero sopra
| classe = .vol
| carta = .c-bianco, .c-giallo… (art/carta/, nove fogli vuoti)
| titoli = Anton; corpo Special Elite; note a mano Permanent Marker
| misura = in cqw del volantino
| si aggiungono con = serranda.mjs volantino
}}
'''I volantini''' sono i fogli del [[Il muro|muro]] che portano da qualche parte: ogni sito, social, gioco e strumento di [[Alberto Pecchini|Alberto]] è un volantino attaccato col nastro alla [[La lamiera|lamiera]]. Un volantino (<code>.vol</code>) è un foglio fotografato (<code>.c-bianco</code>, <code>.c-giallo</code>… con la sua proporzione e i bordi veri della carta misurati: [[Le carte dei volantini]]) e sopra il testo vero in HTML, misurato in <code>cqw</code> del volantino: Anton per i titoli, Special Elite per il corpo, Permanent Marker per le note a mano, Archivo Black per la seconda voce ([[I caratteri del muro]]). L'illustrazione è solo inchiostro (<code>art/arte*/</code>) e si stampa sulla carta con <code>mix-blend-mode: multiply</code>. Il volantino cresce se il testo è più lungo della carta. Il link copre tutto il foglio (<code>h3 a::after</code>); al passaggio il foglio si solleva, e nella [[La scena 3D|scena 3D]] si alza di 2 cm con una molla.

== Quali ci sono ==
Nelle quattro [[Le zone del muro|zone]]:
* '''siti''' ([[I siti in cima]], dal 17.10.2026): [[albertopecchini.it]] (carta didone, Abril Fatface), [[Better Call Pekko|bettercallpekko.it]], [[rivaltasulmincio.it]], [[cascinafontana.xyz]] (titolo bruciato in Shrikhand), [[Il volantino «ti serve un sito?»|«ti serve un sito?»]] (Bungee), e quello dell'[[Ing. Dario Donelli]], che non è un link («presto online»: aspetta il suo dominio);
* '''social''': instagram, github, whatsapp, e-mail, paypal, e dal 21.10 [[TikTok sul muro|tiktok]] (Rubik Mono One); finiscono coi [[I tagliandi|tagliandi]]; [[Vendo il ciao|«vendo il ciao»]] è un annuncio vero (Alfa Slab One);
* '''games''': roulette, blackjack, mine (stencil Black Ops One), dado, moneta, virtual: aprono [[La finestra dei giochi|la finestra]] sopra il muro;
* '''tools''': [[pzk$meeting]], il primo strumento (dal 21.10; prima il foglio diceva «cercasi strumenti»).
Più «chi sono» e «da dove viene questo muro?» ([[La storia del muro]]) nella colonna 0.

== Le altre tipografie ==
Dal 21.10 non tutti i volantini escono dalla stessa stamperia: una classe <code>t-*</code> sull'<code>article</code> cambia il carattere del titolo (<code>--fa</code>) e la sua misura (<code>--ts</code>: Anton è stretto, gli altri no); <code>m-sale</code> scrive le note a mano in Rock Salt («ti serve un sito?», dado, «vendo il ciao»). Cambiando carattere cambia l'altezza del volantino: poi <code>serranda.mjs rifai</code>.

== In primo piano ==
I fogli nuovi coprono i vecchi, ma il volantino sotto il puntatore viene davanti a tutti (<code>z-index: 20</code>); sul telefono basta toccarlo (lo script gli mette <code>.sopra</code>).

== Le misure e le foto ==
Dopo ogni cambio di testo si rimisurano le altezze vere dei fogli (crescono col testo) e si rifanno [[Le pile|le pile]] (<code>disponi.mjs</code>). [[Ferma quando è ferma|Dal 23.10]] la misura (<code>adatta</code>, <code>fette</code>) legge tutto e poi scrive tutto (prima erano ~240 impaginazioni all'apertura, 0,16 s fermi sul telefono) e tiene spenta la transizione dei fogli mentre li raddrizza. Per [[La scena 3D|la scena 3D]] i volantini sono fotografati da <code>cattura.mjs</code> in <code>art/scena/vol/</code> (computer, 2 px per unità, ~1,3 MB) e <code>vol-m/</code> (telefono, ~0,8 MB): [[Le foto dei volantini]]. Due fogli con lo stesso nome fermano <code>cattura.mjs</code>.

== Aggiungerne uno ==
<code>node tools/pzkko/serranda.mjs volantino --titolo="…" --testo="…" --link=… --zona=games --carta=giallo --arte=arte2/dadi</code>: va nella colonna più corta, sul computer e sul telefono ([[La serranda]]). Le immagini devono già stare in <code>art/</code> ([[Le immagini del muro]]).

{{Vedi anche|I tagliandi|Le carte dei volantini|I caratteri del muro|Le zone del muro|La serranda|I manifesti e la roba degli altri}}
[[Categoria:Il muro]]`,
  },

  'I tagliandi': {
    data: '2026-10-23',
    fonti: [INDEX, README],
    testo: `'''I tagliandi''' sono la fila di strisce da strappare in fondo ai [[I volantini|volantini]] dei social del [[Il muro|muro]]: fette della stessa carta, come negli annunci attaccati ai pali. Lo script dà a ogni tagliando il suo pezzo di foglio come sfondo; toccarne uno lo strappa, copia il contatto negli appunti e lascia il buco col muro dietro; una nota a pennarello dice «copiato» (carattere Permanent Marker, <code>max(16px, 9cqw)</code>, rosso <code>#a50d25</code> su bianco all'85 %). Con <code>prefers-reduced-motion</code> lo strappo è immediato. Il tagliando è alto <code>max(44px, 17cqw)</code> (46 sul telefono).

== Quali ==
Instagram @albertoxpecchini, GitHub, WhatsApp +39 351 0355506, e-mail pzkko@yahoo.com, PayPal; dal 21.10.2026 i tagliandi di [[TikTok sul muro|tiktok]] e quelli col numero di [[Vendo il ciao|«vendo il ciao»]]. Il volantino giallo «all my sites & socials» coi tagliandi «pzkko.it» (uno strappato) è anche il banner di pzkko.it su [[Better Call Pekko]], disegnato in Claude Design («TEAR 1 OFF!!!»).

== Nella scena 3D ==
Nella [[La scena 3D|scena]] i volantini coi tagliandi hanno la fascia tolta e '''ogni tagliando è un foglietto suo''', che cade quando la pagina gli mette <code>.cade</code> e sparisce con <code>.via</code> ([[I fogli (scena)]]). Le ombre si rifanno quando un tagliando cade. [[Ferma quando è ferma|Dal 23.10]] le fette non si misurano più a metà giro: la misura aspetta che i fogli siano dritti.

== Il suono ==
Il tagliando si strappa anche all'orecchio: «le mani» di [[Il suono della strada]].

{{Vedi anche|I volantini|Il muro|TikTok sul muro}}
[[Categoria:Il muro]]`,
  },

  'Le carte dei volantini': {
    data: '2026-10-21',
    fonti: [INDEX, 'albertopecchini.it/tools/pzkko/fogli.js', 'albertopecchini.it/tools/pzkko/immagini.mjs', README],
    testo: `'''Le carte dei volantini''' sono i nove fogli vuoti di <code>art/carta/</code>, fotografati con nastro e graffette, su cui [[Il muro|il muro]] stampa i testi veri dei [[I volantini|volantini]]: carta bianca, gialla, scontrino, cartone, post-it, rosa, quaderno, grigia… ognuna con la sua proporzione (<code>--ar</code>) e i bordi veri misurati, così il testo sta dentro il foglio e non sul nastro. Sono nate il 9.10.2026 con [[gpt-image-2]] su Replicate, in [[I fogli di gpt-image-2|fogli]] 3 × 3 su fondo magenta, ritagliate da <code>tools/pzkko/immagini.mjs</code> (prompt in <code>tools/pzkko/fogli.js</code>); lo scotch resta traslucido, il cartoncino crema diventa trasparente. Ogni WebP porta dentro il prompt con cui è nato; le misure stanno in <code>art/pezzi.json</code>.

== Chi le usa ==
* i volantini (<code>.c-bianco</code>, <code>.c-giallo</code>…), che crescono col testo (la carta si stira un po');
* le voci della [[La barra in alto|barra]]: ogni pezzo di carta strappato ha la sua carta (scontrino, cartone, post-it, rosa, quaderno, bianca, grigia);
* [[La finestra dei giochi|le finestre dei giochi]] e [[La regia|la regia]]: un foglio grande attaccato al muro col nastro (quello della roulette, capovolto per dado e moneta);
* [[Gli strumenti di pzkko|le pagine degli strumenti]] e le pagine della barra (<code>barra/pagina.css</code>, il foglio col nastro).

== Il suono ==
Toccato, un foglio schiocca contro la lamiera col suo materiale (<code>data-suono</code>): la carta, la carta lucida dei poster, il cartoncino del dentista, lo scontrino termico che crocchia, l'asse di legno delle zucche, il cartello di lamiera smaltata ([[I corpi percossi]]). La carta lucida (<code>c-lucido</code>) nella [[La scena 3D|scena]] ha la vernice (clearcoat).

{{Vedi anche|I volantini|Le immagini del muro|I fogli di gpt-image-2|I caratteri del muro}}
[[Categoria:Il muro]]
[[Categoria:Le immagini]]`,
  },

  'I caratteri del muro': {
    data: '2026-10-22',
    fonti: [INDEX, 'DESIGN.md', README],
    testo: `'''I caratteri del muro''' sono i font di [[pzkko.it]], serviti da <code>fonts/</code> (solo il sottoinsieme latino, 13–59 KB l'uno, da Google Fonts):

{| class="wikitable"
! carattere !! licenza !! dove
|-
| Anton || SIL OFL || i titoli dei volantini (<code>max(26px, 18cqw)</code>, interlinea 0,95), il titolo di [[Pzkkopedia|pzkkopedia]], le cifre della [[La roulette|roulette]] e del [[Il blackjack|blackjack]]
|-
| Archivo Black || SIL OFL || la seconda voce dei volantini («forte»)
|-
| Special Elite || Apache 2.0 || il corpo dei volantini (<code>max(12px, 5.4cqw)</code>), il testo della pagina, il marciapiede
|-
| Permanent Marker || Apache 2.0 || le note a mano, gli handle, i tagliandi, «copiato»
|-
| Abril Fatface || SIL OFL || <code>t-didone</code>: il volantino di [[albertopecchini.it]] (dal 21.10)
|-
| Shrikhand || SIL OFL || <code>t-tondo</code>: [[cascinafontana.xyz]], col titolo bruciato
|-
| Bungee || SIL OFL || <code>t-insegna</code>: [[Il volantino «ti serve un sito?»|«ti serve un sito?»]], la voce wiki della barra
|-
| Black Ops One || SIL OFL || <code>t-stencil</code>: [[Le mine|mine]], la voce gadget della barra
|-
| Rubik Mono One || SIL OFL || <code>t-mono</code>: [[TikTok sul muro|tiktok]]
|-
| Alfa Slab One || SIL OFL || <code>t-slab</code>: [[Vendo il ciao|«vendo il ciao»]]
|-
| Rock Salt || Apache 2.0 || <code>m-sale</code>: le note a mano di «ti serve un sito?», dado, «vendo il ciao»
|-
| Caveat, Reenie Beanie, Nothing You Could Do (OFL), Homemade Apple (Apache 2.0) || || le calligrafie delle [[Le firme della petizione|firme della petizione]] (22.10, 16–51 KB, scaricati solo quando servono)
|-
| Fake Receipt || || [[Il banner del wallet|il pannello a led del wallet]] e [[La chat col bot|la chat]]: [[Il font Fake Receipt]]
|-
| Cascadia Code || OFL || il codice dell'app [[Codice C (app)|codice C]] ([[Cascadia Code]])
|}

Cambiando il carattere di un titolo cambia l'altezza del volantino: poi <code>serranda.mjs rifai</code> ([[La serranda]]). I testi sono tutti in minuscolo, come sul [[albertopecchini.it|sito principale]]. Le licenze sono dichiarate in [[I crediti di pzkko]].

{{Vedi anche|I volantini|Le carte dei volantini|Le licenze}}
[[Categoria:Il muro]]`,
  },

  'I manifesti e la roba degli altri': {
    data: '2026-10-22',
    fonti: [INDEX, 'albertopecchini.it/tools/pzkko/fogli.js', README],
    testo: `[[File:home-intera.webp|thumb|in mezzo ai volantini, i manifesti e le cose attaccate con lo scotch]]
'''I manifesti e la roba degli altri''' sono i fogli del [[Il muro|muro]] che non portano da nessuna parte: manifesti interi inventati, meme, cartoline, cose attaccate con lo scotch, come su un muro di città. Sono <code>.man</code> (si alzano al passaggio come i volantini) e stanno fra i fogli nelle [[Le pile|pile]]; i graffiti (<code>.tag</code>) stanno sotto. Tutti disegnati da [[gpt-image-2]] ([[Le immagini del muro]]), a fogli:

* '''manifesti1 e 2''' (9.10.2026): otto manifesti interi che riempiono il muro: il concerto della chiocciola, il gatto che risponde al nome di git… sono finzione, non annunci;
* '''manifesti3 e 4''' (17.10): la roba degli altri in cima: [[Il meme unimore contro unibo|il meme unimore contro unibo]], lyca mobile contro tim, l'avvistamento starlink, moncler, brat (dal 17.10 il manifesto brat apre brat animator), la cartolina di piazza tre torri, le frisk attaccate con lo scotch, il biglietto del parcheggio di Milano;
* '''manifesti5''' (21.10): la chiocciola a cui red bull mette le ali, il brick di estathé attaccato con lo scotch, l'eastpak scarabocchiato, il cartello di fragole, mirtilli e lamponi; e <code>landini/</code>, [[Il manuale del Landini|il libretto del Landini L 25]];
* '''manifesti6''' (22.10, al posto dei tre meme della storia): il cartello delle zucche mantovane dipinto su un'asse, il cartello stradale di Rivalta sul Mincio rubato e appeso col fil di ferro, il promemoria del dentista con l'appuntamento vero, l'offerta della Epson EcoTank ET-2825;
* '''manifesti7''': la pubblicità dell'iPhone Duo «da 3625 $», che non esiste, lo scontrino di Tecnomat delle due stufe a legna da 1.803,10 €, il corso di potatura dei bonsai, la gita in pullman «verona e l'arena tour»;
* '''manifesti8''': tre manifesti inventati: «MODENA e l'assalto al supermercato», il film; la protesta francese contro il carovita; «GEN. VANNACCI AL POTERE?», solo scritte e un berretto: niente facce né simboli di partito.

I marchi e i nomi veri su quei manifesti (Moncler, Frisk, Lyca Mobile, TIM, Starlink, brat, Unimore, Unibo, Red Bull, Estathé, Eastpak, Landini, Epson, Apple, Tecnomat) sono quelli che si trovano su un muro di città, disegnati dal modello: non sono pubblicità né collaborazioni. Molte di queste cose sono finite anche nello [[Lo shop|shop]] della chat (estathé, i grissini, l'eastpak, il Landini, la Epson, l'iPhone Duo, la stufa, i bonsai: [[Elenco degli oggetti]]).

== Il suono ==
Toccato, ogni pezzo schiocca col suo materiale: il cartoncino del dentista, lo scontrino termico che crocchia, l'asse delle zucche, il cartello stradale di lamiera smaltata che ondeggia sul fil di ferro ([[I corpi percossi]]).

{{Vedi anche|I volantini|Le immagini del muro|Gli adesivi degli amici|Il meme degli auguri}}
[[Categoria:Il muro]]
[[Categoria:Le immagini]]`,
  },

  'Le zone del muro': {
    data: '2026-10-21',
    fonti: [INDEX, 'albertopecchini.it/tools/pzkko/disposizione.js', README, 'PRODUCT.md'],
    testo: `'''Le zone del muro''' sono le quattro parole sprayate sulla [[La lamiera|lamiera]] che fanno da intestazioni e da anchor: '''siti''', '''social''', '''games''', '''tools''' (<code>art/scritte/</code> e <code>scritte2/</code>). PRODUCT.md le aveva pensate come le due zone «tools» e «games» di un link-in-bio, vuote con uno stato vuoto curato (7.10.2026); il 17.10 la saracinesca si è allungata verso l'alto e la zona siti è andata in cima ([[I siti in cima]]).

* '''siti''': un volantino per sito, che si apre in una scheda nuova ([[albertopecchini.it]], [[Better Call Pekko|bettercallpekko.it]], [[rivaltasulmincio.it]], [[cascinafontana.xyz]], [[Il volantino «ti serve un sito?»|«ti serve un sito?»]], e quello non cliccabile dell'[[Ing. Dario Donelli]]); in mezzo [[I manifesti e la roba degli altri|la roba degli altri]];
* '''social''': instagram, github, whatsapp, e-mail, paypal, [[TikTok sul muro|tiktok]] coi [[I tagliandi|tagliandi]], e [[Vendo il ciao|«vendo il ciao»]];
* '''games''': i sei [[I giochi|giochi]], che aprono [[La finestra dei giochi|la finestra]] sopra il muro (<code>#roulette</code> nell'indirizzo la apre subito);
* '''tools''': [[pzk$meeting]], e i prossimi ([[Gli strumenti di pzkko]]).

Fuori dalle zone: «chi sono» e «da dove viene questo muro?» nella colonna 0, [[Il wallet|il wallet]] avvitato in cima alla prima pila e [[Il tasto sul muro|il cercapersone]] appeso in cima alla seconda (dal 26.10), [[La petizione|la petizione]] nella quinta colonna sul computer e nella seconda sul telefono. Le zone si danno a un volantino nuovo con <code>--zona=siti|social|games|tools</code> di [[La serranda|serranda.mjs]].

{{Vedi anche|Il muro|I volantini|Le pile|I siti in cima}}
[[Categoria:Il muro]]`,
  },

  'I siti in cima': {
    data: '2026-10-17',
    fonti: [INDEX, 'albertopecchini.it/tools/pzkko/disposizione.js', README],
    testo: `'''I siti in cima''' sono la zona ''siti'' del [[Il muro|muro]], arrivata il 17.10.2026 col commit ae76bda («il muro più alto coi siti in cima, la roulette 3D in una finestra, via le immagini che non servono»): la saracinesca si è allungata verso l'alto e le cose nuove stanno sopra. Un [[I volantini|volantino]] per sito, che si apre in una scheda nuova:

{| class="wikitable"
! volantino !! carattere !! dove porta
|-
| alberto pecchini || Abril Fatface (<code>t-didone</code>) || [[albertopecchini.it]], il sito serio
|-
| better call pekko || || [[Better Call Pekko|bettercallpekko.it]], l'assistenza informatica del 2008
|-
| rivalta sul mincio || || [[rivaltasulmincio.it]], la Pro Loco
|-
| cascina fontana || Shrikhand, titolo bruciato (<code>t-tondo</code>) || [[cascinafontana.xyz]]
|-
| ti serve un sito? || Bungee (<code>t-insegna</code>), note in Rock Salt || [[Il volantino «ti serve un sito?»|la pagina dei contatti di albertopecchini.it]]
|-
| ing. dario donelli || || non è un link: «presto online», aspetta il suo dominio ([[Ing. Dario Donelli]])
|}

Le illustrazioni dei volantini dei siti sono <code>art/arte3/</code> (17.10). In mezzo, [[I manifesti e la roba degli altri|la roba degli altri]] (manifesti3 e 4). Lo stesso giorno i siti sono entrati anche nel portfolio di albertopecchini.it («cinque siti, tutti online», 7788d64) e il 18.10 fra i siti di Pekko. Le catture di tutti e cinque si rifanno da sole ogni ora ([[Le catture dei siti (workflow)]]).

{{Vedi anche|Le zone del muro|I volantini|I siti di Alberto|Il credito nei siti dei clienti}}
[[Categoria:Il muro]]
[[Categoria:I siti di Alberto]]`,
  },

  'Il volantino «ti serve un sito?»': {
    data: '2026-10-21',
    fonti: [INDEX, README],
    testo: `'''Il volantino «ti serve un sito?»''' sta nella zona [[I siti in cima|siti]] del [[Il muro|muro]] ed è l'unico che vende qualcosa: porta alla pagina dei contatti di [[albertopecchini.it]] (<code>/contatti/</code>), dove c'è il modulo, il telefono su un iPhone 18 Pro vettoriale e la carta dell'area operativa. Il titolo è in Bungee (<code>t-insegna</code>, dal 21.10.2026, come una scritta d'insegna), le note a mano in Rock Salt (<code>m-sale</code>). È il ponte fra il sito giocoso e quello serio: su albertopecchini.it lo stesso invito è l'hero («Servono tre professionisti.» sbarrato col pennarello minio, «Ne basta uno.»).

{{Vedi anche|I siti in cima|albertopecchini.it|Alberto Pecchini}}
[[Categoria:Il muro]]`,
  },

  'Vendo il ciao': {
    data: '2026-10-21',
    fonti: [INDEX, 'albertopecchini.it/tools/pzkko/amici.mjs', README],
    testo: `'''Vendo il ciao''' è un annuncio vero sul [[Il muro|muro]] (21.10.2026): [[Alberto Pecchini|Alberto]] vende la sua Piaggio Ciao. Il volantino (Alfa Slab One, <code>t-slab</code>, le note in Rock Salt) ha stampata sopra la foto vera della Ciao (<code>art/annunci/ciao.webp</code>), il link a WhatsApp col messaggio già scritto e [[I tagliandi|i tagliandi]] col numero.

La foto viene dal CR2 della Canon EOS 4000D: <code>tools/pzkko/amici.mjs ciao</code> prende il JPEG a piena risoluzione dentro il raw (5184 × 3456: la macchina era di traverso e l'anteprima non lo sa, si gira di 270°), senza metadati ([[Le foto vere]]). La Ciao è anche un oggetto dello [[Lo shop|shop]] («Ciao PX», [[Elenco degli oggetti]]) e il mestiere [[Meccanico]] «rimette in moto un Ciao del 1979».

{{Vedi anche|Le foto vere|TikTok sul muro|I tagliandi}}
[[Categoria:Il muro]]`,
  },

  'TikTok sul muro': {
    data: '2026-10-21',
    fonti: [INDEX, README],
    testo: `'''TikTok sul muro''' è il volantino di @albertoxpecchini arrivato il 21.10.2026 nella zona ''social'' del [[Il muro|muro]], sotto «instagram», coi suoi [[I tagliandi|tagliandi]]. Il titolo è in Rubik Mono One (<code>t-mono</code>), l'illustrazione in <code>art/arte4/</code>. I social confermati il 7.10.2026 erano cinque (Instagram, GitHub, WhatsApp, e-mail, PayPal); TikTok è il sesto. Il [[Il regalo di Instagram|regalo di Instagram]] (+1000 $pzk a chi segue) non ha un gemello su TikTok.

{{Vedi anche|I volantini|I tagliandi|Vendo il ciao}}
[[Categoria:Il muro]]`,
  },

  'Gli adesivi degli amici': {
    data: '2026-10-21',
    fonti: ['albertopecchini.it/tools/pzkko/amici.mjs', INDEX, README],
    testo: `'''Gli adesivi degli amici''' sono le foto vere attaccate al [[Il muro|muro]] dal 21.10.2026: <code>art/amici/</code>, [[Alberto Pecchini|Alberto]] e i suoi amici scontornati da [[bria/remove-background]], col bordo bianco dell'adesivo fustellato. Quello sul Landini all'aratura è una foto di simo4gantos8, che firma l'adesivo (il credito è stampato sopra, <code>amici.mjs credito</code>).

Sul muro sono <code>.man</code> (si alzano al passaggio come [[I manifesti e la roba degli altri|i manifesti]]): cinque stanno in fondo alle [[Le pile|pile]], <code>amici/jager</code> è attaccato sopra il manifesto punk. Mai sopra [[I volantini|i volantini]] veri, che sono link. Come si fanno: [[Le foto vere]]. Le foto restano sul disco di Alberto, qui solo i ritagli, senza metadati.

{{Vedi anche|Le foto vere|Vendo il ciao|Le immagini del muro}}
[[Categoria:Il muro]]
[[Categoria:Le immagini]]`,
  },

  'Il meme degli auguri': {
    data: '2026-10-18',
    fonti: [INDEX, README],
    testo: `'''Il meme degli auguri''' (<code>art/auguri.webp</code>) è il meme degli auguri a @~matti del 17.10.2026 (commit cd5f912): torta e scritte disegnate tutte da [[gpt-image-2]]. Si apriva entrando nella home di [[pzkko.it]] fino al 18.10.2026 alle 20:30, poi lo script lo toglieva da solo; dopo, il file si può cancellare. Lo stesso giorno la «×» per chiuderlo è stata rifatta in Archivo Black e poi col token <code>--fb</code> (commit c70cd56). È stato il primo «evento a tempo» del muro, prima dello [[Lo scontrino delle novità|scontrino delle novità]].

{{Vedi anche|Le immagini del muro|Lo scontrino delle novità}}
[[Categoria:Il muro]]`,
  },

  'La petizione': {
    data: '2026-10-22',
    fonti: ['albertopecchini.it/pzkko/petizione/petizione.js', 'albertopecchini.it/pzkko/petizione/petizione.css', 'albertopecchini.it/pzkko/petizione/firme.js', 'albertopecchini.it/pzkko/api/firme.mjs', 'albertopecchini.it/tools/pzkko/firme.mjs', INDEX, README],
    testo: `{{Infobox
| titolo = La petizione
| immagine = petizione.webp
| didascalia = il foglio della petizione avvicinato, con le penne e le firme
| dal = 22 ottobre 2026
| dove = #petizione: la quinta colonna sul computer, la seconda sul telefono
| file = petizione/petizione.js, petizione.css, firme.js; api/firme.mjs
| le firme = vere, sul server dei dati di Alberto (pzkko/firme.json)
| penne = tre bic cristal legate allo spago: blu, nera, rossa
}}
'''La petizione''' «petizione popolare · pzkko.it è un bel sito?» è un foglio A4 stampato sul [[Il muro|muro]], con la tabella (n., nome e cognome, data, ora, firma) e sotto [[Le penne della petizione|tre bic cristal]] legate allo spago e attaccate al foglio con lo scotch, che dondolano al passaggio del puntatore. È arrivata il 22.10.2026 col commit 7eae16a. '''Le firme sono vere''' e le vede chiunque apra la pagina.

== Sul foglio del muro ==
Le ultime dieci firme, scritte a mano da <code>petizione/firme.js</code> su una tela (<code>.pet-firme</code>, in multiply come l'inchiostro): ognuna con la sua calligrafia (Caveat, Reenie Beanie, Nothing You Could Do, Homemade Apple), un po' storta, la data e l'ora di Mantova e uno scarabocchio per firma, tutti decisi dall'id della firma (uguali per tutti); il colore è quello della bic scelta.

== Da vicino ==
Toccando il foglio (o una penna) '''si stacca dal muro e si avvicina''': il foglio grande è già della sua misura finale e parte rimpicciolito e storto sopra quello del muro (FLIP: solo transform e opacity, composti dalla scheda grafica), così resta nitido e non scatta; [[La scena 3D|la scena 3D]] sotto, a volo finito, si riposa fino al ritorno. Sul foglio da vicino scorrono le ultime 60 firme, la riga nuova è evidenziata: si sceglie la penna, si scrive il nome e la penna '''va a scrivere davvero''': lo spago si allenta e si tende, il cappuccio della nera e della rossa salta via, la punta segue la scrittura (il nome, la data, l'ora, lo scarabocchio, ognuno col suo tempo e il suo suono), poi la penna torna a dondolare, «grazie! hai firmato alle…» a pennarello e il foglio torna al muro con la firma nuova in fondo. Il browser ricorda chi ha firmato (<code>pzkko-firma</code>): la sua riga è ripassata con l'evidenziatore, e c'è «firma per un'altra persona». Senza server (<code>offline</code>) il foglio si vede ma non si firma. <code>pzkko.it/#petizione</code> lo apre da solo. Gli strumenti che fotografano la pagina non caricano il modulo (<code>?petizione</code> sì): la foto del foglio per la scena è vuota e le firme le scrive la scena dal vivo.

== Il suono ==
Il foglio che si stacca e torna, le penne che si urtano, il cappuccio che salta via e torna con un clic, la biro che scrive (lo sfrigolio della sfera mosso dai tratti, il tamburo della carta sulla lamiera; la firma più veloce, a occhielli): [[Il suono della strada]].

== Il server ==
Le salva <code>api/firme.mjs</code> ([[Le firme (API)]]): dal 28.10 in un JSON (<code>pzkko/firme.json</code>) sul [[Il server dei dati in casa|server dei dati di Alberto]] (prima su [[Vercel Blob]]), riscritto solo se l'ETag è ancora quello. Protezioni: campo trappola, 2,5 s minimi da quando il foglio si è avvicinato, al massimo 2 firme in 10 minuti e 6 al giorno per IP, lo stesso nome una volta al giorno, 120 firme l'ora in tutto, nomi di 2–32 lettere senza link, numeri di telefono, emoji né parolacce (anche camuffate), 5000 firme al massimo; a chi guarda vanno le ultime 300. Moderazione: <code>node tools/pzkko/firme.mjs</code> elenca, <code>via <id></code> cancella (con <code>FIRME_ADMIN_KEY</code>).

== Nelle pile ==
Le penne sporgono ~180 unità sul computer e ~130 sul telefono: nella [[Le pile|pila]], subito sotto, va un graffito o un manifesto degli altri, mai un volantino vero (le penne coprirebbero il link). La petizione è anche una [[Le side quest|side quest]] («La petizione»: tre firme prima del tramonto) e un oggetto dello [[Lo shop|shop]].

{{Vedi anche|Le penne della petizione|Le firme della petizione|Le firme (API)|Il server dei dati in casa}}
[[Categoria:Il muro]]`,
  },

  'Le penne della petizione': {
    data: '2026-10-22',
    fonti: ['albertopecchini.it/pzkko/petizione/petizione.js', 'albertopecchini.it/pzkko/scena/penne.js', 'albertopecchini.it/tools/pzkko/penne.mjs', README],
    testo: `'''Le penne della petizione''' sono le tre bic cristal legate allo spago sotto [[La petizione|il foglio della petizione]]: la blu senza cappuccio, la nera e la rossa coi cappucci. Sul [[Il muro|muro]] 2D sono immagini di <code>art/penne/</code>: le tre bic legate, più la nera e la rossa senza cappuccio e i cappucci a parte, che fa <code>tools/pzkko/penne.mjs</code> dalla punta della blu (le misure in <code>penne.json</code>); dondolano al passaggio del puntatore. Quando si firma, la penna scelta va a scrivere: lo spago si allenta e si tende, il cappuccio salta via, la punta segue il nome.

Nella [[La scena 3D|scena 3D]] (<code>scena/penne.js</code>, 22.10) sono modelli: il fusto esagonale trasparente col tubetto dentro, il tappino, la punta con la sfera d'ottone, il cappuccio con la clip, appese allo spago con le misure del CSS della pagina; mesh a istanze, una per materiale: tre penne in cinque chiamate di disegno. Ognuna è un pendolo smorzato: il vento vero ([[Il meteo]]) le fa dondolare e staccare un filo dalla lamiera, il puntatore che ci passa sopra le spinge, il foglio che si alza le scuote; si appoggiano alle doghe. Mentre si muovono le ombre si rifanno. Mentre il foglio è avvicinato per firmare, nella scena spariscono foglio e penne (evento <code>pzkko-petizione</code>). Le tre bic sono anche un oggetto dello [[Lo shop|shop]] («penne BIC»).

{{Vedi anche|La petizione|Le firme della petizione|Le cose che si toccano}}
[[Categoria:Il muro]]`,
  },

  'Le firme della petizione': {
    data: '2026-10-28',
    fonti: ['albertopecchini.it/pzkko/petizione/firme.js', 'albertopecchini.it/pzkko/api/firme.mjs', 'albertopecchini.it/tools/pzkko/firme.mjs', README],
    testo: `'''Le firme della petizione''' sono vere: chi firma [[La petizione|la petizione]] «pzkko.it è un bel sito?» lascia nome, data e ora di Mantova e il colore della bic, e tutti li vedono. Le scrive a mano <code>petizione/firme.js</code>, dal server, per tre posti: il foglio del muro (le ultime dieci), [[La scena 3D|la scena 3D]] (sopra la foto del foglio, dove <code>cattura.mjs</code> ha misurato la tabella: <code>firme</code> in <code>vol.json</code>) e il foglio da vicino (le ultime 60). Ogni firma ha la sua calligrafia fra quattro (Caveat, Reenie Beanie, Nothing You Could Do, Homemade Apple), è un po' storta e finisce con uno scarabocchio, tutto deciso dall'id della firma, così è uguale per chiunque la guardi.

Le salva <code>api/firme.mjs</code> ([[Le firme (API)]]) in <code>pzkko/firme.json</code> sul [[Il server dei dati in casa|server dei dati in casa]]: 5000 al massimo, le ultime 300 a chi guarda, venti secondi di cache sulla rete di Vercel (chi firma vede subito la sua, gli altri entro una ventina di secondi). Si cancellano con <code>node tools/pzkko/firme.mjs via <id></code> o modificando <code>C:\\pzkko-server\\dati\\pzkko__firme.json</code> a server spento. In locale stanno in memoria finché il server resta acceso (<code>firme.mjs --locale</code>).

{{Vedi anche|La petizione|Le firme (API)|Le penne della petizione}}
[[Categoria:Il muro]]`,
  },

  'La sera a Mantova': {
    data: '2026-10-29',
    fonti: [INDEX, README],
    testo: `[[File:home-notte.webp|thumb|il muro di notte: il velo blu, l'insegna accesa, i lampioni fuori vista]]
'''La sera a Mantova''' è l'ora del [[Il muro|muro]]: la pagina calcola alba e tramonto di [[Mantova]] (calcolo NOAA, al minuto, senza rete) e, con l'ora vera, vive a quell'ora da qualunque posto la si guardi. Dal 29.10.2026 [[Come parte la home|parte con l'ora vera]] (fino al 23.10 l'orologio stava fermo a mezzogiorno, <code>window.pzkkoOrologio.fermo</code>); «sempre giorno» si sceglie nella [[La regia|regia]].

== Il tramonto ==
* da 40 minuti prima del tramonto cala un velo blu notte (<code>.buio</code>, in multiply) e [[La lamiera|la lamiera]] si spegne;
* al tramonto preciso [[L'insegna|i neon dentro le lettere]] si accendono (strobo d'accensione, poi la luce tiene), e suona l'Ave Maria ([[Le campane]]);
* 12 minuti dopo i lampioni della strada, fuori vista (da lì passano anche [[Le auto che passano|le auto]]);
* la notte è piena 50 minuti dopo il tramonto;
* all'alba tutto si spegne a ritroso.

Le luci a scarica sfarfallano (la rete a 50 Hz, i tubi a 100 Hz, il browser che campiona a 60) e ogni tanto un tubo «sputa» (<code>--f-insegna</code>, <code>--f-lampioni</code>). Le variabili si scrivono su <code>html</code> solo col muro di sempre e solo quando cambiano; [[La scena 3D|la scena 3D]] legge gli stessi valori da <code>window.pzkkoPagina.luci</code> (vedi [[La regia]]: fino al 21.10 si scrivevano a ogni fotogramma e costavano ~4 ms di ricalcolo dello stile). Con <code>prefers-reduced-motion</code> niente sfarfallio né strobo. Senza script è sempre giorno (fino al 23.10 la notte seguiva il tema scuro del sistema).

== Le prove ==
<code>?ora=18:30</code> (ora di Mantova di oggi), <code>?veloce=60</code> (il tempo corre 60 volte più in fretta), <code>?notte=1</code>: con loro l'orologio corre come prima, anche senza l'ora vera scelta. La regia ha la scheda «ora e sera»: l'ora con alba e tramonto in rosso, la velocità (ferma, ×1, ×10, ×60, ×600), alba, mezzogiorno, tramonto, sera, mezzanotte, adesso; il buio, l'insegna e i lampioni, lo sfarfallio. L'orologio è uno solo per la pagina, la scena, [[La batteria|le batterie]] del wallet e del cercapersone e [[Il suono|i suoni]] (<code>window.pzkkoOrologio</code>, dal 20.10).

{{Vedi anche|La strada di notte|L'insegna|Il meteo|La regia|La luce dello zero}}
[[Categoria:Il muro]]`,
  },

  'La strada di notte': {
    data: '2026-10-23',
    fonti: [INDEX, README],
    testo: `'''La strada di notte''' è quello che succede sul [[Il muro|muro]] quando a [[La sera a Mantova|Mantova]] è buio (commit a822303 del 9.10.2026, «lampioni veri, i tubi al neon dentro le lettere, le auto che passano»):

* si accende [[L'insegna|<code>art/insegna-notte.svg</code>]], con un alone e un cono di luce in screen sul muro e sulla saracinesca;
* [[La goccia della condensa|la condensa dei condizionatori sul tetto]], fuori vista, cade dall'alto ogni 3–9 s sulla lamiera e lascia il rivolo;
* sulla lamiera gomme schiacciate e le scritte degli altri ([[La roba per terra (2D)]]); cinque [[Le mosche e le formiche del muro|formiche]] camminano lungo il bordo basso, tre mosche si posano sui fogli;
* passano [[Le auto che passano|le auto]], ogni 20–90 secondi, coi fari che spazzano il muro;
* la lamiera riflette le luci: <code>.muro::after</code> è la stessa foto a contrasto alto, in screen, mascherata dove battono lampioni e fari.

Con <code>prefers-reduced-motion</code> niente auto, gocce né formiche. Dal 23.10 la pagina [[Come parte la home|parte in 2D]]; nella [[La scena 3D|scena 3D]] la notte ha le sue luci vere ([[Le luci a insiemi]]): i tubi al neon emissivi, la lampada a muro sopra la porta, i lampioni di là, le finestre dei palazzi, e l'auto è una berlina vera che si riflette nel vetro e nelle pozzanghere. Nel [[Il cercapersone zero|cercapersone zero]] la lampada e i fari della stessa strada si riflettono sulla plastica ([[La luce dello zero]]).

{{Vedi anche|La sera a Mantova|Le auto che passano|La goccia della condensa|Il suono della strada}}
[[Categoria:Il muro]]`,
  },

  'Le auto che passano': {
    data: '2026-10-21',
    fonti: [INDEX, 'albertopecchini.it/pzkko/suono/suono.js', README],
    testo: `'''Le auto che passano''' sono le luci che di notte attraversano il [[Il muro|muro]]: ogni 20–90 secondi (mai più di tre al minuto) i fari (alogeni caldi, led freddi, xeno) spazzano il muro e i fogli, poi dal lato in cui l'auto se ne va restano i fanali rossi, con una frenata ogni tanto; una su sette ha il neon sotto la scocca. <code>?auto=1</code> fa passare un'auto subito. Con <code>prefers-reduced-motion</code> niente auto. Le regole delle auto (ogni quanti secondi, i fari, il neon, un'auto ferma coi fari accesi in un punto, «passa un'auto» anche di giorno) stanno nella scheda «strada» della [[La regia|regia]] (<code>window.pzkkoPagina.regola</code>).

== Nella scena 3D ==
Nella [[La scena 3D|scena]] «l'auto che passa è un'auto»: una berlina sulla strada dietro la telecamera (da x = −10 a 12 m, così esce dallo specchio della porta prima di sparire), coi fari che spazzano la saracinesca e la porta, i fanali rossi, il neon sotto; si riflette nel vetro e nelle pozzanghere, e mentre passa [[Il costo e la qualità|specchi e ombre]] si rifanno a ogni fotogramma. Sui livelli «poche luci» ha un faro solo e niente rosso dei freni né neon. La carrozzeria è compilata prima che passi ([[Le trappole della compilazione]]).

== Il suono ==
La pagina sceglie la prossima auto prima e la annuncia tre secondi prima dei fari (<code>evento('auto')</code>), così si sente arrivare: passa dietro la telecamera col Doppler, sul bagnato sibila, col neon sotto si sentono la cassa e il basso dei tamarri dai finestrini chiusi e la targa che vibra, ogni tanto i freni stridono. Quella ferma della regia tiene il motore al minimo ([[Il suono della strada]]).

== Nello zero ==
I fari dell'auto che passa scorrono anche sulla plastica del [[Il cercapersone zero|cercapersone zero]] aperto, da sinistra a destra ([[La luce dello zero]]).

{{Vedi anche|La strada di notte|La regia|Il suono della strada|Le luci a insiemi}}
[[Categoria:Il muro]]`,
  },

  'Le mosche e le formiche del muro': {
    data: '2026-10-23',
    fonti: [INDEX, README],
    testo: `'''Le mosche e le formiche del muro''' sono le bestiole disegnate della home 2D di [[pzkko.it]] (<code>art/bestiole/</code>, <code>art/mosche/</code>): cinque formiche che camminano lungo il bordo basso della [[La lamiera|lamiera]], e tre mosche (posata, che si pulisce le zampe, due battiti d'ali) che si posano sul muro e sui fogli, si girano, fanno due passi, si puliscono e volano via a zig zag; scappano dal puntatore. Con <code>prefers-reduced-motion</code> stanno ferme.

[[Ferma quando è ferma|Dal 23.10.2026]] le mosche, quando sono tutte posate e ferme, non chiedono fotogrammi fino alla prossima mossa (o al puntatore che le fa scappare); le formiche, col fondo della lamiera lontano dallo schermo, stanno ferme e si riguarda ogni 0,3 s. Col 3D acceso quelle della pagina sono nascoste e ferme: nella [[La scena 3D|scena]] sono in 3D, a grandezza vera o quasi ([[Le bestie]]: [[Le formiche|formiche]] di 13 mm in fila alle gomme da masticare, [[Le mosche|mosche]], [[Le zanzare tigre|zanzare tigre]], [[Le blatte|blatte]] di notte). Nel [[Il wallet|wallet]] le mosche escono dalle taschine quando lo si apre (otto se sei al verde).

{{Vedi anche|Le bestie|Il muro|La goccia della condensa}}
[[Categoria:Il muro]]`,
  },

  'La goccia della condensa': {
    data: '2026-10-23',
    fonti: [INDEX, 'albertopecchini.it/pzkko/scena/acqua.js', README],
    testo: `'''La goccia della condensa''' viene dai condizionatori sul tetto del palazzo, fuori vista: sul [[Il muro|muro]] 2D cade dall'alto ogni 3–9 s sulla [[La lamiera|lamiera]] e lascia il rivolo (<code>bestiole/rivolo.webp</code>, <code>data-scena="no"</code>: resta solo nel muro di sempre). [[Ferma quando è ferma|Dal 23.10.2026]], con la cima della lamiera fuori dallo schermo, non si anima (resta il plic). Nella [[La regia|regia]] le gocce si fanno più fitte o più rade, «una adesso».

Nella [[La scena 3D|scena]] è [[L'acqua]] (<code>scena/acqua.js</code>): la condensa dello split del primo piano esce dal muro sotto la finestra, scende in un tubo grigio fissato con le graffe, entra sotto l'architrave e finisce contro la lamiera a destra dell'insegna; la goccia si gonfia alla bocca, si stacca e scende a scatti come sulla vernice vera, e in fondo resta appesa alla barra e cade sulla soglia: schizzo e cerchio. Il tocco sulla soglia si sente (<code>evento('goccia')</code>, [[Il suono della strada]]).

{{Vedi anche|L'acqua|Il muro bagnato|La strada di notte}}
[[Categoria:Il muro]]`,
  },

  'Ferma quando è ferma': {
    data: '2026-10-23',
    fonti: [INDEX, 'albertopecchini.it/pzkko/wallet/banner.js', 'albertopecchini.it/pzkko/suono/suono.js', README],
    testo: `{{Citazione|fai tutto velocissimo e super ottimizzato|Alberto, 23.10.2026}}
'''Ferma quando è ferma''' è la regola del [[Il muro|muro]] dal 23.10.2026: a pagina ferma il filo della pagina dorme, e niente cambia d'aspetto (foto al pixel prima e dopo, computer e telefono: identiche).

== Cosa dorme ==
* [[Le mosche e le formiche del muro|le mosche]], quando sono tutte posate e ferme, non chiedono fotogrammi fino alla prossima mossa; le formiche, col fondo della lamiera lontano dallo schermo, stanno ferme e si riguarda ogni 0,3 s;
* [[La goccia della condensa|la goccia]], con la cima della lamiera fuori dallo schermo, non si anima (resta il plic);
* [[Il banner del wallet|il pannello a led del wallet]] (<code>wallet/banner.js</code>) disegna solo quando cambia qualcosa;
* il giro dei [[Il suono della strada|suoni]] va con un timer a 30 al secondo e non coi fotogrammi, e il motore parte dopo il primo gesto quando la pagina non scorre da 0,3 s (calcolare i rumori è mezzo secondo fermo sul telefono).

== Le immagini lontane ==
Un IntersectionObserver con qualcosa da guardare, finché gira un'animazione (il tubo catodico del cercapersone non si ferma mai), fa lavorare la pagina a ogni fotogramma; quello del browser per le immagini <code>loading=lazy</code> guardava tutte quelle non ancora chieste. Quindi lo script le tiene da parte senza <code>src</code> (<code>data-poi</code>; la scatola resta della sua misura) e le rimette quando lo scorrimento le porta a 1250 px dallo schermo (2500 con la rete lenta: le soglie di Chrome), senza pigrizia. Negli strumenti che fotografano la pagina (<code>navigator.webdriver</code>) e col 3D niente.

== La misura dei volantini ==
<code>adatta</code> e <code>fette</code> leggono tutto e poi scrivono tutto (una alla volta erano ~240 impaginazioni all'apertura, 0,16 s fermi sul telefono), tengono spenta la transizione dei fogli mentre li raddrizzano e si rifanno solo se cambia la larghezza, non per la barra del telefono che va e viene.

== I numeri (23.10, Chromium senza finestra) ==
{| class="wikitable"
! misura !! prima !! dopo
|-
| a riposo con le mosche posate, lavoro del filo della pagina (computer) || 100 ms/s || 16 ms/s
|-
| lo stesso sul telefono (390 × 844, processore 4 volte più lento) || 320–415 ms/s || 44 ms/s
|-
| fotogrammi al secondo a riposo || 66 || ~9
|-
| dopo un tocco, coi suoni accesi (computer / telefono) || 97 / 464 || 25 / 101
|-
| primo disegno sul telefono || 312 ms || 184 ms
|-
| compito più lungo all'apertura || 154 ms || 96 ms
|-
| fotogramma più lungo scorrendo col dito || 470–500 ms || 125–144 ms
|}

{{Vedi anche|Come parte la home|Il costo e la qualità|La scena sul telefono}}
[[Categoria:Il muro]]`,
  },

  'Come parte la home': {
    data: '2026-10-29',
    fonti: [INDEX, 'albertopecchini.it/pzkko/regia/regia.js', README],
    testo: `{{Citazione|per adesso avvialo sia da telefono che da pc in 2d con sempre luce sparata|Alberto, 23.10.2026}}
{{Citazione|impostazioni predefinite audio off|Alberto, 29.10.2026}}
'''Come parte la home''' di [[pzkko.it]]: '''sempre in 2D''', [[Il muro|il muro di sempre]], sul computer e sul telefono, anche dove c'è WebGL2. Fino al 29.10.2026 partiva anche a mezzogiorno col sole; dal 29.10 parte '''con l'ora vera''' di Mantova ([[La sera a Mantova]]), '''il meteo vero''' e '''senza suoni''' ([[Il nastro suono|il nastro «suono»]] li accende).

== Le scelte di chi guarda ==
In cima alla scheda «grafica» della [[La regia|regia]] («come parte»), ricordate nel browser:
* '''il 3D''' (<code>localStorage</code> <code>pzkko-3d</code> = <code>si</code>; si accende e si spegne ricaricando la pagina): [[La scena 3D]];
* '''sempre giorno''' (<code>pzkko-ora</code> = <code>giorno</code>; se no <code>vera</code>);
* '''sempre sole''' nella scena (<code>pzkko-meteo</code> = <code>sole</code>; se no <code>vero</code>);
l'ora e il meteo cambiano subito. Lo decide uno script nella testa di <code>index.html</code> (<code>window.pzkkoScelte</code>: <code>scena</code>, <code>ora</code>, <code>meteo</code>, e <code>tempo</code>, il meteo con cui parte la scena); <code>window.pzkkoPagina.scegli(k, v)</code> le cambia. La luce non è il gioco: [[La batteria|le batterie]] del wallet e del cercapersone seguono l'ora vera anche quando la pagina sta ferma a mezzogiorno (<code>window.pzkkoOrologio.perGioco()</code>); [[Il tomodachi|il tomodachi]] chiede il meteo vero solo con «meteo vero» scelto.

== Le prove ==
<code>?scena=1</code> accende il 3D e <code>?muro=1</code> lo spegne (comanda lui); <code>?ora=</code>, <code>?veloce=</code> e <code>?notte=</code> vogliono l'ora vera come prima, <code>?meteo=</code> il suo tempo; <code>?novita</code> rifà vedere [[Lo scontrino delle novità|lo scontrino]].

== Quanto pesa ==
Quando il 3D non è scelto la pagina non chiede niente della scena (né moduli, né [[Il pomodoro|pomodoro]], né anteprime, né <code>/api/meteo</code>) e non trattiene le illustrazioni dei volantini: provato il 23.10 sul server di prova, la home di partenza fa 93 richieste e 5,5 MB sul computer (1300 × 860) e 67 e 3,9 MB sul telefono (390 × 844 a 3×), le stesse del vecchio <code>?muro=1</code>; col 3D che partiva da solo erano 411 richieste e 17,3 MB, 393 e 15,2 MB.

== Prima ==
Dal 18.10 al 23.10 la scena 3D partiva da sola dove c'era WebGL2 (dal 19.10 anche sul telefono), con l'arrivo dalla strada; il 23.10 è arrivata la versione 3.0 [[Lumaca catodica|«lumaca catodica»]]: «il muro parte in 2D di giorno, il resto si accende in regia».

{{Vedi anche|La regia|La scena 3D|Il nastro suono|Lumaca catodica|Ferma quando è ferma}}
[[Categoria:Il muro]]`,
  },

  'La 404': {
    data: '2026-10-21',
    fonti: ['albertopecchini.it/pzkko/404.html', 'albertopecchini.it/tools/pzkko/genera-404.mjs', README],
    testo: `[[File:404.webp|thumb|la 404: lo stesso muro, corto, coi resti del volantino strappato]]
'''La 404''' di [[pzkko.it]] (<code>404.html</code>, servita da Vercel per le pagine che non ci sono) è lo stesso [[Il muro|muro]], corto, con i resti del volantino strappato e un foglio che rimanda alla home. La genera <code>node tools/pzkko/genera-404.mjs</code> dalla home (dalla cartella <code>albertopecchini.it</code>), da rilanciare dopo ogni modifica a <code>index.html</code>; lo fa anche [[La serranda|serranda.mjs rifai]]. Non ha i pezzi nuovi (ha il suo muro corto), ma va rigenerata lo stesso.

Dove c'è WebGL2 ha [[La scena 3D|la sua scena]]: il suo volantino è fotografato con gli altri ([[Le foto dei volantini]]), ma non ha le [[Le foto del caricamento|foto del caricamento]] (<code>FOTO = null</code>: il nero); [[L'altra pagina già scaricata|scarica in cache la home]] come fa la storia. Sopra c'è [[La barra in alto|la barra]], con «← indietro» che porta sempre alla home pulita. La sua cattura sul telefono (<code>pzk-404-mobile.webp</code>) è nel case study del [[albertopecchini.it|sito serio]]. Il 9.10.2026 ha perso il piè di pagina insieme alla home («via anche il badge FrogDR: la home e la 404 finiscono con la soglia di pietra»).

{{Vedi anche|Il muro|La storia del muro|La serranda}}
[[Categoria:Il muro]]`,
  },

  'La disposizione': {
    data: '2026-10-26',
    fonti: ['albertopecchini.it/tools/pzkko/disponi.mjs', 'albertopecchini.it/tools/pzkko/disposizione.js', 'albertopecchini.it/tools/pzkko/browser.mjs', README],
    testo: `'''La disposizione''' è come le cose stanno sul [[Il muro|muro]]: le posizioni non si scrivono a mano in <code>index.html</code>, stanno in <code>tools/pzkko/disposizione.js</code> come [[Le pile|pile]] per colonna (cinque sul computer, due sul telefono) e pezzi ancorati ad altri, e <code>tools/pzkko/disponi.mjs</code> le riscrive nella pagina (le <code>--x --y --w --r</code> e, sotto i 900 px, le <code>--mx --my --mw --mr</code>).

== Il comando ==
<code>node tools/pzkko/disponi.mjs tutto --foto</code> (dalla cartella <code>albertopecchini.it</code>) dispone, misura le altezze vere in Chromium (i volantini crescono col testo), dispone di nuovo e lascia le foto del muro in <code>tools/pzkko/lavoro/</code> (<code>muro-desk.png</code>, <code>muro-mob.png</code>); poi si rigenera [[La 404|la 404]]. Un pezzo nuovo: lo si aggiunge in <code>index.html</code> e lo si mette in una pila. Per [[La storia del muro|la storia]]: <code>disponi.mjs tutto --pagina=storia</code>, con le pile di <code>tools/pzkko/storia/disposizione.js</code>. Dal 26.10 riconosce anche i <code>button</code> <code>.it</code>: [[Il wallet|il wallet]] e [[Il tasto sul muro|il cercapersone]] sono pezzi della parete come gli altri. Gli strumenti che misurano la pagina 2D la aprono con <code>?muro=1</code>, altrimenti la scena sposta il muro e le misure vengono sbagliate.

== Il browser ==
<code>disponi.mjs</code>, <code>cattura.mjs</code>, <code>foto.mjs</code> e <code>trame.mjs</code> trovano il browser con <code>tools/pzkko/browser.mjs</code> (<code>--chrome=</code> o la variabile <code>CHROME</code>; se no il Chromium di Playwright, se no Edge) e puppeteer-core da <code>tools/catture</code>. Con Edge le altezze dei volantini vengono qualche unità diverse dal Chromium di Playwright, e tutto si sposta di poco: è normale.

== Chi la usa ==
[[La serranda|serranda.mjs]] fa tutto questo da riga di comando (stato, volantino, pezzo, allunga, comprimi, rifai) ed è la strada normale, anche per Claude (la skill serranda). [[La scena 3D|La scena 3D]] legge la parete dal DOM: se la parete si allunga, si allunga anche la saracinesca 3D.

{{Vedi anche|Le pile|La serranda|Il muro|Skill serranda}}
[[Categoria:Il muro]]
[[Categoria:Gli strumenti]]`,
  },

  'La serranda': {
    data: '2026-10-22',
    fonti: ['albertopecchini.it/tools/pzkko/serranda.mjs', 'albertopecchini.it/tools/pzkko/disposizione.js', '.claude/skills/serranda/SKILL.md', README],
    testo: `{{Infobox
| titolo = La serranda
| immagine = muro-desk.webp
| didascalia = il muro misurato da disponi.mjs, la foto che lascia in lavoro/
| strumento = tools/pzkko/serranda.mjs (20.10.2026)
| skill = .claude/skills/serranda
| comandi = stato, volantino, pezzo, allunga, comprimi, rifai
| manopole = top, bottom, minimo, passo, scala (DESK e MOB in disposizione.js)
}}
'''La serranda''' è lo strumento che allunga, comprime e riempie il [[Il muro|muro]] da riga di comando, per chi ci lavora (Alberto o Claude: c'è anche la [[Skill serranda|skill serranda]]): <code>tools/pzkko/serranda.mjs</code>, dal 20.10.2026. Dalla cartella <code>albertopecchini.it</code>:

* <code>serranda.mjs</code>: lo stato: parete (unità e metri in 3D), manopole, colonne, spazio libero;
* <code>serranda.mjs volantino --titolo="…" --testo="…" [--link=…] [--zona=games] [--carta=giallo] [--arte=arte2/dadi]</code>: un [[I volantini|volantino]] nuovo;
* <code>serranda.mjs pezzo --img=manifesti2/x [--tipo=man|tag|pezzo]</code>: un manifesto, un graffito, un pezzo;
* <code>serranda.mjs allunga --sopra=400</code>: spazio nuovo in cima (tutto scende); <code>--sotto</code>, <code>--minimo</code>; <code>--telefono</code>, <code>--entrambi</code>;
* <code>serranda.mjs comprimi 10</code>: pile più fitte del 10 % (<code>--scala=0.9</code> pezzi più stretti, <code>--annulla</code>);
* <code>serranda.mjs rifai</code>: [[La disposizione|disponi]], [[La 404|la 404]], [[La storia del muro|la storia]], [[Le foto dei volantini|le foto dei volantini]] per il 3D, [[Le foto del caricamento|le foto del caricamento]], le foto di prova della scena (<code>scena-serranda-{cima,meta,fondo,telefono,storia}.png</code> in <code>tools/pzkko/lavoro/</code>);
* <code>serranda.mjs stato --pagina=storia</code>: lo stesso per il muro della storia (anche allunga e comprimi).

<code>--prova</code> dice cosa farebbe senza scrivere. Il pezzo nuovo va nella colonna più corta (o in <code>--colonna</code>, dopo <code>--dopo</code>), sul computer e sul telefono. [[La scena 3D|La scena 3D]] non vuole niente: la saracinesca è alta quanto la parete del DOM (e la scatola dell'ombra del sole cresce con lei).

== Com'è andata ==
Provato il 20.10 con +450 unità in cima, un volantino nuovo e le pile al 92 %: poi rimesso tutto com'era. Il 21.10 compresse davvero, su richiesta di Alberto: <code>comprimi 10 --entrambi</code> (passo 0,9) e la parete tenuta alta com'era col minimo (<code>allunga --minimo=2989</code>, <code>--telefono --minimo=5228</code>), così lo spazio guadagnato è restato libero in fondo alle colonne (325–385 unità sul computer, 580–590 sul telefono) invece di accorciare la saracinesca; a coprirsi di più sono stati i manifesti finti, i titoli dei volantini veri si leggono tutti. Il 22.10 la roba nuova (i manifesti 6, 7 e 8, [[La petizione|la petizione]]) ha preso il posto dei tre meme della storia e lo spazio libero in fondo, e la parete è cresciuta da sé (la colonna più lunga più <code>bottom</code>): 3191 unità sul computer (5,1 m di saracinesca 3D), 5486 sul telefono.

== Attenzione ==
La petizione ha le penne che sporgono ~180 unità sul computer e ~130 sul telefono: nella pila, subito sotto, va un graffito o un manifesto, mai un volantino vero. I fogli della storia non si aggiungono con <code>volantino</code> e <code>pezzo</code>: si scrivono a mano in <code>storia/index.html</code> e in <code>tools/pzkko/storia/disposizione.js</code>. Dopo <code>rifai</code> si guardano le foto. Non si fa commit né push se Alberto non lo chiede: ogni push su <code>main</code> va online.

{{Vedi anche|La disposizione|Le pile|Skill serranda|Il muro}}
[[Categoria:Il muro]]
[[Categoria:Gli strumenti]]`,
  },

  'Le pile': {
    data: '2026-10-22',
    fonti: ['albertopecchini.it/tools/pzkko/disposizione.js', 'albertopecchini.it/tools/pzkko/disponi.mjs', README],
    testo: `'''Le pile''' sono la composizione del [[Il muro|muro]] dal 17.10.2026: cinque colonne da ~250 unità sul computer e due sul telefono, ogni pezzo sovrapposto di poco a quello sopra, graffiti e nastri ancorati ai fogli vicini. Stanno in <code>tools/pzkko/disposizione.js</code>: le chiavi sono gli id dei pezzi (<code>vol:pzk$meeting</code>, <code>#wallet-muro</code>, <code>#cercapersone-muro</code>…), e in una riga di <code>DESK</code> e <code>MOB</code> ci sono le manopole: <code>top</code>, <code>bottom</code>, <code>minimo</code>, <code>passo</code> (0,9 dal 21.10: le pile si sovrappongono del 10 % in più), <code>scala</code>, lette da [[La disposizione|disponi.mjs]] e scritte da [[La serranda|serranda.mjs]]; si possono cambiare anche a mano.

Dopo ogni cambio di testo si rimisurano le altezze vere dei fogli e si rifanno le pile. I graffiti stanno sotto i fogli, [[I manifesti e la roba degli altri|i manifesti]] fra i fogli, [[Gli adesivi degli amici|gli adesivi]] in fondo alle pile; [[La petizione|la petizione]] vuole sotto di sé un manifesto, non un link. Il wallet è in cima alla prima pila e il cercapersone in cima alla seconda (26.10). La parete è alta quanto la colonna più lunga più <code>bottom</code>, con un minimo: 3191 unità sul computer e 5486 sul telefono dal 22.10. La storia ha le sue pile in <code>tools/pzkko/storia/disposizione.js</code>, col passo 1.

{{Vedi anche|La disposizione|La serranda|Il muro|Le zone del muro}}
[[Categoria:Il muro]]`,
  },

  'pzk$meeting': {
    data: '2026-10-22',
    fonti: ['albertopecchini.it/pzkko/tools/lezioni/index.html', 'albertopecchini.it/tools/lezioni/pacchetto.py', INDEX, README],
    testo: `{{Infobox
| titolo = pzk$meeting
| immagine = lezioni.webp
| didascalia = la pagina dello strumento su pzkko.it/tools/lezioni/
| dove = pzkko.it/tools/lezioni/
| cos'è = un programma per Windows che registra le lezioni su Teams e ne fa gli appunti in PDF
| dal = 21 ottobre 2026 (dal 22.10 col nome pzk$meeting)
| download = lezioni.zip (download="pzk$meeting.zip")
| codice = albertopecchini.it/tools/lezioni/
}}
'''pzk$meeting''' è il primo strumento di [[pzkko.it]], nella zona ''tools'' del [[Il muro|muro]]: lo strumento di [[Alberto Pecchini|Alberto]] per registrare le lezioni su Teams, trascriverle con Whisper in sincrono con la lavagna, leggerne le formule e farne gli appunti in PDF. È un programma per Windows, non una cosa da browser: la pagina lo spiega e dà <code>tools/lezioni/lezioni.zip</code>. Il codice vive in [[Lezioni (strumento)|<code>albertopecchini.it/tools/lezioni/</code>]], col suo README.

== Il nome ==
Nato il 21.10.2026 come «lezioni» (commit 11f1334, «il tool che registra le lezioni… primo strumento sul muro di pzkko»); dal 22.10 si chiama '''pzk$meeting''' (9d20755): il titolo del foglio, della pagina e il file scaricato (<code>download="pzk$meeting.zip"</code>; sul server resta <code>lezioni.zip</code>, e l'indirizzo resta <code>tools/lezioni/</code>). Il titolo sul volantino è al 76 % (<code>--ts:.76</code>): in Anton «pzk$meeting» usciva dal foglio. La chiave nelle [[Le pile|pile]] è <code>vol:pzk$meeting</code>.

== Il volantino e la pagina ==
Nella zona tools il foglio «cercasi strumenti» è diventato «lezioni»; sopra c'è la stampa vera degli appunti di esempio (<code>art/lezioni/volantino.webp</code>), in multiply come l'inchiostro delle illustrazioni. La pagina è uno [[Gli strumenti di pzkko|strumento]] come gli altri: l'insegna in testa che torna al muro, un pezzo di saracinesca coi fogli attaccati in colonne, CSS in linea, niente script. Lo zip lo fa <code>python ../tools/lezioni/pacchetto.py</code>, che scrive anche versione e peso nella pagina (fra <code>&lt;!--versione--&gt;</code> e <code>&lt;!--peso--&gt;</code>): va rilanciato dopo ogni modifica al tool, prima del commit. Le immagini (<code>art/lezioni/</code>: <code>appunti.webp</code> la pagina di appunti, <code>volantino.webp</code>, <code>barra.webp</code> e <code>barra-chiusa.webp</code>) e <code>tools/lezioni/og.jpg</code> vengono da una lezione '''inventata''': niente della lezione vera (voci, nomi, lavagna) va sulla pagina.

== Altrove ==
Su [[albertopecchini.it]] è la sezione «Tools» del case study di pzkko (22.10): il nome, cosa fa, il pulsante che scarica lo zip col peso e il sistema, il link alla pagina. Con Claude Code c'è la [[Skill lezione|skill lezione]].

{{Vedi anche|Lezioni (strumento)|Gli strumenti di pzkko|Skill lezione}}
[[Categoria:Il muro]]
[[Categoria:Gli strumenti]]`,
  },

  'Gli strumenti di pzkko': {
    data: '2026-10-22',
    fonti: ['albertopecchini.it/pzkko/tools/lezioni/index.html', INDEX, README],
    testo: `'''Gli strumenti di pzkko''' sono le pagine della zona ''tools'' del [[Il muro|muro]], in <code>pzkko/tools/<nome>/</code>: pagine statiche fuori dalla [[La scena 3D|scena 3D]], con in testa [[L'insegna|l'insegna]] (torna al muro) e sotto un pezzo di saracinesca con i fogli attaccati in colonne. Stesse carte, nastri e caratteri del muro, CSS in linea, niente script. I fogli si allungano col testo (la carta si stira un po'): <code>.testo</code> è alto almeno quanto la carta (<code>calc(100cqw / (var(--ar)))</code>), di più se serve. Il volantino nella zona tools del muro porta lì.

Per ora ce n'è uno, [[pzk$meeting]] (21.10.2026). PRODUCT.md (7.10) diceva: «Zone tools e games: per ora vuote… quando arrivano i primi contenuti diventano pagine». Ogni strumento o gioco nuovo è una pagina in questa cartella (es. <code>tools/nome/index.html</code>) e il suo volantino «in arrivo» diventa un link. Non vanno confusi con gli strumenti di sviluppo di <code>albertopecchini.it/tools/pzkko/</code> ([[La serranda]], [[La disposizione]], [[Le immagini del muro|immagini.mjs]]…) né con [[Gli strumenti di albertopecchini.it]].

{{Vedi anche|pzk$meeting|Le zone del muro|Gli strumenti di albertopecchini.it}}
[[Categoria:Il muro]]
[[Categoria:Gli strumenti]]`,
  },

  'La barra in alto': {
    data: '2026-10-27',
    fonti: ['albertopecchini.it/pzkko/barra/barra.js', 'albertopecchini.it/pzkko/barra/barra.css', 'albertopecchini.it/pzkko/barra/pagina.css', README],
    testo: `{{Citazione|fai una topbar con sezioni dove c'è la storia del sito, i gadget, elenchi di oggetti, achievement, account, info e copyright|Alberto, 26.10.2026}}
{{Citazione|più in stile pzk, senza sfondo: pixel che escono dall'alto, tasti che sono pezzi di carta, scritte di vari font|Alberto, 26.10.2026}}
[[File:barra.webp|thumb|la barra: i pixel che colano, i pezzi di carta col nastro]]
'''La barra in alto''' di [[pzkko.it]] (<code>barra/barra.js</code>, 26.10.2026) sta in cima a ogni pagina che la carica: la home, e quindi [[La storia del muro|la storia]] e [[La 404|la 404]] che si generano da lei, e le pagine nuove. Niente striscia: dall'alto colano pixel scuri (la frangia, un SVG a pixel che si ripete in orizzontale, 48 colonne da 6 px; qualche pixel colorato, giallo, verde, rosso o blu, si stacca e cade), e sotto le voci sono pezzi di carta strappati attaccati col nastro, ognuno con la sua [[Le carte dei volantini|carta]], il suo [[I caratteri del muro|carattere]] e la sua storta, in fila al centro («niente tasto pzk, allinea tutto centralmente»: il muro c'è già sotto). I bordi strappati e la frangia vengono da un caso col seme fisso (mulberry32, semi 1981 e 26101): sono sempre gli stessi, a ogni visita. <code>--barra</code> è l'altezza (<code>barra.css</code>): la home ci sposta sotto il wallet e il cercapersone.

== Le voci ==
{| class="wikitable"
! voce !! dove !! carta, carattere !! cosa
|-
| storia || /storia/ || scontrino, macchina || [[La storia del muro|com'è nato pzkko]]
|-
| gadget || /gadget/ || cartone, stencil || [[Gadget (pagina)|il wallet, il cercapersone e le sue app, i giochi]]
|-
| oggetti || /oggetti/ || post-it, pennarello || [[Oggetti (pagina)|tutto quello che si compra, si pesca, si caccia, si scava]]
|-
| traguardi || /traguardi/ || rosa, tondo || [[Traguardi (pagina)|gli achievement]]
|-
| account || #account || quaderno, mono || il conto: nella home apre il cercapersone sull'[[Account (app)|app Account]]; dalle altre pagine porta a <code>/#account</code>, che fa lo stesso (e la home poi lo toglie dall'indirizzo)
|-
| info || /info/ || bianca, mano || [[Info (pagina)|cos'è pzkko, chi l'ha fatto, il copyright]]
|-
| wiki || /wiki/ || grigia, bungee || [[Pzkkopedia]], questa wiki (dal 26.10 al 2.11 era «presto»: una voce senza indirizzo si vedeva sbiadita)
|}
Fuori dalla home, prima di tutte, '''← indietro''' (carta rossa): porta sempre alla home pulita (<code>/</code>), non alla pagina di prima. Le pagine delle voci usano <code>barra/pagina.css</code>: il foglio col nastro, come [[Gli strumenti di pzkko|gli strumenti]].

== I suoni ==
I pezzi di carta frusciano, e il loro link parte 120 ms dopo perché il fruscio si senta ([[I suoni dell'interfaccia]]). Con [[La musica|la musica]] accesa i link della barra passano da <code>vai</code>: la pagina si apre dentro [[La cornice|la cornice]], senza fermare la musica. La barra carica <code>suono/interfaccia.js</code>, quindi i suonini ci sono in ogni pagina. Il 27.10 un fix: «la barra cambia pagina anche quando il riquadro è rifiutato o si clicca due volte».

{{Vedi anche|Gadget (pagina)|Oggetti (pagina)|Traguardi (pagina)|Info (pagina)|Pzkkopedia|La cornice}}
[[Categoria:Il muro]]`,
  },

  'Gadget (pagina)': {
    data: '2026-11-01',
    fonti: ['albertopecchini.it/pzkko/gadget/index.html', 'albertopecchini.it/pzkko/barra/pagina.css', README],
    testo: `[[File:gadget.webp|thumb|pzkko.it/gadget/: tutto quello che si tocca sul muro, con il tasto per aprirlo]]
'''Gadget''' (pzkko.it/gadget/, voce della [[La barra in alto|barra]] su cartone, carattere stencil) è la pagina con «tutto quello che si tocca sul muro», ognuno col tasto per aprirlo direttamente: [[Il wallet|il wallet]] (<code>/#wallet</code>) e [[Il cercapersone zero|il cercapersone zero]] (<code>/#chat</code>) in alto a sinistra; [[Le app di pzk os|le app del cercapersone]], «18, tutte in tasca» (chat, profilo, account, shop, pzkstore, sfide, quiz, quest, giocatori, zaino, miniera, foto, virtual, banca, bin·hex, calcoli, codice C, cucina; dal 1.11 ce ne sono anche lavatrice, decifratore e rapina nel menu di pzk os); [[I giochi|i giochi]] «coi $pzk, finti» (<code>/#roulette</code>, <code>#blackjack</code>, <code>#mine</code>, <code>#dado</code>, <code>#moneta</code>, <code>#virtual</code>); [[La regia|la regia]] e [[La petizione|la petizione]]. Le schede usano le piastrelle delle app di <code>art/chat-app*/</code> ([[Le icone di pzk os]]) e sono scritte a mano nell'HTML, col foglio col nastro di <code>barra/pagina.css</code>. È nella sitemap con priorità 0,5.

{{Vedi anche|La barra in alto|Le app di pzk os|I giochi}}
[[Categoria:Il muro]]`,
  },

  'Oggetti (pagina)': {
    data: '2026-10-26',
    fonti: ['albertopecchini.it/pzkko/oggetti/index.html', 'albertopecchini.it/pzkko/oggetti/oggetti.js', 'albertopecchini.it/pzkko/chat/testi.js', 'albertopecchini.it/pzkko/chat/oggetti.js', README],
    testo: `[[File:oggetti.webp|thumb|pzkko.it/oggetti/: lo shop per reparto, il bottino, le facce]]
'''Oggetti''' (pzkko.it/oggetti/, voce della [[La barra in alto|barra]] su post-it, a pennarello) è l'elenco di «tutto quello che si compra, si pesca, si caccia, si scava»: [[Lo shop|lo shop]] per [[I reparti dello shop|reparto]], il bottino con quanto spesso esce ([[I pesci|i pesci]], [[Le bestie|le bestie]], [[I reperti|i reperti]], la roba dell'[[Lo spazzino di uffici|ufficio]]), [[Le facce del profilo|le facce]] con rarità e prezzo, quelli tuoi segnati, la ricerca. <code>oggetti/oggetti.js</code> legge i dati veri di <code>chat/testi.js</code> e <code>chat/oggetti.js</code>: la stessa fonte dello [[Lo shop|shop]] del cercapersone e delle voci generate di pzkkopedia ([[Elenco degli oggetti]], [[Elenco dei pesci]], [[Elenco delle bestie]], [[Elenco dei reperti]]). I prezzi che contano, dal 31.10, sono quelli della [[La banca sul server|banca sul server]] (copie di questi file).

{{Vedi anche|Lo shop|Elenco degli oggetti|La barra in alto}}
[[Categoria:Il muro]]
[[Categoria:Gli oggetti]]`,
  },

  'Traguardi (pagina)': {
    data: '2026-10-26',
    fonti: ['albertopecchini.it/pzkko/traguardi/index.html', 'albertopecchini.it/pzkko/traguardi/traguardi.js', 'albertopecchini.it/pzkko/chat/traguardi.js', README],
    testo: `[[File:traguardi.webp|thumb|pzkko.it/traguardi/: gli achievement, fatti e da fare]]
'''Traguardi''' (pzkko.it/traguardi/, voce della [[La barra in alto|barra]] su carta rosa, carattere tondo) è la pagina degli achievement: «quelli fatti e quelli da fare». Legge <code>chat/traguardi.js</code>: 47 traguardi (erano 26 il 26.10 mattina) in sette gruppi (la banca, l'esperienza, la chat col bot, i giochi, testa e costanza, la cucina, il profilo), ognuno una funzione che legge [[Lo zaino|lo zaino]] e [[I $pzk|i soldi]] e dice a che punto sei, quindi valgono anche quelli fatti prima che esistessero. Col conto lo zaino è quello del conto; senza, quello di questa scheda del browser. Vedi [[I traguardi]] e [[Elenco dei traguardi]]; dallo zero si vedono anche nel [[Profilo (app)|profilo]].

{{Vedi anche|I traguardi|Elenco dei traguardi|La barra in alto}}
[[Categoria:Il muro]]
[[Categoria:I traguardi]]`,
  },

  'Info (pagina)': {
    data: '2026-10-26',
    fonti: ['albertopecchini.it/pzkko/info/index.html', README],
    testo: `[[File:info.webp|thumb|pzkko.it/info/: cos'è, chi l'ha fatto, di chi è]]
'''Info''' (pzkko.it/info/, voce della [[La barra in alto|barra]] su carta bianca, a mano) dice in un foglio «cos'è, chi l'ha fatto, di chi è»:
* '''cos'è pzkko''': un muro, una saracinesca di Bologna coperta di volantini, e ogni volantino porta da qualche parte; sopra un wallet, un cercapersone con le sue app e sei giochi. «È in beta: le cose cambiano spesso, e qualcosa si rompe» ([[La beta]]);
* '''i soldi sono finti''': i $pzk e gli EUR€ non si comprano, non si vendono e non valgono niente fuori da qui; «niente soldi veri, mai»;
* '''chi l'ha fatto''': [[Alberto Pecchini]], su instagram @albertoxpecchini;
* '''cosa si salva''': senza conto in questa scheda del browser, col conto sul server di pzkko (nome, PIN cifrato, $pzk ed EUR€, zaino, profilo; nessuna e-mail); il codice dell'app «codice C» si compila fuori, su Compiler Explorer o Wandbox ([[Cosa si salva]]);
* '''i crediti''': gpt-image-2 per le immagini, dal 26.10 retro-diffusion per le icone, three.js, Rapier, Cascadia Code ([[I crediti di pzkko]]);
* '''la wiki''': «Arriva quando pzkko esce dalla beta» (dal 2.11.2026 c'è: [[Pzkkopedia]]);
* '''copyright''': © 2026 Alberto Pecchini; i nomi e i marchi sui volantini sono dei loro proprietari.
È anche la pagina «Sviluppatori» nel piè di pagina di pzkkopedia.

{{Vedi anche|La barra in alto|I crediti di pzkko|Cosa si salva|Alberto Pecchini}}
[[Categoria:Il muro]]`,
  },

  'Lo scontrino delle novità': {
    data: '2026-10-23',
    fonti: ['albertopecchini.it/pzkko/benvenuto/benvenuto.js', 'albertopecchini.it/pzkko/benvenuto/benvenuto.css', README],
    testo: `[[File:benvenuto.webp|thumb|lo scontrino delle novità, una volta per versione]]
'''Lo scontrino delle novità''' (<code>benvenuto/</code>, 23.10.2026, con la versione 3.0 [[Lumaca catodica|«lumaca catodica»]]) è il foglio che si vede una volta per versione entrando nella home di [[pzkko.it]]: le cose nuove della versione e «come si accende il 3D», col tasto «apri la regia adesso», che apre [[La regia|la regia]] sulla scheda «grafica» (in cima c'è «come parte»). <code>?novita</code> nell'indirizzo lo rifà vedere. È arrivato il 23.10 quando Alberto ha tolto il tasto giallo della regia («togli tasto regia», commit c36837d: «lo scontrino 3.0.1 dice come si accende il 3D»); dal 29.10 i consigli di partenza (audio spento, ora e meteo veri) sono un'altra cosa che lo scontrino racconta. Il carattere è quello degli scontrini, [[Il font Fake Receipt|Fake Receipt]]. Le versioni: [[Le versioni di pzkko]].

{{Vedi anche|Le versioni di pzkko|La regia|Come parte la home}}
[[Categoria:Il muro]]
[[Categoria:Le versioni]]`,
  },

  'Le versioni di pzkko': {
    data: '2026-11-01',
    fonti: ['albertopecchini.it/pzkko/benvenuto/benvenuto.js', INDEX, README],
    testo: `'''Le versioni di pzkko''' sono le tappe di [[pzkko.it]] dal 7 ottobre 2026. Le ultime due hanno un nome e uno [[Lo scontrino delle novità|scontrino]] all'ingresso; quelle prima si leggono nei commit del [[Il repository AP|repository]] ([[Elenco dei commit]]).

{| class="wikitable"
! quando !! versione !! commit !! cos'era
|-
| 7.10.2026 || [[Il portafoglio MagSafe]] || 6d339dc || il primo pzkko.it (<code>SITE=pzk</code> nel sito Vite): un portafoglio MagSafe bianco ghiaccio coi social; bocciato lo stesso giorno
|-
| 7.10 || pagina svuotata || 5b956e8 || resta solo il credito
|-
| 7.10 || cartella sua || f4a3d41 || pzkko.it nella sua cartella <code>albertopecchini.it/pzkko</code>, file statici
|-
| 7.10 || [[La scrivania di pzkko]] || 734f68c || i social come icone in un dock stile Apple
|-
| 7–8.10 || il blackjack e la roulette || 67d4876, e5b8c66 || il tavolo col banco bot e cinque posti, la ruota con la fisica vera; tolti il 17.10 (533ca91) e rifatti in una finestra
|-
| 9.10 || [[Il muro (versione 2.0)|il muro]] || 38e14a2 || la home come saracinesca coperta di graffiti e volantini; la sera a Mantova (88bba2e), la strada di notte (a822303)
|-
| 17.10 || il muro più alto || ae76bda || i siti in cima, la roulette 3D in una finestra
|-
| 18.10 || la scena 3D || 2e23562 || «la home diventa un posto vero in 3D, con luci, ombre e riflessi»; il blackjack con le regole vere (cfe63fc)
|-
| 19–21.10 || la scena sul telefono, l'arrivo, il pomodoro, il fronte || bbc6d79, 39e1dd9, 2b9e47a || il pomodoro del caricamento, la storia, il fronte del negozio, la regia nuova, il portachiavi, i suoni della strada
|-
| 22.10 || la petizione, le mine, il dado, la moneta, il wallet, la chat || 7eae16a, 84bebc5, 730e268 || le firme vere, i $pzk in comune, la borsa, la chat col bot
|-
| 23.10 || '''3.0 «lumaca catodica»''' || 3dd64ba || «il muro parte in 2D di giorno, il resto si accende in regia»; il cercapersone grande, la lumachina, virtual
|-
| 26.10 || la barra, i quiz, l'economia || 209c4eb || quiz, side quest, traguardi, foto, comandi, economia, barra e wiki vuota; le musichette (670b93e)
|-
| 27–29.10 || il canale sempre aperto, il server in casa, i lotti || 4e0199c, 2329ffb, b402ac7 || i dati sul pc di Alberto e Vercel Blob tolto per sempre; le vincite salve al millesimo; il pzkstore
|-
| 31.10 || la banca sul server || 92ef038 || «il browser non decide più niente»
|-
| 1.11.2026 || '''4.0.0 «chiocciola zero»''' || 6593e7b || il cercapersone zero per tutti, il nero eliminato per sempre
|-
| 2.11 || la lavatrice e il decifratore nello zero || f46c118 || e l'apertura col 3D senza bloccare il sito; pzkkopedia
|}

== I numeri delle versioni ==
Il numero sta in <code>benvenuto/benvenuto.js</code> (lo scontrino si mostra una volta per versione). La 3.0.1 (23.10) ha tolto il tasto giallo della regia e lo ha detto nello scontrino. Fra la 3.0 e la 4.0 il cercapersone è cambiato tre volte: [[Il cercapersone nero|il nero grande]] (23.10), [[Il cercapersone zero|lo zero]] in vendita a 9.999 $pzk (29.10), lo zero per tutti (31.10).

{{Vedi anche|Pzkko.it|Il portafoglio MagSafe|La scrivania di pzkko|Il muro (versione 2.0)|Lumaca catodica|Chiocciola zero|La storia del repository}}
[[Categoria:Le versioni]]`,
  },

  'Il portafoglio MagSafe': {
    data: '2026-10-07',
    fonti: ['PRODUCT.md', README],
    testo: `'''Il portafoglio MagSafe''' è stato il primo pzkko.it, per poche ore del 7 ottobre 2026: commit 6d339dc, «pzkko.it, il portafoglio MagSafe bianco ghiaccio coi social (SITE=pzk)». Era una pagina del sito Vite di [[albertopecchini.it]] (un terzo <code>SITE</code> accanto a quello serio e a <code>bcp</code>): un iPhone con il portafoglio MagSafe bianco ghiaccio attaccato dietro, e i social come le carte nelle tasche. [[Alberto Pecchini|Alberto]] lo ha bocciato lo stesso giorno, e PRODUCT.md ne tiene la regola: «Prima versione (iPhone + portafoglio MagSafe, commit 6d339dc) bocciata il 2026-10-07: non riproporre oggetti skeuomorfici letterali». Lo stesso giorno la pagina è stata svuotata (5b956e8, «resta solo il credito»), pzkko.it è andato nella sua cartella di file statici (f4a3d41) ed è diventato [[La scrivania di pzkko|la scrivania]]. Il portafoglio è poi tornato, in un altro modo, con [[Il wallet|il wallet]] di pelle alla Fallout del 22.10.

{{Vedi anche|Le versioni di pzkko|La scrivania di pzkko|PRODUCT.md}}
[[Categoria:Le versioni]]`,
  },

  'La scrivania di pzkko': {
    data: '2026-10-09',
    fonti: ['PRODUCT.md', README],
    testo: `'''La scrivania di pzkko''' è stata la seconda home di [[pzkko.it]], dal 7 al 9 ottobre 2026: commit 734f68c, «la scrivania di pzkko, i social come icone in un dock stile Apple». Seguiva alla lettera la richiesta di PRODUCT.md del 7.10: «linguaggio visivo e di movimento di Apple (principi dei talk WWDC tradotti per il web): tipografia di sistema, materiali traslucidi, molle interrompibili, sobrietà», e le due zone «tools» e «games» vuote con uno stato vuoto curato. Il 9.10 il credito e il badge FrogDR sono stati tolti dalla home e dalla 404 («è il suo sito»), e lo stesso giorno è arrivato [[Il muro (versione 2.0)|il muro]], che della scrivania ha tenuto solo l'idea delle zone ([[Le zone del muro]]). Anche su Vercel (a824ef5, 28f90f5): è di quei giorni il trucco di <code>tools/pzkko/build.mjs</code> che pubblica la cartella così com'è ([[Vercel (pzkko)]]).

{{Vedi anche|Le versioni di pzkko|Il portafoglio MagSafe|Il muro (versione 2.0)}}
[[Categoria:Le versioni]]`,
  },

  'Il muro (versione 2.0)': {
    data: '2026-10-17',
    fonti: [INDEX, README],
    testo: `'''Il muro (versione 2.0)''' è la home di [[pzkko.it]] dal 9 ottobre 2026 (commit 38e14a2, «il muro, la home come saracinesca coperta di graffiti e volantini»), la terza in tre giorni dopo [[Il portafoglio MagSafe|il portafoglio]] e [[La scrivania di pzkko|la scrivania]], e quella che è rimasta: [[Il muro|il muro]] di oggi è questa, cresciuta. Il 9.10 sono arrivate anche [[La sera a Mantova|la sera a Mantova]] (88bba2e: al tramonto si accendono i led dell'insegna, poi i lampioni) e [[La strada di notte|la strada di notte]] (a822303). Le immagini del muro sono nate quel giorno con [[gpt-image-2]] ([[Le immagini del muro]]: la lamiera, le carte, le illustrazioni, i graffiti, i nastri, i primi otto manifesti). Il 17.10 il muro si è alzato ([[I siti in cima]], la roulette in finestra, l'intonaco e l'insegna in SVG), il 18.10 ha avuto [[La scena 3D|la scena 3D]], il 23.10 è diventato la versione 3.0 [[Lumaca catodica|«lumaca catodica»]].

{{Vedi anche|Il muro|Le versioni di pzkko|Lumaca catodica}}
[[Categoria:Le versioni]]`,
  },

  'Lumaca catodica': {
    data: '2026-10-23',
    fonti: ['albertopecchini.it/pzkko/benvenuto/benvenuto.js', INDEX, README],
    testo: `'''Lumaca catodica''' è il nome della versione 3.0 di [[pzkko.it]], del 23 ottobre 2026 (commit 3dd64ba): «il muro parte in 2D di giorno, il resto si accende in regia». Quel giorno [[Come parte la home|la home ha smesso di partire col 3D]] e sono arrivati [[Lo scontrino delle novità|lo scontrino delle novità]], [[Il cercapersone nero|il cercapersone grande con le app]] e il led che lavora, [[La lumachina|la salute della lumachina]], [[Virtual|virtual]], [[Il banner del wallet|il banner del wallet]], il cercapersone che si accende con ACCEDI e si spegne come un tubo catodico (0b42030): la ''lumaca'' è la chiocciolina ([[Il tomodachi]]) e ''catodica'' è lo schermo. La 3.0.1 (c36837d) ha tolto il tasto giallo della regia. È durata fino alla 4.0.0 [[Chiocciola zero|«chiocciola zero»]] del 1.11.

{{Vedi anche|Le versioni di pzkko|Chiocciola zero|Come parte la home|Il cercapersone nero}}
[[Categoria:Le versioni]]`,
  },

  'Chiocciola zero': {
    data: '2026-11-01',
    fonti: ['albertopecchini.it/pzkko/benvenuto/benvenuto.js', 'albertopecchini.it/pzkko/telefono/telefono.js', README],
    testo: `{{Citazione|fai che cercapersone zero è predefinito e quello attuale si elimina per sempre|Alberto, 31.10.2026}}
'''Chiocciola zero''' è il nome della versione 4.0.0 di [[pzkko.it]], del 1° novembre 2026 (commit 6593e7b): «il cercapersone zero per tutti, il nero eliminato per sempre». [[Il cercapersone zero|Lo zero]], il mockup 3D bianco coi tasti arancioni con dentro [[pzk os]] a 8 bit, era in vendita nello shop a 9.999 $pzk dal 29.10; dal 31.10 è l'unico cercapersone: l'oggetto <code>zero</code> è fuori vendita, chi l'aveva comprato lo tiene coi suoi bonus (xp +10 %, attese −10 %), il traguardo «il salto di qualità» non c'è più, e del [[Il cercapersone nero|nero]] non restano né le foto né le app in HTML. Con la 4.0 arrivano anche [[La banca sul server|la banca sul server]] (31.10) e, il 2.11, [[Lavatrice (app)|la lavatrice]] e [[Decifratore (app)|il decifratore]] in pzk os e l'apertura col 3D che non blocca più il sito.

{{Vedi anche|Le versioni di pzkko|Il cercapersone zero|Lumaca catodica|Il cercapersone nero}}
[[Categoria:Le versioni]]`,
  },

  'Le immagini del muro': {
    data: '2026-10-22',
    fonti: ['albertopecchini.it/tools/pzkko/immagini.mjs', 'albertopecchini.it/tools/pzkko/fogli.js', 'albertopecchini.it/pzkko/art/pezzi.json', README],
    testo: `{{Infobox
| titolo = Le immagini del muro
| immagine = home-intera.webp
| didascalia = il muro è fatto di pezzi: carte, illustrazioni, graffiti, nastri, manifesti
| cartella = pzkko/art/
| modello = openai/gpt-image-2 su Replicate
| strumento = tools/pzkko/immagini.mjs, prompt in tools/pzkko/fogli.js
| misure = art/pezzi.json
| nate = 9 ottobre 2026 (poi 17, 21, 22.10)
}}
'''Le immagini del muro''' stanno in <code>pzkko/art/</code> e sono quasi tutte disegnate da [[gpt-image-2]] su [[Replicate]]: [[La lamiera|la lamiera]] (<code>muro.webp</code>, l'unica foto vera), <code>carta/</code> ([[Le carte dei volantini|nove fogli vuoti]]), <code>arte/</code>, <code>arte2/</code>, <code>arte3/</code>, <code>arte4/</code> (le illustrazioni stampate sui volantini, solo inchiostro), <code>tag/</code> (graffiti), <code>nastro/</code> (nastri, resti strappati, adesivo, puntina, graffette), <code>manifesti1…8/</code> ([[I manifesti e la roba degli altri]]), <code>scritte/</code> e <code>scritte2/</code> (le parole sprayate delle [[Le zone del muro|zone]]), <code>landini/</code>, <code>penne/</code>, <code>tasto/</code>, <code>strada1/</code> e <code>strada2/</code> (le gomme e le scritte degli altri sulla lamiera), <code>bestiole/</code> e <code>mosche/</code>, <code>fiches/</code>, <code>roulette/</code>, <code>blackjack/</code>, <code>moneta/</code>, <code>wallet/</code>, <code>wallet-banner/</code>, <code>banconote/</code>, <code>chat-*/</code> (le icone della chat e delle app: dal 26.10 a pixel con [[retro-diffusion rd-plus]]), <code>zero/</code> (le foto del cercapersone zero), <code>scena/</code> ([[Le trame]], [[Le foto dei volantini]], [[Le foto del caricamento]], [[Gli atlanti]], [[I disegni della scena]]), <code>storia/</code>. Ogni WebP porta dentro il prompt con cui è nato; le misure stanno in <code>pezzi.json</code>.

== Come si fanno ==
<code>node tools/pzkko/immagini.mjs genera <foglio|tutti></code> disegna [[I fogli di gpt-image-2|i fogli]] su fondo magenta in <code>tools/pzkko/lavoro/</code> (fuori dal repository), <code>usa <foglio|tutti></code> toglie il magenta con la chiave cromatica, separa i pezzi per cella e li scrive in <code>art/</code>. Le illustrazioni nascono su un cartoncino crema che <code>usa</code> rende trasparente; lo scotch resta traslucido; la lamiera si taglia sul passo delle doghe. Se l'attesa si interrompe («fetch failed», è successo il 21.10 con tutti e tre i fogli) la predizione è partita lo stesso e si paga: <code>recupera <foglio> <id></code> la scarica senza rigenerare. <code>usa</code> legge i PNG con ffmpeg, se c'è, se no con sharp (<code>leggiA</code> di <code>tools/mascotte/immagine.mjs</code>: su questo PC ffmpeg non c'è). Un pezzo va alla cella del suo baricentro: se il modello non fa le celle uguali, <code>tagli</code> nel foglio dice dove finiscono colonne e righe; <code>briciole</code> è la misura sotto cui un pezzo si scarta (i due punti e i trattini dell'orario sparivano).

== I marchi ==
I marchi e i nomi veri sui manifesti sono quelli che si trovano su un muro di città, disegnati dal modello: non sono pubblicità né collaborazioni. [[Le foto vere]] (gli adesivi degli amici, la Ciao) sono l'eccezione: fotografie, scontornate da [[bria/remove-background]].

{{Vedi anche|I fogli di gpt-image-2|Le foto vere|gpt-image-2|I crediti di pzkko|I disegni della scena}}
[[Categoria:Le immagini]]
[[Categoria:Il muro]]`,
  },

  'I fogli di gpt-image-2': {
    data: '2026-10-21',
    fonti: ['albertopecchini.it/tools/pzkko/fogli.js', 'albertopecchini.it/tools/pzkko/fogli-chat.js', 'albertopecchini.it/tools/pzkko/immagini.mjs', README],
    testo: `'''I fogli di gpt-image-2''' sono il modo in cui [[pzkko.it]] (e [[albertopecchini.it]]) chiede le immagini al modello: non un'immagine alla volta ma un foglio, una griglia di pezzi (3 × 3 o più) su un fondo magenta pieno, che lo script poi ritaglia con la chiave cromatica. Il modello dal 30.09.2026 non accetta più il fondo trasparente, e il magenta si toglie con <code>chiave()</code> di <code>tools/mascotte/immagine.mjs</code>. I prompt del muro stanno in <code>tools/pzkko/fogli.js</code> (carta, arte, tag, nastro, manifesti1…8, scritte, landini, penne, tasto, wallet, wallet-banner, banconote, facciata, adesivi, porta…), quelli della chat in <code>tools/pzkko/fogli-chat.js</code> (chat-cibo, chat-roba, chat-pzk, chat-pesci, chat-animali…: fino al 26.10, poi le icone sono passate a [[retro-diffusion rd-plus]]). Lo script è [[Le immagini del muro|immagini.mjs]]: <code>genera</code>, <code>usa</code>, <code>recupera</code>. Nel ritaglio la chiave lasciava una velatura rosa sui pezzi senza colore (il gesso diventava rosa, lo stencil viola): per gli [[Gli atlanti|atlanti]] della facciata la toglie <code>atlanti.mjs</code>. La qualità è sempre high: è una scelta di Alberto. Le stesse regole valgono per le figurine, le mascotte e i burattini del sito serio ([[Le figurine]], [[Le mascotte]]).

{{Vedi anche|Le immagini del muro|gpt-image-2|Replicate|retro-diffusion rd-plus|Le figurine}}
[[Categoria:Le immagini]]`,
  },

  'Le foto vere': {
    data: '2026-10-21',
    fonti: ['albertopecchini.it/tools/pzkko/amici.mjs', README],
    testo: `'''Le foto vere''' del [[Il muro|muro]] sono [[Gli adesivi degli amici|gli adesivi con le foto di Alberto e degli amici]] (<code>art/amici/</code>) e la Piaggio Ciao di [[Vendo il ciao|«vendo il ciao»]] (<code>art/annunci/ciao.webp</code>), dal 21.10.2026. Le fa <code>tools/pzkko/amici.mjs</code>:
* <code>scontorna <nome…|tutti></code> ruota la foto (EXIF), la ritaglia attorno alle persone (<code>ritaglio</code> in <code>FOTO</code>: meno fondo, meno sbagli, come la signora dietro nel negozio o l'auto dietro la ragazza), la porta a 2048 px in <code>tools/pzkko/lavoro/amici/</code> e la manda a [[bria/remove-background]]; la maschera resta lì e non si ripaga;
* <code>adesivi <nome…|tutti></code> fa l'adesivo: la foto con l'alfa del modello e sotto il vinile bianco, cioè la sagoma sfocata e tagliata bassa (si allarga di ~1,75 σ, arrotonda gli angoli e chiude i buchi piccoli, come una fustella); in sharp sfocatura e soglia vanno in due passi;
* <code>credito</code> aggiunge un'etichetta col nome del fotografo (simo4gantos8 sull'adesivo del Landini);
* <code>ciao</code> prende il JPEG a piena risoluzione dentro il CR2 della EOS 4000D (5184 × 3456, girato di 270°).
Le foto restano sul disco di Alberto (<code>D:\\disco immagini\\…</code>), qui solo i ritagli, senza metadati. Le altre foto vere del sito: [[La saracinesca di Bologna|le tre di Bologna]] e [[Le foto vere dei quiz|le 126 di Wikimedia Commons dei quiz]].

{{Vedi anche|Gli adesivi degli amici|Vendo il ciao|bria/remove-background|Le immagini del muro}}
[[Categoria:Le immagini]]`,
  },

  'Vercel (pzkko)': {
    data: '2026-10-29',
    fonti: ['albertopecchini.it/pzkko/vercel.json', 'albertopecchini.it/vercel.json', 'albertopecchini.it/tools/pzkko/build.mjs', README],
    testo: `{{Infobox
| titolo = Vercel (pzkko)
| progetto = pzkko, dal repository albertoxpecchini/AP
| domini = www.pzkko.it (principale), pzkko.it → 308 verso www
| build = node tools/pzkko/build.mjs (copia pzkko/ in dist/)
| funzioni = api/meteo, firme, wallet, borsa, giocatori, live
| variabili = PZKKO_SERVER_URL, PZKKO_SERVER_SECRET, PZKKO_ADMIN_KEY, WALLET_SECRET, GITHUB_TOKEN
| pubblica = ogni push su main
}}
'''Vercel (pzkko)''' è il progetto [[Vercel]] che pubblica [[pzkko.it]], dal [[Il repository AP|repository AP]]. Root Directory: dovrebbe essere <code>albertopecchini.it/pzkko</code> con preset Other (nessuna build, output = la cartella). Finché resta <code>albertopecchini.it</code> con preset Vite, ci pensa <code>tools/pzkko/build.mjs</code> (il <code>buildCommand</code> di <code>albertopecchini.it/vercel.json</code>): se la build gira per pzkko.it copia questa cartella in <code>dist/</code> così com'è, altrimenti lancia la build normale del sito (7.10.2026, commit 28f90f5). Ogni push su <code>main</code> pubblica da solo; i rami fanno anteprime protette da login ([[I rami del repository]]).

== Le funzioni ==
Le funzioni stanno in <code>pzkko/api/</code> e, finché la radice è <code>albertopecchini.it</code>, le riesportano i file di <code>albertopecchini.it/api/</code> (<code>meteo.js</code>, <code>firme.js</code>, <code>wallet.js</code>, <code>borsa.js</code>…): [[Le API di pzkko]]. '''Le chiamate vanno con la barra finale''' (<code>/api/wallet/</code>): il sito ha <code>trailingSlash</code>, e senza barra ogni POST passava da un redirect 308 che alcuni browser facevano confermare a ogni salvataggio. Il <code>maxDuration</code> è 60 (il [[Il canale sempre aperto|canale sempre aperto]]). I dati non stanno su Vercel: dal 28.10 sono sul [[Il server dei dati in casa|pc di Alberto]] ([[Vercel Blob]] è stato bloccato e il 29.10 tolto dal codice «per sempre»).

== vercel.json ==
<code>pzkko/vercel.json</code>: <code>cleanUrls</code>, <code>trailingSlash</code>, e su tutto <code>X-Content-Type-Options: nosniff</code>, <code>X-Frame-Options: SAMEORIGIN</code> (dal 27.10, per [[La cornice|la cornice della musica]]: prima era DENY; conta quello di <code>albertopecchini.it/vercel.json</code>, che vale per i tre siti), <code>Referrer-Policy</code>. <code>robots.txt</code> ammette tutto tranne <code>/api/</code>; la sitemap ha la home, la storia, le pagine della barra, pzk$meeting e, dal 2.11, la wiki.

{{Vedi anche|Vercel|Il progetto Vercel pzkko|Le API di pzkko|In locale (pzkko)|Il server dei dati in casa}}
[[Categoria:Vercel]]`,
  },

  'In locale (pzkko)': {
    data: '2026-10-29',
    fonti: ['albertopecchini.it/tools/dev.mjs', 'albertopecchini.it/package.json', 'albertopecchini.it/tools/online.mjs', README],
    testo: `'''In locale (pzkko)''': <code>cd albertopecchini.it</code> e <code>npm run dev:pzkko</code>, poi <code>http://localhost:5182</code>, che si ricarica a ogni modifica (anche <code>npm run dev:pzkko</code> dalla radice del repository). Il server è <code>tools/dev.mjs</code>: serve la cartella così com'è e fa come [[Vercel (pzkko)|Vercel]] con <code>vercel.json</code>: <code>/x</code> → <code>/x/</code>, <code>404.html</code> per le pagine che non ci sono, le stesse intestazioni. Niente Vite: riscriverebbe <code>new URL('.', import.meta.url)</code> dei giochi senza la barra finale (roulette e blackjack non troverebbero più i loro file). Porta fissa 5182, perché gli indirizzi inoltrati di VS Code restino validi; <code>PZKKO_PORT=5190</code> per un secondo server. Ricarica la pagina solo se un file cambia davvero (su Windows <code>fs.watch</code> segnala anche le letture).

== Cosa c'è in locale ==
* [[La banca sul server|la banca]] di Alberto, caricata in memoria coi file (<code>C:\\pzkko-server\\banca</code>, o <code>PZKKO_BANCA</code>): i conti e gli zaini si svuotano a ogni avvio;
* [[Il conto di Alberto|sempre dentro come pzkko]] (29.10): <code>/__dev/accesso</code> dà il token a chi chiede da questo computer o dalla rete Tailscale; <code>?ospite</code> lascia senza conto;
* le pagine di prova di <code>tools/pzkko/prove/</code> su <code>/prova/<nome>/</code>: <code>/prova/chat/</code> (la chat da sola) e <code>/prova/cercapersone/</code> (<code>#profilo</code>, <code>#miniera</code>… lo apre su quell'app); online non ci sono;
* [[Le firme della petizione|le firme]] in memoria finché il server resta acceso (<code>firme.mjs --locale</code>).
Da VS Code, '''F5''' avvia il sito serio su 5173; <code>npm run online</code> (Ctrl+Alt+O) accende i tre dev server (5173, 5181 per [[Better Call Pekko|bcp]], 5182 per pzkko) con gli indirizzi pubblici fissi dei dev tunnel di Microsoft. Dopo aver cambiato <code>tools/dev.mjs</code> il server sulla 5182 va riavviato (Ctrl+C e di nuovo <code>npm run dev:pzkko</code>): fermare il task non basta, il processo node resta. Alberto guarda il risultato subito su localhost:5182 e manda foto.

{{Vedi anche|Vercel (pzkko)|La banca sul server|Il conto di Alberto|Il repository AP}}
[[Categoria:Il repository]]`,
  },

  'I crediti di pzkko': {
    data: '2026-10-26',
    fonti: ['albertopecchini.it/pzkko/info/index.html', 'albertopecchini.it/pzkko/games/roulette/lib/LICENSE-three.txt', README],
    testo: `'''I crediti di pzkko''': la home e [[La 404|la 404]] non hanno piè di pagina: il credito e il badge FrogDR sono stati tolti su richiesta di [[Alberto Pecchini|Alberto]] il 9.10.2026 («è il suo sito»; i giochi portano ancora il credito). I crediti stanno nella pagina [[Info (pagina)|info]], nel README e qui:

* '''le immagini''' del muro sono generate con [[gpt-image-2|openai/gpt-image-2]] su [[Replicate]], come le figure delle carte del [[Il blackjack|blackjack]] (<code>art/blackjack/</code>, il prompt nel <code>.json</code> accanto a ogni figura), le facce della [[La moneta|moneta]], il [[Il pomodoro|pomodoro]], [[I disegni della scena|la roba per terra e il fronte della scena]]; dal 26.10 le icone della chat e delle app sono a pixel con [[retro-diffusion rd-plus]]; [[Le foto vere|le foto vere]] sono scontornate da [[bria/remove-background]];
* '''i caratteri''': Anton, Archivo Black, Abril Fatface, Shrikhand, Bungee, Black Ops One, Rubik Mono One, Alfa Slab One, Caveat, Reenie Beanie, Nothing You Could Do (SIL OFL), Special Elite, Permanent Marker, Rock Salt, Homemade Apple (Apache 2.0), da Google Fonts, serviti da <code>fonts/</code>; [[Cascadia Code]] (OFL) per il codice C; [[Il font Fake Receipt|Fake Receipt]] per gli scontrini ([[I caratteri del muro]]);
* '''il 3D''' è [[three.js]] r186 (MIT), '''la fisica''' [[Rapier]] 0.21 (Apache 2.0), con le licenze in <code>games/roulette/lib/</code> e <code>telefono/zero/lib/</code>;
* '''le foto''' degli adesivi sono di Alberto e dei suoi amici; quella sul Landini è di simo4gantos8; le foto dei quiz vengono da [[Wikimedia Commons]] con autore e licenza stampati sotto; le tre di [[La saracinesca di Bologna|Bologna]] sono di Alberto;
* '''il meteo''' viene da [[Open-Meteo]]; il C si compila su [[Compiler Explorer]] e Wandbox;
* [[pzk os]] è ispirato al Flipper Zero (il modello 3D viene da un mockup OBJ; il firmware non c'è: è riscritto da zero);
* '''copyright''': © 2026 Alberto Pecchini: il muro, i disegni, i testi e il codice di pzkko sono suoi, dove non è scritto altro; i nomi e i marchi sui volantini sono dei loro proprietari.

{{Vedi anche|Info (pagina)|Le licenze|Le immagini del muro|I caratteri del muro}}
[[Categoria:Il muro]]
[[Categoria:Le immagini]]`,
  },

  "La favicon e l'og": {
    data: '2026-10-27',
    fonti: ['albertopecchini.it/pzkko/favicon.png', 'albertopecchini.it/pzkko/og.jpg', 'albertopecchini.it/pzkko/tools/lezioni/og.jpg', README],
    testo: `[[File:/og.jpg|thumb|og.jpg, l'anteprima dei link condivisi di pzkko.it (1200 × 630)]]
'''La favicon e l'og''' di [[pzkko.it]]: <code>favicon.png</code> (64 × 64) e <code>apple-touch-icon.png</code> sono l'adesivo con la chiocciola sulla lamiera: [[La chiocciola gigante africana|la chiocciola]] resta qui, non nell'[[L'insegna|insegna]]. Il 27.10.2026 l'icona del telefono è stata rifatta, «con la sagoma raddrizzata e il bordo omogeneo» (commit 99aaf00). <code>og.jpg</code> (1200 × 630) è l'anteprima per i link condivisi; [[pzk$meeting]] ha la sua, <code>tools/lezioni/og.jpg</code>, da una lezione inventata, e [[La storia del muro|la storia]] <code>art/storia/og.jpg</code>. Sul sito serio l'anteprima è generata da [[L'anteprima og|tools/og]] coi testi di <code>site.js</code>; qui è un'immagine fissa. Le pagine della [[La barra in alto|barra]] usano <code>og.jpg</code> con <code>og:site_name</code> «pzkko». Il <code>theme-color</code> è <code>#3a3631</code> (il muro) e <code>#665d56</code> per la wiki.

{{Vedi anche|La chiocciola gigante africana|L'anteprima og|L'insegna}}
[[Categoria:Il muro]]
[[Categoria:Le immagini]]`,
  },

  'Il manuale del Landini': {
    data: '2026-10-21',
    fonti: [INDEX, 'albertopecchini.it/tools/pzkko/fogli.js', README],
    testo: `'''Il manuale del Landini''' (<code>art/landini/</code>, 21.10.2026) sono la copertina e la pagina dell'avviamento del libretto d'istruzioni del Landini L 25 testacalda, 1957, attaccate al [[Il muro|muro]] fra [[I manifesti e la roba degli altri|la roba degli altri]]: disegnati da [[gpt-image-2]], non è la scansione di un libretto vero. Il Landini è di casa su pzkko: [[Gli adesivi degli amici|l'adesivo]] di Alberto all'aratura sul Landini (foto di simo4gantos8), la [[Le side quest|side quest]] «Il Landini non parte» («testa calda del 1957, da scaldare col fuoco»), gli oggetti dello [[Lo shop|shop]] «Landini L25» e «il manuale del Landini» ([[Elenco degli oggetti]]), le foto dei quiz. L'icona <code>manuale-landini</code> della chat è anche l'icona della voce '''wiki''' nella [[La barra in alto|barra]] (provvisoria dal 26.10).

{{Vedi anche|I manifesti e la roba degli altri|Elenco degli oggetti|Elenco delle side quest}}
[[Categoria:Il muro]]`,
  },

  'Il meme unimore contro unibo': {
    data: '2026-10-21',
    fonti: [INDEX, README],
    testo: `'''Il meme unimore contro unibo''' è uno dei manifesti della roba degli altri arrivati in cima al [[Il muro|muro]] il 17.10.2026 (<code>manifesti3/</code>, [[I manifesti e la roba degli altri]]), e la scritta sprayata «unimore ≥ unibo» di <code>scritte2/</code>. [[Alberto Pecchini|Alberto]] studia a [[Unimore]] (la matricola 398893 è anche il suo indirizzo pzk); la rivalità con Bologna, dove è nata [[La saracinesca di Bologna|la saracinesca]], è il filo. Lo stesso adesivo «unimore ≥ unibo» è curvo attorno al pluviale sulla facciata della [[La scena 3D|scena 3D]] ([[I graffiti e gli adesivi della facciata]]) e il manifesto sta anche sul muro della [[La storia del muro|storia]].

{{Vedi anche|Unimore|Bologna|I manifesti e la roba degli altri}}
[[Categoria:Il muro]]`,
  },

  'La roba per terra (2D)': {
    data: '2026-10-21',
    fonti: [INDEX, README],
    testo: `'''La roba per terra (2D)''' è quello che sta in fondo alla [[La lamiera|lamiera]] nel [[Il muro|muro]] di sempre: gomme da masticare schiacciate (<code>art/strada1/gomme</code>, <code>bestiole/gomme2</code>) e le scritte degli altri (<code>art/strada2/</code>: «ti amo giulia», «NO», «ciao mamma», «w la pizza», «zio», «qui»), le cinque [[Le mosche e le formiche del muro|formiche]] in fila, il rivolo della [[La goccia della condensa|goccia]]. Nella [[La scena 3D|scena 3D]] per terra c'è molto di più, in tre dimensioni: [[La spazzatura per terra|la spazzatura della casa]] (la lattina di pzk-kola, il ramen Pechino, il pacchetto di luckypzkko, i volantini bagnati, [[I grissini alla pizza|i grissini]]), [[Il chiusino di pzkkonet]], [[Il portachiavi della banca $pzk]], [[Le banconote per terra]], e le formiche fanno la fila proprio alle gomme della pagina.

{{Vedi anche|La spazzatura per terra|Le bestie|Il muro}}
[[Categoria:Il muro]]`,
  },
}
