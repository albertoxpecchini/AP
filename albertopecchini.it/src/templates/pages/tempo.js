// La macchina del tempo, copiata dalla Wayback Machine di Internet Archive. Tre pagine,
// tutte statiche e leggere (dal 3.11.2026 sera: «fai che gli altri vedano l'html leggero
// con solo le foto e non che debba scaricare il repo intero ogni volta, un html semplice
// leggibile con percorso completo e univoco»):
//
//   /tempo/                               l'archivio: i cinque siti, con l'ultima cattura
//   /tempo/<dominio>/                     un sito: tutte le catture, mese per mese
//   /tempo/<dominio>/<AAAA-MM-GG>/        una cattura: la barra e la foto
//
// La barra: il marchio, il selettore del sito al posto del campo dell'indirizzo, «salvata N
// volte tra … e …», l'istogramma con una barra per giorno alta quanti commit (ogni barra è un
// link alla sua cattura), le frecce con le date intorno alla cattura corrente; sotto, il
// commit con le statistiche del giorno e i «momenti», già scritti nell'HTML. Le foto vengono
// da Vercel (public/media/tempo/<id>/); la pagina vera di quel giorno, dal server di casa
// (site.archivio), è solo un link: scarica il sito intero di allora, ed è per chi la vuole.
// Le versioni le ricostruisce tools/tempo/tempo.mjs (manifesti in src/data/tempo/).

import { html, esc } from '../html.js'
import { site } from '../../data/site.js'
import { siti, aggiornato } from '../../data/tempo.js'
import { istogramma, conteggio, chips, corta, lunga, foto, dominio, momentiSito, momentiGiorno, sitoPath, catturaPath, vivaUrl, conFoto, num } from './tempo-pezzi.js'

const ultima = (s) => [...s.versioni].reverse().find(conFoto) || s.versioni.at(-1)
const mese = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
const repo = (s) => s.github.replace('https://github.com/', '')
const commitTotali = (s) => (s.momenti?.commit || 0) + (s.momenti?.auto || 0)

// il selettore: ogni sito porta alla sua cattura più recente
const selettore = (attuale) => html`
  <div class="wb__url">
    <label class="sr-only" for="wb-sito">Sito</label>
    <span class="wb__select">
      <select class="wb__input" id="wb-sito" data-tm-sito>
        ${!attuale && '<option value="" selected disabled>Scegli un sito…</option>'}
        ${siti.map((s) => `<option value="${catturaPath(s, ultima(s))}"${attuale?.id === s.id ? ' selected' : ''}>${esc(s.url.replace('https://', ''))}/ · ${s.versioni.length} catture</option>`)}
      </select>
    </span>
    <a class="wb__go" href="${esc((attuale || siti[0]).url)}/" target="_blank" rel="noopener" title="Il sito com'è oggi">Oggi</a>
  </div>
`

const marchio = html`
  <a class="wb__logo" href="/tempo/" aria-label="La macchina del tempo: tutti i siti">
    <span class="wb__logo-top">ARCHIVIO DI ALBERTO</span>
    <span class="wb__logo-big">Macchina del tempo</span>
  </a>
`

// il credito di ogni pagina (CLAUDE.md): qui non c'è il piè di pagina del sito, la barra è il guscio
const credito = `<a class="wb__credit" href="${esc(site.url)}" rel="author">Sito di ${esc(site.name)}</a>`

const privacy = () => `<p class="wb__privacy">Ore e giorni in ora italiana, presi dai commit già pubblici su GitHub. Niente nomi né indirizzi email: degli autori si conta solo se c’era un assistente, e i commit automatici (le catture dei siti) non contano fra i momenti. Nelle pagine di allora l’indirizzo di casa e i numeri che non uso più non compaiono. Aggiornato il ${esc(lunga(aggiornato))}.</p>`

function grafico(s, k) {
  const isto = istogramma(s, k)
  return html`
    <div class="wb__graph">
      <p class="wb__count">${conteggio(s)}</p>
      <div class="wb__spark" data-tm-spark style="--n:${isto.n}" role="group" aria-label="Catture per giorno: una barra per giorno, alta quanti commit">${isto.barre}</div>
      <div class="wb__months" aria-hidden="true" style="--n:${isto.n}">${isto.mesi}</div>
      <div class="wb__tip" data-tm-tip hidden aria-hidden="true">
        <img class="wb__tip-img" data-tm-tip-img alt="" width="160" height="100" decoding="async" data-no-srcset>
        <span class="wb__tip-date" data-tm-tip-date></span>
        <span class="wb__tip-n" data-tm-tip-n></span>
      </div>
    </div>
  `
}

// ── /tempo/<dominio>/<AAAA-MM-GG>/ : una cattura ─────────────────────────────

export function tempoCatturaPage(s, k) {
  const v = s.versioni[k]
  const prev = s.versioni[k - 1]
  const next = s.versioni[k + 1]
  const nome = dominio(s.url)
  return html`
    <div class="wb" data-tempo data-no-ink>
      <div class="wb__bar" role="region" aria-label="La macchina del tempo">
        <div class="wb__row">
          ${marchio}
          ${selettore(s)}
          ${grafico(s, k)}
          <nav class="wb__nav" aria-label="Catture vicine">
            <a class="wb__arrow wb__arrow--prev" href="${prev ? catturaPath(s, prev) : sitoPath(s)}" data-tm-prev aria-label="Cattura precedente"${prev ? '' : ' aria-disabled="true"'}>
              <span class="wb__tri" aria-hidden="true">◀</span>
              <span class="wb__arrow-date">${prev ? corta(prev.data) : '—'}</span>
            </a>
            <div class="wb__current">
              <h1 class="wb__day">${corta(v.data)}</h1>
              <span class="wb__time">${v.ora}:00</span>
              <a class="wb__n" href="${sitoPath(s)}">cattura ${v.n} di ${s.versioni.length}</a>
            </div>
            <a class="wb__arrow wb__arrow--next" href="${next ? catturaPath(s, next) : sitoPath(s)}" data-tm-next aria-label="Cattura successiva"${next ? '' : ' aria-disabled="true"'}>
              <span class="wb__arrow-date">${next ? corta(next.data) : '—'}</span>
              <span class="wb__tri" aria-hidden="true">▶</span>
            </a>
          </nav>
          <div class="wb__about">
            <span class="wb__about-label">Questa cattura</span>
            <a class="wb__commit" href="${esc(s.github)}/commit/${v.sha}" target="_blank" rel="noopener" title="${esc(v.msg)}"><code>${v.short}</code> <span>${esc(v.msg)}</span></a>
            <span class="wb__chips">${chips(v)}</span>
            <button class="wb__more" type="button" aria-expanded="false" aria-controls="wb-momenti" data-tm-more>Momenti <span aria-hidden="true">▾</span></button>
            ${credito}
          </div>
        </div>
        <div class="wb__drawer" id="wb-momenti" data-tm-drawer hidden>
          <div class="wb__drawer-in">
            <section class="wb__day-box">${momentiGiorno(v, s.giorni?.[v.data] || null, s)}</section>
            <section class="wb__site-box">${momentiSito(s)}</section>
          </div>
          ${privacy()}
        </div>
      </div>

      <!-- l'istantanea non ha script, ma il sandbox deve lasciarli accesi: con gli script spenti il
           browser ignora loading="lazy" e scaricava tutte le immagini subito (5,9 MB invece di 0,8) -->
      <div class="wb__page${v.pagina ? ' wb__page--html' : ''}">
        ${
          v.pagina
            ? html`<p class="wb__live">${esc(nome)} il ${esc(lunga(v.data))}${v.titolo ? ` · «${esc(v.titolo)}»` : ''} · l’HTML di quel giorno, ${num(v.pagina.kb)} KB, senza script · <a href="${catturaPath(s, v)}pagina/" target="_blank" rel="noopener">da sola ↗</a> · <a href="${esc(vivaUrl(site.archivio, s, v))}" target="_blank" rel="noopener" title="Dal server di casa di Alberto: il sito intero di quel giorno, può essere lento">il sito intero di allora ↗</a></p>
                <iframe class="wb__frame" src="${catturaPath(s, v)}pagina/" title="${esc(nome)} il ${esc(lunga(v.data))}" sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox" referrerpolicy="no-referrer"></iframe>`
            : `<p class="wb__live">foto di ${esc(nome)} il ${esc(lunga(v.data))}${v.titolo ? ` · «${esc(v.titolo)}»` : ''} · <a href="${esc(vivaUrl(site.archivio, s, v))}" target="_blank" rel="noopener" title="Dal server di casa di Alberto: il sito intero di quel giorno, può essere lento">la pagina vera ↗</a></p>`
        }
        ${
          v.pagina
            ? ''
            : conFoto(v)
            ? html`<picture class="wb__pic">
                <source media="(max-width: 600px)" srcset="${foto(s.id, v.short, 'm')}" width="${v.m.w}" height="${v.m.h}">
                <img class="wb__shot" src="${foto(s.id, v.short, 'd')}" width="${v.d.w}" height="${v.d.h}" alt="${esc(nome)} il ${esc(lunga(v.data))}" fetchpriority="high" decoding="async" data-no-srcset>
              </picture>`
            : `<p class="wb__err">${v.errore ? `Questa cattura non si ricostruisce più: ${esc(v.errore)}.` : 'Questa cattura è ancora in ricostruzione: torna fra poco.'}</p>`
        }
      </div>
    </div>
  `
}

// ── /tempo/<dominio>/ : tutte le catture di un sito, mese per mese ──────────

export function tempoSitoPage(s) {
  const mesi = []
  for (const v of s.versioni) {
    const m = v.data.slice(0, 7)
    if (!mesi.length || mesi.at(-1).m !== m) mesi.push({ m, nome: mese(v.data), versioni: [] })
    mesi.at(-1).versioni.push(v)
  }
  return html`
    <div class="wb" data-tempo data-no-ink>
      <div class="wb__bar" role="region" aria-label="La macchina del tempo">
        <div class="wb__row wb__row--sito">
          ${marchio}
          ${selettore(s)}
          ${grafico(s, -1)}
          <div class="wb__about">
            <span class="wb__about-label">${esc(dominio(s.url))}</span>
            <span>repository <a class="wb__commit" href="${esc(s.github)}" target="_blank" rel="noopener">${esc(repo(s))}</a></span>
            ${credito}
          </div>
        </div>
      </div>
      <main class="wb__list">
        <h1 class="wb__h1">${esc(dominio(s.url))} nella macchina del tempo</h1>
        <p class="wb__muted">${s.versioni.length} catture, una per giorno di lavoro, dal ${esc(lunga(s.versioni[0].data))} al ${esc(lunga(s.versioni.at(-1).data))}. Ogni cattura ha il suo indirizzo: <code>/tempo/${esc(dominio(s.url))}/AAAA-MM-GG/</code>.</p>
        ${mesi.map(
          (m) => html`
            <section class="wb__mese">
              <h2 class="wb__h">${esc(m.nome)}</h2>
              <ol class="wb__giorni">
                ${m.versioni.map(
                  (v) => html`
                    <li>
                      <a class="wb__giorno" href="${catturaPath(s, v)}">
                        ${conFoto(v) ? `<img src="${foto(s.id, v.short, v.foto2 ? 't' : 'd')}" width="320" height="200" alt="" loading="lazy" decoding="async" data-no-srcset>` : '<span class="wb__giorno-vuoto">senza foto</span>'}
                        <span class="wb__giorno-data">${esc(corta(v.data))} · ${v.ora}</span>
                        <span class="wb__giorno-n">${num(v.commit)} commit${v.st?.piu || v.st?.meno ? ` · <b class="wb__plus">+${num(v.st.piu)}</b> <b class="wb__minus">−${num(v.st.meno)}</b>` : ''}</span>
                        <span class="wb__giorno-msg">${esc(v.msg)}</span>
                      </a>
                    </li>
                  `,
                )}
              </ol>
            </section>
          `,
        )}
        <details class="wb__mom">
          <summary>Quando lavoravo su ${esc(dominio(s.url))}</summary>
          ${momentiSito(s)}
        </details>
        ${privacy()}
      </main>
    </div>
  `
}

// ── /tempo/ : l'archivio ───────────────────────────────────────────────────

export function tempoPage() {
  // i vecchi indirizzi (#v=<sha> per albertopecchini.it, #s=<sito>&v=<sha>, fino al 3.11.2026
  // sera) portano alla pagina della loro cattura: sha corto → percorso
  const vecchi = Object.fromEntries(siti.map((s) => [s.id, Object.fromEntries(s.versioni.map((v) => [v.short, catturaPath(s, v)]))]))
  return html`
    <div class="wb" data-tempo data-no-ink>
      <div class="wb__bar" role="region" aria-label="La macchina del tempo">
        <div class="wb__row wb__row--indice">
          ${marchio}
          ${selettore(null)}
          <p class="wb__count">${siti.length} siti, ${num(siti.reduce((n, s) => n + s.versioni.length, 0))} catture, ${num(siti.reduce((n, s) => n + commitTotali(s), 0))} commit</p>
          <div class="wb__about">${credito}</div>
        </div>
      </div>
      <main class="wb__list">
        <h1 class="wb__h1">La macchina del tempo</h1>
        <p class="wb__muted">I siti che ho fatto, com’erano a ogni giorno di lavoro: ricostruiti dal codice di allora e fotografati, come nella Wayback Machine. Ogni cattura ha il suo indirizzo, <code>/tempo/&lt;sito&gt;/AAAA-MM-GG/</code>, con l’istogramma dei commit, le statistiche del giorno e la foto.</p>
        <ul class="wb__siti">
          ${siti.map((s) => {
            const u = ultima(s)
            return html`
              <li class="wb__sito">
                <a class="wb__sito-foto" href="${catturaPath(s, u)}" aria-label="${esc(dominio(s.url))}, l’ultima cattura (${esc(lunga(u.data))})">
                  ${conFoto(u) ? `<img src="${foto(s.id, u.short, u.foto2 ? 't' : 'd')}" width="320" height="200" alt="" decoding="async" data-no-srcset>` : ''}
                </a>
                <h2 class="wb__h"><a href="${catturaPath(s, u)}">${esc(dominio(s.url))}</a></h2>
                <p class="wb__muted">${s.versioni.length} catture dal ${esc(lunga(s.versioni[0].data))} al ${esc(lunga(s.versioni.at(-1).data))} · ${num(commitTotali(s))} commit su ${esc(repo(s))}</p>
                <p class="wb__sito-link"><a href="${sitoPath(s)}">tutte le catture</a> · <a href="${catturaPath(s, s.versioni[0])}">la prima</a> · <a href="${catturaPath(s, u)}">l’ultima</a></p>
              </li>
            `
          })}
        </ul>
        ${privacy()}
      </main>
      <script type="application/json" data-tm-vecchi>${JSON.stringify(vecchi).replace(/</g, '\\u003c')}</script>
    </div>
  `
}

// le rotte delle pagine dei siti e delle catture (routes.js): fuori da sitemap e motori,
// perché le versioni vecchie dei siti dei clienti non finiscano nelle ricerche al posto di oggi
export function tempoRotte() {
  return siti.flatMap((s) => [
    {
      path: sitoPath(s),
      title: `${dominio(s.url)} nella macchina del tempo`,
      description: `Tutte le ${s.versioni.length} versioni di ${dominio(s.url)}, una per giorno di lavoro, ricostruite dal codice e fotografate.`,
      render: () => tempoSitoPage(s),
    },
    ...s.versioni.map((v, k) => ({
      path: catturaPath(s, v),
      title: `${dominio(s.url)} il ${lunga(v.data)} — La macchina del tempo`,
      description: `Com’era ${dominio(s.url)} il ${lunga(v.data)}: ${v.msg}`.slice(0, 300),
      render: () => tempoCatturaPage(s, k),
    })),
  ])
}
