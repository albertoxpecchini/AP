// I soldi: aiuto, saldo, profilo, attese, i premi giornalieri, l'elemosina, la classifica, manda.
// (31.10) i premi e l'elemosina li dà la banca ('chat.premio', 'chat.elemosina': giochi/chat-soldi.mjs), con la serie e
// l'attesa contate con la sua ora; qui si chiede e si racconta.
import * as zaino from '../zaino.js'
import { conti } from '../../games/libro.mjs'
import { nomeDi } from '../testi.js'

const ORA = 3600_000, GIORNO = 24 * ORA
const PREMI = { giornaliero: { ogni: GIORNO, base: 300, nome: 'giornaliero', bonus: 50, max: 7 }, settimanale: { ogni: 7 * GIORNO, base: 1500, nome: 'settimanale', bonus: 200, max: 4 }, mensile: { ogni: 30 * GIORNO, base: 5000, nome: 'mensile', bonus: 500, max: 3 } }

function premio(id) {
  const P = PREMI[id]
  return {
    nomi: [id, ...(id === 'giornaliero' ? ['daily', 'giorno'] : id === 'settimanale' ? ['weekly', 'settimana'] : ['monthly', 'mese'])], cat: 'soldi', icona: 'regalo',
    breve: `il premio ${P.nome}: ${P.base} $pzk, di più se torni ogni volta`, uso: id, attesa: P.ogni / 1000,
    async fai(ctx) {
      // la serie continua se si torna entro due periodi (la conta la banca)
      const r = await ctx.fai('chat.premio', { quale: id })
      if (!r.ok) return ctx.no(r, id)
      const { n, tot, livello: liv } = r.esito
      ctx.dì({ colore: 'oro', av: 'bot-ricco', t: `:regalo: premio ${P.nome}`, d: `${ctx.pzkHtml(tot)} per te.${n > 1 ? ` Serie di <b>${n}</b> di fila${n >= P.max ? ' (il massimo)' : ''}: +${P.bonus * (n - 1)} di bonus.` : ' Torna fra un po’ per la serie: ogni volta di fila vale di più.'}`, pie: `il prossimo fra ${ctx.durata(P.ogni)}` })
      ctx.saleDiLivello(liv)
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
        // (4.11) il tasto per provarlo: se vuole qualcosa dopo («slot <puntata>») apre la tastiera già scritta fin lì
        return ctx.dì({ colore: 'blu', t: `${c.icona ? `:${c.icona}: ` : ''}${c.nomi[0]}`, d: c.spiega ?? c.breve, azioni: [[/</.test(c.uso ?? '') ? c.uso : c.nomi[0], `prova «${c.nomi[0]}»`, 'oro']], campi: [['come si scrive', `<code>${String(c.uso ?? c.nomi[0]).replace(/[&<>]/g, (x) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[x])}</code>`], /* (29.10 notte: «<mestiere>», «<app>» senza escape diventavano tag finti e sparivano) */ ...(c.nomi.length > 1 ? [['anche', c.nomi.slice(1).map((n) => `<code>${n}</code>`).join(' ')]] : []), ...(c.attesa ? [['attesa', ctx.durata(c.attesa * 1000)]] : [])] })
      }
      // (4.11, Alberto: «uno che non ha mai aperto il sito fa fatica»: prima diceva «le frecce in su ripetono gli ultimi», che
      // nello zero non è vero, ↑ scorre i messaggi; adesso i comandi per cominciare sono tasti)
      const PER_COMINCIARE = ['giornaliero', 'lavora', 'pesca', 'caccia', 'scava', 'quiz', 'negozio', 'zaino', 'sfide', 'classifica']
      ctx.dì({ colore: 'blu', t: 'i comandi', d: 'Premi un tasto, o scrivi un comando (anche <code>pzk pesca</code> o <code>/pesca</code>). <code>aiuto pesca</code> spiega un comando.',
        campi: ctx.categorie.map(([id, nome, ico]) => [`${ico} ${nome}`, ctx.comandi.filter((c) => c.cat === id && !c.nascosto).map((c) => `<code>${c.nomi[0]}</code>`).join(' '), true]),
        azioni: PER_COMINCIARE.map((n) => ctx.perNome.get(n)).filter(Boolean).map((c) => [c.nomi[0], `:${c.icona}: ${c.nomi[0]}`]) })
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
        campi: [['mestiere', m ? `:${m}: ${nomeDi(m)} (${zaino.stato().turni} turni)` : 'disoccupato («lavora lista»)'], ...(() => { const k = conti(ctx.pzk.conto()?.libro); return [['guadagnati in tutto', ctx.pzkHtml(k.guadagnati)], [k.giochi < 0 ? 'persi ai giochi' : 'vinti ai giochi', k.giochi < 0 ? `<span class="meno">${ctx.fmt(-k.giochi)} $pzk</span>` : ctx.pzkHtml(k.giochi)], ['lavoro e premi', ctx.pzkHtml(k.lavoro)]] })(), /* (29.10 notte: dal libro dei conti del server, games/libro.mjs, come le classifiche) */ ['pescati', s('pescati')], ['cacciati', s('cacciati')], ['scavati', s('scavati')], ['morti', `:teschio: ${s('morti')}`], ['comandi', s('comandi')]] })
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
      const [r] = await Promise.all([ctx.fai('chat.elemosina', {}), ctx.pensa(600)])
      if (!r.ok) return ctx.no(r, 'elemosina')
      const e = r.esito
      if (!e.si) return ctx.dì({ colore: 'grigio', av: 'bot-triste', t: e.nome, d: `«${e.frase}»` })
      const extra = e.oggetto ? `\nE ti lascia anche :${e.oggetto.id}: ${e.oggetto.nome}.` : ''
      ctx.dì({ t: e.nome, d: `${e.frase}${extra}`, pie: `+${ctx.fmt(e.tot)} $pzk` })
      ctx.saleDiLivello(e.livello)
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
