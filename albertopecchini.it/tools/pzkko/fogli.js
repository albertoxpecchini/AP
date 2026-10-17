// I fogli di immagini del «muro» di pzkko.it, disegnati da openai/gpt-image-2
// su Replicate (vedi tools/replicate.mjs e immagini.mjs). La home è una
// saracinesca grigia coperta di graffiti e di volantini attaccati col nastro:
// il modello disegna gli ingredienti (la lamiera, i graffiti, la carta vuota, i
// nastri, le illustrazioni, qualche manifesto intero, l'insegna) su fondo
// magenta pieno; la chiave cromatica li scontorna e la pagina li compone con i
// testi veri in HTML, così i link restano testo e si leggono.
//
// I prompt sono in inglese perché il modello li segue meglio. Niente magenta,
// rosa o viola sui pezzi: la chiave li farebbe sparire.

const FONDO = 'a perfectly flat, uniform, solid pure magenta background (#FF00FF, a chroma-key backdrop: no texture, no gradient, no vignette, no shadow falls on it)'

export { FONDO }

const NIENTE_MAGENTA = 'Never use magenta, pink, purple or violet anywhere on the pieces.'

const griglia = (n, cols, rows) =>
  `${n} separate pieces laid out in a ${cols} × ${rows} grid (${cols} columns, ${rows} rows) on ${FONDO}, photographed straight on (flat, orthographic, no perspective), each piece complete and whole, none touching or overlapping another, generous empty magenta space between them, nothing cropped by the edge.`

export const FOGLI = {
  muro: {
    titolo: 'la lamiera della saracinesca, senza niente sopra (diventa la tela ripetuta)',
    aspetto: '2048x2048',
    tela: true,
    prompt: `A straight-on, flat, orthographic photograph of a section of an old grey painted sheet-metal roller shutter (the saracinesca of a closed Italian shop) filling the whole frame edge to edge, with no border: medium warm grey paint (#8e8e8a) with faint horizontal corrugation ribs, soft overcast daylight that is perfectly even across the whole image (no vignette, no gradient, no bright or dark side, the brightness is the same in every corner).
The surface is weathered: fine scuffs, a few small rust spots, dust, faint rain streaks, a few very faint pale ghost rectangles where old posters were torn away, a few tiny scraps of torn white paper still glued on with yellowed tape residue.
ABSOLUTELY NO graffiti, NO writing, NO letters, NO text, NO posters, NO stickers, NO objects: only the empty dirty metal surface. Photorealistic, sharp, fine grain.`,
  },

  tag: {
    scala: 0.75,
    titolo: 'nove graffiti (tag, throw-up, stencil) da spargere sul muro',
    aspetto: '2048x2048',
    griglia: [3, 3],
    pezzi: ['tag-nero', 'throwup-argento', 'tag-verde', 'ciao-bianco', 'faccia', 'tag-arancio', 'scarabocchio', 'tag-azzurro', 'stencil-chiocciola'],
    prompt: `Nine separate pieces of street graffiti laid out in a 3 × 3 grid (three columns, three rows) on ${FONDO}, as if sprayed and drawn on an invisible wall, each complete, none touching another, generous magenta space between them, nothing cropped. They are all different styles, as on a real wall covered by many hands:
1. a quick black spray-paint tag reading "pzkko" in a loose one-line handstyle, with two drips running down;
2. a silver chrome throw-up (fat bubble letters) reading "PZK" with a thick black outline and small drips;
3. a fat-cap tag in bright green spray reading "pzkko", with a haze of overspray around the letters;
4. a white paint-marker tag reading "ciao" in a scribbly hand, with a small heart;
5. a simple black-marker cartoon face (two dots and a wavy mouth) with a little crown over it;
6. an orange spray tag reading "pzk" with an arrow and a star;
7. a black spray scribble, illegible and energetic like a signature, with one long drip;
8. a sky-blue spray tag reading "pzkko" in rounded letters with a thin white highlight;
9. a black stencil of a snail (a street-art stencil: crisp edges, a bit of overspray around it).
The paint is only spray paint and marker ink: semi-transparent overspray, drips running downward, grainy edges. No wall, no texture, no shadow: only the paint on the magenta. ${NIENTE_MAGENTA}`,
  },

  carta: {
    scala: 1,
    traslucido: true,
    titolo: 'nove fogli di carta vuoti, strappati e attaccati col nastro: i volantini li scrive la pagina',
    aspetto: '2048x2048',
    griglia: [3, 3],
    pezzi: ['bianco', 'giallo', 'kraft', 'giornale', 'arancio', 'verde', 'crema', 'lucido', 'azzurro'],
    prompt: `${griglia('Nine blank paper flyers,', 3, 3)}
They are the empty sheets of street posters taped to an invisible wall, with NOTHING printed or written on them: completely blank paper, ready for printing. All different, each filling most of its cell:
1. plain white copier paper, portrait, slightly wavy from rain, a strip of yellowed clear tape across the top-left corner and another at the bottom-right corner;
2. bright canary-yellow paper, portrait, a torn bottom edge, two strips of clear tape at the top corners;
3. kraft brown paper, portrait, creased down the middle, a steel staple at each top corner;
4. light grey newsprint, landscape, a torn left edge, a long strip of beige masking tape along the top;
5. fluorescent orange paper, portrait, slightly curled at the bottom-right corner, clear tape at the top corners;
6. pale green paper, square, a water stain at the bottom, clear tape at all four corners;
7. cream paper, portrait, a ragged horizontal tear across the lower third with the lower part hanging slightly askew, clear tape at the top corners;
8. white glossy paper, portrait, one crumpled corner, three staples along the top edge;
9. light blue paper, landscape, torn irregularly on the right, a strip of clear tape at the top-left corner.
The tape is real: translucent, slightly yellowed, with small air bubbles, sticking out past the paper edge onto the magenta, where the magenta shows through it. Soft even daylight; a very slight shadow only inside the paper's own creases, none on the magenta. Photorealistic, sharp. No text, no printing, no drawings, no logos. ${NIENTE_MAGENTA}`,
  },

  nastro: {
    scala: 0.75,
    traslucido: true,
    titolo: 'nastri, graffette, puntine, resti di manifesti strappati, adesivo',
    aspetto: '2048x2048',
    griglia: [3, 3],
    pezzi: [null, 'scotch-storto', 'carta-gommata', 'nastro-nero', 'resto-bianco', 'resto-giallo', 'adesivo', 'puntina', 'graffette'], // null = pezzo tolto dal sito
    prompt: `${griglia('Nine small pieces of street-poster hardware,', 3, 3)}
Each piece is drawn LARGE and fills most of its cell:
1. a strip of clear adhesive tape, slightly yellowed, horizontal, with torn ends and tiny air bubbles;
2. a strip of clear adhesive tape, diagonal at about 30 degrees, torn ends;
3. a piece of beige masking tape, horizontal, torn ends, slightly crumpled;
4. a piece of black cloth duct tape, horizontal, torn ends;
5. the corner remnant of a torn-away white poster still stuck under a strip of yellowed clear tape: a ragged triangle of paper under the tape;
6. the remnant of a torn-away yellow poster: a ragged strip of paper with a steel staple;
7. a round matte white vinyl sticker with a hand-drawn black snail and the word "pzkko" in black marker under it, slightly peeling at one edge;
8. a red plastic push pin seen from the front;
9. two steel staples, one straight and one bent.
Photorealistic, sharp, soft even daylight. The clear tape is translucent, so the magenta shows through it. ${NIENTE_MAGENTA}`,
  },

  arte1: {
    scala: 0.75,
    senzaCarta: true,
    titolo: 'le illustrazioni dei volantini dei social (macchina fotografica, gatto, cornetta, piccione, caffè, bomboletta)',
    aspetto: '2048x2048',
    griglia: [3, 2],
    pezzi: ['macchina', 'gatto', 'cornetta', 'piccione', 'caffe', null], // null = pezzo tolto dal sito
    prompt: `${griglia('Six separate printed illustrations,', 3, 2)}
They are the pictures printed on six different street flyers, so each has its own print style with visible ink texture, and there is NO text, no letters and no logos anywhere. Each drawn LARGE, filling most of its cell:
1. a chunky instant camera with a photo sliding out of the slot, risograph style with two inks (fluorescent orange and dark teal), grainy, slightly misregistered;
2. a tabby cat sitting on an open laptop and pawing at the keys, black-and-white photocopy style with rough halftone dots and heavy black areas;
3. an old telephone handset with a curly cord and a big empty speech bubble, flat screen print in bright green and black;
4. a carrier pigeon in flight carrying an envelope in its beak, linocut style, black ink only, bold cuts;
5. a paper coffee cup with a lid and steam, three coins beside it, flat screen print in yellow, blue and black;
6. a spray can with a cloud of spray coming out of the nozzle, stencil style in black with crisp edges and a little overspray.
${NIENTE_MAGENTA}`,
  },

  arte2: {
    scala: 0.75,
    senzaCarta: true,
    titolo: 'le illustrazioni dei volantini dei giochi e dei tools (carte, ruota, bomba, dadi, moneta, chiavi)',
    aspetto: '2048x2048',
    griglia: [3, 2],
    pezzi: ['carte', 'ruota', 'bomba', 'dadi', 'moneta', 'chiavi'],
    prompt: `${griglia('Six separate printed illustrations,', 3, 2)}
They are the pictures printed on six different street flyers, so each has its own print style with visible ink texture, and there is NO text, no letters, no numbers and no logos anywhere. Each drawn LARGE, filling most of its cell:
1. a fanned hand of playing cards with an ace of spades and a king of hearts in front, screen print in red and black, bold flat shapes;
2. a roulette wheel seen from above with a small ball on it, risograph style with two inks (red and dark green), grainy;
3. a round black cartoon bomb with a lit sparkling fuse, next to a small triangular flag on a stick, flat screen print in black, red and yellow;
4. two dice in mid-roll with motion lines, linocut style, black ink only, bold cuts;
5. a coin in mid-flip with motion lines, flat screen print in yellow and black;
6. a wrench and a screwdriver crossed, with a few loose screws around them, black-and-white photocopy style with heavy toner.
${NIENTE_MAGENTA}`,
  },

  manifesti1: {
    scala: 0.75,
    titolo: 'quattro manifesti interi, inventati, per riempire il muro (prima serie)',
    aspetto: '2048x2048',
    griglia: [2, 2],
    pezzi: ['concerto', 'roulette', 'teatro', 'sagra'],
    prompt: `${griglia('Four complete street posters,', 2, 2)}
Each is a different printed flyer from a different Italian print shop. The text on them is in correct Italian, all lowercase, very few words, very large; nothing else is written on them (no small print, no phone numbers, no addresses, no dates with numbers, no QR codes). Each poster fills most of its cell.
1. a risograph concert poster, two overprinted inks (fluorescent orange and teal blue) on off-white paper, misregistered and grainy: a big hand-drawn snail carrying a boombox on its shell, the words «concerto al muro» at the top and «ingresso libero» at the bottom;
2. a black-and-white photocopied flyer on white paper with a heavy toner texture and a dark photocopy edge: a hand-drawn roulette wheel, the words «lezioni di roulette» in big ugly bold type, and a row of tear-off tabs along the bottom edge, two of them already torn off;
3. a theatre poster on heavy cream paper: a woodcut-style turtle in black and red, the words «teatro del browser» in a tall condensed serif and «tutti i martedì» smaller under it;
4. a bright yellow typographic poster, heavy black letters only, with the text blocks slightly rotated: «sagra del volantino» huge, «sabato e domenica» under it, and a black circle containing the word «gratis».
${NIENTE_MAGENTA}`,
  },

  manifesti2: {
    scala: 0.75,
    titolo: 'quattro manifesti interi, inventati, per riempire il muro (seconda serie)',
    aspetto: '2048x2048',
    griglia: [2, 2],
    pezzi: ['gatto', 'dadi', 'punk', 'moneta'],
    prompt: `${griglia('Four complete street posters,', 2, 2)}
Each is a different printed flyer from a different Italian print shop. The text on them is in correct Italian, all lowercase, very few words, very large; nothing else is written on them (no small print, no phone numbers, no addresses, no dates with numbers, no QR codes). Each poster fills most of its cell.
1. a screen-printed poster in three flat colours (red, black, cream): a cat sitting on a laptop keyboard, the words «cercasi gatto» above it and «risponde al nome di git» below;
2. a photocopied flyer on fluorescent green paper: a hand-drawn pair of dice, the words «torneo di dadi» in bold type, and tear-off tabs along the bottom edge, three of them already torn off;
3. a wheat-pasted gig poster in the style of a 1980s punk flyer: cut-and-paste ransom-note letters reading «pzkko» huge, a halftone photo of a snail, torn newspaper fragments, black and white with one red stripe;
4. a square poster in flat blue and white only: a coin in mid-flip with motion lines, the words «testa o croce» in a rounded display typeface.
${NIENTE_MAGENTA}`,
  },

scritte: {
    scala: 0.75,
    titolo: 'le tre scritte sprayate che danno il nome alle zone: social, games, tools',
    aspetto: '2048x1152',
    griglia: [3, 1],
    pezzi: ['social', 'games', 'tools'],
    prompt: `Three separate spray-paint graffiti words laid out in a row (three columns, one row) on ${FONDO}, as if sprayed on an invisible wall, each complete, none touching another, generous magenta space between them, nothing cropped, all three at the same scale and each filling most of its column:
1. the word "social" in a quick black spray-paint handstyle, lowercase, loose one-line tag lettering, with two drips running down;
2. the word "games" in white spray paint, lowercase, slightly rounded tag lettering with a thin dark grey outline and a few drips;
3. the word "tools" in red-orange spray paint, lowercase, a fat-cap tag with a haze of overspray around it and one drip.
The paint is only spray paint: semi-transparent overspray, drips running downward, grainy edges. No wall, no texture, no shadow: only the paint on the magenta. ${NIENTE_MAGENTA}`,
  },

  strada1: {
    scala: 0.75,
    titolo: 'la strada: dal 17.10 resta solo il pezzo delle gomme (lampioni, cavi, intonaco e umidità tolti con la facciata in SVG)',
    aspetto: '2048x2048',
    griglia: [3, 3],
    pezzi: [null, null, null, null, null, null, null, null, 'gomme'], // null = pezzo tolto dal sito
    prompt: `${griglia('Nine separate objects from an old Italian city street,', 3, 3)}
Each object fills most of its cell. Seen from the front and slightly from below, as from the pavement:
1. a wall-mounted street lamp: a short black cast-iron arm fixed to the wall with a bracket plate at its LEFT end, pointing right, holding a classic lantern head with a high-pressure sodium lamp, switched OFF in daylight (clear glass, dull bulb);
2. the same kind of wall-mounted sodium street lamp at night, switched ON: the lamp burns a vivid orange-amber inside the lantern, the glass glows, a soft warm halo around the head;
3. a wall-mounted fluorescent tube fixture: a single white tube under a grey sheet-metal hood with a bracket, horizontal, switched OFF;
4. the same fluorescent fixture at night, switched ON: the tube glows a cold greenish-white, with a soft halo;
5. two old outdoor air-conditioner condenser units mounted one above the other on rusty brackets, with a thin white condensate drain pipe hanging down from the lower one, a drop of water at its end;
6. a sagging bundle of black electrical and telephone cables with a grey plastic junction box and a few cable ties, running horizontally as fixed along a city wall;
7. a patch of peeling, cracking dark grey paint flaking off a plaster wall, the pale plaster showing underneath, with curling flakes, as an isolated irregular patch;
8. a damp dark stain with dried water streaks running down, as under a leaking pipe, with white mineral deposits at its edges, as an isolated patch;
9. three flattened old chewing gums stuck on a wall, grey-white and dirty, drawn large.
Photorealistic, sharp. ${NIENTE_MAGENTA}`,
  },

  strada2: {
    scala: 0.75,
    titolo: 'scritte sul muro che non c’entrano con pzkko',
    aspetto: '2048x2048',
    griglia: [3, 3],
    pezzi: ['tiamo', 'no', 'ciaomamma', null, null, 'pizza', 'zio', 'qui', null], // null = pezzo tolto dal sito
    prompt: `Nine separate pieces of street graffiti laid out in a 3 × 3 grid (three columns, three rows) on ${FONDO}, as if drawn on an invisible wall, each complete, none touching another, generous magenta space between them, nothing cropped. They are the scribbles of many different hands, nothing to do with each other:
1. "ti amo giulia" in quick black marker handwriting with a small heart;
2. "NO" huge in red spray paint, dripping;
3. "ciao mamma" in white paint-marker handwriting;
4. "ACC 19" in silver spray, blocky;
5. a black stencil of a rat (street-art stencil, crisp edges, slight overspray);
6. "w la pizza" in blue marker, with an exclamation mark;
7. "zio" as a quick black spray tag with an underline;
8. an orange spray arrow pointing down with the word "qui" next to it;
9. "tvb 4ever" in thick black marker, schoolbook handwriting.
The paint is only spray paint and marker ink: overspray, drips, grainy edges. No wall, no texture, no shadow. ${NIENTE_MAGENTA}`,
  },

  bestiole: {
    scala: 1,
    traslucido: true,
    tinta: [236, 242, 255],
    titolo: 'formiche, gocce di condensa, spruzzo, rivolo, gomme, crepa',
    aspetto: '2048x2048',
    griglia: [3, 3],
    pezzi: [null, 'formica', 'formica-lato', null, 'goccia-cade', 'spruzzo', 'rivolo', 'gomme2', null], // null = pezzo tolto dal sito
    prompt: `${griglia('Nine small things from a city wall,', 3, 3)}
Each thing is drawn LARGE and fills most of its cell, photographed straight on:
1. three tiny black garden ants walking in a line, seen from directly above;
2. a single black ant seen from directly above, legs spread, walking;
3. a single black ant seen from the side, walking to the right;
4. a single clear water drop hanging, teardrop shaped, transparent with a bright highlight and a dark edge;
5. a single clear water drop falling, slightly elongated, transparent with a highlight;
6. a tiny splash of water on a flat surface: a small crown of clear droplets, seen from slightly above;
7. a thin wet streak of water running down, vertical, transparent and darker where wet, as on a wall;
8. two flattened old chewing gums stuck on a wall, grey-white and dirty;
9. a thin dark crack in plaster, branching, as an isolated line drawing of a real crack.
Photorealistic, sharp. The water is transparent: the magenta shows through it. ${NIENTE_MAGENTA}`,
  },

  // 17.10: la saracinesca si allunga verso l'alto e in cima finiscono le cose nuove:
  // i volantini dei siti (testo vero, sopra queste illustrazioni) e roba di altri
  // (meme, pubblicità, cose attaccate con lo scotch), disegnata intera dal modello
  manifesti3: {
    scala: 0.75,
    titolo: 'quattro manifesti di altri: il meme unimore contro unibo, lyca mobile contro tim, l’avvistamento starlink, moncler',
    aspetto: '2048x2048',
    griglia: [2, 2],
    pezzi: ['unimore', 'lyca-tim', 'starlink', 'moncler'],
    prompt: `${griglia('Four complete street posters,', 2, 2)}
Each is a different printed poster wheat-pasted or taped on a city wall by a different person: slightly wrinkled paper, a few creases, real print texture. The text on them is in correct Italian, spelled exactly as given, all lowercase unless written otherwise; nothing else is written on them (no small print, no phone numbers, no addresses, no QR codes, no website addresses). Each poster fills most of its cell.
1. a black-and-white photocopied meme flyer on white copier paper, heavy toner, a dark photocopy edge: the big bold title «unimore vs unibo» across the top, then the classic "virgin vs chad" meme drawn in crude MS-Paint style, two cartoon men side by side: on the left a hunched, skinny, sad man labelled «lo studente unibo», with three short captions pointing at him with arrows: «doppia a 650 €», «2 ore di fila in segreteria», «"la più antica del mondo"»; on the right a tall, broad, square-jawed confident man striding forward, labelled «lo studente unimore», with captions «singola a 350 €», «parcheggio sotto casa», «aceto balsamico della nonna»;
2. an old-school boxing match poster, letterpress style, printed in red and black on bright yellow paper: two cartoon SIM cards with little arms, legs and red boxing gloves face each other in a boxing ring, the left SIM card plain blue, the right one plain red; the huge words «lyca mobile vs tim» at the top, «l'incontro del secolo» under them, and at the bottom «100 giga contro 7 giga»; no logos;
3. a "sighting" flyer, black-and-white photocopy on white paper: the heading «avvistamento» in huge heavy black type; under it a grainy halftone night photograph of a perfectly straight line of evenly spaced bright dots crossing a starry sky above the dark silhouette of a farmhouse and poplar trees in the flat countryside; under the photo «una fila di luci sopra rodigo» and then, bold, «non sono ufo: è starlink»; a row of blank tear-off tabs along the bottom edge, one of them torn off;
4. a glossy luxury fashion advertising poster, a printed photograph: a shiny lacquered red down puffer jacket floating alone in front of snowy alpine peaks and a deep blue sky, shot like a high-end winter campaign; at the bottom the brand wordmark «MONCLER» in thin, widely spaced capitals; the glossy paper is slightly wrinkled from the glue and its top-right corner is torn away.
${NIENTE_MAGENTA}`,
  },

  manifesti4: {
    scala: 0.75,
    traslucido: true,
    titolo: 'brat, la cartolina di piazza tre torri, le frisk attaccate con lo scotch, il biglietto del parcheggio di milano',
    aspetto: '2048x2048',
    griglia: [2, 2],
    pezzi: ['brat', 'tre-torri', 'frisk', 'parcheggio'],
    prompt: `${griglia('Four things stuck on a city wall,', 2, 2)}
Each fills most of its cell; the text on them is spelled exactly as given and nothing else is written on them:
1. a square street poster in the style of a famous minimalist pop album cover: flat acid lime-green paper (#8ACE00), completely empty except for the single lowercase word «brat» in a plain narrow Arial-like sans-serif, black, slightly blurred and low-resolution as if stretched, placed a little left of centre and a little above the middle; wheat-pasted: wrinkled, a faint glue shine, the bottom-left corner peeling, two strips of clear tape at the top corners;
2. a glossy tourist postcard with a thin white border, held by two strips of clear tape at the top corners: a photograph of the three skyscrapers of Milan's CityLife district at sunset (a straight glass tower, a twisted glass tower and a curved glass tower) rising behind a wide paved square; printed on the photo in white script «saluti da milano» and below it in small white capitals «PIAZZA TRE TORRI»;
3. a small flat rectangular pack of FRISK peppermint breath mints (the slim white pack with dark blue lettering «FRISK»), stuck flat on the wall with two crossing strips of clear adhesive tape over it, the tape wrinkled, slightly yellowed, with air bubbles;
4. a curled, slightly crumpled thermal-paper ticket from a street parking meter, white paper a bit yellowed with faded black print: «comune di milano» at the top, then «sosta a pagamento», a big «valido fino alle 18:40», «€ 3,00» and a short barcode; a faint brown coffee-cup ring on it; held on the wall by one strip of clear tape across its top.
Photorealistic, sharp, soft even daylight. The clear tape is translucent, so the magenta shows through it. ${NIENTE_MAGENTA}`,
  },

  arte3: {
    scala: 0.75,
    senzaCarta: true,
    titolo: 'le illustrazioni dei volantini dei siti (chiocciola, computer, airone, cascina, compasso, megafono)',
    aspetto: '2048x2048',
    griglia: [3, 2],
    pezzi: ['chiocciola', 'computer', 'airone', 'cascina', 'compasso', 'megafono'],
    prompt: `${griglia('Six separate printed illustrations,', 3, 2)}
They are the pictures printed on six different street flyers, so each has its own print style with visible ink texture, and there is NO text, no letters, no numbers and no logos anywhere. Each drawn LARGE, filling most of its cell:
1. a snail whose spiral shell is drawn like a technical drawing, with compass arcs and little ruler ticks, a pencil lying beside it, risograph style with two inks (blue and red-orange), grainy, slightly misregistered;
2. an old beige desktop computer with a bulky CRT monitor, a sticking plaster stuck across the screen and an old telephone handset ringing beside it with little ring lines, flat screen print in yellow and black;
3. a grey heron standing in tall reeds at the edge of a slow river, a small church bell tower far behind it, linocut style, black and dark teal, bold cuts;
4. a dairy cow's head peeking over a big round hay bale, a neat stack of split firewood beside it, flat screen print in terracotta, olive green and black;
5. a drafting compass and a set square lying across the front elevation drawing of a small two-storey house, black ink only, fine technical-pen lines with hatching;
6. a megaphone shouting, with a few loud sound lines coming out of it, black-and-white photocopy style with heavy toner.
${NIENTE_MAGENTA}`,
  },

  scritte2: {
    scala: 0.75,
    titolo: 'le scritte della parte nuova in cima: siti, brat summer, unimore > unibo',
    aspetto: '2048x1152',
    griglia: [3, 1],
    pezzi: ['siti', 'brat-summer', 'unimore'],
    prompt: `Three separate pieces of graffiti laid out in a row (three columns, one row) on ${FONDO}, as if sprayed and written on an invisible wall by different hands, each complete, none touching another, generous magenta space between them, nothing cropped, each filling most of its column:
1. the word "siti" in bright yellow spray paint, lowercase, a fat-cap tag with a thick black outline, a haze of overspray and two drips running down;
2. the words "brat summer" in acid lime-green spray paint, lowercase, quick loose handwriting on two lines, with drips;
3. the words "unimore > unibo" in thick black marker, lowercase, scrawled handwriting, the ">" sign big and underlined twice.
The paint is only spray paint and marker ink: semi-transparent overspray, drips running downward, grainy edges. No wall, no texture, no shadow: only the paint on the magenta. ${NIENTE_MAGENTA}`,
  },

  // 17.10 sera: la roulette nella finestra (games/roulette/): il foglio della finestra,
  // le fiches e il segnaposto viste dall'alto, il legno della ruota 3D
  'carta-roulette': {
    scala: 1,
    traslucido: true,
    intero: 'roulette/carta',
    titolo: 'il foglio grande della finestra della roulette, attaccato col nastro ai quattro angoli',
    aspetto: '1536x1152',
    prompt: `A single large blank sheet of thick off-white poster paper, landscape, about 4:3, photographed straight on (flat, frontal, no perspective), centred on ${FONDO} and filling 90% of the image width and 90% of its height.
The paper is completely blank, nothing printed or written on it: slightly wavy from humidity, one soft diagonal crease, the edges very slightly irregular, a little yellowing near the edges. A strip of yellowed clear adhesive tape is stuck diagonally across each of the four corners, sticking out past the paper onto the magenta, where the magenta shows through it; small air bubbles in the tape.
Soft even daylight, no shadow falls on the magenta. Photorealistic, sharp. No text, no logos. ${NIENTE_MAGENTA}`,
  },

  fiches: {
    scala: 0.3,
    titolo: 'le fiches della roulette (1, 5, 25, 100, 500) e il segnaposto del numero uscito, viste dall’alto',
    aspetto: '2048x2048',
    griglia: [3, 2],
    pezzi: ['f1', 'f5', 'f25', 'f100', 'f500', 'dolly'],
    prompt: `${griglia('Six separate objects from a roulette table,', 3, 2)}
Each is photographed from DIRECTLY ABOVE (flat top view, orthographic), the five chips exactly the same size, perfectly round, each filling most of its cell. They are real heavy clay casino chips with a fine embossed texture and a slightly worn surface, each with six rectangular edge inserts around the rim, a thin inner ring, and its value printed big in the centre in a heavy condensed sans-serif:
1. a cream-white chip with dark blue edge inserts and a dark blue «1»;
2. a red chip with white edge inserts and a white «5»;
3. a dark green chip with white edge inserts and a white «25»;
4. a black chip with white edge inserts and a white «100»;
5. a bright yellow chip with black edge inserts and a black «500»;
6. a roulette win marker (a "dolly"): a small heavy clear crystal piece shaped like a chess pawn with a round white top, seen from directly above, its clear glass catching highlights.
Soft even daylight; no shadow falls on the magenta. Photorealistic, sharp. Nothing else written anywhere. ${NIENTE_MAGENTA}`,
  },

  'legno-roulette': {
    foto: 'roulette/legno',
    titolo: 'il legno lucidato della ruota 3D (texture con la venatura dritta)',
    aspetto: '2048x1152',
    prompt: `A perfectly flat, straight-on photograph of polished dark mahogany wood veneer with a straight, fine grain running exactly horizontally from left to right, filling the whole frame edge to edge with no border: rich reddish-brown wood under a clear glossy lacquer, fine open pores, subtle darker streaks along the grain. Perfectly even soft lighting: no reflections, no vignette, no gradient, the same brightness in every corner. No objects, no text. Photorealistic, sharp.`,
  },

  // le mosche che si posano sul muro e volano via: posata (ali chiuse) e in volo (ali mosse)
  mosche: {
    scala: .2,
    traslucido: true,
    tinta: [236, 242, 255],
    titolo: 'mosche: posata, che si pulisce, in volo',
    aspetto: '2048x2048',
    griglia: [2, 2],
    pezzi: ['mosca', 'mosca-zampe', 'mosca-vola', 'mosca-vola2'],
    prompt: `${griglia('Four views of a common house fly (Musca domestica),', 2, 2)}
Each fly is drawn LARGE, filling most of its cell, photographed from DIRECTLY ABOVE (top view, flat, orthographic), head pointing straight UP in every cell:
1. the fly resting, wings folded back over the abdomen in a narrow V, legs spread;
2. the same fly resting, rubbing its two front legs together in front of the head;
3. the fly in flight, wings spread out to the sides and motion-blurred, legs tucked;
4. the fly in flight, wings in a different beat position, swept forward and motion-blurred, legs tucked.
Grey thorax with dark stripes, dark red eyes, bristly black legs, the wings clear and transparent with fine dark veins: the magenta shows through the wings. Photorealistic macro photograph, sharp. ${NIENTE_MAGENTA}`,
  },
}
