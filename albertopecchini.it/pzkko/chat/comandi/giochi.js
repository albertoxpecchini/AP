// I giochi via comando: quiz, veloce, slot, dadi, moneta (nati qui) e roulette, blackjack, mine, dado (le regole sono
// quelle dei giochi veri in games/*/regole.js: stessi pagamenti, stesso banco). Le puntate passano dal tavolo «chat-<gioco>»
// di games/pzk.js (punta → regola), come negli altri giochi.
import * as zaino from '../zaino.js'
import { MINIGIOCHI } from '../minigiochi.js'
import { PUNTATE_PER_ID as ROULETTE, esito as esitoRoulette } from '../../games/roulette/regole.js'
import { sabot, punti, RANGHI } from '../../games/blackjack/regole.js'
import { Partita, MINE, LIMITI as LIMITI_MINE, nuovoSeme, scriviMolt, nomeCasella } from '../../games/mine/regole.js'
import { REGOLE as REGOLE_DADO, PER_ID as DADO, esito as esitoDado, leggi as leggiDadi } from '../../games/dado/regole.js'

const ROSSI = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36])
const d6 = () => 1 + Math.floor(Math.random() * 6)
const DADO_ICONE = Array.from({ length: 7 }, (_, i) => `<span class="c-carta">${i}</span>`) // le facce come cartellini
const faccia = (n) => `<b class="pzk">${n}</b>`

/** Controlla e mette sul tavolo la puntata: → l'importo, o null (ha già detto perché). */
function puntata(ctx, gioco, s, min, max) {
  const n = ctx.importo(s, Math.min(max, ctx.pzk.saldo()))
  if (!Number.isFinite(n)) { ctx.dì({ colore: 'rosso', d: `quanto punti? Es. <code>${gioco} 50</code> (anche 1k, metà, tutto).` }); return null }
  if (n < min || n > max) { ctx.dì({ colore: 'rosso', d: `si punta da ${ctx.fmt(min)} a ${ctx.fmt(max)} $pzk.` }); return null }
  if (!ctx.punta(`chat-${gioco}`, n)) {
    if (ctx.pzk.aSecco()) { if (ctx.pzk.ricarica()) ctx.dì({ colore: 'ambra', av: 'bot-occhiolino', d: `eri a secco: ${ctx.pzkHtml(1000)} nuovi. Ripeti la puntata.` }); else ctx.dì({ colore: 'ambra', d: ctx.pzk.perche() || 'sei a secco.' }) }
    else ctx.dì({ colore: 'rosso', av: 'bot-triste', d: `non ti bastano: hai ${ctx.pzkHtml(ctx.pzk.saldo())}.` })
    return null
  }
  return n
}
const fine = (ctx, gioco, giocato, torna) => { ctx.regola(`chat-${gioco}`, giocato, torna); return torna - giocato }
const esitoHtml = (ctx, netto) => (netto > 0 ? `<b>+${ctx.fmt(netto)}</b> $pzk` : netto < 0 ? `<span class="meno">−${ctx.fmt(-netto)}</span> $pzk` : 'pari')

export const GIOCHI = [
  {
    nomi: ['quiz', 'trivia'], cat: 'giochi', icona: 'quiz', breve: 'una domanda, quattro risposte, 12 secondi: 30, 60 o 120 $pzk', uso: 'quiz [facile|medio|difficile]', attesa: 30,
    async fai(ctx) {
      const diff = { facile: 1, medio: 2, media: 2, difficile: 3 }[ctx.args[0]?.toLowerCase()] ?? null
      const r = await MINIGIOCHI.quiz(ctx, diff)
      const premio = [0, 30, 60, 120][r.diff]
      if (!r.ok) return ctx.scheda({ colore: 'grigio', av: 'bot-triste', d: r.nota })
      const n = ctx.paga(premio)
      ctx.scheda({ colore: 'oro', av: 'bot-ride', t: ':quiz: giusto', d: `${ctx.pzkHtml(n)}.` })
      ctx.saleDiLivello(zaino.daiXp(4 * r.diff))
    },
  },
  {
    nomi: ['veloce', 'fast', 'riflessi'], cat: 'giochi', icona: 'fulmine', breve: 'una parola compare all’improvviso: riscrivila, paga in base al tempo', uso: 'veloce', attesa: 30,
    async fai(ctx) {
      const r = await MINIGIOCHI.veloce(ctx)
      if (!r.ok) return ctx.scheda({ colore: 'grigio', av: 'bot-triste', d: r.nota })
      const n = ctx.paga(Math.round(Math.max(30, 300 - r.tempo / 15)))
      ctx.scheda({ colore: 'oro', av: 'bot-ride', t: ':fulmine: ' + (r.tempo < 2000 ? 'fulmine' : r.tempo < 4000 ? 'svelto' : 'bradipo'), d: `${r.nota} ${ctx.pzkHtml(n)}.` })
      ctx.saleDiLivello(zaino.daiXp(5))
    },
  },
  {
    nomi: ['slot', 'slots'], cat: 'giochi', icona: 'sette', breve: 'tre rulli: slot 50. Tre chiocciole d’oro ×50', uso: 'slot <puntata>', attesa: 10,
    spiega: 'Tre rulli. Tre :chiocciola-oro: ×50, tre :sette: ×20, tre :diamante: ×12, tre :campana: ×8, tre uguali qualsiasi ×5, due uguali ×1,5. Da 1 a 500 $pzk.',
    async fai(ctx) {
      const n = puntata(ctx, 'slot', ctx.args[0], 1, 500)
      if (n === null) return false
      const RULLO = [['ciliegia', 9], ['limone', 9], ['anguria', 8], ['uva', 8], ['trifoglio', 7], ['stella', 6], ['campana', 5], ['bar', 5], ['diamante', 3], ['sette', 2], ['chiocciola-oro', 1]]
      const tot = RULLO.reduce((a, [, p]) => a + p, 0)
      const gira = () => { let r = Math.random() * tot; for (const [s, p] of RULLO) { r -= p; if (r < 0) return s } return 'ciliegia' }
      const esce = [gira(), gira(), gira()]
      const s = ctx.dì({ colore: 'ambra', t: ':sette: slot', html: `<div class="c-rulli gira"><div>${ctx.icona('sette')}</div><div>${ctx.icona('sette')}</div><div>${ctx.icona('sette')}</div></div>`, pie: `puntati ${ctx.fmt(n)}` })
      const rulli = s.querySelectorAll('.c-rulli div')
      for (let i = 0; i < 3; i++) { await ctx.dormi(700); rulli[i].innerHTML = ctx.icona(esce[i]); rulli[i].style.animation = 'none'; rulli[i].querySelector('.emo').style.animation = 'none' }
      s.querySelector('.c-rulli').classList.remove('gira')
      const [a, b, c] = esce
      let molt = 0
      if (a === b && b === c) molt = { 'chiocciola-oro': 50, sette: 20, diamante: 12, campana: 8 }[a] ?? 5
      else if (a === b || b === c || a === c) molt = 1.5
      const torna = Math.round(n * molt * 2) / 2
      const netto = fine(ctx, 'slot', n, torna)
      ctx.aggiorna(s, { colore: molt >= 5 ? 'oro' : molt ? 'verde' : 'grigio', av: molt >= 5 ? 'bot-ricco' : molt ? 'bot-ride' : 'bot-triste', t: molt >= 5 ? `:${a}: :${a}: :${a}: JACKPOT ×${molt}` : molt ? 'due uguali' : 'niente', html: `<div class="c-rulli">${esce.map((x) => `<div>${ctx.icona(x)}</div>`).join('')}</div>`, pie: esitoHtml(ctx, netto) })
      zaino.daiXp(2)
    },
  },
  {
    nomi: ['dadi', 'gamble', 'sfida'], cat: 'giochi', icona: 'dadi', breve: 'tu contro il bot, due dadi a testa: dadi 100', uso: 'dadi <puntata>', attesa: 10,
    async fai(ctx) {
      const n = puntata(ctx, 'dadi', ctx.args[0], 1, 1000)
      if (n === null) return false
      const s = ctx.dì({ colore: 'ambra', av: 'bot-pensa', t: ':dadi: dadi', d: 'tiro io, poi tu…' })
      await ctx.dormi(900)
      const io = [d6(), d6()], tu = [d6(), d6()]
      const si = io[0] + io[1], st = tu[0] + tu[1]
      await ctx.dormi(600)
      const torna = st > si ? n * 2 : st === si ? n : 0
      const netto = fine(ctx, 'dadi', n, torna)
      ctx.aggiorna(s, { colore: netto > 0 ? 'oro' : netto ? 'rosso' : 'grigio', av: netto > 0 ? 'bot-triste' : netto ? 'bot-ride' : 'bot-pensa', t: `:dadi: ${netto > 0 ? 'hai vinto' : netto ? 'ho vinto io' : 'pari'}`, campi: [['pzk (il bot)', `${DADO_ICONE[io[0]]} ${DADO_ICONE[io[1]]} = ${faccia(si)}`], [ctx.nome(), `${DADO_ICONE[tu[0]]} ${DADO_ICONE[tu[1]]} = ${faccia(st)}`]], pie: esitoHtml(ctx, netto) })
      zaino.daiXp(2)
    },
  },
  {
    nomi: ['moneta', 'cf', 'coinflip', 'testa', 'croce'], cat: 'giochi', icona: 'testa', breve: 'testa o croce: moneta 50 testa', uso: 'moneta <puntata> testa|croce',
    async fai(ctx) {
      let [a, b] = ctx.args
      if (['testa', 'croce'].includes(a?.toLowerCase())) [a, b] = [b, a]
      const scelta = b?.toLowerCase()
      if (!['testa', 'croce'].includes(scelta)) return ctx.dì({ colore: 'rosso', d: 'si scrive <code>moneta 50 testa</code> (o croce).' })
      const n = puntata(ctx, 'moneta', a, 1, 1000)
      if (n === null) return false
      const s = ctx.dì({ colore: 'ambra', av: 'bot-pensa', t: ':testa: la moneta gira…' })
      await ctx.dormi(1100)
      const esce = crypto.getRandomValues(new Uint8Array(1))[0] % 2 ? 'testa' : 'croce'
      const netto = fine(ctx, 'moneta', n, esce === scelta ? n * 2 : 0)
      ctx.aggiorna(s, { colore: netto > 0 ? 'oro' : 'rosso', av: netto > 0 ? 'bot-ride' : 'bot-occhiolino', t: `:${esce}: ${esce}`, d: `avevi detto ${scelta}.`, pie: esitoHtml(ctx, netto) })
      zaino.daiXp(1)
    },
  },
  {
    nomi: ['roulette', 'rl'], cat: 'giochi', icona: 'roulette', breve: 'roulette 50 rosso · nero, pari, dispari, basso, alto, dozzina 2, colonna 3, o un numero', uso: 'roulette <puntata> <rosso|nero|pari|dispari|basso|alto|dozzina 1-3|colonna 1-3|0-36>',
    async fai(ctx) {
      const [imp, ...resto] = ctx.args
      const cosa = resto.join(' ').toLowerCase().trim()
      const id = /^(\d|[12]\d|3[0-6])$/.test(cosa) ? `pieno:${Number(cosa)}` : { rosso: 'semplice:rosso', nero: 'semplice:nero', pari: 'semplice:pari', dispari: 'semplice:dispari', basso: 'semplice:1-18', '1-18': 'semplice:1-18', alto: 'semplice:19-36', '19-36': 'semplice:19-36' }[cosa]
        ?? (/^dozzina ?([123])$/.exec(cosa) ? [...ROULETTE.values()].filter((p) => p.tipo === 'dozzina')[Number(RegExp.$1) - 1].id : /^colonna ?([123])$/.exec(cosa) ? [...ROULETTE.values()].filter((p) => p.tipo === 'colonna')[Number(RegExp.$1) - 1].id : null)
      const p = id && ROULETTE.get(id)
      if (!p) return ctx.dì({ colore: 'rosso', d: 'si scrive <code>roulette 50 rosso</code>: rosso, nero, pari, dispari, basso (1-18), alto (19-36), dozzina 1-3, colonna 1-3, o un numero da 0 a 36.' })
      const n = puntata(ctx, 'roulette', imp, 1, 1000)
      if (n === null) return false
      const s = ctx.dì({ colore: 'ambra', av: 'bot-pensa', t: ':roulette: rien ne va plus', d: `${ctx.fmt(n)} su <b>${p.nome}</b> (paga ${p.paga} a 1). La pallina gira…` })
      await ctx.dormi(1600)
      const numero = crypto.getRandomValues(new Uint8Array(1))[0] % 37
      const e = esitoRoulette(new Map([[id, n]]), numero)
      const netto = fine(ctx, 'roulette', e.puntato, e.torna)
      const col = numero === 0 ? 'verde' : ROSSI.has(numero) ? 'rosso' : 'nero'
      ctx.aggiorna(s, { colore: netto > 0 ? 'oro' : 'grigio', av: netto > 0 ? 'bot-ricco' : 'bot-triste', t: `:roulette: ${numero} ${col}`, d: `${ctx.fmt(n)} su ${p.nome}: ${netto > 0 ? 'vinta' : 'persa'}.`, pie: esitoHtml(ctx, netto) })
      zaino.daiXp(2)
    },
  },
  {
    nomi: ['blackjack', 'bj'], cat: 'giochi', icona: 'carte', breve: 'blackjack contro il banco: blackjack 25 (carta / stai / raddoppia)', uso: 'blackjack <puntata>',
    spiega: 'Una mano contro il banco, sei mazzi. Il banco sta a 17. Il blackjack paga 3 a 2. Da 5 a 1.000 $pzk.',
    async fai(ctx) {
      const n = puntata(ctx, 'blackjack', ctx.args[0], 5, 1000)
      if (n === null) return false
      const mazzo = sabot(6)
      let i = 0
      const pesca = () => mazzo[i++]
      const tu = [pesca(), pesca()], banco = [pesca(), pesca()]
      const carta = (c, coperta = false) => (coperta ? '<span class="c-carta coperta"></span>' : `<span class="c-carta${c.s === 'c' || c.s === 'q' ? ' rossa' : ''}">${c.r}<small>${{ c: '♥', q: '♦', f: '♣', p: '♠' }[c.s]}</small></span>`)
      const mano = (m, nascosta = false) => `<div class="c-carte">${m.map((c, k) => carta(c, nascosta && k === 1)).join('')}</div>`
      const vista = (nascosta, nota = '') => ({ colore: 'ambra', t: ':carte: blackjack', html: `<p>banco${nascosta ? '' : ` · ${punti(banco).tot}`}</p>${mano(banco, nascosta)}<p>${ctx.nome()} · ${punti(tu).tot}${punti(tu).morbido ? ' (morbido)' : ''}</p>${mano(tu)}${nota ? `<p>${nota}</p>` : ''}`, pie: `puntati ${ctx.fmt(n)}` })
      const s = ctx.dì(vista(true))
      let giocato = n, torna = 0, raddoppiato = false
      const bjTu = punti(tu).tot === 21, bjBanco = punti(banco).tot === 21
      if (!bjTu && !bjBanco) {
        for (;;) {
          const p = punti(tu)
          if (p.tot >= 21) break
          const prima = tu.length === 2 && !raddoppiato && ctx.pzk.saldo() >= n
          const r = await ctx.scegli(s, [{ id: 'carta', eti: 'carta' }, { id: 'stai', eti: 'stai', stile: 'nero' }, ...(prima ? [{ id: 'raddoppia', eti: 'raddoppia', stile: 'verde' }] : [])], 30000)
          if (r === null || r === 'stai') break
          if (r === 'raddoppia') { ctx.punta('chat-blackjack', n); giocato += n; raddoppiato = true; tu.push(pesca()); ctx.aggiorna(s, vista(true, 'raddoppiato: una carta e basta.')); break }
          tu.push(pesca())
          ctx.aggiorna(s, vista(true))
        }
      }
      const pt = punti(tu)
      if (pt.tot <= 21 && !bjTu) { while (punti(banco).tot < 17) { banco.push(pesca()); ctx.aggiorna(s, vista(false)); await ctx.dormi(500) } }
      const pb = punti(banco)
      let nota
      if (bjTu && !bjBanco) { torna = giocato * 2.5; nota = 'BLACKJACK! Paga 3 a 2.' }
      else if (bjTu && bjBanco) { torna = giocato; nota = 'blackjack tutti e due: pari.' }
      else if (bjBanco) { torna = 0; nota = 'il banco ha blackjack.' }
      else if (pt.tot > 21) { torna = 0; nota = `sballato con ${pt.tot}.` }
      else if (pb.tot > 21) { torna = giocato * 2; nota = `il banco sballa con ${pb.tot}: vinto.` }
      else if (pt.tot > pb.tot) { torna = giocato * 2; nota = `${pt.tot} contro ${pb.tot}: vinto.` }
      else if (pt.tot === pb.tot) { torna = giocato; nota = `${pt.tot} pari: la puntata torna.` }
      else { torna = 0; nota = `${pt.tot} contro ${pb.tot}: perso.` }
      const netto = fine(ctx, 'blackjack', giocato, torna)
      ctx.aggiorna(s, { ...vista(false, `<b>${nota}</b>`), colore: netto > 0 ? 'oro' : netto ? 'grigio' : 'blu', av: netto > 0 ? 'bot-ricco' : netto ? 'bot-triste' : 'bot-pensa', pie: esitoHtml(ctx, netto) })
      zaino.daiXp(3)
    },
  },
  {
    nomi: ['mine', 'mines', 'campo'], cat: 'giochi', icona: 'mina', breve: 'mine 50 3: griglia 5×5, scopri le gemme, incassa prima della mina', uso: 'mine <puntata> [mine 1-24]',
    spiega: 'Griglia 5×5 con le mine che scegli (3 se non lo dici). Ogni gemma alza il moltiplicatore; «incassa» quando vuoi. Una mina e perdi tutto. Da 1 a 1.000 $pzk.',
    async fai(ctx) {
      const m = Math.min(MINE.max, Math.max(MINE.min, parseInt(ctx.args[1]) || MINE.prima))
      const n = puntata(ctx, 'mine', ctx.args[0], LIMITI_MINE.min, LIMITI_MINE.max)
      if (n === null) return false
      const g = Partita.nuova({ puntata: n, m, semeGiocatore: nuovoSeme(8), giro: 1 })
      const s = ctx.dì({ colore: 'ambra', t: `:mina: mine · ${m} mine`, d: `clicca una casella. Moltiplicatore ${scriviMolt(g.centesimi)}, incassi ${ctx.fmt(g.vincita)}.`, pie: `puntati ${ctx.fmt(n)}` })
      const celle = Array.from({ length: 25 }, (_, i) => ({ id: String(i), eti: '', stile: 'nero', title: nomeCasella(i) }))
      let esitoFinale = null
      const grigliaP = ctx.scegli(s, celle, 0, { griglia: 'g5', onPremuto: (id, b, riga) => {
        const ev = g.scopri(Number(id))
        for (const e of ev) {
          if (e.t === 'gemma') { b.innerHTML = ctx.icona('gemma'); b.classList.add('aperta'); b.disabled = true; s.querySelector('.c-testo').innerHTML = ctx.conIcone(`gemme ${e.k} · moltiplicatore ${scriviMolt(e.centesimi)} · incassi <b>${ctx.fmt(e.vincita)}</b>`) }
          if (e.t === 'mina') { b.innerHTML = ctx.icona('mina'); b.classList.add('bum') }
          if (e.t === 'fine') { esitoFinale = e; for (const k of e.mine) { const bb = riga.querySelector(`[data-id="${k}"]`); if (bb && !bb.classList.contains('bum')) { bb.innerHTML = ctx.icona('mina'); bb.style.opacity = '.5' } } }
        }
        return esitoFinale ? 'fine' : 'continua'
      } })
      const incassaP = ctx.scegli(s, [{ id: 'incassa', eti: ':pzk: incassa', stile: 'verde' }], 0)
      await Promise.race([grigliaP, incassaP])
      if (!esitoFinale) { try { esitoFinale = g.incassa()[0] } catch { esitoFinale = { t: 'fine', esito: 'incassa', giocato: n, torna: n, k: 0, centesimi: 100, mine: g.mine() } } for (const b of s.querySelectorAll('button')) b.disabled = true }
      else for (const b of s.querySelectorAll('.c-bottoni button')) b.disabled = true
      const e = esitoFinale
      const netto = fine(ctx, 'mine', e.giocato, e.torna)
      ctx.scheda({ colore: e.esito === 'incassa' ? 'oro' : 'rosso', av: e.esito === 'incassa' ? 'bot-ricco' : 'bot-morto', t: e.esito === 'incassa' ? `:gemma: incassato ${scriviMolt(e.centesimi)}` : ':mina: BUM', d: e.esito === 'incassa' ? `${e.k} gemme: ${ctx.pzkHtml(e.torna)}.` : `le mine erano in ${e.mine.map(nomeCasella).join(', ')}.`, pie: esitoHtml(ctx, netto) })
      zaino.daiXp(3)
    },
  },
  {
    nomi: ['dado', 'sicbo'], cat: 'giochi', icona: 'dadi', breve: 'il sic bo (tre dadi, regole di Macao): dado 50 piccolo · grande, pari, dispari, totale 10, coppia 4, tripla 6, triple, 2 e 5, singolo 3', uso: 'dado <puntata> <puntata del tavolo>',
    async fai(ctx) {
      const R = REGOLE_DADO.macao, T = DADO.macao
      const [imp, ...resto] = ctx.args
      const cosa = resto.join(' ').toLowerCase().trim()
      let id = null, mm
      if (['piccolo', 'grande', 'pari', 'dispari', 'triple'].includes(cosa)) id = cosa
      else if ((mm = /^(?:totale )?(\d{1,2})$/.exec(cosa)) && +mm[1] >= 4 && +mm[1] <= 17) id = `totale:${+mm[1]}`
      else if ((mm = /^coppia (?:di )?([1-6])$/.exec(cosa))) id = `coppia:${mm[1]}`
      else if ((mm = /^tripla (?:di )?([1-6])$/.exec(cosa))) id = `tripla:${mm[1]}`
      else if ((mm = /^([1-6]) e ([1-6])$/.exec(cosa)) && mm[1] !== mm[2]) id = `combinazione:${Math.min(mm[1], mm[2])}-${Math.max(mm[1], mm[2])}`
      else if ((mm = /^(?:singolo|il) ([1-6])$/.exec(cosa))) id = `singolo:${mm[1]}`
      const p = id && T.get(id)
      if (!p) return ctx.dì({ colore: 'rosso', d: 'si scrive <code>dado 50 piccolo</code>: piccolo, grande, pari, dispari, totale 4-17, coppia 1-6, tripla 1-6, triple, «2 e 5», singolo 1-6.' })
      const n = puntata(ctx, 'dado', imp, 1, 1000)
      if (n === null) return false
      const s = ctx.dì({ colore: 'ambra', av: 'bot-pensa', t: ':dadi: sic bo', d: `${ctx.fmt(n)} su <b>${p.nome}</b> (paga ${Array.isArray(p.paga) ? p.paga.join('/') : p.paga} a 1). I dadi rotolano…` })
      await ctx.dormi(1300)
      const dadi = [d6(), d6(), d6()]
      const e = esitoDado(new Map([[id, n]]), dadi, R)
      const netto = fine(ctx, 'dado', e.puntato, e.torna)
      const l = leggiDadi(dadi)
      ctx.aggiorna(s, { colore: netto > 0 ? 'oro' : 'grigio', av: netto > 0 ? 'bot-ricco' : 'bot-triste', t: `:dadi: ${dadi.map((d) => DADO_ICONE[d]).join(' ')} = ${l.tot} (${l.nome})`, d: `${p.nome}: ${netto > 0 ? 'vinta' : 'persa'}.`, pie: esitoHtml(ctx, netto) })
      zaino.daiXp(2)
    },
  },
]
