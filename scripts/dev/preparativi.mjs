// ── Quello che va fatto PRIMA di accendere Vite ──────────────────────────────
//
// Tre cose, in ordine:
//
//  1. i controlli che decidono se ha senso partire (Node, node_modules);
//  2. gli artefatti rigenerabili che il codice si aspetta di trovare già lì
//     (versione di Trivia, pacchetti i18n) — ma solo se sono cambiati;
//  3. la diagnosi delle chiavi: quali endpoint /api/* funzioneranno davvero e
//     quali risponderanno a vuoto.
//
// Il punto 2 era il vecchio `predev` di package.json, e girava per intero a
// ogni avvio: due processi Node, git interrogato, 230 kB di JSON riscritti,
// anche quando non era cambiata una virgola. Qui si tiene un'impronta di cosa
// era già stato preparato (.dev/impronte.json) e si rifà solo il necessario.
// Non è solo velocità: build-trivia-version.mjs riscrive un file VERSIONATO,
// e rifarlo a vuoto sporca `git status` a ogni `npm run dev`.
//
// Il punto 3 esiste perché il modo peggiore di scoprire che manca una chiave è
// dalla pagina, con una lista vuota e nessuna spiegazione: i plugin in vite.config.ts
// leggono le env una volta sola, all'avvio, e poi tacciono. Meglio dirlo prima,
// in chiaro, sapendo che «manca» quasi sempre vuol dire «funziona in finta»,
// non «è rotto».

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import { OK, FORSE, NO, voce } from './tinte.mjs'
import { RADICE, DIR_DEV, assicuraCartelle } from './stato.mjs'

const FILE_IMPRONTE = path.join(DIR_DEV, 'impronte.json')
const LINGUE = ['it', 'en', 'fr', 'de']

const eta = (f) => {
  try {
    return fs.statSync(f).mtimeMs
  } catch {
    return 0
  }
}

// ─── Controlli di base ───────────────────────────────────────────────────────

/** Ritorna { fermi, avvisi }: se `fermi` non è vuoto, non si parte. */
export function controlli() {
  const fermi = []
  const avvisi = []

  const major = Number(process.versions.node.split('.')[0])
  if (major < 18) fermi.push(`Node ${process.versions.node}: Vite 6 ne vuole almeno 18 (meglio 20+).`)

  if (!fs.existsSync(path.join(RADICE, 'node_modules', 'vite'))) {
    fermi.push('node_modules incompleto (manca vite): lancia `npm install`.')
  } else {
    // Il lockfile toccato dopo l'ultima installazione vuol dire che qualcuno ha
    // cambiato le dipendenze — di solito un `git pull`. Vite parte lo stesso e
    // poi esplode su un import che non c'è: meglio dirlo adesso.
    const lock = eta(path.join(RADICE, 'package-lock.json'))
    const installato = eta(path.join(RADICE, 'node_modules', '.package-lock.json'))
    if (lock && installato && lock > installato + 1000) {
      avvisi.push('package-lock.json è più recente di node_modules: forse manca un `npm install`.')
    }
  }
  return { fermi, avvisi }
}

// ─── Artefatti rigenerabili ──────────────────────────────────────────────────

function leggiImpronte() {
  try {
    return JSON.parse(fs.readFileSync(FILE_IMPRONTE, 'utf8'))
  } catch {
    return {}
  }
}

function scriviImpronte(i) {
  assicuraCartelle()
  try {
    fs.writeFileSync(FILE_IMPRONTE, JSON.stringify(i, null, 2))
  } catch {
    /* l'impronta è una scorciatoia: senza, si rifà tutto ogni volta */
  }
}

function lancia(script) {
  const r = spawnSync(process.execPath, [path.join(RADICE, 'scripts', script)], {
    cwd: RADICE,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  })
  return { ok: r.status === 0, uscita: ((r.stdout || '') + (r.stderr || '')).trim() }
}

function git(args) {
  try {
    return execFileSync('git', args, { cwd: RADICE, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return ''
  }
}

function leggiVersione(f) {
  try {
    return 'v1.' + (JSON.parse(fs.readFileSync(f, 'utf8')).commits ?? 0)
  } catch {
    return 'v1.0'
  }
}

/** I pacchetti i18n, rifatti solo se translations.json si è mosso. */
export function preparaI18n({ sempre = false } = {}) {
  const impronte = leggiImpronte()
  const sorgente = path.join(RADICE, 'src/app/i18n/translations.json')
  const generati = LINGUE.map((l) => path.join(RADICE, 'src/app/i18n/generated', `${l}.json`))
  const impronta = String(eta(sorgente))
  const mancanti = generati.filter((f) => !fs.existsSync(f))

  if (!sempre && !mancanti.length && impronte.i18n === impronta) {
    return voce(OK(), 'pacchetti i18n', 'già a posto (translations.json non è cambiato)')
  }
  const r = lancia('build-i18n.mjs')
  if (r.ok) {
    impronte.i18n = impronta
    scriviImpronte(impronte)
    return voce(OK(), 'pacchetti i18n', mancanti.length ? 'generati (mancavano)' : 'rigenerati')
  }
  return voce(NO(), 'pacchetti i18n', 'errore: ' + (r.uscita.split('\n').pop() || 'sconosciuto'))
}

/** La versione di Trivia. L'impronta è HEAD: se non si muove, non può cambiare. */
export function preparaVersioneTrivia({ sempre = false } = {}) {
  const impronte = leggiImpronte()
  const versione = path.join(RADICE, 'src/app/trivia/version.json')
  const testa = git(['rev-parse', 'HEAD'])

  if (!sempre && fs.existsSync(versione) && testa && impronte.trivia === testa) {
    return voce(OK(), 'versione di Trivia', leggiVersione(versione) + ' (HEAD fermo)')
  }
  const r = lancia('build-trivia-version.mjs')
  if (r.ok) {
    if (testa) impronte.trivia = testa
    scriviImpronte(impronte)
    return voce(OK(), 'versione di Trivia', leggiVersione(versione))
  }
  return voce(NO(), 'versione di Trivia', 'errore: ' + (r.uscita.split('\n').pop() || 'sconosciuto'))
}

export function preparaArtefatti(opzioni = {}) {
  return [preparaI18n(opzioni), preparaVersioneTrivia(opzioni)]
}

// ─── Le chiavi: cosa funzionerà davvero ──────────────────────────────────────

/** Legge .env solo per sapere QUALI nomi ci sono. I valori non escono di qui. */
export function chiaviPresenti() {
  const nomi = new Set()
  for (const [k, v] of Object.entries(process.env)) if (v) nomi.add(k)
  try {
    const testo = fs.readFileSync(path.join(RADICE, '.env'), 'utf8')
    for (const riga of testo.split(/\r?\n/)) {
      const m = riga.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
      if (m && m[2].trim() !== '') nomi.add(m[1])
    }
  } catch {
    /* niente .env: tutto quello che dipende dalle chiavi girerà in finta */
  }
  return nomi
}

/**
 * Una riga per ogni pezzo che in locale può girare «vero» o «in finta».
 * Verde = come in produzione. Giallo = funziona, ma finge. Rosso = chiuso.
 */
export function diagnosi() {
  const k = chiaviPresenti()
  const ha = (...nomi) => nomi.every((n) => k.has(n))
  const righe = []

  righe.push(
    ha('VITE_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY')
      ? voce(OK(), 'scritture Supabase', 'sponsor, RSVP e richieste vanno sul database vero')
      : voce(FORSE(), 'scritture Supabase', 'magazzino finto in memoria (manca URL o service role)')
  )
  righe.push(
    ha('VITE_SUPABASE_ANON_KEY')
      ? voce(OK(), 'letture dal client', 'anon key presente')
      : voce(FORSE(), 'letture dal client', 'senza VITE_SUPABASE_ANON_KEY le liste pubbliche restano vuote')
  )
  righe.push(
    ha('RESEND_API_KEY')
      ? voce(OK(), 'email', 'spedite davvero: occhio a chi sta nel campo destinatario')
      : voce(FORSE(), 'email', 'non spedite: il contenuto si stampa in console')
  )
  righe.push(
    ha('SHOOTING_CODICE')
      ? voce(OK(), 'modulo /shooting', 'aperto con il codice del .env')
      : voce(NO(), 'modulo /shooting', 'senza SHOOTING_CODICE il modulo si chiude')
  )
  const manifesto = path.join(RADICE, 'foto', 'shooting', '.web', 'manifesto.json')
  righe.push(
    fs.existsSync(manifesto)
      ? voce(OK(), 'foto degli shooting', 'manifesto pronto: /scatti-privati serve le immagini')
      : voce(FORSE(), 'foto degli shooting', 'manifesto assente: lancia `npm run scatti`')
  )
  return righe
}

/** Gli indirizzi da stampare: locale e, se c'è, quello della rete di casa. */
export function indirizzi(porta) {
  const out = [`http://localhost:${porta}/`]
  try {
    for (const r of Object.values(os.networkInterfaces()).flat()) {
      if (r && r.family === 'IPv4' && !r.internal) out.push(`http://${r.address}:${porta}/`)
    }
  } catch {
    /* senza rete si vive lo stesso */
  }
  return out
}
