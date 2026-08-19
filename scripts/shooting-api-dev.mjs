// ── Le foto degli shooting, lato server ──────────────────────────────────────
//
// Tre indirizzi, e nessuno dei tre esiste in produzione:
//
//   /scatti-privati/manifesto.json   l'elenco vero — titoli, scatti, misure
//   /scatti-privati/w/<file>.webp    le versioni rimpicciolite (foto/shooting/.web/)
//   /scatti-privati/o/<cart>/<file>  l'originale, non ricodificato
//
// Stesso principio di scripts/janitor/api-dev.mjs: tutto vive dentro
// `configureServer`, l'aggancio che gira SOLO con `vite dev`. In `vite build`
// questo modulo non viene nemmeno chiamato, quindi sul sito pubblicato quelle
// tre rotte non sono "protette": non ci sono. E le immagini che servirebbero
// stanno in foto/, che è in .gitignore e non viene copiata in dist/ da niente.
//
// Restano due difese, perché una sola non basta mai:
//
//  ① i percorsi. Ogni nome che arriva dal browser passa da `dentro()`, che
//     risolve e pretende che il risultato stia sotto foto/shooting/. Senza,
//     un `/scatti-privati/o/../../../.env` sarebbe bastato.
//  ② l'indirizzo di chi chiede. `vite dev` normalmente ascolta solo su
//     localhost, ma basta un `--host` (o un tunnel) perché il server si affacci
//     sulla rete di casa. Qui le richieste che non arrivano dal loopback
//     ricevono 403, così anche quel caso è coperto.
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC_DIR = path.join(RADICE, 'foto', 'shooting')
const WEB_DIR = path.join(SRC_DIR, '.web')

const TIPI = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.heic': 'image/heic',
  '.heif': 'image/heif',
  '.tif': 'image/tiff',
  '.tiff': 'image/tiff',
}

/** Il file esiste ed è davvero dentro la cartella dichiarata? */
function dentro(base, relativo) {
  if (typeof relativo !== 'string' || !relativo) return null
  let pulito
  try {
    pulito = decodeURIComponent(relativo)
  } catch {
    return null
  }
  // I backslash di Windows e gli slash del browser sono la stessa cosa: se non
  // li si normalizza, un "..\\.." passerebbe indenne dal controllo qui sotto.
  pulito = pulito.replace(/\\/g, '/').replace(/^\/+/, '')
  if (pulito.includes('\0')) return null
  const assoluto = path.resolve(base, pulito)
  if (assoluto !== base && !assoluto.startsWith(base + path.sep)) return null
  return assoluto
}

/** Solo dal computer su cui gira il server. */
function daCasa(req) {
  const ip = req.socket?.remoteAddress ?? ''
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1'
}

function servi(res, file) {
  let st
  try {
    st = fs.statSync(file)
  } catch {
    res.statusCode = 404
    res.end('')
    return
  }
  if (!st.isFile()) {
    res.statusCode = 404
    res.end('')
    return
  }
  res.setHeader('Content-Type', TIPI[path.extname(file).toLowerCase()] ?? 'application/octet-stream')
  res.setHeader('Content-Length', st.size)
  // `private`: nessun proxy deve tenersene una copia. Un anno di validità è
  // sicuro perché il nome di ogni file rimpicciolito porta dentro l'impronta
  // della sorgente — cambiata la foto, cambia il nome.
  res.setHeader('Cache-Control', 'private, max-age=31536000, immutable')
  fs.createReadStream(file).pipe(res)
}

export function shootingDevApi() {
  return {
    name: 'shooting-dev-api',
    configureServer(server) {
      server.middlewares.use('/scatti-privati', (req, res, next) => {
        if (!daCasa(req)) {
          res.statusCode = 403
          res.end('Le foto degli shooting si vedono solo dal computer di casa.')
          return
        }

        const rotta = (req.url ?? '/').split('?')[0]

        // ── Il manifesto ────────────────────────────────────────────────────
        if (rotta === '/manifesto.json') {
          const f = path.join(WEB_DIR, 'manifesto.json')
          if (!fs.existsSync(f)) {
            res.statusCode = 404
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ errore: 'manifesto assente: lancia `npm run scatti`' }))
            return
          }
          res.setHeader('Content-Type', 'application/json')
          // Questo sì che deve essere sempre fresco: cambia a ogni `npm run scatti`.
          res.setHeader('Cache-Control', 'no-store')
          res.end(fs.readFileSync(f))
          return
        }

        // ── Una versione rimpicciolita ──────────────────────────────────────
        const web = rotta.match(/^\/w\/([^/]+)$/)
        if (web) {
          const file = dentro(WEB_DIR, web[1])
          if (!file || path.extname(file).toLowerCase() !== '.webp') {
            res.statusCode = 404
            res.end('')
            return
          }
          servi(res, file)
          return
        }

        // ── Un originale, come esce dalla macchina ──────────────────────────
        const orig = rotta.match(/^\/o\/([^/]+)\/([^/]+)$/)
        if (orig) {
          const cartella = dentro(SRC_DIR, orig[1])
          // La cartella .web non è una sessione: lì dentro non si entra da qui.
          if (!cartella || path.basename(cartella).startsWith('.')) {
            res.statusCode = 404
            res.end('')
            return
          }
          const file = dentro(cartella, orig[2])
          if (!file || !(path.extname(file).toLowerCase() in TIPI)) {
            res.statusCode = 404
            res.end('')
            return
          }
          servi(res, file)
          return
        }

        next()
      })
    },
  }
}
