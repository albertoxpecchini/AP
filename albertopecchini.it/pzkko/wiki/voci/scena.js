// pzkkopedia, le voci della scena 3D, della regia e del suono (2.11.2026). Il formato e il wikitesto: tools/pzkko/wiki/README.md.
// La fonte è la sezione «La scena 3D (scena/)», «La regia (regia/)» e «Il suono (suono/)» di pzkko/README.md: quando cambia
// una di quelle, cambia anche la voce.

const SCENA = 'albertopecchini.it/pzkko/scena/'
const SUONO = 'albertopecchini.it/pzkko/suono/'
const TOOLS = 'albertopecchini.it/tools/pzkko/scena/'
const README = 'albertopecchini.it/pzkko/README.md'
const INDEX = 'albertopecchini.it/pzkko/index.html'

export const VOCI = {
  'La scena 3D': {
    data: '2026-10-29',
    fonti: [SCENA + 'scena.js', SCENA + 'mondo.js', SCENA + 'luci.js', SCENA + 'scena.css', README, INDEX],
    testo: `{{Infobox
| titolo = La scena 3D
| immagine = scena-cima
| didascalia = la strada vista da lontano, all'arrivo della telecamera
| dove = pzkko.it/ con il 3D acceso (o ?scena=1)
| dal = 18 ottobre 2026 (dal 19 anche sul telefono)
| cartella = pzkko/scena/
| motore = three.js r186, WebGL 2
| peso = ~2 MB sul computer, ~1,5 sul telefono
}}
'''La scena 3D''' è [[il muro]] di [[pzkko.it]] disegnato dalla scheda grafica come il posto di un videogioco: la stessa saracinesca coi suoi [[I volantini|volantini]], ma con luci, ombre e riflessi veri, il marciapiede bagnato, la porta a vetri del negozio, i palazzi di fronte, le bestie che camminano e il meteo di [[Mantova]]. Dal 18 ottobre 2026 (commit <code>2e23562</code>, «la home diventa un posto vero in 3D, con luci, ombre e riflessi»), dal 19 anche sul telefono (<code>bbc6d79</code>).

== Com'è fatto il trucco ==
La pagina di sempre resta lì, sotto, invisibile (<code>html.scena3d</code> in <code>scena.css</code>): i link dei volantini, [[i tagliandi]] e [[i giochi]] sono ancora i suoi. La scena si disegna in una tela fissa dietro, e '''l'inquadratura è calcolata perché la saracinesca 3D stia esattamente dove sta il muro nel DOM''': una proiezione decentrata, con la telecamera un po' a destra e più in basso del centro, come una persona sul marciapiede con un obiettivo decentrabile, ma il piano della parete finisce pixel per pixel sui pixel della pagina. La telecamera sta fissa davanti alla vetrina e sale e scende con lo scorrimento, mai sotto mezzo metro da terra (più giù guarderebbe il marciapiede da sotto). <code>?allinea=1</code> mostra il DOM in trasparenza sopra la scena per controllare che combacino.

Ogni elemento <code>.it</code> della parete diventa un foglio di poligoni nel suo posto esatto ([[I fogli (scena)|i fogli]]); la lamiera, le guide, la barra con la serratura, la facciata, la porta, il marciapiede e la strada sono [[il posto]] (<code>mondo.js</code>, tutto in metri: 1 unità della parete = 1,6 mm, la saracinesca è larga 2,05 m). Le luci stanno in <code>luci.js</code> ([[le luci a insiemi]]), il meteo in <code>meteo.js</code> ([[il meteo]]), le bestie in <code>bestie.js</code> ([[le bestie]]), l'acqua in <code>acqua.js</code> ([[l'acqua]]).

== Com'è una scelta ==
Fino al 23 ottobre la scena partiva da sola dove c'era WebGL 2. Dal 23.10 (versione 3.0 «[[Lumaca catodica]]») '''il 3D è una scelta''': di partenza la home è il muro di sempre, e la scena parte solo se la si accende nella [[La regia|regia]] («come parte», in cima alla scheda «grafica»: <code>pzkko-3d</code> = <code>si</code> nel browser, la pagina si ricarica) o con <code>?scena=1</code>. Acceso, parte a mezzogiorno col sole (l'orologio fermo, il meteo <code>sole</code>), e con l'ora vera e il meteo vero scelti fa come prima: [[la sera a Mantova]], la notte, [[le auto che passano|le auto]], la pioggia. <code>?muro=1</code> tiene il muro di sempre; senza WebGL 2 resta quello, senza che la pagina se ne accorga. Vedi [[Come parte la home]].
{{Citazione|per adesso avvialo sia da telefono che da pc in 2d con sempre luce sparata|Alberto, 23.10.2026}}

== Quanto pesa e quanto va ==
Da scaricare ~2 MB sul computer (three.js 627 KB, 171 compresso; i volantini 1,3 MB; le trame 74 KB) e ~1,5 MB sul telefono (i volantini 0,8 MB). Triangoli per fotogramma, con ombre e specchi: ~38 000 sul computer, ~32 000 sul telefono (erano 390 000 e 600 000 il 19.10). Il 21.10 sulla RTX 3060 Ti, di notte, auto ferme, <code>--libero</code>: 200–256 fotogrammi al secondo. Su una Intel UHD 630 a 1440 × 900: ~120 di giorno, ~90 di notte. I numeri e i livelli di qualità stanno in [[Il costo e la qualità]].

== Le parti ==
* [[Il caricamento è il pomodoro]] e [[L'arrivo]]: come si entra nella strada.
* [[Il posto]], [[Il fronte del negozio]], [[Le lettere dell'insegna]], [[Dentro il negozio]].
* [[I fogli (scena)]], [[Le foto dei volantini]], [[Le foto del caricamento]], [[Le trame]], [[Gli atlanti]], [[I disegni della scena]].
* [[Le luci a insiemi]], [[Il meteo]], [[L'acqua]], [[Il muro bagnato]], [[Le bestie]], [[Il marciapiede]], [[Le pozzanghere]].
* [[La spazzatura per terra]], [[Il chiusino di pzkkonet]], [[Il portachiavi della banca $pzk]], [[Le banconote per terra]], [[Le cose che si toccano]].
* [[La vetrina]], [[La scena sul telefono]], [[Il costo e la qualità]], [[Il tetto della scheda]], [[Le trappole della compilazione]], [[Il contesto perso]], [[L'altra pagina già scaricata]].
* [[La regia]] per provare tutto, [[Il suono]] per sentirlo, [[Le prove della scena]] per misurarlo, [[La scena in Blender]] per portarselo via.

== La console ==
All'apertura la console dice «costruita, shader, primi fotogrammi», «anteprime a bordo in N s» e «pronta, vista, arrivata». <code>window.pzkkoScena</code> è l'oggetto della scena: <code>grafica()</code> e <code>imposta()</code>, <code>fps()</code>, <code>pc</code> (il portachiavi), <code>b.dentro</code> (le bestie), <code>a</code> (l'acqua), <code>h.lettere</code>, <code>h.negozio.schermo</code>, <code>tc.trova(x, y)</code> (cosa c'è sotto un punto), <code>meteo</code> e <code>me.lampo()</code>.

== Attenzione ==
Gli strumenti che misurano o fotografano la pagina 2D (<code>disponi.mjs</code>, <code>cattura.mjs</code>) la aprono con <code>?muro=1</code>, altrimenti la scena sposta il muro e le misure vengono sbagliate. [[La storia del muro]] e [[la 404]] hanno la stessa scena, con le loro foto del caricamento.
{{Vedi anche|Il muro|Le versioni di pzkko|three.js|La regia|Il suono della strada}}
[[Categoria:La scena 3D]]`,
  },

  'Il caricamento è il pomodoro': {
    data: '2026-10-23',
    fonti: [INDEX, SCENA + 'scena.js', TOOLS + 'pomodoro.mjs', TOOLS + 'carico.mjs', README],
    testo: `[[File:/art/scena/pomodoro/matura.webp|thumb|i fotogrammi del pomodoro che matura, dal verde chiaro al rosso pieno]]
'''Il caricamento è il pomodoro''' è la schermata con cui [[la scena 3D]] arriva, dal 21 ottobre 2026 sera (commit <code>39e1dd9</code>). Dal 20.10 c'era solo «[[L'arrivo|l'arrivo]]», senza schermata: davanti al nero e a un filo giallo di 2 px chi non lo sapeva ricaricava, credendo il sito rotto.

== Come va ==
Uno script nella testa di <code>index.html</code>, se il 3D partirà (scelto o <code>?scena=1</code>, WebGL 2, niente <code>?muro</code>), mette subito <code>html.scena-carico</code> (la pagina trasparente su nero: il muro non si vede nemmeno per un attimo) e chiede '''per primi''' il foglio di stile e i moduli della scena (<code>modulepreload</code>) e <code>art/scena/pomodoro/matura.webp</code>. Poi, nell'ordine:
# '''subito il pomodoro che matura''', al centro, col contatore sotto («44%, si sta preparando…»), già al primo disegno della pagina: finché non arriva <code>matura.webp</code> si vede il suo primo fotogramma, piccolo, dentro la pagina (<code>PRIMO</code>, 2 KB). Fino al 21.10 sera c'era un secondo di nero, che sul telefono diventava 3–4: la scena teneva ferma la pagina a costruirsi e a compilare gli shader. Ora la compilazione cede fra un programma e l'altro (<code>cedi</code> in <code>scena.js</code>) e il pomodoro respira con un'animazione CSS, che non si ferma nemmeno quando lo script è occupato. Col processore rallentato 4 volte il pomodoro c'è a 0,46 s invece che a 1,5.
# '''la sfocatura''': dietro il pomodoro sfuma dal nero la strada da lontano com'è al primo fotogramma, sfocata (<code>.carico-foto</code>): [[le foto del caricamento]], 8–20 KB in WebP senza perdita.
# '''lo scoppio''': la scena pronta non si mostra da sola, lo dice al caricamento (<code>window.pzkkoScoppia</code>), che finisce di far maturare il pomodoro (mai più in fretta di 0,8 s dal verde al rosso), lo gonfia tremando (0,3 s), lo fa scoppiare in quattro fotogrammi che volano verso la telecamera (0,28 s) e '''macchia la telecamera''': la macchia copre lo schermo e lì sotto la tela compare di colpo, mentre la foto sfocata sfuma nella strada nitida (la messa a fuoco, 0,9 s). Dopo 0,4 s la macchia cola giù e sfuma in 1,1 s. Per 0,3 s la telecamera non si muove, e il meteo resta quello della foto (<code>tieni</code> in <code>meteo.js</code>). Col movimento ridotto niente scoppio: il pomodoro matura e sfuma.
# '''lo zoom che finisce la risoluzione''': dopo mezzo secondo la telecamera si avvicina quanto è arrivata la risoluzione piena (le foto vere dei volantini all'80 %, le trame vere per terra al 20 %), chiesta solo ora. Mai all'indietro, mai più veloce del volo (2,6 s), morbida. Dopo 20 s arriva comunque. In basso il '''filo giallo''' di 2 px dice a che punto è.

Il pomodoro matura quanto la scena è pronta (<code>window.pzkkoCarico</code>: i moduli, la costruzione, gli shader, le anteprime fino a 0,45), morbido; quando non arriva niente va avanti piano da solo (mai oltre il 97 %, mai indietro). Otto fotogrammi, il secondo strato in dissolvenza sul primo.

== Le immagini ==
Le disegna [[gpt-image-2]] su [[Replicate]] e le scontorna [[bria/remove-background]]: [[Il pomodoro|<code>tools/pzkko/scena/pomodoro.mjs</code>]]. Pesano 94 KB (matura), 134 (scoppio) e 192 (macchia). Le illustrazioni dei volantini della pagina col 3D non si scaricano proprio: lo script le trattiene (<code>window.pzkkoTrattenute</code>) e le rimette solo se servono.
{{Vedi anche|Il pomodoro|L'arrivo|Le foto del caricamento|L'altra pagina già scaricata|La scena 3D}}
[[Categoria:La scena 3D]]`,
  },

  'Il pomodoro': {
    data: '2026-10-21',
    fonti: [TOOLS + 'pomodoro.mjs', INDEX, README],
    testo: `{{Infobox
| titolo = Il pomodoro
| immagine = /art/scena/pomodoro/scoppio.webp
| didascalia = i quattro fotogrammi dello scoppio
| file = art/scena/pomodoro/matura.webp, scoppio.webp, macchia.webp
| strumento = tools/pzkko/scena/pomodoro.mjs
| disegnato da = gpt-image-2 su Replicate, scontornato da bria/remove-background
| peso = 94 + 134 + 192 KB
}}
'''Il pomodoro''' è l'immagine del caricamento della [[La scena 3D|scena 3D]] (vedi [[Il caricamento è il pomodoro]]): matura al centro dello schermo mentre la scena si costruisce, scoppia e macchia la telecamera.

== Come nasce ==
<code>tools/pzkko/scena/pomodoro.mjs</code>: <code>genera <matura|scoppio|macchia|tutti></code>, <code>recupera <nome> <id></code> (una predizione già pagata, se l'attesa si interrompe), <code>usa</code>. I prompt sono lì dentro. Il modello disegna su un grigio neutro pieno, bria dà l'alfa e <code>usa</code> toglie dai pixel a metà il grigio del fondo: dove ne restasse un filo è neutro. La prima volta (21.10) era su un blu pieno tolto con la chiave cromatica, e nel succo e nei bordi trasparenti il blu si vedeva.

<code>usa</code> mette i fotogrammi in fila col pomodoro allo stesso posto in tutti, sfuma lo scoppio verso i lati della sua cella (il modello lascia uscire gli schizzi dell'ultimo fotogramma, che sarebbero tagliati dritti) e scrive in <code>index.html</code> <code>PRIMO</code> (il primo fotogramma piccolo, 2 KB, che si vede prima che arrivi il file) e <code>SCOPPIO</code>, quante volte un fotogramma dello scoppio è più grande di uno di matura; poi rilancia <code>genera-storia.mjs</code> e <code>genera-404.mjs</code>. L'uscita di bria resta in <code>lavoro/</code> accanto al disegno (<code>.alfa.png</code>): rifacendo <code>usa</code> non si ripaga.

== Il suono ==
Se i suoni sono già accesi, lo scoppio fa splat ([[I suoni dell'interfaccia|le mani]] in [[Il suono della strada]]).
{{Vedi anche|Il caricamento è il pomodoro|I disegni della scena|gpt-image-2}}
[[Categoria:La scena 3D]] [[Categoria:Le immagini]]`,
  },

  'L\'arrivo': {
    data: '2026-10-23',
    fonti: [SCENA + 'scena.js', README],
    testo: `[[File:scena-cima|thumb|la strada da lontano, dove parte il volo]]
'''L'arrivo''' è il volo della telecamera con cui [[la scena 3D]] comincia: da lontano, dall'altra parte del marciapiede, ad altezza d'occhio, tutto il negozio nell'inquadratura (sul telefono la parte alta della saracinesca, con [[l'insegna]]), fino all'inquadratura di sempre.

== Il volo ==
La distanza cala in scala logaritmica (l'avvicinamento ha sempre la stessa velocità a vista) e il centro si sposta in proporzione alla distanza, come in un volo in linea retta; l'angolo di campo va da quello di lontano (dal 21.10 dipende dalla forma della finestra: da lontano la telecamera sta in un punto fisso, <code>lontano</code> in <code>scena.js</code>, e la finestra decide solo quanto del piano della saracinesca si vede, metà altezza 1,22 · max(bh, bw / forma)) a quello dell'arrivo con la stessa legge. Il punto d'arrivo segue lo scorrimento, quindi si può scorrere anche durante il volo; toccare o scorrere da lontano fa partire subito. Dal 21.10 sera il volo dura 2,6 s e parte sotto la macchia del [[Il caricamento è il pomodoro|pomodoro]], avvicinandosi quanto è arrivata la risoluzione piena.

Arrivata, la pagina sotto torna a rispondere (si toglie <code>scena-carico</code>). Con <code>prefers-reduced-motion</code> (o <code>?intro=0</code>) niente volo: la scena compare già arrivata, e le foto vere prendono il posto delle anteprime lì. Se qualcosa va storto si torna al muro di sempre. «Rifai l'arrivo» sta nella scheda «prove» della [[La regia|regia]]; <code>sessionStorage</code> <code>pzkko-subito</code> fa ricaricare senza l'arrivo (lo usa [[il contesto perso]]).

== Prima del 21.10 ==
Il 20.10 l'arrivo era l'unica schermata di caricamento: nero e un filo giallo. Dal 21.10 sera c'è il pomodoro. Il 19.10 (<code>bbc6d79</code>) l'arrivo dalla strada aveva preso il posto di una schermata di caricamento coi volantini.
{{Vedi anche|Il caricamento è il pomodoro|La scena 3D|Le prove della scena}}
[[Categoria:La scena 3D]]`,
  },

  'Le luci a insiemi': {
    data: '2026-10-21',
    fonti: [SCENA + 'luci.js', SCENA + 'scena.js', README],
    testo: `[[File:home-notte|thumb|la sera: l'insegna, la lampada sopra la porta, i lampioni di là]]
'''Le luci a insiemi''' è il modo in cui [[la scena 3D]] tiene basso il costo delle luci: ogni luce visibile si calcola per ogni pixel di ogni materiale illuminato, anche spenta (su una Intel UHD le undici luci di notte costavano metà del fotogramma, anche a mezzogiorno).

== I tre insiemi ==
In <code>luci.js</code>:
* '''giorno''' = il sole e il cielo;
* '''sera''' = anche le luci della notte (insegna, lampada sopra la porta, lampioni, l'auto), da quando la pagina ne accende una;
* '''notte''' = senza il sole, sotto l'orizzonte.
Ogni insieme vuole i suoi programmi (il numero delle luci entra in tutti): quello di partenza si compila a tela nascosta, gli altri in sottofondo quando servono, un pezzo per fotogramma (mettere in coda un programma costa ~40 ms sul filo principale); intanto si va avanti con le luci di prima e si cambia quando è tutto pronto. Sui livelli «poche luci» (le integrate, il telefono) [[l'insegna]] ha una lampada invece di tre, i lampioni di là sono solo lampadine accese, l'auto ha un faro solo e niente rosso dei freni né neon sotto.

== Il sole e la notte ==
Il sole è dove sta davvero sopra [[Mantova]] all'ora dell'orologio della pagina (di partenza mezzogiorno, fermo; con l'ora vera, a quest'ora), con lo stesso calcolo NOAA de [[La sera a Mantova|la sera a Mantova]] più altezza e azimut; la facciata guarda a sud-sud-ovest, 200°. Il cielo (addon <code>Sky</code>) fa da sfondo, da luce d'ambiente e da riflesso (PMREM, rifatto quando il sole si sposta di 0,6°). Dal 21.10 il posto è più chiaro: luce del cielo, ambiente ed esposizione di un terzo in più.

Di notte la scena legge ogni fotogramma le luci della pagina da <code>window.pzkkoPagina.luci</code> (<code>notte</code>, <code>insegna</code> con lo sfarfallio <code>f-insegna</code>, <code>lampioni</code>, <code>auto-x</code>, <code>auto-l</code>, <code>auto-c</code>, <code>freno</code>, <code>neon-auto</code>: dal 21.10 non più dalle variabili CSS su <code>html</code>, vedi [[La regia]]) e accende i poligoni: i tubi al neon dentro [[Le lettere dell'insegna|le lettere]], tre lampade bianco caldo davanti al pannello, la lampada a muro sopra la porta (un faro con le ombre), i lampioni di là, le finestre dei palazzi; e '''[[Le auto che passano|l'auto che passa]] è un'auto''': una berlina sulla strada dietro la telecamera (da x = −10 a 12 m, così esce dallo specchio della porta prima di sparire), coi fari che spazzano la saracinesca e la porta, i fanali rossi, il neon sotto. Si riflette nel vetro e nelle [[Le pozzanghere|pozzanghere]]. Prove: <code>?ora=18:30</code>, <code>?notte=1</code>, <code>?auto=1</code>.

Il tone mapping è AgX, che porta al pastello ciò che è molto saturo e acceso: l'OutputPass per quei pixel (i fanali, il neon sotto l'auto) mescola una curva che tiene la tinta (<code>AGX_NEON</code>), senza toccare carta e muri. La stessa luce la usa [[La luce dello zero|il cercapersone zero]].
{{Vedi anche|La sera a Mantova|La strada di notte|Le trappole della compilazione|Il costo e la qualità}}
[[Categoria:La scena 3D]]`,
  },

  'Le trappole della compilazione': {
    data: '2026-10-21',
    fonti: [SCENA + 'scena.js', README],
    testo: `'''Le trappole della compilazione''' sono i casi in cui [[three.js]] compila un programma della scheda grafica nel momento sbagliato: un programma che manca al momento di disegnare si compila lì, bloccando (su Windows ~200 ms l'uno: erano 5 s di nero nella [[La scena 3D|scena 3D]]).

== La chiave di un programma ==
La chiave comprende la destinazione (dentro la tela del post-processing three toglie il tone mapping; l'ultimo passaggio va sullo schermo), le luci e la nebbia della scena in cui si disegna, gli attributi della geometria e se il materiale è opaco. Quindi <code>compila</code> in <code>scena.js</code> compila la scena dentro la sua tela, col cielo già pronto come ambiente (il PMREM entra nei materiali), con la carrozzeria dell'auto (nascosta finché non passa) e con la carta sia trasparente sia opaca; i quadri del bagliore (di giorno è spento: si compilerebbero al tramonto, con uno scatto) e l'OutputPass (che decide le sue <code>#define</code> al primo render) attraverso la mesh del loro <code>FullScreenQuad</code> (un triangolo con solo posizione e uv: con un piano qualunque la chiave non combaciava), l'OutputPass sullo schermo. Restano al primo fotogramma, a tela nascosta, i due materiali di profondità delle ombre, che three crea da sé (~0,3 s).

<code>?programmi=1</code> dice in console cosa si compila ai primi fotogrammi e dopo: deve essere +2 e poi niente. Dal 21.10 sera la compilazione cede fra un programma e l'altro (<code>cedi</code>) così [[Il caricamento è il pomodoro|il pomodoro]] va avanti.

== Le altre ==
Il cielo come ambiente si rifà solo quando il sole si sposta di 0,6°; le variabili della pagina si leggono da <code>html.style</code>, non con <code>getComputedStyle</code> (che a ogni fotogramma ricalcolerebbe lo stile di tutta la pagina); la posizione della parete si rilegge solo quando la pagina cambia misura. Lo stesso problema, nel [[Il cercapersone zero|cercapersone zero]], bloccava la pagina 5,8 s all'apertura col 3D acceso (2.11, risolto con <code>compileAsync</code>: vedi [[La luce dello zero]]).
{{Vedi anche|Le luci a insiemi|Il costo e la qualità|Il contesto perso}}
[[Categoria:La scena 3D]]`,
  },

  'La scena sul telefono': {
    data: '2026-10-21',
    fonti: [SCENA + 'scena.js', SCENA + 'scena.css', README],
    testo: `[[File:scena-telefono|thumb|la scena sul telefono: due colonne, la saracinesca alta 13,4 m]]
'''La scena sul telefono''' è [[la scena 3D]] sotto i 900 px, dal 19 ottobre 2026 (commit <code>bbc6d79</code>).

== La parete ==
La parete è quella del telefono (due colonne, 390esimi, alta 5486 unità dal 22.10), quindi la saracinesca è larga 0,95 m e alta ~13,4 m ([[i volantini]] restano grandi come quelli veri, ~45 cm); [[l'insegna]], la lampada e il piano di sopra si mettono rispetto a lei. Le foto dei volantini sono fatte apposta nella disposizione del telefono (<code>art/scena/vol-m/</code>: lì il testo è un po' più grande). Di notte la luce di un lampione dall'altra parte della strada prende tutta la parete alta. La tela è alta <code>100lvh</code>, così la barra del browser che va e viene non la ridimensiona. Girando il telefono (o allargando la finestra oltre i 900 px) la pagina si ricarica, perché cambia [[la disposizione]] dei fogli.

== Una scena sola, la minima ==
Dal 21.10 sera il telefono ha una scena sola e niente da scegliere (la [[La regia|regia]] lì non ha la qualità): '''alla risoluzione dello schermo''' (3× su un iPhone, al massimo 12 milioni di pixel), senza anti-alias, '''senza ombre''' (<code>shadowMap.enabled</code> spento, i materiali non la leggono), '''senza specchi''' (il vetro della porta e [[le pozzanghere]] nascosti, le loro tele da un pixel), '''senza bagliore e senza post-processing''': si disegna dritto sullo schermo (<code>diretta</code>), e il tono AgX e l'sRGB li fa ogni materiale; la curva che tiene saturi i colori accesi (<code>AGX_NEON</code>) entra in ogni materiale con <code>conNeon</code>. Poche luci, la pioggia e la neve al 40 %.

'''Scorrendo''' la risoluzione scende di un terzo (<code>moto</code>: 3× → 2× su un iPhone) e torna piena un quarto di secondo dopo che la telecamera si è fermata: da fermo un iPhone faceva 60 fotogrammi al secondo, scorrendo 22–30, perché Safari compone anche la pagina che si muove. Sotto la scena i fogli coi link non hanno più ombre sfocate né fusioni (<code>scena.css</code>). Prima il telefono era 1,5× con ombre 1024/512, specchi 384 e bagliore, e un iPhone 16 Pro faceva 20 fotogrammi al secondo, un iPhone 14 10. Nella prova del 21.10 (390 × 844 a 3×, sulla 3060 Ti): di notte 0,9 ms a fotogramma invece di 5,9, con la pioggia 1,25 invece di 7,1, a quattro volte i pixel.
{{Vedi anche|Il costo e la qualità|La scena 3D|Ferma quando è ferma}}
[[Categoria:La scena 3D]]`,
  },

  'La vetrina': {
    data: '2026-10-21',
    fonti: [SCENA + 'scena.js', SCENA + 'scena.css', README],
    testo: `'''La vetrina''' è il carrello della telecamera verso il fronte del negozio, dal 21 ottobre 2026. Sul computer la telecamera sta più indietro (3,1 m dalla saracinesca, era 2,6) e la parete del DOM è più stretta (<code>54vw</code> in <code>scena.css</code>, era 64): si vede più strada, più porta, più marciapiede.

== Col mouse sul fronte ==
Col mouse sul fronte del negozio (saracinesca, insegna, porta) la telecamera si avvicina di 1,25 volte (a 2,5 m: un carrello, non uno zoom, l'angolo di campo resta quello e la porta e il marciapiede girano come camminando) '''tenendo fermo quello che sta sotto il puntatore''', come una lente: quello che c'è intorno si allarga attorno a lui, e spostando il mouse la lente lo segue. La parete del DOM si scala dello stesso fattore attorno allo stesso punto (<code>transform: scale()</code> su <code>.parete</code>, con <code>transform-origin</code> nel puntatore), così i link e [[i tagliandi]] restano pixel per pixel sotto [[i volantini]] (e <code>?allinea=1</code> lo mostra anche da vicino); la misura di base della parete si rilegge a transform tolta. Una molla smorzata porta avanti e indietro in ~0,7 s; fuori dal fronte si torna indietro.

Solo col mouse e a scena arrivata (col tocco non c'è «sopra», e sul telefono la parete è già vicina); la [[La regia|regia]] la spegne («vetrina», <code>REGIA.vetrina</code>). Davanti alla porta, a meno di 7 m, si sente [[Il PC con Ubuntu|il PC del negozio]].
{{Vedi anche|La scena 3D|Il fronte del negozio|La regia}}
[[Categoria:La scena 3D]]`,
  },

  'Il posto': {
    data: '2026-10-21',
    fonti: [SCENA + 'mondo.js', SCENA + 'materiali.js', SCENA + 'scena.css', README],
    testo: `[[File:scena-meta|thumb|il fronte del negozio a metà pagina: saracinesca, porta, marciapiede]]
'''Il posto''' è il mondo di <code>mondo.js</code>, dove vive [[la scena 3D]]: tutto in metri, 1 unità della parete = 1,6 mm, la saracinesca è larga 2,05 m.

== Le doghe ==
Le doghe della saracinesca sono poligoni bombati, col canale al giunto e qualche ammaccatura: otto righe per doga, fitte al giunto e larghe sulla pancia, e una colonna ogni 17 cm, 6000 triangoli (erano 36 000). La vernice è la foto de [[La lamiera|la lamiera]] senza la sua luce (<code>art/scena/lamiera.webp</code> e <code>lamiera-r.webp</code>, la rugosità dove c'è sporco e ruggine, tirate fuori da <code>muro.webp</code> da <code>tools/pzkko/scena/mappe.mjs</code>). Poi le guide, la barra con la serratura, la facciata d'intonaco col buco e le spalle (da −10 m a 11 m oltre la saracinesca, dal 21.10: da lontano, in una finestra larga, si vedeva il cielo), lo zoccolo di pietra, il pluviale, le cinque finestre del piano di sopra.

== L'insegna, la porta, la strada ==
[[L'insegna]] è il cassonetto d'alluminio (1,5 m, più stretto della saracinesca e centrato su di lei), appena sopra l'architrave, col pannello sporco (<code>art/scena/pannello.svg</code>) e davanti [[Le lettere dell'insegna|le lettere a scatola]]; sopra il cassonetto il trasformatore del neon. A destra [[La porta a vetri|la porta a vetri]] del negozio, con [[Dentro il negozio|dentro]] il bancone, gli scaffali e la spia dell'allarme. Davanti [[il marciapiede]] con [[le pozzanghere]], il cordolo, l'asfalto, e di là dalla strada cinque palazzi con le finestre che la sera si accendono, e due lampioni. In <code>scena.css</code> il muro è messo in modo che al centro dello schermo stia tutto il fronte del negozio, così la porta e la lampada (sopra, su un braccio da un metro) entrano nell'inquadratura anche a 1440 px.

== I pezzi fermi sono uniti ==
Dal 21.10 (<code>fisso</code>/<code>fondi</code> in <code>mondo.js</code>) le ~70 scatole, profili e tubi della facciata (guide, spalle, zoccolo, finestre, pluviale, telaio della porta, cassonetto, lampada, cordoli, lampioni, bancone) stanno in una mesh per materiale (e per ombre, e per gruppo), perché ogni mesh è una chiamata di disegno in ogni passaggio (lo schermo, due ombre, due specchi): le mesh da 242 a 196, le chiamate di un fotogramma fermo da 128 a 116. Le cose piatte per terra stanno sul '''livello 1''', che la telecamera vede e gli specchi no: <code>mondo.js</code> lo spegne mentre uno specchio disegna.
{{Vedi anche|Il fronte del negozio|L'intonaco vero|Il marciapiede|La scena 3D}}
[[Categoria:La scena 3D]]`,
  },

  'Il fronte del negozio': {
    data: '2026-10-21',
    fonti: [SCENA + 'fronte.js', SCENA + 'disegni.js', TOOLS + 'disegni.mjs', README],
    testo: `[[File:scena-fondo|thumb|in fondo alla pagina: il lucchettone, il chiusino, la roba per terra]]
'''Il fronte del negozio''' è la parte della [[La scena 3D|scena 3D]] intorno alla saracinesca, rifatta il 21 ottobre 2026 (<code>fronte.js</code>, commit <code>39e1dd9</code>): tutto disegnato da [[gpt-image-2]] su [[Replicate]], niente scritto dal codice. Prima la targa «12» e il cartello «chiuso» erano testo su una tela, la porta e il citofono scatole grigie.

== I pezzi ==
* [[La porta a vetri]], col telaio, l'anta, il maniglione, gli adesivi e il cartello «CHIUSO · torniamo presto».
* [[La targa del civico 28]], smaltata blu.
* [[Il citofono]], che di notte si accende e si suona.
* [[Il lucchettone]], coricato sul marciapiede a tenere chiusa la saracinesca.
* [[I graffiti e gli adesivi della facciata]], nei due atlanti di <code>art/scena/muro/</code>.
* [[L'intonaco vero]], con le crepe, le colature e i buchi coi mattoni.
* [[Dentro il negozio]], il PC con Ubuntu che si pianta.

== Come si rifà ==
Le immagini sono in <code>art/scena/fronte/</code> (<code>citofono</code> col suo <code>-normali</code> e <code>-lucido</code>, <code>lucchetto</code> e <code>lucchetto-fondo</code>, <code>alluminio</code> e <code>zoccolo</code> della porta) e arrivano in due giri, anteprima e vera (<code>disegni.js</code>). Dopo un disegno nuovo: <code>disegni.mjs usa</code>, <code>anteprime.mjs</code>, o <code>immagini.mjs usa <foglio></code> e <code>atlanti.mjs</code>; poi <code>carico.mjs</code>, perché la facciata si vede nelle [[Le foto del caricamento|foto del caricamento]]. Dal 21.10 la scena ha ~12 chiamate di disegno in più.
{{Vedi anche|Il posto|I disegni della scena|Le cose che si toccano}}
[[Categoria:La scena 3D]]`,
  },

  'La porta a vetri': {
    data: '2026-10-22',
    fonti: [SCENA + 'fronte.js', SCENA + 'mondo.js', SCENA + 'tocchi.js', README],
    testo: `'''La porta a vetri''' è la porta del negozio a destra della saracinesca, nella [[La scena 3D|scena 3D]], rifatta il 21 ottobre 2026 con [[Il fronte del negozio|il fronte]].

== Com'è fatta ==
Il telaio fisso nel muro, l'anta coi montanti da 6,5 cm, il traverso a un metro, lo zoccolo pestato dalle scarpe (<code>zoccolo.webp</code>), la soglia; l'alluminio anodizzato vecchio (<code>alluminio.webp</code>) è una trama sola, stesa in coordinate del mondo e specchiata, che sui montanti va in su e sui traversi per lungo, tutti i profili in una geometria. Il maniglione d'acciaio coi distanziali, il cilindro d'ottone con la fessura, tre cerniere. Sul vetro, fuori, gli adesivi: l'orario in lettere di vinile bianco, «vietato fumare», «area videosorvegliata», «spingere»; sul montante pzkkonet e l'occhio. Dentro, il cartello «CHIUSO · torniamo presto» appeso coi due fili a una ventosa.

Il vetro è uno specchio vero della strada (Reflector): ci si riflette [[Le auto che passano|l'auto]] e la strada, e per questo l'auto arriva fino a x = 12 m, così esce dallo specchio prima di sparire. Sul telefono lo specchio non c'è ([[La scena sul telefono]]). La stanza dietro fa ombra con le facce davanti (<code>shadowSide</code>): il sole e la lampada non entrano dai muri, dentro è buio anche di giorno.

== Si tocca ==
Dal 22.10 ([[Le cose che si toccano]]): il vetro si bussa, i profili d'alluminio suonano vuoti, il maniglione la fa sbattere sulla serratura (è chiusa a chiave). Col mouse sul fronte [[La vetrina|la vetrina]] ci porta vicino, e da lì si sente [[Il PC con Ubuntu|il PC]] dietro il vetro.
{{Vedi anche|Il fronte del negozio|Dentro il negozio|Il citofono}}
[[Categoria:La scena 3D]]`,
  },

  'La targa del civico 28': {
    data: '2026-10-21',
    fonti: [SCENA + 'fronte.js', README],
    testo: `'''La targa del civico 28''' è la targa smaltata blu accanto alla [[La porta a vetri|porta a vetri]] del negozio nella [[La scena 3D|scena 3D]], scheggiata attorno alle viti, con lo spessore della lamiera dietro. L'ha disegnata [[gpt-image-2]] il 21 ottobre 2026 insieme al resto de [[Il fronte del negozio|il fronte]]: prima era la targa «12», testo su una tela.

Il numero 28 è lo stesso del [[Il citofono|citofono]] («citofono 28» è anche una cosa in vendita ne [[Lo shop|lo shop]]) e della side quest [[Il civico 28]], «una porta che dice chiuso dal 1987».
{{Vedi anche|Il fronte del negozio|Il citofono}}
[[Categoria:La scena 3D]]`,
  },

  'Il citofono': {
    data: '2026-10-22',
    fonti: [SCENA + 'fronte.js', SCENA + 'tocchi.js', SCENA + 'luci.js', TOOLS + 'disegni.mjs', README],
    testo: `{{Infobox
| titolo = Il citofono
| immagine = /art/scena/fronte/citofono.webp
| didascalia = la piastra disegnata da gpt-image-2
| misura = 12 × 18 cm
| file = art/scena/fronte/citofono.webp, citofono-normali, citofono-lucido
| dal = 21 ottobre 2026
}}
'''Il citofono''' è la piastra d'alluminio di 12 × 18 cm accanto alla [[La porta a vetri|porta]], nella [[La scena 3D|scena 3D]].

== Com'è disegnato ==
[[gpt-image-2]] ha disegnato prima i rilievi (l'altoparlante a fori, la finestrella del nome, il pulsante, le viti), poi il colore '''da quei rilievi''' (il nome «pzkko» a penna, il pulsante d'ottone consumato), così coincidono al pixel; dai rilievi <code>disegni.mjs usa</code> fa le normali e il lucido, una volta lì e non nel browser. È lo stesso metodo del [[Il chiusino di pzkkonet|chiusino]].

'''Di notte la finestrella del nome si accende''': la carta che brilla coi suoi colori e il nome scuro sopra (<code>h.citofono</code>, che <code>luci.js</code> accende col buio).

== Si suona ==
Dal 22.10 ([[Le cose che si toccano]]) il pulsante d'ottone è un disco vero sopra quello disegnato (la stessa immagine): si abbassa di 2 mm e il campanello trilla dentro il negozio finché lo si tiene (fino a 4 s); a volte poi il citofono si apre, fruscia e si richiude senza che nessuno parli. Il suono è in [[Il suono della strada|voci.js]], e si prova dalla scheda «suono» della [[La regia|regia]].
{{Vedi anche|Il fronte del negozio|La targa del civico 28|I disegni della scena}}
[[Categoria:La scena 3D]]`,
  },

  'Il lucchettone': {
    data: '2026-10-22',
    fonti: [SCENA + 'fronte.js', SCENA + 'tocchi.js', README],
    testo: `[[File:/art/scena/fronte/lucchetto.webp|thumb|la faccia del lucchetto, col marchio «PZKKO 90 mm»]]
'''Il lucchettone''' è il lucchetto d'ottone da 12 cm che tiene chiusa la saracinesca nella [[La scena 3D|scena 3D]], dal 21 ottobre 2026: <code>lucchetto.webp</code> è la faccia col marchio «PZKKO 90 mm», <code>lucchetto-fondo.webp</code> il fondo col cilindro della chiave (nato dalla sua faccia), più il ferro da 18 mm.

Passa nell'occhiello saldato davanti alla barra in fondo (una piastra col buco) e nella cambretta murata nella soglia. Gli occhielli sono a 6 cm da terra, quindi il corpo non pende: è coricato sul marciapiede, inclinato di 10°, la faccia in su e il fondo verso la strada. A sinistra del centro (sul computer 42 cm, sul telefono 20), si vede in fondo alla pagina e nella [[Le pozzanghere|pozzanghera]].

Dal 22.10 si tocca: ottone contro ferro, dondola ([[Le cose che si toccano]]). Il «lucchettone» è anche uno degli oggetti di pzk ne [[Lo shop|lo shop]], e fa perdere meno $pzk quando si muore.
{{Vedi anche|Il fronte del negozio|Il posto}}
[[Categoria:La scena 3D]]`,
  },

  'I graffiti e gli adesivi della facciata': {
    data: '2026-10-21',
    fonti: [SCENA + 'fronte.js', TOOLS + 'atlanti.mjs', 'albertopecchini.it/tools/pzkko/fogli.js', 'albertopecchini.it/tools/pzkko/immagini.mjs', README],
    testo: `'''I graffiti e gli adesivi della facciata''' sono le scritte e gli adesivi sull'intonaco intorno alla saracinesca nella [[La scena 3D|scena 3D]], dal 21 ottobre 2026: i fogli <code>facciata</code>, <code>adesivi</code> e <code>porta</code> di <code>tools/pzkko/fogli.js</code> ([[gpt-image-2]] su magenta, ritagliati da <code>immagini.mjs usa</code> in <code>art/<foglio>/</code>), messi in due atlanti da <code>tools/pzkko/scena/atlanti.mjs</code> ([[Gli atlanti]]: <code>art/scena/muro/graffiti.webp</code> e <code>adesivi.webp</code>, con le anteprime a metà in <code>muro/lo/</code>), così sono due chiamate di disegno e non venticinque.

== Dove stanno ==
Sull'intonaco, bagnati come lui: a sinistra del pluviale il pezzo «PZK» argento e la pittura del comune sopra un graffito vecchio, fra il pluviale e la guida la tag blu «pzk 2026», sopra la porta il pennarello rosso «pekko», a destra lo stencil «DIVIETO DI AFFISSIONE» e la tag verde «gimbo»; sulla pietra dello zoccolo la chiocciola col gesso, «mnt» e «46100». Gli adesivi sul pluviale sono curvi attorno al tubo (hello my name is pekko, [[Il meme unimore contro unibo|unimore ≥ unibo]], il teschio, uno strappato), altri sul muro vicino al [[Il citofono|citofono]] (la nutria, il concerto della chiocciola) e fra il pluviale e la guida (MN).

Nel ritaglio la chiave del magenta lasciava una velatura rosa sui pezzi senza colore (il gesso diventava rosa, lo stencil viola): <code>atlanti.mjs</code> la toglie. Da lontano un graffito è largo quanto la sua anteprima. I graffiti sulla lamiera sono un'altra cosa: stanno sui triangoli della lamiera, vedi [[I fogli (scena)]].
{{Vedi anche|Il fronte del negozio|Gli atlanti|Le immagini del muro|I fogli di gpt-image-2}}
[[Categoria:La scena 3D]] [[Categoria:Le immagini]]`,
  },

  'L\'intonaco vero': {
    data: '2026-10-21',
    fonti: [SCENA + 'materiali.js', TOOLS + 'trame.mjs', README],
    testo: `'''L'intonaco vero''' è lo shader della facciata della [[La scena 3D|scena 3D]] (<code>intonacoVivo</code> in <code>materiali.js</code>, 21 ottobre 2026). Prima la facciata era una trama procedurale da un metro ripetuta, piatta.

== Cosa fa ==
Nello shader, in coordinate del mondo: la stessa trama letta anche a 9 m rompe la ripetizione e fa le chiazze larghe dello sporco (più ruvide); le '''crepe''' (nell'alfa della trama <code>intonaco.webp</code>: sei passeggiate a caso che si biforcano, <code>intonaco()</code>) si vedono solo a zone, così non si nota che tornano ogni metro; le '''colature della pioggia''', righe verticali sottili, appena su tutta la facciata e più scure sotto i davanzali delle tre finestre e sotto il cassonetto; la '''pittura scrostata''' a chiazze dal bordo netto col filo d'ombra, sotto il cemento grigio; '''l'intonaco caduto''' in due buchi (fra la guida sinistra e il pluviale, e sopra la porta) coi mattoni dentro, i giunti di malta e l'ombra dell'orlo. Una decina di letture di rumore per pixel di facciata, come [[Il muro bagnato|il bagnato]].

Dopo aver toccato <code>intonaco()</code> va rilanciato <code>tools/pzkko/scena/trame.mjs</code> ([[Le trame]]). Le gocce di pioggia e l'umidità che sale dal terreno col salnitro sono de [[L'acqua|l'acqua]].
{{Vedi anche|Le trame|Il posto|Il muro bagnato}}
[[Categoria:La scena 3D]]`,
  },

  'Dentro il negozio': {
    data: '2026-10-21',
    fonti: [SCENA + 'negozio.js', SCENA + 'mondo.js', README],
    testo: `'''Dentro il negozio''' c'è quello che si vede attraverso [[la porta a vetri]] della [[La scena 3D|scena 3D]]: il buio con il bancone, gli scaffali e la spia dell'allarme che lampeggia (la stanza fa ombra con le facce davanti, <code>shadowSide</code>: il sole e la lampada non entrano dai muri, dentro è buio anche di giorno). Sul bancone, dal 21 ottobre 2026, [[Il PC con Ubuntu|un PC da ufficio di vent'anni fa]] con Ubuntu che si pianta e si riavvia in loop: un easter egg, nessuno lo dice.

Il negozio si sente anche: davanti alla porta (a meno di 7 m, [[La vetrina|la vetrina]] ci porta) il PC fa i suoi rumori, e [[Il citofono|il citofono]] trilla dentro.
{{Vedi anche|Il PC con Ubuntu|La porta a vetri|Il posto}}
[[Categoria:La scena 3D]]`,
  },

  'Il PC con Ubuntu': {
    data: '2026-10-21',
    fonti: [SCENA + 'negozio.js', SUONO + 'suono.js', README],
    testo: `'''Il PC con Ubuntu''' è l'easter egg [[Dentro il negozio|dentro il negozio]] della [[La scena 3D|scena 3D]] (<code>negozio.js</code>, 21 ottobre 2026): sul bancone, dietro il vetro, un PC da ufficio di vent'anni fa (monitor LCD beige, torre, tastiera) acceso, con '''Ubuntu che si pianta e si riavvia in loop''', ~25 s a giro.

== Il giro ==
Il BIOS che conta la memoria, l'errore del CMOS e la schermata blu del Setup col cursore rosso che va a caricare i valori di default, GRUB col conto alla rovescia, i puntini arancioni di plymouth, la scrivania con la barra e la dock e un terminale in cui qualcuno scrive il comando che manda in crash il kernel (<code>echo c | sudo tee /proc/sysrq-trigger</code>), il kernel panic riga per riga, lo schermo morto, il nero, e da capo.

== Com'è fatto ==
Lo schermo è una tela 2D (320 × 240) disegnata al più dieci volte al secondo, solo quando cambia qualcosa e solo se la porta è nell'inquadratura; un materiale senza luci col colore oltre l'1, così di notte brilla col bagliore. Sul bancone il bagliore dello schermo (un piano sommato, col colore della fase), sulla torre il led verde (spento nel riavvio) e quello arancione del disco. Niente luci vere: ognuna costerebbe a ogni pixel di tutta la scena. Sei chiamate di disegno in tutto. <code>window.pzkkoScena.h.negozio.schermo</code> è la tela.

== Si sente ==
Dal 21.10 il PC dice la sua fase (<code>fase(now)</code>) e [[Il suono della strada|la strada]] lo suona a meno di 7 m: si spegne e si riaccende (la ventola, il disco che prende i giri), il bip del POST, il floppy, il disco che lavora, qualcuno che va nel Setup con le frecce, le quattro note di legno della scrivania (non è il suono di Ubuntu), la password, il comando battuto, Invio; poi il panico, e da capo.
{{Vedi anche|Dentro il negozio|Il suono della strada}}
[[Categoria:La scena 3D]]`,
  },

  'I fogli (scena)': {
    data: '2026-10-26',
    fonti: [SCENA + 'fogli.js', SCENA + 'materiali.js', TOOLS + 'cattura.mjs', README],
    testo: `'''I fogli''' sono [[i volantini]], i manifesti e i graffiti del muro portati nella [[La scena 3D|scena 3D]] da <code>fogli.js</code>: ogni elemento <code>.it</code> della parete diventa un foglio di poligoni nel suo posto esatto (le <code>--px --py --pw --pr</code> già risolte dal CSS: sul computer le <code>--x --y --w --r</code>, sul telefono le <code>--mx --my --mw --mr</code>), suddiviso in sei righe per doga e una colonna ogni 12 cm e piegato sulla bombatura delle doghe (concava: fra le righe la lamiera sta sotto la curva e la carta, 0,8 mm sopra, resta sopra).

== I graffiti ==
I graffiti stanno attaccati al metallo: quelli scuri sono vernice che si moltiplica col metallo (come il <code>multiply</code> della pagina, l'inchiostro resta nero e si legge), quelli chiari (<code>.chiaro</code> e <code>.bianco</code>) coprono. Dal 20.10 '''stanno sugli stessi triangoli della lamiera''' (le sue righe e colonne dentro il rettangolo del graffito, <code>lamiera()</code> in <code>materiali.js</code>), un decimo di millimetro sopra, con la foto stesa in coordinate del mondo: prima avevano una griglia loro, sfasata di 0,4 doghe, e la lamiera li bucava a strisce. La vernice non si alza col puntatore.

== La carta ==
La carta sta un filo sopra, uno strato per foglio nell'ordine di sovrapposizione della pagina (z-index e ordine nel DOM); finita la dissolvenza diventa opaca e si disegna prima della lamiera, che sotto di lei non si calcola più (i fogli coprono metà saracinesca). I volantini usano [[Le foto dei volantini|le foto fatte da cattura.mjs]]; quelli coi [[I tagliandi|tagliandi]] hanno la fascia tolta e '''ogni tagliando è un foglietto suo''', che cade quando la pagina gli mette <code>.cade</code> e sparisce con <code>.via</code>. Il foglio sotto il puntatore (o col fuoco) si alza di 2 cm con una molla. La carta lucida (<code>c-lucido</code>) ha la vernice (clearcoat). '''La nitidezza''': i fogli si vedono rimpiccioliti (sul computer ~2,8 pixel di foto per pixel di schermo) e la scheda li leggerebbe da un livello di mipmap che li sfoca; si legge mezzo livello più in qua (il «bias» di <code>texture2D</code>, −0,6, in <code>nitida</code>).

== Le cose vive ==
Dal 26.10 [[il wallet]] e [[il cercapersone zero]] stanno sulla parete come gli altri pezzi, e la scena li disegna con una '''tela viva''' (<code>viva</code>) che ricopia dieci volte al secondo le loro immagini, i canvas accesi e i riquadri colorati, con un filo di luce sua; il bottone resta sopra, trasparente, per i clic (<code>.vivo</code> in <code>scena.css</code>). Il foglio de [[la petizione]] ha sopra la sua foto [[Le firme della petizione|le firme vere]], scritte dal vivo dove <code>cattura.mjs</code> ha misurato la tabella (<code>firme</code> in <code>vol.json</code>); mentre il foglio si avvicina per firmare, spariscono foglio e [[Le penne della petizione|penne]] (evento <code>pzkko-petizione</code>) e la scena si riposa. Le Live Photo de [[La storia del muro|la storia]] sono una trama ricaricata a ogni fotogramma mentre il video va.

<code>superficie(x, y)</code> è una griglia di 1 cm che dice il foglio più in alto in ogni punto, con la sua alzata: ci camminano sopra [[le bestie]] e ci si appoggiano le penne.
{{Vedi anche|Le foto dei volantini|I volantini|La scena 3D|La disposizione}}
[[Categoria:La scena 3D]]`,
  },

  'Le lettere dell\'insegna': {
    data: '2026-10-20',
    fonti: [SCENA + 'lettere.js', 'albertopecchini.it/pzkko/art/insegna.svg', 'albertopecchini.it/pzkko/art/insegna-notte.svg', README],
    testo: `[[File:/art/insegna-notte.svg|thumb|l'insegna disegnata, di notte, coi tubi al neon accesi dentro le lettere]]
'''Le lettere dell'insegna''' sono le cinque lettere «pzkko» sopra la saracinesca: dal 20 ottobre 2026 (commit <code>dc3ca8f</code>, «"pzkko" nell'insegna con le lettere dell'originale, a scatola col neon dentro») hanno '''le lettere della «coin» vera''', quella sopra [[La saracinesca di Bologna|la saracinesca di via Rizzoli]]. Stanno in <code>lettere.js</code> per la [[La scena 3D|scena 3D]] e, uguali, in <code>art/insegna.svg</code> e <code>insegna-notte.svg</code> per [[l'insegna]] del muro 2D.

== Le misure ==
Vengono da IMG_0334 a piena risoluzione, raddrizzata: la foto guarda in su e in verticale tutto è schiacciato a 0,95; ridisegnata con quei pezzi, «coin» cade sul bordino delle lettere vere a un paio di pixel. In unità dove la x è alta 100: il tratto è 30; la o è un cerchio di 102 (sborda di 1 sopra e sotto) col buco di 43; la c un semicerchio di 100 col buco di 41 e le braccia tagliate dritte; la n un arco di 103 sulle gambe; la i un rettangolo di 30 (il puntino è un tamburo largo 71). Gli spazi: fra due tondi 2, fra un tondo e un'asta 7, fra due aste 9. La p, la z e la k sull'insegna vera non ci sono e sono fatte con gli stessi pezzi: la p è la o con l'asta (giù fino a 152), la z e la k col tratto di 30 e gli spigoli vivi come i tagli della c e le gambe della n (l'asta della k sale a −58).

== La scatola e il neon ==
Come quelle vere sono '''lettere a scatola''' (ExtrudeGeometry): la faccia di metacrilato bianco, i fianchi d'alluminio grigio profondi quasi mezza x (5,6 cm, con la x alta 12,5), il bordino che tiene la faccia (lo smusso della scatola, più scuro dei fianchi: è la riga che sulla foto disegna ogni lettera) e la barra su cui sono avvitate. '''Dentro, il neon''': la lettera è cava e bianca, e a metà del tratto corre il tubo da 13 mm, a 2,4 cm dal fondo: la p dal piede dell'asta e poi il giro della pancia, la z in un pezzo, la k l'asta e poi braccio e gamba, la o il giro con un varco in basso a sinistra. Come lo piega un vetraio: gli spigoli sono curve, ai capi il tubo gira all'indietro nel fondo (il gomito nero dell'elettrodo, il passacavo di gomma), i supporti ogni ~12 cm. La faccia è traslucida (opacità 0,7, e non fa ombra): la lettera resta bianca e il tubo si intravede, spostato dalla prospettiva perché sta 3 cm più indietro. Tre mesh con un gruppo nascosto ciascuna (la faccia, i fianchi, l'interno).

Di sera il tubo si accende bianco caldo (il gas oltre l'1, il bagliore lo allarga) e la faccia e il fondo prendono la sua luce, più forte vicino al tubo (una tela coi tubi sfocati, per <code>emissiveMap</code>). Hanno la loro occlusione sul pannello (<code>aoMap</code>: le lettere sfocate, più sotto che sopra), che tocca solo la luce del cielo: col cielo coperto le lettere bianche sul pannello bianco non spariscono. Di sera tre lampade bianco caldo davanti al pannello fanno la luce dei neon sul muro (sul telefono una). Niente chiocciola, niente rosso né blu: la chiocciola resta sull'adesivo della favicon. [[Le mosche]] si posano anche sulle facce (<code>sopra(x, y)</code>). Lo sfarfallio resta quello della pagina (<code>--insegna</code>, <code>--f-insegna</code>), e il trasformatore ronza ne [[Il suono della strada|la strada]].
{{Vedi anche|L'insegna|La saracinesca di Bologna|Le luci a insiemi|La strada di notte}}
[[Categoria:La scena 3D]]`,
  },

  'L\'acqua': {
    data: '2026-10-21',
    fonti: [SCENA + 'acqua.js', README],
    testo: `'''L'acqua''' nella [[La scena 3D|scena 3D]] è la condensa che scende dal muro alla lamiera (<code>acqua.js</code>, dal 20 ottobre 2026): la stessa [[La goccia della condensa|goccia]] del muro 2D, ma vera.

== La goccia ==
La condensa dello split del primo piano esce dal muro sotto la finestra (il buco col rosone), scende in un tubo grigio fissato con le graffe, entra sotto l'architrave e finisce contro la lamiera a destra de [[l'insegna]]. La goccia si gonfia alla bocca (3–9 s), si stacca e scende a scatti come sulla vernice vera: più è grossa più corre, dove la lamiera la trattiene si ferma, quando la raggiunge un'altra si uniscono e ripartono, per strada perde acqua; in fondo resta appesa alla barra e cade sulla soglia: schizzo e cerchio, e il «plic» ne [[Il suono della strada|la strada]] (<code>evento('goccia')</code>). <code>window.pzkkoScena.a</code> è l'acqua; la [[La regia|regia]] la fa più fitta o più rada, e una adesso.

== Il muro bagnato ==
Il bagnato è uno shader solo, <code>bagnato(materiale, tipo)</code>: vedi [[Il muro bagnato]]. Il rivolo disegnato della pagina (<code>bestiole/rivolo.webp</code>, <code>data-scena="no"</code>) resta solo nel muro di sempre.
{{Vedi anche|Il muro bagnato|La goccia della condensa|Il meteo}}
[[Categoria:La scena 3D]]`,
  },

  'Il muro bagnato': {
    data: '2026-10-21',
    fonti: [SCENA + 'acqua.js', SCENA + 'materiali.js', README],
    testo: `'''Il muro bagnato''' è lo shader <code>bagnato(materiale, tipo)</code> di <code>acqua.js</code>, in coordinate del mondo, applicato alla lamiera, alla carta, all'intonaco e alla pietra della [[La scena 3D|scena 3D]]: dopo l'<code>onBeforeCompile</code> del materiale, con la chiave del programma più «bagnato» (lo stesso trucco di <code>conNeon</code> su [[La scena sul telefono|il telefono]]).

== Cosa disegna ==
Il rivolo scuro e lucido lungo la stessa linea storta delle gocce de [[l'acqua]], che si allarga verso il basso e nei giunti delle doghe, col velo d'acqua che scorre (la normale si muove verso il basso); la carta bagnata più scura e satura; sotto il buco del tubo la riga d'umido sull'intonaco; in basso gli schizzi della pioggia (20–40 cm); sull'intonaco l'umidità che sale dal terreno col bordo bianco del salnitro (dal 21.10 a chiazze, sfrangiato e granuloso, più tenue: era una riga bianca ondulata continua lungo tutta la facciata, finta); ai piedi del rivolo la pozza, che c'è sempre anche col sole ([[Le pozzanghere]]). Quanto è bagnato lo decide [[il meteo]]: la pioggia dell'ultima ora e delle ultime 12, il marciapiede resta bagnato quando ha smesso e asciuga dopo giorni di sole. Senza 3D, [[Il suono della strada|la strada]] usa un bagnato di 0,15 col sole e 0,4 col meteo vero.
{{Vedi anche|L'acqua|Il meteo|L'intonaco vero}}
[[Categoria:La scena 3D]]`,
  },

  'Le bestie': {
    data: '2026-10-21',
    fonti: [SCENA + 'bestie.js', SCENA + 'fogli.js', README],
    testo: `'''Le bestie''' sono gli animali in 3D della [[La scena 3D|scena 3D]] (<code>bestie.js</code>, dal 20 ottobre 2026): al posto dei disegni piatti del muro ([[Le mosche e le formiche del muro]]), a grandezza vera o quasi: [[le formiche]] (13 mm), [[le mosche]] (13 mm), [[le zanzare tigre]] e [[le blatte]] (38 mm, solo di notte).

== Come sono fatte ==
Ogni specie è una mesh a istanze, le ali trasparenti un'altra: zampe (a tripode, la fase legata alla strada fatta: i piedi non scivolano), antenne e ali le muove lo shader. Camminano sulla superficie vera (<code>superficie(x, y)</code> di [[I fogli (scena)|fogli.js]]: una griglia di 1 cm dice il foglio più in alto, con la sua alzata) e si inclinano sulle doghe. Niente mappe d'ombra (si rifarebbero a ogni fotogramma): un'ombra morbida sotto ognuna, che si allarga e sbiadisce quando si stacca. Con <code>prefers-reduced-motion</code> stanno ferme. Il puntatore nel mondo è dove il raggio dalla telecamera tocca la saracinesca o il marciapiede (anche il tocco sul telefono). Costano ~0,1 ms di processore a fotogramma.

Nella [[La regia|regia]], scheda «strada»: ogni specie sì o no, le blatte anche di giorno, la velocità, «spaventale», una zanzara davanti alla telecamera. In console <code>window.pzkkoScena.b.dentro</code> (<code>mosche</code>, <code>zanzare</code>, <code>blatte</code>, <code>formiche</code>, <code>decolla</code>); <code>?blatte=1</code> fa uscire le blatte anche di giorno. Si sentono ne [[Il suono della strada|la strada]]: le mosche e le zanzare ronzano mentre volano, le blatte zampettano sulla pietra da vicino.
{{Vedi anche|Le formiche|Le mosche|Le zanzare tigre|Le blatte|Le mosche e le formiche del muro}}
[[Categoria:La scena 3D]]`,
  },

  'Le formiche': {
    data: '2026-10-20',
    fonti: [SCENA + 'bestie.js', README],
    testo: `'''Le formiche''' (13 mm) sono [[Le bestie|le bestie]] in fila alle gomme da masticare sulla lamiera, nella [[La scena 3D|scena 3D]]: una pista dalla barra in fondo a <code>strada1/gomme</code>, una dalla guida di destra a <code>bestiole/gomme2</code>; storta, ognuna col suo scarto. Si fermano ad antennarsi quando si incrociano, mangiano e tornano con la briciola rosa, rientrano e ripartono; col puntatore vicino si sparpagliano e poi ritrovano la pista. Ne [[La storia del muro|la storia]] vanno in fila alle gomme di quel muro. Nel muro 2D sono cinque formiche disegnate che camminano lungo il bordo basso della lamiera ([[Le mosche e le formiche del muro]]).
{{Vedi anche|Le bestie|Le mosche}}
[[Categoria:La scena 3D]]`,
  },

  'Le mosche': {
    data: '2026-10-23',
    fonti: [SCENA + 'bestie.js', 'albertopecchini.it/pzkko/wallet/wallet.js', README],
    testo: `'''Le mosche''' (13 mm) sono [[Le bestie|le bestie]] posate sul muro, sui fogli, su [[Le lettere dell'insegna|l'insegna]] della [[La scena 3D|scena 3D]]: ferme, si girano, due passi, si strofinano le zampe davanti; volano a tratti dritti con virate secche (vicino alla meta rallentano, se no ci girano intorno), a volte una insegue l'altra, e si posano dentro la parte di strada che si vede; scappano dal puntatore, dai fari, dal foglio che si alza; di notte dormono. Ronzano mentre volano, più acute quando scattano ([[Il suono della strada]]).

Nel muro 2D sono tre mosche disegnate (<code>art/mosche/</code>: posata, che si pulisce le zampe, due battiti d'ali) e, quando sono tutte posate e ferme, non chiedono fotogrammi ([[Ferma quando è ferma]]). Aprendo [[il wallet]] qualche mosca esce dalle taschine (otto se sei al verde): sono le stesse immagini.
{{Vedi anche|Le bestie|Le mosche e le formiche del muro|Il wallet}}
[[Categoria:La scena 3D]]`,
  },

  'Le zanzare tigre': {
    data: '2026-10-21',
    fonti: [SCENA + 'bestie.js', README],
    testo: `'''Le zanzare tigre''' (nere a righe bianche, le zampe dietro alzate) sono [[Le bestie|le bestie]] della [[La scena 3D|scena 3D]] che di giorno stanno in basso, ronzano piano, cercano il puntatore e ogni tanto vengono a ronzare davanti alla telecamera; di sera girano attorno alla lampada e a [[l'insegna]]. Quella che la [[La regia|regia]] manda davanti alla telecamera ronza all'orecchio, da un lato all'altro ([[Il suono della strada]]). Una «zanzara tigre (enorme)» è anche la cosa che fa schifo quando si va a [[La caccia|caccia]] con [[Il bot pzk|il bot]].
{{Vedi anche|Le bestie|Le mosche}}
[[Categoria:La scena 3D]]`,
  },

  'Le blatte': {
    data: '2026-10-21',
    fonti: [SCENA + 'bestie.js', README],
    testo: `'''Le blatte''' americane (38 mm) sono [[Le bestie|le bestie]] della [[La scena 3D|scena 3D]] che escono solo di notte: da sotto la saracinesca, girano sul [[Il marciapiede|marciapiede]] a scatti, salgono sulla lamiera, si infilano sotto i fogli; con i fari o il puntatore corrono a nascondersi. Zampettano sulla pietra, solo da vicino ([[Il suono della strada]]). <code>?blatte=1</code> (o la [[La regia|regia]], scheda «strada») le fa uscire anche di giorno.
{{Vedi anche|Le bestie|La strada di notte}}
[[Categoria:La scena 3D]]`,
  },

  'Il marciapiede': {
    data: '2026-10-21',
    fonti: [SCENA + 'marciapiede.js', README],
    testo: `[[File:scena-fondo|thumb|il marciapiede in fondo alla pagina, con le lastre e il chiusino]]
'''Il marciapiede''' della [[La scena 3D|scena 3D]] lo disegna lo shader di <code>marciapiede.js</code> in coordinate del mondo, dal 20 ottobre 2026: niente trame da scaricare, niente piastrella che si ripete, e il dettaglio regge anche da vicino (in fondo alla pagina la telecamera è a mezzo metro da terra).

== Le lastre ==
Granito grigio in lastre 60 × 40 sfalsate: ogni lastra col suo tono (qualcuna rifatta più chiara), un filo d'inclinazione, quanto è affondata; la grana a tre misure, che sfuma nel suo grigio quando è più piccola di un pixel (senza anti-alias tremerebbe); fughe nette, sporco verso le fughe, gomme da masticare schiacciate, chiazze lucide di bagnato. [[Le pozzanghere]] stanno nelle lastre affondate, lungo le fughe vicine, verso il cordolo e ai piedi del rivolo. La pietra non scende mai sotto ruvidezza 0,2: i bordi smussati lucidi facevano scintille, di notte. Le lastre intorno a [[Il chiusino di pzkkonet|il chiusino]] sono tagliate sul telaio, con la loro fuga (<code>CHIUSINO</code>, <code>mLastra</code>). Con la neve si imbianca dove guarda in su ([[Il meteo]]).

Fino al 20.10 le lastre erano una trama disegnata da <code>trame.mjs</code>; dal 20.10 lo shader. Sopra ci sta [[La spazzatura per terra|la spazzatura]], e si tocca (la pietra, la neve, le pozze: [[Le cose che si toccano]]).
{{Vedi anche|Le pozzanghere|Il chiusino di pzkkonet|La spazzatura per terra|Il posto}}
[[Categoria:La scena 3D]]`,
  },

  'Le pozzanghere': {
    data: '2026-10-22',
    fonti: [SCENA + 'marciapiede.js', SCENA + 'tocchi.js', README],
    testo: `'''Le pozzanghere''' sono l'acqua ferma su [[il marciapiede]] della [[La scena 3D|scena 3D]]: stanno nelle lastre affondate, lungo le fughe vicine, verso il cordolo e ai piedi del rivolo de [[l'acqua]]; la pietra intorno è più scura e lucida. L'acqua è lo specchio della strada (Reflector, con lo shader delle pozze), appena sopra le lastre e disegnato solo dov'è acqua, col bordo netto, increspato dal vento, più forte radente (Fresnel). Quanto sono larghe lo dice [[il meteo]]: la pioggia le allarga, con la neve spariscono sotto; la pozza ai piedi del rivolo c'è sempre.

Lo specchio delle pozze (1024 × 512 in «alta», 2048 × 1024 in «ultra», 256 × 128 in «bassa») si rifà solo quando serve ([[Il costo e la qualità]]); sul [[La scena sul telefono|telefono]] non c'è. Dal 22.10 si toccano ([[Le cose che si toccano]]): dove c'è acqua (il campo delle pozze rifatto in JavaScript, <code>acquaQui</code>) tre anelli si allargano dal dito nello specchio (<code>ONDE</code>, quattro tocchi alla volta), con lo schiaffo, il «plop» della bolla e gli schizzi; sul telefono, senza specchi, solo il suono. Ci si riflette [[Le auto che passano|l'auto]] e [[Il lucchettone|il lucchettone]].
{{Vedi anche|Il marciapiede|Il meteo|Le cose che si toccano}}
[[Categoria:La scena 3D]]`,
  },

  'La spazzatura per terra': {
    data: '2026-10-22',
    fonti: [SCENA + 'spazzatura.js', TOOLS + 'disegni.mjs', README],
    testo: `[[File:/art/scena/terra/chiusino.webp|thumb|il disegno del chiusino, in mezzo alla roba per terra]]
'''La spazzatura per terra''' è la roba davanti al negozio nella [[La scena 3D|scena 3D]] (<code>spazzatura.js</code>, dal 20 ottobre 2026): tutta in 3D, con le immagini disegnate da [[gpt-image-2]] (<code>art/scena/terra/</code>, [[I disegni della scena|disegni.mjs]]) adattate ai modelli.

== Cosa c'è ==
La lattina di '''pzk-kola''' schiacciata e piegata (l'etichetta srotolata le gira intorno), la scatola del ramen '''pechino''' rovesciata coi lembi aperti, il manico di ferro e i noodles che escono, il pacchetto di '''luckypzkko''' accartocciato e nove mozziconi, '''tre volantini bagnati''' incollati alle lastre (la '''Hyundai Tucson''' di pzkko motors, '''pzkkonet''' «la fibra che arriva anche dove non c'è», il menu del ristorante pechino), sedici '''gomme da masticare''' appiccicate (vecchie e nere, qualcuna fresca rosa o menta) e, dal 22.10, [[I grissini alla pizza|i grissini alla pizza]]. Le stesse cose sono in vendita ne [[Lo shop|lo shop]] (pzk-kola, ramen Pechino, luckypzkko, la Tucson, le gomme…). Se un'immagine non arriva resta il colore pieno: la scena parte lo stesso.

Tutto sempre negli stessi posti (un numero a caso col seme fisso), diversi per computer e telefono (<code>P</code> in cima a <code>spazzatura()</code>: più una cosa è vicina alla telecamera, più deve stare in mezzo). Le cose piatte (gomme, mozziconi, volantini, [[Il chiusino di pzkkonet|il chiusino]]) sono unite in una geometria per tipo e stanno sul livello 1: la telecamera lo vede, gli specchi no. Dal 22.10 si toccano: la lattina rotola avanti e indietro sulla pancia, il pacchetto, la scatola, i volantini bagnati, i grissini sobbalzano ([[Le cose che si toccano]]). Nel muro 2D c'è [[La roba per terra (2D)|un'altra roba per terra]].
{{Vedi anche|Il chiusino di pzkkonet|Il portachiavi della banca $pzk|Le banconote per terra|Il marciapiede}}
[[Categoria:La scena 3D]]`,
  },

  'I grissini alla pizza': {
    data: '2026-10-22',
    fonti: [SCENA + 'spazzatura.js', TOOLS + 'disegni.mjs', README],
    testo: `'''I grissini alla pizza''' sono per terra nella [[La scena 3D|scena 3D]] dal 22 ottobre 2026 (commit <code>7eae16a</code>): il pacchetto di «grissin pzk · gusto pizza» schiacciato e aperto da un lato, sei grissini che escono a ventaglio, due per terra (uno rotto in tre pezzi) e le briciole. La faccia del pacchetto è <code>terra/grissini</code>, la trama dei grissini <code>terra/grissino</code>, ritagliata da <code>disegni.mjs usa grissino</code> dalla finestra del pacchetto. Toccati, sobbalzano ([[Le cose che si toccano]]). Sono anche lo spuntino da 60 $pzk de [[Lo shop|lo shop]] (punti esperienza +10 % per 10 minuti).
{{Vedi anche|La spazzatura per terra|I disegni della scena}}
[[Categoria:La scena 3D]]`,
  },

  'Le cose che si toccano': {
    data: '2026-10-22',
    fonti: [SCENA + 'tocchi.js', SUONO + 'suono.js', SUONO + 'voci.js', README],
    testo: `'''Le cose che si toccano''' sono gli oggetti della [[La scena 3D|scena 3D]] che rispondono al clic o al dito, dal 22 ottobre 2026 (<code>tocchi.js</code>, commit <code>7eae16a</code>). Il raggio dalla telecamera passa per il puntatore e vince la cosa più vicina; col mouse si suona alla pressione, col dito al tocco (un dito che scorre non suona niente), e sopra le cose il puntatore è la manina.

== Cosa si tocca ==
* [[Il citofono]]: il pulsante si abbassa di 2 mm e il campanello trilla dentro il negozio finché lo si tiene (fino a 4 s); a volte il citofono si apre, fruscia e si richiude.
* [[La porta a vetri]]: il vetro si bussa, i profili d'alluminio suonano vuoti, il maniglione la fa sbattere sulla serratura.
* [[Il lucchettone]] (ottone contro ferro, dondola), [[Il portachiavi della banca $pzk|il portachiavi]] (il tasto e le chiavi che tintinnano), il muro.
* Per terra: la lattina (rotola avanti e indietro sulla pancia e scivola un filo), il pacchetto di sigarette, la scatola del ramen, i volantini bagnati, [[I grissini alla pizza|i grissini]] (sobbalzano), [[Il chiusino di pzkkonet|il chiusino]] (ghisa che dondola nel telaio), [[le pozzanghere]] (tre anelli nello specchio, quattro tocchi alla volta), la pietra, la neve, [[Le banconote per terra|le banconote]] (si raccolgono).
Sopra i fogli e i link comanda la pagina (i volantini, i tagliandi, la saracinesca nuda); l'evento che tocca una cosa porta <code>pzkkoTocco</code>, e <code>suono.js</code> non bussa anche la saracinesca che c'è dietro. <code>window.pzkkoScena.tc.trova(x, y)</code> dice cosa c'è sotto un punto della finestra.

== Il suono ==
Ognuna ha il suo strumento e suona dal suo posto nel mondo (evento <code>tocco</code>): sono [[I corpi percossi|corpi percossi]], i modi di vibrazione di ogni materiale calcolati una volta in un tampone, in tre varianti, così due colpi di fila non sono mai uguali. Nella [[La regia|regia]], scheda «suono», si provano uno per uno.
{{Vedi anche|I corpi percossi|Il suono della strada|La spazzatura per terra}}
[[Categoria:La scena 3D]]`,
  },

  'Il chiusino di pzkkonet': {
    data: '2026-10-22',
    fonti: [SCENA + 'spazzatura.js', SCENA + 'marciapiede.js', TOOLS + 'disegni.mjs', README],
    testo: `{{Infobox
| titolo = Il chiusino di pzkkonet
| immagine = /art/scena/terra/chiusino.webp
| didascalia = il colore del chiusino, disegnato dalla mappa delle altezze
| misura = telaio quadrato di 80 cm, coperchio tondo
| triangoli = ~74 000 sul computer, 51 000 sul telefono
| file = art/scena/terra/chiusino, chiusino-alt, chiusino-normali, chiusino-lucido
| dal = 20 ottobre 2026
}}
'''Il chiusino di pzkkonet''' è il tombino in mezzo all'inquadratura in fondo alla pagina della [[La scena 3D|scena 3D]]: telaio quadrato di '''80 cm''' col coperchio tondo, '''in squadra col marciapiede''' (nessuna rotazione: prende due righe di lastre, coi lati sulle fughe) e in mezzo (sul computer x 1,7 m, z 1,3; sul telefono x 0,5, z 0,9); le lastre intorno sono tagliate sul telaio, con la loro fuga.

== Il rilievo è vero ==
Una griglia di 192 × 192 quadretti (160 sul telefono) alzata dalla mappa delle altezze fino a 6,5 mm sopra le lastre, col bordo che scende a filo; la luce la fanno le normali a tutta risoluzione, la griglia fa la sagoma e la parallasse. Disegno, colore e altezze vengono da [[gpt-image-2]] ([[I disegni della scena|disegni.mjs]]): il modello disegna la mappa come un rilievo illuminato, <code>usa</code> la riporta a tre livelli netti (fondo, piano, rilievi: le soglie dall'istogramma) e ne fa, una volta lì e non nel browser, le normali e il lucido; il colore si disegna '''da quella mappa''' (<code>input_images</code>), così rilievi e colore coincidono al pixel. Sopra: la fascia del bordo, le scritte in tondo «PZKKONET · TELECOMUNICAZIONI · ACCESSO VIETATO», i rombi antiscivolo, le due asole, negli angoli del telaio altri rombi, in mezzo la chiocciola, «pzkkonet» e «D400 · EN 124»; ghisa scura, i rilievi lucidati dalle scarpe, la terra nei fondi, la ruggine nella fessura e nelle asole. Le gomme e i mozziconi non ci finiscono sopra; con la neve resta scoperto, come i chiusini veri, scaldati da sotto. Toccato, dondola nel telaio ([[Le cose che si toccano]]). Accanto c'è [[Il portachiavi della banca $pzk|il portachiavi]], e «tombino» è una cosa di pzk ne [[Lo shop|lo shop]].
{{Vedi anche|La spazzatura per terra|Il marciapiede|Il citofono}}
[[Categoria:La scena 3D]]`,
  },

  'Il portachiavi della banca $pzk': {
    data: '2026-10-22',
    fonti: [SCENA + 'portachiavi.js', SCENA + 'scena.js', README],
    testo: `'''Il portachiavi della banca $pzk''' è il token delle password usa e getta perso per terra nella [[La scena 3D|scena 3D]], dal 21 ottobre 2026 (<code>portachiavi.js</code>, commit <code>2b9e47a</code>): davanti all'angolo de [[Il chiusino di pzkkonet|il chiusino]] verso la telecamera (sul telefono sopra il coperchio).

== Com'è ==
Stondato (un profilo estruso con una smussatura da 3,5 mm), grafite, con l'anello e due chiavi (una Yale d'ottone e una di ferro), «banca $pzk» e la fiche gialla da 500 come logo, «fps» in giallo. Il '''display a led verdi dice i fotogrammi al secondo della scena''' (contati in <code>scena.js</code>, ridisegnati due volte al secondo su una tela 608 × 320: tre cifre a sette segmenti in corsivo, i segmenti spenti che si intravedono, il riflesso del vetro), con un alone verde per terra (un velo che si somma, niente luce vera: una luce in più ricompilerebbe tutti i materiali) e il bagliore della scena di sera. Il '''tasto giallo''' accanto (gomma, con la lampadina stampata) si preme col mouse o col dito: si abbassa di 1,5 mm e torna su con un rimbalzo, e la luce si spegne o si riaccende; sopra il portachiavi il puntatore è la manina (<code>html.scena-tasto</code>). Il raggio del puntatore lo cerca con una scatola nel riferimento del portachiavi (niente <code>Raycaster</code>, che <code>lib/three.js</code> non ha). Com'era la luce resta nel browser (<code>localStorage</code> <code>pzkko-portachiavi</code>); la [[La regia|regia]] la comanda anche lei.

È un po' più grande di quelli veri (9 × 4,6 cm invece di 6,5 × 3) e sta inclinato di 11° verso la strada, appoggiato sulle chiavi: in fondo alla pagina la telecamera è a mezzo metro da terra e un token piatto, da lì, sarebbe una riga; così le cifre (1,5 cm) sono alte una ventina di pixel. Sul livello 1, come la roba per terra. Dal 22.10 tintinna ([[Le cose che si toccano]]). Il «portachiavi» è anche una cosa di pzk ne [[Lo shop|lo shop]].
{{Vedi anche|Il chiusino di pzkkonet|La regia|Il costo e la qualità}}
[[Categoria:La scena 3D]]`,
  },

  'Le banconote per terra': {
    data: '2026-10-22',
    fonti: [SCENA + 'banconote.js', SCENA + 'tocchi.js', 'albertopecchini.it/pzkko/api/wallet.mjs', README],
    testo: `'''Le banconote per terra''' sono i $pzk persi sul marciapiede davanti al negozio nella [[La scena 3D|scena 3D]] (<code>banconote.js</code>, <code>art/banconote/</code>, 22 ottobre 2026): quattro banconote della banca $pzk, da 500, 100, 25 e 10 (la chiocciola in smoking incisa come su una banconota vera, «non ha corso legale · soldi finti»), stropicciate come i volantini bagnati.

Si raccolgono toccandole (<code>tocchi.js</code>, <code>banconota</code>): la banconota si alza verso la telecamera e svanisce, i suoi $pzk entrano nel saldo (il led del tasto li conta, «+500 $pzk» vola via dal tasto) e domani sono di nuovo lì: 635 $pzk al giorno a chi passa a raccoglierli, una volta al giorno ciascuna (il giorno di Mantova), segnate dal server (<code>trova</code> in <code>api/wallet.mjs</code>). Sono soldi che nascono dal nulla: [[L'economia|conio]], come il sussidio e i premi. Le stesse immagini sono [[Le banconote della banca $pzk]] del wallet.
{{Vedi anche|Le banconote della banca $pzk|I $pzk|Le cose che si toccano}}
[[Categoria:La scena 3D]] [[Categoria:I soldi]]`,
  },

  'Il meteo': {
    data: '2026-10-29',
    fonti: [SCENA + 'meteo.js', 'albertopecchini.it/pzkko/api/meteo.mjs', README],
    testo: `{{Infobox
| titolo = Il meteo
| immagine = home-notte
| didascalia = la sera con l'ora e il meteo veri di Mantova
| file = scena/meteo.js, api/meteo.mjs
| dati = Open-Meteo, Mantova, ogni dieci minuti
| stati = sole, nuvoloso, nebbia, pioggia, temporale, neve
| di partenza = vero (dal 29.10); dal 23 al 29.10 sempre sole
}}
'''Il meteo''' della [[La scena 3D|scena 3D]] è quello vero di [[Mantova]]: <code>meteo.js</code> lo chiede a [[Il meteo di Mantova (API)|/api/meteo]] da subito e ogni dieci minuti (la funzione lo prende da [[Open-Meteo]], gratuito e senza chiave, e lo tiene dieci minuti nella cache di Vercel: Open-Meteo riceve una richiesta ogni dieci minuti, non una per visita). Dal 23 al 29.10 di partenza era sempre sole e i dati non si chiedevano nemmeno; dal 29.10 (Alberto: «impostazioni predefinite audio off», l'ora vera, il meteo vero) di partenza è il meteo vero (<code>pzkko-meteo</code> = <code>vero</code>, vedi [[Come parte la home]]).

== Cosa cambia ==
Dal codice WMO: sole, nuvoloso, nebbia, pioggia, temporale, neve; poi le nuvole (%), la pioggia dell'ultima ora e delle ultime 12 (il marciapiede resta bagnato quando ha smesso, e asciuga dopo giorni di sole), la visibilità, la neve per terra, il vento.
* '''Nuvole''': il sole si spegne (niente ombre nette), la luce del cielo cresce e si fa grigia, il cielo si copre (una cupola grigia davanti al cielo, anche nei riflessi: l'ambiente si rifà quando la copertura cambia di 0,1), l'esposizione sale un poco (~75–85 % del sereno).
* '''Nebbia''': la nebbia della scena a pochi metri (il muro, a 2,6 m, si vede velato), di notte grigio città; l'insegna e i lampioni col bagliore più largo.
* '''Pioggia e temporale''': le gocce fra la telecamera e il muro, storte col vento vero (strisce di 18 cm, il mosso di 1/40 di secondo; quelle a un palmo dalla telecamera sfumano), i cerchi ne [[le pozzanghere]], le pozze che si allargano, [[Il muro bagnato|il muro bagnato]] in basso; col temporale i lampi (ogni 4–14 s, due o tre colpi) e il tuono dopo ([[Il suono della strada]], <code>evento('lampo')</code>).
* '''Neve''': i fiocchi che scendono ondeggiando; per terra prima a chiazze nelle fughe, poi tutta (più e meno spessa, qualche chiazza pestata), le pozze sparite sotto; la pietra si imbianca dove guarda in su.
Le gocce e i fiocchi sono una mesh ciascuno (3200 e 2200 sul computer, la metà abbondante sugli altri livelli), mossi tutti dallo shader in una scatola che segue l'inquadratura: niente calcoli a fotogramma. Le strisce sono larghe nel piano del muro: <code>cross(d, vista)</code>, tradotto in HLSL su Windows, le faceva sparire tutte. Tutto passa da uno stato all'altro in un paio di secondi (il bagnato e la neve per terra più piano), tranne all'arrivo: se i dati arrivano nei primi 4 s la scena ci salta subito; <code>tieni</code> tiene il meteo della [[Le foto del caricamento|foto del caricamento]] per 0,3 s dopo lo scoppio. Senza risposta resta il dopo pioggia di sempre.

== Le prove ==
<code>?meteo=sole|nuvoloso|nebbia|pioggia|temporale|neve</code>, oppure la [[La regia|regia]], scheda «meteo»: il tempo, quanto è forte, il bagnato e la neve per terra (auto o fissi), «un lampo», i dati veri di adesso (<code>window.pzkkoScena.meteo</code>, <code>me.lampo()</code>). Il meteo entra anche ne [[La borsa|la borsa]] (sole +2 %, pioggia −2 %, neve −1 %) e nel tomodachi, e con la pioggia, la neve o la nebbia [[Gli uccelli|gli uccelli]] stanno zitti.
{{Vedi anche|Il meteo di Mantova (API)|Open-Meteo|Le luci a insiemi|L'acqua}}
[[Categoria:La scena 3D]]`,
  },

  'Il costo e la qualità': {
    data: '2026-10-21',
    fonti: [SCENA + 'scena.js', SCENA + 'mondo.js', 'albertopecchini.it/pzkko/regia/regia.js', README],
    testo: `'''Il costo e la qualità''' è come [[la scena 3D]] spende i millisecondi di ogni fotogramma e come li regola con i livelli di qualità.

== Quando si rifanno specchi e ombre ==
Due specchi (ognuno un giro di scena, senza multisample: il vetro de [[la porta a vetri]] e [[le pozzanghere]]) e due mappe d'ombra (sole, lampada) che si rifanno '''solo quando serve''': gli specchi quando la telecamera si muove (uno sì e uno no, alternandosi), nel volo e mentre passa [[Le auto che passano|l'auto]], quando qualcosa si muove, e comunque ogni mezzo secondo; le ombre quando qualcosa si muove (un foglio che si alza, un tagliando, l'auto), quando il sole si è spostato di 0,15° (ogni ~40 s) e quando una luce si è appena accesa. Bloom solo quando fa buio. '''Niente anti-alias''' (né MSAA né altro: tolti il 19.10.2026 insieme al filtro «da videogioco» alla Buckshot Roulette): in «alta» e «ultra» gli spigoli li liscia la risoluzione in più.

== I livelli ==
La risoluzione interna è una scala di quella dello schermo (<code>devicePixelRatio</code>), con un tetto in pixel per pixel CSS e uno in milioni di pixel della tela (<code>densita</code> in <code>scena.js</code>), e non scende mai sotto quella dello schermo fino a 1.
{| class="wikitable"
! livello !! risoluzione !! specchi (vetro, pozze) !! ombre (sole, lampada) !! bagliore, palazzi, luci
|-
| bassa || 1× || 256 e 256 × 128 || 1024 || niente bagliore né palazzi, poche luci
|-
| media || 1× || 512 e 384 × 192 || 1024 || bagliore a metà risoluzione, poche luci
|-
| alta || 1,5× (fino a 3, al massimo 8,3 milioni di pixel) || 1024 e 1024 × 512 || 2048 e 1024 || tutte le luci
|-
| ultra || 2× (fino a 4, al massimo 16,6 milioni) || 1536 e 2048 × 1024 || 4096 e 2048 || tutte le luci
|-
| telefono || quella dello schermo (3× su un iPhone, al più 12 milioni) || nessuno || nessuna || niente bagliore né post-processing ([[La scena sul telefono]])
|}
'''Auto''' (quando non si è scelto niente): si parte da «alta», da «media» se la scheda si presenta come integrata (Intel, Apple, Mali, Adreno) o il processore ha 4 core o meno; poi, a foto tutte a bordo e mentre si guarda da lontano (il momento più pesante), se la mediana dei fotogrammi passa i 24 ms si scende di un livello (ultra → alta → media → bassa), fino a tre volte, e la [[La regia|regia]] dice da dove e perché. Dal 21.10 la regia cambia risoluzione, specchi, ombre, bagliore e palazzi al volo (<code>applica</code>), anche uno per uno («su misura»), e la scelta resta nel browser (<code>localStorage</code> <code>pzkko-grafica</code>); le luci no: poche o tutte si decide costruendo. Le mappe d'ombra, per cambiare misura, si buttano e si rifanno (<code>ombre</code>). Fino al 21.10 «alta» era 1,25 al massimo, uguale a «media» su uno schermo normale, e cambiarla ricaricava la pagina: «il selettore non va in alta». <code>?qualita=bassa|media|alta|ultra|telefono</code> e <code>?dpr=</code> comandano sopra tutto. Il tetto in pixel per lato lo dà [[Il tetto della scheda]].

== I numeri ==
Il 21.10 sulla 3060 Ti, a 1903 × 951 senza limite (<code>--libero</code>), di notte scorrendo: «alta» (1,5×) 165–260 fotogrammi al secondo, in fondo sul marciapiede ~214; «media» (1×) ~310; «ultra» (2×) 118–229. La scheda fa tutta la scena in 2–5 ms anche a 2×: il tempo se ne andava nella pagina (le variabili CSS, vedi [[La regia]]). Su una Intel UHD 630 a 1440 × 900: ~120 di giorno, ~90 di notte, il telefono 125–180 (erano 16 di giorno). Il 20.10, di notte, 207–281 con neon, acqua e bestie; con la spazzatura e il meteo ~180 contro ~215 della versione di prima (~0,9 ms in più a fotogramma, ~0,25 di processore); [[le bestie]] costano ~0,1 ms. Un'altra pagina 3D aperta sulla stessa scheda dimezza le misure, e un'auto che passa le abbassa: si ripetono, con <code>--prova</code> e le auto ferme (<code>window.pzkkoPagina.regola.ogni = 99999</code>) e più giri alternati, perché un giro solo balla del 30 % ([[Le prove della scena]]). Il display del [[Il portachiavi della banca $pzk|portachiavi]] dice i fotogrammi al secondo dal vivo.
{{Vedi anche|La scena sul telefono|Il tetto della scheda|Le luci a insiemi|Le prove della scena|La regia}}
[[Categoria:La scena 3D]]`,
  },

  'Il tetto della scheda': {
    data: '2026-10-21',
    fonti: [SCENA + 'scena.js', README],
    testo: `'''Il tetto della scheda''' è il limite di pixel per lato che [[la scena 3D]] non passa mai, dal 21 ottobre 2026: la tela non supera <code>MAX_TEXTURE_SIZE</code> (né <code>MAX_RENDERBUFFER_SIZE</code> e <code>MAX_VIEWPORT_DIMS</code>), e nemmeno gli specchi, le ombre e il bagliore: le tele del post-processing sono trame grandi quanto lei, e una più grande non si disegna (errore GL 1281, la pagina nera).

Con una scheda vera il tetto è 16384 e non si tocca mai; ma '''LibreWolf''', e Firefox con <code>privacy.resistFingerprinting</code>, per non farsi riconoscere dicono 2048 di qualunque scheda, un <code>devicePixelRatio</code> di 2 e 4 core: «alta» chiedeva una tela di 3820 × 2172 ed era nera, come <code>?dpr=2</code> e più. Ora la risoluzione si ferma prima (anche sotto 1 se la finestra è più larga di 2048) e la [[La regia|regia]] lo dice. Quella protezione tiene anche ogni pagina a 60 fotogrammi al secondo (provato il 21.10: LibreWolf 158 sulla 3060 Ti, 60 con la protezione e 165 senza); l'eccezione per un sito (<code>privacy.resistFingerprinting.exemptedDomains</code>) ridà i limiti veri, ma i 60 restano. Senza i nomi delle schede e con 4 core «auto» lì sceglie «media».
{{Vedi anche|Il costo e la qualità|Il contesto perso}}
[[Categoria:La scena 3D]]`,
  },

  'La scena in Blender': {
    data: '2026-10-20',
    fonti: [SCENA + 'scena.js', 'albertopecchini.it/pzkko/scena/lib/gltf.js', README],
    testo: `'''La scena in Blender''': con <code>?glb=1</code> [[la scena 3D]] si scarica così com'è in glTF binario (<code>pzkko.glb</code>, GLTFExporter), da aprire in Blender con File › Import › glTF. L'esportatore è <code>scena/lib/gltf.js</code>, a parte dal pacchetto di [[three.js]] della scena: si scarica solo con <code>?glb=1</code>. Il tasto sta anche nella [[La regia|regia]], scheda «prove» (ricarica la pagina). Il contrario, un modello che entra nel sito, è [[Il modello dello zero|il cercapersone zero]], dall'OBJ di Rhino.
{{Vedi anche|La scena 3D|three.js|La regia}}
[[Categoria:La scena 3D]]`,
  },

  'Le prove della scena': {
    data: '2026-10-22',
    fonti: [TOOLS + 'foto.mjs', 'albertopecchini.it/tools/pzkko/browser.mjs', README],
    testo: `[[File:scena-storia|thumb|una foto di prova: la scena della storia fotografata da foto.mjs]]
'''Le prove della scena''' si fanno con <code>node tools/pzkko/scena/foto.mjs</code> (dalla cartella <code>albertopecchini.it</code>; prima <code>npm ci</code> in <code>tools/catture</code>, che ha puppeteer): fotografa [[la scena 3D]] in Chromium headless, che usa la scheda grafica vera (il Chromium di Playwright se c'è, se no Edge; <code>--chrome=<exe></code> o la variabile <code>CHROME</code> per un altro, da <code>tools/pzkko/browser.mjs</code>), in <code>tools/pzkko/lavoro/scena-*.png</code>, e dice i fotogrammi al secondo e i tempi dei fotogrammi dell'arrivo.

== Le opzioni ==
* <code>--ora=22:00 --scroll=0.5</code>: l'ora e dove sta la pagina; <code>--libero</code> toglie il ritmo dello schermo (senza, i fotogrammi vanno a scatti: 60, 30, 20).
* <code>--larg</code>, <code>--alt</code>, <code>--dpr</code> (telefono: <code>--larg=390 --alt=844 --dpr=3</code>).
* <code>--q=notte=1</code>, <code>--vars=--auto-l:0.9;--auto-x:0.5</code> (ferma un'auto), <code>--hover=.vol.c-giallo</code>, <code>--prova=<js></code>, <code>--pagina=/404.html</code> (da Git Bash con <code>MSYS_NO_PATHCONV=1</code>).
* <code>--subito --attesa=1000</code> (la vista da lontano), <code>--subito --sequenza=8 --passo=500</code> (il volo, una foto ogni mezzo secondo); <code>--sequenza=N --passo=ms</code> anche a scena arrivata (le bestie, le gocce); <code>--ritaglio=x,y,l,a</code> (ritaglia e ingrandisce due volte: [[le bestie]] sono di pochi pixel).
* <code>--q=programmi=1</code>: in console i programmi compilati ai primi fotogrammi ([[Le trappole della compilazione]]).
* <code>--radice=<cartella></code>: un'altra copia di <code>pzkko/</code>, per confrontare con la versione di prima (<code>git archive HEAD pzkko | tar -x -C <cartella></code>).
In <code>--prova</code> c'è <code>s</code> = <code>window.pzkkoScena</code>. Le misure di velocità vogliono le auto ferme e più giri alternati ([[Il costo e la qualità]]). <code>serranda.mjs rifai</code> ([[La serranda]]) fa alla fine una foto di prova della scena (<code>scena-serranda-cima/meta/fondo/telefono.png</code>, e <code>scena-serranda-storia.png</code>). Il suono si registra con [[Le prove del suono|ascolta.mjs]].
{{Vedi anche|Le foto dei volantini|Le foto del caricamento|La serranda|Il costo e la qualità}}
[[Categoria:La scena 3D]] [[Categoria:Gli strumenti]]`,
  },

  'Le foto dei volantini': {
    data: '2026-10-26',
    fonti: [TOOLS + 'cattura.mjs', TOOLS + 'anteprime.mjs', README],
    testo: `'''Le foto dei volantini''' sono le immagini che [[la scena 3D]] stende sui [[I fogli (scena)|fogli]]: [[i volantini]] fotografati dalla pagina 2D (il testo in HTML sopra la carta) in Chromium a 2 px per unità, con un margine per l'adesivo che sporge. Le fa <code>node tools/pzkko/scena/cattura.mjs</code>, '''dopo ogni modifica ai testi dei volantini''' (e dopo <code>genera-404.mjs</code>): <code>art/scena/vol/</code> e <code>vol.json</code> per il computer (~1,3 MB) e <code>art/scena/vol-m/</code> e <code>vol-m.json</code> per il telefono (~0,8 MB, lì il testo è un po' più grande). La 404 ha la sua scena (il suo volantino è fotografato con gli altri), e così [[La storia del muro|la storia]] (i suoi fogli, <code>storia-*</code>, e le scritte <code>.it.foto</code>). Due fogli con lo stesso nome (l'id, o il titolo) fermano <code>cattura.mjs</code>: la scena non saprebbe quale foto usare.

Alla fine di ogni giro <code>cattura.mjs</code> lancia da solo <code>anteprime.mjs</code>, che scrive '''le anteprime''' <code>vol-lo/</code>, <code>vol-m-lo/</code>, <code>terra/lo/</code>, <code>fronte/lo/</code>: le stesse immagini a 128 px, 2–6 KB l'una, che la scena mette subito e che le foto vere rimpiazzano man mano, una trama per fotogramma, durante [[L'arrivo|lo zoom dell'arrivo]]. La foto de [[la petizione]] è vuota (le firme le scrive la scena dal vivo): <code>cattura.mjs</code> nasconde penne e firme e annota dov'è la tabella; [[il wallet]] e [[il cercapersone zero]] non si fotografano (tela viva). <code>cattura.mjs</code> apre la pagina con <code>?muro=1</code> e trova il browser con <code>tools/pzkko/browser.mjs</code>; lo lancia anche [[La serranda|<code>serranda.mjs rifai</code>]].
{{Vedi anche|I fogli (scena)|La serranda|Le foto del caricamento}}
[[Categoria:La scena 3D]] [[Categoria:Le immagini]]`,
  },

  'Le foto del caricamento': {
    data: '2026-10-23',
    fonti: [TOOLS + 'carico.mjs', INDEX, README],
    testo: `'''Le foto del caricamento''' sono le immagini sfocate che compaiono dietro [[Il pomodoro|il pomodoro]] mentre [[la scena 3D]] si prepara: la strada da lontano com'è al primo fotogramma, alta 120 px sul computer e 160 sul telefono, WebP senza perdita (8–20 KB: quello normale, ingrandito 7–8 volte, era tutto a quadretti), in <code>art/scena/carico/</code>.

Le fa <code>tools/pzkko/scena/carico.mjs</code> (la scena fotografata da lontano, poi ridotta e sfocata), per computer (forme da 0,7 a 2,1) e telefono (da 0,42 a 0,8), quattro luci (giorno alle 13, tramonto 25 min prima del tramonto, sera 8 min dopo, notte alle 22:30: la pagina sceglie da <code>--notte</code>; di partenza, a mezzogiorno, il giorno), col sole (dal 23.10: il tempo con cui nasce la scena; prima il dopo pioggia), e scrive i numeri in <code>FOTO</code>, in fondo a <code>index.html</code>; [[La storia del muro|la storia]] ha le sue (<code>storia-*</code>, <code>carico.mjs --pagina=storia</code>), [[la 404]] niente (<code>FOTO = null</code>: il nero). Fuori da quelle forme, col movimento ridotto o <code>?intro=0</code>, niente foto. La foto cade dove cadrà la tela, perché da lontano la telecamera sta in un punto fisso che non dipende dalla forma della finestra.

'''Da rifare quando la strada da lontano cambia''' (la parete, l'insegna, la facciata, le luci): lo fa <code>serranda.mjs rifai</code> ([[La serranda]]).
{{Vedi anche|Il caricamento è il pomodoro|Le foto dei volantini|La serranda}}
[[Categoria:La scena 3D]] [[Categoria:Le immagini]]`,
  },

  'Le trame': {
    data: '2026-10-21',
    fonti: [TOOLS + 'trame.mjs', SCENA + 'materiali.js', README],
    testo: `'''Le trame''' sono le immagini di materiale della [[La scena 3D|scena 3D]] in <code>art/scena/trame/</code>: intonaco e asfalto, colore e normali, 37 KB in tutto. Le disegna una volta <code>tools/pzkko/scena/trame.mjs</code> con le funzioni di <code>materiali.js</code>, che nella pagina costavano due secondi fermi. Le lastre de [[il marciapiede]] dal 20.10 le disegna lo shader, e [[L'intonaco vero|l'intonaco]] dal 21.10 legge la trama in modi nuovi (le crepe sono nel suo alfa): dopo aver toccato <code>intonaco()</code> va rilanciato <code>trame.mjs</code>. Le altre immagini della scena: [[Le foto dei volantini]], [[Gli atlanti]], [[I disegni della scena]] e la lamiera di <code>mappe.mjs</code> ([[Il posto]]).
{{Vedi anche|L'intonaco vero|Il marciapiede|I disegni della scena}}
[[Categoria:La scena 3D]] [[Categoria:Le immagini]]`,
  },

  'I disegni della scena': {
    data: '2026-10-22',
    fonti: [TOOLS + 'disegni.mjs', SCENA + 'disegni.js', README],
    testo: `'''I disegni della scena''' sono le immagini di <code>art/scena/terra/</code> e <code>art/scena/fronte/</code> che fa [[gpt-image-2]] su [[Replicate]], non il codice: <code>tools/pzkko/scena/disegni.mjs</code> (<code>genera <nome…|tutti></code>, <code>recupera <nome> <id></code>, <code>usa <nome…|tutti></code>; i prompt sono lì). Per terra: le etichette di <code>kola</code>, <code>pechino</code> e <code>lucky</code>, i volantini bagnati <code>tucson</code>, <code>pzkkonet</code> e <code>menu</code>, il chiusino (<code>chiusino</code> il colore, <code>chiusino-alt</code> le altezze, <code>chiusino-normali</code>, <code>chiusino-lucido</code>), i grissini. Sul fronte, dal 21.10: <code>citofono</code> col suo <code>-normali</code> e <code>-lucido</code>, <code>lucchetto</code> e <code>lucchetto-fondo</code>, <code>alluminio</code> e <code>zoccolo</code> della porta.

== Il metodo ==
<code>usa</code> ritaglia, riduce e scrive i webp; la mappa de [[Il chiusino di pzkkonet|il chiusino]], che il modello disegna come un rilievo illuminato, torna a tre livelli netti (fondo, piano, rilievi: le soglie dall'istogramma) e ne nascono, una volta lì e non nel browser, le normali e il lucido; il colore si disegna '''da quella mappa''' (<code>input_images</code>), così rilievi e colore coincidono al pixel (lo stesso [[Il citofono|il citofono]], e il fondo de [[Il lucchettone|il lucchettone]] nasce dalla sua faccia). Più nomi insieme: un processo ciascuno, in parallelo (un errore non ferma gli altri). Il token in <code>albertopecchini.it/.env.local</code> (escluso da Git). Se l'attesa si interrompe con «fetch failed» (il 21.10 è capitato a tutti insieme) la predizione su Replicate di solito è finita lo stesso: <code>recupera <nome> <id></code> (l'id dalla dashboard, o da <code>GET /v1/predictions</code>), senza pagarla due volte.

Nella pagina <code>disegni.js</code> le fa arrivare in due giri, anteprima e vera. Dopo un disegno nuovo: <code>disegni.mjs usa</code>, <code>anteprime.mjs</code>, poi <code>carico.mjs</code>.
{{Vedi anche|gpt-image-2|Replicate|Le immagini del muro|Il pomodoro}}
[[Categoria:La scena 3D]] [[Categoria:Le immagini]] [[Categoria:Gli strumenti]]`,
  },

  'Gli atlanti': {
    data: '2026-10-21',
    fonti: [TOOLS + 'atlanti.mjs', README],
    testo: `'''Gli atlanti''' sono i due fogli unici in cui <code>tools/pzkko/scena/atlanti.mjs</code> mette [[I graffiti e gli adesivi della facciata|i graffiti e gli adesivi della facciata]] della [[La scena 3D|scena 3D]]: <code>art/scena/muro/graffiti.webp</code>, <code>adesivi.webp</code> e <code>pezzi.json</code>, con le anteprime a metà in <code>muro/lo/</code> (da lontano un graffito è largo quanto la sua anteprima). Così la facciata costa due chiamate di disegno e non venticinque. <code>atlanti.mjs</code> toglie anche la velatura rosa che la chiave del magenta lasciava sui pezzi senza colore. Si rilancia dopo <code>immagini.mjs usa <foglio></code> sui fogli <code>facciata</code>, <code>adesivi</code> e <code>porta</code>.
{{Vedi anche|I graffiti e gli adesivi della facciata|Le immagini del muro}}
[[Categoria:La scena 3D]] [[Categoria:Gli strumenti]]`,
  },

  'La regia': {
    data: '2026-10-29',
    fonti: ['albertopecchini.it/pzkko/regia/regia.js', 'albertopecchini.it/pzkko/regia/regia.css', INDEX, SCENA + 'scena.js', README],
    testo: `{{Infobox
| titolo = La regia
| immagine = regia
| didascalia = il pannello della regia, un foglio col nastro in alto a destra
| dove = scrivendo «regia», #regia, cinque tocchi in cima allo schermo
| file = regia/regia.js, regia/regia.css
| schede = grafica, ora e sera, meteo, strada, suono, prove
| dal = 20 ottobre 2026
}}
'''La regia''' è il pannello per provare e regolare [[pzkko.it]] senza aspettare la sera o un'auto. Si apre '''scrivendo «regia»''' sulla tastiera, con <code>#regia</code> nell'indirizzo o '''toccando cinque volte in fretta''' la striscia in cima allo schermo (sul telefono). Dal 21.10 al 23.10 c'era anche il tasto giallo in alto a destra (la rotella, <code>art/tasto/</code>): il 23.10 Alberto l'ha tolto («togli tasto regia»), e da allora lo dice [[Lo scontrino delle novità|lo scontrino delle novità]], con «come si accende il 3D» e il tasto «apri la regia adesso». Il codice si scarica solo quando si apre. È un foglio col nastro come [[La finestra dei giochi|le finestre dei giochi]], di lato in alto a destra (sul telefono dal basso, «abbassa» lo riduce alla testata) e senza velo scuro: la scena cambia dietro mentre si regola. A schede, con le frecce per passare dall'una all'altra; l'ultima aperta resta nel browser.

== Le schede ==
* '''grafica''', e in cima (dal 23.10) '''come parte''': le scelte di chi guarda, che restano nel browser: 3D spento / acceso (<code>pzkko-3d</code>, la pagina si ricarica), ora sempre giorno / vera (<code>pzkko-ora</code>) e meteo sempre sole / vero (<code>pzkko-meteo</code>), questi due subito. Di partenza: spento, vera, vero (dal 29.10). Poi la qualità della [[La scena 3D|scena 3D]] (auto, bassa, media, alta, ultra, su misura; [[Il costo e la qualità]]) con la riga che dice com'è adesso; i suoi pezzi uno per uno (risoluzione 1×, 1,5×, 2×; ombre 512–4096; riflessi spenti, bassi, medi, alti, tanti; bagliore spento, a metà, pieno; i palazzi di fronte); i ritocchi (esposizione, forza del bagliore, luce dell'insegna), [[La vetrina|la vetrina]] col mouse, la luce de [[Il portachiavi della banca $pzk|il portachiavi]]. Sul telefono la scena è una sola: restano l'esposizione, la luce dell'insegna e il portachiavi.
* '''ora e sera''': l'ora di Mantova (l'alba e il tramonto segnati in rosso), la velocità (ferma, ×1, ×10, ×60, ×600), alba, mezzogiorno, tramonto, sera, mezzanotte, adesso; il buio (auto = col tramonto, o fisso), l'insegna e i lampioni (auto, spenti, accesi), lo sfarfallio.
* '''meteo''': il tempo (vero = Mantova adesso, sole, nuvole, nebbia, pioggia, tuoni, neve), quanto è forte, il bagnato e la neve per terra, «un lampo», i dati veri di adesso ([[Il meteo]]).
* '''strada''': le auto («passa un'auto», anche di giorno, ogni quanti secondi, i fari alogeni, led o xeno, il neon sotto, un'auto ferma coi fari accesi in un punto); [[le bestie]] (ogni specie sì o no, le blatte anche di giorno, la velocità, «spaventale», una zanzara davanti alla telecamera); le gocce più fitte o più rade, una adesso.
* '''suono''': i suoni della strada ([[Il suono]]): acceso, il volume della strada e quello della musica, e ognuno da provare (dal 22.10 anche [[Le cose che si toccano|le cose che si toccano]], dal 23.10 il fischietto, il boato e l'«uuuh» di [[Virtual]]).
* '''prove''': il muro del DOM in trasparenza (<code>?allinea</code>), rifare [[L'arrivo|l'arrivo]], il glTF ([[La scena in Blender]]), e i numeri della scheda (il suo nome, i programmi, i disegni e i triangoli dell'ultimo passaggio, l'insieme di luci).
Le scelte sono '''caselle stampate''' come quelle del tavolo, con l'evidenziatore giallo su quella scelta, e i valori continui '''cursori''' col binario stampato e la fiche come pomello. In fondo i numeri della scena (fotogrammi al secondo, l'ora, il buio, qualità e risoluzione, l'insieme di luci, il meteo) e «rimetti tutto». Il resto non si salva, tranne l'ora e la velocità che le ricariche della regia si portano nell'indirizzo, se la regia le ha cambiate (con <code>history.replaceState</code> e poi ricarica: assegnato a <code>location.href</code>, se cambiava solo <code>#regia</code> il browser non ricaricava).

== Quello che comanda ==
<code>window.pzkkoPagina</code> (in <code>index.html</code>: l'orologio, dal 20.10 uno solo anche per la scena, <code>window.pzkkoOrologio</code>; la sera forzata; le regole delle auto; le luci, <code>luci</code>; le scelte di «come parte», <code>scelte</code>, <code>scegli</code>, <code>partenza</code> e <code>rimettiOra</code>), <code>window.pzkkoRegia</code> (i ritocchi che la scena legge a ogni fotogramma, <code>REGIA</code> in <code>scena/materiali.js</code>) e <code>window.pzkkoScena</code>.

== Lenta e pesante, fino al 21.10 ==
Sulla 3060 Ti di sera la scena faceva 66–127 fotogrammi al secondo, e con la regia aperta 55: la pagina scriveva le luci della sera come variabili CSS su <code>html</code> '''a ogni fotogramma''', e ogni scrittura costringeva il browser a ricalcolare lo stile di tutta la pagina (~4 ms, il muro sotto ha migliaia di elementi), e a ridipingere la regia, che era un foglio di piste SVG col filtro dell'inchiostro in <code>multiply</code>, rifatte due volte al secondo. Ora la pagina tiene le luci in <code>window.pzkkoPagina.luci</code>, con la scena 3D le variabili non le scrive più, senza le scrive solo quando cambiano. La regia è HTML piatto (caselle, cursori del browser; la carta su un livello suo) e tocca solo quello che è cambiato, solo nella scheda aperta. Stessa sera, a 1,5×: ~165 fotogrammi con e senza regia, 310 a 1×.

'''Aperta prima della scena''' (21.10): se il 3D sta arrivando (<code>html.scena-carico</code>), al posto delle parti della scena c'è «il 3D arriva», che diventa la grafica, il meteo, le bestie e l'acqua appena <code>window.pzkkoScena</code> c'è; «senza 3D» solo se il 3D non c'è davvero (dal 23.10 dice se è spento, o acceso ma non partito). La regia di [[pzkko.it]] non è [[La regia del server|la regia del server]] di casa (8788), che è un'altra cosa.
{{Vedi anche|Come parte la home|La scena 3D|Il suono|Lo scontrino delle novità|La regia del server}}
[[Categoria:La scena 3D]] [[Categoria:Il muro]]`,
  },

  'Il contesto perso': {
    data: '2026-10-21',
    fonti: [SCENA + 'scena.js', README],
    testo: `'''Il contesto perso''' è quello che [[la scena 3D]] fa quando la scheda grafica perde il contesto WebGL (un driver che si pianta, la memoria che finisce, un'altra pagina 3D), dal 21 ottobre 2026: prima la tela restava nera e bisognava ricaricare da zero. Ora la scena si ferma (niente disegni né compilazioni su un contesto perso), e quando il browser lo ridà ricompila tutto in parallelo come all'inizio, rifà il cielo come ambiente (<code>l.rifai()</code>), le ombre e gli specchi, e riparte da dov'era; se non torna entro 8 s ricarica, ma senza [[L'arrivo|l'arrivo]] (<code>sessionStorage</code> <code>pzkko-subito</code>). <code>?perdi=1</code> lo prova: perso dopo 3 s, ridato dopo 1 (ricompilata in 0,1 s, la strada di nuovo intera).
{{Vedi anche|Le trappole della compilazione|Il tetto della scheda}}
[[Categoria:La scena 3D]]`,
  },

  'L\'altra pagina già scaricata': {
    data: '2026-10-21',
    fonti: [SCENA + 'prossima.js', README],
    testo: `'''L'altra pagina già scaricata''' è il lavoro di <code>scena/prossima.js</code> (21 ottobre 2026, commit <code>39e1dd9</code>): arrivata la telecamera, appena il browser è libero, scarica in cache l'altra pagina col 3D ([[La storia del muro|la storia]] dalla home; la home dalla storia e dalla [[La 404|404]]): la pagina e quello che vorrà la sua scena, coi nomi di <code>fogli.js</code> ([[Le foto dei volantini|le foto dei volantini]], anteprime e vere, le immagini di graffiti, manifesti e pezzi, le Live Photo, [[Le foto del caricamento|la foto sfocata del caricamento]] con la luce di adesso); i moduli, la strada e [[Il pomodoro|il pomodoro]] sono gli stessi, già in cache.

Coi <code>prefetch</code> del browser (Chrome li tiene cinque minuti senza ridomandarli), dove non ci sono (Safari) con <code>fetch</code> a priorità bassa; con «risparmia dati» o la rete 2G niente. Provato con un server che risponde come Vercel e la rete a 20 Mbit: la storia aperta dopo la home scarica 29 KB invece di 6,1 MB, e resta solo il tempo del pomodoro e della costruzione della scena; tornando indietro alla home Chrome la ridà dalla cache avanti/indietro, già arrivata, senza ricaricare niente (il WebGL non lo impedisce: niente <code>unload</code>, niente <code>no-store</code>).
{{Vedi anche|Il caricamento è il pomodoro|La storia del muro}}
[[Categoria:La scena 3D]]`,
  },

  'Il suono': {
    data: '2026-10-29',
    fonti: [SUONO + 'suono.js', SUONO + 'voci.js', SUONO + 'interfaccia.js', SUONO + 'musica.js', SUONO + 'cornice.js', README],
    testo: `{{Infobox
| titolo = Il suono
| immagine = /art/wallet-banner/banner.webp
| didascalia = il pannello a led del wallet, uno dei pezzi che suonano
| cartella = pzkko/suono/
| file = suono.js, voci.js, interfaccia.js, musica.js, cornice.js
| come = tutto sintetizzato dal vivo col Web Audio, niente file audio
| di partenza = spento (dal 29.10)
}}
'''Il suono''' di [[pzkko.it]] è tutto sintetizzato dal vivo col Web Audio: niente file audio, in nessuna parte del sito. Sta nella cartella <code>suono/</code> ed è fatto di quattro pezzi:
* [[Il suono della strada]] (<code>suono.js</code> e <code>voci.js</code>, dal 21.10.2026): quello che c'è nella [[La scena 3D|scena]], sentito da dove sta la telecamera, all'ora di Mantova: la città, le auto, [[le campane]], [[gli uccelli]], l'insegna, il meteo, [[I corpi percossi|le cose che si toccano]].
* [[I suoni dell'interfaccia]] (<code>interfaccia.js</code>, dal 26.10): il bip di ogni tasto, [[Le sigle delle app|la sigla di ogni app]] del cercapersone e dei giochi, il fruscio della [[La barra in alto|barra]].
* [[La musica]] (<code>musica.js</code>, dal 26.10): sei brani a 16 bit in stile ocarina, Animal Crossing e Minecraft.
* [[La cornice]] (<code>cornice.js</code>, dal 27.10): la musica non si ferma cambiando pagina.
Lo accende e lo spegne [[Il nastro suono|il nastro «suono»]] in basso a sinistra (<code>pzkko-suono</code> in <code>localStorage</code>; dal 29.10 di partenza spento), lo stesso interruttore delle [[Impostazioni (app)|impostazioni]] del cercapersone. I volumi stanno in <code>window.pzkkoSuono</code>: <code>volume</code> è la strada (0,2, prima 0,7), <code>musica</code> la musica (0,3); i tasti e le sigle hanno il loro, fisso. [[Le prove del suono|<code>ascolta.mjs</code>]] registra tutto fuori dal browser.
{{Citazione|crea i suoni dove non ci sono: ogni app ha la sua musichetta, ogni tasto ha un suonino|Alberto, 26.10.2026}}
{{Vedi anche|Il suono della strada|La musica|I suoni dell'interfaccia|La regia}}
[[Categoria:Il suono]]`,
  },

  'Il suono della strada': {
    data: '2026-10-29',
    fonti: [SUONO + 'suono.js', SUONO + 'voci.js', INDEX, SCENA + 'meteo.js', SCENA + 'acqua.js', SCENA + 'tocchi.js', README],
    testo: `'''Il suono della strada''' è quello che si sente su [[il muro]] di [[pzkko.it]] dal 21 ottobre 2026 (commit <code>2b9e47a</code>): ogni suono è sintetizzato dal vivo col Web Audio (<code>suono/voci.js</code>: oscillatori e rumori filtrati; le cose fatte di mille pezzi, come la pioggia sulla lamiera, i grilli, i tuoni e la carta, calcolate una volta in un tampone; le campane in un <code>OfflineAudioContext</code>), e si sente quello che c'è nella [[La scena 3D|scena]], da dove sta la telecamera, all'ora di [[Mantova]]. Sono 70 KB di codice (23 compressi), che si scaricano solo quando i suoni partono. Dal 23.10 seguono le scelte di «[[Come parte la home|come parte]]»: con sempre giorno è mezzogiorno, fermo (niente campane, che suonano solo se il tempo passa da sé), con sempre sole c'è l'asfalto asciutto (senza 3D il bagnato è 0,15, col meteo vero 0,4); dal 29.10 di partenza l'ora e il meteo sono quelli veri.

== Come parte ==
Dal 29.10 '''di partenza i suoni sono spenti''' (Alberto: «impostazioni predefinite audio off»): [[Il nastro suono|il nastro «suono»]] li accende, e il browser se lo ricorda (<code>pzkko-suono</code>: <code>si</code> acceso, <code>no</code> spento, niente = spento). Chi li ha accesi li sente partire da soli alle visite dopo: al primo tocco o tasto (non lo scorrimento) partono sfumando, in tre secondi. Il contesto audio nasce dentro il gesto (Safari lo vuole lì) e passa a <code>suono.js</code>; sull'iPhone è «ambient»: rispetta il tasto del silenzioso e non ferma la musica. Con la pagina nascosta tutto si ferma; mentre si gioca (i giochi sono finestre modali) la strada si abbassa. <code>window.pzkkoSuono</code>: <code>acceso</code>, <code>volume</code> (la strada, dal 26.10 al 20 %), <code>musica</code> (30 %), <code>accendi(sì, ricorda)</code>, <code>prova(nome)</code> per la regia, <code>evento(nome, dati)</code> per la pagina e la scena (finché il motore non c'è, gli eventi aspettano in coda). Il giro va con un timer a 30 al secondo e non coi fotogrammi, e il motore parte dopo il primo gesto quando la pagina non scorre da 0,3 s ([[Ferma quando è ferma]]).

== Chi ascolta ==
La telecamera della scena, in metri come lei: ogni suono ha il suo posto e si sente più piano, più spento e più dalla sua parte quanto più è lontano; l'eco della strada (la coda e le riflessioni del palazzo di fronte, a 12 m, che rimbalzano fra le due facciate) se ne prende una parte. Quindi [[L'arrivo|l'arrivo]] si sente avvicinarsi, l'insegna ronza di più in cima alla pagina e la goccia in fondo. Senza 3D gli stessi posti, con lo scorrimento della parete.

== Cosa si sente ==
* '''Sempre''': la città lontana (più forte nelle ore di punta, più piano di notte e la domenica; sull'asfalto bagnato sibila), le onde del traffico delle altre strade, il condizionatore lassù, il motorino a due tempi in un'altra via (col Doppler), un clacson, la tapparella di qualcuno al palazzo di fronte (su a strattoni al mattino, giù da sola la sera, col colpo in fondo).
* [[Le campane]], oltre i tetti; [[gli uccelli]], secondo l'ora e la stagione; i grilli e le cicale d'estate.
* '''L'insegna''': il trasformatore che ronza (50 Hz e le armoniche pari) e il gas che sfrigola, con lo sfarfallio della pagina: a ogni salto di luce una scintilla, e l'accensione al tramonto crepita.
* '''[[Le auto che passano|Le auto]]''': la pagina sceglie la prossima auto prima e la annuncia tre secondi prima dei fari (<code>evento('auto')</code> in <code>index.html</code>), così si sente arrivare; passa dietro la telecamera col Doppler (il volume, il lato, l'aria e la frequenza sono curve calcolate per tutto il passaggio), sul bagnato sibila, col neon sotto si sentono la cassa e il basso dei tamarri dai finestrini chiusi e la targa che vibra, ogni tanto i freni stridono. Quella ferma della [[La regia|regia]] tiene il motore al minimo.
* '''[[Il meteo|Il meteo vero]]''': la pioggia (il velo, le gocce sulla lamiera, quelle nelle pozze, il pluviale che si riempie piano e gorgoglia), il tuono dopo ogni lampo (tanto più tardi quanto è lontano, lo schianto solo se è vicino: <code>evento('lampo')</code> in <code>meteo.js</code>), il vento a raffiche col fischio nelle fessure e le doghe che sbattono, la nebbia e la neve che ovattano tutto; dopo la pioggia gocciola la gronda.
* '''Le cose piccole''': la goccia della condensa che tocca la soglia (<code>evento('goccia')</code> in <code>acqua.js</code>); [[le mosche]] e [[le zanzare tigre]] che ronzano mentre volano; [[le blatte]] che zampettano sulla pietra, solo da vicino.
* '''Il negozio''': davanti alla porta (a meno di 7 m), dietro il vetro, [[Il PC con Ubuntu|il PC]]: si spegne e si riaccende, il bip del POST, il floppy, il disco, il Setup, le quattro note di legno della scrivania, la password, il comando battuto, Invio; poi il panico, e da capo.
* '''Le mani''': il foglio che si alza fruscia, [[I tagliandi|il tagliando]] si strappa, [[Il pomodoro|il pomodoro]] fa splat. Dal 22.10: un foglio toccato schiocca contro la lamiera col suo materiale (<code>data-suono</code> in <code>index.html</code>: la carta, la carta lucida dei poster, il cartoncino del dentista, lo scontrino termico che crocchia, l'asse di legno delle zucche, il cartello di lamiera smaltata che ondeggia sul fil di ferro); la saracinesca nuda, rifatta: il tonfo delle nocche, il rombo grave del telo di doghe, le doghe che ballano nelle guide, più secca in basso (la barra chiusa col lucchettone), più rimbombante a metà, più ballerina in alto; [[Le cose che si toccano|le cose della scena]], ognuna col suo strumento e dal suo posto nel mondo ([[I corpi percossi]]); [[La petizione|la petizione]]: il foglio che si stacca e torna, le penne che si urtano, il cappuccio che salta via e torna con un clic, la biro che scrive (lo sfrigolio della sfera mosso dai tratti, il tamburo della carta sulla lamiera; la firma più veloce, a occhielli).
* '''[[Virtual]]''' (dal 23.10): il fischietto, il boato del gol, l'«uuuh» del palo, la fiche posata, la vincita a 8 bit.

== Il banco ==
Tutto passa da un filtro (la nebbia e la neve), da un compressore (i tuoni) e dal volume. I punti usa e getta (un uccello, una goccia) si staccano da soli dopo 30 secondi. Il 21.10, misurato con [[Le prove del suono|ascolta.mjs]]: il fondo della strada sta a −30 dBFS, gli uccelli e le auto vicine a −20/−10 di picco, l'Ave Maria a −22, un tuono vicino a −7. Il nastro, negli strumenti che fotografano la pagina, non c'è (<code>navigator.webdriver</code>); <code>?suono</code> lo fa vedere lo stesso.
{{Vedi anche|Il suono|Le campane|Gli uccelli|I corpi percossi|Le prove del suono|La regia}}
[[Categoria:Il suono]]`,
  },

  'Le campane': {
    data: '2026-10-21',
    fonti: [SUONO + 'voci.js', SUONO + 'suono.js', README],
    testo: `'''Le campane''' suonano oltre i tetti ne [[Il suono della strada|la strada]] di [[pzkko.it]]: le ore dalle 7 alle 22, un colpo alla mezza, a mezzogiorno il concerto di tre campane a slancio e al tramonto l'Ave Maria, nel momento in cui si accende [[l'insegna]]. Suonano solo se il tempo passa da sé: la [[La regia|regia]] che salta di ora non le fa partire, e con «sempre giorno» (mezzogiorno fermo) non suonano mai. Ogni campana ha i suoi parziali (il ronzio, la terza minore, la quinta, la nominale…), e ognuno sono due toni vicinissimi che battono; si calcolano in un <code>OfflineAudioContext</code>. L'Ave Maria sta a −22 dBFS ([[Le prove del suono]]). La «campana stonata» che suona le 13 è una [[Le side quest|side quest]].
{{Vedi anche|Il suono della strada|La sera a Mantova}}
[[Categoria:Il suono]]`,
  },

  'Gli uccelli': {
    data: '2026-10-21',
    fonti: [SUONO + 'voci.js', SUONO + 'suono.js', README],
    testo: `'''Gli uccelli''' de [[Il suono della strada|la strada]] di [[pzkko.it]] cambiano con l'ora e la stagione di [[Mantova]]: i passeri (di più all'alba e al tramonto), la tortora dal collare, i piccioni (che a volte volano via battendo le ali), la cornacchia; i rondoni da fine aprile ad agosto, il merlo all'alba e al tramonto in primavera; di notte la civetta e l'allocco (d'autunno di più). Le sere d'estate i grilli, al ritmo della temperatura vera di Mantova (la legge di Dolbear: 7·T − 30 cri al minuto), e nei pomeriggi caldi d'estate le cicale. Con la pioggia, la neve o la nebbia ([[Il meteo]]) stanno zitti. Gli uccelli vicini stanno a −20/−10 dBFS di picco; i loro punti usa e getta si staccano dopo 30 secondi. Il piccione e la cornacchia sono anche bestie da cacciare ([[La caccia]]).
{{Vedi anche|Il suono della strada|Il meteo}}
[[Categoria:Il suono]]`,
  },

  'I corpi percossi': {
    data: '2026-10-22',
    fonti: [SUONO + 'voci.js', SUONO + 'suono.js', SCENA + 'tocchi.js', README],
    testo: `'''I corpi percossi''' sono il modo in cui [[Il suono della strada|la strada]] suona [[Le cose che si toccano|le cose che si toccano]], dal 22 ottobre 2026: <code>corpo</code> e <code>batti</code> in <code>suono/voci.js</code>. I modi di vibrazione di ogni materiale (il campanello, il vetro, l'alluminio, il maniglione, il lucchettone, il portachiavi, la lattina, la carta bagnata, il pacchetto, il cartone, i grissini, la pozzanghera, la pietra, la neve, il chiusino, il muro) sono calcolati una volta in un tampone, in tre varianti un filo diverse, così due colpi di fila non sono mai uguali; ogni colpo parte dal posto della cosa nel mondo (evento <code>tocco</code>). Nella [[La regia|regia]], scheda «suono», si provano uno per uno: campanello, vetro, maniglione, lattina, pozza, chiusino, cartello, l'asse delle zucche, la carta, la biro.
{{Vedi anche|Le cose che si toccano|Il suono della strada}}
[[Categoria:Il suono]]`,
  },

  'I suoni dell\'interfaccia': {
    data: '2026-10-29',
    fonti: [SUONO + 'interfaccia.js', 'albertopecchini.it/pzkko/barra/barra.js', 'albertopecchini.it/pzkko/telefono/zero/os/suoni.js', README],
    testo: `'''I suoni dell'interfaccia''' sono i suonini dei tasti e le musichette delle app di [[pzkko.it]], dal 26 ottobre 2026 (<code>suono/interfaccia.js</code>; Alberto: «crea i suoni dove non ci sono: ogni app ha la sua musichetta, ogni tasto ha un suonino»), sintetizzati anche loro: chiptune a onde quadre, triangoli e rumore.

== Le sigle ==
<code>musichetta(nome)</code> suona [[Le sigle delle app|la sigla]] di ogni app del cercapersone (aprendola, non tornando indietro), l'accensione dello schermo, lo spegnimento e il ritorno alla home; [[il wallet]] e i cinque giochi grandi hanno la loro, che parte da sola quando la finestra si apre (un <code>MutationObserver</code> sull'<code>open</code> dei dialog: <code>.wallet .rl .bj .mn .dd .mo .vi</code>). Una sigla nuova sfuma quella di prima.

== I tasti ==
Ogni tasto ha il suonino del suo materiale (chi ascolta i clic, in cattura): il bip a 8 bit nel cercapersone (più basso per indietro e chiudi, più alto per le schede), lo scatto meccanico dei tasti gialli del wallet, il clic di plastica del wallet e del cercapersone sul muro, il colpetto sul panno dei giochi, un tic morbido altrove; i cursori ticchettano. I pezzi di carta de [[La barra in alto|la barra]] frusciano, e il loro link parte 120 ms dopo perché il fruscio si senta. [[I volantini]] no (li suona [[Il suono della strada|la strada]]), né quello che ha <code>data-suono-no</code>. Nel [[Il cercapersone zero|cercapersone zero]] il bip di ogni tasto e la sigla dell'app che si apre li fa il sistema (<code>os/suoni.js</code>): un'app non li rifà ([[Le regole per le app]]).

Nella home, nella storia e nella 404 usa il contesto della strada (<code>window.pzkkoSuono.ctx</code>) e tace se [[Il nastro suono|il nastro «suono»]] è spento; nelle pagine senza la strada fa un contesto suo al primo clic e suona solo se nel browser i suoni sono accesi (<code>pzkko-suono = si</code>: dal 29.10 di partenza sono spenti). Lo carica la barra (quindi c'è in ogni pagina) e il cercapersone. È anche lui a decidere quando parte [[la musica]].
{{Vedi anche|Le sigle delle app|La musica|Il suono}}
[[Categoria:Il suono]]`,
  },

  'La musica': {
    data: '2026-10-27',
    fonti: [SUONO + 'musica.js', SUONO + 'interfaccia.js', README],
    testo: `'''La musica''' di [[pzkko.it]] sono sei brani scritti apposta, dal 26 ottobre 2026 (<code>suono/musica.js</code>, commit <code>670b93e</code> «le musichette a 16 bit»): due per stile, che si alternano e si ripetono, sintetizzati nota per nota come il resto de [[Il suono|il suono]], con gli strumenti di una cartuccia del Super Nintendo.
{{Citazione|voglio le musichette… diverse, stile ocarina / animal crossing / minecraft in 16 bit|Alberto, 26.10.2026}}

== Gli strumenti ==
L'ocarina col vibrato che arriva dopo e lo sbuffo dell'attacco, l'arpa, la marimba, il piano elettrico in FM, il contrabbasso pizzicato, il piano, gli archi, i campanelli, il flauto, la batteria a spazzole; la sua eco (il ritardo che torna perdendo gli acuti), un riverbero e il filo d'acuti in meno (passa basso a 11 kHz), poi un limitatore.

== I brani ==
{| class="wikitable"
! brano !! tonalità !! stile !! strumenti
|-
| il Mincio || valzer in re || ocarina || ocarina, arpa e archi; al secondo giro rispondono i campanelli
|-
| la nebbia || la minore || ocarina || ocarina, campanelli che arpeggiano lassù, archi bassi; poi l'arpa
|-
| piazza Sordello || fa maggiore, di mattina, con lo swing || Animal Crossing || marimba, piano elettrico in levare, contrabbasso che cammina, batteria leggera; al secondo giro i campanelli un'ottava sopra
|-
| il bar di sera || mi bemolle || Animal Crossing || flauto, piano elettrico, contrabbasso a due, spazzole; poi la marimba
|-
| i campi || do maggiore, lento || Minecraft || il piano che dice poco, gli archi al secondo giro
|-
| la nevicata || mi minore, la sinistra a crome || Minecraft || come i campi
|}
Ognuno fa due o tre giri (un minuto, un minuto e mezzo), poi 7 secondi di strada sola e il prossimo; il primo è a caso. Le note si scrivono come testo («F#5:3 E5 D5:2 | …», gli accordi con «+», le pause «-», la batteria «x»), gli arpeggi e gli accordi tenuti da un accordo per battuta; un timer le programma 1,5 s avanti.

== Quando suona ==
Chi decide è [[I suoni dell'interfaccia|interfaccia.js]]: suona coi suoni accesi e la pagina in vista, nella home sul contesto della strada ([[Il nastro suono|il nastro «suono»]] la spegne con lei), nelle altre pagine col contesto loro, al primo gesto; le sigle la abbassano un momento; andando via la pagina scrive il brano e il punto (<code>pzkko-musica</code> in <code>sessionStorage</code>) e quella dopo riprende da lì. Grazie a [[La cornice|la cornice]] (27.10) non si interrompe cambiando pagina. Il volume: il 26.10 la musica era al 70 % e la strada al 20 %, poi Alberto: «musica 0.3» (commit <code>77d823e</code>), quindi <code>window.pzkkoSuono.musica</code> = 0,3. <code>ascolta.mjs musica [n…]</code> registra i brani interi, <code>--tracce</code> dice quanto pesa ogni voce da sola (così si è bilanciato il mix: [[Le prove del suono]]).
{{Vedi anche|I suoni dell'interfaccia|La cornice|Il suono della strada|Le prove del suono}}
[[Categoria:Il suono]]`,
  },

  'Le sigle delle app': {
    data: '2026-11-01',
    fonti: [SUONO + 'interfaccia.js', 'albertopecchini.it/pzkko/telefono/zero/os/suoni.js', README],
    testo: `'''Le sigle delle app''' sono le musichette di uno o due secondi che partono quando si apre un'app del [[Il cercapersone zero|cercapersone zero]], [[il wallet]] o uno dei cinque giochi grandi: stanno in <code>MUSICHE</code> di <code>suono/interfaccia.js</code>, chiptune sintetizzato, col nome uguale all'id dell'app. [[Le regole per le app]] (7.2) vogliono che ogni app nuova abbia la sua: senza, si apre muta (le impostazioni si aprivano mute, poi hanno avuto la loro il 29.10). La suona il sistema (<code>os.apri</code> → <code>os/suoni.js</code>), non l'app.

Oltre alle sigle delle app ci sono le sigle dei momenti, che un'app suona con <code>os.suoni.sigla(nome)</code>: «moneta» (una vincita), «negozio» (l'acquisto di una faccia), «pzkstore» (lo scaricamento), la cassa che stampa lo scontrino, il colpo riuscito e la sirena della [[Rapina (app)|rapina]], «lavatrice» e «lavatrice-pronta», «decifratore», «decifratore-giusto», «-aperto», «-bloccato» (1.11). Mai un file audio né un <code>AudioContext</code> dentro un'app. Una sigla nuova sfuma quella di prima e abbassa un momento [[la musica]].
{{Vedi anche|I suoni dell'interfaccia|Le regole per le app|Le app di pzk os}}
[[Categoria:Il suono]] [[Categoria:Le app di pzk os]]`,
  },

  'La cornice': {
    data: '2026-10-27',
    fonti: [SUONO + 'cornice.js', 'albertopecchini.it/vercel.json', 'albertopecchini.it/pzkko/vercel.json', README],
    testo: `'''La cornice''' (<code>suono/cornice.js</code>, 26–27 ottobre 2026; Alberto: «fai che la musica non si interrompa quando cambio pagina») è il trucco per cui [[la musica]] di [[pzkko.it]] va avanti da una pagina all'altra: mentre la musica suona, i link del sito (e [[La barra in alto|la barra]], con <code>vai</code>) non lasciano la pagina: l'altra si apre in un riquadro grande quanto la finestra, sopra di lei, e la musica va avanti fuori.

La pagina di fuori dorme (nascosta, [[la scena 3D]] ferma con l'evento <code>pzkko-altrove</code>, la strada zitta con <code>window.pzkkoSuono.altrove</code>); l'indirizzo e il titolo seguono quella dentro, avanti e indietro funzionano (il primo passo lo mette la cornice, gli altri sono del riquadro), il link verso la pagina di fuori la risveglia, quelli verso altri siti cambiano la finestra intera. Dentro, le pagine non fanno partire una musica loro e le sigle abbassano quella di fuori. Senza musica i link fanno come sempre; ricaricando si carica la pagina vera. [[Il canale sempre aperto]] non si apre nella pagina che dorme sotto la cornice.

Serve <code>X-Frame-Options: SAMEORIGIN</code> in <code>albertopecchini.it/vercel.json</code> (vale per i tre siti: il progetto pzkko ha la radice lì; prima era <code>DENY</code>; commit <code>a2ff3ef</code> «la cornice si può aprire»). I browser che tenevano una pagina in cache con <code>DENY</code>, al 304 senza intestazioni, continuavano a rifiutarla nel riquadro: per questo le pagine hanno un commento del 27.10 in testa. I difetti trovati dalla revisione di musica, cornice e zaino sono nel commit <code>d48798d</code>.
{{Vedi anche|La musica|I suoni dell'interfaccia|Vercel (pzkko)}}
[[Categoria:Il suono]]`,
  },

  'Il nastro suono': {
    data: '2026-10-29',
    fonti: [INDEX, SUONO + 'suono.js', README],
    testo: `'''Il nastro «suono»''' è l'interruttore de [[Il suono|il suono]] di [[pzkko.it]]: carta gommata in basso a sinistra del muro, a pennarello, barrato quando è spento, con le onde che respirano quando suona. Accende e spegne [[Il suono della strada|la strada]], [[la musica]] e [[I suoni dell'interfaccia|i suonini]], e il browser se lo ricorda (<code>pzkko-suono</code> in <code>localStorage</code>: <code>si</code> acceso, <code>no</code> spento, niente = spento). Dal 29.10 di partenza è spento (Alberto: «impostazioni predefinite audio off»); fino ad allora i suoni partivano per tutti, tranne chi li aveva spenti. Lo stesso interruttore sta nelle [[Impostazioni (app)|impostazioni]] del cercapersone zero (quando si accendono si sente un bip di conferma) e nella scheda «suono» de [[la regia]]. Negli strumenti che fotografano la pagina il nastro non c'è (<code>navigator.webdriver</code>); <code>?suono</code> lo fa vedere lo stesso.
{{Vedi anche|Il suono|Come parte la home}}
[[Categoria:Il suono]] [[Categoria:Il muro]]`,
  },

  'three.js': {
    data: '2026-10-29',
    fonti: [TOOLS + 'motore.mjs', 'albertopecchini.it/tools/pzkko/roulette/motore.mjs', 'albertopecchini.it/tools/pzkko/zero/motore.mjs', README],
    testo: `'''three.js''' (r186, licenza MIT) è la libreria con cui [[pzkko.it]] disegna tutto il 3D sulla scheda grafica: [[la scena 3D]] della home, i cinque giochi con qualcosa in 3D ([[La roulette|la ruota]], [[Il blackjack|le carte]], [[Le mine|le tessere]], [[Il dado|la campana]], [[La moneta|la moneta]]) e [[Il cercapersone zero|il cercapersone zero]].

== Tre pacchetti ==
Ogni parte ha il suo bundle, fatto con esbuild da uno strumento che tiene solo i pezzi che servono:
* <code>scena/lib/three.js</code> con gli addon (Sky, Reflector, ExtrudeGeometry dal 20.10…), da <code>tools/pzkko/scena/motore.mjs</code>; 627 KB, 171 compresso; l'esportatore glTF a parte (<code>gltf.js</code>, [[La scena in Blender]]).
* <code>games/roulette/lib/three.js</code>, da <code>tools/pzkko/roulette/motore.mjs</code>, usato da tutti i giochi, con [[Rapier]] accanto.
* <code>telefono/zero/lib/three.js</code> con GLTFLoader, RoomEnvironment e RoundedBoxGeometry, da <code>tools/pzkko/zero/motore.mjs</code>: non si tocca quello della scena.
Le licenze stanno accanto ai file (<code>LICENSE-three.txt</code>, <code>LEGGIMI.txt</code>) e ne [[I crediti di pzkko|i crediti]]. Il bundle della scena non ha <code>Raycaster</code>: [[Il portachiavi della banca $pzk|il portachiavi]] si cerca con una scatola.
{{Vedi anche|Rapier|La scena 3D|I giochi|Il cercapersone zero|Le licenze}}
[[Categoria:La scena 3D]] [[Categoria:I giochi]]`,
  },

  'Rapier': {
    data: '2026-10-22',
    fonti: ['albertopecchini.it/tools/pzkko/roulette/motore.mjs', 'albertopecchini.it/pzkko/games/roulette/ruota.js', 'albertopecchini.it/pzkko/games/dado/campana.js', 'albertopecchini.it/pzkko/games/moneta/lancio.js', README],
    testo: `'''Rapier''' (0.21, licenza Apache 2.0) è il motore fisico vero, in WebAssembly, che muove i corpi dei giochi di [[pzkko.it]]: la pallina de [[la roulette]] (rotola sulla pista, rallenta per l'aria e il rotolamento, scende, sbatte sui rombi e sulle palette), i tre dadi de [[il dado]] (saltano fino a 5 cm nella campana, sbattono sul vetro e fra loro) e [[la moneta]] (sale 20–30 cm, rimbalza di solito quattro volte, rotola, ondeggia). Sta in <code>games/roulette/lib/rapier.mjs</code>, ricopiato da <code>tools/pzkko/roulette/motore.mjs</code>, con la licenza.

Ogni gioco ha scritto [[Le trappole della fisica|le sue trappole]]: Rapier non lascia girare un corpo oltre 120π rad/s (la simulazione della roulette va al rallentatore, <code>TEMPO</code>), non fa rotolare in tondo senza strisciare (la pista non ha attrito), <code>lengthUnit</code> sotto 1 frena e costa dieci volte tanto; nella campana il vetro comincia un centimetro sotto il panno; nella moneta il cilindro arrotondato va meglio di un poliedro a 48 lati. [[Le prove dei giochi]] fanno girare la stessa fisica senza browser, in più thread. [[La scena 3D]] non usa Rapier: le bestie, l'acqua e le penne sono mosse a mano.
{{Vedi anche|three.js|Le trappole della fisica|Le prove dei giochi|I giochi}}
[[Categoria:I giochi]]`,
  },

  'Le prove del suono': {
    data: '2026-10-26',
    fonti: ['albertopecchini.it/tools/pzkko/suono/ascolta.mjs', README],
    testo: `'''Le prove del suono''' si fanno con <code>node tools/pzkko/suono/ascolta.mjs</code>: <code>strumenti [nome…]</code> registra ogni strumento di <code>voci.js</code> da solo in un <code>OfflineAudioContext</code> di Chromium; <code>strada [giorno|notte|temporale|tramonto|zanzara|negozio]</code> registra la home vera col 3D, dal vivo (20–30 s l'una, aperta con <code>?scena=1</code>); <code>musica [n…]</code> registra i brani interi de [[La musica|la musica]] e <code>--tracce</code> dice quanto pesa ogni voce da sola (così si è bilanciato il mix).

Per ognuno scrive in <code>tools/pzkko/lavoro/suono/</code> il WAV, lo spettrogramma (PNG: il tempo in orizzontale, la frequenza in scala logaritmica da 40 Hz a 16 kHz, le righe a 100 Hz, 1 e 10 kHz) e dice i livelli: RMS secondo per secondo e il picco, in dBFS. Il 21.10: il fondo de [[Il suono della strada|la strada]] a −30 dBFS, gli uccelli e le auto vicine a −20/−10 di picco, l'Ave Maria a −22, un tuono vicino a −7. Serve un browser ([[Le prove della scena|browser.mjs]]).
{{Vedi anche|Il suono della strada|La musica|Le prove della scena}}
[[Categoria:Il suono]] [[Categoria:Gli strumenti]]`,
  },
}
