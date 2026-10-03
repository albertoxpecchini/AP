// Worker del visualizzatore: scarica il file, lo legge e prepara il disegno
// fuori dal thread della pagina.
//
// Messaggi in ingresso:
//   { id, type: 'gpu', kind: 'dwg' | 'svg', url, darken, focus, maxScale, maxPx }
//        → { id, gpu } i dati pronti per la scheda grafica (src/gpu/format.js):
//        il DWG letto e impacchettato da src/gpu/pack-dwg.js, la tavola da PDF
//        (SVG) da src/gpu/pack-svg.js. È la strada normale.
//   La strada di riserva, senza WebGL, disegna su canvas 2D:
//   { id, type: 'load', url, darken, keep }   → { id, info, scene? } (la scena
//        viene trasferita alla pagina solo se `keep` è falso, cioè quando il
//        worker non può disegnare)
//   { id, type: 'render', url, darken, view, w, h, pxPerMm, clip } → { id, bitmap }
//   { id, type: 'release', url, darken }
// Durante il caricamento: { id, progress: 'scarico' | 'leggo' | 'preparo' }.

import { parseDwg } from './dwg.js'
import { buildScene } from './scene.js'
import { drawScene } from './render.js'
import { packDwg, transferOf } from '../gpu/pack-dwg.js'
import { packSvg } from '../gpu/pack-svg.js'

const scenes = new Map()
const canDraw = typeof OffscreenCanvas !== 'undefined'
const keyOf = (url, darken) => `${url}|${darken ? 1 : 0}`

async function load(url, darken, say) {
  say('scarico')
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buf = new Uint8Array(await res.arrayBuffer())
  say('leggo')
  const dwg = parseDwg(buf)
  say('preparo')
  const scene = buildScene(dwg, { darken: !!darken })
  return { scene, info: { version: dwg.version, layers: dwg.layers.size, blocks: dwg.blocks.size, entities: scene.stats.entities, stats: scene.stats } }
}

/** La scena di un DWG: letta una volta sola per indirizzo. */
function sceneOf(url, darken, say) {
  const key = keyOf(url, darken)
  let p = scenes.get(key)
  if (!p) {
    p = load(url, darken, say)
    scenes.set(key, p)
    p.catch(() => scenes.delete(key))
  }
  return p
}

self.onmessage = async (ev) => {
  const { id, type } = ev.data
  const say = (progress) => self.postMessage({ id, progress })
  try {
    if (type === 'gpu') {
      const { kind, url, darken, focus, maxScale, maxPx } = ev.data
      const t0 = performance.now()
      let gpu
      if (kind === 'svg') {
        say('scarico')
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const text = await res.text()
        say('preparo')
        gpu = packSvg(text, { maxPx })
      } else {
        const { scene } = await sceneOf(url, darken, say)
        gpu = packDwg(scene, { focus, maxScale })
        // senza OffscreenCanvas non si possono fare le lettere: meglio il canvas 2D della pagina
        if (!gpu.texts) throw new Error('testi non disponibili nel worker')
      }
      gpu.ms = Math.round(performance.now() - t0)
      self.postMessage({ id, gpu }, transferOf(gpu))
      return
    }
    if (type === 'load') {
      const { url, darken, keep } = ev.data
      const { scene, info } = await sceneOf(url, darken, say)
      if (keep && canDraw) {
        self.postMessage({ id, info })
        return
      }
      // la pagina disegna da sé: la scena passa di là (copiata, così resta anche qui)
      self.postMessage({ id, info, scene })
      return
    }
    if (type === 'render') {
      const { url, darken, view, w, h, pxPerMm, clip } = ev.data
      const p = scenes.get(keyOf(url, darken))
      if (!p) throw new Error('DWG non caricato')
      const { scene } = await p
      const canvas = new OffscreenCanvas(w, h)
      const ctx = canvas.getContext('2d')
      drawScene(ctx, scene, { view, px: [0, 0, w, h], pxPerMm, clip })
      const bitmap = canvas.transferToImageBitmap()
      self.postMessage({ id, bitmap }, [bitmap])
      return
    }
    if (type === 'release') {
      self.postMessage({ id })
      return
    }
    throw new Error(`messaggio sconosciuto: ${type}`)
  } catch (err) {
    self.postMessage({ id, error: err && err.message ? err.message : String(err) })
  }
}
