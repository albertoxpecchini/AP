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

import { fogliChat } from './fogli-chat.js'

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

  // 21.10: altra roba degli altri (red bull, estathé, eastpak, il cartello della frutta) e il libretto del landini
  manifesti5: {
    scala: 0.75,
    traslucido: true,
    titolo: 'red bull che mette le ali alla chiocciola, il brick di estathé con lo scotch, l’eastpak scarabocchiato, il cartello di fragole, mirtilli e lamponi',
    aspetto: '2048x2048',
    griglia: [2, 2],
    pezzi: ['redbull', 'estathe', 'eastpak', 'frutti'],
    prompt: `${griglia('Four things stuck on a city wall,', 2, 2)}
Each is put up by a different person and fills most of its cell; the text on them is spelled exactly as given, nothing else is written on them (no small print, no phone numbers, no addresses, no QR codes, no website addresses):
1. a portrait street poster in the style of the classic hand-drawn Red Bull TV cartoons: plain off-white paper, simple wobbly black ink outlines, almost no colour. A cartoon snail has just drunk a can of Red Bull: it flies off upward with two small white feathered wings, and its empty spiral shell is left behind on the ground next to the empty can. The can is drawn in colour: the real slim silver-and-blue Red Bull can with the blue-and-silver checkered pattern and the two red charging bulls in front of a yellow sun. At the bottom, in the same hand-drawn style, the slogan «red bull ti mette le ali». The paper is wheat-pasted: wrinkled, a faint glue shine, the bottom-right corner torn away;
2. a small empty carton brick of Estathé lemon iced tea (the classic Italian 200 ml drink box: yellow carton, the «estathé» wordmark, a slice of lemon and a glass of tea on it), slightly crushed, its thin plastic straw bent and still stuck in the hole, stuck flat on the wall with two crossing strips of clear adhesive tape over it, the tape wrinkled, slightly yellowed, with air bubbles;
3. a glossy printed advertising poster, a photograph: a worn black Eastpak backpack (the classic Padded Pak'r shape, the small rectangular red «EASTPAK» label patch on the front pocket) hanging from a hook against a grey concrete wall, covered in years of school marker scribbles in white and silver ink: names, hearts, «5ªB», «4ever», «maturità 2025», a little snail drawing, a few pin badges; across the top in bold white condensed capitals «BUILT TO RESIST»; the paper is wrinkled from the glue, the top-left corner peeling;
4. a farm-stand sign hand-lettered on a piece of torn brown cardboard box: «fragole» in thick crimson-red marker, «mirtilli» in dark blue, «lamponi» in deep red, each word on its own line, wobbly big letters, with small childlike drawings of a strawberry, a few blueberries and a raspberry; under them «raccolti oggi» and «€ 3 la vaschetta» in black marker; the cardboard is creased and a bit wet at the bottom, fixed on the wall with two strips of brown packing tape at the top.
Photorealistic, sharp, soft even daylight. The clear tape is translucent, so the magenta shows through it. ${NIENTE_MAGENTA}`,
  },

  landini: {
    scala: 0.6,
    traslucido: true,
    titolo: 'il libretto d’istruzioni del landini L 25 testacalda (1957): la copertina e la pagina dell’avviamento',
    aspetto: '2048x2048',
    griglia: [2, 1],
    pezzi: ['copertina', 'avviamento'],
    prompt: `Two separate pieces of paper laid out side by side (two columns, one row) on ${FONDO}, photographed straight on (flat, orthographic, no perspective), each complete and whole, upright, filling most of its half, generous empty magenta space between them, nothing cropped by the edge.
They come from the same old Italian tractor instruction booklet printed in 1957, now stuck on a city wall: portrait A5 pages, thin paper yellowed and foxed with age, brown spots, dog-eared corners, letterpress printing in black and one red, a slightly uneven ink. The text is in correct Italian, spelled exactly as given, nothing else is written on them:
1. the front cover, on slightly thicker card: at the top the big bold red word «LANDINI», under it «trattrice L 25» and «motore a testa calda», in the middle a black line drawing (an old engraving) of the tractor seen from the side: a 1950s Italian single-cylinder hot-bulb tractor with a long horizontal engine block, the bulb head at the front, a big flywheel on the left side, a tall vertical exhaust pipe, a small seat on a spring, big ribbed rear wheels and small front wheels; at the bottom «ISTRUZIONI PER L'USO E LA MANUTENZIONE», «Fabbrica Macchine Agricole Giovanni Landini · Fabbrico (Reggio Emilia)» and «1957»; a coffee-cup ring and two rusty staples along the left edge; a strip of clear adhesive tape across the top edge holds it on the wall;
2. an inner page of the same booklet: the heading «AVVIAMENTO DEL MOTORE» in bold red capitals, two small black technical drawings (a mechanic heating the bulb head of the engine with a petrol blowtorch, and the steering wheel taken off and fitted onto the hub of the flywheel to swing-start the engine), and four numbered steps in a black serif typeface: «1. scaldare la testa con la lampada per 8–10 minuti», «2. togliere il volante e innestarlo sul mozzo del volano», «3. far oscillare il volano avanti e indietro finché il motore parte», «4. rimettere il volante sullo sterzo»; the page number «12» at the bottom; a greasy thumbprint; two strips of clear adhesive tape at the top corners.
Photorealistic, sharp, soft even daylight. The clear tape is translucent, so the magenta shows through it. ${NIENTE_MAGENTA}`,
  },

  arte4: {
    scala: 0.75,
    senzaCarta: true,
    titolo: 'l’illustrazione del volantino di tiktok (il telefono con la chiocciola che balla)',
    aspetto: '1152x1536',
    griglia: [1, 1],
    pezzi: ['telefono'],
    prompt: `A single printed illustration, centred on ${FONDO}, photographed straight on, filling most of the image, nothing cropped.
It is the picture printed on a street flyer, on a small card of cream paper with visible ink texture, and there is NO text, no letters, no numbers and no logos anywhere: a smartphone held upright in a hand, its screen showing a vertical video of a cartoon snail dancing on its tail with little motion lines, three music notes floating out of the phone. Risograph style with two inks, cyan and red, overprinted and deliberately misregistered so every outline has a cyan ghost on one side and a red ghost on the other, grainy.
${NIENTE_MAGENTA}`,
  },

  // 22.10: altra roba degli altri al posto dei meme della storia: le zucche, il cartello di rivalta rubato, il promemoria
  // del dentista (l'appuntamento è vero), l'offerta della stampante, l'iphone che non esiste, lo scontrino delle stufe,
  // il corso dei bonsai, la gita a verona; e tre manifesti inventati (modena, la francia, vannacci)
  manifesti6: {
    scala: 0.75,
    traslucido: true,
    titolo: 'il cartello delle zucche, il cartello stradale di rivalta sul mincio, il promemoria del dentista, l’offerta della epson',
    aspetto: '2048x2048',
    griglia: [2, 2],
    pezzi: ['zucche', 'rivalta', 'dentista', 'epson'],
    prompt: `${griglia('Four things stuck on a city wall,', 2, 2)}
Each is put up by a different person and fills most of its cell; the text on them is spelled exactly as given, with the same capital and small letters, and nothing else is written on them (no small print, no phone numbers, no addresses, no QR codes, no website addresses):
1. a farm-stand sign painted by hand on an old weathered wooden board (two grey-brown planks side by side, rough grain, chipped edges): the big word «zucche» in thick bright orange house paint with wobbly brush strokes and one drip, under it «mantovane» in black paint, then «delica · violina» and «€ 1,50 al kg» in black marker, and along the bottom simple painted pumpkins: a squat round grey-green Mantua pumpkin, a bright orange round one and a long beige violin-shaped butternut; a rusty nail head in each corner; two strips of silver duct tape at the top hold it on the wall;
2. a real Italian road sign for the entrance of a village, stolen and hung on the wall with a twisted piece of wire through two holes at the top: a rectangular white enamelled sheet-steel sign with rounded corners and a thin black border line set a little inside the edge, the place name «RIVALTA SUL MINCIO» in black capitals in the Italian road-sign typeface, on two lines, and under it, much smaller, «Comune di Rodigo»; a few dents and scratches with rust showing through, faint dirt streaks, a small round football sticker half peeled off one corner;
3. a small dentist's appointment reminder card, the size of a business card, white card with a pale sky-blue printed band at the top: a simple outline drawing of a tooth and «STUDIO DENTISTICO», under it «Dott. D.F. MART», then «prossimo appuntamento» and two printed fields with dotted lines, «GIORNO» and «ORE», filled in by hand with a blue ballpoint pen: «24-11-26» after GIORNO and «12,30» after ORE; one strip of clear tape across the top holds it on the wall;
4. a glossy electronics-shop offer flyer: a big red starburst with «OFFERTA» in bold white capitals, a clean product photo of a compact Epson EcoTank inkjet all-in-one printer with its refillable ink tank window on the front (the ink inside looks dark, no colours), the text «Epson EcoTank ET-2825», under it «stampa · copia · scansiona · wi-fi», the old price «€ 229,90» struck through with a red line and the new price «€ 169,90» in huge red numbers; the paper is wrinkled from the glue and the bottom-right corner is peeling.
Photorealistic, sharp, soft even daylight. The clear tape is translucent, so the magenta shows through it. ${NIENTE_MAGENTA}`,
  },

  manifesti7: {
    scala: 0.75,
    traslucido: true,
    titolo: 'la pubblicità dell’iphone duo, lo scontrino di tecnomat delle due stufe a legna, il corso di potatura dei bonsai, la gita a verona',
    aspetto: '2048x2048',
    griglia: [2, 2],
    pezzi: ['iphone', 'scontrino', 'bonsai', 'verona'],
    prompt: `${griglia('Four things stuck on a city wall,', 2, 2)}
Each is put up by a different person and fills most of its cell; the text on them is spelled exactly as given, with the same capital and small letters, and nothing else is written on them (no small print, no phone numbers, no addresses, no QR codes, no website addresses):
1. a glossy smartphone advertising poster in the minimalist style of a premium tech campaign, a printed photograph: plain white background, a fictional new phone made of two thin glass smartphones joined side by side by a polished steel hinge like a book, half open and floating, both screens lit with the same abstract wallpaper of deep blue and warm orange waves, a soft shadow under it; at the top the headline «iPhone Duo» in a thin black sans-serif, under it «nuovo.» smaller, and at the bottom «da 3625 $»; no logo anywhere; the glossy paper is slightly wrinkled from the glue and its top-left corner peels;
2. a long, narrow, curled thermal-paper till receipt from a DIY superstore, a bit yellowed, the black print slightly faded, held on the wall by one strip of clear tape across its top, all in a plain monospaced receipt font with left-aligned labels and right-aligned prices: at the top «TECNOMAT» in bold capitals, then «DOCUMENTO COMMERCIALE» and «di vendita o prestazione», a dashed line, the item line «STUFA A LEGNA 9 KW» with «2 x 901,55» under it and «1.803,10» on the right, another dashed line, «TOTALE COMPLESSIVO» with «1.803,10» on the right in bold, «di cui IVA» with «325,15», «PAGAMENTO ELETTRONICO» with «1.803,10», then «18-10-2026 10:42» and a barcode at the bottom;
3. a photocopied community flyer on pale green paper, black toner: a black ink drawing of a small juniper bonsai in a shallow rectangular pot with a pair of bonsai pruning scissors beside it, the title «corso di potatura bonsai» in big bold lowercase letters at the top, under the drawing «per principianti», «4 giovedì sera» and «porta il tuo bonsai»; along the bottom edge a row of tear-off tabs, each with «bonsai» written sideways, two of them torn off;
4. a bus-trip flyer from a village pensioners' club, printed in colour on cheap glossy paper: a sunny photo of the Roman amphitheatre Arena di Verona under a blue sky, a small cut-out photo of a white coach bus in one corner, the big title «verona e l'arena tour» in bold yellow letters with a red outline, under it «gita in pullman», «domenica 15 novembre», «partenza ore 7:00 · pranzo incluso · € 45» and «posti limitati!»; a strip of brown packing tape at the top.
Photorealistic, sharp, soft even daylight. The clear tape is translucent, so the magenta shows through it. ${NIENTE_MAGENTA}`,
  },

  manifesti8: {
    scala: 1,
    titolo: 'modena e l’assalto al supermercato (il film che non c’è), le proteste in francia per il carovita, gen. vannacci al potere?',
    aspetto: '2048x1152',
    griglia: [3, 1],
    pezzi: ['modena', 'francia', 'vannacci'],
    prompt: `Three complete street posters laid out side by side (three columns, one row) on ${FONDO}, photographed straight on (flat, orthographic, no perspective), each complete and whole, upright, filling most of its column, generous empty magenta space between them, nothing cropped by the edge.
Each is a different printed poster wheat-pasted on a city wall by a different person: slightly wrinkled paper, a few creases, real print texture. The text on them is spelled exactly as given and nothing else is written on them (no small print, no credits block, no phone numbers, no addresses, no QR codes, no website addresses):
1. a dramatic Hollywood action-movie poster with orange-and-teal colour grading: a crowd of ordinary people in winter coats charging at night toward the glowing entrance of an Italian supermarket, pushing shopping carts like battering rams, discount price tags flying through the air, and in the foreground a paper shopping bag bursting with boxes of tortellini and a wheel of parmesan; the title «MODENA» in huge metallic capitals, under it «e l'assalto al supermercato», and at the bottom «prossimamente al cinema»;
2. a French protest poster screen-printed in red and black on cream paper, in the style of the May 1968 posters: a raised fist holding a baguette like a torch, behind it a big price tag; the slogans in French «LA VIE EST TROP CHÈRE !» at the top and «tous dans la rue · samedi 14h» at the bottom;
3. a black-and-white photocopied political street poster, heavy toner, creased paper: a simple bold drawing of a general's peaked military cap with gold braid on the visor (the only colour on the poster is that little gold) and a huge question mark beside it; the text in big heavy capitals «GEN. VANNACCI» and «AL POTERE?»; nothing else (no party symbols, no faces, no people).
${NIENTE_MAGENTA}`,
  },

  // le penne della petizione «pzkko.it è un bel sito?» (index.html): legate allo spago, per il muro di sempre e per la
  // finestra in cui si firma (nella scena 3D sono modelli, scena/petizione.js)
  penne: {
    scala: 0.6,
    traslucido: true,
    titolo: 'le tre bic cristal della petizione, legate allo spago (la blu senza cappuccio, la nera, la rossa)',
    aspetto: '2048x1152',
    griglia: [3, 1],
    pezzi: ['blu', 'nera', 'rossa'],
    prompt: `Three ballpoint pens laid out side by side (three columns, one row) on ${FONDO}, photographed straight on (flat, orthographic, no perspective), each complete and whole, perfectly vertical, filling the height of its column, generous empty magenta space between them, nothing cropped by the edge.
They are the classic cheap BIC Cristal pens, shown full length from the side: a clear transparent hexagonal plastic barrel through which the thin ink tube is visible all the way down, the small coloured end plug at the TOP end and the writing end at the BOTTOM. Each hangs from a piece of thin white cotton string: the string is tied around the barrel just under the end plug with a small knot, wrapped there with one turn of clear sticky tape, and from the knot it goes straight up and is cut off a little above the pen (only that short end of string is shown):
1. a blue BIC Cristal, blue ink tube and blue end plug, WITHOUT its cap: the conical clear tip and the brass point are visible at the bottom, a little blue ink on the point;
2. a black BIC Cristal, black ink tube and black end plug, with its black cap and clip on the writing end;
3. a red BIC Cristal, red ink tube and red end plug, with its red cap and clip on the writing end.
Photorealistic, sharp, soft even daylight, a subtle highlight along the plastic edges. The clear plastic and the clear tape are translucent, so the magenta shows through them. ${NIENTE_MAGENTA}`,
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

  // ── per la scena 3D (21.10): quello che c'è sulla facciata intorno alla saracinesca e sulla porta a vetri. La scena li
  // attacca all'intonaco, al pluviale, al telaio e al vetro (scena/fronte.js), coi nomi di qui e le misure di pezzi.json
  facciata: {
    scala: 0.75,
    titolo: 'i graffiti sull\'intonaco della facciata: il pezzo, lo stencil del divieto, le tag, il gesso, la pittura del comune',
    aspetto: '2048x2048',
    griglia: [3, 3],
    pezzi: ['pezzo-pzk', 'divieto', 'tag-mnt', 'tag-46100', 'tag-pekko', 'gesso', 'tag-gimbo', 'tag-2026', 'buff'],
    prompt: `${griglia('Nine separate pieces of paint,', 3, 3)}
They are what was sprayed, written and drawn over the years on the plastered wall of an old building in Mantova, around a closed shop, each one exactly as it looks on the wall but without the wall:
1. a big graffiti throw-up: fat rounded bubble letters «PZK» filled with silver chrome spray paint, a thick black outline, a thin white highlight, drips running down from the bottom, a haze of overspray;
2. an official stencil in black spray paint: «DIVIETO DI AFFISSIONE» in condensed capital stencil letters (with the stencil bridges), on two lines, uneven paint, faint overspray, two drips, old and faded;
3. a quick black spray tag «mnt» with a long underline;
4. «46100» (the postcode of Mantova) in black spray, fast and slanted, with one drip;
5. a red paint-marker tag «pekko» with a little star;
6. a white chalk drawing of a snail with «pzkko» written in chalk under it, a child's drawing, powdery and smudged;
7. a fat green marker tag «gimbo» with a halo of ink;
8. a hasty blue spray tag «pzk 2026»;
9. a patch of «buff»: an irregular rectangle of beige-grey wall paint rolled by the city over an old graffiti, the roller texture visible and the ghost of a black tag faintly showing through it.
The paint is only spray paint, marker ink, chalk and wall paint: semi-transparent overspray, drips running downward, grainy edges. No wall, no texture, no shadow: only the paint on the magenta. ${NIENTE_MAGENTA}`,
  },

  adesivi: {
    scala: 0.5,
    titolo: 'gli adesivi attaccati al pluviale, al telaio della porta e al muro',
    aspetto: '2048x2048',
    griglia: [3, 3],
    pezzi: ['hello', 'unimore', 'teschio', 'nutria', 'mn', 'concerto', 'strappato', 'pzkkonet', 'occhio'],
    prompt: `${griglia('Nine separate street stickers,', 3, 3)}
They are the stickers («slaps») stuck over the years on the drainpipe, the door frame and the walls of a street in Mantova: all weathered, faded by the sun, scratched, some corners peeling, each one different:
1. a red «HELLO my name is» label with «pekko» written in black marker;
2. a small yellow rectangular sticker «unimore ≥ unibo» in bold black letters;
3. a black square sticker with a white grinning cartoon skull, its top half torn off;
4. a round sticker with a cartoon nutria (a coypu) happily eating a piece of bread, thick black outlines;
5. a white oval sticker like a car country code, «MN» in big black letters and «46100 mantova» in small letters;
6. a torn paper sticker of a concert, «la chiocciola · live · 21.11», with a little drawing of a snail playing a guitar;
7. what is left of a torn-off sticker: a rough rectangle of white paper fibres and yellowed glue;
8. a blue rectangular sticker «pzkkonet» with a small snail logo and «la fibra che arriva anche dove non c'è»;
9. a sticker with one big cartoon eye looking sideways.
Seen straight on, flat. No wall, no shadow: only the stickers on the magenta. ${NIENTE_MAGENTA}`,
  },

  porta: {
    scala: 0.6,
    titolo: 'il cartello «chiuso», la targa del civico 28 e gli adesivi del vetro della porta',
    aspetto: '2048x1152',
    griglia: [3, 2],
    pezzi: ['chiuso', 'civico', 'orario', 'fumare', 'video', 'spingere'],
    tagli: [[0.35, 0.61], [0.5]],
    briciole: 3, // (i due punti e i trattini dell'orario sono piccoli: non sono briciole)
    prompt: `${griglia('Six signs and stickers,', 3, 2)}
They are the signs and stickers of the glass door of a small closed shop in Mantova, each one seen straight on:
1. a hanging shop sign: a landscape rectangle (3:2) of thick white plastic card, slightly yellowed by the sun, two small punched holes in the top corners, the word «CHIUSO» printed across the middle in big bold red condensed capitals and «torniamo presto» in small black print under it; a strip of clear tape on one corner, faint fingerprints;
2. a square house-number plate of enamelled steel, slightly domed: deep blue enamel, a thin white border line inset from the edge and the number «28» in big white classic Italian street-sign numerals; the enamel chipped around the two screw holes (top and bottom, with rusty slotted screws) and at the corners, showing black iron and rust, a thin rust streak below the lower screw;
3. an opening-hours sticker for the glass made only of cut white vinyl letters (no background panel): «ORARIO» on top, then «lun – ven  9:00 – 12:30  15:30 – 19:30», «sabato  9:00 – 12:30», «domenica chiuso», in a clean sans-serif, a couple of letters partly peeled off;
4. a round red-and-white «VIETATO FUMARE» sticker with the crossed-out cigarette, faded by the sun;
5. a small rectangular yellow-and-black «AREA VIDEOSORVEGLIATA» sticker with a camera pictogram and small print, scratched;
6. a small white vinyl «SPINGERE» sticker with a black arrow, one corner peeling.
No door, no glass, no wall, no shadow: only the pieces on the magenta. ${NIENTE_MAGENTA}`,
  },

  // 21.10 notte: il tasto della regia, sempre in alto a destra (index.html, .rotella): un pulsante giallo vero, con la
  // rotella stampata sul cappuccio, su e premuto
  tasto: {
    scala: 0.3,
    titolo: 'il tasto giallo della regia con la rotella, su e premuto, visto dall’alto',
    aspetto: '2048x1152',
    griglia: [2, 1],
    pezzi: ['tasto', 'tasto-giu'],
    prompt: `${griglia('Two views of the same real push button,', 2, 1)}
It is a big chunky industrial push button, the kind on a machine control panel or an arcade cabinet, photographed from DIRECTLY ABOVE (top view, flat, orthographic), perfectly round, each one filling most of its cell, the two exactly the same size:
1. the button RELEASED: a glossy bright yellow domed plastic cap, raised high, with a crisp curved white highlight near the top-left of the dome and a soft darker yellow towards the bottom-right edge; in the centre of the cap a black gear (a cog wheel with eight square teeth and a round hole in the middle) moulded into the plastic, slightly recessed; the cap sits inside a round black textured plastic bezel ring with a thin chrome inner rim, four tiny screws on the bezel;
2. the same button PRESSED DOWN: the yellow cap pushed deep into the bezel, so a thin dark gap shows all around it between the cap and the chrome rim, the dome looks lower and flatter, its highlight smaller and dimmer, the yellow a little darker, the same black gear in the centre.
Soft studio light from the top left, sharp. Photorealistic product photograph. The bezel ring is the outer edge of each piece: nothing outside it, no panel, no shadow falls on the magenta. No text. ${NIENTE_MAGENTA}`,
  },

  // 23.10 notte: il wallet dei $pzk (pzkko/wallet/), in alto a sinistra: un portafoglio di pelle usato, aperto, con sopra
  // la piastra d'acciaio rivettata alla fallout, gli schermi (vuoti: li accende la pagina), la porta usb-c sul lato
  // sinistro. Scala 0.5: nella pagina è largo al massimo 640 px
  wallet: {
    scala: 0.65,
    titolo: 'il portafoglio di pelle del wallet $pzk, aperto, con la piastra d’acciaio e gli schermi spenti',
    aspetto: '2048x1152',
    griglia: [1, 1],
    pezzi: ['portafoglio'],
    prompt: `${griglia('One piece: a single open bifold wallet,', 1, 1)}
It is a well-used men's bifold wallet of dark brown full-grain leather, lying OPEN and flat, photographed from DIRECTLY ABOVE (top view, orthographic, no perspective), landscape, filling the cell: the two leather flaps side by side with the fold running vertically down the middle, rounded corners, cream saddle stitching along the edges, the leather scuffed, creased and darkened by years in a back pocket, a worn patch where coins sat.
It has been customised by a tinkerer in the style of a Fallout Pip-Boy: on the LEFT flap, a brushed gunmetal steel plate riveted to the leather with eight small hex rivets, and recessed into the plate three switched-off display windows of dark smoky glass with a thin black plastic bezel each: one wide rectangular window across the upper half of the plate (about 1.8:1), and two smaller rectangular windows side by side under it; a tiny embossed metal label plate under them reading nothing (blank). On the RIGHT flap another riveted steel plate with ONE large switched-off dark glass window in the upper two thirds (about 1.6:1), and under it a horizontal row of four small round yellow rubber buttons in black bezels and a small knurled black knob. Along the LEFT outer edge of the wallet, half way down, a small oval USB-C port set in the leather in a little steel ferrule. A strip of grey duct tape across one corner, a couple of scratches on the steel, a brass snap stud. The card slots and the bill pocket of the wallet show at the bottom edge of each flap, a folded corner of a yellowish banknote peeking out of the right pocket.
All displays are OFF: plain dark glass, nothing drawn on them, no text, no icons anywhere. Soft diffuse studio light from the top left, photorealistic, sharp. The outline of the wallet is the edge of the piece: nothing outside it, no table, no shadow falls on the magenta. ${NIENTE_MAGENTA}`,
  },

  // 23.10 notte: i $pzk persi per terra (pzkko/scena/banconote.js), quattro banconote della banca $pzk
  banconote: {
    scala: 0.5,
    titolo: 'le quattro banconote della banca $pzk (500, 100, 25, 10) perse per terra',
    aspetto: '2048x1152',
    griglia: [2, 2],
    pezzi: ['b500', 'b100', 'b25', 'b10'],
    prompt: `${griglia('Four banknotes,', 2, 2)}
They are the four paper banknotes of an invented play currency, the «$pzk» of the «banca $pzk», all the same size (landscape, 2:1), each one complete and perfectly flat, photographed straight from above, the same engraved design in four colours, as finely engraved and detailed as real euro notes: intaglio guilloché borders and rosettes, a portrait in an oval frame of a garden SNAIL seen in profile with its spiral shell and two antennae, drawn like an engraved statesman, the big denomination numeral in the top left and bottom right corners and in words, «$pzk» in large letters at the top, «BANCA $PZK» and «pzkko.it» in small capitals, a security thread, a watermark area, a serial number in red, tiny microprint along the edge reading «non ha corso legale · soldi finti».
1. top left: 500 $pzk, golden yellow and ochre, the word «cinquecento»;
2. top right: 100 $pzk, charcoal grey and black on light paper, the word «cento»;
3. bottom left: 25 $pzk, green, the word «venticinque»;
4. bottom right: 10 $pzk, orange-red, the word «dieci».
The paper is slightly worn and creased, a little dirty at the edges, as notes that have been lost on a sidewalk, but each lies flat and whole. Photorealistic, sharp. Nothing outside the rectangles of the notes, no shadow falls on the magenta. ${NIENTE_MAGENTA}`,
  },

  'wallet-cavo': {
    scala: 0.5,
    titolo: 'il cavo usb-c del wallet, in carica: la spina infilata nella porta vista dall’alto',
    aspetto: '2048x1152',
    griglia: [1, 1],
    pezzi: ['cavo'],
    prompt: `${griglia('One piece: a single USB-C charging cable plugged into a port,', 1, 1)}
The photograph is taken from DIRECTLY ABOVE (top view, orthographic). The port is in an INVISIBLE flat surface facing the camera, so the plug is inserted straight DOWN, away from the camera, and only the BACK END of the plug is visible: the top of its matte dark grey anodised aluminium housing, a small rounded rectangle seen end-on, with the black rubber strain relief in its middle where the cable comes out. The cable, black braided nylon, about as thick as a pencil, rises out of the plug straight towards the camera for a short stretch (foreshortened, slightly out of focus at its nearest point) and then bends over to the LEFT and runs away across the frame to the LEFT edge of the cell, lying flat and in focus. The plug end sits in the RIGHT third of the cell, in the vertical middle; the cable fills the rest towards the left. Photorealistic, soft diffuse studio light from the top left, no shadow on the magenta. Nothing else: no port drawn, no surface, no table. ${NIENTE_MAGENTA}`,
  },

  // ── la chat col bot (pzkko/chat/): le icone al posto delle emoji e il cercapersone del tasto. I pezzi stanno in
  // pzkko/chat/icone.js, i prompt in fogli-chat.js ──
  ...fogliChat({ griglia, NIENTE_MAGENTA }),
}
