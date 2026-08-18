// ─── Album MiMa: dalle foto originali al manifesto della mappa ───────────────
//
// Legge le foto che stanno in foto/mima/ (gli ORIGINALI, fuori dal repo: quella
// cartella è in .gitignore) e produce due cose:
//
//   public/images/mima/     versioni rimpicciolite per il web — una grande e una
//                           miniatura, in WebP, senza metadati
//   src/app/mima/foto.json  il manifesto: ordine cronologico, coordinate,
//                           giornata di viaggio, nome del posto
//
// Il manifesto è quello che la pagina dell'album legge davvero. Le coordinate
// NON si scrivono a mano: vengono dai metadati EXIF di ogni scatto —
// GPSLatitude/GPSLongitude per il punto sulla mappa, DateTimeOriginal per
// l'ordine. I nomi dei posti vengono da PLACES, in content/mima/dati-viaggio.ts.
//
// Si lancia a mano con `npm run foto`, non in prebuild: le foto originali su
// Vercel non ci sono, e rigenerare 300 immagini a ogni deploy sarebbe assurdo.
// Nel repo ci va il risultato (public/images/mima/ + foto.json), già pronto.
//
// ── Perché è incrementale ────────────────────────────────────────────────────
// Con 300+ foto la ricodifica costa minuti. Ogni uscita porta in fondo al nome
// un'impronta del file d'origine (dimensione + data di modifica): se il file
// non è cambiato l'impronta è la stessa, l'uscita esiste già e si salta. Quindi
// aggiungere venti foto nuove costa venti foto, non trecentoventi.
//
// Richiede le devDependency `exifr` (metadati) e `sharp` (ridimensiona).
// ─────────────────────────────────────────────────────────────────────────────

import { readdir, stat, mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve, extname, basename, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import exifr from "exifr";
import sharp from "sharp";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const SRC_DIR = join(root, "foto", "mima");
const OUT_DIR = join(root, "public", "images", "mima");
const OUT_URL = "/images/mima";
const MANIFEST = join(root, "src", "app", "mima", "foto.json");
const DATI = join(root, "content", "mima", "dati-viaggio.ts");

const ESTENSIONI = new Set([".jpg", ".jpeg", ".png", ".heic", ".heif", ".webp", ".tif", ".tiff"]);

// ── Misure ───────────────────────────────────────────────────────────────────
// GRANDE: il lato lungo di una foto aperta a tutto schermo su un portatile. Più
// di così è peso che nessuno vede. MINI: la cella della griglia e il puntino
// sulla mappa, che di suo è ancora più piccolo.
const GRANDE = 1600;
const MINI = 480;
const Q_GRANDE = 72;
const Q_MINI = 66;

// Entro questo raggio uno scatto si prende il nome del posto invece della
// coordinata nuda. 350 m: l'ostello e la spiaggia distano ~200 m fra loro, e
// allargando troppo ogni foto di spiaggia diventerebbe "una foto in ostello".
const RAGGIO_LUOGO_KM = 0.35;

// Una foto senza GPS può ereditare la posizione da uno scatto vicino NEL TEMPO:
// se sono passati pochi minuti, quasi certamente si era nello stesso posto.
// Oltre questa distanza in minuti non si inventa niente e la foto resta senza
// puntino. Marcata `stimata: true`, che sulla mappa va detto.
const EREDITA_MINUTI = 30;

const FUSO = "Europe/Rome";

// ── Piccole utilità ──────────────────────────────────────────────────────────

const kb = (n) => `${(n / 1024).toFixed(0)} kB`;
const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;

/** Distanza in linea d'aria fra due punti, in km (formula dell'emisenoverso). */
function haversineKm(aLat, aLon, bLat, bLon) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Nome di file prevedibile: niente accenti, spazi o maiuscole. */
function slug(s) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // i segni diacritici, staccati dal NFD
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "foto";
}

/** Giorno di calendario a Roma. `toISOString()` qui sbaglierebbe: è UTC, e uno
 *  scatto dell'una di notte tornerebbe indietro di un giorno. */
function giornoRomano(date) {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit",
  });
  return f.format(date); // YYYY-MM-DD
}

/** L'ora locale, per l'etichetta sotto la foto. */
function oraRomana(date) {
  return new Intl.DateTimeFormat("it-IT", {
    timeZone: FUSO, hour: "2-digit", minute: "2-digit",
  }).format(date);
}

/**
 * La data letta dal NOME del file, per gli scatti che hanno perso gli EXIF.
 *
 * Le foto arrivate dal gruppo si chiamano tutte "2026-08-16 21.53.13.jpg", con
 * eventuale "-1", "-2" per i doppioni: dentro al nome c'è l'istante vero dello
 * scatto, che è esattamente il dato che l'EXIF non ha più. È un ripiego molto
 * migliore della data di modifica del file — quella dice quando il file è stato
 * COPIATO, e basta ricopiare la cartella su un altro disco per veder saltare
 * l'ordine cronologico di tutto l'album.
 *
 * Si legge come ora locale italiana, che è quella in cui si è scattato.
 */
function dataDalNome(nomeFile) {
  const m = nomeFile.match(/(\d{4})-(\d{2})-(\d{2})[ _T](\d{2})[.:-](\d{2})[.:-](\d{2})/);
  if (!m) return null;
  // Agosto in Italia è CEST, +02:00. Scriverlo esplicito evita che il fuso del
  // computer che lancia lo script sposti tutte le foto di un'ora.
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}+02:00`);
  return Number.isNaN(+d) ? null : d;
}

// ── I posti noti, letti da content/mima/dati-viaggio.ts ──────────────────────
// Si legge il file come testo invece di importarlo: è TypeScript, e node non lo
// esegue. Serve solo l'oggetto PLACES, e le sue righe hanno una forma fissa.
async function leggiLuoghi() {
  if (!existsSync(DATI)) {
    console.warn(`! ${relative(root, DATI)} non c'è: le foto avranno le coordinate ma nessun nome di posto.`);
    return [];
  }
  const testo = await readFile(DATI, "utf8");
  const blocco = testo.match(/export const PLACES[^=]*=\s*\{([\s\S]*?)\n\};/);
  if (!blocco) {
    console.warn("! PLACES non trovato in dati-viaggio.ts: niente nomi di posto.");
    return [];
  }
  const luoghi = [];
  const re = /key:\s*"([^"]+)"[\s\S]*?name:\s*"([^"]+)"[\s\S]*?lon:\s*(-?[\d.]+)[\s\S]*?lat:\s*(-?[\d.]+)/g;
  let m;
  while ((m = re.exec(blocco[1])) !== null) {
    luoghi.push({ key: m[1], nome: m[2], lon: Number(m[3]), lat: Number(m[4]) });
  }
  return luoghi;
}

/** Il posto noto più vicino, se è abbastanza vicino da poterlo nominare. */
function luogoPiuVicino(lat, lon, luoghi) {
  let best = null;
  for (const l of luoghi) {
    const km = haversineKm(lat, lon, l.lat, l.lon);
    if (!best || km < best.km) best = { ...l, km };
  }
  return best && best.km <= RAGGIO_LUOGO_KM ? best : null;
}

// ── Scansione della cartella ─────────────────────────────────────────────────

async function cerca(dir) {
  const trovate = [];
  let voci;
  try {
    voci = await readdir(dir, { withFileTypes: true });
  } catch {
    return trovate;
  }
  for (const v of voci) {
    const p = join(dir, v.name);
    if (v.isDirectory()) {
      trovate.push(...(await cerca(p)));
    } else if (ESTENSIONI.has(extname(v.name).toLowerCase())) {
      trovate.push(p);
    }
  }
  return trovate;
}

// ── Metadati ─────────────────────────────────────────────────────────────────

async function metadati(file) {
  let exif = null;
  try {
    // Niente `pick`: filtrando i tag grezzi, exifr non arriva più a calcolare
    // `latitude`/`longitude` dai GPSLatitude/GPSLongitude in gradi-primi-secondi,
    // e ogni foto risulterebbe senza posizione. Si chiedono i blocchi interi.
    exif = await exifr.parse(file, { tiff: true, exif: true, gps: true, ifd0: true });
  } catch {
    // Un file senza EXIF leggibile non è un errore: è una foto senza metadati.
  }

  const st = await stat(file);
  const grezza = exif?.DateTimeOriginal || exif?.CreateDate || exif?.ModifyDate;
  const daExif = grezza instanceof Date && !Number.isNaN(+grezza) ? grezza : null;
  // In ordine di fiducia: l'EXIF dello scatto, poi l'istante scritto nel nome
  // del file, e solo se non c'è nemmeno quello la data di modifica.
  const daNome = daExif ? null : dataDalNome(basename(file));

  return {
    quando: daExif || daNome || st.mtime,
    fonteData: daExif ? "exif" : daNome ? "nome" : "file",
    // Solo il filesystem è davvero incerto: dice quando il file è stato
    // COPIATO, non scattato. Il nome invece l'istante ce l'ha scritto dentro.
    dataIncerta: !daExif && !daNome,
    lat: typeof exif?.latitude === "number" ? exif.latitude : null,
    lon: typeof exif?.longitude === "number" ? exif.longitude : null,
    macchina: [exif?.Make, exif?.Model].filter(Boolean).join(" ").trim() || null,
    peso: st.size,
    impronta: `${st.size.toString(36)}${Math.floor(st.mtimeMs).toString(36)}`,
  };
}

// ── Immagini ─────────────────────────────────────────────────────────────────

async function ridimensiona(file, nomeBase) {
  const uscite = {
    grande: { nome: `${nomeBase}.webp`, lato: GRANDE, q: Q_GRANDE },
    mini: { nome: `${nomeBase}-mini.webp`, lato: MINI, q: Q_MINI },
  };

  let larghezza = null, altezza = null, peso = 0, saltate = 0;

  for (const u of Object.values(uscite)) {
    const dest = join(OUT_DIR, u.nome);
    if (existsSync(dest)) {
      // L'impronta è già dentro al nome: se il file c'è, la sorgente è la
      // stessa di prima e non c'è niente da rifare.
      const st = await stat(dest);
      peso += st.size;
      saltate++;
      if (u.lato === GRANDE) {
        const m = await sharp(dest).metadata();
        larghezza = m.width; altezza = m.height;
      }
      continue;
    }

    const info = await sharp(file)
      // .rotate() senza argomenti applica l'orientamento EXIF: senza, metà
      // delle foto di telefono uscirebbero coricate.
      .rotate()
      .resize({ width: u.lato, height: u.lato, fit: "inside", withoutEnlargement: true })
      // Nessun withMetadata(): le copie pubblicate escono SENZA EXIF, quindi
      // senza le coordinate di casa attaccate a ogni scatto. La posizione che
      // serve all'album sta nel manifesto, ed è solo quella del viaggio.
      .webp({ quality: u.q })
      .toFile(dest);

    peso += info.size;
    if (u.lato === GRANDE) { larghezza = info.width; altezza = info.height; }
  }

  return { ...uscite, larghezza, altezza, peso, giaPronte: saltate === 2 };
}

// ── Il grosso ────────────────────────────────────────────────────────────────

async function main() {
  if (!existsSync(SRC_DIR)) {
    console.error(`Manca la cartella ${relative(root, SRC_DIR)}. Creala e buttaci dentro le foto.`);
    process.exit(1);
  }

  const luoghi = await leggiLuoghi();
  const file = await cerca(SRC_DIR);

  if (file.length === 0) {
    console.log(`Nessuna foto in ${relative(root, SRC_DIR)}${sep}.`);
    console.log("Buttacele dentro (jpg, png, heic…) e rilancia `npm run foto`.");
    return;
  }

  console.log(`${file.length} foto trovate in ${relative(root, SRC_DIR)}${sep}\n`);
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(join(root, "src", "app", "mima"), { recursive: true });

  // ① Metadati di tutte, prima di toccare le immagini: l'ordine cronologico
  //    serve già per far ereditare la posizione agli scatti senza GPS.
  const foto = [];
  const rotte = [];
  for (const f of file) {
    try {
      foto.push({ file: f, rel: relative(SRC_DIR, f), ...(await metadati(f)) });
    } catch (e) {
      rotte.push({ file: relative(SRC_DIR, f), perche: e.message });
    }
  }

  foto.sort((a, b) => a.quando - b.quando);

  // ② Posizione dedotta per chi non ha il GPS: si guarda lo scatto con GPS più
  //    vicino nel tempo, e lo si prende solo se è abbastanza vicino.
  const conGps = foto.filter((f) => f.lat != null);
  let dedotte = 0;
  for (const f of foto) {
    if (f.lat != null) { f.stimata = false; continue; }
    let vicino = null, minDiff = Infinity;
    for (const g of conGps) {
      const diff = Math.abs(g.quando - f.quando);
      if (diff < minDiff) { minDiff = diff; vicino = g; }
    }
    if (vicino && minDiff <= EREDITA_MINUTI * 60_000) {
      f.lat = vicino.lat; f.lon = vicino.lon; f.stimata = true;
      dedotte++;
    } else {
      f.stimata = false;
    }
  }

  // ③ Immagini + voce di manifesto.
  const voci = [];
  let pesoTotale = 0, nuove = 0;
  let i = 0;

  for (const f of foto) {
    i++;
    const nomeBase = `${slug(basename(f.rel, extname(f.rel)))}-${f.impronta}`;
    let img;
    try {
      img = await ridimensiona(f.file, nomeBase);
    } catch (e) {
      rotte.push({ file: f.rel, perche: e.message });
      continue;
    }
    if (!img.giaPronte) nuove++;
    pesoTotale += img.peso;

    const posto = f.lat != null ? luogoPiuVicino(f.lat, f.lon, luoghi) : null;

    voci.push({
      id: nomeBase,
      src: `${OUT_URL}/${img.grande.nome}`,
      mini: `${OUT_URL}/${img.mini.nome}`,
      w: img.larghezza,
      h: img.altezza,
      quando: f.quando.toISOString(),
      giorno: giornoRomano(f.quando),
      ora: oraRomana(f.quando),
      dataIncerta: f.dataIncerta || undefined,
      fonteData: f.fonteData,
      lat: f.lat ?? undefined,
      lon: f.lon ?? undefined,
      // La posizione non è stata letta da QUESTO scatto: è quella di uno
      // scattato pochi minuti prima o dopo. Sulla mappa va detto.
      posizioneStimata: f.stimata || undefined,
      luogo: posto?.nome,
      luogoKey: posto?.key,
      macchina: f.macchina ?? undefined,
      originale: f.rel.split(sep).join("/"),
    });

    if (i % 25 === 0 || i === foto.length) {
      process.stdout.write(`\r  elaborate ${i}/${foto.length}`);
    }
  }
  process.stdout.write("\n");

  // ④ Giornate e inquadratura della mappa, calcolate sulle foto vere.
  const perGiorno = new Map();
  for (const v of voci) perGiorno.set(v.giorno, (perGiorno.get(v.giorno) || 0) + 1);
  const giorni = [...perGiorno.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([data, n], idx) => ({ data, n, indice: idx + 1 }));

  const piazzate = voci.filter((v) => v.lat != null);
  const bounds = piazzate.length
    ? {
        sw: [Math.min(...piazzate.map((v) => v.lon)), Math.min(...piazzate.map((v) => v.lat))],
        ne: [Math.max(...piazzate.map((v) => v.lon)), Math.max(...piazzate.map((v) => v.lat))],
      }
    : null;

  const manifesto = {
    generato: new Date().toISOString(),
    // Da dove vengono i numeri, così la pagina non deve indovinarlo.
    fonte: "metadati EXIF delle foto originali (DateTimeOriginal, GPSLatitude/GPSLongitude)",
    totale: voci.length,
    conPosizione: piazzate.length,
    posizioneDedotta: voci.filter((v) => v.posizioneStimata).length,
    senzaPosizione: voci.length - piazzate.length,
    bounds,
    giorni,
    foto: voci,
  };

  await writeFile(MANIFEST, JSON.stringify(manifesto, null, 2) + "\n", "utf8");

  // ── Il resoconto ───────────────────────────────────────────────────────────
  const senza = voci.length - piazzate.length;
  console.log("");
  console.log(`  ${voci.length} foto nel manifesto  (${nuove} ricodificate ora, il resto era già pronto)`);
  console.log(`  ${piazzate.length} sulla mappa — di cui ${manifesto.posizioneDedotta} con posizione dedotta dallo scatto vicino`);
  if (senza) console.log(`  ${senza} senza posizione: restano nell'album, in ordine cronologico, ma senza puntino`);
  const dalNome = voci.filter((v) => v.fonteData === "nome").length;
  const incerte = voci.filter((v) => v.dataIncerta).length;
  if (dalNome) console.log(`  ${dalNome} senza data EXIF: ordinate con l'istante scritto nel nome del file`);
  if (incerte) console.log(`  ${incerte} senza data né in EXIF né nel nome: ordinate per data del file, che è quando è stato copiato`);
  console.log("");
  console.log("  Per giornata:");
  for (const g of giorni) console.log(`    ${g.data}  ${String(g.n).padStart(4)} foto`);
  console.log("");
  console.log(`  ${relative(root, OUT_DIR)}${sep} pesa ${mb(pesoTotale)}  (media ${kb(pesoTotale / Math.max(1, voci.length))} a foto, grande + miniatura)`);
  console.log(`  manifesto: ${relative(root, MANIFEST)}`);

  if (rotte.length) {
    console.log("");
    console.log(`  ! ${rotte.length} file non letti:`);
    for (const r of rotte.slice(0, 10)) console.log(`      ${r.file} — ${r.perche}`);
    if (rotte.length > 10) console.log(`      …e altri ${rotte.length - 10}`);
    console.log("");
    console.log("    Se sono .heic: esportali in JPEG e rilancia. Su iPhone,");
    console.log("    Impostazioni → Fotocamera → Formati → «Massima compatibilità».");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
