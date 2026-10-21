"""Aspetta che ci sia lavoro di lettura della lavagna da fare, poi esce stampando lo stato.

    python aspetta.py <cartella_lezione> [--minuti 2] [--fotogrammi 5] [--almeno 60]

Esce quando: c'è il file FINE, ci sono abbastanza fotogrammi senza lettura (dopo almeno
--almeno secondi), sono passati i minuti, l'audio tace da più di 10 minuti o il registratore
non aggiorna più meta.json. Serve a chi legge la lavagna a giri (Claude Code, vedi README).
"""
import argparse
import time
from pathlib import Path

from comune import da_fare, hms, leggi_json, leggi_jsonl


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('cartella')
    ap.add_argument('--minuti', type=float, default=2)
    ap.add_argument('--fotogrammi', type=int, default=5)
    ap.add_argument('--almeno', type=float, default=60, help='secondi minimi prima di uscire per i fotogrammi')
    a = ap.parse_args()
    cart = Path(a.cartella)
    t0 = time.time()
    perche = 'tempo'
    while time.time() - t0 < a.minuti * 60:
        meta = leggi_json(cart / 'meta.json', {}) or {}
        if (cart / 'FINE').exists():
            perche = 'FINE'
            break
        if len(da_fare(cart)) >= a.fotogrammi and time.time() - t0 > a.almeno:
            perche = 'fotogrammi'
            break
        if meta.get('audio', {}).get('silenzio_s', 0) > 600:
            perche = 'silenzio'
            break
        if (cart / 'meta.json').exists() and time.time() - (cart / 'meta.json').stat().st_mtime > 30:
            perche = 'REGISTRATORE FERMO'
            break
        time.sleep(5)
    meta = leggi_json(cart / 'meta.json', {}) or {}
    au = meta.get('audio', {})
    st = leggi_json(cart / 'trascrizione_stato.json', {}) or {}
    print(f'motivo: {perche}')
    print(f'durata {hms(meta.get("durata_s", 0))} · audio {au.get("livello_db")} dB, silenzio da {au.get("silenzio_s")} s'
          f' · trascritto fino a {hms(st.get("fatto_s", 0))} ({st.get("lingua")})'
          f' · frasi {len(leggi_jsonl(cart / "trascrizione.jsonl"))}')
    for f in da_fare(cart):
        print(f'da fare {hms(f["t"])} {f["file"]} cambio={f["cambio"]}')


if __name__ == '__main__':
    main()
