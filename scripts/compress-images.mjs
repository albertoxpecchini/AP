// Compressione immagini "al massimo" per il deploy, in place.
// - JPEG: ridimensiona a max 1800px (o 1000px per le foto-anteprima nei grid), mozjpeg q70 progressive 4:2:0
// - PNG:  ridimensiona a max 1800px, palette quantizzata, compressione 9
// Sostituisce il file solo se il risultato è più piccolo.
// Salta favicon/icone PWA ed emoji (già minuscoli, la ricompressione li degrada).
// Uso locale:  npm i sharp --no-save && node scripts/compress-images.mjs
import sharp from "sharp";
import { readdirSync, statSync, readFileSync, writeFileSync } from "node:fs";
import { join, extname, basename } from "node:path";

const ROOT = "public";
const MAX_DIM = 1800;
const SKIP_DIRS = new Set(["emoji", "zips", "bootstrap-italia"]);
const SKIP_FILE = /^(favicon|icon-|apple-touch-icon)/i;
const MIN_BYTES = 24 * 1024; // sotto questa soglia non vale la pena

// Foto "Shot"/galleria mostrate come anteprime piccole (story-row a metà larghezza,
// grid 2-4 colonne) ma salvate a risoluzione da banner full-width: qui basta molto
// meno pixel. I banner full-bleed veri (pcto-team-banner, gattopardo/chiusura) NON
// sono in lista e restano a MAX_DIM.
const THUMB_MAX_DIM = 1000;
const THUMB_FILES = new Set([
  "images/pcto-copertura-legno.jpg",
  "images/pcto-travi-travetti.jpg",
  "images/pcto-tettoia.jpg",
  "images/pcto-magazzino.jpg",
  "images/dubliners/dublino.jpg",
  "images/dubliners/dublino-2.jpg",
  "images/dubliners/neve.jpg",
  "images/gattopardo/sicilia.jpg",
  "images/gattopardo/finale.jpg",
  "images/me-stesso/azienda-digitale.jpg",
  "images/me-stesso/cascina.jpg",
  "images/me-stesso/cucina.jpg",
  "images/me-stesso/dublino.jpg",
  "images/me-stesso/festa-cascina.jpg",
  "images/me-stesso/futuro.jpg",
  "images/me-stesso/grazie.jpg",
  "images/me-stesso/grest.jpg",
  "images/me-stesso/manutenzione.jpg",
  "images/me-stesso/moto.jpg",
  "images/me-stesso/parigi.jpg",
  "images/me-stesso/restauro-1.jpg",
  "images/me-stesso/restauro-2.jpg",
  "images/me-stesso/restauro-3.jpg",
  "images/me-stesso/rivalta.jpg",
  "images/me-stesso/tiro.jpg",
  "images/me-stesso/trattore.jpg",
  "images/me-stesso/viaggio-gruppo.jpg",
  "images/me-stesso/web.jpg",
]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (!SKIP_DIRS.has(name)) walk(p, out);
    } else out.push(p);
  }
  return out;
}

const files = walk(ROOT).filter((f) => /\.(jpe?g|png)$/i.test(f) && !SKIP_FILE.test(basename(f)));
let before = 0, after = 0, changed = 0;

for (const f of files) {
  const orig = readFileSync(f);
  if (orig.length < MIN_BYTES) { before += orig.length; after += orig.length; continue; }
  const ext = extname(f).toLowerCase();
  const rel = f.slice(ROOT.length + 1).split("\\").join("/");
  const maxDim = THUMB_FILES.has(rel) ? THUMB_MAX_DIM : MAX_DIM;
  let pipe = sharp(orig, { failOn: "none" }).rotate();
  const meta = await pipe.metadata();
  if (meta.width > maxDim || meta.height > maxDim) {
    pipe = pipe.resize({ width: maxDim, height: maxDim, fit: "inside", withoutEnlargement: true });
  }
  if (ext === ".png") {
    pipe = pipe.png({ palette: true, quality: 72, effort: 9, compressionLevel: 9 });
  } else {
    pipe = pipe.jpeg({ quality: 70, mozjpeg: true, progressive: true, chromaSubsampling: "4:2:0" });
  }
  const buf = await pipe.toBuffer();
  before += orig.length;
  if (buf.length < orig.length) {
    writeFileSync(f, buf);
    after += buf.length;
    changed++;
    const pct = ((1 - buf.length / orig.length) * 100).toFixed(0);
    console.log(`  ${f}  ${(orig.length/1024).toFixed(0)}K -> ${(buf.length/1024).toFixed(0)}K  (-${pct}%)`);
  } else {
    after += orig.length;
  }
}
console.log(`\n${changed}/${files.length} immagini ricompresse.`);
console.log(`Totale: ${(before/1024/1024).toFixed(2)} MB -> ${(after/1024/1024).toFixed(2)} MB  (-${((1-after/before)*100).toFixed(0)}%)`);
