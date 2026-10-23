// L'app Foto (23.10): le foto vere che usano i quiz (chat/immagini.js: Mantova, il cibo, il Landini, il Ciao…), da Wikimedia
// Commons con l'autore e la licenza scritti sotto ognuna; una voce con `imgur` al posto di `url` arriva da Imgur. Si toccano
// e si guardano grandi, con le frecce (anche quelle della tastiera) per passare alla prossima.

import { IMMAGINI, src, credito } from '../../chat/immagini.js'
import { tieni, ricordo, ricorda } from '../ricordi.js'

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const IDS = Object.keys(IMMAGINI)
let host = null, ctx = null
// la foto aperta si ricorda (telefono/ricordi.js), come il punto della griglia
let { aperta } = ricordo('foto', { aperta: -1 })
if (!(aperta < IDS.length)) aperta = -1

function disegna() {
  host.innerHTML = `${ctx.testata('Foto', `<span class="t-sh-piede" style="margin:0">${IDS.length} foto</span>`)}
    <div class="t-corpo-app t-fo">
      <p class="t-fo-intro">Le foto dei quiz: Mantova, la sua cucina e le cose del muro. Sono di Wikimedia Commons, ognuna col suo autore.</p>
      <div class="t-fo-griglia">${IDS.map((id, i) => `<button type="button" data-i="${i}"><img src="${esc(src(id))}" alt="${esc(IMMAGINI[id].cosa)}" loading="lazy" referrerpolicy="no-referrer"><span>${esc(IMMAGINI[id].cosa)}</span></button>`).join('')}</div>
    </div>`
  if (aperta >= 0) vista()
}

function vista() {
  ricorda('foto', { aperta })
  host.querySelector('.t-fo-vista')?.remove()
  const id = IDS[aperta], x = IMMAGINI[id]
  const v = document.createElement('div')
  v.className = 't-fo-vista'
  v.innerHTML = `<img data-chiudi title="tocca per tornare alle foto" src="${esc(src(id))}" alt="${esc(x.cosa)}" referrerpolicy="no-referrer">
    <footer><button type="button" data-passo="-1" aria-label="la foto prima">‹</button><div><b>${esc(x.cosa)}</b>${x.pagina ? `<a href="${esc(x.pagina)}" target="_blank" rel="noopener">${esc(credito(id))}</a>` : ''}</div><button type="button" data-passo="1" aria-label="la foto dopo">›</button></footer>`
  host.appendChild(v)
}

function clic(e) {
  const i = e.target.closest('[data-i]'), p = e.target.closest('[data-passo]')
  if (i) { aperta = Number(i.dataset.i); return vista() }
  if (p) { aperta = (aperta + Number(p.dataset.passo) + IDS.length) % IDS.length; return vista() }
  if (e.target.closest('[data-chiudi]')) { aperta = -1; ricorda('foto', { aperta }); host.querySelector('.t-fo-vista')?.remove() }
}

export function monta(h, c) {
  host = h; ctx = c
  tieni(host, 'foto')
  host.addEventListener('click', clic)
  host.addEventListener('click', (e) => { if (e.target.closest('.t-indietro') && aperta >= 0) { e.stopPropagation(); aperta = -1; ricorda('foto', { aperta }); host.querySelector('.t-fo-vista')?.remove() } }, true)
  document.addEventListener('keydown', (e) => { if (host.hidden || aperta < 0) return; if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { aperta = (aperta + (e.key === 'ArrowRight' ? 1 : -1) + IDS.length) % IDS.length; vista() } })
  disegna()
  return { mostra: () => {} }
}
