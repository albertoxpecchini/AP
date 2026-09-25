// Plugin Vite: in sviluppo (`npm run dev`) serve le funzioni di api/ come fa
// Vercel, con le variabili di .env.local. Così /email/ ha l'IA anche in locale
// senza `vercel dev` — ed è l'unico modo di usare il fornitore «claude-code»,
// che lancia Claude Code su questo computer. In build non fa nulla.

import fs from 'node:fs'
import path from 'node:path'
import { loadEnv } from 'vite'

export default function apiDev() {
  return {
    name: 'api-dev',
    apply: 'serve',
    configureServer(server) {
      // Le variabili già presenti nell'ambiente vincono su quelle del file.
      const env = loadEnv(server.config.mode, server.config.root, '')
      for (const [key, value] of Object.entries(env)) if (!(key in process.env)) process.env[key] = value

      server.middlewares.use(async (req, res, next) => {
        const match = /^\/api\/([a-z0-9-]+)\/?(?:\?|$)/.exec(req.url || '')
        const file = match && path.resolve(server.config.root, 'api', `${match[1]}.js`)
        if (!file || !fs.existsSync(file)) return next()
        // Chiave di accesso di /email/: in locale la mette il server, così la
        // pagina non la chiede. Solo per richieste da questo computer e dalla
        // pagina stessa: un sito aperto in un'altra scheda (Sec-Fetch-Site
        // cross-site) resta senza chiave e riceve 401.
        const loopback = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress)
        const site = req.headers['sec-fetch-site']
        const sameOrigin = site ? site === 'same-origin' : !req.headers.origin
        if (loopback && sameOrigin && process.env.EMAIL_TOOL_KEY) req.headers['x-email-key'] = process.env.EMAIL_TOOL_KEY
        try {
          const mod = await server.ssrLoadModule(file)
          await mod.default(req, res)
        } catch (error) {
          next(error)
        }
      })
    },
  }
}
