#!/usr/bin/env node
// Misura i fogli della ruota disegnati da gpt-image-2: centro e raggio della
// conca, il buco del rotore, la pista chiara, gli otto deflettori di cromo (angolo
// e verso), così la fisica e il disegno usano le misure vere e non quelle chieste
// nel prompt. Stampa un JSON da incollare in ruota.js (RUOTA_IMG).
//
//   node tools/roulette/misura.mjs ruota tools/roulette/lavoro/ruota/<file>.png
//   node tools/roulette/misura.mjs rotore tools/roulette/lavoro/rotore/<file>.png

import { resolve } from 'node:path'
import { chiave, fondoMagenta, leggi } from '../mascotte/immagine.mjs'

const [cosa, file] = process.argv.slice(2)
const img = leggi(resolve(file))
if (fondoMagenta(img)) chiave(img, [30, 30, 32])
const { w, h, px } = img
const A = (x, y) => px[(y * w + x) * 4 + 3]
const RGB = (x, y) => { const i = (y * w + x) * 4; return [px[i], px[i + 1], px[i + 2]] }

// centro e raggio esterno: dal riquadro dei pixel pieni
let x0 = w, x1 = 0, y0 = h, y1 = 0
for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) if (A(x, y) > 128) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y) }
const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = ((x1 - x0) / 2 + (y1 - y0) / 2) / 2
console.log(`${cosa}: ${w} × ${h}, centro ${cx.toFixed(1)},${cy.toFixed(1)}, raggio esterno ${R.toFixed(1)} px (${((R / w) * 2 * 100).toFixed(1)} % della larghezza)`)

// il buco magenta al centro: dal centro verso fuori lungo 36 raggi
const raggiBuco = []
for (let k = 0; k < 36; k++) {
  const a = (k * Math.PI) / 18
  for (let r = 0; r < R; r++) { const x = Math.round(cx + r * Math.cos(a)), y = Math.round(cy + r * Math.sin(a)); if (A(x, y) > 128) { raggiBuco.push(r); break } }
}
const buco = raggiBuco.reduce((s, v) => s + v, 0) / raggiBuco.length
console.log(`buco centrale: raggio ${buco.toFixed(1)} px = ${((buco / R) * 100).toFixed(1)} % del raggio (min ${Math.min(...raggiBuco)}, max ${Math.max(...raggiBuco)})`)

// profilo radiale medio: luminosità e saturazione per raggio
const prof = []
for (let r = Math.round(buco) + 2; r < R; r += 2) {
  let l = 0, s = 0, n = 0
  for (let k = 0; k < 180; k++) {
    const a = (k * Math.PI) / 90
    const x = Math.round(cx + r * Math.cos(a)), y = Math.round(cy + r * Math.sin(a))
    if (x < 0 || y < 0 || x >= w || y >= h || A(x, y) < 128) continue
    const [rr, g, b] = RGB(x, y)
    const max = Math.max(rr, g, b), min = Math.min(rr, g, b)
    l += max; s += max ? (max - min) / max : 0; n++
  }
  prof.push({ r, l: l / n, s: s / n })
}
if (cosa === 'ruota') {
  // la pista chiara (acero): la fascia con luminosità alta
  const chiari = prof.filter((p) => p.l > 150)
  if (chiari.length) console.log(`pista chiara: da ${chiari[0].r} a ${chiari[chiari.length - 1].r} px = ${((chiari[0].r / R) * 100).toFixed(1)}–${((chiari[chiari.length - 1].r / R) * 100).toFixed(1)} % del raggio (centro ${(((chiari[0].r + chiari[chiari.length - 1].r) / 2 / R) * 100).toFixed(1)} %)`)
  // i deflettori: pixel di cromo (chiari e poco saturi) nella fascia dello scivolo, per angolo
  const scivolo = prof.filter((p) => p.r > buco + 10 && p.l < 120)
  const r0 = scivolo.length ? scivolo[0].r : buco + 10, r1 = chiari.length ? chiari[0].r - 4 : R * 0.7
  const perAngolo = new Float32Array(720)
  const perRaggio = new Map()
  for (let y = Math.round(cy - r1); y <= cy + r1; y++)
    for (let x = Math.round(cx - r1); x <= cx + r1; x++) {
      const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy)
      if (r < r0 || r > r1 || A(x, y) < 128) continue
      const [rr, g, b] = RGB(x, y)
      const max = Math.max(rr, g, b), min = Math.min(rr, g, b)
      if (max > 140 && (max - min) / max < 0.3) {
        const k = Math.round((((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360) * 2) % 720
        perAngolo[k]++
        const lista = perRaggio.get(k) || []; lista.push(r); perRaggio.set(k, lista)
      }
    }
  // picchi
  const picchi = []
  for (let k = 0; k < 720; k++) {
    let somma = 0
    for (let d = -6; d <= 6; d++) somma += perAngolo[(k + d + 720) % 720]
    if (somma > 40) picchi.push({ k, somma })
  }
  const gruppi = []
  for (const p of picchi) { const g = gruppi[gruppi.length - 1]; if (g && p.k - g.fine <= 3) { g.fine = p.k; g.somma += p.somma; g.peso += p.k * p.somma } else gruppi.push({ inizio: p.k, fine: p.k, somma: p.somma, peso: p.k * p.somma }) }
  if (gruppi.length > 1 && gruppi[0].inizio === 0 && gruppi[gruppi.length - 1].fine === 719) { const u = gruppi.pop(); gruppi[0].somma += u.somma; gruppi[0].peso += (u.peso - 720 * u.somma); gruppi[0].inizio = u.inizio - 720 }
  const defl = gruppi.map((g) => {
    const a = ((g.peso / g.somma / 2) + 360) % 360
    // verso: quanto si estende in raggio rispetto all'angolo
    const k0 = Math.round(a * 2)
    const raggi = []
    for (let d = -8; d <= 8; d++) raggi.push(...(perRaggio.get((k0 + d + 720) % 720) || []))
    const rmin = Math.min(...raggi), rmax = Math.max(...raggi)
    const larg = ((g.fine - g.inizio + 1) / 2) * (Math.PI / 180) * ((rmin + rmax) / 2)
    return { a: +a.toFixed(1), r: +(((rmin + rmax) / 2 / R) * 100).toFixed(1), lungo: rmax - rmin > larg * 1.2, estR: Math.round(rmax - rmin), estA: Math.round(larg) }
  })
  console.log(`deflettori (${defl.length}): ${defl.map((d) => `${d.a}° al ${d.r} % ${d.lungo ? 'lungo' : 'traverso'} (${d.estR}×${d.estA} px)`).join(' · ')}`)
  console.log(JSON.stringify({ cx: +(cx / w).toFixed(4), cy: +(cy / h).toFixed(4), R: +(R / w).toFixed(4), buco: +(buco / R).toFixed(3), pista: chiari.length ? +(((chiari[0].r + chiari[chiari.length - 1].r) / 2 / R).toFixed(3)) : null, pista0: chiari.length ? +((chiari[0].r / R).toFixed(3)) : null, pista1: chiari.length ? +((chiari[chiari.length - 1].r / R).toFixed(3)) : null, deflettori: defl.map((d) => ({ a: d.a, r: +(d.r / 100).toFixed(3), lungo: d.lungo })) }))
} else {
  // il rotore: l'anello d'ottone (chiaro e giallo), l'anello nero
  const ottone = prof.filter((p) => p.l > 150 && p.s > 0.3)
  if (ottone.length) console.log(`anello d'ottone: da ${ottone[0].r} a ${ottone[ottone.length - 1].r} px = ${((ottone[0].r / R) * 100).toFixed(1)}–${((ottone[ottone.length - 1].r / R) * 100).toFixed(1)} % del raggio`)
  const neri = prof.filter((p) => p.l < 60)
  if (neri.length) console.log(`anello nero: da ${neri[0].r} a ${neri[neri.length - 1].r} px = ${((neri[0].r / R) * 100).toFixed(1)}–${((neri[neri.length - 1].r / R) * 100).toFixed(1)} % del raggio`)
  console.log(JSON.stringify({ cx: +(cx / w).toFixed(4), cy: +(cy / h).toFixed(4), R: +(R / w).toFixed(4), buco: +(buco / R).toFixed(3), ottone: ottone.length ? +((ottone[0].r / R).toFixed(3)) : null }))
}
