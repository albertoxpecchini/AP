// ─────────────────────────────────────────────────────────────────────────────
//  SISTEMA VISIVO — contenuti della pagina /stile/: le tavole del piano
//  (posizione e misura), palette, ruoli semantici, caratteri, scala, spazi,
//  raggi, elementi grafici, movimento, mascotte e burattini.
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
  { key: 'mascotte', index: '05', title: 'Mascotte e burattini', short: 'Mascotte', x: 7600, y: 0, w: 1440, h: 2180 },
]

// ── 01 · Colore ──────────────────────────────────────────────────────────────

// Dal 2.11.2026: la carta calda di reflection.ai, l'avorio di anthropic.com, l'inchiostro quasi nero.
export const palette = [
  { name: 'Carta', hex: '#F8F6F0', token: '--c-paper', use: 'Fondo di pagina (la carta calda di reflection.ai).' },
  { name: 'Carta 2', hex: '#F1EDE1', token: '--c-paper-2', use: 'Sezioni «tint», fondo delle tavole.' },
  { name: 'Carta 3', hex: '#E8E3D6', token: '--c-paper-3', use: 'Terzo piano, campi del modulo.' },
  { name: 'Avorio', hex: '#FAF9F5', token: '--c-ivory', use: 'Le schede (--card): quattro aree, convinzioni, studio, sottomenu.' },
  { name: 'Grafite', hex: '#525252', token: '--c-graphite', use: 'Testo secondario ed etichette.' },
  { name: 'Inchiostro', hex: '#0A0A0A', token: '--c-ink', use: 'Piè di pagina, numeri, manifesto, terminale, tasto «serio».' },
  { name: 'Inchiostro 2', hex: '#171717', token: '--c-ink-2', use: 'Riquadri su fondo scuro.' },
  { name: 'Minio', hex: '#E5481F', token: '--c-minio', use: 'Accento: il tasto primario, l’alone sulle schede, l’avanzamento, la selezione.' },
  { name: 'Minio profondo', hex: '#B5360F', token: '--c-minio-deep', use: 'Accento come testo (i corsivi dei titoli) e anello di fuoco su carta.' },
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
      { color: '#f8f6f0', border: true, token: '--bg', name: 'Carta' },
      { color: '#faf9f5', border: true, token: '--card', name: 'Avorio' },
      { color: '#1a1b1a', token: '--fg', name: 'Quasi nero' },
      { color: '#525252', token: '--muted', name: 'Grafite' },
      { line: ['rgb(26 27 26 / 0.12)', 'rgb(26 27 26 / 0.3)'], token: '--line / --line-strong', name: 'Inchiostro al 12% / 30%' },
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
      { color: '#0a0a0a', border: true, token: '--bg', name: 'Inchiostro' },
      { color: '#171717', border: true, token: '--bg-2', name: 'Inchiostro 2' },
      { color: '#f8f6f0', token: '--fg', name: 'Carta' },
      { color: '#a3a3a3', token: '--muted', name: '#A3A3A3' },
      { line: ['rgb(248 246 240 / 0.14)', 'rgb(248 246 240 / 0.4)'], token: '--line / --line-strong', name: 'Carta al 14% / 40%' },
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
    name: 'Hanken Grotesk',
    axis: 'wght 100–900',
    alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789 àèéìòù',
    note: 'Testo, navigazione, titoli piccoli (h3, h4) a peso 520. Un grottesco pulito che non chiede attenzione.',
  },
  {
    key: 'serif',
    name: 'Fraunces',
    axis: 'wght 100–900 · opsz 9–144',
    alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789',
    note: 'Titoli grandi, numeri grandi e corsivi d’accento: leggero (330–380) con la misura ottica al massimo, così le grazie si allungano e le curve si ammorbidiscono.',
  },
  {
    key: 'mono',
    name: 'Geist Mono',
    axis: 'wght 100–900',
    alphabet: 'abcdefghijklmnopqrstuvwxyz 0123456789 · — / 45°14′N',
    note: 'Etichette, pillole, coordinate, cartigli e il terminale della home: il carattere dei terminali, a 13 px, tutto minuscolo come il resto del sito.',
  },
]

// Asse della misura ottica di Fraunces: le quattro misure usate nel sito.
export const widths = [
  { pct: '144', weight: 330, track: '-0.028em', use: 'hero, invito finale' },
  { pct: '144', weight: 340, track: '-0.025em', use: 'titoli di pagina, h1' },
  { pct: '144', weight: 380, track: '-0.02em', use: 'h2, indice dei lavori' },
  { pct: '72', weight: 400, track: '-0.01em', use: 'corsivo nel testo' },
]

// Scala fluida: valore a 1440 px e intervallo minimo → massimo.
export const scale = [
  { token: '--fs-display', meta: '100 px · 44 → 112 · Fraunces 330', sample: 'Casa, sito, marchio.', style: 'display' },
  { token: '--fs-h1', meta: '74 px · 40 → 80 · Fraunces 340', sample: 'Ultimi lavori.', style: 'h1' },
  { token: '--fs-h2', meta: '53 px · 30 → 56 · Fraunces 380', sample: 'Parliamo del tuo prossimo progetto.', accent: 'prossimo', style: 'h2' },
  { token: '--fs-h3', meta: '32 px · 22 → 30 · Hanken 520', sample: 'Quattro aree, un interlocutore', style: 'h3' },
  { token: '--fs-h4', meta: '22 px · 18 → 22', sample: 'Mobile progettato a parte, non ridotto', style: 'h4' },
  { token: '--fs-lead', meta: '24 px · 18 → 24', sample: 'Rilevo un edificio al millimetro, scrivo l’interfaccia che lo racconta, disegno il marchio di chi lo abita.', style: 'lead' },
  { token: '--fs-body', meta: '17 px · interlinea 1,6', sample: 'Struttura prima dell’estetica, contenuti veri prima dei layout, prestazioni misurate. Scrivo il codice a mano: niente temi, niente page builder.', style: 'body' },
  { token: '--fs-small', meta: '15 px', sample: 'Raccontami il progetto in due righe. Rispondo entro un giorno lavorativo.', style: 'small' },
  { token: '--fs-label', meta: '13 px · Geist Mono', sample: 'Aggiornati al novembre 2026', style: 'label' },
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
  ['--section', '160', '72 → 160 · tra sezioni'],
  ['--max', '1216', 'colonna di lettura'],
  ['--header-h', '84', '72 sotto i 768 px'],
]

export const radii = [
  { token: '--r-1', px: 6, use: '6 · tag, kbd' },
  { token: '--r-2', px: 12, use: '12 · miniature, fila dei siti' },
  { token: '--r-3', px: 20, use: '20 · schede, terminale, modulo' },
  { token: '--r-4', px: 28, use: '28 · manifesto, scheda dello studio' },
  { token: '--r-device', px: 36, use: '36 · telefoni' },
  { token: '--r-full', px: 999, use: 'tasti, pillole, chip', pill: true },
]

// Curve di movimento: i quattro numeri di cubic-bezier().
export const easings = [
  { token: '--ease-silk', bezier: '0.22, 1, 0.36, 1', use: 'Le rivelazioni sfocate, i tasti che si sollevano, la luce.' },
  { token: '--ease-out', bezier: '0.16, 1, 0.3, 1', use: 'Ingressi, fili, testata.' },
  { token: '--ease-in-out', bezier: '0.65, 0, 0.35, 1', use: 'Tavole che scorrono, monogramma, tendina.' },
]

export const durations = [
  { token: '--t-1', label: '0,18 s', s: 0.18 },
  { token: '--t-2', label: '0,36 s', s: 0.36 },
  { token: '--t-3', label: '0,7 s', s: 0.7 },
  { token: '--t-4', label: '1,1 s', s: 1.1 },
  { token: '--t-5', label: '1,6 s', s: 1.6 },
]

export const motionNote = 'Rivelazioni: up, soft, fade, clip, line, draw e parola per parola; up, soft e le parole arrivano sfocate (blur 6–10 px) e si mettono a fuoco. Poi l’aurora, il fascio, la luce che segue il mouse e i bordi che si accendono.'

// ── 05 · Mascotte e burattini ────────────────────────────────────────────────
// Gli animali del sito, vivi sulla tavola (puppet() in ui.js): nome, larghezza
// sulla tavola in px, carattere.

export const zoo = [
  { key: 'lumaca', name: 'La chiocciola gigante africana', w: 250, trait: 'Toccata, ritira i peduncoli come una chiocciola vera e li riallunga piano.' },
  { key: 'nutria', name: 'La nutria golosa', w: 250, trait: 'Mangia un ciuffo d’erba e, finito, ne strappa un altro dal cespo; se ti avvicini si blocca con gli occhi sbarrati; toccata sulla testa ingoia tutto, sul corpo si scrolla; sollevata scalcia.' },
  { key: 'airone', name: 'L’airone elegante', w: 132, trait: 'Lento e composto, il collo smorzato; toccato fa l’inchino.' },
  { key: 'gazza', name: 'La gazza furbissima', w: 250, trait: 'Testa a scatti; se ti avvicini alla chiave la nasconde, poi l’occhiolino.' },
  { key: 'vespa', name: 'La vespa cattiva ma precisa', w: 200, trait: 'Si libra e punta il pungiglione dove sei; vicina si arrabbia, toccata punge.' },
]

// Il sesto animale non sta nel piè di pagina ma in home, e il suo numero è
// riempire d'inchiostro il cognome: sulla tavola ha una fascia sua, con una
// scena che funziona come quella vera (src/client/ink.js).
export const aragosta = {
  name: 'L’aragosta di fiume',
  trait: 'Il gambero rosso del Mincio. Dorme sopra «Disponibile per nuovi incarichi»; se stai fermo si sveglia di colpo, prende l’annaffiatoio azzurro e versa inchiostro nella prima I. Il cognome è un recipiente solo: il liquido corre da una lettera all’altra, ondeggia quando sposti il piano e gocciola sul righello.',
  facts: [
    { value: '2,2 s', label: 'fermi, e si sveglia' },
    { value: '< 3 s', label: 'per riempirlo' },
    { value: '5 s', label: 'pieno, poi perde' },
    { value: '½', label: 'mai sotto la metà' },
  ],
  hint: 'Resta fermo due secondi, o toccala.',
}

// L'animale smontato nella seconda fascia, e quanto si riducono i suoi pezzi.
export const exploded = { key: 'gazza', scale: 0.46 }

export const puppetRules = [
  { name: 'Occhi', text: 'Il modello li disegna bianchi e tondi; sopra ci sono quelli del sito: pupilla al 46%, palpebra del colore della pelle, ognuno per conto suo.' },
  { name: 'Bordo adesivo', text: 'Carta #F3F1EC intorno alla sagoma, come le figurine: sul fondo inchiostro del piè di pagina gli animali restano staccati.' },
  { name: 'Un solo minio', text: 'Un dettaglio per animale: l’apice del guscio, i denti della nutria, il papillon, il cartellino della chiave, la punta del pungiglione. L’aragosta fa eccezione: il rosso è lei.' },
  { name: 'Fermacampioni', text: 'Dischi dorati sui perni: lo script li trova da solo, il pezzo ci gira intorno e torna a riposo su una molla.' },
  { name: 'Movimento ridotto', text: 'Con prefers-reduced-motion restano gli sguardi: niente battiti di palpebre, salti né ritiri animati.' },
]

export const puppetPlaces = [
  { where: 'Testata', what: 'Fino al 2.11.2026 la testa della chiocciola accanto al marchio; ora la testata è sottile e la chiocciola sta solo nel piè di pagina.' },
  { where: 'Home e /aragosta/', what: 'L’aragosta dorme sopra la disponibilità e, se stai fermo, riempie d’inchiostro il cognome (più piccolo di prima); in /aragosta/ la tavola com’era, a grandezza naturale.' },
  { where: 'Piè di pagina', what: 'I cinque burattini intorno alla firma; la vespa si libra sopra.' },
  { where: '404', what: 'La gazza tiene nel becco la pagina che manca, e scappa lungo la quota.' },
  { where: 'Contatti', what: 'L’airone del Mincio accanto alla carta, che guarda la sede.' },
]
