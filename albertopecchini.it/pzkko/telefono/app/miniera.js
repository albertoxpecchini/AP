// L'app Miniera (23.10, Alberto: «crea app dove si minano pzk da pc. ovviamente bisogna comprare i componenti e farsi la
// postazione. anche la sedia migliorata aumenta la produzione. fai tutte le immagini piatte e in pixel… tutto deve
// incastrarsi perfettamente»). Tre schede:
//   POSTAZIONE  la scena a pixel della postazione montata (chat/miniera-pixel.js), quanto produce all'ora, la temperatura,
//               i $pzk maturati con la barra della memoria e «incassa», i pezzi montati (toccandone uno: il negozio di
//               quella categoria)
//   NEGOZIO     le categorie e i pezzi, ognuno col suo disegno a pixel: compra, monta, smonta, vendi
//   PRONTI      i PC già pensati (tutti i tipi): compra quello che manca e monta tutto in un colpo
// Le regole, il catalogo e lo stato sono di chat/miniera.js (lo stato sta nello zaino: col conto si salva sul server).
// I disegni sono a pixel interi: la tela si scala per multipli interi dei pixel VERI dello schermo (il palco del
// cercapersone è ingrandito con un transform), così ogni pixel della pixel art è un quadrato uguale agli altri.
// Niente animazioni: i $pzk maturati crescono come numero, una volta al secondo, solo mentre l'app si vede.
// Ricorda le scelte (la scheda, la categoria del negozio) e il punto di ogni lista, anche riaprendo (telefono/ricordi.js,
// regola di Alberto del 23.10): ogni vista ha la sua classe sul contenitore che scorre, e comprare o montare non
// riporta in cima.

import * as M from '../../chat/miniera.js'
import * as P from '../../chat/miniera-pixel.js'
import { icona } from '../../chat/icone.js'
import { fmt, fmtCorto } from '../../games/pzk.js'
import { tieni, ricordo, ricorda } from '../ricordi.js'

const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const SCHEDE = [['postazione', 'postazione'], ['negozio', 'negozio'], ['pronti', 'pc pronti']]
let host = null, ctx = null, orologio = 0, smetti = null
let S = ricordo('miniera', { tab: 'postazione', cat: null })
const scegli = (k, v) => { S = { ...S, [k]: v }; ricorda('miniera', S) }

const pct = (x) => `${x > 0 ? '+' : ''}${(Math.round(x * 1000) / 10).toLocaleString('it-IT')} %`
const perOra = (n) => `${fmtCorto(Math.round(n * 10) / 10)} $pzk/ora`
const montatoDi = (m, cat) => { const v = m[cat]; return v ? (typeof v === 'string' ? { id: v, n: 1 } : v) : null }

// ── la tela a pixel: la scala intera più grande che entra in maxW × maxH punti del palco, nei pixel veri dello schermo ──
function tela(cv, w, h, maxW, maxH) {
  const r = host.getBoundingClientRect(), k = host.offsetWidth ? r.width / host.offsetWidth : 1
  const px = (devicePixelRatio || 1) * k // pixel veri per punto del palco
  const s = Math.max(1, Math.floor(Math.min((maxW * px) / w, (maxH * px) / h)))
  cv.width = w * s; cv.height = h * s
  cv.style.width = `${(w * s) / px}px`; cv.style.height = `${(h * s) / px}px`
  return s
}
function disegnaScena(cv, montati, maxW, maxH) {
  const s = tela(cv, P.SCENA.w, P.SCENA.h, maxW, maxH)
  P.disegnaPostazione(cv, montati, { scala: s })
}
function disegnaIcona(cv, id, lato) {
  const s = tela(cv, P.PEZZO?.w ?? 32, P.PEZZO?.h ?? 32, lato, lato)
  P.disegnaPezzo(cv, id, { scala: s })
}
// dopo ogni disegno dell'html: le tele dei pezzi e delle scene
function riempiTele() {
  for (const cv of host.querySelectorAll('canvas[data-pezzo]')) disegnaIcona(cv, cv.dataset.pezzo, Number(cv.dataset.lato) || 44)
  for (const cv of host.querySelectorAll('canvas[data-scena]')) {
    const montati = cv.dataset.scena === 'mia' ? M.stato().montati : M.PRONTI?.find?.((p) => p.id === cv.dataset.scena)?.pezzi ?? {}
    disegnaScena(cv, montati, Number(cv.dataset.w) || 300, Number(cv.dataset.h) || 190)
  }
}

function telaio(corpo) {
  const c = M.calcola()
  host.innerHTML = `${ctx.testata('Miniera', `<span class="t-mn-ora${c.completa ? '' : ' spenta'}">${c.completa ? perOra(c.perOra) : 'spenta'}</span>`)}
    <nav class="t-mn-tab" role="tablist">${SCHEDE.map(([id, n]) => `<button type="button" role="tab" aria-selected="${S.tab === id}" class="${S.tab === id ? 'on' : ''}" data-tab="${id}">${n}</button>`).join('')}</nav>
    <div class="t-corpo-app t-mn t-mn-v-${S.tab}${S.tab === 'negozio' ? '-' + (S.cat ?? M.CATEGORIE[0].id) : ''}">${corpo}</div>`
  riempiTele()
}

// ── la postazione ──
function postazione() {
  const st = M.stato(), c = M.calcola(), mat = M.maturati(), pieno = c.completa && c.capienzaOre > 0 && mat >= c.perOra * c.capienzaOre - 0.5
  const riempito = c.completa && c.perOra > 0 ? Math.min(100, (100 * mat) / (c.perOra * c.capienzaOre)) : 0
  const caldo = c.temperatura >= 85 ? 'male' : c.temperatura >= 70 ? 'media' : 'bene'
  telaio(`<section class="t-mn-post">
      <div class="t-mn-scena"><canvas data-scena="mia" data-w="372" data-h="250" aria-label="la tua postazione"></canvas></div>
      <div class="t-mn-dati">
        <div class="t-mn-cassa${pieno ? ' piena' : ''}">
          <small>${c.completa ? 'maturati' : 'la postazione non è completa'}</small>
          <b data-maturati>${c.completa ? `${fmt(Math.floor(mat * 10) / 10)} $pzk` : '—'}</b>
          <div class="t-mn-barra" role="meter" aria-label="la memoria" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(riempito)}"><i data-barra style="width:${riempito}%"></i></div>
          <small data-capienza>${c.completa ? (pieno ? 'la memoria è piena: incassa, se no non mina più' : `la memoria tiene ${fmt(c.capienzaOre)} ore`) : `mancano: ${c.manca.map((k) => M.CATEGORIE.find((x) => x.id === k)?.nome ?? k).join(', ')}`}</small>
          <button class="c-b" type="button" data-incassa ${c.completa && mat >= 0.5 ? '' : 'disabled'}>incassa</button>
        </div>
        <dl class="t-mn-num">
          <div class="largo"><dt>produzione</dt><dd>${c.completa ? perOra(c.perOra) : '0'}</dd></div>
          <div><dt>hash</dt><dd>${fmtCorto(c.hash ?? 0)}</dd></div>
          <div><dt>efficienza</dt><dd>${Math.round((c.efficienza ?? 0) * 100)} %</dd></div>
          <div><dt>temperatura</dt><dd class="${caldo}">${Math.round(c.temperatura ?? 0)} °C</dd></div>
          <div><dt>bonus</dt><dd>× ${(Math.round((c.moltiplicatore ?? 1) * 100) / 100).toLocaleString('it-IT')}</dd></div>
          <div><dt>calore</dt><dd>${fmt(Math.round(c.calore ?? 0))} W</dd></div>
          <div><dt>raffreddamento</dt><dd>${fmt(Math.round(c.raffreddamento ?? 0))} W</dd></div>
        </dl>
        ${(c.avvisi ?? []).length ? `<ul class="t-mn-avvisi">${c.avvisi.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}
      </div>
    </section>
    <h4 class="t-sh-sez">i pezzi montati</h4>
    <div class="t-mn-slot">${M.CATEGORIE.map((k) => {
      const m = montatoDi(st.montati, k.id), p = m && M.pezzo(m.id)
      return `<button type="button" data-cat="${k.id}" class="${p ? '' : 'vuoto'}${!p && k.obbligatoria ? ' manca' : ''}">${p ? `<canvas data-pezzo="${p.id}" data-lato="40"></canvas>` : '<span class="t-mn-buco"></span>'}<span class="t-mn-sl"><small>${esc(k.nome)}${k.obbligatoria ? '' : ' · facoltativo'}</small><b>${p ? esc(p.nome) : k.obbligatoria ? 'manca' : 'niente'}</b></span>${m && m.n > 1 ? `<i>×${m.n}</i>` : ''}</button>`
    }).join('')}</div>`)
  battiOrologio()
}

// ── il negozio ──
function statsTesto(p) {
  const s = p.stats ?? {}
  const pz = (x) => pct(x / 100 > 1 ? x / 100 : x) // i bonus possono essere 0,12 o 12: tutti e due diventano «+12 %»
  switch (p.cat) {
    case 'tavolo': return `${s.posti} schermi · case fino a «${s.caseMax}» · comfort ${pz(s.comfort ?? 0)}`
    case 'sedia': return `comfort ${pz(s.comfort ?? 0)}`
    case 'case': return `${s.slotGpu} gpu (fino a ${s.gpuMax}) · ${s.slotVentole} ventole · ${fmt(s.raffreddamento ?? 0)} W`
    case 'cpu': case 'gpu': return `hash ${fmtCorto(s.hash ?? 0)} · ${fmt(s.calore ?? 0)} W`
    case 'ventole': return `${fmt(s.raffreddamento ?? 0)} W l’una`
    case 'memoria': return `tiene ${fmt(s.ore ?? 0)} ore · ${pz(s.bonus ?? 0)}`
    case 'schermo': return `${pz(s.bonus ?? 0)} per schermo`
    default: return `${pz(s.bonus ?? 0)}`
  }
}
function negozio() {
  const cat = S.cat ?? M.CATEGORIE[0].id, st = M.stato(), m = montatoDi(st.montati, cat)
  telaio(`<div class="t-mn-cat">${M.CATEGORIE.map((k) => `<button type="button" data-negozio="${k.id}" class="${k.id === cat ? 'on' : ''}">${esc(k.nome)}</button>`).join('')}</div>
    <div class="t-mn-griglia">${M.catalogo(cat).map((p) => {
      const ho = st.posseduti?.[p.id] ?? 0, montato = m?.id === p.id, ci = montato ? { ok: true } : M.compatibile(cat, p.id, 1)
      return `<article class="t-mn-p${montato ? ' montato' : ''}">
        <div class="t-mn-img"><canvas data-pezzo="${p.id}" data-lato="108"></canvas></div>
        <h3>${esc(p.nome)}</h3>
        <p class="t-mn-st">${esc(statsTesto(p))}</p>
        ${p.descr ? `<p class="t-mn-descr">${esc(p.descr)}</p>` : ''}
        ${ci.ok ? '' : `<p class="t-mn-no">${esc(ci.errore)}</p>`}
        <div class="t-mn-riga"><b class="pzk">${fmt(p.prezzo)} $pzk</b>${ho ? `<span>ne hai ${ho}${montato ? ` · montat${m.n > 1 ? 'i' : 'o'}${m.n > 1 ? ` ${m.n}` : ''}` : ''}</span>` : ''}</div>
        <div class="t-mn-az"><button class="c-b" type="button" data-compra="${p.id}">compra</button>${ho && ci.ok && !(montato && !M.CATEGORIE.find((k) => k.id === cat)?.multipla) ? `<button class="c-b verde" type="button" data-monta="${p.id}">${montato ? 'monta +1' : 'monta'}</button>` : ''}${montato ? `<button class="c-b nero" type="button" data-smonta="${cat}">smonta</button>` : ho ? `<button class="c-b nero" type="button" data-vendi="${p.id}">vendi</button>` : ''}</div>
      </article>`
    }).join('')}</div>`)
  host.querySelector('.t-mn-cat .on')?.scrollIntoView({ inline: 'center', block: 'nearest' })
}

// ── i PC pronti ──
function pronti() {
  telaio(`<p class="t-mn-intro">postazioni già pensate, tutti i tipi di PC: compri solo i pezzi che non hai e si monta tutto.</p>
    <div class="t-mn-pronti">${(M.PRONTI ?? []).map((p) => {
      const c = M.calcola(normalizza(p.pezzi))
      return `<article class="t-mn-pc"><div class="t-mn-scena piccola"><canvas data-scena="${p.id}" data-w="300" data-h="150"></canvas></div>
        <h3>${esc(p.nome)}</h3>${p.descr ? `<p class="t-mn-descr">${esc(p.descr)}</p>` : ''}
        <div class="t-mn-riga"><b class="pzk">${p.prezzo ? `${fmt(p.prezzo)} $pzk` : 'ce l’hai già tutto'}</b>${p.prezzo < p.listino ? `<s>${fmt(p.listino)}</s>` : ''}<span>${c.completa ? perOra(c.perOra) : ''}</span></div>
        <button class="c-b" type="button" data-pronto="${p.id}">${p.prezzo ? 'compra e monta' : 'monta'}</button></article>`
    }).join('')}</div>`)
}
const normalizza = (pezzi) => pezzi ?? {}

function disegna() { clearInterval(orologio); return { postazione, negozio, pronti }[S.tab]() }

// i $pzk maturati: il numero e la barra, una volta al secondo, solo nella postazione e solo mentre l'app si vede
function battiOrologio() {
  clearInterval(orologio)
  orologio = setInterval(() => {
    if (host.hidden || S.tab !== 'postazione') return clearInterval(orologio)
    const c = M.calcola(), mat = M.maturati(), b = host.querySelector('[data-maturati]'), barra = host.querySelector('[data-barra]')
    if (!c.completa || !b) return
    b.textContent = `${fmt(Math.floor(mat * 10) / 10)} $pzk`
    if (barra) barra.style.width = `${Math.min(100, (100 * mat) / Math.max(1e-9, c.perOra * c.capienzaOre))}%`
    const inc = host.querySelector('[data-incassa]')
    if (inc) inc.disabled = mat < 0.5
  }, 1000)
}

function esito(r, ok) {
  if (!r?.ok) { ctx.toast(esc(r?.errore ?? 'non si può'), { icona: 'no' }); return false }
  if (ok) ctx.toast(ok + (r.avvisi?.length ? `<br>${r.avvisi.map(esc).join(' ')}` : ''), { icona: r.avvisi?.length ? 'bot-pensa' : 'si', ms: r.avvisi?.length ? 5200 : 3200 })
  return true
}
function clic(e) {
  const t = (s) => e.target.closest(s)
  let b
  if ((b = t('[data-tab]'))) { scegli('tab', b.dataset.tab); return disegna() }
  if ((b = t('[data-cat]'))) { scegli('cat', b.dataset.cat); scegli('tab', 'negozio'); return disegna() }
  if ((b = t('[data-negozio]'))) { scegli('cat', b.dataset.negozio); return disegna() }
  if ((b = t('[data-compra]'))) { const p = M.pezzo(b.dataset.compra); if (esito(M.compra(p.id), `comprato: <b>${esc(p.nome)}</b>`)) disegna(); return }
  if ((b = t('[data-monta]'))) {
    const p = M.pezzo(b.dataset.monta), m = montatoDi(M.stato().montati, p.cat), r = m?.id === p.id ? M.monta(p.cat, p.id, m.n + 1) : M.monta(p.cat, p.id)
    const n = montatoDi(M.stato().montati, p.cat)?.n ?? 1
    if (esito(r, `montato: <b>${esc(p.nome)}</b>${n > 1 ? ` ×${n}` : ''}`)) disegna()
    return
  }
  if ((b = t('[data-smonta]'))) { if (esito(M.smonta(b.dataset.smonta), 'smontato')) disegna(); return }
  if ((b = t('[data-vendi]'))) { const p = M.pezzo(b.dataset.vendi), r = M.vendi(p.id); if (esito(r, `venduto: +${fmt(r.reso ?? 0)} $pzk`)) disegna(); return }
  if ((b = t('[data-pronto]'))) { const p = M.PRONTI.find((x) => x.id === b.dataset.pronto); if (esito(M.compraPronto(p.id), `<b>${esc(p.nome)}</b>: comprato e montato`)) { scegli('tab', 'postazione'); disegna() } return }
  if (t('[data-incassa]')) { const r = M.incassa(); if (esito(r, `incassati <b>+${fmt(r.n)} $pzk</b>`)) disegna() }
}

export function monta(h, c) {
  host = h; ctx = c
  tieni(host, 'miniera') // ogni lista ricorda il suo punto
  host.addEventListener('click', clic)
  smetti = M.ascolta?.(() => { if (!host.hidden && S.tab === 'postazione') disegna() })
  disegna()
  return { mostra: () => disegna(), nascondi: () => clearInterval(orologio) }
}
