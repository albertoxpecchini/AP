// Il testo predittivo della riga dei comandi (29.10, Alberto: «nei comandi quando scrivo lavora deve esserci quasi un testo
// predittivo con i comandi disponibili così da poter finire col mouse oppure premendo tab e scorrendo con le freccie»).
// Mentre si scrive, sopra la riga si apre un menù coi comandi che vanno bene: prima quelli il cui nome comincia con quello che
// hai scritto, poi gli alias che cominciano così, poi quelli che lo contengono (a parità, prima quelli fatti da poco, i tasti
// rapidi dello zaino, poi nell'ordine dell'aiuto: «la» dà lavora prima di lavatrice), ognuno con la sua icona e la riga
// «breve» di comandi/ (e «fra 3 min» se è in attesa). Dopo il comando e lo spazio, gli argomenti che il comando conosce già:
// le tre parole di «lavora» e poi i mestieri, le app di «installa», la roba del negozio… Solo liste che ci sono già
// (ARGOMENTI, qui sotto: ognuna dice da dove viene); se un comando non ne ha, il menù si chiude e si scrive e basta. Da
// scassato (il cercapersone col vetro rotto) si suggerisce solo quello che passa.
//
// I tasti: le frecce su e giù scorrono il menù; Tab mette nella riga la voce evidenziata (se è l'unica, o se l'avevi già
// scritta tutta, aggiunge anche lo spazio e passa ai suoi argomenti), Tab di nuovo passa alla voce dopo e Maiusc+Tab a quella
// prima, come nei terminali; lo spazio conferma e apre gli argomenti; Invio fa quello che c'è scritto se è un comando
// intero («saldo»), se no la voce evidenziata («pe» → pesca, come prima del menù nuovo; e quella scelta con le frecce); una
// voce che vuole altro dopo, come «come» di «lavora come», entra nella riga e apre il seguito invece di partire; Esc chiude. Col mouse o col dito si tocca una voce: entra nella riga con lo spazio, il fuoco e
// la tastiera del telefono restano lì, e il menù passa agli argomenti. Accessibile: la riga è una combobox, il menù una
// listbox, aria-activedescendant segue la voce evidenziata. Niente animazioni.
//
// Le liste si leggono dai moduli dei comandi così come sono (import * as: se un nome sparisce o cambia forma, quella lista
// resta vuota e il resto va; una lista che si rompe non rompe la chat). Le app di «installa» sono quelle del pzkstore
// (telefono/app/pzkstore.js, CATALOGO), che arriva dopo, come lo carica comandi/app.js.
//
// collega(input, scatola, opzioni) → { tasto(e), apri(), chiudi() }: chi ha una riga html gli passa i tasti (tasto(e) → true
// se li ha usati lui: se no le frecce restano quelle della storia), apri() dopo aver scritto lui nella riga, chiudi() all'invio.
// (31.10) La chat in HTML che lo usava (chat.js) non c'è più: la chat di pzk os (telefono/zero/os/chat.js) prende solo calcola().

import { COMANDI, PER_NOME } from './comandi/index.js'
import * as testi from './testi.js'
import * as oggetti from './oggetti.js'
import * as quiz from './quiz.js'
import * as db from './db.js'
import * as mercato from './mercato.js'
import { esiste, src } from './icone.js'
import * as zaino from './zaino.js'
import { fmt } from '../games/pzk.js'

const MAX = 200 // voci al massimo (il menù si scorre; «info» ne ha più di cento)
const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
// l'icona della voce: decorativa (alt vuoto, il nome c'è già scritto); senza icona un posto vuoto, così le voci restano in colonna
const ico = (n) => (n && esiste(n) ? `<img class="emo" src="${src(n)}" alt="" loading="lazy" draggable="false">` : '<i class="emo"></i>')
// il catalogo del pzkstore, quando arriva (lo carica anche il telefono, per il pallino della sua icona)
let catalogo = []
const caricaCatalogo = () => import('../telefono/app/pzkstore.js').then((m) => { catalogo = m.CATALOGO ?? [] }).catch(() => {})

// ── da dove vengono gli argomenti ──
/** Le scelte scritte nell'«uso» di un comando, al posto `i` dopo il nome: ('lavora', 0) → ['lista', 'come <mestiere>',
 *  'licenziati'] da 'lavora [lista | come <mestiere> | licenziati]'; ('moneta', 1) → ['testa', 'croce'] da 'moneta <puntata> testa|croce'. */
function scelteUso(nome, i) {
  const uso = PER_NOME.get(nome)?.uso ?? ''
  const spezza = (s, sep) => { // spezza al primo livello, non dentro [ ] e < >
    const pezzi = []
    let prof = 0, cur = ''
    for (const ch of s) {
      if (ch === sep && !prof) { pezzi.push(cur.trim()); cur = ''; continue }
      if (ch === '[' || ch === '<') prof++
      if (ch === ']' || ch === '>') prof--
      cur += ch
    }
    pezzi.push(cur.trim())
    return pezzi.filter(Boolean)
  }
  const posto = spezza(uso, ' ').slice(1)[i]
  if (!posto) return []
  return spezza(/^[[<].*[\]>]$/.test(posto) ? posto.slice(1, -1) : posto, '|')
}
/** Delle scelte, quelle che sono parole da scrivere (non i <segnaposti> né i numeri): 'come <mestiere>' → { v: 'come', d: '<mestiere>', segue }. */
const parole = (scelte) => scelte.map((s) => { const [v, ...resto] = s.split(/\s+/); return /^[a-zà-ù]{2,}$/i.test(v) ? { v, d: resto.join(' '), segue: resto.length > 0 } : null }).filter(Boolean)
/** '1-3' → le voci 1, 2, 3 (solo gli intervalli corti: «0-36» si scrive e basta). */
const numeri = (d) => { const m = /^(\d+)-(\d+)$/.exec(d ?? ''); return m && m[2] - m[1] <= 9 ? Array.from({ length: m[2] - m[1] + 1 }, (_, k) => ({ v: String(+m[1] + k) })) : [] }
/** Gli esempi della «breve» dopo «nome 50»: 'dado 50 piccolo · grande, pari, …, totale 10, …' → piccolo, grande, pari, …, totale (es. totale 10). */
function esempiBreve(nome) {
  const b = PER_NOME.get(nome)?.breve ?? '', da = b.indexOf(`${nome} 50 `)
  if (da < 0) return []
  return b.slice(da + nome.length + 4).split(/\s*[·,]\s*/).map((pezzo) => { const [v, ...resto] = pezzo.trim().split(/\s+/); return /^[a-zà-ù]{2,}$/i.test(v) ? { v, d: resto.length ? `es. ${pezzo.trim()}` : '', segue: resto.length > 0 } : null }).filter(Boolean)
}
const nomeDi = (id) => testi.nomeDi?.(id) ?? id
const metriche = () => Object.entries(db.METRICHE ?? {}).map(([id, [nome, , icona]]) => ({ v: id, d: nome, nome, ico: icona }))
/** Le app del pzkstore: spente quelle che hai già. */
const app = () => catalogo.map((x) => ({ v: x.id, nome: x.nome, ico: x.icona, spento: zaino.installata(x.id), d: zaino.installata(x.id) ? 'ce l’hai già' : `${x.prezzo ? `${fmt(x.prezzo)} $pzk` : 'gratis'} · ${x.breve ?? ''}` }))

/** Gli argomenti che un comando conosce, per nome vero del comando: (gli argomenti già scritti, in minuscolo) → le voci
 *  { v: da scrivere, d: la riga corta, nome: dove si cerca anche, ico, spento: c'è ma adesso non serve, segue: vuole altro dopo }. */
const ARGOMENTI = {
  // «aiuto pesca»: tutti i comandi (soldi.js)
  aiuto: (a) => (a.length ? [] : COMANDI.filter((c) => !c.nascosto && PER_NOME.get(c.nomi[0]) === c).map((c) => ({ v: c.nomi[0], d: c.breve, ico: c.icona }))),
  // le tre parole dell'uso di «lavora» (lavoro.js), e dopo «come» i mestieri (testi.js, MESTIERI): spenti quelli di un livello che non hai
  lavora: (a) => (!a.length ? parole(scelteUso('lavora', 0))
    : a.length === 1 && (a[0] === 'come' || a[0] === 'assumi') ? testi.MESTIERI.map((m) => ({ v: m.id, nome: m.nome, ico: m.id, spento: m.liv > zaino.livello(),
      d: `${m.nome} · liv. ${m.liv} · ${fmt(m.paga)} $pzk${m.rischio ? ` · galera ${Math.round(m.rischio * 100)} %` : ''}${zaino.mestiere() === m.id ? ' · (tu)' : ''}` })) : []),
  // le app del pzkstore (telefono/app/pzkstore.js, CATALOGO): «installa lavatrice», «pzkstore decifratore»
  installa: (a) => (a.length ? [] : app()),
  pzkstore: (a) => (a.length ? [] : app()),
  // «sfide riscuoti» (l'uso di sfide)
  sfide: (a) => (a.length ? [] : parole(scelteUso('sfide', 0))),
  // gli argomenti del quiz (quiz.js, TUTTI_ARGOMENTI)
  quiz: (a) => (a.length ? [] : quiz.TUTTI_ARGOMENTI.map(([id, nome, icona]) => ({ v: id, d: nome, nome, ico: icona }))),
  // le offerte del giorno (OFFERTE in negozio.js) e i reparti (oggetti.js, REPARTI)
  negozio: (a) => (a.length ? [] : [{ v: 'offerte', d: 'offerte del giorno', ico: 'regalo' }, ...oggetti.REPARTI.map(([id, nome, icona]) => ({ v: id, d: nome, nome, ico: icona }))]),
  // tutto il negozio (testi.js, NEGOZIO) col prezzo di oggi; spente le cose uniche che hai già
  compra: (a) => (a.length ? [] : testi.NEGOZIO.map((x) => ({ v: x.id, nome: x.nome, ico: x.id, spento: !!x.unico && zaino.ha(x.id), d: `${x.nome} · ${fmt(mercato.prezzoDi(x))} $pzk` }))),
  // «vendi tutto» (l'uso di vendi), e i pesci, le bestie e i reperti che hai nello zaino (quello che vende negozio.js: VENDIBILI)
  vendi: (a) => {
    if (a.length) return []
    const vendibili = new Set([...testi.PESCI, ...testi.ANIMALI, ...testi.REPERTI, ...testi.UFFICIO.filter((x) => x.vale > 0)].map((x) => x.id))
    return [{ v: 'tutto', d: 'pesci, bestie e reperti' }, ...zaino.oggetti().filter(([id]) => vendibili.has(id))
      .map(([id, n]) => ({ v: id, nome: nomeDi(id), ico: id, d: `${nomeDi(id)}${n > 1 ? ` × ${n}` : ''} · vale ${fmt(testi.PER_ID[id].vale)}` }))]
  },
  // quello che si usa (le cose da mangiare, le casse, il gratta e vinci) fra quello che hai
  usa: (a) => (a.length ? [] : zaino.oggetti().map(([id, n]) => [testi.PER_ID[id], n]).filter(([x]) => x && testi.NEGOZIO.includes(x) && (x.tipo === 'usa' || x.tipo === 'cassa'))
    .map(([x, n]) => ({ v: x.id, nome: x.nome, ico: x.id, d: `${x.nome}${n > 1 ? ` × ${n}` : ''}` }))),
  // tutte le cose che hanno un nome (testi.js, PER_ID)
  info: (a) => (a.length ? [] : Object.values(testi.PER_ID).map((x) => ({ v: x.id, nome: x.nome, ico: x.id, d: nomeDi(x.id) }))),
  // le casse del negozio (apri comune / rara / gonzaga), spente quelle che non hai
  apri: (a) => (a.length ? [] : testi.NEGOZIO.filter((x) => x.tipo === 'cassa').map((x) => ({ v: x.id.replace(/^cassa-/, ''), nome: x.nome, ico: x.id, spento: !zaino.ha(x.id), d: `${x.nome} · ne hai ${zaino.quanti(x.id)}` }))),
  // le metriche delle classifiche (db.js, METRICHE)
  classifica: (a) => (a.length ? [] : metriche()),
  rivale: (a) => (a.length ? [] : metriche()),
  // dopo la puntata: testa o croce (l'uso di moneta)
  moneta: (a) => (a.length === 1 ? parole(scelteUso('moneta', 1)).map((x) => ({ ...x, ico: x.v })) : []),
  // dopo la puntata: rosso, nero, pari… (l'uso di roulette), e dopo dozzina e colonna 1, 2, 3
  roulette: (a) => (a.length === 1 ? parole(scelteUso('roulette', 1)) : a.length === 2 ? numeri(parole(scelteUso('roulette', 1)).find((x) => x.v === a[1])?.d) : []),
  // dopo la puntata: le puntate del tavolo del sic bo (gli esempi della breve di dado)
  dado: (a) => (a.length === 1 ? esempiBreve('dado') : []),
}

// ── le voci per quello che è scritto ──
/** I comandi per l'inizio `q`: una voce per comando, col nome che va meglio (il vero o un alias). */
function comandi(q, passa, durata) {
  const recenti = zaino.rapidi().map((r) => PER_NOME.get(r.trim().split(/\s+/)[0].toLowerCase())?.nomi[0])
  const voci = []
  for (const [ordine, c] of COMANDI.entries()) {
    if (c.nascosto || !passa(c, null)) continue
    // i nomi che portano davvero qui («cerca» e «sfida» sono scritti in due comandi: vince l'ultimo, come in PER_NOME)
    let meglio = null
    for (const n of c.nomi) {
      if (PER_NOME.get(n) !== c) continue
      const vero = n === c.nomi[0], r = n.startsWith(q) ? (vero ? 0 : 1) : n.includes(q) ? (vero ? 2 : 3) : -1
      if (r >= 0 && (!meglio || r < meglio.r)) meglio = { r, n }
    }
    if (!meglio) continue
    const attesa = c.attesa ? zaino.manca(c.nomi[0]) : 0
    const r = recenti.indexOf(c.nomi[0])
    voci.push({ v: meglio.n, d: c.breve, ico: c.icona, alias: meglio.n !== c.nomi[0] && PER_NOME.get(c.nomi[0]) === c ? c.nomi[0] : null,
      tag: attesa > 0 && durata ? `fra ${durata(attesa)}` : '', r: meglio.r, recente: r < 0 ? 99 : r, dove: meglio.n.indexOf(q), ordine })
  }
  return voci.sort((a, b) => a.r - b.r || a.recente - b.recente || a.dove - b.dove || a.ordine - b.ordine)
}
/** Gli argomenti per l'inizio `q`: prima quelli che cominciano così, poi quelli che lo contengono, poi quelli che lo hanno nel nome. */
function filtra(voci, q) {
  if (!q) return voci
  const r = (x) => (x.v.startsWith(q) ? 0 : x.v.includes(q) ? 1 : (x.nome ?? '').toLowerCase().includes(q) ? 2 : -1)
  return voci.map((x, i) => ({ x, r: r(x), i })).filter((o) => o.r >= 0).sort((a, b) => a.r - b.r || a.i - b.i).map((o) => o.x)
}
/** Cosa suggerire per la riga `testo`: → { prima: il testo prima della parola che si sta scrivendo, q: la parola, voci } o null.
 *  «pzk pesca» e «/pesca» valgono come «pesca» (come in chat.js, analizza): il «pzk » o la «/» restano nella riga. */
export function calcola(testo, { passa = () => true, durata = null } = {}) {
  const [, , resto] = /^(\s*(?:\/+\s*|pzk\s+)?)([\s\S]*)$/i.exec(testo)
  const parti = resto.split(/\s+/)
  const q = parti.pop().toLowerCase()
  const prima = testo.slice(0, testo.length - q.length)
  if (!parti.length) return q ? { prima, q, voci: comandi(q, passa, durata).slice(0, MAX) } : null
  const c = PER_NOME.get(parti[0].toLowerCase())
  const fonte = c && !c.nascosto && ARGOMENTI[c.nomi[0]]
  if (!fonte) return null
  const fatti = parti.slice(1).map((p) => p.toLowerCase())
  let tutte = []
  try { tutte = fonte(fatti) } catch (e) { console.warn('predittivo:', c.nomi[0], e) } // una lista cambiata di forma: niente argomenti, e basta
  return { prima, q, voci: filtra(tutte, q).filter((x) => passa(c, [...fatti, x.v].join(' '))).slice(0, MAX) }
}

// ── il menù ──
/** Il nome con la parte scritta in evidenza. */
function segna(v, q) {
  const i = q ? v.toLowerCase().indexOf(q) : -1
  return i < 0 ? esc(v) : `${esc(v.slice(0, i))}<mark>${esc(v.slice(i, i + q.length))}</mark>${esc(v.slice(i + q.length))}`
}
/** La riga corta senza ripetere il nome («rider · liv. 1» per rider → «liv. 1»; «tech» per tech → niente). */
function riga(x) {
  const d = x.d ?? '', v = x.v.toLowerCase(), dm = d.toLowerCase()
  return dm === v ? '' : dm.startsWith(`${v} · `) ? d.slice(v.length + 3) : d
}

/** Collega il menù alla riga. opzioni: spento() → true quando non si suggerisce (un minigioco aspetta una risposta);
 *  passa(c, testo) → false per quello che adesso non si può fare (testo null: il comando e basta); durata(ms) per le attese;
 *  spazio() → i px sopra la riga (i messaggi e i tasti rapidi): il menù non ne copre più di metà. */
export function collega(input, scatola, { spento = () => false, passa = () => true, durata = null, spazio = null } = {}) {
  const ul = scatola.querySelector('[role="listbox"]')
  let voci = [], prima = '', q = '', scelta = 0
  let mosso = false // ci si è mossi con le frecce: Invio fa la voce evidenziata
  let giro = null // l'indice della voce che Tab ha appena messo nella riga (il Tab dopo passa alla seguente)

  const aperto = () => !scatola.hidden && voci.length > 0
  function chiudi() {
    scatola.hidden = true
    voci = []; giro = null; mosso = false
    input.setAttribute('aria-expanded', 'false')
    input.removeAttribute('aria-activedescendant')
  }
  function disegna() {
    ul.innerHTML = voci.map((x, i) => `<li role="option" id="c-sugg-${i}" data-i="${i}" aria-selected="false"${x.spento ? ' class="spento"' : ''}>${ico(x.ico)}<b>${segna(x.v, q)}</b>${x.alias ? `<small>= ${esc(x.alias)}</small>` : ''}${riga(x) ? `<span>${esc(riga(x))}</span>` : ''}${x.tag ? `<em>${esc(x.tag)}</em>` : ''}</li>`).join('')
    scatola.hidden = false
    input.setAttribute('aria-expanded', 'true')
    // alto al più cinque voci e mezza (la mezza dice che si scorre), e non più di metà dello spazio sopra la riga (sul
    // cercapersone orizzontale del computer sono tre voci e mezza: i messaggi restano da leggere)
    const alta = ul.firstElementChild?.offsetHeight || 30
    ul.style.maxHeight = `${Math.round(Math.max(alta * 2.5, Math.min(alta * 5.5, (spazio?.() ?? 1000) * 0.5)))}px`
    ul.scrollTop = 0
    evidenzia(0)
  }
  function evidenzia(i) {
    scelta = ((i % voci.length) + voci.length) % voci.length
    for (const li of ul.children) { const si = Number(li.dataset.i) === scelta; li.classList.toggle('scelta', si); li.setAttribute('aria-selected', si ? 'true' : 'false') }
    input.setAttribute('aria-activedescendant', `c-sugg-${scelta}`)
    // la voce dentro la vista del menù (a mano: scrollIntoView muoverebbe anche lo schermo del telefono)
    const li = ul.children[scelta]
    if (li.offsetTop < ul.scrollTop) ul.scrollTop = li.offsetTop
    else if (li.offsetTop + li.offsetHeight > ul.scrollTop + ul.clientHeight) ul.scrollTop = li.offsetTop + li.offsetHeight - ul.clientHeight
  }
  /** Rifà il menù per quello che c'è scritto adesso. */
  function apri() {
    giro = null; mosso = false
    const r = spento() ? null : calcola(input.value, { passa, durata })
    if (!r?.voci.length) return chiudi()
    ;({ prima, q, voci } = r)
    disegna()
  }
  /** Mette la voce i nella riga. Col Tab, se le voci sono più d'una, solo la parola (e il menù resta, per il Tab dopo); se no
   *  la parola e lo spazio, e il menù passa al seguito. */
  function metti(i, { tab = false } = {}) {
    const x = voci[i]
    if (tab && voci.length > 1) {
      input.value = prima + x.v
      input.setSelectionRange(input.value.length, input.value.length)
      giro = i; mosso = false
      evidenzia(i)
      return
    }
    input.value = prima + x.v + ' '
    input.setSelectionRange(input.value.length, input.value.length)
    apri()
  }
  /** I tasti della riga: → true se li ha usati il menù. */
  function tasto(e) {
    if (!aperto() || e.isComposing) return false
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      evidenzia(scelta + (e.key === 'ArrowDown' ? 1 : -1))
      mosso = true
      return true
    }
    if (e.key === 'Tab' && !e.altKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      if (giro !== null && giro === scelta) evidenzia(scelta + (e.shiftKey ? -1 : 1)) // Tab di nuovo: la voce dopo
      else if (giro === null && voci[scelta].v === q) { metti(scelta); return true } // l'hai già scritto tutto: lo spazio, e avanti cogli argomenti
      metti(scelta, { tab: true })
      return true
    }
    // (come prima del menù nuovo: «pe» + Invio fa «pesca»; un comando scritto tutto, «saldo», parte com'è)
    if (e.key === 'Enter' && giro !== scelta && (mosso || !voci.some((x) => x.v === q))) {
      const x = voci[scelta]
      if (x.segue) { e.preventDefault(); metti(scelta); return true } // «come», «dozzina»: senza il seguito non vanno
      input.value = prima + x.v
      chiudi()
      return false // e l'Invio manda il modulo, con la voce scelta
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation() // (l'Esc del telefono chiuderebbe l'app)
      chiudi()
      return true
    }
    return false
  }

  caricaCatalogo().then(() => { if (document.activeElement === input && input.value.trim()) apri() }) // se intanto si stava scrivendo «installa »
  input.setAttribute('role', 'combobox')
  input.setAttribute('aria-autocomplete', 'list')
  input.setAttribute('aria-controls', ul.id)
  input.setAttribute('aria-expanded', 'false')
  input.addEventListener('input', apri)
  input.addEventListener('focus', () => { if (input.value.trim()) apri() })
  input.addEventListener('blur', () => setTimeout(() => { if (document.activeElement !== input) chiudi() }, 150))
  // il fuoco resta nella riga (e la tastiera del telefono resta su); la scelta arriva col clic, che non scatta se si sta scorrendo
  scatola.addEventListener('mousedown', (e) => e.preventDefault())
  ul.addEventListener('click', (e) => {
    const li = e.target.closest('li[data-i]')
    if (!li || !aperto()) return
    metti(Number(li.dataset.i))
    input.focus({ preventScroll: true })
  })
  return { tasto, apri, chiudi }
}
