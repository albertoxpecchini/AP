// ─── Album MiMa: dove si sono fermati, e come si chiama quel posto ───────────
//
// Legge il GPS delle foto in foto/mima/ e le raggruppa per VICINANZA: se venti
// scatti cadono nello stesso fazzoletto di cinquanta metri, lì dentro c'è
// qualcosa — un locale, una discoteca, un bagno, un ristorante — e la mappa
// dell'album può nominarlo invece di piantarci sopra una coordinata nuda.
//
// Fa una cosa sola: stampa i gruppi in ordine di grandezza, dice quali cadono
// vicino a un posto già noto (PLACES, in content/mima/dati-viaggio.ts) e quali
// invece sono da battezzare, con un link alla mappa per riconoscerli al volo.
// Non scrive niente e non tocca nessun file: è un rapporto, si può rilanciare
// mentre le foto stanno ancora arrivando.
//
//   node scripts/foto-zone.mjs            gruppi da 3 foto in su, raggio 60 m
//   node scripts/foto-zone.mjs 5 80       da 5 foto in su, raggio 80 m
// ─────────────────────────────────────────────────────────────────────────────

import { readdir, stat } from "node:fs/promises";
import { join, resolve, extname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync, existsSync } from "node:fs";
import exifr from "exifr";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const SRC_DIR = join(root, "foto", "mima");
const DATI = join(root, "content", "mima", "dati-viaggio.ts");
const FUSO = "Europe/Rome";

const MIN_FOTO = Number(process.argv[2] || 3);
const SOGLIA_M = Number(process.argv[3] || 60);

const FOTO = new Set([".jpg", ".jpeg", ".png", ".heic", ".heif", ".webp", ".tif", ".tiff"]);
const VIDEO = new Set([".mov", ".mp4", ".m4v", ".avi", ".3gp"]);

function haversineM(aLat, aLon, bLat, bLon) {
  const R = 6371000, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat), dLon = toRad(bLon - aLon);
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function luoghiNoti() {
  if (!existsSync(DATI)) return [];
  const t = readFileSync(DATI, "utf8");
  const b = t.match(/export const PLACES[^=]*=\s*\{([\s\S]*?)\n\};/);
  if (!b) return [];
  const out = [];
  const re = /key:\s*"([^"]+)"[\s\S]*?name:\s*"([^"]+)"[\s\S]*?lon:\s*(-?[\d.]+)[\s\S]*?lat:\s*(-?[\d.]+)/g;
  let m;
  while ((m = re.exec(b[1])) !== null) out.push({ key: m[1], nome: m[2], lon: +m[3], lat: +m[4] });
  return out;
}

async function cerca(dir) {
  const foto = [], video = [];
  let voci;
  try { voci = await readdir(dir, { withFileTypes: true }); } catch { return { foto, video }; }
  for (const v of voci) {
    const p = join(dir, v.name);
    if (v.isDirectory()) {
      const g = await cerca(p);
      foto.push(...g.foto); video.push(...g.video);
    } else {
      const e = extname(v.name).toLowerCase();
      if (FOTO.has(e)) foto.push(p);
      else if (VIDEO.has(e)) video.push(p);
    }
  }
  return { foto, video };
}

const fmtGiorno = new Intl.DateTimeFormat("it-IT", { timeZone: FUSO, day: "2-digit", month: "2-digit" });
const fmtOra = new Intl.DateTimeFormat("it-IT", { timeZone: FUSO, hour: "2-digit", minute: "2-digit" });
const oraNum = (d) => Number(new Intl.DateTimeFormat("en-GB", { timeZone: FUSO, hour: "2-digit", hour12: false }).format(d));

async function main() {
  if (!existsSync(SRC_DIR)) { console.error("Manca foto/mima/."); process.exit(1); }
  const noti = luoghiNoti();
  const { foto: file, video } = await cerca(SRC_DIR);
  if (!file.length) { console.log("Nessuna foto in foto/mima/."); return; }

  process.stdout.write(`Leggo i metadati di ${file.length} foto…`);
  const punti = [];
  let senzaGps = 0, senzaData = 0, illeggibili = 0;

  for (const f of file) {
    let x = null;
    try { x = await exifr.parse(f, { tiff: true, exif: true, gps: true, ifd0: true }); }
    catch { illeggibili++; continue; }
    const q = x?.DateTimeOriginal || x?.CreateDate || x?.ModifyDate;
    const quando = q instanceof Date && !Number.isNaN(+q) ? q : (await stat(f)).mtime;
    if (!(q instanceof Date)) senzaData++;
    if (typeof x?.latitude !== "number") { senzaGps++; continue; }
    punti.push({ file: relative(SRC_DIR, f), lat: x.latitude, lon: x.longitude, quando });
  }
  process.stdout.write("\r".padEnd(60) + "\r");

  // ── Raggruppamento a singolo legame ────────────────────────────────────────
  // Due scatti stanno insieme se distano meno della soglia; e se A sta con B e
  // B con C, allora A, B e C sono lo stesso posto. Con seicento punti il
  // confronto di tutti con tutti costa niente, e non serve di meglio.
  const gruppo = new Array(punti.length).fill(-1);
  let n = 0;
  for (let i = 0; i < punti.length; i++) {
    if (gruppo[i] !== -1) continue;
    gruppo[i] = n;
    const coda = [i];
    while (coda.length) {
      const k = coda.pop();
      for (let j = 0; j < punti.length; j++) {
        if (gruppo[j] !== -1) continue;
        if (haversineM(punti[k].lat, punti[k].lon, punti[j].lat, punti[j].lon) <= SOGLIA_M) {
          gruppo[j] = n; coda.push(j);
        }
      }
    }
    n++;
  }

  const gruppi = [];
  for (let g = 0; g < n; g++) {
    const p = punti.filter((_, i) => gruppo[i] === g);
    const lat = p.reduce((s, x) => s + x.lat, 0) / p.length;
    const lon = p.reduce((s, x) => s + x.lon, 0) / p.length;
    const raggio = Math.max(...p.map((x) => haversineM(lat, lon, x.lat, x.lon)));
    const tempi = p.map((x) => x.quando).sort((a, b) => a - b);
    const ore = p.map((x) => oraNum(x.quando));
    const notturne = ore.filter((h) => h >= 22 || h < 5).length;
    let vicino = null;
    for (const l of noti) {
      const m = haversineM(lat, lon, l.lat, l.lon);
      if (!vicino || m < vicino.m) vicino = { ...l, m };
    }
    const giorni = [...new Set(tempi.map((t) => fmtGiorno.format(t)))];
    gruppi.push({ n: p.length, lat, lon, raggio, tempi, giorni, notturne, vicino, esempi: p.slice(0, 3).map((x) => x.file) });
  }
  gruppi.sort((a, b) => b.n - a.n);

  // ── Rapporto ───────────────────────────────────────────────────────────────
  const grossi = gruppi.filter((g) => g.n >= MIN_FOTO);
  console.log(`${punti.length} foto con GPS su ${file.length}  ·  ${senzaGps} senza GPS  ·  ${illeggibili} illeggibili`);
  if (senzaData) console.log(`${senzaData} senza data di scatto negli EXIF (uso la data del file)`);
  if (video.length) console.log(`${video.length} video (${[...new Set(video.map((v) => extname(v).toLowerCase()))].join(" ")}) — la pipeline foto per ora non li tocca`);
  console.log(`\n${grossi.length} zone con almeno ${MIN_FOTO} foto, raggruppate entro ${SOGLIA_M} m:\n`);

  let i = 0;
  for (const g of grossi) {
    i++;
    const noto = g.vicino && g.vicino.m <= 350;
    const etichetta = noto ? `${g.vicino.nome}  (${Math.round(g.vicino.m)} m)` : "?? DA NOMINARE";
    const dal = fmtOra.format(g.tempi[0]), al = fmtOra.format(g.tempi.at(-1));
    console.log(`${String(i).padStart(2)}. ${String(g.n).padStart(3)} foto   ${etichetta}`);
    console.log(`      ${g.lat.toFixed(6)}, ${g.lon.toFixed(6)}   raggio ${Math.round(g.raggio)} m`);
    console.log(`      giorni: ${g.giorni.join(", ")}   ${dal} - ${al}${g.notturne ? `   ${g.notturne} scatti fra le 22 e le 5` : ""}`);
    if (!noto) {
      console.log(`      il più vicino fra i noti: ${g.vicino ? `${g.vicino.nome} a ${Math.round(g.vicino.m)} m` : "nessuno"}`);
      console.log(`      mappa: https://www.google.com/maps/search/?api=1&query=${g.lat.toFixed(6)},${g.lon.toFixed(6)}`);
    }
    console.log("");
  }

  const sparse = gruppi.filter((g) => g.n < MIN_FOTO);
  if (sparse.length) {
    console.log(`(più altre ${sparse.length} zone con meno di ${MIN_FOTO} foto: ${sparse.reduce((s, g) => s + g.n, 0)} scatti sparsi, non vale la pena nominarle)`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
