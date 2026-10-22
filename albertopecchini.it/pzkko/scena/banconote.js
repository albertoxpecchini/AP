// I $pzk persi per terra (22.10 notte): quattro banconote della banca $pzk, da 500, 100, 25 e 10, cadute a qualcuno sul
// marciapiede davanti al negozio, un po' stropicciate e incollate alle lastre come i volantini bagnati. Si raccolgono
// toccandole (tocchi.js): la banconota si alza verso la telecamera e sparisce, e i suoi $pzk entrano nel saldo
// (games/pzk.js, trova: una volta al giorno ciascuna; col conto se lo segna il server, nella sessione il browser).
// Domani sono di nuovo lì. Le immagini le ha disegnate gpt-image-2 (tools/pzkko/fogli.js, foglio «banconote»,
// art/banconote/). Sul livello 1, come la roba per terra: gli specchi non le vedono.
import * as T from './lib/three.js'
import { immagine } from './materiali.js'
import * as pzk from '../games/pzk.js'

const ARTE = '/art/banconote/'
const LARG = 0.15, ALT = 0.075 // un po' più grandi di una banconota vera (0,133 × 0,067), si leggono meglio da lontano
// dove, [x, z, giro] (per computer e telefono: come spazzatura.js, più sono vicine alla telecamera più stanno in mezzo)
const POSTI = {
  computer: { b500: [1.05, 1.5, -0.35], b100: [2.1, 0.86, 0.5], b25: [0.6, 1.25, 1.3], b10: [2.3, 1.4, -1.1] },
  telefono: { b500: [0.3, 1.55, 0.25], b100: [0.92, 1.3, -0.6], b25: [-0.2, 0.75, 1.1], b10: [0.62, 0.52, 0.6] },
}
// (un numero a caso ma sempre lo stesso: le pieghe della carta non cambiano a ogni visita)
let seme = 31
const caso = (a = 0, b = 1) => { seme = (seme * 16807) % 2147483647; return a + ((seme - 1) / 2147483646) * (b - a) }

export function banconote(scene, M, camera) {
  const posti = M.telefono ? POSTI.telefono : POSTI.computer
  const tocchi = [], tutte = []
  const raccolte = new Set(pzk.trovate())
  for (const [quale, [x, z, giro]] of Object.entries(posti)) {
    // la carta: un piano con qualche piega, un filo sollevato agli angoli
    const g = new T.PlaneGeometry(LARG, ALT, 16, 8)
    g.rotateX(-Math.PI / 2)
    const p = g.attributes.position, f = [caso(30, 60), caso(20, 40), caso(25, 50), caso(4, 12)]
    for (let i = 0; i < p.count; i++) { const px = p.getX(i), pz = p.getZ(i); p.setY(i, 0.0025 + 0.004 * Math.abs(Math.sin(px * f[0] + pz * f[1])) * Math.abs(Math.sin(pz * f[2] - px * f[3])) + 0.003 * Math.max(0, Math.abs(px) / (LARG / 2) - 0.7)) }
    g.computeVertexNormals()
    const mat = new T.MeshStandardMaterial({ color: 0xd9d2bd, roughness: 0.78, side: T.DoubleSide, transparent: true })
    immagine(ARTE + quale + '.webp').then((t) => { mat.map = t; mat.color.set(0xffffff); mat.needsUpdate = true }, () => {})
    const m = new T.Mesh(g, mat)
    m.castShadow = false; m.receiveShadow = true; m.layers.set(1)
    const o = new T.Group(); o.add(m)
    o.position.set(x, 0, z); o.rotation.y = giro
    o.visible = !raccolte.has(quale)
    scene.add(o)
    const b = { quale, valore: pzk.BANCONOTE[quale], o, m, mat, presa: 0, t0: 0 }
    tutte.push(b)
    tocchi.push({ cosa: 'banconota', o, margine: 0.012, prendi: () => prendi(b) })
  }
  const voli = new Set()
  const prendi = (b) => {
    if (!b.o.visible || b.presa) return false
    if (!pzk.trova(b.quale)) return false
    b.presa = 1; b.t0 = performance.now(); b.y0 = b.o.position.y
    voli.add(b)
    document.dispatchEvent(new CustomEvent('pzkko-banconota', { detail: { quale: b.quale, valore: b.valore } }))
    return true
  }
  // domani (il giorno di Mantova cambia mentre la pagina è aperta, o si è usciti dal conto): tornano quelle da raccogliere
  const rimetti = () => { const r = new Set(pzk.trovate()); for (const b of tutte) if (!b.presa) b.o.visible = !r.has(b.quale) }
  pzk.osserva(rimetti)
  return {
    tocchi,
    // la banconota raccolta vola verso la telecamera e svanisce (0,7 s); torna visibile solo rimettendola (domani)
    aggiorna(now) {
      if (!voli.size) return false
      for (const b of voli) {
        const u = Math.min(1, (now - b.t0) / 700), e = 1 - (1 - u) ** 3
        const dir = camera.position.clone().sub(b.o.position)
        b.o.position.y = b.y0 + 0.35 * e
        b.o.position.x += dir.x * 0.02 * e; b.o.position.z += dir.z * 0.02 * e
        b.o.rotation.y += 0.04; b.m.rotation.x = -0.9 * e
        b.mat.opacity = 1 - Math.max(0, (u - 0.55) / 0.45)
        if (u >= 1) { b.o.visible = false; b.presa = 0; b.mat.opacity = 1; b.m.rotation.x = 0; b.o.position.y = 0; voli.delete(b) }
      }
      return true
    },
  }
}
