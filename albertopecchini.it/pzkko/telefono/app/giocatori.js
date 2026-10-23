// L'app Giocatori (23.10): il database dei giocatori (api/giocatori, chat/db.js) da sfogliare. Quattro schede: CLASSIFICHE
// (una per ogni metrica, col podio), NOTIZIE (le cose successe in banca), CERCA (per nome o indirizzo), IO (il tuo profilo,
// chi devi superare e chi ti insegue, e i numeri di tutta la banca). Toccando un nome si apre la sua scheda, con la posizione
// in ogni classifica e il tasto per mandargli $pzk (lo fa la chat, col comando «manda»).
// In cima a IO (23.10 sera) la LUMACHINA: la sua salute di oggi, la giornata che ha deciso lei e cosa ha fatto ai tuoi $pzk
// (chat/lumaca.mjs, che il server applica al conto: api/wallet.mjs), gli ultimi giorni; e, se mentre non c'eri ha
// combinato qualcosa, l'avviso urgente finché non premi «ho capito» (chat/lumaca-avvisi.js).

import * as db from '../../chat/db.js'
import { nomeDi } from '../../chat/testi.js'
import { icona, esiste } from '../../chat/icone.js'
import { fmt, fmtCorto, conto } from '../../games/pzk.js'
import * as L from '../../chat/lumaca.mjs'
import { daVedere, visto } from '../../chat/lumaca-avvisi.js'
import { tieni, dallAlto, ricordo, ricorda } from '../ricordi.js'

const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const SCHEDE = [['classifiche', 'classifiche', 'trofeo'], ['notizie', 'notizie', 'sirena'], ['cerca', 'cerca', 'cuore'], ['io', 'io', 'bot']]
const fa = (t) => { const s = Math.round((Date.now() - t) / 1000); return s < 60 ? 'adesso' : s < 3600 ? `${Math.floor(s / 60)} min fa` : s < 86400 ? `${Math.floor(s / 3600)} h fa` : `${Math.floor(s / 86400)} g fa` }
const avatar = (g) => icona(g.mest && esiste(g.mest) ? g.mest : 'bot')

let host = null, ctx = null
// la scheda, la classifica, la ricerca e il giocatore aperto si ricordano (telefono/ricordi.js), anche riaprendo la pagina
let S = ricordo('giocatori', { tab: 'classifiche', metrica: 'pzk', q: '', ind: null })
let giro = 0 // per non disegnare risposte vecchie

const fuori = (d) => `<div class="t-vuoto">${icona('bot-triste')}<p>${esc(d?.errore ?? 'il database adesso non risponde (il server è in pausa o sei offline).')}</p></div>`
const caricando = '<div class="t-carico piccolo"><i></i></div>'

function telaio(corpo) {
  const avvisi = daVedere().length // il pallino rosso su «io»: la lumachina ha combinato qualcosa
  host.innerHTML = `${ctx.testata(S.ind ? 'Giocatore' : 'Giocatori')}
    ${S.ind ? '' : `<nav class="t-gi-tab" role="tablist">${SCHEDE.map(([id, n, i]) => `<button type="button" role="tab" aria-selected="${S.tab === id}" class="${S.tab === id ? 'on' : ''}" data-tab="${id}">${icona(i)}<span>${n}</span>${id === 'io' && avvisi ? `<i class="t-badge">${avvisi > 9 ? '9+' : avvisi}</i>` : ''}</button>`).join('')}</nav>`}
    <div class="t-corpo-app t-gi t-gi-v-${S.ind ? 'scheda' : S.tab}">${corpo}</div>` // ogni scheda ha la sua classe: il suo punto della lista
}

// ── la lumachina ──
const CHIAVE_SEME = 'pzkko-lumaca-seme' // senza conto: la lumachina di questo browser (non tocca i $pzk)
function semeSessione() {
  try { let s = localStorage.getItem(CHIAVE_SEME); if (!s) { s = 's' + Math.random().toString(36).slice(2, 10); localStorage.setItem(CHIAVE_SEME, s) } return s } catch { return 'sessione' }
}
// «gio 22», col mese solo se non è quello di oggi («mer 30 set»)
const giornoBreve = (g) => new Date(`${g}T12:00:00Z`).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', ...(g.slice(0, 7) !== L.giornoDi().slice(0, 7) && { month: 'short' }), timeZone: 'UTC' })
const conSegno = (x, testo) => `${x > 0 ? '+' : x < 0 ? '−' : ''}${testo}`
const pctTesto = (p) => conSegno(p, `${Math.abs(p).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %`)
const pzkTesto = (n) => conSegno(n, `${fmt(Math.abs(n))} $pzk`)
const verso = (x) => (x < 0 ? 'meno' : x > 0 ? 'piu' : 'zero')
const faccia = (ev) => (ev.pct < 0 ? 'bot-triste' : ev.grave ? 'bot-ricco' : ev.pct > 0 ? 'bot-ride' : 'bot-pensa')
const fascia = (h) => (h < 35 ? 'male' : h < 65 ? 'media' : 'bene')

/** L'avviso urgente: le giornate che la lumachina ha vissuto sul conto e che non hai ancora visto. */
function urgenteHtml() {
  const nuove = daVedere()
  if (!nuove.length) return ''
  const tot = nuove.reduce((a, v) => a + v.n, 0)
  return `<section class="t-lu-urgente" role="alert">
    <header>${icona('sirena')}<b>urgente · la tua lumachina</b></header>
    <p>${nuove.length === 1 ? 'si è svegliata e ha deciso lei. Ecco cosa ha fatto ai tuoi $pzk:' : `mentre non c’eri ha vissuto ${nuove.length} giornate, e ha deciso tutto lei:`}</p>
    <ol>${nuove.map((v) => { const e = L.evento(v.ev); return `<li class="${verso(v.n)}"><span class="g">${giornoBreve(v.g)}</span><span class="t"><b>${esc(e?.titolo ?? v.ev)}</b>${esc(e?.testo ?? '')}</span><span class="n"><b>${pzkTesto(v.n)}</b><small>${pctTesto(v.pct)}</small></span></li>` }).join('')}</ol>
    <footer><span>in tutto <b class="${verso(tot)}">${pzkTesto(tot)}</b></span><button class="c-b" type="button" data-lu-visto>ho capito</button></footer>
  </section>`
}

/** La salute della lumachina: oggi, cosa ha deciso, cosa ha fatto ai $pzk, gli ultimi giorni. */
function lumacaHtml() {
  const c = conto(), oggi = L.giornoDi(), seme = c ? String(c.creato) : semeSessione()
  const gi = L.giornata(seme, oggi), ultime = c?.lumaca?.ultime ?? []
  const registrata = ultime.find((v) => v.g === oggi) // quella che il server ha applicato al conto
  const ev = (registrata && L.evento(registrata.ev)) || gi.evento
  const effetto = c
    ? registrata ? `<b class="${verso(registrata.n)}">${pctTesto(registrata.pct)} · ${pzkTesto(registrata.n)}</b>` : `<b class="${verso(ev.pct)}">${pctTesto(ev.pct)}</b><small>la banca non l’ha ancora registrata: succede appena il conto si sincronizza</small>`
    : ev.pct ? `<small>senza conto non tocca i tuoi $pzk: col conto oggi avrebbe fatto <b class="${verso(ev.pct)}">${pctTesto(ev.pct)}</b></small>` : '<small>oggi non sposta un $pzk</small>'
  // gli ultimi giorni: col conto quelli registrati (coi $pzk), senza conto quelli che avrebbe vissuto
  const prima = c
    ? ultime.filter((v) => v.g < oggi).slice(-6).reverse().map((v) => ({ g: v.g, s: v.s, ev: L.evento(v.ev), x: v.n, testo: pzkTesto(v.n) }))
    : [1, 2, 3, 4, 5, 6].map((i) => { const g = L.giornoPiu(oggi, -i), x = L.giornata(seme, g); return { g, s: x.salute, ev: x.evento, x: x.evento.pct, testo: pctTesto(x.evento.pct) } })
  const h = gi.salute
  return `<section class="t-lu${prima.length ? '' : ' sola'}" data-salute="${fascia(h)}">
    <div class="t-lu-sx">
      <div class="t-lu-testa">${icona(faccia(ev))}<div><h3>la lumachina</h3><p>oggi è <b>${gi.umore}</b></p></div><div class="t-lu-salute"><b>${h.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %</b><small>salute</small></div></div>
      <div class="t-lu-barra" role="meter" aria-label="salute della lumachina" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${h}"><i style="width:${h}%"></i></div>
      <article class="t-lu-oggi"><small>oggi · ${esc(ev.titolo)}</small><p>${esc(ev.testo)}</p><div class="t-lu-eff">${effetto}</div></article>
    </div>
    <div class="t-lu-dx">
      ${prima.length ? `<h4 class="t-sh-sez">gli ultimi giorni</h4><ol class="t-lu-storia">${prima.map((v) => `<li><span class="g">${giornoBreve(v.g)}</span><span class="s ${fascia(v.s)}">${Math.round(v.s)} %</span><span class="t">${esc(v.ev?.titolo ?? '')}</span><b class="${verso(v.x)}">${v.testo}</b></li>`).join('')}</ol>` : ''}
      <p class="t-lu-nota">è indipendente: ogni giorno, da mezzanotte a mezzanotte, si sveglia e decide lei com’è la giornata. Tu non puoi farci niente.${c ? '' : ' Senza conto non tocca i tuoi $pzk.'}</p>
    </div>
  </section>`
}
const corpoEl = () => host.querySelector('.t-gi')

async function classifiche() {
  const n = ++giro
  const m = S.metrica
  telaio(`<div class="t-gi-metriche">${Object.entries(db.METRICHE).map(([id, [nome, , ico]]) => `<button type="button" class="${m === id ? 'on' : ''}" data-metrica="${id}">${icona(ico)}${nome}</button>`).join('')}</div><div data-lista>${caricando}</div>`)
  host.querySelector('.t-gi-metriche .on')?.scrollIntoView({ inline: 'center', block: 'nearest' })
  const d = await db.top(m, 25)
  if (n !== giro) return
  const el = host.querySelector('[data-lista]')
  if (!d.ok) return (el.innerHTML = fuori(d))
  if (!d.top.length) return (el.innerHTML = `<div class="t-vuoto">${icona('bot-pensa')}<p>nessuno ha ancora niente in «${esc(db.METRICHE[m][0])}». Sii il primo.</p></div>`)
  const [a, b, c, ...resto] = d.top
  const podio = (g, pos) => g ? `<button type="button" class="t-gi-podio p${pos}" data-ind="${g.ind}">${avatar(g)}<b>${esc(g.nome)}</b><span>${db.valoreHtml(m, g.valore)}</span><i>${pos}</i></button>` : '<span></span>'
  el.innerHTML = `<div class="t-gi-podi">${podio(b, 2)}${podio(a, 1)}${podio(c, 3)}</div>
    <ol class="t-gi-lista" start="4">${resto.map((g) => `<li><button type="button" data-ind="${g.ind}"><span class="pos">${g.pos}</span>${avatar(g)}<span class="n"><b>${esc(g.nome)}</b><small>liv. ${g.liv} · ${esc(g.titolo)}</small></span><span class="v">${db.valoreHtml(m, g.valore)}</span></button></li>`).join('')}</ol>
    <p class="t-gi-piede">${d.giocatori} giocatori in banca</p>`
}

async function notizie() {
  const n = ++giro
  telaio(caricando)
  const d = await db.notizie()
  if (n !== giro) return
  if (!d.ok) return (corpoEl().innerHTML = fuori(d))
  corpoEl().innerHTML = d.notizie.length ? `<ul class="t-gi-news">${d.notizie.map((x) => { const t = db.testoNotizia(x); return `<li><button type="button" data-ind="${x.ind}">${icona(t.icona)}<span>${t.html}<small>${fa(x.t)}</small></span></button></li>` }).join('')}</ul>` : `<div class="t-vuoto">${icona('bot-pensa')}<p>in banca non è ancora successo niente.</p></div>`
}

async function cerca() {
  telaio(`<label class="t-sh-cerca">${icona('cuore')}<input type="search" name="q" value="${esc(S.q)}" placeholder="un nome, o pzk123456" autocomplete="off" aria-label="cerca un giocatore"></label><div data-trovati></div>`)
  const i = host.querySelector('input[name="q"]')
  i.focus()
  i.setSelectionRange(i.value.length, i.value.length)
  if (S.q.trim()) trova()
}
let attesaCerca = 0
async function trova() {
  const n = ++giro
  const el = host.querySelector('[data-trovati]')
  if (!el) return
  if (!S.q.trim()) return (el.innerHTML = '')
  el.innerHTML = caricando
  const d = await db.cerca(S.q.trim())
  if (n !== giro || !host.contains(el)) return
  if (!d.ok) return (el.innerHTML = fuori(d))
  el.innerHTML = d.trovati.length ? `<ol class="t-gi-lista">${d.trovati.map((g) => `<li><button type="button" data-ind="${g.ind}">${avatar(g)}<span class="n"><b>${esc(g.nome)}</b><small>liv. ${g.liv} · ${esc(g.titolo)}</small></span><span class="v">${g.ind}</span></button></li>`).join('')}</ol>` : `<div class="t-vuoto">${icona('bot-pensa')}<p>nessun giocatore così.</p></div>`
}

function schedaHtml(p, vicini = null) {
  const s = p.s ?? {}, pos = p.posizioni ?? {}
  const pct = Math.max(0, Math.min(100, Math.round((100 * (p.xp - 60 * (p.liv - 1) ** 2)) / Math.max(1, p.xpProssimo - 60 * (p.liv - 1) ** 2))))
  const mio = conto()?.ind === p.ind
  return `<section class="t-gi-eroe">
      <div class="t-gi-av">${avatar(p)}</div>
      <h3>${esc(p.nome)}</h3><p class="t-gi-tit">${esc(p.titolo)}${p.mest ? ` · ${esc(nomeDi(p.mest))}` : ''}</p>
      <div class="t-gi-liv"><b>livello ${p.liv}</b><div class="t-xp"><i style="width:${pct}%"></i></div><small>${p.xp} xp</small></div>
      <p class="t-gi-ind">${p.ind} · in banca da ${fa(p.creato).replace(' fa', '')}${p.ult ? ` · visto ${fa(p.ult)}` : ''}</p>
    </section>
    <div class="t-gi-numeri">${[['$pzk', `<span class="pzk">${fmtCorto(p.pzk)}</span>`], ['pescati', s.pescati], ['cacciati', s.cacciati], ['scavati', s.scavati], ['quiz', `${s.quizGiusti ?? 0}/${s.quizTotali ?? 0}`], ['sfide', s.sfideFatte], ['quest', s.missioniFatte], ['morti', s.morti], ['serie', `${p.serie} g`]].map(([n, v]) => `<div><b>${typeof v === 'number' ? fmtCorto(v) : v ?? 0}</b><small>${n}</small></div>`).join('')}</div>
    ${Object.keys(pos).length ? `<h4 class="t-sh-sez">in classifica</h4><div class="t-gi-pos">${Object.entries(pos).filter(([m]) => db.METRICHE[m]).sort((a, b) => a[1].pos - b[1].pos).slice(0, 8).map(([m, x]) => `<button type="button" data-metrica="${m}">${icona(db.METRICHE[m][2])}<b>${x.pos}°</b><small>${db.METRICHE[m][0]}</small></button>`).join('')}</div>` : ''}
    ${p.rari?.length ? `<h4 class="t-sh-sez">leggendari presi</h4><div class="t-gi-rari">${p.rari.map((r) => icona(r)).join('')}</div>` : ''}
    ${vicini ? `<h4 class="t-sh-sez">i tuoi rivali (esperienza)</h4><div class="t-gi-rivali">${vicini.su ? `<button type="button" data-ind="${vicini.su.ind}"><small>da superare</small>${avatar(vicini.su)}<b>${esc(vicini.su.nome)}</b><span>${vicini.su.pos}° · ancora ${fmt(vicini.su.valore - vicini.io)} xp</span></button>` : `<div class="t-gi-primo">${icona('trofeo')}<b>sei il primo</b></div>`}${vicini.giu ? `<button type="button" data-ind="${vicini.giu.ind}"><small>ti insegue</small>${avatar(vicini.giu)}<b>${esc(vicini.giu.nome)}</b><span>${vicini.giu.pos}° · ${fmt(vicini.io - vicini.giu.valore)} xp dietro</span></button>` : ''}</div>` : ''}
    ${mio ? '' : `<div class="t-sh-cta uno"><button class="c-b" type="button" data-manda="${p.ind}">${icona('pzk')} manda $pzk a ${esc(p.nome)}</button></div>`}`
}

async function scheda(ind) {
  const n = ++giro
  telaio(caricando)
  const d = await db.profilo(ind)
  if (n !== giro) return
  corpoEl().innerHTML = d.ok ? schedaHtml(d.profilo) : fuori(d)
}

async function io() {
  const n = ++giro
  // la lumachina subito (non serve la rete: la giornata la sa il browser, i $pzk il conto), il profilo quando arriva
  telaio(`${urgenteHtml()}${lumacaHtml()}<div data-io>${caricando}</div>`)
  const [d, st] = await Promise.all([db.io('xp'), db.statistiche()])
  if (n !== giro) return
  const corpoEl = () => host.querySelector('[data-io]')
  const banca = st.ok ? `<h4 class="t-sh-sez">la banca in numeri</h4><div class="t-gi-numeri">${[['giocatori', st.stats.giocatori], ['attivi oggi', st.stats.attivi24h], ['in settimana', st.stats.attivi7g], ['$pzk in giro', `<span class="pzk">${fmtCorto(st.stats.pzk)}</span>`], ['livello medio', st.stats.livelloMedio], ['pescati', st.stats.pescati], ['quiz giusti', st.stats.quizGiusti], ['sfide', st.stats.sfideFatte], ['quest', st.stats.missioniFatte]].map(([n, v]) => `<div><b>${v}</b><small>${n}</small></div>`).join('')}</div>` : ''
  if (!d.ok) {
    corpoEl().innerHTML = `<div class="t-vuoto">${icona('lucchetto')}<p>${conto() ? esc(d.errore ?? 'il database adesso non risponde.') : 'per avere un profilo nel database serve un conto: entra nel wallet (nome e PIN, un minuto).'}</p>${conto() ? '' : '<button class="c-b" type="button" data-wallet>apri il wallet</button>'}</div>${banca}`
    return
  }
  corpoEl().innerHTML = schedaHtml(d.profilo, d.vicini) + banca
}

function disegna() {
  ricorda('giocatori', S)
  if (S.ind) return scheda(S.ind)
  return { classifiche, notizie, cerca, io }[S.tab]()
}

function clic(e) {
  const t = e.target.closest('[data-tab]'), m = e.target.closest('[data-metrica]'), g = e.target.closest('[data-ind]')
  if (t) { S = { ...S, tab: t.dataset.tab, ind: null }; return disegna() }
  // un'altra classifica o un altro giocatore: una lista nuova, che riparte dall'alto (il telaio è già disegnato quando disegna() torna)
  if (m) { const nuova = m.dataset.metrica !== S.metrica; S = { ...S, tab: 'classifiche', metrica: m.dataset.metrica, ind: null }; disegna(); if (nuova) dallAlto(host); return }
  if (g) { const nuovo = g.dataset.ind !== S.ind; S = { ...S, ind: g.dataset.ind }; disegna(); if (nuovo) dallAlto(host); return }
  const md = e.target.closest('[data-manda]')
  if (md) return ctx.vai('chat', { comando: `manda ${md.dataset.manda} 10` })
  if (e.target.closest('[data-wallet]')) return ctx.vai('banca')
  if (e.target.closest('[data-lu-visto]')) { visto(); return disegna() } // «ho capito»: l'avviso urgente se ne va
}

export function monta(h, c) {
  host = h; ctx = c
  tieni(host, 'giocatori')
  host.addEventListener('click', clic)
  host.addEventListener('input', (e) => { if (e.target.name === 'q') { S.q = e.target.value; ricorda('giocatori', S); clearTimeout(attesaCerca); attesaCerca = setTimeout(trova, 250) } })
  // indietro: dalla scheda di un giocatore si torna all'elenco, dall'elenco alla home
  host.addEventListener('click', (e) => { if (e.target.closest('.t-indietro') && S.ind) { e.stopPropagation(); S.ind = null; disegna() } }, true)
  disegna()
  return { mostra: (opz) => { if (opz?.tab) S = { ...S, tab: opz.tab, ind: null }; disegna() } }
}
