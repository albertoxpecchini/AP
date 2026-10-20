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
import { BAGNO } from './acqua.js'
import { Z_FACCIATA } from './materiali.js'

export const LASTRE_GLSL = `
float mH( vec2 p ) { p = fract( p * vec2( 233.34, 851.73 ) ); p += dot( p, p + 23.45 ); return fract( p.x * p.y ); }
float mN( vec2 p ) {
  vec2 i = floor( p ), f = fract( p ); f = f * f * ( 3.0 - 2.0 * f );
  return mix( mix( mH( i ), mH( i + vec2( 1.0, 0.0 ) ), f.x ), mix( mH( i + vec2( 0.0, 1.0 ) ), mH( i + vec2( 1.0, 1.0 ) ), f.x ), f.y );
}
float mF( vec2 p ) { return 0.5 * mN( p ) + 0.25 * mN( p * 2.03 + 17.0 ) + 0.125 * mN( p * 4.01 + 31.0 ) + 0.125 * mN( p * 8.1 + 7.0 ); }
// la lastra in cui cade p (x lungo il muro, y = z del mondo): xy il punto dentro la lastra (m), z la distanza dal bordo,
// w il suo numero a caso; id le sue coordinate di lastra
vec4 mLastra( vec2 p, out vec2 id ) {
  float z = p.y - ${Z_FACCIATA.toFixed(3)}, riga = floor( z / 0.4 ), x = p.x + mod( riga, 2.0 ) * 0.3, col = floor( x / 0.6 );
  id = vec2( col, riga );
  vec2 l = vec2( x - col * 0.6, z - riga * 0.4 );
  return vec4( l, min( min( l.x, 0.6 - l.x ), min( l.y, 0.4 - l.y ) ), mH( id ) );
}
// dove c'è acqua: più di M_SOGLIA. Il terreno a chiazze, le lastre affondate (una su cinque, più o meno), le fughe che
// tengono l'acqua vicino alle pozze, la pendenza verso il cordolo, la pozza della condensa (acqua.js)
uniform vec3 mPozza;
float mCampo( vec2 p ) {
  vec2 id; vec4 L = mLastra( p, id );
  float c = mF( p * 1.3 + 4.0 ) + 0.06 * mF( p * 11.0 ) + 0.2 * smoothstep( 0.8, 1.0, mH( id + 3.7 ) ) + 0.3 * smoothstep( 1.65, 2.28, p.y );
  c += 0.05 * ( 1.0 - smoothstep( 0.0, 0.008, L.z ) );
  float dp = length( ( p - mPozza.xy ) * vec2( 1.0, 1.5 ) ) / max( mPozza.z, 0.01 );
  return max( c, 0.9 - 0.3 * dp + 0.06 * mF( p * 9.0 ) );
}
const float M_SOGLIA = 0.69;
`

// il materiale delle lastre: un MeshStandardMaterial a cui lo shader dà colore, ruvidezza e rilievo
export const lastre = (m) => {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.mPozza = BAGNO.pozza
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
      // bagnato: tutto un po' (ha piovuto), a chiazze lucide, molto vicino alle pozze
      float mAcqua = mCampo( mP ), mUmido = smoothstep( M_SOGLIA - 0.12, M_SOGLIA, mAcqua ), mVelo = smoothstep( 0.5, 0.62, mF( mP * 2.3 + 5.0 ) );
      mC *= 0.76 * ( 1.0 - 0.18 * mVelo ) * ( 1.0 - 0.42 * mUmido );
      diffuseColor.rgb = mC;`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
      // (mai sotto 0,2: una pietra lucidissima sui bordi smussati fa scintille, di notte; l'acqua vera è lo specchio)
      roughnessFactor = mix( mix( mix( 0.5, 0.26, mVelo ), 0.92, mFuga ), 0.2, mUmido );`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
      // (la telecamera non è ruotata: x e z del mondo sono x e z della vista) ogni lastra un po' storta, il bordo smussato,
      // la grana
      vec2 mT = ( vec2( mH( mId + 7.7 ), mH( mId + 8.8 ) ) - 0.5 ) * 0.07;
      vec2 mB = vec2( mL.x < 0.3 ? 1.0 : -1.0, mL.y < 0.2 ? 1.0 : -1.0 ) * ( abs( mL.x - 0.3 ) > abs( mL.y - 0.2 ) * 1.5 ? vec2( 1.0, 0.0 ) : vec2( 0.0, 1.0 ) );
      mT += mB * 0.25 * ( 1.0 - smoothstep( 0.0, 0.01, mL.z ) ) * mMedia * ( 1.0 - mUmido );
      mT += ( vec2( mN( mP * 700.0 ), mN( mP * 700.0 + 5.0 ) ) - 0.5 ) * 0.12 * mFine;
      normal = normalize( normal + vec3( mT.x, 0.0, mT.y ) );`)
  }
  m.customProgramCacheKey = () => 'lastre'
  return m
}

// lo specchio delle pozzanghere (il Reflector di three): disegna solo dove c'è acqua, col bordo netto, il riflesso
// mosso dal vento e più forte radente; sotto, la pietra bagnata si vede poco
export const SPECCHIO_POZZE = {
  name: 'pozze',
  uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null }, opacita: { value: 1 }, mPozza: BAGNO.pozza, mTempo: BAGNO.tempo },
  vertexShader: `uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vMondo;
    #include <common>
    #include <logdepthbuf_pars_vertex>
    void main() { vUv = textureMatrix * vec4( position, 1.0 ); vMondo = ( modelMatrix * vec4( position, 1.0 ) ).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    #include <logdepthbuf_vertex>
    }`,
  fragmentShader: `uniform vec3 color; uniform sampler2D tDiffuse; uniform float opacita, mTempo; varying vec4 vUv; varying vec3 vMondo;
    ${LASTRE_GLSL}
    #include <logdepthbuf_pars_fragment>
    void main() {
    #include <logdepthbuf_fragment>
      float c = mCampo( vMondo.xz ), w = fwidth( c ) * 1.2 + 0.0015, acqua = smoothstep( M_SOGLIA - w, M_SOGLIA + w, c );
      if ( acqua < 0.004 ) discard;
      // il vento increspa l'acqua: il riflesso trema un poco (più al largo che sul bordo)
      vec2 p = vMondo.xz * 14.0;
      vec2 n = vec2( mN( p + vec2( mTempo * 0.45, 0.0 ) ), mN( p * 1.3 + vec2( 3.0, mTempo * 0.33 ) ) ) - 0.5;
      vec4 uv = vUv; uv.xy += n * 0.014 * smoothstep( M_SOGLIA, M_SOGLIA + 0.06, c ) * uv.w;
      vec3 rif = texture2DProj( tDiffuse, uv ).rgb * color;
      // Fresnel (dell'acqua, un po' più forte del vero) e l'acqua torbida scura dove non riflette
      vec3 v = normalize( cameraPosition - vMondo );
      float f = 0.04 + 0.96 * pow( 1.0 - clamp( v.y, 0.0, 1.0 ), 5.0 ), r = 0.38 + 0.62 * f;
      gl_FragColor = vec4( rif * r + vec3( 0.012, 0.011, 0.009 ) * ( 1.0 - r ), acqua * opacita * 0.9 );
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    }`,
}
