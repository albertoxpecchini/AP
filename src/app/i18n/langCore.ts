// ─────────────────────────────────────────────────────────────────────────────
// Lingua globale del sito — UNA sola fonte di verità, condivisa da TUTTE le
// pagine (come themeCore per il tema). Quattro lingue: italiano, inglese,
// francese, tedesco.
//
// Il sito è scritto in lingue "sorgente" diverse a seconda della pagina (la home
// è in inglese, i giochi e gli approfondimenti in italiano). Per questo NON si
// traduce pagina per pagina: un motore (translateDom.ts) traduce il DOM "al
// volo" usando il dizionario (dictionary.ts), partendo dal testo così com'è
// scritto nel sorgente e portandolo nella lingua scelta. Cambiare lingua NON
// ricarica la pagina.
//
// Qui vive solo lo "stato": qual è la lingua attiva, come si legge/scrive, e come
// ci si iscrive ai cambi. Il widget (LanguageSwitcher) e il motore leggono da qui.
// ─────────────────────────────────────────────────────────────────────────────

import { getPref, setPref } from "../utils/prefs";

export type Lang = "it" | "en" | "fr" | "de";

export interface LangMeta {
  code: Lang;
  /** Sigla breve mostrata nel widget (IT/EN/FR/DE). */
  label: string;
  /** Nome nella propria lingua (Italiano, English, …). */
  name: string;
  /** Bandierina. */
  flag: string;
}

// Ordine di comparsa nello switcher.
export const LANGS: LangMeta[] = [
  { code: "it", label: "IT", name: "Italiano", flag: "🇮🇹" },
  { code: "en", label: "EN", name: "English", flag: "🇬🇧" },
  { code: "fr", label: "FR", name: "Français", flag: "🇫🇷" },
  { code: "de", label: "DE", name: "Deutsch", flag: "🇩🇪" },
];

const ALL: Lang[] = ["it", "en", "fr", "de"];
export const LANG_EVENT = "ap-langchange";
const KEY = "ap-lang";

function isLang(v: unknown): v is Lang {
  return typeof v === "string" && (ALL as string[]).includes(v);
}

export function langMeta(code: Lang): LangMeta {
  return LANGS.find((l) => l.code === code) ?? LANGS[0];
}

// Lingua iniziale: scelta memorizzata → lingua del browser → italiano.
function detect(): Lang {
  const stored = getPref(KEY);
  if (isLang(stored)) return stored;
  try {
    const nav = (navigator.language || "").slice(0, 2).toLowerCase();
    if (isLang(nav)) return nav;
  } catch {
    /* niente navigator */
  }
  return "it";
}

let current: Lang = detect();

/** Lingua attiva adesso. */
export function getLang(): Lang {
  return current;
}

/** Scrive `lang` su <html lang>, senza eventi (usata al boot, prima del render). */
export function initLangAttr(): void {
  try {
    document.documentElement.lang = current;
  } catch {
    /* ignora */
  }
}

/**
 * Cambia la lingua attiva: memorizza la scelta, aggiorna <html lang> e avvisa
 * chi è iscritto (il motore ritraduce, il widget si aggiorna). Se la lingua è
 * già quella attiva non fa nulla.
 */
export function setLang(lang: Lang): void {
  if (!isLang(lang) || lang === current) return;
  current = lang;
  setPref(KEY, lang);
  try {
    document.documentElement.lang = lang;
  } catch {
    /* ignora */
  }
  try {
    window.dispatchEvent(new CustomEvent(LANG_EVENT, { detail: { lang } }));
  } catch {
    /* ambienti senza CustomEvent */
  }
}

/** Si iscrive ai cambi di lingua. Ritorna la funzione di disiscrizione. */
export function subscribeLang(cb: (lang: Lang) => void): () => void {
  const handler = (e: Event) => cb((e as CustomEvent).detail.lang as Lang);
  window.addEventListener(LANG_EVENT, handler);
  return () => window.removeEventListener(LANG_EVENT, handler);
}
