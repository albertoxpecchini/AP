// La campana del sic bo di pzkko.it: il piatto col panno, la cupola di vetro e i
// tre dadi, con la loro fisica (Rapier, lo stesso motore della pallina della
// roulette). Come nelle macchine di Macao, la campana si scuote da sola: il
// piatto vibra su e giù, ondeggia e si inclina un poco, i dadi saltano,
// sbattono sul vetro e fra loro e si fermano dove si fermano; la faccia in alto
// è quella che esce. Se un dado resta storto (appoggiato al vetro o a un altro
// dado) il colpo non vale e la campana si riscuote, come al tavolo.
//
// Lo usa la finestra del gioco (dado.js, che ci disegna sopra la campana in 3D
// con three.js) e lo usano le prove senza browser (tools/pzkko/dado/prova.mjs):
// i dadi che si vedono e quelli che si simulano sono gli stessi.
//
// Unità: metri, chilogrammi, secondi; y in alto, il panno a y = 0.

export const LATO = 0.02 // il dado: 20 mm di lato, a spigoli tondi
export const SMUSSO = 0.0026 // il raggio degli spigoli
export const R_CAMPANA = 0.064 // il raggio interno della cupola, che poggia sul panno
// Il valore della faccia che guarda +x, −x, +y, −y, +z, −z (l'ordine dei gruppi di BoxGeometry):
// le facce opposte fanno 7 e 1, 2, 3 girano in senso antiorario attorno al loro spigolo, come nei dadi veri.
export const FACCE = [1, 6, 2, 5, 3, 4]
const ASSI = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]

export const FISICA = {
  dt: 1 / 480, // passo fisso (8 per fotogramma a 60 Hz)
  g: 9.81,
  massa: 0.0096, // un dado di cellulosa da 20 mm (~1,2 g/cm³)
  // con più attrito sul panno un dado che cade contro la parete ci resta appoggiato di sbieco (un colpo da rifare)
  attrito: { panno: 0.4, vetro: 0.06, dadi: 0.3 },
  rimbalzo: { panno: 0.3, vetro: 0.5, dadi: 0.45 },
  // la scossa: il piatto vibra in su e giù (f Hz, ampiezza a m), di lato un po' meno, e si inclina avanti e indietro
  // (inclina rad) attorno a un asse che gira; sale in `salita` s e si spegne in `discesa` s: piano, perché le ultime
  // scosse piccole fanno ricadere dritti i dadi in bilico. Più forte e più secca toglieva l'ultimo filo di memoria
  // fra un colpo e l'altro, ma faceva uscire meno il quattro (le prove, tools/pzkko/dado/prova.mjs)
  scossa: { f: [8.5, 10.5], a: [0.007, 0.009], lato: 0.45, inclina: 0.08, durata: [1.6, 2.2], salita: 0.12, discesa: 0.7 },
  ferma: { v: 0.004, w: 0.2, t: 0.35 }, // fermi: velocità (m/s, rad/s) e per quanto (s)
  dritto: Math.cos((4 * Math.PI) / 180), // la faccia in alto deve guardare in su entro 4°
  attesa: 8, // s dopo la scossa: se i dadi non si fermano, il colpo non vale
}

const casuale = (a, b, rnd) => a + (b - a) * rnd()
const liscia = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u))

// ── i quaternioni (niente three.js qui: le prove girano senza) ──
const qMul = (a, b) => ({
  w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
  x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
  y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
  z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
})
const qAsse = (x, y, z, ang) => { const s = Math.sin(ang / 2); return { x: x * s, y: y * s, z: z * s, w: Math.cos(ang / 2) } }
/** Il vettore v ruotato da q. */
export function ruota(q, [x, y, z]) {
  const tx = 2 * (q.y * z - q.z * y), ty = 2 * (q.z * x - q.x * z), tz = 2 * (q.x * y - q.y * x)
  return [x + q.w * tx + (q.y * tz - q.z * ty), y + q.w * ty + (q.z * tx - q.x * tz), z + q.w * tz + (q.x * ty - q.y * tx)]
}
/** La rotazione che porta il versore a sul versore b. */
function qDa(a, b) {
  const d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  if (d < -0.999999) { const p = Math.abs(a[0]) < 0.9 ? [1, 0, 0] : [0, 0, 1]; const c = [a[1] * p[2] - a[2] * p[1], a[2] * p[0] - a[0] * p[2], a[0] * p[1] - a[1] * p[0]]; const l = Math.hypot(...c); return qAsse(c[0] / l, c[1] / l, c[2] / l, Math.PI) }
  const c = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
  const q = { x: c[0], y: c[1], z: c[2], w: 1 + d }, l = Math.hypot(q.x, q.y, q.z, q.w)
  return { x: q.x / l, y: q.y / l, z: q.z / l, w: q.w / l }
}

/** La faccia in alto di un dado orientato da q, e quanto guarda in su (1 = dritta). */
export function facciaSu(q) {
  let best = -2, i0 = 0
  for (let i = 0; i < 6; i++) { const y = ruota(q, ASSI[i])[1]; if (y > best) { best = y; i0 = i } }
  return { valore: FACCE[i0], su: best }
}

// Il profilo del vetro, dal panno in su ([r, y]): una campana, la parete dritta (un dado appoggiato resta
// dritto) e sopra la cupola, un quarto d'ellisse fino al pomolo. Il vetro comincia un centimetro sotto il
// panno, dentro la base: sul bordo aperto della superficie i dadi che correvano contro la parete ci passavano.
export const PARETE = 0.024, CIMA = 0.068
export const PROFILO = [
  [R_CAMPANA, -0.01],
  ...Array.from({ length: 15 }, (_, k) => { const a = (k / 14) * (Math.PI / 2); return [k === 14 ? 0 : R_CAMPANA * Math.cos(a), PARETE + (CIMA - PARETE) * Math.sin(a)] }),
]

/** Il vetro: la superficie di rivoluzione del profilo, i triangoli con la faccia verso l'interno (dove stanno i dadi). */
export function vetro(profilo = PROFILO, seg = 48) {
  const v = [], idx = [], n = profilo.length
  for (const [r, y] of profilo) for (let s = 0; s < seg; s++) { const t = (s / seg) * Math.PI * 2; v.push(r * Math.cos(t), y, -r * Math.sin(t)) }
  for (let j = 0; j < n - 1; j++) for (let s = 0; s < seg; s++) {
    const a = j * seg + s, b = j * seg + ((s + 1) % seg), c = (j + 1) * seg + s, d = (j + 1) * seg + ((s + 1) % seg)
    // (a, b, c) avrebbe la normale verso fuori (θ cresce verso −z, l'anello dopo sta più in alto): si gira
    if (profilo[j + 1][0] > 1e-6) idx.push(a, c, b, b, c, d)
    else idx.push(a, c, b) // l'ultimo anello è il punto in cima
  }
  return { v: new Float32Array(v), idx: new Uint32Array(idx) }
}

/**
 * La campana viva. `RAPIER` è il modulo già inizializzato; `rnd` una funzione
 * che restituisce numeri in [0, 1) (Math.random di solito; seminata nelle prove).
 * Stati: 'ferma' (i dadi stanno sul panno), 'scuote' (la campana vibra), 'posa'
 * (la scossa è finita, i dadi rotolano ancora) e 'nonvale' (un dado è rimasto
 * storto o non si ferma: si riscuote).
 */
export class Campana {
  constructor(RAPIER, { rnd = Math.random } = {}) {
    this.R = RAPIER
    this.rnd = rnd
    const w = (this.world = new RAPIER.World({ x: 0, y: -FISICA.g, z: 0 }))
    w.timestep = FISICA.dt
    w.integrationParameters.numSolverIterations = 8
    w.integrationParameters.lengthUnit = 0.1 // gli oggetti sono di qualche centimetro: le tolleranze di Rapier in proporzione
    // (contatti più rigidi, contact_natural_frequency 60, facevano entrare il vetro nei dadi di quasi 7 mm)
    const flag = RAPIER.TriMeshFlags.FIX_INTERNAL_EDGES

    // il piatto e la cupola: un corpo solo, cinematico, che la macchina scuote
    this.piatto = w.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased())
    w.createCollider(RAPIER.ColliderDesc.cuboid(R_CAMPANA + 0.02, 0.01, R_CAMPANA + 0.02).setTranslation(0, -0.01, 0).setFriction(FISICA.attrito.panno).setRestitution(FISICA.rimbalzo.panno), this.piatto)
    const c = vetro()
    w.createCollider(RAPIER.ColliderDesc.trimesh(c.v, c.idx, flag).setFriction(FISICA.attrito.vetro).setRestitution(FISICA.rimbalzo.vetro), this.piatto)

    // i tre dadi
    const h = LATO / 2 - SMUSSO, vol = LATO ** 3
    this.dadi = Array.from({ length: 3 }, () => {
      const b = w.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setCcdEnabled(true).setCanSleep(false).setLinearDamping(0.05).setAngularDamping(0.08))
      w.createCollider(RAPIER.ColliderDesc.roundCuboid(h, h, h, SMUSSO).setDensity(FISICA.massa / vol).setFriction(FISICA.attrito.dadi).setRestitution(FISICA.rimbalzo.dadi), b)
      return b
    })
    this.t = 0
    this.stato = 'ferma'
    this.risultato = null
    this.ultimo = null
    this.metti()
  }

  /** Posa i dadi fermi sul panno, dritti, in tre punti a caso che non si toccano (`valori`: le facce in alto, se no a caso). */
  metti(valori) {
    const presi = []
    this.dadi.forEach((b, i) => {
      let x = 0, z = 0
      for (let k = 0; k < 200; k++) {
        const a = this.rnd() * Math.PI * 2, r = Math.sqrt(this.rnd()) * (R_CAMPANA - LATO * 0.95)
        x = r * Math.cos(a); z = r * Math.sin(a)
        if (presi.every((p) => Math.hypot(p.x - x, p.z - z) > LATO * 1.6)) break
      }
      presi.push({ x, z })
      const v = valori?.[i] ?? 1 + Math.floor(this.rnd() * 6)
      const q = qMul(qAsse(0, 1, 0, this.rnd() * Math.PI * 2), qDa(ASSI[FACCE.indexOf(v)], [0, 1, 0]))
      b.setTranslation({ x, y: LATO / 2 + 0.0002, z }, true)
      b.setRotation(q, true)
      b.setLinvel({ x: 0, y: 0, z: 0 }, true)
      b.setAngvel({ x: 0, y: 0, z: 0 }, true)
    })
    this.piatto.setTranslation({ x: 0, y: 0, z: 0 }, true)
    this.piatto.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true)
    this.risultato = this.leggi().valori
    this.stato = 'ferma'
  }

  /** Una scossa nuova: i suoi tempi e le sue fasi a caso. */
  scuoti({ durata } = {}) {
    const S = FISICA.scossa, r = this.rnd
    this.scossa = {
      t: 0,
      durata: durata ?? casuale(...S.durata, r),
      f: casuale(...S.f, r), a: casuale(...S.a, r),
      fx: casuale(0.55, 0.8, r), fz: casuale(0.45, 0.7, r), fi: casuale(0.35, 0.6, r), giro: casuale(0.8, 1.8, r) * (r() < 0.5 ? -1 : 1),
      p: Array.from({ length: 5 }, () => r() * Math.PI * 2),
    }
    this.risultato = null
    this.ultimo = null
    this.tPosa = 0
    this.tFerma = 0
    this.stato = 'scuote'
  }

  /** Dove sta il piatto al tempo t della scossa. */
  posaPiatto(S, t) {
    const inviluppo = liscia(t / FISICA.scossa.salita) * liscia((S.durata - t) / FISICA.scossa.discesa)
    const om = 2 * Math.PI * S.f, a = S.a * inviluppo, L = FISICA.scossa.lato
    const p = { x: a * L * Math.sin(om * S.fx * t + S.p[1]), y: a * Math.sin(om * t + S.p[0]), z: a * L * Math.sin(om * S.fz * t + S.p[2]) }
    // l'inclinazione, attorno a un asse orizzontale che gira piano
    const psi = S.p[3] + 2 * Math.PI * S.giro * t, ang = FISICA.scossa.inclina * inviluppo * Math.sin(om * S.fi * t + S.p[4])
    return { p, q: qAsse(Math.cos(psi), 0, Math.sin(psi), ang) }
  }

  /** Un passo fisso (FISICA.dt). Restituisce le tre facce quando i dadi si fermano, 'nonvale' se il colpo non vale, se no null. */
  passo() {
    if (this.stato === 'ferma' || this.stato === 'nonvale') return null
    const dt = FISICA.dt
    this.t += dt
    if (this.stato === 'scuote') {
      const S = this.scossa
      S.t += dt
      const { p, q } = this.posaPiatto(S, Math.min(S.t, S.durata))
      this.piatto.setNextKinematicTranslation(p)
      this.piatto.setNextKinematicRotation(q)
      if (S.t >= S.durata) this.stato = 'posa'
    } else {
      this.piatto.setNextKinematicTranslation({ x: 0, y: 0, z: 0 })
      this.piatto.setNextKinematicRotation({ x: 0, y: 0, z: 0, w: 1 })
    }
    this.world.step()
    if (this.stato !== 'posa') return null
    this.tPosa += dt
    // fermi?
    const { v, w, t } = FISICA.ferma
    const fermi = this.dadi.every((b) => { const l = b.linvel(), a = b.angvel(); return Math.hypot(l.x, l.y, l.z) < v && Math.hypot(a.x, a.y, a.z) < w })
    this.tFerma = fermi ? this.tFerma + dt : 0
    if (this.tFerma >= t) {
      const l = this.leggi()
      if (!l.dritti) return this.nonVale(l.perche)
      this.stato = 'ferma'
      this.risultato = l.valori
      return l.valori
    }
    if (this.tPosa > FISICA.attesa) return this.nonVale('lento')
    return null
  }

  /** Le facce in alto dei tre dadi, e se stanno tutti dritti sul panno, dentro la cupola. */
  leggi() {
    const valori = [], storti = []
    let perche = null
    this.dadi.forEach((b, i) => {
      const f = facciaSu(b.rotation()), p = b.translation()
      valori.push(f.valore)
      if (f.su < FISICA.dritto) { storti.push(i); perche ??= 'storto' }
      else if (p.y > LATO / 2 + 0.0015) { storti.push(i); perche ??= 'sopra' } // appoggiato su un altro dado
      if (Math.hypot(p.x, p.z) > R_CAMPANA || p.y < 0) { storti.push(i); perche = 'fuori' } // non deve succedere mai
    })
    return { valori, dritti: !storti.length, storti, perche }
  }

  /** Il colpo non vale: i dadi restano dove sono, si riscuote. */
  nonVale(perche) {
    this.ultimo = perche
    this.risultato = null
    this.stato = 'nonvale'
    return 'nonvale'
  }

  /** Il piatto e i dadi, per chi disegna. */
  pose() {
    const t = this.piatto.translation(), q = this.piatto.rotation()
    return {
      piatto: { p: { x: t.x, y: t.y, z: t.z }, q: { x: q.x, y: q.y, z: q.z, w: q.w } },
      dadi: this.dadi.map((b) => { const p = b.translation(), r = b.rotation(); return { p: { x: p.x, y: p.y, z: p.z }, q: { x: r.x, y: r.y, z: r.z, w: r.w } } }),
    }
  }
}
