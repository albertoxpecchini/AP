// Il foglio disegnato dalla scheda grafica (WebGL 2). Un solo canvas grande
// quanto il piano del visualizzatore (src/client/viewer.js): a ogni fotogramma
// ridisegna la tavola intera, in vettoriale, alla risoluzione dello schermo.
// Niente immagini da ricalcolare quando ci si ferma: lo zoom è nitido mentre
// si muove.
//
// I dati arrivano dal worker (src/dwg/worker.js) già pronti, nel formato di
// src/gpu/format.js: qui si caricano nei buffer una volta per file e poi sono
// quattro chiamate di disegno a fotogramma.
//
//   · tratti: un rettangolo per pezzo, e lo shader calcola per ogni pixel la
//     distanza dalla linea o dall'arco → bordi sfumati esatti, estremità e
//     giunture tonde, tratteggi, archi veri a qualunque ingrandimento
//   · riempimenti: triangoli, sfumati dal multicampionamento (MSAA 4× o 8×)
//   · testi: lettere da un atlante di distanze (src/gpu/sdf.js)
//   · la griglia di punti del piano, che si muove e si infittisce col foglio
//
// Nelle tavole da PDF l'ordine dei tracciati conta (un bianco copre le linee
// di prima): ogni tracciato ha il suo numero e fa da profondità.

import { SEG_STRIDE, TRI_STRIDE, GLYPH_STRIDE, DASH_W } from '../gpu/format.js'
import { ask } from './dwg-sheet.js'

const MAX_PIXELS = 9e6 // oltre, il canvas lavora a densità ridotta
const KEEP = 4 // quanti file restano caricati nella scheda grafica

const COMMON = `
uniform vec2 u_org;  // punto del disegno nell'angolo in alto a sinistra del foglio
uniform vec2 u_scl;  // pixel per unità del disegno (y negativa se il disegno ha la y in su)
uniform vec2 u_off;  // quell'angolo sul canvas, in pixel
uniform vec2 u_res;  // misura del canvas
vec2 toPx(vec2 p) { return (p - u_org) * u_scl + u_off; }
vec4 toClip(vec2 px, float z) { return vec4(px.x / u_res.x * 2. - 1., 1. - px.y / u_res.y * 2., z, 1.); }
float depthOf(float order, float bias) { return (order * 65535. + bias) / 65536. * 2. - 1.; }
`

const TRI_VS = `#version 300 es
precision highp float;
layout(location=0) in vec2 a_pos;
layout(location=1) in vec4 a_color;
layout(location=2) in float a_order;
${COMMON}
out vec4 v_color;
void main() {
  v_color = a_color;
  gl_Position = toClip(toPx(a_pos), depthOf(a_order, .25));
}`

const TRI_FS = `#version 300 es
precision mediump float;
in vec4 v_color;
out vec4 o;
void main() { o = v_color; }`

const SEG_VS = `#version 300 es
precision highp float;
layout(location=0) in vec4 a_p;     // x0, y0, x1, y1
layout(location=1) in vec4 a_q;     // bulge, lunghezza prima, spessore in mm, spessore nel disegno
layout(location=2) in vec4 a_color;
layout(location=3) in vec2 a_meta;  // riga del tipo di linea, flag
layout(location=4) in float a_order;
${COMMON}
uniform float u_pxPerMm;
uniform float u_minPx;
uniform float u_hair;
out vec2 v_uv;        // lungo la corda e di traverso, in pixel
flat out vec4 v_color;
flat out vec4 v_geo;  // corda, freccia, mezzo spessore, raggio
flat out vec4 v_arc;  // coseno e seno di mezza ampiezza, è un arco, flag
flat out vec2 v_dash; // lunghezza prima, riga del tipo di linea
void main() {
  vec2 P0 = toPx(a_p.xy);
  vec2 P1 = toPx(a_p.zw);
  vec2 c = P1 - P0;
  float L = length(c);
  vec2 t = L > 1e-5 ? c / L : vec2(1., 0.);
  vec2 n = vec2(-t.y, t.x);
  float flags = a_meta.y;
  bool isDot = mod(floor(flags / 4.), 2.) > .5;
  float w = a_q.w > 0. ? a_q.w * abs(u_scl.x) : a_q.z * u_pxPerMm;
  float minW = isDot ? 2.4 * u_minPx : u_minPx;
  // sotto lo spessore minimo la linea è larga il minimo e più chiara, in proporzione
  // (pesa quanto peserebbe sulla carta), ma mai meno di u_hair: resta leggibile
  float fade = isDot ? 1. : clamp(max(w / minW, u_hair), 0., 1.);
  float hw = .5 * max(w, minW);
  float b = a_q.x * (u_scl.y < 0. ? 1. : -1.);
  float s = b * L * .5;
  bool arc = abs(s) > .03;
  float bb = b * b;
  float pad = hw + 1.;
  vec2 k = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1));
  float u = mix(-pad, L + pad, k.x);
  float v = mix(min(0., s) - pad, max(0., s) + pad, k.y);
  v_uv = vec2(u, v);
  v_color = vec4(a_color.rgb, a_color.a * fade);
  v_geo = vec4(L, s, hw, arc ? L * (1. + bb) / (4. * abs(b)) : 0.);
  v_arc = vec4((1. - bb) / (1. + bb), 2. * abs(b) / (1. + bb), arc ? 1. : 0., flags);
  v_dash = vec2(a_q.y, a_meta.x);
  gl_Position = toClip(P0 + t * u + n * v, depthOf(a_order, .75));
}`

const SEG_FS = `#version 300 es
precision highp float;
uniform highp sampler2D u_dashTex;
uniform float u_unit;   // pixel per unità del disegno
in vec2 v_uv;
flat in vec4 v_color;
flat in vec4 v_geo;
flat in vec4 v_arc;
flat in vec2 v_dash;
out vec4 o;
void main() {
  float L = v_geo.x;
  float s = v_geo.y;
  float hw = v_geo.z;
  float R = v_geo.w;
  float d;      // distanza dalla linea (con le estremità)
  float perp;   // distanza dalla linea prolungata
  float along;  // strada fatta dall'inizio del pezzo, in pixel
  if (v_arc.z < .5) {
    perp = abs(v_uv.y);
    along = v_uv.x;
    d = length(vec2(v_uv.x - clamp(v_uv.x, 0., L), v_uv.y));
  } else {
    float sg = s > 0. ? 1. : -1.;
    float dx = v_uv.x - .5 * L;
    float dy = v_uv.y - s;
    // |punto - centro|² - R², scritto senza sottrarre numeri enormi: regge anche gli archi quasi dritti
    float num = dx * dx + dy * dy + 2. * sg * dy * R;
    perp = abs(num) / (sqrt(max(R * R + num, 0.)) + R);
    vec2 t0 = vec2(v_arc.x, sg * v_arc.y);
    vec2 t1 = vec2(v_arc.x, -sg * v_arc.y);
    if (dot(v_uv, t0) < 0.) d = length(v_uv);
    else if (dot(v_uv - vec2(L, 0.), t1) > 0.) d = length(v_uv - vec2(L, 0.));
    else d = perp;
    vec2 e0 = vec2(-.5 * L, sg * R - s);
    vec2 q = vec2(dx, dy + sg * R);
    along = R < 2e5 ? -sg * R * atan(e0.x * q.y - e0.y * q.x, dot(e0, q)) : v_uv.x;
  }
  int row = int(v_dash.y + .5);
  if (row > 0) {
    float period = texelFetch(u_dashTex, ivec2(0, row), 0).r;
    // i tratti restano leggibili anche da lontano: sotto i 3 px la linea è continua
    if (period * u_unit >= 3.) {
      int n = int(texelFetch(u_dashTex, ivec2(1, row), 0).r + .5);
      float m = mod(v_dash.x + along / u_unit, period);
      float gap = 1e9;
      float start = 0.;
      for (int i = 0; i < 16; i++) {
        if (2 * i >= n) break;
        float on = texelFetch(u_dashTex, ivec2(2 + 2 * i, row), 0).r;
        float off = texelFetch(u_dashTex, ivec2(3 + 2 * i, row), 0).r;
        for (float k = -1.; k < 1.5; k += 1.) {
          float lo = start + k * period;
          gap = min(gap, max(max(lo - m, m - lo - on), 0.));
        }
        start += on + off;
      }
      d = max(d, length(vec2(gap * u_unit, perp)));
    }
  }
  float a = clamp(hw - d + .5, 0., 1.);
  float flags = v_arc.w;
  if (mod(flags, 2.) > .5) a *= clamp(v_uv.x + .5, 0., 1.);
  if (mod(floor(flags / 2.), 2.) > .5) a *= clamp(L - v_uv.x + .5, 0., 1.);
  if (a <= 0.) discard;
  o = vec4(v_color.rgb, v_color.a * a);
}`

const GLYPH_VS = `#version 300 es
precision highp float;
layout(location=0) in vec2 a_o;
layout(location=1) in vec4 a_ab;    // 1 em lungo la riga, 1 em in su
layout(location=2) in vec4 a_rect;  // riquadro della lettera, in em
layout(location=3) in vec4 a_uv;    // riquadro nell'atlante, in texel
layout(location=4) in vec4 a_color;
${COMMON}
uniform vec2 u_atlas;
uniform float u_em;
out vec2 v_uv;
flat out vec4 v_color;
flat out vec2 v_k;  // pixel di schermo per texel dell'atlante, rettangolo pieno
void main() {
  vec2 k = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1));
  vec2 l = mix(a_rect.xy, a_rect.zw, k);
  v_uv = vec2(mix(a_uv.x, a_uv.z, k.x), mix(a_uv.w, a_uv.y, k.y)) / u_atlas;
  v_color = a_color;
  v_k = vec2(sqrt(length(a_ab.xy) * length(a_ab.zw)) * abs(u_scl.x) / u_em, a_uv.x > 65534.5 ? 1. : 0.);
  gl_Position = toClip(toPx(a_o + a_ab.xy * l.x + a_ab.zw * l.y), 1.);
}`

const GLYPH_FS = `#version 300 es
precision highp float;
uniform sampler2D u_tex;
uniform float u_rad;
in vec2 v_uv;
flat in vec4 v_color;
flat in vec2 v_k;
out vec4 o;
void main() {
  float a = 1.;
  if (v_k.y < .5) {
    // dal campo di distanze alla copertura del pixel
    float sd = texture(u_tex, v_uv).r;
    a = clamp((sd - .5) * 2. * u_rad * v_k.x + .5, 0., 1.);
  }
  if (a <= 0.) discard;
  o = vec4(v_color.rgb, v_color.a * a);
}`

const GRID_VS = `#version 300 es
void main() {
  gl_Position = vec4(float((gl_VertexID << 1) & 2) * 2. - 1., float(gl_VertexID & 2) * 2. - 1., 0., 1.);
}`

const GRID_FS = `#version 300 es
precision highp float;
uniform vec4 u_sheet;  // angolo del foglio (px), passo dei punti (px), quanto si vedono i punti intermedi
uniform vec2 u_res;
uniform float u_dot;
out vec4 o;
float dots(vec2 p, float cell) {
  vec2 f = (fract(p / cell + .5) - .5) * cell;
  return clamp(u_dot - length(f) + .5, 0., 1.);
}
void main() {
  vec2 p = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y) - u_sheet.xy;
  float a = max(dots(p, u_sheet.z), dots(p, u_sheet.z * .5) * u_sheet.w);
  if (a <= 0.) discard;
  o = vec4(.063, .067, .059, a * .2);
}`

function program(gl, vs, fs) {
  const p = gl.createProgram()
  for (const [type, src] of [
    [gl.VERTEX_SHADER, vs],
    [gl.FRAGMENT_SHADER, fs],
  ]) {
    const s = gl.createShader(type)
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS) && !gl.isContextLost()) throw new Error(gl.getShaderInfoLog(s) || 'shader')
    gl.attachShader(p, s)
    gl.deleteShader(s)
  }
  gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS) && !gl.isContextLost()) throw new Error(gl.getProgramInfoLog(p) || 'link')
  const u = {}
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS) || 0
  for (let i = 0; i < n; i++) {
    const name = gl.getActiveUniform(p, i).name
    u[name] = gl.getUniformLocation(p, name)
  }
  return { p, u }
}

/**
 * @param {HTMLElement} stage il piano del visualizzatore
 * @returns l'oggetto che disegna, o null se qui WebGL 2 non c'è
 */
export function createGlStage(stage) {
  const canvas = document.createElement('canvas')
  canvas.className = 'viewer__gl'
  canvas.setAttribute('aria-hidden', 'true')
  const gl = canvas.getContext('webgl2', { alpha: true, antialias: false, depth: false, stencil: false, premultipliedAlpha: true, powerPreference: 'high-performance' })
  if (!gl) return null

  let prog = null
  let target = null // { fbo, color, depth, samples, hasDepth }
  let W = 1
  let H = 1
  let dpr = 1
  let lost = false
  let last = null
  let current = null // { res, desc }
  let wanted = null
  let token = 0
  let tick = 0
  const cache = new Map()

  const init = () => {
    prog = {
      tri: program(gl, TRI_VS, TRI_FS),
      seg: program(gl, SEG_VS, SEG_FS),
      glyph: program(gl, GLYPH_VS, GLYPH_FS),
      grid: program(gl, GRID_VS, GRID_FS),
    }
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1)
    gl.enable(gl.BLEND)
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
  }
  try {
    init()
  } catch (error) {
    console.warn('[tavole] WebGL non utilizzabile:', error)
    return null
  }

  // ── Dove si disegna: un buffer multicampionato, poi copiato sul canvas ────

  const freeTarget = () => {
    if (!target) return
    gl.deleteFramebuffer(target.fbo)
    gl.deleteRenderbuffer(target.color)
    if (target.depth) gl.deleteRenderbuffer(target.depth)
    target = null
  }

  const makeTarget = (withDepth) => {
    freeTarget()
    const max = gl.getParameter(gl.MAX_SAMPLES) || 0
    const samples = Math.min(max, W * H > 2.4e6 ? 4 : 8)
    if (samples < 2) return
    const fbo = gl.createFramebuffer()
    const color = gl.createRenderbuffer()
    gl.bindRenderbuffer(gl.RENDERBUFFER, color)
    gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.RGBA8, W, H)
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, color)
    let depth = null
    if (withDepth) {
      depth = gl.createRenderbuffer()
      gl.bindRenderbuffer(gl.RENDERBUFFER, depth)
      gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.DEPTH_COMPONENT24, W, H)
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth)
    }
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    target = { fbo, color, depth, samples, hasDepth: withDepth }
    if (!ok) freeTarget()
  }

  // ── Un file caricato nella scheda grafica ────────────────────────────────

  const upload = (pack) => {
    const res = { pack: { ...pack, segs: null, tris: null, glyphs: null, atlas: null, dashes: null }, used: 0, buffers: [], textures: [] }
    const vao = (data, setup) => {
      const v = gl.createVertexArray()
      const b = gl.createBuffer()
      gl.bindVertexArray(v)
      gl.bindBuffer(gl.ARRAY_BUFFER, b)
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)
      setup()
      gl.bindVertexArray(null)
      res.buffers.push([v, b])
      return v
    }
    const attr = (i, size, type, norm, stride, offset, divisor) => {
      gl.enableVertexAttribArray(i)
      gl.vertexAttribPointer(i, size, type, norm, stride, offset)
      gl.vertexAttribDivisor(i, divisor)
    }
    if (pack.triCount)
      res.tri = vao(pack.tris, () => {
        attr(0, 2, gl.FLOAT, false, TRI_STRIDE, 0, 0)
        attr(1, 4, gl.UNSIGNED_BYTE, true, TRI_STRIDE, 8, 0)
        attr(2, 1, gl.UNSIGNED_SHORT, true, TRI_STRIDE, 12, 0)
      })
    if (pack.segCount)
      res.seg = vao(pack.segs, () => {
        attr(0, 4, gl.FLOAT, false, SEG_STRIDE, 0, 1)
        attr(1, 4, gl.FLOAT, false, SEG_STRIDE, 16, 1)
        attr(2, 4, gl.UNSIGNED_BYTE, true, SEG_STRIDE, 32, 1)
        attr(3, 2, gl.UNSIGNED_BYTE, false, SEG_STRIDE, 36, 1)
        attr(4, 1, gl.UNSIGNED_SHORT, true, SEG_STRIDE, 38, 1)
      })
    if (pack.glyphCount)
      res.glyph = vao(pack.glyphs, () => {
        attr(0, 2, gl.FLOAT, false, GLYPH_STRIDE, 0, 1)
        attr(1, 4, gl.FLOAT, false, GLYPH_STRIDE, 8, 1)
        attr(2, 4, gl.FLOAT, false, GLYPH_STRIDE, 24, 1)
        attr(3, 4, gl.UNSIGNED_SHORT, false, GLYPH_STRIDE, 40, 1)
        attr(4, 4, gl.UNSIGNED_BYTE, true, GLYPH_STRIDE, 48, 1)
      })
    const texture = (filterMin, filterMag) => {
      const t = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, t)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filterMin)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filterMag)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      res.textures.push(t)
      return t
    }
    res.dash = texture(gl.NEAREST, gl.NEAREST)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, DASH_W, pack.dashRows, 0, gl.RED, gl.FLOAT, pack.dashes)
    if (pack.atlas) {
      res.atlas = texture(gl.LINEAR_MIPMAP_LINEAR, gl.LINEAR)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, pack.atlas.w, pack.atlas.h, 0, gl.RED, gl.UNSIGNED_BYTE, pack.atlas.data)
      gl.generateMipmap(gl.TEXTURE_2D)
      gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAX_LOD, 4)
      res.atlasSize = [pack.atlas.w, pack.atlas.h]
    }
    return res
  }

  const free = (res) => {
    for (const [v, b] of res.buffers) {
      gl.deleteVertexArray(v)
      gl.deleteBuffer(b)
    }
    for (const t of res.textures) gl.deleteTexture(t)
  }

  const keyOf = (d) => `${d.kind}|${d.url}|${d.darken ? 1 : 0}`

  /** Il file pronto nella scheda grafica (letto e caricato una volta sola). */
  const ensure = (desc, onProgress) => {
    const key = keyOf(desc)
    let p = cache.get(key)
    if (!p) {
      p = ask({ type: 'gpu', kind: desc.kind, url: desc.url, darken: desc.darken, focus: desc.focus, maxScale: desc.maxScale, maxPx: desc.maxPx }, [], onProgress).then((r) => {
        if (lost) throw new Error('contesto grafico perso')
        return upload(r.gpu)
      })
      p.catch(() => cache.delete(key))
      cache.set(key, p)
    }
    return p.then((res) => {
      res.used = ++tick
      return res
    })
  }

  /** Tiene nella scheda grafica solo gli ultimi file usati. */
  const prune = async () => {
    if (cache.size <= KEEP) return
    const entries = []
    for (const [key, p] of cache) {
      const res = await p.catch(() => null)
      if (res) entries.push([key, res])
    }
    entries.sort((a, b) => a[1].used - b[1].used)
    for (const [key, res] of entries) {
      if (cache.size <= KEEP) break
      if (current && current.res === res) continue
      cache.delete(key)
      free(res)
    }
  }

  // ── Fotogramma ───────────────────────────────────────────────────────────

  const common = (u, org, scl, off) => {
    gl.uniform2f(u.u_org, org[0], org[1])
    gl.uniform2f(u.u_scl, scl[0], scl[1])
    gl.uniform2f(u.u_off, off[0], off[1])
    gl.uniform2f(u.u_res, W, H)
  }

  const frame = () => {
    const v = last
    if (!v || lost || !prog) return
    const withDepth = !!(current && current.res.pack.ordered)
    if (target && target.hasDepth !== withDepth) makeTarget(withDepth)
    gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fbo : null)
    gl.viewport(0, 0, W, H)
    gl.disable(gl.SCISSOR_TEST)
    gl.disable(gl.DEPTH_TEST)
    gl.depthMask(true)
    gl.clearColor(0, 0, 0, 0)
    gl.clearDepth(0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    const x = v.x * dpr
    const y = v.y * dpr
    const w = v.w * dpr
    const h = v.h * dpr

    // la griglia del piano: punti ogni 24–48 px ancorati al foglio; avvicinandosi
    // compaiono quelli intermedi, che al raddoppio diventano la griglia nuova
    const zr = Math.max(1e-6, v.zr || 1)
    const level = Math.floor(Math.log2(zr))
    const cell = (24 * dpr * zr) / 2 ** level
    gl.useProgram(prog.grid.p)
    gl.uniform4f(prog.grid.u.u_sheet, x, y, cell, Math.log2(zr) - level)
    gl.uniform2f(prog.grid.u.u_res, W, H)
    gl.uniform1f(prog.grid.u.u_dot, 0.55 * dpr)
    gl.drawArrays(gl.TRIANGLES, 0, 3)

    if (current && w > 0 && h > 0) {
      const { res, desc } = current
      const pack = res.pack
      // il foglio: carta bianca, e niente fuori dal suo bordo
      const sx0 = Math.max(0, Math.round(x))
      const sy0 = Math.max(0, Math.round(y))
      const sx1 = Math.min(W, Math.round(x + w))
      const sy1 = Math.min(H, Math.round(y + h))
      if (sx1 > sx0 && sy1 > sy0) {
        gl.enable(gl.SCISSOR_TEST)
        gl.scissor(sx0, H - sy1, sx1 - sx0, sy1 - sy0)
        gl.clearColor(1, 1, 1, 1)
        gl.clear(gl.COLOR_BUFFER_BIT)

        let org
        let scl
        if (pack.kind === 'dwg') {
          const S = w / (desc.box[2] - desc.box[0])
          org = [desc.box[0] - pack.origin[0], desc.box[3] - pack.origin[1]]
          scl = [S, -S]
        } else {
          const S = w / pack.viewBox[2]
          org = [pack.viewBox[0] - pack.origin[0], pack.viewBox[1] - pack.origin[1]]
          scl = [S, S]
        }
        const off = [x, y]
        const depth = withDepth && target && target.depth

        if (res.tri) {
          if (depth) {
            gl.enable(gl.DEPTH_TEST)
            gl.depthFunc(gl.ALWAYS)
            gl.depthMask(true)
          }
          gl.useProgram(prog.tri.p)
          common(prog.tri.u, org, scl, off)
          gl.bindVertexArray(res.tri)
          gl.drawArrays(gl.TRIANGLES, 0, pack.triCount)
        }
        if (res.seg) {
          if (depth) {
            gl.enable(gl.DEPTH_TEST)
            gl.depthFunc(gl.GEQUAL)
            gl.depthMask(false)
          }
          const u = prog.seg.u
          gl.useProgram(prog.seg.p)
          common(u, org, scl, off)
          gl.uniform1f(u.u_pxPerMm, w / desc.paperMm)
          gl.uniform1f(u.u_minPx, 0.5 * dpr + 0.35)
          gl.uniform1f(u.u_hair, 0.72)
          gl.uniform1f(u.u_unit, Math.abs(scl[0]))
          gl.activeTexture(gl.TEXTURE0)
          gl.bindTexture(gl.TEXTURE_2D, res.dash)
          gl.uniform1i(u.u_dashTex, 0)
          gl.bindVertexArray(res.seg)
          gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, pack.segCount)
        }
        gl.disable(gl.DEPTH_TEST)
        gl.depthMask(true)
        if (res.glyph && res.atlas) {
          const u = prog.glyph.u
          gl.useProgram(prog.glyph.p)
          common(u, org, scl, off)
          gl.uniform2f(u.u_atlas, res.atlasSize[0], res.atlasSize[1])
          gl.uniform1f(u.u_em, pack.em)
          gl.uniform1f(u.u_rad, pack.rad)
          gl.activeTexture(gl.TEXTURE0)
          gl.bindTexture(gl.TEXTURE_2D, res.atlas)
          gl.uniform1i(u.u_tex, 0)
          gl.bindVertexArray(res.glyph)
          gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, pack.glyphCount)
        }
        gl.bindVertexArray(null)
        gl.disable(gl.SCISSOR_TEST)
      }
    }

    if (target) {
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, target.fbo)
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null)
      gl.blitFramebuffer(0, 0, W, H, 0, 0, W, H, gl.COLOR_BUFFER_BIT, gl.NEAREST)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    }
  }

  // ── Verso il visualizzatore ──────────────────────────────────────────────

  /** La misura del piano (in px CSS): vero se è cambiata, e allora c'è da ridisegnare. */
  const resize = (sw, sh) => {
    let d = Math.min(3, window.devicePixelRatio || 1)
    if (sw * sh * d * d > MAX_PIXELS) d = Math.sqrt(MAX_PIXELS / (sw * sh))
    const w = Math.max(1, Math.round(sw * d))
    const h = Math.max(1, Math.round(sh * d))
    if (w === W && h === H && d === dpr) return false
    W = w
    H = h
    dpr = d
    canvas.width = W
    canvas.height = H
    if (!lost) makeTarget(!!(current && current.res.pack.ordered))
    return true
  }

  /**
   * Il foglio nel piano: posizione e misura in px CSS, e `zr`, l'ingrandimento
   * rispetto alla tavola adattata (per la griglia). Disegna subito.
   */
  const draw = (v) => {
    last = v
    frame()
  }

  /**
   * Mostra una tavola. Si risolve quando è sullo schermo; si rifiuta se il
   * file non si riesce a preparare (e allora la disegna il browser).
   * @param {{ kind: 'dwg'|'svg', url: string, darken?: boolean, box?: number[], paperMm?: number, focus?: number[], maxScale?: number, maxPx?: number }} desc
   */
  const show = async (desc, onProgress) => {
    const mine = ++token
    wanted = desc
    current = null // finché non è pronta si vede la miniatura del foglio, non la tavola di prima
    const res = await ensure(desc, onProgress)
    if (mine !== token) return false
    current = { res, desc }
    frame()
    prune()
    return true
  }

  /** Nessuna tavola vettoriale: resta la griglia. */
  const hide = () => {
    token++
    wanted = null
    current = null
    frame()
  }

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault()
    lost = true
    target = null
    current = null
    cache.clear()
  })
  canvas.addEventListener('webglcontextrestored', () => {
    try {
      init()
    } catch {
      return
    }
    lost = false
    makeTarget(false)
    frame()
    if (wanted) show(wanted).catch(() => {})
  })

  return {
    canvas,
    resize,
    draw,
    show,
    hide,
    /** Il file della tavola corrente, per chi vuole i numeri. */
    get info() {
      return current ? { ...current.res.pack, samples: target ? target.samples : 0, dpr } : null
    },
  }
}
