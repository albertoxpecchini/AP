// Il blackjack di pzkko.it, in una finestra sopra il muro, come la roulette: un
// foglio grande col nastro agli angoli, il tavolo stampato sopra (SVG), le
// fiches fotografate (le stesse della roulette) e le carte vere in 3D, lucide,
// col loro spessore (three.js, scena.js), che escono dal sabot, volano, si
// girano, si sbirciano e finiscono nella vaschetta degli scarti. Le regole
// sono quelle vere di tre casinò (regole.js); i $pzk sono gli stessi di tutti i
// giochi (../pzk.js). Fino a tre caselle, con le puntate laterali dove ci sono.
//
// index.html la apre con import('/games/blackjack/blackjack.js').then((m) => m.apri()).

import * as pzk from '../pzk.js'
import { REGOLE, LIMITI, PAGA_PP, PAGA_T3, Tavolo, punti, valore } from './regole.js'

const QUI = new URL('.', import.meta.url).href
const ART = '/art/'
const GIOCO = 'blackjack'
const CHIAVE = 'pzkko-blackjack'
const RIDOTTO = matchMedia('(prefers-reduced-motion: reduce)')
const L = 88 / 63
const fmt = pzk.fmt
const svgEl = (tag, attr = {}) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const [k, v] of Object.entries(attr)) e.setAttribute(k, v); return e }
const CASELLE = 3
const NOMI_SEMI = { c: 'cuori', q: 'quadri', f: 'fiori', p: 'picche' }
const NOMI_RANGHI = { A: 'asso', J: 'fante', Q: 'regina', K: 're' }
const nomeCarta = (c) => `${NOMI_RANGHI[c.r] ?? c.r} di ${NOMI_SEMI[c.s]}`

// ── lo stato ─────────────────────────────────────────────────────────────────
const stato = {
  regole: 'vegas',
  fiche: 5,
  fase: 'punta', // 'punta' | 'gioco' | 'raccolta'
  puntate: Array.from({ length: CASELLE }, () => ({ base: 0, pp: 0, t3: 0 })),
  mosse: [], // le fiches posate, in ordine (per «togli»): { casella, k, v }
  ultime: null,
  veloce: false,
}
function carica() {
  try {
    const s = JSON.parse(localStorage.getItem(CHIAVE) || 'null')
    if (s && REGOLE[s.regole]) stato.regole = s.regole
    if (s && Array.isArray(s.ultime) && s.ultime.length === CASELLE) stato.ultime = s.ultime.map((p) => ({ base: +p.base || 0, pp: +p.pp || 0, t3: +p.t3 || 0 }))
  } catch {}
}
function salva() { try { localStorage.setItem(CHIAVE, JSON.stringify({ regole: stato.regole, ultime: stato.ultime })) } catch {} }
const R = () => REGOLE[stato.regole]
const sulTavolo = () => stato.puntate.reduce((s, p) => s + p.base + p.pp + p.t3, 0)
const attendi = (ms) => new Promise((r) => setTimeout(r, RIDOTTO.matches ? 0 : ms / (stato.veloce ? 3 : 1)))

let tavolo = null
let dlg, el = {}, scena = null, motore = null, G = null

// ── la finestra ──────────────────────────────────────────────────────────────
export async function apri() {
  if (!dlg) await costruisci()
  if (!dlg.open) {
    dlg.classList.remove('chiude')
    dlg.showModal()
    disegnaTavolo()
    aggiornaBanco()
  }
  if (!motore) motore = avviaMotore().catch((e) => { console.error(e); el.carica.textContent = 'le carte non sono arrivate: riprova più tardi' })
  else scena?.avvia()
}

async function costruisci() {
  carica()
  await new Promise((ok) => {
    const l = document.createElement('link')
    l.rel = 'stylesheet'; l.href = QUI + 'blackjack.css'
    l.onload = ok; l.onerror = ok
    document.head.appendChild(l)
  })
  dlg = document.createElement('dialog')
  dlg.className = 'bj'
  dlg.setAttribute('aria-labelledby', 'bj-titolo')
  dlg.innerHTML = `
    <div class="bj-dentro">
      <header class="bj-testa">
        <h2 id="bj-titolo">blackjack</h2>
        <p class="bj-voce" aria-live="polite"></p>
        <label class="bj-regole"><span>regole di</span> <select aria-label="le regole del tavolo">${Object.values(REGOLE).map((r) => `<option value="${r.id}">${r.nome}</option>`).join('')}</select></label>
        <button class="bj-chiudi" type="button" aria-label="chiudi il blackjack"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M9 10c7 6 14 13 22 21M30 8c-6 8-13 15-21 23"/></svg></button>
      </header>
      <div class="bj-campo">
        <svg class="bj-tavolo" aria-label="il tavolo del blackjack" role="group"></svg>
        <div class="bj-fiches"></div>
        <canvas class="bj-3d" aria-hidden="true"></canvas>
        <div class="bj-segni" aria-hidden="true"></div>
        <p class="bj-carica">le carte arrivano…</p>
      </div>
      <div class="bj-banco">
        <p class="bj-saldo"><small>hai</small><b></b><span class="puntato"></span></p>
        <div class="bj-scegli" role="group" aria-label="scegli la fiche"></div>
        <div class="bj-azioni" role="group" aria-label="la tua mossa" hidden>
          <button type="button" data-a="carta" aria-keyshortcuts="c">carta</button>
          <button type="button" data-a="stai" aria-keyshortcuts="s">stai</button>
          <button type="button" data-a="raddoppia" aria-keyshortcuts="r">raddoppia</button>
          <button type="button" data-a="dividi" aria-keyshortcuts="d">dividi</button>
          <button type="button" data-a="resa" aria-keyshortcuts="a">abbandona</button>
        </div>
        <div class="bj-chiede" role="group" hidden>
          <button type="button" data-si="1">sì</button>
          <button type="button" data-si="0">no</button>
        </div>
        <div class="bj-tasti">
          <button class="bj-piccolo bj-togli" type="button">togli</button>
          <button class="bj-piccolo bj-rifai" type="button">rifai</button>
          <button class="bj-piccolo bj-veloce" type="button" aria-pressed="false" title="il banco dà le carte tre volte più in fretta">×3</button>
          <button class="bj-dai" type="button">distribuisci</button>
        </div>
      </div>
    </div>`
  document.body.appendChild(dlg)
  const q = (s) => dlg.querySelector(s)
  el = {
    voce: q('.bj-voce'), chiudi: q('.bj-chiudi'), regole: q('.bj-regole select'), campo: q('.bj-campo'), svg: q('.bj-tavolo'), fiches: q('.bj-fiches'),
    canvas: q('.bj-3d'), segni: q('.bj-segni'), carica: q('.bj-carica'), saldo: q('.bj-saldo b'), puntato: q('.bj-saldo .puntato'),
    scegli: q('.bj-scegli'), azioni: q('.bj-azioni'), chiede: q('.bj-chiede'), tasti: q('.bj-tasti'), togli: q('.bj-togli'), rifai: q('.bj-rifai'),
    veloce: q('.bj-veloce'), dai: q('.bj-dai'),
  }
  // chi mi segue su instagram riceve 1.000 $pzk (una volta, ../pzk.js)
  q('.bj-saldo').appendChild(pzk.linkInstagram({ fatto: () => { voce(`grazie del follow: +${fmt(pzk.PREMIO_IG)} $pzk`); contaSaldo(pzk.saldo() - pzk.PREMIO_IG, pzk.saldo()); aggiornaBanco() } }))
  // col conto, gli EUR€ parcheggiati nel wallet: si giocano solo convertiti in $pzk (../pzk.js, wallet/)
  q('.bj-saldo').appendChild(pzk.rigaEuro())
  for (const v of pzk.FICHES) {
    const b = document.createElement('button')
    b.type = 'button'
    b.dataset.v = v
    b.setAttribute('aria-label', `fiche da ${v}`)
    b.innerHTML = `<img src="${ART}fiches/f${v}.webp" alt="" width="170" height="174">`
    if (v === stato.fiche) b.autofocus = true
    b.addEventListener('click', () => { stato.fiche = v; aggiornaBanco() })
    el.scegli.appendChild(b)
  }
  el.regole.value = stato.regole
  el.regole.addEventListener('change', () => cambiaRegole(el.regole.value))
  el.chiudi.addEventListener('click', chiudi)
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); chiudi() })
  dlg.addEventListener('click', (e) => { if (e.target === dlg) chiudi() })
  el.dai.addEventListener('click', distribuisci)
  el.togli.addEventListener('click', togli)
  el.rifai.addEventListener('click', rifai)
  el.veloce.addEventListener('click', () => { stato.veloce = !stato.veloce; el.veloce.setAttribute('aria-pressed', String(stato.veloce)); if (scena) scena.veloce = stato.veloce ? 3 : 1 })
  el.azioni.addEventListener('click', (e) => { const a = e.target.closest('button')?.dataset.a; if (a) scegli(a) })
  el.chiede.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) scegli(b.dataset.si === '1' ? 'si' : 'no') })
  dlg.addEventListener('keydown', tastiera)
  new ResizeObserver(() => { if (dlg.open) ridisegna() }).observe(el.campo)
  pzk.ascolta(() => aggiornaBanco())
  voce(benvenuto())
  aggiornaBanco()
}

function benvenuto() {
  if (pzk.aSecco()) return 'hai finito i $pzk: ricarica'
  return R().caselleMin > 1 ? `a ${R().nome} da soli si punta su almeno ${R().caselleMin} caselle` : 'punta nei cerchi, poi distribuisci'
}

function chiudi() {
  if (!dlg?.open || dlg.classList.contains('chiude')) return
  const fine = () => { dlg.close(); dlg.classList.remove('chiude'); scena?.ferma(); if (location.hash === '#blackjack') history.replaceState(null, '', location.pathname + location.search) }
  if (RIDOTTO.matches) return fine()
  dlg.classList.add('chiude')
  setTimeout(fine, 220)
}

function voce(t) { if (el.voce) el.voce.textContent = t }

function aggiornaBanco() {
  if (!el.saldo) return
  if (!contando) el.saldo.textContent = `$pzk ${fmt(pzk.saldo())}`
  const p = pzk.sulTavolo(GIOCO)
  el.puntato.textContent = p ? `sul tavolo: ${fmt(p)}` : ''
  const punta = stato.fase === 'punta'
  for (const b of el.scegli.children) {
    b.setAttribute('aria-pressed', String(Number(b.dataset.v) === stato.fiche))
    b.disabled = !punta
  }
  el.scegli.hidden = stato.fase === 'gioco'
  el.togli.disabled = !punta || !stato.mosse.length
  el.rifai.disabled = !punta || !stato.ultime || sulTavolo() > 0
  el.togli.hidden = el.rifai.hidden = stato.fase === 'gioco'
  el.regole.disabled = !punta
  if (punta && pzk.aSecco()) { el.dai.textContent = 'ricarica'; el.dai.disabled = false }
  else { el.dai.textContent = 'distribuisci'; el.dai.disabled = !punta || !scena || !stato.puntate.some((p) => p.base > 0) }
  el.dai.hidden = stato.fase === 'gioco'
  dlg.classList.toggle('chiuso', !punta)
}

function cambiaRegole(id) {
  if (stato.fase !== 'punta' || !REGOLE[id]) { el.regole.value = stato.regole; return }
  stato.regole = id
  // a venezia niente laterali: tornano nel saldo
  if (!R().laterali) for (let c = 0; c < CASELLE; c++) for (const k of ['pp', 't3']) {
    const v = stato.puntate[c][k]
    if (!v) continue
    pzk.ritira(GIOCO, v)
    stato.puntate[c][k] = 0
    svuota(`${k}${c}`, centro(el.saldo), { svanisce: true })
  }
  stato.mosse = stato.mosse.filter((m) => stato.puntate[m.casella][m.k] > 0)
  tavolo = new Tavolo(R())
  scena?.sabotPieno(0, null)
  salva()
  disegnaTavolo()
  aggiornaBanco()
  voce(`regole di ${R().nome}: ${R().mazzi} mazzi, ${R().buca ? 'carta coperta' : 'niente carta coperta'}${R().resa ? ', resa' : ''}${R().laterali ? ', 21+3 e perfect pairs' : ''}`)
}

// ── il tavolo (SVG stampato sul foglio) ──────────────────────────────────────
// le misure si ricalcolano dallo spazio che c'è: il banco in alto, le tre
// caselle su un arco in basso (la 0 è a destra: la prima a sinistra del banco)
function geometria() {
  const w = el.campo.clientWidth, h = el.campo.clientHeight
  const cw = Math.round(Math.max(38, Math.min(68, w * 0.084, h * 0.148)))
  const ch = cw * L
  const rc = cw * 0.52, rl = cw * 0.3
  const cy = -h * 0.6
  const yb = h - rc - Math.max(10, h * 0.03)
  const Rb = yb - cy
  const dx = Math.min(w * 0.31, cw * 4.4)
  const th = Math.asin(dx / Rb)
  const caselle = [th, 0, -th].map((t) => ({ x: w / 2 + Rb * Math.sin(t), y: cy + Rb * Math.cos(t), giro: -t, t }))
  const banco = { x: w / 2, y: cw * 0.55 + 8 + ch / 2 }
  const Rt = banco.y + ch / 2 + cw * 0.4 + 6 - cy
  const Rs = Rt + cw * 0.33
  const Ri = Rs + cw * 0.2, Ri2 = Ri + cw * 0.4
  return {
    w, h, cw, ch, rc, rl, cy, caselle, banco, Rt, Rs, Ri, Ri2,
    rack: { x: w / 2, w: cw * 4.2, h: cw * 0.55 },
    scarpa: { x: w - 1.2 * cw - 4, y: 0.85 * cw + 2, giro: 0.38 },
    scarti: { x: 0.75 * cw + 6, y: ch / 2 + 8, giro: -0.1 },
    fiche: Math.round(Math.max(22, Math.min(30, cw * 0.54))),
  }
}
// un punto nel riferimento di una casella (l'origine al centro del cerchio, y verso il giocatore) → px del campo
function inCasella(c, lx, ly) {
  const k = G.caselle[c], a = k.giro, co = Math.cos(a), si = Math.sin(a)
  return { x: k.x + lx * co - ly * si, y: k.y + lx * si + ly * co }
}
// dove sta un posto delle fiches
function dovePosto(key) {
  const m = /^(b|pp|t3|ins)(\d)$/.exec(key)
  if (m) {
    const c = Number(m[2])
    if (m[1] === 'b') return inCasella(c, 0, 0)
    if (m[1] === 'pp') return inCasella(c, -(G.rc + G.rl + 6), 2)
    if (m[1] === 't3') return inCasella(c, G.rc + G.rl + 6, 2)
    const t = G.caselle[c].t * 0.8, Rm = (G.Ri + G.Ri2) / 2
    return { x: G.w / 2 + Rm * Math.sin(t), y: G.cy + Rm * Math.cos(t) }
  }
  const h = /^(m|r)(\d+)$/.exec(key)
  const mano = mani.get(Number(h[2]))
  const o = origineMano(mano)
  return h[1] === 'm' ? inCasella(mano.casella, o, 0) : inCasella(mano.casella, o + G.cw * 0.46, -2)
}

function disegnaTavolo() {
  if (!el.campo?.clientWidth) return
  G = geometria()
  const { w, h, cw, rc, rl, cy, Rt, Rs, Ri, Ri2 } = G
  const svg = el.svg
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`)
  svg.innerHTML = ''
  const defs = svgEl('defs')
  defs.innerHTML = `<filter id="bj-ink" x="-2%" y="-2%" width="104%" height="104%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="11" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.5" result="d"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -.55 1.22" result="g"/><feComposite in="d" in2="g" operator="in"/></filter>`
  svg.appendChild(defs)
  const stampa = svgEl('g', { filter: 'url(#bj-ink)' })
  svg.appendChild(stampa)
  const ink = '#161616', rosso = '#b3121f'
  // un arco del cerchio di centro (w/2, cy), da sinistra a destra passando sotto: a è l'angolo dal basso di ogni estremo
  const arco = (r, a) => {
    const x0 = w / 2 - r * Math.sin(a), x1 = w / 2 + r * Math.sin(a), y = cy + r * Math.cos(a)
    return `M${x0.toFixed(1)} ${y.toFixed(1)} A${r} ${r} 0 0 0 ${x1.toFixed(1)} ${y.toFixed(1)}`
  }
  const larghezza = (r) => Math.min(1.3, Math.asin(Math.min(1, (w * 0.5 - 6) / r)))
  const testoArco = (id, r, t, attr) => {
    const a = larghezza(r)
    defs.appendChild(svgEl('path', { id, d: arco(r, a) }))
    const e = svgEl('text', { 'text-anchor': 'middle', fill: ink, ...attr })
    const tp = svgEl('textPath', { href: `#${id}`, startOffset: '50%' })
    tp.textContent = t
    e.appendChild(tp)
    stampa.appendChild(e)
  }
  // la cassetta del banco, in cima
  const { rack } = G
  stampa.appendChild(svgEl('rect', { x: rack.x - rack.w / 2, y: -4, width: rack.w, height: rack.h + 4, rx: 5, fill: 'none', stroke: ink, 'stroke-width': 1.6 }))
  for (let k = 1; k < 8; k++) { const x = rack.x - rack.w / 2 + (rack.w * k) / 8; stampa.appendChild(svgEl('line', { x1: x, y1: 0, x2: x, y2: rack.h - 4, stroke: ink, 'stroke-width': 0.8, 'stroke-opacity': 0.6 })) }
  // le scritte ad arco: quanto paga il blackjack, la regola del banco, l'assicurazione
  testoArco('bj-a1', Rt, `blackjack paga ${R().paga === 1.5 ? '3 a 2' : R().paga}`, { 'font-size': Math.round(cw * 0.44), class: 'bj-grande' })
  testoArco('bj-a2', Rs, R().feltro[0], { 'font-size': Math.max(10, Math.round(cw * 0.22)), class: 'bj-piccola' })
  const a = Math.min(larghezza(Ri2) * 0.86, Math.acos(Math.min(1, (G.scarpa.y + cw * 1.1 - cy) / Ri2)))
  stampa.appendChild(svgEl('path', { d: arco(Ri, a), fill: 'none', stroke: ink, 'stroke-width': 1.4 }))
  stampa.appendChild(svgEl('path', { d: arco(Ri2, a), fill: 'none', stroke: ink, 'stroke-width': 1.4 }))
  testoArco('bj-a3', (Ri + Ri2) / 2 + cw * 0.08, 'l’assicurazione paga 2 a 1', { 'font-size': Math.round(cw * 0.25), class: 'bj-grande', fill: rosso })
  testoArco('bj-a4', Ri2 + cw * 0.3, R().feltro[1], { 'font-size': Math.max(9, Math.round(cw * 0.19)), class: 'bj-piccola' })
  // i limiti del tavolo, un'altra riga ad arco
  testoArco('bj-a5', Ri2 + cw * 0.62, `puntata ${LIMITI.min}–${fmt(LIMITI.max)}${R().laterali ? ` · laterali 1–${LIMITI.lateraleMax}` : ''}`, { 'font-size': Math.max(9, Math.round(cw * 0.19)), class: 'bj-piccola', fill: rosso })
  // le caselle: il cerchio della puntata, e le due laterali
  for (let c = 0; c < CASELLE; c++) {
    const o = inCasella(c, 0, 0)
    stampa.appendChild(svgEl('circle', { cx: o.x, cy: o.y, r: rc, fill: 'none', stroke: ink, 'stroke-width': 1.8 }))
    stampa.appendChild(svgEl('circle', { cx: o.x, cy: o.y, r: rc - 4, fill: 'none', stroke: ink, 'stroke-width': 0.8 }))
    if (R().laterali) for (const [k, t] of [['pp', 'pp'], ['t3', '21+3']]) {
      const p = dovePosto(`${k}${c}`)
      stampa.appendChild(svgEl('circle', { cx: p.x, cy: p.y, r: rl, fill: 'none', stroke: rosso, 'stroke-width': 1.4 }))
      const e = svgEl('text', { x: p.x, y: p.y + rl + Math.max(9, cw * 0.2), 'text-anchor': 'middle', fill: rosso, class: 'bj-grande', 'font-size': Math.max(9, Math.round(cw * 0.2)) })
      e.textContent = t
      stampa.appendChild(e)
    }
  }
  // le zone dove si punta
  const zone = svgEl('g')
  for (let c = 0; c < CASELLE; c++) {
    const posti = [['b', rc, `casella ${c + 1}: puntata da ${LIMITI.min} a ${fmt(LIMITI.max)}`]]
    if (R().laterali) posti.push(['pp', rl + 3, `casella ${c + 1}: perfect pairs`], ['t3', rl + 3, `casella ${c + 1}: 21+3`])
    for (const [k, r, nome] of posti) {
      const p = dovePosto(`${k}${c}`)
      const z = svgEl('circle', { cx: p.x, cy: p.y, r, class: 'bj-zona', tabindex: 0, role: 'button', 'aria-label': nome })
      z.dataset.posto = `${k}${c}`
      zone.appendChild(z)
    }
  }
  svg.appendChild(zone)
  zone.addEventListener('click', (e) => { const k = e.target.dataset?.posto; if (k) posa(k) })
  zone.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.dataset?.posto) { e.preventDefault(); posa(e.target.dataset.posto) } })
  zone.addEventListener('pointerover', (e) => { const k = e.target.dataset?.posto; if (k && stato.fase === 'punta') voce(spiega(k)) })
  zone.addEventListener('focusin', (e) => { const k = e.target.dataset?.posto; if (k && stato.fase === 'punta') voce(spiega(k)) })
}

function spiega(key) {
  const c = Number(key.at(-1)), k = key.slice(0, -1)
  const g = stato.puntate[c][k === 'b' ? 'base' : k]
  const ci = g ? ` · ci sono ${fmt(g)}` : ''
  if (k === 'pp') return `perfect pairs: coppia ${PAGA_PP.mista}, colore ${PAGA_PP.colore}, perfetta ${PAGA_PP.perfetta} a 1${ci}`
  if (k === 't3') return `21+3: colore ${PAGA_T3.colore}, scala ${PAGA_T3.scala}, tris ${PAGA_T3.tris}, scala colore ${PAGA_T3['scala colore']}, tris uguale ${PAGA_T3['tris uguale']}${ci}`
  return `casella ${c + 1}: da ${LIMITI.min} a ${fmt(LIMITI.max)}${ci}`
}

function ridisegna() {
  disegnaTavolo()
  if (!G) return
  scena?.misura(G.w, G.h, G.cw, { scarpa: G.scarpa, scarti: G.scarti })
  for (const [k, p] of pile) mettiPila(k, p)
  for (const m of mani.values()) { riponiMano(m, false); segnaPunti(m) }
  riponiBanco(false)
  segnaPunti(banco)
}

// ── le fiches ────────────────────────────────────────────────────────────────
const pile = new Map() // posto → { el, fiches: [valori] }
const ALTO = 2.4
function pila(key) {
  let p = pile.get(key)
  if (!p) {
    const e = document.createElement('div')
    e.className = 'bj-pila'
    el.fiches.appendChild(e)
    p = { el: e, fiches: [] }
    pile.set(key, p)
  }
  mettiPila(key, p)
  return p
}
function mettiPila(key, p) {
  const c = dovePosto(key)
  p.el.style.transform = `translate(${c.x}px, ${c.y}px)`
  p.el.style.setProperty('--f', `${G.fiche}px`)
  if (p.el.childElementCount !== p.fiches.length) p.el.replaceChildren(...p.fiches.map((v, i) => immagineFiche(v, i)))
}
function immagineFiche(v, i) {
  const img = document.createElement('img')
  img.className = 'bj-fiche'
  img.src = `${ART}fiches/f${v}.webp`
  img.alt = ''
  const k = Math.min(i, 11), r = ((v * 37 + i * 101) % 23) - 11
  img.style.transform = `translate(${((i * 7) % 3) - 1}px, ${-k * ALTO}px) rotate(${r}deg)`
  img.style.zIndex = String(i)
  return img
}
const centro = (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } }
const nelCampo = (c) => { const r = el.campo.getBoundingClientRect(); return { x: r.left + c.x, y: r.top + c.y } }
const cimaPila = (key) => { const p = pile.get(key), c = dovePosto(key); return nelCampo({ x: c.x, y: c.y - Math.min(p?.fiches.length ?? 0, 11) * ALTO }) }
const bancoFiches = () => nelCampo({ x: G.rack.x, y: G.rack.h / 2 })

/** Una fiche che vola da a a b (coordinate della finestra), con l'arco, l'ombra e un rimbalzo. */
function vola(v, a, b, { durata = 380, alto = 40, ruota = 0, dopo = 0, svanisce = false, scala = 1 } = {}) {
  if (RIDOTTO.matches) return Promise.resolve()
  if (stato.veloce) { durata /= 2; dopo /= 2 }
  const img = document.createElement('img')
  img.className = 'bj-volo'
  img.src = `${ART}fiches/f${v}.webp`
  img.alt = ''
  img.style.setProperty('--f', `${G.fiche}px`)
  dlg.appendChild(img)
  const mx = (a.x + b.x) / 2, my = Math.min(a.y, b.y) - alto
  const anim = img.animate([
    { transform: `translate(${a.x}px, ${a.y}px) scale(1) rotate(0deg)`, filter: 'drop-shadow(0 2px 2px rgba(0,0,0,.3))', opacity: 1 },
    { offset: 0.5, transform: `translate(${mx}px, ${my}px) scale(${1.3 * scala}) rotate(${ruota / 2}deg)`, filter: 'drop-shadow(0 14px 10px rgba(0,0,0,.22))', opacity: 1 },
    { transform: `translate(${b.x}px, ${b.y}px) scale(${scala}) rotate(${ruota}deg)`, filter: 'drop-shadow(0 2px 2px rgba(0,0,0,.3))', opacity: svanisce ? 0 : 1 },
  ], { duration: durata, delay: dopo, easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'forwards' })
  return anim.finished.then(() => img.remove(), () => img.remove())
}
function colpetto(p) {
  if (RIDOTTO.matches) return
  p.el.animate([{ transform: p.el.style.transform + ' scale(1)' }, { transform: p.el.style.transform + ' scale(.9, .94)', offset: 0.35 }, { transform: p.el.style.transform + ' scale(1)' }], { duration: 160, easing: 'ease-out' })
}
/** Aggiunge fiches a un posto, in volo da `da` (coordinate della finestra). */
async function aggiungi(key, valori, da, { dopo = 0, passo = 40 } = {}) {
  const p = pila(key)
  const imgs = valori.map((v) => { const i = p.fiches.length; p.fiches.push(v); const img = immagineFiche(v, i); img.style.visibility = 'hidden'; p.el.appendChild(img); return img })
  const c = dovePosto(key)
  await Promise.all(valori.map((v, j) => {
    const i = p.fiches.length - valori.length + j
    return vola(v, da, nelCampo({ x: c.x, y: c.y - Math.min(i, 11) * ALTO }), { ruota: ((v * 37 + i * 101) % 23) - 11, alto: 26 + ((j * 13) % 20), dopo: dopo + j * passo }).then(() => { imgs[j].style.visibility = ''; colpetto(p) })
  }))
}
/** Tutte le fiches di un posto volano verso `verso` e il posto si vuota. */
async function svuota(key, verso, { dopo = 0, svanisce = true, scala = 0.8 } = {}) {
  const p = pile.get(key)
  if (!p) return
  pile.delete(key)
  const imgs = [...p.el.children]
  const voli = imgs.map((img, j) => { const da = centro(img); img.style.visibility = 'hidden'; return vola(p.fiches[j] ?? 1, da, { x: verso.x + (j % 3) - 1, y: verso.y }, { durata: 480, alto: 24, dopo: dopo + j * 26, svanisce, scala, ruota: 30 }) })
  await Promise.all(voli)
  p.el.remove()
}
/** Sposta una pila sotto un altro nome (la puntata della casella diventa la puntata della mano). */
function rinomina(da, a) { const p = pile.get(da); if (!p) return; pile.delete(da); pile.set(a, p); mettiPila(a, p) }

// ── le puntate ───────────────────────────────────────────────────────────────
function posa(key) {
  if (stato.fase !== 'punta') { voce(stato.fase === 'gioco' ? 'le puntate sono chiuse: gioca la mano' : 'un attimo: il banco raccoglie le carte'); return }
  const c = Number(key.at(-1)), k = key === `b${c}` ? 'base' : key.slice(0, -1)
  const v = stato.fiche
  const max = k === 'base' ? LIMITI.max : LIMITI.lateraleMax
  if (stato.puntate[c][k] + v > max) { voce(`al massimo ${fmt(max)} su questa casella`); return }
  if (!pzk.punta(GIOCO, v)) { voce(pzk.saldo() >= 1 ? `non ti bastano: hai ${fmt(pzk.saldo())} $pzk` : 'hai finito i $pzk'); scuoti(el.saldo); return }
  stato.puntate[c][k] += v
  stato.mosse.push({ casella: c, k, v })
  aggiornaBanco()
  voce(spiega(key))
  aggiungi(key, [v], centro(el.scegli.querySelector(`[data-v="${v}"] img`)))
}
function togli() {
  if (stato.fase !== 'punta' || !stato.mosse.length) return
  const { casella, k, v } = stato.mosse.pop()
  const key = k === 'base' ? `b${casella}` : `${k}${casella}`
  const p = pile.get(key)
  const img = p?.el.lastElementChild
  const da = img ? centro(img) : null
  p?.fiches.pop()
  img?.remove()
  if (p && !p.fiches.length) { p.el.remove(); pile.delete(key) }
  stato.puntate[casella][k] -= v
  pzk.ritira(GIOCO, v)
  aggiornaBanco()
  if (da) vola(v, da, centro(el.scegli.querySelector(`[data-v="${v}"] img`)), { durata: 300, alto: 24 })
}
async function rifai() {
  if (stato.fase !== 'punta' || !stato.ultime || sulTavolo() > 0) return
  const ultime = stato.ultime.map((p) => ({ ...p, pp: R().laterali ? p.pp : 0, t3: R().laterali ? p.t3 : 0 }))
  const tot = ultime.reduce((s, p) => s + p.base + p.pp + p.t3, 0)
  if (tot > pzk.saldo()) { voce(`per rifare servono ${fmt(tot)} $pzk`); scuoti(el.saldo); return }
  const prima = stato.fiche
  for (let c = 0; c < CASELLE; c++) for (const k of ['base', 'pp', 't3']) for (const v of pzk.inFiches(ultime[c][k])) {
    stato.fiche = v
    posa(k === 'base' ? `b${c}` : `${k}${c}`)
    await attendi(60)
  }
  stato.fiche = prima
  aggiornaBanco()
}
function scuoti(e) {
  if (RIDOTTO.matches) return
  e.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(0)' }], { duration: 300 })
}

// ── le mani sul tavolo (le carte 3D, i punti, i timbri) ──────────────────────
const mani = new Map() // id → { id, casella, carte: [Carta3D], dati: [carta|null], segno, ... }
const banco = { id: 'banco', carte: [], dati: [], segno: null }
const ordine = new Map() // casella → [id delle mani, nell'ordine di gioco]

function origineMano(m) {
  const ids = ordine.get(m.casella) ?? [m.id]
  const n = ids.length, i = ids.indexOf(m.id)
  const sp = Math.min(G.cw * 1.34, (G.w / CASELLE - 8) / Math.max(1, n))
  return ((n - 1) / 2 - i) * sp // la prima mano a destra: si gioca da destra a sinistra, come si dà
}
// la posa della k-esima carta di una mano
function posaCarta(m, k, traverso) {
  const o = origineMano(m), cw = G.cw
  const lx = o + k * cw * 0.27 + (traverso ? cw * 0.12 : 0), ly = -(G.rc + 8 + G.ch / 2) - k * cw * 0.22
  const p = inCasella(m.casella, lx, ly)
  return { x: p.x, y: p.y, giro: G.caselle[m.casella].giro + (traverso ? Math.PI / 2 : 0), alto: 0, strato: k, sbircia: 0 }
}
function posaBanco(k, n) {
  const sp = G.cw * 0.7
  return { x: G.banco.x + (k - (n - 1) / 2) * sp, y: G.banco.y, giro: 0, alto: 0, strato: k === 0 ? 1 : k === 1 ? 0 : k, sbircia: 0 }
}
function riponiMano(m, anima = true) {
  if (!scena) return
  return Promise.all(m.carte.map((c, k) => { const p = posaCarta(m, k, c.traverso); return anima ? scena.muovi(c, p, { durata: 320 }) : (Object.assign(c.posa, p), c.applica()) }))
}
function riponiBanco(anima = true) {
  if (!scena) return
  const n = banco.carte.length
  return Promise.all(banco.carte.map((c, k) => { const p = posaBanco(k, n); return anima ? scena.muovi(c, p, { durata: 320 }) : (Object.assign(c.posa, p), c.applica()) }))
}

// i punti accanto alla mano (un cartellino a pennarello) e il timbro dell'esito
function cartellino(m) {
  if (!m.segno) {
    m.segno = document.createElement('span')
    m.segno.className = 'bj-punti'
    el.segni.appendChild(m.segno)
  }
  return m.segno
}
function testoPunti(dati) {
  const v = dati.filter(Boolean)
  if (!v.length) return ''
  const p = punti(v)
  if (p.tot > 21) return `${p.tot}`
  return p.morbido && p.tot !== 21 ? `${p.duro}/${p.tot}` : `${p.tot}`
}
function segnaPunti(m) {
  if (!G || !m.carte.length) { if (m.segno) m.segno.hidden = true; return }
  const s = cartellino(m)
  s.hidden = false
  s.textContent = m.bj ? 'bj' : testoPunti(m.dati)
  let p
  if (m === banco) { const pb = posaBanco(0, banco.carte.length); p = { x: pb.x - G.cw * 0.5 - 6, y: pb.y } }
  else p = inCasella(m.casella, origineMano(m) - G.cw * 0.5 - 4, -(G.rc + 8 + G.ch * 0.2))
  s.style.transform = `translate(${p.x}px, ${p.y}px) translate(-100%, -50%) rotate(-3deg)`
  s.classList.toggle('sballa', !m.bj && punti(m.dati.filter(Boolean)).tot > 21)
}
function timbro(m, testo, tipo = '') {
  const t = document.createElement('span')
  t.className = `bj-timbro ${tipo}`
  t.textContent = testo
  let p
  if (m === banco) p = { x: G.banco.x, y: G.banco.y + G.ch * 0.15 }
  else p = inCasella(m.casella, origineMano(m) + G.cw * 0.3, -(G.rc + 8 + G.ch * 0.55))
  t.style.left = `${p.x}px`
  t.style.top = `${p.y}px`
  for (const v of m.timbri ?? []) v.classList.add('via')
  el.segni.appendChild(t)
  m.timbri = [...(m.timbri ?? []), t]
  return t
}
function attiva(id) {
  for (const m of [...mani.values(), banco]) m.segno?.classList.toggle('attiva', m.id === id)
}

// ── la partita ───────────────────────────────────────────────────────────────
let attesa = null // la scelta che aspetta il giocatore: { fine(scelta) }
function scegli(a) { const w = attesa; if (w) { attesa = null; w(a) } }
const chiedi = () => new Promise((ok) => { attesa = ok })

async function distribuisci() {
  if (stato.fase !== 'punta' || !scena) return
  if (pzk.aSecco()) { const dati = pzk.ricarica(); aggiornaBanco(); voce(dati ? `altri ${fmt(pzk.INIZIALE)} $pzk finti: punta` : pzk.perche()); return }
  const pu = stato.puntate.map((p, casella) => ({ casella, puntata: p.base, pp: p.pp, t3: p.t3 }))
  const giocate = pu.filter((p) => p.puntata > 0)
  if (!giocate.length) { voce('punta prima in un cerchio'); return }
  const sotto = giocate.find((p) => p.puntata < LIMITI.min)
  if (sotto) { voce(`nella casella ${sotto.casella + 1} ci vogliono almeno ${LIMITI.min} $pzk`); return }
  const sole = pu.find((p) => !p.puntata && (p.pp || p.t3))
  if (sole) { voce(`la laterale della casella ${sole.casella + 1} vuole anche la puntata nel cerchio`); return }
  if (giocate.length < R().caselleMin) { voce(`a ${R().nome}, da soli, si punta su almeno ${R().caselleMin} caselle`); return }
  if (!tavolo || tavolo.R !== R()) tavolo = new Tavolo(R())
  stato.ultime = stato.puntate.map((p) => ({ ...p }))
  salva()
  stato.fase = 'gioco'
  stato.mosse = []
  aggiornaBanco()
  el.azioni.hidden = true
  let ev
  try { ev = tavolo.giro(giocate) } catch (e) { voce(e.message); stato.fase = 'punta'; aggiornaBanco(); return }
  // le mani del giro: le puntate delle caselle diventano le puntate delle mani
  mani.clear()
  ordine.clear()
  for (const m of tavolo.mani) {
    mani.set(m.id, { id: m.id, casella: m.casella, carte: [], dati: [], segno: null })
    ordine.set(m.casella, [m.id])
    rinomina(`b${m.casella}`, `m${m.id}`)
  }
  banco.carte = []; banco.dati = []
  voce('carte!')
  try {
    await recita(ev)
    while (tavolo.fase !== 'fine') {
      if (tavolo.fase === 'assicurazione') await turnoAssicurazione()
      else if (tavolo.fase === 'gioco') await turnoGioco()
      else break
    }
  } catch (e) { console.error(e) }
  await fineGiro()
}

async function turnoAssicurazione() {
  const m = tavolo.daAssicurare[0], mm = mani.get(m.id)
  const bj = m.carte.length === 2 && punti(m.carte).tot === 21
  const costo = m.base / 2
  attiva(m.id)
  const puo = bj || pzk.saldo() >= costo
  voce(bj ? `asso del banco: casella ${m.casella + 1}, blackjack alla pari?` : `asso del banco: assicuri la casella ${m.casella + 1}? costa ${fmt(costo)}${puo ? '' : ' (non ti bastano)'}`)
  el.chiede.hidden = false
  el.chiede.querySelector('[data-si="1"]').textContent = bj ? 'alla pari' : 'assicura'
  el.chiede.querySelector('[data-si="1"]').disabled = !puo
  el.chiede.querySelector('[data-si="0"]').textContent = 'no'
  el.chiede.querySelector(puo ? '[data-si="1"]' : '[data-si="0"]').focus({ preventScroll: true })
  const s = await chiedi()
  el.chiede.hidden = true
  void mm
  await recita(tavolo.assicura(s === 'si'))
}

async function turnoGioco() {
  const m = tavolo.attiva, mm = mani.get(m.id)
  const az = tavolo.azioni()
  const soldi = pzk.saldo() >= az.extra
  attiva(m.id)
  const p = punti(m.carte)
  const contro = tavolo.banco[0]
  voce(`casella ${m.casella + 1}${ordine.get(m.casella).length > 1 ? ` (mano ${ordine.get(m.casella).indexOf(m.id) + 1})` : ''}: ${p.morbido ? `${p.duro} o ${p.tot}` : p.tot} contro ${contro.r === 'A' ? 'un asso' : `un ${valore(contro.r) === 10 ? '10' : contro.r}`}`)
  el.azioni.hidden = false
  for (const b of el.azioni.children) {
    const a = b.dataset.a
    const ok = az[a] && (a === 'raddoppia' || a === 'dividi' ? soldi : true)
    b.hidden = a === 'resa' && !R().resa
    b.disabled = !ok
    b.title = !az[a] ? '' : (a === 'raddoppia' || a === 'dividi') && !soldi ? `servono ${fmt(az.extra)} $pzk` : ''
  }
  el.azioni.querySelector('button:not(:disabled)')?.focus({ preventScroll: true })
  void mm
  for (;;) {
    const a = await chiedi()
    const ora = tavolo.azioni()
    if (!ora[a]) continue
    if ((a === 'raddoppia' || a === 'dividi') && pzk.saldo() < ora.extra) { voce(`per ${a === 'dividi' ? 'dividere' : 'raddoppiare'} servono ${fmt(ora.extra)} $pzk`); scuoti(el.saldo); continue }
    el.azioni.hidden = true
    await recita(tavolo[a]())
    return
  }
}

function tastiera(e) {
  if (e.target.closest('select')) return
  const k = e.key.toLowerCase()
  if (!el.azioni.hidden) {
    const a = { c: 'carta', s: 'stai', r: 'raddoppia', d: 'dividi', a: 'resa' }[k]
    if (a) { const b = el.azioni.querySelector(`[data-a="${a}"]`); if (b && !b.disabled && !b.hidden) { e.preventDefault(); scegli(a) } }
    return
  }
  if (!el.chiede.hidden) {
    if (k === 's' && !el.chiede.querySelector('[data-si="1"]').disabled) { e.preventDefault(); scegli('si') }
    if (k === 'n') { e.preventDefault(); scegli('no') }
  }
}

// ── gli eventi del tavolo, animati ───────────────────────────────────────────
let inVolo = []
const atterrate = async () => { const v = inVolo; inVolo = []; await Promise.all(v) }

async function recita(ev) {
  for (const e of ev) await (FA[e.t] ?? (async () => {}))(e)
  await atterrate()
  aggiornaBanco()
}

function dove(id) { return id === 'banco' ? banco : mani.get(id) }

const FA = {
  async mescola(e) {
    voce(`mescolo ${e.mazzi} mazzi…`)
    await raccogliScarti()
    // il sabot si riempie, la carta di taglio entra
    scena.scarti(0)
    const passi = RIDOTTO.matches ? 1 : 12
    for (let i = 1; i <= passi; i++) { scena.sabotPieno(i / passi, null); await attendi(40) }
    scena.sabotPieno(1, e.taglio / e.carte)
    scartate = 0
    await attendi(250)
  },
  async rimescola() { voce('le carte sono finite: si rimescolano gli scarti'); await attendi(500) },
  async brucia() {
    const c = scena.nuova(null)
    aggiornaSabot()
    voce(tavolo.R.bruciate > 1 ? `brucio ${tavolo.R.bruciate} carte` : 'brucio la prima carta')
    await scena.muovi(c, { ...scena.sopraScarti() }, { durata: 420, arco: 30 })
    c.via()
    scartate++
    scena.scarti(scartate)
  },
  async taglio() {
    voce('la carta di taglio: è l’ultima mano di questo sabot')
    scena.sabotPieno(quantoPieno(), null)
    await attendi(500)
  },
  async carta(e) {
    const m = dove(e.mano)
    const c3 = scena.nuova(e.carta)
    c3.traverso = !!e.traverso
    aggiornaSabot()
    m.carte.push(c3)
    m.dati.push(e.carta)
    const k = m.carte.length - 1
    const verso = m === banco ? posaBanco(k, m.carte.length) : posaCarta(m, k, e.traverso)
    if (m === banco && k > 0) riponiBanco() // le carte del banco si stringono al centro
    const volo = scena.muovi(c3, { ...verso, su: e.coperta ? 0 : 1 }, { durata: 460, arco: G.cw * 0.9, curva: (t) => 1 - (1 - t) ** 2.4 }).then(() => segnaPunti(m))
    inVolo.push(volo)
    await attendi(e.mano === 'banco' && e.coperta ? 300 : 230)
  },
  async blackjack(e) {
    await atterrate()
    const m = mani.get(e.mano)
    m.bj = true
    segnaPunti(m)
    timbro(m, 'blackjack!', 'oro')
    await attendi(350)
  },
  async laterali(e) {
    await atterrate()
    for (const k of ['pp', 't3']) {
      const l = e[k]
      if (!l) continue
      const key = `${k}${e.casella}`
      const nome = k === 'pp' ? 'perfect pairs' : '21+3'
      if (l.tipo) {
        voce(`${nome}: ${l.tipo === 'mista' ? 'coppia' : l.tipo}! paga ${(k === 'pp' ? PAGA_PP : PAGA_T3)[l.tipo]} a 1`)
        await aggiungi(key, pzk.inFiches(l.torna - l.puntata).slice(0, 14), bancoFiches(), { passo: 30 })
        await attendi(500)
        svuota(key, centro(el.saldo))
      } else svuota(key, bancoFiches(), { scala: 0.7 })
    }
    pzk.regola(GIOCO, e.giocato, e.torna)
    giroNetto += e.torna - e.giocato
    if (e.torna) contaSaldo(pzk.saldo() - e.torna, pzk.saldo())
    stato.puntate[e.casella].pp = stato.puntate[e.casella].t3 = 0
    await attendi(e.torna ? 300 : 150)
  },
  async assicurazione() { await atterrate() },
  async assicura(e) {
    const m = mani.get(e.mano)
    pzk.punta(GIOCO, e.importo)
    await aggiungi(`ins${m.casella}`, pzk.inFiches(e.importo), centro(el.saldo))
  },
  async pari(e) {
    const m = mani.get(e.mano)
    timbro(m, 'alla pari', 'oro')
    await aggiungi(`m${m.id}`, pzk.inFiches(e.torna - e.giocato).slice(0, 14), bancoFiches(), { passo: 30 })
    await attendi(300)
    pzk.regola(GIOCO, e.giocato, e.torna)
    giroNetto += e.torna - e.giocato
    contaSaldo(pzk.saldo() - e.torna, pzk.saldo())
    await svuota(`m${m.id}`, centro(el.saldo))
  },
  async sbircia(e) {
    await atterrate()
    voce('il banco guarda la carta coperta…')
    const c = banco.carte[1]
    if (c) {
      await scena.muovi(c, { sbircia: 0.42, alto: 2 }, { durata: 260 })
      await attendi(320)
      await scena.muovi(c, { sbircia: 0, alto: 0 }, { durata: 220 })
    }
    voce(e.bj ? 'blackjack del banco' : 'niente blackjack: si gioca')
    await attendi(e.bj ? 200 : 450)
  },
  async scopre(e) {
    await atterrate()
    const c = banco.carte[1]
    if (!c) return
    c.scopri(e.carta)
    banco.dati[1] = e.carta
    await scena.muovi(c, { su: 1 }, { durata: 380, arco: G.cw * 0.2 })
    segnaPunti(banco)
    await attendi(200)
  },
  async 'assicurazione chiusa'(e) {
    const m = mani.get(e.mano)
    const key = `ins${m.casella}`
    if (e.vinta) {
      voce('l’assicurazione paga 2 a 1')
      await aggiungi(key, pzk.inFiches(e.torna - e.giocato).slice(0, 14), bancoFiches(), { passo: 30 })
      await attendi(300)
      svuota(key, centro(el.saldo))
    } else svuota(key, bancoFiches(), { scala: 0.7 })
    pzk.regola(GIOCO, e.giocato, e.torna)
    giroNetto += e.torna - e.giocato
    if (e.torna) contaSaldo(pzk.saldo() - e.torna, pzk.saldo())
    await attendi(200)
  },
  async tocca(e) { await atterrate(); attiva(e.mano) },
  async stai(e) { const m = mani.get(e.mano); m.segno?.classList.remove('attiva') },
  async sballa(e) {
    await atterrate()
    const m = mani.get(e.mano)
    segnaPunti(m)
    timbro(m, 'sballa', 'rosso')
    voce(`${testoPunti(m.dati)}: sballa`)
    await attendi(250)
    pzk.regola(GIOCO, e.giocato, 0)
    giroNetto -= e.giocato
    await Promise.all([svuota(`m${m.id}`, bancoFiches(), { scala: 0.7 }), svuota(`r${m.id}`, bancoFiches(), { scala: 0.7 })])
    aggiornaBanco()
  },
  async raddoppia(e) {
    const m = mani.get(e.mano)
    pzk.punta(GIOCO, e.extra)
    voce(`raddoppi: ${fmt(e.extra)} in più, una carta sola`)
    await aggiungi(`r${m.id}`, pzk.inFiches(e.extra), centro(el.saldo))
  },
  async dividi(e) {
    const m = mani.get(e.mano)
    pzk.punta(GIOCO, e.extra)
    const n = { id: e.nuova, casella: m.casella, carte: [m.carte.pop()], dati: [m.dati.pop()], segno: null }
    mani.set(n.id, n)
    ordine.set(m.casella, e.ordine)
    voce('dividi: due mani')
    // le carte si allargano, le pile seguono le loro mani
    await Promise.all([riponiMano(m), riponiMano(n), ...e.ordine.filter((id) => id !== m.id && id !== n.id).map((id) => riponiMano(mani.get(id)))])
    for (const id of e.ordine) { for (const k of [`m${id}`, `r${id}`]) { const p = pile.get(k); if (p) mettiPila(k, p) } segnaPunti(mani.get(id)) }
    await aggiungi(`m${n.id}`, pzk.inFiches(e.extra), centro(el.saldo))
  },
  async resa(e) {
    await atterrate()
    const m = mani.get(e.mano)
    timbro(m, 'resa', 'grigio')
    voce(`abbandoni: ti torna metà, ${fmt(e.torna)} $pzk`)
    pzk.regola(GIOCO, e.giocato, e.torna)
    giroNetto += e.torna - e.giocato
    contaSaldo(pzk.saldo() - e.torna, pzk.saldo())
    // metà al banco, metà al giocatore
    const p = pile.get(`m${m.id}`)
    if (p) {
      const tutte = [...p.el.children]
      pile.delete(`m${m.id}`)
      await Promise.all(tutte.map((img, j) => { const da = centro(img); img.style.visibility = 'hidden'; return vola(p.fiches[j], da, j % 2 ? bancoFiches() : centro(el.saldo), { durata: 480, alto: 24, dopo: j * 30, svanisce: true, scala: 0.8 }) }))
      p.el.remove()
    }
  },
  async esito(e) {
    await atterrate()
    attiva(null)
    const b = e.banco
    voce(b.bj ? 'blackjack del banco' : b.sballa ? `il banco sballa con ${b.tot}` : `il banco fa ${b.tot}`)
    if (banco.carte.length) timbro(banco, b.bj ? 'blackjack' : b.sballa ? 'sballa' : String(b.tot), b.sballa ? 'rosso' : '')
    await attendi(500)
    let netto = 0, torna = 0, giocato = 0
    // le perse al banco, poi le vinte pagate accanto e tutto al giocatore
    const perse = e.mani.filter((x) => x.torna === 0)
    await Promise.all(perse.map((x, k) => { timbro(mani.get(x.mano), 'perde', 'grigio'); return Promise.all([svuota(`m${x.mano}`, bancoFiches(), { dopo: k * 80, scala: 0.7 }), svuota(`r${x.mano}`, bancoFiches(), { dopo: k * 80 + 40, scala: 0.7 })]) }))
    const vinte = e.mani.filter((x) => x.torna > 0)
    await Promise.all(vinte.map(async (x, k) => {
      const m = mani.get(x.mano)
      const vincita = x.torna - x.giocato
      if (vincita > 0) {
        timbro(m, x.esito === 'blackjack' ? `+${fmt(vincita)}` : `vince +${fmt(vincita)}`, 'oro')
        await aggiungi(`r${x.mano}`, pzk.inFiches(vincita).slice(0, 16), bancoFiches(), { dopo: k * 120, passo: 34 })
      } else if (vincita === 0) timbro(m, 'pari', 'grigio')
      else timbro(m, 'perde', 'grigio') // obo: tornano solo raddoppi e divisioni
    }))
    if (vinte.length) await attendi(500)
    for (const x of e.mani) { giocato += x.giocato; torna += x.torna; netto += x.torna - x.giocato }
    pzk.regola(GIOCO, giocato, torna)
    if (torna) contaSaldo(pzk.saldo() - torna, pzk.saldo())
    await Promise.all(vinte.map((x, k) => Promise.all([svuota(`m${x.mano}`, centro(el.saldo), { dopo: k * 60 }), svuota(`r${x.mano}`, centro(el.saldo), { dopo: k * 60 + 30 })])))
    const tutto = giroNetto + netto
    voce(`${b.bj ? 'blackjack del banco' : b.sballa ? `il banco sballa (${b.tot})` : `il banco fa ${b.tot}`} · ${tutto > 0 ? `vinci ${fmt(tutto)} $pzk` : tutto < 0 ? `perdi ${fmt(-tutto)} $pzk` : 'pari'}`)
  },
}
let giroNetto = 0 // quanto si è vinto o perso prima dell'esito (laterali, rese, sballate, alla pari, assicurazioni)
let scartate = 0

function quantoPieno() { return tavolo ? tavolo.rimaste / tavolo.carte.length : 0 }
function aggiornaSabot() {
  if (!tavolo) return
  const davanti = tavolo.taglio - tavolo.pos // carte prima della carta di taglio
  scena.sabotPieno(quantoPieno(), tavolo.ultima || davanti < 0 ? null : davanti / Math.max(1, tavolo.rimaste))
}

// a fine mano: le carte nella vaschetta degli scarti, da destra a sinistra (come raccoglie il banco), poi le sue
async function raccogli() {
  const gruppi = [...[...mani.values()].sort((a, b) => b.casella - a.casella || 0), banco]
  for (const m of gruppi) {
    for (const t of m.timbri ?? []) t.classList.add('via')
    m.segno?.remove(); m.segno = null
  }
  await attendi(200)
  for (const m of gruppi) {
    if (!m.carte.length) continue
    // si raccolgono sulla prima, si girano e vanno negli scarti
    const prima = m.carte[0].posa
    await Promise.all(m.carte.map((c, k) => scena.muovi(c, { x: prima.x, y: prima.y, giro: prima.giro, strato: k }, { durata: 200 })))
    await Promise.all(m.carte.map((c, k) => scena.muovi(c, { ...scena.sopraScarti(), strato: k, su: 0 }, { durata: 460, arco: G.cw * 0.7, ritardo: k * 30 })))
    for (const c of m.carte) c.via()
    scartate += m.carte.length
    scena.scarti(scartate)
    m.carte = []
  }
  for (const m of gruppi) for (const t of m.timbri ?? []) t.remove()
}
async function raccogliScarti() {
  if (!scartate) return
  // gli scarti tornano nel sabot: la pila si abbassa
  const passi = RIDOTTO.matches ? 1 : 10
  for (let i = passi - 1; i >= 0; i--) { scena.scarti(Math.round((scartate * i) / passi)); await attendi(35) }
  scartate = 0
}

async function fineGiro() {
  attiva(null)
  el.azioni.hidden = el.chiede.hidden = true
  for (let c = 0; c < CASELLE; c++) stato.puntate[c] = { base: 0, pp: 0, t3: 0 }
  // se qualcosa è rimasto sul tavolo (non dovrebbe), torna al giocatore
  const resto = pzk.sulTavolo(GIOCO)
  if (resto > 0) { console.warn('blackjack: restavano', resto); pzk.regola(GIOCO, resto, resto) }
  for (const k of [...pile.keys()]) svuota(k, centro(el.saldo))
  stato.fase = 'raccolta'
  aggiornaBanco()
  await attendi(1200)
  await raccogli()
  mani.clear()
  ordine.clear()
  banco.carte = []; banco.dati = []; banco.bj = false; banco.timbri = []
  giroNetto = 0
  stato.fase = 'punta'
  aggiornaBanco()
  if (tavolo.daMescolare) voce('il sabot è finito: alla prossima mano si mescola')
  if (pzk.aSecco()) voce('hai finito i $pzk: ricarica')
  el.dai.focus({ preventScroll: true })
}

let contando = false
function contaSaldo(da, a) {
  const durata = RIDOTTO.matches ? 0 : 800
  if (!durata) { el.saldo.textContent = `$pzk ${fmt(a)}`; return }
  contando = true
  const t0 = performance.now()
  const passo = (t) => {
    const u = Math.min(1, (t - t0) / durata), e = 1 - (1 - u) ** 3
    el.saldo.textContent = `$pzk ${fmt(Math.round((da + (a - da) * e) * 2) / 2)}`
    if (u < 1) requestAnimationFrame(passo)
    else { contando = false; aggiornaBanco() }
  }
  requestAnimationFrame(passo)
}

// ── il motore 3D ─────────────────────────────────────────────────────────────
async function avviaMotore() {
  const [{ Scena }, carte] = await Promise.all([import(QUI + 'scena.js'), import(QUI + 'carte.js')])
  await carte.preparaCarte()
  scena = new Scena(el.canvas)
  scena.veloce = stato.veloce ? 3 : 1
  tavolo = new Tavolo(R())
  ridisegna()
  scena.sabotPieno(0, null)
  el.carica.remove()
  scena.avvia()
  aggiornaBanco()
}
