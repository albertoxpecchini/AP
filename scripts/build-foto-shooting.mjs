// ─── Shooting: dagli scatti originali ai due manifesti ───────────────────────
//
// Legge gli EXIF degli scatti, con una differenza che cambia tutto rispetto a
// ogni altro inventario del progetto: qui le foto NON diventano pubbliche. Sono
// ritratti di persone, e quello che esce dal computer è il racconto della
// sessione — data, luogo, quanti scatti, con che
// macchina, come si chiama, e sei sagome sfocate da 24 px. Le immagini restano
// in locale, e da lì escono solo con un permesso (vedi lib/scattiAccesso.ts).
//
// Per questo lo script scrive DUE manifesti, e sono separati apposta:
//
//   src/app/shooting/sessioni.json   PUBBLICO, versionato. Date, luoghi, numeri,
//                                    il titolo della sessione e sei impronte
//                                    sfocate da 24 px. Nessun nome di file,
//                                    nessuna immagine vera.
//   foto/shooting/.web/manifesto.json  PRIVATO, dentro foto/ che è in
//                                    .gitignore. Qui c'è tutto: titoli, scatti,
//                                    misure, indirizzi delle immagini.
//
// E le immagini rimpicciolite finiscono in foto/shooting/.web/, NON in public/.
// È la scelta importante di tutto il meccanismo: public/ viene copiata dentro
// dist/ da ogni `vite build`, quindi una foto messa lì sarebbe a un deploy di
// distanza dall'essere pubblica. In foto/ non ci arriva nessuna build, e il
// solo modo di vederle è il plugin di sviluppo (scripts/shooting-api-dev.mjs),
// che vive dentro `configureServer` — cioè esiste solo sotto `vite dev`.
//
// In produzione, quindi, le foto non sono "nascoste": non ci sono proprio.
//
// ── Come si usa ──────────────────────────────────────────────────────────────
//
//   foto/shooting/<cartella>/    una cartella per sessione, gli originali dentro
//   foto/shooting/sessioni.json  l'ordine, il titolo e il luogo di ognuna
//   npm run scatti               rigenera tutto
//
// Se sessioni.json non c'è, le cartelle si prendono in ordine alfabetico e il
// titolo è il nome della cartella con l'iniziale maiuscola.
//
// ── Perché è incrementale ────────────────────────────────────────────────────
// Ogni uscita porta in fondo al nome un'impronta del file d'origine (dimensione
// + data di modifica). File invariato → stessa impronta → l'uscita c'è già e si
// salta. Aggiungere dieci scatti costa dieci scatti, non ottantanove.
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
const SRC_DIR = join(root, "foto", "shooting");
const WEB_DIR = join(SRC_DIR, ".web");
const CONFIG = join(SRC_DIR, "sessioni.json");
const MANIFESTO_PRIVATO = join(WEB_DIR, "manifesto.json");
const MANIFESTO_PUBBLICO = join(root, "src", "app", "shooting", "sessioni.json");

// Gli indirizzi con cui la pagina chiede le immagini al server di sviluppo.
// Li serve scripts/shooting-api-dev.mjs, e solo lui: in produzione rispondono
// 404, ed è esattamente quello che devono fare.
const URL_WEB = "/scatti-privati/w";
const URL_ORIG = "/scatti-privati/o";

const ESTENSIONI = new Set([".jpg", ".jpeg", ".png", ".heic", ".heif", ".webp", ".tif", ".tiff"]);

// ── Misure ───────────────────────────────────────────────────────────────────
// MINI: la cella della griglia, ~300 px a schermo, il doppio sui pannelli
// retina. MEDIO: la foto aperta nel visore, che deve comparire SUBITO — poi
// dietro le quinte arriva l'originale e prende il suo posto senza che si veda
// niente (è il "full quality" del visore). Un terzo formato in mezzo non
// servirebbe a nessuno: qui la rete è il disco locale.
const MINI = 640;
const MEDIO = 1800;
const Q_MINI = 70;
const Q_MEDIO = 80;

// L'anteprima sfocata incorporata nel manifesto: 24 px di lato lungo, che sono
// ~600 byte di base64 a foto. Serve a riempire la cella nell'istante zero, così
// la griglia non è una scacchiera grigia mentre le miniature arrivano.
const BLUR = 24;

const FUSO = "Europe/Rome";

const kb = (n) => `${(n / 1024).toFixed(0)} kB`;
const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;

/** Nome di file prevedibile: niente accenti, spazi o maiuscole. */
function slug(s) {
  return (
    s
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "scatto"
  );
}

/** Giorno di calendario a Roma. `toISOString()` qui sbaglierebbe: è UTC, e uno
 *  scatto dell'una di notte tornerebbe indietro di un giorno — che è proprio
 *  l'ora a cui sono state fatte queste. */
function giornoRomano(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(date);
}

/** L'ora locale, per l'etichetta sotto la foto. */
function oraRomana(date) {
  return new Intl.DateTimeFormat("it-IT", {
    timeZone: FUSO, hour: "2-digit", minute: "2-digit",
  }).format(date);
}

/** Data leggibile in italiano: "mercoledì 19 agosto 2026". */
const GIORNI = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];
const MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno",
  "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
function etichettaGiorno(iso) {
  const [a, m, g] = iso.split("-").map(Number);
  // Mezzogiorno e non mezzanotte: a mezzanotte un fuso negativo riporterebbe
  // la data al giorno prima, e l'etichetta direbbe un giorno sbagliato.
  const d = new Date(a, m - 1, g, 12);
  return `${GIORNI[d.getDay()]} ${g} ${MESI[m - 1]} ${a}`;
}

/** "1/60", "2\"" — il tempo di posa come lo scrive una macchina fotografica. */
function tempoDiPosa(sec) {
  if (typeof sec !== "number" || !(sec > 0)) return null;
  return sec >= 1 ? `${Math.round(sec * 10) / 10}"` : `1/${Math.round(1 / sec)}`;
}

/** Il modello, senza la marca ripetuta due volte ("Canon Canon EOS 4000D"). */
function nomeMacchina(make, model) {
  const marca = (make || "").trim();
  const modello = (model || "").trim();
  if (!modello) return marca || null;
  if (marca && modello.toLowerCase().startsWith(marca.toLowerCase())) return modello;
  return [marca, modello].filter(Boolean).join(" ") || null;
}

/** Estremi di una serie di numeri, saltando i buchi. */
function estremi(valori) {
  const v = valori.filter((x) => typeof x === "number" && Number.isFinite(x));
  if (!v.length) return null;
  return { min: Math.min(...v), max: Math.max(...v) };
}

/** Il valore che compare più spesso: macchina e obiettivo di una sessione. */
function ilPiuComune(valori) {
  const conta = new Map();
  for (const v of valori) if (v) conta.set(v, (conta.get(v) || 0) + 1);
  let best = null;
  for (const [v, n] of conta) if (!best || n > best.n) best = { v, n };
  return best?.v ?? null;
}

// ── Le sessioni ──────────────────────────────────────────────────────────────
// L'ordine, il titolo e il luogo si scrivono in foto/shooting/sessioni.json,
// che sta dentro foto/ e quindi fuori dal repo: la SORGENTE resta lì, insieme
// alle foto, e il repo non ha bisogno di sapere quali cartelle esistono su
// questo computer.
//
// Il titolo però, da quando le schede lo mostrano, viene copiato nel manifesto
// pubblico — cioè è una decisione presa, non una svista: chi lo cambia qui lo
// sta cambiando anche sul sito, e quel valore finisce nella storia di git.

async function leggiSessioni() {
  const cartelle = (await readdir(SRC_DIR, { withFileTypes: true }))
    .filter((v) => v.isDirectory() && !v.name.startsWith("."))
    .map((v) => v.name);

  let config = [];
  if (existsSync(CONFIG)) {
    try {
      const letto = JSON.parse(await readFile(CONFIG, "utf8"));
      config = Array.isArray(letto) ? letto : (letto.sessioni ?? []);
    } catch (e) {
      console.warn(`! ${relative(root, CONFIG)} non si legge (${e.message}): si va di ordine alfabetico.`);
    }
  }

  const ordinate = [];
  for (const voce of config) {
    if (!cartelle.includes(voce.cartella)) {
      console.warn(`! sessioni.json nomina "${voce.cartella}", ma quella cartella non c'è: saltata.`);
      continue;
    }
    ordinate.push(voce);
  }
  // Le cartelle non nominate nella configurazione vengono in coda, in ordine.
  for (const c of cartelle.sort()) {
    if (!ordinate.some((v) => v.cartella === c)) ordinate.push({ cartella: c });
  }

  return ordinate.map((v, i) => ({
    // L'id pubblico è un progressivo: "s1", "s2". Non il nome della cartella —
    // quello è il nome della persona, e l'id finisce nel manifesto versionato.
    id: `s${i + 1}`,
    cartella: v.cartella,
    titolo: v.titolo || v.cartella.charAt(0).toUpperCase() + v.cartella.slice(1),
    luogo: v.luogo ?? null,
    nota: v.nota ?? null,
  }));
}

// ── Metadati di uno scatto ───────────────────────────────────────────────────

async function metadati(file) {
  let exif = null;
  try {
    // Niente `pick`: filtrando i tag grezzi exifr smette di normalizzare metà
    // dei valori. Si chiedono i blocchi interi, costa uguale.
    exif = await exifr.parse(file, { tiff: true, exif: true, ifd0: true });
  } catch {
    // Un file senza EXIF leggibile non è un errore: è una foto senza metadati.
  }

  const st = await stat(file);
  const grezza = exif?.DateTimeOriginal || exif?.CreateDate || exif?.ModifyDate;
  const daExif = grezza instanceof Date && !Number.isNaN(+grezza) ? grezza : null;

  return {
    quando: daExif || st.mtime,
    // Solo il filesystem è davvero incerto: dice quando il file è stato
    // COPIATO dalla scheda, non quando è stato scattato.
    dataIncerta: !daExif,
    macchina: nomeMacchina(exif?.Make, exif?.Model),
    obiettivo: (exif?.LensModel || "").trim() || null,
    iso: typeof exif?.ISO === "number" ? exif.ISO : null,
    focale: typeof exif?.FocalLength === "number" ? Math.round(exif.FocalLength) : null,
    apertura: typeof exif?.FNumber === "number" ? exif.FNumber : null,
    tempo: tempoDiPosa(exif?.ExposureTime),
    peso: st.size,
    impronta: `${st.size.toString(36)}${Math.floor(st.mtimeMs).toString(36)}`,
  };
}

// ── Immagini ─────────────────────────────────────────────────────────────────

async function ridimensiona(file, nomeBase) {
  const uscite = [
    { chiave: "mini", nome: `${nomeBase}-m.webp`, lato: MINI, q: Q_MINI },
    { chiave: "medio", nome: `${nomeBase}.webp`, lato: MEDIO, q: Q_MEDIO },
  ];

  let larghezza = null, altezza = null, peso = 0, saltate = 0;

  // Le misure dell'ORIGINALE, che il visore dichiara quando ha finito di
  // caricarlo ("originale · 5184×3456"). Si leggono dall'intestazione, non
  // decodificando l'immagine; l'orientamento EXIF va applicato a mano, perché
  // sharp qui riporta il fotogramma com'è scritto nel file — un verticale
  // risulterebbe 5184×3456 come tutti gli altri.
  const m0 = await sharp(file).metadata();
  const coricata = (m0.orientation ?? 1) >= 5;
  const wOrig = coricata ? m0.height : m0.width;
  const hOrig = coricata ? m0.width : m0.height;

  for (const u of uscite) {
    const dest = join(WEB_DIR, u.nome);
    if (existsSync(dest)) {
      // L'impronta è già dentro al nome: se il file c'è, la sorgente è la
      // stessa di prima e non c'è niente da rifare.
      const st = await stat(dest);
      peso += st.size;
      saltate++;
      if (u.chiave === "medio") {
        const m = await sharp(dest).metadata();
        larghezza = m.width; altezza = m.height;
      }
      continue;
    }

    const info = await sharp(file)
      // .rotate() senza argomenti applica l'orientamento EXIF: senza, i
      // verticali uscirebbero coricati.
      .rotate()
      .resize({ width: u.lato, height: u.lato, fit: "inside", withoutEnlargement: true })
      // Nessun withMetadata(): le copie escono senza EXIF. Anche se restano in
      // locale, una copia senza metadati è una copia che non può raccontare
      // niente se un giorno finisce altrove.
      .webp({ quality: u.q, effort: 5 })
      .toFile(dest);

    peso += info.size;
    if (u.chiave === "medio") { larghezza = info.width; altezza = info.height; }
  }

  return {
    mini: uscite[0].nome, medio: uscite[1].nome,
    larghezza, altezza, wOrig, hOrig, peso, giaPronte: saltate === 2,
  };
}

/** L'anteprima sfocata, dentro al manifesto come data URI. */
async function anteprima(file) {
  const buf = await sharp(file)
    .rotate()
    .resize({ width: BLUR, height: BLUR, fit: "inside" })
    .webp({ quality: 40, effort: 6 })
    .toBuffer();
  return `data:image/webp;base64,${buf.toString("base64")}`;
}

// ── Il grosso ────────────────────────────────────────────────────────────────

async function main() {
  if (!existsSync(SRC_DIR)) {
    console.error(`Manca la cartella ${relative(root, SRC_DIR)}. Creala, e dentro una cartella per sessione.`);
    process.exit(1);
  }

  const sessioni = await leggiSessioni();
  if (!sessioni.length) {
    console.log(`Nessuna sessione in ${relative(root, SRC_DIR)}${sep}.`);
    console.log("Serve una sottocartella per shooting, con dentro gli scatti. Poi rilancia `npm run scatti`.");
    return;
  }

  await mkdir(WEB_DIR, { recursive: true });
  await mkdir(join(root, "src", "app", "shooting"), { recursive: true });

  const rotte = [];
  const private_ = [];
  const pubbliche = [];
  let pesoTotale = 0, nuove = 0, totale = 0;

  for (const s of sessioni) {
    const dir = join(SRC_DIR, s.cartella);
    const file = (await readdir(dir, { withFileTypes: true }))
      .filter((v) => v.isFile() && ESTENSIONI.has(extname(v.name).toLowerCase()))
      .map((v) => join(dir, v.name));

    if (!file.length) {
      console.warn(`! ${s.cartella}/ è vuota: sessione saltata.`);
      continue;
    }

    // ① Metadati di tutti, prima delle immagini: servono per l'ordine.
    const scatti = [];
    for (const f of file) {
      try {
        scatti.push({ file: f, nome: basename(f), ...(await metadati(f)) });
      } catch (e) {
        rotte.push({ file: relative(SRC_DIR, f), perche: e.message });
      }
    }
    scatti.sort((a, b) => a.quando - b.quando);

    // ② Immagini + voce di manifesto.
    const voci = [];
    let i = 0;
    for (const sc of scatti) {
      i++;
      const nomeBase = `${slug(s.cartella)}-${slug(basename(sc.nome, extname(sc.nome)))}-${sc.impronta}`;
      let img;
      try {
        img = await ridimensiona(sc.file, nomeBase);
      } catch (e) {
        rotte.push({ file: `${s.cartella}/${sc.nome}`, perche: e.message });
        continue;
      }
      if (!img.giaPronte) nuove++;
      pesoTotale += img.peso;

      voci.push({
        id: nomeBase,
        mini: `${URL_WEB}/${img.mini}`,
        medio: `${URL_WEB}/${img.medio}`,
        // L'originale, quello vero, non ricodificato: è il "full quality" del
        // visore. Lo serve il plugin di sviluppo leggendo direttamente da
        // foto/shooting/<cartella>/, senza copie di mezzo.
        originale: `${URL_ORIG}/${encodeURIComponent(s.cartella)}/${encodeURIComponent(sc.nome)}`,
        w: img.larghezza,
        h: img.altezza,
        // Le misure vere dell'originale: il visore le dichiara quando ha finito
        // di scambiare l'immagine («originale · 3456×5184»).
        wo: img.wOrig,
        ho: img.hOrig,
        blur: await anteprima(sc.file),
        quando: sc.quando.toISOString(),
        giorno: giornoRomano(sc.quando),
        ora: oraRomana(sc.quando),
        dataIncerta: sc.dataIncerta || undefined,
        iso: sc.iso ?? undefined,
        focale: sc.focale ?? undefined,
        apertura: sc.apertura ?? undefined,
        tempo: sc.tempo ?? undefined,
        peso: sc.peso,
        nome: sc.nome,
      });

      if (i % 10 === 0 || i === scatti.length) {
        process.stdout.write(`\r  ${s.cartella}: ${i}/${scatti.length}   `);
      }
    }
    process.stdout.write("\n");

    if (!voci.length) continue;
    totale += voci.length;

    const giorni = [...new Set(voci.map((v) => v.giorno))].sort();
    const ore = voci.map((v) => v.ora).sort();

    // ── La voce PRIVATA: tutto quanto ────────────────────────────────────────
    private_.push({ id: s.id, titolo: s.titolo, cartella: s.cartella, nota: s.nota, foto: voci });

    // ── La voce PUBBLICA: quello che può vedere chiunque ─────────────────────
    // Data, luogo, quanti scatti, con che attrezzatura, il titolo della
    // sessione, e una manciata di anteprime.
    //
    // Sulle anteprime: sono le stesse impronte sfocate che riempiono le celle
    // della griglia mentre le miniature arrivano — 24 px di lato lungo, che è
    // la misura in cui una persona è una macchia di colore e nient'altro. Non
    // si genera niente di nuovo per il pubblico, e soprattutto non si alza la
    // misura: a 24 px non c'è niente da recuperare, a 200 px comincerebbe a
    // esserci. Se ne prendono POCHE e distribuite lungo la sessione, perché
    // questo file finisce dentro al bundle e ogni impronta è ~300 byte di
    // base64 che non si comprime.
    const quante = Math.min(6, voci.length);
    const passo = voci.length / quante;
    const anteprime = Array.from({ length: quante }, (_, k) => {
      const v = voci[Math.floor(k * passo)];
      return { blur: v.blur, w: v.w, h: v.h };
    });

    pubbliche.push({
      id: s.id,
      titolo: s.titolo,
      anteprime,
      data: giorni[0],
      giorno: etichettaGiorno(giorni[0]),
      giorni: giorni.length > 1 ? giorni : undefined,
      ora: { da: ore[0], a: ore[ore.length - 1] },
      luogo: s.luogo ?? null,
      n: voci.length,
      macchina: ilPiuComune(scatti.map((x) => x.macchina)),
      obiettivo: ilPiuComune(scatti.map((x) => x.obiettivo)),
      iso: estremi(voci.map((v) => v.iso)),
      focale: estremi(voci.map((v) => v.focale)),
      apertura: estremi(voci.map((v) => v.apertura)),
    });
  }

  const generato = new Date().toISOString();

  await writeFile(
    MANIFESTO_PRIVATO,
    JSON.stringify({ generato, totale, sessioni: private_ }, null, 2) + "\n",
    "utf8",
  );

  await writeFile(
    MANIFESTO_PUBBLICO,
    JSON.stringify(
      {
        generato,
        // Da dove vengono i numeri, così la pagina non deve indovinarlo.
        fonte: "metadati EXIF degli scatti originali (DateTimeOriginal, Model, LensModel, ISO, FocalLength, FNumber)",
        totale,
        sessioni: pubbliche,
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );

  // ── Il resoconto ───────────────────────────────────────────────────────────
  console.log("");
  console.log(`  ${totale} scatti in ${pubbliche.length} sessioni  (${nuove} ricodificati ora, il resto era già pronto)`);
  for (const p of pubbliche) {
    const priv = private_.find((x) => x.id === p.id);
    console.log(`    ${p.id}  ${String(p.n).padStart(3)} scatti  ${p.giorno}  ${p.ora.da}–${p.ora.a}  ${priv?.titolo ?? ""}`);
  }
  console.log("");
  console.log(`  ${relative(root, WEB_DIR)}${sep} pesa ${mb(pesoTotale)}  (media ${kb(pesoTotale / Math.max(1, totale))} a scatto, mini + medio)`);
  console.log(`  privato:  ${relative(root, MANIFESTO_PRIVATO)}   (fuori dal repo, con dentro tutto)`);
  console.log(`  pubblico: ${relative(root, MANIFESTO_PUBBLICO)}  (versionato: date, luoghi, numeri, titoli e sagome)`);

  if (rotte.length) {
    console.log("");
    console.log(`  ! ${rotte.length} file non letti:`);
    for (const r of rotte.slice(0, 10)) console.log(`      ${r.file} — ${r.perche}`);
    if (rotte.length > 10) console.log(`      …e altri ${rotte.length - 10}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
