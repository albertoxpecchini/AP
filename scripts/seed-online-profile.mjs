// ─── Trivia · Seed profilo ONLINE con dati random (solo test) ────────────────
//
// Come seed-local-profile.js, ma scrive su Supabase (il backend vero) usando le
// STESSE chiamate del client: upsert su `players`, insert su `trivia_scores`,
// RPC `trivia_grade_record` per la pagella. L'ID del profilo lo assegna il DB
// (colonna identity: non è impostabile da fuori) e viene stampato a fine corsa.
//
// USO (serve la anon key, è quella pubblica del bundle / env Vercel):
//   node scripts/seed-online-profile.mjs --url https://xxxx.supabase.co --key eyJ...
// oppure via env (accetta anche i nomi VITE_*):
//   SUPABASE_URL=... SUPABASE_ANON_KEY=... node scripts/seed-online-profile.mjs
// oppure mettendo le due VITE_* in .env.local / .env (letti in quest'ordine).
//   --dry  →  stampa cosa scriverebbe, senza toccare il DB.
//
// PULIZIA: la anon key non può cancellare (RLS senza delete). Per rimuovere il
// profilo di test, lo script stampa in fondo l'SQL da incollare nel dashboard.

import { readFileSync, existsSync } from "node:fs";

// ── config ───────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const argVal = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const DRY = args.includes("--dry");

function fromEnvFiles(name) {
  for (const f of [".env.local", ".env"]) {
    if (!existsSync(f)) continue;
    const m = readFileSync(f, "utf8").match(new RegExp(`^${name}=(.+)$`, "m"));
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  }
  return undefined;
}
const URL_ = (argVal("--url") ?? process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  ?? fromEnvFiles("VITE_SUPABASE_URL"))?.replace(/\/+$/, "");
const ANON = argVal("--key") ?? process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY
  ?? fromEnvFiles("VITE_SUPABASE_ANON_KEY");

if (!URL_ || !ANON) {
  console.error("Config mancante: passa --url/--key, oppure env SUPABASE_URL/SUPABASE_ANON_KEY (o VITE_*), oppure .env.local");
  process.exit(1);
}

const HEADERS = { apikey: ANON, Authorization: `Bearer ${ANON}`, "Content-Type": "application/json" };
async function call(path, init) {
  const res = await fetch(`${URL_}${path}`, { ...init, headers: { ...HEADERS, ...init?.headers } });
  if (!res.ok) throw new Error(`${init?.method ?? "GET"} ${path} → ${res.status}: ${await res.text()}`);
  return res;
}

// ── generazione random (identica al seed locale) ─────────────────────────────
const CHAPTERS = [
  ["neoclassicismo", "Neoclassicismo"],
  ["teatro-alla-scala", "Teatro alla Scala di Milano"],
  ["padiglione-brighton", "Padiglione Reale di Brighton"],
  ["eclettismo", "Architettura eclettica"],
  ["architettura-del-ferro", "Architettura del ferro e ponti"],
  ["crystal-palace", "Crystal Palace"],
  ["torre-eiffel", "Torre Eiffel"],
  ["parigi-haussmann", "Parigi di Haussmann"],
  ["opera-parigi", "Opéra di Parigi (Palais Garnier)"],
  ["scuola-di-chicago", "Scuola di Chicago e grattacieli"],
  ["art-nouveau-bruxelles", "Art Nouveau a Bruxelles"],
  ["art-nouveau-francia", "Art Nouveau in Francia"],
  ["liberty-italia", "Liberty in Italia"],
  ["modernismo-catalano", "Modernismo catalano e Gaudí"],
  ["sagrada-familia", "Sagrada Família"],
  ["casa-batllo", "Casa Batlló"],
  ["casa-mila", "Casa Milà – La Pedrera"],
  ["fabbrica-aeg", "Fabbrica di turbine AEG"],
  ["bauhaus", "Stabilimento Fagus e Bauhaus"],
  ["movimento-moderno", "Movimento moderno"],
  ["villa-savoye", "Villa Savoye"],
  ["padiglione-barcellona", "Padiglione di Barcellona"],
  ["fallingwater", "Casa sulla cascata (Fallingwater)"],
  ["razionalismo-italia", "Razionalismo in Italia"],
  ["terragni-como", "Novocomum e Casa del Fascio"],
  ["unite-marsiglia", "Unità di abitazione di Marsiglia"],
  ["ronchamp", "Cappella di Notre-Dame du Haut (Ronchamp)"],
  ["alvar-aalto", "Architetture di Alvar Aalto"],
  ["guggenheim-ny", "Solomon R. Guggenheim Museum"],
  ["san-cataldo", "Cimitero di San Cataldo"],
  ["centre-pompidou", "Centre Georges Pompidou"],
  ["millennium-dome", "Millennium Dome"],
  ["auditorium-roma", "Auditorium Parco della Musica"],
  ["citta-arti-scienze", "Città delle Arti e delle Scienze"],
  ["maxxi", "MAXXI"],
  ["mediopadana", "Stazione Mediopadana e ponti di Calatrava"],
  ["bosco-verticale", "Bosco Verticale"],
  ["citylife", "Quartiere CityLife"],
  ["architettura-contemporanea", "Architettura contemporanea"],
];
const TYPE_TOTALS = { "multipla": 10, "vero-falso": 10, "aperta": 5 };

const rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (arr) => arr[rnd(0, arr.length - 1)];
const daysAgoIso = (d) => new Date(Date.now() - d * 864e5 - rnd(0, 864e5)).toISOString();

const nick = (pick(["Nova", "Gufo", "Lampo", "Perla", "Falco", "Vela", "Rondine", "Brina", "Sasso", "Nebbia"])
  + rnd(1, 99)).slice(0, 10);
const nickKey = nick.toLowerCase();

const played = [...CHAPTERS].sort(() => Math.random() - 0.5).slice(0, rnd(8, 16));

// classifica: 1–3 partite per capitolo (score come nel gioco: 100 base + bonus 0–100)
const scores = [];
for (const [slug] of played) {
  for (let g = rnd(1, 3); g > 0; g--) {
    const total = 25;
    const correct = rnd(Math.floor(total * 0.4), total);
    let score = 0;
    for (let i = 0; i < correct; i++) score += 100 + rnd(0, 100);
    scores.push({
      nick, score, chapter: slug,
      accuracy: Math.round((correct / total) * 100),
      best_streak: rnd(Math.min(2, correct), correct),
      created_at: daysAgoIso(rnd(0, 30)),
    });
  }
}

// pagella: per capitolo 1–3 tipi, DUE risultati per tipo → la RPC tiene da sola
// il migliore come record e l'ultimo chiamato come "ultimo".
const gradeCalls = [];   // { p_nick, p_arg_key, p_arg, p_type, p_correct, p_total, p_ms }
for (const [slug, title] of played) {
  const types = Object.keys(TYPE_TOTALS).sort(() => Math.random() - 0.5).slice(0, rnd(1, 3));
  for (const type of types) {
    const total = TYPE_TOTALS[type];
    for (let k = 0; k < 2; k++) {
      gradeCalls.push({
        p_nick: nick, p_arg_key: slug, p_arg: title, p_type: type,
        p_correct: rnd(Math.floor(total * 0.3), total), p_total: total,
        p_ms: total * rnd(3000, 15000),
      });
    }
  }
}

// ── scrittura ────────────────────────────────────────────────────────────────
console.log(`Profilo di test: ${nick} · ${scores.length} punteggi su ${played.length} capitoli · ${gradeCalls.length / 2} voti in pagella`);
if (DRY) {
  console.log("--dry: nessuna scrittura. Esempio punteggio:", scores[0], "\nEsempio voto:", gradeCalls[0]);
  process.exit(0);
}

// 1) profilo (upsert come src/lib/players.ts) — l'ID lo assegna il DB
const pRes = await call(`/rest/v1/players?on_conflict=nick_key`, {
  method: "POST",
  headers: { Prefer: "resolution=merge-duplicates,return=representation" },
  body: JSON.stringify({ nick, nick_key: nickKey, last_seen: new Date().toISOString() }),
});
const playerId = (await pRes.json())[0]?.id;

// 2) punteggi (insert bulk, stessa tabella/colonne di submitScore)
await call(`/rest/v1/trivia_scores`, { method: "POST", body: JSON.stringify(scores) });

// 3) pagella: RPC in sequenza per pacchetto (il 2° risultato diventa l'"ultimo")
for (let i = 0; i < gradeCalls.length; i += 8) {
  await Promise.all(gradeCalls.slice(i, i + 8).map(body =>
    call(`/rest/v1/rpc/trivia_grade_record`, { method: "POST", body: JSON.stringify(body) })
  ));
}

// ── verifica: rileggo dal DB quello che l'app leggerebbe ─────────────────────
const count = async (table, filter) => {
  const res = await call(`/rest/v1/${table}?select=*&${filter}&limit=1`, {
    method: "HEAD", headers: { Prefer: "count=exact" },
  });
  return res.headers.get("content-range")?.split("/")[1] ?? "?";
};
const nScores = await count("trivia_scores", `nick=eq.${encodeURIComponent(nick)}`);
const nGrades = await count("trivia_grades", `nick_key=eq.${encodeURIComponent(nickKey)}`);

console.log(`✅ Seed online completato — nick: ${nick} · id: ${playerId}`);
console.log(`   trivia_scores: ${nScores} righe · trivia_grades: ${nGrades} voti (verificati sul DB)`);
console.log(`\nPer rimuovere il profilo di test (Supabase → SQL Editor):`);
console.log(`  delete from public.trivia_scores where nick = '${nick}';`);
console.log(`  delete from public.trivia_grades where nick_key = '${nickKey}';`);
console.log(`  delete from public.trivia_progress where nick_key = '${nickKey}';`);
console.log(`  delete from public.players where nick_key = '${nickKey}';`);
