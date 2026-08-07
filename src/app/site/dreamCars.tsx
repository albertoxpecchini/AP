// ─────────────────────────────────────────────────────────────────────────────
// Il garage — i tre modelli 3D, girabili in ogni verso.
//
// ── Cosa c'è dentro ──────────────────────────────────────────────────────────
// I modelli veri, non una loro imitazione: l'Aventador, la 4C e la R8 così come
// stanno nei file di partenza (autori e licenze in public/models/README.md),
// passati per scripts/build-cars.mjs — che butta via quello che da fuori non si
// vede, raddrizza, porta la lunghezza a quella di listino e semplifica da
// trentamila triangoli a novemila. Tutte e tre stanno in public/models/cars.bin.
//
// ── Perché WebGL e non un renderer a mano sul canvas 2D ──────────────────────
// Perché la prima versione era esattamente quello, e non funzionava. Su canvas
// 2D le facce si ordinano per profondità e si dipingono dalla più lontana (il
// "pittore"): con tre triangoli va bene, con novemila che si compenetrano — e i
// modelli veri si compenetrano dappertutto: il cerchio dentro la gomma, lo
// specchietto contro il montante — l'ordine giusto NON ESISTE, e la carrozzeria
// si vede a scaglie. Non è un difetto di precisione, è il metodo che non regge.
//
// WebGL ha il buffer di profondità: decide pixel per pixel chi sta davanti, e
// il problema sparisce del tutto. In più il disegno lo fa la scheda video, così
// muovere l'auto costa una manciata di matrici invece di novemila riempimenti.
//
// three.js resta fuori: sarebbe centosessanta kB gzip — più di tutta la home
// dopo l'ultimo giro di dimagrimento — per una mesh statica, una luce, nessuna
// ombra e nessuna texture. Quel che serve sono i due shader qui sotto.
//
// ── Il movimento ─────────────────────────────────────────────────────────────
// Rotazione libera: si trascina e l'auto gira di 360° in tutti i versi, sotto
// compreso. Non ci sono due angoli (imbardata e beccheggio) da sommare — quelli
// si incastrano ai poli — ma una matrice di rotazione che viene MOLTIPLICATA a
// sinistra dallo spostamento del dito letto negli assi della camera. Comunque
// sia messa l'auto, trascinare a destra la fa girare verso destra sullo schermo.
//
// Da fermo il ciclo di rendering è spento: zero lavoro. Al rilascio l'abbrivio
// si spegne da sé. L'unica cosa che parte da sola è mezzo giro di presentazione
// quando il riquadro arriva in scena; con prefers-reduced-motion nemmeno quello.
//
// touch-action: pan-y sul palco, non `none`: il dito che scorre la pagina deve
// continuare a scorrerla — qui si prende solo il trascinamento orizzontale.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";
import { subscribeTheme } from "../theme/themeCore";

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
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   Il file delle mesh

   Formato (little-endian), scritto da scripts/build-cars.mjs:
     "APC2", u16 quante auto
     per auto: u8 lunghezza-nome, nome ascii, u32 vertici, u32 triangoli
     riempimento a multiplo di 4
     per auto, nello stesso ordine:
       i16 ×3 posizioni (decimi di millimetro)
       i8  ×3 normali (−127…127)
       u8     materiale
       u16 ×3 indici
       riempimento a multiplo di 4

   Interi e non float perché è la scheda video a saperli leggere così com'è:
   SHORT e BYTE sono tipi di attributo di WebGL, quindi il file si carica nei
   buffer senza convertire niente. Il dimezzamento del peso è in regalo.

   Si scarica una volta sola per tutta la pagina: il primo riquadro che arriva
   in vista fa partire la fetch, gli altri due si attaccano alla stessa promessa.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Decimi di millimetro → metri. Lo stesso valore sta nel convertitore. */
const QS = 1e-4;

type Raw = {
  pos: ArrayBuffer;
  nrm: ArrayBuffer;
  mat: ArrayBuffer;
  idx: ArrayBuffer;
  nTri: number;
  /** Quota attorno a cui gira: la mezzeria in altezza. */
  pivot: number;
};

function decode(buf: ArrayBuffer): Map<string, Raw> {
  const dv = new DataView(buf);
  if (dv.getUint32(0, true) !== 0x32435041) throw new Error("cars.bin: non è un APC2");
  const count = dv.getUint16(4, true);
  let p = 6;
  const dir: { id: string; nv: number; nt: number }[] = [];
  for (let i = 0; i < count; i++) {
    const len = dv.getUint8(p++);
    let id = "";
    for (let k = 0; k < len; k++) id += String.fromCharCode(dv.getUint8(p++));
    dir.push({ id, nv: dv.getUint32(p, true), nt: dv.getUint32(p + 4, true) });
    p += 8;
  }
  p = (p + 3) & ~3;

  const out = new Map<string, Raw>();
  for (const d of dir) {
    // slice() e non una vista: le sezioni non sono allineate come pretende un
    // Int16Array, e le copie si pagano una volta sola al caricamento.
    const pos = buf.slice(p, p + d.nv * 6); p += d.nv * 6;
    const nrm = buf.slice(p, p + d.nv * 3); p += d.nv * 3;
    const mat = buf.slice(p, p + d.nv); p += d.nv;
    const idx = buf.slice(p, p + d.nt * 6); p += d.nt * 6;
    p = (p + 3) & ~3;

    let top = 0;
    const pv = new Int16Array(pos);
    for (let i = 1; i < pv.length; i += 3) if (pv[i] > top) top = pv[i];
    out.set(d.id, { pos, nrm, mat, idx, nTri: d.nt, pivot: top * QS * 0.5 });
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
 *  scala fra loro. */
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

   Il materiale viaggia come un numero per vertice (0 carrozzeria, 1 vetri,
   2 gomma, 3 cerchio) e le due tinte — ombra e luce — si pescano da due
   tabelle di uniform NEL VERTEX SHADER. Non è un vezzo: in GLSL ES 1.00 un
   array di uniform si può indicizzare con un'espressione qualunque solo di
   qua; nel fragment shader servirebbe un indice costante, e toccherebbe
   riscrivere la scelta come una catena di mix.

   La luce è FISSA RISPETTO ALLA CAMERA: gira il modello, non l'illuminazione,
   come su una piattaforma girevole in uno studio fotografico.

   Due facce: i modelli veri hanno pezzi aperti (i passaruota, le prese d'aria)
   e triangoli con l'orientamento sbagliato. gl_FrontFacing rimette la normale
   dalla parte di chi guarda, così un pannello preso dal verso sbagliato resta
   illuminato invece di diventare una macchia nera.
   ═══════════════════════════════════════════════════════════════════════════ */

const VERT = `
attribute vec3 aPos;
attribute vec3 aNrm;
attribute float aMat;
uniform mat4 uMVP;
uniform mat4 uRot;
uniform vec3 uLo[4];
uniform vec3 uHi[4];
uniform float uQS;
uniform float uPivot;
varying vec3 vN;
varying vec3 vLo;
varying vec3 vHi;
void main() {
  vec3 p = vec3(aPos.x * uQS, aPos.y * uQS - uPivot, aPos.z * uQS);
  gl_Position = uMVP * vec4(p, 1.0);
  vN = mat3(uRot) * aNrm;
  int m = int(aMat + 0.5);
  vLo = uLo[m];
  vHi = uHi[m];
}`;

const FRAG = `
precision mediump float;
uniform vec3 uLight;
varying vec3 vN;
varying vec3 vLo;
varying vec3 vHi;
void main() {
  vec3 n = normalize(vN);
  if (!gl_FrontFacing) n = -n;
  // Una lampada e un cielo, come in uno studio fotografico. Il cielo (la
  // componente che dipende solo da quanto una faccia guarda in su) è la
  // ragione per cui si legge la FORMA: con la sola lampada, metà carrozzeria
  // finisce contro il bianco e l'auto diventa una sagoma di gesso.
  float lam = max(dot(n, uLight), 0.0);
  float sky = 0.5 + 0.5 * n.y;
  // Il profilo di taglio va più scuro: è quel poco che stacca la silhouette
  // dal fondo chiaro della card.
  float rim = 1.0 - abs(n.z);
  float t = (0.06 + 0.58 * pow(lam, 0.75) + 0.36 * sky * sky) * (1.0 - 0.30 * rim * rim);
  gl_FragColor = vec4(mix(vLo, vHi, clamp(t, 0.0, 1.0)), 1.0);
}`;

/* ═══════════════════════════════════════════════════════════════════════════
   Il renderer
   ═══════════════════════════════════════════════════════════════════════════ */

/** Quanti metri stanno nella larghezza del riquadro. Uguale per tutte e tre:
 *  la 4C è più corta di ottanta centimetri e si deve vedere. */
const WORLD_W = 5.6;
const DIST = 14;
/** Da dove viene la luce, negli assi della camera. */
const LIGHT = [-0.44, 0.68, 0.59];

type RGB = [number, number, number];

/** Qualunque colore CSS → tre numeri 0…1, passando dal canvas 2D: `fillStyle`
 *  normalizza tutto quello che il browser sa leggere, e non c'è da scrivere un
 *  parser per hex, rgb(), hsl() e compagnia. */
function rgbOf(probe: CanvasRenderingContext2D, css: string, fallback: string): RGB {
  probe.fillStyle = fallback;
  probe.fillStyle = css.trim() || fallback;
  const s = String(probe.fillStyle);
  let r = 128, g = 128, b = 128;
  if (s[0] === "#") {
    const h = s.length === 4 ? s[1] + s[1] + s[2] + s[2] + s[3] + s[3] : s.slice(1, 7);
    const v = parseInt(h, 16);
    r = (v >> 16) & 255; g = (v >> 8) & 255; b = v & 255;
  } else {
    const m = s.match(/[\d.]+/g);
    if (m) { r = +m[0]; g = +m[1]; b = +m[2]; }
  }
  return [r / 255, g / 255, b / 255];
}

/** Le quattro coppie ombra/luce, nell'ordine dei materiali. */
function readPal(el: HTMLElement) {
  const probe = document.createElement("canvas").getContext("2d")!;
  const cs = getComputedStyle(el);
  const g = (k: string, f: string) => rgbOf(probe, cs.getPropertyValue(k), f);
  const lo = [
    g("--gar-body-lo", "#8d979c"),
    g("--gar-glass-lo", "#2b7357"),
    g("--gar-tyre-lo", "#23282b"),
    g("--gar-rim-lo", "#7d868b"),
  ];
  const hi = [
    g("--gar-body-hi", "#f3f5f6"),
    g("--gar-glass-hi", "#8fe4c1"),
    g("--gar-tyre-hi", "#5c6366"),
    g("--gar-rim-hi", "#ffffff"),
  ];
  return {
    lo: Float32Array.from(lo.flat()),
    hi: Float32Array.from(hi.flat()),
  };
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(sh) || "shader");
  }
  return sh;
}

type Gpu = {
  gl: WebGLRenderingContext;
  draw: (rot: M4, w: number, h: number) => void;
  setPal: (el: HTMLElement) => void;
  destroy: () => void;
};

function makeGpu(cv: HTMLCanvasElement, raw: Raw): Gpu | null {
  const gl = (cv.getContext("webgl", { antialias: true, alpha: true, depth: true }) ||
    cv.getContext("experimental-webgl", { antialias: true, alpha: true, depth: true })) as
    | WebGLRenderingContext
    | null;
  if (!gl) return null;

  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  const buf = (target: number, data: ArrayBuffer) => {
    const b = gl.createBuffer()!;
    gl.bindBuffer(target, b);
    gl.bufferData(target, data, gl.STATIC_DRAW);
    return b;
  };
  const bPos = buf(gl.ARRAY_BUFFER, raw.pos);
  const bNrm = buf(gl.ARRAY_BUFFER, raw.nrm);
  const bMat = buf(gl.ARRAY_BUFFER, raw.mat);
  const bIdx = buf(gl.ELEMENT_ARRAY_BUFFER, raw.idx);

  const aPos = gl.getAttribLocation(prog, "aPos");
  const aNrm = gl.getAttribLocation(prog, "aNrm");
  const aMat = gl.getAttribLocation(prog, "aMat");
  const uMVP = gl.getUniformLocation(prog, "uMVP");
  const uRot = gl.getUniformLocation(prog, "uRot");
  const uLight = gl.getUniformLocation(prog, "uLight");
  const uLo = gl.getUniformLocation(prog, "uLo");
  const uHi = gl.getUniformLocation(prog, "uHi");

  gl.bindBuffer(gl.ARRAY_BUFFER, bPos);
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 3, gl.SHORT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, bNrm);
  gl.enableVertexAttribArray(aNrm);
  gl.vertexAttribPointer(aNrm, 3, gl.BYTE, true, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, bMat);
  gl.enableVertexAttribArray(aMat);
  gl.vertexAttribPointer(aMat, 1, gl.UNSIGNED_BYTE, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bIdx);

  gl.uniform1f(gl.getUniformLocation(prog, "uQS"), QS);
  gl.uniform1f(gl.getUniformLocation(prog, "uPivot"), raw.pivot);
  const l = Math.hypot(LIGHT[0], LIGHT[1], LIGHT[2]);
  gl.uniform3f(uLight, LIGHT[0] / l, LIGHT[1] / l, LIGHT[2] / l);

  gl.enable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  gl.clearColor(0, 0, 0, 0);

  const P = m4();
  const MV = m4();
  const MVP = m4();

  return {
    gl,
    setPal(el) {
      const p = readPal(el);
      gl.useProgram(prog);
      gl.uniform3fv(uLo, p.lo);
      gl.uniform3fv(uHi, p.hi);
    },
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
      gl.drawElements(gl.TRIANGLES, raw.nTri * 3, gl.UNSIGNED_SHORT, 0);
    },
    destroy() {
      for (const b of [bPos, bNrm, bMat, bIdx]) gl.deleteBuffer(b);
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

/** La posa di partenza: tre quarti anteriore sinistro, visto da in piedi. */
function restPose(): M4 {
  const m = m4();
  spin(m, 1, -0.62);
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
        const gpu = makeGpu(cv, raw);
        if (!gpu) {
          setState("off");
          return;
        }
        setState("ok");
        cleanup = mount(stage, cv, gpu, index);
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

/** Misura, palette, gesto e ciclo di rendering: nascono e muoiono insieme. */
function mount(stage: HTMLDivElement, cv: HTMLCanvasElement, gpu: Gpu, index: number) {
  let w = 0;
  let h = 0;
  const anim = motionOK();

  const rot = restPose();
  // La presentazione: mezzo giro in più da smaltire.
  let intro = anim ? 0.95 : 0;
  if (intro) spin(rot, 1, intro);

  let vx = 0;
  let vy = 0;
  let raf = 0;
  let dragging = false;
  let t0 = 0;

  gpu.setPal(stage);

  const paint = () => gpu.draw(rot, w, h);

  const tick = (now: number) => {
    raf = 0;
    let more = false;
    if (intro) {
      if (!t0) t0 = now;
      const k = Math.min(1, Math.max(0, now - t0 - index * 150) / 900);
      const want = 0.95 * (1 - (1 - Math.pow(1 - k, 3)));
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

  // ── Misura ───────────────────────────────────────────────────────────────
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

  // ── Gesto ────────────────────────────────────────────────────────────────
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
  const offTheme = subscribeTheme(() => {
    gpu.setPal(stage);
    paint();
  });

  return () => {
    ro.disconnect();
    offTheme();
    if (raf) cancelAnimationFrame(raf);
    stage.removeEventListener("pointerdown", down);
    stage.removeEventListener("pointermove", move);
    stage.removeEventListener("pointerup", up);
    stage.removeEventListener("pointercancel", up);
    stage.removeEventListener("keydown", key);
    gpu.destroy();
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
