# Ripara in memoria i difetti che la conversione DWG → DXF di LibreDWG lascia
# nei tratteggi, prima di disegnarli con ezdxf.

import math
from ezdxf import bbox
from ezdxf.math import open_uniform_knot_vector
from ezdxf.entities.boundary_paths import EdgePath, SplineEdge
from ezdxf.tools import pattern as patterns


def heal(doc):
    """Nodi delle spline dei contorni con la lunghezza sbagliata e motivi dei
    tratteggi con la scala applicata due volte. Restituisce le spline riparate."""
    fixed = 0
    layouts = [doc.modelspace(), *doc.blocks]
    for lay in layouts:
        for h in lay.query('HATCH MPOLYGON'):
            for p in h.paths:
                if not isinstance(p, EdgePath):
                    continue
                for e in p.edges:
                    if isinstance(e, SplineEdge):
                        n = len(e.control_points)
                        if len(e.knot_values) != e.degree + n + 1:
                            e.knot_values = list(open_uniform_knot_vector(n, e.degree + 1))
                            if len(e.weights) != n:
                                e.weights = []
                            fixed += 1
    # La definizione del motivo è già in scala: se resta anche il fattore di
    # scala, ezdxf lo applica una seconda volta quando trasforma un blocco
    # (un prato in un blocco diventava centinaia di milioni di trattini).
    for lay in layouts:
        for h in lay.query('HATCH'):
            if not h.dxf.solid_fill and h.pattern is not None and h.pattern.lines:
                h.dxf.pattern_scale = 1
    return fixed


def _segments(h):
    """Stima grossolana dei trattini che produrrebbe un tratteggio."""
    b = bbox.extents([h], fast=True)
    if not b.has_data:
        return 0
    diag = math.hypot(b.size.x, b.size.y)
    if h.pattern is not None and h.pattern.lines:
        lines = [(L.angle, L.offset.x, L.offset.y, list(L.dash_length_items)) for L in h.pattern.lines]
    else:
        pdef = patterns.load().get(h.dxf.pattern_name.upper())
        if not pdef:
            return 0
        s = h.dxf.get('pattern_scale', 1) or 1
        lines = [(p[0], p[2][0] * s, p[2][1] * s, [d * s for d in p[3]]) for p in pdef]
    est = 0
    for angle, ox, oy, dashes in lines:
        a = math.radians(angle)
        perp = abs(-math.sin(a) * ox + math.cos(a) * oy)
        period = sum(abs(d) for d in dashes)
        est += diag / max(perp, 1e-9) * (diag / period if period > 0 else 1)
    return est


def solidify_dense(doc, limit=100_000):
    """Come AutoCAD oltre MaxHatch: i tratteggi troppo fitti diventano pieni."""
    n = 0
    for lay in [doc.modelspace(), *doc.blocks]:
        for h in lay.query('HATCH'):
            if h.dxf.solid_fill:
                continue
            try:
                est = _segments(h)
            except Exception:
                continue
            if est > limit:
                h.set_solid_fill(color=h.dxf.color, style=0)
                n += 1
    return n
