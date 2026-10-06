import { html, esc, cx, pad } from '../html.js'
import { wrapped } from '../../data/wrapped.js'

/**
 * Wrapped 5BT: il frame 9:16 con le slide verticali a scatto.
 *
 * I contenuti vengono da src/data/wrapped.js (e, a monte, dai numeri di
 * tools/wrapped): finché le slide non ci sono, il frame resta la tela vuota
 * con le guide. Ogni slide è una pila di blocchi (numero grande, barre,
 * tabella, fumetto…) più, se serve, la chiusa «In breve» e il pannello
 * «Come si calcola» con le definizioni. Lo scorrimento è nativo
 * (scroll-snap); src/client/wrapped.js aggiunge avanzamento, contatore,
 * tastiera e tocco.
 */
export function wrapped5btPage() {
  const slides = wrapped.stato === 'pronto' ? wrapped.slides : []
  return html`
    <div class="wrapped5bt" data-wrapped>
      <div
        class="${cx('wrapped5bt__frame', !slides.length && 'wrapped5bt__frame--vuota')}"
        data-wrapped-stage
      >
        ${slides.length ? palco(slides) : attesa()}
      </div>
      <p class="wrapped5bt__credito">
        ${esc(wrapped.titolo)} · <a class="uline" href="https://www.albertopecchini.it">Alberto Pecchini</a>
      </p>
    </div>
  `
}

/* La tela in attesa: nessun contenuto editoriale, solo lo stato. */
const attesa = () => html`
  <div class="wrapped5bt__attesa">
    <p class="wrapped5bt__attesa-nome">${esc(wrapped.titolo)}</p>
    <p class="wrapped5bt__attesa-stato">in preparazione</p>
    <p class="wrapped5bt__attesa-periodo">${esc(wrapped.periodo.dal)} → ${esc(wrapped.periodo.al)}</p>
  </div>
`

/* Il palco con le slide, più avanzamento, contatore e comandi (via JS). */
const palco = (slides) => html`
  <div
    class="wrapped5bt__scorrimento"
    data-wrapped-scorrimento
    tabindex="0"
    role="group"
    aria-roledescription="presentazione"
    aria-label="${slides.length} slide, da scorrere in verticale"
  >
    ${slides.map((slide, i) => renderSlide(slide, i, slides.length))}
  </div>
  <div class="wrapped5bt__progresso" aria-hidden="true">
    <span class="wrapped5bt__progresso-barra" data-wrapped-barra></span>
  </div>
  <p class="wrapped5bt__contatore" data-wrapped-contatore aria-hidden="true">${pad(1)}/${pad(slides.length)}</p>
  <div class="wrapped5bt__comandi">
    <button class="wrapped5bt__comando" type="button" data-wrapped-prima aria-label="Slide precedente">↑</button>
    <button class="wrapped5bt__comando" type="button" data-wrapped-dopo aria-label="Slide successiva">↓</button>
  </div>
`

/* ── Le slide ───────────────────────────────────────────────────────────── */

// l'italiano di Intl non raggruppa le migliaia sotto 10.000 («1391»): il deck
// e la chat scrivono «1.391», quindi il separatore si chiede sempre
const cifre = new Intl.NumberFormat('it-IT', { useGrouping: 'always', maximumFractionDigits: 3 })
const numero = (v) => (typeof v === 'number' ? cifre.format(v) : String(v ?? ''))

/* Testo dei dati con un solo segno di stile: **così** diventa grassetto. */
const fmt = (s) => esc(numero(s)).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')

function renderSlide(slide, i, totale) {
  const dove = `wrapped: slide ${i + 1}${slide.titolo ? ` «${slide.titolo}»` : ''}`
  if (!Array.isArray(slide.blocchi)) throw new Error(`${dove}: manca l'elenco dei blocchi`)
  return html`
    <section
      class="${cx('wslide', slide.metodo && 'wslide--metodo')}"
      data-wslide
      data-theme="${slide.tema || 'paper'}"
      aria-label="Slide ${i + 1} di ${totale}"
    >
      ${slide.occhiello && html`<p class="wslide__occhiello">${esc(slide.occhiello)}</p>`}
      ${slide.titolo && html`<h2 class="wslide__titolo">${esc(slide.titolo)}</h2>`}
      ${slide.sotto && html`<p class="wslide__sotto">${fmt(slide.sotto)}</p>`}
      ${slide.blocchi.map((b, j) => renderBlocco(b, `${dove}, blocco ${j + 1}`))}
      ${slide.chiusa && html`<p class="wslide__chiusa"><span>In breve</span> ${fmt(slide.chiusa)}</p>`}
      ${slide.metodo && metodo(slide.metodo)}
    </section>
  `
}

function renderBlocco(b, dove) {
  // un refuso nel tipo deve fermare la build, non produrre un blocco vuoto
  if (!Object.hasOwn(BLOCCHI, b.tipo)) {
    throw new Error(`${dove}: tipo di blocco sconosciuto «${b.tipo}» (vedi i tipi in src/data/wrapped.js)`)
  }
  return BLOCCHI[b.tipo](b, dove)
}

/* Le barre e le colonne si scalano sui numeri: una stringa formattata
   («1.234») verrebbe letta come 1,234 e sballerebbe la scala in silenzio. */
function soloNumeri(valori, dove) {
  for (const v of valori) {
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      throw new Error(`${dove}: valore non numerico (${JSON.stringify(v)})`)
    }
  }
  return Math.max(...valori, 1e-9)
}

/* Il pannello delle definizioni: <details> nativo, funziona anche senza JS. */
const metodo = (testo) => html`
  <details class="wslide__metodo">
    <summary><span class="wslide__metodo-apri">Come si calcola</span><span class="wslide__metodo-chiudi">Chiudi</span></summary>
    <div class="wslide__metodo-testo">
      <p class="wslide__metodo-titolo">Come si calcola</p>
      ${[].concat(testo).map((p) => html`<p>${fmt(p)}</p>`)}
    </div>
  </details>
`

const BLOCCHI = {
  // { righe: [stringhe], accento?: indice della riga in colore }
  display: (b) => html`
    <p class="wb-display">
      ${b.righe.map((r, i) => html`<span class="${cx(i === b.accento && 'is-accento')}">${esc(r)}</span>`)}
    </p>
  `,

  // { valore, unita?, testo?, piccolo? } — il numero protagonista della slide
  numero: (b) => html`
    <div class="wb-numero">
      <p class="${cx('wb-numero__valore', b.piccolo && 'wb-numero__valore--piccolo')}">${esc(numero(b.valore))}${b.unita && html`<span class="wb-numero__unita">${esc(b.unita)}</span>`}</p>
      ${b.testo && html`<p class="wb-numero__testo">${fmt(b.testo)}</p>`}
    </div>
  `,

  // { celle: [{ valore, etichetta }], colonne?: 2|3 }
  cifre: (b) => html`
    <dl class="wb-cifre" style="--colonne: ${b.colonne || 2}">
      ${b.celle.map((c) => html`<div><dt>${fmt(c.etichetta)}</dt><dd>${esc(numero(c.valore))}</dd></div>`)}
    </dl>
  `,

  // { titolo?, voci: [{ nome, valore: numero, mostra?, testo?, evidenza? }] }
  // `mostra` sostituisce il valore stampato («11.126 · 21,50%»), la barra resta sul numero
  barre: (b, dove) => {
    const massimo = soloNumeri(b.voci.map((v) => v.valore), dove)
    return html`
      ${b.titolo && html`<p class="wb-etichetta">${esc(b.titolo)}</p>`}
      <ol class="wb-barre">
        ${b.voci.map(
          (v) => html`
            <li class="${cx('wb-barra', v.evidenza && 'is-evidenza')}" style="--q: ${(v.valore / massimo).toFixed(3)}">
              <span class="wb-barra__nome">${fmt(v.nome)}</span>
              <span class="wb-barra__valore">${esc(v.mostra ?? numero(v.valore))}</span>
              <span class="wb-barra__traccia" aria-hidden="true"></span>
              ${v.testo && html`<span class="wb-barra__testo">${fmt(v.testo)}</span>`}
            </li>
          `,
        )}
      </ol>
    `
  },

  // { titolo?, valori: [numeri relativi], descrizione, evidenza?: [indici], bassi?: [indici],
  //   asse: [{ i, testo }], etichette?: [{ i, testo }] } — istogramma verticale
  colonne: (b, dove) => {
    const massimo = soloNumeri(b.valori, dove)
    const n = b.valori.length
    const posizione = (i) => `${(((i + 0.5) / n) * 100).toFixed(2)}%`
    return html`
      ${b.titolo && html`<p class="wb-etichetta">${esc(b.titolo)}</p>`}
      <figure class="wb-colonne" style="--n: ${n}">
        <div class="wb-colonne__area" role="img" aria-label="${esc(b.descrizione)}">
          ${b.valori.map(
            (v, i) => html`<span
              class="${cx('wb-colonna', b.evidenza?.includes(i) && 'is-evidenza', b.bassi?.includes(i) && 'is-basso')}"
              style="--q: ${(v / massimo).toFixed(3)}"
            ></span>`,
          )}
          ${(b.etichette || []).map(
            (e) => html`<span class="wb-colonne__etichetta" style="--x: ${posizione(e.i)}; --q: ${(b.valori[e.i] / massimo).toFixed(3)}">${esc(e.testo)}</span>`,
          )}
        </div>
        <div class="wb-colonne__asse" aria-hidden="true">
          ${b.asse.map((a) => html`<span style="--x: ${posizione(a.i)}">${esc(a.testo)}</span>`)}
        </div>
      </figure>
    `
  },

  // { titolo?, voci: [{ chiave, valore?, testo? }], colonne?: 1|2 } — righe chiave/valore
  righe: (b) => html`
    ${b.titolo && html`<p class="wb-etichetta">${esc(b.titolo)}</p>`}
    <dl class="wb-righe" style="--colonne: ${b.colonne || 1}">
      ${b.voci.map(
        (v) => html`
          <div>
            <dt>${fmt(v.chiave)}</dt>
            ${v.valore !== undefined && html`<dd>${esc(numero(v.valore))}</dd>`}
            ${v.testo && html`<dd class="wb-righe__testo">${fmt(v.testo)}</dd>`}
          </div>
        `,
      )}
    </dl>
  `,

  // { voci: [{ titolo, valore?, testo }], colonne?: 1|2 }
  schede: (b) => html`
    <div class="wb-schede" style="--colonne: ${b.colonne || 1}">
      ${b.voci.map(
        (v) => html`
          <div class="${cx('wb-scheda', v.evidenza && 'is-evidenza')}">
            <p class="wb-scheda__titolo">${fmt(v.titolo)}</p>
            ${v.valore !== undefined && html`<p class="wb-scheda__valore">${esc(numero(v.valore))}</p>`}
            ${v.testo && html`<p class="wb-scheda__testo">${fmt(v.testo)}</p>`}
          </div>
        `,
      )}
    </div>
  `,

  // { colonne: [intestazioni], righe: [[celle]], destra?: [indici di colonna], evidenzia?: [indici di riga] }
  tabella: (b) => html`
    <div class="wb-tabella">
      <table>
        <thead>
          <tr>${b.colonne.map((c, j) => html`<th class="${cx(b.destra?.includes(j) && 'is-destra')}" scope="col">${esc(c)}</th>`)}</tr>
        </thead>
        <tbody>
          ${b.righe.map(
            (r, i) => html`<tr class="${cx(b.evidenzia?.includes(i) && 'is-evidenza')}">
              ${r.map((c, j) => html`<td class="${cx(b.destra?.includes(j) && 'is-destra')}">${fmt(c)}</td>`)}
            </tr>`,
          )}
        </tbody>
      </table>
    </div>
  `,

  // { etichetta?, autore, testo, data, mio? } — un messaggio citato, come in chat
  fumetto: (b) => html`
    <figure class="${cx('wb-fumetto', b.mio && 'wb-fumetto--mio')}">
      ${b.etichetta && html`<figcaption class="wb-etichetta">${esc(b.etichetta)}</figcaption>`}
      <blockquote>
        <p class="wb-fumetto__autore">${esc(b.autore)}</p>
        <p class="wb-fumetto__testo">${esc(b.testo)}</p>
        <p class="wb-fumetto__data">${esc(b.data)}</p>
      </blockquote>
    </figure>
  `,

  // { titolo?, voci: [{ testo, evidenza? }] }
  chip: (b) => html`
    ${b.titolo && html`<p class="wb-etichetta">${esc(b.titolo)}</p>`}
    <ul class="wb-chip">
      ${b.voci.map((v) => html`<li class="${cx(v.evidenza && 'is-evidenza')}">${fmt(v.testo)}</li>`)}
    </ul>
  `,

  // { voci: [{ n, testo }] } — elenco numerato di frasi
  elenco: (b) => html`
    <ol class="wb-elenco">
      ${b.voci.map((v) => html`<li><span class="wb-elenco__n">${esc(v.n)}</span><p>${fmt(v.testo)}</p></li>`)}
    </ol>
  `,

  // { testo }
  paragrafo: (b) => html`<p class="wb-paragrafo">${fmt(b.testo)}</p>`,
}
