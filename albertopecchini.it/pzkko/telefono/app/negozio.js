// L'app Shop (23.10): lo shop dei $pzk come un e-commerce. Una vetrina con le offerte del giorno (con il conto alla rovescia
// a mezzanotte), i reparti, la ricerca, l'ordine, i preferiti; la scheda di ogni prodotto; il carrello; la cassa, che si paga
// coi $pzk e finisce con lo scontrino. Tutto il catalogo, i prezzi e gli acquisti sono quelli della chat (chat/testi.js,
// chat/oggetti.js, chat/mercato.js): quello che compri qui lo trovi nello zaino e viceversa.

import * as pzk from '../../games/pzk.js'
import * as zaino from '../../chat/zaino.js'
import { NEGOZIO, PER_ID } from '../../chat/testi.js'
import { REPARTI, testoBonus } from '../../chat/oggetti.js'
import * as mercato from '../../chat/mercato.js'
import { icona } from '../../chat/icone.js'

const CHIAVE_CARRELLO = 'pzkko-carrello'
const CHIAVE_PREF = 'pzkko-preferiti'
const leggi = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? d } catch { return d } }
const scrivi = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }
const fmt = (n) => pzk.fmt(n)
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

const ORDINI = [['top', 'in evidenza'], ['prezzo-su', 'prezzo: dal più basso'], ['prezzo-giu', 'prezzo: dal più alto'], ['bonus', 'bonus più grossi']]
const peso = (x) => Object.values(x.bonus ?? {}).reduce((a, n) => a + Math.abs(n), 0)

let host = null, ctx = null
let S = { v: 'vetrina', rep: 'tutti', q: '', ordine: 'top', solo: false, pid: null, n: 1, scontrino: null }
let carrello = leggi(CHIAVE_CARRELLO, {}) // { id: quanti }
let pref = new Set(leggi(CHIAVE_PREF, []))
let timer = 0

const nelCarrello = () => Object.entries(carrello).filter(([id, n]) => PER_ID[id] && n > 0)
const quantiCarrello = () => nelCarrello().reduce((a, [, n]) => a + n, 0)
const salvaCarrello = () => scrivi(CHIAVE_CARRELLO, carrello)
const totale = () => nelCarrello().reduce((a, [id, n]) => a + mercato.prezzoDi(PER_ID[id]) * n, 0)
const risparmio = () => nelCarrello().reduce((a, [id, n]) => a + (PER_ID[id].prezzo - mercato.prezzoDi(PER_ID[id])) * n, 0)

/** I secondi che mancano a mezzanotte (di Mantova). */
function aMezzanotte() {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false }).formatToParts(new Date())
  const v = (t) => Number(p.find((x) => x.type === t).value)
  return 86400 - ((v('hour') % 24) * 3600 + v('minute') * 60 + v('second'))
}
const contoAllaRovescia = () => { const s = aMezzanotte(); return `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` }

// ── pezzi di schermo ──
function testata(titolo, destra = '') { return ctx.testata(titolo, destra) }
const cartaBtn = () => `<button class="t-sh-carrello" type="button" data-act="carrello" aria-label="il carrello">${icona('sacco')}${quantiCarrello() ? `<i class="t-badge">${quantiCarrello()}</i>` : ''}</button>`
const prezzoHtml = (x, grande = false) => {
  const s = mercato.scontoDi(x.id), p = mercato.prezzoDi(x)
  return `<span class="t-sh-prezzo${grande ? ' grande' : ''}">${s ? `<s>${fmt(x.prezzo)}</s>` : ''}<b class="pzk">${fmt(p)} $pzk</b>${s ? `<em>−${Math.round(s * 100)} %</em>` : ''}</span>`
}

function cartaProdotto(x) {
  const ce = x.unico && zaino.ha(x.id), manca = mercato.prezzoDi(x) - pzk.saldo(), b = testoBonus(x.bonus)
  return `<article class="t-sh-p${ce ? ' ce' : ''}" data-act="apri" data-id="${x.id}" tabindex="0" role="button" aria-label="${esc(x.nome)}">
    <button class="t-sh-cuore${pref.has(x.id) ? ' on' : ''}" type="button" data-act="cuore" data-id="${x.id}" aria-label="preferito" aria-pressed="${pref.has(x.id)}">${icona('cuore')}</button>
    ${mercato.scontoDi(x.id) ? `<i class="t-sh-sconto">−${Math.round(mercato.scontoDi(x.id) * 100)} %</i>` : ''}
    <div class="t-sh-img">${icona(x.id)}</div>
    <h3>${esc(x.nome)}</h3>
    ${b ? `<span class="t-sh-bonus">${b.split(' · ')[0]}</span>` : '<span class="t-sh-bonus nulla">da collezione</span>'}
    <div class="t-sh-riga">${prezzoHtml(x)}${ce ? '<span class="t-sh-ce">ce l’hai</span>' : `<button class="t-sh-piu${manca > 0 ? ' manca' : ''}" type="button" data-act="aggiungi" data-id="${x.id}" aria-label="aggiungi al carrello">+</button>`}</div>
  </article>`
}

function vetrina() {
  const rep = S.rep, q = S.q.trim().toLowerCase()
  let l = NEGOZIO.filter((x) => (rep === 'tutti' || (rep === 'offerte' ? mercato.scontoDi(x.id) : x.reparto === rep)) && (!q || x.nome.toLowerCase().includes(q) || x.cosa.toLowerCase().includes(q) || x.id.includes(q)))
  if (S.solo) l = l.filter((x) => mercato.prezzoDi(x) <= pzk.saldo() && !(x.unico && zaino.ha(x.id)))
  const o = S.ordine
  l = [...l].sort(o === 'prezzo-su' ? (a, b) => mercato.prezzoDi(a) - mercato.prezzoDi(b) : o === 'prezzo-giu' ? (a, b) => mercato.prezzoDi(b) - mercato.prezzoDi(a) : o === 'bonus' ? (a, b) => peso(b) - peso(a) : (a, b) => (mercato.scontoDi(b.id) - mercato.scontoDi(a.id)) || (a.prezzo - b.prezzo))
  const offerte = mercato.offerte()
  return `${testata('Shop', cartaBtn())}
    <div class="t-corpo-app t-sh">
      <label class="t-sh-cerca">${icona('quiz')}<input type="search" name="q" value="${esc(S.q)}" placeholder="cerca nello shop" autocomplete="off" aria-label="cerca nello shop"></label>
      ${!q && rep === 'tutti' ? `<section class="t-sh-offerte" aria-label="le offerte del giorno">
        <header><h3>${icona('regalo')} offerte del giorno</h3><span class="t-sh-conto" data-conto>${contoAllaRovescia()}</span></header>
        <div class="t-sh-giro">${offerte.map((o) => { const x = PER_ID[o.id]; return `<article class="t-sh-off" data-act="apri" data-id="${x.id}" tabindex="0" role="button"><i>−${Math.round(o.sconto * 100)} %</i><div class="t-sh-img">${icona(x.id)}</div><h4>${esc(x.nome)}</h4>${prezzoHtml(x)}</article>` }).join('')}</div>
      </section>` : ''}
      <div class="t-sh-reparti" role="tablist">${[['tutti', 'tutto', 'sacco'], ['offerte', 'offerte', 'regalo'], ...REPARTI.map(([id, n, i]) => [id, n, i])].map(([id, n, i]) => `<button type="button" role="tab" aria-selected="${rep === id}" class="${rep === id ? 'on' : ''}" data-act="reparto" data-id="${id}">${icona(i)}<span>${n}</span></button>`).join('')}</div>
      <div class="t-sh-ordina"><label>ordina <select name="ordine" aria-label="ordina per">${ORDINI.map(([id, n]) => `<option value="${id}"${o === id ? ' selected' : ''}>${n}</option>`).join('')}</select></label><button type="button" class="t-sh-filtro${S.solo ? ' on' : ''}" data-act="solo" aria-pressed="${S.solo}">posso comprarli</button></div>
      ${l.length ? `<div class="t-sh-griglia">${l.map(cartaProdotto).join('')}</div>` : `<div class="t-vuoto">${icona('bot-pensa')}<p>niente da mostrare${q ? ` per «${esc(S.q)}»` : ''}.</p></div>`}
      <p class="t-sh-piede">${l.length} pezzi · hai ${fmt(pzk.saldo())} $pzk</p>
    </div>`
}

function prodotto() {
  const x = PER_ID[S.pid]
  if (!x) { S.v = 'vetrina'; return vetrina() }
  const ho = zaino.quanti(x.id), ce = x.unico && ho > 0, p = mercato.prezzoDi(x), n = x.unico ? 1 : S.n, tot = p * n, b = testoBonus(x.bonus)
  const reparto = REPARTI.find(([id]) => id === x.reparto)
  const simili = NEGOZIO.filter((y) => y.reparto === x.reparto && y.id !== x.id).slice(0, 6)
  return `${testata(esc(x.nome), cartaBtn())}
    <div class="t-corpo-app t-sh t-sh-scheda">
      <div class="t-sh-eroe"><div class="t-sh-img grande">${icona(x.id)}</div>${mercato.scontoDi(x.id) ? `<i class="t-sh-sconto">offerta −${Math.round(mercato.scontoDi(x.id) * 100)} %</i>` : ''}<button class="t-sh-cuore${pref.has(x.id) ? ' on' : ''}" type="button" data-act="cuore" data-id="${x.id}" aria-label="preferito" aria-pressed="${pref.has(x.id)}">${icona('cuore')}</button></div>
      <p class="t-sh-briciola">${reparto ? `${icona(reparto[2])} ${reparto[1]}` : ''}${x.tipo === 'usa' ? ' · da usare' : x.tipo === 'cassa' ? ' · cassa' : x.unico ? ' · da tenere' : ''}</p>
      <h3 class="t-sh-nome">${esc(x.nome)}</h3>
      ${prezzoHtml(x, true)}
      <p class="t-sh-desc">${esc(x.cosa)}</p>
      ${b ? `<div class="t-sh-pillole">${b.split(' · ').map((t) => `<span>${t}</span>`).join('')}<span class="t-sh-durata">${x.tipo === 'usa' && x.effetto ? `per ${Math.round(x.effetto / 60000)} minuti` : x.unico ? 'finché ce l’hai' : ''}</span></div>` : ''}
      <div class="t-sh-info"><span>ne hai <b>${ho}</b></span><span>${x.unico ? 'se ne ha uno solo' : 'fino a 50 alla volta'}</span></div>
      ${ce ? '<div class="t-sh-presente">ce l’hai già nello zaino</div>' : `
      ${x.unico ? '' : `<div class="t-sh-q"><span>quanti</span><div><button type="button" data-act="meno" aria-label="uno in meno">−</button><b>${n}</b><button type="button" data-act="piu" aria-label="uno in più">+</button></div></div>`}
      <div class="t-sh-cta">
        <button class="c-b nero" type="button" data-act="aggiungi" data-id="${x.id}">nel carrello</button>
        <button class="c-b${tot > pzk.saldo() ? ' manca' : ''}" type="button" data-act="subito" data-id="${x.id}">compra ora · ${fmt(tot)}</button>
      </div>
      ${tot > pzk.saldo() ? `<p class="t-sh-manca">ti mancano ${fmt(tot - pzk.saldo())} $pzk</p>` : ''}`}
      ${simili.length ? `<h4 class="t-sh-sez">altro da ${reparto?.[1] ?? 'questo reparto'}</h4><div class="t-sh-giro">${simili.map((y) => `<article class="t-sh-off pic" data-act="apri" data-id="${y.id}" tabindex="0" role="button"><div class="t-sh-img">${icona(y.id)}</div><h4>${esc(y.nome)}</h4>${prezzoHtml(y)}</article>`).join('')}</div>` : ''}
    </div>`
}

function carrelloVista() {
  const righe = nelCarrello(), t = totale(), sal = pzk.saldo(), ris = risparmio()
  return `${testata('Carrello')}
    <div class="t-corpo-app t-sh">
      ${righe.length ? `<div class="t-sh-lista">${righe.map(([id, n]) => { const x = PER_ID[id]; return `<div class="t-sh-linea"><div class="t-sh-img pic" data-act="apri" data-id="${id}">${icona(id)}</div><div class="t-sh-lt"><b>${esc(x.nome)}</b>${prezzoHtml(x)}</div><div class="t-sh-q"><div><button type="button" data-act="meno-c" data-id="${id}" aria-label="uno in meno">−</button><b>${n}</b><button type="button" data-act="piu-c" data-id="${id}" aria-label="uno in più"${x.unico ? ' disabled' : ''}>+</button></div></div><button class="t-sh-x" type="button" data-act="togli" data-id="${id}" aria-label="togli dal carrello">togli</button></div>` }).join('')}</div>
      <div class="t-sh-somma">
        ${ris ? `<div><span>sconti di oggi</span><b class="pzk">−${fmt(ris)} $pzk</b></div>` : ''}
        <div><span>${quantiCarrello()} pezz${quantiCarrello() === 1 ? 'o' : 'i'}</span><b class="pzk">${fmt(t)} $pzk</b></div>
        <div><span>nel tuo saldo</span><b class="pzk">${fmt(sal)} $pzk</b></div>
        <div class="tot"><span>dopo l’acquisto</span><b class="${sal - t < 0 ? 'meno' : 'pzk'}">${fmt(sal - t)} $pzk</b></div>
      </div>
      <button class="c-b t-sh-paga${t > sal ? ' manca' : ''}" type="button" data-act="paga">${t > sal ? `ti mancano ${fmt(t - sal)} $pzk` : `paga ${fmt(t)} $pzk`}</button>
      <button class="t-sh-svuota" type="button" data-act="svuota">svuota il carrello</button>` : `<div class="t-vuoto">${icona('sacco')}<p>il carrello è vuoto.</p><button class="c-b" type="button" data-act="vetrina">vai alla vetrina</button></div>`}
    </div>`
}

function scontrinoVista() {
  const s = S.scontrino
  return `${testata('Grazie!')}
    <div class="t-corpo-app t-sh t-sh-fatto">
      <div class="t-sh-ok" aria-hidden="true"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M14 27l8 8 16-17"/></svg></div>
      <div class="t-sh-scontrino" role="document" aria-label="lo scontrino">
        <h3>pzk shop</h3><p class="d">${new Date(s.t).toLocaleString('it-IT', { dateStyle: 'medium', timeStyle: 'short' })}</p><hr>
        <table>${s.righe.map((r) => `<tr><td>${r.n} × ${esc(PER_ID[r.id].nome)}</td><td>${fmt(r.tot)}</td></tr>`).join('')}</table><hr>
        ${s.risparmio ? `<div class="r"><span>sconti</span><b>−${fmt(s.risparmio)}</b></div>` : ''}
        <div class="r tot"><span>TOTALE $PZK</span><b>${fmt(s.tot)}</b></div>
        <p class="d">saldo: ${fmt(pzk.saldo())} $pzk</p><p class="g">grazie, e arrivederci</p>
      </div>
      <div class="t-sh-cta"><button class="c-b nero" type="button" data-act="zaino">apri lo zaino</button><button class="c-b" type="button" data-act="vetrina">continua</button></div>
    </div>`
}

// ── disegno e gesti ──
function disegna() {
  clearInterval(timer)
  host.innerHTML = S.v === 'prodotto' ? prodotto() : S.v === 'carrello' ? carrelloVista() : S.v === 'scontrino' ? scontrinoVista() : vetrina()
  if (S.v === 'vetrina' && host.querySelector('[data-conto]')) timer = setInterval(() => { const c = host.querySelector('[data-conto]'); if (c && !host.hidden) c.textContent = contoAllaRovescia() }, 1000)
}
const vaiVista = (v, extra = {}) => { S = { ...S, v, ...extra }; disegna(); host.querySelector('.t-corpo-app')?.scrollTo({ top: 0 }) }

function aggiungi(id, n = 1) {
  const x = PER_ID[id]
  if (!x) return
  if (x.unico && zaino.ha(id)) return ctx.toast('ce l’hai già nello zaino', { icona: x.id })
  carrello[id] = x.unico ? 1 : Math.min(50, (carrello[id] ?? 0) + n)
  salvaCarrello()
  ctx.toast(`<b>${esc(x.nome)}</b> nel carrello`, { icona: id, ms: 1800 })
  disegna()
}

function paga(solo = null) {
  const righe = solo ? [[solo.id, solo.n]] : nelCarrello()
  const tot = righe.reduce((a, [id, n]) => a + mercato.prezzoDi(PER_ID[id]) * n, 0)
  if (tot > pzk.saldo()) return ctx.toast(`ti mancano ${fmt(tot - pzk.saldo())} $pzk`, { icona: 'bot-triste' })
  const fatte = []
  let ris = 0
  for (const [id, n] of righe) {
    const r = mercato.compra(id, n)
    if (r.ok) { fatte.push({ id, n: r.n, tot: r.tot }); ris += (PER_ID[id].prezzo - mercato.prezzoDi(PER_ID[id])) * r.n; delete carrello[id] }
  }
  salvaCarrello()
  if (!fatte.length) return ctx.toast('non è andata: riprova', { icona: 'bot-triste' })
  vaiVista('scontrino', { scontrino: { t: Date.now(), righe: fatte, tot: fatte.reduce((a, r) => a + r.tot, 0), risparmio: ris } })
}

function clic(e) {
  const b = e.target.closest('[data-act]')
  if (!b) return
  const id = b.dataset.id, a = b.dataset.act
  if (a === 'apri') { if (e.target.closest('[data-act="cuore"],[data-act="aggiungi"]') && e.target.closest('[data-act="cuore"],[data-act="aggiungi"]') !== b) return; return vaiVista('prodotto', { pid: id, n: 1 }) }
  if (a === 'cuore') { e.stopPropagation(); pref.has(id) ? pref.delete(id) : pref.add(id); scrivi(CHIAVE_PREF, [...pref]); return disegna() }
  if (a === 'aggiungi') { e.stopPropagation(); return aggiungi(id, S.v === 'prodotto' ? S.n : 1) }
  if (a === 'subito') return paga({ id, n: PER_ID[id].unico ? 1 : S.n })
  if (a === 'reparto') return vaiVista('vetrina', { rep: id })
  if (a === 'solo') return vaiVista('vetrina', { solo: !S.solo })
  if (a === 'carrello') return vaiVista('carrello')
  if (a === 'vetrina') return vaiVista('vetrina')
  if (a === 'meno') return vaiVista('prodotto', { n: Math.max(1, S.n - 1) })
  if (a === 'piu') return vaiVista('prodotto', { n: Math.min(50, S.n + 1) })
  if (a === 'piu-c') { carrello[id] = Math.min(50, (carrello[id] ?? 0) + 1); salvaCarrello(); return disegna() }
  if (a === 'meno-c') { carrello[id] = (carrello[id] ?? 1) - 1; if (carrello[id] <= 0) delete carrello[id]; salvaCarrello(); return disegna() }
  if (a === 'togli') { delete carrello[id]; salvaCarrello(); return disegna() }
  if (a === 'svuota') { carrello = {}; salvaCarrello(); return disegna() }
  if (a === 'paga') return paga()
  if (a === 'zaino') return ctx.vai('zaino')
}

/** L'indietro dell'app: dalla scheda o dal carrello si torna alla vetrina, poi alla home. */
function indietro() { if (S.v !== 'vetrina') { vaiVista('vetrina'); return true } return false }

export function monta(h, c) {
  host = h; ctx = c
  disegna()
  host.addEventListener('click', clic)
  host.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"]')) { e.preventDefault(); e.target.click() } })
  host.addEventListener('input', (e) => { if (e.target.name === 'q') { S.q = e.target.value; const cur = e.target.selectionStart; disegna(); const i = host.querySelector('input[name="q"]'); i?.focus(); i?.setSelectionRange(cur, cur) } })
  host.addEventListener('change', (e) => { if (e.target.name === 'ordine') vaiVista('vetrina', { ordine: e.target.value }) })
  // il tasto indietro della testata: scheda e carrello tornano alla vetrina, la vetrina alla home
  host.addEventListener('click', (e) => { if (e.target.closest('.t-indietro') && indietro()) e.stopPropagation() }, true)
  pzk.osserva(() => { if (!host.hidden && S.v !== 'scontrino') disegna() })
  return { mostra: (opz) => { if (opz?.reparto) S.rep = opz.reparto; if (S.v === 'scontrino') S.v = 'vetrina'; disegna() }, nascondi: () => clearInterval(timer) }
}
