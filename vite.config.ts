import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import { execSync } from 'child_process'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

// Versione del gioco Trivia = 1.<numero di commit che toccano src/app/trivia/>.
// Calcolata a build-time (anche in dev) così si aggiorna da sola ad ogni deploy.
// Se git non è disponibile (es. ambiente di build esotico) ripiega su 1.0.
function triviaVersion(): string {
  try {
    const n = execSync('git rev-list --count HEAD -- src/app/trivia/', {
      encoding: 'utf8',
    }).trim()
    return `1.${n || '0'}`
  } catch {
    return '1.0'
  }
}


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id): string | undefined {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

function triviaDevApi() {
  return {
    name: 'trivia-dev-api',
    configureServer(server: any) {
      const env = loadEnv(server.config.mode, process.cwd(), '')
      const apiKey = env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY

      server.middlewares.use('/api/trivia', async (req: any, res: any) => {
        if (!apiKey) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY mancante nel file .env' }))
          return
        }
        const { Anthropic } = await import('@anthropic-ai/sdk')
        const client = new Anthropic({ apiKey })
        const url = new URL(req.url, 'http://localhost')
        const word = url.searchParams.get('word') ?? ''
        if (word.length < 3) { res.statusCode = 400; res.end('{}'); return }
        try {
          const msg = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 150,
            messages: [{ role: 'user', content: `Genera una breve curiosità o fatto interessante sulla parola italiana "${word.toUpperCase()}" in 1-2 frasi. Scrivi direttamente il fatto senza premesse.` }],
          })
          const text = msg.content[0].type === 'text' ? msg.content[0].text : ''
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ word, trivia: text.trim() }))
        } catch (err: any) {
          console.error('[trivia]', err?.message)
          res.statusCode = 500
          res.end('{}')
        }
      })
    },
  }
}

// Festa · /api/notify in sviluppo: invia l'email del voto via Resend (stesso
// helper della funzione serverless), così l'invito si testa end-to-end in locale.
// Senza RESEND_API_KEY non invia, ma logga il voto in console.
function festaNotifyDevApi() {
  return {
    name: 'festa-notify-dev-api',
    configureServer(server: any) {
      const env = loadEnv(server.config.mode, process.cwd(), '')
      if (env.RESEND_API_KEY && !process.env.RESEND_API_KEY) {
        process.env.RESEND_API_KEY = env.RESEND_API_KEY
      }

      server.middlewares.use('/api/notify', async (req: any, res: any) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end('{}'); return }
        let raw = ''
        req.on('data', (c: any) => { raw += c })
        req.on('end', async () => {
          let body: any = {}
          try { body = JSON.parse(raw || '{}') } catch {}
          const valid = ['pomeriggio', 'sera', 'no']
          const nome = typeof body.nome === 'string' ? body.nome.trim() : ''
          if (!nome || !valid.includes(body.presenza)) {
            res.statusCode = 400; res.end(JSON.stringify({ error: 'Payload non valido' })); return
          }
          const giorno = (body.giorno === '27' || body.giorno === '28') ? body.giorno : '27'
          const payload = { nome: nome.slice(0, 40), presenza: body.presenza, giorno, cibo: body.cibo ?? null }
          if (!process.env.RESEND_API_KEY) {
            console.log('[festa] voto (no RESEND_API_KEY, email saltata):', payload)
            res.statusCode = 200; res.end(JSON.stringify({ ok: true, skipped: true })); return
          }
          const { sendVoteEmail } = await import('./api/notify')
          const { collectDiagnostics } = await import('./lib/serverSecurity')
          const { html: diagHtml } = collectDiagnostics(req)
          const result = await sendVoteEmail(payload, diagHtml)
          if (!result.ok) {
            console.error('[festa] invio email fallito:', result.status, result.detail)
            res.statusCode = result.status; res.end(JSON.stringify({ error: result.detail })); return
          }
          console.log('[festa] email inviata per:', payload.nome)
          res.statusCode = 200; res.end(JSON.stringify({ ok: true }))
        })
      })
    },
  }
}

// Contatore confronti in sviluppo: stesso endpoint della funzione serverless
// (/api/ig-stats). Legge le env Supabase da .env così funziona anche in locale.
function igStatsDevApi() {
  return {
    name: "ig-stats-dev-api",
    configureServer(server: any) {
      const env = loadEnv(server.config.mode, process.cwd(), "");
      for (const k of ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]) {
        if (env[k] && !process.env[k]) process.env[k] = env[k];
      }
      server.middlewares.use("/api/ig-stats", async (req: any, res: any) => {
        try {
          const { readCount, incrementCount } = await import("./api/ig-stats");
          res.setHeader("Content-Type", "application/json");
          if (req.method === "GET") { res.end(JSON.stringify({ count: await readCount() })); return; }
          if (req.method === "POST") { res.end(JSON.stringify({ count: await incrementCount() })); return; }
          res.statusCode = 405; res.end("{}");
        } catch {
          res.statusCode = 500; res.end("{}");
        }
      });
    },
  };
}

// Scritture blindate in sviluppo (sponsor, RSVP festa): stessi endpoint delle
// funzioni serverless, così si testano anche con `vite dev`. Leggono le env
// Supabase da .env. Body JSON letto a mano (in dev non c'è il parser di Vercel).
function writeDevApi(route: string, importer: () => Promise<{ insert: (b: any) => Promise<any> }>) {
  return {
    name: `write-dev-api:${route}`,
    configureServer(server: any) {
      const env = loadEnv(server.config.mode, process.cwd(), "");
      for (const k of ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]) {
        if (env[k] && !process.env[k]) process.env[k] = env[k];
      }
      server.middlewares.use(route, async (req: any, res: any) => {
        res.setHeader("Content-Type", "application/json");
        if (req.method !== "POST") { res.statusCode = 405; res.end('{"error":"Method not allowed"}'); return; }
        let raw = "";
        req.on("data", (c: any) => { raw += c; });
        req.on("end", async () => {
          try {
            const body = raw ? JSON.parse(raw) : {};
            const out = await (await importer()).insert(body);
            if (!out.ok) { res.statusCode = out.status; res.end(JSON.stringify({ error: out.error })); return; }
            res.end(JSON.stringify(out.row));
          } catch {
            res.statusCode = 500; res.end('{"error":"dev"}');
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    triviaDevApi(),
    festaNotifyDevApi(),
    igStatsDevApi(),
    writeDevApi("/api/sponsor", async () => ({ insert: (await import("./api/sponsor")).insertDonatore })),
    writeDevApi("/api/festa-rsvp", async () => ({ insert: (await import("./api/festa-rsvp")).insertPresenza })),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    // Service worker: precache dell'app-shell (JS/CSS/HTML/font) + cache delle
    // immagini man mano che si visitano. Al secondo accesso il sito parte dalla
    // cache locale → istantaneo, e funziona anche offline.
    // `autoUpdate`: ad ogni nuovo deploy il SW si aggiorna in background e
    // prende il controllo subito, così non si resta su versioni vecchie.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: false, // usiamo già /public/site.webmanifest
      includeAssets: [],
      workbox: {
        // Precache: solo app-shell e font (stabili). Le immagini NO, per non
        // appesantire il primo accesso: entrano in cache quando vengono viste.
        globPatterns: ['**/*.{js,css,html,woff2}'],
        // three.js + Vanta servono SOLO a /sostieni: fuori dal precache, così non
        // appesantiscono il primo accesso di chi non visita quella pagina. Vengono
        // messi in cache "al volo" la prima volta che si apre /sostieni (sotto).
        globIgnores: ['**/three.module-*.js', '**/vanta.waves.min-*.js'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: '/index.html',
        // Le rotte SPA non hanno estensione → prendono il fallback a index.html.
        // I file statici (PDF, ZIP, immagini…) NO: senza questa denylist il SW
        // servirebbe index.html anche per una navigazione verso un .pdf (iframe o
        // nuova scheda = mode "navigate"), facendo comparire la home al posto del
        // documento. Escludendoli, la richiesta va in rete / runtimeCaching.
        navigateFallbackDenylist: [
          /\.(?:pdf|zip|png|jpe?g|gif|webp|svg|ico|txt|xml|json|woff2?|mp4|webm|mp3)$/i,
          // Sottodomini canonici: i vecchi /path su www vengono 301-redirezionati
          // da Vercel ai sottodomini. Escludendoli dal fallback, il service worker
          // non serve index.html e lascia scattare il redirect di rete.
          /^\/(bio|trivia|pcto|me-stesso|dubliners|gattopardo|archivio|sostieni|festa)(?:\/|$)/,
          // Link tracciabili /d/<id>: non hanno estensione, quindi senza questa
          // esclusione il SW servirebbe index.html (la home) al posto di lasciar
          // scattare il rewrite Vercel → /api/d → 302 verso il documento.
          /^\/d\//,
        ],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            // three.js + Vanta (sfondo vivo di /sostieni): cache-first al primo
            // utilizzo, poi locali per 30 giorni come gli altri asset pesanti.
            urlPattern: ({ url }) => /\/assets\/(three\.module|vanta\.waves\.min)-.*\.js$/.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'ap-vendor-3d',
              expiration: { maxEntries: 6, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Immagini: cache-first, restano in locale 30 giorni.
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'ap-images',
              expiration: { maxEntries: 150, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // PDF, ZIP e altri documenti: stessa logica.
            urlPattern: ({ url }) => /\.(pdf|zip)$/i.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'ap-docs',
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  define: {
    // Esposta al client come stringa, es. "1.37".
    __TRIVIA_VERSION__: JSON.stringify(triviaVersion()),
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
  server: {
    port: 5173,
    strictPort: true,
  },
})
