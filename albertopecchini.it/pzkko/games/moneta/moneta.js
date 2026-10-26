// Testa o croce, il gioco della moneta di pzkko.it, in una finestra sopra il muro
// come la roulette e il blackjack: il foglio grande col nastro, il tavolo stampato
// (SVG, le due facce ricalcate a matita), le fiches fotografate (le stesse), e la
// moneta d'ottone in 3D (scena.js) che la fisica lancia davvero (Rapier, vedi
// lancio.js): sale girando, cade nel piatto di legno, rimbalza, rotola, ondeggia
// e si ferma come si ferma. Testa e croce pagano 1 a 1; dopo una vincita, «lascia
// o raddoppia?»: si incassa, o si rilancia tutto. Soldi finti ($pzk, gli stessi
// degli altri giochi: ../pzk.js).
//
// index.html la apre con import('/games/moneta/moneta.js').then((m) => m.apri()).

import * as pzk from '../pzk.js'

const QUI = new URL('.', import.meta.url).href
const ART = '/art/'
const GIOCO = 'moneta'
const CHIAVE = 'pzkko-moneta'
const RIDOTTO = matchMedia('(prefers-reduced-motion: reduce)')
const LATI = ['testa', 'croce']
const altro = (l) => (l === 'testa' ? 'croce' : 'testa')
const fmt = pzk.fmt
const attendi = (ms) => new Promise((r) => setTimeout(r, RIDOTTO.matches ? 0 : ms / (stato.veloce ? 2 : 1)))
const svgEl = (tag, attr = {}) => { const e = document.createElementNS('http://www.w3.org/2000/svg', tag); for (const [k, v] of Object.entries(attr)) e.setAttribute(k, v); return e }

// ── lo stato del gioco ───────────────────────────────────────────────────────
const stato = {
  storia: [], // le ultime uscite, la più recente prima
  conta: { testa: 0, croce: 0 }, // tutti i lanci fatti in questo browser
  giocate: { testa: 0, croce: 0 }, // i $pzk sul tavolo
  mosse: [], // le fiches posate, in ordine (per «togli»)
  ultime: null, // le puntate dell'ultimo giro (per «rifai»)
  base: null, // le puntate da cui è partita la serie di raddoppi
  raddoppi: 0,
  fiche: 5,
  fase: 'punta', // 'punta' | 'vola' | 'paga' | 'raddoppio'
  veloce: false,
}
function carica() {
  try {
    const s = JSON.parse(localStorage.getItem(CHIAVE) || 'null')
    if (s && Array.isArray(s.storia)) stato.storia = s.storia.filter((l) => LATI.includes(l)).slice(0, 16)
    if (s && s.conta) for (const l of LATI) stato.conta[l] = Number.isInteger(s.conta[l]) && s.conta[l] >= 0 ? s.conta[l] : 0
  } catch {}
}
// qui solo le uscite: i $pzk li tiene ../pzk.js (le fiches sul tavolo comprese)
function salva() { try { localStorage.setItem(CHIAVE, JSON.stringify({ storia: stato.storia, conta: stato.conta })) } catch {} }
const puntato = () => stato.giocate.testa + stato.giocate.croce

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
  if (!motore) motore = avviaMotore().catch((e) => { console.error(e); el.carica.textContent = 'la moneta non è arrivata: riprova più tardi' })
  else { scena?.misura(el.piatto.clientWidth, el.piatto.clientHeight); sveglia() }
}

async function costruisci() {
  carica()
  await new Promise((ok) => {
    const l = document.createElement('link')
    l.rel = 'stylesheet'; l.href = QUI + 'moneta.css'
    l.onload = ok; l.onerror = ok
    document.head.appendChild(l)
  })
  dlg = document.createElement('dialog')
  dlg.className = 'mo'
  dlg.setAttribute('aria-labelledby', 'mo-titolo')
  dlg.innerHTML = `
    <div class="mo-dentro">
      <header class="mo-testa">
        <h2 id="mo-titolo">testa o croce</h2>
        <p class="mo-voce" aria-live="polite"></p>
        <button class="mo-chiudi" type="button" aria-label="chiudi testa o croce"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M9 10c7 6 14 13 22 21M30 8c-6 8-13 15-21 23"/></svg></button>
      </header>
      <div class="mo-piatto">
        <canvas aria-label="la moneta nel piatto, in 3D" role="img"></canvas>
        <p class="mo-carica">la moneta arriva…</p>
        <p class="mo-annuncio" aria-hidden="true"></p>
      </div>
      <div class="mo-banco">
        <p class="mo-saldo"><small>hai</small><b></b><span class="puntato"></span></p>
        <div class="mo-scegli" role="group" aria-label="scegli la fiche"></div>
        <div class="mo-tasti">
          <button class="mo-piccolo mo-togli" type="button">togli</button>
          <button class="mo-piccolo mo-rifai" type="button">rifai</button>
          <button class="mo-piccolo mo-veloce" type="button" aria-pressed="false" title="la moneta vola tre volte più in fretta">×3</button>
          <button class="mo-lascia" type="button" hidden>lascia</button>
          <button class="mo-lancia" type="button">lancia</button>
        </div>
      </div>
      <div class="mo-tavolo">
        <div class="mo-campo"><svg aria-label="il tavolo delle puntate" role="group"></svg><div class="mo-fiches"></div></div>
        <div class="mo-sotto">
          <ol class="mo-storia" aria-label="le ultime uscite"></ol>
          <p class="mo-conto"></p>
        </div>
      </div>
    </div>`
  document.body.appendChild(dlg)
  const q = (s) => dlg.querySelector(s)
  el = {
    voce: q('.mo-voce'), chiudi: q('.mo-chiudi'), piatto: q('.mo-piatto'), canvas: q('canvas'), carica: q('.mo-carica'), annuncio: q('.mo-annuncio'),
    saldo: q('.mo-saldo b'), puntato: q('.mo-saldo .puntato'), scegli: q('.mo-scegli'), togli: q('.mo-togli'), rifai: q('.mo-rifai'), veloce: q('.mo-veloce'),
    lascia: q('.mo-lascia'), lancia: q('.mo-lancia'), campo: q('.mo-campo'), svg: q('.mo-campo svg'), fiches: q('.mo-fiches'), storia: q('.mo-storia'), conto: q('.mo-conto'),
  }
  // chi mi segue su instagram riceve 1.000 $pzk (una volta, ../pzk.js)
  q('.mo-saldo').appendChild(pzk.linkInstagram({ fatto: () => { voce(`grazie del follow: +${fmt(pzk.PREMIO_IG)} $pzk`); contaSaldo(pzk.saldo() - pzk.PREMIO_IG, pzk.saldo(), RIDOTTO.matches ? 0 : 900) } }))
  // col conto, gli EUR€ parcheggiati nel wallet: si giocano solo convertiti in $pzk (../pzk.js, wallet/)
  q('.mo-saldo').appendChild(pzk.rigaEuro())
  for (const v of pzk.FICHES) {
    const b = document.createElement('button')
    b.type = 'button'
    b.dataset.v = v
    b.setAttribute('aria-label', `fiche da ${v}`)
    b.innerHTML = `<img src="${ART}fiches/f${v}.webp" alt="" width="170" height="174">`
    b.addEventListener('click', () => { stato.fiche = v; aggiornaBanco() })
    el.scegli.appendChild(b)
  }
  el.chiudi.addEventListener('click', chiudi)
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); chiudi() })
  dlg.addEventListener('click', (e) => { if (e.target === dlg) chiudi() })
  el.lancia.addEventListener('click', () => (stato.fase === 'raddoppio' ? raddoppia() : lancia()))
  el.lascia.addEventListener('click', lascia)
  el.togli.addEventListener('click', togli)
  el.rifai.addEventListener('click', rifai)
  el.veloce.addEventListener('click', () => { stato.veloce = !stato.veloce; el.veloce.setAttribute('aria-pressed', String(stato.veloce)) })
  new ResizeObserver(() => { if (dlg.open) { disegnaTavolo(); ridisegnaPile() } }).observe(el.campo)
  new ResizeObserver(() => { if (scena) { scena.misura(el.piatto.clientWidth, el.piatto.clientHeight); sveglia() } }).observe(el.piatto)
  pzk.ascolta(() => { if (!contando) aggiornaBanco() }) // il saldo cambia anche giocando agli altri giochi
  voce(pzk.aSecco() ? 'hai finito i $pzk' : 'scegli una fiche e punta su testa o croce')
  aggiornaBanco()
  aggiornaStoria()
}

function chiudi() {
  if (!dlg?.open || dlg.classList.contains('chiude')) return
  const fine = () => { dlg.close(); dlg.classList.remove('chiude'); if (location.hash === '#moneta') history.replaceState(null, '', location.pathname + location.search) }
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
  const punta = stato.fase === 'punta', raddoppio = stato.fase === 'raddoppio'
  for (const b of el.scegli.children) {
    b.setAttribute('aria-pressed', String(Number(b.dataset.v) === stato.fiche))
    b.disabled = !punta
  }
  el.scegli.hidden = raddoppio
  el.togli.hidden = el.rifai.hidden = raddoppio
  el.togli.disabled = !punta || !stato.mosse.length
  el.rifai.disabled = !punta || !stato.ultime || puntato() > 0
  el.lascia.hidden = !raddoppio
  if (raddoppio) { el.lancia.textContent = 'raddoppia'; el.lancia.disabled = false }
  else if (punta && pzk.aSecco() && !puntato()) { el.lancia.textContent = 'ricarica'; el.lancia.disabled = false }
  else { el.lancia.textContent = 'lancia'; el.lancia.disabled = !punta || !lancio }
  dlg.classList.toggle('chiuso', !punta && !raddoppio)
}

function aggiornaStoria() {
  el.storia.innerHTML = stato.storia.map((l) => `<li class="${l}" aria-label="${l}">${l[0]}</li>`).join('')
  const { testa, croce } = stato.conta, tot = testa + croce
  // quante volte di fila è uscita l'ultima
  let fila = 0
  while (fila < stato.storia.length && stato.storia[fila] === stato.storia[0]) fila++
  el.conto.innerHTML = tot ? `${tot === 1 ? 'un lancio' : `${fmt(tot)} lanci`}: testa ${pc(testa, tot)}, croce ${pc(croce, tot)}${fila > 2 ? `<br>${stato.storia[0]} ${fila} volte di fila` : ''}` : 'la moneta è giusta: metà e metà'
}
const pc = (n, tot) => `${Math.round((100 * n) / tot)}%`

// ── il tavolo (SVG, stampato sul foglio) ────────────────────────────────────
// Due caselle una sopra l'altra: la faccia ricalcata a matita, il nome, «paga 1 a 1» e il cerchio dove si punta.
let T = null
function geometria() {
  const w = el.campo.clientWidth, h = el.campo.clientHeight
  const gap = Math.round(Math.min(14, h * 0.03))
  const hb = (h - gap) / 2
  const caselle = {}
  LATI.forEach((l, i) => {
    const y = i * (hb + gap)
    const D = Math.min(hb * 0.8, w * 0.5)
    const fx = 10 + D / 2 + Math.max(0, (w * 0.5 - D) / 3), fy = y + hb / 2
    const xd = (fx + D / 2 + w) / 2
    caselle[l] = { x: 0, y, w, h: hb, D, fx, fy, xd, tit: y + hb * 0.27, paga: y + hb * 0.27 + Math.min(hb * 0.26, 46) * 0.62, punto: { x: xd, y: y + hb * 0.7 }, rp: Math.max(18, Math.min(30, hb * 0.17)) }
  })
  return { w, h, caselle }
}

function disegnaTavolo() {
  if (!el.campo || !el.campo.clientWidth) return
  T = geometria()
  const svg = el.svg
  svg.setAttribute('viewBox', `0 0 ${T.w} ${T.h}`)
  svg.innerHTML = ''
  const defs = svgEl('defs')
  defs.innerHTML = `<filter id="mo-ink" x="-2%" y="-2%" width="104%" height="104%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="11" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" result="d"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -.55 1.22" result="g"/><feComposite in="d" in2="g" operator="in"/></filter>`
  svg.appendChild(defs)
  T.evid = svgEl('g', { class: 'mo-evid', 'aria-hidden': 'true' })
  svg.appendChild(T.evid)
  const stampa = svgEl('g', { filter: 'url(#mo-ink)' })
  svg.appendChild(stampa)
  const ink = '#161616'
  for (const l of LATI) {
    const c = T.caselle[l]
    stampa.appendChild(svgEl('rect', { x: c.x + 1, y: c.y + 1, width: c.w - 2, height: c.h - 2, rx: 6, fill: 'none', stroke: ink, 'stroke-width': 1.8 }))
    // la faccia ricalcata a matita (tools/pzkko/moneta/facce.mjs)
    const img = svgEl('image', { href: `${ART}moneta/${l}-frottage.webp`, x: c.fx - c.D / 2, y: c.fy - c.D / 2, width: c.D, height: c.D })
    svg.insertBefore(img, stampa)
    const t = svgEl('text', { x: c.xd, y: c.tit, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: l === 'croce' ? '#b3121f' : ink, class: 'mo-grande', 'font-size': Math.min(c.h * 0.26, 46, (c.w - c.fx - c.D / 2) * 0.36) })
    t.textContent = l
    stampa.appendChild(t)
    const p = svgEl('text', { x: c.xd, y: c.paga, 'text-anchor': 'middle', 'dominant-baseline': 'hanging', fill: ink, class: 'mo-piccola', 'font-size': Math.min(13, c.h * 0.075) })
    p.textContent = 'paga 1 a 1'
    stampa.appendChild(p)
    // il cerchio dove si punta
    stampa.appendChild(svgEl('circle', { cx: c.punto.x, cy: c.punto.y, r: c.rp, fill: 'none', stroke: ink, 'stroke-width': 1.4, 'stroke-dasharray': '3 4' }))
  }
  // il cerchio a pennarello sulla faccia uscita
  T.segno = svgEl('g', { 'aria-hidden': 'true' })
  svg.appendChild(T.segno)
  const zone = svgEl('g')
  for (const l of LATI) {
    const c = T.caselle[l]
    const z = svgEl('rect', { x: c.x, y: c.y, width: c.w, height: c.h, rx: 6, class: 'mo-zona', tabindex: '0', role: 'button', 'aria-label': `punta su ${l}, paga 1 a 1` })
    z.dataset.lato = l
    zone.appendChild(z)
  }
  svg.appendChild(zone)
  zone.addEventListener('pointerover', (e) => { const l = e.target.dataset?.lato; if (l) evidenzia(l) })
  zone.addEventListener('pointerout', () => evidenzia(null))
  zone.addEventListener('focusin', (e) => { const l = e.target.dataset?.lato; if (l) evidenzia(l) })
  zone.addEventListener('focusout', () => evidenzia(null))
  zone.addEventListener('click', (e) => { const l = e.target.dataset?.lato; if (l) tocca(l) })
  zone.addEventListener('pointerup', (e) => { if (e.pointerType !== 'mouse') setTimeout(() => evidenzia(null), 900) })
  zone.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.dataset?.lato) { e.preventDefault(); tocca(e.target.dataset.lato) } })
  if (stato.uscita) segna(stato.uscita, false)
}

function evidenzia(l) {
  if (!T) return
  T.evid.innerHTML = ''
  if (!l) { if (stato.fase === 'punta') voce(puntato() ? 'puoi ancora puntare, poi lancia' : 'scegli una fiche e punta su testa o croce'); return }
  if (stato.fase !== 'punta' && stato.fase !== 'raddoppio') return
  const c = T.caselle[l]
  T.evid.appendChild(svgEl('rect', { x: c.x + 3, y: c.y + 3, width: c.w - 6, height: c.h - 6, rx: 5 }))
  if (stato.fase === 'punta') voce(`${l}: paga 1 a 1${stato.giocate[l] ? ` · ci sono ${fmt(stato.giocate[l])}` : ''}`)
  else if (!stato.giocate[l]) voce(`sposti tutto su ${l}?`)
}

// toccare una casella: si punta; mentre si sceglie se raddoppiare, si sposta lì la puntata
function tocca(l) {
  if (stato.fase === 'punta') posa(l)
  else if (stato.fase === 'raddoppio') sposta(l)
  else voce('la moneta è in aria: aspetta')
}

// ── le fiches sul tavolo ─────────────────────────────────────────────────────
const pile = new Map() // lato → { el, fiches: [valori] }
function pila(l) {
  let p = pile.get(l)
  if (!p) {
    const e = document.createElement('div')
    e.className = 'mo-pila'
    el.fiches.appendChild(e)
    p = { el: e, fiches: [] }
    pile.set(l, p)
  }
  const c = T.caselle[l].punto
  p.el.style.transform = `translate(${c.x}px, ${c.y}px)`
  return p
}
const ALTO = 3.4 // px fra una fiche e quella sopra
function immagineFiche(v, i) {
  const img = document.createElement('img')
  img.className = 'mo-fiche'
  img.src = `${ART}fiches/f${v}.webp`
  img.alt = ''
  const k = Math.min(i, 13)
  const r = ((v * 37 + i * 101) % 23) - 11
  img.style.transform = `translate(${((i * 7) % 3) - 1}px, ${-k * ALTO}px) rotate(${r}deg)`
  img.style.zIndex = String(i)
  return img
}
function ridisegnaPile() {
  if (!T) return
  for (const [l, p] of pile) {
    pila(l)
    p.el.replaceChildren(...p.fiches.slice(0, 14).map((v, i) => immagineFiche(v, i)))
  }
}
const centro = (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } }
// l'ingrandimento del foglio sullo schermo (sul computer il gioco è grande del 20 %: CSS, scale sul foglio): le
// coordinate del tavolo sono quelle vere, lo schermo le vede ingrandite. Sul telefono 1
const zoom = () => { const r = el.campo.getBoundingClientRect(); return r.width / (el.campo.offsetWidth || r.width) || 1 }
const nelCampo = (c) => { const r = el.campo.getBoundingClientRect(), z = zoom(); return { x: r.left + c.x * z, y: r.top + c.y * z } }
const dallaFiche = (v) => centro(el.scegli.querySelector(`[data-v="${v}"] img`) ?? el.saldo)

/** Una fiche che vola da a a b (coordinate della finestra), con l'arco, l'ombra e un rimbalzo. */
function vola(v, a, b, { durata = 380, alto = 40, ruota = 0, dopo = 0, svanisce = false, scala = 1 } = {}) {
  if (RIDOTTO.matches) return Promise.resolve()
  const img = document.createElement('img')
  img.className = 'mo-volo'
  img.src = `${ART}fiches/f${v}.webp`
  img.alt = ''
  dlg.appendChild(img)
  const z = zoom(), mx = (a.x + b.x) / 2, my = Math.min(a.y, b.y) - alto * z // (grande come quelle sul tavolo)
  const anim = img.animate([
    { transform: `translate(${a.x}px, ${a.y}px) scale(${z}) rotate(0deg)`, filter: 'drop-shadow(0 2px 2px rgba(0,0,0,.3))', opacity: 1 },
    { offset: 0.5, transform: `translate(${mx}px, ${my}px) scale(${1.3 * scala * z}) rotate(${ruota / 2}deg)`, filter: 'drop-shadow(0 14px 10px rgba(0,0,0,.22))', opacity: 1 },
    { transform: `translate(${b.x}px, ${b.y}px) scale(${scala * z}) rotate(${ruota}deg)`, filter: 'drop-shadow(0 2px 2px rgba(0,0,0,.3))', opacity: svanisce ? 0 : 1 },
  ], { duration: durata / (stato.veloce ? 1.5 : 1), delay: dopo / (stato.veloce ? 1.5 : 1), easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'forwards' })
  return anim.finished.then(() => img.remove(), () => img.remove())
}
function colpetto(p) {
  if (RIDOTTO.matches) return
  p.el.animate([{ transform: p.el.style.transform + ' scale(1)' }, { transform: p.el.style.transform + ' scale(.9, .94)', offset: 0.35 }, { transform: p.el.style.transform + ' scale(1)' }], { duration: 160, easing: 'ease-out' })
}
function scuoti(e) {
  if (RIDOTTO.matches) return
  e.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(0)' }], { duration: 300 })
}

async function posa(l) {
  if (stato.fase !== 'punta' || !T) return
  const v = stato.fiche
  if (!pzk.punta(GIOCO, v)) { voce(pzk.nonBasta()); scuoti(el.saldo); return }
  togliSegno()
  stato.giocate[l] += v
  stato.mosse.push({ l, v })
  const p = pila(l)
  const i = p.fiches.length
  p.fiches.push(v)
  let img = null
  if (i < 14) { img = immagineFiche(v, i); img.style.visibility = 'hidden'; p.el.appendChild(img) }
  aggiornaBanco()
  evidenzia(l)
  const c = T.caselle[l].punto
  await vola(v, dallaFiche(v), nelCampo({ x: c.x, y: c.y - Math.min(i, 13) * ALTO }), { ruota: ((v * 37 + i * 101) % 23) - 11, alto: 30 + Math.random() * 30 })
  if (img) img.style.visibility = ''
  colpetto(p)
}

function togli() {
  if (stato.fase !== 'punta' || !stato.mosse.length) return
  const { l, v } = stato.mosse.pop()
  const p = pile.get(l)
  const img = p.fiches.length <= 14 ? p.el.lastElementChild : null
  const da = img ? centro(img) : centro(p.el)
  p.fiches.pop()
  img?.remove()
  if (!p.fiches.length) { p.el.remove(); pile.delete(l) }
  stato.giocate[l] -= v
  pzk.ritira(GIOCO, v)
  aggiornaBanco()
  vola(v, da, dallaFiche(v), { durata: 300, alto: 24 })
}

async function rifai() {
  if (stato.fase !== 'punta' || !stato.ultime || puntato()) return
  const tot = stato.ultime.testa + stato.ultime.croce
  if (tot > pzk.saldo()) { voce(`per rifare servono ${fmt(tot)} $pzk`); scuoti(el.saldo); return }
  const prima = stato.fiche
  for (const l of LATI) for (const v of pzk.inFiches(stato.ultime[l])) { stato.fiche = v; posa(l); await attendi(70) }
  stato.fiche = prima
  aggiornaBanco()
}

// mentre si sceglie se raddoppiare: tutta la puntata passa sull'altra faccia
async function sposta(l) {
  if (stato.fase !== 'raddoppio' || stato.giocate[l] || !T) return
  const da = altro(l), imp = stato.giocate[da]
  const p = pile.get(da)
  stato.giocate[l] = imp
  stato.giocate[da] = 0
  pile.delete(da)
  const q = pila(l)
  q.fiches = p.fiches
  const voli = [...p.el.children].map((img, j) => {
    const a = centro(img)
    img.style.visibility = 'hidden'
    const c = T.caselle[l].punto
    return vola(p.fiches[j], a, nelCampo({ x: c.x, y: c.y - j * ALTO }), { durata: 340, alto: 30, dopo: j * 22 })
  })
  p.el.remove()
  q.el.replaceChildren(...q.fiches.slice(0, 14).map((v, i) => { const im = immagineFiche(v, i); im.style.visibility = 'hidden'; return im }))
  evidenzia(null)
  voce(`${fmt(imp)} $pzk su ${l}: lascia o raddoppia?`)
  await Promise.all(voli)
  for (const im of q.el.children) im.style.visibility = ''
  colpetto(q)
}

// il cerchio a pennarello attorno alla faccia uscita, nella sua casella
function segna(l, anima = true) {
  if (!T) return
  T.segno.innerHTML = ''
  const c = T.caselle[l]
  const cx = c.fx, cy = c.fy, rr = c.D / 2 + 6
  const pts = []
  for (let k = 0; k <= 40; k++) { const t = -0.6 + (k / 40) * (Math.PI * 2 + 0.5), j = 1 + 0.05 * Math.sin(k * 1.7); pts.push(`${(cx + rr * j * Math.cos(t)).toFixed(1)} ${(cy + rr * 0.96 * j * Math.sin(t)).toFixed(1)}`) }
  const path = svgEl('path', { class: 'mo-cerchio', d: `M${pts.join(' L')}` })
  T.segno.appendChild(path)
  if (anima && !RIDOTTO.matches) {
    const L = path.getTotalLength()
    path.style.strokeDasharray = L
    path.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { duration: 420, easing: 'ease-out', fill: 'forwards' })
  }
}
function togliSegno() { if (T) T.segno.innerHTML = ''; stato.uscita = null }

// ── il lancio ────────────────────────────────────────────────────────────────
function lancia() {
  if (stato.fase !== 'punta') return
  if (pzk.aSecco() && !puntato()) {
    const dati = pzk.ricarica()
    aggiornaBanco()
    voce(dati ? `altri ${fmt(pzk.INIZIALE)} $pzk finti: punta` : pzk.perche())
    return
  }
  if (!lancio) return
  stato.base = { ...stato.giocate }
  stato.raddoppi = 0
  via(puntato() ? 'va!' : 'lancio senza puntate: guarda e basta')
}

function raddoppia() {
  if (stato.fase !== 'raddoppio') return
  stato.raddoppi++
  via(`raddoppio${stato.raddoppi > 1 ? ` n. ${stato.raddoppi}` : ''}: ${fmt(puntato())} $pzk in aria`)
}

function via(frase) {
  togliSegno()
  stato.fase = 'vola'
  stato.giro = { ...stato.giocate }
  aggiornaBanco()
  T?.evid.replaceChildren()
  voce(frase)
  el.annuncio.classList.remove('si')
  el.piatto.classList.remove('lente')
  scena.inquadra('piatto', { durata: 520 })
  lancio.lancia()
  sveglia()
}

// la moneta si è fermata: la faccia, il segno, le fiches perse e quelle vinte
async function fermata(l) {
  stato.fase = 'paga'
  stato.uscita = l
  stato.storia.unshift(l)
  stato.storia = stato.storia.slice(0, 16)
  stato.conta[l]++
  salva()
  aggiornaStoria()
  el.piatto.classList.add('lente')
  await scena.inquadra('moneta', { durata: 1000 })
  el.annuncio.textContent = l
  el.annuncio.className = `mo-annuncio ${l}`
  void el.annuncio.offsetWidth
  el.annuncio.classList.add('si')
  segna(l)
  const g = stato.giro ?? { testa: 0, croce: 0 }
  const vinta = g[l], persa = g[altro(l)]
  const tot = vinta + persa
  voce(!tot ? l : vinta ? `${l}: vinci ${fmt(vinta)} $pzk` : stato.raddoppi ? `${l}: il raddoppio è andato` : `${l}: il banco si prende tutto`)
  await attendi(650)

  // le perse: le fiches scivolano via verso il banco (in cima al tavolo)
  const banco = nelCampo({ x: T.w / 2, y: -14 })
  if (persa) {
    const p = pile.get(altro(l))
    if (p) {
      await Promise.all([...p.el.children].map((img, j) => {
        const da = centro(img)
        img.style.visibility = 'hidden'
        return vola(p.fiches[j], da, { x: banco.x + (j - 3) * 3, y: banco.y }, { durata: 520, alto: 14, dopo: j * 28, svanisce: true, scala: 0.7, ruota: 40 })
      }))
      p.el.remove()
      pile.delete(altro(l))
    }
    stato.giocate[altro(l)] = 0
  }

  if (vinta) {
    // la vincita arriva dal banco accanto alla pila, poi le due pile diventano una
    const p = pile.get(l), c = T.caselle[l].punto
    const vincita = pzk.inFiches(vinta)
    const accanto = document.createElement('div')
    accanto.className = 'mo-pila'
    accanto.style.transform = `translate(${c.x + 30}px, ${c.y + 3}px)`
    el.fiches.appendChild(accanto)
    await Promise.all(vincita.slice(0, 14).map((v, j) => {
      const img = immagineFiche(v, j)
      img.style.visibility = 'hidden'
      accanto.appendChild(img)
      return vola(v, banco, nelCampo({ x: c.x + 30, y: c.y + 3 - Math.min(j, 13) * ALTO }), { durata: 460, alto: 26, dopo: j * 45 }).then(() => { img.style.visibility = '' })
    }))
    // i conti: la vincita è pagata, e tutto resta sul tavolo per «lascia o raddoppia»
    pzk.regola(GIOCO, tot, 2 * vinta)
    pzk.punta(GIOCO, 2 * vinta)
    stato.giocate[l] = 2 * vinta
    await attendi(450)
    const n0 = p.el.children.length
    await Promise.all([...accanto.children].map((img, j) => {
      const da = centro(img)
      img.style.visibility = 'hidden'
      return vola(vincita[j] ?? 1, da, nelCampo({ x: c.x, y: c.y - Math.min(n0 + j, 13) * ALTO }), { durata: 300, alto: 16, dopo: j * 30 })
    }))
    accanto.remove()
    p.fiches = pzk.inFiches(2 * vinta)
    ridisegnaPile()
    colpetto(p)
    stato.mosse = []
    stato.fase = 'raddoppio'
    aggiornaBanco()
    voce(`${l}! sul tavolo ${fmt(2 * vinta)} $pzk: lascia o raddoppia?`)
    return
  }
  pzk.regola(GIOCO, tot, 0)
  fine()
  if (pzk.aSecco()) voce(`${l}. hai finito i $pzk: ricarica`)
}

// «lascia»: tutto quello che c'è sul tavolo torna al giocatore
async function lascia() {
  if (stato.fase !== 'raddoppio') return
  stato.fase = 'paga'
  aggiornaBanco()
  const imp = puntato()
  voce(`incassi ${fmt(imp)} $pzk`)
  const dove = centro(el.saldo)
  const voli = []
  for (const [, p] of pile) [...p.el.children].forEach((img, j) => {
    const da = centro(img)
    img.style.visibility = 'hidden'
    voli.push(vola(p.fiches[j] ?? 1, da, dove, { durata: 480, alto: 34, dopo: j * 22, svanisce: true, scala: 0.8 }))
  })
  contaSaldo(pzk.saldo(), pzk.saldo() + imp, RIDOTTO.matches ? 0 : 900)
  pzk.regola(GIOCO, imp, imp)
  await Promise.all(voli)
  fine()
}

// fine del giro: il tavolo vuoto, si punta di nuovo
function fine() {
  if (stato.base && stato.base.testa + stato.base.croce) stato.ultime = stato.base
  stato.base = null
  stato.giocate = { testa: 0, croce: 0 }
  stato.mosse = []
  stato.giro = null
  stato.raddoppi = 0
  pile.clear()
  el.fiches.replaceChildren()
  stato.fase = 'punta'
  aggiornaBanco()
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
    else { contando = false; aggiornaBanco() }
  }
  requestAnimationFrame(passo)
}

// ── la moneta 3D e la fisica ─────────────────────────────────────────────────
let lancio = null, scena = null, FISICA = null, raf = 0, ultimo = 0, accumulo = 0

async function avviaMotore() {
  const [rap, fisica, { Scena }] = await Promise.all([import(QUI + '../roulette/lib/rapier.mjs'), import(QUI + 'lancio.js'), import(QUI + 'scena.js')])
  const RAPIER = rap.default
  await RAPIER.init()
  FISICA = fisica.FISICA
  lancio = new fisica.Moneta(RAPIER)
  scena = new Scena(el.canvas)
  scena.cambiato = sveglia
  scena.misura(el.piatto.clientWidth, el.piatto.clientHeight)
  const { p, q } = lancio.pose()
  scena.posa(p, q)
  scena.inquadra('piatto', { durata: 0 })
  el.carica.remove()
  aggiornaBanco()
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { ultimo = performance.now(); sveglia() } })
  sveglia()
}

// il ciclo gira solo quando c'è qualcosa che si muove (la moneta, la telecamera); se no si ferma
function sveglia() {
  if (raf || !scena) return
  ultimo = performance.now()
  raf = requestAnimationFrame(ciclo)
}

function ciclo(t) {
  raf = requestAnimationFrame(ciclo)
  const dt = Math.min(0.1, (t - ultimo) / 1000)
  ultimo = t
  if (document.hidden || !dlg.open) { cancelAnimationFrame(raf); raf = 0; return }
  const inAria = lancio.stato === 'presa' || lancio.stato === 'vola'
  if (inAria) {
    accumulo += dt * (stato.veloce ? 3 : 1)
    let n = 0
    while (accumulo >= FISICA.dt && n < 120) {
      accumulo -= FISICA.dt
      n++
      const e = lancio.passo()
      if (e === 'nonvale') {
        accumulo = 0
        voce(lancio.ultimo === 'appoggiata' ? 'la moneta è rimasta appoggiata al bordo: non vale, si rilancia' : 'la moneta non si ferma: non vale, si rilancia')
        setTimeout(() => { if (lancio.stato === 'nonvale' && stato.fase === 'vola') { lancio.lancia(); sveglia() } }, 1100)
        break
      }
      if (e) { accumulo = 0; fermata(e); break }
    }
    if (n === 120) accumulo = 0
    const { p, q } = lancio.pose()
    scena.posa(p, q)
  }
  const muove = scena.fotogramma(t)
  if (!inAria && !muove) { cancelAnimationFrame(raf); raf = 0 }
}
