// Derivazione del tema email dal CSS del sito.
//
// Il sito è la fonte estetica, non il modello di layout: da `src/styles/tokens.css`
// si estraggono i valori grezzi (colori, font, spazi, raggi) e si traducono in un
// tema pensato per i client email — dove clamp(), var() e le unità viewport non
// esistono. Il CSS del sito non viene MAI modificato: qui si legge soltanto.
import fs from 'node:fs'
import path from 'node:path'
import { paths } from './paths.js'

/** Estrae le dichiarazioni `--nome: valore;` da un blocco di CSS. */
function parseCustomProperties(css, selector) {
  const start = css.indexOf(selector)
  if (start === -1) return {}
  const open = css.indexOf('{', start)
  if (open === -1) return {}

  let depth = 0
  let end = open
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === '{') depth += 1
    else if (css[i] === '}') {
      depth -= 1
      if (depth === 0) {
        end = i
        break
      }
    }
  }

  const block = css.slice(open + 1, end)
  const out = {}
  // Commenti via, altrimenti finiscono nei valori.
  const clean = block.replace(/\/\*[\s\S]*?\*\//g, '')
  for (const match of clean.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    out[match[1]] = match[2].trim()
  }
  return out
}

/** Risolve `var(--x)` a catena, con un tetto sulle iterazioni per evitare cicli. */
function resolveVars(value, dict, depth = 0) {
  if (depth > 10 || typeof value !== 'string') return value
  const replaced = value.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)/g, (_, name, fallback) => {
    const next = dict[name]
    if (next !== undefined) return next
    return fallback ? fallback.trim() : ''
  })
  return replaced === value ? value : resolveVars(replaced, dict, depth + 1)
}

/**
 * clamp(min, preferred, max) → un valore fisso adatto all'email.
 * I client non calcolano le unità viewport: si prende il minimo, che corrisponde
 * alla resa su schermo stretto ed è la scelta prudente per la posta.
 */
function flattenClamp(value, { pick = 'min' } = {}) {
  const match = /clamp\(\s*([^,]+),\s*([^,]+),\s*([^)]+)\)/.exec(value)
  if (!match) return value.trim()
  return (pick === 'max' ? match[3] : match[1]).trim()
}

function remToPx(value, base = 16) {
  const match = /^(-?[\d.]+)rem$/.exec(String(value).trim())
  if (!match) return null
  return Math.round(parseFloat(match[1]) * base)
}

/**
 * `--font-sans` del sito → stack per email.
 *
 * Due accortezze rispetto allo stack del sito:
 *  - le famiglie logiche CSS (`ui-sans-serif`, `system-ui`, `-apple-system`) non
 *    sono riconosciute dai client di posta datati e vengono scartate;
 *  - le parole chiave generiche (`sans-serif`, `monospace`, `serif`) chiudono la
 *    catena: qualsiasi nome dopo di esse non verrebbe mai raggiunto.
 */
const GENERIC_FAMILIES = new Set(['sans-serif', 'serif', 'monospace', 'cursive', 'fantasy'])
const LOGICAL_FAMILIES = new Set(['ui-sans-serif', 'ui-serif', 'ui-monospace', 'ui-rounded', 'system-ui', '-apple-system'])

function emailFontStack(siteStack, extraFallbacks) {
  const families = String(siteStack)
    .split(',')
    .map((part) => part.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean)

  const seen = new Set()
  const concrete = []
  let generic = ''

  for (const name of [...families, ...extraFallbacks]) {
    const key = name.toLowerCase()
    if (LOGICAL_FAMILIES.has(key)) continue
    if (GENERIC_FAMILIES.has(key)) {
      generic ||= key // si tiene la prima generica incontrata, da mettere in coda
      continue
    }
    if (seen.has(key)) continue
    seen.add(key)
    concrete.push(name)
  }

  const ordered = generic ? [...concrete, generic] : concrete
  return ordered.map((name) => (/[^a-zA-Z0-9-]/.test(name) ? `'${name}'` : name)).join(', ')
}

/**
 * Costruisce il tema email leggendo i token del sito.
 * @returns {object} tema normalizzato, serializzabile in config/email-theme.json
 */
export function deriveEmailTheme() {
  const tokensPath = path.join(paths.stylesDir, 'tokens.css')
  const css = fs.readFileSync(tokensPath, 'utf8')

  const root = parseCustomProperties(css, ':root')
  const ink = parseCustomProperties(css, "[data-theme='ink']")

  const dict = { ...root }
  const value = (name, fallback = '') => {
    const raw = dict[name]
    if (raw === undefined) return fallback
    return resolveVars(raw, dict).trim()
  }

  const inkDict = { ...root, ...ink }
  const inkValue = (name, fallback = '') => {
    const raw = inkDict[name]
    if (raw === undefined) return fallback
    return resolveVars(raw, inkDict).trim()
  }

  const fsBody = value('--fs-body', '1.0625rem')
  const fsSmall = value('--fs-small', '0.9375rem')
  const fsLabel = value('--fs-label', '0.6875rem')

  return {
    source: 'src/styles/tokens.css',
    derivedAt: new Date().toISOString().slice(0, 10),

    color: {
      paper: value('--c-paper', '#f3f1ec'),
      paper2: value('--c-paper-2', '#eae7e0'),
      paper3: value('--c-paper-3', '#dedad1'),
      ink: value('--c-ink', '#10110f'),
      ink2: value('--c-ink-2', '#1b1c19'),
      ink3: value('--c-ink-3', '#2b2c28'),
      graphite: value('--c-graphite', '#5a5b55'),
      accent: value('--c-minio', '#e5481f'),
      accentDeep: value('--c-minio-deep', '#b5360f'),
      accentBright: value('--c-minio-bright', '#ff6a3d'),
      onAccent: value('--on-accent', '#10110f'),
      // `--line` del sito è in rgb()/alfa: molti client non compongono l'alfa
      // su sfondi complessi, quindi si usa una tinta piena equivalente.
      line: '#d5d1c8',
      lineStrong: '#b4b0a6',
      // Tema scuro del sito, usato dal footer dell'email.
      darkBg: inkValue('--bg', '#10110f'),
      darkBg2: inkValue('--bg-2', '#1b1c19'),
      darkFg: inkValue('--fg', '#f3f1ec'),
      darkMuted: inkValue('--muted', '#a5a59c'),
      darkAccent: inkValue('--accent', '#ff6a3d'),
      darkLine: '#3a3b36',
    },

    font: {
      sans: emailFontStack(value('--font-sans'), ['Helvetica Neue', 'Segoe UI', 'Arial', 'sans-serif']),
      mono: emailFontStack(value('--font-mono'), ['Consolas', 'Courier New', 'monospace']),
      serif: emailFontStack(value('--font-serif'), ['Georgia', 'Times New Roman', 'serif']),
      primaryFamily: 'Archivo Variable',
    },

    size: {
      // I titoli del sito sono enormi (fino a 5.5rem): per l'email si prende il
      // minimo della scala e si riduce ancora, perché la colonna è di 600px.
      h1: Math.min(34, remToPx(flattenClamp(value('--fs-h1'))) ?? 34),
      h2: Math.min(26, remToPx(flattenClamp(value('--fs-h2'))) ?? 26),
      h3: Math.min(20, remToPx(flattenClamp(value('--fs-h3'))) ?? 20),
      lead: Math.min(19, remToPx(flattenClamp(value('--fs-lead'))) ?? 19),
      body: remToPx(fsBody) ?? 17,
      small: remToPx(fsSmall) ?? 15,
      label: Math.max(11, remToPx(fsLabel) ?? 11),
    },

    leading: {
      tight: parseFloat(value('--lh-tight', '0.94')),
      snug: parseFloat(value('--lh-snug', '1.12')),
      body: parseFloat(value('--lh-body', '1.6')),
    },

    tracking: {
      label: value('--track-label', '0.08em'),
      display: '-0.02em',
    },

    space: {
      s1: remToPx(value('--sp-1')) ?? 4,
      s2: remToPx(value('--sp-2')) ?? 8,
      s3: remToPx(value('--sp-3')) ?? 12,
      s4: remToPx(value('--sp-4')) ?? 16,
      s5: remToPx(value('--sp-5')) ?? 24,
      s6: remToPx(value('--sp-6')) ?? 32,
      s7: remToPx(value('--sp-7')) ?? 48,
    },

    radius: {
      r0: value('--r-0', '0'),
      r1: value('--r-1', '2px'),
      r2: value('--r-2', '6px'),
      r3: value('--r-3', '12px'),
    },

    layout: {
      // Larghezza classica per la posta: sotto la soglia di ritaglio di Outlook.
      width: 600,
      gutter: 28,
    },
  }
}

/** Rigenera e salva `config/email-theme.json`. */
export function writeEmailTheme() {
  const theme = deriveEmailTheme()
  fs.mkdirSync(paths.config, { recursive: true })
  fs.writeFileSync(paths.emailTheme, `${JSON.stringify(theme, null, 2)}\n`, 'utf8')
  return theme
}

/** Tema dalla cache se presente e aggiornato, altrimenti derivato al volo. */
export function loadEmailTheme() {
  if (!fs.existsSync(paths.emailTheme)) return writeEmailTheme()
  try {
    const cached = JSON.parse(fs.readFileSync(paths.emailTheme, 'utf8'))
    const tokensPath = path.join(paths.stylesDir, 'tokens.css')
    // Se i token del sito sono più recenti del tema, si rigenera.
    if (fs.statSync(tokensPath).mtimeMs > fs.statSync(paths.emailTheme).mtimeMs) {
      return writeEmailTheme()
    }
    return cached
  } catch {
    return writeEmailTheme()
  }
}
