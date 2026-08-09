// ── L'officina di /cleaning, lato server ─────────────────────────────────────
//
// Endpoint che leggono e scrivono file del repo e fanno commit. Detto così fa
// paura, ed è giusto che la faccia: sono esattamente le cose che non devono
// esistere su un sito pubblico.
//
// Non ci finiranno mai, e non per una svista evitata: questo modulo espone un
// plugin Vite che lavora solo dentro `configureServer`, l'aggancio che gira
// SOLO con `vite dev`. In `vite build` non viene nemmeno chiamato — non c'è un
// interruttore da ricordarsi di spegnere prima del deploy, non c'è una
// variabile d'ambiente da non sbagliare. Il codice non esiste proprio, di là.
//
// La seconda difesa è sui percorsi. Ogni path che arriva dal browser passa da
// `dentroIlRepo()`, che lo risolve e pretende che stia sotto la radice: senza,
// un `?p=../../../../Windows/System32/drivers/etc/hosts` sarebbe bastato. E
// .git, node_modules e i .env restano fuori comunque, perché nessuna pagina ha
// motivo di riscriverli.

import fs from 'node:fs'
import path from 'node:path'
import { execFile, spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { analizza, elenca, peso } from './analisi.mjs'
import { elencoQuarantene, ripristina } from './quarantena.mjs'

const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

// Cartelle che restano fuori comunque, anche se il percorso è formalmente
// dentro il repo: la storia di git, le dipendenze, i segreti.
const VIETATE = [/^\.git(\/|$)/, /^node_modules(\/|$)/, /^\.janitor(\/|$)/, /^\.env/, /(^|\/)\.env(\.|$)/]

// Si modificano file di testo. Un .pdf o un .webp riscritti come stringa UTF-8
// sarebbero corrotti in silenzio, e in un repo dove i PDF del CV pesano 300 kB
// l'errore si scoprirebbe solo aprendo il file.
const TESTO = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.css', '.html', '.json', '.md',
  '.txt', '.yml', '.yaml', '.sql', '.py', '.svg', '.webmanifest', '.cmd', '.ps1',
  '.gitignore', '.gitattributes', '',
])

function dentroIlRepo(relativo) {
  if (typeof relativo !== 'string' || !relativo) return null
  // I backslash di Windows e gli slash del browser devono diventare la stessa cosa.
  const pulito = relativo.replace(/\\/g, '/').replace(/^\/+/, '')
  const assoluto = path.resolve(RADICE, pulito)
  const dentro = assoluto === RADICE || assoluto.startsWith(RADICE + path.sep)
  if (!dentro) return null
  const rel = path.relative(RADICE, assoluto).replace(/\\/g, '/')
  if (VIETATE.some((re) => re.test(rel))) return null
  return { assoluto, rel }
}

const git = (argomenti) =>
  new Promise((res, rej) => {
    // execFile con gli argomenti in array: niente shell di mezzo, quindi un
    // messaggio di commit con dentro virgolette, `&&` o un apice non può
    // trasformarsi in un comando.
    execFile('git', argomenti, { cwd: RADICE, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 },
      (err, stdout, stderr) => (err && !stdout ? rej(new Error(stderr || err.message)) : res(stdout)))
  })

const json = (res, dato, codice = 200) => {
  res.statusCode = codice
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(dato))
}

function corpo(req) {
  return new Promise((res) => {
    let raw = ''
    req.on('data', (c) => { raw += c })
    req.on('end', () => {
      try { res(raw ? JSON.parse(raw) : {}) } catch { res({}) }
    })
  })
}

// ── Lo stato del repo, in una chiamata sola ──────────────────────────────────

async function statoGit() {
  const porcellana = await git(['status', '--porcelain=v1', '-uall'])
  const file = porcellana
    .split('\n')
    .filter(Boolean)
    .map((riga) => {
      const stato = riga.slice(0, 2)
      let percorso = riga.slice(3).trim()
      // I rinominati arrivano come "vecchio -> nuovo".
      if (percorso.includes(' -> ')) percorso = percorso.split(' -> ')[1]
      // git cita i percorsi con caratteri speciali: "src/app/città.tsx"
      if (percorso.startsWith('"') && percorso.endsWith('"')) {
        try { percorso = JSON.parse(percorso) } catch {}
      }
      return {
        percorso,
        stato: stato.trim(),
        inIndice: stato[0] !== ' ' && stato[0] !== '?',
        nuovo: stato === '??',
      }
    })
  const ramo = (await git(['rev-parse', '--abbrev-ref', 'HEAD'])).trim()
  let avanti = 0
  try {
    avanti = Number((await git(['rev-list', '--count', `origin/${ramo}..HEAD`])).trim()) || 0
  } catch { /* niente remoto */ }
  const ultimi = (await git(['log', '-5', '--format=%h%s%cr']))
    .split('\n').filter(Boolean)
    .map((r) => { const [hash, oggetto, quando] = r.split(''); return { hash, oggetto, quando } })
  return { ramo, file, avanti, ultimi }
}

// ── Lavori lunghi, raccontati mentre succedono ───────────────────────────────

const LAVORI = {
  // `--niente-bench` no: il benchmark è il motivo per cui ci si fida della
  // pulizia. Chi ha fretta usa il terminale.
  applica: [path.join(RADICE, 'scripts/janitor/pulisci.mjs'), '--applica', '--headless', '--ripetizioni', '2'],
  analisi: [path.join(RADICE, 'scripts/janitor/pulisci.mjs'), '--niente-bench'],
  bench: [path.join(RADICE, 'scripts/janitor/bench-cli.mjs'), '--headless', '--ripetizioni', '2'],
  prove: [path.join(RADICE, 'scripts/janitor/autotest.mjs')],
}

function eseguiInStreaming(res, quale) {
  const argomenti = LAVORI[quale]
  if (!argomenti) { json(res, { errore: 'lavoro sconosciuto' }, 400); return }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    // Senza questo, il proxy di Vite tiene in pancia lo stream e il log
    // arriverebbe tutto insieme alla fine — cioè quando non serve più.
    'X-Accel-Buffering': 'no',
  })

  const manda = (tipo, dato) => res.write(`event: ${tipo}\ndata: ${JSON.stringify(dato)}\n\n`)
  // Il comando per esteso, come lo si scriverebbe a mano: la pagina lo stampa
  // in cima alla consolle. Un bottone che nasconde cosa esegue è un bottone di
  // cui bisogna fidarsi; uno che lo dichiara si può controllare.
  const comando = ['node', ...argomenti.map((a) => a.replace(RADICE.replace(/\\/g, '/'), '.').replace(RADICE, '.'))]
    .join(' ').replace(/\\/g, '/')
  manda('inizio', { quale, comando, quando: new Date().toISOString() })

  const proc = spawn(process.execPath, argomenti, { cwd: RADICE })
  let coda = ''
  const pezzo = (buf) => {
    coda += buf.toString('utf8')
    const righe = coda.split('\n')
    coda = righe.pop() ?? ''
    for (const riga of righe) manda('riga', riga)
  }
  proc.stdout.on('data', pezzo)
  proc.stderr.on('data', pezzo)
  proc.on('close', (codice) => {
    if (coda) manda('riga', coda)
    manda('fine', { codice })
    res.end()
  })
  // Se si chiude la scheda a metà pulizia, il processo non deve restare a
  // girare per sempre in sottofondo.
  res.on('close', () => { try { proc.kill() } catch {} })
}

// ── Il plugin ────────────────────────────────────────────────────────────────

export function cleaningDevApi() {
  return {
    name: 'cleaning-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/cleaning', async (req, res) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        const rotta = url.pathname.replace(/\/+$/, '') || '/'
        try {
          // ── Stato generale ──────────────────────────────────────────────
          if (rotta === '/stato' && req.method === 'GET') {
            return json(res, {
              analisi: analizza(RADICE),
              git: await statoGit(),
              quarantene: elencoQuarantene(RADICE),
            })
          }

          // ── Il rendiconto dell'ultimo lavoro ────────────────────────────
          // Non lo ricalcola: lo legge da .janitor/ultimo.json, che pulisci.mjs
          // scrive alla fine di ogni esecuzione — anche di quelle lanciate dal
          // terminale. La pagina mostra quindi l'ultimo lavoro comunque sia
          // stato avviato, e il "prima e dopo" resta lì da guardare.
          if (rotta === '/ultimo' && req.method === 'GET') {
            const f = path.join(RADICE, '.janitor', 'ultimo.json')
            if (!fs.existsSync(f)) return json(res, { vuoto: true })
            try {
              return json(res, JSON.parse(fs.readFileSync(f, 'utf8')))
            } catch {
              return json(res, { vuoto: true })
            }
          }

          // ── Albero dei file ─────────────────────────────────────────────
          if (rotta === '/albero' && req.method === 'GET') {
            const file = elenca(RADICE)
              .filter((f) => !VIETATE.some((re) => re.test(f)))
              .map((f) => ({ percorso: f, bytes: peso(RADICE, f), testo: TESTO.has(path.extname(f)) }))
            return json(res, { file })
          }

          // ── Un file ─────────────────────────────────────────────────────
          if (rotta === '/file' && req.method === 'GET') {
            const dove = dentroIlRepo(url.searchParams.get('p') ?? '')
            if (!dove) return json(res, { errore: 'percorso fuori dal repo' }, 400)
            if (!fs.existsSync(dove.assoluto)) return json(res, { errore: 'non esiste' }, 404)
            if (!TESTO.has(path.extname(dove.rel))) return json(res, { errore: 'non è un file di testo' }, 415)
            return json(res, { percorso: dove.rel, testo: fs.readFileSync(dove.assoluto, 'utf8') })
          }

          if (rotta === '/file' && req.method === 'PUT') {
            const b = await corpo(req)
            const dove = dentroIlRepo(b.percorso ?? '')
            if (!dove) return json(res, { errore: 'percorso fuori dal repo' }, 400)
            if (!TESTO.has(path.extname(dove.rel))) return json(res, { errore: 'non è un file di testo' }, 415)
            if (typeof b.testo !== 'string') return json(res, { errore: 'niente da scrivere' }, 400)
            fs.writeFileSync(dove.assoluto, b.testo, 'utf8')
            return json(res, { ok: true, percorso: dove.rel, bytes: Buffer.byteLength(b.testo, 'utf8') })
          }

          // ── Diff ────────────────────────────────────────────────────────
          if (rotta === '/diff' && req.method === 'GET') {
            const p = url.searchParams.get('p')
            const dove = p ? dentroIlRepo(p) : null
            if (p && !dove) return json(res, { errore: 'percorso fuori dal repo' }, 400)
            const testo = dove
              ? await git(['diff', '--', dove.rel]).catch(() => '')
              : await git(['diff']).catch(() => '')
            return json(res, { diff: testo })
          }

          // ── Git ─────────────────────────────────────────────────────────
          if (rotta === '/commit' && req.method === 'POST') {
            const b = await corpo(req)
            const messaggio = String(b.messaggio ?? '').trim()
            if (!messaggio) return json(res, { errore: 'serve un messaggio' }, 400)
            const scelti = Array.isArray(b.file) ? b.file : []
            const dentro = scelti.map((f) => dentroIlRepo(f)).filter(Boolean).map((d) => d.rel)
            if (scelti.length && dentro.length !== scelti.length) {
              return json(res, { errore: 'qualche percorso è fuori dal repo' }, 400)
            }
            if (dentro.length) await git(['add', '--', ...dentro])
            else await git(['add', '-A'])

            const inScena = (await git(['diff', '--cached', '--name-only'])).trim()
            if (!inScena) return json(res, { errore: 'niente da committare' }, 400)

            await git(['commit', '-m', messaggio])
            return json(res, { ok: true, git: await statoGit() })
          }

          if (rotta === '/push' && req.method === 'POST') {
            const { ramo } = await statoGit()
            const uscita = await git(['push', 'origin', ramo])
            return json(res, { ok: true, uscita, git: await statoGit() })
          }

          // ── Quarantene ──────────────────────────────────────────────────
          if (rotta === '/ripristina' && req.method === 'POST') {
            const b = await corpo(req)
            const tutte = elencoQuarantene(RADICE)
            const etichetta = b.etichetta && b.etichetta !== 'ultima' ? b.etichetta : tutte[0]?.etichetta
            if (!etichetta) return json(res, { errore: 'nessuna quarantena' }, 404)
            // L'etichetta è un nome di cartella che arriva dal browser: se non è
            // una di quelle che conosciamo, non se ne fa niente.
            if (!tutte.some((q) => q.etichetta === etichetta)) {
              return json(res, { errore: 'quarantena sconosciuta' }, 400)
            }
            return json(res, { ok: true, ...ripristina(RADICE, etichetta) })
          }

          // ── Lavori lunghi ───────────────────────────────────────────────
          if (rotta === '/esegui' && req.method === 'GET') {
            return eseguiInStreaming(res, url.searchParams.get('cosa') ?? '')
          }

          return json(res, { errore: 'rotta sconosciuta' }, 404)
        } catch (err) {
          return json(res, { errore: err.message }, 500)
        }
      })
    },
  }
}
