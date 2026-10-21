"""Impagina gli appunti di una lezione: Markdown con formule $…$ → HTML → PDF A4 stampato da Edge.

    python impagina.py <appunti.md> [--senza-pdf]

HTML e PDF escono accanto al .md con lo stesso nome. Le formule le compone KaTeX dentro
la pagina (stile/katex, MIT); i caratteri sono quelli di albertopecchini.it (Archivo,
Instrument Serif, IBM Plex Mono, in stile/), il minio #e5481f solo come accento.
Nel testo: `⏱ 05:04` diventa l'etichetta del minuto, ![didascalia](figura.png) una figura
con la didascalia sotto, <div style="break-before: page"></div> un salto pagina.
"""
import argparse
import html
import re
import subprocess
import sys
from pathlib import Path

from markdown_it import MarkdownIt
from mdit_py_plugins.dollarmath import dollarmath_plugin

STILE = Path(__file__).resolve().with_name('stile')
EDGE = [Path(r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'),
        Path(r'C:\Program Files\Microsoft\Edge\Application\msedge.exe')]


def tex(contenuto, config):
    """La formula resta testo (protetta dal Markdown); KaTeX la compone nella pagina."""
    tag = 'div' if config.get('display_mode') else 'span'
    return f'<{tag} class="tex{" blocco" if tag == "div" else ""}">{html.escape(contenuto)}</{tag}>'


def corpo(testo):
    md = MarkdownIt('commonmark', {'html': True, 'typographer': True}).enable(['table', 'replacements', 'smartquotes'])
    md.use(dollarmath_plugin, allow_space=True, allow_digits=True, double_inline=True, renderer=tex)
    h = md.render(testo)
    h = re.sub(r'<code>⏱\s*([^<]*)</code>', r'<span class="tempo">⏱ \1</span>', h)
    return re.sub(r'<p><img src="([^"]+)" alt="([^"]*)" ?/?></p>',
                  r'<figure><img src="\1" alt="\2"><figcaption>\2</figcaption></figure>', h)


def css():
    u = lambda nome: (STILE / nome).as_uri()  # noqa: E731
    return f"""
@font-face {{ font-family: Archivo; src: url({u('archivo.woff2')}) format('woff2'); font-weight: 100 900; }}
@font-face {{ font-family: 'Instrument Serif'; src: url({u('instrument-serif.woff2')}) format('woff2'); }}
@font-face {{ font-family: 'Instrument Serif'; font-style: italic; src: url({u('instrument-serif-italic.woff2')}) format('woff2'); }}
@font-face {{ font-family: 'Plex Mono'; src: url({u('plex-mono.woff2')}) format('woff2'); }}
:root {{ --inchiostro: #1d1b19; --grigio: #6b665f; --riga: #e4ded6; --carta: #fffdfa; --minio: #e5481f; --fondo-nota: #f6f2ec; }}
@page {{ size: A4; margin: 16mm 16mm 18mm; @bottom-center {{ content: counter(page); font: 9pt 'Plex Mono', monospace; color: #8a847c; }} }}
* {{ box-sizing: border-box; }}
html {{ background: var(--carta); }}
body {{ margin: 0 auto; max-width: 178mm; padding: 14mm 6mm 30mm; font: 10.4pt/1.55 Archivo, 'Segoe UI', sans-serif; color: var(--inchiostro); background: var(--carta); }}
h1 {{ font: 400 30pt/1.05 'Instrument Serif', Georgia, serif; margin: 0 0 4mm; letter-spacing: -0.01em; }}
h2 {{ font: 400 19pt/1.15 'Instrument Serif', Georgia, serif; margin: 9mm 0 3mm; padding-top: 2mm; border-top: 1.5px solid var(--inchiostro); break-after: avoid; }}
h3 {{ font-weight: 650; font-size: 11.5pt; margin: 6mm 0 2mm; break-after: avoid; }}
h2 + p, h3 + p {{ margin-top: 0; }}
p {{ margin: 0 0 2.6mm; }}
strong {{ font-weight: 650; }}
a {{ color: inherit; text-decoration-color: var(--minio); }}
hr {{ border: 0; border-top: 1px solid var(--riga); margin: 6mm 0; }}
.tempo {{ font: 7.6pt 'Plex Mono', monospace; color: var(--grigio); background: var(--fondo-nota); border-radius: 3px; padding: 0.4mm 1.4mm; white-space: nowrap; vertical-align: 0.15em; }}
h2 .tempo, h3 .tempo {{ margin-left: 1.5mm; }}
code {{ font: 8.6pt 'Plex Mono', monospace; background: var(--fondo-nota); padding: 0.2mm 1mm; border-radius: 2px; }}
blockquote {{ margin: 3mm 0; padding: 2.4mm 4mm; background: var(--fondo-nota); border-left: 3px solid var(--minio); break-inside: avoid; }}
blockquote p:last-child {{ margin-bottom: 0; }}
table {{ border-collapse: collapse; width: 100%; margin: 2mm 0 4mm; font-size: 9.6pt; break-inside: avoid; }}
th, td {{ border-bottom: 1px solid var(--riga); padding: 1.6mm 2mm; text-align: left; vertical-align: middle; }}
th {{ font-weight: 650; border-bottom: 1.5px solid var(--inchiostro); }}
ul, ol {{ margin: 0 0 3mm; padding-left: 6mm; }}
li {{ margin-bottom: 1mm; }}
figure {{ margin: 3mm auto 5mm; text-align: center; break-inside: avoid; }}
figure img {{ max-width: 82%; max-height: 92mm; }}
figcaption {{ font-size: 8.4pt; color: var(--grigio); margin-top: 1mm; }}
img {{ max-width: 100%; }}
.katex {{ font-size: 1.06em; }}
.tex.blocco {{ margin: 2.4mm 0; overflow-x: auto; overflow-y: hidden; padding: 0.6mm 0; break-inside: avoid; }}
.testata {{ display: flex; justify-content: space-between; font: 8pt 'Plex Mono', monospace; color: var(--grigio); border-bottom: 1px solid var(--riga); padding-bottom: 2mm; margin-bottom: 7mm; }}
.testata b {{ color: var(--minio); font-weight: 400; }}
@media print {{ html, body {{ background: #fff; }} body {{ padding: 0 0 20mm; }} }}
"""


def pagina(testo, titolo, etichetta):
    k = STILE / 'katex'
    return f"""<!doctype html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(titolo)}</title>
<link rel="stylesheet" href="{(k / 'katex.min.css').as_uri()}">
<style>{css()}</style></head>
<body><div class="testata"><span><b>●</b> appunti di lezione</span><span>{html.escape(etichetta)}</span></div>
{corpo(testo)}
<script src="{(k / 'katex.min.js').as_uri()}"></script>
<script>
for (const el of document.querySelectorAll('.tex'))
  katex.render(el.textContent, el, {{ displayMode: el.classList.contains('blocco'), throwOnError: false, strict: 'ignore' }})
</script>
</body></html>"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('appunti')
    ap.add_argument('--senza-pdf', action='store_true')
    a = ap.parse_args()
    md = Path(a.appunti).resolve()
    testo = md.read_text(encoding='utf-8')
    titolo = (re.search(r'^#\s+(.+)$', testo, re.M) or [None, md.stem])[1]
    cart = md.parent.parent if md.parent.name == 'appunti' else md.parent  # la cartella della lezione
    uscita = md.with_suffix('.html')
    uscita.write_text(pagina(testo, re.sub(r'[$*_`]', '', titolo), cart.name), encoding='utf-8')
    print('html', uscita)
    if a.senza_pdf:
        return
    edge = next((e for e in EDGE if e.exists()), None)
    if not edge:
        sys.exit('Edge non trovato: c\'è solo l\'HTML (si può stampare in PDF da qualunque browser)')
    pdf = md.with_suffix('.pdf')
    subprocess.run([str(edge), '--headless', '--disable-gpu', '--no-pdf-header-footer', '--allow-file-access-from-files',
                    '--virtual-time-budget=10000', f'--print-to-pdf={pdf}', uscita.as_uri()],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=180)
    print('pdf ', pdf)


if __name__ == '__main__':
    main()
