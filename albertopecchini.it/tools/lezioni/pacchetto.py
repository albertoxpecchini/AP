"""Fa lo zip di Lezioni da scaricare su pzkko.it e scrive versione e peso nella pagina.

    python pacchetto.py [--uscita <file.zip>]

Dentro lo zip c'è una cartella lezioni/ con tutto il tool (script, barra/, stile/, README)
e VERSIONE.txt; restano fuori __pycache__, i .pyc, i log e questo file. Di default lo zip va
in pzkko/tools/lezioni/lezioni.zip e nella pagina accanto (pzkko/tools/lezioni/index.html)
si aggiornano i pezzi fra <!--versione-->…<!--/versione--> e <!--peso-->…<!--/peso-->.
Da rilanciare dopo ogni modifica al tool, prima del commit. Va con qualunque Python 3.
Di Alberto Pecchini.
"""
import argparse
import re
import subprocess
import zipfile
from datetime import date
from pathlib import Path

QUI = Path(__file__).resolve().parent
PAGINA = QUI.parent.parent / 'pzkko' / 'tools' / 'lezioni'
FUORI = {'__pycache__', 'lavoro'}


def file_del_tool():
    for p in sorted(QUI.rglob('*')):
        rel = p.relative_to(QUI)
        if p.is_dir() or FUORI & set(rel.parts) or p.suffix in ('.pyc', '.log', '.tmp') or p.name == Path(__file__).name:
            continue
        yield p, rel


def versione():
    v = date.today().strftime('%Y.%m.%d')
    try:
        h = subprocess.run(['git', 'log', '-1', '--format=%h', '--', '.'], cwd=QUI, capture_output=True, text=True).stdout.strip()
        if h:
            v += f' ({h})'
    except OSError:
        pass
    return v


def peso(n):
    return f'{n / 1024:.0f} KB' if n < 1024 * 1024 else f'{n / 1024 / 1024:.1f} MB'.replace('.', ',')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--uscita', type=Path, default=PAGINA / 'lezioni.zip')
    a = ap.parse_args()
    v = versione()
    a.uscita.parent.mkdir(parents=True, exist_ok=True)
    n = 0
    with zipfile.ZipFile(a.uscita, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for p, rel in file_del_tool():
            z.write(p, 'lezioni/' + rel.as_posix())
            n += 1
        z.writestr('lezioni/VERSIONE.txt', f'Lezioni {v}\nDi Alberto Pecchini - https://www.pzkko.it/tools/lezioni/\n')
    kb = a.uscita.stat().st_size
    print(f'{a.uscita} · {n + 1} file · {peso(kb)} · versione {v}')

    pagina = PAGINA / 'index.html'
    if pagina.exists() and a.uscita.parent == PAGINA:
        t = pagina.read_text(encoding='utf-8')
        t = re.sub(r'(<!--versione-->).*?(<!--/versione-->)', lambda m: m[1] + v.split(' ')[0] + m[2], t, flags=re.S)
        t = re.sub(r'(<!--peso-->).*?(<!--/peso-->)', lambda m: m[1] + peso(kb) + m[2], t, flags=re.S)
        pagina.write_text(t, encoding='utf-8')
        print(f'{pagina}: versione e peso aggiornati')


if __name__ == '__main__':
    main()
