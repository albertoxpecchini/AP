// Le bestie della saracinesca, in 3D (prima erano disegni piatti sopra la scena).
//
// - Le formiche vanno in fila alle gomme da masticare attaccate alla lamiera: una
//   fila esce da dietro la barra in fondo, l'altra dalla guida di destra. Seguono
//   la pista (un po' storta, ognuna col suo scarto), si fermano a toccarsi le
//   antenne quando si incrociano, mangiano e tornano indietro con la briciola
//   rosa in bocca, rientrano e ripartono. Se il puntatore ci passa sopra si
//   sparpagliano e poi ritrovano la pista.
// - Le mosche si posano sulla lamiera, sui fogli, sull'insegna e sul muro: stanno
//   ferme, si girano, fanno due passi, si strofinano le zampe davanti; volano a
//   tratti dritti con virate secche, ogni tanto una ne insegue un'altra, e si
//   posano altrove dentro la parte di strada che si vede. Scappano dal puntatore,
//   dai fari delle auto, dal foglio che si alza sotto di loro. Di notte dormono.
// - Le zanzare (tigri, nere a righe bianche) di giorno stanno in basso
//   all'ombra, ronzano piano a scatti, cercano il puntatore (cioè chi guarda) e
//   ogni tanto vengono a ronzare davanti alla telecamera; di sera vanno alle
//   luci, attorno alla lampada e all'insegna.
// - Le blatte escono di notte da sotto la saracinesca: girano sul marciapiede a
//   scatti, salgono sulla lamiera, si infilano sotto i fogli; con la luce dei fari
//   o col puntatore vicino corrono a nascondersi.
//
// Ogni specie è una mesh a istanze (una chiamata di disegno per tutte): il corpo
// fermo nella geometria, le zampe, le antenne e le ali le muove lo shader
// (vivo), che legge per ogni bestia la fase del passo (legata alla strada fatta:
// i piedi non scivolano), quanto cammina, se vola, il tempo; le ali trasparenti
// sono una mesh a parte. Sotto ognuna un'ombra morbida sulla superficie, che si
// allarga e sbiadisce quando si stacca. Niente mappe d'ombra (si dovrebbero
// rifare a ogni fotogramma). Con prefers-reduced-motion restano ferme dove sono.
import * as T from './lib/three.js'
import { Z_FACCIATA, tela, REGIA } from './materiali.js'

const TAU = Math.PI * 2
const caso = (a, b) => a + Math.random() * (b - a)
const angolo = (a) => Math.atan2(Math.sin(a), Math.cos(a)) // fra -π e π
const verso = (a, b, k) => a + angolo(b - a) * k // ruota a verso b

// ── i pezzi ──────────────────────────────────────────────────────────────────
// Ogni bestia è una geometria sola nel suo riferimento: x avanti, y a sinistra, z in su (fuori dalla superficie), i
// piedi a z = 0, in metri. Ogni vertice dice di che pezzo è (zampa: -1 il corpo; 0-2 le zampe sinistre anteriore,
// media e posteriore, 3-5 le destre; 6-7 le antenne; 8-9 le ali; 10 il carico) e il suo perno (l'anca, la base,
// la cerniera), intorno a cui lo shader lo gira
const sfera = (p, r, seg = 10) => { const g = new T.SphereGeometry(1, seg, Math.max(5, seg >> 1)); g.scale(r[0], r[1], r[2]); g.translate(p[0], p[1], p[2]); return g }
const asta = (a, b, r0, r1 = r0, seg = 5) => {
  const A = new T.Vector3(...a), d = new T.Vector3(...b).sub(A), len = d.length()
  const g = new T.CylinderGeometry(r1, r0, len, seg, 1, false)
  g.translate(0, len / 2, 0)
  g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()))
  g.translate(A.x, A.y, A.z)
  return g
}
// un'ala: un'ellisse piatta che parte dalla cerniera e va indietro, aperta di `apertura` verso il suo lato
const ala = (perno, lung, larg, apertura, lato) => {
  const g = new T.CircleGeometry(1, 14); g.scale(lung / 2, larg / 2, 1); g.translate(-lung / 2, 0, 0)
  g.rotateZ(-lato * apertura); g.translate(...perno)
  return g
}
class Corpo {
  constructor() { this.pezzi = [] }
  metti(g, colore, zampa = -1, perno = [0, 0, 0]) {
    g.deleteAttribute('uv')
    const n = g.attributes.position.count, c = new T.Color(colore)
    const col = new Float32Array(n * 3), z = new Float32Array(n).fill(zampa), p = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) { col.set([c.r, c.g, c.b], i * 3); p.set(perno, i * 3) }
    g.setAttribute('color', new T.BufferAttribute(col, 3)); g.setAttribute('zampa', new T.BufferAttribute(z, 1)); g.setAttribute('perno', new T.BufferAttribute(p, 3))
    this.pezzi.push(g)
    return this
  }
  // una zampa: coscia e tibia (e il tarso, se c'è), dal perno dell'anca
  zampa(i, anca, ginocchio, piede, r, colore, tarso = null) {
    this.metti(asta(anca, ginocchio, r, r * 0.9), colore, i, anca)
    this.metti(asta(ginocchio, piede, r * 0.85, r * 0.6), colore, i, anca)
    if (tarso) this.metti(asta(piede, tarso, r * 0.55, r * 0.4), colore, i, anca)
    return this
  }
  // le zampe dei due lati, dalle misure del lato sinistro (y > 0)
  zampe(lista, r, colore) {
    lista.forEach(([anca, ginocchio, piede, tarso], k) => {
      for (const [lato, i] of [[1, k], [-1, k + 3]]) {
        const s = (p) => p && [p[0], p[1] * lato, p[2]]
        this.zampa(i, s(anca), s(ginocchio), s(piede), r, colore, s(tarso))
      }
    })
    return this
  }
  geometria() { return T.mergeGeometries(this.pezzi) }
}

// la formica (Camponotus, 13 mm): addome, peziolo, torace, testa, antenne a gomito, la briciola di gomma rosa
const formica = () => {
  const c = new Corpo(), nero = 0x17110d, bruno = 0x3a2416
  c.metti(sfera([-0.0047, 0, 0.0027], [0.0033, 0.0025, 0.0023]), nero)
  c.metti(sfera([-0.0012, 0, 0.0024], [0.0007, 0.0006, 0.0008], 6), bruno)
  c.metti(sfera([0.0011, 0, 0.0026], [0.0025, 0.0011, 0.0012]), bruno)
  c.metti(sfera([0.0046, 0, 0.0027], [0.0017, 0.0016, 0.0013]), nero)
  for (const l of [1, -1]) {
    c.metti(asta([0.0058, 0.0006 * l, 0.003], [0.0068, 0.0022 * l, 0.0043], 0.00022), nero, l > 0 ? 6 : 7, [0.0058, 0.0006 * l, 0.003])
    c.metti(asta([0.0068, 0.0022 * l, 0.0043], [0.0089, 0.0031 * l, 0.0026], 0.0002, 0.00016), nero, l > 0 ? 6 : 7, [0.0058, 0.0006 * l, 0.003])
  }
  c.metti(sfera([0.0068, 0, 0.0022], [0.0012, 0.0011, 0.0009], 6), 0xe08aae, 10, [0.0062, 0, 0.0022])
  c.zampe([
    [[0.0022, 0.0008, 0.0022], [0.0042, 0.0034, 0.0036], [0.0063, 0.0046, 0.0002]],
    [[0.0012, 0.0009, 0.0021], [0.0012, 0.0042, 0.0037], [0.0009, 0.0062, 0.0002]],
    [[0.0002, 0.0008, 0.0021], [-0.0024, 0.004, 0.0037], [-0.0055, 0.006, 0.0002]],
  ], 0.00027, bruno)
  return { corpo: c.geometria(), ali: null, lungo: 0.013, passo: 0.0036 }
}
// la mosca (un moscone, 13 mm): torace grigio, addome scuro, gli occhi rossi, le ali sopra l'addome a V
const mosca = () => {
  const c = new Corpo(), grigio = 0x3b3c3e, scuro = 0x23231f, zampe = 0x111111
  c.metti(sfera([-0.0036, 0, 0.0033], [0.0039, 0.003, 0.0026]), scuro)
  c.metti(sfera([0.0008, 0, 0.0036], [0.0029, 0.0025, 0.0025]), grigio)
  c.metti(sfera([0.0043, 0, 0.0034], [0.0013, 0.0024, 0.002]), 0x2a2622)
  for (const l of [1, -1]) c.metti(sfera([0.0044, 0.0013 * l, 0.0038], [0.0012, 0.0012, 0.0014], 8), 0x8c2a1c)
  c.zampe([
    [[0.0019, 0.0009, 0.0021], [0.0036, 0.0031, 0.0042], [0.0058, 0.0042, 0.0002], [0.0066, 0.0044, 0]],
    [[0.0009, 0.001, 0.002], [0.0008, 0.0042, 0.0043], [0.0006, 0.0064, 0.0002], [0.0004, 0.0071, 0]],
    [[-0.0003, 0.0009, 0.002], [-0.0027, 0.0041, 0.0043], [-0.0058, 0.0058, 0.0002], [-0.0064, 0.0062, 0]],
  ], 0.00024, zampe)
  const a = new Corpo()
  for (const [l, i] of [[1, 8], [-1, 9]]) { const p = [0.0012, 0.0011 * l, 0.0058]; a.metti(ala(p, 0.0072, 0.0029, 0.32, l), 0xffffff, i, p) }
  return { corpo: c.geometria(), ali: a.geometria(), lungo: 0.013, passo: 0.004 }
}
// la zanzara tigre (8 mm, con le zampe lunghe il doppio): nera a bande bianche, la riga bianca sul torace, la proboscide
const zanzara = () => {
  const c = new Corpo(), nero = 0x0d0d0f, bianco = 0xe9e9e4
  for (let i = 0; i < 6; i++) c.metti(sfera([-0.0009 - i * 0.00092, 0, 0.0042 - i * 0.00012], [0.00052, 0.0007 - i * 0.00005, 0.00066 - i * 0.00005], 8), i % 2 ? bianco : nero)
  c.metti(sfera([0.0004, 0, 0.0046], [0.0012, 0.0009, 0.001], 8), nero)
  c.metti(sfera([0.0004, 0, 0.0056], [0.0011, 0.00018, 0.00012], 6), bianco)
  c.metti(sfera([0.0019, 0, 0.0047], [0.0006, 0.0006, 0.0006], 8), nero)
  c.metti(asta([0.0024, 0, 0.0045], [0.0051, 0, 0.0033], 0.00013, 0.00008), nero)
  for (const l of [1, -1]) c.metti(asta([0.0023, 0.0003 * l, 0.005], [0.0037, 0.0012 * l, 0.0062], 0.0001), nero, l > 0 ? 6 : 7, [0.0023, 0.0003 * l, 0.005])
  // le zampe: le anteriori avanti, le medie di lato, le posteriori alzate e all'indietro (come stanno le tigri)
  c.zampe([
    [[0.0007, 0.0004, 0.004], [0.003, 0.002, 0.0058], [0.0058, 0.0034, 0.0002], [0.0072, 0.0038, 0]],
    [[0.0003, 0.0005, 0.004], [0.0005, 0.0036, 0.006], [0.0002, 0.0063, 0.0002], [-0.0004, 0.0074, 0]],
    [[-0.0001, 0.0004, 0.004], [-0.0021, 0.0031, 0.0062], [-0.0056, 0.0042, 0.0072], [-0.0074, 0.0044, 0.0088]],
  ], 0.00012, bianco)
  const a = new Corpo()
  for (const [l, i] of [[1, 8], [-1, 9]]) { const p = [0.0006, 0.0006 * l, 0.0057]; a.metti(ala(p, 0.0052, 0.0013, 0.12, l), 0xffffff, i, p) }
  return { corpo: c.geometria(), ali: a.geometria(), lungo: 0.008, passo: 0.004 }
}
// la blatta americana (38 mm): rosso bruno lucido, il pronoto col bordo chiaro, le antenne lunghe quanto lei, i cerci
const blatta = () => {
  const c = new Corpo(), bruno = 0x5a2610, chiaro = 0xb48a4e, zampe = 0x4a2412
  c.metti(sfera([-0.0055, 0, 0.0042], [0.0128, 0.0063, 0.0026], 14), bruno)
  c.metti(sfera([0.0083, 0, 0.0037], [0.0058, 0.0064, 0.0017], 12), chiaro)
  c.metti(sfera([0.0086, 0, 0.0041], [0.0042, 0.0046, 0.0017], 10), 0x4c2410)
  c.metti(sfera([0.0138, 0, 0.003], [0.0022, 0.0024, 0.0017], 8), 0x351a0b)
  for (const l of [1, -1]) {
    const b = [0.0152, 0.0012 * l, 0.0033]
    c.metti(asta(b, [0.026, 0.0065 * l, 0.0062], 0.0002, 0.00016), bruno, l > 0 ? 6 : 7, b)
    c.metti(asta([0.026, 0.0065 * l, 0.0062], [0.039, 0.0125 * l, 0.0042], 0.00016, 0.0001), bruno, l > 0 ? 6 : 7, b)
    c.metti(asta([-0.0178, 0.0013 * l, 0.0034], [-0.0222, 0.0032 * l, 0.003], 0.0004, 0.00015), bruno)
  }
  c.zampe([
    [[0.0062, 0.0021, 0.0027], [0.0108, 0.0078, 0.0052], [0.0158, 0.0108, 0.0003], [0.0172, 0.0112, 0]],
    [[0.0015, 0.0023, 0.0026], [0.0022, 0.0108, 0.0056], [0.0012, 0.0162, 0.0003], [0.0004, 0.0176, 0]],
    [[-0.003, 0.0022, 0.0026], [-0.0065, 0.0112, 0.006], [-0.0165, 0.0168, 0.0003], [-0.019, 0.0178, 0]],
  ], 0.0005, zampe)
  return { corpo: c.geometria(), ali: null, lungo: 0.038, passo: 0.011 }
}

// ── lo shader: muove zampe, antenne, ali e il carico, per istanza ──────────────
// passo: x la fase del passo, y quanto cammina (0 ferma), z il volo (0 posata, 1 in volo), w il tempo in secondi
// extra: x il carico (la briciola delle formiche), y la pulizia (le mosche si strofinano le zampe davanti)
const VIVO = `
attribute float zampa; attribute vec3 perno; attribute vec4 passo; attribute vec4 extra;
vec3 bZ( vec3 d, float a ) { float c = cos( a ), s = sin( a ); return vec3( c * d.x - s * d.y, s * d.x + c * d.y, d.z ); }
vec3 bX( vec3 d, float a ) { float c = cos( a ), s = sin( a ); return vec3( d.x, c * d.y - s * d.z, s * d.y + c * d.z ); }
vec3 bY( vec3 d, float a ) { float c = cos( a ), s = sin( a ); return vec3( c * d.x + s * d.z, d.y, -s * d.x + c * d.z ); }
void bestia( inout vec3 p, inout vec3 n ) {
  if ( zampa < -0.5 ) return;
  vec3 d = p - perno;
  if ( zampa < 5.5 ) {
    // le zampe a tripode: anteriore e posteriore di un lato con la media dell'altro; avanti alzate, indietro a terra
    float lato = zampa < 2.5 ? 1.0 : -1.0, k = mod( zampa, 3.0 ), ph = passo.x + mod( zampa, 2.0 ) * 3.14159;
    float a = -lato * passo.y * sin( ph ), su = passo.y * max( 0.0, cos( ph ) ) * 0.7;
    // in volo pendono, un po' indietro
    a += lato * 0.35 * passo.z;
    // la pulizia: le due zampe davanti si cercano e si strofinano
    if ( k < 0.5 ) { a -= lato * extra.y * ( 0.75 + 0.25 * sin( passo.w * 26.0 ) ); su += extra.y * 0.9; }
    float l = length( d.xy );
    d = bZ( d, a ); n = bZ( n, a );
    d.z += su * l - passo.z * 0.45 * l;
  } else if ( zampa < 7.5 ) {
    // le antenne tastano
    float lato = zampa < 6.5 ? 1.0 : -1.0;
    d = bY( bZ( d, lato * 0.22 * sin( passo.w * 6.0 + zampa * 1.7 ) ), 0.15 * sin( passo.w * 4.3 + zampa ) );
  } else if ( zampa < 9.5 ) {
    // le ali: in volo si aprono di lato e battono (più in fretta dei fotogrammi: se ne vede il velo, a scatti)
    float lato = zampa < 8.5 ? 1.0 : -1.0, apri = passo.z * 1.15, batti = passo.z * ( 0.15 + 0.95 * sin( passo.w * 233.0 + lato * 1.3 ) );
    d = bX( bZ( d, -lato * apri ), lato * batti ); n = bX( bZ( n, -lato * apri ), lato * batti );
  } else {
    d *= extra.x;
  }
  p = perno + d;
}
`
const vivo = (sh) => {
  sh.vertexShader = VIVO + sh.vertexShader
    .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\n vec3 bPos = vec3( position );\n bestia( bPos, objectNormal );')
    .replace('#include <begin_vertex>', 'vec3 transformed = bPos;')
}
// l'ombra morbida: nera, trasparente quanto dice il colore dell'istanza (vColor.r: 1 attaccata, 0 lontana)
const ombraMorbida = (sh) => {
  sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', 'diffuseColor.a *= vColor.r; diffuseColor.rgb = vec3( 0.0 );')
}

// una specie: la mesh del corpo e quella delle ali, con gli attributi per istanza
const specie = (scene, forma, n, materiale, mAli) => {
  const passo = new T.InstancedBufferAttribute(new Float32Array(n * 4), 4), extra = new T.InstancedBufferAttribute(new Float32Array(n * 4), 4)
  for (const a of [passo, extra]) a.setUsage(T.DynamicDrawUsage)
  const mesh = []
  for (const [geo, m] of [[forma.corpo, materiale], [forma.ali, mAli]]) {
    if (!geo) continue
    geo.setAttribute('passo', passo); geo.setAttribute('extra', extra)
    const o = new T.InstancedMesh(geo, m, n)
    o.instanceMatrix.setUsage(T.DynamicDrawUsage); o.frustumCulled = false; o.receiveShadow = true
    scene.add(o); mesh.push(o)
  }
  return { forma, mesh, passo, extra, n }
}

// ── il mondo visto dalle bestie ───────────────────────────────────────────────
export function bestie(scene, M, h, f, { ridotto = false } = {}) {
  const { W, H } = M
  const ins = h.insegna
  const PORTA = { x0: W + 0.1, x1: W + 0.9, y1: 2.36 }
  // dove si può stare sul muro in (x, y): quanto sporge la superficie (z) e che cos'è; null dove non si sta (la porta,
  // le spalle del buco). Dentro la saracinesca la superficie dei fogli (fogli.js), sotto la barra, sopra l'insegna e
  // la facciata
  const muro = (x, y) => {
    if (x > 0.006 && x < W - 0.006 && y > 0.072 && y < H - 0.005) return f.superficie(x, y)
    if (x > 0 && x < W && y >= 0.003 && y <= 0.072) return { z: 0.0245, pezzo: null }
    if (x > ins.x0 + 0.03 && x < ins.x0 + ins.LARG - 0.03 && y > ins.y0 + 0.03 && y < ins.top - 0.03) return { z: ins.zPannello, pezzo: null, insegna: true }
    if (x > PORTA.x0 && x < PORTA.x1 && y < PORTA.y1) return null
    if (x < -0.1 || x > W + 0.1 || y > H + 0.08) {
      if (x > ins.x0 - 0.02 && x < ins.x0 + ins.LARG + 0.02 && y > ins.y0 - 0.02 && y < ins.top + 0.02) return null
      return { z: Z_FACCIATA + (y < 0.5 ? 0.025 : 0), pezzo: null }
    }
    return null
  }

  // ── le specie ──
  const mCorpo = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0.08 })
  const mLucido = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.26, metalness: 0.1 })
  const mAli = new T.MeshStandardMaterial({ color: 0xcfd8dd, roughness: 0.2, metalness: 0, transparent: true, opacity: 0.38, side: T.DoubleSide, depthWrite: false })
  for (const m of [mCorpo, mLucido, mAli]) m.onBeforeCompile = vivo
  const tracce = trovaCibo(f, W, H)
  const N = { formiche: tracce.length * 7, mosche: 3, zanzare: 3, blatte: 2 }
  const sp = {
    formiche: specie(scene, formica(), N.formiche, mCorpo),
    mosche: specie(scene, mosca(), N.mosche, mCorpo, mAli),
    zanzare: specie(scene, zanzara(), N.zanzare, mCorpo, mAli),
    blatte: specie(scene, blatta(), N.blatte, mLucido),
  }
  // le ombre: un quadrato per bestia, sfumato (la trama), orientato sulla superficie
  const totale = Object.values(N).reduce((a, b) => a + b, 0)
  const sfumata = (() => {
    const c = tela(64), ctx = c.getContext('2d'), g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.45, 'rgba(255,255,255,.6)'); g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64)
    return new T.CanvasTexture(c)
  })()
  const mOmbra = new T.MeshBasicMaterial({ color: 0x000000, alphaMap: sfumata, transparent: true, depthWrite: false })
  mOmbra.onBeforeCompile = ombraMorbida
  const ombre = new T.InstancedMesh(new T.PlaneGeometry(1, 1), mOmbra, totale)
  const nero = new T.Color(0, 0, 0)
  for (let i = 0; i < totale; i++) ombre.setColorAt(i, nero)
  ombre.instanceMatrix.setUsage(T.DynamicDrawUsage); ombre.frustumCulled = false; ombre.renderOrder = 5
  scene.add(ombre)

  // ── mettere una bestia nel mondo ──
  const su = new T.Vector3(0, 1, 0), suTerra = su, suMuro = new T.Vector3(0, 0, 1)
  const m4 = new T.Matrix4(), fv = new T.Vector3(), lv = new T.Vector3(), uv = new T.Vector3(), pv = new T.Vector3(), sv = new T.Vector3(), tinta = new T.Color()
  let nOmbra = 0
  // sul muro: avanti nella direzione a (0 = destra, π/2 = su), inclinata secondo la superficie fra la testa e la coda
  const sulMuro = (s, i, b) => {
    const L = s.forma.lungo, c = Math.cos(b.a), sn = Math.sin(b.a)
    const zt = (muro(b.x + c * L * 0.4, b.y + sn * L * 0.4) ?? { z: b.z }).z, zc = (muro(b.x - c * L * 0.4, b.y - sn * L * 0.4) ?? { z: b.z }).z
    fv.set(c * L * 0.8, sn * L * 0.8, zt - zc).normalize(); uv.set(0, 0, 1); lv.crossVectors(uv, fv).normalize(); uv.crossVectors(fv, lv)
    pv.set(b.x, b.y, b.z + (b.alto ?? 0))
    return metti(s, i, b)
  }
  // per terra (il marciapiede, la soglia): a è la direzione nel piano x-z
  const perTerra = (s, i, b) => {
    fv.set(Math.cos(b.a), 0, Math.sin(b.a)); uv.set(0, 1, 0); lv.crossVectors(uv, fv); pv.set(b.x, (b.alto ?? 0) + 0.0016, b.z)
    return metti(s, i, b)
  }
  // in volo: avanti dove va, la testa un po' su; su è il mondo (o la superficie a cui si avvicina, `su`)
  const inAria = (s, i, b, su) => {
    // (se va dritta lungo su, su è un altro)
    fv.copy(b.dir); const s0 = Math.abs(su.dot(fv)) > 0.97 ? (su.y > 0.5 ? suMuro : suTerra) : su
    uv.copy(s0).addScaledVector(fv, -s0.dot(fv)).normalize(); lv.crossVectors(uv, fv); pv.set(b.x, b.y, b.z)
    return metti(s, i, b)
  }
  const metti = (s, i, b) => {
    m4.makeBasis(fv, lv, uv).scale(sv.setScalar(b.scala ?? 1)).setPosition(pv)
    for (const o of s.mesh) o.setMatrixAt(i, m4)
    s.passo.setXYZW(i, b.fase ?? 0, b.amp ?? 0, b.volo ?? 0, b.t ?? 0)
    s.extra.setXYZW(i, b.carico ?? 0, b.pulisce ?? 0, 0, 0)
  }
  // l'ombra sotto: sul muro (n = z) o per terra (n = y); forza 0..1, larga quanto la bestia (di più se è staccata)
  const ombra = (x, y, z, n, a, L, forza) => {
    if (nOmbra >= totale) return
    if (n === 'z') { fv.set(Math.cos(a), Math.sin(a), 0); uv.set(0, 0, 1) } else { fv.set(Math.cos(a), 0, Math.sin(a)); uv.set(0, 1, 0) }
    lv.crossVectors(uv, fv); pv.set(x, y, z)
    m4.makeBasis(fv, lv, uv).scale(sv.set(L * 1.15, L * 0.75, 1)).setPosition(pv)
    ombre.setMatrixAt(nOmbra, m4); ombre.setColorAt(nOmbra++, tinta.setScalar(Math.max(0, Math.min(1, forza)) * 0.55))
  }
  const nascondi = (s, i) => { m4.makeScale(0, 0, 0); for (const o of s.mesh) o.setMatrixAt(i, m4) }

  // ── le formiche ─────────────────────────────────────────────────────────────
  const formiche = []
  tracce.forEach((tr, t) => {
    for (let k = 0; k < 7; k++) formiche.push({ tr, s: Math.random() * tr.L, dir: Math.random() < 0.5 ? 1 : -1, o: caso(-0.003, 0.003), v: caso(0.024, 0.036), pausa: 0, fase: Math.random() * TAU, t: Math.random() * 9, carico: 0, via: 0, fuga: 0, x: 0, y: 0, z: 0, a: 0, amp: 0, id: t * 7 + k })
  })
  for (const fo of formiche) fo.carico = fo.dir < 0 ? 1 : 0
  const muoviFormiche = (dt, now, ctx) => {
    for (const fo of formiche) {
      fo.t += dt
      let mosso = 0
      if (fo.via > 0) { fo.via -= dt; if (fo.via <= 0) { fo.s = 0; fo.dir = 1; fo.carico = 0 } continue }
      const tr = fo.tr
      if (fo.fuga > 0) {
        // sparpagliate: corrono via dal puntatore, a zig zag, poi tornano alla pista
        fo.fuga -= dt
        const sc = ctx.puntatore ? Math.atan2(fo.y - ctx.puntatore.y, fo.x - ctx.puntatore.x) : fo.a
        fo.a = verso(fo.a, sc + 0.9 * Math.sin(fo.t * 7 + fo.id), Math.min(1, dt * 6))
        const v = 0.07 * dt
        fo.x += Math.cos(fo.a) * v; fo.y += Math.sin(fo.a) * v; mosso = v
        if (fo.fuga <= 0) fo.rientra = 1
      } else if (fo.rientra) {
        const p = tr.punto(fo.s), d = Math.hypot(p.x - fo.x, p.y - fo.y)
        fo.a = verso(fo.a, Math.atan2(p.y - fo.y, p.x - fo.x), Math.min(1, dt * 5))
        const v = Math.min(d, 0.04 * dt)
        fo.x += Math.cos(fo.a) * v; fo.y += Math.sin(fo.a) * v; mosso = v
        if (d < 0.003) fo.rientra = 0
      } else {
        if (fo.pausa > 0) fo.pausa -= dt
        else {
          if (Math.random() < dt * 0.25) fo.pausa = caso(0.2, 1)
          const ds = fo.v * dt
          fo.s += fo.dir * ds; mosso = ds
          fo.o = Math.max(-0.0045, Math.min(0.0045, fo.o + (Math.random() - 0.5) * 0.012 * dt))
          if (fo.s >= tr.L) { fo.s = tr.L; fo.dir = -1; fo.pausa = caso(1.5, 4); fo.carico = 1 }
          else if (fo.s <= 0) { fo.s = 0; fo.via = caso(1, 6); nascondi(sp.formiche, fo.id); continue }
        }
        const p = tr.punto(fo.s), q = tr.punto(Math.min(tr.L, Math.max(0, fo.s + fo.dir * 0.004)))
        // al cibo si sparpagliano intorno alla gomma
        const att = tr.L - fo.s < 0.02 ? (1 - (tr.L - fo.s) / 0.02) * 0.012 : 0
        fo.x = p.x + p.nx * (fo.o + att * Math.sin(fo.id * 2.3)); fo.y = p.y + p.ny * (fo.o + att * Math.sin(fo.id * 2.3)) + att * Math.cos(fo.id * 1.7) * 0.5
        const dir = Math.atan2(q.y - p.y, q.x - p.x) + 0.3 * Math.sin(fo.t * 8 + fo.id)
        fo.a = verso(fo.a, fo.pausa > 0 && fo.s >= tr.L - 0.001 ? dir + Math.PI : dir, Math.min(1, dt * 10))
      }
      // il puntatore vicino: allarme
      if (ctx.puntatore && fo.fuga <= 0 && Math.hypot(ctx.puntatore.x - fo.x, ctx.puntatore.y - fo.y) < 0.045 && ctx.puntatore.z < 0.2) fo.fuga = caso(1.2, 2.4)
      fo.fase += (mosso / sp.formiche.forma.passo) * TAU
      fo.amp += ((mosso > 0 ? 0.42 : 0) - fo.amp) * Math.min(1, dt * 12)
    }
    // si incrociano: si fermano un attimo, antenna contro antenna
    for (let i = 0; i < formiche.length; i++) for (let j = i + 1; j < formiche.length; j++) {
      const a = formiche[i], b = formiche[j]
      if (a.tr !== b.tr || a.dir === b.dir || a.via > 0 || b.via > 0 || a.fuga > 0 || b.fuga > 0) continue
      if (Math.abs(a.s - b.s) < 0.005 && a.pausa <= 0 && b.pausa <= 0 && now - (a.incontro ?? 0) > 3000) { a.pausa = b.pausa = caso(0.3, 0.9); a.incontro = b.incontro = now }
    }
    for (const fo of formiche) {
      if (fo.via > 0) continue
      const s = muro(fo.x, fo.y)
      fo.z = s ? s.z : 0.0245
      sulMuro(sp.formiche, fo.id, { x: fo.x, y: fo.y, z: fo.z, a: fo.a, fase: fo.fase, amp: fo.amp, t: fo.t, carico: fo.carico })
      ombra(fo.x, fo.y - 0.0008, fo.z + 0.0003, 'z', fo.a, 0.013, 0.7)
    }
  }

  // ── le mosche ───────────────────────────────────────────────────────────────
  const mosche = Array.from({ length: N.mosche }, (_, i) => ({ id: i, stato: 'nata', x: 0, y: 0, z: 0, a: Math.PI / 2, t: 0, fase: 0, amp: 0, dir: new T.Vector3(1, 0, 0), vel: 0.9, pulisce: 0, gira: 0, passi: 0, timer: 0 }))
  // un posto per posarsi, dentro la parte di strada che si vede: sul muro, sui fogli, sull'insegna
  // (basso: nella metà bassa di quello che si vede, dove stanno le zanzare di giorno)
  const posto = (ctx, basso = false) => {
    for (let k = 0; k < 20; k++) {
      const y0 = Math.max(0.1, ctx.vista.y0 + 0.05), y1 = basso ? (ctx.vista.y0 + ctx.vista.y1) / 2 : ctx.vista.y1 - 0.08
      const x = caso(ctx.vista.x0 + 0.05, ctx.vista.x1 - 0.05), y = caso(y0, Math.max(y0, y1)), s = muro(x, y)
      if (s) return { x, y, z: s.z }
    }
    return { x: W / 2, y: Math.min(H - 0.3, ctx.vista.y1 - 0.2), z: muro(W / 2, Math.min(H - 0.3, ctx.vista.y1 - 0.2))?.z ?? 0.01 }
  }
  const nell = (ctx) => ({ x: caso(ctx.vista.x0, ctx.vista.x1), y: caso(Math.max(0.15, ctx.vista.y0), ctx.vista.y1), z: caso(0.06, 0.55) })
  const decolla = (m, ctx, via = null) => {
    m.stato = 'vola'; m.tappe = 1 + Math.floor(Math.random() * 3); m.meta = nell(ctx); m.vel = caso(0.7, 1.3)
    m.dir.set(via ? via.x : caso(-0.5, 0.5), via ? via.y : caso(-0.2, 0.6), 1).normalize(); m.z += 0.004
    m.pulisce = 0; m.passi = 0; m.gira = 0
  }
  const muoviMosche = (dt, now, ctx) => {
    const dorme = ctx.buio > 0.6
    for (const m of mosche) {
      m.t += dt
      if (m.stato === 'nata') { const p = posto(ctx); Object.assign(m, p); m.stato = 'posata'; m.timer = caso(1, 8); m.a = Math.PI / 2 + caso(-0.8, 0.8) }
      if (m.stato === 'posata') {
        m.timer -= dt
        let mosso = 0
        if (m.pulisce > 0) m.pulisce = Math.max(0, m.pulisce - dt)
        if (m.gira) { const p = Math.sign(m.gira) * Math.min(Math.abs(m.gira), 5 * dt); m.a += p; m.gira -= p; mosso = Math.abs(p) * 0.004 }
        if (m.passi > 0) {
          const v = 0.035 * dt, nx = m.x + Math.cos(m.a) * v, ny = m.y + Math.sin(m.a) * v, s = muro(nx, ny)
          if (s) { m.x = nx; m.y = ny; m.z = s.z; m.passi -= v; mosso = v } else m.passi = 0
        }
        const s = muro(m.x, m.y)
        if (s) m.z = s.z
        if (m.timer <= 0) {
          const r = Math.random()
          if (!dorme && r < 0.3) decolla(m, ctx)
          else if (r < 0.55) { m.pulisce = caso(0.8, 2.4); m.timer = m.pulisce + caso(0.4, 3) }
          else if (r < 0.78) { m.gira = caso(0.4, 2) * (Math.random() < 0.5 ? -1 : 1); m.timer = caso(0.6, 4) }
          else { m.passi = caso(0.008, 0.04); m.timer = caso(0.6, 3) }
          if (dorme) m.timer *= 3
        }
        // scappano: il puntatore vicino (o veloce lì intorno), i fari, il foglio che si alza
        const p = ctx.puntatore
        const vicino = p && !p.suolo && Math.hypot(p.x - m.x, p.y - m.y) < (p.veloce ? 0.16 : 0.09)
        if (vicino || (ctx.fari > 0.5 && Math.random() < dt * 1.5) || (s?.pezzo && s.pezzo.meta > 0)) {
          decolla(m, ctx, p ? { x: m.x - p.x, y: m.y - p.y } : null)
          // ogni tanto un'altra le va dietro
          const altra = mosche.find((o) => o !== m && o.stato === 'posata' && Math.hypot(o.x - m.x, o.y - m.y) < 0.4)
          if (altra && Math.random() < 0.4) { decolla(altra, ctx); altra.insegue = m; altra.inseguiFino = now + caso(900, 2000) }
        }
        m.fase += (mosso / sp.mosche.forma.passo) * TAU
        m.amp += ((mosso > 0 ? 0.4 : 0) - m.amp) * Math.min(1, dt * 12)
        sulMuro(sp.mosche, m.id, { x: m.x, y: m.y, z: m.z, a: m.a, fase: m.fase, amp: m.amp, t: m.t, pulisce: Math.min(1, m.pulisce * 3) })
        ombra(m.x + 0.0008, m.y - 0.0012, m.z + 0.0003, 'z', m.a, 0.013, 0.8)
        continue
      }
      // in volo: tratti dritti verso la meta, virate secche, a volte all'inseguimento
      let meta = m.meta
      if (m.insegue && now < m.inseguiFino && m.insegue.stato === 'vola') meta = { x: m.insegue.x, y: m.insegue.y, z: m.insegue.z }
      else m.insegue = null
      const vx = meta.x - m.x, vy = meta.y - m.y, vz = meta.z - m.z, d = Math.hypot(vx, vy, vz)
      // vicino alla meta rallenta e vira più stretto (se no le gira intorno senza arrivarci); nell'ultimo tratto
      // dell'atterraggio si accosta
      const lontano = Math.min(1, d / (m.stato === 'atterra' ? 0.12 : 0.2))
      const voglia = new T.Vector3(vx, vy, vz).normalize()
      m.dir.lerp(voglia, Math.min(1, dt * (5 + 12 * (1 - lontano)))).normalize()
      if (m.stato === 'vola' && lontano > 0.6 && Math.random() < dt * 1.2) m.dir.applyAxisAngle(su, caso(-1.6, 1.6)).normalize()
      const v = m.vel * (0.25 + 0.75 * lontano) * dt
      m.x += m.dir.x * v; m.y += m.dir.y * v; m.z += m.dir.z * v
      if (m.stato === 'atterra' && d < 0.03) { const k = Math.min(1, dt * 8); m.x += vx * k; m.y += vy * k; m.z += vz * k }
      m.inVolo = (m.inVolo ?? 0) + dt
      // non si passa dentro il muro
      const sotto = muro(m.x, m.y), zmin = (sotto ? sotto.z : Z_FACCIATA) + 0.004
      if (m.z < zmin && m.stato === 'vola') { m.z = zmin; m.dir.z = Math.abs(m.dir.z) }
      if (m.stato === 'vola' && (d < 0.05 || m.inVolo > 7)) {
        if ((--m.tappe > 0 || m.insegue) && m.inVolo < 7) m.meta = nell(ctx)
        else { m.stato = 'atterra'; const p = posto(ctx); m.meta = { x: p.x, y: p.y, z: p.z + 0.002 } }
      }
      if (m.stato === 'atterra') {
        const s = muro(m.x, m.y)
        if (s && m.z - s.z < 0.006 && Math.hypot(vx, vy) < 0.01) { m.stato = 'posata'; m.inVolo = 0; m.z = s.z; m.timer = caso(2, 9); m.a = Math.atan2(m.dir.y, m.dir.x) * 0.3 + Math.PI / 2 * 0.7 + caso(-0.5, 0.5) }
      }
      inAria(sp.mosche, m.id, { x: m.x, y: m.y, z: m.z, dir: m.dir, volo: 1, t: m.t }, m.stato === 'atterra' ? suMuro : su)
      const sm = muro(m.x, m.y)
      if (sm) { const h2 = m.z - sm.z; ombra(m.x + h2 * 0.2, m.y - h2 * 0.45, sm.z + 0.0003, 'z', Math.atan2(m.dir.y, m.dir.x), 0.013 * (1 + h2 * 8), 0.8 - h2 * 2.2) }
    }
  }

  // ── le zanzare ──────────────────────────────────────────────────────────────
  const zanzare = Array.from({ length: N.zanzare }, (_, i) => ({ id: i, stato: 'nata', x: 0, y: 0, z: 0, a: Math.PI / 2, t: Math.random() * 10, dir: new T.Vector3(1, 0, 0), timer: 0, giro: Math.random() * TAU }))
  let prossimaVisita = performance.now() + caso(15000, 40000)
  const muoviZanzare = (dt, now, ctx) => {
    const notte = ctx.buio > 0.45
    for (const z of zanzare) {
      z.t += dt
      if (z.stato === 'nata') { const p = posto(ctx, true); Object.assign(z, p); z.stato = 'posata'; z.timer = caso(2, 10) }
      if (z.stato === 'posata') {
        z.timer -= dt
        const p = ctx.puntatore
        if (z.timer <= 0 || (p && !p.suolo && Math.hypot(p.x - z.x, p.y - z.y) < 0.05)) { z.stato = 'vola'; z.z += 0.003; z.timer = caso(4, 12); z.dir.set(0, 0.3, 1).normalize() }
        sulMuro(sp.zanzare, z.id, { x: z.x, y: z.y, z: z.z, a: z.a, t: z.t })
        ombra(z.x + 0.0006, z.y - 0.001, z.z + 0.0003, 'z', z.a, 0.009, 0.5)
        continue
      }
      // la meta: di notte la luce (la lampada, l'insegna), di giorno il puntatore o un posto basso all'ombra; a volte
      // chi guarda (la telecamera)
      z.timer -= dt
      let c
      if (z.visita && now < z.visita) c = ctx.telecamera.clone().add(new T.Vector3(Math.sin(z.t * 1.3) * 0.08, -0.05 + Math.sin(z.t * 2.1) * 0.05, -0.32))
      else if (notte) { const luce = z.id % 2 ? ctx.lampada : ctx.insegna; z.giro += dt * 0.9; c = luce.clone().add(new T.Vector3(Math.cos(z.giro) * 0.28, Math.sin(z.t * 1.7) * 0.12 - 0.05, Math.abs(Math.sin(z.giro)) * 0.28 + 0.06)) }
      else if (ctx.puntatore && !ctx.puntatore.suolo) c = new T.Vector3(ctx.puntatore.x + Math.sin(z.t * 1.1 + z.id) * 0.07, ctx.puntatore.y + Math.sin(z.t * 1.6) * 0.05, 0.06 + 0.04 * Math.sin(z.t * 0.9))
      else { if (!z.posto || Math.random() < dt * 0.15) z.posto = { x: caso(ctx.vista.x0, ctx.vista.x1), y: caso(Math.max(0.15, ctx.vista.y0), (ctx.vista.y0 + ctx.vista.y1) / 2), z: caso(0.05, 0.3) }; c = new T.Vector3(z.posto.x, z.posto.y, z.posto.z) }
      if (!notte && !z.visita && now > prossimaVisita && z.id === 0) { z.visita = now + caso(1800, 3200); prossimaVisita = now + caso(40000, 90000) }
      if (z.visita && now > z.visita) z.visita = 0
      // il volo delle zanzare: lento, a scatti, che sale e scende
      const voglia = c.clone().sub(new T.Vector3(z.x, z.y, z.z))
      const d = voglia.length(); voglia.normalize()
      z.dir.lerp(voglia, Math.min(1, dt * 2.2)).normalize()
      if (Math.random() < dt * 3) z.dir.applyAxisAngle(su, caso(-1, 1)).normalize()
      const v = (z.visita ? 0.45 : 0.22) * Math.min(1, d / 0.08 + 0.3) * dt
      z.x += z.dir.x * v; z.y += z.dir.y * v + Math.sin(z.t * 9 + z.id) * 0.02 * dt; z.z += z.dir.z * v
      const sotto = muro(z.x, z.y), zmin = (sotto ? sotto.z : Z_FACCIATA) + 0.004
      if (z.z < zmin) z.z = zmin
      // si posa: quando ha volato abbastanza e c'è un muro vicino (di giorno in basso)
      if (z.timer <= 0 && !z.visita && sotto && z.z - sotto.z < 0.05) { z.stato = 'posa' }
      if (z.stato === 'posa') { z.z -= 0.05 * dt; if (sotto && z.z - sotto.z < 0.004) { z.stato = 'posata'; z.z = sotto.z; z.timer = caso(4, 18); z.a = Math.PI / 2 + caso(-0.6, 0.6) } }
      inAria(sp.zanzare, z.id, { x: z.x, y: z.y, z: z.z, dir: z.dir, volo: 1, t: z.t }, su)
      if (sotto) { const h2 = z.z - sotto.z; ombra(z.x + h2 * 0.2, z.y - h2 * 0.45, sotto.z + 0.0003, 'z', Math.atan2(z.dir.y, z.dir.x), 0.009 * (1 + h2 * 8), 0.5 - h2 * 2) }
    }
  }

  // ── le blatte ───────────────────────────────────────────────────────────────
  // stanno sotto la saracinesca; per terra (suolo) x, z e la direzione a nel piano; sul muro x, y
  const blatte = Array.from({ length: N.blatte }, (_, i) => ({ id: i, stato: 'sotto', timer: caso(1, 12) + i * 6, x: caso(0.2, W - 0.2), y: 0, z: 0.03, a: 0, suolo: true, fase: 0, amp: 0, t: 0, v: 0, meta: null }))
  const ZB = 0.0245 + 0.004 // il piede della barra in fondo alla saracinesca: di lì entrano ed escono
  const muoviBlatte = (dt, now, ctx) => {
    const fuori = ctx.buio > 0.45 || ctx.blatte || REGIA.blatteDiGiorno
    for (const b of blatte) {
      b.t += dt
      if (b.stato === 'sotto') {
        b.timer -= dt
        nascondi(sp.blatte, b.id)
        if (fuori && b.timer <= 0) { b.stato = 'gira'; b.suolo = true; b.x = caso(0.15, W - 0.15); b.z = ZB; b.a = Math.PI / 2 + caso(-0.6, 0.6); b.timer = caso(8, 30); b.meta = null; b.scatto = 0 }
        continue
      }
      b.timer -= dt
      const p = ctx.puntatore
      const vicino = p && Math.hypot(p.x - b.x, (b.suolo ? p.z - b.z : p.y - b.y)) < 0.14 && p.suolo === b.suolo
      if (b.stato !== 'scappa' && (vicino || ctx.fari > 0.4 || !fuori || b.timer <= 0)) b.stato = 'scappa'
      let v = 0
      if (b.stato === 'gira') {
        // a scatti: corre, si ferma, tasta con le antenne, cambia direzione
        if (b.scatto <= 0) { b.ferma = Math.random() < 0.45 ? caso(0.4, 2.2) : 0; b.scatto = caso(0.4, 1.6); b.velo = caso(0.06, 0.2); b.virata = caso(-1.2, 1.2) }
        b.scatto -= dt
        if (b.ferma > 0) b.ferma -= dt
        else {
          v = b.velo
          b.a += b.virata * dt
          if (b.suolo) {
            // per terra: resta fra la saracinesca e il cordolo; quando va contro la saracinesca, ci sale
            if (b.z > 0.9 || b.x < -0.4 || b.x > W + 0.4) b.a = verso(b.a, Math.atan2(ZB + 0.2 - b.z, W / 2 - b.x), dt * 3)
            if (b.z <= ZB && Math.sin(b.a) < 0 && b.x > 0.03 && b.x < W - 0.03) { b.suolo = false; b.y = 0.004; b.z = 0.0245; b.a = Math.PI / 2 + caso(-0.4, 0.4) }
          } else {
            // sul muro: non oltre il metro e mezzo, non fuori dalla saracinesca; scesa in fondo torna per terra
            if (b.y > 1.5 || b.x < 0.03 || b.x > W - 0.03) b.a = verso(b.a, Math.atan2(0.4 - b.y, W / 2 - b.x), dt * 3)
            if (b.y < 0.003 && Math.sin(b.a) < 0) { b.suolo = true; b.z = ZB; b.a = Math.PI / 2 + caso(-0.5, 0.5) }
          }
        }
      } else {
        // scappa: veloce verso la fessura più vicina (sotto la barra) o sotto il foglio più vicino; lì sparisce
        if (!b.meta) {
          if (b.suolo || b.y < 0.35) b.meta = { suolo: b.suolo, x: b.x, y: 0, z: ZB }
          else {
            const s = f.superficie(b.x, b.y)
            b.meta = { sotto: s.pezzo ?? null, x: b.x + caso(-0.05, 0.05), y: b.y - caso(0.03, 0.1) }
          }
        }
        v = 0.42
        if (b.suolo) {
          b.a = verso(b.a, -Math.PI / 2, dt * 8) // verso la saracinesca (z che cala)
          if (b.z <= ZB + 0.002) { b.stato = 'sotto'; b.timer = caso(10, 40); b.meta = null; continue }
        } else if (b.meta.sotto !== undefined) {
          b.a = verso(b.a, Math.atan2(b.meta.y - b.y, b.meta.x - b.x), dt * 8)
          if (Math.hypot(b.meta.x - b.x, b.meta.y - b.y) < 0.01) { b.stato = 'sotto'; b.timer = caso(10, 40); b.meta = null; continue }
        } else {
          b.a = verso(b.a, -Math.PI / 2, dt * 8)
          if (b.y < 0.003) { b.suolo = true; b.z = ZB + 0.001; b.a = -Math.PI / 2 }
        }
      }
      const d = v * dt
      if (b.suolo) { b.x += Math.cos(b.a) * d; b.z = Math.max(ZB, b.z + Math.sin(b.a) * d) }
      else { b.x += Math.cos(b.a) * d; b.y = Math.max(0, b.y + Math.sin(b.a) * d) }
      b.fase += (d / sp.blatte.forma.passo) * TAU
      b.amp += ((d > 0 ? 0.38 : 0) - b.amp) * Math.min(1, dt * 14)
      if (b.suolo) {
        perTerra(sp.blatte, b.id, { x: b.x, z: b.z, a: b.a, fase: b.fase, amp: b.amp, t: b.t })
        ombra(b.x, 0.0018, b.z, 'y', b.a, 0.038, 0.85)
      } else {
        const s = muro(b.x, b.y), z = s ? s.z : 0.0245
        sulMuro(sp.blatte, b.id, { x: b.x, y: b.y, z, a: b.a, fase: b.fase, amp: b.amp, t: b.t })
        ombra(b.x + 0.001, b.y - 0.002, z + 0.0003, 'z', b.a, 0.038, 0.8)
      }
    }
  }

  // ── un fotogramma ──
  // ctx: vista (il rettangolo di muro che si vede), puntatore ({x, y, z, suolo, veloce} o null), buio, fari, la
  // telecamera, la lampada e l'insegna (dove vanno le zanzare la sera)
  // (la regia: quali specie ci sono, quanto vanno veloci)
  let ultimo = null
  const aggiorna = (dt, now, ctx) => {
    ultimo = ctx
    dt = ridotto ? 0 : dt * REGIA.velocitaBestie
    nOmbra = 0
    const vive = REGIA.bestie
    for (const [nome, s] of Object.entries(sp)) for (const o of s.mesh) o.visible = vive[nome]
    if (vive.formiche) muoviFormiche(dt, now, ctx)
    if (vive.mosche) muoviMosche(dt, now, ctx)
    if (vive.zanzare) muoviZanzare(dt, now, ctx)
    if (vive.blatte) muoviBlatte(dt, now, ctx)
    for (const s of Object.values(sp)) { for (const o of s.mesh) o.instanceMatrix.needsUpdate = true; s.passo.needsUpdate = true; s.extra.needsUpdate = true }
    ombre.count = nOmbra; ombre.instanceMatrix.needsUpdate = true; ombre.instanceColor.needsUpdate = true
  }
  // (dentro: per le prove da console, window.pzkkoScena.b.dentro)
  // spaventa: le mosche e le zanzare volano via, le formiche si sparpagliano, le blatte corrono a nascondersi;
  // visita: una zanzara viene a ronzare davanti alla telecamera (la regia)
  const spaventa = () => {
    if (!ultimo) return
    for (const m of mosche) if (m.stato === 'posata') decolla(m, ultimo)
    for (const z of zanzare) if (z.stato === 'posata') { z.stato = 'vola'; z.z += 0.003; z.timer = caso(4, 12) }
    for (const fo of formiche) if (fo.via <= 0) fo.fuga = caso(1.2, 2.4)
    for (const b of blatte) if (b.stato === 'gira') b.stato = 'scappa'
  }
  const visita = () => { const z = zanzare[0]; if (z.stato !== 'vola') { z.stato = 'vola'; z.z += 0.003; z.timer = caso(4, 12) } z.visita = performance.now() + 3000 }
  return { aggiorna, spaventa, visita, mesh: [...Object.values(sp).flatMap((s) => s.mesh), ombre], dentro: { formiche, mosche, zanzare, blatte, decolla } }
}

// le piste delle formiche: alle gomme da masticare sulla lamiera (strada1/gomme e bestiole/gomme2), una dalla barra in
// fondo, una dalla guida di destra; nella 404, che non ha gomme, una pista che non porta da nessuna parte
function trovaCibo(f, W, H) {
  const gomma = (nome) => f.pezzi.find((p) => p.el.getAttribute('src')?.endsWith(`/${nome}.webp`))
  const piste = []
  const g1 = gomma('gomme'), g2 = gomma('gomme2')
  if (g1) piste.push(pista({ x: Math.min(W - 0.05, g1.cx + 0.2), y: 0.074 }, { x: g1.cx, y: g1.cy }, 3))
  else piste.push(pista({ x: W * 0.62, y: 0.074 }, { x: W * 0.5, y: 0.45 }, 3))
  if (g2) piste.push(pista({ x: W - 0.012, y: Math.max(0.1, g2.cy - 0.32) }, { x: g2.cx, y: g2.cy }, 7))
  return piste
}
// una pista: dal nido al cibo, storta (le formiche seguono l'odore, non la riga), coi punti ogni 5 mm, la lunghezza
// e per ogni punto la normale (di lato, per lo scarto di ognuna)
function pista(da, a, seme) {
  const n = 60, pts = []
  const dx = a.x - da.x, dy = a.y - da.y, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L
  for (let i = 0; i <= n; i++) {
    const t = i / n, w = Math.sin(Math.PI * t) * (0.035 * Math.sin(t * 7.3 + seme) + 0.015 * Math.sin(t * 17.1 + seme * 2.1))
    pts.push({ x: da.x + dx * t + nx * w * L, y: da.y + dy * t + ny * w * L })
  }
  const lun = [0]
  for (let i = 1; i <= n; i++) lun.push(lun[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y))
  const tot = lun[n]
  const punto = (s) => {
    s = Math.max(0, Math.min(tot, s))
    let i = 1
    while (i < n && lun[i] < s) i++
    const k = (s - lun[i - 1]) / Math.max(1e-6, lun[i] - lun[i - 1]), p = pts[i - 1], q = pts[i]
    const tx = q.x - p.x, ty = q.y - p.y, tl = Math.hypot(tx, ty) || 1
    return { x: p.x + tx * k, y: p.y + ty * k, nx: -ty / tl, ny: tx / tl }
  }
  return { L: tot, punto }
}
