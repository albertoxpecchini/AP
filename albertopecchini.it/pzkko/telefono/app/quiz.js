// L'app Quiz (23.10): i quiz retributivi (chat/quiz.js) a tutto schermo. L'ingresso dice quante risposte pagate restano oggi,
// il record di serie e gli argomenti; la partita è una domanda alla volta, col cerchio dei 15 secondi, a sinistra la foto
// intera quando c'è (con il credito) o se no la domanda scritta grande, a destra le quattro risposte una sotto l'altra; ogni
// risposta giusta mostra quanto ha pagato, la serie cresce; alla fine il riepilogo. Le domande, i premi e il tetto
// giornaliero sono quelli della chat.

import * as zaino from '../../chat/zaino.js'
import * as quiz from '../../chat/quiz.js'
import { icona } from '../../chat/icone.js'
import { fmt } from '../../games/pzk.js'
import { tieni } from '../ricordi.js'

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const NOMI = ['', 'facile', 'media', 'difficile']
let host = null, ctx = null
let P = null // la partita in corso
let timer = 0, inizio = 0, bloccata = false

function ingresso() {
  P = null
  const rest = quiz.restanti()
  host.innerHTML = `${ctx.testata('Quiz')}
    <div class="t-corpo-app t-qz">
      <section class="t-qz-eroe">
        <div class="t-qz-ico">${icona('quiz')}</div>
        <h3>quiz che pagano</h3>
        <p>${quiz.PER_PARTITA} domande, ${quiz.TEMPO} secondi l’una. Ogni risposta giusta vale da ${quiz.PAGA[1]} a ${quiz.PAGA[3]} $pzk, di più se rispondi in fretta e se sei in serie. Una partita perfetta: +${quiz.BONUS_PERFETTA}.</p>
        <div class="t-qz-dati"><div><b>${rest}</b><small>pagate oggi</small></div><div><b>${zaino.stat('quizGiusti')}</b><small>giuste in tutto</small></div><div><b>${quiz.record()}</b><small>serie record</small></div></div>
        ${rest ? '' : '<p class="t-qz-nota">le risposte pagate di oggi sono finite: puoi allenarti, ma paga solo in punti esperienza.</p>'}
      </section>
      <button class="c-b t-qz-via" type="button" data-arg="">di tutto un po’</button>
      <div class="t-qz-arg">${quiz.TUTTI_ARGOMENTI.map(([id, nome, ico]) => `<button type="button" data-arg="${id}">${icona(ico)}<span>${nome}</span></button>`).join('')}</div>
    </div>`
}

// la domanda scritta grande, nella colonna di sinistra quando non c'è la foto (le più lunghe, oltre 80 caratteri, un po' più piccole)
const grande = (t) => `<h3 class="t-qz-domanda${t.length > 80 ? ' lunga' : ''}">${esc(t)}</h3>`

function domanda() {
  const d = P.domande[P.i]
  bloccata = false
  // con la foto: la domanda in testa, la foto intera a sinistra e le risposte a destra; senza: la domanda grande a sinistra
  host.innerHTML = `${ctx.testata(`Quiz · ${P.i + 1}/${P.domande.length}`, `<span class="t-qz-serie${P.serie > 1 ? ' su' : ''}">${icona('fuoco')}${P.serie}</span>`)}
    <div class="t-corpo-app t-qz t-qz-gioco ${d.img ? 'con-foto' : 'senza-foto'}">
      <div class="t-qz-punti">${P.domande.map((_, i) => `<i class="${i < P.i ? (P.esiti[i] ? 'si' : 'no') : i === P.i ? 'ora' : ''}"></i>`).join('')}</div>
      <div class="t-qz-testa">
        <div class="t-qz-tempo"><svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="19"/><circle class="v" cx="22" cy="22" r="19" style="animation-duration:${quiz.TEMPO}s"/></svg><b data-sec>${quiz.TEMPO}</b></div>
        <span class="t-qz-diff d${d.diff}">${NOMI[d.diff]} · ${quiz.PAGA[d.diff]} $pzk</span>
        ${d.img ? `<h3 class="t-qz-q">${esc(d.q)}</h3>` : ''}
      </div>
      <div class="t-qz-campo">
        ${d.img ? `<figure class="t-qz-foto"><img src="${esc(d.img)}" alt="" referrerpolicy="no-referrer"><figcaption>${esc(d.credito ?? '')}</figcaption></figure>` : grande(d.q)}
        <div class="t-qz-risp">${d.risposte.map((t, i) => `<button type="button" data-r="${i}"><span>${'ABCD'[i]}</span>${esc(t)}</button>`).join('')}</div>
      </div>
      <div class="t-qz-esito" hidden></div>
    </div>`
  // il rapporto vero della foto, per il css: la foto è larga quanto il rapporto le concede nell'altezza del campo, intera.
  // Se non si carica, al suo posto va la domanda grande (e si tira a indovinare)
  const img = host.querySelector('.t-qz-foto img')
  if (img) {
    const fig = img.parentElement
    const rapporto = () => { if (img.naturalWidth) fig.style.setProperty('--ar', (img.naturalWidth / img.naturalHeight).toFixed(4)) }
    img.addEventListener('load', rapporto)
    img.addEventListener('error', () => { fig.outerHTML = grande('la foto non si carica: tira a indovinare') })
    if (img.complete) rapporto()
  }
  inizio = performance.now()
  clearInterval(timer)
  timer = setInterval(() => {
    const resto = quiz.TEMPO * 1000 - (performance.now() - inizio)
    const s = host.querySelector('[data-sec]')
    if (s) s.textContent = Math.max(0, Math.ceil(resto / 1000))
    if (resto <= 0) rispondi(null)
  }, 200)
}

function rispondi(i) {
  if (bloccata || !P) return
  bloccata = true
  clearInterval(timer)
  const d = P.domande[P.i]
  const r = quiz.rispondi(P, i, Math.max(0, quiz.TEMPO * 1000 - (performance.now() - inizio)))
  P.esiti.push(r.giusta)
  for (const b of host.querySelectorAll('[data-r]')) {
    b.disabled = true
    if (Number(b.dataset.r) === r.indiceGiusto) b.classList.add('giusta')
    else if (Number(b.dataset.r) === i) b.classList.add('sbagliata')
  }
  host.querySelector('.t-qz-tempo')?.classList.add('ferma')
  // l'esito prende il posto della testa (in orizzontale; in verticale va sotto le risposte): foto e risposte restano dove sono.
  // La nota delle foto («era il Palazzo Ducale.») ripete la risposta giusta, già scritta o già scelta: lì non serve
  host.querySelector('.t-qz-gioco')?.classList.add('risposto')
  const nota = r.nota && r.nota !== `era ${d.risposte[r.indiceGiusto]}.` ? r.nota : ''
  const es = host.querySelector('.t-qz-esito')
  es.hidden = false
  es.className = `t-qz-esito ${r.giusta ? 'si' : 'no'}`
  es.innerHTML = `${icona(r.giusta ? 'bot-ride' : 'bot-triste')}<div><b>${r.giusta ? (r.pagato ? `+${fmt(r.premio)} $pzk` : 'giusto!') : i === null ? 'tempo scaduto' : 'sbagliato'}</b><small>${r.giusta ? `+${r.xp} xp${r.serie > 1 ? ` · serie di ${r.serie}` : ''}` : `era: ${esc(d.risposte[r.indiceGiusto])}`}</small>${nota ? `<p>${esc(nota)}</p>` : ''}</div><button class="c-b" type="button" data-avanti>${P.finita ? 'risultato' : 'avanti'}</button>`
  es.scrollIntoView({ block: 'nearest' }) // di colpo, senza scivolare (niente transizioni); se l'esito si vede già non fa niente
  if (r.livello) ctx.toast(`sei salito al <b>livello ${r.livello}</b>!`, { icona: 'livello' })
  P.ultimo = r
}

function fine() {
  const p = P
  const perfetta = p.giuste === p.domande.length
  host.innerHTML = `${ctx.testata('Quiz')}
    <div class="t-corpo-app t-qz t-qz-fine">
      <div class="t-qz-ico grande">${icona(perfetta ? 'bot-ricco' : p.giuste >= p.domande.length / 2 ? 'bot-ride' : 'bot-triste')}</div>
      <h3>${p.giuste} su ${p.domande.length}</h3>
      <p>${perfetta ? 'Perfetto: nessun errore, il bonus è tuo.' : p.giuste >= p.domande.length / 2 ? 'Non male. Sapevi più di quanto sembri.' : 'Si impara anche sbagliando. Soprattutto sbagliando.'}</p>
      <div class="t-qz-punti grandi">${p.esiti.map((x) => `<i class="${x ? 'si' : 'no'}"></i>`).join('')}</div>
      <div class="t-qz-dati"><div><b class="pzk">+${fmt(p.guadagnato)}</b><small>$pzk</small></div><div><b>+${p.xp}</b><small>xp</small></div><div><b>${quiz.restanti()}</b><small>pagate rimaste</small></div></div>
      <div class="t-sh-cta"><button class="c-b nero" type="button" data-ingresso>argomenti</button><button class="c-b" type="button" data-arg="${p.arg === 'tutti' ? '' : p.arg}">ancora</button></div>
    </div>`
  P = null
}

async function parti(arg) {
  host.innerHTML = `${ctx.testata('Quiz')}<div class="t-carico"><i></i></div>`
  const p = await quiz.nuova(arg || null)
  if (!p) { ctx.toast(arg === 'giocatori' ? 'servono almeno tre giocatori nel database con qualche punto' : 'niente domande qui', { icona: 'bot-pensa' }); return ingresso() }
  P = { ...p, esiti: [] }
  domanda()
}

function clic(e) {
  const a = e.target.closest('[data-arg]'), r = e.target.closest('[data-r]')
  if (a) return parti(a.dataset.arg)
  if (r) return rispondi(Number(r.dataset.r))
  if (e.target.closest('[data-avanti]')) return P?.finita ? fine() : domanda()
  if (e.target.closest('[data-ingresso]')) return ingresso()
}

export function monta(h, c) {
  host = h; ctx = c
  tieni(host, 'quiz') // gli argomenti e il riepilogo restano dove li lasci (telefono/ricordi.js)
  host.addEventListener('click', clic)
  // la freccia indietro durante una partita torna all'ingresso (e la partita si perde), dall'ingresso alla home
  host.addEventListener('click', (e) => { if (e.target.closest('.t-indietro') && P) { e.stopPropagation(); clearInterval(timer); ingresso() } }, true)
  document.addEventListener('keydown', (e) => { if (host.hidden || !P || bloccata) return; const k = 'abcd1234'.indexOf(e.key.toLowerCase()); if (k >= 0) rispondi(k % 4) })
  ingresso()
  return { mostra: () => { if (!P) ingresso() }, nascondi: () => {} }
}
