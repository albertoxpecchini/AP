"""Prepara un giro di lettura della lavagna: ritaglia i fotogrammi ancora da leggere e ne fa i provini.

    python prepara.py <cartella_lezione> [--box x0,y0,x1,y1]

Il ritaglio è il riquadro video di Teams, trovato dalla sua cornice viola; senza cornice
(chat aperta, schermate d'errore) resta il fotogramma intero, o --box se dato. I provini
sono 3×3 ritagli per foglio in provini/, col nome sotto. Stampa ogni fotogramma da fare con
il tempo e la frase detta in quel momento, e scrive in attivita.json quali sta leggendo
(la barra mostra «ocr leggo…»).
"""
import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

from comune import da_fare, hms, leggi_jsonl, scrivi_json


def riquadro(im, riserva):
    """Il riquadro video principale di Teams, trovato dalla cornice viola (~RGB 97,98,175)."""
    a = np.asarray(im.convert('RGB')).astype(np.int16)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    viola = (r > 75) & (r < 120) & (g > 75) & (g < 120) & (b > 150) & (b < 210) & (b - r > 50)
    colonne = np.where(viola.sum(axis=0) > 200)[0]  # i bordi verticali, anche col pannello chat aperto
    righe = np.where(viola.sum(axis=1) > 300)[0]
    if len(colonne) < 2 or len(righe) < 2 or colonne[-1] - colonne[0] < 400 or righe[-1] - righe[0] < 220:
        return riserva
    return (int(colonne[0]) + 4, int(righe[0]) + 4, int(colonne[-1]) - 3, int(righe[-1]) - 3)


def ritaglia(cart, nome, box=None):
    """Il ritaglio della lavagna di un fotogramma, in ritagli/ (una volta sola)."""
    dest = cart / 'ritagli' / nome
    if not dest.exists():
        dest.parent.mkdir(exist_ok=True)
        im = Image.open(cart / 'frames' / nome)
        im.crop(riquadro(im, box or (0, 0, im.width, im.height))).save(dest, quality=95)
    return dest


def provino(cart, uscita, nomi, colonne=3, largo=620):
    """I ritagli di più fotogrammi in una griglia, col nome sotto ciascuno."""
    imgs = []
    for nome in nomi:
        im = Image.open(ritaglia(cart, nome))
        imgs.append((nome, im.resize((largo, round(im.height * largo / im.width)))))
    h = max(im.height for _, im in imgs) + 22
    foglio = Image.new('RGB', (largo * colonne, h * -(-len(imgs) // colonne)), 'white')
    d = ImageDraw.Draw(foglio)
    for i, (nome, im) in enumerate(imgs):
        x, y = (i % colonne) * largo, (i // colonne) * h
        foglio.paste(im, (x, y))
        d.text((x + 6, y + im.height + 4), nome, fill='black')
    foglio.save(uscita, quality=88)
    return uscita


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('cartella')
    ap.add_argument('--box', default='', help='riquadro fisso x0,y0,x1,y1 se la cornice di Teams non si trova')
    a = ap.parse_args()
    cart = Path(a.cartella)
    box = tuple(int(v) for v in a.box.split(',')) if a.box else None
    (cart / 'provini').mkdir(exist_ok=True)
    fare = da_fare(cart)
    scrivi_json(cart / 'attivita.json', {'frames': [f['file'] for f in fare]})
    voce = leggi_jsonl(cart / 'trascrizione.jsonl')
    for f in fare:
        nome = Path(f['file']).name
        ritaglia(cart, nome, box)
        detto = ' '.join(s['testo'] for s in voce if f['t'] - 12 <= s['t0'] <= f['t'] + 8)
        print(f'{hms(f["t"])} {nome}  «{detto[:160]}»')
    n = len(list((cart / 'provini').glob('p_*.jpg')))
    for i in range(0, len(fare), 9):
        n += 1
        print(provino(cart, cart / 'provini' / f'p_{n:03d}.jpg', [Path(f['file']).name for f in fare[i:i + 9]]))


if __name__ == '__main__':
    main()
