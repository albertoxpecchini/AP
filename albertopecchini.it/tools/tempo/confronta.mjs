// Il confronto delle istantanee (3.11.2026): per ogni cattura disegna l'istantanea
// (public/tempo/<dominio>/<data>/pagina/) a 1280×800 e la confronta col primo schermo della pagina
// vera, la foto -t.webp fatta dal deposito. Mette in fila le più diverse: quelle da guardare a
// occhio (un font sbagliato, un pezzo che manca, un'animazione rimasta a metà).
//
//   node tools/tempo/confronta.mjs                 tutte, le 12 più diverse
//   node tools/tempo/confronta.mjs --sito=rivalta  un sito
//   node tools/tempo/confronta.mjs --quante=30     le 30 più diverse
//   node tools/tempo/confronta.mjs --affianca      e per ognuna un'immagine affiancata in lavoro/confronto/

import http from 'node:http'
import { createReadStream, existsSync, statSync, mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as browser from '../pzkko/browser.mjs'
import { SITI, SITO, LAVORO, fileIstantanea, dominio } from './siti.mjs'

const sharp = createRequire(join(SITO, 'tools/catture/package.json'))('sharp')
const argv = process.argv.slice(2)
const opt = (k) => (argv.find((a) => a.startsWith(`--${k}=`)) || '').split('=').slice(1).join('=')
const quante = Number(opt('quante')) || 12
const siti = SITI.filter((s) => !opt('sito') || opt('sito').split(',').includes(s.id))
const PUBBLICO = join(SITO, 'public')
const TIPI = { '.html': 'text/html; charset=utf-8', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif' }

const server = http.createServer((q, s) => {
  let p = join(PUBBLICO, decodeURIComponent(q.url.split('?')[0]))
  if (!p.startsWith(PUBBLICO)) return s.writeHead(403).end()
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html')
  if (!existsSync(p)) return s.writeHead(404).end()
  s.setHeader('Content-Type', TIPI[extname(p)] || 'application/octet-stream')
  createReadStream(p).pipe(s)
})
await new Promise((ok) => server.listen(0, '127.0.0.1', ok))
const base = `http://127.0.0.1:${server.address().port}`

const b = await browser.puppeteer().launch({ executablePath: browser.eseguibile(), headless: true, args: ['--no-sandbox', '--hide-scrollbars'] })
const page = await b.newPage()
await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
await page.setViewport({ width: 1280, height: 800 })
const risultati = []
for (const s of siti) {
  const m = (await import(new URL(`../../src/data/tempo/${s.id}.js`, import.meta.url))).default
  for (const v of m.versioni) {
    const foto = join(PUBBLICO, 'media/tempo', s.id, `${v.short}-t.webp`)
    if (!v.pagina || !existsSync(foto) || !existsSync(fileIstantanea(s, v))) continue
    await page.goto(`${base}/tempo/${dominio(s)}/${v.data}/pagina/`, { waitUntil: 'networkidle0', timeout: 30000 }).catch(() => {})
    await new Promise((r) => setTimeout(r, 1200))
    const png = await page.screenshot()
    const W = 320
    const H = 200
    const [a, c] = await Promise.all([sharp(png).resize(W, H, { fit: 'cover', position: 'top' }).removeAlpha().raw().toBuffer(), sharp(foto).resize(W, H, { fit: 'cover', position: 'top' }).removeAlpha().raw().toBuffer()])
    let somma = 0
    for (let i = 0; i < a.length; i++) somma += Math.abs(a[i] - c[i])
    const diff = somma / a.length / 2.55 // in percento
    risultati.push({ s: s.id, data: v.data, short: v.short, diff })
    if (argv.includes('--affianca')) {
      mkdirSync(join(LAVORO, 'confronto'), { recursive: true })
      await sharp({ create: { width: W * 2 + 4, height: H, channels: 3, background: '#f00' } })
        .composite([{ input: await sharp(foto).resize(W, H, { fit: 'cover', position: 'top' }).toBuffer(), left: 0, top: 0 }, { input: await sharp(png).resize(W, H, { fit: 'cover', position: 'top' }).toBuffer(), left: W + 4, top: 0 }])
        .png()
        .toFile(join(LAVORO, 'confronto', `${s.id}-${v.data}.png`))
    }
  }
}
await b.close()
server.close()
risultati.sort((x, y) => y.diff - x.diff)
const media = risultati.reduce((n, r) => n + r.diff, 0) / Math.max(1, risultati.length)
console.log(`${risultati.length} istantanee confrontate col primo schermo della pagina vera · differenza media ${media.toFixed(1)}%`)
mkdirSync(join(LAVORO, 'confronto'), { recursive: true })
writeFileSync(join(LAVORO, 'confronto', 'risultati.json'), JSON.stringify(risultati, null, 1))
for (const r of risultati.slice(0, quante)) console.log(`  ${r.diff.toFixed(1).padStart(5)}%  ${r.s.padEnd(8)} ${r.data} ${r.short}`)
