// L'app Compilatore (26.10): una copia di mycompiler.io in stile pzk, per il C. A sinistra l'editor (i numeri di riga, i
// colori della sintassi, Tab che rientra, Invio che tiene il rientro, Ctrl+Invio che esegue), a destra le schede INPUT
// (quello che il programma legge con scanf) e OUTPUT (quello che stampa, gli errori in rosso, il codice d'uscita, i tempi).
// Gli errori di compilazione si segnano anche sulle righe dell'editor.
// Il C è vero: GCC 14.2 su Compiler Explorer (godbolt.org, gratis e senza chiave, accetta le chiamate dal browser); se non
// risponde, Wandbox (wandbox.org, gcc-head). Alberto ha scelto così (26.10): il codice esce dal sito per compilarlo, e la
// pagina lo dice. Il codice e l'input restano in questo browser (telefono/ricordi.js). Il carattere del codice è Cascadia
// Code (fonts/, OFL): quello del cercapersone ha solo maiuscole, e il C le distingue.

import * as led from '../../chat/led.js'
import { icona } from '../../chat/icone.js'
import { tieni, ricordo, ricorda } from '../ricordi.js'

const GODBOLT = 'https://godbolt.org/api/compiler/cg142/compile', WANDBOX = 'https://wandbox.org/api/compile.json'
const OPZIONI = ['-std=c17', '-Wall', '-O1', '-lm']
const ESEMPI = {
  ciao: ['ciao, come ti chiami?', '#include <stdio.h>\n\nint main(void) {\n    char nome[50];\n    printf("come ti chiami? ");\n    scanf("%49s", nome);\n    printf("\\nciao %s, benvenuto su pzkko!\\n", nome);\n    return 0;\n}\n', 'alberto'],
  somma: ['somma di due numeri', '#include <stdio.h>\n\nint main(void) {\n    double a, b;\n    scanf("%lf %lf", &a, &b);\n    printf("%.2f + %.2f = %.2f\\n", a, b, a + b);\n    return 0;\n}\n', '3.5 4'],
  fattoriale: ['fattoriale (ricorsione)', '#include <stdio.h>\n\nunsigned long long fatt(int n) {\n    return n <= 1 ? 1 : n * fatt(n - 1);\n}\n\nint main(void) {\n    int n;\n    scanf("%d", &n);\n    for (int i = 0; i <= n; i++)\n        printf("%2d! = %llu\\n", i, fatt(i));\n    return 0;\n}\n', '10'],
  media: ['media di un vettore', '#include <stdio.h>\n\n#define N 5\n\nint main(void) {\n    int v[N], somma = 0;\n    for (int i = 0; i < N; i++) {\n        scanf("%d", &v[i]);\n        somma += v[i];\n    }\n    printf("media: %.2f\\n", (double)somma / N);\n    return 0;\n}\n', '7 8 6 9 10'],
  primi: ['numeri primi', '#include <stdio.h>\n#include <stdbool.h>\n\nbool primo(int n) {\n    if (n < 2) return false;\n    for (int d = 2; d * d <= n; d++)\n        if (n % d == 0) return false;\n    return true;\n}\n\nint main(void) {\n    int max;\n    scanf("%d", &max);\n    for (int i = 2; i <= max; i++)\n        if (primo(i)) printf("%d ", i);\n    printf("\\n");\n    return 0;\n}\n', '100'],
  struct: ['struct e puntatori', '#include <stdio.h>\n#include <string.h>\n\ntypedef struct {\n    char nome[30];\n    int voto;\n} Studente;\n\nvoid promuovi(Studente *s) {\n    if (s->voto < 6) s->voto = 6;\n}\n\nint main(void) {\n    Studente s;\n    strcpy(s.nome, "pzk");\n    scanf("%d", &s.voto);\n    promuovi(&s);\n    printf("%s: %d\\n", s.nome, s.voto);\n    return 0;\n}\n', '4'],
}

let host = null, ctx = null, inCorso = false, salva = 0
let S = ricordo('compilatore', { codice: ESEMPI.ciao[1], input: ESEMPI.ciao[2], tab: 'input' })
let ultimo = null // l'ultima esecuzione: { compilato, messaggi, errori: [{ line, column, text, severity }], out, err, codice, ms, dove }

const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const pulisci = (t) => String(t ?? '').replace(/\x1b\[[0-9;]*[A-Za-z]/g, '').replace(/<source>|prog\.c/g, 'main.c')

// ── i colori del C: sul testo già senza < > &, un'espressione per i commenti, le stringhe, il preprocessore, i numeri, le
// chiamate e le parole riservate ──
const KW = new Set('auto break case char const continue default do double else enum extern float for goto if inline int long register restrict return short signed sizeof static struct switch typedef union unsigned void volatile while bool true false NULL size_t FILE'.split(' '))
const TOKEN = /(\/\/.*|\/\*[\s\S]*?(?:\*\/|$))|("(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?)|(^[ \t]*#.*)|(\b0[xX][0-9a-fA-F]+\b|\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?[uUlLfF]*\b)|\b([A-Za-z_]\w*)(?=\s*\()|\b([A-Za-z_]\w*)\b/gm
const colora = (src) => esc(src).replace(TOKEN, (m, com, str, pre, num, fn, id) =>
  com ? `<i class="c">${com}</i>` : str ? `<i class="s">${str}</i>` : pre ? `<i class="p">${pre}</i>` : num ? `<i class="n">${num}</i>`
    : fn ? `<i class="${KW.has(fn) ? 'k' : 'f'}">${fn}</i>` : KW.has(id) ? `<i class="k">${id}</i>` : m)

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
async function esegui() {
  if (inCorso) return
  inCorso = true
  S.tab = 'output'
  ultimo = null
  pannello()
  led.inizia()
  const t0 = performance.now()
  try {
    try { ultimo = await godbolt(S.codice, S.input) } catch { ultimo = await wandbox(S.codice, S.input) }
  } catch (e) {
    ultimo = { rete: true, testo: e.name === 'AbortError' ? 'i compilatori ci mettono troppo: riprova fra poco' : 'i compilatori non rispondono: sei offline?' }
  } finally { led.finisci(); inCorso = false }
  ultimo.ms = performance.now() - t0
  pannello()
  segnaRighe()
}

// ── la pagina ──
function telaio() {
  host.innerHTML = `${ctx.testata('Compilatore C', `<select class="t-cc-es" data-esempio aria-label="esempi"><option value="">esempi…</option>${Object.entries(ESEMPI).map(([k, [n]]) => `<option value="${k}">${n}</option>`).join('')}</select><button class="c-b t-cc-via" type="button" data-esegui>▶ esegui</button>`)}
    <div class="t-cc">
      <div class="t-cc-ed">
        <div class="t-cc-file">${icona('app-compilatore')}<b>main.c</b><small>${OPZIONI.join(' ')}</small></div>
        <div class="t-cc-corpo"><pre class="t-cc-righe" aria-hidden="true"></pre><div class="t-cc-area"><pre class="t-cc-col" aria-hidden="true"></pre><textarea class="t-cc-src" spellcheck="false" autocapitalize="off" autocomplete="off" wrap="off" aria-label="il codice C"></textarea></div></div>
      </div>
      <div class="t-cc-pan">
        <nav class="t-za-filtri t-cc-tab"><button type="button" data-tab="input">input</button><button type="button" data-tab="output">output</button></nav>
        <div class="t-cc-dentro"></div>
      </div>
    </div>`
  host.querySelector('.t-cc-src').value = S.codice
  colori()
  pannello()
}
function colori() {
  const src = host.querySelector('.t-cc-src'), n = S.codice.split('\n').length
  host.querySelector('.t-cc-col').innerHTML = colora(S.codice) + '\n '
  host.querySelector('.t-cc-righe').innerHTML = Array.from({ length: n }, (_, i) => `<span data-r="${i + 1}">${i + 1}</span>`).join('\n') + '\n '
  segnaRighe()
  scorri(src)
}
function segnaRighe() {
  const righe = host.querySelector('.t-cc-righe')
  if (!righe) return
  for (const r of righe.querySelectorAll('.err,.avv')) r.classList.remove('err', 'avv')
  for (const e of ultimo?.errori ?? []) { // l'errore vince sull'avviso e sulla nota della stessa riga
    const r = righe.querySelector(`[data-r="${e.line}"]`)
    if (!r) continue
    if (e.severity >= 3) { r.classList.remove('avv'); r.classList.add('err') } else if (!r.classList.contains('err')) r.classList.add('avv')
  }
}
function scorri(src) {
  host.querySelector('.t-cc-col').style.transform = `translate(${-src.scrollLeft}px, ${-src.scrollTop}px)`
  host.querySelector('.t-cc-righe').style.transform = `translateY(${-src.scrollTop}px)`
}
function pannello() {
  for (const b of host.querySelectorAll('.t-cc-tab button')) b.classList.toggle('on', b.dataset.tab === S.tab)
  const d = host.querySelector('.t-cc-dentro')
  if (S.tab === 'input') {
    d.innerHTML = `<textarea class="t-cc-in" spellcheck="false" placeholder="quello che il programma legge con scanf: numeri e parole separati da spazi o a capo">${esc(S.input)}</textarea><p class="t-cc-nota">si scrive prima di eseguire, come su mycompiler.</p>`
    return
  }
  if (inCorso) { d.innerHTML = '<div class="t-cc-out"><p class="t-cc-stato">compilo ed eseguo…</p></div>'; return }
  if (!ultimo) { d.innerHTML = '<div class="t-cc-out"><p class="t-cc-stato">premi ▶ esegui (o Ctrl+Invio)</p></div>'; return }
  const s = (ultimo.ms / 1000).toLocaleString('it-IT', { maximumFractionDigits: 1 })
  if (ultimo.rete) { d.innerHTML = `<div class="t-cc-out"><pre class="t-cc-e">${esc(ultimo.testo)}</pre></div>`; return }
  d.innerHTML = `<div class="t-cc-out">
    ${ultimo.messaggi ? `<pre class="${ultimo.compilato ? 't-cc-w' : 't-cc-e'}">${esc(ultimo.messaggi)}</pre>` : ''}
    ${ultimo.compilato ? `<pre class="t-cc-o">${esc(ultimo.out) || '<span class="t-cc-vuoto">(non ha stampato niente)</span>'}</pre>${ultimo.err ? `<pre class="t-cc-e">${esc(ultimo.err)}</pre>` : ''}` : ''}
    <p class="t-cc-fine">${ultimo.compilato ? `[finito: codice d’uscita ${ultimo.codice ?? '?'}` : '[non compila'} · ${s} s · ${ultimo.dove}]</p>
    <p class="t-cc-nota">il codice si compila su un servizio esterno: non scriverci password.</p></div>`
}

// ── l'editor: Tab rientra, Invio tiene il rientro (e lo allarga dopo «{»), Ctrl+Invio esegue ──
function tasti(e) {
  const t = e.target
  if (!t.matches('.t-cc-src')) { if (t.matches('.t-cc-in') && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); esegui() } return }
  const { selectionStart: a, selectionEnd: b, value: v } = t
  const metti = (testo, cursore = a + testo.length) => { t.setRangeText(testo, a, b, 'end'); t.selectionStart = t.selectionEnd = cursore; t.dispatchEvent(new Event('input', { bubbles: true })) }
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); return esegui() }
  if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); return metti('    ') }
  if (e.key === 'Enter') {
    e.preventDefault()
    const riga = v.slice(v.lastIndexOf('\n', a - 1) + 1, a), rientro = /^\s*/.exec(riga)[0] + (/\{\s*$/.test(riga) ? '    ' : '')
    if (/\{\s*$/.test(riga) && v[b] === '}') return metti(`\n${rientro}\n${rientro.slice(4)}`, a + 1 + rientro.length)
    return metti(`\n${rientro}`)
  }
  if (e.key === '}' && /^\s+$/.test(v.slice(v.lastIndexOf('\n', a - 1) + 1, a)) && a === b) { // la graffa chiusa torna indietro di un rientro
    e.preventDefault()
    const inizio = v.lastIndexOf('\n', a - 1) + 1, sp = a - inizio
    t.setRangeText(`${' '.repeat(Math.max(0, sp - 4))}}`, inizio, a, 'end')
    t.dispatchEvent(new Event('input', { bubbles: true }))
  }
}
function scrivi(e) {
  const t = e.target
  if (t.matches('.t-cc-src')) { S.codice = t.value; colori() } else if (t.matches('.t-cc-in')) S.input = t.value
  else return
  clearTimeout(salva); salva = setTimeout(() => ricorda('compilatore', S), 400)
}
function clic(e) {
  if (e.target.closest('[data-esegui]')) return esegui()
  const t = e.target.closest('[data-tab]')
  if (t) { S.tab = t.dataset.tab; ricorda('compilatore', S); return pannello() }
}
function scegli(e) {
  if (!e.target.matches('[data-esempio]') || !e.target.value) return
  const [, codice, input] = ESEMPI[e.target.value]
  e.target.value = ''
  if (S.codice.trim() && S.codice !== codice && !confirm('sostituisco il codice che c’è con l’esempio?')) return
  Object.assign(S, { codice, input, tab: 'input' })
  ultimo = null
  ricorda('compilatore', S)
  telaio()
}

export function monta(h, c) {
  host = h; ctx = c
  tieni(host, 'compilatore')
  // il carattere del codice, solo qui (fonts/cascadia-code.woff2)
  if (!document.fonts?.check?.('12px "Cascadia Code"')) document.fonts?.add?.(new FontFace('Cascadia Code', 'url(/fonts/cascadia-code.woff2)', { weight: '200 700' }))
  host.addEventListener('click', clic)
  host.addEventListener('keydown', tasti)
  host.addEventListener('input', scrivi)
  host.addEventListener('change', scegli)
  host.addEventListener('scroll', (e) => { if (e.target.matches?.('.t-cc-src')) scorri(e.target) }, true)
  telaio()
  return { mostra: () => { if (matchMedia('(hover:hover)').matches) host.querySelector('.t-cc-src')?.focus({ preventScroll: true }) } }
}
