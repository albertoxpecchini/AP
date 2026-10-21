"""Unisce gli appunti scritti a pezzi (appunti/parte_1.md, parte_2.md, …) in appunti/appunti.md.

    python unisci.py <cartella_lezione> --titolo "Infiniti e infinitesimi" [--nota "riga sotto il titolo"]

Quando una lezione lunga si divide fra più lettori (uno per pezzo di registrazione), ognuno
scrive le sue sezioni «## 1. …» senza titolo né intestazione: qui le sezioni si rinumerano
di seguito, si scrive l'intestazione (data, orari, durata dai dati della registrazione) e
l'indice, e i pezzi si mettono uno dopo l'altro. Poi: python impagina.py <cartella>/appunti/appunti.md
Di Alberto Pecchini.
"""
import argparse
import re
from datetime import datetime
from pathlib import Path

from comune import hms, leggi_json, leggi_jsonl


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('cartella')
    ap.add_argument('--titolo', required=True)
    ap.add_argument('--nota', default='', help='una riga in più sotto l\'intestazione (chi spiega, il corso…)')
    a = ap.parse_args()
    cart = Path(a.cartella)
    pezzi = sorted((cart / 'appunti').glob('parte_*.md'), key=lambda p: int(re.sub(r'\D', '', p.stem) or 0))
    if not pezzi:
        raise SystemExit('nessun appunti/parte_*.md')

    n, corpi, indice = 0, [], []

    def rinumera(m):
        nonlocal n
        n += 1
        indice.append(f'{n}. {m.group(2).strip()}')
        return f'## {n}. {m.group(2)}'

    for p in pezzi:
        testo = p.read_text(encoding='utf-8').strip()
        corpi.append(re.sub(r'^## (\d+\.\s*)?(.+)$', rinumera, testo, flags=re.M))

    meta = leggi_json(cart / 'meta.json', {}) or {}
    voce = leggi_jsonl(cart / 'trascrizione.jsonl')
    inizio = datetime.fromisoformat(meta['inizio']) if meta.get('inizio') else None
    righe = [f'# {a.titolo}', '']
    if inizio and voce:
        ultima = max(s['t1'] for s in voce)
        righe.append(f'**Lezione del {inizio:%d/%m/%Y}** — dalle {inizio:%H:%M} a circa '
                     f'{datetime.fromtimestamp(inizio.timestamp() + ultima):%H:%M} '
                     f'({hms(ultima)} di registrazione con la voce).')
    if a.nota:
        righe.append(a.nota)
    righe += ['', '> I rimandi `⏱ h:mm:ss` sono i minuti della registrazione, gli stessi del file `grezzo.md`: '
              'lì trovi la frase esatta detta in quel momento e la schermata della lavagna.', '',
              '**In questi appunti**', '', *indice, '', '---', '', '']
    (cart / 'appunti' / 'appunti.md').write_text('\n'.join(righe) + '\n\n---\n\n'.join(corpi) + '\n', encoding='utf-8')
    print(cart / 'appunti' / 'appunti.md', f'· {len(pezzi)} pezzi · {n} sezioni')


if __name__ == '__main__':
    main()
