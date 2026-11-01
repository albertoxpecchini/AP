// La compilazione del C in comune con «codice C» del cercapersone zero (telefono/zero/os/compilatore.js): gli esempi, lo
// stato (il codice e l'input, telefono/ricordi.js, «compilatore») e compila. (31.10) L'interfaccia HTML di qui (la copia di
// mycompiler.io con l'editor colorato e le schede INPUT e OUTPUT) se n'è andata col cercapersone vecchio.
// Il C è vero: GCC 14.2 su Compiler Explorer (godbolt.org, gratis e senza chiave, accetta le chiamate dal browser); se non
// risponde, Wandbox (wandbox.org, gcc-head). Alberto ha scelto così (26.10): il codice esce dal sito per compilarlo, e la
// pagina lo dice.

import { ricordo } from '../ricordi.js'

const GODBOLT = 'https://godbolt.org/api/compiler/cg142/compile', WANDBOX = 'https://wandbox.org/api/compile.json'
const OPZIONI = ['-std=c17', '-Wall', '-O1', '-lm']
// (dal 29.10 gli esempi e la compilazione si esportano: li usa «codice C» di pzk os, telefono/zero/os/compilatore.js)
export const ESEMPI = {
  ciao: ['ciao, come ti chiami?', '#include <stdio.h>\n\nint main(void) {\n    char nome[50];\n    printf("come ti chiami? ");\n    scanf("%49s", nome);\n    printf("\\nciao %s, benvenuto su pzkko!\\n", nome);\n    return 0;\n}\n', 'alberto'],
  somma: ['somma di due numeri', '#include <stdio.h>\n\nint main(void) {\n    double a, b;\n    scanf("%lf %lf", &a, &b);\n    printf("%.2f + %.2f = %.2f\\n", a, b, a + b);\n    return 0;\n}\n', '3.5 4'],
  fattoriale: ['fattoriale (ricorsione)', '#include <stdio.h>\n\nunsigned long long fatt(int n) {\n    return n <= 1 ? 1 : n * fatt(n - 1);\n}\n\nint main(void) {\n    int n;\n    scanf("%d", &n);\n    for (int i = 0; i <= n; i++)\n        printf("%2d! = %llu\\n", i, fatt(i));\n    return 0;\n}\n', '10'],
  media: ['media di un vettore', '#include <stdio.h>\n\n#define N 5\n\nint main(void) {\n    int v[N], somma = 0;\n    for (int i = 0; i < N; i++) {\n        scanf("%d", &v[i]);\n        somma += v[i];\n    }\n    printf("media: %.2f\\n", (double)somma / N);\n    return 0;\n}\n', '7 8 6 9 10'],
  primi: ['numeri primi', '#include <stdio.h>\n#include <stdbool.h>\n\nbool primo(int n) {\n    if (n < 2) return false;\n    for (int d = 2; d * d <= n; d++)\n        if (n % d == 0) return false;\n    return true;\n}\n\nint main(void) {\n    int max;\n    scanf("%d", &max);\n    for (int i = 2; i <= max; i++)\n        if (primo(i)) printf("%d ", i);\n    printf("\\n");\n    return 0;\n}\n', '100'],
  struct: ['struct e puntatori', '#include <stdio.h>\n#include <string.h>\n\ntypedef struct {\n    char nome[30];\n    int voto;\n} Studente;\n\nvoid promuovi(Studente *s) {\n    if (s->voto < 6) s->voto = 6;\n}\n\nint main(void) {\n    Studente s;\n    strcpy(s.nome, "pzk");\n    scanf("%d", &s.voto);\n    promuovi(&s);\n    printf("%s: %d\\n", s.nome, s.voto);\n    return 0;\n}\n', '4'],
}

export let S = ricordo('compilatore', { codice: ESEMPI.ciao[1], input: ESEMPI.ciao[2], tab: 'input' })

const pulisci = (t) => String(t ?? '').replace(/\x1b\[[0-9;]*[A-Za-z]/g, '').replace(/<source>|prog\.c/g, 'main.c')

// ── la compilazione ──
async function conTempo(url, corpo, ms = 25000) {
  const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), ms)
  try {
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(corpo), signal: ctrl.signal })
    if (!r.ok) throw new Error(`risponde ${r.status}`)
    return await r.json()
  } finally { clearTimeout(t) }
}
async function godbolt(codice, input) {
  const j = await conTempo(GODBOLT, { source: codice, lang: 'c', options: { userArguments: OPZIONI.join(' '), executeParameters: { args: [], stdin: input }, compilerOptions: { executorRequest: true }, filters: { execute: true } } })
  const righe = (a) => (a ?? []).map((x) => pulisci(x.text)).join('\n'), b = j.buildResult ?? {}
  return { compilato: b.code === 0, messaggi: righe(b.stderr), errori: (b.stderr ?? []).filter((x) => x.tag).map((x) => x.tag), out: righe(j.stdout), err: righe(j.stderr), codice: j.didExecute ? j.code : null, dove: 'GCC 14.2 · Compiler Explorer' }
}
async function wandbox(codice, input) {
  const j = await conTempo(WANDBOX, { compiler: 'gcc-head-c', code: codice, stdin: input, options: 'warning', 'compiler-option-raw': OPZIONI.filter((o) => o !== '-Wall').join('\n'), save: false }, 40000)
  const messaggi = pulisci(j.compiler_error ?? j.compiler_message ?? '')
  const errori = [...messaggi.matchAll(/main\.c:(\d+):(\d+): (error|warning): (.*)/g)].map(([, l, c, s, t]) => ({ line: +l, column: +c, text: `${s}: ${t}`, severity: s === 'error' ? 3 : 2 }))
  const compilato = !errori.some((e) => e.severity === 3) && j.status !== undefined
  return { compilato, messaggi, errori, out: j.program_output ?? '', err: pulisci(j.program_error ?? ''), codice: compilato ? Number(j.status) : null, dove: 'GCC · Wandbox' }
}
/** Compila ed esegue: GCC su Compiler Explorer, se non risponde Wandbox. → { compilato, messaggi, errori, out, err, codice, dove, ms }
 *  o { rete: true, testo, ms } se nessuno dei due risponde. */
export async function compila(codice, input) {
  const t0 = performance.now()
  let r
  try {
    try { r = await godbolt(codice, input) } catch { r = await wandbox(codice, input) }
  } catch (e) {
    r = { rete: true, testo: e.name === 'AbortError' ? 'i compilatori ci mettono troppo: riprova fra poco' : 'i compilatori non rispondono: sei offline?' }
  }
  r.ms = performance.now() - t0
  return r
}
