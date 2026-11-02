// Pagina /tempo/: la macchina del tempo, copiata dalla Wayback Machine di
// Internet Archive. Sopra la barra: il marchio, il campo dell'indirizzo, «salvata
// N volte tra … e …», l'istogramma con una barra per giorno alta quanti commit
// ha avuto quel giorno (da git, cioè da GitHub), le frecce con la data della
// cattura precedente e successiva intorno a quella corrente; sotto, la pagina
// com'era quel giorno (la foto a tutta larghezza, che si scorre come una pagina).
// Le versioni le ricostruisce tools/tempo/tempo.mjs (manifesto in src/data/tempo.js);
// gli HTML veri, quando il server di casa è acceso (site.archivio), arrivano in un
// iframe come nella Wayback Machine, altrimenti si vede la foto.
// Alberto, 3.11.2026: «fai proprio una copia di Wayback Machine, niente altri
// strumenti, metti la barra sopra e l'istogramma in base ai commit di github».

import { html, esc } from '../html.js'
import { site } from '../../data/site.js'
import { versioni, aggiornato } from '../../data/tempo.js'

const GITHUB = 'https://github.com/ygpzk/AP/commit/'
const giorno = (iso) => new Date(iso + 'T12:00:00')
const lunga = (iso) => giorno(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
const corta = (iso) => giorno(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '')
const meseCorto = (iso) => giorno(iso).toLocaleDateString('it-IT', { month: 'short' }).replace('.', '').toUpperCase()
const avanti = (iso, n) => {
  const d = giorno(iso)
  d.setDate(d.getDate() + n)
  return d.toLocaleDateString('sv-SE')
}

export function tempoPage() {
  const lista = versioni.map((v) => ({ ...v, foto: v.d ? { d: `/media/tempo/${v.short}-d.webp`, m: `/media/tempo/${v.short}-m.webp` } : null }))
  const corrente = [...lista].reverse().find((v) => v.foto) || lista.at(-1)
  const prima = lista[0]
  const ultima = lista.at(-1)
  const commitTotali = lista.reduce((n, v) => n + v.commit, 0)
  const max = Math.max(...lista.map((v) => v.commit))

  // l'istogramma: un posto per ogni giorno dal primo all'ultimo, anche quelli senza commit
  const perData = new Map(lista.map((v, i) => [v.data, i]))
  const giorni = []
  for (let d = prima.data; d <= ultima.data; d = avanti(d, 1)) giorni.push({ data: d, i: perData.has(d) ? perData.get(d) : -1 })
  const mesi = []
  giorni.forEach((g, k) => {
    const m = g.data.slice(0, 7)
    // un'etichetta per mese; il primo mese, se finisce fra pochi giorni, non la scrive (si accavallerebbe)
    if (!mesi.length || mesi.at(-1).m !== m) mesi.push({ m, k, label: meseCorto(g.data) })
  })

  if (mesi.length > 1 && mesi[1].k - mesi[0].k < 12) mesi.shift()
  const dati = lista.map((v) => ({ n: v.n, sha: v.sha, short: v.short, data: v.data, ora: v.ora, msg: v.msg, commit: v.commit, titolo: v.titolo || '', d: v.foto?.d, m: v.foto?.m, dh: v.d?.h, mh: v.m?.h, errore: v.errore || '' }))
  const i0 = corrente.n - 1
  const prev = lista[i0 - 1]
  const next = lista[i0 + 1]

  return html`
    <div class="wb" data-tempo data-no-ink>
      <div class="wb__bar" role="region" aria-label="La macchina del tempo">
        <div class="wb__row">
          <a class="wb__logo" href="/" aria-label="Archivio di Alberto Pecchini — torna al sito di oggi">
            <span class="wb__logo-top">ARCHIVIO DI ALBERTO</span>
            <span class="wb__logo-big">Macchina del tempo</span>
          </a>
          <form class="wb__url" action="/" method="get">
            <label class="sr-only" for="wb-url">Indirizzo</label>
            <input class="wb__input" id="wb-url" type="url" value="${esc(site.url)}/" readonly>
            <button class="wb__go" type="submit">Vai</button>
          </form>
          <div class="wb__graph">
            <p class="wb__count">Salvata <b data-tm-total>${lista.length}</b> volte tra il <b>${lunga(prima.data)}</b> e il <b>${lunga(ultima.data)}</b> · ${commitTotali} commit su GitHub</p>
            <div class="wb__spark" data-tm-spark style="--n:${giorni.length}" role="group" aria-label="Catture per giorno: una barra per giorno, alta quanti commit">
              ${giorni
                .map((g, k) => {
                  const v = g.i >= 0 ? lista[g.i] : null
                  const h = v ? Math.max(14, Math.round((v.commit / max) * 100)) : 0
                  return v
                    ? `<button class="wb__col${g.i === i0 ? ' is-current' : ''}${v.foto ? '' : ' is-off'}" type="button" style="--k:${k};--h:${h}%" data-tm-go="${g.i}" title="${corta(v.data)} · ${v.commit} commit" aria-label="${lunga(v.data)}, ${v.commit} commit"></button>`
                    : `<span class="wb__col wb__col--empty" style="--k:${k}" aria-hidden="true"></span>`
                })
                .join('')}
            </div>
            <div class="wb__months" aria-hidden="true" style="--n:${giorni.length}">${mesi.map((m) => `<span style="--k:${m.k}">${m.label}</span>`).join('')}</div>
          </div>
          <div class="wb__nav" aria-live="polite">
            <a class="wb__arrow wb__arrow--prev" href="${prev ? `#v=${prev.short}` : '#'}" data-tm-prev aria-label="Cattura precedente"${prev ? '' : ' aria-disabled="true"'}>
              <span class="wb__tri" aria-hidden="true">◀</span>
              <span class="wb__arrow-date" data-tm-prev-date>${prev ? corta(prev.data) : '—'}</span>
            </a>
            <div class="wb__current">
              <span class="wb__day" data-tm-date>${corta(corrente.data)}</span>
              <span class="wb__time" data-tm-time>${corrente.ora}:00</span>
              <span class="wb__n">cattura <span data-tm-n>${corrente.n}</span> di ${lista.length}</span>
            </div>
            <a class="wb__arrow wb__arrow--next" href="${next ? `#v=${next.short}` : '#'}" data-tm-next aria-label="Cattura successiva"${next ? '' : ' aria-disabled="true"'}>
              <span class="wb__arrow-date" data-tm-next-date>${next ? corta(next.data) : '—'}</span>
              <span class="wb__tri" aria-hidden="true">▶</span>
            </a>
          </div>
          <div class="wb__about">
            <span class="wb__about-label">Questa cattura</span>
            <a class="wb__commit" href="${GITHUB}${corrente.sha}" target="_blank" rel="noopener" data-tm-github><code data-tm-sha>${corrente.short}</code> <span data-tm-msg>${esc(corrente.msg)}</span></a>
            <span class="wb__meta"><span data-tm-commit>${corrente.commit}</span> commit quel giorno · aggiornato il ${lunga(aggiornato)}</span>
          </div>
        </div>
      </div>

      <div class="wb__page" data-tm-page data-tm-archivio="${esc(site.archivio)}">
        <!-- la pagina vera, dal server di casa (quando è acceso): l'HTML di quel giorno, navigabile -->
        <iframe class="wb__frame" data-tm-frame title="La home di ${esc(site.name)} com’era, dal vivo" hidden loading="eager" referrerpolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-popups allow-forms"></iframe>
        <p class="wb__live label" data-tm-live hidden>pagina vera, servita dal server di casa · <a href="#" data-tm-apri target="_blank" rel="noopener">aprila in una scheda</a></p>
        <p class="wb__err" data-tm-err${corrente.foto ? ' hidden' : ''}>${corrente.foto ? '' : corrente.errore ? `Questa cattura non si ricostruisce più: ${esc(corrente.errore)}.` : 'Questa cattura è ancora in ricostruzione: torna fra poco.'}</p>
        <picture class="wb__pic">
          <source media="(max-width: 600px)" srcset="${corrente.foto?.m || ''}" data-tm-src-m>
          <img class="wb__shot" src="${corrente.foto?.d || ''}" width="960" height="${corrente.d?.h || 800}" alt="La home di ${esc(site.name)} il ${lunga(corrente.data)}" decoding="async" data-tm-shot data-no-srcset>
        </picture>
      </div>
      <script type="application/json" data-tm-data>${JSON.stringify(dati).replace(/</g, '\\u003c')}</script>
    </div>
  `
}
