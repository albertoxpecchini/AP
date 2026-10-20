// L'insegna al neon: «pzkko» e la chiocciola del logo (quella dell'adesivo e di
// favicon.png), tubi di vetro veri davanti al pannello del cassonetto. Come li
// fa un vetraio: il tubo (13 mm) segue il tratto, gli spigoli sono curve
// (nessun vetro si piega ad angolo vivo), le aperture chiuse (la pancia della p,
// la o) restano aperte di un dito, e ai due capi di ogni pezzo il tubo gira
// all'indietro ed entra nel pannello da un passacavo di gomma (l'elettrodo sta
// dietro): quel gomito è verniciato di nero, non deve fare luce. Lo tengono i
// supporti di plastica trasparente; sopra il cassonetto il trasformatore.
//
// Colori veri, quelli dei gas: «pzkko» è neon (rosso arancio) in vetro rosato,
// la chiocciola è argon e mercurio in vetro cobalto (blu). Il vetro tinge quello
// che ha dietro: di giorno i tubi spenti si vedono rossi e blu sul pannello; di
// sera il gas si accende (emissivo oltre l'1: il bagliore della scena lo
// allarga), la luce cade sul pannello (una trama disegnata dagli stessi tratti,
// sfocata) e sul muro (le lampade dell'insegna, dello stesso colore).
import * as T from './lib/three.js'
import { tela, tuboSpezzato as tubo } from './materiali.js'

// la traccia di «pzkko» (art/insegna.svg) e quella della chiocciola (l'adesivo)
const PZKKO = 'M23 325V128M23 190a62 62 0 1 0 124 0a62 62 0 1 0-124 0M217 128H335L217 252H335M405 50V252M510 128L405 215M448 180L515 252M561 50V252M666 128L561 215M604 180L671 252M737 190a62 62 0 1 0 124 0a62 62 0 1 0-124 0'
const CHIOCCIOLA = 'M-19 11.5C-9 11.5 5 11.5 10 11.5C14.5 11.5 17 8.5 17 4M15.6 5L12.8-6.5M17.8 5.4L20.6-5.6M-3 1a2.6 2.6 0 0 1 5.2 0a5.2 5.2 0 0 1-10.4 0a7.8 7.8 0 0 1 15.6 0a10.2 10.2 0 0 1-20.4 0'
const OCCHI = [[12.6, -7.2], [20.8, -6.3]]
// la chiocciola in unità del testo (quelle di «pzkko» già scalate di 0,724): 5,5 volte, il guscio poco più grande della o
const G = 5.5

// i colori: la luce del gas (lineare, oltre l'1 nel nucleo), quanto il vetro lascia passare di ogni canale (tinge
// quello che c'è dietro: il pannello di giorno, il gas di sera) e la luce che arriva sul muro
export const NEON = {
  rosso: { luce: new T.Color(1, 0.11, 0.028), vetro: new T.Color(1, 0.3, 0.26), lampada: new T.Color(1, 0.2, 0.08) },
  blu: { luce: new T.Color(0.03, 0.17, 1), vetro: new T.Color(0.28, 0.42, 1), lampada: new T.Color(0.22, 0.38, 1) },
}

// i tratti di una traccia SVG come liste di punti (in unità della traccia)
const tratti = (d) => {
  const dati = new T.SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`)
  return dati.paths[0].subPaths.map((sub) => {
    const punti = []
    for (const c of sub.curves) for (const p of c.isLineCurve ? [c.v1, c.v2] : c.getPoints(24)) {
      if (!punti.length || p.distanceTo(punti.at(-1)) > 1e-4) punti.push(p.clone())
    }
    return punti
  })
}

// lungo un tratto nel mondo: gli spigoli diventano curve di raggio rb (al più metà dei due lati), le aperture chiuse si
// aprono di `varco` metri
const arrotonda = (pts, rb) => {
  const out = [pts[0]]
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], p = pts[i], b = pts[i + 1]
    const ta = p.clone().sub(a), tb = b.clone().sub(p), la = ta.length(), lb = tb.length()
    ta.normalize(); tb.normalize()
    if (ta.dot(tb) > Math.cos(12 * Math.PI / 180)) { out.push(p); continue }
    const r = Math.min(rb, la * 0.45, lb * 0.45), p0 = p.clone().addScaledVector(ta, -r), p1 = p.clone().addScaledVector(tb, r)
    for (let k = 0; k <= 6; k++) {
      const t = k / 6, s = 1 - t
      out.push(new T.Vector3().addScaledVector(p0, s * s).addScaledVector(p, 2 * s * t).addScaledVector(p1, t * t))
    }
  }
  out.push(pts.at(-1))
  return out
}
const apri = (pts, varco) => {
  if (pts[0].distanceTo(pts.at(-1)) > 1e-3) return pts
  const taglia = (lista) => { let l = 0; while (lista.length > 2 && l < varco / 2) { l += lista[0].distanceTo(lista[1]); lista.shift() } return lista }
  return taglia(taglia(pts).reverse()).reverse()
}

// I contorni di una maschera (bianco = pieno), per le lettere a scatola: marching squares, i punti interpolati sui lati
// delle celle, e ogni contorno un anello chiuso (in pixel). Nelle selle decide il centro della cella
const contorni = (dati, W, H) => {
  const v = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : dati[(y * W + x) * 4])
  const S = 127.5, pos = new Map(), vicini = new Map()
  // un punto su un lato: «o» orizzontale fra (x, y) e (x + 1, y), «v» verticale fra (x, y) e (x, y + 1)
  const lato = (x, y, o) => {
    const k = `${o}${x},${y}`
    if (!pos.has(k)) { const a = v(x, y), b = o === 'o' ? v(x + 1, y) : v(x, y + 1), t = (S - a) / (b - a); pos.set(k, o === 'o' ? [x + t, y] : [x, y + t]) }
    return k
  }
  const lega = (a, b) => { for (const [p, q] of [[a, b], [b, a]]) { if (!vicini.has(p)) vicini.set(p, []); vicini.get(p).push(q) } }
  for (let y = -1; y < H; y++) for (let x = -1; x < W; x++) {
    const a = v(x, y) > S, b = v(x + 1, y) > S, c = v(x + 1, y + 1) > S, d = v(x, y + 1) > S
    if (a === b && b === c && c === d) continue
    const su = a !== b ? lato(x, y, 'o') : null, dx = b !== c ? lato(x + 1, y, 'v') : null, giu = c !== d ? lato(x, y + 1, 'o') : null, sx = d !== a ? lato(x, y, 'v') : null
    const lati = [su, dx, giu, sx].filter(Boolean)
    if (lati.length === 2) { lega(lati[0], lati[1]); continue }
    const centro = (v(x, y) + v(x + 1, y) + v(x + 1, y + 1) + v(x, y + 1)) / 4 > S
    if (a !== centro) lega(sx, su)
    if (b !== centro) lega(su, dx)
    if (c !== centro) lega(dx, giu)
    if (d !== centro) lega(giu, sx)
  }
  const visti = new Set(), anelli = []
  for (const k0 of vicini.keys()) {
    if (visti.has(k0)) continue
    const anello = []
    let prec = null, k = k0
    while (k && !visti.has(k)) { visti.add(k); anello.push(pos.get(k)); const n = vicini.get(k), dopo = n[0] !== prec ? n[0] : n[1]; prec = k; k = dopo }
    if (anello.length > 8) anelli.push(anello)
  }
  return anelli
}
// un anello con meno punti (Douglas-Peucker), aperto al punto più lontano dal primo
const semplifica = (p, tol) => {
  const rdp = (q) => {
    const tieni = new Uint8Array(q.length); tieni[0] = tieni[q.length - 1] = 1
    const pila = [[0, q.length - 1]]
    while (pila.length) {
      const [a, b] = pila.pop(), [ax, ay] = q[a], dx = q[b][0] - ax, dy = q[b][1] - ay, l = Math.hypot(dx, dy) || 1
      let max = 0, idx = -1
      for (let i = a + 1; i < b; i++) { const d = Math.abs((q[i][0] - ax) * dy - (q[i][1] - ay) * dx) / l; if (d > max) { max = d; idx = i } }
      if (max > tol) { tieni[idx] = 1; pila.push([a, idx], [idx, b]) }
    }
    return q.filter((_, i) => tieni[i])
  }
  let far = 0, dmax = 0
  p.forEach(([x, y], i) => { const d = Math.hypot(x - p[0][0], y - p[0][1]); if (d > dmax) { dmax = d; far = i } })
  return [...rdp(p.slice(0, far + 1)).slice(0, -1), ...rdp([...p.slice(far), p[0]]).slice(0, -1)]
}
const cilindro = (x, y, z0, z1, r, seg = 10) => {
  const g = new T.CylinderGeometry(r, r, z1 - z0, seg, 1, false)
  g.deleteAttribute('uv'); g.rotateX(Math.PI / 2); g.translate(x, y, (z0 + z1) / 2)
  return g
}
const sfera = (p, r) => { const g = new T.SphereGeometry(r, 12, 8); g.deleteAttribute('uv'); g.translate(p.x, p.y, p.z); return g }

// cx, cy: il centro del pannello; zp: la sua faccia; k: la scala dell'insegna (1 sul computer, ~0,5 sul telefono); il
// pannello è largo pw e alto ph. Restituisce le mesh (già nella scena), la trama della luce sul pannello e accendi(v)
export function neon(scene, { cx, cy, zp, k, pw, ph }) {
  const kk = Math.max(0.75, k)
  const s = (0.26 * k) / 199 // metri per unità del testo (le lettere alte 26 cm)
  const r = 0.0065 * kk, dist = 0.036 * kk, rb = 0.014 * kk, rg = 0.0095 * kk // il raggio del tubo, quanto sta davanti al pannello, le curve, i gomiti
  const zt = zp + dist
  // le lettere a scatola di «pzkko»: il fondo appena davanti al pannello, i fianchi alti 3,6 cm (più fondi fanno ombra
  // dentro e la lettera di giorno non è più bianca), il tubo a metà
  const zb = zp + 0.004 * kk, zf = zb + 0.036 * kk, zTesto = zb + 0.018 * kk
  // la composizione: la chiocciola (228 unità), uno spazio (40) e «pzkko» (606, più il tratto largo delle lettere a
  // scatola), tutto centrato; la chiocciola posa il piede sulla riga di base del testo
  const tx = cx + 142 * s, sx = cx - 331 * s, base = cy - 46.9 * s
  const testo = (p, z = zTesto) => new T.Vector3(tx + (0.724 * p.x - 320) * s, cy - (0.724 * p.y - 135.5) * s, z)
  const lumaca = (p) => new T.Vector3(sx + (p.x - 1.75) * G * s, base - (p.y - 11.5) * G * s, zt)
  const pezzi = [
    ...tratti(PZKKO).map((t) => ({ colore: 'rosso', punti: t.map((p) => testo(p)) })),
    ...tratti(CHIOCCIOLA).map((t) => ({ colore: 'blu', punti: t.map(lumaca) })),
  ].map((p) => ({ ...p, punti: arrotonda(apri(p.punti, 0.032 * kk), rb) }))

  const z = new T.Vector3(0, 0, 1)
  const gas = { rosso: [], blu: [] }, vetro = { rosso: [], blu: [] }, nero = [], gomma = [], sostegni = []
  for (const { colore, punti } of pezzi) {
    vetro[colore].push(tubo(punti, r, 12))
    gas[colore].push(tubo(punti, r * 0.78, 8))
    // i due capi: il gomito all'indietro (nero) fino al pannello (per «pzkko» fino al fondo della lettera, dentro il
    // canale), e il passacavo di gomma del buco da cui il tubo entra (l'elettrodo sta dietro)
    const dietro = colore === 'rosso' ? zb : zp, rgo = colore === 'rosso' ? rg * 0.75 : rg
    for (const [p, t] of [[punti[0], punti[0].clone().sub(punti[1]).normalize()], [punti.at(-1), punti.at(-1).clone().sub(punti.at(-2)).normalize()]]) {
      const c = p.clone().addScaledVector(z, -rgo), gomito = []
      for (let i = 0; i <= 6; i++) { const f = (i / 6) * Math.PI / 2; gomito.push(c.clone().addScaledVector(z, rgo * Math.cos(f)).addScaledVector(t, rgo * Math.sin(f))) }
      const fondo = gomito.at(-1).clone(); fondo.z = dietro
      nero.push(tubo([...gomito, fondo], r, 10))
      gomma.push(cilindro(fondo.x, fondo.y, dietro, dietro + 0.006 * kk, r * 1.5, 12))
    }
    // i supporti, uno ogni ~16 cm di tubo, lontano dai capi
    let l = 0, prossimo = 0.06
    const tot = punti.reduce((a, p, i) => a + (i ? p.distanceTo(punti[i - 1]) : 0), 0)
    for (let i = 1; i < punti.length; i++) {
      const seg = punti[i].distanceTo(punti[i - 1])
      while (l + seg >= prossimo && prossimo < tot - 0.05) {
        const p = punti[i - 1].clone().lerp(punti[i], (prossimo - l) / seg)
        sostegni.push(cilindro(p.x, p.y, dietro, p.z - r * 0.7, 0.0024 * kk, 8))
        prossimo += 0.16
      }
      l += seg
    }
  }
  // gli occhi della chiocciola: due perle di vetro in cima alle antenne
  for (const [x, y] of OCCHI) { const p = lumaca({ x, y }); vetro.blu.push(sfera(p, r * 1.25)); gas.blu.push(sfera(p, r * 1.05)) }

  const unisci = (lista) => T.mergeGeometries(lista)
  const mat = {}, mesh = []

  // ── le lettere a scatola, come l'insegna di prima (art/insegna.svg) ──
  // Il tratto di «pzkko» largo 46 unità (quello dell'SVG), disegnato su una tela: i suoi contorni sono i fianchi
  // d'alluminio della lettera, alti 3,6 cm; dentro è bianco (il fondo, a forma di lettera, e il lato interno dei fianchi),
  // sul bordo un profilo chiaro, e il tubo al neon corre in mezzo al canale (i gomiti degli elettrodi più piccoli). Di giorno le lettere bianche e grosse
  // dell'insegna di prima col tubo rosso dentro; di sera il canale si riempie di luce rossa
  const RP = 1.6, X0 = -10, Y0 = 18, CW = Math.ceil((900 - X0) * RP), CH = Math.ceil((360 - Y0) * RP)
  const maschera = tela(CW, CH), mctx = maschera.getContext('2d')
  mctx.fillStyle = '#000'; mctx.fillRect(0, 0, CW, CH)
  mctx.setTransform(RP, 0, 0, RP, -X0 * RP, -Y0 * RP)
  mctx.strokeStyle = '#fff'; mctx.lineWidth = 46; mctx.lineCap = 'round'; mctx.lineJoin = 'round'
  mctx.stroke(new Path2D(PZKKO))
  const pieno = mctx.getImageData(0, 0, CW, CH).data
  const dentro = (x, y) => { const i = Math.round(y), j = Math.round(x); return j >= 0 && i >= 0 && j < CW && i < CH && pieno[(i * CW + j) * 4] > 127 }
  const daPx = ([x, y], zz) => testo({ x: x / RP + X0, y: y / RP + Y0 }, zz)
  const fuori = { pos: [], nor: [], idx: [] }, interno = { pos: [], nor: [], idx: [] }, bordi = []
  for (const anello of contorni(pieno, CW, CH)) {
    const P = semplifica(anello, 0.45), n = P.length
    if (n < 3) continue
    // da che parte è il pieno: si guarda accanto al lato più lungo
    let lung = 0, m = 0
    for (let i = 0; i < n; i++) { const q = P[(i + 1) % n], l = Math.hypot(q[0] - P[i][0], q[1] - P[i][1]); if (l > lung) { lung = l; m = i } }
    const a = P[m], b = P[(m + 1) % n], dx = (b[0] - a[0]) / lung, dy = (b[1] - a[1]) / lung
    const sinistra = dentro((a[0] + b[0]) / 2 - dy * 2.5, (a[1] + b[1]) / 2 + dx * 2.5)
    // nel mondo (la y si capovolge): la normale verso fuori di ogni lato, e quella dei vertici (la media dei due lati)
    const W3 = P.map((p) => daPx(p, zb)), o = []
    for (let i = 0; i < n; i++) {
      const p = W3[i], q = W3[(i + 1) % n], ex = q.x - p.x, ey = q.y - p.y, l = Math.hypot(ex, ey) || 1
      // (il lato «a sinistra» in pixel, con la y capovolta, è la destra nel mondo: se il pieno sta lì, fuori è a sinistra)
      const s0 = sinistra ? -1 : 1
      o.push([(ey / l) * s0, (-ex / l) * s0])
    }
    for (const [geo, verso] of [[fuori, 1], [interno, -1]]) {
      const base = geo.pos.length / 3
      for (let i = 0; i < n; i++) {
        const u = o[(i + n - 1) % n], w = o[i], nx = u[0] + w[0], ny = u[1] + w[1], l = Math.hypot(nx, ny) || 1
        for (const zz of [zb, zf]) { geo.pos.push(W3[i].x, W3[i].y, zz); geo.nor.push((verso * nx) / l, (verso * ny) / l, 0) }
      }
      for (let i = 0; i < n; i++) {
        const A0 = base + 2 * i, A1 = A0 + 1, B0 = base + 2 * ((i + 1) % n), B1 = B0 + 1
        // il triangolo (A0, B0, B1) guarda a destra del lato A → B: si gira perché guardi dalla parte voluta
        const ex = W3[(i + 1) % n].x - W3[i].x, ey = W3[(i + 1) % n].y - W3[i].y
        const destra = (ey * o[i][0] - ex * o[i][1]) * verso > 0
        if (destra) geo.idx.push(A0, B0, B1, A0, B1, A1); else geo.idx.push(A0, B1, B0, A0, A1, B1)
      }
    }
    bordi.push(tubo([...W3.map((p) => new T.Vector3(p.x, p.y, zf)), new T.Vector3(W3[0].x, W3[0].y, zf)], 0.0024 * kk, 6))
  }
  const geometria = ({ pos, nor, idx }) => { const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3)); g.setIndex(idx); return g }
  const fondoT = new T.CanvasTexture(maschera)
  const mFianchi = new T.MeshStandardMaterial({ color: 0x5a5d60, roughness: 0.42, metalness: 0.65 })
  mat.interno = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0, emissive: NEON.rosso.luce, emissiveIntensity: 0 })
  mat.fondo = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0, emissive: NEON.rosso.luce, emissiveIntensity: 0, alphaMap: fondoT, alphaTest: 0.5 })
  const mBordo = new T.MeshStandardMaterial({ color: 0xc4c4bf, roughness: 0.35, metalness: 0.3 })
  const fondoP = new T.Mesh(new T.PlaneGeometry(((CW / RP) * 0.724) * s, ((CH / RP) * 0.724) * s), mat.fondo)
  fondoP.position.copy(testo({ x: X0 + CW / RP / 2, y: Y0 + CH / RP / 2 }, zb)); fondoP.receiveShadow = true
  for (const [o, ombre] of [[new T.Mesh(geometria(fuori), mFianchi), true], [new T.Mesh(geometria(interno), mat.interno), true], [fondoP, false], [new T.Mesh(unisci(bordi), mBordo), true]]) {
    o.castShadow = ombre; o.receiveShadow = true; mesh.push(o)
  }
  for (const c of ['rosso', 'blu']) {
    const n = NEON[c]
    // il vetro colorato in due passate, perché il vetro vero tinge quello che ha dietro (con la trasparenza semplice il
    // pannello passava bianco e il tubo sembrava grigio): prima la tinta, che moltiplica il fondo (il pannello, il gas)
    // per il colore del vetro; poi il vetro, che aggiunge solo i riflessi (niente colore suo) e di sera la sua luce
    mat['tinta-' + c] = new T.MeshBasicMaterial({ color: n.vetro, transparent: true, blending: T.MultiplyBlending, premultipliedAlpha: true, depthWrite: false })
    mat['vetro-' + c] = new T.MeshPhysicalMaterial({ color: 0x000000, roughness: 0.08, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03, emissive: n.luce, emissiveIntensity: 0, transparent: true, blending: T.AdditiveBlending, depthWrite: false })
    // il gas: riempie il tubo, si vede solo acceso, oltre l'1 (il bagliore lo allarga)
    mat['gas-' + c] = new T.MeshBasicMaterial({ color: n.luce.clone() })
    const geo = unisci(vetro[c])
    const g = new T.Mesh(unisci(gas[c]), mat['gas-' + c]); g.visible = false
    const t = new T.Mesh(geo, mat['tinta-' + c]); t.renderOrder = 2
    const v = new T.Mesh(geo, mat['vetro-' + c]); v.renderOrder = 3; v.castShadow = true; v.receiveShadow = false
    mesh.push(g, t, v)
  }
  const mNero = new T.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 0.35, metalness: 0 })
  const mGomma = new T.MeshStandardMaterial({ color: 0x141414, roughness: 0.9 })
  const mSostegni = new T.MeshStandardMaterial({ color: 0xc8cfd2, roughness: 0.25, transparent: true, opacity: 0.7 })
  for (const [lista, m] of [[nero, mNero], [gomma, mGomma], [sostegni, mSostegni]]) { const o = new T.Mesh(unisci(lista), m); o.castShadow = true; o.receiveShadow = true; mesh.push(o) }
  for (const o of mesh) scene.add(o)

  // la luce sul pannello: gli stessi tratti, sfocati (l'ombra di un tratto disegnato fuori dalla tela), nella trama
  // emissiva del pannello: di sera il bianco sporco si tinge di rosso e di blu dove i tubi sono vicini
  const LW = 1024, LH = Math.round((LW * ph) / pw), c = tela(LW, LH), ctx = c.getContext('2d')
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, LW, LH)
  ctx.globalCompositeOperation = 'lighter'
  const px = LW / pw, FUORI = 4 * LW
  for (const { colore, punti } of pezzi) {
    // (la luce di «pzkko» esce soprattutto dal canale delle lettere: sul pannello ne arriva meno)
    const { luce } = NEON[colore], quanta = colore === 'rosso' ? 0.55 : 1
    const rgb = `${Math.round(255 * Math.min(1, luce.r * 1.2 + 0.08))},${Math.round(255 * Math.min(1, luce.g * 2 + 0.06))},${Math.round(255 * Math.min(1, luce.b * 1.2 + 0.08))}`
    for (const [sfoca, a, larg] of [[0.06, 0.5, 0.03], [0.022, 0.75, 0.018]]) {
      ctx.save()
      ctx.shadowColor = `rgba(${rgb},${a * quanta})`; ctx.shadowBlur = sfoca * px; ctx.shadowOffsetX = FUORI
      ctx.strokeStyle = '#fff'; ctx.lineWidth = larg * px; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
      ctx.beginPath()
      punti.forEach((p, i) => { const x = (p.x - (cx - pw / 2)) * px - FUORI, y = (cy + ph / 2 - p.y) * px; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y) })
      ctx.stroke(); ctx.restore()
    }
  }
  const luceT = new T.CanvasTexture(c)
  luceT.colorSpace = T.SRGBColorSpace

  // il centro della chiocciola e di «pzkko», per le lampade dell'insegna (mondo.js)
  const centri = { testo: new T.Vector3(tx, cy, zt), chiocciola: new T.Vector3(sx, base + 56.4 * s, zt), largTesto: 606 * s }
  const gasMat = [mat['gas-rosso'], mat['gas-blu']], gasMesh = mesh.filter((o) => gasMat.includes(o.material))
  // accendi(v): 0 spento, 1 acceso (con lo sfarfallio della pagina dentro)
  const accendi = (v) => {
    for (const o of gasMesh) o.visible = v > 0.01
    for (const c of ['rosso', 'blu']) {
      mat['gas-' + c].color.copy(NEON[c].luce).multiplyScalar(9 * v)
      mat['vetro-' + c].emissiveIntensity = 1.1 * v
    }
    // il canale delle lettere a scatola si riempie della luce rossa del tubo
    mat.interno.emissiveIntensity = mat.fondo.emissiveIntensity = 0.85 * v
  }
  return { mesh, luceT, centri, accendi }
}
