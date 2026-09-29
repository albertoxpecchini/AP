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

  // ── Terzo giro (29.09.2026): la sezione «Pekko makes websites» ─────────────
  // Gli annunci nuovi nascono nel canvas di Claude Design (tools/assistenza/design):
  // questi fogli danno loro Pekko web designer, le foto stock sui siti e le
  // icone lucide del «Web 2.0».
  'ritagli-c': {
    titolo: 'Pekko web designer a mezzo busto',
    intro: RITAGLI('Every cut-out shows him from the waist up, facing the camera, in a different loud 2008 suit, playing the part of a 2008 web designer in a local-TV commercial.'),
    max: 1000,
    figurine: [
      { nome: 'web-tastiera', soggetto: 'electric-blue suit, orange shirt, pink tie: a beige computer keyboard slung across his body on a strap like a keytar, fingers on the keys, rock-star face' },
      { nome: 'web-monitor', soggetto: 'canary-yellow suit, purple satin shirt, orange-and-blue polka-dot tie: lifting a beige CRT monitor above his head with both arms like a trophy, triumphant' },
      { nome: 'web-indica', soggetto: 'shiny purple suit, lime-green shirt, yellow tie: body turned to the left, pointing with his whole left arm stretched out towards the left edge of the picture, looking at the viewer with an open-mouth “look at this” smile' },
      { nome: 'web-casco', soggetto: 'orange suit, white shirt, thin black tie, a yellow construction hard hat on his head: a bricklayer’s trowel in one hand and a black floppy disk in the other, proud' },
      { nome: 'web-mouse', soggetto: 'lime-green suit, pink shirt: hugging an oversized glossy white computer mouse as big as his chest (the cable dangles), grinning' },
      { nome: 'web-cuffie', soggetto: 'teal suit, white shirt, gold tie, a call-centre headset with a microphone: presenting with his open right palm, customer-service smile' },
      { nome: 'web-sbircia', soggetto: 'red-and-black plaid jacket, turquoise shirt: peeking over the top edge of an open silver laptop that he holds up in front of his chin, eyebrows raised, mischievous' },
      { nome: 'web-lente', soggetto: 'navy pinstripe suit, red shirt, white tie: holding a big magnifying glass in front of his right eye, the eye hugely magnified, detective face' },
      { nome: 'web-evviva', soggetto: 'white suit, black shirt, silver tie: both fists in the air, mouth wide open, celebrating like his website just went online' },
    ],
  },
  'ritagli-d': {
    titolo: 'Pekko a figura intera: surf sulla tastiera, balli per le silhouette',
    intro: RITAGLI('Every cut-out shows him full length, head to shoes, in a different loud 2008 suit with brown or two-tone shoes.'),
    max: 1000,
    figurine: [
      { nome: 'full-surf', soggetto: 'canary-yellow suit, purple shirt: surfing on a long beige computer keyboard used as a surfboard, knees bent, arms out for balance, the keyboard is part of the cut-out' },
      { nome: 'full-ballo-1', soggetto: 'shiny purple suit: dancing, right arm pointing up to the sky, left hand on the hip, one knee bent, disco pose' },
      { nome: 'full-ballo-2', soggetto: 'lime-green suit: dancing, jumping in the air with both knees tucked up and arms spread wide' },
      { nome: 'full-ballo-3', soggetto: 'orange suit: dancing the robot, elbows bent at right angles, stiff, head tilted' },
      { nome: 'full-ballo-4', soggetto: 'teal suit: dancing, sliding sideways on one foot, arms swinging, big smile' },
      { nome: 'full-portatile', soggetto: 'red-and-black plaid jacket, turquoise shirt: sitting cross-legged on the floor with an open silver laptop on his lap, typing, looking up at the camera' },
      { nome: 'full-cantiere', soggetto: 'orange suit and a yellow hard hat: standing next to an orange traffic cone (part of the cut-out), a shovel in one hand, thumbs up with the other' },
      { nome: 'full-freccia', soggetto: 'navy pinstripe suit: leaning with one elbow on a giant white computer mouse-pointer arrow as tall as he is (the arrow is part of the cut-out, flat white with a thick black outline), legs crossed at the ankles, smug' },
      { nome: 'full-valigetta', soggetto: 'white suit, black shirt: walking briskly to the right carrying a black laptop bag, pointing ahead with the other hand, determined' },
    ],
  },
  icone: {
    titolo: 'Icone lucide del «Web 2.0»',
    intro: `A sheet of nine separate glossy icons from a 2007 "Web 2.0" stock icon pack, on a fully transparent background, arranged in a precise 3 × 3 grid: each icon centred in its own cell, filling about 70% of the cell; wide fully transparent gaps, nothing touches, nothing overlaps, the grid itself is not drawn. Every icon is a shiny 3D-rendered object with the 2007 aqua look: saturated candy colours, a big white glossy highlight across the top half, a soft mirror reflection fading below it, a slight drop shadow. No text, no letters, no numbers, no brand logos.
The nine icons, row by row, left to right:`,
    max: 400,
    figurine: [
      { nome: 'ico-globo', soggetto: 'a blue-and-green glossy globe with a white mouse-pointer arrow orbiting around it on a thin ring' },
      { nome: 'ico-pin', soggetto: 'a glossy red map pin, round head, pointing down, with a tiny shadow under the tip' },
      { nome: 'ico-lucchetto', soggetto: 'a glossy golden padlock, closed' },
      { nome: 'ico-lente', soggetto: 'a glossy magnifying glass with a chrome rim and a blue-tinted glass lens' },
      { nome: 'ico-fumetto', soggetto: 'a glossy lime-green speech bubble, empty' },
      { nome: 'ico-busta', soggetto: 'a glossy sky-blue envelope, closed, with a white flap' },
      { nome: 'ico-ingranaggio', soggetto: 'a glossy silver gear wheel with an orange centre' },
      { nome: 'ico-stella', soggetto: 'a glossy yellow five-pointed star with an orange rim' },
      { nome: 'ico-feed', soggetto: 'an orange rounded square with three white broadcast arcs and a dot in the lower-left corner, glossy' },
    ],
  },
  stock3: {
    titolo: 'Foto stock finte per gli annunci dei siti web',
    intro: FOTO_INCORNICIATE('Each photograph looks like a cheap 2008 stock photo. No real people: any faces are generic. No logos, no brand marks, no readable text; computer and phone screens show plain colour or abstract blurred coloured blocks.'),
    max: 900,
    figurine: [
      { nome: 'stock-stretta', soggetto: 'a hand in a suit sleeve reaching out of the screen of a beige CRT monitor to shake the hand of a smiling man sitting at the desk, cheesy fake composite' },
      { nome: 'stock-fieno', soggetto: 'a round hay bale in a golden wheat field at sunset with an open silver laptop balanced on top of it, the screen glowing' },
      { nome: 'stock-nonna', soggetto: 'a delighted grandmother in a cardigan at a kitchen table pointing at the screen of a beige desktop computer with a CRT monitor, flash photo' },
      { nome: 'stock-ingegnere', soggetto: 'a man in a white hard hat and a high-visibility vest on a building site holding a rolled-up blueprint under one arm and an open laptop in the other hand, thumbs up, generic face' },
      { nome: 'stock-campanile', soggetto: 'the brick bell tower of a small Italian village church against a blue sky, with a big white Wi-Fi symbol (three arcs and a dot) floating next to it, obviously pasted in' },
      { nome: 'stock-lumaca-tastiera', soggetto: 'a garden snail crawling slowly across the keys of a beige computer keyboard, macro shot' },
      { nome: 'stock-scrivania', soggetto: 'a messy 2008 web designer desk at night: two CRT monitors covered in coloured sticky notes, a tangle of cables, an energy drink can, a lava lamp, a pile of CDs' },
      { nome: 'stock-mucca-laptop', soggetto: 'a dairy cow in a barn sniffing an open silver laptop that stands on a bale of straw' },
      { nome: 'stock-telefonino', soggetto: 'a hand holding a 2009 touchscreen smartphone that shows a colourful web page made of blurred coloured blocks, over a café table' },
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
  'bg-web': {
    titolo: 'Lo «studio web» di Pekko, vuoto (sezione Websites)',
    aspect: '3:2',
    prompt: `A cheap local-TV commercial set for a 2008 "web design studio", completely empty, no people: a long white desk in the foreground with two beige CRT monitors showing colourful blurred web pages made of coloured blocks, a beige keyboard, a mouse on a mouse pad, a potted plant; behind it a whiteboard with a hand-drawn website wireframe made only of boxes and lines, wood panelling, a small Italian flag on a brass pole on the right, a framed certificate with no readable text. Shot straight on from the front, eye level, harsh flat studio lighting, slightly overexposed. ${FOTO}`,
  },
}

/** Il testo di una voce del foglio, per il prompt. */
export const voce = (x, i) => `${i + 1}. ${x.soggetto}.`
