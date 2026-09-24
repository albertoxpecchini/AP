# Ripara il DXF scritto da dwg2dxf (LibreDWG) prima di leggerlo con ezdxf:
#  · valori di testo spezzati da un a capo vero (al confine dei blocchi da 250
#    caratteri) → la riga orfana si riattacca al valore, senza separatore
#  · MTEXT con il testo lungo: LibreDWG scrive il primo pezzo (codice 1) prima
#    dei pezzi successivi (codice 3); il DXF vuole i 3 prima e l'1 per ultimo.
import sys, re
isint = re.compile(r'^\s*-?\d+\s*$')
def fix(src, dst):
    raw = open(src, 'rb').read().decode('utf-8', errors='replace')
    lines = raw.replace('\r\n', '\n').split('\n')
    pairs = []; i = 0; n = len(lines); merged = 0
    while i < n - 1:
        code = lines[i]
        if not isint.match(code):
            c, v = pairs[-1]; pairs[-1] = (c, v + code); merged += 1; i += 1; continue
        pairs.append((code.strip(), lines[i + 1])); i += 2
    out = []; ent = []; moved = 0
    def flush():
        nonlocal moved
        if ent and ent[0] == ('0', 'MTEXT'):
            ones = [k for k, (c, _) in enumerate(ent) if c == '1']
            threes = [k for k, (c, _) in enumerate(ent) if c == '3']
            if ones and threes and ones[0] < threes[0]:
                first = ent[ones[0]]
                chunks = [ent[k] for k in threes]
                rest = [p for k, p in enumerate(ent) if k != ones[0] and k not in threes]
                at = min(ones[0], len(rest))
                # i pezzi nell'ordine giusto: 3 (dal primo pezzo in poi) … e l'ultimo come 1
                seq = [first] + chunks
                texts = [v for _, v in seq]
                new = [('3', t) for t in texts[:-1]] + [('1', texts[-1])]
                ent[:] = rest[:at] + new + rest[at:]
                moved += 1
        out.extend(ent); ent.clear()
    for p in pairs:
        if p[0] == '0': flush()
        ent.append(p)
    flush()
    open(dst, 'w', encoding='utf-8').write('\n'.join(f'{c}\n{v}' for c, v in out) + '\n')
    print(src, 'righe riunite', merged, 'mtext riordinati', moved)
for name in sys.argv[1:]:
    fix(name + '.dxf', name + '.fixed.dxf')
