// La macchina del tempo (/tempo/), copiata dalla Wayback Machine: cambia cattura
// senza tornare al server. Le barre dell'istogramma, le frecce, i tasti ← →,
// l'indirizzo (#v=<sha>) che ricorda la cattura.

import { $, $$, clamp } from './utils.js'

export function initTempo() {
  const root = $('[data-tempo]')
  if (!root) return
  const dati = JSON.parse($('[data-tm-data]', root).textContent)
  const N = dati.length
  const el = {
    shot: $('[data-tm-shot]', root),
    srcM: $('[data-tm-src-m]', root),
    err: $('[data-tm-err]', root),
    n: $('[data-tm-n]', root),
    date: $('[data-tm-date]', root),
    time: $('[data-tm-time]', root),
    sha: $('[data-tm-sha]', root),
    msg: $('[data-tm-msg]', root),
    commit: $('[data-tm-commit]', root),
    github: $('[data-tm-github]', root),
    prev: $('[data-tm-prev]', root),
    next: $('[data-tm-next]', root),
    prevDate: $('[data-tm-prev-date]', root),
    nextDate: $('[data-tm-next-date]', root),
    cols: $$('[data-tm-go]', root),
  }
  const page = $('[data-tm-page]', root)
  const frame = $('[data-tm-frame]', root)
  const live = $('[data-tm-live]', root)
  const apri = $('[data-tm-apri]', root)
  const pic = $('.wb__pic', root)
  const archivio = page?.dataset.tmArchivio || ''
  let vive = new Set() // le versioni che il server di casa serve davvero
  let depositato = '' // quando il server di casa ha aggiornato il deposito l'ultima volta
  const corta = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '')
  const lunga = (iso) => new Date(iso + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })

  let i = N - 1
  const preload = (k) => {
    const v = dati[k]
    if (!v?.d) return
    new Image().src = v.d
  }

  const vai = (k, { spingi = true } = {}) => {
    i = clamp(k, 0, N - 1)
    const v = dati[i]
    const dalVivo = vive.has(v.short)
    frame.hidden = !dalVivo
    live.hidden = !dalVivo
    pic.hidden = dalVivo
    if (dalVivo) {
      // la data dell'ultimo deposito nell'indirizzo: una versione depositata di nuovo non
      // arriva dalla cache del browser (il 3.11.2026 restava la copia rotta)
      const url = `${archivio}/${v.short}/${depositato ? `?d=${depositato}` : ''}`
      if (frame.src !== url) frame.src = url
      apri.href = url
      el.err.hidden = true
    } else if (v.d) {
      el.err.hidden = true
      el.shot.classList.add('is-loading')
      el.shot.onload = () => el.shot.classList.remove('is-loading')
      el.shot.height = v.dh
      el.shot.alt = `La home il ${lunga(v.data)}`
      el.srcM.srcset = v.m
      el.shot.src = v.d
      el.shot.hidden = false
    } else {
      el.err.hidden = false
      el.err.textContent = v.errore ? `Questa cattura non si ricostruisce più: ${v.errore}.` : 'Questa cattura è ancora in ricostruzione: torna fra poco.'
      el.shot.hidden = true
    }
    el.n.textContent = v.n
    el.date.textContent = corta(v.data)
    el.time.textContent = `${v.ora}:00`
    el.sha.textContent = v.short
    el.msg.textContent = v.msg
    el.commit.textContent = v.commit
    el.github.href = `https://github.com/ygpzk/AP/commit/${v.sha}`
    const p = dati[i - 1]
    const n = dati[i + 1]
    el.prevDate.textContent = p ? corta(p.data) : '—'
    el.nextDate.textContent = n ? corta(n.data) : '—'
    el.prev.href = p ? `#v=${p.short}` : '#'
    el.next.href = n ? `#v=${n.short}` : '#'
    el.prev.toggleAttribute('aria-disabled', !p)
    el.next.toggleAttribute('aria-disabled', !n)
    el.cols.forEach((c) => c.classList.toggle('is-current', Number(c.dataset.tmGo) === i))
    if (spingi) history.replaceState(null, '', `#v=${v.short}`)
    scrollTo({ top: 0, behavior: 'auto' })
    preload(i - 1)
    preload(i + 1)
  }

  el.cols.forEach((c) => c.addEventListener('click', () => vai(Number(c.dataset.tmGo))))
  el.prev.addEventListener('click', (e) => {
    e.preventDefault()
    vai(i - 1)
  })
  el.next.addEventListener('click', (e) => {
    e.preventDefault()
    vai(i + 1)
  })
  addEventListener('keydown', (e) => {
    if (e.target.closest?.('input, textarea, select, [contenteditable]') || e.ctrlKey || e.metaKey || e.altKey) return
    if (e.key === 'ArrowLeft') vai(i - 1)
    else if (e.key === 'ArrowRight') vai(i + 1)
    else return
    e.preventDefault()
  })

  const m = location.hash.match(/v=([0-9a-f]{7,})/)
  const k = m ? dati.findIndex((v) => v.sha.startsWith(m[1]) || v.short === m[1]) : -1
  i = k >= 0 ? k : Number(el.n.textContent) - 1 || N - 1
  if (k >= 0) vai(k, { spingi: false })
  else preload(i - 1)

  // il server di casa: se risponde entro tre secondi, da qui in poi le pagine vere
  if (archivio && frame) {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 3000)
    fetch(`${archivio}/stato.json`, { signal: ctrl.signal, cache: 'no-store' })
      .then((r) => r.json())
      .then((s) => {
        vive = new Set(s.versioni || [])
        depositato = String(s.aggiornato || '').replace(/\D/g, '').slice(0, 14)
        if (vive.size) vai(i, { spingi: false })
      })
      .catch(() => {})
      .finally(() => clearTimeout(t))
  }
  addEventListener('hashchange', () => {
    const h = location.hash.match(/v=([0-9a-f]{7,})/)
    const j = h ? dati.findIndex((v) => v.sha.startsWith(h[1]) || v.short === h[1]) : -1
    if (j >= 0 && j !== i) vai(j, { spingi: false })
  })
}
