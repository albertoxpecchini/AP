// I pezzi delle Sfide (23.10) in comune con le sfide del cercapersone zero (telefono/zero/os/sfide.js): dove si fa ogni sfida
// e il conto alla rovescia per le sfide nuove. Le sfide, la serie e i premi sono di chat/sfide.js (dal 31.10 riscuotere è
// un'azione della banca). (31.10) L'interfaccia HTML di qui (le tre sfide in grande, la serie, il bonus del giorno) se n'è
// andata col cercapersone vecchio.

// dove si fa ogni sfida: [app, comando per la chat]
export const DOVE = { pesca: ['chat', 'pesca'], caccia: ['chat', 'caccia'], scava: ['chat', 'scava'], comandi: ['chat', 'aiuto'], guadagna: ['chat', 'lavora'], vinci: ['chat', 'slot 20'], compra: ['negozio'], quiz: ['quiz'], lavora: ['chat', 'lavora'], missione: ['missioni'] }

/** Quanto manca a mezzanotte (di Mantova), quando arrivano le sfide nuove: «3 h 05 min». */
export function aMezzanotte() {
  const p = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false }).formatToParts(new Date())
  const v = (t) => Number(p.find((x) => x.type === t).value)
  const s = 86400 - ((v('hour') % 24) * 3600 + v('minute') * 60 + v('second'))
  return `${Math.floor(s / 3600)} h ${String(Math.floor((s % 3600) / 60)).padStart(2, '0')} min`
}
