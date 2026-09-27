// ─────────────────────────────────────────────────────────────────────────────
//  BETTER CALL ALBERTO — gli ingredienti fotografici delle pagine /assistenza/
//  e /contatti/assistenza/, la parodia di un sito americano del 2008 per un
//  «computer guy at law». Tutto di openai/gpt-image-2 su Replicate.
//
//  Seconda versione (27.09.2026): il modello NON disegna più i banner finiti
//  (venivano troppo «AI 2026»). Disegna solo gli ingredienti, in stile foto
//  stock economica del 2008, e i banner li compone annunci.js + rendi.mjs con
//  testo Impact 3D vero, a strati (sfondo fisso, ritagli di Alberto sopra):
//
//    fogli   3 × 3 su fondo trasparente da ritagliare con «ritaglia»:
//            ritagli-a (Alberto a mezzo busto in 9 completi/pose),
//            ritagli-b (Alberto a figura intera), stock (foto stock finte),
//            props (oggetti scontornati), avatar (selfie da webcam 2009);
//            hero-punta è un foglio da una sola figura (griglia 1)
//    spot    sfondi opachi (ufficio vuoto, stampante che esplode, campagna)
//
//  Il volto di Alberto viene dalla fototessera passata come riferimento.
//  I prompt sono in inglese perché il modello li segue meglio.
// ─────────────────────────────────────────────────────────────────────────────

export const RIFERIMENTO = 'public/media/studio/fototessera.webp'

export const PERSONA = `The man is the young man in the attached reference photo: keep his face exactly as it is — same features, same eyebrows, same short dark hair parted in the middle, same skin tone, same ears — so that he is unmistakably the same person in every cut-out.`

// Lo sguardo fotografico comune: foto stock da quattro soldi del 2008.
export const FOTO = `Photographic, like a cheap 2008 stock photo or a local-TV commercial still shot on a consumer digital camera with the on-camera flash: hard flat light, slightly overexposed, slightly soft, a little sensor noise, plain honest colours. NOT an illustration, NOT a 3D render, NOT stylised, no cinematic lighting, no shallow depth of field, no lens flare. No text, no letters, no numbers, no logos anywhere.`

const RITAGLI = (cosa) => `A sheet of nine separate cut-out photographs of the same man on a fully transparent background, arranged in a precise 3 × 3 grid: each cut-out is centred in its own cell and fills about 80% of the cell height; wide fully transparent gaps separate them, nothing touches, nothing overlaps, the grid itself is not drawn. Hard cut-out edges, like a 2008 Photoshop magic-wand selection. ${PERSONA}
${FOTO}
${cosa}
The nine cut-outs, row by row, left to right:`

const OGGETTI = (cosa) => `A sheet of nine separate cut-out photographs on a fully transparent background, arranged in a precise 3 × 3 grid: each one centred in its own cell, filling about 75% of the cell; wide fully transparent gaps, nothing touches, nothing overlaps, the grid itself is not drawn. Hard cut-out edges. ${FOTO}
${cosa}
The nine cut-outs, row by row, left to right:`

const FOTO_INCORNICIATE = (cosa) => `A sheet of nine separate small photographs, each one an opaque rectangle with a 6 px solid black border, on a fully transparent background, arranged in a precise 3 × 3 grid; wide fully transparent gaps separate them, nothing touches, nothing overlaps, the grid itself is not drawn. ${FOTO}
${cosa}
The nine photographs, row by row, left to right:`

export const fogli = {
  'ritagli-a': {
    titolo: 'Alberto a mezzo busto, nove completi e pose',
    intro: RITAGLI('Every cut-out shows him from the waist up, facing the camera, in a different loud 2008 suit.'),
    max: 1000,
    figurine: [
      { nome: 'cut-punta', soggetto: 'canary-yellow jacket, purple satin shirt, orange-and-blue polka-dot tie, red pocket square: pointing straight at the camera with both index fingers, huge salesman grin' },
      { nome: 'cut-pollici', soggetto: 'the same canary-yellow suit: two enthusiastic thumbs up, eyes wide' },
      { nome: 'cut-telefono', soggetto: 'the same canary-yellow suit: holding the handset of a beige corded telephone to his ear (the coiled cord hangs down and is cut off), the other hand beckoning the viewer, mouth open mid-sentence' },
      { nome: 'cut-laptop', soggetto: 'shiny purple jacket, lime-green shirt, yellow tie: hugging a silver laptop to his chest like a treasure, cheek on the lid, delighted' },
      { nome: 'cut-braccia', soggetto: 'lime-green suit, pink shirt, swirly yellow tie: arms crossed, smug closed-mouth smile, one eyebrow raised' },
      { nome: 'cut-cartello', soggetto: 'red-and-black plaid jacket, turquoise shirt, gold tie: holding up a completely blank white cardboard sign with both hands in front of his chest, excited open mouth' },
      { nome: 'cut-boh', soggetto: 'orange jacket, white shirt, thin black tie: shrugging with both palms up, confused pouting face' },
      { nome: 'cut-pistole', soggetto: 'teal jacket, white shirt, wide striped tie: finger guns at the camera, winking, tongue slightly out' },
      { nome: 'cut-stampante', soggetto: 'navy pinstripe suit, red shirt, white tie: cradling a beige inkjet printer in both arms like a baby, looking down at it lovingly' },
    ],
  },
  'ritagli-b': {
    titolo: 'Alberto a figura intera, per sfilata e manifesto',
    intro: RITAGLI('Every cut-out shows him full length, head to shoes, in a different loud 2008 suit with brown or two-tone shoes.'),
    max: 1000,
    figurine: [
      { nome: 'full-sfilata-1', soggetto: 'canary-yellow suit, purple shirt: walking towards the camera like on a catwalk, one hand in the trouser pocket, chin up' },
      { nome: 'full-sfilata-2', soggetto: 'shiny purple suit, lime shirt: standing, adjusting the knot of his yellow tie with both hands, looking at the camera' },
      { nome: 'full-sfilata-3', soggetto: 'lime-green suit, pink shirt: standing with both hands in pockets, looking off to the side, relaxed' },
      { nome: 'full-sfilata-4', soggetto: 'red-and-black plaid jacket, turquoise shirt, gold tie: pointing at the camera with one hand, the other hand on the hip' },
      { nome: 'full-appoggio', soggetto: 'teal suit, white shirt: standing with his left elbow bent and raised as if leaning on a tall object beside him (nothing is drawn there), legs crossed at the ankles, smirking' },
      { nome: 'full-corsa', soggetto: 'orange suit, white shirt: running towards the right with a silver laptop under one arm, panicked happy face' },
      { nome: 'full-sedia', soggetto: 'navy pinstripe suit, red shirt: sitting on a black office swivel chair (the chair is part of the cut-out), legs crossed, a beige telephone handset at his ear, smug' },
      { nome: 'full-presenta', soggetto: 'canary-yellow suit: kneeling on one knee, both hands open presenting something on the floor to his right (nothing is drawn there), game-show smile' },
      { nome: 'full-abbraccio', soggetto: 'white suit, black shirt, silver tie: standing with arms wide open towards the camera, welcoming, big smile' },
    ],
  },
  'hero-punta': {
    titolo: 'Alberto grande che punta il dito (testata e pop-up)',
    griglia: 1,
    aspect: '3:4',
    max: 1400,
    intro: `One single cut-out photograph on a fully transparent background, filling the frame: ${PERSONA}
${FOTO}
Hard cut-out edges like a 2008 Photoshop magic-wand selection.
The cut-out:`,
    figurine: [{ nome: 'hero-punta', soggetto: 'the man from the waist up, in a canary-yellow jacket, purple satin shirt, orange-and-blue polka-dot tie and red pocket square, pointing straight at the camera with his right index finger, left hand on his hip, a huge salesman grin, looking straight into the lens' }],
  },
  stock: {
    titolo: 'Foto stock finte per gli annunci',
    intro: FOTO_INCORNICIATE('Each photograph looks like a cheap 2008 stock photo or a webcam snapshot. No real people: any faces are generic.'),
    max: 900,
    figurine: [
      { nome: 'stock-bimbo', soggetto: 'a toddler with chocolate smeared all over the face, holding a computer mouse, looking guilty, in a kitchen' },
      { nome: 'stock-floppy', soggetto: 'a man’s hand fanning out a thick stack of black 3.5-inch floppy disks like a fan of banknotes, on a plain blue background' },
      { nome: 'stock-urlo', soggetto: 'a low-resolution webcam snapshot of an ecstatic screaming man in his forties with a knitted beanie hat and a baggy green jacket, both arms raised, outdoors in front of a telephone pole, blown-out highlights' },
      { nome: 'stock-hermanos', soggetto: 'two black external hard drives standing side by side wearing tiny straw sombreros, on a red-and-white checked tablecloth' },
      { nome: 'stock-materasso', soggetto: 'a queen-size mattress standing upright in a warehouse with a huge blank yellow price tag hanging from it' },
      { nome: 'stock-salame', soggetto: 'a whole salami hanging on a hook next to a black internet router with green lights, on a wooden shelf' },
      { nome: 'stock-tartaruga', soggetto: 'a small tortoise wearing a tiny yellow construction hard hat, walking across an office desk' },
      { nome: 'stock-lumaca', soggetto: 'a garden snail crawling on top of a brown cardboard parcel with a blank white label' },
      { nome: 'stock-tv', soggetto: 'an old wood-panel CRT television showing a plain bright blue screen, on a TV stand in a 1990s living room' },
    ],
  },
  stock2: {
    titolo: 'Altre foto stock finte: nuove aziende, telefonini del 2009, il portatile morsicato',
    intro: FOTO_INCORNICIATE('Each photograph looks like a cheap 2008 stock photo. No people, no logos, no brand marks, no text.'),
    max: 900,
    figurine: [
      { nome: 'stock-pizza', soggetto: 'a whole pizza margherita on a wooden board with a black 3.5-inch floppy disk lying on top of it like a topping' },
      { nome: 'stock-lettino', soggetto: 'an open tanning bed in a small salon with a beige laptop lying on it wearing tiny plastic sunglasses' },
      { nome: 'stock-mucca', soggetto: 'a dairy cow in a green field wearing a call-centre headset with a microphone, looking straight at the camera' },
      { nome: 'stock-tortellini', soggetto: 'a plate of tortellini in broth on a red checked tablecloth with a grey computer mouse resting on the rim of the plate' },
      { nome: 'stock-scooter', soggetto: 'a red vintage Italian scooter parked on a cobbled street with a large silver satellite dish strapped to the back rack' },
      { nome: 'stock-pesce', soggetto: 'a whole fish on crushed ice at a market stall, wearing plastic sunglasses, next to a small pile of green computer RAM sticks' },
      { nome: 'stock-telefonini', soggetto: 'a pile of about fifteen old 2009 mobile phones on a desk: candy-bar phones, flip phones, a slider phone, one with a full keyboard, all with blank screens and no brand marks' },
      { nome: 'stock-morso', soggetto: 'a glossy white laptop, closed, on a white table, with a big round bite taken out of its front corner and crumbs around it' },
      { nome: 'stock-phon', soggetto: 'a pink hairdryer blowing into an open beige desktop computer case on a hair salon counter, with combs and curlers around it' },
    ],
  },
  props: {
    titolo: 'Oggetti scontornati da spargere ovunque',
    intro: OGGETTI('Objects only, no people, catalogue style with the flash.'),
    max: 800,
    figurine: [
      { nome: 'prop-monitor', soggetto: 'a beige CRT computer monitor, front three-quarter view, screen off' },
      { nome: 'prop-stampante', soggetto: 'a beige inkjet printer, three-quarter view, a blank sheet of paper coming out' },
      { nome: 'prop-floppy', soggetto: 'a single black 3.5-inch floppy disk, front view, blank label' },
      { nome: 'prop-telefono', soggetto: 'a beige corded desk telephone with the handset off the hook lying beside it' },
      { nome: 'prop-tower', soggetto: 'a beige desktop tower PC, front three-quarter view' },
      { nome: 'prop-virus', soggetto: 'a shiny green 3D-rendered cartoon virus germ with an angry face, red eyes and spikes, like 2008 clip art' },
      { nome: 'prop-bilancia', soggetto: 'brass scales of justice with a small silver laptop on one pan and a black floppy disk on the other' },
      { nome: 'prop-furgone', soggetto: 'a plain white delivery van, side view, no writing' },
      { nome: 'prop-coppa', soggetto: 'a golden trophy cup with two handles on a black base' },
    ],
  },
  avatar: {
    titolo: 'Avatar: selfie da webcam del 2009 per i commenti',
    intro: `A sheet of nine separate small square photographs, each one an opaque square with a 4 px solid black border, on a fully transparent background, arranged in a precise 3 × 3 grid; wide fully transparent gaps, nothing touches, nothing overlaps, the grid is not drawn. Each is a low-resolution webcam self-portrait taken in 2009 by an ordinary person (not a real person; any age, gender and ethnicity), in a messy bedroom or office, harsh webcam lighting, blown-out, blurry, JPEG-like. No text anywhere.
The nine photographs, row by row, left to right:`,
    max: 480,
    figurine: [
      { nome: 'avatar-1', soggetto: 'a teenage girl with side-swept bangs making a duck face, peace sign' },
      { nome: 'avatar-2', soggetto: 'a big man in a tank top in a garage, thumbs up, blurry' },
      { nome: 'avatar-3', soggetto: 'an elderly woman with glasses very close to the camera, surprised' },
      { nome: 'avatar-4', soggetto: 'a young man with frosted tips and a shell necklace, squinting' },
      { nome: 'avatar-5', soggetto: 'a grey cat sitting on a keyboard, looking at the camera' },
      { nome: 'avatar-6', soggetto: 'a middle-aged man in a suit at an office desk, stern, slightly out of frame' },
      { nome: 'avatar-7', soggetto: 'a boy in a football shirt with a huge grin and braces' },
      { nome: 'avatar-8', soggetto: 'a goth young woman with black hair and heavy eyeliner, unimpressed' },
      { nome: 'avatar-9', soggetto: 'a bearded man in a bathrobe holding a coffee mug, half asleep' },
    ],
  },
}

// ── Sfondi opachi (una immagine ciascuno) ────────────────────────────────────

export const spot = {
  'bg-ufficio': {
    titolo: 'Il set dell’ufficio, vuoto (sfondo delle GIF e della webcam)',
    aspect: '3:2',
    prompt: `A cheap local-TV commercial set, completely empty, no people: a wooden desk in the foreground with a beige corded telephone and a beige CRT monitor on it; behind it a wall of stacked old beige CRT monitors and inkjet printers, two fake marble columns, a small Italian flag on a brass pole at the right, a framed diploma with no readable text and wood panelling on the back wall. Shot straight on from the front, eye level, harsh flat studio lighting, slightly overexposed, 2008 consumer video-camera softness. ${FOTO}`,
  },
  'bg-esplosione': {
    titolo: 'La stampante che esplode (testata, a sinistra)',
    aspect: '3:2',
    prompt: `An empty asphalt parking lot on an overcast day: a beige inkjet printer exploding in a big orange fireball with thick black smoke, sheets of paper flying everywhere, a beige desktop computer tower tumbling through the air; a cheap 2008 stock-photo composite look, slightly fake, hard edges around the fire, oversaturated flames. No people. ${FOTO}`,
  },
  'bg-campagna': {
    titolo: 'Strada di campagna con il PC sul ciglio (manifesto della colonna destra)',
    aspect: '2:3',
    prompt: `A straight empty country road between flat green fields in the Po valley, Italy, near a river with poplar trees, pale overcast sky, a wooden telephone pole; a beige desktop tower PC with a beige CRT monitor standing alone on the gravel roadside in the lower third of the picture. Cheap 2008 stock-photo look, slightly desaturated, slightly soft. No people. ${FOTO}`,
  },
}

/** Il testo di una voce del foglio, per il prompt. */
export const voce = (x, i) => `${i + 1}. ${x.soggetto}.`
