// Compressione immagini "al massimo" per il deploy, in place.
// - JPEG: ridimensiona a max 1800px, mozjpeg q70 progressive 4:2:0
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
  let pipe = sharp(orig, { failOn: "none" }).rotate();
  const meta = await pipe.metadata();
  if (meta.width > MAX_DIM || meta.height > MAX_DIM) {
    pipe = pipe.resize({ width: MAX_DIM, height: MAX_DIM, fit: "inside", withoutEnlargement: true });
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
