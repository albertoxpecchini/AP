# -*- coding: utf-8 -*-
"""
Genera l'INTERO set di favicon/icone da Downloads/ap_logo_font.svg.
Il testo ".ap" viene convertito in tracciati vettoriali (niente font incorporato),
così le icone funzionano in ogni browser e piattaforma.

Output in public/:
  - favicon.svg                 (vettoriale, browser moderni)
  - favicon.ico                 (16/32/48, browser legacy + segnalibri)
  - favicon-16x16.png, favicon-32x32.png, favicon-48x48.png
  - apple-touch-icon.png        (180x180, iOS)
  - icon-192.png, icon-512.png  (Android / PWA)
  - icon-512-maskable.png       (Android adaptive, safe zone)
  - site.webmanifest            (installazione come app)
"""
import base64
import json
import os
import re
from io import BytesIO

from PIL import Image, ImageOps

from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.reportLabPen import ReportLabPen
from fontTools.misc.transform import Transform

from reportlab.graphics.shapes import Drawing, Group
from reportlab.graphics import renderPDF
from reportlab.lib.colors import black
import pypdfium2 as pdfium

SRC = r"C:\Users\alberto\Downloads\ap_logo_font.svg"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, "public")

# Parametri dall'SVG originale
TEXT = ".ap"
FONT_SIZE = 240
TEXT_X = 45
TEXT_Y = 315          # baseline (dall'alto)
GRAD_FROM = "#0A6DD8"
GRAD_TO = "#0057B8"
THEME = "#0066CC"
FILL = "#ffffff"
VB = 512              # viewBox

# ----------------------------------------------------------------- font
svg = open(SRC, "r", encoding="utf-8").read()
m = re.search(r"data:font/ttf;base64,([A-Za-z0-9+/=]+)", svg)
if not m:
    raise SystemExit("Font base64 non trovato nell'SVG sorgente")
font = TTFont(BytesIO(base64.b64decode(m.group(1))))
upm = font["head"].unitsPerEm
scale = FONT_SIZE / upm
cmap = font.getBestCmap()
glyphset = font.getGlyphSet()
hmtx = font["hmtx"]


def hx(c):
    c = c.lstrip("#")
    return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4))


# ----------------------------------------------------------------- 1) SVG
def build_svg():
    pen_x = 0.0
    parts = []
    for ch in TEXT:
        gn = cmap[ord(ch)]
        t = Transform(scale, 0, 0, -scale, TEXT_X + pen_x, TEXT_Y)
        sp = SVGPathPen(glyphset)
        glyphset[gn].draw(TransformPen(sp, t))
        if sp.getCommands():
            parts.append(sp.getCommands())
        pen_x += hmtx[gn][0] * scale
    d = " ".join(parts)
    out = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{VB}" height="{VB}" '
        f'viewBox="0 0 {VB} {VB}">'
        '<defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">'
        f'<stop offset="0%" stop-color="{GRAD_FROM}"/>'
        f'<stop offset="100%" stop-color="{GRAD_TO}"/>'
        '</linearGradient></defs>'
        f'<rect width="{VB}" height="{VB}" fill="url(#bg)"/>'
        f'<path d="{d}" fill="{FILL}"/></svg>'
    )
    p = os.path.join(PUB, "favicon.svg")
    open(p, "w", encoding="utf-8").write(out)
    print("OK ->", p, f"({len(out.encode())} byte)")


# ----------------------------------------------------------------- raster
def text_alpha(R=512):
    """Maschera alpha del testo (".ap" -> 255) renderizzata via reportlab/pdfium."""
    base = R - TEXT_Y * (R / VB)
    s = scale * (R / VB)
    pen_x = 0.0
    dwg = Drawing(R, R)
    for ch in TEXT:
        gn = cmap[ord(ch)]
        pen = ReportLabPen(glyphset)
        glyphset[gn].draw(pen)
        path = pen.path
        path.fillColor = black
        path.strokeColor = None
        g = Group(path)
        g.transform = (s, 0, 0, s, TEXT_X * (R / VB) + pen_x, base)
        dwg.add(g)
        pen_x += hmtx[gn][0] * s
    tmp = os.path.join(ROOT, "scripts", "_mask.pdf")
    renderPDF.drawToFile(dwg, tmp)
    doc = pdfium.PdfDocument(tmp)
    gray = doc[0].render(scale=1.0).to_pil().convert("L")
    doc.close()
    os.remove(tmp)
    if gray.size != (R, R):
        gray = gray.resize((R, R), Image.LANCZOS)
    return ImageOps.invert(gray)


def gradient(R):
    c0, c1 = hx(GRAD_FROM), hx(GRAD_TO)
    img = Image.new("RGB", (R, R))
    px = img.load()
    for y in range(R):
        for x in range(R):
            t = (x + y) / (2 * (R - 1))
            px[x, y] = tuple(round(c0[k] + (c1[k] - c0[k]) * t) for k in range(3))
    return img


def icon_standard(R=512):
    """Artwork fedele all'SVG: gradiente + testo bianco a sinistra."""
    alpha = text_alpha(R)
    grad = gradient(R).convert("RGBA")
    white = Image.new("RGBA", (R, R), (255, 255, 255, 255))
    return Image.composite(white, grad, alpha).convert("RGB")


def icon_maskable(R=512, safe=0.66):
    """Versione per Android adaptive: testo centrato dentro la safe zone."""
    alpha = text_alpha(R)
    bbox = alpha.getbbox()
    crop = alpha.crop(bbox)
    target = int(R * safe)
    cw, ch = crop.size
    k = min(target / cw, target / ch)
    crop = crop.resize((max(1, int(cw * k)), max(1, int(ch * k))), Image.LANCZOS)
    canvas = Image.new("L", (R, R), 0)
    canvas.paste(crop, ((R - crop.size[0]) // 2, (R - crop.size[1]) // 2))
    grad = gradient(R).convert("RGBA")
    white = Image.new("RGBA", (R, R), (255, 255, 255, 255))
    return Image.composite(white, grad, canvas).convert("RGB")


# ----------------------------------------------------------------- build
def main():
    build_svg()
    master = icon_standard(512)

    sizes = {
        "favicon-16x16.png": 16,
        "favicon-32x32.png": 32,
        "favicon-48x48.png": 48,
        "apple-touch-icon.png": 180,
        "icon-192.png": 192,
        "icon-512.png": 512,
    }
    for name, s in sizes.items():
        img = master if s == 512 else master.resize((s, s), Image.LANCZOS)
        img.save(os.path.join(PUB, name))
        print("OK ->", name, f"{s}x{s}")

    # .ico multi-size
    ico = os.path.join(PUB, "favicon.ico")
    master.save(ico, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    print("OK -> favicon.ico (16/32/48)")

    # maskable
    icon_maskable(512).save(os.path.join(PUB, "icon-512-maskable.png"))
    print("OK -> icon-512-maskable.png")

    # web manifest
    manifest = {
        "name": "Alberto Pecchini",
        "short_name": "A. Pecchini",
        "description": "Designer & Front-end Developer",
        "icons": [
            {"src": "/icon-192.png", "sizes": "192x192", "type": "image/png"},
            {"src": "/icon-512.png", "sizes": "512x512", "type": "image/png"},
            {"src": "/icon-512-maskable.png", "sizes": "512x512",
             "type": "image/png", "purpose": "maskable"},
        ],
        "theme_color": THEME,
        "background_color": GRAD_TO,
        "display": "standalone",
        "start_url": "/",
    }
    mp = os.path.join(PUB, "site.webmanifest")
    open(mp, "w", encoding="utf-8").write(json.dumps(manifest, indent=2, ensure_ascii=False))
    print("OK -> site.webmanifest")


if __name__ == "__main__":
    main()
