#!/usr/bin/env node
// Compone il muro di pzkko.it: legge le pile di disposizione.js, le altezze vere
// dei pezzi (i volantini crescono col testo) e riscrive --x --y --w --r --mx --my
// --mw --mr di ogni elemento .it di pzkko/index.html, più l'altezza della parete.
//
//   node tools/pzkko/disponi.mjs misura [--foto]
//       apre la home in Chromium (desktop 1440 e telefono 390), misura ogni pezzo
//       e scrive tools/pzkko/lavoro/rettangoli.json; con --foto anche
//       lavoro/muro-desk.png e lavoro/muro-mob.png (pagina intera, di giorno)
//   node tools/pzkko/disponi.mjs applica
//       dispone i pezzi con le altezze misurate (stima dalle proporzioni per i
//       pezzi nuovi) e scrive index.html
//   node tools/pzkko/disponi.mjs tutto [--foto]
//       applica, misura, applica di nuovo (le altezze si assestano) e misura
//
// Dopo: node tools/pzkko/genera-404.mjs. Serve puppeteer-core in tools/catture
// (npm i dentro quella cartella) e il Chromium di Playwright in %LOCALAPPDATA%.
import { createServer } from 'node:http'
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const QUI = dirname(fileURLToPath(import.meta.url))
const ROOT = join(QUI, '../../pzkko')
const FILE = join(ROOT, 'index.html')
const LAVORO = join(QUI, 'lavoro')
const RETT = join(LAVORO, 'rettangoli.json')
const { DESK, MOB } = await import(pathToFileURL(join(QUI, 'disposizione.js')).href)

// ── gli elementi .it di index.html e la loro chiave ──────────────────────────
function elementi(html) {
  const out = []
  for (const m of html.matchAll(/<(img|article|h2)\b[^>]*\bclass="[^"]*\bit\b[^"]*"[^>]*>/g)) {
    const t = m[0]
    const id = t.match(/\bid="([^"]+)"/)
    let k
    if (id) k = '#' + id[1]
    else if (m[1] === 'img') k = t.match(/src="\/art\/([^"]+)\.webp"/)[1]
    else k = 'vol:' + html.slice(m.index, html.indexOf('</article>', m.index)).match(/<h3>([\s\S]*?)<\/h3>/)[1].replace(/<[^>]+>/g, '').trim()
    const w = t.match(/width="(\d+)"/), h = t.match(/height="(\d+)"/)
    out.push({ k, index: m.index, tag: t, aspetto: m[1] === 'img' && w && h ? h[1] / w[1] : null })
  }
  return out
}

// ── applica ──────────────────────────────────────────────────────────────────
async function applica() {
  let rett = {}
  try { rett = JSON.parse(await readFile(RETT, 'utf8')) } catch {}
  let html = await readFile(FILE, 'utf8')
  const elems = elementi(html)
  const perK = Object.fromEntries(elems.map((e) => [e.k, e]))
  const altezza = (vista, k, w) => {
    const r = rett[vista]?.find((x) => x.k === k)
    if (r) return (r.h * w) / r.w
    if (perK[k]?.aspetto) return perK[k].aspetto * w
    if (k.startsWith('#')) { const img = html.slice(perK[k].index).match(/<img[^>]*width="(\d+)" height="(\d+)"/); if (img) return (img[2] / img[1]) * w }
    return w * 1.55
  }
  const disponi = (vista, spec) => {
    const pos = {}, fondi = []
    for (const col of spec.cols) {
      let y = spec.top ?? 0
      for (const it of col.items) {
        if (!perK[it.k]) throw new Error(`${vista}: in index.html non c'è ${it.k}`)
        y += it.gap ?? spec.gap
        const h = altezza(vista, it.k, it.w)
        pos[it.k] = { x: Math.round(col.x + (it.dx ?? 0)), y: Math.round(y), w: it.w, r: it.r ?? 0, h }
        y += h
      }
      fondi.push(Math.round(y))
    }
    for (const a of spec.rel ?? []) {
      const b = pos[a.to]
      if (!perK[a.k] || !b) throw new Error(`${vista}: ${a.k} ancorato a ${a.to}, uno dei due manca`)
      pos[a.k] = { x: Math.round(b.x + (a.fx ?? 0) * b.w + (a.dx ?? 0)), y: Math.round(b.y + (a.fy ?? 0) * b.h + (a.dy ?? 0)), w: a.w, r: a.r ?? 0, h: altezza(vista, a.k, a.w) }
    }
    for (const a of spec.abs ?? []) pos[a.k] = { x: a.x, y: a.y, w: a.w, r: a.r ?? 0, h: altezza(vista, a.k, a.w) }
    return { pos, fondi }
  }
  const d = disponi('desk', DESK), m = disponi('mob', MOB)
  const senza = elems.filter((e) => !d.pos[e.k] || !m.pos[e.k]).map((e) => e.k)
  if (senza.length) console.warn(`! senza posto (restano dove sono): ${senza.join(', ')}`)
  for (const e of [...elems].reverse()) {
    const a = d.pos[e.k], b = m.pos[e.k]
    if (!a || !b) continue
    const vars = `--x:${a.x};--y:${a.y};--w:${a.w};--r:${a.r}deg;--mx:${b.x};--my:${b.y};--mw:${b.w};--mr:${b.r}deg`
    const nuovo = e.tag.replace(/style="([^"]*)"/, (_, s) => {
      const resto = s.replace(/--(x|y|w|r|mx|my|mw|mr):[^;]*;?/g, '').replace(/^;+/, '')
      return `style="${vars}${resto ? ';' + resto : ''}"`
    })
    html = html.slice(0, e.index) + nuovo + html.slice(e.index + e.tag.length)
  }
  const hd = Math.max(...d.fondi) + (DESK.bottom ?? 40), hm = Math.max(...m.fondi) + (MOB.bottom ?? 40)
  html = html.replace(/\.parete\{position:relative;height:calc\(\d+ \* var\(--u\)\)\}/, `.parete{position:relative;height:calc(${hd} * var(--u))}`)
  html = html.replace(/\.parete\{height:calc\(\d+ \* var\(--u\)\);max-width:600px/, `.parete{height:calc(${hm} * var(--u));max-width:600px`)
  await writeFile(FILE, html)
  console.log(`desktop: le colonne finiscono a ${d.fondi.join(', ')} → parete ${hd}`)
  console.log(`telefono: le colonne finiscono a ${m.fondi.join(', ')} → parete ${hm}`)
}

// ── misura ───────────────────────────────────────────────────────────────────
const TIPI = { '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' }
async function misura(foto) {
  let puppeteer
  try { puppeteer = createRequire(join(QUI, '../catture/package.json'))('puppeteer-core') }
  catch { throw new Error('manca puppeteer-core: npm i dentro tools/catture') }
  const server = createServer(async (req, res) => {
    let f = join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname))
    try { if ((await stat(f)).isDirectory()) f = join(f, 'index.html'); res.setHeader('Content-Type', TIPI[extname(f)] || 'application/octet-stream'); res.end(await readFile(f)) }
    catch { res.statusCode = 404; res.end() }
  })
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  const url = `http://127.0.0.1:${server.address().port}/?ora=12:00&muro=1` // muro=1: senza la scena 3D, che sposta il muro
  const exe = join(process.env.LOCALAPPDATA, 'ms-playwright/chromium-1243/chrome-win64/chrome.exe')
  const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--no-sandbox', '--hide-scrollbars'] })
  const out = {}
  await mkdir(LAVORO, { recursive: true })
  for (const [vista, v] of Object.entries({ desk: { width: 1440, height: 900, dpr: 1 }, mob: { width: 390, height: 844, dpr: 2 } })) {
    const page = await browser.newPage()
    await page.setViewport({ width: v.width, height: v.height, deviceScaleFactor: v.dpr })
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
    await page.goto(url, { waitUntil: 'networkidle0' })
    await page.evaluate(async () => {
      for (const i of document.querySelectorAll('img[loading=lazy]')) i.loading = 'eager'
      await Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r }))))
      await document.fonts.ready
    })
    out[vista] = await page.evaluate(() => {
      const parete = document.querySelector('.parete'), pr = parete.getBoundingClientRect()
      const u = pr.width / (innerWidth < 900 ? 390 : 1280)
      const chiave = (el) => el.id ? '#' + el.id : el.tagName === 'IMG' ? el.getAttribute('src').replace('/art/', '').replace('.webp', '') : 'vol:' + el.querySelector('h3').textContent.trim()
      return [...parete.querySelectorAll('.it')].map((el) => {
        const t = el.style.transform
        el.style.transform = 'none'
        const r = el.getBoundingClientRect()
        el.style.transform = t
        return { k: chiave(el), x: Math.round((r.left - pr.left) / u), y: Math.round((r.top - pr.top) / u), w: Math.round(r.width / u), h: Math.round(r.height / u) }
      })
    })
    if (foto) await page.screenshot({ path: join(LAVORO, `muro-${vista}.png`), fullPage: true })
    await page.close()
  }
  await browser.close()
  server.close()
  await writeFile(RETT, JSON.stringify(out, null, 1))
  console.log(`misurati ${out.desk.length} pezzi → ${RETT}${foto ? ' (e le foto in lavoro/)' : ''}`)
}

const [cmd] = process.argv.slice(2)
const foto = process.argv.includes('--foto')
if (cmd === 'misura') await misura(foto)
else if (cmd === 'applica') await applica()
else if (cmd === 'tutto') { await applica(); await misura(false); await applica(); await misura(foto) }
else { console.error('uso: disponi.mjs misura [--foto] · applica · tutto [--foto]'); process.exit(1) }
