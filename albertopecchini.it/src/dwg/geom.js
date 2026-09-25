// Geometria di servizio per il disegno: trasformazioni affini 2D, sistema
// di coordinate dell'entità (OCS → WCS), archi e bulge delle polilinee,
// spline NURBS, ellissi, righe dei motivi di tratteggio e la tavolozza dei
// 256 colori AutoCAD (ACI).

// ── Trasformazioni affini [a, b, c, d, e, f]: x' = a·x + c·y + e, y' = b·x + d·y + f ──

export const IDENTITY = [1, 0, 0, 1, 0, 0]

export function multiply(m, n) {
  return [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]]
}

export function apply(m, x, y) {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]
}

export function translation(x, y) {
  return [1, 0, 0, 1, x, y]
}

export function rotation(a) {
  const c = Math.cos(a)
  const s = Math.sin(a)
  return [c, s, -s, c, 0, 0]
}

export function scaling(sx, sy) {
  return [sx, 0, 0, sy, 0, 0]
}

/** Se la matrice conserva gli angoli (rotazione + scala uniforme, con o senza riflessione). */
export function similarity(m) {
  const [a, b, c, d] = m
  const l1 = Math.hypot(a, b)
  const l2 = Math.hypot(c, d)
  if (l1 < 1e-12 || Math.abs(l1 - l2) > 1e-9 * Math.max(l1, l2)) return null
  const dot = a * c + b * d
  if (Math.abs(dot) > 1e-9 * l1 * l2) return null
  const det = a * d - b * c
  return { scale: l1, angle: Math.atan2(b, a), mirror: det < 0 }
}

/**
 * Sistema di coordinate dell'oggetto (OCS) → mondo, proiettato sul piano XY
 * con l'«arbitrary axis algorithm». Per l'estrusione (0,0,1) è l'identità;
 * per (0,0,-1) è uno specchio sull'asse Y.
 */
export function ocsMatrix(ext) {
  if (!ext) return IDENTITY
  const [nx, ny, nz] = ext
  if (Math.abs(nx) < 1e-9 && Math.abs(ny) < 1e-9) return nz < 0 ? [-1, 0, 0, 1, 0, 0] : IDENTITY
  let ax
  if (Math.abs(nx) < 1 / 64 && Math.abs(ny) < 1 / 64) ax = cross([0, 1, 0], ext)
  else ax = cross([0, 0, 1], ext)
  ax = norm(ax)
  const ay = norm(cross(ext, ax))
  return [ax[0], ax[1], ay[0], ay[1], 0, 0]
}

const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const norm = (a) => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1
  return [a[0] / l, a[1] / l, a[2] / l]
}

/** Punto 3D in OCS → 2D nel mondo (la z dell'OCS si proietta lungo la normale). */
export function ocsPoint(m, ext, p) {
  const [x, y] = apply(m, p[0], p[1])
  if (!ext || (Math.abs(ext[0]) < 1e-9 && Math.abs(ext[1]) < 1e-9) || !p[2]) return [x, y]
  return [x + ext[0] * p[2], y + ext[1] * p[2]]
}

// ── Archi ──────────────────────────────────────────────────────────────────

const TAU = Math.PI * 2

/** Arco (centro, raggio, angoli in radianti, antiorario) → punti, da usare quando non basta un arco vero. */
export function arcPoints(cx, cy, r, a0, a1, ccw = true, maxSeg = 0.06) {
  let sweep = ccw ? a1 - a0 : a0 - a1
  sweep = ((sweep % TAU) + TAU) % TAU
  if (sweep === 0) sweep = TAU
  const n = Math.max(2, Math.min(720, Math.ceil(sweep / maxSeg)))
  const pts = []
  for (let i = 0; i <= n; i++) {
    const a = a0 + (ccw ? 1 : -1) * (sweep * i) / n
    pts.push(cx + r * Math.cos(a), cy + r * Math.sin(a))
  }
  return pts
}

/**
 * Bulge di una polilinea → arco tra due punti: restituisce centro, raggio,
 * angolo iniziale e finale e verso (bulge > 0 = antiorario).
 */
export function bulgeArc(x0, y0, x1, y1, bulge) {
  const dx = x1 - x0
  const dy = y1 - y0
  const chord = Math.hypot(dx, dy)
  if (chord < 1e-12 || Math.abs(bulge) < 1e-12) return null
  const theta = 4 * Math.atan(bulge) // angolo al centro con segno
  const r = chord / (2 * Math.sin(Math.abs(theta) / 2))
  const mx = (x0 + x1) / 2
  const my = (y0 + y1) / 2
  const h = Math.sqrt(Math.max(0, r * r - (chord * chord) / 4))
  // la normale alla corda, verso il centro
  const s = bulge > 0 ? 1 : -1
  const nx = (-dy / chord) * s
  const ny = (dx / chord) * s
  const sign = Math.abs(theta) > Math.PI ? -1 : 1
  const cx = mx + nx * h * sign
  const cy = my + ny * h * sign
  return { cx, cy, r, a0: Math.atan2(y0 - cy, x0 - cx), a1: Math.atan2(y1 - cy, x1 - cx), ccw: bulge > 0 }
}

// ── Spline ─────────────────────────────────────────────────────────────────

/**
 * Valuta una NURBS (algoritmo di De Boor) in `samples` punti.
 * @param {number} degree
 * @param {ArrayLike<number>} knots
 * @param {number[][]} ctrl punti di controllo [x, y]
 * @param {number[]|null} weights
 */
export function nurbsPoints(degree, knots, ctrl, weights, samples) {
  const n = ctrl.length
  const p = degree
  if (n === 0) return []
  if (n <= p || knots.length < n + p + 1) return ctrl.flatMap((c) => [c[0], c[1]])
  const u0 = knots[p]
  const u1 = knots[n]
  const out = []
  const w = weights && weights.length === n ? weights : null
  for (let s = 0; s <= samples; s++) {
    const u = s === samples ? u1 : u0 + ((u1 - u0) * s) / samples
    // intervallo k con knots[k] <= u < knots[k+1]
    let k = p
    while (k < n - 1 && u >= knots[k + 1]) k++
    if (u >= u1) k = n - 1
    const d = []
    for (let j = 0; j <= p; j++) {
      const c = ctrl[k - p + j]
      const wj = w ? w[k - p + j] : 1
      d.push([c[0] * wj, c[1] * wj, wj])
    }
    for (let r = 1; r <= p; r++) {
      for (let j = p; j >= r; j--) {
        const i = k - p + j
        const den = knots[i + p - r + 1] - knots[i]
        const a = den === 0 ? 0 : (u - knots[i]) / den
        d[j] = [(1 - a) * d[j - 1][0] + a * d[j][0], (1 - a) * d[j - 1][1] + a * d[j][1], (1 - a) * d[j - 1][2] + a * d[j][2]]
      }
    }
    const ww = d[p][2] || 1
    out.push(d[p][0] / ww, d[p][1] / ww)
  }
  return out
}

/** Spline per punti di adattamento: una Catmull-Rom passante per i punti (approssima la cubica di AutoCAD). */
export function fitPoints(pts, closed, perSpan = 12) {
  const n = pts.length
  if (n < 2) return pts.flatMap((p) => [p[0], p[1]])
  const P = (i) => (closed ? pts[((i % n) + n) % n] : pts[Math.max(0, Math.min(n - 1, i))])
  const out = []
  const spans = closed ? n : n - 1
  for (let i = 0; i < spans; i++) {
    const p0 = P(i - 1)
    const p1 = P(i)
    const p2 = P(i + 1)
    const p3 = P(i + 2)
    for (let s = 0; s < perSpan; s++) {
      const t = s / perSpan
      const t2 = t * t
      const t3 = t2 * t
      out.push(
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      )
    }
  }
  const last = closed ? P(0) : pts[n - 1]
  out.push(last[0], last[1])
  return out
}

// ── Ellissi ────────────────────────────────────────────────────────────────

/** Ellisse con asse maggiore come vettore: punti tra due parametri (radianti, antiorario). */
export function ellipsePoints(cx, cy, mx, my, ratio, t0, t1, maxSeg = 0.05) {
  let sweep = t1 - t0
  sweep = ((sweep % TAU) + TAU) % TAU
  if (sweep === 0) sweep = TAU
  const n = Math.max(4, Math.min(720, Math.ceil(sweep / maxSeg)))
  const nx = -my * ratio
  const ny = mx * ratio
  const pts = []
  for (let i = 0; i <= n; i++) {
    const t = t0 + (sweep * i) / n
    const c = Math.cos(t)
    const s = Math.sin(t)
    pts.push(cx + mx * c + nx * s, cy + my * c + ny * s)
  }
  return pts
}

// ── Motivi di tratteggio ───────────────────────────────────────────────────

/**
 * Le righe di un motivo dentro un rettangolo: per ogni linea di definizione
 * (angolo, origine, passo tra le righe, tratti) genera i segmenti.
 * @param {{angle: number, origin: number[], offset: number[], dashes: number[]}[]} deflines
 * @param {number[]} box [x0, y0, x1, y1]
 * @param {number} limit numero massimo di segmenti
 * @returns {number[]|null} coppie di punti (x0, y0, x1, y1…) o null se troppi
 */
export function hatchLines(deflines, box, limit = 150000) {
  const out = []
  const [bx0, by0, bx1, by1] = box
  const corners = [
    [bx0, by0],
    [bx1, by0],
    [bx1, by1],
    [bx0, by1],
  ]
  for (const d of deflines) {
    const dx = Math.cos(d.angle)
    const dy = Math.sin(d.angle)
    const nx = -dy
    const ny = dx
    const [ox, oy] = d.origin
    const [fx, fy] = d.offset
    const step = fx * nx + fy * ny // distanza tra le righe lungo la normale
    if (Math.abs(step) < 1e-9) continue
    const along = fx * dx + fy * dy // scorrimento della fase lungo la riga
    const dashes = d.dashes.length ? d.dashes : null
    const period = dashes ? dashes.reduce((s, v) => s + Math.abs(v), 0) : 0
    // intervallo di righe che tocca il rettangolo
    let kMin = Infinity
    let kMax = -Infinity
    for (const [cx, cy] of corners) {
      const k = ((cx - ox) * nx + (cy - oy) * ny) / step
      if (k < kMin) kMin = k
      if (k > kMax) kMax = k
    }
    const k0 = Math.floor(kMin)
    const k1 = Math.ceil(kMax)
    if (k1 - k0 > 200000) return null
    for (let k = k0; k <= k1; k++) {
      const bxk = ox + fx * k
      const byk = oy + fy * k
      // estensione lungo la riga (parametro t rispetto alla base della riga)
      let tMin = Infinity
      let tMax = -Infinity
      for (const [cx, cy] of corners) {
        const t = (cx - bxk) * dx + (cy - byk) * dy
        if (t < tMin) tMin = t
        if (t > tMax) tMax = t
      }
      if (!dashes || period <= 1e-12) {
        out.push(bxk + dx * tMin, byk + dy * tMin, bxk + dx * tMax, byk + dy * tMax)
      } else {
        const phase = along * k
        let t = Math.floor((tMin - phase) / period) * period + phase
        while (t < tMax) {
          for (const len of dashes) {
            const l = Math.abs(len)
            if (len >= 0) {
              const a = Math.max(t, tMin)
              const b = Math.min(t + (len === 0 ? period * 0.02 : l), tMax)
              if (b > a) out.push(bxk + dx * a, byk + dy * a, bxk + dx * b, byk + dy * b)
            }
            t += len === 0 ? 0 : l
          }
          if (period <= 0) break
        }
      }
      if (out.length > limit * 4) return null
    }
  }
  return out
}

// ── Colori ─────────────────────────────────────────────────────────────────

/** La tavolozza AutoCAD (ACI): indice 1-255 → [r, g, b]. */
export const ACI = (() => {
  const t = new Array(256).fill(null).map(() => [0, 0, 0])
  const base = [
    [0, 0, 0],
    [255, 0, 0],
    [255, 255, 0],
    [0, 255, 0],
    [0, 255, 255],
    [0, 0, 255],
    [255, 0, 255],
    [255, 255, 255],
    [65, 65, 65],
    [128, 128, 128],
  ]
  for (let i = 0; i < 10; i++) t[i] = base[i]
  const hues = []
  for (let h = 0; h < 24; h++) {
    const deg = h * 15
    // tinta pura a saturazione piena
    const x = 255 * (1 - Math.abs(((deg / 60) % 2) - 1))
    let rgb
    if (deg < 60) rgb = [255, x, 0]
    else if (deg < 120) rgb = [x, 255, 0]
    else if (deg < 180) rgb = [0, 255, x]
    else if (deg < 240) rgb = [0, x, 255]
    else if (deg < 300) rgb = [x, 0, 255]
    else rgb = [255, 0, x]
    hues.push(rgb.map((c) => Math.floor(c + 1e-9)))
  }
  const levels = [1, 0.8, 0.6, 0.5, 0.3]
  for (let h = 0; h < 24; h++) {
    for (let l = 0; l < 5; l++) {
      const f = levels[l]
      const full = hues[h].map((c) => Math.floor(c * f + 1e-9))
      const pale = hues[h].map((c) => Math.floor(((c + 255) / 2) * f + 1e-9))
      t[10 + h * 10 + l * 2] = full
      t[10 + h * 10 + l * 2 + 1] = pale
    }
  }
  const grays = [51, 91, 132, 173, 214, 255]
  for (let i = 0; i < 6; i++) t[250 + i] = [grays[i], grays[i], grays[i]]
  return t
})()

/** Spessori di linea (indice 0-23) in millimetri. */
export const LINEWEIGHTS = [0, 0.05, 0.09, 0.13, 0.15, 0.18, 0.2, 0.25, 0.3, 0.35, 0.4, 0.5, 0.53, 0.6, 0.7, 0.8, 0.9, 1, 1.06, 1.2, 1.4, 1.58, 2, 2.11]
