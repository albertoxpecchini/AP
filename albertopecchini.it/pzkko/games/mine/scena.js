// La scena 3D delle mine di pzkko.it (three.js, lo stesso motore della roulette e
// del blackjack): venticinque tessere laccate, spesse, con lo smusso, il dorso
// rosso pzkko in su; si girano come le carte, e sulla faccia salta fuori una
// gemma vera (sfaccettata, che prende le luci della stanza) o la bomba con la
// miccia accesa, che scoppia: il lampo, il fumo, i pezzi della tessera che volano
// e ricadono sul foglio, le tessere vicine che saltano. Il campo invece è il
// foglio stampato (SVG, in mine.js): la telecamera guarda dall'alto e il piano
// y = 0 cade sul foglio, un'unità = un px del campo, come nel blackjack.

import * as THREE from '../roulette/lib/three.js'
import { dorso, faccia, scintilla, lampo, fumo } from './tessere.js'

const T = 0.15 // lo spessore della tessera (larga 1)
const SM = 0.045 // lo smusso
const R = 0.13 // il raggio degli angoli
const GEMMA = 0.5 // la gemma è larga mezza tessera
const BOMBA = 0.95 // la bomba (una sfera di raggio 0,3) rispetto alla tessera
const G = 2600 // la gravità dei pezzi, px/s² (al rallentatore: quella vera, a questa scala, è dieci volte tanto)
const RIDOTTO = matchMedia('(prefers-reduced-motion: reduce)')
const ADDITIVA = 2 // THREE.AdditiveBlending: la libreria della roulette non esporta le costanti

// la tessera: il profilo con gli angoli tondi estruso con lo smusso; sotto la faccia (gruppo 0), il fianco (1), sopra il dorso (2)
function geometriaTessera() {
  const l = 0.5 - SM, r = R
  const s = new THREE.Shape()
  s.moveTo(-l + r, -l)
  s.lineTo(l - r, -l); s.absarc(l - r, -l + r, r, -Math.PI / 2, 0, false)
  s.lineTo(l, l - r); s.absarc(l - r, l - r, r, 0, Math.PI / 2, false)
  s.lineTo(-l + r, l); s.absarc(-l + r, l - r, r, Math.PI / 2, Math.PI, false)
  s.lineTo(-l, -l + r); s.absarc(-l + r, -l + r, r, Math.PI, Math.PI * 1.5, false)
  const alto = T - 2 * SM
  const g = new THREE.ExtrudeGeometry(s, { depth: alto, bevelEnabled: true, bevelThickness: SM, bevelSize: SM, bevelSegments: 4, curveSegments: 6 })
  g.translate(0, 0, -alto / 2)
  // ExtrudeGeometry mette i due coperchi in un gruppo solo, prima quello sotto e poi quello sopra: si dividono
  const [tappi, lati] = g.groups
  const meta = tappi.count / 2
  g.clearGroups()
  g.addGroup(0, meta, 0)
  g.addGroup(meta, meta, 2)
  g.addGroup(lati.start, lati.count, 1)
  // le texture sui coperchi da 0 a 1; la faccia specchiata, perché si legge dopo il giro
  const pos = g.getAttribute('position'), uv = g.getAttribute('uv')
  for (let i = 0; i < tappi.count; i++) uv.setXY(i, i < meta ? 0.5 - pos.getX(i) : 0.5 + pos.getX(i), 0.5 + pos.getY(i))
  g.rotateX(-Math.PI / 2) // lo spessore in verticale: il dorso guarda in su, l'alto del disegno verso l'alto dello schermo
  return g
}

// la gemma: un brillante a otto lati, la tavola in su (larga 1)
function geometriaGemma() {
  const p = [[0.0001, -0.3], [0.5, 0], [0.5, 0.045], [0.3, 0.22], [0.0001, 0.22]].map(([x, y]) => new THREE.Vector2(x, y))
  return new THREE.LatheGeometry(p, 8)
}

const facile = (t) => 1 - (1 - t) ** 3
const dolce = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
const fuori = (t) => { const c = 1.9; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2 } // va oltre e torna
const rimbalza = (t) => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375; return n * (t -= 2.625 / d) * t + 0.984375 }
const angolo = (a, b) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d }
const CAMPI = ['x', 'y', 'alto', 'su', 'ix', 'iz']

/** Una tessera: la posa è { x, y (px del campo), alto (px sopra il foglio), giro (rad), su (0 coperta … 1 scoperta), ix, iz (inclinata, rad) }. */
class Tessera {
  constructor(scena, i) {
    this.scena = scena
    this.i = i
    this.radice = new THREE.Group()
    this.perno = new THREE.Group()
    this.mesh = new THREE.Mesh(scena.geo, [scena.faccia('vuota'), scena.matFianco, scena.matDorso])
    this.mesh.castShadow = true
    this.mesh.receiveShadow = true
    this.perno.add(this.mesh)
    this.radice.add(this.perno)
    scena.scena.add(this.radice)
    this.casa = { x: 0, y: 0 }
    this.posa = { x: 0, y: 0, alto: 0, giro: 0, su: 0, ix: 0, iz: 0 }
    this.alzo = 0 // quanto si solleva sotto il puntatore (px), e dove sta andando
    this.verso = 0
  }
  get viva() { return this.radice.visible }
  mostra(tipo, spenta = false) { this.mesh.material[0] = this.scena.faccia(tipo, spenta); this.scena.sporco = true }
  applica() {
    const s = this.scena, p = this.posa, l = s.lato
    this.mesh.scale.setScalar(l)
    const giro = Math.PI * p.su
    // girando si alza di mezzo lato, per non entrare nel foglio
    const su = Math.abs(Math.sin(giro)) * l * 0.5 + (l * T) / 2
    this.radice.position.set(p.x - s.w / 2, p.alto + su + this.alzo, p.y - s.h / 2)
    this.radice.rotation.y = -p.giro
    this.perno.rotation.set(p.ix, 0, giro + p.iz)
  }
}

export class Scena {
  constructor(canvas) {
    this.canvas = canvas
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.NeutralToneMapping
    this.renderer.toneMappingExposure = this.esposizione = 1.15
    this.renderer.shadowMap.enabled = true
    this.scena = new THREE.Scene()
    this.scena.environment = this.ambiente()
    this.scena.environmentIntensity = 0.9
    this.camera = new THREE.PerspectiveCamera(24, 1, 10, 5000)
    this.tween = []
    this.veloce = 1
    this.w = 1; this.h = 1; this.lato = 60
    this.anis = Math.min(8, this.renderer.capabilities.getMaxAnisotropy())

    // la lampada sopra il tavolo (davanti, in alto a sinistra) e la luce della stanza
    this.sole = new THREE.DirectionalLight(0xffffff, (this.forzaSole = 2.2))
    this.sole.castShadow = true
    this.sole.shadow.mapSize.set(2048, 2048)
    this.sole.shadow.bias = -0.0006
    this.sole.shadow.normalBias = 0.02
    this.sole.shadow.radius = 4
    this.scena.add(this.sole, this.sole.target)
    this.cielo = new THREE.HemisphereLight(0xffffff, 0x8a8580, (this.forzaCielo = 1.1))
    this.scena.add(this.cielo)
    this.ombra = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShadowMaterial({ opacity: 0.34, color: 0x2a1c10 }))
    this.ombra.rotation.x = -Math.PI / 2
    this.ombra.receiveShadow = true
    this.scena.add(this.ombra)

    // i materiali: vernice lucida sopra la stampa, il fianco color avorio
    const tex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = this.anis; return t }
    this.tex = tex
    this.facce = new Map()
    this.matDorso = new THREE.MeshPhysicalMaterial({ map: tex(dorso()), roughness: 0.55, clearcoat: 1, clearcoatRoughness: 0.08 })
    this.matFianco = new THREE.MeshPhysicalMaterial({ color: 0xebe3d2, roughness: 0.42, clearcoat: 0.7, clearcoatRoughness: 0.12 })
    this.geo = geometriaTessera()
    this.tessere = Array.from({ length: 25 }, (_, i) => new Tessera(this, i))

    // le gemme: smeraldi sfaccettati
    this.geoGemma = geometriaGemma()
    this.matGemma = new THREE.MeshPhysicalMaterial({ color: 0x1fc472, emissive: 0x073d20, emissiveIntensity: 0.6, roughness: 0.05, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02, flatShading: true, iridescence: 0.3, iridescenceIOR: 1.5, envMapIntensity: 2.2 })
    this.gemme = new Map() // casella → il gruppo della gemma (figlio della sua tessera)

    this.costruisciBomba()
    this.costruisciEffetti()
  }

  /** La faccia di una tessera: 'vuota', 'gemma', 'mina'; spenta = le caselle non scelte, svelate a fine giro. */
  faccia(tipo, spenta = false) {
    const k = tipo + (spenta ? '-' : '')
    if (!this.facce.has(k)) this.facce.set(k, new THREE.MeshPhysicalMaterial({ map: this.tex(faccia(tipo)), color: spenta ? 0xa49d92 : 0xffffff, roughness: 0.5, clearcoat: 1, clearcoatRoughness: 0.1 }))
    return this.facce.get(k)
  }

  // la stanza che si specchia nella vernice e nelle gemme: quasi buia sopra il tavolo, le lampade di lato
  ambiente() {
    const st = new THREE.Scene()
    st.background = new THREE.Color(0x2b2622)
    const luce = (w, h, x, y, z, k, col = 0xffffff) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide }))
      m.position.set(x, y, z)
      m.lookAt(0, 0, 0)
      st.add(m)
    }
    luce(2.4, 1.6, 0.3, 5, 0.5, 0.45, 0xfff2e0)
    const velo = new THREE.PlaneGeometry(2.2, 3.2, 1, 8)
    const col = []
    for (let i = 0; i < velo.attributes.position.count; i++) { const x = velo.attributes.position.getX(i) / 1.1; const k = Math.max(0, 1 - Math.abs(x)) ** 1.5 * 1.25; col.push(k, k * 0.98, k * 0.95) }
    velo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
    const v = new THREE.Mesh(velo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }))
    v.position.set(-1.35, 5, 0.2)
    v.lookAt(0, 0, 0)
    st.add(v)
    luce(1.2, 7, -5, 3, -1, 7, 0xfff8f0)
    luce(4, 0.8, 3, 2.5, 4, 4, 0xfff0e0)
    luce(5, 2, 0, 2.2, -5, 2.2, 0xffe8d0)
    // tante lampadine piccole intorno: nelle faccette delle gemme fanno i lampi
    for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2; luce(0.35, 0.35, Math.cos(a) * 4, 1.6 + (k % 3) * 0.9, Math.sin(a) * 4, 9) }
    const pm = new THREE.PMREMGenerator(this.renderer)
    const t = pm.fromScene(st, 0.03).texture
    pm.dispose()
    return t
  }

  /** Le misure del campo (px), il lato delle tessere e i centri delle caselle. */
  misura(w, h, lato, caselle) {
    this.w = w; this.h = h; this.lato = lato
    this.renderer.setSize(w, h, false)
    const cam = this.camera
    cam.aspect = w / h
    const dist = h / 2 / Math.tan((cam.fov * Math.PI) / 360)
    cam.position.set(0, dist, 0)
    cam.up.set(0, 0, -1)
    cam.lookAt(0, 0, 0)
    cam.near = dist * 0.3
    cam.far = dist * 2
    cam.updateProjectionMatrix()
    this.sole.position.set(-0.35 * dist, dist, -0.55 * dist)
    this.sole.target.position.set(0, 0, 0)
    const ombre = this.sole.shadow.camera
    const l = Math.max(w, h) * 0.75
    Object.assign(ombre, { left: -l, right: l, top: l, bottom: -l, near: dist * 0.2, far: dist * 2.4 })
    ombre.updateProjectionMatrix()
    this.ombra.scale.set(w * 1.2, h * 1.2, 1)
    // le tessere tornano a casa (quelle spostate dallo scoppio si rimettono dritte)
    caselle.forEach((c, i) => { const t = this.tessere[i]; t.casa = c; Object.assign(t.posa, { x: c.x, y: c.y, giro: 0, ix: 0, iz: 0 }); if (!this.tween.length) t.posa.alto = 0; t.applica() })
    for (const p of this.pezzi) { p.mesh.visible = false }
    this.sporco = true
  }

  // ── le animazioni ──────────────────────────────────────────────────────────
  /** f(u) a ogni fotogramma per `durata` ms (u da 0 a 1); la promessa si risolve alla fine. */
  anima(durata, f, { ritardo = 0 } = {}) {
    if (RIDOTTO.matches) { durata = 1; ritardo = 0 }
    return new Promise((fine) => { this.tween.push({ f, durata, t: -ritardo, fine }); this.sporco = true })
  }
  /** Porta la tessera alla posa `a`, con un arco alto `arco` px. */
  muovi(t, a, { durata = 320, arco = 0, ritardo = 0, curva = dolce } = {}) {
    let da = null, verso = null
    return this.anima(durata, (u) => {
      if (!da) { da = { ...t.posa }; verso = { ...da, ...a } } // la posa di partenza quando parte davvero
      const e = curva(u), p = t.posa
      for (const n of CAMPI) p[n] = da[n] + (verso[n] - da[n]) * e
      p.giro = da.giro + angolo(da.giro, verso.giro) * e
      p.alto += arco * Math.sin(Math.PI * u)
      t.applica()
    }, { ritardo })
  }

  /** Gira una tessera e mostra la faccia. */
  gira(i, tipo, { spenta = false, ritardo = 0, durata = 320 } = {}) {
    const t = this.tessere[i]
    if (!t.viva) return Promise.resolve()
    t.verso = 0
    t.mostra(tipo, spenta)
    return this.muovi(t, { su: 1 }, { durata, ritardo, arco: this.lato * (spenta ? 0.2 : 0.4) })
  }

  /** La gemma che salta fuori dalla tessera i (già girata) e ci si posa, girando su sé stessa. */
  gemma(i) {
    const t = this.tessere[i]
    const radice = new THREE.Group()
    radice.rotation.z = Math.PI // la faccia sta sotto la tessera, che è girata
    radice.position.y = -(T / 2 + 0.025)
    const mesh = new THREE.Mesh(this.geoGemma, this.matGemma)
    mesh.castShadow = true
    mesh.scale.setScalar(0.0001)
    radice.add(mesh)
    t.mesh.add(radice)
    this.gemme.set(i, radice)
    const g0 = Math.random() * Math.PI
    return this.anima(620, (u) => {
      mesh.scale.setScalar(Math.max(0.0001, GEMMA * fuori(Math.min(1, u * 1.6))))
      mesh.position.y = 0.55 * Math.sin(Math.PI * u) ** 2 * (1 - u * 0.4)
      mesh.rotation.y = g0 + (1 - facile(u)) * Math.PI * 2.5
      this.sporco = true
    })
  }

  // ── la bomba: una sfera nera laccata col collare di ferro e la miccia di corda, inclinata verso l'alto a destra
  // come quella del volantino; la scintilla è una macchia di luce che sta sempre sulla punta della miccia
  costruisciBomba() {
    const g = (this.bomba = new THREE.Group())
    const corpo = new THREE.Group()
    const nero = new THREE.MeshPhysicalMaterial({ color: 0x151517, roughness: 0.3, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05 })
    const ferro = new THREE.MeshStandardMaterial({ color: 0x2c2c2e, roughness: 0.35, metalness: 0.75 })
    const corda = new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.9 })
    const sfera = new THREE.Mesh(new THREE.SphereGeometry(0.3, 40, 24), nero)
    const collare = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.105, 0.1, 24), ferro)
    collare.position.y = 0.3
    const arco = Math.PI * 0.7
    const miccia = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.024, 6, 16, arco), corda)
    miccia.position.set(-0.11, 0.35, 0)
    this.punta = new THREE.Object3D()
    this.punta.position.set(-0.11 + 0.11 * Math.cos(arco), 0.35 + 0.11 * Math.sin(arco), 0)
    for (const m of [sfera, collare, miccia]) { m.castShadow = true; corpo.add(m) }
    corpo.add(this.punta)
    corpo.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0.55, 0.6, -0.55).normalize())
    g.add(corpo)
    g.visible = false
    this.scena.add(g)
    const piano = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2) // un foglio orizzontale: dall'alto si vede sempre di faccia
    this.scintilla = new THREE.Mesh(piano, new THREE.MeshBasicMaterial({ map: this.tex(scintilla()), transparent: true, depthWrite: false, blending: ADDITIVA, toneMapped: false }))
    this.scintilla.visible = false
    this.scena.add(this.scintilla)
    this.accesa = false
  }

  costruisciEffetti() {
    const piano = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2)
    this.lampo = new THREE.Mesh(piano, new THREE.MeshBasicMaterial({ map: this.tex(lampo()), transparent: true, depthWrite: false, blending: ADDITIVA, toneMapped: false }))
    this.lampo.visible = false
    this.scena.add(this.lampo)
    this.fumi = [1, 2, 3, 4, 5, 6, 7].map((k) => {
      const m = new THREE.Mesh(piano, new THREE.MeshBasicMaterial({ map: this.tex(fumo(k)), color: 0x5e554b, transparent: true, depthWrite: false, opacity: 0 }))
      m.visible = false
      m.renderOrder = 3
      this.scena.add(m)
      return m
    })
    // i pezzi della tessera: sopra la faccia (girata), sotto il dorso
    this.geoPezzo = new THREE.BoxGeometry(1, 1, 1)
    this.pezzi = []
  }

  /** La bomba esce dalla tessera i (già girata) e la miccia brucia: la promessa si risolve quando sta per scoppiare. */
  async innesca(i) {
    const t = this.tessere[i], l = this.lato
    const b = this.bomba, s = l * BOMBA
    b.position.set(t.posa.x - this.w / 2, l * T + 0.3 * s, t.posa.y - this.h / 2)
    b.rotation.set(0, Math.random() * 0.6 - 0.3, 0)
    b.scale.setScalar(0.0001)
    b.visible = true
    this.accesa = true
    await this.anima(300, (u) => { b.scale.setScalar(Math.max(0.0001, s * fuori(u))); this.sporco = true })
    // la miccia brucia: la bomba trema sempre di più
    await this.anima(RIDOTTO.matches ? 1 : 650, (u) => {
      const k = u * u * 0.06
      b.rotation.x = (Math.random() - 0.5) * k
      b.rotation.z = (Math.random() - 0.5) * k
      b.scale.setScalar(s * (1 + u * 0.08 + Math.sin(u * 40) * u * 0.02))
    })
  }

  /** Lo scoppio sulla casella i: il lampo, la luce, il fumo, i pezzi della tessera, le vicine che saltano. */
  esplodi(i) {
    const t = this.tessere[i], l = this.lato
    const cx = t.posa.x - this.w / 2, cz = t.posa.y - this.h / 2
    this.accesa = false
    this.scintilla.visible = false
    this.bomba.visible = false
    t.radice.visible = false
    this.sporco = true
    if (RIDOTTO.matches) return Promise.resolve()
    const fatte = []
    // il lampo e la stanza che si illumina
    this.lampo.position.set(cx, l * 1.4, cz)
    this.lampo.visible = true
    fatte.push(this.anima(420, (u) => { this.lampo.scale.setScalar(l * (0.8 + 4.6 * facile(u))); this.lampo.material.opacity = (1 - u) ** 1.5 }).then(() => { this.lampo.visible = false }))
    this.anima(600, (u) => {
      const k = (1 - u) ** 2
      this.sole.intensity = this.forzaSole * (1 + 2.5 * k)
      this.cielo.intensity = this.forzaCielo * (1 + 3 * k)
      this.renderer.toneMappingExposure = this.esposizione * (1 + 1.1 * k)
    })
    // il fumo: nuvole che si allargano, salgono (si avvicinano) e svaniscono
    this.fumi.forEach((m, k) => {
      const a = (k / this.fumi.length) * Math.PI * 2 + Math.random() * 0.6, d = l * (0.5 + Math.random() * 0.9), r0 = Math.random() * Math.PI
      m.visible = true
      this.anima(1500 + k * 120, (u) => {
        const e = facile(u)
        m.position.set(cx + Math.cos(a) * d * e, l * (0.4 + 1.6 * e) + k, cz + Math.sin(a) * d * e)
        m.scale.setScalar(l * (0.7 + 1.9 * e))
        m.rotation.y = r0 + u * 0.8
        m.material.opacity = Math.min(1, u * 8) * (1 - u) ** 1.2
      }, { ritardo: 40 + k * 25 }).then(() => { m.visible = false })
    })
    // i pezzi della tessera
    for (let k = 0; k < 11; k++) {
      const mesh = new THREE.Mesh(this.geoPezzo, [this.matFianco, this.matFianco, this.faccia('vuota'), this.matDorso, this.matFianco, this.matFianco])
      const sx = l * (0.1 + Math.random() * 0.2), sz = l * (0.08 + Math.random() * 0.18)
      mesh.scale.set(sx, l * T, sz)
      mesh.castShadow = true
      mesh.position.set(cx + (Math.random() - 0.5) * l * 0.4, l * T, cz + (Math.random() - 0.5) * l * 0.4)
      const a = Math.random() * Math.PI * 2, v = l * (3 + Math.random() * 6)
      this.scena.add(mesh)
      this.pezzi.push({ mesh, v: new THREE.Vector3(Math.cos(a) * v, l * (8 + Math.random() * 9), Math.sin(a) * v), w: new THREE.Vector3((Math.random() - 0.5) * 24, (Math.random() - 0.5) * 16, (Math.random() - 0.5) * 24), fermo: false })
    }
    // le vicine saltano: più vicine, più in alto; si spostano un poco e girano storte
    for (const u of this.tessere) {
      if (u === t || !u.viva) continue
      const dx = (u.posa.x - t.posa.x) / l, dy = (u.posa.y - t.posa.y) / l, d = Math.hypot(dx, dy)
      const k = Math.min(1, 1.3 / (d * d))
      if (k < 0.07) continue
      const H = l * 0.9 * k, spinta = l * 0.12 * k, giro = (Math.random() - 0.5) * 0.45 * k
      const da = { ...u.posa }, ix = (dy / d) * 0.7 * k, iz = (-dx / d) * 0.7 * k
      fatte.push(this.anima(300 + 300 * Math.sqrt(k), (e) => {
        const p = u.posa
        p.alto = da.alto + (e < 0.8 ? H * 4 * (e / 0.8) * (1 - e / 0.8) : H * 0.5 * 4 * ((e - 0.8) / 0.2) * (1 - (e - 0.8) / 0.2) * 0.25)
        p.x = da.x + (dx / d) * spinta * facile(e)
        p.y = da.y + (dy / d) * spinta * facile(e)
        p.giro = da.giro + giro * facile(e)
        p.ix = ix * Math.sin(Math.PI * Math.min(1, e / 0.8))
        p.iz = iz * Math.sin(Math.PI * Math.min(1, e / 0.8))
        u.applica()
      }, { ritardo: d * 20 }))
    }
    return Promise.all(fatte)
  }

  /** Gira le tessere `lista` ([{ i, tipo }]) a onda, partendo dalla casella `da`. */
  svela(lista, da) {
    const c = da != null ? this.tessere[da].casa : { x: 0, y: 0 }
    return Promise.all(lista.map(({ i, tipo }) => {
      const d = Math.hypot(this.tessere[i].casa.x - c.x, this.tessere[i].casa.y - c.y) / this.lato
      return this.gira(i, tipo, { spenta: true, ritardo: 60 + d * 70, durata: 300 })
    }))
  }

  /** Un giro nuovo: via gemme, bomba e pezzi; le tessere tornano coperte a casa, quella scoppiata ricade dall'alto. */
  riordina() {
    const fatte = []
    for (const [, g] of this.gemme) {
      const m = g.children[0]
      fatte.push(this.anima(220, (u) => m.scale.setScalar(Math.max(0.0001, GEMMA * (1 - u)))).then(() => g.removeFromParent()))
    }
    this.gemme.clear()
    for (const p of this.pezzi.splice(0)) {
      const s0 = p.mesh.scale.clone()
      fatte.push(this.anima(240, (u) => p.mesh.scale.copy(s0).multiplyScalar(Math.max(0.0001, 1 - u))).then(() => p.mesh.removeFromParent()))
    }
    this.bomba.visible = this.scintilla.visible = this.accesa = false
    this.tessere.forEach((t, k) => {
      const ritardo = (k % 5) * 25 + Math.floor(k / 5) * 25
      if (!t.viva) {
        Object.assign(t.posa, { x: t.casa.x, y: t.casa.y, alto: this.lato * 3.5, giro: 0, su: 0, ix: 0, iz: 0 })
        t.mostra('vuota')
        t.applica()
        t.radice.visible = true
        fatte.push(this.muovi(t, { alto: 0 }, { durata: 620, ritardo: ritardo + 120, curva: rimbalza }))
      } else if (t.posa.su > 0 || t.posa.x !== t.casa.x || t.posa.y !== t.casa.y || t.posa.giro) {
        fatte.push(this.muovi(t, { x: t.casa.x, y: t.casa.y, alto: 0, giro: 0, su: 0, ix: 0, iz: 0 }, { durata: 340, ritardo, arco: t.posa.su > 0 ? this.lato * 0.3 : this.lato * 0.1 }).then(() => t.mostra('vuota')))
      }
    })
    return Promise.all(fatte)
  }

  /** La tessera sotto il puntatore (o col fuoco) si alza un poco: si sta per toccare. */
  solleva(i, su) { const t = this.tessere[i]; t.verso = su && t.viva ? this.lato * 0.09 : 0; this.sporco = true }

  // ── il giro dei fotogrammi ─────────────────────────────────────────────────
  passo(dt) {
    const k = dt * 1000 * this.veloce
    let vive = false
    for (const t of this.tessere) {
      if (Math.abs(t.alzo - t.verso) < 0.05) continue
      t.alzo += (t.verso - t.alzo) * Math.min(1, dt * 22)
      if (Math.abs(t.alzo - t.verso) < 0.05) t.alzo = t.verso
      t.applica()
      vive = true
    }
    if (this.tween.length) {
      const finite = []
      for (const a of this.tween) {
        a.t += k
        if (a.t < 0) continue
        const u = Math.min(1, a.t / a.durata)
        a.f(u)
        if (u >= 1) finite.push(a)
      }
      if (finite.length) { this.tween = this.tween.filter((a) => !finite.includes(a)); for (const a of finite) a.fine() }
      vive = true
    }
    // la scintilla sulla punta della miccia
    if (this.accesa) {
      const p = this.punta.getWorldPosition(new THREE.Vector3())
      this.scintilla.position.set(p.x, p.y + 2, p.z)
      this.scintilla.scale.setScalar(this.lato * (0.3 + Math.random() * 0.22))
      this.scintilla.rotation.y = Math.random() * Math.PI
      this.scintilla.visible = true
      vive = true
    }
    // i pezzi: volano, ricadono sul foglio o sulle tessere, rimbalzano poco e si fermano
    const s = dt * this.veloce
    for (const p of this.pezzi) {
      if (p.fermo) continue
      const m = p.mesh
      p.v.y -= G * s
      m.position.addScaledVector(p.v, s)
      m.rotation.x += p.w.x * s; m.rotation.y += p.w.y * s; m.rotation.z += p.w.z * s
      const mezzo = m.scale.y / 2
      let terra = 0
      for (const t of this.tessere) if (t.viva && Math.abs(m.position.x - t.radice.position.x) < this.lato / 2 && Math.abs(m.position.z - t.radice.position.z) < this.lato / 2) terra = Math.max(terra, t.radice.position.y + (this.lato * T) / 2)
      if (m.position.y - mezzo < terra && p.v.y < 0) {
        m.position.y = terra + mezzo
        p.v.y *= -0.28
        p.v.x *= 0.5; p.v.z *= 0.5
        p.w.multiplyScalar(0.45)
        if (Math.abs(p.v.y) < this.lato * 1.2) { p.fermo = true; m.rotation.x = 0; m.rotation.z = Math.random() < 0.3 ? Math.PI : 0 }
      }
      vive = true
    }
    return vive
  }

  disegna() { this.renderer.render(this.scena, this.camera); this.sporco = false }

  avvia() {
    if (this.raf) return
    let ultimo = performance.now()
    const ciclo = (t) => {
      this.raf = requestAnimationFrame(ciclo)
      const dt = Math.min(0.1, (t - ultimo) / 1000)
      ultimo = t
      const vive = this.passo(dt)
      if (vive || this.sporco) this.disegna()
    }
    this.raf = requestAnimationFrame(ciclo)
  }
  ferma() { cancelAnimationFrame(this.raf); this.raf = 0 }
}
