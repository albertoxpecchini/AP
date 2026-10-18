// Il posto: la facciata col buco della saracinesca, la saracinesca a doghe di
// poligoni, l'insegna col cassonetto e le lettere tubolari, la porta a vetri che
// riflette la strada, il marciapiede bagnato, la strada, i palazzi di fronte, la
// lampada a muro, l'auto che passa. Tutto in metri; la saracinesca occupa
// x ∈ [0, W], y ∈ [0, H] sul piano z = 0 e la facciata sta 10 cm più avanti.
import * as T from './lib/three.js'
import { intonaco, lastre, asfalto, facciata, immagine, scritta, profilo, DOGA } from './materiali.js'

export const Z_FACCIATA = 0.10
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
// (senza multisample, che costa un giro di scena in più; e ogni specchio si rifà un fotogramma sì e uno no, alternandosi con l'altro)
const specchio = (geo, larg, alt, colore, opacita, turno) => {
  const r = new T.Reflector(geo, { clipBias: 0.002, textureWidth: larg, textureHeight: alt, color: colore, shader: SPECCHIO, multisample: 0 })
  r.material.uniforms.opacita.value = opacita
  r.material.transparent = opacita < 1
  // uno specchio non si disegna dentro un altro specchio (costerebbe un giro di scena in più)
  const prima = r.onBeforeRender
  r.onBeforeRender = (...a) => { if (dentroSpecchio || (fotogramma & 1) !== turno) return; dentroSpecchio = true; try { prima.apply(r, a) } finally { dentroSpecchio = false } }
  return r
}
let dentroSpecchio = false, fotogramma = 0
export const prossimoFotogramma = () => { fotogramma++ }

// un cilindro da a a b (un tubo), con le sfere ai capi se si chiede
const tubo = (a, b, r, seg = 12) => {
  const dir = b.clone().sub(a), len = dir.length()
  const g = new T.CylinderGeometry(r, r, len, seg, 1, true)
  g.translate(0, len / 2, 0)
  g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), dir.normalize()))
  g.translate(a.x, a.y, a.z)
  return g
}
const scatola = (w, h, d, mat, x, y, z) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); return m }

// le lettere dell'insegna: la stessa traccia di art/insegna.svg (un tratto unico arrotondato)
const TRATTO = 'M23 325V128M23 190a62 62 0 1 0 124 0a62 62 0 1 0-124 0M217 128H335L217 252H335M405 50V252M510 128L405 215M448 180L515 252M561 50V252M666 128L561 215M604 180L671 252M737 190a62 62 0 1 0 124 0a62 62 0 1 0-124 0'
const lettere = (x0, ytop, s, raggio, z) => {
  // x0, ytop: dove sta l'angolo in alto a sinistra del cassonetto (svg 30,20); s: metri per unità svg
  const dati = new T.SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${TRATTO}"/></svg>`)
  const pezzi = []
  for (const sub of dati.paths[0].subPaths) {
    const punti = sub.getPoints(10).map((p) => new T.Vector3(x0 + (220 + 0.724 * p.x - 30) * s, ytop - (64.3 + 0.724 * p.y - 20) * s, z))
    for (let i = 1; i < punti.length; i++) if (punti[i].distanceTo(punti[i - 1]) > 1e-5) pezzi.push(tubo(punti[i - 1], punti[i], raggio))
    for (const p of punti) { const g = new T.SphereGeometry(raggio, 12, 10); g.translate(p.x, p.y, p.z); pezzi.push(g) }
  }
  return T.mergeGeometries(pezzi)
}

export async function costruisci(scene, M, { palazzi: conPalazzi = true } = {}) {
  const { W, H } = M
  const h = {} // quello che la scena deve poter muovere o accendere
  const ombra = (m, getta = true, riceve = true) => { m.castShadow = getta; m.receiveShadow = riceve; return m }

  // ── materiali ──────────────────────────────────────────────────────────────
  const [lam, lamR] = await Promise.all([immagine(ART + 'lamiera.webp'), immagine(ART + 'lamiera-r.webp')])
  lam.wrapS = T.MirroredRepeatWrapping; lam.wrapT = T.RepeatWrapping; lam.anisotropy = 16
  lamR.wrapS = T.MirroredRepeatWrapping; lamR.wrapT = T.RepeatWrapping; lamR.colorSpace = T.NoColorSpace
  const mLamiera = new T.MeshStandardMaterial({ map: lam, roughnessMap: lamR, roughness: 1, metalness: 0.22, color: 0xe8e9e6 })
  const into = intonaco(512, 7)
  into.map.repeat.set(1, 1); into.normalMap.repeat.set(1, 1)
  const mIntonaco = new T.MeshStandardMaterial({ map: into.map, normalMap: into.normalMap, normalScale: new T.Vector2(0.8, 0.8), roughness: 0.92, metalness: 0, color: 0xd8d2c6 })
  const mIntonacoScuro = mIntonaco.clone(); mIntonacoScuro.color.set(0xb9b2a4)
  const mFerro = new T.MeshStandardMaterial({ color: 0x3b3d3f, roughness: 0.55, metalness: 0.8 })
  const mFerroVerniciato = new T.MeshStandardMaterial({ color: 0x565a58, roughness: 0.6, metalness: 0.3 })
  const mAlluminio = new T.MeshStandardMaterial({ color: 0x4a4d50, roughness: 0.42, metalness: 0.85 })
  const mPietra = new T.MeshStandardMaterial({ color: 0x8f8a80, roughness: 0.85, metalness: 0 })
  const mGomma = new T.MeshStandardMaterial({ color: 0x111111, roughness: 0.95 })

  // ── la saracinesca: doghe bombate, il canale al giunto, qualche ammaccatura ──
  {
    const x0 = -0.02, x1 = W + 0.02, y0 = -0.02, y1 = H + 0.3
    const nx = 40, doghe = Math.ceil((y1 - y0) / DOGA), perDoga = 14, ny = doghe * perDoga
    const pos = [], uv = [], idx = []
    for (let j = 0; j <= ny; j++) {
      const yd = (j / perDoga) * DOGA // distanza dalla cima (y1 è un giunto)
      const y = y1 - yd
      for (let i = 0; i <= nx; i++) {
        const x = x0 + ((x1 - x0) * i) / nx
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
    scene.add(h.saracinesca)
    // le guide ai lati, la barra in basso con la serratura e il gommino
    scene.add(ombra(scatola(0.05, H + 0.3, 0.09, mFerroVerniciato, -0.045, H / 2 + 0.14, 0.03)))
    scene.add(ombra(scatola(0.05, H + 0.3, 0.09, mFerroVerniciato, W + 0.045, H / 2 + 0.14, 0.03)))
    scene.add(ombra(scatola(W + 0.04, 0.07, 0.025, mFerroVerniciato, W / 2, 0.035, 0.012)))
    scene.add(ombra(scatola(W + 0.04, 0.012, 0.03, mGomma, W / 2, 0.006, 0.012)))
    const serr = new T.Mesh(new T.CylinderGeometry(0.022, 0.022, 0.03, 20), mAlluminio)
    serr.rotation.x = Math.PI / 2; serr.position.set(W / 2, 0.038, 0.03); scene.add(ombra(serr))
    const maniglia = new T.Mesh(new T.TorusGeometry(0.035, 0.006, 8, 20), mFerro)
    maniglia.position.set(W / 2 + 0.3, 0.04, 0.035); scene.add(ombra(maniglia))
  }

  // ── la facciata: intonaco col buco della saracinesca e quello della porta ────
  const PORTA = { x0: W + 0.16, x1: W + 1.04, h: 2.32 }
  {
    const f = new T.Shape()
    f.moveTo(-5, -0.3); f.lineTo(W + 7, -0.3); f.lineTo(W + 7, 8); f.lineTo(-5, 8); f.closePath()
    const buco = new T.Path(); buco.moveTo(-0.07, -0.05); buco.lineTo(W + 0.07, -0.05); buco.lineTo(W + 0.07, H + 0.05); buco.lineTo(-0.07, H + 0.05); buco.closePath()
    const porta = new T.Path(); porta.moveTo(PORTA.x0, -0.05); porta.lineTo(PORTA.x1, -0.05); porta.lineTo(PORTA.x1, PORTA.h); porta.lineTo(PORTA.x0, PORTA.h); porta.closePath()
    f.holes.push(buco, porta)
    const g = new T.ShapeGeometry(f, 1)
    const m = ombra(new T.Mesh(g, mIntonaco), false, true); m.position.z = Z_FACCIATA; scene.add(m)
    // le spalle e l'architrave del buco: le facce di ritorno fra la facciata e la saracinesca
    scene.add(ombra(scatola(0.02, H + 0.1, Z_FACCIATA, mIntonacoScuro, -0.08, H / 2, Z_FACCIATA / 2)))
    scene.add(ombra(scatola(0.02, H + 0.1, Z_FACCIATA, mIntonacoScuro, W + 0.08, H / 2, Z_FACCIATA / 2)))
    scene.add(ombra(scatola(W + 0.18, 0.02, Z_FACCIATA, mIntonacoScuro, W / 2, H + 0.06, Z_FACCIATA / 2)))
    // lo zoccolo di pietra in basso, ai lati del buco
    scene.add(ombra(scatola(5 - 0.1, 0.5, 0.025, mPietra, -0.1 - (5 - 0.1) / 2, 0.25, Z_FACCIATA + 0.0125)))
    scene.add(ombra(scatola(PORTA.x0 - W - 0.12, 0.5, 0.025, mPietra, W + 0.1 + (PORTA.x0 - W - 0.12) / 2, 0.25, Z_FACCIATA + 0.0125)))
    scene.add(ombra(scatola(W + 7 - PORTA.x1 - 0.02, 0.5, 0.025, mPietra, PORTA.x1 + 0.02 + (W + 7 - PORTA.x1 - 0.02) / 2, 0.25, Z_FACCIATA + 0.0125)))
    // la gronda in cima, fuori vista quasi sempre, e il piano di sopra: due finestre con le persiane
    scene.add(ombra(scatola(W + 12, 0.22, 0.5, mPietra, W / 2 + 1, 7.9, Z_FACCIATA + 0.25)))
    for (const fx of [W / 2 - 0.9, W / 2 + 1.1, W + 3.2]) {
      scene.add(ombra(scatola(1.2, 1.7, 0.3, new T.MeshStandardMaterial({ color: 0x1a1c20, roughness: 0.3, metalness: 0.2 }), fx, 5.6, Z_FACCIATA - 0.14)))
      scene.add(ombra(scatola(0.5, 1.75, 0.04, new T.MeshStandardMaterial({ color: 0x4f6b45, roughness: 0.7 }), fx - 0.58, 5.6, Z_FACCIATA + 0.02)))
      scene.add(ombra(scatola(0.5, 1.75, 0.04, new T.MeshStandardMaterial({ color: 0x4f6b45, roughness: 0.7 }), fx + 0.58, 5.6, Z_FACCIATA + 0.02)))
      scene.add(ombra(scatola(1.4, 0.06, 0.12, mPietra, fx, 4.72, Z_FACCIATA + 0.06)))
    }
    // il pluviale a sinistra, coi collari
    const plu = new T.Mesh(new T.CylinderGeometry(0.045, 0.045, 8.2, 16), mFerroVerniciato)
    plu.position.set(-0.5, 4.1, Z_FACCIATA + 0.07); scene.add(ombra(plu))
    for (const y of [0.6, 2.4, 4.4, 6.4]) { const c = new T.Mesh(new T.TorusGeometry(0.052, 0.008, 6, 20), mFerro); c.rotation.x = Math.PI / 2; c.position.set(-0.5, y, Z_FACCIATA + 0.07); scene.add(ombra(c)) }
    // il citofono e la targa del numero civico
    scene.add(ombra(scatola(0.12, 0.2, 0.02, mAlluminio, PORTA.x1 + 0.16, 1.5, Z_FACCIATA + 0.01)))
    h.citofono = new T.Mesh(new T.CircleGeometry(0.012, 16), new T.MeshStandardMaterial({ color: 0x222222, emissive: 0xffa040, emissiveIntensity: 0 }))
    h.citofono.position.set(PORTA.x1 + 0.16, 1.46, Z_FACCIATA + 0.021); scene.add(h.citofono)
    const targa = new T.Mesh(new T.PlaneGeometry(0.16, 0.16), new T.MeshStandardMaterial({ map: scritta(['12'], { larg: 256, alt: 256, font: '400 150px "Anton", sans-serif', colore: '#fff', sfondo: '#1c3f8c' }), roughness: 0.25 }))
    targa.position.set(PORTA.x1 + 0.16, 2.0, Z_FACCIATA + 0.006); scene.add(targa)
  }

  // ── la porta a vetri: telaio d'alluminio, il vetro che riflette, dentro il buio ──
  {
    const { x0, x1, h: ph } = PORTA, cx = (x0 + x1) / 2, pw = x1 - x0
    scene.add(ombra(scatola(0.02, ph + 0.1, Z_FACCIATA, mIntonacoScuro, x0 - 0.01, ph / 2, Z_FACCIATA / 2)))
    scene.add(ombra(scatola(0.02, ph + 0.1, Z_FACCIATA, mIntonacoScuro, x1 + 0.01, ph / 2, Z_FACCIATA / 2)))
    scene.add(ombra(scatola(pw + 0.04, 0.02, Z_FACCIATA, mIntonacoScuro, cx, ph + 0.01, Z_FACCIATA / 2)))
    const zp = 0.03 // il piano del vetro
    for (const [w, hh, x, y] of [[0.06, ph, x0 + 0.03, ph / 2], [0.06, ph, x1 - 0.03, ph / 2], [pw, 0.06, cx, ph - 0.03], [pw, 0.12, cx, 0.06], [pw, 0.05, cx, 0.95]]) scene.add(ombra(scatola(w, hh, 0.05, mAlluminio, x, y, zp)))
    const maniglia = new T.Mesh(tubo(new T.Vector3(x1 - 0.12, 0.85, zp + 0.05), new T.Vector3(x1 - 0.12, 1.15, zp + 0.05), 0.012), mAlluminio)
    scene.add(ombra(maniglia))
    // il vetro: lo specchio della strada; di giorno si vede poco, di notte di più (dentro è buio)
    h.vetro = specchio(new T.PlaneGeometry(pw - 0.12, ph - 0.12), 768, 768, 0xb4bcc0, 0.4, 0)
    h.vetro.position.set(cx, ph / 2 + 0.02, zp); scene.add(h.vetro)
    // dentro: la stanza buia, il bancone, gli scaffali, il cartello «chiuso» appeso al vetro, la spia dell'allarme
    const stanza = new T.Mesh(new T.BoxGeometry(2.6, 2.8, 3.4), new T.MeshStandardMaterial({ color: 0x1c1816, roughness: 1, side: T.BackSide }))
    stanza.position.set(cx + 0.4, 1.4, zp - 1.7 - 0.01); scene.add(stanza)
    const mLegno = new T.MeshStandardMaterial({ color: 0x4b3a2a, roughness: 0.6 })
    scene.add(scatola(1.2, 0.9, 0.5, mLegno, cx + 0.6, 0.45, zp - 2.4))
    for (const y of [1.3, 1.8, 2.3]) scene.add(scatola(1.6, 0.03, 0.3, mLegno, cx + 0.4, y, zp - 3.2))
    const chiuso = new T.Mesh(new T.PlaneGeometry(0.3, 0.2), new T.MeshStandardMaterial({ map: scritta(['chiuso'], { larg: 384, alt: 256, font: '400 120px "Permanent Marker", cursive', colore: '#a50d25', sfondo: '#f3f0e8' }), roughness: 0.8 }))
    chiuso.position.set(cx, 1.55, zp - 0.03); chiuso.rotation.z = -0.06; scene.add(chiuso)
    scene.add(new T.Mesh(tubo(new T.Vector3(cx, 1.65, zp - 0.03), new T.Vector3(cx, ph - 0.06, zp - 0.03), 0.0015), new T.MeshStandardMaterial({ color: 0xdddddd })))
    h.spia = new T.Mesh(new T.SphereGeometry(0.008, 10, 8), new T.MeshStandardMaterial({ color: 0x220000, emissive: 0xff2010, emissiveIntensity: 0 }))
    h.spia.position.set(x0 + 0.14, ph - 0.14, zp - 0.04); scene.add(h.spia)
  }

  // ── l'insegna: il cassonetto, il pannello, le lettere tubolari e il neon dentro ──
  {
    const LARG = 1.30, ALT = 1.30 * 360 / 1020, PROF = 0.14
    const s = LARG / 1020, x0 = W / 2 - LARG / 2, y0 = H + 0.42, ytop = y0 + ALT, z0 = Z_FACCIATA
    const cass = new T.Group()
    // il telaio: quattro profili, il fondo e la faccia dietro il pannello
    for (const [w, hh, x, y] of [[LARG, 0.03, 0, ALT / 2 - 0.015], [LARG, 0.03, 0, -ALT / 2 + 0.015], [0.03, ALT, -LARG / 2 + 0.015, 0], [0.03, ALT, LARG / 2 - 0.015, 0]]) cass.add(ombra(scatola(w, hh, PROF, mAlluminio, x, y, PROF / 2)))
    cass.add(ombra(scatola(LARG - 0.06, ALT - 0.06, 0.02, mAlluminio, 0, 0, 0.01)))
    cass.add(ombra(scatola(LARG - 0.06, 0.02, PROF, mAlluminio, 0, ALT / 2 - 0.04, PROF / 2)))
    cass.add(ombra(scatola(LARG - 0.06, 0.02, PROF, mAlluminio, 0, -ALT / 2 + 0.04, PROF / 2)))
    const pannelloT = await immagine(ART + 'pannello.svg').catch(() => null)
    h.pannello = new T.MeshPhysicalMaterial({ map: pannelloT, color: 0xffffff, roughness: 0.38, clearcoat: 0.25, clearcoatRoughness: 0.4, emissive: 0xffc07a, emissiveMap: pannelloT, emissiveIntensity: 0 })
    const pann = ombra(new T.Mesh(new T.PlaneGeometry(LARG - 0.06, ALT - 0.06), h.pannello), false, true)
    pann.position.z = PROF - 0.012; cass.add(pann)
    cass.position.set(x0 + LARG / 2, y0 + ALT / 2, z0); scene.add(cass)
    // le lettere: tubi bianchi di metacrilato, che di notte si scaldano di luce; davanti il filo del neon
    const zl = z0 + PROF - 0.012 + 0.03
    h.lettere = new T.MeshPhysicalMaterial({ color: 0xf4f2ec, roughness: 0.3, clearcoat: 0.5, clearcoatRoughness: 0.3, emissive: 0xffb45c, emissiveIntensity: 0 })
    const lett = ombra(new T.Mesh(lettere(x0, ytop, s, 0.03, zl), h.lettere)); scene.add(lett)
    h.neon = new T.MeshBasicMaterial({ color: 0xfff1d8, transparent: true, opacity: 0 })
    const neon = new T.Mesh(lettere(x0, ytop, s, 0.008, zl + 0.03), h.neon); scene.add(neon)
    // la luce che l'insegna manda sul muro e sulla saracinesca: tre lampade davanti al pannello
    h.luciInsegna = [0.25, 0.5, 0.75].map((f) => { const l = new T.PointLight(0xffb45c, 0, 4, 2); l.position.set(x0 + LARG * f, y0 + ALT / 2 - 0.05, z0 + PROF + 0.45); scene.add(l); return l })
    // le colature della pioggia sul muro, sotto il cassonetto
    const col = await immagine(ART + 'colature.svg').catch(() => null)
    if (col) { const m = new T.Mesh(new T.PlaneGeometry(LARG + 0.02, 0.1), new T.MeshStandardMaterial({ map: col, transparent: true, roughness: 0.95, depthWrite: false })); m.position.set(W / 2, y0 - 0.05, Z_FACCIATA + 0.002); scene.add(m) }
    h.insegna = { x0, y0, LARG, ALT }
  }

  // ── la lampada a muro: il braccio, il corpo, la lampadina, il fascio ─────────
  {
    const x = (PORTA.x0 + PORTA.x1) / 2 + 0.1, y = 3.6
    const braccio = new T.Mesh(tubo(new T.Vector3(x, y, Z_FACCIATA), new T.Vector3(x, y, Z_FACCIATA + 0.55), 0.016), mFerro); scene.add(ombra(braccio))
    const tirante = new T.Mesh(tubo(new T.Vector3(x, y + 0.35, Z_FACCIATA), new T.Vector3(x, y + 0.02, Z_FACCIATA + 0.5), 0.008), mFerro); scene.add(ombra(tirante))
    scene.add(ombra(scatola(0.12, 0.4, 0.03, mFerro, x, y + 0.15, Z_FACCIATA + 0.015)))
    const corpo = new T.Mesh(new T.CylinderGeometry(0.16, 0.08, 0.22, 20, 1, true), new T.MeshStandardMaterial({ color: 0x2a2c2e, roughness: 0.5, metalness: 0.7, side: T.DoubleSide }))
    corpo.position.set(x, y - 0.1, Z_FACCIATA + 0.55); scene.add(ombra(corpo, true, false))
    h.lampadina = new T.Mesh(new T.SphereGeometry(0.035, 16, 12), new T.MeshStandardMaterial({ color: 0x222222, emissive: 0xffe4c0, emissiveIntensity: 0 }))
    h.lampadina.position.set(x, y - 0.2, Z_FACCIATA + 0.55); scene.add(h.lampadina)
    const spot = new T.SpotLight(0xffe4c0, 0, 16, 0.95, 0.5, 2)
    spot.position.set(x, y - 0.22, Z_FACCIATA + 0.55)
    spot.target.position.set(W / 2 + 0.3, 1.0, 0.3); scene.add(spot.target)
    spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024); spot.shadow.bias = -0.0005; spot.shadow.normalBias = 0.02; spot.shadow.camera.near = 0.3; spot.shadow.camera.far = 16
    scene.add(spot); h.lampada = spot
  }

  // ── il marciapiede bagnato, il cordolo, la strada, il marciapiede di là ──────
  {
    const las = lastre(1024, 21)
    const X0 = -6, X1 = W + 9, Z0 = Z_FACCIATA, Z1 = 2.3
    const g = new T.PlaneGeometry(X1 - X0, Z1 - Z0)
    h.pozze = specchio(g, 512, 256, 0x4e4e4e, 1, 1)
    h.pozze.rotation.x = -Math.PI / 2; h.pozze.position.set((X0 + X1) / 2, 0, (Z0 + Z1) / 2); scene.add(h.pozze)
    for (const t of [las.map, las.normalMap, las.asciutto]) t.repeat.set((X1 - X0) / las.lato, (Z1 - Z0) / las.lato)
    const mLastre = new T.MeshStandardMaterial({ map: las.map, normalMap: las.normalMap, normalScale: new T.Vector2(1, 1), alphaMap: las.asciutto, transparent: true, roughness: 0.8, metalness: 0, polygonOffset: true, polygonOffsetFactor: -1 })
    const suolo = ombra(new T.Mesh(g.clone(), mLastre), false, true)
    suolo.rotation.x = -Math.PI / 2; suolo.position.set((X0 + X1) / 2, 0.0015, (Z0 + Z1) / 2); scene.add(suolo)
    // la soglia di pietra sotto la saracinesca, il cordolo, la strada, il marciapiede di fronte
    scene.add(ombra(scatola(W + 0.2, 0.03, 0.3, mPietra, W / 2, -0.015, -0.05), false, true))
    scene.add(ombra(scatola(X1 - X0, 0.15, 0.2, mPietra, (X0 + X1) / 2, -0.06, Z1 + 0.1)))
    const asf = asfalto(512, 33)
    const strada = { x0: -30, x1: W + 30, z0: Z1 + 0.2, z1: 16 }
    for (const t of [asf.map, asf.normalMap]) t.repeat.set((strada.x1 - strada.x0) / asf.lato, (strada.z1 - strada.z0) / asf.lato)
    const road = ombra(new T.Mesh(new T.PlaneGeometry(strada.x1 - strada.x0, strada.z1 - strada.z0), new T.MeshStandardMaterial({ map: asf.map, normalMap: asf.normalMap, roughness: 0.55, metalness: 0.05 })), false, true)
    road.rotation.x = -Math.PI / 2; road.position.set((strada.x0 + strada.x1) / 2, -0.13, (strada.z0 + strada.z1) / 2); scene.add(road)
    scene.add(ombra(scatola(strada.x1 - strada.x0, 0.15, 1.8, mPietra, (strada.x0 + strada.x1) / 2, -0.06, strada.z1 + 0.9)))
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
      const palo = new T.Mesh(new T.CylinderGeometry(0.05, 0.08, 7.5, 12), mFerro); palo.position.set(lx, 3.6, Z - 0.6); scene.add(ombra(palo))
      const testa = new T.Mesh(new T.BoxGeometry(0.55, 0.18, 0.3), mFerro); testa.position.set(lx, 7.4, Z - 0.9); scene.add(ombra(testa))
      const bulbo = new T.Mesh(new T.PlaneGeometry(0.45, 0.22), new T.MeshStandardMaterial({ color: 0x333333, emissive: 0xffd090, emissiveIntensity: 0 }))
      bulbo.rotation.x = -Math.PI / 2; bulbo.position.set(lx, 7.3, Z - 0.9); scene.add(bulbo)
      const luce = new T.PointLight(0xffd090, 0, 40, 2); luce.position.set(lx, 7.1, Z - 0.9); scene.add(luce)
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
    h.autoLuci = [0.6, -0.6].map((z) => {
      // i fari guardano avanti e un po' verso il muro (la strada è stretta): così passando lo spazzano
      const s = new T.SpotLight(0xffe2aa, 0, 30, 0.87, 0.55, 2)
      s.position.set(2.2, 0.7, z); s.target.position.set(8.4, 0.1, z - 10); auto.add(s); auto.add(s.target)
      return s
    })
    h.autoFreno = new T.PointLight(0xff2418, 0, 6, 2); h.autoFreno.position.set(-2.4, 0.7, 0); auto.add(h.autoFreno)
    h.autoNeon = new T.PointLight(0x28dcff, 0, 5, 2); h.autoNeon.position.set(0, 0.25, 0); auto.add(h.autoNeon)
    auto.visible = false
    scene.add(auto); h.auto = auto
  }

  return h
}
