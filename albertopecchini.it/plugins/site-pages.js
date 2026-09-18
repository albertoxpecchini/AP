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

const ROUTES_MODULE = '/src/templates/routes.js'
const ENTRY_JS = 'src/main.js'
const ENTRY_CSS = 'src/style.css'

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
          rolldownOptions: { input: { main: ENTRY_JS, style: ENTRY_CSS } },
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
          const out = await server.transformIndexHtml(req.url, html)
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
      const { routes, renderRoute, renderSitemap, renderRobots, placeholderReport, artFiles } = await import(routesUrl)

      const write = async (file, body) => {
        const target = path.join(outDir, file)
        await fs.mkdir(path.dirname(target), { recursive: true })
        await fs.writeFile(target, body)
      }

      let count = 0
      for (const route of routes) {
        if (route.devOnly) continue
        const { html } = renderRoute(route.path, { assets })
        await write(route.file || path.join(route.path, 'index.html'), html)
        count++
      }
      const thumbs = artFiles(await artCss())
      for (const file of thumbs) await write(file.path, file.body)
      await write('sitemap.xml', renderSitemap())
      await write('robots.txt', renderRobots())
      // il manifest di Vite non serve online
      await fs.rm(path.join(outDir, '.vite'), { recursive: true, force: true })

      config.logger.info(`\n  site-pages · ${count} pagine · ${thumbs.length} miniature · sitemap.xml · robots.txt`)
      const todo = placeholderReport()
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
