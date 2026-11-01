// I conti della Calcolatrice (26.10): la scientifica del geometra, con la topografia delle superiori. (31.10) È la logica in
// comune con la calcolatrice del cercapersone zero (telefono/zero/os/calcolatrice.js), che la disegna a 8 bit; l'interfaccia
// HTML di qui se n'è andata col cercapersone vecchio. Quello che sa fare:
// - CALCOLO: un'espressione scritta o col tastierino (+ − × ÷ ^ ! √, sin cos tan e inverse, log ln, π e, ANS), la virgola
//   come decimale, la moltiplicazione sottintesa (2π, 3(4+1)); gli angoli in gradi centesimali (gon, quelli della
//   topografia), sessagesimali o radianti; gli ultimi risultati da riprendere.
// - TRIANGOLI: tre dati (almeno un lato) e il resto del triangolo, con la formula usata a ogni passo: il teorema di Carnot
//   (del coseno), il teorema dei seni, la somma degli angoli, l'area con Erone e con ½·a·b·sinγ; il caso ambiguo (due lati
//   e l'angolo non compreso) dà due soluzioni quando ci sono.
// - COORDINATE: da polari a cartesiane (dal punto A, distanza e azimut → B), distanza e azimut fra due punti (con l'azimut
//   reciproco), l'area di un poligono dai vertici con la formula di Gauss. Azimut dal Nord in senso orario, come in
//   topografia: x = Est, y = Nord.
// - ANGOLI: un angolo e lo stesso in sessagesimali (° ' "), sessadecimali, centesimali e radianti.

import { ricordo, ricorda } from '../ricordi.js'

// (dal 29.10 i conti si esportano: li usa la calcolatrice di pzk os, telefono/zero/os/calcolatrice.js, con lo stesso stato)
export const MODI = { gon: ['gon', 'centesimali', 200], deg: ['deg', 'sessagesimali', 180], rad: ['rad', 'radianti', Math.PI] }

export let S = ricordo('calcolatrice', { tab: 'calcolo', modo: 'gon', expr: '', ans: 0, storia: [], tri: {}, co: {}, ang: { v: '', da: 'deg' } })
if (!Number.isFinite(S.ans)) S.ans = 0 // (un ∞ o un NaN salvati prima del 31.10: il JSON li aveva fatti null, «ans = −∞»)

// ── i numeri ──
export const aRad = (v, m = S.modo) => (v * Math.PI) / MODI[m][2]
export const daRad = (r, m = S.modo) => (r * MODI[m][2]) / Math.PI
/** Un numero all'italiana: la virgola, fino a 8 decimali significativi, la notazione scientifica per i molto grandi e piccoli. */
export function num(n, dec = 8) {
  if (!Number.isFinite(n)) return Number.isNaN(n) ? 'non definito' : n > 0 ? '∞' : '−∞'
  if (n !== 0 && (Math.abs(n) >= 1e12 || Math.abs(n) < 1e-6)) return n.toExponential(6).replace('.', ',').replace('e', ' × 10^')
  return n.toLocaleString('it-IT', { maximumFractionDigits: dec, useGrouping: Math.abs(n) >= 1e4 })
}
/** Gradi sessadecimali → «12° 34' 56,7"». */
export function dms(g) {
  const s = g < 0 ? '−' : ''
  g = Math.abs(g)
  let d = Math.floor(g), p = Math.floor((g - d) * 60), sec = Math.round(((g - d) * 60 - p) * 60 * 100) / 100
  if (sec >= 60) { sec -= 60; p++ }
  if (p >= 60) { p -= 60; d++ }
  return `${s}${d}° ${String(p).padStart(2, '0')}' ${sec.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}"`
}
export const angolo = (r) => `${num(daRad(r), 4)} ${MODI[S.modo][0]}${S.modo === 'deg' ? ` <small>(${dms(daRad(r, 'deg'))})</small>` : ''}`
export const leggiNum = (t) => { const v = Number(String(t ?? '').trim().replace(/\s/g, '').replace(',', '.')); return String(t ?? '').trim() === '' ? null : v }

// ── l'espressione: discesa ricorsiva ──
const pulito = (x) => (Math.abs(x) < 1e-12 ? 0 : x)
const FUNZ = {
  // gli zeri «quasi»: sin(200 gon) è 0, non 1,2 × 10^-16; tan(100 gon) non esiste
  sin: (x) => pulito(Math.sin(aRad(x))), cos: (x) => pulito(Math.cos(aRad(x))), tan: (x) => (Math.abs(Math.cos(aRad(x))) < 1e-12 ? NaN : pulito(Math.tan(aRad(x)))),
  asin: (x) => daRad(Math.asin(x)), acos: (x) => daRad(Math.acos(x)), atan: (x) => daRad(Math.atan(x)),
  sqrt: Math.sqrt, cbrt: Math.cbrt, log: Math.log10, ln: Math.log, abs: Math.abs, exp: Math.exp,
}
const fatt = (n) => { if (n < 0 || n % 1 || n > 170) return NaN; let r = 1; for (let i = 2; i <= n; i++) r *= i; return r }
export function calcola(testo) {
  const t = testo.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/√/g, 'sqrt').replace(/π/g, 'pi').replace(/,/g, '.').replace(/\s+/g, '').toLowerCase()
  let i = 0
  const vedi = () => t[i], prendi = (c) => (t[i] === c ? (i++, true) : false)
  const errore = (m) => { throw new Error(m) }
  function somma() { let v = prodotto(); for (;;) { if (prendi('+')) v += prodotto(); else if (prendi('-')) v -= prodotto(); else return v } }
  function prodotto() {
    let v = segno()
    for (;;) {
      if (prendi('*')) v *= segno()
      else if (prendi('/')) v /= segno()
      else if (vedi() && /[0-9.a-z(]/.test(vedi())) v *= segno() // la moltiplicazione sottintesa: 2pi, 3(4), 2sin(30)
      else return v
    }
  }
  function segno() { if (prendi('-')) return -segno(); if (prendi('+')) return segno(); return potenza() }
  function potenza() { const b = postfisso(); return prendi('^') ? b ** segno() : b }
  function postfisso() { let v = atomo(); while (prendi('!')) v = fatt(v); return v }
  function atomo() {
    if (prendi('(')) { const v = somma(); prendi(')') || errore('manca una parentesi chiusa'); return v }
    const n = /^(\d+\.?\d*|\.\d+)/.exec(t.slice(i))
    if (n) { i += n[0].length; return Number(n[0]) }
    const id = /^[a-z]+/.exec(t.slice(i))?.[0]
    if (!id) errore(vedi() ? `non capisco «${vedi()}»` : 'manca qualcosa alla fine')
    // il nome più lungo che si conosce (così «sinpi» è sin(pi))
    const nome = Object.keys({ ...FUNZ, pi: 1, e: 1, ans: 1 }).filter((k) => id.startsWith(k)).sort((a, b) => b.length - a.length)[0]
    if (!nome) errore(`non conosco «${id}»`)
    i += nome.length
    if (nome === 'pi') return Math.PI
    if (nome === 'e') return Math.E
    if (nome === 'ans') return S.ans
    return FUNZ[nome](prendi('(') ? (() => { const v = somma(); prendi(')'); return v })() : postfisso())
  }
  const v = somma()
  if (i < t.length) errore(`non capisco «${t.slice(i, i + 6)}»`)
  return v
}

// ── i triangoli: lati a b c, angoli α β γ (α opposto ad a) ──
export const LATI = ['a', 'b', 'c'], ANG = ['α', 'β', 'γ']
export function risolvi(dati) {
  const L = LATI.map((k) => leggiNum(dati[k])), G = ANG.map((k) => (leggiNum(dati[k]) === null ? null : aRad(leggiNum(dati[k]))))
  const nL = L.filter((x) => x !== null).length, nG = G.filter((x) => x !== null).length
  if (nL + nG !== 3) return { errore: nL + nG < 3 ? 'servono tre dati' : 'metti solo tre dati (gli altri li trova lei)' }
  if (!nL) return { errore: 'con tre angoli il triangolo può essere grande quanto vuoi: serve almeno un lato' }
  if (L.some((x) => x !== null && !(x > 0)) || G.some((x) => x !== null && !(x > 0))) return { errore: 'lati e angoli devono essere più di zero' }
  if (G.filter((x) => x !== null).reduce((s, x) => s + x, 0) >= Math.PI - 1e-12) return { errore: `gli angoli sommati fanno già ${num(daRad(Math.PI), 4)} ${MODI[S.modo][0]} o più` }
  const passi = []
  const carnotLato = (k) => { const [i, j] = [0, 1, 2].filter((x) => x !== k); L[k] = Math.sqrt(L[i] ** 2 + L[j] ** 2 - 2 * L[i] * L[j] * Math.cos(G[k])); passi.push(`${LATI[k]}² = ${LATI[i]}² + ${LATI[j]}² − 2·${LATI[i]}·${LATI[j]}·cos${ANG[k]} (Carnot) → ${LATI[k]} = ${num(L[k], 4)}`) }
  const carnotAng = (k) => { const [i, j] = [0, 1, 2].filter((x) => x !== k); G[k] = Math.acos(Math.max(-1, Math.min(1, (L[i] ** 2 + L[j] ** 2 - L[k] ** 2) / (2 * L[i] * L[j])))); passi.push(`cos${ANG[k]} = (${LATI[i]}² + ${LATI[j]}² − ${LATI[k]}²) / (2·${LATI[i]}·${LATI[j]}) (Carnot) → ${ANG[k]} = ${angolo(G[k])}`) }
  const terzoAng = () => { const k = G.findIndex((x) => x === null); G[k] = Math.PI - G.reduce((s, x) => s + (x ?? 0), 0); passi.push(`${ANG[k]} = ${num(daRad(Math.PI), 4)} − gli altri due (la somma degli angoli) → ${angolo(G[k])}`) }
  const seniLato = (k) => { const j = [0, 1, 2].find((x) => x !== k && L[x] !== null && G[x] !== null); L[k] = (L[j] * Math.sin(G[k])) / Math.sin(G[j]); passi.push(`${LATI[k]} / sin${ANG[k]} = ${LATI[j]} / sin${ANG[j]} (teorema dei seni) → ${LATI[k]} = ${num(L[k], 4)}`) }
  let seconda = null
  if (nL === 3) {
    const [a, b, c] = L
    if (a + b <= c || a + c <= b || b + c <= a) return { errore: 'con questi lati non si chiude: ogni lato deve essere più corto della somma degli altri due' }
    carnotAng(0); carnotAng(1); terzoAng()
  } else if (nL === 2) {
    const k = L.findIndex((x) => x === null), g = G.findIndex((x) => x !== null)
    if (g === k) { carnotLato(k); carnotAng([0, 1, 2].find((x) => x !== k && G[x] === null)); terzoAng() } // l'angolo è fra i due lati
    else {
      // due lati e l'angolo opposto a uno dei due: il caso ambiguo
      const o = [0, 1, 2].find((x) => x !== g && L[x] !== null), s = (L[o] * Math.sin(G[g])) / L[g]
      if (s > 1 + 1e-12) return { errore: `non esiste: sin${ANG[o]} verrebbe ${num(s, 4)}, più di 1` }
      passi.push(`sin${ANG[o]} = ${LATI[o]}·sin${ANG[g]} / ${LATI[g]} (teorema dei seni) = ${num(Math.min(1, s), 6)}`)
      const o1 = Math.asin(Math.min(1, s)), o2 = Math.PI - o1
      // l'altra soluzione: lo stesso lato con l'angolo opposto, e il supplementare (un lato e due angoli, coi seni)
      if (o2 + G[g] < Math.PI - 1e-9 && o2 - o1 > 1e-9) seconda = risolvi({ [LATI[g]]: dati[LATI[g]], [ANG[g]]: dati[ANG[g]], [ANG[o]]: String(daRad(o2)).replace('.', ',') })
      G[o] = o1
      passi.push(`${ANG[o]} = ${angolo(o1)}${seconda ? ` (oppure il supplementare ${angolo(o2)}: le due soluzioni sono sotto)` : ''}`)
      terzoAng(); seniLato(k)
    }
  } else {
    terzoAng()
    for (const k of [0, 1, 2]) if (L[k] === null) seniLato(k)
  }
  const [a, b, c] = L, p = (a + b + c) / 2, area = 0.5 * a * b * Math.sin(G[2])
  passi.push(`area = ½·a·b·sinγ = ${num(area, 4)} (con Erone, √(p(p−a)(p−b)(p−c)), p = ${num(p, 4)}: ${num(Math.sqrt(Math.max(0, p * (p - a) * (p - b) * (p - c))), 4)})`)
  return { L, G, area, perimetro: 2 * p, altezze: L.map((x) => (2 * area) / x), passi, seconda: seconda?.errore ? null : seconda }
}

// ── le coordinate (x Est, y Nord; azimut dal Nord in senso orario) ──
export const azimut = (dx, dy) => { let r = Math.atan2(dx, dy); if (r < 0) r += 2 * Math.PI; return r }
export function gauss(testo) {
  const p = testo.split(/\n/).map((r) => r.trim()).filter(Boolean).map((r) => r.split(/[;\t]|\s+/).filter(Boolean).map((x) => leggiNum(x)))
  if (p.length < 3) return { errore: 'almeno tre vertici, uno per riga: x ; y' }
  if (p.some((v) => v.length < 2 || v.slice(0, 2).some((x) => x === null || Number.isNaN(x)))) return { errore: 'ogni riga: x ; y (due numeri)' }
  let s = 0, per = 0
  for (let i = 0; i < p.length; i++) {
    const [x, y] = p[i], [xs, ys] = p[(i + 1) % p.length], yp = p[(i - 1 + p.length) % p.length][1]
    s += x * (ys - yp); per += Math.hypot(xs - x, ys - y)
  }
  return { area: Math.abs(s) / 2, doppia: s, per, n: p.length, verso: s > 0 ? 'antiorario' : 'orario' }
}

/** Da A, distanza e azimut → B (o null se manca un dato). c: i campi già letti (leggiNum). */
export function polari(c) {
  const ok = (...k) => k.every((x) => c[x] !== null && c[x] !== undefined && !Number.isNaN(c[x]))
  if (!ok('xa', 'ya', 'd', 'az')) return null
  const r = aRad(c.az), zero = (x) => (Math.abs(x) < 1e-9 * Math.max(1, Math.abs(c.d)) ? 0 : x), xb = c.xa + zero(c.d * Math.sin(r)), yb = c.ya + zero(c.d * Math.cos(r)) // via i residui di sin e cos
  return { xb, yb, dx: xb - c.xa, dy: yb - c.ya }
}
/** Fra due punti: Δx, Δy, la distanza, l'azimut e il reciproco (o null se manca un dato). */
export function fraDue(c) {
  const ok = (...k) => k.every((x) => c[x] !== null && c[x] !== undefined && !Number.isNaN(c[x]))
  if (!ok('x1', 'y1', 'x2', 'y2')) return null
  const dx = c.x2 - c.x1, dy = c.y2 - c.y1, az = azimut(dx, dy)
  return { dx, dy, dist: Math.hypot(dx, dy), az, reciproco: (az + Math.PI) % (2 * Math.PI) }
}
/** Un angolo scritto (un numero nella misura da, o gradi primi e secondi: 35°30'15") → { gradi, rad } o { errore } o null (vuoto). */
export function leggiAngolo(testo, da) {
  const t = String(testo ?? '').trim()
  if (!t) return null
  let gradi
  const m = /^(-?\d+(?:[.,]\d+)?)\s*°\s*(?:(\d+(?:[.,]\d+)?)\s*['′]\s*)?(?:(\d+(?:[.,]\d+)?)\s*["″])?$/.exec(t)
  if (m) gradi = (m[1].startsWith('-') ? -1 : 1) * (Math.abs(leggiNum(m[1])) + (leggiNum(m[2]) ?? 0) / 60 + (leggiNum(m[3]) ?? 0) / 3600) // (il segno dal testo: -0°30' è −0,5°, Math.sign(-0 || 1) diceva +)
  else { const v = leggiNum(t); if (v === null || Number.isNaN(v)) return { errore: 'scrivi un numero, o gradi primi e secondi: 35°30\'15"' }; gradi = daRad(aRad(v, da), 'deg') }
  return { gradi, rad: aRad(gradi, 'deg') }
}
/** L'uguale: calcola l'espressione, la mette negli ultimi, ANS prende il risultato, l'espressione si svuota. → il valore (o lancia l'errore). */
export function registra() {
  const v = calcola(S.expr)
  if (Number.isFinite(v)) S.ans = v // (1÷0, asin(2): negli ultimi sì, «= ∞», in ANS no: salvato, il JSON lo fa null)
  S.storia = [[S.expr, num(v)], ...S.storia.filter(([e]) => e !== S.expr)].slice(0, 8)
  S.expr = ''
  ricorda('calcolatrice', S)
  return v
}

// il tastierino (lo disegna la calcolatrice dello zero)
export const TASTI = [['sin', 'cos', 'tan', '^', '√'], ['asin', 'acos', 'atan', '(', ')'], ['log', 'ln', 'π', '!', 'ans'], ['7', '8', '9', '÷', 'del'], ['4', '5', '6', '×', 'ac'], ['1', '2', '3', '−', '+'], ['0', ',', 'e', '=']]
