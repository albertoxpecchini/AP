// Il posto: la facciata col buco della saracinesca, la saracinesca a doghe di
// poligoni, l'insegna col cassonetto e le lettere a scatola (lettere.js), la porta a vetri che
// riflette la strada, il marciapiede bagnato, la strada, i palazzi di fronte, la
// lampada a muro, l'auto che passa. Tutto in metri; la saracinesca occupa
// x ∈ [0, W], y ∈ [0, H] sul piano z = 0 e la facciata sta 10 cm più avanti.
// Sul telefono (M.telefono) la saracinesca è stretta e alta come la parete del
// telefono (0,95 m): il piano di sopra, l'insegna e le luci si mettono rispetto a
// lei, e le luci accese insieme sono meno (ognuna costa a ogni pixel).
import * as T from './lib/three.js'
import { facciata, immagine, profilo, lamiera, intonacoVivo, DOGA, Z_FACCIATA } from './materiali.js'
import { lettere, LUCE } from './lettere.js'
import { bagnato } from './acqua.js'
import { lastre, SPECCHIO_POZZE } from './marciapiede.js'
import { negozio } from './negozio.js'
import { fronte } from './fronte.js'

export { Z_FACCIATA }
const ART = '/art/scena/'

// lo specchio: il Reflector di three con un'opacità in più, per il vetro e le pozzanghere
const SPECCHIO = {
  name: 'specchio',
  uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null }, opacita: { value: 1 } },
  vertexShader: `uniform mat4 textureMatrix; varying vec4 vUv;
    #include <common>
    #include <logdepthbuf_pars_vertex>
    void main() { vUv = textureMatrix * vec4( position, 1.0 ); gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    #include <logdepthbuf_vertex>
    }`,
  fragmentShader: `uniform vec3 color; uniform sampler2D tDiffuse; uniform float opacita; varying vec4 vUv;
    #include <logdepthbuf_pars_fragment>
    void main() {
    #include <logdepthbuf_fragment>
      vec4 base = texture2DProj( tDiffuse, vUv );
      gl_FragColor = vec4( base.rgb * color, opacita );
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    }`,
}
// (senza multisample, che costa un giro di scena in più). Ogni specchio è un giro di scena: si rifanno solo quando si
// dice (specchiModo): «fermi» finché niente si muove (il riflesso di prima è ancora giusto), «alterni» un fotogramma sì
// e uno no, alternandosi con l'altro, «tutti» a ogni fotogramma
const specchio = (geo, larg, alt, colore, opacita, turno, shader = SPECCHIO) => {
  const r = new T.Reflector(geo, { clipBias: 0.002, textureWidth: larg, textureHeight: alt, color: colore, shader, multisample: 0 })
  r.material.uniforms.opacita.value = opacita
  // (le pozze sono trasparenti dove finisce l'acqua; le uniform in comune, che il Reflector copia, tornano quelle vere)
  r.material.transparent = opacita < 1 || shader !== SPECCHIO
  for (const k in shader.uniforms) if (!['color', 'tDiffuse', 'textureMatrix', 'opacita'].includes(k)) r.material.uniforms[k] = shader.uniforms[k]
  // uno specchio non si disegna dentro un altro specchio (costerebbe un giro di scena in più); e non vede il livello 1
  // (le gocce, le gomme, i mozziconi, i volantini per terra, il chiusino: millimetri che nel riflesso non si vedrebbero e
  // costerebbero come sullo schermo): il Reflector prende i livelli dalla telecamera, glieli si toglie mentre disegna
  const prima = r.onBeforeRender
  r.onBeforeRender = (...a) => {
    if (dentroSpecchio || modo === 'fermi' || (modo === 'alterni' && (fotogramma & 1) !== turno)) return
    const livelli = a[2].layers.mask
    dentroSpecchio = true; a[2].layers.disable(1)
    try { prima.apply(r, a) } finally { dentroSpecchio = false; a[2].layers.mask = livelli }
  }
  return r
}
let dentroSpecchio = false, fotogramma = 0, modo = 'tutti'
export const prossimoFotogramma = () => { fotogramma++ }
export const specchiModo = (m) => { modo = m }

// un cilindro da a a b (un tubo)
const tubo = (a, b, r, seg = 12) => {
  const dir = b.clone().sub(a), len = dir.length()
  const g = new T.CylinderGeometry(r, r, len, seg, 1, true)
  g.translate(0, len / 2, 0)
  g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), dir.normalize()))
  g.translate(a.x, a.y, a.z)
  return g
}
const scatola = (w, h, d, mat, x, y, z) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); return m }

// poche: meno luci (ognuna si calcola per ogni pixel di ogni materiale, anche spenta): una lampada nell'insegna invece
// di quattro, i lampioni di là senza luce, l'auto con un faro solo e senza il rosso dei freni né il neon sotto
export async function costruisci(scene, M, { palazzi: conPalazzi = true, poche = false } = {}) {
  const { W, H, telefono } = M
  const h = {} // quello che la scena deve poter muovere o accendere
  const TETTO = Math.max(8, H + 4.4) // il filo alto della facciata
  const ombra = (m, getta = true, riceve = true) => { m.castShadow = getta; m.receiveShadow = riceve; return m }
  // ── i pezzi fermi si uniscono (21.10): ogni mesh è una chiamata di disegno in ogni passaggio (lo schermo, le due
  // ombre, i due specchi), e le ~70 scatole, profili e tubi della facciata erano metà delle chiamate di un fotogramma.
  // Quelli che non si muovono né cambiano materiale si uniscono in una mesh per materiale (e per ombre: chi le getta e
  // chi le riceve) e per gruppo (il cassonetto dell'insegna); fondi() le mette nella scena alla fine. Fuori restano
  // quelli che la scena accende o muove (h.*) e quelli con un materiale tutto loro (una mesh è una mesh) ──
  const fermi = new Map()
  const fisso = (m, { getta = true, riceve = true, gruppo = scene } = {}) => {
    const k = `${m.material.uuid}|${getta}|${riceve}|${gruppo.uuid}`
    let v = fermi.get(k)
    if (!v) { v = { mat: m.material, getta, riceve, gruppo, geo: [] }; fermi.set(k, v) }
    m.updateMatrix()
    v.geo.push(m.geometry.applyMatrix4(m.matrix))
    return m
  }
  const fondi = () => {
    for (const v of fermi.values()) {
      const g = v.geo.length === 1 ? v.geo[0] : T.mergeGeometries(v.geo)
      if (g) v.gruppo.add(ombra(new T.Mesh(g, v.mat), v.getta, v.riceve))
      else for (const geo of v.geo) v.gruppo.add(ombra(new T.Mesh(geo, v.mat), v.getta, v.riceve))
    }
    fermi.clear()
  }
  // la porta subito a destra della guida: il fronte del negozio va da -0,1 a x1 + 0,1 e sta al centro dello schermo (scena.css)
  const PORTA = { x0: W + 0.12, x1: W + 0.87, h: 2.32 }

  // ── materiali ──────────────────────────────────────────────────────────────
  // le trame: la lamiera (dalla foto) e l'intonaco e l'asfalto, disegnati una volta da tools/pzkko/scena/trame.mjs con le
  // funzioni di materiali.js (calcolarli qui erano due secondi di pagina ferma); tutte insieme, in parallelo. Le lastre
  // del marciapiede non hanno trama: le disegna lo shader (marciapiede.js)
  const TRAME = ART + 'trame/'
  const ripete = (src, colore = true) => immagine(src, { ripeti: true }).then((t) => { if (!colore) t.colorSpace = T.NoColorSpace; t.anisotropy = 8; return t })
  const [lam, lamR, ...tr] = await Promise.all([immagine(ART + 'lamiera.webp'), immagine(ART + 'lamiera-r.webp'),
    ripete(TRAME + 'intonaco.webp'), ripete(TRAME + 'intonaco-n.webp', false),
    ripete(TRAME + 'asfalto.webp'), ripete(TRAME + 'asfalto-n.webp', false)])
  // (lato: i metri di una trama, come in materiali.js)
  const into = { map: tr[0], normalMap: tr[1], lato: 1 }, asf = { map: tr[2], normalMap: tr[3], lato: 2 }
  lam.wrapS = T.MirroredRepeatWrapping; lam.wrapT = T.RepeatWrapping; lam.anisotropy = 16
  lamR.wrapS = T.MirroredRepeatWrapping; lamR.wrapT = T.RepeatWrapping; lamR.colorSpace = T.NoColorSpace
  const mLamiera = new T.MeshStandardMaterial({ map: lam, roughnessMap: lamR, roughness: 1, metalness: 0.22, color: 0xe8e9e6 })
  // il colore (le chiazze della pittura vecchia) si ripete ogni 4 m, il rilievo ogni metro: da lontano non si vede il
  // motivo a quadretti di una piastrella da un metro
  into.map.repeat.set(0.25, 0.25); into.normalMap.repeat.set(1, 1)
  const mIntonaco = new T.MeshStandardMaterial({ map: into.map, normalMap: into.normalMap, normalScale: new T.Vector2(0.8, 0.8), roughness: 0.92, metalness: 0, color: 0xd8d2c6 })
  const mIntonacoScuro = mIntonaco.clone(); mIntonacoScuro.color.set(0xb9b2a4)
  // la facciata vera (materiali.js): le chiazze, le crepe, le colature sotto i davanzali delle tre finestre e sotto il
  // cassonetto, la pittura scrostata, e due buchi coi mattoni: a sinistra della guida (fra la guida e il pluviale) e
  // sopra la porta. (Le misure delle finestre e del cassonetto sono quelle di sotto)
  const INSEGNA = { LARG: Math.min(1.5, 0.78 * W) }; INSEGNA.y0 = H + 0.1 * (INSEGNA.LARG / 1.5)
  // la facciata va da FX0 a FX1 (dal 21.10 più larga: da lontano, in una finestra larga, oltre la vecchia si vedeva il
  // cielo; la foto del caricamento è larga quanto la finestra più larga), e le finestre del piano di sopra
  const FX0 = -10, FX1 = W + 11, FINESTRE = [W / 2 - 3.1, W / 2 - 0.9, W / 2 + 1.1, W + 3.2, W + 5.6]
  intonacoVivo(mIntonaco, {
    davanzali: [...FINESTRE.map((fx) => [fx, H + 1.08, 0.7]), [W / 2, INSEGNA.y0, INSEGNA.LARG / 2]],
    buchi: [[-0.3, 1.0, 0.14, 0.1], [(PORTA.x0 + PORTA.x1) / 2 + 0.1, PORTA.h + 0.42, 0.17, 0.11]],
  })
  const mFerro = new T.MeshStandardMaterial({ color: 0x3b3d3f, roughness: 0.55, metalness: 0.8 })
  const mFerroVerniciato = new T.MeshStandardMaterial({ color: 0x565a58, roughness: 0.6, metalness: 0.3 })
  const mAlluminio = new T.MeshStandardMaterial({ color: 0x4a4d50, roughness: 0.42, metalness: 0.85 })
  const mPietra = new T.MeshStandardMaterial({ color: 0x8f8a80, roughness: 0.85, metalness: 0 })
  // dove scende l'acqua il muro è bagnato (acqua.js): la lamiera, l'intonaco, la pietra; le lastre più sotto
  bagnato(mLamiera, 0); bagnato(mIntonaco, 1); bagnato(mIntonacoScuro, 1); bagnato(mPietra, 4)
  const mGomma = new T.MeshStandardMaterial({ color: 0x111111, roughness: 0.95 })

  // ── la saracinesca: doghe bombate, il canale al giunto, qualche ammaccatura ──
  // La griglia (righe fitte al giunto, una colonna ogni ~17 cm) è quella di materiali.js, la stessa che seguono la carta e
  // i graffiti (fogli.js). La bombatura è concava: fra due righe la lamiera sta sotto la curva vera, e la carta sopra
  {
    const L = lamiera(W, H), { nx, ny } = L
    const pos = [], uv = [], idx = []
    for (let j = 0; j <= ny; j++) {
      const yd = L.yd(j), y = L.ys[j]
      for (let i = 0; i <= nx; i++) {
        const x = L.xs[i]
        pos.push(x, y, profilo(yd, x))
        // la foto: 2200 unità (3,52 m) in larghezza, 13 doghe (1,622 m) in altezza
        uv.push((x + 0.02) / (2200 * M.K), 1 - yd / (13 * DOGA))
      }
    }
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1
      idx.push(a, c, b, b, c, d)
    }
    const g = new T.BufferGeometry()
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3))
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2))
    g.setIndex(idx); g.computeVertexNormals()
    h.saracinesca = ombra(new T.Mesh(g, mLamiera), true, true)
    // dopo i fogli (fogli.js, renderOrder -1 quando sono opachi): dove c'è carta la lamiera non si calcola
    h.saracinesca.renderOrder = 1
    scene.add(h.saracinesca)
    // le guide ai lati, la barra in basso con la serratura e il gommino
    fisso(scatola(0.05, H + 0.3, 0.09, mFerroVerniciato, -0.045, H / 2 + 0.14, 0.03))
    fisso(scatola(0.05, H + 0.3, 0.09, mFerroVerniciato, W + 0.045, H / 2 + 0.14, 0.03))
    fisso(scatola(W + 0.04, 0.07, 0.025, mFerroVerniciato, W / 2, 0.035, 0.012))
    fisso(scatola(W + 0.04, 0.012, 0.03, mGomma, W / 2, 0.006, 0.012))
    const serr = new T.Mesh(new T.CylinderGeometry(0.022, 0.022, 0.03, 20), mAlluminio)
    serr.rotation.x = Math.PI / 2; serr.position.set(W / 2, 0.038, 0.03); fisso(serr)
    const maniglia = new T.Mesh(new T.TorusGeometry(0.035, 0.006, 8, 20), mFerro)
    maniglia.position.set(W / 2 + 0.3, 0.04, 0.035); fisso(maniglia)
  }

  // ── la facciata: intonaco col buco della saracinesca e quello della porta ────
  {
    const f = new T.Shape()
    f.moveTo(FX0, -0.3); f.lineTo(FX1, -0.3); f.lineTo(FX1, TETTO); f.lineTo(FX0, TETTO); f.closePath()
    const buco = new T.Path(); buco.moveTo(-0.07, -0.05); buco.lineTo(W + 0.07, -0.05); buco.lineTo(W + 0.07, H + 0.05); buco.lineTo(-0.07, H + 0.05); buco.closePath()
    const porta = new T.Path(); porta.moveTo(PORTA.x0, -0.05); porta.lineTo(PORTA.x1, -0.05); porta.lineTo(PORTA.x1, PORTA.h); porta.lineTo(PORTA.x0, PORTA.h); porta.closePath()
    f.holes.push(buco, porta)
    const g = new T.ShapeGeometry(f, 1)
    const m = ombra(new T.Mesh(g, mIntonaco), false, true); m.position.z = Z_FACCIATA; scene.add(m)
    // le spalle e l'architrave del buco: le facce di ritorno fra la facciata e la saracinesca
    fisso(scatola(0.02, H + 0.1, Z_FACCIATA, mIntonacoScuro, -0.08, H / 2, Z_FACCIATA / 2))
    fisso(scatola(0.02, H + 0.1, Z_FACCIATA, mIntonacoScuro, W + 0.08, H / 2, Z_FACCIATA / 2))
    fisso(scatola(W + 0.18, 0.02, Z_FACCIATA, mIntonacoScuro, W / 2, H + 0.06, Z_FACCIATA / 2))
    // lo zoccolo di pietra in basso, ai lati del buco
    fisso(scatola(-FX0 - 0.1, 0.5, 0.025, mPietra, -0.1 - (-FX0 - 0.1) / 2, 0.25, Z_FACCIATA + 0.0125))
    fisso(scatola(PORTA.x0 - W - 0.12, 0.5, 0.025, mPietra, W + 0.1 + (PORTA.x0 - W - 0.12) / 2, 0.25, Z_FACCIATA + 0.0125))
    fisso(scatola(FX1 - PORTA.x1 - 0.02, 0.5, 0.025, mPietra, PORTA.x1 + 0.02 + (FX1 - PORTA.x1 - 0.02) / 2, 0.25, Z_FACCIATA + 0.0125))
    // la gronda in cima, fuori vista quasi sempre, e il piano di sopra: due finestre con le persiane
    // (tutto rispetto alla cima della saracinesca: il piano di sopra comincia 2 m sopra)
    fisso(scatola(FX1 - FX0 + 1, 0.22, 0.5, mPietra, (FX0 + FX1) / 2, H + 4.29, Z_FACCIATA + 0.25))
    const mVetroFinestra = new T.MeshStandardMaterial({ color: 0x1a1c20, roughness: 0.3, metalness: 0.2 }), mPersiana = new T.MeshStandardMaterial({ color: 0x4f6b45, roughness: 0.7 })
    for (const fx of FINESTRE) {
      fisso(scatola(1.2, 1.7, 0.3, mVetroFinestra, fx, H + 2, Z_FACCIATA - 0.14))
      fisso(scatola(0.5, 1.75, 0.04, mPersiana, fx - 0.58, H + 2, Z_FACCIATA + 0.02))
      fisso(scatola(0.5, 1.75, 0.04, mPersiana, fx + 0.58, H + 2, Z_FACCIATA + 0.02))
      fisso(scatola(1.4, 0.06, 0.12, mPietra, fx, H + 1.11, Z_FACCIATA + 0.06))
    }
    // il pluviale a sinistra, coi collari
    const plu = new T.Mesh(new T.CylinderGeometry(0.045, 0.045, H + 4.6, 16), mFerroVerniciato)
    plu.position.set(-0.5, (H + 4.6) / 2, Z_FACCIATA + 0.07); fisso(plu)
    for (let y = 0.6; y < H + 4.2; y += 1.9) { const c = new T.Mesh(new T.TorusGeometry(0.052, 0.008, 6, 20), mFerro); c.rotation.x = Math.PI / 2; c.position.set(-0.5, y, Z_FACCIATA + 0.07); fisso(c) }
    // (il citofono e la targa del civico 28 sono in fronte.js, sotto)
  }

  // ── la porta a vetri: telaio d'alluminio, il vetro che riflette, dentro il buio ──
  {
    const { x0, x1, h: ph } = PORTA, cx = (x0 + x1) / 2, pw = x1 - x0
    fisso(scatola(0.02, ph + 0.1, Z_FACCIATA, mIntonacoScuro, x0 - 0.01, ph / 2, Z_FACCIATA / 2))
    fisso(scatola(0.02, ph + 0.1, Z_FACCIATA, mIntonacoScuro, x1 + 0.01, ph / 2, Z_FACCIATA / 2))
    fisso(scatola(pw + 0.04, 0.02, Z_FACCIATA, mIntonacoScuro, cx, ph + 0.01, Z_FACCIATA / 2))
    const zp = 0.03 // il piano del vetro
    // il telaio, l'anta, lo zoccolo, il maniglione, gli adesivi del vetro e il cartello «chiuso» appeso dentro: fronte.js
    // (le immagini di gpt-image-2), insieme al citofono, alla targa del civico, al lucchettone e ai graffiti della facciata
    await fronte(scene, M, h, { PORTA, zp })
    // il vetro: lo specchio della strada; di giorno si vede poco, di notte di più (dentro è buio)
    h.vetro = specchio(new T.PlaneGeometry(pw - 0.12, ph - 0.12), 768, 768, 0xb4bcc0, 0.4, 0)
    h.vetro.position.set(cx, ph / 2 + 0.02, zp); scene.add(h.vetro)
    // dentro: la stanza buia, il bancone, gli scaffali, il cartello «chiuso» appeso al vetro, la spia dell'allarme.
    // La stanza fa ombra con le facce davanti (shadowSide: si vede da dentro, ma per le luci è una scatola chiusa):
    // così il sole e la lampada non entrano dai muri, e dentro è buio anche di giorno, come in un negozio chiuso
    const stanza = new T.Mesh(new T.BoxGeometry(2.6, 2.8, 3.4), new T.MeshStandardMaterial({ color: 0x1c1816, roughness: 1, side: T.BackSide, shadowSide: T.FrontSide }))
    stanza.position.set(cx + 0.4, 1.4, zp - 1.7 - 0.01); stanza.castShadow = true; stanza.receiveShadow = true; scene.add(stanza)
    const mLegno = new T.MeshStandardMaterial({ color: 0x4b3a2a, roughness: 0.6 })
    fisso(scatola(1.2, 0.9, 0.5, mLegno, cx + 0.6, 0.45, zp - 2.4), { getta: false })
    for (const y of [1.3, 1.8, 2.3]) fisso(scatola(1.6, 0.03, 0.3, mLegno, cx + 0.4, y, zp - 3.2), { getta: false })
    // sul bancone il PC con Ubuntu che si pianta e si riavvia in loop (negozio.js: l'easter egg)
    // (un po' a destra del centro del bancone: dalla telecamera, che sta a sinistra, resta scoperto dal cartello «chiuso»)
    h.negozio = negozio(scene, { bancone: { x: cx + 0.72, y: 0.9, z: zp - 2.4 }, porta: { x0, x1 } })
    h.spia = new T.Mesh(new T.SphereGeometry(0.008, 10, 8), new T.MeshStandardMaterial({ color: 0x220000, emissive: 0xff2010, emissiveIntensity: 0 }))
    h.spia.position.set(x0 + 0.14, ph - 0.14, zp - 0.04); scene.add(h.spia)
  }

  // ── l'insegna: il cassonetto, il pannello, le lettere a scatola davanti ──────────
  {
    // il cassonetto è più stretto della saracinesca (1,5 m su 2,05) e centrato su di lei, appena sopra l'architrave; le
    // lettere al centro, la x alta 12,5 cm. Sul telefono la saracinesca è larga 0,95 m e l'insegna scala con lei (k)
    const LARG = Math.min(1.5, 0.78 * W), k = LARG / 1.5, kk = Math.max(0.75, k)
    const ALT = 0.42 * k, PROF = 0.06 + 0.08 * k, sp = 0.03 * Math.max(0.6, k), x0 = W / 2 - LARG / 2
    const y0 = H + 0.1 * k, z0 = Z_FACCIATA, cxl = W / 2, cyl = y0 + ALT / 2
    const cass = new T.Group()
    // il telaio: quattro profili, il fondo e la faccia dietro il pannello
    for (const [w, hh, x, y] of [[LARG, sp, 0, ALT / 2 - sp / 2], [LARG, sp, 0, -ALT / 2 + sp / 2], [sp, ALT, -LARG / 2 + sp / 2, 0], [sp, ALT, LARG / 2 - sp / 2, 0]]) fisso(scatola(w, hh, PROF, mAlluminio, x, y, PROF / 2), { gruppo: cass })
    fisso(scatola(LARG - 2 * sp, ALT - 2 * sp, 0.02, mAlluminio, 0, 0, 0.01), { gruppo: cass })
    fisso(scatola(LARG - 2 * sp, 0.02, PROF, mAlluminio, 0, ALT / 2 - sp - 0.01, PROF / 2), { gruppo: cass })
    fisso(scatola(LARG - 2 * sp, 0.02, PROF, mAlluminio, 0, -ALT / 2 + sp + 0.01, PROF / 2), { gruppo: cass })
    const pannelloT = await immagine(ART + 'pannello.svg').catch(() => null)
    // il pannello disegnato è lungo (2400 × 328): se ne usa la parte destra
    if (pannelloT) { pannelloT.repeat.set(0.56, 1); pannelloT.offset.set(0.44, 0) }
    const pw = LARG - 2 * sp, ph = ALT - 2 * sp, zp = z0 + PROF - 0.012
    // «pzkko» davanti al pannello (lettere.js): le lettere della «coin» vera, col neon dentro
    h.lettere = lettere(scene, { cx: cxl, cy: cyl, zp, k, pw, ph })
    // (l'ombra delle lettere nella luce del cielo è la sua aoMap)
    h.pannello = new T.MeshPhysicalMaterial({ map: pannelloT, color: 0xffffff, roughness: 0.38, clearcoat: 0.25, clearcoatRoughness: 0.4, aoMap: h.lettere.aoT })
    const pann = ombra(new T.Mesh(new T.PlaneGeometry(pw, ph), h.pannello), false, true)
    pann.position.z = PROF - 0.012; cass.add(pann)
    cass.position.set(x0 + LARG / 2, y0 + ALT / 2, z0); scene.add(cass)
    // il trasformatore del neon sul muro, sopra il cassonetto a destra, col cavo che ci entra
    fisso(scatola(0.17 * kk, 0.1 * kk, 0.075 * kk, mFerroVerniciato, x0 + LARG - 0.16 * kk, y0 + ALT + 0.07 * kk, z0 + 0.0375 * kk))
    fisso(new T.Mesh(tubo(new T.Vector3(x0 + LARG - 0.2 * kk, y0 + ALT + 0.02 * kk, z0 + 0.03 * kk), new T.Vector3(x0 + LARG - 0.2 * kk, y0 + ALT - 0.005, z0 + 0.03 * kk), 0.005 * kk, 8), mGomma))
    // la luce che i neon accesi mandano sul muro e sulla saracinesca: tre lampade bianco caldo davanti a «pzkko»; sul
    // telefono e con poche luci una sola, che fa la luce di tre. L'intensità di ognuna la usa luci.js
    const { testo, largTesto } = h.lettere.centri
    const posti = telefono || poche ? [testo.x] : [-0.3, 0, 0.3].map((f) => testo.x + f * largTesto)
    h.luciInsegna = posti.map((x) => { const l = new T.PointLight(LUCE, 0, 4, 2); l.position.set(x, cyl - 0.05 * k, z0 + PROF + 0.45 * kk); scene.add(l); return l })
    h.luceInsegna = 0.035 * (3 / posti.length) * k * k
    // le colature della pioggia sul muro, sotto il cassonetto
    const col = await immagine(ART + 'colature.svg').catch(() => null)
    if (col) { const m = new T.Mesh(new T.PlaneGeometry(LARG + 0.02, 0.1 * k), new T.MeshStandardMaterial({ map: col, transparent: true, roughness: 0.95, depthWrite: false })); m.position.set(cxl, y0 - 0.05 * k, Z_FACCIATA + 0.002); scene.add(m) }
    h.insegna = { x0, y0, LARG, ALT, top: y0 + ALT, zPannello: zp }
  }

  // ── la lampada a muro: il braccio, il corpo, la lampadina, il fascio ─────────
  {
    // sopra l'insegna, con un braccio lungo un metro: il fascio scende sulla saracinesca senza battere sul cassonetto
    const x = (PORTA.x0 + PORTA.x1) / 2, y = H + 0.75, SB = 1.0
    fisso(new T.Mesh(tubo(new T.Vector3(x, y, Z_FACCIATA), new T.Vector3(x, y, Z_FACCIATA + SB), 0.016), mFerro))
    fisso(new T.Mesh(tubo(new T.Vector3(x, y + 0.45, Z_FACCIATA), new T.Vector3(x, y + 0.02, Z_FACCIATA + SB - 0.05), 0.008), mFerro))
    fisso(scatola(0.12, 0.5, 0.03, mFerro, x, y + 0.2, Z_FACCIATA + 0.015))
    const corpo = new T.Mesh(new T.CylinderGeometry(0.16, 0.08, 0.22, 20, 1, true), new T.MeshStandardMaterial({ color: 0x2a2c2e, roughness: 0.5, metalness: 0.7, side: T.DoubleSide }))
    corpo.position.set(x, y - 0.1, Z_FACCIATA + SB); scene.add(ombra(corpo, true, false))
    h.lampadina = new T.Mesh(new T.SphereGeometry(0.035, 16, 12), new T.MeshStandardMaterial({ color: 0x222222, emissive: 0xffe4c0, emissiveIntensity: 0 }))
    h.lampadina.position.set(x, y - 0.2, Z_FACCIATA + SB); scene.add(h.lampadina)
    const spot = new T.SpotLight(0xffe4c0, 0, 16, 0.75, 0.5, 2)
    spot.position.set(x, y - 0.22, Z_FACCIATA + SB)
    // (sul telefono la saracinesca è alta 9 m: la lampada illumina la parte di sopra, il resto lo fa il lampione di fronte)
    spot.target.position.set(W / 2 + (telefono ? 0 : 0.3), telefono ? H - 2.2 : 1.0, 0.3); scene.add(spot.target)
    spot.castShadow = true; spot.shadow.mapSize.set(telefono ? 512 : 1024, telefono ? 512 : 1024); spot.shadow.bias = -0.0005; spot.shadow.normalBias = 0.02; spot.shadow.camera.near = 0.3; spot.shadow.camera.far = 16
    scene.add(spot); h.lampada = spot
  }
  // sul telefono, di notte: la luce di un lampione dall'altra parte della strada, fuori vista, che prende tutta la
  // saracinesca alta (senza ombre, costa poco)
  if (telefono) {
    const lp = new T.SpotLight(0xffd9a8, 0, 0, 0.62, 0.7, 2)
    lp.position.set(W / 2 + 1.5, H * 0.55, 9); lp.target.position.set(W / 2, H * 0.45, 0)
    scene.add(lp, lp.target); h.lampione = lp
  }
  // il fronte del negozio (saracinesca e porta), per l'inquadratura da lontano
  h.fronte = { x0: -0.1, x1: PORTA.x1 + 0.1 }

  // ── il marciapiede bagnato, il cordolo, la strada, il marciapiede di là ──────
  {
    const X0 = FX0, X1 = FX1, Z0 = Z_FACCIATA, Z1 = 2.3
    const g = new T.PlaneGeometry(X1 - X0, Z1 - Z0)
    // le lastre di granito: colore, grana, fughe e bagnato li disegna lo shader, in coordinate del mondo (marciapiede.js)
    const suolo = ombra(new T.Mesh(g, lastre(new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.62, metalness: 0 }))), false, true)
    suolo.rotation.x = -Math.PI / 2; suolo.position.set((X0 + X1) / 2, 0.0015, (Z0 + Z1) / 2); scene.add(suolo)
    // le pozzanghere: lo specchio della strada appena sopra le lastre, disegnato solo dove c'è acqua
    h.pozze = specchio(g.clone(), 512, 256, 0xd8d8d8, 1, 1, SPECCHIO_POZZE)
    h.pozze.rotation.x = -Math.PI / 2; h.pozze.position.set((X0 + X1) / 2, 0.0025, (Z0 + Z1) / 2); scene.add(h.pozze)
    // la soglia di pietra sotto la saracinesca, il cordolo, la strada, il marciapiede di fronte
    fisso(scatola(W + 0.2, 0.03, 0.3, mPietra, W / 2, -0.015, -0.05), { getta: false })
    fisso(scatola(X1 - X0, 0.15, 0.2, mPietra, (X0 + X1) / 2, -0.06, Z1 + 0.1))
    const strada = { x0: -30, x1: W + 30, z0: Z1 + 0.2, z1: 16 }
    for (const t of [asf.map, asf.normalMap]) t.repeat.set((strada.x1 - strada.x0) / asf.lato, (strada.z1 - strada.z0) / asf.lato)
    const road = ombra(new T.Mesh(new T.PlaneGeometry(strada.x1 - strada.x0, strada.z1 - strada.z0), new T.MeshStandardMaterial({ map: asf.map, normalMap: asf.normalMap, roughness: 0.55, metalness: 0.05 })), false, true)
    road.rotation.x = -Math.PI / 2; road.position.set((strada.x0 + strada.x1) / 2, -0.13, (strada.z0 + strada.z1) / 2); scene.add(road)
    fisso(scatola(strada.x1 - strada.x0, 0.15, 1.8, mPietra, (strada.x0 + strada.x1) / 2, -0.06, strada.z1 + 0.9))
    h.strada = strada
  }

  // ── i palazzi di fronte, i lampioni della strada ─────────────────────────────
  h.facciate = []
  if (conPalazzi) {
    const Z = 16.9
    let x = -22
    const palazzi = [[11, 8.6, '#c9a76b', 3], [8, 7.4, '#b8807a', 2], [13, 9.6, '#cfc6b4', 3], [9, 8.2, '#a8977a', 3], [12, 9.2, '#d2b58e', 3]]
    palazzi.forEach(([larg, alt, colore, piani], i) => {
      const f = facciata(larg, alt, colore, 101 + i * 13, piani)
      const mF = new T.MeshStandardMaterial({ map: f.map, emissiveMap: f.emissiveMap, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.9 })
      const mL = new T.MeshStandardMaterial({ color: colore, roughness: 0.9 })
      const b = new T.Mesh(new T.BoxGeometry(larg, alt, 10), [mL, mL, mL, mL, mF, mL])
      b.position.set(x + larg / 2, alt / 2 - 0.13, Z + 5); ombra(b, true, true); scene.add(b)
      h.facciate.push({ ...f, mat: mF })
      x += larg + 0.02
    })
    h.lampioni = [W / 2 + 6, W / 2 - 9].map((lx) => {
      const palo = new T.Mesh(new T.CylinderGeometry(0.05, 0.08, 7.5, 12), mFerro); palo.position.set(lx, 3.6, Z - 0.6); fisso(palo)
      const testa = new T.Mesh(new T.BoxGeometry(0.55, 0.18, 0.3), mFerro); testa.position.set(lx, 7.4, Z - 0.9); fisso(testa)
      const bulbo = new T.Mesh(new T.PlaneGeometry(0.45, 0.22), new T.MeshStandardMaterial({ color: 0x333333, emissive: 0xffd090, emissiveIntensity: 0 }))
      bulbo.rotation.x = -Math.PI / 2; bulbo.position.set(lx, 7.3, Z - 0.9); scene.add(bulbo)
      // (sul telefono e con poche luci solo la lampadina accesa, senza la luce: è lontana, e una luce in meno conta)
      const luce = telefono || poche ? null : new T.PointLight(0xffd090, 0, 40, 2)
      if (luce) { luce.position.set(lx, 7.1, Z - 0.9); scene.add(luce) }
      return { luce, bulbo }
    })
  } else h.lampioni = []

  // ── l'auto che passa: una berlina qualunque, con i fari, i fanali e il neon sotto ──
  {
    const auto = new T.Group()
    h.autoVernice = new T.MeshPhysicalMaterial({ color: 0x8a1c1c, roughness: 0.35, metalness: 0.6, clearcoat: 1, clearcoatRoughness: 0.08 })
    const mVetro = new T.MeshPhysicalMaterial({ color: 0x0b0f14, roughness: 0.1, metalness: 0.2, clearcoat: 1 })
    auto.add(ombra(scatola(4.4, 0.6, 1.82, h.autoVernice, 0, 0.62, 0)))
    auto.add(ombra(scatola(2.3, 0.55, 1.6, mVetro, -0.25, 1.18, 0)))
    auto.add(ombra(scatola(2.1, 0.08, 1.55, h.autoVernice, -0.25, 1.48, 0)))
    for (const [x, z] of [[1.4, 0.8], [1.4, -0.8], [-1.4, 0.8], [-1.4, -0.8]]) {
      const r = new T.Mesh(new T.CylinderGeometry(0.33, 0.33, 0.22, 18), mGomma); r.rotation.x = Math.PI / 2; r.position.set(x, 0.33, z); auto.add(ombra(r))
      const c = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 0.23, 12), mAlluminio); c.rotation.x = Math.PI / 2; c.position.set(x, 0.33, z); auto.add(c)
    }
    h.autoFari = new T.MeshStandardMaterial({ color: 0x333333, emissive: 0xffe2aa, emissiveIntensity: 0 })
    h.autoFanali = new T.MeshStandardMaterial({ color: 0x3a0a0a, emissive: 0xff2418, emissiveIntensity: 0 })
    for (const z of [0.6, -0.6]) { auto.add(scatola(0.05, 0.16, 0.4, h.autoFari, 2.2, 0.7, z)); auto.add(scatola(0.05, 0.14, 0.4, h.autoFanali, -2.2, 0.72, z)) }
    // i fari guardano avanti e un po' verso il muro (la strada è stretta): così passando lo spazzano; con poche luci un
    // faro solo, al centro, che fa la luce di due
    h.autoLuci = (poche ? [0] : [0.6, -0.6]).map((z) => {
      const s = new T.SpotLight(0xffe2aa, 0, 30, 0.87, 0.55, 2)
      s.position.set(2.2, 0.7, z); s.target.position.set(8.4, 0.1, z - 10); auto.add(s); auto.add(s.target)
      return s
    })
    h.luceFari = 110 * (2 / h.autoLuci.length)
    h.autoFreno = poche ? null : new T.PointLight(0xff2418, 0, 6, 2)
    if (h.autoFreno) { h.autoFreno.position.set(-2.4, 0.7, 0); auto.add(h.autoFreno) }
    h.autoNeon = telefono || poche ? null : new T.PointLight(0x28dcff, 0, 5, 2)
    if (h.autoNeon) { h.autoNeon.position.set(0, 0.25, 0); auto.add(h.autoNeon) }
    // l'auto resta sempre nella scena, con le luci a zero quando non passa: si nasconde solo la carrozzeria (le luci
    // visibili decidono i programmi di tutti i materiali: luci.js le accende e spegne a insiemi, compilati a parte)
    h.autoCorpo = auto.children.filter((o) => o.isMesh)
    for (const o of h.autoCorpo) o.visible = false
    scene.add(auto); h.auto = auto
  }

  // i pezzi fermi, uniti (sopra)
  fondi()
  // le luci della notte, quelle che di giorno non ci sono (luci.js le accende a insiemi: giorno, sera, notte)
  h.luciNotte =[...h.luciInsegna, h.lampada, h.lampione, ...h.lampioni.map((l) => l.luce), ...h.autoLuci, h.autoFreno, h.autoNeon].filter(Boolean)

  return h
}
