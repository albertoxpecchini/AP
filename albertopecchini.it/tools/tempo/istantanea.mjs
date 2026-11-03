// L'istantanea di una cattura (3.11.2026 sera): la home di quel giorno in un solo index.html
// indipendente, leggero, senza il sito intero dietro. Alberto, dopo le pagine con le foto: «ma
// non foto, voglio sempre l'html ma non un repo intero, solo un index indipendente, super
// ottimizzato».
//
// Si apre la versione depositata come la vede il pubblico (server dell'archivio, richieste fuori
// da /tempo/ bloccate), la si fa scorrere fino in fondo perché tutto si carichi e si disegni, poi
// il DOM così com'è diventa l'HTML dell'istantanea:
//   - niente JavaScript: la pagina è già disegnata, gli script non servono e non partono
//   - il CSS dentro il file, solo le regole che toccano qualcosa che c'è nella pagina (gli stati
//     :hover, :focus… restano), coi font usati e le animazioni citate
//   - ogni immagine ridotta alla misura a cui era mostrata (una volta e mezza), in WebP
//   - mappe, video, tele 3D e iframe diventano la loro foto (non si muovono senza JS)
//   - i link alle altre pagine del sito portano alla versione intera sul server di casa
// Le immagini e i font stanno una volta sola in public/media/tempo/risorse/<hash>, condivisi fra
// tutte le catture (e quindi nella cache del browser da una cattura all'altra); quelli piccoli
// (meno di 2 KB) dentro l'HTML. L'istantanea va in public/tempo/<dominio>/<AAAA-MM-GG>/pagina/.

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, writeFileSync, renameSync } from 'node:fs'
import http from 'node:http'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const QUI = dirname(fileURLToPath(import.meta.url))
const SITO = join(QUI, '../..')
const sharp = createRequire(join(SITO, 'tools/catture/package.json'))('sharp')
// subset-font (harfbuzz in WebAssembly, tools/tempo/package.json): i font tagliati ai soli
// caratteri della pagina, in WOFF2
const subsetFont = createRequire(join(QUI, 'package.json'))('subset-font')
export const RISORSE = join(SITO, 'public/media/tempo/risorse')
const PICCOLA = 2048 // sotto, la risorsa sta dentro l'HTML
const dorm = (ms) => new Promise((r) => setTimeout(r, ms))

// Preparare la pagina prima di fotografarla o congelarla: giù piano fino in fondo (immagini
// pigre e animazioni all'ingresso), le immagini pigre caricate, animazioni al loro stato
// finale, via cookie, modali e pannelli a tutto schermo. Lo usano anche le foto di tempo.mjs.
export async function prepara(page) {
  await page
    .evaluate(async () => {
      const dorm = (ms) => new Promise((r) => setTimeout(r, ms))
      await (document.fonts?.ready || Promise.resolve())
      // Dal 14.6 al 17.9.2026 albertopecchini.it scorreva dentro il body: si fa scorrere chi scorre davvero
      const scorre = (e) => e.scrollHeight > e.clientHeight + 50 && /(auto|scroll)/.test(getComputedStyle(e).overflowY)
      const contenitori = [...document.querySelectorAll('html, body, body > *, #root, #app, main')].filter(scorre)
      const tutti = [document.scrollingElement || document.documentElement, ...contenitori]
      for (const el of tutti) {
        for (let y = 0; y < el.scrollHeight && y < 30000; y += 500) {
          el.scrollTop = y
          await dorm(90)
        }
        el.scrollTop = 0
      }
      if (contenitori.length) {
        const s = document.createElement('style')
        s.dataset.tmMio = '1'
        s.textContent = 'html, body { height: auto !important; min-height: 0 !important; max-height: none !important; overflow: visible !important; }'
        document.head.append(s)
        for (const el of contenitori) Object.assign(el.style, { height: 'auto', maxHeight: 'none', overflow: 'visible' })
      }
      document.querySelectorAll('img[loading="lazy"]').forEach((i) => (i.loading = 'eager'))
      await Promise.race([Promise.all([...document.images].filter((i) => !i.complete).map((i) => new Promise((r) => (i.onload = i.onerror = r)))), dorm(6000)])
      const ferma = document.createElement('style')
      ferma.dataset.tmMio = '1'
      ferma.textContent = '*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; transition-delay: 0s !important; caret-color: transparent !important; }'
      document.head.append(ferma)
      document.querySelectorAll('[class*="cookie" i], [id*="cookie" i], [class*="consent" i], [id*="consent" i], [aria-modal="true"], dialog[open]').forEach((el) => (el.style.display = 'none'))
      for (const el of document.querySelectorAll('body *')) {
        const cs = getComputedStyle(el)
        if (cs.position === 'fixed' && el.getBoundingClientRect().height > innerHeight * 0.6 && Number(cs.zIndex) > 10 && !el.querySelector('canvas')) el.style.display = 'none'
      }
      window.scrollTo(0, 0)
    })
    .catch(() => {})
  await dorm(1200)
}

// ── Le risorse: scaricate una volta, ridotte, salvate col loro hash ─────────

const byte = new Map() // url → Promise<{ dati, tipo } | null>
const fatte = new Map() // hash sorgente + misura → indirizzo finale

function scarica(url) {
  if (!byte.has(url))
    byte.set(
      url,
      (async () => {
        try {
          if (url.startsWith('data:')) {
            const [, meta, dati] = url.match(/^data:([^,]*),(.*)$/s) || []
            if (!meta && meta !== '') return null
            return { dati: /;base64/.test(meta) ? Buffer.from(dati, 'base64') : Buffer.from(decodeURIComponent(dati)), tipo: meta.split(';')[0] }
          }
          if (/^http:\/\/127\.0\.0\.1:/.test(url))
            return await new Promise((ok) =>
              http
                .get(url, { headers: { 'Sec-Fetch-Dest': 'image' } }, (res) => {
                  if (res.statusCode !== 200) return res.resume(), ok(null)
                  const pezzi = []
                  res.on('data', (b) => pezzi.push(b))
                  res.on('end', () => ok({ dati: Buffer.concat(pezzi), tipo: res.headers['content-type'] || '' }))
                })
                .on('error', () => ok(null)),
            )
          const r = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'Mozilla/5.0 (macchina del tempo di albertopecchini.it)' } })
          if (!r.ok) return null
          return { dati: Buffer.from(await r.arrayBuffer()), tipo: r.headers.get('content-type') || '' }
        } catch {
          return null
        }
      })(),
    )
  return byte.get(url)
}

const scrivi = (dati, ext) => {
  const h = createHash('sha1').update(dati).digest('hex').slice(0, 16)
  const nome = `${h}.${ext}`
  const f = join(RISORSE, nome)
  if (!existsSync(f)) {
    mkdirSync(RISORSE, { recursive: true })
    writeFileSync(f + `.${process.pid}.tmp`, dati)
    try {
      renameSync(f + `.${process.pid}.tmp`, f)
    } catch {}
  }
  return `/media/tempo/risorse/${nome}`
}

const dentro = (dati, mime) => (mime === 'image/svg+xml' ? `data:image/svg+xml,${encodeURIComponent(dati.toString('utf8'))}` : `data:${mime};base64,${dati.toString('base64')}`)

// → l'indirizzo da scrivere nell'istantanea (un file delle risorse, un data:, o null se non c'è)
async function risorsa({ url, w, tipo }, caratteri = '') {
  const r = await scarica(url)
  if (!r?.dati?.length) return null
  const sorgente = createHash('sha1').update(r.dati).digest('hex')
  const chiave = `${sorgente}:${tipo}:${w}:${tipo === 'font' ? createHash('sha1').update(caratteri).digest('hex') : ''}`
  if (fatte.has(chiave)) return fatte.get(chiave)
  let out
  const ext = (url.split(/[?#]/)[0].match(/\.([a-z0-9]{2,5})$/i) || [])[1]?.toLowerCase() || ''
  if (tipo === 'font' || /font|woff|ttf|otf/.test(r.tipo) || /^(woff2?|ttf|otf)$/.test(ext)) {
    // il font tagliato ai caratteri che la pagina mostra davvero, in WOFF2 (i Titillium di
    // Bootstrap Italia erano TTF da 50–110 KB l'uno)
    let dati = null
    try {
      if (caratteri) dati = await subsetFont(r.dati, caratteri, { targetFormat: 'woff2' })
    } catch {}
    out = dati?.length && dati.length < r.dati.length ? scrivi(Buffer.from(dati), 'woff2') : scrivi(r.dati, /^(woff2?|ttf|otf)$/.test(ext) ? ext : 'woff2')
  } else if (/svg/.test(r.tipo) || ext === 'svg') {
    const testo = Buffer.from(r.dati.toString('utf8').replace(/<!--[\s\S]*?-->/g, '').replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim())
    out = testo.length < PICCOLA ? dentro(testo, 'image/svg+xml') : scrivi(testo, 'svg')
  } else {
    try {
      const meta = await sharp(r.dati, { animated: true }).metadata()
      const largo = Math.min(meta.width || w, w || 1280)
      const fissa = () => sharp(r.dati).resize({ width: largo, withoutEnlargement: true }).webp({ quality: tipo === 'bg' ? 52 : 58, effort: 4 }).toBuffer()
      let dati = await fissa()
      // un'immagine animata (le GIF di Better Call Pekko, le slide di Rivalta da 51 fotogrammi)
      // resta animata solo se pesa poco: se no il suo primo fotogramma, la pagina è ferma comunque
      if ((meta.pages || 1) > 1) {
        const animata = await sharp(r.dati, { animated: true }).resize({ width: largo, withoutEnlargement: true }).webp({ quality: 45, effort: 4 }).toBuffer()
        if (animata.length < 150 * 1024) dati = animata
      }
      let e = 'webp'
      // se l'originale era già più piccolo (un'icona PNG minuscola), resta lui
      if (dati.length >= r.dati.length && /^(png|jpe?g|webp|gif|avif)$/.test(ext)) {
        dati = r.dati
        e = ext === 'jpeg' ? 'jpg' : ext
      }
      out = dati.length < PICCOLA ? dentro(dati, e === 'webp' ? 'image/webp' : e === 'jpg' ? 'image/jpeg' : `image/${e}`) : scrivi(dati, e)
    } catch {
      out = null // non è un'immagine che sharp legge (un video, un formato strano): resta fuori
    }
  }
  fatte.set(chiave, out)
  return out
}

async function aGruppi(lista, quanti, fn) {
  const out = new Array(lista.length)
  let i = 0
  await Promise.all(
    Array.from({ length: quanti }, async () => {
      while (i < lista.length) {
        const k = i++
        out[k] = await fn(lista[k], k)
      }
    }),
  )
  return out
}

// ── Il congelamento, dentro la pagina ───────────────────────────────────────

const SPECIALI = 'canvas, video, iframe, embed, object, model-viewer, .leaflet-container, .maplibregl-map, .mapboxgl-map, .gm-style, .ol-viewport'

function congela({ prefisso, archivio }) {
  const R = []
  const regi = (url, w, tipo) => (R.push({ url, w, tipo }), `tm-res:${R.length - 1}:`)
  const assoluto = (u, base) => {
    try {
      return new URL(u, base).href
    } catch {
      return u
    }
  }
  const URL_CSS = /url\(\s*(['"]?)([^'")]+?)\1\s*\)/g
  const vh = innerHeight

  // le immagini: ridotte alla misura a cui si vedono
  for (const img of document.querySelectorAll('img')) {
    const src = img.getAttribute('src') || ''
    if (src.startsWith('tm-shot:')) continue
    const vero = img.currentSrc || img.src
    img.removeAttribute('srcset')
    img.removeAttribute('sizes')
    img.removeAttribute('data-src')
    img.removeAttribute('data-srcset')
    img.closest('picture')?.querySelectorAll('source').forEach((s) => s.remove())
    if (!vero) continue
    const r = img.getBoundingClientRect()
    const visto = r.width > 0 && r.height > 0
    // subito solo quello che sta nella prima finestra e mezza (le slide di un carosello fuori
    // dallo schermo, le immagini nascoste, il resto della pagina: quando ci si arriva)
    const subito = visto && r.bottom > 0 && r.top < vh * 1.5 && r.right > 0 && r.left < innerWidth
    if (!img.hasAttribute('width') && !img.hasAttribute('height') && img.naturalWidth) img.setAttribute('width', img.naturalWidth)
    img.setAttribute('src', regi(vero, visto ? Math.min(1600, Math.ceil(r.width * 1.5)) : 800, 'img'))
    img.setAttribute('loading', subito ? 'eager' : 'lazy')
    img.setAttribute('decoding', 'async')
  }
  for (const im of document.querySelectorAll('svg image')) {
    const h = im.getAttribute('href') || im.getAttribute('xlink:href')
    if (h && !h.startsWith('data:')) {
      im.setAttribute('href', regi(assoluto(h, location.href), 1600, 'img'))
      im.removeAttribute('xlink:href')
    }
  }
  for (const el of document.querySelectorAll('[style*="url("]')) {
    const largo = Math.min(1600, Math.ceil(el.getBoundingClientRect().width * 1.25)) || 1280
    el.setAttribute('style', el.getAttribute('style').replace(URL_CSS, (m, q, u) => (u.startsWith('data:') && u.length < 3000 ? m : `url("${regi(assoluto(u, location.href), largo, 'bg')}")`)))
  }

  // il CSS: solo le regole che toccano qualcosa che c'è
  const visti = new Map()
  const STRUTTURA = /^(not|is|where|has|nth-child|nth-of-type|nth-last-child|nth-last-of-type|first-child|last-child|only-child|first-of-type|last-of-type|only-of-type|root|empty|lang|dir|scope)$/i
  // via le pseudo-classi di stato (:hover, ::before…) per sapere se l'elemento c'è; i due punti
  // preceduti dalla barra inversa sono del nome della classe: Tailwind scrive .md\:flex, e fino al
  // 3.11.2026 «\:flex» si toglieva come una pseudo-classe e tutte le varianti md: e lg: sparivano
  const usato = (sel) =>
    sel.split(/,(?![^()]*\))/).some((s) => {
      let b = s
        .replace(/(?<!\\)::?(-?[a-z][\w-]*)(\((?:[^()]|\([^()]*\))*\))?/gi, (m, nome) => (m.startsWith('::') || !STRUTTURA.test(nome) ? '' : m))
        .replace(/[>+~]\s*$/, '')
        .trim()
      if (!b) b = '*'
      if (visti.has(b)) return visti.get(b)
      let ok
      try {
        ok = Boolean(document.querySelector(b))
      } catch {
        ok = true
      }
      visti.set(b, ok)
      return ok
    })
  const assoluti = (testo, base) => testo.replace(URL_CSS, (m, q, u) => (u.startsWith('data:') || u.startsWith('#') ? m : `url("${assoluto(u, base)}")`))
  const facce = []
  const chiavi = []
  const giro = (regole, base) => {
    let out = ''
    for (const r of regole) {
      if (r instanceof CSSStyleRule) {
        if (usato(r.selectorText)) out += r.cssText
      } else if (r instanceof CSSImportRule) {
        try {
          const dentro = r.styleSheet ? giro(r.styleSheet.cssRules, r.styleSheet.href || base) : ''
          if (dentro) out += r.media?.mediaText ? `@media ${r.media.mediaText}{${dentro}}` : dentro
        } catch {}
      } else if (r instanceof CSSFontFaceRule) {
        facce.push({ fam: r.style.getPropertyValue('font-family').replace(/['"]/g, '').trim().toLowerCase(), testo: assoluti(r.cssText, base) })
      } else if (r instanceof CSSKeyframesRule) {
        chiavi.push({ nome: r.name, testo: r.cssText })
      } else if (r.cssRules && /^@(media|supports|container|layer|document|scope)/i.test(r.cssText)) {
        const dentro = giro(r.cssRules, base)
        if (dentro) out += r.cssText.slice(0, r.cssText.indexOf('{')).trim() + '{' + dentro + '}'
      } else if (/^@(namespace|property|layer|counter-style|font-feature-values)/i.test(r.cssText)) {
        out += r.cssText
      }
    }
    return assoluti(out, base)
  }
  let css = ''
  for (const foglio of document.styleSheets) {
    const nodo = foglio.ownerNode
    if (nodo?.dataset?.tmMio || foglio.disabled) continue
    let regole
    try {
      regole = foglio.cssRules
    } catch {
      continue
    }
    const testo = giro(regole, nodo?.dataset?.tmBase || foglio.href || location.href)
    const media = foglio.media?.mediaText
    css += media && media !== 'all' ? `@media ${media}{${testo}}` : testo
  }
  // dei font solo le facce che la pagina ha usato davvero (Bootstrap Italia ne dichiarava 14, in TTF)
  const peso = (p) => String(p || 'normal').replace('normal', '400').replace('bold', '700')
  const caricate = [...document.fonts].filter((f) => f.status === 'loaded').map((f) => ({ fam: f.family.replace(/['"]/g, '').trim().toLowerCase(), peso: peso(f.weight), stile: f.style || 'normal' }))
  // un font variabile dichiara il peso come intervallo («300 700», anche nella FontFace caricata):
  // si confrontano gli intervalli. Il 3.11.2026 il confronto fra numeri scartava la faccia giusta del
  // titolo di Rivalta, e il doppione decorativo del titolo, col font sbagliato, si vedeva sfalsato
  const intervallo = (p) => {
    const n = peso(p).trim().split(/\s+/).map(Number)
    return [n[0], Number.isFinite(n[1]) ? n[1] : n[0]]
  }
  const corsivo = (st) => /italic|oblique/.test(st || '')
  const usata = (f) => {
    const [a1, b1] = intervallo(f.testo.match(/font-weight:\s*([^;}]+)/)?.[1] || 'normal')
    const stile = f.testo.match(/font-style:\s*([^;}]+)/)?.[1] || 'normal'
    return caricate.some((c) => {
      const [a2, b2] = intervallo(c.peso)
      return c.fam === f.fam && corsivo(c.stile) === corsivo(stile) && a1 <= b2 && a2 <= b1
    })
  }
  for (const f of facce) if (f.fam && usata(f)) css = f.testo + css
  for (const k of chiavi) if (css.includes(k.nome)) css += k.testo
  // i font: del src si tiene il woff2 (se c'è), il resto delle risorse sono immagini
  css = css.replace(/@font-face\s*\{[^}]*\}/g, (blocco) =>
    blocco.replace(/src:\s*([^;}]+)/, (m, src) => {
      const voci = src.split(/,(?![^(]*\))/).map((x) => x.trim())
      const scelta = voci.find((x) => /woff2/.test(x)) || voci.find((x) => /url\(/.test(x)) || voci[0]
      // (il file esce in WOFF2, tagliato: il format() si adegua)
      return 'src: ' + scelta.replace(/format\([^)]*\)/, "format('woff2')").replace(URL_CSS, (mm, q, u) => (u.startsWith('data:') ? mm : `url("${regi(u, 0, 'font')}")`))
    }),
  )
  css = css.replace(URL_CSS, (m, q, u) => (u.startsWith('data:') || u.startsWith('tm-res:') || u.startsWith('#') ? m : `url("${regi(u, 1280, 'bg')}")`))

  // i caratteri che la pagina mostra (per tagliare i font): il testo, maiuscole e minuscole per
  // text-transform, quello che scrivono ::before e ::after (le icone), segnaposto e valori
  let testo = (document.body?.textContent || '') + document.title
  for (const el of document.querySelectorAll('[placeholder], input[value], [alt]')) testo += (el.getAttribute('placeholder') || '') + (el.getAttribute('value') || '') + (el.getAttribute('alt') || '')
  for (const el of document.querySelectorAll('body *'))
    for (const ps of ['::before', '::after', '::marker']) {
      const c = getComputedStyle(el, ps).content
      if (c && c !== 'none' && c !== 'normal') testo += c
    }
  testo += testo.toUpperCase() + testo.toLowerCase() + ' 0123456789.,;:!?\'"«»()-–—…'
  const caratteri = [...new Set(testo.replace(/\s+/g, ' '))].sort().join('')

  // via tutto quello che non serve a una pagina già disegnata
  document.querySelectorAll('script, noscript, link, base, style, iframe, template:not([shadowrootmode])').forEach((e) => e.remove())
  document.querySelectorAll('meta').forEach((m) => {
    if (!m.hasAttribute('charset') && m.getAttribute('name') !== 'viewport') m.remove()
  })
  for (const el of document.querySelectorAll('*'))
    for (const a of [...el.attributes]) if (/^on/i.test(a.name) || a.name === 'data-tm-shot' || a.name === 'nonce' || a.name === 'integrity') el.removeAttribute(a.name)
  // i link: le altre pagine del sito portano alla versione intera sul server di casa
  const origineArchivio = archivio.replace(/\/tempo\/?$/, '')
  for (const a of document.querySelectorAll('a[href]')) {
    const h = a.getAttribute('href')
    if (h.startsWith('#') || /^(mailto|tel|sms):/i.test(h)) continue
    if (/^javascript:/i.test(h)) {
      a.removeAttribute('href')
      continue
    }
    try {
      const u = new URL(a.href)
      if (u.origin === location.origin) a.href = origineArchivio + (u.pathname.startsWith('/tempo/') ? u.pathname : prefisso + u.pathname) + u.search + u.hash
    } catch {}
    a.target = '_blank'
    a.rel = 'noopener'
  }
  // la testa: charset, viewport, il titolo, lo stile; niente motori di ricerca
  const head = document.head
  if (!head.querySelector('meta[charset]')) head.prepend(Object.assign(document.createElement('meta'), { charset: 'utf-8' }))
  head.querySelector('meta[charset]').setAttribute('charset', 'utf-8')
  const robot = document.createElement('meta')
  robot.name = 'robots'
  robot.content = 'noindex'
  head.append(robot)
  const stile = document.createElement('style')
  stile.setAttribute('data-tm-css', '')
  head.append(stile)
  return { html: '<!doctype html>\n' + document.documentElement.outerHTML, css, risorse: R, caratteri }
}

// ── L'istantanea di una versione ────────────────────────────────────────────

const minimo = (html) =>
  html
    .split(/(<pre[\s\S]*?<\/pre>|<textarea[\s\S]*?<\/textarea>)/i)
    .map((p, i) => (i % 2 ? p : p.replace(/<!--(?!\[if)[\s\S]*?-->/g, '').replace(/\s{2,}/g, ' ').replace(/>\s+</g, '> <')))
    .join('')

const cssMinimo = (css) => css.replace(/\s*\{\s*/g, '{').replace(/;\s+/g, ';').replace(/\s*\}\s*/g, '}').replace(/;\}/g, '}')

// page: una pagina di puppeteer già aperta sull'archivio, con le richieste fuori da /tempo/
// bloccate; url: l'indirizzo della versione; esce: il file dell'istantanea
export async function istantanea(page, { url, prefisso, archivio, intestazione, esce, giorno, privato = (t) => t }) {
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 })
  // Rivalta in agosto e albertopecchini.it in estate cambiavano tema da soli con l'ora (il tasto
  // «Auto»): le istantanee fatte la sera uscivano scure e le foto del pomeriggio chiare. La pagina
  // crede di essere a mezzogiorno del giorno della cattura, col sistema in tema chiaro.
  await page.emulateMediaFeatures([
    { name: 'prefers-reduced-motion', value: 'reduce' },
    { name: 'prefers-color-scheme', value: 'light' },
  ])
  if (giorno)
    await page.evaluateOnNewDocument((quando) => {
      const D = Date
      const scarto = quando - D.now()
      class Allora extends D {
        constructor(...a) {
          if (a.length) super(...a)
          else super(D.now() + scarto)
        }
        static now() {
          return D.now() + scarto
        }
      }
      window.Date = Allora
    }, new Date(`${giorno}T12:00:00+02:00`).getTime())
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {})
  await prepara(page)

  // i fogli di stile di un altro dominio (Google Fonts, i CDN) non si leggono da dentro la
  // pagina: li si scarica da qui e li si rimette come <style>, con l'indirizzo di partenza
  const esterni = await page.evaluate(() =>
    [...document.querySelectorAll('link[rel~="stylesheet"]')]
      .map((l, i) => {
        try {
          void l.sheet?.cssRules
          return null
        } catch {
          l.dataset.tmEst = String(i)
          return { i, href: l.href }
        }
      })
      .filter(Boolean),
  )
  for (const e of esterni) {
    const r = await scarica(e.href)
    if (!r) continue
    await page.evaluate(
      (i, href, testo) => {
        const l = document.querySelector(`link[data-tm-est="${i}"]`)
        if (!l) return
        const s = document.createElement('style')
        s.dataset.tmBase = href
        if (l.media) s.media = l.media
        s.textContent = testo
        l.replaceWith(s)
      },
      e.i,
      e.href,
      r.dati.toString('utf8'),
    )
  }

  // mappe, video, tele, iframe: la loro foto al loro posto
  const speciali = await page.$$eval(SPECIALI, (els, SEL) => {
    const out = []
    for (const e of els) {
      if (e.parentElement?.closest(SEL)) continue
      const r = e.getBoundingClientRect()
      if (r.width < 16 || r.height < 16) continue
      e.setAttribute('data-tm-shot', String(out.length))
      out.push({ i: out.length, tag: e.tagName.toLowerCase() })
    }
    return out
  }, SPECIALI)
  const foto = []
  // una scena WebGL (pzkko dal 21.10.2026) ha bisogno di qualche secondo per disegnarsi
  if (speciali.some((sp) => sp.tag === 'canvas')) await dorm(3000)
  for (const sp of speciali) {
    try {
      // la foto della sola finestra, ritagliata sull'elemento portato sullo schermo: quella
      // «oltre la finestra» di una tela WebGL usciva nera (come le foto di pzkko)
      const clip = await page.evaluate((i) => {
        const e = document.querySelector(`[data-tm-shot="${i}"]`)
        if (getComputedStyle(e).position !== 'fixed') e.scrollIntoView({ block: 'center' })
        const r = e.getBoundingClientRect()
        const x = Math.max(0, r.left)
        const y = Math.max(0, r.top)
        return { x, y, width: Math.min(innerWidth, r.right) - x, height: Math.min(innerHeight, r.bottom) - y }
      }, sp.i)
      await dorm(300)
      if (clip.width < 8 || clip.height < 8) throw new Error('fuori dallo schermo')
      const buf = Buffer.from(await page.screenshot({ type: 'webp', quality: 60, clip, captureBeyondViewport: false }))
      foto[sp.i] = buf.length < PICCOLA ? dentro(buf, 'image/webp') : scrivi(buf, 'webp')
    } catch {
      foto[sp.i] = null
    }
    await page.evaluate(
      (i, tag) => {
        const e = document.querySelector(`[data-tm-shot="${i}"]`)
        if (!e) return
        const r = e.getBoundingClientRect()
        const img = document.createElement('img')
        img.setAttribute('src', `tm-shot:${i}:`)
        img.alt = ''
        if (['canvas', 'video', 'iframe', 'embed', 'object', 'model-viewer'].includes(tag)) {
          for (const a of ['id', 'class', 'style']) if (e.hasAttribute(a)) img.setAttribute(a, e.getAttribute(a))
          img.setAttribute('width', Math.round(r.width))
          img.setAttribute('height', Math.round(r.height))
          img.style.objectFit = 'cover'
          e.replaceWith(img)
        } else {
          Object.assign(img.style, { display: 'block', width: '100%', height: '100%', objectFit: 'cover' })
          e.replaceChildren(img)
        }
      },
      sp.i,
      sp.tag,
    )
  }

  // di nuovo in cima, com'era la pagina appena aperta
  await page.evaluate(() => window.scrollTo(0, 0))
  await dorm(300)
  const { html, css, risorse, caratteri } = await page.evaluate(congela, { prefisso, archivio })
  const indirizzi = await aGruppi(risorse, 6, (r) => risorsa(r, caratteri))
  const metti = (t) => t.replace(/tm-res:(\d+):/g, (m, k) => indirizzi[k] || '').replace(/tm-shot:(\d+):/g, (m, k) => foto[k] || '')
  const stile = cssMinimo(metti(css))
  let out = metti(html).replace('<style data-tm-css=""></style>', () => `<style>${stile}</style>`)
  out = minimo(privato(out)).replace('<!doctype html>', `<!doctype html>\n<!-- ${intestazione.replace(/--/g, '—')} -->`)
  if (/<script\b/i.test(out) || /127\.0\.0\.1:\d+/.test(out) || /tm-(res|shot):/.test(out)) throw new Error('istantanea sporca: script, indirizzi locali o segnaposto rimasti')
  mkdirSync(dirname(esce), { recursive: true })
  writeFileSync(esce, out)
  const file = new Set([...out.matchAll(/\/media\/tempo\/risorse\/[0-9a-f]{16}\.\w+/g)].map((m) => m[0]))
  return { kb: Math.round(Buffer.byteLength(out) / 1024), risorse: file.size }
}
