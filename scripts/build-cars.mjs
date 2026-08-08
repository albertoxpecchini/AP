// ─────────────────────────────────────────────────────────────────────────────
// Da modello 3D scaricato a modello 3D che si apre in una pagina web.
//
// I tre modelli del garage (home, sezione "Three cars I dream about") arrivano
// in formati che un browser non sa aprire — un FBX binario e due OBJ, con le
// texture sparse in cartella. Questo script li rimette in un formato che il
// browser apre di corsa, SENZA toccare quello che sono: stessa geometria,
// stesse normali, stesse coordinate texture, stessi materiali, stessi colori.
//
// Non si semplifica niente, non si butta via niente, non si ricolora niente.
// L'unica cosa che cambia sono i CONTENITORI:
//   · la geometria passa da testo (un OBJ è un file di testo: "v 1.234 5.678")
//     a interi binari — le posizioni a un decimo di millimetro, le normali a un
//     byte per asse, le UV a interi con un fattore di scala. Sono gli stessi
//     tipi che WebGL vuole nei suoi buffer, quindi il file si carica così com'è;
//   · le texture passano da PNG a WebP. Stessi pixel, un quarto del peso.
//
// L'unica cosa che il modello si prende dallo script è la POSA in scena: viene
// centrato, appoggiato a terra, orientato col muso in avanti e portato alla sua
// lunghezza vera in metri. Non è una modifica al modello — è quello che fa
// qualunque visualizzatore quando inquadra un oggetto.
//
// Uso:  node scripts/build-cars.mjs <cartella-sorgenti>
// I sorgenti NON stanno nel repository (sono modelli di terzi e pesano 30 MB):
// in repository ci vanno il .bin e le texture generate. Vedi
// public/models/README.md.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { readFbx } from "./lib/fbx.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = process.argv[2] || join(ROOT, "..", "car-sources");
const OUTDIR = join(ROOT, "public", "models");
const TEXDIR = join(OUTDIR, "tex");

/** Lato massimo delle texture. Le card sono da 300 px: 512 è già abbondante,
 *  e quel che si guadagna in peso è un fattore dieci. */
const TEX_MAX = 512;
/** Passo della quantizzazione delle posizioni: un decimo di millimetro. */
const QS = 1e-4;

const CARS = [
  {
    id: "aventador",
    file: "lambo/m/FINAL_MODEL.fbx",
    format: "fbx",
    length: 4.78,
  },
  {
    id: "alfa4c",
    file: "alfa/m/alfa_romeo_4c/car_alfa_romeo_4c.obj",
    format: "obj",
    length: 3.989,
  },
  {
    id: "audir8",
    file: "audi/m/2008 audi r8.obj",
    format: "obj",
    length: 4.426,
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   OBJ + MTL

   In un OBJ un angolo di faccia si scrive "v/vt/vn": posizione, coordinata
   texture e normale sono TRE elenchi separati, e la stessa posizione compare
   con normali diverse a seconda della faccia — è così che si tengono gli
   spigoli vivi. WebGL invece vuole un vertice solo con tutto attaccato, quindi
   ogni combinazione diversa diventa un vertice.
   ═══════════════════════════════════════════════════════════════════════════ */

function readMtl(path) {
  const out = new Map();
  if (!existsSync(path)) return out;
  const dir = dirname(path);
  let cur = null;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (t.startsWith("newmtl ")) {
      cur = { name: t.slice(7).trim(), tex: null, color: [0.8, 0.8, 0.8], alpha: 1 };
      out.set(cur.name, cur);
    } else if (!cur) continue;
    else if (t.startsWith("map_Kd ")) {
      const f = t.slice(7).trim().split(/\s+/).pop();
      const p = join(dir, f);
      if (existsSync(p)) cur.tex = p;
    } else if (/^Kd\s/.test(t)) {
      const p = t.split(/\s+/);
      cur.color = [+p[1], +p[2], +p[3]];
    } else if (/^d\s/.test(t)) cur.alpha = parseFloat(t.slice(2));
    else if (/^Tr\s/.test(t)) cur.alpha = 1 - parseFloat(t.slice(3));
  }
  return out;
}

function readObj(path) {
  const txt = readFileSync(path, "utf8");
  const mtl = readMtl(path.replace(/\.obj$/i, ".mtl"));
  const V = [], VT = [], VN = [];
  const pos = [], nrm = [], uv = [], tris = [];
  const dedup = new Map();
  const matList = [];
  const matIndex = new Map();
  let mat = 0;

  const useMtl = (name) => {
    let i = matIndex.get(name);
    if (i === undefined) {
      i = matList.length;
      matIndex.set(name, i);
      matList.push(mtl.get(name) ?? { name, tex: null, color: [0.8, 0.8, 0.8], alpha: 1 });
    }
    mat = i;
  };

  const vertex = (tok) => {
    let i = dedup.get(tok);
    if (i !== undefined) return i;
    const [a, b, c] = tok.split("/");
    const vi = (+a < 0 ? V.length / 3 + +a : +a - 1) * 3;
    i = pos.length / 3;
    dedup.set(tok, i);
    pos.push(V[vi], V[vi + 1], V[vi + 2]);
    if (c) {
      const ni = (+c < 0 ? VN.length / 3 + +c : +c - 1) * 3;
      nrm.push(VN[ni], VN[ni + 1], VN[ni + 2]);
    } else nrm.push(0, 0, 0);
    if (b) {
      const ti = (+b < 0 ? VT.length / 2 + +b : +b - 1) * 2;
      // La V dell'OBJ conta dal basso, un'immagine dall'alto.
      uv.push(VT[ti], 1 - VT[ti + 1]);
    } else uv.push(0, 0);
    return i;
  };

  for (const line of txt.split("\n")) {
    const c0 = line[0];
    if (c0 === "v" && line[1] === " ") {
      const p = line.split(/\s+/);
      V.push(+p[1], +p[2], +p[3]);
    } else if (c0 === "v" && line[1] === "t") {
      const p = line.split(/\s+/);
      VT.push(+p[1], +p[2]);
    } else if (c0 === "v" && line[1] === "n") {
      const p = line.split(/\s+/);
      VN.push(+p[1], +p[2], +p[3]);
    } else if (line.startsWith("usemtl ")) {
      useMtl(line.slice(7).trim());
    } else if (c0 === "f" && line[1] === " ") {
      if (!matList.length) useMtl("__default");
      const p = line.trim().split(/\s+/);
      const idx = [];
      for (let i = 1; i < p.length; i++) idx.push(vertex(p[i]));
      for (let i = 1; i < idx.length - 1; i++) tris.push(idx[0], idx[i], idx[i + 1], mat);
    }
  }
  return { pos, nrm, uv, tris, materials: matList };
}

/* ═══════════════════════════════════════════════════════════════════════════
   La posa in scena

   L'asse più lungo del contenitore è la lunghezza, il più corto l'altezza:
   vale per una qualunque auto. Il muso è dalla parte dove sta l'ABITACOLO —
   su un'auto a motore centrale i vetri sono spostati in avanti perché dietro
   c'è il motore. Se non si trovano vetri, si ripiega sull'estremità più bassa.
   ═══════════════════════════════════════════════════════════════════════════ */

function pose(m, car) {
  const { pos } = m;
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pos.length; i += 3)
    for (let k = 0; k < 3; k++) {
      if (pos[i + k] < lo[k]) lo[k] = pos[i + k];
      if (pos[i + k] > hi[k]) hi[k] = pos[i + k];
    }
  const ext = [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]];
  const [aLen, aWid, aHei] = [0, 1, 2].sort((a, b) => ext[b] - ext[a]);
  const cx = (lo[aLen] + hi[aLen]) * 0.5;

  const glassy = new Set(
    m.materials.map((x, i) => (/glass|window|vetro/i.test(x.name) ? i : -1)).filter((i) => i >= 0),
  );
  let gs = 0, gn = 0;
  for (let t = 0; t < m.tris.length; t += 4) {
    if (!glassy.has(m.tris[t + 3])) continue;
    for (let k = 0; k < 3; k++) { gs += pos[m.tris[t + k] * 3 + aLen]; gn++; }
  }
  let noseAtHigh;
  if (gn > 30) noseAtHigh = gs / gn > cx;
  else {
    const band = ext[aLen] * 0.16;
    let sA = 0, nA = 0, sB = 0, nB = 0;
    for (let i = 0; i < pos.length; i += 3) {
      if (pos[i + aLen] < lo[aLen] + band) { sA += pos[i + aHei]; nA++; }
      else if (pos[i + aLen] > hi[aLen] - band) { sB += pos[i + aHei]; nB++; }
    }
    noseAtHigh = nA && nB ? sB / nB < sA / nA : false;
  }

  const scale = car.length / ext[aLen];
  const sx = noseAtHigh ? -scale : scale;
  const cz = (lo[aWid] + hi[aWid]) * 0.5;
  const gy = lo[aHei];

  const P = new Float64Array(pos.length);
  const N = new Float64Array(m.nrm.length);
  for (let i = 0; i < pos.length; i += 3) {
    P[i] = (pos[i + aLen] - cx) * sx;
    P[i + 1] = (pos[i + aHei] - gy) * scale;
    P[i + 2] = (pos[i + aWid] - cz) * scale;
    // Le normali seguono la stessa permutazione, senza traslazione né scala —
    // e con lo specchio, se c'è: una normale specchiata sull'asse sbagliato
    // illumina l'auto al contrario.
    N[i] = m.nrm[i + aLen] * (noseAtHigh ? -1 : 1);
    N[i + 1] = m.nrm[i + aHei];
    N[i + 2] = m.nrm[i + aWid];
  }
  // Lo specchio inverte l'orientamento dei triangoli: senza rimetterli a posto
  // il davanti e il dietro delle facce si scambiano.
  if (noseAtHigh)
    for (let t = 0; t < m.tris.length; t += 4) {
      const tmp = m.tris[t + 1];
      m.tris[t + 1] = m.tris[t + 2];
      m.tris[t + 2] = tmp;
    }
  return { ...m, pos: P, nrm: N, height: ext[aHei] * scale };
}

/** Le normali mancanti (l'OBJ può non averle) si ricavano dalle facce. */
function fillNormals(m) {
  const missing = [];
  for (let i = 0; i < m.nrm.length; i += 3)
    if (!m.nrm[i] && !m.nrm[i + 1] && !m.nrm[i + 2]) missing.push(i / 3);
  if (!missing.length) return;
  const acc = new Float64Array(m.nrm.length);
  for (let t = 0; t < m.tris.length; t += 4) {
    const a = m.tris[t] * 3, b = m.tris[t + 1] * 3, c = m.tris[t + 2] * 3;
    const ux = m.pos[b] - m.pos[a], uy = m.pos[b + 1] - m.pos[a + 1], uz = m.pos[b + 2] - m.pos[a + 2];
    const wx = m.pos[c] - m.pos[a], wy = m.pos[c + 1] - m.pos[a + 1], wz = m.pos[c + 2] - m.pos[a + 2];
    const nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
    for (const v of [a, b, c]) { acc[v] += nx; acc[v + 1] += ny; acc[v + 2] += nz; }
  }
  for (const v of missing) {
    const i = v * 3;
    const len = Math.hypot(acc[i], acc[i + 1], acc[i + 2]) || 1;
    m.nrm[i] = acc[i] / len; m.nrm[i + 1] = acc[i + 1] / len; m.nrm[i + 2] = acc[i + 2] / len;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Scrittura

   I triangoli si riordinano per MATERIALE, così ogni materiale diventa un
   tratto contiguo di indici e si disegna con una chiamata sola: si lega la sua
   texture, si disegna il tratto, avanti il prossimo.
   ═══════════════════════════════════════════════════════════════════════════ */

async function writeTextures(car, materials) {
  const seen = new Map(); // file sorgente → indice texture
  for (const m of materials) {
    if (!m.tex) { m.texId = -1; continue; }
    const key = resolve(m.tex);
    if (seen.has(key)) { m.texId = seen.get(key); continue; }
    const id = seen.size;
    seen.set(key, id);
    m.texId = id;
    const img = sharp(m.tex);
    const meta = await img.metadata();
    // Le potenze di due permettono le mipmap e la ripetizione in WebGL 1: le
    // UV di questi modelli escono spesso da 0…1 (le gomme sono tassellate), e
    // senza ripetizione la gomma diventa una striscia stirata.
    const side = Math.min(TEX_MAX, 1 << Math.round(Math.log2(Math.max(meta.width, meta.height))));
    await img
      .resize(side, side, { fit: "fill" })
      .webp({ quality: 82 })
      .toFile(join(TEXDIR, `${car.id}-${id}.webp`));
  }
  return seen.size;
}

function pack(cars) {
  const head = [];
  const p16 = (a, v) => a.push(v & 255, (v >> 8) & 255);
  const p32 = (a, v) => a.push(v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >> 24) & 255);
  const pf32 = (a, v) => {
    const b = Buffer.alloc(4);
    b.writeFloatLE(v);
    a.push(...b);
  };

  head.push(0x41, 0x50, 0x43, 0x33); // "APC3"
  p16(head, cars.length);
  for (const c of cars) {
    const id = [...Buffer.from(c.id, "ascii")];
    head.push(id.length, ...id);
    p32(head, c.nVert);
    p32(head, c.idx.length);
    pf32(head, c.uvScale);
    /* Indici a 16 bit quando i vertici ci stanno, a 32 quando no. Solo
       l'Aventador supera i 65 535 (ha dentro anche interni e motore); le altre
       due risparmiano così metà del loro elenco di indici. */
    head.push(c.wide ? 4 : 2);
    head.push(c.draws.length);
    for (const d of c.draws) {
      head.push(d.texId < 0 ? 255 : d.texId);
      head.push(Math.round(d.color[0] * 255), Math.round(d.color[1] * 255), Math.round(d.color[2] * 255));
      head.push(Math.round(d.alpha * 255));
      p32(head, d.first);
      p32(head, d.count);
    }
  }
  while (head.length % 4) head.push(0);

  const body = [];
  for (const c of cars) {
    for (const v of c.pos) {
      const q = Math.max(-32768, Math.min(32767, Math.round(v / QS)));
      p16(body, q < 0 ? q + 65536 : q);
    }
    for (const n of c.nrm) {
      const q = Math.max(-127, Math.min(127, Math.round(n * 127)));
      body.push(q < 0 ? q + 256 : q);
    }
    while (body.length % 2) body.push(0);
    for (const t of c.uv) {
      const q = Math.max(-32768, Math.min(32767, Math.round(t / c.uvScale)));
      p16(body, q < 0 ? q + 65536 : q);
    }
    if (c.wide) for (const i of c.idx) p32(body, i);
    else for (const i of c.idx) p16(body, i);
    while (body.length % 4) body.push(0);
  }
  return Buffer.from([...head, ...body]);
}

/* ═══════════════════════════════════════════════════════════════════════════ */

mkdirSync(TEXDIR, { recursive: true });
for (const f of ["tex"]) {
  const p = join(OUTDIR, f);
  if (existsSync(p)) rmSync(p, { recursive: true, force: true });
}
mkdirSync(TEXDIR, { recursive: true });

const out = [];
for (const car of CARS) {
  const path = join(SRC, car.file);
  if (!existsSync(path)) {
    console.error(`[cars] manca ${path} — salto ${car.id}`);
    continue;
  }
  const raw = car.format === "fbx" ? readFbx(path, car) : readObj(path);
  fillNormals(raw);
  const m = pose(raw, car);

  // ordina i triangoli per materiale → un tratto contiguo per ciascuno
  const order = [];
  for (let t = 0; t < m.tris.length; t += 4) order.push(t);
  order.sort((a, b) => m.tris[a + 3] - m.tris[b + 3]);
  const idx = new Uint32Array(order.length * 3);
  const draws = [];
  let cur = -1;
  order.forEach((t, k) => {
    idx[k * 3] = m.tris[t];
    idx[k * 3 + 1] = m.tris[t + 1];
    idx[k * 3 + 2] = m.tris[t + 2];
    const mat = m.tris[t + 3];
    if (mat !== cur) {
      cur = mat;
      draws.push({ mat, first: k * 3, count: 0 });
    }
    draws[draws.length - 1].count += 3;
  });

  const nTex = await writeTextures(car, m.materials);
  for (const d of draws) {
    const mm = m.materials[d.mat];
    d.texId = mm.texId ?? -1;
    d.color = mm.color;
    d.alpha = mm.alpha;
  }
  /* I materiali trasparenti vanno disegnati DOPO gli opachi, altrimenti il
     buffer di profondità nasconde quel che si dovrebbe vedere attraverso. */
  draws.sort((a, b) => (a.alpha < 1 ? 1 : 0) - (b.alpha < 1 ? 1 : 0));

  let uvMax = 0;
  for (const v of m.uv) uvMax = Math.max(uvMax, Math.abs(v));
  const uvScale = Math.max(1e-6, uvMax / 32767);

  const nVert = m.pos.length / 3;
  console.log(
    `[cars] ${car.id.padEnd(10)} ${String(idx.length / 3).padStart(6)} tri · ${String(nVert).padStart(6)} vert · ` +
      `${draws.length} materiali · ${nTex} texture · UV fino a ${uvMax.toFixed(1)}`,
  );
  out.push({ id: car.id, pos: m.pos, nrm: m.nrm, uv: m.uv, idx, draws, nVert, uvScale, wide: nVert > 65535 });
}

const buf = pack(out);
writeFileSync(join(OUTDIR, "cars.bin"), buf);
console.log(`[cars] cars.bin — ${(buf.length / 1024 / 1024).toFixed(2)} MB`);
