// ─────────────────────────────────────────────────────────────────────────────
// DIZIONARIO — l'unico file da editare per tradurre il sito.
//
// Come funziona il multilingua (vedi translateDom.ts):
//  · Il sito si scrive in UNA lingua "sorgente" (nel progetto originale: home in
//    inglese, il resto in italiano). NON si duplicano le pagine.
//  · Il motore legge il testo già a schermo, ne calcola una "chiave" normalizzata
//    e, se la trova qui, sostituisce la traduzione nella lingua scelta.
//  · Chiave = testo sorgente normalizzato (spazi compattati, senza spazi ai bordi).
//    La lingua sorgente di ogni voce NON serve ripeterla: se manca una lingua,
//    resta il testo sorgente.
//
// Per aggiungere una traduzione: prendi la frase ESATTA che appare nel sito,
// mettila come chiave e riempi le 4 lingue.
// ─────────────────────────────────────────────────────────────────────────────

import type { Lang } from "./langCore";

export type Entry = Partial<Record<Lang, string>>;

/** Normalizza una stringa a "chiave": comprime gli spazi e toglie quelli ai bordi. */
export function normalizeKey(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

// Le chiavi sono già normalizzate. Esempi (sostituisci con i testi del tuo sito):
export const DICT: Record<string, Entry> = {
  "Chi siamo": {
    it: "Chi siamo",
    en: "About us",
    fr: "À propos",
    de: "Über uns",
  },
  "Contattaci": {
    it: "Contattaci",
    en: "Contact us",
    fr: "Contactez-nous",
    de: "Kontakt",
  },
  "I nostri servizi": {
    it: "I nostri servizi",
    en: "Our services",
    fr: "Nos services",
    de: "Unsere Leistungen",
  },
  // … aggiungi qui tutte le frasi del sito.
};
