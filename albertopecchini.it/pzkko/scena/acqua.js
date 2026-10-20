// L'acqua. La condensa dei condizionatori scende dal tetto in un tubo grigio
// appoggiato alla facciata, entra nel buco della saracinesca sotto l'architrave
// e finisce contro la lamiera, a destra dell'insegna: lì la goccia si gonfia,
// si stacca e scende lungo la lamiera (e sopra i fogli che incontra) a scatti,
// come fanno le gocce su una superficie verniciata: si ferma dove si attacca,
// riparte quando la raggiunge un'altra, perde acqua per strada. In fondo passa
// sulla barra, ci resta appesa, cade sulla soglia: uno schizzo, un cerchio
// nella pozza. Dove scende l'acqua il muro è bagnato davvero: un rivolo scuro
// e lucido che si allarga verso il basso e nei giunti delle doghe, col velo
// d'acqua che scorre (la normale si muove verso il basso); in basso gli schizzi
// della pioggia per una ventina di centimetri, sull'intonaco l'umidità che sale
// dal terreno col bordo bianco del salnitro, sul marciapiede la pozza ai piedi
// del rivolo (trasparente: sotto c'è lo specchio delle pozzanghere).
//
// Il bagnato è uno shader solo (bagnato(materiale, tipo)), in comune fra la
// lamiera, la carta, l'intonaco, la pietra e le lastre: lavora sulla posizione
// nel mondo, quindi il rivolo passa dalla lamiera ai fogli senza giunte.
import * as T from './lib/three.js'
import { tuboSpezzato, tela, DOGA, Z_FACCIATA, REGIA } from './materiali.js'

// le uniform in comune: il tempo (il velo che scorre), il rivolo (x del tubo, y in cima, y in fondo, y del giunto in
// cima al rotolo: la fase delle doghe), la pozza ai suoi piedi (x, z, raggio) e il tubo sulla facciata (x, y del buco,
// y dell'architrave: lungo il tubo la condensa cola e l'intonaco è umido)
export const BAGNO = { tempo: { value: 0 }, rivolo: { value: new T.Vector4(1, 3, 0.07, 3.3) }, pozza: { value: new T.Vector3(1, 0.15, 0.2) }, tubo: { value: new T.Vector3(1, 4, 3) } }

// la linea del rivolo: l'acqua non scende dritta, la portano di qua e di là le ammaccature e lo sporco. La stessa
// funzione in GLSL (bCentro) e qui (centro), così le gocce stanno sul bagnato
const centro = (x0, y) => x0 + 0.01 * Math.sin(y * 5.3 + 1.7) + 0.006 * Math.sin(y * 13.1 + 0.4) + 0.003 * Math.sin(y * 37)

const GLSL = `
uniform float bTempo; uniform vec4 bRivolo; uniform vec3 bPozza, bTubo;
varying vec3 vBagnoPos;
float bHash( vec2 p ) { p = fract( p * vec2( 123.34, 456.21 ) ); p += dot( p, p + 45.32 ); return fract( p.x * p.y ); }
float bRumore( vec2 p ) {
  vec2 i = floor( p ), f = fract( p ); f = f * f * ( 3.0 - 2.0 * f );
  return mix( mix( bHash( i ), bHash( i + vec2( 1.0, 0.0 ) ), f.x ), mix( bHash( i + vec2( 0.0, 1.0 ) ), bHash( i + vec2( 1.0, 1.0 ) ), f.x ), f.y );
}
float bCentro( float y ) { return bRivolo.x + 0.01 * sin( y * 5.3 + 1.7 ) + 0.006 * sin( y * 13.1 + 0.4 ) + 0.003 * sin( y * 37.0 ); }
// w: bagnato (scurisce), v: velo d'acqua (lucido; sulle lastre la pozza), s: il bordo del salnitro, n: la spinta della normale
void bagno( vec3 p, out float w, out float v, out float s, out vec2 n ) {
  w = 0.0; v = 0.0; s = 0.0; n = vec2( 0.0 );
  // il rivolo, sulla saracinesca e sui fogli (fino a 8 cm dalla lamiera: i fogli alzati), fin sulla barra in fondo
  if ( p.z < 0.08 && p.y < bRivolo.y + 0.004 && p.y > -0.03 && abs( p.x - bRivolo.x ) < 0.16 ) {
    float t = clamp( ( bRivolo.y - p.y ) / max( bRivolo.y - bRivolo.z, 0.1 ), 0.0, 1.0 );
    float u = fract( ( bRivolo.w - p.y ) / ${DOGA} ), giunto = exp( -pow( min( u, 1.0 - u ) / 0.07, 2.0 ) );
    float larg = ( 0.006 + 0.019 * sqrt( t ) ) * ( 1.0 + 0.9 * giunto ) * smoothstep( -0.004, 0.01, bRivolo.y - p.y );
    float r = bRumore( vec2( p.x * 160.0, p.y * 40.0 ) ) * 0.6 + bRumore( vec2( p.x * 40.0, p.y * 9.0 ) ) * 0.4;
    float d = abs( p.x - bCentro( p.y ) ) / max( larg * ( 0.7 + 0.6 * r ), 1e-4 );
    w = 1.0 - smoothstep( 0.55, 1.0, d );
    v = ( 1.0 - smoothstep( 0.12, 0.55, d ) ) * ( 0.8 + 0.2 * sin( p.y * 61.0 + bTempo * 9.0 ) );
    // il velo scende: onde che vanno verso il basso, storte di rumore
    float onda = ( p.y + bTempo * 0.11 ) * 70.0 + bRumore( vec2( p.x * 300.0, p.y * 20.0 ) ) * 5.0;
    n = vec2( ( bRumore( vec2( p.x * 500.0, ( p.y + bTempo * 0.14 ) * 90.0 ) ) - 0.5 ) * 0.7, sin( onda ) * 0.45 ) * v;
  }
  // in basso, gli schizzi della pioggia: umido per 20-40 cm, non lucido
  float fondo = 1.0 - smoothstep( 0.1 + 0.12 * bRumore( vec2( p.x * 6.0, 2.0 ) ), 0.26 + 0.16 * bRumore( vec2( p.x * 2.3, 7.0 ) ), p.y );
  w = max( w, 0.65 * fondo * ( 0.7 + 0.3 * bRumore( p.xy * 30.0 ) ) );
#if BAGNO_TIPO == 1
  // l'umidità che sale dal terreno nell'intonaco, fino a 0,7-1,1 m, col bordo bianco del salnitro
  float hR = 0.78 + 0.22 * bRumore( vec2( p.x * 1.3, 3.0 ) ) + 0.05 * bRumore( vec2( p.x * 11.0, 5.0 ) );
  w = max( w, 0.5 * ( 1.0 - smoothstep( hR - 0.12, hR, p.y ) ) * ( 0.75 + 0.25 * bRumore( p.xy * 14.0 ) ) );
  s = smoothstep( hR - 0.07, hR - 0.015, p.y ) * ( 1.0 - smoothstep( hR - 0.005, hR + 0.025, p.y ) ) * ( 0.5 + 0.5 * bRumore( p.xy * 40.0 ) );
  // sotto il buco del tubo la condensa cola lungo il tubo: una riga d'umido, larga in cima, con lo sporco che si porta dietro
  if ( p.y < bTubo.y && p.y > bTubo.z - 0.02 && p.z > 0.09 ) {
    float k = ( bTubo.y - p.y ) / max( bTubo.y - bTubo.z, 0.1 );
    float d = abs( p.x - bTubo.x - 0.03 * ( 1.0 - k ) * ( 1.0 - k ) ) / ( ( 0.022 - 0.01 * k ) * ( 0.7 + 0.6 * bRumore( vec2( p.x * 90.0, p.y * 12.0 ) ) ) );
    w = max( w, 0.7 * ( 1.0 - smoothstep( 0.5, 1.0, d ) ) );
  }
#endif
#if BAGNO_TIPO == 4
  // la pozza ai piedi del rivolo, sulla soglia (sul marciapiede la fa marciapiede.js): acqua ferma, intorno l'umido
  if ( p.y < 0.03 ) {
    float dp = length( ( p.xz - bPozza.xy ) * vec2( 1.0, 1.5 ) ) / ( bPozza.z * ( 0.75 + 0.5 * bRumore( p.xz * 9.0 ) ) );
    w = max( w, 1.0 - smoothstep( 0.85, 1.6, dp ) );
    v = max( v, 1.0 - smoothstep( 0.65, 1.0, dp ) );
  }
#endif
}
`
// tipo: 0 lamiera, 1 intonaco, 2 carta (e la vernice chiara), 4 pietra (il 3 erano le lastre: ora marciapiede.js)
const COLORE = {
  0: 'diffuseColor.rgb *= 1.0 - 0.62 * bW;',
  1: 'diffuseColor.rgb *= 1.0 - 0.5 * bW; diffuseColor.rgb = mix( diffuseColor.rgb, vec3( 0.86, 0.85, 0.8 ), 0.5 * bS );',
  2: 'diffuseColor.rgb = pow( max( diffuseColor.rgb, 0.0 ), vec3( 1.0 + 0.8 * bW ) ) * ( 1.0 - 0.4 * bW );',
  4: 'diffuseColor.rgb *= 1.0 - 0.5 * bW;',
}
// mette il bagnato su un materiale, dopo quello che il materiale fa già (onBeforeCompile); la chiave del programma
// dice il tipo e la funzione di prima, così materiali diversi non si scambiano i programmi
export const bagnato = (m, tipo) => {
  const prima = Object.prototype.hasOwnProperty.call(m, 'onBeforeCompile') ? m.onBeforeCompile : null
  m.onBeforeCompile = (sh, r) => {
    if (prima) prima(sh, r)
    sh.uniforms.bTempo = BAGNO.tempo; sh.uniforms.bRivolo = BAGNO.rivolo; sh.uniforms.bPozza = BAGNO.pozza; sh.uniforms.bTubo = BAGNO.tubo
    sh.vertexShader = 'varying vec3 vBagnoPos;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vBagnoPos = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;')
    sh.fragmentShader = `#define BAGNO_TIPO ${tipo}\n${GLSL}\n` + sh.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>\n float bW, bV, bS; vec2 bN; bagno( vBagnoPos, bW, bV, bS, bN );\n ${COLORE[tipo]}`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = mix( roughnessFactor, 0.05, bV ) * ( 1.0 - 0.25 * bW );')
      .replace('#include <normal_fragment_maps>', tipo === 4 ? '#include <normal_fragment_maps>' : '#include <normal_fragment_maps>\n normal = normalize( normal + vec3( bN, 0.0 ) );')
  }
  const chiave = `bagno${tipo}:${prima ? prima.toString() : ''}`
  m.customProgramCacheKey = () => chiave
}

// l'acqua che si vede: il tubo, le gocce, gli schizzi, i cerchi. f: i fogli (la superficie su cui scendono le gocce)
export function acqua(scene, M, h, f) {
  const { W, H } = M
  // il tubo arriva fra la fine dell'insegna e la guida di destra; la goccia nasce 6 cm sotto l'architrave
  const X = (h.insegna.x0 + h.insegna.LARG + W) / 2, Y0 = H - 0.06, Y1 = 0.07
  BAGNO.rivolo.value.set(X, Y0, Y1, f.lam.y1)
  // la pozza: davanti alla soglia, sotto il punto in cui il rivolo arriva in fondo
  const xFondo = centro(X, 0.02)
  BAGNO.pozza.value.set(xFondo, Z_FACCIATA + 0.1, 0.3 * Math.min(1, W / 1.2 + 0.3))

  // ── il tubo della condensa: quello dello split di sopra, che esce dal muro sotto la finestra (un buco col
  // rosone di plastica), scende grigio e flessibile lungo la facciata, fissato con le graffe; sotto l'architrave rientra
  // e finisce contro la lamiera, con la bocca verso il basso ──
  {
    const zf = Z_FACCIATA + 0.012, r = 0.0075, xb = X + 0.05, yb = H + 0.9
    const guida = [[xb, yb, Z_FACCIATA - 0.03], [xb, yb, Z_FACCIATA + 0.008], [xb - 0.008, yb - 0.04, zf + 0.004], [X + 0.02, H + 0.7, zf], [X + 0.004, H + 0.4, zf], [X, H + 0.17, zf], [X, H + 0.075, zf + 0.004],
      [X, H + 0.035, 0.07], [X, H - 0.005, 0.03], [X, H - 0.035, 0.016], [X, Y0 + 0.006, 0.013]].map((p) => new T.Vector3(...p))
    BAGNO.tubo.value.set(X + 0.012, yb - 0.01, H + 0.08)
    const rosone = new T.Mesh(new T.CylinderGeometry(0.022, 0.024, 0.006, 20), new T.MeshStandardMaterial({ color: 0xd9d6cf, roughness: 0.6 }))
    rosone.rotation.x = Math.PI / 2; rosone.position.set(xb, yb, Z_FACCIATA + 0.003); rosone.castShadow = true; rosone.receiveShadow = true; scene.add(rosone)
    // una curva morbida fra i punti (Catmull-Rom), come fa un tubo di plastica
    const pts = []
    for (let i = 0; i < guida.length - 1; i++) {
      const p0 = guida[Math.max(0, i - 1)], p1 = guida[i], p2 = guida[i + 1], p3 = guida[Math.min(guida.length - 1, i + 2)]
      const n = Math.max(2, Math.ceil(p1.distanceTo(p2) / 0.02))
      for (let k = 0; k < n; k++) {
        const t = k / n, t2 = t * t, t3 = t2 * t
        pts.push(new T.Vector3().addScaledVector(p0, -0.5 * t3 + t2 - 0.5 * t).addScaledVector(p1, 1.5 * t3 - 2.5 * t2 + 1).addScaledVector(p2, -1.5 * t3 + 2 * t2 + 0.5 * t).addScaledVector(p3, 0.5 * t3 - 0.5 * t2))
      }
    }
    pts.push(guida.at(-1))
    const mTubo = new T.MeshStandardMaterial({ color: 0x9fa3a4, roughness: 0.55, metalness: 0 })
    const tubo = new T.Mesh(tuboSpezzato(pts, r, 10), mTubo)
    tubo.castShadow = true; tubo.receiveShadow = true; scene.add(tubo)
    // la bocca: dentro è scura
    const bocca = new T.Mesh(new T.CircleGeometry(r * 0.75, 12), new T.MeshStandardMaterial({ color: 0x1a1c1d, roughness: 0.9 }))
    bocca.rotation.x = Math.PI / 2; bocca.position.copy(guida.at(-1)); scene.add(bocca)
    // le graffe sulla facciata
    const mGraffa = new T.MeshStandardMaterial({ color: 0x6d7173, roughness: 0.5, metalness: 0.6 })
    for (const [x, y] of [[X + 0.006, H + 0.5], [X + 0.001, H + 0.22]]) {
      const g = new T.Mesh(new T.BoxGeometry(0.03, 0.012, 0.022), mGraffa)
      g.position.set(x, y, zf + 0.002); g.castShadow = true; scene.add(g)
    }
  }

  // ── le gocce: una mesh a istanze per le gocce d'acqua (quella che si gonfia alla bocca, quelle che scendono, quella
  // appesa alla barra, quelle che cadono) e una per gli schizzi; i cerchi nella pozza, a parte ──
  const mAcqua = new T.MeshPhysicalMaterial({ color: 0xaab8be, roughness: 0.03, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02, transparent: true, opacity: 0.6, depthWrite: false })
  const sfera = new T.SphereGeometry(1, 14, 10)
  const gocceM = new T.InstancedMesh(sfera, mAcqua, 16), schizziM = new T.InstancedMesh(new T.SphereGeometry(1, 6, 4), mAcqua, 24)
  for (const o of [gocceM, schizziM]) { o.instanceMatrix.setUsage(T.DynamicDrawUsage); o.count = 0; o.frustumCulled = false; scene.add(o) }
  // il cerchio: un anello sottile disegnato su una tela, che si allarga e sparisce; la luce lo fa brillare (sommato)
  const anello = (() => {
    const c = tela(128), ctx = c.getContext('2d'), g = ctx.createRadialGradient(64, 64, 40, 64, 64, 63)
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.55, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128)
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace
    return t
  })()
  const mCerchio = new T.MeshBasicMaterial({ map: anello, transparent: true, blending: T.AdditiveBlending, depthWrite: false, color: 0x666666 })
  const piano = new T.PlaneGeometry(1, 1); piano.rotateX(-Math.PI / 2)
  const cerchiM = new T.InstancedMesh(piano, mCerchio, 6)
  // (il colore per istanza c'è da subito: crearlo al primo cerchio cambierebbe il programma, da ricompilare lì)
  const tinta = new T.Color(1, 1, 1)
  for (let i = 0; i < 6; i++) cerchiM.setColorAt(i, tinta)
  cerchiM.instanceMatrix.setUsage(T.DynamicDrawUsage); cerchiM.count = 0; cerchiM.frustumCulled = false; scene.add(cerchiM)

  // dove si attacca la goccia: un rumore lungo il rivolo (fisso), e dove la lamiera è più ruvida si ferma
  const attacco = (y) => 0.5 + 0.3 * Math.sin(y * 23.7 + 1.3) + 0.2 * Math.sin(y * 61.3 + 0.2)
  // lo stato: la goccia alla bocca (cresce), quelle che scendono, quella appesa in fondo, quelle che cadono, gli schizzi, i cerchi
  let gonfia = 0, periodo = 4
  const scendono = [], cadono = [], schizzi = [], cerchi = []
  let appesa = null
  const ridotto = matchMedia('(prefers-reduced-motion: reduce)').matches
  const m4 = new T.Matrix4(), q = new T.Quaternion(), sc = new T.Vector3(), po = new T.Vector3()
  const zSu = (x, y) => (y < Y1 ? 0.0245 : f.superficie(x, y).z)

  const cade = (x, y, z) => cadono.push({ x, y, z, v: 0 })
  const tocca = (x, z) => {
    // la goccia arriva sulla soglia: uno schizzo di goccioline e un cerchio
    const n = 4 + Math.floor(Math.random() * 5)
    for (let i = 0; i < n && schizzi.length < 24; i++) {
      const a = Math.random() * Math.PI * 2, v = 0.25 + Math.random() * 0.45
      schizzi.push({ x, y: 0.002, z, vx: Math.cos(a) * v * 0.6, vy: 0.4 + Math.random() * 0.6, vz: Math.abs(Math.sin(a)) * v * 0.6, t: 0, r: 0.0009 + Math.random() * 0.0011 })
    }
    if (cerchi.length < 6) cerchi.push({ x, z, t: 0 })
  }

  const aggiorna = (dt, now) => {
    BAGNO.tempo.value = (now / 1000) % 1000
    if (ridotto) dt = 0
    // la goccia alla bocca: si gonfia, poi si stacca e comincia a scendere
    gonfia += dt / periodo
    if (gonfia >= 1) { gonfia = 0; periodo = (3 + Math.random() * 6) * REGIA.goccia; if (scendono.length < 10) scendono.push({ y: Y0 - 0.004, v: 0.03, m: 1, ferma: 0, dx: 0 }) }
    // le gocce che scendono: più sono grosse più vanno; dove la lamiera le trattiene si fermano (le piccole), finché
    // un'altra le raggiunge e se le porta via; per strada lasciano acqua e calano
    for (const g of scendono) {
      if (g.ferma > 0) { g.ferma -= dt; g.v = 0; continue }
      const vt = 0.04 + 0.32 * Math.min(1, Math.max(0, g.m - 0.25))
      g.v += (vt - g.v) * Math.min(1, dt * 5)
      const dy = g.v * dt
      g.y -= dy; g.m -= 0.06 * dy
      if (g.m < 0.75 && attacco(g.y) > 0.82 && Math.random() < dt * 4) g.ferma = 0.6 + Math.random() * 4 * (1.2 - g.m)
    }
    // si raggiungono: la più alta si unisce alla più bassa, che riparte
    scendono.sort((a, b) => b.y - a.y)
    for (let i = scendono.length - 1; i > 0; i--) {
      const a = scendono[i - 1], b = scendono[i]
      if (a.y - b.y < 0.005) { b.m += a.m * 0.9; b.ferma = 0; b.v = Math.max(b.v, a.v); scendono.splice(i - 1, 1) }
    }
    for (let i = scendono.length - 1; i >= 0; i--) {
      const g = scendono[i]
      // asciugata (troppo piccola per scendere ancora): resta lì e sparisce piano
      if (g.m < 0.2) { g.m -= dt * 0.01; if (g.m < 0.05) scendono.splice(i, 1); else g.ferma = 1; continue }
      // in fondo: scende sulla barra e ci resta appesa
      if (g.y < 0.012) { scendono.splice(i, 1); if (appesa) appesa.m += g.m; else appesa = { m: g.m, t: 0.3 + Math.random() * 0.9 } }
    }
    // la goccia appesa alla barra: cresce un attimo e cade sulla soglia
    if (appesa) { appesa.t -= dt; if (appesa.t <= 0) { cade(xFondo, 0.01, 0.028); appesa = null } }
    for (let i = cadono.length - 1; i >= 0; i--) {
      const g = cadono[i]
      g.v += 9.8 * dt; g.y -= g.v * dt
      if (g.y <= 0.002) { tocca(g.x, g.z); cadono.splice(i, 1) }
    }
    for (let i = schizzi.length - 1; i >= 0; i--) {
      const s = schizzi[i]
      s.t += dt; s.vy -= 9.8 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt
      if (s.y < 0 || s.t > 0.6) schizzi.splice(i, 1)
    }
    for (let i = cerchi.length - 1; i >= 0; i--) { cerchi[i].t += dt; if (cerchi[i].t > 0.9) cerchi.splice(i, 1) }

    // ── le istanze ──
    let n = 0
    const metti = (mesh, i, x, y, z, rx, ry, rz) => { po.set(x, y, z); sc.set(rx, ry, rz); m4.compose(po, q, sc); mesh.setMatrixAt(i, m4) }
    // alla bocca: tonda, appesa sotto, e quando è grossa si allunga
    const rb = 0.0048 * Math.cbrt(gonfia)
    if (rb > 0.0006) metti(gocceM, n++, X, Y0 - rb * 0.9, zSu(X, Y0) + rb * 0.75, rb, rb * (1 + 0.35 * gonfia * gonfia), rb * 0.8)
    for (const g of scendono) {
      if (n >= 15) break
      const r = 0.0026 * Math.cbrt(Math.max(0.05, g.m)), x = centro(X, g.y), z = zSu(x, g.y)
      // schiacciata contro il muro, allungata quando corre
      metti(gocceM, n++, x, g.y + r * 0.3, z + r * 0.35, r, r * (1 + Math.min(1.4, g.v * 6)), r * 0.55)
    }
    if (appesa && n < 16) { const r = 0.0028 * Math.cbrt(appesa.m + 0.5); metti(gocceM, n++, xFondo, 0.012 - r, 0.0245 + r * 0.6, r, r * 1.25, r) }
    for (const g of cadono) { if (n >= 16) break; metti(gocceM, n++, g.x, g.y, g.z, 0.0024, 0.0024 * (1 + g.v * 0.6), 0.0024) }
    gocceM.count = n; gocceM.instanceMatrix.needsUpdate = true
    n = 0
    for (const s of schizzi) { const r = s.r * (1 - s.t / 0.6); metti(schizziM, n++, s.x, s.y, s.z, r, r, r) }
    schizziM.count = n; schizziM.instanceMatrix.needsUpdate = true
    n = 0
    for (const c of cerchi) { const r = 0.006 + c.t * 0.06; metti(cerchiM, n, c.x, 0.0006, c.z, r, 1, r); cerchiM.setColorAt(n++, tinta.setScalar(1 - c.t / 0.9)) }
    cerchiM.count = n; cerchiM.instanceMatrix.needsUpdate = true; cerchiM.instanceColor.needsUpdate = true
  }
  // il colore dei cerchi segue la luce che c'è (di notte quasi non si vedono)
  const luce = (buio) => { mCerchio.color.setScalar(0.35 * (1 - buio) + 0.08) }
  // goccia: la prossima si stacca subito (la regia)
  return { aggiorna, luce, goccia: () => { gonfia = Math.max(gonfia, 0.97) }, mesh: [gocceM, schizziM, cerchiM] }
}
