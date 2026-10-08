// Il tappeto della roulette: il disegno delle caselle sul feltro (SVG sul piano,
// nelle due orientazioni: di lato sulla scrivania, dalla testata sul telefono),
// le zone dove si punta (numero pieno, cavallo, terzina, carré, sestina, trio,
// 0-1-2-3, dozzine, colonne, chance semplici), come si trova la zona toccata e
// quanto paga ognuna.

import { ROSSI, colore } from './fisica.js'
import { svgEl } from './scena.js'

const FONT = '-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI Variable Display","Segoe UI",Roboto,Helvetica,Arial,sans-serif'
export const PAGA = { pieno: 35, cavallo: 17, terzina: 11, trio: 11, carre: 8, basket: 8, sestina: 5, dozzina: 2, colonna: 2, semplice: 1 }
export const NOMI = { pieno: 'numero pieno', cavallo: 'cavallo', terzina: 'terzina', trio: 'trio', carre: 'carré', basket: 'zero, uno, due e tre', sestina: 'sestina', dozzina: 'dozzina', colonna: 'colonna', semplice: '' }
const SEMPLICI = [
  { chiave: 'manque', nome: '1-18', numeri: Array.from({ length: 18 }, (_, i) => i + 1) },
  { chiave: 'pari', nome: 'pari', numeri: Array.from({ length: 18 }, (_, i) => 2 * (i + 1)) },
  { chiave: 'rosso', nome: 'rosso', numeri: [...ROSSI].sort((a, b) => a - b) },
  { chiave: 'nero', nome: 'nero', numeri: Array.from({ length: 36 }, (_, i) => i + 1).filter((n) => !ROSSI.has(n)) },
  { chiave: 'dispari', nome: 'dispari', numeri: Array.from({ length: 18 }, (_, i) => 2 * i + 1) },
  { chiave: 'passe', nome: '19-36', numeri: Array.from({ length: 18 }, (_, i) => i + 19) },
]

export function creaTavolo(S, el) {
  const T = { zone: [], perChiave: new Map(), G: null, aperto: true, giocatore: null }
  const svg = el.segni

  function geometria() {
    const M = S.M
    if (M.orient === 'largo') {
      const cw = 46, ch = 60, X0 = 650, Y0 = 150, zw = 54, dh = 42, cw2 = 44
      return {
        cw, ch, orient: 'largo', esterno: { u: 0, v: 1 }, latoZero: { u: -1, v: 0 }, mezzoEst: ch / 2, mezzoZero: cw / 2,
        cella: (c, r) => ({ x: X0 + (c - 1) * cw, y: Y0 + (2 - r) * ch, w: cw, h: ch }),
        zero: () => ({ x: X0 - zw, y: Y0, w: zw, h: 3 * ch }),
        dozzina: (k) => ({ x: X0 + 4 * k * cw, y: Y0 + 3 * ch, w: 4 * cw, h: dh }),
        semplice: (k) => ({ x: X0 + 2 * k * cw, y: Y0 + 3 * ch + dh, w: 2 * cw, h: dh }),
        colonna: (r) => ({ x: X0 + 12 * cw, y: Y0 + (2 - r) * ch, w: cw2, h: ch }),
        giocatore: { u: X0 + 6 * cw, v: Y0 + 3 * ch + 2 * dh + 54 }, rastrelliera: { u: M.rastrelliera.u, v: M.rastrelliera.v }, testo: 15, testoPiccolo: 11,
      }
    }
    const cw = 128, ch = 62, X0 = 222, Y0 = 754 + 56, zh = 56, dw = 66, ch2 = 46, gap = 6
    return {
      cw, ch, orient: 'alto', esterno: { u: -1, v: 0 }, latoZero: { u: 0, v: -1 }, mezzoEst: cw / 2, mezzoZero: ch / 2,
      cella: (c, r) => ({ x: X0 + r * cw, y: Y0 + (c - 1) * ch, w: cw, h: ch }),
      zero: () => ({ x: X0, y: Y0 - zh, w: 3 * cw, h: zh }),
      dozzina: (k) => ({ x: X0 - dw - gap, y: Y0 + 4 * k * ch, w: dw, h: 4 * ch }),
      semplice: (k) => ({ x: X0 + 3 * cw + gap, y: Y0 + 2 * k * ch, w: dw, h: 2 * ch }),
      colonna: (r) => ({ x: X0 + r * cw, y: Y0 + 12 * ch, w: cw, h: ch2 }),
      giocatore: { u: X0 + 1.5 * cw, v: Y0 + 12 * ch + ch2 + 56 }, rastrelliera: { u: M.rastrelliera.u, v: M.rastrelliera.v }, testo: 22, testoPiccolo: 14,
    }
  }
  const centro = (r) => ({ u: r.x + r.w / 2, v: r.y + r.h / 2 })
  const num = (c, r) => 3 * (c - 1) + r + 1

  function costruisci() {
    const M = S.M
    const G = geometria()
    T.G = G
    T.giocatore = G.giocatore
    T.zone = []; T.perChiave.clear()
    const zona = (z) => { z.pos = z.pos || centro(z.rect); T.zone.push(z); T.perChiave.set(z.chiave, z); return z }
    // caselle piene
    zona({ chiave: 'n0', tipo: 'pieno', numeri: [0], rect: G.zero(), nome: 'zero' })
    for (let c = 1; c <= 12; c++) for (let r = 0; r < 3; r++) { const n = num(c, r); zona({ chiave: `n${n}`, tipo: 'pieno', numeri: [n], rect: G.cella(c, r), nome: `${n} ${colore(n)}` }) }
    // punti: cavalli, carré, trii, basket, terzine, sestine
    const punto = (chiave, tipo, numeri, p, nome) => zona({ chiave, tipo, numeri, pos: p, punto: true, nome })
    const E = G.esterno, Z = G.latoZero
    for (let c = 1; c <= 12; c++) {
      for (let r = 0; r < 3; r++) {
        const a = centro(G.cella(c, r))
        if (c < 12) { const b = centro(G.cella(c + 1, r)); punto(`c${num(c, r)}-${num(c + 1, r)}`, 'cavallo', [num(c, r), num(c + 1, r)], { u: (a.u + b.u) / 2, v: (a.v + b.v) / 2 }, `cavallo ${num(c, r)} ${num(c + 1, r)}`) }
        if (r < 2) { const b = centro(G.cella(c, r + 1)); punto(`c${num(c, r)}-${num(c, r + 1)}`, 'cavallo', [num(c, r), num(c, r + 1)], { u: (a.u + b.u) / 2, v: (a.v + b.v) / 2 }, `cavallo ${num(c, r)} ${num(c, r + 1)}`) }
        if (c < 12 && r < 2) { const d = centro(G.cella(c + 1, r + 1)); const ns = [num(c, r), num(c, r + 1), num(c + 1, r), num(c + 1, r + 1)].sort((x, y) => x - y); punto(`q${ns.join('-')}`, 'carre', ns, { u: (a.u + d.u) / 2, v: (a.v + d.v) / 2 }, `carré ${ns.join(' ')}`) }
      }
      const a0 = centro(G.cella(c, 0))
      const ns3 = [num(c, 0), num(c, 1), num(c, 2)]
      punto(`t${ns3[0]}`, 'terzina', ns3, { u: a0.u + E.u * G.mezzoEst, v: a0.v + E.v * G.mezzoEst }, `terzina ${ns3.join(' ')}`)
      if (c < 12) { const b0 = centro(G.cella(c + 1, 0)); const ns6 = [...ns3, num(c + 1, 0), num(c + 1, 1), num(c + 1, 2)]; punto(`s${ns6[0]}`, 'sestina', ns6, { u: (a0.u + b0.u) / 2 + E.u * G.mezzoEst, v: (a0.v + b0.v) / 2 + E.v * G.mezzoEst }, `sestina ${ns6[0]}-${ns6[5]}`) }
    }
    for (let r = 0; r < 3; r++) { const a = centro(G.cella(1, r)); punto(`c0-${r + 1}`, 'cavallo', [0, r + 1], { u: a.u + Z.u * G.mezzoZero, v: a.v + Z.v * G.mezzoZero }, `cavallo 0 ${r + 1}`) }
    for (let r = 0; r < 2; r++) { const a = centro(G.cella(1, r)), b = centro(G.cella(1, r + 1)); punto(`t0-${r + 1}-${r + 2}`, 'trio', [0, r + 1, r + 2], { u: (a.u + b.u) / 2 + Z.u * G.mezzoZero, v: (a.v + b.v) / 2 + Z.v * G.mezzoZero }, `trio 0 ${r + 1} ${r + 2}`) }
    { const a = centro(G.cella(1, 0)); punto('b0123', 'basket', [0, 1, 2, 3], { u: a.u + Z.u * G.mezzoZero + E.u * G.mezzoEst, v: a.v + Z.v * G.mezzoZero + E.v * G.mezzoEst }, 'zero, uno, due e tre') }
    // esterne
    for (let k = 0; k < 3; k++) zona({ chiave: `d${k + 1}`, tipo: 'dozzina', numeri: Array.from({ length: 12 }, (_, i) => 12 * k + i + 1), rect: G.dozzina(k), nome: `${['prima', 'seconda', 'terza'][k]} dozzina` })
    for (let r = 0; r < 3; r++) zona({ chiave: `k${r + 1}`, tipo: 'colonna', numeri: Array.from({ length: 12 }, (_, i) => 3 * i + r + 1), rect: G.colonna(r), nome: `${['prima', 'seconda', 'terza'][r]} colonna` })
    SEMPLICI.forEach((s, k) => zona({ chiave: s.chiave, tipo: 'semplice', numeri: s.numeri, rect: G.semplice(k), nome: s.nome }))
    disegna()
  }

  function disegna() {
    const M = S.M, G = T.G
    svg.setAttribute('viewBox', `0 0 ${M.pw} ${M.ph}`)
    svg.style.width = M.pw + 'px'; svg.style.height = M.ph + 'px'
    svg.innerHTML = ''
    const defs = svgEl('defs', {}, svg)
    const sf = svgEl('filter', { id: 'stampa', x: '-5%', y: '-5%', width: '110%', height: '110%' }, defs)
    svgEl('feGaussianBlur', { stdDeviation: 0.35 }, sf)
    const fondo = svgEl('g', { filter: 'url(#stampa)' }, svg)
    const testi = svgEl('g', { 'font-family': FONT, 'font-weight': 600, fill: '#fff', 'text-anchor': 'middle', 'dominant-baseline': 'central', filter: 'url(#stampa)' }, svg)
    const linee = svgEl('g', { fill: 'none', stroke: 'rgba(255,255,255,.85)', 'stroke-width': 2, 'stroke-linejoin': 'round', filter: 'url(#stampa)' }, svg)
    const zone = svgEl('g', { class: 'zone' }, svg)
    const col = { rosso: 'rgba(205,30,50,.88)', nero: 'rgba(14,14,16,.82)', verde: 'rgba(22,135,72,.9)' }
    const rett = (r, fill, g = fondo) => svgEl('rect', { x: r.x, y: r.y, width: r.w, height: r.h, fill }, g)
    const testo = (p, s, size, extra = {}) => { const t = svgEl('text', { x: p.u, y: p.v, 'font-size': size, ...extra }, testi); t.textContent = s; return t }
    const angoloTesto = G.orient === 'alto' ? 0 : 0
    // zero e caselle
    for (const z of T.zone) {
      if (z.tipo === 'pieno') {
        rett(z.rect, col[colore(z.numeri[0])])
        svgEl('rect', { x: z.rect.x, y: z.rect.y, width: z.rect.w, height: z.rect.h }, linee)
        testo(centro(z.rect), String(z.numeri[0]), G.testo + (z.numeri[0] === 0 ? 4 : 0), { transform: angoloTesto ? `rotate(${angoloTesto} ${centro(z.rect).u} ${centro(z.rect).v})` : '' })
      } else if (z.tipo === 'dozzina' || z.tipo === 'colonna' || z.tipo === 'semplice') {
        rett(z.rect, 'rgba(255,255,255,.06)')
        svgEl('rect', { x: z.rect.x, y: z.rect.y, width: z.rect.w, height: z.rect.h }, linee)
        const c = centro(z.rect)
        let s = z.tipo === 'dozzina' ? `${['1ª', '2ª', '3ª'][z.numeri[0] === 1 ? 0 : z.numeri[0] === 13 ? 1 : 2]} 12` : z.tipo === 'colonna' ? '2 a 1' : z.nome
        if (z.chiave === 'rosso' || z.chiave === 'nero') {
          // il rombo del colore, come sui tappeti veri
          const r = Math.min(z.rect.w, z.rect.h) * 0.34
          svgEl('path', { d: `M ${c.u} ${c.v - r} L ${c.u + r * 0.72} ${c.v} L ${c.u} ${c.v + r} L ${c.u - r * 0.72} ${c.v} Z`, fill: z.chiave === 'rosso' ? col.rosso : col.nero, stroke: 'rgba(255,255,255,.85)', 'stroke-width': 1.5 }, fondo)
          s = ''
        }
        const ruota = G.orient === 'alto' && (z.tipo === 'dozzina' || z.tipo === 'semplice')
        if (s) testo(c, s, z.tipo === 'colonna' ? G.testoPiccolo : G.testo - 2, { transform: ruota ? `rotate(-90 ${c.u} ${c.v})` : '' })
      }
    }
    // zone toccabili: rettangoli per le caselle, cerchi per i punti (cavalli, carré, …)
    const tol = Math.min(G.cw, G.ch) * 0.3
    for (const z of T.zone) {
      const z1 = z.punto ? svgEl('circle', { cx: z.pos.u, cy: z.pos.v, r: tol, class: 'zona' }, zone) : svgEl('rect', { x: z.rect.x, y: z.rect.y, width: z.rect.w, height: z.rect.h, class: 'zona' }, zone)
      z1.dataset.chiave = z.chiave
      z.el = z1
    }
    T.tol = tol
  }

  /** La zona toccata in (u, v) del piano: prima i punti vicini (cavalli, carré…), poi la casella che contiene il punto. */
  T.colpisci = (u, v) => {
    let meglio = null, dmin = T.tol
    for (const z of T.zone) if (z.punto) { const d = Math.hypot(z.pos.u - u, z.pos.v - v); if (d < dmin) { dmin = d; meglio = z } }
    if (meglio) return meglio
    for (const z of T.zone) if (!z.punto) { const r = z.rect; if (u >= r.x && u <= r.x + r.w && v >= r.y && v <= r.y + r.h) return z }
    return null
  }
  let calda = null
  T.evidenzia = (z) => { if (calda === z) return; if (calda && calda.el) calda.el.classList.remove('caldo'); calda = z; if (z && z.el) z.el.classList.add('caldo') }
  T.vince = (z, n) => z.numeri.includes(n)
  T.paga = (z) => PAGA[z.tipo]
  T.descrivi = (z) => (z.tipo === 'pieno' ? `${z.numeri[0] === 0 ? 'zero' : z.numeri[0]}` : z.tipo === 'semplice' ? z.nome : z.nome)
  T.chiudi = () => { T.aperto = false; svg.classList.add('chiuso'); T.evidenzia(null) }
  T.apri = () => { T.aperto = true; svg.classList.remove('chiuso') }
  T.cellaNumero = (n) => T.perChiave.get(`n${n}`)
  T.rimisura = costruisci
  costruisci()
  return T
}
