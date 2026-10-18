// Crediti e fonti delle immagini: la pagina /crediti/ (link nel footer) e la
// sezione «Fonti delle immagini» del README dicono le stesse cose. Quando entra
// nel sito un'immagine di provenienza nuova, va aggiunta qui e nel README.
//
// `body` è HTML già pronto (testo scritto qui, non dati dell'utente).

const figma = 'https://www.figma.com/community/file/1172125330560103197/device-mockups-imac-macbook-ipad-iphone'

export const crediti = {
  intro:
    'Da dove vengono le immagini del sito: cosa è disegnato o fotografato da me, cosa è generato con l’intelligenza artificiale e cosa viene da risorse di altri, con la loro licenza.',
  sections: [
    {
      title: 'Illustrazioni generate con l’intelligenza artificiale',
      body: `<p>Sono generate con il modello <strong>gpt-image-2</strong> di OpenAI, usato attraverso <a href="https://replicate.com/openai/gpt-image-2" target="_blank" rel="noopener">Replicate<span class="sr-only"> (nuova scheda)</span></a>, con istruzioni scritte per questo sito, poi scelte e ritagliate per il sito:</p>
      <ul>
        <li><strong>Le copertine e le gallerie dei progetti tecnici</strong> — il progetto stradale, il bar-caffetteria, il layout di cantiere, le tettoie in legno lamellare e il Museo dei Mestieri del Fiume: illustrazioni in assonometria e scene disegnate che hanno come riferimento le tavole originali dei progetti e, per il museo, le mie fotografie. Mostrano i progetti, non sono i progetti: le tavole vere si sfogliano nel visualizzatore, nella scheda di ogni progetto e in <a href="/portfolio/tavole/">tutte le tavole</a>.</li>
        <li><strong>L’illustrazione dell’assistenza informatica</strong>, il piccolo studio in assonometria in <a href="/servizi/informatica/">/servizi/informatica/</a> e fra i servizi.</li>
        <li><strong>Le figurine</strong> dei servizi (assistenza informatica compresa), delle fasi del metodo, dei lavori trasversali, degli strumenti, delle sezioni sul web (home, progetti web e case study dei siti), della pagina contatti e della pagina 404.</li>
        <li><strong>Gli adesivi della home</strong> accanto al terminale, uno per comando — il coltellino con squadra, matita, compasso, righello e freccia del mouse, la casa col tetto sollevato, il portatile, il marchio, il computer aperto — più la cassetta delle lettere sul tasto che copia l’indirizzo email e il lampeggiante di «Online adesso» (2 ottobre 2026). Il terminale, le scritte, il timbro «Falso» e le card dei siti, con le loro catture vere, sono del codice del sito.</li>
        <li><strong>Gli ingredienti delle pagine «Better Call Pekko»</strong> (<a href="/assistenza/">/assistenza/</a> e <a href="/contatti/assistenza/">/contatti/assistenza/</a>), la parodia del sito americano del 2008 di Pekko, «the computer guy»: le fotografie di me in giacca e cravatta sgargianti, ritagliate su fondo trasparente, sono generate dal modello a partire dalla mia fototessera, data come riferimento (il volto è il mio, i completi e le pose sono del modello); così le foto stock finte (il bimbo col mouse, i dischi con il sombrero, il cliente che urla…), gli oggetti, i selfie da webcam dei commenti e i tre sfondi (l’ufficio, la stampante che esplode, la strada di campagna). Gli annunci, le e-card, la testata e le GIF sono invece composti a strati dal codice del sito con quegli ingredienti, come si faceva nel 2008: scritte, stelle, nastri e bottoni non sono del modello. Dal 29 settembre 2026 si aggiungono Pekko web designer (tastiera a tracolla, monitor sollevato, lente, cuffie…), i balli usati per le silhouette, il surf sulla tastiera, le icone lucide del «Web 2.0», altre foto stock finte (la balla di fieno col portatile, la nonna al computer, il campanile col Wi-Fi…) e lo studio web vuoto. I banner della sezione «Pekko makes websites» e i bottoni 88×31 sono disegnati in vettoriale, con caratteri veri, nel canvas di Claude Design e resi in JPEG, PNG e GIF dal browser headless; le catture dei siti mostrate nel finto browser sono quelle vere del portfolio. Il banner e il bottone di pzkko.it (dal 18 ottobre 2026) usano la lamiera, il foglio giallo, il graffito e l’insegna del suo muro, quelli del punto qui sotto. Le aziende pubblicizzate non esistono; i commenti sono inventati e dichiarati tali.</li>
        <li><strong>Le immagini del muro di pzkko.it</strong>, che si vedono nelle catture del suo <a href="/portfolio/pzkko-it/">case study</a> (dal 9 ottobre 2026): la lamiera della saracinesca, i fogli vuoti, i nastri, le illustrazioni dei volantini, i graffiti, i manifesti inventati, le mosche, le fiches e il legno della roulette. L’insegna, il muro del palazzo e il tavolo della roulette sono disegnati in SVG; i testi sui volantini e la ruota in 3D sono del codice del sito. I marchi sui manifesti li ha disegnati il modello, come si trovano su un muro di città: non sono pubblicità né collaborazioni.</li>
        <li><strong>Le due mascotte</strong> — la chiocciola gigante africana, l’animale di casa, e la nutria golosa del Mincio, che il 18 ottobre 2026 ha preso il posto della tartaruga di terra (intera si vede in «Better Call Pekko»). Il disegno è del modello; in testata c’è la testa della chiocciola, con gli occhi che seguono il puntatore, si incrociano sul naso e sbattono le palpebre, aggiunti dal codice del sito sopra l’immagine.</li>
        <li><strong>I burattini</strong> — l’airone elegante, la gazza furbissima, la vespa cattiva ma precisa, dal 30 settembre 2026 la chiocciola e, dal 18 ottobre 2026, la nutria golosa (al posto della tartaruga di terra, che c’è stata dal 1º ottobre). Per airone, gazza e vespa il modello ha disegnato prima l’animale intero, con le mascotte come riferimento di stile, poi lo stesso animale smontato nei pezzi di un burattino di carta uniti da fermacampioni; la chiocciola è stata smontata partendo dalla mascotte; la nutria è nata direttamente come burattino, di profilo, seduta a mangiare, in otto pezzi (corpo, testa, mascella, braccio, ciuffo d’erba, piede, coda, cespo d’erba), con la sola chiocciola come riferimento di stile. Stanno nel piè di pagina, nella tavola «Mascotte e burattini» di <a href="/stile/">/stile/</a>, la gazza anche nella pagina 404 e l’airone accanto alla carta dei contatti. Il montaggio, gli occhi, le molle che muovono zampe, ali, colli e code, e il carattere di ciascuno (i peduncoli che si ritirano, la nutria che mastica e consuma il ciuffo, ne strappa un altro dal cespo, si blocca se ti avvicini, ingoia tutto se la tocchi e scalcia se la si solleva, l’inchino, la chiave nascosta, la mira del pungiglione, la fuga della gazza) sono del codice del sito, come il foglio che la gazza tiene nel becco nella 404.</li>
        <li><strong>L’aragosta di fiume</strong> della home, il gambero rosso del Mincio che dorme sopra «Disponibile per nuovi incarichi» con il suo annaffiatoio azzurro (1º ottobre 2026): il modello l’ha disegnata intera, con la chiocciola come riferimento di stile, poi smontata nei pezzi di carta di un burattino (corpo, coda, due chele, due antenne, annaffiatoio). Il sonno, il risveglio, gli occhi, il getto e l’inchiostro che riempie il mio cognome, un liquido simulato che corre da una lettera all’altra, ondeggia quando scorri la pagina e gocciola sul righello, sono del codice del sito; la stessa scena, in piccolo, è sulla tavola «Mascotte e burattini» di <a href="/stile/">/stile/</a>.</li>
        <li><strong>Le sagome dei tasti</strong> di testata e piè di pagina, sassi e carta strappata: il modello ha disegnato le forme vuote, il sito ci scrive sopra e le rende premibili.</li>
        <li><strong>Le mini immagini del piè di pagina</strong>: busta, telefono, mappa, scatola del codice, cartello «torna su», lucchetto della privacy, quadro dei crediti e, dal 2 ottobre 2026, il biscotto morsicato dei cookie e il ventaglio di campioni colore dello stile.</li>
        <li><strong>Il fondo della carta dell’area operativa</strong> nella pagina contatti: acque, rilievi e campi disegnati dal modello sulla geometria di lago e fiumi ricavata dalle coordinate. Reticolo, raggi, città, nomi e scala grafica sono disegnati dal codice del sito sulle stesse coordinate, e restano esatti.</li>
      </ul>`,
    },
    {
      title: 'Fotografie',
      body: `<ul>
        <li><strong>Il ritratto</strong> in home e nel saluto è una mia fototessera. Il fondo bianco è stato tolto con il modello <strong>remove-background</strong> di Bria, su Replicate; il volto è quello della fotografia, non ritoccato.</li>
        <li><strong>La figura scontornata</strong> della pagina Studio è una mia fotografia, scontornata con l’intelligenza artificiale su Replicate.</li>
        <li><strong>Le fotografie del Museo dei Mestieri del Fiume</strong> sono state scattate durante l’uscita didattica del 15 novembre 2025. Le due fotografie d’epoca riprendono materiale esposto nel museo. Chi compare nelle immagini ha dato l’autorizzazione, e le fotografie in cui si riconoscono insegnanti o guida sono state escluse o ritagliate.</li>
      </ul>`,
    },
    {
      title: 'Tavole e disegni',
      body: `<ul>
        <li><strong>Le tavole dei progetti tecnici</strong>, che il visualizzatore apre dal DWG o dal PDF e da cui partono le illustrazioni, sono miei elaborati originali in AutoCAD LT, fatti per le esercitazioni e per l’Esame di Stato all’I.T.T. «Carlo d’Arco» di Mantova.</li>
        <li><strong>I disegni dei progetti dimostrativi</strong> (quelli segnati con ◇), le piante, i prospetti e i marchi di esempio sono disegnati dal codice del sito.</li>
        <li><strong>Icone, monogramma, firma e immagine di anteprima</strong> sono disegnati per questo sito.</li>
      </ul>`,
    },
    {
      title: 'Siti web e dispositivi',
      body: `<ul>
        <li><strong>Gli screenshot</strong> sono catture dei siti che ho progettato e sviluppato.</li>
        <li><strong>Le icone degli strumenti</strong> in <a href="/studio/">/studio/</a> (con cosa gira questo sito) usano i tracciati di <a href="https://simpleicons.org" target="_blank" rel="noopener">Simple Icons<span class="sr-only"> (nuova scheda)</span></a>, pubblicati in dominio pubblico (CC0); le piastrelle e il movimento sono del codice del sito. I marchi appartengono ai rispettivi titolari e indicano solo gli strumenti che uso.</li>
        <li><strong>MacBook, iPad e iPhone</strong> intorno agli screenshot vengono dal file <a href="${figma}" target="_blank" rel="noopener">Device Mockups (iMac, Macbook, iPad, iPhone)<span class="sr-only"> (nuova scheda)</span></a> della Figma Community, pubblicato con licenza <a href="https://creativecommons.org/licenses/by/4.0/deed.it" target="_blank" rel="noopener">CC BY 4.0<span class="sr-only"> (nuova scheda)</span></a>. Le immagini sono ritagliate e convertite in WebP.</li>
        <li><strong>L’iPhone 18 Pro</strong> del case study di questo sito e della pagina contatti è il disegno vettoriale <a href="https://commons.wikimedia.org/wiki/File:IPhone_18_Pro_Vector.svg" target="_blank" rel="noopener">IPhone 18 Pro Vector.svg<span class="sr-only"> (nuova scheda)</span></a> di Rafael Fernandez, da Wikimedia Commons, con licenza <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.it" target="_blank" rel="noopener">CC BY-SA 4.0<span class="sr-only"> (nuova scheda)</span></a>.</li>
      </ul>`,
    },
    {
      title: 'Caratteri',
      body: '<p>Archivo, Cascadia Code e Instrument Serif, tutti con licenza <a href="https://openfontlicense.org" target="_blank" rel="noopener">SIL Open Font License<span class="sr-only"> (nuova scheda)</span></a>, serviti da questo dominio tramite i pacchetti Fontsource.</p>',
    },
  ],
}
