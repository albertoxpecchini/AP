// I soldi: aiuto, saldo, profilo, attese, i premi giornalieri, l'elemosina, la classifica, manda.
import * as zaino from '../zaino.js'
import { PERSONAGGI, nomeDi } from '../testi.js'
import { PREMI, serieDopo, valore } from '../premi.mjs'

// i premi (chat/premi.mjs): col conto li dà il server, che tiene la serie (27.10: l'attesa stava solo nello zaino, si
// perdeva, e il giornaliero si riscuoteva all'infinito); nella sessione si fanno qui. L'attesa la segna il premio stesso,
// dall'ultimo preso, e il caffè non la accorcia: il server non lo sa
function premio(id) {
  const P = PREMI[id]
  return {
    nomi: [id, ...(id === 'giornaliero' ? ['daily', 'giorno'] : id === 'settimanale' ? ['weekly', 'settimana'] : ['monthly', 'mese'])], cat: 'soldi', icona: 'regalo',
    breve: `il premio ${id}: ${P.base} $pzk, di più se torni ogni volta`, uso: id, attesa: P.ogni / 1000,
    async fai(ctx) {
      let n, tot
      if (ctx.pzk.conto()) {
        const [d] = await Promise.all([ctx.pzk.premio(id, zaino.moltiplicatore()), ctx.pensa(400)])
        // (la serie e l'attesa, nello zaino, sono la copia di quelle del conto: per i traguardi, il profilo e il cercapersone)
        const s = ctx.pzk.conto()?.premi?.[id]
        if (s) { zaino.segnaSerie(id, s.n, s.ultimo); zaino.aspettaFino(id, s.ultimo + P.ogni) }
        if (!d.ok) return ctx.dì({ colore: 'ambra', av: 'bot-pensa', t: `:regalo: premio ${id}`, d: d.errore ?? 'non è andata: riprova.' }) && false
        n = d.fatto.serie; tot = d.fatto.n
        zaino.conta('guadagnati', tot)
      } else {
        n = serieDopo(P, zaino.serie(id), Date.now())
        zaino.segnaSerie(id, n)
        zaino.aspettaFino(id, Date.now() + P.ogni)
        tot = ctx.paga(valore(P, n))
      }
      const liv = zaino.daiXp(P.xp)
      ctx.dì({ colore: 'oro', av: 'bot-ricco', t: `:regalo: premio ${id}`, d: `${ctx.pzkHtml(tot)} per te.${n > 1 ? ` Serie di <b>${n}</b> di fila${n >= P.max ? ' (il massimo)' : ''}: +${P.bonus * (n - 1)} di bonus.` : ' Torna fra un po’ per la serie: ogni volta di fila vale di più.'}`, pie: `il prossimo fra ${ctx.durata(P.ogni)}` })
      ctx.saleDiLivello(liv)
      return false // (l'attesa è segnata qui sopra)
    },
  }
}

export const SOLDI = [
  {
    nomi: ['aiuto', 'help', 'comandi', '?'], cat: 'soldi', icona: 'quiz', breve: 'l’elenco dei comandi; «aiuto pesca» spiega un comando', uso: 'aiuto [comando]', senzaEventi: true,
    async fai(ctx) {
      const quale = ctx.args[0]?.toLowerCase()
      if (quale) {
        const c = ctx.perNome.get(quale)
        if (!c) return ctx.dì({ colore: 'rosso', d: `«${quale}» non è un comando. Scrivi <code>aiuto</code> e basta.` })
        return ctx.dì({ colore: 'blu', t: `${c.icona ? `:${c.icona}: ` : ''}${c.nomi[0]}`, d: c.spiega ?? c.breve, campi: [['come si scrive', `<code>${c.uso ?? c.nomi[0]}</code>`], ...(c.nomi.length > 1 ? [['anche', c.nomi.slice(1).map((n) => `<code>${n}</code>`).join(' ')]] : []), ...(c.attesa ? [['attesa', ctx.durata(c.attesa * 1000)]] : [])] })
      }
      ctx.dì({ colore: 'blu', t: 'i comandi', d: 'Scrivi un comando e basta (anche <code>pzk pesca</code> o <code>/pesca</code>). <code>aiuto pesca</code> spiega un comando. Le frecce in su ripetono gli ultimi.',
        campi: ctx.categorie.map(([id, nome, ico]) => [`${ico} ${nome}`, ctx.comandi.filter((c) => c.cat === id && !c.nascosto).map((c) => `<code>${c.nomi[0]}</code>`).join(' '), true])})
    },
  },
  {
    nomi: ['saldo', 'bal', 'soldi', 'balance'], cat: 'soldi', icona: 'pzk', breve: 'i tuoi $pzk, gli EUR€, il livello', uso: 'saldo', senzaEventi: true,
    async fai(ctx) {
      const c = ctx.pzk.conto(), e = ctx.pzk.euro()
      ctx.dì({ t: `:pzk: ${c ? c.nome : 'la sessione'}`, campi: [['$pzk liberi', ctx.pzkHtml(ctx.pzk.saldo())], ['EUR€ nel wallet', c ? ctx.eurHtml(e) : '—'], ['livello', `:livello: ${zaino.livello()} (${zaino.xp()} xp)`], ['moltiplicatore', `×${zaino.moltiplicatore().toLocaleString('it-IT')}`]],
        pie: c ? `conto ${c.ind}` : 'sei nella sessione: 1.000 $pzk che non si salvano. Crea il conto nell’app account del cercapersone per tenerli.' })
    },
  },
  {
    nomi: ['profilo', 'livello', 'profile', 'xp'], cat: 'soldi', icona: 'livello', breve: 'xp, livello, mestiere, statistiche', uso: 'profilo', senzaEventi: true,
    async fai(ctx) {
      const l = zaino.livello(), xp = zaino.xp(), prossimo = zaino.xpPer(l + 1), m = zaino.mestiere()
      const s = (k) => zaino.stat(k)
      ctx.dì({ colore: 'blu', t: `:livello: ${ctx.pzk.conto() ? ctx.nome() + ', ' : ''}livello ${l}`, d: `${xp} xp, al livello ${l + 1} ne mancano ${prossimo - xp}.`,
        campi: [['mestiere', m ? `:${m}: ${nomeDi(m)} (${zaino.stato().turni} turni)` : 'disoccupato («lavora lista»)'], ['guadagnati', ctx.pzkHtml(s('guadagnati'))], ['vinti ai giochi', ctx.pzkHtml(s('vinti'))], ['persi ai giochi', `<span class="meno">${ctx.fmt(s('persi'))} $pzk</span>`], ['pescati', s('pescati')], ['cacciati', s('cacciati')], ['scavati', s('scavati')], ['morti', `:teschio: ${s('morti')}`], ['comandi', s('comandi')]] })
    },
  },
  {
    nomi: ['attese', 'cd', 'cooldown'], cat: 'soldi', icona: 'clessidra', breve: 'quanto manca per rifare i comandi', uso: 'attese', senzaEventi: true,
    async fai(ctx) {
      const a = zaino.attese()
      if (!a.length) return ctx.dì({ t: ':clessidra: niente attese', d: 'puoi fare tutto.' })
      ctx.dì({ colore: 'ambra', t: ':clessidra: le attese', campi: a.map(([k, t]) => [k, ctx.durata(t - Date.now())]), pie: zaino.effetto('caffe') ? 'il caffè le dimezza' : 'un :caffe: dal negozio le dimezza' })
    },
  },
  premio('giornaliero'), premio('settimanale'), premio('mensile'),
  {
    nomi: ['elemosina', 'beg', 'chiedi'], cat: 'soldi', icona: 'banconota', breve: 'chiedi a chi passa: 0–150 $pzk, o una risposta acida', uso: 'elemosina', attesa: 30,
    async fai(ctx) {
      const p = ctx.caso(PERSONAGGI)
      await ctx.pensa(600)
      if (Math.random() < 0.3) return ctx.dì({ colore: 'grigio', av: 'bot-triste', t: p.nome, d: `«${p.no}»` })
      const n = ctx.tra(5, 150)
      const tot = ctx.paga(n)
      let extra = ''
      if (p.oggetto && Math.random() < 0.15) { zaino.aggiungi(p.oggetto); extra = `\nE ti lascia anche :${p.oggetto}: ${nomeDi(p.oggetto)}.` }
      ctx.dì({ t: p.nome, d: `${p.si.replace('{n}', ctx.fmt(tot))}${extra}`, pie: `+${ctx.fmt(tot)} $pzk` })
      ctx.saleDiLivello(zaino.daiXp(4))
    },
  },
  // la classifica è in giocatori.js (usa il database dei giocatori)
  {
    nomi: ['manda', 'invia', 'dai', 'give', 'pay'], cat: 'soldi', icona: 'pzk', breve: 'manda $pzk a un conto: manda pzk123456 50', uso: 'manda <pzk123456> <quanti>', senzaEventi: true,
    async fai(ctx) {
      if (!ctx.pzk.conto()) return ctx.dì({ colore: 'ambra', d: 'per inviare serve un conto: crealo nell’app account.', pie: 'apro l’account' }) && ctx.apriWallet('entra')
      const ind = ctx.args[0], n = ctx.importo(ctx.args[1])
      if (!ind || !Number.isFinite(n)) return ctx.dì({ colore: 'rosso', d: 'si scrive <code>manda pzk123456 50</code>.' })
      await ctx.pensa(300)
      const r = await ctx.pzk.invia(ind, n)
      if (!r.ok) return ctx.dì({ colore: 'rosso', av: 'bot-triste', d: r.errore ?? 'non è andata.' })
      ctx.dì({ t: ':pzk: inviati', d: `${ctx.pzkHtml(r.fatto.n)} a <b>${r.fatto.nome}</b> (${r.fatto.a}).` })
    },
  },
]
