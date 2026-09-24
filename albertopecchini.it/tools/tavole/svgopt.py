# Alleggerisce gli SVG delle tavole: coordinate arrotondate, colori in
# esadecimale, attributi con il valore predefinito tolti, spazi compressi.
import re, sys

def pct_to_hex(m):
    r, g, b = (round(float(v) * 2.55) for v in m.groups())
    return '#%02x%02x%02x' % (r, g, b)

def optimize(svg, decimals=2):
    svg = re.sub(r'rgb\(([\d.]+)%,\s*([\d.]+)%,\s*([\d.]+)%\)', pct_to_hex, svg)
    fmt = '{:.%df}' % decimals
    def rnd(m):
        s = fmt.format(float(m.group(0))).rstrip('0').rstrip('.')
        s = s.replace('0.', '.', 1) if s.startswith('0.') else s.replace('-0.', '-.', 1)
        return '0' if s in ('-0', '') else s
    num = re.compile(r'-?(?:\d+\.\d*|\.\d+)')
    # si arrotondano solo i tracciati: le matrici di trasformazione restano esatte
    svg = re.sub(r'( d=")([^"]*)(")', lambda m: m.group(1) + num.sub(rnd, m.group(2)) + m.group(3), svg)
    for attr in (' stroke-opacity="1"', ' fill-opacity="1"', ' stroke-miterlimit="10"', ' fill-rule="nonzero"', ' clip-rule="nonzero"', ' stroke-linecap="butt"', ' stroke-linejoin="miter"'):
        svg = svg.replace(attr, '')
    svg = re.sub(r'>\s+<', '><', svg)
    svg = re.sub(r'<\?xml[^>]*\?>', '', svg).strip()
    return svg

if __name__ == '__main__':
    src, dst = sys.argv[1], sys.argv[2]
    dec = int(sys.argv[3]) if len(sys.argv) > 3 else 2
    s = open(src).read()
    o = optimize(s, dec)
    open(dst, 'w').write(o)
    print(dst, len(s) // 1024, '→', len(o) // 1024, 'KB')
