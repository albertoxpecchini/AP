#!/usr/bin/env node
// Le immagini disegnate della scena 3D di pzkko.it, fatte da openai/gpt-image-2 su
// Replicate (qualità high, come tutte le immagini del sito): niente più tele disegnate a mano nel codice. La scena le
// adatta ai suoi modelli (scena/spazzatura.js: l'etichetta della lattina avvolta sul cilindro, le facce della scatola
// e del pacchetto, i volantini sui piani stropicciati, il chiusino alzato dalla sua mappa delle altezze).
//
//   node tools/pzkko/scena/disegni.mjs genera <nome…|tutti>
//       disegna in tools/pzkko/lavoro/disegni/<nome>/ (più nomi: in parallelo)
//   node tools/pzkko/scena/disegni.mjs recupera <nome> <id-predizione>
//   node tools/pzkko/scena/disegni.mjs usa <nome…|tutti>
//       l'ultimo PNG di ognuno, ritagliato e ridotto, in pzkko/art/scena/terra/ o fronte/ (webp); poi le anteprime con
//       node tools/pzkko/scena/anteprime.mjs
//
// Il colore del chiusino si fa dalla sua mappa delle altezze (input_images): prima «genera chiusino-alt», poi
// «usa chiusino-alt», poi «genera chiusino». Lo stesso il citofono (citofono-alt, poi citofono); il fondo del lucchetto
// nasce dalla sua faccia (genera lucchetto, poi lucchetto-fondo). Il fronte del negozio li usa in scena/fronte.js.

import { mkdir, readdir } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { ROOT, die, predict, prediction, salva, upload } from '../../replicate.mjs'

const LAVORO = join(ROOT, 'tools/pzkko/lavoro/disegni')
const ART = join(ROOT, 'pzkko/art')
const FLAT = 'Flat, perfectly orthographic, seen straight from the front, filling the entire image edge to edge: no perspective, no object shape around it, no table, no background, no drop shadow, no mockup.'

const DISEGNI = {
  kola: {
    prompt: `The printed label of a 33 cl soda can, unrolled and laid flat (it will be wrapped around a 3D can, so the left and right edges must continue seamlessly into each other). Glossy bright red background (#c4121b), a flowing white wave ribbon across the lower middle, the brand name «pzk-kola» in large white flowing hand-lettered script, an original parody of a classic cola logo, repeated twice around the label; smaller white text «gusto originale · 33 cl» and «pzk-kola company · mantova»; a small white nutrition table, a barcode near one edge, a recycling symbol. ${FLAT}`,
    aspect_ratio: '2048x1152',
    usa: { file: 'scena/terra/kola.webp', larg: 1024, alt: 576, qualita: 82 },
  },
  pechino: {
    prompt: `ONE side panel of a white paper Chinese take-out noodle box (an oyster pail), printed in red ink: off-white cardboard with a subtle paper texture, a red pagoda illustration, the brand name «pechino» in bold red letters, small red text «noodles · da asporto · mantova», a thin red border, a couple of light grease stains. ${FLAT}`,
    aspect_ratio: '1024x1024',
    usa: { file: 'scena/terra/pechino.webp', larg: 768, alt: 768, qualita: 82 },
  },
  lucky: {
    prompt: `The FRONT face of a cigarette pack, printed card: white background, a big red bullseye roundel (a red disc with thin black, white and gold concentric rings) in the centre with the brand name «luckypzkko» in black serif capitals across it, small text «filtered · 20 sigarette» below it, and at the bottom a black-bordered white box with the Italian health warning «IL FUMO UCCIDE» in bold black letters. A few creases from being crumpled. ${FLAT}`,
    aspect_ratio: '1024x1536',
    usa: { file: 'scena/terra/lucky.webp', larg: 512, alt: 768, qualita: 82 },
  },
  tucson: {
    prompt: `A printed A5 car dealer advertising flyer: a photo of a dark blue mid-size SUV (the current Hyundai Tucson) on a city street; the model name «TUCSON» in huge white letters on a deep navy band, small «hyundai» above it; the offer «da 249 € al mese» in big type; fine print «TAN 5,99% TAEG 7,41% · offerta valida fino al 31.10»; at the bottom the dealer «pzkko motors · mantova» with a thin red underline. Glossy paper, wet from the rain, a muddy shoe print across one corner. ${FLAT}`,
    aspect_ratio: '1024x1536',
    usa: { file: 'scena/terra/tucson.webp', larg: 512, alt: 725, qualita: 76 },
  },
  pzkkonet: {
    prompt: `A cheap A5 advertising flyer on thin paper: «pzkkonet» in big bold black letters with a small snail logo (a spiral shell with two antennae), the slogan «la fibra che arriva anche dove non c'è», a drawing of a glowing electric-blue fibre-optic cable coming out of a round cast-iron manhole cover, the price «19,90 €/mese» in a blue burst, small print «attivazione gratuita · pzkkonet s.r.l. · mantova». Black, white and electric blue. Soggy and dirty from the street, a torn corner. ${FLAT}`,
    aspect_ratio: '1024x1536',
    usa: { file: 'scena/terra/pzkkonet.webp', larg: 512, alt: 725, qualita: 76 },
  },
  menu: {
    prompt: `A printed take-away menu flyer of a Chinese restaurant: a red header «pechino · ristorante cinese» with a small golden dragon, a short list of dishes with prices in Italian (ravioli al vapore 4,50 €, spaghetti di soia 5,00 €, pollo alle mandorle 6,50 €, involtini primavera 3,00 €), «consegna a domicilio · mantova · 0376 000 000» at the bottom. Cheap off-white paper, red and gold ink, a little torn, dirty and wet. ${FLAT}`,
    aspect_ratio: '1024x1536',
    usa: { file: 'scena/terra/menu.webp', larg: 512, alt: 725, qualita: 76 },
  },
  'chiusino-alt': {
    prompt: `A precise top-down orthographic GRAYSCALE HEIGHT MAP (a displacement map for 3D modelling) of a square cast-iron manhole frame with a round cover inside. Pure white = the highest raised surfaces, black = the deepest recesses, smooth mid-greys only on slopes.
The square frame fills the entire image exactly: its outer border touches all four image edges. Along the square border a flat raised rim band; the four corners between the square and the round cover are filled with a small raised anti-slip pattern of diamonds.
Inside, centred, a round cover whose diameter is 76% of the image width, separated from the frame by a thin black gap ring. On the cover, from the outside in: a smooth raised ring band; a ring of raised capital letters running around the cover reading «PZKKONET · TELECOMUNICAZIONI · ACCESSO VIETATO ·»; a thin raised ring; a field of small raised diamond studs in a regular staggered grid; two small oblong lifting slots (black) on the left and on the right; a central round medallion with a raised outline, a raised snail logo (a spiral shell with a foot and two antennae) and below it the raised word «pzkkonet» and the small raised text «D400 · EN 124».
Crisp, clean, symmetric, technical. No lighting, no shading, no ambient occlusion, no perspective, no texture noise, no colour, no shadows: only height values.`,
    aspect_ratio: '2048x2048',
    usa: { file: 'scena/terra/chiusino-alt.webp', larg: 1024, alt: 1024, grigio: true, livelli: [45, 172, 186], senzaPerdite: true, mappe: { lato: 0.8, altezza: 0.0065, griglia: 256 } },
  },
  chiusino: {
    ingresso: 'chiusino-alt',
    prompt: `This image is the height map of a cast-iron manhole (white = raised, black = recessed). Turn it into the photorealistic top-down ALBEDO texture of the same manhole, keeping EXACTLY the same layout: every letter, stud, slot, ring and edge in exactly the same position, size and shape, the square still filling the image edge to edge. Dark grey-black cast iron; the raised studs, letters and rims worn smooth and lighter grey by footsteps; the recesses filled with dark dirt, grime and a little sand; faint brown rust only in the gap ring and around the two lifting slots. Flat even diffuse light, no shadows, no reflections, no perspective.`,
    aspect_ratio: '2048x2048',
    usa: { file: 'scena/terra/chiusino.webp', larg: 1024, alt: 1024, qualita: 70 },
  },

  // ── il fronte del negozio (21.10, scena/fronte.js): il citofono, il lucchetto della saracinesca, la porta ──
  // il citofono come il chiusino: prima i rilievi, poi il colore disegnato da loro (input_images), e dai rilievi le normali
  'citofono-alt': {
    prompt: `A precise orthographic GRAYSCALE HEIGHT MAP (a displacement map for 3D modelling) of a small wall-mounted door intercom panel (the «citofono» of a single shop), the rectangular panel filling the entire image exactly: its outer border touches all four image edges. Pure white = the highest raised surfaces, black = the deepest recesses, flat mid grey = the flat front face of the panel, smooth greys only on slopes and bevels.
From the top down: a narrow raised bevelled rim along all four edges; in the upper part a round speaker grille, a circle about 45% of the panel width made of small round holes (black) in a tight hexagonal pattern; below it a recessed rectangular window for the name card (dark grey, about 70% of the width and 12% of the height) with a thin raised frame; in the lower part one big round push button about 34% of the panel width, domed and raised (white at the top), with a thin black gap ring around it; four small raised round screw heads, each with a black slot, near the four corners.
Crisp, clean, symmetric, technical. No lighting, no shading, no ambient occlusion, no perspective, no texture noise, no text, no colour, no shadows: only height values.`,
    aspect_ratio: '1024x1536',
    usa: { file: 'scena/fronte/citofono-alt.webp', larg: 512, alt: 768, grigio: true, sfoca: 0.8, senzaPerdite: true, mappe: { lato: 0.12, altezza: 0.004, lucido: [0.62, 0.32, 0.55, 0.42] } },
  },
  citofono: {
    ingresso: 'citofono-alt',
    prompt: `This image is the height map of a wall-mounted door intercom panel (white = raised, black = recessed). Turn it into the photorealistic front-view ALBEDO texture of the same intercom, keeping EXACTLY the same layout: every hole, edge, screw, the button and the name window in exactly the same position, size and shape, the panel still filling the image edge to edge. Satin brushed aluminium with fine horizontal brushing, a few scratches and small dents, grey grime in the corners, inside the speaker holes and around the button; in the name window, behind scratched clear plastic, a slightly yellowed paper card with the name «pzkko» hand-written in blue ballpoint pen; the push button of polished brass, worn shiny in the middle by fingers; the four screws of stainless steel with a little rust in the slots. Flat even diffuse light, no shadows, no reflections, no perspective.`,
    aspect_ratio: '1024x1536',
    usa: { file: 'scena/fronte/citofono.webp', larg: 512, alt: 768, qualita: 80 },
  },
  // il lucchettone che tiene chiusa la saracinesca: ottone massiccio, la faccia e il fondo col cilindro della chiave
  lucchetto: {
    prompt: `The FRONT face of a big, heavy solid brass padlock body (9 × 7.5 cm), seen perfectly straight on: the rectangular body face, with gently rounded corners, fills the entire image edge to edge (it touches all four edges of the image). No shackle, no background, no shadow. Thick cast brass, old and weathered by years on a city street: warm golden brass polished bright where hands rub it, dark brown tarnish and a little green verdigris in the recesses and along the edges, fine scratches, small dents and dings, a few drops of dried grey paint; in the centre a stamped (debossed) rectangular logo plate with the maker's mark «PZKKO» in bold capitals and «90 mm» in small letters below it. ${FLAT}`,
    aspect_ratio: '1536x1024',
    usa: { file: 'scena/fronte/lucchetto.webp', larg: 768, alt: 640, qualita: 80 },
  },
  'lucchetto-fondo': {
    ingresso: 'lucchetto',
    prompt: `This image is the front face of a heavy solid brass padlock. Draw the BOTTOM face of the SAME padlock (the same brass, the same wear and tarnish), seen perfectly straight on and filling the entire image edge to edge: a long narrow rounded rectangle of brass (9 × 4 cm) with, in the centre, the round key cylinder (a slightly raised brass disc 2 cm wide with a thin gap ring around it) and its vertical serrated keyway slot, black inside; dirt and dark tarnish around the cylinder. ${FLAT}`,
    aspect_ratio: '2048x1152',
    usa: { file: 'scena/fronte/lucchetto-fondo.webp', larg: 768, alt: 342, qualita: 80 },
  },
  // l'alluminio della porta a vetri (il telaio e i profili, stesa in coordinate del mondo e specchiata: si ripete) e lo zoccolo
  alluminio: {
    prompt: `A seamless, tileable texture of the anodised aluminium of an old Italian shop door frame, seen flat and straight on and filling the whole image: dull natural-silver anodised aluminium, slightly greyish, with very fine vertical brushing, light scratches, small dents, a few faded patches, specks of dust and city grime; uniform over the whole image, without edges, borders, joints, screws or objects, so that it repeats seamlessly in both directions. Flat even diffuse light, no shadows, no reflections, no perspective.`,
    aspect_ratio: '1024x1024',
    usa: { file: 'scena/fronte/alluminio.webp', larg: 512, alt: 512, qualita: 80 },
  },
  zoccolo: {
    prompt: `The kick plate at the bottom of an old aluminium shop door, seen straight on and filling the entire image edge to edge: a wide horizontal panel of brushed natural-silver anodised aluminium, scuffed and scratched by years of shoes and boxes pushing the door: black rubber scuff marks and a muddy shoe print in the lower half, long horizontal scratches, small dents, a band of dirt and dried rain splashes along the bottom edge, the pale ghost of a peeled-off sticker. ${FLAT}`,
    aspect_ratio: '2048x1152',
    usa: { file: 'scena/fronte/zoccolo.webp', larg: 1024, alt: 410, qualita: 78 },
  },
}

const nomi = (args) => (args.includes('tutti') ? Object.keys(DISEGNI) : args).map((n) => (DISEGNI[n] ? n : die(`non conosco «${n}»: ${Object.keys(DISEGNI).join(', ')}`)))
const ultimo = async (nome) => {
  const dir = join(LAVORO, nome)
  const png = (await readdir(dir).catch(() => [])).filter((f) => f.endsWith('.png')).sort().at(-1)
  return png ? join(dir, png) : null
}

async function genera(nome) {
  const d = DISEGNI[nome]
  const input = { prompt: d.prompt, aspect_ratio: d.aspect_ratio, quality: 'high', number_of_images: 1, output_format: 'png', background: d.background || 'opaque' }
  if (d.ingresso) {
    // (la mappa pulita da «usa», se c'è: la rifinita; se no l'ultimo disegno così com'è, es. la faccia del lucchetto)
    const usato = (await readdir(join(LAVORO, d.ingresso)).catch(() => [])).includes('pulita.png') ? join(LAVORO, d.ingresso, 'pulita.png') : await ultimo(d.ingresso)
    if (!usato) die(`prima «genera ${d.ingresso}»`)
    input.input_images = [await upload(usato).catch(() => die(`prima «usa ${d.ingresso}»: manca ${usato}`))]
  }
  console.log(`→ ${nome}: attendo il modello…`)
  const p = await predict(input, `node tools/pzkko/scena/disegni.mjs recupera ${nome}`)
  return salva(p, join(LAVORO, nome), { disegno: nome })
}

async function usa(nome) {
  const { default: sharp } = await import('sharp')
  const d = DISEGNI[nome].usa, file = await ultimo(nome)
  if (!file) die(`nessun PNG per ${nome}: prima «genera ${nome}»`)
  let img = sharp(file)
  img = d.alt ? img.resize(d.larg, d.alt, { fit: 'cover' }) : img.resize(d.larg)
  if (d.grigio) img = img.grayscale()
  // la mappa delle altezze: il modello la disegna come un rilievo illuminato (i rilievi più chiari del piano, con un
  // filo d'ombra e di luce sui bordi); si riporta a tre livelli netti, fondo (fessura, asole) 0, piano 0,5, rilievi 1,
  // e si sfoca appena (gli spigoli della fusione non sono vivi). Le soglie vengono dall'istogramma: nero, ~160, ~190
  if (d.livelli) {
    const { data, info } = await img.raw().toBuffer({ resolveWithObject: true })
    const liscia = (a, b, v) => Math.min(1, Math.max(0, (v - a) / (b - a))) ** 2 * (3 - 2 * Math.min(1, Math.max(0, (v - a) / (b - a))))
    const [nero, piano, rilievo] = d.livelli
    const out = Buffer.alloc(info.width * info.height)
    for (let i = 0; i < out.length; i++) { const v = data[i * info.channels]; out[i] = 255 * (0.5 * liscia(nero - 15, nero + 15, v) + 0.5 * liscia(piano, rilievo, v)) }
    img = sharp(out, { raw: { width: info.width, height: info.height, channels: 1 } }).blur(1.2)
  } else if (d.sfoca) img = img.blur(d.sfoca)
  const out = join(ART, d.file)
  await mkdir(join(out, '..'), { recursive: true })
  // (la mappa delle altezze intera resta qui, in lavoro/: ne nascono il colore e le mappe qui sotto; nel sito ne basta una
  // piccola, per alzare la griglia, e solo dove c'è una griglia da alzare: il chiusino sì, il citofono no)
  if (d.mappe) {
    await img.png().toFile(join(LAVORO, nome, 'pulita.png'))
    img = d.mappe.griglia ? sharp(join(LAVORO, nome, 'pulita.png')).resize(d.mappe.griglia) : null
  }
  if (img) {
    await img.webp(d.senzaPerdite ? { lossless: true } : { quality: d.qualita, effort: 6, alphaQuality: 90 }).toFile(out)
    console.log(`✓ ${nome} → ${out}`)
  }
  // dalle altezze, una volta qui invece che a ogni visita nel browser: le normali (spazio tangente, come
  // normaliDaAltezze di scena/materiali.js ma col bordo fermo) e il lucido (verde: i rilievi consumati dalle scarpe,
  // lisci; i fondi ruvidi) col metallo (blu: la ghisa nuda dei rilievi). lucido: [ruvido, quanto meno sui rilievi,
  // metallo, quanto più sui rilievi]; quello del chiusino è il predefinito
  if (d.mappe) {
    const { data, info } = await sharp(join(LAVORO, nome, 'pulita.png')).greyscale().raw().toBuffer({ resolveWithObject: true })
    // (larga n, alta m: il citofono non è quadrato)
    const n = info.width, m = info.height, C = info.channels, h = (x, y) => (data[(Math.min(m - 1, Math.max(0, y)) * n + Math.min(n - 1, Math.max(0, x))) * C] / 255) * d.mappe.altezza
    const [r0, r1, m0, m1] = d.mappe.lucido ?? [0.92, 0.55, 0.1, 0.5]
    const passo = d.mappe.lato / n, nor = Buffer.alloc(n * m * 3), orm = Buffer.alloc(n * m * 3)
    for (let y = 0; y < m; y++) for (let x = 0; x < n; x++) {
      const dx = (h(x + 1, y) - h(x - 1, y)) / (2 * passo), dy = (h(x, y + 1) - h(x, y - 1)) / (2 * passo), len = Math.hypot(dx, dy, 1), i = (y * n + x) * 3
      nor[i] = 128 + (-dx / len) * 127; nor[i + 1] = 128 + (dy / len) * 127; nor[i + 2] = 128 + (1 / len) * 127
      const a = h(x, y) / d.mappe.altezza, usura = 0.75 + 0.25 * Math.sin(x * 0.013 + 1.1) * Math.sin(y * 0.011 + 0.4)
      orm[i] = 255; orm[i + 1] = 255 * (r0 - r1 * a * usura); orm[i + 2] = 255 * (m0 + m1 * a * usura)
    }
    for (const [buf, suffisso, lato, qualita] of [[nor, '-normali', 768, 88], [orm, '-lucido', 512, 80]]) {
      const f = out.replace(/-alt\.webp$/, `${suffisso}.webp`)
      await sharp(buf, { raw: { width: n, height: m, channels: 3 } }).resize(Math.min(lato, n)).webp({ quality: qualita, effort: 6 }).toFile(f)
      console.log(`  ${f}`)
    }
  }

}

const [cmd, ...args] = process.argv.slice(2)
// più disegni: un processo ciascuno, in parallelo (un errore di uno, che chiude il suo processo, non ferma gli altri)
if (cmd === 'genera' && nomi(args).length > 1) {
  const qui = fileURLToPath(import.meta.url)
  await Promise.all(nomi(args).map((n) => new Promise((ok) => spawn(process.execPath, [qui, 'genera', n], { stdio: 'inherit' }).on('close', ok))))
} else if (cmd === 'genera') await genera(nomi(args)[0])
else if (cmd === 'recupera') await salva(await prediction(args[1]), join(LAVORO, nomi([args[0]])[0]), { disegno: args[0] })
else if (cmd === 'usa') for (const n of nomi(args)) await usa(n)
else die('uso: disegni.mjs genera|recupera|usa <nome…|tutti>')
