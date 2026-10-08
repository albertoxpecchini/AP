// La fisica della roulette di pzkko.it: il rotore che gira, la pallina sulla
// pista, l'orlo, lo scivolo con gli otto deflettori, la corona con i trentasette
// separatori in rilievo e infine la casella. Tutto in centimetri, secondi e
// radianti; niente DOM: la pagina disegna quello che c'è qui, tools/roulette/
// prova.mjs lo mette alla prova migliaia di volte senza browser.
//
// Il caso viene da un generatore con seme (mulberry32): lo stesso seme dà lo
// stesso giro, così un giro si può ripetere e studiare. Il numero che esce è
// quello della casella in cui la pallina si ferma davvero: non c'è un'estrazione
// a parte che poi «guida» la pallina.
//
// Angoli: dall'asse x in senso orario sullo schermo (y verso il basso). Il
// rotore gira in senso antiorario (w < 0), la pallina viene lanciata in senso
// orario (w > 0), come al casinò.

export const SEQUENZA = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26]
export const ROSSI = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36])
export const N = SEQUENZA.length
export const DELTA = (2 * Math.PI) / N
export const INDICE = Object.fromEntries(SEQUENZA.map((n, i) => [n, i]))

/** La geometria della ruota, in centimetri dal centro (una ruota da 80 cm). */
export const GEOM = {
  R: 40, // il bordo esterno della conca
  pista: 33.2, // la pista dove corre la pallina lanciata (misurata sul foglio: 78–88 % del raggio)
  orlo: 31.0, // il gradino fra la pista e lo scivolo: la pallina ci rotola contro mentre rallenta
  deflettori: 25.6, // i deflettori di metallo sullo scivolo (64 % del raggio)
  rotore: 22.4, // il bordo del rotore (il buco nella conca)
  corona: 21.6, // la corona dei numeri: da qui in dentro ci sono i separatori
  numeri: 19.9, // sotto i numeri cominciano le caselle
  casella: 18.0, // dove si posa la pallina nella casella
  fondo: 15.2, // la parete interna delle caselle (l'anello d'ottone del rotore sta a 13,6)
  pallina: 1.0, // il raggio della pallina
  pendenza: 15, // gradi: la pendenza dello scivolo
}

const G = 981 // cm/s²

/** Gli otto deflettori, misurati sul foglio (tools/roulette/misura.mjs): angolo in gradi da x in senso orario; «lungo» lo scivolo (radiale) o «traverso». */
export const DEFLETTORI = [358.4, 44.3, 89.9, 136.7, 181.7, 226.8, 270.2, 313.9].map((g, i) => ({ a: (g * Math.PI) / 180, lungo: i % 2 === 0 }))

export function caso(seme) {
  let a = (seme >>> 0) || 1
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const TAU = 2 * Math.PI
export const norm = (a) => ((a % TAU) + TAU) % TAU
const tan = Math.tan((GEOM.pendenza * Math.PI) / 180)
const cos2 = Math.cos((GEOM.pendenza * Math.PI) / 180) ** 2
const PASSO = 1 / 480 // il passo della simulazione (s)

/** Una ruota nuova: il rotore fermo, nessuna pallina in gioco. */
export function nuovaRuota({ seme = 1, deflettori = DEFLETTORI } = {}) {
  return { t: 0, rotore: { a: 0, w: 0 }, pallina: null, deflettori, rnd: caso(seme), esito: null, giri: 0, resto: 0 }
}

/** Il croupier dà la spinta al rotore (w in rad/s, negativo = antiorario). */
export function spingiRotore(S, w = -2.4) {
  S.rotore.w = w
}

/**
 * Il lancio: la pallina parte sulla pista all'angolo a0 (dove la lascia la mano)
 * con la velocità angolare w0 (rad/s, positiva = oraria). Il seme decide le
 * piccole differenze di ogni lancio: la velocità, dove la pallina lascia la pista,
 * come rimbalza.
 */
export function lancia(S, { a0 = -Math.PI / 2, w0 } = {}) {
  const r = S.rnd
  const w = w0 || TAU * (2.05 + 0.35 * r())
  S.pallina = {
    fase: 'pista', // pista → orlo → scivolo (volo) → corona (volo) → casella
    r: GEOM.pista, a: norm(a0), vr: 0, w, z: 0, vz: 0,
    wCaduta: TAU * (0.86 + 0.12 * r()), // sotto questa velocità la pista non la tiene più
    attrito: 1 + (r() - 0.5) * 0.16, // ogni pallina ha la sua giornata
    casella: null, dopo: null, rimbalzi: 0, deflettore: -1, deflettoreT: 0, tFase: S.t, tCorona: 0, osc: null, deflettori: 0,
    traccia: [], // gli eventi del giro: per capire cosa è successo
  }
  S.esito = null
  S.giri++
  return S.pallina
}

/** La pallina esce dalla casella (la prende il croupier). */
export function prendi(S) {
  S.pallina = null
}

/** La pallina posata ferma nella casella i (all'inizio, o dopo una ricarica). */
export function posa(S, i = 0) {
  const a = norm(S.rotore.a + i * DELTA)
  S.pallina = { fase: 'casella', r: GEOM.casella, a, vr: 0, w: S.rotore.w, z: 0, vz: 0, casella: i, osc: null, rimbalzi: 0, deflettori: 0, traccia: [], tFase: S.t, tCorona: 0, deflettore: -1, deflettoreT: 0 }
  S.esito = SEQUENZA[i]
  return S.pallina
}

/** Dove sta la pallina, in centimetri dal centro della ruota (x, y, z), e in quale casella se è ferma. */
export function posizione(S) {
  const p = S.pallina
  if (!p) return null
  if (p.fase === 'casella' && p.osc === null) {
    const a = S.rotore.a + p.casella * DELTA
    return { x: GEOM.casella * Math.cos(a), y: GEOM.casella * Math.sin(a), z: 0, a, r: GEOM.casella, casella: p.casella }
  }
  return { x: p.r * Math.cos(p.a), y: p.r * Math.sin(p.a), z: p.z, a: p.a, r: p.r, casella: p.fase === 'casella' ? p.casella : null }
}

/** Il centro della casella i, in centimetri dal centro (sulla corona che gira). */
export function centroCasella(S, i, r = GEOM.casella) {
  const a = S.rotore.a + i * DELTA
  return { x: r * Math.cos(a), y: r * Math.sin(a), a }
}

const segno = (v) => (v > 0 ? 1 : v < 0 ? -1 : 0)

function evento(S, p, nome, extra) {
  if (p.traccia.length < 200) p.traccia.push({ t: +(S.t - p.tFase0 || S.t).toFixed(3), nome, ...extra })
}

/** Un passo di simulazione (dt in secondi, anche lungo: viene spezzato in passi fissi). */
export function passo(S, dt) {
  S.resto += Math.min(dt, 0.25)
  while (S.resto >= PASSO) {
    S.resto -= PASSO
    sottoPasso(S, PASSO)
  }
}

function sottoPasso(S, h) {
  S.t += h
  const R = S.rotore
  // il rotore rallenta piano (minuti): attrito del perno
  R.w -= R.w * 0.015 * h
  if (Math.abs(R.w) < 0.02) R.w = 0
  R.a = norm(R.a + R.w * h)
  const p = S.pallina
  if (!p) return
  if (p.tFase0 === undefined) p.tFase0 = S.t
  const rnd = S.rnd
  switch (p.fase) {
    case 'pista': {
      // sulla pista: rallenta per l'aria e l'attrito di rotolamento
      p.w -= (0.5 + 0.003 * p.w * p.w) * p.attrito * h
      p.a = norm(p.a + p.w * h)
      if (p.w < p.wCaduta) {
        p.fase = 'orlo'; p.vr = -22; p.tFase = S.t
        evento(S, p, 'lascia la pista', { giri: +(S.t - p.tFase0).toFixed(2) })
      }
      break
    }
    case 'orlo': {
      // scende il gradino e rotola contro l'orlo dello scivolo, frenando forte,
      // finché la forza centrifuga non basta più a tenerla contro l'orlo
      p.r = Math.max(GEOM.orlo, p.r + p.vr * h)
      if (p.r === GEOM.orlo) p.vr = 0
      p.w -= (1.7 + 0.03 * p.w * p.w) * p.attrito * h
      p.a = norm(p.a + p.w * h)
      const wCritica = Math.sqrt((G * tan) / GEOM.orlo) * (1 + 0.05 * (rnd() - 0.5))
      if (p.r === GEOM.orlo && p.w < wCritica) {
        p.fase = 'scivolo'; p.vr = -8; p.tFase = S.t
        evento(S, p, 'scende lo scivolo', { w: +p.w.toFixed(2) })
      }
      break
    }
    case 'scivolo':
      scivolo(S, p, h, rnd)
      break
    case 'volo': {
      // in aria: nessun attrito, la gravità la riporta giù
      p.vz -= G * h
      p.z += p.vz * h
      p.r += p.vr * h
      p.a = norm(p.a + p.w * h)
      if (p.r > GEOM.orlo) { p.r = GEOM.orlo; p.vr = -Math.abs(p.vr) * 0.3 }
      if (p.r < GEOM.fondo + GEOM.pallina) { p.r = GEOM.fondo + GEOM.pallina; p.vr = Math.abs(p.vr) * 0.4 }
      if (p.z <= 0) {
        p.z = 0
        if (Math.abs(p.vz) > 30) { p.vz = -p.vz * 0.32; break } // un rimbalzino
        p.vz = 0
        p.fase = p.r <= GEOM.corona ? 'corona' : 'scivolo'
        if (p.fase === 'corona') atterra(S, p, rnd)
      }
      break
    }
    case 'corona':
      corona(S, p, h, rnd)
      break
    case 'casella': {
      // nella casella: un breve tremolio, poi ferma con il rotore
      const o = p.osc
      if (!o) { p.a = norm(R.a + p.casella * DELTA); p.r = GEOM.casella; break }
      const t = S.t - o.t0
      const amp = o.amp * Math.exp(-7 * t) * Math.cos(38 * t)
      p.a = norm(R.a + p.casella * DELTA + amp / GEOM.casella)
      p.r += (GEOM.casella - p.r) * Math.min(1, 12 * h)
      if (t > 0.6) { p.osc = null; p.r = GEOM.casella; evento(S, p, 'ferma', { numero: SEQUENZA[p.casella], rimbalzi: p.rimbalzi }) }
      break
    }
  }
}

function scivolo(S, p, h, rnd) {
  // sul cono dello scivolo: la forza centrifuga spinge fuori, la gravità dentro; l'attrito frena il giro
  const ar = cos2 * (p.r * p.w * p.w - G * tan) - 3.2 * p.vr
  p.vr += ar * h
  p.w += (-0.95 * p.w - (2 * p.vr * p.w) / p.r) * h
  p.r += p.vr * h
  p.a = norm(p.a + p.w * h)
  if (p.r > GEOM.orlo) { p.r = GEOM.orlo; if (p.vr > 0) p.vr = 0 }
  // i deflettori: un urto per passaggio
  if (S.t > p.deflettoreT) {
    for (let i = 0; i < S.deflettori.length; i++) {
      const d = S.deflettori[i]
      const dr = p.r - GEOM.deflettori
      let da = norm(p.a - d.a); if (da > Math.PI) da -= TAU
      const lat = da * p.r // distanza laterale in cm
      if (d.lungo) {
        // lungo lo scivolo: lo prende di fianco mentre gira; ferma quasi del tutto il giro, e salta
        if (Math.abs(dr) < 2.2 && Math.abs(lat) < 1.4 + GEOM.pallina) {
          const vt = Math.abs(p.w) * p.r
          p.w *= -0.12 + 0.3 * rnd() // da 0,18 indietro a 0,18 avanti
          p.vr = Math.min(p.vr, -6) * (0.8 + 0.4 * rnd())
          p.vz = Math.min(120, 0.75 * vt * (0.7 + 0.6 * rnd()))
          urto(S, p, 'deflettore lungo', i)
          break
        }
      } else if (Math.abs(dr) < 0.9 + GEOM.pallina && Math.abs(lat) < 1.6 + GEOM.pallina && p.vr < 0) {
        // di traverso: le sbarra la discesa, la fa saltare, il giro continua un po' più lento
        p.vr = Math.abs(p.vr) * 0.25
        p.w *= 0.86 + 0.08 * rnd()
        p.vz = Math.min(100, 45 + Math.abs(p.vr) * 1.5 + 35 * rnd())
        p.w += (rnd() - 0.5) * 0.6
        urto(S, p, 'deflettore traverso', i)
        break
      }
    }
  }
  if (p.r <= GEOM.corona) { p.fase = 'corona'; p.tCorona = S.t; atterra(S, p, rnd) }
}

function urto(S, p, nome, i) {
  p.deflettore = i; p.deflettoreT = S.t + 0.25; p.deflettori++
  p.fase = 'volo'; p.z = 0.01
  evento(S, p, nome, { i, w: +p.w.toFixed(2), vz: Math.round(p.vz) })
}

const indice = (S, p) => Math.round(norm(p.a - S.rotore.a) / DELTA) % N

function atterra(S, p, rnd) {
  // tocca la corona: se è lenta rispetto al rotore si ferma nella casella dov'è
  const wrel = p.w - S.rotore.w
  if (Math.abs(wrel) * p.r < 20 && p.r < GEOM.numeri + 0.5) ferma(S, p, indice(S, p), rnd)
  else p.indice = indice(S, p)
}

function corona(S, p, h, rnd) {
  const R = S.rotore
  // la corona pende verso l'interno: la pallina scivola verso il fondo delle caselle
  const ar = -140 - 4 * p.vr
  p.vr += ar * h
  p.r += p.vr * h
  if (p.r < GEOM.casella - 0.6) { p.r = GEOM.casella - 0.6; p.vr = -p.vr * 0.3 }
  if (p.r > GEOM.corona) { p.r = GEOM.corona; p.vr = 0 }
  // l'attrito delle caselle frena il moto relativo al rotore
  let wrel = p.w - R.w
  const freno = 1.9 * h
  wrel = Math.abs(wrel) <= freno ? 0 : wrel - segno(wrel) * freno
  p.w = R.w + wrel
  p.a = norm(p.a + p.w * h)
  const i = indice(S, p)
  if (p.indice === undefined) p.indice = i
  if (i !== p.indice) {
    // ha incontrato un separatore
    const v = Math.abs(wrel) * p.r
    if (v < 20 + 10 * rnd() || S.t - p.tCorona > 5) { ferma(S, p, p.indice, rnd); return }
    p.rimbalzi++
    const indietro = rnd() < Math.max(0.06, 0.32 - v / 350)
    wrel *= indietro ? -(0.3 + 0.3 * rnd()) : 0.58 + 0.24 * rnd()
    p.w = R.w + wrel
    p.vz = Math.min(110, 0.65 * v * (0.6 + 0.7 * rnd()))
    p.vr += (rnd() - 0.5) * 24 + 3
    p.fase = 'volo'; p.z = 0.01
    evento(S, p, indietro ? 'separatore, torna indietro' : 'separatore, salta', { v: Math.round(v), vz: Math.round(p.vz) })
    p.indice = indietro ? p.indice : i
    return
  }
  if (wrel === 0 && p.r < GEOM.numeri) ferma(S, p, i, rnd)
}

function ferma(S, p, i, rnd) {
  p.fase = 'casella'
  p.casella = ((i % N) + N) % N
  p.vz = 0; p.z = 0; p.vr = 0
  p.w = S.rotore.w
  let da = norm(p.a - S.rotore.a) - p.casella * DELTA; if (da > Math.PI) da -= TAU
  p.osc = { t0: S.t, amp: Math.max(-1.2, Math.min(1.2, da * GEOM.casella)) + (rnd() - 0.5) * 0.4 }
  S.esito = SEQUENZA[p.casella]
  evento(S, p, 'casella', { numero: S.esito })
}

/** La pallina è ferma nella casella (anche se trema ancora)? */
export const ferma_ = (S) => Boolean(S.pallina && S.pallina.fase === 'casella')
export const inGioco = (S) => Boolean(S.pallina && S.pallina.fase !== 'casella')

/** Colore di un numero: 'rosso', 'nero' o 'verde'. */
export const colore = (n) => (n === 0 ? 'verde' : ROSSI.has(n) ? 'rosso' : 'nero')

/** Un giro intero senza disegnare: utile per le prove. */
export function giroIntero(S, opz = {}) {
  lancia(S, opz)
  let t = 0
  while (S.pallina && !(S.pallina.fase === 'casella' && S.pallina.osc === null) && t < 60) { passo(S, 1 / 60); t += 1 / 60 }
  return { numero: S.esito, durata: t, rimbalzi: S.pallina ? S.pallina.rimbalzi : -1, deflettori: S.pallina ? S.pallina.deflettori : -1, traccia: S.pallina ? S.pallina.traccia : [] }
}
