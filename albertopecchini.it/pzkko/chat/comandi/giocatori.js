// I comandi che usano il database dei giocatori (api/giocatori, chat/db.js): classifica (per qualunque metrica), cerca,
// giocatore (la scheda di uno), notizie, rivale (chi ti sta sopra e sotto), banca (i numeri di tutti). Funzionano solo se il
// server risponde: se no, il bot lo dice e basta.
import * as db from '../db.js'
import { nomeDi } from '../testi.js'

const fuori = (ctx) => ctx.dì({ colore: 'grigio', av: 'bot-triste', d: 'il database dei giocatori adesso non risponde (il server è in pausa o sei offline).' })
const nomeMetriche = () => Object.entries(db.METRICHE).map(([id, [n]]) => `<code>classifica ${id}</code>`).join(' ')
const giorni = (ms) => { const g = Math.floor((Date.now() - ms) / 86400000); return g < 1 ? 'oggi' : g === 1 ? 'ieri' : `${g} giorni fa` }

/** La scheda di un giocatore, dal suo profilo pubblico. */
export function schedaGiocatore(ctx, p) {
  const s = p.s ?? {}
  const pos = p.posizioni ?? {}
  const classifiche = ['pzk', 'xp', 'pescati', 'quiz', 'guadagnati'].filter((m) => pos[m]).map((m) => `${db.METRICHE[m][0]}: <b>${pos[m].pos}°</b>`)
  ctx.dì({
    colore: 'blu', t: `:${p.mest ?? 'bot'}: ${p.nome}`, d: `<i>${p.titolo}</i> · livello <b>${p.liv}</b>${p.mest ? ` · ${nomeDi(p.mest)}` : ''}\n<small>${p.ind} · in banca da ${giorni(p.creato).replace(' fa', '')}${p.ult ? ` · visto ${giorni(p.ult)}` : ''}</small>`,
    campi: [['$pzk liberi', ctx.pzkHtml(p.pzk)], ['esperienza', `${p.xp} xp`], ['pescati', String(s.pescati ?? 0)], ['cacciati', String(s.cacciati ?? 0)], ['scavati', String(s.scavati ?? 0)], ['quiz giusti', `${s.quizGiusti ?? 0}/${s.quizTotali ?? 0}`], ['sfide fatte', String(s.sfideFatte ?? 0)], ['side quest', String(s.missioniFatte ?? 0)], ['morti', `:teschio: ${s.morti ?? 0}`], ['serie', `${p.serie ?? 0} giorni`], ...(classifiche.length ? [['in classifica', classifiche.join(' · '), true]] : [])],
    azioni: [[`manda ${p.ind} `, ':pzk: manda $pzk'], ['classifica', ':trofeo: classifica']],
  })
}

export const GIOCATORI = [
  {
    nomi: ['classifica', 'lb', 'top', 'ricchi'], cat: 'giocatori', icona: 'trofeo', breve: 'le classifiche: classifica (i più ricchi), classifica xp, classifica pescati…', uso: 'classifica [metrica]', senzaEventi: true,
    async fai(ctx) {
      const m = (ctx.args[0] ?? 'pzk').toLowerCase()
      if (m === 'lista' || m === '?') return ctx.dì({ colore: 'blu', t: ':trofeo: le classifiche', d: Object.keys(db.METRICHE).map((id) => `<code>classifica ${id}</code>`).join(' ') })
      const id = Object.keys(db.METRICHE).find((k) => k === m) ?? Object.keys(db.METRICHE).find((k) => k.startsWith(m) || db.METRICHE[k][0].startsWith(m))
      if (!id) return ctx.dì({ colore: 'rosso', d: `non conosco «${m}». ${nomeMetriche()}` })
      await ctx.pensa(400)
      const d = await db.top(id, 10)
      if (!d.ok) return fuori(ctx)
      if (!d.top.length) return ctx.dì({ colore: 'grigio', d: 'nessuno ha ancora niente qui: sii il primo.' })
      const [nome, , ico] = db.METRICHE[id]
      ctx.dì({ colore: 'oro', t: `:${ico}: ${nome}`, html: `<table><tr><th>#</th><th>giocatore</th><th>valore</th></tr>${d.top.map((c) => `<tr data-cmd="giocatore ${c.ind}" class="cliccabile"><td>${c.pos}</td><td>${c.nome} <small>liv. ${c.liv}</small></td><td>${db.valoreHtml(id, c.valore)}</td></tr>`).join('')}</table>`, pie: `${d.giocatori} giocatori in banca · tocca un nome per la sua scheda · <code>classifica lista</code>` })
    },
  },
  {
    nomi: ['cerca', 'trova', 'find'], cat: 'giocatori', icona: 'cuore', breve: 'cerca un giocatore per nome: cerca mat', uso: 'cerca <nome>', senzaEventi: true,
    async fai(ctx) {
      if (!ctx.testo) return ctx.dì({ colore: 'rosso', d: 'chi? <code>cerca mario</code>' })
      const d = await db.cerca(ctx.testo)
      if (!d.ok) return fuori(ctx)
      if (!d.trovati.length) return ctx.dì({ colore: 'grigio', av: 'bot-pensa', d: `nessun giocatore con «${ctx.testo.replace(/</g, '&lt;')}».` })
      ctx.dì({ colore: 'blu', t: ':cuore: trovati', html: `<ul>${d.trovati.map((c) => `<li data-cmd="giocatore ${c.ind}" class="cliccabile"><b>${c.nome}</b> · liv. ${c.liv} · <i>${c.titolo}</i> <small>${c.ind}</small></li>`).join('')}</ul>`, pie: 'tocca un nome per la sua scheda' })
    },
  },
  {
    nomi: ['giocatore', 'chi', 'player'], cat: 'giocatori', icona: 'bot', breve: 'la scheda di un giocatore: giocatore mario, giocatore pzk398893', uso: 'giocatore <nome|pzk123456>', senzaEventi: true,
    async fai(ctx) {
      let q = ctx.testo
      if (!q) { const io = await db.io(); if (!io.ok) return io.errore ? ctx.dì({ colore: 'ambra', d: io.errore }) : fuori(ctx); return schedaGiocatore(ctx, io.profilo) }
      let ind = /^(?:pzk)?\d{6}$/i.test(q) ? q : null
      if (!ind) { const c = await db.cerca(q); if (!c.ok) return fuori(ctx); if (!c.trovati.length) return ctx.dì({ colore: 'grigio', av: 'bot-pensa', d: `nessun giocatore con «${q.replace(/</g, '&lt;')}».` }); ind = c.trovati[0].ind }
      const d = await db.profilo(ind)
      if (!d.ok) return d.errore ? ctx.dì({ colore: 'rosso', d: d.errore }) : fuori(ctx)
      schedaGiocatore(ctx, d.profilo)
    },
  },
  {
    nomi: ['notizie', 'news', 'bacheca'], cat: 'giocatori', icona: 'sirena', breve: 'le ultime cose successe in banca', uso: 'notizie', senzaEventi: true,
    async fai(ctx) {
      await ctx.pensa(300)
      const d = await db.notizie()
      if (!d.ok) return fuori(ctx)
      if (!d.notizie.length) return ctx.dì({ colore: 'grigio', d: 'in banca non succede niente. Fai succedere qualcosa tu.' })
      ctx.dì({ colore: 'ambra', t: ':sirena: le notizie', html: `<ul class="c-notizie">${d.notizie.slice(0, 10).map((n) => { const t = db.testoNotizia(n); return `<li>:${t.icona}: ${t.html}</li>` }).join('')}</ul>`, pie: `ultime ${Math.min(10, d.notizie.length)} · salire di livello, pescare i leggendari e vincere grosso fa notizia` })
    },
  },
  {
    nomi: ['rivale', 'rival', 'sfidante'], cat: 'giocatori', icona: 'fuoco', breve: 'chi ti sta sopra e sotto in classifica (xp): rivale pescati…', uso: 'rivale [metrica]', senzaEventi: true,
    async fai(ctx) {
      const m = Object.keys(db.METRICHE).find((k) => k === (ctx.args[0] ?? 'xp').toLowerCase()) ?? 'xp'
      const d = await db.io(m)
      if (!d.ok) return d.errore ? ctx.dì({ colore: 'ambra', d: d.errore }) : fuori(ctx)
      const v = d.vicini
      if (!v) return ctx.dì({ colore: 'grigio', d: 'nessuna classifica con te dentro, per questa cosa: comincia a farla.' })
      const [nome, , ico] = db.METRICHE[m]
      const riga = (c, verso) => c ? `<li data-cmd="giocatore ${c.ind}" class="cliccabile">${verso} <b>${c.nome}</b> (${c.pos}°): ${db.valoreHtml(m, c.valore)}</li>` : ''
      ctx.dì({ colore: 'rosso', av: 'bot-arrabbiato', t: `:${ico}: rivale: ${nome}`, d: `sei <b>${v.pos}°</b> su ${v.totale} con ${db.valoreHtml(m, v.io)}.`, html: `<ul>${riga(v.su, '↑ da superare:')}${riga(v.giu, '↓ ti insegue:')}</ul>`,
        pie: v.su ? `ti mancano ${Number(v.su.valore - v.io).toLocaleString('it-IT')} per superare ${v.su.nome}` : 'sei il primo. Adesso tutti ti vogliono battere.' })
    },
  },
  {
    nomi: ['banca', 'numeri', 'stats'], cat: 'giocatori', icona: 'pzk', breve: 'i numeri di tutta la banca: giocatori, $pzk, record', uso: 'banca', senzaEventi: true,
    async fai(ctx) {
      await ctx.pensa(300)
      const d = await db.statistiche()
      if (!d.ok) return fuori(ctx)
      const s = d.stats
      const r = s.record
      const chi = (x, f) => x ? `${x.nome} (${f(x.valore)})` : '—'
      ctx.dì({ colore: 'blu', t: ':pzk: la banca in numeri', campi: [['giocatori', String(s.giocatori)], ['attivi oggi', String(s.attivi24h)], ['attivi in settimana', String(s.attivi7g)], ['$pzk in giro', ctx.pzkHtml(s.pzk)], ['EUR€ in giro', ctx.eurHtml(s.eur)], ['livello medio', String(s.livelloMedio)], ['pescati', String(s.pescati)], ['scavati', String(s.scavati)], ['morti', `:teschio: ${s.morti}`], ['quiz azzeccati', String(s.quizGiusti)], ['sfide fatte', String(s.sfideFatte)], ['side quest fatte', String(s.missioniFatte)],
        ['il più ricco', chi(r.ricco, (v) => `${Number(v).toLocaleString('it-IT')} $pzk`), true], ['il più esperto', chi(r.esperto, (v) => `${v} xp`), true], ['il re del Mincio', chi(r.pescatore, (v) => `${v} pesci`), true]] })
    },
  },
]
