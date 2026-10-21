#!/usr/bin/env node
// Gli atlanti della facciata per la scena 3D di pzkko.it (scena/fronte.js): i pezzi disegnati da gpt-image-2 nei fogli
// facciata, adesivi e porta (tools/pzkko/fogli.js, ritagliati da immagini.mjs in pzkko/art/<foglio>/) messi insieme in
// due immagini, così sulla facciata sono due chiamate di disegno e non venticinque:
//   graffiti.webp  i graffiti sull'intonaco (il pezzo «PZK», il divieto di affissione, le tag, il gesso, la pittura del comune)
//   adesivi.webp   gli adesivi (pluviale, telaio, muro) e quelli del vetro, il cartello «chiuso» e la targa del civico 28
// e le stesse a metà in lo/ (le anteprime: la scena le mette subito, le vere arrivano mentre la telecamera si avvicina;
// da lontano un graffito è largo quanto la sua anteprima). In pezzi.json dove sta ogni pezzo (u0 v0 u1 v1, con v da
// sotto come nelle trame di three) e quanti pixel è.
//
//   node tools/pzkko/scena/atlanti.mjs     (dalla cartella albertopecchini.it, dopo immagini.mjs usa facciata|adesivi|porta)

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const QUI = fileURLToPath(new URL('.', import.meta.url))
const ART = join(QUI, '../../../pzkko/art')
const OUT = join(ART, 'scena/muro')
const sharp = createRequire(join(QUI, '../../../package.json'))('sharp')

const ATLANTI = {
  graffiti: { larg: 1024, pezzi: [['facciata', ['pezzo-pzk', 'divieto', 'tag-mnt', 'tag-46100', 'tag-pekko', 'gesso', 'tag-gimbo', 'tag-2026', 'buff']]] },
  adesivi: { larg: 1024, pezzi: [['adesivi', ['hello', 'unimore', 'teschio', 'nutria', 'mn', 'concerto', 'strappato', 'pzkkonet', 'occhio']], ['porta', ['chiuso', 'civico', 'orario', 'fumare', 'video', 'spingere']]] },
}
const BORDO = 6 // px fra un pezzo e l'altro (le mipmap non devono mescolare i vicini)
// i pezzi senza colore (il gesso bianco, lo stencil e le tag nere, il pezzo argento col suo alone): la chiave del magenta
// ci lascia una velatura rosa (il gesso diventava rosa, lo stencil viola), che qui si toglie: dove resta del magenta
// (min(R, B) > G) il pixel diventa grigio della sua luminosità
const NEUTRI = new Set(['pezzo-pzk', 'divieto', 'tag-mnt', 'tag-46100', 'gesso', 'buff'])
const neutro = async (file) => {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  for (let i = 0; i < data.length; i += 4) {
    const m = Math.min(data[i], data[i + 2]) - data[i + 1]
    if (m <= 0) continue
    const l = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2], k = Math.min(1, m / 12)
    for (let c = 0; c < 3; c++) data[i + c] = Math.round(data[i + c] + (l - data[i + c]) * k)
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer()
}

const man = JSON.parse(await readFile(join(ART, 'pezzi.json'), 'utf8'))
const tutti = {}
await mkdir(join(OUT, 'lo'), { recursive: true })
for (const [nome, a] of Object.entries(ATLANTI)) {
  // i pezzi alla misura vera, a scaffali (righe riempite da sinistra, il più alto prima), larghi quanto serve per
  // stare in un quadrato; poi l'atlante si riduce a a.larg
  const lista = a.pezzi.flatMap(([foglio, nomi]) => nomi.map((n) => ({ foglio, n, ...(man[foglio]?.[n] ?? {}) })))
  for (const p of lista) if (!p.w) throw new Error(`manca ${p.foglio}/${p.n} in pezzi.json: prima immagini.mjs usa ${p.foglio}`)
  lista.sort((x, y) => y.h - x.h)
  const area = lista.reduce((s, p) => s + (p.w + BORDO) * (p.h + BORDO), 0)
  const L = Math.max(...lista.map((p) => p.w + BORDO * 2), Math.ceil(Math.sqrt(area) * 1.1))
  let x = BORDO, y = BORDO, riga = 0
  for (const p of lista) {
    if (x + p.w + BORDO > L) { x = BORDO; y += riga + BORDO; riga = 0 }
    p.x = x; p.y = y; x += p.w + BORDO; riga = Math.max(riga, p.h)
  }
  const A = y + riga + BORDO
  const tela = sharp({ create: { width: L, height: A, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(await Promise.all(lista.map(async (p) => ({ input: NEUTRI.has(p.n) ? await neutro(join(ART, p.foglio, `${p.n}.webp`)) : join(ART, p.foglio, `${p.n}.webp`), left: p.x, top: p.y }))))
  const piena = await tela.png().toBuffer()
  const k = Math.min(1, a.larg / L), lw = Math.round(L * k), lh = Math.round(A * k)
  for (const [dir, w, h, q] of [['', lw, lh, 78], ['lo/', Math.round(lw / 2), Math.round(lh / 2), 70]]) {
    const info = await sharp(piena).resize(w, h, { kernel: 'lanczos3' }).webp({ quality: q, alphaQuality: 90, effort: 6 }).toFile(join(OUT, `${dir}${nome}.webp`))
    console.log(`${dir}${nome}.webp ${w} × ${h}, ${(info.size / 1024).toFixed(0)} KB`)
  }
  tutti[nome] = Object.fromEntries(lista.map((p) => [p.n, { u0: +(p.x / L).toFixed(5), v0: +(1 - (p.y + p.h) / A).toFixed(5), u1: +((p.x + p.w) / L).toFixed(5), v1: +(1 - p.y / A).toFixed(5), w: Math.round(p.w * k), h: Math.round(p.h * k) }]))
}
await writeFile(join(OUT, 'pezzi.json'), JSON.stringify(tutti, null, 1) + '\n')
console.log('pezzi.json scritto')
