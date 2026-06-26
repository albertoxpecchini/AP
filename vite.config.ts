import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import { execSync } from 'child_process'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

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
          const payload = { nome: nome.slice(0, 40), presenza: body.presenza, cibo: body.cibo ?? null }
          if (!process.env.RESEND_API_KEY) {
            console.log('[festa] voto (no RESEND_API_KEY, email saltata):', payload)
            res.statusCode = 200; res.end(JSON.stringify({ ok: true, skipped: true })); return
          }
          const { sendVoteEmail } = await import('./api/_festaEmail')
          const result = await sendVoteEmail(payload)
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

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    triviaDevApi(),
    festaNotifyDevApi(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
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
