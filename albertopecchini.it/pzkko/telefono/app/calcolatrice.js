// L'app Calcolatrice (26.10): la scientifica del geometra, con la topografia delle superiori. Quattro schede:
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

import { icona } from '../../chat/icone.js'
import { tieni, dallAlto, ricordo, ricorda } from '../ricordi.js'

const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const MODI = { gon: ['gon', 'centesimali', 200], deg: ['deg', 'sessagesimali', 180], rad: ['rad', 'radianti', Math.PI] }
const SCHEDE = [['calcolo', 'calcolo', 'quiz'], ['triangoli', 'triangoli', 'livello'], ['coordinate', 'coordinate', 'pzkkonet'], ['angoli', 'angoli', 'clessidra']]

let host = null, ctx = null
let S = ricordo('calcolatrice', { tab: 'calcolo', modo: 'gon', expr: '', ans: 0, storia: [], tri: {}, co: {}, ang: { v: '', da: 'deg' } })

// ── i numeri ──
const aRad = (v, m = S.modo) => (v * Math.PI) / MODI[m][2]
const daRad = (r, m = S.modo) => (r * MODI[m][2]) / Math.PI
/** Un numero all'italiana: la virgola, fino a 8 decimali significativi, la notazione scientifica per i molto grandi e piccoli. */
function num(n, dec = 8) {
  if (!Number.isFinite(n)) return Number.isNaN(n) ? 'non definito' : n > 0 ? '∞' : '−∞'
  if (n !== 0 && (Math.abs(n) >= 1e12 || Math.abs(n) < 1e-6)) return n.toExponential(6).replace('.', ',').replace('e', ' × 10^')
  return n.toLocaleString('it-IT', { maximumFractionDigits: dec, useGrouping: Math.abs(n) >= 1e4 })
}
/** Gradi sessadecimali → «12° 34' 56,7"». */
function dms(g) {
  const s = g < 0 ? '−' : ''
  g = Math.abs(g)
  let d = Math.floor(g), p = Math.floor((g - d) * 60), sec = Math.round(((g - d) * 60 - p) * 60 * 100) / 100
  if (sec >= 60) { sec -= 60; p++ }
  if (p >= 60) { p -= 60; d++ }
  return `${s}${d}° ${String(p).padStart(2, '0')}' ${sec.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}"`
}
const angolo = (r) => `${num(daRad(r), 4)} ${MODI[S.modo][0]}${S.modo === 'deg' ? ` <small>(${dms(daRad(r, 'deg'))})</small>` : ''}`
const leggiNum = (t) => { const v = Number(String(t ?? '').trim().replace(/\s/g, '').replace(',', '.')); return String(t ?? '').trim() === '' ? null : v }

// ── l'espressione: discesa ricorsiva ──
const pulito = (x) => (Math.abs(x) < 1e-12 ? 0 : x)
const FUNZ = {
  // gli zeri «quasi»: sin(200 gon) è 0, non 1,2 × 10^-16; tan(100 gon) non esiste
  sin: (x) => pulito(Math.sin(aRad(x))), cos: (x) => pulito(Math.cos(aRad(x))), tan: (x) => (Math.abs(Math.cos(aRad(x))) < 1e-12 ? NaN : pulito(Math.tan(aRad(x)))),
  asin: (x) => daRad(Math.asin(x)), acos: (x) => daRad(Math.acos(x)), atan: (x) => daRad(Math.atan(x)),
  sqrt: Math.sqrt, cbrt: Math.cbrt, log: Math.log10, ln: Math.log, abs: Math.abs, exp: Math.exp,
}
const fatt = (n) => { if (n < 0 || n % 1 || n > 170) return NaN; let r = 1; for (let i = 2; i <= n; i++) r *= i; return r }
function calcola(testo) {
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
const LATI = ['a', 'b', 'c'], ANG = ['α', 'β', 'γ']
function risolvi(dati) {
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
const azimut = (dx, dy) => { let r = Math.atan2(dx, dy); if (r < 0) r += 2 * Math.PI; return r }
function gauss(testo) {
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

// ── le schede ──
const campo = (gruppo, k, etichetta, v) => `<label class="t-ca-campo"><span>${etichetta.replace(/[αβγ]/g, '<i><label class="t-ca-campo"><span>${etichetta}</span></i>')}</span><input data-g="${gruppo}" data-k="${k}" inputmode="decimal" autocomplete="off" value="${esc(v ?? '')}"></label>`
const modi = () => `<div class="t-za-filtri t-ca-modi">${Object.entries(MODI).map(([k, [s]]) => `<button type="button" data-modo="${k}" class="${S.modo === k ? 'on' : ''}">${s}</button>`).join('')}</div>`

const TASTI = [['sin', 'cos', 'tan', '^', '√'], ['asin', 'acos', 'atan', '(', ')'], ['log', 'ln', 'π', '!', 'ans'], ['7', '8', '9', '÷', 'del'], ['4', '5', '6', '×', 'ac'], ['1', '2', '3', '−', '+'], ['0', ',', 'e', '=']]
function calcolo() {
  return `${modi()}
    <div class="t-ca-calc"><div>
    <div class="t-ca-schermo"><input class="t-ca-expr" data-g="expr" autocomplete="off" spellcheck="false" placeholder="es. 2·sin(50)+√3" value="${esc(S.expr)}"><output class="t-ca-ris"></output></div>
    ${S.storia.length ? `<h4 class="t-sh-sez">gli ultimi</h4><div class="t-ca-storia">${S.storia.map(([e, r], i) => `<button type="button" data-storia="${i}"><span>${esc(e)}</span><b>= ${esc(r)}</b></button>`).join('')}</div>` : ''}</div>
    <div class="t-ca-tasti">${TASTI.flat().map((k) => `<button type="button" data-tasto="${k}" class="${/^[0-9,]$/.test(k) ? 'n' : k === '=' ? 'uguale' : /^(del|ac)$/.test(k) ? 'rosso' : ''}">${k === 'ans' ? 'ANS' : k === 'del' ? 'DEL' : k === 'ac' ? 'AC' : k}</button>`).join('')}</div></div>`
}
function triangoli() {
  return `${modi()}
    <div class="t-ca-tri">
      <svg viewBox="0 0 200 130" aria-hidden="true"><path d="M20 115 L180 115 L120 18 Z" fill="rgba(70,255,125,.08)" stroke="#46ff7d" stroke-width="2.5"/>
        <g fill="#cfdccb" font-family="monospace" font-size="15"><text x="96" y="128">c</text><text x="156" y="64">a</text><text x="58" y="62">b</text></g>
        <g fill="#ffd400" font-family="monospace" font-size="14"><text x="30" y="108">α</text><text x="160" y="108">β</text><text x="114" y="40">γ</text></g></svg>
      <div class="t-ca-dati">${LATI.map((k) => campo('tri', k, `lato ${k}`, S.tri[k])).join('')}${ANG.map((k) => campo('tri', k, `angolo ${k} (${MODI[S.modo][0]})`, S.tri[k])).join('')}</div>
    </div>
    <div class="t-ca-azioni"><button class="c-b nero" type="button" data-svuota="tri">svuota</button></div>
    <div class="t-ca-out" data-out="tri"></div>`
}
function coordinate() {
  const c = S.co
  return `${modi()}
    <section class="t-pf-sez"><h4>${icona('pzkkonet')}da A, distanza e azimut → B</h4><div class="t-ca-dati">${campo('co', 'xa', 'x A (Est)', c.xa)}${campo('co', 'ya', 'y A (Nord)', c.ya)}${campo('co', 'd', 'distanza', c.d)}${campo('co', 'az', `azimut (${MODI[S.modo][0]})`, c.az)}</div><div class="t-ca-out" data-out="polari"></div></section>
    <section class="t-pf-sez"><h4>${icona('livello')}fra due punti: distanza e azimut</h4><div class="t-ca-dati">${campo('co', 'x1', 'x A', c.x1)}${campo('co', 'y1', 'y A', c.y1)}${campo('co', 'x2', 'x B', c.x2)}${campo('co', 'y2', 'y B', c.y2)}</div><div class="t-ca-out" data-out="punti"></div></section>
    <section class="t-pf-sez"><h4>${icona('trofeo')}area con Gauss (un vertice per riga: x ; y)</h4><textarea class="t-ca-gauss" data-g="co" data-k="vertici" rows="5" placeholder="0 ; 0\n40 ; 0\n40 ; 25\n0 ; 30">${esc(c.vertici ?? '')}</textarea><div class="t-ca-out" data-out="gauss"></div></section>`
}
function angoli() {
  return `<div class="t-ca-dati">${campo('ang', 'v', 'angolo (es. 35,5 · 35°30\'15" · 0,62)', S.ang.v)}</div>
    <div class="t-za-filtri">${[['deg', 'sessagesimali'], ['gon', 'centesimali'], ['rad', 'radianti']].map(([k, n]) => `<button type="button" data-angda="${k}" class="${S.ang.da === k ? 'on' : ''}">da ${n}</button>`).join('')}</div>
    <div class="t-ca-out" data-out="ang"></div>`
}

// ── i risultati (si rifanno a ogni tasto, senza ridisegnare i campi) ──
const riga = (t, v) => `<div class="t-ca-r"><span>${t}</span><b>${v}</b></div>`
function risultati() {
  const out = (k) => host.querySelector(`[data-out="${k}"]`)
  if (S.tab === 'calcolo') {
    const o = host.querySelector('.t-ca-ris')
    if (!o) return
    if (!S.expr.trim()) { o.textContent = `ans = ${num(S.ans)}`; o.className = 't-ca-ris vuoto'; return }
    try { o.textContent = `= ${num(calcola(S.expr))}`; o.className = 't-ca-ris' } catch (e) { o.textContent = e.message; o.className = 't-ca-ris err' }
  } else if (S.tab === 'triangoli') {
    const r = risolvi(S.tri), soluzione = (x, n) => `${n ? `<h4 class="t-sh-sez">seconda soluzione</h4>` : ''}<div class="t-ca-griglia">${LATI.map((k, i) => riga(`lato ${k}`, num(x.L[i], 4))).join('')}${ANG.map((k, i) => riga(`angolo ${k}`, angolo(x.G[i]))).join('')}${riga('area', num(x.area, 4))}${riga('perimetro', num(x.perimetro, 4))}${x.altezze.map((h, i) => riga(`altezza su ${LATI[i]}`, num(h, 4))).join('')}</div><ol class="t-ca-passi">${x.passi.map((p) => `<li>${p}</li>`).join('')}</ol>`
    out('tri').innerHTML = r.errore ? `<p class="t-cv-err">${esc(r.errore)}</p>` : soluzione(r, 0) + (r.seconda ? soluzione(r.seconda, 1) : '')
  } else if (S.tab === 'coordinate') {
    const c = Object.fromEntries(Object.entries(S.co).map(([k, v]) => [k, leggiNum(v)]))
    const tutti = (...k) => k.every((x) => c[x] !== null && c[x] !== undefined && !Number.isNaN(c[x]))
    if (tutti('xa', 'ya', 'd', 'az')) {
      const r = aRad(c.az), zero = (x) => (Math.abs(x) < 1e-9 * Math.max(1, Math.abs(c.d)) ? 0 : x), xb = c.xa + zero(c.d * Math.sin(r)), yb = c.ya + zero(c.d * Math.cos(r)) // via i residui di sin e cos
      out('polari').innerHTML = `<div class="t-ca-griglia">${riga('x B', num(xb, 4))}${riga('y B', num(yb, 4))}${riga('Δx = d·sin(θ)', num(xb - c.xa, 4))}${riga('Δy = d·cos(θ)', num(yb - c.ya, 4))}</div>`
    } else out('polari').innerHTML = ''
    if (tutti('x1', 'y1', 'x2', 'y2')) {
      const dx = c.x2 - c.x1, dy = c.y2 - c.y1, az = azimut(dx, dy)
      out('punti').innerHTML = `<div class="t-ca-griglia">${riga('Δx', num(dx, 4))}${riga('Δy', num(dy, 4))}${riga('distanza AB = √(Δx² + Δy²)', num(Math.hypot(dx, dy), 4))}${riga('azimut (AB) = atan(Δx/Δy), nel quadrante giusto', angolo(az))}${riga('azimut reciproco (BA) = (AB) ± ' + num(daRad(Math.PI), 4), angolo((az + Math.PI) % (2 * Math.PI)))}</div>`
    } else out('punti').innerHTML = ''
    const g = S.co.vertici?.trim() ? gauss(S.co.vertici) : null
    out('gauss').innerHTML = !g ? '' : g.errore ? `<p class="t-cv-err">${esc(g.errore)}</p>` : `<div class="t-ca-griglia">${riga('area', num(g.area, 4))}${riga('2A = Σ xᵢ·(yᵢ₊₁ − yᵢ₋₁)', num(g.doppia, 4))}${riga('perimetro', num(g.per, 4))}${riga('vertici', `${g.n}, in senso ${g.verso}`)}</div>`
  } else {
    const t = String(S.ang.v ?? '').trim()
    if (!t) { out('ang').innerHTML = ''; return }
    let gradi
    const m = /^(-?\d+(?:[.,]\d+)?)\s*°\s*(?:(\d+(?:[.,]\d+)?)\s*['′]\s*)?(?:(\d+(?:[.,]\d+)?)\s*["″])?$/.exec(t)
    if (m) gradi = Math.sign(leggiNum(m[1]) || 1) * (Math.abs(leggiNum(m[1])) + (leggiNum(m[2]) ?? 0) / 60 + (leggiNum(m[3]) ?? 0) / 3600)
    else { const v = leggiNum(t); if (v === null || Number.isNaN(v)) { out('ang').innerHTML = '<p class="t-cv-err">scrivi un numero, o gradi primi e secondi: 35°30\'15"</p>'; return } gradi = daRad(aRad(v, S.ang.da), 'deg') }
    const r = aRad(gradi, 'deg')
    out('ang').innerHTML = `<div class="t-ca-griglia">${riga('sessagesimali', dms(gradi))}${riga('sessadecimali', `${num(gradi, 8)}°`)}${riga('centesimali', `${num(daRad(r, 'gon'), 8)} gon`)}${riga('radianti', `${num(r, 10)} rad`)}</div>`
  }
}

function disegna() {
  ricorda('calcolatrice', S)
  host.innerHTML = `${ctx.testata('Calcolatrice')}
    <nav class="t-gi-tab" role="tablist">${SCHEDE.map(([id, n, i]) => `<button type="button" role="tab" aria-selected="${S.tab === id}" class="${S.tab === id ? 'on' : ''}" data-tab="${id}">${icona(i)}<span>${n}</span></button>`).join('')}</nav>
    <div class="t-corpo-app t-ca">${{ calcolo, triangoli, coordinate, angoli }[S.tab]()}</div>`
  risultati()
}

function uguale() {
  if (!S.expr.trim()) return
  try {
    const v = calcola(S.expr)
    S.ans = v
    S.storia = [[S.expr, num(v)], ...S.storia.filter(([e]) => e !== S.expr)].slice(0, 8)
    S.expr = ''
    disegna()
  } catch (e) { ctx.toast(esc(e.message), { icona: 'no' }) }
}
function tasto(k) {
  const i = host.querySelector('.t-ca-expr')
  if (k === '=') return uguale()
  if (k === 'ac') S.expr = ''
  else if (k === 'del') S.expr = S.expr.slice(0, -1)
  else S.expr += /^(sin|cos|tan|asin|acos|atan|log|ln|√)$/.test(k) ? `${k}(` : k === 'ans' ? 'ans' : k
  if (i) i.value = S.expr
  ricorda('calcolatrice', S)
  risultati()
}

function clic(e) {
  const t = e.target.closest('[data-tab]'), m = e.target.closest('[data-modo]'), k = e.target.closest('[data-tasto]'), s = e.target.closest('[data-storia]')
  if (t) { if (S.tab !== t.dataset.tab) { S.tab = t.dataset.tab; dallAlto(host); disegna() } return }
  if (m) { S.modo = m.dataset.modo; return disegna() }
  if (k) return tasto(k.dataset.tasto)
  if (s) { S.expr = S.storia[Number(s.dataset.storia)][0]; return disegna() }
  const v = e.target.closest('[data-svuota]')
  if (v) { S[v.dataset.svuota] = {}; return disegna() }
  const a = e.target.closest('[data-angda]')
  if (a) { S.ang.da = a.dataset.angda; return disegna() }
}
function scrivi(e) {
  const x = e.target
  if (x.dataset.g === 'expr') S.expr = x.value
  else if (x.dataset.g) S[x.dataset.g][x.dataset.k] = x.value
  else return
  ricorda('calcolatrice', S)
  risultati()
}

export function monta(h, c) {
  host = h; ctx = c
  tieni(host, 'calcolatrice')
  host.addEventListener('click', clic)
  host.addEventListener('input', scrivi)
  host.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('.t-ca-expr')) { e.preventDefault(); uguale() } })
  disegna()
  return { mostra: () => risultati() }
}
