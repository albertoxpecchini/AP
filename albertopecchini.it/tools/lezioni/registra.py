"""Registra la lezione: audio di sistema (loopback WASAPI) e schermo, sullo stesso orologio.

    python registra.py <cartella_lezione> [--schermo auto|"HP 24f"|2]

Audio: pezzi WAV mono da CHUNK_S secondi in audio/ (il pezzo k comincia a k*CHUNK_S).
I buchi (nessun suono in uscita, cambio di dispositivo) diventano silenzio, così il
tempo dell'audio resta quello dell'orologio e combacia con i fotogrammi.
Schermo: un fotogramma in frames/ quando la lavagna cambia e si ferma, o ogni 20 s
se continua a cambiare. Si ferma quando compare il file STOP (o con Ctrl+C).
"""
import argparse
import queue
import threading
import time
import wave
from datetime import datetime
from pathlib import Path

import mss
import numpy as np
import pyaudiowpatch as pa
from PIL import Image

from comune import CHUNK_S, aggiungi_jsonl, leggi_json, leggi_jsonl, scrivi_json

stato = {'audio': {}, 'schermo': {}}


def scrivi_wav(p, x, rate):
    tmp = p.with_suffix('.tmp')
    with wave.open(str(tmp), 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(rate)
        w.writeframes(x.astype(np.int16).tobytes())
    tmp.replace(p)


class Audio:
    def __init__(self, cart, t0, ferma):
        self.cart, self.t0, self.ferma = cart / 'audio', t0, ferma
        self.cart.mkdir(parents=True, exist_ok=True)
        self.q = queue.Queue()
        self.p = pa.PyAudio()
        self.rate = None  # fissato alla prima apertura
        self.flussi = []

    def apri(self):
        self.chiudi()
        self.p.terminate()
        self.p = pa.PyAudio()
        w = self.p.get_host_api_info_by_type(pa.paWASAPI)
        out = self.p.get_device_info_by_index(w['defaultOutputDevice'])
        lb = next(d for d in self.p.get_loopback_device_info_generator() if out['name'] in d['name'])
        self.rate_dev, self.ch = int(lb['defaultSampleRate']), lb['maxInputChannels']
        self.rate = self.rate or self.rate_dev

        def cb_in(dati, n, info, st):
            self.q.put((time.perf_counter(), dati))
            return (None, pa.paContinue)

        def cb_out(dati, n, info, st):  # silenzio in uscita: tiene vivo il loopback anche senza suono
            return (bytes(n * out['maxOutputChannels'] * 2), pa.paContinue)

        try:
            self.flussi.append(self.p.open(format=pa.paInt16, channels=out['maxOutputChannels'],
                                           rate=int(out['defaultSampleRate']), output=True,
                                           output_device_index=out['index'], stream_callback=cb_out))
        except Exception as e:
            print('silenzio di mantenimento non partito:', e, flush=True)
        self.flussi.append(self.p.open(format=pa.paInt16, channels=self.ch, rate=self.rate_dev, input=True,
                                       input_device_index=lb['index'], frames_per_buffer=self.rate_dev // 10,
                                       stream_callback=cb_in))
        self.dispositivo = lb['name']
        stato['audio'].update(dispositivo=lb['name'], rate=self.rate)
        print('audio da', lb['name'], self.rate_dev, 'Hz', flush=True)

    def chiudi(self):
        for s in self.flussi:
            try:
                s.stop_stream()
                s.close()
            except Exception:
                pass
        self.flussi = []

    def gira(self):
        self.apri()
        n = self.rate * CHUNK_S
        k = len(list(self.cart.glob('c_*.wav')))  # ripresa dopo un crash: si continua la numerazione
        buf, in_buf, scritti = [], 0, k * n  # scritti = campioni già nei pezzi
        ultimo_dato = ultimo_suono = time.perf_counter()
        livelli, chiuso = [], False
        while True:
            if self.ferma.is_set() and not chiuso:
                self.chiudi()  # niente più dati: si svuota la coda e si chiude l'ultimo pezzo
                chiuso = True
            try:
                t, dati = self.q.get(timeout=0.5)
                ultimo_dato = t
                x = np.frombuffer(dati, np.int16).reshape(-1, self.ch).mean(axis=1)
                if self.rate_dev != self.rate:
                    x = np.interp(np.linspace(0, len(x) - 1, int(len(x) * self.rate / self.rate_dev)),
                                  np.arange(len(x)), x)
            except queue.Empty:
                if chiuso:
                    break
                t, x = time.perf_counter(), np.zeros(0)
                if t - ultimo_dato > 5:
                    print('audio fermo da 5 s: riapro il dispositivo', flush=True)
                    try:
                        self.apri()
                    except Exception as e:
                        print('riapertura fallita:', e, flush=True)
                    ultimo_dato = time.perf_counter()
            atteso = int((t - self.t0) * self.rate)
            buco = atteso - (scritti + in_buf + len(x))
            if buco > self.rate:  # più di 1 s mancante: silenzio al posto del buco, un pezzo alla volta
                while buco > 0:
                    z = min(buco, n - in_buf) if in_buf < n else 0
                    if z:
                        buf.append(np.zeros(z))
                        in_buf += z
                        buco -= z
                    if in_buf >= n:
                        tutto = np.concatenate(buf)
                        scrivi_wav(self.cart / f'c_{k:05d}.wav', np.clip(tutto[:n], -32768, 32767), self.rate)
                        k += 1
                        scritti += n
                        buf, in_buf = [tutto[n:]], len(tutto) - n
            if len(x):
                buf.append(x)
                in_buf += len(x)
                rms = float(np.sqrt(np.mean(x ** 2)))
                livelli.append(rms)
                if rms > 150:
                    ultimo_suono = t
            while in_buf >= n:
                tutto = np.concatenate(buf)
                scrivi_wav(self.cart / f'c_{k:05d}.wav', np.clip(tutto[:n], -32768, 32767), self.rate)
                k += 1
                scritti += n
                buf, in_buf = [tutto[n:]], len(tutto) - n
            if len(livelli) >= 10:
                db = 20 * np.log10(max(np.mean(livelli), 1) / 32768)
                stato['audio'].update(livello_db=round(float(db), 1), pezzi=k,
                                      silenzio_s=round(time.perf_counter() - ultimo_suono))
                livelli = []
        if in_buf:
            scrivi_wav(self.cart / f'c_{k:05d}.wav', np.clip(np.concatenate(buf), -32768, 32767), self.rate)
            k += 1
        self.p.terminate()
        stato['audio'].update(pezzi=k, fine=True)


def finestre_teams():
    """I rettangoli delle finestre visibili col titolo di Teams (l'app o la scheda del browser)."""
    import ctypes
    from ctypes import wintypes
    u = ctypes.windll.user32
    trovate = []

    @ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)
    def una(hwnd, _):
        if u.IsWindowVisible(hwnd) and not u.IsIconic(hwnd):
            n = u.GetWindowTextLengthW(hwnd)
            buf = ctypes.create_unicode_buffer(n + 1)
            u.GetWindowTextW(hwnd, buf, n + 1)
            if 'teams' in buf.value.lower():
                r = wintypes.RECT()
                u.GetWindowRect(hwnd, ctypes.byref(r))
                trovate.append((r.left, r.top, r.right, r.bottom))
        return True

    u.EnumWindows(una, 0)
    return trovate


def scegli_schermo(monitori, nome):
    """Lo schermo da registrare: quello col nome dato, se no quello con la finestra di Teams più
    grande, se no il secondario (di solito la lezione sta lì), se no il principale."""
    if nome and nome != 'auto':
        m = next((m for m in monitori if nome.lower() in m.get('name', '').lower()), None)
        if m is None and nome.isdigit() and 1 <= int(nome) <= len(monitori):
            m = monitori[int(nome) - 1]
        if m is None:
            raise SystemExit(f'schermo «{nome}» non trovato: {[m.get("name") for m in monitori]}')
        return m, 'scelto'
    try:
        for l, t, r, b in sorted(finestre_teams(), key=lambda f: (f[2] - f[0]) * (f[3] - f[1]), reverse=True):
            cx, cy = (l + r) // 2, (t + b) // 2
            for m in monitori:
                if m['left'] <= cx < m['left'] + m['width'] and m['top'] <= cy < m['top'] + m['height']:
                    return m, 'Teams'
    except (AttributeError, OSError):
        pass
    secondari = [m for m in monitori if not m.get('is_primary')]
    return (secondari[0], 'secondario') if secondari else (monitori[0], 'unico')


def schermo(cart, t0, ferma, nome):
    dest = cart / 'frames'
    dest.mkdir(parents=True, exist_ok=True)
    with mss.MSS() as sct:
        mon, perche = scegli_schermo(sct.monitors[1:], nome)
        stato['schermo'].update(nome=mon.get('name'), area=[mon['left'], mon['top'], mon['width'], mon['height']])
        print('schermo', mon.get('name'), mon['width'], 'x', mon['height'], f'({perche})', flush=True)

        def diff(a, b):
            return float((np.abs(a - b) > 20).mean())

        prec = salvato = None
        t_salvato, n = -1e9, len(leggi_jsonl(cart / 'frames.jsonl'))
        prossimo = time.perf_counter()
        while not ferma.is_set():
            t = time.perf_counter() - t0
            img = sct.grab(mon)
            a = np.frombuffer(img.bgra, np.uint8).reshape(img.height, img.width, 4)
            piccolo = a[::6, ::6, :3].astype(np.int16).sum(axis=2) // 3
            fermo = prec is not None and diff(piccolo, prec) < 0.002
            cambio = 1.0 if salvato is None else diff(piccolo, salvato)
            if cambio > 0.004 and ((fermo and t - t_salvato >= 3) or t - t_salvato >= 20):
                nome_f = f't_{int(t):06d}.jpg'
                Image.frombytes('RGB', img.size, img.bgra, 'raw', 'BGRX').save(dest / nome_f, quality=92)
                aggiungi_jsonl(cart / 'frames.jsonl', {'t': round(t, 1), 'file': f'frames/{nome_f}',
                                                       'ora': datetime.now().strftime('%H:%M:%S'),
                                                       'cambio': round(cambio, 4), 'fermo': fermo})
                salvato, t_salvato = piccolo, t
                n += 1
                stato['schermo'].update(fotogrammi=n, ultimo=nome_f)
            prec = piccolo
            prossimo += 1
            time.sleep(max(0, prossimo - time.perf_counter()))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('cartella')
    ap.add_argument('--schermo', default='auto', help='auto (dove c\'è Teams), un pezzo del nome o il numero')
    a = ap.parse_args()
    cart = Path(a.cartella)
    cart.mkdir(parents=True, exist_ok=True)
    (cart / 'STOP').unlink(missing_ok=True)
    (cart / 'FINE').unlink(missing_ok=True)
    ferma = threading.Event()
    meta = leggi_json(cart / 'meta.json', {}) or {}
    if meta.get('inizio'):  # ripresa dopo un crash: stesso orologio, il buco diventa silenzio
        inizio = datetime.fromisoformat(meta['inizio'])
        t0 = time.perf_counter() - (datetime.now() - inizio).total_seconds()
        print('riprendo la registrazione iniziata alle', inizio.strftime('%H:%M:%S'), flush=True)
    else:
        inizio, t0 = datetime.now(), time.perf_counter()
    audio = Audio(cart, t0, ferma)
    ta = threading.Thread(target=audio.gira, daemon=True)
    ts = threading.Thread(target=schermo, args=(cart, t0, ferma, a.schermo), daemon=True)
    ta.start()
    ts.start()
    try:
        while not (cart / 'STOP').exists() and ta.is_alive() and ts.is_alive():
            scrivi_json(cart / 'meta.json', {'inizio': inizio.isoformat(timespec='seconds'),
                                             'durata_s': round(time.perf_counter() - t0), 'chunk_s': CHUNK_S,
                                             **stato})
            time.sleep(2)
    except KeyboardInterrupt:
        pass
    ferma.set()
    ts.join(5)
    ta.join(15)
    scrivi_json(cart / 'meta.json', {'inizio': inizio.isoformat(timespec='seconds'),
                                     'durata_s': round(time.perf_counter() - t0), 'chunk_s': CHUNK_S,
                                     'fine': datetime.now().isoformat(timespec='seconds'), **stato})
    (cart / 'FINE').write_text(datetime.now().isoformat(timespec='seconds'), encoding='utf-8')
    print('fermato', flush=True)


if __name__ == '__main__':
    main()
