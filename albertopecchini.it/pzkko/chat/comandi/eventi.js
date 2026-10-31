// Il saluto quando la chat si apre e gli eventi casuali che capitano ogni tanto dopo un comando (chat.js, esegui).
// (31.10) GLI EVENTI LI TIRA LA BANCA (giochi/chat-eventi.mjs): il 7 % lo tira dentro l'azione del comando e lo dice
// nell'esito (evento: { tipo }); qui si apre ('chat.evento' senza risposta: da lì parte il tempo, e arrivano la parola, la
// domanda o la cosa che la nutria si porta via), si mostra e si risponde. Paga la banca, e la nutria ruba davvero: la cosa
// torna solo con SCIÒ scritto in tempo.
import * as zaino from '../zaino.js'

export function salutoIniziale(ctx) {
  const pronto = zaino.manca('giornaliero') === 0
  ctx.dì({ av: 'bot-occhiolino', t: 'ciao, sono pzk', d: `la chiocciola della banca. Qui si parla a comandi: scrivi <code>aiuto</code> per vederli tutti.${pronto ? `\n:regalo: Hai il premio <code>giornaliero</code> da riscuotere.` : ''}${ctx.pzk.conto() ? '' : '\nSei nella sessione: i $pzk e lo zaino non si salvano. Entra nel wallet per tenerli.'}` })
}

const EVENTI = {
  // una banconota vola dalla finestra: scrivi PRENDILA in 5 secondi
  async banconota(ctx, v) {
    const s = ctx.dì({ colore: 'oro', av: 'bot-occhiolino', t: ':banconota: una banconota vola dalla finestra!', d: `scrivi <b>${v.parola}</b> prima che se la porti il vento.` })
    const ferma = ctx.tempo(s, v.ms)
    await ctx.inVista(s)
    const r = await ctx.scrivi(v.ms, { segnaposto: v.parola })
    ferma()
    const e = await risposta(ctx, r)
    if (e?.ok) ctx.aggiorna(s, { colore: 'oro', av: 'bot-ride', t: ':banconota: presa!', d: `${ctx.pzkHtml(e.n)} in tasca.` })
    else ctx.aggiorna(s, { colore: 'grigio', av: 'bot-triste', t: ':banconota: volata via', d: r === null || r.trim().toUpperCase() === v.parola ? 'troppo lento.' : `dovevi scrivere ${v.parola}.` })
  },
  // quiz lampo
  async quiz(ctx, v) {
    const s = ctx.dì({ colore: 'blu', av: 'bot-pensa', t: ':quiz: quiz lampo', d: v.domanda })
    const ferma = ctx.tempo(s, v.ms)
    const r = await ctx.scegli(s, v.risposte.map((x) => ({ id: x, eti: x, stile: 'nero' })), v.ms)
    ferma()
    const e = await risposta(ctx, r)
    if (e?.ok) ctx.aggiorna(s, { colore: 'oro', av: 'bot-ride', t: ':quiz: giusto!', d: `${v.domanda}\n<b>${e.giusta}</b>: ${ctx.pzkHtml(e.n)}.` })
    else ctx.aggiorna(s, { colore: 'grigio', av: 'bot-triste', t: ':quiz: no', d: e ? `era <b>${e.giusta}</b>.` : 'niente.' })
  },
  // il bot ti sfida a testa o croce (gratis)
  async moneta(ctx, v) {
    const s = ctx.dì({ colore: 'ambra', av: 'bot-occhiolino', t: ':testa: ti sfido', d: 'testa o croce, gratis: se indovini ti do qualcosa.' })
    const r = await ctx.scegli(s, [{ id: 'testa', eti: ':testa: testa' }, { id: 'croce', eti: ':croce: croce' }], v.ms)
    if (!r) { await risposta(ctx, null); return ctx.aggiorna(s, { colore: 'grigio', av: 'bot-triste', d: 'niente? Peggio per te.' }) }
    const e = await risposta(ctx, r)
    if (!e?.uscito) return ctx.aggiorna(s, { colore: 'grigio', av: 'bot-triste', d: 'troppo tardi: la moneta è rotolata via.' })
    if (e.ok) ctx.aggiorna(s, { colore: 'oro', av: 'bot-ride', t: `:${e.uscito}: ${e.uscito}!`, d: `indovinato: ${ctx.pzkHtml(e.n)}.` })
    else ctx.aggiorna(s, { colore: 'grigio', av: 'bot-ride', t: `:${e.uscito}: ${e.uscito}`, d: 'niente, ma non ti è costato niente.' })
  },
  // una nutria ti ruba qualcosa dallo zaino (la banca gliel'ha già dato: torna solo con SCIÒ in tempo)
  async nutria(ctx, v) {
    const s = ctx.dì({ colore: 'rosso', av: 'bot-arrabbiato', t: ':nutria: una nutria!', d: `ti sta rubando :${v.id}: dallo zaino. Scrivi <b>SCIÒ</b>!` })
    const ferma = ctx.tempo(s, v.ms)
    await ctx.inVista(s)
    const r = await ctx.scrivi(v.ms, { segnaposto: 'SCIÒ' })
    ferma()
    const e = await risposta(ctx, r)
    if (e?.ok) ctx.aggiorna(s, { av: 'bot-ride', t: ':nutria: scappata', d: 'la nutria molla tutto e si tuffa nel Mincio.' })
    else ctx.aggiorna(s, { colore: 'rosso', av: 'bot-triste', t: ':nutria: fregato', d: `la nutria si è portata via :${v.id}: ${v.nome ?? v.id}.` })
  },
  // vero o falso lampo (26.10): 6 secondi, paga come il quiz lampo
  async verofalso(ctx, v) {
    const s = ctx.dì({ colore: 'blu', av: 'bot-pensa', t: ':quiz: vero o falso?', d: v.testo })
    const ferma = ctx.tempo(s, v.ms)
    const scelta = await ctx.scegli(s, [{ id: 'vero', eti: 'vero', stile: 'nero' }, { id: 'falso', eti: 'falso', stile: 'nero' }], v.ms)
    ferma()
    const e = await risposta(ctx, scelta)
    const nota = e?.nota ? `\n<small>${e.nota}</small>` : ''
    if (e?.ok) ctx.aggiorna(s, { colore: 'oro', av: 'bot-ride', t: ':quiz: giusto!', d: `${v.testo}\n<b>${e.giusta}</b>: ${ctx.pzkHtml(e.n)}.${nota}` })
    else ctx.aggiorna(s, { colore: 'grigio', av: 'bot-triste', t: ':quiz: no', d: e ? `era <b>${e.giusta}</b>.${nota}` : 'niente.' })
  },
}
/** La risposta all'evento: → l'esito della banca, o null se non ha risposto (rete, evento passato). */
async function risposta(ctx, r) {
  const x = await ctx.fai('chat.evento', { risposta: r ?? null })
  return x.ok ? x.esito : null
}

/** L'evento che la banca ha tirato con il comando (ev: { tipo, id? }): lo si apre e lo si gioca. */
export async function eventoCasuale(ctx, ev) {
  if (!ev || !EVENTI[ev.tipo]) return
  await ctx.dormi(500)
  const a = await ctx.fai('chat.evento', {})
  if (!a.ok) return
  await EVENTI[a.esito.tipo]?.(ctx, a.esito)
}
