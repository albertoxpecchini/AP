// Pagina /aragosta/: l'aragosta e l'inchiostro in stile vecchio, su una tavola
// navigabile come in un programma di disegno (lo stesso piano di /stile/:
// zoom e spostamento in src/client/canvas.js). Una tavola sola, 1440 × 900:
// l'hero della home com'era dal 18.9 al 2.11.2026 — il saluto, il nome a tutta
// larghezza col cognome in contorno, l'aragosta che dorme sopra la disponibilità
// e lo riempie d'inchiostro (src/client/ink.js), il luogo comune sbarrato, il
// timbro, l'invito — e, dove stava il terminale, il cartiglio del foglio.
// Alberto, 3.11.2026: «aragosta e inchiostro in stile vecchio (crea pagina che
// sia visualizzabile come su autocad)».

import { html, esc } from '../html.js'
import { site, cta } from '../../data/site.js'
import { photos } from '../../data/studio.js'
import { button, icon } from '../components/ui.js'
import { COORDS } from '../layout.js'

export const tavola = { key: 'hero', index: '01', title: 'L’hero com’era · 1440 × 900', short: 'L’hero com’era', x: 0, y: 0, w: 1440, h: 900 }

const DATA = '2.11.2026'

function cartiglio() {
  return html`
    <table class="cart" aria-label="Cartiglio della tavola">
      <tbody>
        <tr class="cart__title"><th scope="row">Oggetto</th><td>L’aragosta e l’inchiostro</td></tr>
        <tr><th scope="row">Tavola</th><td>01 — l’hero della home com’era, dal 18.9 al ${DATA}</td></tr>
        <tr><th scope="row">Scala</th><td>1:1 · foglio 1440 × 900 px · 1 px = 1 mm per il liquido</td></tr>
        <tr><th scope="row">Disegnato</th><td>${esc(site.name)} · ${esc(site.location.city)} · ${COORDS}</td></tr>
        <tr><th scope="row">Caratteri</th><td>Archivo 86% · Cascadia Code · Instrument Serif</td></tr>
        <tr class="cart__rev"><th scope="row">Rev. A</th><td>${DATA} · il sito ha il vestito nuovo, questa tavola resta com’era</td></tr>
      </tbody>
    </table>
  `
}

function heroVecchio() {
  return html`
    <section class="hv" aria-labelledby="hv-title">
      <div class="hv__glow" aria-hidden="true"></div>
      <div class="hv__wrap" data-ink>
        <div class="hv__hello">
          <p class="hv__hi">
            <span class="hv__avatar"><span class="hv__avatar-ph"><img src="${photos.avatar.src}" width="${photos.avatar.width}" height="${photos.avatar.height}" sizes="2.75rem" alt="" decoding="async"></span>${site.availability.open ? '<span class="hv__avatar-dot" aria-hidden="true"></span>' : ''}</span>
            <span class="hv__hi-text">Ciao, sono</span>
          </p>
          <p class="hv__place label">${esc(site.location.city)} — Italia<span class="hv__coords"> · ${COORDS}</span></p>
          <p class="hv__avail label" data-ink-bed><span class="dot${site.availability.open ? ' dot--live' : ''}" aria-hidden="true"></span>${esc(site.availability.label)}</p>
        </div>

        <h2 class="hv__title" id="hv-title">
          <span class="hv__name" aria-hidden="true"><span class="hv__word"><span>${esc(site.firstName)}</span></span> <span class="hv__word hv__word--2"><span data-ink-word>${esc(site.lastName)}</span></span></span>
          <span class="sr-only">${esc(site.name)} — l’hero della home com’era</span>
        </h2>

        <div class="hv__body">
          <div class="hv__pitch">
            <p class="hv__kicker"><span class="hv__slashes" aria-hidden="true">//</span><span class="hv__pill">casa · sito · marchio</span><span>un solo referente</span></p>
            <p class="hv__myth">
              <s><span class="hv__strike">“Servono tre</span> <span class="hv__strike hv__strike--2">professionisti.”</span></s>
              <strong class="hv__stamp">Falso</strong>
            </p>
            <p class="hv__claim">Ne basta <em class="serif-i">uno.</em></p>
            <p class="hv__lead">Diplomato geometra a ${esc(site.location.city)}: rilevo e disegno edifici, scrivo siti web a mano, costruisco marchi. Con lo stesso metodo e la stessa cura.</p>
            <div class="hv__actions">
              ${button({ href: cta.href, label: cta.label, size: 'lg' })}
              ${button({ href: '/', label: 'La home di adesso', variant: 'ghost', size: 'lg' })}
            </div>
            <ul class="hv__trust label">
              <li>Primo colloquio gratuito</li>
              <li>Preventivo scritto</li>
              <li>${esc(site.contact.reply.replace(/\.$/, ''))}</li>
            </ul>
          </div>
          ${cartiglio()}
        </div>
      </div>
    </section>
  `
}

const minus = '<svg class="icon" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" aria-hidden="true" focusable="false"><path d="M5 12h14"/></svg>'

export function aragostaPage() {
  const b = tavola
  return html`
    <section class="canvas" data-canvas data-aragosta>
      <div class="canvas__bg" aria-hidden="true"></div>
      <div class="canvas__viewport" data-canvas-viewport tabindex="0" role="region" aria-label="La tavola: trascina per spostarti, Ctrl e rotella per ingrandire">
        <div class="canvas__world" data-canvas-world>
          <p class="canvas__note" data-canvas-note style="--x:0px;--y:-330px" aria-hidden="true">${esc(site.name)} — l’aragosta e l’inchiostro, com’erano</p>
          <article class="board" id="tavola-${b.key}" data-board="${b.key}" style="--x:${b.x}px;--y:${b.y}px;--w:${b.w}px;--h:${b.h}px" aria-labelledby="tavola-${b.key}-nome">
            <h2 class="board__name label" id="tavola-${b.key}-nome"><span>${esc(b.title)}</span><span aria-hidden="true">${b.w} × ${b.h}</span></h2>
            <span class="board__ring" aria-hidden="true"></span>
            <div class="board__frame tav" data-theme="paper">
              <span class="tav__mark tav__mark--tl" aria-hidden="true"></span><span class="tav__mark tav__mark--tr" aria-hidden="true"></span><span class="tav__mark tav__mark--bl" aria-hidden="true"></span><span class="tav__mark tav__mark--br" aria-hidden="true"></span>
              ${heroVecchio()}
            </div>
          </article>
        </div>
      </div>
      <div class="canvas__top" aria-hidden="true"></div>
      <div class="canvas__panel">
        <div class="canvas__head">
          <h1 class="canvas__title">L’aragosta</h1>
          <p class="canvas__lead">L’hero della home com’era fino al ${DATA}, su un foglio da disegno: il nome a tutta larghezza, l’aragosta di fiume che dorme sopra la disponibilità e, se stai fermo due secondi, riempie d’inchiostro il cognome. Ingrandisci e spostati come su un tavolo da disegno.</p>
        </div>
        <nav class="canvas__layers" aria-label="Tavole">
          <ul>
            <li><button class="canvas__layer" type="button" data-canvas-go="${b.key}"><span class="label">${b.index}</span><span>${esc(b.short)}</span><span class="label">${b.w} × ${b.h}</span></button></li>
          </ul>
        </nav>
        <p class="canvas__keys label"><kbd>1</kbd> la tavola · <kbd>F</kbd> tutto · <kbd>0</kbd> scala 1:1 · <kbd>+</kbd> <kbd>−</kbd> zoom<br>trascina o rotella per spostarti · <kbd>Ctrl</kbd> + rotella per ingrandire</p>
        <p class="canvas__credit label"><a class="uline" href="/stile/">Il sistema visivo di adesso</a> · <a class="uline" href="${esc(site.url)}" rel="author">Sito di ${esc(site.name)}</a></p>
      </div>
      <div class="canvas__tools" role="group" aria-label="Zoom">
        <button class="canvas__tool" type="button" data-canvas-zoom-out aria-label="Riduci">${minus}</button>
        <span class="canvas__tool canvas__zoom" data-canvas-zoom aria-live="polite">100%</span>
        <button class="canvas__tool" type="button" data-canvas-zoom-in aria-label="Ingrandisci">${icon('plus')}</button>
        <button class="canvas__tool" type="button" data-canvas-fit>Adatta</button>
        <button class="canvas__tool" type="button" data-canvas-one>1:1</button>
      </div>
    </section>
  `
}
