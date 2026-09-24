# Esporta in SVG le tavole di un DXF (convertito da DWG con LibreDWG): una per
# ogni riquadro (x0, y0, x1, y1) in unità di disegno, come in AutoCAD con lo
# sfondo bianco — il colore 7 diventa nero, gli altri restano quelli del file.
import sys, json, time, ezdxf
from ezdxf import bbox
from ezdxf.addons.drawing import RenderContext, Frontend, svg, layout
from ezdxf.addons.drawing.config import Configuration, BackgroundPolicy, ColorPolicy, HatchPolicy, LineweightPolicy
from heal import heal, solidify_dense

def fix_colors(doc):
    """LibreDWG scrive nel campo del colore vero dei tratteggi un valore di un
    solo byte (l'opacità), che letto come RGB diventa blu puro: si torna all'ACI."""
    n = 0
    for lay in [doc.modelspace()] + list(doc.blocks):
        for e in lay:
            if e.dxf.hasattr('true_color') and e.dxf.true_color <= 0xFF:
                e.dxf.discard('true_color'); n += 1
    # Maschere dei testi: LibreDWG ne legge il colore come nero quasi puro; in
    # AutoCAD sono del colore dello sfondo, quindi con lo sfondo bianco spariscono.
    for lay in [doc.modelspace()] + list(doc.blocks):
        for m in lay.query('MTEXT'):
            if m.dxf.get('bg_fill', 0):
                m.dxf.bg_fill = 3
                m.dxf.discard('bg_fill_true_color')
                if not m.dxf.get('box_fill_scale'): m.dxf.box_fill_scale = 1.5
    return n

def _lum(rgb):
    def ch(c):
        c /= 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = rgb
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)

def _darker(rgb, target=0.32):
    """Scurisce un colore mantenendone la tinta finché la luminanza non scende a `target`."""
    k = 1.0
    while _lum(tuple(c * k for c in rgb)) > target and k > 0.05:
        k -= 0.02
    return tuple(int(round(c * k)) for c in rgb)

def darken_light(doc, target=0.32):
    """I colori chiari scelti per lo sfondo scuro di AutoCAD (curve di livello
    grigio chiaro e rosa, giallo, ciano) sul bianco non si leggono: tratti e
    testi troppo chiari vengono scuriti, i riempimenti dei tratteggi no."""
    from ezdxf import colors
    n = 0
    def rgb_of(dxf):
        if dxf.hasattr('true_color'):
            return colors.int2rgb(dxf.true_color & 0xFFFFFF)
        aci = dxf.get('color', 256)
        if 1 <= aci <= 255 and aci != 7:
            return colors.aci2rgb(aci)
        return None
    for layer in doc.layers:
        rgb = rgb_of(layer.dxf)
        if rgb and _lum(rgb) > target:
            layer.dxf.true_color = colors.rgb2int(_darker(rgb, target)); n += 1
    for lay in [doc.modelspace()] + list(doc.blocks):
        for e in lay:
            if e.dxftype() in ('HATCH', 'SOLID', 'MPOLYGON', 'WIPEOUT'): continue
            rgb = rgb_of(e.dxf)
            if rgb and _lum(rgb) > target:
                e.dxf.true_color = colors.rgb2int(_darker(rgb, target)); n += 1
    return n

def entities_in(msp, box, cache, skip=()):
    x0, y0, x1, y1 = box
    out = []
    for e in msp:
        h = e.dxf.handle
        if h in skip: continue
        if h not in cache:
            try: cache[h] = bbox.extents([e], fast=True)
            except Exception: cache[h] = None
        b = cache[h]
        if not b or not b.has_data: continue
        if b.extmin.x >= x0 and b.extmax.x <= x1 and b.extmin.y >= y0 and b.extmax.y <= y1:
            out.append(e)
    return out

def export(src, sheets, lw=0.18, skip=(), darken=False):
    doc = ezdxf.readfile(src)
    print("spline", heal(doc), "colori", fix_colors(doc), "fitti", solidify_dense(doc))
    if darken: print('scuriti', darken_light(doc))
    msp = doc.modelspace()
    cache = {}
    cfg = Configuration(background_policy=BackgroundPolicy.WHITE, color_policy=ColorPolicy.COLOR, hatch_policy=HatchPolicy.NORMAL, hatching_timeout=20,
                        lineweight_policy=LineweightPolicy.ABSOLUTE, lineweight_scaling=0.6, min_lineweight=lw / 25.4 * 300)
    for s in sheets:
        t = time.time()
        x0, y0, x1, y1 = s['box']
        ents = entities_in(msp, s['box'], cache, set(skip) | set(s.get('skip', [])))
        chosen = {e.dxf.handle for e in ents}
        be = svg.SVGBackend()
        fe = Frontend(RenderContext(doc), be, config=cfg)
        # draw_layout rispetta l'ordine di visualizzazione (SORTENTS) e lo sfondo
        fe.draw_layout(msp, filter_func=lambda e: e.dxf.handle in chosen, finalize=False)
        w = s.get('width_mm', 420)
        h = w * (y1 - y0) / (x1 - x0)
        page = layout.Page(w, h, layout.Units.mm, margins=layout.Margins.all(0))
        # il riquadro intero, non l'ingombro delle entità: la tavola resta in scala
        be.finalize()
        st = be.get_string(page, settings=layout.Settings(fit_page=True, output_coordinate_space=s.get('space', 1_000_000)))
        open(s['out'], 'w').write(st)
        print(s['out'], len(ents), 'entità', len(st) // 1024, 'KB', round(time.time() - t, 1), 's', flush=True)

if __name__ == '__main__':
    c = json.load(open(sys.argv[1]))
    export(c['src'], c['sheets'], c.get('lw', 0.18), c.get('skip', []), c.get('darken', False))
