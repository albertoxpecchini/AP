#!/usr/bin/env node
// Scontorna una fotografia: fondo trasparente con bria/remove-background su Replicate.
//
//   node tools/scontorna.mjs <foto.jpg> [<uscita.png>]
//
// Il modello separa soggetto e fondo senza ridisegnare nulla (a differenza di
// gpt-image-2, che rifarebbe il volto). L'uscita, di default accanto alla foto
// come <nome>-scontornata.png, è la foto originale con l'alpha del modello.
//
// Decontaminazione: nei pixel semitrasparenti del bordo (i capelli) il colore
// della foto è ancora un misto di soggetto e fondo, e su una pagina scura
// lascerebbe un alone chiaro. Il fondo si stima dai bordi della foto (mediana) e
// si toglie: soggetto = (osservato − (1 − a) · fondo) / a.

import { writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve, parse, join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { die, upload, predict } from './replicate.mjs'

const MODEL = 'bria/remove-background'
const [src, dst] = process.argv.slice(2)
if (!src) die('uso: node tools/scontorna.mjs <foto> [<uscita.png>]')
const file = resolve(src)
if (!existsSync(file)) die(`non trovo ${file}`)
const { dir, name } = parse(file)
const out = dst ? resolve(dst) : join(dir, `${name}-scontornata.png`)

const rgba = (f, scale) => execFileSync('ffmpeg', ['-loglevel', 'error', '-i', f, ...(scale ? ['-vf', `scale=${scale}:flags=lanczos`] : []), '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'], { maxBuffer: 1 << 28 })
const size = (f) => execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', f]).toString().trim().split(',').map(Number)

// L'uscita grezza del modello resta accanto all'uscita finché il lavoro non va a
// buon fine: se c'è già (una prova interrotta), si riusa senza ripagare.
const tmp = `${out}.modello.png`
if (existsSync(tmp)) {
  console.log(`→ ${name}: riuso l'uscita del modello già scaricata`)
} else {
  console.log(`→ ${name}: carico la foto e la mando a ${MODEL}…`)
  const p = await predict({ image: await upload(file), preserve_alpha: true }, `(predizione da scaricare a mano dalla dashboard di Replicate)`, MODEL)
  const url = [p.output].flat()[0]
  const res = await fetch(url)
  if (!res.ok) die(`download ${url}: ${res.status}`)
  await writeFile(tmp, Buffer.from(await res.arrayBuffer()))
}

// Il modello può restituire l'immagine ridotta (1240×1594 → 796×1023): dell'uscita
// serve solo l'alpha, che si porta alla misura della foto; i pixel restano quelli
// originali, a piena risoluzione.
const [w, h] = size(file)
const [mw, mh] = size(tmp)
if (mw !== w || mh !== h) console.log(`  il modello ha restituito ${mw} × ${mh}: porto la maschera a ${w} × ${h}`)
const foto = rgba(file)
const mask = rgba(tmp, mw !== w || mh !== h ? `${w}:${h}` : null)

// fondo: mediana dei pixel sui bordi dove il modello dice «fondo»
const bordo = [[], [], []]
const prendi = (x, y) => {
  const i = (y * w + x) * 4
  if (mask[i + 3] < 8) for (let k = 0; k < 3; k++) bordo[k].push(foto[i + k])
}
for (let x = 0; x < w; x += 2) prendi(x, 0), prendi(x, h - 1)
for (let y = 0; y < h; y += 2) prendi(0, y), prendi(w - 1, y)
if (!bordo[0].length) die('nessun pixel di fondo sui bordi: la foto è già ritagliata sul soggetto?')
const fondo = bordo.map((v) => v.sort((a, b) => a - b)[v.length >> 1])

// ── Rifinitura dei bordi scuri su fondo chiaro (i capelli) ───────────────────
// Tra le ciocche il modello lascia a metà trasparenza pixel che sono fondo puro:
// su una pagina scura diventano puntini chiari. Dove il soggetto è molto più
// scuro del fondo, la copertura vera si legge dal colore (difference matting):
//   a = (L_fondo − L_pixel) / (L_fondo − L_soggetto vicino)
// con L_soggetto la luminanza media dei pixel pieni nei dintorni. Vale nella
// fascia entro BANDA px dal soggetto, così tornano anche i capelli sottili che il
// modello aveva tagliato; pelle e orecchie, poco più scure del fondo, tengono
// l'alpha del modello.
const BANDA = 36
const R = 12 // raggio della media dei pixel pieni
const CONTRASTO = 60 // differenza di luminanza minima perché valga il colore
const lum = (i) => 0.2126 * foto[i] + 0.7152 * foto[i + 1] + 0.0722 * foto[i + 2]
const Lb = 0.2126 * fondo[0] + 0.7152 * fondo[1] + 0.0722 * fondo[2]

// «Come il fondo»: grigio neutro e chiaro quanto il fondo. Tra le ciocche il
// modello ne segna alcuni come pieni: non contano come soggetto nella media qui
// sotto e, se toccano il fondo esterno, tornano fondo (riempimento più avanti).
const comeFondo = (i) =>
  lum(i) >= Lb - 12 && Math.max(Math.abs(foto[i] - foto[i + 1]), Math.abs(foto[i + 1] - foto[i + 2]), Math.abs(foto[i] - foto[i + 2])) <= 10

// immagini integrali: conteggio dei pixel pieni e somma dei loro colori
const W1 = w + 1
const cnt = new Float64Array(W1 * (h + 1))
const sums = [0, 1, 2, 3].map(() => new Float64Array(W1 * (h + 1)))
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4
    const pieno = mask[i + 3] > 242 && !comeFondo(i) ? 1 : 0
    const o = (y + 1) * W1 + x + 1
    const up = o - W1
    cnt[o] = pieno + cnt[o - 1] + cnt[up] - cnt[up - 1]
    const vals = [foto[i], foto[i + 1], foto[i + 2], lum(i)]
    for (let k = 0; k < 4; k++) sums[k][o] = pieno * vals[k] + sums[k][o - 1] + sums[k][up] - sums[k][up - 1]
  }
}
const box = (arr, x, y, r) => {
  const x0 = Math.max(0, x - r), y0 = Math.max(0, y - r), x1 = Math.min(w, x + r + 1), y1 = Math.min(h, y + r + 1)
  return arr[y1 * W1 + x1] - arr[y0 * W1 + x1] - arr[y1 * W1 + x0] + arr[y0 * W1 + x0]
}

const A = new Float32Array(w * h) // alpha finale, 0–1
const FG = new Float32Array(w * h * 3).fill(-1) // colore del soggetto vicino, dove serve
let rifiniti = 0
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const p = y * w + x
    const i = p * 4
    let a = mask[i + 3] / 255
    // tutti i semitrasparenti del modello, più i trasparenti vicini al soggetto
    // (i capelli sottili tagliati): limitarsi a una fascia lascerebbe bordi dritti
    if (a < 0.95 && (a > 0 || box(cnt, x, y, BANDA) > 0)) {
      // Colore del soggetto vicino: le medie su tre finestre (R, 3R, 9R) si
      // mescolano in proporzione a quanti pixel pieni contengono. Passare
      // dall'una all'altra di colpo fa saltare l'alpha sul bordo della finestra
      // quadrata, e sul fondo scuro si vedono rettangoli.
      const ref = [9 * R, 3 * R, R].reduce((acc, r, k) => {
        const n = box(cnt, x, y, r)
        if (!n) return acc
        const s = { L: box(sums[3], x, y, r) / n, c: [0, 1, 2].map((j) => box(sums[j], x, y, r) / n) }
        if (!acc) return s
        const t = Math.min(1, n / [0, 200, 80][k])
        return { L: acc.L + (s.L - acc.L) * t, c: acc.c.map((v, j) => v + (s.c[j] - v) * t) }
      }, null)
      if (ref && Lb - ref.L >= CONTRASTO) {
        a = Math.max(0, Math.min(1, (Lb - lum(i)) / (Lb - ref.L)))
        if (a < 0.1) a = 0 // rumore e leggere ombre del fondo, non capelli
        for (let k = 0; k < 3; k++) FG[p * 3 + k] = ref.c[k]
        rifiniti++
      }
    }
    A[p] = a < 0.02 ? 0 : a
  }
}

// Riempimento dal fondo esterno: ciò che è «come il fondo» e lo tocca, torna
// fondo. Il colletto bianco resta: è chiuso tra collo e maglia; la pelle ferma
// il riempimento perché non è un grigio neutro.
let tolti = 0
const stack = []
for (let p = 0; p < w * h; p++) if (A[p] === 0) stack.push(p)
while (stack.length) {
  const p = stack.pop()
  const x = p % w
  for (const q of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, p - w, p + w]) {
    if (q < 0 || q >= w * h || A[q] === 0 || !comeFondo(q * 4)) continue
    A[q] = 0
    tolti++
    stack.push(q)
  }
}

const pulita = Buffer.alloc(w * h * 4)
for (let p = 0; p < w * h; p++) {
  const a = A[p]
  if (!a) continue // resta tutto a zero: trasparente
  const i = p * 4
  const fg = FG[p * 3] >= 0
  for (let k = 0; k < 3; k++) {
    const o = foto[i + k]
    const f = a > 0.98 ? o : a < 0.3 && fg ? FG[p * 3 + k] : (o - (1 - a) * fondo[k]) / a
    pulita[i + k] = Math.max(0, Math.min(255, Math.round(f)))
  }
  pulita[i + 3] = Math.round(a * 255)
}
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${w}x${h}`, '-i', '-', out], { input: pulita })
console.log(`✓ ${out} (${w} × ${h}, fondo rgb(${fondo.join(', ')}); ${rifiniti} pixel di bordo rifiniti dal colore, ${tolti} pixel di fondo tolti tra le ciocche)`)
console.log(`  l'uscita grezza del modello resta in ${tmp}: rilanciando lo script si riusa`)
