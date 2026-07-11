// ─────────────────────────────────────────────────────────────────────────────
// Preferenze globali (tema, lingua) condivise tra i SOTTODOMINI di
// albertopecchini.it. localStorage è per-origine: ogni sottodominio
// (sostieni., trivia., …) è un'origine diversa e non vedrebbe la scelta fatta
// altrove. Per questo la salviamo anche in un cookie sul dominio padre
// ".albertopecchini.it", che è visibile a tutti i sottodomini.
//
// In dev/preview (localhost, *.vercel.app) il cookie resta host-only e si
// comporta come prima; si continua comunque a scrivere anche su localStorage.
// ─────────────────────────────────────────────────────────────────────────────
const COOKIE_DOMAIN = "albertopecchini.it";
const ONE_YEAR = 60 * 60 * 24 * 365;

// In produzione fissa il cookie sul dominio padre (condiviso tra sottodomini);
// altrove (localhost, vercel.app) lo lascia host-only.
function domainAttr(): string {
  try {
    return location.hostname.endsWith(COOKIE_DOMAIN) ? `; domain=.${COOKIE_DOMAIN}` : "";
  } catch {
    return "";
  }
}

/** Legge una preferenza: prima il cookie condiviso, poi localStorage. */
export function getPref(key: string): string | null {
  try {
    const m = document.cookie.match(new RegExp("(?:^|; )" + key + "=([^;]*)"));
    if (m) return decodeURIComponent(m[1]);
  } catch {
    /* niente cookie */
  }
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Scrive una preferenza sul cookie condiviso E su localStorage (fallback). */
export function setPref(key: string, value: string): void {
  try {
    document.cookie =
      `${key}=${encodeURIComponent(value)}; path=/; max-age=${ONE_YEAR}; SameSite=Lax` + domainAttr();
  } catch {
    /* niente cookie */
  }
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage non disponibile */
  }
}
