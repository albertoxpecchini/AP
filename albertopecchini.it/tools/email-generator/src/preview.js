// Anteprima locale con copia del contenuto renderizzato.
//
// Il JavaScript vive QUI, mai dentro email.html: l'email resta inerte.
// La copia usa l'API degli appunti con tipo text/html, così incollando nel
// composer di Gmail/Proton/Yahoo arriva il contenuto formattato e non il codice.
import { escapeHtml } from './util.js'

export function renderPreviewHtml({ emailHtml, subject, profile, to, theme, variants = [] }) {
  const c = theme.color
  // L'email va in un iframe isolato: i suoi stili non devono toccare la pagina.
  const encoded = Buffer.from(emailHtml, 'utf8').toString('base64')

  const variantButtons = variants
    .map(
      (variant) =>
        `<a class="link" href="./${escapeHtml(variant.file)}" target="_blank" rel="noopener">${escapeHtml(variant.label)}</a>`,
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Anteprima — ${escapeHtml(subject)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: ${c.paper3};
    color: ${c.ink};
    font-family: ${theme.font.sans};
    font-size: 15px;
    line-height: 1.5;
  }
  header {
    position: sticky; top: 0; z-index: 10;
    display: flex; flex-wrap: wrap; gap: 12px; align-items: center;
    padding: 14px 20px;
    background: ${c.ink}; color: ${c.paper};
    border-bottom: 1px solid ${c.ink3};
  }
  .meta { display: flex; flex-direction: column; gap: 2px; margin-right: auto; min-width: 200px; }
  .label {
    font-family: ${theme.font.mono};
    font-size: 11px; letter-spacing: .08em; text-transform: uppercase;
    color: ${c.darkMuted};
  }
  .subject { font-size: 16px; font-weight: 600; letter-spacing: -.01em; }
  button, .link {
    display: inline-flex; align-items: center; gap: 8px;
    min-height: 40px; padding: 0 16px;
    border: 1px solid ${c.paper}; border-radius: 2px;
    background: ${c.paper}; color: ${c.ink};
    font-family: ${theme.font.mono};
    font-size: 12px; font-weight: 500; letter-spacing: .07em; text-transform: uppercase;
    text-decoration: none; cursor: pointer;
    transition: background .2s, color .2s, border-color .2s;
  }
  .link { background: transparent; color: ${c.paper}; border-color: ${c.ink3}; }
  button:hover { background: ${c.accentBright}; border-color: ${c.accentBright}; }
  .link:hover { border-color: ${c.paper}; }
  button[data-state="done"] { background: #2f9e5b; border-color: #2f9e5b; color: #fff; }
  button[data-state="fail"] { background: ${c.accentDeep}; border-color: ${c.accentDeep}; color: #fff; }
  main { padding: 24px 12px 48px; }
  iframe { display: block; width: 100%; max-width: ${theme.layout.width + 40}px; margin: 0 auto; border: 0; background: transparent; }
  .hint {
    max-width: ${theme.layout.width + 40}px; margin: 0 auto 16px;
    padding: 12px 16px; background: ${c.paper}; border-left: 3px solid ${c.accent};
    font-size: 13px; color: ${c.ink2};
  }
  .hint code { font-family: ${theme.font.mono}; font-size: 12px; background: ${c.paper3}; padding: 1px 4px; }
</style>
</head>
<body>
<header>
  <div class="meta">
    <span class="label">Da ${escapeHtml(profile?.email ?? '—')} · a ${escapeHtml((to ?? []).join(', ') || '—')}</span>
    <span class="subject">${escapeHtml(subject)}</span>
  </div>
  <button id="copy" type="button">Copia email formattata</button>
  ${variantButtons}
</header>

<main>
  <div class="hint">
    Premi <strong>Copia email formattata</strong>, poi incolla nel composer con <code>Ctrl+V</code>.
    Se il pulsante non funziona (browser senza permesso sugli appunti), apri l'email in una scheda con
    il collegamento qui sopra, seleziona tutto con <code>Ctrl+A</code> e copia con <code>Ctrl+C</code>.
  </div>
  <iframe id="frame" title="Anteprima dell'email" height="900"></iframe>
</main>

<script>
  // L'HTML dell'email è trasportato in base64 per non doverlo ri-escapare.
  const source = decodeURIComponent(escape(atob("${encoded}")));

  const frame = document.getElementById('frame');
  frame.srcdoc = source;
  frame.addEventListener('load', () => {
    try {
      const doc = frame.contentDocument;
      const height = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight);
      frame.style.height = (height + 40) + 'px';
    } catch (error) {
      /* altezza di ripiego */
    }
  });

  const button = document.getElementById('copy');
  const label = button.textContent;

  function flash(state, text) {
    button.dataset.state = state;
    button.textContent = text;
    setTimeout(() => { delete button.dataset.state; button.textContent = label; }, 2600);
  }

  async function copyRendered() {
    const doc = frame.contentDocument;
    if (!doc) { flash('fail', 'Anteprima non pronta'); return; }

    // Si copia SOLO il corpo, non l'intero documento: <head> porta con sé il
    // <title>, e i composer che scartano i tag ne incollano il testo come prima
    // riga. Gli stili dell'email sono già inline sugli elementi, quindi il corpo
    // da solo si incolla formattato. Il preheader è nascosto via CSS inline, ma
    // display:none non sopravvive all'incolla: va rimosso dalla copia.
    const clone = doc.body.cloneNode(true);
    clone.querySelectorAll('[style*="display:none"], [style*="display: none"]').forEach((node) => node.remove());
    const html = clone.innerHTML;
    const text = (doc.body.innerText || '').replace(/\\n{3,}/g, '\\n\\n').trim();

    // Via preferita: appunti con tipo text/html, il composer riceve la formattazione.
    if (navigator.clipboard && window.ClipboardItem) {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([text], { type: 'text/plain' }),
          }),
        ]);
        flash('done', 'Copiata ✓');
        return;
      } catch (error) {
        /* si prova la via successiva */
      }
    }

    // Ripiego: selezione nell'iframe e execCommand.
    try {
      const selection = frame.contentWindow.getSelection();
      const range = doc.createRange();
      range.selectNodeContents(doc.body);
      selection.removeAllRanges();
      selection.addRange(range);
      const ok = doc.execCommand('copy');
      selection.removeAllRanges();
      flash(ok ? 'done' : 'fail', ok ? 'Copiata ✓' : 'Copia non riuscita');
    } catch (error) {
      flash('fail', 'Copia non riuscita');
    }
  }

  button.addEventListener('click', copyRendered);
</script>
</body>
</html>`
}
