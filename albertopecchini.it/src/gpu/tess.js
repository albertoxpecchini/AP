// Dai contorni ai triangoli, e dai segmenti ai pezzi che stanno dentro un
// contorno. La scheda grafica riempie solo triangoli: un riempimento del DWG o
// del PDF (con buchi, isole, contorni che si intrecciano) va scomposto prima.
//
// La scomposizione è a fasce orizzontali: tra due quote consecutive dei vertici
// i lati non si incontrano, quindi basta ordinarli da sinistra a destra e
// contare gli attraversamenti per sapere dove si è dentro. Ogni tratto «dentro»
// è un trapezio tra due lati; i trapezi che continuano da una fascia all'altra
// con gli stessi due lati restano un trapezio solo. Se due lati si incrociano
// dentro una fascia, la fascia si divide alla quota dell'incrocio. Vale per
// qualunque contorno, con la regola pari-dispari o del numero di avvolgimenti.

const xAt = (e, y) => (y <= e.y0 ? e.x0 : y >= e.y1 ? e.x1 : e.x0 + (y - e.y0) * e.k)
const byXm = (a, b) => a.xm - b.xm || a.k - b.k

function edgesOf(loops, kind, out) {
  for (const p of loops) {
    const n = p.length >> 1
    if (n < 3) continue
    for (let i = 0; i < n; i++) {
      const j = i + 1 === n ? 0 : i + 1
      const xa = p[2 * i]
      const ya = p[2 * i + 1]
      const xb = p[2 * j]
      const yb = p[2 * j + 1]
      if (ya === yb || !(Number.isFinite(xa + ya + xb + yb))) continue
      if (ya < yb) out.push({ x0: xa, y0: ya, x1: xb, y1: yb, k: (xb - xa) / (yb - ya), dir: 1, kind, id: out.length, xm: 0 })
      else out.push({ x0: xb, y0: yb, x1: xa, y1: ya, k: (xa - xb) / (ya - yb), dir: -1, kind, id: out.length, xm: 0 })
    }
  }
}

/**
 * Riempie i contorni di triangoli.
 * @param {ArrayLike<number>[]} loops contorni chiusi: x0, y0, x1, y1…
 * @param {boolean} evenodd regola pari-dispari (altrimenti: avvolgimenti diversi da zero)
 * @param {ArrayLike<number>[]|null} clip contorni di ritaglio: si riempie solo dove si è anche dentro questi
 * @param {(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number) => void} tri
 */
export function tessellate(loops, evenodd, clip, tri) {
  const E = []
  edgesOf(loops, 0, E)
  if (!E.length) return
  const clipped = !!clip
  if (clipped) edgesOf(clip, 1, E)
  const M = E.length + 1

  const ys = new Float64Array(E.length * 2)
  for (let i = 0; i < E.length; i++) {
    ys[2 * i] = E[i].y0
    ys[2 * i + 1] = E[i].y1
  }
  ys.sort()
  E.sort((a, b) => a.y0 - b.y0)

  let active = []
  let open = new Map()
  let cur = new Map()

  const close = (t, y1) => {
    const a = xAt(t.l, t.y0)
    const b = xAt(t.r, t.y0)
    const c = xAt(t.r, y1)
    const d = xAt(t.l, y1)
    if (b > a) tri(a, t.y0, b, t.y0, c, y1)
    if (c > d) tri(a, t.y0, c, y1, d, y1)
  }
  const closeAll = (y) => {
    for (const t of open.values()) close(t, y)
    open.clear()
  }

  const slab = (ya, yb, depth) => {
    const ym = (ya + yb) / 2
    for (const e of active) e.xm = e.x0 + (ym - e.y0) * e.k
    active.sort(byXm)
    if (depth < 20) {
      for (let i = 0; i + 1 < active.length; i++) {
        const a = active[i]
        const b = active[i + 1]
        if (a.k === b.k) continue
        // ordinati a metà fascia: se in cima o in fondo l'ordine è un altro, si incrociano qui dentro
        const tol = 1e-9 * (Math.abs(a.xm) + Math.abs(b.xm) + 1)
        if (xAt(a, ya) - xAt(b, ya) > tol || xAt(a, yb) - xAt(b, yb) > tol) {
          const y = (b.x0 - a.x0 + a.y0 * a.k - b.y0 * b.k) / (a.k - b.k)
          const margin = (yb - ya) * 1e-6
          if (y > ya + margin && y < yb - margin) {
            slab(ya, y, depth + 1)
            slab(y, yb, depth + 1)
            return
          }
        }
      }
    }
    let w = 0
    let wc = 0
    let inside = false
    let left = null
    for (const e of active) {
      if (e.kind) wc += e.dir
      else w += e.dir
      const now = (evenodd ? (w & 1) !== 0 : w !== 0) && (!clipped || wc !== 0)
      if (now && !inside) left = e
      else if (!now && inside) {
        const key = left.id * M + e.id
        const t = open.get(key)
        if (t) {
          cur.set(key, t)
          open.delete(key)
        } else cur.set(key, { l: left, r: e, y0: ya })
      }
      inside = now
    }
    closeAll(ya)
    const swap = open
    open = cur
    cur = swap
  }

  let next = 0
  for (let s = 0; s + 1 < ys.length; s++) {
    const ya = ys[s]
    const yb = ys[s + 1]
    if (yb <= ya) continue
    if (active.length) active = active.filter((e) => e.y1 > ya)
    while (next < E.length && E[next].y0 <= ya) active.push(E[next++])
    if (!active.length) {
      closeAll(ya)
      continue
    }
    slab(ya, yb, 0)
  }
  closeAll(ys[ys.length - 1])
}

/** I contorni come elenco di lati (ax, ay, bx, by…) con il loro ingombro. */
export function loopEdges(loops) {
  const e = []
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const p of loops) {
    const n = p.length >> 1
    if (n < 2) continue
    for (let i = 0; i < n; i++) {
      const j = i + 1 === n ? 0 : i + 1
      e.push(p[2 * i], p[2 * i + 1], p[2 * j], p[2 * j + 1])
      if (p[2 * i] < x0) x0 = p[2 * i]
      if (p[2 * i] > x1) x1 = p[2 * i]
      if (p[2 * i + 1] < y0) y0 = p[2 * i + 1]
      if (p[2 * i + 1] > y1) y1 = p[2 * i + 1]
    }
  }
  return { e: Float64Array.from(e), box: [x0, y0, x1, y1] }
}

/** Il punto è dentro i contorni (pari-dispari)? */
function insideEdges(e, px, py) {
  let c = false
  for (let i = 0; i < e.length; i += 4) {
    const ay = e[i + 1]
    const by = e[i + 3]
    if (ay > py !== by > py && px < ((e[i + 2] - e[i]) * (py - ay)) / (by - ay) + e[i]) c = !c
  }
  return c
}

const ts = []

/**
 * Di un segmento tiene solo i pezzi dentro i contorni (pari-dispari): le righe
 * di un tratteggio ritagliate dal suo contorno.
 * @param {{ e: Float64Array, box: number[] }} edges da loopEdges()
 * @param {(x0: number, y0: number, x1: number, y1: number, t0: number, t1: number) => void} emit
 */
export function clipToEdges(edges, x0, y0, x1, y1, emit) {
  const { e, box } = edges
  if (Math.max(x0, x1) < box[0] || Math.min(x0, x1) > box[2] || Math.max(y0, y1) < box[1] || Math.min(y0, y1) > box[3]) return
  const dx = x1 - x0
  const dy = y1 - y0
  ts.length = 0
  ts.push(0, 1)
  for (let i = 0; i < e.length; i += 4) {
    const ex = e[i + 2] - e[i]
    const ey = e[i + 3] - e[i + 1]
    const den = dx * ey - dy * ex
    if (den === 0) continue
    const qx = e[i] - x0
    const qy = e[i + 1] - y0
    const t = (qx * ey - qy * ex) / den
    if (t <= 0 || t >= 1) continue
    const u = (qx * dy - qy * dx) / den
    if (u >= 0 && u <= 1) ts.push(t)
  }
  ts.sort((a, b) => a - b)
  let from = -1
  for (let i = 0; i + 1 < ts.length; i++) {
    const a = ts[i]
    const b = ts[i + 1]
    const inside = b - a > 1e-12 && insideEdges(e, x0 + dx * (a + b) * 0.5, y0 + dy * (a + b) * 0.5)
    if (inside && from < 0) from = a
    if (!inside && from >= 0 && b - a > 1e-12) {
      emit(x0 + dx * from, y0 + dy * from, x0 + dx * a, y0 + dy * a, from, a)
      from = -1
    }
  }
  if (from >= 0) emit(x0 + dx * from, y0 + dy * from, x1, y1, from, 1)
}

/** Ritaglio di un segmento su un rettangolo: [t0, t1] della parte che resta, o null. */
export function clipToRect(r, x0, y0, x1, y1) {
  let t0 = 0
  let t1 = 1
  const dx = x1 - x0
  const dy = y1 - y0
  const p = [-dx, dx, -dy, dy]
  const q = [x0 - r[0], r[2] - x0, y0 - r[1], r[3] - y0]
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return null
      continue
    }
    const t = q[i] / p[i]
    if (p[i] < 0) {
      if (t > t1) return null
      if (t > t0) t0 = t
    } else {
      if (t < t0) return null
      if (t < t1) t1 = t
    }
  }
  return t1 > t0 || (dx === 0 && dy === 0) ? [t0, t1] : null
}
