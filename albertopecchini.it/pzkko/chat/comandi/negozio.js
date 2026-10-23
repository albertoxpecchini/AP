// Lo zaino e il negozio: zaino, negozio, compra, vendi, usa, info, apri (le casse), gratta.
import * as zaino from '../zaino.js'
import { NEGOZIO, PER_ID, PESCI, ANIMALI, REPERTI, nomeDi } from '../testi.js'
import { REPARTI, testoBonus } from '../oggetti.js'
import * as mercato from '../mercato.js'

const VENDIBILI = [...PESCI, ...ANIMALI, ...REPERTI]
const pezzo = (s) => { s = (s ?? '').trim().toLowerCase(); if (!s) return undefined; return NEGOZIO.find((x) => x.id === s || x.nome.toLowerCase() === s || x.nome.toLowerCase().startsWith(s)) ?? VENDIBILI.find((x) => x.id === s || nomeDi(x.id).toLowerCase().startsWith(s)) }
/** Il reparto scritto come si scrive («cibo», «roba», «pzk», «att»…). */
const OFFERTE = ['offerte', 'offerte del giorno', 'regalo']
const reparto = (s) => { s = (s ?? '').toLowerCase().trim(); return s ? [OFFERTE, ...REPARTI].find(([id, nome]) => id.startsWith(s) || nome.startsWith(s)) : null }
/** Un reparto in righe: ogni pezzo con icona, descrizione, bonus, prezzo e il tasto per comprarlo lì (grigio se non ti bastano i $pzk, «ce l'hai» se è una cosa unica). */
function vetrina(ctx, rep) {
  const saldo = ctx.pzk.saldo()
  const riga = (x) => {
    const ho = zaino.quanti(x.id), ce = x.unico && ho > 0, prezzo = mercato.prezzoDi(x), manca = prezzo - saldo, bonus = testoBonus(x.bonus), sconto = mercato.scontoDi(x.id)
    const tasto = ce ? '<span class="c-v-ce">ce l’hai</span>' : `<button type="button" class="c-b c-v-b${manca > 0 ? ' manca' : ''}" data-cmd="compra ${x.id}" ${manca > 0 ? `title="ti mancano ${ctx.fmt(manca)} $pzk"` : ''}>compra</button>`
    return `<div class="c-v-riga${ce ? ' ce' : ''}"><div class="c-v-ico">:${x.id}:</div><div class="c-v-txt"><b>${x.nome}</b>${!ce && ho ? ` <small>(ne hai ${ho})</small>` : ''}<small>${x.cosa}</small>${bonus ? `<span class="c-v-bonus">${bonus}</span>` : ''}</div><div class="c-v-prezzo">${sconto ? `<s class="c-v-vecchio">${ctx.fmt(x.prezzo)}</s><span class="c-v-sconto">−${Math.round(sconto * 100)} %</span>` : ''}${ctx.pzkHtml(prezzo)}${tasto}</div></div>`
  }
  const pezzi = rep === 'offerte' ? mercato.offerte().map((o) => PER_ID[o.id]) : NEGOZIO.filter((x) => x.reparto === rep)
  return pezzi.map(riga).join('')
}
/** Senza reparto: l'ingresso (un tasto per reparto). Con un reparto: la sua vetrina. */
function mostraVetrina(ctx, rep, t) {
  if (!rep) {
    return ctx.dì({ colore: 'ambra', t: t ?? ':sacco: il negozio dietro la saracinesca', d: `${NEGOZIO.length} pezzi in ${REPARTI.length} reparti. Scegli dove entrare, o scrivi <code>compra canna</code> se sai già cosa vuoi.`,
      azioni: [['negozio offerte', ':regalo: offerte del giorno', 'oro'], ...REPARTI.map(([id, nome, ico]) => [`negozio ${id}`, `:${ico}: ${nome}`])], pie: `hai ${ctx.fmt(ctx.pzk.saldo())} $pzk · lo <code>shop</code> sul telefono ha tutto in un posto solo` })
  }
  const [id, nome, ico] = rep
  ctx.dì({ colore: 'ambra', t: `:${ico}: ${nome}`, html: `<div class="c-vetrina">${vetrina(ctx, id)}</div>`, azioni: [...(id === 'offerte' ? [] : [['negozio offerte', ':regalo: offerte', 'oro']]), ...REPARTI.filter(([r]) => r !== id).map(([r, n, i]) => [`negozio ${r}`, `:${i}: ${n}`])],
    pie: `hai ${ctx.fmt(ctx.pzk.saldo())} $pzk · tocca «compra» su un pezzo, o scrivi <code>compra canna 2</code> per più d’uno` })
}

// le casse: cosa può uscire (peso, cosa)
const CASSE = {
  'cassa-comune': [[30, { pzk: [50, 300] }], [20, { oggetto: 'caffe' }], [15, { oggetto: 'mortadella' }], [10, { oggetto: 'gratta' }], [8, { oggetto: 'esca' }], [12, { niente: 'segatura. Solo segatura.' }], [5, { oggetto: 'cornetto' }]],
  'cassa-rara': [[30, { pzk: [400, 1500] }], [12, { oggetto: 'canna' }], [12, { oggetto: 'pala' }], [10, { oggetto: 'fionda' }], [10, { oggetto: 'lattina' }], [8, { oggetto: 'cornetto' }], [8, { oggetto: 'telefono' }], [5, { oggetto: 'cassa-comune', n: 2 }], [5, { niente: 'una lettera dei Gonzaga che dice «ritenta».' }]],
  'cassa-gonzaga': [[30, { pzk: [2000, 6000] }], [15, { oggetto: 'fucile' }], [12, { oggetto: 'cornetto', n: 3 }], [10, { oggetto: 'anfora' }], [8, { oggetto: 'tesoro' }], [8, { oggetto: 'carpa-oro' }], [7, { oggetto: 'lattina', n: 3 }], [5, { pzk: [8000, 15000] }], [5, { niente: 'un biglietto: «la dinastia si è estinta nel 1708, e con lei i soldi».' }]],
}
const pesca = (lista, ctx) => { const tot = lista.reduce((a, [p]) => a + p, 0); let r = Math.random() * tot; for (const [p, x] of lista) { r -= p; if (r < 0) return x } return lista.at(-1)[1] }

export const NEGOZIO_COMANDI = [
  {
    nomi: ['zaino', 'inv', 'inventario', 'oggetti'], cat: 'negozio', icona: 'zaino', breve: 'quello che hai nello zaino', uso: 'zaino', senzaEventi: true,
    async fai(ctx) {
      const o = zaino.oggetti(), e = zaino.effetti()
      if (!o.length && !e.length) return ctx.dì({ colore: 'grigio', t: ':zaino: lo zaino è vuoto', d: 'il <code>negozio</code> vende attrezzi; pesca, caccia e scava riempiono il resto.' })
      ctx.dì({ t: `:zaino: ${ctx.pzk.conto() ? `lo zaino di ${ctx.nome()}` : `il tuo zaino`}`, html: `<ul>${o.map(([id, n]) => `<li>:${id}: <b>${nomeDi(id)}</b>${n > 1 ? ` × ${n}` : ''}${PER_ID[id]?.vale ? ` <small>(vale ${ctx.fmt(PER_ID[id].vale)})</small>` : ''}</li>`).join('')}</ul>`,
        campi: [...(e.length ? [['in corso', e.map(([id, t]) => `:${id}: ${nomeDi(id)} per ${ctx.durata(t - Date.now())}`).join('<br>'), true]] : []), ...(testoBonus(zaino.bonusTutti()) ? [['i tuoi bonus adesso', testoBonus(zaino.bonusTutti()), true]] : [])], pie: '«vendi tutto» vende pesci, bestie e reperti; «usa &lt;cosa&gt;» usa una cosa' })
    },
  },
  {
    nomi: ['negozio', 'store'], cat: 'negozio', icona: 'sacco', breve: 'cosa si compra, e a quanto: negozio cibo, negozio roba…', uso: 'negozio [reparto]', senzaEventi: true,
    async fai(ctx) {
      const r = reparto(ctx.args[0])
      if (ctx.args[0] && !r) return ctx.dì({ colore: 'rosso', d: `non c’è il reparto «${ctx.args[0]}»: ${REPARTI.map(([id]) => `<code>negozio ${id}</code>`).join(' ')}.` })
      mostraVetrina(ctx, r)
    },
  },
  {
    nomi: ['compra', 'buy'], cat: 'negozio', icona: 'pzk', breve: 'compra dal negozio: compra canna', uso: 'compra <cosa> [quanti]', senzaEventi: true,
    async fai(ctx) {
      if (!ctx.args.length) { mostraVetrina(ctx, null, ':sacco: cosa vuoi comprare?'); return false }
      const x = NEGOZIO.find((n) => n.id === pezzo(ctx.args.join(' ').replace(/\s+\d+$/, ''))?.id)
      const n0 = Math.max(1, Math.min(50, parseInt(ctx.args.at(-1)) || 1))
      if (!x) return ctx.dì({ colore: 'rosso', d: `non lo vendo. Guarda il <code>negozio</code>.` })
      if (x.id === 'pager' && zaino.pagerRotto()) { // il nuovo al posto di quello scassato (23.10): torna tutto, il soprammobile resta un'altra cosa
        const r = mercato.ricompraPager()
        if (!r.ok) return ctx.dì({ colore: 'rosso', av: 'bot-triste', t: ':pager: non bastano', d: `il cercapersone nuovo ${r.errore}: mancano ${ctx.pzkHtml(r.manca)}. Lavora.`, azioni: [['lavora', ':rider: lavora', 'oro']] })
        return ctx.dì({ colore: 'oro', av: 'bot-ride', t: ':pager: cercapersone nuovo', d: `pagato ${ctx.pzkHtml(r.tot)}${r.sconto ? ` (offerta del giorno −${Math.round(r.sconto * 100)} %)` : ''}. Vetro nuovo, tutto funziona di nuovo.`, azioni: [['aiuto', 'i comandi']] })
      }
      if (x.unico && zaino.ha(x.id)) return ctx.dì({ colore: 'ambra', d: `:${x.id}: ${x.nome}: ce l’hai già.` })
      const r = mercato.compra(x.id, n0)
      if (!r.ok) return ctx.dì({ colore: 'rosso', av: 'bot-triste', d: `${r.errore}. Lavora.` })
      const { n, tot, sconto } = r
      ctx.dì({ t: `:${x.id}: comprat${n > 1 ? 'i' : 'o'}`, d: `<b>${x.nome}</b>${n > 1 ? ` × ${n}` : ''} per ${ctx.pzkHtml(tot)}${sconto ? ` (offerta del giorno −${Math.round(sconto * 100)} %)` : ''}. ${x.cosa}`,
        azioni: x.tipo === 'usa' ? [[`usa ${x.id}`, 'usalo subito', 'oro']] : x.tipo === 'cassa' ? [[`apri ${x.id}`, 'aprila', 'oro']] : [],
        pie: x.tipo === 'usa' || x.tipo === 'cassa' ? '' : undefined })
    },
  },
  {
    nomi: ['vendi', 'sell'], cat: 'negozio', icona: 'pzk', breve: 'vendi pesci, bestie e reperti: vendi tutto, vendi carpa 2', uso: 'vendi <cosa|tutto> [quanti]', senzaEventi: true,
    async fai(ctx) {
      const che = ctx.args[0]?.toLowerCase()
      if (!che) return ctx.dì({ colore: 'rosso', d: 'cosa? «vendi tutto» o «vendi carpa».' })
      const vendi = (id, n) => { const v = PER_ID[id]?.vale ?? 0; zaino.togli(id, n); return Math.round(v * n * (1 + zaino.bonus('vendita'))) } // il bonus «vendita»: zaino Eastpak, portafoglio, tombino…
      if (['tutto', 'all', 'tutti'].includes(che)) {
        const roba = zaino.oggetti().filter(([id]) => VENDIBILI.some((v) => v.id === id))
        if (!roba.length) return ctx.dì({ colore: 'grigio', d: 'niente da vendere: pesca, caccia o scava.' })
        let tot = 0
        const righe = roba.map(([id, n]) => { const v = vendi(id, n); tot += v; return `:${id}: ${nomeDi(id)}${n > 1 ? ` × ${n}` : ''} → ${ctx.fmt(v)}` })
        const dati = ctx.paga(tot, { puro: true })
        return ctx.dì({ colore: 'oro', av: 'bot-ricco', t: ':sacco: venduto tutto', d: righe.join('\n'), pie: `+${ctx.fmt(dati)} $pzk` })
      }
      const x = VENDIBILI.find((v) => v.id === pezzo(che)?.id)
      if (!x) return ctx.dì({ colore: 'rosso', d: 'si vendono solo pesci, bestie e reperti (gli attrezzi no, sono tuoi).' })
      const ho = zaino.quanti(x.id)
      if (!ho) return ctx.dì({ colore: 'grigio', d: `non hai :${x.id}: ${nomeDi(x.id)}.` })
      const n = Math.min(ho, parseInt(ctx.args[1]) || 1)
      const v = ctx.paga(vendi(x.id, n), { puro: true })
      ctx.dì({ colore: 'oro', t: `:${x.id}: venduto`, d: `${nomeDi(x.id)}${n > 1 ? ` × ${n}` : ''} per ${ctx.pzkHtml(v)}.` })
    },
  },
  {
    nomi: ['usa', 'use'], cat: 'negozio', icona: 'caffe', breve: 'usa una cosa dello zaino: usa caffe', uso: 'usa <cosa>', senzaEventi: true,
    async fai(ctx) {
      const x = NEGOZIO.find((n) => n.id === pezzo(ctx.args.join(' '))?.id)
      if (!x) return ctx.dì({ colore: 'rosso', d: 'cosa? Guarda lo <code>zaino</code>.' })
      if (!zaino.ha(x.id)) return ctx.dì({ colore: 'grigio', d: `non hai :${x.id}: ${x.nome}. Nel negozio costa ${ctx.fmt(x.prezzo)}.` })
      if (x.tipo === 'cassa') return ctx.esegui(`apri ${x.id}`, { muto: true })
      if (x.id === 'gratta') return ctx.esegui('gratta', { muto: true })
      if (x.tipo === 'attrezzo') return ctx.dì({ colore: 'ambra', d: `:${x.id}: ${x.nome} si usa da sola: ${x.cosa}` })
      if (x.tipo === 'tieni' && x.id !== 'cornetto') return ctx.dì({ colore: 'ambra', t: `:${x.id}: ${x.nome}`, d: `non si usa: basta averlo nello zaino. ${x.cosa}`, campi: testoBonus(x.bonus) ? [['bonus attivo', testoBonus(x.bonus)]] : [] })
      if (x.id === 'cornetto') return ctx.dì({ colore: 'ambra', d: ':cornetto: il cornetto lavora da solo: quando muori, si rompe lui.' })
      if (x.id === 'esca') return ctx.dì({ colore: 'ambra', d: ':esca: l’esca si mette da sola sull’amo alla prossima pescata.' })
      zaino.togli(x.id)
      zaino.attiva(x.id, x.effetto)
      ctx.dì({ t: `:${x.id}: ${x.nome}`, d: `${x.cosa} ${zaino.effetto(x.id) ? `Dura ancora ${ctx.durata(zaino.stato().effetti[x.id] - Date.now())}.` : ''}` })
    },
  },
  {
    nomi: ['info', 'cosa'], cat: 'negozio', icona: 'quiz', breve: 'cos’è una cosa: info luccio', uso: 'info <cosa>', senzaEventi: true,
    async fai(ctx) {
      const x = pezzo(ctx.args.join(' '))
      if (!x) return ctx.dì({ colore: 'rosso', d: 'cosa? Un nome del negozio, un pesce, una bestia, un reperto.' })
      ctx.dì({ colore: 'blu', t: `:${x.id}: ${x.nome}`, d: x.cosa ?? (x.leggendario ? 'leggendario: ne esce uno ogni cento.' : x.raro ? 'raro.' : x.schifo ? 'vale niente. Ma l’hai preso tu.' : 'si vende.'),
        campi: [x.prezzo ? ['costa', ctx.pzkHtml(x.prezzo)] : ['vale', ctx.pzkHtml(x.vale)], ['ne hai', String(zaino.quanti(x.id))], ...(testoBonus(x.bonus) ? [['bonus', testoBonus(x.bonus) + (x.tipo === 'usa' && x.effetto ? ` per ${ctx.durata(x.effetto)}` : ' finché ce l’hai')]] : [])],
        azioni: x.prezzo ? [[`compra ${x.id}`, 'compra', 'oro'], ...(zaino.ha(x.id) && x.tipo === 'usa' ? [[`usa ${x.id}`, 'usa']] : [])] : [] })
    },
  },
  {
    nomi: ['apri', 'open', 'cassa'], cat: 'negozio', icona: 'cassa-rara', breve: 'apri una cassa: apri comune / rara / gonzaga', uso: 'apri <cassa>', senzaEventi: true,
    async fai(ctx) {
      const che = ctx.args.join(' ').toLowerCase().replace(/^cassa[- ]?/, '')
      const id = ['comune', 'rara', 'gonzaga'].find((k) => che.startsWith(k) || che === `cassa-${k}`)
      const cassa = id ? `cassa-${id}` : null
      if (!cassa) return ctx.dì({ colore: 'rosso', d: 'quale? <code>apri comune</code>, <code>apri rara</code>, <code>apri gonzaga</code>.' })
      if (!zaino.togli(cassa)) return ctx.dì({ colore: 'grigio', d: `non hai una :${cassa}: ${nomeDi(cassa)}. Nel negozio costa ${ctx.fmt(PER_ID[cassa].prezzo)}.` })
      const s = ctx.dì({ colore: 'ambra', av: 'bot-pensa', t: `:${cassa}: si apre…`, d: 'il lucchetto cigola.' })
      await ctx.inVista(s, 1400)
      const r = pesca(CASSE[cassa], ctx)
      zaino.conta('casse')
      if (r.niente) return ctx.aggiorna(s, { colore: 'grigio', av: 'bot-triste', t: `:${cassa}: vuota`, d: `dentro: ${r.niente}` })
      if (r.pzk) { const n = ctx.paga(ctx.tra(r.pzk[0], r.pzk[1]), { puro: true }); return ctx.aggiorna(s, { colore: 'oro', av: 'bot-ricco', t: `:${cassa}: $pzk!`, d: `dentro: ${ctx.pzkHtml(n)}.` }) }
      zaino.aggiungi(r.oggetto, r.n ?? 1)
      ctx.aggiorna(s, { colore: PER_ID[r.oggetto]?.leggendario ? 'oro' : 'verde', av: 'bot-ride', t: `:${cassa}: :${r.oggetto}:`, d: `dentro: <b>${nomeDi(r.oggetto)}</b>${r.n > 1 ? ` × ${r.n}` : ''}.${PER_ID[r.oggetto]?.vale ? ` Vale ${ctx.fmt(PER_ID[r.oggetto].vale)}: «vendi ${r.oggetto}» quando vuoi.` : ''}` })
    },
  },
  {
    nomi: ['gratta', 'scratch'], cat: 'negozio', icona: 'gratta', breve: 'gratta e vinci: 3×3, tre uguali e vinci', uso: 'gratta', senzaEventi: true,
    async fai(ctx) {
      if (!zaino.togli('gratta')) return ctx.dì({ colore: 'grigio', d: `non hai un :gratta: gratta e vinci. Nel negozio costa ${ctx.fmt(PER_ID.gratta.prezzo)}: «compra gratta».` })
      // nove caselle: un simbolo ne ha tre (o no), gli altri sparsi. Vince il 35 % delle volte.
      const SIMBOLI = [['ciliegia', 150], ['limone', 200], ['campana', 400], ['trifoglio', 600], ['diamante', 1500], ['chiocciola-oro', 5000]]
      const vince = Math.random() < 0.35
      const [vinc] = vince ? SIMBOLI[Math.min(SIMBOLI.length - 1, Math.floor(-Math.log(Math.random()) * 1.4))] : [null]
      let celle = []
      if (vince) celle = [vinc, vinc, vinc]
      while (celle.length < 9) { const s = ctx.caso(SIMBOLI)[0]; if (celle.filter((x) => x === s).length < 2 || (vince && s === vinc && celle.filter((x) => x === s).length < 3)) celle.push(s) }
      celle.sort(() => Math.random() - 0.5)
      const s = ctx.dì({ colore: 'ambra', t: ':gratta: gratta e vinci', d: 'gratta le nove caselle (clicca): tre simboli uguali e vinci.' })
      let grattate = 0
      await ctx.scegli(s, celle.map((c, i) => ({ id: String(i), eti: '?', stile: 'nero' })), 0, { griglia: 'g3', onPremuto: (id, b) => { b.innerHTML = ctx.icona(celle[id]); b.classList.add('aperta'); b.disabled = true; return ++grattate >= 9 ? 'fine' : 'continua' } })
      const conta = {}
      for (const c of celle) conta[c] = (conta[c] ?? 0) + 1
      const tris = Object.entries(conta).find(([, n]) => n >= 3)?.[0]
      if (!tris) return ctx.scheda({ colore: 'grigio', av: 'bot-triste', d: 'niente tris. Il prossimo, forse.' })
      const premio = ctx.paga(SIMBOLI.find(([k]) => k === tris)[1], { puro: true })
      zaino.conta('vinti', premio)
      ctx.scheda({ colore: 'oro', av: 'bot-ricco', t: `:${tris}: tris!`, d: `tre :${tris}:: ${ctx.pzkHtml(premio)}.` })
    },
  },
]
export { NEGOZIO_COMANDI as NEGOZIO }
