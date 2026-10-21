// I materiali della scena 3D: le trame disegnate (intonaco,
// asfalto, le finestre dei palazzi di fronte), i rumori che le
// fanno, le mappe di normali tirate fuori dalle altezze e il profilo delle doghe
// della saracinesca, che la lamiera e i fogli attaccati sopra devono seguire.
// Intonaco e asfalto non si disegnano più nella pagina (erano due
// secondi fermi): li disegna una volta tools/pzkko/scena/trame.mjs con queste
// funzioni, in art/scena/trame/; le facciate sì, costano poco.
import * as T from './lib/three.js'

// ── il rumore ────────────────────────────────────────────────────────────────
// Rumore di valori su un reticolo che si ripete ogni `periodo` celle (così le
// tele si affiancano senza giunte), con un seme; sopra, gli strati (fBm).
const hash = (x, y, seme) => {
  let h = (x * 374761393 + y * 668265263 + seme * 1274126177) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
const liscia = (t) => t * t * (3 - 2 * t)
export const rumore = (x, y, periodo, seme) => {
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = liscia(x - x0), fy = liscia(y - y0)
  const p = (i, j) => hash(((i % periodo) + periodo) % periodo, ((j % periodo) + periodo) % periodo, seme)
  const a = p(x0, y0), b = p(x0 + 1, y0), c = p(x0, y0 + 1), d = p(x0 + 1, y0 + 1)
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy
}
export const strati = (x, y, periodo, seme, ottave = 5, rugosita = 0.5) => {
  let v = 0, amp = 1, f = 1, somma = 0
  for (let o = 0; o < ottave; o++) { v += amp * rumore(x * f, y * f, periodo * f, seme + o * 17); somma += amp; amp *= rugosita; f *= 2 }
  return v / somma
}

// ── tele e mappe ─────────────────────────────────────────────────────────────
export const tela = (n, m = n) => { const c = document.createElement('canvas'); c.width = n; c.height = m; return c }
const trama = (c, colore = true, ripeti = true) => {
  const t = new T.CanvasTexture(c)
  t.wrapS = t.wrapT = ripeti ? T.RepeatWrapping : T.ClampToEdgeWrapping
  if (colore) t.colorSpace = T.SRGBColorSpace
  t.anisotropy = 8
  return t
}
// Da un campo di altezze (Float32Array n×n, valori in «metri» rispetto a lato
// metri per tela) alla mappa di normali in spazio tangente, che si ripete.
export const normaliDaAltezze = (alt, n, latoMetri, forza = 1) => {
  const c = tela(n), ctx = c.getContext('2d'), img = ctx.createImageData(n, n), d = img.data
  const passo = latoMetri / n
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const l = alt[y * n + ((x + n - 1) % n)], r = alt[y * n + ((x + 1) % n)]
    const u = alt[((y + n - 1) % n) * n + x], g = alt[((y + 1) % n) * n + x]
    const dx = ((r - l) / (2 * passo)) * forza, dy = ((g - u) / (2 * passo)) * forza
    const len = Math.hypot(dx, dy, 1)
    const i = (y * n + x) * 4
    d[i] = 128 + (-dx / len) * 127; d[i + 1] = 128 + (dy / len) * 127; d[i + 2] = 128 + (1 / len) * 127; d[i + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  return trama(c, false)
}

// L'intonaco: calce con le onde larghe della cazzuola, la grana della sabbia, i
// grumi, e il colore a chiazze della pittura vecchia. Un metro per tela. Nell'alfa
// (dal 21.10) le crepe: righe sottili che vanno a zig zag e si ramificano, scritte
// come trasparenza (1 = niente crepa); intonacoVivo (sotto) le legge e le fa vedere
// solo a zone, così non si vede che si ripetono ogni metro.
export const intonaco = (n = 512, seme = 7) => {
  const alt = new Float32Array(n * n), c = tela(n), ctx = c.getContext('2d'), img = ctx.createImageData(n, n), d = img.data
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const u = x / n, v = y / n
    const onde = strati(u * 4, v * 4, 4, seme, 3, 0.55)
    const sabbia = strati(u * 96, v * 96, 96, seme + 3, 2, 0.5)
    const grumi = strati(u * 14, v * 14, 14, seme + 5, 2, 0.6)
    alt[y * n + x] = onde * 0.0028 + sabbia * 0.0006 + Math.max(0, grumi - 0.55) * 0.004
    const chiazze = strati(u * 3, v * 3, 3, seme + 9, 4, 0.5), fine = strati(u * 40, v * 40, 40, seme + 11, 2, 0.5)
    const l = 0.62 + (chiazze - 0.5) * 0.3 + (fine - 0.5) * 0.08
    const i = (y * n + x) * 4
    d[i] = 255 * Math.min(1, l * 1.0); d[i + 1] = 255 * Math.min(1, l * 0.94); d[i + 2] = 255 * Math.min(1, l * 0.85); d[i + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  // le crepe: sei passeggiate a caso (col seme), che deviano a ogni passo e ogni tanto si biforcano, dal tratto che si
  // assottiglia; stanno dentro la tela (non attraversano il bordo: la tela si ripete e la crepa non deve saltare). Si
  // tolgono dall'alfa (destination-out), mai del tutto: con l'alfa a zero il colore sotto andrebbe perso
  ctx.globalCompositeOperation = 'destination-out'
  ctx.lineCap = 'round'
  let k = 0
  const caso = () => hash(k++, seme, 977)
  const crepa = (x, y, dir, passi, larg) => {
    for (let p = 0; p < passi; p++) {
      dir += (caso() - 0.5) * 0.9
      const nx = x + Math.cos(dir) * (3 + caso() * 5), ny = y + Math.sin(dir) * (3 + caso() * 5)
      if (nx < 12 || ny < 12 || nx > n - 12 || ny > n - 12) return
      const w = larg * (1 - p / passi) + 0.5
      ctx.strokeStyle = `rgba(0,0,0,${(0.85 * Math.min(1, w)).toFixed(2)})`; ctx.lineWidth = Math.max(0.6, w)
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(nx, ny); ctx.stroke()
      x = nx; y = ny
      if (p > 4 && caso() < 0.06 && larg > 0.9) crepa(x, y, dir + (caso() < 0.5 ? 1 : -1) * (0.7 + caso() * 0.8), Math.round(passi * 0.4), larg * 0.6)
    }
  }
  for (let c = 0; c < 6; c++) crepa(40 + caso() * (n - 80), 40 + caso() * (n - 80), caso() * Math.PI * 2, 30 + Math.round(caso() * 60), 1.1 + caso() * 0.6)
  ctx.globalCompositeOperation = 'source-over'
  return { map: trama(c), normalMap: normaliDaAltezze(alt, n, 1, 1), lato: 1 }
}

// L'intonaco vero (21.10), nello shader della facciata, in coordinate del mondo (x lungo la facciata, y da terra):
// - la stessa trama letta anche a una scala di 9 m (una lettura in più) rompe la ripetizione ogni 4 m del colore, e fa
//   le chiazze larghe dello sporco, più ruvide;
// - le crepe dell'alfa della trama, solo nelle zone che dice un rumore largo (così non si vede che tornano ogni metro);
// - le colature della pioggia: righe verticali sottili, su tutta la facciata appena, più scure sotto i davanzali delle
//   finestre e sotto il cassonetto dell'insegna (davanzali: x del centro, y, mezza larghezza);
// - la pittura che si scrosta a chiazze dal bordo netto (col filo d'ombra del bordo), sotto il cemento grigio;
// - l'intonaco caduto (buchi: x, y del centro, mezzi assi): dentro i mattoni coi giunti di malta, l'ombra dell'orlo.
// Tutto rumore di valori (quattro hash per lettura) su una decina di letture: la facciata è un terzo dello schermo, e
// il bagnato di acqua.js fa lo stesso. Va messo prima di bagnato(m, 1), che lo incatena. I colori scritti qui sono
// lineari (diffuseColor lo è: l'intonaco chiaro sta a ~0,23): il cemento e i mattoni devono stare sotto.
export const intonacoVivo = (m, { davanzali = [], buchi = [] } = {}) => {
  const f = (x) => Number(x).toFixed(3)
  const DAV = davanzali.map(([x, y, hw]) => `iSotto = max( iSotto, ( 1.0 - smoothstep( 0.0, 0.9, ${f(y)} - iP.y ) ) * step( iP.y, ${f(y)} ) * ( 1.0 - smoothstep( ${f(hw - 0.1)}, ${f(hw + 0.15)}, abs( iP.x - ${f(x)} ) ) ) );`).join('\n')
  const BUCHI = buchi.map(([x, y, rx, ry]) => `{ float d = length( ( iP - vec2( ${f(x)}, ${f(y)} ) ) / vec2( ${f(rx)}, ${f(ry)} ) ) + 0.45 * ( iN( iP * 6.0 + 1.0 ) - 0.5 ) + 0.2 * ( iN( iP * 20.0 ) - 0.5 ); iBuco = max( iBuco, 1.0 - smoothstep( 0.97, 1.0, d ) ); iBordo = max( iBordo, smoothstep( 0.72, 1.0, d ) ); iAlone = max( iAlone, 1.0 - smoothstep( 1.0, 1.35, d ) ); }`).join('\n')
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = 'varying vec3 vMuroPos;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vMuroPos = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;')
    sh.fragmentShader = `varying vec3 vMuroPos;
float iH( vec2 p ) { p = fract( p * vec2( 311.7, 173.3 ) ); p += dot( p, p + 19.19 ); return fract( p.x * p.y ); }
float iN( vec2 p ) {
  vec2 i = floor( p ), f = fract( p ); f = f * f * ( 3.0 - 2.0 * f );
  return mix( mix( iH( i ), iH( i + vec2( 1.0, 0.0 ) ), f.x ), mix( iH( i + vec2( 0.0, 1.0 ) ), iH( i + vec2( 1.0, 1.0 ) ), f.x ), f.y );
}
` + sh.fragmentShader
      .replace('#include <map_fragment>', `
  vec4 iS = texture2D( map, vMapUv );
  diffuseColor.rgb *= iS.rgb;
  vec2 iP = vMuroPos.xy;
  float iMac = dot( texture2D( map, iP * 0.11 + vec2( 0.37, 0.71 ) ).rgb, vec3( 0.333 ) );
  float iN1 = iN( iP * 0.45 + 2.0 ), iN2 = iN( iP * 1.7 + 9.0 );
  float iSporco = smoothstep( 0.45, 0.9, 0.5 * iN1 + 0.3 * iN2 + 0.4 * ( 0.55 - iMac ) );
  diffuseColor.rgb *= ( 0.8 + 0.45 * iMac ) * ( 1.0 - 0.16 * iSporco );
  float iCrepa = ( 1.0 - iS.a ) * smoothstep( 0.42, 0.6, iN( iP * 0.8 + 5.0 ) );
  diffuseColor.rgb *= 1.0 - 0.55 * iCrepa;
  float iRighe = iN( vec2( iP.x * 9.0, iP.y * 0.35 ) ) * iN( vec2( iP.x * 23.0 + 5.0, iP.y * 0.9 ) );
  float iSotto = 0.0;
  ${DAV}
  diffuseColor.rgb *= 1.0 - ( 0.1 + 0.3 * iSotto ) * smoothstep( 0.22, 0.6, iRighe );
  float iSf = 0.6 * iN( iP * 9.0 + 7.0 ) + 0.4 * iN( iP * 23.0 + 3.0 );
  float iZona = smoothstep( 0.5, 0.75, iN( iP * 0.6 + 11.0 ) );
  float iScrost = smoothstep( 0.66, 0.675, iSf ) * iZona;
  float iOrlo = ( smoothstep( 0.645, 0.66, iSf ) - smoothstep( 0.66, 0.675, iSf ) ) * iZona;
  vec3 iCemento = vec3( 0.13, 0.12, 0.105 ) * ( 0.75 + 0.5 * iN( iP * 40.0 ) );
  diffuseColor.rgb = mix( diffuseColor.rgb, iCemento, iScrost ) * ( 1.0 - 0.3 * iOrlo );
  float iBuco = 0.0, iBordo = 0.0, iAlone = 0.0;
  ${BUCHI}
  diffuseColor.rgb *= 1.0 - 0.25 * iAlone * ( 1.0 - iBuco );
  if ( iBuco > 0.0 ) {
    float riga = floor( iP.y / 0.065 ), fy = fract( iP.y / 0.065 );
    float xx = iP.x + mod( riga, 2.0 ) * 0.125, col = floor( xx / 0.25 ), fx = fract( xx / 0.25 );
    float malta = max( 1.0 - smoothstep( 0.12, 0.16, fy ), 1.0 - smoothstep( 0.035, 0.05, fx ) );
    vec3 mattone = vec3( 0.24, 0.095, 0.055 ) * ( 0.6 + 0.8 * iH( vec2( col, riga ) ) ) * ( 0.8 + 0.4 * iN( iP * 45.0 ) );
    vec3 dentro = mix( mattone, vec3( 0.15, 0.14, 0.12 ) * ( 0.7 + 0.5 * iN( iP * 25.0 ) ), malta );
    dentro *= 1.0 - 0.6 * iBordo;
    diffuseColor.rgb = mix( diffuseColor.rgb, dentro, iBuco );
  }`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n roughnessFactor = min( 1.0, roughnessFactor + 0.12 * iSporco + 0.2 * iScrost + 0.1 * iBuco );')
  }
  m.customProgramCacheKey = () => `intonacoVivo:${DAV.length}:${BUCHI.length}`
  return m
}

// L'asfalto: grana fine e scura, qualche rappezzo.
export const asfalto = (n = 512, seme = 33) => {
  const alt = new Float32Array(n * n), c = tela(n), ctx = c.getContext('2d'), img = ctx.createImageData(n, n), d = img.data
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const u = x / n, v = y / n
    const grana = strati(u * 64, v * 64, 64, seme, 3, 0.5), largo = strati(u * 3, v * 3, 3, seme + 4, 3, 0.5)
    alt[y * n + x] = grana * 0.0015
    const l = 0.22 + (grana - 0.5) * 0.16 + (largo - 0.5) * 0.1
    const i = (y * n + x) * 4
    d[i] = 255 * l; d[i + 1] = 255 * l; d[i + 2] = 255 * l * 1.02; d[i + 3] = 255
  }
  ctx.putImageData(img, 0, 0)
  return { map: trama(c), normalMap: normaliDaAltezze(alt, n, 2, 0.7), lato: 2 }
}

// Le facciate dei palazzi di fronte: intonaco colorato con le finestre a
// griglia; di notte alcune si accendono (la mappa emissiva si ridisegna).
export const facciata = (larg, alt, colore, seme, piani) => {
  const n = 512, m = Math.round((n * alt) / larg)
  const c = tela(n, m), ctx = c.getContext('2d')
  const e = tela(n, m), ctxe = e.getContext('2d')
  ctx.fillStyle = colore; ctx.fillRect(0, 0, n, m)
  // sporco in basso e chiazze
  const g = ctx.createLinearGradient(0, m, 0, m * 0.75); g.addColorStop(0, 'rgba(40,30,20,.35)'); g.addColorStop(1, 'rgba(40,30,20,0)')
  ctx.fillStyle = g; ctx.fillRect(0, 0, n, m)
  for (let i = 0; i < 60; i++) {
    const x = hash(i, 1, seme) * n, y = hash(i, 2, seme) * m, r = 40 + hash(i, 3, seme) * 160
    const gg = ctx.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, `rgba(${hash(i, 4, seme) > 0.5 ? '255,255,255' : '0,0,0'},.07)`); gg.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = gg; ctx.fillRect(x - r, y - r, 2 * r, 2 * r)
  }
  ctxe.fillStyle = '#000'; ctxe.fillRect(0, 0, n, m)
  const finestre = []
  const px = n / larg, pianoH = alt / piani
  const colonne = Math.max(2, Math.round(larg / 3.2))
  for (let p = 0; p < piani; p++) for (let k = 0; k < colonne; k++) {
    const w = 1.1 * px, h = 1.6 * px
    const x = ((k + 0.5) * larg / colonne) * px - w / 2, y = m - ((p + 0.55) * pianoH) * px - h / 2
    if (p === 0 && hash(k, p, seme) < 0.4) continue // a terra, qualche negozio o portone al posto della finestra
    // la cornice, il vetro buio, la persiana socchiusa
    ctx.fillStyle = '#d9d2c4'; ctx.fillRect(x - 0.08 * px, y - 0.08 * px, w + 0.16 * px, h + 0.12 * px)
    ctx.fillStyle = '#1a1c20'; ctx.fillRect(x, y, w, h)
    ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(x, y, w, h * 0.35)
    const pers = hash(k, p + 7, seme)
    if (pers < 0.5) { ctx.fillStyle = '#5a6b4a'; ctx.fillRect(x, y, w, h * (0.3 + pers)) }
    finestre.push({ x, y, w, h, acceso: hash(k, p + 3, seme), calda: hash(k, p + 5, seme) })
  }
  const map = trama(c, true, false), emissiveMap = trama(e, true, false)
  const accendi = (quanto) => {
    ctxe.fillStyle = '#000'; ctxe.fillRect(0, 0, n, m)
    for (const f of finestre) {
      if (f.acceso > quanto) continue
      ctxe.fillStyle = f.calda > 0.3 ? '#ffd9a0' : '#cfe3ff'
      ctxe.fillRect(f.x, f.y, f.w, f.h)
      ctxe.fillStyle = 'rgba(0,0,0,.35)'; ctxe.fillRect(f.x, f.y, f.w, f.h * 0.5)
    }
    emissiveMap.needsUpdate = true
  }
  return { map, emissiveMap, accendi }
}

// Un'immagine (o un SVG) come trama di colore. Si decodifica prima (img.decode(), fuori dal filo principale): se la
// decodifica la facesse la scheda grafica al momento di caricarla, il fotogramma in cui arriva durerebbe decine di ms.
// Poi se ne fa un ImageBitmap già capovolto e senza conversioni di colore: la scheda lo prende così com'è, in un colpo;
// da un <img> il browser lo capovolgerebbe e riconvertirebbe sul filo principale, decine di ms per ogni volantino.
export const immagine = async (src, { ripeti = false, flipY = true } = {}) => {
  const img = new Image()
  img.decoding = 'async'
  img.src = src
  try { await img.decode() } catch { if (!img.complete || !img.naturalWidth) throw new Error('immagine non caricata: ' + src) }
  let bitmap = null
  try { bitmap = await createImageBitmap(img, { imageOrientation: flipY ? 'flipY' : 'none', premultiplyAlpha: 'none', colorSpaceConversion: 'none' }) } catch {}
  const t = new T.Texture(bitmap || img)
  t.colorSpace = T.SRGBColorSpace
  t.wrapS = t.wrapT = ripeti ? T.RepeatWrapping : T.ClampToEdgeWrapping
  t.anisotropy = 8; t.flipY = bitmap ? false : flipY
  t.needsUpdate = true
  return t
}
// Un SVG disegnato su una tela della misura voluta (i browser lo rasterizzano
// alla grandezza chiesta, senza perdere nitidezza).
export const svgSuTela = (src, larg, alt) => new Promise((ok, no) => {
  const img = new Image()
  img.onload = () => { const c = tela(larg, alt); c.getContext('2d').drawImage(img, 0, 0, larg, alt); ok(trama(c, true, false)) }
  img.onerror = no
  img.src = src
})
// Un tubo lungo una spezzata (i neon, il tubo della condensa): un anello di `seg` lati per punto, orientato col
// trasporto parallelo (niente torsioni); senza tappi.
export const tuboSpezzato = (pts, r, seg) => {
  const n = pts.length, tan = pts.map((_, i) => pts[Math.min(n - 1, i + 1)].clone().sub(pts[Math.max(0, i - 1)]).normalize())
  const nrm = Math.abs(tan[0].z) > 0.9 ? new T.Vector3(0, 1, 0) : new T.Vector3(0, 0, 1)
  nrm.addScaledVector(tan[0], -nrm.dot(tan[0])).normalize()
  const q = new T.Quaternion(), bi = new T.Vector3(), d = new T.Vector3()
  const pos = [], nor = [], idx = []
  for (let i = 0; i < n; i++) {
    if (i > 0) { q.setFromUnitVectors(tan[i - 1], tan[i]); nrm.applyQuaternion(q); nrm.addScaledVector(tan[i], -nrm.dot(tan[i])).normalize() }
    bi.crossVectors(tan[i], nrm)
    for (let k = 0; k <= seg; k++) {
      const a = (k / seg) * Math.PI * 2
      d.copy(nrm).multiplyScalar(Math.cos(a)).addScaledVector(bi, Math.sin(a))
      pos.push(pts[i].x + r * d.x, pts[i].y + r * d.y, pts[i].z + r * d.z); nor.push(d.x, d.y, d.z)
    }
  }
  for (let i = 0; i < n - 1; i++) for (let k = 0; k < seg; k++) {
    const a = i * (seg + 1) + k, b = a + seg + 1
    idx.push(a, b, a + 1, a + 1, b, b + 1)
  }
  const g = new T.BufferGeometry()
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3))
  g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3))
  g.setIndex(idx)
  return g
}
// Testo scritto su una tela trasparente (cartelli, targhe).
export const scritta = (righe, { larg = 512, alt = 256, font = '700 90px "Archivo Black", sans-serif', colore = '#111', sfondo = null, giro = 0 } = {}) => {
  const c = tela(larg, alt), ctx = c.getContext('2d')
  if (sfondo) { ctx.fillStyle = sfondo; ctx.fillRect(0, 0, larg, alt) }
  ctx.fillStyle = colore; ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.translate(larg / 2, alt / 2); ctx.rotate(giro)
  const lh = parseInt(font.match(/(\d+)px/)?.[1] ?? 60) * 1.15
  righe.forEach((r, i) => ctx.fillText(r, 0, (i - (righe.length - 1) / 2) * lh))
  return trama(c, true, false)
}

// La regia (../regia/regia.js, il pannello nascosto per provare il sito): i ritocchi alla scena, letti a ogni
// fotogramma da luci.js, scena.js, bestie.js e acqua.js. Uno solo, su window: la regia lo scrive anche se si apre
// prima che la scena ci sia
export const REGIA = (window.pzkkoRegia ??= {
  esposizione: 1, bagliore: 1, neon: 1, specchi: true, vetrina: true,
  bestie: { formiche: true, mosche: true, zanzare: true, blatte: true }, blatteDiGiorno: false, velocitaBestie: 1, goccia: 1,
  // il meteo (meteo.js): null = quello vero di Mantova, o uno scelto (sole, nuvoloso, nebbia, pioggia, temporale, neve)
  // con la sua intensità; il bagnato e la neve per terra (null = col meteo)
  meteo: null, intensita: 0.6, bagnato: null, manto: null,
})

// la facciata sta 10 cm più avanti della saracinesca (z = 0)
export const Z_FACCIATA = 0.10

// ── la saracinesca ───────────────────────────────────────────────────────────
// Il profilo delle doghe: ogni doga è bombata (5 mm) e al giunto c'è il canale
// (2 mm). La carta attaccata sopra segue la bombatura ma non entra nel canale.
export const DOGA = 0.1248 // il passo, in metri: 13 doghe nei 1475 px della foto, 2200 px per 1280 unità
export const profilo = (yDaCima, x = 0, carta = false) => {
  const u = ((yDaCima / DOGA) % 1 + 1) % 1
  const bomba = 0.005 * Math.sin(Math.PI * u) ** 0.6
  const ammacco = 0.0012 * (strati(x * 0.7 + 3.1, yDaCima * 0.7, 64, 51, 2, 0.5) - 0.5)
  if (carta) return bomba + Math.max(0, ammacco)
  const d = Math.min(u, 1 - u)
  const canale = 0.002 * Math.exp(-((d / 0.035) ** 2))
  return bomba - canale + ammacco
}

// La griglia dei poligoni della lamiera (W × H, in metri) e la sua altezza esatta in ogni punto. Le doghe si contano dalla
// cima del rotolo, y1, che è un giunto 30 cm sopra il buco: la lamiera, la carta e la vernice attaccate sopra devono
// contarle dallo stesso punto (contandole da H la carta e i graffiti erano sfasati di 0,4 doghe, e la lamiera li bucava
// a strisce). Otto righe per doga, fitte al giunto (dove c'è il canale, stretto) e larghe sulla pancia; in larghezza una
// colonna ogni ~17 cm (l'ammaccatura è un'onda larga un metro). z(x, y) è l'altezza dei triangoli veri, non della curva:
// i graffiti stanno sugli stessi triangoli, un decimo di millimetro sopra, e la lamiera non li buca mai.
export const RIGHE = [0, 0.04, 0.1, 0.25, 0.5, 0.75, 0.9, 0.96]
export const lamiera = (W, H) => {
  const x0 = -0.02, x1 = W + 0.02, y0 = -0.02, y1 = H + 0.3
  const nx = Math.max(6, Math.round((x1 - x0) / 0.17)), ny = Math.ceil((y1 - y0) / DOGA) * RIGHE.length
  const yd = (j) => (Math.floor(j / RIGHE.length) + RIGHE[j % RIGHE.length]) * DOGA // distanza dalla cima
  const xs = Array.from({ length: nx + 1 }, (_, i) => x0 + ((x1 - x0) * i) / nx)
  const ys = Array.from({ length: ny + 1 }, (_, j) => y1 - yd(j)) // dall'alto in basso
  const prof = (x, y, carta = false) => profilo(y1 - y, x, carta)
  // la riga j sopra il punto (ys[j] ≥ y > ys[j + 1]) e la colonna i a sinistra
  const riga = (y) => {
    const f = Math.max(0, (y1 - y) / DOGA), d = Math.floor(f), r = f - d
    let k = RIGHE.length - 1
    while (k > 0 && RIGHE[k] > r) k--
    return Math.min(ny - 1, d * RIGHE.length + k)
  }
  const colonna = (x) => Math.min(nx - 1, Math.max(0, Math.floor(((x - x0) / (x1 - x0)) * nx)))
  // i triangoli come in mondo.js: (a, c, b) e (b, c, d), a in alto a sinistra, la diagonale da b (in alto a destra) a c
  const z = (x, y) => {
    const i = colonna(x), j = riga(y)
    const fx = (x - xs[i]) / (xs[i + 1] - xs[i]), fy = (ys[j] - y) / (ys[j] - ys[j + 1])
    const za = prof(xs[i], ys[j]), zb = prof(xs[i + 1], ys[j]), zc = prof(xs[i], ys[j + 1])
    if (fx + fy <= 1) return za + (zb - za) * fx + (zc - za) * fy
    const zd = prof(xs[i + 1], ys[j + 1])
    return zd + (zc - zd) * (1 - fx) + (zb - zd) * (1 - fy)
  }
  return { x0, x1, y0, y1, nx, ny, xs, ys, yd, prof, z, riga, colonna }
}
