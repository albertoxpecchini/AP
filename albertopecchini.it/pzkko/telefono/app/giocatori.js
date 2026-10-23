// L'app Giocatori (23.10): il database dei giocatori (api/giocatori, chat/db.js) da sfogliare. Quattro schede: CLASSIFICHE
// (una per ogni metrica, col podio), NOTIZIE (le cose successe in banca), CERCA (per nome o indirizzo), IO (il tuo profilo,
// chi devi superare e chi ti insegue, e i numeri di tutta la banca). Toccando un nome si apre la sua scheda, con la posizione
// in ogni classifica e il tasto per mandargli $pzk (lo fa la chat, col comando «manda»).

import * as db from '../../chat/db.js'
import { nomeDi } from '../../chat/testi.js'
import { icona, esiste } from '../../chat/icone.js'
import { fmt, conto } from '../../games/pzk.js'

const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const SCHEDE = [['classifiche', 'classifiche', 'trofeo'], ['notizie', 'notizie', 'sirena'], ['cerca', 'cerca', 'cuore'], ['io', 'io', 'bot']]
const fa = (t) => { const s = Math.round((Date.now() - t) / 1000); return s < 60 ? 'adesso' : s < 3600 ? `${Math.floor(s / 60)} min fa` : s < 86400 ? `${Math.floor(s / 3600)} h fa` : `${Math.floor(s / 86400)} g fa` }
const avatar = (g) => icona(g.mest && esiste(g.mest) ? g.mest : 'bot')

let host = null, ctx = null
let S = { tab: 'classifiche', metrica: 'pzk', q: '', ind: null }
let giro = 0 // per non disegnare risposte vecchie

const fuori = (d) => `<div class="t-vuoto">${icona('bot-triste')}<p>${esc(d?.errore ?? 'il database adesso non risponde (il server è in pausa o sei offline).')}</p></div>`
const caricando = '<div class="t-carico piccolo"><i></i></div>'

function telaio(corpo) {
  host.innerHTML = `${ctx.testata(S.ind ? 'Giocatore' : 'Giocatori')}
    ${S.ind ? '' : `<nav class="t-gi-tab" role="tablist">${SCHEDE.map(([id, n, i]) => `<button type="button" role="tab" aria-selected="${S.tab === id}" class="${S.tab === id ? 'on' : ''}" data-tab="${id}">${icona(i)}<span>${n}</span></button>`).join('')}</nav>`}
    <div class="t-corpo-app t-gi">${corpo}</div>`
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
    <div class="t-gi-numeri">${[['$pzk', `<span class="pzk">${fmt(p.pzk)}</span>`], ['pescati', s.pescati], ['cacciati', s.cacciati], ['scavati', s.scavati], ['quiz', `${s.quizGiusti ?? 0}/${s.quizTotali ?? 0}`], ['sfide', s.sfideFatte], ['quest', s.missioniFatte], ['morti', s.morti], ['serie', `${p.serie} g`]].map(([n, v]) => `<div><b>${v ?? 0}</b><small>${n}</small></div>`).join('')}</div>
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
  telaio(caricando)
  const [d, st] = await Promise.all([db.io('xp'), db.statistiche()])
  if (n !== giro) return
  const banca = st.ok ? `<h4 class="t-sh-sez">la banca in numeri</h4><div class="t-gi-numeri">${[['giocatori', st.stats.giocatori], ['attivi oggi', st.stats.attivi24h], ['in settimana', st.stats.attivi7g], ['$pzk in giro', `<span class="pzk">${fmt(st.stats.pzk)}</span>`], ['livello medio', st.stats.livelloMedio], ['pescati', st.stats.pescati], ['quiz giusti', st.stats.quizGiusti], ['sfide', st.stats.sfideFatte], ['quest', st.stats.missioniFatte]].map(([n, v]) => `<div><b>${v}</b><small>${n}</small></div>`).join('')}</div>` : ''
  if (!d.ok) {
    corpoEl().innerHTML = `<div class="t-vuoto">${icona('lucchetto')}<p>${conto() ? esc(d.errore ?? 'il database adesso non risponde.') : 'per avere un profilo nel database serve un conto: entra nel wallet (nome e PIN, un minuto).'}</p>${conto() ? '' : '<button class="c-b" type="button" data-wallet>apri il wallet</button>'}</div>${banca}`
    return
  }
  corpoEl().innerHTML = schedaHtml(d.profilo, d.vicini) + banca
}

function disegna() {
  if (S.ind) return scheda(S.ind)
  return { classifiche, notizie, cerca, io }[S.tab]()
}

function clic(e) {
  const t = e.target.closest('[data-tab]'), m = e.target.closest('[data-metrica]'), g = e.target.closest('[data-ind]')
  if (t) { S = { ...S, tab: t.dataset.tab, ind: null }; return disegna() }
  if (m) { S = { ...S, tab: 'classifiche', metrica: m.dataset.metrica, ind: null }; return disegna() }
  if (g) { S = { ...S, ind: g.dataset.ind }; return disegna() }
  const md = e.target.closest('[data-manda]')
  if (md) return ctx.vai('chat', { comando: `manda ${md.dataset.manda} 10` })
  if (e.target.closest('[data-wallet]')) return ctx.vai('banca')
}

export function monta(h, c) {
  host = h; ctx = c
  host.addEventListener('click', clic)
  host.addEventListener('input', (e) => { if (e.target.name === 'q') { S.q = e.target.value; clearTimeout(attesaCerca); attesaCerca = setTimeout(trova, 250) } })
  // indietro: dalla scheda di un giocatore si torna all'elenco, dall'elenco alla home
  host.addEventListener('click', (e) => { if (e.target.closest('.t-indietro') && S.ind) { e.stopPropagation(); S.ind = null; disegna() } }, true)
  disegna()
  return { mostra: (opz) => { if (opz?.tab) S = { ...S, tab: opz.tab, ind: null }; disegna() } }
}
