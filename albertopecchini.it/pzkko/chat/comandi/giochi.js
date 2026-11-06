// I giochi via comando: veloce, slot, dadi, moneta (nati qui) e roulette, blackjack, mine, dado (le regole sono quelle dei
// giochi veri in games/*/regole.js: stessi pagamenti, stesso banco).
// DAL 31.10 LI GIOCA LA BANCA (Alberto: «il browser non decide più niente»): qui si legge cosa si vuole puntare, si chiede
// alla banca ('chat.slot', 'chat.roulette', 'chat.blackjack'… in C:\pzkko-server\banca\giochi\chat-giochi.mjs), che tira,
// paga e segna le attese, e si mostra quello che è uscito con le animazioni di prima. Le carte coperte, le mine e la parola
// del veloce stanno sulla banca finché non tocca vederle.
import { punti } from '../../games/blackjack/regole.js'
import { scriviMolt, nomeCasella, MINE, LIMITI as LIMITI_MINE } from '../../games/mine/regole.js'
import { aspetta } from '../minigiochi.js'

const DADO_ICONE = Array.from({ length: 7 }, (_, i) => `<span class="c-carta">${i}</span>`) // le facce come cartellini
const faccia = (n) => `<b class="pzk">${n}</b>`

/** Legge la puntata scritta: → l'importo, o null (ha già detto perché). Il saldo e i limiti veri li controlla la banca. */
function puntata(ctx, gioco, s, min, max) {
  const n = ctx.importo(s, Math.min(max, ctx.pzk.saldo()))
  if (!Number.isFinite(n)) { ctx.dì({ colore: 'rosso', d: `quanto punti? Es. <code>${gioco} 50</code> (anche 1k, metà, tutto).` }); return null }
  if (n < min || n > max) { ctx.dì({ colore: 'rosso', d: `si punta da ${ctx.fmt(min)} a ${ctx.fmt(max)} $pzk.` }); return null }
  return n
}
/** La banca ha detto di no a una puntata: a secco si ricarica (gli ospiti, il sussidio), se no il suo perché. → false */
function rifiutata(ctx, r, gioco) {
  if (ctx.pzk.aSecco()) {
    if (ctx.pzk.ricarica()) ctx.dì({ colore: 'ambra', av: 'bot-occhiolino', d: `eri a secco: ${ctx.pzkHtml(1000)} nuovi. Ripeti la puntata.` })
    else ctx.dì({ colore: 'ambra', d: ctx.pzk.perche() || 'sei a secco.' })
    return false
  }
  return ctx.no(r, gioco)
}
const esitoHtml = (ctx, netto) => (netto > 0 ? `<b>+${ctx.fmt(netto)}</b> $pzk` : netto < 0 ? `<span class="meno">−${ctx.fmt(-netto)}</span> $pzk` : 'pari')

// la roulette e il sic bo: quello che si scrive → la puntata della banca
const ROULETTE = { rosso: 'rosso', nero: 'nero', pari: 'pari', dispari: 'dispari', basso: 'basso', '1-18': 'basso', alto: 'alto', '19-36': 'alto' }
function suRoulette(cosa) {
  let m
  if (/^(\d|[12]\d|3[0-6])$/.test(cosa)) return `pieno:${Number(cosa)}`
  if ((m = /^dozzina ?([123])$/.exec(cosa))) return `dozzina:${m[1]}`
  if ((m = /^colonna ?([123])$/.exec(cosa))) return `colonna:${m[1]}`
  return ROULETTE[cosa] ?? null
}
function suDado(cosa) {
  let m
  if (['piccolo', 'grande', 'pari', 'dispari', 'triple'].includes(cosa)) return cosa
  if ((m = /^(?:totale )?(\d{1,2})$/.exec(cosa)) && +m[1] >= 4 && +m[1] <= 17) return `totale:${+m[1]}`
  if ((m = /^coppia (?:di )?([1-6])$/.exec(cosa))) return `coppia:${m[1]}`
  if ((m = /^tripla (?:di )?([1-6])$/.exec(cosa))) return `tripla:${m[1]}`
  if ((m = /^([1-6]) e ([1-6])$/.exec(cosa)) && m[1] !== m[2]) return `combinazione:${Math.min(m[1], m[2])}-${Math.max(m[1], m[2])}`
  if ((m = /^(?:singolo|il) ([1-6])$/.exec(cosa))) return `singolo:${m[1]}`
  return null
}

export const GIOCHI = [
  {
    nomi: ['veloce', 'fast', 'riflessi'], cat: 'giochi', icona: 'fulmine', breve: 'una parola compare all’improvviso: premila o riscrivila, paga in base al tempo', uso: 'veloce', attesa: 30,
    async fai(ctx) {
      const s = ctx.dì({ colore: 'blu', av: 'bot-pensa', t: 'pronti…', d: 'appena compare la parola, premila (o riscrivila).' })
      await ctx.inVista(s)
      // (31.10) la banca dice fra quanto compare, e la parola la dà solo passato quel tempo: il tempo lo conta lei
      const a = await ctx.fai('chat.veloce', {})
      if (!a.ok) return ctx.aggiorna(s, { colore: a.manca ? 'ambra' : 'grigio', av: 'bot-triste', t: a.manca ? ':clessidra: calma' : '', d: a.manca ? `«veloce» lo puoi rifare fra <b>${ctx.durata(a.manca)}</b>.` : a.errore ?? 'non è andata.' })
      // (6.11) l'attesa è un tempo vero (ctx.dormi con «riduci animazioni» dura 150 ms, e la banca diceva «non ancora»), e la
      // parola è testo della scheda e un tasto in fondo (era disegnata su una tela che nello zero non compare): si preme, o si riscrive
      await aspetta(a.esito.ritardo)
      const v = await ctx.fai('chat.veloce', { via: true })
      if (!v.ok) return ctx.aggiorna(s, { colore: 'grigio', av: 'bot-triste', d: v.errore ?? 'non è andata.' })
      ctx.aggiorna(s, { colore: 'ambra', av: 'bot-arrabbiato', t: 'VIA!', d: `<b>${v.esito.parola}</b>` })
      const ferma = ctx.tempo(s, 10000)
      const scritto = await ctx.scrivi(10000, { segnaposto: v.esito.parola })
      ferma()
      const r = await ctx.fai('chat.veloce', { risposta: scritto })
      if (!r.ok) return ctx.no(r, 'veloce')
      const e = r.esito
      if (!e.ok) return ctx.scheda({ colore: 'grigio', av: 'bot-triste', d: e.nota })
      ctx.scheda({ colore: 'oro', av: 'bot-ride', t: ':fulmine: ' + (e.tempo < 2000 ? 'fulmine' : e.tempo < 4000 ? 'svelto' : 'bradipo'), d: `${e.nota} ${ctx.pzkHtml(e.n)}.` })
      ctx.saleDiLivello(e.livello)
    },
  },
  {
    nomi: ['slot', 'slots'], cat: 'giochi', icona: 'sette', breve: 'tre rulli: slot 50. Tre chiocciole d’oro ×50', uso: 'slot <puntata>', attesa: 10,
    spiega: 'Tre rulli. Tre :chiocciola-oro: ×50, tre :sette: ×20, tre :diamante: ×12, tre :campana: ×8, tre uguali qualsiasi ×5, due uguali ×1,5. Da 1 a 500 $pzk.',
    async fai(ctx) {
      const n = puntata(ctx, 'slot', ctx.args[0], 1, 500)
      if (n === null) return false
      const r = await ctx.fai('chat.slot', { n })
      if (!r.ok) return rifiutata(ctx, r, 'slot')
      const { esce, molt, torna } = r.esito
      const s = ctx.dì({ colore: 'ambra', t: ':sette: slot', html: `<div class="c-rulli gira"><div>${ctx.icona('sette')}</div><div>${ctx.icona('sette')}</div><div>${ctx.icona('sette')}</div></div>`, pie: `puntati ${ctx.fmt(n)}` })
      const rulli = s.querySelectorAll('.c-rulli div')
      await ctx.inVista(s) // i rulli si fermano quando si vedono girare, non mentre la scheda si scrive
      for (let i = 0; i < 3; i++) { await ctx.dormi(700); rulli[i].innerHTML = ctx.icona(esce[i]); rulli[i].style.animation = 'none'; rulli[i].querySelector('.emo').style.animation = 'none' }
      s.querySelector('.c-rulli').classList.remove('gira')
      const a = esce[0], netto = torna - n
      ctx.aggiorna(s, { colore: molt >= 5 ? 'oro' : molt ? 'verde' : 'grigio', av: molt >= 5 ? 'bot-ricco' : molt ? 'bot-ride' : 'bot-triste', t: molt >= 5 ? `:${a}: :${a}: :${a}: JACKPOT ×${molt}` : molt ? 'due uguali' : 'niente', html: `<div class="c-rulli">${esce.map((x) => `<div>${ctx.icona(x)}</div>`).join('')}</div>`, pie: esitoHtml(ctx, netto) })
      ctx.saleDiLivello(r.esito.livello)
    },
  },
  {
    nomi: ['dadi', 'gamble', 'sfida'], cat: 'giochi', icona: 'dadi', breve: 'tu contro il bot, due dadi a testa: dadi 100', uso: 'dadi <puntata>', attesa: 10,
    async fai(ctx) {
      const n = puntata(ctx, 'dadi', ctx.args[0], 1, 1000)
      if (n === null) return false
      const r = await ctx.fai('chat.dadi', { n })
      if (!r.ok) return rifiutata(ctx, r, 'dadi')
      const { io, tu, torna } = r.esito
      const s = ctx.dì({ colore: 'ambra', av: 'bot-pensa', t: ':dadi: dadi', d: 'tiro io, poi tu…' })
      await ctx.inVista(s, 900)
      await ctx.dormi(600)
      const netto = torna - n
      ctx.aggiorna(s, { colore: netto > 0 ? 'oro' : netto ? 'rosso' : 'grigio', av: netto > 0 ? 'bot-triste' : netto ? 'bot-ride' : 'bot-pensa', t: `:dadi: ${netto > 0 ? 'hai vinto' : netto ? 'ho vinto io' : 'pari'}`, campi: [['pzk (il bot)', `${DADO_ICONE[io[0]]} ${DADO_ICONE[io[1]]} = ${faccia(io[0] + io[1])}`], [ctx.nome(), `${DADO_ICONE[tu[0]]} ${DADO_ICONE[tu[1]]} = ${faccia(tu[0] + tu[1])}`]], pie: esitoHtml(ctx, netto) })
      ctx.saleDiLivello(r.esito.livello)
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
      const r = await ctx.fai('chat.moneta', { n, lato: scelta })
      if (!r.ok) return rifiutata(ctx, r, 'moneta')
      const s = ctx.dì({ colore: 'ambra', av: 'bot-pensa', t: ':testa: la moneta gira…' })
      await ctx.inVista(s, 1100)
      const esce = r.esito.uscito, netto = r.esito.torna - n
      ctx.aggiorna(s, { colore: netto > 0 ? 'oro' : 'rosso', av: netto > 0 ? 'bot-ride' : 'bot-occhiolino', t: `:${esce}: ${esce}`, d: `avevi detto ${scelta}.`, pie: esitoHtml(ctx, netto) })
      ctx.saleDiLivello(r.esito.livello)
    },
  },
  {
    nomi: ['roulette', 'rl'], cat: 'giochi', icona: 'roulette', breve: 'roulette 50 rosso · nero, pari, dispari, basso, alto, dozzina 2, colonna 3, o un numero', uso: 'roulette <puntata> <rosso|nero|pari|dispari|basso|alto|dozzina 1-3|colonna 1-3|0-36>',
    async fai(ctx) {
      const [imp, ...resto] = ctx.args
      const su = suRoulette(resto.join(' ').toLowerCase().trim())
      if (!su) return ctx.dì({ colore: 'rosso', d: 'si scrive <code>roulette 50 rosso</code>: rosso, nero, pari, dispari, basso (1-18), alto (19-36), dozzina 1-3, colonna 1-3, o un numero da 0 a 36.' })
      const n = puntata(ctx, 'roulette', imp, 1, 1000)
      if (n === null) return false
      const r = await ctx.fai('chat.roulette', { n, su })
      if (!r.ok) return rifiutata(ctx, r, 'roulette')
      const { numero, colore, nome, paga, torna } = r.esito
      const s = ctx.dì({ colore: 'ambra', av: 'bot-pensa', t: ':roulette: rien ne va plus', d: `${ctx.fmt(n)} su <b>${nome}</b> (paga ${paga} a 1). La pallina gira…` })
      await ctx.inVista(s, 1600)
      const netto = torna - n
      ctx.aggiorna(s, { colore: netto > 0 ? 'oro' : 'grigio', av: netto > 0 ? 'bot-ricco' : 'bot-triste', t: `:roulette: ${numero} ${colore}`, d: `${ctx.fmt(n)} su ${nome}: ${netto > 0 ? 'vinta' : 'persa'}.`, pie: esitoHtml(ctx, netto) })
      ctx.saleDiLivello(r.esito.livello)
    },
  },
  {
    nomi: ['blackjack', 'bj'], cat: 'giochi', icona: 'carte', breve: 'blackjack contro il banco: blackjack 25 (carta / stai / raddoppia)', uso: 'blackjack <puntata>',
    spiega: 'Una mano contro il banco, sei mazzi. Il banco sta a 17. Il blackjack paga 3 a 2. Da 5 a 1.000 $pzk.',
    async fai(ctx) {
      const n = puntata(ctx, 'blackjack', ctx.args[0], 5, 1000)
      if (n === null) return false
      let r = await ctx.fai('chat.blackjack', { n })
      // (una mano rimasta aperta, una pagina ricaricata a metà: si riprende quella, la puntata è già sul tavolo della banca)
      let e = r.ok ? r.esito : r.aperta ? { ...ctx.pzk.tavoloBanca('chat-blackjack'), fine: false } : null
      if (!e) return rifiutata(ctx, r, 'blackjack')
      if (!r.ok) ctx.dì({ colore: 'ambra', av: 'bot-pensa', d: 'avevi una mano aperta: la finiamo.' })
      const carta = (c, coperta = false) => (coperta ? '<span class="c-carta coperta"></span>' : `<span class="c-carta${c.s === 'c' || c.s === 'q' ? ' rossa' : ''}">${c.r}<small>${{ c: '♥', q: '♦', f: '♣', p: '♠' }[c.s]}</small></span>`)
      const mano = (m, coperta = false) => `<div class="c-carte">${m.map((c) => carta(c)).join('')}${coperta ? carta(null, true) : ''}</div>`
      const vista = (e, nota = '') => ({ colore: 'ambra', t: ':carte: blackjack', html: `<p>banco${e.fine ? ` · ${punti(e.delBanco).tot}` : ''}</p>${mano(e.delBanco, !e.fine)}<p>${ctx.nome()} · ${punti(e.tu).tot}${punti(e.tu).morbido ? ' (morbido)' : ''}</p>${mano(e.tu)}${nota ? `<p>${nota}</p>` : ''}`, pie: `puntati ${ctx.fmt(e.giocato)}` })
      const s = ctx.dì(vista(e))
      let noRaddoppio = false
      while (!e.fine) {
        const prima = e.tu.length === 2 && !e.raddoppiato && !noRaddoppio
        const scelta = await ctx.scegli(s, [{ id: 'carta', eti: 'carta' }, { id: 'stai', eti: 'stai', stile: 'nero' }, ...(prima ? [{ id: 'raddoppia', eti: 'raddoppia', stile: 'verde' }] : [])], 30000)
        r = await ctx.fai('chat.blackjack', { mossa: scelta ?? 'stai' })
        if (!r.ok) {
          if (scelta === 'raddoppia') { noRaddoppio = true; ctx.aggiorna(s, vista(e, `niente raddoppio: ${r.errore ?? 'non bastano i soldi'}.`)); continue }
          return ctx.no(r, 'blackjack')
        }
        const prima2 = e
        e = r.esito
        if (!e.fine) ctx.aggiorna(s, vista(e))
        else if (scelta === 'raddoppia') { ctx.aggiorna(s, vista({ ...e, delBanco: prima2.delBanco, fine: false }, 'raddoppiato: una carta e basta.')); await ctx.dormi(500) }
      }
      // il banco scopre e tira, una carta alla volta
      for (let k = 2; k < e.delBanco.length; k++) { ctx.aggiorna(s, vista({ ...e, delBanco: e.delBanco.slice(0, k) })); await ctx.dormi(500) }
      const netto = e.torna - e.giocato
      ctx.aggiorna(s, { ...vista(e, `<b>${e.nota}</b>`), colore: netto > 0 ? 'oro' : netto ? 'grigio' : 'blu', av: netto > 0 ? 'bot-ricco' : netto ? 'bot-triste' : 'bot-pensa', pie: esitoHtml(ctx, netto) })
      ctx.saleDiLivello(e.livello)
    },
  },
  {
    nomi: ['mine', 'mines', 'campo'], cat: 'giochi', icona: 'mina', breve: 'mine 50 3: griglia 5×5, scopri le gemme, incassa prima della mina', uso: 'mine <puntata> [mine 1-24]',
    spiega: 'Griglia 5×5 con le mine che scegli (3 se non lo dici). Ogni gemma alza il moltiplicatore; «incassa» quando vuoi. Una mina e perdi tutto. Da 1 a 1.000 $pzk.',
    async fai(ctx) {
      const m = Math.min(MINE.max, Math.max(MINE.min, parseInt(ctx.args[1]) || MINE.prima))
      const n = puntata(ctx, 'mine', ctx.args[0], LIMITI_MINE.min, LIMITI_MINE.max)
      if (n === null) return false
      let r = await ctx.fai('chat.mine', { n, m })
      // (un campo rimasto aperto: si riprende quello)
      let e = r.ok ? r.esito : r.aperta ? (() => { const t = ctx.pzk.tavoloBanca('chat-mine'); return t ? { n: t.n, m: t.m, scoperte: t.scoperte ?? [], k: t.scoperte?.length ?? 0, fine: false } : null })() : null
      if (!e) return rifiutata(ctx, r, 'mine')
      const s = ctx.dì({ colore: 'ambra', t: `:mina: mine · ${e.m} mine`, d: `clicca una casella.${e.k ? ` gemme ${e.k}.` : ''}`, pie: `puntati ${ctx.fmt(e.n)}` })
      const celle = Array.from({ length: 25 }, (_, i) => ({ id: String(i), eti: e.scoperte.includes(i) ? ':gemma:' : '', stile: 'nero', title: nomeCasella(i) }))
      // ogni casella la scopre la banca: un clic alla volta (mentre una risposta viaggia, gli altri clic aspettano)
      let occupato = false, finito, riga = null
      const fine = new Promise((ok) => { finito = ok })
      const chiudi = (esito, b = null) => {
        if (b && esito.esito === 'mina') { b.innerHTML = ctx.icona('mina'); b.classList.add('bum') }
        for (const k of esito.mine ?? []) { const bb = riga?.querySelector(`[data-id="${k}"]`); if (bb && !bb.classList.contains('bum')) { bb.innerHTML = ctx.icona('mina'); bb.style.opacity = '.5' } }
        for (const bb of s.querySelectorAll('button')) bb.disabled = true
        finito(esito)
      }
      ctx.scegli(s, celle, 0, { griglia: 'g5', onPremuto: (id, b, rg) => {
        riga = rg
        if (occupato || b.disabled) return 'continua'
        occupato = true
        ctx.fai('chat.mine', { casella: Number(id) }).then((x) => {
          occupato = false
          if (!x.ok) return ctx.no(x, 'mine')
          const v = x.esito
          if (v.esito !== 'mina') { b.innerHTML = ctx.icona('gemma'); b.classList.add('aperta'); b.disabled = true; s.querySelector('.c-testo').innerHTML = ctx.conIcone(`gemme ${v.k} · moltiplicatore ${scriviMolt(v.centesimi)} · incassi <b>${ctx.fmt(v.vincita)}</b>`) }
          if (v.fine) chiudi(v, b)
        })
        return 'continua'
      } })
      ctx.scegli(s, [{ id: 'incassa', eti: ':pzk: incassa', stile: 'verde' }], 0).then(async (premuto) => {
        if (premuto !== 'incassa') return
        while (occupato) await ctx.dormi(80)
        const x = await ctx.fai('chat.mine', { incassa: true })
        if (x.ok) chiudi(x.esito); else ctx.no(x, 'mine')
      })
      const v = await fine
      const netto = v.torna - v.n
      ctx.scheda({ colore: v.esito === 'incassa' ? 'oro' : 'rosso', av: v.esito === 'incassa' ? 'bot-ricco' : 'bot-morto', t: v.esito === 'incassa' ? `:gemma: incassato ${scriviMolt(v.centesimi)}` : ':mina: BUM', d: v.esito === 'incassa' ? `${v.k} gemme: ${ctx.pzkHtml(v.torna)}.` : `le mine erano in ${v.mine.map(nomeCasella).join(', ')}.`, pie: esitoHtml(ctx, netto) })
      ctx.saleDiLivello(v.livello)
    },
  },
  {
    nomi: ['dado', 'sicbo'], cat: 'giochi', icona: 'dadi', breve: 'il sic bo (tre dadi, regole di Macao): dado 50 piccolo · grande, pari, dispari, totale 10, coppia 4, tripla 6, triple, 2 e 5, singolo 3', uso: 'dado <puntata> <puntata del tavolo>',
    async fai(ctx) {
      const [imp, ...resto] = ctx.args
      const su = suDado(resto.join(' ').toLowerCase().trim())
      if (!su) return ctx.dì({ colore: 'rosso', d: 'si scrive <code>dado 50 piccolo</code>: piccolo, grande, pari, dispari, totale 4-17, coppia 1-6, tripla 1-6, triple, «2 e 5», singolo 1-6.' })
      const n = puntata(ctx, 'dado', imp, 1, 1000)
      if (n === null) return false
      const r = await ctx.fai('chat.dado', { n, su })
      if (!r.ok) return rifiutata(ctx, r, 'dado')
      const { dadi, nome, paga, torna } = r.esito
      const s = ctx.dì({ colore: 'ambra', av: 'bot-pensa', t: ':dadi: sic bo', d: `${ctx.fmt(n)} su <b>${nome}</b> (paga ${Array.isArray(paga) ? paga.join('/') : paga} a 1). I dadi rotolano…` })
      await ctx.inVista(s, 1300)
      const netto = torna - n, tot = dadi[0] + dadi[1] + dadi[2], tripla = dadi[0] === dadi[1] && dadi[1] === dadi[2]
      ctx.aggiorna(s, { colore: netto > 0 ? 'oro' : 'grigio', av: netto > 0 ? 'bot-ricco' : 'bot-triste', t: `:dadi: ${dadi.map((d) => DADO_ICONE[d]).join(' ')} = ${tot} (${tripla ? `tripla di ${dadi[0]}` : tot <= 10 ? 'piccolo' : 'grande'})`, d: `${nome}: ${netto > 0 ? 'vinta' : 'persa'}.`, pie: esitoHtml(ctx, netto) })
      ctx.saleDiLivello(r.esito.livello)
    },
  },
]
