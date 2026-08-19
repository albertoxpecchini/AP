import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import { readFileSync } from 'fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
// L'officina di /cleaning: legge e scrive i file del repo e fa commit. Vive
// tutta dentro `configureServer`, cioè solo sotto `vite dev` — in `vite build`
// non viene nemmeno chiamata. Vedi la spiegazione in cima al file.
import { cleaningDevApi } from './scripts/janitor/api-dev.mjs'
// Le foto degli shooting sono ritratti di persone e restano in locale: questo
// plugin è l'unico modo di vederle, e anche lui vive solo dentro
// `configureServer`. Vedi scripts/shooting-api-dev.mjs.
import { shootingDevApi } from './scripts/shooting-api-dev.mjs'
// Il permesso di vedere le foto (modulo, decisione, album firmato) provato in
// locale: col .env configurato chiama il codice vero di api/scatti-*.ts, senza
// usa un magazzino finto e stampa le email in console.
import { scattiDevApi } from './scripts/scatti-api-dev.mjs'

// path.dirname(new URL(...).pathname) lascia lo slash iniziale di fronte alla
// lettera di unità su Windows (es. "/C:/Users/..."): risolvendolo poi con
// path.resolve() si ottiene un path raddoppiato ("C:\C:\Users\..."). fileURLToPath
// gestisce la conversione file:// → path nativo in modo corretto su ogni piattaforma.
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Versione del gioco Trivia = 1.<numero di commit che toccano src/app/trivia/>.
// Il conteggio NON si fa qui: lo fa scripts/build-trivia-version.mjs, che gira
// in prebuild e lo deposita in version.json — un file versionato, che quindi
// arriva identico ovunque. Qui si legge e basta.
//
// Prima questa funzione contava i commit al volo, e il numero dipendeva da
// quanta storia aveva il builder: Vercel clona in shallow, e lo stesso codice
// diceva "v1.56" in locale e "v1.2" in produzione (il dettaglio sta nello
// script). Se il file manca, 1.0.
function triviaVersion(): string {
  try {
    const raw = readFileSync(path.join(__dirname, 'src/app/trivia/version.json'), 'utf8')
    return `1.${Number(JSON.parse(raw).commits) || '0'}`
  } catch {
    return '1.0'
  }
}


// Data dell'ultimo commit, in ISO (es. "2026-08-06"). È quella che il footer
// mostra come "Updated": prima lì c'era un new Date() lato client, che però
// scriveva SEMPRE la data di oggi — cioè diceva che il sito è stato aggiornato
// oggi anche dopo mesi di fermo. Calcolata a build-time come triviaVersion().
function buildDate(): string {
  try {
    const iso = execSync('git log -1 --format=%cI', { encoding: 'utf8' }).trim()
    if (iso) return iso.slice(0, 10)
  } catch {
    /* git non disponibile: si ripiega sulla data di build */
  }
  return new Date().toISOString().slice(0, 10)
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
            model: 'claude-fable-5',
            // Fable 5 pensa sempre: max_tokens copre pensiero + risposta, effort
            // "low" perché è solo una curiosità di 1-2 frasi (come api/trivia.ts).
            max_tokens: 2048,
            output_config: { effort: 'low' },
            messages: [{ role: 'user', content: `Genera una breve curiosità o fatto interessante sulla parola italiana "${word.toUpperCase()}" in 1-2 frasi. Scrivi direttamente il fatto senza premesse.` }],
          })
          const textBlock = msg.content.find((b: any) => b.type === 'text')
          const text = textBlock ? textBlock.text : ''
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
    cleaningDevApi(),
    shootingDevApi(),
    scattiDevApi(),
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
        // ── Fuori dal precache ────────────────────────────────────────────────
        // Il precache si scarica INTERO al primo accesso, prima ancora che si
        // sia capito su quale pagina si è. Tutto quello che serve a una pagina
        // sola, o a una lingua sola, lì dentro non ci va: entra in cache al
        // volo la prima volta che serve davvero (runtimeCaching, più sotto).
        //
        //  · vendor-map — maplibre-gl, ~290 kB gzip. Lo usa la mappina in fondo
        //    alla home; è già caricato solo quando il riquadro si avvicina
        //    (site/WhenVisible.tsx), e metterlo nel precache avrebbe rimesso in
        //    piedi esattamente il costo che quel componente era andato a
        //    togliere.
        //  · i18n-* — i quattro pacchetti di traduzione. Ne serve UNO, quello
        //    della lingua attiva: precaricarli tutti e quattro sono ~265 kB per
        //    tenersi pronti a tre lingue che quasi nessuno sceglierà.
        //  · Trivia — il gioco, 84 kB gzip di sole domande e regole, su un sito
        //    che è prima di tutto un portfolio.
        //
        // (Qui c'erano three.js e Vanta, il fondale 3D di /sostieni, e prima
        // ancora lo shader WebGL della home: nel repo non è rimasto né l'uno né
        // l'altro, quindi non c'è più niente da escludere.)
        globIgnores: [
          '**/vendor-map-*.js',
          '**/map-*.css',
          '**/i18n-*.js',
          '**/Trivia-*.js',
          '**/Trivia-*.css',
        ],
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
            // Quello che il precache si lascia indietro (vedi globIgnores):
            // maplibre, i pacchetti di lingua, il gioco. Cache-first al primo
            // utilizzo — il nome del file porta l'hash del contenuto, quindi
            // una copia in cache non può mai essere quella sbagliata.
            urlPattern: ({ url }) =>
              /\/assets\/(vendor-map|i18n-|Trivia-|map-).*\.(js|css)$/.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'ap-lazy-chunks',
              expiration: { maxEntries: 24, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Le mesh delle tre auto del garage (public/models/cars.bin).
            // Fuori dal precache — globPatterns prende solo js/css/html/woff2 —
            // perché sono trecento kB per una sezione in fondo alla home: chi
            // non ci arriva non deve pagarli. Chi ci arriva li paga una volta,
            // poi restano qui.
            urlPattern: ({ url }) => /^\/models\/.*\.bin$/.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'ap-models',
              expiration: { maxEntries: 4, maxAgeSeconds: 60 * 60 * 24 * 90 },
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

  // ── Dipendenze da pre-impacchettare all'avvio ───────────────────────────────
  // Queste tre stanno SOLO dentro pagine caricate a richiesta (canvas-confetti
  // in /trivia, maplibre-gl nelle mappe, il menù contestuale in /archivio).
  // Vite le scopriva quindi tardi, al primo ingresso nella pagina: ri-ottimizzava
  // le dipendenze a server acceso e il chunk già chiesto dal browser diventava
  // un 504 "Outdated Optimize Dep" → pagina bianca (vedi lazyPage in main.tsx).
  // Dichiarandole qui, sono pronte prima che il browser le chieda.
  optimizeDeps: {
    include: ['canvas-confetti', 'maplibre-gl', '@radix-ui/react-context-menu'],
  },

  define: {
    // Esposta al client come stringa, es. "1.37".
    __TRIVIA_VERSION__: JSON.stringify(triviaVersion()),
    // Data dell'ultimo commit in ISO, es. "2026-08-06" (footer "Updated").
    __BUILD_DATE__: JSON.stringify(buildDate()),
  },

  build: {
    rollupOptions: {
      output: {
        // ── Chunk con un nome, non con quello che capita ─────────────────────
        // Due motivi, e nessuno dei due è "fare i chunk più piccoli".
        //
        // ① Il service worker deve poter dire chi sta fuori dal precache
        //    (vedi globIgnores sopra), e per dirlo gli serve un nome stabile:
        //    `vendor-map-<hash>.js` si riconosce, `map-<hash>.js` era il nome
        //    che rollup dava al modulo di questo repo che si chiama map.tsx —
        //    due cose diverse con lo stesso prefisso.
        // ② React e GSAP cambiano quando li si aggiorna, cioè quasi mai; il
        //    codice del sito cambia a ogni commit. Tenuti insieme, ogni
        //    ritocco a una pagina obbligava a riscaricare anche le librerie.
        //    Separati, un deploy invalida solo la parte che è cambiata.
        manualChunks(id: string) {
          const pack = id.match(/src[\\/]app[\\/]i18n[\\/]generated[\\/](\w+)\.json/);
          if (pack) return `i18n-${pack[1]}`;
          if (!id.includes('node_modules')) return;
          if (/[\\/]node_modules[\\/]maplibre-gl[\\/]/.test(id)) return 'vendor-map';
          if (/[\\/]node_modules[\\/]gsap[\\/]/.test(id)) return 'vendor-gsap';
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/.test(id)) {
            return 'vendor-react';
          }
        },
      },
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
  server: {
    port: 5173,
    strictPort: true,
  },
})
