// L'app Account (26.10, Alberto: «in portafoglio solo saldo e borsa · l'account lo crei dal cercapersone»): quello che prima
// stava nelle pagine dei tasti gialli del wallet (wallet/wallet.js), ora qui. Quattro schede:
// - CONTO: senza conto, entra o crea (un nome e un PIN di quattro cifre; i nomi di Alberto chiedono la chiave di
//   amministrazione); col conto, il nome, l'indirizzo, i $pzk e gli EUR€, sincronizza, esci, le ultime mosse.
// - CAMBIO: $pzk ↔ EUR€ col cursore, al cambio dell'ultima sincronizzazione (se è vecchia si risincronizza da sola).
// - INVIA: $pzk a un altro conto, per indirizzo (48 ore dopo la creazione).
// - ALTRO: l'indirizzo (si cambia una volta sola), il PIN, il regalo di instagram.
// I soldi e le chiamate sono quelli di games/pzk.js (entra, crea, esci, sincronizza, converti, invia…), come prima.
// pzk.apriWallet('entra' | 'converti' | 'invia' | 'altro') apre il cercapersone qui, sulla scheda giusta.

import * as pzk from '../../games/pzk.js'
import { icona } from '../../chat/icone.js'
import { tieni, dallAlto, ricordo, ricorda } from '../ricordi.js'

const SCHEDE = [['conto', 'conto', 'app-account'], ['cambio', 'cambio', 'eur'], ['invia', 'invia', 'banconota'], ['altro', 'altro', 'lucchetto']]
const RISERVATI = /^\s*(pzkko|alberto|albertopecchini|pecchini|admin|banca|bancapzk|root)\s*$/i // come NOMI_PROTETTI in api/wallet.mjs
const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const fmt = pzk.fmt, fmtEur = pzk.fmtEur
const data = (t, ora = false) => new Date(t).toLocaleString('it-IT', { timeZone: 'Europe/Rome', day: 'numeric', month: 'short', ...(ora ? { hour: '2-digit', minute: '2-digit' } : { year: 'numeric' }) })

let host = null, ctx = null
let S = ricordo('account', { scheda: 'conto', modo: 'crea' })
let esito = null // l'ultimo messaggio della scheda: [ok, testo]

const campo = (k, etichetta, attr = '') => `<label class="t-ca-campo"><span>${etichetta}</span><input data-k="${k}" ${attr}></label>`
const pin = (k, etichetta = 'PIN, 4 cifre') => campo(k, etichetta, 'type="password" inputmode="numeric" autocomplete="off" maxlength="4" pattern="\\d{4}" placeholder="····"')
const val = (k) => host.querySelector(`[data-k="${k}"]`)?.value ?? ''
const fuori = () => `<div class="t-ac-fuori">${icona('lucchetto')}<p>serve il conto: un nome e quattro cifre, un minuto.</p><button class="c-b" type="button" data-vai="conto">entra o crea il conto</button></div>`

function conto(c) {
  if (!c) {
    const crea = S.modo === 'crea'
    return `<div class="t-za-filtri"><button type="button" data-modo="crea" class="${crea ? 'on' : ''}">crea il conto</button><button type="button" data-modo="entra" class="${crea ? '' : 'on'}">entra</button></div>
      <p class="t-ac-nota">${crea ? 'col conto i $pzk restano tuoi, hanno un indirizzo e vivono nella borsa; si parte con 1.000 $pzk. il PIN non si recupera: scegline uno che ricordi (studenti unimore: le ultime quattro cifre del numero dell’e-mail vanno benissimo).' : 'senza conto giochi coi <b>1.000 $pzk della sessione</b>, che non si salvano.'}</p>
      <form class="t-ac-form" data-form="${crea ? 'crea' : 'entra'}"><div class="t-ca-dati">${campo('nome', 'nome', 'type="text" autocomplete="username" maxlength="20" placeholder="il tuo nome"')}${pin('pin')}</div>
        <div class="t-ac-chiave" hidden>${campo('chiave', 'chiave di amministrazione', 'type="password" autocomplete="off"')}<p class="t-ac-nota">questo nome è di Alberto: serve la chiave del progetto.</p></div>
        <div class="t-ac-azioni"><button class="c-b" type="submit">${crea ? 'crea il conto' : 'entra'}</button></div></form>`
  }
  return `<div class="t-ac-chi">${icona('app-account')}<div><b>${esc(c.nome)}</b><small>${esc(c.ind)} · nato il ${data(c.creato)}</small></div></div>
    <div class="t-ca-griglia"><div class="t-ca-r"><span>$pzk puliti</span><b class="pzk">${fmt(c.puliti ?? c.pzk)}</b></div>${c.sporchi ? `<div class="t-ca-r sporchi"><span>sporchi (rapine)</span><b>${fmt(c.sporchi)}</b><small>lavali nella lavatrice</small></div>` : ''}<div class="t-ca-r"><span>EUR€</span><b class="eur">${fmtEur(c.eur)}</b></div>
      <div class="t-ca-r"><span>cambio delle ${new Date(pzk.sincronizzato()).toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' })}</span><b>1 $pzk = ${pzk.tasso().toFixed(4)} €</b></div>
      <div class="t-ca-r"><span>invii</span><b>${c.invii ? 'aperti' : `dal ${data(c.inviiDa, true)}`}</b></div></div>
    <div class="t-ac-azioni"><button class="c-b" type="button" data-fai="sincronizza">sincronizza</button><button class="c-b nero" type="button" data-fai="esci">esci</button></div>
    <h4 class="t-sh-sez">le ultime mosse</h4><ul class="t-ac-mosse">${mosse(c)}</ul>`
}
function mosse(c) {
  const NOMI = { nato: 'conto aperto', 'in-eur': 'in EUR€', 'in-pzk': 'in $pzk', inviato: 'inviati a', ricevuto: 'ricevuti da', indirizzo: 'indirizzo cambiato', instagram: 'regalo di instagram', trovato: 'trovati per terra', sussidio: 'sussidio', lumaca: 'la lumachina', rapina: 'rapina alla cassa (sporchi)', arresto: 'arresto: multa', cauzione: 'cauzione', lavatrice: 'lavatrice (commissione)', lavati: 'lavati: ora puliti', puliti: 'puliti dal tempo', decifrato: 'wallet decifrato', premio: 'premio' }
  const pct = (p) => `${p < 0 ? '−' : '+'}${Math.abs(p).toFixed(2).replace('.', ',')} %`
  return [...(c.mosse ?? [])].reverse().map((m) => {
    const quando = new Date(m.t).toLocaleString('it-IT', { timeZone: 'Europe/Rome', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    const segno = ['in-eur', 'inviato', 'cauzione', 'lavatrice'].includes(m.tipo) || m.verso === 'meno' ? 'meno' : ['indirizzo', 'lavati', 'puliti'].includes(m.tipo) ? '' : 'piu'
    const cosa = m.tipo === 'inviato' || m.tipo === 'ricevuto' ? `${NOMI[m.tipo]} ${m.nome ?? ''} (${m.a ?? m.da})` : m.tipo === 'indirizzo' ? `${NOMI[m.tipo]}: ${m.da} → ${m.a}` : m.tipo === 'in-eur' || m.tipo === 'in-pzk' ? `${NOMI[m.tipo]} a ${m.cambio?.toFixed(4)}` : m.tipo === 'lumaca' && typeof m.pct === 'number' ? `${NOMI.lumaca} ${pct(m.pct)}` : m.tipo === 'premio' ? `${NOMI.premio} ${m.premio ?? ''}` : NOMI[m.tipo] ?? m.tipo
    const n = m.tipo === 'in-eur' ? `−${fmt(m.n)} $pzk → +${fmtEur(m.eur)} €` : m.tipo === 'in-pzk' ? `−${fmtEur(m.eur)} € → +${fmt(m.n)} $pzk` : m.n != null ? `${segno === 'meno' ? '−' : '+'}${fmt(m.n)} $pzk` : ''
    return `<li><span>${quando} · ${esc(cosa)}</span><b class="${segno}">${n}</b></li>`
  }).join('') || '<li><span>niente ancora</span></li>'
}

let verso = null // il cambio: da quale moneta si parte
function cambio(c) {
  if (!c) return `<p class="t-ac-nota">gli EUR€ (l’euro finto del wallet: non si prelevano, non si depositano, non si giocano) ci sono solo col conto. i 1.000 della sessione sono 1.000 e basta.</p>${fuori()}`
  verso ??= c.eur >= 0.01 && pzk.saldo() < 1 ? 'eur' : 'pzk'
  return `<p class="t-ac-nota">parcheggia i $pzk in EUR€ quando pensi che scendano; per giocarli vanno riconvertiti. 1 $pzk = <b>${pzk.tasso().toFixed(4)}</b> €, cambio delle ${new Date(pzk.sincronizzato()).toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' })}.</p>
    <div class="t-za-filtri"><button type="button" data-verso="pzk" class="${verso === 'pzk' ? 'on' : ''}">$pzk → EUR€</button><button type="button" data-verso="eur" class="${verso === 'eur' ? 'on' : ''}">EUR€ → $pzk</button></div>
    <div class="t-ac-fader"><input type="range" min="0" max="1000" step="1" value="0" data-k="quota" aria-label="quanto convertire"><b class="t-ac-pct">0 %</b></div>
    <div class="t-ac-conv"></div>
    <div class="t-ac-azioni"><button class="c-b" type="button" data-fai="converti" disabled>converti</button><button class="c-b nero" type="button" data-fai="tutto">tutto</button></div>`
}
const quanto = () => { const t = verso === 'pzk' ? pzk.saldo() : pzk.euro(), v = (Number(val('quota')) / 1000) * t; return verso === 'pzk' ? Math.round(v * 2) / 2 : Math.round(v * 100) / 100 }
function scriviCambio() {
  const conv = host.querySelector('.t-ac-conv')
  if (!conv) return
  const n = quanto(), t = pzk.tasso(), tot = verso === 'pzk' ? pzk.saldo() : pzk.euro()
  host.querySelector('.t-ac-pct').textContent = `${Math.round(Number(val('quota')) / 10)} %`
  conv.innerHTML = verso === 'pzk'
    ? `<div class="t-ca-r"><span>dai (di ${fmt(tot)})</span><b class="pzk">${fmt(n)} $pzk</b></div><div class="t-ca-r"><span>ricevi</span><b class="eur">${fmtEur(n * t)} EUR€</b></div>`
    : `<div class="t-ca-r"><span>dai (di ${fmtEur(tot)})</span><b class="eur">${fmtEur(n)} EUR€</b></div><div class="t-ca-r"><span>ricevi</span><b class="pzk">${fmt(Math.round((n / t) * 2) / 2)} $pzk</b></div>`
  host.querySelector('[data-fai="converti"]').disabled = !(n > 0)
}

function invia(c) {
  if (!c) return `<p class="t-ac-nota">i $pzk si mandano da un conto a un altro, per indirizzo (pzk e sei cifre). serve il conto, e deve avere almeno 48 ore.</p>${fuori()}`
  return `<p class="t-ac-nota">${c.invii ? 'puoi mandare $pzk agli altri conti' : `gli invii si aprono il ${data(c.inviiDa, true)}`}: in $pzk, almeno 1; arrivano subito.</p>
    <form class="t-ac-form" data-form="invia"><div class="t-ca-dati">${campo('ind', 'indirizzo', 'type="text" inputmode="numeric" autocomplete="off" placeholder="pzk398893" maxlength="10"')}${campo('quanti', 'quanti $pzk', 'type="number" inputmode="decimal" min="1" step="0.5" placeholder="10"')}</div>
      <p class="t-ac-nota t-ac-chie"></p><div class="t-ac-azioni"><button class="c-b" type="submit">invia</button></div></form>`
}

function altro(c) {
  const ig = `<div class="t-ac-ig"></div>`
  if (!c) return `<p class="t-ac-nota">l’indirizzo e il PIN stanno nel conto.</p>${fuori()}${ig}`
  return `<section class="t-pf-sez"><h4>${icona('pzkkonet')}l’indirizzo <span>${esc(c.ind)}</span></h4>${c.indCambiato ? `<p class="t-ac-nota">l’hai scelto tu: non si cambia più.</p>` : `<p class="t-ac-nota">è a caso: puoi cambiarlo <b>una volta sola</b> con sei cifre tue (studenti unimore: il numero dell’e-mail).</p>
      <form class="t-ac-form" data-form="indirizzo"><div class="t-ca-dati">${campo('sei', 'sei cifre', 'type="text" inputmode="numeric" autocomplete="off" maxlength="6" pattern="\\d{6}" placeholder="123456"')}</div><div class="t-ac-azioni"><button class="c-b" type="submit">cambia indirizzo</button></div></form>`}</section>
    <section class="t-pf-sez"><h4>${icona('lucchetto')}il PIN</h4><form class="t-ac-form" data-form="pin"><div class="t-ca-dati">${pin('vecchio', 'PIN di adesso')}${pin('nuovo', 'PIN nuovo')}</div><div class="t-ac-azioni"><button class="c-b" type="submit">cambia PIN</button></div></form></section>
    <section class="t-pf-sez"><h4>${icona('cuore')}instagram</h4>${ig}${c.ig ? '<p class="t-ac-nota">il regalo l’hai già avuto: grazie.</p>' : ''}</section>`
}

function disegna() {
  ricorda('account', S)
  const c = pzk.conto()
  host.innerHTML = `${ctx.testata('Account', `<span class="t-sh-piede" style="margin:0">${c ? esc(c.ind) : 'serve il conto'}</span>`)}
    <nav class="t-gi-tab" role="tablist">${SCHEDE.map(([id, n, i]) => `<button type="button" role="tab" aria-selected="${S.scheda === id}" class="${S.scheda === id ? 'on' : ''}" data-scheda="${id}">${icona(i)}<span>${n}</span></button>`).join('')}</nav>
    <div class="t-corpo-app t-ac">${esito ? `<p class="t-ac-esito${esito[0] ? '' : ' male'}">${esc(esito[1])}</p>` : ''}${{ conto, cambio, invia, altro }[S.scheda](c)}</div>`
  // il link di instagram è un elemento vivo (games/pzk.js): si appende
  const ig = host.querySelector('.t-ac-ig')
  if (ig) ig.appendChild(pzk.linkInstagram({ fatto: () => ctx.toast(`grazie del follow: +${fmt(pzk.PREMIO_IG)} $pzk`, { icona: 'regalo' }) }))
  if (S.scheda === 'cambio' && c) { scriviCambio(); if (pzk.scaduto()) pzk.sincronizza().then(() => { if (!host.hidden && S.scheda === 'cambio') disegna() }) }
}
const di = (ok, testo) => { esito = [ok, testo]; disegna() }

// ── le azioni ──
async function attesa(b, fai) { b.disabled = true; try { await fai() } finally { if (b.isConnected) b.disabled = false } }
async function invio(e) {
  const f = e.target.closest('[data-form]')
  if (!f) return
  e.preventDefault()
  const b = f.querySelector('[type="submit"]')
  await attesa(b, async () => {
    const tipo = f.dataset.form
    if (tipo === 'crea' || tipo === 'entra') {
      const r = tipo === 'entra' ? await pzk.entra(val('nome'), val('pin')) : await pzk.crea(val('nome'), val('pin'), val('chiave') || undefined)
      if (!r.ok) return di(false, r.offline ? 'il conto è in pausa: il server non ha ancora il suo archivio. per ora valgono i 1.000 della sessione' : r.errore)
      ctx.toast(r.nuovo ? `benvenuto, ${esc(r.conto.nome)}: ${esc(r.conto.ind)}` : `ciao ${esc(r.conto.nome)}`, { icona: 'app-account' })
      esito = null; S.scheda = 'conto'; disegna()
      return ctx.dopoAccesso?.() // (il cercapersone senza conto è chiuso: ora si va dove si voleva andare)
    }
    if (tipo === 'invia') {
      const r = await pzk.invia(val('ind'), Number(val('quanti')))
      return r.ok ? di(true, `fatto: ${fmt(r.fatto.n)} $pzk a ${r.fatto.nome} (${r.fatto.a})`) : di(false, r.errore)
    }
    if (tipo === 'indirizzo') {
      if (!confirm(`pzk${val('sei')}: sicuro? non si cambia più.`)) return
      const r = await pzk.cambiaIndirizzo(val('sei'))
      return di(r.ok, r.ok ? `fatto: ora sei ${pzk.conto().ind}` : r.errore)
    }
    if (tipo === 'pin') { const r = await pzk.cambiaPin(val('vecchio'), val('nuovo')); return di(r.ok, r.ok ? 'PIN cambiato' : r.errore) }
  })
}
async function clic(e) {
  const s = e.target.closest('[data-scheda]'), v = e.target.closest('[data-vai]'), m = e.target.closest('[data-modo]'), d = e.target.closest('[data-verso]'), f = e.target.closest('[data-fai]')
  if (s || v) { const id = (s ?? v).dataset.scheda ?? v.dataset.vai; if (S.scheda !== id) { S.scheda = id; esito = null; dallAlto(host) } return disegna() }
  if (m) { S.modo = m.dataset.modo; esito = null; return disegna() }
  if (d) { verso = d.dataset.verso; return disegna() }
  if (!f) return
  const fai = f.dataset.fai
  if (fai === 'tutto') { host.querySelector('[data-k="quota"]').value = '1000'; return scriviCambio() }
  await attesa(f, async () => {
    if (fai === 'sincronizza') { const r = await pzk.sincronizza(); di(r.ok, r.ok ? `sincronizzato: 1 $pzk = ${pzk.tasso().toFixed(4)} €` : r.errore) }
    if (fai === 'esci') { await pzk.esci(); esito = null; ctx.toast('sei uscito: per usare il cercapersone serve di nuovo il conto', { icona: 'lucchetto' }); disegna() }
    if (fai === 'converti') {
      const n = quanto()
      if (!(n > 0)) return
      const r = await pzk.converti(verso, n)
      if (!r.ok) return di(false, r.errore)
      const x = r.fatto
      di(true, x.da === 'pzk' ? `fatto: ${fmt(x.n)} $pzk → ${fmtEur(x.eur)} EUR€ (a ${x.cambio.toFixed(4)})` : `fatto: ${fmtEur(x.eur)} EUR€ → ${fmt(x.n)} $pzk (a ${x.cambio.toFixed(4)})`)
    }
  })
}
function scrivi(e) {
  if (e.target.matches('[data-k="quota"]')) return scriviCambio()
  if (e.target.matches('[data-k="nome"]')) host.querySelector('.t-ac-chiave')?.toggleAttribute('hidden', !(S.modo === 'crea' && RISERVATI.test(e.target.value)))
  if (e.target.matches('[data-k="ind"]')) {
    const m = /(\d{6})/.exec(e.target.value), chi = host.querySelector('.t-ac-chie')
    if (!m) { chi.textContent = ''; return }
    chi.textContent = '…'
    pzk.chiE('pzk' + m[1]).then((r) => { chi.textContent = r.ok ? `è il conto di ${r.conto.nome}` : r.errore })
  }
}

export function monta(h, c) {
  host = h; ctx = c
  tieni(host, 'account', { vista: () => S.scheda })
  host.addEventListener('click', clic)
  host.addEventListener('submit', invio)
  host.addEventListener('input', scrivi)
  // i soldi cambiano (un gioco, un altro browser, la lumachina): si ridisegna, ma non mentre si scrive
  pzk.osserva(() => { if (!host.hidden && !host.contains(document.activeElement?.closest('form, .t-ac-fader'))) disegna() })
  disegna()
  return { mostra: (opz = {}) => { if (opz.scheda && opz.scheda !== S.scheda) { S.scheda = opz.scheda; esito = null } disegna() } }
}
