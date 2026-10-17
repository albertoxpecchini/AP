// La ruota della roulette di pzkko.it: la forma (profili di rivoluzione, palette,
// rombi) e la sua fisica, con Rapier (il motore fisico, in WebAssembly). Lo usa
// la finestra del gioco (roulette.js, che ci disegna sopra la ruota in 3D con
// three.js) e lo usano le prove senza browser (tools/pzkko/roulette/prova.mjs):
// la ruota che si vede e quella che si simula sono la stessa.
//
// Unità: metri, chilogrammi, secondi; y in alto. Una ruota europea a 37 caselle,
// 80 cm di diametro, la pallina da 19 mm. Gli angoli: un punto a raggio r e
// angolo θ sta in (r cos θ, y, −r sin θ), così una rotazione di α attorno a +y
// porta θ in θ + α; visto dall'alto θ cresce in senso antiorario. Le caselle
// girano in senso orario, come sulle ruote vere: la casella i va da −(i+1)Δ a −iΔ.

export const NUMERI = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26]
export const ROSSI = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36])
export const colore = (n) => (n === 0 ? 'verde' : ROSSI.has(n) ? 'rosso' : 'nero')
export const N = 37
export const DELTA = (2 * Math.PI) / N
export const R_PALLINA = 0.0095
const TAU = 2 * Math.PI

// ── la forma ────────────────────────────────────────────────────────────────
// arco da a0 ad a1 (gradi) attorno a (cr, cy) di raggio R, in n passi
const arco = (cr, cy, R, a0, a1, n) => Array.from({ length: n + 1 }, (_, i) => {
  const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180
  return [cr + R * Math.cos(a), cy + R * Math.sin(a)]
})

// La scodella fissa (lo statore), dal bordo esterno verso il centro: il bordo di
// legno, il labbro che sporge, la pista sopraelevata (un arco largo: in alto quasi
// verticale (in cima sporge un po'), in basso inclinato di 20°, così la pallina veloce corre in alto e
// scende man mano che rallenta, toccando sempre in un punto solo), la pista che
// scende di 20° e il piano inclinato (28°) con i rombi, fino al bordo del rotore.
export const PISTA = { r: 0.344, y: 0.1285, R: 0.045 }
export const STATORE = [
  [0.4100, 0.1300], [0.4100, 0.1500], [0.4075, 0.1555], [0.4020, 0.1580], [0.3950, 0.1580],
  [0.3895, 0.1558], [0.3858, 0.1530],
  ...arco(PISTA.r, PISTA.y, PISTA.R, 30, -70, 56),
  [0.3450, 0.0810],
  [0.3360, 0.0762], [0.3250, 0.0704], [0.3140, 0.0645], [0.3060, 0.0603],
  [0.3040, 0.0592], [0.3022, 0.0582], [0.3018, 0.0560], [0.3018, 0.0420],
]
// l'altezza del piano inclinato a raggio r (per appoggiarci i rombi)
export const yPiano = (r) => 0.0810 - (0.3450 - r) * Math.tan((28 * Math.PI) / 180)

// Il rotore (gira): il bordo, l'anello dei numeri (15° verso l'interno), il
// labbro delle caselle, il fondo concavo, il bordo interno e il cono fino alla torretta.
export const ROTORE = [
  [0.3005, 0.0420], [0.3005, 0.0548], [0.2995, 0.0568],
  [0.2850, 0.0530], [0.2730, 0.0498],
  [0.2712, 0.0488], [0.2698, 0.0450], [0.2675, 0.0418], [0.2630, 0.0402],
  [0.2540, 0.0392], [0.2450, 0.0390], [0.2360, 0.0392], [0.2280, 0.0402],
  [0.2240, 0.0420], [0.2218, 0.0460], [0.2208, 0.0525], [0.2190, 0.0548],
  [0.2140, 0.0560], [0.1800, 0.0640], [0.1500, 0.0705], [0.1200, 0.0760],
  [0.0900, 0.0800], [0.0650, 0.0828], [0.0480, 0.0838], [0.0480, 0.0900],
]
// le palette fra le caselle: dal bordo interno al labbro esterno, alte fin sopra il fondo
export const PALETTA = { r0: 0.2214, r1: 0.2716, y0: 0.0386, y1: 0.0545, spessore: 0.0024 }
// i rombi sul piano inclinato: 8, alternati lungo il raggio e lungo il giro
export const ROMBI = Array.from({ length: 8 }, (_, k) => ({ theta: (k * TAU) / 8 + TAU / 16, radiale: k % 2 === 0, r: 0.3240, lungo: 0.036, largo: 0.0145, alto: 0.0085 }))
// la torretta al centro (solo per la fisica: un cilindro)
export const TORRETTA = { r: 0.048, y0: 0.083, y1: 0.16 }

/** Superficie di rivoluzione del profilo [[r, y]…] in `seg` spicchi: vertici e triangoli
 *  con la faccia rivolta verso l'alto e verso il centro (dove sta la pallina). */
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
      // il profilo va dall'esterno all'interno: (a, c, b) e (b, c, d) hanno la normale verso l'alto/centro
      idx[k++] = a; idx[k++] = c2; idx[k++] = b
      idx[k++] = b; idx[k++] = c2; idx[k++] = d
    }
  }
  return { v, idx }
}

/** I vertici di un rombo (diamante basso a punta) in coordinate del mondo. */
export function verticiRombo(rb) {
  const { theta, radiale, r, lungo, largo, alto } = rb
  // asse lungo: lungo il raggio o lungo il giro
  const ur = [Math.cos(theta), 0, -Math.sin(theta)], ut = [-Math.sin(theta), 0, -Math.cos(theta)]
  const [a, b] = radiale ? [ur, ut] : [ut, ur]
  const p = (da, db, h) => {
    const x = r * ur[0] + da * a[0] + db * b[0], z = r * ur[2] + da * a[2] + db * b[2]
    const rr = Math.hypot(x, z)
    return [x, yPiano(rr) + h, z]
  }
  const L = lungo / 2, W = largo / 2
  return [p(L, 0, -0.002), p(-L, 0, -0.002), p(0, W, -0.002), p(0, -W, -0.002), p(L * 0.45, 0, alto), p(-L * 0.45, 0, alto), p(0, W * 0.35, alto * 0.9), p(0, -W * 0.35, alto * 0.9)]
}

// ── la fisica ───────────────────────────────────────────────────────────────
// Gli spicchi delle superfici di rivoluzione (il rotore ne ha un numero intero per casella).
export const SPICCHI = { statore: 512, rotore: N * 16 }
export const FISICA = {
  dt: 1 / 480, // passo fisso (8 per fotogramma a 60 Hz)
  bordi: 'FIX_INTERNAL_EDGES', // niente urti fantasma sugli spigoli fra i triangoli
  unita: 1, // la scala di Rapier: con valori più piccoli (pallina da 1 cm) e FIX_INTERNAL_EDGES la correzione di posizione frena la pallina che corre
  // l'attrito di ogni superficie con la pallina (la regola è il minimo fra i due). Sulla pista quasi niente:
  // con l'attrito Rapier non riesce a far rotolare in tondo la pallina senza strisciare e la frena troppo;
  // la frenata vera (rotolamento e aria) la mettono le forze qui sotto. Nelle caselle l'attrito serve: la
  // pallina deve finire per girare insieme al rotore.
  previsione: 0.004, // distanza (m) entro cui Rapier prepara i contatti: con quella di serie (2 cm) la pallina
  // ne aveva migliaia sui triangoli vicini, costava 10 volte tanto e frenava
  attrito: { statore: 0.0, rombi: 0.05, rotore: 0.45, palette: 0.15 },
  g: 9.81,
  massa: 0.0055, // una pallina di resina da 19 mm
  rotolamento: 0.02, // resistenza al rotolamento (frazione di g) sulla superficie che tocca: ~10 s e ~10 giri sulla pista
  sponda: 3.0, // smorzamento (1/s) del moto di traverso sulla sponda: la pallina che rotola su e giù
  // per la pista cambia asse di rotazione e striscia un po', così le oscillazioni si spengono
  aria: 0.0135, // resistenza dell'aria: a = aria · v² (0,5 · ρ · Cd · A / m)
  rotore: { w0: [1.6, 2.6], tau: 140 }, // rad/s all'inizio del giro (largo: in 12 s il rotore fa da 19 a 31 radianti,
  // così dove si trova quando la pallina cade non dipende dal giro prima) e quanto ci mette a calare
  lancio: { v0: [3.8, 4.8], a: -45 }, // m/s della pallina al lancio, sulla pista, e dove (gradi sull'arco della sponda)
  ferma: { v: 0.03, t: 0.7 }, // ferma nella casella: velocità rispetto al rotore e per quanto
  attesa: 45, // dopo tanti secondi senza fermarsi una spinta leggera; dopo 70 il giro non vale
}

const casuale = (a, b, rnd) => a + (b - a) * rnd()
/** Distanza del punto (r, y) dalla spezzata del profilo. */
export function distanzaProfilo(profilo, r, y) {
  let min = Infinity
  for (let i = 0; i < profilo.length - 1; i++) {
    const [r0, y0] = profilo[i], [r1, y1] = profilo[i + 1]
    const dr = r1 - r0, dy = y1 - y0, l2 = dr * dr + dy * dy
    const t = l2 > 0 ? Math.max(0, Math.min(1, ((r - r0) * dr + (y - y0) * dy) / l2)) : 0
    const d = Math.hypot(r - r0 - t * dr, y - y0 - t * dy)
    if (d < min) min = d
  }
  return min
}
const normAng = (a) => ((a % TAU) + TAU) % TAU

// Rapier non lascia girare un corpo oltre 120π rad/s (60 giri al secondo): una
// pallina da 19 mm che rotola a più di 3,5 m/s andrebbe oltre e striscerebbe.
// Allora la simulazione va al rallentatore: nel mondo di Rapier tutto è TEMPO
// volte più lento (velocità / TEMPO, gravità / TEMPO², passo × TEMPO), che per
// la meccanica è la stessa cosa; fuori da questa classe tutto è in tempo vero.
export const TEMPO = 2.5

/**
 * La ruota viva. `RAPIER` è il modulo già inizializzato; `rnd` una funzione che
 * restituisce numeri in [0, 1) (Math.random di solito; seminata nelle prove).
 * Stati: 'ferma' (la pallina sta in una casella, il rotore gira), 'presa' (la
 * pallina salta fuori dalla casella e va sulla pista, come nelle ruote
 * automatiche che la soffiano con l'aria), 'gira' (corre, cade, rimbalza) e
 * 'nonvale' (non si è fermata o è uscita: si rifà).
 */
export class Ruota {
  constructor(RAPIER, { rnd = Math.random } = {}) {
    this.R = RAPIER
    this.rnd = rnd
    const A = TEMPO
    const w = (this.world = new RAPIER.World({ x: 0, y: -FISICA.g / (A * A), z: 0 }))
    w.timestep = FISICA.dt * A
    w.integrationParameters.numSolverIterations = 8
    w.integrationParameters.lengthUnit = FISICA.unita
    w.integrationParameters.normalizedPredictionDistance = FISICA.previsione
    const flag = FISICA.bordi ? RAPIER.TriMeshFlags[FISICA.bordi] : undefined

    // lo statore: fisso
    const fisso = w.createRigidBody(RAPIER.RigidBodyDesc.fixed())
    const st = rivoluzione(STATORE, SPICCHI.statore)
    w.createCollider(RAPIER.ColliderDesc.trimesh(st.v, st.idx, flag).setFriction(FISICA.attrito.statore).setRestitution(0.42), fisso)
    for (const rb of ROMBI) {
      const d = RAPIER.ColliderDesc.convexHull(new Float32Array(verticiRombo(rb).flat()))
      if (d) w.createCollider(d.setFriction(FISICA.attrito.rombi).setRestitution(0.62), fisso)
    }
    // il vetro che non si vede: un cilindro e un coperchio sopra il bordo, la pallina non esce mai
    const vetro = rivoluzione([[0.3990, 0.4], [0.3990, 0.158], [0.3880, 0.158]], 96)
    w.createCollider(RAPIER.ColliderDesc.trimesh(vetro.v, vetro.idx).setFriction(0.1).setRestitution(0.3), fisso)
    w.createCollider(RAPIER.ColliderDesc.cuboid(0.5, 0.01, 0.5).setTranslation(0, 0.41, 0), fisso)

    // il rotore: cinematico, gira a velocità imposta
    this.rotore = w.createRigidBody(RAPIER.RigidBodyDesc.kinematicVelocityBased())
    const ro = rivoluzione(ROTORE, SPICCHI.rotore)
    w.createCollider(RAPIER.ColliderDesc.trimesh(ro.v, ro.idx, flag).setFriction(FISICA.attrito.rotore).setRestitution(0.3), this.rotore)
    const { r0, r1, y0, y1, spessore } = PALETTA
    for (let i = 0; i < N; i++) {
      const t = -i * DELTA, rm = (r0 + r1) / 2
      const q = { x: 0, y: Math.sin(t / 2), z: 0, w: Math.cos(t / 2) } // rotazione di t attorno a y: l'asse x locale va lungo il raggio
      w.createCollider(
        RAPIER.ColliderDesc.roundCuboid((r1 - r0) / 2 - 0.0007, (y1 - y0) / 2 - 0.0007, spessore / 2 - 0.0007, 0.0007)
          .setTranslation(rm * Math.cos(t), (y0 + y1) / 2, -rm * Math.sin(t)).setRotation(q).setFriction(FISICA.attrito.palette).setRestitution(0.55),
        this.rotore,
      )
    }
    w.createCollider(RAPIER.ColliderDesc.cylinder((TORRETTA.y1 - TORRETTA.y0) / 2, TORRETTA.r).setTranslation(0, (TORRETTA.y0 + TORRETTA.y1) / 2, 0).setFriction(0.3).setRestitution(0.5), this.rotore)

    // la pallina
    const vol = (4 / 3) * Math.PI * R_PALLINA ** 3
    this.pallina = w.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0.245, 0.06, 0).setCcdEnabled(false).setAngularDamping(0.25 / A).setCanSleep(false))
    this.colPallina = w.createCollider(RAPIER.ColliderDesc.ball(R_PALLINA).setDensity(FISICA.massa / vol).setFriction(1).setFrictionCombineRule(RAPIER.CoefficientCombineRule.Min).setRestitution(0.5), this.pallina)

    this.w = 0 // velocità angolare del rotore (rad/s veri)
    this.angolo = 0 // angolo del rotore (letto da Rapier dopo ogni passo)
    this.t = 0
    this.tGiro = 0
    this.giri = 0
    this.ultimo = null
    this.risultato = null
    this.avvio(casuale(...FISICA.rotore.w0, rnd) * 0.7)
    // la pallina parte già in una casella a caso
    this.mettiInCasella(Math.floor(rnd() * N))
  }

  // ── le conversioni fra tempo vero e tempo di Rapier ──
  vel() { const v = this.pallina.linvel(); return { x: v.x * TEMPO, y: v.y * TEMPO, z: v.z * TEMPO } }
  setVel(v) { this.pallina.setLinvel({ x: v.x / TEMPO, y: v.y / TEMPO, z: v.z / TEMPO }, true) }
  setRot(w) { this.pallina.setAngvel({ x: w.x / TEMPO, y: w.y / TEMPO, z: w.z / TEMPO }, true) }
  impulso(j) { this.pallina.applyImpulse({ x: j.x / TEMPO, y: j.y / TEMPO, z: j.z / TEMPO }, true) }

  /** Il rotore gira da solo anche fra un giro e l'altro. */
  avvio(w) { this.w = w; this.rotore.setAngvel({ x: 0, y: w / TEMPO, z: 0 }, true) }

  /** La velocità della superficie del rotore nel punto (x, z): ω × r. */
  velSuperficie(x, z) { return { x: this.w * z, z: -this.w * x } }

  /** Posa la pallina ferma nella casella i (nel sistema del rotore di adesso). */
  mettiInCasella(i) {
    const t = this.angolo - (i + 0.5) * DELTA, r = 0.2455, y = 0.0390 + R_PALLINA + 0.0004
    const b = this.pallina
    b.setBodyType(this.R.RigidBodyType.Dynamic, true)
    const x = r * Math.cos(t), z = -r * Math.sin(t)
    b.setTranslation({ x, y, z }, true)
    const v = this.velSuperficie(x, z)
    this.setVel({ x: v.x, y: 0, z: v.z })
    this.setRot({ x: 0, y: 0, z: 0 })
    this.risultato = NUMERI[i]
    this.stato = 'ferma'
  }

  /** Dove sta la pallina rispetto al rotore: la casella sotto di lei. */
  casella() {
    const p = this.pallina.translation()
    const th = Math.atan2(-p.z, p.x) - this.angolo
    return Math.floor(normAng(-th) / DELTA) % N
  }

  /** Il punto di partenza sulla pista. */
  puntoLancio(theta) {
    // sulla sponda, all'altezza dove la pallina lanciata corre davvero (più in alto ricadrebbe giù perdendo velocità)
    const a = (FISICA.lancio.a * Math.PI) / 180, d = PISTA.R - R_PALLINA
    const r = PISTA.r + d * Math.cos(a), y = PISTA.y + d * Math.sin(a)
    return { x: r * Math.cos(theta), y, z: -r * Math.sin(theta), r, a }
  }

  /**
   * Un giro nuovo. Dalla casella la pallina salta sulla pista (stato 'presa',
   * `presa` secondi) e parte; con `presa: 0` parte subito (le prove).
   * `theta` è il punto della pista da cui parte (di solito davanti a chi guarda).
   */
  gira({ theta = -Math.PI / 2, presa = 0.9, v0, w0 } = {}) {
    const th = theta + casuale(-0.3, 0.3, this.rnd)
    this.lancio = { th, v0: v0 ?? casuale(...FISICA.lancio.v0, this.rnd), w0: w0 ?? casuale(...FISICA.rotore.w0, this.rnd) }
    this.risultato = null
    this.ultimo = null
    if (presa <= 0) return this.lancia()
    const b = this.pallina, p = b.translation()
    b.setBodyType(this.R.RigidBodyType.KinematicPositionBased, true)
    this.presa = { t: 0, durata: presa, da: { x: p.x, y: p.y, z: p.z }, a: this.puntoLancio(th) }
    this.stato = 'presa'
  }

  /** La pallina parte dalla pista: la spinta d'aria della ruota automatica. */
  lancia() {
    const { th, v0: v, w0 } = this.lancio
    this.avvio(w0)
    const p = this.puntoLancio(th)
    const b = this.pallina
    b.setBodyType(this.R.RigidBodyType.Dynamic, true)
    b.setTranslation({ x: p.x, y: p.y, z: p.z }, true)
    // la pallina corre in senso orario (θ che cala), il rotore in senso antiorario
    const vel = { x: v * Math.sin(th), y: casuale(-0.02, 0.02, this.rnd), z: v * Math.cos(th) }
    this.setVel(vel)
    // rotola già: ω = (v × d) / r, d = verso il punto di contatto (fuori e in basso, sulla sponda)
    const ca = Math.cos(p.a), sa = Math.sin(p.a)
    const d = { x: ca * Math.cos(th), y: sa, z: -ca * Math.sin(th) }
    this.setRot({ x: (vel.y * d.z - vel.z * d.y) / R_PALLINA, y: (vel.z * d.x - vel.x * d.z) / R_PALLINA, z: (vel.x * d.y - vel.y * d.x) / R_PALLINA })
    this.stato = 'gira'
    this.tGiro = 0
    this.tFerma = 0
    this.giri = 0
    this.spinta = false
    this.angPrec = Math.atan2(-p.z, p.x)
  }

  /** Un passo fisso (FISICA.dt di tempo vero). Restituisce il numero uscito quando la pallina si ferma, 'nonvale' se il giro non vale. */
  passo() {
    const { dt } = FISICA
    const b = this.pallina
    this.t += dt
    // il rotore rallenta piano
    this.w *= Math.exp(-dt / FISICA.rotore.tau)
    this.rotore.setAngvel({ x: 0, y: this.w / TEMPO, z: 0 }, true)

    if (this.stato === 'presa') {
      // salta fuori dalla casella (seguendo il rotore all'inizio) e atterra sulla pista
      const P = this.presa
      P.t += dt
      const u = Math.min(1, P.t / P.durata), e = u * u * (3 - 2 * u)
      // la partenza gira col rotore: il punto di partenza, ruotato dell'angolo fatto nel frattempo
      const da = Math.atan2(-P.da.z, P.da.x) + this.w * P.t * (1 - e), rd = Math.hypot(P.da.x, P.da.z)
      const x0 = rd * Math.cos(da), z0 = -rd * Math.sin(da)
      const x = x0 + (P.a.x - x0) * e, z = z0 + (P.a.z - z0) * e
      const y = P.da.y + (P.a.y - P.da.y) * e + Math.sin(Math.PI * u) * 0.05
      b.setNextKinematicTranslation({ x, y, z })
      this.world.step()
      this.leggiAngolo()
      if (u >= 1) this.lancia()
      return null
    }

    if (this.stato === 'gira' || this.stato === 'ferma') {
      const p = b.translation(), v = this.vel()
      const rr = Math.hypot(p.x, p.z)
      const sopraRotore = rr < 0.3012
      // la superficie sotto: ferma (statore) o che gira (rotore)
      const sx = sopraRotore ? this.w * p.z : 0, sz = sopraRotore ? -this.w * p.x : 0
      const rx = v.x - sx, ry = v.y, rz = v.z - sz
      const vr = Math.hypot(rx, ry, rz)
      const m = FISICA.massa
      if (vr > 1e-4) {
        // aria, rispetto al mondo
        const va = Math.hypot(v.x, v.y, v.z)
        const ka = FISICA.aria * va * m * dt
        let ix = -ka * v.x, iy = -ka * v.y, iz = -ka * v.z
        if (this.tocca(rr, p.y)) {
          // rotolamento, rispetto alla superficie
          const kr = Math.min(FISICA.rotolamento * FISICA.g * m * dt, vr * m * 0.5) / vr
          ix -= kr * rx; iy -= kr * ry; iz -= kr * rz
          // il moto di traverso (radiale e verticale, fuori dal giro) si smorza
          const tx = -p.z / rr, tz = p.x / rr
          const vt = rx * tx + rz * tz
          const ks = Math.min(FISICA.sponda * dt, 0.5) * m
          ix -= ks * (rx - vt * tx); iy -= ks * ry; iz -= ks * (rz - vt * tz)
        }
        this.impulso({ x: ix, y: iy, z: iz })
      }
    }

    this.world.step()
    this.leggiAngolo()

    let esito = null
    if (this.stato === 'gira') {
      this.tGiro += dt
      const p = b.translation(), v = this.vel()
      const rr = Math.hypot(p.x, p.z)
      // i giri fatti
      const a = Math.atan2(-p.z, p.x)
      let da = a - this.angPrec
      if (da > Math.PI) da -= TAU
      if (da < -Math.PI) da += TAU
      this.giri += -da / TAU
      this.angPrec = a
      // la pallina è uscita dalla ruota (non deve succedere mai)
      if (!(p.y > 0 && rr < 0.45)) return this.nonVale('fuori')
      // ferma in una casella: lenta rispetto al rotore, giù fra le palette
      const vr = Math.hypot(v.x - this.w * p.z, v.y, v.z + this.w * p.x)
      const dentro = rr > PALETTA.r0 && rr < PALETTA.r1 && p.y < PALETTA.y1 + 0.004
      if (dentro && vr < FISICA.ferma.v) this.tFerma += dt
      else this.tFerma = 0
      if (this.tFerma >= FISICA.ferma.t) {
        this.stato = 'ferma'
        esito = this.risultato = NUMERI[this.casella()]
      } else if (this.tGiro > FISICA.attesa && !this.spinta) {
        // ferma da troppo fuori da una casella (in bilico su una paletta o un rombo): una spinta leggera
        this.spinta = true
        this.impulso({ x: casuale(-1, 1, this.rnd) * 0.002, y: 0.003, z: casuale(-1, 1, this.rnd) * 0.002 })
      } else if (this.tGiro > FISICA.attesa + 25) return this.nonVale('lento')
    }
    return esito
  }

  /** L'angolo del rotore lo dice Rapier (il corpo che si muove davvero): niente deriva fra quello che si vede e le caselle. */
  leggiAngolo() { const q = this.rotore.rotation(); this.angolo = 2 * Math.atan2(q.y, q.w) }

  /** Il giro non vale (la pallina è uscita o non si ferma): torna in una casella a caso, si rifà. */
  nonVale(perche) {
    this.ultimo = perche
    this.mettiInCasella(Math.floor(this.rnd() * N))
    this.risultato = null
    this.stato = 'nonvale'
    return 'nonvale'
  }

  /** La pallina tocca la superficie (statore o rotore)? Distanza esatta dal profilo di rivoluzione. */
  tocca(rr, y) {
    const d = rr < 0.3012 ? distanzaProfilo(ROTORE, rr, y) : distanzaProfilo(STATORE, rr, y)
    return d < R_PALLINA + 0.0008
  }

  /** Posizione e orientamento della pallina, e angolo del rotore, per chi disegna. */
  pose() {
    const p = this.pallina.translation(), q = this.pallina.rotation()
    return { p: { x: p.x, y: p.y, z: p.z }, q: { x: q.x, y: q.y, z: q.z, w: q.w }, angolo: this.angolo }
  }
}
