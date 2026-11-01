// La logica della Lavatrice (26.10, Alberto: «una lavatrice di denaro che ti permette in solo 10 minuti di pulire fino a 50000
// pzk: costa 2000 pzk puliti»), pronta per l'app del cercapersone zero che ancora non c'è (telefono/zero/os/): i soldi sporchi
// (il bottino delle rapine: api/_economia.mjs) diventano puliti. Si sceglie quanto (al più 50.000, al più quelli che si
// hanno), si paga la commissione alla cassa di pzk e dopo dieci minuti sono puliti (pzk.lava, cioè api/wallet.mjs, lava; il
// server li pulisce alla prima richiesta dopo la fine; ritira li prende subito). Una lavatrice alla volta; in galera non
// parte, quello che gira finisce lo stesso. Senza lavarli, i soldi sporchi si puliscono da soli dopo 96 giorni.
//
// DAL 29.10 SI COMPRA NEL PZKSTORE (telefono/app/pzkstore.js: 5.000 $pzk puliti, una volta; in chat «installa lavatrice»):
// non è più nella home di tutti. Chi quel giorno aveva soldi sporchi, un lavaggio in corso o l'aveva già usata se la tiene,
// regalata.
//
// (31.10) L'interfaccia HTML di qui (la macchina ferma col display, il cursore di quanto lavare, la tabellina del dopo, il
// conto alla rovescia) se n'è andata col cercapersone vecchio: restano le regole, lo stato, i conti del dopo e la storia.
// Le regole di quella rifatta il 29.10 (Alberto: «migliora app lavatrice») valgono anche per lo zero: di serie si lava il
// massimo, perché la commissione è fissa (2.000 sia per 3.000 sia per 50.000); si dice come sarai dopo, quanto si perde in
// percentuale, quanti lavaggi servono ancora, l'avviso se si lava meno della commissione; niente cose che si muovono da sole.

import * as pzk from '../../games/pzk.js'

// le regole del server (LAVA in api/_economia.mjs: il browser non la può importare)
export const MAX = 50000, COSTO = 2000, DURATA = 10 * 60_000
export const mmss = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }
export const ora = (t) => new Date(t).toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' })
export const quando = (t) => new Date(t).toLocaleString('it-IT', { timeZone: 'Europe/Rome', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
export const pct = (a, b) => `${(Math.round((1000 * a) / b) / 10).toLocaleString('it-IT')} %`

/** Com'è adesso: gli sporchi e i puliti, il lavaggio (gira o è pronto da ritirare), la galera, quanto si può lavare al più,
 *  quando i primi sporchi si puliscono da soli. */
export function stato() {
  const sp = pzk.sporchi(), pu = pzk.puliti(), lav = pzk.lavaggio(), gira = !!lav && lav.fino > Date.now()
  return { sp, pu, lav, gira, pronto: !!lav && !gira, dentro: pzk.inGalera(), max: Math.min(MAX, sp), pulizia: pzk.conto()?.pulizia ?? null }
}
/** Come sarai dopo un lavaggio di q: gli sporchi che restano, i lavaggi che servono ancora, i puliti di poi, quanto ci
 *  guadagni (meno di zero: lavi meno della commissione e ci perdi). */
export function dopo(q, sp, pu) {
  const restano = sp - q
  return { restano, ancora: Math.ceil(restano / MAX), puliti: pu - COSTO + q, guadagno: q - COSTO, commissione: pct(COSTO, q) }
}
/** Le mosse del conto che parlano di soldi sporchi: il tipo → [nome, cosa, segno]. */
export const STORIA = { rapina: ['rapina alla cassa', 'sporchi in più', ''], lavatrice: ['commissione della lavatrice', 'puliti', 'meno'], lavati: ['lavaggio finito', 'ora puliti', 'piu'], puliti: ['puliti dal tempo (96 giorni)', 'ora puliti', 'piu'] }
export const storia = (c) => (c?.mosse ?? []).filter((x) => STORIA[x.tipo]).reverse()

/** Mette in lavatrice q sporchi (la banca prende la commissione). → { ok, fatto: { lavaggio: { n, fino } } } | { ok: false, errore } */
export const lava = (q) => pzk.lava(q)
/** Il lavaggio è pronto: lo ritira subito (sincronizzando il conto). → { ok, n } | { ok: false, errore } */
export async function ritira() {
  const n = pzk.lavaggio()?.n ?? 0
  const d = await pzk.sincronizza()
  return d.ok ? { ok: true, n } : { ok: false, errore: d.errore }
}
