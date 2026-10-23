// Il saluto quando la chat si apre e gli eventi casuali che capitano ogni tanto dopo un comando (chat.js, esegui).
import * as zaino from '../zaino.js'
import { QUIZ } from '../testi.js'

export function salutoIniziale(ctx) {
  const pronto = zaino.manca('giornaliero') === 0
  ctx.dì({ av: 'bot-occhiolino', t: 'ciao, sono pzk', d: `la chiocciola della banca. Qui si parla a comandi: scrivi <code>aiuto</code> per vederli tutti.${pronto ? `\n:regalo: Hai il premio <code>giornaliero</code> da riscuotere.` : ''}${ctx.pzk.conto() ? '' : '\nSei nella sessione: i $pzk e lo zaino non si salvano. Entra nel wallet per tenerli.'}` })
}

const EVENTI = [
  // una banconota vola dalla finestra: scrivi PRENDILA in 5 secondi
  async (ctx) => {
    const parola = ctx.caso(['PRENDILA', 'ACCHIAPPA', 'MIA', 'SVELTO', 'AFFERRA'])
    const s = ctx.dì({ colore: 'oro', av: 'bot-occhiolino', t: ':banconota: una banconota vola dalla finestra!', d: `scrivi <b>${parola}</b> prima che se la porti il vento.` })
    const ferma = ctx.tempo(s, 5000)
    await ctx.inVista(s) // i secondi partono quando l'evento si legge, non quando nasce in coda
    const r = await ctx.scrivi(5000, { segnaposto: parola })
    ferma()
    if (r?.trim().toUpperCase() === parola) { const n = ctx.paga(ctx.tra(80, 400)); ctx.aggiorna(s, { colore: 'oro', av: 'bot-ride', t: ':banconota: presa!', d: `${ctx.pzkHtml(n)} in tasca.` }) }
    else ctx.aggiorna(s, { colore: 'grigio', av: 'bot-triste', t: ':banconota: volata via', d: r === null ? 'troppo lento.' : `dovevi scrivere ${parola}.` })
  },
  // quiz lampo
  async (ctx) => {
    const [dom, risp] = ctx.caso(QUIZ.filter((q) => q[2] === 1))
    const giusta = risp[0], mescolate = [...risp].sort(() => Math.random() - 0.5)
    const s = ctx.dì({ colore: 'blu', av: 'bot-pensa', t: ':quiz: quiz lampo', d: dom })
    const ferma = ctx.tempo(s, 8000)
    const r = await ctx.scegli(s, mescolate.map((x) => ({ id: x, eti: x, stile: 'nero' })), 8000)
    ferma()
    if (r === giusta) { const n = ctx.paga(ctx.tra(60, 200)); ctx.aggiorna(s, { colore: 'oro', av: 'bot-ride', t: ':quiz: giusto!', d: `${dom}\n<b>${giusta}</b>: ${ctx.pzkHtml(n)}.` }) }
    else ctx.aggiorna(s, { colore: 'grigio', av: 'bot-triste', t: ':quiz: no', d: `era <b>${giusta}</b>.` })
  },
  // il bot ti sfida a testa o croce (gratis)
  async (ctx) => {
    const s = ctx.dì({ colore: 'ambra', av: 'bot-occhiolino', t: ':testa: ti sfido', d: 'testa o croce, gratis: se indovini ti do qualcosa.' })
    const r = await ctx.scegli(s, [{ id: 'testa', eti: ':testa: testa' }, { id: 'croce', eti: ':croce: croce' }], 8000)
    if (!r) return ctx.aggiorna(s, { colore: 'grigio', av: 'bot-triste', d: 'niente? Peggio per te.' })
    const esce = Math.random() < 0.5 ? 'testa' : 'croce'
    if (r === esce) { const n = ctx.paga(ctx.tra(50, 150)); ctx.aggiorna(s, { colore: 'oro', av: 'bot-ride', t: `:${esce}: ${esce}!`, d: `indovinato: ${ctx.pzkHtml(n)}.` }) }
    else ctx.aggiorna(s, { colore: 'grigio', av: 'bot-ride', t: `:${esce}: ${esce}`, d: 'niente, ma non ti è costato niente.' })
  },
  // una nutria ti ruba qualcosa dallo zaino (se c'è)
  async (ctx) => {
    const roba = zaino.oggetti().filter(([id]) => !['cornetto'].includes(id))
    if (!roba.length) return
    const [id] = ctx.caso(roba)
    const s = ctx.dì({ colore: 'rosso', av: 'bot-arrabbiato', t: ':nutria: una nutria!', d: `ti sta rubando :${id}: dallo zaino. Scrivi <b>SCIÒ</b>!` })
    const ferma = ctx.tempo(s, 4000)
    await ctx.inVista(s)
    const r = await ctx.scrivi(4000, { segnaposto: 'SCIÒ' })
    ferma()
    if (r && /^sci[oò]!?$/i.test(r.trim())) ctx.aggiorna(s, { av: 'bot-ride', t: ':nutria: scappata', d: 'la nutria molla tutto e si tuffa nel Mincio.' })
    else { zaino.togli(id); ctx.aggiorna(s, { colore: 'rosso', av: 'bot-triste', t: ':nutria: fregato', d: `la nutria si è portata via :${id}: ${id}.` }) }
  },
]
export async function eventoCasuale(ctx) {
  await ctx.dormi(500)
  await ctx.caso(EVENTI)(ctx)
}
