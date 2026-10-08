// La sala della roulette: il mondo in scala nella finestra, il piano del tavolo
// in prospettiva CSS, la proiezione (la stessa del browser, rifatta in JS per
// mettere in scena cose che stanno sopra al piano: mani, pallina, torretta), i
// pezzi disegnati e il croupier.
//
// Il croupier è un burattino a pezzi fotografati (busto, braccio, avambraccio,
// due mani) ma le sue braccia vivono in tre dimensioni: spalla, gomito e polso
// sono punti (u, v, h) sopra al tavolo, la cinematica inversa li trova, la
// proiezione li porta sullo schermo e ogni pezzo viene disegnato fra due
// articolazioni proiettate: così un braccio che scende dalla spalla al tavolo si
// accorcia come fa un braccio vero visto da davanti, invece di stare aperto di
// fianco come un compasso. Le mani si muovono con il profilo di velocità dei
// movimenti umani (jerk minimo), con un piccolo arco in aria fra un punto e l'altro.

const SVG = 'http://www.w3.org/2000/svg'
export const svgEl = (tag, attrs = {}, parent) => { const e = document.createElementNS(SVG, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); if (parent) parent.appendChild(e); return e }
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
export const lerp = (a, b, t) => a + (b - a) * t
const deg = (r) => (r * 180) / Math.PI

// ── i due mondi: di lato (scrivania) e dalla testata del tavolo (telefono) ──
// pw/ph: il piano in px; ppc: px per centimetro sul piano; tilt: inclinazione
// del piano; persp e porig: la prospettiva CSS; ruota: il centro della ruota sul
// piano; croupier: dove sta (u, v in px del piano; h in cm sopra al tavolo)
export const MONDI = {
  largo: { w: 1600, h: 1000, pw: 1400, ph: 657, pdx: 0, ptop: 280, tilt: 40, persp: 1500, porig: 0.22, ppc: 5.5, orient: 'largo', ruota: { u: 330, v: 326 }, lancio: -Math.PI / 2, croupier: { u: 700, v: -28, h: 50, asse: 'u', min: 420, max: 980 }, rastrelliera: { u: 1010, v: -6 }, dolly: { u: 580, v: 40 }, console: { y: 918 } },
  alto: { w: 900, h: 1800, pw: 829, ph: 1766, pdx: -70, ptop: -6, tilt: 24, persp: 1500, porig: 0.26, ppc: 7.4, orient: 'alto', ruota: { u: 414, v: 418 }, lancio: 0, croupier: { u: 821, v: 700, h: 50, asse: 'v', min: 330, max: 1560 }, rastrelliera: { u: 806, v: 560 }, dolly: { u: 812, v: 760 }, console: { y: 1712 } },
}

export function creaScena(el) {
  const S = {
    el, M: MONDI.largo, K: 1, proj: null, inv: null, ascolta: [],
    misura() {
      const W = el.sala.clientWidth, H = el.sala.clientHeight
      S.M = W < H * 0.92 ? MONDI.alto : MONDI.largo
      const M = S.M
      S.K = Math.min(W / M.w, H / M.h)
      const r = el.mondo.style
      r.setProperty('--mw', M.w + 'px'); r.setProperty('--mh', M.h + 'px'); r.setProperty('--k', S.K)
      r.setProperty('--pw', M.pw + 'px'); r.setProperty('--ph', M.ph + 'px'); r.setProperty('--ptop', M.ptop + 'px'); r.setProperty('--pdx', M.pdx + 'px')
      r.setProperty('--tilt', M.tilt + 'deg'); r.setProperty('--persp', M.persp + 'px'); r.setProperty('--porig', M.porig * 100 + '%')
      el.piano.classList.toggle('alto', M.orient === 'alto')
      for (const s of [el.dietro, el.davanti]) s.setAttribute('viewBox', `0 0 ${M.w} ${M.h}`)
      for (const f of S.ascolta) f(M)
    },
  }
  // la proiezione: un punto del piano (u, v in px del piano) a quota h (cm) → il mondo
  S.proj = (u, v, h = 0) => {
    const M = S.M
    const hp = h * M.ppc
    const t = (M.tilt * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t)
    const dx = u - M.pw / 2, dy = v - M.ph
    const Y = M.ptop + M.ph + dy * c - hp * s
    const Z = dy * s + hp * c
    const f = M.persp / (M.persp - Z)
    const ox = M.w / 2, oy = M.porig * M.h
    return { x: ox + (M.pdx + dx) * f, y: oy + (Y - oy) * f, f }
  }
  // l'inversa, sul piano (h = 0): dal mondo al piano
  S.inv = (x, y) => {
    const M = S.M
    const t = (M.tilt * Math.PI) / 180, c = Math.cos(t), s = Math.sin(t)
    const ox = M.w / 2, oy = M.porig * M.h, P = M.persp
    const dy = (P * (y - oy - (M.ptop + M.ph - oy))) / ((y - oy) * s + P * c)
    const f = P / (P - dy * s)
    return { u: M.pw / 2 + (x - ox) / f - M.pdx, v: M.ph + dy }
  }
  // da un evento del puntatore al piano
  S.dalPuntatore = (e) => {
    const m = el.mondo.getBoundingClientRect()
    return S.inv((e.clientX - m.left) / S.K, (e.clientY - m.top) / S.K)
  }
  // la prova della proiezione contro il browser: un div sul piano misurato davvero
  S.verifica = () => {
    const d = document.createElement('div'); d.className = 'punto'; el.piano.appendChild(d)
    let max = 0
    const m = el.mondo.getBoundingClientRect()
    for (const [u, v] of [[0, 0], [S.M.pw, 0], [S.M.pw / 2, S.M.ph], [300, 300], [1100, 500]]) {
      d.style.left = u + 'px'; d.style.top = v + 'px'
      const r = d.getBoundingClientRect()
      const got = { x: (r.left - m.left) / S.K, y: (r.top - m.top) / S.K }
      const p = S.proj(u, v, 0)
      max = Math.max(max, Math.hypot(got.x - p.x, got.y - p.y))
    }
    d.remove()
    return max
  }
  return S
}

// ── orologio dell'animazione: scorre solo quando la pagina disegna ──────────
export function creaOrologio() {
  const O = { t: 0, attese: [], passi: [], ultimo: 0, dt: 0 }
  O.attendi = (s) => new Promise((ok) => O.attese.push({ t: O.t + s, ok }))
  O.frame = (nowMs) => {
    // il tempo scorre davvero anche se la pagina disegna pochi fotogrammi: il tetto serve solo alle pause lunghe
    const dt = O.ultimo ? Math.min((nowMs - O.ultimo) / 1000, 0.25) : 1 / 60
    O.ultimo = nowMs; O.t += dt; O.dt = dt
    for (const f of O.passi) f(dt, O.t)
    if (O.attese.length) { const pronte = O.attese.filter((a) => a.t <= O.t); if (pronte.length) { O.attese = O.attese.filter((a) => a.t > O.t); for (const a of pronte) a.ok() } }
  }
  return O
}

// ── i pezzi disegnati (art/pezzi.json): misure e perni ──────────────────────
export async function caricaPezzi(url) {
  try { return await (await fetch(url, { cache: 'no-store' })).json() } catch { return {} }
}

// un'immagine di un pezzo dentro un gruppo; la posa la decide piazza()
export function pezzo(parent, PZ, gruppo, nome, art) {
  const d = PZ[gruppo] && PZ[gruppo][nome]
  const g = svgEl('g', {}, parent)
  if (!d) { g.dataset.manca = `${gruppo}/${nome}`; return g }
  svgEl('image', { href: `${art}${gruppo}/${nome}.webp`, width: d.w, height: d.h, preserveAspectRatio: 'none' }, g)
  g._d = d
  g._p = (d.perni && d.perni[0]) || [0, d.h / 2]
  g._L = Math.max(40, d.w - g._p[0] - 14) // dal perno alla punta, meno la linguetta
  return g
}
/** Posa un pezzo fra due punti dello schermo: il perno in A, la punta in B, l'altezza dell'immagine lungo il vettore Wd (dal perno). */
export function piazza(g, A, B, Wd) {
  if (!g._d) return
  const d = g._d, [px, py] = g._p, L = g._L
  const ax = (B.x - A.x) / L, ay = (B.y - A.y) / L
  const bx = Wd.x / d.h, by = Wd.y / d.h
  g.setAttribute('transform', `matrix(${ax.toFixed(4)} ${ay.toFixed(4)} ${bx.toFixed(4)} ${by.toFixed(4)} ${(A.x - px * ax - py * bx).toFixed(2)} ${(A.y - px * ay - py * by).toFixed(2)})`)
}
/** Un oggetto in piedi sul piano (sprite): la base del pezzo nel punto (u, v), alto hcm centimetri. */
export function inPiedi(g, S, u, v, hcm, { dx = 0 } = {}) {
  if (!g._d) return
  const d = g._d
  const base = S.proj(u, v, 0), cima = S.proj(u, v, hcm)
  const sc = (base.y - cima.y) / d.h
  g.setAttribute('transform', `translate(${(base.x - (d.w / 2) * sc + dx * sc).toFixed(2)},${(base.y - d.h * sc).toFixed(2)}) scale(${sc.toFixed(4)})`)
  g._sc = sc
}

// ── il profilo dei movimenti umani ──────────────────────────────────────────
export const jerkMinimo = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * t * (10 + t * (-15 + 6 * t)))

// ── il croupier ─────────────────────────────────────────────────────────────
// Misure in centimetri: spalle larghe 42, braccio 30, avambraccio 27, mano 19.
const CM = { spalle: 42, L1: 30, L2: 27, mano: 19, altezza: 50 }

export function creaCroupier(S, PZ, art, O) {
  const M = () => S.M
  const dietro = S.el.dietro, davanti = S.el.davanti
  const busto = pezzo(dietro, PZ, 'croupier', 'busto', art)
  const bd = busto._d
  const spalleImg = bd && bd.perni && bd.perni.length >= 2 ? [bd.perni[0], bd.perni[1]] : [[30, 285], [344, 283]]
  const C = {
    busto, braccia: {}, u: M().croupier.u, v: M().croupier.v, h: M().croupier.h, lean: { u: 0, v: 0, h: 0 }, cammino: 0, respiro: 0,
    centroLavoro: null, // dove lavora adesso (u del piano), per camminare
  }
  // un braccio: lato −1 = il suo destro (a sinistra per chi guarda), +1 = il sinistro
  function braccio(lato) {
    const g = svgEl('g', {}, davanti)
    const ombra = svgEl('ellipse', { rx: 30, ry: 12, fill: 'rgba(0,0,0,.28)', filter: 'url(#sfoca-mano)' }, g)
    const sup = pezzo(g, PZ, 'croupier', 'braccio', art)
    const inf = pezzo(g, PZ, 'croupier', 'avambraccio', art)
    const mani = { aperta: pezzo(g, PZ, 'croupier', 'aperta', art), pinza: pezzo(g, PZ, 'croupier', 'pinza', art) }
    mani.pinza.style.display = 'none'
    const tenuto = svgEl('g', {}, g) // quello che ha in mano (pallina, dolly, fiche)
    const A = {
      lato, g, ombra, sup, inf, mani, mano: 'aperta', tenuto, oggetto: null,
      pos: { u: 0, v: 0, h: 0 }, meta: null, da: null, t0: 0, durata: 0, arco: 0, riposo: { u: 0, v: 0, h: 0 },
      polso: { x: 0, y: 0, f: 1 }, punta: { x: 0, y: 0 }, dir: { u: 0, v: 1, h: 0 }, lavora: false, spalla: { u: 0, v: 0, h: 0 }, ordine: 0,
    }
    return A
  }
  C.braccia.destro = braccio(-1)
  C.braccia.sinistro = braccio(1)
  const defs = svgEl('defs', {}, davanti)
  const filtro = svgEl('filter', { id: 'sfoca-mano', x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs)
  svgEl('feGaussianBlur', { stdDeviation: 5 }, filtro)

  // dove riposano le mani: sul bordo lontano, ai lati del busto
  function riposi() {
    const m = M()
    for (const A of Object.values(C.braccia)) A.riposo = m.croupier.asse === 'v' ? { u: m.pw - 5 * m.ppc, v: C.v + A.lato * 16 * m.ppc, h: 7 } : { u: C.u + A.lato * CM.spalle * 0.75 * m.ppc, v: m.croupier.v + 14 * m.ppc, h: 7 }
  }
  C.rimisura = () => { const m = M(); C.u = m.croupier.u; C.v = m.croupier.v; C.h = m.croupier.h; C.cammino = 0; riposi(); for (const A of Object.values(C.braccia)) { A.pos = { ...A.riposo }; A.meta = null } }
  C.rimisura()

  /** Porta una mano in (u, v, h): torna una promessa che si risolve all'arrivo. La durata segue la distanza, l'arco alza la mano a metà strada. */
  C.vai = (nome, meta, { durata, arco, mano } = {}) => {
    const A = C.braccia[nome]
    const m = M()
    const d = Math.hypot((meta.u - A.pos.u) / m.ppc, (meta.v - A.pos.v) / m.ppc, meta.h - A.pos.h) // cm
    A.da = { ...A.pos }; A.meta = { ...meta }; A.t0 = O.t
    A.durata = durata ?? clamp(0.28 + d / 110, 0.3, 1.1)
    A.arco = arco ?? clamp(d * 0.12, 0, 9)
    A.lavora = true
    if (mano) C.posaMano(nome, mano)
    A.ordine = ++ordine
    return O.attendi(A.durata)
  }
  let ordine = 0
  C.riposa = (nome, opz) => { const A = C.braccia[nome]; A.lavora = false; return C.vai(nome, A.riposo, { arco: 6, mano: 'aperta', ...opz }).then(() => { A.lavora = false }) }
  C.posaMano = (nome, quale) => { const A = C.braccia[nome]; if (A.mano === quale || !A.mani[quale]) return; A.mani[A.mano].style.display = 'none'; A.mano = quale; A.mani[quale].style.display = '' }
  /** Mette un oggetto (un gruppo svg già creato) in mano, o lo toglie (null). */
  C.tieni = (nome, g, { scala = 1, dx = 0, dy = 0 } = {}) => { const A = C.braccia[nome]; A.tenuto.innerHTML = ''; A.oggetto = g ? { g, scala, dx, dy } : null; if (g) A.tenuto.appendChild(g) }
  C.dove = (nome) => ({ ...C.braccia[nome].pos })
  C.puntaSchermo = (nome) => C.braccia[nome].punta

  // ── ogni fotogramma ──────────────────────────────────────────────────────
  function posizioneMano(A, t) {
    if (!A.meta) return A.pos
    const s = jerkMinimo((t - A.t0) / A.durata)
    const p = { u: lerp(A.da.u, A.meta.u, s), v: lerp(A.da.v, A.meta.v, s), h: lerp(A.da.h, A.meta.h, s) + A.arco * Math.sin(Math.PI * s) }
    if (s >= 1) { A.pos = { ...A.meta }; A.meta = null; return A.pos }
    A.pos = p
    return p
  }
  C.aggiorna = (dt, t) => {
    const m = M()
    const ppc = m.ppc
    // dove lavora: la media delle mani al lavoro; il croupier cammina lungo il bordo per avvicinarsi
    const alLavoro = Object.values(C.braccia).filter((A) => A.lavora && (A.meta || A.pos))
    const asse = m.croupier.asse === 'v' ? 'v' : 'u'
    let centro = null
    if (alLavoro.length) centro = alLavoro.reduce((s, A) => s + (A.meta ? A.meta[asse] : A.pos[asse]), 0) / alLavoro.length
    const voluto = centro === null ? m.croupier[asse] : clamp(centro, m.croupier.min, m.croupier.max)
    C[asse] += (voluto - C[asse]) * Math.min(1, dt / 0.55)
    riposi()
    // la sporgenza: se una mano va lontano il busto si piega verso di lei e si abbassa
    let lu = 0, lv = 0, n = 0
    for (const A of alLavoro) {
      const p = A.meta || A.pos
      const du = (p.u - C.u) / ppc, dv = (p.v - C.v) / ppc
      const d = Math.hypot(du, dv, C.h - p.h)
      const portata = (CM.L1 + CM.L2 + CM.mano * 0.6) * 0.9
      if (d > portata) { const k = Math.min(30, d - portata); lu += (du / d) * k; lv += (dv / d) * k; n++ }
    }
    const leanU = n ? lu / n : 0, leanV = n ? lv / n : 0
    const k = Math.min(1, dt / 0.35)
    C.lean.u += (leanU - C.lean.u) * k; C.lean.v += (leanV - C.lean.v) * k
    const piega = Math.hypot(C.lean.u, C.lean.v)
    C.lean.h += (Math.max(-16, -piega * 0.4) - C.lean.h) * k
    C.respiro = Math.sin(t * 1.9) * 0.4 // cm
    // le spalle in 3D (u, v in px del piano; h in cm)
    const cu = C.u + C.lean.u * ppc, cv = C.v + C.lean.v * ppc, ch = C.h + C.lean.h + C.respiro
    const inclinazione = clamp(C.lean.u / 60, -0.35, 0.35) // il busto si inclina di lato un po'
    const spalla = (lato) => ({ u: cu + lato * (CM.spalle / 2) * ppc, v: cv, h: ch - lato * inclinazione * 4 })
    const SL = spalla(-1), SR = spalla(1)
    const sl = S.proj(SL.u, SL.v, SL.h), sr = S.proj(SR.u, SR.v, SR.h)
    // il busto: i due perni delle spalle sui due punti proiettati
    if (bd) {
      const [p0, p1] = spalleImg
      const dImg = Math.hypot(p1[0] - p0[0], p1[1] - p0[1])
      const ax = (sr.x - sl.x) / dImg, ay = (sr.y - sl.y) / dImg
      const bx = -ay, by = ax
      busto.setAttribute('transform', `matrix(${ax.toFixed(4)} ${ay.toFixed(4)} ${bx.toFixed(4)} ${by.toFixed(4)} ${(sl.x - p0[0] * ax - p0[1] * bx).toFixed(2)} ${(sl.y - p0[0] * ay - p0[1] * by).toFixed(2)})`)
    }
    for (const A of Object.values(C.braccia)) {
      A.spalla = A.lato < 0 ? SL : SR
      // la mano a riposo segue il corpo quando cammina
      if (!A.meta && !A.lavora) { const kk = Math.min(1, dt / 0.25); A.pos.u += (A.riposo.u - A.pos.u) * kk; A.pos.v += (A.riposo.v - A.pos.v) * kk; A.pos.h += (A.riposo.h - A.pos.h) * kk }
      const W = posizioneMano(A, t)
      disegnaBraccio(A, W)
    }
  }

  // in cm nello spazio del tavolo (u, v convertiti in cm; h già in cm)
  function disegnaBraccio(A, Wp) {
    const m = M(), ppc = m.ppc
    const Sx = { x: A.spalla.u / ppc, y: A.spalla.v / ppc, z: A.spalla.h }
    const Wx = { x: Wp.u / ppc, y: Wp.v / ppc, z: Math.max(0.6, Wp.h) }
    let dx = Wx.x - Sx.x, dy = Wx.y - Sx.y, dz = Wx.z - Sx.z
    let d = Math.hypot(dx, dy, dz)
    const max = CM.L1 + CM.L2 - 1.5, min = Math.abs(CM.L1 - CM.L2) + 2
    if (d > max) { const k = max / d; dx *= k; dy *= k; dz *= k; d = max; Wx.x = Sx.x + dx; Wx.y = Sx.y + dy; Wx.z = Sx.z + dz }
    if (d < min) { const k = min / d; dx *= k; dy *= k; dz *= k; d = min; Wx.x = Sx.x + dx; Wx.y = Sx.y + dy; Wx.z = Sx.z + dz }
    // il gomito: sul cerchio delle soluzioni, dalla parte del «polo» (in basso e verso l'esterno)
    const ux = dx / d, uy = dy / d, uz = dz / d
    const a = (CM.L1 * CM.L1 - CM.L2 * CM.L2 + d * d) / (2 * d)
    const re = Math.sqrt(Math.max(0, CM.L1 * CM.L1 - a * a))
    let px = A.lato * 0.55, py = -0.15, pz = -1 // polo: fuori, un po' indietro, giù
    const dot = px * ux + py * uy + pz * uz
    px -= dot * ux; py -= dot * uy; pz -= dot * uz
    let pn = Math.hypot(px, py, pz)
    if (pn < 1e-4) { px = A.lato; py = 0; pz = 0; pn = 1 }
    px /= pn; py /= pn; pz /= pn
    const E = { x: Sx.x + ux * a + px * re, y: Sx.y + uy * a + py * re, z: Sx.z + uz * a + pz * re }
    // la mano: sul tavolo è piatta e continua la direzione dell'avambraccio in pianta; in aria segue l'avambraccio
    let fx = Wx.x - E.x, fy = Wx.y - E.y, fz = Wx.z - E.z
    const fn = Math.hypot(fx, fy, fz) || 1; fx /= fn; fy /= fn; fz /= fn
    const inAria = clamp((Wx.z - 2) / 14, 0, 1)
    let hx = fx, hy = fy, hz = fz * inAria
    const hn = Math.hypot(hx, hy, hz) || 1; hx /= hn; hy /= hn; hz /= hn
    const T = { x: Wx.x + hx * CM.mano, y: Wx.y + hy * CM.mano, z: Wx.z + hz * CM.mano }
    A.dir = { u: hx, v: hy, h: hz }
    // proiezioni
    const P = (p) => S.proj(p.x * ppc, p.y * ppc, p.z)
    const s = P(Sx), e = P(E), w = P(Wx), tp = P(T)
    // le larghezze: la larghezza di un pezzo sta di traverso allo sguardo (così un braccio che scende
    // dalla spalla resta largo quanto è, invece di schiacciarsi); la mano posata sul tavolo è larga nel piano.
    // Il lato del mignolo è il +y dell'immagine; per il braccio sinistro l'immagine è specchiata.
    const tt = (m.tilt * Math.PI) / 180
    const vista = { x: 0, y: -Math.sin(tt), z: -Math.cos(tt) } // la direzione dello sguardo nello spazio del tavolo
    const larg = (from, d3, g, piatto) => {
      let wx = d3.y * vista.z - d3.z * vista.y, wy = d3.z * vista.x - d3.x * vista.z, wz = d3.x * vista.y - d3.y * vista.x
      let wn = Math.hypot(wx, wy, wz); if (wn < 1e-4) { wx = -1; wy = 0; wz = 0; wn = 1 } wx /= wn; wy /= wn; wz /= wn
      let px = -d3.y, py = d3.x, pz = 0
      const pn = Math.hypot(px, py); if (pn < 1e-4) { px = wx; py = wy; pz = wz } else { px /= pn; py /= pn }
      if (px * wx + py * wy + pz * wz < 0) { px = -px; py = -py; pz = -pz }
      let qx = lerp(wx, px, piatto), qy = lerp(wy, py, piatto), qz = lerp(wz, pz, piatto)
      const qn = Math.hypot(qx, qy, qz) || 1; qx /= qn; qy /= qn; qz /= qn
      const sgn = -A.lato
      const hcm = g._d ? (g._d.h / g._L) * (g === A.sup ? CM.L1 : g === A.inf ? CM.L2 : CM.mano) : 10
      const q = P({ x: from.x + sgn * qx * hcm, y: from.y + sgn * qy * hcm, z: from.z + sgn * qz * hcm })
      const f0 = P(from)
      return { x: q.x - f0.x, y: q.y - f0.y }
    }
    const dirSup = { x: (E.x - Sx.x) / CM.L1, y: (E.y - Sx.y) / CM.L1, z: (E.z - Sx.z) / CM.L1 }
    const dirInf = { x: fx, y: fy, z: fz }
    const minimo = (a, b, g, L) => { const l = Math.hypot(b.x - a.x, b.y - a.y), min = L * ppc * a.f * 0.34; if (l < min && l > 0) return { x: a.x + ((b.x - a.x) * min) / l, y: a.y + ((b.y - a.y) * min) / l }; return b }
    piazza(A.sup, s, minimo(s, e, A.sup, CM.L1), larg(Sx, dirSup, A.sup, 0))
    piazza(A.inf, e, minimo(e, w, A.inf, CM.L2), larg(E, dirInf, A.inf, 0))
    const mano = A.mani[A.mano]
    piazza(mano, w, minimo(w, tp, mano, CM.mano), larg(Wx, { x: hx, y: hy, z: hz }, mano, 1 - inAria))
    A.polso = w; A.punta = tp
    // l'ombra della mano sul tavolo
    const om = S.proj((Wx.x + hx * CM.mano * 0.5) * ppc, (Wx.y + hy * CM.mano * 0.5) * ppc, 0)
    const alt = clamp(Wx.z / 30, 0, 1)
    A.ombra.setAttribute('transform', `translate(${om.x.toFixed(1)},${om.y.toFixed(1)}) scale(${(w.f * (1 + alt * 0.8)).toFixed(3)},${(w.f * 0.6 * (1 + alt * 0.8)).toFixed(3)})`)
    A.ombra.setAttribute('opacity', (0.5 * (1 - alt * 0.7)).toFixed(2))
    // l'oggetto in mano, alla punta delle dita
    if (A.oggetto) { const o = A.oggetto; const mx = w.x + (tp.x - w.x) * 0.85 + o.dx * w.f, my = w.y + (tp.y - w.y) * 0.85 + o.dy * w.f; A.tenuto.setAttribute('transform', `translate(${mx.toFixed(1)},${my.toFixed(1)}) scale(${(w.f * o.scala).toFixed(4)})`) }
  }
  return C
}
