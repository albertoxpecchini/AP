// La roulette di pzkko.it, in una finestra sopra il muro. Il tavolo, le fiches e
// il foglio sono cose ferme (SVG e fotografie); la ruota è 3D (three.js) e la
// pallina la muove la fisica (Rapier, vedi ruota.js): rotola, rallenta, cade,
// sbatte sui rombi e sulle palette e si ferma dove si ferma. Soldi finti ($pzk,
// gli stessi del blackjack e degli altri giochi: ../pzk.js).
//
// index.html la apre con import('/games/roulette/roulette.js').then((m) => m.apri()).

import { NUMERI, N, DELTA, R_PALLINA, STATORE, ROTORE, PALETTA, ROMBI, colore, verticiRombo } from './ruota.js'
import { PUNTATE, PUNTATE_PER_ID, FICHES, esito, inFiches } from './regole.js'
import * as pzk from '../pzk.js'

const QUI = new URL('.', import.meta.url).href
const ART = '/art/'
const CHIAVE = 'pzkko-roulette'
const RIDOTTO = matchMedia('(prefers-reduced-motion: reduce)')
const fmt = pzk.fmt
const attendi = (ms) => new Promise((r) => setTimeout(r, ms))
const svgEl = (tag, attr = {}) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const [k, v] of Object.entries(attr)) e.setAttribute(k, v); return e }

// ── lo stato del gioco ───────────────────────────────────────────────────────
const GIOCO = 'roulette'
const stato = {
  storia: [],
  giocate: new Map(), // id → importo sul tavolo
  mosse: [], // le fiches posate, in ordine (per «togli»)
  ultime: null, // le giocate dell'ultimo giro (per «rifai»)
  fiche: 5, // la fiche scelta
  fase: 'punta', // 'punta' | 'gira' | 'paga'
  veloce: false,
}
function carica() {
  try {
    const s = JSON.parse(localStorage.getItem(CHIAVE) || 'null')
    if (s && Array.isArray(s.storia)) stato.storia = s.storia.filter((n) => Number.isInteger(n) && n >= 0 && n <= 36).slice(0, 12)
    // le giocate dell'ultimo giro si ricordano anche ricaricando, per «rifai» (23.10, Alberto: «memorizza sempre le azioni»)
    const ult = Array.isArray(s?.ultime) ? s.ultime.filter(([id, imp]) => PUNTATE_PER_ID.has(id) && Number.isFinite(imp) && imp > 0) : []
    if (ult.length) stato.ultime = new Map(ult)
  } catch {}
}
// qui gli ultimi numeri e le giocate dell'ultimo giro: i $pzk li tiene ../pzk.js (le fiches sul tavolo comprese)
function salva() { try { localStorage.setItem(CHIAVE, JSON.stringify({ storia: stato.storia, ultime: stato.ultime ? [...stato.ultime] : null })) } catch {} }
const puntato = () => [...stato.giocate.values()].reduce((a, b) => a + b, 0)

// ── la finestra ──────────────────────────────────────────────────────────────
let dlg, el = {}, pronta = false, motore = null

export async function apri() {
  if (!dlg) await costruisci()
  if (!dlg.open) {
    dlg.classList.remove('chiude')
    dlg.showModal()
    disegnaTavolo()
    ridisegnaPile(false)
    aggiornaBanco()
  }
  if (!motore) motore = avviaMotore().catch((e) => { console.error(e); el.carica.textContent = 'la ruota non si è caricata: riprova più tardi' })
  else riprendi()
}

async function costruisci() {
  carica()
  // il CSS prima di mostrare la finestra
  await new Promise((ok) => {
    const l = document.createElement('link')
    l.rel = 'stylesheet'; l.href = QUI + 'roulette.css'
    l.onload = ok; l.onerror = ok
    document.head.appendChild(l)
  })
  dlg = document.createElement('dialog')
  dlg.className = 'rl'
  dlg.setAttribute('aria-labelledby', 'rl-titolo')
  dlg.innerHTML = `
    <div class="rl-dentro">
      <header class="rl-testa">
        <h2 id="rl-titolo">roulette</h2>
        <p class="rl-voce" aria-live="polite"></p>
        <button class="rl-chiudi" type="button" aria-label="chiudi la roulette"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M9 10c7 6 14 13 22 21M30 8c-6 8-13 15-21 23"/></svg></button>
      </header>
      <div class="rl-ruota">
        <canvas aria-label="la ruota della roulette, in 3D" role="img"></canvas>
        <p class="rl-carica">la ruota arriva…</p>
        <p class="rl-annuncio" aria-hidden="true"></p>
      </div>
      <div class="rl-banco">
        <p class="rl-saldo"><small>hai</small><b></b><span class="puntato"></span></p>
        <div class="rl-scegli" role="group" aria-label="scegli la fiche"></div>
        <div class="rl-tasti">
          <button class="rl-piccolo rl-togli" type="button">togli</button>
          <button class="rl-piccolo rl-rifai" type="button">rifai</button>
          <button class="rl-piccolo rl-veloce" type="button" aria-pressed="false" title="la pallina corre tre volte più in fretta">×3</button>
          <button class="rl-gira" type="button">gira</button>
        </div>
      </div>
      <div class="rl-tavolo">
        <div class="rl-campo"><svg aria-label="il tavolo delle puntate" role="group"></svg><div class="rl-fiches"></div></div>
        <div class="rl-sotto"><ol class="rl-storia" aria-label="gli ultimi numeri usciti"></ol><p class="rl-nota">soldi finti: niente premi, niente pagamenti.</p></div>
      </div>
    </div>`
  document.body.appendChild(dlg)
  const q = (s) => dlg.querySelector(s)
  el = {
    voce: q('.rl-voce'), chiudi: q('.rl-chiudi'), ruota: q('.rl-ruota'), canvas: q('canvas'), carica: q('.rl-carica'), annuncio: q('.rl-annuncio'),
    saldo: q('.rl-saldo b'), puntato: q('.rl-saldo .puntato'), scegli: q('.rl-scegli'), togli: q('.rl-togli'), rifai: q('.rl-rifai'), veloce: q('.rl-veloce'),
    gira: q('.rl-gira'), campo: q('.rl-campo'), svg: q('.rl-campo svg'), fiches: q('.rl-fiches'), storia: q('.rl-storia'),
  }
  // chi mi segue su instagram riceve 1.000 $pzk (una volta, ../pzk.js)
  q('.rl-saldo').appendChild(pzk.linkInstagram({ fatto: () => { voce(`grazie del follow: +${fmt(pzk.PREMIO_IG)} $pzk`); contaSaldo(pzk.saldo() - pzk.PREMIO_IG, pzk.saldo(), RIDOTTO.matches ? 0 : 900) } }))
  // col conto, gli EUR€ parcheggiati nel wallet: si giocano solo convertiti in $pzk (../pzk.js, wallet/)
  q('.rl-saldo').appendChild(pzk.rigaEuro())
  // le fiches da scegliere
  for (const v of FICHES) {
    const b = document.createElement('button')
    b.type = 'button'
    b.dataset.v = v
    b.setAttribute('aria-label', `fiche da ${v}`)
    b.setAttribute('aria-pressed', String(v === stato.fiche))
    b.innerHTML = `<img src="${ART}fiches/f${v}.webp" alt="" width="170" height="174">`
    b.addEventListener('click', () => { stato.fiche = v; aggiornaBanco() })
    el.scegli.appendChild(b)
  }
  el.chiudi.addEventListener('click', chiudi)
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); chiudi() })
  dlg.addEventListener('click', (e) => { if (e.target === dlg) chiudi() }) // clic sul fondo scuro
  el.gira.addEventListener('click', gira)
  el.togli.addEventListener('click', togli)
  el.rifai.addEventListener('click', rifai)
  el.veloce.addEventListener('click', () => { stato.veloce = !stato.veloce; el.veloce.setAttribute('aria-pressed', String(stato.veloce)) })
  new ResizeObserver(() => { if (dlg.open) { disegnaTavolo(); ridisegnaPile(false); ridimensiona?.() } }).observe(el.campo)
  new ResizeObserver(() => ridimensiona?.()).observe(el.ruota)
  document.addEventListener('visibilitychange', () => { if (!document.hidden) ultimo = performance.now() })
  pronta = true
  voce(!pzk.aSecco() ? 'scegli una fiche e punta' : 'hai finito i $pzk')
  pzk.ascolta(() => { if (!contando) aggiornaBanco() }) // il saldo cambia anche giocando a blackjack
  aggiornaBanco()
  aggiornaStoria()
}

function chiudi() {
  if (!dlg?.open || dlg.classList.contains('chiude')) return
  const fine = () => { dlg.close(); dlg.classList.remove('chiude'); ferma(); if (location.hash === '#roulette') history.replaceState(null, '', location.pathname + location.search) }
  if (RIDOTTO.matches) return fine()
  dlg.classList.add('chiude')
  setTimeout(fine, 220)
}

function voce(t) { if (el.voce) el.voce.textContent = t }

function aggiornaBanco() {
  el.saldo.textContent = `$pzk ${fmt(pzk.saldo())}`
  const p = puntato()
  el.puntato.textContent = p ? `sul tavolo: ${fmt(p)}` : ''
  const punta = stato.fase === 'punta'
  for (const b of el.scegli.children) {
    const v = Number(b.dataset.v)
    b.setAttribute('aria-pressed', String(v === stato.fiche))
    b.disabled = !punta
  }
  el.togli.disabled = !punta || !stato.mosse.length
  el.rifai.disabled = !punta || !stato.ultime || stato.giocate.size > 0
  el.gira.disabled = !punta || !motore || !ruota
  if (punta && pzk.aSecco() && !stato.giocate.size) {
    el.gira.textContent = 'ricarica'
    el.gira.disabled = false
  } else el.gira.textContent = 'gira'
  dlg.classList.toggle('chiuso', !punta)
}

function aggiornaStoria() {
  el.storia.innerHTML = stato.storia.map((n) => `<li class="${colore(n)}" aria-label="${n} ${colore(n)}">${n}</li>`).join('')
}

// ── il tavolo (SVG, stampato sul foglio) ────────────────────────────────────
// Le misure si ricalcolano dallo spazio che c'è: tre colonne di numeri, a
// sinistra le dozzine e le semplici, lo zero sopra, le colonne «2:1» sotto.
let T = null // la geometria del tavolo in px del campo
function geometria() {
  const w = el.campo.clientWidth, h = el.campo.clientHeight
  const E = Math.round(w * 0.125), D = Math.round(w * 0.125)
  const C = (w - E - D - 2) / 3
  const Z = Math.max(30, Math.min(44, h * 0.085)), K = Math.max(26, Math.min(34, h * 0.07))
  const H = (h - Z - K - 2) / 12
  const x0 = E + D + 1, y0 = Z + 1
  return { w, h, E, D, C, Z, K, H, x0, y0 }
}
// dove sta una puntata (il punto dove si posa la pila)
function punto(p) {
  const { C, H, x0, y0, E, D, Z, K } = T, d = p.dove
  switch (d.tipo) {
    case 'zero': return { x: x0 + 1.5 * C, y: y0 - Z / 2 }
    case 'cella': case 'verticale': case 'orizzontale': case 'bordo': case 'incrocio': return { x: x0 + d.x * C, y: y0 + d.y * H }
    case 'colonna': return { x: x0 + (d.c + 0.5) * C, y: y0 + 12 * H + K / 2 }
    case 'dozzina': return { x: E + D / 2, y: y0 + (d.d * 4 + 2) * H }
    case 'semplice': return { x: E / 2, y: y0 + (d.s * 2 + 1) * H }
  }
}
// la zona cliccabile di una puntata
function zona(p) {
  const { C, H, x0, y0, E, D, Z, K } = T, d = p.dove, c = punto(p)
  const s = Math.min(C, H)
  switch (d.tipo) {
    case 'zero': return { x: x0, y: y0 - Z, w: 3 * C, h: Z }
    case 'cella': return { x: x0 + (d.x - 0.5) * C + 6, y: y0 + (d.y - 0.5) * H + 5, w: C - 12, h: H - 10 }
    case 'verticale': return { x: c.x - 6, y: c.y - H * 0.32, w: 12, h: H * 0.64 }
    case 'orizzontale': return { x: c.x - C * 0.32, y: c.y - 5, w: C * 0.64, h: 10 }
    case 'bordo': return { x: c.x - 7, y: c.y - H * 0.32, w: 14, h: H * 0.64 }
    case 'incrocio': return { x: c.x - Math.min(9, s * 0.3), y: c.y - Math.min(9, s * 0.3), w: Math.min(18, s * 0.6), h: Math.min(18, s * 0.6), tondo: true }
    case 'colonna': return { x: x0 + d.c * C, y: y0 + 12 * H, w: C, h: K }
    case 'dozzina': return { x: E, y: y0 + d.d * 4 * H, w: D, h: 4 * H }
    case 'semplice': return { x: 0, y: y0 + d.s * 2 * H, w: E, h: 2 * H }
  }
}
// il rettangolo di un numero (per evidenziarlo)
function cella(n) {
  const { C, H, x0, y0, Z } = T
  if (n === 0) return { x: x0, y: y0 - Z, w: 3 * C, h: Z }
  return { x: x0 + ((n - 1) % 3) * C, y: y0 + (Math.ceil(n / 3) - 1) * H, w: C, h: H }
}

function disegnaTavolo() {
  if (!el.campo || !el.campo.clientWidth) return
  T = geometria()
  const { w, h, E, D, C, Z, K, H, x0, y0 } = T
  const svg = el.svg
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`)
  svg.innerHTML = ''
  // l'inchiostro: un po' di grana e un bordo appena irregolare, come la stampa del muro
  const defs = svgEl('defs')
  defs.innerHTML = `<filter id="rl-ink" x="-2%" y="-2%" width="104%" height="104%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" result="d"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -.55 1.22" result="g"/><feComposite in="d" in2="g" operator="in"/></filter>`
  svg.appendChild(defs)
  const stampa = svgEl('g', { filter: 'url(#rl-ink)' })
  svg.appendChild(stampa)
  const ink = '#161616', rosso = '#b3121f', verde = '#0b5d2b'
  const rect = (x, y, ww, hh, a = {}) => stampa.appendChild(svgEl('rect', { x, y, width: ww, height: hh, fill: 'none', stroke: ink, 'stroke-width': 1.6, ...a }))
  const testo = (t, x, y, a = {}) => { const e = svgEl('text', { x, y, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: ink, 'font-size': Math.min(H * 0.62, C * 0.36), ...a }); e.textContent = t; stampa.appendChild(e); return e }
  // lo zero: un frontone verde
  stampa.appendChild(svgEl('path', { d: `M${x0} ${y0} L${x0} ${y0 - Z + 8} Q${x0} ${y0 - Z} ${x0 + 8} ${y0 - Z} L${x0 + 3 * C - 8} ${y0 - Z} Q${x0 + 3 * C} ${y0 - Z} ${x0 + 3 * C} ${y0 - Z + 8} L${x0 + 3 * C} ${y0}`, fill: verde, 'fill-opacity': '.9', stroke: ink, 'stroke-width': 1.6 }))
  testo('0', x0 + 1.5 * C, y0 - Z / 2, { fill: '#fff', 'font-size': Z * 0.62 })
  // i numeri: rossi e neri pieni, il numero bianco
  for (let n = 1; n <= 36; n++) {
    const c = cella(n)
    rect(c.x, c.y, c.w, c.h, { fill: colore(n) === 'rosso' ? rosso : ink, 'fill-opacity': colore(n) === 'rosso' ? '.92' : '.9' })
    testo(String(n), c.x + c.w / 2, c.y + c.h / 2 + 1, { fill: '#fff' })
  }
  // le colonne 2:1
  for (let k = 0; k < 3; k++) { rect(x0 + k * C, y0 + 12 * H, C, K); testo('2:1', x0 + (k + 0.5) * C, y0 + 12 * H + K / 2, { 'font-size': K * 0.5 }) }
  // le dozzine
  for (let d = 0; d < 3; d++) {
    rect(E, y0 + d * 4 * H, D, 4 * H)
    const t = testo(`${['1ª', '2ª', '3ª'][d]} 12`, 0, 0, { 'font-size': Math.min(D * 0.48, 20), transform: `translate(${E + D / 2} ${y0 + (d * 4 + 2) * H}) rotate(-90)` })
    t.removeAttribute('x'); t.removeAttribute('y')
  }
  // le semplici
  const nomi = ['1-18', 'pari', null, null, 'dispari', '19-36']
  for (let s = 0; s < 6; s++) {
    const y = y0 + s * 2 * H
    rect(0, y, E, 2 * H)
    if (nomi[s]) { const t = testo(nomi[s], 0, 0, { 'font-size': Math.min(E * 0.44, 18), transform: `translate(${E / 2} ${y + H}) rotate(-90)` }); t.removeAttribute('x'); t.removeAttribute('y') }
    else {
      // il rombo rosso e quello nero
      const cx = E / 2, cy = y + H, rx = E * 0.3, ry = H * 0.62
      stampa.appendChild(svgEl('path', { d: `M${cx} ${cy - ry} L${cx + rx} ${cy} L${cx} ${cy + ry} L${cx - rx} ${cy} Z`, fill: s === 2 ? rosso : ink, stroke: ink, 'stroke-width': 1.2 }))
    }
  }
  // l'evidenziatore (le caselle coperte dalla puntata sotto il puntatore)
  T.evid = svgEl('g', { class: 'rl-evid', 'aria-hidden': 'true' })
  svg.appendChild(T.evid)
  // il cerchio a pennarello sul numero uscito
  T.segno = svgEl('g', { 'aria-hidden': 'true' })
  svg.appendChild(T.segno)
  // le zone: prima le celle, poi i bordi e gli incroci (sopra, per poterli prendere)
  const ordine = { zero: 0, cella: 0, colonna: 0, dozzina: 0, semplice: 0, bordo: 1, verticale: 1, orizzontale: 1, incrocio: 2 }
  const zone = svgEl('g')
  for (const p of [...PUNTATE].sort((a, b) => ordine[a.dove.tipo] - ordine[b.dove.tipo])) {
    const z = zona(p)
    const tastiera = ['zero', 'cella', 'colonna', 'dozzina', 'semplice'].includes(p.dove.tipo)
    const e = z.tondo ? svgEl('circle', { cx: z.x + z.w / 2, cy: z.y + z.h / 2, r: z.w / 2 }) : svgEl('rect', { x: z.x, y: z.y, width: z.w, height: z.h })
    e.setAttribute('class', 'rl-zona')
    e.dataset.id = p.id
    if (tastiera) { e.setAttribute('tabindex', '0'); e.setAttribute('role', 'button'); e.setAttribute('aria-label', `${p.nome}, paga ${p.paga} a 1`) } else e.setAttribute('aria-hidden', 'true')
    zone.appendChild(e)
  }
  svg.appendChild(zone)
  zone.addEventListener('pointerover', (e) => { const id = e.target.dataset?.id; if (id) evidenzia(id) })
  zone.addEventListener('pointerout', () => evidenzia(null))
  zone.addEventListener('focusin', (e) => { const id = e.target.dataset?.id; if (id) evidenzia(id) })
  zone.addEventListener('focusout', () => evidenzia(null))
  zone.addEventListener('click', (e) => { const id = e.target.dataset?.id; if (id) posa(id, e) })
  // col dito non c'è «il puntatore se ne va»: l'evidenziatore si spegne da solo
  zone.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') setTimeout(() => evidenzia(null), 900) })
  zone.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.dataset?.id) { e.preventDefault(); posa(e.target.dataset.id, null) } })
  if (stato.vinto != null) segnaNumero(stato.vinto, false)
}

function evidenzia(id) {
  if (!T) return
  T.evid.innerHTML = ''
  if (!id) { if (stato.fase === 'punta') voce(stato.giocate.size ? 'puoi ancora puntare, poi gira' : 'scegli una fiche e punta'); return }
  const p = PUNTATE_PER_ID.get(id)
  for (const n of p.numeri) { const c = cella(n); T.evid.appendChild(svgEl('rect', { x: c.x + 1, y: c.y + 1, width: c.w - 2, height: c.h - 2 })) }
  if (stato.fase === 'punta') { const g = stato.giocate.get(id); voce(`${p.nome}: paga ${p.paga} a 1${g ? ` · ci sono ${fmt(g)}` : ''}`) }
}

// ── le fiches sul tavolo ─────────────────────────────────────────────────────
const pile = new Map() // id → { el, fiches: [valori] }
function pila(id) {
  let p = pile.get(id)
  if (!p) {
    const e = document.createElement('div')
    e.className = 'rl-pila'
    el.fiches.appendChild(e)
    p = { el: e, fiches: [] }
    pile.set(id, p)
  }
  const c = punto(PUNTATE_PER_ID.get(id))
  p.el.style.transform = `translate(${c.x}px, ${c.y}px)`
  return p
}
const ALTO = 2.6 // px fra una fiche e quella sopra
function immagineFiche(v, i) {
  const img = document.createElement('img')
  img.className = 'rl-fiche'
  img.src = `${ART}fiches/f${v}.webp`
  img.alt = ''
  const k = Math.min(i, 9)
  // un po' storte, come le posa una mano
  const r = ((v * 37 + i * 101) % 23) - 11
  img.style.transform = `translate(${((i * 7) % 3) - 1}px, ${-k * ALTO}px) rotate(${r}deg)`
  img.style.zIndex = String(i)
  return img
}
function ridisegnaPile() {
  for (const [id, p] of pile) {
    pila(id)
    p.el.replaceChildren(...p.fiches.map((v, i) => immagineFiche(v, i)))
  }
}
// il centro di un elemento, in coordinate della pagina
const centro = (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } }
const nelCampo = (c) => { const r = el.campo.getBoundingClientRect(); return { x: r.left + c.x, y: r.top + c.y } }

/** Una fiche che vola da a a b (coordinate della finestra), con l'arco, l'ombra e un rimbalzo. */
function vola(v, a, b, { durata = 380, alto = 40, ruota = 0, dopo = 0, svanisce = false, scala = 1 } = {}) {
  if (RIDOTTO.matches) return Promise.resolve()
  const img = document.createElement('img')
  img.className = 'rl-volo'
  img.src = `${ART}fiches/f${v}.webp`
  img.alt = ''
  dlg.appendChild(img)
  const mx = (a.x + b.x) / 2, my = Math.min(a.y, b.y) - alto
  const anim = img.animate([
    { transform: `translate(${a.x}px, ${a.y}px) scale(1) rotate(0deg)`, filter: 'drop-shadow(0 2px 2px rgba(0,0,0,.3))', opacity: 1 },
    { offset: 0.5, transform: `translate(${mx}px, ${my}px) scale(${1.3 * scala}) rotate(${ruota / 2}deg)`, filter: 'drop-shadow(0 14px 10px rgba(0,0,0,.22))', opacity: 1 },
    { transform: `translate(${b.x}px, ${b.y}px) scale(${scala}) rotate(${ruota}deg)`, filter: 'drop-shadow(0 2px 2px rgba(0,0,0,.3))', opacity: svanisce ? 0 : 1 },
  ], { duration: durata, delay: dopo, easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'forwards' })
  return anim.finished.then(() => img.remove(), () => img.remove())
}
// il colpetto della pila quando ci cade sopra una fiche
function colpetto(p) {
  if (RIDOTTO.matches) return
  p.el.animate([{ transform: p.el.style.transform + ' scale(1)' }, { transform: p.el.style.transform + ' scale(.9, .94)', offset: 0.35 }, { transform: p.el.style.transform + ' scale(1)' }], { duration: 160, easing: 'ease-out' })
}

async function posa(id, evento) {
  if (stato.fase !== 'punta') { voce('rien ne va plus: aspetta la pallina'); return }
  const v = stato.fiche
  if (!pzk.punta(GIOCO, v)) { voce(pzk.saldo() >= 1 ? `non ti bastano: hai ${fmt(pzk.saldo())} $pzk` : 'hai finito i $pzk'); scuoti(el.saldo); return }
  if (stato.vinto != null) togliSegno()
  stato.giocate.set(id, (stato.giocate.get(id) ?? 0) + v)
  stato.mosse.push({ id, v })
  const p = pila(id)
  const i = p.fiches.length
  p.fiches.push(v)
  const img = immagineFiche(v, i)
  img.style.visibility = 'hidden'
  p.el.appendChild(img)
  aggiornaBanco()
  evidenzia(id)
  salva()
  const da = centro(el.scegli.querySelector(`[data-v="${v}"] img`))
  const c = punto(PUNTATE_PER_ID.get(id))
  const a = nelCampo({ x: c.x, y: c.y - Math.min(i, 9) * ALTO })
  await vola(v, da, a, { ruota: ((v * 37 + i * 101) % 23) - 11, alto: 30 + Math.random() * 30 })
  img.style.visibility = ''
  colpetto(p)
}

function togli() {
  if (stato.fase !== 'punta' || !stato.mosse.length) return
  const { id, v } = stato.mosse.pop()
  const p = pile.get(id)
  const img = p.el.lastElementChild
  const da = img ? centro(img) : null
  p.fiches.pop()
  img?.remove()
  if (!p.fiches.length) { p.el.remove(); pile.delete(id) }
  const resto = stato.giocate.get(id) - v
  if (resto > 0) stato.giocate.set(id, resto); else stato.giocate.delete(id)
  pzk.ritira(GIOCO, v)
  aggiornaBanco()
  salva()
  if (da) vola(v, da, centro(el.scegli.querySelector(`[data-v="${v}"] img`)), { durata: 300, alto: 24 })
}

async function rifai() {
  if (stato.fase !== 'punta' || !stato.ultime || stato.giocate.size) return
  const tot = [...stato.ultime.values()].reduce((a, b) => a + b, 0)
  if (tot > pzk.saldo()) { voce(`per rifare servono ${fmt(tot)} $pzk`); scuoti(el.saldo); return }
  const prima = stato.fiche
  for (const [id, imp] of stato.ultime) for (const v of inFiches(imp)) { stato.fiche = v; posa(id); await attendi(RIDOTTO.matches ? 0 : 70) }
  stato.fiche = prima
  aggiornaBanco()
}

function scuoti(e) {
  if (RIDOTTO.matches) return
  e.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(0)' }], { duration: 300 })
}

// il segno sul numero uscito: il cerchio a pennarello e il segnaposto di cristallo
function segnaNumero(n, anima = true) {
  if (!T) return
  togliSegno(false)
  const c = cella(n)
  const cx = c.x + c.w / 2, cy = c.y + c.h / 2, rx = c.w * 0.5 + 3, ry = c.h * 0.5 + 4
  // un cerchio a mano: un'ellisse che non si chiude bene
  const pts = []
  for (let k = 0; k <= 40; k++) { const t = -0.6 + (k / 40) * (Math.PI * 2 + 0.5), j = 1 + 0.05 * Math.sin(k * 1.7); pts.push(`${(cx + rx * j * Math.cos(t)).toFixed(1)} ${(cy + ry * j * Math.sin(t)).toFixed(1)}`) }
  const path = svgEl('path', { class: 'rl-cerchio', d: `M${pts.join(' L')}` })
  T.segno.appendChild(path)
  if (anima && !RIDOTTO.matches) {
    const L = path.getTotalLength()
    path.style.strokeDasharray = L
    path.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { duration: 420, easing: 'ease-out', fill: 'forwards' })
  }
  const d = document.createElement('img')
  d.className = 'rl-dolly'
  d.src = `${ART}fiches/dolly.webp`
  d.alt = ''
  d.style.transform = `translate(${cx + c.w * 0.28}px, ${cy}px)`
  el.fiches.appendChild(d)
  T.dolly = d
  if (anima && !RIDOTTO.matches) d.animate([{ transform: `translate(${cx + c.w * 0.28}px, ${cy - 60}px) scale(1.5)`, opacity: 0 }, { transform: `translate(${cx + c.w * 0.28}px, ${cy}px) scale(1)`, opacity: 1 }], { duration: 360, easing: 'cubic-bezier(.3,1.4,.5,1)' })
}
function togliSegno(tutto = true) {
  if (!T) return
  T.segno.innerHTML = ''
  T.dolly?.remove()
  T.dolly = null
  if (tutto) stato.vinto = null
}

// ── il giro ──────────────────────────────────────────────────────────────────
async function gira() {
  if (stato.fase !== 'punta') return
  if (pzk.aSecco() && !stato.giocate.size) {
    const dati = pzk.ricarica()
    aggiornaBanco()
    voce(dati ? `altri ${fmt(pzk.INIZIALE)} $pzk finti: punta` : pzk.perche())
    return
  }
  if (!ruota) return
  togliSegno()
  stato.fase = 'gira'
  stato.giro = new Map(stato.giocate)
  aggiornaBanco()
  T?.evid.replaceChildren()
  voce(stato.giocate.size ? 'rien ne va plus' : 'giro senza puntate: guarda e basta')
  el.annuncio.classList.remove('si')
  ruota.gira({ presa: 0.9 })
}

// la pallina si è fermata: il numero, il segno, le fiches perse e quelle vinte
async function fermata(n) {
  stato.fase = 'paga'
  stato.vinto = n
  stato.storia.unshift(n)
  stato.storia = stato.storia.slice(0, 12)
  aggiornaStoria()
  const col = colore(n)
  el.annuncio.textContent = `${n} ${col}`
  el.annuncio.className = `rl-annuncio ${col}`
  void el.annuncio.offsetWidth
  el.annuncio.classList.add('si')
  segnaNumero(n)
  const giocate = stato.giro ?? new Map()
  const conto = esito(giocate, n)
  voce(giocate.size ? (conto.netto > 0 ? `${n} ${col}: vinci ${fmt(conto.torna)} $pzk` : conto.torna ? `${n} ${col}: ti tornano ${fmt(conto.torna)} $pzk` : `${n} ${col}: il banco si prende tutto`) : `${n} ${col}`)
  await attendi(RIDOTTO.matches ? 0 : 700)

  // le perse: le fiches scivolano via verso il banco (in cima al tavolo), una pila alla volta
  const banco = nelCampo({ x: T.x0 + 1.5 * T.C, y: -10 })
  const voli = []
  let k = 0
  for (const id of conto.perse) {
    const p = pile.get(id)
    if (!p) continue
    const imgs = [...p.el.children]
    imgs.forEach((img, j) => {
      const da = centro(img)
      img.style.visibility = 'hidden'
      voli.push(vola(p.fiches[j], da, { x: banco.x + (j - imgs.length / 2) * 3, y: banco.y }, { durata: 520, alto: 14, dopo: k * 70 + j * 28, svanisce: true, scala: 0.7, ruota: 40 }))
    })
    k++
  }
  await Promise.all(voli)
  for (const id of conto.perse) { const p = pile.get(id); p?.el.remove(); pile.delete(id) }

  // le vinte: dal banco arriva la vincita accanto alla pila, poi tutto torna al giocatore
  if (conto.vinte.length) {
    const arrivi = []
    k = 0
    for (const id of conto.vinte) {
      const p = pile.get(id)
      if (!p) continue
      const imp = giocate.get(id), paga = PUNTATE_PER_ID.get(id).paga
      const vincita = inFiches(imp * paga)
      const c = punto(PUNTATE_PER_ID.get(id))
      const accanto = document.createElement('div')
      accanto.className = 'rl-pila'
      accanto.style.transform = `translate(${c.x + 15}px, ${c.y + 3}px)`
      el.fiches.appendChild(accanto)
      p.vincita = { el: accanto, fiches: vincita }
      vincita.slice(0, 14).forEach((v, j) => {
        const img = immagineFiche(v, j)
        img.style.visibility = 'hidden'
        accanto.appendChild(img)
        const a = nelCampo({ x: c.x + 15, y: c.y + 3 - Math.min(j, 9) * ALTO })
        arrivi.push(vola(v, banco, a, { durata: 460, alto: 26, dopo: k * 90 + j * 45 }).then(() => { img.style.visibility = '' }))
      })
      k++
    }
    await Promise.all(arrivi)
    await attendi(RIDOTTO.matches ? 0 : 650)
    // tutto al giocatore: verso il saldo
    const dove = centro(el.saldo)
    const ritorni = []
    k = 0
    for (const id of conto.vinte) {
      const p = pile.get(id)
      if (!p) continue
      for (const grp of [p, p.vincita]) {
        ;[...grp.el.children].forEach((img, j) => {
          const da = centro(img)
          img.style.visibility = 'hidden'
          ritorni.push(vola(grp.fiches[j] ?? 1, da, dove, { durata: 480, alto: 34, dopo: k * 60 + j * 22, svanisce: true, scala: 0.8 }))
        })
      }
      k++
    }
    contaSaldo(pzk.saldo(), pzk.saldo() + conto.torna, RIDOTTO.matches ? 0 : 900)
    await Promise.all(ritorni)
    for (const id of conto.vinte) { const p = pile.get(id); p?.vincita?.el.remove(); p?.el.remove(); pile.delete(id) }
  }
  pzk.regola(GIOCO, conto.puntato, conto.torna)
  if (giocate.size) stato.ultime = giocate
  stato.giocate = new Map()
  stato.mosse = []
  stato.giro = null
  pile.clear()
  el.fiches.querySelectorAll('.rl-pila').forEach((e) => e.remove())
  salva()
  stato.fase = 'punta'
  aggiornaBanco()
  if (pzk.aSecco()) voce(`${n} ${col}. hai finito i $pzk: ricarica`)
}

let contando = false
function contaSaldo(da, a, durata) {
  if (!durata) { el.saldo.textContent = `$pzk ${fmt(a)}`; return }
  contando = true
  const t0 = performance.now()
  const passo = (t) => {
    const u = Math.min(1, (t - t0) / durata), e = 1 - (1 - u) ** 3
    el.saldo.textContent = `$pzk ${fmt(Math.round((da + (a - da) * e) * 2) / 2)}`
    if (u < 1) requestAnimationFrame(passo)
    else contando = false
  }
  requestAnimationFrame(passo)
}

// ── la ruota 3D e la fisica ──────────────────────────────────────────────────
let THREE, ruota = null, renderer, scena, camera, rotoreGrp, pallina, raf = 0, ultimo = 0, accumulo = 0, ridimensiona = null

async function avviaMotore() {
  const [three, rap, { Ruota, FISICA }] = await Promise.all([import(QUI + 'lib/three.js'), import(QUI + 'lib/rapier.mjs'), import(QUI + 'ruota.js')])
  THREE = three
  const RAPIER = rap.default
  await RAPIER.init()
  await document.fonts.load('400 120px Anton').catch(() => {})
  ruota = new Ruota(RAPIER)
  ruota.FISICA = FISICA
  costruisciScena()
  el.carica.remove()
  aggiornaBanco()
  riprendi()
}

function riprendi() {
  if (!renderer || raf) return
  ultimo = performance.now()
  raf = requestAnimationFrame(ciclo)
}
function ferma() { cancelAnimationFrame(raf); raf = 0 }

function ciclo(t) {
  raf = requestAnimationFrame(ciclo)
  const dt = Math.min(0.1, (t - ultimo) / 1000)
  ultimo = t
  if (document.hidden) return
  const passo = ruota.FISICA.dt
  accumulo += dt * (stato.veloce && stato.fase === 'gira' ? 3 : 1)
  let n = 0
  while (accumulo >= passo && n < 64) {
    accumulo -= passo
    n++
    const e = ruota.passo()
    if (e === 'nonvale') { voce('no spin: la pallina si rilancia'); setTimeout(() => ruota.stato === 'nonvale' && ruota.gira({ presa: 0.9 }), 900) }
    else if (e !== null && stato.fase === 'gira') fermata(e)
  }
  if (n === 64) accumulo = 0
  const { p, q, angolo } = ruota.pose()
  rotoreGrp.rotation.y = angolo
  pallina.position.set(p.x, p.y, p.z)
  pallina.quaternion.set(q.x, q.y, q.z, q.w)
  renderer.render(scena, camera)
}

// geometria di rivoluzione con le coordinate di texture: u gira in senso orario (come le caselle), v lungo il profilo
function rivoluzioneUV(profilo, seg, conU = true, verso = 'su') {
  const nv = profilo.length
  const lung = [0]
  for (let i = 1; i < nv; i++) lung.push(lung[i - 1] + Math.hypot(profilo[i][0] - profilo[i - 1][0], profilo[i][1] - profilo[i - 1][1]))
  const L = lung[nv - 1] || 1
  const pos = [], uv = [], idx = []
  for (let s = 0; s <= seg; s++) {
    const t = (-s / seg) * Math.PI * 2, c = Math.cos(t), sn = Math.sin(t)
    for (let i = 0; i < nv; i++) {
      const [r, y] = profilo[i]
      pos.push(r * c, y, -r * sn)
      uv.push(conU ? s / seg : (s / seg) * 6, lung[i] / L)
    }
  }
  for (let s = 0; s < seg; s++) for (let i = 0; i < nv - 1; i++) {
    const a = s * nv + i, b = a + 1, c = (s + 1) * nv + i, d = c + 1
    idx.push(a, b, c, b, d, c)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  // le normali devono guardare in su (verso la pallina), o in fuori per il fianco: se no, si gira il verso dei triangoli
  const n = g.getAttribute('normal'), pp = g.getAttribute('position')
  let sy = 0
  for (let i = 0; i < n.count; i++) sy += verso === 'su' ? n.getY(i) : n.getX(i) * pp.getX(i) + n.getZ(i) * pp.getZ(i)
  if (sy < 0) { const ix = g.getIndex().array; for (let i = 0; i < ix.length; i += 3) { const k = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = k } g.computeVertexNormals() }
  return g
}
const tra = (profilo, r0, r1) => profilo.filter(([r]) => r <= r0 + 1e-6 && r >= r1 - 1e-6)

function costruisciScena() {
  const canvas = el.canvas
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.NeutralToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  scena = new THREE.Scene()
  const pm = new THREE.PMREMGenerator(renderer)
  scena.environment = pm.fromScene(new THREE.RoomEnvironment(), 0.04).texture
  scena.environmentIntensity = 0.85
  camera = new THREE.PerspectiveCamera(30, 1, 0.05, 10)
  ridimensiona = () => {
    const w = el.ruota.clientWidth, h = el.ruota.clientHeight
    if (!w || !h) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    // la ruota (Ø 0,82 m) deve stare tutta dentro, anche se lo spazio è largo e basso
    const vista = 0.86 / (2 * Math.tan((camera.fov * Math.PI) / 360)) * Math.max(1, 1.08 / camera.aspect)
    const el0 = (54 * Math.PI) / 180
    camera.position.set(0, Math.sin(el0) * vista + 0.02, Math.cos(el0) * vista + 0.05)
    camera.lookAt(0, 0.035, 0.035)
    camera.updateProjectionMatrix()
  }
  ridimensiona()

  // le luci: una lampada sopra il tavolo (con le ombre) e il cielo della stanza
  const sole = new THREE.DirectionalLight(0xfff4e6, 2.4)
  sole.position.set(-0.3, 2.2, 0.45)
  sole.castShadow = true
  sole.shadow.mapSize.set(2048, 2048)
  Object.assign(sole.shadow.camera, { left: -0.5, right: 0.5, top: 0.5, bottom: -0.5, near: 0.5, far: 3 })
  sole.shadow.bias = -0.0004
  sole.shadow.normalBias = 0.01
  sole.shadow.radius = 3
  scena.add(sole)
  scena.add(new THREE.HemisphereLight(0xfff8ee, 0x2a2018, 0.45))

  // i materiali
  const tl = new THREE.TextureLoader()
  const legnoMap = tl.load(ART + 'roulette/legno.webp')
  legnoMap.colorSpace = THREE.SRGBColorSpace
  legnoMap.wrapS = THREE.MirroredRepeatWrapping
  legnoMap.wrapT = THREE.MirroredRepeatWrapping
  legnoMap.anisotropy = 8
  const legno = new THREE.MeshPhysicalMaterial({ map: legnoMap, roughness: 0.38, clearcoat: 1, clearcoatRoughness: 0.12 })
  const legnoScuro = new THREE.MeshPhysicalMaterial({ map: legnoMap, color: 0x6a4a3c, roughness: 0.4, clearcoat: 1, clearcoatRoughness: 0.15 })
  const ebano = new THREE.MeshPhysicalMaterial({ color: 0x17120f, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.08 })
  const cromo = new THREE.MeshStandardMaterial({ color: 0xd9d6d0, metalness: 1, roughness: 0.16 })
  const ottone = new THREE.MeshStandardMaterial({ color: 0xd8b56a, metalness: 1, roughness: 0.22 })

  // la scodella: il bordo e la pista in legno chiaro, il piano dei rombi scuro, il fianco esterno
  const statore = new THREE.Group()
  const pezzo = (prof, mat, uv = false, verso = 'su') => { const m = new THREE.Mesh(rivoluzioneUV(prof, 256, uv, verso), mat); m.receiveShadow = true; statore.add(m); return m }
  pezzo(tra(STATORE, 0.42, 0.3450), legno)
  pezzo(tra(STATORE, 0.3450, 0.3040), ebano)
  pezzo(tra(STATORE, 0.3040, 0.30), cromo)
  pezzo([[0.4100, 0.1300], [0.4140, 0.0900], [0.4120, 0.0300], [0.4000, 0.0000]], legnoScuro, false, 'fuori').castShadow = true
  scena.add(statore)
  // i rombi
  for (const rb of ROMBI) {
    const pts = verticiRombo(rb)
    const g = rombo(pts)
    const m = new THREE.Mesh(g, cromo)
    m.castShadow = true; m.receiveShadow = true
    scena.add(m)
  }

  // il rotore
  rotoreGrp = new THREE.Group()
  scena.add(rotoreGrp)
  const numeriTex = texNumeri()
  const caselleTex = texCaselle()
  const ro = (prof, mat, uv = true) => { const m = new THREE.Mesh(rivoluzioneUV(prof, N * 8, uv), mat); m.receiveShadow = true; rotoreGrp.add(m); return m }
  ro(tra(ROTORE, 0.3006, 0.2995), cromo)
  ro(tra(ROTORE, 0.2995, 0.2730), new THREE.MeshPhysicalMaterial({ map: numeriTex, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1 }))
  ro(tra(ROTORE, 0.2730, 0.2190), new THREE.MeshPhysicalMaterial({ map: caselleTex, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.25 }))
  ro(tra(ROTORE, 0.2190, 0.0480), legno, false)
  // le palette fra le caselle
  const { r0, r1, y0, y1, spessore } = PALETTA
  const pal = new THREE.InstancedMesh(new THREE.BoxGeometry(r1 - r0, y1 - y0, spessore), ottone, N)
  const m4 = new THREE.Matrix4(), qq = new THREE.Quaternion(), asse = new THREE.Vector3(0, 1, 0), uno = new THREE.Vector3(1, 1, 1)
  for (let i = 0; i < N; i++) {
    const t = -i * DELTA, rm = (r0 + r1) / 2
    qq.setFromAxisAngle(asse, t)
    m4.compose(new THREE.Vector3(rm * Math.cos(t), (y0 + y1) / 2, -rm * Math.sin(t)), qq, uno)
    pal.setMatrixAt(i, m4)
  }
  pal.castShadow = true; pal.receiveShadow = true
  rotoreGrp.add(pal)
  // sul cono un intarsio di legno chiaro, un filo cromato e la torretta: base, colonnina e quattro bracci coi pomi
  const chiaro = new THREE.MeshPhysicalMaterial({ map: legno.map, color: 0xf0c89a, roughness: 0.36, clearcoat: 1, clearcoatRoughness: 0.12 })
  const cono = tra(ROTORE, 0.2190, 0.0480)
  const yCono = (r) => { for (let i = 0; i < cono.length - 1; i++) { const [ra, ya] = cono[i], [rb, yb] = cono[i + 1]; if (r <= ra && r >= rb) return ya + ((r - ra) / (rb - ra)) * (yb - ya) } return cono.at(-1)[1] }
  const anello = (ra, rb, mat, su = 0.0004) => { const prof = []; for (let k = 0; k <= 6; k++) { const r = ra + ((rb - ra) * k) / 6; prof.push([r, yCono(r) + su]) } return ro(prof, mat, false) }
  anello(0.172, 0.150, chiaro)
  anello(0.112, 0.106, cromo, 0.0007)
  anello(0.064, 0.058, cromo, 0.0007)
  const torre = new THREE.Mesh(new THREE.LatheGeometry([[0, 0.0838], [0.052, 0.0838], [0.052, 0.0872], [0.040, 0.0905], [0.022, 0.098], [0.013, 0.108], [0.010, 0.140], [0.015, 0.146], [0.015, 0.152], [0.009, 0.158], [0.012, 0.166], [0.007, 0.172], [0, 0.174]].map(([r, y]) => new THREE.Vector2(r, y)), 64), cromo)
  torre.castShadow = true
  rotoreGrp.add(torre)
  for (let k = 0; k < 4; k++) {
    const t = (k / 4) * Math.PI * 2 + Math.PI / 4
    const braccio = new THREE.Mesh(new THREE.CylinderGeometry(0.0042, 0.0055, 0.082, 16), cromo)
    braccio.position.set(0.045 * Math.cos(t), 0.149, -0.045 * Math.sin(t))
    braccio.rotation.set(0, t, Math.PI / 2)
    braccio.castShadow = true
    rotoreGrp.add(braccio)
    const pomo = new THREE.Mesh(new THREE.SphereGeometry(0.0095, 24, 16), cromo)
    pomo.position.set(0.088 * Math.cos(t), 0.149, -0.088 * Math.sin(t))
    pomo.castShadow = true
    rotoreGrp.add(pomo)
  }

  // la pallina
  pallina = new THREE.Mesh(new THREE.SphereGeometry(R_PALLINA, 40, 24), new THREE.MeshPhysicalMaterial({ color: 0xf6f3ec, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.06 }))
  pallina.castShadow = true
  scena.add(pallina)

  // l'ombra della ruota sul foglio
  const ombra = new THREE.Mesh(new THREE.CircleGeometry(0.62, 64), new THREE.ShadowMaterial({ opacity: 0.18 }))
  ombra.rotation.x = -Math.PI / 2
  ombra.position.y = -0.001
  ombra.receiveShadow = true
  scena.add(ombra)
}

// un rombo: il solido dai suoi otto punti (basso, due creste)
function rombo(p) {
  // 0 L+, 1 L-, 2 W+, 3 W-, 4 top L+, 5 top L-, 6 top W+, 7 top W-
  const facce = [[0, 2, 4], [2, 6, 4], [2, 1, 6], [1, 5, 6], [1, 3, 5], [3, 7, 5], [3, 0, 7], [0, 4, 7], [4, 6, 5], [4, 5, 7], [0, 3, 2], [3, 1, 2]]
  const pos = []
  for (const f of facce) for (const i of f) pos.push(...p[i])
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.computeVertexNormals()
  // le facce devono guardare fuori: se la normale media della prima faccia punta verso il centro del solido, si girano
  const c = p.reduce((a, q) => [a[0] + q[0] / 8, a[1] + q[1] / 8, a[2] + q[2] / 8], [0, 0, 0])
  const n = g.getAttribute('normal'), pa = g.getAttribute('position')
  let fuori = 0
  for (let i = 0; i < pa.count; i++) fuori += (pa.getX(i) - c[0]) * n.getX(i) + (pa.getY(i) - c[1]) * n.getY(i) + (pa.getZ(i) - c[2]) * n.getZ(i)
  if (fuori < 0) { const a = g.getAttribute('position').array; for (let i = 0; i < a.length; i += 9) for (let k = 0; k < 3; k++) { const t = a[i + 3 + k]; a[i + 3 + k] = a[i + 6 + k]; a[i + 6 + k] = t } g.computeVertexNormals() }
  return g
}

// l'anello dei numeri: 37 spicchi rossi, neri e lo zero verde, il numero bianco (Anton), il filo d'oro fra uno e l'altro
function texNumeri() {
  // ogni spicchio sulla ruota è largo ~4,9 cm e alto ~2,8: nella tela è 111 × 128 px, quindi le cifre si
  // disegnano strette di STRETTA volte e la ruota le allarga giuste
  const W = 4096, H = 128, STRETTA = (4.86 / 2.78) / (W / N / H)
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const g = c.getContext('2d')
  const w = W / N
  for (let i = 0; i < N; i++) {
    const n = NUMERI[i]
    g.fillStyle = { rosso: '#a8121d', nero: '#141313', verde: '#0b6a32' }[colore(n)]
    g.fillRect(i * w, 0, w + 1, H)
    g.save()
    g.translate((i + 0.5) * w, H * 0.5)
    g.scale(-1 / STRETTA, 1) // u gira al contrario di chi legge da fuori; e le cifre strette
    g.fillStyle = '#f6f1e6'
    g.font = `400 ${H * 0.66}px Anton, Impact, sans-serif`
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText(String(n), 0, H * 0.04)
    g.restore()
    g.fillStyle = '#d8b56a'
    g.fillRect(i * w - 2, 0, 4, H)
  }
  g.fillStyle = '#d8b56a'
  g.fillRect(0, 0, W, 4)
  g.fillRect(0, H - 4, W, 4)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}
// il fondo delle caselle: gli stessi colori, un po' più cupi, con la grana del feltro
function texCaselle() {
  const W = 2048, H = 128
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const g = c.getContext('2d')
  const w = W / N
  for (let i = 0; i < N; i++) {
    g.fillStyle = { rosso: '#86101a', nero: '#121111', verde: '#0a5a2b' }[colore(NUMERI[i])]
    g.fillRect(i * w, 0, w + 1, H)
  }
  const img = g.getImageData(0, 0, W, H)
  for (let i = 0; i < img.data.length; i += 4) { const k = (Math.random() - 0.5) * 14; img.data[i] += k; img.data[i + 1] += k; img.data[i + 2] += k }
  g.putImageData(img, 0, 0)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}
