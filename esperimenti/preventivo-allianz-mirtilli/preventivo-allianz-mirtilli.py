# -*- coding: utf-8 -*-
"""Preventivo dimostrativo in stile Allianz per una collezione di mirtilli.

Il documento è un finto preventivo assicurativo: tre esemplari da collezione
(Mirtillo Sassuolo, Mirtillo Mantova, Mirtillo Modena), la stima del valore,
le garanzie, il premio. Non è emesso da Allianz e non ha valore contrattuale:
la dicitura in fondo alla seconda pagina lo dice a chiare lettere.

    python3 preventivo-allianz-mirtilli.py

Scrive `preventivo-mirtilli-allianz.pdf` accanto a questo file. Usa solo
Helvetica (il carattere dei documenti assicurativi veri) e il simbolo delle
tre arche ridisegnato in vettoriale, senza immagini esterne.
"""

import math
import os

from reportlab.lib.colors import HexColor, Color
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas

QUI = os.path.dirname(os.path.abspath(__file__))
USCITA = os.path.join(QUI, "preventivo-mirtilli-allianz.pdf")

# ── Colori ───────────────────────────────────────────────────────────────────
BLU = HexColor("#003781")        # Allianz Blue, il blu del marchio
BLU_MEDIO = HexColor("#006192")  # il secondo blu, per i dettagli
BLU_CHIARO = HexColor("#EDF2F9")  # fondo delle caselle
FILO = HexColor("#C9D3E0")       # filo sottile delle tabelle
GRIGIO = HexColor("#6C6C6C")
GRIGIO_CHIARO = HexColor("#9A9A9A")
INCHIOSTRO = HexColor("#1D1D1B")
BIANCO = HexColor("#FFFFFF")

PAGINA_W, PAGINA_H = A4
MARGINE = 46
DESTRA = PAGINA_W - MARGINE
LARGHEZZA = DESTRA - MARGINE

# ── Dati (tutti inventati) ───────────────────────────────────────────────────
NUMERO = "2026/4821-01"
EMESSO = "04.11.2026"
DECORRENZA = "01.12.2026"
SCADENZA = "30.11.2027"
VALIDO_FINO = "04.12.2026"

ESEMPLARI = [
    {
        "nome": "Mirtillo Sassuolo",
        "cultivar": "Vaccinium corymbosum 'Sassuolo'",
        "dettaglio": "esemplare unico · h 118 cm",
        "vaso": "Ø 45 cm",
        "valore": 4800.00,
        "eta": "9 anni",
        "misure": "h 118 cm · chioma 74 cm",
        "resa": "3,2 kg l'anno",
        "nota": "Cultivar selezionata in Emilia, bacca soda. Premiato alla mostra ortofrutticola di Sassuolo, 2024.",
    },
    {
        "nome": "Mirtillo Mantova",
        "cultivar": "Vaccinium corymbosum 'Mantova'",
        "dettaglio": "esemplare storico · h 146 cm",
        "vaso": "Ø 60 cm",
        "valore": 7200.00,
        "eta": "14 anni",
        "misure": "h 146 cm · chioma 96 cm",
        "resa": "5,8 kg l'anno",
        "nota": "Il pezzo forte della collezione: innesto del 2012, chioma a ombrello. Periziato il 12.10.2026.",
    },
    {
        "nome": "Mirtillo Modena",
        "cultivar": "Vaccinium corymbosum 'Modena'",
        "dettaglio": "esemplare unico · h 104 cm",
        "vaso": "Ø 40 cm",
        "valore": 3650.00,
        "eta": "7 anni",
        "misure": "h 104 cm · chioma 61 cm",
        "resa": "2,4 kg l'anno",
        "nota": "Cultivar tardiva e dolce, in ripresa dopo la potatura del 2025. Esemplare di riserva della collezione.",
    },
]

TOTALE = sum(e["valore"] for e in ESEMPLARI)

GARANZIE = [
    ("Furto, rapina ed estorsione", "sottrazione dell'esemplare o del vaso", "15.650,00", "10% · min. 250 €"),
    ("Incendio, fulmine, esplosione", "danni diretti alla pianta e al tutore", "15.650,00", "€ 150,00"),
    ("Eventi atmosferici", "grandine, vento forte, gelo tardivo", "7.825,00", "€ 150,00"),
    ("Fitopatie e muffa", "botrite, monilia, marciume radicale", "3.000,00", "15%"),
    ("Attacchi da fauna", "uccelli, vespe, cinghiali, caprioli", "2.500,00", "€ 100,00"),
    ("Trasporto a mostre e concorsi", "viaggio, allestimento, ritorno", "5.000,00", "€ 200,00"),
    ("Danni da irrigazione", "rottura dell'impianto, allagamento", "2.000,00", "€ 150,00"),
    ("Ingestione accidentale", "assaggio di ospiti, vicini e passanti", "500,00", "nessuna"),
]

CONDIZIONI = [
    "Valore a nuovo concordato: la stima del 12.10.2026 vale dodici mesi, poi serve una nuova perizia.",
    "Custodia in serra chiusa, irrigazione a goccia con riduttore di pressione e allarme perimetrale attivo.",
    "Denuncia del sinistro entro 3 giorni; per il furto, denuncia all'Autorità entro 24 ore.",
    "Franchigia per sinistro, non cumulabile, applicata una sola volta anche con più esemplari danneggiati.",
    "Restano esclusi: deperimento naturale, potature, cali di produzione, incuria e uso alimentare da parte dell'assicurato.",
    "Il preventivo è valido fino al 04.12.2026; dopo questa data tariffe e condizioni possono cambiare.",
]


# ── Attrezzi ─────────────────────────────────────────────────────────────────
def testo(c, x, y, s, font="Helvetica", size=8.4, colore=INCHIOSTRO,
          tracking=0.0, allinea="sinistra"):
    """Scrive una riga. Se allinea è «destra», x è il bordo destro."""
    w = stringWidth(s, font, size) + tracking * max(len(s) - 1, 0)
    if allinea == "destra":
        x -= w
    elif allinea == "centro":
        x -= w / 2
    t = c.beginText(x, y)
    t.setFont(font, size)
    t.setFillColor(colore)
    t.setCharSpace(tracking)
    t.textOut(s)
    c.drawText(t)
    return w


def spezza(s, font, size, larghezza):
    """Spezza un testo in righe che stanno dentro `larghezza`."""
    righe, corrente = [], ""
    for parola in s.split():
        prova = (corrente + " " + parola).strip()
        if stringWidth(prova, font, size) <= larghezza:
            corrente = prova
        else:
            if corrente:
                righe.append(corrente)
            corrente = parola
    if corrente:
        righe.append(corrente)
    return righe


def paragrafo(c, x, y, larghezza, s, font="Helvetica", size=8.4, colore=INCHIOSTRO,
              interlinea=11.6, max_righe=None):
    righe = spezza(s, font, size, larghezza)
    if max_righe:
        righe = righe[:max_righe]
    for i, riga in enumerate(righe):
        testo(c, x, y - i * interlinea, riga, font, size, colore)
    return y - (len(righe) - 1) * interlinea


def filo(c, x1, y1, x2, y2, spessore=0.5, colore=FILO):
    c.setStrokeColor(colore)
    c.setLineWidth(spessore)
    c.line(x1, y1, x2, y2)


def euro(v, decimali=2):
    s = f"{v:,.{decimali}f}"
    return "€ " + s.replace(",", "@").replace(".", ",").replace("@", ".")


def tre_arche(c, cx, cy, r, colore=BLU):
    """Il simbolo di Allianz: tre arche a spirale che chiudono un cerchio."""
    c.saveState()
    c.setFillColor(colore)
    c.setStrokeColor(colore)
    for i in range(3):
        a0 = 90 + i * 120
        a1 = a0 - 100
        p = c.beginPath()
        for k in range(61):
            t = k / 60
            a = math.radians(a0 + (a1 - a0) * t)
            x, y = cx + r * math.cos(a), cy + r * math.sin(a)
            p.moveTo(x, y) if k == 0 else p.lineTo(x, y)
        for k in range(60, -1, -1):
            t = k / 60
            a = math.radians(a0 + (a1 - a0) * t)
            spessore = r * (0.12 + 0.26 * t ** 0.8)
            ri = r - spessore
            p.lineTo(cx + ri * math.cos(a), cy + ri * math.sin(a))
        p.close()
        c.drawPath(p, stroke=0, fill=1)
    c.restoreState()


def marchio(c, x, linea, scala=1.0):
    """Simbolo + scritta «Allianz» appoggiati alla stessa linea di base."""
    r = 13 * scala
    tre_arche(c, x + r, linea + 7 * scala, r)
    testo(c, x + 2 * r + 7 * scala, linea, "Allianz", "Helvetica-Bold", 20 * scala,
          BLU, tracking=-0.9)


def testata(c, pagina, totale_pagine=3):
    """Testata delle pagine interne: marchio piccolo e numero di pagina."""
    tre_arche(c, MARGINE + 7, PAGINA_H - 44, 7)
    testo(c, MARGINE + 20, PAGINA_H - 48, "Allianz", "Helvetica-Bold", 10.5, BLU, tracking=-0.4)
    testo(c, DESTRA, PAGINA_H - 48,
          f"Preventivo n. {NUMERO}  ·  pagina {pagina} di {totale_pagine}",
          "Helvetica", 7.4, GRIGIO, allinea="destra")
    filo(c, MARGINE, PAGINA_H - 58, DESTRA, PAGINA_H - 58, 0.8, BLU)


def sezione(c, y, numero, titolo):
    """Numero in blu, titolo, filo sotto. Restituisce la y del testo che segue."""
    testo(c, MARGINE, y, numero, "Helvetica-Bold", 8.5, BLU, tracking=0.6)
    testo(c, MARGINE + 13, y, titolo, "Helvetica-Bold", 12.5, INCHIOSTRO, tracking=-0.2)
    filo(c, MARGINE, y - 7, DESTRA, y - 7, 0.6, FILO)
    return y - 20


def pie(c, pagina, totale_pagine=3):
    filo(c, MARGINE, 52, DESTRA, 52, 0.6, FILO)
    testo(c, MARGINE, 40, "Documento dimostrativo: non emesso da Allianz S.p.A., nessun valore contrattuale.",
          "Helvetica", 6.5, GRIGIO_CHIARO)
    testo(c, DESTRA, 40, f"pagina {pagina} di {totale_pagine}", "Helvetica", 6.5, GRIGIO_CHIARO,
          allinea="destra")
    testo(c, MARGINE, 30, "Impaginato da Alberto Pecchini — albertopecchini.it",
          "Helvetica", 6.5, GRIGIO_CHIARO)


# ── Pagina 1 ─────────────────────────────────────────────────────────────────
def pagina_uno(c):
    # Testata
    marchio(c, MARGINE, PAGINA_H - 48, 1.0)
    righe_testata = [
        ("Allianz S.p.A.", "Helvetica-Bold", 8.2, INCHIOSTRO),
        ("Agenzia Generale di Mantova", "Helvetica", 7.6, GRIGIO),
        ("Corso Vittorio Emanuele II 42 · 46100 Mantova", "Helvetica", 7.6, GRIGIO),
        ("Tel. 0376 12 34 56 · agenzia.mantova@allianz.it", "Helvetica", 7.6, GRIGIO),
    ]
    y = PAGINA_H - 40
    for s, f, d, col in righe_testata:
        testo(c, DESTRA, y, s, f, d, col, allinea="destra")
        y -= 10.6

    filo(c, MARGINE, PAGINA_H - 78, DESTRA, PAGINA_H - 78, 1.1, BLU)

    # Titolo
    testo(c, MARGINE, PAGINA_H - 104,
          f"PREVENTIVO N. {NUMERO}   ·   EMESSO IL {EMESSO}",
          "Helvetica-Bold", 7.2, GRIGIO, tracking=1.1)
    testo(c, MARGINE, PAGINA_H - 138, "Mirtilli da collezione,", "Helvetica-Bold", 26, INCHIOSTRO,
          tracking=-0.9)
    testo(c, MARGINE, PAGINA_H - 168, "al sicuro.", "Helvetica-Bold", 26, BLU, tracking=-0.9)
    paragrafo(
        c, MARGINE, PAGINA_H - 190, 360,
        "Stima del valore dei tre esemplari e proposta di assicurazione annuale, "
        "con decorrenza 1° dicembre 2026.",
        "Helvetica", 8.8, GRIGIO, 11.8,
    )

    # Riquadro dei dati
    top, fondo = PAGINA_H - 222, PAGINA_H - 300
    c.setFillColor(BLU_CHIARO)
    c.rect(MARGINE, fondo, LARGHEZZA, top - fondo, stroke=0, fill=1)
    c.setFillColor(BLU)
    c.rect(MARGINE, fondo, 2.4, top - fondo, stroke=0, fill=1)

    colonne = [
        ("CONTRAENTE E ASSICURATO", [
            ("Alberto Pecchini", "b"),
            ("Via dei Mirtilli 4", ""),
            ("46040 Rivalta sul Mincio (MN)", ""),
            ("Cliente n. 0004821", "grigio"),
        ]),
        ("VALIDITÀ DELL'OFFERTA", [
            (f"Decorrenza {DECORRENZA}", "b"),
            (f"Scadenza {SCADENZA}", ""),
            (f"Offerta valida fino al {VALIDO_FINO}", ""),
            ("Pagamento in 4 rate", "grigio"),
        ]),
        ("IL TUO CONSULENTE", [
            ("Giulia Ferrari", "b"),
            ("Consulente assicurativo", ""),
            ("0376 12 34 56", ""),
            ("giulia.ferrari@allianz.it", "grigio"),
        ]),
    ]
    larg = LARGHEZZA / 3
    for i, (etichetta, voci) in enumerate(colonne):
        x = MARGINE + 12 + i * larg
        if i:
            filo(c, MARGINE + i * larg, fondo + 12, MARGINE + i * larg, top - 12, 0.5, FILO)
        testo(c, x, top - 18, etichetta, "Helvetica-Bold", 6.4, BLU, tracking=0.9)
        yy = top - 33
        for s, stile in voci:
            f = "Helvetica-Bold" if stile == "b" else "Helvetica"
            col = GRIGIO_CHIARO if stile == "grigio" else INCHIOSTRO
            testo(c, x, yy, s, f, 8.0, col)
            yy -= 11.4

    # 1 · La collezione
    y = sezione(c, PAGINA_H - 328, "1", "La collezione assicurata")
    testo(c, DESTRA, PAGINA_H - 328, "PERIZIA 12.10.2026 · DOTT. AGR. ENRICO ROSSI",
          "Helvetica", 6.4, GRIGIO, tracking=0.6, allinea="destra")
    paragrafo(
        c, MARGINE, y - 2, 470,
        "Tre esemplari allevati in vaso, ognuno con la sua scheda e la sua perizia. "
        "Il valore assicurato è quello concordato in perizia, non il prezzo di mercato della bacca.",
        "Helvetica", 8.4, GRIGIO, 11.4,
    )

    # Tabella
    y = y - 42
    col_n, col_nome, col_id, col_vaso = MARGINE, MARGINE + 20, MARGINE + 154, MARGINE + 348
    intestazioni = [(col_n, "#"), (col_nome, "ESEMPLARE"), (col_id, "IDENTIFICAZIONE"),
                    (col_vaso, "VASO")]
    for x, s in intestazioni:
        testo(c, x, y, s, "Helvetica-Bold", 6.4, BLU, tracking=0.9)
    testo(c, DESTRA, y, "VALORE STIMATO", "Helvetica-Bold", 6.4, BLU, tracking=0.9, allinea="destra")
    filo(c, MARGINE, y - 5, DESTRA, y - 5, 0.7, BLU)

    y -= 22
    for i, e in enumerate(ESEMPLARI):
        if i:
            filo(c, MARGINE, y + 12, DESTRA, y + 12, 0.4, FILO)
        testo(c, col_n, y, str(i + 1), "Helvetica", 8.4, GRIGIO_CHIARO)
        testo(c, col_nome, y, e["nome"], "Helvetica-Bold", 9.2, INCHIOSTRO)
        testo(c, col_nome, y - 10, e["dettaglio"], "Helvetica", 7.0, GRIGIO)
        testo(c, col_id, y, e["cultivar"], "Helvetica", 8.2, INCHIOSTRO)
        testo(c, col_id, y - 10, "perizia 12.10.2026", "Helvetica", 7.0, GRIGIO)
        testo(c, col_vaso, y, e["vaso"], "Helvetica", 8.2, INCHIOSTRO)
        testo(c, DESTRA, y, euro(e["valore"]), "Helvetica-Bold", 9.2, INCHIOSTRO, allinea="destra")
        y -= 27

    filo(c, MARGINE, y + 12, DESTRA, y + 12, 0.7, BLU)
    testo(c, col_nome, y - 1, "Valore complessivo stimato", "Helvetica-Bold", 9.0, INCHIOSTRO)
    testo(c, DESTRA, y - 1, euro(TOTALE), "Helvetica-Bold", 12, BLU, allinea="destra")

    # 2 · Il premio
    y = sezione(c, y - 46, "2", "Il premio")
    paragrafo(
        c, MARGINE, y - 2, 460,
        "Tariffa annua sulla stima concordata, con lo sconto del 12% per il portafoglio famiglia "
        "già aperto con la polizza della casa.",
        "Helvetica", 8.4, GRIGIO, 11.4,
    )

    # Pannello del premio
    top_p, fondo_p = y - 30, y - 132
    c.setFillColor(BLU_CHIARO)
    c.rect(MARGINE, fondo_p, LARGHEZZA, top_p - fondo_p, stroke=0, fill=1)
    c.setFillColor(BLU)
    c.rect(MARGINE, fondo_p, 2.4, top_p - fondo_p, stroke=0, fill=1)

    x1, x2 = MARGINE + 14, MARGINE + 188
    testo(c, x1, top_p - 18, "PREMIO ANNUO, IMPOSTE INCLUSE", "Helvetica-Bold", 6.4, BLU, tracking=0.9)
    testo(c, x1, top_p - 52, euro(301.20), "Helvetica-Bold", 28, BLU, tracking=-1.0)
    testo(c, x1, top_p - 67, "oppure 4 rate da € 75,30, senza interessi", "Helvetica", 7.4, GRIGIO)

    filo(c, x2 - 16, fondo_p + 12, x2 - 16, top_p - 12, 0.5, FILO)
    testo(c, x2, top_p - 18, "COME SI COMPONE", "Helvetica-Bold", 6.4, BLU, tracking=0.9)
    voci = [("Premio netto scontato", "247,90"), ("Imposte 21,50%", "53,30")]
    yy = top_p - 33
    for voce, valore in voci:
        testo(c, x2, yy, voce, "Helvetica", 7.6, INCHIOSTRO)
        testo(c, x2 + 122, yy, f"€ {valore}", "Helvetica", 7.6, INCHIOSTRO, allinea="destra")
        yy -= 11.6
    filo(c, x2, yy + 5, x2 + 122, yy + 5, 0.5, FILO)
    testo(c, x2, yy - 4, "Totale annuo", "Helvetica-Bold", 7.6, INCHIOSTRO)
    testo(c, x2 + 122, yy - 4, "€ 301,20", "Helvetica-Bold", 7.6, INCHIOSTRO, allinea="destra")

    x3 = MARGINE + 376
    filo(c, x3 - 14, fondo_p + 12, x3 - 14, top_p - 12, 0.5, FILO)
    testo(c, x3, top_p - 18, "MASSIMALI", "Helvetica-Bold", 6.4, BLU, tracking=0.9)
    massimali = [("Massimale annuo", "20.000,00"), ("Massimo per sinistro", "15.650,00"),
                 ("Franchigia", "150,00")]
    yy = top_p - 33
    for voce, valore in massimali:
        testo(c, x3, yy, voce, "Helvetica", 7.6, INCHIOSTRO)
        testo(c, DESTRA - 2, yy, f"€ {valore}", "Helvetica", 7.6, INCHIOSTRO, allinea="destra")
        yy -= 11.6

    # Tre numeri in fila
    ynum = fondo_p - 30
    numeri = [
        (euro(TOTALE, 0), "valore periziato della collezione"),
        ("1,8%", "tariffa annua applicata alla stima"),
        ("−12%", "sconto portafoglio famiglia"),
    ]
    larg_n = LARGHEZZA / 3
    for i, (grande, didascalia) in enumerate(numeri):
        x = MARGINE + i * larg_n
        testo(c, x, ynum, grande, "Helvetica-Bold", 17, BLU, tracking=-0.6)
        paragrafo(c, x, ynum - 13, larg_n - 24, didascalia, "Helvetica", 7.2, GRIGIO, 9.2)

    filo(c, MARGINE, 86, DESTRA, 86, 0.4, FILO)
    testo(c, MARGINE, 73, "ALLEGATI", "Helvetica-Bold", 6.2, BLU, tracking=0.9)
    testo(c, MARGINE + 44, 73,
          "perizia del 12.10.2026 · 6 fotografie degli esemplari · certificati di provenienza · copia del documento d'identità",
          "Helvetica", 6.4, GRIGIO_CHIARO)

    pie(c, 1)


# ── Pagina 2 ─────────────────────────────────────────────────────────────────
def pagina_due(c):
    testata(c, 2)

    # 3 · Garanzie
    y = sezione(c, PAGINA_H - 84, "3", "Cosa è compreso")
    paragrafo(
        c, MARGINE, y - 2, 470,
        "Le garanzie valgono per gli esemplari in serra e durante il trasporto. "
        "Massimali e franchigie si intendono per sinistro.",
        "Helvetica", 8.4, GRIGIO, 11.4,
    )

    y = y - 32
    col_g, col_c, col_m = MARGINE, MARGINE + 168, MARGINE + 348
    for x, s in [(col_g, "GARANZIA"), (col_c, "COSA COMPRENDE"), (col_m, "MASSIMALE")]:
        testo(c, x, y, s, "Helvetica-Bold", 6.4, BLU, tracking=0.9)
    testo(c, DESTRA, y, "FRANCHIGIA", "Helvetica-Bold", 6.4, BLU, tracking=0.9, allinea="destra")
    filo(c, MARGINE, y - 5, DESTRA, y - 5, 0.7, BLU)

    y -= 18
    for i, (g, cosa, mass, franch) in enumerate(GARANZIE):
        if i % 2 == 1:
            c.setFillColor(HexColor("#F7F9FC"))
            c.rect(MARGINE, y - 6, LARGHEZZA, 17, stroke=0, fill=1)
        testo(c, col_g, y, g, "Helvetica-Bold", 8.0, INCHIOSTRO)
        testo(c, col_c, y, cosa, "Helvetica", 7.6, GRIGIO)
        testo(c, col_m, y, f"€ {mass}", "Helvetica", 7.8, INCHIOSTRO)
        testo(c, DESTRA, y, franch, "Helvetica", 7.8, INCHIOSTRO, allinea="destra")
        y -= 17
    filo(c, MARGINE, y - 4, DESTRA, y - 4, 0.6, FILO)

    # 4 · Schede
    y = sezione(c, y - 40, "4", "Gli esemplari, uno per uno")
    y -= 8
    larg_card = (LARGHEZZA - 2 * 12) / 3
    alt_card = 126
    for i, e in enumerate(ESEMPLARI):
        x = MARGINE + i * (larg_card + 12)
        c.setFillColor(BIANCO)
        c.setStrokeColor(FILO)
        c.setLineWidth(0.6)
        c.rect(x, y - alt_card, larg_card, alt_card, stroke=1, fill=1)
        c.setFillColor(BLU)
        c.rect(x, y - 3, larg_card, 3, stroke=0, fill=1)
        testo(c, x + 10, y - 20, e["nome"], "Helvetica-Bold", 9.2, INCHIOSTRO, tracking=-0.1)
        testo(c, x + larg_card - 10, y - 20, euro(e["valore"], 0), "Helvetica-Bold", 8.4, BLU,
              allinea="destra")
        testo(c, x + 10, y - 31, e["cultivar"], "Helvetica", 6.6, GRIGIO)
        filo(c, x + 10, y - 38, x + larg_card - 10, y - 38, 0.4, FILO)
        righe = [f"Età {e['eta']} · {e['resa']}", e["misure"], f"Vaso {e['vaso']}"]
        yy = y - 48
        for r in righe:
            testo(c, x + 10, yy, r, "Helvetica", 7.0, INCHIOSTRO)
            yy -= 9.6
        paragrafo(c, x + 10, y - 86, larg_card - 20, e["nota"], "Helvetica-Oblique", 6.6, GRIGIO, 8.6,
                  max_righe=4)

    # 5 · Glossario
    y = sezione(c, y - alt_card - 38, "5", "Parole che tornano")
    y -= 10
    termini = [
        ("Massimale", "La somma più alta che l'impresa paga per un sinistro o in un anno."),
        ("Franchigia", "La parte di danno che resta a carico dell'assicurato, in percentuale o a forfait."),
        ("Valore a nuovo", "Quanto costa rimpiazzare l'esemplare con uno di pari età, forma e pregio."),
        ("Perizia", "La stima firmata da un agronomo, con misure, fotografie e data."),
        ("Decorrenza", "Il giorno e l'ora da cui la copertura comincia a valere."),
        ("Sinistro", "L'evento che fa scattare la garanzia: grandine, furto, rottura dell'impianto."),
    ]
    larg_t = (LARGHEZZA - 2 * 22) / 3
    for i, (termine, definizione) in enumerate(termini):
        x = MARGINE + (i % 3) * (larg_t + 22)
        yt = y - (i // 3) * 62
        testo(c, x, yt, termine, "Helvetica-Bold", 8.2, INCHIOSTRO)
        filo(c, x, yt - 5, x + larg_t, yt - 5, 0.4, FILO)
        paragrafo(c, x, yt - 16, larg_t, definizione, "Helvetica", 7.2, GRIGIO, 9.6, max_righe=3)

    # Il parere del perito, in fondo alla pagina
    top_q, fondo_q = 188, 96
    c.setFillColor(BLU_CHIARO)
    c.rect(MARGINE, fondo_q, LARGHEZZA, top_q - fondo_q, stroke=0, fill=1)
    c.setFillColor(BLU)
    c.rect(MARGINE, fondo_q, 2.4, top_q - fondo_q, stroke=0, fill=1)
    testo(c, MARGINE + 16, top_q - 20, "IL PARERE DEL PERITO", "Helvetica-Bold", 6.4, BLU, tracking=0.9)
    paragrafo(
        c, MARGINE + 16, top_q - 38, LARGHEZZA - 40,
        "«Tre piante sane, tenute bene, con una storia ciascuna. Il Mantova è il primo da assicurare: "
        "se cade un vaso da sessanta centimetri, non lo rimpiazzi con trenta euro di vivaio.»",
        "Helvetica-Oblique", 9.0, INCHIOSTRO, 12.4, max_righe=3,
    )
    testo(c, MARGINE + 16, fondo_q + 14, "Enrico Rossi, perito agrario · perizia del 12.10.2026",
          "Helvetica", 7.0, GRIGIO)

    pie(c, 2, 3)


# ── Pagina 3 ─────────────────────────────────────────────────────────────────
def pagina_tre(c):
    testata(c, 3, 3)

    # Riepilogo dell'offerta
    top, fondo = PAGINA_H - 84, PAGINA_H - 170
    c.setFillColor(BLU_CHIARO)
    c.rect(MARGINE, fondo, LARGHEZZA, top - fondo, stroke=0, fill=1)
    c.setFillColor(BLU)
    c.rect(MARGINE, fondo, 2.4, top - fondo, stroke=0, fill=1)
    riepilogo = [
        ("PREMIO ANNUO", "€ 301,20", "4 rate da € 75,30"),
        ("MASSIMALE ANNUO", "€ 20.000,00", "€ 15.650,00 per sinistro"),
        ("DECORRENZA", "01.12.2026", "scadenza 30.11.2027"),
    ]
    larg_r = LARGHEZZA / 3
    for i, (etichetta, grande, sotto) in enumerate(riepilogo):
        x = MARGINE + 14 + i * larg_r
        if i:
            filo(c, MARGINE + i * larg_r, fondo + 14, MARGINE + i * larg_r, top - 14, 0.5, FILO)
        testo(c, x, top - 20, etichetta, "Helvetica-Bold", 6.4, BLU, tracking=0.9)
        testo(c, x, top - 48, grande, "Helvetica-Bold", 17, BLU, tracking=-0.6)
        testo(c, x, top - 62, sotto, "Helvetica", 7.2, GRIGIO)

    # 6 · Condizioni
    y = sezione(c, fondo - 40, "6", "Condizioni e avvertenze")
    y = y - 4
    colonne = [CONDIZIONI[:3], CONDIZIONI[3:]]
    larg_col = (LARGHEZZA - 24) / 2
    fine_col = y
    for i, gruppo in enumerate(colonne):
        x = MARGINE + i * (larg_col + 24)
        yy = y
        for voce in gruppo:
            c.setFillColor(BLU_MEDIO)
            c.circle(x + 2.2, yy + 2.4, 1.6, stroke=0, fill=1)
            yy = paragrafo(c, x + 10, yy, larg_col - 10, voce, "Helvetica", 7.4, INCHIOSTRO, 9.8) - 10
        fine_col = min(fine_col, yy)

    # 7 · Sinistro
    y = sezione(c, fine_col - 22, "7", "In caso di sinistro")
    y -= 10
    passi = [
        ("1", "Metti al sicuro l'esemplare", "Sposta il vaso, fotografa il danno e non potare nulla prima del sopralluogo."),
        ("2", "Chiama il numero verde", "800 000 000, attivo 24 ore su 24. Tieni a portata il numero di preventivo."),
        ("3", "Denuncia entro 3 giorni", "Dal sito o in agenzia. Per il furto serve anche la denuncia all'Autorità."),
        ("4", "Sopralluogo del perito", "Un agronomo incaricato passa entro 5 giorni lavorativi dalla denuncia."),
    ]
    larg_p = LARGHEZZA / 4
    for i, (n, titolo, testo_passo) in enumerate(passi):
        x = MARGINE + i * larg_p
        testo(c, x, y, n, "Helvetica-Bold", 15, BLU, tracking=-0.4)
        testo(c, x + 16, y, titolo, "Helvetica-Bold", 7.8, INCHIOSTRO)
        paragrafo(c, x + 16, y - 11, larg_p - 24, testo_passo, "Helvetica", 6.8, GRIGIO, 8.8)

    # 8 · Domande frequenti
    y = sezione(c, y - 84, "8", "Domande che ci fanno sempre")
    y -= 12
    domande = [
        ("Chi decide quanto valgono?",
         "Il perito agrario, con la scheda e le fotografie allegate. Il valore resta fisso per dodici mesi."),
        ("Posso portarli a una mostra?",
         "Sì: la garanzia trasporto copre andata e ritorno fino a 5.000 €, franchigia 200 €."),
        ("E se la neve sfonda la serra?",
         "Il peso della neve rientra negli eventi atmosferici: massimale 7.825 €, franchigia 150 €."),
        ("Se cambio vaso o rinvaso?",
         "Nessun problema, basta dirlo all'agenzia: la garanzia segue l'esemplare, non il vaso."),
    ]
    larg_d = (LARGHEZZA - 24) / 2
    for i, (domanda, risposta) in enumerate(domande):
        x = MARGINE + (i % 2) * (larg_d + 24)
        yd = y - (i // 2) * 62
        testo(c, x, yd, domanda, "Helvetica-Bold", 8.2, INCHIOSTRO)
        paragrafo(c, x, yd - 12, larg_d, risposta, "Helvetica", 7.2, GRIGIO, 9.6, max_righe=3)

    # Accettazione
    yf = y - 132
    testo(c, MARGINE, yf, "Accettazione dell'offerta", "Helvetica-Bold", 12.5, INCHIOSTRO, tracking=-0.2)
    filo(c, MARGINE, yf - 7, DESTRA, yf - 7, 0.6, FILO)
    testo(c, MARGINE, yf - 19,
          "Firma qui e restituisci il preventivo in agenzia, oppure rispondi alla mail del consulente.",
          "Helvetica", 7.4, GRIGIO)
    filo(c, MARGINE, yf - 44, MARGINE + 118, yf - 44, 0.7, INCHIOSTRO)
    testo(c, MARGINE, yf - 54, "data", "Helvetica", 6.6, GRIGIO)
    filo(c, MARGINE + 152, yf - 44, MARGINE + 300, yf - 44, 0.7, INCHIOSTRO)
    testo(c, MARGINE + 152, yf - 54, "firma del contraente", "Helvetica", 6.6, GRIGIO)

    x_cons = MARGINE + 344
    c.setFillColor(BLU_CHIARO)
    c.rect(x_cons, yf - 58, DESTRA - x_cons, 64, stroke=0, fill=1)
    c.setFillColor(BLU)
    c.rect(x_cons, yf - 58, 2.0, 64, stroke=0, fill=1)
    testo(c, x_cons + 12, yf - 8, "IL TUO CONSULENTE", "Helvetica-Bold", 6.4, BLU, tracking=0.9)
    testo(c, x_cons + 12, yf - 22, "Giulia Ferrari", "Helvetica-Bold", 8.4, INCHIOSTRO)
    testo(c, x_cons + 12, yf - 33, "0376 12 34 56", "Helvetica", 7.0, GRIGIO)
    testo(c, x_cons + 12, yf - 44, "giulia.ferrari@allianz.it", "Helvetica", 7.0, GRIGIO)
    testo(c, x_cons + 12, yf - 55, "Ti richiamo entro un giorno lavorativo.", "Helvetica-Oblique", 6.6, GRIGIO)

    # Nota legale
    filo(c, MARGINE, 152, DESTRA, 152, 0.6, FILO)
    paragrafo(
        c, MARGINE, 140, LARGHEZZA,
        "Documento dimostrativo ideato e impaginato da Alberto Pecchini nel novembre 2026 per un esperimento "
        "di stile: non è emesso da Allianz S.p.A., non è un'offerta assicurativa e non ha alcun valore "
        "contrattuale. Dati, importi, agenzia, persone e recapiti sono inventati.",
        "Helvetica", 6.8, GRIGIO, 9.0,
    )
    paragrafo(
        c, MARGINE, 114, LARGHEZZA,
        "«Allianz», il nome e il simbolo delle tre arche sono marchi registrati di Allianz SE, usati qui "
        "soltanto a scopo di parodia e studio grafico, senza alcun rapporto con l'azienda.",
        "Helvetica", 6.8, GRIGIO, 9.0,
    )
    testo(c, MARGINE, 84, "albertopecchini.it", "Helvetica-Bold", 6.8, BLU)
    testo(c, DESTRA, 84, "Mirtilli da collezione · preventivo dimostrativo", "Helvetica", 6.8, GRIGIO_CHIARO,
          allinea="destra")

    pie(c, 3, 3)


def anteprime():
    """Le tre pagine in PNG, per guardarle senza aprire il PDF (serve PyMuPDF)."""
    try:
        import pymupdf
    except ImportError:
        print("PyMuPDF non c'è: salto le anteprime PNG (pip install pymupdf).")
        return
    cartella = os.path.join(QUI, "anteprima")
    os.makedirs(cartella, exist_ok=True)
    documento = pymupdf.open(USCITA)
    for i, pagina in enumerate(documento):
        percorso = os.path.join(cartella, f"pagina-{i + 1}.png")
        pagina.get_pixmap(dpi=150).save(percorso)
    print(f"{documento.page_count} anteprime in {cartella}")


def principale():
    c = canvas.Canvas(USCITA, pagesize=A4)
    c.setTitle("Preventivo mirtilli da collezione — dimostrativo")
    c.setAuthor("Alberto Pecchini")
    c.setSubject("Finto preventivo assicurativo in stile Allianz")
    c.setCreator("preventivo-allianz-mirtilli.py")
    pagina_uno(c)
    c.showPage()
    pagina_due(c)
    c.showPage()
    pagina_tre(c)
    c.showPage()
    c.save()
    print(f"scritto {USCITA}")
    anteprime()


if __name__ == "__main__":
    principale()
