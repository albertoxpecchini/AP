// Micro-utilità per i template: niente framework, solo stringhe.

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

/** Escape di testo proveniente dai dati. */
export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c])

/**
 * Tagged template: unisce gli array e ignora null / undefined / false,
 * così nei template si può scrivere `${cond && html`...`}` e `${list.map(...)}`.
 */
export function html(strings, ...values) {
  let out = ''
  strings.forEach((chunk, i) => {
    out += chunk
    if (i < values.length) out += flatten(values[i])
  })
  return out
}

function flatten(value) {
  if (value === null || value === undefined || value === false || value === true) return ''
  if (Array.isArray(value)) return value.map(flatten).join('')
  return String(value)
}

/** Serializza un oggetto in attributi HTML (salta i valori falsy, `true` → attributo booleano). */
export function attrs(map = {}) {
  return Object.entries(map)
    .filter(([, v]) => v !== null && v !== undefined && v !== false)
    .map(([k, v]) => (v === true ? ` ${k}` : ` ${k}="${esc(v)}"`))
    .join('')
}

/** Unisce nomi di classe scartando i falsy. */
export const cx = (...parts) => parts.flat().filter(Boolean).join(' ')

/** 7 → "07" */
export const pad = (n, len = 2) => String(n).padStart(len, '0')

/** JSON sicuro da inserire in un <script type="application/ld+json">. */
export const jsonLd = (data) => JSON.stringify(data).replace(/</g, '\\u003c')
