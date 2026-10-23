// Le attività: cerca, crimine, altobasso, posta, scava, pesca, caccia. Quelle col rischio possono far morire (chat.js, muori).
import * as zaino from '../zaino.js'
import { POSTI, CRIMINI, PESCI, ANIMALI, REPERTI, nomeDi } from '../testi.js'

/** Un'estrazione pesata da una lista con `peso`. */
const estrai = (lista) => { const tot = lista.reduce((a, x) => a + x.peso, 0); let r = Math.random() * tot; for (const x of lista) { r -= x.peso; if (r < 0) return x } return lista.at(-1) }
const serve = (ctx, id, perche) => { if (zaino.ha(id)) return true; ctx.dì({ colore: 'ambra', av: 'bot-pensa', t: `:${id}: serve ${nomeDi(id)}`, d: `${perche} Nel <code>negozio</code>: «compra ${id}».` }); return false }
const rompi = (ctx, id, p = 0.04) => { if (Math.random() < p) { zaino.togli(id); ctx.scheda({ colore: 'rosso', av: 'bot-triste', t: `:${id}: crac`, d: `${nomeDi(id)} si è rott${id === 'canna' || id === 'pala' || id === 'fionda' ? 'a' : 'o'}. Un’altra nel negozio.` }) } }
const presa = (x) => (x.leggendario ? 'oro' : x.raro ? 'ambra' : x.schifo ? 'grigio' : 'verde')

export const ATTIVITA = [
  {
    nomi: ['cerca', 'search', 'fruga'], cat: 'attività', icona: 'zaino', breve: 'fruga in un posto di Mantova: $pzk, oggetti, o guai', uso: 'cerca', attesa: 30,
    async fai(ctx) {
      const tre = [...POSTI].sort(() => Math.random() - 0.5).slice(0, 3)
      const s = ctx.dì({ t: 'dove cerchi?', d: 'scegli un posto, hai 15 secondi.' })
      const ferma = ctx.tempo(s, 15000)
      const r = await ctx.scegli(s, tre.map((p, i) => ({ id: String(i), eti: p.nome, stile: 'nero' })), 15000)
      ferma()
      if (r === null) return ctx.aggiorna(s, { colore: 'grigio', av: 'bot-triste', d: 'sei rimasto lì a pensare. Niente.' })
      const p = tre[r]
      await ctx.pensa(700)
      if (p.morte && Math.random() < 0.12) { ctx.aggiorna(s, { colore: 'rosso', t: p.nome, d: 'brutta idea.' }); return ctx.muori(p.morte) }
      if (p.a === 0) return ctx.aggiorna(s, { colore: 'grigio', av: 'bot-occhiolino', t: p.nome, d: `trovi ${p.trova}.` })
      const n = ctx.paga(ctx.tra(p.da, p.a))
      let extra = ''
      if (p.oggetto && Math.random() < 0.25) { zaino.aggiungi(p.oggetto); extra = ` E anche :${p.oggetto}: ${nomeDi(p.oggetto)}.` }
      ctx.aggiorna(s, { t: p.nome, d: `trovi ${p.trova}: ${ctx.pzkHtml(n)}.${extra}`, pie: `+${ctx.fmt(n)} $pzk` })
      ctx.saleDiLivello(zaino.daiXp(5))
    },
  },
  {
    nomi: ['crimine', 'crime', 'reato'], cat: 'attività', icona: 'sirena', breve: 'un crimine: più rischio, più paga; se va male muori', uso: 'crimine', attesa: 45,
    async fai(ctx) {
      const tre = [...CRIMINI].sort(() => Math.random() - 0.5).slice(0, 3)
      const s = ctx.dì({ colore: 'rosso', av: 'bot-occhiolino', t: ':sirena: che crimine?', d: 'scegli, hai 15 secondi. Il rischio è quello che è.' })
      const ferma = ctx.tempo(s, 15000)
      const r = await ctx.scegli(s, tre.map((c, i) => ({ id: String(i), eti: `${c.nome} <small>(${Math.round(c.rischio * 100)} %)</small>`, stile: 'nero' })), 15000)
      ferma()
      if (r === null) return ctx.aggiorna(s, { colore: 'grigio', av: 'bot-triste', d: 'ci hai ripensato. Onesto, ma povero.' })
      const c = tre[r]
      await ctx.pensa(900)
      if (Math.random() < c.rischio) { ctx.aggiorna(s, { colore: 'rosso', t: c.nome, d: 'è andata male.' }); return ctx.muori(c.morte) }
      const n = ctx.paga(ctx.tra(c.da, c.a))
      let extra = ''
      if (c.oggetto && Math.random() < 0.3) { zaino.aggiungi(c.oggetto); extra = ` Ti porti via anche :${c.oggetto}: ${nomeDi(c.oggetto)}.` }
      ctx.aggiorna(s, { colore: 'oro', av: 'bot-ricco', t: c.nome, d: `fatta franca: ${ctx.pzkHtml(n)}.${extra}`, pie: `+${ctx.fmt(n)} $pzk` })
      zaino.conta('crimini')
      ctx.saleDiLivello(zaino.daiXp(8))
    },
  },
  {
    nomi: ['altobasso', 'hl', 'highlow'], cat: 'attività', icona: 'quiz', breve: 'un numero da 1 a 100 come indizio: il mio è più alto, più basso, o uguale?', uso: 'altobasso', attesa: 20,
    async fai(ctx) {
      const segreto = ctx.tra(1, 100), indizio = ctx.tra(1, 100)
      const s = ctx.dì({ colore: 'blu', t: 'alto o basso', d: `il mio numero va da 1 a 100. Indizio: <b>${indizio}</b>. Il mio è…` })
      const ferma = ctx.tempo(s, 12000)
      const r = await ctx.scegli(s, [{ id: 'basso', eti: 'più basso', stile: 'nero' }, { id: 'uguale', eti: 'jackpot: uguale', stile: 'verde' }, { id: 'alto', eti: 'più alto', stile: 'nero' }], 12000)
      ferma()
      if (r === null) return ctx.aggiorna(s, { colore: 'grigio', d: `era ${segreto}. Troppo lento.` })
      const giusto = segreto === indizio ? 'uguale' : segreto > indizio ? 'alto' : 'basso'
      if (r !== giusto) return ctx.aggiorna(s, { colore: 'grigio', av: 'bot-ride', t: `era ${segreto}`, d: `${indizio} → ${segreto}: ${giusto === 'uguale' ? 'uguale!' : `più ${giusto}`}. Niente.` })
      const n = ctx.paga(r === 'uguale' ? 2500 : ctx.tra(50, 220))
      ctx.aggiorna(s, { colore: r === 'uguale' ? 'oro' : 'verde', av: 'bot-ride', t: `era ${segreto}`, d: `${r === 'uguale' ? 'JACKPOT, uguale! ' : ''}Giusto: ${ctx.pzkHtml(n)}.` })
      ctx.saleDiLivello(zaino.daiXp(5))
    },
  },
  {
    nomi: ['posta', 'postmemes', 'meme'], cat: 'attività', icona: 'telefono', breve: 'posta un meme (serve il telefono): i like diventano $pzk', uso: 'posta', attesa: 40,
    async fai(ctx) {
      if (!serve(ctx, 'telefono', 'Senza telefono non si posta niente.')) return false
      const PIATTAFORME = [['instagram', 1.2], ['tiktok', 1.5], ['reddit', 0.9], ['linkedin', 0.4], ['il gruppo whatsapp della classe', 0.7]]
      const MEMI = [['la chiocciola con gli occhiali', 1.3], ['la nutria che paga il biglietto', 1.1], ['il prof di analisi che piange', 1.0], ['i tortelli di zucca visti da vicino', 0.8], ['un video della saracinesca che cigola', 0.6]]
      const s = ctx.dì({ colore: 'blu', t: ':telefono: dove posti?' })
      const p = await ctx.scegli(s, PIATTAFORME.map(([n], i) => ({ id: String(i), eti: n, stile: 'nero' })), 12000)
      if (p === null) return ctx.aggiorna(s, { colore: 'grigio', d: 'il telefono si è spento.' })
      ctx.aggiorna(s, { colore: 'blu', t: `:telefono: su ${PIATTAFORME[p][0]}: cosa posti?` })
      const m = await ctx.scegli(s, MEMI.map(([n], i) => ({ id: String(i), eti: n, stile: 'nero' })), 12000)
      if (m === null) return ctx.aggiorna(s, { colore: 'grigio', d: 'il telefono si è spento.' })
      await ctx.pensa(1200)
      if (Math.random() < 0.05) { zaino.togli('telefono'); return ctx.aggiorna(s, { colore: 'rosso', av: 'bot-triste', t: ':telefono: crac', d: 'ti cade il telefono nel Mincio. Un altro nel negozio.' }) }
      const like = Math.round(ctx.tra(3, 400) * PIATTAFORME[p][1] * MEMI[m][1] * (Math.random() < 0.08 ? 12 : 1))
      const n = ctx.paga(Math.round(like * 0.6))
      ctx.aggiorna(s, { colore: like > 1500 ? 'oro' : 'verde', av: like > 1500 ? 'bot-ricco' : 'bot-ride', t: `${like.toLocaleString('it-IT')} like`, d: `«${MEMI[m][0]}» su ${PIATTAFORME[p][0]}${like > 1500 ? ': è virale!' : '.'} ${ctx.pzkHtml(n)}.${like < 20 ? ' Il tuo pubblico sono tua mamma e il bot.' : ''}` })
      ctx.saleDiLivello(zaino.daiXp(6))
    },
  },
  {
    nomi: ['scava', 'dig'], cat: 'attività', icona: 'pala', breve: 'scava (serve la pala): vermi, monete di Virgilio, anfore dei Gonzaga', uso: 'scava', attesa: 40,
    async fai(ctx) {
      if (!serve(ctx, 'pala', 'A mani nude non si scava.')) return false
      const s = ctx.dì({ av: 'bot-pensa', t: ':pala: scavi…', d: ctx.caso(['dietro la saracinesca.', 'nell’aiuola di piazza Virgiliana.', 'sulla riva del Mincio.', 'nel cortile di unimore, di nascosto.', 'sotto il platano del parco.']) })
      await ctx.inVista(s, 1500)
      const x = estrai(REPERTI)
      zaino.aggiungi(x.id)
      zaino.conta('scavati')
      ctx.aggiorna(s, { colore: presa(x), av: x.schifo ? 'bot-triste' : 'bot-ride', t: `:${x.id}: ${x.nome}`, d: `${x.leggendario ? 'NON CI CREDO. ' : x.raro ? 'Raro! ' : ''}Nello zaino. ${x.vale > 5 ? `Vale ${ctx.fmt(x.vale)}: «vendi ${x.id}».` : 'Vale niente.'}` })
      ctx.saleDiLivello(zaino.daiXp(x.leggendario ? 40 : x.raro ? 15 : 6))
      rompi(ctx, 'pala')
    },
  },
  {
    nomi: ['pesca', 'fish', 'pescare'], cat: 'attività', icona: 'canna', breve: 'pesca nel Mincio (serve la canna): dall’alborella al siluro, e la carpa d’oro', uso: 'pesca', attesa: 40,
    async fai(ctx) {
      if (!serve(ctx, 'canna', 'Senza canna si guarda l’acqua e basta.')) return false
      const esca = zaino.togli('esca')
      const s = ctx.dì({ av: 'bot-pensa', t: ':canna: lanci la lenza…', d: `${ctx.caso(['nel lago di Mezzo.', 'sotto il ponte di San Giorgio.', 'nel Mincio, dove è più scuro.', 'nel Rio, fra le case.', 'dal pontile di Lunetta.'])}${esca ? ' Con :esca: l’esca: due prese.' : ''}` })
      await ctx.inVista(s, 1800)
      const prese = esca ? [estrai(PESCI), estrai(PESCI)] : [estrai(PESCI)]
      const righe = []
      for (const x of prese) {
        if (x.raro) {
          // il pesce raro tira: premi il pesce fra le quattro cose che sbucano, in 3,5 secondi
          ctx.aggiorna(s, { colore: 'ambra', av: 'bot-arrabbiato', t: ':canna: TIRA FORTE!', d: `qualcosa di grosso: <b>prendilo</b>, clicca il pesce quando sbuca!` })
          const altri = [...PESCI.filter((p) => p.schifo), ...PESCI.filter((p) => !p.raro && !p.schifo)].sort(() => Math.random() - 0.5).slice(0, 3)
          const scelte = [x, ...altri].sort(() => Math.random() - 0.5)
          const ferma = ctx.tempo(s, 3500)
          const r = await ctx.scegli(s, scelte.map((p) => ({ id: p.id, eti: `:${p.id}:`, stile: 'nero quadro' })), 3500)
          ferma()
          if (r !== x.id) { righe.push(`:${x.id}: <b>${x.nome}</b> è scappat${x.id.endsWith('a') ? 'a' : 'o'}. ${r === null ? 'Troppo lento.' : 'Hai preso la cosa sbagliata.'}`); continue }
        }
        zaino.aggiungi(x.id)
        zaino.conta('pescati')
        righe.push(`:${x.id}: <b>${x.nome}</b>${x.leggendario ? '!!! Ne esce una ogni cento.' : x.raro ? ', raro!' : x.schifo ? '. Grazie Mincio.' : '.'} ${x.vale > 5 ? `Vale ${ctx.fmt(x.vale)}.` : ''}`)
        ctx.saleDiLivello(zaino.daiXp(x.leggendario ? 50 : x.raro ? 15 : 6))
      }
      const meglio = prese.reduce((a, b) => (b.vale > a.vale ? b : a))
      ctx.aggiorna(s, { colore: presa(meglio), av: meglio.schifo ? 'bot-triste' : 'bot-ride', t: ':canna: nel retino', d: righe.join('\n'), pie: '«vendi tutto» li vende' })
      rompi(ctx, 'canna')
    },
  },
  {
    nomi: ['caccia', 'hunt', 'cacciare'], cat: 'attività', icona: 'fionda', breve: 'caccia (serve la fionda, o il fucile per le bestie grosse): nutrie, fagiani, cinghiali, il drago', uso: 'caccia', attesa: 40,
    async fai(ctx) {
      const fucile = zaino.ha('fucile')
      if (!fucile && !serve(ctx, 'fionda', 'Senza fionda le bestie ridono.')) return false
      const arma = fucile ? 'fucile' : 'fionda'
      const lista = fucile ? ANIMALI : ANIMALI.filter((a) => !a.raro && !a.pericoloso)
      const s = ctx.dì({ av: 'bot-pensa', t: `:${arma}: ti apposti…`, d: ctx.caso(['nel canneto del lago Superiore.', 'dietro i platani del Te.', 'sull’argine, controvento.', 'nel parco del Mincio, all’alba.', 'in piazza, fra i piccioni.']) })
      await ctx.inVista(s, 1800)
      const x = estrai(lista)
      if (x.pericoloso) {
        const DIR = ['sinistra', 'centro', 'destra']
        const da = ctx.caso(DIR)
        ctx.aggiorna(s, { colore: 'rosso', av: 'bot-arrabbiato', t: `:${x.id}: ${x.nome}!`, d: `${x.pericoloso} Arriva da <b>${da.toUpperCase()}</b>: <b>schiva</b> dall’altra parte, hai 3 secondi!` })
        const ferma = ctx.tempo(s, 3000)
        const r = await ctx.scegli(s, DIR.map((d) => ({ id: d, eti: d, stile: 'nero' })), 3000)
        ferma()
        if (r === null || r === da) { ctx.aggiorna(s, { colore: 'rosso', t: `:${x.id}: ${x.nome}`, d: r === null ? 'sei rimasto fermo.' : 'ti sei buttato proprio dove arrivava.' }); return ctx.muori(x.pericoloso) }
        ctx.aggiorna(s, { colore: 'ambra', av: 'bot-occhiolino', t: `:${x.id}: schivato`, d: `${x.nome} passa oltre… e tu spari.` })
        await ctx.dormi(900)
      }
      zaino.aggiungi(x.id)
      zaino.conta('cacciati')
      ctx.aggiorna(s, { colore: presa(x), av: x.schifo ? 'bot-triste' : 'bot-ride', t: `:${x.id}: ${x.nome}`, d: `${x.leggendario ? 'IL DRAGO. Nessuno ci crederà. ' : x.raro ? 'Raro! ' : ''}Nello zaino. ${x.vale > 5 ? `Vale ${ctx.fmt(x.vale)}: «vendi ${x.id}».` : 'Vale niente.'}` })
      ctx.saleDiLivello(zaino.daiXp(x.leggendario ? 60 : x.raro ? 15 : 6))
      rompi(ctx, arma, fucile ? 0.02 : 0.05)
    },
  },
]
