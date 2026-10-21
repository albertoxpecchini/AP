"""Mette insieme voce, fotogrammi e OCR in grezzo.md, in ordine di tempo.

    python componi.py <cartella_lezione>

Fonti: meta.json, trascrizione.jsonl, frames.jsonl e ocr/*.json; questi ultimi sono
liste di {"frame": "frames/t_000754.jpg", "lavagna": "markdown con LaTeX",
"nuovo": "cosa è cambiato (facoltativo)", "uguale": true se sulla lavagna non c'è niente
di nuovo, "salta": true per i fotogrammi senza lezione}.
"""
import os
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path

from comune import hms, leggi_json, leggi_jsonl


def componi(cart):
    cart = Path(cart)
    meta = leggi_json(cart / 'meta.json', {})
    voce = leggi_jsonl(cart / 'trascrizione.jsonl')
    frames = leggi_jsonl(cart / 'frames.jsonl')
    ocr = {}
    for p in sorted((cart / 'ocr').glob('*.json')):
        for d in leggi_json(p, []) or []:
            ocr[d['frame']] = d
    inizio = datetime.fromisoformat(meta['inizio']) if meta.get('inizio') else None
    st = leggi_json(cart / 'trascrizione_stato.json', {}) or {}
    lingua, motore = st.get('lingua') or '?', st.get('motore') or 'Whisper'

    eventi = [(s['t0'], 0, s) for s in voce] + [(f['t'], 1, f) for f in frames]
    eventi.sort(key=lambda e: (e[0], e[1]))
    fatti = sum(1 for f in frames if f['file'] in ocr)

    r = [f'# Lezione del {inizio:%d/%m/%Y} — file grezzo' if inizio else '# Lezione — file grezzo', '']
    if inizio:
        r.append(f'Inizio {inizio:%H:%M:%S} · durata {hms(meta.get("durata_s", 0))} · '
                 f'{"finita " + meta["fine"][11:] if meta.get("fine") else "in registrazione"}')
    r += [f'Schermo {meta.get("schermo", {}).get("nome", "?")} · audio {meta.get("audio", {}).get("dispositivo", "?")} '
          f'· voce {motore}, lingua {lingua} · {len(voce)} frasi · {len(frames)} fotogrammi, OCR su {fatti}',
          '',
          'Tempi in minuti:secondi dall\'inizio della registrazione, uguali per voce e lavagna. '
          '🗣 voce · 🖼 lavagna (sotto, la lettura OCR in LaTeX).', '', '---', '']
    minuto = -1
    for t, tipo, d in eventi:
        if t // 300 != minuto:  # un titoletto ogni 5 minuti per orientarsi
            minuto = t // 300
            ora = f' · {(inizio + timedelta(seconds=minuto * 300)):%H:%M}' if inizio else ''
            r += ['', f'## {hms(minuto * 300)}{ora}', '']
        if tipo == 0:
            r.append(f'**[{hms(t)}]** 🗣 {d["testo"]}  ')
            continue
        o = ocr.get(d['file'])
        if o and o.get('salta'):
            continue
        if o and o.get('uguale'):
            r.append(f'**[{hms(t)}]** 🖼 [{Path(d["file"]).name}]({d["file"]}) · lavagna invariata  ')
            continue
        r += ['', f'**[{hms(t)}]** 🖼 [{Path(d["file"]).name}]({d["file"]})'
              + ('' if o else ' _(OCR da fare)_')]
        if o:
            if o.get('nuovo'):
                r.append(f'> **Nuovo:** {o["nuovo"]}')
                if o.get('lavagna', '').strip():
                    r.append('>')
            r += ['> ' + riga if riga.strip() else '>' for riga in o.get('lavagna', '').strip().splitlines()]
        r.append('')
    testo = '\n'.join(r).rstrip() + '\n'
    tmp = cart / f'grezzo.md.{os.getpid()}.tmp'  # nome per processo: trascrittore e OCR possono comporre insieme
    tmp.write_text(testo, encoding='utf-8')
    for _ in range(40):  # Windows rifiuta il replace se qualcuno ha grezzo.md aperto in quel momento
        try:
            tmp.replace(cart / 'grezzo.md')
            return
        except PermissionError:
            time.sleep(0.1)
    tmp.unlink(missing_ok=True)


if __name__ == '__main__':
    componi(sys.argv[1])
