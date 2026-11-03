// Pagina /tempo/: la macchina del tempo, copiata dalla Wayback Machine di
// Internet Archive. Sopra la barra: il marchio, il selettore del sito (al posto del
// campo dell'indirizzo), «salvata N volte tra … e …», l'istogramma con una barra per
// giorno alta quanti commit ha avuto quel giorno (da git, cioè da GitHub), le frecce con
// la data della cattura precedente e successiva; sotto il commit della cattura con le sue
// statistiche e, a richiesta, i «momenti»: il giorno su un righello di 24 ore coi commit
// uno per uno, e quando lavoravo su tutto il sito. Sotto la barra la pagina com'era quel
// giorno: gli HTML veri dal server di casa (site.archivio) in un iframe, altrimenti la foto.
// Le versioni le ricostruisce tools/tempo/tempo.mjs (manifesti in src/data/tempo/).
// Alberto, 3.11.2026: «fai proprio una copia di Wayback Machine, niente altri strumenti,
// metti la barra sopra e l'istogramma in base ai commit di github»; poi, lo stesso giorno,
// i siti diventano cinque (rivaltasulmincio.it, cascinafontana.xyz, pzkko.it,
// bettercallpekko.it) con «un selettore del repo» e «più statistiche nel commit».

import { html, esc } from '../html.js'
import { site } from '../../data/site.js'
import { siti, aggiornato } from '../../data/tempo.js'
import { istogramma, conteggio, chips, corta, lunga, foto, dominio, datiPagina, momentiSito, momentiGiorno } from './tempo-pezzi.js'

export function tempoPage() {
  const dati = datiPagina(siti)
  const sito = dati[0]
  const lista = sito.versioni
  const corrente = [...lista].reverse().find((v) => v.foto) || lista.at(-1)
  const i0 = corrente.n - 1
  const prev = lista[i0 - 1]
  const next = lista[i0 + 1]
  const isto = istogramma(lista, i0)

  return html`
    <div class="wb" data-tempo data-no-ink>
      <div class="wb__bar" role="region" aria-label="La macchina del tempo" data-tm-bar>
        <div class="wb__row">
          <a class="wb__logo" href="/" aria-label="Archivio di Alberto Pecchini — torna al sito di oggi">
            <span class="wb__logo-top">ARCHIVIO DI ALBERTO</span>
            <span class="wb__logo-big">Macchina del tempo</span>
          </a>
          <div class="wb__url">
            <label class="sr-only" for="wb-sito">Sito e repository</label>
            <span class="wb__select">
              <select class="wb__input" id="wb-sito" data-tm-sito>
                ${dati.map((s) => `<option value="${s.id}">${esc(s.url.replace('https://', ''))}/ · ${s.versioni.length} catture</option>`)}
              </select>
            </span>
            <a class="wb__go" href="${esc(sito.url)}/" target="_blank" rel="noopener" data-tm-oggi title="Il sito com'è oggi">Oggi</a>
          </div>
          <div class="wb__graph">
            <p class="wb__count" data-tm-count>${conteggio(sito)}</p>
            <div class="wb__spark" data-tm-spark style="--n:${isto.n}" role="group" aria-label="Catture per giorno: una barra per giorno, alta quanti commit">${isto.barre}</div>
            <div class="wb__months" aria-hidden="true" data-tm-months style="--n:${isto.n}">${isto.mesi}</div>
            <div class="wb__tip" data-tm-tip hidden aria-hidden="true">
              <img class="wb__tip-img" data-tm-tip-img alt="" width="160" height="100" decoding="async" data-no-srcset>
              <span class="wb__tip-date" data-tm-tip-date></span>
              <span class="wb__tip-n" data-tm-tip-n></span>
            </div>
          </div>
          <div class="wb__nav" aria-live="polite">
            <a class="wb__arrow wb__arrow--prev" href="${prev ? `#v=${prev.short}` : '#'}" data-tm-prev aria-label="Cattura precedente"${prev ? '' : ' aria-disabled="true"'}>
              <span class="wb__tri" aria-hidden="true">◀</span>
              <span class="wb__arrow-date" data-tm-prev-date>${prev ? corta(prev.data) : '—'}</span>
            </a>
            <div class="wb__current">
              <span class="wb__day" data-tm-date>${corta(corrente.data)}</span>
              <span class="wb__time" data-tm-time>${corrente.ora}:00</span>
              <span class="wb__n">cattura <span data-tm-n>${corrente.n}</span> di <span data-tm-tot>${lista.length}</span></span>
            </div>
            <a class="wb__arrow wb__arrow--next" href="${next ? `#v=${next.short}` : '#'}" data-tm-next aria-label="Cattura successiva"${next ? '' : ' aria-disabled="true"'}>
              <span class="wb__arrow-date" data-tm-next-date>${next ? corta(next.data) : '—'}</span>
              <span class="wb__tri" aria-hidden="true">▶</span>
            </a>
          </div>
          <div class="wb__about">
            <span class="wb__about-label">Questa cattura</span>
            <a class="wb__commit" href="${esc(sito.github)}/commit/${corrente.sha}" target="_blank" rel="noopener" title="${esc(corrente.msg)}" data-tm-github><code data-tm-sha>${corrente.short}</code> <span data-tm-msg>${esc(corrente.msg)}</span></a>
            <span class="wb__chips" data-tm-chips>${chips(corrente)}</span>
            <button class="wb__more" type="button" aria-expanded="false" aria-controls="wb-momenti" data-tm-more>Momenti <span aria-hidden="true">▾</span></button>
            <!-- il credito di ogni pagina (CLAUDE.md): qui non c'è il piè di pagina del sito, la barra è il guscio -->
            <a class="wb__credit" href="${esc(site.url)}" rel="author">Sito di ${esc(site.name)}</a>
          </div>
        </div>
        <div class="wb__drawer" id="wb-momenti" data-tm-drawer hidden>
          <div class="wb__drawer-in">
            <section class="wb__day-box" data-tm-giorno>${momentiGiorno(corrente, undefined, sito)}</section>
            <section class="wb__site-box" data-tm-momenti>${momentiSito(sito)}</section>
          </div>
          <p class="wb__privacy">Ore e giorni in ora italiana, presi dai commit già pubblici su GitHub. Niente nomi né indirizzi email: degli autori si conta solo se c’era un assistente. Nelle pagine di allora l’indirizzo di casa e i numeri che non uso più non compaiono. Aggiornato il ${esc(lunga(aggiornato))}.</p>
        </div>
      </div>

      <div class="wb__page" data-tm-page data-tm-archivio="${esc(site.archivio)}">
        <!-- la pagina vera, dal server di casa (quando è acceso): l'HTML di quel giorno, navigabile -->
        <iframe class="wb__frame" data-tm-frame title="${esc(dominio(sito.url))} com’era, dal vivo" hidden loading="eager" referrerpolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-popups allow-forms"></iframe>
        <p class="wb__live label" data-tm-live hidden>pagina vera, servita dal server di casa · <a href="#" data-tm-apri target="_blank" rel="noopener">aprila in una scheda</a></p>
        <p class="wb__err" data-tm-err${corrente.foto ? ' hidden' : ''}>${corrente.foto ? '' : corrente.errore ? `Questa cattura non si ricostruisce più: ${esc(corrente.errore)}.` : 'Questa cattura è ancora in ricostruzione: torna fra poco.'}</p>
        <picture class="wb__pic">
          <source media="(max-width: 600px)" srcset="${corrente.foto ? foto(sito.id, corrente.short, 'm') : ''}" data-tm-src-m>
          <img class="wb__shot" src="${corrente.foto ? foto(sito.id, corrente.short, 'd') : ''}" width="960" height="${corrente.dh || 800}" alt="${esc(dominio(sito.url))} il ${lunga(corrente.data)}" decoding="async" data-tm-shot data-no-srcset>
        </picture>
      </div>
      <script type="application/json" data-tm-data>${JSON.stringify(dati).replace(/</g, '\\u003c')}</script>
    </div>
  `
}
