#!/usr/bin/env node
// Mascotte del sito con openai/gpt-image-2 su Replicate, sempre in qualità high.
//
//   node tools/mascotte/mascotte.mjs genera <lumaca|nutria|tutte>
//       disegna la mascotte (1536 × 1024, fondo trasparente) in tools/mascotte/lavoro/<nome>/
//   node tools/mascotte/mascotte.mjs usa <nome> <file.png>
//       pulisce la trasparenza, rifila i margini, trova gli occhi e scrive
//       public/media/mascotte/<nome>.webp + le misure in src/data/mascotte.js
//   node tools/mascotte/mascotte.mjs recupera <nome> <id-predizione>
//       scarica un'immagine già pagata (se l'attesa si è interrotta)
//
// Gli occhi: il modello li disegna bianchi, tondi, con la pupilla al centro. Lo
// script li cerca come macchie bianche quasi circolari e ne salva centro e raggio
// (in percentuale dell'immagine); il sito ci mette sopra il proprio occhio con la
// pupilla mobile (src/client/mascot.js). Il «naso», cioè la zona in cui il
// puntatore fa incrociare gli occhi, si segna a mano in src/data/mascotte.js:
// lo script lo conserva se c'è già.

import { writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'
import { ROOT, die, predict, prediction, salva } from '../replicate.mjs'
import { STILE, mascotte } from './mascotte.js'
import { chiave, fondoMagenta, leggi, rifila, occhi } from './immagine.mjs'

const LAVORO = join(ROOT, 'tools/mascotte/lavoro')
const OUT = join(ROOT, 'public/media/mascotte')
const MANIFEST = join(ROOT, 'src/data/mascotte.js')
const MAX_W = 1200 // larghezza massima in pagina: la chiocciola del piè di pagina arriva a ~360 px CSS

const mascotteDi = (nome) => mascotte[nome] || die(`nessuna mascotte «${nome}». Disponibili: ${Object.keys(mascotte).join(', ')}`)

async function genera(nome) {
  const m = mascotteDi(nome)
  const input = {
    prompt: `${m.soggetto}\n\n${STILE}`,
    aspect_ratio: '3:2',
    quality: 'high',
    number_of_images: 1,
    output_format: 'png',
    background: 'transparent',
  }
  console.log(`→ ${nome}: ${m.titolo} — qualità high, 3:2, attendo il modello…`)
  const p = await predict(input, `node tools/mascotte/mascotte.mjs recupera ${nome}`)
  await salva(p, join(LAVORO, nome), { mascotte: nome })
}

// ── Preparazione ─────────────────────────────────────────────────────────────
// leggi, rifila, occhi e pelle stanno in immagine.mjs (in comune con i burattini)

async function usa(nome, file) {
  const m = mascotteDi(nome)
  const src = resolve(file)
  if (!existsSync(src)) die(`non trovo ${src}`)
  const grezza = leggi(src)
  // dal 30.09.2026 il modello non fa più il fondo trasparente: se il foglio è su
  // magenta, si toglie con la chiave cromatica (come per i burattini)
  if (fondoMagenta(grezza)) chiave(grezza)
  const img = rifila(grezza)
  console.log(`→ ${nome}: ${img.w} × ${img.h} dopo il rifilo`)
  const eyes = occhi(img)
  if (eyes.length !== 2) console.warn(`  ! trovati ${eyes.length} occhi invece di 2: da sistemare a mano in src/data/mascotte.js`)
  for (const e of eyes) console.log(`  occhio a (${e.cx.toFixed(0)}, ${e.cy.toFixed(0)}) semiassi ${e.rx.toFixed(0)} × ${e.ry.toFixed(0)} px, palpebra ${e.skin}`)

  await mkdir(OUT, { recursive: true })
  const scale = Math.min(1, MAX_W / img.w)
  const [ow, oh] = [Math.round(img.w * scale), Math.round(img.h * scale)]
  const out = join(OUT, `${nome}.webp`)
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${img.w}x${img.h}`, '-i', '-', '-vf', `scale=${ow}:${oh}:flags=lanczos`, '-c:v', 'libwebp', '-pix_fmt', 'yuva420p', '-quality', '90', '-compression_level', '6', '-map_metadata', '-1', out], { input: img.px })
  console.log(`  ✓ public/media/mascotte/${nome}.webp ${ow} × ${oh}`)

  const pct = (v, tot) => Number(((v / tot) * 100).toFixed(2))
  const prima = existsSync(MANIFEST) ? (await import(`${pathToFileURL(MANIFEST).href}?t=${Date.now()}`)).mascotte : {}
  const voce = {
    w: ow,
    h: oh,
    alt: m.alt,
    // centro e semiassi in percentuale: x e rx sulla larghezza, y e ry sull'altezza
    eyes: eyes.map((e) => ({ x: pct(e.cx, img.w), y: pct(e.cy, img.h), rx: pct(e.rx, img.w), ry: pct(e.ry, img.h), skin: e.skin })),
    nose: prima[nome]?.nose || null,
  }
  await scriviManifest({ ...prima, [nome]: voce })
}

async function scriviManifest(tutte) {
  const righe = Object.keys(tutte)
    .sort()
    .map((k) => {
      const v = tutte[k]
      const eyes = v.eyes.map((e) => `{ x: ${e.x}, y: ${e.y}, rx: ${e.rx}, ry: ${e.ry}, skin: '${e.skin}' }`).join(', ')
      const nose = v.nose ? `{ x: ${v.nose.x}, y: ${v.nose.y}, rx: ${v.nose.rx}, ry: ${v.nose.ry} }` : 'null'
      return `  ${k}: {\n    w: ${v.w},\n    h: ${v.h},\n    alt: '${String(v.alt).replace(/'/g, '\\\'')}',\n    eyes: [${eyes}],\n    nose: ${nose},\n  },`
    })
  await writeFile(
    MANIFEST,
    `// Generato da tools/mascotte/mascotte.mjs (occhi trovati dallo script; il naso si segna a mano).\n// Le mascotte in public/media/mascotte/<nome>.webp. Centro e semiassi in percentuale:\n// x e rx sulla larghezza dell'immagine, y e ry sull'altezza. \`skin\` è il colore della palpebra.\n// Le usa mascot() in src/templates/components/ui.js e src/client/mascot.js le anima.\n\nexport const mascotte = {\n${righe.join('\n')}\n}\n`,
  )
  console.log(`  src/data/mascotte.js: ${Object.keys(tutte).length} mascotte`)
}

const [cmd, nome, arg] = process.argv.slice(2)
if (cmd === 'genera' && nome) {
  for (const n of nome === 'tutte' ? Object.keys(mascotte) : [nome]) await genera(n)
} else if (cmd === 'usa' && nome && arg) {
  await usa(nome, arg)
} else if (cmd === 'recupera' && nome && arg) {
  mascotteDi(nome)
  await salva(await prediction(arg), join(LAVORO, nome), { mascotte: nome })
} else {
  die('uso: mascotte.mjs genera <nome|tutte> · usa <nome> <file.png> · recupera <nome> <id>')
}
