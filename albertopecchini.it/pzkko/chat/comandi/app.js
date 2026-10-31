// I comandi delle app del telefono, giocabili anche dalla chat: telefono, shop, virtual, sfide, missioni, quest, quiz.
// (La logica sta in sfide.js, missioni.js, quiz.js, mercato.js, e dal 31.10 sulla banca: quelli chiedono, la banca fa; l'interfaccia
// grande è nelle app di telefono/app/.)
import * as pzk from '../../games/pzk.js'
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
  // (31.10) la partita la fa la banca (chat/quiz.js): le domande arrivano una alla volta senza la giusta, e il tempo lo misura lei
  const p = await quiz.nuova(scelto)
  if (p.errore) return ctx.dì({ colore: 'grigio', av: 'bot-triste', d: esc(p.errore) })
  const rest = quiz.restanti()
  const intro = ctx.dì({ colore: 'blu', t: `:quiz: quiz · ${argomenti.find(([id]) => id === scelto)?.[1] ?? 'di tutto un po’'}`, d: `${p.n} domande, ${quiz.TEMPO} secondi l’una. ${rest > 0 ? `Ogni risposta giusta paga da ${quiz.PAGA[1]} a ${quiz.PAGA[3]} $pzk (se rispondi in fretta, di più). Oggi ne restano <b>${rest}</b> pagate.` : 'Le risposte pagate di oggi sono finite: è solo un allenamento (punti esperienza).'}` })
  await ctx.inVista(intro, 900)
  const NOMI = ['', 'facile', 'media', 'difficile']
  while (!p.finita) {
    const aperta = await quiz.prossima(p) // (il tempo della banca parte qui, dopo l'introduzione o l'esito di prima)
    if (aperta !== true) return ctx.dì({ colore: 'rosso', av: 'bot-triste', d: esc(aperta.errore) })
    const d = p.d
    const s = ctx.dì({ colore: 'blu', t: `:quiz: ${p.i + 1}/${p.n} · ${NOMI[d.diff]}`, d: esc(d.q), img: d.img, pie: d.credito || undefined })
    const ferma = ctx.tempo(s, quiz.TEMPO * 1000)
    await ctx.inVista(s)
    const id = await ctx.scegli(s, d.risposte.map((t, i) => ({ id: String(i), eti: esc(t), stile: 'nero' })), quiz.TEMPO * 1000)
    ferma()
    const r = await quiz.rispondi(p, id == null ? null : Number(id))
    if (r.errore) return ctx.aggiorna(s, { colore: 'rosso', av: 'bot-triste', t: ':quiz: la banca dice di no', d: esc(r.errore) })
    ctx.aggiorna(s, {
      colore: r.giusta ? 'oro' : 'rosso', av: r.giusta ? 'bot-ride' : 'bot-triste',
      t: `:quiz: ${r.giusta ? 'giusto!' : id == null ? 'tempo scaduto' : 'sbagliato'}`,
      d: `${esc(d.q)}\n${r.giusta ? '' : `la risposta era <b>${esc(d.risposte[r.indiceGiusto])}</b>.`}${r.giusta ? `<b>${esc(d.risposte[r.indiceGiusto])}</b>` : ''}${r.nota ? `\n<small>${esc(r.nota)}</small>` : ''}`,
      pie: r.giusta ? (r.pagato ? `+${ctx.fmt(r.premio)} $pzk · +${r.xp} xp${r.serie > 1 ? ` · serie di ${r.serie}` : ''}` : `+${r.xp} xp (le risposte pagate di oggi sono finite)`) : 'la serie riparte da zero',
    })
    ctx.saleDiLivello(r.livello)
    await ctx.dormi(r.nota ? 1900 : 1200)
  }
  const perfetta = p.giuste === p.n
  ctx.dì({ colore: perfetta ? 'oro' : 'blu', av: perfetta ? 'bot-ricco' : 'bot', t: `:trofeo: ${p.giuste} su ${p.n}`, d: perfetta ? (p.bonus ? 'PERFETTO. Nessun errore: il bonus delle partite perfette è tuo.' : 'PERFETTO. Nessun errore (stavolta niente bonus).') : p.giuste >= p.n / 2 ? 'non male. Sapevi più di quanto sembri.' : 'si impara anche sbagliando. Soprattutto sbagliando.',
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

// ── le app da comprare (26.10 dalla chat, «installa decifratore»; dal 29.10 il pzkstore del cercapersone,
// telefono/app/pzkstore.js, che ha il catalogo e gli acquisti): «installa <app>» compra dallo stesso pzkstore, allo stesso
// prezzo e con le stesse regole (il conto, i soldi puliti, niente in galera); «pzkstore» lo apre; «lavatrice» (anche «lava»)
// apre la lavatrice, e a chi non ce l'ha spiega tutta la strada: il pzkstore, il prezzo, la commissione, come si lava ──
const store = () => import('../../telefono/app/pzkstore.js')
const nomeApp = (x) => x.nome.toLowerCase()
const fatta = (x) => (x.f ? 'installata' : 'installato')
/** «lav» → la lavatrice: per id o per l'inizio del nome (almeno tre lettere). */
const trova = (s, arg) => (arg ? s.CATALOGO.find((x) => x.id === arg || (arg.length >= 3 && x.id.startsWith(arg))) : null)
/** Il catalogo del pzkstore in chat, coi tasti per comprare quello che manca. */
function elenco(ctx, s, nota = '') {
  const manca = s.CATALOGO.filter((x) => !zaino.installata(x.id))
  return ctx.dì({
    colore: 'blu', t: ':app-pzkstore: il pzkstore', d: `${nota}le app che il cercapersone non ha di serie. Si comprano una volta coi $pzk <b>puliti</b> (gli sporchi non valgono) e compaiono nella home del cercapersone, nella pagina dei soldi. Qui con <code>installa lavatrice</code>, o nell’app <b>pzkstore</b> del cercapersone, con tutte le schede.`,
    html: `<table>${s.CATALOGO.map((x) => `<tr><td>:${x.icona}:</td><td><b>${nomeApp(x)}</b>${zaino.installata(x.id) ? ` ✓ ${fatta(x)}` : ''}<br><small>${x.breve}</small></td><td>${x.prezzo ? ctx.pzkHtml(x.prezzo) : 'gratis'}</td></tr>`).join('')}</table>`,
    azioni: [['pzkstore', ':app-pzkstore: apri il pzkstore', 'oro'], ...manca.map((x) => [`installa ${x.id}`, `:${x.icona}: compra ${nomeApp(x)} (${ctx.fmt(x.prezzo)})`])],
    pie: pzk.conto() ? `hai ${ctx.fmt(pzk.puliti())} $pzk puliti${pzk.sporchi() > 0 ? ` e ${ctx.fmt(pzk.sporchi())} sporchi` : ''}` : 'senza conto non si compra: crealo nel cercapersone (app account)',
  })
}
export const APP = [
  {
    nomi: ['installa', 'install', 'scarica'], cat: 'app', icona: 'app-pzkstore', breve: 'compra un’app del pzkstore e la installa nel cercapersone: «installa lavatrice», «installa decifratore»', uso: 'installa <app>', senzaEventi: true,
    async fai(ctx) {
      const s = await store(), x = trova(s, ctx.args[0]?.toLowerCase())
      if (!x) return elenco(ctx, s, ctx.args[0] ? `nel pzkstore non c’è «${esc(ctx.args[0])}». ` : '') && false
      const apri = [`pzkstore ${x.id}`, `:${x.icona}: apri ${nomeApp(x)}`, 'oro']
      if (zaino.installata(x.id)) return ctx.dì({ colore: 'grigio', d: `${nomeApp(x)} ce l’hai già: è nel cercapersone, nella home (pagina dei soldi).`, azioni: [apri] }) && false
      const r = await s.compra(x.id) // (31.10: la banca, coi suoi prezzi)
      if (!r.ok) return ctx.dì({ colore: 'rosso', av: 'bot-triste', t: `:${x.icona}: ${nomeApp(x)}: ${ctx.fmt(x.prezzo)} $pzk puliti`, d: `${esc(r.errore)}.`, azioni: pzk.conto() ? [['pzkstore ' + x.id, ':app-pzkstore: la scheda nel pzkstore']] : [['telefono', ':app-account: crea il conto (cercapersone)', 'oro']] }) && false
      await ctx.pensa(900)
      return ctx.dì({ colore: 'verde', av: 'bot-occhiolino', t: `:${x.icona}: ${nomeApp(x)} ${fatta(x)}`, d: `${x.breve} Adesso:\n${x.come.slice(1).map((t, i) => `${i + 1}. ${t}`).join('\n')}`, azioni: [apri], pie: x.prezzo ? `−${ctx.fmt(x.prezzo)} $pzk puliti, alla cassa di pzk` : 'gratis' })
    },
  },
  {
    nomi: ['pzkstore', 'appstore', 'app-store'], cat: 'app', icona: 'app-pzkstore', breve: 'il pzkstore: le app da comprare per il cercapersone (la lavatrice, il decifratore)', uso: 'pzkstore [app]', senzaEventi: true,
    async fai(ctx) {
      const s = await store(), x = trova(s, ctx.args[0]?.toLowerCase())
      // con un'app: quella, se ce l'hai; se no la sua scheda nel pzkstore
      if (x && zaino.installata(x.id)) return ctx.apriApp(x.id)
      ctx.apriApp('pzkstore', x ? { app: x.id } : {})
    },
  },
  {
    nomi: ['lavatrice', 'lava', 'ricicla'], cat: 'app', icona: 'app-lavatrice', breve: 'la lavatrice dei soldi sporchi: si compra nel pzkstore, poi lava fino a 50.000 in 10 minuti', uso: 'lavatrice', senzaEventi: true,
    async fai(ctx) {
      if (zaino.installata('lavatrice')) return ctx.apriApp('lavatrice')
      const x = (await store()).PER_ID.lavatrice, sp = pzk.sporchi()
      return ctx.dì({
        colore: 'ambra', av: 'bot-pensa', t: ':app-lavatrice: la lavatrice non ce l’hai',
        d: `i soldi sporchi (il bottino delle <b>rapine</b>) si vedono nel saldo ma con pzk non si spendono: o aspetti 96 giorni che si puliscano da soli, o li lavi nella <b>lavatrice</b>. Si fa così:
1. apri il <b>pzkstore</b> del cercapersone (o scrivi <code>installa lavatrice</code>) e compri la lavatrice, una volta sola: <b>${ctx.fmt(x.prezzo)} $pzk puliti</b>;
2. la apri dalla home del cercapersone, nella pagina dei soldi;
3. scegli quanti sporchi lavare, fino a 50.000, e paghi <b>2.000 puliti</b> di commissione;
4. dopo dieci minuti sono puliti.`,
        azioni: [['installa lavatrice', `:app-lavatrice: compra la lavatrice (${ctx.fmt(x.prezzo)})`, 'oro'], ['pzkstore lavatrice', ':app-pzkstore: la scheda nel pzkstore']],
        pie: pzk.conto() ? `hai ${ctx.fmt(sp)} $pzk sporchi e ${ctx.fmt(pzk.puliti())} puliti` : 'serve il conto: i soldi sporchi stanno lì',
      }) && false
    },
  },
  {
    nomi: ['telefono', 'phone', 'app'], cat: 'app', icona: 'telefono', breve: 'apre il telefono con tutte le app', uso: 'telefono', senzaEventi: true,
    async fai(ctx) { ctx.apriApp(null) },
  },
  {
    nomi: ['shop', 'ecommerce'], cat: 'app', icona: 'sacco', breve: 'lo shop del telefono: offerte, carrello, tutto il catalogo', uso: 'shop', senzaEventi: true,
    async fai(ctx) { ctx.apriApp('negozio') },
  },
  {
    nomi: ['virtual', 'scommesse', 'calcio'], cat: 'app', icona: 'app-virtual', breve: 'le scommesse sul campionato inventato: una partita ogni 5 minuti', uso: 'virtual', senzaEventi: true,
    async fai(ctx) { ctx.apriApp('virtual') },
  },
  {
    nomi: ['sfide', 'sfida', 'daily', 'giornaliere'], cat: 'app', icona: 'fulmine', breve: 'le tre sfide di oggi; «sfide riscuoti» ritira i premi', uso: 'sfide [riscuoti]', senzaEventi: true,
    async fai(ctx) {
      if (ctx.args[0]?.toLowerCase().startsWith('risc')) {
        let n = 0, pzk = 0
        // (31.10) ogni riscossione è un'azione della banca, una dopo l'altra: il bonus dopo le tre
        for (const x of sfide.oggi().sfide.filter((s) => s.pronta)) { const r = await sfide.riscuoti(x.id); if (r.ok) { n++; pzk += r.pzk; ctx.saleDiLivello(r.livello) } }
        const b = sfide.oggi().bonusPronto ? await sfide.riscuotiBonus() : { ok: false }
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
      // (31.10) cominciare e scegliere sono azioni della banca (chat/missioni.js)
      if (!n) {
        const r = await missioni.inizia(id)
        if (!r.ok) return ctx.dì({ colore: 'rosso', av: 'bot-pensa', d: esc(r.errore) })
        return schedaMissione(ctx, id)
      }
      const r = await missioni.scegli(id, n - 1)
      if (!r.ok) return ctx.dì({ colore: 'rosso', av: 'bot-pensa', d: esc(r.errore) })
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
