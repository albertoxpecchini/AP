#!/usr/bin/env node
// Ascolta i suoni della strada di pzkko.it (pzkko/suono/) senza casse: li registra in Chromium headless e per ognuno
// scrive il WAV, lo spettrogramma (il tempo in orizzontale, la frequenza in verticale in scala logaritmica, da 40 Hz a
// 16 kHz) e i livelli, in tools/pzkko/lavoro/suono/.
//
//   node tools/pzkko/suono/ascolta.mjs strumenti [nome…]   ogni strumento da solo, in un OfflineAudioContext (veloce)
//   node tools/pzkko/suono/ascolta.mjs strada [scena…]     la home vera, col 3D, registrata dal vivo: giorno, notte,
//                                                           temporale, tramonto, zanzara, negozio (20–30 s l'una)
//
// dalla cartella albertopecchini.it. I livelli sono in dBFS: RMS secondo per secondo e il picco (sopra −1 il suono
// rischia di gracchiare). Il browser come per gli altri strumenti di pzkko (../browser.mjs).
import { createServer } from 'node:http'
import { readFile, mkdir, stat, writeFile } from 'node:fs/promises'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import * as browser from '../browser.mjs'

const QUI = dirname(fileURLToPath(import.meta.url))
// --radice=<cartella>: un'altra copia di pzkko/ (come per scena/foto.mjs)
const ROOT = (process.argv.find((a) => a.startsWith('--radice=')) ?? '').slice(9) || join(QUI, '../../../pzkko'), LAVORO = join(QUI, '../lavoro/suono')
const [modo = 'strumenti', ...scelti] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
let SR = 48000 // (dal vivo: quella del contesto)

// ── il server: la cartella pzkko com'è, più una pagina vuota per gli strumenti ──
const TIPI = { '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.js': 'text/javascript', '.mjs': 'text/javascript', '.wasm': 'application/wasm', '.mp4': 'video/mp4', '.css': 'text/css', '.json': 'application/json' }
const server = createServer(async (req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  if (p === '/__prova.html') { res.setHeader('Content-Type', 'text/html'); return res.end('<!doctype html><title>prova</title>') }
  let f = join(ROOT, p)
  try { if ((await stat(f)).isDirectory()) f = join(f, 'index.html'); res.setHeader('Content-Type', TIPI[extname(f)] || 'application/octet-stream'); res.end(await readFile(f)) }
  catch { res.statusCode = 404; res.end() }
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const base = `http://127.0.0.1:${server.address().port}`
const puppeteer = browser.puppeteer()
const aperto = await puppeteer.launch({ executablePath: browser.eseguibile(), headless: true, args: ['--no-sandbox', '--hide-scrollbars', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] })
await mkdir(LAVORO, { recursive: true })

// ── il WAV, i livelli, lo spettrogramma ──
const wav = (canali) => {
  const n = canali[0].length, b = Buffer.alloc(44 + n * 4)
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * 4, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(2, 22)
  b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 4, 28); b.writeUInt16LE(4, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 4, 40)
  for (let i = 0; i < n; i++) for (let k = 0; k < 2; k++) b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, canali[k][i])) * 32767), 44 + i * 4 + k * 2)
  return b
}
const db = (x) => (x > 0 ? 20 * Math.log10(x) : -120)
const livelli = (canali) => {
  const n = canali[0].length, sec = []
  let picco = 0, somma = 0
  for (let s = 0; s * SR < n; s++) {
    let q = 0, c = 0
    for (let i = s * SR; i < Math.min(n, (s + 1) * SR); i++) for (const d of canali) { q += d[i] * d[i]; c++; picco = Math.max(picco, Math.abs(d[i])) }
    somma += q; sec.push(db(Math.sqrt(q / Math.max(1, c))).toFixed(0))
  }
  return { rms: db(Math.sqrt(somma / (n * 2))).toFixed(1), picco: db(picco).toFixed(1), sec }
}
const fft = (re, im) => {
  const n = re.length
  for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]] } }
  for (let l = 2; l <= n; l <<= 1) {
    const a = (-2 * Math.PI) / l
    for (let i = 0; i < n; i += l) for (let k = 0; k < l / 2; k++) {
      const c = Math.cos(a * k), s = Math.sin(a * k), xr = re[i + k + l / 2], xi = im[i + k + l / 2]
      const tr = xr * c - xi * s, ti = xr * s + xi * c
      re[i + k + l / 2] = re[i + k] - tr; im[i + k + l / 2] = im[i + k] - ti; re[i + k] += tr; im[i + k] += ti
    }
  }
}
const spettrogramma = async (canali, file) => {
  const N = 2048, hop = 512, n = canali[0].length, cols = Math.max(1, Math.floor((n - N) / hop)), righe = 320
  const img = Buffer.alloc(cols * righe * 3), w = new Float32Array(N).map((_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N))
  const bin = (r) => (40 * (16000 / 40) ** (1 - r / (righe - 1)) * N) / SR
  for (let x = 0; x < cols; x++) {
    const re = new Float64Array(N), im = new Float64Array(N)
    for (let i = 0; i < N; i++) re[i] = ((canali[0][x * hop + i] + canali[1][x * hop + i]) / 2) * w[i]
    fft(re, im)
    for (let r = 0; r < righe; r++) {
      const k = Math.round(bin(r)), m = Math.hypot(re[k], im[k]) / (N / 4)
      const v = Math.max(0, Math.min(1, (db(m) + 100) / 80))
      const o = (r * cols + x) * 3
      img[o] = Math.round(255 * Math.min(1, v * 1.6)); img[o + 1] = Math.round(255 * Math.max(0, v * 1.6 - 0.6)); img[o + 2] = Math.round(255 * Math.min(1, v < 0.4 ? v * 1.5 : Math.max(0, 1.2 - v * 1.4) + Math.max(0, v - 0.85) * 4))
    }
  }
  // le righe a 100 Hz, 1 kHz e 10 kHz, e i secondi
  for (const f of [100, 1000, 10000]) { const r = Math.round((righe - 1) * (1 - Math.log(f / 40) / Math.log(16000 / 40))); for (let x = 0; x < cols; x += 3) img.fill(90, (r * cols + x) * 3, (r * cols + x) * 3 + 3) }
  for (let s = 1; s * SR < n; s++) { const x = Math.round((s * SR) / hop); for (let r = 0; r < righe; r += 4) if (x < cols) img.fill(70, (r * cols + x) * 3, (r * cols + x) * 3 + 3) }
  await sharp(img, { raw: { width: cols, height: righe, channels: 3 } }).png().toFile(file)
}
const scrivi = async (nome, canali) => {
  await writeFile(join(LAVORO, `${nome}.wav`), wav(canali))
  await spettrogramma(canali, join(LAVORO, `${nome}.png`))
  const l = livelli(canali)
  console.log(`${nome.padEnd(22)} rms ${l.rms.padStart(6)}  picco ${l.picco.padStart(6)}   ${l.sec.join(' ')}`)
}
const leggi = (b64) => { const f = new Float32Array(new Uint8Array(Buffer.from(b64, 'base64')).buffer); const n = f.length / 2; return [f.subarray(0, n), f.subarray(n)] }

// ── gli strumenti, uno per uno: [secondi, la ricetta (dentro la pagina: V gli strumenti, out l'uscita, c il contesto)] ──
const STRUMENTI = {
  goccia: [4, 'for (let i = 0; i < 6; i++) V.goccia(out, 0.2 + i * 0.6)'],
  gronda: [3, 'for (let i = 0; i < 4; i++) V.gronda(out, 0.2 + i * 0.7)'],
  passeri: [7, 'V.passeri(out, 0.2, { n: 14 })'],
  tortora: [9, 'V.tortora(out, 0.2, { volte: 4 })'],
  piccioni: [7, 'V.piccioni(out, 0.2, { vola: true })'],
  cornacchia: [4, 'V.cornacchia(out, 0.2, { volte: 3 })'],
  rondoni: [4, 'V.rondoni(out, 0.2)'],
  merlo: [8, 'let u = 0.2; for (let i = 0; i < 3; i++) u += V.merlo(out, u) + 1.5'],
  civetta: [8, 'for (let i = 0; i < 3; i++) V.civetta(out, 0.3 + i * 2.5)'],
  allocco: [10, 'V.allocco(out, 0.3)'],
  grilli: [7, 'const s = V.fonte(V.grilli(0.4), 0.1); s.connect(out); s.stop(7)'],
  cicale: [7, 'const s = V.fonte(V.cicale(), 0.1); s.connect(out); s.stop(7)'],
  campane: [16, 'await V.campana(165, 10); await V.campana(220, 7); await V.campana(262, 7); await V.campana(330, 7); for (let i = 0; i < 3; i++) V.rintocco(out, 0.3 + i * 2.6, 165, { a: 0.9, sec: 10 }); [220, 262, 330].forEach((f, i) => { for (let u = 8 + i * 0.4; u < 15; u += [1.9, 2.25, 2.6][i]) V.rintocco(out, u, f, { a: 0.55, sec: 7 }) })'],
  'tuono-vicino': [12, 'const s = c.createBufferSource(); s.buffer = V.tuono(1); s.connect(out); s.start(0.3)'],
  'tuono-lontano': [12, 'const s = c.createBufferSource(); s.buffer = V.tuono(0); s.connect(out); s.start(0.3)'],
  pioggia: [7, 'const g = (b, a) => { const s = V.fonte(b, 0); const x = c.createGain(); x.gain.value = a; s.connect(x).connect(out); s.stop(7) }; g(V.lamiera(70, 3.7), 0.3); g(V.lamiera(260, 4.3), 0.3); g(V.pozze(90, 4.1), 0.2); const v = V.fonte(V.R.rosa, 0); const hp = V.filtro("highpass", 500), lp = V.filtro("lowpass", 8000), gv = c.createGain(); gv.gain.value = 0.09; v.connect(hp).connect(lp).connect(gv).connect(out); v.stop(7)'],
  // (22.10: la saracinesca in basso, a metà, in alto; e le cose che si toccano)
  bussa: [6, 'V.bussa(out, 0.2, { alto: 0.05 }); V.bussa(out, 1.8, { alto: 0.5 }); V.bussa(out, 3.6, { alto: 1 })'],
  campanello: [6, 'const s = V.campanello(out, out, 0.2); s.lascia(1.5); V.risponde(out, 3)'],
  vetro: [3, 'for (let i = 0; i < 4; i++) V.vetro(out, 0.2 + i * 0.6)'],
  telaio: [2, 'V.telaio(out, 0.2); V.telaio(out, 0.9)'],
  maniglione: [3, 'V.maniglione(out, 0.2); V.maniglione(out, 1.6)'],
  lucchetto: [3, 'V.lucchetto(out, 0.2); V.lucchetto(out, 1.5)'],
  portachiavi: [2, 'V.portachiavi(out, 0.2); V.portachiavi(out, 1)'],
  citofono: [2, 'V.citofono(out, 0.2); V.citofono(out, 0.9)'],
  lattina: [3, 'V.lattina(out, 0.2); V.lattina(out, 1.5)'],
  'carta-bagnata': [2, 'V.cartaBagnata(out, 0.2); V.cartaBagnata(out, 1)'],
  pacchetto: [2, 'V.pacchetto(out, 0.2); V.pacchetto(out, 1)'],
  cartone: [2, 'V.cartone(out, 0.2); V.cartone(out, 1)'],
  grissini: [3, 'for (let i = 0; i < 3; i++) V.grissini(out, 0.2 + i * 0.8)'],
  pozza: [3, 'V.pozza(out, 0.2); V.pozza(out, 1.4)'],
  pietra: [2, 'V.pietra(out, 0.2); V.pietra(out, 0.8); V.neve(out, 1.4)'],
  chiusino: [3, 'V.chiusino(out, 0.2); V.chiusino(out, 1.6)'],
  muro: [2, 'V.muro(out, 0.2); V.muro(out, 0.9)'],
  fogli: [6, 'V.carta(out, 0.2); V.carta(out, 0.7, { tipo: "lucida" }); V.carta(out, 1.2, { tipo: "cartoncino" }); V.carta(out, 1.7, { tipo: "scontrino" }); V.legno(out, 2.3); V.cartello(out, 3.2)'],
  petizione: [8, 'V.foglio(out, 0.2); V.penne(out, 0.5, { n: 3 }); V.tappo(out, 1.2); V.penna(out, 1.6, { durata: 2, n: 12 }); V.penna(out, 4, { durata: 0.8, tipo: "firma" }); V.tappo(out, 5.2, { chiude: true }); V.foglio(out, 6, { giu: true }); V.attacca(out, 6.5)'],
  sbatte: [4, 'V.sbatte(out, 0.2); V.sbatte(out, 2, { n: 8 })'],
  carta: [4, 'V.fruscio(out, 0.2); V.fruscio(out, 0.6); V.fruscio(out, 1.0); V.strappo(out, 1.6); V.strappo(out, 2.4); V.splat(out, 3.1)'],
  motorino: [11, 'V.motorino(out, 0.2, { durata: 10, D: 20 })'],
  clacson: [4, 'V.clacson(out, 0.2); V.clacson(out, 2)'],
  'tapparella-giu': [5, 'V.tapparella(out, 0.2, { giu: true })'],
  'tapparella-su': [5, 'V.tapparella(out, 0.2, { giu: false })'],
  // l'auto come la fa suono.js: dietro la telecamera, da sinistra a destra in 2 s, col neon
  auto: [10, `const dur = 2, v = 33 / dur, T = 9.5, n = Math.ceil(T * 40), dop = new Float32Array(n), vol = new Float32Array(n), lato = new Float32Array(n)
    const L = { x: 1, y: 1.5, z: 3.1 }, zS = 4.4, x = (t) => -15.5 + v * t, r = (t) => Math.max(0.8, Math.hypot(x(t) - L.x, 0.5 - L.y, zS - L.z))
    for (let i = 0; i < n; i++) { const tau = -3.2 + (i / (n - 1)) * T, ri = r(tau); dop[i] = 343 / (343 + (r(tau + 0.02) - ri) / 0.02); vol[i] = Math.min(1, (2.2 / ri) ** 1.15) * Math.min(1, (i / (n - 1)) * T / 1.2); lato[i] = Math.max(-0.95, Math.min(0.95, (x(tau) - L.x) / (ri + 0.5))) }
    const g = c.createGain(), p = c.createStereoPanner(), ing = c.createGain(); ing.gain.value = 0.45; ing.connect(g).connect(p).connect(out)
    g.gain.setValueCurveAtTime(vol, 0.2, T); p.pan.setValueCurveAtTime(lato, 0.2, T); V.auto(ing, 0.2, T, dop, { bagnato: 0.85, neon: true })`],
  insegna: [5, 'const r = V.ronzio(out); r.ronza.value = 0.06; r.sfrigola.value = 0.01; for (let t = 1.5; t < 3; t += 0.05 + Math.random() * 0.1) V.scintilla(out, t); r.sfrigola.setValueAtTime(0.035, 2); r.sfrigola.setValueAtTime(0.01, 2.3)'],
  split: [4, 'const s = V.split(out); s.g.value = 0.12'],
  pc: [9, `const v = V.ventola(out); v.g.setValueAtTime(0, 0); v.g.setTargetAtTime(0.35, 0.2, 0.5); v.disco.setTargetAtTime(0.02, 2.7, 0.4); V.giri(out, 0.2); V.bip(out, 0.55); V.floppy(out, 1.2); for (let u = 2.5; u < 3.3; u += 0.05 + Math.random() * 0.15) V.clic(out, u, 0.12)
    V.accesso(out, 4); for (let i = 0; i < 20; i++) V.tasto(out, 5.5 + i * 0.07, { spazio: i % 6 === 5 }); V.tasto(out, 7.2, { a: 0.2, spazio: true })`],
  mosca: [4, `const o = c.createOscillator(), l = c.createOscillator(), a = c.createGain(), bp = V.filtro('bandpass', 420, 0.9), lg = c.createGain(); o.type = 'sawtooth'; o.frequency.value = 200; l.frequency.value = 7; lg.gain.value = 3; l.connect(lg).connect(o.frequency); o.connect(bp).connect(a).connect(out)
    a.gain.setValueAtTime(0, 0); a.gain.setTargetAtTime(0.3, 0.3, 0.05); a.gain.setTargetAtTime(0, 3.3, 0.08); o.frequency.setTargetAtTime(230, 1.5, 0.3); o.start(); l.start()`],
  zanzara: [4, `const o = c.createOscillator(), l = c.createOscillator(), a = c.createGain(), hp = V.filtro('highpass', 450), lg = c.createGain(), p = c.createStereoPanner(); o.type = 'sawtooth'; o.frequency.value = 600; l.frequency.value = 7; lg.gain.value = 9; l.connect(lg).connect(o.frequency); o.connect(hp).connect(a).connect(p).connect(out)
    a.gain.setValueAtTime(0, 0); a.gain.setTargetAtTime(0.22, 0.3, 0.05); a.gain.setTargetAtTime(0, 3.4, 0.08); p.pan.setValueCurveAtTime(new Float32Array([-0.9, 0.6, -0.3, 0.9, -0.7]), 0.3, 3); o.start(); l.start()`],
}

if (modo === 'strumenti') {
  const page = await aperto.newPage()
  page.on('pageerror', (e) => console.log('[pageerror]', e.message))
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warn') console.log(`[browser ${m.type()}]`, m.text()) })
  await page.goto(base + '/__prova.html')
  for (const [nome, [sec, ricetta]] of Object.entries(STRUMENTI)) {
    if (scelti.length && !scelti.includes(nome)) continue
    const b64 = await page.evaluate(async (sec, ricetta, SR) => {
      const { strumenti } = await import('/suono/voci.js')
      const c = new OfflineAudioContext(2, sec * SR, SR), V = strumenti(c), out = c.createGain()
      out.connect(c.destination)
      // (un po' dell'eco della strada, come nella pagina)
      const m = c.createGain(); m.gain.value = 0.25; out.connect(m).connect(V.eco()).connect(c.destination)
      await new Function('V', 'out', 'c', `return (async () => { ${ricetta} })()`)(V, out, c)
      await new Promise((r) => setTimeout(r, 30))
      const b = await c.startRendering(), f = new Float32Array(b.length * 2)
      f.set(b.getChannelData(0)); f.set(b.getChannelData(1), b.length)
      let s = ''; const u8 = new Uint8Array(f.buffer)
      for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000))
      return btoa(s)
    }, sec, ricetta, SR)
    await scrivi(`s-${nome}`, leggi(b64))
  }
}

// ── la strada, dal vivo: la home col 3D, i suoni accesi, la registrazione dell'uscita ──
const STRADA = {
  giorno: { q: 'ora=08:20', sec: 25 },
  notte: { q: 'ora=22:40', sec: 25, prima: 'window.pzkkoPagina.regola.ogni = 7' },
  temporale: { q: 'ora=16:00&meteo=temporale', sec: 25 },
  tramonto: { q: '', sec: 30, prima: 'const P = window.pzkkoPagina; P.orologio.fermo = false; P.orologio.imposta(P.sole(Date.now()).tramonto - 15000)' },
  zanzara: { q: 'ora=11:00', sec: 10, prima: 'setTimeout(() => window.pzkkoScena.b.visita(), 500); setTimeout(() => window.pzkkoScena.b.visita(), 4500)' },
  negozio: { q: 'ora=21:30', sec: 30, mouse: true },
}
if (modo === 'strada') {
  for (const [nome, s] of Object.entries(STRADA)) {
    if (scelti.length && !scelti.includes(nome)) continue
    const page = await aperto.newPage()
    page.on('pageerror', (e) => console.log(`[${nome} pageerror]`, e.message))
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warn') console.log(`[${nome} ${m.type()}]`, m.text()) })
    await page.setViewport({ width: 1440, height: 900 })
    // (scena=1: dal 23.10 la home parte in 2D, il 3D si sceglie)
    await page.goto(`${base}/?suono&intro=0&scena=1${s.q ? '&' + s.q : ''}`, { waitUntil: 'load', timeout: 120000 })
    await page.waitForFunction(() => document.documentElement.dataset.scena === 'pronta' || !document.documentElement.classList.contains('scena-carico'), { timeout: 120000 })
    // (il gesto: un tasto, poi il motore)
    await page.keyboard.press('x')
    await page.waitForFunction(() => window.pzkkoSuono?.uscita, { timeout: 20000 })
    if (s.mouse) {
      // il puntatore sulla porta: la vetrina avvicina la telecamera al negozio
      const r = await page.evaluate(() => { const p = document.querySelector('.parete').getBoundingClientRect(), S = window.pzkkoScena; const x = p.left + (S.h.fronte.x1 - 0.35) / S.M.W * p.width; return { x, y: Math.min(innerHeight - 60, p.bottom - 0.9 / S.M.W * p.width) } })
      await page.mouse.move(r.x, r.y, { steps: 5 })
    }
    if (s.prima) await page.evaluate(s.prima)
    const b64 = await page.evaluate(async (sec) => {
      const u = window.pzkkoSuono.uscita, c = u.context, sp = c.createScriptProcessor(4096, 2, 2), parti = [[], []]
      u.connect(sp); sp.connect(c.destination)
      sp.onaudioprocess = (e) => { for (let k = 0; k < 2; k++) parti[k].push(new Float32Array(e.inputBuffer.getChannelData(k))) }
      await new Promise((r) => setTimeout(r, sec * 1000))
      sp.disconnect(); u.disconnect(sp)
      const n = parti[0].reduce((s, p) => s + p.length, 0), f = new Float32Array(n * 2)
      for (let k = 0; k < 2; k++) { let o = k * n; for (const p of parti[k]) { f.set(p, o); o += p.length } }
      let s = ''; const u8 = new Uint8Array(f.buffer)
      for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000))
      return [btoa(s), c.sampleRate]
    }, s.sec)
    SR = b64[1]
    await scrivi(`strada-${nome}`, leggi(b64[0]))
    SR = 48000
    await page.close()
  }
}
await aperto.close()
server.close()
