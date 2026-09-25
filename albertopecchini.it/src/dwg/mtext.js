// Interprete dei codici di formato dei testi multilinea (MTEXT): \P a capo,
// \f e \F carattere, \H altezza, \W larghezza, \C colore, \S frazioni,
// \L \O \K sottolineato/soprallineato/barrato, \U+XXXX Unicode, {} gruppi,
// %%c %%d %%p simboli. Restituisce paragrafi di «run» con lo stile.

const SYMBOLS = { c: 'Ø', d: '°', p: '±', '%': '%' }

/**
 * @param {string} src testo con i codici
 * @returns {{ runs: {text: string, h: number, w: number, bold: boolean, italic: boolean, family: string|null, color: number|null, rgb: number|null, underline: boolean}[] }[]}
 */
export function parseMtext(src) {
  const paragraphs = []
  let runs = []
  const base = { h: 1, w: 1, bold: false, italic: false, family: null, color: null, rgb: null, underline: false }
  let st = { ...base }
  const stack = []
  let buf = ''

  const flush = () => {
    if (buf) runs.push({ text: buf, ...st })
    buf = ''
  }
  const newParagraph = () => {
    flush()
    paragraphs.push({ runs })
    runs = []
  }

  const s = src.replace(/\r\n?/g, '\n')
  let i = 0
  const n = s.length
  while (i < n) {
    const ch = s[i]
    if (ch === '\n') {
      newParagraph()
      i++
      continue
    }
    if (ch === '{') {
      flush()
      stack.push({ ...st })
      i++
      continue
    }
    if (ch === '}') {
      flush()
      if (stack.length) st = stack.pop()
      i++
      continue
    }
    if (ch === '%' && s[i + 1] === '%') {
      const code = (s[i + 2] || '').toLowerCase()
      if (code in SYMBOLS) {
        buf += SYMBOLS[code]
        i += 3
        continue
      }
      if (code === 'u' || code === 'o') {
        flush()
        if (code === 'u') st = { ...st, underline: !st.underline }
        i += 3
        continue
      }
      buf += '%'
      i += 2
      continue
    }
    if (ch !== '\\') {
      buf += ch
      i++
      continue
    }
    // codice di controllo
    const c = s[i + 1]
    if (c === undefined) break
    if (c === '\\' || c === '{' || c === '}') {
      buf += c
      i += 2
      continue
    }
    if (c === 'P' || c === 'N') {
      newParagraph()
      i += 2
      continue
    }
    if (c === '~') {
      buf += ' '
      i += 2
      continue
    }
    if (c === 'U' && s[i + 2] === '+') {
      const hex = s.slice(i + 3, i + 7)
      if (/^[0-9a-fA-F]{4}$/.test(hex)) {
        buf += String.fromCharCode(parseInt(hex, 16))
        i += 7
        continue
      }
    }
    if (c === 'L' || c === 'l') {
      flush()
      st = { ...st, underline: c === 'L' }
      i += 2
      continue
    }
    if (c === 'O' || c === 'o' || c === 'K' || c === 'k' || c === 'X') {
      i += 2
      continue
    }
    if (c === 'S') {
      // frazione impilata: \S numeratore^denominatore; (o / o #)
      const end = s.indexOf(';', i + 2)
      const body = end < 0 ? s.slice(i + 2) : s.slice(i + 2, end)
      const m = body.match(/^(.*?)[\^/#](.*)$/)
      buf += m ? `${m[1].trim()}/${m[2].trim()}` : body
      i = end < 0 ? n : end + 1
      continue
    }
    // codici con argomento fino al punto e virgola: \f \F \H \W \C \c \Q \T \A \p
    if ('fFHWCcQTApM'.includes(c)) {
      const end = s.indexOf(';', i + 2)
      const arg = end < 0 ? s.slice(i + 2) : s.slice(i + 2, end)
      flush()
      if (c === 'f' || c === 'F') {
        const parts = arg.split('|')
        const family = parts[0].trim()
        const next = { ...st, family: family || null }
        for (const p of parts.slice(1)) {
          if (p[0] === 'b') next.bold = p[1] === '1'
          if (p[0] === 'i') next.italic = p[1] === '1'
        }
        st = next
      } else if (c === 'H') {
        const rel = arg.endsWith('x')
        const v = parseFloat(arg)
        if (Number.isFinite(v) && v > 0) st = { ...st, h: rel ? st.h * v : v }
      } else if (c === 'W') {
        const rel = arg.endsWith('x')
        const v = parseFloat(arg)
        if (Number.isFinite(v) && v > 0) st = { ...st, w: rel ? st.w * v : v }
      } else if (c === 'C') {
        const v = parseInt(arg, 10)
        if (Number.isFinite(v)) st = { ...st, color: v, rgb: null }
      } else if (c === 'c') {
        const v = parseInt(arg, 10)
        if (Number.isFinite(v)) st = { ...st, rgb: ((v & 0xff) << 16) | (v & 0xff00) | ((v >> 16) & 0xff), color: null }
      }
      i = end < 0 ? n : end + 1
      continue
    }
    // codice sconosciuto: si salta la lettera
    i += 2
  }
  newParagraph()
  return paragraphs
}

/** Il testo puro, senza codici (per le ricerche e i controlli). */
export function plainMtext(src) {
  return parseMtext(src)
    .map((p) => p.runs.map((r) => r.text).join(''))
    .join('\n')
}
