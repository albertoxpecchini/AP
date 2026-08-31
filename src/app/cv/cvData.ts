// ─────────────────────────────────────────────────────────────────────────────
// I dati del curriculum — UNA sola fonte di verità per le quattro lingue.
//
// I quattro JSON in cv/data/ sono la fonte di tutto: qui vengono solo
// tipizzati e messi in una mappa per lingua. I PDF statici in public/ si
// stampano dalla pagina /cv, quindi vanno rifatti a ogni modifica di questi
// file.
//
// Attenzione: questi contenuti sono GIÀ scritti in quattro lingue, quindi la
// pagina li marca `data-no-i18n` — il motore di traduzione del DOM
// (i18n/translateDom.ts) non deve passarci sopra una seconda volta.
// ─────────────────────────────────────────────────────────────────────────────
import type { Lang } from "../i18n/langCore";
import it from "./data/cv.it.json";
import en from "./data/cv.en.json";
import fr from "./data/cv.fr.json";
import de from "./data/cv.de.json";

/** Etichette dell'interfaccia (titoli di sezione, bottoni, note). */
export interface CvUi {
  profile: string;
  skills: string;
  experience: string;
  education: string;
  travel: string;
  volunteer: string;
  langs: string;
  license: string;
  canDrive: string;
  strengths: string;
  availability: string;
  wish: string;
  runningTitle: string;
  home: string;
  print: string;
  printHint: string;
  email: string;
  updated: string;
  docTitle: string;
}

/** Una voce del curriculum (formazione, esperienza, viaggio, volontariato). */
export interface CvEntry {
  period: string;
  title: string;
  role: string;
  desc: string;
  /** Dominio del progetto, se ne ha uno pubblico ("cascinafontana.xyz"). */
  link?: string;
}

export interface CvDoc {
  ui: CvUi;
  name: string;
  role: string;
  tagline: string;
  profile: string;
  wishlist: string;
  privacy: string;
  /** Coppie [etichetta, valore]: Email, Luogo, Web. */
  contacts: [string, string][];
  /** Terne [lingua, livello, quota 0–1 della barra]. */
  languages: [string, string, number][];
  patente: string[];
  guida: string[];
  strengths: string[];
  availability: string[];
  /** Coppie [gruppo, elenco delle competenze]. */
  skills: [string, string[]][];
  education: CvEntry[];
  experience: CvEntry[];
  travel: CvEntry[];
  volunteer: CvEntry[];
}

// Il doppio cast è necessario: da JSON TypeScript deduce string[][] dove qui
// servono tuple ([etichetta, valore]), e non le considera compatibili.
export const CV_DOC: Record<Lang, CvDoc> = {
  it: it as unknown as CvDoc,
  en: en as unknown as CvDoc,
  fr: fr as unknown as CvDoc,
  de: de as unknown as CvDoc,
};

/** Data dell'ultima revisione dei contenuti (formattata nella lingua attiva). */
export const CV_UPDATED = "2026-08-01";

const DATE_LOCALE: Record<Lang, string> = {
  it: "it-IT",
  en: "en-GB",
  fr: "fr-FR",
  de: "de-DE",
};

/** "agosto 2026" / "August 2026" / "août 2026" / "August 2026". */
export function cvUpdatedLabel(lang: Lang): string {
  return new Date(CV_UPDATED).toLocaleDateString(DATE_LOCALE[lang], {
    month: "long",
    year: "numeric",
  });
}
