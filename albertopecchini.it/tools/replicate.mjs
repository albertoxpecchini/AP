// Client minimo di Replicate per gli strumenti che disegnano immagini con
// openai/gpt-image-2 (tools/copertine, tools/figurine) e per lo scontorno delle
// fotografie (tools/scontorna.mjs, bria/remove-background).
//
// Il token sta in REPLICATE_API_TOKEN (o REPLICATE_API_KEY), nell'ambiente o in
// .env.local (escluso da Git). Qualità sempre «high»: è una scelta di Alberto,
// gli strumenti non offrono alternative più economiche.

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { basename, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = fileURLToPath(new URL('../', import.meta.url))
export const MODEL = 'openai/gpt-image-2'
const API = 'https://api.replicate.com/v1'

try {
  if (!process.env.REPLICATE_API_TOKEN && !process.env.REPLICATE_API_KEY) process.loadEnvFile(join(ROOT, '.env.local'))
} catch {}
const TOKEN = process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY

export const die = (msg) => {
  console.error(`✗ ${msg}`)
  process.exit(1)
}

process.on('uncaughtException', (err) => die(err.status === 401 ? `${err.message}\n  il token in .env.local non è più valido: creane uno nuovo su replicate.com/account/api-tokens` : err.stack || err.message))

export async function api(path, init = {}) {
  if (!TOKEN) die('manca REPLICATE_API_TOKEN: aggiungilo in albertopecchini.it/.env.local (REPLICATE_API_TOKEN=r8_…)')
  const res = await fetch(path.startsWith('http') ? path : `${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${TOKEN}`, ...init.headers },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(`Replicate ${res.status}: ${body.detail || body.title || JSON.stringify(body)}`), { status: res.status })
  return body
}

// Durante l'attesa Replicate risponde a volte con errori passeggeri (è capitato
// un 401 con un token valido): si riprova qualche volta prima di arrendersi.
async function poll(url) {
  for (let i = 1; ; i++) {
    try {
      return await api(url)
    } catch (err) {
      if (i === 5) throw err
      console.warn(`  … ${err.message}, riprovo (${i}/4)`)
      await new Promise((r) => setTimeout(r, 5000 * i))
    }
  }
}

export async function inputSchema(model = MODEL) {
  const m = await api(`/models/${model}`)
  return m.latest_version?.openapi_schema?.components?.schemas?.Input?.properties || {}
}

/** Carica un file su Replicate (percorso relativo al sito, o assoluto): il modello riceve le immagini come URL. */
export async function upload(file) {
  const buf = await readFile(resolve(ROOT, file))
  const type = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' }[extname(file)]
  const form = new FormData()
  form.append('content', new Blob([buf], { type }), basename(file))
  const res = await api('/files', { method: 'POST', body: form })
  return res.urls.get
}

/** Lancia una predizione e ne attende la fine. `recupera` è il comando da suggerire se l'attesa si interrompe. */
export async function predict(input, recupera, model = MODEL) {
  const schema = await inputSchema(model)
  const unknown = Object.keys(input).filter((k) => !(k in schema))
  if (unknown.length) die(`il modello non accetta ${unknown.join(', ')}. Input di oggi: ${Object.keys(schema).join(', ')}`)

  // Sotto i 10 $ di credito Replicate accetta al massimo 5 predizioni di fila
  // (429): la richiesta respinta non parte e non si paga, quindi si riprova.
  let p
  for (let i = 1; !p; i++) {
    try {
      p = await api(`/models/${model}/predictions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Prefer: 'wait=60' },
        body: JSON.stringify({ input }),
      })
    } catch (err) {
      if (err.status !== 429 || i === 10) throw err
      await new Promise((r) => setTimeout(r, 5000 + Math.random() * 10000))
    }
  }
  const id = p.id
  try {
    while (!['succeeded', 'failed', 'canceled'].includes(p.status)) {
      await new Promise((r) => setTimeout(r, 3000))
      p = await poll(p.urls.get)
    }
  } catch (err) {
    die(`${err.message}\n  la predizione ${id} è partita e verrà addebitata: quando finisce, scaricala con «${recupera} ${id}»`)
  }
  if (p.status !== 'succeeded') die(`predizione ${p.id} ${p.status}: ${p.error || ''}`)
  return p
}

export async function prediction(id) {
  const p = await api(`/predictions/${id}`)
  if (p.status !== 'succeeded') die(`la predizione ${id} è ${p.status}`)
  return p
}

/** Scarica le immagini di una predizione riuscita in `dir`, con il JSON dell'input accanto. */
export async function salva(p, dir, extra = {}) {
  await mkdir(dir, { recursive: true })
  const stamp = new Date(p.created_at || Date.now()).toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '-')
  const files = []
  for (const [i, url] of [p.output].flat().filter(Boolean).entries()) {
    const res = await fetch(url)
    if (!res.ok) die(`download ${url}: ${res.status}`)
    const file = join(dir, `${stamp}-${i + 1}.png`)
    await writeFile(file, Buffer.from(await res.arrayBuffer()))
    files.push(file)
  }
  const { input_images, ...input } = p.input || {}
  await writeFile(join(dir, `${stamp}.json`), JSON.stringify({ prediction: p.id, ...extra, ...input, metrics: p.metrics }, null, 2))
  console.log(`✓ predizione ${p.id}`)
  for (const f of files) console.log(`  ${f}`)
  return files
}

export function printSchema(schema) {
  for (const [k, v] of Object.entries(schema)) console.log(`${k}: ${v.type || ''}${v.default !== undefined ? ` (default ${JSON.stringify(v.default)})` : ''}${v.description ? ` — ${v.description}` : ''}`)
}
