// Modulo di contatto: validazione lato client e stati idle → loading → successo | errore.
//
// Invio: se il form ha un `data-endpoint` i dati partono in POST (JSON);
// altrimenti viene composta una email nel programma di posta del visitatore.

import { $, $$ } from './utils.js'

const RULES = {
  nome: (v) => (v.trim().length < 2 ? 'Scrivi nome e cognome.' : ''),
  email: (v) => (!v.trim() ? 'Serve un indirizzo email per risponderti.' : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? 'L’indirizzo non sembra valido: controlla chiocciola e dominio.' : ''),
  telefono: (v) => (v.trim() && !/^[+0-9 ()./-]{6,20}$/.test(v.trim()) ? 'Usa solo cifre, spazi e il prefisso (es. +39 333 000 0000).' : ''),
  tipo: (v) => (!v ? 'Scegli il tipo di progetto: mi aiuta a prepararmi.' : ''),
  messaggio: (v) => (v.trim().length < 20 ? `Ancora qualche dettaglio: servono almeno 20 caratteri (ora ${v.trim().length}).` : ''),
  privacy: (_, field) => (!field.checked ? 'Per inviare serve il consenso al trattamento dei dati.' : ''),
}

export function initForm() {
  const form = $('[data-form]')
  if (!form) return
  const status = $('[data-form-status]', form)
  const submitLabel = $('[data-form-label]', form)
  const done = $('[data-form-done]', form)
  const doneText = $('[data-form-done-text]', form)
  const counter = $('[data-form-counter]', form)
  const idleLabel = submitLabel.textContent
  const touched = new Set()

  const validate = (field) => {
    const rule = RULES[field.name]
    if (!rule) return true
    const message = rule(field.value, field)
    const wrap = field.closest('[data-field]')
    const error = $('.field__error', wrap)
    wrap.classList.toggle('is-invalid', Boolean(message))
    wrap.classList.toggle('is-valid', !message && Boolean(field.value) && field.type !== 'checkbox')
    field.setAttribute('aria-invalid', String(Boolean(message)))
    error.textContent = message
    error.hidden = !message
    return !message
  }

  const fields = $$('input, select, textarea', form).filter((f) => RULES[f.name])
  fields.forEach((field) => {
    field.addEventListener('blur', () => {
      touched.add(field.name)
      validate(field)
    })
    field.addEventListener(field.type === 'checkbox' || field.tagName === 'SELECT' ? 'change' : 'input', () => touched.has(field.name) && validate(field))
  })

  const message = form.elements.messaggio
  message?.addEventListener('input', () => counter && (counter.textContent = `${message.value.length} / ${message.maxLength}`))

  const setState = (state, text = '') => {
    form.classList.toggle('is-loading', state === 'loading')
    form.classList.toggle('is-error', state === 'error')
    form.setAttribute('aria-busy', String(state === 'loading'))
    submitLabel.textContent = state === 'loading' ? 'Invio in corso…' : idleLabel
    status.textContent = text
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    fields.forEach((f) => touched.add(f.name))
    const invalid = fields.filter((f) => !validate(f))
    if (invalid.length) {
      setState('error', invalid.length === 1 ? 'Controlla il campo evidenziato.' : `Controlla i ${invalid.length} campi evidenziati.`)
      invalid[0].focus()
      return
    }
    // campo trappola per i bot: un umano non lo vede e non lo compila
    if (form.elements.sito.value) return setState('idle')

    const data = Object.fromEntries(new FormData(form))
    delete data.sito
    setState('loading')

    try {
      const endpoint = form.dataset.endpoint
      if (endpoint) {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 12_000)
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ ...data, _subject: form.dataset.subject + data.tipo }),
          signal: controller.signal,
        })
        clearTimeout(timer)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        doneText.textContent = `Grazie ${data.nome.split(' ')[0]}: ho ricevuto la richiesta e ti rispondo entro un giorno lavorativo all’indirizzo ${data.email}.`
      } else {
        await new Promise((resolve) => setTimeout(resolve, 650))
        const lines = [`Nome: ${data.nome}`, `Email: ${data.email}`]
        if (data.telefono) lines.push(`Telefono: ${data.telefono}`)
        lines.push(`Tipo di progetto: ${data.tipo}`)
        if (data.budget) lines.push(`Budget: ${data.budget}`)
        lines.push('', data.messaggio)
        location.href = `mailto:${form.dataset.mail}?subject=${encodeURIComponent(form.dataset.subject + data.tipo)}&body=${encodeURIComponent(lines.join('\n'))}`
        doneText.textContent = `Si è aperto il tuo programma di posta con il messaggio già compilato: premi «Invia» per spedirlo. Se non si è aperto nulla, scrivimi a ${form.dataset.mail}.`
      }
      setState('idle')
      done.hidden = false
      done.focus()
    } catch (err) {
      setState('error', navigator.onLine ? `L’invio non è riuscito. Riprova tra poco oppure scrivimi a ${form.dataset.mail}.` : 'Sembra che tu sia offline: controlla la connessione e riprova.')
    }
  })

  $('[data-form-again]', form)?.addEventListener('click', () => {
    form.reset()
    touched.clear()
    $$('[data-field]', form).forEach((w) => w.classList.remove('is-valid', 'is-invalid'))
    $$('.field__error', form).forEach((el) => (el.hidden = true))
    if (counter) counter.textContent = `0 / ${message.maxLength}`
    done.hidden = true
    setState('idle')
    form.elements.nome.focus()
  })
}
