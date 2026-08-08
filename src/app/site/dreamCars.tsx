// ─────────────────────────────────────────────────────────────────────────────
// Il garage — visualizzatore 3D delle tre auto.
//
// ── Cosa mostra ──────────────────────────────────────────────────────────────
// I modelli come sono: stessa geometria, stessi materiali, stesse texture,
// stessi colori dei file di partenza (Aventador LP 700-4, Alfa Romeo 4C, Audi
// R8 V10 — vedi public/models/README.md). Niente è stato semplificato, tolto o
// ricolorato. scripts/build-cars.mjs cambia solo i CONTENITORI: la geometria da
// testo a interi binari — che sono i tipi che WebGL vuole nei suoi buffer — e
// le texture da PNG a WebP.
//
// Sono 131 000 triangoli per l'Aventador, interni e motore compresi, e trenta
// texture in tutto. Roba che si scarica solo quando la sezione arriva in vista.
//
// ── Perché non three.js ──────────────────────────────────────────────────────
// Perché serve un decimo di three.js: una mesh statica, una luce, nessuna
// ombra, nessun materiale PBR. La libreria sarebbe 160 kB gzip — più di tutta
// la home — e questo file ne pesa sei. Quel che serve sono i due shader qui
// sotto e una manciata di chiamate: un buffer per attributo, una texture per
// materiale, e un `drawElements` per ogni tratto di indici.
//
// ── Le tre cose che questo visualizzatore deve fare bene ─────────────────────
// ① Il buffer di profondità. Su un modello vero le cose si compenetrano
//    dappertutto (il cerchio dentro la gomma, lo specchietto contro il
//    montante): ordinare le facce e dipingere dalla più lontana — che è quel
//    che si può fare su un canvas 2D — NON basta, perché un ordine giusto non
//    esiste. Serve che a decidere sia il pixel.
// ② I materiali trasparenti dopo gli opachi, e senza scrivere in profondità.
//    Se no il parabrezza nasconde l'abitacolo invece di lasciarlo vedere.
// ③ La ripetizione delle texture. Le UV di questi modelli escono da 0…1 —
//    quelle delle gomme arrivano a 60 — e senza GL_REPEAT il battistrada
//    diventa una striscia stirata. Da cui le texture in potenze di due.
//
// ── Il movimento ─────────────────────────────────────────────────────────────
// Rotazione libera: si trascina e l'auto gira di 360° in tutti i versi, sotto
// compreso. Non due angoli da sommare — quelli si incastrano ai poli — ma una
// matrice moltiplicata a SINISTRA dallo spostamento del dito letto negli assi
// della camera. Comunque sia messa l'auto, trascinare a destra la fa girare
// verso destra sullo schermo.
//
// Da fermo il ciclo di rendering è spento: zero lavoro.
//
// touch-action: pan-y sul palco, non `none`: il dito che scorre la pagina deve
// continuare a scorrerla — qui si prende solo il trascinamento orizzontale.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   Le tre auto — la parte che si legge
   ═══════════════════════════════════════════════════════════════════════════ */

type CarSpec = {
  id: string;
  brand: string;
  model: string;
  engine: string;
  power: string;
  size: string;
  aria: string;
  /** Mezzo giro sul posto, per il modello che arriva col muso dall'altra parte.
   *  Chi mette in scena l'auto è scripts/build-cars.mjs, e il verso lo INDOVINA
   *  (dov'è l'abitacolo, dov'è più bassa); sull'R8 indovina male. Si corregge
   *  qui perché i sorgenti dei modelli non stanno in repository e il .bin non si
   *  può rigenerare — vedi public/models/README.md. È una rotazione attorno
   *  all'asse verticale dell'auto, non uno specchio: l'auto gira, e le scritte
   *  sulla fiancata continuano a leggersi dal verso giusto. */
  flip?: boolean;
};

const CARS: CarSpec[] = [
  {
    id: "aventador",
    brand: "Lamborghini",
    model: "Aventador LP 700-4",
    engine: "V12 6.5",
    power: "700 CV",
    size: "4780 × 2030 × 1136 mm",
    aria:
      "Three-dimensional model of a Lamborghini Aventador LP 700-4. Drag it, or use the arrow keys, to turn it in any direction.",
  },
  {
    id: "alfa4c",
    brand: "Alfa Romeo",
    model: "4C",
    engine: "1750 turbo",
    power: "240 CV",
    size: "3989 × 1868 × 1183 mm",
    aria:
      "Three-dimensional model of an Alfa Romeo 4C. Drag it, or use the arrow keys, to turn it in any direction.",
  },
  {
    id: "audir8",
    brand: "Audi",
    model: "R8 V10",
    engine: "V10 5.2",
    power: "540 CV",
    size: "4426 × 1904 × 1252 mm",
    aria:
      "Three-dimensional model of an Audi R8 V10. Drag it, or use the arrow keys, to turn it in any direction.",
    flip: true,
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   Il file delle mesh

   Formato (little-endian), scritto da scripts/build-cars.mjs:
     "APC3", u16 quante auto
     per auto:
       u8 lunghezza-nome, nome ascii
       u32 vertici, u32 indici, f32 scala UV, u8 byte-per-indice, u8 materiali
       per materiale: u8 texture (255 = nessuna), u8 r, g, b, a,
                      u8 riflesso, u8 durezza del riflesso,
                      u32 primo indice, u32 quanti
     riempimento a multiplo di 4
     per auto, nello stesso ordine:
       i16 ×3 posizioni (decimi di millimetro)
       i8  ×3 normali        (riempimento a multiplo di 2)
       i16 ×2 UV (× scala UV)
       indici, a 2 o 4 byte  (riempimento a multiplo di 4)

   Interi e non float perché sono i tipi che la scheda video legge direttamente:
   SHORT e BYTE sono tipi di attributo di WebGL, quindi il file entra nei buffer
   senza conversioni. Il dimezzamento del peso viene in regalo.

   Si scarica una volta sola per tutta la pagina: il primo riquadro che arriva
   in vista fa partire la fetch, gli altri due si attaccano alla stessa promessa.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Decimi di millimetro → metri. Lo stesso valore sta nel convertitore. */
const QS = 1e-4;

type Draw = {
  tex: number;
  color: [number, number, number, number];
  /** Quanto riflette e quanto stretto è il riflesso. */
  spec: number;
  gloss: number;
  first: number;
  count: number;
};
type Raw = {
  pos: ArrayBuffer;
  nrm: ArrayBuffer;
  uv: ArrayBuffer;
  idx: ArrayBuffer;
  wide: boolean;
  uvScale: number;
  nIdx: number;
  draws: Draw[];
  /** Quota attorno a cui gira: la mezzeria in altezza. */
  pivot: number;
};

function decode(buf: ArrayBuffer): Map<string, Raw> {
  const dv = new DataView(buf);
  if (dv.getUint32(0, true) !== 0x33435041) throw new Error("cars.bin: non è un APC3");
  const count = dv.getUint16(4, true);
  let p = 6;
  const dir: (Omit<Raw, "pos" | "nrm" | "uv" | "idx" | "pivot"> & { id: string; nVert: number })[] = [];
  for (let i = 0; i < count; i++) {
    const len = dv.getUint8(p++);
    let id = "";
    for (let k = 0; k < len; k++) id += String.fromCharCode(dv.getUint8(p++));
    const nVert = dv.getUint32(p, true);
    const nIdx = dv.getUint32(p + 4, true);
    const uvScale = dv.getFloat32(p + 8, true);
    const wide = dv.getUint8(p + 12) === 4;
    const nMat = dv.getUint8(p + 13);
    p += 14;
    const draws: Draw[] = [];
    for (let k = 0; k < nMat; k++) {
      const tex = dv.getUint8(p);
      const color: [number, number, number, number] = [
        dv.getUint8(p + 1) / 255,
        dv.getUint8(p + 2) / 255,
        dv.getUint8(p + 3) / 255,
        dv.getUint8(p + 4) / 255,
      ];
      draws.push({
        tex,
        color,
        spec: dv.getUint8(p + 5) / 255,
        gloss: dv.getUint8(p + 6),
        first: dv.getUint32(p + 7, true),
        count: dv.getUint32(p + 11, true),
      });
      p += 15;
    }
    dir.push({ id, nVert, nIdx, uvScale, wide, draws });
  }
  p = (p + 3) & ~3;

  const out = new Map<string, Raw>();
  for (const d of dir) {
    // slice() e non una vista: le sezioni non sono allineate come pretende un
    // Int16Array, e le copie si pagano una volta sola al caricamento.
    const pos = buf.slice(p, p + d.nVert * 6); p += d.nVert * 6;
    const nrm = buf.slice(p, p + d.nVert * 3); p += d.nVert * 3;
    p = (p + 1) & ~1;
    const uv = buf.slice(p, p + d.nVert * 4); p += d.nVert * 4;
    const bytes = d.wide ? 4 : 2;
    const idx = buf.slice(p, p + d.nIdx * bytes); p += d.nIdx * bytes;
    p = (p + 3) & ~3;

    let top = 0;
    const pv = new Int16Array(pos);
    for (let i = 1; i < pv.length; i += 3) if (pv[i] > top) top = pv[i];
    out.set(d.id, { ...d, pos, nrm, uv, idx, pivot: top * QS * 0.5 });
  }
  return out;
}

let meshes: Promise<Map<string, Raw>> | null = null;
function loadMeshes() {
  if (!meshes) {
    meshes = fetch("/models/cars.bin")
      .then((r) => {
        if (!r.ok) throw new Error(`cars.bin: ${r.status}`);
        return r.arrayBuffer();
      })
      .then(decode);
  }
  return meshes;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Matrici — il minimo indispensabile
   ═══════════════════════════════════════════════════════════════════════════ */

type M4 = Float32Array;
const m4 = () => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);

/** out = a · b, in ordine per colonne come vuole WebGL. */
function mul(out: M4, a: M4, b: M4) {
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++) {
      let s = 0;
      for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
      out[c * 4 + r] = s;
    }
  return out;
}

/** Prospettiva con la LARGHEZZA fissata: qualunque sia la forma del riquadro,
 *  nell'inquadratura ci stanno sempre `worldW` metri. Se si fissasse l'angolo
 *  verticale (come fa qualunque perspective() di libreria) una card più bassa
 *  rimpicciolirebbe l'auto, e le tre auto della griglia non sarebbero più in
 *  scala fra loro — che è metà del gusto di vederle in fila. */
function project(out: M4, worldW: number, dist: number, aspect: number, near: number, far: number) {
  const tx = worldW / 2 / dist;
  out.fill(0);
  out[0] = 1 / tx;
  out[5] = aspect / tx;
  out[10] = (far + near) / (near - far);
  out[11] = -1;
  out[14] = (2 * far * near) / (near - far);
  return out;
}

/** Ruota `m` di `a` radianti attorno a un asse della CAMERA (premoltiplica). */
function spin(m: M4, axis: 0 | 1, a: number) {
  const c = Math.cos(a), s = Math.sin(a);
  for (let col = 0; col < 4; col++) {
    const x = m[col * 4], y = m[col * 4 + 1], z = m[col * 4 + 2];
    if (axis === 1) {
      m[col * 4] = c * x + s * z;
      m[col * 4 + 2] = -s * x + c * z;
    } else {
      m[col * 4 + 1] = c * y - s * z;
      m[col * 4 + 2] = s * y + c * z;
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Gli shader

   La luce è FISSA RISPETTO ALLA CAMERA: gira il modello, non l'illuminazione,
   come su una piattaforma girevole in uno studio fotografico.

   È volutamente tenue — 55 % di ambiente. Le texture di questi modelli hanno
   già l'ombreggiatura dipinta dentro (si chiamano "DiffuseAOSO": diffuso più
   occlusione ambientale); rifarci sopra una luce forte vorrebbe dire ombrare
   due volte e spegnere i colori originali, che sono esattamente la cosa da non
   toccare. Qui la luce serve solo a far leggere il volume.

   Due facce: i modelli veri hanno pezzi aperti e triangoli con l'orientamento
   invertito. gl_FrontFacing rimette la normale dalla parte di chi guarda, così
   un pannello preso dal verso sbagliato resta illuminato invece di diventare
   una macchia nera.
   ═══════════════════════════════════════════════════════════════════════════ */

const VERT = `
attribute vec3 aPos;
attribute vec3 aNrm;
attribute vec2 aUv;
uniform mat4 uMVP;
uniform mat4 uRot;
uniform float uQS;
uniform float uUvScale;
uniform float uPivot;
uniform float uDist;
varying vec3 vN;
varying vec3 vPos;
varying vec2 vUv;
void main() {
  vec3 p = vec3(aPos.x * uQS, aPos.y * uQS - uPivot, aPos.z * uQS);
  gl_Position = uMVP * vec4(p, 1.0);
  vN = mat3(uRot) * aNrm;
  // Posizione negli assi della camera: serve al riflesso, che dipende da DOVE
  // si guarda il punto e non solo da come è girato. La camera è ferma e ruota
  // il modello, quindi basta la rotazione più l'allontanamento.
  vPos = mat3(uRot) * p - vec3(0.0, 0.0, uDist);
  vUv = aUv * uUvScale;
}`;

const FRAG = `
precision mediump float;
uniform sampler2D uTex;
uniform float uHasTex;
uniform vec4 uColor;
uniform vec3 uLight;
uniform float uSpec;
uniform float uGloss;
varying vec3 vN;
varying vec3 vPos;
varying vec2 vUv;
void main() {
  vec4 tex = texture2D(uTex, vUv);
  vec3 base = mix(vec3(1.0), tex.rgb, uHasTex) * uColor.rgb;
  float alpha = mix(1.0, tex.a, uHasTex) * uColor.a;
  if (alpha < 0.02) discard;

  vec3 n = normalize(vN);
  if (!gl_FrontFacing) n = -n;
  vec3 v = normalize(-vPos);

  float lam = max(dot(n, uLight), 0.0);
  float sky = 0.5 + 0.5 * n.y;
  vec3 col = base * (0.55 + 0.30 * lam + 0.15 * sky);

  // ── Il riflesso ──────────────────────────────────────────────────────────
  // Due pezzi, perché una carrozzeria fa due cose diverse.
  //
  // ① La lampada: il punto di luce vero e proprio, stretto. Half-vector fra
  //    luce e sguardo (Blinn), che è il modo economico di dire "questo punto
  //    rimanda la lampada dritta nell'occhio".
  vec3 h = normalize(uLight + v);
  float spot = pow(max(dot(n, h), 0.0), max(uGloss, 4.0));

  // ② Lo studio: la lamiera lucida non riflette solo la lampada, riflette la
  //    stanza — chiaro sopra, scuro sotto. Si prende la direzione riflessa
  //    dello sguardo e si guarda se punta in su. È quel che fa leggere una
  //    fiancata come verniciata invece che come plastica colorata, e costa
  //    una reflect().
  vec3 r = reflect(-v, n);
  float room = smoothstep(-0.35, 0.75, r.y);

  // Fresnel: di taglio TUTTO riflette di più, anche la vernice opaca. Senza,
  // i fianchi dell'auto restano piatti proprio dove dovrebbero accendersi.
  float fres = pow(1.0 - max(dot(n, v), 0.0), 4.0);

  // Il riflesso si SOMMA al colore, quindi va tenuto corto: troppo, e la
  // vernice sbianca invece di lucidarsi. La stanza pesa un quinto della
  // lampada, e quasi tutta di taglio.
  // Il trasparente si MESCOLA alla vernice, non ci si somma sopra: sommare
  // sbianca il rosso invece di lucidarlo. Quanto pesa lo dice Fresnel — poco
  // di faccia, molto di taglio, che è come si comporta una lamiera verniciata.
  float coat = uSpec * (0.22 + 0.90 * fres);
  col = mix(col, vec3(0.93, 0.95, 0.98) * (0.26 + 0.74 * room), clamp(coat, 0.0, 0.6));
  // La lampada, invece, si somma: è luce che arriva, non stanza che si specchia.
  col += uSpec * spot * 2.2;
  gl_FragColor = vec4(col, alpha);
}`;

/* ═══════════════════════════════════════════════════════════════════════════
   Il renderer
   ═══════════════════════════════════════════════════════════════════════════ */

/** Quanti metri stanno nella larghezza del riquadro. Uguale per tutte e tre:
 *  la 4C è più corta di ottanta centimetri e si deve vedere. */
const WORLD_W = 5.6;
const DIST = 14;
/** Da dove viene la luce, negli assi della camera. */
const LIGHT = [-0.42, 0.66, 0.62];

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) || "shader");
  return sh;
}

type Gpu = {
  draw: (rot: M4, w: number, h: number) => void;
  destroy: () => void;
};

function makeGpu(cv: HTMLCanvasElement, carId: string, raw: Raw, onTexture: () => void): Gpu | null {
  const opts = { antialias: true, alpha: true, depth: true, premultipliedAlpha: false };
  const gl = (cv.getContext("webgl", opts) || cv.getContext("experimental-webgl", opts)) as
    | WebGLRenderingContext
    | null;
  if (!gl) return null;
  // Gli indici a 32 bit servono all'Aventador, che da solo supera i 65 535
  // vertici. Se il browser non li avesse, quelle auto restano fuori.
  if (raw.wide && !gl.getExtension("OES_element_index_uint")) return null;

  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  const mkBuf = (target: number, data: ArrayBuffer) => {
    const b = gl.createBuffer()!;
    gl.bindBuffer(target, b);
    gl.bufferData(target, data, gl.STATIC_DRAW);
    return b;
  };
  const bufs = [
    mkBuf(gl.ARRAY_BUFFER, raw.pos),
    mkBuf(gl.ARRAY_BUFFER, raw.nrm),
    mkBuf(gl.ARRAY_BUFFER, raw.uv),
    mkBuf(gl.ELEMENT_ARRAY_BUFFER, raw.idx),
  ];

  const aPos = gl.getAttribLocation(prog, "aPos");
  const aNrm = gl.getAttribLocation(prog, "aNrm");
  const aUv = gl.getAttribLocation(prog, "aUv");
  gl.bindBuffer(gl.ARRAY_BUFFER, bufs[0]);
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 3, gl.SHORT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, bufs[1]);
  gl.enableVertexAttribArray(aNrm);
  gl.vertexAttribPointer(aNrm, 3, gl.BYTE, true, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, bufs[2]);
  gl.enableVertexAttribArray(aUv);
  gl.vertexAttribPointer(aUv, 2, gl.SHORT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufs[3]);

  const u = (n: string) => gl.getUniformLocation(prog, n);
  const uMVP = u("uMVP"), uRot = u("uRot"), uHasTex = u("uHasTex"), uColor = u("uColor");
  const uSpec = u("uSpec"), uGloss = u("uGloss");
  gl.uniform1f(u("uQS"), QS);
  gl.uniform1f(u("uUvScale"), raw.uvScale);
  gl.uniform1f(u("uPivot"), raw.pivot);
  gl.uniform1f(u("uDist"), DIST);
  gl.uniform1i(u("uTex"), 0);
  const l = Math.hypot(LIGHT[0], LIGHT[1], LIGHT[2]);
  gl.uniform3f(u("uLight"), LIGHT[0] / l, LIGHT[1] / l, LIGHT[2] / l);

  // ── Texture ──────────────────────────────────────────────────────────────
  // Finché non è arrivata, il materiale disegna con un pixel bianco: l'auto si
  // vede subito nel suo colore di base e si riveste man mano.
  const blank = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, blank);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));

  const texes = new Map<number, WebGLTexture>();
  const wanted = new Set(raw.draws.map((d) => d.tex).filter((t) => t !== 255));
  const images: HTMLImageElement[] = [];
  let alive = true;
  for (const id of wanted) {
    const img = new Image();
    images.push(img);
    img.onload = () => {
      if (!alive) return;
      const t = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      // Ripetizione + mipmap: le UV di questi modelli arrivano a 60, e il
      // convertitore per questo tiene le texture in potenze di due.
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.generateMipmap(gl.TEXTURE_2D);
      texes.set(id, t);
      onTexture();
    };
    img.src = `/models/tex/${carId}-${id}.webp`;
  }

  gl.enable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  const P = m4(), MV = m4(), MVP = m4();
  const idxType = raw.wide ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
  const idxBytes = raw.wide ? 4 : 2;

  return {
    draw(rot, w, h) {
      if (!w || !h) return;
      gl.useProgram(prog);
      gl.viewport(0, 0, cv.width, cv.height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      project(P, WORLD_W, DIST, w / h, 0.5, 60);
      MV.set(rot);
      MV[14] = -DIST;
      mul(MVP, P, MV);
      gl.uniformMatrix4fv(uMVP, false, MVP);
      gl.uniformMatrix4fv(uRot, false, rot);

      // I trasparenti stanno in fondo all'elenco (li ordina il convertitore):
      // si disegnano dopo gli opachi e senza scrivere in profondità, se no il
      // parabrezza nasconderebbe l'abitacolo invece di lasciarlo vedere.
      let blending = false;
      for (const d of raw.draws) {
        const clear = d.color[3] < 1;
        if (clear !== blending) {
          blending = clear;
          if (clear) { gl.enable(gl.BLEND); gl.depthMask(false); }
          else { gl.disable(gl.BLEND); gl.depthMask(true); }
        }
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, (d.tex !== 255 && texes.get(d.tex)) || blank);
        gl.uniform1f(uHasTex, d.tex !== 255 && texes.has(d.tex) ? 1 : 0);
        gl.uniform4fv(uColor, d.color);
        gl.uniform1f(uSpec, d.spec);
        gl.uniform1f(uGloss, d.gloss);
        gl.drawElements(gl.TRIANGLES, d.count, idxType, d.first * idxBytes);
      }
      if (blending) { gl.disable(gl.BLEND); gl.depthMask(true); }
    },
    destroy() {
      alive = false;
      for (const img of images) img.src = "";
      for (const b of bufs) gl.deleteBuffer(b);
      for (const t of texes.values()) gl.deleteTexture(t);
      gl.deleteTexture(blank);
      gl.deleteProgram(prog);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Il componente
   ═══════════════════════════════════════════════════════════════════════════ */

function motionOK() {
  return typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** La posa di partenza: tre quarti anteriore, visto da in piedi.
 *
 *  Il mezzo giro di `flip` si somma all'imbardata, PRIMA del beccheggio: due
 *  rotazioni attorno allo stesso asse si sommano, quindi sommarlo qui equivale a
 *  far girare l'auto sul suo asse verticale — che è quel che si vuole. Girarla
 *  dopo, con l'auto già inclinata, la ribalterebbe: si vedrebbe da sotto. */
function restPose(flip: boolean): M4 {
  const m = m4();
  spin(m, 1, -0.62 + (flip ? Math.PI : 0));
  spin(m, 0, 0.2);
  return m;
}

function CarModel({ car, index }: { car: CarSpec; index: number }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const cvRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"loading" | "ok" | "off">("loading");

  useEffect(() => {
    const stage = stageRef.current;
    const cv = cvRef.current;
    if (!stage || !cv) return;

    let dead = false;
    let cleanup: (() => void) | null = null;

    loadMeshes()
      .then((all) => {
        const raw = all.get(car.id);
        if (dead || !raw) return;
        let repaint = () => {};
        const gpu = makeGpu(cv, car.id, raw, () => repaint());
        if (!gpu) {
          setState("off");
          return;
        }
        setState("ok");
        const m = mount(stage, cv, gpu, index, car.flip === true);
        repaint = m.repaint;
        cleanup = m.stop;
      })
      .catch(() => {
        if (!dead) setState("off");
      });

    return () => {
      dead = true;
      cleanup?.();
    };
  }, [car.id, index]);

  return (
    <article className="sb-car">
      <div className="sb-panel">
        <div className="sb-panel-inner sb-car-inner">
          <div
            className="sb-car-stage"
            ref={stageRef}
            tabIndex={state === "ok" ? 0 : -1}
            role="img"
            aria-label={car.aria}
            data-state={state}
          >
            <canvas ref={cvRef} className="sb-car-cv" />
            {state === "ok" && (
              <span className="sb-car-hint" aria-hidden="true">
                Drag to turn
              </span>
            )}
          </div>
          <div className="sb-car-id">
            <span className="sb-car-brand" translate="no" data-no-i18n>
              {car.brand}
            </span>
            <h4 className="sb-car-name" translate="no" data-no-i18n>
              {car.model}
            </h4>
          </div>
          <dl className="sb-car-specs">
            <div>
              <dt>Engine</dt>
              <dd translate="no" data-no-i18n>{car.engine}</dd>
            </div>
            <div>
              <dt>Power</dt>
              <dd translate="no" data-no-i18n>{car.power}</dd>
            </div>
            <div>
              <dt>L × W × H</dt>
              <dd translate="no" data-no-i18n>{car.size}</dd>
            </div>
          </dl>
        </div>
      </div>
    </article>
  );
}

/** Misura, gesto e ciclo di rendering: nascono e muoiono insieme. */
function mount(stage: HTMLDivElement, cv: HTMLCanvasElement, gpu: Gpu, index: number, flip: boolean) {
  let w = 0;
  let h = 0;
  const anim = motionOK();

  const rot = restPose(flip);
  let intro = anim ? 0.95 : 0;
  if (intro) spin(rot, 1, intro);

  let vx = 0;
  let vy = 0;
  let raf = 0;
  let dragging = false;
  let t0 = 0;

  const paint = () => gpu.draw(rot, w, h);

  const tick = (now: number) => {
    raf = 0;
    let more = false;
    if (intro) {
      if (!t0) t0 = now;
      const k = Math.min(1, Math.max(0, now - t0 - index * 150) / 900);
      const want = 0.95 * Math.pow(1 - k, 3);
      spin(rot, 1, want - intro);
      intro = want;
      if (k < 1) more = true;
      else intro = 0;
    } else if (!dragging && (Math.abs(vx) > 0.0006 || Math.abs(vy) > 0.0006)) {
      spin(rot, 1, vx);
      spin(rot, 0, vy);
      vx *= 0.93;
      vy *= 0.93;
      more = true;
    }
    paint();
    if (more) raf = requestAnimationFrame(tick);
  };
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(tick);
  };

  const resize = () => {
    const r = stage.getBoundingClientRect();
    if (!r.width) return;
    w = r.width;
    h = r.height;
    const k = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(w * k);
    cv.height = Math.round(h * k);
    cv.style.width = `${w}px`;
    cv.style.height = `${h}px`;
    paint();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(stage);
  resize();
  if (intro) kick();

  let lx = 0;
  let ly = 0;
  const K = 0.009; // radianti per pixel: un giro completo in ~700 px
  const down = (e: PointerEvent) => {
    if (e.button != null && e.button !== 0) return;
    dragging = true;
    intro = 0;
    vx = vy = 0;
    lx = e.clientX;
    ly = e.clientY;
    stage.setPointerCapture(e.pointerId);
    stage.dataset.grab = "1";
    stage.dataset.used = "1";
  };
  const move = (e: PointerEvent) => {
    if (!dragging) return;
    const dx = (e.clientX - lx) * K;
    const dy = (e.clientY - ly) * K;
    lx = e.clientX;
    ly = e.clientY;
    spin(rot, 1, dx);
    spin(rot, 0, dy);
    vx = dx;
    vy = dy;
    kick();
  };
  const up = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    delete stage.dataset.grab;
    try {
      stage.releasePointerCapture(e.pointerId);
    } catch {
      /* il puntatore può essere già andato via */
    }
    if (!anim) vx = vy = 0;
    kick();
  };
  const key = (e: KeyboardEvent) => {
    const ax = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0;
    const ay = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;
    if (!ax && !ay) return;
    e.preventDefault();
    stage.dataset.used = "1";
    spin(rot, 1, ax * 0.26);
    spin(rot, 0, ay * 0.26);
    kick();
  };

  stage.addEventListener("pointerdown", down);
  stage.addEventListener("pointermove", move);
  stage.addEventListener("pointerup", up);
  stage.addEventListener("pointercancel", up);
  stage.addEventListener("keydown", key);

  return {
    repaint: () => {
      if (!raf) paint();
    },
    stop: () => {
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
      stage.removeEventListener("pointerdown", down);
      stage.removeEventListener("pointermove", move);
      stage.removeEventListener("pointerup", up);
      stage.removeEventListener("pointercancel", up);
      stage.removeEventListener("keydown", key);
      gpu.destroy();
    },
  };
}

export default function DreamGarage() {
  return (
    <div className="sb-garage">
      {CARS.map((c, i) => (
        <CarModel key={c.id} car={c} index={i} />
      ))}
    </div>
  );
}
