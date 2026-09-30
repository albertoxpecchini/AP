// Stili dell'email: versioni con un nome, come le firme. Modulo puro.
//
//   «Metà settembre» (18.09.2026)  carta e inchiostro del sito: colonna da
//       600px centrata, firma nel riquadro scuro, Archivo incorporato. Il tema
//       è derivato da src/styles/tokens.css (theme.js).
//   «Fine settembre» (30.09.2026)  bianco e nero, Helvetica, tutto allineato a
//       sinistra, nessun riquadro: la gerarchia la fanno i titoli (H1…H6), il
//       peso del carattere e qualche filetto. I colori NON vengono dal sito.
//
// Lo stile si sceglie per casella, con `style` in config/sender-profiles.json;
// dove manca vale quello corrente. Le versioni precedenti restano qui, così
// un'email di metà settembre si rigenera identica.
//
// I renderer (template.js, markdown.js, footer-html.js) guardano `theme.style`
// per scegliere l'impianto; i nomi delle chiavi del tema sono gli stessi nei due
// stili, così il codice comune (anteprima, pulsanti) funziona con entrambi.

export const STILI = {
  'meta-settembre': { id: 'meta-settembre', label: 'Metà settembre', createdAt: '2026-09-18' },
  'fine-settembre': { id: 'fine-settembre', label: 'Fine settembre', createdAt: '2026-09-30' },
}

export const STILE_CORRENTE = 'fine-settembre'

/** `Metà settembre`, `meta-settembre`, `fine settembre`… → id; sconosciuto o vuoto → corrente. */
export function resolveStyle(value) {
  const key = String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
  return STILI[key] ? key : STILE_CORRENTE
}

const HELVETICA = "'Helvetica Neue', Helvetica, Arial, sans-serif"

/** «Fine settembre»: bianco, nero e due grigi per il testo secondario e i filetti. */
const FINE_SETTEMBRE = {
  style: 'fine-settembre',
  source: 'stile «Fine settembre» (bianco e nero, Helvetica)',
  color: {
    paper: '#ffffff',
    paper2: '#ffffff',
    paper3: '#ffffff',
    ink: '#000000',
    ink2: '#000000',
    ink3: '#333333',
    graphite: '#595959',
    accent: '#000000',
    accentDeep: '#000000',
    accentBright: '#333333',
    onAccent: '#ffffff',
    line: '#d9d9d9',
    lineStrong: '#000000',
    darkBg: '#000000',
    darkBg2: '#1a1a1a',
    darkFg: '#ffffff',
    darkMuted: '#a6a6a6',
    darkAccent: '#ffffff',
    darkLine: '#333333',
  },
  font: {
    sans: HELVETICA,
    mono: "Menlo, Consolas, 'Courier New', monospace",
    serif: HELVETICA,
    primaryFamily: 'Helvetica',
    // Helvetica c'è già su quasi tutti i sistemi (Arial dove manca): niente
    // carattere incorporato, quindi email.html ed email-lite.html coincidono.
    embed: false,
  },
  size: { h1: 32, h2: 24, h3: 20, h4: 17, h5: 15, h6: 12, lead: 19, body: 16, small: 14, label: 12 },
  leading: { tight: 1.05, snug: 1.2, body: 1.55 },
  tracking: { label: '0.08em', display: '-0.02em' },
  space: { s1: 4, s2: 8, s3: 12, s4: 16, s5: 24, s6: 32, s7: 48 },
  radius: { r0: '0', r1: '0', r2: '0', r3: '0' },
  layout: { width: 640, gutter: 32 },
}

/**
 * Tema con cui rendere l'email.
 * @param {string} styleId lo stile della casella (anche vuoto)
 * @param {object} siteTheme il tema derivato dal sito (serve a «Metà settembre»)
 */
export function themeFor(styleId, siteTheme) {
  return resolveStyle(styleId) === 'meta-settembre' ? { ...siteTheme, style: 'meta-settembre' } : FINE_SETTEMBRE
}
