// Una tavola letta direttamente dal DWG, dentro il visualizzatore
// (src/client/viewer.js). Il file viene scaricato e decodificato una volta
// sola per indirizzo, in un worker (src/dwg/worker.js); ogni tavola è un
// riquadro del disegno (`box`, in unità del DWG) portato sul foglio.
//
// Due canvas dentro il foglio: la «base» è l'intera tavola a una risoluzione
// fissa, il «dettaglio» copre la parte visibile quando si ingrandisce oltre.
// Dove può, il disegno lo fa il worker su un OffscreenCanvas e qui arriva
// solo l'immagine; altrimenti si disegna nella pagina.

import { drawScene } from '../dwg/render.js'

const BASE_PX = 2048 // larghezza della base, in pixel del dispositivo (fino al doppio su schermi densi)
const MAX_PIXELS = 12e6 // area massima di un canvas di dettaglio
const MARGIN = 0.3 // quanto disegnare oltre la parte visibile, per lato

const PAPER_MM = { A4: 297, A3: 420, A2: 594, A1: 841, A0: 1189 }

let worker = null
let seq = 0
const pending = new Map()
const scenes = new Map() // url → Promise<{ mode: 'worker' | 'main', scene?: object }>
const offscreen = typeof OffscreenCanvas !== 'undefined'

function getWorker() {
  if (worker) return worker
  worker = new Worker(new URL('../dwg/worker.js', import.meta.url), { type: 'module' })
  worker.onmessage = (ev) => {
    const { id, progress } = ev.data
    const p = pending.get(id)
    if (!p) return
    if (progress) {
      p.onProgress?.(progress)
      return
    }
    pending.delete(id)
    if (ev.data.error) p.reject(new Error(ev.data.error))
    else p.resolve(ev.data)
  }
  worker.onerror = (e) => {
    for (const p of pending.values()) p.reject(new Error(e.message || 'worker'))
    pending.clear()
  }
  return worker
}

function ask(message, transfer = [], onProgress) {
  const id = ++seq
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject, onProgress })
    getWorker().postMessage({ id, ...message }, transfer)
  })
}

/** Carica (una volta) il DWG: nel worker, e se il worker non sa disegnare anche qui. */
function load(url, darken, onProgress) {
  const key = `${url}|${darken ? 1 : 0}`
  let p = scenes.get(key)
  if (!p) {
    p = ask({ type: 'load', url, darken, keep: offscreen }, [], onProgress).then((r) => (r.scene ? { mode: 'main', scene: r.scene, info: r.info } : { mode: 'worker', info: r.info }))
    p.catch(() => scenes.delete(key))
    scenes.set(key, p)
  }
  return p
}

const dpr = () => Math.min(3, window.devicePixelRatio || 1)

/**
 * @param {HTMLElement} sheetEl il foglio (.viewer__sheet)
 * @param {{ dwg: string, box: string, darken?: string, paper?: string }} s dati della tavola
 * @param {{ onStatus?: (text: string) => void }} [o]
 */
export function createDwgLayer(sheetEl, s, o = {}) {
  const url = s.dwg
  const box = String(s.box)
    .split(',')
    .map(Number)
  const darken = s.darken === '1' || s.darken === 'true'
  const paperMm = PAPER_MM[(s.paper || 'A3').toUpperCase()] || PAPER_MM.A3
  const [bx0, by0, bx1, by1] = box
  const bw = bx1 - bx0
  const bh = by1 - by0
  let alive = true
  let src = null
  let baseDone = false
  let lastKey = ''
  let renderSeq = 0

  const make = (cls) => {
    const c = document.createElement('canvas')
    c.className = `viewer__dwg ${cls}`
    c.setAttribute('aria-hidden', 'true')
    return c
  }
  const base = make('viewer__dwg--base')
  const detail = make('viewer__dwg--detail')
  detail.hidden = true
  sheetEl.append(base, detail)

  const say = (t) => o.onStatus?.(t)
  const labels = { scarico: 'Scarico il DWG…', leggo: 'Leggo il DWG…', preparo: 'Preparo il disegno…' }

  /** Disegna una porzione del riquadro in un canvas di w×h pixel. */
  const paint = async (canvas, view, w, h, pxPerMm) => {
    if (src.mode === 'worker') {
      const r = await ask({ type: 'render', url, darken, view, w, h, pxPerMm, clip: box })
      if (!alive) {
        r.bitmap?.close?.()
        return false
      }
      canvas.width = w
      canvas.height = h
      const bctx = canvas.getContext('bitmaprenderer')
      if (bctx) bctx.transferFromImageBitmap(r.bitmap)
      else {
        canvas.getContext('2d').drawImage(r.bitmap, 0, 0)
        r.bitmap.close?.()
      }
      return true
    }
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    drawScene(ctx, src.scene, { view, px: [0, 0, w, h], pxPerMm, clip: box })
    return true
  }

  const ready = load(url, darken, (p) => alive && say(labels[p] || ''))
    .then(async (r) => {
      if (!alive) return
      src = r
      const d = dpr()
      const w = Math.round(Math.min(BASE_PX * Math.min(d, 2), 4096))
      const h = Math.round((w * bh) / bw)
      await paint(base, box, w, h, w / paperMm)
      if (!alive) return
      base.width = w
      baseDone = true
      base.classList.add('is-in')
      say('')
    })
    .catch((err) => {
      if (!alive) return
      say(`Non riesco a leggere il DWG (${err.message})`)
    })

  /**
   * La vista si è fermata: se il foglio è più grande della base, si disegna
   * la parte visibile (con un margine) alla risoluzione dello schermo.
   * @param {{ x: number, y: number, w: number, h: number, sw: number, sh: number }} v
   *   posizione e misura del foglio nello stage (px CSS) e misura dello stage
   */
  const render = async (v) => {
    if (!alive || !src || !baseDone) return
    const d = dpr()
    if (v.w * d <= base.width * 1.05) {
      detail.hidden = true
      lastKey = ''
      return
    }
    // parte visibile del foglio, in frazioni, con margine
    const fx0 = Math.max(0, (-v.x - v.sw * MARGIN) / v.w)
    const fy0 = Math.max(0, (-v.y - v.sh * MARGIN) / v.h)
    const fx1 = Math.min(1, (-v.x + v.sw * (1 + MARGIN)) / v.w)
    const fy1 = Math.min(1, (-v.y + v.sh * (1 + MARGIN)) / v.h)
    if (fx1 <= fx0 || fy1 <= fy0) return
    let scale = d
    let w = Math.round((fx1 - fx0) * v.w * scale)
    let h = Math.round((fy1 - fy0) * v.h * scale)
    if (w * h > MAX_PIXELS) {
      scale *= Math.sqrt(MAX_PIXELS / (w * h))
      w = Math.round((fx1 - fx0) * v.w * scale)
      h = Math.round((fy1 - fy0) * v.h * scale)
    }
    const key = [fx0, fy0, fx1, fy1, w, h].map((n) => n.toFixed(4)).join('|')
    if (key === lastKey && !detail.hidden) return
    const mine = ++renderSeq
    const view = [bx0 + fx0 * bw, by1 - fy1 * bh, bx0 + fx1 * bw, by1 - fy0 * bh]
    const ok = await paint(detail, view, w, h, (v.w * scale) / paperMm)
    if (!ok || mine !== renderSeq || !alive) return
    detail.style.left = `${(fx0 * 100).toFixed(4)}%`
    detail.style.top = `${(fy0 * 100).toFixed(4)}%`
    detail.style.width = `${((fx1 - fx0) * 100).toFixed(4)}%`
    detail.style.height = `${((fy1 - fy0) * 100).toFixed(4)}%`
    detail.hidden = false
    lastKey = key
  }

  const destroy = () => {
    alive = false
    base.remove()
    detail.remove()
    if (src?.mode === 'worker') ask({ type: 'release', url, darken }).catch(() => {})
  }

  return { ready, render, destroy }
}
