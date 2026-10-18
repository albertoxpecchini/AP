// I materiali della scena 3D: le trame disegnate al volo (intonaco, lastre del
// marciapiede, asfalto, le finestre dei palazzi di fronte), i rumori che le
// fanno, le mappe di normali tirate fuori dalle altezze e il profilo delle doghe
// della saracinesca, che la lamiera e i fogli attaccati sopra devono seguire.
import * as T from './lib/three.js'

// ── il rumore ────────────────────────────────────────────────────────────────
// Rumore di valori su un reticolo che si ripete ogni `periodo` celle (così le
// tele si affiancano senza giunte), con un seme; sopra, gli strati (fBm).
const hash = (x, y, seme) => {
  let h = (x * 374761393 + y * 668265263 + seme * 1274126177) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
const liscia = (t) => t * t * (3 - 2 * t)
export const rumore = (x, y, periodo, seme) => {
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = liscia(x - x0), fy = liscia(y - y0)
  const p = (i, j) => hash(((i % periodo) + periodo) % periodo, ((j % periodo) + periodo) % periodo, seme)
  const a = p(x0, y0), b = p(x0 + 1, y0), c = p(x0, y0 + 1), d = p(x0 + 1, y0 + 1)
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy
}
export const strati = (x, y, periodo, seme, ottave = 5, rugosita = 0.5) => {
  let v = 0, amp = 1, f = 1, somma = 0
  for (let o = 0; o < ottave; o++) { v += amp * rumore(x * f, y * f, periodo * f, seme + o * 17); somma += amp; amp *= rugosita; f *= 2 }
  return v / somma
}

// ── tele e mappe ─────────────────────────────────────────────────────────────
export const tela = (n, m = n) => { const c = document.createElement('canvas'); c.width = n; c.height = m; return c }
const trama = (c, colore = true, ripeti = true) => {
  const t = new T.CanvasTexture(c)
  t.wrapS = t.wrapT = ripeti ? T.RepeatWrapping : T.ClampToEdgeWrapping
  if (colore) t.colorSpace = T.SRGBColorSpace
  t.anisotropy = 8
  return t
}
// Da un campo di altezze (Float32Array n×n, valori in «metri» rispetto a lato
// metri per tela) alla mappa di normali in spazio tangente, che si ripete.
export const normaliDaAltezze = (alt, n, latoMetri, forza = 1) => {
  const c = tela(n), ctx = c.getContext('2d'), img = ctx.createImageData(n, n), d = img.data
  const passo = latoMetri / n
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const l = alt[y * n + ((x + n - 1) % n)], r = alt[y * n + ((x + 1) % n)]
    const u = alt[((y + n - 1) % n) * n + x], g = alt[((y + 1) % n) * n + x]
    const dx = ((r - l) / (2 * passo)) * forza, dy = ((g - u) / (2 * passo)) * forza
    const len = Math.hypot(dx, dy, 1)
    const i = (y * n + x) * 4
    d[i] = 128 + (-dx / len) * 127; d[i + 1] = 128 + (dy / len) * 127; d[i + 2] = 128 + (1 / len) * 127; d[i + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  return trama(c, false)
}

// L'intonaco: calce con le onde larghe della cazzuola, la grana della sabbia, i
// grumi, e il colore a chiazze della pittura vecchia. Un metro per tela.
export const intonaco = (n = 512, seme = 7) => {
  const alt = new Float32Array(n * n), c = tela(n), ctx = c.getContext('2d'), img = ctx.createImageData(n, n), d = img.data
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const u = x / n, v = y / n
    const onde = strati(u * 4, v * 4, 4, seme, 3, 0.55)
    const sabbia = strati(u * 96, v * 96, 96, seme + 3, 2, 0.5)
    const grumi = strati(u * 14, v * 14, 14, seme + 5, 2, 0.6)
    alt[y * n + x] = onde * 0.0028 + sabbia * 0.0006 + Math.max(0, grumi - 0.55) * 0.004
    const chiazze = strati(u * 3, v * 3, 3, seme + 9, 4, 0.5), fine = strati(u * 40, v * 40, 40, seme + 11, 2, 0.5)
    const l = 0.62 + (chiazze - 0.5) * 0.3 + (fine - 0.5) * 0.08
    const i = (y * n + x) * 4
    d[i] = 255 * Math.min(1, l * 1.0); d[i + 1] = 255 * Math.min(1, l * 0.94); d[i + 2] = 255 * Math.min(1, l * 0.85); d[i + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  return { map: trama(c), normalMap: normaliDaAltezze(alt, n, 1, 1), lato: 1 }
}

// Le lastre del marciapiede: due per lato (lastre da 60 cm con la fuga), la
// pietra con le venature, e la mappa delle pozzanghere (bianco = asciutto).
export const lastre = (n = 1024, seme = 21) => {
  const lato = 1.2, alt = new Float32Array(n * n), c = tela(n), ctx = c.getContext('2d'), img = ctx.createImageData(n, n), d = img.data
  const cr = tela(n), ctxr = cr.getContext('2d'), imgr = ctxr.createImageData(n, n), dr = imgr.data
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const u = x / n, v = y / n
    // la fuga fra le lastre: un canale di 12 mm, con lo spigolo smussato
    const fx = Math.abs(((u * 2) % 1) - 0.5) * lato / 2, fy = Math.abs(((v * 2) % 1) - 0.5) * lato / 2
    const bordo = Math.min(fx, fy) // distanza dallo spigolo più vicino, in metri
    const fuga = bordo < 0.006 ? -0.006 : bordo < 0.02 ? -0.006 * (1 - (bordo - 0.006) / 0.014) ** 2 : 0
    const grana = strati(u * 48, v * 48, 48, seme, 3, 0.5), vene = strati(u * 6, v * 6, 6, seme + 2, 4, 0.55)
    alt[y * n + x] = fuga + grana * 0.0012 + (vene - 0.5) * 0.002
    const l = 0.46 + (vene - 0.5) * 0.22 + (grana - 0.5) * 0.12 + (fuga < 0 ? -0.18 : 0)
    const i = (y * n + x) * 4
    d[i] = 255 * Math.min(1, l * 0.98); d[i + 1] = 255 * Math.min(1, l * 0.97); d[i + 2] = 255 * Math.min(1, l * 0.95); d[i + 3] = 255
    // pozzanghere dove la lastra è bassa: una soglia su un rumore largo
    const pozza = strati(u * 2.5, v * 2.5, 2.5, seme + 7, 3, 0.5)
    const bagnato = Math.min(1, Math.max(0, (pozza - 0.555) * 16))
    const w = 255 * (1 - bagnato)
    dr[i] = w; dr[i + 1] = w; dr[i + 2] = w; dr[i + 3] = 255
  }
  ctx.putImageData(img, 0, 0); ctxr.putImageData(imgr, 0, 0)
  return { map: trama(c), normalMap: normaliDaAltezze(alt, n, lato, 1), asciutto: trama(cr, false), lato }
}

// L'asfalto: grana fine e scura, qualche rappezzo.
export const asfalto = (n = 512, seme = 33) => {
  const alt = new Float32Array(n * n), c = tela(n), ctx = c.getContext('2d'), img = ctx.createImageData(n, n), d = img.data
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const u = x / n, v = y / n
    const grana = strati(u * 64, v * 64, 64, seme, 3, 0.5), largo = strati(u * 3, v * 3, 3, seme + 4, 3, 0.5)
    alt[y * n + x] = grana * 0.0015
    const l = 0.22 + (grana - 0.5) * 0.16 + (largo - 0.5) * 0.1
    const i = (y * n + x) * 4
    d[i] = 255 * l; d[i + 1] = 255 * l; d[i + 2] = 255 * l * 1.02; d[i + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  return { map: trama(c), normalMap: normaliDaAltezze(alt, n, 2, 0.7), lato: 2 }
}

// Le facciate dei palazzi di fronte: intonaco colorato con le finestre a
// griglia; di notte alcune si accendono (la mappa emissiva si ridisegna).
export const facciata = (larg, alt, colore, seme, piani) => {
  const n = 512, m = Math.round((n * alt) / larg)
  const c = tela(n, m), ctx = c.getContext('2d')
  const e = tela(n, m), ctxe = e.getContext('2d')
  ctx.fillStyle = colore; ctx.fillRect(0, 0, n, m)
  // sporco in basso e chiazze
  const g = ctx.createLinearGradient(0, m, 0, m * 0.75); g.addColorStop(0, 'rgba(40,30,20,.35)'); g.addColorStop(1, 'rgba(40,30,20,0)')
  ctx.fillStyle = g; ctx.fillRect(0, 0, n, m)
  for (let i = 0; i < 60; i++) {
    const x = hash(i, 1, seme) * n, y = hash(i, 2, seme) * m, r = 40 + hash(i, 3, seme) * 160
    const gg = ctx.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, `rgba(${hash(i, 4, seme) > 0.5 ? '255,255,255' : '0,0,0'},.07)`); gg.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = gg; ctx.fillRect(x - r, y - r, 2 * r, 2 * r)
  }
  ctxe.fillStyle = '#000'; ctxe.fillRect(0, 0, n, m)
  const finestre = []
  const px = n / larg, pianoH = alt / piani
  const colonne = Math.max(2, Math.round(larg / 3.2))
  for (let p = 0; p < piani; p++) for (let k = 0; k < colonne; k++) {
    const w = 1.1 * px, h = 1.6 * px
    const x = ((k + 0.5) * larg / colonne) * px - w / 2, y = m - ((p + 0.55) * pianoH) * px - h / 2
    if (p === 0 && hash(k, p, seme) < 0.4) continue // a terra, qualche negozio o portone al posto della finestra
    // la cornice, il vetro buio, la persiana socchiusa
    ctx.fillStyle = '#d9d2c4'; ctx.fillRect(x - 0.08 * px, y - 0.08 * px, w + 0.16 * px, h + 0.12 * px)
    ctx.fillStyle = '#1a1c20'; ctx.fillRect(x, y, w, h)
    ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(x, y, w, h * 0.35)
    const pers = hash(k, p + 7, seme)
    if (pers < 0.5) { ctx.fillStyle = '#5a6b4a'; ctx.fillRect(x, y, w, h * (0.3 + pers)) }
    finestre.push({ x, y, w, h, acceso: hash(k, p + 3, seme), calda: hash(k, p + 5, seme) })
  }
  const map = trama(c, true, false), emissiveMap = trama(e, true, false)
  const accendi = (quanto) => {
    ctxe.fillStyle = '#000'; ctxe.fillRect(0, 0, n, m)
    for (const f of finestre) {
      if (f.acceso > quanto) continue
      ctxe.fillStyle = f.calda > 0.3 ? '#ffd9a0' : '#cfe3ff'
      ctxe.fillRect(f.x, f.y, f.w, f.h)
      ctxe.fillStyle = 'rgba(0,0,0,.35)'; ctxe.fillRect(f.x, f.y, f.w, f.h * 0.5)
    }
    emissiveMap.needsUpdate = true
  }
  return { map, emissiveMap, accendi }
}

// Un'immagine (o un SVG) come trama di colore.
export const immagine = (src, { ripeti = false, flipY = true } = {}) => new Promise((ok, no) => {
  new T.TextureLoader().load(src, (t) => {
    t.colorSpace = T.SRGBColorSpace
    t.wrapS = t.wrapT = ripeti ? T.RepeatWrapping : T.ClampToEdgeWrapping
    t.anisotropy = 8; t.flipY = flipY
    ok(t)
  }, undefined, no)
})
// Un SVG disegnato su una tela della misura voluta (i browser lo rasterizzano
// alla grandezza chiesta, senza perdere nitidezza).
export const svgSuTela = (src, larg, alt) => new Promise((ok, no) => {
  const img = new Image()
  img.onload = () => { const c = tela(larg, alt); c.getContext('2d').drawImage(img, 0, 0, larg, alt); ok(trama(c, true, false)) }
  img.onerror = no
  img.src = src
})
// Testo scritto su una tela trasparente (cartelli, targhe).
export const scritta = (righe, { larg = 512, alt = 256, font = '700 90px "Archivo Black", sans-serif', colore = '#111', sfondo = null, giro = 0 } = {}) => {
  const c = tela(larg, alt), ctx = c.getContext('2d')
  if (sfondo) { ctx.fillStyle = sfondo; ctx.fillRect(0, 0, larg, alt) }
  ctx.fillStyle = colore; ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.translate(larg / 2, alt / 2); ctx.rotate(giro)
  const lh = parseInt(font.match(/(\d+)px/)?.[1] ?? 60) * 1.15
  righe.forEach((r, i) => ctx.fillText(r, 0, (i - (righe.length - 1) / 2) * lh))
  return trama(c, true, false)
}

// ── la saracinesca ───────────────────────────────────────────────────────────
// Il profilo delle doghe: ogni doga è bombata (5 mm) e al giunto c'è il canale
// (2 mm). La carta attaccata sopra segue la bombatura ma non entra nel canale.
export const DOGA = 0.1248 // il passo, in metri: 13 doghe nei 1475 px della foto, 2200 px per 1280 unità
export const profilo = (yDaCima, x = 0, carta = false) => {
  const u = ((yDaCima / DOGA) % 1 + 1) % 1
  const bomba = 0.005 * Math.sin(Math.PI * u) ** 0.6
  const ammacco = 0.0012 * (strati(x * 0.7 + 3.1, yDaCima * 0.7, 64, 51, 2, 0.5) - 0.5)
  if (carta) return bomba + Math.max(0, ammacco)
  const d = Math.min(u, 1 - u)
  const canale = 0.002 * Math.exp(-((d / 0.035) ** 2))
  return bomba - canale + ammacco
}
