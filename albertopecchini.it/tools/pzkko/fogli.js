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
    pezzi: ['scotch', 'scotch-storto', 'carta-gommata', 'nastro-nero', 'resto-bianco', 'resto-giallo', 'adesivo', 'puntina', 'graffette'],
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
    pezzi: ['macchina', 'gatto', 'cornetta', 'piccione', 'caffe', 'bomboletta'],
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
    titolo: 'la strada: lampioni (sodio e neon, spenti e accesi), condizionatori, cavi, intonaco, umidità, gomme',
    aspetto: '2048x2048',
    griglia: [3, 3],
    pezzi: ['lampione-spento', 'lampione-acceso', 'neon-spento', 'neon-acceso', 'condizionatori', 'cavi', 'intonaco', 'umidita', 'gomme'],
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
    pezzi: ['tiamo', 'no', 'ciaomamma', 'acc', 'topo', 'pizza', 'zio', 'qui', 'tvb'],
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
    pezzi: ['formiche', 'formica', 'formica-lato', 'goccia', 'goccia-cade', 'spruzzo', 'rivolo', 'gomme2', 'crepa'],
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

  'insegna-notte': {
    scala: 0.9,
    intero: 'insegna-notte',
    riferimento: 'pzkko/art/insegna.webp',
    titolo: 'l’insegna di notte: i tubi al neon dentro le lettere',
    aspetto: '2048x1152',
    prompt: `Recreate the attached sign EXACTLY (same sign box, same framing, same position and size in the frame, same dirt, water stains, rust and the small snail sticker, same five channel letters p z k k o in the same typeface and the same places), centred on ${FONDO} and filling 94% of the image width, but photographed at NIGHT with the sign switched ON:
the white panel is NOT lit (it is a dull grey-white in the dark); the five letters glow from INSIDE: their acrylic faces are translucent and through each face you clearly see the bright neon tube bent to follow the outline of that letter (a glowing warm-white tube running inside the letter a little inside its edge, with a small gap and the dark electrode holders where the tube starts and ends); the face glows softly around the tube, brighter near it; a little light spills from the letters onto the panel around them and onto the metal letter sides. Nothing else is lit. No shadow on the magenta. Photorealistic, sharp. ${NIENTE_MAGENTA}`,
  },

  insegna: {
    scala: 0.9,
    titolo: 'l’insegna «pzkko»: cassonetto bianco retroilluminato con le lettere a scatola',
    aspetto: '2048x1152',
    intero: 'insegna',
    prompt: `The sign box above the doorway of an old Italian department store, photographed straight on (flat, frontal, no perspective), centred on ${FONDO} and filling 94% of the image width; the box is about 2.4 times wider than it is tall.
The sign is a slightly dirty white back-lit acrylic panel in a thin dark grey aluminium frame, with grey water stains, a few splashes of dried mud near the bottom edge and some rust streaks. Mounted on the panel, centred, the word «pzkko» in lowercase, set in a fat rounded geometric 1970s typeface, as three-dimensional channel letters: each letter is a box about 8 cm deep with dark grey anodised metal sides and a flat matte white acrylic face, casting a soft shadow down and to the right onto the panel. Exactly the five letters p, z, k, k, o, nothing else written anywhere. A small round white vinyl sticker with a hand-drawn black snail is stuck on the panel just above the right end of the word. Soft overcast daylight. Photorealistic, sharp. No shadow on the magenta. ${NIENTE_MAGENTA}`,
  },
}
