# 04 · Multilingua (IT / EN / FR / DE)

Sistema di traduzione **universale** con una scelta insolita ma potentissima:
invece di duplicare ogni pagina per lingua, un motore **traduce il DOM al volo**.
Cambiare lingua **non ricarica** la pagina.

File:
- [`core/i18n/langCore.ts`](../core/i18n/langCore.ts) — stato della lingua attiva
- [`core/i18n/translateDom.ts`](../core/i18n/translateDom.ts) — il motore
- [`core/i18n/LanguageSwitcher.tsx`](../core/i18n/LanguageSwitcher.tsx) — il selettore
- [`core/i18n/dictionary.template.ts`](../core/i18n/dictionary.template.ts) — **l'unico file da riempire**

## L'idea

1. Scrivi il sito in **una lingua sorgente** (nel progetto: home in inglese, resto
   in italiano — ognuno nella sua lingua naturale, non importa: si mescolano).
2. Il motore osserva il DOM (con un `MutationObserver`): per ogni testo a schermo
   calcola una **chiave normalizzata** e, se la trova nel dizionario, la sostituisce
   con la traduzione nella lingua scelta.
3. Segue il router, i contenuti lazy e i ri-render di React senza andare in loop
   (tiene per ogni nodo l'originale e l'ultimo valore scritto).
4. Traduce anche gli attributi: `placeholder`, `title`, `aria-label`, `alt`.

Zone **non tradotte**: `<script> <style> <textarea> <code> <pre>`, i campi
`contentEditable`, e qualunque elemento con `data-no-i18n`.

## Per tradurre: si edita SOLO il dizionario

Rinomina `dictionary.template.ts` → `dictionary.ts` e aggiungi le frasi. La chiave
è il **testo sorgente esatto** che appare nel sito:

```ts
export const DICT: Record<string, Entry> = {
  "I nostri servizi": {
    it: "I nostri servizi",
    en: "Our services",
    fr: "Nos services",
    de: "Unsere Leistungen",
  },
};
```

Se una lingua manca, resta il testo sorgente (nessun crash).

## Come collegarlo (React)

Nel `main.tsx`:

```ts
import { initLangAttr } from "./i18n/langCore";
import { startI18nEngine } from "./i18n/translateDom";
import LanguageSwitcher from "./i18n/LanguageSwitcher";

initLangAttr();       // imposta <html lang> col valore memorizzato/rilevato
startI18nEngine();    // avvia il motore (idempotente)
```

E monta il selettore una volta, a livello globale:

```tsx
<LanguageSwitcher />
```

## Lingue e stato

- Lingue attive in `langCore.ts` → array `LANGS` (`it/en/fr/de`, con sigla, nome,
  bandierina). Aggiungerne/toglierne è un edit di quell'array.
- Lingua iniziale: scelta salvata → lingua del browser → italiano.
- Persistenza in `localStorage`: chiave `ap-lang`.
- Evento globale `ap-langchange`; iscriviti con `subscribeLang(cb)`.

## Estrarre i testi da tradurre

Il motore ha un interruttore di debug: imposta `window.__AP_NO_I18N__ = true`
prima dell'avvio per vedere il **testo sorgente grezzo** (utile per raccogliere
tutte le frasi da mettere nel dizionario).
