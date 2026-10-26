// Pagine /unimore/: l'indice delle materie, una pagina per materia, una per blocco
// (lezione), una per esercizio. Stessa impaginazione delle pagine di testo del sito
// (privacy, crediti): `.legal`.

import { html, esc } from '../html.js'
import { unimore, materiaPath, bloccoPath, esercizioPath } from '../../data/unimore.js'
import { breadcrumb } from '../components/ui.js'

const pad = (n) => String(n).padStart(2, '0')

const titolo = (e) => (e.sottotitolo ? `${e.title} — ${e.sottotitolo}` : e.title)

const crumbsTo = (...items) => [{ label: 'Home', href: '/' }, { label: 'Unimore', href: unimore.path }, ...items]

const shell = ({ crumbs, label, title, lead, toc = '', body = '' }) => html`
  <article class="legal">
    <div class="container legal__wrap">
      ${breadcrumb(crumbs)}
      <header class="legal__head">
        <p class="label">${esc(label)}</p>
        <h1 class="h1">${esc(title)}</h1>
        <p class="lead">${esc(lead)}</p>
      </header>
      ${toc}
      ${body}
    </div>
  </article>
`

const toc = (items) => html`
  <nav class="legal__toc" aria-label="Indice">
    <ol>${items.map((i, n) => `<li><a href="${i.href}"><span class="label">${pad(n + 1)}</span>${esc(i.title)}</a></li>`)}</ol>
  </nav>
`

export function unimorePage() {
  return shell({
    crumbs: [{ label: 'Home', href: '/' }, { label: 'Unimore', href: unimore.path }],
    label: `Unimore · ${pad(unimore.materie.length)} materie`,
    title: 'Materie ed esercizi',
    lead: unimore.description,
    toc: toc(unimore.materie.map((m) => ({ href: materiaPath(m), title: m.title }))),
  })
}

// L'indice a sinistra porta alle pagine dei blocchi; a destra, per ogni blocco, gli esercizi.
export function materiaPage(m) {
  return shell({
    crumbs: crumbsTo({ label: m.title, href: materiaPath(m) }),
    label: `Unimore · ${pad(m.blocchi.length)} blocchi`,
    title: m.title,
    lead: m.lead,
    toc: m.blocchi.length ? toc(m.blocchi.map((b) => ({ href: bloccoPath(m, b), title: b.title }))) : '<p>Ancora nessun esercizio.</p>',
    body: m.blocchi.length
      ? `<div class="legal__body">${m.blocchi.map((b, i) => `<section id="${b.slug}"><h2 class="h3"><span class="label">${pad(i + 1)}</span>${esc(b.title)}</h2><p>${esc(b.lead)}</p><ul>${b.esercizi.map((e) => `<li><a href="${esercizioPath(m, b, e)}">${esc(titolo(e))}</a></li>`).join('')}</ul></section>`).join('')}</div>`
      : '',
  })
}

export function bloccoPage(m, b) {
  return shell({
    crumbs: crumbsTo({ label: m.title, href: materiaPath(m) }, { label: b.title, href: bloccoPath(m, b) }),
    label: `Unimore · ${m.title} · ${pad(b.esercizi.length)} esercizi`,
    title: b.title,
    lead: b.lead,
    toc: toc(b.esercizi.map((e) => ({ href: esercizioPath(m, b, e), title: titolo(e) }))),
  })
}

export function esercizioPage(m, b, e) {
  const tabella = () => `<div class="legal__table" role="region" aria-label="Errori provocati di proposito" tabindex="0"><table>
    <thead><tr><th scope="col">Che cosa togliete</th><th scope="col">Che cosa vi aspettate</th><th scope="col">Che cosa dice il compilatore</th><th scope="col">È partito?</th></tr></thead>
    <tbody>${e.tabella.map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th scope="row">${esc(c)}</th>` : `<td>${i === 2 ? `<code>${esc(c)}</code>` : esc(c)}</td>`)).join('')}</tr>`).join('')}</tbody>
  </table></div>`
  const sezioni = e.tabella
    ? [
        { title: 'Testo', body: e.testo.map((t) => `<p>${esc(t)}</p>`).join('') },
        { title: 'Tabella', body: tabella() },
        { title: 'Note', body: `<ul>${e.note.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>` },
      ]
    : e.svolgimento
    ? [
        {
          title: 'Testo',
          body: `${e.testo.map((t) => `<p>${esc(t)}</p>`).join('')}<ul>${e.richieste.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>`,
        },
        {
          title: 'Programma',
          body: `<pre class="unimore__code"><code>${esc(e.codice)}</code></pre><p>${esc(e.outputDi || 'Output con M = 13 e b = 3:')}</p><pre class="unimore__code"><code>${esc(e.output)}</code></pre>`,
        },
        { title: 'Svolgimento', body: e.svolgimento.map((s) => `<p><strong>${esc(s.titolo)}.</strong> ${esc(s.testo)}</p>`).join('') },
      ]
    : [{ title: 'Svolgimento', body: '<p>In arrivo.</p>' }]
  return shell({
    crumbs: crumbsTo({ label: m.title, href: materiaPath(m) }, { label: b.title, href: bloccoPath(m, b) }, { label: e.title, href: esercizioPath(m, b, e) }),
    label: `Unimore · ${m.title} · ${b.title}`,
    title: titolo(e),
    lead: e.tabella ? 'Testo, tabella compilata e note.' : 'Testo, programma e svolgimento.',
    toc: toc(sezioni.map((s, i) => ({ href: `#s${i + 1}`, title: s.title }))),
    body: `<div class="legal__body">${sezioni.map((s, i) => `<section id="s${i + 1}"><h2 class="h3"><span class="label">${pad(i + 1)}</span>${esc(s.title)}</h2>${s.body}</section>`).join('')}</div>`,
  })
}
