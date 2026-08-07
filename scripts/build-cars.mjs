// ─────────────────────────────────────────────────────────────────────────────
// Da modello 3D scaricato a mesh che sta in una pagina web.
//
// I tre modelli del garage (home, sezione "Three cars I dream about") arrivano
// da Sketchfab e pesano decine di migliaia di triangoli l'uno, con trenta
// texture al seguito. In una card da trecento pixel non serve niente di tutto
// questo: serve la FORMA. Questo script la estrae e butta il resto.
//
// Cosa fa, in ordine:
//   ① legge il modello (OBJ+MTL, oppure FBX binario — vedi lib/fbx.mjs);
//   ② tiene solo quello che si vede da fuori: carrozzeria, vetri, gomme,
//      cerchi. Interni, motore, sottoscocca, targhe e pinze dei freni via —
//      dentro una card non si vedono, ma peserebbero come il resto;
//   ③ raddrizza e mette in scala: asse lungo → x, verticale → y con le ruote a
//      quota 0, e la lunghezza portata a quella VERA di listino, così le tre
//      auto stanno l'una accanto all'altra nella misura giusta. Il muso lo
//      trova da sé: su tutte e tre l'estremità bassa è davanti;
//   ④ semplifica per raggruppamento su griglia, PEZZO PER PEZZO;
//   ⑤ ricalcola le normali tenendo gli spigoli vivi;
//   ⑥ scrive tutto in un solo file binario.
//
// ── Perché pezzo per pezzo (la cosa che conta) ───────────────────────────────
// Il raggruppamento su griglia fonde in uno tutti i vertici che cadono nella
// stessa cella. Fatto sull'auto INTERA, la cella non sa che il pannello della
// portiera e il montante che gli passa dietro sono due cose diverse: se
// distano meno della cella, li salda. Il risultato è una carrozzeria a
// scaglie, con schegge che escono dai fianchi.
//
// Raggruppando dentro un pezzo alla volta (la portiera con la portiera, il
// cofano col cofano) il problema non si pone: due superfici vicine restano due
// superfici. Costa qualche vertice in più sulle cuciture, e li si paga
// volentieri.
//
// Uso:  node scripts/build-cars.mjs <cartella-sorgenti>
// I sorgenti NON stanno nel repository (sono roba di terzi e pesano 30 MB): in
// repository ci va solo il .bin generato. Provenienza e licenze stanno in
// public/models/README.md.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readFbx } from "./lib/fbx.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = process.argv[2] || join(ROOT, "..", "car-sources");
const OUT = join(ROOT, "public", "models", "cars.bin");

/** 0 carrozzeria · 1 vetri · 2 gomma · 3 cerchio.
 *  WHEEL è di servizio: nessuno dei tre modelli tiene gomma e cerchio
 *  separati, quindi la ruota entra intera e la si taglia dopo, per raggio —
 *  vedi splitWheels(). */
export const BODY = 0, GLASS = 1, TYRE = 2, RIM = 3, WHEEL = 4;

/** Un triangolo occupa cinque posti: tre indici, il materiale, il pezzo. */
const S = 5;

/** Quanti triangoli per auto. Sopra i diecimila il file cresce e la forma no. */
const BUDGET = 6500;
/** Passo della quantizzazione delle coordinate: un decimo di millimetro. */
const QS = 1e-4;
/** Oltre questo angolo fra due facce, lo spigolo resta vivo. */
const CREASE = Math.cos((52 * Math.PI) / 180);

const CARS = [
  {
    id: "aventador",
    file: "lambo/m/FINAL_MODEL.fbx",
    format: "fbx",
    length: 4.78,
    rules: [
      [/wheel/i, WHEEL],
      [/interior|seat|belt|engine|shadow|plate|badge|calliper|caliper|tilling|emis|phong/i, null],
      [/windowinside/i, null],
      [/window/i, GLASS],
    ],
  },
  {
    id: "alfa4c",
    file: "alfa/m/alfa_romeo_4c/car_alfa_romeo_4c.obj",
    format: "obj",
    length: 3.989,
    rules: [
      [/wheel/i, WHEEL],
      // Il sottoscocca RESTA: da quando l'auto si gira in tutti i versi, si
      // guarda anche di sotto, e senza si vedrebbe l'interno del guscio.
      [/caliper|licenseplate/i, null],
      [/glass/i, GLASS],
    ],
  },
  {
    id: "audir8",
    file: "audi/m/2008 audi r8.obj",
    format: "obj",
    length: 4.426,
    rules: [
      [/^(tire|rim)/i, WHEEL],
      [/^(screen|spd|speedgui|tac)/i, null],
    ],
    /* Qui i gruppi si chiamano tutti "Meshpart<n>" e non dicono niente. I
       vetri però si riconoscono dal materiale: nel .mtl hanno d < 1, cioè sono
       gli unici pezzi trasparenti. */
    glassByAlpha: 0.95,
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   Lettura OBJ
   ═══════════════════════════════════════════════════════════════════════════ */

function readMtlAlpha(path) {
  const alpha = new Map();
  if (!existsSync(path)) return alpha;
  let cur = null;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (t.startsWith("newmtl ")) cur = t.slice(7).trim();
    else if (cur && /^d\s/.test(t)) alpha.set(cur, parseFloat(t.slice(2)));
  }
  return alpha;
}

function readObj(path, car) {
  const txt = readFileSync(path, "utf8");
  const alpha = car.glassByAlpha ? readMtlAlpha(path.replace(/\.obj$/i, ".mtl")) : new Map();
  const pos = [];
  const tris = [];
  let group = "";
  let mtl = "";
  let bucket = BODY;
  let part = 0;

  /* Il nome del GRUPPO decide per primo, e solo se non dice niente si guarda
     il materiale. Non è pignoleria: la 4C spalma un solo materiale
     "Wheelfrtyres1Mtl" su gomme E cerchi di tutte e quattro le ruote, mentre i
     gruppi ("Wheelflpivotrims1", "Wheelfrtyres1") li tengono distinti. */
  const match = (label) => {
    for (const [re, b] of car.rules) if (re.test(label)) return b;
    return undefined;
  };
  const pick = () => {
    part++;
    if (car.glassByAlpha && alpha.has(mtl) && alpha.get(mtl) < car.glassByAlpha) {
      bucket = GLASS;
      return;
    }
    const b = match(group) ?? match(mtl);
    bucket = b === undefined ? BODY : b;
  };

  for (const line of txt.split("\n")) {
    if (line[0] === "v" && line[1] === " ") {
      const p = line.split(/\s+/);
      pos.push(+p[1], +p[2], +p[3]);
    } else if (line[0] === "g" && line[1] === " ") {
      group = line.slice(2).trim();
      pick();
    } else if (line.startsWith("usemtl ")) {
      mtl = line.slice(7).trim();
      pick();
    } else if (line[0] === "f" && line[1] === " ") {
      if (bucket === null) continue;
      const p = line.trim().split(/\s+/);
      const n = p.length - 1;
      const idx = [];
      for (let i = 1; i <= n; i++) {
        let v = parseInt(p[i], 10);
        if (v < 0) v = pos.length / 3 + v;
        else v -= 1;
        idx.push(v);
      }
      for (let i = 1; i < n - 1; i++) tris.push(idx[0], idx[i], idx[i + 1], bucket, part);
    }
  }
  return { pos: Float64Array.from(pos), tris };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Raddrizzamento, scala, verso

   L'asse più lungo del contenitore è la lunghezza, il più corto l'altezza:
   vale per tutte e tre (una supercar è sempre più lunga che larga e più larga
   che alta). Il muso è l'estremità BASSA: su queste tre — e su qualunque
   sportiva — il cofano sta più giù della coda. Meglio misurarlo che scriverlo
   a mano e sbagliarlo.
   ═══════════════════════════════════════════════════════════════════════════ */

function orient(mesh, car) {
  const { pos } = mesh;
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pos.length; i += 3)
    for (let k = 0; k < 3; k++) {
      if (pos[i + k] < lo[k]) lo[k] = pos[i + k];
      if (pos[i + k] > hi[k]) hi[k] = pos[i + k];
    }
  const ext = [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]];
  const [aLen, aWid, aHei] = [0, 1, 2].sort((a, b) => ext[b] - ext[a]);

  /* Da che parte è il muso.
     Il segnale è l'ABITACOLO: su un'auto a motore centrale — e tutte e tre lo
     sono — i vetri stanno spostati in avanti, perché dietro l'abitacolo c'è il
     motore. Quindi la metà dove cade il baricentro dei vetri è il davanti.
     (Il primo tentativo guardava l'altezza alle due estremità, "il muso è il
     lato basso": vero sulla 4C, falso su Aventador e R8, che hanno la coda
     bassa quanto il cofano. Due su tre giravano di spalle.) */
  const cxSrc = (lo[aLen] + hi[aLen]) * 0.5;
  let gs = 0, gn = 0;
  for (let t = 0; t < mesh.tris.length; t += S) {
    if (mesh.tris[t + 3] !== GLASS) continue;
    for (let k = 0; k < 3; k++) { gs += pos[mesh.tris[t + k] * 3 + aLen]; gn++; }
  }
  let noseAtHigh;
  if (gn > 30) noseAtHigh = gs / gn > cxSrc;
  else {
    // Senza vetri riconosciuti si ripiega sull'altezza alle estremità.
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
  const cx = cxSrc;
  const cz = (lo[aWid] + hi[aWid]) * 0.5;
  const gy = lo[aHei];

  const out = new Float64Array(pos.length);
  for (let i = 0; i < pos.length; i += 3) {
    out[i] = (pos[i + aLen] - cx) * sx;
    out[i + 1] = (pos[i + aHei] - gy) * scale;
    out[i + 2] = (pos[i + aWid] - cz) * scale;
  }
  /* Specchiare inverte l'orientamento dei triangoli: senza rimetterli a posto
     le normali guarderebbero tutte dentro l'auto. */
  if (noseAtHigh)
    for (let t = 0; t < mesh.tris.length; t += S) {
      const tmp = mesh.tris[t + 1];
      mesh.tris[t + 1] = mesh.tris[t + 2];
      mesh.tris[t + 2] = tmp;
    }
  return { ...mesh, pos: out };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Gomma o cerchio

   Nessuno dei tre modelli lo dice: l'Aventador ha un materiale solo per tutta
   la ruota, la 4C ne ha uno solo per tutte e quattro. Ma la ruota è un disco,
   e su un disco la differenza fra gomma e cerchio è il RAGGIO — cosa vera per
   qualunque auto sia mai stata costruita.
   ═══════════════════════════════════════════════════════════════════════════ */

function splitWheels(pos, tris) {
  const quad = new Map();
  for (let t = 0; t < tris.length; t += S) {
    if (tris[t + 3] !== WHEEL) continue;
    const cx = (pos[tris[t] * 3] + pos[tris[t + 1] * 3] + pos[tris[t + 2] * 3]) / 3;
    const cz = (pos[tris[t] * 3 + 2] + pos[tris[t + 1] * 3 + 2] + pos[tris[t + 2] * 3 + 2]) / 3;
    const k = `${cx < 0 ? "f" : "r"}${cz < 0 ? "l" : "r"}`;
    if (!quad.has(k)) quad.set(k, []);
    quad.get(k).push(t);
  }
  for (const list of quad.values()) {
    let sx = 0, sy = 0, n = 0;
    for (const t of list)
      for (let k = 0; k < 3; k++) {
        sx += pos[tris[t + k] * 3];
        sy += pos[tris[t + k] * 3 + 1];
        n++;
      }
    const cx = sx / n, cy = sy / n;
    let rMax = 0;
    for (const t of list)
      for (let k = 0; k < 3; k++)
        rMax = Math.max(rMax, Math.hypot(pos[tris[t + k] * 3] - cx, pos[tris[t + k] * 3 + 1] - cy));
    const cut = rMax * 0.68;
    for (const t of list) {
      let d = 0;
      for (let k = 0; k < 3; k++)
        d = Math.max(d, Math.hypot(pos[tris[t + k] * 3] - cx, pos[tris[t + k] * 3 + 1] - cy));
      tris[t + 3] = d > cut ? TYRE : RIM;
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Semplificazione
   ═══════════════════════════════════════════════════════════════════════════ */

function cluster(pos, tris, cell) {
  const map = new Map();
  const acc = [];
  const nt = [];
  const seen = new Set();
  const inv = 1 / cell;

  for (let t = 0; t < tris.length; t += S) {
    const part = tris[t + 4];
    const idx = [0, 0, 0];
    for (let k = 0; k < 3; k++) {
      const i = tris[t + k] * 3;
      // Il pezzo entra nella chiave: due superfici vicine di pezzi diversi
      // devono restare due superfici.
      const key = `${part}|${Math.floor(pos[i] * inv)},${Math.floor(pos[i + 1] * inv)},${Math.floor(
        pos[i + 2] * inv,
      )}`;
      let e = map.get(key);
      if (e === undefined) {
        e = acc.length / 4;
        map.set(key, e);
        acc.push(0, 0, 0, 0);
      }
      acc[e * 4] += pos[i];
      acc[e * 4 + 1] += pos[i + 1];
      acc[e * 4 + 2] += pos[i + 2];
      acc[e * 4 + 3]++;
      idx[k] = e;
    }
    const [a, b, c] = idx;
    if (a === b || b === c || a === c) continue;
    const k2 = (a < b ? (a < c ? a : c) : b < c ? b : c) + "," + (a + b + c) + "," + (a > b ? (a > c ? a : c) : b > c ? b : c);
    if (seen.has(k2)) continue;
    seen.add(k2);
    nt.push(a, b, c, tris[t + 3], part);
  }

  const np = new Float64Array((acc.length / 4) * 3);
  for (let e = 0; e < acc.length / 4; e++) {
    const c = acc[e * 4 + 3];
    np[e * 3] = acc[e * 4] / c;
    np[e * 3 + 1] = acc[e * 4 + 1] / c;
    np[e * 3 + 2] = acc[e * 4 + 2] / c;
  }
  return { pos: np, tris: nt };
}

/** Cerca il passo di griglia che porta al bersaglio, per bisezione. */
function simplify(pos, tris, budget) {
  if (tris.length / S <= budget) return { pos, tris };
  let lo = 0.002, hi = 0.2;
  let best = null;
  for (let it = 0; it < 18; it++) {
    const cell = (lo + hi) / 2;
    const r = cluster(pos, tris, cell);
    const n = r.tris.length / S;
    if (n > budget) lo = cell;
    else {
      hi = cell;
      best = r;
      if (n > budget * 0.9) return r;
    }
  }
  return best ?? cluster(pos, tris, hi);
}

/* ═══════════════════════════════════════════════════════════════════════════
   Normali con gli spigoli vivi

   Media delle facce attorno al vertice, ma solo di quelle che stanno entro
   52° dalla faccia che si sta trattando. Sotto quella soglia la superficie è
   continua e va ammorbidita; sopra c'è uno spigolo, e uno spigolo ammorbidito
   su una fiancata d'auto si vede subito — diventa una piega di stagnola.
   ═══════════════════════════════════════════════════════════════════════════ */

function normals(pos, tris) {
  const nTri = tris.length / S;
  const fn = new Float64Array(nTri * 3);
  for (let t = 0; t < nTri; t++) {
    const a = tris[t * S] * 3, b = tris[t * S + 1] * 3, c = tris[t * S + 2] * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
    const wx = pos[c] - pos[a], wy = pos[c + 1] - pos[a + 1], wz = pos[c + 2] - pos[a + 2];
    const nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
    const len = Math.hypot(nx, ny, nz) || 1;
    fn[t * 3] = nx / len; fn[t * 3 + 1] = ny / len; fn[t * 3 + 2] = nz / len;
  }

  const around = new Map(); // vertice → facce che lo toccano
  for (let t = 0; t < nTri; t++)
    for (let k = 0; k < 3; k++) {
      const v = tris[t * S + k];
      let l = around.get(v);
      if (!l) around.set(v, (l = []));
      l.push(t);
    }

  /* Attorno a ogni vertice le facce si dividono in GRUPPI DI LEVIGATURA: una
     faccia entra nel primo gruppo il cui capofila le somiglia entro la soglia,
     altrimenti ne apre uno nuovo. Poi tutte le facce di un gruppo prendono la
     stessa normale, che è la media del gruppo.
     La differenza con il calcolarla faccia per faccia — "media di quelle che
     somigliano a ME" — non è estetica ma di PESO: quella dà a ogni faccia una
     normale leggermente diversa, quindi nessun vertice si può più condividere
     e il modello raddoppia i vertici. Qui invece le facce di una superficie
     continua ricadono tutte nello stesso gruppo e tornano a condividerli. */
  const groupNrm = new Map(); // "vertice|gruppo" → normale mediata
  const faceGroup = new Map(); // "vertice|faccia" → indice di gruppo
  for (const [v, faces] of around) {
    const heads = []; // normale del capofila di ogni gruppo
    const sums = [];
    for (const t of faces) {
      const nx = fn[t * 3], ny = fn[t * 3 + 1], nz = fn[t * 3 + 2];
      let g = heads.findIndex((h) => h[0] * nx + h[1] * ny + h[2] * nz >= CREASE);
      if (g < 0) {
        g = heads.length;
        heads.push([nx, ny, nz]);
        sums.push([0, 0, 0]);
      }
      sums[g][0] += nx; sums[g][1] += ny; sums[g][2] += nz;
      faceGroup.set(`${v}|${t}`, g);
    }
    for (let g = 0; g < sums.length; g++) {
      const [x, y, z] = sums[g];
      const len = Math.hypot(x, y, z) || 1;
      groupNrm.set(`${v}|${g}`, [
        Math.round((x / len) * 127),
        Math.round((y / len) * 127),
        Math.round((z / len) * 127),
      ]);
    }
  }

  const outPos = [];
  const outNrm = [];
  const outMat = [];
  const outIdx = [];
  const dedup = new Map();
  for (let t = 0; t < nTri; t++) {
    for (let k = 0; k < 3; k++) {
      const v = tris[t * S + k];
      const g = faceGroup.get(`${v}|${t}`);
      const key = `${v}|${g}`;
      let i = dedup.get(key);
      if (i === undefined) {
        i = outMat.length;
        dedup.set(key, i);
        outPos.push(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]);
        outNrm.push(...groupNrm.get(key));
        outMat.push(tris[t * S + 3]);
      }
      outIdx.push(i);
    }
  }
  return { pos: outPos, nrm: outNrm, mat: outMat, idx: outIdx };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Scrittura
   ═══════════════════════════════════════════════════════════════════════════ */

function pack(cars) {
  const head = [];
  const p16 = (a, v) => a.push(v & 255, (v >> 8) & 255);
  const p32 = (a, v) => a.push(v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >> 24) & 255);

  head.push(0x41, 0x50, 0x43, 0x32); // "APC2"
  p16(head, cars.length);
  for (const c of cars) {
    const id = [...Buffer.from(c.id, "ascii")];
    head.push(id.length, ...id);
    p32(head, c.mat.length);
    p32(head, c.idx.length / 3);
  }
  while (head.length % 4) head.push(0);

  const body = [];
  for (const c of cars) {
    for (const v of c.pos) {
      const q = Math.round(v / QS);
      p16(body, q < 0 ? q + 65536 : q);
    }
    for (const n of c.nrm) body.push(n < 0 ? n + 256 : n);
    for (const m of c.mat) body.push(m);
    for (const i of c.idx) p16(body, i);
    while (body.length % 4) body.push(0);
  }
  return Buffer.from([...head, ...body]);
}

/* ═══════════════════════════════════════════════════════════════════════════ */

const out = [];
for (const car of CARS) {
  const path = join(SRC, car.file);
  if (!existsSync(path)) {
    console.error(`[cars] manca ${path} — salto ${car.id}`);
    continue;
  }
  const raw = car.format === "fbx" ? readFbx(path, car, { BODY, GLASS, TYRE, RIM, WHEEL, S }) : readObj(path, car);
  const before = raw.tris.length / S;
  const o = orient(raw, car);
  splitWheels(o.pos, o.tris);
  const s = simplify(o.pos, o.tris, BUDGET);
  const m = normals(s.pos, s.tris);
  if (m.mat.length > 65535) throw new Error(`${car.id}: troppi vertici (${m.mat.length})`);
  const counts = [0, 0, 0, 0];
  for (let t = 0; t < s.tris.length; t += S) counts[s.tris[t + 3]]++;
  console.log(
    `[cars] ${car.id.padEnd(10)} ${String(before).padStart(6)} → ${String(m.idx.length / 3).padStart(5)} tri · ` +
      `${String(m.mat.length).padStart(5)} vert · corpo ${counts[0]} vetri ${counts[1]} gomme ${counts[2]} cerchi ${counts[3]}`,
  );
  out.push({ id: car.id, ...m });
}

mkdirSync(dirname(OUT), { recursive: true });
const buf = pack(out);
writeFileSync(OUT, buf);
console.log(`[cars] ${OUT} — ${(buf.length / 1024).toFixed(1)} kB`);
