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
