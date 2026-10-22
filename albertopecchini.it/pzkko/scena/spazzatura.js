// Quello che sta per terra davanti al negozio, tutto della casa: la lattina di
// pzk-kola schiacciata, la scatola del ramen «pechino» rovesciata coi noodles che
// escono, il pacchetto di luckypzkko accartocciato e i mozziconi, i volantini
// bagnati incollati alle lastre (la Tucson di pzkko motors, pzkkonet, il menu di
// pechino), le gomme da masticare appiccicate, e il chiusino in ghisa di
// pzkkonet, la rete che non c'è: quadrato, in squadra con le lastre, col rilievo
// vero in 3D. Le immagini (etichette, volantini, il chiusino) le disegna
// gpt-image-2 su Replicate (tools/pzkko/scena/disegni.mjs, in art/scena/terra/):
// qui si adattano ai modelli. Tutto fermo, ombre comprese (le mappe d'ombra non si
// rifanno per loro).
import * as T from './lib/three.js'
import { tela, tuboSpezzato } from './materiali.js'
import { foto as fotoDi, poi, disegni } from './disegni.js'
import { CHIUSINO } from './marciapiede.js'

const TERRA = '/art/scena/terra/'
// il centro del chiusino [x, z], sul telefono e sul computer (sotto, P; lo usa anche portachiavi.js, che sta lì accanto)
export const TOMBINO = { telefono: [0.5, 0.9], computer: [1.7, 1.3] }

// un numero a caso ma sempre lo stesso (la spazzatura non si sposta a ogni visita)
let seme = 7
const caso = (a = 0, b = 1) => { seme = (seme * 16807) % 2147483647; return a + ((seme - 1) / 2147483646) * (b - a) }
// le trame di terra/ arrivano in due giri, prima l'anteprima e poi la vera (disegni.js, lo stesso del fronte del negozio)
const foto = (nome, regole) => fotoDi(TERRA, nome, regole)
// più pezzi in una geometria sola, col colore nei vertici: una chiamata di disegno invece di una a pezzo (le gomme, i
// mozziconi, i noodles, i lembi erano decine di chiamate, e lo specchio delle pozze le rifaceva)
const unisci = (parti) => {
  const pos = [], nor = [], col = [], c = new T.Color()
  for (const [g0, matrice, colore] of parti) {
    const g = (g0.index ? g0.toNonIndexed() : g0.clone()).applyMatrix4(matrice), n = g.attributes.position.count
    pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array)
    c.set(colore); for (let i = 0; i < n; i++) col.push(c.r, c.g, c.b)
    g.dispose()
  }
  const g = new T.BufferGeometry()
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new T.Float32BufferAttribute(col, 3))
  return g
}
// le cose piatte (le gomme, i mozziconi, i volantini, il chiusino) stanno sul livello 1, che la telecamera vede (meteo.js
// lo accende) e gli specchi no (mondo.js glielo toglie mentre disegnano): alte pochi millimetri, nel riflesso non si
// vedrebbero, e costerebbero come sullo schermo
const piatto = (o) => o.traverse((m) => m.layers.set(1))

// ── le cose ──────────────────────────────────────────────────────────────────
// una geometria accartocciata: ogni vertice spostato da qualche piega (onde storte), quanto dice forza
const accartoccia = (g, forza, pieghe = 5) => {
  const p = g.attributes.position, onde = Array.from({ length: pieghe }, () => [caso(-1, 1), caso(-1, 1), caso(-1, 1), caso(12, 40), caso(0, 6), caso(0.4, 1)])
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i)
    let d = 0
    for (const [a, b, c, f, ph, k] of onde) d += Math.abs(Math.sin((x * a + y * b + z * c) * f + ph)) * k
    p.setXYZ(i, x, y, z + (d / pieghe - 0.4) * forza)
  }
  g.computeVertexNormals()
  return g
}
// un volantino A5 bagnato, steso per terra: le pieghe della carta che la pioggia ha incollato alle lastre
const volantino = (foglio, lucido = 0.35) => {
  const g = new T.PlaneGeometry(0.148, 0.21, 14, 20)
  g.rotateX(-Math.PI / 2)
  const p = g.attributes.position, f = [caso(40, 70), caso(15, 30), caso(25, 45), caso(5, 15), caso(12, 24)]
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, 0.0035 + 0.006 * Math.abs(Math.sin(x * f[0] + z * f[1])) * Math.abs(Math.sin(z * f[2] - x * f[3])) + 0.004 * Math.max(0, Math.sin(x * f[4] + 1))) }
  g.computeVertexNormals()
  const mat = new T.MeshStandardMaterial({ map: foglio.t, color: foglio.t ? 0xffffff : 0xd8d4c8, roughness: lucido, side: T.DoubleSide })
  poi(foglio, mat, 'map')
  const o = new T.Group(); o.add(new T.Mesh(g, mat))
  return o
}

// ── il chiusino di pzkkonet ──────────────────────────────────────────────────
// Il telaio quadrato da 80 cm col coperchio tondo: una griglia di lati × lati quadretti alzata dalla mappa delle altezze
// (chiusino-alt.webp, piccola: bianco il più alto, nero i fondi) fino a 6,5 mm sopra le lastre (sotto lo zero le
// coprirebbe il marciapiede); il bordo scende a filo. La griglia fa la sagoma, la parallasse e le ombre di contatto; la
// luce la fanno le normali (chiusino-normali.webp, dalla stessa mappa a tutta risoluzione). Il colore è chiusino.webp
// (disegnato dalla stessa mappa), il lucido e il metallo chiusino-lucido.webp. Tutto preparato una volta da
// tools/pzkko/scena/disegni.mjs («usa chiusino-alt»), qui solo caricato
const LATO_CHIUSINO = 0.8
const chiusino = async (lati) => {
  const bordo = (t) => { t.wrapS = t.wrapT = T.ClampToEdgeWrapping }, dati = (t) => { bordo(t); t.colorSpace = T.NoColorSpace }
  const [colore, normali, lucido, alto] = await Promise.all([foto('chiusino', bordo), foto('chiusino-normali', dati), foto('chiusino-lucido', dati),
    new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = TERRA + 'chiusino-alt.webp' })])
  // le altezze: la mappa disegnata grande quanto la griglia, un pixel per vertice
  const n = lati + 1, c = tela(n), g = c.getContext('2d', { willReadFrequently: true })
  if (alto) g.drawImage(alto, 0, 0, n, n); else { g.fillStyle = '#808080'; g.fillRect(0, 0, n, n) }
  const px = g.getImageData(0, 0, n, n).data
  const ALTEZZA = 0.0065, BASE = 0.0008
  // (PlaneGeometry: i vertici a righe dall'alto, v = 1 in alto nell'immagine = verso il muro, così le scritte del
  // medaglione si leggono dalla strada)
  const geo = new T.PlaneGeometry(LATO_CHIUSINO, LATO_CHIUSINO, lati, lati)
  geo.rotateX(-Math.PI / 2)
  const pos = geo.attributes.position, nor = geo.attributes.normal
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const i = y * n + x, bordo = x === 0 || y === 0 || x === lati || y === lati
    pos.setY(i, bordo ? 0 : BASE + (ALTEZZA * px[i * 4]) / 255)
    nor.setXYZ(i, 0, 1, 0)
  }
  const m = new T.MeshStandardMaterial({ map: colore.t, color: colore.t ? 0xffffff : 0x3a3936, normalMap: normali.t, roughnessMap: lucido.t, metalnessMap: lucido.t, roughness: lucido.t ? 1 : 0.6, metalness: lucido.t ? 1 : 0.3 })
  poi(colore, m, 'map'); poi(normali, m, 'normalMap'); poi(lucido, m, 'roughnessMap', 'metalnessMap')
  return new T.Mesh(geo, m)
}

export async function spazzatura(scene, M) {
  const { telefono } = M
  const tutte = []
  const metti = (o, x, z, giro = 0, y = 0) => { o.position.set(x, y, z); o.rotation.y = giro; o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true } }); scene.add(o); tutte.push(o) }
  // dove: davanti al negozio, dove la telecamera guarda il marciapiede in fondo alla pagina. La telecamera è vicina e la
  // prospettiva allarga: più una cosa è vicina a lei, più deve stare in mezzo. [x, z, giro] per computer e telefono.
  // Il chiusino: in mezzo all'inquadratura, in squadra con le lastre (righe da 40 cm dalla facciata: il telaio ne prende
  // due, coi lati sulle fughe; un lato in x sulla fuga di una riga)
  const P = telefono
    ? { kola: [0.12, 0.3, 0.6], pechino: [1.0, 0.36, -0.4], lucky: [0.68, 0.3, 2.2], tucson: [1.02, 0.95, 0.35], pzkkonet: [-0.12, 1.0, -0.6], menu: [0.34, 0.28, 1.4], grissini: [1.0, 0.62, 0.9], tombino: TOMBINO.telefono, area: [0.0, 1.1, 0.22, 1.25] }
    : { kola: [0.45, 0.42, 0.6], pechino: [2.35, 0.5, -0.4], lucky: [1.12, 0.95, 2.2], tucson: [0.78, 0.8, 0.35], pzkkonet: [2.36, 1.22, -0.25], menu: [0.62, 1.22, 0.9], grissini: [1.32, 0.6, 0.42], tombino: TOMBINO.computer, area: [0.3, 2.6, 0.25, 1.45] }
  // le cose da toccare (tocchi.js): cosa sono (il suono, suono/suono.js), l'oggetto; rotola: dondola sulla pancia
  const tocchi = []
  // (le cose sparse a caso, le gomme e i mozziconi, non finiscono sul chiusino)
  const qua = () => { for (;;) { const p = [caso(P.area[0], P.area[1]), caso(P.area[2], P.area[3])]; if (Math.max(Math.abs(p[0] - P.tombino[0]), Math.abs(p[1] - P.tombino[1])) > LATO_CHIUSINO / 2 + 0.04) return p } }
  // (la scatola di pechino ha la stessa faccia sui quattro lati: la trama si ripete quattro volte intorno)
  // (il grissino: la striscia della trama corre lungo il bastoncino, cioè lungo la v del cilindro: girata di 90°)
  const [kola, pechino, lucky, tucson, pzkkonet, menu, grissini, grissino] = await Promise.all([foto('kola'), foto('pechino', (t) => { t.wrapS = T.RepeatWrapping; t.repeat.x = 4 }), foto('lucky'), foto('tucson'), foto('pzkkonet'), foto('menu'),
    foto('grissini'), foto('grissino', (t) => { t.wrapS = t.wrapT = T.MirroredRepeatWrapping; t.center.set(0.5, 0.5); t.rotation = Math.PI / 2 })])

  // la lattina di pzk-kola: rossa, schiacciata in mezzo e piegata, coricata; l'etichetta le gira intorno
  {
    const g = new T.CylinderGeometry(0.033, 0.033, 0.122, 28, 10)
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = Math.exp(-(((y + 0.01) / 0.03) ** 2))
      p.setXYZ(i, x * (1 + 0.15 * k), y * (1 - 0.18 * k) + 0.012 * Math.sin(x * 60) * k, z * (1 - 0.55 * k))
    }
    g.computeVertexNormals()
    const alluminio = new T.MeshStandardMaterial({ color: 0xc9ccce, metalness: 0.9, roughness: 0.28 })
    const etichetta = new T.MeshStandardMaterial({ map: kola.t, color: kola.t ? 0xffffff : 0xc4121b, metalness: 0.75, roughness: 0.3 })
    poi(kola, etichetta, 'map')
    const lattina = new T.Mesh(g, [etichetta, alluminio, alluminio])
    // (prima gira sul suo asse, poi si corica: così tocchi.js la fa rotolare sulla pancia con rotation.y)
    lattina.rotation.order = 'ZYX'
    lattina.rotation.z = Math.PI / 2 - 0.08
    const o = new T.Group(); o.add(lattina); lattina.position.y = 0.022
    metti(o, P.kola[0], P.kola[1], P.kola[2])
    tocchi.push({ cosa: 'lattina', o, rotola: true })
  }
  // la scatola di pechino: un tronco di piramide di cartone, rovesciata, i lembi aperti, il manico di ferro, i noodles
  {
    const o = new T.Group(), cart = new T.MeshStandardMaterial({ map: pechino.t, color: pechino.t ? 0xffffff : 0xf0ece3, roughness: 0.85 })
    poi(pechino, cart, 'map')
    const scatola = new T.Mesh(new T.CylinderGeometry(0.075, 0.055, 0.095, 4, 1, true), cart)
    scatola.rotation.y = Math.PI / 4
    const fondo = new T.Mesh(new T.PlaneGeometry(0.078, 0.078), new T.MeshStandardMaterial({ color: 0xece8de, roughness: 0.9, side: T.DoubleSide }))
    fondo.rotation.x = Math.PI / 2; fondo.position.y = -0.047
    const dentro = new T.Group(); dentro.add(scatola, fondo)
    const lembi = [], pianoLembo = new T.PlaneGeometry(0.105, 0.045)
    for (let i = 0; i < 4; i++) {
      const lembo = new T.Object3D(), a = (i * Math.PI) / 2
      lembo.position.set(Math.sin(a) * 0.053, 0.06, Math.cos(a) * 0.053); lembo.rotation.y = a; lembo.rotation.x = -0.5 - 0.3 * caso(); lembo.updateMatrix()
      lembi.push([pianoLembo, lembo.matrix, 0xf0ece3])
    }
    dentro.add(new T.Mesh(unisci(lembi), new T.MeshStandardMaterial({ color: 0xf0ece3, roughness: 0.85, side: T.DoubleSide })))
    const manico = new T.Mesh(new T.TorusGeometry(0.05, 0.0012, 4, 24, Math.PI), new T.MeshStandardMaterial({ color: 0x9a9da0, metalness: 0.8, roughness: 0.4 }))
    manico.position.y = 0.05; dentro.add(manico)
    dentro.rotation.z = Math.PI / 2 + 0.25; dentro.position.y = 0.05
    o.add(dentro)
    // i noodles che escono: fili gialli storti per terra
    const mNoodle = new T.MeshStandardMaterial({ color: 0xe8c56a, roughness: 0.45 }), fili = []
    for (let k = 0; k < 9; k++) {
      let x = -0.06, z = (caso() - 0.5) * 0.05, a = caso(-0.5, 0.5)
      const pts = [new T.Vector3(x, 0.0025, z)]
      for (let j = 0; j < 14; j++) { a += caso(-0.7, 0.7); x -= Math.cos(a) * 0.009; z += Math.sin(a) * 0.009; pts.push(new T.Vector3(x, 0.0025, z)) }
      fili.push(pts)
    }
    o.add(new T.Mesh(unisci(fili.map((pts) => [tuboSpezzato(pts, 0.0018, 5), new T.Matrix4(), 0xe8c56a])), mNoodle))
    metti(o, P.pechino[0], P.pechino[1], P.pechino[2])
    tocchi.push({ cosa: 'cartone', o })
  }
  // il pacchetto di luckypzkko, accartocciato (la faccia davanti su ogni lato); i mozziconi qua e là
  {
    const g = accartoccia(new T.BoxGeometry(0.055, 0.088, 0.022, 6, 8, 3), 0.008)
    const carta = new T.MeshStandardMaterial({ map: lucky.t, color: lucky.t ? 0xffffff : 0xf2f0ea, roughness: 0.55 })
    poi(lucky, carta, 'map')
    const pacchetto = new T.Mesh(g, carta)
    pacchetto.rotation.x = -Math.PI / 2 + 0.05; pacchetto.position.y = 0.012
    const o = new T.Group(); o.add(pacchetto)
    metti(o, P.lucky[0], P.lucky[1], P.lucky[2])
    tocchi.push({ cosa: 'pacchetto', o })
    // (ognuno: il filtro, la carta, la cenere; montati e poi uniti tutti in una geometria)
    const parti = [], filtro = new T.CylinderGeometry(0.0039, 0.0039, 0.021, 10), cenere = new T.CylinderGeometry(0.0036, 0.0038, 0.003, 10)
    for (let i = 0; i < 9; i++) {
      const m = new T.Group(), l = caso(0.012, 0.03)
      const f = new T.Mesh(filtro); f.position.y = 0.0105
      const c = new T.Mesh(new T.CylinderGeometry(0.0038, 0.0038, l, 10)); c.position.y = 0.021 + l / 2
      const b = new T.Mesh(cenere); b.position.y = 0.021 + l + 0.0015
      m.add(f, c, b); m.rotation.z = Math.PI / 2
      const o2 = new T.Group(); o2.add(m); m.position.y = 0.0039
      const [x, z] = qua(); o2.position.set(x, 0, z); o2.rotation.y = caso(0, Math.PI * 2); o2.updateMatrixWorld(true)
      parti.push([f.geometry, f.matrixWorld, 0xc98a4b], [c.geometry, c.matrixWorld, 0xe9e6de], [b.geometry, b.matrixWorld, 0x3a3836])
    }
    const mozziconi = new T.Group(); mozziconi.add(new T.Mesh(unisci(parti), new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.88 })))
    metti(mozziconi, 0, 0); piatto(mozziconi)
  }
  // i volantini bagnati per terra: la Tucson (lucida), pzkkonet e il menu di pechino (carta da poco)
  for (const [mappa, dove, lucido] of [[tucson, P.tucson, 0.32], [pzkkonet, P.pzkkonet, 0.45], [menu, P.menu, 0.5]]) {
    const o = volantino(mappa, lucido)
    metti(o, dove[0], dove[1], dove[2]); piatto(o)
    // (incollati dalla pioggia: non si muovono, fanno solo il rumore della carta bagnata)
    tocchi.push({ cosa: 'carta-bagnata', o: o.children[0], margine: 0.004 })
  }
  // i grissini alla pizza (22.10): il pacchetto di «grissin pzk» aperto da un lato, coi grissini che escono, due per terra
  // (uno rotto in tre pezzi) e le briciole. Il pacchetto è un cuscino schiacciato di film lucido (la faccia disegnata da
  // gpt-image-2, disegni.mjs «grissini»), i grissini cilindri con la trama ritagliata dalla finestra del pacchetto
  {
    const o = new T.Group(), LG = 0.27, LW = 0.112, LH = 0.026
    const g = accartoccia(new T.BoxGeometry(LG, LW, LH, 14, 6, 2), 0.006, 6)
    // (le facce: +x, −x, +y, −y, +z, −z; coricato, la +z guarda in su)
    const busta = new T.MeshStandardMaterial({ map: grissini.t, color: grissini.t ? 0xffffff : 0xc4161a, roughness: 0.3, metalness: 0.05 })
    const fianco = new T.MeshStandardMaterial({ color: 0xa8141a, roughness: 0.34, metalness: 0.05 })
    poi(grissini, busta, 'map')
    const pacco = new T.Mesh(g, [fianco, fianco, fianco, fianco, busta, fianco])
    pacco.rotation.x = -Math.PI / 2; pacco.position.y = LH / 2 - 0.004
    o.add(pacco)
    const pasta = new T.MeshStandardMaterial({ map: grissino.t, color: grissino.t ? 0xffffff : 0xd59a52, roughness: 0.72 })
    poi(grissino, pasta, 'map')
    const bastoncino = (l) => new T.CylinderGeometry(0.0044, 0.0047, l, 9, 1)
    const fuori = []
    // quelli che escono dalla parte aperta (a +x), a ventaglio
    for (let i = 0; i < 6; i++) {
      const l = caso(0.2, 0.25), m = new T.Mesh(bastoncino(l)), a = caso(-0.12, 0.14), z = (i - 2.5) * 0.013 + caso(-0.004, 0.004)
      m.rotation.set(0, a, Math.PI / 2); m.position.set(LG / 2 - l / 2 + caso(0.03, 0.09), 0.0055 + (i % 2) * 0.004, z)
      m.updateMatrix(); fuori.push([m.geometry, m.matrix.clone(), 0xffffff])
    }
    // due per terra: uno intero, uno rotto in tre pezzi
    const per = (l, x, z, a) => { const m = new T.Mesh(bastoncino(l)); m.rotation.set(0, a, Math.PI / 2); m.position.set(x, 0.0046, z); m.updateMatrix(); fuori.push([m.geometry, m.matrix.clone(), 0xffffff]) }
    per(0.23, LG / 2 + 0.07, 0.07, 0.5)
    per(0.09, LG / 2 + 0.03, -0.085, -0.3); per(0.07, LG / 2 + 0.13, -0.1, 0.8); per(0.05, LG / 2 + 0.2, -0.06, -1.2)
    const gg = unisci(fuori)
    // (unisci butta le uv: le si rimette, una copia per pezzo, come le avevano i cilindri)
    const uv = []
    for (const [g0] of fuori) uv.push(...(g0.index ? g0.toNonIndexed() : g0).attributes.uv.array)
    gg.setAttribute('uv', new T.Float32BufferAttribute(uv, 2))
    o.add(new T.Mesh(gg, pasta))
    // le briciole
    const bri = []
    for (let i = 0; i < 26; i++) { const m = new T.Mesh(new T.BoxGeometry(1, 1, 1)); const s = caso(0.002, 0.005); m.scale.set(s, s * 0.6, s * caso(0.6, 1)); m.position.set(LG / 2 + caso(-0.02, 0.22), s * 0.3, caso(-0.11, 0.1)); m.rotation.y = caso(0, 3); m.updateMatrix(); bri.push([m.geometry, m.matrix.clone(), i % 4 ? 0xd9a35c : 0xb4532f]) }
    const briciole = new T.Mesh(unisci(bri), new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 }))
    briciole.castShadow = false; o.add(briciole)
    metti(o, P.grissini[0], P.grissini[1], P.grissini[2])
    tocchi.push({ cosa: 'grissini', o })
  }
  // le gomme da masticare appiccicate: vecchie (nere, grigie) e qualcuna fresca (rosa, menta)
  {
    // (due geometrie: le vecchie opache, le fresche più lucide; niente ombra, sono alte due millimetri)
    const g = new T.SphereGeometry(1, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2), colori = [0x2a2a28, 0x3d3b38, 0x55524d, 0x6b6862, 0x2f2d2a, 0xe58fb0, 0xa6e3cd, 0xe9e4d8]
    const vecchie = [], fresche = []
    for (let i = 0; i < 16; i++) {
      const r = caso(0.007, 0.014), m = new T.Mesh(g)
      m.scale.set(r, caso(0.0012, 0.0024), r * caso(0.75, 1))
      const o = new T.Group(); o.add(m); m.position.y = 0.0015
      const [x, z] = qua(); o.position.set(x, 0, z); o.rotation.y = caso(0, Math.PI * 2); o.updateMatrixWorld(true)
      ;(i % colori.length > 4 ? fresche : vecchie).push([g, m.matrixWorld, colori[i % colori.length]])
    }
    const gomme = new T.Group()
    gomme.add(new T.Mesh(unisci(vecchie), new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 })), new T.Mesh(unisci(fresche), new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.5 })))
    metti(gomme, 0, 0); piatto(gomme)
    gomme.traverse((m) => { m.castShadow = false })
  }
  // il chiusino: in squadra (nessuna rotazione), le lastre intorno tagliate sul telaio (CHIUSINO, marciapiede.js).
  // Niente ombra portata: i rilievi sono di millimetri, la mappa d'ombra non li vedrebbe
  {
    const o = new T.Group(); o.add(await chiusino(telefono ? 160 : 192))
    metti(o, P.tombino[0], P.tombino[1]); piatto(o)
    o.traverse((m) => { m.castShadow = false })
    CHIUSINO.value.set(P.tombino[0], P.tombino[1], LATO_CHIUSINO / 2, 0)
    tocchi.push({ cosa: 'chiusino', o: o.children[0], margine: 0.002 })
  }
  // aggiorna, avanzamento, vere: di tutte le immagini disegnate, anche quelle del fronte del negozio (disegni.js)
  return { tutte, tocchi, ...disegni }
}
