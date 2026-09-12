// ─────────────────────────────────────────────────────────────────────────────
// Il dev server che non muore.
//
// ── Il problema ──────────────────────────────────────────────────────────────
// `npm run dev` lanciato da una shell vive quanto la shell. Basta che il
// terminale si chiuda, che il task che l'ha avviato finisca o che la sessione
// cambi, e Vite se ne va con lui — senza dire niente. Il sintomo è che la
// pagina resta su una versione vecchia: il browser mostra l'ultima cosa che
// aveva in cache, e sembra che le modifiche non arrivino.
//
// ── Cosa fa questo ───────────────────────────────────────────────────────────
// Sorveglia Vite e lo RIACCENDE se cade: se il processo esce da solo — un
// crash, un file di configurazione salvato a metà, la porta occupata per un
// istante — riparte dopo un attimo, e la pagina in Edge si riprende da sola.
//
// Tutto quello che Vite scrive finisce in .dev/dev.log, che è un posto FISSO:
// non serve più ricordarsi quale task l'aveva avviato per andarne a leggere
// l'output.
//
// ── Perché non un pacchetto ──────────────────────────────────────────────────
// pm2, nodemon e compagnia fanno questo e altre cento cose, e sarebbero una
// dipendenza in più nel progetto per tenere in piedi UN processo in sviluppo.
// Qui bastano una spawn e un contatore.
//
//   node scripts/dev-stabile.mjs           avvia e sorveglia
//   node scripts/dev-stabile.mjs --stato   dice se risponde
//   node scripts/dev-stabile.mjs --stop    lo ferma
// ─────────────────────────────────────────────────────────────────────────────
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, appendFileSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RADICE = join(dirname(fileURLToPath(import.meta.url)), "..");
const TANA = join(RADICE, ".dev");
const LOG = join(TANA, "dev.log");
const PID = join(TANA, "dev.pid");
/** La porta in uso, scritta qui perché --stato e --stop sappiano dove guardare:
 *  se la 5173 era presa il server sta altrove, e cercarlo a indirizzo fisso
 *  vorrebbe dire non trovarlo mai. */
const PORTA_FILE = join(TANA, "dev.port");
const PORTA_PRIMA = 5173;
const PORTE_DA_PROVARE = 12;

/** La porta scritta dall'ultimo avvio, o la prima se non c'è nulla. */
function portaNota() {
  try {
    const n = Number(readFileSync(PORTA_FILE, "utf8").trim());
    return Number.isFinite(n) && n > 0 ? n : PORTA_PRIMA;
  } catch {
    return PORTA_PRIMA;
  }
}

/** Libera? Provo ad ascoltarci io: è l'unico modo onesto di saperlo — chiedere
 *  a chi ascolta se è occupato dà per scontato che risponda in HTTP, e un
 *  processo qualunque che tiene la porta non risponde affatto. */
function libera(porta) {
  return new Promise((risolvi) => {
    const s = createServer();
    s.once("error", () => risolvi(false));
    s.once("listening", () => s.close(() => risolvi(true)));
    s.listen(porta, "127.0.0.1");
  });
}

/** La prima porta libera a partire dalla 5173. */
async function scegliPorta() {
  for (let i = 0; i < PORTE_DA_PROVARE; i++) {
    const p = PORTA_PRIMA + i;
    if (await libera(p)) return p;
  }
  return null;
}

/** Quante volte lo riaccendo prima di arrendermi. Se cade cinque volte di fila
 *  in un minuto il guasto non è passeggero: è un errore che va letto, e
 *  riaccendere all'infinito lo nasconderebbe. */
const TENTATIVI = 5;
const FINESTRA = 60_000;

function nota(riga) {
  const ora = new Date().toTimeString().slice(0, 8);
  const testo = `[${ora}] ${riga}\n`;
  process.stdout.write(testo);
  try {
    appendFileSync(LOG, testo);
  } catch {
    /* il log è un lusso, non una condizione */
  }
}

async function risponde() {
  try {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), 1500);
    const r = await fetch(`http://localhost:${PORTA}/`, { signal: c.signal });
    clearTimeout(t);
    return r.ok;
  } catch {
    return false;
  }
}

// ── --stato ─────────────────────────────────────────────────────────────────
if (process.argv.includes("--stato")) {
  const vivo = await risponde();
  const pid = existsSync(PID) ? readFileSync(PID, "utf8").trim() : "—";
  console.log(vivo ? `in piedi su http://localhost:${PORTA}/ (pid ${pid})` : "non risponde");
  process.exit(vivo ? 0 : 1);
}

// ── --stop ──────────────────────────────────────────────────────────────────
// L'albero intero, non solo il sorvegliante.
//
// Il primo tentativo era un `process.kill(pid)` sul sorvegliante e basta, con
// l'idea che il suo handler di SIGTERM avrebbe portato giù Vite. Su Windows non
// succede: i segnali non esistono come su Unix, il processo viene terminato di
// netto e l'handler non gira mai. Misurato — dopo lo stop il sorvegliante era
// morto e Vite ancora in ascolto sulla 5173, orfano, cioè esattamente il guaio
// che questo script doveva togliere di mezzo.
//
// `taskkill /T` chiude il processo e tutti i suoi figli, che qui sono la shell,
// npm e vite. Con /F perché npm non se ne va con le buone.
if (process.argv.includes("--stop")) {
  const morti = [];

  if (existsSync(PID)) {
    const pid = Number(readFileSync(PID, "utf8").trim());
    const esito = spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], { encoding: "utf8" });
    if (esito.status === 0) morti.push(`sorvegliante ${pid} e i suoi figli`);
    rmSync(PID, { force: true });
  }

  // Cintura e bretelle: se un Vite era rimasto orfano da un giro precedente,
  // se ne va adesso. Senza, il prossimo avvio trova la porta occupata e Vite
  // scivola sulla 5174 — e chi guarda la 5173 continua a vedere roba vecchia,
  // che è il sintomo da cui è partita tutta questa storia.
  const elenco = spawnSync(
    "powershell",
    ["-NoProfile", "-Command", "Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" | Where-Object { $_.CommandLine -like '*vite*' } | Select-Object -ExpandProperty ProcessId"],
    { encoding: "utf8" },
  );
  for (const riga of (elenco.stdout || "").split(/\r?\n/)) {
    const pid = Number(riga.trim());
    if (!pid) continue;
    spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], { encoding: "utf8" });
    morti.push(`vite ${pid}`);
  }

  console.log(morti.length ? `fermato: ${morti.join(", ")}` : "non c'era niente da fermare");
  process.exit(0);
}

// ── Avvio e sorveglianza ────────────────────────────────────────────────────
if (!existsSync(TANA)) mkdirSync(TANA, { recursive: true });
writeFileSync(PID, String(process.pid));
writeFileSync(LOG, "");
nota(`sorvegliante avviato (pid ${process.pid})`);

let cadute = [];
let vite = null;
let fermando = false;

function accendi() {
  // Il comando è UNA stringa e non comando + array di argomenti: con
  // `shell: true` Node li concatenerebbe comunque in una riga sola, e da
  // Node 22 avvisa che è un modo di fare spazio alle iniezioni. Qui la riga non
  // ha pezzi che vengano da fuori — è scritta qua dentro e basta — ma un
  // avvertimento nel log di ogni avvio è un avvertimento che si smette di
  // leggere, e il log serve a vedere i guai veri.
  //
  // `shell: true` invece resta: su Windows `vite` è un .cmd, e senza shell
  // spawn non lo trova.
  vite = spawn("npm run dev", {
    cwd: RADICE,
    shell: true,
    stdio: ["ignore", "pipe", "pipe"],
  });

  const versa = (b) => {
    const t = b.toString();
    process.stdout.write(t);
    try {
      appendFileSync(LOG, t);
    } catch {
      /* idem */
    }
  };
  vite.stdout.on("data", versa);
  vite.stderr.on("data", versa);

  vite.on("exit", (code, segnale) => {
    if (fermando) return;
    nota(`vite è uscito (codice ${code ?? "—"}, segnale ${segnale ?? "—"})`);

    const adesso = Date.now();
    cadute = cadute.filter((t) => adesso - t < FINESTRA);
    cadute.push(adesso);

    if (cadute.length > TENTATIVI) {
      nota(`caduto ${cadute.length} volte in un minuto: mi fermo, il guasto non è passeggero`);
      rmSync(PID, { force: true });
      process.exit(1);
    }

    nota(`riaccendo fra un secondo (tentativo ${cadute.length} di ${TENTATIVI})`);
    setTimeout(accendi, 1000);
  });
}

// Ctrl-C e terminazione: porto giù anche Vite, se no resta orfano a tenere la
// porta occupata — che è il modo in cui ci si ritrova un 5173 che risponde ma
// non si sa di chi sia.
for (const s of ["SIGINT", "SIGTERM"]) {
  process.on(s, () => {
    fermando = true;
    nota("chiudo");
    if (vite) vite.kill();
    rmSync(PID, { force: true });
    process.exit(0);
  });
}

accendi();
