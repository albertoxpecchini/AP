// I comandi delle app del telefono, giocabili anche dalla chat: telefono, shop, sfide, missioni, quest, quiz.
// (La logica sta in sfide.js, missioni.js, quiz.js, mercato.js; l'interfaccia grande è nelle app di telefono/app/.)
import * as zaino from '../zaino.js'
import * as sfide from '../sfide.js'
import * as missioni from '../missioni.js'
import * as quiz from '../quiz.js'
import * as mercato from '../mercato.js'
import { PER_ID as OGGETTI, nomeDi } from '../testi.js'

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const barra = (fatto, target) => `<div class="c-barra"><i style="width:${Math.round((100 * Math.min(fatto, target)) / target)}%"></i></div>`

// ── sfide ──
function schedaSfide(ctx, nota = '') {
  const o = sfide.oggi()
  const pronte = o.sfide.filter((x) => x.pronta).length
  ctx.dì({
    colore: 'oro', t: ':fulmine: le sfide di oggi', d: nota || `${o.sfide.filter((x) => x.riscossa).length} di 3 riscosse${o.serie ? ` · serie di <b>${o.serie}</b> giorn${o.serie === 1 ? 'o' : 'i'}` : ''}. Cambiano a mezzanotte.`,
    html: `<div class="c-sfide">${o.sfide.map((x) => `<div class="c-sfida${x.riscossa ? ' fatta' : x.pronta ? ' pronta' : ''}"><div class="c-sf-ico">:${x.icona}:</div><div class="c-sf-txt"><b>${x.testo}</b><small>${x.nome} · ${x.riscossa ? 'riscossa' : `${x.fatto}/${x.target}`}</small>${barra(x.fatto, x.target)}</div><div class="c-sf-premio">${ctx.pzkHtml(x.premio.pzk)}<small>+${x.premio.xp} xp</small></div></div>`).join('')}</div>`,
    azioni: [...(pronte || o.bonusPronto ? [['sfide riscuoti', `:regalo: riscuoti${pronte ? ` (${pronte + (o.bonusPronto ? 1 : 0)})` : ' il bonus'}`, 'oro']] : [])],
    pie: o.tutte ? (o.bonusRiscosso ? 'tutte e tre fatte, bonus preso: a domani.' : `fatte tutte e tre: il bonus del giorno (${ctx.fmt(o.bonusGiorno)} $pzk e una cassa) ti aspetta`) : `tutte e tre: bonus di ${ctx.fmt(o.bonusGiorno)} $pzk e una cassa${o.serie ? `, e la serie sale` : ''}`,
  })
}

// ── il quiz, una partita in chat ──
async function giocaQuiz(ctx, arg) {
  const argomenti = quiz.TUTTI_ARGOMENTI
  if (arg === 'lista' || arg === '?') return ctx.dì({ colore: 'blu', t: ':quiz: gli argomenti', d: 'otto domande, 15 secondi l’una, ogni risposta giusta paga. Scegli:', azioni: argomenti.map(([id, nome, ico]) => [`quiz ${id}`, `:${ico}: ${nome}`]) })
  const scelto = arg ? argomenti.find(([id, nome]) => id.startsWith(arg) || nome.startsWith(arg))?.[0] : null
  if (arg && !scelto) return ctx.dì({ colore: 'rosso', d: `non c’è l’argomento «${esc(arg)}»: <code>quiz lista</code>.` })
  const p = await quiz.nuova(scelto)
  if (!p) return ctx.dì({ colore: 'grigio', av: 'bot-triste', d: scelto === 'giocatori' ? 'ci sono pochi giocatori nel database: servono almeno tre conti con qualche punto.' : 'non ho domande per questo argomento.' })
  const rest = quiz.restanti()
  const intro = ctx.dì({ colore: 'blu', t: `:quiz: quiz · ${argomenti.find(([id]) => id === scelto)?.[1] ?? 'di tutto un po’'}`, d: `${p.domande.length} domande, ${quiz.TEMPO} secondi l’una. ${rest > 0 ? `Ogni risposta giusta paga da ${quiz.PAGA[1]} a ${quiz.PAGA[3]} $pzk (se rispondi in fretta, di più). Oggi ne restano <b>${rest}</b> pagate.` : 'Le risposte pagate di oggi sono finite: è solo un allenamento (punti esperienza).'}` })
  await ctx.inVista(intro, 900)
  const NOMI = ['', 'facile', 'media', 'difficile']
  while (!p.finita) {
    const d = p.domande[p.i]
    const s = ctx.dì({ colore: 'blu', t: `:quiz: ${p.i + 1}/${p.domande.length} · ${NOMI[d.diff]}`, d: esc(d.q), img: d.img, pie: d.credito || undefined })
    const ferma = ctx.tempo(s, quiz.TEMPO * 1000)
    await ctx.inVista(s) // il bonus di velocità conta da quando la domanda è scritta, come la barra
    const t0 = Date.now()
    const id = await ctx.scegli(s, d.risposte.map((t, i) => ({ id: String(i), eti: esc(t), stile: 'nero' })), quiz.TEMPO * 1000)
    ferma()
    const r = quiz.rispondi(p, id == null ? null : Number(id), Math.max(0, quiz.TEMPO * 1000 - (Date.now() - t0)))
    ctx.aggiorna(s, {
      colore: r.giusta ? 'oro' : 'rosso', av: r.giusta ? 'bot-ride' : 'bot-triste',
      t: `:quiz: ${r.giusta ? 'giusto!' : id == null ? 'tempo scaduto' : 'sbagliato'}`,
      d: `${esc(d.q)}\n${r.giusta ? '' : `la risposta era <b>${esc(d.risposte[r.indiceGiusto])}</b>.`}${r.giusta ? `<b>${esc(d.risposte[r.indiceGiusto])}</b>` : ''}${r.nota ? `\n<small>${esc(r.nota)}</small>` : ''}`,
      pie: r.giusta ? (r.pagato ? `+${ctx.fmt(r.premio)} $pzk · +${r.xp} xp${r.serie > 1 ? ` · serie di ${r.serie}` : ''}` : `+${r.xp} xp (le risposte pagate di oggi sono finite)`) : 'la serie riparte da zero',
    })
    ctx.saleDiLivello(r.livello)
    await ctx.dormi(r.nota ? 1900 : 1200)
  }
  const perfetta = p.giuste === p.domande.length
  ctx.dì({ colore: perfetta ? 'oro' : 'blu', av: perfetta ? 'bot-ricco' : 'bot', t: `:trofeo: ${p.giuste} su ${p.domande.length}`, d: perfetta ? 'PERFETTO. Nessun errore: il bonus delle partite perfette è tuo.' : p.giuste >= p.domande.length / 2 ? 'non male. Sapevi più di quanto sembri.' : 'si impara anche sbagliando. Soprattutto sbagliando.',
    campi: [['guadagnati', ctx.pzkHtml(p.guadagnato)], ['esperienza', `+${p.xp} xp`], ['pagate rimaste oggi', String(quiz.restanti())]], azioni: [[`quiz ${scelto ?? ''}`.trim(), ':quiz: ancora', 'oro'], ['quiz lista', 'cambia argomento']] })
}

// ── una missione in chat ──
function schedaMissione(ctx, id, esito = null) {
  const v = missioni.vista(id)
  const m = v.m
  const premioHtml = (p) => `${ctx.pzkHtml(p.pzk)} · +${p.xp} xp${p.oggetto ? ` · :${p.oggetto}: ${nomeDi(p.oggetto)}` : ''}`
  if (v.fatta) return ctx.dì({ colore: 'oro', av: 'bot-ricco', t: `:${m.icona}: ${m.nome}: finita`, d: v.t, pie: esito?.premio ? `premio: ${premioHtml(esito.premio)}` : 'già fatta' })
  const avviso = esito ? [esito.speso ? `hai speso ${esito.speso} $pzk` : '', esito.perso ? `perdi ${esito.perso} $pzk` : '', esito.caso === 'ko' ? 'non è andata bene…' : esito.caso === 'ok' ? 'è andata!' : ''].filter(Boolean).join(' · ') : ''
  ctx.dì({ colore: 'ambra', t: `:${m.icona}: ${m.nome}`, d: v.t, pie: avviso || `passo ${v.passi + 1} · premio: ${premioHtml(m.premio)}`,
    azioni: v.scelte.map((s) => [s.ok ? `quest ${id} ${s.i + 1}` : `quest ${id} ${s.i + 1}`, `${s.eti}${s.costo ? ` (${s.costo})` : ''}${s.azzardo ? ` ${s.azzardo} %` : ''}${s.ok ? '' : ` — ${s.motivo}`}`, s.ok ? '' : 'spento']) })
}

export const APP = [
  {
    nomi: ['telefono', 'phone', 'app'], cat: 'app', icona: 'telefono', breve: 'apre il telefono con tutte le app', uso: 'telefono', senzaEventi: true,
    async fai(ctx) { ctx.apriApp(null) },
  },
  {
    nomi: ['shop', 'ecommerce'], cat: 'app', icona: 'sacco', breve: 'lo shop del telefono: offerte, carrello, tutto il catalogo', uso: 'shop', senzaEventi: true,
    async fai(ctx) { ctx.apriApp('negozio') },
  },
  {
    nomi: ['sfide', 'sfida', 'daily', 'giornaliere'], cat: 'app', icona: 'fulmine', breve: 'le tre sfide di oggi; «sfide riscuoti» ritira i premi', uso: 'sfide [riscuoti]', senzaEventi: true,
    async fai(ctx) {
      if (ctx.args[0]?.toLowerCase().startsWith('risc')) {
        let n = 0, pzk = 0
        for (const x of sfide.oggi().sfide.filter((s) => s.pronta)) { const r = sfide.riscuoti(x.id); if (r.ok) { n++; pzk += r.pzk; ctx.saleDiLivello(r.livello) } }
        const b = sfide.riscuotiBonus()
        if (!n && !b.ok) return ctx.dì({ colore: 'grigio', av: 'bot-pensa', d: 'niente da riscuotere: finisci prima una sfida.' })
        ctx.dì({ colore: 'oro', av: 'bot-ricco', t: ':regalo: riscosso', d: `${n ? `${n} sfid${n === 1 ? 'a' : 'e'}: ${ctx.pzkHtml(pzk)}.` : ''}${b.ok ? `\nBonus del giorno: ${ctx.pzkHtml(b.pzk)} e una :${b.cassa}: (serie di ${b.serie}).` : ''}` })
        return schedaSfide(ctx)
      }
      schedaSfide(ctx)
    },
  },
  {
    nomi: ['missioni', 'quests', 'sidequest'], cat: 'app', icona: 'chiave-vecchia', breve: 'le side quest: storie a bivi con premio', uso: 'missioni', senzaEventi: true,
    async fai(ctx) {
      const el = missioni.elenco()
      ctx.dì({ colore: 'ambra', t: ':chiave-vecchia: le side quest', d: 'storie brevi, ognuna una volta sola. Alcune chiedono un oggetto dello shop.',
        html: `<div class="c-sfide">${el.map((m) => `<div class="c-sfida ${m.stato === 'fatta' ? 'fatta' : m.stato === 'bloccata' ? 'bloccata' : 'pronta'}"><div class="c-sf-ico">:${m.icona}:</div><div class="c-sf-txt"><b>${m.nome}</b><small>${m.stato === 'fatta' ? 'finita' : m.stato === 'bloccata' ? `ti manca: ${m.manca.join(', ')}` : m.stato === 'in corso' ? 'in corso' : m.breve}</small></div></div>`).join('')}</div>`,
        azioni: el.filter((m) => m.stato === 'pronta' || m.stato === 'in corso').map((m) => [`quest ${m.id}`, `:${m.icona}: ${m.stato === 'in corso' ? 'continua' : 'comincia'} ${m.nome}`, m.stato === 'in corso' ? 'oro' : '']),
        pie: `finite: ${el.filter((m) => m.stato === 'fatta').length} di ${el.length}` })
    },
  },
  {
    nomi: ['quest', 'missione'], cat: 'app', icona: 'chiave-vecchia', breve: 'comincia o continua una side quest: quest civico28, poi quest civico28 2', uso: 'quest <nome> [scelta]', nascosto: true, senzaEventi: true,
    async fai(ctx) {
      const id = missioni.elenco().find((m) => m.id.startsWith((ctx.args[0] ?? '').toLowerCase()) || m.nome.toLowerCase().includes((ctx.args[0] ?? '').toLowerCase()))?.id
      if (!ctx.args[0] || !id) return ctx.esegui('missioni', { muto: true })
      const n = parseInt(ctx.args[1])
      if (!n) {
        const r = missioni.inizia(id)
        if (!r.ok) return ctx.dì({ colore: 'rosso', av: 'bot-pensa', d: r.errore })
        return schedaMissione(ctx, id)
      }
      const r = missioni.scegli(id, n - 1)
      if (!r.ok) return ctx.dì({ colore: 'rosso', av: 'bot-pensa', d: r.errore })
      await ctx.pensa(500)
      if (r.esito.fine) { ctx.saleDiLivello(r.esito.livello); return schedaMissione(ctx, id, r.esito) }
      schedaMissione(ctx, id, r.esito)
    },
  },
  {
    nomi: ['quiz', 'trivia'], cat: 'giochi', icona: 'quiz', breve: 'una partita di 8 domande: ogni risposta giusta paga; «quiz lista» per gli argomenti', uso: 'quiz [argomento]',
    async fai(ctx) { return giocaQuiz(ctx, ctx.args[0]?.toLowerCase()) },
  },
]
