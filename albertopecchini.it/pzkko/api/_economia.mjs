// L'economia dei $pzk (26.10, Alberto: «i soldi persi o mangiati da te dai giocatori non spariscono ma vanno nelle casse di
// pzk; se li genero dal nulla sono nuovi»). Le regole sono quelle di una moneta vera:
// - L'OFFERTA (i $pzk che esistono) = i conti dei giocatori + la CASSA DI PZK + i PORTAFOGLI SMARRITI. La capitalizzazione è
//   l'offerta per il cambio (api/borsa.mjs).
// - IL CONIO: i soldi che nascono dal nulla (il lavoro, le quest, le sfide, i quiz, i premi, la miniera, il sussidio, le
//   banconote per terra, il regalo di instagram, i miracoli della lumachina) fanno crescere l'offerta. Più soldi a parità di
//   tutto il resto valgono meno: è l'inflazione, e il cambio ne tiene conto (_borsa.mjs, derivaFattori). (Alberto pensava che
//   il conio facesse salire la moneta: sale la capitalizzazione, il singolo $pzk scende.)
// - LA CASSA DI PZK (il conto «banca pzk», pzk000001: non è quello di Alberto, pzk398893): il croupier, il negoziante, il banco.
//   Quello che si perde al gioco, si compra, si paga di commissione, di multa, di cauzione, va qui; le vincite, la roba
//   venduta, il cambio da EUR€ escono da qui. Se la cassa non basta per pagare, la differenza si conia (come una banca
//   centrale). I trasferimenti non cambiano l'offerta.
// - I PORTAFOGLI SMARRITI: i $pzk persi morendo non spariscono subito, restano per terra; dopo 96 giorni si distruggono
//   (l'offerta cala: deflazione). Lo spazzino che trova un wallet e lo decifra li riporta in giro: soldi puliti.
// - I SOLDI SPORCHI: il bottino delle rapine alla cassa. Si sommano al saldo ma non si spendono con pzk (né giochi né shop),
//   non si mandano, non si cambiano: o si aspettano 96 giorni (si puliscono da soli) o si lavano nella lavatrice (fino a
//   50.000 in 10 minuti, 2.000 $pzk puliti di commissione alla cassa).
// - LA GALERA: chi viene preso (una rapina andata male, un lavoro rischioso) per qualche ora non lavora, non gioca, non
//   rapina; si esce prima pagando la cauzione alla cassa.

export const BANCA = { id: 'banca', ind: '000001', k: 'bancapzk', nome: 'banca pzk' }
const GIORNO = 24 * 3600_000
export const PULIZIA = 96 * GIORNO // i soldi sporchi si puliscono da soli, e i portafogli smarriti si distruggono
export const LAVA = { max: 50000, costo: 2000, ms: 10 * 60_000 }
export const CAUZIONE = 3000
const mezzi = (n) => Math.round(n * 2) / 2
const giorno = (t) => new Date(t + 3600_000).toISOString().slice(0, 10)

// ── la cassa ──
/** Il conto della cassa (lo crea la prima volta). */
export function cassa(db, now = Date.now()) {
  let b = db.conti.find((c) => c.id === BANCA.id)
  if (!b) { b = { ...BANCA, banca: true, creato: now, pzk: 0, eur: 0, mosse: [] }; db.conti.push(b) }
  return b
}
export const eBanca = (c) => c?.id === BANCA.id
const eco = (db) => (db.eco ??= { coniati: 0, distrutti: 0, persi: [], giorni: {} })
const segna = (db, now, k, n) => {
  const e = eco(db), g = (e.giorni[giorno(now)] ??= { conio: 0, casa: 0, distrutti: 0, persi: 0 })
  g[k] = mezzi((g[k] ?? 0) + n)
  const tieni = Object.keys(e.giorni).sort().slice(-40)
  for (const x of Object.keys(e.giorni)) if (!tieni.includes(x)) delete e.giorni[x]
}
/** Soldi nuovi dal nulla. */
export function conia(db, n, now = Date.now()) {
  n = mezzi(n)
  if (!(n > 0)) return
  eco(db).coniati = mezzi(eco(db).coniati + n)
  segna(db, now, 'conio', n)
}
/** Dal giocatore alla cassa (n > 0) o dalla cassa al giocatore (n < 0: se la cassa non basta, la differenza si conia). */
export function allaCassa(db, n, now = Date.now()) {
  n = mezzi(n)
  if (!n) return
  const b = cassa(db, now)
  if (n > 0) { b.pzk = mezzi(b.pzk + n); segna(db, now, 'casa', n); return }
  const paga = Math.min(b.pzk, -n)
  b.pzk = mezzi(b.pzk - paga)
  segna(db, now, 'casa', -paga)
  if (-n > paga) conia(db, -n - paga, now)
}

// ── i portafogli smarriti ──
export function perdi(db, n, now = Date.now()) {
  n = mezzi(n)
  if (!(n > 0)) return
  eco(db).persi.push({ n, t: now })
  if (eco(db).persi.length > 400) { const [a, b] = eco(db).persi.splice(0, 2); eco(db).persi.unshift({ n: mezzi(a.n + b.n), t: a.t }) }
  segna(db, now, 'persi', n)
}
export const smarriti = (db) => mezzi((db.eco?.persi ?? []).reduce((s, x) => s + x.n, 0))
/** I portafogli di più di 96 giorni si distruggono: l'offerta cala. */
export function distruggi(db, now = Date.now()) {
  const e = eco(db), via = e.persi.filter((x) => now - x.t > PULIZIA)
  if (!via.length) return
  const n = mezzi(via.reduce((s, x) => s + x.n, 0))
  e.persi = e.persi.filter((x) => now - x.t <= PULIZIA)
  e.distrutti = mezzi(e.distrutti + n)
  segna(db, now, 'distrutti', n)
}
/** Un wallet decifrato: fino a `quanto` dal fondo dei portafogli smarriti (i più vecchi prima). → quanto se ne prende */
export function ritrova(db, quanto) {
  let resta = mezzi(Math.min(quanto, smarriti(db))), preso = 0
  const e = eco(db)
  while (resta > 0 && e.persi.length) {
    const x = e.persi[0], k = Math.min(x.n, resta)
    x.n = mezzi(x.n - k); resta = mezzi(resta - k); preso = mezzi(preso + k)
    if (x.n <= 0) e.persi.shift()
  }
  return preso
}

// ── i soldi sporchi ──
export const sporchi = (c) => mezzi((c.sporchi ?? []).reduce((s, x) => s + x.n, 0))
export const puliti = (c) => Math.max(0, mezzi(c.pzk - sporchi(c)))
export function sporca(c, n, now = Date.now()) { if (n > 0) (c.sporchi ??= []).push({ n: mezzi(n), t: now }) }
/** Toglie n dai soldi sporchi, dai più vecchi. */
function lava(c, n) {
  let resta = mezzi(n)
  while (resta > 0 && c.sporchi?.length) {
    const x = c.sporchi[0], k = Math.min(x.n, resta)
    x.n = mezzi(x.n - k); resta = mezzi(resta - k)
    if (x.n <= 0) c.sporchi.shift()
  }
  if (!c.sporchi?.length) delete c.sporchi
}
/** Il tempo che passa: i sporchi di 96 giorni si puliscono, il lavaggio finito li pulisce, i sporchi non superano il saldo.
 *  → le mosse da dire, o null */
export function matura(c, now = Date.now(), mossa = () => {}) {
  let fatto = false
  const vecchi = (c.sporchi ?? []).filter((x) => now - x.t > PULIZIA).reduce((s, x) => s + x.n, 0)
  if (vecchi > 0) { c.sporchi = c.sporchi.filter((x) => now - x.t <= PULIZIA); if (!c.sporchi.length) delete c.sporchi; mossa({ t: now, tipo: 'puliti', n: mezzi(vecchi) }); fatto = true }
  if (c.lavaggio && c.lavaggio.fino <= now) { const n = Math.min(c.lavaggio.n, sporchi(c)); lava(c, n); mossa({ t: now, tipo: 'lavati', n: mezzi(n) }); delete c.lavaggio; fatto = true }
  const troppi = sporchi(c) - c.pzk
  if (troppi > 0) { // (una morte, una multa: i sporchi non superano il saldo; si tolgono dai più nuovi)
    let resta = troppi
    while (resta > 0 && c.sporchi?.length) { const x = c.sporchi[c.sporchi.length - 1], k = Math.min(x.n, resta); x.n = mezzi(x.n - k); resta -= k; if (x.n <= 0) c.sporchi.pop() }
    if (!c.sporchi?.length) delete c.sporchi
    fatto = true
  }
  if (c.galera && c.galera <= now) { delete c.galera; fatto = true }
  return fatto
}

// ── l'offerta e i suoi conti ──
/** I $pzk che esistono: i giocatori, la cassa, i portafogli smarriti; e quanto si è coniato e distrutto nelle ultime 24 ore. */
export function offertaTotale(db, now = Date.now()) {
  let giocatori = 0, eur = 0, conti = 0, banca = 0
  for (const c of db?.conti ?? []) { if (eBanca(c)) { banca += c.pzk || 0; continue } giocatori += c.pzk || 0; eur += c.eur || 0; conti++ }
  const g = db?.eco?.giorni ?? {}, oggiG = g[giorno(now)] ?? {}, ieri = g[giorno(now - GIORNO)] ?? {}
  const smarr = smarriti(db)
  return {
    pzk: mezzi(giocatori + banca + smarr), giocatori: mezzi(giocatori), banca: mezzi(banca), smarriti: smarr, eur: Math.round(eur * 100) / 100, conti,
    coniati: db?.eco?.coniati ?? 0, distrutti: db?.eco?.distrutti ?? 0,
    oggi: { conio: oggiG.conio ?? 0, casa: oggiG.casa ?? 0, distrutti: oggiG.distrutti ?? 0 }, ieri: { conio: ieri.conio ?? 0, casa: ieri.casa ?? 0, distrutti: ieri.distrutti ?? 0 },
  }
}
