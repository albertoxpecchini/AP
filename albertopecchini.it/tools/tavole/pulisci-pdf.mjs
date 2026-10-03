// Toglie da un PDF stampato da AutoCAD ciò che non si vede ma c'è.
//
//   node tools/tavole/pulisci-pdf.mjs <ingresso.pdf> <uscita.pdf> [--livello NOME]…
//
// · I COMMENTI. Per ogni testo scritto con un carattere SHX AutoCAD aggiunge
//   un'annotazione nascosta («AutoCAD SHX Text») con il testo in chiaro, così il
//   PDF resta ricercabile: un nome tolto dal disegno resta leggibile lì. Qui
//   spariscono tutte le annotazioni della pagina.
// · UN LIVELLO. Con --livello il disegno di quel layer (il blocco di contenuto
//   marcato con il suo nome) viene svuotato: i tratti non ci sono più, non sono
//   coperti.
//
// Il file viene riscritto da capo (oggetti, tabella xref), non aggiornato in
// coda: nel PDF nuovo i dati vecchi non restano. Capisce i PDF semplici che
// escono da AutoCAD e da PyMuPDF: tabella xref classica, flussi compressi con
// Flate. Se il file è fatto in un altro modo si ferma senza scrivere.

import fs from 'node:fs'
import zlib from 'node:zlib'

const args = process.argv.slice(2)
const layers = []
const files = []
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--livello') layers.push(args[++i])
  else files.push(args[i])
}
const [input, output] = files
if (!input || !output) {
  console.error('uso: node tools/tavole/pulisci-pdf.mjs <ingresso.pdf> <uscita.pdf> [--livello NOME]…')
  process.exit(1)
}

const buf = fs.readFileSync(input)
const txt = buf.toString('latin1')
const fail = (why) => {
  console.error(`${input}: ${why}`)
  process.exit(1)
}

// ── Tabella xref e coda ────────────────────────────────────────────────────
const sx = txt.lastIndexOf('startxref')
const xref = Number(txt.slice(sx + 9).trim().split(/\s+/)[0])
if (txt.slice(xref, xref + 4) !== 'xref') fail('niente tabella xref classica (forse un flusso xref)')
const trailerAt = txt.indexOf('trailer', xref)
const trailer = txt.slice(trailerAt, sx).trim()
if (/\/Prev\b/.test(trailer)) fail('il file ha aggiornamenti in coda: va prima riscritto intero')
const size = Number(/\/Size\s+(\d+)/.exec(trailer)[1])
const offsets = new Array(size).fill(-1)
{
  const lines = txt.slice(xref + 4, trailerAt).trim().split(/\r?\n/)
  let n = 0
  for (const line of lines) {
    const head = /^(\d+)\s+(\d+)\s*$/.exec(line)
    if (head) {
      n = Number(head[1])
      continue
    }
    const e = /^(\d{10})\s+(\d{5})\s+([nf])/.exec(line)
    if (!e) continue
    if (e[3] === 'n') offsets[n] = Number(e[1])
    n++
  }
}

// ── Oggetti, nell'ordine in cui stanno nel file ────────────────────────────
const order = offsets
  .map((at, num) => ({ num, at }))
  .filter((o) => o.at >= 0)
  .sort((a, b) => a.at - b.at)
const objects = new Map()
order.forEach((o, i) => {
  const end = i + 1 < order.length ? order[i + 1].at : xref
  objects.set(o.num, txt.slice(o.at, end))
})
const header = txt.slice(0, order[0].at)

/** Il flusso di un oggetto, decompresso. */
const streamOf = (num) => {
  const src = objects.get(num)
  const s = src.indexOf('stream')
  const start = src[s + 6] === '\r' ? s + 8 : s + 7
  const end = src.lastIndexOf('endstream')
  let data = Buffer.from(src.slice(start, end), 'latin1')
  const dict = src.slice(0, s)
  if (!/\/Filter\s*\/FlateDecode/.test(dict) || /\/DecodeParms/.test(dict)) fail(`il flusso dell'oggetto ${num} non è Flate semplice`)
  // la lunghezza dichiarata fa fede (in fondo ci può essere un a capo)
  const len = /\/Length\s+(\d+)(?!\s+\d+\s+R)/.exec(dict)
  if (len) data = data.subarray(0, Number(len[1]))
  return zlib.inflateSync(data).toString('latin1')
}
const setStream = (num, body) => {
  const data = zlib.deflateSync(Buffer.from(body, 'latin1'), { level: 9 })
  objects.set(num, `${num} 0 obj\n<</Length ${data.length}/Filter/FlateDecode>>\nstream\n${data.toString('latin1')}\nendstream\nendobj\n`)
}

let notes = 0
let emptied = 0
for (const [num, src] of [...objects]) {
  if (!/\/Type\s*\/Page\b/.test(src)) continue
  let page = src

  // i commenti
  const annots = /\/Annots\s*(\[[^\]]*\]|\d+\s+\d+\s+R)/.exec(page)
  if (annots) {
    let list = annots[1]
    if (list[0] !== '[') {
      const ref = Number(list.split(/\s+/)[0])
      list = objects.get(ref)
      objects.set(ref, `${ref} 0 obj\nnull\nendobj\n`)
    }
    for (const m of list.matchAll(/(\d+)\s+\d+\s+R/g)) {
      objects.set(Number(m[1]), `${m[1]} 0 obj\nnull\nendobj\n`)
      notes++
    }
    page = page.replace(annots[0], '')
  }

  // i livelli da svuotare: dal nome del livello al nome usato nel contenuto della pagina
  const tags = []
  for (const name of layers) {
    const ocg = [...objects].find(([, o]) => /\/Type\s*\/OCG\b/.test(o) && o.includes(`/Name(${name})`))
    if (!ocg) fail(`non c'è un livello «${name}»`)
    const tag = new RegExp(`/(\\w+)\\s+${ocg[0]}\\s+0\\s+R`).exec(page)
    if (tag) tags.push(tag[1])
  }
  if (tags.length) {
    const contents = /\/Contents\s*(\[[^\]]*\]|\d+\s+\d+\s+R)/.exec(page)
    if (!contents) fail('pagina senza contenuto')
    for (const m of contents[1].matchAll(/(\d+)\s+\d+\s+R/g)) {
      const ref = Number(m[1])
      let body = streamOf(ref)
      for (const tag of tags) {
        body = body.replace(new RegExp(`(/OC\\s*/${tag}\\s+BDC)([\\s\\S]*?)(EMC)`, 'g'), (all, a, inner, b) => {
          if (/\bBDC\b/.test(inner)) fail(`il livello ${tag} contiene altri blocchi: non si svuota alla cieca`)
          if (inner.trim()) emptied++
          return `${a} ${b}`
        })
      }
      setStream(ref, body)
    }
  }
  objects.set(num, page)
}

// ── Il file nuovo ──────────────────────────────────────────────────────────
const parts = [header]
let at = header.length
const where = new Array(size).fill(-1)
for (const { num } of order) {
  const src = objects.get(num)
  where[num] = at
  parts.push(src)
  at += src.length
}
let table = `xref\n0 ${size}\n`
for (let n = 0; n < size; n++) table += where[n] < 0 ? `0000000000 ${n === 0 ? '65535' : '00000'} f \n` : `${String(where[n]).padStart(10, '0')} 00000 n \n`
parts.push(table, `${trailer}\nstartxref\n${at}\n%%EOF\n`)
fs.writeFileSync(output, Buffer.from(parts.join(''), 'latin1'))
console.log(`${output}: tolti ${notes} commenti, svuotati ${emptied} blocchi di livello (${layers.join(', ') || 'nessun livello chiesto'})`)
