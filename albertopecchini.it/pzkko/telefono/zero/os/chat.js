// La Chat di pzk os a 8 bit (29.10, Alberto: «fai solo app chat completissima e se va bene e io ti dico ok fai tutte le
// altre»): la chat col bot pzk dentro l'lcd 256 × 128 (os.js, lcd.js). I COMANDI SONO QUELLI VERI (chat/comandi/*, lo stesso
// motore di chat/chat.js: le attese, gli eventi casuali, il cercapersone scassato, i soldi): ogni comando riceve un «ctx»
// come quello della chat in HTML, ma qui le schede, i tasti, le griglie dei minigiochi (le mine, il gratta e vinci), i
// rulli della slot, le barre del tempo e la riga da scrivere si disegnano a pixel. Le schede sono messaggi con la barra
// a sinistra, l'icona di Alberto (a un bit, icone.js) e il titolo, il testo a capo a 40 colonne, i campi «nome: valore»,
// il piè; i tasti di seguito e le scelte dei minigiochi sono riquadri che la croce sceglie e OK preme. Lo stile è quello
// del Flipper: tutto a un bit, le cornici smussate, la voce scelta rovesciata.
//
// Come si usa: si scrive dalla tastiera vera (le lettere, Backspace, Invio manda) o, con OK a riga vuota, dalla tastiera
// sullo schermo (os.tastiera). Mentre si scrive, sopra la riga ci sono i suggerimenti (chat/predittivo.js, gli stessi
// della chat grande: i comandi e i loro argomenti): sinistra/destra scelgono, OK completa. A riga vuota sopra la riga ci
// sono i CONSIGLIATI (2.11, Alberto: «fai che la chat mostri subito dei tasti da dove cominciare e con i comandi
// consigliati»): tasti coi comandi pronti adesso (il premio giornaliero, le quest pronte, lavora, pesca), poi le ultime
// righe scritte (zaino.rapidi) e saldo, negozio, aiuto; ← → li scelgono, OK manda, il clic li manda subito. Su e giù
// scorrono i messaggi. INDIETRO cancella la riga, e a
// riga vuota esce dall'app. Quando un minigioco aspetta una scelta, la croce va sui suoi tasti (o sulle celle della
// griglia) e OK preme; quando aspetta una parola (scrivi), la riga mostra cosa vuole. I messaggi restano (storia:
// sessionStorage nella sessione, localStorage per conto), come nella chat grande.
import * as os from './os.js'
import { Lcd, W, H } from './lcd.js'
import * as icone from './icone.js'
import * as zaino from '../../../chat/zaino.js'
import * as pzk from '../../../games/pzk.js'
import * as led from '../../../chat/led.js'
import * as missioni from '../../../chat/missioni.js'
import * as chat from '../../../chat/chat.js'
import { icona, conIcone } from '../../../chat/icone.js'
import { COMANDI, PER_NOME, CATEGORIE } from '../../../chat/comandi/index.js'
import { eventoCasuale, salutoIniziale } from '../../../chat/comandi/eventi.js'
import { NEGOZIO, PER_ID } from '../../../chat/testi.js'
import { prezzoDi } from '../../../chat/mercato.js'
import { calcola } from '../../../chat/predittivo.js'
import { txt, corto } from './pezzi.js'

const RIDOTTO = matchMedia('(prefers-reduced-motion: reduce)')
const { fmt, pzkHtml, eurHtml, nome, importo, caso, rnd, tra, durata, analizza, dormi } = chat
const BARRA = os.BARRA
const COL = 40 // le colonne di testo dentro una scheda (x 10 → 250)
const X0 = 10 // dove comincia il testo delle schede (la barra a sinistra sta a x 6, sul margine: REGOLE.md)

// ── i messaggi ──
let msgs = [] // { tipo: 'tu' | 'sistema' | 'bot' | 'pensa', testo, e, av, fatto, pensa, righe, h, scelte, rulli, tempo }
let scorri = 0 // px dal fondo
let riga = '', storia = [], iStoria = -1, iRapidi = -1
let sugg = null, iSugg = -1
let scelte = [] // le scelte in corso (scegli), anche più d'una: le mine hanno la griglia e «incassa» sulla stessa scheda
let scelta = null // quella dove sta la croce
let aspettaTesto = null // { risolvi, segnaposto }
let coda = Promise.resolve()
let salutato = false, ultimoGiorno = ''
const inCorso = new Set()
let cambiato = () => {}

const esc = (t) => String(t)
/** L'html di una scheda, a testo: via i tag, le entità sciolte, le :icone: tolte, <code> fra parentesi quadre. */
export function pulisci(html) {
  return txt(String(html ?? '') // (txt: un carattere senza glifo diventa «?», mai il quadratino; anche i nomi degli altri)
    .replace(/<span class="c-carta coperta"><\/span>/gi, ' ■ ').replace(/<span class="c-carta[^"]*">/gi, ' ') // (le carte del blackjack staccate: prima «K♦7♣» tutto attaccato)
    .replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>\s*<p[^>]*>/gi, '\n').replace(/<li[^>]*>/gi, '\n• ').replace(/<\/(div|p|tr|h\d)>/gi, '\n')
    .replace(/<code[^>]*>([^<]*)<\/code>/gi, '[$1]')
    .replace(/<img[^>]*alt="([^"]*)"[^>]*>/gi, '').replace(/<[^>]+>/g, '')
    .replace(/:([a-z0-9-]+):/g, '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/[ \t]+/g, ' ').replace(/ *\n */g, '\n').trim())
}
/** L'icona dentro un pezzetto di html (alt="nome"), se c'è. */
const iconaIn = (html) => /alt="([^"]+)"/.exec(String(html ?? ''))?.[1] ?? null

function aggiungi(m) {
  msgs.push(m)
  while (msgs.length > 120) msgs.shift()
  scorri = 0
  os.ridisegna()
  salvaPoi()
  return m
}
const invalida = (m) => { if (m) { m.righe = null } os.ridisegna(); salvaPoi() }

export function utente(testo) { return aggiungi({ tipo: 'tu', testo: String(testo) }) }
export function sistema(testo) { return aggiungi({ tipo: 'sistema', testo: pulisci(conIcone(testo)) }) }

/** Una scheda del bot: nasce subito (i comandi la usano appena creata), compare dopo i puntini (500 ms), una alla volta. */
export function scheda(e) {
  const m = { tipo: 'bot', e: { ...e }, av: e.av ?? 'bot', fatto: false, righe: null, rulli: rulliDa(e.html) }
  aggiungi(m)
  if (RIDOTTO.matches) { m.fatto = true; m.pronta = Promise.resolve() }
  else {
    m.pronta = coda = coda.then(async () => {
      if (m.fatto) return
      led.inizia()
      m.pensa = true; os.ridisegna()
      await new Promise((r) => { m.salta = r; setTimeout(r, chat.RITARDO_MS) })
      m.pensa = false; m.fatto = true; m.salta = null
      led.finisci()
      invalida(m)
    }).catch(() => {})
  }
  return maniglia(m)
}
/** I rulli della slot dentro l'html (chat/comandi/giochi.js): tre celle con le icone, che girano finché la slot non si ferma. */
function rulliDa(html) {
  if (!/c-rulli/.test(String(html ?? ''))) return null
  const nomi = [...String(html).matchAll(/alt="([^"]+)"/g)].map((m) => m[1]).slice(0, 3)
  while (nomi.length < 3) nomi.push('sette')
  return nomi.map((n) => ({ icona: n, gira: /gira/.test(html) }))
}
export function aggiorna(s, e) {
  const m = s.__msg
  if (!m.fatto) { m.fatto = true; m.pensa = false; m.salta?.(); led.finisci() }
  if (e.av) m.av = e.av
  m.e = { ...e }
  m.azioniObj = null; m.selAzione = null // (le azioni nuove della scheda: prima restavano quelle di prima)
  m.rulli = rulliDa(e.html) ?? m.rulli
  invalida(m)
  return s
}
export function tempo(s, ms) {
  const m = s.__msg
  m.tempo = { da: Date.now(), ms, fermo: false }
  invalida(m)
  return () => { if (m.tempo) m.tempo.fermo = true; os.ridisegna() }
}
/** I tasti sotto la scheda: → Promise dell'id premuto (null allo scadere). griglia: g3 | g5 (le celle di un minigioco). */
// ── le scelte che sono direzioni (29.10, Alberto: «come faccio a premere quando faccio lavoro rider? le freccie non vanno
// per la sequenza»): la consegna del rider (sinistra, dritto, destra), il rigore (sinistra, centro, destra). Lì le frecce
// PREMONO il tasto della loro direzione, subito, e il tasto porta la sua freccia; OK preme ancora quello scelto ──
const VERSO = { sinistra: 'sx', destra: 'dx', dritto: 'su', centro: 'su', su: 'su', giù: 'giu', giu: 'giu' }
const FRECCIA = { sx: '←', dx: '→', su: '↑', giu: '↓' }
function direzioni(lista) {
  if (!lista.length || !lista.every((b) => VERSO[b.dataset.id])) return null
  const d = {}
  for (const b of lista) { const k = VERSO[b.dataset.id]; if (d[k]) return null; d[k] = b }
  return d
}
export async function scegli(s, bottoni, ms = 0, { griglia = null, onPremuto = null } = {}) {
  const m = s.__msg
  await m.pronta
  const lista = bottoni.map((b) => bottone(m, b))
  const dir = griglia ? null : direzioni(lista)
  if (dir) for (const [k, b] of Object.entries(dir)) b.eti = `${FRECCIA[k]} ${b.eti}`
  return new Promise((risolvi) => {
    const sc = { m, lista, griglia, sel: 0, onPremuto, timer: 0, risolvi, dir }
    // (30.10: più scelte sulla stessa scheda, le mine chiamano scegli due volte, la griglia e «incassa»: prima l'ultima
    // cancellava la prima e la griglia non c'era. Restano quelle ancora vive, le finite di prima (il blackjack) vanno via)
    m.scelte = [...(m.scelte ?? []).filter((x) => scelte.includes(x)), sc]
    scelte.push(sc)
    if (!scelta || scelta.m !== m) scelta = sc // (la croce resta sulla prima della scheda: la griglia, non «incassa»)
    scorri = 0
    invalida(m)
    segui()
    sc.fine = (id, premuto) => {
      if (sc.finita) return
      sc.finita = true
      clearTimeout(sc.timer)
      for (const b of lista) { b.disabled = true; if (b === premuto) b.premuto = true }
      scelte = scelte.filter((x) => x !== sc)
      if (scelta === sc) scelta = scelte.findLast((x) => x.m === m) ?? scelte.at(-1) ?? null
      invalida(m)
      risolvi(id)
    }
    if (ms > 0) sc.timer = setTimeout(() => sc.fine(null, null), ms)
  })
}
/** Le scelte coi tasti tutti spenti da chi le ha chiamate (le mine, finita la partita, spengono anche l'altra) si chiudono
 *  come allo scadere: se no la croce restava su tasti morti. → true se ne ha chiusa qualcuna. */
function riordina() {
  let n = 0
  for (const sc of [...scelte]) if (!sc.lista.some((b) => !b.disabled)) { sc.fine(null, null); n++ }
  return n > 0
}
/** Un comando nuovo mentre una scelta aspetta: le scelte in corso finiscono come allo scadere (null), così il gioco di
 *  prima chiude i conti (30.10: restava appeso per sempre, la puntata sul tavolo e «stai già facendo»). */
function annulla() { for (const sc of [...scelte]) sc.fine(null, null) }
const manda = (cmd) => { annulla(); return esegui(cmd) }
/** Un tasto di una scheda: fa anche da finto elemento per i comandi che lo toccano (innerHTML, classList, disabled). */
function bottone(m, b) {
  const o = {
    dataset: { id: String(b.id) }, eti: pulisci(conIcone(b.eti ?? b.id)), icona: iconaIn(icona(b.eti ?? '')) || null, stile: b.stile ?? '', disabled: false, premuto: false, style: {},
    get innerHTML() { return o.eti },
    set innerHTML(v) { const i = iconaIn(v); if (i) { o.icona = i; o.eti = '' } else o.eti = pulisci(v); invalida(m) },
    classList: { add: (c) => { o[c] = true; invalida(m) }, remove: (c) => { o[c] = false; invalida(m) }, contains: (c) => !!o[c], toggle: (c, v) => { o[c] = v ?? !o[c]; invalida(m) } },
    querySelector: () => ({ style: {} }),
  }
  return o
}
/** Preme il tasto scelto (la croce ci è sopra e OK, o il mouse). */
function premi(sc, b) {
  if (!b || b.disabled) return
  const riga = { querySelector: (sel) => { const id = /data-id="([^"]+)"/.exec(sel)?.[1]; return sc.lista.find((x) => x.dataset.id === id) ?? null }, querySelectorAll: () => sc.lista }
  if (sc.onPremuto) { const r = sc.onPremuto(b.dataset.id, b, riga); if (r === 'continua') { invalida(sc.m); return } if (r !== undefined) return sc.fine(r, b) }
  sc.fine(b.dataset.id, b)
}
/** Aspetta che si scriva qualcosa nella riga: → Promise del testo (null allo scadere). */
export function scrivi(ms = 0, { segnaposto = 'scrivi qui…' } = {}) {
  return new Promise((risolvi) => {
    let timer = 0
    aspettaTesto = { segnaposto, risolvi: (t) => { clearTimeout(timer); aspettaTesto = null; os.ridisegna(); risolvi(t) } }
    if (ms > 0) timer = setTimeout(() => aspettaTesto?.risolvi(null), ms)
    os.ridisegna()
  })
}
export async function inVista(s, ms = 0) { await s.__msg.pronta; if (ms) await dormi(ms) }
export async function pensa(ms = 700) {
  led.colpo(ms)
  const m = aggiungi({ tipo: 'pensa' })
  await dormi(ms)
  msgs = msgs.filter((x) => x !== m); os.ridisegna()
}
/** I tasti delle scelte di una scheda: «.c-bottoni button» solo quelli in fila, «.c-griglia button» solo le celle, se no tutti. */
const tastiDi = (m, sel = '') => (m.scelte ?? []).filter((sc) => (/c-bottoni/.test(sel) ? !sc.griglia : /c-griglia/.test(sel) ? !!sc.griglia : true)).flatMap((sc) => sc.lista)
/** La maniglia di una scheda: quello che i comandi si aspettano da un elemento (le Promise, querySelector dei pezzi che toccano). */
function maniglia(m) {
  const s = {
    __msg: m, style: {}, classList: { add() {}, remove() {}, contains: () => false },
    get __pronta() { return m.pronta }, get __fatto() { return m.fatto },
    querySelector(sel) {
      if (sel === '.c-rulli') return { classList: { remove: () => { m.rulli?.forEach((r) => { r.gira = false }); invalida(m) }, add: () => {} } }
      if (sel === '.c-testo') return { set innerHTML(v) { m.e.d = v; invalida(m) }, get innerHTML() { return m.e.d ?? '' } }
      // un pezzo di testo con un attributo data- (la consegna del rider: «[data-fatte]», le svolte già fatte): scrive nel
      // corpo della scheda. Prima tornava null e alla prima svolta il gioco si rompeva («fatte» era null)
      if (/^\[data-(?!id\b)[\w-]+\]$/.test(sel)) { const noop = () => {}; return { set innerHTML(v) { m.e.html = v; invalida(m) }, get innerHTML() { return m.e.html ?? '' }, set textContent(v) { m.e.html = String(v); invalida(m) }, get textContent() { return m.e.html ?? '' }, style: {}, classList: { add: noop, remove: noop, toggle: noop, contains: () => false } } }
      const id = /data-id="([^"]+)"/.exec(sel)?.[1]
      if (id) return tastiDi(m).findLast((b) => b.dataset.id === id) ?? null
      if (/button/.test(sel)) return tastiDi(m, sel)[0] ?? null
      return null
    },
    querySelectorAll(sel) {
      if (sel === '.c-rulli div') { m.rulli ??= rulliDa('<div class="c-rulli">'); return m.rulli.map((r) => ({ set innerHTML(v) { r.icona = iconaIn(v) ?? r.icona; r.gira = false; invalida(m) }, style: {}, querySelector: () => ({ style: {} }) })) }
      if (/button/.test(sel)) return tastiDi(m, sel)
      return []
    },
    appendChild() {},
  }
  return s
}

// ── i comandi: lo stesso giro di chat/chat.js (attese, scassato, eventi), con le schede di qui ──
const RICOMPRA = /^(cercapersone|pager)$/i
const prezzoPager = () => prezzoDi(PER_ID.pager)
const AZIONI_SCASSATO = [['lavora', ':rider: lavora', 'oro'], ['compra cercapersone', ':pager: compra il nuovo']]
const passaDaRotto = (c, testo) => c?.nomi[0] === 'lavora' || (c?.nomi[0] === 'compra' && RICOMPRA.test(testo.trim()))
const passaPredittivo = (c, testo) => !zaino.pagerRotto() || (testo == null ? AZIONI_SCASSATO.some(([r]) => PER_NOME.get(analizza(r).nome) === c) : passaDaRotto(c, testo))
const soloScassato = () => scheda({ colore: 'rosso', av: 'bot-triste', t: ':pager: cercapersone scassato', d: `col vetro rotto funzionano solo due cose: <code>lavora</code> e <code>compra cercapersone</code> (${pzkHtml(prezzoPager())}).`, azioni: AZIONI_SCASSATO })

function ctxDi(args, testo) {
  const mie = [] // (le schede di questo comando: se si rompe, i suoi rulli si fermano)
  const sua = (e) => { const s = scheda(e); mie.push(s.__msg); return s }
  const ctx = {
    __mie: mie, args, testo, zaino, pzk, dì: sua, scheda: sua, aggiorna, scegli, scrivi, tempo, dormi, inVista, pensa, sistema, utente,
    nome, importo, caso, rnd, tra, durata, fmt, pzkHtml, eurHtml, icona, conIcone,
    esegui, apriWallet: (sez) => pzk.apriWallet(sez), apriApp: (app) => os.apri(app), comandi: COMANDI, perNome: PER_NOME, categorie: CATEGORIE,
    // (31.10) la banca, come nella chat grande (chat.js): fai chiede, no dice il suo no, morte racconta la morte che ha deciso lei
    fai: (cosa, a) => chat.chiedi(ctx, cosa, a), no: (r, cmd) => chat.rifiuto(ctx, r, cmd),
    morte: (m) => { ctx.__morteVista = true; chat.mostraMorte(sua, m) },
    saleDiLivello: (l) => l && scheda({ colore: 'oro', av: 'bot-ride', t: ':livello: livello ' + l + '!', d: `sei salito di livello: adesso le paghe valgono ×${zaino.moltiplicatore().toLocaleString('it-IT')}.` }),
  }
  return ctx
}
export async function esegui(riga, { muto = false } = {}) {
  const { nome: n, args, testo } = analizza(riga)
  if (!n) return
  if (!muto) utente(riga.replace(/^\/+/, ''))
  const c = PER_NOME.get(n)
  led.colpo(160)
  if (zaino.pagerRotto() && !passaDaRotto(c, testo)) return soloScassato()
  if (!c) {
    const x = NEGOZIO.find((o) => o.id === n || o.nome.toLowerCase() === n)
    if (x) { scheda({ colore: 'ambra', av: 'bot-pensa', t: `:${x.id}: «${n}» non è un comando`, d: `ma <b>${x.nome}</b> è nel negozio (${pzkHtml(x.prezzo)}). Cosa ne vuoi fare?`, azioni: [[`compra ${x.id}`, 'compra', 'oro'], [`usa ${x.id}`, 'usa'], [`info ${x.id}`, 'info']] }); return }
    scheda({ colore: 'rosso', av: 'bot-pensa', t: 'eh?', d: `«${n}» non lo conosco. Scrivi <code>aiuto</code> per l'elenco dei comandi.` }); return
  }
  const chiave = c.nomi[0]
  if (!muto) zaino.ricorda(riga)
  if (c.attesa) {
    const m = zaino.manca(chiave)
    if (m > 0) { const s = scheda({ colore: 'ambra', av: 'bot-pensa', t: ':clessidra: calma', d: `«${chiave}» lo puoi rifare fra <b>${durata(m)}</b>.${zaino.effetto('caffe') ? '' : ' Un caffè dal negozio dimezza le attese.'}` }); tempo(s, Math.min(m, 60_000)); return }
  }
  if (inCorso.has(chiave)) { scheda({ colore: 'ambra', av: 'bot-arrabbiato', d: `stai già facendo «${chiave}»: finisci quello.` }); return }
  inCorso.add(chiave)
  const ctx = ctxDi(args, testo)
  try {
    // (31.10) l'attesa, il conto dei comandi e il dado degli eventi li fa la banca dentro l'azione del comando (chat.js, esegui)
    await c.fai(ctx)
    if (ctx.__morte && !ctx.__morteVista) ctx.morte(ctx.__morte)
    if (ctx.__evento) await eventoCasuale(ctx, ctx.__evento)
  } catch (e) {
    console.error('chat 8 bit:', e)
    for (const m of ctx.__mie) m.rulli?.forEach((r) => { r.gira = false }) // (la slot rotta a metà: i rulli giravano per sempre e il tic ridisegnava)
    scheda({ colore: 'rosso', av: 'bot-arrabbiato', t: 'qualcosa si è rotto', d: `${e.message ?? e}` })
  } finally {
    inCorso.delete(chiave)
    os.ridisegna()
  }
}
function invia() {
  const r = riga.trim()
  if (!r) return
  riga = ''; sugg = null; iSugg = -1; iRapidi = -1
  if (aspettaTesto) { utente(r); aspettaTesto.risolvi(r); return }
  storia.push(r); if (storia.length > 50) storia.shift(); iStoria = storia.length
  manda(r)
}
/** Le azioni di seguito di una scheda (azioni: [[comando, etichetta, stile]]) si mandano come comandi. */
function azione(cmd) {
  if (aspettaTesto) return
  if (/[<[]/.test(cmd)) { riga = cmd.replace(/\s*[<[].*$/, ' '); suggerisci(); return }
  manda(cmd)
}
/** Le azioni di seguito di una scheda, come tasti finti (le crea il disegno, le usa anche la croce). */
const azioniDi = (m) => (m.azioniObj ??= (m.e?.azioni ?? []).map(([cmd, eti, stile]) => ({ dataset: { id: cmd }, eti: pulisci(conIcone(eti ?? cmd)), stile, azione: true })))

// ── la storia: i messaggi restano (sessione o conto, come la chat grande) ──
let storiaDove = null, storiaAttesa = 0
const doveStoria = () => { const c = pzk.conto(); return c ? { dep: localStorage, k: `pzkko-zero-chat:${c.ind}` } : { dep: sessionStorage, k: 'pzkko-zero-chat' } }
function salva() {
  clearTimeout(storiaAttesa)
  if (!storiaDove) return
  const piatti = msgs.filter((m) => m.tipo !== 'pensa' && (m.tipo !== 'bot' || m.fatto)).slice(-80).map((m) => {
    if (m.tipo !== 'bot') return { tipo: m.tipo, testo: m.testo }
    const { t, d, html, campi, pie, colore, azioni } = m.e
    return { tipo: 'bot', av: m.av, e: { t, d, html: m.rulli ? '' : html, campi, pie, colore, azioni }, rulli: m.rulli?.map((r) => ({ icona: r.icona })) ?? null,
      scelte: m.scelte?.length ? m.scelte.map((sc) => ({ griglia: sc.griglia, lista: sc.lista.map((b) => ({ dataset: b.dataset, eti: b.eti, icona: b.icona, stile: b.stile, premuto: b.premuto, aperta: b.aperta, bum: b.bum, disabled: true })) })) : null }
  })
  try { storiaDove.dep.setItem(storiaDove.k, JSON.stringify({ giorno: ultimoGiorno, msgs: piatti })) } catch {}
}
const salvaPoi = () => { clearTimeout(storiaAttesa); storiaAttesa = setTimeout(salva, 800) }
function carica() {
  storiaDove = doveStoria()
  msgs = []
  try {
    const j = JSON.parse(storiaDove.dep.getItem(storiaDove.k) || 'null')
    ultimoGiorno = j?.giorno ?? ''
    for (const p of j?.msgs ?? []) {
      if (p.tipo !== 'bot') { msgs.push({ tipo: p.tipo, testo: p.testo }); continue }
      const m = { tipo: 'bot', e: p.e ?? {}, av: p.av ?? 'bot', fatto: true, pronta: Promise.resolve(), righe: null, rulli: p.rulli?.map((r) => ({ icona: r.icona, gira: false })) ?? null }
      const ps = p.scelte ?? (p.bottoni ? [p.bottoni] : null) // (bottoni: la storia di prima, una scelta sola)
      if (ps) m.scelte = ps.map((q) => ({ m, griglia: q.griglia, lista: q.lista.map((b) => Object.assign(bottone(m, { id: b.dataset.id, eti: b.eti, stile: b.stile }), { icona: b.icona, premuto: b.premuto, aperta: b.aperta, bum: b.bum, disabled: true })), sel: 0, fine() {} }))
      msgs.push(m)
    }
  } catch {}
  scorri = 0
}

// ── i suggerimenti (chat/predittivo.js) e le scelte rapide ──
function suggerisci() {
  iSugg = -1
  if (!riga.trim() || aspettaTesto || scelta) { sugg = null; return }
  try { sugg = calcola(riga, { passa: passaPredittivo, durata })?.voci?.slice(0, 4) ?? null } catch { sugg = null }
  if (sugg && !sugg.length) sugg = null
  os.ridisegna()
}
function completa() {
  const r = calcola(riga, { passa: passaPredittivo, durata })
  const v = sugg?.[Math.max(0, iSugg)]
  if (!r || !v) return
  riga = `${r.prima}${v.v} `
  suggerisci()
}
// i consigliati: prima quello che è pronto adesso, poi le ultime righe scritte, poi i comandi per orientarsi
const PRONTI = [['giornaliero', () => zaino.manca('giornaliero') === 0], ['missioni', () => missioni.pronte() > 0], ['lavora', () => zaino.manca('lavora') === 0], ['pesca', () => zaino.manca('pesca') === 0]]
function rapidi() {
  if (zaino.pagerRotto()) return AZIONI_SCASSATO.map(([r]) => r)
  const l = []
  for (const [c, pronto] of PRONTI) { try { if (pronto()) l.push(c) } catch {} }
  return [...new Set([...l, ...zaino.rapidi().slice(0, 4), 'saldo', 'negozio', 'aiuto'])].slice(0, 8)
}
/** L'ultima scheda del bot con le sue azioni di seguito ([compra] [usa]…), se a riga vuota la croce va su quelle. */
function ultimaConAzioni() {
  const ub = msgs.findLast((m) => m.tipo === 'bot')
  return !riga.trim() && !aspettaTesto && ub?.fatto && !ub.scelte?.length && azioniDi(ub).length ? ub : null // (con le scelte le azioni non si disegnano)
}
/** I consigliati si vedono quando ← → vanno a loro: niente da completare, niente scelte, riga vuota (o uno di loro scelto). */
const conConsigli = () => !sugg && !scelta && !aspettaTesto && (!riga.trim() || iRapidi >= 0) && !ultimaConAzioni()

// ── l'impaginazione: ogni messaggio diventa righe { h, d(l, y) } ──
// il clic del mouse (os.zona): solo dentro la fascia dei messaggi che si vede, e un tasto si preme come con OK
let banda = [0, 0]
const zonaChat = (x, y, w, h, fn) => { const y0 = Math.max(y, banda[0]), y1 = Math.min(y + h, banda[1]); if (y1 > y0) os.zona(x, y0, w, y1 - y0, fn) }
function clicca(sc, b) {
  if (!b || b.disabled) return
  if (sc && scelte.includes(sc)) { scelta = sc; sc.sel = sc.lista.indexOf(b); premi(sc, b); invalida(sc.m); return }
  if (b.azione && !aspettaTesto) azione(b.dataset.id)
}
const rigaTesto = (s, x, opz) => ({ h: 9, d: (l, y) => l.testo(x, y, s, opz) })
function impagina(m) {
  const R = []
  if (m.tipo === 'pensa') { R.push({ h: 12, d: (l, y, t) => { l.bitmap(icone.bitmap('bot-pensa', 16), 6, y - 2); l.testo(26, y + 1, '.'.repeat(1 + (Math.floor(t / 3) % 3))) } }); return R }
  if (m.tipo === 'sistema') { for (const r of Lcd.acapo(m.testo, 42)) R.push({ h: 9, d: (l, y) => l.testo(Math.round(W / 2 - Lcd.larghezza(r) / 2), y, r) }); R.push({ h: 3, d() {} }); return R }
  if (m.tipo === 'tu') {
    const righe = Lcd.acapo(m.testo, 36)
    const w = Math.max(...righe.map((r) => Lcd.larghezza(r))) + 10, h = righe.length * 9 + 5
    R.push({ h: h + 3, d: (l, y) => { const x = W - 6 - w; l.cornice(x, y, w, h); righe.forEach((r, i) => l.testo(x + 5, y + 3 + i * 9, r)) } })
    return R
  }
  // la scheda del bot
  const e = m.e
  if (m.pensa) { R.push({ h: 12, d: (l, y, t) => { l.bitmap(icone.bitmap('bot-pensa', 16), 6, y - 2); l.testo(26, y + 1, '.'.repeat(1 + (Math.floor(t / 3) % 3))) } }); return R }
  const testa = { h: 18, d: (l, y) => { l.bitmap(icone.bitmap(m.av, 16), X0 - 2, y) } }
  R.push(testa)
  const titolo = pulisci(conIcone(e.t ?? ''))
  if (titolo) { const righe = Lcd.acapo(titolo, 36); righe.forEach((r, i) => { if (i === 0) testa.d = ((d) => (l, y) => { d(l, y); l.testo(X0 + 20, y + 1, r) })(testa.d); else R.push(rigaTesto(r, X0 + 20)) }) }
  else testa.h = 16
  const corpo = [pulisci(conIcone(e.d ?? '')), m.rulli ? '' : pulisci(conIcone(e.html ?? ''))].filter(Boolean).join('\n')
  for (const r of Lcd.acapo(corpo, COL)) if (r) R.push(rigaTesto(r, X0)); else R.push({ h: 4, d() {} })
  if (m.rulli) R.push({ h: 24, d: (l, y, t) => m.rulli.forEach((r, i) => { const x = X0 + i * 24; l.cornice(x, y, 22, 22); const nome = r.gira ? RULLI[(t + i * 2) % RULLI.length] : r.icona; l.bitmap(icone.bitmap(nome, 16), x + 3, y + 3) }) })
  for (const [n, v] of e.campi ?? []) { const s = `${pulisci(conIcone(n))}: ${pulisci(conIcone(v))}`; for (const r of Lcd.acapo(s, COL)) R.push(rigaTesto(r, X0)) }
  if (e.pie) for (const r of Lcd.acapo('· ' + pulisci(conIcone(e.pie)), COL)) R.push(rigaTesto(r, X0))
  if (m.tempo) { const tm = m.tempo; R.push({ h: 6, d: (l, y) => { const k = tm.fermo ? 0 : Math.max(0, 1 - (Date.now() - tm.da) / tm.ms); l.riempi(X0, y + 1, Math.round(230 * k), 2) } }) } // (tm preso qui: m.tempo diventa null a tempo scaduto e queste righe restano in memoria, rileggerlo dava «reading 'fermo'»; la fine la decide il tic, anche fuori schermo)
  // i tasti: quelli di seguito (azioni) e quelli delle scelte (scegli, anche più d'una: la griglia e «incassa»), in fila o in griglia
  for (const sc of m.scelte?.length ? m.scelte : [null]) {
    if (sc?.griglia) {
      const n = sc.griglia === 'g5' ? 5 : 3, lato = 18
      for (let r = 0; r < Math.ceil(sc.lista.length / n); r++) R.push({ h: lato + 1, sc, da: r * n, a: r * n + n - 1, d: (l, y) => { for (let c = 0; c < n; c++) { const b = sc.lista[r * n + c]; if (!b) continue; const x = X0 + c * (lato + 1), on = scelta === sc && sc.sel === r * n + c; if (on) l.riempi(x, y, lato, lato); else l.cornice(x, y, lato, lato); if (b.icona) l.bitmap(icone.bitmap(b.icona, 16), x + 1, y + 1, { inv: on }); else l.testo(x + 6, y + 5, b.bum ? '*' : b.eti.slice(0, 1), { inv: on }); zonaChat(x, y, lato, lato, () => clicca(sc, b)) } } })
      R.push({ h: 2, d() {} })
      continue
    }
    const fila = sc ? sc.lista : azioniDi(m)
    if (!fila.length) continue
    const righe = []
    let r = [], w = 0
    for (const b of fila) { const bw = Lcd.larghezza(b.eti || '?') + 8; if (w + bw > 240 && r.length) { righe.push(r); r = []; w = 0 } r.push(b); w += bw + 3 }
    if (r.length) righe.push(r)
    for (const fr of righe) R.push({ h: 13, sc, da: sc ? sc.lista.indexOf(fr[0]) : -1, a: sc ? sc.lista.indexOf(fr.at(-1)) : -1, d: (l, y) => { let x = X0; for (const b of fr) { const bw = Lcd.larghezza(b.eti || '?') + 8, on = sc ? scelta === sc && sc.lista[sc.sel] === b : m.selAzione === b; if (on || b.premuto) l.riempi(x, y, bw, 11); else l.cornice(x, y, bw, 11); if (b.disabled && !b.premuto) l.testo(x + 4, y + 2, b.eti || '?'); else l.testo(x + 4, y + 2, b.eti || '?', { inv: on || b.premuto }); { const bb = b; zonaChat(x, y, bw, 11, () => clicca(sc, bb)) } x += bw + 3 } } })
  }
  R.push({ h: 4, d() {} })
  return R
}
const RULLI = ['ciliegia', 'limone', 'sette', 'campana', 'diamante', 'chiocciola-oro', 'bar', 'trifoglio', 'anguria', 'uva', 'stella', 'dado']
const righeDi = (m) => (m.righe ??= impagina(m))
const altezza = (m) => righeDi(m).reduce((a, r) => a + r.h, 0)
/** La riga della scelta in corso sempre in vista: scorre quanto basta perché ci stia tutta (31.10: la griglia delle mine è
 *  più alta dello schermo, la prima fila restava sopra e la casella scelta non si vedeva). */
function segui() {
  const sc = scelta
  if (!sc) return
  const k = msgs.indexOf(sc.m)
  if (k < 0) return
  const R = righeDi(sc.m)
  let su = 0, riga = null
  for (const r of R) { if (r.sc === sc && sc.sel >= r.da && sc.sel <= r.a) { riga = r; break } su += r.h }
  if (!riga) return
  let sotto = altezza(sc.m) - su - riga.h // (dal fondo della riga al fondo della chat)
  for (let i = k + 1; i < msgs.length; i++) sotto += altezza(msgs[i])
  const yIn = H - 17, alta = yIn - (sugg ? 11 : 1) - (BARRA + 1)
  scorri = Math.max(0, Math.min(sotto, Math.max(scorri, sotto + riga.h - alta)))
}

// ── la vista ──
let vistaUnica = null
export function vista() {
  if (vistaUnica) return vistaUnica
  carica()
  pzk.osserva(() => { const d = doveStoria(); if (d.k !== storiaDove?.k) { salva(); carica(); os.ridisegna() } })
  const v = {
    nome: 'chat', app: 'chat',
    entra() {
      if (!salutato) { salutato = true; if (ultimoGiorno !== new Date().toDateString()) { ultimoGiorno = new Date().toDateString(); salutoIniziale(ctxDi([], '')) } }
      os.ridisegna()
    },
    /** Un comando da scrivere arrivando (telefono.js: apri('chat', { comando })). */
    comando(c) { if (typeof c === 'string' && c.trim()) manda(c) },
    tic(t) {
      let ancora = riordina()
      const ora = Date.now()
      for (const m of msgs) if (m.tempo && (m.tempo.fermo || ora - m.tempo.da >= m.tempo.ms)) { m.tempo = null; m.righe = null; ancora = true } // (la barra del tempo finisce qui e non nel disegno: fuori schermo restava, e il tic ridisegnava per sempre)
      if (ancora || msgs.some((m) => m.pensa || m.tipo === 'pensa' || m.rulli?.some((r) => r.gira) || m.tempo)) os.ridisegna()
    },
    disegna(l, t) {
      const consigli = conConsigli() ? rapidi() : null
      const conSugg = !!sugg || !!consigli
      const yIn = H - 17, yTop = BARRA + 1, yFondo = yIn - (consigli ? 14 : conSugg ? 11 : 1) // (sopra i tasti consigliati un filo d'aria: l'ultima riga ci finiva attaccata)
      // i messaggi, dal fondo in su
      l.ritaglia([0, yTop, W, yFondo - yTop])
      banda = [yTop, yFondo]
      let y = yFondo + scorri
      for (let i = msgs.length - 1; i >= 0 && y > yTop; i--) {
        const m = msgs[i], R = righeDi(m), h = R.reduce((a, r) => a + r.h, 0)
        y -= h
        if (y + h < yTop) break
        let yy = y
        for (const r of R) { if (yy + r.h > yTop && yy < yFondo) r.d(l, yy, t); yy += r.h }
        // la barra a sinistra delle schede del bot
        if (m.tipo === 'bot' && !m.pensa) l.riempi(6, y, 2, h - 4)
      }
      l.ritaglia(null)
      if (scorri > 0) { const s = `↓ ${Math.ceil(scorri / 16)}`, w = Lcd.larghezza(s) + 6, x = W - os.MARGINE - 4 - w; l.riempi(x - 1, yTop, w + 2, 12, 0); l.riempi(x, yTop + 1, w, 10); l.testo(x + 3, yTop + 2, s, { inv: true }); os.zona(x, yTop + 1, w, 10, () => { scorri = 0 }) } // (un bollino rovesciato con l'aria attorno: prima il testo finiva attaccato a quello dei messaggi)
      // i suggerimenti sopra la riga
      // i consigliati: tasti incorniciati in fila; quello scelto rovesciato e sempre in vista (la fila parte più avanti)
      if (consigli) {
        // (quelli che non ci stanno: ◀ e ▶ ai lati dicono che ce ne sono altri, e ← → ci arrivano)
        const lista = consigli.map((c) => { const s = corto(txt(c), 20); return { c, s, w: Lcd.larghezza(s) + 6 } })
        const tutti = 10 + lista.reduce((a, b) => a + b.w + 3, 0) <= W - 8, x0 = tutti ? 10 : 17, fine = tutti ? W - 8 : W - 15
        let da = 0
        while (iRapidi > da && x0 + lista.slice(da, iRapidi + 1).reduce((a, b) => a + b.w + 3, 0) - 3 > fine) da++
        let x = x0, ultimo = da - 1
        for (let i = da; i < lista.length; i++) {
          const { c, s, w } = lista[i]
          if (x + w > fine) break
          ultimo = i
          const on = i === iRapidi
          if (on) l.riempi(x, yIn - 11, w, 10); else l.cornice(x, yIn - 11, w, 10)
          l.testo(x + 3, yIn - 10, s, { inv: on })
          os.zona(x, yIn - 11, w, 10, () => { riga = ''; iRapidi = -1; storia.push(c); iStoria = storia.length; manda(c) }) // (il clic manda subito)
          x += w + 3
        }
        if (da > 0) l.testo(8, yIn - 10, '◀')
        if (ultimo < lista.length - 1) l.testo(W - 13, yIn - 10, '▶')
      }
      if (sugg) {
        let x = 10
        l.orizz(6, yIn - 12, W - 12)
        sugg.forEach((s, i) => { const w = Lcd.larghezza(s.v) + 4; if (x + w > W - 8) return; if (i === iSugg) l.riempi(x - 1, yIn - 10, w, 9); l.testo(x + 1, yIn - 9, txt(s.v), { inv: i === iSugg }); os.zona(x - 1, yIn - 11, w, 11, () => { iSugg = i; completa() }); x += w + 4 })
      }
      // la riga da scrivere (dentro il margine: le punte dello schermo sono stondate)
      l.orizz(6, yIn - 1, W - 12)
      l.testo(9, yIn + 3, '›')
      const max = Math.floor((W - 26) / 6)
      if (riga) { const vis = riga.length > max ? riga.slice(-max) : riga; l.testo(16, yIn + 3, vis); if (t % 10 < 5) l.riempi(16 + Lcd.larghezza(vis) + 2, yIn + 2, 5, 9) }
      else if (aspettaTesto) l.testo(16, yIn + 3, `[${aspettaTesto.segnaposto}]`)
      else if (scelta?.dir) l.testo(16, yIn + 3, `premi ${Object.keys(scelta.dir).map((k) => FRECCIA[k]).join(' ')} o fai clic`)
      else if (scelta) l.testo(16, yIn + 3, 'croce: scegli · OK: premi')
      else { if (t % 10 < 5) l.riempi(16, yIn + 2, 5, 9); l.testo(24, yIn + 3, consigli ? 'scrivi, o ←→ un consiglio e OK' : 'scrivi un comando (aiuto)') } // (il cursore prima del suggerimento: sopra ne copriva la «s»)
    },
    tasto(n) {
      riordina()
      if (scelta?.dir?.[n]) { const sc = scelta, b = sc.dir[n]; sc.sel = sc.lista.indexOf(b); premi(sc, b); invalida(sc.m); return true } // (la freccia preme la sua direzione)
      if (scelta) {
        const sc = scelta, cols = sc.griglia === 'g5' ? 5 : sc.griglia === 'g3' ? 3 : sc.lista.length, N = sc.lista.length
        // (più scelte insieme, le mine: ↑ dalla prima riga e ↓ dall'ultima passano alla scelta di prima o di dopo)
        const i = scelte.indexOf(sc), prima = scelte[i - 1], dopo = scelte[i + 1], r = Math.floor(sc.sel / cols), ultima = r >= Math.ceil(N / cols) - 1, selPrima = sc.sel
        if (n === 'sx') sc.sel = (sc.sel - 1 + N) % N
        else if (n === 'dx') sc.sel = (sc.sel + 1) % N
        else if (n === 'su') { if (sc.griglia && r > 0) sc.sel -= cols; else if (prima) scelta = prima; else if (sc.griglia) sc.sel = (sc.sel - cols + N) % N; else scorri = Math.min(scorri + 16, Math.max(0, msgs.reduce((a, m) => a + altezza(m), 0) - 60)) }
        else if (n === 'giu') { if (sc.griglia && !ultima) sc.sel = Math.min(N - 1, sc.sel + cols); else if (dopo) scelta = dopo; else if (sc.griglia) sc.sel = (sc.sel + cols) % N; else scorri = Math.max(0, scorri - 16) }
        else if (n === 'ok') premi(sc, sc.lista[sc.sel])
        else if (n === 'indietro') { if (riga) { riga = ''; sugg = null } else os.togli() }
        invalida(sc.m)
        if (scelta && scelta !== sc) invalida(scelta.m)
        if (scelta !== sc || sc.sel !== selPrima) segui() // (la casella nuova in vista; lo scorrere a mano coi tasti lo lascia stare)
        return true
      }
      if (n === 'su') { scorri = Math.min(scorri + 16, Math.max(0, msgs.reduce((a, m) => a + altezza(m), 0) - 60)); return true }
      if (n === 'giu') { scorri = Math.max(0, scorri - 16); return true }
      // le azioni di seguito dell'ultima scheda (i tasti [compra] [usa]…): a riga vuota la croce le sceglie e OK le manda. Solo
      // l'ultima scheda del bot (30.10: prima ← → pescavano l'ultima con azioni anche lontana, fuori schermo, e i rapidi non si raggiungevano)
      const ua = ultimaConAzioni()
      if (n === 'sx' || n === 'dx') {
        if (sugg) { iSugg = (iSugg + (n === 'dx' ? 1 : -1) + sugg.length) % sugg.length; return true }
        if (ua && iRapidi < 0) { const l = ua.azioniObj, i = l.indexOf(ua.selAzione); ua.selAzione = l[(i + (n === 'dx' ? 1 : -1) + l.length) % l.length]; for (const m of msgs) if (m !== ua && m.selAzione) { m.selAzione = null; m.righe = null } scorri = 0; invalida(ua); return true }
        if (!riga.trim() || iRapidi >= 0) { const r = rapidi(); iRapidi = iRapidi < 0 ? (n === 'dx' ? 0 : r.length - 1) : (iRapidi + (n === 'dx' ? 1 : -1) + r.length) % r.length; riga = r[iRapidi]; return true } // (da nessuno: → il primo, ← l'ultimo)
        return true
      }
      if (n === 'ok') {
        if (sugg && iSugg >= 0) { completa(); return true }
        if (riga.trim()) { invia(); return true }
        if (ua?.selAzione) { const cmd = ua.selAzione.dataset.id; ua.selAzione = null; invalida(ua); azione(cmd); return true }
        // a riga vuota: la tastiera sullo schermo; se c'è un'azione di seguito nell'ultima scheda, prima quella
        const att = aspettaTesto // (30.10: la risposta che arriva tardi, a scrivi già scaduto, non diventa un comando: si butta)
        os.tastiera({ titolo: att ? att.segnaposto : 'il comando' }).then((t) => { if (t == null || (att && aspettaTesto !== att)) return; riga = t; invia() })
        return true
      }
      if (n === 'indietro') { if (riga) { riga = ''; sugg = null; iRapidi = -1; return true } os.togli(); return true }
      return false
    },
    carattere(ch) { if (ch.length === 1) { riga += ch; iRapidi = -1; suggerisci() } },
    cancella() { riga = riga.slice(0, -1); iRapidi = -1; suggerisci() },
    scrivendo: () => riga.length > 0,
    invio() { if (sugg && iSugg >= 0) completa(); else if (riga.trim()) invia(); else { riga = ''; v.tasto('ok') } }, // (a riga vuota Invio è OK: preme la scelta, l'azione, apre la tastiera)
    /** Un'azione di seguito (le [azioni] delle schede): l'ultima scheda con azioni, la prima azione. */
    azione(cmd) { azione(cmd) },
  }
  vistaUnica = v
  return v
}
