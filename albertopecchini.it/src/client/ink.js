// L'inchiostro di PECCHINI e l'aragosta che lo versa (home, prima schermata).
//
// Sopra «Disponibile per nuovi incarichi» dorme un'aragosta di fiume. Quando il
// visitatore sta fermo si sveglia di colpo, prende l'annaffiatoio azzurro e versa
// inchiostro nella prima I del cognome. PECCHINI è un recipiente unico: il
// liquido corre sul fondo da una lettera all'altra e sale in tutte insieme, come
// in vasi comunicanti. In meno di tre secondi è pieno; dopo cinque comincia a
// perdere dal fondo delle lettere, goccia dopo goccia, e l'aragosta torna a
// riempirlo, all'infinito. Una volta riempito non scende mai sotto la metà.
//
// Il liquido è una simulazione vera, un'onda in acqua bassa su una griglia di
// colonne (1 px = 1 mm, g = 9,8 m/s²): corre, fa onde, sciaborda quando si
// scorre la pagina e quando il puntatore ci passa sopra, e si calma da solo.
// Il contorno della parola è un <text> SVG con lo stesso carattere dell'HTML
// (che intanto nasconde il suo); tutto ciò che si muove è disegnato su canvas,
// e il liquido è ritagliato dalla stessa parola. Se l'aragosta si allontana
// dallo schermo si riaddormenta; con «riduci movimento» dorme e basta.

import { aragosta } from '../data/aragosta.js'
import { clamp, reducedMotion } from './utils.js'

const NS = 'http://www.w3.org/2000/svg'
const IDLE = 2200 // ms fermi prima che si svegli
const HOLD = 5 // s pieno prima che cominci a perdere
const FILL = 1.9 // s per riempirlo da vuoto: col risveglio, la presa e il volo del getto resta sotto i 3 s
const LEAK = 3.6 // s per perdere fino al punto in cui torna a versare
const G = 9800 // px/s²: 1 px = 1 mm
const INK = '#141824'

const svg = (name, attrs = {}, parent) => {
  const n = document.createElementNS(NS, name)
  for (const k in attrs) n.setAttribute(k, attrs[k])
  parent?.appendChild(n)
  return n
}
const f1 = (v) => Math.round(v * 10) / 10
const rnd = (a, b) => a + Math.random() * (b - a)
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1)
  return t * t * (3 - 2 * t)
}

// ── Matrici affini 2D [a b c d e f] come in SVG ─────────────────────────────
const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]]
const T = (x, y) => [1, 0, 0, 1, x, y]
const Rd = (deg) => {
  const r = (deg * Math.PI) / 180
  return [Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r), 0, 0]
}
const Sc = (x, y = x) => [x, 0, 0, y, 0, 0]
const at = (m, [x, y]) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]

// ── Il liquido: acqua bassa su una griglia sfalsata ─────────────────────────
// h[i] altezza del liquido nella colonna i, u[j] velocità sul bordo tra i-1 e i.
// Flussi a monte (upwind) e limitati: il volume si conserva esatto e le colonne
// asciutte si bagnano come un'onda di diga rotta.
class Liquid {
  constructor(n, width) {
    this.n = n
    this.dx = width / n
    this.h = new Float32Array(n)
    this.u = new Float32Array(n + 1)
    this.F = new Float32Array(n + 1)
    this.tmp = new Float32Array(n + 1)
  }

  get mean() {
    let s = 0
    for (let i = 0; i < this.n; i++) s += this.h[i]
    return s / this.n
  }

  /** Nuova griglia (ridimensionamento): stesso livello medio in scala, onde azzerate. */
  resized(n, width, ratio) {
    const L = new Liquid(n, width)
    L.h.fill(this.mean * ratio)
    return L
  }

  step(dt, g, ax, damping) {
    const { n, dx, h, u, F, tmp } = this
    const decay = Math.exp(-damping * dt)
    for (let j = 1; j < n; j++) {
      if (h[j - 1] < 0.01 && h[j] < 0.01) {
        u[j] = 0
        continue
      }
      u[j] = (u[j] + (-g * (h[j] - h[j - 1]) / dx + ax) * dt) * decay
    }
    // un filo di viscosità: toglie il rumore da una colonna all'altra
    for (let j = 1; j < n; j++) tmp[j] = u[j] + 0.1 * (u[j - 1] - 2 * u[j] + u[j + 1])
    for (let j = 1; j < n; j++) u[j] = tmp[j]
    u[0] = u[n] = 0
    for (let j = 1; j < n; j++) F[j] = u[j] * (u[j] > 0 ? h[j - 1] : h[j])
    F[0] = F[n] = 0
    // nessuna colonna può dare più di quello che ha
    const k = dt / dx
    for (let i = 0; i < n; i++) {
      const out = (Math.max(F[i + 1], 0) - Math.min(F[i], 0)) * k
      if (out > h[i] && out > 0) {
        const s = h[i] / out
        if (F[i + 1] > 0) F[i + 1] *= s
        if (F[i] < 0) F[i] *= s
      }
    }
    for (let i = 0; i < n; i++) h[i] = Math.max(0, h[i] - (F[i + 1] - F[i]) * k)
    // tensione superficiale (poca): lisca le creste di una colonna sola
    for (let i = 1; i < n - 1; i++) tmp[i] = h[i] + 0.015 * (h[i - 1] - 2 * h[i] + h[i + 1])
    for (let i = 1; i < n - 1; i++) h[i] = tmp[i]
  }

  /** Aggiunge `vol` (px²) intorno alla colonna di x con una campana larga `half`. */
  add(x, half, vol) {
    const { n, dx, h } = this
    const c = x / dx - 0.5
    const r = Math.max(1, half / dx)
    let wsum = 0
    for (let i = Math.max(0, Math.floor(c - r)); i <= Math.min(n - 1, Math.ceil(c + r)); i++) wsum += Math.max(0, 1 - Math.abs(i - c) / r)
    if (!wsum) return
    for (let i = Math.max(0, Math.floor(c - r)); i <= Math.min(n - 1, Math.ceil(c + r)); i++) h[i] += (vol / dx) * (Math.max(0, 1 - Math.abs(i - c) / r) / wsum)
  }

  /** Toglie fino a `vol` dalla colonna di x; restituisce quanto ha tolto davvero. */
  take(x, vol) {
    const i = clamp(Math.round(x / this.dx - 0.5), 0, this.n - 1)
    const got = Math.min(vol / this.dx, this.h[i])
    this.h[i] -= got
    return got * this.dx
  }

  at(x) {
    return this.h[clamp(Math.round(x / this.dx - 0.5), 0, this.n - 1)]
  }

  /** Spinge il liquido lontano da x (il getto che cade), o lo trascina (il puntatore). */
  push(x, radius, dv, away = true) {
    const { n, dx, u } = this
    for (let j = 1; j < n; j++) {
      const d = j * dx - x
      if (Math.abs(d) > radius) continue
      const w = 1 - Math.abs(d) / radius
      u[j] += (away ? Math.sign(d) : 1) * dv * w
    }
  }

  energy() {
    let e = 0
    for (let j = 1; j < this.n; j++) e += this.u[j] * this.u[j]
    return e / this.n
  }
}

// ── Il burattino ────────────────────────────────────────────────────────────
function rigParts() {
  const parts = {}
  for (const [id, p] of Object.entries(aragosta.parti)) {
    const img = aragosta.pezzi[id]
    parts[id] = { id, ...img, ...p, pin: p.parent ? p.pin || img.pin : [0, 0], scale: p.scale || 1, children: [] }
  }
  for (const p of Object.values(parts)) if (p.parent) parts[p.parent].children.push(p)
  return parts
}

/** La trasformazione locale di un pezzo (nelle coordinate del genitore), con l'angolo `a`. */
function local(p, parts, a) {
  if (!p.parent) return [1, 0, 0, 1, 0, 0]
  const k = p.scale / parts[p.parent].scale
  return mul(mul(mul(T(...p.at), Rd(a)), Sc(p.flip ? -k : k, k)), T(-p.pin[0], -p.pin[1]))
}

/** La trasformazione del corpo nel sistema dell'hero. */
function rootM(X, Y, S, pose) {
  const [px, py] = aragosta.pivot
  return mul(mul(mul(mul(T(X, Y), Sc(S)), T(px, py + pose.y)), Rd(pose.r)), T(-px, -py))
}

/** Matrice di ogni pezzo (nel sistema di `root`), per una posa. */
function chain(parts, root, pose) {
  const M = {}
  const walk = (p, parentM) => {
    M[p.id] = mul(parentM, local(p, parts, p.parent ? pose[p.id] || 0 : 0))
    p.children.forEach((c) => walk(c, M[p.id]))
  }
  walk(parts.corpo, root)
  return M
}

/** Una scena per ogni [data-ink]: l'hero della home e la tavola «Mascotte» di /stile/. */
export function initInk() {
  document.querySelectorAll('[data-ink]').forEach(mount)
}

function mount(wrap, n) {
  const word = wrap.querySelector('[data-ink-word]')
  const bed = wrap.querySelector('[data-ink-bed]')
  if (!word || !bed) return
  const uid = (name) => `ink-${name}-${n}`

  const still = reducedMotion()
  const parts = rigParts()
  const poses = aragosta.pose
  // le lettere come appaiono: maiuscole o minuscole le decide il CSS (dal 2.10.2026 il sito è tutto minuscolo)
  const raw = word.textContent.trim()
  const tt = getComputedStyle(word).textTransform
  const letters = tt === 'uppercase' ? raw.toUpperCase() : tt === 'lowercase' ? raw.toLowerCase() : raw
  // la posizione di una lettera, maiuscola o minuscola che sia
  const find = (ch, last = false) => letters.toLowerCase()[last ? 'lastIndexOf' : 'indexOf'](ch.toLowerCase())

  // ── Gli strati ──
  // Ciò che si muove sta su tre canvas e un fotogramma non tocca il DOM: con
  // tutto in un SVG, ogni path o trasformazione cambiati costringevano il
  // browser a rifare layout, hit-test del puntatore, paint e livelli di tutta la
  // pagina, a ogni fotogramma. Nell'SVG resta ciò che sta fermo: il contorno
  // della parola e il ritaglio del liquido (un canvas non saprebbe scrivere
  // Archivo stretto all'86%, e così il ritaglio è lo stesso <text> del contorno).
  //   pool  il liquido, ritagliato dalla parola, sotto il contorno
  //   fx    macchie, gocce e il getto fuori dalla lettera, sopra il contorno
  //   cray  l'aragosta; il respiro nel sonno è un'animazione CSS del canvas
  // Le z e il «!» sono testo HTML sopra il getto, animati dal CSS.
  const layer = (cls) => {
    const c = document.createElement('canvas')
    c.className = `ink ${cls}`
    c.setAttribute('aria-hidden', 'true')
    return { c, ctx: c.getContext('2d'), box: null, k: 1 }
  }
  const pool = layer('ink__pool')
  const root = svg('svg', { class: 'ink', 'aria-hidden': 'true', focusable: 'false' })
  const cut = svg('clipPath', { id: uid('cut') }, svg('defs', {}, root))
  const cutText = svg('text', {}, cut)
  const outline = svg('text', { class: 'ink__outline' }, root)
  pool.c.style.clipPath = `url(#${uid('cut')})`
  const fx = layer('ink__fx')
  const marks = document.createElement('div')
  marks.className = 'ink ink__marks'
  marks.setAttribute('aria-hidden', 'true')
  marks.innerHTML = '<span class="ink__zzz"><span style="--i:0">z</span><span style="--i:1">z</span><span style="--i:2">z</span></span><span class="ink__bang">!</span>'
  const [zzz, bang] = marks.children
  const cray = layer('ink__cray')
  // dove la si tocca, quando dorme, per svegliarla
  const hit = document.createElement('span')
  hit.className = 'ink__hit'
  hit.setAttribute('aria-hidden', 'true')

  // l'aragosta: i pezzi nell'ordine di disegno, ciascuno con la sua matrice
  // intera calcolata lungo la catena dei genitori; `presa` ridisegna la pinza
  const nodes = aragosta.ordine.map((id) => ({ part: id === 'presa' ? aragosta.presa.pezzo : id, presa: id === 'presa' }))
  const images = {}
  for (const id of Object.keys(parts)) {
    const img = new Image()
    img.src = `/media/aragosta/${id}.webp`
    images[id] = { img, bitmap: null, scale: 0 }
  }

  // gli occhi: disco bianco, pupilla, palpebra del colore del guscio e la piega dell'occhio chiuso
  const eyes = parts.corpo.eyes.map((e) => ({ ...e, px: 0, py: 0, ly: 0, r: 0, crease: 0 }))

  wrap.append(pool.c, root, fx.c, marks, cray.c, hit)

  // ── Misure ──
  let geo = null
  let liquid = null
  const measure = () => {
    const W = wrap.getBoundingClientRect()
    const z = W.width / (wrap.offsetWidth || W.width) || 1
    const ox = W.left
    const oy = W.top
    const lx = (v) => (v - ox) / z
    const ly = (v) => (v - oy) / z
    const cs = getComputedStyle(word)
    const fs = parseFloat(cs.fontSize)
    const text = [...word.childNodes].find((n) => n.nodeType === 3)
    if (!text || !fs) return null
    const probe = document.createElement('span')
    probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline'
    word.appendChild(probe)
    const base = ly(probe.getBoundingClientRect().bottom)
    probe.remove()
    const S = word.getBoundingClientRect()
    const xs = []
    for (let i = 0; i < text.length; i++) {
      const r = document.createRange()
      r.setStart(text, i)
      r.setEnd(text, i + 1)
      xs.push(lx(r.getBoundingClientRect().left))
    }
    const ctx = document.createElement('canvas').getContext('2d')
    ctx.font = `${cs.fontWeight} ${fs}px ${cs.fontFamily}`
    // il recipiente va dalla cima della lettera più alta (le aste di h e P, i puntini
    // delle i) al fondo della lettera più bassa: la coda della p minuscola, o le pance
    // tonde appena sotto la linea di base
    const cap = ctx.measureText(letters).actualBoundingBoxAscent || fs * 0.7
    const over = ctx.measureText(letters).actualBoundingBoxDescent || fs * 0.012
    const B = bed.getBoundingClientRect()
    const rule = wrap.querySelector('[data-ink-rule]')?.getBoundingClientRect()
    // il bordo destro oltre cui l'aragosta non va: nell'hero quello visibile (l'hero
    // taglia quello che esce, e c'è lo spazio della barra di scorrimento), altrove la scena
    const hero = wrap.closest('.hero')
    const edge = hero ? Math.min(document.documentElement.clientWidth, hero.getBoundingClientRect().right) : W.right
    const em = fs
    const bottom = base + Math.max(over, 0.01 * em)
    // dove stanno le aste nelle lettere di Archivo (in em dall'inizio della lettera,
    // misurate sul carattere a larghezza 86%): la prima i riceve il getto; perdono
    // l'asta della p, il fondo della seconda c, l'asta destra della h e l'ultima i;
    // ogni goccia nasce dal fondo della sua lettera (la coda della p scende sotto la base)
    const STEM = { P: 0.13, C: 0.33, H: 0.514, I: 0.13, p: 0.114, c: 0.25, h: 0.402, i: 0.114 }
    const x = (i) => (i < 0 ? null : xs[i] + (STEM[letters[i]] ?? 0.13) * em)
    const foot = (i) => base + Math.max(0, ctx.measureText(letters[i] || '').actualBoundingBoxDescent || 0)
    const sw = S.width / z
    const leak = (px, py) => (px === null ? null : { x: px, y: py, acc: 0, max: 1 })
    const g = {
      W: wrap.offsetWidth || W.width,
      H: wrap.offsetHeight || W.height,
      z, // lo zoom del piano di /stile/: i canvas ne tengono conto per restare nitidi
      fs,
      cs,
      base,
      x0: lx(S.left) - 0.02 * em,
      x1: lx(S.right) + 0.03 * em,
      top: base - cap,
      bottom,
      xs,
      pour: x(find('I')) ?? xs[0] + sw * 0.7,
      leaks: [
        leak(x(find('P')), foot(find('P')) - 0.5),
        leak(x(find('C', true)), foot(find('C', true)) - 0.5),
        leak(x(find('H')), foot(find('H')) - 0.5),
        leak(x(find('I', true)), foot(find('I', true)) - 0.5),
      ].filter(Boolean),
      bedTop: ly(B.top),
      rule: rule ? ly(rule.top) : base + 0.2 * em,
      right: lx(edge) - 8,
      k: fs / 170, // le misure dei dettagli (getto, gocce) sono pensate a 170 px di corpo
    }
    g.depth = g.bottom - g.top
    g.full = g.depth + 0.035 * em
    g.width = g.x1 - g.x0
    return g
  }

  const layout = () => {
    const g = measure()
    if (!g || g.width <= 0) return false
    const old = geo
    geo = g
    root.setAttribute('viewBox', `0 0 ${f1(g.W)} ${f1(g.H)}`)
    root.style.width = `${g.W}px`
    root.style.height = `${g.H}px`
    const n = clamp(Math.round(g.width / 4), 60, 200)
    liquid = liquid && old ? liquid.resized(n, g.width, g.depth / old.depth) : new Liquid(n, g.width)
    placeCrayfish()
    // i canvas: il liquido sulla parola, l'aragosta fin dove può arrivare, e
    // getto, gocce e macchie su tutto lo spazio fra le due e l'etichetta
    const pad = 0.06 * g.fs
    fit(pool, g.x0 - 2, g.top - pad, g.width + 4, g.bottom + 6 - (g.top - pad))
    const C = place.box
    const fx0 = Math.min(g.x0, C.x) - 4
    const fy0 = Math.min(g.top, C.y) - 4
    fit(fx, fx0, fy0, Math.max(g.x1, C.x + C.w) + 4 - fx0, Math.max(g.rule + pad + 6, g.bottom + 6) - fy0)
    fit(cray, C.x, C.y, C.w, C.h)
    const R = place.rest
    cray.c.style.setProperty('--ox', `${f1(R.x + R.w / 2 - cray.box.x)}px`)
    cray.c.style.setProperty('--oy', `${f1(R.y + R.h - cray.box.y)}px`)
    Object.assign(hit.style, { left: `${f1(R.x)}px`, top: `${f1(R.y)}px`, width: `${f1(R.w)}px`, height: `${f1(R.h)}px` })
    // il contorno e il ritaglio del liquido: lo stesso testo, il secondo nelle coordinate del suo canvas
    const font = `font-family:${g.cs.fontFamily};font-weight:${g.cs.fontWeight};font-size:${g.fs}px;font-stretch:${g.cs.fontStretch};letter-spacing:${g.cs.letterSpacing};font-kerning:${g.cs.fontKerning}`
    for (const [t, x, y] of [[outline, g.xs[0], g.base], [cutText, g.xs[0] - pool.box.x, g.base - pool.box.y]]) {
      t.textContent = letters
      t.setAttribute('x', f1(x))
      t.setAttribute('y', f1(y))
      t.style.cssText = font
    }
    // le z e il «!» sono grandi in proporzione all'aragosta
    zzz.style.setProperty('--s', f1(place.S / 0.22))
    Object.assign(bang.style, { fontSize: `${f1(150 * place.S)}px`, left: `${f1(-40 * place.S)}px`, top: `calc(${f1(10 * place.S)}px - 0.8em)` })
    marksAt = ''
    shrink()
    return true
  }

  // Un canvas sopra il riquadro (x, y, w, h) della scena, con i pixel dello schermo
  const fit = (L, x, y, w, h) => {
    const k = Math.min(3, (devicePixelRatio || 1) * geo.z)
    const pw = Math.max(1, Math.ceil(w * k))
    const ph = Math.max(1, Math.ceil(h * k))
    L.k = k
    L.box = { x, y, w: pw / k, h: ph / k }
    L.blank = false
    if (L.c.width !== pw) L.c.width = pw
    if (L.c.height !== ph) L.c.height = ph
    Object.assign(L.c.style, { left: `${x}px`, top: `${y}px`, width: `${L.box.w}px`, height: `${L.box.h}px` })
  }
  // lo pulisce e lo porta alle coordinate della scena
  const begin = (L) => {
    const { ctx, k, box } = L
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, L.c.width, L.c.height)
    ctx.setTransform(k, 0, 0, k, -box.x * k, -box.y * k)
    return ctx
  }

  // I pezzi rimpiccioliti una volta sola alla misura a cui si disegnano, a metà
  // per volta (un salto solo perderebbe dettagli): ogni fotogramma poi copia
  // pixel quasi uno a uno, nitidi come le <image> dell'SVG di prima.
  const shrink = () => {
    if (!place) return
    for (const [id, im] of Object.entries(images)) {
      const p = parts[id]
      if (!im.img.complete || !im.img.naturalWidth) continue
      const s = Math.min(1, place.S * p.scale * cray.k * 1.1)
      if (im.bitmap && Math.abs(im.scale - s) < 0.01) continue
      const tw = Math.max(1, Math.round(p.w * s))
      const th = Math.max(1, Math.round(p.h * s))
      let src = im.img
      let [w, h] = [im.img.naturalWidth, im.img.naturalHeight]
      for (;;) {
        const last = w / 2 < tw
        ;[w, h] = last ? [tw, th] : [Math.round(w / 2), Math.round(h / 2)]
        const c = document.createElement('canvas')
        c.width = w
        c.height = h
        const ctx = c.getContext('2d')
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(src, 0, 0, w, h)
        src = c
        if (last) break
      }
      im.bitmap = src
      im.scale = s
    }
  }

  // Fin dove arriva l'aragosta dal perno su cui si inclina, in pixel del corpo,
  // qualunque angolo prendano i pezzi: al risveglio la coda scatta di 80° e
  // le antenne di 50°, e il canvas non deve tagliarle.
  const extent = (() => {
    const dist = (p, [x, y]) => (p.parent ? dist(parts[p.parent], p.at) + Math.hypot(x - p.pin[0], y - p.pin[1]) * p.scale : Math.hypot(x - aragosta.pivot[0], y - aragosta.pivot[1]))
    let r = 0
    for (const p of Object.values(parts)) for (const c of [[0, 0], [p.w, 0], [0, p.h], [p.w, p.h]]) r = Math.max(r, dist(p, c))
    return r
  })()

  // L'aragosta sta sopra l'etichetta, grande in proporzione al nome; nella posa
  // «versa» il beccuccio cade poco a destra della prima I. Se a destra non c'è
  // posto (tablet, telefono) si rimpicciolisce.
  let place = null
  const placeCrayfish = () => {
    const g = geo
    const pv = { ...poses.versa }
    const at0 = chain(parts, rootM(0, 0, 1, pv), pv)
    const tip = at(at0.annaffiatoio, aragosta.spout.tip)
    // ingombro a destra (la coda, a riposo)
    const rest = chain(parts, rootM(0, 0, 1, poses.dorme), poses.dorme)
    let right = -Infinity
    for (const p of Object.values(parts)) for (const c of [[0, 0], [p.w, 0], [0, p.h], [p.w, p.h]]) right = Math.max(right, at(rest[p.id], c)[0])
    const aim = g.pour + 0.17 * g.fs
    let S = clamp(g.fs * 0.00165, 0.13, 0.3)
    S = Math.min(S, (g.right - aim) / Math.max(1, right - tip[0]))
    const X = aim - S * tip[0]
    const Y = g.bedTop + 1 - S * aragosta.ground
    // il riquadro del canvas: un quadrato intorno al perno, con il margine del salto
    const half = S * extent * 1.15 + 6
    const cx = X + S * aragosta.pivot[0]
    const cy = Y + S * aragosta.pivot[1]
    // a riposo: dove sta l'aragosta che dorme (il respiro parte dal suo fondo, il tocco la sveglia)
    const sleep = chain(parts, rootM(X, Y, S, poses.dorme), poses.dorme)
    let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity]
    for (const p of Object.values(parts))
      for (const c of [[0, 0], [p.w, 0], [0, p.h], [p.w, p.h]]) {
        const [x, y] = at(sleep[p.id], c)
        ;[x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)]
      }
    place = { X, Y, S, box: { x: cx - half, y: cy - half, w: 2 * half, h: 2 * half }, rest: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } }
  }

  // ── Stato ──
  const P = {} // posa attuale: valore e velocità di ogni parametro
  for (const k of Object.keys(poses.dorme)) P[k] = { v: poses.dorme[k], s: 0 }
  let state = 'dorme'
  let since = 0 // da quando è nello stato attuale (s)
  let clock = 0
  let filledOnce = false
  let leakTo = 0
  let blinkAt = 3
  let blink = 0
  let startle = 0
  let lookX = null
  let lookY = null
  let stream = null // { head, tail, flow, len }
  let jet = null // il poligono del getto in questo fotogramma (vedi shapeJet)
  let bangUntil = 0 // fin quando si vede il «!» del risveglio (s, sull'orologio della scena)
  let marksAt = '' // dove stanno le z e il «!» (la trasformazione scritta)
  const splashes = []
  const drops = []
  const stains = []
  let lastActive = performance.now()
  let inView = true
  let running = false
  let started = false
  const visible = () => inView && !document.hidden
  let raf = 0
  let prev = 0
  let here = null // dov'è la scena sullo schermo: { x, y, z } e velocità vx, vy
  let pointer = null

  const go = (s) => {
    state = s
    since = 0
    wrap.dataset.ink = s
    if (s === 'sveglia') {
      startle = 1
      P.y.s -= 520 // il salto
      P.coda.s -= 900 // la coda scatta come quando scappano
      P.antenna.s -= 320
      P.antenna2.s -= 260
      bang.classList.remove('is-on')
      void bang.getBoundingClientRect()
      bang.classList.add('is-on')
      bangUntil = clock + 1
    }
    if (s === 'perde') leakTo = geo.depth * rnd(0.56, 0.68)
  }

  // ── Disegno ──
  // il liquido nelle lettere: il corpo sfumato, il riflesso e il pelo chiaro,
  // il getto che entra dalla I e gli spruzzi (il canvas è ritagliato dalla parola)
  const drawPool = () => {
    const g = geo
    const L = liquid
    const { n, dx, h } = L
    const ctx = begin(pool)
    const surface = () => {
      ctx.beginPath()
      for (let i = 0; i < n; i++) ctx[i ? 'lineTo' : 'moveTo'](g.x0 + (i + 0.5) * dx, g.bottom - h[i])
    }
    ctx.beginPath()
    ctx.moveTo(g.x0, g.bottom + 4)
    ctx.lineTo(g.x0, g.bottom - h[0])
    for (let i = 0; i < n; i++) ctx.lineTo(g.x0 + (i + 0.5) * dx, g.bottom - h[i])
    ctx.lineTo(g.x1, g.bottom - h[n - 1])
    ctx.lineTo(g.x1, g.bottom + 4)
    ctx.closePath()
    const top = g.bottom - L.mean - 3
    const grad = ctx.createLinearGradient(0, top, 0, top + Math.max(24, g.depth))
    for (const [o, c] of [[0, '#283150'], [0.12, '#191d2b'], [0.5, '#12151f'], [1, '#0b0c10']]) grad.addColorStop(o, c)
    ctx.fillStyle = grad
    ctx.fill()
    ctx.lineJoin = 'round'
    // il riflesso, appena sotto il pelo, e il pelo: un filo chiaro
    ctx.save()
    ctx.translate(0, 2.2 * g.k + 0.8)
    surface()
    ctx.strokeStyle = 'rgb(255 255 255 / 0.13)'
    ctx.lineWidth = 2.4
    ctx.stroke()
    ctx.restore()
    surface()
    ctx.strokeStyle = 'rgb(128 148 205 / 0.6)'
    ctx.lineWidth = 1
    ctx.stroke()
    if (jet) {
      ctx.fillStyle = INK
      ctx.fill(jet.shape)
    }
    if (splashes.length) {
      ctx.fillStyle = '#1d2336'
      ctx.beginPath()
      for (const q of splashes) {
        ctx.moveTo(q.x + q.r, q.y)
        ctx.arc(q.x, q.y, q.r, 0, 2 * Math.PI)
      }
      ctx.fill()
    }
  }

  // il getto: una parabola dal beccuccio alla cima della I, poi dritto fino al pelo del liquido
  const jetPath = (S0, dir) => {
    const g = geo
    const E = [g.pour, g.top]
    const F = [g.pour, g.bottom - liquid.at(g.pour - g.x0)]
    const dxs = E[0] - S0[0]
    let C
    if (dir[0] * dxs > 0) {
      const kk = dxs / (2 * dir[0])
      C = [S0[0] + dir[0] * kk, S0[1] + dir[1] * kk]
    } else C = [(S0[0] + E[0]) / 2, S0[1]]
    const pts = []
    const N = 18
    for (let i = 0; i <= N; i++) {
      const t = i / N
      pts.push([(1 - t) * (1 - t) * S0[0] + 2 * (1 - t) * t * C[0] + t * t * E[0], (1 - t) * (1 - t) * S0[1] + 2 * (1 - t) * t * C[1] + t * t * E[1]])
    }
    const inside = Math.max(0, F[1] - E[1])
    const M = Math.max(2, Math.ceil(inside / 10))
    for (let i = 1; i <= M; i++) pts.push([E[0], E[1] + (inside * i) / M])
    // lunghezze cumulate
    const len = [0]
    for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]))
    return { pts, len, E, F }
  }

  // il filo del getto in questo fotogramma: il poligono (dentro e fuori dalla
  // lettera è lo stesso) e il riflesso sopra la cima della I
  const shapeJet = (t) => {
    const total = stream ? stream.path.len.at(-1) : 0
    const a = stream ? Math.min(stream.tail, total) : 0
    const b = stream ? Math.min(stream.head, total) : 0
    if (b - a < 0.5) return null
    const g = geo
    const { pts, len, E } = stream.path
    const w0 = (4.6 * g.k + 1.2) * (0.35 + 0.65 * stream.flow)
    const left = []
    const right = []
    const mid = []
    const steps = 26
    for (let s = 0; s <= steps; s++) {
      const L = a + ((b - a) * s) / steps
      let i = 1
      while (i < len.length - 1 && len[i] < L) i++
      const u = (L - len[i - 1]) / (len[i] - len[i - 1] || 1)
      const x = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u
      const y = pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u
      let tx = pts[i][0] - pts[i - 1][0]
      let ty = pts[i][1] - pts[i - 1][1]
      const tl = Math.hypot(tx, ty) || 1
      ;(tx /= tl), (ty /= tl)
      const q = L / total
      // il getto si assottiglia cadendo e ondeggia appena (instabilità del filo liquido)
      const w = w0 * (1 - 0.42 * q) * (1 + 0.1 * Math.sin(L * 0.21 - t * 26))
      const wob = Math.sin(L * 0.05 - t * 9) * q * 1.1 * g.k
      const cx = x - ty * wob
      const cy = y + tx * wob
      left.push([cx - ty * w * 0.5, cy + tx * w * 0.5])
      right.push([cx + ty * w * 0.5, cy - tx * w * 0.5])
      mid.push([cx + ty * w * 0.18, cy - tx * w * 0.18])
    }
    const shape = new Path2D()
    left.forEach(([x, y], i) => shape[i ? 'lineTo' : 'moveTo'](x, y))
    for (let i = right.length - 1; i >= 0; i--) shape.lineTo(right[i][0], right[i][1])
    shape.closePath()
    return { shape, top: E[1], shine: mid.filter((p) => p[1] < E[1]), shineWidth: Math.max(0.6, w0 * 0.2) }
  }

  // sopra il contorno: le macchie sull'etichetta, le gocce sotto le lettere e
  // quelle che cadono, il getto fuori dalla lettera (entra dall'apertura della I)
  const drawFx = () => {
    const g = geo
    const blank = !jet && !drops.length && !stains.length && !g.leaks.some((l) => l.bead)
    if (blank && fx.blank) return // vuoto ora e vuoto prima: niente da ridisegnare
    fx.blank = blank
    const ctx = begin(fx)
    ctx.fillStyle = INK
    for (const st of stains) {
      ctx.globalAlpha = Math.max(0, st.o)
      ctx.beginPath()
      ctx.ellipse(st.x, st.y, st.rx, st.ry, 0, 0, 2 * Math.PI)
      ctx.fill()
    }
    ctx.globalAlpha = 1
    for (const l of g.leaks) {
      if (!l.bead) continue
      const r = l.bead
      const p = l.acc / l.max
      const y0 = l.y
      const cy = y0 + r * (0.9 + 1.1 * p)
      const a = r * 0.55
      ctx.beginPath()
      ctx.moveTo(l.x - a, y0)
      ctx.bezierCurveTo(l.x - a, y0 + (cy - y0) * 0.5, l.x - r, cy - r * 0.7, l.x - r, cy)
      ctx.arc(l.x, cy, r, Math.PI, 0, true)
      ctx.bezierCurveTo(l.x + r, cy - r * 0.7, l.x + a, y0 + (cy - y0) * 0.5, l.x + a, y0)
      ctx.closePath()
      ctx.fill()
    }
    for (const q of drops) {
      const ry = q.r * (1 + Math.min(1.6, q.vy / 900))
      const rx = q.r * (1 - Math.min(0.3, q.vy / 3000))
      ctx.beginPath()
      ctx.ellipse(q.x, q.y, rx, ry, 0, 0, 2 * Math.PI)
      ctx.fill()
    }
    if (!jet) return
    // il getto «fuori» è tagliato all'altezza della cima della I
    ctx.save()
    ctx.beginPath()
    ctx.rect(fx.box.x, fx.box.y, fx.box.w, jet.top + 1.5 - fx.box.y)
    ctx.clip()
    ctx.fill(jet.shape)
    ctx.restore()
    if (jet.shine.length > 1) {
      ctx.beginPath()
      jet.shine.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](x, y))
      ctx.strokeStyle = 'rgb(178 196 240 / 0.5)'
      ctx.lineWidth = jet.shineWidth
      ctx.lineCap = 'round'
      ctx.stroke()
    }
  }

  // la posa di questo fotogramma: matrici dei pezzi, palpebre e pupille; le z e
  // il «!» seguono la testa finché si vedono (nel sonno e subito dopo il risveglio)
  const drawCrayfish = () => {
    if (!place) return
    const pose = {}
    for (const k in P) pose[k] = P[k].v
    const M = chain(parts, rootM(place.X, place.Y, place.S, pose), pose)
    const lid = clamp(Math.max(pose.lid, blink), 0, 1)
    const inv = invert(M.corpo)
    for (const e of eyes) {
      e.ly = e.y - e.ry - 2 + (2 * e.ry + 4) * lid + (lid > 0.98 ? e.ry : 0)
      e.crease = smooth(0.85, 1, lid)
      // la pupilla guarda il punto (lookX, lookY), nelle coordinate del corpo
      let tx = 0
      let ty = 0
      if (lookX !== null) {
        const [bx, by] = at(inv, [lookX, lookY])
        const dx = bx - e.x
        const dy = by - e.y
        const dist = Math.hypot(dx, dy) || 1
        const reach = Math.min(e.rx, e.ry) * 0.5 * Math.min(1, dist / (e.rx * 4))
        tx = (dx / dist) * reach
        ty = (dy / dist) * reach
      }
      e.px += (tx - e.px) * 0.35
      e.py += (ty - e.py) * 0.35
      e.r = Math.min(e.rx, e.ry) * (0.44 - 0.2 * startle)
    }
    if (state === 'dorme' || clock < bangUntil) {
      const [hx, hy] = at(M.corpo, [150, -10])
      const t = `translate(${f1(hx)}px, ${f1(hy)}px)`
      if (t !== marksAt) marks.style.transform = marksAt = t
    }
    paintCrayfish(M)
    return M
  }

  const paintCrayfish = (M) => {
    const ctx = begin(cray)
    const { k, box } = cray
    for (const node of nodes) {
      const im = images[node.part]
      if (!im.bitmap) continue
      const p = parts[node.part]
      ctx.setTransform(k, 0, 0, k, -box.x * k, -box.y * k)
      ctx.transform(...M[node.part])
      if (node.presa) {
        const [x, y, w, h] = aragosta.presa.clip
        ctx.save()
        ctx.beginPath()
        ctx.rect(x, y, w, h)
        ctx.clip()
      }
      ctx.drawImage(im.bitmap, 0, 0, p.w, p.h)
      if (node.presa) ctx.restore()
      else if (node.part === 'corpo') paintEyes(ctx)
    }
  }

  // gli occhi, nelle coordinate del corpo
  const paintEyes = (ctx) => {
    for (const e of eyes) {
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.ellipse(e.x, e.y, e.rx, e.ry, 0, 0, 2 * Math.PI)
      ctx.fill()
      ctx.fillStyle = '#10110f'
      ctx.beginPath()
      ctx.arc(e.x + e.px, e.y + e.py, e.r, 0, 2 * Math.PI)
      ctx.fill()
      // la palpebra, ritagliata dall'occhio
      const bulge = e.ry * 0.28
      ctx.save()
      ctx.beginPath()
      ctx.ellipse(e.x, e.y, e.rx + 0.6, e.ry + 0.6, 0, 0, 2 * Math.PI)
      ctx.clip()
      ctx.beginPath()
      ctx.moveTo(e.x - e.rx - 3, e.y - e.ry - 3)
      ctx.lineTo(e.x + e.rx + 3, e.y - e.ry - 3)
      ctx.lineTo(e.x + e.rx + 3, e.ly)
      ctx.quadraticCurveTo(e.x, e.ly + bulge * 2, e.x - e.rx - 3, e.ly)
      ctx.closePath()
      ctx.fillStyle = e.skin
      ctx.fill()
      ctx.strokeStyle = '#10110f'
      ctx.lineWidth = 3
      ctx.stroke()
      ctx.restore()
      // la piega dell'occhio chiuso
      if (e.crease > 0) {
        ctx.globalAlpha = e.crease
        ctx.beginPath()
        ctx.moveTo(e.x - e.rx * 0.62, e.y + e.ry * 0.05)
        ctx.quadraticCurveTo(e.x, e.y + e.ry * 0.62, e.x + e.rx * 0.62, e.y + e.ry * 0.05)
        ctx.lineWidth = 3.2
        ctx.lineCap = 'round'
        ctx.stroke()
        ctx.lineCap = 'butt'
        ctx.globalAlpha = 1
      }
    }
  }

  // tutti gli strati insieme (dopo un ridimensionamento, che svuota i canvas)
  const drawAll = () => {
    drawPool()
    drawFx()
    drawCrayfish()
  }

  const invert = (m) => {
    const det = m[0] * m[3] - m[1] * m[2] || 1
    return [m[3] / det, -m[1] / det, -m[2] / det, m[0] / det, (m[2] * m[5] - m[3] * m[4]) / det, (m[1] * m[4] - m[0] * m[5]) / det]
  }

  // ── Un fotogramma ──
  const tick = (now) => {
    raf = 0
    const dt = clamp((now - (prev || now)) / 1000, 0, 1 / 20)
    prev = now
    if (!geo || !visible()) return (running = false)
    clock += dt
    since += dt
    const g = geo
    const L = liquid

    // lo scroll scuote il recipiente: l'accelerazione della pagina spinge il
    // liquido di lato e cambia per un attimo il suo peso
    const R = wrap.getBoundingClientRect()
    const zz = R.width / (wrap.offsetWidth || R.width) || 1
    const pos = { x: R.left / zz, y: R.top / zz, z: zz }
    let accX = 0
    let accY = 0
    let v = 0
    if (here && dt) {
      const vx = (pos.x - here.x) / dt
      const vy = (pos.y - here.y) / dt
      accX = (vx - here.vx) / dt
      accY = (vy - here.vy) / dt
      pos.vx = here.vx + (vx - here.vx) * 0.5
      pos.vy = here.vy + (vy - here.vy) * 0.5
      v = Math.hypot(vx, vy)
    } else (pos.vx = 0), (pos.vy = 0)
    here = pos
    // in su e in giù (la pagina che scorre) il liquido non sciaborderebbe: lo
    // spinge di lato e ne cambia per un attimo il peso; di lato (il piano di
    // /stile/ trascinato) resta indietro come in un vassoio
    const ax = clamp(-accY * 0.07 - accX * 0.5, -1200, 1200)
    const gEff = G * (1 + clamp(-accY / 30000, -0.3, 0.3))

    // ── Stati ──
    const idle = performance.now() - lastActive
    const level = L.mean
    if (state === 'dorme' && idle > IDLE && !still) go('sveglia')
    else if (state === 'sveglia' && since > 0.6) go('versa')
    else if (state === 'versa' && level >= g.full) go('posa')
    else if (state === 'posa' && since > 0.6) go('piena')
    else if (state === 'piena' && since > HOLD) go('perde')
    else if (state === 'perde' && level <= leakTo) go('versa')
    startle = Math.max(0, startle - dt * 1.6)

    // ── Posa: molle verso quella dello stato, più il respiro e i piccoli gesti ──
    const target = { ...(state === 'dorme' ? poses.dorme : state === 'versa' ? poses.versa : state === 'perde' ? poses.guarda : poses.sveglia) }
    // (il respiro nel sonno lo fa il CSS: così, a riposo, il ciclo si può fermare)
    if (state !== 'dorme') {
      target.antenna += Math.sin(clock * 2.3) * 5
      target.antenna2 += Math.sin(clock * 1.9 + 2) * 6
      target.y += Math.sin(clock * 3.1) * 1.2
      if (state === 'piena') target.chela2 += Math.sin(clock * 5) * 3 * smooth(0.3, 1, Math.sin(clock * 0.7))
      if (state === 'versa') target.annaffiatoio += Math.sin(clock * 7) * 1.5
    }
    for (const k in P) {
      const soft = k.startsWith('antenna') ? [45, 5] : k === 'coda' ? [120, 11] : k === 'y' ? [140, 13] : k === 'lid' ? [900, 60] : [80, 13]
      const p = P[k]
      p.s += ((target[k] - p.v) * soft[0] - p.s * soft[1]) * dt
      p.v += p.s * dt
    }
    if (state === 'sveglia' && since < 0.12) P.lid.v = Math.max(0, 1 - since / 0.08)
    // battiti di palpebre (da sveglia)
    if (state !== 'dorme' && state !== 'sveglia') {
      blinkAt -= dt
      if (blinkAt < 0) (blink = 1), (blinkAt = rnd(2.5, 6))
    }
    blink = Math.max(0, blink - dt * 7)

    const M = drawCrayfish()

    // ── Il getto ──
    const tilt = -(P.r.v + P.chela.v + P.annaffiatoio.v) // di quanto è inclinato l'annaffiatoio
    const flow = state === 'versa' || state === 'posa' ? smooth(30, 48, tilt) : 0
    const spout = at(M.annaffiatoio, aragosta.spout.tip)
    const dm = M.annaffiatoio
    let dir = [dm[0] * aragosta.spout.dir[0] + dm[2] * aragosta.spout.dir[1], dm[1] * aragosta.spout.dir[0] + dm[3] * aragosta.spout.dir[1]]
    const dl = Math.hypot(...dir) || 1
    dir = [dir[0] / dl, dir[1] / dl]
    const fall = 900 * Math.sqrt(g.k)
    if (flow > 0.02 && !stream) stream = { head: 0, tail: 0, flow, attached: true }
    if (stream) {
      stream.path = jetPath(spout, dir)
      const total = stream.path.len.at(-1)
      stream.head = Math.min(total, stream.head + fall * dt)
      if (flow > 0.02 && stream.attached) stream.flow = flow
      else stream.attached = false
      if (!stream.attached) stream.tail += fall * dt
      const hits = stream.head >= total - 0.5 && stream.tail < total
      if (hits) {
        const Q = ((g.full * g.width) / FILL) * stream.flow * (filledOnce ? 0.75 : 1)
        const vol = Q * dt
        L.add(g.pour - g.x0, 0.05 * g.fs, vol)
        L.push(g.pour - g.x0, 0.1 * g.fs, 900 * stream.flow * dt)
        // spruzzi dentro la I
        if (Math.random() < 34 * dt * stream.flow) {
          const sy2 = g.bottom - L.at(g.pour - g.x0)
          splashes.push({ x: g.pour + rnd(-1.5, 1.5) * g.k, y: sy2, vx: rnd(-55, 55) * g.k, vy: -rnd(140, 320) * Math.sqrt(g.k), r: rnd(1, 2.1) * Math.max(0.6, g.k) })
        }
      }
      if (stream.tail >= total) stream = null
    }
    if (L.mean > g.full * 1.015) {
      const s = (g.full * 1.015) / L.mean
      for (let i = 0; i < L.n; i++) L.h[i] *= s
    }
    if (state === 'piena' || state === 'perde' || state === 'versa') filledOnce ||= L.mean >= g.full * 0.98

    // ── Perdite dal fondo delle lettere ──
    const leaking = state === 'perde' || (state === 'dorme' && filledOnce && L.mean > g.depth * 0.5 + 0.5)
    const rate = (((g.full - g.depth * 0.62) * g.width) / LEAK / g.leaks.length) * 1.15
    for (const l of g.leaks) {
      if (leaking) {
        const hl = L.at(l.x - g.x0)
        const got = L.take(l.x - g.x0, rate * Math.sqrt(clamp(hl / g.depth, 0, 1.2)) * dt)
        if (!l.max || l.max === 1) l.max = rate * rnd(0.32, 0.55)
        l.acc += got
      }
      const rMax = 2.1 * g.k + 1.1
      if (l.acc > 0) l.bead = rMax * (0.3 + 0.7 * Math.min(1, l.acc / l.max))
      else if (l.bead) l.bead = Math.max(0, l.bead - dt * 4)
      if (l.acc >= l.max) {
        drops.push({ x: l.x, y: l.y + l.bead * 2.2, r: l.bead * 0.95, vy: 60 })
        l.acc = 0
        l.bead = rMax * 0.35
        l.max = rate * rnd(0.32, 0.55)
      }
      if (!leaking && l.acc === 0) l.bead = Math.max(0, (l.bead || 0) - dt * 6)
    }
    const gDrop = 5200 * Math.sqrt(g.k)
    for (let i = drops.length - 1; i >= 0; i--) {
      const q = drops[i]
      q.vy += gDrop * dt
      q.y += q.vy * dt
      if (q.y + q.r >= g.rule) {
        drops.splice(i, 1)
        stains.push({ x: q.x + rnd(-1, 1), y: g.rule + 0.5, rx: q.r * rnd(1.6, 2.2), ry: q.r * 0.55, o: 0.85, born: clock })
        if (stains.length > 40) stains.shift()
        for (let s = 0; s < 3; s++) splashes.push({ x: q.x, y: g.rule - 0.5, vx: rnd(-90, 90) * g.k, vy: -rnd(90, 200) * Math.sqrt(g.k), r: q.r * rnd(0.25, 0.4), free: true })
      }
    }
    for (let i = stains.length - 1; i >= 0; i--) {
      stains[i].o = 0.85 * (1 - (clock - stains[i].born) / 7)
      if (stains[i].o <= 0) stains.splice(i, 1)
    }
    for (let i = splashes.length - 1; i >= 0; i--) {
      const q = splashes[i]
      q.vy += 2600 * Math.sqrt(g.k) * dt
      q.x += q.vx * dt
      q.y += q.vy * dt
      const floor = q.free ? g.rule + 2 : g.bottom - L.at(q.x - g.x0)
      if (q.vy > 0 && q.y > floor) splashes.splice(i, 1)
    }

    // ── Il puntatore mescola, lo scroll scuote ──
    if (pointer && pointer.moved && L.mean > 1) {
      const px = (pointer.x - R.left) / zz
      const py = (pointer.y - R.top) / zz
      if (px > g.x0 && px < g.x1 && py > g.top - 0.15 * g.fs && py < g.bottom + 0.1 * g.fs) L.push(px - g.x0, 0.12 * g.fs, clamp((pointer.vx / zz) * 0.05, -60, 60), false)
      pointer.moved = false
    }
    if (Math.abs(v) > 30 && L.mean > 1) for (let s = 0; s < 3; s++) L.push(rnd(0, g.width), 0.08 * g.fs, rnd(-1, 1) * Math.min(40, Math.abs(v) * 0.015))

    const hmax = Math.max(g.full, 1)
    const cfl = (0.4 * L.dx) / Math.sqrt(gEff * hmax + 1)
    const n = Math.min(40, Math.ceil(dt / cfl))
    for (let s = 0; s < n; s++) L.step(dt / n, gEff, ax, 1.5)

    // ── Dove guarda ──
    if (state === 'versa' && stream) (lookX = g.pour), (lookY = g.bottom - L.at(g.pour - g.x0))
    else if (state === 'perde') {
      const q = drops.at(-1)
      const l = g.leaks.reduce((a, b) => ((b.bead || 0) > (a.bead || 0) ? b : a))
      ;[lookX, lookY] = q ? [q.x, q.y] : [l.x, l.y + 6]
    } else if (pointer && performance.now() - pointer.t < 3000) (lookX = (pointer.x - R.left) / zz), (lookY = (pointer.y - R.top) / zz)
    else if (state === 'sveglia') lookX = lookY = null
    else (lookX = g.x0 + g.width * (0.5 + 0.4 * Math.sin(clock * 0.5))), (lookY = g.top)

    jet = shapeJet(clock)
    drawPool()
    drawFx()

    const settled = Object.keys(P).every((k) => Math.abs(P[k].v - target[k]) < 0.05 && Math.abs(P[k].s) < 0.05)
    const calm = state === 'dorme' && settled && !stream && !drops.length && !splashes.length && !stains.length && L.energy() < 4 && !leaking && Math.abs(v) < 1
    if (calm) return (running = false)
    raf = requestAnimationFrame(tick)
  }

  const wake = () => {
    if (running || !geo || !visible()) return
    running = true
    prev = 0
    raf = requestAnimationFrame(tick)
  }

  // ── Eventi ──
  const active = () => {
    lastActive = performance.now()
    wake()
  }
  addEventListener('scroll', active, { passive: true })
  addEventListener('keydown', active)
  addEventListener('wheel', active, { passive: true })
  addEventListener('touchstart', active, { passive: true })
  addEventListener(
    'pointermove',
    (e) => {
      const t = performance.now()
      if (pointer) pointer.vx = ((e.clientX - pointer.x) / Math.max(1, t - pointer.t)) * 1000
      pointer = { x: e.clientX, y: e.clientY, t, vx: pointer?.vx || 0, moved: true }
      active()
    },
    { passive: true },
  )
  // svegliarla a mano: un tocco sull'aragosta che dorme
  hit.addEventListener('click', () => {
    if (state !== 'dorme' || still) return
    go('sveglia')
    wake()
  })
  // ferma, si addormenta a sonno pieno: basta un timer che la svegli
  setInterval(() => {
    if (state === 'dorme' && performance.now() - lastActive > IDLE) wake()
  }, 500)

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      ([e]) => {
        inView = e.isIntersecting
        // chi non la guarda la fa riaddormentare
        if (!inView && state !== 'dorme') {
          go('dorme')
          stream = null
          for (const k in P) (P[k].v = poses.dorme[k]), (P[k].s = 0)
        }
        if (inView) wake()
      },
      { threshold: 0.15 },
    ).observe(word)
  }
  document.addEventListener('visibilitychange', wake)

  // misure nuove (la scena ridimensionata, o lo zoom del piano di /stile/): i
  // canvas ripartono vuoti e si ridisegna tutto
  let pending = 0
  const relayout = () => {
    cancelAnimationFrame(pending)
    pending = requestAnimationFrame(() => {
      if (started && layout()) {
        drawAll()
        wake()
      }
    })
  }
  new ResizeObserver(relayout).observe(wrap)
  // Il piano di /stile/ ingrandisce con una trasformazione, che il ResizeObserver
  // non vede: quando si ferma (perde .is-moving), se lo zoom è cambiato parecchio
  // i canvas si rifanno alla nuova scala. Durante il movimento li scala il
  // compositore, come i livelli del piano.
  const plane = wrap.closest('[data-canvas]')
  if (plane)
    new MutationObserver(() => {
      if (!geo || plane.classList.contains('is-moving')) return
      const z = wrap.getBoundingClientRect().width / (wrap.offsetWidth || 1)
      if (Math.abs(z - geo.z) > 0.15 * geo.z) relayout()
    }).observe(plane, { attributes: true, attributeFilter: ['class'] })

  // i pezzi arrivano dalla rete: quando ci sono si rimpiccioliscono e l'aragosta si ridisegna
  Promise.all(Object.values(images).map(({ img }) => img.decode().catch(() => {}))).then(() => {
    shrink()
    if (started) drawCrayfish()
  })

  // parte dopo i caratteri e dopo che il nome è salito al suo posto
  const ready = Promise.all([document.fonts?.ready, ...word.getAnimations().map((a) => a.finished.catch(() => {}))])
  Promise.race([ready, new Promise((r) => setTimeout(r, 2500))]).then(() => {
    if (!layout()) return
    started = true
    drawAll()
    wrap.classList.add('is-inked')
    wrap.dataset.ink = state
    if (still) return
    lastActive = performance.now()
    wake()
  })

  // per le prove in locale (npm run dev): window.__ink.state, .level (1 = pieno fino
  // all'orlo), .go('versa'); con più scene nella pagina, window.__inks[n]
  if (import.meta.env?.DEV) {
    ;(window.__inks ||= [])[n] = window.__ink = {
      go,
      get state() {
        return state
      },
      get level() {
        return liquid && geo ? liquid.mean / geo.depth : 0
      },
      get place() {
        return place
      },
    }
  }
}
