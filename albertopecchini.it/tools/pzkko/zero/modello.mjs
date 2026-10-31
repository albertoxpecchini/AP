#!/usr/bin/env node
// Il modello 3D del cercapersone «zero» (29.10, Alberto: «voglio lui come mockup… è in 3d mi raccomando»): dall'OBJ di
// Rhino del mockup (fpr-001, 169 000 vertici, in millimetri: Y è l'asse lungo, X quello corto col bordo di sopra a X−,
// Z lo spessore col fronte a Z+) a un GLB piccolo per il browser, pzkko/art/zero/zero.glb.
//
//   node tools/pzkko/zero/modello.mjs <file.obj>            scrive il GLB
//   node tools/pzkko/zero/modello.mjs <file.obj> --stat     dice solo cosa c'è dentro (pezzi, materiali, misure)
//
// Si tengono solo i pezzi che si vedono: i due gusci (Top_cover, Bottom_cover), la cornice dello schermo, i tre tasti
// (croce, OK, indietro), la staffa della porta usb-c (Mount, dietro il foro sulla testata destra), la finestra dell'IR,
// il vetro dello schermo, il tubicino del led (Lightpipe),
// i contatti dorati della testata sinistra e le stampe sul retro (gli
// object_N a Z −22,8). Via le viti (sotto il retro), la micro sd, la scheda e tutto quello che sta dentro, e i disegni
// dello schermo (gli object_N a Z 0 col materiale 013: il delfino del mockup; lo schermo lo fa pzk os) e la scritta
// «FLIPPER» in rilievo (shell_11): al suo posto zero.js stampa «pzkko».
// Posizioni in int16 (KHR_mesh_quantization: 0,0015 mm di passo) senza normali, che il browser calcola da solo (i
// vertici sono già doppi sugli spigoli vivi, come li esporta Rhino): ~1,2 MB invece di 34.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const QUI = dirname(fileURLToPath(import.meta.url))
const OUT = join(QUI, '../../../pzkko/art/zero/zero.glb')
const file = process.argv[2]
const stat = process.argv.includes('--stat')
if (!file) { console.error('uso: modello.mjs <file.obj> [--stat]'); process.exit(1) }

// pezzo dell'OBJ → nome della mesh nel GLB (i pezzi con lo stesso nome si fondono)
const PEZZI = {
  Top_cover: 'guscio-sopra', Bottom_cover: 'guscio-sotto', Display_housing: 'cornice',
  Navigation_button: 'croce', OK_Button: 'ok', Back_button: 'indietro',
  Mount: 'usb', IR_window: 'ir', Screen: 'vetro', Lightpipe: 'led', // (shell_11, la scritta «FLIPPER» in rilievo, resta fuori: al suo posto zero.js stampa «pzkko»)
  MANIFOLD_SOLID_BREP__29673: 'oro', MANIFOLD_SOLID_BREP__29265: 'oro',
}
const STAMPA = /^object_\d+$/ // le stampe sul retro (materiale 012) e i disegni dello schermo (013, via)

const V = [] // [x, y, z]
const mesh = new Map() // nome → { tri: [vi…], mats: Map }
const conti = new Map() // «pezzo · materiale» → facce (per --stat)
const limiti = new Map() // pezzo → [min xyz, max xyz]
let obj = null, mat = null, dove = null
const rl = createInterface({ input: createReadStream(file) })
let resto = '' // Rhino spezza le facce lunghe su più righe, con la barra rovesciata in fondo
for await (let riga of rl) {
  if (resto) { riga = resto + riga; resto = '' }
  if (riga.endsWith('\\')) { resto = riga.slice(0, -1); continue }
  const c = riga.charCodeAt(0)
  if (c === 118 && riga.charCodeAt(1) === 32) { // «v »
    const p = riga.slice(2).trim().split(/\s+/).map(Number)
    V.push(p)
    if (dove) { const l = limiti.get(obj) ?? limiti.set(obj, [[1e9, 1e9, 1e9], [-1e9, -1e9, -1e9]]).get(obj); for (let i = 0; i < 3; i++) { if (p[i] < l[0][i]) l[0][i] = p[i]; if (p[i] > l[1][i]) l[1][i] = p[i] } }
  } else if (c === 102 && riga.charCodeAt(1) === 32) { // «f »
    if (!dove) continue
    const idx = riga.slice(2).trim().split(/\s+/).map((s) => Number(s.split('/')[0]) - 1)
    const m = mesh.get(dove) ?? mesh.set(dove, { tri: [] }).get(dove)
    for (let i = 1; i + 1 < idx.length; i++) m.tri.push(idx[0], idx[i], idx[i + 1])
    const k = `${obj} · ${mat}`; conti.set(k, (conti.get(k) ?? 0) + idx.length - 2)
  } else if (riga.startsWith('o ')) { obj = riga.slice(2).trim(); mat = null; dove = PEZZI[obj] ?? (STAMPA.test(obj) ? 'stampa?' : null) }
  else if (riga.startsWith('usemtl ')) {
    mat = riga.slice(7).trim()
    if (dove === 'stampa?' || dove === 'stampa' || (dove === null && STAMPA.test(obj))) dove = mat === 'New material 012' ? 'stampa' : null
  }
}
console.log(`${V.length} vertici letti`)
if (stat) {
  for (const [k, n] of [...conti].sort((a, b) => b[1] - a[1])) { const o = k.split(' · ')[0], l = limiti.get(o); console.log(k.padEnd(48), String(n).padStart(6), l ? l.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' → ') : '') }
  process.exit(0)
}

// i limiti di tutto quello che si tiene, per la quantizzazione
const min = [1e9, 1e9, 1e9], max = [-1e9, -1e9, -1e9]
for (const { tri } of mesh.values()) for (const vi of tri) { const p = V[vi]; for (let i = 0; i < 3; i++) { if (p[i] < min[i]) min[i] = p[i]; if (p[i] > max[i]) max[i] = p[i] } }
const centro = min.map((a, i) => (a + max[i]) / 2)
const passo = Math.max(...max.map((a, i) => a - min[i])) / 2 / 32000 // un'unità int16: ~0,0016 mm
console.log('limiti', min.map((v) => v.toFixed(1)).join(' '), '→', max.map((v) => v.toFixed(1)).join(' '), 'passo', passo.toFixed(5))

// ogni mesh: i suoi vertici (rinumerati) e i triangoli
const pezzi = []
const chunk = [] // i pezzi del buffer binario
let offset = 0
const metti = (buf, target) => { const pad = (4 - (buf.byteLength % 4)) % 4; chunk.push(buf, new Uint8Array(pad)); const bv = { buffer: 0, byteOffset: offset, byteLength: buf.byteLength, target }; offset += buf.byteLength + pad; return bv }
const json = { asset: { version: '2.0', generator: 'tools/pzkko/zero/modello.mjs' }, extensionsUsed: ['KHR_mesh_quantization'], extensionsRequired: ['KHR_mesh_quantization'], scene: 0, scenes: [{ nodes: [0] }], nodes: [{ name: 'zero', translation: centro, scale: [passo, passo, passo], children: [] }], meshes: [], accessors: [], bufferViews: [], buffers: [], materials: [] }
const MATERIALI = { 'guscio-sopra': 'bianco', 'guscio-sotto': 'bianco', cornice: 'nero', croce: 'arancio', ok: 'arancio', indietro: 'arancio', usb: 'metallo', ir: 'ir', vetro: 'vetro', led: 'led', oro: 'oro', stampa: 'stampa' }
const COLORI = { bianco: [0.93, 0.91, 0.87], nero: [0.05, 0.05, 0.05], arancio: [0.96, 0.52, 0.1], metallo: [0.6, 0.6, 0.62], ir: [0.12, 0.04, 0.04], vetro: [0.1, 0.1, 0.1], led: [0.9, 0.9, 0.9], oro: [0.9, 0.7, 0.3], stampa: [0.75, 0.74, 0.7] }
const matIdx = new Map()
for (const [nome, { tri }] of mesh) {
  const nuovo = new Map(), idx = []
  for (const vi of tri) { let n = nuovo.get(vi); if (n === undefined) { n = nuovo.size; nuovo.set(vi, n) } idx.push(n) }
  const nv = nuovo.size
  const pos = new Int16Array(nv * 3)
  const pmin = [32767, 32767, 32767], pmax = [-32768, -32768, -32768]
  for (const [vi, n] of nuovo) for (let i = 0; i < 3; i++) { const q = Math.max(-32767, Math.min(32767, Math.round((V[vi][i] - centro[i]) / passo))); pos[n * 3 + i] = q; if (q < pmin[i]) pmin[i] = q; if (q > pmax[i]) pmax[i] = q }
  const corti = nv <= 65535
  const ind = corti ? new Uint16Array(idx) : new Uint32Array(idx)
  const m = MATERIALI[nome]
  if (!matIdx.has(m)) { matIdx.set(m, json.materials.length); json.materials.push({ name: m, pbrMetallicRoughness: { baseColorFactor: [...COLORI[m], 1], metallicFactor: m === 'metallo' || m === 'oro' ? 1 : 0, roughnessFactor: 0.5 } }) }
  const bvP = json.bufferViews.push(metti(new Uint8Array(pos.buffer), 34962)) - 1
  const bvI = json.bufferViews.push(metti(new Uint8Array(ind.buffer), 34963)) - 1
  const aP = json.accessors.push({ bufferView: bvP, componentType: 5122, count: nv, type: 'VEC3', min: pmin, max: pmax }) - 1
  const aI = json.accessors.push({ bufferView: bvI, componentType: corti ? 5123 : 5125, count: idx.length, type: 'SCALAR' }) - 1
  const mi = json.meshes.push({ name: nome, primitives: [{ attributes: { POSITION: aP }, indices: aI, material: matIdx.get(m) }] }) - 1
  json.nodes[0].children.push(json.nodes.push({ name: nome, mesh: mi }) - 1)
  pezzi.push([nome, nv, idx.length / 3])
}
json.buffers.push({ byteLength: offset })
for (const [n, v, f] of pezzi.sort((a, b) => b[2] - a[2])) console.log(n.padEnd(14), String(v).padStart(6), 'vertici', String(f).padStart(6), 'triangoli')

// il GLB: intestazione, blocco JSON, blocco BIN
const enc = new TextEncoder()
let js = enc.encode(JSON.stringify(json))
const padJ = (4 - (js.byteLength % 4)) % 4
js = new Uint8Array([...js, ...new Array(padJ).fill(0x20)])
const bin = new Uint8Array(offset)
{ let o = 0; for (const c of chunk) { bin.set(c, o); o += c.byteLength } }
const tot = 12 + 8 + js.byteLength + 8 + bin.byteLength
const out = new Uint8Array(tot), dv = new DataView(out.buffer)
dv.setUint32(0, 0x46546c67, true); dv.setUint32(4, 2, true); dv.setUint32(8, tot, true)
dv.setUint32(12, js.byteLength, true); dv.setUint32(16, 0x4e4f534a, true); out.set(js, 20)
dv.setUint32(20 + js.byteLength, bin.byteLength, true); dv.setUint32(24 + js.byteLength, 0x004e4942, true); out.set(bin, 28 + js.byteLength)
await mkdir(dirname(OUT), { recursive: true })
await writeFile(OUT, out)
console.log('scritto', OUT, Math.round(tot / 1024), 'KB')
