// La scena 3D del blackjack di pzkko.it (three.js, lo stesso motore della
// roulette): le carte vere, lucide, col loro spessore e gli angoli tondi, il
// sabot di acrilico fumé e la vaschetta degli scarti. Il tavolo invece è il
// foglio stampato (SVG, in blackjack.js): la telecamera guarda dall'alto e il
// piano y = 0 cade esattamente sul foglio, un'unità = un px del campo, così le
// carte stanno dove il tavolo le aspetta e fanno ombra sulla carta. Quando una
// carta si alza (volo, giro, sbirciata) la prospettiva la avvicina un poco.

import * as THREE from '../roulette/lib/three.js'
import { faccia, dorso, costa } from './carte.js'

const L = 88 / 63 // la carta: larga 1, lunga L
const T = 0.006 // lo spessore (un filo più del vero, per vederne il fianco quando gira)
const CURVA = 0.012 // i lati lunghi si alzano appena: la luce scivola sulla carta
const R = 0.055 // il raggio degli angoli
const RIDOTTO = matchMedia('(prefers-reduced-motion: reduce)')

// la carta: faccia (gruppo 0), dorso (1), fianco (2); larga 1, centrata, la faccia verso +y
function geometriaCarta() {
  const xs = []
  for (let k = 0; k <= 6; k++) xs.push(-0.5 + R - R * Math.cos((k / 6) * Math.PI / 2))
  for (let k = 1; k < 10; k++) xs.push(-0.5 + R + ((1 - 2 * R) * k) / 10)
  for (let k = 6; k >= 0; k--) xs.push(0.5 - R + R * Math.cos((k / 6) * Math.PI / 2))
  const zmax = (x) => { const d = Math.max(0, Math.abs(x) - (0.5 - R)); return L / 2 - R + Math.sqrt(Math.max(0, R * R - d * d)) }
  const yb = (x) => CURVA * (2 * x) ** 2
  const n = xs.length
  const piano = (su) => {
    const pos = [], uv = [], idx = []
    for (const x of xs) for (const s of [-1, 1]) {
      const z = s * zmax(x)
      pos.push(x, yb(x) + (su ? T / 2 : -T / 2), z)
      uv.push(su ? x + 0.5 : 0.5 - x, 1 - (z / L + 0.5))
    }
    for (let i = 0; i < n - 1; i++) { const a = 2 * i, b = a + 1, c = a + 2, d = a + 3; idx.push(a, b, c, b, d, c) }
    return verso(fai(pos, uv, idx), (nx, ny) => (su ? ny : -ny))
  }
  // il fianco: il contorno, da sinistra a destra in alto e da destra a sinistra in basso
  const giro = [...xs.map((x) => [x, -zmax(x)]), ...[...xs].reverse().map((x) => [x, zmax(x)])]
  const pos = [], uv = [], idx = []
  giro.forEach(([x, z], i) => { pos.push(x, yb(x) + T / 2, z, x, yb(x) - T / 2, z); uv.push(i / giro.length, 0, i / giro.length, 1) })
  for (let i = 0; i < giro.length; i++) { const a = 2 * i, b = a + 1, c = (2 * (i + 1)) % (2 * giro.length), d = c + 1; idx.push(a, b, c, b, d, c) }
  const fianco = verso(fai(pos, uv, idx), (nx, ny, nz, px, py, pz) => nx * px + nz * pz)
  return THREE.mergeGeometries([piano(true), piano(false), fianco], true)
}
function fai(pos, uv, idx) {
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}
// se le normali guardano dalla parte sbagliata, si gira il verso dei triangoli
function verso(g, fuori) {
  const n = g.getAttribute('normal'), p = g.getAttribute('position')
  let s = 0
  for (let i = 0; i < n.count; i++) s += fuori(n.getX(i), n.getY(i), n.getZ(i), p.getX(i), p.getY(i), p.getZ(i))
  if (s < 0) { const ix = g.getIndex().array; for (let i = 0; i < ix.length; i += 3) { const k = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = k } g.computeVertexNormals() }
  return g
}

const facile = (t) => 1 - (1 - t) ** 3
const dolce = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
const angolo = (a, b) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d }

/** Una carta sul tavolo: la posa è { x, y (px del campo), alto (px sopra il foglio), giro (rad, orario), su (0 coperta … 1 scoperta), sbircia (rad) }. */
class Carta3D {
  constructor(scena, carta) {
    this.scena = scena
    this.carta = carta
    this.radice = new THREE.Group()
    this.perno = new THREE.Group()
    this.mesh = new THREE.Mesh(scena.geo, [scena.materialeFaccia(carta), scena.matDorso, scena.matFianco])
    this.mesh.castShadow = true
    this.mesh.receiveShadow = true
    this.perno.add(this.mesh)
    this.radice.add(this.perno)
    scena.scena.add(this.radice)
    this.posa = { x: 0, y: 0, alto: 0, giro: 0, su: 0, sbircia: 0, strato: 0 }
  }
  scopri(carta) { this.carta = carta; this.mesh.material[0] = this.scena.materialeFaccia(carta) }
  applica() {
    const s = this.scena, p = this.posa, cw = s.cw
    this.mesh.scale.setScalar(cw)
    const ribalta = Math.PI * (1 - p.su) - p.sbircia
    // girando sul lato lungo la carta si alza di mezza larghezza, per non entrare nel foglio
    const su = Math.abs(Math.sin(ribalta)) * cw * 0.5 + cw * (T / 2 + CURVA * 1.1)
    this.radice.position.set(p.x - s.w / 2, p.alto + su + p.strato * cw * (T + CURVA * 0.9) * 1.1, p.y - s.h / 2)
    this.radice.rotation.y = -p.giro
    this.perno.rotation.z = ribalta
  }
  via() { this.scena.scena.remove(this.radice); this.scena.carte.delete(this) }
}

export class Scena {
  constructor(canvas) {
    this.canvas = canvas
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.NeutralToneMapping
    this.renderer.toneMappingExposure = 1.18
    this.renderer.shadowMap.enabled = true
    this.scena = new THREE.Scene()
    this.scena.environment = this.ambiente()
    this.scena.environmentIntensity = 0.9
    this.camera = new THREE.PerspectiveCamera(24, 1, 10, 5000)
    this.carte = new Set()
    this.animazioni = []
    this.veloce = 1
    this.w = 1; this.h = 1; this.cw = 50
    this.geo = geometriaCarta()
    this.anis = Math.min(8, this.renderer.capabilities.getMaxAnisotropy())

    // la lampada sopra il tavolo (davanti, in alto a sinistra) e la luce della stanza
    this.sole = new THREE.DirectionalLight(0xffffff, 2.2)
    this.sole.castShadow = true
    this.sole.shadow.mapSize.set(2048, 2048)
    this.sole.shadow.bias = -0.0006
    this.sole.shadow.normalBias = 0.02
    this.sole.shadow.radius = 4
    this.scena.add(this.sole, this.sole.target)
    this.scena.add(new THREE.HemisphereLight(0xffffff, 0x8a8580, 1.1))
    // l'ombra sul foglio
    this.ombra = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShadowMaterial({ opacity: 0.34, color: 0x2a1c10 }))
    this.ombra.rotation.x = -Math.PI / 2
    this.ombra.receiveShadow = true
    this.scena.add(this.ombra)

    // i materiali delle carte: lucide (vernice trasparente sopra la carta telata)
    const tex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = this.anis; return t }
    this.tex = tex
    this.facce = new Map()
    this.matDorso = new THREE.MeshPhysicalMaterial({ map: tex(dorso()), roughness: 0.62, clearcoat: 1, clearcoatRoughness: 0.07 })
    this.matFianco = new THREE.MeshStandardMaterial({ color: 0xe2ddd2, roughness: 0.75 })
    // la costa di un mazzo: righe sottili lungo l'altezza (la pila degli scarti) o di traverso (il mazzo nel sabot, visto da sopra)
    const righe = (gira) => { const t = tex(costa()); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (gira) { t.center.set(0.5, 0.5); t.rotation = Math.PI / 2 } return t }
    this.matCosta = new THREE.MeshStandardMaterial({ map: righe(false), roughness: 0.8 })
    this.matCostaSabot = new THREE.MeshStandardMaterial({ map: righe(true), roughness: 0.8 })
    this.costruisciSabot()
    this.costruisciScarti()
  }

  materialeFaccia(carta) {
    if (!carta) return this.matDorso // coperta e non ancora vista: anche la faccia è un dorso (non si sbircia dal codice)
    const k = carta.r + carta.s
    if (!this.facce.has(k)) this.facce.set(k, new THREE.MeshPhysicalMaterial({ map: this.tex(faccia(carta.r, carta.s)), roughness: 0.62, clearcoat: 1, clearcoatRoughness: 0.07 }))
    return this.facce.get(k)
  }

  // la stanza che si specchia nella vernice delle carte: quasi buia sopra il tavolo (le carte ferme restano
  // nitide, il nero resta nero), le lampade di lato: le si vede passare quando la carta si inclina, gira, si sbircia
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
    // un velo morbido poco a sinistra della verticale: sulle carte curve fa una lucentezza che sfuma
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
    const pm = new THREE.PMREMGenerator(this.renderer)
    const t = pm.fromScene(st, 0.03).texture
    pm.dispose()
    return t
  }

  /** Le misure del campo (px), la larghezza delle carte e dove stanno il sabot e gli scarti. */
  misura(w, h, cw, posti) {
    this.w = w; this.h = h; this.cw = cw
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
    const lato = Math.max(w, h) * 0.75
    Object.assign(ombre, { left: -lato, right: lato, top: lato, bottom: -lato, near: dist * 0.2, far: dist * 2.4 })
    ombre.updateProjectionMatrix()
    this.ombra.scale.set(w * 1.2, h * 1.2, 1)
    if (posti) this.posti = posti
    this.sistemaSabot()
    this.sistemaScarti()
    for (const c of this.carte) c.applica()
    this.sporco = true
  }

  // ── il sabot: un cuneo di acrilico fumé (alto dietro, il coperchio che scende verso la bocca), dentro il
  // mazzo coricato che si accorcia, la carta di taglio gialla, il peso dietro; sulla faccia inclinata della bocca
  // si vede il dorso della prossima carta. Asse del sabot = x, la bocca verso -x.
  costruisciSabot() {
    const g = (this.sabot = new THREE.Group())
    const fume = new THREE.MeshPhysicalMaterial({ color: 0x241f22, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.04, transparent: true, opacity: 0.74, depthWrite: false })
    const nero = new THREE.MeshPhysicalMaterial({ color: 0x0f0e0f, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.08 })
    const fianco = new THREE.Shape()
    fianco.moveTo(1.3, 0); fianco.lineTo(1.3, 0.64); fianco.lineTo(-0.86, 0.36); fianco.lineTo(-1.16, 0.22); fianco.lineTo(-1.3, 0.07); fianco.lineTo(-1.3, 0); fianco.lineTo(1.3, 0)
    const corpo = new THREE.Mesh(new THREE.ExtrudeGeometry(fianco, { depth: 1.56, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 }), fume)
    corpo.position.z = -0.78
    corpo.castShadow = true
    corpo.renderOrder = 2
    g.add(corpo)
    const fondo = new THREE.Mesh(new THREE.BoxGeometry(2.64, 0.05, 1.64), nero)
    fondo.position.y = 0.025
    fondo.castShadow = true
    g.add(fondo)
    // la finestra della bocca: il dorso della prossima carta, sulla faccia inclinata
    const lung = Math.hypot(0.3, 0.14)
    this.prima = new THREE.Mesh(new THREE.PlaneGeometry(1.3, lung * 0.92), this.matDorso)
    this.prima.position.set(-1.01, 0.29 + 0.014, 0)
    this.prima.lookAt(new THREE.Vector3(-1.01 - 0.14, 0.304 + 0.3, 0)) // la normale della faccia inclinata
    g.add(this.prima)
    // il mazzo coricato: sopra le coste a righe, davanti il dorso
    this.mazzo = new THREE.Group()
    this.blocco = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), [this.matFianco, this.matDorso, this.matCostaSabot, this.matFianco, this.matCostaSabot, this.matCostaSabot])
    this.mazzo.add(this.blocco)
    this.taglio = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshPhysicalMaterial({ color: 0xf2c230, roughness: 0.25, clearcoat: 1 }))
    this.mazzo.add(this.taglio)
    this.peso = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 1.36), nero)
    this.mazzo.add(this.peso)
    g.add(this.mazzo)
    this.scena.add(g)
    this.quota = { rimaste: 1, taglio: null }
  }
  /** Quanto è pieno il sabot (0…1) e dove sta la carta di taglio (la frazione delle carte rimaste che le sta davanti; null se è uscita). */
  sabotPieno(rimaste, taglio = null) { this.quota = { rimaste, taglio }; this.sistemaSabot(); this.sporco = true }
  sistemaSabot() {
    const p = this.posti?.scarpa
    if (!p) return
    const k = this.cw * 0.95
    this.sabot.scale.setScalar(k)
    this.sabot.position.set(p.x - this.w / 2, 0, p.y - this.h / 2)
    this.sabot.rotation.y = -p.giro
    const r = this.quota.rimaste
    const lung = 0.02 + 1.92 * r, x0 = -0.84
    this.mazzo.visible = r > 0
    this.prima.visible = r > 0
    this.blocco.scale.set(lung, 0.28, L * 0.97)
    this.blocco.position.set(x0 + lung / 2, 0.05 + 0.14, 0)
    this.matCostaSabot.map.repeat.set(1, Math.max(1, lung * 30))
    this.peso.position.set(x0 + lung + 0.1, 0.05 + 0.15, 0)
    this.taglio.visible = r > 0 && this.quota.taglio != null && this.quota.taglio >= 0 && this.quota.taglio <= 1
    if (this.taglio.visible) {
      this.taglio.scale.set(0.016, 0.33, L * 0.97 + 0.06)
      this.taglio.position.set(x0 + 0.02 + (lung - 0.04) * this.quota.taglio, 0.05 + 0.165, 0)
    }
  }
  /** Dove esce una carta dal sabot (la bocca), in px del campo. */
  bocca() {
    const p = this.posti.scarpa, k = this.cw * 0.95
    // la carta nel sabot ha il lato lungo di traverso, come il sabot è largo: esce col suo stesso giro
    return { x: p.x - Math.cos(p.giro) * 0.95 * k, y: p.y - Math.sin(p.giro) * 0.95 * k, giro: p.giro, alto: 0.3 * k }
  }

  // ── la vaschetta degli scarti: acrilico trasparente, la pila coperta che cresce
  costruisciScarti() {
    const g = (this.vasca = new THREE.Group())
    const vetro = new THREE.MeshPhysicalMaterial({ color: 0xd8e4ea, roughness: 0.08, clearcoat: 1, transparent: true, opacity: 0.32 })
    const parete = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), vetro); m.position.set(x, y, z); g.add(m) }
    parete(1.22, 0.04, L + 0.22, 0, 0.02, 0)
    parete(0.04, 0.5, L + 0.22, -0.61, 0.25, 0)
    parete(1.22, 0.5, 0.04, 0, 0.25, -(L + 0.22) / 2)
    this.pila = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), [this.matCosta, this.matCosta, this.matDorso, this.matFianco, this.matCosta, this.matCosta])
    this.pila.castShadow = true
    this.pila.receiveShadow = true
    g.add(this.pila)
    this.scena.add(g)
    this.scartate = 0
  }
  scarti(n) { this.scartate = n; this.sistemaScarti(); this.sporco = true }
  sistemaScarti() {
    const p = this.posti?.scarti
    if (!p) return
    this.vasca.scale.setScalar(this.cw)
    this.vasca.position.set(p.x - this.w / 2, 0, p.y - this.h / 2)
    this.vasca.rotation.y = -p.giro
    const alto = Math.max(0.0001, this.scartate * T * 0.55)
    this.matCosta.map.repeat.set(1, Math.max(1, this.scartate / 4))
    this.pila.visible = this.scartate > 0
    this.pila.scale.set(1, alto, L)
    this.pila.position.set(0.02, 0.04 + alto / 2, 0)
  }
  /** La posa di una carta appena posata sulla pila degli scarti. */
  sopraScarti() {
    const p = this.posti.scarti
    return { x: p.x, y: p.y, giro: p.giro, alto: (0.04 + this.scartate * T * 0.55) * this.cw, su: 0, sbircia: 0, strato: 0 }
  }

  // ── le carte
  nuova(carta) {
    const c = new Carta3D(this, carta)
    const b = this.bocca()
    Object.assign(c.posa, { x: b.x, y: b.y, alto: b.alto, giro: b.giro, su: 0, sbircia: 0, strato: 0 })
    c.applica()
    this.carte.add(c)
    this.sporco = true
    return c
  }

  /** Porta la carta alla posa `a` in `durata` ms, con un arco alto `arco` px. */
  muovi(c, a, { durata = 420, arco = 0, ritardo = 0, curva = dolce } = {}) {
    if (RIDOTTO.matches) { durata = 1; ritardo = 0 }
    return new Promise((fine) => {
      // la posa di partenza si prende quando l'animazione comincia davvero (dopo il ritardo)
      this.animazioni.push({ c, a, da: null, verso: null, durata, arco, t: -ritardo, curva, fine })
      this.sporco = true
    })
  }
  /** Per un attimo (o per sempre) niente animazioni: le carte vanno subito a posto. */
  subito() { for (const a of this.animazioni) a.t = a.durata }

  passo(dt) {
    const k = dt * 1000 * this.veloce
    const finite = []
    let mosse = false
    for (const a of this.animazioni) {
      a.t += k
      if (a.t < 0) continue
      if (!a.da) { a.da = { ...a.c.posa }; a.verso = { ...a.da, ...a.a } }
      const u = Math.min(1, a.t / a.durata), e = a.curva(u)
      const p = a.c.posa
      for (const n of ['x', 'y', 'alto', 'su', 'sbircia', 'strato']) p[n] = a.da[n] + (a.verso[n] - a.da[n]) * e
      p.giro = a.da.giro + angolo(a.da.giro, a.verso.giro) * e
      p.alto += a.arco * Math.sin(Math.PI * u)
      a.c.applica()
      mosse = true
      if (u >= 1) finite.push(a)
    }
    if (finite.length) {
      this.animazioni = this.animazioni.filter((a) => !finite.includes(a))
      for (const a of finite) a.fine()
    }
    return mosse // anche l'ultimo passo di un'animazione va disegnato
  }

  disegna() { this.renderer.render(this.scena, this.camera); this.sporco = false }

  avvia() {
    if (this.raf) return
    let ultimo = performance.now()
    const ciclo = (t) => {
      this.raf = requestAnimationFrame(ciclo)
      const dt = Math.min(0.1, (t - ultimo) / 1000) // sui computer lenti le carte non vanno al rallentatore
      ultimo = t
      const vive = this.passo(dt)
      if (vive || this.sporco) this.disegna()
    }
    this.raf = requestAnimationFrame(ciclo)
  }
  ferma() { cancelAnimationFrame(this.raf); this.raf = 0 } // le animazioni restano a metà: riprendono con avvia()
}
export { facile, dolce }
