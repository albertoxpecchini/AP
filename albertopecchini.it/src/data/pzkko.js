// ─────────────────────────────────────────────────────────────────────────────
//  PZKKO.IT — il secondo dominio esterno, come bettercallpekko.it: progetto
//  Vercel a parte dallo stesso repository, costruito con SITE=pzk (solo le
//  pagine di pzkRoutes, alla radice del dominio). Per ora la pagina è vuota.
// ─────────────────────────────────────────────────────────────────────────────

export const PZK = typeof process !== 'undefined' && process.env?.SITE === 'pzk'

export const pzkko = {
  lang: 'it',
  // www è il principale, l'apice rimanda lì (come bettercallpekko.it).
  dominio: 'https://www.pzkko.it',
  titolo: 'pzkko',
  descrizione: 'pzkko.it',
}
