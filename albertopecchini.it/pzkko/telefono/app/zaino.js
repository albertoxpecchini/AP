// La logica dello Zaino (23.10) in comune con lo zaino del cercapersone zero (telefono/zero/os/zaino.js): i filtri, il tipo
// di un pezzo, i tasti di un pezzo («usa» si consuma, «apri», «gratta» e «vendi» li fa la chat, «compra ancora» lo shop),
// usare, il nome corto, il tempo che resta. Quello che hai sta in chat/zaino.js. (31.10) L'interfaccia HTML di qui (la
// griglia, i bonus e gli effetti in corso, la scheda di un pezzo) se n'è andata col cercapersone vecchio.

import * as zaino from '../../chat/zaino.js'
import * as pzk from '../../games/pzk.js'
import { PER_ID, PESCI, ANIMALI, REPERTI, UFFICIO, nomeDi } from '../../chat/testi.js'

const VENDIBILI = new Set([...PESCI, ...ANIMALI, ...REPERTI, ...UFFICIO.filter((x) => x.vale > 0)].map((x) => x.id))
export const FILTRI = [['tutto', 'tutto'], ['usa', 'da usare'], ['tieni', 'da tenere'], ['attrezzo', 'attrezzi'], ['cassa', 'casse'], ['vendi', 'da vendere']]
export const tipoDi = (id) => (VENDIBILI.has(id) ? 'vendi' : PER_ID[id]?.tipo ?? 'tieni')
export const resto = (ms) => { const m = Math.ceil(ms / 60000); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min` }

/** I tasti di un pezzo: [{ eti, usa? , chat?, shop?, nero? }] (usa: si consuma qui; chat: il comando che lo fa; shop: lo shop). */
export function azioniDi(id, x) {
  const t = tipoDi(id), b = []
  if (t === 'usa' && x.effetto) b.push({ eti: 'usa', usa: id })
  if (id === 'gratta') b.push({ eti: 'gratta', chat: 'gratta' })
  if (t === 'cassa') b.push({ eti: 'apri', chat: `apri ${id}` })
  if (t === 'vendi') b.push({ eti: 'vendi', chat: `vendi ${id} ${zaino.quanti(id)}` }, { eti: 'vendi tutto', chat: 'vendi tutto', nero: true })
  if (x.prezzo) b.push({ eti: x.unico ? 'allo shop' : 'compra ancora', shop: true, nero: true })
  return b
}
/** Usa un pezzo da usare: si consuma e parte il suo effetto (31.10: lo fa la banca, 'chat.usa'). → il pezzo, o null. */
export async function usa(id) {
  const x = PER_ID[id]
  if (!x?.effetto || !zaino.ha(x.id)) return null
  const r = await pzk.fai('chat.usa', { id: x.id })
  return r.ok ? x : null
}
/** Il nome senza l'articolo («un caffè» → «caffè»). */
export const nomeCorto = (id) => { const x = PER_ID[id]; return x?.nome ? x.nome.replace(/^(un’|un |una |uno |il |la |l’)/i, '') : nomeDi(id) }
