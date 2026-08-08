// ─────────────────────────────────────────────────────────────────────────────
// Lettore di FBX binario, ridotto all'osso.
//
// Serve a UNA cosa: tirare fuori da un FBX quel che serve per rimetterlo a
// schermo com'era — vertici, normali, coordinate texture, materiali e le
// immagini a cui i materiali puntano. Non è un importatore: non guarda
// animazioni, scheletri, luci, telecamere, né i mille attributi che l'FBX si
// porta dietro.
//
// Il formato, per chi ci ripassa fra un anno: dopo 27 byte di intestazione
// ("Kaydara FBX Binary  ", due byte di riempimento e la versione a 32 bit) c'è
// un albero di record. Ogni record dichiara dove finisce, quante proprietà ha
// e quanto occupano, poi il nome, poi le proprietà, poi i figli fino alla
// posizione di fine. Dalla versione 7500 le tre lunghezze passano da 32 a 64
// bit — l'unica differenza che conta qui.
//
// Le proprietà hanno un codice di tipo di un carattere: maiuscolo = valore
// singolo (Y I L F D C S R), minuscolo = vettore (i l f d b), e i vettori
// possono essere compressi con deflate.
//
// ── La parte che si sbaglia ──────────────────────────────────────────────────
// Normali e UV non stanno "sul vertice". Stanno in un LayerElement che dichiara
// due cose:
//   · MappingInformationType — a CHI si riferisce ogni valore: al vertice
//     (ByVertice) o all'angolo di poligono (ByPolygonVertex, cioè lo stesso
//     vertice può avere normali diverse a seconda della faccia — è così che si
//     tengono gli spigoli vivi);
//   · ReferenceInformationType — se i valori stanno in fila (Direct) o se c'è
//     un array di indici che li pesca da una tavola (IndexToDirect).
// Le quattro combinazioni esistono tutte e vanno gestite tutte, se no si
// ottengono normali a caso e il modello si illumina a chiazze.
// ─────────────────────────────────────────────────────────────────────────────
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { dirname, join, basename } from "node:path";
import { existsSync, readdirSync } from "node:fs";

function parse(buf) {
  const version = buf.readUInt32LE(23);
  const wide = version >= 7500;
  const root = { name: "", props: [], children: [] };

  function readProps(off, count) {
    const props = [];
    for (let i = 0; i < count; i++) {
      const t = String.fromCharCode(buf[off++]);
      switch (t) {
        case "Y": props.push(buf.readInt16LE(off)); off += 2; break;
        case "C": props.push(!!buf[off]); off += 1; break;
        case "I": props.push(buf.readInt32LE(off)); off += 4; break;
        case "F": props.push(buf.readFloatLE(off)); off += 4; break;
        case "D": props.push(buf.readDoubleLE(off)); off += 8; break;
        case "L": props.push(Number(buf.readBigInt64LE(off))); off += 8; break;
        case "S":
        case "R": {
          const len = buf.readUInt32LE(off); off += 4;
          props.push(t === "S" ? buf.toString("utf8", off, off + len) : buf.subarray(off, off + len));
          off += len;
          break;
        }
        case "f": case "d": case "l": case "i": case "b": {
          const n = buf.readUInt32LE(off);
          const enc = buf.readUInt32LE(off + 4);
          const size = buf.readUInt32LE(off + 8);
          off += 12;
          let data = buf.subarray(off, off + size);
          off += size;
          if (enc === 1) data = inflateSync(data);
          const A = { f: Float32Array, d: Float64Array, l: BigInt64Array, i: Int32Array, b: Uint8Array }[t];
          // slice() copia: i dati nel file non sono allineati come vorrebbe una
          // vista tipizzata, e su Buffer.subarray l'offset è qualunque.
          const arr = new A(data.buffer.slice(data.byteOffset, data.byteOffset + n * A.BYTES_PER_ELEMENT));
          props.push(t === "l" ? Array.from(arr, Number) : arr);
          break;
        }
        default:
          throw new Error(`FBX: tipo di proprietà sconosciuto "${t}"`);
      }
    }
    return { props, off };
  }

  function readNode(off) {
    const end = wide ? Number(buf.readBigUInt64LE(off)) : buf.readUInt32LE(off);
    const nProps = wide ? Number(buf.readBigUInt64LE(off + 8)) : buf.readUInt32LE(off + 4);
    const propLen = wide ? Number(buf.readBigUInt64LE(off + 16)) : buf.readUInt32LE(off + 8);
    let p = off + (wide ? 24 : 12);
    if (end === 0) return { node: null, next: p + 1 };
    const nameLen = buf[p++];
    const name = buf.toString("utf8", p, p + nameLen);
    p += nameLen;
    const { props } = readProps(p, nProps);
    p += propLen;
    const node = { name, props, children: [] };
    const sentinel = wide ? 25 : 13;
    while (p + sentinel <= end) {
      const r = readNode(p);
      if (!r.node) { p = r.next; break; }
      node.children.push(r.node);
      p = r.next;
    }
    return { node, next: end };
  }

  let off = 27;
  while (off < buf.length - (wide ? 25 : 13)) {
    const r = readNode(off);
    if (!r.node) break;
    root.children.push(r.node);
    off = r.next;
  }
  return root;
}

const kid = (n, name) => n?.children.find((c) => c.name === name);
const kids = (n, name) => n?.children.filter((c) => c.name === name) ?? [];

function prop70(node, key) {
  const p70 = kid(node, "Properties70");
  if (!p70) return null;
  for (const p of p70.children) if (p.name === "P" && p.props[0] === key) return p.props;
  return null;
}
const vec3 = (p, from = 4) => (p ? [p[from] || 0, p[from + 1] || 0, p[from + 2] || 0] : [0, 0, 0]);

/* ── Matrici 4×4, in ordine per colonne ──────────────────────────────────── */
const I4 = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
function mul(a, b) {
  const o = new Array(16).fill(0);
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++)
      for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
  return o;
}
function trs(t, r, s) {
  const [rx, ry, rz] = r.map((d) => (d * Math.PI) / 180);
  const cx = Math.cos(rx), sx = Math.sin(rx);
  const cy = Math.cos(ry), sy = Math.sin(ry);
  const cz = Math.cos(rz), sz = Math.sin(rz);
  const m = [
    cy * cz, cy * sz, -sy, 0,
    sx * sy * cz - cx * sz, sx * sy * sz + cx * cz, sx * cy, 0,
    cx * sy * cz + sx * sz, cx * sy * sz - sx * cz, cx * cy, 0,
    0, 0, 0, 1,
  ];
  for (let c = 0; c < 3; c++) for (let r2 = 0; r2 < 3; r2++) m[c * 4 + r2] *= s[c];
  m[12] = t[0]; m[13] = t[1]; m[14] = t[2];
  return m;
}
const px = (m, x, y, z) => [
  m[0] * x + m[4] * y + m[8] * z + m[12],
  m[1] * x + m[5] * y + m[9] * z + m[13],
  m[2] * x + m[6] * y + m[10] * z + m[14],
];
/** Le normali si trasformano con la matrice senza la traslazione. */
const pn = (m, x, y, z) => [
  m[0] * x + m[4] * y + m[8] * z,
  m[1] * x + m[5] * y + m[9] * z,
  m[2] * x + m[6] * y + m[10] * z,
];

/** Legge un LayerElement risolvendo le quattro combinazioni mapping/reference.
 *  Torna una funzione (indiceVertice, indiceAngolo) → offset nell'array. */
function layerLookup(layer, valuesName, indexName) {
  if (!layer) return null;
  const values = kid(layer, valuesName)?.props[0];
  if (!values) return null;
  const index = kid(layer, indexName)?.props[0];
  const mapping = kid(layer, "MappingInformationType")?.props[0] || "ByPolygonVertex";
  const ref = kid(layer, "ReferenceInformationType")?.props[0] || "Direct";
  const byVertex = mapping === "ByVertice" || mapping === "ByVertex";
  const indexed = ref === "IndexToDirect" && index;
  return (vi, ci) => {
    const k = byVertex ? vi : ci;
    return indexed ? index[k] : k;
  };
}

export function readFbx(path, car) {
  const root = parse(readFileSync(path));
  const objects = kid(root, "Objects");
  const conns = kid(root, "Connections");
  const dir = dirname(path);

  // ── Chi sta attaccato a chi ──────────────────────────────────────────────
  const parentOf = new Map();
  const childrenOf = new Map();
  const propConn = []; // [figlio, padre, nomeProprietà]
  for (const c of kids(conns, "C")) {
    const [kind, child, parent, prop] = c.props;
    if (kind === "OO") {
      parentOf.set(child, parent);
      if (!childrenOf.has(parent)) childrenOf.set(parent, []);
      childrenOf.get(parent).push(child);
    } else if (kind === "OP") {
      propConn.push([child, parent, prop]);
      if (!childrenOf.has(parent)) childrenOf.set(parent, []);
      childrenOf.get(parent).push(child);
    }
  }

  // ── Texture: id → file su disco ──────────────────────────────────────────
  // Il RelativeFilename dell'FBX punta a dove stava il file sulla macchina di
  // chi ha esportato. Qui conta solo il nome: si ripesca nella cartella del
  // modello, e se manca si prova senza suffisso di tipo.
  const files = existsSync(dir) ? readdirSync(dir) : [];
  const findFile = (name) => {
    if (!name) return null;
    const base = basename(String(name).replace(/\\/g, "/"));
    const hit = files.find((f) => f.toLowerCase() === base.toLowerCase());
    return hit ? join(dir, hit) : null;
  };
  const textures = new Map();
  for (const t of kids(objects, "Texture")) {
    const rel = kid(t, "RelativeFilename")?.props[0] || kid(t, "FileName")?.props[0];
    textures.set(t.props[0], findFile(rel));
  }

  // ── Materiali ────────────────────────────────────────────────────────────
  const materials = new Map(); // id → indice nell'elenco finale
  const matList = [];
  for (const m of kids(objects, "Material")) {
    const name = String(m.props[1]).split(" ")[0];
    const diff = prop70(m, "DiffuseColor");
    const opac = prop70(m, "Opacity");
    // La texture diffusa è collegata al materiale come proprietà "DiffuseColor".
    let tex = null;
    for (const [child, parent, prop] of propConn) {
      if (parent !== m.props[0]) continue;
      if (!/Diffuse/i.test(String(prop))) continue;
      if (textures.has(child)) { tex = textures.get(child); break; }
    }
    // Lucentezza: quanto riflette (SpecularFactor × SpecularColor) e quanto
    // stretto è il riflesso (ShininessExponent). Questo file li ha davvero;
    // gli altri due modelli quasi no — il ripiego sta in build-cars.mjs.
    const specF = prop70(m, "SpecularFactor");
    const specC = prop70(m, "SpecularColor");
    const shin = prop70(m, "ShininessExponent") || prop70(m, "Shininess");
    const sc = specC ? Math.max(...vec3(specC)) : 1;
    materials.set(m.props[0], matList.length);
    matList.push({
      name,
      tex,
      color: diff ? vec3(diff) : [0.8, 0.8, 0.8],
      alpha: opac ? (opac[4] ?? 1) : 1,
      spec: (specF ? (specF[4] ?? 1) : 1) * sc,
      gloss: shin ? (shin[4] ?? 0) : 0,
    });
  }

  // ── Modelli e loro trasformazioni ────────────────────────────────────────
  const models = new Map();
  for (const m of kids(objects, "Model")) {
    const t = vec3(prop70(m, "Lcl Translation"));
    const r = vec3(prop70(m, "Lcl Rotation"));
    const pre = vec3(prop70(m, "PreRotation"));
    const s = prop70(m, "Lcl Scaling") ? vec3(prop70(m, "Lcl Scaling")) : [1, 1, 1];
    const gt = vec3(prop70(m, "GeometricTranslation"));
    const gr = vec3(prop70(m, "GeometricRotation"));
    const gs = prop70(m, "GeometricScaling") ? vec3(prop70(m, "GeometricScaling")) : [1, 1, 1];
    models.set(m.props[0], {
      name: String(m.props[1]).split(" ")[0],
      local: mul(trs(t, pre, [1, 1, 1]), trs([0, 0, 0], r, s)),
      geo: trs(gt, gr, gs),
    });
  }
  const world = (id) => {
    let m = I4();
    let cur = id;
    const guard = new Set();
    while (cur != null && models.has(cur) && !guard.has(cur)) {
      guard.add(cur);
      m = mul(models.get(cur).local, m);
      cur = parentOf.get(cur);
    }
    return m;
  };

  // ── Geometria ────────────────────────────────────────────────────────────
  const pos = [], nrm = [], uv = [], tris = [];
  const dedup = new Map();

  for (const g of kids(objects, "Geometry")) {
    const verts = kid(g, "Vertices")?.props[0];
    const poly = kid(g, "PolygonVertexIndex")?.props[0];
    if (!verts || !poly) continue;

    const modelId = parentOf.get(g.props[0]);
    const model = models.get(modelId);
    const name = model?.name ?? String(g.props[1]).split(" ")[0];
    if (car.skip && car.skip.test(name)) continue;

    const normArr = kid(g, "LayerElementNormal");
    const uvArr = kid(g, "LayerElementUV");
    const nVals = kid(normArr, "Normals")?.props[0];
    const uVals = kid(uvArr, "UV")?.props[0];
    const nAt = layerLookup(normArr, "Normals", "NormalsIndex");
    const uAt = layerLookup(uvArr, "UV", "UVIndex");

    // Materiali del pezzo, nell'ordine in cui sono collegati: è quello che
    // indicizza LayerElementMaterial.
    const mats = (childrenOf.get(modelId) ?? []).filter((c) => materials.has(c)).map((c) => materials.get(c));
    const lem = kid(g, "LayerElementMaterial");
    const matIdx = kid(lem, "Materials")?.props[0];
    const byPoly = kid(lem, "MappingInformationType")?.props[0] === "ByPolygon";

    const M = mul(world(modelId), model?.geo ?? I4());
    /* La chiave del vertice va costruita sui VALORI, non sugli indici.
       Con MappingInformationType "ByPolygonVertex" e reference "Direct" —
       che è il caso di questo file — l'indice della normale È il numero
       progressivo dell'angolo di poligono: sempre diverso, anche quando la
       normale è identica. Chiavare sugli indici vuol dire non condividere mai
       niente: 131 000 triangoli uscivano con 393 000 vertici, cioè tre per
       triangolo, e il file pesava il triplo del dovuto. */
    const q = (x) => Math.round(x * 4096);
    const key = (vi, ni, ui) =>
      `${g.props[0]}|${vi}|` +
      (ni >= 0 ? `${q(nVals[ni * 3])},${q(nVals[ni * 3 + 1])},${q(nVals[ni * 3 + 2])}` : "") +
      "|" +
      (ui >= 0 ? `${q(uVals[ui * 2])},${q(uVals[ui * 2 + 1])}` : "");

    let face = [];
    let corner = 0;
    let pi = 0;
    for (let i = 0; i < poly.length; i++) {
      const ci = i;
      let vi = poly[i];
      const last = vi < 0;
      if (last) vi = -vi - 1;

      const ni = nVals && nAt ? nAt(vi, ci) : -1;
      const ui = uVals && uAt ? uAt(vi, ci) : -1;
      const k = key(vi, ni, ui);
      let idx = dedup.get(k);
      if (idx === undefined) {
        idx = pos.length / 3;
        dedup.set(k, idx);
        const [x, y, z] = px(M, verts[vi * 3], verts[vi * 3 + 1], verts[vi * 3 + 2]);
        pos.push(x, y, z);
        if (ni >= 0) {
          const [nx, ny, nz] = pn(M, nVals[ni * 3], nVals[ni * 3 + 1], nVals[ni * 3 + 2]);
          const len = Math.hypot(nx, ny, nz) || 1;
          nrm.push(nx / len, ny / len, nz / len);
        } else nrm.push(0, 0, 0);
        // L'FBX ha la V al contrario rispetto a come un'immagine viene letta.
        uv.push(ui >= 0 ? uVals[ui * 2] : 0, ui >= 0 ? 1 - uVals[ui * 2 + 1] : 0);
      }
      face.push(idx);
      corner++;
      if (!last) continue;

      const localMat = byPoly && matIdx ? matIdx[pi] : matIdx?.[0] ?? 0;
      const mat = mats[localMat] ?? mats[0] ?? 0;
      pi++;
      for (let k2 = 1; k2 < face.length - 1; k2++) tris.push(face[0], face[k2], face[k2 + 1], mat);
      face = [];
      corner = 0;
    }
  }

  return { pos, nrm, uv, tris, materials: matList };
}
