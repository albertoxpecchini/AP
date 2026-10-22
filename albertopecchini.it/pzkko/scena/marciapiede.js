// Il marciapiede e le pozzanghere, tutti nello shader, in coordinate del mondo:
// niente trame da scaricare, niente piastrella che si ripete, e il dettaglio
// che regge anche da vicino (in fondo alla pagina la telecamera è a mezzo metro
// da terra: servirebbero più di due pixel di trama per millimetro).
//
// - Le lastre: granito grigio, 60 × 40 cm, a file parallele al muro sfalsate di
//   mezza lastra. Ogni lastra ha il suo tono, un filo d'inclinazione (riflette la
//   luce un po' diversa dalle vicine) e quanto è affondata. La grana a puntini
//   (mica scura, feldspato chiaro) sfuma nel suo grigio medio quando diventa più
//   piccola di un pixel: senza anti-alias, se no tremerebbe. Le fughe nette, lo
//   sporco che ci si accumula vicino, le gomme da masticare schiacciate, l'usura.
// - Le pozzanghere: dove le lastre sono affondate, verso il cordolo (il
//   marciapiede pende verso la strada) e ai piedi del rivolo della condensa
//   (acqua.js). Un campo solo dice dove c'è acqua: la pietra intorno è più
//   scura e lucida, l'acqua è lo specchio della strada (Reflector), più forte
//   radente (Fresnel), increspato dal vento.
import * as T from './lib/three.js'
import { BAGNO } from './acqua.js'
import { Z_FACCIATA } from './materiali.js'

// il telaio del chiusino per le lastre (spazzatura.js lo mette: x e z del centro, mezzo lato)
export const CHIUSINO = { value: new T.Vector4(0, 0, 0, 0) }
// i tocchi nelle pozzanghere (tocchi.js): x, z, quando (il tempo di BAGNO), quanto forte; quattro alla volta
export const ONDE = { value: Array.from({ length: 4 }, () => new T.Vector4(0, 0, -99, 0)) }
let onda = 0
export const tocca = (x, z, forza = 1) => { ONDE.value[onda].set(x, z, BAGNO.tempo.value, forza); onda = (onda + 1) % 4 }

// Il campo dell'acqua di LASTRE_GLSL, rifatto qui uguale (mH, mN, mF, mLastra, mCampo, mGoccia, mAcqua): tocchi.js deve
// sapere se il dito è finito in una pozzanghera. La scheda conta a 32 bit e qui a 64: sul bordo di una pozza si può
// sbagliare di un millimetro
const fr = (v) => v - Math.floor(v)
const mH = (x, y) => { let a = fr(x * 233.34), b = fr(y * 851.73); const d = a * (a + 23.45) + b * (b + 23.45); a += d; b += d; return fr(a * b) }
const mN = (x, y) => {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy)
  const a = mH(ix, iy), b = mH(ix + 1, iy), c = mH(ix, iy + 1), d = mH(ix + 1, iy + 1)
  return (a + (b - a) * ux) + ((c + (d - c) * ux) - (a + (b - a) * ux)) * uy
}
const mF = (x, y) => 0.5 * mN(x, y) + 0.25 * mN(x * 2.03 + 17, y * 2.03 + 17) + 0.125 * mN(x * 4.01 + 31, y * 4.01 + 31) + 0.125 * mN(x * 8.1 + 7, y * 8.1 + 7)
const passo = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }
export function acquaQui(x, y) {
  const z = y - Z_FACCIATA, riga = Math.floor(z / 0.4), xx = x + (((riga % 2) + 2) % 2) * 0.3, col = Math.floor(xx / 0.6)
  const lx = xx - col * 0.6, ly = z - riga * 0.4, C = CHIUSINO.value
  let bordo = Math.min(lx, 0.6 - lx, ly, 0.4 - ly)
  if (C.z > 0) bordo = Math.min(bordo, Math.max(Math.abs(x - C.x) - C.z, Math.abs(y - C.y) - C.z, 0))
  const campo = mF(x * 1.3 + 4, y * 1.3 + 4) + 0.06 * mF(x * 11, y * 11) + 0.2 * passo(0.8, 1, mH(col + 3.7, riga + 3.7)) + 0.3 * passo(1.65, 2.28, y) + 0.05 * (1 - passo(0, 0.008, bordo))
  const P = BAGNO.pozza.value, M = BAGNO.meteo.value
  const goccia = 0.9 - 0.3 * (Math.hypot(x - P.x, (y - P.y) * 1.5) / Math.max(P.z, 0.01)) + 0.06 * mF(x * 9, y * 9)
  // (sotto la neve l'acqua non si vede)
  return M.y > 0.25 ? -1 : Math.max(campo - (1.22 - 0.57 * M.x), goccia - 0.69)
}

export const LASTRE_GLSL = `
float mH( vec2 p ) { p = fract( p * vec2( 233.34, 851.73 ) ); p += dot( p, p + 23.45 ); return fract( p.x * p.y ); }
float mN( vec2 p ) {
  vec2 i = floor( p ), f = fract( p ); f = f * f * ( 3.0 - 2.0 * f );
  return mix( mix( mH( i ), mH( i + vec2( 1.0, 0.0 ) ), f.x ), mix( mH( i + vec2( 0.0, 1.0 ) ), mH( i + vec2( 1.0, 1.0 ) ), f.x ), f.y );
}
float mF( vec2 p ) { return 0.5 * mN( p ) + 0.25 * mN( p * 2.03 + 17.0 ) + 0.125 * mN( p * 4.01 + 31.0 ) + 0.125 * mN( p * 8.1 + 7.0 ); }
// la lastra in cui cade p (x lungo il muro, y = z del mondo): xy il punto dentro la lastra (m), z la distanza dal bordo,
// w il suo numero a caso; id le sue coordinate di lastra. Le lastre intorno al chiusino (spazzatura.js: mChiusino, il
// centro e mezzo lato del telaio quadrato, 0 se non c'è) sono tagliate su di lui: la fuga gli gira intorno
uniform vec4 mChiusino;
vec4 mLastra( vec2 p, out vec2 id ) {
  float z = p.y - ${Z_FACCIATA.toFixed(3)}, riga = floor( z / 0.4 ), x = p.x + mod( riga, 2.0 ) * 0.3, col = floor( x / 0.6 );
  id = vec2( col, riga );
  vec2 l = vec2( x - col * 0.6, z - riga * 0.4 );
  float bordo = min( min( l.x, 0.6 - l.x ), min( l.y, 0.4 - l.y ) );
  vec2 dq = abs( p - mChiusino.xy ) - mChiusino.z;
  if ( mChiusino.z > 0.0 ) bordo = min( bordo, max( max( dq.x, dq.y ), 0.0 ) );
  return vec4( l, bordo, mH( id ) );
}
// dove c'è acqua: mAcqua > 0. Il terreno a chiazze, le lastre affondate (una su cinque, più o meno), le fughe che
// tengono l'acqua vicino alle pozze, la pendenza verso il cordolo; quanta acqua c'è lo dice il meteo (mMeteo.x, il
// bagnato: asciutto, niente pozze; piove, pozze larghe). La pozza della condensa (acqua.js) c'è sempre
uniform vec3 mPozza; uniform vec4 mMeteo;
float mCampo( vec2 p ) {
  vec2 id; vec4 L = mLastra( p, id );
  float c = mF( p * 1.3 + 4.0 ) + 0.06 * mF( p * 11.0 ) + 0.2 * smoothstep( 0.8, 1.0, mH( id + 3.7 ) ) + 0.3 * smoothstep( 1.65, 2.28, p.y );
  return c + 0.05 * ( 1.0 - smoothstep( 0.0, 0.008, L.z ) );
}
float mGoccia( vec2 p ) {
  float dp = length( ( p - mPozza.xy ) * vec2( 1.0, 1.5 ) ) / max( mPozza.z, 0.01 );
  return 0.9 - 0.3 * dp + 0.06 * mF( p * 9.0 );
}
float mAcqua( vec2 p ) { return max( mCampo( p ) - ( 1.22 - 0.57 * mMeteo.x ), mGoccia( p ) - 0.69 ); }
`

// il materiale delle lastre: un MeshStandardMaterial a cui lo shader dà colore, ruvidezza e rilievo
export const lastre = (m) => {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.mPozza = BAGNO.pozza; sh.uniforms.mMeteo = BAGNO.meteo; sh.uniforms.mChiusino = CHIUSINO
    sh.vertexShader = 'varying vec3 vMondo;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vMondo = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;')
    sh.fragmentShader = 'varying vec3 vMondo;\n' + LASTRE_GLSL + sh.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>
      vec2 mId; vec4 mL = mLastra( vMondo.xz, mId );
      vec2 mP = vMondo.xz;
      // quanto è grande un pixel, in metri: ogni grana si vede solo se è più grande di lui (se no resta il suo grigio medio)
      float mPx = length( fwidth( mP ) ), mFine = 1.0 - smoothstep( 0.0004, 0.0012, mPx ), mGrossa = 1.0 - smoothstep( 0.001, 0.003, mPx ), mMedia = 1.0 - smoothstep( 0.006, 0.02, mPx );
      // il tono della lastra: grigi diversi, qualcuna più calda, qualcuna rifatta più chiara
      vec3 mC = mix( vec3( 0.36, 0.365, 0.37 ), vec3( 0.44, 0.415, 0.385 ), mH( mId + 1.3 ) ) * ( 0.82 + 0.3 * mH( mId + 2.1 ) );
      if ( mH( mId + 9.4 ) > 0.93 ) mC *= 1.22;
      // la grana del granito, a tre misure: i grani grossi scuri, la mica fine scura, il feldspato chiaro
      float mG0 = smoothstep( 0.8, 0.86, mN( mP * 330.0 + 3.0 ) ), mG1 = smoothstep( 0.7, 0.76, mN( mP * 800.0 + mId * 7.0 ) ), mG2 = smoothstep( 0.76, 0.82, mN( mP * 1500.0 + 9.0 ) );
      mC *= mix( 0.97, 1.0 - 0.3 * mG0, mGrossa ) * mix( 0.95, ( 1.0 - 0.25 * mG1 ) * ( 1.0 + 0.3 * mG2 ), mFine );
      // e una grana più morbida, sempre (il granito da lontano non è liscio)
      mC *= mix( 1.0, 0.9 + 0.2 * mN( mP * 120.0 + 1.7 ), mMedia );
      // l'usura, lo sporco largo (si cammina di più nel mezzo), lo sporco verso le fughe
      mC *= ( 0.86 + 0.28 * mF( mP * 7.0 + mId * 3.1 ) ) * ( 0.85 + 0.3 * mF( mP * 0.7 + 11.0 ) );
      mC *= mix( 0.92, 0.72 + 0.28 * smoothstep( 0.0, 0.035, mL.z ), mMedia );
      // le gomme da masticare schiacciate: una ogni tanto, grigio scuro col bordo più chiaro
      vec2 mCe = floor( mP / 0.23 );
      if ( mH( mCe + 5.1 ) < 0.32 ) {
        vec2 mQ = ( mCe + 0.2 + 0.6 * vec2( mH( mCe + 1.1 ), mH( mCe + 2.2 ) ) ) * 0.23;
        float mR = 0.005 + 0.007 * mH( mCe + 3.3 ), mD = length( mP - mQ ) / mR;
        mC = mix( mC, vec3( 0.2, 0.2, 0.19 ), ( 1.0 - smoothstep( 0.75, 1.0, mD ) ) * 0.8 );
        mC *= 1.0 + 0.25 * ( smoothstep( 0.7, 0.9, mD ) - smoothstep( 0.9, 1.15, mD ) );
      }
      // la fuga: 6 mm di sabbia scura, netta a ogni distanza
      float mFw = fwidth( mL.z ) + 1e-5, mFuga = 1.0 - smoothstep( 0.003 - mFw, 0.003 + mFw, mL.z );
      mC = mix( mC, vec3( 0.075, 0.07, 0.065 ), mFuga );
      // bagnato quanto dice il meteo: tutto un po', a chiazze lucide, molto vicino alle pozze
      float mBagno = mMeteo.x, mUmido = smoothstep( -0.12, 0.0, mAcqua( mP ) ), mVelo = smoothstep( 0.5, 0.62, mF( mP * 2.3 + 5.0 ) ) * mBagno;
      mC *= mix( 0.97, 0.76, mBagno ) * ( 1.0 - 0.18 * mVelo ) * ( 1.0 - 0.42 * mUmido );
      // la neve per terra, solo quando c'è (sono tredici rumori a pixel: senza, il marciapiede andava a tre quarti): prima
      // a chiazze (nelle fughe e dove le lastre sono basse resta di più), poi tutta; non un foglio bianco ma più e meno
      // spessa, qualche chiazza pestata e grigia, le fughe che si indovinano finché è poca
      float mNeve = 0.0;
      if ( mMeteo.y > 0.002 ) {
        mNeve = smoothstep( 0.0, 0.3, mMeteo.y * 1.4 - 0.45 + 0.5 * mF( mP * 2.6 + 9.0 ) + 0.15 * mFuga );
        vec3 mBianco = vec3( 0.88, 0.9, 0.94 ) * ( 0.94 + 0.06 * mN( mP * 300.0 ) ) * ( 0.9 + 0.1 * mF( mP * 1.7 + 3.0 ) );
        mBianco *= ( 1.0 - 0.3 * smoothstep( 0.55, 0.85, mF( mP * 0.9 + 21.0 ) ) ) * ( 1.0 - 0.14 * mFuga * ( 1.0 - smoothstep( 0.6, 1.0, mMeteo.y ) ) );
        mC = mix( mC, mBianco, mNeve );
      }
      diffuseColor.rgb = mC;`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
      // (mai sotto 0,2: una pietra lucidissima sui bordi smussati fa scintille, di notte; l'acqua vera è lo specchio)
      roughnessFactor = mix( mix( mix( mix( 0.62, 0.5, mBagno ), 0.26, mVelo ), 0.92, mFuga ), 0.2, mUmido * mBagno + mUmido * 0.3 );
      roughnessFactor = mix( roughnessFactor, 0.85, mNeve );`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
      // (la telecamera non è ruotata: x e z del mondo sono x e z della vista) ogni lastra un po' storta, il bordo smussato,
      // la grana
      vec2 mT = ( vec2( mH( mId + 7.7 ), mH( mId + 8.8 ) ) - 0.5 ) * 0.07;
      vec2 mB = vec2( mL.x < 0.3 ? 1.0 : -1.0, mL.y < 0.2 ? 1.0 : -1.0 ) * ( abs( mL.x - 0.3 ) > abs( mL.y - 0.2 ) * 1.5 ? vec2( 1.0, 0.0 ) : vec2( 0.0, 1.0 ) );
      mT += mB * 0.25 * ( 1.0 - smoothstep( 0.0, 0.01, mL.z ) ) * mMedia * ( 1.0 - mUmido );
      mT += ( vec2( mN( mP * 700.0 ), mN( mP * 700.0 + 5.0 ) ) - 0.5 ) * 0.12 * mFine;
      normal = normalize( normal + vec3( mT.x, 0.0, mT.y ) * ( 1.0 - mNeve ) );`)
  }
  m.customProgramCacheKey = () => 'lastre'
  return m
}

// lo specchio delle pozzanghere (il Reflector di three): disegna solo dove c'è acqua, col bordo netto, il riflesso
// mosso dal vento e più forte radente; sotto, la pietra bagnata si vede poco
export const SPECCHIO_POZZE = {
  name: 'pozze',
  uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null }, opacita: { value: 1 }, mPozza: BAGNO.pozza, mTempo: BAGNO.tempo, mMeteo: BAGNO.meteo, mChiusino: CHIUSINO, mOnde: ONDE },
  vertexShader: `uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vMondo;
    #include <common>
    #include <logdepthbuf_pars_vertex>
    void main() { vUv = textureMatrix * vec4( position, 1.0 ); vMondo = ( modelMatrix * vec4( position, 1.0 ) ).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    #include <logdepthbuf_vertex>
    }`,
  fragmentShader: `uniform vec3 color; uniform sampler2D tDiffuse; uniform float opacita, mTempo; uniform vec4 mOnde[ 4 ]; varying vec4 vUv; varying vec3 vMondo;
    ${LASTRE_GLSL}
    #include <logdepthbuf_pars_fragment>
    void main() {
    #include <logdepthbuf_fragment>
      // (sotto la neve l'acqua non si vede)
      float c = mAcqua( vMondo.xz ), w = fwidth( c ) * 1.2 + 0.0015, acqua = smoothstep( -w, w, c ) * ( 1.0 - smoothstep( 0.25, 0.7, mMeteo.y ) );
      if ( acqua < 0.004 ) discard;
      // il vento increspa l'acqua: il riflesso trema un poco (più al largo che sul bordo)
      vec2 p = vMondo.xz * 14.0;
      vec2 n = vec2( mN( p + vec2( mTempo * 0.45, 0.0 ) ), mN( p * 1.3 + vec2( 3.0, mTempo * 0.33 ) ) ) - 0.5;
      // la pioggia nelle pozze: in ogni cella di 9 cm, se piove abbastanza, un cerchio che si allarga e sparisce
      vec2 cr = vMondo.xz / 0.09, ci = floor( cr ), cf = fract( cr ) - 0.5;
      float hc = mH( ci + 13.0 ), anello = 0.0;
      if ( hc < mMeteo.z * 0.9 ) {
        vec2 c0 = ( vec2( mH( ci + 1.7 ), mH( ci + 4.1 ) ) - 0.5 ) * 0.2;
        float t = fract( mTempo * ( 0.9 + hc ) + mH( ci + 9.3 ) ), dd = length( cf - c0 );
        anello = exp( -pow( ( dd - t * 0.3 ) / 0.03, 2.0 ) ) * ( 1.0 - t );
        n += ( cf - c0 ) / max( dd, 1e-3 ) * anello * 0.8;
      }
      // i tocchi (tocchi.js): tre anelli che si allargano dal dito, uno dietro l'altro, e in due secondi si spengono
      for ( int i = 0; i < 4; i++ ) {
        vec4 o = mOnde[ i ];
        float eta = mTempo - o.z;
        if ( eta < 0.0 || eta > 2.2 ) continue;
        vec2 dv = vMondo.xz - o.xy; float dd = length( dv );
        for ( int k = 0; k < 3; k++ ) {
          float r = ( eta - float( k ) * 0.17 ) * 0.24;
          if ( r <= 0.0 ) continue;
          float a = exp( -pow( ( dd - r ) / ( 0.01 + r * 0.06 ), 2.0 ) ) * pow( 1.0 - eta / 2.2, 1.5 ) * o.w * ( 1.0 - float( k ) * 0.3 );
          n += dv / max( dd, 1e-3 ) * a * 1.4;
          anello += a * 0.9;
        }
      }
      vec4 uv = vUv; uv.xy += n * 0.014 * smoothstep( 0.0, 0.06, c ) * uv.w;
      vec3 rif = texture2DProj( tDiffuse, uv ).rgb * color;
      // Fresnel (dell'acqua, un po' più forte del vero) e l'acqua torbida scura dove non riflette
      vec3 v = normalize( cameraPosition - vMondo );
      float f = 0.04 + 0.96 * pow( 1.0 - clamp( v.y, 0.0, 1.0 ), 5.0 ), r = 0.38 + 0.62 * f;
      gl_FragColor = vec4( rif * r + vec3( 0.012, 0.011, 0.009 ) * ( 1.0 - r ) + anello * 0.06, acqua * opacita * 0.9 );
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    }`,
}
