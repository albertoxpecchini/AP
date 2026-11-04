# -*- coding: utf-8 -*-
"""Preventivo Allianz per i mirtilli da collezione → PDF A4.

È la stampa di «Preventivo Allianz - mirtilli da collezione 04-11-2026.html»:
stesse misure (A4, margini 12/14/10 mm), stesso nero, stesso Allianz Neo.
Il PDF lo scrive ReportLab, un elemento per volta, perché in questo ambiente
non c’è un browser da cui stampare.

    python3 genera-pdf.py

I caratteri non stanno nel repository (sono del Gruppo Allianz): lo script li
cerca in `caratteri/` accanto a questo file, poi in
`C:/Users/Alberto/Documents/firma/caratteri/allianz/`, poi nella cartella
indicata da ALLIANZ_FONTS. Vanno bene sia .ttf/.otf sia i .woff2 della cartella
`firma` (i .woff2 si scompattano al volo con fontTools).
"""

import os
import re
import sys
import tempfile

from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

QUI = os.path.dirname(os.path.abspath(__file__))
USCITA = os.path.join(QUI, "Preventivo Allianz - mirtilli da collezione 04-11-2026.pdf")

# ── Misure ───────────────────────────────────────────────────────────────────
P = 72 / 25.4                 # punti per millimetro
MM = 25.4 / 72                # millimetri per punto
PAG_W, PAG_H = 210.0, 297.0   # A4
MARG_L = MARG_R = 14.0
MARG_T = 12.0
MARG_B = 10.0
LARG = PAG_W - MARG_L - MARG_R          # 182 mm
FONDO_PAGINA = PAG_H - MARG_B           # 287 mm: dove appoggia il piè di pagina

# ── Colori ───────────────────────────────────────────────────────────────────
NERO = HexColor("#000000")
GRIGIO = HexColor("#5B5B5B")
BANDA = HexColor("#D9D9D9")
RIGA = HexColor("#C2C2C2")
PANNELLO = HexColor("#ECECEC")
BIANCO = HexColor("#FFFFFF")

# ── Caratteri ────────────────────────────────────────────────────────────────
CARATTERI = {
    "light": "AllianzNeo-Light",
    "regular": "AllianzNeo-Regular",
    "bold": "AllianzNeo-Bold",
}
ESTENSIONI = (".ttf", ".otf", ".woff2")


def cartella_caratteri():
    candidate = [
        os.environ.get("ALLIANZ_FONTS"),
        os.path.join(QUI, "caratteri"),
        "C:/Users/Alberto/Documents/firma/caratteri/allianz",
        os.path.expanduser("~/Documents/firma/caratteri/allianz"),
    ]
    for c in candidate:
        if c and all(qualsiasi_peso(c, nome) for nome in CARATTERI.values()):
            return c
    return None


def qualsiasi_peso(cartella, nome):
    """Il file di quel peso, con l'estensione che c'è: ttf, otf o woff2."""
    for est in ESTENSIONI:
        percorso = os.path.join(cartella, nome + est)
        if os.path.exists(percorso):
            return percorso
    return None


def converti_woff2(percorso, cartella_lavoro):
    """ReportLab legge ttf e otf, non woff2: qui si scompatta in un ttf temporaneo."""
    try:
        from fontTools.ttLib import TTFont as FontTools
    except ImportError:
        sys.exit("Per leggere i .woff2 serve fontTools: pip install fonttools brotli")
    uscita = os.path.join(cartella_lavoro, os.path.basename(percorso).replace(".woff2", ".ttf"))
    if not os.path.exists(uscita):
        carattere = FontTools(percorso)
        carattere.flavor = None
        carattere.save(uscita)
    return uscita


def registra_caratteri():
    cartella = cartella_caratteri()
    if not cartella:
        sys.exit(
            "Non trovo Allianz Neo (Light, Regular, Bold). Metti i file in "
            f"{os.path.join(QUI, 'caratteri')} oppure indica la cartella con ALLIANZ_FONTS."
        )
    lavoro = tempfile.mkdtemp(prefix="allianz-neo-")
    registrati = {}
    for peso, nome in CARATTERI.items():
        percorso = qualsiasi_peso(cartella, nome)
        if percorso.lower().endswith(".woff2"):
            percorso = converti_woff2(percorso, lavoro)
        registrati[peso] = percorso
    pdfmetrics.registerFont(TTFont("AN", registrati["regular"]))
    pdfmetrics.registerFont(TTFont("ANB", registrati["bold"]))
    pdfmetrics.registerFont(TTFont("ANL", registrati["light"]))
    return cartella


# ── Attrezzi di disegno (tutto in millimetri, y dall’alto) ───────────────────
def xp(mm):
    return mm * P


def yp(mm):
    return (PAG_H - mm) * P


def rettangolo(c, x, y, larg, alt, colore, tratto=None, spessore=0.5):
    c.setFillColor(colore) if colore else None
    if tratto:
        c.setStrokeColor(tratto)
        c.setLineWidth(spessore)
    c.rect(xp(x), yp(y + alt), xp(larg), alt * P, stroke=1 if tratto else 0, fill=1 if colore else 0)


def filo(c, x1, y1, x2, y2, spessore=0.5, colore=RIGA):
    c.setStrokeColor(colore)
    c.setLineWidth(spessore)
    c.line(xp(x1), yp(y1), xp(x2), yp(y2))


def testo(c, x, base, s, font="AN", corpo=10, colore=NERO, allinea="sx", tracking=0.0):
    larg = stringWidth(s, font, corpo) * MM + tracking * max(len(s) - 1, 0)
    if allinea == "dx":
        x -= larg
    elif allinea == "centro":
        x -= larg / 2
    t = c.beginText(xp(x), yp(base))
    t.setFont(font, corpo)
    t.setFillColor(colore)
    if tracking:
        t.setCharSpace(tracking)
    t.textOut(s)
    c.drawText(t)
    return larg


def larghezza(testo_o_runs, corpo=None):
    """Larghezza in mm di una stringa o di una lista di run (testo, font, corpo)."""
    if isinstance(testo_o_runs, str):
        return stringWidth(testo_o_runs, "AN", corpo) * MM
    return sum(stringWidth(s, f, d) * MM for s, f, d in testo_o_runs)


def runs_di(cella, corpo):
    """Normalizza una cella: stringa, run singolo (testo, font, corpo) o lista di run."""
    if isinstance(cella, str):
        return [(cella, "AN", corpo)]
    if isinstance(cella, tuple):
        return [cella]
    return cella


def spezza_runs(runs, larg):
    """Righe di run (testo, font, corpo, spazio_prima) che stanno in `larg` mm."""
    parole, spazio_pendente, inizio = [], False, True
    for s, f, d in runs:
        for tok in re.findall(r"\s+|\S+", s):
            if tok.isspace():
                spazio_pendente = True
            else:
                parole.append((tok, f, d, False if inizio else spazio_pendente))
                inizio = False
                spazio_pendente = False
    righe, corrente, usate = [], [], 0.0
    for parola, f, d, spazio_prima in parole:
        w = stringWidth(parola, f, d) * MM
        spazio = stringWidth(" ", f, d) * MM if (corrente and spazio_prima) else 0.0
        if corrente and usate + spazio + w > larg:
            righe.append(corrente)
            corrente, usate = [(parola, f, d, False)], w
        else:
            corrente.append((parola, f, d, spazio_prima))
            usate += spazio + w
    if corrente:
        righe.append(corrente)
    return righe


def disegna_riga(c, x, base, riga, colore=NERO):
    cx = x
    primo = True
    for s, f, d, spazio_prima in riga:
        if spazio_prima and not primo:
            cx += stringWidth(" ", f, d) * MM
        testo(c, cx, base, s, f, d, colore)
        cx += stringWidth(s, f, d) * MM
        primo = False
    return cx


def paragrafo(c, x, y, larg, runs, corpo=10, interlinea=1.3, colore=NERO, base_prima=0.8):
    """Scrive un paragrafo; restituisce la y dopo l’ultima riga (in mm)."""
    righe = spezza_runs(runs, larg)
    alto = corpo * interlinea * MM
    for i, riga in enumerate(righe):
        disegna_riga(c, x, y + base_prima * corpo * MM + i * alto, riga, colore)
    return y + len(righe) * alto


def altezza_paragrafo(runs, larg, corpo=10, interlinea=1.3):
    return len(spezza_runs(runs, larg)) * corpo * interlinea * MM


def sezione(c, y, titolo):
    """Titolo di sezione col filo grigio sotto, come «Contraente ———»."""
    y += 3.4
    alto_testo = 11.5 * 1.3 * MM
    base = y + 0.78 * 11.5 * MM
    testo(c, MARG_L, base, titolo, "ANB", 11.5)
    y += alto_testo
    y += 0.8
    rettangolo(c, MARG_L, y, LARG, 1.3, RIGA)
    y += 1.3
    return y + 2.2


def tabella(c, x, y, colonne, righe, corpo=10, padding=(1.2, 1.5), testata=True):
    """Tabella coi fili come «Ambiti di rischio acquistati».

    colonne: lista di (larghezza_mm, allineamento)
    righe: lista di righe; ogni cella è una stringa o una lista di run; la prima
    riga è la testata se `testata` è True.
    """
    pad_v, pad_h = padding
    interlinea = corpo * 1.3 * MM
    asc = pdfmetrics.getAscent("AN", corpo) * MM
    yy = y
    for indice, riga in enumerate(righe):
        if indice == 0 and testata:
            pass
        # quante righe occupa ogni cella
        altezza = 0
        pezzi = []
        cx = x
        for (larg, allineato), cella in zip(colonne, riga):
            linee = spezza_runs(runs_di(cella, corpo), larg - 2 * pad_h)
            pezzi.append((cx, larg, allineato, linee))
            altezza = max(altezza, len(linee))
            cx += larg
        alt = altezza * interlinea + 2 * pad_v
        grassetto_testata = testata and indice == 0
        for cx, larg, allineato, linee in pezzi:
            for i, linee_riga in enumerate(linee):
                base = yy + pad_v + asc + i * interlinea
                if allineato == "dx":
                    w = 0.0
                    primo = True
                    for s, f, d, spazio_prima in linee_riga:
                        if spazio_prima and not primo:
                            w += stringWidth(" ", f, d) * MM
                        w += stringWidth(s, f, d) * MM
                        primo = False
                    disegna_riga(c, cx + larg - pad_h - w, base, linee_riga)
                else:
                    disegna_riga(c, cx + pad_h, base, linee_riga)
        yy += alt
        # filo sotto la riga
        if grassetto_testata:
            filo(c, x, yy, x + sum(l for l, _ in colonne), yy, 0.5, NERO)
        else:
            filo(c, x, yy, x + sum(l for l, _ in colonne), yy, 0.5, RIGA)
    return yy


def pannello(c, x, y, larg, righe, padding=(2.8, 4.5), chiave=36, gap=4, corpo=10):
    """Riquadro grigio con le coppie chiave/valore come «La tua Polizza»."""
    pad_v, pad_h = padding
    interlinea = corpo * 1.3 * MM
    larg_val = larg - 2 * pad_h - chiave - gap
    alt = 0
    pezzi = []
    for k, v, stile in righe:
        runs_k = [(k, "ANB", 12 if stile == "tot" else corpo)]
        runs_v = [(v, "ANB" if stile == "tot" else "AN", 12 if stile == "tot" else corpo)]
        linee_k = spezza_runs(runs_k, chiave)
        linee_v = spezza_runs(runs_v, larg_val)
        pezzi.append((linee_k, linee_v))
        alt += max(len(linee_k), len(linee_v))
    alt = alt * interlinea + (len(righe) - 1) * 1.4 + 2 * pad_v
    rettangolo(c, x, y, larg, alt, PANNELLO)
    yy = y + pad_v
    for linee_k, linee_v in pezzi:
        alt_riga = max(len(linee_k), len(linee_v)) * interlinea
        asc = pdfmetrics.getAscent("AN", corpo) * MM
        for i, riga in enumerate(linee_k):
            disegna_riga(c, x + pad_h, yy + asc + i * interlinea, riga)
        for i, riga in enumerate(linee_v):
            disegna_riga(c, x + pad_h + chiave + gap, yy + asc + i * interlinea, riga)
        yy += alt_riga + 1.4
    return y + alt


def casella(c, x, y, alto=3.8, spunta=False):
    c.setStrokeColor(NERO)
    c.setLineWidth(0.9)
    c.rect(xp(x), yp(y + alto), alto * P, alto * P, stroke=1, fill=0)
    if spunta:
        testo(c, x + alto / 2, y + 2.85, "✓", "ANB", 10.5, NERO, allinea="centro")


def elenco(c, x, y, larg, voci, corpo=10):
    """Elenco con le caselle da spuntare."""
    for voce, spunta in voci:
        casella(c, x + 0.5, y + 0.7, spunta=spunta)
        y = paragrafo(c, x + 7.5, y, larg - 7.5, [(voce, "AN", corpo)], corpo)
        y += 2.8
    return y


# ── Il disegno della pianta (dal disegno SVG in linea dell’HTML) ─────────────
def pianta(c, centro_x, fondo_y, altezza):
    """Il mirtillo in vaso, tratto nero, in scala: viewBox 76 × 132 unità."""
    s = altezza / 132.0

    def X(u):
        return centro_x + (u - 60) * s

    def Y(v):
        return fondo_y - (174 - v) * s

    c.saveState()
    c.setStrokeColor(NERO)
    c.setFillColor(NERO)
    c.setLineWidth(1.4 * s * P)
    c.setLineCap(1)
    c.setLineJoin(1)

    # vaso
    c.rect(xp(X(34)), yp(Y(138)), 52 * s * P, 6 * s * P, stroke=1, fill=0)
    p = c.beginPath()
    p.moveTo(xp(X(37)), yp(Y(138)))
    p.lineTo(xp(X(45)), yp(Y(168)))
    p.lineTo(xp(X(75)), yp(Y(168)))
    p.lineTo(xp(X(83)), yp(Y(138)))
    c.drawPath(p, stroke=1, fill=0)

    # fusto e rami (curve di Bézier)
    rami = [
        ((60, 132), (57, 112), (62, 98), (59, 80)),
        ((59, 112), (52, 106), (46, 103), (41, 99)),
        ((60, 100), (67, 95), (73, 92), (78, 88)),
        ((59, 92), (53, 86), (49, 80), (47, 73)),
        ((60, 86), (66, 80), (70, 76), (72, 69)),
        ((59, 80), (55, 73), (55, 67), (57, 61)),
    ]
    for (x0, y0), (x1, y1), (x2, y2), (x3, y3) in rami:
        p = c.beginPath()
        p.moveTo(xp(X(x0)), yp(Y(y0)))
        p.curveTo(xp(X(x1)), yp(Y(y1)), xp(X(x2)), yp(Y(y2)), xp(X(x3)), yp(Y(y3)))
        c.drawPath(p, stroke=1, fill=0)

    # foglie
    foglie = [
        (52, 104, 26), (66, 97, -22), (44, 95, 34), (50, 81, 50), (67, 83, -36),
        (74, 73, -26), (54, 67, 58), (63, 63, -56), (42, 88, 18), (71, 90, -14),
        (58, 58, 74), (66, 76, -48),
    ]
    for u, v, ang in foglie:
        c.saveState()
        c.translate(xp(X(u)), yp(Y(v)))
        c.rotate(-ang)
        c.ellipse(-6.2 * s * P, -2.5 * s * P, 6.2 * s * P, 2.5 * s * P, stroke=1, fill=0)
        c.restoreState()

    # bacche
    for u, v in [(47, 100), (71, 94), (62, 75), (57, 56), (76, 69), (50, 89), (66, 65)]:
        c.circle(xp(X(u)), yp(Y(v)), 3.5 * s * P, stroke=1, fill=0)

    c.restoreState()


# ── Pezzi comuni alle pagine ─────────────────────────────────────────────────
def testata(c, riga_destra, t1_chiaro="Collezione di mirtilli"):
    y = MARG_T
    # lockup come «Allianz ULTRA / Casa e Patrimonio»
    base1 = y + 0.8 * 23 * MM
    testo(c, MARG_L, base1, "Preventivo di assicurazione", "ANB", 23, NERO)
    base2 = y + 23 * MM + 1.5 + 0.8 * 13.5 * MM
    w2 = testo(c, MARG_L, base2, "Allianz Ultra Casa e Patrimonio", "ANB", 13.5)
    testo(c, MARG_L + w2, base2, " · " + t1_chiaro, "ANL", 13.5, NERO)
    # riquadro a destra, appoggiato in basso
    fine = y + 23 * MM + 1.5 + 13.5 * 1.3 * MM
    base = fine - 0.25 * 9.5 * MM
    for i, riga in enumerate(reversed(riga_destra)):
        testo(c, PAG_W - MARG_R, base - i * 9.5 * 1.3 * MM, riga, "AN", 9.5, GRIGIO, allinea="dx")
    y = fine + 3.5
    # banda grigia dell’agenzia
    alt_banda = 2 * 10 * 1.35 * MM + 2 * 2.6
    rettangolo(c, MARG_L, y, LARG, alt_banda, BANDA)
    base = y + 2.6 + 0.8 * 10 * MM
    testo(c, MARG_L + 4, base, "MANTOVA – C.SO VITTORIO EMANUELE II 42, 46100 MANTOVA", "ANB", 10)
    testo(c, MARG_L + 4, base + 10 * 1.35 * MM,
          "Telefono 0376 123456 · E-mail agenzia.mantova@allianz.it", "AN", 10)
    y += alt_banda + 4.4
    return y


def pie_pagina(c, numero, totale=3):
    base = FONDO_PAGINA - 0.9
    filo(c, MARG_L, base - 3.9 - 1.5, PAG_W - MARG_R, base - 3.9 - 1.5, 0.5, RIGA)
    x = MARG_L
    x += testo(c, x, base, f"Pagina {numero} di {totale}", "AN", 8.5) + 8
    testo(c, x, base, "Preventivo dimostrativo – non emesso da Allianz S.p.A.", "AN", 8.5)
    testo(c, PAG_W - MARG_R, base, "Allianz S.p.A. – Agenzia di Mantova", "AN", 8.5, GRIGIO, allinea="dx")


# ── Pagina 1 ─────────────────────────────────────────────────────────────────
def pagina_uno(c):
    y = testata(c, ["Stima del 12/10/2026", "Rivalta sul Mincio (MN)"])

    y = paragrafo(c, MARG_L, y, LARG,
                  [("Oggetto: ", "ANB", 10),
                   ("preventivo di assicurazione – collezione privata di mirtilli da collezione, "
                    "con decorrenza 01/12/2026.", "AN", 10)]) + 1.8

    y = paragrafo(c, MARG_L, y, LARG, [
        ("Il sottoscritto ", "AN", 10), ("ALBERTO PECCHINI", "ANB", 10),
        (", residente in Via dei Mirtilli 4 – 46040 Rivalta sul Mincio, Rodigo (MN), chiede di assicurare "
         "con la polizza ", "AN", 10), ("Allianz Ultra Casa e Patrimonio", "ANB", 10),
        (" la collezione di tre esemplari descritta qui sotto, stimata il 12/10/2026 dal perito agrario ", "AN", 10),
        ("Enrico Rossi", "ANB", 10), (".", "AN", 10),
    ]) + 1.8

    # Dati del contraente, su due colonne
    y = sezione(c, y, "Dati del contraente")
    colonna = (LARG - 8) / 2
    sinistra = [
        [("Contraente: ", "AN", 10), ("ALBERTO PECCHINI", "ANB", 10)],
        [("Codice cliente: ", "AN", 10), ("0004821", "ANB", 10)],
        [("E-mail: ", "AN", 10), ("a.pechini@albertopecchini.it", "ANB", 10)],
    ]
    destra = [
        [("Indirizzo: ", "AN", 10), ("Via dei Mirtilli 4", "ANB", 10)],
        [("C.A.P.: ", "AN", 10), ("46040", "ANB", 10), (" · Città: ", "AN", 10),
         ("RIVALTA SUL MINCIO (MN)", "ANB", 10)],
        [("Telefono: ", "AN", 10), ("0376 12 34 56", "ANB", 10)],
    ]
    y_sx = y
    for riga in sinistra:
        y_sx = paragrafo(c, MARG_L, y_sx, colonna, riga) + 0.8
    y_dx = y
    for riga in destra:
        y_dx = paragrafo(c, MARG_L + colonna + 8, y_dx, colonna, riga) + 0.8
    y = max(y_sx, y_dx)

    # La collezione assicurata
    y = sezione(c, y, "La collezione assicurata")
    colonne = [(8, "sx"), (36, "sx"), (86, "sx"), (22, "sx"), (30, "dx")]
    righe = [
        ["N.", "Esemplare", "Identificazione", "Vaso", "Valore stimato"],
        ["1", [("Mirtillo Sassuolo", "AN", 10)],
         [("Vaccinium corymbosum ’Sassuolo’ – esemplare unico, h 118 cm", "AN", 10)],
         "Ø 45 cm", "4.800,00 €"],
        ["2", [("Mirtillo Mantova", "AN", 10)],
         [("Vaccinium corymbosum ’Mantova’ – esemplare storico, h 146 cm", "AN", 10)],
         "Ø 60 cm", "7.200,00 €"],
        ["3", [("Mirtillo Modena", "AN", 10)],
         [("Vaccinium corymbosum ’Modena’ – esemplare unico, h 104 cm", "AN", 10)],
         "Ø 40 cm", "3.650,00 €"],
    ]
    # la prima cella della testata e i numeri in grassetto
    righe[0] = [("N.", "ANB", 10), ("Esemplare", "ANB", 10), ("Identificazione", "ANB", 10),
                ("Vaso", "ANB", 10), ("Valore stimato", "ANB", 10)]
    for r in righe[1:]:
        r[0] = [(r[0], "ANB", 10)]
    y = tabella(c, MARG_L, y, colonne, righe, corpo=10) + 1.0

    # riga del totale, col filo nero sopra
    filo(c, MARG_L, y, MARG_L + LARG, y, 0.5, NERO)
    base = y + 1.8 + 0.8 * 12 * MM
    testo(c, MARG_L + 8 + 1.5, base, "Valore complessivo stimato", "ANB", 10)
    testo(c, MARG_L + LARG - 1.5, base, "15.650,00 €", "ANB", 12, allinea="dx")
    y = base + 0.2 * 12 * MM + 1.2

    # Stima del valore
    y = sezione(c, y, "Stima del valore")
    y = pannello(c, MARG_L, y, LARG, [
        ("Perito", "Dott. agr. ENRICO ROSSI – perizia del 12/10/2026, valida 12 mesi", ""),
        ("Criterio", "Valore a nuovo concordato (non il prezzo di mercato della bacca)", ""),
        ("Custodia dichiarata",
         "Serra chiusa, irrigazione a goccia con riduttore di pressione, allarme perimetrale", ""),
    ]) + 1.0

    # Il premio
    y = sezione(c, y, "Il premio")
    y = pannello(c, MARG_L, y, LARG, [
        ("Tariffa", "1,80% sul valore assicurato: 281,70 € – sconto portafoglio famiglia 12% (−33,80 €)", ""),
        ("Premio netto", "247,90 €", ""),
        ("Imposte e contributi", "53,30 € (21,50%)", ""),
        ("Totale annuo", "301,20 €", "tot"),
        ("Pagamento", "4 rate da 75,30 € senza interessi", ""),
    ]) + 2.5

    y = paragrafo(c, MARG_L, y, LARG, [
        ("Massimale annuo 20.000,00 €, massimo per sinistro 15.650,00 €, franchigia 150,00 €. "
         "Il premio è indicativo e diventa definitivo con l’emissione della polizza.", "AN", 8.5)
    ], corpo=8.5, colore=GRIGIO) + 0

    pie_pagina(c, 1)
    return y


# ── Pagina 2 ─────────────────────────────────────────────────────────────────
def pagina_due(c):
    y = testata(c, ["Decorrenza 01/12/2026", "scadenza 30/11/2027"])

    y = sezione(c, y, "Garanzie comprese")
    colonne = [(46, "sx"), (88, "sx"), (22, "sx"), (26, "dx")]
    righe = [
        [("Garanzia", "ANB", 9.5), ("Cosa comprende", "ANB", 9.5), ("Massimale", "ANB", 9.5),
         ("Franchigia", "ANB", 9.5)],
    ]
    for g, cosa, mass, franch in [
        ("Furto, rapina ed estorsione", "Sottrazione dell’esemplare o del vaso", "15.650,00 €", "10% · min. 250 €"),
        ("Incendio, fulmine, esplosione", "Danni diretti alla pianta e al tutore", "15.650,00 €", "150,00 €"),
        ("Eventi atmosferici", "Grandine, vento, gelo, peso della neve", "7.825,00 €", "150,00 €"),
        ("Fitopatie e muffa", "Botrite, monilia, marciume radicale", "3.000,00 €", "15%"),
        ("Attacchi da fauna", "Uccelli, vespe, cinghiali", "2.500,00 €", "100,00 €"),
        ("Trasporto a mostre e concorsi", "Viaggio, allestimento, ritorno", "5.000,00 €", "200,00 €"),
        ("Danni da irrigazione", "Rottura impianto, allagamento", "2.000,00 €", "150,00 €"),
        ("Ingestione accidentale", "Assaggio di ospiti e passanti", "500,00 €", "nessuna"),
    ]:
        righe.append([[(g, "AN", 9.5)], [(cosa, "AN", 9.5)], [(mass, "AN", 9.5)], [(franch, "AN", 9.5)]])
    y = tabella(c, MARG_L, y, colonne, righe, corpo=9.5, padding=(1.05, 1.5))

    y = sezione(c, y, "Esclusioni e limiti")
    y = elenco(c, MARG_L, y, LARG, [
        ("Deperimento naturale, potature e cali di produzione.", False),
        ("Uso alimentare degli esemplari da parte dell’assicurato e dei suoi familiari.", False),
        ("Danni da incuria, mancata irrigazione o impianti non a norma.", False),
        ("Smarrimento non denunciato all’Autorità entro 24 ore.", False),
        ("Collezioni lasciate in serra aperta o in un luogo non dichiarato in polizza.", False),
    ])

    y = sezione(c, y, "Schede degli esemplari")
    y += 0.5
    larg_scheda, gap_scheda, lato = 52.0, 5.0, 52.0
    inizio = MARG_L + (LARG - (3 * larg_scheda + 2 * gap_scheda)) / 2
    schede = [
        ("1", 0.80, [("Mirtillo Sassuolo", "ANB", 8.6), (" – ’Sassuolo’, 9 anni, h 118 cm, vaso Ø 45 cm, "
                                                          "3,2 kg l’anno.", "AN", 8.6)]),
        ("2", 0.92, [("Mirtillo Mantova", "ANB", 8.6), (" – ’Mantova’, 14 anni, h 146 cm, vaso Ø 60 cm, "
                                                         "5,8 kg l’anno.", "AN", 8.6)]),
        ("3", 0.74, [("Mirtillo Modena", "ANB", 8.6), (" – ’Modena’, 7 anni, h 104 cm, vaso Ø 40 cm, "
                                                        "2,4 kg l’anno.", "AN", 8.6)]),
    ]
    for i, (numero, quota, didascalia) in enumerate(schede):
        x = inizio + i * (larg_scheda + gap_scheda)
        rettangolo(c, x, y, larg_scheda, lato, PANNELLO)
        pianta(c, x + larg_scheda / 2, y + lato - 4, lato * quota)
        rettangolo(c, x, y, 8.5, 4.2, NERO)
        testo(c, x + 2, y + 3.0, numero, "ANB", 8.5, BIANCO)
        y_did = paragrafo(c, x, y + lato + 1.2, larg_scheda, didascalia, corpo=8.6, interlinea=1.3)
    y = y_did + 3.0
    testo(c, MARG_L + LARG / 2, y, "Disegni in scala indicativa: l’altezza della pianta rispetto al vaso "
                                   "segue le misure della perizia.", "AN", 8.6, GRIGIO, allinea="centro")

    pie_pagina(c, 2)
    return y


# ── Pagina 3 ─────────────────────────────────────────────────────────────────
def pagina_tre(c):
    y = testata(c, ["Offerta valida fino al", "04/12/2026"])

    y = sezione(c, y, "In caso di sinistro")
    passi = [
        ("1", "Metti al sicuro l’esemplare: sposta il vaso, fotografa il danno e non potare nulla prima del sopralluogo."),
        ("2", "Chiama il numero verde 800 000 000, attivo 24 ore su 24, e tieni a portata il numero di preventivo."),
        ("3", "Denuncia entro 3 giorni dal sito o in agenzia; per il furto serve anche la denuncia all’Autorità entro 24 ore."),
        ("4", "Un agronomo incaricato passa entro 5 giorni lavorativi dalla denuncia per la verifica dei danni."),
    ]
    colonna = (LARG - 8) / 2
    for riga_i in range(2):
        coppia = passi[riga_i * 2: riga_i * 2 + 2]
        alto = 0.0
        for i, (n, testo_passo) in enumerate(coppia):
            x = MARG_L + i * (colonna + 8)
            alto = max(alto, altezza_paragrafo([(testo_passo, "AN", 10)], colonna - 8.5))
        for i, (n, testo_passo) in enumerate(coppia):
            x = MARG_L + i * (colonna + 8)
            base = y + 0.8 * 10 * MM
            testo(c, x, base, n, "ANB", 12)
            paragrafo(c, x + 8.5, y, colonna - 8.5, [(testo_passo, "AN", 10)])
        y += alto + 3.0
    y -= 3.0

    y = sezione(c, y, "Documenti allegati")
    y = elenco(c, MARG_L, y, LARG, [
        ("Allegato A – perizia del 12/10/2026 (3 schede e 6 fotografie degli esemplari)", True),
        ("Allegato B – certificati di provenienza dei tre esemplari", True),
        ("Copia del documento d’identità del contraente", True),
    ])
    casella(c, MARG_L + 0.5, y + 0.7)
    base = y + 0.8 * 10 * MM
    x_altro = MARG_L + 7.5 + testo(c, MARG_L + 7.5, base, "Altro:", "AN", 10) + 1
    filo(c, x_altro, base + 0.4, MARG_L + 110, base + 0.4, 0.75, NERO)
    y += 10 * 1.3 * MM + 2.8

    y = sezione(c, y, "Recapiti del consulente")
    sinistra = [
        [("Nome e cognome: ", "AN", 10), ("GIULIA FERRARI", "ANB", 10)],
        [("Agenzia: ", "AN", 10), ("MANTOVA", "ANB", 10)],
        [("Telefono: ", "AN", 10), ("0376 12 34 56", "ANB", 10)],
    ]
    destra = [
        [("E-mail: ", "AN", 10), ("giulia.ferrari@allianz.it", "ANB", 10)],
        [("Orari: ", "AN", 10), ("LUN–VEN 9:00–12:30, 14:30–18:00", "ANB", 10)],
        [("Risposta: ", "AN", 10), ("entro un giorno lavorativo", "ANB", 10)],
    ]
    y_sx = y
    for riga in sinistra:
        y_sx = paragrafo(c, MARG_L, y_sx, colonna, riga) + 0.8
    y_dx = y
    for riga in destra:
        y_dx = paragrafo(c, MARG_L + colonna + 8, y_dx, colonna, riga) + 0.8
    y = max(y_sx, y_dx)

    y = sezione(c, y, "Dichiarazioni e firma")
    y = paragrafo(c, MARG_L, y, LARG, [
        ("Il contraente dichiara di aver letto il presente preventivo, di conoscere le condizioni di "
         "assicurazione e di autorizzare il trattamento dei dati personali ai fini della proposta. "
         "L’offerta si intende accettata con la firma qui sotto, entro il 04/12/2026.", "AN", 10),
    ]) + 1.8

    # firma: luogo e data a sinistra, linea della firma a destra
    y_firma = y + 7
    testo(c, MARG_L, y_firma + 0.8 * 10 * MM, "Luogo e data", "ANB", 10)
    testo(c, MARG_L + colonna + 10, y_firma + 0.8 * 10 * MM, "Firma del contraente", "ANB", 10)
    base_data = y_firma + 3 + 10 * MM + 24
    testo(c, MARG_L, base_data, "Rivalta sul Mincio, 04/11/2026", "AN", 10)
    filo(c, MARG_L + colonna + 10, base_data, MARG_L + colonna + 10 + 72, base_data, 0.75, NERO)
    y = base_data + 6

    # nota legale
    y += 1.0
    y = paragrafo(c, MARG_L, y, LARG, [
        ("Documento dimostrativo ideato e impaginato da Alberto Pecchini nel novembre 2026, sul modello "
         "grafico della «Denuncia sinistro abitazione e beni» del Gruppo Allianz. Non è emesso da Allianz "
         "S.p.A., non è un’offerta assicurativa e non ha alcun valore contrattuale: dati, importi, agenzia, "
         "persone e recapiti sono inventati.", "AN", 8.5)
    ], corpo=8.5, colore=GRIGIO) + 1.6
    y = paragrafo(c, MARG_L, y, LARG, [
        ("«Allianz», il nome e il simbolo delle tre arche sono marchi registrati di Allianz SE, usati qui "
         "soltanto a scopo di parodia e studio grafico, senza alcun rapporto con l’azienda.", "AN", 8.5)
    ], corpo=8.5, colore=GRIGIO)

    pie_pagina(c, 3)
    return y


def principale():
    cartella = registra_caratteri()
    c = canvas.Canvas(USCITA, pagesize=(PAG_W * P, PAG_H * P))
    c.setTitle("Preventivo Allianz – mirtilli da collezione, 04/11/2026")
    c.setAuthor("Alberto Pecchini")
    c.setSubject("Finto preventivo assicurativo in stile Allianz")
    c.setCreator("genera-pdf.py")
    for funzione, numero in ((pagina_uno, 1), (pagina_due, 2), (pagina_tre, 3)):
        c.setFillColor(NERO)
        fondo = funzione(c)
        print(f"pagina {numero}: contenuto fino a {fondo:.1f} mm "
              f"(il piè di pagina comincia a {FONDO_PAGINA - 6.9:.1f} mm)")
        if fondo > FONDO_PAGINA - 7:
            print("  attenzione: il contenuto tocca il piè di pagina")
        c.showPage()
    c.save()
    print(f"scritto {USCITA} (caratteri da {cartella})")


if __name__ == "__main__":
    principale()
