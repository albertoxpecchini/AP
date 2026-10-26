// La borsa dei $pzk (22.10 notte): quanto vale un $pzk in EUR€, l'«euroshit» (l'euro finto del wallet: non si preleva,
// non si deposita, non si gioca; si converte in $pzk, e i $pzk sì). Il cambio è una serie vera, un punto ogni dieci
// minuti, salvata in pzkko/borsa.json (Vercel Blob, _archivio.mjs): comincia da 1 $pzk = 1 € e da lì si muove da sola.
// L'euro, per finta, non varia mai: si muove solo il $pzk.
//
// Come si muove, ogni dieci minuti: un passo a caso (deterministico: nasce dall'ora del punto, così il passato non si
// riscrive mai) più una deriva. La deriva giornaliera è l'umore del giorno (a caso fra −5 % e +5 %; con la probabilità del
// 4 % un giorno è un'eccezione, come le crypto: ±10–30 % e il doppio del nervosismo) più i fattori del mondo, misurati
// quando si aggiunge un punto:
//   i commit di Alberto (GitHub, albertoxpecchini/AP): un commit nelle ultime 24 ore +3 % al giorno, nessuno −2 %
//   il meteo di Mantova (Open-Meteo): sole +2 %, pioggia o temporale −2 %, neve −1 %
//   la temperatura: sopra i 26° −1,5 %, sotto gli 8° +1,5 %
//   il giorno +1,2 %, la notte −1,2 %
//   l'inflazione (26.10, _economia.mjs): quanto è cresciuta l'offerta di $pzk nelle ultime 24 ore. Più soldi coniati a parità
//   di tutto il resto valgono meno: metà della crescita (al più ±5 % al giorno) si toglie; se l'offerta cala (i portafogli
//   smarriti che si distruggono) il cambio sale
// (api/wallet.mjs converte al cambio di quando il wallet si è sincronizzato, se non è passata più di mezz'ora: tassoA)
import { archivio, aggiorna, blobOpzioni } from './_archivio.mjs'

export const PATH = process.env.BORSA_BLOB_PATH || 'pzkko/borsa.json'
export const PASSO = 10 * 60 * 1000
const ORA = 60 * 60 * 1000, GIORNO = 24 * ORA
const AL_GIORNO = GIORNO / PASSO // 144 passi
const MIN = 0.01, MAX = 10000
const REPO = 'albertoxpecchini/AP'

const vuoto = () => ({ nata: null, punti: [], fattori: null })

// ── il caso che non cambia: da un numero intero (l'ora del punto) un numero in [0, 1) ──
const h32 = (n) => { let x = (n ^ 0x9e3779b9) >>> 0; x = Math.imul(x ^ (x >>> 16), 0x85ebca6b) >>> 0; x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35) >>> 0; return ((x ^ (x >>> 16)) >>> 0) / 4294967296 }
const caso = (t, k) => h32(Math.floor(t / PASSO) * 17 + k * 7919)
const gauss = (t) => { const u = Math.max(1e-9, caso(t, 1)), v = caso(t, 2); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) }

// l'umore del giorno (il giorno di Mantova, UTC+1 basta): la deriva a caso e se è un'eccezione
const umore = (t) => {
  const g = Math.floor((t + ORA) / GIORNO)
  const ecc = h32(g * 3 + 1) < 0.04
  const deriva = ecc ? (h32(g * 3 + 2) < 0.5 ? -1 : 1) * (0.1 + 0.2 * h32(g * 3 + 3)) : h32(g * 3 + 2) * 0.1 - 0.05
  return { deriva, ecc }
}
const PIOGGIA = (c) => (c >= 51 && c <= 67) || (c >= 80 && c <= 82) || c >= 95
const NEVE = (c) => (c >= 71 && c <= 77) || c === 85 || c === 86
/** La deriva giornaliera dei fattori del mondo (frazione al giorno). */
export const derivaFattori = (f) => {
  if (!f) return 0
  let d = 0
  if (f.commit === true) d += 0.03; else if (f.commit === false) d -= 0.02
  if (f.codice === 0 || f.codice === 1) d += 0.02; else if (PIOGGIA(f.codice)) d -= 0.02; else if (NEVE(f.codice)) d -= 0.01
  if (f.temperatura > 26) d -= 0.015; else if (f.temperatura < 8) d += 0.015
  if (f.giorno === true) d += 0.012; else if (f.giorno === false) d -= 0.012
  if (Number.isFinite(f.inflazione)) d -= Math.max(-0.05, Math.min(0.05, f.inflazione * 0.5))
  return d
}
// ── il nervosismo (23.10): col solo passo a caso dello 0,25 % e la deriva il grafico veniva quasi una retta inclinata
// (la deriva, coi fattori, vale fino al 6–8 % al giorno, il caso il 3 %). Una crypto vera nelle 24 ore è tutta denti: qui
// sopra la tendenza c'è un'ONDA, fatta di tre oscillazioni (55 minuti, 2,4 ore, 6,1 ore), di un rumore a ogni punto e di
// qualche STRAPPO (un punto su 40: ±1–3,5 % che rientra in mezz'ora), il tutto moltiplicato per il REGIME del momento
// (blocchi di tre ore calmi o agitati, raccordati; nei giorni d'eccezione il doppio). Ogni passo aggiunge la DIFFERENZA
// dell'onda fra adesso e dieci minuti prima: sul lungo periodo l'onda si annulla, quindi quanto sale o scende il giorno
// lo decidono sempre la deriva e i fattori, come prima. Tutto nasce dall'ora del punto: il passato non si riscrive.
const BLOCCO = 3 * ORA
const ONDE = [[55 * 60 * 1000, 0.0035, 0.7], [2.4 * ORA, 0.0068, 2.1], [6.1 * ORA, 0.011, 4.4]] // [periodo, ampiezza, fase]
const gauss2 = (t) => { const u = Math.max(1e-9, caso(t, 3)), v = caso(t, 4); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) }
export function regime(t) {
  const b = Math.floor(t / BLOCCO), k = (t - b * BLOCCO) / BLOCCO, liscia = k * k * (3 - 2 * k)
  const r = (i) => 0.55 + 1.35 * h32(i * 5 + 9) ** 1.5
  return (r(b) * (1 - liscia) + r(b + 1) * liscia) * (umore(t).ecc ? 2 : 1)
}
const strappo = (t) => {
  let s = 0
  for (let j = 0; j < 3; j++) { const tj = t - j * PASSO; if (caso(tj, 5) < 0.025) s += (caso(tj, 6) < 0.5 ? -1 : 1) * (0.01 + 0.025 * caso(tj, 7)) * (1 - j / 3) }
  return s
}
export const onda = (t) => regime(t) * (ONDE.reduce((s, [p, a, f]) => s + a * Math.sin((2 * Math.PI * t) / p + f), 0) + 0.0032 * gauss2(t) + strappo(t))
const passo = (v, t, f) => {
  const { deriva } = umore(t)
  const sigma = 0.035 / Math.sqrt(AL_GIORNO) // la tendenza: un passo a caso lento (i giorni d'eccezione li fa il regime)
  v *= Math.exp((deriva + derivaFattori(f)) / AL_GIORNO + sigma * regime(t) * gauss(t) + onda(t) - onda(t - PASSO))
  return Math.min(MAX, Math.max(MIN, v))
}

/** Aggiunge i punti mancanti fino a `now`; true se ne ha aggiunti. `nascita`: da quando parte una borsa nuova (di solito adesso). */
export function avanza(db, now, f, nascita = now) {
  if (!db.punti.length) { const t0 = Math.floor(nascita / PASSO) * PASSO; db.nata = t0; db.punti.push([t0, 1]); if (t0 + PASSO > now) return true }
  let [t, v] = db.punti[db.punti.length - 1], n = 0
  while (t + PASSO <= now && n < 30000) { t += PASSO; v = passo(v, t, f); db.punti.push([t, Math.round(v * 1e6) / 1e6]); n++ }
  if (n) compatta(db, now)
  return n > 0
}
// la serie non cresce per sempre: dieci minuti per l'ultima settimana, un'ora fino a tre mesi, poi un giorno
function compatta(db, now) {
  db.punti = db.punti.filter(([t], i) => i === db.punti.length - 1 || now - t < 7 * GIORNO || (now - t < 90 * GIORNO ? t % ORA === 0 : t % GIORNO === 0))
}

/** Il cambio all'istante t (interpolato fra i punti; fuori dalla serie, il primo o l'ultimo). */
export function tassoA(db, t) {
  const p = db.punti
  if (!p.length) return 1
  if (t <= p[0][0]) return p[0][1]
  if (t >= p[p.length - 1][0]) return p[p.length - 1][1]
  let lo = 0, hi = p.length - 1
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (p[m][0] <= t) lo = m; else hi = m }
  const [t0, v0] = p[lo], [t1, v1] = p[hi]
  return v0 + ((v1 - v0) * (t - t0)) / (t1 - t0)
}
export const attuale = (db) => (db.punti.length ? db.punti[db.punti.length - 1][1] : 1)

// ── i fattori del mondo: misurati quando serve un punto nuovo ──
async function misura(prima, now, M) {
  const f = { ...(prima ?? {}), misurati: now }
  // l'offerta: un campione a ogni punto, gli ultimi due giorni; l'inflazione è la crescita rispetto a 20–28 ore fa
  if (Number.isFinite(M) && M > 0) {
    f.offerte = [...(prima?.offerte ?? []), [now, M]].filter(([t]) => now - t < 2 * GIORNO)
    const ieri = f.offerte.find(([t]) => now - t >= 20 * ORA && now - t <= 28 * ORA)
    f.inflazione = ieri ? M / ieri[1] - 1 : null
  }
  const ctl = (ms) => AbortSignal.timeout(ms)
  await Promise.all([
    fetch('https://api.open-meteo.com/v1/forecast?latitude=45.1564&longitude=10.7914&current=temperature_2m,is_day,weather_code&timezone=Europe%2FRome', { signal: ctl(4000) })
      .then((r) => (r.ok ? r.json() : null)).then((d) => { const c = d?.current; if (!c) return; f.codice = c.weather_code; f.temperatura = c.temperature_2m; f.giorno = c.is_day === 1 }).catch(() => {}),
    fetch(`https://api.github.com/repos/${REPO}/commits?since=${new Date(now - GIORNO).toISOString()}&per_page=1`, { signal: ctl(4000), headers: { 'User-Agent': 'pzkko.it borsa', Accept: 'application/vnd.github+json', ...(process.env.GITHUB_TOKEN && { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }) } })
      .then((r) => (r.ok ? r.json() : null)).then((d) => { if (!Array.isArray(d)) return; f.commit = d.length > 0; if (d[0]) f.ultimoCommit = Date.parse(d[0].commit?.committer?.date) || now }).catch(() => {}),
  ])
  // (senza risposta da GitHub il giorno/notte lo dice l'ora di Mantova, e il commit non conta)
  if (f.giorno === undefined) { const h = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', hour: 'numeric', hour12: false }).format(new Date(now))); f.giorno = h >= 7 && h < 19 }
  return f
}

/** La borsa aggiornata a adesso (legge, se serve misura i fattori e aggiunge i punti, riscrive). null se l'archivio non c'è. */
export async function borsa(now = Date.now(), M = null) {
  const store = await archivio(PATH, vuoto)
  if (!store) return null
  const { db } = await aggiorna(store, async (db) => {
    const ultimo = db.punti.length ? db.punti[db.punti.length - 1][0] : -Infinity
    if (ultimo + PASSO > now) return { invariato: true }
    db.fattori = await misura(db.fattori, now, M)
    // in locale la borsa vive in memoria e rinasce a ogni avvio del server: la si fa nascere tre giorni fa, così il
    // grafico di prova ha una storia; online la storia è quella vera, salvata
    const inLocale = process.env.PZKKO_STORE === 'memory' || (!blobOpzioni() && !process.env.VERCEL)
    avanza(db, now, db.fattori, inLocale ? now - 3 * GIORNO : now)
  })
  return db
}

/** Quello che si dice a chi guarda: il cambio, le variazioni, i fattori, la serie (da = ms indietro). */
export function pubblico(db, now = Date.now(), da = 7 * GIORNO) {
  const v = attuale(db)
  const varia = (ms) => (db.nata && now - ms >= db.nata ? v / tassoA(db, now - ms) - 1 : null)
  let serie = db.punti.filter(([t]) => now - t <= da)
  if (!serie.length && db.punti.length) serie.push(db.punti[db.punti.length - 1])
  if (da <= GIORNO) serie = dettaglio(serie)
  return { tasso: v, inverso: 1 / v, t: now, nata: db.nata, var1h: varia(ORA), var24: varia(GIORNO), var7g: varia(7 * GIORNO), var30g: varia(30 * GIORNO), fattori: db.fattori, deriva: derivaFattori(db.fattori), umore: umore(now), punti: serie }
}

/** Il grafico delle 24 ore col dettaglio fine delle crypto: fra due punti da dieci minuti, quattro punti intermedi (ogni
 *  due minuti) su un ponte a caso che parte e arriva esattamente sui due punti veri. Solo da guardare: i cambi delle
 *  conversioni (tassoA) restano quelli dei punti salvati. Il caso nasce dall'ora del punto, quindi il disegno non cambia
 *  a ogni richiesta. */
function dettaglio(serie) {
  const N = 5, fuori = []
  for (let i = 0; i < serie.length; i++) {
    const [t0, v0] = serie[i]
    fuori.push([t0, v0])
    const prossimo = serie[i + 1]
    if (!prossimo || prossimo[0] - t0 !== PASSO) continue
    const [, v1] = prossimo
    const s = 0.0018 * regime(t0)
    const w = [0]
    for (let k = 1; k <= N; k++) { const u = Math.max(1e-9, h32(Math.floor(t0 / 60000) * 31 + k * 101)), z = h32(Math.floor(t0 / 60000) * 37 + k * 211); w.push(w[k - 1] + Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * z)) }
    for (let k = 1; k < N; k++) {
      const a = k / N, ponte = s * (w[k] - a * w[N]) // il ponte: zero ai due capi
      fuori.push([t0 + (PASSO * k) / N, Math.round(v0 * (v1 / v0) ** a * Math.exp(ponte) * 1e6) / 1e6])
    }
  }
  return fuori
}
