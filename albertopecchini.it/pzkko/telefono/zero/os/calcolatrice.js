// L'app «calcoli» di pzk os (29.10, Alberto: «crea uno alla volta … calcoli …»): la scientifica del geometra sul cercapersone
// zero. I conti e lo stato sono quelli della calcolatrice vecchia (telefono/app/calcolatrice.js: calcola, registra, risolvi,
// polari, fraDue, gauss, leggiAngolo, num, dms, angolo, MODI, TASTI, e S, ricordato in telefono/ricordi.js): sono la stessa
// calcolatrice, con due facce. Quattro pagine (← →):
// - IL CALCOLO: l'espressione e il risultato che si vede mentre scrivi, gli angoli in gon, gradi o radianti (◀ ▶), gli
//   ultimi risultati (OK lo riprende). OK sull'espressione apre il tastierino, i 34 tasti della vecchia (sin cos tan e
//   inverse, log ln, π e, ^ √ !, ANS, DEL, AC, =); si scrive anche dalla tastiera vera, Invio è l'uguale.
// - I TRIANGOLI: tre dati fra lati e angoli (os.numero), a destra il triangolo vero quando si chiude, col pezzo scelto
//   segnato; OK sul risultato apre lati, angoli, area, perimetro, altezze e i passaggi (Carnot, i seni, Erone), con la
//   seconda soluzione del caso ambiguo.
// - LE COORDINATE: da A con distanza e azimut a B, fra due punti la distanza e gli azimut, l'area di Gauss dai vertici.
// - GLI ANGOLI: un angolo (anche in gradi primi e secondi) in sessagesimali, sessadecimali, centesimali e radianti, col
//   goniometro che lo disegna.
// Le regole: os/REGOLE.md.
import { Lcd, W, H } from './lcd.js'
import * as icone from './icone.js'
import { S, MODI, TASTI, LATI, ANG, num, dms, angolo, daRad, aRad, leggiNum, calcola, registra, risolvi, polari, fraDue, gauss, leggiAngolo } from '../../app/calcolatrice.js'
import { ricorda } from '../../ricordi.js'
import { txt, corto, destra, centro, pagine, impagina, scorrevole, senzaHtml, testata, striscia } from './pezzi.js'

const salva = () => ricorda('calcolatrice', S)
const MODO = Object.keys(MODI) // gon, deg, rad
const giraModo = (d) => { S.modo = MODO[(MODO.indexOf(S.modo) + d + MODO.length) % MODO.length]; salva() }
const ang = (r) => txt(senzaHtml(angolo(r)))
const ETI = { ans: 'ANS', del: 'DEL', ac: 'AC' }
const AMMESSI = /^[0-9a-zA-Z+\-*/^().,!×÷−√π ]$/
/** L'espressione con le funzioni e le costanti come le vuole il tasto (sin → «sin(»). */
const premi = (k) => {
  if (k === 'ac') S.expr = ''
  else if (k === 'del') S.expr = S.expr.slice(0, -1)
  else S.expr += /^(sin|cos|tan|asin|acos|atan|log|ln|√)$/.test(k) ? `${k}(` : k
  salva()
}
/** Il risultato di adesso: { v } o { errore } o null (vuota). */
const prova = () => { if (!S.expr.trim()) return null; try { return { v: calcola(S.expr) } } catch (e) { return { errore: e.message } } }
/** Una riga a scelta che si sposta saltando quelle che non si scelgono. */
function passo(R, sel, d) { for (let i = 1; i <= R.length; i++) { const k = (sel + d * i + R.length * 2) % R.length; if (R[k].scegli !== false) return k } return sel }
/** Una riga «nome ……… valore» (i puntini), rovesciata se è la scelta; con gira, il valore fra ◀ ▶ sulla riga scelta. */
function riga(l, zona, { x0 = 10, x1 = 245, y, nome, val = '', on = false, gira = null, titolo = false, premi: clic = null }) {
  const o = { inv: on }
  if (titolo) { l.testo(x0, y + 1, nome); for (let x = x0 + Lcd.larghezza(nome) + 4; x < x1; x += 2) l.px(x, y + 5); return }
  if (on) l.riempi(x0 - 2, y, x1 - x0 + 4, 9)
  const v = gira && on ? `◀ ${val} ▶` : val
  const vw = Lcd.larghezza(v), n = Math.max(1, Math.floor((x1 - x0 - vw - 6) / 6))
  l.testo(x0, y + 1, corto(nome, n), o)
  if (v) destra(l, x1, y + 1, v, o)
  if (clic) zona(x0 - 2, y, x1 - x0 + 4, 9, clic)
  if (gira && on) { zona(x1 - vw - 2, y - 1, 10, 11, () => gira(-1)); zona(x1 - 8, y - 1, 10, 11, () => gira(1)) }
}

// ── il tastierino ──
function tastierino(os, x) {
  let r = 6, c = 0, lampo = 0, errore = null
  const fila = (i) => TASTI[i]
  function premiTasto(k) {
    errore = null
    if (k === '=') {
      if (!S.expr.trim()) return
      try { registra(); lampo = 6 } catch (e) { errore = e.message; os.suoni.bip('pagerGiu') }
      return
    }
    premi(k)
  }
  const v = {
    nome: 'calcolatrice-tasti', app: 'calcolatrice',
    tic() { if (lampo > 0) { lampo--; os.ridisegna() } }, // (spinta con os.spingi: os non legge cosa torna tic. Il cursore lampeggia da sé, os ridisegna ogni mezzo secondo)
    disegna(l, t) {
      // l'espressione e il risultato (dopo l'uguale: ANS, rovesciato per un attimo)
      l.cornice(os.MARGINE, 14, W - 2 * os.MARGINE, 12)
      const e = [...txt(S.expr)], vis = e.length > 37 ? '…' + e.slice(-36).join('') : e.join('')
      l.testo(os.MARGINE + 3, 16, vis)
      if (t % 10 < 5) l.riempi(os.MARGINE + 4 + Lcd.larghezza(vis), 15, 4, 9)
      const p = prova(), ris = errore ? `! ${errore}` : !p ? `ans = ${num(S.ans)}` : p.errore ? '…' : `= ${num(p.v)}`
      const s = corto(txt(ris), 39)
      if (lampo > 0 && lampo % 2) { l.riempi(W - os.MARGINE - Lcd.larghezza(s) - 4, 27, Lcd.larghezza(s) + 4, 9); destra(l, W - os.MARGINE - 2, 28, s, { inv: true }) }
      else destra(l, W - os.MARGINE - 2, 28, s)
      // i tasti: 5 per fila, l'ultima fila ne ha 4 (lo = largo il doppio)
      TASTI.forEach((f, i) => {
        const TX = 48, y = 37 + i * 11
        let xx = 8
        f.forEach((k, j) => {
          const w = i === 6 && k === '=' ? TX * 2 - 2 : TX - 2, on = i === r && j === c, eti = txt(ETI[k] ?? k)
          if (on) l.riempi(xx, y, w, 11); else l.riquadro(xx, y, w, 11)
          l.testo(xx + Math.round((w - Lcd.larghezza(eti)) / 2), y + 2, eti, { inv: on })
          os.zona(xx, y, w, 11, () => { r = i; c = j; premiTasto(k) })
          xx += w + 2
        })
      })
      centro(l, H - 9, 'OK preme · INDIETRO torna')
    },
    tasto(n) {
      if (n === 'su') { r = (r + 6) % 7; c = Math.min(c, fila(r).length - 1) }
      else if (n === 'giu') { r = (r + 1) % 7; c = Math.min(c, fila(r).length - 1) }
      else if (n === 'sx') c = (c + fila(r).length - 1) % fila(r).length
      else if (n === 'dx') c = (c + 1) % fila(r).length
      else if (n === 'ok') premiTasto(fila(r)[c])
      else if (n === 'indietro') os.togli()
      else return false
      return true
    },
    carattere(ch) { if (AMMESSI.test(ch)) { errore = null; S.expr += ch === '*' ? '×' : ch === '/' ? '÷' : ch; salva() } },
    cancella() { S.expr = S.expr.slice(0, -1); salva() },
    scrivendo: () => S.expr.length > 0,
    invio() { premiTasto('=') },
  }
  return v
}

// ── un risultato lungo (i triangoli): righe che scorrono ──
function lettura(os, titolo, icona, righe) {
  let giu = 0
  return {
    nome: 'calcolatrice-lettura', app: 'calcolatrice',
    disegna(l) {
      testata(l, os, { icona, nome: titolo, n: 1 })
      scorrevole(l, righe, { y0: 34, vis: 9, giu }) // (giu lo tiene giusto tasto: disegna non cambia lo stato)
      centro(l, H - 9, righe.length > 9 ? '↑↓ legge · OK torna' : 'OK torna')
    },
    tasto(k) {
      if (k === 'su') giu = Math.max(0, giu - 1)
      else if (k === 'giu') giu = Math.min(giu + 1, Math.max(0, righe.length - 9))
      else if (k === 'ok' || k === 'indietro') os.togli()
      else return k === 'sx' || k === 'dx'
      return true
    },
  }
}

// ── i vertici di Gauss: «x ; y» per riga, come la vecchia ──
const vertici = () => String(S.co.vertici ?? '').split('\n').map((r) => r.trim()).filter(Boolean)
function vistaVertici(os) {
  let sel = 0
  const R = () => [...vertici().map((v, i) => ({ nome: `vertice ${i + 1}`, val: v.replace(/\s*;\s*/, ' ; '), i })), { nome: '+ aggiungi un vertice', nuovo: true }, ...(vertici().length ? [{ nome: 'togli l’ultimo', togli: true }] : [])]
  async function fai(x) {
    if (x.togli) { S.co.vertici = vertici().slice(0, -1).join('\n'); salva(); sel = Math.min(sel, R().length - 1); return }
    const [vx = '', vy = ''] = x.nuovo ? [] : vertici()[x.i].split(/\s*;\s*/)
    const a = await os.numero({ titolo: `x (Est) del vertice ${x.nuovo ? vertici().length + 1 : x.i + 1}`, testo: vx })
    if (a === null || os.corrente() !== v) return // (INDIETRO dà null; e l'utente può essere già uscito)
    const b = await os.numero({ titolo: `y (Nord) del vertice ${x.nuovo ? vertici().length + 1 : x.i + 1}`, testo: vy })
    if (b === null || os.corrente() !== v) return
    const L = vertici()
    if (x.nuovo) L.push(`${a} ; ${b}`); else L[x.i] = `${a} ; ${b}`
    S.co.vertici = L.join('\n'); salva()
  }
  const v = {
    nome: 'calcolatrice-vertici', app: 'calcolatrice',
    disegna(l) {
      testata(l, os, { icona: 'bussola', nome: 'i vertici di Gauss', n: 1 })
      const L = R(), VIS = 9, da = Math.max(0, Math.min(sel - VIS + 1, L.length - VIS)), dd = Math.max(0, Math.min(da, sel))
      L.slice(dd, dd + VIS).forEach((x, i) => riga(l, os.zona, { y: 34 + i * 9, nome: x.nome, val: x.val ?? '', on: dd + i === sel, premi: () => { sel = dd + i; fai(x) } }))
      centro(l, H - 9, 'OK cambia · ↑↓ sceglie · INDIETRO torna')
    },
    tasto(k) {
      const L = R()
      if (k === 'su') sel = (sel - 1 + L.length) % L.length
      else if (k === 'giu') sel = (sel + 1) % L.length
      else if (k === 'ok') fai(L[sel])
      else if (k === 'indietro') os.togli()
      else return k === 'sx' || k === 'dx'
      return true
    },
  }
  return v
}

/** Il triangolo a destra: quello vero se si chiude (L, G), se no uno qualunque; il pezzo scelto (a b c α β γ) segnato. */
function disegnaTriangolo(l, x0, y0, w, h, r, scelto) {
  let A = [0, 0], B = [1, 0], C = [0.62, 0.78]
  if (r && !r.errore) { const [, b, c] = r.L; A = [0, 0]; B = [c, 0]; C = [b * Math.cos(r.G[0]), b * Math.sin(r.G[0])] }
  const xs = [A[0], B[0], C[0]], ys = [A[1], B[1], C[1]], mx = Math.min(...xs), Mx = Math.max(...xs), my = Math.min(...ys), My = Math.max(...ys)
  const k = Math.min((w - 16) / Math.max(1e-9, Mx - mx), (h - 18) / Math.max(1e-9, My - my))
  const P = (p) => [Math.round(x0 + 8 + (p[0] - mx) * k + ((w - 16) - (Mx - mx) * k) / 2), Math.round(y0 + h - 9 - (p[1] - my) * k)]
  const [pa, pb, pc] = [P(A), P(B), P(C)]
  const lato = (p, q, grosso) => { linea(l, p[0], p[1], q[0], q[1]); if (grosso) { linea(l, p[0], p[1] - 1, q[0], q[1] - 1); linea(l, p[0] + 1, p[1], q[0] + 1, q[1]) } }
  lato(pb, pc, scelto === 'a'); lato(pc, pa, scelto === 'b'); lato(pa, pb, scelto === 'c')
  const metti = (s, p, on) => { const xx = Math.max(x0, Math.min(x0 + w - 6, p[0] - 2)), yy = Math.max(y0, Math.min(y0 + h - 8, p[1] - 3)); if (on) { l.riempi(xx - 1, yy - 1, 7, 9); l.testo(xx, yy, s, { inv: true }) } else { l.riempi(xx - 1, yy - 1, 7, 9, 0); l.testo(xx, yy, s) } }
  const m = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], cen = [(pa[0] + pb[0] + pc[0]) / 3, (pa[1] + pb[1] + pc[1]) / 3]
  const fuori = (p, d) => { const dx = p[0] - cen[0], dy = p[1] - cen[1], n = Math.hypot(dx, dy) || 1; return [p[0] + (dx / n) * d, p[1] + (dy / n) * d] }
  const dentro = (p, d) => { const dx = cen[0] - p[0], dy = cen[1] - p[1], n = Math.hypot(dx, dy) || 1; return [p[0] + (dx / n) * d, p[1] + (dy / n) * d] }
  metti('a', fuori(m(pb, pc), 6), scelto === 'a'); metti('b', fuori(m(pc, pa), 6), scelto === 'b'); metti('c', fuori(m(pa, pb), 6), scelto === 'c')
  metti('α', dentro(pa, 9), scelto === 'α'); metti('β', dentro(pb, 9), scelto === 'β'); metti('γ', dentro(pc, 9), scelto === 'γ')
}
function linea(l, x0, y0, x1, y1) {
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1
  let e = dx + dy
  for (let i = 0; i < 2000; i++) { l.px(x0, y0); if (x0 === x1 && y0 === y1) return; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx } if (e2 <= dx) { e += dx; y0 += sy } }
}

export function vista(os) {
  let selC = 0, selT = 1, selK = 2, selA = 1 // (selK: la prima riga che si sceglie, x A; la 1 è un titolo)
  const numero = async (titolo, testo, gradi = false) => { const s = await os.numero({ titolo, testo: testo ?? '', gradi }); return s === null ? null : s.trim() }

  // ── il calcolo ──
  const righeCalc = () => [{ k: 'expr' }, { k: 'modo' }, ...S.storia.slice(0, 4).map((s, i) => ({ k: 'storia', s, i }))]
  const calcolo = {
    nome: 'il calcolo', icona: 'app-calcolatrice',
    aiuto: () => ({ expr: 'OK il tastierino · ←→ pagine', modo: '←→ cambia · ↑↓ righe', storia: 'OK la riprendi · ↑↓ righe' })[righeCalc()[selC]?.k] ?? '←→ pagine',
    tic(t) { return selC === 0 && t % 5 === 0 }, // (il cursore che lampeggia)
    disegna(l, x, t) {
      const R = righeCalc(), sc = selC < R.length ? selC : 0 // (una copia: disegna non cambia lo stato)
      // l'espressione: un campo (doppio se è la scelta), col cursore
      const on0 = sc === 0
      l.cornice(8, 34, W - 16, 13); if (on0) l.riquadro(9, 35, W - 18, 11)
      const e = [...txt(S.expr)], vis = e.length > 37 ? '…' + e.slice(-36).join('') : e.join('')
      if (vis) l.testo(12, 37, vis); else l.testo(18, 37, 'scrivi, o OK per i tasti')
      if (on0 && t % 10 < 5) l.riempi(vis ? 13 + Lcd.larghezza(vis) : 12, 36, 4, 9)
      x.zona(8, 34, W - 16, 13, () => { selC = 0; os.spingi(tastierino(os, x)) })
      // il risultato mentre scrivi: grande, o l'errore, o ANS
      const p = prova()
      if (!p) destra(l, 245, 52, corto(`ans = ${txt(num(S.ans))}`, 38))
      else if (p.errore) destra(l, 245, 52, corto(`! ${txt(p.errore)}`, 38))
      else { const s = `= ${txt(num(p.v))}`, sc = Lcd.larghezza(s, 2) <= 235 ? 2 : 1; destra(l, 245, sc === 2 ? 50 : 52, corto(s, 38), { scala: sc }) }
      riga(l, x.zona, { y: 66, nome: 'angoli in', val: `${MODI[S.modo][0]} (${MODI[S.modo][1]})`, on: sc === 1, gira: giraModo, premi: () => { selC = 1 } })
      if (!S.storia.length) { l.testo(10, 80, 'gli ultimi risultati vengono qui'); return }
      S.storia.slice(0, 4).forEach(([ex, r], i) => {
        const y = 77 + i * 9, on = sc === 2 + i, vv = `= ${txt(r)}`
        riga(l, x.zona, { y, nome: txt(ex), val: vv, on, premi: () => { selC = 2 + i; riprendi(i) } })
      })
    },
    tasto(k, x) {
      const R = righeCalc()
      if (selC >= R.length) selC = 0
      if (k === 'su' || k === 'giu') { selC = (selC + (k === 'su' ? -1 : 1) + R.length) % R.length; return true }
      if ((k === 'sx' || k === 'dx') && R[selC]?.k === 'modo') { giraModo(k === 'sx' ? -1 : 1); return true }
      if (k === 'ok') { const r = R[selC]; if (r?.k === 'storia') riprendi(r.i); else if (r?.k === 'expr') os.spingi(tastierino(os, x)); return true }
      return false
    },
    // (la tastiera vera: chi scrive va al tastierino con quello che ha scritto, e lì Invio è l'uguale; qui Invio è OK)
    carattere(ch, x) { if (AMMESSI.test(ch)) { selC = 0; S.expr += ch === '*' ? '×' : ch === '/' ? '÷' : ch; salva(); os.spingi(tastierino(os, x)) } },
    cancella() { S.expr = S.expr.slice(0, -1); salva() },
    scrivendo: () => selC === 0 && S.expr.length > 0, // (Backspace sull'espressione cancella, non esce dall'app)
    invio(x) { calcolo.tasto('ok', x) },
  }
  function riprendi(i) { const s = S.storia[i]; if (!s) return; S.expr = s[0]; salva(); selC = 0 }

  // ── i triangoli ──
  const righeTri = () => [
    { k: 'modo', nome: 'angoli in', val: MODI[S.modo][0], gira: giraModo },
    ...LATI.map((k) => ({ k, nome: `lato ${k}`, val: S.tri[k] ?? '', dato: true })),
    ...ANG.map((k) => ({ k, nome: `angolo ${k}`, val: S.tri[k] ?? '', dato: true })),
    { k: 'svuota', nome: 'svuota i dati' },
    { k: 'ris', nome: 'risultato' },
  ]
  async function datoTri(r, x) {
    if (r.k === 'svuota') { // (non si disfa: prima si chiede)
      if (!Object.keys(S.tri).length) return x.dì(true, 'non c’è niente da svuotare')
      const ok = await os.dialogo({ titolo: 'svuoto?', testo: 'tolgo i lati e gli angoli scritti: il triangolo riparte da zero.', icona: 'triangolo', tasti: ['no', 'svuota'] })
      if (ok !== 'svuota' || !x.qui()) return // (INDIETRO dà null; e l'utente può essere già uscito)
      S.tri = {}; salva(); x.dì(true, 'dati svuotati'); return
    }
    if (r.k === 'ris') return apriRisultato(x)
    if (!r.dato) return
    const s = await numero(`${r.nome}${ANG.includes(r.k) ? ` (in ${MODI[S.modo][0]})` : ''}`, S.tri[r.k])
    if (s === null || !x.qui()) return
    if (s) S.tri[r.k] = s; else delete S.tri[r.k]
    salva()
  }
  function apriRisultato(x) {
    const r = risolvi(S.tri)
    if (r.errore) return x.dì(false, r.errore)
    const blocchi = (q, n) => [
      { titolo: n ? 'la seconda soluzione' : 'il triangolo' },
      ...LATI.map((k, i) => ({ testo: `lato ${k} = ${num(q.L[i], 4)}` })),
      ...ANG.map((k, i) => ({ testo: `angolo ${k} = ${ang(q.G[i])}` })),
      { testo: `area = ${num(q.area, 4)}` }, { testo: `perimetro = ${num(q.perimetro, 4)}` },
      ...q.altezze.map((h, i) => ({ testo: `altezza su ${LATI[i]} = ${num(h, 4)}` })),
      { titolo: 'come' }, ...q.passi.map((p, i) => ({ passo: i + 1, testo: senzaHtml(p) })),
    ]
    os.spingi(lettura(os, 'il triangolo risolto', 'triangolo', impagina([...blocchi(r, 0), ...(r.seconda ? blocchi(r.seconda, 1) : [])])))
  }
  const triangoli = {
    nome: 'i triangoli', icona: 'triangolo',
    aiuto: () => { const r = righeTri()[selT]; return r.gira ? '←→ cambia · ↑↓ righe' : r.k === 'ris' ? 'OK lo apri · ↑↓ righe' : r.k === 'svuota' ? 'OK svuota · ↑↓ righe' : 'OK scrivi · ↑↓ righe' },
    disegna(l, x) {
      const R = righeTri(), r = risolvi(S.tri)
      R.forEach((q, i) => {
        const val = q.k === 'ris' ? (r.errore ? (Object.keys(S.tri).length ? '!' : '') : `area ${num(r.area, 2)}`) : q.val
        riga(l, x.zona, { x1: 140, y: 34 + i * 9, nome: q.nome, val: txt(val), on: i === selT, gira: q.gira, premi: () => { selT = i; if (!q.gira) datoTri(q, x) } })
      })
      // il triangolo vero (o uno qualunque), e sotto cosa manca: l'errore lungo prende posto al triangolo (fino a 6 righe, poi «…»)
      const sotto = r.errore ? (Object.keys(S.tri).length ? r.errore : 'tre dati, almeno un lato') : r.seconda ? 'ci sono due soluzioni' : 'si chiude'
      const tutte = Lcd.acapo(txt(sotto), 15), T = tutte.slice(0, 6), yt = 118 - Math.max(2, T.length) * 8
      if (tutte.length > 6) T[5] = corto(T[5] + '…', 15)
      disegnaTriangolo(l, 150, 34, 95, yt - 36, r, R[selT]?.dato ? R[selT].k : null)
      T.forEach((s, i) => l.testo(152, yt + i * 8, s))
    },
    tasto(k, x) {
      const R = righeTri()
      if (k === 'su' || k === 'giu') { selT = (selT + (k === 'su' ? -1 : 1) + R.length) % R.length; return true }
      if ((k === 'sx' || k === 'dx') && R[selT].gira) { R[selT].gira(k === 'sx' ? -1 : 1); return true }
      if (k === 'ok') { datoTri(R[selT], x); return true }
      return false
    },
  }

  // ── le coordinate ──
  const C = () => Object.fromEntries(Object.entries(S.co).map(([k, v]) => [k, leggiNum(v)]))
  const dato = (k, nome) => ({ k, nome, val: S.co[k] ?? '', dato: true })
  const esito = (nome, val) => ({ nome, val, scegli: false })
  function righeCo() {
    const c = C(), p = polari(c), d = fraDue(c), g = S.co.vertici?.trim() ? gauss(S.co.vertici) : null
    return [
      { k: 'modo', nome: 'angoli in', val: MODI[S.modo][0], gira: giraModo },
      { titolo: true, nome: 'da A, distanza e azimut', scegli: false },
      dato('xa', 'x A (Est)'), dato('ya', 'y A (Nord)'), dato('d', 'distanza'), dato('az', `azimut (${MODI[S.modo][0]})`),
      esito('→ B', p ? `${num(p.xb, 3)} ; ${num(p.yb, 3)}` : 'mancano dati'),
      ...(p ? [esito('Δx = d·sin θ', num(p.dx, 4)), esito('Δy = d·cos θ', num(p.dy, 4))] : []),
      { titolo: true, nome: 'fra due punti', scegli: false },
      dato('x1', 'x A'), dato('y1', 'y A'), dato('x2', 'x B'), dato('y2', 'y B'),
      ...(d ? [esito('distanza AB', num(d.dist, 4)), esito('azimut AB', ang(d.az)), esito('reciproco BA', ang(d.reciproco))] : [esito('→', 'mancano dati')]),
      { titolo: true, nome: 'l’area con Gauss', scegli: false },
      { k: 'vertici', nome: 'i vertici', val: `${vertici().length}`, vertici: true },
      ...(!g ? [] : g.errore ? [esito(`! ${g.errore}`, '')] : [esito('area', num(g.area, 4)), esito('perimetro', num(g.per, 4)), esito('verso', g.verso)]),
    ]
  }
  let daK = 0
  const VIS_K = 9
  /** La riga scelta su una che si sceglie e la finestra che la mostra (in tasto e dopo ogni dato: disegna non cambia lo stato). */
  function segueK() {
    const R = righeCo()
    if (selK >= R.length || R[selK].scegli === false) selK = passo(R, selK, 1)
    if (selK < daK) daK = Math.max(0, selK - 1) // (si vede anche il titolo sopra)
    if (selK >= daK + VIS_K) daK = selK - VIS_K + 1
    daK = Math.max(0, Math.min(daK, R.length - VIS_K))
  }
  async function datoCo(r, x) {
    if (r.vertici) return os.spingi(vistaVertici(os))
    if (!r.dato) return
    const s = await numero(r.nome, S.co[r.k])
    if (s === null || !x.qui()) return
    if (s) S.co[r.k] = s; else delete S.co[r.k]
    salva(); segueK()
  }
  const coordinate = {
    nome: 'le coordinate', icona: 'bussola',
    aiuto: () => { const r = righeCo()[selK]; return r?.gira ? '←→ cambia · ↑↓ righe' : r?.vertici ? 'OK i vertici · ↑↓ righe' : 'OK scrivi · ↑↓ righe' },
    entra() { segueK() }, // (i vertici o la vecchia possono aver cambiato le righe)
    disegna(l, x) {
      const R = righeCo(), VIS = VIS_K, dk = Math.max(0, Math.min(daK, R.length - VIS)) // (una copia: lo stato lo tiene segueK)
      R.slice(dk, dk + VIS).forEach((q, i) => riga(l, x.zona, { x1: 236, y: 34 + i * 9, nome: txt(q.nome), val: txt(q.val ?? ''), titolo: q.titolo, on: dk + i === selK, gira: q.gira, premi: q.scegli === false ? null : () => { selK = dk + i; segueK(); if (!q.gira) datoCo(q, x) } }))
      const alta = VIS * 9 - 1, h = Math.max(6, Math.round((alta * VIS) / R.length)) // (il ritaglio lo fa pagine: qui l è spostato e non ce l'ha)
      l.vert(W - 9, 34, alta); l.riempi(W - 10, 34 + Math.round(((alta - h) * dk) / Math.max(1, R.length - VIS)), 3, h)
    },
    tasto(k, x) {
      const R = righeCo()
      if (k === 'su' || k === 'giu') { selK = passo(R, selK, k === 'su' ? -1 : 1); segueK(); return true }
      if ((k === 'sx' || k === 'dx') && R[selK]?.gira) { R[selK].gira(k === 'sx' ? -1 : 1); return true }
      if (k === 'ok') { datoCo(R[selK], x); return true }
      return false
    },
  }

  // ── gli angoli ──
  const DA = [['deg', 'sessagesimali'], ['gon', 'centesimali'], ['rad', 'radianti']]
  const giraDa = (d) => { const i = DA.findIndex(([k]) => k === S.ang.da); S.ang.da = DA[(i + d + DA.length) % DA.length][0]; salva() }
  const angoli = {
    nome: 'gli angoli', icona: 'goniometro',
    aiuto: () => (selA === 0 ? '←→ cambia · ↑↓ righe' : 'OK scrivi · ↑↓ righe'),
    disegna(l, x) {
      const nomeDa = DA.find(([k]) => k === S.ang.da)?.[1] ?? ''
      riga(l, x.zona, { x1: 160, y: 34, nome: 'da', val: nomeDa, on: selA === 0, gira: giraDa, premi: () => { selA = 0 } })
      riga(l, x.zona, { x1: 160, y: 43, nome: 'l’angolo', val: txt(S.ang.v || 'scrivi'), on: selA === 1, premi: () => { selA = 1; scriviAngolo(x) } })
      const a = leggiAngolo(S.ang.v, S.ang.da)
      if (!a) { Lcd.acapo('scrivi un angolo: in sessagesimali anche coi gradi, i primi e i secondi (35°30\'15")', 25).forEach((s, i) => l.testo(10, 58 + i * 9, s)); return }
      if (a.errore) { Lcd.acapo(txt(a.errore), 25).forEach((s, i) => l.testo(10, 58 + i * 9, s)); return }
      const R = [['sessages.', txt(dms(a.gradi))], ['sessadec.', `${txt(num(a.gradi, 6))}°`], ['centesim.', `${txt(num(daRad(a.rad, 'gon'), 6))} gon`], ['radianti', `${txt(num(a.rad, 8))}`]]
      R.forEach(([n, v], i) => riga(l, x.zona, { x1: 160, y: 58 + i * 12, nome: n, val: corto(v, 16) }))
      // il goniometro: il cerchio, lo zero a destra, il raggio dell'angolo (in senso antiorario, come a scuola)
      const cx = 205, cy = 76, rr = 34, g = ((a.rad % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
      for (let i = 0; i < 72; i++) { const q = (i / 72) * Math.PI * 2; l.px(Math.round(cx + Math.cos(q) * rr), Math.round(cy - Math.sin(q) * rr)) }
      for (let i = 0; i < 4; i++) { const q = (i * Math.PI) / 2; linea(l, Math.round(cx + Math.cos(q) * (rr - 3)), Math.round(cy - Math.sin(q) * (rr - 3)), Math.round(cx + Math.cos(q) * rr), Math.round(cy - Math.sin(q) * rr)) }
      linea(l, cx, cy, cx + rr, cy)
      linea(l, cx, cy, Math.round(cx + Math.cos(g) * rr), Math.round(cy - Math.sin(g) * rr))
      for (let i = 0; i <= 24; i++) { const q = (g * i) / 24; l.px(Math.round(cx + Math.cos(q) * 12), Math.round(cy - Math.sin(q) * 12)) } // (l'arco dell'angolo)
      l.riempi(cx - 1, cy - 1, 3, 3)
    },
    tasto(k, x) {
      if (k === 'su' || k === 'giu') { selA = 1 - selA; return true }
      if ((k === 'sx' || k === 'dx') && selA === 0) { giraDa(k === 'sx' ? -1 : 1); return true }
      if (k === 'ok') { if (selA === 1) scriviAngolo(x); return true }
      return false
    },
  }
  async function scriviAngolo(x) {
    const s = await numero(`l’angolo in ${DA.find(([k]) => k === S.ang.da)?.[1]}`, S.ang.v, S.ang.da === 'deg')
    if (s === null || !x.qui()) return
    S.ang.v = s; salva()
  }

  const PAG = [calcolo, triangoli, coordinate, angoli]
  return pagine(os, {
    nome: 'calcolatrice', app: 'calcolatrice',
    pagine: PAG,
    iniziale: Math.max(0, ['calcolo', 'triangoli', 'coordinate', 'angoli'].indexOf(S.tab)),
    esci: (x) => { S.tab = ['calcolo', 'triangoli', 'coordinate', 'angoli'][x.pag]; salva() }, // (la scheda si ricorda, anche per la vecchia)
  })
}
