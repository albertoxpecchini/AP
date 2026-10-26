// L'app Profilo (26.10): chi sei a pzkko, con tutti i numeri. Due schede:
// - PROFILO: il cartellino (la faccia, il nome, l'indirizzo, il titolo, il motto, il livello), poi i soldi, i giochi grandi
//   uno per uno (le mani, quante vinte, il puntato, il netto, il colpo migliore: chat/zaino.js, giro, che games/pzk.js chiama
//   a ogni regola), la vita col bot, i progressi e, col conto, la tua posizione nelle classifiche (api/giocatori).
// - MODIFICA: la faccia (gli avatar di art/chat-avatar/ e gli adesivi del bot, in cinque rarità: cinque comuni sono di
//   tutti, le altre si comprano coi $pzk, le leggendarie vanno prima sbloccate), il colore, la cornice e il motto. Si salvano nello zaino (zaino.salvaProfilo) e col conto vanno nella riga
//   pubblica del database (api/_giocatori.mjs): nell'app Giocatori gli altri vedono la tua faccia, il colore e il motto.
// I numeri sono quelli di questo browser (lo zaino) anche senza conto; le classifiche solo col conto.

import * as zaino from '../../chat/zaino.js'
import * as db from '../../chat/db.js'
import * as pzk from '../../games/pzk.js'
import { nomeDi } from '../../chat/testi.js'
import { icona, esiste } from '../../chat/icone.js'
import { tieni, dallAlto, ricordo, ricorda } from '../ricordi.js'

const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const n = (x) => pzk.fmtCorto(Math.round(x ?? 0))
const p = (x) => `<span class="pzk">${pzk.fmtCorto(x ?? 0)}</span>`
const pct = (a, b) => (b ? `${Math.round((100 * a) / b)} %` : '—')

// i colori del cartellino e le cornici: solo questi nomi vanno sul server (che controlla la forma, non la lista)
export const COLORI = { verde: '#46ff7d', giallo: '#ffd400', rosso: '#ff5a4a', arancio: '#ff9a3c', rosa: '#ff7ac8', viola: '#b47cff', blu: '#4aa8ff', bianco: '#e9efe6' }
export const CORNICI = [['nastro', 'nastro'], ['oro', 'oro'], ['neon', 'neon'], ['pixel', 'pixel'], ['nessuna', 'niente']]
// le facce, per rarità (26.10, Alberto: «rankale come comuni rare… e mettile a pagamento almeno il 70 %»): cinque comuni sono
// di tutti, le altre 28 su 33 (85 %) si comprano coi $pzk; le leggendarie, prima, vanno anche sbloccate
export const RARITA = {
  comune: { nome: 'comune', colore: '#b9c4b4', prezzo: 250 },
  'non-comune': { nome: 'non comune', colore: '#46ff7d', prezzo: 600 },
  raro: { nome: 'raro', colore: '#4aa8ff', prezzo: 1500 },
  epico: { nome: 'epico', colore: '#b47cff', prezzo: 4000 },
  leggendario: { nome: 'leggendario', colore: '#ffd400', prezzo: 12000 },
}
const GRATIS = new Set(['bot', 'bot-occhiolino', 'bot-ride', 'nutria', 'piccione'])
const raro = (id) => (zaino.stato().rari ?? []).includes(id)
const AVATAR = [
  ...['bot', 'bot-occhiolino', 'bot-ride', 'nutria', 'piccione', 'bot-pensa', 'rana', 'zanzara', 'riccio', 'zucca', 'tortelli'].map((id) => [id, 'comune']),
  ...['volpe', 'cinghiale', 'cervo', 'luccio', 'siluro', 'peluche', 'av-piccione', 'av-zucca', 'av-rana'].map((id) => [id, 'non-comune']),
  ...['av-nutria', 'av-carpa', 'av-zanzara', 'av-gatto', 'av-tortello', 'av-pager'].map((id) => [id, 'raro']),
  ...['av-virgilio', 'av-gonzaga', 'av-nonna'].map((id) => [id, 'epico']),
  ['bot-ricco', 'leggendario', () => (zaino.livello() >= 10 ? null : 'arriva al livello 10')],
  ['carpa-oro', 'leggendario', () => (raro('carpa-oro') ? null : 'pesca la carpa d’oro')],
  ['drago', 'leggendario', () => (raro('drago') ? null : 'caccia il drago')],
  ['tesoro', 'leggendario', () => (raro('tesoro') ? null : 'scava il tesoro')],
].filter(([id]) => esiste(id))
const PER_AV = Object.fromEntries(AVATAR.map(([id, r, s]) => [id, { r, s }]))
export const rarita = (id) => RARITA[PER_AV[id]?.r] ?? null
const bloccato = (id) => PER_AV[id]?.s?.() ?? null
const prezzo = (id) => (GRATIS.has(id) ? 0 : rarita(id)?.prezzo ?? 0)
const mio = (id) => GRATIS.has(id) || (zaino.profilo().avs ?? []).includes(id)
/** Le facce con la rarità, il prezzo e se sono tue (la pagina /oggetti/). */
export const facce = () => AVATAR.map(([id]) => ({ id, rarita: rarita(id), prezzo: prezzo(id), mia: mio(id), bloccata: mio(id) ? null : bloccato(id) }))
/** La faccia di uno: quella scelta se c'è, se no il mestiere, se no il bot. */
export const faccia = (av, mest) => (av && esiste(av) ? av : mest && esiste(mest) ? mest : 'bot')

const GIOCHI = { roulette: ['roulette', 'roulette'], blackjack: ['blackjack', 'carte'], mine: ['mine', 'mina'], dado: ['dado', 'dadi'], moneta: ['testa o croce', 'testa'], virtual: ['virtual', 'app-virtual'] }

let host = null, ctx = null, giro = 0
let vedi = null // la faccia non tua che stai guardando (la vetrina col prezzo)
let S = ricordo('profilo', { tab: 'profilo' })
let io = null // il mio profilo dal database (titolo, posizioni), col conto

function cartellino() {
  const pr = zaino.profilo(), c = pzk.conto(), liv = zaino.livello(), xp = zaino.xp(), da = zaino.xpPer(liv), a = zaino.xpPer(liv + 1)
  const barra = Math.max(0, Math.min(100, Math.round((100 * (xp - da)) / Math.max(1, a - da))))
  return `<section class="t-pf-card cor-${esc(pr.cor)}" style="--pf:${COLORI[pr.col] ?? COLORI.verde}">
    <div class="t-pf-av">${icona(faccia(pr.av, zaino.mestiere()), 't-pf-av-img')}<b>${liv}</b></div>
    <div class="t-pf-chi">
      <h3>${esc(c?.nome ?? 'ospite')}</h3>
      <small>${c ? `${esc(c.ind)} · dal ${new Date(c.creato).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'sessione: niente si salva'}</small>
      ${io?.titolo ? `<em>${esc(io.titolo)}</em>` : ''}
      ${pr.mot ? `<q>${esc(pr.mot)}</q>` : ''}
      ${pzk.inGalera() ? `<em class="galera">in galera fino alle ${new Date(pzk.galera()).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</em>` : ''}${pzk.sporchi() ? `<em class="sporco">${pzk.fmtCorto(pzk.sporchi())} sporchi</em>` : ''}
      <div class="t-xp"><i style="width:${barra}%"></i></div><small>livello ${liv} · ${xp - da}/${a - da} xp · ${n(xp)} in tutto</small>
    </div>
  </section>`
}

const dati = (titolo, ic, celle) => `<section class="t-pf-sez"><h4>${icona(ic)}${titolo}</h4><div class="t-pf-dati">${celle.map(([v, t]) => `<div><b>${v}</b><small>${t}</small></div>`).join('')}</div></section>`

function numeri() {
  const s = zaino.stat, g = zaino.giochi(), z = zaino.stato()
  const mani = Object.values(g).reduce((t, x) => t + x[0], 0), vinte = Object.values(g).reduce((t, x) => t + x[1], 0)
  const netto = s('vinti') - s('persi'), m = zaino.mestiere(), q = zaino.quizStato(), ogg = zaino.oggetti().reduce((t, [, k]) => t + k, 0)
  const righe = Object.entries(GIOCHI).map(([id, [nome, ic]]) => {
    const [ma, vi, pu, to, mi] = g[id] ?? [0, 0, 0, 0, 0]
    return `<tr${ma ? '' : ' class="mai"'}><th>${icona(ic)}${nome}</th><td>${n(ma)}</td><td>${pct(vi, ma)}</td><td>${p(pu)}</td><td class="${to - pu < 0 ? 'meno' : to - pu > 0 ? 'piu' : ''}">${to - pu > 0 ? '+' : ''}${pzk.fmtCorto(to - pu)}</td><td>${mi > 0 ? p(mi) : '—'}</td></tr>`
  }).join('')
  return `${cartellino()}
    ${dati('soldi', 'pzk', [[p(pzk.puliti()), '$pzk puliti'], [pzk.sporchi() ? `<span class="sporco">${pzk.fmtCorto(pzk.sporchi())}</span>` : '—', 'sporchi (rapine)'], [pzk.euro() >= 0.01 ? `<span class="eur">${pzk.fmtEur(pzk.euro())}</span>` : '—', 'EUR€'], [p(s('guadagnati')), 'guadagnati'], [p(s('vinti')), 'vinti ai giochi'], [`<span class="meno">${pzk.fmtCorto(s('persi'))}</span>`, 'persi ai giochi'], [`<span class="${netto < 0 ? 'meno' : 'piu'}">${netto > 0 ? '+' : ''}${pzk.fmtCorto(netto)}</span>`, 'netto dei giochi']])}
    <section class="t-pf-sez"><h4>${icona('dado')}i giochi grandi <span>${n(mani)} mani · ${pct(vinte, mani)} vinte</span></h4>
      <div class="t-pf-tab"><table><thead><tr><th></th><th>mani</th><th>vinte</th><th>puntato</th><th>netto</th><th>colpo</th></tr></thead><tbody>${righe}</tbody></table></div>
    </section>
    ${dati('la vita col bot', 'bot', [[n(s('comandi')), 'comandi'], [m ? `${icona(m)} ${esc(nomeDi(m))}` : '—', 'mestiere'], [n(s('turniLavoro')), 'turni di lavoro'], [n(s('pescati')), 'pescati'], [n(s('cacciati')), 'cacciati'], [n(s('scavati')), 'scavati'], [n(s('crimini')), 'crimini'], [n(s('casse')), 'casse aperte'], [n(s('acquisti')), 'acquisti'], [n(s('morti')), 'morti']])}
    ${dati('progressi', 'trofeo', [[n(s('sfideFatte')), 'sfide fatte'], [n(s('missioniFatte')), 'side quest'], [`${n(s('quizGiusti'))}/${n(s('quizTotali'))}`, `quiz giusti · ${pct(s('quizGiusti'), s('quizTotali'))}`], [n(q.migliore ?? 0), 'record quiz'], [n(zaino.serie('giornaliero').n), 'serie di giorni'], [n(ogg), 'nello zaino'], [n((z.rari ?? []).length), 'leggendari'], [n(s('minati')), 'minati']])}
    ${classifiche()}`
}

function classifiche() {
  if (!pzk.conto()) return `<section class="t-pf-sez"><h4>${icona('trofeo')}classifiche</h4><p class="t-pf-nota">senza conto non sei nelle classifiche e il profilo non si salva.</p><button class="c-b" type="button" data-banca>crea il conto</button></section>`
  if (!io) return `<section class="t-pf-sez"><h4>${icona('trofeo')}classifiche</h4><div class="t-carico piccolo"><i></i></div></section>`
  const pos = Object.entries(io.posizioni ?? {}).filter(([m]) => db.METRICHE[m]).sort((a, b) => a[1].pos - b[1].pos).slice(0, 8)
  return `<section class="t-pf-sez"><h4>${icona('trofeo')}classifiche <span>su ${n(io.giocatori)} giocatori</span></h4>
    ${pos.length ? `<ol class="t-pf-pos">${pos.map(([m, v]) => `<li><b>${v.pos}°</b>${icona(db.METRICHE[m][2])}<span>${db.METRICHE[m][0]}</span><i>${db.valoreHtml(m, v.valore)}</i></li>`).join('')}</ol>` : '<p class="t-pf-nota">ancora in nessuna classifica: gioca un po’.</p>'}
  </section>`
}

function modifica() {
  const pr = zaino.profilo()
  return `${cartellino()}
    <section class="t-pf-sez"><h4>${icona('cuore')}la faccia <span>${AVATAR.filter(([id]) => mio(id)).length}/${AVATAR.length} tue</span></h4>
      ${vedi && !mio(vedi) ? vetrina(vedi) : ''}
      <div class="t-pf-avs">${AVATAR.map(([id]) => {
        const r = rarita(id), tuo = mio(id), b = !tuo && bloccato(id)
        return `<button type="button" data-av="${id}" class="${pr.av === id ? 'on' : ''}${vedi === id ? ' vedi' : ''}${tuo ? '' : b ? ' chiuso' : ' prezzo'}" style="--ra:${r.colore}" title="${esc(nomeAv(id))} · ${r.nome}">${icona(id)}${tuo ? '' : b ? `<i>${icona('lucchetto')}</i>` : `<em>${pzk.fmtCorto(prezzo(id))}</em>`}</button>`
      }).join('')}</div>
      <p class="t-pf-leg">${Object.values(RARITA).map((r) => `<span style="--ra:${r.colore}">${r.nome}</span>`).join('')}</p></section>
    <section class="t-pf-sez"><h4>${icona('fuoco')}il colore</h4><div class="t-pf-col">${Object.entries(COLORI).map(([id, c]) => `<button type="button" data-col="${id}" class="${pr.col === id ? 'on' : ''}" style="--c:${c}" aria-label="${id}"></button>`).join('')}</div></section>
    <section class="t-pf-sez"><h4>${icona('trofeo')}la cornice</h4><div class="t-za-filtri">${CORNICI.map(([id, nome]) => `<button type="button" data-cor="${id}" class="${pr.cor === id ? 'on' : ''}">${nome}</button>`).join('')}</div></section>
    <section class="t-pf-sez"><h4>${icona('telefono')}il motto</h4><form class="t-pf-motto"><input name="mot" maxlength="60" autocomplete="off" placeholder="una frase tua (60 lettere)" value="${esc(pr.mot)}"><button class="c-b" type="submit">salva</button></form>
      <p class="t-pf-nota">${pzk.conto() ? 'faccia, colore e motto li vedono tutti nell’app giocatori.' : 'senza conto il profilo resta in questa scheda del browser.'}</p></section>`
}

const nomeAv = (id) => (id.startsWith('av-') ? id.slice(3) : nomeDi(id))
/** La vetrina di una faccia non tua: la rarità, il prezzo, il tasto per comprarla (o cosa manca per sbloccarla). */
function vetrina(id) {
  const r = rarita(id), b = bloccato(id), costa = prezzo(id), basta = pzk.saldo() >= costa
  return `<div class="t-pf-vetrina" style="--ra:${r.colore}">${icona(id)}<div><b>${esc(nomeAv(id))}</b><small>${r.nome}</small>${b ? `<p>prima va sbloccata: ${esc(b)}</p>` : ''}</div>
    <button class="c-b" type="button" data-compra="${id}"${b || !basta ? ' disabled' : ''}>${b ? 'bloccata' : basta ? `compra · ${pzk.fmtCorto(costa)} $pzk` : `costa ${pzk.fmtCorto(costa)} $pzk`}</button></div>`
}
function compra(id) {
  const b = bloccato(id), costa = prezzo(id)
  if (b) return ctx.toast(`prima va sbloccata: ${esc(b)}`, { icona: 'lucchetto' })
  if (!pzk.punta('chat', costa)) return ctx.toast(`costa ${pzk.fmtCorto(costa)} $pzk e ne hai ${pzk.fmtCorto(pzk.saldo())}`, { icona: 'no' })
  pzk.regola('chat', costa, 0)
  vedi = null
  zaino.salvaProfilo({ avs: [...(zaino.profilo().avs ?? []), id], av: id })
  ctx.toast(`faccia nuova: ${esc(nomeAv(id))} (${rarita(id).nome})`, { icona: id })
}

function disegna() {
  ricorda('profilo', S)
  host.innerHTML = `${ctx.testata('Profilo')}
    <nav class="t-gi-tab due" role="tablist">${[['profilo', 'profilo', 'livello'], ['modifica', 'modifica', 'cuore']].map(([id, nome, ic]) => `<button type="button" role="tab" aria-selected="${S.tab === id}" class="${S.tab === id ? 'on' : ''}" data-tab="${id}">${icona(ic)}<span>${nome}</span></button>`).join('')}</nav>
    <div class="t-corpo-app t-pf">${S.tab === 'modifica' ? modifica() : numeri()}</div>`
}

async function caricaIo() {
  if (!pzk.conto()) { io = null; return }
  const mio = ++giro, d = await db.io()
  if (mio !== giro || !d?.ok) return
  io = d.profilo
  if (!host.hidden && S.tab === 'profilo') disegna()
}

function clic(e) {
  const t = e.target.closest('[data-tab]'), av = e.target.closest('[data-av]'), col = e.target.closest('[data-col]'), cor = e.target.closest('[data-cor]')
  if (t) { if (S.tab !== t.dataset.tab) { S.tab = t.dataset.tab; dallAlto(host); disegna() } return }
  if (av) {
    const id = av.dataset.av
    if (mio(id)) { vedi = null; return zaino.salvaProfilo({ av: id }) }
    vedi = vedi === id ? null : id // non è tua: la vetrina col prezzo
    return disegna()
  }
  const c = e.target.closest('[data-compra]')
  if (c) return compra(c.dataset.compra)
  if (col) return zaino.salvaProfilo({ col: col.dataset.col })
  if (cor) return zaino.salvaProfilo({ cor: cor.dataset.cor })
  if (e.target.closest('[data-banca]')) ctx.vai('account')
}
function invia(e) {
  if (!e.target.matches('.t-pf-motto')) return
  e.preventDefault()
  const mot = e.target.mot.value.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 60)
  zaino.salvaProfilo({ mot })
  ctx.toast(mot ? 'motto salvato' : 'motto tolto', { icona: 'si' })
}

export function monta(h, c) {
  host = h; ctx = c
  tieni(host, 'profilo')
  host.addEventListener('click', clic)
  host.addEventListener('submit', invia)
  // lo zaino cambia (un gioco, la chat, le modifiche qui): si ridisegna, ma non mentre si scrive il motto
  zaino.ascolta(() => { if (!host.hidden && !host.contains(document.activeElement?.closest('.t-pf-motto'))) disegna() })
  pzk.osserva(() => { if (!host.hidden && (S.tab === 'profilo' || vedi)) disegna() }) // il saldo cambia: anche il tasto «compra»
  disegna()
  return { mostra: () => { disegna(); caricaIo() } }
}
