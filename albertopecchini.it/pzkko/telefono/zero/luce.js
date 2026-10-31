// La luce sullo zero è quella del sito (29.10, Alberto: «la luce che spara addosso al modello deve essere = a quella del sito
// quindi non sta luce pazzesca anche di notte… fai i riflessi identici delle auto, lampioni… è come se fossi lì quindi luci
// lì e luci qui»). Il cercapersone sta appeso alla saracinesca di pzkko: quello che illumina il muro illumina anche lui.
// - Il sole dove sta davvero sopra Mantova a quest'ora (lo stesso calcolo NOAA di scena/luci.js, copiato qui per non
//   caricare la scena intera), con l'ora della pagina (window.pzkkoOrologio: anche quella finta della regia).
// - La sera e la notte della pagina (window.pzkkoPagina.luci: notte, lampioni, insegna, l'auto che passa coi fari —
//   auto-x dove sta, auto-l quanto abbaglia, auto-c il colore — e il neon), le stesse variabili che accendono il muro.
// - L'ambiente per i riflessi: se la scena 3D della home è accesa (window.pzkkoScena), si fotografa DAVVERO il posto dal
//   punto dove sta il cercapersone (sei facce con la telecamera della scena, lette dalla sua tela: la strada, i lampioni,
//   l'auto, l'insegna); se no, un cielo disegnato con l'ora (il sole, l'orizzonte arancione dei lampioni di notte, la
//   striscia calda dei fari dove passa l'auto).
//
//   stato() → { sole: { el, az, dir }, giorno, notte, lampioni, insegna, auto: { x, l, c, neon } }
//   cielo(stato) → la tela equirettangolare (256 × 128) dell'ambiente disegnato
//   cattura(N) → le sei facce (Uint8Array N × N × 4) dalla scena 3D della home, o null
import * as T from './lib/three.js'

const LAT = 45.1564, LON = 10.7914, RAD = Math.PI / 180
const FACCIATA = 200 * RAD // dove guarda la facciata (azimut da nord), come in scena/luci.js

/** Altezza e azimut del sole (radianti) all'istante ms, a Mantova (NOAA, come scena/luci.js). */
export function sole(ms) {
  const t = (ms / 86400000 + 2440587.5 - 2451545) / 36525
  const L0 = (((280.46646 + t * (36000.76983 + t * 0.0003032)) % 360) + 360) % 360
  const M = 357.52911 + t * (35999.05029 - 0.0001537 * t)
  const e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t)
  const C = Math.sin(M * RAD) * (1.914602 - t * (0.004817 + 0.000014 * t)) + Math.sin(2 * M * RAD) * (0.019993 - 0.000101 * t) + Math.sin(3 * M * RAD) * 0.000289
  const om = 125.04 - 1934.136 * t, lam = L0 + C - 0.00569 - 0.00478 * Math.sin(om * RAD)
  const eps = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60 + 0.00256 * Math.cos(om * RAD)
  const decl = Math.asin(Math.sin(eps * RAD) * Math.sin(lam * RAD))
  const y = Math.tan((eps / 2) * RAD) ** 2
  const eq = (4 / RAD) * (y * Math.sin(2 * L0 * RAD) - 2 * e * Math.sin(M * RAD) + 4 * e * y * Math.sin(M * RAD) * Math.cos(2 * L0 * RAD) - 0.5 * y * y * Math.sin(4 * L0 * RAD) - 1.25 * e * e * Math.sin(2 * M * RAD))
  const minuti = (((ms % 86400000) + 86400000) % 86400000) / 60000
  const tst = (((minuti + eq + 4 * LON) % 1440) + 1440) % 1440
  const ha = (tst / 4 < 0 ? tst / 4 + 180 : tst / 4 - 180) * RAD
  const phi = LAT * RAD
  const cosZ = Math.sin(phi) * Math.sin(decl) + Math.cos(phi) * Math.cos(decl) * Math.cos(ha)
  const zen = Math.acos(Math.max(-1, Math.min(1, cosZ)))
  let az = Math.acos(Math.max(-1, Math.min(1, (Math.sin(phi) * Math.cos(zen) - Math.sin(decl)) / (Math.cos(phi) * Math.sin(zen) || 1e-9))))
  az = ha > 0 ? (az + Math.PI) % (2 * Math.PI) : (3 * Math.PI - az) % (2 * Math.PI)
  return { el: Math.PI / 2 - zen, az }
}
/** Dal cielo (altezza, azimut) al mondo dello zero: +z verso chi guarda (la strada), +x a destra, +y in su. */
export function direzione(el, az) {
  const E = Math.cos(el) * Math.sin(az), N = Math.cos(el) * Math.cos(az)
  return new T.Vector3(-E * Math.cos(FACCIATA) + N * Math.sin(FACCIATA), Math.sin(el), E * Math.sin(FACCIATA) + N * Math.cos(FACCIATA))
}

const v = (l, k, d = 0) => { const x = Number(l?.[k]); return Number.isFinite(x) ? x : d }
/** Lo stato della luce adesso: il sole, la sera, i lampioni, l'auto. */
// come scena/luci.js: ?ora=HH:MM e ?notte=0..1 nell'indirizzo comandano sopra tutto (per provare la sera senza aspettarla)
const Q = new URLSearchParams(location.search)
const oraChiesta = (() => { const o = Q.get('ora'); if (!o) return null; const [h, m] = o.split(':').map(Number); const roma = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Rome' })); const scarto = Date.now() - roma.getTime(); const inizio = new Date(roma.getFullYear(), roma.getMonth(), roma.getDate(), h || 0, m || 0).getTime() + scarto, da = Date.now(); return () => inizio + (Date.now() - da) })()
const nottePar = Q.get('notte') !== null ? Math.max(0, Math.min(1, Number(Q.get('notte')) || 0)) : null
export function stato() {
  const ms = oraChiesta?.() ?? window.pzkkoOrologio?.adesso?.() ?? Date.now()
  const s = sole(ms)
  const l = window.pzkkoPagina?.luci ?? {}
  const notte = nottePar ?? Math.max(0, Math.min(1, v(l, 'notte')))
  const crepuscolo = Math.max(0, Math.min(1, (6 * RAD - s.el) / (12 * RAD))) // da 6° sopra a 6° sotto l'orizzonte
  const buio = Math.max(notte, crepuscolo)
  const el = s.el - 60 * RAD * notte // (di notte chiesta dalla pagina il sole va sotto)
  const giorno = Math.max(0, Math.min(1, Math.sin(el) * 3)) * (1 - notte) ** 1.5
  const c = String(l['auto-c'] ?? '255,226,170').split(',').map((x) => Number(x) / 255)
  return {
    sole: { el, az: s.az, dir: direzione(Math.max(el, -0.1), s.az) }, giorno, buio,
    notte, lampioni: Math.max(v(l, 'lampioni') * v(l, 'f-lampioni', 1), nottePar ?? 0), insegna: v(l, 'insegna') * v(l, 'f-insegna', 1),
    auto: { x: v(l, 'auto-x', 0.5), l: v(l, 'auto-l'), c: c.length === 3 ? c : [1, 0.89, 0.67], neon: v(l, 'neon-auto') },
  }
}

// ── il cielo disegnato: una tela equirettangolare per i riflessi quando la scena 3D non c'è ──
const tela = document.createElement('canvas')
tela.width = 256; tela.height = 128
export function cielo(s) {
  const g = tela.getContext('2d'), W = tela.width, H = tela.height
  const mix = (a, b, t) => a.map((x, i) => Math.round(x + (b[i] - x) * t))
  const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`
  // il cielo: azzurro di giorno, grigio-blu al crepuscolo, quasi nero di notte con l'orizzonte arancione dei lampioni
  const alto = mix(mix([92, 140, 205], [20, 26, 48], s.buio), [8, 10, 20], s.notte)
  const oriz = mix(mix([205, 215, 225], [120, 90, 70], s.buio), mix([22, 23, 30], [64, 58, 52], s.lampioni), s.notte)
  const terra = mix([70, 70, 72], [14, 15, 19], s.buio)
  let gr = g.createLinearGradient(0, 0, 0, H / 2)
  gr.addColorStop(0, rgb(alto)); gr.addColorStop(1, rgb(oriz))
  g.fillStyle = gr; g.fillRect(0, 0, W, H / 2)
  gr = g.createLinearGradient(0, H / 2, 0, H)
  gr.addColorStop(0, rgb(mix(oriz, terra, 0.5))); gr.addColorStop(0.15, rgb(terra)); gr.addColorStop(1, rgb(mix(terra, [0, 0, 0], 0.5)))
  g.fillStyle = gr; g.fillRect(0, H / 2, W, H / 2)
  // (la tela equirettangolare: u = l'azimut attorno a +z … qui basta che il sole stia davanti-sopra e l'auto davanti-sotto)
  const d = s.sole.dir
  if (s.giorno > 0) {
    const u = (Math.atan2(d.x, d.z) / (2 * Math.PI) + 0.5) * W, vv = (0.5 - Math.asin(Math.max(-1, Math.min(1, d.y))) / Math.PI) * H
    const r = 18
    const sg = g.createRadialGradient(u, vv, 0, u, vv, r)
    sg.addColorStop(0, `rgba(255,250,235,${0.95 * s.giorno})`); sg.addColorStop(0.3, `rgba(255,240,200,${0.5 * s.giorno})`); sg.addColorStop(1, 'rgba(255,240,200,0)')
    g.fillStyle = sg; g.fillRect(u - r, vv - r, 2 * r, 2 * r)
  }
  if (s.notte > 0.05) {
    // la lampada a muro sopra la saracinesca (in alto, un po' a sinistra) e i lampioni della strada
    const u = W * 0.45, vv = H * 0.2, r = 22
    const lg = g.createRadialGradient(u, vv, 0, u, vv, r)
    lg.addColorStop(0, `rgba(255,228,192,${0.8 * s.lampioni * s.notte})`); lg.addColorStop(1, 'rgba(255,228,192,0)')
    g.fillStyle = lg; g.fillRect(u - r, vv - r, 2 * r, 2 * r)
  }
  if (s.auto.l > 0.02) {
    // i fari dell'auto che passa: una striscia calda bassa, davanti, dove sta l'auto (auto-x: 0 a sinistra, 1 a destra)
    const u = W * (0.5 + (s.auto.x - 0.5) * 0.5), vv = H * 0.6, r = 30
    const ag = g.createRadialGradient(u, vv, 0, u, vv, r)
    const c = s.auto.c.map((x) => Math.round(x * 255))
    ag.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${Math.min(1, s.auto.l)})`); ag.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`)
    g.fillStyle = ag; g.fillRect(u - r, vv - r / 2, 2 * r, r)
  }
  return tela
}

// ── la cattura dalla scena 3D della home (window.pzkkoScena): sei facce dal punto del cercapersone ──
const VERSI = [[[1, 0, 0], [0, -1, 0]], [[-1, 0, 0], [0, -1, 0]], [[0, 1, 0], [0, 0, 1]], [[0, -1, 0], [0, 0, -1]], [[0, 0, 1], [0, -1, 0]], [[0, 0, -1], [0, -1, 0]]] // (come la CubeCamera di three)
export function cattura(N = 64) {
  const S = window.pzkkoScena
  if (!S?.renderer || !S.scene || !S.camera) return null
  const cam = S.camera, r = S.renderer, gl = r.getContext()
  const pezzo = S.f?.pezzi?.find((p) => p.el?.id === 'cercapersone-muro')
  if (!pezzo?.mesh) return null
  const salva = { p: cam.position.clone(), q: cam.quaternion.clone(), fov: cam.fov, aspect: cam.aspect, near: cam.near, far: cam.far, up: cam.up.clone() }
  const vp = new Int32Array(4); gl.getParameter?.(gl.VIEWPORT) && vp.set(gl.getParameter(gl.VIEWPORT))
  const facce = []
  try {
    const pos = pezzo.mesh.getWorldPosition(new (cam.position.constructor)())
    pos.z += 0.08 // (un po' davanti alla lamiera)
    cam.fov = 90; cam.aspect = 1; cam.near = 0.05; cam.far = 400
    for (const [dir, up] of VERSI) {
      cam.position.copy(pos); cam.up.set(up[0], up[1], up[2])
      cam.lookAt(pos.x + dir[0], pos.y + dir[1], pos.z + dir[2])
      cam.updateProjectionMatrix(); cam.updateMatrixWorld(true)
      r.setViewport(0, 0, N, N); r.setScissor(0, 0, N, N); r.setScissorTest(true)
      r.render(S.scene, cam)
      const buf = new Uint8Array(N * N * 4)
      gl.readPixels(0, 0, N, N, gl.RGBA, gl.UNSIGNED_BYTE, buf)
      facce.push(buf)
    }
  } catch (e) { console.warn('cattura dell’ambiente', e); return null }
  finally {
    cam.position.copy(salva.p); cam.quaternion.copy(salva.q); cam.fov = salva.fov; cam.aspect = salva.aspect; cam.near = salva.near; cam.far = salva.far; cam.up.copy(salva.up)
    cam.updateProjectionMatrix(); cam.updateMatrixWorld(true)
    r.setScissorTest(false); r.setViewport(0, 0, r.domElement.width / r.getPixelRatio(), r.domElement.height / r.getPixelRatio())
  }
  return facce.length === 6 ? facce : null
}
