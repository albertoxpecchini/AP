// Il lavoro: «lavora lista», «lavora come <mestiere>», «lavora» (un turno: un minigioco a caso fra quelli del mestiere),
// «lavora licenziati». Un turno ogni 20 minuti (Dank Memer ne vuole uno all'ora: qui si gioca di passaggio). La paga
// cresce col numero di turni fatti (5 % a turno fino a +50 %); il minigioco sbagliato paga una briciola.
import * as zaino from '../zaino.js'
import { MESTIERI } from '../testi.js'
import { MINIGIOCHI } from '../minigiochi.js'

export const ATTESA_TURNO = 20 * 60
const mestiereDi = (s) => { s = (s ?? '').toLowerCase().trim(); return MESTIERI.find((m) => m.id === s || m.nome === s || m.nome.startsWith(s) || m.id.startsWith(s)) }
const GIOCHI_TUTTI = ['riscrivi', 'anagramma', 'memoria', 'colori', 'icona', 'calcio', 'contrario', 'conti', 'ordine', 'strada', 'quiz']

export const LAVORO = [
  {
    nomi: ['lavora', 'work', 'lavoro'], cat: 'lavoro', icona: 'rider', breve: 'un turno di lavoro: un minigioco, poi la paga. «lavora lista», «lavora come rider»', uso: 'lavora [lista | come <mestiere> | licenziati]',
    spiega: 'Prima scegli un mestiere («lavora lista», poi «lavora come barista»: ogni mestiere vuole un livello). Poi «lavora» fa un turno: un minigioco di pochi secondi, riuscito = paga intera, sbagliato = una briciola. Un turno ogni 20 minuti; la paga cresce del 5 % a turno (fino a +50 %). «lavora licenziati» per cambiare (si riparte da zero turni).',
    async fai(ctx) {
      const cosa = ctx.args[0]?.toLowerCase()
      if (cosa === 'lista' || cosa === 'mestieri') {
        const l = zaino.livello()
        return ctx.dì({ colore: 'blu', t: ':rider: i mestieri', html: `<table><tr><th></th><th>mestiere</th><th>livello</th><th>paga</th></tr>${MESTIERI.map((m) => `<tr><td>:${m.id}:</td><td>${m.nome}${zaino.mestiere() === m.id ? ' <b>(tu)</b>' : ''}</td><td>${m.liv > l ? `:lucchetto: ${m.liv}` : m.liv}</td><td class="pzk">${ctx.fmt(m.paga)}</td></tr>`).join('')}</table>`, pie: `sei al livello ${l}. «lavora come <nome>» per farti assumere` })
      }
      if (cosa === 'come' || cosa === 'assumi') {
        const m = mestiereDi(ctx.args.slice(1).join(' '))
        if (!m) return ctx.dì({ colore: 'rosso', d: 'quale? «lavora lista» li elenca.' })
        if (m.liv > zaino.livello()) return ctx.dì({ colore: 'ambra', av: 'bot-triste', t: `:${m.id}: ${m.nome}`, d: `serve il livello <b>${m.liv}</b>, sei al ${zaino.livello()}. Lavora, pesca, gioca: gli xp arrivano.` })
        if (zaino.mestiere() === m.id) return ctx.dì({ colore: 'ambra', d: `sei già ${m.nome}.` })
        zaino.assumi(m.id)
        return ctx.dì({ av: 'bot-ride', t: `:${m.id}: assunto`, d: `da oggi fai il <b>${m.nome}</b>: ${m.frase}. Paga ${ctx.pzkHtml(m.paga)} a turno. Scrivi <code>lavora</code> per il primo.` })
      }
      if (cosa === 'licenziati' || cosa === 'dimettiti' || cosa === 'quit') {
        if (!zaino.mestiere()) return ctx.dì({ colore: 'grigio', d: 'non hai un lavoro da cui licenziarti.' })
        zaino.licenzia()
        return ctx.dì({ colore: 'grigio', av: 'bot-occhiolino', t: 'licenziato', d: 'libero. «lavora lista» per il prossimo.' })
      }
      if (cosa) return ctx.dì({ colore: 'rosso', d: '«lavora», «lavora lista», «lavora come rider», «lavora licenziati».' })
      // il turno
      const m = MESTIERI.find((x) => x.id === zaino.mestiere())
      if (!m) return ctx.dì({ colore: 'ambra', av: 'bot-pensa', t: 'disoccupato', d: 'prima un mestiere: <code>lavora lista</code>, poi <code>lavora come rider</code>.' }) && false
      const manca = zaino.manca('turno')
      if (manca > 0) { const s = ctx.dì({ colore: 'ambra', av: 'bot-pensa', t: ':clessidra: turno finito', d: `il prossimo turno da ${m.nome} fra <b>${ctx.durata(manca)}</b>.` }); ctx.tempo(s, Math.min(manca, 60000)); return false }
      const pronto = ctx.dì({ av: 'bot-occhiolino', t: `:${m.id}: turno da ${m.nome}`, d: `${m.frase}. Pronto?` })
      await ctx.inVista(pronto, 900)
      const gioco = Math.random() < 0.6 ? m.gioco : ctx.caso(GIOCHI_TUTTI)
      const r = await MINIGIOCHI[gioco](ctx)
      zaino.aspetta('turno', ATTESA_TURNO * 1000)
      zaino.turno()
      const turni = zaino.stato().turni
      const bonus = 1 + 0.05 * Math.min(10, turni - 1)
      const n = ctx.paga(r.ok ? Math.round(m.paga * bonus) : Math.round(m.paga * 0.1))
      const liv = zaino.daiXp(r.ok ? 12 : 4)
      ctx.scheda({ colore: r.ok ? 'oro' : 'grigio', av: r.ok ? 'bot-ricco' : 'bot-triste', t: r.ok ? ':pzk: paga' : 'turno storto', d: `${r.nota} ${r.ok ? `Turno ${turni}${turni > 1 ? ` (+${Math.round((bonus - 1) * 100)} %)` : ''}: ${ctx.pzkHtml(n)}.` : `Il capo ti dà ${ctx.pzkHtml(n)} e uno sguardo.`}`, pie: `il prossimo turno fra ${ctx.durata(zaino.manca('turno'))}` })
      ctx.saleDiLivello(liv)
      return false // l'attesa è quella del turno, segnata sopra
    },
  },
]
