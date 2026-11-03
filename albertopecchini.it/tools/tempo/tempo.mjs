// La macchina del tempo (/tempo/): ricostruisce i siti com'erano a ogni giorno di lavoro,
// li deposita interi per il server di casa e li fotografa. Dal 3.11.2026 i siti sono cinque
// (tools/tempo/siti.mjs): albertopecchini.it, rivaltasulmincio.it, cascinafontana.xyz,
// pzkko.it e bettercallpekko.it, con un selettore nella barra della pagina.
//
//   node tools/tempo/tempo.mjs                     tutti i siti: prima le versioni, poi le foto
//   node tools/tempo/tempo.mjs --sito=rivalta      un sito (anche più, separati da virgola)
//   node tools/tempo/tempo.mjs --fase=versioni     solo ricostruire e depositare (il «download» delle versioni)
//   node tools/tempo/tempo.mjs --fase=foto         solo le foto, dal deposito, come le vede il pubblico
//   node tools/tempo/tempo.mjs --forza             rifà anche quello che c'è già
//   node tools/tempo/tempo.mjs --solo=<sha>        una versione sola (anche più sha, separati da virgola)
//   node tools/tempo/tempo.mjs --da=2026-09-01     solo da quel giorno in poi
//   node tools/tempo/tempo.mjs --limite=5          al massimo cinque versioni per sito
//   node tools/tempo/tempo.mjs --manifesto         riscrive solo i manifesti (statistiche dei commit comprese)
//   node tools/tempo/tempo.mjs --corte             rifà le foto rimaste al primo schermo (alte 600 px)
//   node tools/tempo/tempo.mjs --ripassa           riapplica le regole del deposito (riscrittura, scudo,
//                                                  riservatezza) alle cartelle depositate, senza ricompilare
//   --deposito=<cartella>                          dove depositare (C:\pzkko-server\tempo se non si dice)
//
// Per ogni versione: `git archive` del commit nella cartella di lavoro del sito
// (lavoro/<id>/sito); poi, secondo com'era fatto il sito quel giorno:
//   build    package.json con lo script build: npm ci (o install), npm run build, la cartella dist
//   statico  niente build (o la build di allora non va più) ma un index.html: la cartella così com'è
//   server   un server Node di allora (Rivalta a maggio 2026: server.js con le parti incluse): lo si
//            accende e si raccolgono le pagine come fa la Wayback Machine, con Chromium
// Il deposito (C:\pzkko-server\tempo\versioni\…) riscrive gli indirizzi assoluti sulla versione,
// toglie quello che Alberto ha tolto per riservatezza (privato.mjs, sta nel deposito, fuori da
// GitHub) e mette lo scudo dell'archivio (sola lettura, niente service worker, il router delle
// app a pagina singola che crede di stare alla radice). Le foto si fanno dopo, tutte, dal
// deposito servito da server.mjs come dal tunnel: sono quello che vede il pubblico.
// I manifesti (src/data/tempo/<id>.js, GENERATI) hanno una riga per versione con le statistiche
// del giorno e, in `giorni`, i commit uno per uno: ogni cattura è una pagina statica leggera
// (/tempo/<dominio>/<AAAA-MM-GG>/) che li scrive già nell'HTML.

import { execSync, execFileSync, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, renameSync, readdirSync, statSync, createReadStream, copyFileSync, linkSync } from 'node:fs'
import http from 'node:http'
import net from 'node:net'
import { createRequire } from 'node:module'
import { dirname, join, resolve, extname, relative } from 'node:path'
import { pathToFileURL } from 'node:url'
import * as browser from '../pzkko/browser.mjs'
import { SITI, SITO, REPO, LAVORO, cartellaGit, prefisso, cartellaDeposito } from './siti.mjs'
import { stato as diretta, log as dlog } from './diretta.mjs'

const sharp = createRequire(join(SITO, 'tools/catture/package.json'))('sharp')
const MEDIA = join(SITO, 'public/media/tempo')
const MANIFESTI = join(SITO, 'src/data/tempo')

const argv = process.argv.slice(2)
const opt = (k) => (argv.find((a) => a.startsWith(`--${k}=`)) || '').split('=').slice(1).join('=')
const forza = argv.includes('--forza')
const solo = opt('solo') ? opt('solo').split(',') : null
const da = opt('da')
const limite = Number(opt('limite')) || Infinity
const fase = opt('fase') || 'tutto'
const deposito = resolve(opt('deposito') || 'C:\\pzkko-server\\tempo')
const scelti = opt('sito') ? opt('sito').split(',') : SITI.map((s) => s.id)
const siti = SITI.filter((s) => scelti.includes(s.id))

const dorm = (ms) => new Promise((r) => setTimeout(r, ms))
const hashOf = (file) => (existsSync(file) ? createHash('sha1').update(readFileSync(file)).digest('hex').slice(0, 12) : 'nessuno')
// l'errore in una riga che si legge nella pagina: quella con «Error:» se c'è, senza i colori del
// terminale e senza i percorsi del computer dove si ricostruisce (il 18.10.2026 BCP diceva
// «plugin: 'site-pages', · hook: 'closeBundle' · }» invece del file che mancava)
const errore = (e) => {
  const righe = String(e.stderr || e.message || e)
    .replace(/\x1b\[[0-9;]*m/g, '')
    .replace(/[A-Z]:[\\/](?:Users|Utenti)[\\/][^\s'"`]*?[\\/](?:sito|raccolta)[\\/](?:(?:albertopecchini|rivaltasulmincio)\.it[\\/])?/gi, '')
    .replace(/[A-Z]:[\\/](?:Users|Utenti)[\\/][^\s'"`]*/gi, '…')
    .split('\n')
    .map((r) => r.trim())
    .filter(Boolean)
  const chiave = righe.find((r) => /\b\w*Error:\s/.test(r)) || righe.find((r) => /ENOENT|Cannot find|not found|non risponde|failed/i.test(r))
  return (chiave || righe.slice(-3).join(' · ')).slice(0, 300)
}
const scriviAtomico = (f, testo) => {
  mkdirSync(dirname(f), { recursive: true })
  const tmp = `${f}.${process.pid}.tmp`
  writeFileSync(tmp, testo)
  renameSync(tmp, f)
}

// la riservatezza: le regole stanno nel deposito, fuori da GitHub (vedi privato.mjs lì)
const privatoFile = join(deposito, 'privato.mjs')
const privato = existsSync(privatoFile) ? (await import(pathToFileURL(privatoFile).href)).privato : (t) => t
if (!existsSync(privatoFile)) console.log(`attenzione: manca ${privatoFile}, le versioni si depositano senza togliere i dati riservati`)

// ── L'ora italiana ──────────────────────────────────────────────────────────

const FMT = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short', hourCycle: 'h23' })
const SETTIMANA = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }
function quando(ct) {
  const p = Object.fromEntries(FMT.formatToParts(new Date(ct * 1000)).map((x) => [x.type, x.value]))
  return { data: `${p.year}-${p.month}-${p.day}`, ora: `${p.hour}:${p.minute}`, h: Number(p.hour), dow: SETTIMANA[p.weekday] }
}
const giornoDopo = (iso) => {
  const d = new Date(iso + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

// ── La storia di un sito: i giorni e i commit, con le statistiche ───────────

// Niente nomi né indirizzi email di nessuno: dell'autore si guarda solo se era un
// assistente (Claude, Copilot, Codex), per contarli. Dai messaggi si tolgono indirizzi
// email, telefoni, percorsi del computer e quello che toglie privato.mjs.
function ripulisci(msg, s) {
  return privato(
    String(msg)
      .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '…@…')
      .replace(/(?:\+39\s?)?\b3\d{2}[\s.]?\d{3}[\s.]?\d{3,4}\b/g, '…')
      .replace(/[A-Z]:\\(?:Users|Utenti)\\[^\s'"]*/gi, '…')
      .replace(/\b[\w-]+\.tail[0-9a-f]+\.ts\.net\b/g, '…')
      .replace(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g, '…'),
    s.id,
  ).trim()
}

function assistente(nome, mail, corpo) {
  if (/co-authored-by:\s*claude/i.test(corpo) || /^claude/i.test(nome)) return 'claude'
  if (/copilot/i.test(nome + mail)) return 'copilot'
  if (/codex|chatgpt|openai/i.test(nome + mail)) return 'codex'
  return ''
}

function tipo(msg) {
  const m = msg.match(/^(feat|fix|chore|docs|style|refactor|perf|test|build|ci|revert)\b/i)
  if (m) return m[1].toLowerCase()
  if (/^merge\b/i.test(msg)) return 'merge'
  return 'altro'
}

function storia(s) {
  const git = (...a) => execFileSync('git', a, { cwd: cartellaGit(s), encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }).trim()
  const percorsi = ['--', ...s.percorsi]
  // i giorni: l'ultimo commit di ogni giorno sulla linea del sito
  const giorni = new Map()
  for (const r of git('log', ...s.linea, '--reverse', '--format=%H|%h|%ct|%s', ...percorsi).split('\n').filter(Boolean)) {
    const [sha, short, ct, ...resto] = r.split('|')
    const q = quando(Number(ct))
    if (s.da && q.data < s.da) continue
    const g = giorni.get(q.data) || { data: q.data }
    Object.assign(g, { sha, short, ora: q.ora, ct: Number(ct), msg: ripulisci(resto.join('|'), s) })
    giorni.set(q.data, g)
  }
  // con --all lo stesso giorno può avere commit su più rami: vince il più recente (il --reverse
  // di git log --all segue l'ordine dei rami, non quello del tempo)
  if (s.linea.includes('--all')) {
    const ultimi = new Map()
    for (const r of git('log', '--all', '--format=%H|%h|%ct|%s', ...percorsi).split('\n').filter(Boolean)) {
      const [sha, short, ct, ...resto] = r.split('|')
      const q = quando(Number(ct))
      if (s.da && q.data < s.da) continue
      const u = ultimi.get(q.data)
      if (!u || Number(ct) > u.ct) ultimi.set(q.data, { data: q.data, sha, short, ora: q.ora, ct: Number(ct), msg: ripulisci(resto.join('|'), s) })
    }
    for (const [d, u] of ultimi) giorni.set(d, u)
  }
  // i commit, uno per uno, con le righe e i file toccati
  const commit = []
  const raw = git('log', ...(s.tutti || s.linea), '--numstat', '--no-renames', '--format=%x1e%H%x1f%h%x1f%ct%x1f%an%x1f%ae%x1f%s%x1f%b%x1d', ...percorsi)
  for (const blocco of raw.split('\x1e').slice(1)) {
    const [testa, numstat = ''] = blocco.split('\x1d')
    const [sha, short, ct, nome, mail, sogg, corpo] = testa.split('\x1f')
    const q = quando(Number(ct))
    if (s.da && q.data < s.da) continue
    let piu = 0
    let meno = 0
    const file = []
    for (const riga of numstat.split('\n')) {
      const m = riga.match(/^(\d+|-)\t(\d+|-)\t(.+)$/)
      if (!m) continue
      if (m[1] !== '-') piu += Number(m[1])
      if (m[2] !== '-') meno += Number(m[2])
      let p = m[3]
      for (const c of s.cima) if (p.startsWith(c)) p = p.slice(c.length)
      file.push(p)
    }
    const msg = ripulisci(sogg, s)
    // i commit automatici (il workflow delle catture, firmato con l'account di Alberto: «Catture
    // aggiornate: …») contano nell'istogramma ma non sono momenti in cui Alberto lavorava
    const auto = /^Catture aggiornate\b/.test(sogg) || /github-actions|dependabot/i.test(nome)
    commit.push({ sha, short, ct: Number(ct), ...q, msg, piu, meno, file, tipo: tipo(msg), ai: auto ? '' : assistente(nome, mail, corpo), auto })
  }
  commit.sort((a, b) => a.ct - b.ct)
  return { giorni: [...giorni.values()].sort((a, b) => a.data.localeCompare(b.data)), commit }
}

// le statistiche di ogni giorno e i «momenti» di tutto il sito. I commit automatici contano
// nell'istogramma e nella lista del giorno; i momenti (orari, griglia, serie, notte) sono solo di Alberto
function statistiche(giorni, commit) {
  const raggruppa = (cs) => {
    const m = new Map()
    for (const c of cs) {
      if (!m.has(c.data)) m.set(c.data, [])
      m.get(c.data).push(c)
    }
    return m
  }
  const umani = commit.filter((c) => !c.auto)
  const perGiorno = raggruppa(commit)
  const suoi = raggruppa(umani)
  const attivi = [...suoi.keys()].sort()
  // le serie di giorni di fila con almeno un commit
  const serieDi = new Map()
  let serie = { n: 0, da: '', a: '' }
  let corrente = 0
  let inizio = ''
  attivi.forEach((d, i) => {
    corrente = i && giornoDopo(attivi[i - 1]) === d ? corrente + 1 : 1
    if (corrente === 1) inizio = d
    serieDi.set(d, corrente)
    if (corrente > serie.n) serie = { n: corrente, da: inizio, a: d }
  })
  const aree = (cs) => {
    const conto = new Map()
    for (const c of cs)
      for (const f of new Set(c.file.map((p) => p.split('/').slice(0, p.split('/').length > 2 ? 2 : 1).join('/')))) conto.set(f, (conto.get(f) || 0) + 1)
    return [...conto].sort((a, b) => b[1] - a[1]).slice(0, 4)
  }
  for (const g of giorni) {
    const cs = perGiorno.get(g.data) || []
    const miei = suoi.get(g.data) || []
    const tipi = {}
    for (const c of miei) tipi[c.tipo] = (tipi[c.tipo] || 0) + 1
    g.commit = cs.length || 1
    g.st = {
      ...(g.st?.sito ? { sito: g.st.sito } : {}),
      file: new Set(cs.flatMap((c) => c.file)).size,
      piu: cs.reduce((n, c) => n + c.piu, 0),
      meno: cs.reduce((n, c) => n + c.meno, 0),
      da: miei[0]?.ora || cs[0]?.ora || g.ora,
      a: miei.at(-1)?.ora || cs.at(-1)?.ora || g.ora,
      ore: miei.map((c) => c.h),
      tipi,
      ai: miei.filter((c) => c.ai).length,
      auto: cs.length - miei.length,
      aree: aree(cs),
      giorno: attivi.indexOf(g.data) + 1,
      serie: serieDi.get(g.data) || 0,
    }
  }
  const griglia = Array.from({ length: 7 }, () => Array(24).fill(0))
  for (const c of umani) griglia[c.dow][c.h]++
  const ore = Array(24).fill(0)
  umani.forEach((c) => ore[c.h]++)
  const settimana = griglia.map((r) => r.reduce((a, b) => a + b, 0))
  const intenso = attivi.map((d) => ({ data: d, commit: suoi.get(d).length })).sort((a, b) => b.commit - a.commit)[0] || null
  const lungo = attivi
    .map((d) => {
      const cs = suoi.get(d)
      return { data: d, da: cs[0].ora, a: cs.at(-1).ora, min: Math.round((cs.at(-1).ct - cs[0].ct) / 60) }
    })
    .sort((a, b) => b.min - a.min)[0] || null
  // «il più tardi»: il commit più vicino all'alba, fra mezzanotte e le sei; «il più presto»: il primo dopo le sei
  const minuti = (c) => c.h * 60 + Number(c.ora.slice(3))
  const notturni = umani.filter((c) => c.h < 6)
  const tardi = [...notturni].sort((a, b) => minuti(b) - minuti(a))[0]
  const presto = umani.filter((c) => c.h >= 6).sort((a, b) => minuti(a) - minuti(b))[0]
  const ai = { claude: 0, copilot: 0, codex: 0 }
  umani.forEach((c) => c.ai && ai[c.ai]++)
  const momenti = {
    commit: umani.length,
    auto: commit.length - umani.length,
    giorni: attivi.length,
    primo: attivi[0] || '',
    ultimo: attivi.at(-1) || '',
    piu: umani.reduce((n, c) => n + c.piu, 0),
    meno: umani.reduce((n, c) => n + c.meno, 0),
    griglia,
    ore,
    settimana,
    serie,
    intenso,
    lungo,
    notte: notturni.length,
    tardi: tardi ? { data: tardi.data, ora: tardi.ora } : null,
    presto: presto ? { data: presto.data, ora: presto.ora } : null,
    weekend: settimana[5] + settimana[6],
    ai,
    tipi: umani.reduce((t, c) => ((t[c.tipo] = (t[c.tipo] || 0) + 1), t), {}),
  }
  // i commit uno per uno, raggruppati per giorno, per il riquadro della pagina (caricato a richiesta)
  const dettaglio = {}
  for (const [d, cs] of perGiorno) dettaglio[d] = cs.map((c) => [c.ora, c.short, c.msg, c.piu, c.meno, c.file.length, c.tipo, c.ai, c.auto ? 1 : 0])
  return { momenti, dettaglio }
}

// ── I manifesti ─────────────────────────────────────────────────────────────

const fileManifesto = (s) => join(MANIFESTI, `${s.id}.js`)

function leggiManifesto(s) {
  const f = fileManifesto(s)
  if (existsSync(f)) {
    const m = readFileSync(f, 'utf8').match(/export default (\{[\s\S]*\})\s*$/)
    if (m) return JSON.parse(m[1]).versioni || []
  }
  // il manifesto di prima del 3.11.2026, quando il sito era uno solo
  const vecchio = join(SITO, 'src/data/tempo.js')
  if (s.id === 'ap' && existsSync(vecchio)) {
    const m = readFileSync(vecchio, 'utf8').match(/export const versioni = (\[[\s\S]*?\n\])/)
    if (m) return JSON.parse(m[1])
  }
  return []
}

function scriviManifesto(s, versioni, momenti, giorni = {}) {
  const ok = versioni.filter((v) => v.d).length
  const pulite = versioni.map(({ ct, ...v }) => v)
  const dati = { id: s.id, nome: s.nome, url: s.url, github: s.github, aggiornato: new Date().toISOString().slice(0, 10), momenti, versioni: pulite, giorni }
  scriviAtomico(
    fileManifesto(s),
    `// GENERATO da tools/tempo/tempo.mjs — non toccare a mano: le versioni di ${s.nome}, una per
// giorno di lavoro, con le statistiche dei commit e le foto in public/media/tempo/${s.id}/.
// ${ok} fotografate su ${versioni.length}. Rigenera con \`node tools/tempo/tempo.mjs --sito=${s.id}\` (tools/tempo/README.md).

export default ${JSON.stringify(dati)}
`,
  )
}

// ── Costruire una versione ──────────────────────────────────────────────────

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.avif': 'image/avif', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.mp4': 'video/mp4', '.webm': 'video/webm', '.ico': 'image/x-icon', '.txt': 'text/plain', '.xml': 'application/xml', '.pdf': 'application/pdf', '.glb': 'model/gltf-binary', '.wasm': 'application/wasm' }

const portaLibera = () =>
  new Promise((ok) => {
    const srv = net.createServer()
    srv.listen(0, '127.0.0.1', () => {
      const p = srv.address().port
      srv.close(() => ok(p))
    })
  })

class Lavoro {
  constructor(s) {
    this.s = s
    this.dir = join(LAVORO, s.id)
    this.casa = join(this.dir, 'sito')
    this.nm = join(this.dir, 'node_modules')
    this.ultimoLock = null
  }

  passo(v, passo) {
    this.corrente = { data: v.data, short: v.short, msg: v.msg.slice(0, 60), passo, da: this.corrente?.short === v.short ? this.corrente.da : Date.now() }
    this.aggiorna({}, false)
  }

  // le dipendenze sopravvivono fra una versione e l'altra: node_modules va in disparte e torna se il lock è lo stesso
  estrai(v) {
    this.passo(v, 'git archive')
    mkdirSync(this.dir, { recursive: true })
    if (existsSync(this.casa)) {
      for (const d of this.cartelleModuli()) {
        if (existsSync(d)) {
          if (existsSync(this.nm)) rmSync(this.nm, { recursive: true, force: true })
          renameSync(d, this.nm)
        }
      }
      rmSync(this.casa, { recursive: true, force: true })
    }
    mkdirSync(this.casa, { recursive: true })
    // percorsi relativi: il tar di Git legge «C:» come un host remoto
    execFileSync('git', ['archive', '--format=tar', '-o', join(this.dir, 'versione.tar'), v.sha], { cwd: cartellaGit(this.s) })
    execFileSync('tar', ['-xf', 'versione.tar', '-C', 'sito'], { cwd: this.dir })
    rmSync(join(this.dir, 'versione.tar'), { force: true })
    const dir = this.s.radice(this.casa)
    this.radice = dir
    if (existsSync(this.nm) && existsSync(join(dir, 'package.json'))) renameSync(this.nm, join(dir, 'node_modules'))
    return dir
  }

  cartelleModuli() {
    return [this.radice && join(this.radice, 'node_modules'), join(this.casa, 'albertopecchini.it/node_modules'), join(this.casa, 'rivaltasulmincio.it/node_modules'), join(this.casa, 'node_modules')].filter(Boolean)
  }

  dipendenze(v, dir) {
    const lock = join(dir, 'package-lock.json')
    const h = hashOf(lock) + ':' + hashOf(join(dir, 'package.json'))
    if (h === this.ultimoLock && existsSync(join(dir, 'node_modules'))) return
    const env = { ...process.env, CI: '1', HUSKY: '0', npm_config_audit: 'false', npm_config_fund: 'false' }
    const fai = (cmd) => execSync(cmd, { cwd: dir, stdio: ['ignore', 'ignore', 'pipe'], timeout: 15 * 60 * 1000, env })
    if (existsSync(lock)) {
      this.passo(v, 'npm ci')
      try {
        fai('npm ci --no-audit --no-fund --loglevel=error')
      } catch {
        // un lock di allora che non va più d'accordo col package.json: install, come avrebbe fatto Vercel
        this.passo(v, 'npm install')
        fai('npm install --no-audit --no-fund --loglevel=error --no-save')
      }
    } else {
      this.passo(v, 'npm install')
      fai('npm install --no-audit --no-fund --loglevel=error --package-lock=false')
    }
    this.ultimoLock = h
  }

  // → { tipo: 'build'|'statico'|'server', cartella, comando }
  prepara(v, dir) {
    const s = this.s
    if (typeof s.costruisci === 'function') {
      const c = s.costruisci(dir)
      if (!c) throw new Error('la cartella del sito non ha un index.html')
      return { tipo: 'statico', cartella: c }
    }
    const pkgFile = join(dir, 'package.json')
    const pkg = existsSync(pkgFile) ? JSON.parse(readFileSync(pkgFile, 'utf8')) : null
    const statica = () => {
      const idx = join(dir, 'index.html')
      // un index.html sorgente di Vite (<script type="module" src="/src/…">) non si serve così com'è
      if (existsSync(idx) && !/<script[^>]+src=["']\/?src\//.test(readFileSync(idx, 'utf8'))) return { tipo: 'statico', cartella: dir }
      return null
    }
    if (pkg?.scripts?.build) {
      try {
        this.dipendenze(v, dir)
        this.passo(v, 'build')
        const comando = 'npm run build'
        execSync(comando, { cwd: dir, stdio: ['ignore', 'ignore', 'pipe'], timeout: 15 * 60 * 1000, env: { ...process.env, CI: '1', NODE_ENV: 'production', BCP_STORE: 'memory', ...(s.env || {}) } })
        for (const d of ['dist', 'build', 'out', '_site', 'public/dist', '.output/public']) if (existsSync(join(dir, d, 'index.html'))) return { tipo: 'build', cartella: join(dir, d) }
        throw new Error('la build non ha lasciato una cartella con index.html')
      } catch (e) {
        const st = statica()
        if (st) return { ...st, nota: `build di allora fallita (${errore(e).slice(0, 120)}): servita la cartella così com'era` }
        throw e
      }
    }
    // un index.html vero in cima: il sito era quei file (Cascina ad aprile, «serve .»)
    const st = statica()
    if (st) return st
    // se no un server Node di allora (Rivalta a maggio: le pagine senza estensione e le parti incluse)
    const avvio = pkg?.scripts?.start?.match(/^node\s+([\w./-]+\.(?:c?js|mjs))\s*$/)?.[1] || (existsSync(join(dir, 'server.js')) ? 'server.js' : null)
    if (avvio && existsSync(join(dir, avvio))) {
      if (pkg && Object.keys({ ...pkg.dependencies }).length) this.dipendenze(v, dir)
      return { tipo: 'server', comando: avvio, cwd: dir }
    }
    throw new Error('niente da servire: né build, né server, né index.html')
  }

  aggiorna(extra = {}, subito = true) {
    Object.assign(this, extra)
    diretta(`sito-${this.s.id}`, { tipo: 'sito', id: this.s.id, nome: this.s.nome, ordine: this.s.ordine, fase: this.fase, totale: this.totale, fatte: this.fatte, ok: this.ok, errori: this.errori, tempi: this.tempi?.slice(-8), corrente: this.corrente, ultimo: this.ultimo, fine: this.fine, inizio: this.inizio }, { subito })
  }
}

// ── Il server di una versione e la raccolta delle pagine ────────────────────

// un server statico sulla cartella (le app a pagina singola rispondono con la home)
function serviStatico(dir) {
  const trova = (p) => {
    const pulito = decodeURIComponent(p.split('?')[0])
    for (const c of [pulito, pulito.replace(/\/$/, '') + '/index.html', pulito + '.html', pulito + '/index.html']) {
      const f = join(dir, c)
      if (existsSync(f) && statSync(f).isFile()) return f
    }
    return join(dir, 'index.html')
  }
  const server = http.createServer((req, res) => {
    const f = trova(req.url || '/')
    if (!existsSync(f)) return res.writeHead(404).end()
    res.setHeader('Content-Type', MIME[extname(f).toLowerCase()] || 'application/octet-stream')
    createReadStream(f).pipe(res)
  })
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok({ chiudi: () => server.close(), porta: server.address().port })))
}

// Si accende il server di allora sulla porta che gli si dà (PORT); a metà maggio 2026 quello di
// Rivalta aveva la porta scritta nel codice (2858): allora si usa quella che annuncia.
async function accendiServer(prep) {
  const porta = await portaLibera()
  const p = spawn(process.execPath, [prep.comando], { cwd: prep.cwd, env: { ...process.env, PORT: String(porta), NODE_ENV: 'production', HOST: '127.0.0.1' }, stdio: ['ignore', 'pipe', 'pipe'] })
  let detto = ''
  p.stdout.on('data', (b) => (detto += b))
  p.stderr.on('data', (b) => (detto += b))
  const risponde = (n) => new Promise((r) => http.get(`http://127.0.0.1:${n}/`, (res) => (res.resume(), r(res.statusCode < 500))).on('error', () => r(false)))
  for (let i = 0; i < 80; i++) {
    await dorm(250)
    const annunciata = Number((detto.match(/(?:localhost|127\.0\.0\.1|0\.0\.0\.0):(\d{2,5})/) || [])[1])
    for (const n of [porta, annunciata].filter(Boolean)) if (await risponde(n)) return { porta: n, chiudi: () => p.kill() }
    if (p.exitCode !== null) break
  }
  p.kill()
  throw new Error(`il server di allora (${prep.comando}) non risponde${detto.trim() ? ': ' + detto.trim().split('\n').slice(-2).join(' · ').slice(0, 160) : ''}`)
}

let chromium = null
async function apriBrowser() {
  // la GPU vera, come tools/pzkko/zero/prova.mjs: senza, la scena 3D della home di pzkko (dal 21.10.2026) usciva nera
  if (!chromium || !chromium.connected) chromium = await browser.puppeteer().launch({ executablePath: browser.eseguibile(), headless: true, protocolTimeout: 90000, args: ['--no-sandbox', '--hide-scrollbars', '--lang=it-IT', '--font-render-hinting=none', '--disable-features=PaintHolding', '--ignore-gpu-blocklist', '--enable-gpu', '--use-angle=d3d11', '--enable-unsafe-swiftshader'] })
  return chromium
}

// Raccoglie un sito servito da un server Node come fa la Wayback Machine: apre la home e le
// pagine a cui porta (al più 40), e salva ogni risposta dello stesso indirizzo nella cartella.
async function raccogli(porta, dest, lavoro, v) {
  const base = `http://127.0.0.1:${porta}`
  rmSync(dest, { recursive: true, force: true })
  mkdirSync(dest, { recursive: true })
  const b = await apriBrowser()
  const page = await b.newPage()
  const salvati = new Set()
  page.on('response', async (r) => {
    try {
      const u = new URL(r.url())
      if (u.origin !== base || r.request().method() !== 'GET' || r.status() !== 200) return
      const ct = r.headers()['content-type'] || ''
      let p = decodeURIComponent(u.pathname)
      if (ct.includes('text/html')) p = p.endsWith('/') ? p + 'index.html' : extname(p) ? p : p + '/index.html'
      else if (p.endsWith('/')) p += 'index'
      if (salvati.has(p)) return
      const corpo = await r.buffer()
      const f = join(dest, p)
      if (!f.startsWith(dest)) return
      mkdirSync(dirname(f), { recursive: true })
      writeFileSync(f, corpo)
      salvati.add(p)
    } catch {
      // una risposta senza corpo (redirect, cache): si va avanti
    }
  })
  const coda = ['/']
  const viste = new Set()
  while (coda.length && viste.size < 40) {
    const p = coda.shift()
    if (viste.has(p)) continue
    viste.add(p)
    lavoro.passo(v, `raccolgo ${viste.size}: ${p}`)
    await page.goto(base + p, { waitUntil: 'networkidle2', timeout: 45000 }).catch(() => {})
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight && y < 20000; y += 700) {
        scrollTo(0, y)
        await new Promise((r) => setTimeout(r, 40))
      }
    }).catch(() => {})
    await dorm(400)
    const link = await page.$$eval('a[href]', (as) => as.map((a) => a.href)).catch(() => [])
    for (const l of link) {
      try {
        const u = new URL(l)
        if (u.origin !== base) continue
        const q = u.pathname
        if (/\.(pdf|zip|jpe?g|png|webp|gif|mp4|svg|xml|txt)$/i.test(q) || /logout|login|reset|admin|dashboard|modifica|profile|write/i.test(q)) continue
        if (!viste.has(q) && !coda.includes(q)) coda.push(q)
      } catch {}
    }
  }
  await page.close()
  if (!existsSync(join(dest, 'index.html'))) throw new Error('la home del server di allora non si è salvata')
  // Quello che il browser chiede a pezzi (i video, risposta 206) o da sé (la favicon) non passa
  // dalle risposte intere: si cercano nelle pagine salvate gli indirizzi di file e si scaricano
  // direttamente quelli che mancano (Rivalta, maggio 2026: video/dove-siamo-1.mp4, favicon.png)
  const citati = new Set()
  const giro = (d) => {
    for (const nome of readdirSync(d)) {
      const f = join(d, nome)
      if (statSync(f).isDirectory()) giro(f)
      else if (/\.(html?|css)$/i.test(nome)) for (const m of readFileSync(f, 'utf8').matchAll(/(?:href|src|poster|content)=["'](\/[^"'#?\s]+\.[a-z0-9]{2,5})(?:[?#][^"']*)?["']|url\(\s*["']?(\/[^"')?#\s]+\.[a-z0-9]{2,5})/gi)) citati.add(m[1] || m[2])
    }
  }
  giro(dest)
  let presi = 0
  for (const p of citati) {
    let rel
    try {
      rel = decodeURIComponent(p)
    } catch {
      continue
    }
    const f = join(dest, rel)
    if (!f.startsWith(dest) || existsSync(f) || p.startsWith('//')) continue
    const corpo = await new Promise((ok) =>
      http
        .get(base + p, (res) => {
          if (res.statusCode !== 200 || Number(res.headers['content-length'] || 0) > 80 * 1024 * 1024) return res.resume(), ok(null)
          const pezzi = []
          res.on('data', (b) => pezzi.push(b))
          res.on('end', () => ok(Buffer.concat(pezzi)))
        })
        .on('error', () => ok(null)),
    )
    if (!corpo) continue
    mkdirSync(dirname(f), { recursive: true })
    writeFileSync(f, corpo)
    presi++
  }
  if (presi) dlog(`sito-${lavoro.s.id}`, `  raccolti a parte ${presi} file citati nelle pagine (video, icone)`)
  return dest
}

// ── Il deposito: il sito intero di una versione, coi percorsi riscritti ─────
// Come fa la Wayback Machine: gli indirizzi assoluti (/assets/…, /media/…, href="/")
// diventano /tempo/<sha>/… (o /tempo/<id>/<sha>/… per gli altri siti), così la pagina servita
// sotto quel prefisso trova le sue cose e i link restano dentro la versione. I file binari
// uguali fra le versioni (le immagini, i font) stanno una volta sola in store/<hash>.

const RISCRIVI = new Set(['.html', '.htm', '.css', '.js', '.mjs', '.webmanifest', '.json', '.xml', '.svg', '.txt'])
const SEGUE = '[A-Za-z0-9_.@%~-]' // dopo la barra deve venire un pezzo di percorso: «//cdn» e «/"» restano com'erano
const SCUDO = 'macchina del tempo: scudo v2'

// Lo scudo, in cima a ogni pagina (sostituisce quello di prima, «niente service worker»):
// - i service worker non possono funzionare nell'archivio (lo scope sarebbe la radice di un altro server)
// - sola lettura: niente POST, PUT, DELETE né moduli inviati, verso nessun server, di allora o di oggi
//   (i moduli di contatto, le iscrizioni, i database di Supabase e di Vercel Blob restano in pace)
// - le richieste costruite dal JS di allora a indirizzi assoluti dello stesso server finiscono
//   dentro la versione (dal tunnel la radice porta al server di pzkko)
const scudo = (P) =>
  `<script>/* ${SCUDO} */(function(){var P=${JSON.stringify(P)};try{var s=navigator.serviceWorker;if(s){s.register=function(){return Promise.resolve({})};s.getRegistrations&&s.getRegistrations().then(function(r){r.forEach(function(x){x.unregister()})})}}catch(e){}` +
  `function dentro(u){try{var x=new URL(u,location.href);if(x.origin!==location.origin||x.pathname.indexOf('/tempo/')===0)return u;return P+x.pathname+x.search+x.hash}catch(e){return u}}` +
  `var no=function(){return Promise.reject(new TypeError('macchina del tempo: archivio in sola lettura'))};` +
  `var f=window.fetch;if(f)window.fetch=function(i,o){var r=typeof Request!=='undefined'&&i instanceof Request;var m=String((o&&o.method)||(r&&i.method)||'GET').toUpperCase();if(m!=='GET'&&m!=='HEAD')return no();var u=r?i.url:String(i),d=dentro(u);if(d!==u)i=r?new Request(d,i):d;return f.call(this,i,o)};` +
  `try{var X=XMLHttpRequest.prototype,op=X.open,se=X.send;X.open=function(m,u){var a=[].slice.call(arguments);this.__tm=/^(GET|HEAD)$/i.test(m);a[1]=dentro(String(u));return op.apply(this,a)};X.send=function(){if(this.__tm===false){var x=this;setTimeout(function(){x.dispatchEvent(new Event('error'))});return}return se.apply(this,arguments)}}catch(e){}` +
  `if(navigator.sendBeacon)navigator.sendBeacon=function(){return true};` +
  `document.addEventListener('submit',function(e){e.preventDefault();e.stopImmediatePropagation()},true)})()</script>`

// Le app a pagina singola col router (React Router, dal 24.5 al 17.9.2026 anche albertopecchini.it)
// leggono l'indirizzo: sotto /tempo/<sha>/ non riconoscevano la home e mostravano la pagina «non
// trovata». Prima che parta l'app (gli script module partono a pagina letta), l'indirizzo perde il
// prefisso: l'app crede di stare alla radice, i file restano quelli della versione.
const RADICE = 'macchina del tempo: alla radice'
const allaRadice = (P) => `<script>/* ${RADICE} */(function(){var P=${JSON.stringify(P)},l=location;if(l.pathname.indexOf(P)===0)history.replaceState(history.state,'',(l.pathname.slice(P.length)||'/')+l.search+l.hash)})()</script>`

export function riscrivi(testo, ext, P, cima, { sito, spa = false } = {}) {
  const NON = '(?!' + P.slice(1).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '/)'
  const reUrl = new RegExp('url\\(\\s*(["\']?)\\/' + NON + '(?=' + SEGUE + ')', 'g')
  const PP = P.replace(/\$/g, '$$$$')
  let out = privato(testo, sito)
  if (ext === '.css') return out.replace(reUrl, `url($1${PP}/`)
  if (ext === '.txt') return out
  const reAttr = new RegExp('\\b(href|src|action|poster|data-src|xlink:href)=(["\'])\\/' + NON + '(?=' + SEGUE + '|\\2)', 'g')
  const reSrcset = new RegExp('(^\\s*|,\\s*)\\/' + NON + '(?=' + SEGUE + ')', 'g')
  const reStringa = new RegExp('(["\'`])\\/' + NON + '(' + SEGUE + '[^"\'`\\s]*)', 'g')
  // Le stringhe si riscrivono solo se puntano a qualcosa che c'è davvero nella versione: il
  // primo pezzo del percorso deve essere un file o una cartella in cima (assets, media…). Il
  // voto «8.5» col suffisso "/10" restava «8.5/10» (3.11.2026). /_vercel/ lo aggiungeva Vercel.
  const esiste = (resto) => {
    const primo = resto.split(/[/?#]/)[0]
    if (primo === '_vercel') return true
    try {
      return cima.has(decodeURIComponent(primo))
    } catch {
      return cima.has(primo)
    }
  }
  if (ext === '.html' || ext === '.htm' || ext === '.svg' || ext === '.xml') {
    out = out.replace(reAttr, `$1=$2${PP}/`)
    // <meta http-equiv="refresh" content="0; url=/main">: la home di Cascina ad aprile 2026
    // portava lì, e senza prefisso finiva fuori dall'archivio («Impossibile raggiungere la pagina»)
    out = out.replace(/<meta\b[^>]*>/gi, (tag) => (/refresh/i.test(tag) ? tag.replace(new RegExp('(url\\s*=\\s*[\'"]?)\\/' + NON + '(?!\\/)', 'i'), `$1${PP}/`) : tag))
    out = out.replace(/(srcset|imagesrcset)="([^"]*)"/g, (m, a, v) => `${a}="${v.replace(reSrcset, `$1${PP}/`)}"`)
  }
  if (ext === '.xml') return out
  out = out.replace(reStringa, (m, q, resto) => (esiste(resto) ? `${q}${P}/${resto}` : m))
  if (ext === '.html' || ext === '.htm') {
    // le liste di indirizzi negli attributi data-* (Better Call Pekko: data-cam-walkers="/media/…,/media/…"):
    // il primo lo prende la regola delle stringhe, quelli dopo la virgola no
    out = out.replace(/\b(data-[\w-]+)="([^"]*,[^"]*)"/g, (m, a, val) => `${a}="${val.replace(/(,\s*)\/(?!\/)([^,\s"]*)/g, (mm, sep, resto) => (esiste(resto) && !resto.startsWith(P.slice(1) + '/') ? `${sep}${P}/${resto}` : mm))}"`)
  }
  if (ext !== '.json' && ext !== '.webmanifest') out = out.replace(reUrl, `url($1${PP}/`)
  if (ext === '.js' || ext === '.mjs' || ext === '.html' || ext === '.htm') {
    // L'aiutante di Vite che carica i pezzi a richiesta costruisce l'indirizzo al volo:
    // function(t){return"/"+t}. Senza il prefisso, dal tunnel i pezzi mancavano (965daa2)
    // (con qualunque apice: Vite 8 con rolldown scrive function(e){return`/`+e}, e Rivalta
    // del 23.9.2026 chiedeva i pezzi fuori dall'archivio)
    out = out.replace(/function\((\w+)\)\{return(["'`])\/\2\+\1\}/g, (m, a, q) => `function(${a}){return${q}${P}/${q}+${a}}`)
    out = out.replace(/\((\w+)\)=>(["'`])\/\2\+\1(?=[,;)}\s])/g, (m, a, q) => `(${a})=>${q}${P}/${q}+${a}`)
    out = out.replace(/\b(\w+)=>(["'`])\/\2\+\1(?=[,;)}\s])/g, (m, a, q) => `${a}=>${q}${P}/${q}+${a}`)
  }
  if (ext === '.html' || ext === '.htm') {
    // via lo scudo di prima (o una copia vecchia di questo), poi quello nuovo in cima
    out = out.replace(/<script>\/\* macchina del tempo: (?:niente service worker|scudo v\d+) \*\/[\s\S]*?<\/script>/g, '')
    const s = scudo(P)
    out = /<head[^>]*>/i.test(out) ? out.replace(/<head[^>]*>/i, (h) => h + s) : s + out
    out = out.replace(new RegExp(`<script>/\\* ${RADICE} \\*/[\\s\\S]*?</script>`, 'g'), '')
    if (spa) out = /<\/body>/i.test(out) ? out.replace(/<\/body>/i, allaRadice(P) + '</body>') : out + allaRadice(P)
  }
  return out
}

// quanto pesa il sito di quel giorno: pagine, JS, CSS, immagini (KB)
function misura(dir) {
  const m = { pagine: 0, kb: 0, js: 0, css: 0, img: 0, font: 0, file: 0 }
  const giro = (d) => {
    for (const nome of readdirSync(d)) {
      const f = join(d, nome)
      const st = statSync(f)
      if (st.isDirectory()) {
        if (nome !== 'node_modules' && !nome.startsWith('.')) giro(f)
        continue
      }
      const ext = extname(nome).toLowerCase()
      m.file++
      m.kb += st.size
      if (ext === '.html' || ext === '.htm') m.pagine++
      else if (ext === '.js' || ext === '.mjs') m.js += st.size
      else if (ext === '.css') m.css += st.size
      else if (/\.(png|jpe?g|webp|avif|gif|svg|ico)$/.test(ext)) m.img += st.size
      else if (/\.(woff2?|ttf|otf)$/.test(ext)) m.font += st.size
    }
  }
  giro(dir)
  for (const k of ['kb', 'js', 'css', 'img', 'font']) m[k] = Math.round(m[k] / 1024)
  return m
}

// i file di lavoro che non sono il sito (servendo la cartella così com'era)
// (i documenti e gli script a qualunque profondità: in Cascina di aprile documentazione/README.md
// aveva ancora l'indirizzo, e i .md non passano dalla riservatezza)
const NON_DEPOSITARE = (nome, rel, s) => nome === 'node_modules' || (nome.startsWith('.') && nome !== '.well-known') || /\.(md|sql|ps1|sh|bat|lock|env)$/i.test(nome) || (!rel.includes('/') && (/^package(-lock)?\.json$|^tsconfig.*\.json$|^server\.js$/i.test(nome) || s.escludi?.includes(nome)))

// pulisci: la cartella è il sorgente servito così com'era (non una dist, non una raccolta dal
// server di allora, dove anche /node_modules/… era una pagina servita: Rivalta, maggio 2026)
function deposita(s, dist, short, spa, pulisci) {
  const dest = cartellaDeposito(deposito, s, short)
  const store = join(deposito, 'store')
  mkdirSync(store, { recursive: true })
  rmSync(dest, { recursive: true, force: true })
  const P = prefisso(s, short)
  const cima = new Set(readdirSync(dist))
  let n = 0
  let byte = 0
  const giro = (dir, rel) => {
    for (const nome of readdirSync(dir)) {
      const f = join(dir, nome)
      const r = rel ? `${rel}/${nome}` : nome
      // i documenti (.md) non li carica nessuna pagina e non passano dalla riservatezza: fuori sempre
      if (pulisci ? NON_DEPOSITARE(nome, r, s) : (nome.startsWith('.') && nome !== '.well-known') || /\.(md|sql|env)$/i.test(nome)) continue
      const st = statSync(f)
      if (st.isDirectory()) {
        mkdirSync(join(dest, r), { recursive: true })
        giro(f, r)
        continue
      }
      const ext = extname(nome).toLowerCase()
      mkdirSync(dirname(join(dest, r)), { recursive: true })
      if (RISCRIVI.has(ext) && st.size < 12 * 1024 * 1024) {
        const t = riscrivi(readFileSync(f, 'utf8'), ext, P, cima, { sito: s.id, spa })
        writeFileSync(join(dest, r), t)
        byte += Buffer.byteLength(t)
      } else {
        // binario: nello store una volta sola, e un collegamento fisico qui
        const h = createHash('sha1').update(readFileSync(f)).digest('hex')
        const inStore = join(store, h.slice(0, 2), h + ext)
        if (!existsSync(inStore)) {
          mkdirSync(dirname(inStore), { recursive: true })
          // più siti depositano insieme: si copia accanto e si rinomina, mai mezzo file nello store
          const tmp = `${inStore}.${process.pid}.tmp`
          copyFileSync(f, tmp)
          try {
            renameSync(tmp, inStore)
          } catch {
            rmSync(tmp, { force: true })
          }
          byte += st.size
        }
        try {
          linkSync(inStore, join(dest, r))
        } catch {
          copyFileSync(inStore, join(dest, r))
        }
      }
      n++
    }
  }
  giro(dist, '')
  if (!existsSync(join(dest, 'index.html'))) throw new Error('il deposito è rimasto senza index.html')
  return { file: n, kb: Math.round(byte / 1024) }
}

// il sito di quel giorno ha un router (React Router & c.)? lo si legge dal package.json di allora
function haRouter(s, sha) {
  for (const p of ['package.json', 'albertopecchini.it/package.json', 'rivaltasulmincio.it/package.json']) {
    try {
      const j = JSON.parse(execFileSync('git', ['show', `${sha}:${p}`], { cwd: cartellaGit(s), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }))
      const dip = { ...j.dependencies, ...j.devDependencies }
      if (s.id === 'bcp' || s.id === 'pzkko') return false
      return ['react-router', 'react-router-dom', 'vue-router', '@tanstack/react-router', 'wouter'].some((k) => dip[k])
    } catch {}
  }
  return false
}

function ripassa(s, short, sha) {
  const dest = cartellaDeposito(deposito, s, short)
  if (!existsSync(join(dest, 'index.html'))) return null
  const cima = new Set(readdirSync(dest))
  const spa = haRouter(s, sha)
  let cambiati = 0
  const giro = (dir) => {
    for (const nome of readdirSync(dir)) {
      const f = join(dir, nome)
      if (statSync(f).isDirectory()) {
        giro(f)
        continue
      }
      const ext = extname(nome).toLowerCase()
      if (!RISCRIVI.has(ext)) continue
      const prima = readFileSync(f, 'utf8')
      const dopo = riscrivi(prima, ext, prefisso(s, short), cima, { sito: s.id, spa })
      if (dopo !== prima) {
        // un collegamento fisico (un .svg o un .txt depositato prima come binario) non si
        // scrive dentro: si stacca, così lo store resta com'era
        rmSync(f)
        writeFileSync(f, dopo)
        cambiati++
      }
    }
  }
  giro(dest)
  return cambiati
}

// le versioni pronte sono le cartelle depositate, non l'elenco dei giorni di adesso
function depositate(s) {
  const base = s.id === 'ap' ? join(deposito, 'versioni') : join(deposito, 'versioni', s.id)
  return existsSync(base) ? readdirSync(base).filter((x) => /^[0-9a-f]{7,40}$/.test(x) && existsSync(join(base, x, 'index.html'))) : []
}

function statoDeposito() {
  const perSito = Object.fromEntries(SITI.map((s) => [s.id, depositate(s)]))
  // `versioni` resta quella di albertopecchini.it: la pagina pubblicata prima del 3.11.2026 legge quella
  scriviAtomico(join(deposito, 'stato.json'), JSON.stringify({ aggiornato: new Date().toISOString(), versioni: perSito.ap, siti: perSito }, null, 1))
}

// ── Le foto, dal deposito, come le vede il pubblico ─────────────────────────

async function serverArchivio() {
  const porta = await portaLibera()
  const p = spawn(process.execPath, [join(deposito, 'server.mjs')], { env: { ...process.env, TEMPO_PORTA: String(porta) }, stdio: 'ignore' })
  for (let i = 0; i < 40; i++) {
    await dorm(200)
    const ok = await new Promise((r) => http.get(`http://127.0.0.1:${porta}/stato.json`, (res) => (res.resume(), r(res.statusCode === 200))).on('error', () => r(false)))
    if (ok) return { base: `http://127.0.0.1:${porta}`, chiudi: () => p.kill() }
  }
  p.kill()
  throw new Error('il server dell’archivio non parte')
}

async function fotografa(s, v, base, lavoro) {
  const b = await apriBrowser()
  const page = await b.newPage()
  const origine = new URL(base).origin
  await page.setRequestInterception(true)
  page.on('request', (r) => {
    const u = new URL(r.url())
    // come dal tunnel: dello stesso indirizzo esiste solo /tempo/…
    if (u.origin === origine && !u.pathname.startsWith('/tempo/')) return r.abort()
    r.continue()
  })
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  const url = `${base}${prefisso(s, v.short)}/`
  const out = join(MEDIA, s.id)
  mkdirSync(out, { recursive: true })
  const scatta = async (w, h, dpr, larghezza, nome, anteprima) => {
    lavoro.passo(v, `foto ${w} px`)
    await page.setViewport({ width: w, height: h, deviceScaleFactor: dpr, isMobile: w < 600, hasTouch: w < 600 })
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {})
    await page
      .evaluate(async () => {
        const dorm = (ms) => new Promise((r) => setTimeout(r, ms))
        await (document.fonts?.ready || Promise.resolve())
        // Dal 14.6 al 17.9.2026 albertopecchini.it scorreva dentro il body: si fa scorrere chi scorre davvero
        const scorre = (e) => e.scrollHeight > e.clientHeight + 50 && /(auto|scroll)/.test(getComputedStyle(e).overflowY)
        const contenitori = [...document.querySelectorAll('html, body, body > *, #root, #app, main')].filter(scorre)
        const tutti = [document.scrollingElement || document.documentElement, ...contenitori]
        // giù piano: le immagini pigre si caricano e le animazioni all'ingresso partono
        for (const el of tutti) {
          for (let y = 0; y < el.scrollHeight && y < 30000; y += 500) {
            el.scrollTop = y
            await dorm(90)
          }
          el.scrollTop = 0
        }
        if (contenitori.length) {
          const s = document.createElement('style')
          s.textContent = 'html, body { height: auto !important; min-height: 0 !important; max-height: none !important; overflow: visible !important; }'
          document.head.append(s)
          for (const el of contenitori) Object.assign(el.style, { height: 'auto', maxHeight: 'none', overflow: 'visible' })
        }
        // le immagini pigre che non sono partite: si caricano subito
        document.querySelectorAll('img[loading="lazy"]').forEach((i) => (i.loading = 'eager'))
        await Promise.race([Promise.all([...document.images].filter((i) => !i.complete).map((i) => new Promise((r) => ((i.onload = i.onerror = r))))), dorm(6000)])
        // animazioni e transizioni al loro stato finale, niente a metà dissolvenza nella foto
        const ferma = document.createElement('style')
        ferma.textContent = '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; transition-delay: 0s !important; caret-color: transparent !important; }'
        document.head.append(ferma)
        // via i pannelli che coprirebbero la pagina: cookie, modali di benvenuto, chat
        document.querySelectorAll('[class*="cookie" i], [id*="cookie" i], [class*="consent" i], [id*="consent" i], [aria-modal="true"], dialog[open]').forEach((el) => (el.style.display = 'none'))
        for (const el of document.querySelectorAll('body *')) {
          const cs = getComputedStyle(el)
          if (cs.position === 'fixed' && el.getBoundingClientRect().height > innerHeight * 0.6 && Number(cs.zIndex) > 10) el.style.display = 'none'
        }
        window.scrollTo(0, 0)
      })
      .catch(() => {})
    // una scena WebGL a tutta finestra (pzkko dal 21.10.2026): qualche secondo in più perché si
    // disegni, e la foto della sola finestra: «oltre la finestra» con una tela che si ridisegna
    // di continuo non finiva mai (Page.captureScreenshot timed out)
    const { alto, scena } = await page.evaluate(() => ({ alto: document.documentElement.scrollHeight, scena: [...document.querySelectorAll('canvas')].some((c) => c.getBoundingClientRect().width * c.getBoundingClientRect().height > innerWidth * innerHeight * 0.5) })).catch(() => ({ alto: 0, scena: false }))
    await dorm(scena ? 4000 : 1200)
    const titolo = await page.title().catch(() => '')
    const tutta = alto > h + 10 && !scena
    const png = await page.screenshot({ fullPage: tutta, captureBeyondViewport: tutta })
    const img = sharp(png).resize({ width: larghezza, withoutEnlargement: true })
    const meta = await img.clone().toBuffer({ resolveWithObject: true })
    const H = Math.min(meta.info.height, 6000)
    await img.extract({ left: 0, top: 0, width: meta.info.width, height: H }).webp({ quality: 66, effort: 5 }).toFile(join(out, nome))
    if (anteprima) {
      // l'anteprima per l'istogramma: il primo schermo, piccolo
      const pm = await sharp(png).metadata()
      await sharp(png).extract({ left: 0, top: 0, width: pm.width, height: Math.min(pm.height, Math.round((pm.width * h) / w)) }).resize({ width: 320 }).webp({ quality: 70 }).toFile(join(out, `${v.short}-t.webp`))
    }
    return { w: meta.info.width, h: H, titolo }
  }
  try {
    const d = await scatta(1280, 800, 1, 960, `${v.short}-d.webp`, true)
    const m = await scatta(390, 844, 2, 390, `${v.short}-m.webp`, false)
    return { d: { w: d.w, h: d.h }, m: { w: m.w, h: m.h }, titolo: d.titolo || m.titolo }
  } finally {
    await page.close().catch(() => {})
  }
}

// ── Il giro di un sito ──────────────────────────────────────────────────────

async function giroSito(s) {
  const lavoro = new Lavoro(s)
  lavoro.aggiorna({ fase: 'leggo la storia', totale: 0, fatte: 0, ok: 0, errori: 0, tempi: [], inizio: Date.now() })
  const { giorni, commit } = storia(s)
  const fatte = new Map(leggiManifesto(s).map((v) => [v.sha, v]))
  const versioni = giorni.map((g) => ({ ...(fatte.get(g.sha) || {}), ...g }))
  versioni.forEach((v, i) => (v.n = i + 1))
  const { momenti, dettaglio } = statistiche(versioni, commit)
  // le foto che ci sono sul disco ma non nel manifesto (un giro interrotto)
  for (const v of versioni) {
    if (v.d) continue
    const fd = join(MEDIA, s.id, `${v.short}-d.webp`)
    const fm = join(MEDIA, s.id, `${v.short}-m.webp`)
    if (existsSync(fd) && existsSync(fm)) {
      const [a, b] = await Promise.all([sharp(fd).metadata(), sharp(fm).metadata()])
      Object.assign(v, { d: { w: a.width, h: a.height }, m: { w: b.width, h: b.height } })
    }
  }
  const salva = () => {
    scriviManifesto(s, versioni, momenti, dettaglio)
    statoDeposito()
  }
  salva()
  dlog(`sito-${s.id}`, `${s.nome}: ${versioni.length} giorni di lavoro, ${commit.length} commit dal ${momenti.primo}`)

  if (argv.includes('--manifesto')) {
    lavoro.aggiorna({ fase: 'manifesto', totale: versioni.length, fatte: versioni.length, ok: versioni.filter((v) => v.d).length, fine: true })
    return
  }

  if (argv.includes('--ripassa')) {
    let tot = 0
    // tutte le cartelle depositate, anche quelle che non sono più l'ultimo commit del loro giorno
    // (il «giorno di oggi» cambia a ogni commit, e bc7ba74 restava servita con le regole di prima)
    const perShort = new Map(versioni.map((v) => [v.short, v]))
    const lista = depositate(s)
      .map((short) => perShort.get(short) || { short, sha: short, data: '', msg: '(non più nell’elenco)' })
      .filter((v) => !solo || solo.some((x) => v.sha.startsWith(x)))
    lavoro.aggiorna({ fase: 'ripasso', totale: lista.length, fatte: 0 })
    for (const v of lista) {
      lavoro.passo(v, 'ripasso')
      const n = ripassa(s, v.short, v.sha)
      tot += n || 0
      if (n) dlog(`sito-${s.id}`, `${v.short}: ${n} file riscritti`)
      lavoro.aggiorna({ fatte: lavoro.fatte + 1, ok: lavoro.ok + 1 })
    }
    salva()
    lavoro.aggiorna({ fine: true, corrente: null, ultimo: `ripassate: ${tot} file cambiati` })
    dlog(`sito-${s.id}`, `√ ripassate le versioni depositate di ${s.nome}: ${tot} file cambiati`)
    return
  }

  const scelta = (v) => (solo ? solo.some((x) => v.sha.startsWith(x) || v.short === x) : true) && (!da || v.data >= da)

  // 1. le versioni: ricostruire e depositare
  if (fase === 'tutto' || fase === 'versioni') {
    const pronte = new Set(depositate(s))
    const daFare = versioni.filter((v) => scelta(v) && (forza || !pronte.has(v.short))).slice(0, limite)
    lavoro.aggiorna({ fase: 'versioni', totale: daFare.length, fatte: 0, ok: 0, errori: 0, tempi: [], fine: false })
    dlog(`sito-${s.id}`, `${s.nome}: ${daFare.length} versioni da ricostruire e depositare`)
    for (const v of daFare) {
      const inizio = Date.now()
      let chiudi = null
      try {
        const dir = lavoro.estrai(v)
        const prep = lavoro.prepara(v, dir)
        let cartella = prep.cartella
        if (prep.tipo === 'server') {
          lavoro.passo(v, `accendo ${prep.comando}`)
          const srv = await accendiServer(prep)
          chiudi = srv.chiudi
          cartella = await raccogli(srv.porta, join(lavoro.dir, 'raccolta'), lavoro, v)
        }
        lavoro.passo(v, 'deposito')
        const spa = haRouter(s, v.sha)
        const d = deposita(s, cartella, v.short, spa, prep.tipo === 'statico')
        v.st = { ...v.st, sito: { ...misura(cartella), tipo: prep.tipo, build: Math.round((Date.now() - inizio) / 1000) } }
        delete v.errore
        if (prep.nota) v.nota = prep.nota
        else delete v.nota
        lavoro.aggiorna({ ok: lavoro.ok + 1 })
        dlog(`sito-${s.id}`, `√ ${v.data} ${v.short} ${prep.tipo}${spa ? ' (router)' : ''}: ${d.file} file, ${d.kb} KB nuovi, ${Math.round((Date.now() - inizio) / 1000)} s${prep.nota ? ' · ' + prep.nota : ''}`)
      } catch (e) {
        v.errore = errore(e)
        lavoro.aggiorna({ errori: lavoro.errori + 1 })
        dlog(`sito-${s.id}`, `× ${v.data} ${v.short}: ${v.errore}`)
      } finally {
        if (chiudi) chiudi()
      }
      lavoro.tempi.push((Date.now() - inizio) / 1000)
      lavoro.aggiorna({ fatte: lavoro.fatte + 1, ultimo: `ultima: ${v.data} ${v.short}` })
      salva()
    }
  }

  // 2. le foto, dal deposito
  if (fase === 'tutto' || fase === 'foto') {
    const pronte = new Set(depositate(s))
    const corte = argv.includes('--corte')
    const daFare = versioni.filter((v) => scelta(v) && pronte.has(v.short) && (forza || !v.d || !v.foto2 || (corte && v.d.h <= 620))).slice(0, limite)
    lavoro.aggiorna({ fase: 'foto', totale: daFare.length, fatte: 0, ok: 0, errori: 0, tempi: [], fine: false })
    dlog(`sito-${s.id}`, `${s.nome}: ${daFare.length} versioni da fotografare`)
    if (daFare.length) {
      const arch = await serverArchivio()
      try {
        for (const v of daFare) {
          const inizio = Date.now()
          try {
            const foto = await fotografa(s, v, arch.base, lavoro)
            Object.assign(v, foto, { foto2: 1 })
            lavoro.aggiorna({ ok: lavoro.ok + 1 })
            dlog(`sito-${s.id}`, `√ foto ${v.data} ${v.short}: ${foto.d.w}×${foto.d.h} · ${foto.m.w}×${foto.m.h} · «${foto.titolo.slice(0, 60)}»`)
          } catch (e) {
            lavoro.aggiorna({ errori: lavoro.errori + 1 })
            dlog(`sito-${s.id}`, `× foto ${v.data} ${v.short}: ${errore(e)}`)
            if (/Target closed|Session closed|Protocol error|disconnected/i.test(String(e))) chromium = null
          }
          lavoro.tempi.push((Date.now() - inizio) / 1000)
          lavoro.aggiorna({ fatte: lavoro.fatte + 1, ultimo: `ultima: ${v.data} ${v.short}` })
          salva()
        }
      } finally {
        arch.chiudi()
      }
    }
  }
  salva()
  lavoro.aggiorna({ fine: true, corrente: null })
  dlog(`sito-${s.id}`, `√ ${s.nome}: finito (${versioni.filter((v) => v.d).length} foto su ${versioni.length} versioni)`)
}

for (const s of siti) {
  try {
    await giroSito(s)
  } catch (e) {
    dlog(`sito-${s.id}`, `× ${s.nome}: ${errore(e)}`)
    console.error(e)
    process.exitCode = 1
  }
}
if (chromium) await chromium.close().catch(() => {})
