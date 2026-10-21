#!/usr/bin/env node
// La pagina «com'è nato questo muro» di pzkko.it (pzkko/storia/) e il riquadro della scheda pzkko su
// albertopecchini.it: le tre foto vere della saracinesca di Bologna con le loro Live Photo, i dettagli
// ritagliati e i meme bolognesi nello stile di Better Call Pekko (openai/gpt-image-2 su Replicate, qualità
// high, il volto dalla fototessera come per bcp: tools/assistenza/spot.js).
//
//   node tools/pzkko/storia/storia.mjs foto [cartella]
//       dalle foto dell'iPhone (IMG_0334–0336, JPG + MOV) le immagini e i video del sito, senza metadati
//       (niente GPS nei file pubblicati). Cartella di default: D:\disco immagini\Rullino\Anno 2024\09
//   node tools/pzkko/storia/storia.mjs genera <meme…|tutti>     disegna in tools/pzkko/lavoro/storia/<meme>/
//   node tools/pzkko/storia/storia.mjs recupera <meme> <id-predizione>
//   node tools/pzkko/storia/storia.mjs usa <meme…|tutti>        l'ultimo PNG di ognuno in pzkko/art/storia/meme/
//   node tools/pzkko/storia/storia.mjs muro [meme…]             le stampe coi testi per il muro della home, in
//       pzkko/art/storia/muro/ (di default mortadella, iphone, nonna)
//
// Serve ffmpeg nel PATH (o FFMPEG=<percorso>) per le Live Photo.

import { mkdir, readdir, writeFile, copyFile } from 'node:fs/promises'
import { execFileSync, spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { ROOT, die, predict, prediction, salva, upload } from '../../replicate.mjs'
import { PERSONA, FOTO, RIFERIMENTO } from '../../assistenza/spot.js'

const LAVORO = join(ROOT, 'tools/pzkko/lavoro/storia')
const ART = join(ROOT, 'pzkko/art/storia')
const AP = join(ROOT, 'public/media/web') // le copie per la scheda del progetto su albertopecchini.it
const FFMPEG = process.env.FFMPEG || 'ffmpeg'

// ── le foto vere ─────────────────────────────────────────────────────────────
// Domenica 22.09.2024, 12:28:00, :02 e :05 (+02:00), via Rizzoli a Bologna, iPhone 16 Pro con iOS 18.0.
// I JPG sono 5712 × 4284 ruotati di 90°; i MOV delle Live Photo 1920 × 1440 H.264 in Display P3, 2–3 s.
const SCATTI = ['IMG_0334', 'IMG_0335', 'IMG_0336']
// i ritagli, in pixel della foto già raddrizzata (4284 × 5712) di IMG_0334
const RITAGLI = {
  insegna: { da: 'IMG_0334', box: [1100, 250, 2000, 900], larg: 1000 },
  adesivo: { da: 'IMG_0334', box: [2050, 350, 500, 450], larg: 500 },
  discobo: { da: 'IMG_0334', box: [930, 3440, 520, 760], larg: 520 },
}

async function foto(cartella = 'D:\\disco immagini\\Rullino\\Anno 2024\\09') {
  const { default: sharp } = await import('sharp')
  await mkdir(ART, { recursive: true })
  for (const [i, nome] of SCATTI.entries()) {
    const jpg = join(cartella, `${nome}.JPG`), mov = join(cartella, `${nome}.MOV`)
    // sharp raddrizza con l'orientamento EXIF, porta il Display P3 in sRGB e non scrive metadati
    for (const [larg, suff, q] of [[1080, '', 80], [540, '-m', 78]]) {
      const out = join(ART, `foto-${i + 1}${suff}.webp`)
      await sharp(jpg).rotate().resize(larg).webp({ quality: q, effort: 6 }).toFile(out)
      console.log(`✓ ${out}`)
    }
    // la Live Photo: P3 → BT.709, gamma piena → limitata, senza audio né metadati, avvio veloce
    const out = join(ART, `live-${i + 1}.mp4`)
    execFileSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', mov, '-an', '-map_metadata', '-1', '-vf',
      'colorspace=all=bt709:ispace=smpte170m:iprimaries=smpte432:itrc=bt709:irange=pc:range=tv:fast=0,scale=540:-2:flags=lanczos,fps=30,format=yuv420p',
      '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', '24', '-movflags', '+faststart', out])
    console.log(`✓ ${out}`)
  }
  for (const [nome, r] of Object.entries(RITAGLI)) {
    const [left, top, width, height] = r.box
    const out = join(ART, `${nome}.webp`)
    await sharp(join(cartella, `${r.da}.JPG`)).rotate().extract({ left, top, width, height }).resize(r.larg).webp({ quality: 82, effort: 6 }).toFile(out)
    console.log(`✓ ${out}`)
  }
  // l'anteprima dei link condivisi: l'insegna e la parte alta della saracinesca, 1200 × 630
  await sharp(join(cartella, 'IMG_0334.JPG')).rotate().extract({ left: 0, top: 260, width: 4284, height: 2249 }).resize(1200, 630).jpeg({ quality: 82, mozjpeg: true }).toFile(join(ART, 'og.jpg'))
  console.log(`✓ ${join(ART, 'og.jpg')}`)
  // albertopecchini.it: la prima foto e la sua Live Photo per la scheda del progetto
  await copyFile(join(ART, 'foto-1.webp'), join(AP, 'pzk-bologna.webp'))
  await copyFile(join(ART, 'foto-1-m.webp'), join(AP, 'pzk-bologna-m.webp'))
  await copyFile(join(ART, 'live-1.mp4'), join(AP, 'pzk-bologna.mp4'))
  console.log(`✓ ${join(AP, 'pzk-bologna.webp')}, -m.webp e .mp4`)
}

// ── i meme ───────────────────────────────────────────────────────────────────
// Solo la foto: le scritte (Impact bianco col bordo nero, come i meme veri) le mette la pagina in HTML.
const MEME = {
  spaghetti: {
    aspect_ratio: '2:3',
    prompt: `Two photographs stacked vertically in one image, separated by a thin straight white horizontal line, both panels exactly the same size and framing, like the two panels of a reaction meme. ${PERSONA}
${FOTO}
Both panels: the man sits at the same small table of a homely old trattoria in Bologna (wood panelling, a checked red-and-white tablecloth), seen from the waist up, on the LEFT half of the panel; the plate is on the RIGHT half of the panel. He wears a loud canary-yellow jacket, purple satin shirt and an orange-and-blue polka-dot tie.
TOP panel: a plate of spaghetti with red tomato meat sauce is pushed towards him; he turns his head away in theatrical disgust, eyes shut, raising one hand palm-out to refuse it.
BOTTOM panel: a plate of fresh golden egg tagliatelle with thick dark Bolognese ragù; he turns towards it beaming, pointing at it with delight, mouth open in a big grin.`,
  },
  nonna: {
    aspect_ratio: '1:1',
    prompt: `${FOTO}
In a small old kitchen in Bologna, sheets of fresh yellow egg pasta drying over the back of a chair and a long wooden rolling pin on the floury table: a tiny furious elderly Italian grandmother (white hair in a bun, flowered apron, flour on her hands) stands on the right, glaring and pointing the long rolling pin at the man like a sword.
On the left, the man, terrified and sweating, leaning back: ${PERSONA} He wears a shiny purple jacket, lime-green shirt and a yellow tie, and is caught holding up a fork with a big twirl of spaghetti with red sauce dripping from it.`,
  },
  ragu: {
    aspect_ratio: '1:1',
    prompt: `${FOTO}
${PERSONA} He wears a lime-green suit, pink shirt and a swirly yellow tie, sleeves pushed up, and stands at an old white gas stove in a cramped Italian home kitchen, stirring an enormous dented steel pot of thick, dark red Bolognese ragù with a long wooden spoon; steam rises from the pot. A round white kitchen wall clock hangs behind him. He looks exhausted but immensely proud, like he has been standing there for hours, a drop of sauce on his tie.`,
  },
  torri: {
    aspect_ratio: '1:1',
    prompt: `${FOTO}
A street in the old town of Bologna, Italy, under the red and ochre arcades of the porticoes, on a grey day; at the end of the street the two medieval brick towers of Bologna rise above the roofs: one very tall and thin, one much shorter and visibly leaning.
In the foreground, full length, the man: ${PERSONA} He wears a teal suit, white shirt and a wide striped tie, and leans his whole body sideways at a ridiculous angle, arms out for balance, imitating the leaning tower behind him, with a cheesy tourist grin.`,
  },
  mortadella: {
    aspect_ratio: '1:1',
    prompt: `${FOTO}
Inside an old Bologna salumeria, hams and cheeses hanging behind the counter. ${PERSONA} He wears a navy pinstripe suit, red shirt and a white tie and, seen from the waist up, cradles in both arms an enormous whole mortadella (pale pink, wrapped in a white string net, as big as a baby) like a newborn, looking down at it with tears of love in his eyes.`,
  },
  iphone: {
    aspect_ratio: '1:1',
    prompt: `${FOTO}
On a stone sidewalk under a portico in the old town of Bologna. ${PERSONA} He wears a canary-yellow suit, purple satin shirt and an orange polka-dot tie, and crouches low in a dramatic fashion-photographer pose, one knee almost on the ground, holding up a brand-new titanium smartphone with a triple camera (no logo) with both hands, intensely focused, photographing a closed grey metal roll-up shutter covered in graffiti and paper flyers (everything on them illegible) as if it were a supermodel on a photo shoot.`,
  },
}

const nomi = (args) => (args.includes('tutti') ? Object.keys(MEME) : args).map((n) => (MEME[n] ? n : die(`non conosco «${n}»: ${Object.keys(MEME).join(', ')}`)))
const ultimo = async (nome) => {
  const dir = join(LAVORO, nome)
  const png = (await readdir(dir).catch(() => [])).filter((f) => f.endsWith('.png')).sort().at(-1)
  return png ? join(dir, png) : null
}

async function genera(nome) {
  const m = MEME[nome]
  const input = { prompt: m.prompt, aspect_ratio: m.aspect_ratio, quality: 'high', number_of_images: 1, output_format: 'png', background: 'opaque' }
  if (m.prompt.includes(PERSONA)) input.input_images = [await upload(RIFERIMENTO)]
  console.log(`→ ${nome}: attendo il modello…`)
  const p = await predict(input, `node tools/pzkko/storia/storia.mjs recupera ${nome}`)
  return salva(p, join(LAVORO, nome), { meme: nome })
}

async function usa(nome) {
  const { default: sharp } = await import('sharp')
  const file = await ultimo(nome)
  if (!file) die(`nessun PNG per ${nome}: prima «genera ${nome}»`)
  const out = join(ART, 'meme', `${nome}.webp`)
  await mkdir(join(ART, 'meme'), { recursive: true })
  await sharp(file).resize(720).webp({ quality: 80, effort: 6 }).toFile(out)
  await writeFile(out.replace(/\.webp$/, '.json'), JSON.stringify({ fonte: 'openai/gpt-image-2 su Replicate, qualità high', strumento: 'tools/pzkko/storia/storia.mjs', prompt: MEME[nome].prompt }, null, 2))
  console.log(`✓ ${nome} → ${out}`)
}

// ── i meme stampati sul muro ─────────────────────────────────────────────────
// Alcuni meme finiscono anche sul muro della home, fra la roba degli altri: la stessa stampa della pagina della
// storia (foto, bordo bianco, scritte in Impact), fotografata dal browser senza rotazione né ombra, in
// art/storia/muro/<meme>.webp. Sul muro sono manifesti (`.man`) che portano alla storia.
async function muro(nomi) {
  const { createServer } = await import('node:http')
  const { readFile, stat } = await import('node:fs/promises')
  const { extname } = await import('node:path')
  const browser = await import('../browser.mjs')
  const { default: sharp } = await import('sharp')
  const TIPI = { '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.mp4': 'video/mp4' }
  const radice = join(ROOT, 'pzkko')
  const server = createServer(async (req, res) => {
    let f = join(radice, decodeURIComponent(new URL(req.url, 'http://x').pathname))
    try { if ((await stat(f)).isDirectory()) f = join(f, 'index.html'); res.setHeader('Content-Type', TIPI[extname(f)] || 'application/octet-stream'); res.end(await readFile(f)) }
    catch { res.statusCode = 404; res.end() }
  })
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  const aperto = await browser.puppeteer().launch({ executablePath: browser.eseguibile(), headless: true, args: ['--no-sandbox', '--hide-scrollbars'] })
  const page = await aperto.newPage()
  await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 2 })
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  // (?muro=1: la pagina senza la scena 3D, come per cattura.mjs; a mezzogiorno, senza il velo della sera)
  await page.goto(`http://127.0.0.1:${server.address().port}/storia/?muro=1&ora=12:00`, { waitUntil: 'networkidle0' })
  // la pagina spoglia, come in cattura.mjs: solo il meme scelto, senza muro, ombra né rotazione, su trasparente
  await page.evaluate(() => {
    const s = document.createElement('style')
    s.textContent = `html,body,.strada,.muro{background:none!important}.muro{box-shadow:none!important}.muro::before,.muro::after,.buio,.fari,.freni,.neonauto,.portale,.goccia,.spruzzo,.formica,.mosca{display:none!important}
      .it{visibility:hidden}.it.stampata{visibility:visible;width:300px!important;filter:none!important;transform:none!important;z-index:99!important}`
    document.head.appendChild(s)
    return document.fonts.ready
  })
  await mkdir(join(ART, 'muro'), { recursive: true })
  for (const nome of nomi) {
    const el = await page.evaluateHandle((n) => {
      const f = document.querySelector(`img[src$="/meme/${n}.webp"]`)?.closest('figure')
      if (!f) return null
      for (const x of document.querySelectorAll('.it.stampata')) x.classList.remove('stampata')
      f.classList.add('stampata')
      f.querySelector('img').loading = 'eager'
      return f
    }, nome)
    if (!(await el.evaluate((f) => !!f))) die(`nessun meme «${nome}» nella pagina della storia`)
    await el.evaluate((f) => f.querySelector('img').decode())
    const png = await el.screenshot({ omitBackground: true })
    const out = join(ART, 'muro', `${nome}.webp`)
    const { width, height } = await sharp(png).webp({ quality: 86, effort: 6 }).toFile(out)
    const scritte = await el.evaluate((f) => [...f.querySelectorAll('.cap')].map((c) => c.textContent))
    await writeFile(out.replace(/\.webp$/, '.json'), JSON.stringify({ fonte: 'meme/' + nome + '.webp (gpt-image-2) con le scritte della pagina della storia, fotografato dal browser', strumento: 'tools/pzkko/storia/storia.mjs muro', scritte }, null, 2))
    console.log(`✓ ${out} (${width} × ${height})`)
  }
  await aperto.close()
  server.close()
}

const [cmd, ...args] = process.argv.slice(2)
// più meme: un processo ciascuno, in parallelo (come tools/pzkko/scena/disegni.mjs)
if (cmd === 'genera' && nomi(args).length > 1) {
  const qui = fileURLToPath(import.meta.url)
  await Promise.all(nomi(args).map((n) => new Promise((ok) => spawn(process.execPath, [qui, 'genera', n], { stdio: 'inherit' }).on('close', ok))))
} else if (cmd === 'genera') await genera(nomi(args)[0])
else if (cmd === 'recupera') await salva(await prediction(args[1]), join(LAVORO, nomi([args[0]])[0]), { meme: args[0] })
else if (cmd === 'usa') for (const n of nomi(args)) await usa(n)
else if (cmd === 'foto') await foto(args[0])
else if (cmd === 'muro') await muro(args.length ? nomi(args) : ['mortadella', 'iphone', 'nonna'])
else die('uso: storia.mjs foto [cartella] | genera|recupera|usa <meme…|tutti> | muro [meme…]')
