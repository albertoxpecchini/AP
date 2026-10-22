// I fogli della chat col bot (pzkko/chat/): le icone al posto delle emoji, disegnate da gpt-image-2 come il resto del
// muro (fogli.js li include). I nomi dei pezzi stanno in pzkko/chat/icone.js (FOGLI_CHAT): qui solo i prompt. Stile:
// adesivi da pennarello, contorno nero spesso, colori pieni, leggibili a 32 px; il bot è la chiocciola della banca $pzk
// (quella delle banconote) con gli occhiali da sole, e i mestieri sono lei vestita.

import { FOGLI_CHAT } from '../../pzkko/chat/icone.js'

const STICKER = `They are drawn as flat cartoon STICKERS in ONE consistent style, like the custom emoji set of a Discord bot: bold black outlines of even thickness, simple chunky shapes, bright saturated flat colours with at most one darker flat shade tone per colour, no gradients, no texture, no text or letters anywhere, no background and no drop shadow, each sticker big and centred in its cell, readable even when shrunk to 32 pixels. Slightly hand-drawn, like marker-pen stickers on a wall.`
const LUMACA = `the mascot of the «banca $pzk»: a cute cartoon garden SNAIL with a brown spiral shell (a lighter spiral line on it), a soft green body, two eye stalks with big round eyes, wearing black wayfarer SUNGLASSES across the eye stalks`

const TESTI = {
  'chat-bot': [4, 2, '2048x1152', 'il bot della chat: la chiocciola con gli occhiali da sole in otto umori',
    `All eight are the SAME character, ${LUMACA}, seen from the side with the head on the left, in eight different moods (the sunglasses stay on in every one):`, {
      bot: 'calm and friendly, a small confident smile',
      'bot-ride': 'laughing out loud, mouth wide open, head tilted back, a couple of little laugh lines',
      'bot-arrabbiato': 'furious: red flushed face, eyebrows slanted down over the sunglasses, gritted teeth, a little steam puff',
      'bot-morto': 'dead: lying on its back with the shell on the ground, tongue out, little X marks drawn on the sunglass lenses, a small halo floating above',
      'bot-occhiolino': 'winking: one lens of the sunglasses lifted to show a winking eye, cheeky grin, a thumbs-up gesture with one eye stalk',
      'bot-triste': 'sad: mouth turned down, one big tear running from under the sunglasses, eye stalks drooping',
      'bot-pensa': 'thinking: one eye stalk curled against the chin like a hand, mouth pursed, a small thought bubble with three dots above',
      'bot-ricco': 'rich: the sunglass lenses are gold with a dollar sign on each, a thick gold chain around the neck, a fan of green banknotes held in one eye stalk',
    }],
  'chat-attrezzi': [4, 4, '2048x2048', 'gli attrezzi e le cose del negozio della chat', 'Sixteen objects, each one alone:', {
    canna: 'a fishing rod with the reel and a hook on the line', esca: 'a pink earthworm curled on a fishing hook', fionda: 'a wooden Y slingshot with a red rubber band',
    fucile: 'a double-barrelled hunting shotgun, brown stock, seen from the side', pala: 'a garden shovel with a wooden handle and a bit of dirt on the blade',
    telefono: 'a smartphone seen from the front with a glowing blue screen showing a heart', cornetto: 'an Italian red lucky horn charm (cornetto portafortuna), curved, with a small gold cap and ring',
    caffe: 'a small white espresso cup on a saucer with steam curls', lattina: 'a slim blue and silver energy drink can with a pair of small white wings on it',
    mortadella: 'a thick slice of pink mortadella with white fat dots and green pistachios, on a bit of paper',
    gratta: 'a scratch card: a small colourful ticket with a silver scratch-off panel, half scratched showing a star',
    'cassa-comune': 'a plain wooden crate with a padlock, closed', 'cassa-rara': 'a blue metal chest with silver corners and a big lock, closed, a faint glow',
    'cassa-gonzaga': 'a golden ornate Renaissance treasure chest with red velvet, a crown emblem on the lid, closed, sparkles',
    zaino: 'a green canvas backpack with brown straps and a buckle', sacco: 'a brown cloth money sack tied with a rope, bulging, a coin peeking out',
  }],
  'chat-pesci': [4, 4, '2048x2048', 'quello che si pesca nel Mincio', 'Sixteen things caught in a river, each one alone, the fish seen from the side facing left:', {
    alborella: 'a tiny silver bleak fish, slim', cavedano: 'a chub: a grey-silver fish with big scales and an orange fin', persico: 'a perch: greenish with dark vertical stripes and red fins',
    carpa: 'a fat golden-brown carp with big scales and barbels', luccio: 'a long pike with a duck-bill snout, green with pale spots, sharp teeth',
    pescegatto: 'a brown catfish with long whiskers and a wide flat head', anguilla: 'a long dark eel coiled in an S', gambero: 'a red crayfish with big claws',
    siluro: 'a huge dark grey wels catfish with a giant mouth and whiskers, menacing', scarpa: 'an old wet brown boot with a bit of weed hanging from it',
    'carpa-oro': 'a legendary GOLDEN carp, shining gold with sparkles and a tiny crown', trota: 'a trout: a pink stripe along the side, dark spots',
    tinca: 'a tench: olive green, rounded, a small red eye', lucioperca: 'a zander: elongated, grey with dark bars and a spiky dorsal fin',
    rana: 'a green frog sitting, looking annoyed', bottiglia: 'a crumpled clear plastic water bottle with a blue cap',
  }],
  'chat-animali': [4, 3, '2048x1152', 'quello che si caccia', 'Twelve animals, each one alone, seen from the side:', {
    nutria: 'a nutria (coypu): a chubby brown rodent with big orange front teeth and a long thin tail', piccione: 'a grey city pigeon with an iridescent green neck',
    fagiano: 'a pheasant with a copper body, a green head and a long striped tail', lepre: 'a brown hare with long ears, mid-run', anatra: 'a mallard duck with a green head',
    cinghiale: 'a wild boar, dark brown, with tusks, charging', zanzara: 'a big striped tiger mosquito with a long proboscis',
    drago: 'a river DRAGON: a green scaly serpentine dragon with small wings and water drops, breathing a little fire', volpe: 'an orange fox with a white-tipped bushy tail',
    riccio: 'a hedgehog curled with spikes', cervo: 'a stag with big antlers', cornacchia: 'a black hooded crow with a grey back',
  }],
  'chat-reperti': [4, 3, '2048x1152', 'quello che si scava con la pala', 'Twelve things dug out of the ground, each one alone:', {
    verme: 'a pink earthworm, wriggling', formica: 'three black ants in a line', 'moneta-virgilio': 'an old bronze coin with the laurel-crowned profile of a Roman poet',
    anfora: 'a terracotta Renaissance amphora with two handles, slightly cracked', osso: 'a white bone, cartoon style', bottone: 'a brass military button with an eagle',
    'chiave-vecchia': 'an old rusty iron skeleton key', tappo: 'a crumpled red metal bottle cap', fossile: 'an ammonite fossil spiral in a grey stone',
    tesoro: 'an open small treasure chest overflowing with gold coins and a jewel', radice: 'a gnarled brown tree root with a bit of soil', sasso: 'a plain grey round rock with a bored face drawn on it',
  }],
  'chat-stati': [4, 4, '2048x2048', 'gli stati e le reazioni', 'Sixteen symbols, each one alone:', {
    pzk: 'a shiny green coin with a snail profile embossed on it', eur: 'an amber-orange coin with a big € sign', xp: 'a blue upward arrow inside a circle with a sparkle',
    livello: 'a gold five-point star with a small laurel wreath', clessidra: 'an hourglass with sand running', teschio: 'a white skull with crossbones',
    trofeo: 'a gold trophy cup', regalo: 'a red gift box with a yellow ribbon bow', si: 'a bold green check mark in a circle', no: 'a bold red X in a circle',
    fuoco: 'a flame, orange and yellow', sirena: 'a red rotating police siren light with rays', lucchetto: 'a grey padlock, locked', cuore: 'a red heart',
    banconota: 'a green banknote with little white wings, flying', fulmine: 'a yellow lightning bolt',
  }],
  'chat-slot': [4, 3, '2048x1152', 'i simboli della slot', 'Twelve slot-machine symbols, each one alone, glossy like fruit-machine art:', {
    ciliegia: 'two red cherries on a stem', limone: 'a yellow lemon', sette: 'a big red lucky number 7 (the only numeral allowed: a bold red 7 with a white outline)',
    campana: 'a gold bell', diamante: 'a light-blue cut diamond', 'chiocciola-oro': 'a golden snail shell with sparkles',
    bar: 'a black rectangular block with two white horizontal stripes (no letters)', trifoglio: 'a green four-leaf clover', anguria: 'a slice of watermelon',
    uva: 'a bunch of DARK BLUE grapes (dark blue, not purple)', stella: 'a yellow star', dado: 'a white die showing six',
  }],
  'chat-giochi': [4, 2, '2048x1152', 'i giochi', 'Eight symbols of games, each one alone:', {
    carte: 'two playing cards fanned: one with a black spade symbol and one with a red heart symbol (suit symbols only, no letters)', roulette: 'a small roulette wheel seen from above, red and black pockets, a white ball',
    mina: 'a black round naval mine with spikes and a lit fuse', gemma: 'a green emerald gem', testa: 'a gold coin showing a snail head in profile (heads)',
    croce: 'a gold coin showing a big plus-shaped cross symbol (tails)', dadi: 'two red dice showing five and three', quiz: 'a big yellow question mark on a blue speech bubble',
  }],
  'chat-mestieri': [4, 3, '2048x1152', 'i mestieri: la chiocciola vestita da', `All twelve are the SAME character, ${LUMACA}, dressed for a job (the sunglasses always on):`, {
    rider: 'a food delivery rider: a cycling helmet and a big square delivery backpack', cameriere: 'a waiter at a village festival: a white apron, holding a tray with two plates of ravioli',
    barista: 'a barista: a black apron, holding a steaming espresso cup', bidello: 'a school janitor: a blue work coat and a huge ring of keys',
    salumiere: 'a deli butcher: a white coat and cap, holding a slice of mortadella', tatuatore: 'a tattoo artist: black t-shirt, a tattooed arm, holding a tattoo machine',
    streamer: 'a streamer: a gaming headset with a microphone, holding a game controller', sviluppatore: 'a web developer: a hoodie, a laptop with a glowing screen',
    prof: 'a maths professor: a bow tie, round glasses over the sunglasses, holding a piece of chalk, a small blackboard with a formula-like squiggle (no readable letters)',
    influencer: 'an influencer: a phone on a selfie stick, a trendy bucket hat, a ring light', avvocato: 'a lawyer: a black gown with a white collar, holding a briefcase',
    sindaco: 'a mayor: a green-white-red tricolour sash across the body and a chain of office',
  }],
}

/** I fogli della chat, pronti per FOGLI (fogli.js passa i suoi pezzi di prompt). */
export function fogliChat({ griglia, NIENTE_MAGENTA }) {
  const lista = (nomi, testi) => nomi.map((n, i) => `${i + 1}. «${n}»: ${testi[n] ?? n}`).join(';\n') + '.'
  const out = {}
  for (const [nome, [cols, rows, aspetto, titolo, intro, testi]] of Object.entries(TESTI)) {
    const pezzi = FOGLI_CHAT[nome]
    if (pezzi.length !== cols * rows) throw new Error(`${nome}: ${pezzi.length} pezzi in una griglia ${cols} × ${rows}`)
    for (const p of pezzi) if (!testi[p]) throw new Error(`${nome}: manca il testo di «${p}»`)
    out[nome] = {
      scala: 0.5, titolo, aspetto, griglia: [cols, rows], pezzi,
      prompt: `${griglia(`${pezzi.length} cartoon stickers,`, cols, rows)}\n${STICKER}\n${intro}\n${lista(pezzi, testi)}\n${NIENTE_MAGENTA}`,
    }
  }
  out['chat-cercapersone'] = {
    scala: 0.4, titolo: 'il cercapersone della chat: il tasto sotto il wallet', aspetto: '2048x1152', griglia: [1, 1], pezzi: ['cercapersone'],
    prompt: `${griglia('One piece: a single 1990s pager (beeper),', 1, 1)}
It is a classic black plastic pager seen from DIRECTLY IN FRONT (flat, orthographic), landscape, wide and short (about 2.4 times wider than tall), filling the cell: a rounded rectangular matte black plastic body with a slightly lighter bevelled edge and a few fine scuffs. On the body, a horizontal LCD screen window on the LEFT taking about 60 % of the width and 50 % of the height, inset in a thin dark bezel: the LCD is SWITCHED OFF, a plain pale grey-green (#9fb48a) blank panel with nothing on it. To the right of the screen, two small round grey rubber buttons one above the other, and above them a tiny round LED lens, dark red, off. A small black belt clip visible at the very top edge. Photorealistic product render, soft even light, no text, no logo, no brand. The outline of the pager is the edge of the piece: nothing outside it, no shadow on the magenta. ${NIENTE_MAGENTA}`,
  }
  return out
}
