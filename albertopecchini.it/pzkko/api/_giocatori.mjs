// Il database dei giocatori di pzkko.it (23.10): quello che si sa di chi gioca, in un file solo (pzkko/giocatori.json) a
// fianco dei conti del wallet (wallet.json: nome, indirizzo, $pzk, EUR€) e degli zaini della chat (chat.json: tutto quello
// che il bot ricorda, fino a 12 KB a testa). Qui sta la riga PUBBLICA di ognuno, piccola, che si aggiorna a ogni
// salvataggio dello zaino (api/wallet.mjs, azione «zaino»): livello, statistiche, mestiere, serie, sfide, quiz, missioni,
// l'ultima volta che si è visto. Le richieste la UNISCONO ai conti (unisci): i $pzk e gli EUR€ sono sempre quelli veri
// del wallet, e anche chi ha un conto ma non ha mai aperto la chat c'è (con solo i soldi).
//
// Da qui escono le classifiche per qualunque metrica (top), la ricerca per nome (cerca), il profilo con la posizione in
// ogni classifica (profilo), i vicini di classifica per le sfide fra giocatori (vicini), i numeri di tutta la banca
// (statistiche) e le notizie (le cose che succedono: un livello nuovo, una pescata leggendaria, una vincita grossa).
// Le notizie sono dati («tipo» e «dato»): le parole le mette il browser, con le sue icone.
// (Comincia per _ : Vercel non ne fa una funzione.)

import { sporchi } from './_economia.mjs'

export const PATH_GIOCATORI = process.env.GIOCATORI_BLOB_PATH || 'pzkko/giocatori.json'
export const vuotoG = () => ({ v: 1, g: {}, notizie: [] })

const MAX_NOTIZIE = 60
const GIORNO = 24 * 3600_000
const num = (x) => (Number.isFinite(x) ? Math.max(0, Math.round(x)) : 0)
/** Il livello dai punti (la stessa formula di chat/zaino.js). */
export const livelloDi = (xp) => 1 + Math.floor(Math.sqrt(Math.max(0, xp) / 60))
/** Gli oggetti che fanno notizia quando li si prende. */
export const LEGGENDARI = ['carpa-oro', 'drago', 'tesoro']
/** Le statistiche che diventano pubbliche (il resto dello zaino resta privato). */
export const STAT = ['guadagnati', 'vinti', 'persi', 'pescati', 'cacciati', 'scavati', 'morti', 'comandi', 'comprati', 'casse', 'quizGiusti', 'quizTotali', 'sfideFatte', 'missioniFatte', 'acquisti', 'giri']
/** I giochi grandi di cui si tengono i numeri (chat/zaino.js, giro): [mani, vinte, puntato, tornato, il colpo migliore]. */
export const GIOCHI = ['roulette', 'blackjack', 'mine', 'dado', 'moneta', 'virtual']

/** Le classifiche: nome → come si legge il valore da una riga unita. */
export const METRICHE = {
  pzk: (r) => r.pzk,
  eur: (r) => r.eur,
  xp: (r) => r.xp,
  liv: (r) => r.liv,
  guadagnati: (r) => r.s.guadagnati,
  vinti: (r) => r.s.vinti,
  persi: (r) => r.s.persi,
  pescati: (r) => r.s.pescati,
  cacciati: (r) => r.s.cacciati,
  scavati: (r) => r.s.scavati,
  morti: (r) => r.s.morti,
  comandi: (r) => r.s.comandi,
  quiz: (r) => r.s.quizGiusti,
  sfide: (r) => r.s.sfideFatte,
  missioni: (r) => r.s.missioniFatte,
  serie: (r) => r.serie,
  acquisti: (r) => r.s.acquisti,
  giri: (r) => r.s.giri,
  vecchiaia: (r) => Math.floor((Date.now() - r.creato) / GIORNO),
}

const statDi = (z) => Object.fromEntries(STAT.map((k) => [k, num(z?.stat?.[k])]))
const id = (x) => (typeof x === 'string' && /^[a-z0-9-]{1,24}$/.test(x) ? x : null)
/** Il profilo che uno si è fatto (telefono/app/profilo.js): solo nomi corti (le liste le ha il browser) e il motto, ripulito. */
const profiloDi = (p) => {
  if (!p || typeof p !== 'object') return null
  const mot = typeof p.mot === 'string' ? p.mot.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 60) : ''
  const pr = { av: id(p.av), col: id(p.col), cor: id(p.cor), ...(mot && { mot }) }
  return Object.values(pr).some(Boolean) ? pr : null
}
const giochiDi = (g) => Object.fromEntries(GIOCHI.filter((k) => Array.isArray(g?.[k])).map((k) => [k, g[k].slice(0, 5).map((x) => (Number.isFinite(x) ? Math.round(x * 2) / 2 : 0))]))
/** La riga pubblica di un giocatore, dal suo conto e dal suo zaino. */
export function riga(c, z, now) {
  const oggetti = Object.values(z?.oggetti ?? {}).reduce((a, n) => a + num(n), 0)
  return {
    id: c.id, ind: c.ind, nome: c.nome, creato: c.creato, ult: now,
    xp: num(z?.xp), mest: typeof z?.mestiere === 'string' ? z.mestiere.slice(0, 20) : null, turni: num(z?.turni),
    s: statDi(z), serie: num(z?.serie?.giornaliero?.n), ogg: oggetti,
    rari: (Array.isArray(z?.rari) ? z.rari : []).filter((x) => LEGGENDARI.includes(x)),
    ...(z?.titolo && typeof z.titolo === 'string' && { tit: z.titolo.slice(0, 24) }),
    ...(profiloDi(z?.profilo) && { pr: profiloDi(z.profilo) }),
    ...(z?.giochi && { gi: giochiDi(z.giochi) }),
  }
}

/** Scrive la riga di un giocatore (e le notizie che ne escono, a confronto con la riga di prima). */
export function aggiornaGiocatore(db, c, z, now) {
  const nuova = riga(c, z, now)
  const prima = db.g[c.id]
  const nota = (tipo, dato) => db.notizie.push({ t: now, ind: c.ind, nome: c.nome, tipo, dato })
  if (prima) {
    if (livelloDi(nuova.xp) > livelloDi(prima.xp) && livelloDi(nuova.xp) >= 3) nota('livello', livelloDi(nuova.xp))
    for (const r of nuova.rari) if (!prima.rari?.includes(r)) nota('leggenda', r)
    const vinto = nuova.s.vinti - prima.s.vinti
    if (vinto >= 1500) nota('vincita', vinto)
    if (nuova.mest && nuova.mest !== prima.mest) nota('mestiere', nuova.mest)
    if (nuova.s.sfideFatte > prima.s.sfideFatte && nuova.s.sfideFatte % 10 === 0) nota('sfide', nuova.s.sfideFatte)
    if (nuova.s.missioniFatte > prima.s.missioniFatte) nota('missione', nuova.s.missioniFatte)
    if (nuova.s.quizGiusti >= prima.s.quizGiusti + 5 && nuova.s.quizTotali - prima.s.quizTotali <= nuova.s.quizGiusti - prima.s.quizGiusti) nota('quiz', nuova.s.quizGiusti - prima.s.quizGiusti)
    if (nuova.serie > prima.serie && nuova.serie >= 5) nota('serie', nuova.serie)
  } else nota('nuovo', 1)
  if (db.notizie.length > MAX_NOTIZIE) db.notizie.splice(0, db.notizie.length - MAX_NOTIZIE)
  db.g[c.id] = nuova
}

/** Una notizia che non viene dalla riga del giocatore (la lumachina: le catastrofi e i miracoli, api/wallet.mjs). */
export function notizia(db, c, tipo, dato, now) {
  db.notizie.push({ t: now, ind: c.ind, nome: c.nome, tipo, dato })
  if (db.notizie.length > MAX_NOTIZIE) db.notizie.splice(0, db.notizie.length - MAX_NOTIZIE)
}

/** Il titolo che uno si è guadagnato: quello che fa di più. */
export function titoloDi(r) {
  const s = r.s
  const cand = [
    [s.pescati >= 60, 're del Mincio', s.pescati],
    [s.cacciati >= 60, 'cacciatore di nutrie', s.cacciati],
    [s.scavati >= 60, 'tombarolo gonzaghesco', s.scavati],
    [s.vinti + s.persi >= 20000, 'giocatore d’azzardo', s.vinti + s.persi],
    [s.quizGiusti >= 40, 'cervellone', s.quizGiusti * 20],
    [s.morti >= 15, 'immortale (a metà)', s.morti * 40],
    [s.sfideFatte >= 15, 'ossessionato', s.sfideFatte * 30],
    [s.missioniFatte >= 5, 'eroe di Mantova', s.missioniFatte * 100],
    [r.liv >= 10, 'veterano', r.liv * 60],
    [r.pzk >= 50000, 'riccone', r.pzk / 100],
  ].filter((x) => x[0]).sort((a, b) => b[2] - a[2])
  return cand[0]?.[1] ?? (r.xp > 0 ? 'nuovo arrivato' : 'sconosciuto')
}

/** Le righe di tutti, unite ai conti del wallet (chi non ha una riga ha solo i soldi). */
export function unisci(db, conti) {
  return conti.map((c) => {
    const g = db.g[c.id]
    const r = { id: c.id, ind: c.ind, nome: c.nome, creato: c.creato, pzk: c.pzk ?? 0, eur: c.eur ?? 0, xp: 0, mest: null, turni: 0, s: statDi(null), serie: 0, ogg: 0, rari: [], ult: c.salvato ?? c.creato, ...(g ?? {}), ...{ pzk: c.pzk ?? 0, eur: c.eur ?? 0, nome: c.nome, ind: c.ind } }
    r.s = { ...statDi(null), ...r.s }
    r.sp = sporchi(c) // (26.10) i soldi sporchi e la galera si vedono nel profilo, come la fedina
    r.gal = c.galera > Date.now() ? c.galera : null
    r.liv = livelloDi(r.xp)
    r.titolo = r.tit ?? titoloDi(r)
    return r
  })
}

const pubblica = (r) => ({ nome: r.nome, ind: 'pzk' + r.ind, liv: r.liv, titolo: r.titolo, mest: r.mest, ...(r.pr?.av && { av: r.pr.av }), ...(r.pr?.col && { col: r.pr.col }) })
const valoreDi = (metrica, r) => { const v = METRICHE[metrica](r); return metrica === 'pzk' || metrica === 'eur' ? Math.round(v * 100) / 100 : v }

/** La classifica per una metrica: i primi n con valore > 0. */
export function top(righe, metrica, n = 10) {
  if (!METRICHE[metrica]) return null
  return righe.map((r) => [r, valoreDi(metrica, r)]).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1] || a[0].creato - b[0].creato).slice(0, Math.min(25, n))
    .map(([r, v], i) => ({ pos: i + 1, valore: v, ...pubblica(r) }))
}

/** La ricerca per nome (inizia con, poi contiene) o per indirizzo. */
export function cerca(righe, q, n = 8) {
  q = String(q ?? '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').trim()
  if (!q) return []
  const chiave = (r) => r.nome.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
  const ind = /^(?:pzk)?(\d{6})$/.exec(q)?.[1]
  const trovati = ind ? righe.filter((r) => r.ind === ind) : [...righe.filter((r) => chiave(r).startsWith(q)), ...righe.filter((r) => !chiave(r).startsWith(q) && chiave(r).includes(q))]
  return trovati.slice(0, n).map(pubblica)
}

/** Il profilo di uno, con la sua posizione in ogni classifica. */
export function profilo(righe, r) {
  const posizioni = {}
  for (const m of Object.keys(METRICHE)) {
    const v = valoreDi(m, r)
    if (v <= 0) continue
    posizioni[m] = { pos: 1 + righe.filter((x) => valoreDi(m, x) > v).length, valore: v }
  }
  return {
    ...pubblica(r), creato: r.creato, ult: r.ult, xp: r.xp, turni: r.turni, pzk: Math.round(r.pzk * 2) / 2, ogg: r.ogg, serie: r.serie, rari: r.rari, s: r.s,
    xpProssimo: 60 * r.liv ** 2, giocatori: righe.length, posizioni, pr: r.pr ?? null, gi: r.gi ?? {}, sp: r.sp ?? 0, gal: r.gal ?? null,
  }
}

/** Chi sta sopra e sotto di te in una classifica (per sfidarlo): { su, giu, io }. */
export function vicini(righe, r, metrica = 'xp') {
  if (!METRICHE[metrica]) return null
  const ord = righe.map((x) => [x, valoreDi(metrica, x)]).sort((a, b) => b[1] - a[1] || a[0].creato - b[0].creato)
  const i = ord.findIndex(([x]) => x.id === r.id)
  if (i < 0) return null
  const v = ([x, val], pos) => ({ pos, valore: val, ...pubblica(x) })
  return { metrica, pos: i + 1, su: i > 0 ? v(ord[i - 1], i) : null, giu: i < ord.length - 1 ? v(ord[i + 1], i + 2) : null, io: ord[i][1], totale: ord.length }
}

/** I numeri di tutta la banca. */
export function statistiche(righe, notizie, now = Date.now()) {
  const somma = (f) => righe.reduce((a, r) => a + f(r), 0)
  const ultime = (ms) => righe.filter((r) => now - r.ult < ms).length
  const meglio = (m) => top(righe, m, 1)[0] ?? null
  return {
    giocatori: righe.length, attivi24h: ultime(GIORNO), attivi7g: ultime(7 * GIORNO),
    pzk: Math.round(somma((r) => r.pzk) * 2) / 2, eur: Math.round(somma((r) => r.eur) * 100) / 100,
    pescati: somma((r) => r.s.pescati), cacciati: somma((r) => r.s.cacciati), scavati: somma((r) => r.s.scavati), morti: somma((r) => r.s.morti),
    comandi: somma((r) => r.s.comandi), quizGiusti: somma((r) => r.s.quizGiusti), sfideFatte: somma((r) => r.s.sfideFatte), missioniFatte: somma((r) => r.s.missioniFatte),
    livelloMedio: righe.length ? Math.round((somma((r) => r.liv) / righe.length) * 10) / 10 : 0,
    record: { ricco: meglio('pzk'), esperto: meglio('xp'), pescatore: meglio('pescati'), cervellone: meglio('quiz') },
    notizie: notizie.length,
  }
}

/** Le notizie, dalla più recente. */
export const ultimeNotizie = (db, n = 30) => db.notizie.slice(-n).reverse().map((x) => ({ t: x.t, nome: x.nome, ind: 'pzk' + x.ind, tipo: x.tipo, dato: x.dato }))
