// Il dado di pzkko.it: il sic bo (tre dadi, grande e piccolo), in una finestra
// sopra il muro, come la roulette e il blackjack: il foglio grande col nastro
// agli angoli, il tavolo stampato sopra (SVG), le fiches fotografate (le stesse
// degli altri giochi) e la campana di vetro in 3D (three.js) coi tre dadi, che
// muove la fisica (Rapier, vedi campana.js): la campana si scuote, i dadi
// saltano e si fermano dove si fermano. Le regole sono quelle vere di Macao o di
// Atlantic City (regole.js); i $pzk sono gli stessi di tutti i giochi (../pzk.js).
//
// index.html lo apre con import('/games/dado/dado.js').then((m) => m.apri()).

import * as pzk from '../pzk.js'
import { REGOLE, PUNTATE, PER_ID, esito, rende, leggi } from './regole.js'

const QUI = new URL('.', import.meta.url).href
const ART = '/art/'
const GIOCO = 'dado'
const CHIAVE = 'pzkko-dado'
const RIDOTTO = matchMedia('(prefers-reduced-motion: reduce)')
const fmt = pzk.fmt
const svgEl = (tag, attr = {}) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const [k, v] of Object.entries(attr)) e.setAttribute(k, v); return e }
const INK = '#161616', ROSSO = '#b3121f'
// i punti di ogni faccia, in frazioni del lato (gli stessi sul tavolo e sui dadi 3D); l'uno e il quattro sono
// rossi, come nei dadi cinesi del sic bo, e l'uno è grande
export const PUNTI = {
  1: [[0.5, 0.5]],
  2: [[0.27, 0.27], [0.73, 0.73]],
  3: [[0.27, 0.27], [0.5, 0.5], [0.73, 0.73]],
  4: [[0.27, 0.27], [0.73, 0.27], [0.27, 0.73], [0.73, 0.73]],
  5: [[0.27, 0.27], [0.73, 0.27], [0.5, 0.5], [0.27, 0.73], [0.73, 0.73]],
  6: [[0.27, 0.25], [0.27, 0.5], [0.27, 0.75], [0.73, 0.25], [0.73, 0.5], [0.73, 0.75]],
}
const rossi = (n) => n === 1 || n === 4

// ── lo stato ─────────────────────────────────────────────────────────────────
const stato = {
  regole: 'macao',
  storia: [], // gli ultimi colpi, il più recente per primo: [a, b, c]
  giocate: new Map(), // id → importo sul tavolo
  mosse: [], // le fiches posate, in ordine (per «togli»)
  ultime: null, // le giocate dell'ultimo colpo (per «rifai»)
  fiche: 5,
  fase: 'punta', // 'punta' | 'scuote' | 'paga'
  usciti: null, // i dadi dell'ultimo colpo, finché il tavolo li segna
  veloce: false,
}
const dado = (n) => Number.isInteger(n) && n >= 1 && n <= 6
function carica() {
  try {
    const s = JSON.parse(localStorage.getItem(CHIAVE) || 'null')
    if (s && REGOLE[s.regole]) stato.regole = s.regole
    if (s && Array.isArray(s.storia)) stato.storia = s.storia.filter((c) => Array.isArray(c) && c.length === 3 && c.every(dado)).slice(0, 12)
  } catch {}
}
// qui le regole scelte e gli ultimi colpi: i $pzk li tiene ../pzk.js (le fiches sul tavolo comprese)
function salva() { try { localStorage.setItem(CHIAVE, JSON.stringify({ regole: stato.regole, storia: stato.storia })) } catch {} }
const R = () => REGOLE[stato.regole]
const puntato = () => [...stato.giocate.values()].reduce((a, b) => a + b, 0)
const attendi = (ms) => new Promise((r) => setTimeout(r, RIDOTTO.matches ? 0 : ms / (stato.veloce ? 2 : 1)))

// ── la finestra ──────────────────────────────────────────────────────────────
let dlg, el = {}, motore = null

export async function apri() {
  if (!dlg) await costruisci()
  if (!dlg.open) {
    dlg.classList.remove('chiude')
    dlg.showModal()
    disegnaTavolo()
    ridisegnaPile()
    aggiornaBanco()
  }
  if (!motore) motore = avviaMotore().catch((e) => { console.error(e); el.carica.textContent = 'la campana non è arrivata: riprova più tardi' })
  else { sporco = true; avvia() }
}

async function costruisci() {
  carica()
  // il CSS prima di mostrare la finestra
  await new Promise((ok) => {
    const l = document.createElement('link')
    l.rel = 'stylesheet'; l.href = QUI + 'dado.css'
    l.onload = ok; l.onerror = ok
    document.head.appendChild(l)
  })
  dlg = document.createElement('dialog')
  dlg.className = 'dd'
  dlg.setAttribute('aria-labelledby', 'dd-titolo')
  dlg.innerHTML = `
    <div class="dd-dentro">
      <header class="dd-testa">
        <h2 id="dd-titolo">dado</h2>
        <p class="dd-voce" aria-live="polite"></p>
        <label class="dd-regole"><span>regole di</span> <select aria-label="la tabella dei pagamenti">${Object.values(REGOLE).map((r) => `<option value="${r.id}">${r.nome}</option>`).join('')}</select></label>
        <button class="dd-chiudi" type="button" aria-label="chiudi il dado"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M9 10c7 6 14 13 22 21M30 8c-6 8-13 15-21 23"/></svg></button>
      </header>
      <div class="dd-campana">
        <canvas aria-label="la campana di vetro coi tre dadi, in 3D" role="img"></canvas>
        <p class="dd-carica">la campana arriva…</p>
        <p class="dd-annuncio" aria-hidden="true"></p>
      </div>
      <div class="dd-banco">
        <div class="dd-riga">
          <p class="dd-saldo"><small>hai</small><b></b><span class="puntato"></span></p>
          <div class="dd-scegli" role="group" aria-label="scegli la fiche"></div>
        </div>
        <div class="dd-tasti">
          <button class="dd-piccolo dd-togli" type="button">togli</button>
          <button class="dd-piccolo dd-rifai" type="button">rifai</button>
          <button class="dd-piccolo dd-veloce" type="button" aria-pressed="false" title="la campana va tre volte più in fretta">×3</button>
          <button class="dd-scuoti" type="button">scuoti</button>
        </div>
        <div class="dd-sotto"><ol class="dd-storia" aria-label="gli ultimi colpi"></ol><p class="dd-nota">sic bo · soldi finti: niente premi, niente pagamenti.</p></div>
      </div>
      <div class="dd-tavolo"><div class="dd-campo"><svg aria-label="il tavolo delle puntate" role="group"></svg><div class="dd-fiches"></div></div></div>
    </div>`
  document.body.appendChild(dlg)
  const q = (s) => dlg.querySelector(s)
  el = {
    voce: q('.dd-voce'), chiudi: q('.dd-chiudi'), regole: q('.dd-regole select'), campana: q('.dd-campana'), canvas: q('canvas'), carica: q('.dd-carica'),
    annuncio: q('.dd-annuncio'), saldo: q('.dd-saldo b'), puntato: q('.dd-saldo .puntato'), scegli: q('.dd-scegli'), togli: q('.dd-togli'),
    rifai: q('.dd-rifai'), veloce: q('.dd-veloce'), scuoti: q('.dd-scuoti'), storia: q('.dd-storia'), campo: q('.dd-campo'), svg: q('.dd-campo svg'), fiches: q('.dd-fiches'),
  }
  // chi mi segue su instagram riceve 1.000 $pzk (una volta, ../pzk.js)
  q('.dd-saldo').appendChild(pzk.linkInstagram({ fatto: () => { voce(`grazie del follow: +${fmt(pzk.PREMIO_IG)} $pzk`); contaSaldo(pzk.saldo() - pzk.PREMIO_IG, pzk.saldo()) } }))
  for (const v of pzk.FICHES) {
    const b = document.createElement('button')
    b.type = 'button'
    b.dataset.v = v
    b.setAttribute('aria-label', `fiche da ${v}`)
    b.innerHTML = `<img src="${ART}fiches/f${v}.webp" alt="" width="170" height="174">`
    b.addEventListener('click', () => { stato.fiche = v; aggiornaBanco() })
    el.scegli.appendChild(b)
  }
  el.regole.value = stato.regole
  el.regole.addEventListener('change', () => cambiaRegole(el.regole.value))
  el.chiudi.addEventListener('click', chiudi)
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); chiudi() })
  dlg.addEventListener('click', (e) => { if (e.target === dlg) chiudi() }) // clic sul fondo scuro
  el.scuoti.addEventListener('click', scuoti)
  el.togli.addEventListener('click', togli)
  el.rifai.addEventListener('click', rifai)
  el.veloce.addEventListener('click', () => { stato.veloce = !stato.veloce; el.veloce.setAttribute('aria-pressed', String(stato.veloce)) })
  new ResizeObserver(() => { if (dlg.open) { disegnaTavolo(); ridisegnaPile() } }).observe(el.campo)
  new ResizeObserver(() => { ridimensiona?.(); sporco = true; avvia() }).observe(el.campana)
  pzk.ascolta(() => { if (!contando) aggiornaBanco() }) // il saldo cambia anche giocando agli altri giochi
  voce(pzk.aSecco() ? 'hai finito i $pzk' : 'scegli una fiche e punta')
  aggiornaBanco()
  aggiornaStoria()
}

function chiudi() {
  if (!dlg?.open || dlg.classList.contains('chiude')) return
  const fine = () => { dlg.close(); dlg.classList.remove('chiude'); ferma(); if (location.hash === '#dado') history.replaceState(null, '', location.pathname + location.search) }
  if (RIDOTTO.matches) return fine()
  dlg.classList.add('chiude')
  setTimeout(fine, 220)
}

function voce(t) { if (el.voce) el.voce.textContent = t }

function aggiornaBanco() {
  if (!el.saldo) return
  if (!contando) el.saldo.textContent = `$pzk ${fmt(pzk.saldo())}`
  const p = puntato()
  el.puntato.textContent = p ? `sul tavolo: ${fmt(p)}` : ''
  const punta = stato.fase === 'punta'
  for (const b of el.scegli.children) {
    b.setAttribute('aria-pressed', String(Number(b.dataset.v) === stato.fiche))
    b.disabled = !punta
  }
  el.togli.disabled = !punta || !stato.mosse.length
  el.rifai.disabled = !punta || !stato.ultime || stato.giocate.size > 0
  el.regole.disabled = !punta
  el.scuoti.disabled = !punta || !campana
  if (punta && pzk.aSecco() && !stato.giocate.size) { el.scuoti.textContent = 'ricarica'; el.scuoti.disabled = false }
  else el.scuoti.textContent = 'scuoti'
  dlg.classList.toggle('chiuso', !punta)
}

// la faccia di un dado disegnata col pennino: il quadrato tondo e i punti (per il tavolo e per gli ultimi colpi)
function icona(g, n, cx, cy, s, tratto = 1) {
  g.appendChild(svgEl('rect', { x: cx - s / 2, y: cy - s / 2, width: s, height: s, rx: s * 0.2, fill: 'none', stroke: INK, 'stroke-width': Math.max(0.8, s * 0.075) * tratto }))
  for (const [u, v] of PUNTI[n]) g.appendChild(svgEl('circle', { cx: cx - s / 2 + u * s, cy: cy - s / 2 + v * s, r: s * (n === 1 ? 0.15 : 0.085), fill: rossi(n) ? ROSSO : INK }))
}
function miniDadi(dadi) {
  const s = svgEl('svg', { viewBox: '0 0 46 14', class: 'dd-mini', 'aria-hidden': 'true' })
  const g = svgEl('g')
  dadi.forEach((n, i) => {
    g.appendChild(svgEl('rect', { x: 0.6 + i * 16, y: 0.6, width: 12.8, height: 12.8, rx: 2.6, fill: '#fbf8f1', stroke: INK, 'stroke-width': 1.1 }))
    for (const [u, v] of PUNTI[n]) g.appendChild(svgEl('circle', { cx: 0.6 + i * 16 + u * 12.8, cy: 0.6 + v * 12.8, r: n === 1 ? 2 : 1.15, fill: rossi(n) ? ROSSO : INK }))
  })
  s.appendChild(g)
  return s
}
const ordinati = (d) => [...d].sort((a, b) => a - b)
const nomeColpo = (d) => { const l = leggi(d); return l.tripla ? `tripla di ${d[0]}` : `${l.tot} ${l.nome}` }

function aggiornaStoria() {
  el.storia.replaceChildren(...stato.storia.slice(0, 10).map((d) => {
    const li = document.createElement('li')
    const l = leggi(d)
    li.className = l.tripla ? 'tripla' : l.nome
    li.setAttribute('aria-label', `${ordinati(d).join(' ')}: ${nomeColpo(d)}`)
    li.title = nomeColpo(d)
    const b = document.createElement('b')
    b.textContent = l.tripla ? '×3' : l.tot
    li.append(miniDadi(ordinati(d)), b)
    return li
  }))
}

// ── il tavolo (SVG, stampato sul foglio) ────────────────────────────────────
// Come i tavoli di Macao, in orizzontale: in alto piccolo e grande ai lati (e pari
// e dispari, dove ci sono), le coppie, le triple e la qualsiasi tripla in mezzo;
// sotto i quattordici totali, le quindici combinazioni e i numeri singoli. Sul
// telefono lo stesso tavolo va a capo: righe più corte, una sotto l'altra.
let G = null // la geometria del tavolo in px del campo
function geometria() {
  const w = el.campo.clientWidth, h = el.campo.clientHeight, g = 3
  const stretto = w < 560
  const box = new Map()
  // una riga di caselle larghe in proporzione ai pesi, da x0 a x1
  const riga = (y, hh, ids, pesi = ids.map(() => 1), x0 = 0, x1 = w) => {
    const tot = pesi.reduce((a, b) => a + b, 0), libero = x1 - x0 - g * (ids.length - 1)
    let x = x0
    ids.forEach((id, i) => { const ww = (libero * pesi[i]) / tot; if (id) box.set(id, { x, y, w: ww, h: hh }); x += ww + g })
  }
  const da = (pre, a, b) => Array.from({ length: b - a + 1 }, (_, i) => `${pre}:${a + i}`)
  const combo = PUNTATE.macao.filter((p) => p.tipo === 'combinazione').map((p) => p.id)
  if (!stretto) {
    const u = (h - 3 * g) / 5.4
    const hA = 2.1 * u, hB = u, hC = 1.35 * u, hD = 0.95 * u
    const colonne = R().pariDispari
      ? [['pari', 0.75], ['piccolo', 1.45], ['C1', 1], ['T1', 1], ['triple', 1.35], ['T2', 1], ['C2', 1], ['grande', 1.45], ['dispari', 0.75]]
      : [['piccolo', 1.85], ['C1', 1], ['T1', 1], ['triple', 1.5], ['T2', 1], ['C2', 1], ['grande', 1.85]]
    riga(0, hA, colonne.map((c) => c[0]), colonne.map((c) => c[1]))
    // coppie e triple: tre caselle una sopra l'altra
    const pile = { C1: da('coppia', 1, 3), T1: da('tripla', 1, 3), T2: da('tripla', 4, 6), C2: da('coppia', 4, 6) }
    for (const [k, ids] of Object.entries(pile)) {
      const b = box.get(k)
      box.delete(k)
      const hh = (hA - 2 * g) / 3
      ids.forEach((id, i) => box.set(id, { x: b.x, y: i * (hh + g), w: b.w, h: hh }))
    }
    let y = hA + g
    riga(y, hB, da('totale', 4, 17)); y += hB + g
    riga(y, hC, combo); y += hC + g
    riga(y, hD, da('singolo', 1, 6))
  } else {
    const u = (h - 9 * g) / 10.45
    let y = 0
    const fila = (hh, ids, pesi) => { riga(y, hh, ids, pesi); y += hh + g }
    if (R().pariDispari) fila(1.25 * u, ['piccolo', 'pari', 'dispari', 'grande'], [1.4, 1, 1, 1.4])
    else fila(1.25 * u, ['piccolo', 'grande'])
    fila(0.95 * u, da('coppia', 1, 6))
    fila(0.95 * u, da('tripla', 1, 6))
    fila(0.7 * u, ['triple'])
    fila(u, da('totale', 4, 10))
    fila(u, da('totale', 11, 17))
    for (let k = 0; k < 3; k++) fila(1.2 * u, combo.slice(k * 5, k * 5 + 5))
    fila(u, da('singolo', 1, 6))
  }
  const minimo = Math.min(...[...box.values()].map((b) => Math.min(b.w, b.h)))
  return { w, h, g, stretto, box, fiche: Math.round(Math.max(20, Math.min(28, minimo * 0.74))) }
}
// dove si posa la pila: nelle caselle grandi un po' sotto, per lasciare leggere la scritta
function punto(id) {
  const b = G.box.get(id)
  return { x: b.x + b.w / 2, y: b.h > 64 ? b.y + b.h * 0.74 : b.y + b.h / 2 }
}

function disegnaTavolo() {
  if (!el.campo?.clientWidth) return
  G = geometria()
  const { w, h, box, stretto } = G
  const svg = el.svg
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`)
  svg.innerHTML = ''
  // l'inchiostro: un po' di grana e un bordo appena irregolare, come la stampa del muro
  const defs = svgEl('defs')
  defs.innerHTML = `<filter id="dd-ink" x="-2%" y="-2%" width="104%" height="104%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="5" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.5" result="d"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -.55 1.22" result="g"/><feComposite in="d" in2="g" operator="in"/></filter>`
  svg.appendChild(defs)
  const stampa = svgEl('g', { filter: 'url(#dd-ink)' })
  svg.appendChild(stampa)
  const testo = (t, x, y, size, a = {}) => { const e = svgEl('text', { x, y, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: INK, 'font-size': size.toFixed(1), ...a }); e.textContent = t; stampa.appendChild(e); return e }
  // righe di testo una sotto l'altra, centrate nella casella e rimpicciolite finché ci stanno (em: larghezza media di un carattere)
  const righe = (b, linee, { su = 0.5, alto = 0.86 } = {}) => {
    const tot = linee.reduce((a, l) => a + l.s * 1.12, 0)
    const k = Math.min(1, (b.h * alto) / tot, ...linee.map((l) => (b.w * 0.88) / (l.t.length * l.s * (l.em ?? 0.5))))
    let y = b.y + b.h * su - (tot * k) / 2
    for (const l of linee) { const s = l.s * k; testo(l.t, b.x + b.w / 2, y + s * 0.56, s, { class: l.cl ?? 'dd-grande', fill: l.f ?? INK }); y += s * 1.12 }
  }
  const pagaTesto = (n) => `${fmt(n)} a 1`
  for (const p of PUNTATE[stato.regole]) {
    const b = box.get(p.id)
    if (!b) continue
    stampa.appendChild(svgEl('rect', { x: b.x, y: b.y, width: b.w, height: b.h, rx: 3, fill: 'none', stroke: INK, 'stroke-width': 1.5 }))
    const cx = b.x + b.w / 2
    switch (p.tipo) {
      case 'piccolo': case 'grande': case 'pari': case 'dispari': {
        const cinese = { piccolo: '小', grande: '大', pari: '雙', dispari: '單' }[p.tipo]
        const sotto = p.tipo === 'piccolo' ? 'da 4 a 10' : p.tipo === 'grande' ? 'da 11 a 17' : ''
        if (!stretto) righe(b, [{ t: cinese, s: 34, f: ROSSO, cl: 'dd-cinese', em: 1 }, { t: p.tipo, s: 21 }, ...(sotto ? [{ t: sotto, s: 12, cl: 'dd-piccola', em: 0.6 }] : []), { t: '1 a 1', s: 12, cl: 'dd-piccola', em: 0.6, f: ROSSO }, { t: 'perde con le triple', s: 9, cl: 'dd-piccola', em: 0.6 }], { su: p.tipo.length > 6 ? 0.42 : 0.4, alto: 0.62 })
        else righe(b, [{ t: `${cinese} ${p.tipo}`, s: 17, em: 0.62 }, { t: sotto || '1 a 1', s: 10, cl: 'dd-piccola', em: 0.6, f: sotto ? INK : ROSSO }], { su: 0.36, alto: 0.6 })
        break
      }
      case 'coppia': case 'tripla': {
        const k = p.tipo === 'coppia' ? 2 : 3
        const s = Math.min(b.h * 0.44, (b.w * 0.82) / (k + (k - 1) * 0.2), 18)
        for (let i = 0; i < k; i++) icona(stampa, p.n, cx + (i - (k - 1) / 2) * s * 1.2, b.y + b.h * 0.4, s)
        testo(pagaTesto(p.paga), cx, b.y + b.h * 0.82, Math.min(b.h * 0.24, 11), { class: 'dd-piccola', fill: p.tipo === 'tripla' ? ROSSO : INK })
        break
      }
      case 'triple': {
        if (stretto) { righe(b, [{ t: `qualsiasi tripla · ${pagaTesto(p.paga)}`, s: 15, em: 0.48 }]); break }
        righe({ ...b, h: b.h * 0.34 }, [{ t: 'qualsiasi', s: 15 }, { t: 'tripla', s: 15 }], { su: 0.6, alto: 0.9 })
        // le sei triple, in due colonne
        const s = Math.min(b.h * 0.09, b.w * 0.1)
        for (let n = 1; n <= 6; n++) {
          const col = (n - 1) % 2, rig = Math.floor((n - 1) / 2)
          const x0 = cx + (col - 0.5) * s * 4.1, y0 = b.y + b.h * 0.43 + rig * s * 1.35
          for (let i = 0; i < 3; i++) icona(stampa, n, x0 + (i - 1) * s * 1.18, y0, s, 0.8)
        }
        testo(pagaTesto(p.paga), cx, b.y + b.h * 0.9, Math.min(b.h * 0.1, 12), { class: 'dd-piccola', fill: ROSSO })
        break
      }
      case 'totale': righe(b, [{ t: String(p.n), s: Math.min(b.h * 0.5, 26) }, { t: pagaTesto(p.paga), s: Math.min(b.h * 0.2, 10.5), cl: 'dd-piccola', em: 0.6, f: p.paga >= 14 ? ROSSO : INK }], { alto: 0.84 }); break
      case 'combinazione': {
        const verticale = b.h > b.w * 1.1
        const s = verticale ? Math.min(b.w * 0.42, b.h * 0.27, 19) : Math.min(b.h * 0.42, b.w * 0.3, 19)
        const yc = b.y + b.h * (verticale ? 0.4 : 0.4)
        if (verticale) { icona(stampa, p.a, cx, yc - s * 0.6, s); icona(stampa, p.b, cx, yc + s * 0.6, s) }
        else { icona(stampa, p.a, cx - s * 0.6, yc, s); icona(stampa, p.b, cx + s * 0.6, yc, s) }
        testo(pagaTesto(p.paga), cx, b.y + b.h * (verticale ? 0.88 : 0.84), Math.min(b.h * 0.17, b.w * 0.2, 10), { class: 'dd-piccola' })
        break
      }
      case 'singolo': {
        const s = Math.min(b.h * 0.52, b.w * 0.36, 30)
        if (b.w > b.h * 2.6) {
          icona(stampa, p.n, b.x + b.w * 0.3, b.y + b.h / 2, s)
          testo('1, 2, 3 a 1', b.x + b.w * 0.66, b.y + b.h / 2, Math.min(b.h * 0.24, 11), { class: 'dd-piccola' })
        } else {
          icona(stampa, p.n, cx, b.y + b.h * 0.42, s)
          testo('1·2·3 a 1', cx, b.y + b.h * 0.86, Math.min(b.h * 0.18, b.w * 0.16, 10), { class: 'dd-piccola' })
        }
        break
      }
    }
  }
  // l'evidenziatore: la puntata sotto il puntatore, e le caselle che vincono col colpo appena uscito
  G.vinte = svgEl('g', { class: 'dd-evid', 'aria-hidden': 'true' })
  svg.appendChild(G.vinte)
  G.evid = svgEl('g', { class: 'dd-evid', 'aria-hidden': 'true' })
  svg.appendChild(G.evid)
  // le zone, una per casella
  const zone = svgEl('g')
  for (const p of PUNTATE[stato.regole]) {
    const b = box.get(p.id)
    if (!b) continue
    const z = svgEl('rect', { x: b.x, y: b.y, width: b.w, height: b.h, rx: 3, class: 'dd-zona', tabindex: 0, role: 'button', 'aria-label': `${p.nome}: ${spiegaPaga(p)}` })
    z.dataset.id = p.id
    zone.appendChild(z)
  }
  svg.appendChild(zone)
  zone.addEventListener('pointerover', (e) => { const id = e.target.dataset?.id; if (id) evidenzia(id) })
  zone.addEventListener('pointerout', () => evidenzia(null))
  zone.addEventListener('focusin', (e) => { const id = e.target.dataset?.id; if (id) evidenzia(id) })
  zone.addEventListener('focusout', () => evidenzia(null))
  zone.addEventListener('click', (e) => { const id = e.target.dataset?.id; if (id) posa(id) })
  // col dito non c'è «il puntatore se ne va»: l'evidenziatore si spegne da solo
  zone.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') setTimeout(() => evidenzia(null), 900) })
  zone.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.dataset?.id) { e.preventDefault(); posa(e.target.dataset.id) } })
  if (stato.usciti) segnaVinte(stato.usciti)
}

function spiegaPaga(p) {
  const R0 = R()
  switch (p.tipo) {
    case 'piccolo': case 'grande': case 'pari': case 'dispari': return 'paga 1 a 1, perde con le triple'
    case 'coppia': return `almeno due ${p.n}, paga ${p.paga} a 1`
    case 'combinazione': return `un ${p.a} e un ${p.b}, paga ${p.paga} a 1`
    case 'singolo': return `paga ${R0.singolo[0]} a 1 se esce su un dado, ${R0.singolo[1]} a 1 su due, ${R0.singolo[2]} a 1 su tre`
    default: return `paga ${fmt(p.paga)} a 1`
  }
}

function evidenzia(id) {
  if (!G) return
  G.evid.replaceChildren()
  if (!id) { if (stato.fase === 'punta') voce(stato.giocate.size ? 'puoi ancora puntare, poi scuoti' : 'scegli una fiche e punta'); return }
  const b = G.box.get(id)
  if (b) G.evid.appendChild(svgEl('rect', { x: b.x + 1, y: b.y + 1, width: b.w - 2, height: b.h - 2, rx: 3 }))
  if (stato.fase === 'punta') {
    const p = PER_ID[stato.regole].get(id), g = stato.giocate.get(id)
    voce(`${p.nome}: ${spiegaPaga(p)}${g ? ` · ci sono ${fmt(g)}` : ''}`)
  }
}
// dopo il colpo il tavolo si illumina dove vince, come quelli di Macao
function segnaVinte(dadi) {
  if (!G) return
  G.vinte.replaceChildren()
  for (const p of PUNTATE[stato.regole]) {
    if (!rende(p, dadi, R())) continue
    const b = G.box.get(p.id)
    if (b) G.vinte.appendChild(svgEl('rect', { x: b.x + 1, y: b.y + 1, width: b.w - 2, height: b.h - 2, rx: 3 }))
  }
}
function togliVinte() { stato.usciti = null; G?.vinte.replaceChildren() }

function cambiaRegole(id) {
  if (stato.fase !== 'punta' || !REGOLE[id]) { el.regole.value = stato.regole; return }
  stato.regole = id
  // pari e dispari ci sono solo a macao: le fiches tornano nel saldo
  for (const [k, v] of [...stato.giocate]) {
    if (PER_ID[id].has(k)) continue
    pzk.ritira(GIOCO, v)
    stato.giocate.delete(k)
    const p = pile.get(k)
    if (p) { const dove = centro(el.saldo); [...p.el.children].forEach((img, j) => { const da = centro(img); vola(p.fiches[j], da, dove, { durata: 420, alto: 24, dopo: j * 30, svanisce: true, scala: 0.8 }) }); p.el.remove(); pile.delete(k) }
  }
  stato.mosse = stato.mosse.filter((m) => stato.giocate.has(m.id))
  salva()
  disegnaTavolo()
  ridisegnaPile()
  aggiornaBanco()
  const t = R()
  voce(`regole di ${t.nome}: totale 4 e 17 a ${t.totali[4]}, coppia a ${t.coppia}, tripla a ${t.tripla}${t.pariDispari ? ', con pari e dispari' : ''}`)
}

// ── le fiches sul tavolo ─────────────────────────────────────────────────────
const pile = new Map() // id → { el, fiches: [valori] }
const ALTO = 2.4 // px fra una fiche e quella sopra
function pila(id) {
  let p = pile.get(id)
  if (!p) {
    const e = document.createElement('div')
    e.className = 'dd-pila'
    el.fiches.appendChild(e)
    p = { el: e, fiches: [] }
    pile.set(id, p)
  }
  mettiPila(id, p)
  return p
}
function mettiPila(id, p) {
  const c = punto(id)
  p.el.style.transform = `translate(${c.x}px, ${c.y}px)`
  p.el.style.setProperty('--f', `${G.fiche}px`)
}
function immagineFiche(v, i) {
  const img = document.createElement('img')
  img.className = 'dd-fiche'
  img.src = `${ART}fiches/f${v}.webp`
  img.alt = ''
  // un po' storte, come le posa una mano
  const k = Math.min(i, 9), r = ((v * 37 + i * 101) % 23) - 11
  img.style.transform = `translate(${((i * 7) % 3) - 1}px, ${-k * ALTO}px) rotate(${r}deg)`
  img.style.zIndex = String(i)
  return img
}
function ridisegnaPile() {
  if (!G) return
  for (const [id, p] of pile) { if (!G.box.has(id)) continue; mettiPila(id, p); p.el.replaceChildren(...p.fiches.map((v, i) => immagineFiche(v, i))) }
}
// il centro di un elemento, in coordinate della finestra
const centro = (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } }
const nelCampo = (c) => { const r = el.campo.getBoundingClientRect(); return { x: r.left + c.x, y: r.top + c.y } }
const bancoFiches = () => nelCampo({ x: G.w / 2, y: -14 })

/** Una fiche che vola da a a b (coordinate della finestra), con l'arco, l'ombra e un rimbalzo. */
function vola(v, a, b, { durata = 380, alto = 40, ruota = 0, dopo = 0, svanisce = false, scala = 1 } = {}) {
  if (RIDOTTO.matches) return Promise.resolve()
  if (stato.veloce) { durata /= 2; dopo /= 2 }
  const img = document.createElement('img')
  img.className = 'dd-volo'
  img.src = `${ART}fiches/f${v}.webp`
  img.alt = ''
  img.style.setProperty('--f', `${G?.fiche ?? 28}px`)
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

async function posa(id) {
  if (stato.fase !== 'punta') { voce(stato.fase === 'scuote' ? 'la campana si scuote: niente più puntate' : 'un attimo: il banco paga'); return }
  const v = stato.fiche
  if (!pzk.punta(GIOCO, v)) { voce(pzk.saldo() >= 1 ? `non ti bastano: hai ${fmt(pzk.saldo())} $pzk` : 'hai finito i $pzk'); scuotiSaldo(); return }
  togliVinte()
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
  const da = centro(el.scegli.querySelector(`[data-v="${v}"] img`))
  const c = punto(id)
  await vola(v, da, nelCampo({ x: c.x, y: c.y - Math.min(i, 9) * ALTO }), { ruota: ((v * 37 + i * 101) % 23) - 11, alto: 30 + Math.random() * 30 })
  img.style.visibility = ''
  colpetto(p)
}

function togli() {
  if (stato.fase !== 'punta' || !stato.mosse.length) return
  const { id, v } = stato.mosse.pop()
  const p = pile.get(id)
  const img = p?.el.lastElementChild
  const da = img ? centro(img) : null
  p?.fiches.pop()
  img?.remove()
  if (p && !p.fiches.length) { p.el.remove(); pile.delete(id) }
  const resto = stato.giocate.get(id) - v
  if (resto > 0) stato.giocate.set(id, resto); else stato.giocate.delete(id)
  pzk.ritira(GIOCO, v)
  aggiornaBanco()
  if (da) vola(v, da, centro(el.scegli.querySelector(`[data-v="${v}"] img`)), { durata: 300, alto: 24 })
}

async function rifai() {
  if (stato.fase !== 'punta' || !stato.ultime || stato.giocate.size) return
  const ultime = [...stato.ultime].filter(([id]) => PER_ID[stato.regole].has(id))
  const tot = ultime.reduce((a, [, v]) => a + v, 0)
  if (tot > pzk.saldo()) { voce(`per rifare servono ${fmt(tot)} $pzk`); scuotiSaldo(); return }
  const prima = stato.fiche
  for (const [id, imp] of ultime) for (const v of pzk.inFiches(imp)) { stato.fiche = v; posa(id); await attendi(70) }
  stato.fiche = prima
  aggiornaBanco()
}

function scuotiSaldo() {
  if (RIDOTTO.matches) return
  el.saldo.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(0)' }], { duration: 300 })
}

// ── il colpo ─────────────────────────────────────────────────────────────────
function scuoti() {
  if (stato.fase !== 'punta') return
  if (pzk.aSecco() && !stato.giocate.size) {
    pzk.ricarica()
    aggiornaBanco()
    voce(`altri ${fmt(pzk.INIZIALE)} $pzk finti: punta`)
    return
  }
  if (!campana) return
  togliVinte()
  stato.fase = 'scuote'
  stato.giro = new Map(stato.giocate)
  aggiornaBanco()
  G?.evid.replaceChildren()
  voce(stato.giocate.size ? 'la campana si scuote: niente più puntate' : 'colpo senza puntate: guarda e basta')
  el.annuncio.classList.remove('si')
  campana.scuoti()
  avvia()
}

// un dado è rimasto storto (appoggiato al vetro o a un altro dado): il colpo non vale e la campana si riscuote
function nonVale() {
  voce(campana.ultimo === 'lento' ? 'i dadi non si fermano: si riscuote' : 'un dado è rimasto storto: si riscuote')
  setTimeout(() => { if (campana.stato === 'nonvale') { campana.scuoti(); avvia() } }, RIDOTTO.matches ? 300 : 900)
}

// i dadi si sono fermati: le facce, il tavolo che si illumina, le fiches perse e quelle vinte
async function fermata(dadi) {
  stato.fase = 'paga'
  stato.usciti = dadi
  stato.storia.unshift(dadi)
  stato.storia = stato.storia.slice(0, 12)
  salva()
  aggiornaStoria()
  const l = leggi(dadi), nome = nomeColpo(dadi)
  el.annuncio.textContent = `${ordinati(dadi).join(' ')} · ${nome}`
  el.annuncio.className = `dd-annuncio ${l.tripla ? 'tripla' : ''}`
  void el.annuncio.offsetWidth
  el.annuncio.classList.add('si')
  segnaVinte(dadi)
  const giocate = stato.giro ?? new Map()
  const conto = esito(giocate, dadi, R())
  voce(giocate.size ? (conto.netto > 0 ? `${nome}: vinci ${fmt(conto.netto)} $pzk` : conto.torna ? `${nome}: ti tornano ${fmt(conto.torna)} $pzk` : `${nome}: il banco si prende tutto`) : nome)
  await attendi(700)

  // le perse: le fiches scivolano via verso il banco (in cima al tavolo), una pila alla volta
  const banco = bancoFiches()
  const voli = []
  conto.perse.forEach((id, k) => {
    const p = pile.get(id)
    if (!p) return
    const imgs = [...p.el.children]
    imgs.forEach((img, j) => {
      const da = centro(img)
      img.style.visibility = 'hidden'
      voli.push(vola(p.fiches[j], da, { x: banco.x + (j - imgs.length / 2) * 3, y: banco.y }, { durata: 520, alto: 14, dopo: k * 70 + j * 28, svanisce: true, scala: 0.7, ruota: 40 }))
    })
  })
  await Promise.all(voli)
  for (const id of conto.perse) { pile.get(id)?.el.remove(); pile.delete(id) }

  // le vinte: dal banco arriva la vincita accanto alla pila, poi tutto torna al giocatore
  if (conto.vinte.length) {
    const arrivi = []
    conto.vinte.forEach(({ id, torna }, k) => {
      const p = pile.get(id)
      if (!p) return
      const vincita = pzk.inFiches(torna - giocate.get(id)).slice(0, 14)
      const c = punto(id), f = G.fiche
      const accanto = document.createElement('div')
      accanto.className = 'dd-pila'
      accanto.style.setProperty('--f', `${f}px`)
      accanto.style.transform = `translate(${c.x + f * 0.55}px, ${c.y + 3}px)`
      el.fiches.appendChild(accanto)
      p.vincita = { el: accanto, fiches: vincita }
      vincita.forEach((v, j) => {
        const img = immagineFiche(v, j)
        img.style.visibility = 'hidden'
        accanto.appendChild(img)
        arrivi.push(vola(v, banco, nelCampo({ x: c.x + f * 0.55, y: c.y + 3 - Math.min(j, 9) * ALTO }), { durata: 460, alto: 26, dopo: k * 90 + j * 45 }).then(() => { img.style.visibility = '' }))
      })
    })
    await Promise.all(arrivi)
    await attendi(650)
    // tutto al giocatore: verso il saldo
    const dove = centro(el.saldo)
    const ritorni = []
    conto.vinte.forEach(({ id }, k) => {
      const p = pile.get(id)
      if (!p) return
      for (const grp of [p, p.vincita]) {
        ;[...grp.el.children].forEach((img, j) => {
          const da = centro(img)
          img.style.visibility = 'hidden'
          ritorni.push(vola(grp.fiches[j] ?? 1, da, dove, { durata: 480, alto: 34, dopo: k * 60 + j * 22, svanisce: true, scala: 0.8 }))
        })
      }
    })
    contaSaldo(pzk.saldo(), pzk.saldo() + conto.torna)
    await Promise.all(ritorni)
  }
  pzk.regola(GIOCO, conto.puntato, conto.torna)
  if (giocate.size) stato.ultime = giocate
  stato.giocate = new Map()
  stato.mosse = []
  stato.giro = null
  pile.clear()
  el.fiches.querySelectorAll('.dd-pila').forEach((e) => e.remove())
  stato.fase = 'punta'
  aggiornaBanco()
  if (pzk.aSecco()) voce(`${nome}. hai finito i $pzk: ricarica`)
}

let contando = false
function contaSaldo(da, a) {
  const durata = RIDOTTO.matches ? 0 : 900
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

// ── la campana 3D e la fisica ────────────────────────────────────────────────
// La base di mogano laccato sta ferma; il piatto (nero, col panno verde e il collare d'ottone), il vetro e
// il pomolo sono il corpo che la fisica scuote, e si muovono con lui. I dadi sono avorio, lucidi, gli spigoli
// tondi, i punti incavati.
let THREE, C, campana = null, renderer, scena, camera, macchina, dadi3 = [], raf = 0, ultimo = 0, accumulo = 0, ridimensiona = null, sporco = true

async function avviaMotore() {
  const [three, rap, cm] = await Promise.all([import(QUI + '../roulette/lib/three.js'), import(QUI + '../roulette/lib/rapier.mjs'), import(QUI + 'campana.js')])
  THREE = three
  C = cm
  const RAPIER = rap.default
  await RAPIER.init()
  campana = new C.Campana(RAPIER)
  // i dadi mostrano l'ultimo colpo (se c'è), fermi sul panno
  if (stato.storia[0]) campana.metti(stato.storia[0])
  costruisciScena()
  el.carica.remove()
  aggiornaBanco()
  sporco = true
  avvia()
}

function avvia() {
  if (!renderer || raf || !dlg.open) return
  ultimo = performance.now()
  raf = requestAnimationFrame(ciclo)
}
function ferma() { cancelAnimationFrame(raf); raf = 0 }

function ciclo(t) {
  raf = requestAnimationFrame(ciclo)
  const dt = Math.min(0.1, (t - ultimo) / 1000)
  ultimo = t
  if (document.hidden) return
  const vivo = campana.stato === 'scuote' || campana.stato === 'posa'
  if (vivo) {
    const passo = C.FISICA.dt
    accumulo += dt * (stato.veloce ? 3 : 1)
    let n = 0
    while (accumulo >= passo && n < 96) {
      accumulo -= passo
      n++
      const e = campana.passo()
      if (e === 'nonvale') { nonVale(); break }
      if (e) { if (stato.fase === 'scuote') fermata(e); break }
    }
    if (n === 96) accumulo = 0
    sporco = true
  } else accumulo = 0
  if (sporco) { metti(); renderer.render(scena, camera); sporco = false }
  else ferma() // i dadi sono fermi: niente da ridisegnare finché qualcosa non cambia
}

// la scena segue la fisica
const v3 = (p) => [p.x, p.y, p.z]
function metti() {
  const { piatto, dadi } = campana.pose()
  macchina.position.set(...v3(piatto.p))
  macchina.quaternion.set(piatto.q.x, piatto.q.y, piatto.q.z, piatto.q.w)
  dadi.forEach((d, i) => { dadi3[i].position.set(...v3(d.p)); dadi3[i].quaternion.set(d.q.x, d.q.y, d.q.z, d.q.w) })
}

function costruisciScena() {
  const { LATO, SMUSSO, R_CAMPANA, PROFILO, PARETE, CIMA } = C
  renderer = new THREE.WebGLRenderer({ canvas: el.canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.NeutralToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  scena = new THREE.Scene()
  const pm = new THREE.PMREMGenerator(renderer)
  scena.environment = pm.fromScene(new THREE.RoomEnvironment(), 0.04).texture
  pm.dispose()
  scena.environmentIntensity = 0.9
  camera = new THREE.PerspectiveCamera(30, 1, 0.02, 3)

  // i punti che devono stare dentro l'inquadratura: il bordo della base, in alto e in basso, e il pomolo
  const bordo = []
  for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; bordo.push(new THREE.Vector3(0.094 * Math.cos(a), -0.012, 0.094 * Math.sin(a)), new THREE.Vector3(0.094 * Math.cos(a), -0.034, 0.094 * Math.sin(a))) }
  bordo.push(new THREE.Vector3(0, CIMA + 0.016, 0))
  ridimensiona = () => {
    const w = el.campana.clientWidth, h = el.campana.clientHeight
    if (!w || !h) return
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    // la campana guardata da davanti e dall'alto (56°): la distanza più corta a cui ci sta tutta
    const el0 = (56 * Math.PI) / 180, mira = new THREE.Vector3(0, 0.012, 0.006)
    const prova = (d) => {
      camera.position.set(0, mira.y + Math.sin(el0) * d, mira.z + Math.cos(el0) * d)
      camera.lookAt(mira)
      camera.updateProjectionMatrix()
      camera.updateMatrixWorld()
      return bordo.every((p) => { const q = p.clone().project(camera); return Math.abs(q.x) < 0.95 && Math.abs(q.y) < 0.93 })
    }
    let a = 0.1, b = 1.5
    for (let i = 0; i < 24; i++) { const m = (a + b) / 2; if (prova(m)) b = m; else a = m }
    prova(b)
    sporco = true
  }
  ridimensiona()

  // le luci: una lampada sopra il tavolo (con le ombre) e il cielo della stanza
  const sole = new THREE.DirectionalLight(0xfff4e6, 2.3)
  sole.position.set(-0.25, 0.9, 0.35)
  sole.castShadow = true
  sole.shadow.mapSize.set(1024, 1024)
  Object.assign(sole.shadow.camera, { left: -0.14, right: 0.14, top: 0.14, bottom: -0.14, near: 0.4, far: 1.6 })
  sole.shadow.bias = -0.0005
  sole.shadow.normalBias = 0.004
  sole.shadow.radius = 3
  scena.add(sole)
  scena.add(new THREE.HemisphereLight(0xfff8ee, 0x2a2018, 0.5))

  // i materiali
  const legnoMap = new THREE.TextureLoader().load(ART + 'roulette/legno.webp', () => { sporco = true; avvia() })
  legnoMap.colorSpace = THREE.SRGBColorSpace
  legnoMap.wrapS = legnoMap.wrapT = THREE.MirroredRepeatWrapping
  legnoMap.anisotropy = 8
  const legno = new THREE.MeshPhysicalMaterial({ map: legnoMap, roughness: 0.38, clearcoat: 1, clearcoatRoughness: 0.12, side: THREE.DoubleSide })
  const ebano = new THREE.MeshPhysicalMaterial({ color: 0x17120f, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.08, side: THREE.DoubleSide })
  const ottone = new THREE.MeshStandardMaterial({ color: 0xd8b56a, metalness: 1, roughness: 0.22, side: THREE.DoubleSide })
  const panno = new THREE.MeshStandardMaterial({ map: texPanno(), roughness: 0.95 })
  const vetroMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.04, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: 1.6 })
  const giro = (prof, mat, seg = 96) => new THREE.Mesh(new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), seg), mat)

  // la base, ferma: un cilindro basso di mogano laccato col pozzetto in cui sta il piatto
  const base = giro([[0.077, -0.04], [0.077, -0.006], [0.079, -0.004], [0.084, -0.004], [0.090, -0.007], [0.094, -0.013], [0.094, -0.030], [0.091, -0.034], [0.0, -0.034]], legno)
  base.castShadow = true; base.receiveShadow = true
  scena.add(base)

  // quello che si scuote
  macchina = new THREE.Group()
  scena.add(macchina)
  const piatto = giro([[0.0, -0.004], [0.073, -0.004], [0.0735, -0.006], [0.0735, -0.045]], ebano, 64)
  piatto.receiveShadow = true
  macchina.add(piatto)
  const fondo = new THREE.Mesh(new THREE.CircleGeometry(R_CAMPANA + 0.001, 72), panno)
  fondo.rotation.x = -Math.PI / 2
  fondo.position.y = 0.00005
  fondo.receiveShadow = true
  macchina.add(fondo)
  // il panno scende fino al piatto (il vetro poggia nel collare)
  const bordino = giro([[R_CAMPANA + 0.001, 0.0001], [R_CAMPANA + 0.001, -0.004]], panno, 72)
  macchina.add(bordino)
  const collare = giro([[R_CAMPANA + 0.0004, 0.0], [R_CAMPANA + 0.0004, 0.0052], [R_CAMPANA + 0.0022, 0.0068], [0.0702, 0.0062], [0.0722, 0.0035], [0.0730, -0.0045]], ottone, 96)
  collare.castShadow = true; collare.receiveShadow = true
  macchina.add(collare)
  // il vetro: il profilo della fisica (da dentro il collare in su), un filo più largo, e il pomolo in cima
  const T = 0.0016
  const prof = PROFILO.filter(([, y]) => y >= 0).map(([r, y]) => {
    if (y <= PARETE) return [r + T, y]
    const H = CIMA - PARETE, nx = r / (R_CAMPANA * R_CAMPANA), ny = (y - PARETE) / (H * H), l = Math.hypot(nx, ny)
    return [r + (T * nx) / l, y + (T * ny) / l]
  })
  prof[0][1] = 0.003
  const vetro = giro(prof, vetroMat, 96)
  vetro.renderOrder = 2
  macchina.add(vetro)
  const pomolo = giro([[0.0, CIMA + T], [0.006, CIMA + T], [0.0045, CIMA + T + 0.002], [0.003, CIMA + T + 0.006], [0.0055, CIMA + T + 0.009], [0.006, CIMA + T + 0.0115], [0.0035, CIMA + T + 0.0145], [0.0, CIMA + T + 0.0152]], ottone, 48)
  pomolo.castShadow = true
  macchina.add(pomolo)

  // i dadi
  const facce = [1, 2, 3, 4, 5, 6].map((n) => texFaccia(n))
  const mats = C.FACCE.map((n) => new THREE.MeshPhysicalMaterial({ map: facce[n - 1].colore, bumpMap: facce[n - 1].rilievo, bumpScale: 1.4, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08 }))
  const geo = cuboTondo(LATO, SMUSSO)
  dadi3 = campana.dadi.map(() => {
    const m = new THREE.Mesh(geo, mats)
    m.castShadow = true; m.receiveShadow = true
    scena.add(m)
    return m
  })

  // l'ombra della base sul foglio
  const ombra = new THREE.Mesh(new THREE.CircleGeometry(0.3, 48), new THREE.ShadowMaterial({ opacity: 0.2 }))
  ombra.rotation.x = -Math.PI / 2
  ombra.position.y = -0.0342
  ombra.receiveShadow = true
  scena.add(ombra)
  metti()
}

// un cubo di lato L con gli spigoli tondi di raggio r: le sei facce di BoxGeometry (coi loro gruppi e le loro
// coordinate di texture), ogni vertice spinto sulla superficie arrotondata, le normali giuste
function cuboTondo(L, r) {
  const g = new THREE.BoxGeometry(L, L, L, 10, 10, 10)
  const p = g.getAttribute('position'), n = g.getAttribute('normal'), h = L / 2 - r
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i)
    const cx = Math.max(-h, Math.min(h, x)), cy = Math.max(-h, Math.min(h, y)), cz = Math.max(-h, Math.min(h, z))
    let dx = x - cx, dy = y - cy, dz = z - cz
    const l = Math.hypot(dx, dy, dz) || 1
    dx /= l; dy /= l; dz /= l
    p.setXYZ(i, cx + dx * r, cy + dy * r, cz + dz * r)
    n.setXYZ(i, dx, dy, dz)
  }
  return g
}

// la faccia di un dado: avorio, i punti incavati (neri, o rossi l'uno e il quattro) e la mappa del rilievo
function texFaccia(n) {
  const S = 256
  const colore = document.createElement('canvas'), rilievo = document.createElement('canvas')
  colore.width = colore.height = rilievo.width = rilievo.height = S
  const c = colore.getContext('2d'), b = rilievo.getContext('2d')
  const fondo = c.createRadialGradient(S * 0.4, S * 0.35, S * 0.1, S / 2, S / 2, S * 0.75)
  fondo.addColorStop(0, '#fbf8f0'); fondo.addColorStop(1, '#ebe4d4')
  c.fillStyle = fondo; c.fillRect(0, 0, S, S)
  b.fillStyle = '#fff'; b.fillRect(0, 0, S, S)
  for (const [u, v] of PUNTI[n]) {
    const r = S * (n === 1 ? 0.15 : 0.085), x = u * S, y = v * S
    const g = c.createRadialGradient(x - r * 0.25, y - r * 0.3, r * 0.1, x, y, r)
    const [chiaro, scuro] = rossi(n) ? ['#d8303a', '#8f0b15'] : ['#3a3633', '#0c0b0b']
    g.addColorStop(0, scuro); g.addColorStop(0.75, chiaro); g.addColorStop(1, scuro)
    c.fillStyle = g
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill()
    // l'incavo: più basso al centro (scuro), il bordo netto
    const k = b.createRadialGradient(x, y, 0, x, y, r)
    k.addColorStop(0, '#000'); k.addColorStop(0.8, '#3a3a3a'); k.addColorStop(1, '#bbb')
    b.fillStyle = k
    b.beginPath(); b.arc(x, y, r * 1.02, 0, Math.PI * 2); b.fill()
  }
  const t = (cv, srgb) => { const x = new THREE.CanvasTexture(cv); if (srgb) x.colorSpace = THREE.SRGBColorSpace; x.anisotropy = 4; return x }
  return { colore: t(colore, true), rilievo: t(rilievo, false) }
}

// il panno verde del piatto, con la grana del feltro
function texPanno() {
  const S = 256
  const cv = document.createElement('canvas')
  cv.width = cv.height = S
  const g = cv.getContext('2d')
  g.fillStyle = '#1f5a36'
  g.fillRect(0, 0, S, S)
  const img = g.getImageData(0, 0, S, S)
  for (let i = 0; i < img.data.length; i += 4) { const k = (Math.random() - 0.5) * 18; img.data[i] += k; img.data[i + 1] += k; img.data[i + 2] += k }
  g.putImageData(img, 0, 0)
  const t = new THREE.CanvasTexture(cv)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(3, 3)
  return t
}
