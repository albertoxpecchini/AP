// L'app Cucina (26.10): le ricette del Mincio alla Cooking Mama, con la nonna (l'avatar av-nonna) che guarda e commenta.
// Ogni ricetta è una fila di passi, ognuno un minigioco di pochi secondi:
//   taglia   il coltello va avanti e indietro: si tocca quando è sulla riga tratteggiata (più vicino, meglio)
//   ordina   gli ingredienti nell'ordine detto: ogni sbaglio costa
//   mescola  si gira in tondo attorno alla pentola (dito o mouse): quanti giri prima che scada il tempo
//   impasta  si tocca più in fretta che si può (stendere, sbriciolare)
//   versa    si tiene premuto e si lascia quando il livello è nella fascia verde
//   cuoci    la lancetta va su e giù: si ferma nella fascia verde
// Ogni passo vale da 0 a 100; la media dà la medaglia (oro 90, argento 70, bronzo 45). Le prime tre ricette del giorno con
// una medaglia pagano $pzk (col moltiplicatore, come la chat) e xp; con l'oro, una volta al giorno per ricetta, il piatto
// vero va nello zaino quando esiste (i tortelli, la sbrisolona). Lo stato sta nello zaino (zaino.cucinaStato).
//
// DAL 31.10 I VOTI LI DÀ LA BANCA (Alberto: «il browser non decide più niente»; giochi/app-cucina.mjs sul server di Alberto).
// I minigiochi si giocano qui, ma la ricetta la apre la banca ('cucina.apri') con la sua ora e i numeri a caso di ogni passo
// (dove sono le righe da tagliare, l'ordine delle carte, la fascia del versa e del cuoci); finito un passo, qui si manda
// quello che si è fatto ('cucina.passo': i millisecondi dei tagli, gli ingredienti toccati, i quarti di giro, i colpi, quanto è
// stato aperto il sacco, quando si è fermata la lancetta), e la banca fa il voto con le stesse formule e controlla che i tempi
// stiano nel tempo passato davvero. All'ultimo passo la banca dà la medaglia e i premi. Il coltello, la lancetta e il sacco si
// muovono col tempo, non coi fotogrammi, uguali qui, nella cucina di pzk os e sulla banca: il voto che si vede subito è
// quello che darà la banca.

import * as zaino from '../../chat/zaino.js'
import * as pzk from '../../games/pzk.js'
import { oggi } from '../../games/pzk.js'
import { PER_ID } from '../../chat/testi.js'
import { icona } from '../../chat/icone.js'
import { tieni, dallAlto } from '../ricordi.js'

// (dal 29.10 le ricette, le medaglie e i premi si esportano: li usa anche la cucina di pzk os, telefono/zero/os/cucina.js)
// (31.10: i passi e i premi che contano sono quelli della banca, giochi/app-cucina.mjs: si cambiano insieme)
export const RICETTE = [
  { id: 'tortelli', nome: 'tortelli di zucca', piatto: 'tortelli', dove: 'la vigilia di Natale, in tutta Mantova', passi: [
    ['taglia', 'taglia la zucca', { icona: 'zucca', tagli: 3 }],
    ['ordina', 'il ripieno, in quest’ordine', { seq: ['zucca', 'amaretti', 'mostarda', 'parmigiano'] }],
    ['mescola', 'mescola il ripieno', { icona: 'mestolo', giri: 4 }],
    ['impasta', 'stendi la sfoglia col mattarello', { icona: 'mattarello', colpi: 22 }],
    ['cuoci', 'scolali quando vengono a galla', { icona: 'pentola' }],
  ] },
  { id: 'pilota', nome: 'risotto alla pilota', piatto: 'risotto', dove: 'quello dei piloti delle risaie, a Villimpenta', passi: [
    ['versa', 'il cono di riso nell’acqua: fermati al punto giusto', { icona: 'riso' }],
    ['cuoci', 'spegni il fuoco al momento giusto', { icona: 'pentola' }],
    ['taglia', 'taglia la salamella', { icona: 'salamella', tagli: 2 }],
    ['mescola', 'sgrana la salamella e mescola', { icona: 'mestolo', giri: 5 }],
    ['ordina', 'mantecalo', { seq: ['burro', 'parmigiano', 'salamella'] }],
  ] },
  { id: 'sbrisolona', nome: 'torta sbrisolona', piatto: 'sbrisolona', dove: 'il dolce che si rompe col pugno', passi: [
    ['ordina', 'nella ciotola, in quest’ordine', { seq: ['farina', 'mandorle', 'burro', 'uova'] }],
    ['impasta', 'sbriciola l’impasto con le dita', { icona: 'farina', colpi: 26 }],
    ['versa', 'le briciole nella teglia: non troppe', { icona: 'mandorle' }],
    ['cuoci', 'tirala fuori dal forno quando è dorata', { icona: 'forno' }],
  ] },
  { id: 'luccio', nome: 'luccio in salsa', piatto: 'luccio-salsa', dove: 'il pesce del Mincio, con la salsa verde', passi: [
    ['taglia', 'pulisci il luccio', { icona: 'luccio', tagli: 3 }],
    ['cuoci', 'lessalo piano: spegni al momento giusto', { icona: 'pentola' }],
    ['taglia', 'trita il prezzemolo', { icona: 'prezzemolo', tagli: 4 }],
    ['mescola', 'la salsa: olio, prezzemolo e capperi', { icona: 'mestolo', giri: 4 }],
  ] },
]
export const MEDAGLIE = [[0.9, 'oro', '#ffd400', 60], [0.7, 'argento', '#d7dde2', 35], [0.45, 'bronzo', '#d08a4a', 15]]
export const medaglia = (v) => MEDAGLIE.find(([m]) => v >= m) ?? null
export const PAGATE = 3
export const commento = (v) => (v >= 0.9 ? 'perfetto! meglio della nonna' : v >= 0.7 ? 'brava, così si fa' : v >= 0.45 ? 'mmh… si può mangiare' : 'la nonna sospira')
/** Il nome di un ingrediente senza l'articolo (il ripieno: zucca, amaretti…). */
export const nomeIng = (s) => (PER_ID[s]?.nome ?? s).replace(/^(un’|un |una |uno |il |la |l’|i |le |gli )/i, '')
export const COME = { taglia: 'tocca quando il coltello è sulla riga', ordina: 'tocca gli ingredienti nell’ordine', mescola: 'gira in tondo attorno alla pentola', impasta: 'tocca più in fretta che puoi', versa: 'tieni premuto, lascia nella fascia verde', cuoci: 'tocca quando la lancetta è nel verde' }

// ── il movimento e il voto: uguali alla banca (giochi/app-cucina.mjs) ──
export const TEMPO = { taglia: 12000, ordina: 14000, mescola: 7000, impasta: 5000, versa: 9000, cuoci: 8000 }
/** Dov'è il coltello (0…1) dopo ms: va e viene, 0,66 al secondo. */
export const coltello = (ms) => { const p = ((ms / 1000) * 0.66) % 2; return p <= 1 ? p : 2 - p }
/** Dov'è la lancetta (0…1) dopo ms. */
export const lancetta = (ms) => 0.5 - 0.5 * Math.cos((ms / 1000) * 2.6)
/** Quanto è pieno il bicchiere (0…1) dopo ms di sacco aperto. */
export const livello = (ms) => Math.min(1, (ms / 1000) * 0.48)
const fascia = (x, a, b, k) => { const c = (a + b) / 2; return x >= a && x <= b ? 1 - (Math.abs(x - c) / (b - a)) * 0.4 : Math.max(0, 1 - Math.abs(x - c) * k) }
/** Il voto (0…1) di un passo dalle mosse, coi numeri della banca: lo stesso che darà lei (qui per mostrarlo subito). */
export function votoDi([tipo, , o], par, mosse) {
  let v = 0
  if (tipo === 'taglia') {
    const righe = par.righe.map((x) => ({ x, fatto: false }))
    for (const ms of [...mosse].sort((a, b) => a - b)) { const xc = coltello(ms), r = righe.filter((q) => !q.fatto).sort((a, b) => Math.abs(a.x - xc) - Math.abs(b.x - xc))[0]; r.fatto = true; v += Math.max(0, 1 - Math.abs(r.x - xc) / 0.14) }
    v /= o.tagli
  } else if (tipo === 'ordina') {
    let prossimo = 0, sbagli = 0
    const messe = new Set()
    for (const s of mosse) { if (prossimo >= o.seq.length) break; if (messe.has(s)) continue; if (s === o.seq[prossimo]) { messe.add(s); prossimo++ } else sbagli++ }
    v = prossimo === o.seq.length ? 1 - sbagli * 0.2 : prossimo / o.seq.length - sbagli * 0.2
  } else if (tipo === 'mescola') v = Math.min(mosse, o.giri * 4) / 4 / o.giri
  else if (tipo === 'impasta') v = Math.min(mosse, o.colpi) / o.colpi
  else if (tipo === 'versa') v = fascia(livello(mosse ?? 0), par.a, par.b, 4)
  else if (tipo === 'cuoci') v = mosse === null ? 0 : fascia(lancetta(mosse), par.a, par.b, 3.5)
  return Math.max(0, Math.min(1, v))
}
let coda = Promise.resolve()
/** Apre una ricetta sulla banca. → Promise<{ ok, par: [i numeri di ogni passo] } | { ok: false, errore }> */
export async function apri(r) {
  coda = Promise.resolve()
  const d = await pzk.fai('cucina.apri', { ricetta: r.id })
  return d?.ok ? { ok: true, par: d.esito.par } : { ok: false, errore: d?.errore ?? 'la banca non risponde: riprova' }
}
/** Manda le mosse del passo i alla banca (in fila, uno alla volta). All'ultimo la banca chiude la ricetta: fine = { v, m (la
 *  medaglia, come in MEDAGLIE), pzk, xp, piatto, record }. → Promise<{ ok, v, fine? } | { ok: false, errore }> */
export function passo(i, mosse) {
  const p = coda.then(() => pzk.fai('cucina.passo', { i, mosse })).then((d) => {
    if (!d?.ok) return { ok: false, errore: d?.errore ?? 'la banca non risponde: riprova' }
    const f = d.esito.fine
    return { ok: true, v: d.esito.v, ...(f && { fine: { ...f, m: MEDAGLIE.find((x) => x[1] === f.m) ?? null } }) }
  }, () => ({ ok: false, errore: 'niente rete: riprova' }))
  coda = p
  return p
}

let host = null, ctx = null
let G = null // la partita: { r, i, punti, fase, par, chiusura }
let anim = 0, fineGioco = null // il minigioco in corso: il suo requestAnimationFrame e come chiuderlo

export const stato = () => { const c = zaino.cucinaStato(); return c.g === oggi() ? c : { ...c, g: oggi(), pagate: 0, piatti: [] } }
const nonna = (testo) => `<div class="t-cu-nonna">${icona('av-nonna')}<p>${testo}</p></div>`

// ── il menù ──
function menu() {
  const c = stato()
  host.innerHTML = `${ctx.testata('Cucina', `<span class="t-sh-piede" style="margin:0">pagate oggi ${Math.min(c.pagate, PAGATE)}/${PAGATE}</span>`)}
    <div class="t-corpo-app t-cu">
      ${nonna('cosa cuciniamo oggi? le ricette di casa, quelle del Mincio.')}
      <div class="t-cu-ricette">${RICETTE.map((r) => {
        const rec = c.record[r.id], m = rec != null ? medaglia(rec) : null
        return `<button type="button" class="t-cu-r" data-ricetta="${r.id}">${icona(r.piatto)}<div><b>${r.nome}</b><small>${r.dove}</small><span>${r.passi.length} passi${rec != null ? ` · record ${Math.round(rec * 100)}` : ''}</span></div>${m ? `<i style="--m:${m[2]}">${m[1]}</i>` : ''}</button>`
      }).join('')}</div>
    </div>`
}

// ── un passo: la presentazione, il gioco, il voto ──
function scena(corpo, fine = false) {
  const [tipo, testo] = fine ? ['fine', 'a tavola!'] : G.r.passi[G.i]
  host.innerHTML = `${ctx.testata(G.r.nome, `<span class="t-sh-piede" style="margin:0">passo ${G.i + 1}/${G.r.passi.length}</span>`)}
    <div class="t-corpo-app t-cu t-cu-gioco" data-tipo="${tipo}"><div class="t-cu-titolo"><b>${testo}</b><small>${fine ? 'il piatto della nonna' : COME[tipo]}</small></div>${corpo}</div>`
}
function presenta() {
  G.fase = 'intro'
  scena(`${nonna(G.i === 0 ? `i ${G.r.nome}! ${G.r.dove}. pronta?` : `ora: ${G.r.passi[G.i][1]}.`)}<div class="t-cu-via"><button class="c-b" type="button" data-via>via!</button></div>`)
}
function gioca() {
  G.fase = 'gioca'
  const [tipo, , o] = G.r.passi[G.i]
  GIOCHI[tipo](o, G.par[G.i])
}
/** Il passo è finito: le mosse vanno alla banca, e il voto (lo stesso della banca) si vede subito. */
function voto(mosse) {
  cancelAnimationFrame(anim); fineGioco = null
  if (G?.fase !== 'gioca') return
  const v = votoDi(G.r.passi[G.i], G.par[G.i], mosse)
  G.punti.push(v)
  G.fase = 'esito'
  const g = G, ultimo = G.i === G.r.passi.length - 1
  const risposta = passo(G.i, mosse).then((e) => { if (!e.ok && g === G) { ctx.toast(e.errore, { icona: 'bot-triste' }); esci() } return e })
  if (ultimo) g.chiusura = risposta
  scena(`<div class="t-cu-voto"><b>${Math.round(v * 100)}</b><small>su 100</small></div>${nonna(commento(v))}<div class="t-cu-via"><button class="c-b" type="button" data-avanti>${ultimo ? 'assaggia' : 'avanti'}</button></div>`)
}
/** La ricetta finita: la medaglia e i premi li dice la banca (le prime tre del giorno con una medaglia pagano; l'oro, una
 *  volta al giorno per ricetta, mette il piatto nello zaino). */
async function finale() {
  G.fase = 'fine'
  const g = G
  scena(`<div class="t-cu-fine">${icona(G.r.piatto)}<b>…</b><small>la nonna assaggia</small></div>`, true)
  const e = await g.chiusura
  if (g !== G || !e?.ok) return
  const { v, m, pzk: n, xp, piatto, record } = e.fine
  const premi = []
  if (n || xp) premi.push(`<span class="pzk">+${n} $pzk</span>`, `+${xp} xp`)
  if (piatto) premi.push(`${icona(G.r.piatto)} nello zaino`)
  scena(`<div class="t-cu-fine">${icona(G.r.piatto)}
      <div class="t-cu-medaglia" style="--m:${m?.[2] ?? '#666'}">${m ? { oro: 'medaglia d’oro', argento: 'medaglia d’argento', bronzo: 'medaglia di bronzo' }[m[1]] : 'niente medaglia'}</div>
      <b>${Math.round(v * 100)} / 100</b>${record ? '<small>nuovo record!</small>' : ''}
      <p class="t-cu-premi">${premi.length ? premi.join(' · ') : m ? 'oggi hai già preso i premi: questa è per la gloria' : 'niente premi: riprova'}</p></div>
    ${nonna(m?.[1] === 'oro' ? 'come li faccio io. anzi meglio!' : m ? 'buoni! la prossima volta ancora di più.' : 'questi li diamo al gatto. riproviamo?')}
    <div class="t-cu-via"><button class="c-b" type="button" data-ancora>rifalla</button><button class="c-b nero" type="button" data-menu>le ricette</button></div>`, true)
}

// ── i minigiochi: ognuno disegna la sua scena coi numeri della banca (par) e alla fine chiama voto(mosse) ──
const tempo = (ms) => `<div class="t-cu-tempo"><i style="animation-duration:${ms}ms"></i></div>`
const scade = (ms, fn) => { const t0 = performance.now(); return () => performance.now() - t0 > ms && (fn(), true) }
const GIOCHI = {
  taglia({ icona: ic, tagli }, par) {
    const righe = par.righe.map((x) => ({ x, fatto: false }))
    scena(`${tempo(12000)}<div class="t-cu-tavolo" data-colpo>${icona(ic, 'emo t-cu-cibo')}${righe.map((r, k) => `<i class="t-cu-riga" data-k="${k}" style="left:${r.x * 100}%"></i>`).join('')}<span class="t-cu-coltello">${icona('coltello')}</span></div>`)
    const el = host.querySelector('.t-cu-coltello'), tagli0 = [], t0 = performance.now() // (tagli0: i ms di ogni taglio, per la banca)
    const finito = scade(12000, () => voto(tagli0))
    const giro = () => { el.style.left = `${coltello(performance.now() - t0) * 100}%`; if (!finito()) anim = requestAnimationFrame(giro) }
    anim = requestAnimationFrame(giro)
    fineGioco = () => {
      const libere = righe.filter((r) => !r.fatto)
      if (!libere.length) return
      const ms = Math.round(performance.now() - t0), x = coltello(ms)
      const r = libere.sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0]
      r.fatto = true
      tagli0.push(ms)
      const q = host.querySelector(`.t-cu-riga[data-k="${righe.indexOf(r)}"]`)
      q.classList.add('fatto'); q.style.left = `${x * 100}%`
      if (tagli0.length === tagli) { fineGioco = null; setTimeout(() => voto(tagli0), 350) }
    }
  },
  ordina({ seq }, par) {
    const carte = par.carte, tocchi = [] // (tocchi: gli ingredienti toccati, in fila, per la banca)
    let prossimo = 0
    scena(`${tempo(14000)}<p class="t-cu-seq">${seq.map((s, k) => `<span data-s="${k}">${nomeIng(s)}</span>`).join(' → ')}</p>
      <div class="t-cu-carte">${carte.map((s) => `<button type="button" data-ing="${s}">${icona(s)}</button>`).join('')}</div><div class="t-cu-ciotola">${icona('pentola')}</div>`)
    const finito = scade(14000, () => voto(tocchi))
    const giro = () => { if (!finito()) anim = requestAnimationFrame(giro) }
    anim = requestAnimationFrame(giro)
    fineGioco = (e) => {
      const b = e?.target.closest('[data-ing]')
      if (!b || b.disabled) return
      tocchi.push(b.dataset.ing)
      if (b.dataset.ing === seq[prossimo]) {
        b.disabled = true; b.classList.add('giusto')
        host.querySelector(`[data-s="${prossimo}"]`)?.classList.add('fatto')
        if (++prossimo === seq.length) { fineGioco = null; setTimeout(() => voto(tocchi), 300) }
      } else b.animate([{ translate: '0' }, { translate: '-6px' }, { translate: '6px' }, { translate: '0' }], { duration: 220 })
    }
  },
  mescola({ icona: ic, giri }) {
    scena(`${tempo(7000)}<div class="t-cu-pentola" data-gira>${icona('pentola', 'emo t-cu-cibo')}<span class="t-cu-cucchiaio">${icona(ic)}</span><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="6"/><circle class="t-cu-anello" cx="50" cy="50" r="46" fill="none" stroke="#46ff7d" stroke-width="6" stroke-dasharray="289" stroke-dashoffset="289" transform="rotate(-90 50 50)"/></svg><b class="t-cu-conta">0/${giri}</b></div>`)
    const p = host.querySelector('.t-cu-pentola'), anello = p.querySelector('.t-cu-anello'), cucchiaio = p.querySelector('.t-cu-cucchiaio'), conta = p.querySelector('.t-cu-conta')
    let somma = 0, prima = null
    const quarti = () => Math.min(giri * 4, Math.floor(Math.abs(somma) / (Math.PI / 2))) // (alla banca vanno i quarti di giro)
    const finito = scade(7000, () => voto(quarti()))
    const giro = () => { if (!finito()) anim = requestAnimationFrame(giro) }
    anim = requestAnimationFrame(giro)
    const muovi = (e) => {
      const r = p.getBoundingClientRect(), a = Math.atan2(e.clientY - r.top - r.height / 2, e.clientX - r.left - r.width / 2)
      if (prima !== null) { let d = a - prima; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; somma += d }
      prima = a
      const g = Math.abs(somma) / (2 * Math.PI)
      cucchiaio.style.transform = `rotate(${a}rad) translateX(34%)`
      anello.style.strokeDashoffset = 289 * (1 - Math.min(1, g / giri))
      conta.textContent = `${Math.floor(g)}/${giri}`
      if (g >= giri) { p.removeEventListener('pointermove', muovi); setTimeout(() => voto(giri * 4), 250) }
    }
    p.addEventListener('pointermove', muovi)
    p.addEventListener('pointerdown', (e) => { prima = null; p.setPointerCapture?.(e.pointerId) })
  },
  impasta({ icona: ic, colpi }) {
    scena(`${tempo(5000)}<button type="button" class="t-cu-impasto" data-colpo><span class="t-cu-sfoglia"></span>${icona(ic, 'emo t-cu-cibo')}<b class="t-cu-conta">0</b></button>`)
    const s = host.querySelector('.t-cu-sfoglia'), conta = host.querySelector('.t-cu-conta')
    let n = 0
    const finito = scade(5000, () => voto(n))
    const giro = () => { if (!finito()) anim = requestAnimationFrame(giro) }
    anim = requestAnimationFrame(giro)
    fineGioco = () => {
      n++
      conta.textContent = n
      s.style.transform = `scale(${0.4 + 0.9 * Math.min(1, n / colpi)}, ${1.1 - 0.5 * Math.min(1, n / colpi)})`
      if (n >= colpi) { fineGioco = null; setTimeout(() => voto(n), 200) }
    }
  },
  versa({ icona: ic }, par) {
    const { a, b } = par
    scena(`${tempo(9000)}<div class="t-cu-versa"><button type="button" class="t-cu-tieni" data-tieni>${icona(ic, 'emo t-cu-cibo')}<small>tieni premuto</small></button><div class="t-cu-bicchiere"><i class="t-cu-zona" style="bottom:${a * 100}%;height:${(b - a) * 100}%"></i><i class="t-cu-livello"></i></div></div>`)
    const liv = host.querySelector('.t-cu-livello'), tasto = host.querySelector('[data-tieni]')
    let aperto = 0, da = 0, fatto = false // (aperto: i ms di sacco aperto, quelli che vanno alla banca)
    const ora = () => aperto + (da ? performance.now() - da : 0)
    const chiudi = () => { if (fatto) return; fatto = true; if (da) { aperto += performance.now() - da; da = 0 } voto(Math.round(aperto)) }
    const finito = scade(9000, chiudi)
    const giro = () => { const x = livello(ora()); liv.style.height = `${x * 100}%`; if (x >= 1) return chiudi(); if (!finito()) anim = requestAnimationFrame(giro) }
    anim = requestAnimationFrame(giro)
    tasto.addEventListener('pointerdown', (e) => { if (!da && !fatto) da = performance.now(); tasto.setPointerCapture?.(e.pointerId) })
    const su = () => { if (da) { aperto += performance.now() - da; da = 0; if (livello(aperto) > 0.02) chiudi() } }
    tasto.addEventListener('pointerup', su); tasto.addEventListener('pointercancel', su)
  },
  cuoci({ icona: ic }, par) {
    const { a, b } = par
    scena(`${tempo(8000)}<div class="t-cu-cuoci" data-colpo>${icona(ic, 'emo t-cu-cibo')}<div class="t-cu-scala"><i class="t-cu-zona" style="left:${a * 100}%;width:${(b - a) * 100}%"></i><i class="t-cu-lancetta"></i></div><small>tocca nel verde</small></div>`)
    const l = host.querySelector('.t-cu-lancetta'), t0 = performance.now()
    const finito = scade(8000, () => voto(null))
    const giro = () => { l.style.left = `${lancetta(performance.now() - t0) * 100}%`; if (!finito()) anim = requestAnimationFrame(giro) }
    anim = requestAnimationFrame(giro)
    fineGioco = () => { fineGioco = null; voto(Math.round(performance.now() - t0)) }
  },
}

/** La ricetta si apre sulla banca (coi numeri dei passi), poi si presenta il primo passo. */
let aprendo = false
async function comincia(r) {
  if (aprendo || !r) return
  aprendo = true
  const a = await apri(r).finally(() => { aprendo = false })
  if (!a.ok) return ctx.toast(a.errore, { icona: 'bot-triste' })
  G = { r, i: 0, punti: [], par: a.par }
  dallAlto(host)
  presenta()
}

function clic(e) {
  if (G?.fase === 'gioca' && fineGioco && (e.target.closest('[data-colpo]') || e.target.closest('[data-ing]'))) return fineGioco(e)
  const r = e.target.closest('[data-ricetta]')
  if (r) return comincia(RICETTE.find((x) => x.id === r.dataset.ricetta))
  if (e.target.closest('[data-via]')) return gioca()
  if (e.target.closest('[data-avanti]')) { if (G.i + 1 < G.r.passi.length) { G.i++; presenta() } else finale(); return }
  if (e.target.closest('[data-ancora]')) return comincia(G.r)
  if (e.target.closest('[data-menu]')) return esci()
}
function esci() { cancelAnimationFrame(anim); fineGioco = null; G = null; menu() }

export function monta(h, c) {
  host = h; ctx = c
  tieni(host, 'cucina')
  host.addEventListener('click', clic)
  // la barra spaziatrice (col mouse): taglia, impasta, cuoci
  addEventListener('keydown', (e) => { if (e.code === 'Space' && !host.hidden && G?.fase === 'gioca' && fineGioco && host.querySelector('[data-colpo]')) { e.preventDefault(); fineGioco(e) } })
  // la freccia della testata e il tasto verde: dentro una ricetta si torna al menù, non alla home
  host.addEventListener('click', (e) => { if (e.target.closest('.t-indietro') && G) { e.stopPropagation(); esci() } }, true)
  menu()
  return { mostra: () => { if (!G) menu() }, nascondi: () => { if (G?.fase === 'gioca') esci() } }
}
