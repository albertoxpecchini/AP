"""Barretta della lezione in stile pzk: un foglio attaccato col nastro a un pezzo di
saracinesca, che esce dal bordo sinistro dello schermo tirando la linguetta.

    python barra.py <cartella_lezione> [--chiusa]

Sul foglio: rec e durata, livello audio, l'ultimo scatto dello schermo (si accende a
ogni fotogramma), «voce −N s» (trascritta fino a N secondi fa), «ocr −N min» (lavagna
letta fino a N minuti fa; «leggo N» mentre la leggo) e l'ultima frase sentita.
Clic sulla linguetta: dentro/fuori; trascinarla: su e giù lungo il bordo; doppio clic
sul foglio: chiude. Sta sul bordo sinistro dello schermo principale: se si registra
proprio quello (un solo monitor) parte chiusa, per non finire nei fotogrammi.
Immagini e caratteri vengono da pzkko.it (albertopecchini.it/pzkko/art e fonts).
"""
import argparse
import json
import sys
import time
import tkinter as tk
from datetime import datetime
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageTk

from comune import CASA, hms, leggi_json, leggi_jsonl, scrivi_json

ART = Path(__file__).with_name('barra')
P_STATO = CASA / 'barra.json'

CHIAVE = (255, 0, 255)  # il magenta di pzkko è la chiave cromatica: qui è il colore trasparente
LAMIERA = (142, 142, 138)
INCHIOSTRO = (22, 22, 22)
MATITA = (110, 108, 104)
PENNARELLO = (165, 13, 37)  # --marker-rosso, quello dei fogli bianchi
LED, LED_SPENTO, LED_FERMO = (232, 38, 28), (96, 24, 22), (240, 150, 20)
GIALLO = (255, 212, 0)  # il giallo del fuoco: l'unico colore «di sistema»

PW, PH = 262, 138  # pezzo di saracinesca
TW, TH, TY = 30, 92, 22  # linguetta di nastro: larghezza, altezza, distanza dal bordo alto
SPORGE = 5  # quanto la linguetta entra sotto la lamiera
W = PW + TW - SPORGE
S = 2  # il foglio si disegna al doppio e si rimpicciolisce: il testo storto resta nitido
TRASPARENZA = 0.78  # piena opacità solo col mouse sopra


def font(nome, px):
    return ImageFont.truetype(str(ART / nome), px * S)


class Pezzi:
    """Le immagini fisse, preparate una volta."""

    def __init__(self):
        lam = Image.open(ART / 'lamiera.webp').convert('RGB')
        self.lamiera = lam.crop((380, 300, 380 + PW * 5, 300 + PH * 5)).resize((PW, PH), Image.LANCZOS)
        d = ImageDraw.Draw(self.lamiera)
        d.rectangle((0, 0, PW - 1, PH - 1), outline=(70, 70, 68))
        pzk = Image.open(ART / 'pzk.webp').convert('RGBA')
        pzk.thumbnail((96, 82), Image.LANCZOS)
        self.lamiera.paste(pzk, (PW - 62, PH - 70), pzk)  # il graffito spunta da dietro il foglio

        carta = Image.open(ART / 'carta.webp').convert('RGBA').rotate(90, expand=True)
        self.carta = carta.resize((226 * S, 122 * S), Image.LANCZOS)

        nastro = Image.open(ART / 'nastro.webp').convert('RGBA')
        self.nastro = nastro.resize((62, 20), Image.LANCZOS).rotate(-7, expand=True, resample=Image.BICUBIC)
        self.nastro2 = nastro.resize((40, 16), Image.LANCZOS).rotate(38, expand=True, resample=Image.BICUBIC)
        ling = nastro.rotate(90, expand=True).resize((TW, TH), Image.LANCZOS)
        d = ImageDraw.Draw(ling)
        scritta = Image.new('RGBA', (TH - 26, TW), (0, 0, 0, 0))
        ImageDraw.Draw(scritta).text((2, 3), 'lezione', font=ImageFont.truetype(str(ART / 'permanent-marker.woff2'), 14),
                                     fill=INCHIOSTRO)
        ling.paste(scritta.rotate(90, expand=True), (2, 24), scritta.rotate(90, expand=True))
        self.linguetta = ling

        self.f_rec = font('anton.woff2', 19)
        self.f_testo = font('special-elite.woff2', 12)
        self.f_piccolo = font('special-elite.woff2', 10)
        self.f_mano = font('permanent-marker.woff2', 11)


def in_righe(testo, f, largo, righe):
    """Le ultime parole che stanno in `righe` righe larghe `largo`, con «…» davanti se tagliate."""
    parole, fuori = testo.split(), []
    while parole:
        out, riga = [], ''
        for p in parole:
            prova = (riga + ' ' + p).strip()
            if f.getlength(prova) <= largo:
                riga = prova
            else:
                out.append(riga)
                riga = p
        out.append(riga)
        if len(out) <= righe:
            if fuori:
                out[0] = '…' + out[0]
            return out
        fuori.append(parole.pop(0))
    return []


class Barra:
    def __init__(self, cart, chiusa):
        self.cart = cart
        self.p = Pezzi()
        st = leggi_json(P_STATO, {}) or {}
        self.aperta = not chiusa and st.get('aperta', True)
        r = self.root = tk.Tk()
        self.sh = r.winfo_screenheight()
        self.y = max(0, min(int(st.get('y', 560)), self.sh - PH - 48))
        r.overrideredirect(True)
        r.attributes('-topmost', True)
        r.attributes('-alpha', TRASPARENZA)
        r.attributes('-transparentcolor', '#ff00ff')
        r.configure(bg='#ff00ff')
        self.etichetta = tk.Label(r, bd=0, bg='#ff00ff')
        self.etichetta.pack()
        self.x = 0 if self.aperta else -PW
        r.geometry(f'{W}x{PH}+{self.x}+{self.y}')
        self.etichetta.bind('<ButtonPress-1>', self.premi)
        self.etichetta.bind('<B1-Motion>', self.trascina)
        self.etichetta.bind('<ButtonRelease-1>', self.lascia)
        self.etichetta.bind('<Double-Button-1>', self.doppio)
        r.bind('<Enter>', lambda e: r.attributes('-alpha', 1.0))
        r.bind('<Leave>', lambda e: r.attributes('-alpha', TRASPARENZA))
        self.presa = None
        self.n_frame, self.lampo, self.mini = None, 0, None
        self.mtime_voce, self.frase = 0, ''
        self.lento_t, self.ocr = 0, {}
        self.giro()

    # --- linguetta: clic per entrare/uscire, trascinamento in verticale
    def sulla_linguetta(self, e):
        return e.x >= PW - SPORGE and TY <= e.y <= TY + TH

    def premi(self, e):
        self.presa = (e.y_root, self.y, self.sulla_linguetta(e), False)

    def trascina(self, e):
        if not self.presa or not self.presa[2]:
            return
        y0, y_prima, _, _ = self.presa
        if abs(e.y_root - y0) > 3:
            self.presa = (y0, y_prima, True, True)
            self.y = max(0, min(y_prima + e.y_root - y0, self.sh - PH - 48))
            self.root.geometry(f'+{self.x}+{self.y}')

    def lascia(self, e):
        if self.presa and self.presa[2]:
            if not self.presa[3]:
                self.aperta = not self.aperta
                self.scorri(0 if self.aperta else -PW)  # chiusa: la lamiera esce tutta, resta la linguetta
            self.salva()
        self.presa = None

    def doppio(self, e):
        if not self.sulla_linguetta(e):
            self.root.destroy()

    def scorri(self, dove, passo=0, da=None):
        da = self.x if da is None else da
        k = (passo + 1) / 12
        self.x = round(da + (dove - da) * (1 - (1 - k) ** 3))
        self.root.geometry(f'+{self.x}+{self.y}')
        if passo < 11:
            self.root.after(15, self.scorri, dove, passo + 1, da)

    def salva(self):
        try:
            scrivi_json(P_STATO, {'aperta': self.aperta, 'y': self.y})
        except OSError:
            pass

    # --- lettura dei file della lezione
    def leggi(self):
        c, ora = self.cart, time.time()
        s = {'ora': ora}
        meta = leggi_json(c / 'meta.json', {}) or {}
        try:
            s['vivo'] = ora - (c / 'meta.json').stat().st_mtime < 10
        except OSError:
            s['vivo'] = False
        s['fine'] = (c / 'FINE').exists()
        if meta.get('inizio') and s['vivo'] and not s['fine']:
            s['durata'] = (datetime.now() - datetime.fromisoformat(meta['inizio'])).total_seconds()
        else:
            s['durata'] = meta.get('durata_s', 0)
        s['audio'] = meta.get('audio', {})
        s['ha_meta'] = bool(meta)
        frames = leggi_jsonl(c / 'frames.jsonl')
        s['n_frame'] = len(frames)
        st = leggi_json(c / 'trascrizione_stato.json', {}) or {}
        s['fatto'] = st.get('fatto_s')

        if ora - self.lento_t > 2:  # OCR e frase: ogni 2 s bastano
            self.lento_t = ora
            letti = set()
            for p in (c / 'ocr').glob('*.json'):
                letti |= {d.get('frame') for d in (leggi_json(p, []) or []) if isinstance(d, dict)}
            in_lettura = set((leggi_json(c / 'attivita.json', {}) or {}).get('frames', []))
            fare = [f for f in frames if f['file'] not in letti]
            self.ocr = {
                'leggo': [f for f in fare if f['file'] in in_lettura],
                'coda': sum(1 for f in fare if f['file'] not in in_lettura),
                'ultimo_t': max((f['t'] for f in frames if f['file'] in letti), default=None),
            }
            p = c / 'trascrizione.jsonl'
            if p.exists() and p.stat().st_mtime != self.mtime_voce:
                self.mtime_voce = p.stat().st_mtime
                with open(p, 'rb') as f:
                    f.seek(max(0, p.stat().st_size - 4000))
                    righe = [x for x in f.read().decode('utf-8', 'ignore').splitlines() if x.strip()]
                try:
                    self.frase = json.loads(righe[-1])['testo']
                except (IndexError, ValueError, KeyError):
                    pass  # prima riga tagliata dal seek o file ancora vuoto
        s['ocr'] = self.ocr

        if frames and (self.n_frame is None or len(frames) > self.n_frame):
            if self.n_frame is not None:
                self.lampo = ora
            try:
                im = Image.open(c / frames[-1]['file']).convert('RGB')
                im.thumbnail((56 * S, 32 * S), Image.LANCZOS)
                self.mini = im
            except OSError:
                pass  # fotogramma ancora in scrittura: lo prende il giro dopo
        self.n_frame = len(frames)
        return s

    # --- disegno
    def foglio(self, s):
        p, ora = self.p, s['ora']
        im = p.carta.copy()
        d = ImageDraw.Draw(im)
        X = lambda v: v * S  # noqa: E731

        # rec e durata
        if s['fine']:
            led, scritta = MATITA, f'finita {hms(s["durata"])}'
        elif s['vivo']:
            led = LED if int(ora * 2) % 2 == 0 else LED_SPENTO
            scritta = f'rec {hms(s["durata"])}'
        elif s['ha_meta']:
            led, scritta = LED_FERMO, 'rec fermo!'
        else:
            led, scritta = MATITA, 'in attesa'
        d.ellipse((X(12), X(13), X(23), X(24)), fill=led, outline=INCHIOSTRO, width=S)
        d.text((X(29), X(4)), scritta, font=p.f_rec, fill=PENNARELLO if scritta == 'rec fermo!' else INCHIOSTRO)

        # audio: tacche come un vu-metro a pennarello
        au = s['audio']
        db, zitto = au.get('livello_db'), au.get('silenzio_s', 0) > 20
        piene = 0 if db is None or not s['vivo'] or zitto else max(0, min(10, round((db + 60) / 5)))
        for i in range(10):
            x0, h = X(13 + i * 6), X(4 + i * 0.8)
            d.rectangle((x0, X(44) - h, x0 + X(3.6), X(44)), fill=INCHIOSTRO if i < piene else (205, 202, 196))
        d.text((X(77), X(34)), 'silenzio' if zitto else (f'{db:.0f} db' if db is not None else '—'),
               font=p.f_piccolo, fill=PENNARELLO if zitto else INCHIOSTRO)

        # voce e lavagna
        if s['fatto'] is not None and s['durata']:
            rit = max(0, s['durata'] - s['fatto'])
            voce = f'voce −{rit:.0f} s' if rit < 100 else f'voce −{rit / 60:.0f} min'
        else:
            voce = 'voce …'
        d.text((X(12), X(50)), voce, font=p.f_testo, fill=INCHIOSTRO)
        # Special Elite non ha ✓ né ▸: la spunta si fa a mano
        o = s['ocr']
        if o.get('leggo'):
            testo = f'ocr leggo {len(o["leggo"])}…'
            if int(ora * 3) % 2 == 0:  # evidenziatore che lampeggia mentre leggo la lavagna
                d.rectangle((X(10), X(68), X(14) + p.f_testo.getlength(testo), X(81)), fill=GIALLO)
        elif o.get('ultimo_t') is not None and s['durata']:
            rit = max(0, s['durata'] - o['ultimo_t'])
            testo = f'ocr    −{rit:.0f} s' if rit < 60 else f'ocr    −{rit / 60:.0f} min'
            x = X(12) + p.f_testo.getlength('ocr ')
            d.line((x, X(74), x + X(3), X(78), x + X(9), X(69)), fill=INCHIOSTRO, width=3, joint='curve')
        else:
            testo = 'ocr …'
        if o.get('coda'):
            testo += f' · coda {o["coda"]}'
        d.text((X(12), X(67)), testo, font=p.f_testo, fill=INCHIOSTRO)

        # ultimo scatto: la miniatura con la cornice bianca, gialla per un attimo a ogni fotogramma
        acceso = ora - self.lampo < 0.8
        bx, by = X(160), X(10)
        d.rectangle((bx - X(3), by - X(3), bx + X(59), by + X(35)), fill=GIALLO if acceso else (250, 249, 246),
                    outline=INCHIOSTRO if acceso else (170, 168, 162), width=S)
        if self.mini:
            im.paste(self.mini, (bx, by))
        else:
            d.rectangle((bx, by, bx + X(56), by + X(32)), fill=(60, 60, 58))
        d.text((X(162), X(48)), f'{s["n_frame"]} scatti', font=p.f_piccolo, fill=INCHIOSTRO)

        # l'ultima frase, a pennarello
        for i, riga in enumerate(in_righe(f'«{self.frase}»' if self.frase else '', p.f_mano, X(192), 2)):
            d.text((X(12), X(86 + i * 14)), riga, font=p.f_mano, fill=PENNARELLO)

        im = im.rotate(1.1, resample=Image.BICUBIC, expand=True)
        return im.resize((im.width // S, im.height // S), Image.LANCZOS)

    def disegna(self, s):
        p, ora = self.p, s['ora']
        tela = Image.new('RGBA', (W, PH), (0, 0, 0, 0))
        ling = p.linguetta.copy()
        dl = ImageDraw.Draw(ling)
        if ora - self.lampo < 0.8:
            col = GIALLO
        elif s['fine'] or not s['ha_meta']:
            col = MATITA
        elif not s['vivo']:
            col = LED_FERMO
        else:
            col = LED if int(ora * 2) % 2 == 0 else LED_SPENTO
        dl.ellipse((9, 8, 21, 20), fill=col, outline=INCHIOSTRO)
        tela.paste(ling, (PW - SPORGE, TY), ling)
        tela.paste(p.lamiera, (0, 0))
        f = self.foglio(s)
        tela.paste(f, (12, 6), f)
        tela.paste(p.nastro, (104, -3), p.nastro)  # in alto, fra la durata e la miniatura
        tela.paste(p.nastro2, (PW - 46, PH - 34), p.nastro2)  # sull'angolo in basso, fuori dal testo
        # bordi sfumati sul grigio lamiera e non sul magenta, poi la chiave dove non c'è niente
        fondo = Image.new('RGB', tela.size, LAMIERA)
        fondo.paste(tela, mask=tela.getchannel('A'))
        out = Image.new('RGB', tela.size, CHIAVE)
        out.paste(fondo, mask=tela.getchannel('A').point(lambda a: 255 if a > 110 else 0))
        return out

    def giro(self):
        try:
            s = self.leggi()
            self.tk_img = ImageTk.PhotoImage(self.disegna(s))
            self.etichetta.config(image=self.tk_img)
            if int(s['ora']) % 5 == 0:  # qualche finestra si mette sopra: si torna in primo piano
                self.root.attributes('-topmost', True)
                self.root.lift()
        except Exception as e:  # la barra deve durare mesi: un giro storto non la ferma
            print(f'{datetime.now():%H:%M:%S} banner: {type(e).__name__}: {e}', file=sys.stderr, flush=True)
        self.root.after(250, self.giro)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('cartella')
    ap.add_argument('--chiusa', action='store_true', help='parte con il foglio dentro (solo la linguetta)')
    a = ap.parse_args()
    cart = Path(a.cartella)
    # se il registratore riprende lo schermo principale (dove sta la barra), si parte chiusi:
    # aspetta qualche secondo che meta.json dica quale schermo ha scelto
    for _ in range(20):
        area = (leggi_json(cart / 'meta.json', {}) or {}).get('schermo', {}).get('area')
        if area:
            break
        time.sleep(0.5)
    sul_registrato = bool(area) and area[0] <= 0 < area[0] + area[2] and area[1] <= 0 < area[1] + area[3]
    Barra(cart, a.chiusa or sul_registrato).root.mainloop()


if __name__ == '__main__':
    main()
