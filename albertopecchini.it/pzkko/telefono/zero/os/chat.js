// La Chat di pzk os a 8 bit (29.10, Alberto: «fai solo app chat completissima e se va bene e io ti dico ok fai tutte le
// altre»): la chat col bot pzk dentro l'lcd 256 × 128 (os.js, lcd.js). I COMANDI SONO QUELLI VERI (chat/comandi/*, lo stesso
// motore di chat/chat.js: le attese, gli eventi casuali, il cercapersone scassato, i soldi): ogni comando riceve un «ctx»
// come quello della chat in HTML, ma qui le schede, i tasti, le griglie dei minigiochi (le mine, il gratta e vinci), i
// rulli della slot, le barre del tempo e la riga da scrivere si disegnano a pixel. Le schede sono messaggi con la barra
// a sinistra, l'icona di Alberto (a un bit, icone.js) e il titolo, il testo a capo a 40 colonne, i campi «nome: valore»,
// il piè; i tasti di seguito e le scelte dei minigiochi sono riquadri che la croce sceglie e OK preme. Lo stile è quello
// del Flipper: tutto a un bit, le cornici smussate, la voce scelta rovesciata.
//
// Come si usa (4.11, Alberto: «i tasti che premo danno comandi diversi da quel che hanno di nome… fai una cosa più facile:
// uno che non ha mai aperto il sito fa fatica»): c'è SEMPRE un tasto scelto, rovesciato. ← → lo spostano su tutto quello
// che si può premere adesso: i tasti dell'ultima scheda, poi i CONSIGLIATI nella fila in fondo (2.11, Alberto: «fai che la
// chat mostri subito dei tasti da dove cominciare»: i comandi pronti adesso, il premio giornaliero, le quest, lavora, pesca;
// poi le ultime righe scritte, zaino.rapidi, e saldo, negozio, aiuto), poi «scrivi…», la tastiera sullo schermo
// (os.tastiera). OK preme quello scelto, il clic quello sotto il mouse, e il fumetto dice il nome del tasto premuto. ↑ ↓
// scorrono i messaggi (in fondo «· ↑ leggi» se sopra c'è da leggere). Dalla tastiera vera si scrive e basta: sopra la
// riga ci sono i suggerimenti (chat/predittivo.js: i comandi e i loro argomenti), ← → li scelgono, OK completa, Invio
// manda. INDIETRO cancella la riga, e a riga vuota esce dall'app. Quando un minigioco aspetta una scelta, la croce va sui
// suoi tasti (o sulle celle della griglia) e OK preme; quando aspetta una parola (scrivi) la parola è un tasto. I messaggi
// restano (storia: sessionStorage nella sessione, localStorage per conto), come nella chat grande.
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
let riga = ''
let sugg = null, iSugg = -1
let cur = null // il tasto scelto (la sua chiave, tasti() qui sotto): 'a:<comando>' della scheda, 'c:<comando>' consigliato, 'p:<parola>', 'scrivi'
let curScheda = null // l'ultima scheda coi tasti già vista: quando ne arriva una nuova, il cursore va sul suo primo tasto
let scelte = [] // le scelte in corso (scegli), anche più d'una: le mine hanno la griglia e «incassa» sulla stessa scheda
let scelta = null // quella dove sta la croce
let aspettaTesto = null // { risolvi, segnaposto }
let coda = Promise.resolve()
let salutato = false, ultimoGiorno = ''
const inCorso = new Set()
let cambiato = () => {}
let nSchede = 0 // quante schede ha scritto il bot da quando la pagina è aperta (per il collaudo: adesso)

const esc = (t) => String(t)
/** L'html di una scheda, a testo: via i tag, le entità sciolte, le :icone: tolte, <code> fra parentesi quadre. */
export function pulisci(html) {
  return txt(String(html ?? '') // (txt: un carattere senza glifo diventa «?», mai il quadratino; anche i nomi degli altri)
    .replace(/<span class="c-carta coperta"><\/span>/gi, ' ■ ').replace(/<span class="c-carta[^"]*">/gi, ' ') // (le carte del blackjack staccate: prima «K♦7♣» tutto attaccato)
    .replace(/<\/b>\s*<small[^>]*>/gi, '</b> · ').replace(/<\/small>\s*(?=<(small|span)\b)/gi, '</small> · ') // (il nome e la riga piccola sotto: «La campana stonatati manca: livello 2» tutto attaccato)
    .replace(/<s\b[^>]*>([^<]*)<\/s>\s*(<span class="c-v-sconto">[^<]*<\/span>)?/gi, '$1 → ') // (il prezzo in offerta: «40-20 %32 $pzk» diventa «40 → 32 $pzk»)
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
  const m = { tipo: 'bot', e: { ...e }, av: e.av ?? 'bot', fatto: false, righe: null, rulli: rulliDa(e.html), n: ++nSchede }
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
  m.azioniObj = null // (le azioni nuove della scheda: prima restavano quelle di prima)
  if (e.senzaTasti) m.scelte = (m.scelte ?? []).filter((x) => scelte.includes(x)) // (6.11, il nastro: i tasti delle scelte già finite se ne vanno, la scheda è quella del pezzo nuovo)
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
  // (6.11) l'icona di un tasto: il nome nudo («gemma») o fra due punti («:canna:»). Un tasto di sola icona, in fila, prende
  // per scritta il nome dell'icona: prima restava vuoto e si disegnava «?» (i cinque tasti del turno da meccanico)
  const grezza = String(b.eti ?? b.id), ic = iconaIn(icona(grezza)) || iconaIn(conIcone(grezza)) || null
  const o = {
    dataset: { id: String(b.id) }, eti: pulisci(conIcone(grezza)) || (ic ? ic.replaceAll('-', ' ') : ''), icona: ic, stile: b.stile ?? '', disabled: false, premuto: false, style: {},
    get innerHTML() { return o.eti },
    set innerHTML(v) { const i = iconaIn(v); if (i) { o.icona = i; o.eti = '' } else o.eti = pulisci(v); invalida(m) },
    classList: { add: (c) => { o[c] = true; invalida(m) }, remove: (c) => { o[c] = false; invalida(m) }, contains: (c) => !!o[c], toggle: (c, v) => { o[c] = v ?? !o[c]; invalida(m) } },
    querySelector: () => ({ style: {} }),
  }
  return o
}
/** Sposta la croce di una scelta in fila al prossimo tasto che si preme (verso: 1 o -1; in tondo). I tasti spenti si
 *  saltano (6.11: i pezzi già premuti dei minigiochi): c'è sempre un tasto scelto, e OK preme quello (REGOLE.md 3.12). */
function vivo(sc, verso) {
  const N = sc.lista.length
  for (let k = 0; k < N; k++) { sc.sel = (sc.sel + verso + N) % N; if (!sc.lista[sc.sel].disabled) return }
}
/** Preme il tasto scelto (la croce ci è sopra e OK, o il mouse). */
function premi(sc, b) {
  if (!b || b.disabled) return
  const riga = { querySelector: (sel) => { const id = /data-id="([^"]+)"/.exec(sel)?.[1]; return sc.lista.find((x) => x.dataset.id === id) ?? null }, querySelectorAll: () => sc.lista }
  if (sc.onPremuto) { const r = sc.onPremuto(b.dataset.id, b, riga); if (r === 'continua') { if (!sc.griglia && sc.lista[sc.sel]?.disabled) vivo(sc, 1); invalida(sc.m); return } if (r !== undefined) return sc.fine(r, b) }
  sc.fine(b.dataset.id, b)
}
/** Aspetta che si scriva qualcosa nella riga: → Promise del testo (null allo scadere). */
export function scrivi(ms = 0, { segnaposto = 'scrivi qui…' } = {}) {
  return new Promise((risolvi) => {
    let timer = 0
    aspettaTesto = { segnaposto, risolvi: (t) => { clearTimeout(timer); aspettaTesto = null; os.ridisegna(); risolvi(t) } }
    // (6.11) la parola da premere (PRENDILA, la parola del veloce) prende la croce quando compare: prima OK premeva il tasto
    // su cui la croce era rimasta, anche «scrivi…», e la parola restava lì
    const p = parola(segnaposto)
    if (p) { cur = 'p:' + p; curScheda = schedaAttiva() }
    if (ms > 0) timer = setTimeout(() => aspettaTesto?.risolvi(null), ms)
    os.ridisegna()
  })
}
/** Chiude quello che una scheda aspetta ancora, le sue scelte e la riga da scrivere, come allo scadere (6.11, i minigiochi
 *  del turno: la risposta si dà coi tasti o scrivendo, e chi arriva prima spegne l'altro). */
export function smetti(s) {
  const m = s?.__msg
  for (const sc of [...scelte]) if (!m || sc.m === m) sc.fine(null, null)
  aspettaTesto?.risolvi(null)
}
/** Chiede le icone prima che servano (le webp di riserva arrivano dopo: icone.js). Non aspetta niente. */
export const caricaIcone = (nomi, lato = 16) => { for (const n of nomi) icone.bitmap(n, lato) }
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
    __mie: mie, args, testo, zaino, pzk, dì: sua, scheda: sua, aggiorna, scegli, scrivi, smetti, caricaIcone, tempo, dormi, inVista, pensa, sistema, utente,
    nome, importo, caso, rnd, tra, durata, fmt, pzkHtml, eurHtml, icona, conIcone,
    esegui, apriWallet: (sez) => pzk.apriWallet(sez), apriApp: (app) => os.apri(app), comandi: COMANDI, perNome: PER_NOME, categorie: CATEGORIE,
    // (31.10) la banca, come nella chat grande (chat.js): fai chiede, no dice il suo no, morte racconta la morte che ha deciso lei
    fai: (cosa, a) => chat.chiedi(ctx, cosa, a), no: (r, cmd) => chat.rifiuto(ctx, r, cmd),
    morte: (m) => { ctx.__morteVista = true; chat.mostraMorte(sua, m) },
    saleDiLivello: (l) => l && scheda({ colore: 'oro', av: 'bot-ride', t: ':livello: livello ' + l + '!', d: `sei salito di livello: adesso le paghe valgono ×${zaino.moltiplicatore().toLocaleString('it-IT')}.` }),
  }
  return ctx
}
/** eti: il nome del tasto che l'ha mandato. Il fumetto dice quello (4.11, Alberto: «i tasti che premo danno comandi diversi
 *  da quel che hanno di nome»: «comincia La rana che canta» diventava il fumetto «quest rana»), e fra gli ultimi comandi
 *  dei consigliati ci vanno solo quelli scritti o consigliati, non i tasti di una scheda. */
export async function esegui(riga, { muto = false, eti = null } = {}) {
  const { nome: n, args, testo } = analizza(riga)
  if (!n) return
  if (!muto) utente(eti ?? riga.replace(/^\/+/, ''))
  const c = PER_NOME.get(n)
  led.colpo(160)
  if (zaino.pagerRotto() && !passaDaRotto(c, testo)) return soloScassato()
  if (!c) {
    const x = NEGOZIO.find((o) => o.id === n || o.nome.toLowerCase() === n)
    if (x) { scheda({ colore: 'ambra', av: 'bot-pensa', t: `:${x.id}: «${n}» non è un comando`, d: `ma <b>${x.nome}</b> è nel negozio (${pzkHtml(x.prezzo)}). Cosa ne vuoi fare?`, azioni: [[`compra ${x.id}`, 'compra', 'oro'], [`usa ${x.id}`, 'usa'], [`info ${x.id}`, 'info']] }); return }
    scheda({ colore: 'rosso', av: 'bot-pensa', t: 'eh?', d: `«${n}» non lo conosco. Scrivi <code>aiuto</code> per l'elenco dei comandi.` }); return
  }
  const chiave = c.nomi[0]
  if (!muto && !eti) zaino.ricorda(riga)
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
  riga = ''; sugg = null; iSugg = -1
  if (!r) return
  if (aspettaTesto) { utente(r); aspettaTesto.risolvi(r); return }
  manda(r)
}
/** Le azioni di seguito di una scheda (azioni: [[comando, etichetta, stile]]) si mandano come comandi, col fumetto che dice
 *  il nome del tasto. Un comando da finire («manda pzk123 », «slot <puntata>») apre la tastiera già scritta fin lì. */
function azione(cmd, eti = null) {
  if (aspettaTesto) return
  if (/[<[]/.test(cmd) || /\s$/.test(cmd)) return scriviComando(cmd.replace(/\s*[<[].*$/, '').trimEnd() + ' ', eti)
  annulla()
  return esegui(cmd, { eti: eti || null }) // (un tasto di sola icona ha il nome vuoto: allora il fumetto dice il comando)
}
/** La tastiera sullo schermo: quello che si scrive va nella chat (un comando, o la risposta che un gioco aspetta). */
function scriviComando(testo = '', titolo = null) {
  const att = aspettaTesto // (30.10: la risposta che arriva tardi, a scrivi già scaduto, non diventa un comando: si butta)
  os.tastiera({ testo, titolo: titolo ?? (att ? 'la risposta' : 'scrivi un comando') }).then((t) => { if (t == null || !t.trim() || (att && aspettaTesto !== att)) return; riga = t; invia() })
}
/** I tasti che nella chat grande stavano DENTRO l'html (data-cmd): «compra» su ogni pezzo della vetrina, i nomi delle
 *  classifiche («tocca un nome»). Qui non si toccano: diventano tasti della scheda, col nome della cosa («compra Canna»). */
function azioniHtml(html) {
  const s = String(html ?? ''), out = []
  for (const x of s.matchAll(/<(button|tr|li)\b[^>]*\bdata-cmd="([^"]+)"[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const [, tag, cmd, dentro] = x
    // (un tasto: il suo testo, il nome in grassetto prima di lui e il prezzo fra i due, se c'è: «compra sbrisolona (40 $pzk)»)
    const prima = s.slice(0, x.index), b = [...prima.matchAll(/<b>([^<]*)<\/b>/gi)].at(-1), prezzo = b ? [...prima.slice(b.index).matchAll(/<span class="pzk">([^<]*)<\/span>/gi)].at(-1)?.[1] : null
    const detto = tag.toLowerCase() === 'button' ? `${pulisci(dentro)}${b ? ' ' + pulisci(b[1]) : ''}` : pulisci((/<b>([^<]*)<\/b>/i.exec(dentro) ?? /<td[^>]*>[^<]*<\/td>\s*<td[^>]*>([^<]*)/i.exec(dentro))?.[1] ?? dentro)
    out.push([cmd, prezzo ? `${detto} (${pulisci(prezzo)})` : detto, '', detto]) // (detto: il fumetto, senza il prezzo)
  }
  return out
}
/** Un'etichetta che sta in un tasto: se è lunga si accorcia il nome, il prezzo fra parentesi in fondo resta intero. */
function accorcia(s, n = 38) {
  if ([...s].length <= n) return s
  const m = /^(.*?)( \([^()]*\))$/.exec(s)
  return m && m[2].length < n - 10 ? corto(m[1], n - [...m[2]].length) + m[2] : corto(s, n)
}
/** Le azioni di seguito di una scheda, come tasti finti (le crea il disegno, le usa anche la croce). «spento» (una scelta
 *  di una quest che non puoi fare) non si preme: prima la croce ci arrivava e OK mandava il comando lo stesso. */
const azioniDi = (m) => (m.azioniObj ??= [...azioniHtml(m.e?.html), ...(m.e?.azioni ?? [])].map(([cmd, eti, stile, detto]) => ({ dataset: { id: cmd }, eti: accorcia(pulisci(conIcone(eti ?? cmd))), detto: detto ?? pulisci(conIcone(eti ?? cmd)), stile, disabled: stile === 'spento', azione: true })))

// ── la storia: i messaggi restano (sessione o conto, come la chat grande) ──
let storiaDove = null, storiaAttesa = 0
const doveStoria = () => { const c = pzk.conto(); return c ? { dep: localStorage, k: `pzkko-zero-chat:${c.ind}` } : { dep: sessionStorage, k: 'pzkko-zero-chat' } }
function salva() {
  clearTimeout(storiaAttesa)
  if (!storiaDove) return
  const piatti = msgs.filter((m) => m.tipo !== 'pensa' && (m.tipo !== 'bot' || m.fatto)).slice(-80).map((m) => {
    if (m.tipo !== 'bot') return { tipo: m.tipo, testo: m.testo }
    const { t, d, html, campi, pie, colore, azioni, icone: ic, lato } = m.e
    return { tipo: 'bot', av: m.av, e: { t, d, html: m.rulli ? '' : html, campi, pie, colore, azioni, icone: ic, lato }, rulli: m.rulli?.map((r) => ({ icona: r.icona })) ?? null,
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
      // (vecchia: i tasti delle schede di ieri restano disegnati, spenti; non mandano più niente, erano per allora)
      const m = { tipo: 'bot', e: p.e ?? {}, av: p.av ?? 'bot', fatto: true, vecchia: true, pronta: Promise.resolve(), righe: null, rulli: p.rulli?.map((r) => ({ icona: r.icona, gira: false })) ?? null }
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
  let voci = []
  try { voci = calcola(riga, { passa: passaPredittivo, durata })?.voci?.slice(0, 6) ?? [] } catch {}
  // solo quelli che ci stanno nella fila: prima ← → arrivavano anche a quelli non disegnati, e OK completava una cosa che non si vedeva
  sugg = []
  let x = 10
  for (const s of voci) { const w = Lcd.larghezza(txt(s.v)) + 4; if (x + w > W - 8) break; sugg.push(s); x += w + 4 }
  if (!sugg.length) sugg = null
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

// ── i tasti di adesso (4.11, Alberto: «in chat è buggato perché i tasti che premo danno comandi diversi da quel che hanno di
// nome… fai una cosa più facile: uno che non ha mai aperto il sito fa fatica»). Prima c'erano tre modi diversi (i consigliati
// che riempivano la riga, le azioni dell'ultima scheda che li nascondevano, OK a vuoto che apriva la tastiera) e niente di
// scelto finché non si toccava una freccia. Adesso UN cursore solo, sempre su un tasto che si vede: ← → lo spostano su tutto
// quello che si può premere adesso (i tasti dell'ultima scheda, poi i consigliati in fondo, poi «scrivi…»), OK preme proprio
// quello evidenziato, il clic preme quello sotto il mouse, e il fumetto dice il nome del tasto premuto. Il cursore si ricorda
// per CHIAVE e non per posto: se la fila cambia (un premio diventa pronto), resta sullo stesso tasto o torna al primo ──
/** L'ultima scheda del bot, se i suoi tasti si premono adesso. Quelle prima, e quelle di ieri, restano disegnate spente. */
function schedaAttiva() {
  if (aspettaTesto || scelta) return null
  const ub = msgs.findLast((m) => m.tipo === 'bot')
  return ub?.fatto && !ub.vecchia && !ub.scelte?.length && azioniDi(ub).some((b) => !b.disabled) ? ub : null // (con le scelte le azioni non si disegnano)
}
/** La parola che un evento vuole scritta (la banconota: PRENDILA, la nutria: SCIÒ): diventa un tasto. Coi soli sei tasti
 *  scriverla in cinque secondi con la tastiera sullo schermo non si fa. */
const parola = (seg) => (seg && /^[\p{L}\d]{2,16}$/u.test(seg) ? seg : null)
/** Tutto quello che si può premere adesso, in ordine: { k, eti, fai, b?, m?, fila? } (fila: sta nella fila in fondo). */
function tasti() {
  if (scelta || riga) return [] // (una scelta ha la sua croce; mentre si scrive, ← → scelgono i suggerimenti)
  const l = []
  if (aspettaTesto) {
    const p = parola(aspettaTesto.segnaposto)
    if (p) l.push({ k: 'p:' + p, eti: p, fila: true, fai: () => { const a = aspettaTesto; if (a) { utente(p); a.risolvi(p) } } })
  } else {
    const ua = schedaAttiva()
    if (ua) azioniDi(ua).forEach((b, i) => { if (!b.disabled) l.push({ k: `a:${i}:${b.dataset.id}`, eti: b.eti, b, m: ua, fai: () => azione(b.dataset.id, b.detto) }) })
    for (const c of rapidi()) l.push({ k: 'c:' + c, eti: c, fila: true, fai: () => manda(c) })
  }
  l.push({ k: 'scrivi', eti: 'scrivi…', fila: true, fai: () => scriviComando() })
  return l
}
/** Quale tasto è scelto (senza cambiare niente: lo usa anche il disegno). Una scheda nuova coi tasti porta il cursore sul suo primo. */
function quale(l) {
  const ua = schedaAttiva()
  if (ua && ua !== curScheda) { const i = l.findIndex((t) => t.m === ua); if (i >= 0) return i }
  const i = l.findIndex((t) => t.k === cur)
  return i >= 0 ? i : l.length ? 0 : -1
}
/** Come quale, ma se lo segna (lo chiamano i tasti, prima di muoversi o premere). */
function fissa(l) { const i = quale(l); curScheda = schedaAttiva(); cur = l[i]?.k ?? null; return i }
const Y_IN = H - 17 // la riga in fondo (il suggerimento, o quello che si scrive)
/** Dove finiscono i messaggi: sopra la fila dei tasti, o dei suggerimenti, o subito sopra la riga in fondo. */
const fondo = () => Y_IN - (!scelta && !riga ? 14 : riga && sugg ? 11 : 1) // (sopra la fila un filo d'aria: l'ultima riga ci finiva attaccata)
const maxScorri = () => Math.max(0, msgs.reduce((a, m) => a + altezza(m), 0) - (fondo() - BARRA - 1))
let selOra = null, attivaOra = null // (solo per il disegno: il tasto scelto e la scheda attiva, presi una volta a disegno)
/** La riga in fondo quando non si scrive: cosa fanno i tasti adesso, coi tasti per nome (REGOLE.md 3.3 e 3.4). */
function aiuto() {
  if (scelta?.dir) return `premi ${Object.keys(scelta.dir).map((k) => FRECCIA[k]).join(' ')} o fai clic`
  if (scelta) return scelta.griglia ? '← → ↑ ↓ scegli · OK premi' : aspettaTesto ? '← → scegli · OK premi · o scrivila' : '← → scegli · OK premi'
  if (aspettaTesto && !parola(aspettaTesto.segnaposto)) return 'scrivi e Invio, o OK tastiera'
  return scorri < maxScorri() ? '← → scegli · OK premi · ↑ leggi' : '← → scegli · OK premi' // (4.11: chi arriva non sapeva che ↑ fa leggere i messaggi di prima)
}

// ── l'impaginazione: ogni messaggio diventa righe { h, d(l, y) } ──
// il clic del mouse (os.zona): solo dentro la fascia dei messaggi che si vede, e un tasto si preme come con OK
let banda = [0, 0]
const zonaChat = (x, y, w, h, fn) => { const y0 = Math.max(y, banda[0]), y1 = Math.min(y + h, banda[1]); if (y1 > y0) os.zona(x, y0, w, y1 - y0, fn) }
function clicca(sc, b) {
  if (!b || b.disabled || !sc || !scelte.includes(sc)) return
  scelta = sc; sc.sel = sc.lista.indexOf(b); premi(sc, b); invalida(sc.m)
}
/** La cornice a puntini: un tasto che c'è ma adesso non si preme. */
function puntini(l, x, y, w, h) {
  for (let i = 0; i < w; i += 2) { l.px(x + i, y); l.px(x + i, y + h - 1) }
  for (let j = 2; j < h - 1; j += 2) { l.px(x, y + j); l.px(x + w - 1, y + j) }
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
  const corpo = [pulisci(conIcone(e.d ?? '')), m.rulli ? '' : pulisci(conIcone(String(e.html ?? '').replace(/<button\b[^>]*\bdata-cmd[^>]*>[\s\S]*?<\/button>/gi, '')))].filter(Boolean).join('\n') // (i tasti data-cmd sono diventati tasti della scheda, azioniHtml: nel testo restava un «compra» che non si premeva)
  for (const r of Lcd.acapo(corpo, COL)) if (r) R.push(rigaTesto(r, X0)); else R.push({ h: 4, d() {} })
  if (m.rulli) R.push({ h: 24, d: (l, y, t) => m.rulli.forEach((r, i) => { const x = X0 + i * 24; l.cornice(x, y, 22, 22); const nome = r.gira ? RULLI[(t + i * 2) % RULLI.length] : r.icona; l.bitmap(icone.bitmap(nome, 16), x + 3, y + 3) }) })
  // (6.11) le icone della scheda (`icone`: i nomi; `lato`: 16 o 32): una fila di riquadri, come i rulli. È il modo di far
  // VEDERE un'icona nella chat: quelle dentro il testo (:canna:, <img>) pulisci le toglie
  if (e.icone?.length) { const nomi = [...e.icone], lato = e.lato === 32 ? 32 : 16, c = lato + 6; R.push({ h: c + 3, d: (l, y) => nomi.forEach((n, i) => { const x = X0 + i * (c + 2); l.cornice(x, y, c, c); l.bitmap(icone.bitmap(n, lato), x + 3, y + 3) }) }) }
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
    // (le azioni: si premono solo quelle dell'ultima scheda, schedaAttiva; le altre e quelle «spento» hanno la cornice a
    // puntini e il clic non le prende: tutto quello che si clicca si fa anche coi tasti, REGOLE.md)
    for (const fr of righe) R.push({ h: 13, sc, az: sc ? null : fr, da: sc ? sc.lista.indexOf(fr[0]) : -1, a: sc ? sc.lista.indexOf(fr.at(-1)) : -1, d: (l, y) => {
      let x = X0
      const viva = !sc && attivaOra === m
      for (const b of fr) {
        const bw = Lcd.larghezza(b.eti || '?') + 8, on = sc ? scelta === sc && sc.lista[sc.sel] === b : viva && selOra?.b === b
        const morta = !sc && (!viva || b.disabled)
        if (on || b.premuto) l.riempi(x, y, bw, 11); else if (morta || b.usato) puntini(l, x, y, bw, 11); else l.cornice(x, y, bw, 11) // (usato: un pezzo già premuto, minigiochi.js)
        l.testo(x + 4, y + 2, b.eti || '?', { inv: on || b.premuto })
        const bb = b
        if (sc) zonaChat(x, y, bw, 11, () => clicca(sc, bb))
        else if (!morta) zonaChat(x, y, bw, 11, () => { cur = null; curScheda = m; azione(bb.dataset.id, bb.detto) })
        x += bw + 3
      }
    } })
  }
  R.push({ h: 4, d() {} })
  return R
}
const RULLI = ['ciliegia', 'limone', 'sette', 'campana', 'diamante', 'chiocciola-oro', 'bar', 'trifoglio', 'anguria', 'uva', 'stella', 'dado']
const righeDi = (m) => (m.righe ??= impagina(m))
const altezza = (m) => righeDi(m).reduce((a, r) => a + r.h, 0)
/** La riga della scelta in corso, o del tasto scelto della scheda, sempre in vista: scorre quanto basta perché ci stia tutta
 *  (31.10: la griglia delle mine è più alta dello schermo, la prima fila restava sopra e la casella scelta non si vedeva). */
function segui() {
  if (scelta) { const sc = scelta; return mostra(sc.m, (r) => r.sc === sc && sc.sel >= r.da && sc.sel <= r.a) }
  const l = tasti(), t = l[quale(l)]
  if (t?.b) mostra(t.m, (r) => r.az?.includes(t.b))
}
function mostra(m, cerca) {
  const k = msgs.indexOf(m)
  if (k < 0) return
  let su = 0, riga = null
  for (const r of righeDi(m)) { if (cerca(r)) { riga = r; break } su += r.h }
  if (!riga) return
  let sotto = altezza(m) - su - riga.h // (dal fondo della riga al fondo della chat)
  for (let i = k + 1; i < msgs.length; i++) sotto += altezza(msgs[i])
  const alta = fondo() - (BARRA + 1) - 12 // (12: in cima, da scorsi, c'è il bollino «↓ 3»; il tasto scelto ci finiva sotto)
  scorri = Math.max(0, Math.min(sotto, Math.max(scorri, sotto + riga.h - alta)))
}

/** Per il collaudo (tools/pzkko/zero/prova.mjs --turni): cosa aspetta la chat adesso e cosa dice l'ultima scheda. */
export const adesso = () => {
  const u = msgs.findLast((m) => m.tipo === 'bot')
  return {
    scelta: scelta && { sel: scelta.sel, griglia: scelta.griglia ?? null, dir: scelta.dir ? Object.fromEntries(Object.entries(scelta.dir).map(([k, b]) => [b.dataset.id, k])) : null, tasti: scelta.lista.map((b) => ({ id: b.dataset.id, eti: b.eti, spento: !!b.disabled })) },
    scrivi: aspettaTesto?.segnaposto ?? null,
    scheda: u ? { t: pulisci(conIcone(u.e.t ?? '')), d: pulisci(conIcone(u.e.d ?? '')), pie: pulisci(conIcone(u.e.pie ?? '')), icone: u.e.icone ?? [], fatta: !!u.fatto } : null,
    schede: nSchede, occupata: inCorso.size > 0,
    ultime: msgs.filter((m) => m.tipo === 'bot' && m.n).slice(-4).map((m) => ({ n: m.n, t: pulisci(conIcone(m.e.t ?? '')) })),
  }
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
      // una scheda nuova coi tasti: il cursore va sul suo primo, e quello si vede (la vetrina è più alta dello schermo: il
      // primo «compra» restava sopra, scelto ma fuori vista)
      const ua = schedaAttiva()
      if (ua && ua !== curScheda && !riga) { fissa(tasti()); segui(); ancora = true }
      const ora = Date.now()
      for (const m of msgs) if (m.tempo && (m.tempo.fermo || ora - m.tempo.da >= m.tempo.ms)) { m.tempo = null; m.righe = null; ancora = true } // (la barra del tempo finisce qui e non nel disegno: fuori schermo restava, e il tic ridisegnava per sempre)
      if (ancora || msgs.some((m) => m.pensa || m.tipo === 'pensa' || m.rulli?.some((r) => r.gira) || m.tempo)) os.ridisegna()
    },
    disegna(l, t) {
      const lista = tasti()
      selOra = lista[quale(lista)] ?? null; attivaOra = schedaAttiva()
      const yIn = Y_IN, yTop = BARRA + 1, yFondo = fondo()
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
      // la fila in fondo: i consigliati e «scrivi…», incorniciati; quello scelto rovesciato e sempre in vista (la fila parte
      // più avanti; ◀ e ▶ ai lati dicono che ce ne sono altri, e ← → ci arrivano)
      const fila = lista.filter((x) => x.fila)
      if (fila.length) {
        const pezzi = fila.map((x) => { const s = corto(txt(x.eti), 20); return { x, s, w: Lcd.larghezza(s) + 6 } })
        const tutti = 10 + pezzi.reduce((a, p) => a + p.w + 3, 0) <= W - 8, x0 = tutti ? 10 : 17, fine = tutti ? W - 8 : W - 15
        const iSel = fila.indexOf(selOra)
        let da = 0
        while (iSel > da && x0 + pezzi.slice(da, iSel + 1).reduce((a, p) => a + p.w + 3, 0) - 3 > fine) da++
        let x = x0, ultimo = da - 1
        for (let i = da; i < pezzi.length; i++) {
          const { x: tasto, s, w } = pezzi[i]
          if (x + w > fine) break
          ultimo = i
          const on = i === iSel
          if (on) l.riempi(x, yIn - 11, w, 10); else l.cornice(x, yIn - 11, w, 10)
          l.testo(x + 3, yIn - 10, s, { inv: on })
          os.zona(x, yIn - 11, w, 10, () => { cur = tasto.k; tasto.fai() }) // (il clic preme subito)
          x += w + 3
        }
        if (da > 0) l.testo(8, yIn - 10, '◀')
        if (ultimo < pezzi.length - 1) l.testo(W - 13, yIn - 10, '▶')
      }
      // mentre si scrive: i suggerimenti (chat/predittivo.js) sopra la riga
      if (riga && sugg) {
        let x = 10
        l.orizz(6, yIn - 12, W - 12)
        sugg.forEach((s, i) => { const w = Lcd.larghezza(txt(s.v)) + 4; if (i === iSugg) l.riempi(x - 1, yIn - 10, w, 9); l.testo(x + 1, yIn - 9, txt(s.v), { inv: i === iSugg }); os.zona(x - 1, yIn - 11, w, 11, () => { iSugg = i; completa() }); x += w + 4 })
      }
      // la riga in fondo (dentro il margine: le punte dello schermo sono stondate): quello che si scrive, o cosa fanno i tasti
      l.orizz(6, yIn - 1, W - 12)
      if (riga) {
        const max = Math.floor((W - 26) / 6), vis = riga.length > max ? riga.slice(-max) : riga
        l.testo(9, yIn + 3, '›'); l.testo(16, yIn + 3, vis)
        if (t % 10 < 5) l.riempi(16 + Lcd.larghezza(vis) + 2, yIn + 2, 5, 9)
      } else { const a = aiuto(); l.testo(Math.round(W / 2 - Lcd.larghezza(a) / 2), yIn + 3, a) }
    },
    tasto(n) {
      riordina()
      if (scelta?.dir?.[n]) { const sc = scelta, b = sc.dir[n]; sc.sel = sc.lista.indexOf(b); premi(sc, b); invalida(sc.m); return true } // (la freccia preme la sua direzione)
      // (6.11) una risposta che si dà coi tasti O scrivendo (minigiochi.js, componi): se c'è una riga scritta, Invio manda quella
      if (n === 'ok' && riga && aspettaTesto && scelta) { invia(); return true }
      if (scelta) {
        const sc = scelta, cols = sc.griglia === 'g5' ? 5 : sc.griglia === 'g3' ? 3 : sc.lista.length, N = sc.lista.length
        // (più scelte insieme, le mine: ↑ dalla prima riga e ↓ dall'ultima passano alla scelta di prima o di dopo)
        const i = scelte.indexOf(sc), prima = scelte[i - 1], dopo = scelte[i + 1], r = Math.floor(sc.sel / cols), ultima = r >= Math.ceil(N / cols) - 1, selPrima = sc.sel
        if (n === 'sx') { if (sc.griglia) sc.sel = (sc.sel - 1 + N) % N; else vivo(sc, -1) } // (in fila i tasti spenti si saltano)
        else if (n === 'dx') { if (sc.griglia) sc.sel = (sc.sel + 1) % N; else vivo(sc, 1) }
        else if (n === 'su') { if (sc.griglia && r > 0) sc.sel -= cols; else if (prima) scelta = prima; else if (sc.griglia) sc.sel = (sc.sel - cols + N) % N; else scorri = Math.min(scorri + 16, maxScorri()) }
        else if (n === 'giu') { if (sc.griglia && !ultima) sc.sel = Math.min(N - 1, sc.sel + cols); else if (dopo) scelta = dopo; else if (sc.griglia) sc.sel = (sc.sel + cols) % N; else scorri = Math.max(0, scorri - 16) }
        else if (n === 'ok') premi(sc, sc.lista[sc.sel])
        else if (n === 'indietro') { if (riga) { riga = ''; sugg = null } else os.togli() }
        invalida(sc.m)
        if (scelta && scelta !== sc) invalida(scelta.m)
        if (scelta !== sc || sc.sel !== selPrima) segui() // (la casella nuova in vista; lo scorrere a mano coi tasti lo lascia stare)
        return true
      }
      // ↑ ↓ scorrono i messaggi, sempre
      if (n === 'su') { scorri = Math.min(scorri + 16, maxScorri()); return true }
      if (n === 'giu') { scorri = Math.max(0, scorri - 16); return true }
      // mentre si scrive (la tastiera vera): ← → scelgono un suggerimento, OK completa quello scelto o manda la riga
      if (riga) {
        if ((n === 'sx' || n === 'dx') && sugg) iSugg = iSugg < 0 ? (n === 'dx' ? 0 : sugg.length - 1) : (iSugg + (n === 'dx' ? 1 : -1) + sugg.length) % sugg.length // (da nessuno: → il primo, ← l'ultimo)
        else if (n === 'ok') { if (sugg && iSugg >= 0) completa(); else invia() }
        else if (n === 'indietro') { riga = ''; sugg = null; iSugg = -1 }
        return n === 'sx' || n === 'dx' || n === 'ok' || n === 'indietro'
      }
      // se no: il cursore sui tasti di adesso. ← → lo spostano (in tondo), OK preme proprio quello evidenziato
      const lista = tasti(), i = fissa(lista)
      if (n === 'sx' || n === 'dx') { if (lista.length) { cur = lista[(i + (n === 'dx' ? 1 : -1) + lista.length) % lista.length].k; scorri = 0; segui() } return true }
      if (n === 'ok') { lista[i]?.fai(); return true }
      if (n === 'indietro') { os.togli(); return true }
      return false
    },
    carattere(ch) { if (ch.length === 1) { riga += ch; suggerisci() } },
    cancella() { riga = riga.slice(0, -1); suggerisci() },
    scrivendo: () => riga.length > 0,
    invio() { v.tasto('ok') }, // (Invio è OK: completa o manda la riga scritta, o preme il tasto scelto)
    /** Un'azione di seguito (le [azioni] delle schede), mandata da fuori. */
    azione(cmd) { azione(cmd) },
  }
  vistaUnica = v
  return v
}
