import { html, esc } from '../html.js'
import { site } from '../../data/site.js'
import { button, media, icon, splitWords, breadcrumb } from '../components/ui.js'
import { COORDS } from '../layout.js'

const field = ({ id, label, type = 'text', required = false, autocomplete, hint, inputmode, pattern, placeholder }) => html`
  <div class="field" data-field>
    <label class="field__label label" for="${id}">${esc(label)}${required ? '<span class="field__req" aria-hidden="true"> *</span>' : '<span class="field__opt"> · facoltativo</span>'}</label>
    <input class="field__input" id="${id}" name="${id}" type="${type}"${required ? ' required aria-required="true"' : ''}${autocomplete ? ` autocomplete="${autocomplete}"` : ''}${inputmode ? ` inputmode="${inputmode}"` : ''}${pattern ? ` pattern="${pattern}"` : ''}${placeholder ? ` placeholder="${esc(placeholder)}"` : ''} aria-describedby="${id}-error${hint ? ` ${id}-hint` : ''}">
    ${hint && `<p class="field__hint" id="${id}-hint">${esc(hint)}</p>`}
    <p class="field__error" id="${id}-error" role="alert" hidden></p>
  </div>
`

const selectField = ({ id, label, options, required = false, placeholder }) => html`
  <div class="field" data-field>
    <label class="field__label label" for="${id}">${esc(label)}${required ? '<span class="field__req" aria-hidden="true"> *</span>' : '<span class="field__opt"> · facoltativo</span>'}</label>
    <div class="field__select">
      <select class="field__input" id="${id}" name="${id}"${required ? ' required aria-required="true"' : ''} aria-describedby="${id}-error">
        <option value="">${esc(placeholder)}</option>
        ${options.map((o) => `<option>${esc(o)}</option>`)}
      </select>
      ${icon('arrowDown')}
    </div>
    <p class="field__error" id="${id}-error" role="alert" hidden></p>
  </div>
`

export function contattiPage() {
  const osm = `https://www.openstreetmap.org/?mlat=${site.location.lat}&mlon=${site.location.lon}#map=13/${site.location.lat}/${site.location.lon}`
  return html`
    <section class="cnt">
      <div class="container">
        ${breadcrumb([{ label: 'Home', href: '/' }, { label: 'Contatti', href: '/contatti/' }])}
        <div class="cnt__grid">
          <div class="cnt__intro">
            <p class="label" data-reveal="fade"><span class="sec-head__index">05</span>Contatti</p>
            <h1 class="cnt__title" data-reveal="words">${splitWords('Parliamo del progetto.', { accent: ['progetto.'] })}</h1>
            <p class="lead" data-reveal="up">Due righe bastano: cosa ti serve, dove, entro quando. ${esc(site.contact.reply)}</p>

            <p class="cnt__avail label" data-reveal="up"><span class="dot${site.availability.open ? ' dot--live' : ''}"></span>${esc(site.availability.label)} — da ${esc(site.availability.from)}</p>

            <dl class="cnt__list" data-reveal="up">
              <div><dt class="label">Email</dt><dd><a class="cnt__big" href="mailto:${site.contact.email}">${esc(site.contact.email)}</a></dd></div>
              <div><dt class="label">Telefono</dt><dd><a class="cnt__big" href="tel:${site.contact.phone.replace(/\s/g, '')}">${esc(site.contact.phone)}</a></dd></div>
              <div><dt class="label">Dove sono</dt><dd>${esc(site.location.city)} (${esc(site.location.province)}) · ${esc(site.location.cap)}<br><span class="cnt__muted">Ricevo su appuntamento</span></dd></div>
              <div><dt class="label">Orari</dt><dd>${esc(site.contact.hours)}<br><span class="cnt__muted">Scrivimi o chiamami e fissiamo giorno e ora</span></dd></div>
              <div><dt class="label">Social</dt><dd><ul class="cnt__social">${site.social.map((s) => `<li><a href="${s.url}" target="_blank" rel="noopener">${esc(s.label)}${icon('arrowUpRight')}<span class="sr-only"> (nuova scheda)</span></a></li>`)}</ul></dd></div>
            </dl>
          </div>

          <div class="cnt__formwrap" data-reveal="up">
            <form class="form" data-form novalidate action="mailto:${site.contact.email}" method="post" enctype="text/plain" data-endpoint="${esc(site.form.endpoint)}" data-subject="${esc(site.form.subject)}" data-mail="${esc(site.contact.email)}">
              <div class="form__head label"><span>Modulo di contatto</span><span>MOD. 01</span></div>
              <p class="form__note">I campi con <span aria-hidden="true">*</span><span class="sr-only">asterisco</span> sono obbligatori.</p>
              <div class="form__grid">
                ${field({ id: 'nome', label: 'Nome e cognome', required: true, autocomplete: 'name' })}
                ${field({ id: 'email', label: 'Email', type: 'email', required: true, autocomplete: 'email', inputmode: 'email' })}
                ${field({ id: 'telefono', label: 'Telefono', type: 'tel', autocomplete: 'tel', inputmode: 'tel' })}
                ${selectField({ id: 'tipo', label: 'Tipo di progetto', options: site.form.projectTypes, required: true, placeholder: 'Scegli una voce' })}
                ${selectField({ id: 'budget', label: 'Budget', options: site.form.budgets, placeholder: 'Indicativo' })}
                <div class="field field--full" data-field>
                  <label class="field__label label" for="messaggio">Messaggio<span class="field__req" aria-hidden="true"> *</span></label>
                  <textarea class="field__input field__input--area" id="messaggio" name="messaggio" rows="6" required aria-required="true" minlength="20" maxlength="2000" aria-describedby="messaggio-error messaggio-hint"></textarea>
                  <p class="field__hint" id="messaggio-hint"><span>Cosa ti serve, dove si trova l’immobile o l’attività, entro quando.</span><span class="label" data-form-counter>0 / 2000</span></p>
                  <p class="field__error" id="messaggio-error" role="alert" hidden></p>
                </div>
                <div class="hp" aria-hidden="true"><label for="sito">Lascia vuoto questo campo</label><input id="sito" name="sito" type="text" tabindex="-1" autocomplete="off"></div>
                <div class="field field--full field--check" data-field>
                  <input class="field__check" id="privacy" name="privacy" type="checkbox" required aria-required="true" aria-describedby="privacy-error">
                  <label for="privacy">Ho letto l’<a href="/privacy/">informativa sulla privacy</a> e acconsento al trattamento dei dati per ricevere risposta.<span class="field__req" aria-hidden="true"> *</span></label>
                  <p class="field__error" id="privacy-error" role="alert" hidden></p>
                </div>
              </div>
              <div class="form__foot">
                <button class="btn btn--primary btn--lg form__submit" type="submit" data-form-submit>
                  <span class="btn__label" data-form-label>Invia la richiesta</span>
                  <span class="btn__icon">${icon('arrow')}</span>
                  <span class="form__spinner" aria-hidden="true"></span>
                </button>
                <p class="form__status" data-form-status role="status" aria-live="polite"></p>
              </div>

              <div class="form__done" data-form-done hidden tabindex="-1">
                <span class="form__done-icon" aria-hidden="true">${icon('check')}</span>
                <h2 class="h3">Richiesta pronta.</h2>
                <p data-form-done-text>Ti rispondo entro un giorno lavorativo.</p>
                ${button({ label: 'Scrivi un altro messaggio', variant: 'ghost', iconName: 'plus', attrs: { 'data-form-again': true } })}
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>

    <section class="section cmap" data-theme="tint" aria-labelledby="cmap-title">
      <div class="container cmap__grid">
        <div class="cmap__copy">
          <p class="label"><span class="sec-head__index">⌖</span>Area operativa</p>
          <h2 class="h2" id="cmap-title" data-reveal="words">${splitWords('Dove lavoro', { accent: ['lavoro'] })}</h2>
          <p class="lead" data-reveal="up">${esc(site.location.area)}.</p>
          <ul class="cmap__legend" data-reveal="up">
            <li><span class="label">10 km</span>Sopralluogo in giornata, senza costi di trasferta</li>
            <li><span class="label">25 km</span>Rilievi e cantieri seguiti con continuità</li>
            <li><span class="label">50 km</span>Su incarico, con trasferta concordata</li>
            <li><span class="label">Oltre</span>Web e grafica da remoto, in tutta Italia</li>
          </ul>
          <p class="label cmap__coords">${COORDS}</p>
          ${button({ href: osm, label: 'Apri in OpenStreetMap', variant: 'ghost', iconName: 'arrowUpRight', external: true })}
        </div>
        <div class="cmap__map">${media({ art: 'areamap', alt: 'Carta dell’area operativa: Mantova al centro con raggi di 10, 25 e 50 chilometri' }, { ratio: '4/3', marks: true, caption: 'FIG. 01 — Area operativa · proiezione equirettangolare · scala grafica in carta' })}</div>
      </div>
    </section>
  `
}
