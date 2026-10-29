// L'app pzkstore (29.10, Alberto: «migliora app lavatrice e poi mettila in questo nuovo programma chiamato pzkstore dove si
// possono scaricare app nuove e a pagamento; ovviamente nelle task dove sarà richiesta scrivi tutto»): il negozio delle app
// del cercapersone. Quelle di serie sono già nella home; qui ci sono quelle da comprare (CATALOGO): la vetrina con l'icona,
// due righe, il prezzo o «installata», e la scheda di ognuna con tutto (cosa fa, quanto costa adesso e quanto costa dopo,
// come si usa, cosa serve, le novità) e il tasto «compra e scarica» (o «scarica», per quelle gratis).
//
// - SI PAGA COME NELLO SHOP: coi $pzk PULITI alla cassa di pzk (pzk.punta + pzk.regola, come chat/mercato.js): i soldi
//   sporchi non valgono, in galera non si compra (pzk.punta dice di no a tutti e due). Senza conto non si compra niente
//   (il cercapersone senza conto apre già l'Account; la chat lo dice).
// - L'APP COMPRATA SI INSTALLA nello zaino (chat/zaino.js, installa: vale su tutti i dispositivi del conto) e compare nella
//   home, nella pagina dei soldi (telefono.js, PAGINE). Aperta senza averla (un link, il tasto della rapina, l'ultima app
//   aperta) porta qui, sulla sua scheda (telefono.js, vai).
// - SI PUÒ TOGLIERE, SENZA RIMBORSO: i soldi sono già della cassa di pzk, come per tutto quello che si compra; per riaverla
//   la si ricompra a prezzo pieno (così non si compra, si usa e si rende). La lavatrice non si toglie mentre gira.
// - «AGGIORNABILE» NON C'È: le app sono moduli del sito, arrivano sempre nuove a tutti (anche a chi le ha già); la scheda
//   dice la versione e cosa è cambiato.
// - IL PALLINO (telefono.js, badge: daComprare): le app che ti servirebbero e non hai (soldi sporchi senza lavatrice, wallet
//   cifrati nello zaino senza decifratore), così si sa dove andare.
// Il catalogo e gli acquisti stanno qui e li usa anche la chat («installa lavatrice», «lavatrice», «pzkstore»:
// chat/comandi/app.js): CATALOGO, PER_ID, compra, togli.

import * as pzk from '../../games/pzk.js'
import * as zaino from '../../chat/zaino.js'
import { icona } from '../../chat/icone.js'
import { tieni, dallAlto, ricordo, ricorda } from '../ricordi.js'

const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const fmt = (n) => pzk.fmt(n)
const ora = (t) => new Date(t).toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' })
const giorno = (t) => new Date(t).toLocaleDateString('it-IT', { timeZone: 'Europe/Rome', day: 'numeric', month: 'short', year: 'numeric' })
const pezziCifrati = () => zaino.quanti('wallet-pzk') + zaino.quanti('chiavetta')
const fatta = (x) => (x.f ? 'installata' : 'installato')
const la = (x) => (x.f ? 'la' : 'lo')

// ── il catalogo ──
// I PREZZI (29.10):
// - la LAVATRICE 5.000 $pzk puliti, una volta. Un terzo del bottino più grosso di una rapina (15.000 a testa, api/wallet.mjs),
//   due lavaggi e mezzo di commissione (2.000 l'uno), più della cauzione (3.000) e del decifratore: è lei che rende
//   spendibile il bottino senza aspettare 96 giorni. Con un colpo buono si ripaga al primo lavaggio; con un colpo piccolo
//   conviene aspettare i 96 giorni, ed è giusto che sia una scelta.
// - il DECIFRATORE 1.500, quello che costava in chat dal 26.10: i wallet che apre danno da 150 a 1.500 $pzk, le chiavette
//   da 400 a 4.000, tre al giorno.
// Ogni voce: id (quello dell'app in telefono.js), nome (f: femminile, per «installata»), icona, prezzo (0: gratis), genere
// (la pagina della home dove va), versione e novità, breve (la riga della vetrina), cosa (i paragrafi della scheda), punti
// (le pillole), come (i passi), serve (cosa ci vuole per usarla), utile() (ti servirebbe adesso: il pallino) e perche() (la
// riga «ti serve» della vetrina).
export const CATALOGO = [
  {
    id: 'lavatrice', nome: 'Lavatrice', f: true, icona: 'app-lavatrice', prezzo: 5000, genere: 'i soldi', versione: '2', del: '29.10.2026',
    novita: 'arriva nel pzkstore, rifatta: quanti sporchi e quanti puliti hai, quanto costa e come sarai dopo il lavaggio, il conto alla rovescia con l’ora in cui sono pronti, la storia dei lavaggi, cosa succede in galera. Prima era nella home di tutti: chi aveva soldi sporchi, un lavaggio in corso o l’aveva già usata se la tiene, regalata.',
    breve: 'i soldi sporchi delle rapine diventano puliti: fino a 50.000 in dieci minuti.',
    cosa: [
      'Il bottino delle rapine è <b>sporco</b>: si vede nel saldo, ma con pzk non si spende (né giochi, né shop, né app), non si manda e non si cambia in EUR€. Da solo si pulisce dopo 96 giorni.',
      'La lavatrice lo pulisce adesso: scegli quanti sporchi lavare (al più 50.000 alla volta), paghi la commissione e dopo dieci minuti sono puliti. La commissione è fissa, <b>2.000 $pzk puliti a lavaggio</b>, e va alla cassa di pzk: conviene lavarne il più possibile.',
    ],
    punti: ['fino a 50.000 a lavaggio', '10 minuti', '2.000 puliti di commissione', 'un lavaggio alla volta', 'in galera non parte'],
    come: [
      'la compri qui, una volta sola: <b>5.000 $pzk puliti</b> (in chat: «installa lavatrice»)',
      'la apri dalla home del cercapersone, nella pagina dei soldi',
      'scegli quanti sporchi lavare e paghi <b>2.000 puliti</b> di commissione',
      'dopo dieci minuti sono puliti: «ritira», o si puliscono da soli la prossima volta che usi il conto',
    ],
    serve: 'soldi sporchi da lavare (vengono dalle rapine alla cassa di pzk: l’app rapina, almeno in due) e 2.000 puliti a ogni lavaggio, per la commissione.',
    utile: () => zaino.decisa('lavatrice') && (pzk.sporchi() > 0 || !!pzk.lavaggio()),
    perche: () => `ti serve: hai ${fmt(pzk.sporchi())} $pzk sporchi da lavare`,
  },
  {
    id: 'decifratore', nome: 'Decifratore', icona: 'app-decifratore', prezzo: 1500, genere: 'i soldi', versione: '1', del: '26.10.2026',
    novita: 'dal 29.10 si compra anche qui; «installa decifratore» in chat va ancora, allo stesso prezzo.',
    breve: 'apre i wallet pzk e le chiavette usb che lo spazzino trova nei cestini.',
    cosa: [
      'Lo <b>spazzino di uffici</b> (in chat: «lavora come spazzino») vede passare sul nastro wallet pzk cifrati e chiavette usb: se li tieni finiscono nello zaino, ma chiusi.',
      'Il decifratore li apre con tre giochini facili (la parola spostata di una lettera, il numero in binario, la sequenza, la parola allo specchio; due errori perdonati). Dentro ci sono i $pzk dei portafogli smarriti: soldi <b>puliti</b>, perché erano destinati a sparire.',
    ],
    punti: ['tre giochini a pezzo', 'due errori perdonati', 'soldi puliti', 'tre al giorno'],
    come: [
      'lo compri qui, una volta sola: <b>1.500 $pzk puliti</b> (o in chat: «installa decifratore»)',
      'fai lo spazzino di uffici e tieni i wallet e le chiavette che passano sul nastro',
      'apri il decifratore dalla home, nella pagina dei soldi, e risolvi i tre giochini',
    ],
    serve: 'wallet pzk o chiavette usb nello zaino: li trova lo spazzino di uffici, un lavoro rischioso (in chat: «lavora come spazzino»).',
    utile: () => pezziCifrati() > 0,
    perche: () => `ti serve: hai ${pezziCifrati()} ${pezziCifrati() === 1 ? 'pezzo cifrato' : 'pezzi cifrati'} nello zaino`,
  },
]
export const PER_ID = Object.fromEntries(CATALOGO.map((x) => [x.id, x]))

/** Il pallino dell'icona: le app che ti servirebbero adesso e non hai. */
export const daComprare = () => (pzk.conto() ? CATALOGO.filter((x) => !zaino.installata(x.id) && x.utile()).length : 0)
/** Regalata: l'aveva di serie prima del pzkstore (telefono.js, la lavatrice di prima). */
export const regalata = (id) => zaino.installataIl(id) === zaino.REGALO

/** Perché non si può comprare adesso (o null): il conto, la galera, i soldi. */
function ostacolo(x) {
  if (!pzk.conto()) return { errore: 'il pzkstore vuole il conto: crealo o entra nell’app account del cercapersone' }
  if (pzk.inGalera()) return { errore: `in galera il pzkstore non vende: sei dentro fino alle ${ora(pzk.galera())} (si esce prima con la cauzione, nell’app rapina)` }
  if (x.prezzo > pzk.puliti()) return { errore: `costa ${fmt(x.prezzo)} $pzk puliti e ne hai ${fmt(pzk.puliti())}${pzk.sporchi() > 0 ? ` (i soldi sporchi non valgono: ne hai ${fmt(pzk.sporchi())})` : ''}`, manca: x.prezzo - pzk.puliti() }
  return null
}
/** Compra e installa. → { ok, x, tot } o { ok: false, errore, manca? } */
export function compra(id) {
  const x = PER_ID[id]
  if (!x) return { ok: false, errore: 'nel pzkstore non c’è' }
  if (zaino.installata(id)) return { ok: false, errore: `${x.nome.toLowerCase()} ce l’hai già: è nella home, nella pagina dei soldi` }
  const no = ostacolo(x)
  if (no) return { ok: false, ...no }
  if (x.prezzo > 0) {
    if (!pzk.punta('chat', x.prezzo)) return { ok: false, errore: pzk.nonBasta() }
    pzk.regola('chat', x.prezzo, 0) // alla cassa di pzk, come lo shop
    zaino.conta('comprati', x.prezzo)
    zaino.conta('acquisti', 1)
  }
  zaino.installa(id)
  return { ok: true, x, tot: x.prezzo }
}
/** Toglie l'app dal cercapersone (senza rimborso). → { ok } o { ok: false, errore } */
export function togli(id) {
  const x = PER_ID[id]
  if (!x || !zaino.installata(id)) return { ok: false, errore: 'non è installata nel cercapersone' }
  if (id === 'lavatrice' && pzk.lavaggio()) return { ok: false, errore: 'la lavatrice ha un lavaggio dentro: la togli quando l’hai ritirato' }
  zaino.disinstalla(id)
  return { ok: true, x }
}

// ── l'app ──
let host = null, ctx = null
let S = { ...ricordo('pzkstore', { v: 'vetrina', id: null }), esito: null } // esito: { ok, html } dopo un acquisto o un errore
if (!PER_ID[S.id]) S.v = 'vetrina'

const prezzoHtml = (x, grande = false) => `<span class="t-sh-prezzo${grande ? ' grande' : ''}">${x.prezzo ? `<b class="pzk">${fmt(x.prezzo)} $pzk</b>` : '<b class="t-ps-gratis">gratis</b>'}</span>`
const galeraHtml = () => (pzk.inGalera() ? `<p class="t-ac-esito male">sei in galera fino alle ${ora(pzk.galera())}: il pzkstore non vende. Si esce prima con la cauzione, nell’app rapina.</p>` : '')
const saldoHtml = () => (pzk.conto() ? `<span class="t-ps-saldo"><b class="pzk">${pzk.fmtCorto(pzk.puliti())}</b> puliti</span>` : '')

function riga(x) {
  const tua = zaino.installata(x.id), serve = !tua && x.utile()
  return `<article class="t-ps-app${tua ? ' tua' : ''}${serve ? ' serve' : ''}" data-act="scheda" data-id="${x.id}" tabindex="0" role="button" aria-label="${esc(x.nome)}">
    <div class="t-ps-ico">${icona(x.icona)}</div>
    <div class="t-ps-txt"><h3>${esc(x.nome)}</h3><p>${x.breve}</p>${serve ? `<small class="t-ps-serve">${x.perche()}</small>` : ''}</div>
    <div class="t-ps-dx">${tua ? `<span class="t-ps-stato">${fatta(x)}</span><button class="c-b nero" type="button" data-act="usa" data-id="${x.id}">apri</button>` : `${prezzoHtml(x)}<span class="c-b">${x.prezzo ? 'compra' : 'scarica'}</span>`}</div>
  </article>`
}

function vetrina() {
  const tue = CATALOGO.filter((x) => zaino.installata(x.id)), altre = CATALOGO.filter((x) => !zaino.installata(x.id))
  return `${ctx.testata('pzkstore', saldoHtml())}
    <div class="t-corpo-app t-ps">
      ${galeraHtml()}
      <p class="t-ps-intro">le app che il cercapersone non ha di serie. Si comprano una volta coi $pzk <b>puliti</b> e restano tue, su ogni dispositivo del conto: compaiono nella home, nella pagina dei soldi.</p>
      ${altre.length ? `<h4 class="t-sh-sez">da scaricare</h4><div class="t-ps-lista">${altre.map(riga).join('')}</div>` : ''}
      ${tue.length ? `<h4 class="t-sh-sez">le tue app</h4><div class="t-ps-lista">${tue.map(riga).join('')}</div>` : ''}
      <p class="t-sh-piede">${CATALOGO.length} app · ${pzk.conto() ? `hai ${fmt(pzk.puliti())} $pzk puliti${pzk.sporchi() > 0 ? ` · i ${fmt(pzk.sporchi())} sporchi qui non valgono` : ''}` : 'senza conto non si compra'}</p>
    </div>`
}

function scheda() {
  const x = PER_ID[S.id], tua = zaino.installata(x.id), no = tua ? null : ostacolo(x)
  const stato = tua
    ? `<p class="t-ps-tua">${icona('si')} ${fatta(x)}${regalata(x.id) ? ` · <b>${x.f ? 'regalata' : 'regalato'}</b>: ce l’avevi prima del pzkstore` : zaino.installataIl(x.id) ? ` il ${giorno(zaino.installataIl(x.id))}` : ''}</p>
      <div class="t-sh-cta uno"><button class="c-b verde" type="button" data-act="usa" data-id="${x.id}">apri ${esc(x.nome.toLowerCase())}</button></div>`
    : `${prezzoHtml(x, true)}
      <div class="t-sh-cta uno">${!pzk.conto() ? '<button class="c-b" type="button" data-act="conto">crea il conto o entra</button>' : `<button class="c-b${no ? ' manca' : ''}" type="button" data-act="compra" data-id="${x.id}"${pzk.inGalera() ? ' disabled' : ''}>${x.prezzo ? `compra e scarica · ${fmt(x.prezzo)} $pzk` : 'scarica · gratis'}</button>`}</div>
      ${no && pzk.conto() ? `<p class="t-sh-manca">${esc(no.errore)}</p>` : ''}
      <p class="t-ps-nota">${x.prezzo ? 'si paga coi $pzk puliti, alla cassa di pzk, una volta sola' : 'gratis'}: poi è tua, su tutti i dispositivi del conto.</p>`
  return `${ctx.testata(esc(x.nome), saldoHtml())}
    <div class="t-corpo-app t-ps t-ps-scheda">
      <div class="t-ps-eroe">
        <div class="t-ps-ico grande">${icona(x.icona)}</div>
        <div class="t-ps-chi">
          <p class="t-sh-briciola">pzkstore · ${x.genere} · versione ${x.versione}</p>
          <h3 class="t-sh-nome">${esc(x.nome)}</h3>
          ${stato}
        </div>
      </div>
      ${S.esito ? `<p class="t-ac-esito${S.esito.ok ? '' : ' male'}">${S.esito.html}</p>` : ''}
      ${!tua && x.utile() ? `<p class="t-ps-serve grande">${x.perche()}</p>` : ''}
      <div class="t-ps-desc">${x.cosa.map((p) => `<p>${p}</p>`).join('')}</div>
      <div class="t-sh-pillole">${x.punti.map((t) => `<span>${t}</span>`).join('')}</div>
      <h4 class="t-sh-sez">come si usa</h4>
      <ol class="t-ps-passi">${x.come.map((t) => `<li>${t}</li>`).join('')}</ol>
      <h4 class="t-sh-sez">cosa serve</h4>
      <p class="t-ac-nota">${x.serve}</p>
      <h4 class="t-sh-sez">novità · versione ${x.versione} del ${x.del}</h4>
      <p class="t-ac-nota">${x.novita}</p>
      ${tua ? `<h4 class="t-sh-sez">togliere l’app</h4>
      <p class="t-ac-nota">sparisce dalla home. <b>Niente rimborso</b>: i ${fmt(x.prezzo)} $pzk sono della cassa di pzk, e per riaver${la(x)} ${la(x)} ricompri a prezzo pieno.</p>
      <button class="t-sh-svuota" type="button" data-act="togli" data-id="${x.id}">togli ${esc(x.nome.toLowerCase())} dal cercapersone</button>` : ''}
    </div>`
}

function disegna() {
  if (S.v === 'scheda' && !PER_ID[S.id]) S.v = 'vetrina'
  ricorda('pzkstore', { v: S.v, id: S.id })
  host.innerHTML = S.v === 'scheda' ? scheda() : vetrina()
}
const vaiVista = (v, extra = {}) => {
  const nuova = v === 'scheda' && extra.id !== S.id
  S = { ...S, v, esito: null, ...extra }
  disegna()
  if (nuova) dallAlto(host)
}

function clic(e) {
  const b = e.target.closest('[data-act]')
  if (!b || b.disabled) return
  const a = b.dataset.act, id = b.dataset.id
  if (a === 'usa') { e.stopPropagation(); return ctx.vai(id) }
  if (a === 'scheda') return vaiVista('scheda', { id })
  if (a === 'conto') return ctx.vai('account', { scheda: 'conto' })
  if (a === 'compra') {
    const r = compra(id)
    if (!r.ok) { S.esito = { ok: false, html: esc(r.errore) }; ctx.toast(esc(r.errore), { icona: 'bot-triste' }); return disegna() }
    S.esito = { ok: true, html: `<b>${esc(r.x.nome)}</b> ${fatta(r.x)}${r.tot ? ` (−${fmt(r.tot)} $pzk)` : ''}: ${la(r.x)} trovi nella home del cercapersone, nella pagina dei soldi.` }
    ctx.toast(`<b>${esc(r.x.nome.toLowerCase())}</b> ${fatta(r.x)}: è nella home`, { icona: r.x.icona })
    return disegna()
  }
  if (a === 'togli') {
    const x = PER_ID[id]
    if (!confirm(`togliere ${x.nome.toLowerCase()} dal cercapersone?\nniente rimborso: per riaver${la(x)} ${la(x)} ricompri a ${fmt(x.prezzo)} $pzk.`)) return
    const r = togli(id)
    S.esito = r.ok ? { ok: true, html: `<b>${esc(x.nome)}</b> ${x.f ? 'tolta' : 'tolto'} dal cercapersone.` } : { ok: false, html: esc(r.errore) }
    return disegna()
  }
}
/** L'indietro dell'app: dalla scheda alla vetrina, poi alla home. */
function indietro() { if (S.v !== 'vetrina') { vaiVista('vetrina'); return true } return false }

export function monta(h, c) {
  host = h; ctx = c
  tieni(host, 'pzkstore')
  host.addEventListener('click', clic)
  host.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"]')) { e.preventDefault(); e.target.click() } })
  host.addEventListener('click', (e) => { if (e.target.closest('.t-indietro') && indietro()) e.stopPropagation() }, true)
  const ridisegna = () => { if (!host.hidden) disegna() }
  pzk.osserva(ridisegna)
  zaino.ascolta(ridisegna)
  disegna()
  // opz.app: si apre sulla scheda di quell'app (telefono.js la manda qui quando si apre un'app da comprare che non si ha)
  return { mostra: (opz) => { if (opz?.app && PER_ID[opz.app]) return vaiVista('scheda', { id: opz.app }); S.esito = null; disegna() } }
}
