// ── Il permesso di vedere le foto, in sviluppo ───────────────────────────────
//
// Gemello locale di api/scatti-richiesta.ts e api/scatti-accesso.ts, e lavora
// in due modi a seconda di cosa trova nel .env:
//
//  ① CON Supabase e Resend configurati → chiama il CODICE VERO. Il modulo, la
//     pagina della decisione e l'album firmato sono esattamente quelli che
//     gireranno in produzione, solo raggiunti da localhost. Serve solo un
//     adattatore, perché su Vercel `req`/`res` hanno qualche comodità in più
//     (`req.query`, `res.status().json()`) che il server di sviluppo non dà.
//
//  ② SENZA → un magazzino finto, che tiene le richieste in un file JSON dentro
//     foto/shooting/.web/ e stampa le email in console invece di spedirle, con
//     i link cliccabili. Le foto le serve il plugin di sviluppo che c'è già
//     (/scatti-privati/…), quindi il giro completo — chiedo, autorizzo, apro —
//     si prova per intero su questo computer, senza account e senza spedire
//     niente a nessuno.
//
// In tutti e due i casi vive dentro `configureServer`: in produzione questo
// file non viene nemmeno caricato.
// ─────────────────────────────────────────────────────────────────────────────

import fs from 'node:fs'
import path from 'node:path'
import { createHash, randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const WEB_DIR = path.join(RADICE, 'foto', 'shooting', '.web')
const MANIFESTO = path.join(WEB_DIR, 'manifesto.json')
const REGISTRO = path.join(WEB_DIR, 'richieste-dev.json')

/** Il codice di prova, quando non ce n'è uno configurato. */
const CODICE_FINTO = 'prova-locale'
const ORE = 24

// ── L'adattatore verso le funzioni vere ──────────────────────────────────────
// Su Vercel l'handler riceve req.query già spacchettato, req.body già parsato,
// e un res con .status()/.json()/.send(). Qui glieli costruiamo attorno.

function adatta(req, res, corpo) {
  const url = new URL(req.url ?? '/', 'http://localhost')
  req.query = Object.fromEntries(url.searchParams)
  req.body = corpo
  res.status = (n) => { res.statusCode = n; return res }
  res.json = (o) => {
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(o))
    return res
  }
  res.send = (s) => { res.end(s); return res }
  return { req, res }
}

function leggiCorpo(req) {
  return new Promise((ris) => {
    let grezzo = ''
    req.on('data', (c) => { grezzo += c })
    req.on('end', () => {
      const tipo = req.headers['content-type'] || ''
      if (tipo.includes('json')) {
        try { ris(JSON.parse(grezzo || '{}')) } catch { ris({}) }
      } else if (tipo.includes('urlencoded')) {
        ris(Object.fromEntries(new URLSearchParams(grezzo)))
      } else {
        ris(grezzo)
      }
    })
  })
}

// ── Il magazzino finto ───────────────────────────────────────────────────────

const impronta = (t) => createHash('sha256').update(t).digest('hex')

function registro() {
  try { return JSON.parse(fs.readFileSync(REGISTRO, 'utf8')) } catch { return [] }
}
function salva(righe) {
  fs.mkdirSync(WEB_DIR, { recursive: true })
  fs.writeFileSync(REGISTRO, JSON.stringify(righe, null, 2))
}
function manifesto() {
  try { return JSON.parse(fs.readFileSync(MANIFESTO, 'utf8')) } catch { return null }
}

function json(res, stato, o) {
  res.statusCode = stato
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(o))
}
function html(res, stato, s) {
  res.statusCode = stato
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.end(s)
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

// La veste delle paginette locali è una COPIA A MANO di lib/emailStile.ts: qui
// siamo in un .mjs che gira dentro il server di sviluppo, e importare il modulo
// TypeScript vorrebbe dire pretendere che Node sappia spogliarlo dai tipi. Se
// cambia lo stile là, questa segue — ma se resta indietro non succede niente a
// nessuno: sono pagine che vede solo chi ha il repo aperto.
const SAGOMA = (t) =>
  `polygon(${t}px 0,100% 0,100% calc(100% - ${t}px),calc(100% - ${t}px) 100%,0 100%,0 ${t}px)`
const BOTTONE = (primario) =>
  `display:inline-block;padding:9px 16px;border-radius:6px;font:inherit;font-size:14px;cursor:pointer;` +
  (primario
    ? 'background:#72c7e3;border:1px solid #2d8fbe;color:#101010'
    : 'background:#f8f8f8;border:1px solid #dbdbdb;color:#171717')

function paginetta(titolo, corpo) {
  return `<!doctype html><html lang="it"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(titolo)} · Shooting (locale)</title></head>
<body style="margin:0;padding:0 16px;background:#fcfcfc;font-family:'Titillium Web',Segoe UI,Arial,sans-serif;color:#171717">
<div style="max-width:560px;margin:0 auto;padding:8vh 0">
<div style="padding:1px;background:#dbdbdb;clip-path:${SAGOMA(18)}">
<div style="background:#fbfbfb;clip-path:${SAGOMA(17.414)}">
<div style="padding:18px 22px;border-bottom:1px solid #e8e8e8">
<p style="margin:0 0 5px;font-family:'Roboto Mono',monospace;font-size:11px;letter-spacing:.11em;text-transform:uppercase;color:#8f8f8f">Shooting · prova locale</p>
<h1 style="margin:0;font-size:20px;font-weight:600;line-height:1.3">${esc(titolo)}</h1></div>
<div style="padding:20px 22px;font-size:15px;line-height:1.65;color:#525252">${corpo}</div>
</div></div></div></body></html>`
}

function stampaEmail(a, oggetto, righe) {
  console.log('\n┌─ email (non spedita: manca RESEND_API_KEY o Supabase) ─────────')
  console.log(`│ a:       ${a}`)
  console.log(`│ oggetto: ${oggetto}`)
  for (const r of righe) console.log(`│ ${r}`)
  console.log('└────────────────────────────────────────────────────────────────\n')
}

// ── I tre endpoint, versione finta ───────────────────────────────────────────

// Stessa normalizzazione di codiceGiusto() in lib/scattiAccesso.ts: minuscole e
// via gli spazi. Un codice si consegna a voce e si riscrive come capita — se il
// gemello locale fosse più severo di quello vero, in locale si vedrebbe fallire
// un codice che in produzione passa.
const normalizza = (s) => String(s ?? '').trim().toLowerCase().replace(/\s+/g, '')

function richiestaFinta(req, res, corpo, base) {
  const codice = normalizza(process.env.SHOOTING_CODICE || CODICE_FINTO)
  if (normalizza(corpo?.codice) !== codice) {
    return json(res, 403, { errore: 'codice', error: 'Il codice non è quello giusto.' })
  }
  const man = manifesto()
  const sess = man?.sessioni?.find((s) => s.id === corpo?.sessione)
  if (!sess) return json(res, 409, { error: 'Questa sessione non è disponibile per la richiesta.' })

  const righe = registro()
  const id = randomBytes(9).toString('base64url')
  const tokenAdmin = randomBytes(32).toString('base64url')
  const riga = {
    id,
    sessione: sess.id,
    nome: String(corpo.nome ?? '').slice(0, 60),
    email: String(corpo.email ?? '').slice(0, 120),
    rapporto: String(corpo.rapporto ?? '').slice(0, 200),
    motivo: String(corpo.motivo ?? '').slice(0, 600),
    stato: 'in_attesa',
    admin_hash: impronta(tokenAdmin),
    accesso_hash: null,
    accesso_scade_il: null,
    creata_il: new Date().toISOString(),
    aperture: 0,
  }
  righe.push(riga)
  salva(righe)

  stampaEmail('pzkko@yahoo.com', `Shooting · ${riga.nome} chiede di vedere ${sess.titolo}`, [
    `nome:     ${riga.nome}`,
    `email:    ${riga.email}`,
    `rapporto: ${riga.rapporto}`,
    `motivo:   ${riga.motivo || '—'}`,
    '',
    `decidi:   ${base}/api/scatti-accesso?id=${id}&t=${encodeURIComponent(tokenAdmin)}`,
  ])

  return json(res, 200, { ok: true })
}

function paginaFinta(riga, tokenAdmin, titolo) {
  const attiva = riga.stato === 'autorizzata' && riga.accesso_scade_il && new Date(riga.accesso_scade_il) > new Date()
  const bottoni = riga.stato === 'in_attesa'
    ? `<button name="esito" value="si" style="${BOTTONE(true)};margin:0 8px 8px 0">Autorizza per ${ORE} ore</button>
       <button name="esito" value="no" style="${BOTTONE(false)};margin:0 8px 8px 0">Rifiuta</button>`
    : attiva
      ? `<button name="esito" value="revoca" style="${BOTTONE(false)}">Revoca adesso</button>`
      : ''
  const riga2 = (k, v) => `<tr><td style="padding:5px 12px 5px 0;color:#8f8f8f;white-space:nowrap;vertical-align:top">${esc(k)}</td><td style="padding:5px 0;color:#171717">${esc(v)}</td></tr>`
  return paginetta('Richiesta di accesso', `
    <p style="margin:0 0 16px;color:#8f8f8f;font-size:12px">Stato: ${esc(riga.stato)}</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      ${riga2('Nome', riga.nome)}${riga2('Email', riga.email)}${riga2('Sessione', titolo)}
      ${riga2('Rapporto', riga.rapporto)}${riga2('Motivo', riga.motivo || '—')}${riga2('Aperture', riga.aperture)}
    </table>
    ${bottoni ? `<form method="post" style="margin:22px 0 0"><input type="hidden" name="id" value="${esc(riga.id)}"><input type="hidden" name="t" value="${esc(tokenAdmin)}">${bottoni}</form>` : ''}`)
}

function decisioneFinta(res, corpo, base) {
  const righe = registro()
  const riga = righe.find((r) => r.id === corpo?.id && r.admin_hash === impronta(String(corpo?.t ?? '')))
  if (!riga) return html(res, 404, paginetta('Link non valido', '<p style="margin:0">Non è quello giusto, o non c\'è più.</p>'))

  const man = manifesto()
  const titolo = man?.sessioni?.find((s) => s.id === riga.sessione)?.titolo ?? riga.sessione

  if (corpo.esito === 'si' && riga.stato === 'in_attesa') {
    const token = randomBytes(32).toString('base64url')
    riga.stato = 'autorizzata'
    riga.accesso_hash = impronta(token)
    riga.accesso_scade_il = new Date(Date.now() + ORE * 3600_000).toISOString()
    salva(righe)
    stampaEmail(riga.email, `Le foto di ${titolo} — accesso per ${ORE} ore`, [
      `apri: ${base}/shooting?accesso=${encodeURIComponent(token)}`,
    ])
    return html(res, 200, paginetta('Autorizzata', `<p style="margin:0">${esc(riga.nome)} può vedere ${esc(titolo)} per ${ORE} ore. Il link è stampato nel terminale.</p>`))
  }
  if (corpo.esito === 'no') {
    riga.stato = 'rifiutata'; salva(righe)
    return html(res, 200, paginetta('Rifiutata', '<p style="margin:0">Nessuna email a nessuno.</p>'))
  }
  if (corpo.esito === 'revoca') {
    riga.stato = 'revocata'; riga.accesso_hash = null; riga.accesso_scade_il = null; salva(righe)
    return html(res, 200, paginetta('Revocato', '<p style="margin:0">Il link è spento.</p>'))
  }
  return html(res, 400, paginetta('Non ho capito', '<p style="margin:0">Azione sconosciuta.</p>'))
}

function albumFinto(res, token) {
  const righe = registro()
  const riga = righe.find((r) => r.accesso_hash && r.accesso_hash === impronta(token))
  if (!riga || riga.stato !== 'autorizzata') return json(res, 403, { errore: 'chiuso', error: 'Questo accesso non è valido.' })
  if (new Date(riga.accesso_scade_il) < new Date()) return json(res, 403, { errore: 'scaduto', error: 'Questo accesso è scaduto.' })

  const man = manifesto()
  const sess = man?.sessioni?.find((s) => s.id === riga.sessione)
  if (!sess) return json(res, 404, { error: 'Album non disponibile.' })

  riga.aperture = (riga.aperture || 0) + 1
  riga.ultima_apertura = new Date().toISOString()
  salva(righe)
  if (riga.aperture === 1) {
    stampaEmail('pzkko@yahoo.com', `Shooting · ${riga.nome} ha aperto ${sess.titolo}`, ['prima apertura'])
  }

  // In locale non c'è nessun bucket da firmare: le immagini sono già servite da
  // /scatti-privati/… dal plugin che c'è di fianco. Quello che cambia in
  // produzione sono SOLO gli indirizzi.
  return json(res, 200, {
    ok: true,
    titolo: sess.titolo,
    sessione: sess.id,
    nome: riga.nome,
    scade: riga.accesso_scade_il,
    firmaSecondi: 3600,
    foto: sess.foto,
  })
}

// ── Il plugin ────────────────────────────────────────────────────────────────

export function scattiDevApi() {
  let vero = false
  return {
    name: 'scatti-dev-api',
    async configureServer(server) {
      const { loadEnv } = await import('vite')
      const env = loadEnv(server.config.mode, process.cwd(), '')
      for (const k of ['VITE_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY', 'SHOOTING_CODICE']) {
        if (env[k] && !process.env[k]) process.env[k] = env[k]
      }
      vero = !!(process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)

      if (!vero) {
        console.log(
          `\n  [scatti] Supabase non configurato: /shooting usa il magazzino finto.\n` +
            `           codice del modulo: "${process.env.SHOOTING_CODICE || CODICE_FINTO}"\n` +
            `           le email finiscono qui nel terminale, coi link cliccabili.\n`,
        )
      }

      const base = () => `http://localhost:${server.config.server.port ?? 5173}`

      const passa = async (file, req, res, corpo) => {
        const mod = await server.ssrLoadModule(file)
        adatta(req, res, corpo)
        await mod.default(req, res)
      }

      server.middlewares.use('/api/scatti-richiesta', async (req, res) => {
        if (req.method !== 'POST') { json(res, 405, { error: 'Method not allowed' }); return }
        const corpo = await leggiCorpo(req)
        try {
          if (vero) return await passa('/api/scatti-richiesta.ts', req, res, corpo)
          return richiestaFinta(req, res, corpo, base())
        } catch (e) {
          console.error('[scatti]', e)
          json(res, 500, { error: 'dev' })
        }
      })

      server.middlewares.use('/api/scatti-accesso', async (req, res) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        const corpo = req.method === 'POST' ? await leggiCorpo(req) : undefined
        try {
          if (vero) return await passa('/api/scatti-accesso.ts', req, res, corpo)

          if (req.method === 'POST') return decisioneFinta(res, corpo, base())
          if (url.searchParams.get('disponibili')) {
            // Senza bucket, "disponibile" vuol dire "sta nel manifesto locale":
            // basta a far comparire il modulo e provare il giro.
            const man = manifesto()
            return json(res, 200, { sessioni: (man?.sessioni ?? []).map((s) => s.id) })
          }
          const t = url.searchParams.get('album')
          if (t) return albumFinto(res, t)
          const id = url.searchParams.get('id')
          if (id) {
            const righe = registro()
            const tok = url.searchParams.get('t') ?? ''
            const riga = righe.find((r) => r.id === id && r.admin_hash === impronta(tok))
            if (!riga) return html(res, 404, paginetta('Link non valido', '<p style="margin:0">Non è quello giusto, o non c\'è più.</p>'))
            const man = manifesto()
            const titolo = man?.sessioni?.find((s) => s.id === riga.sessione)?.titolo ?? riga.sessione
            return html(res, 200, paginaFinta(riga, tok, titolo))
          }
          json(res, 404, { error: 'Non trovato' })
        } catch (e) {
          console.error('[scatti]', e)
          json(res, 500, { error: 'dev' })
        }
      })
    },
  }
}
