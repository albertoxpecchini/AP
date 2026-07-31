// Garantisce che il server Vite (:5173) sia attivo prima che F5 lanci il
// debugger su Edge. Se è già acceso (da una sessione F5 precedente) lo riusa
// invece di riavviarlo: con `strictPort: true` in vite.config.ts, un secondo
// `vite` sulla stessa porta fallirebbe subito con EADDRINUSE.
import { spawn } from 'node:child_process'
import path from 'node:path'
import os from 'node:os'
import fs from 'node:fs'

const URL = 'http://localhost:5173'
const TIMEOUT_MS = 30_000
const POLL_MS = 300
const LOG_PATH = path.join(os.tmpdir(), 'ap-vite-dev-server.log')

async function isUp() {
  try {
    const res = await fetch(URL, { signal: AbortSignal.timeout(1000) })
    return res.status < 500
  } catch {
    return false
  }
}

async function waitUntilUp(deadline) {
  while (Date.now() < deadline) {
    if (await isUp()) return true
    await new Promise((r) => setTimeout(r, POLL_MS))
  }
  return false
}

if (await isUp()) {
  console.log(`[dev-server] già attivo su ${URL}, riuso quello esistente.`)
  process.exit(0)
}

// vite.js viene lanciato direttamente con lo stesso node.exe che esegue questo
// script (process.execPath): niente npm/shell di mezzo, quindi niente
// problemi di PATH né di quoting su percorsi con spazi (es. "Program Files").
const viteBin = path.join(process.cwd(), 'node_modules', 'vite', 'bin', 'vite.js')
const logFd = fs.openSync(LOG_PATH, 'a')
console.log(`[dev-server] avvio Vite in background (log: ${LOG_PATH})...`)
spawn(process.execPath, [viteBin], {
  cwd: process.cwd(),
  detached: true,
  stdio: ['ignore', logFd, logFd],
  windowsHide: true,
}).unref()

if (await waitUntilUp(Date.now() + TIMEOUT_MS)) {
  console.log(`[dev-server] pronto su ${URL}`)
  process.exit(0)
} else {
  console.error(`[dev-server] Vite non ha risposto entro ${TIMEOUT_MS / 1000}s su ${URL}. Log: ${LOG_PATH}`)
  process.exit(1)
}
