// La scena 3D della moneta di pzkko.it (three.js, lo stesso motore della
// roulette e del blackjack): il piatto di legno laccato, appoggiato sul foglio, e
// la moneta d'ottone con le facce in rilievo (colore, normali e lucido fatti da
// tools/pzkko/moneta/facce.mjs dal disegno di gpt-image-2) e la zigrinatura sul
// bordo. La moneta la muove la fisica (lancio.js); qui si disegna soltanto. La
// telecamera guarda il piatto di sbieco mentre la moneta vola; quando si ferma le
// va sopra e si gira, così la faccia uscita si legge dritta.

import * as THREE from '../roulette/lib/three.js'
import { MONETA, PIATTO, BORDO, FONDO, FISICA } from './lancio.js'

const ART = '/art/'
const RIDOTTO = matchMedia('(prefers-reduced-motion: reduce)')
const dolce = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
const OTTONE = 0xd9b46a
// il punto più alto che la moneta può raggiungere (il lancio più forte, dall'altezza da cui parte)
const ALTO_VOLO = FONDO.y + FISICA.lancio.alto + FISICA.lancio.su[1] ** 2 / (2 * FISICA.g) + MONETA.r

// una superficie di rivoluzione del profilo [[r, y]…], le normali verso `fuori` (o verso l'alto e il centro);
// le coordinate di texture: dall'alto (il legno del piatto viene da un'asse sola) o attorno e lungo il profilo
function rivoluzione(profilo, seg, { uv = 'giro', lato = 1, fuori = false } = {}) {
  const nv = profilo.length
  const lung = [0]
  for (let i = 1; i < nv; i++) lung.push(lung[i - 1] + Math.hypot(profilo[i][0] - profilo[i - 1][0], profilo[i][1] - profilo[i - 1][1]))
  const pos = [], uvs = [], idx = []
  for (let s = 0; s <= seg; s++) {
    const t = (s / seg) * Math.PI * 2, c = Math.cos(t), sn = Math.sin(t)
    for (let i = 0; i < nv; i++) {
      const [r, y] = profilo[i]
      pos.push(r * c, y, -r * sn)
      if (uv === 'alto') uvs.push(0.5 + (r * c) / lato, 0.5 - (r * sn) / lato)
      else uvs.push(s / seg, lung[i] / lung[nv - 1])
    }
  }
  for (let s = 0; s < seg; s++) for (let i = 0; i < nv - 1; i++) {
    const a = s * nv + i, b = a + 1, c = (s + 1) * nv + i, d = c + 1
    idx.push(a, b, c, b, d, c)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  const n = g.getAttribute('normal'), p = g.getAttribute('position')
  let verso = 0
  for (let i = 0; i < n.count; i++) verso += fuori ? n.getX(i) * p.getX(i) + n.getZ(i) * p.getZ(i) : n.getY(i)
  if (verso < 0) { const ix = g.getIndex().array; for (let i = 0; i < ix.length; i += 3) { const k = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = k } g.computeVertexNormals() }
  return g
}

export class Scena {
  constructor(canvas) {
    const r = (this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }))
    r.setPixelRatio(Math.min(devicePixelRatio || 1, 2))
    r.outputColorSpace = THREE.SRGBColorSpace
    r.toneMapping = THREE.NeutralToneMapping
    r.toneMappingExposure = 1.1
    r.shadowMap.enabled = true
    r.shadowMap.type = THREE.PCFSoftShadowMap
    this.scena = new THREE.Scene()
    this.scena.environment = this.ambiente()
    this.scena.environmentIntensity = 1
    this.camera = new THREE.PerspectiveCamera(32, 1, 0.01, 10)
    this.w = 1; this.h = 1
    this.sporco = true
    this.cambiato = null // chi disegna lo sa quando arriva un'immagine (il ciclo, quando nulla si muove, è fermo)
    this.anis = Math.min(8, r.capabilities.getMaxAnisotropy())

    // la lampada sopra il tavolo, un po' a sinistra (con le ombre), e la luce della stanza
    const sole = (this.sole = new THREE.DirectionalLight(0xfff3e2, 2.3))
    sole.position.set(-0.45, 1.4, -0.25)
    sole.castShadow = true
    sole.shadow.mapSize.set(2048, 2048)
    Object.assign(sole.shadow.camera, { left: -0.24, right: 0.24, top: 0.24, bottom: -0.24, near: 0.8, far: 2.4 })
    sole.shadow.bias = -0.0002
    sole.shadow.normalBias = 0.002
    sole.shadow.radius = 3
    this.scena.add(sole)
    this.scena.add(new THREE.HemisphereLight(0xfff8ee, 0x3a3028, 0.5))

    this.piatto()
    this.moneta = this.costruisciMoneta()
    this.scena.add(this.moneta)

    // le inquadrature: `vista` è quella di adesso, `volo` l'animazione da una all'altra; `gru` quanto la telecamera
    // è salita dietro alla moneta in aria (m), `alzo` l'altezza della moneta
    this.vista = null
    this.volo = null
    this.gru = 0
    this.alzo = 0
    this.prima = 0
  }

  // la stanza che si specchia nell'ottone e nella lacca: buia, con una lampada larga proprio sopra il tavolo (la
  // moneta piatta vista dall'alto si accende), una finestra a sinistra e la luce dietro chi guarda
  ambiente() {
    const st = new THREE.Scene()
    st.background = new THREE.Color(0x221d19)
    const luce = (w, h, x, y, z, k, col = 0xffffff) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide }))
      m.position.set(x, y, z)
      m.lookAt(0, 0, 0)
      st.add(m)
    }
    luce(3.4, 3.4, 0.5, 4, 0.4, 1.5, 0xfff7ee)
    luce(3, 1.6, 0, 3, -3, 1.1, 0xfff3e6)
    luce(1.2, 6, -5, 2.4, -0.6, 4.5, 0xf6f8ff)
    luce(5, 1, 2.5, 2, 4, 2.4, 0xfff1e4)
    luce(10, 10, 0, -3, 0, 0.06, 0x8a7560)
    const pm = new THREE.PMREMGenerator(this.renderer)
    const t = pm.fromScene(st, 0.03).texture
    pm.dispose()
    return t
  }

  // un'immagine: quando arriva, `poi(t)` la mette dove serve e si ridisegna (prima no: una texture vuota è nera)
  carica(nome, poi, colore = true) {
    new THREE.TextureLoader().load(ART + nome, (t) => {
      if (colore) t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = this.anis
      poi(t)
      this.sporco = true
      this.cambiato?.()
    }, undefined, () => {})
  }

  // il piatto: legno laccato tornito da un'asse sola (la venatura dritta, vista dall'alto), l'ombra sul foglio
  piatto() {
    const mat = new THREE.MeshPhysicalMaterial({ color: 0x6a3f2c, roughness: 0.42, clearcoat: 1, clearcoatRoughness: 0.1 })
    const matFianco = new THREE.MeshPhysicalMaterial({ color: 0x4a2c20, roughness: 0.45, clearcoat: 1, clearcoatRoughness: 0.14 })
    this.carica('roulette/legno.webp', (legno) => {
      legno.wrapS = legno.wrapT = THREE.MirroredRepeatWrapping
      for (const [m, c] of [[mat, 0xc29a82], [matFianco, 0x8a6250]]) { m.map = legno; m.color.set(c); m.needsUpdate = true }
    })
    const sopra = rivoluzione(PIATTO.slice(1), 192, { uv: 'alto', lato: 2 * BORDO })
    const m = new THREE.Mesh(sopra, mat)
    m.receiveShadow = true
    m.castShadow = true
    this.scena.add(m)
    const fianco = new THREE.Mesh(rivoluzione(PIATTO.slice(0, 3), 192, { fuori: true }), matFianco)
    fianco.castShadow = true
    this.scena.add(fianco)
    // l'ombra sul foglio (il foglio vero è sotto, nella pagina: la tela è trasparente) e il buio stretto sotto il bordo
    const ombra = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.ShadowMaterial({ opacity: 0.3, color: 0x2a1c10 }))
    ombra.rotation.x = -Math.PI / 2
    ombra.receiveShadow = true
    this.scena.add(ombra)
    const c = document.createElement('canvas')
    c.width = c.height = 256
    const g = c.getContext('2d')
    const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128)
    gr.addColorStop(0.78, 'rgba(30,20,12,.55)')
    gr.addColorStop(0.86, 'rgba(30,20,12,.22)')
    gr.addColorStop(1, 'rgba(30,20,12,0)')
    g.fillStyle = gr
    g.fillRect(0, 0, 256, 256)
    const contatto = new THREE.Mesh(new THREE.PlaneGeometry(BORDO * 2.36, BORDO * 2.36), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }))
    contatto.rotation.x = -Math.PI / 2
    contatto.position.y = 0.0004
    this.scena.add(contatto)
  }

  // la moneta: le due facce (la testa sopra, +y; la croce sotto), il bordo con lo spigolo arrotondato e la zigrinatura
  costruisciMoneta() {
    const { r, h } = MONETA
    const b = 0.00035 // lo spigolo
    const g = new THREE.Group()
    const faccia = (nome, sotto) => {
      const geo = new THREE.CircleGeometry(r - b, 96)
      // le coordinate: l'immagine intera è la moneta fino al bordo
      const p = geo.getAttribute('position'), uv = geo.getAttribute('uv')
      for (let i = 0; i < p.count; i++) uv.setXY(i, 0.5 + (0.5 * p.getX(i)) / r, 0.5 + (0.5 * p.getY(i)) / r)
      // la testa: l'alto dell'immagine verso −z; la croce, vista quando la moneta è girata, verso +z
      geo.rotateX(sotto ? Math.PI / 2 : -Math.PI / 2)
      geo.translate(0, sotto ? -h / 2 : h / 2, 0)
      // finché le immagini non arrivano tutte la faccia è ottone liscio
      const mat = new THREE.MeshPhysicalMaterial({ color: OTTONE, metalness: 1, roughness: 0.32 })
      const t = {}
      const arriva = (s) => (tex) => {
        t[s] = tex
        if (!t.colore || !t.normali || !t.lucido) return
        Object.assign(mat, { map: t.colore, normalMap: t.normali, normalScale: new THREE.Vector2(1, 1), roughnessMap: t.lucido, metalnessMap: t.lucido, roughness: 1 })
        mat.color.set(0xffffff)
        mat.needsUpdate = true
      }
      this.carica(`moneta/${nome}-colore.webp`, arriva('colore'))
      this.carica(`moneta/${nome}-normali.webp`, arriva('normali'), false)
      this.carica(`moneta/${nome}-lucido.webp`, arriva('lucido'), false)
      const m = new THREE.Mesh(geo, mat)
      m.castShadow = true
      m.receiveShadow = true
      return m
    }
    g.add(faccia('testa', false), faccia('croce', true))
    // il bordo: dallo spigolo di sopra a quello di sotto
    const prof = []
    for (let k = 0; k <= 4; k++) { const a = (k / 4) * (Math.PI / 2); prof.push([r - b + b * Math.sin(a), h / 2 - b + b * Math.cos(a)]) }
    for (let k = 0; k <= 4; k++) { const a = (k / 4) * (Math.PI / 2); prof.push([r - b + b * Math.cos(a), -h / 2 + b - b * Math.sin(a)]) }
    const zig = this.zigrinatura()
    const bordo = new THREE.Mesh(rivoluzione(prof, 128, { fuori: true }), new THREE.MeshPhysicalMaterial({ color: 0xc9a258, metalness: 1, roughness: 0.38, normalMap: zig, normalScale: new THREE.Vector2(1.4, 1.4) }))
    bordo.castShadow = true
    bordo.receiveShadow = true
    g.add(bordo)
    return g
  }

  // la zigrinatura: 150 righe in rilievo attorno al bordo, una mappa delle normali disegnata qui
  zigrinatura() {
    const W = 1200, H = 8, n = 150
    const c = document.createElement('canvas')
    c.width = W; c.height = H
    const g = c.getContext('2d')
    const img = g.createImageData(W, H)
    for (let x = 0; x < W; x++) {
      const t = ((x / W) * n) % 1, nx = Math.sin(t * Math.PI * 2) * 0.75, nz = Math.sqrt(1 - nx * nx)
      for (let y = 0; y < H; y++) { const i = (y * W + x) * 4; img.data[i] = 128 + nx * 127; img.data[i + 1] = 128; img.data[i + 2] = 128 + nz * 127; img.data[i + 3] = 255 }
    }
    g.putImageData(img, 0, 0)
    const t = new THREE.CanvasTexture(c)
    t.wrapS = THREE.RepeatWrapping
    return t
  }

  /** Le misure della tela (px). */
  misura(w, h) {
    if (!w || !h) return
    this.w = w; this.h = h
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    if (!this.volo) this.vista = this.inquadratura(this.dove ?? 'piatto')
    this.sporco = true
  }

  /** Posizione e orientamento della moneta (dalla fisica). */
  posa(p, q) {
    this.moneta.position.set(p.x, p.y, p.z)
    this.moneta.quaternion.set(q.x, q.y, q.z, q.w)
    this.alzo = p.y
    this.sporco = true
  }

  // un'inquadratura: { pos, guarda, su }
  inquadratura(dove) {
    const cam = this.camera, tg = Math.tan((cam.fov * Math.PI) / 360), asp = cam.aspect
    if (dove === 'moneta') {
      // sopra la moneta, appena inclinata, girata in modo che la faccia uscita si legga dritta
      const m = this.moneta, su = new THREE.Vector3(0, 1, 0).applyQuaternion(m.quaternion)
      const alto = new THREE.Vector3(0, 0, su.y >= 0 ? -1 : 1).applyQuaternion(m.quaternion)
      alto.y = 0
      if (alto.lengthSq() < 1e-6) alto.set(0, 0, -1)
      alto.normalize()
      const d = MONETA.r / (0.36 * tg * Math.min(1, asp))
      const k = (12 * Math.PI) / 180
      const guarda = m.position.clone()
      return { pos: guarda.clone().addScaledVector(alto, -d * Math.sin(k)).add(new THREE.Vector3(0, d * Math.cos(k), 0)), guarda, su: alto.clone() }
    }
    // il piatto intero di sbieco, con lo spazio sopra per il volo della moneta: la telecamera si allontana finché
    // il bordo del piatto e il punto più alto del lancio stanno dentro la tela, con un po' di margine
    const el = (64 * Math.PI) / 180
    const guarda = new THREE.Vector3(0, 0.05, -0.01)
    const punti = [new THREE.Vector3(0, ALTO_VOLO * 0.55, 0)] // il resto del volo lo segue la telecamera, salendo (gru, sotto)
    for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; punti.push(new THREE.Vector3(BORDO * Math.cos(a), 0.02, BORDO * Math.sin(a))) }
    const prova = cam.clone()
    let d = BORDO / tg
    for (let i = 0; i < 80; i++, d *= 1.03) {
      prova.position.copy(guarda).add(new THREE.Vector3(0, Math.sin(el) * d, Math.cos(el) * d))
      prova.up.set(0, 1, 0)
      prova.lookAt(guarda)
      prova.updateMatrixWorld()
      prova.updateProjectionMatrix()
      if (punti.every((p) => { const q = p.clone().project(prova); return Math.abs(q.x) < 0.93 && Math.abs(q.y) < 0.9 })) break
    }
    return { pos: prova.position.clone(), guarda, su: new THREE.Vector3(0, 1, 0) }
  }

  /** Va all'inquadratura `dove` ('piatto' o 'moneta') in `durata` ms; restituisce una promessa. */
  inquadra(dove, { durata = 900 } = {}) {
    this.dove = dove
    const a = this.inquadratura(dove)
    if (!this.vista || RIDOTTO.matches || durata <= 0) { this.vista = a; this.volo?.fine(); this.volo = null; this.sporco = true; return Promise.resolve() }
    this.volo?.fine()
    return new Promise((fine) => { this.volo = { da: this.vista, a, t0: performance.now(), durata, fine } ; this.sporco = true })
  }

  /** Un fotogramma: l'inquadratura che si muove e il disegno, se serve. Restituisce true se c'è ancora da muoversi. */
  fotogramma(now) {
    let ancora = false
    // la gru: nel piatto intero la telecamera sale dietro alla moneta che vola (la metà della sua altezza), e torna giù piano
    const dt = Math.min(0.1, (now - (this.prima || now)) / 1000)
    this.prima = now
    const voluta = this.dove === 'piatto' ? Math.max(0, this.alzo - 0.06) * 0.5 : 0
    if (Math.abs(voluta - this.gru) > 2e-4) {
      this.gru += (voluta - this.gru) * (1 - Math.exp(-dt * (voluta > this.gru ? 9 : 4)))
      this.sporco = ancora = true
    } else this.gru = voluta
    if (this.volo) {
      const V = this.volo, u = Math.min(1, (now - V.t0) / V.durata), e = dolce(u)
      // la telecamera fa un arco: si alza un po' a metà strada
      const pos = V.da.pos.clone().lerp(V.a.pos, e)
      pos.y += Math.sin(Math.PI * e) * 0.06
      this.vista = { pos, guarda: V.da.guarda.clone().lerp(V.a.guarda, e), su: V.da.su.clone().lerp(V.a.su, e).normalize() }
      if (u >= 1) { this.vista = V.a; this.volo = null; V.fine() } else ancora = true
      this.sporco = true
    }
    if (!this.sporco) return ancora
    const cam = this.camera, v = this.vista ?? this.inquadratura('piatto')
    cam.position.copy(v.pos)
    cam.position.y += this.gru
    cam.up.copy(v.su)
    cam.lookAt(v.guarda.x, v.guarda.y + this.gru, v.guarda.z)
    this.renderer.render(this.scena, cam)
    this.sporco = false
    return ancora
  }
}
