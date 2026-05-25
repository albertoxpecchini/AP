# -*- coding: utf-8 -*-
"""
Genera il CV PDF di Alberto Pecchini a partire dai contenuti del sito.
Output: public/cv-alberto-pecchini.pdf  (linkato dal pulsante "Scarica il CV").
Palette coerente con il sito (blu #0066cc).
"""
import os
from io import BytesIO

from PIL import Image, ImageDraw, ImageOps

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.enums import TA_LEFT, TA_JUSTIFY
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table,
    TableStyle, Image as RLImage, FrameBreak, KeepInFrame, Flowable,
    NextPageTemplate, PageBreak,
)
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PHOTO = os.path.join(ROOT, "public", "alberto-pecchini.jpg")
OUT = os.path.join(ROOT, "public", "cv-alberto-pecchini.pdf")

# ---------------------------------------------------------------- palette
NAVY = HexColor("#0a3a66")     # sidebar profonda
BLUE = HexColor("#0066cc")     # blu del sito (accento)
BLUE_SOFT = HexColor("#e7f0fb")
INK = HexColor("#1f2933")      # testo principale
MUTED = HexColor("#5b6b7b")    # testo secondario
LINE = HexColor("#d9e2ec")
WHITE = HexColor("#ffffff")
SIDE_MUTED = HexColor("#bcd4ee")
SIDE_LINE = Color(1, 1, 1, 0.22)

# ---------------------------------------------------------------- font
def reg_font():
    """Usa DejaVu se presente (glifi completi), altrimenti Helvetica."""
    candidates = [
        ("C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/segoeuib.ttf",
         "C:/Windows/Fonts/segoeuisl.ttf"),
    ]
    for reg, bold, light in candidates:
        if os.path.exists(reg) and os.path.exists(bold):
            pdfmetrics.registerFont(TTFont("Body", reg))
            pdfmetrics.registerFont(TTFont("Body-Bold", bold))
            pdfmetrics.registerFont(TTFont("Body-Light",
                                            light if os.path.exists(light) else reg))
            return "Body", "Body-Bold", "Body-Light"
    return "Helvetica", "Helvetica-Bold", "Helvetica"

F, FB, FL = reg_font()

# ---------------------------------------------------------------- geometry
PAGE_W, PAGE_H = A4
SIDE_W = 66 * mm
PAD = 9 * mm

# ---------------------------------------------------------------- circular photo
def circular_photo(path, size_px=600):
    img = Image.open(path).convert("RGB")
    img = ImageOps.exif_transpose(img)
    # crop centrale quadrato (volto un po' in alto)
    w, h = img.size
    side = min(w, h)
    left = (w - side) // 2
    top = int((h - side) * 0.32)
    img = img.crop((left, top, left + side, top + side)).resize((size_px, size_px), Image.LANCZOS)
    mask = Image.new("L", (size_px, size_px), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size_px, size_px), fill=255)
    out = Image.new("RGBA", (size_px, size_px), (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    buf = BytesIO()
    out.save(buf, format="PNG")
    buf.seek(0)
    return buf

# ---------------------------------------------------------------- styles
def P(text, font=F, size=9.2, leading=13.5, color=INK, space=0,
      align=TA_LEFT, tracking=0):
    style = ParagraphStyle(
        "p", fontName=font, fontSize=size, leading=leading, textColor=color,
        spaceAfter=space, alignment=align, wordSpace=0,
    )
    if tracking:
        # reportlab non ha letter-spacing nativo: simulato con tag <font> non serve
        pass
    return Paragraph(text, style)

# Stili riutilizzabili
st_name = ParagraphStyle("name", fontName=FB, fontSize=26, leading=28, textColor=INK)
st_role = ParagraphStyle("role", fontName=F, fontSize=11.5, leading=15, textColor=BLUE,
                         spaceBefore=2)
st_section = ParagraphStyle("sec", fontName=FB, fontSize=12.5, leading=15, textColor=NAVY,
                            spaceBefore=2, spaceAfter=2)
st_kicker = ParagraphStyle("kick", fontName=FB, fontSize=8, leading=11, textColor=BLUE)
st_body = ParagraphStyle("body", fontName=F, fontSize=9.6, leading=14.5, textColor=INK,
                         alignment=TA_JUSTIFY, spaceAfter=6)
st_item_t = ParagraphStyle("it", fontName=FB, fontSize=10.5, leading=13.5, textColor=INK)
st_item_r = ParagraphStyle("ir", fontName=FB, fontSize=9.2, leading=12.5, textColor=BLUE)
st_item_d = ParagraphStyle("id", fontName=F, fontSize=9.2, leading=13.5, textColor=MUTED,
                           alignment=TA_JUSTIFY)
st_period = ParagraphStyle("pe", fontName=FB, fontSize=7.6, leading=10, textColor=MUTED)

# sidebar styles
st_side_h = ParagraphStyle("sh", fontName=FB, fontSize=9.5, leading=12, textColor=WHITE)
st_side_t = ParagraphStyle("st", fontName=F, fontSize=8.6, leading=12.5, textColor=WHITE)
st_side_m = ParagraphStyle("sm", fontName=F, fontSize=8.2, leading=12, textColor=SIDE_MUTED)
st_side_chip = ParagraphStyle("sc", fontName=F, fontSize=8.2, leading=11, textColor=WHITE)

# ---------------------------------------------------------------- helpers
class HR(Flowable):
    def __init__(self, width, color=LINE, thickness=0.8, pad=0):
        super().__init__()
        self.width = width; self.color = color; self.thickness = thickness; self.pad = pad
    def wrap(self, *a):
        return (self.width, self.thickness + self.pad)
    def draw(self):
        self.canv.setStrokeColor(self.color)
        self.canv.setLineWidth(self.thickness)
        self.canv.line(0, self.pad/2, self.width, self.pad/2)

class Bullet(Flowable):
    """Quadratino accento prima di un titolo di sezione."""
    def __init__(self, size=4, color=BLUE):
        super().__init__(); self.size = size; self.color = color
    def wrap(self, *a):
        return (self.size, self.size)
    def draw(self):
        self.canv.setFillColor(self.color)
        self.canv.rect(0, 0, self.size, self.size, fill=1, stroke=0)

def section_title(text, width, color_line=LINE, color_text=NAVY):
    """Titolo di sezione nella colonna principale con quadratino + linea."""
    sq = Bullet(5, BLUE)
    t = Paragraph(text.upper(), ParagraphStyle(
        "sect", fontName=FB, fontSize=11, leading=13, textColor=color_text))
    tbl = Table([[sq, t]], colWidths=[8, width - 8])
    tbl.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (1, 0), (1, 0), 0),
        ("LEFTPADDING", (1, 0), (1, 0), 6),
    ]))
    return tbl

def side_title(text):
    return Paragraph(text.upper(), ParagraphStyle(
        "sidet", fontName=FB, fontSize=9.5, leading=12, textColor=WHITE,
        spaceAfter=4))

class ChipFlow(Flowable):
    """Pillole (tag) che vanno a capo automaticamente sulla larghezza data."""
    def __init__(self, items, max_width, font=F, size=8.2, fg=BLUE, bg=BLUE_SOFT,
                 border=None, hpad=7, vpad=3.4, gap_x=5, gap_y=5, radius=6):
        super().__init__()
        self.items = items
        self.max_width = max_width
        self.font = font; self.size = size
        self.fg = fg; self.bg = bg; self.border = border
        self.hpad = hpad; self.vpad = vpad
        self.gap_x = gap_x; self.gap_y = gap_y; self.radius = radius
        self._lines = None; self._h = 0

    def _layout(self):
        if self._lines is not None:
            return
        ch = self.size + 2 * self.vpad
        lines = []
        cur = []; cur_w = 0
        for it in self.items:
            w = pdfmetrics.stringWidth(it, self.font, self.size) + 2 * self.hpad
            add = w if not cur else w + self.gap_x
            if cur and cur_w + add > self.max_width:
                lines.append(cur); cur = []; cur_w = 0
                add = w
            cur.append((it, w)); cur_w += add
        if cur:
            lines.append(cur)
        self._lines = lines
        self._ch = ch
        self._h = len(lines) * ch + (len(lines) - 1) * self.gap_y if lines else 0

    def wrap(self, availWidth, availHeight):
        self._layout()
        return (self.max_width, self._h)

    def draw(self):
        self._layout()
        c = self.canv
        ch = self._ch
        y = self._h - ch
        for line in self._lines:
            x = 0
            for text, w in line:
                c.setFillColor(self.bg)
                if self.border is not None:
                    c.setStrokeColor(self.border); c.setLineWidth(0.6)
                    c.roundRect(x, y, w, ch, self.radius, fill=1, stroke=1)
                else:
                    c.roundRect(x, y, w, ch, self.radius, fill=1, stroke=0)
                c.setFillColor(self.fg)
                c.setFont(self.font, self.size)
                c.drawString(x + self.hpad, y + self.vpad + 1.2, text)
                x += w + self.gap_x
            y -= ch + self.gap_y

# ---------------------------------------------------------------- content data
PROFILE = (
    "Studente del quinto anno dell'indirizzo CAT (Costruzioni, Ambiente e Territorio) "
    "e <b>front-end developer & designer</b> autodidatta. Unisco la formazione tecnica "
    "su progettazione e disegno con la passione per il web, costruendo interfacce moderne, "
    "veloci e curate nei dettagli. Lavoro con <b>React, Next.js, TypeScript, Tailwind CSS</b> "
    "e animazioni <b>GSAP</b>, con un'attenzione particolare alla user experience, alla "
    "tipografia e al design minimalista. La mia missione è trasformare le idee in "
    "esperienze digitali memorabili, pulite ed eleganti su ogni schermo. "
    "Integro l'intelligenza artificiale nel mio workflow di sviluppo — "
    "<b>Claude Code, Codex, GitHub Copilot e Gemini</b> — e padroneggio a livello "
    "avanzato strumenti di AI generativa come <b>Nano Banana Pro, DeepSeek e Grok</b>."
)

SKILLS = [
    ("Sviluppo front-end", ["HTML5", "CSS3", "JavaScript", "TypeScript", "React",
                            "Next.js", "Tailwind CSS", "GSAP"]),
    ("Design & UX", ["UI/UX Design", "Figma", "Design System", "Bootstrap Italia",
                     "Responsive Design"]),
    ("AI & sviluppo assistito", ["Claude Code", "Codex", "GitHub Copilot", "Gemini"]),
    ("AI generativa · livello avanzato", ["Nano Banana Pro", "DeepSeek", "Grok"]),
    ("Strumenti & Workflow", ["Git & GitHub", "Vite", "Vercel", "VS Code",
                              "PowerShell", "LaTeX / Overleaf"]),
    ("Sistemi operativi", ["iOS", "Windows", "Linux Ubuntu"]),
    ("Windows & IT Support", ["Troubleshooting PC", "Setup hardware & reti",
                              "Ottimizzazione Windows", "File system 2.5 TB",
                              "Malware removal", "Gestione periferiche"]),
    ("Multimedia & Content", ["Fotografia commerciale", "DaVinci Resolve",
                               "Adobe Premiere Pro", "Canva", "iPhone 16 Pro"]),
    ("Area tecnica CAT", ["Disegno tecnico / CAD", "AutoCAD", "Topografia",
                          "Progettazione edilizia", "Estimo",
                          "Excel avanzato", "Word avanzato"]),
]

EDUCATION = [
    ("2021 — oggi", "Istituto Tecnico Tecnologico «Carlo d'Arco» — Mantova",
     "Diploma CAT · Costruzioni, Ambiente e Territorio · Classe 5T",
     "Percorso quinquennale di indirizzo tecnico-tecnologico. Materie principali: "
     "progettazione architettonica e disegno tecnico (AutoCAD), topografia e rilievo "
     "strumentale, estimo e valutazione immobiliare, gestione del cantiere, fisica "
     "tecnica, matematica e inglese tecnico. Codice meccanografico MNTL009017."),
    ("11 — 25 ago 2024", "CES IELTS Test Centre — Dublino, Irlanda",
     "General English Intensive · 26 lezioni/settimana · Livello C1",
     "Corso intensivo di inglese generale al centro CES di Dame Court (Dublino 2): "
     "quattro settimane di full immersion con focus su speaking, writing, reading e "
     "comprensione orale a livello avanzato. Superamento dell'esame IELTS al "
     "termine del corso."),
    ("2018 — 2021", "Scuola secondaria di primo grado — Mantova",
     "Istituto Redentore · Fondazione «Casa dello studente Beato Contardo Ferrini»",
     "Percorso triennale con base solida in italiano, matematica, storia, scienze e "
     "lingua inglese. Diploma conseguito con profitto."),
]

EXPERIENCE = [
    ("2019 — oggi", "Vendite online — Vinted & Subito",
     "E-commerce · Fotografia commerciale · Customer care",
     "Gestione autonoma dell'intero ciclo di vendita su Vinted e Subito: valutazione "
     "del prodotto, definizione del prezzo di mercato, fotografia con Canon EOS 4000D "
     "e iPhone 16 Pro, pubblicazione degli annunci, comunicazione con i potenziali "
     "acquirenti, trattativa, spedizione e gestione dei feedback. Prima operazione "
     "dicembre 2019; attività personale sistematica dall'autunno 2024. Categorie: "
     "abbigliamento, collezionabili cinematografici, dispositivi tech.",
     "vinted.it/member/237170304"),
    ("continuativo", "Cascina di famiglia — Rivalta sul Mincio",
     "Collaboratore agricolo · Logistica · Coordinamento operativo",
     "Collaborazione continuativa nell'attività agricola familiare. Attività: cura e "
     "manutenzione delle piante (annaffiamento, potatura di diverse tipologie), "
     "trasporto materiali su trattore con rimorchio, raccolta del fieno da prato "
     "stabile, coordinamento delle operazioni con il team, supporto logistico negli "
     "spostamenti. Gestione autonoma delle attrezzature agricole e risoluzione di "
     "problemi operativi sul campo.",
     None),
    ("apr 2026", "Rivalta sul Mincio — Sito web",
     "Web design & sviluppo front-end",
     "Progettazione e sviluppo del sito web istituzionale e turistico per la "
     "località di Rivalta sul Mincio. Design editoriale minimalista con tipografia "
     "curata, palette cromatica calda e animazioni avanzate tramite GSAP "
     "ScrollTrigger (pinning, stacking, scrubbing parallax). Griglie bento gapless "
     "e composizione image-led per una narrazione visiva immersiva. "
     "Stack: Next.js, TypeScript, GSAP, Tailwind CSS.",
     "rivaltasulmincio.it"),
    ("apr 2026", "Cascina Fontana — Sito web",
     "Web design & sviluppo front-end",
     "Progettazione e sviluppo del sito web ufficiale di Cascina Fontana. Analisi "
     "delle esigenze del cliente, definizione dell'architettura dell'informazione e "
     "realizzazione di un'interfaccia responsive curata nel design, ottimizzata per "
     "la presentazione dei prodotti e servizi aziendali. Collaborazione diretta con "
     "il cliente per la definizione dei contenuti. Stack: React, TypeScript, Tailwind CSS.",
     "cascinafontana.xyz"),
    ("2026", "Sito portfolio personale",
     "Design & sviluppo front-end",
     "Ideazione e realizzazione del portfolio personale basato sul Design System "
     "Bootstrap Italia: architettura a sezioni (profilo, competenze, curriculum, "
     "progetti), animazioni in entrata, piena accessibilità (skiplinks, gestione "
     "focus, prefers-reduced-motion) e deploy continuo su Vercel.",
     "albertopecchini.it"),
]

VOLUNTEER = [
    ("2024 — 2025", "Grest Parrocchiale · Parrocchia SS. Donato e Vigilio Martiri",
     "Animatore volontario · Rivalta sul Mincio · 6 settimane/anno · 2 edizioni",
     "Servizio di animazione volontaria durante il Grest estivo parrocchiale — due "
     "edizioni consecutive (estate 2024 e 2025), per un totale di dodici settimane. "
     "Responsabilità diretta su gruppi di bambini di diverse fasce d'età. "
     "Pianificazione e conduzione di giochi, laboratori e attività educative. "
     "Gestione delle dinamiche di gruppo, mediazione, comunicazione con i genitori. "
     "Referente: don Andrea Grandi."),
    ("estate 2024", "CRED · Scuola Secondaria di Rodigo",
     "Supporto educativo volontario · Comune di Rodigo · 2 settimane",
     "Supporto educativo e animazione durante il Centro Ricreativo Estivo Diurno "
     "del Comune di Rodigo. Affiancamento agli educatori nella conduzione delle "
     "attività, gestione dei gruppi e supporto individualizzato agli alunni."),
    ("2024 — 2025", "Festa del Pesce e del Luccio · Associazione Rivaltese",
     "Volontario logistico · 2 edizioni",
     "Supporto logistico e organizzativo durante la manifestazione gastronomica "
     "locale. Allestimento, gestione dei flussi di pubblico, supporto operativo "
     "allo staff durante lo svolgimento dell'evento."),
]

LANGS = [("Italiano", "Madrelingua", 1.0), ("Inglese", "C1 · IELTS", 0.85)]
LICENSE = ["A1", "B"]
VEHICLES = ["Trattori", "Muletti", "Moto", "Furgoni", "Auto"]
SOFT_SKILLS = ["Cura del dettaglio", "Precisione", "Problem solving", "Autonomia",
               "Creatività", "Apprendimento rapido", "Coordinamento", "Affidabilità",
               "Customer care", "Animazione gruppi"]
INTERNATIONAL = ["Dublino · IELTS C1", "Parigi & Normandia", "Edimburgo"]
HOBBY = ["Moto", "Sport", "Videogiochi", "Musica", "Viaggi", "Tecnologia"]
PASSIONI = ["Web design", "Innovazione digitale", "Fotografia", "Motori",
            "Cinema", "Outdoor"]
AVAILABILITY = ["Stage e collaborazioni", "Progetti freelance", "Lavoro da remoto"]

# ---------------------------------------------------------------- doc / frames
def on_page_first(canvas, doc):
    # sfondo sidebar a tutta altezza
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, SIDE_W, PAGE_H, fill=1, stroke=0)
    # sottile barra accento sul bordo destro della sidebar
    canvas.setFillColor(BLUE)
    canvas.rect(SIDE_W - 1.4 * mm, 0, 1.4 * mm, PAGE_H, fill=1, stroke=0)

def on_page_later(canvas, doc):
    # pagine successive: striscia brand sottile a sinistra per continuità
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, 7 * mm, PAGE_H, fill=1, stroke=0)
    canvas.setFillColor(BLUE)
    canvas.rect(7 * mm, 0, 1.2 * mm, PAGE_H, fill=1, stroke=0)
    # intestazione di continuità
    canvas.setFillColor(MUTED)
    canvas.setFont(FB, 8)
    canvas.drawString(SIDE_W + 10 * mm, PAGE_H - 12 * mm, "ALBERTO PECCHINI")
    canvas.setFont(F, 8)
    canvas.drawRightString(PAGE_W - 12 * mm, PAGE_H - 12 * mm, "Curriculum Vitae")
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.7)
    canvas.line(SIDE_W + 10 * mm, PAGE_H - 14 * mm, PAGE_W - 12 * mm, PAGE_H - 14 * mm)

side_frame = Frame(0, 0, SIDE_W, PAGE_H,
                   leftPadding=PAD, rightPadding=PAD + 1.4 * mm,
                   topPadding=PAD + 2, bottomPadding=PAD, id="side")
main_frame = Frame(SIDE_W, 0, PAGE_W - SIDE_W, PAGE_H,
                   leftPadding=10 * mm, rightPadding=12 * mm,
                   topPadding=PAD + 4, bottomPadding=PAD, id="main")
# pagine successive: stessa colonna principale, area sinistra libera
main_frame2 = Frame(SIDE_W, 0, PAGE_W - SIDE_W, PAGE_H,
                    leftPadding=10 * mm, rightPadding=12 * mm,
                    topPadding=18 * mm, bottomPadding=PAD, id="main2")

doc = BaseDocTemplate(
    OUT, pagesize=A4, title="CV — Alberto Pecchini",
    author="Alberto Pecchini", subject="Curriculum Vitae",
    creator="reportlab",
)
doc.addPageTemplates([
    PageTemplate(id="first", frames=[side_frame, main_frame], onPage=on_page_first),
    PageTemplate(id="later", frames=[main_frame2], onPage=on_page_later),
])

SIDE_INNER = SIDE_W - 2 * PAD - 1.4 * mm
MAIN_INNER = (PAGE_W - SIDE_W) - 10 * mm - 12 * mm

story = []

# ============================================================ SIDEBAR
# foto circolare
photo_buf = circular_photo(PHOTO, 600)
ph = RLImage(photo_buf, width=42 * mm, height=42 * mm)
ph.hAlign = "CENTER"
story.append(ph)
story.append(Spacer(1, 10))

# Contatti
story.append(side_title("Contatti"))
contacts = [
    ("Email", "pzkko@yahoo.com", "mailto:pzkko@yahoo.com"),
    ("Telefono", "+39 331 407 4198", "tel:+393314074198"),
    ("WhatsApp", "+44 7340 995142", "https://wa.me/447340995142"),
    ("Luogo", "Mantova, Italia", None),
    ("Web", "albertopecchini.it", "https://albertopecchini.it"),
]
for label, val, href in contacts:
    story.append(Paragraph(label.upper(), ParagraphStyle(
        "cl", fontName=FB, fontSize=6.6, leading=9, textColor=SIDE_MUTED, spaceBefore=3)))
    text = f'<a href="{href}"><font color="#ffffff">{val}</font></a>' if href else val
    story.append(Paragraph(text, ParagraphStyle(
        "cv", fontName=F, fontSize=8.6, leading=11, textColor=WHITE, spaceAfter=1)))
story.append(Spacer(1, 8))
story.append(HR(SIDE_INNER, SIDE_LINE, 0.7, 8))

# Lingue con barra
story.append(side_title("Lingue"))
for name, lvl, frac in LANGS:
    story.append(Paragraph(
        f"{name} <font color='#bcd4ee' size='7.5'>· {lvl}</font>",
        ParagraphStyle("ln", fontName=FB, fontSize=8.8, leading=11, textColor=WHITE,
                       spaceBefore=4, spaceAfter=2)))
    bar = Table([[""]], colWidths=[SIDE_INNER * frac], rowHeights=[3])
    bar.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, -1), BLUE),
                             ("LINEBELOW", (0, 0), (-1, -1), 0, WHITE)]))
    track = Table([[bar]], colWidths=[SIDE_INNER])
    track.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), Color(1, 1, 1, 0.16)),
        ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
        ("ALIGN", (0, 0), (-1, -1), "LEFT"), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(track)
story.append(Spacer(1, 10))
story.append(HR(SIDE_INNER, SIDE_LINE, 0.7, 8))

# Patente
story.append(side_title("Patente"))
story.append(ChipFlow(LICENSE, SIDE_INNER, font=F, size=7.8,
                      fg=WHITE, bg=Color(1, 1, 1, 0.14), hpad=8, vpad=3, gap_x=4,
                      gap_y=4, radius=5))
story.append(Spacer(1, 9))

# Alla guida di
story.append(side_title("Alla guida di"))
story.append(ChipFlow(VEHICLES, SIDE_INNER, font=F, size=7.8,
                      fg=WHITE, bg=Color(1, 1, 1, 0.14), hpad=6, vpad=3, gap_x=4,
                      gap_y=4, radius=5))
story.append(Spacer(1, 10))
story.append(HR(SIDE_INNER, SIDE_LINE, 0.7, 8))

# Punti di forza
story.append(side_title("Punti di forza"))
story.append(ChipFlow(SOFT_SKILLS, SIDE_INNER, font=F, size=7.8,
                      fg=WHITE, bg=Color(1, 1, 1, 0.14), hpad=6, vpad=3, gap_x=4,
                      gap_y=4, radius=5))
story.append(Spacer(1, 10))
story.append(HR(SIDE_INNER, SIDE_LINE, 0.7, 8))

# Hobby
story.append(side_title("Hobby"))
story.append(ChipFlow(HOBBY, SIDE_INNER, font=F, size=7.8,
                      fg=WHITE, bg=Color(1, 1, 1, 0.14), hpad=6, vpad=3, gap_x=4,
                      gap_y=4, radius=5))
story.append(Spacer(1, 10))

# Passioni
story.append(side_title("Passioni"))
story.append(ChipFlow(PASSIONI, SIDE_INNER, font=F, size=7.8,
                      fg=WHITE, bg=Color(1, 1, 1, 0.14), hpad=6, vpad=3, gap_x=4,
                      gap_y=4, radius=5))
story.append(Spacer(1, 10))
story.append(HR(SIDE_INNER, SIDE_LINE, 0.7, 8))

# Disponibilità
story.append(side_title("Disponibilità"))
for d in AVAILABILITY:
    story.append(Paragraph(
        f"<font color='#0066cc'>•</font>&nbsp; {d}",
        ParagraphStyle("av", fontName=F, fontSize=8.4, leading=13, textColor=WHITE,
                       spaceAfter=1)))

# passa alla colonna principale
story.append(FrameBreak())
# se il contenuto sfora, la pagina 2 usa il template a piena colonna
story.append(NextPageTemplate("later"))

# ============================================================ MAIN
story.append(Paragraph("Alberto Pecchini", st_name))
story.append(Paragraph("Designer &amp; Front-end Developer", st_role))
story.append(Spacer(1, 3))
story.append(Paragraph(
    "Studente CAT · Front-end Developer · Disponibile per web design, "
    "sviluppo front-end e branding",
    ParagraphStyle("tag", fontName=F, fontSize=8.6, leading=12, textColor=MUTED)))
story.append(Spacer(1, 9))
story.append(HR(MAIN_INNER, LINE, 0.9, 6))
story.append(Spacer(1, 6))

# Profilo
story.append(section_title("Profilo", MAIN_INNER))
story.append(Spacer(1, 5))
story.append(Paragraph(PROFILE, st_body))
story.append(Spacer(1, 3))

# Competenze
story.append(section_title("Competenze tecniche", MAIN_INNER))
story.append(Spacer(1, 6))
for title, items in SKILLS:
    story.append(Paragraph(title, ParagraphStyle(
        "skt", fontName=FB, fontSize=9.4, leading=12, textColor=INK, spaceAfter=3,
        spaceBefore=2)))
    story.append(ChipFlow(items, MAIN_INNER, font=F, size=8.3, fg=BLUE, bg=BLUE_SOFT,
                          border=HexColor("#cfe1f7"), hpad=8, vpad=3.6, gap_x=5,
                          gap_y=5, radius=6))
    story.append(Spacer(1, 7))
story.append(Spacer(1, 2))

# Esperienze & progetti  (seconda pagina, a piena colonna)
story.append(PageBreak())
story.append(section_title("Esperienze & progetti", MAIN_INNER))
story.append(Spacer(1, 6))
for period, title, role, desc, link in EXPERIENCE:
    head = Paragraph(title, st_item_t)
    per = Paragraph(period, ParagraphStyle("pp", fontName=FB, fontSize=7.6, leading=10,
                                           textColor=BLUE, alignment=2))
    row = Table([[head, per]], colWidths=[MAIN_INNER - 22 * mm, 22 * mm])
    row.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
    ]))
    story.append(row)
    story.append(Paragraph(role, st_item_r))
    story.append(Spacer(1, 2))
    d = desc
    if link:
        url = link if link.startswith("http") else "https://" + link
        d += f'  <a href="{url}"><font color="#0066cc"><b>↗ {link}</b></font></a>'
    story.append(Paragraph(d, st_item_d))
    story.append(Spacer(1, 8))

# Formazione
story.append(section_title("Formazione", MAIN_INNER))
story.append(Spacer(1, 6))
for period, title, role, desc in EDUCATION:
    head = Paragraph(title, st_item_t)
    per = Paragraph(period, ParagraphStyle("pp2", fontName=FB, fontSize=7.6, leading=10,
                                           textColor=BLUE, alignment=2))
    row = Table([[head, per]], colWidths=[MAIN_INNER - 28 * mm, 28 * mm])
    row.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
    ]))
    story.append(row)
    story.append(Paragraph(role, st_item_r))
    story.append(Spacer(1, 2))
    story.append(Paragraph(desc, st_item_d))
    story.append(Spacer(1, 6))

# Volontariato
story.append(Spacer(1, 4))
story.append(section_title("Volontariato & attività extra", MAIN_INNER))
story.append(Spacer(1, 6))
for period, title, role, desc in VOLUNTEER:
    head = Paragraph(title, st_item_t)
    per = Paragraph(period, ParagraphStyle("pp3", fontName=FB, fontSize=7.6, leading=10,
                                           textColor=BLUE, alignment=2))
    row = Table([[head, per]], colWidths=[MAIN_INNER - 28 * mm, 28 * mm])
    row.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
    ]))
    story.append(row)
    story.append(Paragraph(role, st_item_r))
    story.append(Spacer(1, 2))
    story.append(Paragraph(desc, st_item_d))
    story.append(Spacer(1, 6))

# footer privacy + consenso
story.append(Spacer(1, 4))
story.append(HR(MAIN_INNER, LINE, 0.7, 4))
story.append(Paragraph(
    "Autorizzo il trattamento dei dati personali contenuti nel presente CV ai sensi "
    "del Reg. UE 2016/679 (GDPR) e del D.lgs. 196/2003.",
    ParagraphStyle("priv", fontName=F, fontSize=7, leading=9.5, textColor=MUTED)))

doc.build(story)
print("OK ->", OUT)
