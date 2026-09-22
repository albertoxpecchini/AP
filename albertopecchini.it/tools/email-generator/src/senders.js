// Normalizzazione dell'account mittente.
// L'utente può scrivere `yahoo`, `personale`, `pzkko@yahoo.com`, `Università`…
// Qui si riconduce tutto alla chiave del profilo; se non è deducibile si
// restituisce un errore, MAI un profilo inventato o di ripiego.
import fs from 'node:fs'
import { paths } from './paths.js'

/** Minuscolo, senza accenti, senza punteggiatura: `Università` e `universita` collidono. */
export function normalizeToken(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9@._+-]+/g, ' ')
    .trim()
}

export function loadSenderProfiles() {
  const raw = JSON.parse(fs.readFileSync(paths.senderProfiles, 'utf8'))
  const profiles = raw.profiles ?? []
  if (!profiles.length) throw new Error('config/sender-profiles.json non contiene profili.')
  return { ...raw, profiles }
}

/**
 * Trova il profilo corrispondente a un valore libero.
 * @returns {{ok: true, profile: object} | {ok: false, reason: string}}
 */
export function resolveSender(value, config = loadSenderProfiles()) {
  const token = normalizeToken(value)
  if (!token) {
    return { ok: false, reason: 'Campo `from_profile` vuoto: indica yahoo, proton o gmail.' }
  }

  const candidates = config.profiles.filter((profile) => {
    const pool = [profile.key, profile.email, profile.use, profile.label, ...(profile.aliases ?? [])]
    return pool.some((entry) => normalizeToken(entry) === token)
  })

  if (candidates.length === 1) return { ok: true, profile: candidates[0] }
  if (candidates.length > 1) {
    const keys = candidates.map((c) => c.key).join(', ')
    return { ok: false, reason: `Valore «${value}» ambiguo fra i profili: ${keys}.` }
  }

  // Secondo tentativo: corrispondenza parziale su alias (es. «account proton mail»).
  const partial = config.profiles.filter((profile) => {
    const pool = [profile.key, profile.use, ...(profile.aliases ?? [])]
    return pool.some((entry) => {
      const alias = normalizeToken(entry)
      return alias.length >= 4 && token.includes(alias)
    })
  })

  if (partial.length === 1) return { ok: true, profile: partial[0] }
  if (partial.length > 1) {
    const keys = partial.map((c) => c.key).join(', ')
    return { ok: false, reason: `Valore «${value}» ambiguo fra i profili: ${keys}.` }
  }

  const known = config.profiles.map((p) => `${p.key} (${p.email})`).join(' · ')
  return { ok: false, reason: `Profilo «${value}» non riconosciuto. Profili disponibili: ${known}.` }
}
