// L'altra pagina col 3D, preparata mentre si guarda questa: il caricamento in index.html la chiede quando la telecamera
// è arrivata e il browser è libero (la storia dalla home; la home dalla storia e dalla 404). Si scaricano nella cache del
// browser la pagina e quello che vorrà la sua scena: le foto dei suoi volantini (le anteprime e le vere, vol/ o vol-m/
// come qui, coi nomi di fogli.js), le immagini dei suoi graffiti, manifesti e pezzi, le Live Photo e la foto sfocata del
// suo caricamento con la luce di adesso. I moduli, la strada, la roba per terra, il fronte e il pomodoro sono gli stessi
// di qui, già in cache. Così chi ci va dopo qualche secondo (e chi torna indietro) la trova già scaricata: resta da
// costruire la scena, il tempo del pomodoro.
// Coi «prefetch» del browser, a priorità minima (Chrome le tiene cinque minuti senza ridomandarle al server); dove non
// ci sono (Safari), con fetch a priorità bassa. Con «risparmia dati» o la rete 2G, niente.
import { slug } from './fogli.js'

let fatta = false

export async function prepara(percorso, luce) {
  const rete = navigator.connection
  if (fatta || rete?.saveData || /2g/.test(rete?.effectiveType ?? '')) return
  fatta = true
  const t0 = performance.now()
  const telefono = matchMedia('(max-width:899px)').matches, cartella = telefono ? 'vol-m' : 'vol'
  const html = await fetch(percorso, { priority: 'low' }).then((r) => (r.ok ? r.text() : ''))
  if (!html) return
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const manifesto = await fetch(`/art/scena/${cartella}.json`).then((r) => r.json()).catch(() => ({}))
  const url = new Set([percorso])
  // come fogli.js: i volantini e le cose fatte in HTML (.foto) con le foto di cattura.mjs, il resto con l'immagine della
  // pagina (le illustrazioni dei volantini, img.arte, al 3D non servono: sono nella foto)
  for (const el of doc.querySelectorAll('.parete .it')) {
    if (el.dataset.scena === 'no') continue
    if (el.classList.contains('vol') || el.classList.contains('foto')) {
      const nome = slug(el.id || el.querySelector('h3, .titolo')?.textContent || 'foglio'), dati = manifesto[nome]
      if (!dati) continue
      const f = `${nome}${dati.tagliandi ? '-senza' : ''}.webp`
      url.add(`/art/scena/${cartella}-lo/${f}`).add(`/art/scena/${cartella}/${f}`)
      if (dati.tagliandi) url.add(`/art/scena/${cartella}/${nome}.webp`)
    } else {
      const src = (el.tagName === 'IMG' ? el : el.querySelector('img'))?.getAttribute('src')
      if (src) url.add(src)
    }
    for (const v of el.querySelectorAll('video[src]')) url.add(v.getAttribute('src'))
  }
  // la foto sfocata del suo caricamento (FOTO, nel suo script: la 404 non ne ha)
  try {
    const foto = JSON.parse(html.match(/ {2}const FOTO = (.*)\n/)?.[1] ?? 'null')?.[telefono ? 'telefono' : 'computer']?.v[luce]
    if (foto) url.add(foto)
  } catch {}
  const prefetch = document.createElement('link').relList?.supports?.('prefetch')
  for (const u of url) {
    if (prefetch) { const l = document.createElement('link'); l.rel = 'prefetch'; l.href = u; document.head.appendChild(l) }
    else fetch(u, { priority: 'low' }).catch(() => {})
  }
  console.info(`pzkko: preparo ${percorso} (${url.size} file) in ${((performance.now() - t0) / 1000).toFixed(1)} s`)
}
