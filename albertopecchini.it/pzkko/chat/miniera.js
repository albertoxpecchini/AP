// La miniera di $pzk (23.10): le REGOLE. Alberto: «crea app dove si minano pzk da pc. ovviamente bisogna comprare i
// componenti e farsi la postazione. anche la sedia migliorata aumenta la produzione». Il catalogo e i PC pronti sono in
// miniera-dati.mjs, il disegno in miniera-pixel.js, l'app in telefono/app/miniera.js. Niente interfaccia qui: tutto torna
// come dati, e gli errori sono frasi pronte da mostrare.
//
// LA POSTAZIONE ha dodici posti (CATEGORIE): per minare servono tutti gli obbligatori, schede video, ventole e led no.
// Tutto si incastra: il case sta sul tavolo se la sua forma non supera tavolo.caseMax (mini < medio < grande < aperto); le
// schede video stanno nel case se non sono più lunghe di case.gpuMax (corta < media < lunga) e non sono più di
// case.slotGpu; le ventole fino a case.slotVentole; gli schermi fino a tavolo.posti (senza tavolo uno solo, per terra).
// Un pezzo che non ci sta non si monta, e l'errore dice perché. Se invece si cambia il case o il tavolo con uno dove ce ne
// stanno meno, le schede, le ventole e gli schermi in più si smontano da soli (restano tuoi) e il risultato lo dice; se si
// smonta il case, schede e ventole escono con lui.
//
// LA PRODUZIONE (calcola):
//   hash = cpu.hash + n_gpu × gpu.hash
//   calore = cpu.calore + n_gpu × gpu.calore (watt); raffreddamento = case + n_ventole × ventola + il dissipatore della cpu
//   temperatura = 30 °C + 45 °C × calore / raffreddamento: oltre gli 80 °C il PC rallenta (−2 % per grado, fino al 40 %)
//   moltiplicatore = (1 + sedia) × (1 + tavolo) × (1 + ram) × (1 + memoria) × (1 + led) × (1 + n_schermi × schermo)
//                    × (1 + tastiera) × (1 + mouse)
//   perOra = hash × COSTANTE × efficienza × moltiplicatore ($pzk all'ora, solo con la postazione completa)
// I $pzk maturano col tempo vero (Date.now), anche a pagina chiusa, fino alla capienza della memoria (memoria.ore ore di
// produzione): poi la miniera si ferma finché non si incassa. Quando la postazione cambia, quello maturato fin lì resta
// (acc) e da lì si riparte coi numeri nuovi. Il massimo che la memoria tiene è 12 ore × 1.500 $pzk all'ora: un incasso
// non passa mai i 18.000 $pzk (api/wallet.mjs non accetta salti di saldo di più di 20.000 fra due salvataggi).
//
// I SOLDI: i pezzi si comprano a prezzo pieno, si rivendono a metà (solo quelli non montati); un PC pronto costa i pezzi
// che mancano, scontati. Lo stato sta nello zaino (zaino.minieraStato: { posseduti: { id: n }, montati: { cat: id | { id, n } },
// dal, acc }). posseduti conta tutti i pezzi che hai, anche quelli montati.
//
// DAL 31.10 LA MINIERA LA FA GIRARE LA BANCA (Alberto: «il browser non decide più niente»; giochi/app-miniera.mjs sul server
// di Alberto, con le stesse regole copiate): comprare, vendere, montare, smontare, i PC pronti e l'incasso sono azioni della
// banca, coi suoi prezzi e col suo orologio (i $pzk maturano fino all'ora del server: spostare avanti l'ora del computer non
// mina niente). Qui le regole restano per disegnare e per dire i numeri (calcola, maturati, compatibile, prezzoPronto) e le
// azioni chiedono (pzk.fai): il risultato arriva con lo zaino nuovo.

import * as pzk from '../games/pzk.js'
import * as zaino from './zaino.js'
import { CATEGORIE, PEZZI, PER_ID, PRONTI as PRONTI_DATI, PRONTO_PER_ID } from './miniera-dati.mjs'

export { CATEGORIE }
/** $pzk all'ora per ogni unità di hash (a efficienza piena e moltiplicatore 1). */
export const COSTANTE = 0.25
/** Oltre questa temperatura il PC rallenta. */
export const SOGLIA = 80
const CALDO = 75 // da qui un avviso, ma niente di grave
const AMBIENTE = 30, GRADI = 45, MASSIMA = 110 // °C: la stanza, quanto sale per ogni watt di calore per watt raffreddato, il tetto
const CALO = 0.02, EFF_MIN = 0.4 // −2 % per grado sopra la soglia, mai sotto il 40 %
const DISSIPATORE = { stock: 0, torre: 25, liquido: 60 } // watt che il dissipatore della cpu porta via da solo
const SENZA_CASE = 60 // watt: la scheda madre all'aria, senza case (la postazione è incompleta, ma la temperatura si vede)
const FORME = ['mini', 'medio', 'grande', 'aperto']
const LUNGHE = ['corta', 'media', 'lunga']
const PLURALE = { corta: 'corte', media: 'medie', lunga: 'lunghe' }
const AMMESSE = { corta: 'solo schede corte', media: 'schede corte o medie', lunga: 'schede di tutte le lunghezze' }
const ORA = 3_600_000
const PER_CAT = Object.fromEntries(CATEGORIE.map((k) => [k.id, k]))
const fmt = (n) => pzk.fmt(n)
const quante = (n, uno, tanti) => (n === 1 ? uno : tanti.replace('#', fmt(n)))

// ── il catalogo ──
/** I pezzi (di una categoria), dal più semplice al più caro. */
export const catalogo = (cat) => (cat ? PEZZI.filter((x) => x.cat === cat).sort((a, b) => a.livello - b.livello || a.prezzo - b.prezzo) : PEZZI)
export const pezzo = (id) => PER_ID[id] ?? null

/** Un posto della postazione com'è scritto ('id' o { id, n }) → { id, n, x } (x: il pezzo), o null se è vuoto o sbagliato. */
function posto(montati, cat) {
  const v = montati?.[cat]
  const id = typeof v === 'string' ? v : v?.id
  const x = PER_ID[id]
  if (!x || x.cat !== cat) return null
  return { id, x, n: PER_CAT[cat].multipla ? Math.max(1, Math.floor(typeof v === 'object' ? v.n : 1) || 1) : 1 }
}
const scritto = (cat, id, n) => (PER_CAT[cat].multipla ? { id, n } : id)
const postiSchermi = (m) => posto(m, 'tavolo')?.x.stats.posti ?? 1

// ── lo stato (nello zaino) ──
function leggi() {
  const s = zaino.minieraStato()
  return { posseduti: { ...(s.posseduti ?? {}) }, montati: { ...(s.montati ?? {}) }, dal: Number(s.dal) || 0, acc: Number(s.acc) || 0 }
}
/** { posseduti: { id: n }, montati: { cat: id | { id, n } }, dal: ms (da quando matura), acc: $pzk maturati prima dell'ultimo cambio } */
export const stato = () => leggi()
/** fn(stato) quando la miniera cambia (anche dal server o da un'altra scheda). → la funzione per smettere */
export function ascolta(fn) {
  let prima = JSON.stringify(zaino.minieraStato())
  return zaino.ascolta(() => {
    const ora = JSON.stringify(zaino.minieraStato())
    if (ora === prima) return
    prima = ora
    fn(leggi())
  })
}

// ── gli incastri ──
/** Cosa non si incastra nella postazione m: [testo]. `cat` è il posto appena cambiato: gli errori parlano di quello. */
function incastri(m, cat = null) {
  const out = []
  const t = posto(m, 'tavolo'), c = posto(m, 'case'), g = posto(m, 'gpu'), v = posto(m, 'ventole'), sc = posto(m, 'schermo')
  if (t && c && FORME.indexOf(c.x.vista.forma) > FORME.indexOf(t.x.stats.caseMax)) {
    out.push(cat === 'tavolo'
      ? `su questo tavolo il tuo case non ci sta: è ${c.x.vista.forma}, e qui ci sta al massimo un case ${t.x.stats.caseMax}. Prima monta un case più piccolo`
      : `un case ${c.x.vista.forma} su questo tavolo non ci sta: regge al massimo un case ${t.x.stats.caseMax}`)
  }
  if (g) {
    const l = g.x.vista.lunghezza
    if (!c) out.push('prima il case: le schede video vanno dentro')
    else if (LUNGHE.indexOf(l) > LUNGHE.indexOf(c.x.stats.gpuMax)) {
      out.push(cat === 'case'
        ? `in questo case le tue schede video non ci stanno: sono ${PLURALE[l]}, e lì dentro ${AMMESSE[c.x.stats.gpuMax]}. Prima smontale`
        : `la ${g.x.nome} è ${l}: in un case ${c.x.vista.forma} non ci sta (lì dentro ${AMMESSE[c.x.stats.gpuMax]})`)
    } else if (g.n > c.x.stats.slotGpu) out.push(quante(c.x.stats.slotGpu, 'in questo case ci sta una scheda video sola', `in questo case ci stanno # schede video, non ${fmt(g.n)}`))
  }
  if (v) {
    if (!c) out.push('prima il case: le ventole vanno dentro')
    else if (v.n > c.x.stats.slotVentole) out.push(quante(c.x.stats.slotVentole, 'in questo case ci sta una ventola sola', `in questo case ci stanno # ventole, non ${fmt(v.n)}`))
  }
  if (sc && sc.n > postiSchermi(m)) out.push(!t ? 'senza tavolo ci sta uno schermo solo, per terra' : quante(t.x.stats.posti, 'su questo tavolo ci sta uno schermo solo', `su questo tavolo ci stanno # schermi, non ${fmt(sc.n)}`))
  return out
}
/** Dopo un cambio di case o di tavolo: le schede, le ventole e gli schermi che non ci stanno più si smontano (in parte o
 *  tutti). Cambia m e dice cosa ha fatto: [testo]. */
function adatta(m) {
  const out = []
  const c = posto(m, 'case')
  for (const [cat, max, cosa] of [['gpu', c?.x.stats.slotGpu ?? 0, 'schede video'], ['ventole', c?.x.stats.slotVentole ?? 0, 'ventole'], ['schermo', postiSchermi(m), 'schermi']]) {
    const p = posto(m, cat)
    if (!p || p.n <= max) continue
    if (max <= 0) { delete m[cat]; out.push(`${cosa}: smontate, senza case non stanno da nessuna parte`) }
    else { m[cat] = { id: p.id, n: max }; out.push(`${cosa}: ne restano montat${cat === 'schermo' ? 'i' : 'e'} ${fmt(max)} su ${fmt(p.n)}, di più non ce ne stanno`) }
  }
  return out
}
/** Il pezzo ci starebbe, montato adesso? (anche senza averlo: per il negozio) → { ok, errore? } */
export function compatibile(cat, id, n = 1) {
  const x = PER_ID[id]
  if (!x || x.cat !== cat || !PER_CAT[cat]) return { ok: false, errore: 'questo pezzo non va lì' }
  const m = { ...leggi().montati, [cat]: scritto(cat, id, Math.max(1, Math.floor(n) || 1)) }
  if (cat === 'case' || cat === 'tavolo') adatta(m)
  const e = incastri(m, cat)
  return e.length ? { ok: false, errore: e[0] } : { ok: true }
}

// ── la produzione ──
/** I numeri di una postazione (quella montata, o un'altra: un PC pronto, una prova). */
export function calcola(montati = leggi().montati) {
  const p = (cat) => posto(montati, cat)
  const manca = CATEGORIE.filter((k) => k.obbligatoria && !p(k.id)).map((k) => k.id)
  const problemi = incastri(montati)
  const cpu = p('cpu'), gpu = p('gpu'), kase = p('case'), vent = p('ventole'), mem = p('memoria'), sch = p('schermo')
  const nG = gpu?.n ?? 0, nV = vent?.n ?? 0, nS = sch?.n ?? 0
  const hash = (cpu?.x.stats.hash ?? 0) + nG * (gpu?.x.stats.hash ?? 0)
  const calore = (cpu?.x.stats.calore ?? 0) + nG * (gpu?.x.stats.calore ?? 0)
  const raffreddamento = (kase ? kase.x.stats.raffreddamento : SENZA_CASE) + nV * (vent?.x.stats.raffreddamento ?? 0) + (DISSIPATORE[cpu?.x.vista.dissipatore] ?? 0)
  const temperatura = calore > 0 ? Math.round(Math.min(MASSIMA, AMBIENTE + (GRADI * calore) / Math.max(1, raffreddamento)) * 10) / 10 : AMBIENTE
  const efficienza = temperatura <= SOGLIA ? 1 : Math.round(Math.max(EFF_MIN, 1 - (temperatura - SOGLIA) * CALO) * 100) / 100
  const b = (cat, k = 'bonus') => p(cat)?.x.stats[k] ?? 0
  const moltiplicatore = Math.round((1 + b('sedia', 'comfort')) * (1 + b('tavolo', 'comfort')) * (1 + b('ram')) * (1 + b('memoria')) * (1 + b('led'))
    * (1 + nS * b('schermo')) * (1 + b('tastiera')) * (1 + b('mouse')) * 10000) / 10000
  const completa = !manca.length && !problemi.length
  const perOra = completa ? Math.round(hash * COSTANTE * efficienza * moltiplicatore * 100) / 100 : 0
  const capienzaOre = mem?.x.stats.ore ?? 0
  const avvisi = [...problemi]
  const t = fmt(Math.round(temperatura))
  if (temperatura >= 100) avvisi.push(`${t} °C: sta cuocendo e lavora al ${Math.round(efficienza * 100)} %. Servono ventole, subito, o un case più arieggiato`)
  else if (temperatura > SOGLIA) avvisi.push(`troppo caldo, ${t} °C: il PC rallenta e lavora al ${Math.round(efficienza * 100)} %. Più ventole, ventole migliori o un case più arieggiato`)
  else if (temperatura >= CALDO && cpu) avvisi.push(`scalda un po’ (${t} °C): niente di grave, ma sopra gli ${SOGLIA} °C rallenta`)
  if (completa && !gpu) avvisi.push('senza scheda video mina solo il processore: anche una piccola fa la differenza (con una ventola, se il case è stretto)')
  if (vent && kase && nV < kase.x.stats.slotVentole && temperatura > SOGLIA) avvisi.push(`nel case ci stanno ancora ${quante(kase.x.stats.slotVentole - nV, 'una ventola', '# ventole')}`)
  return { completa, manca, hash, calore, raffreddamento, temperatura, efficienza, moltiplicatore, perOra, capienzaOre, avvisi }
}

/** I $pzk maturati in uno stato, al momento `ora`: quelli di prima (acc) più quelli dall'ultimo cambio, fino alla capienza. */
function maturatiDi(s, ora = Date.now()) {
  const c = calcola(s.montati)
  if (!c.completa || !(c.perOra > 0) || !s.dal) return s.acc
  const ore = Math.max(0, ora - s.dal) / ORA
  return s.acc + Math.min(c.perOra * ore, Math.max(0, c.perOra * c.capienzaOre - s.acc))
}
/** I $pzk maturati adesso (fino alla capienza della memoria), da incassare. */
export const maturati = (ora = Date.now()) => maturatiDi(leggi(), ora)
/** La memoria è piena (la postazione è completa e i maturati hanno raggiunto la capienza): per il pallino rosso. */
export function piena(ora = Date.now()) {
  const s = leggi(), c = calcola(s.montati)
  return c.completa && c.perOra > 0 && maturatiDi(s, ora) >= c.perOra * c.capienzaOre - 1e-6
}

/** Un'azione della miniera sulla banca. → { ok, …esito } o { ok: false, errore, manca? } */
async function fai(cosa, args = {}) {
  const d = await pzk.fai(cosa, args)
  return d?.ok ? { ok: true, ...d.esito } : { ok: false, errore: d?.errore ?? 'la banca non risponde: riprova', ...(d?.manca && { manca: d.manca }) }
}
/** Mette nel saldo i $pzk maturati (a mezzi $pzk: il resto rimane in miniera; li conta la banca). → Promise<{ ok, n }> */
export const incassa = () => fai('miniera.incassa').then((r) => (r.ok ? r : { ...r, n: 0 }))

// ── comprare, vendere, montare (sulla banca) ──
/** Compra n pezzi uguali (prezzo pieno). → Promise<{ ok, x, n, tot } | { ok: false, errore, manca? }> */
export const compra = (id, n = 1) => fai('miniera.compra', { id, n }).then((r) => (r.ok ? { ...r, x: PER_ID[id] } : r))
/** Rivende n pezzi non montati, a metà prezzo. → Promise<{ ok, reso, n } | { ok: false, errore, reso: 0 }> */
export const vendi = (id, n = 1) => fai('miniera.vendi', { id, n }).then((r) => (r.ok ? r : { ...r, reso: 0 }))
/** Monta un pezzo che hai al suo posto (n: quante schede, ventole o schermi; senza n tutti quelli che ci stanno).
 *  → Promise<{ ok, avvisi? } | { ok: false, errore }> */
export const monta = (cat, id, n) => fai('miniera.monta', { cat, id, ...(n != null && { n }) })
/** Toglie il pezzo dal suo posto (resta tuo). → Promise<{ ok, avvisi? }> */
export const smonta = (cat) => fai('miniera.smonta', { cat })

// ── i PC pronti ──
/** Quanto costa adesso un PC pronto: i pezzi che mancano (quelli che hai già non si ripagano), con lo sconto.
 *  → { tot, pieno: senza sconto, listino: tutto il PC scontato, mancanti: [{ id, n }] } o null */
export function prezzoPronto(id, s = leggi()) {
  const p = PRONTO_PER_ID[id]
  if (!p) return null
  const serve = {}
  for (const k of CATEGORIE) { const q = posto(p.pezzi, k.id); if (q) serve[q.id] = (serve[q.id] ?? 0) + q.n }
  const tutto = Object.entries(serve).reduce((a, [i, n]) => a + PER_ID[i].prezzo * n, 0)
  const mancanti = Object.entries(serve).map(([i, n]) => ({ id: i, n: Math.max(0, n - (s.posseduti[i] ?? 0)) })).filter((q) => q.n > 0)
  const pieno = mancanti.reduce((a, q) => a + PER_ID[q.id].prezzo * q.n, 0)
  return { tot: Math.round(pieno * (1 - p.sconto)), pieno, listino: Math.round(tutto * (1 - p.sconto)), mancanti }
}
/** I PC pronti di miniera-dati.mjs, con il prezzo: `listino` è tutto il PC scontato, `prezzo` quello che costa adesso a te. */
export const PRONTI = PRONTI_DATI.map((p) => ({ ...p, listino: prezzoPronto(p.id, { posseduti: {} }).listino, get prezzo() { return prezzoPronto(p.id).tot } }))

/** Compra i pezzi che mancano di un PC pronto e monta tutto (al posto della postazione di prima, che resta tua): la banca,
 *  coi suoi prezzi. → Promise<{ ok, tot, comprati } | { ok: false, errore, manca? }> */
export const compraPronto = (id) => fai('miniera.compraPronto', { id })
