// La macchina del tempo (/tempo/), copiata dalla Wayback Machine: cambia sito e cattura
// senza tornare al server. Il selettore dei siti, le barre dell'istogramma (con l'anteprima
// al passaggio), le frecce, i tasti ← →, i «momenti» (i commit del giorno arrivano a
// richiesta da /media/tempo/<id>/commit.json), l'indirizzo (#v=<sha>, #s=<sito>&v=<sha>)
// che ricorda dove si era.

import { $, $$, clamp } from './utils.js'
import { istogramma, conteggio, chips, corta, lunga, foto, percorso, dominio, momentiSito, momentiGiorno } from '../templates/pages/tempo-pezzi.js'

export function initTempo() {
  const root = $('[data-tempo]')
  if (!root) return
  const siti = JSON.parse($('[data-tm-data]', root).textContent)
  const el = {
    bar: $('[data-tm-bar]', root),
    sito: $('[data-tm-sito]', root),
    oggi: $('[data-tm-oggi]', root),
    count: $('[data-tm-count]', root),
    spark: $('[data-tm-spark]', root),
    months: $('[data-tm-months]', root),
    tip: $('[data-tm-tip]', root),
    tipImg: $('[data-tm-tip-img]', root),
    tipDate: $('[data-tm-tip-date]', root),
    tipN: $('[data-tm-tip-n]', root),
    shot: $('[data-tm-shot]', root),
    srcM: $('[data-tm-src-m]', root),
    err: $('[data-tm-err]', root),
    n: $('[data-tm-n]', root),
    tot: $('[data-tm-tot]', root),
    date: $('[data-tm-date]', root),
    time: $('[data-tm-time]', root),
    sha: $('[data-tm-sha]', root),
    msg: $('[data-tm-msg]', root),
    chips: $('[data-tm-chips]', root),
    github: $('[data-tm-github]', root),
    prev: $('[data-tm-prev]', root),
    next: $('[data-tm-next]', root),
    prevDate: $('[data-tm-prev-date]', root),
    nextDate: $('[data-tm-next-date]', root),
    more: $('[data-tm-more]', root),
    drawer: $('[data-tm-drawer]', root),
    giorno: $('[data-tm-giorno]', root),
    momenti: $('[data-tm-momenti]', root),
  }
  const page = $('[data-tm-page]', root)
  const frame = $('[data-tm-frame]', root)
  const live = $('[data-tm-live]', root)
  const apri = $('[data-tm-apri]', root)
  const pic = $('.wb__pic', root)
  const archivio = page?.dataset.tmArchivio || ''
  let vive = {} // per sito, le versioni che il server di casa serve davvero
  let depositato = '' // quando il server di casa ha aggiornato il deposito l'ultima volta
  const commit = {} // i commit uno per uno, per sito, quando servono

  let s = 0 // il sito
  let i = 0 // la cattura
  let scelta = false // la cattura l'ha scelta chi guarda (indirizzo, barra, frecce): lo stato del server non la cambia
  const sito = () => siti[s]
  const dati = () => siti[s].versioni

  // l'altezza della barra, perché l'iframe riempia il resto della finestra
  if (el.bar && 'ResizeObserver' in window) new ResizeObserver(() => root.style.setProperty('--wb-h', `${el.bar.offsetHeight}px`)).observe(el.bar)

  const preload = (k) => {
    const v = dati()[k]
    if (v?.foto && !vive[sito().id]?.has(v.short)) new Image().src = foto(sito().id, v.short, 'd')
  }

  const indirizzo = (v) => (sito().id === 'ap' ? `#v=${v.short}` : `#s=${sito().id}&v=${v.short}`)

  function caricaCommit() {
    const id = sito().id
    if (commit[id] !== undefined) return Promise.resolve(commit[id])
    commit[id] = fetch(`/media/tempo/${id}/commit.json`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((c) => (commit[id] = c))
    return commit[id]
  }

  function disegnaGiorno() {
    if (el.drawer.hidden) return
    const v = dati()[i]
    const id = sito().id
    const c = commit[id]
    if (c && !(c instanceof Promise)) {
      el.giorno.innerHTML = momentiGiorno(v, c[v.data] || null, sito())
      return
    }
    el.giorno.innerHTML = momentiGiorno(v, undefined, sito())
    caricaCommit().then(() => {
      if (sito().id === id && dati()[i] === v) el.giorno.innerHTML = momentiGiorno(v, commit[id]?.[v.data] || null, sito())
    })
  }

  const vai = (k, { spingi = true, scorri = true, sceglie = true } = {}) => {
    if (sceglie) scelta = true
    const lista = dati()
    i = clamp(k, 0, lista.length - 1)
    const v = lista[i]
    const id = sito().id
    const dalVivo = Boolean(vive[id]?.has(v.short))
    frame.hidden = !dalVivo
    live.hidden = !dalVivo
    pic.hidden = dalVivo
    if (dalVivo) {
      // la data dell'ultimo deposito nell'indirizzo: una versione depositata di nuovo non
      // arriva dalla cache del browser (il 3.11.2026 restava la copia rotta)
      const url = `${archivio}/${percorso(id, v.short)}/${depositato ? `?d=${depositato}` : ''}`
      if (frame.src !== url) frame.src = url
      frame.title = `${dominio(sito().url)} il ${lunga(v.data)}, dal vivo`
      apri.href = url
      el.err.hidden = true
    } else if (v.foto) {
      el.err.hidden = true
      el.shot.classList.add('is-loading')
      el.shot.onload = () => el.shot.classList.remove('is-loading')
      el.shot.height = v.dh
      el.shot.alt = `${dominio(sito().url)} il ${lunga(v.data)}`
      el.srcM.srcset = foto(id, v.short, 'm')
      el.shot.src = foto(id, v.short, 'd')
      el.shot.hidden = false
    } else {
      el.err.hidden = false
      el.err.textContent = v.errore ? `Questa cattura non si ricostruisce più: ${v.errore}.` : 'Questa cattura è ancora in ricostruzione: torna fra poco.'
      el.shot.hidden = true
    }
    el.n.textContent = v.n
    el.tot.textContent = lista.length
    el.date.textContent = corta(v.data)
    el.time.textContent = `${v.ora}:00`
    el.sha.textContent = v.short
    el.msg.textContent = v.msg
    el.chips.innerHTML = chips(v)
    el.github.href = `${sito().github}/commit/${v.sha}`
    el.github.title = v.msg
    const p = lista[i - 1]
    const n = lista[i + 1]
    el.prevDate.textContent = p ? corta(p.data) : '—'
    el.nextDate.textContent = n ? corta(n.data) : '—'
    el.prev.href = p ? indirizzo(p) : '#'
    el.next.href = n ? indirizzo(n) : '#'
    el.prev.toggleAttribute('aria-disabled', !p)
    el.next.toggleAttribute('aria-disabled', !n)
    $$('[data-tm-go]', el.spark).forEach((c) => c.classList.toggle('is-current', Number(c.dataset.tmGo) === i))
    if (spingi) history.replaceState(null, '', indirizzo(v))
    if (scorri) scrollTo({ top: 0, behavior: 'auto' })
    disegnaGiorno()
    preload(i - 1)
    preload(i + 1)
  }

  // in grigio chiaro le barre delle catture che non hanno né la foto né la pagina vera
  const segnaVive = () => $$('[data-tm-go]', el.spark).forEach((c) => {
    const v = dati()[Number(c.dataset.tmGo)]
    c.classList.toggle('is-off', !v.foto && !vive[sito().id]?.has(v.short))
  })

  // il sito: istogramma, conteggio, momenti, e la cattura più recente con la foto
  function cambiaSito(j, { k = null, spingi = true } = {}) {
    s = clamp(j, 0, siti.length - 1)
    const si = sito()
    el.sito.value = si.id
    el.oggi.href = `${si.url}/`
    const lista = dati()
    const ultima = k ?? Math.max(0, lista.findLastIndex((v) => v.foto || vive[si.id]?.has(v.short)))
    const isto = istogramma(lista, ultima)
    el.spark.style.setProperty('--n', isto.n)
    el.months.style.setProperty('--n', isto.n)
    el.spark.innerHTML = isto.barre
    el.months.innerHTML = isto.mesi
    segnaVive()
    el.count.innerHTML = conteggio(si)
    el.momenti.innerHTML = momentiSito(si)
    if (!el.drawer.hidden) caricaCommit()
    scelta = k !== null
    vai(ultima, { spingi, sceglie: false })
  }

  // l'anteprima sopra la barra, come il calendario della Wayback Machine
  const mostraTip = (c) => {
    const v = dati()[Number(c.dataset.tmGo)]
    if (!v) return
    const id = sito().id
    el.tipImg.hidden = !v.foto
    if (v.foto) el.tipImg.src = foto(id, v.short, v.t ? 't' : 'd')
    el.tipDate.textContent = `${lunga(v.data)} · ${v.ora}`
    el.tipN.textContent = `${v.commit} commit${v.st?.piu || v.st?.meno ? ` · +${v.st.piu} −${v.st.meno}` : ''}${v.foto || vive[id]?.has(v.short) ? '' : ' · senza foto'}`
    const box = el.spark.getBoundingClientRect()
    const r = c.getBoundingClientRect()
    el.tip.hidden = false
    const w = el.tip.offsetWidth
    el.tip.style.left = `${clamp(r.left + r.width / 2 - box.left - w / 2, -4, box.width - w + 4)}px`
  }
  const nascondiTip = () => (el.tip.hidden = true)
  el.spark.addEventListener('click', (e) => {
    const c = e.target.closest('[data-tm-go]')
    if (c) vai(Number(c.dataset.tmGo))
  })
  el.spark.addEventListener('pointerover', (e) => {
    const c = e.target.closest('[data-tm-go]')
    if (c && e.pointerType === 'mouse') mostraTip(c)
  })
  el.spark.addEventListener('pointerleave', nascondiTip)
  el.spark.addEventListener('focusin', (e) => {
    const c = e.target.closest('[data-tm-go]')
    if (c) mostraTip(c)
  })
  el.spark.addEventListener('focusout', nascondiTip)

  el.sito.addEventListener('change', () => cambiaSito(siti.findIndex((x) => x.id === el.sito.value)))
  el.prev.addEventListener('click', (e) => {
    e.preventDefault()
    vai(i - 1)
  })
  el.next.addEventListener('click', (e) => {
    e.preventDefault()
    vai(i + 1)
  })
  el.more.addEventListener('click', () => {
    const apre = el.drawer.hidden
    el.drawer.hidden = !apre
    el.more.setAttribute('aria-expanded', String(apre))
    if (apre) {
      caricaCommit()
      disegnaGiorno()
    }
  })
  addEventListener('keydown', (e) => {
    if (e.target.closest?.('input, textarea, select, [contenteditable]') || e.ctrlKey || e.metaKey || e.altKey) return
    if (e.key === 'ArrowLeft') vai(i - 1)
    else if (e.key === 'ArrowRight') vai(i + 1)
    else if (e.key === 'Escape' && !el.drawer.hidden) el.more.click()
    else return
    e.preventDefault()
  })

  // dall'indirizzo: #v=<sha> (albertopecchini.it, com'era prima del 3.11.2026) o #s=<sito>&v=<sha>
  function dallIndirizzo() {
    const h = new URLSearchParams(location.hash.slice(1))
    const j = Math.max(0, siti.findIndex((x) => x.id === (h.get('s') || 'ap')))
    const v = (h.get('v') || '').toLowerCase()
    const k = v ? siti[j].versioni.findIndex((x) => x.sha.startsWith(v) || x.short === v) : -1
    return { j, k: k >= 0 ? k : null, chiesto: Boolean(h.get('s') || v) }
  }
  const primo = dallIndirizzo()
  if (primo.chiesto) cambiaSito(primo.j, { k: primo.k, spingi: false })
  else {
    i = Number(el.n.textContent) - 1 || dati().length - 1
    preload(i - 1)
  }
  scelta = primo.k !== null

  // il server di casa: se risponde entro tre secondi, da qui in poi le pagine vere
  if (archivio && frame) {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 3000)
    fetch(`${archivio}/stato.json`, { signal: ctrl.signal, cache: 'no-store' })
      .then((r) => r.json())
      .then((st) => {
        vive = Object.fromEntries(siti.map((x) => [x.id, new Set(st.siti?.[x.id] || (x.id === 'ap' ? st.versioni : []) || [])]))
        depositato = String(st.aggiornato || '').replace(/\D/g, '').slice(0, 14)
        segnaVive()
        // senza una cattura scelta, la più recente che si può vedere (ora anche dal vivo)
        const k = scelta ? i : Math.max(0, dati().findLastIndex((v) => v.foto || vive[sito().id].has(v.short)))
        vai(k, { spingi: false, scorri: false, sceglie: false })
      })
      .catch(() => {})
      .finally(() => clearTimeout(t))
  }
  addEventListener('hashchange', () => {
    const h = dallIndirizzo()
    if (h.j !== s) cambiaSito(h.j, { k: h.k, spingi: false })
    else if (h.k !== null && h.k !== i) vai(h.k, { spingi: false })
  })
}
