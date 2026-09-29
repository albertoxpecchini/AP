// Modulo di contatto: validazione lato client e stati idle → loading → successo | errore.
//
// Invio: se il form ha un `data-endpoint` i dati partono in POST (JSON) verso la
// funzione serverless, che consegna via email e WhatsApp; altrimenti viene
// composta una email nel programma di posta del visitatore.

import { $, $$ } from './utils.js'

const RULES = {
  nome: (v) => (v.trim().length < 2 ? 'Scrivi nome e cognome.' : ''),
  email: (v) => (!v.trim() ? 'Serve un indirizzo email per risponderti.' : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? 'L’indirizzo non sembra valido: controlla chiocciola e dominio.' : ''),
  telefono: (v) => (v.trim() && !/^[+0-9 ()./-]{6,20}$/.test(v.trim()) ? 'Usa solo cifre, spazi e il prefisso (es. +39 333 000 0000).' : ''),
  tipo: (v) => (!v ? 'Scegli il tipo di progetto: mi aiuta a prepararmi.' : ''),
  messaggio: (v) => (v.trim().length < 20 ? `Ancora qualche dettaglio: servono almeno 20 caratteri (ora ${v.trim().length}).` : ''),
  privacy: (_, field) => (!field.checked ? 'Per inviare serve il consenso al trattamento dei dati.' : ''),
}

// ── Turnstile ────────────────────────────────────────────────────────────────
// Il riquadro è invisibile finché Cloudflare non sospetta un bot; in quel caso
// chiede una conferma. Lo script è caricato solo su /contatti/ ed è asincrono,
// quindi al momento dell'invio potrebbe non essere ancora pronto: `getToken`
// attende il gettone e, se non arriva, lascia partire la richiesta lo stesso —
// sarà il server a decidere, con gli altri filtri ancora attivi.

function initTurnstile(form) {
  const box = $('[data-turnstile]', form)
  if (!box) return null

  let widgetId = null
  let pending = null
  let token = ''

  const render = () => {
    if (widgetId !== null || !window.turnstile) return
    widgetId = window.turnstile.render(box, {
      sitekey: box.dataset.sitekey,
      language: 'it',
      appearance: 'interaction-only',
      callback: (value) => {
        token = value
        pending?.resolve(value)
        pending = null
      },
      'error-callback': () => {
        pending?.resolve('')
        pending = null
      },
      'expired-callback': () => {
        token = ''
      },
    })
  }

  // Lo script arriva con `async defer`: se non c'è ancora, lo si attende.
  if (window.turnstile) render()
  else {
    const timer = setInterval(() => {
      if (!window.turnstile) return
      clearInterval(timer)
      render()
    }, 150)
    setTimeout(() => clearInterval(timer), 15_000)
  }

  return {
    getToken: () => {
      if (token) return Promise.resolve(token)
      if (widgetId === null) render()
      if (widgetId === null) return Promise.resolve('') // script mai arrivato
      return new Promise((resolve) => {
        pending = { resolve }
        setTimeout(() => {
          if (!pending) return
          pending.resolve('')
          pending = null
        }, 8000)
      })
    },
    reset: () => {
      token = ''
      if (widgetId !== null) window.turnstile?.reset(widgetId)
    },
  }
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
  const turnstile = initTurnstile(form)
  // Momento in cui la pagina è stata aperta: il server scarta gli invii
  // arrivati dopo pochi istanti, perché nessuno compila un modulo così in fretta.
  let openedAt = Date.now()

  // Dalle pagine dei servizi si arriva con ?tipo=<voce>: se la voce esiste nel
  // menu, è già scelta (es. /contatti/?tipo=Assistenza%20informatica#modulo).
  const tipo = new URLSearchParams(location.search).get('tipo')
  if (tipo && form.elements.tipo && [...form.elements.tipo.options].some((o) => o.value === tipo)) form.elements.tipo.value = tipo

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

  // La richiesta come email già scritta: serve senza endpoint e come ripiego
  // quando il server non riesce a consegnarla.
  const mailto = (data) => {
    const lines = [`Nome: ${data.nome}`, `Email: ${data.email}`]
    if (data.telefono) lines.push(`Telefono: ${data.telefono}`)
    lines.push(`Tipo di progetto: ${data.tipo}`)
    if (data.budget) lines.push(`Budget: ${data.budget}`)
    lines.push('', data.messaggio)
    return `mailto:${form.dataset.mail}?subject=${encodeURIComponent(form.dataset.subject + data.tipo)}&body=${encodeURIComponent(lines.join('\n'))}`
  }

  // Consegna fallita lato server (o rete giù a metà): il testo scritto non va
  // perso, un clic lo apre nel programma di posta di chi scrive.
  const fallback = (data, text) => {
    setState('error', text)
    const link = document.createElement('a')
    link.className = 'form__fallback'
    link.href = mailto(data)
    link.textContent = 'Invia la richiesta via email, già scritta →'
    status.append(' ', link)
  }

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
        const token = turnstile ? await turnstile.getToken() : ''
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 20_000)
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ ...data, privacy: true, _subject: form.dataset.subject + data.tipo, _t: openedAt, _turnstile: token }),
          signal: controller.signal,
        })
        clearTimeout(timer)

        if (!response.ok) {
          // Il server spiega cosa non va: meglio il suo messaggio di uno generico.
          const payload = await response.json().catch(() => null)
          turnstile?.reset()
          // consegna non riuscita (5xx): niente vicolo cieco, il ripiego via email
          if (response.status >= 500) {
            fallback(data, 'Il modulo in questo momento non riesce a consegnare la richiesta.')
            return
          }
          if (payload?.fields?.length) {
            const first = fields.find((f) => payload.fields.includes(f.name))
            setState('error', payload.error || 'Controlla i campi evidenziati.')
            first?.focus()
            return
          }
          if (payload?.error) {
            setState('error', payload.error)
            return
          }
          throw new Error(`HTTP ${response.status}`)
        }
        doneText.textContent = `Grazie ${data.nome.split(' ')[0]}: ho ricevuto la richiesta e ti rispondo entro un giorno lavorativo all’indirizzo ${data.email}.`
      } else {
        await new Promise((resolve) => setTimeout(resolve, 650))
        location.href = mailto(data)
        doneText.textContent = `Si è aperto il tuo programma di posta con il messaggio già compilato: premi «Invia» per spedirlo. Se non si è aperto nulla, scrivimi a ${form.dataset.mail}.`
      }
      setState('idle')
      done.hidden = false
      done.focus()
    } catch (err) {
      if (navigator.onLine) fallback(data, 'L’invio non è riuscito.')
      else setState('error', 'Sembra che tu sia offline: controlla la connessione e riprova.')
    }
  })

  $('[data-form-again]', form)?.addEventListener('click', () => {
    form.reset()
    touched.clear()
    $$('[data-field]', form).forEach((w) => w.classList.remove('is-valid', 'is-invalid'))
    $$('.field__error', form).forEach((el) => (el.hidden = true))
    if (counter) counter.textContent = `0 / ${message.maxLength}`
    done.hidden = true
    turnstile?.reset()
    openedAt = Date.now()
    setState('idle')
    form.elements.nome.focus()
  })
}
