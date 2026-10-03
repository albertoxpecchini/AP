// ─────────────────────────────────────────────────────────────────────────────
//  FIGURINE — piccole illustrazioni scontornate che accompagnano servizi, fasi
//  del metodo, lavori trasversali, strumenti, contatti e 404.
//
//  Un foglio = una sola immagine di openai/gpt-image-2 con nove figurine in una
//  griglia 3 × 3 su fondo trasparente; figurine.mjs le ritaglia una per una.
//  L'ordine di `figurine` è quello della griglia, riga per riga.
//
//  I nomi seguono le regole di src/templates/components/ui.js → figName():
//    servizi   <area>-<titolo del servizio>   tecnico-rilievi, digitale-ui-ux
//    metodo    metodo-<key della fase>        metodo-ascolto
//    lavori    lavori-<codice>                lavori-a-c
//    strumenti strumenti-<gruppo>             strumenti-rilievo-e-disegno
//
//  I prompt sono in inglese perché il modello li segue meglio.
// ─────────────────────────────────────────────────────────────────────────────

export const STILE = `A sheet of nine separate small spot illustrations ("figurine"), arranged in a precise 3 × 3 grid on a fully transparent background, for the portfolio of a young Italian surveyor (geometra) who is also a web designer and a graphic designer.
Each figurina is one small object or tiny still life, centred in its own cell, drawn at the same scale as the others and filling about 70% of its cell. Leave wide empty space between cells: nothing touches, nothing overlaps, nothing crosses into another cell. Do not draw the grid.
Identical style for all nine: isometric view (30 degrees), precise fine near-black ink outlines (#10110f) over flat matte colour fills, a subtle hand-drafted feel, like the drawings of a high-end architecture competition. Palette: paper white (#f3f1ec), warm greys (#eae7e0, #dedad1, #5a5b55), light wood, muted sage and olive green, pale blue, and ONE red-lead vermilion accent (#e5481f) on a single detail of each object.
Every figurina has a clean off-white die-cut border (#f3f1ec), about 10 px wide, all around its outer silhouette, like a sticker, so that it also reads on a very dark background.
No cast shadows on the ground, no background, no frames, no text, no letters, no numbers, no logos, no watermark. Screens and papers show only abstract lines and shapes, never readable characters.`

export const fogli = {
  tecnico: {
    titolo: 'Servizi tecnici e un lavoro trasversale',
    figurine: [
      { nome: 'tecnico-progettazione', soggetto: 'a drafting board on a stand, with a pinned floor plan of a small house, a parallel ruler and a vermilion set square' },
      { nome: 'tecnico-rilievi', soggetto: 'a surveying total station on a wooden tripod, next to a prism pole striped vermilion and white' },
      { nome: 'tecnico-cad', soggetto: 'a computer monitor showing a dark CAD workspace with a thin-line floor plan, one line of the plan vermilion, and a mouse beside it' },
      { nome: 'tecnico-catasto', soggetto: 'a cadastral map sheet with irregular land parcels, one parcel filled in vermilion, and a round rubber stamp resting on the corner of the sheet' },
      { nome: 'tecnico-pratiche-edilizie', soggetto: 'a thick ring binder of building permit documents with coloured index tabs, a folded plan sticking out and a vermilion approval stamp on the cover' },
      { nome: 'tecnico-modellazione-3d', soggetto: 'a small timber-frame house structure — posts, beams and roof rafters in light wood, like a 3D model — with one vermilion beam' },
      { nome: 'tecnico-bim', soggetto: 'an exploded axonometric of a small house: foundation slab, walls, floor slab and pitched roof floating apart vertically in separate layers, the floor slab vermilion' },
      { nome: 'tecnico-rendering', soggetto: 'a small modern house as a smooth white clay model with a flat roof and large windows, a tiny sun above it, one vermilion window frame' },
      { nome: 'lavori-a-c', soggetto: 'a small house seen from the corner, with a big key on a vermilion key tag in front of it and a rolled floor plan leaning against the wall' },
    ],
  },

  digitale: {
    titolo: 'Servizi digitali e due lavori trasversali',
    figurine: [
      { nome: 'digitale-siti-web', soggetto: 'a browser window with a clean website layout: header bar, a large image block, three columns of text lines, and a vermilion button' },
      { nome: 'digitale-landing-page', soggetto: 'a single tall web page with a big headline block and one large vermilion button, with a mouse cursor arrow clicking the button' },
      { nome: 'digitale-ui-ux', soggetto: 'three wireframe screens pinned on a board, connected by arrows like a user flow, with sticky notes; one sticky note vermilion' },
      { nome: 'digitale-sviluppo-frontend', soggetto: 'a code editor window with coloured horizontal bars as lines of code, a large pair of chevron brackets floating in front of it, one bar vermilion' },
      { nome: 'digitale-responsive', soggetto: 'a laptop, a tablet and a smartphone side by side, each showing the same simple layout rearranged for its screen, with a vermilion block on each' },
      { nome: 'digitale-manutenzione', soggetto: 'a browser window with a wrench and a gear leaning on it, the gear vermilion' },
      { nome: 'digitale-ottimizzazione', soggetto: 'a round performance gauge dial with its vermilion needle pointing to the maximum, and a small lightning bolt beside it' },
      { nome: 'lavori-b-c', soggetto: 'a business card with a simple geometric logo mark standing in front of a browser window that shows the same mark in its header, the mark vermilion' },
      { nome: 'lavori-a-b', soggetto: 'a tablet showing a small 3D house model on its screen, with a floating floor plan sheet beside it and a vermilion progress bar under the model' },
    ],
  },

  grafica: {
    titolo: 'Servizi grafici e gli strumenti dello studio',
    figurine: [
      { nome: 'grafica-logo', soggetto: 'a geometric monogram mark being constructed on paper: thin construction circles and guide lines, a drawing compass tracing an arc, the mark vermilion' },
      { nome: 'grafica-branding', soggetto: 'an open brand manual booklet showing colour swatches and a block of type-specimen lines, one swatch vermilion' },
      { nome: 'grafica-brochure', soggetto: 'a tri-fold brochure standing half open, with photo blocks and text lines on its panels and a vermilion band' },
      { nome: 'grafica-social', soggetto: 'a smartphone showing a 3 × 3 grid of square posts with simple shapes, one tile vermilion, and a small heart shape floating beside it' },
      { nome: 'grafica-locandine', soggetto: 'a large poster on a wooden easel with bold geometric shapes and a big vermilion circle, and a rolled poster leaning against the easel' },
      { nome: 'grafica-materiale-aziendale', soggetto: 'a small stack of business cards, a letterhead sheet and an envelope, all with the same small mark, the mark vermilion' },
      { nome: 'strumenti-rilievo-e-disegno', soggetto: 'a triangular scale ruler, a mechanical pencil, a drawing compass and a folded site plan, the pencil vermilion' },
      { nome: 'strumenti-web', soggetto: 'an open laptop with abstract code lines on screen and a coffee mug beside it, the mug vermilion' },
      { nome: 'strumenti-grafica', soggetto: 'a camera, a graphics tablet with its stylus and an open colour swatch fan deck, one swatch vermilion' },
    ],
  },

  metodo: {
    titolo: 'Le sette fasi del metodo, i contatti e la pagina 404',
    figurine: [
      { nome: 'metodo-ascolto', soggetto: 'two chairs facing each other at a small round table with two coffee cups and an open notebook, one cup vermilion' },
      { nome: 'metodo-analisi', soggetto: 'a clipboard with a hand-drawn site sketch and dimension lines, a tape measure and a magnifying glass, the tape measure vermilion' },
      { nome: 'metodo-progettazione', soggetto: 'three alternative sketch sheets pinned side by side, the middle one marked with a vermilion tick' },
      { nome: 'metodo-sviluppo', soggetto: 'a laptop showing a detailed technical drawing, next to a neat stack of finished drawing sheets held by a vermilion paper clip' },
      { nome: 'metodo-revisione', soggetto: 'a checklist sheet with ticked boxes and a vermilion pen lying across it' },
      { nome: 'metodo-consegna', soggetto: 'an open cardboard box with rolled drawings, a USB stick and a set of keys, tied with a vermilion ribbon' },
      { nome: 'metodo-assistenza', soggetto: 'a smartphone next to a small open vermilion toolbox with a wrench and a screwdriver' },
      { nome: 'contatti', soggetto: 'a paper plane folded from a letter, flying up from an open envelope, with a vermilion stripe on the plane' },
      { nome: '404', soggetto: 'a lonely surveying tripod standing next to an unfolded map with a big dashed search circle and a vermilion location pin' },
    ],
  },

  computer: {
    titolo: 'Il computer: la sezione Web della home, i siti, la pagina Web e i case study web',
    figurine: [
      { nome: 'computer-postazione', soggetto: 'a tidy desk workstation: a large monitor showing a clean website layout, a slim keyboard, a mouse, a small potted plant and a vermilion desk lamp' },
      { nome: 'computer-mobile', soggetto: 'a smartphone standing upright in front of a laptop, its screen showing a page recomposed for mobile, with a dashed thumb-reach arc over the lower half and a large vermilion button inside the arc' },
      { nome: 'computer-tastiera', soggetto: 'a computer keyboard with one wide key raised and vermilion, marked only with an arrow-to-bar symbol, and above it a small floating screen where a button is outlined by a dashed focus ring' },
      { nome: 'computer-dominio', soggetto: 'a small hosting server tower with blinking status lights, a vermilion key inserted in its lock with a blank tag, and a small globe beside it' },
      { nome: 'computer-siti', soggetto: 'a staggered stack of three browser windows showing different websites, each with a small green dot in its top bar, the front window with a vermilion header' },
      { nome: 'computer-codice', soggetto: 'an open laptop with coloured lines of code on screen, a small terminal window floating beside it with a vermilion block cursor, and a pair of curly-brace shapes' },
      { nome: 'computer-lighthouse', soggetto: 'an open laptop next to a small striped lighthouse whose light beam becomes a round score gauge, the gauge arc vermilion and almost full' },
      { nome: 'computer-stack', soggetto: 'an open laptop with three thin coloured slabs floating above the screen in a layered stack, like layers of a web page (structure, style, behaviour), the top slab vermilion' },
      { nome: 'computer-lancio', soggetto: 'an open laptop with a small vermilion rocket launching out of the screen, leaving a dashed curved trail and a few puffs of smoke' },
    ],
  },

  // ── Informatica ─────────────────────────────────────────────────────────────
  // L'area D dei servizi (assistenza informatica): diciassette servizi e il
  // lavoro trasversale B + D, in due fogli. Niente marchi (il modello disegna
  // volentieri i loghi di Windows e Office): sistemi e programmi si riconoscono
  // da quello che fanno, una barra di avanzamento, una pagina, un foglio a griglia.
  informatica: {
    titolo: 'Assistenza informatica, prima parte: virus, file, periferiche, Windows e Office',
    figurine: [
      { nome: 'informatica-pulizia-da-virus', soggetto: 'an open laptop with a small stylised beetle-shaped computer bug being lifted off its screen with a pair of tweezers, and a shield outline beside it, the bug vermilion' },
      { nome: 'informatica-file-doppioni', soggetto: 'two identical small photo prints and two identical document sheets side by side, with a magnifying glass over them and a vermilion paper clip on one of the copies' },
      { nome: 'informatica-riordino-cartelle', soggetto: 'a neat row of manila file folders standing upright in a wooden desk organiser, each with a coloured tab, one tab vermilion, and one sheet being slid into its folder' },
      { nome: 'informatica-stampanti-e-scanner', soggetto: 'a compact home printer-scanner with its scanner lid slightly open and a printed sheet coming out of the front, the sheet with a vermilion stripe' },
      { nome: 'informatica-audio-e-periferiche', soggetto: 'a pair of small desktop speakers, over-ear headphones and a small clip-on webcam, the headphone ear cushions vermilion' },
      { nome: 'informatica-driver', soggetto: 'a computer graphics card seen in isometric view, with its cooling fan and gold contacts, and a small floating gear joined to it by a dotted line, the gear vermilion' },
      { nome: 'informatica-windows', soggetto: 'an open laptop whose screen shows only an abstract installation screen with a long progress bar almost full, and a USB flash drive plugged into its side, the progress bar vermilion' },
      { nome: 'informatica-microsoft-office', soggetto: 'three sheets fanned out like cards — a text document with lines, a spreadsheet with a grid and a small bar chart, a presentation slide with a simple shape — next to a closed envelope, one bar of the chart vermilion' },
      { nome: 'informatica-ripristino-del-sistema', soggetto: 'a desktop computer tower with a large circular undo arrow wrapped around it, the arrow vermilion' },
    ],
  },

  // Il 29.09.2026 il modello ha disegnato comunque una mela sul coperchio del
  // portatile nuovo: tolta a mano dal foglio (riquadro 1574,928 → 1614,978
  // interpolato riga per riga) e ritagliato il file «…-senza-marchio.png».
  // Se si rigenera, controllare di nuovo i coperchi.
  informatica2: {
    titolo: 'Assistenza informatica, seconda parte: sistemi, documenti, dati, rete, hardware e il lavoro B + D',
    figurine: [
      { nome: 'informatica-cambio-di-sistema-operativo', soggetto: 'an open laptop with two small floating screen windows above it, an old one with square blocky shapes and a new one with rounded shapes, joined by a curved vermilion arrow' },
      { nome: 'informatica-impaginazione-documenti', soggetto: 'an open bound report lying flat, showing a neat two-page spread with heading bars, text lines, a small picture block and page numbers as tiny dots, with a vermilion bookmark ribbon' },
      { nome: 'informatica-conversione-di-formati', soggetto: 'two document sheets with different shapes (one with a folded corner, one with a rounded tab) connected by two curved arrows forming a circle, one arrow vermilion' },
      { nome: 'informatica-backup-e-recupero-dati', soggetto: 'a portable external hard drive connected by a cable to an open laptop, with a small cloud shape floating above and an upward arrow, the hard drive vermilion' },
      { nome: 'informatica-rete-e-wi-fi', soggetto: 'a home wireless router with two antennas and small status lights, three curved signal arcs rising above it, and a small plug-in range extender beside it, the signal arcs vermilion' },
      { nome: 'informatica-computer-nuovo', soggetto: 'a new laptop half out of its open cardboard box tied with a vermilion ribbon, and a smaller old laptop beside it joined by a dashed transfer arrow' },
      { nome: 'informatica-aggiornamento-hardware', soggetto: 'an open desktop computer case seen from the side, with a memory stick and a small solid-state drive being inserted and a screwdriver beside it, the solid-state drive vermilion' },
      { nome: 'informatica-posta-e-account', soggetto: 'a smartphone showing a row of six blank code boxes on its screen, an envelope and a small padlock with its key, the key vermilion' },
      { nome: 'lavori-b-d', soggetto: 'a small office desk seen from the corner with an open laptop showing a simple website layout, a smartphone, a compact printer and a wireless router, all joined by thin dashed lines, the website header vermilion' },
    ],
  },

  // ── Testata e piè di pagina ─────────────────────────────────────────────────
  // Le mini immagini dei recapiti e delle voci del footer: stesse regole delle
  // altre figurine (bordo adesivo compreso), così stanno bene sul fondo scuro.
  chrome: {
    titolo: 'Le mini immagini del piè di pagina: recapiti, sede, orari, social, torna su, note legali',
    figurine: [
      { nome: 'chrome-email', soggetto: 'an open envelope with a folded letter sticking out, a small vermilion wax seal on the flap' },
      { nome: 'chrome-telefono', soggetto: 'a smartphone standing upright with a vermilion phone-handset symbol on its screen and three small curved ring lines beside it' },
      { nome: 'chrome-sede', soggetto: 'a small folded paper map with a river and fields, and a tall vermilion location pin standing on it' },
      { nome: 'chrome-orari', soggetto: 'a desk calendar page with a grid of blank days, one day circled in vermilion, and a small round alarm clock leaning on it' },
      { nome: 'chrome-instagram', soggetto: 'a compact retro camera seen from the front, its round lens with a vermilion ring' },
      { nome: 'chrome-github', soggetto: 'a small cardboard box of code: an open box with a floating pair of curly braces and a vermilion git-branch symbol (three dots joined by lines)' },
      { nome: 'chrome-su', soggetto: 'a wooden signpost with a single arrow-shaped sign pointing straight up, the arrow sign vermilion' },
      { nome: 'chrome-privacy', soggetto: 'a document sheet with text lines and a closed padlock resting on it, the padlock body vermilion' },
      { nome: 'chrome-crediti', soggetto: 'a small framed picture of a house on an easel with a paper tag hanging from the corner, the tag vermilion' },
    ],
  },
}

// ── Tasti ───────────────────────────────────────────────────────────────────
// Le sagome irregolari dei tasti di testata e piè di pagina: sassi di fiume,
// carta strappata. Sono piene e vuote dentro: il testo lo mette il sito, il
// codice le rende premibili e in rilievo (`pebble()` in ui.js). Stile proprio,
// senza il bordo adesivo, e ritagli grandi (`max`) perché i tasti del piè di
// pagina sono larghi.

export const STILE_TASTI = `A sheet of nine separate flat button shapes, arranged in a precise 3 × 3 grid on a fully transparent background, for the navigation bar of a designer's website.
Each shape is one flat, irregular, organic silhouette — like a smooth river pebble seen from above, or a piece of hand-torn paper with softly rounded, slightly uneven edges — centred in its own cell and filling about 85% of the cell width. Leave clear empty space between cells: nothing touches, nothing overlaps. Do not draw the grid.
Style, identical for all nine: a flat matte fill in the colour named for each shape, with a crisp, uniform ink outline (#10110f) about 8 px wide on the light and vermilion shapes, and a crisp off-white outline (#f3f1ec) about 8 px wide on the dark shapes. A barely visible paper grain inside the fill, a faint hand-drawn feel, like the identity of a high-end architecture studio.
Completely empty inside: no text, no letters, no numbers, no icons, no symbols, no shadows, no gradients, no highlights, no bevel, no 3D, no background, no frames, no watermark.`

fogli.tasti = {
  titolo: 'Le nove sagome dei tasti: carta, minio, inchiostro',
  stile: STILE_TASTI,
  intro: 'The nine shapes, row by row, left to right:',
  max: 960,
  figurine: [
    { nome: 'tasto-carta-1', soggetto: 'a wide (about 3:1) smooth pebble shape, paper-white fill (#f3f1ec), ink outline' },
    { nome: 'tasto-carta-2', soggetto: 'a wide (about 3:1) torn-paper shape with slightly wavy edges, paper-white fill (#f3f1ec), ink outline' },
    { nome: 'tasto-carta-3', soggetto: 'a wide (about 3:1) pebble shape with one gently bulging side, paper-white fill (#f3f1ec), ink outline' },
    { nome: 'tasto-carta-4', soggetto: 'a wide (about 3:1) pebble shape, a little tilted, paper-white fill (#f3f1ec), ink outline' },
    { nome: 'tasto-carta-tondo', soggetto: 'an almost round, slightly irregular pebble shape (about 1:1), paper-white fill (#f3f1ec), ink outline' },
    { nome: 'tasto-minio-1', soggetto: 'a very wide (about 4:1) smooth pebble shape, vermilion fill (#e5481f), ink outline' },
    { nome: 'tasto-minio-2', soggetto: 'a very wide (about 4:1) torn-paper shape with slightly wavy edges, vermilion fill (#e5481f), ink outline' },
    { nome: 'tasto-inchiostro-1', soggetto: 'a wide (about 3:1) smooth pebble shape, near-black ink fill (#10110f), off-white outline' },
    { nome: 'tasto-inchiostro-tondo', soggetto: 'an almost round, slightly irregular pebble shape (about 1:1), near-black ink fill (#10110f), off-white outline' },
  ],
}

// ── Hero della home ─────────────────────────────────────────────────────────
// Gli adesivi grandi accanto al terminale dell'hero: uno per ogni comando
// (tutto, casa, sito, marchio, pc) più qualche comprimario. Stile proprio:
// stessa palette e stessa assonometria delle altre figurine, ma tratto grosso,
// forme tozze e molto minio, perché si vedono in grande e devono saltare fuori
// dal fondo scuro del terminale. Ritagli più grandi (`max`). Le voci con
// `scarta` sono nel foglio ma non nel sito: il ritaglio le salta.

export const STILE_HERO = `A sheet of nine separate bold sticker illustrations, arranged in a precise 3 × 3 grid on a fully transparent background, for the home page of a young Italian surveyor who is also a web designer and a graphic designer.
Each sticker is ONE chunky object or tiny still life, centred in its own cell, drawn at the same scale as the others and filling about 72% of its cell. Leave wide empty space between cells: nothing touches, nothing overlaps, nothing crosses into another cell. Do not draw the grid.
Identical style for all nine: isometric three-quarter view from above, chunky toy-like proportions with slightly rounded corners, bold uniform near-black ink outlines (#10110f, about 6 px), flat matte colour fills with exactly one darker flat tone on the sides in shadow (cel shading), crisp and graphic like a die-cut vinyl sticker of a design studio. Palette: paper white (#f3f1ec), warm greys (#dedad1, #5a5b55), near-black (#10110f), light wood, and a strong red-lead vermilion (#e5481f) as the dominant colour of every object, with a few small leaf-green details (#2f9e5b).
Every sticker has a thick clean off-white die-cut border (#f3f1ec), about 14 px wide, all around its outer silhouette.
No cast shadows on the ground, no background, no frames, no text, no letters, no numbers, no brand logos, no emblems, no watermark. Screens and papers show only abstract lines and shapes, never readable characters.`

fogli.hero = {
  titolo: 'Gli adesivi dell’hero della home: un attrezzo per tutto, la casa, il sito, il marchio, il computer',
  stile: STILE_HERO,
  intro: 'The nine stickers, row by row, left to right:',
  max: 640,
  figurine: [
    { nome: 'hero-tutto', soggetto: 'a chunky pocket multi-tool (like a pocket knife, fanned open) with a plain vermilion handle with no emblem and no cross on it; instead of blades, its fold-out tools are: a small steel set square, a short wooden pencil, a drawing compass, a flat steel ruler with tick marks, and a white mouse-cursor arrow on a steel arm' },
    { nome: 'hero-casa', soggetto: 'a chunky little house like an architectural model, white walls and a vermilion pitched roof lifted a little above the walls so the rooms inside show as a floor plan, with a leaf-green retractable tape measure pulled out along the base of the front wall' },
    { nome: 'hero-sito', soggetto: 'a chunky open laptop whose screen shows a simple website layout (a header bar, an image block, text lines and one big vermilion button), with a large white mouse-cursor arrow clicking the button and a small browser window with a leaf-green dot floating above the screen' },
    { nome: 'hero-marchio', soggetto: 'a chunky abstract geometric logo mark as a solid 3D object, a vermilion circle interlocked with a vermilion triangle (not a letter), standing on a fanned stack of colour swatch cards, with a drawing compass leaning on it' },
    { nome: 'hero-pc', soggetto: 'a chunky desktop computer tower with its side panel open showing tidy components, a vermilion screwdriver and a small wrench leaning on it, and a small leaf-green check mark badge on the corner of its monitor' },
    { nome: 'hero-cassetta', scarta: true, soggetto: 'a chunky open vermilion toolbox with a handle, neatly holding a set square, a pencil, a drawing compass, a colour swatch fan, a screwdriver and a white mouse-cursor arrow sticking out of it' },
    { nome: 'hero-preventivo', scarta: true, soggetto: 'a clipboard holding a quote sheet with four lines of abstract text, each line ending in a leaf-green tick, with a vermilion pen lying across the corner' },
    { nome: 'hero-email', soggetto: 'a vermilion mailbox on a short wooden post with its flag up and a white envelope sticking out of its open door' },
    { nome: 'hero-online', soggetto: 'a small vermilion signal lamp on a stand (like a stage or traffic beacon) with a round leaf-green light glowing on top and three short green rays around it' },
  ],
}

// ── Piè di pagina, seconda tornata ──────────────────────────────────────────
// Le mini immagini che mancavano ai tasti delle note legali: cookie e stile.
// Stesso stile del foglio `chrome`. Il foglio ne disegna più versioni per
// soggetto; nel sito va la migliore, le altre restano nel foglio con `scarta`.

fogli.chrome2 = {
  titolo: 'Le mini immagini dei tasti «cookie» e «stile» del piè di pagina, in più versioni',
  figurine: [
    { nome: 'chrome-cookie', soggetto: 'a single round chocolate-chip biscuit with one bite taken out of its edge and two crumbs beside it, one of the chips vermilion' },
    { nome: 'chrome-cookie-2', scarta: true, soggetto: 'a small glass jar of round biscuits with a lid, the lid knob vermilion' },
    { nome: 'chrome-cookie-3', scarta: true, soggetto: 'a round biscuit broken into two halves lying on a small folded paper napkin, a vermilion check mark tag tied to the napkin' },
    { nome: 'chrome-cookie-4', scarta: true, soggetto: 'a short stack of three round biscuits, the top one with a vermilion sugar-glazed centre' },
    { nome: 'chrome-stile', soggetto: 'a fan of colour swatch cards held together by a pin at one end, cards in paper white, warm grey, sage green and near-black, the top card vermilion' },
    { nome: 'chrome-stile-2', scarta: true, soggetto: 'a small wooden painter\'s palette with round blobs of paint in paper white, warm grey, sage green and near-black, one blob vermilion, and a thin brush resting across it' },
    { nome: 'chrome-stile-3', scarta: true, soggetto: 'a flat steel ruler with tick marks, a sharpened pencil and a small open tin of watercolour pans lying together, one pan vermilion' },
    { nome: 'chrome-stile-4', scarta: true, soggetto: 'three square colour chips standing in a row like little tiles — paper white, sage green, near-black — with a fourth vermilion chip leaning on them' },
    { nome: 'chrome-stile-5', scarta: true, soggetto: 'a drawing compass standing open over a small sheet with a circle and a square drawn on it, the circle filled vermilion' },
  ],
}
