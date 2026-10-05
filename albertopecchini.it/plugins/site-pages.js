// Plugin Vite: genera le pagine HTML statiche dai template.
//
//  · dev     → ogni richiesta HTML viene renderizzata al volo (con ricarica
//              automatica quando cambiano template, dati o tavole)
//  · build   → dopo il bundle scrive dist/<rotta>/index.html, 404.html,
//              sitemap.xml, robots.txt e le miniature dist/art/<slug>.svg
//
// I template sono semplici moduli ESM (nessun import di CSS o asset), quindi
// girano identici in Node e nel dev server.

import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { responsiveImages } from './responsive-images.js'

const ROUTES_MODULE = '/src/templates/routes.js'
const ENTRY_JS = 'src/main.js'
const ENTRY_CSS = 'src/style.css'

// Fogli delle pagine speciali: fuori dal foglio comune, si collegano solo alle pagine
// che contengono il loro segno (il piano di /stile/, il visualizzatore delle tavole,
// il compositore email). Vengono dopo il foglio comune, come prima gli @import.
const PAGE_CSS = [
  { entry: 'src/styles/stile.css', marker: 'data-canvas' },
  { entry: 'src/styles/viewer.css', marker: 'data-viewer' },
  { entry: 'src/styles/email.css', marker: 'data-email' },
  { entry: 'src/styles/wrapped5bt.css', marker: 'data-wrapped' },
]

/** Aggiunge in fondo a <head> i fogli delle pagine speciali che la pagina usa. */
const withPageCss = (html, href) => {
  const links = PAGE_CSS.filter((p) => html.includes(p.marker)).map((p) => `<link rel="stylesheet" href="${href(p.entry)}">`)
  return links.length ? html.replace('</head>', `${links.join('\n')}\n</head>`) : html
}

// SITE=bcp costruisce il sito di bettercallpekko.it (progetto Vercel a parte, stesso
// repository): solo le rotte di `bcpRoutes`, niente sitemap/robots generati (stanno
// in public/bcp/), e di public/ solo ciò che quelle pagine usano.
const BCP = process.env.SITE === 'bcp'
// media/web: le catture dei siti veri (rifatte ogni ora dal bot) per la sezione Websites.
const BCP_PUBLIC = ['media/assistenza', 'media/web', 'media/mascotte/lumaca.webp', 'media/mascotte/tartaruga.webp', 'favicon.svg', 'favicon-32.png', 'apple-touch-icon.png']

export default function sitePages() {
  let config

  /** CSS minimo per le tavole esportate come file SVG autonomi. */
  const artCss = async () => {
    const read = (f) => fs.readFile(path.resolve(config.root, f), 'utf8')
    const css = (await read('src/styles/tokens.css')) + (await read('src/styles/art.css'))
    return css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim()
  }

  return {
    name: 'site-pages',

    config(_, { isPreview }) {
      return {
        appType: isPreview ? 'mpa' : 'custom',
        build: {
          manifest: true,
          copyPublicDir: !BCP,
          rolldownOptions: { input: { main: ENTRY_JS, style: ENTRY_CSS, ...Object.fromEntries(PAGE_CSS.map((p) => [path.basename(p.entry, '.css'), p.entry])) } },
        },
      }
    },

    configResolved(resolved) {
      config = resolved
    },

    configureServer(server) {
      // I template non fanno parte del grafo client: ricarica la pagina quando cambiano.
      server.watcher.on('change', (file) => {
        const rel = path.relative(config.root, file).replaceAll('\\', '/')
        if (/^src\/(templates|data|art)\//.test(rel)) {
          server.moduleGraph.invalidateAll()
          server.ws.send({ type: 'full-reload' })
        }
      })

      server.middlewares.use(async (req, res, next) => {
        if (req.method !== 'GET') return next()
        const url = new URL(req.url, 'http://localhost')
        try {
          // miniature delle tavole
          if (url.pathname.startsWith('/art/') && url.pathname.endsWith('.svg')) {
            const { artFiles } = await server.ssrLoadModule(ROUTES_MODULE)
            const file = artFiles(await artCss()).find((f) => f.path === url.pathname)
            if (!file) return next()
            res.setHeader('Content-Type', 'image/svg+xml')
            return res.end(file.body)
          }

          const accept = req.headers.accept || ''
          const looksLikeFile = /\.[a-z0-9]+$/i.test(url.pathname) && !url.pathname.endsWith('.html')
          if (looksLikeFile || url.pathname.startsWith('/@') || !accept.includes('text/html')) return next()

          const { renderRoute } = await server.ssrLoadModule(ROUTES_MODULE)
          const assets = { dev: true, scripts: ['/' + ENTRY_JS], styles: ['/' + ENTRY_CSS], preloadFonts: [] }
          const { html, status } = renderRoute(url.pathname, { assets })
          const out = await server.transformIndexHtml(req.url, withPageCss(html, (entry) => '/' + entry))
          res.statusCode = status
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          res.end(out)
        } catch (err) {
          server.ssrFixStacktrace(err)
          next(err)
        }
      })
    },

    async closeBundle() {
      if (config.command !== 'build') return
      const outDir = path.resolve(config.root, config.build.outDir)
      const manifest = JSON.parse(await fs.readFile(path.join(outDir, '.vite/manifest.json'), 'utf8'))

      const js = manifest[ENTRY_JS]
      const css = manifest[ENTRY_CSS]
      const assets = {
        dev: false,
        scripts: ['/' + js.file],
        styles: [...new Set([css?.file, ...(js.css || [])].filter(Boolean))].map((f) => '/' + f),
        // il font principale viene precaricato: evita il flash sui titoli
        preloadFonts: (await fs.readdir(path.join(outDir, 'assets')))
          .filter((f) => /^archivo-latin-wdth-normal.*\.woff2$/.test(f))
          .map((f) => '/assets/' + f),
      }

      const routesUrl = pathToFileURL(path.resolve(config.root, '.' + ROUTES_MODULE)).href
      const { routes: tutte, activeRoutes, renderRoute, renderSitemap, renderRobots, placeholderReport, artFiles } = await import(routesUrl)
      const routes = activeRoutes || tutte

      const write = async (file, body) => {
        const target = path.join(outDir, file)
        await fs.mkdir(path.dirname(target), { recursive: true })
        await fs.writeFile(target, body)
      }

      // srcset e versioni ridotte delle immagini (non per le pagine autonome di Pekko,
      // larghe 960 px fissi, che vogliono i loro JPEG a densità doppia)
      const images = BCP ? null : responsiveImages({ root: config.root, outDir, logger: config.logger })
      let count = 0
      let sheets = false
      for (const route of routes) {
        if (route.devOnly) continue
        const page = withPageCss(renderRoute(route.path, { assets }).html, (entry) => '/' + manifest[entry].file)
        sheets ||= page.includes('/media/tavole/')
        await write(route.file || path.join(route.path, 'index.html'), images && !route.standalone ? await images.rewrite(page) : page)
        count++
      }
      // Le tavole vere (PDF, DWG, SVG) si pubblicano solo se una pagina le mostra: con
      // showSheets spento (src/data/projects.js) restano nel repository, non online.
      if (!BCP && !sheets) await fs.rm(path.join(outDir, 'media/tavole'), { recursive: true, force: true })
      const variants = images ? await images.flush() : null
      let thumbs = []
      if (BCP) {
        const pub = path.resolve(config.root, 'public')
        for (const f of BCP_PUBLIC) await fs.cp(path.join(pub, f), path.join(outDir, f), { recursive: true })
        for (const f of await fs.readdir(path.join(pub, 'bcp'))) await fs.copyFile(path.join(pub, 'bcp', f), path.join(outDir, f))
      } else {
        thumbs = artFiles(await artCss())
        for (const file of thumbs) await write(file.path, file.body)
        await write('sitemap.xml', renderSitemap())
        await write('robots.txt', renderRobots())
      }
      // il manifest di Vite non serve online
      await fs.rm(path.join(outDir, '.vite'), { recursive: true, force: true })

      config.logger.info(`\n  site-pages · ${count} pagine · ${thumbs.length} miniature · ${BCP ? 'bettercallpekko.it (SITE=bcp)' : 'sitemap.xml · robots.txt'}`)
      if (variants) config.logger.info(`  site-pages · immagini ridotte: ${variants.made} nuove, ${variants.cached} dalla cache`)
      const todo = BCP ? [] : placeholderReport()
      if (todo.length) {
        config.logger.warn(
          `\n  site-pages · ${todo.length} dati ancora segnaposto in src/data (da compilare prima della messa online):\n` +
            todo.map((t) => `    - ${t}`).join('\n') +
            '\n',
        )
      }
    },
  }
}
