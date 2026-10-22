// Il fronte del negozio intorno alla saracinesca, com'è davvero (21.10): la porta a vetri d'alluminio col suo zoccolo
// pestato, il maniglione, il cilindro e le cerniere, gli adesivi sul vetro (l'orario, vietato fumare, la
// videosorveglianza, «spingere») e dietro il cartello «chiuso» appeso coi suoi fili; il citofono col nome «pzkko» a penna,
// che di notte si accende; la targa smaltata del civico 28; il lucchettone d'ottone che tiene chiusa la saracinesca, col
// ferro passato nell'occhiello saldato alla barra e nella cambretta murata nella soglia; e sulla facciata quello che ci
// hanno lasciato gli anni: il pezzo «PZK» argento, lo stencil «divieto di affissione», le tag, la chiocciola col gesso,
// la pittura del comune sopra un graffito vecchio, gli adesivi sul pluviale e sul telaio.
// Tutto disegnato da gpt-image-2 su Replicate, niente scritto dal codice: le trame in art/scena/fronte/
// (tools/pzkko/scena/disegni.mjs: il citofono coi suoi rilievi, da cui le normali; il lucchetto, la faccia e il fondo;
// l'alluminio e lo zoccolo), i pezzi della facciata e della porta negli atlanti di art/scena/muro/ (i fogli facciata,
// adesivi e porta di tools/pzkko/fogli.js, messi insieme da tools/pzkko/scena/atlanti.mjs: due chiamate di disegno in
// tutto). Arrivano come la roba per terra, prima le anteprime e poi le vere (disegni.js).
import * as T from './lib/three.js'
import { tuboSpezzato, Z_FACCIATA } from './materiali.js'
import { bagnato } from './acqua.js'
import { foto, poi } from './disegni.js'

const FRONTE = '/art/scena/fronte/', MURO = '/art/scena/muro/'
const GRADI = Math.PI / 180
// il citofono: la piastra (12 × 18 cm) e, dentro la sua immagine, la finestrella del nome (u, v da sotto)
const CITOFONO = { larg: 0.12, alt: 0.18, prof: 0.022, nome: { u0: 0.195, u1: 0.805, v0: 0.411, v1: 0.523 }, bottone: { u: 0.5, v: 0.232, r: 0.146 } }

export async function fronte(scene, M, h, { PORTA, zp }) {
  const { W } = M
  const ripeti = (t) => { t.wrapS = t.wrapT = T.MirroredRepeatWrapping }, dati = (t) => { t.colorSpace = T.NoColorSpace }
  const [alu, zoc, cit, citN, citL, luc, lucF, graf, ades, R] = await Promise.all([
    foto(FRONTE, 'alluminio', ripeti), foto(FRONTE, 'zoccolo'), foto(FRONTE, 'citofono'), foto(FRONTE, 'citofono-normali', dati), foto(FRONTE, 'citofono-lucido', dati),
    foto(FRONTE, 'lucchetto'), foto(FRONTE, 'lucchetto-fondo'), foto(MURO, 'graffiti'), foto(MURO, 'adesivi'),
    fetch(MURO + 'pezzi.json').then((r) => (r.ok ? r.json() : null)).catch(() => null),
  ])
  const ombra = (m, getta = true, riceve = true) => { m.castShadow = getta; m.receiveShadow = riceve; return m }
  const colore = (f, c) => (f.t ? 0xffffff : c)

  // ── la porta: il telaio fisso nel muro, l'anta coi suoi profili, lo zoccolo, il maniglione, il cilindro, le cerniere ──
  // L'alluminio è una trama sola, stesa in coordinate del mondo (mezzo metro, specchiata): sui montanti la spazzolatura
  // va in su, sui traversi per lungo. Tutti i profili sono una geometria
  const { x0, x1, h: ph } = PORTA, cx = (x0 + x1) / 2
  const LATO = 0.5, profili = []
  const profilo = (w, hh, d, x, y, z) => {
    const g = new T.BoxGeometry(w, hh, d); g.translate(x, y, z)
    const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv, lungo = w > hh
    for (let i = 0; i < p.count; i++) {
      const X = p.getX(i), Y = p.getY(i), Z = p.getZ(i)
      const [a, b] = Math.abs(n.getY(i)) > 0.5 ? [X, Z] : Math.abs(n.getX(i)) > 0.5 ? [Z, Y] : [X, Y]
      uv.setXY(i, (lungo ? b : a) / LATO, (lungo ? a : b) / LATO)
    }
    profili.push(g)
  }
  const T0 = 0.045, A0 = x0 + T0, A1 = x1 - T0, MONT = 0.065, za = zp + 0.004, PA = 0.045 // il telaio, l'anta, la profondità
  profilo(T0, ph, 0.07, x0 + T0 / 2, ph / 2, 0.035); profilo(T0, ph, 0.07, x1 - T0 / 2, ph / 2, 0.035); profilo(x1 - x0, T0, 0.07, cx, ph - T0 / 2, 0.035)
  const ZOC = 0.3 // lo zoccolo, in fondo all'anta
  profilo(MONT, ph - T0 - 0.012, PA, A0 + MONT / 2, (ph - T0 + 0.012) / 2, za); profilo(MONT, ph - T0 - 0.012, PA, A1 - MONT / 2, (ph - T0 + 0.012) / 2, za)
  profilo(A1 - A0 - 2 * MONT, MONT, PA, cx, ph - T0 - MONT / 2, za); profilo(A1 - A0 - 2 * MONT, 0.07, PA, cx, 1.0, za)
  profilo(A1 - A0 - 2 * MONT, 0.03, PA, cx, ZOC + 0.015, za)
  profilo(x1 - x0, 0.012, 0.11, cx, 0.006, 0.035) // la soglia
  // (la trama è chiara: il colore la porta al grigio dell'alluminio anodizzato vecchio, e il metallo prende il cielo)
  const mAlu = new T.MeshStandardMaterial({ map: alu.t, color: alu.t ? 0x8d9093 : 0x7f8285, metalness: 0.6, roughness: 0.46 })
  poi(alu, mAlu, 'map')
  scene.add(ombra(new T.Mesh(T.mergeGeometries(profili), mAlu)))
  const mZoccolo = new T.MeshStandardMaterial({ map: zoc.t, color: zoc.t ? 0x9c9fa2 : 0x7f8285, metalness: 0.55, roughness: 0.5 })
  poi(zoc, mZoccolo, 'map')
  const zoccolo = ombra(new T.Mesh(new T.BoxGeometry(A1 - A0 - 2 * MONT, ZOC - 0.012, 0.012), mZoccolo))
  zoccolo.position.set(cx, (ZOC + 0.012) / 2, za + 0.006); scene.add(zoccolo)
  // il maniglione d'acciaio sul montante di destra, coi due distanziali; il cilindro d'ottone sotto; tre cerniere a sinistra
  const fronteAnta = za + PA / 2, xm = A1 - MONT / 2
  const mAcciaio = new T.MeshStandardMaterial({ color: 0xc4c7ca, metalness: 1, roughness: 0.3 })
  const mOttone = new T.MeshStandardMaterial({ color: 0xa8854f, metalness: 1, roughness: 0.36 })
  const ferri = [tuboSpezzato([new T.Vector3(xm, 0.78, fronteAnta + 0.06), new T.Vector3(xm, 1.27, fronteAnta + 0.06)], 0.0125, 14)]
  for (const y of [0.84, 1.21]) ferri.push(tuboSpezzato([new T.Vector3(xm, y, fronteAnta), new T.Vector3(xm, y, fronteAnta + 0.06)], 0.007, 10))
  for (const y of [0.3, 1.18, 2.02]) { const c = new T.CylinderGeometry(0.009, 0.009, 0.1, 12); c.translate(A0 - 0.001, y, za + PA / 2 + 0.004); ferri.push(c) }
  scene.add(ombra(new T.Mesh(T.mergeGeometries(ferri.map((g) => (g.index ? g.toNonIndexed() : g)).map((g) => { g.deleteAttribute('uv'); return g })), mAcciaio)))
  const cilindro = new T.Mesh(new T.CylinderGeometry(0.012, 0.013, 0.014, 18), mOttone)
  cilindro.rotation.x = Math.PI / 2; cilindro.position.set(xm, 1.0, fronteAnta + 0.007); scene.add(ombra(cilindro, false))
  const fessura = new T.Mesh(new T.BoxGeometry(0.0018, 0.012, 0.002), new T.MeshStandardMaterial({ color: 0x0c0b0a, roughness: 0.9 }))
  fessura.position.set(xm, 1.0, fronteAnta + 0.0145); scene.add(fessura)

  // ── i pezzi degli atlanti: piani sul muro, sul vetro, sul telaio, e curvi attorno al pluviale ──
  // nome, dove (x, y, z), larghezza in metri (l'altezza viene dall'immagine), un filo di rotazione; cil: attorno a un
  // cilindro verticale (cx, cz, raggio) con la faccia girata di a0 dalla strada
  const raccolta = (atlante) => ({ atlante, pos: [], nor: [], uv: [], idx: [] })
  const metti = (r, nome, { x = 0, y, z = 0, w, giro = 0, cil = null }) => {
    const q = R?.[r.atlante]?.[nome]
    if (!q) return
    const hh = (w * q.h) / q.w, cols = cil ? 8 : 1, b = r.pos.length / 3
    for (let j = 0; j <= 1; j++) for (let i = 0; i <= cols; i++) {
      const u = i / cols, v = j, lx = (u - 0.5) * w, ly = (v - 0.5) * hh
      if (cil) {
        const a = cil.a0 + lx / cil.r
        r.pos.push(cil.cx + cil.r * Math.sin(a), y + ly, cil.cz + cil.r * Math.cos(a)); r.nor.push(Math.sin(a), 0, Math.cos(a))
      } else {
        r.pos.push(x + lx * Math.cos(giro) - ly * Math.sin(giro), y + lx * Math.sin(giro) + ly * Math.cos(giro), z); r.nor.push(0, 0, 1)
      }
      r.uv.push(q.u0 + (q.u1 - q.u0) * u, q.v0 + (q.v1 - q.v0) * v)
    }
    for (let i = 0; i < cols; i++) { const a = b + i, c = b + cols + 1 + i; r.idx.push(a, a + 1, c, c, a + 1, c + 1) }
  }
  const geometria = (r) => {
    const g = new T.BufferGeometry()
    g.setAttribute('position', new T.Float32BufferAttribute(r.pos, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(r.nor, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(r.uv, 2))
    g.setIndex(r.idx)
    return g
  }
  // (un millimetro sopra il muro, e il polygonOffset: da lontano un millimetro non basta alla profondità)
  const decalco = (f, ruvido) => new T.MeshStandardMaterial({ map: f.t, color: colore(f, 0x888888), transparent: true, depthWrite: false, roughness: ruvido, metalness: 0, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 })

  // i graffiti: sull'intonaco (bagnato come lui) e sullo zoccolo di pietra; a sinistra del pluviale il pezzo e la pittura
  // del comune, fra il pluviale e la guida la tag blu, sopra la porta il pennarello rosso, a destra il divieto e la tag
  // verde, sulla pietra il gesso e le tag nere
  const ZF = Z_FACCIATA + 0.001, ZS = Z_FACCIATA + 0.0258
  const g = raccolta('graffiti')
  metti(g, 'pezzo-pzk', { x: -1.55, y: 1.12, z: ZF, w: 1.25, giro: 0.02 })
  metti(g, 'buff', { x: -3.1, y: 1.05, z: ZF, w: 0.7 })
  metti(g, 'gesso', { x: -2.45, y: 0.27, z: ZS, w: 0.3 })
  metti(g, 'tag-mnt', { x: -1.05, y: 0.27, z: ZS, w: 0.42, giro: -0.03 })
  metti(g, 'tag-2026', { x: -0.27, y: 1.5, z: ZF, w: 0.28, giro: 0.04 })
  metti(g, 'tag-pekko', { x: cx - 0.27, y: ph + 0.25, z: ZF, w: 0.3, giro: -0.05 })
  metti(g, 'divieto', { x: x1 + 0.78, y: 2.05, z: ZF, w: 0.72, giro: 0.01 })
  metti(g, 'tag-46100', { x: x1 + 0.62, y: 0.25, z: ZS, w: 0.46, giro: 0.02 })
  metti(g, 'tag-gimbo', { x: x1 + 1.55, y: 1.2, z: ZF, w: 0.44, giro: -0.04 })
  const mGraffiti = decalco(graf, 0.88)
  bagnato(mGraffiti, 1)
  poi(graf, mGraffiti, 'map')
  const graffiti = new T.Mesh(geometria(g), mGraffiti)
  graffiti.receiveShadow = true; graffiti.renderOrder = 2; scene.add(graffiti)

  // gli adesivi: sul pluviale (curvi), sul muro vicino al citofono e fra il pluviale e la guida, sul montante della porta,
  // e quelli del vetro (fuori, un millimetro davanti allo specchio)
  const a = raccolta('adesivi'), pluviale = { cx: -0.5, cz: Z_FACCIATA + 0.07, r: 0.0458 }, zv = zp + 0.0012
  metti(a, 'hello', { y: 1.32, w: 0.08, cil: { ...pluviale, a0: 0.25 } })
  metti(a, 'unimore', { y: 1.17, w: 0.07, cil: { ...pluviale, a0: 0.3 } })
  metti(a, 'teschio', { y: 1.02, w: 0.06, cil: { ...pluviale, a0: 0.15 } })
  metti(a, 'strappato', { y: 1.47, w: 0.07, cil: { ...pluviale, a0: 0.2 } })
  metti(a, 'nutria', { x: x1 + 0.36, y: 1.62, z: ZF, w: 0.085, giro: 0.1 })
  metti(a, 'concerto', { x: x1 + 0.43, y: 1.42, z: ZF, w: 0.09, giro: 0.06 })
  metti(a, 'mn', { x: -0.27, y: 1.02, z: ZF, w: 0.1, giro: -0.08 })
  metti(a, 'pzkkonet', { x: xm, y: 1.55, z: fronteAnta + 0.0008, w: 0.055 })
  metti(a, 'occhio', { x: xm, y: 1.72, z: fronteAnta + 0.0008, w: 0.05, giro: 0.2 })
  metti(a, 'orario', { x: cx, y: 1.86, z: zv, w: 0.32 })
  metti(a, 'video', { x: cx - 0.17, y: 1.2, z: zv, w: 0.13 })
  metti(a, 'fumare', { x: cx + 0.19, y: 1.22, z: zv, w: 0.085 })
  metti(a, 'spingere', { x: cx + 0.12, y: 1.09, z: zv, w: 0.11 })
  const mAdesivi = decalco(ades, 0.5)
  const adesivi = new T.Mesh(geometria(a), mAdesivi)
  adesivi.receiveShadow = true; adesivi.renderOrder = 2; scene.add(adesivi)

  // il cartello «chiuso», dentro, appeso coi due fili a una ventosa sul vetro; la targa smaltata del 28, avvitata al muro
  // con lo spessore della lamiera dietro
  const solo = (nome, w) => { const r = raccolta('adesivi'); metti(r, nome, { y: 0, w }); return geometria(r) }
  const mChiuso = new T.MeshStandardMaterial({ map: ades.t, color: colore(ades, 0xf3f0e8), alphaTest: 0.5, roughness: 0.42, side: T.DoubleSide })
  const mCivico = new T.MeshStandardMaterial({ map: ades.t, color: colore(ades, 0x1c3f8c), alphaTest: 0.5, roughness: 0.2 })
  poi(ades, [mAdesivi, mChiuso, mCivico], 'map')
  const qc = R?.adesivi?.chiuso, hc = qc ? (0.27 * qc.h) / qc.w : 0.18, yc = 1.5
  const chiuso = new T.Mesh(solo('chiuso', 0.27), mChiuso)
  chiuso.position.set(cx, yc, zp - 0.03); chiuso.rotation.z = -0.06; scene.add(ombra(chiuso, true, true))
  {
    const mFilo = new T.MeshStandardMaterial({ color: 0xe8e4da, roughness: 0.9 }), cima = new T.Vector3(cx, yc + hc / 2 + 0.11, zp - 0.01)
    const buco = (fx) => new T.Vector3(cx + fx * 0.27 * Math.cos(-0.06), yc + hc * 0.43 + fx * 0.27 * Math.sin(-0.06), zp - 0.03)
    scene.add(new T.Mesh(T.mergeGeometries([tuboSpezzato([buco(-0.45), cima], 0.0009, 5), tuboSpezzato([buco(0.45), cima], 0.0009, 5)]), mFilo))
    const ventosa = new T.Mesh(new T.CylinderGeometry(0.014, 0.017, 0.006, 16), new T.MeshStandardMaterial({ color: 0xd8e2e6, roughness: 0.25, transparent: true, opacity: 0.55 }))
    ventosa.rotation.x = Math.PI / 2; ventosa.position.set(cima.x, cima.y, zp - 0.004); scene.add(ventosa)
  }
  const civico = new T.Mesh(solo('civico', 0.14), mCivico)
  civico.position.set(x1 + 0.16, 2.0, Z_FACCIATA + 0.007); scene.add(ombra(civico, false, true))
  const lamiera = new T.Mesh(new T.BoxGeometry(0.134, 0.138, 0.006), new T.MeshStandardMaterial({ color: 0x14244a, roughness: 0.4, metalness: 0.3 }))
  lamiera.position.set(x1 + 0.16, 2.0, Z_FACCIATA + 0.0035); scene.add(ombra(lamiera, true, true))

  // ── il citofono: la piastra d'alluminio coi rilievi veri nelle normali (i fori dell'altoparlante, la cornice, il
  // pulsante d'ottone, le viti), il lucido e il metallo dalla stessa mappa; di notte si accende la finestrella del nome
  // (h.citofono: luci.js le dà la luce, la carta che brilla coi suoi colori, il nome a penna scuro sopra) ──
  {
    const xc = x1 + 0.16, yc = 1.45, zc = Z_FACCIATA + CITOFONO.prof / 2
    const mPiastra = new T.MeshStandardMaterial({ map: cit.t, emissiveMap: cit.t, emissive: 0x000000, color: colore(cit, 0xb8bbbe), normalMap: citN.t, roughnessMap: citL.t, metalnessMap: citL.t, roughness: citL.t ? 1 : 0.4, metalness: citL.t ? 1 : 0.8 })
    const mNome = new T.MeshStandardMaterial({ map: cit.t, emissiveMap: cit.t, emissive: 0xffd9a8, emissiveIntensity: 0, color: colore(cit, 0xe8e0c8), roughness: 0.25, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 })
    poi(cit, [mPiastra, mNome], 'map', 'emissiveMap'); poi(citN, mPiastra, 'normalMap'); poi(citL, mPiastra, 'roughnessMap', 'metalnessMap')
    const piastra = new T.Mesh(new T.BoxGeometry(CITOFONO.larg, CITOFONO.alt, CITOFONO.prof), [mAlu, mAlu, mAlu, mAlu, mPiastra, mAlu])
    piastra.position.set(xc, yc, zc); scene.add(ombra(piastra))
    const n = CITOFONO.nome, nome = new T.Mesh(new T.PlaneGeometry((n.u1 - n.u0) * CITOFONO.larg, (n.v1 - n.v0) * CITOFONO.alt), mNome)
    const uv = nome.geometry.attributes.uv
    for (let i = 0; i < uv.count; i++) uv.setXY(i, n.u0 + (n.u1 - n.u0) * uv.getX(i), n.v0 + (n.v1 - n.v0) * uv.getY(i))
    nome.position.set(xc + ((n.u0 + n.u1) / 2 - 0.5) * CITOFONO.larg, yc + ((n.v0 + n.v1) / 2 - 0.5) * CITOFONO.alt, zc + CITOFONO.prof / 2 + 0.0004)
    scene.add(nome)
    h.citofono = nome
    // il pulsante d'ottone (22.10): un disco vero sopra quello disegnato, con la stessa immagine, che si abbassa di 2 mm
    // quando lo si preme (tocchi.js, che fa suonare il campanello dentro il negozio)
    const b = CITOFONO.bottone, rb = b.r * CITOFONO.larg, faccia = new T.CircleGeometry(rb, 40), uvb = faccia.attributes.uv
    for (let i = 0; i < uvb.count; i++) uvb.setXY(i, b.u + (uvb.getX(i) - 0.5) * 2 * b.r, b.v + (uvb.getY(i) - 0.5) * ((2 * rb) / CITOFONO.alt))
    const mBottone = new T.MeshStandardMaterial({ map: cit.t, color: colore(cit, 0xa8854f), normalMap: citN.t, roughnessMap: citL.t, metalnessMap: citL.t, roughness: citL.t ? 1 : 0.35, metalness: citL.t ? 1 : 0.9 })
    poi(cit, mBottone, 'map'); poi(citN, mBottone, 'normalMap'); poi(citL, mBottone, 'roughnessMap', 'metalnessMap')
    const bordo = new T.Mesh(new T.CylinderGeometry(rb, rb * 1.03, 0.004, 40, 1, true), mOttone)
    bordo.rotation.x = Math.PI / 2; bordo.position.z = -0.002
    const bottone = new T.Group()
    bottone.add(new T.Mesh(faccia, mBottone), bordo)
    const zb = zc + CITOFONO.prof / 2 + 0.0026
    bottone.position.set(xc + (b.u - 0.5) * CITOFONO.larg, yc + (b.v - 0.5) * CITOFONO.alt, zb)
    scene.add(ombra(bottone, false, true))
    h.citofonoTocchi = { bottone, zb, x: bottone.position.x, y: bottone.position.y, r: rb, piastra: { x: xc, y: yc, z: zc + CITOFONO.prof / 2, larg: CITOFONO.larg, alt: CITOFONO.alt } }
  }
  // dove si tocca la porta (tocchi.js): il vetro (meno il traverso), l'anta coi suoi profili, il maniglione
  h.portaTocchi = { vetro: { x0: A0 + MONT, x1: A1 - MONT, y0: ZOC + 0.03, y1: ph - T0 - MONT, z: zp }, traverso: [0.965, 1.035],
    anta: { x0: x0, x1: x1, y0: 0, y1: ph, z: fronteAnta }, maniglia: { x: xm, y0: 0.78, y1: 1.27, z: fronteAnta + 0.06, r: 0.0125 } }

  // ── il lucchettone: un lucchetto d'ottone da 12 cm che tiene chiusa la saracinesca. Il ferro passa nell'occhiello
  // saldato davanti alla barra in fondo e nella cambretta murata nella soglia, e il corpo, che non ci sta appeso (gli
  // occhielli sono a 5 cm da terra), è coricato sul marciapiede, inclinato di 10°: la faccia col marchio guarda in su,
  // il fondo col cilindro della chiave verso la strada ──
  {
    // (K: le misure sono quelle di un lucchetto da 9 cm, ingrandite: un lucchettone, col ferro da 18 mm)
    const K = 1.35, xl = W / 2 - (M.telefono ? 0.2 : 0.42), BW = 0.09 * K, BH = 0.075 * K, BD = 0.038 * K, RA = 0.0305 * K, RF = 0.0065 * K
    const yo = 0.047 * K, zo = 0.0245 + 0.0405 * K // dove il ferro passa negli occhielli (0,0245: il davanti della barra)
    const mCorpo = new T.MeshStandardMaterial({ map: luc.t, color: colore(luc, 0xa8854f), metalness: 0.85, roughness: 0.38 })
    const mFondo = new T.MeshStandardMaterial({ map: lucF.t, color: colore(lucF, 0xa8854f), metalness: 0.85, roughness: 0.4 })
    poi(luc, mCorpo, 'map'); poi(lucF, mFondo, 'map')
    const corpo = new T.BoxGeometry(BW, BH, BD)
    // (i fianchi e la cima prendono una striscia del bordo della faccia, senza il marchio)
    const uv = corpo.attributes.uv
    for (let f = 0; f < 3; f++) for (let k = 0; k < 4; k++) {
      const i = f * 4 + k, u = uv.getX(i), v = uv.getY(i)
      uv.setXY(i, f < 2 ? 0.03 + u * 0.16 : 0.08 + u * 0.84, f < 2 ? 0.08 + v * 0.84 : 0.84 + v * 0.13)
    }
    const lucchetto = new T.Group()
    lucchetto.add(ombra(new T.Mesh(corpo, [mCorpo, mCorpo, mCorpo, mFondo, mCorpo, mCorpo])))
    const yc0 = BH / 2 + 0.045 * K, pts = [new T.Vector3(-RA, BH / 2 - 0.008, 0), new T.Vector3(-RA, yc0, 0)]
    for (let i = 1; i < 16; i++) { const t = Math.PI - (i / 16) * Math.PI; pts.push(new T.Vector3(RA * Math.cos(t), yc0 + RA * Math.sin(t), 0)) }
    pts.push(new T.Vector3(RA, yc0, 0), new T.Vector3(RA, BH / 2 - 0.008, 0))
    const mFerro = new T.MeshStandardMaterial({ color: 0xc9cdd1, metalness: 1, roughness: 0.42 })
    lucchetto.add(ombra(new T.Mesh(tuboSpezzato(pts, RF, 12), mFerro)))
    // coricato: il ferro va verso il muro, la cima dell'arco negli occhielli
    const giro = -80 * GRADI, cima = yc0 + RA
    lucchetto.rotation.x = giro
    lucchetto.position.set(xl, yo - cima * Math.cos(giro), zo - cima * Math.sin(giro))
    scene.add(lucchetto)
    // (tocchi.js: toccato, suona l'ottone contro il ferro, e dondola un filo sul ferro che lo tiene)
    h.lucchettone = { o: lucchetto, giro }
    // l'occhiello: una piastra d'acciaio saldata davanti alla barra, di taglio, col buco; la cambretta: un tondino a U
    // murato nella soglia, accanto
    const s = new T.Shape()
    const zt = zo + 0.007 * K, rt = 0.029 * K
    s.moveTo(0.0245, yo - rt); s.lineTo(zt, yo - rt); s.absarc(zt, yo, rt, -Math.PI / 2, Math.PI / 2, false); s.lineTo(0.0245, yo + rt); s.closePath()
    const foro = new T.Path(); foro.absarc(zo, yo, 0.0095 * K, 0, Math.PI * 2, true); s.holes.push(foro)
    const piastra = new T.ExtrudeGeometry(s, { depth: 0.007 * K, bevelEnabled: false, curveSegments: 18 })
    piastra.rotateY(-Math.PI / 2); piastra.translate(xl - 0.0025 * K, 0, 0)
    const mFerroGrezzo = new T.MeshStandardMaterial({ color: 0x4d4b48, metalness: 0.6, roughness: 0.6 })
    scene.add(ombra(new T.Mesh(piastra, mFerroGrezzo)))
    const xs = xl + 0.014 * K, rc = 0.016 * K, u = [new T.Vector3(xs, -0.01, zo - rc), new T.Vector3(xs, yo, zo - rc)]
    for (let i = 1; i < 12; i++) { const t = Math.PI - (i / 12) * Math.PI; u.push(new T.Vector3(xs, yo + rc * Math.sin(t), zo + rc * Math.cos(t))) }
    u.push(new T.Vector3(xs, yo, zo + rc), new T.Vector3(xs, -0.01, zo + rc))
    const mRuggine = new T.MeshStandardMaterial({ color: 0x5b4a3c, metalness: 0.4, roughness: 0.75 })
    scene.add(ombra(new T.Mesh(tuboSpezzato(u, 0.0055 * K, 10), mRuggine)))
  }
}
