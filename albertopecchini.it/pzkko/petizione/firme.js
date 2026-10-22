// Le firme della petizione «pzkko.it è un bel sito?» (index.html, api/firme.mjs), disegnate come le scrive la gente:
// ognuna a mano, con la sua biro (blu, nera, rossa) e la sua calligrafia, un po' storta, e accanto la data, l'ora e lo
// scarabocchio della firma. Una funzione sola per tutti i fogli: quello del muro di sempre (una tela sopra la carta),
// quello della scena 3D (la stessa tela sopra la sua foto, scena/fogli.js) e quello che si avvicina per firmare
// (petizione.js, che con `fino` fa scrivere l'ultima riga un pezzo alla volta). La calligrafia, la pendenza e lo
// scarabocchio nascono dall'id della firma: chiunque guardi vede la stessa firma.

export const PENNE = ['blu', 'nera', 'rossa']
// l'inchiostro delle bic cristal: blu, nero, rosso
export const INCHIOSTRO = ['#1d3a9c', '#1c1b20', '#bf1b20']
// le colonne della tabella, in frazioni della larghezza: n., nome e cognome, data, ora, firma (le stesse di .pet-intesta)
export const COLONNE = [0.08, 0.4, 0.19, 0.13, 0.2]
// le calligrafie (Google Fonts, OFL e Apache 2.0, servite da /fonts): k = quanto è grande rispetto alle altre
const MANI = [
  { f: 'Caveat', url: '/fonts/caveat.woff2', k: 1.05, peso: '500' },
  { f: 'Reenie Beanie', url: '/fonts/reenie-beanie.woff2', k: 1.18 },
  { f: 'Nothing You Could Do', url: '/fonts/nothing-you-could-do.woff2', k: 0.74 },
  { f: 'Homemade Apple', url: '/fonts/homemade-apple.woff2', k: 0.66 },
]
let pronti = null
/** I caratteri, scaricati una volta (la tela non aspetta da sé un carattere che non c'è: disegnerebbe col corsivo di sistema). */
export const caratteri = () => (pronti ??= Promise.all([
  ...MANI.map((m) => new FontFace(m.f, `url(${m.url}) format("woff2")`, { weight: m.peso ?? '400', display: 'swap' }).load().then((ff) => document.fonts.add(ff), () => {})),
  document.fonts.load('20px "Special Elite"').catch(() => {}),
]))

// un numero a caso ma sempre lo stesso per ogni firma (mulberry32, col seme dall'id)
const seme = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619) } return h >>> 0 }
const caso = (s) => () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }

// lo scarabocchio della firma: un corsivo veloce che non si legge (occhielli che vanno avanti: una cicloide allungata),
// l'iniziale più grande, e a volte la svolazzata che torna indietro sotto. Punti in [0, 1] × [-0.5, 0.5], y in giù
function scarabocchio(r) {
  const pts = [], giri = 3 + Math.floor(r() * 4), f = giri + r() * 0.6, a = (1.25 + 0.6 * r()) / (2 * Math.PI * f), b = 0.22 + 0.12 * r()
  const fase = r() * 6, pend = 0.12 + 0.2 * r(), N = 90 + giri * 18
  for (let i = 0; i <= N; i++) {
    const t = i / N, inv = 1.45 - 0.7 * t + 0.18 * Math.sin(t * 9 + fase)
    const x = 0.04 + 0.84 * t + a * Math.sin(2 * Math.PI * f * t + fase), y = -b * inv * Math.cos(2 * Math.PI * f * t + fase)
    pts.push([x - pend * y, y + 0.06 * Math.sin(t * 3.1 + fase)])
  }
  if (r() < 0.7) {
    const [x0, y0] = pts.at(-1), g = 0.18 + 0.12 * r()
    for (let i = 1; i <= 24; i++) { const u = i / 24; pts.push([x0 + (0.08 - x0) * u + 0.05 * Math.sin(u * Math.PI), y0 + (g + 0.12 - y0) * Math.sin((u * Math.PI) / 2) - 0.05 * u]) }
  }
  return pts
}

// com'è scritta una firma: la mano, quanto è grande e storta, dove comincia, l'inchiostro, lo scarabocchio
const mani = new Map()
export function mano(f) {
  const k = f.id || f.n
  if (mani.has(k)) return mani.get(k)
  const r = caso(seme(k))
  const m = { m: MANI[Math.floor(r() * MANI.length)], k: 0.9 + 0.2 * r(), rot: (r() - 0.5) * 0.06, dx: 0.02 + r() * 0.06, dy: (r() - 0.5) * 0.14, ink: INCHIOSTRO[f.c] ?? INCHIOSTRO[0], sc: scarabocchio(r), kd: 0.85 + 0.2 * r() }
  mani.set(k, m)
  return m
}

const DATA = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', day: '2-digit', month: '2-digit', year: '2-digit' })
const ORA = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
export const data = (t) => DATA.format(t)
export const ora = (t) => ORA.format(t)

// i pezzi di una riga mentre la si scrive (frazioni del tempo): il nome, la data, l'ora, la firma (petizione.js li
// calcola per ogni firma: un nome lungo si scrive più piano)
export const TEMPI = [[0, 0.52], [0.52, 0.68], [0.68, 0.79], [0.79, 1]]
const tratto = (fino, i, tempi) => (fino === null ? 1 : Math.min(1, Math.max(0, (fino - tempi[i][0]) / (tempi[i][1] - tempi[i][0]))))

/**
 * Disegna le firme sulla tela, una per riga. x, y, w, h: la tabella sotto l'intestazione, in px della tela; righe:
 * quante ne stanno; firme: dalla prima riga in giù; primo: il numero della prima; fino: l'ultima la sta scrivendo la mano
 * (0..1, null = già scritta). Dà dove sta la punta della penna sull'ultima riga, se la si sta scrivendo.
 */
export function disegna(ctx, firme, { x, y, w, h, righe, primo = 1, fino = null, tempi = TEMPI }) {
  const rh = h / righe
  let punta = null
  ctx.save()
  ctx.textBaseline = 'alphabetic'
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  const col = (i) => x + w * COLONNE.slice(0, i).reduce((a, b) => a + b, 0)
  firme.slice(0, righe).forEach((f, i) => {
    const m = mano(f), cima = y + i * rh, base = cima + rh * (0.74 + 0.1 * m.dy), scrive = fino !== null && i === firme.length - 1
    // il numero, stampato a macchina come la tabella
    ctx.fillStyle = 'rgba(38, 36, 34, .72)'
    ctx.font = `${(rh * 0.4).toFixed(2)}px "Special Elite", "Courier New", monospace`
    ctx.fillText(`${primo + i}`, col(0) + w * 0.014, cima + rh * 0.7)
    ctx.fillStyle = ctx.strokeStyle = m.ink
    // un pezzo scritto a mano nella sua colonna: storto quanto la mano, stretto se non ci sta, scritto fino a u
    const scritta = (testo, c, k, u, sx = m.dx) => {
      if (u <= 0) return
      const cx = col(c) + w * COLONNE[c] * sx, larg = w * COLONNE[c] * (1 - sx - 0.03)
      ctx.font = `${m.m.peso ?? 400} ${(rh * 0.78 * m.m.k * m.k * k).toFixed(2)}px "${m.m.f}", cursive`
      const lw = ctx.measureText(testo).width, sxx = Math.min(1, larg / Math.max(1, lw))
      ctx.save()
      if (u < 1) { ctx.beginPath(); ctx.rect(cx - rh, cima - rh, lw * sxx * u + rh * 0.02, rh * 3); ctx.clip() }
      ctx.translate(cx, base); ctx.rotate(m.rot); ctx.scale(sxx, 1)
      ctx.fillText(testo, 0, 0)
      ctx.restore()
      if (scrive && u < 1) punta = { x: cx + lw * sxx * u, y: base - rh * 0.22 + Math.sin(u * lw * 0.9) * rh * 0.12 }
    }
    const u = [0, 1, 2, 3].map((k) => (scrive ? tratto(fino, k, tempi) : 1))
    scritta(f.n, 1, 1, u[0])
    scritta(data(f.t), 2, m.kd * 0.82, u[1], 0.06)
    scritta(ora(f.t), 3, m.kd * 0.82, u[2], 0.08)
    // lo scarabocchio: una linea sola, larga quanto la colonna della firma e alta quasi la riga
    if (u[3] > 0) {
      const cx = col(4) + w * COLONNE[4] * 0.06, sw = w * COLONNE[4] * 0.86, sh = rh * 0.62, cy = cima + rh * 0.55
      const pts = m.sc, n = Math.max(2, Math.round(pts.length * u[3]))
      ctx.lineWidth = Math.max(0.6, rh * 0.045)
      ctx.beginPath()
      for (let j = 0; j < n; j++) { const [px, py] = pts[j], X = cx + px * sw, Y = cy + py * sh; j ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y) }
      ctx.stroke()
      if (scrive && u[3] < 1) { const [px, py] = pts[n - 1]; punta = { x: cx + px * sw, y: cy + py * sh } }
    }
    if (scrive && !punta) punta = { x: col(4) + w * COLONNE[4] * 0.9, y: cima + rh * 0.6 }
  })
  ctx.restore()
  return punta
}

// ── le firme dal server ──────────────────────────────────────────────────────
// Chi le vuole (il foglio del muro, la scena 3D, il foglio che si avvicina) si iscrive con `ascolta`; arrivano una volta
// all'apertura della pagina e dopo ogni firma. Senza server (gli strumenti che fotografano la pagina) niente.
const stato = { firme: [], totale: 0, offline: false, arrivate: false }
const ascoltatori = new Set()
export const firme = () => stato
export const ascolta = (fa) => { ascoltatori.add(fa); if (stato.arrivate) fa(stato); return () => ascoltatori.delete(fa) }
export const aggiorna = (d) => {
  if (d && Array.isArray(d.firme)) { stato.firme = d.firme; stato.totale = d.totale ?? d.firme.length }
  stato.offline = !!d?.offline; stato.arrivate = true
  for (const fa of ascoltatori) fa(stato)
}
let chiesta = null
export const chiedi = () => (chiesta ??= fetch('/api/firme/', { headers: { accept: 'application/json' } })
  .then((r) => r.json().catch(() => ({ offline: true })))
  .catch(() => ({ offline: true }))
  .then((d) => { aggiorna(d.ok ? d : { offline: true }); return stato }))
