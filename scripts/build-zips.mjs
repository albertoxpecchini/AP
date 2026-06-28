// ─── Generatore degli ZIP per l'archivio (/archivio) ─────────────────────────
//
// Per ogni progetto INTERNO crea public/zips/<id>.zip col codice sorgente della
// sua cartella (src/app/<id>/). I 5 giochi includono anche il motore condiviso
// src/app/_game/ (come cartella sorella, a specchio della struttura del repo),
// più un LEGGIMI.txt che chiarisce che è sorgente di RIFERIMENTO (dipende
// dall'intero repo: non è eseguibile a sé).
//
// Emette anche public/zips/manifest.json con le dimensioni reali (byte) di ogni
// zip e dei PDF, così l'archivio mostra la colonna "Dimensione" corretta.
//
// Gira in `prebuild` (prima di `vite build`, anche su Vercel) e a mano con
// `npm run zips`. Richiede la devDependency `archiver`.
// ─────────────────────────────────────────────────────────────────────────────

import {
  createWriteStream,
  mkdirSync,
  statSync,
  existsSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import archiver from "archiver";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const ZIP_DIR = join(root, "public", "zips");
const SHARED_GAME_DIR = "src/app/_game";

// Progetti interni: id → cartella sorgente, e se è un gioco (motore condiviso).
const INTERNAL = [
  { id: "pcto",        dir: "src/app/pcto",        game: false },
  { id: "me-stesso",   dir: "src/app/me-stesso",   game: false },
  { id: "dubliners",   dir: "src/app/dubliners",   game: false },
  { id: "gattopardo",  dir: "src/app/gattopardo",  game: false },
  { id: "letteratura", dir: "src/app/letteratura", game: false },
  { id: "mappa",       dir: "src/app/mappa",       game: true  },
  { id: "movimento",   dir: "src/app/movimento",   game: true  },
  { id: "trivia",      dir: "src/app/trivia",      game: true  },
  { id: "angoli",      dir: "src/app/angoli",      game: true  },
  { id: "parole",      dir: "src/app/parole",      game: true  },
];

// Documenti (PDF già in public/): solo dimensione per la colonna "Dimensione".
const DOCS = [
  { id: "schemi-orale",        file: "public/schemi-orale-letteratura.pdf" },
  { id: "cv",                  file: "public/cv-alberto-pecchini.pdf" },
  { id: "attestato-sicurezza", file: "public/attestato-sicurezza-lavoratori-rischio-basso.pdf" },
];

function readme(id) {
  return [
    `Progetto: ${id}`,
    ``,
    `Codice sorgente di riferimento, estratto dal portfolio di Alberto Pecchini.`,
    `Questa cartella è il sorgente del progetto così com'è nel repository: dipende`,
    `dal resto dell'app (motore condiviso, stili globali, dipendenze npm) e quindi`,
    `non è pensata per essere compilata da sola.`,
    ``,
    `Vedilo online: https://albertopecchini.it/${id}`,
    `Generato il ${new Date().toISOString()}`,
    ``,
  ].join("\n");
}

function zipProject({ id, dir, game }) {
  return new Promise((res, rej) => {
    const srcPath = join(root, dir);
    if (!existsSync(srcPath)) {
      console.warn(`! salto ${id}: cartella mancante ${dir}`);
      return res(null);
    }
    const outPath = join(ZIP_DIR, `${id}.zip`);
    const out = createWriteStream(outPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    out.on("close", () => res(statSync(outPath).size));
    archive.on("warning", (e) => (e.code === "ENOENT" ? console.warn(e) : rej(e)));
    archive.on("error", rej);

    archive.pipe(out);
    archive.directory(srcPath, id);
    if (game && existsSync(join(root, SHARED_GAME_DIR))) {
      archive.directory(join(root, SHARED_GAME_DIR), "_game");
    }
    archive.append(readme(id), { name: "LEGGIMI.txt" });
    archive.finalize();
  });
}

async function main() {
  mkdirSync(ZIP_DIR, { recursive: true });
  const manifest = {};

  for (const p of INTERNAL) {
    const bytes = await zipProject(p);
    if (bytes != null) {
      manifest[p.id] = { bytes, builtAt: new Date().toISOString() };
      console.log(`✓ ${p.id}.zip — ${(bytes / 1024).toFixed(0)} KB`);
    }
  }

  for (const d of DOCS) {
    const filePath = join(root, d.file);
    if (existsSync(filePath)) {
      manifest[d.id] = { bytes: statSync(filePath).size, builtAt: new Date().toISOString() };
    } else {
      console.warn(`! PDF mancante: ${d.file}`);
    }
  }

  writeFileSync(join(ZIP_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`\n✓ manifest.json — ${Object.keys(manifest).length} voci`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
