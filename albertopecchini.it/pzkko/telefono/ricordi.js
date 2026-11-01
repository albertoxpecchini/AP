// Le scelte che si ricordano (23.10, Alberto: «applica questa regola a ogni menù del sito e memorizza sempre le azioni degli
// user»): l'ultima app aperta nel cercapersone, la scheda, il filtro, la cosa aperta, il codice scritto nel compilatore.
//
//   ricordo(nome, predef)    le scelte di un'app, con i valori di serie sotto
//   ricorda(nome, scelte)    le salva
//
// (31.10) Fino al cercapersone nero qui c'era anche il punto di quello che scorre nelle sue app in HTML (tieni, riporta,
// dallAlto): con lo zero le app sono di pzk os, a 8 bit, e se ne ricordano il punto da sole.
//
// Tutto in localStorage («pzkko-ricordi»), per chi guarda da questo browser; se il browser non lo lascia, si ricorda
// finché la pagina è aperta.

const CHIAVE = 'pzkko-ricordi'
let R = (() => { try { return JSON.parse(localStorage.getItem(CHIAVE) || '{}') ?? {} } catch { return {} } })()
let attesa = 0
const scriviOra = () => { clearTimeout(attesa); try { localStorage.setItem(CHIAVE, JSON.stringify(R)) } catch {} }
const salva = () => { clearTimeout(attesa); attesa = setTimeout(scriviOra, 300) }
addEventListener('pagehide', scriviOra)
document.addEventListener('visibilitychange', () => { if (document.hidden) scriviOra() })

export const ricordo = (nome, predefinito = {}) => ({ ...predefinito, ...(R[nome]?.scelte ?? {}) })
export function ricorda(nome, scelte) { (R[nome] ??= {}).scelte = scelte; salva() }
