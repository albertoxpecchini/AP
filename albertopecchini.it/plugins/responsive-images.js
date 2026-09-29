// Immagini responsive, fatte in build: per ogni <img> di /media/ più larga di
// quanto serve su un telefono, scrive in dist/ le versioni ridotte
// (<nome>-<larghezza>w.webp) e aggiunge srcset e sizes al tag. In public/
// restano solo gli originali; il dev server li serve così come sono.
//
//  · sizes: quello scritto dal template, se c'è; altrimenti «auto, 100vw» per le
//    immagini lazy (Chromium sceglie sulla misura vera, gli altri usano 100vw) e
//    «100vw» per quelle subito visibili — mai peggio dell'originale.
//  · data-preview (anteprima al passaggio negli indici, larga al massimo 26rem)
//    punta alla versione da 800 px.
//  · Le versioni ridotte si tengono in node_modules/.cache/ap-varianti, con
//    l'impronta del file originale nel nome: una build successiva le ricopia
//    senza ricalcolarle, e un'immagine cambiata (le catture dei siti, rifatte
//    ogni ora dal bot) si ricalcola da sola.
//  · Senza sharp (o se qualcosa va storto) le pagine restano come sono.

import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'

// Larghezze delle versioni ridotte; se ne tengono solo quelle sotto il 75%
// dell'originale (sopra, il risparmio non vale un file in più).
const STEPS = [120, 240, 360, 560, 800, 1200]
const PREVIEW = 800
const QUALITY = 80
const EXT = /\.(webp|jpe?g|png)$/i

export function responsiveImages({ root, outDir, logger }) {
  const publicDir = path.join(root, 'public')
  const cacheDir = path.join(root, 'node_modules/.cache/ap-varianti')
  const info = new Map() // percorso → Promise<{ file, width, hash } | null>
  const jobs = new Map() // dist relativo → { file, hash, width }
  let sharp

  const load = async () => {
    if (sharp !== undefined) return sharp
    try {
      sharp = (await import('sharp')).default
    } catch (error) {
      logger.warn(`\n  responsive-images · sharp non disponibile (${error.message}): immagini lasciate com'erano`)
      sharp = null
    }
    return sharp
  }

  /** Misura e impronta dell'originale (una volta per file). */
  const inspect = (pathname) => {
    if (!info.has(pathname)) {
      info.set(
        pathname,
        (async () => {
          const file = path.join(publicDir, decodeURIComponent(pathname))
          try {
            const buffer = await fs.readFile(file)
            const { width } = await sharp(buffer).metadata()
            return { file, width, hash: crypto.createHash('sha1').update(buffer).digest('hex').slice(0, 16) }
          } catch {
            return null
          }
        })(),
      )
    }
    return info.get(pathname)
  }

  const variantPath = (pathname, w) => pathname.replace(EXT, `-${w}w.webp`)

  /** Mette in coda la versione larga `w` e ne restituisce l'URL (con la stessa query). */
  const variant = (src, meta, w) => {
    const [pathname, query] = src.split('?')
    const rel = variantPath(pathname, w)
    jobs.set(rel, { file: meta.file, hash: meta.hash, width: w })
    return rel + (query ? `?${query}` : '')
  }

  const ATTR = /\s([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*"([^"]*)")?/g

  async function rewriteImg(tag) {
    const attrs = new Map([...tag.matchAll(ATTR)].map((m) => [m[1].toLowerCase(), m[2] ?? '']))
    const src = attrs.get('src')
    if (!src || attrs.has('srcset')) return tag
    // senza srcset il sizes messo dal template non serve (e non sarebbe valido)
    const plain = () => (attrs.has('sizes') ? tag.replace(/\ssizes="[^"]*"/, '') : tag)
    if (!src.startsWith('/media/') || attrs.has('data-no-srcset')) return plain()
    const pathname = src.split('?')[0]
    if (!EXT.test(pathname)) return plain()
    const meta = await inspect(pathname)
    if (!meta?.width) return plain()
    // la versione da 120 serve solo alle immagini piccole (figurine, avatar, isola dell’iPhone)
    const steps = STEPS.filter((w) => w <= meta.width * 0.75 && (w > 120 || meta.width <= 800))
    if (!steps.length) return plain()
    const srcset = [...steps.map((w) => `${variant(src, meta, w)} ${w}w`), `${src} ${meta.width}w`].join(', ')
    const sizes = attrs.get('sizes') || (attrs.get('loading') === 'lazy' ? 'auto, 100vw' : '100vw')
    const extra = ` srcset="${srcset}"` + (attrs.has('sizes') ? '' : ` sizes="${sizes}"`)
    return tag.replace(/\s*\/?>$/, (end) => extra + end)
  }

  async function rewritePreview(attr, src) {
    const pathname = src.split('?')[0]
    if (!src.startsWith('/media/') || !EXT.test(pathname)) return attr
    const meta = await inspect(pathname)
    if (!meta?.width || meta.width <= PREVIEW / 0.75) return attr
    return ` data-preview="${variant(src, meta, PREVIEW)}"`
  }

  async function replaceAsync(text, re, fn) {
    const parts = []
    let last = 0
    for (const m of text.matchAll(re)) {
      parts.push(text.slice(last, m.index), fn(...m))
      last = m.index + m[0].length
    }
    parts.push(text.slice(last))
    return (await Promise.all(parts)).join('')
  }

  return {
    /** Aggiunge srcset/sizes alle immagini di una pagina. */
    async rewrite(html) {
      if (!(await load())) return html
      try {
        let out = await replaceAsync(html, /<img\b[^>]*>/g, rewriteImg)
        out = await replaceAsync(out, /\sdata-preview="([^"]+)"/g, rewritePreview)
        return out
      } catch (error) {
        logger.warn(`\n  responsive-images · pagina lasciata com'era: ${error.message}`)
        return html
      }
    },

    /** Scrive in dist/ tutte le versioni richieste dalle pagine. */
    async flush() {
      if (!sharp || !jobs.size) return { made: 0, cached: 0 }
      await fs.mkdir(cacheDir, { recursive: true })
      let made = 0
      let cached = 0
      const queue = [...jobs]
      const worker = async () => {
        for (let job = queue.shift(); job; job = queue.shift()) {
          const [rel, { file, hash, width }] = job
          const cache = path.join(cacheDir, `${hash}-${width}-q${QUALITY}.webp`)
          try {
            await fs.access(cache)
            cached++
          } catch {
            await sharp(file).resize({ width, withoutEnlargement: true }).webp({ quality: QUALITY, effort: 5 }).toFile(cache)
            made++
          }
          const target = path.join(outDir, rel)
          await fs.mkdir(path.dirname(target), { recursive: true })
          await fs.copyFile(cache, target)
        }
      }
      await Promise.all(Array.from({ length: 4 }, worker))
      return { made, cached }
    },
  }
}
