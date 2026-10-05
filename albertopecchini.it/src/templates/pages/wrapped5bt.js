import { html } from '../html.js'

/**
 * Tela vuota del Wrapped 5BT.
 *
 * La pagina è intenzionalmente priva di contenuti editoriali:
 * il contenitore 9:16 è il punto in cui verranno inserite le 35 slide
 * e i dati del Wrapped in una fase successiva.
 */
export function wrapped5btPage() {
  return html`
    <main class="wrapped5bt" data-wrapped>
      <div class="wrapped5bt__frame" data-wrapped-stage aria-label="Area vuota per le slide del Wrapped 5BT"></div>
    </main>
  `
}
