// ── La memoria del dev server ────────────────────────────────────────────────
//
// Un supervisore che riavvia Vite da solo ha bisogno di lasciare traccia di sé,
// perché non è l'unico a volerne sapere: `npm run dev:stato` chiede se è
// acceso, `npm run dev:ferma` lo spegne da un altro terminale, il tasto F5 di
// VS Code vuole sapere se deve accenderlo lui. Tutti guardano lo stesso file.
//
// .dev/ sta fuori dal repository (.gitignore). Dentro:
//   stato.json      chi è acceso adesso: pid del supervisore, pid di Vite, porta
//   impronte.json   cosa era già stato preparato l'ultima volta (vedi preparativi)
//   log/            l'uscita di Vite, un file per avvio, gli ultimi cinque
//
// La regola che tiene in piedi tutto: un pid scritto su un file è una promessa,
// non un fatto. Il processo può essere morto male (spegnimento, kill, blocco
// del PC) e quel numero può perfino essere stato riassegnato a un altro
// programma. Per questo `leggiStato` non si limita a leggere: controlla che il
// processo ci sia ancora, e se non c'è butta via il file da sé.

import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const WIN = process.platform === 'win32'

export const RADICE = path.resolve(fileURLToPath(new URL('../..', import.meta.url)))
export const DIR_DEV = path.join(RADICE, '.dev')
export const DIR_LOG = path.join(DIR_DEV, 'log')
const FILE_STATO = path.join(DIR_DEV, 'stato.json')

const LOG_DA_TENERE = 5

export function assicuraCartelle() {
  fs.mkdirSync(DIR_LOG, { recursive: true })
}

/** Il processo esiste ancora? Il segnale 0 non fa niente: chiede e basta. */
export function vivo(pid) {
  if (!pid) return false
  try {
    process.kill(pid, 0)
    return true
  } catch (e) {
    // EPERM = c'è, ma è di un altro utente: per noi «vivo» lo stesso.
    return e?.code === 'EPERM'
  }
}

/** Lo stato scritto sul disco, ma solo se descrive ancora la realtà. */
export function leggiStato() {
  try {
    const s = JSON.parse(fs.readFileSync(FILE_STATO, 'utf8'))
    if (vivo(s.pidSupervisore)) return s
    scordaStato() // supervisore morto: il file mentiva
    return null
  } catch {
    return null
  }
}

export function scriviStato(s) {
  assicuraCartelle()
  fs.writeFileSync(FILE_STATO, JSON.stringify(s, null, 2))
}

export function scordaStato() {
  try {
    fs.rmSync(FILE_STATO, { force: true })
  } catch {
    /* niente da dimenticare */
  }
}

/**
 * Ferma un processo E TUTTI I SUOI FIGLI.
 *
 * Il supervisore lancia Vite, e Vite a sua volta lancia roba (esbuild, il
 * worker di sharp quando serve). Uccidere solo il padre lascia in giro processi
 * che tengono ancora la porta: al giro dopo il dev server «non parte» e la
 * colpa sembra di Vite. Su Windows l'unico modo di prendere l'albero intero è
 * taskkill /T; su Unix si spara al gruppo (pid negativo), e chi ha lanciato il
 * figlio lo ha fatto con detached:true apposta per averne uno.
 */
export function uccidiAlbero(pid) {
  if (!vivo(pid)) return false
  try {
    if (WIN) {
      execFileSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' })
      return true
    }
    try {
      process.kill(-pid, 'SIGTERM')
    } catch {
      process.kill(pid, 'SIGTERM')
    }
    // Cortesia breve: chi non se ne va da solo, se ne va comunque.
    setTimeout(() => {
      try {
        if (vivo(pid)) process.kill(-pid, 'SIGKILL')
      } catch {
        /* già andato */
      }
    }, 2000).unref?.()
    return true
  } catch {
    return false
  }
}

/** Un file di log nuovo per ogni avvio, e i vecchi non si accumulano. */
export function apriLog() {
  assicuraCartelle()
  const ora = new Date()
  const stampa =
    ora.getFullYear() +
    String(ora.getMonth() + 1).padStart(2, '0') +
    String(ora.getDate()).padStart(2, '0') +
    '-' +
    String(ora.getHours()).padStart(2, '0') +
    String(ora.getMinutes()).padStart(2, '0') +
    String(ora.getSeconds()).padStart(2, '0')
  const file = path.join(DIR_LOG, `dev-${stampa}.log`)
  potaLog()
  return { file, flusso: fs.createWriteStream(file, { flags: 'a' }) }
}

function potaLog() {
  try {
    const vecchi = fs
      .readdirSync(DIR_LOG)
      .filter((f) => f.startsWith('dev-') && f.endsWith('.log'))
      .sort()
      .slice(0, -(LOG_DA_TENERE - 1))
    for (const f of vecchi) fs.rmSync(path.join(DIR_LOG, f), { force: true })
  } catch {
    /* la potatura è un lusso: se fallisce, si va avanti lo stesso */
  }
}

/** Il log dell'ultimo avvio (quello in corso, se c'è un dev server acceso). */
export function ultimoLog() {
  try {
    const f = fs
      .readdirSync(DIR_LOG)
      .filter((x) => x.startsWith('dev-') && x.endsWith('.log'))
      .sort()
      .pop()
    return f ? path.join(DIR_LOG, f) : null
  } catch {
    return null
  }
}

/** Le ultime N righe di un file, senza tirarselo tutto in memoria a occhio. */
export function coda(file, righe = 40) {
  try {
    const testo = fs.readFileSync(file, 'utf8').split(/\r?\n/)
    while (testo.length && testo[testo.length - 1] === '') testo.pop()
    return testo.slice(-righe)
  } catch {
    return []
  }
}
