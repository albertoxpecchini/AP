// L'app Conversioni (26.10): un numero scritto in una base (decimale, binario, ottale, esadecimale) e subito lo stesso numero
// nelle altre, con la parte dopo la virgola e i numeri grandi quanto si vuole (BigInt). Con i bit (8, 16, 32, 64) mostra
// il complemento a 2 e legge i binari e gli esadecimali anche con il segno. Sotto, «come si fa»: il procedimento che si
// scrive a scuola verso la base scelta (le divisioni successive e i resti letti dal basso, le moltiplicazioni per la parte
// frazionaria, la somma delle potenze, i gruppi di 4 o 3 bit). Si tocca un risultato per copiarlo.

import { icona } from '../../chat/icone.js'
import { tieni, ricordo, ricorda } from '../ricordi.js'

const BASI = [[10, 'dec', 'decimale'], [2, 'bin', 'binario'], [8, 'oct', 'ottale'], [16, 'hex', 'esadecimale']]
const NOME = Object.fromEntries(BASI.map(([b, , n]) => [b, n]))
const CIFRE = '0123456789ABCDEF'
const MAX_FRAZ = 16 // cifre dopo la virgola, al più (poi «…»: la frazione non finisce)
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

let host = null, ctx = null
let S = ricordo('conversioni', { testo: '42', da: 10, bit: 0, verso: 2 })

/** Il testo nella base b → { neg, int, fn/fd (la parte dopo la virgola, frazione esatta: tutto BigInt), fraz, cifreFraz } o { errore }. Accetta 0b 0o 0x davanti (cambiano la base). */
function leggi(testo, b) {
  let t = testo.trim().replace(/[\s_']/g, '').toUpperCase()
  const neg = t.startsWith('-')
  if (neg || t.startsWith('+')) t = t.slice(1)
  const pre = /^0([BOX])/.exec(t)
  if (pre) { b = { B: 2, O: 8, X: 16 }[pre[1]]; t = t.slice(2) }
  if (!t) return { errore: 'scrivi un numero' }
  const [ip, fp = '', ...altro] = t.split(/[.,]/)
  if (altro.length) return { errore: 'una virgola sola' }
  let int = 0n
  for (const c of ip || '0') {
    const v = CIFRE.indexOf(c)
    if (v < 0 || v >= b) return { errore: `«${c}» non è una cifra in base ${b}` }
    int = int * BigInt(b) + BigInt(v)
  }
  let fn = 0n, fd = 1n
  for (const c of fp) {
    const v = CIFRE.indexOf(c)
    if (v < 0 || v >= b) return { errore: `«${c}» non è una cifra in base ${b}` }
    fn = fn * BigInt(b) + BigInt(v); fd *= BigInt(b)
  }
  return { neg, int, fn, fd, fraz: fn > 0n, cifreFraz: fp.length, b }
}

/** L'intero in base b. */
const intIn = (n, b) => n.toString(b).toUpperCase()
/** La parte frazionaria in base b, per moltiplicazioni successive, esatta: { cifre, finita } (non finita: periodica). */
function frazIn(x, b) {
  let n = x.fn, cifre = ''
  for (let i = 0; i < MAX_FRAZ && n > 0n; i++) { n *= BigInt(b); cifre += CIFRE[Number(n / x.fd)]; n %= x.fd }
  return { cifre, finita: n === 0n }
}
/** Le cifre a gruppi per leggerle (4 per binari ed esadecimali, 3 per ottali e decimali), dalla destra. */
const gruppi = (s, n) => s.replace(new RegExp(`\\B(?=(.{${n}})+$)`, 'g'), ' ')
const passo = (b) => (b === 2 || b === 16 ? 4 : 3)

function scritto(x, b) {
  const i = intIn(x.int, b), f = x.fraz ? frazIn(x, b) : null
  return { testo: `${x.neg ? '-' : ''}${i}${f ? `.${f.cifre}` : ''}`, vista: `${x.neg ? '−' : ''}${gruppi(i, passo(b))}${f ? `,${f.cifre}${f.finita ? '' : '…'}` : ''}` }
}

/** Il complemento a 2 su n bit: il pattern (BigInt) o null se il numero non ci sta. */
function c2(x, n) {
  if (x.fraz) return null
  const v = x.neg ? -x.int : x.int, min = -(1n << BigInt(n - 1)), max = (1n << BigInt(n)) - 1n
  if (v < min || v > max) return null
  return v < 0 ? (1n << BigInt(n)) + v : v
}

function risultati(x) {
  if (x.errore) return `<p class="t-cv-err">${esc(x.errore)}</p>`
  const righe = BASI.map(([b, sigla]) => {
    const s = scritto(x, b)
    return `<button type="button" class="t-cv-r${b === x.b ? ' da' : ''}" data-copia="${esc(s.testo)}"><small>${sigla}</small><b>${s.vista}</b>${icona('si')}</button>`
  })
  if (S.bit) {
    const p = c2(x, S.bit)
    if (p === null) righe.push(`<p class="t-cv-err">${x.fraz ? 'il complemento a 2 è per gli interi' : `non ci sta in ${S.bit} bit: con segno va da −${2n ** BigInt(S.bit - 1)} a ${2n ** BigInt(S.bit - 1) - 1n}`}</p>`)
    else {
      const bin = p.toString(2).padStart(S.bit, '0'), segno = bin[0] === '1' && !x.neg && (x.b === 2 || x.b === 16)
      righe.push(`<button type="button" class="t-cv-r c2" data-copia="${bin}"><small>${S.bit} bit</small><b>${gruppi(bin, 4)}</b>${icona('si')}</button>`,
        `<button type="button" class="t-cv-r c2" data-copia="${intIn(p, 16).padStart(S.bit / 4, '0')}"><small>hex ${S.bit}</small><b>${gruppi(intIn(p, 16).padStart(S.bit / 4, '0'), 4)}</b>${icona('si')}</button>`)
      if (segno) righe.push(`<p class="t-cv-nota">letto con il segno (il primo bit è 1): <b>${p - (1n << BigInt(S.bit))}</b></p>`)
    }
  }
  return righe.join('')
}

// ── come si fa ──
function procedimento(x) {
  if (x.errore) return ''
  const da = x.b, a = S.verso
  if (da === a) return '<p class="t-cv-nota">è già in questa base: scegline un’altra qui sopra.</p>'
  const out = []
  // da o verso il binario, fra 2, 8 e 16: i gruppi di bit
  const pot2 = (b) => b === 2 || b === 8 || b === 16
  if (pot2(da) && pot2(a) && !x.fraz) {
    const bin = intIn(x.int, 2)
    if (da !== 2) out.push(`<p>ogni cifra ${NOME[da]} diventa ${Math.log2(da)} bit:</p>${tabella(intIn(x.int, da).split('').map((c) => [c, CIFRE.indexOf(c).toString(2).padStart(Math.log2(da), '0')]))}`)
    if (a !== 2) {
      const n = Math.log2(a), pad = bin.padStart(Math.ceil(bin.length / n) * n, '0'), g = pad.match(new RegExp(`.{${n}}`, 'g'))
      out.push(`<p>i bit a gruppi di ${n} da destra (con gli zeri davanti), ogni gruppo è una cifra ${NOME[a]}:</p>${tabella(g.map((x) => [x, CIFRE[parseInt(x, 2)]]))}`)
    }
    out.push(`<p class="t-cv-fine">= <b>${scritto(x, a).vista}</b> in ${NOME[a]}</p>`)
    return out.join('')
  }
  // verso il decimale: la somma delle cifre per le potenze della base
  if (a === 10) {
    const ci = intIn(x.int, da), cf = x.fraz ? frazIn(x, da).cifre.slice(0, x.cifreFraz || MAX_FRAZ) : ''
    const termini = [...ci].map((c, i) => [c, ci.length - 1 - i]).concat([...cf].map((c, i) => [c, -(i + 1)])).filter(([c]) => c !== '0')
    out.push(`<p>ogni cifra per la sua potenza di ${da}, e si somma:</p>${tabella(termini.slice(0, 40).map(([c, e]) => [`${c} × ${da}<sup>${e}</sup>`, fmt(CIFRE.indexOf(c) * da ** e)]))}`)
    if (termini.length > 40) out.push('<p class="t-cv-nota">…e le altre, uguali.</p>')
    out.push(`<p class="t-cv-fine">= <b>${scritto(x, 10).vista}</b></p>`)
    return out.join('')
  }
  // dal decimale (o passando dal decimale): le divisioni successive, i resti letti dal basso
  if (da !== 10) out.push(`<p>prima in decimale (la somma delle potenze di ${da}): <b>${scritto(x, 10).vista}</b>; poi:</p>`)
  const div = []
  for (let n = x.int; n > 0n && div.length < 70; n /= BigInt(a)) div.push([`${n} : ${a}`, `${n / BigInt(a)}`, CIFRE[Number(n % BigInt(a))]])
  out.push(`<p>la parte intera si divide per ${a} finché resta 0; i resti, letti dal <b>basso</b> in alto, sono le cifre:</p>${tabella(div.length ? div : [['0', '0', '0']], ['divisione', 'quoziente', 'resto'])}`)
  if (x.fraz) {
    const mol = []
    let n = x.fn
    for (let i = 0; i < 12 && n > 0n; i++) { const p = n * BigInt(a); mol.push([`${fmtQ(n, x.fd)} × ${a}`, fmtQ(p, x.fd), CIFRE[Number(p / x.fd)]]); n = p % x.fd }
    out.push(`<p>la parte dopo la virgola si moltiplica per ${a}: la parte intera di ogni prodotto è una cifra, letta dall’<b>alto</b> in basso${n ? ' (qui non finisce mai: è periodica, ci si ferma)' : ''}:</p>${tabella(mol, ['moltiplicazione', 'prodotto', 'cifra'])}`)
  }
  out.push(`<p class="t-cv-fine">= <b>${scritto(x, a).vista}</b> in ${NOME[a]}</p>`)
  return out.join('')
}
const fmtQ = (n, d) => fmt(Number(n) / Number(d))
const fmt = (n) => Number(n.toFixed(10)).toLocaleString('it-IT', { maximumFractionDigits: 10 })
const tabella = (righe, testa = null) => `<table class="t-cv-tab">${testa ? `<thead><tr>${testa.map((t) => `<th>${t}</th>`).join('')}</tr></thead>` : ''}<tbody>${righe.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`

// ── la pagina: l'ingresso si disegna una volta (scrivendo non perde il fuoco), il resto a ogni tasto ──
function telaio() {
  host.innerHTML = `${ctx.testata('Conversioni')}
    <div class="t-corpo-app t-cv">
      <input class="t-cv-in" type="text" inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="scrivi un numero" aria-label="il numero" value="${esc(S.testo)}">
      <div class="t-cv-scelte"><span>da</span><div class="t-za-filtri" data-scelta="da">${BASI.map(([b, s]) => `<button type="button" data-v="${b}">${s}</button>`).join('')}</div>
        <span>bit</span><div class="t-za-filtri" data-scelta="bit">${[0, 8, 16, 32, 64].map((b) => `<button type="button" data-v="${b}">${b || 'no'}</button>`).join('')}</div></div>
      <div class="t-cv-ris"></div>
      <h4 class="t-sh-sez">come si fa, verso</h4>
      <div class="t-za-filtri" data-scelta="verso">${BASI.map(([b, s]) => `<button type="button" data-v="${b}">${s}</button>`).join('')}</div>
      <div class="t-cv-passi"></div>
    </div>`
  aggiorna()
}
function aggiorna() {
  ricorda('conversioni', S)
  const x = leggi(S.testo, S.da)
  for (const g of host.querySelectorAll('[data-scelta]')) for (const b of g.children) b.classList.toggle('on', Number(b.dataset.v) === (g.dataset.scelta === 'da' ? x.b ?? S.da : S[g.dataset.scelta]))
  host.querySelector('.t-cv-ris').innerHTML = risultati(x)
  host.querySelector('.t-cv-passi').innerHTML = procedimento(x)
}

function clic(e) {
  const b = e.target.closest('[data-scelta] [data-v]'), c = e.target.closest('[data-copia]')
  if (b) {
    const k = b.parentElement.dataset.scelta, v = Number(b.dataset.v)
    if (k === 'da' && v !== S.da) { const x = leggi(S.testo, S.da); if (!x.errore) S.testo = scritto(x, v).testo } // cambia base: il numero si riscrive nella nuova
    S[k] = v
    if (k === 'da') host.querySelector('.t-cv-in').value = S.testo
    return aggiorna()
  }
  if (c) navigator.clipboard?.writeText(c.dataset.copia).then(() => ctx.toast(`copiato: ${esc(c.dataset.copia.slice(0, 40))}`, { icona: 'si' }), () => {})
}

export function monta(h, c) {
  host = h; ctx = c
  tieni(host, 'conversioni')
  host.addEventListener('click', clic)
  host.addEventListener('input', (e) => { if (e.target.matches('.t-cv-in')) { S.testo = e.target.value; aggiorna() } })
  telaio()
  return { mostra: () => { if (matchMedia('(hover:hover)').matches) host.querySelector('.t-cv-in')?.focus({ preventScroll: true }) } }
}
