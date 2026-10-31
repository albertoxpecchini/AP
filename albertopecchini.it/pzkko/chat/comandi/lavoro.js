// Il lavoro: «lavora lista», «lavora come <mestiere>», «lavora» (un turno: un minigioco a caso fra quelli del mestiere),
// «lavora licenziati». Un turno ogni 20 minuti (Dank Memer ne vuole uno all'ora: qui si gioca di passaggio). La paga
// cresce col numero di turni fatti (5 % a turno fino a +50 %); il minigioco sbagliato paga una briciola.
// I MESTIERI RISCHIOSI (26.10: rischio, galera, multa in testi.js): pagano tanto, ma a ogni turno si può essere presi. Prima
// di ogni turno il bot lo dice (la probabilità, le ore, la multa) e si può lasciar stare; presi = niente paga, la roba
// sequestrata, la galera e la multa (sul conto, che serve). Lo spazzino gioca al nastro (minigiochi.js) e il suo rischio
// cresce del 15 % per ogni chiavetta o wallet che si tiene; quelli si aprono col decifratore (dal 29.10 si compra nel
// pzkstore del cercapersone, 1.500 puliti; o «installa decifratore», che passa dallo stesso pzkstore).
// (31.10) TUTTO SULLA BANCA (giochi/chat-lavoro.mjs): 'chat.assumi', 'chat.licenzia', 'chat.turno' (apre il turno col suo
// minigioco, e poi lo chiude con la risposta), 'chat.nastro' (lo spazzino: i pezzi uno alla volta, tieni o butta). L'attesa, la paga, il dado della galera e
// la roba che resta in tasca li decide lei; qui si mostra il minigioco e si racconta com'è andata.
import * as zaino from '../zaino.js'
import { MESTIERI } from '../testi.js'
import { MINIGIOCHI } from '../minigiochi.js'
import * as pzk from '../../games/pzk.js'

// l'articolo giusto davanti al mestiere: lo spazzino, l'imbianchino, il rider
const il = (n) => (/^(s[^aeiou]|z|gn|ps|x|y)/i.test(n) ? 'lo' : /^[aeiou]/i.test(n) ? 'l’' : 'il')
const pc = (x) => `${Math.round(x * 100)} %`
const ora = (t) => new Date(t).toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' })

export const ATTESA_TURNO = 20 * 60
const mestiereDi = (s) => { s = (s ?? '').toLowerCase().trim(); return MESTIERI.find((m) => m.id === s || m.nome === s || m.nome.startsWith(s) || m.id.startsWith(s)) }

export const LAVORO = [
  {
    nomi: ['lavora', 'work', 'lavoro'], cat: 'lavoro', icona: 'rider', breve: 'un turno di lavoro: un minigioco, poi la paga. «lavora lista», «lavora come rider»', uso: 'lavora [lista | come <mestiere> | licenziati]',
    spiega: 'Prima scegli un mestiere («lavora lista», poi «lavora come barista»: ogni mestiere vuole un livello). Poi «lavora» fa un turno: un minigioco di pochi secondi, riuscito = paga intera, sbagliato = una briciola. Un turno ogni 20 minuti; la paga cresce del 5 % a turno (fino a +50 %). «lavora licenziati» per cambiare (si riparte da zero turni).',
    async fai(ctx) {
      const cosa = ctx.args[0]?.toLowerCase()
      if (cosa === 'lista' || cosa === 'mestieri') {
        const l = zaino.livello()
        return ctx.dì({ colore: 'blu', t: ':rider: i mestieri', html: `<table><tr><th></th><th>mestiere</th><th>livello</th><th>paga</th></tr>${MESTIERI.map((m) => `<tr><td>:${m.id}:</td><td>${m.nome}${m.rischio ? ` <b class="c-rischio">⚠ galera ${pc(m.rischio)}</b>` : ''}${zaino.mestiere() === m.id ? ' <b>(tu)</b>' : ''}</td><td>${m.liv > l ? `:lucchetto: ${m.liv}` : m.liv}</td><td class="pzk">${ctx.fmt(m.paga)}</td></tr>`).join('')}</table>`, pie: `sei al livello ${l}. «lavora come <nome>» per farti assumere` })
      }
      if (cosa === 'come' || cosa === 'assumi') {
        const m = mestiereDi(ctx.args.slice(1).join(' '))
        if (!m) return ctx.dì({ colore: 'rosso', d: 'quale? «lavora lista» li elenca.' })
        if (m.liv > zaino.livello()) return ctx.dì({ colore: 'ambra', av: 'bot-triste', t: `:${m.id}: ${m.nome}`, d: `serve il livello <b>${m.liv}</b>, sei al ${zaino.livello()}. Lavora, pesca, gioca: gli xp arrivano.` })
        if (zaino.mestiere() === m.id) return ctx.dì({ colore: 'ambra', d: `sei già ${m.nome}.` })
        if (m.rischio && !ctx.pzk.conto()) return ctx.dì({ colore: 'ambra', av: 'bot-pensa', t: `:${m.id}: ${m.nome}`, d: 'i lavori rischiosi si fanno col conto: la galera si sconta lì. Crealo nell’app account.' })
        const r = await ctx.fai('chat.assumi', { mestiere: m.id })
        if (!r.ok) return ctx.no(r, 'lavora')
        return ctx.dì({ av: m.rischio ? 'bot-pensa' : 'bot-ride', colore: m.rischio ? 'ambra' : undefined, t: `:${m.id}: assunto`, d: `da oggi fai ${il(m.nome)}${il(m.nome).endsWith('’') ? '' : ' '}<b>${m.nome}</b>: ${m.frase}. Paga ${ctx.pzkHtml(m.paga)} a turno.${m.rischio ? `
<b>⚠ è un lavoro rischioso</b>: a ogni turno ${pc(m.rischio)} di essere presi${m.gioco === 'nastro' ? ' (+15 % per ogni chiavetta o wallet che ti tieni)' : ''}, e sono <b>${m.galera} ore di galera</b> e ${ctx.pzkHtml(m.multa)} di multa.` : ''} Scrivi <code>lavora</code> per il primo.` })
      }
      if (cosa === 'licenziati' || cosa === 'dimettiti' || cosa === 'quit') {
        if (!zaino.mestiere()) return ctx.dì({ colore: 'grigio', d: 'non hai un lavoro da cui licenziarti.' })
        const r = await ctx.fai('chat.licenzia', {})
        if (!r.ok) return ctx.no(r, 'lavora')
        return ctx.dì({ colore: 'grigio', av: 'bot-occhiolino', t: 'licenziato', d: 'libero. «lavora lista» per il prossimo.' })
      }
      if (cosa) return ctx.dì({ colore: 'rosso', d: '«lavora», «lavora lista», «lavora come rider», «lavora licenziati».' })
      // il turno (i controlli di qui sono per dirlo bene: quelli che contano li rifà la banca)
      const m = MESTIERI.find((x) => x.id === zaino.mestiere())
      if (!m) return ctx.dì({ colore: 'ambra', av: 'bot-pensa', t: 'disoccupato', d: 'prima un mestiere: <code>lavora lista</code>, poi <code>lavora come rider</code>.' }) && false
      const manca = zaino.manca('turno')
      if (manca > 0) { const s = ctx.dì({ colore: 'ambra', av: 'bot-pensa', t: ':clessidra: turno finito', d: `il prossimo turno da ${m.nome} fra <b>${ctx.durata(manca)}</b>.` }); ctx.tempo(s, Math.min(manca, 60000)); return false }
      if (pzk.inGalera()) return ctx.dì({ colore: 'rosso', av: 'bot-triste', t: ':lucchettone: sei in galera', d: `niente lavoro fino alle <b>${ora(pzk.galera())}</b>. Si esce prima pagando la cauzione (3.000 $pzk puliti) nell’app rapina.` }) && false
      if (m.rischio && !ctx.pzk.conto()) return ctx.dì({ colore: 'ambra', d: 'i lavori rischiosi si fanno col conto: crealo nell’app account.' }) && false
      // l'avviso, sempre, prima di un turno rischioso: si può lasciar stare
      if (m.rischio) {
        const a = ctx.dì({ colore: 'rosso', av: 'bot-pensa', t: `⚠ ${m.nome}: turno rischioso`, d: `${pc(m.rischio)} di essere presi${m.gioco === 'nastro' ? ', +15 % per ogni chiavetta o wallet che ti tieni' : ''}. Se ti prendono: <b>${m.galera} ore di galera</b>, ${ctx.pzkHtml(m.multa)} di multa, niente paga.` })
        const v = await ctx.scegli(a, [{ id: 'si', eti: 'lavora lo stesso', stile: 'rosso' }, { id: 'no', eti: 'lascia stare', stile: 'nero' }], 15000)
        if (v !== 'si') return ctx.dì({ colore: 'grigio', d: 'saggio. il turno resta lì.' }) && false
      } else {
        const pronto = ctx.dì({ av: 'bot-occhiolino', t: `:${m.id}: turno da ${m.nome}`, d: `${m.frase}. Pronto?` })
        await ctx.inVista(pronto, 900)
      }
      // la banca apre il turno e sceglie il minigioco (il turno si conta adesso: chi non risponde aspetta lo stesso)
      const a = await ctx.fai('chat.turno', {})
      if (!a.ok) return ctx.no(a, 'lavora')
      const { gioco, prova } = a.esito
      // (il nastro chiede i pezzi alla banca uno alla volta e chiude il turno da sé; gli altri rispondono una volta)
      const r = gioco === 'nastro' ? await MINIGIOCHI.nastro(ctx, prova) : await ctx.fai('chat.turno', { risposta: await MINIGIOCHI[gioco](ctx, prova) })
      if (!r.ok) return ctx.no(r, 'lavora')
      const e = r.esito
      if (e.preso) {
        const multa = e.arresto?.multa ?? 0, fuori = e.arresto?.galera ?? pzk.galera()
        ctx.scheda({ colore: 'rosso', av: 'bot-triste', t: ':sirena: presi', d: `Ti hanno preso${e.sequestrati?.length ? ' con la roba in tasca (sequestrata)' : ''}: <b>${e.galera} ore di galera</b>${multa ? `, ${ctx.pzkHtml(multa)} di multa` : ''}, niente paga.`, pie: fuori ? `fuori alle ${ora(fuori)} · o la cauzione nell’app rapina` : 'senza conto la galera non si sconta' })
        return false
      }
      if (e.scottano) ctx.dì({ colore: 'ambra', av: 'bot-occhiolino', t: ':chiavetta: roba che scotta', d: `hai ${e.scottano === 1 ? 'una cosa cifrata' : `${e.scottano} cose cifrate`} nello zaino. Si aprono con l’app <b>decifratore</b>: ${zaino.installata('decifratore') ? 'ce l’hai, è nella home del cercapersone (pagina dei soldi).' : 'si compra nel <b>pzkstore</b> del cercapersone, una volta sola, 1.500 $pzk puliti (o scrivi <code>installa decifratore</code>), poi lo apri dalla home, pagina dei soldi.'}` })
      ctx.scheda({ colore: e.ok ? 'oro' : 'grigio', av: e.ok ? 'bot-ricco' : 'bot-triste', t: e.ok ? ':pzk: paga' : 'turno storto', d: `${e.nota} ${e.ok ? `Turno ${e.turni}${e.bonus ? ` (+${e.bonus} %)` : ''}: ${ctx.pzkHtml(e.n)}.` : `Il capo ti dà ${ctx.pzkHtml(e.n)} e uno sguardo.`}`, pie: `il prossimo turno fra ${ctx.durata(e.prossimo)}` })
      ctx.saleDiLivello(e.livello)
      return false
    },
  },
]
