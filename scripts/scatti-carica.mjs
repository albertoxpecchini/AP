// ─── Shooting · portare UNA sessione nel secchio privato (e riprenderla) ─────
//
//   npm run scatti:carica -- s1     carica la sessione s1 su Supabase Storage
//   npm run scatti:togli  -- s1     la toglie di là, e non ci pensa più
//   npm run scatti:carica            (senza argomenti) dice cosa c'è di sopra
//
// Perché esiste: /shooting può dare a qualcuno il permesso di vedere le foto da
// remoto (vedi lib/scattiAccesso.ts), e per vederle da remoto le foto devono
// stare da qualche parte che non sia questo computer. Quel "qualche parte" è un
// bucket PRIVATO: nessun indirizzo pubblico, si apre solo con una firma che il
// server rilascia a chi ha un token vivo, e la firma scade in un'ora.
//
// È volutamente un comando a parte, e vuole il nome della sessione scritto per
// esteso. Caricare le foto di qualcuno è una decisione, non un effetto
// collaterale di `npm run scatti`: quello che non nomini resta qui.
//
// Sale tutto: miniatura, versione media E ORIGINALE — chi è ritratto scarica i
// suoi scatti a piena risoluzione. Sono ~5,5 MB a foto, quindi il comando dice
// prima quanto pesa e chiede conferma se si passa il mezzo giga.
//
// Env (da .env o dall'ambiente): VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// ─────────────────────────────────────────────────────────────────────────────

import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const SRC_DIR = join(root, "foto", "shooting");
const WEB_DIR = join(SRC_DIR, ".web");
const MANIFESTO = join(WEB_DIR, "manifesto.json");
const BUCKET = "scatti";

const TIPI = {
  ".webp": "image/webp", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".png": "image/png", ".heic": "image/heic", ".tif": "image/tiff", ".tiff": "image/tiff",
};

const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;

// ── Le chiavi ────────────────────────────────────────────────────────────────
// Su Vercel stanno nell'ambiente; qui in locale nel .env, che non è nel repo.
// Nessuna libreria: sono due righe, e una dipendenza in più per leggerle
// sarebbe una dipendenza in più da aggiornare per sempre.
function env() {
  const da = { ...process.env };
  const f = join(root, ".env");
  if (existsSync(f)) {
    for (const riga of readFileSync(f, "utf8").split(/\r?\n/)) {
      const m = riga.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !da[m[1]]) da[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
  const url = da.VITE_SUPABASE_URL?.replace(/\/+$/, "");
  const key = da.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Mancano VITE_SUPABASE_URL e/o SUPABASE_SERVICE_ROLE_KEY (in .env o nell'ambiente).");
    console.error("La service_role NON è la anon key: sta in Supabase → Project Settings → API.");
    process.exit(1);
  }
  return { url, key };
}

const auth = (key) => ({ apikey: key, Authorization: `Bearer ${key}` });

// ── Il secchio ───────────────────────────────────────────────────────────────

async function assicuraBucket({ url, key }) {
  const r = await fetch(`${url}/storage/v1/bucket/${BUCKET}`, { headers: auth(key) });
  if (r.ok) {
    const b = await r.json();
    if (b.public) {
      console.error(`\n! Il bucket "${BUCKET}" è PUBBLICO. Così le foto sarebbero raggiungibili da chiunque`);
      console.error("  ne indovinasse l'indirizzo, e tutto il meccanismo del permesso non servirebbe a niente.");
      console.error("  Supabase → Storage → scatti → Settings → togli «Public bucket». Poi rilancia.");
      process.exit(1);
    }
    return;
  }
  const c = await fetch(`${url}/storage/v1/bucket`, {
    method: "POST",
    headers: { ...auth(key), "Content-Type": "application/json" },
    body: JSON.stringify({ id: BUCKET, name: BUCKET, public: false }),
  });
  if (!c.ok) {
    console.error(`Non riesco a creare il bucket "${BUCKET}":`, c.status, await c.text());
    process.exit(1);
  }
  console.log(`  bucket "${BUCKET}" creato (privato)`);
}

async function carica({ url, key }, percorso, corpo, tipo) {
  const r = await fetch(`${url}/storage/v1/object/${BUCKET}/${percorso}`, {
    method: "POST",
    headers: { ...auth(key), "Content-Type": tipo, "x-upsert": "true" },
    body: corpo,
  });
  if (!r.ok) throw new Error(`${percorso}: ${r.status} ${await r.text()}`);
}

async function elenca({ url, key }, prefisso) {
  const r = await fetch(`${url}/storage/v1/object/list/${BUCKET}`, {
    method: "POST",
    headers: { ...auth(key), "Content-Type": "application/json" },
    body: JSON.stringify({ prefix: prefisso, limit: 2000 }),
  });
  if (!r.ok) return [];
  return await r.json();
}

async function togli({ url, key }, percorsi) {
  const r = await fetch(`${url}/storage/v1/object/${BUCKET}`, {
    method: "DELETE",
    headers: { ...auth(key), "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: percorsi }),
  });
  return r.ok;
}

// ── L'indirizzo locale di un file, dal manifesto privato ─────────────────────
// Nel manifesto gli indirizzi sono quelli del server di sviluppo
// (/scatti-privati/w/<file>): qui servono i file veri su disco.
function fileDaUrl(u, cartella) {
  const web = u.match(/^\/scatti-privati\/w\/(.+)$/);
  if (web) return join(WEB_DIR, decodeURIComponent(web[1]));
  const orig = u.match(/^\/scatti-privati\/o\/[^/]+\/(.+)$/);
  if (orig) return join(SRC_DIR, cartella, decodeURIComponent(orig[1]));
  return null;
}

async function conferma(domanda) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const r = (await rl.question(`${domanda} [s/N] `)).trim().toLowerCase();
  rl.close();
  return r === "s" || r === "si" || r === "sì";
}

// ── Il grosso ────────────────────────────────────────────────────────────────

async function main() {
  const argomenti = process.argv.slice(2);
  const rimuovi = argomenti.includes("--togli");
  const quale = argomenti.find((a) => /^s\d{1,2}$/.test(a));

  if (!existsSync(MANIFESTO)) {
    console.error("Manca foto/shooting/.web/manifesto.json. Lancia prima `npm run scatti`.");
    process.exit(1);
  }
  const man = JSON.parse(await readFile(MANIFESTO, "utf8"));
  const s = env();

  // ── Senza argomenti: cosa c'è di sopra ─────────────────────────────────────
  if (!quale) {
    await assicuraBucket(s);
    console.log(`\n  Sessioni in locale:`);
    for (const x of man.sessioni) {
      const su = await elenca(s, `${x.id}/`);
      const nSu = su.filter((o) => o.name !== "manifesto.json").length;
      console.log(
        `    ${x.id}  ${String(x.foto.length).padStart(3)} scatti  ${x.titolo.padEnd(10)}` +
          (nSu ? `  → ${nSu} file nel bucket` : "  → non caricata"),
      );
    }
    console.log(`\n  Per caricarne una:  npm run scatti:carica -- s1`);
    console.log(`  Per toglierla:      npm run scatti:togli  -- s1\n`);
    return;
  }

  const sess = man.sessioni.find((x) => x.id === quale);
  if (!sess) {
    console.error(`La sessione "${quale}" non esiste nel manifesto. Sono: ${man.sessioni.map((x) => x.id).join(", ")}`);
    process.exit(1);
  }

  await assicuraBucket(s);

  // ── Togliere ───────────────────────────────────────────────────────────────
  if (rimuovi) {
    const oggetti = await elenca(s, `${quale}/`);
    if (!oggetti.length) {
      console.log(`  ${quale} (${sess.titolo}) non è nel bucket: niente da togliere.`);
      return;
    }
    const percorsi = oggetti.map((o) => `${quale}/${o.name}`);
    const ok = await togli(s, percorsi);
    console.log(
      ok
        ? `  ${percorsi.length} file tolti dal bucket. ${sess.titolo} non è più raggiungibile da fuori,\n  e i permessi già dati non mostrano più niente.`
        : `  ! Non sono riuscito a togliere i file.`,
    );
    return;
  }

  // ── Caricare ───────────────────────────────────────────────────────────────
  const pezzi = [];
  let peso = 0;
  for (const f of sess.foto) {
    for (const [chiave, url] of [["mini", f.mini], ["medio", f.medio], ["originale", f.originale]]) {
      const file = fileDaUrl(url, sess.cartella);
      if (!file || !existsSync(file)) {
        console.error(`  ! manca ${file ?? url} — rilancia \`npm run scatti\``);
        process.exit(1);
      }
      pezzi.push({ id: f.id, chiave, file });
    }
  }

  const { statSync } = await import("node:fs");
  for (const p of pezzi) peso += statSync(p.file).size;

  console.log(`\n  ${sess.titolo} (${quale}) — ${sess.foto.length} scatti, ${pezzi.length} file, ${mb(peso)}`);
  console.log(`  destinazione: bucket privato "${BUCKET}", cartella ${quale}/\n`);

  if (peso > 500 * 1024 * 1024 && !(await conferma("  Sono più di mezzo giga. Procedo?"))) {
    console.log("  Annullato.");
    return;
  }

  let n = 0;
  for (const p of pezzi) {
    const nome = `${p.id}${p.chiave === "mini" ? "-m.webp" : p.chiave === "medio" ? ".webp" : extname(p.file).toLowerCase()}`;
    await carica(s, `${quale}/${nome}`, await readFile(p.file), TIPI[extname(p.file).toLowerCase()] ?? "application/octet-stream");
    p.percorso = `${quale}/${nome}`;
    n++;
    if (n % 10 === 0 || n === pezzi.length) process.stdout.write(`\r  caricati ${n}/${pezzi.length}   `);
  }
  process.stdout.write("\n");

  // ── Il manifesto della sessione, che vive nel bucket insieme alle foto ─────
  // Le funzioni /api leggono di qui: percorsi, non indirizzi. Gli indirizzi non
  // esistono finché qualcuno di autorizzato non li fa firmare.
  const perId = new Map();
  for (const p of pezzi) {
    const v = perId.get(p.id) ?? {};
    v[p.chiave] = p.percorso;
    perId.set(p.id, v);
  }

  const manifestoBucket = {
    sessione: quale,
    titolo: sess.titolo,
    caricato: new Date().toISOString(),
    foto: sess.foto.map((f) => ({
      id: f.id,
      ...perId.get(f.id),
      w: f.w, h: f.h, wo: f.wo, ho: f.ho,
      blur: f.blur,
      ora: f.ora,
      iso: f.iso, focale: f.focale, apertura: f.apertura, tempo: f.tempo,
      peso: f.peso,
      nome: f.nome,
    })),
  };

  await carica(
    s,
    `${quale}/manifesto.json`,
    Buffer.from(JSON.stringify(manifestoBucket, null, 2)),
    "application/json",
  );

  console.log(`\n  Fatto. ${sess.titolo} è nel bucket privato, e da adesso /shooting accetta`);
  console.log(`  richieste di accesso per questa sessione.`);
  console.log(`  Per rimangiarsi tutto:  npm run scatti:togli -- ${quale}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
