// Il meteo di Mantova, quello vero, nella scena. Lo chiede a /api/meteo (la funzione
// di albertopecchini.it/api/meteo.js, che lo prende da Open-Meteo e lo tiene in cache)
// all'arrivo e ogni dieci minuti, e lo fa vedere:
// - sole e nuvole: con le nuvole il sole non fa più ombre nette, la luce del cielo
//   cresce e si fa grigia, il cielo si copre (una cupola grigia davanti al cielo,
//   anche nei riflessi);
// - nebbia: la nebbia vera della scena, fitta quanto dice la visibilità, e i
//   lampioni e l'insegna col bagliore più largo;
// - pioggia e temporale: le gocce che cadono fra la telecamera e il muro (storte
//   col vento), i cerchi nelle pozzanghere, il bagnato che cresce; col temporale
//   i lampi;
// - neve: i fiocchi che scendono ondeggiando, e per terra la neve che copre le
//   lastre e la pietra (le pozze sotto spariscono).
// Il bagnato del marciapiede segue la pioggia delle ultime 12 ore: col sole dopo
// giorni asciutti le pozze non ci sono più. Senza risposta (in locale, o se
// Open-Meteo tace) resta il dopo pioggia di sempre. La regia (regia/) può
// scegliere il tempo e quanto è forte, ?meteo=pioggia|neve|nebbia|nuvoloso|sole|temporale
// lo fissa per le prove.
//
// Le gocce e i fiocchi sono una mesh ciascuno, mosse tutte dallo shader (nessun
// calcolo a fotogramma): ognuna ha il suo posto in una scatola che segue
// l'inquadratura e ci si ripete dentro. Stanno sul livello 1, che la telecamera vede
// e gli specchi e le ombre no.
import * as T from './lib/three.js'
import { REGIA } from './materiali.js'
import { BAGNO } from './acqua.js'

// lo stato di adesso, ammorbidito (letto da luci.js e scena.js); bersaglio = dove va
export const METEO = { tipo: 'sole', nuvole: 0.25, pioggia: 0, neve: 0, nebbia: 0, bagnato: 0.85, manto: 0, lampo: 0, vento: new T.Vector2(), dati: null, testo: '' }
const TIPI = ['sole', 'nuvoloso', 'nebbia', 'pioggia', 'temporale', 'neve']
const limita = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))

// dal codice WMO al tipo
const tipoDi = (d) => {
  const c = d.codice ?? 0
  if (c >= 95) return 'temporale'
  if ((c >= 71 && c <= 77) || c === 85 || c === 86) return 'neve'
  if ((c >= 51 && c <= 67) || (c >= 80 && c <= 82)) return 'pioggia'
  if (c === 45 || c === 48) return 'nebbia'
  return c >= 2 || (d.nuvole ?? 0) > 55 ? 'nuvoloso' : 'sole'
}
const NOMI = { sole: 'sereno', nuvoloso: 'nuvoloso', nebbia: 'nebbia', pioggia: 'pioggia', temporale: 'temporale', neve: 'neve' }
// il vento dei dati (km/h, da dove viene, gradi da nord) nel mondo: x lungo la facciata, z verso la strada (la facciata
// guarda a 200°, come in luci.js); in m/s, e un po' riparato dal palazzo
const FACCIATA = (200 * Math.PI) / 180
const vento = (kmh, da) => {
  const a = (((da ?? 0) + 180) * Math.PI) / 180, E = Math.sin(a), N = Math.cos(a), v = ((kmh ?? 0) / 3.6) * 0.6
  return new T.Vector2((-E * Math.cos(FACCIATA) + N * Math.sin(FACCIATA)) * v, (E * Math.sin(FACCIATA) + N * Math.cos(FACCIATA)) * v)
}
// il bersaglio: dai dati veri, o dal tempo scelto (la regia, ?meteo=) con la sua intensità
const daiDati = (d) => {
  const tipo = tipoDi(d)
  const piove = limita(Math.log1p((d.pioggia ?? 0) * 2) / Math.log1p(16))
  const nebbia = d.visibilita ? limita(1 - (Math.log(d.visibilita) - Math.log(200)) / (Math.log(12000) - Math.log(200))) : 0
  return {
    tipo, nuvole: limita((d.nuvole ?? 0) / 100),
    pioggia: tipo === 'pioggia' || tipo === 'temporale' ? Math.max(0.18, piove) : 0,
    neve: tipo === 'neve' ? Math.max(0.25, limita((d.neve ?? 0) / 1.5)) : 0,
    nebbia: tipo === 'nebbia' ? Math.max(0.55, nebbia) : nebbia * 0.5,
    bagnato: piove > 0 || tipo === 'pioggia' || tipo === 'temporale' ? 1 : limita(0.15 + (d.pioggia12 ?? 0) / 3) * 0.95 + (tipo === 'nebbia' ? 0.1 : 0),
    manto: limita((d.manto ?? 0) / 0.05) || (tipo === 'neve' ? 0.35 : 0),
    temporale: tipo === 'temporale', vento: vento(d.vento, d.direzione),
  }
}
const scelto = (tipo, i) => {
  const b = { tipo, nuvole: 0.05, pioggia: 0, neve: 0, nebbia: 0, bagnato: 0.15, manto: 0, temporale: false, vento: new T.Vector2(0.6, 0.2) }
  if (tipo === 'nuvoloso') Object.assign(b, { nuvole: 0.55 + 0.4 * i, bagnato: 0.3 })
  if (tipo === 'nebbia') Object.assign(b, { nuvole: 0.8, nebbia: 0.45 + 0.55 * i, bagnato: 0.5, vento: new T.Vector2() })
  if (tipo === 'pioggia') Object.assign(b, { nuvole: 1, pioggia: 0.15 + 0.85 * i, bagnato: 1, vento: new T.Vector2(1.2 * i, 0.4) })
  if (tipo === 'temporale') Object.assign(b, { nuvole: 1, pioggia: 0.7 + 0.3 * i, bagnato: 1, temporale: true, vento: new T.Vector2(3.5, 1.2) })
  if (tipo === 'neve') Object.assign(b, { nuvole: 0.95, neve: 0.2 + 0.8 * i, manto: 0.3 + 0.7 * i, bagnato: 0.25, vento: new T.Vector2(0.5, 0.2) })
  return b
}
// in locale o senza risposta: il dopo pioggia di sempre (le pozze, qualche nuvola)
const DOPO_PIOGGIA = { tipo: 'sole', nuvole: 0.25, pioggia: 0, neve: 0, nebbia: 0, bagnato: 0.85, manto: 0, temporale: false, vento: new T.Vector2(0.4, 0.1) }

// ── le gocce e i fiocchi: un quadrato per ognuno, la posizione la calcola lo shader ──
const PARTICELLE = `
uniform float uTempo, uQuanta, uVel, uLung, uLarg, uNeve;
uniform vec3 uCentro, uDim; uniform vec2 uVento;
attribute vec4 seme; attribute vec2 angolo;
varying float vA; varying vec2 vQ;
void main() {
  // la pioggia cade dritta e veloce, storta col vento; la neve piano, ondeggiando
  vec3 v = vec3( uVento.x, -uVel * ( 0.8 + 0.4 * seme.w ), uVento.y );
  vec3 lo = uCentro - uDim * 0.5;
  vec3 p = mod( seme.xyz * uDim + v * uTempo - lo, uDim ) + lo;
  p.xz += uNeve * vec2( sin( uTempo * 1.3 + seme.w * 40.0 ), cos( uTempo * 1.1 + seme.x * 30.0 ) ) * 0.12;
  vec3 vista = normalize( cameraPosition - p ), q;
  if ( uNeve > 0.5 ) {
    // il fiocco: un quadratino rivolto alla telecamera
    vec3 x = normalize( cross( vec3( 0.0, 1.0, 0.0 ), vista ) ), y = cross( vista, x );
    q = p + ( x * angolo.x + y * ( angolo.y - 0.5 ) ) * uLarg * ( 0.6 + 0.8 * seme.w );
  } else {
    // la goccia: una striscia lungo la velocità (il mosso di un trentesimo di secondo), larga nel piano del muro (la
    // telecamera lo guarda sempre di fronte; cross( d, vista ) su Windows, tradotto in HLSL, dava gocce invisibili)
    vec3 d = normalize( v ), lato = normalize( vec3( -d.y, d.x, 0.0 ) );
    q = p - d * angolo.y * uLung * ( 0.6 + 0.4 * seme.w ) + lato * angolo.x * uLarg;
  }
  // (quelle in più di quante ne vuole il meteo stanno fuori dallo schermo; la coda della goccia sfuma)
  float vis = step( seme.w, uQuanta );
  // (quelle a un palmo dalla telecamera sarebbero strisce enormi: sfocate, cioè sparite)
  vA = vis * ( 1.0 - 0.85 * angolo.y * ( 1.0 - uNeve ) ) * smoothstep( 0.25, 0.7, distance( cameraPosition, p ) );
  vQ = vec2( angolo.x * 2.0, angolo.y * 2.0 - 1.0 );
  gl_Position = projectionMatrix * viewMatrix * vec4( q, 1.0 );
  if ( vis <= 0.0 ) gl_Position = vec4( 2.0, 2.0, 2.0, 1.0 );
}`
const PARTICELLE_F = `
uniform vec3 uColore; uniform float uNeve, uAlfa; varying float vA; varying vec2 vQ;
void main() {
  float a = vA * uAlfa;
  if ( uNeve > 0.5 ) a *= 1.0 - smoothstep( 0.35, 1.0, length( vQ ) );
  if ( a < 0.004 ) discard;
  gl_FragColor = vec4( uColore, a );
}`
const particelle = (n, neve) => {
  const seme = new Float32Array(n * 16), angolo = new Float32Array(n * 8), idx = []
  for (let i = 0; i < n; i++) {
    const s = [Math.random(), Math.random(), Math.random(), Math.random()]
    for (let k = 0; k < 4; k++) seme.set(s, (i * 4 + k) * 4)
    angolo.set([-0.5, 0, 0.5, 0, 0.5, 1, -0.5, 1], i * 8)
    const a = i * 4
    idx.push(a, a + 1, a + 2, a, a + 2, a + 3)
  }
  const g = new T.BufferGeometry()
  g.setAttribute('position', new T.Float32BufferAttribute(new Float32Array(n * 12), 3))
  g.setAttribute('seme', new T.Float32BufferAttribute(seme, 4))
  g.setAttribute('angolo', new T.Float32BufferAttribute(angolo, 2))
  g.setIndex(idx)
  const m = new T.ShaderMaterial({
    uniforms: { uTempo: { value: 0 }, uQuanta: { value: 0 }, uVel: { value: neve ? 1 : 7 }, uLung: { value: 0.18 }, uLarg: { value: neve ? 0.012 : 0.003 }, uNeve: { value: neve ? 1 : 0 },
      uCentro: { value: new T.Vector3() }, uDim: { value: new T.Vector3(4, 4, 2) }, uVento: { value: new T.Vector2() }, uColore: { value: new T.Color() }, uAlfa: { value: neve ? 0.95 : 0.36 } },
    vertexShader: PARTICELLE, fragmentShader: PARTICELLE_F, transparent: true, depthWrite: false,
  })
  const o = new T.Mesh(g, m)
  o.frustumCulled = false; o.layers.set(1); o.renderOrder = 6
  return o
}

export function meteo(scene, camera, M, h, { quante = 1 } = {}) {
  const q = new URLSearchParams(location.search)
  const pioggia = particelle(Math.round(3200 * quante), false), neve = particelle(Math.round(2200 * quante), true)
  scene.add(pioggia, neve)
  // la telecamera vede anche il livello 1 (le gocce e i fiocchi), gli specchi e le ombre no
  camera.layers.enable(1)

  // i dati: all'arrivo e ogni dieci minuti
  // (con la barra in fondo: senza, su Vercel, trailingSlash di vercel.json risponde prima con un 308)
  const chiedi = () => fetch('/api/meteo/', { headers: { accept: 'application/json' } })
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => { if (d && d.codice !== undefined) METEO.dati = d })
    .catch(() => {})
  chiedi()
  setInterval(chiedi, 10 * 60 * 1000)

  let prossimoLampo = 0, lampoT = -1, lampi = [], fonte = null, bersaglio = DOPO_PIOGGIA, salta = false, tenuto = false
  const inizio = performance.now()
  const TINTA = { pioggia: new T.Color(0.78, 0.82, 0.88), neve: new T.Color(1, 1, 1) }
  const fulmine = (now) => { lampoT = now; lampi = [0, 90 + Math.random() * 80, 260 + Math.random() * 200].slice(0, 2 + Math.floor(Math.random() * 2)) }

  // ctx: buio (0..1), lampioni (0..1), la vista (il rettangolo di muro che si vede), dov'è la telecamera
  const aggiorna = (dt, now, ctx) => {
    // il bersaglio: la regia, poi ?meteo=, poi i dati, se no il dopo pioggia
    // (si rifà solo quando cambia da dove viene: i dati nuovi, un altro tempo o un'altra intensità dalla regia)
    const forzato = REGIA.meteo ?? (TIPI.includes(q.get('meteo')) ? q.get('meteo') : null)
    const ora = forzato ? `${forzato}:${REGIA.intensita}` : METEO.dati ?? DOPO_PIOGGIA
    // (ctx.tieni: c'è sopra la foto del caricamento, fatta col dopo pioggia: si resta lì, così quando sfuma la scena sotto è
    // identica; poi si va verso il tempo vero sfumando, senza il salto dei primi secondi)
    if (ctx.tieni) tenuto = true
    else if (ora !== fonte) { fonte = ora; bersaglio = forzato ? scelto(forzato, REGIA.intensita) : METEO.dati ? daiDati(METEO.dati) : DOPO_PIOGGIA; salta = !tenuto && now - inizio < 4000 }
    const b = bersaglio
    METEO.tipo = b.tipo
    // ammorbidito: il cielo e la pioggia in un paio di secondi, il bagnato e la neve per terra più piano
    // (nei primi secondi, quando arrivano i dati, si salta subito lì: sfumare vorrebbe dire rifare il cielo una decina
    // di volte mentre la telecamera arriva)
    const k = ctx.tieni ? 0 : salta ? 1 : 1 - Math.exp(-dt / 2.5), kl = ctx.tieni ? 0 : salta ? 1 : 1 - Math.exp(-dt / 7)
    salta = false
    for (const c of ['nuvole', 'pioggia', 'neve', 'nebbia']) METEO[c] += (b[c] - METEO[c]) * k
    METEO.bagnato += ((REGIA.bagnato ?? b.bagnato) - METEO.bagnato) * kl
    METEO.manto += ((REGIA.manto ?? b.manto) - METEO.manto) * kl
    METEO.vento.lerp(b.vento, k)
    const d = METEO.dati
    METEO.testo = forzato ? `${NOMI[b.tipo]} (scelto)` : d ? `${NOMI[b.tipo]}, ${Math.round(d.temperatura)}° a mantova` : 'dopo la pioggia (senza dati)'

    // i lampi del temporale: ogni 4-14 secondi, due o tre colpi
    if (b.temporale && now > prossimoLampo) { fulmine(now); prossimoLampo = now + 4000 + Math.random() * 10000 }
    METEO.lampo = 0
    if (lampoT >= 0) {
      const t = now - lampoT
      for (const l of lampi) { const u = t - l; if (u >= 0 && u < 140) METEO.lampo = Math.max(METEO.lampo, (1 - u / 140) ** 2) }
      if (t > 900) lampoT = -1
    }

    // le uniform del bagnato per i muri, il marciapiede e le pozze (acqua.js, marciapiede.js)
    BAGNO.meteo.value.set(METEO.bagnato, METEO.manto, METEO.pioggia, METEO.neve)

    // la scatola delle gocce: davanti al muro, fra lui e la telecamera, larga quanto si vede
    const v = ctx.vista, cz = camera.position.z, z0 = 0.13, z1 = Math.max(z0 + 0.5, cz - 0.25)
    const tempo = (now / 1000) % 600
    // (di giorno la luce del cielo, di notte quella dei lampioni; il lampo le accende tutte)
    const luce = (0.55 * (1 - 0.4 * METEO.nuvole) + 0.2) * (1 - ctx.buio) + (0.06 + 0.5 * ctx.lampioni) * ctx.buio + 1.5 * METEO.lampo
    for (const [o, quanto] of [[pioggia, METEO.pioggia], [neve, METEO.neve]]) {
      const u = o.material.uniforms
      o.visible = quanto > 0.01
      if (!o.visible) continue
      u.uTempo.value = tempo; u.uQuanta.value = quanto
      u.uCentro.value.set((v.x0 + v.x1) / 2, (v.y0 + v.y1) / 2 + 0.3, (z0 + z1) / 2)
      u.uDim.value.set(v.x1 - v.x0 + 1.6, v.y1 - v.y0 + 2.2, z1 - z0)
      u.uVento.value.copy(METEO.vento)
      u.uColore.value.copy(o === neve ? TINTA.neve : TINTA.pioggia).multiplyScalar(luce)
    }
    return METEO
  }
  // (la regia: un lampo quando si vuole, anche col sereno)
  return { aggiorna, mesh: [pioggia, neve], lampo: () => fulmine(performance.now()) }
}
