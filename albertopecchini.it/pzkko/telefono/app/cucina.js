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

import * as zaino from '../../chat/zaino.js'
import { paga } from '../../chat/chat.js'
import { oggi } from '../../games/pzk.js'
import { PER_ID } from '../../chat/testi.js'
import { icona } from '../../chat/icone.js'
import { tieni, dallAlto } from '../ricordi.js'

const RICETTE = [
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
const MEDAGLIE = [[0.9, 'oro', '#ffd400', 60], [0.7, 'argento', '#d7dde2', 35], [0.45, 'bronzo', '#d08a4a', 15]]
const medaglia = (v) => MEDAGLIE.find(([m]) => v >= m) ?? null
const PAGATE = 3
const commento = (v) => (v >= 0.9 ? 'perfetto! meglio della nonna' : v >= 0.7 ? 'brava, così si fa' : v >= 0.45 ? 'mmh… si può mangiare' : 'la nonna sospira')
const COME = { taglia: 'tocca quando il coltello è sulla riga', ordina: 'tocca gli ingredienti nell’ordine', mescola: 'gira in tondo attorno alla pentola', impasta: 'tocca più in fretta che puoi', versa: 'tieni premuto, lascia nella fascia verde', cuoci: 'tocca quando la lancetta è nel verde' }

let host = null, ctx = null
let G = null // la partita: { r, i, punti, fase }
let anim = 0, fineGioco = null // il minigioco in corso: il suo requestAnimationFrame e come chiuderlo

const stato = () => { const c = zaino.cucinaStato(); return c.g === oggi() ? c : { ...c, g: oggi(), pagate: 0, piatti: [] } }
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
  GIOCHI[tipo](o)
}
function voto(v) {
  cancelAnimationFrame(anim); fineGioco = null
  v = Math.max(0, Math.min(1, v))
  G.punti.push(v)
  G.fase = 'esito'
  const ultimo = G.i === G.r.passi.length - 1
  scena(`<div class="t-cu-voto"><b>${Math.round(v * 100)}</b><small>su 100</small></div>${nonna(commento(v))}<div class="t-cu-via"><button class="c-b" type="button" data-avanti>${ultimo ? 'assaggia' : 'avanti'}</button></div>`)
}
function finale() {
  G.fase = 'fine'
  const v = G.punti.reduce((a, x) => a + x, 0) / G.punti.length, m = medaglia(v), c = stato()
  const premi = []
  if (m && c.pagate < PAGATE) {
    c.pagate++
    const n = paga(m[3]), xp = Math.round(m[3] / 3)
    zaino.daiXp(xp)
    premi.push(`<span class="pzk">+${n} $pzk</span>`, `+${xp} xp`)
  }
  if (m?.[1] === 'oro' && PER_ID[G.r.piatto] && !c.piatti.includes(G.r.id)) { c.piatti.push(G.r.id); zaino.aggiungi(G.r.piatto); premi.push(`${icona(G.r.piatto)} nello zaino`) }
  const record = v > (c.record[G.r.id] ?? -1)
  if (record) c.record[G.r.id] = v
  zaino.salvaCucina(c)
  scena(`<div class="t-cu-fine">${icona(G.r.piatto)}
      <div class="t-cu-medaglia" style="--m:${m?.[2] ?? '#666'}">${m ? { oro: 'medaglia d’oro', argento: 'medaglia d’argento', bronzo: 'medaglia di bronzo' }[m[1]] : 'niente medaglia'}</div>
      <b>${Math.round(v * 100)} / 100</b>${record ? '<small>nuovo record!</small>' : ''}
      <p class="t-cu-premi">${premi.length ? premi.join(' · ') : m ? 'oggi hai già preso i premi: questa è per la gloria' : 'niente premi: riprova'}</p></div>
    ${nonna(m?.[1] === 'oro' ? 'come li faccio io. anzi meglio!' : m ? 'buoni! la prossima volta ancora di più.' : 'questi li diamo al gatto. riproviamo?')}
    <div class="t-cu-via"><button class="c-b" type="button" data-ancora>rifalla</button><button class="c-b nero" type="button" data-menu>le ricette</button></div>`, true)
}

// ── i minigiochi: ognuno disegna la sua scena e alla fine chiama voto(0…1) ──
const tempo = (ms) => `<div class="t-cu-tempo"><i style="animation-duration:${ms}ms"></i></div>`
const scade = (ms, fn) => { const t0 = performance.now(); return () => performance.now() - t0 > ms && (fn(), true) }
const GIOCHI = {
  taglia({ icona: ic, tagli }) {
    const righe = Array.from({ length: tagli }, (_, k) => 0.18 + (0.64 * (k + 0.2 + Math.random() * 0.6)) / tagli).map((x) => ({ x, fatto: false }))
    scena(`${tempo(12000)}<div class="t-cu-tavolo" data-colpo>${icona(ic, 'emo t-cu-cibo')}${righe.map((r, k) => `<i class="t-cu-riga" data-k="${k}" style="left:${r.x * 100}%"></i>`).join('')}<span class="t-cu-coltello">${icona('coltello')}</span></div>`)
    const coltello = host.querySelector('.t-cu-coltello'), voti = []
    let x = 0, verso = 1
    const finito = scade(12000, () => voto(voti.reduce((a, v) => a + v, 0) / tagli))
    const giro = () => { x += verso * 0.011; if (x > 1 || x < 0) { verso *= -1; x = Math.max(0, Math.min(1, x)) } coltello.style.left = `${x * 100}%`; if (!finito()) anim = requestAnimationFrame(giro) }
    anim = requestAnimationFrame(giro)
    fineGioco = () => {
      const libere = righe.filter((r) => !r.fatto)
      if (!libere.length) return
      const r = libere.sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x))[0], d = Math.abs(r.x - x)
      r.fatto = true
      voti.push(Math.max(0, 1 - d / 0.14))
      const el = host.querySelector(`.t-cu-riga[data-k="${righe.indexOf(r)}"]`)
      el.classList.add('fatto'); el.style.left = `${x * 100}%`
      if (voti.length === tagli) setTimeout(() => voto(voti.reduce((a, v) => a + v, 0) / tagli), 350)
    }
  },
  ordina({ seq }) {
    const carte = [...seq].sort(() => Math.random() - 0.5)
    let prossimo = 0, sbagli = 0
    scena(`${tempo(14000)}<p class="t-cu-seq">${seq.map((s, k) => `<span data-s="${k}">${(PER_ID[s]?.nome ?? s).replace(/^(un’|un |una |uno |il |la |l’|i |le |gli )/i, '')}</span>`).join(' → ')}</p>
      <div class="t-cu-carte">${carte.map((s) => `<button type="button" data-ing="${s}">${icona(s)}</button>`).join('')}</div><div class="t-cu-ciotola">${icona('pentola')}</div>`)
    const finito = scade(14000, () => voto((prossimo / seq.length) - sbagli * 0.2))
    const giro = () => { if (!finito()) anim = requestAnimationFrame(giro) }
    anim = requestAnimationFrame(giro)
    fineGioco = (e) => {
      const b = e?.target.closest('[data-ing]')
      if (!b || b.disabled) return
      if (b.dataset.ing === seq[prossimo]) {
        b.disabled = true; b.classList.add('giusto')
        host.querySelector(`[data-s="${prossimo}"]`)?.classList.add('fatto')
        if (++prossimo === seq.length) setTimeout(() => voto(1 - sbagli * 0.2), 300)
      } else { sbagli++; b.animate([{ translate: '0' }, { translate: '-6px' }, { translate: '6px' }, { translate: '0' }], { duration: 220 }) }
    }
  },
  mescola({ icona: ic, giri }) {
    scena(`${tempo(7000)}<div class="t-cu-pentola" data-gira>${icona('pentola', 'emo t-cu-cibo')}<span class="t-cu-cucchiaio">${icona(ic)}</span><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="6"/><circle class="t-cu-anello" cx="50" cy="50" r="46" fill="none" stroke="#46ff7d" stroke-width="6" stroke-dasharray="289" stroke-dashoffset="289" transform="rotate(-90 50 50)"/></svg><b class="t-cu-conta">0/${giri}</b></div>`)
    const p = host.querySelector('.t-cu-pentola'), anello = p.querySelector('.t-cu-anello'), cucchiaio = p.querySelector('.t-cu-cucchiaio'), conta = p.querySelector('.t-cu-conta')
    let somma = 0, prima = null
    const finito = scade(7000, () => voto(Math.abs(somma) / (2 * Math.PI) / giri))
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
      if (g >= giri) { p.removeEventListener('pointermove', muovi); setTimeout(() => voto(1), 250) }
    }
    p.addEventListener('pointermove', muovi)
    p.addEventListener('pointerdown', (e) => { prima = null; p.setPointerCapture?.(e.pointerId) })
  },
  impasta({ icona: ic, colpi }) {
    scena(`${tempo(5000)}<button type="button" class="t-cu-impasto" data-colpo><span class="t-cu-sfoglia"></span>${icona(ic, 'emo t-cu-cibo')}<b class="t-cu-conta">0</b></button>`)
    const s = host.querySelector('.t-cu-sfoglia'), conta = host.querySelector('.t-cu-conta')
    let n = 0
    const finito = scade(5000, () => voto(n / colpi))
    const giro = () => { if (!finito()) anim = requestAnimationFrame(giro) }
    anim = requestAnimationFrame(giro)
    fineGioco = () => {
      n++
      conta.textContent = n
      s.style.transform = `scale(${0.4 + 0.9 * Math.min(1, n / colpi)}, ${1.1 - 0.5 * Math.min(1, n / colpi)})`
      if (n >= colpi) setTimeout(() => voto(1), 200)
    }
  },
  versa({ icona: ic }) {
    const a = 0.55 + Math.random() * 0.2, b = a + 0.12
    scena(`${tempo(9000)}<div class="t-cu-versa"><button type="button" class="t-cu-tieni" data-tieni>${icona(ic, 'emo t-cu-cibo')}<small>tieni premuto</small></button><div class="t-cu-bicchiere"><i class="t-cu-zona" style="bottom:${a * 100}%;height:${(b - a) * 100}%"></i><i class="t-cu-livello"></i></div></div>`)
    const liv = host.querySelector('.t-cu-livello'), tasto = host.querySelector('[data-tieni]')
    let x = 0, giu = false, fatto = false
    const chiudi = () => { if (fatto) return; fatto = true; const c = (a + b) / 2; voto(x >= a && x <= b ? 1 - Math.abs(x - c) / (b - a) * 0.4 : Math.max(0, 1 - Math.abs(x - c) * 4)) }
    const finito = scade(9000, chiudi)
    const giro = () => { if (giu) { x = Math.min(1, x + 0.008); liv.style.height = `${x * 100}%` } if (x >= 1) return chiudi(); if (!finito()) anim = requestAnimationFrame(giro) }
    anim = requestAnimationFrame(giro)
    tasto.addEventListener('pointerdown', (e) => { giu = true; tasto.setPointerCapture?.(e.pointerId) })
    const su = () => { if (giu) { giu = false; if (x > 0.02) chiudi() } }
    tasto.addEventListener('pointerup', su); tasto.addEventListener('pointercancel', su)
  },
  cuoci({ icona: ic }) {
    const a = 0.58 + Math.random() * 0.22, b = a + 0.1
    scena(`${tempo(8000)}<div class="t-cu-cuoci" data-colpo>${icona(ic, 'emo t-cu-cibo')}<div class="t-cu-scala"><i class="t-cu-zona" style="left:${a * 100}%;width:${(b - a) * 100}%"></i><i class="t-cu-lancetta"></i></div><small>tocca nel verde</small></div>`)
    const l = host.querySelector('.t-cu-lancetta'), t0 = performance.now()
    let x = 0
    const finito = scade(8000, () => voto(0))
    const giro = (t) => { x = 0.5 - 0.5 * Math.cos(((t - t0) / 1000) * 2.6); l.style.left = `${x * 100}%`; if (!finito()) anim = requestAnimationFrame(giro) }
    anim = requestAnimationFrame(giro)
    fineGioco = () => { const c = (a + b) / 2; voto(x >= a && x <= b ? 1 - Math.abs(x - c) / (b - a) * 0.4 : Math.max(0, 1 - Math.abs(x - c) * 3.5)) }
  },
}

function clic(e) {
  if (G?.fase === 'gioca' && fineGioco && (e.target.closest('[data-colpo]') || e.target.closest('[data-ing]'))) return fineGioco(e)
  const r = e.target.closest('[data-ricetta]')
  if (r) { G = { r: RICETTE.find((x) => x.id === r.dataset.ricetta), i: 0, punti: [] }; dallAlto(host); return presenta() }
  if (e.target.closest('[data-via]')) return gioca()
  if (e.target.closest('[data-avanti]')) { if (G.i + 1 < G.r.passi.length) { G.i++; presenta() } else finale(); return }
  if (e.target.closest('[data-ancora]')) { G = { r: G.r, i: 0, punti: [] }; return presenta() }
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
