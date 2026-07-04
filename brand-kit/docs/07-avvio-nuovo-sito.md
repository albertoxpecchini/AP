# 07 · ★ Avvio del nuovo sito — ricetta passo-passo

Dal foglio bianco a un sito con **colori, tema automatico, multilingua e componenti**
del brand. Circa 15 minuti.

---

## 1. Crea il progetto

```bash
npm create vite@latest sito-azienda -- --template react-ts
cd sito-azienda
```

## 2. Installa le dipendenze

**Base (indispensabili):**
```bash
npm i react-router clsx tailwind-merge class-variance-authority lucide-react
npm i -D tailwindcss @tailwindcss/vite @types/node
```

**Componenti Radix** (tutti quelli usati da `components/ui`):
```bash
npm i @radix-ui/react-accordion @radix-ui/react-alert-dialog \
  @radix-ui/react-aspect-ratio @radix-ui/react-avatar @radix-ui/react-checkbox \
  @radix-ui/react-collapsible @radix-ui/react-context-menu @radix-ui/react-dialog \
  @radix-ui/react-dropdown-menu @radix-ui/react-hover-card @radix-ui/react-label \
  @radix-ui/react-menubar @radix-ui/react-navigation-menu @radix-ui/react-popover \
  @radix-ui/react-progress @radix-ui/react-radio-group @radix-ui/react-scroll-area \
  @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-slider \
  @radix-ui/react-slot @radix-ui/react-switch @radix-ui/react-tabs \
  @radix-ui/react-toggle @radix-ui/react-toggle-group @radix-ui/react-tooltip
```

**Extra opzionali** (solo se ti servono): `motion` (animazioni),
`canvas-confetti`, `recharts` (grafici), `sonner` (toast), `vaul`/`react-day-picker`
(drawer/calendar), `mermaid` (diagrammi), `vite-plugin-pwa` (offline).

## 3. Copia le cartelle del kit

Nel nuovo progetto, dentro `src/`:

```
src/
├─ styles/        ← copia da brand-kit/styles/
├─ theme/         ← copia da brand-kit/core/theme/
├─ i18n/          ← copia da brand-kit/core/i18n/
├─ game/          ← copia da brand-kit/core/game/   (solo se usi i giochi)
└─ components/ui/ ← copia da brand-kit/components/ui/
```

Poi **rinomina** `i18n/dictionary.template.ts` → `i18n/dictionary.ts`.

## 4. Configura Vite

Copia [`config/vite.config.ts`](../config/vite.config.ts) e
[`config/postcss.config.mjs`](../config/postcss.config.mjs). L'essenziale del
`vite.config.ts` è il plugin Tailwind v4 e l'alias `@`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
});
```

## 5. Il CSS globale

Crea `src/styles/index.css` con questi import (l'ordine conta):

```css
@import "tailwindcss";
@import "./design-tokens.css";   /* i colori del brand — per primo */
@import "./theme.css";           /* variabili shadcn light + .dark */
@import "./ios.css";             /* fix Safari iOS */
@import "./theme-auto.css";      /* barra tema/lingua + tema chiaro pagine */

/* Anti-overflow globale */
html, body { overflow-x: hidden; }
img, svg, video, canvas { max-width: 100%; }
body { font-family: var(--font-ui); background: var(--paper); color: var(--ink); }
```

> Nota: qui usiamo `@import "tailwindcss";` (Tailwind v4). Nel progetto originale
> `tailwind.css` conteneva proprio questa riga.

## 6. L'`index.html`

Nell'`<head>` metti: i caratteri (vedi [02-tipografia.md](02-tipografia.md)) e lo
**script anti-flash del tema** (vedi [03-tema-chiaro-scuro.md](03-tema-chiaro-scuro.md)).
Sono i due blocchi da non dimenticare.

## 7. Collega i sistemi globali nel `main.tsx`

```tsx
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App";

import { syncTheme } from "./theme/themeCore";
import ThemeWidget from "./theme/ThemeWidget";
import { initLangAttr } from "./i18n/langCore";
import { startI18nEngine } from "./i18n/translateDom";
import LanguageSwitcher from "./i18n/LanguageSwitcher";
import "./styles/index.css";

syncTheme();        // tema (auto orario o manuale) prima del render
initLangAttr();     // <html lang> corretto
startI18nEngine();  // motore multilingua

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
    {/* widget globali, montati una volta sola */}
    <ThemeWidget />
    <LanguageSwitcher />
  </BrowserRouter>
);
```

## 8. Fatto

- I colori arrivano dai token → cambiali in `design-tokens.css`.
- Il tema chiaro/scuro va da solo (o col tasto).
- Per tradurre: riempi `i18n/dictionary.ts`.
- Costruisci le pagine con i componenti di `components/ui`.

---

## Checklist finale

- [ ] Font caricati nell'`<head>`
- [ ] Script anti-flash del tema nell'`<head>`
- [ ] `index.css` importa i CSS nell'ordine giusto
- [ ] `main.tsx` chiama `syncTheme()`, `initLangAttr()`, `startI18nEngine()`
- [ ] `ThemeWidget` e `LanguageSwitcher` montati una volta
- [ ] `dictionary.template.ts` rinominato in `dictionary.ts`
- [ ] Token di brand aggiornati con i colori aziendali

---

## Deploy (come il sito originale)

Il sito attuale è su **Vercel**, build da `main`. Basta collegare il repo a Vercel
e impostare build `vite build`, output `dist`. Un `vercel.json` di riferimento c'è
nel progetto originale (header cache immutable per gli asset).
