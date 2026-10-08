// La roulette di pzkko.it: il gioco. Da soli contro il banco, con i $pzk.
// Qui stanno le puntate, le fiche sul tappeto, la consolle sul bordo, il quadro
// di comando, la memoria locale e soprattutto la coreografia del croupier: la
// spinta al rotore, la pallina presa dalla casella e lanciata, il dolly sul
// numero, le fiche perse ritirate con la mano e le vincite spinte verso di te.

import * as F from './fisica.js'
import { creaScena, creaOrologio, caricaPezzi, creaCroupier, svgEl, pezzo, inPiedi, clamp, lerp, jerkMinimo } from './scena.js'
import { creaRuota } from './ruota.js'
import { creaTavolo, PAGA } from './tavolo.js'

const ART = 'art/'
const FICHE = [5, 10, 25, 50, 100]
const MIN = 5, MAX_CASELLA = 500, INIZIO = 1000
const $ = (id) => document.getElementById(id)
const el = { sala: $('sala'), mondo: $('mondo'), piano: $('piano'), dietro: $('dietro'), davanti: $('davanti'), targhe: $('targhe'), segni: $('segni'), ruota: $('ruota'), oggettiPiano: $('oggetti-piano'), riga: $('riga'), ultimi: $('ultimi'), tray: $('tray'), toast: $('toast'), saldo: $('saldo'), giri: $('giri'), velo: $('velo') }
const fmt = (n) => Math.trunc(Number(n) || 0).toLocaleString('it-IT')
const mem = { get(k) { try { return localStorage.getItem(k) } catch { return null } }, set(k, v) { try { localStorage.setItem(k, v) } catch {} } }
const reduce = matchMedia('(prefers-reduced-motion: reduce)')
const param = new URLSearchParams(location.search)
const VELOCE = param.has('veloce') // per le prove: tutto più svelto

// ── stato ──────────────────────────────────────────────────────────────────
const saldoSalvato = mem.get('rl-saldo')
let saldo = saldoSalvato === null ? INIZIO : Number(saldoSalvato)
if (!Number.isFinite(saldo) || saldo < 0) saldo = INIZIO
let storico = []
try { storico = JSON.parse(mem.get('rl-storico') || '[]').filter((n) => Number.isInteger(n) && n >= 0 && n <= 36).slice(0, 40) } catch {}
let fiche = 10 // la fiche scelta
let fase = 'puntate' // puntate · giro · esito
let pile = new Map() // chiave → pila (una puntata sul tappeto)
let ultime = [] // le puntate dell'ultimo giro, per «ripeti»
let messaggio = ''
let esitoRiga = ''

// ── la scena ───────────────────────────────────────────────────────────────
const S = creaScena(el)
const O = creaOrologio()
let PZ = {}, croupier = null, ruota = null, tavolo = null, dolly = null, rastrelliera = null
const seme = Number(param.get('seme')) || (crypto.getRandomValues(new Uint32Array(1))[0] >>> 0)
const fisica = F.nuovaRuota({ seme })
F.spingiRotore(fisica, -2.3)
F.passo(fisica, 0.5)
F.posa(fisica, storico.length ? F.INDICE[storico[0]] : 0)

const sulPiano = (u, v) => ({ u: u + ruota.u, v: v + ruota.v })

// ── le fiche sul tappeto ───────────────────────────────────────────────────
const scomponi = (n) => { const out = []; for (const v of [...FICHE].reverse()) while (n >= v && out.length < 8) { out.push(v); n -= v } if (!out.length) out.push(5); return out }
function nuovaPila(u, v, importo, cls = '') {
  const d = document.createElement('div')
  d.className = `pila ${cls}`
  el.oggettiPiano.appendChild(d)
  const p = { el: d, u, v, importo, segui: null, anim: null }
  disegnaPila(p)
  return p
}
function disegnaPila(p) {
  const k = S.M.ppc / 5.5
  p.el.innerHTML = scomponi(p.importo).map((v, i) => `<i style="transform:translateY(${-i * 4}px);background-image:url(${ART}fiche/f${v}.webp)"></i>`).join('') + `<span class="n">${fmt(p.importo)}</span>`
  p.el.style.transform = `translate(${p.u.toFixed(1)}px,${p.v.toFixed(1)}px) scale(${k.toFixed(3)})`
  p.k = k
}
function muoviPila(p, u, v) { p.u = u; p.v = v; p.el.style.transform = `translate(${u.toFixed(1)}px,${v.toFixed(1)}px) scale(${(p.k || 1).toFixed(3)})` }
function togliPila(p) { p.el.remove(); p.segui = null; p.anim = null }
// scivola da dove sta a (u, v): spinta dalla mano
function scivola(p, u, v, durata) { p.anim = { da: { u: p.u, v: p.v }, a: { u, v }, t0: O.t, durata }; return O.attendi(durata) }
O.passi.push(() => {
  for (const p of tutteLePile()) {
    if (p.segui) { const q = p.segui.A.pos; muoviPila(p, q.u + p.segui.du, q.v + p.segui.dv) }
    else if (p.anim) { const a = p.anim; const s = jerkMinimo((O.t - a.t0) / a.durata); muoviPila(p, lerp(a.da.u, a.a.u, s), lerp(a.da.v, a.a.v, s)); if (s >= 1) p.anim = null }
  }
})
const extra = new Set() // pile non legate a una puntata (vincite in arrivo)
const tutteLePile = () => [...pile.values(), ...extra]

// ── puntare ────────────────────────────────────────────────────────────────
function sulTavolo() { let s = 0; for (const p of pile.values()) s += p.importo; return s }
function punta(zona, importo = fiche) {
  if (fase !== 'puntate') return
  const p = pile.get(zona.chiave)
  const gia = p ? p.importo : 0
  if (importo > saldo) return toast(saldo < MIN ? 'hai finito i $pzk: ricomincia dalla scheda qui sotto' : `ti restano ${fmt(saldo)} $pzk`)
  if (gia + importo > MAX_CASELLA) return toast(`al massimo ${fmt(MAX_CASELLA)} $pzk per casella`)
  saldo -= importo
  if (p) { p.importo += importo; disegnaPila(p) }
  else pile.set(zona.chiave, Object.assign(nuovaPila(zona.pos.u, zona.pos.v, importo), { zona, storia: [] }))
  pile.get(zona.chiave).storia.push(importo)
  ordine.push(zona.chiave)
  try { navigator.vibrate && navigator.vibrate(8) } catch {}
  renderTutto()
}
let ordine = [] // le chiavi nell'ordine in cui si è puntato, per «annulla»
function annulla() {
  if (fase !== 'puntate' || !ordine.length) return
  const chiave = ordine.pop()
  const p = pile.get(chiave)
  if (!p) return
  const importo = p.storia.pop() || p.importo
  saldo += importo
  p.importo -= importo
  if (p.importo <= 0) { togliPila(p); pile.delete(chiave) } else disegnaPila(p)
  renderTutto()
}
function azzera() {
  if (fase !== 'puntate') return
  for (const p of pile.values()) { saldo += p.importo; togliPila(p) }
  pile.clear(); ordine = []
  renderTutto()
}
function ripeti() {
  if (fase !== 'puntate' || !ultime.length) return
  azzera()
  for (const { zona, importo } of ultime) punta(tavolo.perChiave.get(zona.chiave) || zona, importo)
}

// ── il quadro di comando e la consolle ─────────────────────────────────────
let consolle = null
function renderConsolle() {
  if (!consolle) { consolle = document.createElement('div'); consolle.className = 'console'; el.targhe.appendChild(consolle); consolle.dataset.firma = '' }
  consolle.style.top = S.M.console.y + 'px'
  const aperto = fase === 'puntate'
  const firma = JSON.stringify([fase, fiche, saldo, pile.size, ultime.length, S.M.orient])
  if (consolle.dataset.firma === firma) return
  consolle.dataset.firma = firma
  let h = `<div class="fila">${FICHE.map((v, i) => `<button class="fiche-tocco${v === fiche ? ' scelta' : ''}" type="button" data-fiche="${v}" ${aperto && v <= saldo ? '' : 'disabled'} style="background-image:url(${ART}fiche/f${v}.webp)" aria-label="fiche da ${v}" title="${i + 1}"></button>`).join('')}</div>`
  h += '<div class="fila">'
  h += `<button class="tasto p" type="button" data-azione="gira" ${aperto && pile.size ? '' : 'disabled'}>gira<span class="k">spazio</span></button>`
  h += `<button class="tasto" type="button" data-azione="annulla" ${aperto && pile.size ? '' : 'disabled'}>annulla</button>`
  h += `<button class="tasto" type="button" data-azione="azzera" ${aperto && pile.size ? '' : 'disabled'}>azzera</button>`
  if (ultime.length && !pile.size) h += `<button class="tasto" type="button" data-azione="ripeti" ${aperto ? '' : 'disabled'}>ripeti</button>`
  h += '</div>'
  consolle.innerHTML = h
}
const numHtml = (n) => `<span class="num ${F.colore(n)}">${n}</span>`
function descriviNumero(n) {
  if (n === 0) return 'zero'
  return `${F.colore(n)} · ${n % 2 ? 'dispari' : 'pari'} · ${n <= 18 ? '1-18' : '19-36'}`
}
function renderHud() {
  let riga = ''
  if (fase === 'puntate') riga = pile.size ? `<span>sul tappeto <b class="n">${fmt(sulTavolo())} $pzk</b> · fiche da <b class="n">${fiche}</b></span>` : saldo < MIN ? '<span>hai finito i $pzk: ricomincia dalla scheda qui sotto</span>' : `<span>puntate aperte · fiche da <b class="n">${fiche}</b>: tocca il tappeto</span>`
  else if (fase === 'giro') riga = `<span>${messaggio}</span>`
  else riga = esitoRiga
  if (el.riga.dataset.firma !== riga) { el.riga.dataset.firma = riga; el.riga.innerHTML = riga }
  const u = storico.slice(0, 12).map(numHtml).join('')
  if (el.ultimi.dataset.firma !== u) { el.ultimi.dataset.firma = u; el.ultimi.innerHTML = u }
  el.saldo.innerHTML = `<span>i tuoi $pzk</span><b class="n${saldoSu ? ' su' : ''}">${fmt(saldo)}</b>`
  el.giri.innerHTML = storico.length ? storico.slice(0, 30).map((n) => `<li>${numHtml(n)}</li>`).join('') : '<li class="vuoto">nessun giro ancora.</li>'
}
let saldoSu = false
function renderTutto() { renderConsolle(); renderHud() }
let toastTimer = 0
function toast(msg) { el.toast.textContent = msg; el.toast.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.toast.classList.remove('on'), 3200) }

// ── gli oggetti in scena: il dolly, la rastrelliera, la pallina in mano ─────
function spriteOggetto(nome) {
  const d = PZ.oggetti && PZ.oggetti[nome]
  const g = svgEl('g', {})
  if (d) { svgEl('image', { href: `${ART}oggetti/${nome}.webp`, width: d.w, height: d.h, x: -d.w / 2, y: -d.h, preserveAspectRatio: 'none' }, g); g._d = d }
  return g
}
function costruisciScena() {
  el.dietro.innerHTML = ''; el.davanti.innerHTML = ''
  croupier = creaCroupier(S, PZ, ART, O)
  ruota = creaRuota(S, el, PZ, ART, fisica)
  tavolo = creaTavolo(S, el)
  rastrelliera = pezzo(el.davanti, PZ, 'oggetti', 'rastrelliera', ART)
  dolly = pezzo(el.davanti, PZ, 'oggetti', 'dolly', ART)
  // gli oggetti in piedi sul bordo lontano
  inPiedi(rastrelliera, S, S.M.rastrelliera.u, S.M.rastrelliera.v, 18)
  posaDolly(S.M.dolly.u, S.M.dolly.v)
  for (const p of tutteLePile()) disegnaPila(p)
}
let dollyDove = null
function posaDolly(u, v) { dollyDove = { u, v }; el.davanti.appendChild(dolly); inPiedi(dolly, S, u, v, 7) }

function rimisura() {
  S.misura()
  croupier.rimisura()
  ruota.rimisura()
  tavolo.rimisura()
  inPiedi(rastrelliera, S, S.M.rastrelliera.u, S.M.rastrelliera.v, 18)
  // le puntate seguono la nuova geometria delle zone
  for (const p of pile.values()) { const z = tavolo.perChiave.get(p.zona.chiave); if (z) { p.zona = z; p.u = z.pos.u; p.v = z.pos.v } disegnaPila(p) }
  if (dollyDove) { if (dollyDove.numero !== undefined) { const z = tavolo.cellaNumero(dollyDove.numero); posaDolly(z.pos.u, z.pos.v); dollyDove.numero = z.numeri[0] } else posaDolly(S.M.dolly.u, S.M.dolly.v) }
  renderConsolle()
}

// ── la coreografia del croupier ────────────────────────────────────────────
const v = (x) => (VELOCE ? x * 0.35 : x)
const cm = () => S.M.ppc
async function gira() {
  if (fase !== 'puntate' || !pile.size) return
  fase = 'giro'; tavolo.chiudi(); ordine = []
  ultime = [...pile.values()].map((p) => ({ zona: p.zona, importo: p.importo }))
  messaggio = 'niente più puntate: il croupier gira la ruota'
  renderTutto()
  const C = croupier, M = S.M
  const manoRuota = 'destro', manoFiche = 'sinistro'
  // 1. la spinta al rotore: la mano prende la torretta e la fa girare
  const tor = ruota.torretta()
  const lato = M.lancio === 0 ? { u: 0, v: 1 } : { u: 1, v: 0 } // la direzione tangente della spinta dipende da dove sta il croupier
  await C.vai(manoRuota, { u: tor.u - lato.u * 7 * cm(), v: tor.v - lato.v * 7 * cm(), h: tor.h + 1 }, { mano: 'pinza', durata: v(0.75) })
  {
    const w0 = fisica.rotore.w, w1 = -2.1 - fisica.rnd() * 0.6
    const t0 = O.t, durata = v(0.42)
    const spinta = () => { const s = clamp((O.t - t0) / durata, 0, 1); F.spingiRotore(fisica, lerp(w0, w1, jerkMinimo(s))) }
    O.passi.push(spinta)
    await C.vai(manoRuota, { u: tor.u + lato.u * 8 * cm(), v: tor.v + lato.v * 8 * cm(), h: tor.h + 1 }, { durata, arco: 0 })
    O.passi.splice(O.passi.indexOf(spinta), 1)
  }
  // 2. prende la pallina dalla casella (che gira): mira a dove sarà la casella all'arrivo della mano
  {
    const p = F.posizione(fisica)
    const durata = v(0.7)
    const dove = F.centroCasella(fisica, p.casella)
    const ang = Math.atan2(dove.y, dove.x) + fisica.rotore.w * durata
    const q = ruota.cm(F.GEOM.casella * Math.cos(ang), F.GEOM.casella * Math.sin(ang))
    await C.vai(manoRuota, { u: q.u, v: q.v, h: 3 }, { mano: 'pinza', durata, arco: 5 })
    F.prendi(fisica)
    const palla = spriteOggetto('pallina')
    const pd = palla._d
    if (pd) { palla.firstChild.setAttribute('y', -pd.h / 2); C.tieni(manoRuota, palla, { scala: (2.2 * cm()) / pd.w, dx: 0, dy: -0.6 * cm() }) }
  }
  // 3. la porta sulla pista e la lancia
  {
    const a0 = M.lancio
    const p = ruota.pista(a0)
    await C.vai(manoRuota, { u: p.u, v: p.v, h: 2.2 }, { durata: v(0.8), arco: 7 })
    await O.attendi(v(0.12))
    C.tieni(manoRuota, null)
    F.lancia(fisica, { a0 })
    messaggio = 'la pallina gira'
    renderHud()
    // la mano accompagna il lancio lungo la tangente (in senso orario) e torna
    const tx = -Math.sin(a0), ty = Math.cos(a0)
    await C.vai(manoRuota, { u: p.u + tx * 9 * cm(), v: p.v + ty * 9 * cm(), h: 4 }, { durata: v(0.22), arco: 0 })
    C.riposa(manoRuota, { durata: v(0.9) })
  }
  // 4. la pallina fa il suo giro
  let detto = false
  while (F.inGioco(fisica)) { await O.attendi(0.1); if (!detto && fisica.pallina && fisica.pallina.fase !== 'pista') { detto = true; messaggio = 'la pallina scende'; renderHud() } }
  while (fisica.pallina && fisica.pallina.osc) await O.attendi(0.05)
  // 5. il numero
  const n = fisica.esito
  storico.unshift(n); storico = storico.slice(0, 40); mem.set('rl-storico', JSON.stringify(storico))
  const vinte = [], perse = []
  for (const p of pile.values()) (tavolo.vince(p.zona, n) ? vinte : perse).push(p)
  const vincita = vinte.reduce((s, p) => s + p.importo * PAGA[p.zona.tipo], 0)
  const resa = vinte.reduce((s, p) => s + p.importo, 0) + vincita
  const persa = perse.reduce((s, p) => s + p.importo, 0)
  fase = 'esito'
  esitoRiga = `<span>esce il</span>${numHtml(n)}<span class="desc">${descriviNumero(n)}</span>` + (vinte.length ? `<b class="grande pos n">+${fmt(vincita)} $pzk</b>` : `<b class="neg n">−${fmt(persa)} $pzk</b>`)
  renderTutto()
  try { navigator.vibrate && navigator.vibrate(vinte.length ? [30, 40, 30] : 20) } catch {}
  for (const p of perse) p.el.classList.add('persa')
  for (const p of vinte) p.el.classList.add('vinta')
  // 6. il dolly sul numero
  const cella = tavolo.cellaNumero(n)
  await C.vai(manoFiche, { u: dollyDove.u, v: dollyDove.v, h: 6 }, { mano: 'pinza', durata: v(0.8) })
  C.tieni(manoFiche, dolly, { scala: dolly._sc || 1, dx: 0, dy: 0 })
  dollyDove = { u: dollyDove.u, v: dollyDove.v, inMano: true }
  await C.vai(manoFiche, { u: cella.pos.u, v: cella.pos.v, h: 6 }, { durata: v(0.9), arco: 6 })
  C.tieni(manoFiche, null); posaDolly(cella.pos.u, cella.pos.v); dollyDove.numero = n
  // 7. ritira le fiche perse: la mano passa dietro a ognuna e le raccoglie, poi le porta alla rastrelliera
  if (perse.length) {
    const A = C.braccia[manoFiche]
    const versoMe = M.orient === 'largo' ? { u: 0, v: 1 } : { u: 1, v: 0 } // da dove arriva la mano: dal lato del giocatore
    perse.sort((a, b) => (M.orient === 'largo' ? a.u - b.u : a.v - b.v))
    for (const p of perse) {
      await C.vai(manoFiche, { u: p.u + versoMe.u * 5 * cm(), v: p.v + versoMe.v * 5 * cm(), h: 1 }, { mano: 'aperta', durata: v(0.5), arco: 4 })
      p.segui = { A, du: -versoMe.u * 5 * cm(), dv: -versoMe.v * 5 * cm() }
    }
    const r = tavolo.G.rastrelliera
    await C.vai(manoFiche, { u: r.u, v: r.v + 4 * cm(), h: 2 }, { durata: v(0.8), arco: 5 })
    for (const p of perse) { togliPila(p); pile.delete(p.zona.chiave) }
  }
  // 8. paga le vincite: per ognuna prende le fiche dalla rastrelliera e le posa accanto, poi spinge tutto verso di te
  if (vinte.length) {
    const r = tavolo.G.rastrelliera
    const versoMe = M.orient === 'largo' ? { u: 0, v: 1 } : { u: 1, v: 0 }
    const pagate = []
    for (const p of vinte) {
      const quanto = p.importo * PAGA[p.zona.tipo]
      await C.vai(manoFiche, { u: r.u, v: r.v + 6 * cm(), h: 3 }, { mano: 'pinza', durata: v(0.7), arco: 5 })
      const inMano = svgEl('g', {})
      const sd = PZ.fiche && PZ.fiche[`s${scomponi(quanto)[0]}`]
      if (sd) svgEl('image', { href: `${ART}fiche/s${scomponi(quanto)[0]}.webp`, width: sd.w, height: sd.h, x: -sd.w / 2, y: -sd.h * 0.8, preserveAspectRatio: 'none' }, inMano)
      C.tieni(manoFiche, inMano, { scala: sd ? (7 * cm()) / sd.w : 1 })
      const dest = { u: p.u + versoMe.u * 7 * cm() + (M.orient === 'largo' ? 0 : 0), v: p.v + versoMe.v * 7 * cm() }
      await C.vai(manoFiche, { u: dest.u, v: dest.v, h: 3 }, { durata: v(0.9), arco: 6 })
      C.tieni(manoFiche, null)
      const pagata = nuovaPila(dest.u, dest.v, quanto, 'vinta')
      extra.add(pagata); pagate.push({ p, pagata })
    }
    // la spinta verso di te: la mano dietro alla pila, e giù fino al bordo davanti
    const G = tavolo.giocatore
    for (const { p, pagata } of pagate) {
      const dietroU = p.u - versoMe.u * 6 * cm(), dietroV = p.v - versoMe.v * 6 * cm()
      await C.vai(manoFiche, { u: dietroU, v: dietroV, h: 1 }, { mano: 'aperta', durata: v(0.55), arco: 4 })
      // fin sotto al tappeto, dalla tua parte: lì le fiche sono tue e passano nel saldo
      const arrivo = M.orient === 'largo' ? { u: clamp(p.u, G.u - 300, G.u + 300), v: Math.max(G.v, p.v + 10 * cm()) } : { u: Math.max(G.u, p.u + 10 * cm()), v: clamp(p.v, G.v - 400, G.v + 300) }
      const durata = v(0.8)
      const pr1 = scivola(p, arrivo.u, arrivo.v, durata)
      const pr2 = scivola(pagata, arrivo.u + (pagata.u - p.u) * 0.6, arrivo.v + (pagata.v - p.v) * 0.6, durata)
      await C.vai(manoFiche, { u: arrivo.u - versoMe.u * 6 * cm(), v: arrivo.v - versoMe.v * 6 * cm(), h: 1 }, { durata, arco: 0 })
      await Promise.all([pr1, pr2])
      saldo += p.importo + pagata.importo
      saldoSu = true; renderHud(); setTimeout(() => { saldoSu = false; renderHud() }, 900)
      pile.delete(p.zona.chiave); extra.delete(pagata)
      for (const q of [p, pagata]) { q.el.classList.add('via'); q.el.style.setProperty('--giu', `${versoMe.u * 30}px, ${versoMe.v * 30}px`); setTimeout(() => togliPila(q), 500) }
    }
  }
  // 9. il dolly torna al suo posto, le puntate riaprono
  await C.vai(manoFiche, { u: cella.pos.u, v: cella.pos.v, h: 6 }, { mano: 'pinza', durata: v(0.7), arco: 5 })
  C.tieni(manoFiche, dolly, { scala: dolly._sc || 1 })
  dollyDove = { u: cella.pos.u, v: cella.pos.v, inMano: true }
  await C.vai(manoFiche, { u: M.dolly.u, v: M.dolly.v, h: 6 }, { durata: v(0.9), arco: 6 })
  C.tieni(manoFiche, null); posaDolly(M.dolly.u, M.dolly.v)
  C.riposa(manoFiche, { durata: v(0.8) })
  mem.set('rl-saldo', String(saldo))
  fase = 'puntate'; tavolo.apri()
  if (saldo < MIN) { ultime = [] }
  renderTutto()
}

// ── il battito ─────────────────────────────────────────────────────────────
function battito(nowMs) {
  if (!document.hidden) {
    O.frame(nowMs)
    F.passo(fisica, O.dt)
    croupier.aggiorna(O.dt, O.t)
    ruota.aggiorna()
    // il dolly in mano segue la mano
    if (dollyDove && dollyDove.inMano) { /* lo muove tieni() */ }
  } else O.ultimo = 0
  requestAnimationFrame(battito)
}

// ── gesti dell'utente ──────────────────────────────────────────────────────
let premuto = null
el.segni.addEventListener('pointerdown', (e) => {
  if (fase !== 'puntate') return
  const q = S.dalPuntatore(e)
  const z = tavolo.colpisci(q.u, q.v)
  premuto = { id: e.pointerId, z }
  tavolo.evidenzia(z)
  if (z) { el.riga.innerHTML = `<span>${tavolo.descrivi(z)}</span><b class="n">${fiche} $pzk</b>`; el.riga.dataset.firma = '' }
  try { el.segni.setPointerCapture(e.pointerId) } catch {}
  e.preventDefault()
})
el.segni.addEventListener('pointermove', (e) => {
  if (fase !== 'puntate') return
  const q = S.dalPuntatore(e)
  const z = tavolo.colpisci(q.u, q.v)
  if (premuto && premuto.id === e.pointerId) { premuto.z = z; if (z) { el.riga.innerHTML = `<span>${tavolo.descrivi(z)}</span><b class="n">${fiche} $pzk</b>`; el.riga.dataset.firma = '' } }
  tavolo.evidenzia(z)
})
const fine = (e) => {
  if (!premuto || premuto.id !== e.pointerId) return
  const z = premuto.z; premuto = null
  if (e.type === 'pointerup' && z) punta(z)
  tavolo.evidenzia(e.pointerType === 'mouse' ? z : null)
  renderHud()
}
el.segni.addEventListener('pointerup', fine)
el.segni.addEventListener('pointercancel', fine)
el.segni.addEventListener('pointerleave', () => { if (!premuto) tavolo.evidenzia(null) })
el.sala.addEventListener('click', (e) => {
  const b = e.target.closest('button')
  if (!b || b.disabled) return
  if (b.dataset.fiche) { fiche = Number(b.dataset.fiche); renderTutto(); return }
  const a = b.dataset.azione
  if (a === 'gira') gira()
  else if (a === 'annulla') annulla()
  else if (a === 'azzera') azzera()
  else if (a === 'ripeti') ripeti()
})
addEventListener('keydown', (e) => {
  if (e.target.matches('input,textarea,button') && e.key !== ' ') return
  if (e.metaKey || e.ctrlKey || e.altKey) return
  if (e.key === ' ' || e.key === 'Enter') { if (fase === 'puntate' && pile.size) { e.preventDefault(); gira() } }
  else if (e.key === 'Backspace') { e.preventDefault(); annulla() }
  else if (/^[1-5]$/.test(e.key)) { fiche = FICHE[Number(e.key) - 1]; if (fiche <= saldo) renderTutto() }
  else if (e.key.toLowerCase() === 'r') ripeti()
})
$('ricomincia').addEventListener('click', () => { if (fase !== 'puntate') return toast('aspetta la fine del giro'); azzera(); saldo = INIZIO; mem.set('rl-saldo', String(saldo)); ultime = []; renderTutto(); toast('ricominci con 1000 $pzk'); scrollTo({ top: 0, behavior: 'smooth' }) })

// ── maggiore età ───────────────────────────────────────────────────────────
if (mem.get('rl-18') !== '1' && mem.get('bj-18') !== '1') { el.velo.classList.add('on'); document.body.style.overflow = 'hidden'; setTimeout(() => $('velo-ok').focus(), 50) }
$('velo-ok').addEventListener('click', () => { mem.set('rl-18', '1'); el.velo.classList.remove('on'); document.body.style.overflow = '' })

// ── via ────────────────────────────────────────────────────────────────────
let resizeTimer = 0
addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(rimisura, 120) })
;(async () => {
  PZ = await caricaPezzi(`${ART}pezzi.json`)
  S.misura()
  costruisciScena()
  rimisura()
  const errore = S.verifica()
  if (errore > 2) console.warn(`proiezione: scarto di ${errore.toFixed(1)} px rispetto al browser`)
  renderTutto()
  requestAnimationFrame(battito)
  // per le prove dal terminale
  window.roulette = { S, O, F, fisica, croupier, ruota, tavolo, gira, punta: (chiave, n) => punta(tavolo.perChiave.get(chiave), n), stato: () => ({ fase, saldo, pile: [...pile.keys()], storico }) }
})()
