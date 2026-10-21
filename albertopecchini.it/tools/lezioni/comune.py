"""Cose condivise dagli strumenti delle lezioni: cartelle, tempi, file JSON scritti a metà."""
import json
import os
import sys
import time
from pathlib import Path

CHUNK_S = 10  # secondi per pezzo audio: il pezzo k comincia a k*CHUNK_S

QUI = Path(__file__).resolve().parent
# l'ambiente Python, la cartella della lezione in corso e lo stato della barra: fuori dal codice,
# così la cartella del tool si può aggiornare (o riscaricare) senza reinstallare niente
CASA = Path(os.environ.get('LOCALAPPDATA') or Path.home() / 'AppData' / 'Local') / 'Lezioni'


def cartella_lezioni():
    """Dove stanno le lezioni: LEZIONI_DIR se c'è, altrimenti Documenti\\Lezioni."""
    if os.environ.get('LEZIONI_DIR'):
        return Path(os.environ['LEZIONI_DIR'])
    try:  # la cartella Documenti vera, anche se spostata (OneDrive, altro disco)
        import ctypes.wintypes
        buf = ctypes.create_unicode_buffer(ctypes.wintypes.MAX_PATH)
        ctypes.windll.shell32.SHGetFolderPathW(None, 5, None, 0, buf)  # CSIDL_PERSONAL
        if buf.value:
            return Path(buf.value) / 'Lezioni'
    except (AttributeError, OSError):
        pass
    return Path.home() / 'Documents' / 'Lezioni'


def lezione_corrente():
    p = CASA / 'corrente.txt'
    return Path(p.read_text(encoding='utf-8-sig').strip()) if p.exists() else None


def hms(t):
    t = int(t)
    h, r = divmod(t, 3600)
    m, s = divmod(r, 60)
    return f'{h}:{m:02d}:{s:02d}' if h else f'{m:02d}:{s:02d}'


def leggi_json(p, vuoto=None):
    try:
        return json.loads(Path(p).read_text(encoding='utf-8-sig'))  # -sig: regge anche i file scritti da PowerShell
    except (FileNotFoundError, json.JSONDecodeError):
        return vuoto


def scrivi_json(p, d):
    tmp = Path(f'{p}.{os.getpid()}.tmp')
    tmp.write_text(json.dumps(d, ensure_ascii=False, indent=1), encoding='utf-8')
    for _ in range(40):  # su Windows il replace fallisce se un lettore ha il file aperto
        try:
            os.replace(tmp, p)
            return
        except PermissionError:
            time.sleep(0.05)
    tmp.unlink(missing_ok=True)


def leggi_jsonl(p):
    p = Path(p)
    if not p.exists():
        return []
    out = []
    for riga in p.read_text(encoding='utf-8').splitlines():
        if riga.strip():
            try:
                out.append(json.loads(riga))
            except json.JSONDecodeError:
                pass  # riga a metà mentre l'altro processo scrive
    return out


def aggiungi_jsonl(p, d):
    with open(p, 'a', encoding='utf-8') as f:
        f.write(json.dumps(d, ensure_ascii=False) + '\n')


def fotogrammi_letti(cart):
    """I fotogrammi che hanno già la lettura della lavagna (in ocr/*.json)."""
    fatti = set()
    for p in (Path(cart) / 'ocr').glob('*.json'):
        fatti |= {d['frame'] for d in leggi_json(p, []) or []}
    return fatti


def da_fare(cart):
    """I fotogrammi ancora senza lettura della lavagna, in ordine di tempo."""
    fatti = fotogrammi_letti(cart)
    return [f for f in leggi_jsonl(Path(cart) / 'frames.jsonl') if f['file'] not in fatti]


def prossimo_ocr(cart):
    """Il nome libero per il prossimo blocco di letture: ocr/ocr_NNN.json."""
    (Path(cart) / 'ocr').mkdir(exist_ok=True)
    n = [int(p.stem.split('_')[-1]) for p in (Path(cart) / 'ocr').glob('ocr_*.json') if p.stem.split('_')[-1].isdigit()]
    return Path(cart) / 'ocr' / f'ocr_{(max(n) + 1) if n else 0:03d}.json'


def cuda_dll():
    """cuBLAS e cuDNN arrivano dai pacchetti pip nvidia-*: ctranslate2 li cerca nel PATH."""
    base = Path(sys.prefix) / 'Lib' / 'site-packages' / 'nvidia'
    for sub in ('cublas', 'cudnn', 'cuda_nvrtc'):
        d = base / sub / 'bin'
        if d.is_dir():
            os.add_dll_directory(str(d))
            os.environ['PATH'] = str(d) + os.pathsep + os.environ.get('PATH', '')
