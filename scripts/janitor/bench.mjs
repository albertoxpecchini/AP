// ── Il benchmark ─────────────────────────────────────────────────────────────
//
// Tre misure, perché "va più fluido" sono tre cose diverse:
//
//   · costruzione — quanto ci mette `npm run build` e quanto pesa quello che
//     esce (byte veri, e byte gzip: quelli che il visitatore scarica davvero).
//   · caricamento — LCP, blocchi del thread principale, nodi del DOM, memoria.
//   · fotogrammi  — un browser vero che scorre la pagina vera, contando i
//     fotogrammi uno per uno. È qui che si vede se i 60 fps ci sono o no.
//
// Ogni pagina si misura più volte e si tiene la MEDIANA: una sola passata su
// una macchina che nel frattempo fa altro racconta il rumore, non il sito.

import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import net from 'node:net'
import { spawn, execSync } from 'node:child_process'
import { apriBrowser, vai } from './cdp.mjs'
import { pesoCartella } from './analisi.mjs'

export const PAGINE_PREDEFINITE = ['/', '/archivio', '/mima', '/trivia']

const BUDGET_60 = 1000 / 60 // 16.67 ms: il tempo che ha un fotogramma a 60 Hz

const dormi = (ms) => new Promise((r) => setTimeout(r, ms))
const mediana = (v) => {
  if (!v.length) return 0
  const s = [...v].sort((a, b) => a - b)
  const m = s.length >> 1
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}
const percentile = (v, p) => {
  if (!v.length) return 0
  const s = [...v].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]
}

// ── Costruzione e peso ───────────────────────────────────────────────────────

export function misuraBuild(radice, { salta = false } = {}) {
  let ms = null
  if (!salta) {
    const t0 = Date.now()
    execSync('npm run build', { cwd: radice, stdio: 'pipe', encoding: 'utf8' })
    ms = Date.now() - t0
  }
  return { ms, ...misuraDist(radice) }
}

export function misuraDist(radice) {
  const dist = path.join(radice, 'dist')
  if (!fs.existsSync(dist)) return { totale: 0, gzJs: 0, gzCss: 0, chunk: [] }

  let totale = 0
  let gzJs = 0
  let gzCss = 0
  const chunk = []

  const cammina = (dir) => {
    for (const v of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, v.name)
      if (v.isDirectory()) { cammina(p); continue }
      const bytes = fs.statSync(p).size
      totale += bytes
      const est = path.extname(v.name)
      if (est === '.js' || est === '.css') {
        const gz = zlib.gzipSync(fs.readFileSync(p), { level: 9 }).length
        if (est === '.js') gzJs += gz
        else gzCss += gz
        chunk.push({ nome: path.relative(dist, p).replace(/\\/g, '/'), bytes, gz })
      }
    }
  }
  cammina(dist)
  chunk.sort((a, b) => b.gz - a.gz)
  return { totale, gzJs, gzCss, chunk: chunk.slice(0, 12) }
}

// ── Server di anteprima ──────────────────────────────────────────────────────

function portaLibera() {
  return new Promise((res, rej) => {
    const s = net.createServer()
    s.on('error', rej)
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address()
      s.close(() => res(port))
    })
  })
}

async function attendiPorta(porta, timeoutMs = 30000) {
  const scadenza = Date.now() + timeoutMs
  while (Date.now() < scadenza) {
    const ok = await new Promise((r) => {
      const s = net.connect(porta, '127.0.0.1')
      s.on('connect', () => { s.destroy(); r(true) })
      s.on('error', () => r(false))
    })
    if (ok) return true
    await dormi(200)
  }
  return false
}

export async function avviaAnteprima(radice) {
  const porta = await portaLibera()
  // Si misura la build, non il server di sviluppo: `vite preview` serve dist/
  // esattamente come farebbe un CDN, senza trasformazioni al volo.
  const proc = spawn(
    process.execPath,
    [path.join(radice, 'node_modules/vite/bin/vite.js'), 'preview',
     '--port', String(porta), '--strictPort', '--host', '127.0.0.1'],
    { cwd: radice, stdio: 'ignore' },
  )
  if (!(await attendiPorta(porta))) {
    proc.kill()
    throw new Error('il server di anteprima non è partito')
  }
  return { base: `http://127.0.0.1:${porta}`, ferma: () => { try { proc.kill() } catch {} } }
}

// ── La sonda che vive dentro la pagina ───────────────────────────────────────

// Installata PRIMA degli script del sito, così gli osservatori non perdono
// niente: LCP e blocchi lunghi succedono durante il caricamento, se si
// registrassero dopo sarebbero già passati.
const SONDA_INIZIALE = `
window.__bench = { blocchi: [], lcp: 0, cls: 0 };
try {
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) window.__bench.blocchi.push(e.duration);
  }).observe({ type: 'longtask', buffered: true });
} catch (e) {}
try {
  new PerformanceObserver((l) => {
    const e = l.getEntries();
    if (e.length) window.__bench.lcp = e[e.length - 1].startTime;
  }).observe({ type: 'largest-contentful-paint', buffered: true });
} catch (e) {}
try {
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) if (!e.hadRecentInput) window.__bench.cls += e.value;
  }).observe({ type: 'layout-shift', buffered: true });
} catch (e) {}
`

// Scorre la pagina tutta giù e tutta su, cronometrando ogni fotogramma.
// Lo scorrimento è guidato da dentro la pagina, non da fuori: un comando via
// WebSocket per ogni frame aggiungerebbe il ritardo della rete alla misura.
const SONDA_FOTOGRAMMI = (durataMs) => `(async () => {
  await new Promise(r => setTimeout(r, 700));           // lascia assestare il primo paint
  const fondo = () => Math.max(
    document.body.scrollHeight, document.documentElement.scrollHeight
  ) - window.innerHeight;
  const dt = [];
  let inizio = 0, ultimo = 0;
  await new Promise(fine => {
    function passo(ora) {
      if (!inizio) { inizio = ora; ultimo = ora; requestAnimationFrame(passo); return; }
      dt.push(ora - ultimo);
      ultimo = ora;
      const q = (ora - inizio) / ${durataMs};
      if (q >= 1) return fine();
      // Andata e ritorno: la risalita rivela le animazioni legate allo scroll
      // che si comportano diversamente nelle due direzioni.
      const c = q < 0.5 ? q * 2 : (1 - q) * 2;
      window.scrollTo(0, Math.round(fondo() * c));
      requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
  });
  window.scrollTo(0, 0);
  const m = performance.memory || {};
  return {
    dt: dt.slice(1),                                     // il primo delta è sporco
    nodi: document.getElementsByTagName('*').length,
    heap: m.usedJSHeapSize || 0,
    lcp: window.__bench.lcp,
    cls: window.__bench.cls,
    blocchi: window.__bench.blocchi,
  };
})()`

function riassumi(dt) {
  const n = dt.length
  if (!n) return { fps: 0, fpsMinimo: 0, dentroBudget: 0, frameLunghi: 0, peggiore: 0 }
  const totale = dt.reduce((a, b) => a + b, 0)
  return {
    fps: +(1000 / (totale / n)).toFixed(1),
    // L'1% peggiore: è il momento in cui l'occhio vede lo scatto. Un sito con
    // 60 fps medi e 12 fps nell'1% peggiore NON è fluido, e la media lo nasconde.
    fpsMinimo: +(1000 / percentile(dt, 99)).toFixed(1),
    dentroBudget: +((dt.filter((d) => d <= BUDGET_60 * 1.05).length / n) * 100).toFixed(1),
    frameLunghi: dt.filter((d) => d > 50).length,
    peggiore: +Math.max(...dt).toFixed(1),
  }
}

/**
 * `freno` è il rallentamento artificiale della CPU (1 = nessuno, 4 = quattro
 * volte più lenta). Serve per due ragioni.
 *
 * La prima è che senza freno la misura satura: il browser non disegna oltre una
 * certa cadenza (~160 fps qui), e una pagina vuota segna gli stessi fps di una
 * pagina piena. Tutto quello che costa meno di ~6ms a fotogramma finisce
 * appiattito sullo stesso numero, e un peggioramento del 50% resta invisibile
 * finché non sfonda quella soglia. Col freno il lavoro torna a dominare la
 * cadenza, e la misura ricomincia a distinguere.
 *
 * La seconda è che i 60 fps su questo computer non sono i 60 fps di chi apre il
 * sito dal telefono. Il freno 4× è la simulazione che usa anche Lighthouse per
 * un dispositivo di fascia media: è lì che si vede se il sito regge davvero.
 */
export async function misuraPagine(base, pagine, { headless = false, ripetizioni = 3, durataMs = 5000, freno = 1 } = {}) {
  const { sessione, chiudi } = await apriBrowser({ headless })
  const risultati = {}
  // ── La rete di sicurezza vera ──────────────────────────────────────────────
  // Se la pulizia porta via un file che serviva davvero, il sintomo non è un fps
  // più basso: è un 404. Qui si ascoltano le richieste fallite e gli errori in
  // console, e sono LORO a decidere se la pulizia si tiene o si annulla.
  let raccolta = { rotte: [], errori: [] }
  // ── Solo le richieste al NOSTRO server ────────────────────────────────────
  // Un file tolto per sbaglio può rompere una cosa sola: una richiesta a noi
  // stessi. Un errore su un host esterno non lo abbiamo causato noi e non si
  // ripara rimettendo a posto un file.
  //
  // Non è teoria: durante i collaudi l'API di GitHub — che il footer interroga
  // — ha iniziato a rispondere 403 per troppe chiamate, e il confronto ha
  // dichiarato «richieste rotte che prima non c'erano» su tre pagine. Nessun
  // file era stato messo da parte, quindi non si è annullato niente; ma con una
  // quarantena in corso quella pulizia sarebbe stata buttata via per colpa del
  // rate limit di un servizio esterno.
  const nostro = (url) => typeof url === 'string' && url.startsWith(base)
  const daFare = new Map() // requestId → url, perché loadingFailed non porta l'URL

  try {
    await sessione.invia('Network.enable')
    await sessione.invia('Runtime.enable')
    sessione.su('Network.requestWillBeSent', (p) => {
      daFare.set(p.requestId, p.request?.url)
      // La mappa non deve crescere all'infinito su una sessione lunga.
      if (daFare.size > 4000) daFare.delete(daFare.keys().next().value)
    })
    sessione.su('Network.loadingFailed', (p) => {
      const url = daFare.get(p.requestId)
      if (!nostro(url)) return
      let dove = url
      try { dove = new URL(url).pathname } catch {}
      raccolta.rotte.push(`richiesta fallita: ${dove} (${p.errorText})`)
    })
    sessione.su('Network.responseReceived', (p) => {
      if (p.response.status < 400) return
      if (!nostro(p.response.url)) return
      // Non tutte le URL sono indirizzi: data: e blob: farebbero saltare new URL().
      let dove = p.response.url
      try { dove = new URL(p.response.url).pathname } catch { dove = dove.slice(0, 80) }
      raccolta.rotte.push(`HTTP ${p.response.status} · ${dove}`)
    })
    sessione.su('Runtime.exceptionThrown', (p) => {
      const d = p.exceptionDetails
      raccolta.errori.push(d.exception?.description?.split('\n')[0] || d.text)
    })
    sessione.su('Runtime.consoleAPICalled', (p) => {
      if (p.type !== 'error') return
      raccolta.errori.push(p.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 200))
    })

    if (freno > 1) await sessione.invia('Emulation.setCPUThrottlingRate', { rate: freno })

    await sessione.invia('Page.addScriptToEvaluateOnNewDocument', { source: SONDA_INIZIALE })
    for (const pagina of pagine) {
      const passate = []
      raccolta = { rotte: [], errori: [] }
      for (let i = 0; i < ripetizioni; i++) {
        await vai(sessione, base + pagina)
        let dato
        try {
          dato = await sessione.valuta(SONDA_FOTOGRAMMI(durataMs))
        } catch (err) {
          risultati[pagina] = { errore: err.message }
          break
        }
        passate.push({ ...riassumi(dato.dt), nodi: dato.nodi, heap: dato.heap,
                       lcp: +dato.lcp.toFixed(0), cls: +dato.cls.toFixed(3),
                       blocchi: dato.blocchi.length,
                       bloccoPiuLungo: +Math.max(0, ...dato.blocchi).toFixed(0) })
      }
      if (!passate.length || risultati[pagina]?.errore) continue
      // Mediana campo per campo: una passata storta non trascina il verdetto.
      const med = (k) => +mediana(passate.map((p) => p[k])).toFixed(k === 'cls' ? 3 : 1)
      risultati[pagina] = {
        fps: med('fps'), fpsMinimo: med('fpsMinimo'), dentroBudget: med('dentroBudget'),
        frameLunghi: med('frameLunghi'), peggiore: med('peggiore'),
        nodi: med('nodi'), heap: med('heap'), lcp: med('lcp'), cls: med('cls'),
        blocchi: med('blocchi'), bloccoPiuLungo: med('bloccoPiuLungo'),
        passate: passate.length,
        rotte: [...new Set(raccolta.rotte)].slice(0, 10),
        errori: [...new Set(raccolta.errori)].slice(0, 10),
      }
    }
  } finally {
    await chiudi()
  }
  return risultati
}

export const FRENO = 4 // quante volte rallentare la CPU nella seconda passata

/**
 * Misura completa: costruisce, serve, misura due volte, spegne.
 *
 * Due passate perché rispondono a due domande diverse:
 *   · `pagine`  — a piena potenza: "su questo computer siamo a 60?"
 *   · `frenate` — con la CPU 4× più lenta: "e su un telefono? e se domani
 *                 qualcosa peggiora, me ne accorgo?"
 * È la seconda quella che regge il confronto nel tempo, perché è l'unica che
 * non satura.
 */
export async function misuraTutto(radice, {
  saltaBuild = false, headless = false, pagine = PAGINE_PREDEFINITE,
  ripetizioni = 3, durataMs = 5000,
} = {}) {
  const build = misuraBuild(radice, { salta: saltaBuild })
  const anteprima = await avviaAnteprima(radice)
  try {
    const piene = await misuraPagine(anteprima.base, pagine, { headless, ripetizioni, durataMs })
    const frenate = await misuraPagine(anteprima.base, pagine, { headless, ripetizioni, durataMs, freno: FRENO })
    return { quando: new Date().toISOString(), build, pagine: piene, frenate, freno: FRENO, headless }
  } finally {
    anteprima.ferma()
  }
}
