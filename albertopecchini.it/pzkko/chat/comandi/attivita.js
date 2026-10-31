// Le attività: cerca, crimine, altobasso, posta, scava, pesca, caccia. Quelle col rischio possono far morire.
// (31.10) le fa la banca ('chat.cerca', 'chat.pesca'… in giochi/chat-attivita.mjs): lei sceglie i posti e i crimini, tira
// i pesci e le bestie, paga, rompe gli attrezzi e decide la morte. Le scelte col tempo (dove cerchi, il pesce raro che tira,
// la bestia che carica) sono prove: la banca le apre con la sua ora, qui si sceglie e la banca guarda scelta e tempo.
import { nomeDi } from '../testi.js'

const presa = (x) => (x.leggendario ? 'oro' : x.raro ? 'ambra' : x.schifo ? 'grigio' : 'verde')
/** La banca dice che manca l'attrezzo (o altro): lo si dice come prima. */
function no(ctx, r, cmd, perche = '') {
  if (r.serve) return ctx.dì({ colore: 'ambra', av: 'bot-pensa', t: `:${r.serve}: serve ${nomeDi(r.serve)}`, d: `${perche} Nel <code>negozio</code>: «compra ${r.serve}».` }) && false
  return ctx.no(r, cmd)
}
const crac = (ctx, id) => ctx.scheda({ colore: 'rosso', av: 'bot-triste', t: `:${id}: crac`, d: `${nomeDi(id)} si è rott${id === 'canna' || id === 'pala' || id === 'fionda' ? 'a' : 'o'}. Un’altra nel negozio.` })

export const ATTIVITA = [
  {
    nomi: ['cerca', 'search', 'fruga'], cat: 'attività', icona: 'zaino', breve: 'fruga in un posto di Mantova: $pzk, oggetti, o guai', uso: 'cerca', attesa: 30,
    async fai(ctx) {
      const a = await ctx.fai('chat.cerca', {})
      if (!a.ok) return no(ctx, a, 'cerca')
      const s = ctx.dì({ t: 'dove cerchi?', d: 'scegli un posto, hai 15 secondi.' })
      const ferma = ctx.tempo(s, 15000)
      const r = await ctx.scegli(s, a.esito.posti.map((nome, i) => ({ id: String(i), eti: nome, stile: 'nero' })), 15000)
      ferma()
      if (r === null) return ctx.aggiorna(s, { colore: 'grigio', av: 'bot-triste', d: 'sei rimasto lì a pensare. Niente.' })
      const [b] = await Promise.all([ctx.fai('chat.cerca', { scelta: Number(r) }), ctx.pensa(700)])
      if (!b.ok) return ctx.no(b, 'cerca')
      const e = b.esito
      if (e.tardi) return ctx.aggiorna(s, { colore: 'grigio', av: 'bot-triste', d: 'troppo tardi: il posto è chiuso.' })
      if (e.morte) { ctx.aggiorna(s, { colore: 'rosso', t: e.nome, d: 'brutta idea.' }); return ctx.morte(e.morte) }
      if (e.niente) return ctx.aggiorna(s, { colore: 'grigio', av: 'bot-occhiolino', t: e.nome, d: `trovi ${e.trova}.` })
      const extra = e.oggetto ? ` E anche :${e.oggetto.id}: ${e.oggetto.nome}.` : ''
      ctx.aggiorna(s, { t: e.nome, d: `trovi ${e.trova}: ${ctx.pzkHtml(e.n)}.${extra}`, pie: `+${ctx.fmt(e.n)} $pzk` })
      ctx.saleDiLivello(e.livello)
    },
  },
  {
    nomi: ['crimine', 'crime', 'reato'], cat: 'attività', icona: 'sirena', breve: 'un crimine: più rischio, più paga; se va male muori', uso: 'crimine', attesa: 45,
    async fai(ctx) {
      const a = await ctx.fai('chat.crimine', {})
      if (!a.ok) return no(ctx, a, 'crimine')
      const s = ctx.dì({ colore: 'rosso', av: 'bot-occhiolino', t: ':sirena: che crimine?', d: 'scegli, hai 15 secondi. Il rischio è quello che è.' })
      const ferma = ctx.tempo(s, 15000)
      const r = await ctx.scegli(s, a.esito.crimini.map((c, i) => ({ id: String(i), eti: `${c.nome} <small>(${Math.round(c.rischio * 100)} %)</small>`, stile: 'nero' })), 15000)
      ferma()
      if (r === null) return ctx.aggiorna(s, { colore: 'grigio', av: 'bot-triste', d: 'ci hai ripensato. Onesto, ma povero.' })
      const [b] = await Promise.all([ctx.fai('chat.crimine', { scelta: Number(r) }), ctx.pensa(900)])
      if (!b.ok) return ctx.no(b, 'crimine')
      const e = b.esito
      if (e.tardi) return ctx.aggiorna(s, { colore: 'grigio', av: 'bot-triste', d: 'troppo tardi: il colpo è sfumato.' })
      if (e.morte) { ctx.aggiorna(s, { colore: 'rosso', t: e.nome, d: 'è andata male.' }); return ctx.morte(e.morte) }
      const extra = e.oggetto ? ` Ti porti via anche :${e.oggetto.id}: ${e.oggetto.nome}.` : ''
      ctx.aggiorna(s, { colore: 'oro', av: 'bot-ricco', t: e.nome, d: `fatta franca: ${ctx.pzkHtml(e.n)}.${extra}`, pie: `+${ctx.fmt(e.n)} $pzk` })
      ctx.saleDiLivello(e.livello)
    },
  },
  {
    nomi: ['altobasso', 'hl', 'highlow'], cat: 'attività', icona: 'quiz', breve: 'un numero da 1 a 100 come indizio: il mio è più alto, più basso, o uguale?', uso: 'altobasso', attesa: 20,
    async fai(ctx) {
      const a = await ctx.fai('chat.altobasso', {})
      if (!a.ok) return no(ctx, a, 'altobasso')
      const s = ctx.dì({ colore: 'blu', t: 'alto o basso', d: `il mio numero va da 1 a 100. Indizio: <b>${a.esito.indizio}</b>. Il mio è…` })
      const ferma = ctx.tempo(s, 12000)
      const r = await ctx.scegli(s, [{ id: 'basso', eti: 'più basso', stile: 'nero' }, { id: 'uguale', eti: 'jackpot: uguale', stile: 'verde' }, { id: 'alto', eti: 'più alto', stile: 'nero' }], 12000)
      ferma()
      const b = await ctx.fai('chat.altobasso', { scelta: r })
      if (!b.ok) return ctx.no(b, 'altobasso')
      const e = b.esito
      if (r === null || e.tardi) return ctx.aggiorna(s, { colore: 'grigio', d: `era ${e.segreto}. Troppo lento.` })
      if (!e.ok) return ctx.aggiorna(s, { colore: 'grigio', av: 'bot-ride', t: `era ${e.segreto}`, d: `${e.indizio} → ${e.segreto}: ${e.giusto === 'uguale' ? 'uguale!' : `più ${e.giusto}`}. Niente.` })
      ctx.aggiorna(s, { colore: r === 'uguale' ? 'oro' : 'verde', av: 'bot-ride', t: `era ${e.segreto}`, d: `${r === 'uguale' ? 'JACKPOT, uguale! ' : ''}Giusto: ${ctx.pzkHtml(e.n)}.` })
      ctx.saleDiLivello(e.livello)
    },
  },
  {
    nomi: ['posta', 'postmemes', 'meme'], cat: 'attività', icona: 'telefono', breve: 'posta un meme (serve il telefono): i like diventano $pzk', uso: 'posta', attesa: 40,
    async fai(ctx) {
      if (!ctx.zaino.ha('telefono')) return no(ctx, { serve: 'telefono' }, 'posta', 'Senza telefono non si posta niente.')
      // (le piattaforme e i meme valgono quanto dice la banca: qui solo i nomi, nello stesso ordine)
      const PIATTAFORME = ['instagram', 'tiktok', 'reddit', 'linkedin', 'il gruppo whatsapp della classe']
      const MEMI = ['la chiocciola con gli occhiali', 'la nutria che paga il biglietto', 'il prof di analisi che piange', 'i tortelli di zucca visti da vicino', 'un video della saracinesca che cigola']
      const s = ctx.dì({ colore: 'blu', t: ':telefono: dove posti?' })
      const p = await ctx.scegli(s, PIATTAFORME.map((n, i) => ({ id: String(i), eti: n, stile: 'nero' })), 12000)
      if (p === null) return ctx.aggiorna(s, { colore: 'grigio', d: 'il telefono si è spento.' })
      ctx.aggiorna(s, { colore: 'blu', t: `:telefono: su ${PIATTAFORME[p]}: cosa posti?` })
      const m = await ctx.scegli(s, MEMI.map((n, i) => ({ id: String(i), eti: n, stile: 'nero' })), 12000)
      if (m === null) return ctx.aggiorna(s, { colore: 'grigio', d: 'il telefono si è spento.' })
      const [r] = await Promise.all([ctx.fai('chat.posta', { p: Number(p), m: Number(m) }), ctx.pensa(1200)])
      if (!r.ok) return no(ctx, r, 'posta', 'Senza telefono non si posta niente.')
      const { like, n, rotto } = r.esito
      if (rotto) return ctx.aggiorna(s, { colore: 'rosso', av: 'bot-triste', t: ':telefono: crac', d: 'ti cade il telefono nel Mincio. Un altro nel negozio.' })
      ctx.aggiorna(s, { colore: like > 1500 ? 'oro' : 'verde', av: like > 1500 ? 'bot-ricco' : 'bot-ride', t: `${like.toLocaleString('it-IT')} like`, d: `«${MEMI[m]}» su ${PIATTAFORME[p]}${like > 1500 ? ': è virale!' : '.'} ${ctx.pzkHtml(n)}.${like < 20 ? ' Il tuo pubblico sono tua mamma e il bot.' : ''}` })
      ctx.saleDiLivello(r.esito.livello)
    },
  },
  {
    nomi: ['scava', 'dig'], cat: 'attività', icona: 'pala', breve: 'scava (serve la pala): vermi, monete di Virgilio, anfore dei Gonzaga', uso: 'scava', attesa: 40,
    async fai(ctx) {
      const r = await ctx.fai('chat.scava', {})
      if (!r.ok) return no(ctx, r, 'scava', 'A mani nude non si scava.')
      const s = ctx.dì({ av: 'bot-pensa', t: ':pala: scavi…', d: ctx.caso(['dietro la saracinesca.', 'nell’aiuola di piazza Virgiliana.', 'sulla riva del Mincio.', 'nel cortile di unimore, di nascosto.', 'sotto il platano del parco.']) })
      await ctx.inVista(s, 1500)
      const x = r.esito.presa
      ctx.aggiorna(s, { colore: presa(x), av: x.schifo ? 'bot-triste' : 'bot-ride', t: `:${x.id}: ${x.nome}`, d: `${x.leggendario ? 'NON CI CREDO. ' : x.raro ? 'Raro! ' : ''}Nello zaino. ${x.vale > 5 ? `Vale ${ctx.fmt(x.vale)}: «vendi ${x.id}».` : 'Vale niente.'}` })
      ctx.saleDiLivello(r.esito.livello)
      if (r.esito.rotto) crac(ctx, 'pala')
    },
  },
  {
    nomi: ['pesca', 'fish', 'pescare'], cat: 'attività', icona: 'canna', breve: 'pesca nel Mincio (serve la canna): dall’alborella al siluro, e la carpa d’oro', uso: 'pesca', attesa: 40,
    async fai(ctx) {
      let r = await ctx.fai('chat.pesca', {})
      if (!r.ok) return no(ctx, r, 'pesca', 'Senza canna si guarda l’acqua e basta.')
      const { esca, prese } = r.esito
      const s = ctx.dì({ av: 'bot-pensa', t: ':canna: lanci la lenza…', d: `${ctx.caso(['nel lago di Mezzo.', 'sotto il ponte di San Giorgio.', 'nel Mincio, dove è più scuro.', 'nel Rio, fra le case.', 'dal pontile di Lunetta.'])}${esca ? ' Con :esca: l’esca: due prese.' : ''}` })
      await ctx.inVista(s, 1800)
      const riga = (x) => `:${x.id}: <b>${x.nome}</b>${x.leggendario ? '!!! Ne esce una ogni cento.' : x.raro ? ', raro!' : x.schifo ? '. Grazie Mincio.' : '.'} ${x.vale > 5 ? `Vale ${ctx.fmt(x.vale)}.` : ''}`
      const righe = prese.filter((x) => x.preso).map(riga)
      ctx.saleDiLivello(r.esito.livello)
      // il pesce raro tira: premi il pesce fra le quattro cose che sbucano, in 3,5 secondi (la banca guarda scelta e tempo)
      while (r.esito.prova) {
        const p = r.esito.prova
        ctx.aggiorna(s, { colore: 'ambra', av: 'bot-arrabbiato', t: ':canna: TIRA FORTE!', d: `qualcosa di grosso: <b>prendilo</b>, clicca il pesce quando sbuca!` })
        const ferma = ctx.tempo(s, 3500)
        const scelta = await ctx.scegli(s, p.scelte.map((id) => ({ id, eti: `:${id}:`, stile: 'nero quadro' })), 3500)
        ferma()
        r = await ctx.fai('chat.pesca', { scelta })
        if (!r.ok) return ctx.no(r, 'pesca')
        const x = prese.find((y) => y.id === p.id && !y.visto) ?? { id: p.id, nome: p.nome }
        x.visto = true
        if (r.esito.preso) { righe.push(riga(x)); ctx.saleDiLivello(r.esito.livello) }
        else righe.push(`:${x.id}: <b>${x.nome}</b> è scappat${x.id.endsWith('a') ? 'a' : 'o'}. ${scelta === null || r.esito.tardi ? 'Troppo lento.' : 'Hai preso la cosa sbagliata.'}`)
      }
      const meglio = prese.reduce((a, b) => (b.vale > a.vale ? b : a))
      ctx.aggiorna(s, { colore: presa(meglio), av: meglio.schifo ? 'bot-triste' : 'bot-ride', t: ':canna: nel retino', d: righe.join('\n'), pie: '«vendi tutto» li vende' })
      if (r.esito.rotto) crac(ctx, 'canna')
    },
  },
  {
    nomi: ['caccia', 'hunt', 'cacciare'], cat: 'attività', icona: 'fionda', breve: 'caccia (serve la fionda, o il fucile per le bestie grosse): nutrie, fagiani, cinghiali, il drago', uso: 'caccia', attesa: 40,
    async fai(ctx) {
      let r = await ctx.fai('chat.caccia', {})
      if (!r.ok) return no(ctx, r, 'caccia', 'Senza fionda le bestie ridono.')
      const arma = r.esito.arma
      const s = ctx.dì({ av: 'bot-pensa', t: `:${arma}: ti apposti…`, d: ctx.caso(['nel canneto del lago Superiore.', 'dietro i platani del Te.', 'sull’argine, controvento.', 'nel parco del Mincio, all’alba.', 'in piazza, fra i piccioni.']) })
      await ctx.inVista(s, 1800)
      if (r.esito.pericolo) {
        const DIR = ['sinistra', 'centro', 'destra']
        const x = r.esito.pericolo
        ctx.aggiorna(s, { colore: 'rosso', av: 'bot-arrabbiato', t: `:${x.id}: ${x.nome}!`, d: `${x.frase} Arriva da <b>${x.da.toUpperCase()}</b>: <b>schiva</b> dall’altra parte, hai 3 secondi!` })
        const ferma = ctx.tempo(s, 3000)
        const scelta = await ctx.scegli(s, DIR.map((d) => ({ id: d, eti: d, stile: 'nero' })), 3000)
        ferma()
        r = await ctx.fai('chat.caccia', { scelta })
        if (!r.ok) return ctx.no(r, 'caccia')
        if (r.esito.morte) { ctx.aggiorna(s, { colore: 'rosso', t: `:${x.id}: ${x.nome}`, d: scelta === null ? 'sei rimasto fermo.' : scelta === x.da ? 'ti sei buttato proprio dove arrivava.' : 'troppo tardi.' }); return ctx.morte(r.esito.morte) }
        ctx.aggiorna(s, { colore: 'ambra', av: 'bot-occhiolino', t: `:${x.id}: schivato`, d: `${x.nome} passa oltre… e tu spari.` })
        await ctx.dormi(900)
      }
      const x = r.esito.presa
      ctx.aggiorna(s, { colore: presa(x), av: x.schifo ? 'bot-triste' : 'bot-ride', t: `:${x.id}: ${x.nome}`, d: `${x.leggendario ? 'IL DRAGO. Nessuno ci crederà. ' : x.raro ? 'Raro! ' : ''}Nello zaino. ${x.vale > 5 ? `Vale ${ctx.fmt(x.vale)}: «vendi ${x.id}».` : 'Vale niente.'}` })
      ctx.saleDiLivello(r.esito.livello)
      if (r.esito.rotto) crac(ctx, arma)
    },
  },
]
