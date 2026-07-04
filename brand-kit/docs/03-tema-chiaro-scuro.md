# 03 · Tema chiaro / scuro

Un tema **unico** per tutto il sito, con una particolarità: di default è
**automatico** e segue un **sensore orario** — chiaro di giorno, scuro di notte —
ma l'utente può forzarlo a mano.

File:
- [`core/theme/themeCore.ts`](../core/theme/themeCore.ts) — la logica (nessuna dipendenza)
- [`core/theme/ThemeWidget.tsx`](../core/theme/ThemeWidget.tsx) — il tasto luna/sole + transizione
- [`styles/theme-auto.css`](../styles/theme-auto.css) — stile del widget/barra + tema chiaro delle pagine
- [`styles/theme.css`](../styles/theme.css) — variabili shadcn per `:root` e `.dark`

## Come funziona

- **Modalità `auto`** → segue l'orologio: **08:00–19:59 chiaro**, il resto **scuro**.
  Allo scoccare dei confini (08:00 / 20:00) il tema cambia da solo, con transizione.
- **Modalità `manual`** → vince la scelta del tasto, fino al confine orario
  successivo, quando il sensore riprende il comando ("sempre e ovunque").

Lo stato applicato a `<html>`:
- classe `.dark` (per Tailwind / shadcn)
- attributo `data-ap-theme="light|dark"` (per il ribaltamento delle pagine dark-premium)
- variabile `--ap-boot-bg` (colore di fondo per evitare il flash al primo paint)

Persistenza in `localStorage`: `ap-theme-mode` (`auto`/`manual`) e `ap-theme-manual`.

## Anti-flash (importante)

Per evitare il lampo bianco/nero prima che React monti, il tema si calcola con uno
**script inline nell'`<head>`**, PRIMA del primo paint. Copialo in `index.html`:

```html
<script>
  (function () {
    try {
      var mode = localStorage.getItem("ap-theme-mode");
      var theme;
      if (mode === "manual") {
        theme = localStorage.getItem("ap-theme-manual") === "dark" ? "dark" : "light";
      } else {
        var h = new Date().getHours();
        theme = h >= 8 && h < 20 ? "light" : "dark";
      }
      var de = document.documentElement;
      de.classList.toggle("dark", theme === "dark");
      de.setAttribute("data-ap-theme", theme);
      de.style.setProperty("--ap-boot-bg", theme === "dark" ? "#090c10" : "#f7f5fd");
    } catch (e) {}
  })();
</script>
<style>html, body { margin: 0; background: var(--ap-boot-bg, #F7F5F0); }</style>
```

## Come collegarlo (React)

Nel `main.tsx`, prima del render:

```ts
import { syncTheme } from "./theme/themeCore";
import ThemeWidget from "./theme/ThemeWidget";

syncTheme(); // applica il tema previsto adesso (auto o manuale)
```

E monta il widget una volta sola, a livello globale:

```tsx
<ThemeWidget />
```

## API utili di `themeCore.ts`

| Funzione                 | Cosa fa |
|--------------------------|---------|
| `syncTheme()`            | Applica il tema previsto adesso; ritorna `"light"`/`"dark"` |
| `currentTheme()`         | Tema attualmente attivo |
| `requestToggle()`        | Inverte il tema (con transizione animata) |
| `requestTheme(t, manual)`| Chiede un tema specifico |
| `setAutoMode()`          | Restituisce il comando al sensore orario |
| `subscribeTheme(cb)`     | Si iscrive ai cambi di tema (ritorna la disiscrizione) |

Vuoi orari diversi? Cambia `LIGHT_START_HOUR` / `LIGHT_END_HOUR` in `themeCore.ts`.

## Pagine "dark premium" in chiaro

Le pagine nate scure si ribaltano in chiaro semplicemente con la palette in
`theme-auto.css` sotto `html[data-ap-theme="light"] …`. Alcune bande (hero, footer)
restano scure di proposito: è già gestito nel file. Se crei nuove pagine, riusa le
stesse variabili (`--accent`, `--text`, `--surface`…) e il ribaltamento è gratis.
