// Impagina una «nota» (interventi, forniture, riepilogo e totale) in un PDF A4
// con i caratteri del sito. Il testo resta quello scritto da Alberto: lo script
// cambia solo la tipografia (spazi, apostrofi, a capo), mai le parole o i numeri.
//
//   node tools/nota/nota.mjs <testo.txt> [uscita.pdf] [--html]
//
// Senza uscita il PDF va accanto al testo, con lo stesso nome. --html lascia
// accanto anche la pagina HTML da cui è stampato. Vedi README.md.

import { readFileSync, writeFileSync, mkdtempSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, dirname, basename, extname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
const MODULI = fileURLToPath(new URL('../../node_modules/', import.meta.url))

const MESI = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic']

// ─── lettura del testo ──────────────────────────────────────────────────────

export function leggi(testo) {
  const righe = testo
    .replace(/\r/g, '')
    .split('\n')
    .map((r) => r.replace(/[\t  ]+/g, ' ').trim())
    .filter(Boolean)

  const nota = { periodo: null, riga: null, titolo: null, cliente: null, voci: [], conti: [], totale: null, altro: [] }

  for (const r of righe) {
    let m
    if ((m = r.match(/^periodo\s*:\s*(.+)$/i))) {
      nota.periodo = m[1]
    } else if (!nota.titolo && /^nota\b/i.test(r)) {
      // «Nota piscina coniugi Affini…»: le prime due parole sono il titolo, il resto il cliente
      const parole = r.split(' ')
      nota.riga = r
      nota.titolo = parole.slice(0, 2).join(' ')
      nota.cliente = parole.slice(2).join(' ') || null
    } else if ((m = r.match(/^[•·▪◦*–-]\s*(.+)$/)) || /^\d{1,2}\s+\p{L}{3,}\.?\s*:/u.test(r)) {
      const corpo = m ? m[1] : r
      const d = corpo.match(/^(\d{1,2}(?:[\s/.-]+\p{L}+\.?|[/.-]\d{1,2})(?:[\s/.-]+\d{2,4})?)\s*:\s*(.+)$/u)
      nota.voci.push(d ? { data: d[1], testo: d[2] } : { data: null, testo: corpo })
    } else if (/^totale\b/i.test(r) && r.includes('=')) {
      nota.totale = conto(r)
    } else if (r.includes('=') && /\d\s*€|€\s*\d/.test(r)) {
      nota.conti.push(conto(r))
    } else {
      nota.altro.push(r)
    }
  }
  return nota
}

function conto(r) {
  const i = r.indexOf('=')
  const voce = r.slice(0, i).trim()
  const valore = r.slice(i + 1).trim()
  const m = valore.match(/^(.*?)(?:€\s*)?(\d[\d.]*(?:,\d{1,2})?)\s*€?\s*(.*)$/)
  if (!m) return { voce, valore, prima: '', importo: null, dopo: '' }
  return { voce, valore, prima: m[1].trim(), importo: numero(m[2]), dopo: m[3].trim() }
}

const numero = (s) => Number(s.replace(/\./g, '').replace(',', '.'))

const euro = (n) =>
  new Intl.NumberFormat('it-IT', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 }).format(n)

// ─── tipografia ──────────────────────────────────────────────────────────────

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// apostrofi tipografici: ‘26 e '26 → ’26, un'analisi → un’analisi
const apostrofi = (s) => s.replace(/[‘'](\d{2})\b/g, '’$1').replace(/(\p{L})'(\p{L})/gu, '$1’$2')

function riga(s) {
  let h = esc(apostrofi(s))
  // «… = già regolato»: l'esito in coda alla voce
  h = h.replace(/\s=\s(.+)$/, ' <span class="esito">=&nbsp;$1</span>')
  h = h.replace(/\((offert\p{L}|omaggio|gratis)\)/giu, '<em>($1)</em>')
  h = h.replace(/(\d[\d.]*(?:,\d{1,2})?)\s*€/g, '<span class="eur">$1&nbsp;€</span>')
  // un numero non resta mai in fondo alla riga senza la sua parola
  h = h.replace(/(\d)\s(?=[\p{L}(])/gu, '$1&nbsp;')
  return h
}

function data(d) {
  if (!d) return ''
  const m = d.match(/^(\d{1,2})[\s/.-]+(.+)$/)
  if (!m) return `<span class="m">${esc(d)}</span>`
  return `<span class="g">${esc(m[1])}</span><span class="m">${esc(m[2])}</span>`
}

// chiave del mese per separare i mesi con un filo più scuro
function mese(d) {
  if (!d) return null
  const m = d.toLowerCase().match(/^\d{1,2}[\s/.-]+(\p{L}{3}|\d{1,2})/u)
  if (!m) return null
  return /^\d/.test(m[1]) ? Number(m[1]) : MESI.indexOf(m[1]) + 1 || m[1]
}

// ─── pagina ──────────────────────────────────────────────────────────────────

function font(file) {
  return `url(data:font/woff2;base64,${readFileSync(join(MODULI, file)).toString('base64')}) format('woff2')`
}

const LATIN = 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD'
const LATIN_EXT = 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF'

function caratteri() {
  const a = '@fontsource-variable/archivo/files/archivo-'
  return `
@font-face { font-family: 'Archivo'; font-style: normal; font-weight: 100 900; font-stretch: 62% 125%; font-display: block; src: ${font(a + 'latin-ext-wdth-normal.woff2')}; unicode-range: ${LATIN_EXT}; }
@font-face { font-family: 'Archivo'; font-style: normal; font-weight: 100 900; font-stretch: 62% 125%; font-display: block; src: ${font(a + 'latin-wdth-normal.woff2')}; unicode-range: ${LATIN}; }
@font-face { font-family: 'Archivo'; font-style: italic; font-weight: 100 900; font-stretch: 62% 125%; font-display: block; src: ${font(a + 'latin-wdth-italic.woff2')}; }
@font-face { font-family: 'IBM Plex Mono'; font-weight: 400; font-display: block; src: ${font('@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2')}; }
@font-face { font-family: 'IBM Plex Mono'; font-weight: 500; font-display: block; src: ${font('@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2')}; }
@font-face { font-family: 'Instrument Serif'; font-style: normal; font-display: block; src: ${font('@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2')}; }
@font-face { font-family: 'Instrument Serif'; font-style: italic; font-display: block; src: ${font('@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2')}; }`
}

const STILE = `
@page { size: A4; margin: 17mm 18mm 18mm; }
:root {
  --ink: #10110f; --graphite: #5a5b55; --minio: #e5481f; --minio-deep: #b5360f;
  --line: rgb(16 17 15 / 0.16); --line-strong: rgb(16 17 15 / 0.42);
  --col: 27mm;
}
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body {
  margin: 0; background: #fff; color: var(--ink);
  font-family: 'Archivo', sans-serif; font-size: 10.5pt; line-height: 1.45;
  font-weight: 400; font-stretch: 100%; font-kerning: normal;
  font-variant-numeric: tabular-nums lining-nums;
}
.mono { font-family: 'IBM Plex Mono', monospace; font-size: 7.5pt; letter-spacing: 0.08em; text-transform: uppercase; }

/* testata */
.testata { padding-bottom: 7mm; border-bottom: 1.25pt solid var(--ink); }
.periodo { display: flex; align-items: center; gap: 2.4mm; color: var(--graphite); margin: 0 0 9mm; }
.periodo::before { content: ''; width: 2.4mm; height: 2.4mm; background: var(--minio); }
h1 {
  margin: 0; font-size: 44pt; line-height: 0.94; font-weight: 560; font-stretch: 94%;
  letter-spacing: -0.035em;
}
h1 i { font-family: 'Instrument Serif', serif; font-style: italic; font-weight: 400; font-stretch: 100%; font-size: 1.07em; letter-spacing: -0.01em; margin-left: 0.08em; }
.cliente { margin: 3.5mm 0 0; font-size: 15pt; line-height: 1.25; letter-spacing: -0.012em; }

/* interventi */
.voci { list-style: none; margin: 0; padding: 0; }
.voci li {
  display: grid; grid-template-columns: var(--col) 1fr; align-items: baseline;
  padding: 2.5mm 0 2.6mm; border-bottom: 0.5pt solid var(--line);
  break-inside: avoid;
}
.voci li.mese { border-top: 0.75pt solid var(--line-strong); margin-top: -0.5pt; }
.voci li:first-child { border-top: 0; margin-top: 0; }
.quando { white-space: nowrap; }
.quando .g { font-family: 'Instrument Serif', serif; font-size: 17pt; line-height: 1; letter-spacing: -0.01em; margin-right: 1.6mm; }
.quando .m { font-family: 'IBM Plex Mono', monospace; font-size: 7.5pt; letter-spacing: 0.08em; text-transform: uppercase; color: var(--graphite); }
.cosa { text-wrap: pretty; }
.eur { white-space: nowrap; font-weight: 560; }
em { font-style: italic; color: var(--graphite); }
.esito {
  white-space: nowrap; margin-left: 1mm;
  font-family: 'IBM Plex Mono', monospace; font-size: 7.5pt; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--minio-deep);
}

.altro { margin: 7mm 0 0 var(--col); }
.altro p { margin: 0 0 1.5mm; }

/* riepilogo */
.conti { margin: 11mm 0 0 var(--col); break-inside: avoid; }
.conto { display: flex; align-items: baseline; padding: 1.7mm 0; }
.conto .voce { flex: none; max-width: 70%; }
.conto .filo { flex: 1; min-width: 6mm; margin: 0 2.5mm; border-bottom: 0.5pt solid var(--line); transform: translateY(-0.9mm); }
.conto .valore { flex: none; text-align: right; white-space: nowrap; }
.conto .prima, .conto .dopo { font-family: 'IBM Plex Mono', monospace; font-size: 7.5pt; letter-spacing: 0.08em; text-transform: uppercase; color: var(--graphite); }
.conto .prima { margin-right: 1.8mm; }
.conto .dopo { margin-left: 1.8mm; }
.conto .importo { font-weight: 500; }

.totale {
  display: flex; align-items: baseline; justify-content: space-between; gap: 6mm;
  margin-top: 4mm; padding-top: 4.5mm; border-top: 1.25pt solid var(--ink);
}
.totale .voce { font-size: 13pt; font-weight: 560; font-stretch: 94%; letter-spacing: -0.015em; }
.totale .importo { font-size: 30pt; line-height: 1; font-weight: 560; font-stretch: 94%; letter-spacing: -0.03em; color: var(--minio-deep); white-space: nowrap; }
`

function pagina(n) {
  const [primo, ...resto] = (n.titolo ?? '').split(' ')
  const titolo = n.titolo ? `${esc(primo)}${resto.length ? ` <i>${esc(apostrofi(resto.join(' ')))}</i>` : ''}` : ''

  let prima = null
  const voci = n.voci
    .map((v, i) => {
      const k = mese(v.data)
      const nuovo = i > 0 && k != null && prima != null && k !== prima
      if (k != null) prima = k
      return `<li${nuovo ? ' class="mese"' : ''}><span class="quando">${data(v.data)}</span><span class="cosa">${riga(v.testo)}</span></li>`
    })
    .join('\n')

  const valore = (c) =>
    c.importo == null
      ? `<span class="importo">${esc(c.valore)}</span>`
      : `${c.prima ? `<span class="prima">${esc(c.prima)}</span>` : ''}<span class="importo">${euro(c.importo)}&nbsp;€</span>${c.dopo ? `<span class="dopo">${esc(c.dopo)}</span>` : ''}`

  const conti = n.conti
    .map((c) => `<div class="conto"><span class="voce">${esc(apostrofi(c.voce))}</span><span class="filo"></span><span class="valore">${valore(c)}</span></div>`)
    .join('\n')

  const totale = n.totale
    ? `<div class="totale"><span class="voce">${esc(apostrofi(n.totale.voce))}</span><span class="importo">${n.totale.importo == null ? esc(n.totale.valore) : `${euro(n.totale.importo)}&nbsp;€`}</span></div>`
    : ''

  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<title>${esc(apostrofi(n.riga ?? n.titolo ?? 'Nota'))}</title>
<style>${caratteri()}${STILE}</style>
</head>
<body>
<header class="testata">
${n.periodo ? `<p class="periodo mono">Periodo: ${esc(apostrofi(n.periodo))}</p>` : ''}
${titolo ? `<h1>${titolo}</h1>` : ''}
${n.cliente ? `<p class="cliente">${esc(apostrofi(n.cliente))}</p>` : ''}
</header>
<ul class="voci">
${voci}
</ul>
${n.altro.length ? `<div class="altro">${n.altro.map((r) => `<p>${riga(r)}</p>`).join('')}</div>` : ''}
${conti || totale ? `<section class="conti">${conti}${totale}</section>` : ''}
</body>
</html>`
}

// ─── stampa ──────────────────────────────────────────────────────────────────

function stampa(html, pdf, tieniHtml) {
  const dir = mkdtempSync(join(tmpdir(), 'nota-'))
  const file = tieniHtml ? pdf.replace(/\.pdf$/i, '.html') : join(dir, 'nota.html')
  writeFileSync(file, html)
  const r = spawnSync(
    EDGE,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-pdf-header-footer',
      '--run-all-compositor-stages-before-draw',
      '--virtual-time-budget=4000',
      `--user-data-dir=${join(dir, 'edge')}`,
      `--print-to-pdf=${pdf}`,
      pathToFileURL(file).href,
    ],
    { encoding: 'utf8' },
  )
  if (r.status !== 0 || !existsSync(pdf)) {
    throw new Error(`Edge non ha scritto il PDF (il file è aperto in un altro programma?)\n${r.stderr || ''}`)
  }
}

function controlla(n) {
  const avvisi = []
  if (!n.titolo) avvisi.push('nessuna riga che comincia con «Nota»: manca il titolo')
  if (!n.voci.length) avvisi.push('nessun intervento riconosciuto (righe «• 29 mag: …»)')
  for (const r of n.altro) avvisi.push(`riga fuori schema, messa sotto gli interventi: «${r}»`)
  for (const c of n.conti) if (c.importo == null) avvisi.push(`importo non letto: «${c.voce} = ${c.valore}»`)
  if (n.totale?.importo != null && n.conti.length) {
    const somma = n.conti.reduce((s, c) => s + (c.importo ?? 0), 0)
    if (Math.abs(somma - n.totale.importo) > 0.005) {
      avvisi.push(`le voci sommano ${euro(somma)} € ma il totale scritto è ${euro(n.totale.importo)} € (lasciato com'è)`)
    }
  }
  return avvisi
}

const pagine = (pdf) => (readFileSync(pdf, 'latin1').match(/\/Type\s*\/Page(?!s)/g) ?? []).length

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = process.argv.slice(2)
  const tieniHtml = arg.includes('--html')
  const [ingresso, uscita] = arg.filter((a) => !a.startsWith('--'))
  if (!ingresso) {
    console.error('uso: node tools/nota/nota.mjs <testo.txt> [uscita.pdf] [--html]')
    process.exit(1)
  }
  const testo = readFileSync(ingresso, 'utf8').replace(/^﻿/, '')
  const nota = leggi(testo)
  const pdf = resolve(uscita ?? join(dirname(ingresso), basename(ingresso, extname(ingresso)) + '.pdf'))
  stampa(pagina(nota), pdf, tieniHtml)

  const somma = nota.conti.reduce((s, c) => s + (c.importo ?? 0), 0)
  console.log(`${pdf}`)
  console.log(`${nota.voci.length} interventi, ${nota.conti.length} voci di riepilogo (somma ${euro(somma)} €), totale ${nota.totale?.importo != null ? euro(nota.totale.importo) + ' €' : '—'}, ${pagine(pdf)} pagin${pagine(pdf) === 1 ? 'a' : 'e'}`)
  for (const a of controlla(nota)) console.warn(`attenzione: ${a}`)
}
