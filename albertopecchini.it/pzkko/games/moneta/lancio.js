// La moneta di pzkko.it: la forma (la moneta e il piatto di legno dove cade) e
// la sua fisica, con Rapier (lo stesso motore della pallina della roulette, in
// WebAssembly). Lo usa la finestra del gioco (moneta.js, che ci disegna sopra la
// moneta e il piatto in 3D con three.js) e lo usano le prove senza browser
// (tools/pzkko/moneta/prova.mjs): la moneta che si vede e quella che si simula
// sono la stessa. Niente sorteggi: testa o croce lo decide come cade.
//
// Unità: metri, chilogrammi, secondi; y in alto. La moneta ha la testa sulla
// faccia +y e la croce sulla −y (nel suo sistema). Il piatto è centrato
// nell'origine, il foglio (il tavolo) è y = 0.

const TAU = 2 * Math.PI

// una moneta d'ottone grande, da 32 mm (come una medaglia): 2,6 mm di spessore, 12 g
export const MONETA = { r: 0.016, h: 0.0026, massa: 0.012, smusso: 0.0005 }

// Il piatto: un vassoio tondo di legno laccato, 25 cm, dal bordo esterno verso il
// centro (r, y): il fianco, il labbro arrotondato, la parete che scende con un
// raccordo largo (la moneta che rotola ci sale un poco e torna giù) e il fondo piatto.
const arco = (cr, cy, R, a0, a1, n) => Array.from({ length: n + 1 }, (_, i) => {
  const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180
  return [cr + R * Math.cos(a), cy + R * Math.sin(a)]
})
export const FONDO = { r: 0.100, y: 0.007 } // il fondo: raggio e altezza sul foglio
export const BORDO = 0.125 // il raggio esterno
export const PIATTO = [
  [0.124, 0.000], [0.125, 0.003],
  ...arco(0.1215, 0.025, 0.0035, 0, 180, 12), // il labbro, in cima
  ...arco(0.100, 0.025, 0.018, 0, -90, 20).slice(1), // la parete: un quarto di cerchio fino al fondo
  [0.070, 0.007], [0.035, 0.007], [0.000, 0.007],
]

/** Superficie di rivoluzione del profilo [[r, y]…] in `seg` spicchi: vertici e triangoli rivolti verso l'alto e il centro. */
export function rivoluzione(profilo, seg) {
  const nv = profilo.length
  const v = new Float32Array(nv * seg * 3)
  const idx = new Uint32Array((nv - 1) * seg * 6)
  for (let s = 0; s < seg; s++) {
    const t = (s / seg) * TAU, c = Math.cos(t), sn = Math.sin(t)
    for (let i = 0; i < nv; i++) {
      const [r, y] = profilo[i], o = (s * nv + i) * 3
      v[o] = r * c; v[o + 1] = y; v[o + 2] = -r * sn
    }
  }
  let k = 0
  for (let s = 0; s < seg; s++) {
    const s2 = (s + 1) % seg
    for (let i = 0; i < nv - 1; i++) {
      const a = s * nv + i, b = s * nv + i + 1, c2 = s2 * nv + i, d = s2 * nv + i + 1
      idx[k++] = a; idx[k++] = c2; idx[k++] = b
      idx[k++] = b; idx[k++] = c2; idx[k++] = d
    }
  }
  return { v, idx }
}

export const FISICA = {
  dt: 1 / 600, // passo fisso (10 per fotogramma a 60 Hz): la moneta è sottile e gira in fretta
  g: 9.81,
  // ottone su legno laccato: rimbalza un po' e scivola poco
  attrito: 0.32,
  rimbalzo: { moneta: 0.55, piatto: 0.5 },
  // il lancio: il pollice la tira su (m/s) facendola girare attorno a un asse orizzontale (giri al secondo),
  // con un filo di rotazione attorno al suo asse (rad/s) che la fa ondeggiare; cade vicino al centro
  lancio: { su: [1.7, 2.2], giri: [6, 11], trottola: 12, mira: 0.03, alto: 0.04, presa: 0.35 },
  // sul piatto: il rotolamento e lo strisciare la frenano (smorzamento, 1/s, solo quando tocca)
  frena: { v: 0.9, w: 0.5 },
  ferma: { v: 0.004, w: 0.25, t: 0.3 }, // ferma: velocità e rotazione sotto queste soglie per tanto
  piatta: 0.94, // |cos| dell'inclinazione: sotto, la moneta non è piatta (appoggiata al bordo): non vale
  attesa: 20, // dopo tanti secondi senza fermarsi il lancio non vale
}

const casuale = (a, b, rnd) => a + (b - a) * rnd()

/**
 * La moneta viva. `RAPIER` è il modulo già inizializzato; `rnd` una funzione che
 * restituisce numeri in [0, 1) (Math.random di solito; seminata nelle prove).
 * Stati: 'ferma' (sul fondo del piatto), 'presa' (sale, come presa dal pollice),
 * 'vola' (in aria, poi rimbalza, rotola, ondeggia) e 'nonvale' (non si è fermata
 * piatta: si rilancia).
 */
export class Moneta {
  constructor(RAPIER, { rnd = Math.random } = {}) {
    this.R = RAPIER
    this.rnd = rnd
    const w = (this.world = new RAPIER.World({ x: 0, y: -FISICA.g, z: 0 }))
    w.timestep = FISICA.dt
    w.integrationParameters.numSolverIterations = 8
    // (le tolleranze del motore restano quelle di serie, in metri, come nella roulette: provate in centimetri o in
    // millimetri, la moneta che ondeggia sul fondo ci affondava di 1–2 mm in un fotogramma su dieci invece di uno su
    // sessanta, e costava di più)

    // il piatto: il fondo è un blocco (contatti puliti per la moneta che ci ondeggia sopra), la parete una superficie di rivoluzione
    const fisso = w.createRigidBody(RAPIER.RigidBodyDesc.fixed())
    const { attrito, rimbalzo } = FISICA
    w.createCollider(RAPIER.ColliderDesc.cuboid(0.2, 0.01, 0.2).setTranslation(0, FONDO.y - 0.01, 0).setFriction(attrito).setRestitution(rimbalzo.piatto), fisso)
    const parete = rivoluzione(PIATTO.filter(([r]) => r >= FONDO.r - 1e-6), 256)
    w.createCollider(RAPIER.ColliderDesc.trimesh(parete.v, parete.idx, RAPIER.TriMeshFlags.FIX_INTERNAL_EDGES).setFriction(attrito).setRestitution(rimbalzo.piatto), fisso)
    // il vetro che non si vede: un cilindro sopra il labbro e un coperchio, la moneta non esce mai
    const vetro = rivoluzione([[0.119, 0.9], [0.119, 0.027]], 96)
    w.createCollider(RAPIER.ColliderDesc.trimesh(vetro.v, vetro.idx).setFriction(0.1).setRestitution(0.3), fisso)
    w.createCollider(RAPIER.ColliderDesc.cuboid(0.3, 0.01, 0.3).setTranslation(0, 0.91, 0), fisso)

    // la moneta: un cilindro con gli spigoli appena arrotondati
    const { r, h, massa, smusso } = MONETA
    const vol = Math.PI * r * r * h
    this.corpo = w.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0, FONDO.y + h / 2, 0).setCcdEnabled(true).setCanSleep(false))
    w.createCollider(RAPIER.ColliderDesc.roundCylinder(h / 2 - smusso, r - smusso, smusso).setDensity(massa / vol).setFriction(attrito).setRestitution(rimbalzo.moneta), this.corpo)

    this.t = 0
    this.stato = 'ferma'
    this.risultato = null
    this.ultimo = null
    this.urti = [] // i colpi forti (m/s), per chi li vuole sentire o vedere: si svuota da fuori
    this.metti(this.rnd() < 0.5 ? 'testa' : 'croce', 0, 0)
  }

  /** La moneta ferma e piatta sul fondo, nel punto (x, z), con la faccia `faccia` in su. */
  metti(faccia, x = 0, z = 0, giro = this.rnd() * TAU) {
    const b = this.corpo
    b.setBodyType(this.R.RigidBodyType.Dynamic, true)
    b.setTranslation({ x, y: FONDO.y + MONETA.h / 2, z }, true)
    // la croce in su: mezzo giro attorno a x; e un giro qualunque attorno a y
    const qy = { x: 0, y: Math.sin(giro / 2), z: 0, w: Math.cos(giro / 2) }
    b.setRotation(faccia === 'croce' ? molt(qy, { x: 1, y: 0, z: 0, w: 0 }) : qy, true)
    b.setLinvel({ x: 0, y: 0, z: 0 }, true)
    b.setAngvel({ x: 0, y: 0, z: 0 }, true)
    this.stato = 'ferma'
    this.risultato = faccia
  }

  /** Quale faccia guarda in su (o null se non è piatta) e quanto (il coseno dell'inclinazione, con il segno). */
  su() {
    const q = this.corpo.rotation()
    return 1 - 2 * (q.x * q.x + q.z * q.z) // la componente y dell'asse della moneta
  }
  faccia() {
    const c = this.su()
    return c > FISICA.piatta ? 'testa' : c < -FISICA.piatta ? 'croce' : null
  }

  /**
   * Un lancio nuovo. La moneta sale dal fondo (stato 'presa', `presa` secondi) e a metà salita il pollice la gira
   * sottosopra, o no, a caso; poi la tira su facendola girare. Con `presa: 0` parte subito (le prove).
   *
   * Quel mezzo giro a caso è quello che rende giusta la moneta: la fisica da sola non lo è del tutto (nelle prove,
   * 10.000 lanci, usciva la faccia opposta a quella in su alla partenza il 52% delle volte; le monete vere hanno
   * una preferenza simile, per la stessa faccia, del 51%). Con la faccia di partenza metà e metà, e una moneta
   * uguale dalle due parti, testa e croce escono metà e metà qualunque sia quella preferenza, e un lancio non dice
   * niente del successivo.
   */
  lancia({ presa = FISICA.lancio.presa } = {}) {
    const L = FISICA.lancio, rnd = this.rnd
    const p = this.corpo.translation()
    // l'asse del giro: orizzontale, in una direzione qualunque; il verso del giro a caso; il mezzo giro del pollice
    const a = rnd() * TAU, verso = rnd() < 0.5 ? -1 : 1, gira = rnd() < 0.5
    const w = casuale(...L.giri, rnd) * TAU * verso
    const su = casuale(...L.su, rnd)
    // dove cade: vicino al centro (il tempo di volo fino al fondo)
    const y0 = FONDO.y + L.alto, tv = (su + Math.sqrt(su * su + 2 * FISICA.g * (y0 - FONDO.y - MONETA.r * 0.5))) / FISICA.g
    const ma = rnd() * TAU, mr = L.mira * Math.sqrt(rnd())
    this.colpo = {
      da: { x: p.x, y: p.y, z: p.z }, q0: this.corpo.rotation(), asse: a, gira,
      a: { x: p.x * 0.6, y: y0, z: p.z * 0.6 },
      v: { x: (mr * Math.cos(ma) - p.x * 0.6) / tv, y: su, z: (mr * Math.sin(ma) - p.z * 0.6) / tv },
      w: { x: w * Math.cos(a), y: casuale(-1, 1, rnd) * L.trottola, z: w * Math.sin(a) },
    }
    this.risultato = null
    this.ultimo = null
    this.t = 0
    this.tFerma = 0
    this.giri = 0
    this.rimbalzi = 0
    if (presa <= 0) return this.via()
    this.corpo.setBodyType(this.R.RigidBodyType.KinematicPositionBased, true)
    this.presa = { t: 0, durata: presa }
    this.stato = 'presa'
  }

  /** Il pollice la lascia andare: da qui in poi solo la fisica. */
  via() {
    const b = this.corpo, C = this.colpo
    b.setBodyType(this.R.RigidBodyType.Dynamic, true)
    b.setTranslation(C.a, true)
    b.setRotation(this.giro(1), true)
    this.partenza = this.faccia() // (per le prove: la faccia in su quando il pollice la lascia)
    // l'asse del giro è orizzontale nel mondo: la velocità angolare si dà nel mondo
    b.setLinvel(C.v, true)
    b.setAngvel(C.w, true)
    this.vPrima = { ...C.v }
    this.stato = 'vola'
    this.t = 0
  }

  /** L'orientamento durante la presa: `k` (0…1) del mezzo giro del pollice attorno all'asse del lancio, se si gira. */
  giro(k) {
    const C = this.colpo, t = C.gira ? (Math.PI * k) / 2 : 0
    return molt({ x: Math.cos(C.asse) * Math.sin(t), y: 0, z: Math.sin(C.asse) * Math.sin(t), w: Math.cos(t) }, C.q0)
  }

  /** Un passo fisso (FISICA.dt). Restituisce 'testa' o 'croce' quando la moneta si ferma, 'nonvale' se il lancio non vale. */
  passo() {
    const { dt } = FISICA
    const b = this.corpo
    this.t += dt

    if (this.stato === 'presa') {
      // sale dritta dal fondo all'altezza del lancio, e dalla metà della salita si gira sottosopra (se si gira)
      const P = this.presa, C = this.colpo
      P.t += dt
      const u = Math.min(1, P.t / P.durata), e = u * u * (3 - 2 * u)
      b.setNextKinematicTranslation({ x: C.da.x + (C.a.x - C.da.x) * e, y: C.da.y + (C.a.y - C.da.y) * e, z: C.da.z + (C.a.z - C.da.z) * e })
      const g = Math.min(1, Math.max(0, (u - 0.35) / 0.65))
      b.setNextKinematicRotation(this.giro(g * g * (3 - 2 * g)))
      this.world.step()
      if (u >= 1) this.via()
      return null
    }

    if (this.stato === 'vola') {
      // sul piatto il rotolamento e lo strisciare la frenano: lo smorzamento c'è solo quando tocca
      const tocca = this.tocca()
      b.setLinearDamping(tocca ? FISICA.frena.v : 0)
      b.setAngularDamping(tocca ? FISICA.frena.w : 0)
    }
    this.world.step()
    if (this.stato !== 'vola') return null

    const p = b.translation(), v = b.linvel(), w = b.angvel()
    // i colpi: un salto di velocità in un passo
    const dv = Math.hypot(v.x - this.vPrima.x, v.y - this.vPrima.y, v.z - this.vPrima.z)
    if (dv > 0.25) { this.urti.push({ forza: dv, x: p.x, z: p.z }); if (this.vPrima.y < -0.2 && v.y > this.vPrima.y + 0.2) this.rimbalzi++ }
    this.vPrima = { x: v.x, y: v.y, z: v.z }
    if (this.urti.length > 40) this.urti.splice(0, this.urti.length - 40)
    this.giri += Math.hypot(w.x, w.z) * dt / TAU

    // è uscita dal piatto (non deve succedere mai)
    if (!(p.y > FONDO.y - 0.003 && Math.hypot(p.x, p.z) < BORDO)) return this.nonVale('fuori')
    const ferma = Math.hypot(v.x, v.y, v.z) < FISICA.ferma.v && Math.hypot(w.x, w.y, w.z) < FISICA.ferma.w
    this.tFerma = ferma ? this.tFerma + dt : 0
    if (this.tFerma >= FISICA.ferma.t) {
      const f = this.faccia()
      if (!f) return this.nonVale('appoggiata')
      this.stato = 'ferma'
      return (this.risultato = f)
    }
    if (this.t > FISICA.attesa) return this.nonVale('lenta')
    return null
  }

  /** La moneta tocca il fondo? Il suo punto più basso, dall'inclinazione. */
  tocca() {
    const c = Math.abs(this.su()), s = Math.sqrt(Math.max(0, 1 - c * c))
    const basso = this.corpo.translation().y - (MONETA.r * s + (MONETA.h / 2) * c)
    return basso < FONDO.y + 0.0006
  }

  /** Il lancio non vale (la moneta è appoggiata al bordo, o non si ferma): resta dov'è, ma si rilancia. */
  nonVale(perche) {
    this.ultimo = perche
    this.risultato = null
    this.stato = 'nonvale'
    return 'nonvale'
  }

  /** Posizione e orientamento della moneta, per chi disegna. */
  pose() {
    const p = this.corpo.translation(), q = this.corpo.rotation()
    return { p: { x: p.x, y: p.y, z: p.z }, q: { x: q.x, y: q.y, z: q.z, w: q.w } }
  }
}

// il prodotto di due quaternioni (a poi b, nel sistema di a)
function molt(a, b) {
  return {
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
  }
}
