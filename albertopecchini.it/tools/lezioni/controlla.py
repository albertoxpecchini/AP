"""Controlla che Lezioni possa lavorare: GPU per Whisper, modello, audio del PC, schermi, Edge.

    python controlla.py

Lo lancia installa.ps1 alla fine; utile anche prima di una lezione se qualcosa non va.
Di Alberto Pecchini.
"""
import os
from pathlib import Path

from comune import CASA, cartella_lezioni, cuda_dll

cuda_dll()
import ctranslate2  # noqa: E402
import mss  # noqa: E402
import pyaudiowpatch as pa  # noqa: E402

from registra import scegli_schermo  # noqa: E402


def riga(etichetta, valore, ok=True):
    print(f'{"ok " if ok else "!! "} {etichetta:<22} {valore}')


def main():
    gpu = ctranslate2.get_cuda_device_count() > 0
    riga('GPU per Whisper', 'sì (large-v3)' if gpu else 'no: CPU col modello small', True)
    cache = Path(os.environ.get('HF_HOME') or Path.home() / '.cache' / 'huggingface') / 'hub'
    modelli = sorted(p.name.split('--')[-1] for p in cache.glob('models--Systran--faster-whisper-*'))
    riga('modelli scaricati', ', '.join(modelli) or 'nessuno (installa.ps1 lo scarica)', bool(modelli))

    p = pa.PyAudio()
    try:
        w = p.get_host_api_info_by_type(pa.paWASAPI)
        out = p.get_device_info_by_index(w['defaultOutputDevice'])
        lb = [d['name'] for d in p.get_loopback_device_info_generator() if out['name'] in d['name']]
        riga('audio registrato da', f'{out["name"]} (uscita predefinita)', bool(lb))
    finally:
        p.terminate()

    with mss.MSS() as s:
        monitori = s.monitors[1:]
        for i, m in enumerate(monitori, 1):
            riga(f'schermo {i}', f'{m.get("name")} {m["width"]}×{m["height"]}{" (principale)" if m.get("is_primary") else ""}')
        m, perche = scegli_schermo(monitori, 'auto')
        riga('registrerei', f'{m.get("name")} ({perche})')

    edge = any(Path(e).exists() for e in (r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
                                         r'C:\Program Files\Microsoft\Edge\Application\msedge.exe'))
    riga('Edge per il PDF', 'sì' if edge else 'no: resta l\'HTML degli appunti', edge)
    riga('lezioni in', cartella_lezioni())
    riga('Claude automatico', 'sì (ANTHROPIC_API_KEY)' if os.environ.get('ANTHROPIC_API_KEY') else 'no: si usa Claude Code')
    riga('dati del tool', CASA)


if __name__ == '__main__':
    main()
