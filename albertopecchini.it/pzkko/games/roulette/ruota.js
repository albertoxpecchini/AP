// La ruota sul tavolo: la conca fotografata (fissa) e il rotore fotografato
// che gira, con sopra la corona dei trentasette numeri disegnata in SVG nelle
// misure vere della fisica (centimetri), i separatori in rilievo, l'anello
// esterno di metallo. La pallina e la torretta stanno sopra al piano, nello
// strato davanti, proiettate con la stessa prospettiva del tavolo.

import { GEOM, SEQUENZA, N, DELTA, posizione, colore } from './fisica.js'
import { svgEl, clamp } from './scena.js'

const deg = (r) => (r * 180) / Math.PI
const FONT = '-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI Variable Display","Segoe UI",Roboto,Helvetica,Arial,sans-serif'
const COLORI = { rosso: ['#e4303f', '#b3121f'], nero: ['#2a2a2e', '#0d0d0f'], verde: ['#2aa35c', '#146b3a'] }

// la corona: un settore per casella (fondo della casella + fascia del numero), i separatori, l'anello esterno
function corona(svg) {
  const r0 = GEOM.fondo, r1 = GEOM.numeri, r2 = GEOM.corona, r3 = GEOM.rotore
  const defs = svgEl('defs', {}, svg)
  for (const [nome, [a, b]] of Object.entries(COLORI)) {
    const g = svgEl('radialGradient', { id: `cas-${nome}`, cx: 0, cy: 0, r: r2, gradientUnits: 'userSpaceOnUse' }, defs)
    svgEl('stop', { offset: (r0 / r2).toFixed(3), 'stop-color': b }, g)
    svgEl('stop', { offset: ((r1 - 0.6) / r2).toFixed(3), 'stop-color': a }, g)
    svgEl('stop', { offset: (r1 / r2).toFixed(3), 'stop-color': b }, g)
    svgEl('stop', { offset: ((r1 + 0.3) / r2).toFixed(3), 'stop-color': a }, g)
    svgEl('stop', { offset: '1', 'stop-color': a }, g)
  }
  const metallo = svgEl('linearGradient', { id: 'metallo', x1: 0, y1: 0, x2: 1, y2: 0 }, defs)
  for (const [o, c] of [[0, '#5d5f63'], [0.35, '#f2f3f5'], [0.5, '#cfd2d6'], [0.65, '#8a8d92'], [1, '#3b3d41']]) svgEl('stop', { offset: o, 'stop-color': c }, metallo)
  const anello = svgEl('linearGradient', { id: 'anello', x1: 0, y1: 0, x2: 1, y2: 1 }, defs)
  for (const [o, c] of [[0, '#f0f1f3'], [0.3, '#9ea2a8'], [0.5, '#e8eaed'], [0.7, '#6f7378'], [1, '#d6d8db']]) svgEl('stop', { offset: o, 'stop-color': c }, anello)
  const velo = svgEl('radialGradient', { id: 'velo', cx: 0, cy: 0, r: r2, gradientUnits: 'userSpaceOnUse' }, defs)
  svgEl('stop', { offset: (r0 / r2).toFixed(3), 'stop-color': 'rgba(0,0,0,.55)' }, velo)
  svgEl('stop', { offset: ((r0 + 1.2) / r2).toFixed(3), 'stop-color': 'rgba(0,0,0,.18)' }, velo)
  svgEl('stop', { offset: (r1 / r2).toFixed(3), 'stop-color': 'rgba(0,0,0,0)' }, velo)
  svgEl('stop', { offset: '1', 'stop-color': 'rgba(255,255,255,.08)' }, velo)
  const ombra = svgEl('filter', { id: 'sep-ombra', x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs)
  svgEl('feDropShadow', { dx: 0.08, dy: 0.1, stdDeviation: 0.1, 'flood-color': '#000', 'flood-opacity': 0.7 }, ombra)

  // l'anello esterno di metallo del rotore
  svgEl('circle', { r: (r2 + r3) / 2, fill: 'none', stroke: 'url(#anello)', 'stroke-width': r3 - r2 }, svg)
  svgEl('circle', { r: r3 - 0.08, fill: 'none', stroke: 'rgba(0,0,0,.5)', 'stroke-width': 0.16 }, svg)
  // le caselle
  const sett = (ra, rb, a0, a1) => `M ${ra * Math.cos(a0)} ${ra * Math.sin(a0)} A ${ra} ${ra} 0 0 1 ${ra * Math.cos(a1)} ${ra * Math.sin(a1)} L ${rb * Math.cos(a1)} ${rb * Math.sin(a1)} A ${rb} ${rb} 0 0 0 ${rb * Math.cos(a0)} ${rb * Math.sin(a0)} Z`
  const gc = svgEl('g', {}, svg)
  for (let i = 0; i < N; i++) {
    const n = SEQUENZA[i]
    const a0 = (i - 0.5) * DELTA, a1 = (i + 0.5) * DELTA
    svgEl('path', { d: sett(r0, r2, a0, a1), fill: `url(#cas-${colore(n)})` }, gc)
  }
  svgEl('circle', { r: (r0 + r2) / 2, fill: 'none', stroke: 'url(#velo)', 'stroke-width': r2 - r0 }, svg)
  // la riga fra i numeri e le caselle
  svgEl('circle', { r: r1, fill: 'none', stroke: 'rgba(255,255,255,.35)', 'stroke-width': 0.1 }, svg)
  // i numeri: in piedi verso l'esterno
  const gn = svgEl('g', { 'font-family': FONT, 'font-weight': 700, 'font-size': 1.42, fill: '#fff', 'text-anchor': 'middle', 'letter-spacing': -0.04 }, svg)
  for (let i = 0; i < N; i++) {
    const n = SEQUENZA[i]
    const t = svgEl('text', { transform: `rotate(${deg(i * DELTA) + 90}) translate(0,${-(r1 + r2) / 2 + 0.52})`, 'dominant-baseline': 'auto' }, gn)
    t.textContent = String(n)
  }
  // i separatori in rilievo: una lama chiara e una scura, dal fondo fin sopra i numeri
  const gs = svgEl('g', { filter: 'url(#sep-ombra)' }, svg)
  for (let i = 0; i < N; i++) {
    const a = (i + 0.5) * DELTA
    const g = svgEl('g', { transform: `rotate(${deg(a)})` }, gs)
    svgEl('rect', { x: r0 - 0.2, y: -0.19, width: r2 - r0 + 0.25, height: 0.38, rx: 0.12, fill: 'url(#metallo)' }, g)
    svgEl('rect', { x: r0 - 0.2, y: -0.19, width: r2 - r0 + 0.25, height: 0.12, rx: 0.06, fill: 'rgba(255,255,255,.55)' }, g)
    svgEl('circle', { cx: r2 - 0.1, cy: 0, r: 0.24, fill: '#d9dbdf', stroke: '#5a5d62', 'stroke-width': 0.05 }, g)
  }
  // il bordo interno delle caselle (la parete verso l'ottone)
  svgEl('circle', { r: r0, fill: 'none', stroke: 'rgba(0,0,0,.6)', 'stroke-width': 0.3 }, svg)
}

export function creaRuota(S, el, PZ, art, F) {
  const R = { el, F, u: 0, v: 0 }
  const box = el.ruota
  box.innerHTML = ''
  const incasso = document.createElement('div'); incasso.className = 'incasso'; box.appendChild(incasso)
  const conca = document.createElement('img'); conca.src = `${art}ruota/conca.webp`; conca.alt = ''; conca.decoding = 'async'; box.appendChild(conca)
  const rot = document.createElement('div'); rot.className = 'rotore'; box.appendChild(rot)
  const rimg = document.createElement('img'); rimg.src = `${art}rotore/rotore.webp`; rimg.alt = ''; rimg.decoding = 'async'; rot.appendChild(rimg)
  const svg = svgEl('svg', { viewBox: `${-GEOM.rotore} ${-GEOM.rotore} ${2 * GEOM.rotore} ${2 * GEOM.rotore}`, xmlns: 'http://www.w3.org/2000/svg' }, rot)
  corona(svg)
  const ombra = document.createElement('div'); ombra.className = 'ombra'; box.appendChild(ombra)

  // nello strato davanti: la torretta (disegnata, gira col rotore) e la pallina (fotografata)
  const davanti = S.el.davanti
  const gT = svgEl('g', {}, davanti)
  const defs = svgEl('defs', {}, gT)
  const cromo = svgEl('linearGradient', { id: 'cromo', x1: 0, y1: 0, x2: 1, y2: 0 }, defs)
  for (const [o, c] of [[0, '#3f4247'], [0.25, '#f4f5f7'], [0.45, '#b9bcc2'], [0.6, '#eceef0'], [0.8, '#6c7075'], [1, '#2f3236']]) svgEl('stop', { offset: o, 'stop-color': c }, cromo)
  const cromoV = svgEl('linearGradient', { id: 'cromo-v', x1: 0, y1: 0, x2: 0, y2: 1 }, defs)
  for (const [o, c] of [[0, '#f6f7f9'], [0.4, '#9da1a7'], [0.55, '#e4e6e9'], [1, '#474a4f']]) svgEl('stop', { offset: o, 'stop-color': c }, cromoV)
  const pomo = svgEl('radialGradient', { id: 'pomo', cx: 0.35, cy: 0.3, r: 0.75 }, defs)
  for (const [o, c] of [[0, '#ffffff'], [0.35, '#c9ccd1'], [0.75, '#5c6065'], [1, '#2a2d31']]) svgEl('stop', { offset: o, 'stop-color': c }, pomo)
  const base = svgEl('ellipse', { fill: 'url(#cromo)', stroke: 'rgba(0,0,0,.45)', 'stroke-width': 0.6 }, gT)
  const bracciDietro = svgEl('g', {}, gT)
  const colonna = svgEl('path', { fill: 'url(#cromo)', stroke: 'rgba(0,0,0,.35)', 'stroke-width': 0.4 }, gT)
  const collo = svgEl('ellipse', { fill: 'url(#cromo-v)' }, gT)
  const bracciDavanti = svgEl('g', {}, gT)
  const cima = svgEl('circle', { fill: 'url(#pomo)', stroke: 'rgba(0,0,0,.35)', 'stroke-width': 0.3 }, gT)
  const bracci = []
  for (let k = 0; k < 4; k++) {
    const g = svgEl('g', {})
    const l = svgEl('line', { stroke: '#d9dce0', 'stroke-width': 3, 'stroke-linecap': 'round' }, g)
    const l2 = svgEl('line', { stroke: '#5a5e63', 'stroke-width': 1.2, 'stroke-linecap': 'round', opacity: 0.7 }, g)
    const c = svgEl('circle', { fill: 'url(#pomo)', stroke: 'rgba(0,0,0,.35)', 'stroke-width': 0.3 }, g)
    bracci.push({ g, l, l2, c })
  }
  const pallaG = svgEl('g', { style: 'display:none' }, davanti)
  const pd = PZ.oggetti && PZ.oggetti.pallina
  if (pd) svgEl('image', { href: `${art}oggetti/pallina.webp`, width: pd.w, height: pd.h, x: -pd.w / 2, y: -pd.h / 2, preserveAspectRatio: 'none' }, pallaG)
  else svgEl('circle', { r: 160, fill: '#efe9d6' }, pallaG)
  const TOR = { base: 3.4, colonna: 1.3, alto: 10, bracci: 7.4, hBracci: 6.2, pomo: 1.6, pomello: 1.05 }

  R.cm = (x, y) => ({ u: R.u + x * S.M.ppc, v: R.v + y * S.M.ppc }) // dal centro della ruota, in cm, al piano
  R.pista = (a) => R.cm(GEOM.pista * Math.cos(a), GEOM.pista * Math.sin(a))
  R.torretta = () => ({ ...R.cm(0, 0), h: TOR.alto })
  R.rimisura = () => {
    const M = S.M, ppc = M.ppc
    R.u = M.ruota.u; R.v = M.ruota.v
    const D = 2 * GEOM.R * ppc, Dr = 2 * GEOM.rotore * ppc
    box.style.left = (R.u - D / 2) + 'px'; box.style.top = (R.v - D / 2) + 'px'; box.style.width = D + 'px'; box.style.height = D + 'px'
    incasso.style.cssText = `left:${D * 0.03}px;top:${D * 0.03}px;width:${D * 0.94}px;height:${D * 0.94}px`
    conca.style.cssText = `left:0;top:0;width:${D}px;height:${D}px`
    rot.style.cssText = `left:${(D - Dr) / 2}px;top:${(D - Dr) / 2}px;width:${Dr}px;height:${Dr}px;will-change:transform`
    // la torretta (la parte fissa): base, colonna, collo, pomo
    const c0 = S.proj(R.u, R.v, 0), c1 = S.proj(R.u, R.v, TOR.alto), cc = S.proj(R.u, R.v, TOR.hBracci)
    const px = (h) => S.proj(R.u + ppc, R.v, h).x - S.proj(R.u, R.v, h).x // px per cm in orizzontale, a quota h
    const sx0 = px(0), sx1 = px(TOR.alto)
    const squash = Math.cos((M.tilt * Math.PI) / 180) * 0.9
    base.setAttribute('cx', c0.x); base.setAttribute('cy', c0.y); base.setAttribute('rx', TOR.base * sx0); base.setAttribute('ry', TOR.base * sx0 * squash)
    const w0 = TOR.colonna * 1.5 * sx0, w1 = TOR.colonna * sx1
    colonna.setAttribute('d', `M ${c0.x - w0} ${c0.y} C ${c0.x - w0} ${c0.y - (c0.y - c1.y) * 0.35} ${c0.x - w1 * 0.9} ${c0.y - (c0.y - c1.y) * 0.6} ${c1.x - w1} ${c1.y} L ${c1.x + w1} ${c1.y} C ${c0.x + w1 * 0.9} ${c0.y - (c0.y - c1.y) * 0.6} ${c0.x + w0} ${c0.y - (c0.y - c1.y) * 0.35} ${c0.x + w0} ${c0.y} Z`)
    collo.setAttribute('cx', cc.x); collo.setAttribute('cy', cc.y); collo.setAttribute('rx', TOR.colonna * 1.35 * px(TOR.hBracci)); collo.setAttribute('ry', TOR.colonna * 1.35 * px(TOR.hBracci) * squash)
    cima.setAttribute('cx', c1.x); cima.setAttribute('cy', c1.y - TOR.pomo * sx1 * 0.5); cima.setAttribute('r', TOR.pomo * sx1)
    for (const b of bracci) { b.l.setAttribute('stroke-width', 0.85 * sx1); b.l2.setAttribute('stroke-width', 0.3 * sx1); b.c.setAttribute('r', TOR.pomello * sx1) }
    R.aggiorna()
  }
  R.aggiorna = () => {
    const M = S.M, ppc = M.ppc
    const a = F.rotore.a
    rot.style.transform = `rotate(${deg(a).toFixed(2)}deg)`
    // le braccia della torretta, in 3D, dietro o davanti alla colonna a seconda di dove cadono
    const cc = S.proj(R.u, R.v, TOR.hBracci)
    const dietro = [], davantiA = []
    for (let k = 0; k < 4; k++) {
      const ak = a + (k * Math.PI) / 2
      const e = S.proj(R.u + TOR.bracci * ppc * Math.cos(ak), R.v + TOR.bracci * ppc * Math.sin(ak), TOR.hBracci)
      const b = bracci[k]
      b.l.setAttribute('x1', cc.x); b.l.setAttribute('y1', cc.y); b.l.setAttribute('x2', e.x); b.l.setAttribute('y2', e.y)
      b.l2.setAttribute('x1', cc.x); b.l2.setAttribute('y1', cc.y + 0.25 * ppc * e.f); b.l2.setAttribute('x2', e.x); b.l2.setAttribute('y2', e.y + 0.25 * ppc * e.f)
      b.c.setAttribute('cx', e.x); b.c.setAttribute('cy', e.y)
      ;(e.y < cc.y ? dietro : davantiA).push(b.g)
    }
    bracciDietro.replaceChildren(...dietro); bracciDavanti.replaceChildren(...davantiA)
    // la pallina e la sua ombra
    const p = posizione(F)
    if (!p) { pallaG.style.display = 'none'; ombra.style.display = 'none'; return }
    const u = R.u + p.x * ppc, v = R.v + p.y * ppc
    const q = S.proj(u, v, p.z + GEOM.pallina)
    const d = 2 * GEOM.pallina * ppc * q.f
    const sc = pd ? d / pd.w : d / 320
    pallaG.style.display = ''
    pallaG.setAttribute('transform', `translate(${q.x.toFixed(2)},${q.y.toFixed(2)}) scale(${sc.toFixed(5)})`)
    const alt = clamp(p.z / 8, 0, 1)
    ombra.style.display = ''
    ombra.style.transform = `translate(${u.toFixed(1)}px,${v.toFixed(1)}px) scale(${(ppc * 0.19 * (1 + alt * 1.2)).toFixed(3)})`
    ombra.style.opacity = (1 - alt * 0.75).toFixed(2)
  }
  R.rimisura()
  return R
}
