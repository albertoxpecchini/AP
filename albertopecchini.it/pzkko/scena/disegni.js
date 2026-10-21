// Le immagini disegnate da gpt-image-2 su Replicate che la scena adatta ai suoi modelli: la roba per terra
// (spazzatura.js, art/scena/terra/), il fronte del negozio e la facciata (fronte.js, art/scena/fronte/ e gli atlanti di
// art/scena/muro/). Arrivano in due giri: subito l'anteprima (lo/, piccola: tools/pzkko/scena/anteprime.mjs e
// atlanti.mjs), poi la vera, che le prende il posto quando arriva, una per fotogramma (aggiorna) mentre la telecamera si
// avvicina; regole() le prepara tutte e due uguali (ripetizione, spazio colore). Se l'anteprima non c'è si aspetta la
// vera (il materiale deve nascere con la sua trama: aggiungerla dopo vorrebbe dire ricompilarlo); se non arriva niente,
// t è null e il materiale resta col suo colore (la scena parte lo stesso).
import { immagine } from './materiali.js'

const scambi = [], giro = { n: 0, a: 0 }, dopo = []
export const foto = async (cartella, nome, regole = () => {}) => {
  const carica = (src) => immagine(src).then((t) => { regole(t); return t }, () => null)
  // (la vera si chiede quando la scena lo dice, vere(): dopo le anteprime dei volantini, che insieme alle vere si
  // rubavano la banda; senza anteprima subito)
  const lo = await carica(cartella + 'lo/' + nome + '.webp')
  let chiedi
  const vera = lo ? new Promise((ok) => { chiedi = () => ok(carica(cartella + nome + '.webp')) }) : carica(cartella + nome + '.webp')
  if (chiedi) dopo.push(chiedi)
  const t = lo ?? (await vera)
  if (!t) console.warn('scena 3D: manca', cartella + nome)
  return { t, vera }
}
// la vera al posto dell'anteprima nel materiale (map, normalMap…), quando arriva; l'anteprima si toglie dalla scheda. Più
// materiali possono avere la stessa trama (gli atlanti): si passa un elenco
export const poi = (f, mat, ...chiavi) => {
  if (!f.t) return
  giro.n++
  const mats = [mat].flat()
  f.vera.then((t) => scambi.push(() => { if (t && t !== f.t) { for (const m of mats) for (const k of chiavi) m[k] = t; f.t.dispose() } giro.a++ }))
}
// aggiorna: una trama vera al posto della sua anteprima per fotogramma; avanzamento: quante sono arrivate (0..1);
// vere: chiede le trame vere (la scena lo dice quando le anteprime dei volantini sono a bordo)
export const disegni = {
  aggiorna: () => { if (scambi.length) scambi.shift()() },
  avanzamento: () => (giro.n ? giro.a / giro.n : 1),
  vere: () => { for (const c of dopo.splice(0)) c() },
}
