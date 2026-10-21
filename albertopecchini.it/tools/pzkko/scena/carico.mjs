#!/usr/bin/env node
// Le foto del caricamento della home di pzkko.it: la scena 3D fotografata dal punto in cui parte la telecamera, da
// lontano, così com'è al primo fotogramma, e sfocata. La pagina (FOTO, in fondo a pzkko/index.html) la mostra dopo un
// secondo di nero, ritagliata e scalata come la tela, sotto il pomodoro che matura (tools/pzkko/scena/pomodoro.mjs);
// quando la scena è pronta il pomodoro scoppia sulla telecamera e, sotto la macchia, la foto sfuma nella tela nitida: la
// messa a fuoco. Dal 21.10 sera è sfocata e piccola (pochi KB: deve arrivare nel primo secondo); prima era nitida, a piena
// risoluzione, e coincideva pixel per pixel con la tela.
//
// Da lontano la telecamera sta in un punto fisso che non dipende dalla forma della finestra (scena.js, lontano): la
// finestra decide solo quanto si vede intorno al negozio. Quindi basta una foto larga quanto la finestra più larga e alta
// quanto la più stretta (computer: forme da 0,7 a 2,1; telefono da 0,42 a 0,8), e ogni schermo ne prende il ritaglio
// al centro. Quattro luci (giorno, tramonto, sera, notte: la pagina sceglie da --notte), per computer e telefono; la foto
// si scatta alta `altezza` e si riduce a `sfocata` px con la sfocatura `sigma` (in pixel della ridotta: abbastanza
// perché, ingrandita 7–8 volte sullo schermo, resti morbida). WebP senza perdita: quello normale, ingrandito così, era
// tutto a quadretti. Col meteo di partenza della scena (il dopo pioggia), che la scena
// tiene finché la foto non è sfumata.
//
//   node tools/pzkko/scena/carico.mjs [--pagina=home|storia]     (dalla cartella albertopecchini.it)
//
// Da rifare quando la strada da lontano cambia: la disposizione dei fogli (l'altezza della parete), l'insegna, la
// facciata, le luci. `serranda.mjs rifai` lo fa da sé alla fine. Scrive pzkko/art/scena/carico/ e FOTO in index.html;
// la storia (pzkko/storia/, lo stesso posto con un altro muro) ha le sue, storia-*.webp, e la sua FOTO. Senza --pagina
// tutte e due.

import { createServer } from 'node:http'
import { readFile, writeFile, mkdir, stat, readdir, rm } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join, extname } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import * as browser from '../browser.mjs'

const QUI = fileURLToPath(new URL('.', import.meta.url))
const ROOT = join(QUI, '../../../pzkko')
const OUT = join(ROOT, 'art/scena/carico')
const sharp = createRequire(join(QUI, '../../../package.json'))('sharp')
const RESPIRO = 1.22 // come in scena.js

// le forme di finestra che la foto copre, e le altezze in pixel delle due misure
const DISPOSITIVI = {
  computer: { forme: [0.7, 2.1], altezza: 1100, sfocata: 120, sigma: 1.5, qualita: 'alta' },
  telefono: { forme: [0.42, 0.8], altezza: 1500, sfocata: 160, sigma: 1.75, qualita: 'telefono' },
}
// le pagine con la scena: l'indirizzo, il file con FOTO, il prefisso delle foto (la 404 non ne ha: il suo muro è corto)
export const PAGINE = {
  home: { percorso: '/', file: 'index.html', prefisso: '' },
  storia: { percorso: '/storia/', file: 'storia/index.html', prefisso: 'storia-' },
}
// (nascosto il caricamento, tolta la dissolvenza della tela)
const STILE = '.carico,.carico-foto{display:none!important}.scena-tela{transition:none!important}'

const TIPI = { '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' }
const roma = (ms) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(ms))

export async function carico({ log = console.log, pagine = Object.keys(PAGINE) } = {}) {
  const server = createServer(async (req, res) => {
    let f = join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname))
    try { if ((await stat(f)).isDirectory()) f = join(f, 'index.html'); res.setHeader('Content-Type', TIPI[extname(f)] || 'application/octet-stream'); res.end(await readFile(f)) }
    catch { res.statusCode = 404; res.end() }
  })
  await new Promise((r) => server.listen(0, '127.0.0.1', r))
  const base = `http://127.0.0.1:${server.address().port}/`
  const aperto = await browser.puppeteer().launch({ executablePath: browser.eseguibile(), headless: true, args: ['--no-sandbox', '--hide-scrollbars', '--ignore-gpu-blocklist'] })
  try {
    // le ore delle quattro luci, di oggi: il tramonto lo dice la pagina (lo stesso calcolo della sera)
    const p0 = await aperto.newPage()
    await p0.goto(base + '?muro=1', { waitUntil: 'domcontentloaded' })
    const { tramonto } = await p0.evaluate(() => window.pzkkoPagina.sole(window.pzkkoOrologio.adesso()))
    await p0.close()
    const LUCI = { giorno: '13:00', tramonto: roma(tramonto - 25 * 60000), sera: roma(tramonto + 8 * 60000), notte: '22:30' }
    log(`le luci: ${Object.entries(LUCI).map(([k, v]) => `${k} ${v}`).join(', ')}`)

    // le foto si riscrivono al loro posto (i nomi sono sempre quelli) e i file vecchi che non servono più si tolgono
    // solo alla fine: tolti prima, un giro fermato a metà lasciava la pagina con FOTO che puntava a file spariti
    await mkdir(OUT, { recursive: true })
    for (const nomePagina of pagine) {
    const P = PAGINE[nomePagina]
    if (!P) throw new Error(`pagina «${nomePagina}»: ${Object.keys(PAGINE).join(' o ')}`)
    log(`── ${nomePagina} (${P.percorso})`)
    // (le foto di questa pagina: col suo prefisso; quelle della home senza quello delle altre)
    const sua = (f) => (P.prefisso ? f.startsWith(P.prefisso) : !Object.values(PAGINE).some((q) => q.prefisso && f.startsWith(q.prefisso)))
    const scritti = new Set()
    const FOTO = {}
    for (const [disp, D] of Object.entries(DISPOSITIVI)) {
      const voce = (FOTO[disp] = { v: {} })
      for (const [luce, ora] of Object.entries(LUCI)) {
        const alt = D.altezza
        // la finestra: il rettangolo che contiene quelli di tutte le forme (al primo giro la scatola non si sa ancora:
        // la si chiede alla scena e si rifà)
        const pagina = await aperto.newPage()
        const scatta = async (hm, am) => {
          const pw = Math.round(alt * am), dpr = disp === 'telefono' ? Math.ceil(pw / 880) : 1
          await pagina.setViewport({ width: Math.round(pw / dpr), height: Math.round(alt / dpr), deviceScaleFactor: dpr, isMobile: disp === 'telefono', hasTouch: disp === 'telefono' })
          await pagina.evaluateOnNewDocument((css) => document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s) }), STILE)
          const q = new URLSearchParams({ ora, carico: 'foto', qualita: D.qualita, dpr: String(dpr), ...(hm ? { finestra: hm.toFixed(4) } : {}) })
          await pagina.goto(`${base}${P.percorso.slice(1)}?${q}`, { waitUntil: 'domcontentloaded', timeout: 120000 })
          await pagina.waitForSelector('html.scena-vista', { timeout: 90000 })
          await new Promise((r) => setTimeout(r, 600))
          return pagina.evaluate(() => window.pzkkoScena.lontano)
        }
        let L = voce.scatola
        if (!L) { L = voce.scatola = await scatta(0, 1) }
        const larg = 2 * RESPIRO * Math.max(L.bh * D.forme[1], L.bw), hm = 2 * RESPIRO * Math.max(L.bh, L.bw / D.forme[0]), am = larg / hm
        Object.assign(voce, { bw: +L.bw.toFixed(4), bh: +L.bh.toFixed(4), hm: +hm.toFixed(4), am: +am.toFixed(4), forme: D.forme })
        await scatta(hm, am)
        const png = await pagina.screenshot({ captureBeyondViewport: false })
        await pagina.close()
        const nome = `${P.prefisso}${disp}-${luce}.webp`
        const info = await sharp(png).resize({ height: D.sfocata }).blur(D.sigma).webp({ lossless: true, effort: 6 }).toFile(join(OUT, nome))
        scritti.add(nome)
        const v = createHash('sha1').update(await readFile(join(OUT, nome))).digest('hex').slice(0, 8)
        voce.v[luce] = `/art/scena/carico/${nome}?v=${v}`
        log(`${nome}: ${info.width} × ${info.height}, ${(info.size / 1024).toFixed(0)} KB`)
      }
      delete voce.scatola
    }
    const file = join(ROOT, P.file)
    let html = await readFile(file, 'utf8')
    // (\r?: con core.autocrlf, su Windows, la pagina ha i ritorni a capo CRLF e il punto non scavalca il \r)
    if (!/  const FOTO = .*\r?\n/.test(html)) throw new Error(`in ${P.file} manca la riga «  const FOTO = …»`)
    html = html.replace(/  const FOTO = .*?(\r?\n)/, (_, acapo) => `  const FOTO = ${JSON.stringify(FOTO)}${acapo}`)
    await writeFile(file, html)
    log(`FOTO scritte in pzkko/${P.file}`)
    for (const f of await readdir(OUT)) if (sua(f) && !scritti.has(f)) { await rm(join(OUT, f)); log(`tolta ${f}, non serve più`) }
    }
  } finally {
    await aperto.close()
    server.close()
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const pagina = (process.argv.find((a) => a.startsWith('--pagina=')) ?? '').slice(9)
  await carico(pagina ? { pagine: [pagina] } : {})
}
