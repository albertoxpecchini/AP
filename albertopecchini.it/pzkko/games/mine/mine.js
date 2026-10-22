// Le mine di pzkko.it, in una finestra sopra il muro come la roulette e il
// blackjack: il foglio grande col nastro, il campo stampato sopra (SVG: le
// venticinque caselle, la scala dei moltiplicatori, il cerchio della puntata),
// le fiches fotografate (le stesse degli altri giochi) e le tessere 3D
// (three.js, scena.js) che si girano: sotto ognuna una gemma o una mina. Le
// regole sono quelle delle mine dei casinò online (regole.js): si sceglie quante
// mine, si punta, si scoprono le caselle e si incassa quando si vuole; una mina
// si prende tutto e scoppia davvero, e la bruciatura resta sul foglio. I $pzk
// sono gli stessi di tutti i giochi (../pzk.js).
//
// index.html la apre con import('/games/mine/mine.js').then((m) => m.apri()).

import * as pzk from '../pzk.js'
import { LATO, CASELLE, MINE, LIMITI, MASSIMO, BANCO, centesimi, vincita, scriviMolt, nomeCasella, nuovoSeme, Partita } from './regole.js'

const QUI = new URL('.', import.meta.url).href
const ART = '/art/'
const GIOCO = 'mine'
const CHIAVE = 'pzkko-mine'
const RIDOTTO = matchMedia('(prefers-reduced-motion: reduce)')
const fmt = pzk.fmt
const svgEl = (tag, attr = {}) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const [k, v] of Object.entries(attr)) e.setAttribute(k, v); return e }
const parola = (n, uno, tanti) => `${fmt(n)} ${n === 1 ? uno : tanti}`

// ── lo stato ─────────────────────────────────────────────────────────────────
const stato = {
  m: MINE.prima,
  fiche: 5, // l'ultima fiche posata (il cerchio della puntata posa questa)
  fase: 'punta', // 'punta' | 'prepara' | 'gioco' | 'fine'
  puntata: 0,
  mosse: [], // le fiches posate, in ordine (per «togli»)
  ultima: 0, // la puntata dell'ultimo giro (per «rifai»)
  veloce: false,
  seme: '', // il seme del giocatore: resta nel browser
  giro: 0, // quanti giri ha giocato questo browser (entra nel conto delle mine)
  storia: [], // gli ultimi giri: il moltiplicatore incassato in centesimi, 0 = mina
  partita: null,
  bruciature: [], // le esplosioni sul foglio: { i, seme }
}
function carica() {
  try {
    const s = JSON.parse(localStorage.getItem(CHIAVE) || 'null')
    if (s) {
      if (Number.isInteger(s.m) && s.m >= MINE.min && s.m <= MINE.max) stato.m = s.m
      if (typeof s.seme === 'string' && /^[0-9a-f]{8,64}$/.test(s.seme)) stato.seme = s.seme
      if (Number.isInteger(s.giro) && s.giro >= 0) stato.giro = s.giro
      if (Array.isArray(s.storia)) stato.storia = s.storia.filter((c) => Number.isInteger(c) && c >= 0).slice(0, 12)
      if (s.ultima > 0 && s.ultima <= LIMITI.max) stato.ultima = s.ultima
    }
  } catch {}
  if (!stato.seme) stato.seme = nuovoSeme(8)
}
function salva() { try { localStorage.setItem(CHIAVE, JSON.stringify({ m: stato.m, seme: stato.seme, giro: stato.giro, storia: stato.storia, ultima: stato.ultima })) } catch {} }
const attendi = (ms) => new Promise((r) => setTimeout(r, RIDOTTO.matches ? 0 : ms / (stato.veloce ? 3 : 1)))

let dlg, el = {}, scena = null, motore = null, G = null

// ── la finestra ──────────────────────────────────────────────────────────────
export async function apri() {
  if (!dlg) await costruisci()
  if (!dlg.open) {
    dlg.classList.remove('chiude')
    dlg.showModal()
    ridisegna()
    aggiornaBanco()
  }
  if (!motore) motore = avviaMotore().catch((e) => { console.error(e); el.carica.textContent = 'le tessere non sono arrivate: riprova più tardi' })
  else scena?.avvia()
}

async function costruisci() {
  carica()
  await new Promise((ok) => {
    const l = document.createElement('link')
    l.rel = 'stylesheet'; l.href = QUI + 'mine.css'
    l.onload = ok; l.onerror = ok
    document.head.appendChild(l)
  })
  dlg = document.createElement('dialog')
  dlg.className = 'mn'
  dlg.setAttribute('aria-labelledby', 'mn-titolo')
  dlg.innerHTML = `
    <div class="mn-dentro">
      <header class="mn-testa">
        <h2 id="mn-titolo">mine</h2>
        <p class="mn-voce" aria-live="polite"></p>
        <label class="mn-quante"><span>con</span> <select aria-label="quante mine">${Array.from({ length: MINE.max - MINE.min + 1 }, (_, k) => `<option>${k + MINE.min}</option>`).join('')}</select> <span class="mn-nome-mine">mine</span></label>
        <button class="mn-chiudi" type="button" aria-label="chiudi le mine"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M9 10c7 6 14 13 22 21M30 8c-6 8-13 15-21 23"/></svg></button>
      </header>
      <div class="mn-campo">
        <svg class="mn-tavolo" role="group" aria-label="il campo delle mine"></svg>
        <div class="mn-fiches"></div>
        <canvas class="mn-3d" aria-hidden="true"></canvas>
        <div class="mn-segni" aria-hidden="true"></div>
        <div class="mn-sotto"><ol class="mn-storia" aria-label="gli ultimi giri"></ol><button class="mn-prova" type="button" hidden></button></div>
        <p class="mn-carica">le tessere arrivano…</p>
      </div>
      <div class="mn-banco">
        <p class="mn-saldo"><small>hai</small><b></b><span class="puntato"></span></p>
        <div class="mn-scegli" role="group" aria-label="punta una fiche"></div>
        <div class="mn-tasti">
          <button class="mn-piccolo mn-togli" type="button">togli</button>
          <button class="mn-piccolo mn-rifai" type="button">rifai</button>
          <button class="mn-piccolo mn-caso" type="button" aria-keyshortcuts="a" title="scopre una casella a caso">a caso</button>
          <button class="mn-piccolo mn-veloce" type="button" aria-pressed="false" title="le tessere si girano tre volte più in fretta">×3</button>
          <button class="mn-gioca" type="button">gioca</button>
        </div>
      </div>
    </div>`
  document.body.appendChild(dlg)
  const q = (s) => dlg.querySelector(s)
  el = {
    voce: q('.mn-voce'), chiudi: q('.mn-chiudi'), quante: q('.mn-quante select'), nomeMine: q('.mn-nome-mine'), campo: q('.mn-campo'), svg: q('.mn-tavolo'),
    fiches: q('.mn-fiches'), canvas: q('.mn-3d'), segni: q('.mn-segni'), sotto: q('.mn-sotto'), storia: q('.mn-storia'), prova: q('.mn-prova'), carica: q('.mn-carica'),
    saldo: q('.mn-saldo b'), puntato: q('.mn-saldo .puntato'), scegli: q('.mn-scegli'), togli: q('.mn-togli'), rifai: q('.mn-rifai'), caso: q('.mn-caso'),
    veloce: q('.mn-veloce'), gioca: q('.mn-gioca'),
  }
  // chi mi segue su instagram riceve 1.000 $pzk (una volta, ../pzk.js)
  q('.mn-saldo').appendChild(pzk.linkInstagram({ fatto: () => { voce(`grazie del follow: +${fmt(pzk.PREMIO_IG)} $pzk`); contaSaldo(pzk.saldo() - pzk.PREMIO_IG, pzk.saldo()); aggiornaBanco() } }))
  // c'è un posto solo: toccare una fiche la punta
  for (const v of pzk.FICHES) {
    const b = document.createElement('button')
    b.type = 'button'
    b.dataset.v = v
    b.setAttribute('aria-label', `punta una fiche da ${v}`)
    b.innerHTML = `<img src="${ART}fiches/f${v}.webp" alt="" width="170" height="174">`
    if (v === stato.fiche) b.autofocus = true
    b.addEventListener('click', () => posa(v))
    el.scegli.appendChild(b)
  }
  el.quante.value = String(stato.m)
  el.quante.addEventListener('change', () => cambiaMine(Number(el.quante.value)))
  el.chiudi.addEventListener('click', chiudi)
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); chiudi() })
  dlg.addEventListener('click', (e) => { if (e.target === dlg) chiudi() })
  el.gioca.addEventListener('click', gioca)
  el.togli.addEventListener('click', togli)
  el.rifai.addEventListener('click', rifai)
  el.caso.addEventListener('click', aCaso)
  el.prova.addEventListener('click', copiaProva)
  el.veloce.addEventListener('click', () => { stato.veloce = !stato.veloce; el.veloce.setAttribute('aria-pressed', String(stato.veloce)); if (scena) scena.veloce = stato.veloce ? 3 : 1 })
  dlg.addEventListener('keydown', tastiera)
  new ResizeObserver(() => { if (dlg.open) ridisegna() }).observe(el.campo)
  pzk.ascolta(() => aggiornaBanco())
  voce(pzk.aSecco() ? 'hai finito i $pzk: ricarica' : 'tocca le fiches per puntare, poi gioca')
  aggiornaStoria()
  aggiornaBanco()
}

function chiudi() {
  if (!dlg?.open || dlg.classList.contains('chiude')) return
  const fine = () => { dlg.close(); dlg.classList.remove('chiude'); scena?.ferma(); if (location.hash === '#mine') history.replaceState(null, '', location.pathname + location.search) }
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
  const punta = stato.fase === 'punta', gioco = stato.fase === 'gioco', P = stato.partita
  for (const b of el.scegli.children) b.disabled = !punta
  el.scegli.hidden = gioco
  el.togli.hidden = el.rifai.hidden = gioco
  el.togli.disabled = !punta || !stato.mosse.length
  el.rifai.disabled = !punta || !stato.ultima || stato.puntata > 0
  el.caso.hidden = !gioco
  el.quante.disabled = !punta
  el.nomeMine.textContent = stato.m === 1 ? 'mina' : 'mine'
  el.gioca.classList.toggle('incassa', gioco)
  if (gioco) {
    el.gioca.textContent = P.k ? `incassa ${fmt(P.vincita)}` : 'incassa'
    el.gioca.disabled = !P.k
    el.gioca.title = P.k ? `${scriviMolt(P.centesimi)} della puntata` : 'prima trova una gemma'
  } else if (punta && pzk.aSecco() && !stato.puntata) {
    el.gioca.textContent = 'ricarica'
    el.gioca.disabled = false
    el.gioca.title = ''
  } else {
    el.gioca.textContent = 'gioca'
    el.gioca.disabled = !punta || !scena || !stato.puntata
    el.gioca.title = ''
  }
  dlg.classList.toggle('chiuso', !gioco)
}

function cambiaMine(m) {
  if (stato.fase !== 'punta' || !(m >= MINE.min && m <= MINE.max)) { el.quante.value = String(stato.m); return }
  stato.m = m
  salva()
  disegnaScala()
  aggiornaBanco()
  const n = CASELLE - m
  voce(`${parola(m, 'mina', 'mine')} e ${parola(n, 'gemma', 'gemme')}: la prima paga ${scriviMolt(centesimi(m, 1))}, ${n > 1 ? 'tutte' : 'lei'} ${scriviMolt(centesimi(m, n))}`)
}

// ── il campo (SVG stampato sul foglio) ───────────────────────────────────────
// Sul computer le caselle a sinistra e la colonna a destra (il banco, la puntata,
// la scala dei moltiplicatori); sul telefono le caselle sopra e il resto sotto.
function geometria() {
  const w = el.campo.clientWidth, h = el.campo.clientHeight
  const largo = w >= h * 1.3
  const et = largo ? 16 : 14 // le lettere e i numeri intorno al campo
  let S, gx, gy
  if (largo) { S = Math.min(h - et - 4, w * 0.6); gx = et + 2; gy = et + 1 }
  else { S = Math.max(150, Math.min(w - et - 6, h - et - 160)); gx = et + Math.max(0, (w - et - 6 - S) / 2); gy = et }
  const p = S / LATO
  const caselle = Array.from({ length: CASELLE }, (_, i) => ({ x: gx + ((i % LATO) + 0.5) * p, y: gy + (Math.floor(i / LATO) + 0.5) * p }))
  const g = { w, h, largo, et, S, gx, gy, p, lato: p * 0.86, caselle }
  if (largo) {
    const x = gx + S + 24, cw = w - x - 2
    Object.assign(g, {
      banco: { x: x + cw / 2, y: 0, w: Math.min(150, cw * 0.56), h: 22 },
      puntata: { x: x + 46, y: 78, r: 34 },
      vinto: { x: x + 46 + 88, y: 78, r: 26 },
      piccola: { x: x + cw / 2, y: 158, w: cw },
      scala: { x, y: 172, w: cw, h: h - 172 - 58, verticale: true },
      sotto: { x, y: h - 50, w: cw },
    })
  } else {
    const y = gy + S + 10
    Object.assign(g, {
      banco: { x: w - 60, y: y + 2, w: 112, h: 16 },
      puntata: { x: 34, y: y + 42, r: 28 },
      vinto: { x: 34 + 62, y: y + 42, r: 21 },
      piccola: { x: w / 2, y: y + 100, w },
      scala: { x: 132, y: y + 20, w: w - 132, h: 64, verticale: false },
      sotto: { x: 0, y: y + 110, w },
    })
  }
  g.fiche = Math.round(Math.max(22, Math.min(30, g.lato * 0.36)))
  return g
}

function disegnaTavolo() {
  if (!el.campo?.clientWidth) return
  G = geometria()
  const { w, h, p, gx, gy, S, et, banco, puntata, vinto, piccola } = G
  const svg = el.svg
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`)
  svg.innerHTML = ''
  const defs = svgEl('defs')
  defs.innerHTML = `<filter id="mn-ink" x="-2%" y="-2%" width="104%" height="104%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="5" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.5" result="d"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -.55 1.22" result="g"/><feComposite in="d" in2="g" operator="in"/></filter>
    <radialGradient id="mn-brucia"><stop offset="0" stop-color="#120b06" stop-opacity=".95"/><stop offset=".32" stop-color="#24140a" stop-opacity=".88"/><stop offset=".58" stop-color="#4f3016" stop-opacity=".55"/><stop offset=".8" stop-color="#8a6234" stop-opacity=".2"/><stop offset="1" stop-color="#9a7040" stop-opacity="0"/></radialGradient>`
  svg.appendChild(defs)
  G.defs = defs
  const stampa = svgEl('g', { filter: 'url(#mn-ink)' })
  svg.appendChild(stampa)
  const ink = '#161616', rosso = '#b3121f'
  const testo = (t, x, y, a = {}) => { const e = svgEl('text', { x, y, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: ink, ...a }); e.textContent = t; stampa.appendChild(e); return e }
  // il campo: il bordo, le caselle, le lettere sopra e i numeri a sinistra (come una mappa)
  stampa.appendChild(svgEl('rect', { x: gx - 3, y: gy - 3, width: S + 6, height: S + 6, rx: 10, fill: 'none', stroke: ink, 'stroke-width': 1.8 }))
  for (let i = 0; i < CASELLE; i++) {
    const c = G.caselle[i], s = p * 0.92
    stampa.appendChild(svgEl('rect', { x: c.x - s / 2, y: c.y - s / 2, width: s, height: s, rx: p * 0.14, fill: 'none', stroke: ink, 'stroke-width': 0.9, 'stroke-opacity': 0.55 }))
  }
  const fe = Math.round(Math.min(13, et * 0.8))
  for (let k = 0; k < LATO; k++) {
    testo('abcde'[k], gx + (k + 0.5) * p, gy - et / 2 - 2, { class: 'mn-piccola', 'font-size': fe })
    testo(String(k + 1), gx - et / 2 - 2, gy + (k + 0.5) * p, { class: 'mn-piccola', 'font-size': fe })
  }
  // la cassetta del banco
  stampa.appendChild(svgEl('rect', { x: banco.x - banco.w / 2, y: banco.y - 4, width: banco.w, height: banco.h + 4, rx: 4, fill: 'none', stroke: ink, 'stroke-width': 1.5 }))
  for (let k = 1; k < 6; k++) { const x = banco.x - banco.w / 2 + (banco.w * k) / 6; stampa.appendChild(svgEl('line', { x1: x, y1: banco.y, x2: x, y2: banco.y + banco.h - 4, stroke: ink, 'stroke-width': 0.8, 'stroke-opacity': 0.6 })) }
  // il cerchio della puntata e quello della vincita
  stampa.appendChild(svgEl('circle', { cx: puntata.x, cy: puntata.y, r: puntata.r, fill: 'none', stroke: ink, 'stroke-width': 1.8 }))
  stampa.appendChild(svgEl('circle', { cx: puntata.x, cy: puntata.y, r: puntata.r - 4, fill: 'none', stroke: ink, 'stroke-width': 0.8 }))
  stampa.appendChild(svgEl('circle', { cx: vinto.x, cy: vinto.y, r: vinto.r, fill: 'none', stroke: ink, 'stroke-width': 1.2, 'stroke-dasharray': '4 3', 'stroke-opacity': 0.7 }))
  const fp = G.largo ? 13 : 11
  testo('puntata', puntata.x, puntata.y + puntata.r + fp * 0.9, { class: 'mn-grande', 'font-size': fp + 2 })
  testo(`${LIMITI.min}–${fmt(LIMITI.max)}`, puntata.x, puntata.y + puntata.r + fp * 2.1, { class: 'mn-piccola', 'font-size': fp - 1, fill: rosso })
  testo('vincita', vinto.x, vinto.y + puntata.r + fp * 0.9, { class: 'mn-grande', 'font-size': fp + 2 })
  testo(`il banco tiene l’${BANCO}% · al più ${fmt(MASSIMO)} $pzk a giro`, piccola.x, piccola.y, { class: 'mn-piccola', 'font-size': G.largo ? 10.5 : 9.5, fill: rosso })
  // le bruciature delle mine scoppiate (sopra la stampa, sotto le tessere), la scala, le zone
  G.bruciature = svgEl('g')
  svg.appendChild(G.bruciature)
  G.scala.g = svgEl('g', { filter: 'url(#mn-ink)' })
  svg.appendChild(G.scala.g)
  const zone = svgEl('g')
  G.zone = []
  for (let i = 0; i < CASELLE; i++) {
    const c = G.caselle[i], s = p * 0.96
    const z = svgEl('rect', { x: c.x - s / 2, y: c.y - s / 2, width: s, height: s, rx: p * 0.15, class: 'mn-zona', role: 'button', tabindex: -1 })
    z.dataset.i = i
    zone.appendChild(z)
    G.zone.push(z)
  }
  const zp = svgEl('circle', { cx: puntata.x, cy: puntata.y, r: puntata.r, class: 'mn-zona mn-zona-puntata', role: 'button', tabindex: 0 })
  zp.dataset.puntata = '1'
  zone.appendChild(zp)
  G.zonaPuntata = zp
  svg.appendChild(zone)
  zone.addEventListener('click', (e) => { const z = e.target.closest('.mn-zona'); if (!z) return; if (z.dataset.puntata) posa(stato.fiche); else tocca(Number(z.dataset.i)) })
  zone.addEventListener('keydown', tastiZone)
  zone.addEventListener('pointerover', (e) => { const i = e.target.dataset?.i; if (i != null) solleva(Number(i), true) })
  zone.addEventListener('pointerout', (e) => { const i = e.target.dataset?.i; if (i != null) solleva(Number(i), false) })
  zone.addEventListener('focusin', (e) => { const i = e.target.dataset?.i; if (i != null) { attiva = Number(i); solleva(attiva, true) } })
  zone.addEventListener('focusout', (e) => { const i = e.target.dataset?.i; if (i != null) solleva(Number(i), false) })
  disegnaBruciature()
  disegnaScala()
  aggiornaZone()
}

// la scala: quanto paga ogni gemma con queste mine, la riga di adesso evidenziata, la prossima con la freccia
function disegnaScala() {
  const g = G?.scala?.g
  if (!g) return
  g.innerHTML = ''
  const P = stato.partita, inGiro = P && (stato.fase === 'gioco' || stato.fase === 'fine')
  const m = inGiro ? P.m : stato.m, k = inGiro ? P.k : 0, pu = inGiro ? P.puntata : stato.puntata
  const n = CASELLE - m, sc = G.scala
  const ink = '#161616', rosso = '#b3121f'
  const testo = (t, x, y, a = {}) => { const e = svgEl('text', { x, y, 'dominant-baseline': 'central', fill: ink, ...a }); e.textContent = t; g.appendChild(e); return e }
  const evid = (x, y, w, h) => g.appendChild(svgEl('rect', { x, y, width: w, height: h, fill: '#ffd400', 'fill-opacity': 0.7 }))
  const freccia = (x, y) => g.appendChild(svgEl('path', { d: `M${x - 13} ${y + 1}c4-1 8-1 11 0M${x - 5} ${y - 4}l4 5-4 4`, fill: 'none', stroke: rosso, 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }))
  testo(`con ${parola(m, 'mina', 'mine')}`, sc.x + (sc.verticale ? 2 : 0), sc.y + (sc.verticale ? 9 : 4), { class: 'mn-grande', 'font-size': sc.verticale ? 19 : 13 })
  if (sc.verticale) {
    const rh = 22, y0 = sc.y + 42, stanno = Math.max(4, Math.floor((sc.h - 42) / rh))
    const righe = n > stanno ? stanno - 2 : stanno // se non ci stanno tutte: i puntini e l'ultima
    const x1 = sc.x + 40, x2 = sc.x + sc.w * 0.56, x3 = sc.x + sc.w - 6
    testo('gemme', x1, sc.y + 31, { class: 'mn-piccola', 'font-size': 10.5, 'text-anchor': 'end' })
    testo('paga', x2, sc.y + 31, { class: 'mn-piccola', 'font-size': 10.5, 'text-anchor': 'end' })
    testo(pu ? `vinci con ${fmt(pu)}` : 'vinci', x3, sc.y + 31, { class: 'mn-piccola', 'font-size': 10.5, 'text-anchor': 'end' })
    g.appendChild(svgEl('line', { x1: sc.x + 4, y1: y0 - 3, x2: x3, y2: y0 - 3, stroke: ink, 'stroke-width': 1 }))
    const da = Math.max(1, Math.min(k || 1, n - righe + 1))
    const riga = (kk, y) => {
      if (kk === k) evid(sc.x + 4, y - rh / 2 + 1, x3 - sc.x - 2, rh - 2)
      if (kk === k + 1 && stato.fase === 'gioco') freccia(sc.x + 18, y)
      testo(String(kk), x1, y, { class: 'mn-grande', 'font-size': 15, 'text-anchor': 'end' })
      testo(scriviMolt(centesimi(m, kk)), x2, y, { class: 'mn-grande', 'font-size': 15, 'text-anchor': 'end' })
      testo(pu ? fmt(vincita(pu, m, kk)) : '–', x3, y, { class: 'mn-grande', 'font-size': 15, 'text-anchor': 'end', fill: kk === k ? ink : '#5a544c' })
    }
    let r = 0
    for (; r < righe && da + r <= n; r++) riga(da + r, y0 + r * rh + rh / 2)
    // l'ultima riga, tutte le gemme, se non ci sta
    if (da + r <= n) {
      if (da + r < n) testo('⋮', x1 - 3, y0 + r * rh + rh * 0.55, { class: 'mn-piccola', 'font-size': 13, 'text-anchor': 'end' })
      riga(n, y0 + (r + 1) * rh + rh / 2)
    }
  } else {
    const N = 4, cw = sc.w / N, y0 = sc.y + 12
    const da = Math.max(1, Math.min(k || 1, n - N + 1))
    for (let j = 0; j < N && da + j <= n; j++) {
      const kk = da + j, x = sc.x + j * cw + cw / 2
      if (kk === k) evid(sc.x + j * cw + 2, y0, cw - 4, sc.h - 14)
      if (kk === k + 1 && stato.fase === 'gioco') g.appendChild(svgEl('path', { d: `M${x - cw * 0.32} ${y0 + sc.h - 12}c${cw * 0.2} -2 ${cw * 0.44} -2 ${cw * 0.64} 0`, fill: 'none', stroke: rosso, 'stroke-width': 2.2, 'stroke-linecap': 'round' }))
      testo(parola(kk, 'gemma', 'gemme'), x, y0 + 9, { class: 'mn-piccola', 'font-size': 9.5, 'text-anchor': 'middle' })
      testo(scriviMolt(centesimi(m, kk)), x, y0 + 26, { class: 'mn-grande', 'font-size': 15, 'text-anchor': 'middle' })
      if (pu) testo(fmt(vincita(pu, m, kk)), x, y0 + 42, { class: 'mn-piccola', 'font-size': 10, 'text-anchor': 'middle', fill: '#5a544c' })
    }
  }
}

// le bruciature: una macchia bruciacchiata sfrangiata e i puntini della polvere; restano le ultime quattro
function disegnaBruciature() {
  const g = G?.bruciature
  if (!g) return
  g.innerHTML = ''
  stato.bruciature.forEach((b, n) => {
    const c = G.caselle[b.i], p = G.p
    let a = b.seme
    const rnd = () => { a = (a * 1103515245 + 12345) & 0x7fffffff; return a / 0x7fffffff }
    const id = `mn-sfr-${b.seme}`
    if (!G.defs.querySelector(`#${id}`)) {
      const f = svgEl('filter', { id, x: '-40%', y: '-40%', width: '180%', height: '180%' })
      f.innerHTML = `<feTurbulence type="fractalNoise" baseFrequency="${(0.9 / p).toFixed(4)}" numOctaves="3" seed="${b.seme % 1000}"/><feDisplacementMap in="SourceGraphic" scale="${(p * 0.42).toFixed(1)}" xChannelSelector="R" yChannelSelector="G"/>`
      G.defs.appendChild(f)
    }
    const gr = svgEl('g', { class: n === stato.bruciature.length - 1 && b.nuova ? 'mn-bruciata nuova' : 'mn-bruciata', opacity: (0.55 + 0.45 * ((n + 1) / stato.bruciature.length)).toFixed(2) })
    const macchia = svgEl('g', { filter: `url(#${id})` })
    macchia.appendChild(svgEl('ellipse', { cx: c.x + (rnd() - 0.5) * p * 0.1, cy: c.y + (rnd() - 0.5) * p * 0.1, rx: p * (0.62 + rnd() * 0.12), ry: p * (0.58 + rnd() * 0.12), transform: `rotate(${Math.round(rnd() * 180)} ${c.x} ${c.y})`, fill: 'url(#mn-brucia)' }))
    gr.appendChild(macchia)
    for (let k = 0; k < 26; k++) {
      const t = rnd() * Math.PI * 2, d = p * (0.45 + rnd() * rnd() * 1.3)
      gr.appendChild(svgEl('circle', { cx: c.x + Math.cos(t) * d, cy: c.y + Math.sin(t) * d, r: 0.6 + rnd() * 1.8, fill: '#1c120a', 'fill-opacity': (0.35 + rnd() * 0.5).toFixed(2) }))
    }
    g.appendChild(gr)
    b.nuova = false
  })
}

// i nomi e gli stati delle caselle per chi usa la tastiera o un lettore di schermo; una sola entra col tab
let attiva = 12
function aggiornaZone() {
  if (!G?.zone) return
  const P = stato.partita, finito = P?.finita, mine = finito ? new Set(P.mine()) : null
  const gioco = stato.fase === 'gioco'
  G.zone.forEach((z, i) => {
    const trovata = P && (stato.fase === 'gioco' || stato.fase === 'fine') && P.scoperte.includes(i)
    const cosa = trovata ? 'gemma' : finito && P.esito === 'mina' && P.ultima === i ? 'mina, scoppiata' : finito ? (mine.has(i) ? 'mina' : 'gemma, non scoperta') : 'coperta'
    z.setAttribute('aria-label', `${nomeCasella(i)}: ${cosa}`)
    z.setAttribute('aria-disabled', String(!gioco || trovata))
    z.setAttribute('tabindex', i === attiva ? '0' : '-1')
  })
  G.zonaPuntata.setAttribute('aria-label', `la puntata: ${stato.puntata ? `ci sono ${fmt(stato.puntata)} $pzk; ` : ''}tocca per posare una fiche da ${stato.fiche}`)
}
function tastiZone(e) {
  const i = e.target.dataset?.i
  if (i == null) { if ((e.key === 'Enter' || e.key === ' ') && e.target.dataset?.puntata) { e.preventDefault(); posa(stato.fiche) } return }
  const n = Number(i), r = Math.floor(n / LATO), c = n % LATO
  const va = { ArrowLeft: [r, c - 1], ArrowRight: [r, c + 1], ArrowUp: [r - 1, c], ArrowDown: [r + 1, c], Home: [r, 0], End: [r, LATO - 1] }[e.key]
  if (va) {
    e.preventDefault()
    const [rr, cc] = va
    if (rr < 0 || rr >= LATO || cc < 0 || cc >= LATO) return
    attiva = rr * LATO + cc
    aggiornaZone()
    G.zone[attiva].focus()
  } else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tocca(n) }
}

function ridisegna() {
  disegnaTavolo()
  if (!G) return
  scena?.misura(G.w, G.h, G.lato, G.caselle)
  for (const [k, p] of pile) mettiPila(k, p)
  Object.assign(el.sotto.style, { left: `${G.sotto.x}px`, top: `${G.sotto.y}px`, width: `${G.sotto.w}px` })
  for (const t of el.segni.children) t.remove()
}

// ── le fiches ────────────────────────────────────────────────────────────────
const pile = new Map() // posto ('p' la puntata, 'v' la vincita) → { el, fiches: [valori] }
const ALTO = 2.4
const dovePosto = (k) => (k === 'p' ? G.puntata : G.vinto)
function pila(key) {
  let p = pile.get(key)
  if (!p) {
    const e = document.createElement('div')
    e.className = 'mn-pila'
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
  img.className = 'mn-fiche'
  img.src = `${ART}fiches/f${v}.webp`
  img.alt = ''
  const k = Math.min(i, 11), r = ((v * 37 + i * 101) % 23) - 11
  img.style.transform = `translate(${((i * 7) % 3) - 1}px, ${-k * ALTO}px) rotate(${r}deg)`
  img.style.zIndex = String(i)
  return img
}
const centro = (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } }
const nelCampo = (c) => { const r = el.campo.getBoundingClientRect(); return { x: r.left + c.x, y: r.top + c.y } }
const bancoFiches = () => nelCampo({ x: G.banco.x, y: G.banco.y + G.banco.h / 2 })
const dalSaldo = () => (el.scegli.hidden ? centro(el.saldo) : centro(el.scegli))

/** Una fiche che vola da a a b (coordinate della finestra), con l'arco, l'ombra e un rimbalzo. */
function vola(v, a, b, { durata = 380, alto = 40, ruota = 0, dopo = 0, svanisce = false, scala = 1 } = {}) {
  if (RIDOTTO.matches) return Promise.resolve()
  if (stato.veloce) { durata /= 2; dopo /= 2 }
  const img = document.createElement('img')
  img.className = 'mn-volo'
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
  await Promise.all(imgs.map((img, j) => { const da = centro(img); img.style.visibility = 'hidden'; return vola(p.fiches[j] ?? 1, da, { x: verso.x + (j % 3) - 1, y: verso.y }, { durata: 480, alto: 24, dopo: dopo + j * 26, svanisce, scala, ruota: 30 }) }))
  p.el.remove()
}

// ── la puntata ───────────────────────────────────────────────────────────────
function posa(v) {
  if (stato.fase !== 'punta') { voce(stato.fase === 'gioco' ? 'la puntata è fatta: scopri le caselle o incassa' : 'un attimo…'); return }
  stato.fiche = v
  if (stato.puntata + v > LIMITI.max) { voce(`si punta al massimo ${fmt(LIMITI.max)} $pzk`); return }
  if (!pzk.punta(GIOCO, v)) { voce(pzk.saldo() >= 1 ? `non ti bastano: hai ${fmt(pzk.saldo())} $pzk` : 'hai finito i $pzk'); scuoti(el.saldo); return }
  stato.puntata += v
  stato.mosse.push(v)
  aggiornaBanco()
  disegnaScala()
  aggiornaZone()
  voce(`puntata ${fmt(stato.puntata)}: con ${parola(stato.m, 'mina', 'mine')} la prima gemma fa ${fmt(vincita(stato.puntata, stato.m, 1))}`)
  aggiungi('p', [v], centro(el.scegli.querySelector(`[data-v="${v}"] img`)))
}
function togli() {
  if (stato.fase !== 'punta' || !stato.mosse.length) return
  const v = stato.mosse.pop()
  const p = pile.get('p')
  const img = p?.el.lastElementChild
  const da = img ? centro(img) : null
  p?.fiches.pop()
  img?.remove()
  if (p && !p.fiches.length) { p.el.remove(); pile.delete('p') }
  stato.puntata -= v
  pzk.ritira(GIOCO, v)
  aggiornaBanco()
  disegnaScala()
  if (da) vola(v, da, centro(el.scegli.querySelector(`[data-v="${v}"] img`)), { durata: 300, alto: 24 })
}
async function rifai() {
  if (stato.fase !== 'punta' || !stato.ultima || stato.puntata > 0) return
  if (stato.ultima > pzk.saldo()) { voce(`per rifare servono ${fmt(stato.ultima)} $pzk`); scuoti(el.saldo); return }
  for (const v of pzk.inFiches(stato.ultima)) { posa(v); await attendi(60) }
}
function scuoti(e) {
  if (RIDOTTO.matches) return
  e.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(0)' }], { duration: 300 })
}

// ── il giro ──────────────────────────────────────────────────────────────────
async function gioca() {
  if (stato.fase === 'gioco') return incassa()
  if (stato.fase !== 'punta' || !scena) return
  if (pzk.aSecco() && !stato.puntata) { pzk.ricarica(); aggiornaBanco(); voce(`altri ${fmt(pzk.INIZIALE)} $pzk finti: punta`); return }
  if (!stato.puntata) { voce('prima punta: tocca una fiche'); scuoti(el.scegli); return }
  let P
  try { P = Partita.nuova({ puntata: stato.puntata, m: stato.m, semeGiocatore: stato.seme, giro: stato.giro + 1 }) } catch (e) { voce(e.message); return }
  stato.giro = P.giro
  stato.partita = P
  stato.ultima = stato.puntata
  stato.mosse = []
  salva()
  stato.fase = 'prepara'
  aggiornaBanco()
  for (const t of el.segni.children) t.classList.add('via')
  mostraProva()
  voce('si rimescola…')
  await scena.riordina()
  for (const t of [...el.segni.children]) t.remove()
  stato.fase = 'gioco'
  disegnaScala()
  aggiornaZone()
  aggiornaBanco()
  voce(`${parola(P.m, 'mina', 'mine')} sotto venticinque caselle: trova le gemme`)
  G.zone[attiva]?.focus({ preventScroll: true })
}

function tocca(i) {
  if (stato.fase === 'punta') { voce(stato.puntata ? 'premi gioca: le mine si nascondono' : 'prima punta, poi gioca'); return }
  if (stato.fase !== 'gioco') return
  const P = stato.partita
  if (P.scoperte.includes(i)) { voce(`${nomeCasella(i)} è già scoperta`); return }
  attiva = i
  const ev = P.scopri(i)
  if (P.finita) stato.fase = 'fine'
  aggiornaBanco()
  disegnaScala()
  aggiornaZone()
  recita(ev)
}
function aCaso() { if (stato.fase === 'gioco') tocca(stato.partita.aCaso()) }
function incassa() {
  if (stato.fase !== 'gioco' || !stato.partita.k) return
  const ev = stato.partita.incassa()
  stato.fase = 'fine'
  aggiornaBanco()
  disegnaScala()
  recita(ev)
}

function solleva(i, su) {
  const P = stato.partita
  if (!scena || stato.fase !== 'gioco' || P.scoperte.includes(i)) su = false
  scena?.solleva(i, su)
}

function tastiera(e) {
  if (e.target.closest('select') || e.ctrlKey || e.metaKey || e.altKey) return
  const k = e.key.toLowerCase()
  if (stato.fase === 'gioco' && k === 'a') { e.preventDefault(); aCaso() }
  if (stato.fase === 'gioco' && k === 'i') { e.preventDefault(); incassa() }
}

async function recita(ev) { for (const e of ev) await FA[e.t](e) }

const FA = {
  async gemma(e) {
    const P = stato.partita
    voce(`gemma! ${scriviMolt(e.centesimi)}: ${P.finita ? 'tutte trovate' : `incassi ${fmt(e.vincita)} o vai avanti`}`)
    await scena.gira(e.i, 'vuota')
    await scena.gemma(e.i)
  },
  async mina(e) {
    voce('…')
    await scena.gira(e.i, 'vuota', { durata: 380 })
    await scena.innesca(e.i)
    stato.bruciature = [...stato.bruciature, { i: e.i, seme: 1 + Math.floor(Math.random() * 1e6), nuova: true }].slice(-4)
    disegnaBruciature()
    sobbalza()
    timbro(G.caselle[e.i], 'boom', 'rosso')
    await scena.esplodi(e.i)
  },
  async fine(e) {
    const P = stato.partita
    const mine = new Set(e.mine)
    const svelate = scena.svela(P.coperte.map((i) => ({ i, tipo: mine.has(i) ? 'mina' : 'gemma' })), e.esito === 'mina' ? P.ultima : P.scoperte.at(-1))
    if (e.esito === 'mina') {
      pzk.regola(GIOCO, e.giocato, 0)
      voce(`boom: ${nomeCasella(P.ultima)} era una mina. perdi ${fmt(e.giocato)} $pzk`)
      await svuota('p', bancoFiches(), { scala: 0.7 })
    } else {
      const utile = e.torna - e.giocato
      voce(`${e.k === CASELLE - P.m ? 'tutte le gemme! ' : ''}incassi ${fmt(e.torna)} $pzk (${scriviMolt(e.centesimi)}${e.torna >= MASSIMO ? ', il massimo' : ''})`)
      timbro({ x: G.vinto.x, y: G.vinto.y - G.vinto.r - 8 }, `+${fmt(utile)}`, 'oro')
      if (utile > 0) await aggiungi('v', pzk.inFiches(utile).slice(0, 16), bancoFiches(), { passo: 34 })
      await attendi(450)
      pzk.regola(GIOCO, e.giocato, e.torna)
      contaSaldo(pzk.saldo() - e.torna, pzk.saldo())
      await Promise.all([svuota('p', centro(el.saldo)), svuota('v', centro(el.saldo), { dopo: 60 })])
    }
    stato.storia = [e.esito === 'mina' ? 0 : e.centesimi, ...stato.storia].slice(0, 12)
    salva()
    aggiornaStoria()
    mostraProva()
    await svelate
    // se qualcosa è rimasto sul tavolo (non dovrebbe), torna al giocatore
    const resto = pzk.sulTavolo(GIOCO)
    if (resto > 0) { console.warn('mine: restavano', resto); pzk.regola(GIOCO, resto, resto) }
    stato.puntata = 0
    stato.fase = 'punta'
    aggiornaBanco()
    disegnaScala()
    aggiornaZone()
    if (pzk.aSecco()) voce('hai finito i $pzk: ricarica')
    el.gioca.focus({ preventScroll: true })
  },
}

// lo scoppio scuote il foglio
function sobbalza() {
  if (RIDOTTO.matches) return
  el.campo.animate([0, 1, 2, 3, 4, 5, 6, 7].map((k) => ({ transform: k === 7 ? 'none' : `translate(${(Math.random() - 0.5) * (14 - k * 2)}px, ${(Math.random() - 0.5) * (12 - k * 1.6)}px)` })), { duration: 420, easing: 'ease-out' })
}

function timbro(p, testo, tipo = '') {
  const t = document.createElement('span')
  t.className = `mn-timbro ${tipo}`
  t.textContent = testo
  t.style.left = `${p.x}px`
  t.style.top = `${p.y}px`
  el.segni.appendChild(t)
  return t
}

function aggiornaStoria() {
  el.storia.innerHTML = stato.storia.map((c) => (c ? `<li class="vinta">${scriviMolt(c)}</li>` : '<li class="mina">boom</li>')).join('')
}

// la stampa piccola della prova: prima del giro l'impronta del seme del banco, dopo il seme (si copia per rifare il conto)
function mostraProva() {
  const P = stato.partita
  if (!P) return
  el.prova.hidden = false
  el.prova.textContent = P.finita ? `giro ${fmt(P.giro)} · seme ${P.semeBanco.slice(0, 10)}… · copia` : `giro ${fmt(P.giro)} · impronta ${P.impronta.slice(0, 10)}…`
  el.prova.title = P.finita ? 'il seme del banco: con l’impronta di prima dimostra che le mine erano già lì. tocca per copiare tutto' : 'le mine sono già sotto: questa è l’impronta (sha-256) del seme del banco, che si vede a fine giro. tocca per copiarla'
}
async function copiaProva() {
  const P = stato.partita
  if (!P) return
  const righe = [`mine di pzkko.it, giro ${P.giro}`, `impronta del seme del banco (sha-256): ${P.impronta}`]
  if (P.finita) righe.push(`seme del banco: ${P.semeBanco}`, `seme del giocatore: ${P.semeGiocatore}`, `mine: ${P.m}, nelle caselle ${P.mine().map(nomeCasella).join(', ')}`, 'le mine: HMAC-SHA256(seme del banco, «giocatore:giro:cursore»), 4 byte per numero, ognuno pesca una casella fra quelle rimaste; le prime sono le mine')
  try { await navigator.clipboard.writeText(righe.join('\n')); voce(P.finita ? 'copiati il seme, l’impronta e le mine del giro' : 'copiata l’impronta: il seme arriva a fine giro') } catch { voce(`impronta ${P.impronta}`) }
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
  const [{ Scena }, tessere] = await Promise.all([import(QUI + 'scena.js'), import(QUI + 'tessere.js')])
  await tessere.preparaTessere()
  scena = new Scena(el.canvas)
  scena.veloce = stato.veloce ? 3 : 1
  ridisegna()
  el.carica.remove()
  scena.avvia()
  aggiornaBanco()
}
