import { html, esc, cx, pad } from '../html.js'
import { wrapped } from '../../data/wrapped.js'

/**
 * Wrapped 5BT: il frame 9:16 con le slide verticali a scatto.
 *
 * I contenuti vengono da src/data/wrapped.js (e, a monte, dai numeri di
 * tools/wrapped): finché le slide non ci sono, il frame resta la tela vuota
 * con le guide. Lo scorrimento è nativo (scroll-snap); src/client/wrapped.js
 * aggiunge avanzamento, contatore, tastiera e tocco.
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

const numero = (v) => (typeof v === 'number' ? v.toLocaleString('it-IT') : String(v ?? ''))

function renderSlide(slide, i, totale) {
  // un refuso nel tipo deve fermare la build, non produrre una slide vuota
  if (!Object.hasOwn(TIPI, slide.tipo)) {
    throw new Error(`wrapped: slide ${i + 1} di tipo sconosciuto «${slide.tipo}» (vedi i tipi in src/data/wrapped.js)`)
  }
  return html`
    <section
      class="${cx('wslide', `wslide--${slide.tipo}`)}"
      data-wslide
      data-theme="${slide.tema || 'paper'}"
      aria-label="Slide ${i + 1} di ${totale}"
    >
      ${slide.occhiello && html`<p class="wslide__occhiello">${esc(slide.occhiello)}</p>`}
      ${TIPI[slide.tipo](slide)}
      ${slide.nota && html`<p class="wslide__nota">${esc(slide.nota)}</p>`}
    </section>
  `
}

const TIPI = {
  copertina: (s) => html`
    <h1 class="wslide__display">${esc(s.titolo)}</h1>
    ${s.sottotitolo && html`<p class="wslide__sotto">${esc(s.sottotitolo)}</p>`}
  `,

  numero: (s) => html`
    <p class="wslide__valore">${esc(numero(s.valore))}${s.unita && html`<span class="wslide__unita">${esc(s.unita)}</span>`}</p>
    ${s.didascalia && html`<p class="wslide__didascalia">${esc(s.didascalia)}</p>`}
    ${s.secondari && s.secondari.length > 0 &&
    html`<dl class="wslide__secondari">
      ${s.secondari.map(
        (v) => html`<div><dt>${esc(v.etichetta)}</dt><dd>${esc(numero(v.valore))}</dd></div>`,
      )}
    </dl>`}
  `,

  classifica: (s) => {
    // le barre si scalano sui numeri: una stringa formattata («1.234») verrebbe
    // letta come 1,234 e sballerebbe la scala in silenzio, quindi si rifiuta
    for (const v of s.voci) {
      if (typeof v.valore !== 'number' || !Number.isFinite(v.valore)) {
        throw new Error(`wrapped: nella classifica «${s.titolo}» il valore di «${v.nome}» non è un numero (${JSON.stringify(v.valore)})`)
      }
    }
    const massimo = Math.max(...s.voci.map((v) => v.valore), 1)
    return html`
      <h2 class="wslide__titolo">${esc(s.titolo)}</h2>
      <ol class="wslide__classifica">
        ${s.voci.map(
          (v) => html`
            <li class="wslide__voce" style="--q: ${(v.valore / massimo).toFixed(3)}">
              <span class="wslide__voce-nome">${esc(v.nome)}</span>
              <span class="wslide__voce-barra" aria-hidden="true"></span>
              <span class="wslide__voce-valore">${esc(numero(v.valore))}${s.unita && ` ${esc(s.unita)}`}</span>
              ${v.dettaglio && html`<span class="wslide__voce-dettaglio">${esc(v.dettaglio)}</span>`}
            </li>
          `,
        )}
      </ol>
    `
  },

  timeline: (s) => html`
    <h2 class="wslide__titolo">${esc(s.titolo)}</h2>
    <ol class="wslide__timeline">
      ${s.tappe.map(
        (t) => html`<li><span class="wslide__data">${esc(t.data)}</span><span>${esc(t.testo)}</span></li>`,
      )}
    </ol>
  `,

  citazione: (s) => html`
    <blockquote class="wslide__citazione">
      <p>«${esc(s.testo)}»</p>
      <footer><span>${esc(s.autore)}</span>${s.data && html`<span class="wslide__data">${esc(s.data)}</span>`}</footer>
    </blockquote>
  `,

  confronto: (s) => html`
    <h2 class="wslide__titolo">${esc(s.titolo)}</h2>
    <div class="wslide__confronto">
      ${s.lati.map(
        (l) => html`
          <div class="wslide__lato">
            <p class="wslide__lato-valore">${esc(numero(l.valore))}</p>
            <p class="wslide__lato-etichetta">${esc(l.etichetta)}</p>
            ${l.dettaglio && html`<p class="wslide__lato-dettaglio">${esc(l.dettaglio)}</p>`}
          </div>
        `,
      )}
    </div>
  `,

  griglia: (s) => html`
    <h2 class="wslide__titolo">${esc(s.titolo)}</h2>
    <dl class="wslide__griglia">
      ${s.celle.map((c) => html`<div><dt>${esc(c.etichetta)}</dt><dd>${esc(numero(c.valore))}</dd></div>`)}
    </dl>
  `,

  testo: (s) => html`
    <h2 class="wslide__titolo">${esc(s.titolo)}</h2>
    ${s.paragrafi.map((p) => html`<p class="wslide__paragrafo">${esc(p)}</p>`)}
  `,

  finale: (s) => html`
    <p class="wslide__display">${esc(s.titolo)}</p>
    ${s.sottotitolo && html`<p class="wslide__sotto">${esc(s.sottotitolo)}</p>`}
    ${s.firma && html`<p class="wslide__firma">${esc(s.firma)}</p>`}
  `,
}
