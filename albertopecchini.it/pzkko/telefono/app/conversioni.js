// I conti delle Conversioni (26.10): un numero scritto in una base (decimale, binario, ottale, esadecimale) e lo stesso
// numero nelle altre, con la parte dopo la virgola e i numeri grandi quanto si vuole (BigInt); il complemento a 2 su 8, 16,
// 32, 64 bit; «come si fa», il procedimento che si scrive a scuola verso la base scelta (le divisioni successive e i resti
// letti dal basso, le moltiplicazioni per la parte frazionaria, la somma delle potenze, i gruppi di 4 o 3 bit).
// (31.10) È la logica in comune con bin·hex del cercapersone zero (telefono/zero/os/conversioni.js), che la disegna a un
// bit; l'interfaccia HTML di qui se n'è andata col cercapersone vecchio.

export const BASI = [[10, 'dec', 'decimale'], [2, 'bin', 'binario'], [8, 'oct', 'ottale'], [16, 'hex', 'esadecimale']]
export const NOME = Object.fromEntries(BASI.map(([b, , n]) => [b, n]))
export const CIFRE = '0123456789ABCDEF'
const MAX_FRAZ = 16 // cifre dopo la virgola, al più (poi «…»: la frazione non finisce)

/** Il testo nella base b → { neg, int, fn/fd (la parte dopo la virgola, frazione esatta: tutto BigInt), fraz, cifreFraz } o { errore }. Accetta 0b 0o 0x davanti (cambiano la base). */
export function leggi(testo, b) {
  let t = testo.trim().replace(/[\s_']/g, '').toUpperCase()
  const neg = t.startsWith('-')
  if (neg || t.startsWith('+')) t = t.slice(1)
  const pre = /^0([BOX])/.exec(t)
  if (pre) { b = { B: 2, O: 8, X: 16 }[pre[1]]; t = t.slice(2) }
  if (!t) return { errore: 'scrivi un numero' }
  const [ip, fp = '', ...altro] = t.split(/[.,]/)
  if (altro.length) return { errore: 'una virgola sola' }
  let int = 0n
  for (const c of ip || '0') {
    const v = CIFRE.indexOf(c)
    if (v < 0 || v >= b) return { errore: `«${c}» non è una cifra in base ${b}` }
    int = int * BigInt(b) + BigInt(v)
  }
  let fn = 0n, fd = 1n
  for (const c of fp) {
    const v = CIFRE.indexOf(c)
    if (v < 0 || v >= b) return { errore: `«${c}» non è una cifra in base ${b}` }
    fn = fn * BigInt(b) + BigInt(v); fd *= BigInt(b)
  }
  return { neg, int, fn, fd, fraz: fn > 0n, cifreFraz: fp.length, b }
}

/** L'intero in base b. */
export const intIn = (n, b) => n.toString(b).toUpperCase()
/** La parte frazionaria in base b, per moltiplicazioni successive, esatta: { cifre, finita } (non finita: periodica). */
export function frazIn(x, b) {
  let n = x.fn, cifre = ''
  for (let i = 0; i < MAX_FRAZ && n > 0n; i++) { n *= BigInt(b); cifre += CIFRE[Number(n / x.fd)]; n %= x.fd }
  return { cifre, finita: n === 0n }
}
/** Le cifre a gruppi per leggerle (4 per binari ed esadecimali, 3 per ottali e decimali), dalla destra. */
export const gruppi = (s, n) => s.replace(new RegExp(`\\B(?=(.{${n}})+$)`, 'g'), ' ')
export const passo = (b) => (b === 2 || b === 16 ? 4 : 3)

export function scritto(x, b) {
  const i = intIn(x.int, b), f = x.fraz ? frazIn(x, b) : null
  return { testo: `${x.neg ? '-' : ''}${i}${f ? `.${f.cifre}` : ''}`, vista: `${x.neg ? '−' : ''}${gruppi(i, passo(b))}${f ? `,${f.cifre}${f.finita ? '' : '…'}` : ''}` }
}

/** Il complemento a 2 su n bit: il pattern (BigInt) o null se il numero non ci sta. */
export function c2(x, n) {
  if (x.fraz) return null
  const v = x.neg ? -x.int : x.int, min = -(1n << BigInt(n - 1)), max = (1n << BigInt(n)) - 1n
  if (v < min || v > max) return null
  return v < 0 ? (1n << BigInt(n)) + v : v
}

// ── come si fa ── (29.10: i passi sono dati, { p } { nota } { tab, testa } { fine }, che bin·hex di pzk os,
// telefono/zero/os/conversioni.js, disegna a modo suo. Nei testi ci sono solo <b> e <sup>)
/** I passi per scrivere x nella base a: [{ p } | { nota } | { tab: righe, testa? } | { fine }]. */
export function passi(x, a) {
  if (x.errore) return []
  const da = x.b
  if (da === a) return [{ nota: 'è già in questa base: scegline un’altra.' }]
  const out = []
  // da o verso il binario, fra 2, 8 e 16: i gruppi di bit
  const pot2 = (b) => b === 2 || b === 8 || b === 16
  if (pot2(da) && pot2(a) && !x.fraz) {
    const bin = intIn(x.int, 2)
    if (da !== 2) out.push({ p: `ogni cifra ${NOME[da]} diventa ${Math.log2(da)} bit:` }, { tab: intIn(x.int, da).split('').map((c) => [c, CIFRE.indexOf(c).toString(2).padStart(Math.log2(da), '0')]) })
    if (a !== 2) {
      const n = Math.log2(a), pad = bin.padStart(Math.ceil(bin.length / n) * n, '0'), g = pad.match(new RegExp(`.{${n}}`, 'g'))
      out.push({ p: `i bit a gruppi di ${n} da destra (con gli zeri davanti), ogni gruppo è una cifra ${NOME[a]}:` }, { tab: g.map((x) => [x, CIFRE[parseInt(x, 2)]]) })
    }
    out.push({ fine: `= <b>${scritto(x, a).vista}</b> in ${NOME[a]}` })
    return out
  }
  // verso il decimale: la somma delle cifre per le potenze della base
  if (a === 10) {
    const ci = intIn(x.int, da), cf = x.fraz ? frazIn(x, da).cifre.slice(0, x.cifreFraz || MAX_FRAZ) : ''
    const termini = [...ci].map((c, i) => [c, ci.length - 1 - i]).concat([...cf].map((c, i) => [c, -(i + 1)])).filter(([c]) => c !== '0')
    out.push({ p: `ogni cifra per la sua potenza di ${da}, e si somma:` }, { tab: termini.slice(0, 40).map(([c, e]) => [`${c} × ${da}<sup>${e}</sup>`, fmt(CIFRE.indexOf(c) * da ** e)]) })
    if (termini.length > 40) out.push({ nota: '…e le altre, uguali.' })
    out.push({ fine: `= <b>${scritto(x, 10).vista}</b>` })
    return out
  }
  // dal decimale (o passando dal decimale): le divisioni successive, i resti letti dal basso
  if (da !== 10) out.push({ p: `prima in decimale (la somma delle potenze di ${da}): <b>${scritto(x, 10).vista}</b>; poi:` })
  const div = []
  for (let n = x.int; n > 0n && div.length < 70; n /= BigInt(a)) div.push([`${n} : ${a}`, `${n / BigInt(a)}`, CIFRE[Number(n % BigInt(a))]])
  out.push({ p: `la parte intera si divide per ${a} finché resta 0; i resti, letti dal <b>basso</b> in alto, sono le cifre:` }, { tab: div.length ? div : [['0', '0', '0']], testa: ['divisione', 'quoziente', 'resto'] })
  if (x.fraz) {
    const mol = []
    let n = x.fn
    for (let i = 0; i < 12 && n > 0n; i++) { const p = n * BigInt(a); mol.push([`${fmtQ(n, x.fd)} × ${a}`, fmtQ(p, x.fd), CIFRE[Number(p / x.fd)]]); n = p % x.fd }
    out.push({ p: `la parte dopo la virgola si moltiplica per ${a}: la parte intera di ogni prodotto è una cifra, letta dall’<b>alto</b> in basso${n ? ' (qui non finisce mai: è periodica, ci si ferma)' : ''}:` }, { tab: mol, testa: ['moltiplicazione', 'prodotto', 'cifra'] })
  }
  out.push({ fine: `= <b>${scritto(x, a).vista}</b> in ${NOME[a]}` })
  return out
}
const fmtQ = (n, d) => fmt(Number(n) / Number(d))
const fmt = (n) => Number(n.toFixed(10)).toLocaleString('it-IT', { maximumFractionDigits: 10 })
