// ─────────────────────────────────────────────────────────────────────────────
//  pzkko.it — pagina autonoma (documento intero, CSS in linea, come quelle di
//  bettercallpekko.it). Per ora vuota: fondo bianco ghiaccio e solo il credito.
// ─────────────────────────────────────────────────────────────────────────────

import { html, esc } from '../html.js'
import { site } from '../../data/site.js'
import { pzkko as P } from '../../data/pzkko.js'

const credito = () => `<footer class="foot"><a href="${esc(site.url)}" rel="author">Alberto Pecchini</a></footer>`

function shell({ path, title, description, noindex = false }) {
  return html`<!doctype html>
<html lang="${P.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${esc(P.dominio + path)}">`}
<meta name="author" content="${esc(site.name)}">
<link rel="author" href="${esc(site.url)}">
<meta name="theme-color" content="#f4f8fc">
<style>${CSS}</style>
</head>
<body>
<main></main>
${credito()}
</body>
</html>`
}

export const pzkkoPage = () => shell({ path: '/', title: P.titolo, description: P.descrizione })

export const pzkkoNotFoundPage = () => shell({ path: '/404/', title: '404 — pzkko', description: 'Pagina non trovata.', noindex: true })

const CSS = `
html,body{margin:0;min-height:100%}
body{min-height:100svh;display:flex;flex-direction:column;background:#f4f8fc;color:#8aa2b8;font:12.5px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif}
main{flex:1}
.foot{padding:22px 16px;text-align:center}
.foot a{color:inherit;text-decoration:none}
.foot a:hover{color:#4d6a86}
`
