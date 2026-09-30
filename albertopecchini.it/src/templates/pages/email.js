// Compositore email — strumento privato, raggiungibile solo dal link diretto.
//
// Sei zone, nell'ordine in cui si lavora: da dove parte l'email, come si scrive
// (guida con i tasti e i campi), l'output — la stessa email che produce il
// generatore da riga di comando: email.html, email-lite.html, email.txt e
// report.md — il miglioramento con l'IA, le statistiche e la rubrica.
// Tutta la logica è in src/client/email.js; qui c'è solo il markup, più i dati
// (mittenti, firme, tema, contatti) in un blocco JSON.

import { html, esc, jsonLd } from '../html.js'
import { icon, breadcrumb } from '../components/ui.js'
import { emailData } from '../../data/rubrica.js'

const field = ({ id, label, opt, placeholder, hint, list, type = 'text', autocomplete = 'off', name }) => html`
  <div class="field">
    <label class="field__label label" for="${id}">${esc(label)}${opt && `<span class="field__opt"> · ${esc(opt)}</span>`}</label>
    <input class="field__input" id="${id}" type="${type}" name="${name || id}" data-em-field="${name || id}" autocomplete="${autocomplete}" spellcheck="false"${placeholder ? ` placeholder="${esc(placeholder)}"` : ''}${list ? ` list="${list}"` : ''}>
    ${hint && `<p class="field__hint">${esc(hint)}</p>`}
  </div>
`

const chip = (label, attrs = '', className = '') => `<button class="em-chip ${className}" type="button" ${attrs}>${esc(label)}</button>`

const STEPS = [
  { key: 'mittente', title: 'Mittente', text: 'Scuola, personale o società: cambia indirizzo, firma e presentazione.', action: { label: 'Cambia account', attr: 'data-em-go="#mittente"' } },
  { key: 'destinatari', title: 'Destinatari', text: 'Un indirizzo in «A» per chi deve rispondere; in «Cc» chi deve sapere; in «Ccn» i gruppi.', action: { label: 'Apri la rubrica', attr: 'data-em-go="#rubrica"' } },
  { key: 'oggetto', title: 'Oggetto', text: 'Tra 30 e 60 caratteri, con l’informazione chiave all’inizio. Mai «Info» o «Richiesta».', action: { label: 'Proponi con l’IA', attr: 'data-em-ai="oggetto"' } },
  { key: 'saluto', title: 'Saluto', text: 'Segue il tono e il primo destinatario: «Gentile Prof. Lanzoni,» o «Buongiorno,». Se manca, l’output lo aggiunge da solo, come fa il generatore.', action: { label: 'Inserisci saluto', attr: 'data-em-snippet="saluto"' } },
  { key: 'corpo', title: 'Corpo', text: 'Chi sei (se serve), cosa chiedi, entro quando. Paragrafi brevi; un elenco se i punti sono più di due. Il Markdown del generatore funziona.', action: { label: 'Presentazione', attr: 'data-em-snippet="presentazione"' } },
  { key: 'chiusura', title: 'Chiusura', text: 'Ringraziamento e congedo del tono scelto, con il nome sotto. Se manca, l’output lo aggiunge. La firma completa è il riquadro scuro in fondo.', action: { label: 'Inserisci chiusura', attr: 'data-em-snippet="chiusura"' } },
]

const TOOLBAR = [
  ['saluto', 'Saluto'],
  ['presentazione', 'Presentazione'],
  ['richiesta', 'Richiesta'],
  ['scadenza', 'Scadenza'],
  ['elenco', 'Elenco'],
  ['titolo', 'Titolo'],
  ['nota', 'Nota'],
  ['pulsante', 'Pulsante'],
  ['ringraziamento', 'Ringraziamento'],
  ['disponibilita', 'Disponibilità'],
  ['chiusura', 'Chiusura'],
  ['re', 'Re:'],
  ['data', 'Data di oggi'],
  ['pulisci', 'Pulisci spazi'],
]

const AI_ACTIONS = [
  ['migliora', 'Migliora', 'Chiarezza, scorrevolezza, paragrafi'],
  ['correggi', 'Correggi', 'Solo ortografia e grammatica'],
  ['formale', 'Più formale', 'Registro istituzionale, Lei'],
  ['cordiale', 'Più cordiale', 'Più calore, stessa sostanza'],
  ['breve', 'Più breve', 'Via ripetizioni e premesse'],
  ['chiaro', 'Richiesta chiara', 'Cosa chiedi, entro quando'],
  ['appunti', 'Scrivi da appunti', 'Dal materiale grezzo all’email'],
  ['oggetto', 'Proponi oggetti', 'Cinque alternative'],
  ['giudizio', 'Giudizio', 'Voto e consigli, senza riscrivere'],
]

const STATS = [
  ['words', 'Parole', 'nel corpo composto'],
  ['chars', 'Caratteri', 'spazi inclusi'],
  ['sentences', 'Frasi', 'nel corpo'],
  ['paragraphs', 'Paragrafi', 'blocchi di testo'],
  ['avg', 'Parole per frase', 'media'],
  ['reading', 'Lettura', 'a 200 parole al minuto'],
  ['weightHtml', 'email.html', 'con il carattere incorporato'],
  ['weightLite', 'email-lite.html', 'senza carattere, per Gmail'],
  ['weightText', 'email.txt', 'testo semplice'],
  ['recipients', 'Destinatari', 'A, Cc e Ccn'],
]

// Contatori dei consumi dell'IA: i valori li scrive src/client/email.js.
const USAGE_STATS = [
  ['requests', 'Richieste'],
  ['input', 'Token in'],
  ['output', 'Token out'],
  ['time', 'Tempo medio'],
  ['value', 'Valore a prezzi API'],
]

const VIEWS = [
  ['html', 'Email HTML'],
  ['text', 'email.txt'],
  ['report', 'report.md'],
  ['source', 'Sorgente'],
]

const blockHead = (index, label, extra = '') => html`
  <header class="em-block__head">
    <p class="label"><span class="sec-head__index">${index}</span>${esc(label)}</p>
    ${extra}
  </header>
  <div class="rule rule--ticks" aria-hidden="true"></div>
`

export function emailPage() {
  const { senders, tones } = emailData
  return html`
    <section class="em" data-email>
      <div class="container">
        ${breadcrumb([{ label: 'Home', href: '/' }, { label: 'Email', href: '/email/' }])}

        <header class="em__head">
          <p class="label" data-reveal="fade"><span class="sec-head__index">✉</span>Compositore email · strumento privato</p>
          <h1 class="em__title h1" data-reveal="words">Scrivi l’email, controllala, copiala.</h1>
          <p class="lead" data-reveal="up">Scegli da dove parte, segui i passi, migliora con l’intelligenza artificiale e incolla nel programma di posta. L’output è la stessa email del generatore: stesso tema, stesse regole. Le bozze restano in questo browser.</p>
          <div class="em-access" data-em-access>
            <p class="em-access__status label"><span class="dot" data-em-access-dot></span><span data-em-access-text>Controllo del collegamento…</span></p>
            <form class="em-access__form" data-em-access-form hidden>
              <label class="label" for="em-key">Chiave di accesso</label>
              <input class="field__input" id="em-key" type="password" autocomplete="off" spellcheck="false" data-em-access-input placeholder="Dal link /email/?k=…">
              ${chip('Salva', 'type="submit"')}
            </form>
            ${chip('Cambia chiave', 'data-em-access-edit')}
          </div>
        </header>

        <!-- 01 · Mittente -->
        <section class="em-block" id="mittente" aria-labelledby="em-h-mittente">
          ${blockHead('01', 'Da dove parte l’email', '<p class="label" data-em-sender-mail></p>')}
          <h2 class="sr-only" id="em-h-mittente">Mittente</h2>
          <div class="em-senders" role="radiogroup" aria-label="Account mittente">
            ${senders.map(
              (s, i) => html`
                <label class="em-sender" data-em-sender="${s.key}">
                  <input class="em-sender__input sr-only" type="radio" name="mittente" value="${s.key}"${i === 0 ? ' checked' : ''}>
                  <span class="em-sender__kind label">${esc(s.kindLabel)}</span>
                  <span class="em-sender__label">${esc(s.label)}</span>
                  <span class="em-sender__mail">${esc(s.email)}</span>
                  <span class="em-sender__provider label">${esc(s.provider)} · firma ${esc(s.footer?.id || '—')}${s.logo ? ' · con logo' : ''} · stile ${esc(s.styleLabel)}</span>
                  <span class="em-sender__check" aria-hidden="true">${icon('check')}</span>
                </label>
              `,
            )}
          </div>
          <div class="em-sender-detail">
            <div>
              <p class="label">Consigli per questo account</p>
              <ul class="em-tips" data-em-tips></ul>
            </div>
            <div>
              <p class="label">Firma che verrà aggiunta (versione attiva in profiles/footers.json)</p>
              <pre class="em-signature" data-em-signature></pre>
            </div>
          </div>
        </section>

        <!-- 02 · Come si scrive + campi -->
        <section class="em-block" id="scrivi" aria-labelledby="em-h-scrivi">
          ${blockHead('02', 'Come si scrive', '<p class="label" data-em-autosave>Bozza salvata in automatico</p>')}
          <h2 class="sr-only" id="em-h-scrivi">Scrittura</h2>
          <div class="em-write">
            <aside class="em-guide">
              <div class="em-guide__head">
                <div class="em-ring" style="--p:0" data-em-progress role="img" aria-label="Completamento 0%">
                  <svg viewBox="0 0 36 36" aria-hidden="true"><circle class="em-ring__track" cx="18" cy="18" r="16" pathLength="100"/><circle class="em-ring__bar" cx="18" cy="18" r="16" pathLength="100"/></svg>
                  <span class="em-ring__value" data-em-progress-value>0%</span>
                </div>
                <div>
                  <p class="h4">Avanzamento</p>
                  <p class="em-guide__note" data-em-progress-note>Sei passi: si spuntano da soli mentre scrivi.</p>
                </div>
              </div>
              <ol class="em-steps" data-em-steps>
                ${STEPS.map(
                  (s, i) => html`
                    <li class="em-step" data-step="${s.key}">
                      <span class="em-step__n label">${String(i + 1).padStart(2, '0')}</span>
                      <div class="em-step__body">
                        <p class="em-step__title">${esc(s.title)}</p>
                        <p class="em-step__text">${esc(s.text)}</p>
                        ${chip(s.action.label, s.action.attr, 'em-chip--sm')}
                      </div>
                      <span class="em-step__state" aria-hidden="true">${icon('check')}</span>
                    </li>
                  `,
                )}
              </ol>
            </aside>

            <form class="em-form" data-em-form novalidate autocomplete="off">
              <div class="em-form__grid">
                ${field({ id: 'em-to', name: 'to', label: 'A', placeholder: 'Nome Cognome <indirizzo>, altro@indirizzo.it', list: 'em-rubrica', hint: 'Più indirizzi separati da virgola. Con «Nome Cognome <indirizzo>» il saluto diventa personale; da un indirizzo nudo il nome non si deduce.' })}
                ${field({ id: 'em-cc', name: 'cc', label: 'Cc', opt: 'facoltativo', placeholder: 'Chi deve sapere', list: 'em-rubrica' })}
                ${field({ id: 'em-bcc', name: 'bcc', label: 'Ccn', opt: 'facoltativo', placeholder: 'Gruppi e copie nascoste', list: 'em-rubrica' })}
                <div class="field">
                  <label class="field__label label" for="em-tone">Tono</label>
                  <div class="field__select">
                    <select class="field__input" id="em-tone" name="tone" data-em-field="tone">
                      ${tones.map((t) => `<option value="${t.key}">${esc(t.label)} — «${esc(t.closing)}»</option>`)}
                    </select>
                    ${icon('arrowDown')}
                  </div>
                </div>
                <div class="field field--full">
                  <label class="field__label label" for="em-subject">Oggetto</label>
                  <input class="field__input" id="em-subject" type="text" name="subject" data-em-field="subject" autocomplete="off" placeholder="Cosa chiedi, per cosa, entro quando" maxlength="200">
                  <p class="field__hint"><span data-em-subject-hint>Tra 30 e 60 caratteri.</span><span class="label" data-em-subject-count>0 / 60</span></p>
                </div>
                <div class="field field--full">
                  <div class="em-toolbar" role="toolbar" aria-label="Inserisci un pezzo di testo">
                    <span class="label em-toolbar__label">Inserisci</span>
                    ${TOOLBAR.map(([key, label]) => chip(label, `data-em-snippet="${key}"`, 'em-chip--sm'))}
                  </div>
                  <label class="field__label label" for="em-body">Materiale grezzo — il testo dell’email</label>
                  <textarea class="field__input field__input--area em-body" id="em-body" name="body" data-em-field="body" rows="16" lang="it" spellcheck="true" placeholder="Saluto, chi sei, cosa chiedi, entro quando, chiusura. Se saluto e chiusura mancano, l’output li aggiunge in base al tono. La firma la mette l’output."></textarea>
                  <p class="field__hint"><span data-em-body-hint>Markdown come nel generatore: ## titoli, elenchi con -, **grassetto**, *corsivo*, [testo](url), tabelle, > citazioni, :::nota … ::: e :::bottone whatsapp … :::. Due spazi a fine riga = a capo.</span><span class="label" data-em-body-count>0 parole</span></p>
                </div>
                <div class="field">
                  <label class="field__label label" for="em-links">Collegamenti<span class="field__opt"> · facoltativi, uno per riga</span></label>
                  <textarea class="field__input field__input--area em-lines" id="em-links" name="links" data-em-field="links" rows="2" spellcheck="false" placeholder="https://…"></textarea>
                  <p class="field__hint">Compaiono in fondo all’email nel blocco «Collegamenti», come nel generatore.</p>
                </div>
                <div class="field">
                  <label class="field__label label" for="em-attachments">Allegati dichiarati<span class="field__opt"> · nomi dei file, uno per riga</span></label>
                  <textarea class="field__input field__input--area em-lines" id="em-attachments" name="attachments" data-em-field="attachments" rows="2" spellcheck="false" placeholder="Orario-I-semestre-2026-27.pdf"></textarea>
                  <p class="field__hint">Elencati nell’email nel riquadro «Allegati»: i file vanno poi allegati a mano nel programma di posta.</p>
                </div>
              </div>
              <div class="em-form__foot">
                <label class="em-switch"><input type="checkbox" name="signature" data-em-field="signature" checked><span class="em-switch__box" aria-hidden="true"></span><span>Firma dell’account in fondo (regola del generatore)</span></label>
                <div class="em-actions em-actions--tight">
                  ${chip('Salva bozza', 'data-em-draft-save')}
                  ${chip('Svuota', 'data-em-clear')}
                </div>
              </div>
            </form>
          </div>
          <datalist id="em-rubrica"></datalist>
        </section>

        <!-- 03 · Output -->
        <section class="em-block" id="output" aria-labelledby="em-h-output">
          ${blockHead('03', 'Output: l’email come la genera il generatore', '<p class="label" data-em-out-meta>—</p>')}
          <h2 class="sr-only" id="em-h-output">Output</h2>
          <div class="em-out" data-em-out>
            <div class="em-out__bar">
              <p class="em-out__state label"><span class="dot" data-em-state-dot></span><span data-em-state>—</span></p>
              <div class="em-seg em-seg--tabs" role="group" aria-label="Vista dell’output">
                ${VIEWS.map(([key, label], i) => `<label><input type="radio" name="em-view" value="${key}"${i === 0 ? ' checked' : ''}><span>${esc(label)}</span></label>`)}
              </div>
            </div>
            <div class="em-out__head">
              <p><span class="label">Da</span><span data-em-out-from></span></p>
              <p><span class="label">A</span><span data-em-out-to>—</span></p>
              <p data-em-out-cc-row hidden><span class="label">Cc</span><span data-em-out-cc></span></p>
              <p data-em-out-bcc-row hidden><span class="label">Ccn</span><span data-em-out-bcc></span></p>
              <p><span class="label">Oggetto</span><strong data-em-out-subject>—</strong></p>
              <p><span class="label">Anteprima</span><span class="em-out__preheader" data-em-out-preheader>—</span></p>
            </div>
            <div class="em-out__view" data-em-view="html">
              <iframe class="em-out__frame" title="Anteprima dell’email come arriva nel programma di posta" data-em-iframe></iframe>
            </div>
            <pre class="em-out__body em-out__body--text" data-em-view="text" data-em-out-text hidden>—</pre>
            <pre class="em-out__body em-out__body--mono" data-em-view="report" data-em-out-report hidden>—</pre>
            <pre class="em-out__body em-out__body--mono" data-em-view="source" data-em-out-source hidden>—</pre>
          </div>
          <ul class="em-checks em-checks--validation" data-em-validation></ul>
          <div class="em-actions">
            <button class="btn btn--primary" type="button" data-em-copy="rich"><span class="btn__label">Copia email formattata</span><span class="btn__icon">${icon('copy')}</span></button>
            ${chip('Copia testo (email.txt)', 'data-em-copy="text"')}
            ${chip('Copia oggetto', 'data-em-copy="subject"')}
            ${chip('Copia destinatari', 'data-em-copy="to"')}
            <a class="em-chip" href="#" data-em-open="mailto">Apri nel programma di posta</a>
            <a class="em-chip" href="#" target="_blank" rel="noopener" data-em-open="webmail" hidden>Apri nella webmail</a>
          </div>
          <div class="em-actions em-actions--files">
            <span class="label em-toolbar__label">Scarica</span>
            ${chip('email.html', 'data-em-download="html"')}
            ${chip('email-lite.html', 'data-em-download="lite"')}
            ${chip('email.txt', 'data-em-download="text"')}
            ${chip('report.md', 'data-em-download="report"')}
            ${chip('input per il generatore (.md)', 'data-em-download="input"')}
            ${chip('bozza .eml', 'data-em-download="eml"')}
          </div>
          <p class="em-status label" data-em-out-status role="status" aria-live="polite"></p>
          <div class="em-drafts" data-em-drafts hidden>
            <p class="label">Bozze salvate in questo browser</p>
            <ul class="em-drafts__list" data-em-drafts-list></ul>
          </div>
        </section>

        <!-- 04 · IA -->
        <section class="em-block" id="ia" aria-labelledby="em-h-ia">
          ${blockHead('04', 'Migliora con l’intelligenza artificiale', '<p class="label" data-em-ai-model>Granite 4.2 8B</p>')}
          <h2 class="sr-only" id="em-h-ia">Intelligenza artificiale</h2>
          <div class="em-ai">
            <div class="em-ai__actions" role="group" aria-label="Azioni">
              ${AI_ACTIONS.map(([key, label, note]) => `<button class="em-ai__btn" type="button" data-em-ai="${key}"><span class="em-ai__btn-label">${esc(label)}</span><span class="em-ai__btn-note">${esc(note)}</span></button>`)}
            </div>
            <div class="em-ai__opts">
              <div class="field">
                <label class="field__label label" for="em-ai-notes">Istruzioni per l’IA<span class="field__opt"> · facoltative</span></label>
                <input class="field__input" id="em-ai-notes" type="text" data-em-ai-notes autocomplete="off" placeholder="Es. resta sotto le 120 parole; cita la lezione di mercoledì; dai del voi" maxlength="600">
              </div>
              <fieldset class="em-seg">
                <legend class="label">Sforzo</legend>
                <label><input type="radio" name="effort" value="low"><span>Rapido</span></label>
                <label><input type="radio" name="effort" value="medium" checked><span>Normale</span></label>
                <label><input type="radio" name="effort" value="high"><span>Accurato</span></label>
              </fieldset>
            </div>
            <p class="em-status label" data-em-ai-status role="status" aria-live="polite">Scegli un’azione: l’IA riceve mittente, destinatari, tono, oggetto e testo.</p>
            <div class="em-ai__result" data-em-ai-result hidden>
              <div class="em-ai__meta label">
                <span data-em-ai-action></span>
                <span data-em-ai-usage></span>
                <span class="em-ai__score" data-em-ai-score hidden></span>
              </div>
              <div class="em-ai__grid">
                <div class="em-ai__col">
                  <p class="label">Oggetto proposto</p>
                  <p class="em-ai__subject" data-em-ai-subject>—</p>
                  <p class="label">Testo proposto</p>
                  <pre class="em-out__body em-out__body--text" data-em-ai-body>—</pre>
                </div>
                <div class="em-ai__col">
                  <div data-em-ai-wrap="subjects" hidden><p class="label">Oggetti alternativi</p><ul class="em-ai__list em-ai__list--pick" data-em-ai-subjects></ul></div>
                  <div data-em-ai-wrap="changes" hidden><p class="label">Cosa è cambiato</p><ul class="em-ai__list" data-em-ai-changes></ul></div>
                  <div data-em-ai-wrap="tips" hidden><p class="label">Consigli</p><ul class="em-ai__list" data-em-ai-tips></ul></div>
                </div>
              </div>
              <div class="em-actions">
                <button class="btn btn--primary" type="button" data-em-ai-apply="all"><span class="btn__label">Applica tutto</span><span class="btn__icon">${icon('check')}</span></button>
                ${chip('Solo l’oggetto', 'data-em-ai-apply="subject"')}
                ${chip('Solo il testo', 'data-em-ai-apply="body"')}
                ${chip('Scarta', 'data-em-ai-apply="discard"')}
              </div>
            </div>
          </div>

          <div class="em-usage" data-em-usage>
            <div class="em-usage__head">
              <p class="label em-usage__title">Consumi dell’IA</p>
              <p class="label" data-em-limits-at>—</p>
            </div>
            <div class="em-gauges em-gauges--limits" data-em-limits></div>
            <p class="em-gauge__note em-usage__note" data-em-limits-note></p>
            <div class="em-usage__bar">
              <fieldset class="em-seg">
                <legend class="label">Periodo</legend>
                <label><input type="radio" name="em-usage-range" value="today" checked><span>Oggi</span></label>
                <label><input type="radio" name="em-usage-range" value="week"><span>7 giorni</span></label>
                <label><input type="radio" name="em-usage-range" value="all"><span>Tutto</span></label>
              </fieldset>
              <div class="em-actions em-actions--tight">
                ${chip('Aggiorna limiti', 'data-em-limits-refresh')}
                ${chip('Scarica CSV', 'data-em-usage-csv')}
                ${chip('Azzera registro', 'data-em-usage-clear')}
              </div>
            </div>
            <div class="em-stats em-stats--usage">
              ${USAGE_STATS.map(
                ([key, label]) => html`
                  <div class="em-stat">
                    <p class="em-stat__value" data-em-usage-stat="${key}">0</p>
                    <p class="em-stat__label label">${esc(label)}</p>
                    <p class="em-stat__note" data-em-usage-note="${key}"></p>
                  </div>
                `,
              )}
            </div>
            <div class="em-usage__log">
              <table class="em-table">
                <caption class="sr-only">Registro delle richieste all’IA, dalla più recente</caption>
                <thead>
                  <tr>
                    <th scope="col">Quando</th>
                    <th scope="col">Azione</th>
                    <th scope="col">Sforzo</th>
                    <th scope="col">Modello</th>
                    <th scope="col" class="num">Tempo</th>
                    <th scope="col" class="num">Token in</th>
                    <th scope="col" class="num">Token out</th>
                    <th scope="col" class="num">Ragion.</th>
                    <th scope="col" class="num">Valore API</th>
                    <th scope="col">Esito</th>
                  </tr>
                </thead>
                <tbody data-em-usage-rows></tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- 05 · Statistiche -->
        <section class="em-block" id="statistiche" aria-labelledby="em-h-stat">
          ${blockHead('05', 'Statistiche, peso e lunghezza', '<p class="label" data-em-checks-count>Nessuna segnalazione</p>')}
          <h2 class="sr-only" id="em-h-stat">Statistiche</h2>
          <div class="em-stats">
            ${STATS.map(
              ([key, label, note]) => html`
                <div class="em-stat">
                  <p class="em-stat__value" data-em-stat="${key}">0</p>
                  <div class="stat__dim" aria-hidden="true"><span></span></div>
                  <p class="em-stat__label label">${esc(label)}</p>
                  <p class="em-stat__note">${esc(note)}</p>
                </div>
              `,
            )}
          </div>
          <div class="em-gauges">
            <div class="em-gauge" data-em-gauge="subject">
              <div class="em-gauge__head"><span class="label">Lunghezza dell’oggetto</span><span class="label" data-em-gauge-label>0 caratteri</span></div>
              <div class="em-gauge__bar"><span class="em-gauge__ideal" style="left:37.5%;width:37.5%"></span><span class="em-gauge__fill" data-em-gauge-fill></span></div>
              <p class="em-gauge__note">La fascia chiara è l’ideale (30–60): si legge intero anche sul telefono. Oltre 80 viene troncato.</p>
            </div>
            <div class="em-gauge" data-em-gauge="length">
              <div class="em-gauge__head"><span class="label">Lunghezza del corpo</span><span class="label" data-em-gauge-label>0 parole</span></div>
              <div class="em-gauge__bar"><span class="em-gauge__ideal" style="left:12.5%;width:37.5%"></span><span class="em-gauge__fill" data-em-gauge-fill></span></div>
              <p class="em-gauge__note">Fascia ideale 50–200 parole. Oltre 300 chi legge scorre: valuta due email o un allegato.</p>
            </div>
            <div class="em-gauge" data-em-gauge="readability">
              <div class="em-gauge__head"><span class="label">Leggibilità (indice Gulpease)</span><span class="label" data-em-gauge-label>—</span></div>
              <div class="em-gauge__bar"><span class="em-gauge__ideal" style="left:60%;width:40%"></span><span class="em-gauge__fill" data-em-gauge-fill></span></div>
              <p class="em-gauge__note">Sopra 60 è facile per chiunque; tra 40 e 60 serve una lettura attenta; sotto 40 è da specialisti.</p>
            </div>
            <div class="em-gauge" data-em-gauge="weight">
              <div class="em-gauge__head"><span class="label">Peso di email.html rispetto al limite di Gmail</span><span class="label" data-em-gauge-label>0 KB</span></div>
              <div class="em-gauge__bar"><span class="em-gauge__ideal" style="left:0;width:100%"></span><span class="em-gauge__fill" data-em-gauge-fill></span></div>
              <p class="em-gauge__note">Oltre 102 KB Gmail tronca e mostra «Visualizza messaggio completo». Il carattere incorporato pesa circa 46 KB: per Gmail c’è email-lite.html.</p>
            </div>
          </div>
          <ul class="em-checks" data-em-checks></ul>
        </section>

        <!-- 06 · Rubrica -->
        <section class="em-block" id="rubrica" aria-labelledby="em-h-rubrica">
          ${blockHead('06', 'Rubrica', '<p class="label" data-em-rubrica-count></p>')}
          <h2 class="sr-only" id="em-h-rubrica">Rubrica</h2>
          <div class="em-rubrica">
            <div class="em-rubrica__tools">
              <div class="field">
                <label class="field__label label" for="em-search">Cerca</label>
                <input class="field__input" id="em-search" type="search" data-em-search placeholder="Nome, indirizzo o ruolo" autocomplete="off">
              </div>
              <div class="em-actions em-actions--tight">
                ${chip('Esporta i nuovi', 'data-em-contacts-export')}
                <label class="em-chip">Importa<input class="sr-only" type="file" accept="application/json,.json" data-em-contacts-import></label>
              </div>
            </div>

            <section class="em-group" aria-labelledby="em-h-fav">
              <h3 class="h4" id="em-h-fav">Contatti preferiti</h3>
              <p class="em-group__empty" data-em-empty="fav">Nessun preferito: premi la stella su un contatto.</p>
              <ul class="em-contacts" data-em-list="fav"></ul>
            </section>

            <section class="em-group" aria-labelledby="em-h-new">
              <h3 class="h4" id="em-h-new">Indirizzi nuovi</h3>
              <form class="em-newc" data-em-contact-form novalidate>
                <div class="field"><label class="field__label label" for="em-nc-name">Nome</label><input class="field__input" id="em-nc-name" name="name" type="text" autocomplete="off" placeholder="Prof. Mario Rossi"></div>
                <div class="field"><label class="field__label label" for="em-nc-email">Indirizzo</label><input class="field__input" id="em-nc-email" name="email" type="email" autocomplete="off" placeholder="mario.rossi@dominio.it" required></div>
                <div class="field"><label class="field__label label" for="em-nc-role">Ruolo<span class="field__opt"> · facoltativo</span></label><input class="field__input" id="em-nc-role" name="role" type="text" autocomplete="off" placeholder="Docente di Fisica"></div>
                <div class="field">
                  <label class="field__label label" for="em-nc-group">Gruppo</label>
                  <div class="field__select">
                    <select class="field__input" id="em-nc-group" name="group">
                      ${Object.entries(emailData.contactGroups)
                        .filter(([k]) => k !== 'me')
                        .map(([k, v]) => `<option value="${k}">${esc(v)}</option>`)}
                    </select>
                    ${icon('arrowDown')}
                  </div>
                </div>
                <div class="field"><label class="field__label label" for="em-nc-salutation">Saluto<span class="field__opt"> · facoltativo</span></label><input class="field__input" id="em-nc-salutation" name="salutation" type="text" autocomplete="off" placeholder="Gentile Prof. Rossi"></div>
                <div class="em-newc__foot">
                  <button class="btn btn--primary btn--sm" type="submit"><span class="btn__label">Aggiungi</span><span class="btn__icon">${icon('plus')}</span></button>
                  <p class="em-status label" data-em-contact-status role="status" aria-live="polite"></p>
                </div>
              </form>
              <p class="em-group__empty" data-em-empty="new">Ancora nessun indirizzo nuovo.</p>
              <ul class="em-contacts" data-em-list="new"></ul>
            </section>

            <section class="em-group" aria-labelledby="em-h-known">
              <h3 class="h4" id="em-h-known">Contatti conosciuti</h3>
              <p class="em-group__empty" data-em-empty="known" hidden>Nessun contatto corrisponde alla ricerca.</p>
              <ul class="em-contacts" data-em-list="known"></ul>
            </section>
          </div>
        </section>

        <footer class="em-foot label">
          <p>Strumento privato di Alberto Pecchini · non indicizzato · niente cookie: bozze, preferiti e nuovi indirizzi restano nel browser · generatore v${esc(emailData.generatorVersion)} · tema da ${esc(emailData.theme.source)}</p>
          <a class="uline" href="/">Torna al sito</a>
        </footer>
      </div>
    </section>
    <script type="application/json" id="email-data">${jsonLd(emailData)}</script>
  `
}
