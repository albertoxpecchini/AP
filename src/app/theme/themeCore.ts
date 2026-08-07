// ─────────────────────────────────────────────────────────────────────────────
// Tema globale (chiaro / scuro) condiviso da TUTTE le pagine.
//
// Una sola fonte di verità:
//  · mode "auto"  → il tema segue il "sensore" orario: 08:00–19:59 chiaro, il
//                   resto scuro. Allo scoccare di 08:00 e 20:00 il tema cambia da
//                   solo (la transizione animata parte 1s prima, alle :59:59).
//  · mode "manual"→ vince la scelta del tasto, fino al successivo confine orario,
//                   quando il sensore riprende il comando ("sempre e ovunque").
//
// applyTheme() riflette il tema su <html> (classe .dark + data-ap-theme) e tiene
// allineati i meccanismi già esistenti dei giochi (`games-dark`) e di /me-stesso
// (`ms-theme`), così il tema è davvero unico ovunque.
// ─────────────────────────────────────────────────────────────────────────────

import { getPref, setPref } from "../utils/prefs";

export type Theme = "light" | "dark";
export type Mode = "auto" | "manual";

export const THEME_EVENT = "ap-themechange";
export const THEME_REQUEST_EVENT = "ap-theme-request";

const MODE_KEY = "ap-theme-mode";
const MANUAL_KEY = "ap-theme-manual";

// Colore di fondo per ogni tema: overlay di transizione, sfondo del primo paint
// (--ap-boot-bg) e <meta theme-color> della barra del browser.
// Sono ESATTAMENTE i --sb-bg di src/app/home.css: prima erano due colori a sé
// (#faf8f6 / #1b151a) e sul chiaro la barra del browser era addirittura arancio
// #e95420 — su una pagina bianca si vedeva. Se cambia --sb-bg, cambia qui.
export const THEME_BG: Record<Theme, string> = {
  light: "#fcfcfc",
  dark: "#141414",
};

// Ore "chiare": dalle 08:00:00 alle 19:59:59. Tutto il resto è scuro.
export const LIGHT_START_HOUR = 8;
export const LIGHT_END_HOUR = 20;

/** Tema previsto dal sensore orario per un dato istante. */
export function timeTheme(d: Date = new Date()): Theme {
  const h = d.getHours();
  return h >= LIGHT_START_HOUR && h < LIGHT_END_HOUR ? "light" : "dark";
}

export function getMode(): Mode {
  return getPref(MODE_KEY) === "manual" ? "manual" : "auto";
}

export function getManual(): Theme {
  return getPref(MANUAL_KEY) === "dark" ? "dark" : "light";
}

/** Tema che dovrebbe essere attivo ADESSO, dati mode + orologio. */
export function resolveTheme(): Theme {
  return getMode() === "manual" ? getManual() : timeTheme();
}

let current: Theme | null = null;

/** Ultimo tema applicato (fallback al calcolo se non ancora applicato). */
export function currentTheme(): Theme {
  return current ?? resolveTheme();
}

/** Scrive il tema su <html> e allinea tutti i sotto-sistemi. NESSUNA animazione. */
export function applyTheme(theme: Theme): void {
  current = theme;
  const html = document.documentElement;
  html.classList.toggle("dark", theme === "dark");
  html.dataset.apTheme = theme;
  html.style.setProperty("--ap-boot-bg", THEME_BG[theme]);
  if (document.body) document.body.style.background = THEME_BG[theme];

  // Compatibilità con i meccanismi tema già presenti nel progetto.
  try {
    localStorage.setItem("games-dark", theme === "dark" ? "1" : "0");
    localStorage.setItem("ms-theme", theme);
  } catch {
    /* storage non disponibile: pazienza */
  }

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEME_BG[theme]);

  try {
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { theme } }));
  } catch {
    /* ambienti senza CustomEvent */
  }
}

/** Applica il tema previsto adesso (mode + orologio). Restituisce il tema. */
export function syncTheme(): Theme {
  const t = resolveTheme();
  applyTheme(t);
  return t;
}

/** Passa a "manuale" memorizzando la scelta dell'utente (condivisa tra sottodomini). */
export function setManualTheme(theme: Theme): void {
  setPref(MODE_KEY, "manual");
  setPref(MANUAL_KEY, theme);
}

/** Restituisce il comando al sensore orario. */
export function setAutoMode(): void {
  setPref(MODE_KEY, "auto");
}

/** Si iscrive ai cambi di tema. Ritorna la funzione di disiscrizione. */
export function subscribeTheme(cb: (theme: Theme) => void): () => void {
  const handler = (e: Event) => cb((e as CustomEvent).detail.theme as Theme);
  window.addEventListener(THEME_EVENT, handler);
  return () => window.removeEventListener(THEME_EVENT, handler);
}

/**
 * Chiede un cambio tema ANIMATO (gestito dal ThemeWidget globale). Usato dai
 * tasti tema interni alle pagine (giochi, /me-stesso) così che usino la stessa
 * transizione e aggiornino il sistema globale. `manual` registra la scelta.
 */
export function requestTheme(theme: Theme, manual = true): void {
  if (manual) setManualTheme(theme);
  try {
    window.dispatchEvent(new CustomEvent(THEME_REQUEST_EVENT, { detail: { theme } }));
  } catch {
    applyTheme(theme);
  }
}

/** Inverte il tema corrente, con transizione animata. */
export function requestToggle(): void {
  requestTheme(currentTheme() === "dark" ? "light" : "dark", true);
}

/**
 * Istante (ms epoch) del prossimo confine orario (08:00 o 20:00) a partire da
 * `from`, con il tema che dovrà valere da quel confine in poi.
 */
export function nextBoundary(from: Date = new Date()): { at: number; theme: Theme } {
  const candidates = [LIGHT_START_HOUR, LIGHT_END_HOUR];
  for (let dayOffset = 0; dayOffset <= 1; dayOffset++) {
    for (const hour of candidates) {
      const b = new Date(from);
      b.setDate(from.getDate() + dayOffset);
      b.setHours(hour, 0, 0, 0);
      if (b.getTime() > from.getTime()) {
        return { at: b.getTime(), theme: timeTheme(b) };
      }
    }
  }
  // Non dovrebbe mai accadere.
  const fallback = new Date(from);
  fallback.setHours(fallback.getHours() + 1, 0, 0, 0);
  return { at: fallback.getTime(), theme: timeTheme(fallback) };
}
