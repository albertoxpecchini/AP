import { html, esc } from '../html.js'
import { site } from '../../data/site.js'
import { button, media, icon, splitWords, breadcrumb, figurina, iphone, iphoneCredit } from '../components/ui.js'
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

// ── Il tastierino del telefono, sull'iPhone ──────────────────────────────────
// Il numero di site.js già composto sul tastierino dell'app Telefono. Nell'HTML
// è intero; src/client/phone.js lo ricompone cifra per cifra quando entra nello
// schermo. Il tasto verde è un vero link tel:, l'unica parte interattiva.

const KEYS = [
  ['1', ''], ['2', 'ABC'], ['3', 'DEF'],
  ['4', 'GHI'], ['5', 'JKL'], ['6', 'MNO'],
  ['7', 'PQRS'], ['8', 'TUV'], ['9', 'WXYZ'],
  ['*', null], ['0', '+'], ['#', null],
]

// 351 035 5506, come lo raggruppa il tastierino
const grouped = (d) => (d.length === 10 ? `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}` : d)

const HANDSET = 'M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z'

function dialer() {
  const tel = site.contact.phone.replace(/\s/g, '')
  const digits = tel.replace(/^\+39/, '')
  return iphone(
    html`
      <div class="dial" data-dialer data-number="${digits}" data-name="${esc(site.name)}">
        <p class="dial__number" aria-hidden="true" data-dial-display>${grouped(digits)}</p>
        <p class="dial__name" aria-hidden="true" data-dial-name>${esc(site.name)}</p>
        <div class="dial__pad">
          ${KEYS.map(
            ([d, sub]) =>
              `<span class="dial__key${sub === null ? ' dial__key--sym' : ''}" data-key="${esc(d)}" aria-hidden="true"><span class="dial__digit">${esc(d)}</span>${sub === null ? '' : `<span class="dial__sub">${sub}</span>`}</span>`,
          )}
          <a class="dial__call" href="tel:${tel}" aria-label="Chiama ${esc(site.name)} al ${esc(site.contact.phone)}"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="${HANDSET}"/></svg></a>
          <span class="dial__del" aria-hidden="true"><svg viewBox="0 0 31 22"><path d="M10.2 1h16.3A3.5 3.5 0 0 1 30 4.5v13a3.5 3.5 0 0 1-3.5 3.5H10.2a3 3 0 0 1-2.2-1L1.2 12.3a2 2 0 0 1 0-2.6L8 2a3 3 0 0 1 2.2-1z" fill="currentColor"/><path d="M14.5 6.5l9 9M23.5 6.5l-9 9" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg></span>
        </div>
        <div class="dial__bar" aria-hidden="true">
          <span class="dial__tabs">
            <span class="dial__tab"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="currentColor"/><path d="M12 5.8v6.7H7.6" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>Calls</span>
            <span class="dial__tab"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="currentColor"/><circle cx="12" cy="9.6" r="3.9" fill="#fff"/><path d="M4.9 19.4c1.6-2.8 4.2-4.3 7.1-4.3s5.5 1.5 7.1 4.3A10.9 10.9 0 0 1 12 23a10.9 10.9 0 0 1-7.1-3.6z" fill="#fff"/></svg>Contacts</span>
            <span class="dial__tab dial__tab--on"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="4" cy="4" r="3.1"/><circle cx="12" cy="4" r="3.1"/><circle cx="20" cy="4" r="3.1"/><circle cx="4" cy="12" r="3.1"/><circle cx="12" cy="12" r="3.1"/><circle cx="20" cy="12" r="3.1"/><circle cx="4" cy="20" r="3.1"/><circle cx="12" cy="20" r="3.1"/><circle cx="20" cy="20" r="3.1"/></svg>Keypad</span>
          </span>
          <span class="dial__search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.8"/><path d="M15.6 15.6 21 21"/></svg></span>
        </div>
      </div>
    `,
    { className: 'iphone--dial' },
  )
}

export function contattiPage() {
  const osm = `https://www.openstreetmap.org/?mlat=${site.location.lat}&mlon=${site.location.lon}#map=13/${site.location.lat}/${site.location.lon}`
  return html`
    <section class="cnt">
      <div class="container">
        ${breadcrumb([{ label: 'Home', href: '/' }, { label: 'Contatti', href: '/contatti/' }])}
        <div class="cnt__grid">
          <div class="cnt__intro">
            <p class="label" data-reveal="fade"><span class="sec-head__index">05</span>Contatti</p>
            <div class="cnt__head">
              <h1 class="cnt__title" data-reveal="words">${splitWords('Parliamo del progetto.', { accent: ['progetto.'] })}</h1>
              ${figurina('contatti', { className: 'cnt__fig', lazy: false })}
            </div>
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

          <div class="cnt__formwrap" id="modulo" data-reveal="up">
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
                ${site.form.turnstileSiteKey &&
                html`
                  <div class="field field--full form__turnstile" data-field>
                    <div class="cf-turnstile" data-turnstile data-sitekey="${esc(site.form.turnstileSiteKey)}" data-language="it" data-appearance="interaction-only" data-response-field="false"></div>
                    <p class="field__error" id="turnstile-error" role="alert" hidden></p>
                  </div>
                `}
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

    <section class="section ccall" aria-labelledby="ccall-title">
      <div class="container ccall__grid">
        <div class="ccall__copy">
          <p class="label" data-reveal="fade"><span class="sec-head__index">☎</span>Telefono</p>
          <h2 class="h2" id="ccall-title" data-reveal="words">${splitWords('Preferisci a voce?', { accent: ['voce'] })}</h2>
          <p class="lead" data-reveal="up">Il numero è già composto: tocca il tasto verde e parliamo del progetto. Per sopralluoghi e incontri fissiamo insieme giorno e ora.</p>
          <p class="ccall__num" data-reveal="up"><a class="cnt__big" href="tel:${site.contact.phone.replace(/\s/g, '')}">${esc(site.contact.phone)}</a><span class="cnt__muted">${esc(site.contact.hours)}</span></p>
        </div>
        <figure class="ccall__phone" data-reveal="up">
          ${dialer()}
          <figcaption>${iphoneCredit()}</figcaption>
        </figure>
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
        <div class="cmap__map">${media({ art: 'areamap', base: '/media/mappa/area-operativa.webp', alt: 'Carta illustrata dell’area operativa: il lago di Garda, il Mincio, i laghi di Mantova e il Po, con Mantova al centro e raggi di 10, 25 e 50 chilometri' }, { ratio: '4/3', marks: true, caption: 'FIG. 01 — Area operativa · proiezione equirettangolare · scala grafica in carta' })}</div>
      </div>
    </section>
  `
}
