#!/usr/bin/env node
// Le illustrazioni a pixel di pzkkopedia (2.11): le mattonelle della pagina principale che non hanno una foto del sito
// (la memoria di Claude). Lo stesso modello delle icone di pzkko, retro-diffusion/rd-plus su Replicate (la regola di
// Alberto del 26.10: «tieni il modello per sempre»), ma una scena larga 16:9 invece di un'icona: niente bordo d'adesivo,
// niente fondo tolto. Il PNG del modello resta in tools/pzkko/lavoro/wiki/illustra/, il sito prende il WebP ingrandito senza
// sfumare (nearest) in pzkko/wiki/img/<nome>.webp.
//
//   node tools/pzkko/wiki/illustra.mjs                 tutte
//   node tools/pzkko/wiki/illustra.mjs memoria         solo quella
//   node tools/pzkko/wiki/illustra.mjs --rifai         senza Replicate: rielabora i PNG già scaricati
import sharp from 'sharp'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT, api } from '../../replicate.mjs'

const MODELLO = 'retro-diffusion/rd-plus'
const LAVORO = join(ROOT, 'tools/pzkko/lavoro/wiki/illustra')
const IMG = join(ROOT, 'pzkko/wiki/img')
const LUMACHINA = 'a cute cartoon snail with a brown spiral shell, green body and black sunglasses'
// [nome, larghezza, altezza, prompt] (in pixel del disegno; il sito lo ingrandisce di PER volte)
const SCENE = {
  memoria: [192, 108, `${LUMACHINA} sitting at a small wooden desk in a cozy room at night, reading a big open notebook full of handwritten notes and little sticky notes, a desk lamp with warm light, a wooden card-index drawer with labeled index cards behind it, a few framed notes pinned on the wall, simple pixel art scene, flat colors, clean shapes, warm palette`],
}
const PER = 5

async function genera(input) {
  for (let prova = 1; ; prova++) {
    try {
      let p = await api(`/models/${MODELLO}/predictions`, { method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'wait=60' }, body: JSON.stringify({ input }) })
      while (!['succeeded', 'failed', 'canceled'].includes(p.status)) { await new Promise((ok) => setTimeout(ok, 2500)); p = await api(p.urls.get) }
      if (p.status !== 'succeeded') throw new Error(`${p.status}: ${String(p.error ?? '').slice(0, 160)}`)
      return [p.output].flat()
    } catch (e) { if (prova >= 3) throw e; console.log(`  riprovo (${e.message})`) }
  }
}

const rifai = process.argv.includes('--rifai')
const chiesti = process.argv.slice(2).filter((a) => !a.startsWith('--'))
await mkdir(LAVORO, { recursive: true })
for (const [nome, [w, h, prompt]] of Object.entries(SCENE)) {
  if (chiesti.length && !chiesti.includes(nome)) continue
  const png = join(LAVORO, `${nome}.png`)
  if (!rifai || !existsSync(png)) {
    console.log(`${nome}: rd-plus ${w} × ${h}…`)
    const [url] = await genera({ prompt, style: 'default', width: w, height: h, remove_bg: false, num_images: 1 })
    await writeFile(png, Buffer.from(await (await fetch(url)).arrayBuffer()))
    await writeFile(join(LAVORO, `${nome}.json`), JSON.stringify({ modello: MODELLO, prompt, width: w, height: h, data: new Date().toISOString() }, null, 2))
  }
  const img = sharp(await readFile(png)), m = await img.metadata()
  await img.resize({ width: m.width * PER, height: m.height * PER, kernel: 'nearest' }).webp({ lossless: true }).toFile(join(IMG, `${nome}.webp`))
  console.log(`  → pzkko/wiki/img/${nome}.webp (${m.width * PER} × ${m.height * PER})`)
}
