// Funzioni di servizio condivise.

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** `Nome Cognome <a@b.it>` → indirizzo; altrimenti il valore ripulito. */
export function addressOf(value) {
  const match = /<([^>]+)>/.exec(String(value ?? ''))
  return (match ? match[1] : String(value ?? '')).trim()
}

/** Controllo di plausibilità, non di esistenza: serve a intercettare i refusi. */
export function looksLikeEmail(value) {
  return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(addressOf(value))
}

/** Testo → identificatore utilizzabile come nome di cartella. */
export function slugify(value, fallback = 'email') {
  const slug = String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return slug || fallback
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

/** Data ISO → `18 settembre 2026`. */
const MONTHS_IT = [
  'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
  'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre',
]

export function formatDateIt(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso ?? '').trim())
  if (!match) return String(iso ?? '')
  const [, year, month, day] = match
  const name = MONTHS_IT[Number(month) - 1]
  if (!name) return iso
  return `${Number(day)} ${name} ${year}`
}

/** 34928 → «34.1 KB». */
export function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** i
  return `${i === 0 ? value : value.toFixed(1)} ${units[i]}`
}
