// ─────────────────────────────────────────────────────────────────────────────
//  SISTEMA VISIVO — contenuti della pagina /stile/: le tavole del piano
//  (posizione e misura), palette, ruoli semantici, caratteri, scala, spazi,
//  raggi, elementi grafici, movimento.
//
//  Qui i valori sono DESCRITTI; a definirli è src/styles/tokens.css. Se lì
//  cambia un colore o una misura, va aggiornata anche la voce corrispondente.
// ─────────────────────────────────────────────────────────────────────────────

export const canvasTitle = 'Alberto Pecchini — sistema visivo'

// Tavole sul piano: chiave, indice, titolo, posizione e misura in px.
// 80 px tra una tavola e l'altra; il titolo del piano sta 330 px sopra.
export const boards = [
  { key: 'home', index: '00', title: 'Home · hero a 1440 px', short: 'Home', x: 0, y: 0, w: 1440, h: 900 },
  { key: 'colore', index: '01', title: 'Colore', short: 'Colore', x: 1520, y: 0, w: 1440, h: 1640 },
  { key: 'tipografia', index: '02', title: 'Tipografia', short: 'Tipografia', x: 3040, y: 0, w: 1440, h: 1880 },
  { key: 'forma', index: '03', title: 'Forma e movimento', short: 'Forma', x: 4560, y: 0, w: 1440, h: 1440 },
  { key: 'componenti', index: '04', title: 'Componenti', short: 'Componenti', x: 6080, y: 0, w: 1440, h: 2080 },
]

// ── 01 · Colore ──────────────────────────────────────────────────────────────

export const palette = [
  { name: 'Carta', hex: '#F3F1EC', token: '--c-paper', use: 'Fondo di pagina.' },
  { name: 'Carta 2', hex: '#EAE7E0', token: '--c-paper-2', use: 'Riquadri, tavole, sezioni «tint».' },
  { name: 'Carta 3', hex: '#DEDAD1', token: '--c-paper-3', use: 'Terzo piano, fondo delle tavole «tint».' },
  { name: 'Grafite', hex: '#5A5B55', token: '--c-graphite', use: 'Testo secondario ed etichette.' },
  { name: 'Inchiostro', hex: '#10110F', token: '--c-ink', use: 'Testo, bottoni pieni, sezioni scure.' },
  { name: 'Inchiostro 2', hex: '#1B1C19', token: '--c-ink-2', use: 'Riquadri su fondo scuro.' },
  { name: 'Inchiostro 3', hex: '#2B2C28', token: '--c-ink-3', use: 'Terzo piano scuro.' },
  { name: 'Minio', hex: '#E5481F', token: '--c-minio', use: 'Accento: riempimenti, avanzamento, selezione.' },
  { name: 'Minio profondo', hex: '#B5360F', token: '--c-minio-deep', use: 'Accento come testo e anello di fuoco su carta.' },
  { name: 'Minio acceso', hex: '#FF6A3D', token: '--c-minio-bright', use: 'Accento su fondo inchiostro.' },
]

// Ruoli semantici nei due temi. `line` = coppia filo / filo forte.
export const themes = [
  {
    key: 'paper',
    title: 'Tema carta · predefinito',
    attr: 'data-theme="paper"',
    contrast: 'Contrasto 4,8:1',
    accent: 'var(--c-minio)',
    rows: [
      { color: '#f3f1ec', border: true, token: '--bg', name: 'Carta' },
      { color: '#eae7e0', border: true, token: '--bg-2', name: 'Carta 2' },
      { color: '#10110f', token: '--fg', name: 'Inchiostro' },
      { color: '#5a5b55', token: '--muted', name: 'Grafite' },
      { line: ['rgb(16 17 15 / 0.16)', 'rgb(16 17 15 / 0.42)'], token: '--line / --line-strong', name: 'Inchiostro al 16% / 42%' },
      { color: '#e5481f', token: '--accent', name: 'Minio' },
      { color: '#b5360f', token: '--accent-text', name: 'Minio profondo' },
    ],
  },
  {
    key: 'ink',
    title: 'Tema inchiostro · sezioni',
    attr: 'data-theme="ink"',
    contrast: 'Contrasto 6,6:1',
    accent: 'var(--c-minio-bright)',
    rows: [
      { color: '#10110f', border: true, token: '--bg', name: 'Inchiostro' },
      { color: '#1b1c19', border: true, token: '--bg-2', name: 'Inchiostro 2' },
      { color: '#f3f1ec', token: '--fg', name: 'Carta' },
      { color: '#a5a59c', token: '--muted', name: '#A5A59C' },
      { line: ['rgb(243 241 236 / 0.17)', 'rgb(243 241 236 / 0.45)'], token: '--line / --line-strong', name: 'Carta al 17% / 45%' },
      { color: '#ff6a3d', token: '--accent', name: 'Minio acceso' },
      { color: '#ff6a3d', token: '--accent-text', name: 'Minio acceso' },
    ],
  },
]

export const colorNotes = {
  foot: 'Sopra il minio si scrive sempre in inchiostro: il bianco non raggiunge il livello AA. L’unico altro colore è il verde #2F9E5B del punto «disponibile per nuovi incarichi».',
  status: '#2F9E5B · solo stato',
}

// ── 02 · Tipografia ──────────────────────────────────────────────────────────

export const typefaces = [
  {
    key: 'sans',
    name: 'Archivo Variable',
    axis: 'wght 100–900 · wdth 62–125%',
    alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789 àèéìòù',
    note: 'Titoli, testo, navigazione. Una sola famiglia per quasi tutto, modulata con peso e larghezza.',
  },
  {
    key: 'serif',
    name: 'Instrument Serif',
    axis: 'Corsivo 400',
    alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789',
    note: 'Solo accento: una parola per titolo, ingrandita a 1,07em perché accanto al grottesco non sembri più piccola.',
  },
  {
    key: 'mono',
    name: 'IBM Plex Mono',
    axis: '400 · 500',
    alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789 · — / 45°14′N',
    note: 'Etichette, bottoni, coordinate, cartigli: maiuscolo, spaziatura 0,07–0,08em.',
  },
]

// Asse della larghezza di Archivo: le quattro larghezze usate nel sito.
export const widths = [
  { pct: '78%', weight: 540, track: '-0.05em', use: 'numeri e statistiche' },
  { pct: '86%', weight: 600, track: '-0.055em', use: 'nome in copertina, invito' },
  { pct: '94%', weight: 560, track: '-0.035em', use: 'titoli h1–h3' },
  { pct: '100%', weight: 540, track: '-0.015em', use: 'h4, testo corrente' },
]

// Scala fluida: valore a 1440 px e intervallo minimo → massimo.
export const scale = [
  { token: '--fs-display', meta: '115 px · 44 → 128', sample: 'Tre discipline', style: 'display' },
  { token: '--fs-h1', meta: '84 px · 38 → 88', sample: 'Lavori scelti', style: 'h1' },
  { token: '--fs-h2', meta: '58 px · 30 → 60', sample: 'Parliamo del tuo prossimo progetto.', accent: 'prossimo', style: 'h2' },
  { token: '--fs-h3', meta: '32 px · 22 → 32', sample: 'Quattro aree, un interlocutore', style: 'h3' },
  { token: '--fs-h4', meta: '22 px · 18 → 22', sample: 'Mobile progettato a parte, non ridotto', style: 'h4' },
  { token: '--fs-lead', meta: '24 px · 18 → 24', sample: 'Rilevo un edificio al millimetro, scrivo l’interfaccia che lo racconta, disegno il marchio di chi lo abita.', style: 'lead' },
  { token: '--fs-body', meta: '17 px · interlinea 1,6', sample: 'Struttura prima dell’estetica, contenuti veri prima dei layout, prestazioni misurate. Scrivo il codice a mano: niente temi, niente page builder.', style: 'body' },
  { token: '--fs-small', meta: '15 px', sample: 'Raccontami il progetto in due righe. Rispondo entro un giorno lavorativo.', style: 'small' },
  { token: '--fs-label', meta: '11 px · mono', sample: 'Aggiornati al settembre 2026', style: 'label' },
]

// ── 03 · Forma e movimento ───────────────────────────────────────────────────

export const spaces = [
  ['--sp-1', 4],
  ['--sp-2', 8],
  ['--sp-3', 12],
  ['--sp-4', 16],
  ['--sp-5', 24],
  ['--sp-6', 32],
  ['--sp-7', 48],
  ['--sp-8', 64],
  ['--sp-9', 96],
  ['--sp-10', 128],
]

export const layoutTokens = [
  ['--gutter', '50', '16 → 56 · margine laterale'],
  ['--col-gap', '27', '12 → 32 · tra colonne'],
  ['--section', '156', '72 → 176 · tra sezioni'],
  ['--max', '1680', 'larghezza del contenitore'],
  ['--header-h', '76', '64 sotto i 768 px'],
]

export const radii = [
  { token: '--r-0', px: 0, use: '0 · riquadri' },
  { token: '--r-1', px: 2, use: '2 · bottoni, tag' },
  { token: '--r-2', px: 6, use: '6' },
  { token: '--r-3', px: 12, use: '12' },
  { token: '--r-device', px: 36, use: '36 · telefoni' },
  { token: '--r-full', px: 999, use: 'chip', pill: true },
]

// Curve di movimento: i quattro numeri di cubic-bezier().
export const easings = [
  { token: '--ease-out', bezier: '0.16, 1, 0.3, 1', use: 'Ingressi, bottoni, fili.' },
  { token: '--ease-in-out', bezier: '0.65, 0, 0.35, 1', use: 'Tavole che scorrono, monogramma.' },
  { token: '--ease-soft', bezier: '0.33, 1, 0.68, 1', use: 'Movimenti morbidi.' },
]

export const durations = [
  { token: '--t-1', label: '0,15 s', s: 0.15 },
  { token: '--t-2', label: '0,3 s', s: 0.3 },
  { token: '--t-3', label: '0,55 s', s: 0.55 },
  { token: '--t-4', label: '0,8 s', s: 0.8 },
]

export const motionNote = 'Rivelazioni: up, fade, scale, clip, line, draw e parola per parola.'
