#!/usr/bin/env node
// TUTTE le icone di pzkko (pzkko/chat/icone.js, FOGLI_CHAT) con retro-diffusion/rd-plus su Replicate: dal 26.10 è il modello
// delle icone per sempre (Alberto: «tieni il modello per sempre… rd-plus + bordo bianco e pochi dettagli che sono piccole»).
// Una predizione per icona, poi ingrandita senza sfumare (nearest) e scritta in pzkko/art/<foglio>/<nome>.webp senza perdite.
// Il PNG del modello resta in tools/pzkko/lavoro/pixel/<nome>.png.
//
//   node tools/pzkko/pixel.mjs                          tutte (sono quasi 200: un quarto d'ora, a quattro alla volta)
//   node tools/pzkko/pixel.mjs app-profilo carpa …      solo quelle
//   node tools/pzkko/pixel.mjs --foglio=chat-pesci      un foglio
//   node tools/pzkko/pixel.mjs --rifai [nome…]          senza Replicate: rielabora i PNG già scaricati in lavoro/pixel/
//   node tools/pzkko/pixel.mjs --candidati=4 nome…      quattro versioni per icona e un foglio per confrontarle
//                                                         (lavoro/pixel/candidati/foglio.png): niente va nel sito
//   node tools/pzkko/pixel.mjs --scegli nome:2 …        mette nel sito la versione scelta (se non è tagliata)
//   node tools/pzkko/pixel.mjs --controlla              elenca le icone tagliate (che toccano il bordo del riquadro)
// REGOLA (Alberto, 26.10: «le immagini non possono essere tagliate»): un disegno che tocca il bordo del riquadro del
// modello è tagliato e non va MAI nel sito: si rigenera (fino a cinque volte) e, se resta tagliato, non si scrive.
// Il modello non è sempre pulito (un pezzo di fumetto rimasto, un simbolo tagliato): per le piastrelle si guardano i
// candidati e si sceglie, e isole() toglie da ogni disegno i frammenti piccoli staccati dal resto.
//
// Tre tipi: le piastrelle delle app (APP), gli oggetti e i personaggi delle icone (OGG: piccoli, pochi dettagli) e gli
// avatar del profilo (AV, i soli senza bordo). APP e OGG prendono il bordo bianco di carta degli adesivi, NEL DISEGNO (non
// nel CSS): adesivo() allarga la sagoma di qualche pixel, la riempie di bianco e taglia al riquadro di quello che si vede.
// I prompt delle icone di prima vengono dalle descrizioni di tools/pzkko/fogli-chat.js (TESTI, quelle dei fogli di
// gpt-image-2): un'icona nuova si aggiunge in icone.js e qui (o là, in TESTI).
import sharp from 'sharp'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ROOT, api } from '../replicate.mjs'
import { DOVE } from '../../pzkko/chat/icone.js'
import { TESTI } from './fogli-chat.js'

const MODELLO = 'retro-diffusion/rd-plus'
/** Una predizione di rd-plus, riprovata fino a tre volte (capita «inference_failed»: prima fermava tutto il lotto). → gli URL */
async function genera(input) {
  for (let prova = 1; ; prova++) {
    try {
      let p = await api(`/models/${MODELLO}/predictions`, { method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'wait=60' }, body: JSON.stringify({ input }) })
      while (!['succeeded', 'failed', 'canceled'].includes(p.status)) { await new Promise((ok) => setTimeout(ok, 2500)); p = await api(p.urls.get) }
      if (p.status !== 'succeeded') throw new Error(`${p.status}: ${String(p.error ?? '').slice(0, 120)}`)
      return [p.output].flat()
    } catch (e) {
      if (prova === 3) throw e
      await new Promise((ok) => setTimeout(ok, (e.status === 429 ? 8000 : 3000) * prova))
    }
  }
}
const LAVORO = join(ROOT, 'tools/pzkko/lavoro/pixel')

// le piastrelle delle app: il modello disegna solo il SIMBOLO (piccolo, senza fondo); la piastrella la disegna piastrella()
// qui, a pixel, uguale per tutte (il modello la faceva ogni volta diversa: su fondo nero, bianco, senza). adesivo: il bordo
// bianco, in pixel del disegno
const APP = { style: 'default', lato: 40, per: 3, fondo: true, adesivo: 2, piastrella: 64 }
// le icone: piccole (si vedono alte una riga di testo, o 34–44 px), quindi disegnate piccole, con pochi pixel
const OGG = { style: 'default', lato: 64, per: 3, fondo: true, adesivo: 2 }
// gli avatar: mezzo busto, di fronte, senza fondo
const AV = { style: 'default', lato: 128, per: 2, fondo: true }
// i colori delle piastrelle (quelli dei fogli di gpt-image-2, per nome)
const COLORI = { green: '#45a63a', 'grass green': '#3fae4a', 'olive green': '#6f7d32', 'dark green': '#1f6b3a', orange: '#f08a24', yellow: '#ffcf2e', blue: '#2f7de1', 'royal blue': '#2856c8', 'brown leather': '#8a5a32', purple: '#8b4fd1', 'dark purple': '#4b2a7a', teal: '#1d9a8f', black: '#1e2120', red: '#d33a2c' }
/** «green tile; the snail…» → [simbolo, colore]. */
const tile = (s) => { const [c, sim] = s.split(/\s*tile;\s*/); if (!sim || !COLORI[c]) throw new Error(`piastrella senza colore: ${s}`); return [poco(sim), COLORI[c]] }
const busto = (s) => `head and shoulders portrait avatar facing the viewer, centered, ${s}`
// (26.10: «tagliato» era il difetto più comune: il modello disegnava il soggetto più grande del riquadro; e le ombre a metà)
const poco = (s) => `${s}, simple pixel art icon, one single subject centered, bold dark outline, flat colors, very few details, readable when tiny, the whole subject fully inside the frame with empty space all around it, nothing cut off at the edges, no cast shadow`
const LUMACHINA = 'a cute cartoon snail with a brown spiral shell, green body and black sunglasses'

const ICONE = {
  'app-profilo': [APP, ...tile('purple tile; a small ID card with the portrait of a snail wearing black sunglasses')],
  // quelle dei fogli che il modello sbagliava (il fumetto veniva una macchia bianca)
  'app-chat': [APP, ...tile('green tile; a white speech bubble with three black dots')],
  'app-home': [APP, ...tile('black tile; one thick bright green spiral line coiling inward, like the shell of a snail seen from the side')],
  // le icone che dalle descrizioni dei fogli venivano sbagliate (il bot morto o arrabbiato uguale al bot, il tatuatore un
  // uomo, il manuale un trattore, i pesci lunghi irriconoscibili): un prompt più diretto
  'bot-arrabbiato': [OGG, poco('a furious cartoon snail with a brown shell and black sunglasses, red angry face, gritted teeth, steam puffs above its head')],
  formica: [OGG, poco('one single big black ant seen from the side, six legs')],
  siluro: [OGG, poco('a big dark grey wels catfish with very long whiskers, seen from the side')],
  anguilla: [OGG, poco('a long slim brown eel fish curved in an S shape, seen from the side')],
  'manuale-landini': [OGG, poco('a worn cream paperback booklet with a small red tractor drawn on its cover')],
  // rifatte il 26.10 (Alberto: tagliate, ombre a metà, il soggetto sbagliato): prompt più stretti
  'frutti-bosco': [OGG, poco('a small square cardboard punnet filled with blueberries, strawberries and raspberries, the whole punnet visible')],
  tortelli: [OGG, poco('a small round white plate with a few yellow square stuffed pasta tortelli and two green sage leaves, the whole plate visible')],
  pala: [OGG, poco('a small garden shovel with a short wooden handle, drawn diagonally, the whole shovel visible from handle to blade')],
  fucile: [OGG, poco('a short double-barrelled hunting shotgun with a brown wooden stock, seen from the side, drawn diagonally, the whole gun visible')],
  // (26.10: il modello la disegnava già tagliata, coi bordi dritti in alto e a destra: tutti e quattro gli angoli, interi)
  gratta: [OGG, poco('a small upright rectangular red lottery scratch card, completely whole with all four rounded corners and all four edges visible, a silver scratch-off panel with a gold star peeking out, front view, drawn small in the middle of the image with lots of empty space around it')],
  // (il modello disegnava sempre una Vespa: si descrive come una bicicletta col motorino, senza scudo)
  'ciao-px': [OGG, poco('a 1970s Italian moped that looks like a bicycle with a tiny engine: bicycle pedals and chain, a thin tubular frame, two big thin wire spoked wheels, a small saddle, a little luggage rack, light blue, side view, no leg shield, not a scooter')],
  landini: [OGG, poco('a small old 1950s Italian farm tractor seen from the side, painted grey, with a big round front nose (hot-bulb engine), big rear wheels and small front wheels, no cabin')],
  tombino: [OGG, poco('a perfectly round cast iron manhole cover seen from directly above, a circle with raised relief ribs and small studs, dark grey metal')],
  petizione: [OGG, poco('a clipboard with a sheet of lined paper and a ballpoint pen hanging on a string, drawn small in the middle of the image with lots of empty space around it')],
  portachiavi: [OGG, poco('a small black rounded keyring gadget with a metal key ring on top and one big button with a small green glowing display, the whole object visible')],
  // (26.10: rd-plus non sa scrivere, il 28 veniva «X8»): la targa la disegna vuota, il civico lo scrive targa()
  citofono: [OGG, poco('a door intercom panel of brushed grey metal seen straight from the front, flat, no sides visible, a speaker grille with horizontal slots at the top, one round brass button in the middle and below it a small blank cream name plate with nothing written on it, drawn small in the middle of the image with lots of empty space around it'), undefined, { numero: '28' }],
  // (26.10: veniva una torta soffice a fette; la sbrisolona è bassa, a briciole, con le mandorle intere, rotta a pezzi)
  sbrisolona: [OGG, poco('a flat round crumbly golden-yellow Italian almond cake (torta sbrisolona) made of coarse crumbs, with whole brown almonds on top, broken into a few rough irregular pieces with crumbs around, on a small round wooden board')],
  // (26.10: la coda staccata e niente di leggendario) la carpa d'oro dei Gonzaga: intera, d'oro, con la corona
  'carpa-oro': [OGG, poco('a legendary shining golden carp fish seen from the side, wearing a tiny red and gold ducal crown, a few sparkles, drawn small in the middle of the image with lots of empty space around it, tail fin fully visible')],
  // (un pesce lungo in un quadrato tocca sempre i lati: in diagonale)
  luccio: [OGG, poco('a small green northern pike fish drawn diagonally, pointed snout, the whole fish visible from head to tail fin')],
  osso: [OGG, poco('a single white cartoon dog bone with two rounded ends, drawn diagonally, the whole bone visible')],
  'chiave-vecchia': [OGG, poco('an old rusty iron skeleton key drawn diagonally, the whole key visible: the round ring bow, the long shaft and the teeth')],
  verme: [OGG, poco('a cute small pink earthworm curled in an S shape, simple and clean, the whole worm visible')],
  sasso: [OGG, poco('a plain smooth grey pebble stone, rounded, no face, the whole stone visible')],
  neon: [OGG, poco('a glowing blue neon tube sign shaped like a cartoon snail with a spiral shell, bright clean glowing lines')],
  // (tagliati in alto: le corna, il tubo, l'arco) più corti, più piccoli
  cervo: [OGG, poco('a small brown deer stag standing, seen from the side, with small short antlers, the whole animal and the antlers visible, drawn small in the middle of the image with lots of empty space around it')],
  stufa: [OGG, poco('a small squat black cast-iron wood stove with a glowing fire window and a very short pipe stub on top, the whole stove visible, drawn small in the middle of the image with lots of empty space around it')],
  lucchettone: [OGG, poco('a small heavy brass padlock with a short thick shackle, closed, the whole padlock and shackle visible, drawn small in the middle of the image with lots of empty space around it')],
  // l'economia (26.10): le app, i mestieri nuovi (la lumachina vestita), la roba degli uffici
  'app-rapina': [APP, ...tile('dark purple tile; a small black cartoon eye mask with two eye holes')],
  'app-lavatrice': [APP, ...tile('teal tile; a front-loading washing machine with green banknotes spinning in the round window')],
  'app-decifratore': [APP, ...tile('black tile; a green open padlock over a glowing green circuit pattern')],
  imbianchino: [OGG, poco(`a house painter in white overalls and a paper hat holding a paint roller, the character is ${LUMACHINA}`)],
  pizzaiolo: [OGG, poco(`a pizza chef in a white hat holding a pizza on a wooden peel, the character is ${LUMACHINA}`)],
  meccanico: [OGG, poco(`a mechanic in blue overalls holding a big wrench, a smudge of oil, the character is ${LUMACHINA}`)],
  bagnino: [OGG, poco(`a lifeguard with a red tank top, a whistle and a red rescue float, the character is ${LUMACHINA}`)],
  spazzino: [OGG, poco(`${LUMACHINA}, wearing a grey cleaner cap, holding a big yellow broom, next to a small grey trash bin on wheels`)],
  corriere: [OGG, poco(`a night courier in a black hoodie carrying a brown parcel, looking around suspiciously, the character is ${LUMACHINA}`)],
  biscazziere: [OGG, poco(`a gambling den dealer with a green visor and a bow tie, holding playing cards, the character is ${LUMACHINA}`)],
  contrabbandiere: [OGG, poco(`a smuggler in a long trench coat opened to show yellow stuffed pasta tortelli hidden inside, the character is ${LUMACHINA}`)],
  cartaccia: [OGG, poco('a crumpled ball of white paper')],
  'lattina-vuota': [OGG, poco('an empty crushed red soda can')],
  graffette: [OGG, poco('a small open box of silver paper clips')],
  tazza: [OGG, poco('a white office coffee mug with a small red crown drawn on it')],
  mouse: [OGG, poco('a black wireless computer mouse')],
  cuffie: [OGG, poco('a black headset with a microphone')],
  orologio: [OGG, poco('a gold wristwatch with a brown leather strap')],
  chiavetta: [OGG, poco('a small blue usb flash drive stick with a tiny glowing light')],
  'wallet-pzk': [OGG, poco('a small black hardware crypto wallet device with a tiny screen showing a padlock and a gold coin symbol')],
  // (26.10 sera) il bot, la faccia di tutto: gli occhiali erano finiti sul guscio e la testa non si vedeva
  bot: [OGG, poco('a cute cartoon snail seen from the side: on the left its green head with two eye stalks and a friendly smile, wearing black sunglasses ON ITS FACE, behind it a big brown spiral shell on its back, green body underneath')],
  'bot-ricco': [OGG, poco('a rich cartoon snail seen from the side: on the left its green head with two eye stalks and a big grin, wearing gold sunglasses with dollar signs ON ITS FACE, a thick gold chain around its neck, a fan of green banknotes, a big brown spiral shell on its back')],
  // (26.10 sera) guardate una per una e trovate difettose (tagliate dentro il disegno, sdoppiate, senza il mestiere): prompt nuovi
  'bot-morto': [OGG, poco('a cartoon snail ghost: a pale white translucent snail with a brown shell, black sunglasses with white X marks on the lenses, a small golden halo floating above its head')],
  telefono: [OGG, poco('one single smartphone seen straight from the front, a glowing blue screen with a small pink heart, only one phone, nothing behind it')],
  volpe: [OGG, poco('an orange fox sitting, seen from the side, with a big fluffy tail with a white tip, the whole fox visible from the ears to the tail')],
  tappo: [OGG, poco('a red metal bottle crown cap with crimped zigzag edges, seen from above at an angle')],
  banconota: [OGG, poco('one single flat green banknote with a small snail drawn in the middle, a simple rectangle with all four corners visible')],
  fossile: [OGG, poco('a round brown ammonite fossil with a spiral shell pattern, carved in stone, one single object')],
  'penne-bic': [OGG, poco('three blue bic ballpoint pens lying side by side, held together by one short strip of clear scotch tape around their middle')],
  'iphone-duo': [OGG, poco('a foldable smartphone opened flat like a book: two glowing screens side by side joined by a thin hinge in the middle, silver frame')],
  peluche: [OGG, poco('a cute plush toy snail made of soft fabric with visible stitches, a brown shell and black sunglasses, the whole toy visible from head to tail')],
  'app-chiudi': [APP, ...tile('black tile; a small thick bright red X')],
  'luccio-salsa': [OGG, poco('a round white plate seen from above at an angle, with a fish fillet covered in green parsley sauce in the middle, the whole round plate visible')],
  // (il mestiere prima della lumachina, se no il modello disegna solo la lumachina)
  tatuatore: [OGG, poco('a cartoon snail with a brown shell and black sunglasses wearing a black bandana, next to a big silver tattoo machine with a needle and a small red heart tattoo drawn on its shell')],
  sindaco: [OGG, poco('an Italian mayor character: a cartoon snail with a brown shell and black sunglasses wearing a wide diagonal sash with green, white and red stripes across its body and a big gold medal on a chain around its neck')],
  // la cucina del Mincio (telefono/app/cucina.js)
  farina: [OGG, poco('a small paper sack of white flour, a little flour spilling out')],
  uova: [OGG, poco('two white eggs')],
  burro: [OGG, poco('a yellow block of butter on a piece of paper')],
  mandorle: [OGG, poco('three brown almonds')],
  riso: [OGG, poco('a small cloth bag full of white rice grains')],
  salamella: [OGG, poco('a short pink italian pork sausage')],
  amaretti: [OGG, poco('two round brown amaretti cookies with sugar crystals')],
  parmigiano: [OGG, poco('a wedge of parmesan cheese with its rind')],
  prezzemolo: [OGG, poco('a bunch of fresh green parsley')],
  coltello: [OGG, poco('a kitchen knife with a wooden handle')],
  mattarello: [OGG, poco('a long wooden rolling pin')],
  mestolo: [OGG, poco('a wooden cooking spoon')],
  pentola: [OGG, poco('a steel cooking pot with boiling water and steam')],
  forno: [OGG, poco('a small retro kitchen oven with an orange glowing window')],
  risotto: [OGG, poco('a white plate of creamy risotto with pieces of sausage on top')],
  // il modello disegna le frecce sempre verso destra: si chiede quella e la si specchia (la quarta voce: le opzioni)
  'app-indietro': [APP, ...tile('black tile; a thick bright green arrow pointing to the right'), { specchio: true }],
  'app-account': [APP, ...tile('royal blue tile; a golden key over an open silver padlock')],
  'app-conversioni': [APP, ...tile('teal tile; two white circular arrows around a black microchip')],
  'app-calcolatrice': [APP, ...tile('orange tile; a grey scientific calculator next to a small surveyor tripod')],
  'app-compilatore': [APP, ...tile('black tile; a retro computer monitor showing a big bright green letter C')],
  'app-cucina': [APP, ...tile('red tile; a steaming cooking pot with yellow stuffed pasta')],
  'av-nutria': [AV, busto('a coypu nutria with big orange front teeth, brown wet fur, small gold chain')],
  'av-carpa': [AV, busto('a golden orange carp fish with round open mouth, wearing a bucket hat')],
  'av-virgilio': [AV, busto('white marble bust of the roman poet Virgil with laurel wreath, wearing black sunglasses')],
  'av-rana': [AV, busto('a bright green frog with huge eyes and wide grin, red bandana')],
  'av-piccione': [AV, busto('a grey city pigeon with iridescent green purple neck, mean squint')],
  'av-zanzara': [AV, busto('a cartoon mosquito with long needle nose, striped body, tiny red boxing gloves')],
  'av-zucca': [AV, busto('a round orange pumpkin with a carved happy face and a green stem')],
  'av-gatto': [AV, busto('a black and white alley cat with a torn ear and a toothpick in its mouth')],
  'av-gonzaga': [AV, busto('a renaissance italian duke with red velvet cap, short beard, gold collar, black sunglasses')],
  'av-tortello': [AV, busto('a cute yellow stuffed pasta tortello character with a smiling face and little arms')],
  'av-pager': [AV, busto('a black 1990s pager with a cute smiling face on its green lcd screen, small red led on top')],
  'av-nonna': [AV, busto('an italian grandma with grey hair bun, round glasses, flowered apron, holding a rolling pin')],
  // la miniera: prima disegnata in codice (tools/pzkko/miniera-icona.mjs), ora come le altre
  'app-miniera': [APP, ...tile('dark purple tile; a computer monitor with a green rising chart and a gold coin')],
}
// tutte le altre: le descrizioni dei fogli di gpt-image-2 (i personaggi del bot e dei mestieri sono la stessa lumachina)
for (const [foglio, [, , , , intro, testi]] of Object.entries(TESTI)) {
  const lumaca = intro.includes('SAME character'), mestiere = intro.includes('dressed for a job')
  for (const [n, d] of Object.entries(testi)) ICONE[n] ??= foglio.startsWith('chat-app') ? [APP, ...tile(d)]
    : [OGG, poco(mestiere ? `${d}, the character is ${LUMACHINA}` : lumaca ? `${LUMACHINA}, ${d}` : d)] // il mestiere prima: se no il modello disegna solo la lumachina
}

/** Le piastrelle arrivano su fondo chiaro: il chiaro attaccato al bordo (gli angoli fuori dalla piastrella) diventa trasparente. */
function bucaBordo(d, w, h) {
  const chiaro = (i) => d[i] > 215 && d[i + 1] > 215 && d[i + 2] > 215 && d[i + 3] > 0
  const coda = []
  for (let x = 0; x < w; x++) coda.push(x, (h - 1) * w + x)
  for (let y = 0; y < h; y++) coda.push(y * w, y * w + w - 1)
  while (coda.length) {
    const p = coda.pop(), i = p * 4
    if (!chiaro(i)) continue
    d[i + 3] = 0
    const x = p % w, y = (p - x) / w
    if (x > 0) coda.push(p - 1)
    if (x < w - 1) coda.push(p + 1)
    if (y > 0) coda.push(p - w)
    if (y < h - 1) coda.push(p + w)
  }
}

/** Il bordo bianco dell'adesivo sotto la piastrella, poi il taglio al riquadro di quello che si vede. */
function adesivo(d, w, h, r) {
  const W = w + 2 * r, H = h + 2 * r, o = Buffer.alloc(W * H * 4)
  const pieno = (x, y) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 128
  let x0 = W, y0 = H, x1 = -1, y1 = -1
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4, sx = x - r, sy = y - r
    if (pieno(sx, sy)) { d.copy(o, i, (sy * w + sx) * 4, (sy * w + sx) * 4 + 3); o[i + 3] = 255 }
    else {
      let vicino = false
      for (let dy = -r; dy <= r && !vicino; dy++) for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r + r && pieno(sx + dx, sy + dy)) { vicino = true; break }
      if (!vicino) continue
      o.fill(255, i, i + 4)
    }
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y)
  }
  return { o, W, H, taglio: { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 } }
}

/** La piastrella a pixel (lato L): un quadrato arrotondato col bordo nero, il colore, la luce in alto a sinistra e l'ombra in
 *  basso a destra come un tasto; il simbolo (tagliato a quello che si vede) in mezzo, senza ridimensionarlo. */
function piastrella(d, w, h, colore, L) {
  const rgb = colore.match(/\w\w/g).map((x) => parseInt(x, 16)), mix = (k, v) => rgb.map((c) => Math.round(c + (v - c) * k))
  const o = Buffer.alloc(L * L * 4), R = 11
  const dentro = (x, y, m) => { const a = R - m, cx = Math.min(Math.max(x, m + a), L - 1 - m - a), cy = Math.min(Math.max(y, m + a), L - 1 - m - a); return x >= m && y >= m && x <= L - 1 - m && y <= L - 1 - m && (x - cx) ** 2 + (y - cy) ** 2 <= a * a + a }
  for (let y = 0; y < L; y++) for (let x = 0; x < L; x++) {
    if (!dentro(x, y, 0)) continue
    const i = (y * L + x) * 4
    const c = !dentro(x, y, 3) ? [17, 17, 17] : !dentro(x, y, 5) ? (x + y < L ? mix(0.35, 255) : mix(0.3, 0)) : rgb
    o[i] = c[0]; o[i + 1] = c[1]; o[i + 2] = c[2]; o[i + 3] = 255
  }
  let x0 = w, y0 = h, x1 = -1, y1 = -1
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 128) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y) }
  const sw = x1 - x0 + 1, sh = y1 - y0 + 1, ox = Math.round((L - sw) / 2) - x0, oy = Math.round((L - sh) / 2) - y0
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const s = (y * w + x) * 4, X = x + ox, Y = y + oy
    if (d[s + 3] <= 128 || X < 5 || Y < 5 || X > L - 6 || Y > L - 6) continue
    d.copy(o, (Y * L + X) * 4, s, s + 3); o[(Y * L + X) * 4 + 3] = 255
  }
  return o
}

/** Via i frammenti staccati: si tengono solo le macchie (pixel pieni, a 8 vicini) grandi almeno un ventesimo della più grande. */
function isole(d, w, h) {
  const id = new Int32Array(w * h).fill(-1), dim = []
  for (let p = 0; p < w * h; p++) {
    if (id[p] >= 0 || d[p * 4 + 3] <= 128) continue
    const k = dim.length, coda = [p]; id[p] = k; let n = 0
    while (coda.length) {
      const q = coda.pop(); n++
      const x = q % w, y = (q - x) / w
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const X = x + dx, Y = y + dy, v = Y * w + X
        if (X < 0 || Y < 0 || X >= w || Y >= h || id[v] >= 0 || d[v * 4 + 3] <= 128) continue
        id[v] = k; coda.push(v)
      }
    }
    dim.push(n)
  }
  const soglia = Math.max(...dim, 0) / 20
  for (let p = 0; p < w * h; p++) if (id[p] >= 0 && dim[id[p]] < soglia) d[p * 4 + 3] = 0
}

// le cifre a pixel, 3 × 5 (# pieno), per i numeri che il modello non sa scrivere
const CIFRE = { 0: '###/#.#/#.#/#.#/###', 1: '.#./##./.#./.#./###', 2: '###/..#/###/#../###', 3: '###/..#/.##/..#/###', 4: '#.#/#.#/###/..#/..#', 5: '###/#../###/..#/###', 6: '###/#../###/#.#/###', 7: '###/..#/..#/.#./.#.', 8: '###/#.#/###/#.#/###', 9: '###/#.#/###/..#/###' }
/** La targa vuota (la macchia chiara più grande che riempie il suo rettangolo e ci sta il numero), ripulita, col numero
 *  scuro in mezzo. → false se non c'è (il disegno si scarta come uno tagliato) */
function targa(d, w, h, numero) {
  const chiaro = (p) => d[p * 4 + 3] > 128 && d[p * 4] * 0.3 + d[p * 4 + 1] * 0.59 + d[p * 4 + 2] * 0.11 > 165
  const visto = new Uint8Array(w * h), NW = numero.length * 4 - 1
  let meglio = null
  for (let p = 0; p < w * h; p++) {
    if (visto[p] || !chiaro(p)) continue
    const coda = [p], tutti = []; visto[p] = 1
    let x0 = w, y0 = h, x1 = -1, y1 = -1
    while (coda.length) {
      const q = coda.pop(), x = q % w, y = (q - x) / w
      tutti.push(q); x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y)
      for (const v of [x > 0 && q - 1, x < w - 1 && q + 1, y > 0 && q - w, y < h - 1 && q + w]) if (v !== false && !visto[v] && chiaro(v)) { visto[v] = 1; coda.push(v) }
    }
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1
    if (bw >= NW + 2 && bh >= 5 && tutti.length >= 0.6 * bw * bh && tutti.length > (meglio?.tutti.length ?? 0)) meglio = { tutti, x0, y0, bw, bh }
  }
  if (!meglio) return false
  // il colore della targa: la media della macchia, stesa su tutto il rettangolo (via i graffi e le lettere a metà)
  const c = [0, 1, 2].map((k) => Math.round(meglio.tutti.reduce((s, q) => s + d[q * 4 + k], 0) / meglio.tutti.length))
  for (let y = meglio.y0; y < meglio.y0 + meglio.bh; y++) for (let x = meglio.x0; x < meglio.x0 + meglio.bw; x++) { const i = (y * w + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255 }
  const ox = meglio.x0 + Math.floor((meglio.bw - NW) / 2), oy = meglio.y0 + Math.floor((meglio.bh - 5) / 2)
  for (const [k, n] of [...numero].entries()) for (const [y, riga] of CIFRE[n].split('/').entries()) for (const [x, s] of [...riga].entries()) {
    if (s !== '#') continue
    const i = ((oy + y) * w + ox + k * 4 + x) * 4; d[i] = 24; d[i + 1] = 22; d[i + 2] = 20; d[i + 3] = 255
  }
  return true
}
/** L'icona vuole un numero: il disegno ha la targa vuota dove scriverlo? (le altre sì sempre) */
async function haTarga(png, n) {
  const numero = ICONE[n][3]?.numero
  if (!numero) return true
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return targa(data, info.width, info.height, numero)
}

/** Il disegno tocca il bordo del riquadro? Allora il modello l'ha tagliato: si scarta (sul fondo bianco, prima si buca). */
async function tocca(png, o) {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  if (!o.fondo) bucaBordo(data, info.width, info.height)
  const { width: w, height: h } = info, pieno = (x, y) => data[(y * w + x) * 4 + 3] > 128
  let n = 0
  for (let i = 0; i < w; i++) n += pieno(i, 0) + pieno(i, h - 1)
  for (let j = 1; j < h - 1; j++) n += pieno(0, j) + pieno(w - 1, j)
  return n > 2
}

/** Dal PNG del modello all'icona: fondo bucato, il bordo dell'adesivo (le piastrelle), ×per senza sfumare, webp senza perdite. */
async function lavora(n, png, out = null) {
  const [o] = ICONE[n]
  const dir = join(ROOT, 'pzkko/art', DOVE[n])
  await mkdir(dir, { recursive: true })
  const { data, info } = await sharp(png).rotate(ICONE[n][3]?.ruota ?? 0).flop(!!ICONE[n][3]?.specchio).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  if (!o.fondo) bucaBordo(data, info.width, info.height) // su fondo bianco: il bianco attaccato al bordo va via
  const numero = ICONE[n][3]?.numero
  if (numero && !targa(data, info.width, info.height, numero)) throw new Error(`${n}: niente targa vuota dove scrivere ${numero}`)
  if (o.adesivo) isole(data, info.width, info.height)
  let img = sharp(data, { raw: info }), w = info.width, h = info.height, px = data
  if (o.piastrella) { px = piastrella(data, w, h, ICONE[n][2], o.piastrella); w = h = o.piastrella }
  if (o.adesivo) {
    const a = adesivo(px, w, h, o.adesivo)
    img = sharp(a.o, { raw: { width: a.W, height: a.H, channels: 4 } }).extract(a.taglio)
    img = sharp(await img.raw().toBuffer(), { raw: { width: a.taglio.width, height: a.taglio.height, channels: 4 } })
    w = a.taglio.width; h = a.taglio.height
  }
  await img.resize(w * o.per, h * o.per, { kernel: 'nearest' }).webp({ lossless: true }).toFile(out ?? join(dir, `${n}.webp`))
  if (!out) console.log(`✓ art/${DOVE[n]}/${n}.webp (${w * o.per} × ${h * o.per})`)
}

/** Le misure delle icone fatte in pzkko/art/pezzi.json (l'anagrafe dei pezzi, come fa immagini.mjs). */
async function misure(nomi) {
  const f = join(ROOT, 'pzkko/art/pezzi.json'), p = JSON.parse(await readFile(f, 'utf8'))
  for (const n of nomi) { const m = await sharp(join(ROOT, 'pzkko/art', DOVE[n], `${n}.webp`)).metadata().catch(() => null); if (m) (p[DOVE[n]] ??= {})[n] = { w: m.width, h: m.height } }
  await writeFile(f, JSON.stringify(p, null, 1) + '\n')
}

if (process.argv.includes('--controlla')) {
  const tagliate = []
  for (const n of Object.keys(ICONE).filter((x) => DOVE[x] && ICONE[x][0] !== AV)) {
    const png = await readFile(join(LAVORO, `${n}.png`)).catch(() => null)
    if (png && (await tocca(png, ICONE[n][0]))) tagliate.push(n)
  }
  console.log(tagliate.length ? `tagliate (${tagliate.length}): ${tagliate.join(' ')}` : 'nessuna tagliata')
  process.exit(0)
}

const rifai = process.argv.includes('--rifai')
const candidati = Number((process.argv.find((a) => a.startsWith('--candidati=')) ?? '').slice(12)) || 0
const CAND = join(LAVORO, 'candidati')
if (process.argv.includes('--scegli')) {
  for (const a of process.argv.slice(2).filter((x) => x.includes(':'))) {
    const [n, k] = a.split(':')
    const png = await readFile(join(CAND, `${n}-${k}.png`))
    if (await tocca(png, ICONE[n][0])) { console.error(`✗ ${n}:${k} è tagliata (tocca il bordo): scegline un'altra`); continue }
    await writeFile(join(LAVORO, `${n}.png`), png)
    await lavora(n, png)
  }
  await misure(process.argv.slice(2).filter((x) => x.includes(':')).map((x) => x.split(':')[0]))
  process.exit(0)
}
const foglio = (process.argv.find((a) => a.startsWith('--foglio=')) ?? '').slice(9)
const chiesti = process.argv.slice(2).filter((a) => !a.startsWith('--') && !a.includes(':'))
const quali = chiesti.length ? chiesti : Object.keys(ICONE).filter((n) => !foglio || DOVE[n] === foglio)
for (const n of quali) if (!ICONE[n] || !DOVE[n]) { console.error(`✗ «${n}» non c'è (qui o in icone.js)`); process.exit(1) }
await mkdir(LAVORO, { recursive: true })

if (rifai) {
  for (const n of quali) await lavora(n, await readFile(join(LAVORO, `${n}.png`)))
  await misure(quali)
  process.exit(0)
}

if (candidati) {
  await mkdir(CAND, { recursive: true })
  const righe = []
  const coda = [...quali]
  await Promise.all(Array.from({ length: 4 }, async () => {
    for (let n; (n = coda.shift()); ) {
      const [o, prompt] = ICONE[n]
      let urls
      try { urls = await genera({ prompt, style: o.style, width: o.lato, height: o.lato, remove_bg: o.fondo, num_images: candidati }) } catch (e) { console.error(`✗ ${n}: ${e.message}`); continue }
      const riga = []
      for (const [k, url] of urls.entries()) {
        const png = Buffer.from(await (await fetch(url)).arrayBuffer())
        await writeFile(join(CAND, `${n}-${k + 1}.png`), png)
        await lavora(n, png, join(CAND, `${n}-${k + 1}.webp`))
        riga.push([join(CAND, `${n}-${k + 1}.webp`), await tocca(png, o)])
      }
      righe.push([n, riga])
      console.log(`… ${n}: ${riga.length} versioni`)
    }
  }))
  // il foglio: una riga per icona, il nome a sinistra, le versioni numerate da 1
  righe.sort((a, b) => quali.indexOf(a[0]) - quali.indexOf(b[0]))
  const C = 150, X = 190, pezzi = []
  for (const [i, [n, riga]] of righe.entries()) {
    pezzi.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${X}" height="${C}"><text x="8" y="${C / 2}" font-family="monospace" font-size="18" fill="#fff">${n}</text></svg>`), left: 0, top: i * C })
    for (const [k, [f, bordo]] of riga.entries()) {
      if (bordo) pezzi.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${C}" height="${C}"><rect x="2" y="2" width="${C - 4}" height="${C - 4}" fill="none" stroke="#ff4040" stroke-width="3"/><text x="${C - 52}" y="${C - 8}" font-family="monospace" font-size="14" fill="#ff4040">bordo</text></svg>`), left: X + k * C, top: i * C }) // tagliato: da non scegliere
      pezzi.push({ input: await sharp(f).resize(C - 20, C - 20, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: 'nearest' }).png().toBuffer(), left: X + k * C + 10, top: i * C + 10 })
      pezzi.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><text x="2" y="18" font-family="monospace" font-size="18" fill="#ffd400">${k + 1}</text></svg>`), left: X + k * C + 4, top: i * C + 2 })
    }
  }
  await sharp({ create: { width: X + candidati * C, height: righe.length * C, channels: 4, background: '#16201a' } }).composite(pezzi).png().toFile(join(CAND, 'foglio.png'))
  console.log(`→ ${join(CAND, 'foglio.png')}`)
  process.exit(0)
}

// a quattro alla volta: Replicate sotto i 10 $ di credito ne accetta poche di fila (predict riprova i 429)
const coda = [...quali], falliti = []
await Promise.all(Array.from({ length: 4 }, async () => {
  for (let n; (n = coda.shift()); ) {
    const [o, prompt] = ICONE[n]
    // fino a cinque volte, finché il disegno non tocca il bordo; tagliato non si scrive mai (resta l'icona di prima)
    let png = null
    try {
      for (let prova = 1; prova <= 5 && !png; prova++) {
        // dal terzo tentativo il prompt chiede il soggetto piccolo in mezzo (se esce tagliato due volte, è troppo grande)
        const p3 = prova >= 3 ? `${prompt}, drawn small in the middle of the image with lots of empty space around it` : prompt
        const [url] = await genera({ prompt: p3, style: o.style, width: o.lato, height: o.lato, remove_bg: o.fondo, num_images: 1 })
        const p = Buffer.from(await (await fetch(url)).arrayBuffer())
        if (!(await tocca(p, o)) && (await haTarga(p, n))) png = p
      }
    } catch (e) { falliti.push(n); console.error(`✗ ${n}: ${e.message}`); continue }
    if (!png) { falliti.push(n); console.error(`✗ ${n}: tagliata (o senza targa) cinque volte su cinque, non scritta: cambia il prompt («drawn small in the middle…»)`); continue }
    await writeFile(join(LAVORO, `${n}.png`), png)
    await lavora(n, png)
  }
}))
await misure(quali.filter((n) => !falliti.includes(n)))
if (falliti.length) { console.error(`✗ non riuscite (${falliti.length}): node tools/pzkko/pixel.mjs ${falliti.join(' ')}`); process.exit(1) }
