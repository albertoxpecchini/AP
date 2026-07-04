# 02 · Tipografia

Tre caratteri, ognuno con un ruolo. Regola ferma del progetto: **per l'interfaccia
si usa SOLO Titillium Web** (il font ufficiale del Design System Italia). Niente
Segoe UI o font di sistema generici.

| Ruolo            | Font           | Token         | Pesi usati       |
|------------------|----------------|---------------|------------------|
| Interfaccia/testo| **Titillium Web** | `--font-ui`    | 400, 600, 700 |
| Titoli editoriali| **Lora** (serif)  | `--font-serif` | 400, 600      |
| Numeri/codice    | **Roboto Mono**   | `--font-mono`  | 400, 500      |

I token sono in [`styles/design-tokens.css`](../styles/design-tokens.css):

```css
--font-ui:    "Titillium Web", Geneva, Tahoma, sans-serif;
--font-serif: "Lora", Georgia, serif;
--font-mono:  "Roboto Mono", ui-monospace, monospace;
```

## Come caricarli

I caratteri si caricano nell'`<head>` di `index.html` (non via CSS `@import`, per
il primo paint). Copia queste righe:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=Titillium+Web:wght@400;600;700&family=Lora:wght@400;600&family=Roboto+Mono:wght@400;500&display=swap"
  rel="stylesheet" />
```

Poi imposta il font di base nel CSS globale:

```css
body { font-family: var(--font-ui); }
```

## Note

- **Peso "medium" = 600** in questo progetto (`--font-weight-medium: 600`),
  non 500: Titillium a 600 è il "grassetto leggero" dei titoli di sezione.
- Dimensione base `--font-size: 16px`.
- Per il **self-hosting** (senza chiamate a Google Fonts, es. per privacy/GDPR o
  performance), scarica i `.woff2` e sostituisci il `<link>` con `@font-face`.
  Nel sito originale i PDF usano Titillium **embedded** proprio per questo.
