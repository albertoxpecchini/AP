// Il led rosso del cercapersone (23.10), come la spia del disco o del processore di un PC: sfarfalla a caso finché qualcosa
// lavora, e si spegne quando il lavoro è finito. Lo accendono le richieste al server (ogni fetch della pagina: i salvataggi
// dello zaino, il database dei giocatori, le notizie, il meteo, la borsa), il bot che pensa e scrive (chat.js), le app che
// si caricano (telefono.js). Vale per il led del tasto piccolo (.chat-tasto .ct-led) e per quello del cercapersone grande
// (.t-led): chi ha un led lo collega con collega(el). La classe che si accende è «lavora».
//
//   inizia() / finisci()   un lavoro lungo (si contano: il led lavora finché ce n'è uno)
//   colpo(ms)              un lavoro breve: qualche sfarfallio per ms millisecondi
//   mentre(promessa)       il led lavora finché la promessa non finisce

const RIDOTTO = matchMedia('(prefers-reduced-motion: reduce)')
const leds = new Set()
let lavori = 0, finoA = 0, timer = 0

export function collega(el) { if (el) leds.add(el) }
export function inizia() { lavori++; batti() }
export function finisci() { lavori = Math.max(0, lavori - 1); finoA = Math.max(finoA, Date.now() + 90) }
export function colpo(ms = 220) { finoA = Math.max(finoA, Date.now() + ms); batti() }
export async function mentre(promessa) { inizia(); try { return await promessa } finally { finisci() } }

/** Lo sfarfallio: acceso o spento a caso, a scatti irregolari (da 18 a 78 ms), come una spia vera. */
function batti() {
  if (timer || !leds.size) return
  const giro = () => {
    const attivo = lavori > 0 || Date.now() < finoA
    if (!attivo) { timer = 0; for (const l of leds) l.classList.remove('lavora'); return }
    const acceso = RIDOTTO.matches ? true : Math.random() < 0.5
    for (const l of leds) l.classList.toggle('lavora', acceso)
    timer = setTimeout(giro, RIDOTTO.matches ? 200 : 18 + Math.random() * 60)
  }
  giro()
}

// le richieste al server: ogni fetch della pagina accende il led finché non risponde
if (!window.__pzkkoLedFetch) {
  window.__pzkkoLedFetch = true
  const originale = window.fetch.bind(window)
  window.fetch = (...a) => { inizia(); return originale(...a).finally(finisci) }
}
