// Filtri del portfolio. Lavorano sugli attributi data-* delle card:
//   data-cat (spazi) · data-year · data-sector · data-tech (|) · data-type (|)
// Lo stato è riflesso nell'URL (?cat=web&anno=2026…), quindi un filtro è linkabile.

import { $, $$, reducedMotion, announce } from './utils.js'

const SPAN_PATTERN = [7, 5, 4, 4, 4, 5, 7, 6, 6]
const PARAMS = { cat: 'cat', year: 'anno', sector: 'settore', tech: 'tech', type: 'tipo' }

const matches = (item, state) =>
  (!state.cat || item.dataset.cat.split(' ').includes(state.cat)) &&
  (!state.year || item.dataset.year === state.year) &&
  (!state.sector || item.dataset.sector === state.sector) &&
  (!state.tech || item.dataset.tech.split('|').includes(state.tech)) &&
  (!state.type || item.dataset.type.split('|').includes(state.type))

export function initFilters() {
  $$('[data-filters]').forEach(setup)
}

function setup(root) {
  const grid = $('[data-filter-grid]', root)
  const items = $$('[data-project]', grid)
  const catButtons = $$('[data-filter-cat]', root)
  const typeButtons = $$('[data-filter-type]', root)
  const selects = $$('[data-filter-select]', root)
  const resets = $$('[data-filter-reset]', root)
  const countEl = $('[data-filter-count]', root)
  const nounEl = $('[data-filter-noun]', root)
  const summaryEl = $('[data-filter-summary]', root)
  const emptyEl = $('[data-filter-empty]', root)
  const badge = $('[data-filter-badge]', root)
  const advancedBtn = $('[data-filter-advanced]', root)
  const advanced = advancedBtn && document.getElementById(advancedBtn.getAttribute('aria-controls'))
  const viewButtons = $$('[data-view]', root).filter((b) => b.tagName === 'BUTTON')

  const state = { cat: '', year: '', sector: '', tech: '', type: '' }

  // stato iniziale dall'URL
  const query = new URLSearchParams(location.search)
  for (const [key, param] of Object.entries(PARAMS)) {
    const value = query.get(param)
    if (!value) continue
    const valid =
      key === 'cat' ? catButtons.some((b) => b.dataset.filterCat === value) : key === 'type' && typeButtons.length ? typeButtons.some((b) => b.dataset.filterType === value) : selects.some((s) => s.dataset.filterSelect === key && [...s.options].some((o) => o.value === value))
    if (valid) state[key] = value
  }

  const syncControls = () => {
    catButtons.forEach((b) => {
      const on = b.dataset.filterCat === state.cat
      b.classList.toggle('is-active', on)
      b.setAttribute('aria-pressed', String(on))
    })
    typeButtons.forEach((b) => {
      const on = b.dataset.filterType === state.type
      b.classList.toggle('is-active', on)
      b.setAttribute('aria-pressed', String(on))
    })
    let extra = 0
    selects.forEach((s) => {
      s.value = state[s.dataset.filterSelect]
      s.closest('.fselect')?.classList.toggle('is-set', Boolean(s.value))
      if (s.value) extra++
    })
    if (badge) {
      badge.hidden = extra === 0
      badge.textContent = String(extra)
    }
    if (advanced && extra && advanced.hidden) toggleAdvanced(true)
  }

  const syncUrl = () => {
    const url = new URL(location.href)
    for (const [key, param] of Object.entries(PARAMS)) state[key] ? url.searchParams.set(param, state[key]) : url.searchParams.delete(param)
    history.replaceState(null, '', url)
  }

  // ritmo della griglia e alternanza delle schede ricalcolati sui soli elementi visibili
  const reflow = () => {
    let i = 0
    items.forEach((item) => {
      if (item.hidden) return
      if (item.hasAttribute('data-span')) item.dataset.span = String(SPAN_PATTERN[i % SPAN_PATTERN.length])
      if (item.classList.contains('tsheet')) item.toggleAttribute('data-flip', i % 2 === 1)
      i++
    })
  }

  const report = (visible, silent) => {
    const active = Object.values(state).filter(Boolean)
    if (countEl) countEl.textContent = String(visible).padStart(2, '0')
    if (nounEl) nounEl.textContent = visible === 1 ? 'progetto' : 'progetti'
    if (summaryEl) summaryEl.textContent = active.length ? ` · ${active.map((v) => catButtons.find((b) => b.dataset.filterCat === v)?.firstChild.textContent.trim() || v).join(' · ')}` : ''
    resets.forEach((r) => !r.closest('[data-filter-empty]') && (r.hidden = active.length === 0))
    if (emptyEl) emptyEl.hidden = visible !== 0
    grid.hidden = visible === 0
    if (!silent) announce(visible === 0 ? 'Nessun progetto trovato' : `${visible} ${visible === 1 ? 'progetto trovato' : 'progetti trovati'}`)
  }

  const apply = ({ animate = true, silent = false } = {}) => {
    const instant = !animate || reducedMotion()
    const show = []
    const hide = []
    items.forEach((item) => (matches(item, state) ? item.hidden && show.push(item) : !item.hidden && hide.push(item)))
    const visible = items.filter((item) => matches(item, state)).length

    const finish = () => {
      hide.forEach((item) => {
        item.hidden = true
        item.classList.remove('is-leaving')
      })
      show.forEach((item) => {
        item.hidden = false
        if (!instant) item.classList.add('is-entering')
      })
      reflow()
      report(visible, silent)
      if (!instant) requestAnimationFrame(() => requestAnimationFrame(() => show.forEach((item) => item.classList.remove('is-entering'))))
    }

    if (instant || !hide.length) return finish()
    hide.forEach((item) => item.classList.add('is-leaving'))
    setTimeout(finish, 260)
  }

  const set = (key, value) => {
    state[key] = state[key] === value && key !== 'cat' ? '' : value
    syncControls()
    syncUrl()
    apply()
  }

  function toggleAdvanced(open) {
    advanced.hidden = !open
    advancedBtn.setAttribute('aria-expanded', String(open))
  }

  catButtons.forEach((b) => b.addEventListener('click', () => set('cat', b.dataset.filterCat)))
  typeButtons.forEach((b) => b.addEventListener('click', () => set('type', b.dataset.filterType)))
  selects.forEach((s) =>
    s.addEventListener('change', () => {
      state[s.dataset.filterSelect] = s.value
      syncControls()
      syncUrl()
      apply()
    }),
  )
  resets.forEach((r) =>
    r.addEventListener('click', () => {
      Object.keys(state).forEach((k) => (state[k] = ''))
      syncControls()
      syncUrl()
      apply()
      catButtons[0]?.focus()
    }),
  )
  advancedBtn?.addEventListener('click', () => toggleAdvanced(advanced.hidden))

  // griglia / elenco, con preferenza ricordata
  const setView = (view, store = true) => {
    grid.dataset.view = view
    viewButtons.forEach((b) => {
      const on = b.dataset.view === view
      b.classList.toggle('is-active', on)
      b.setAttribute('aria-pressed', String(on))
    })
    if (store) {
      try {
        localStorage.setItem('ap:view', view)
      } catch {}
    }
  }
  if (viewButtons.length) {
    viewButtons.forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)))
    try {
      const saved = localStorage.getItem('ap:view')
      if (saved === 'list' || saved === 'grid') setView(saved, false)
    } catch {}
  }

  syncControls()
  apply({ animate: false, silent: true })
}
