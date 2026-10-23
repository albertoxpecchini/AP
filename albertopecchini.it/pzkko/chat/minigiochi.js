// I minigiochi: quelli del turno di lavoro (comandi/lavoro.js) e quelli che sono comandi (quiz, veloce in comandi/giochi.js).
// Ognuno: async (ctx) → { ok, nota, tempo? }. Le parole da riscrivere stanno su una tela (canvas), così non si copiano.
import { PAROLE, FRASI, COLORI, QUIZ } from './testi.js'
import { FOGLI_CHAT } from './icone.js'

export const normalizza = (s) => String(s ?? '').normalize('NFC').toLowerCase().replace(/[’']/g, '\'').replace(/\s+/g, ' ').trim()
const mescola = (a) => [...a].sort(() => Math.random() - 0.5)
const ICONE_FACILI = [...FOGLI_CHAT['chat-attrezzi'], ...FOGLI_CHAT['chat-pesci'], ...FOGLI_CHAT['chat-animali'], ...FOGLI_CHAT['chat-slot']]

/** Scrive un testo su una tela dentro la scheda (così non si seleziona né si incolla). */
export function suTela(s, testo) {
  const c = document.createElement('canvas')
  c.className = 'c-parola'
  const dpr = Math.min(2, devicePixelRatio || 1)
  c.width = 440 * dpr; c.height = 44 * dpr
  c.style.width = '440px'
  const g = c.getContext('2d')
  g.scale(dpr, dpr)
  g.fillStyle = '#0a0d0a'; g.fillRect(0, 0, 440, 44)
  g.font = `400 ${testo.length > 28 ? 17 : 22}px "Permanent Marker", cursive`
  g.fillStyle = '#ffd400'
  g.textBaseline = 'middle'
  // leggermente storto e con un filo di rumore: le lettere si leggono, il copia e incolla no
  g.save(); g.translate(10, 22); g.rotate(-0.012); g.fillText(testo, 0, 0); g.restore()
  g.strokeStyle = 'rgba(70,255,125,.35)'
  for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(Math.random() * 440, Math.random() * 44); g.lineTo(Math.random() * 440, Math.random() * 44); g.stroke() }
  s.appendChild(c)
  return c
}
/** Chiede di scrivere `atteso` entro ms: → { ok, nota, tempo } */
async function chiedi(ctx, s, atteso, ms, { segnaposto = 'scrivi qui…' } = {}) {
  const ferma = ctx.tempo(s, ms)
  await ctx.inVista(s) // il tempo parte quando la domanda si legge tutta, insieme alla barra
  const t0 = performance.now()
  const r = await ctx.scrivi(ms, { segnaposto })
  ferma()
  const tempo = performance.now() - t0
  if (r === null) return { ok: false, nota: 'tempo scaduto.', tempo }
  const ok = normalizza(r) === normalizza(atteso)
  return { ok, nota: ok ? `giusto, in ${(tempo / 1000).toFixed(1)} s.` : `no: era «${atteso}».`, tempo }
}

export const MINIGIOCHI = {
  /** riscrivi la frase (sta su tela) */
  async riscrivi(ctx) {
    const f = ctx.caso(FRASI)
    const s = ctx.dì({ colore: 'blu', t: 'riscrivi la frase', d: 'esatta, in 15 secondi (niente copia e incolla: è un disegno).' })
    suTela(s, f)
    return chiedi(ctx, s, f, 15000)
  },
  /** l'anagramma */
  async anagramma(ctx) {
    const p = ctx.caso(PAROLE.filter((x) => x.length >= 5 && x.length <= 10))
    let m = p
    while (normalizza(m) === normalizza(p)) m = mescola(p.toLowerCase()).join('')
    const s = ctx.dì({ colore: 'blu', t: 'anagramma', d: `rimetti in ordine le lettere, in 15 secondi: <b>${m}</b>` })
    return chiedi(ctx, s, p, 15000)
  },
  /** memoria: cinque parole per 4 secondi, poi in ordine */
  async memoria(ctx) {
    const cinque = mescola(PAROLE).slice(0, 5).map((x) => x.toLowerCase())
    const s = ctx.dì({ colore: 'blu', t: 'memoria', d: `ricorda queste cinque, nell’ordine: <b>${cinque.join(' · ')}</b>` })
    await ctx.inVista(s, 4000)
    ctx.aggiorna(s, { colore: 'blu', t: 'memoria', d: 'adesso scrivile tu, nell’ordine, separate da uno spazio. 20 secondi.' })
    const ferma = ctx.tempo(s, 20000)
    const r = await ctx.scrivi(20000, { segnaposto: 'parola parola parola…' })
    ferma()
    if (r === null) return { ok: false, nota: 'tempo scaduto.' }
    const date = normalizza(r).split(' ')
    const giuste = cinque.filter((p, i) => date[i] === p).length
    return { ok: giuste >= 4, nota: `${giuste} su 5 al posto giusto${giuste >= 4 ? '.' : `: erano ${cinque.join(', ')}.`}` }
  },
  /** colori: quattro parole colorate, poi «di che colore era X?» */
  async colori(ctx) {
    const parole = mescola(PAROLE).slice(0, 4), colori = mescola(COLORI).slice(0, 4)
    const s = ctx.dì({ colore: 'blu', t: 'i colori', html: `<p>guarda bene, 4 secondi: ${parole.map((p, i) => `<b style="color:${colori[i][1]}">${p}</b>`).join(' · ')}</p>` })
    await ctx.inVista(s, 4000)
    const k = ctx.rnd(4)
    ctx.aggiorna(s, { colore: 'blu', t: 'i colori', d: `di che colore era <b>${parole[k]}</b>?` })
    const ferma = ctx.tempo(s, 8000)
    const r = await ctx.scegli(s, mescola(COLORI).map(([n]) => ({ id: n, eti: n, stile: 'nero' })), 8000)
    ferma()
    return { ok: r === colori[k][0], nota: r === null ? 'tempo scaduto.' : r === colori[k][0] ? 'giusto.' : `no: era ${colori[k][0]}.` }
  },
  /** icona: una vista 2 secondi, poi scegli fra cinque */
  async icona(ctx) {
    const cinque = mescola(ICONE_FACILI).slice(0, 5), giusta = cinque[0]
    const s = ctx.dì({ colore: 'blu', t: 'occhio', html: `<p>guarda, 2 secondi: ${ctx.icona(giusta, 'emo grande')}</p>` })
    await ctx.inVista(s, 2000)
    ctx.aggiorna(s, { colore: 'blu', t: 'occhio', d: 'qual era?' })
    const ferma = ctx.tempo(s, 8000)
    const r = await ctx.scegli(s, mescola(cinque).map((i) => ({ id: i, eti: `:${i}:`, stile: 'nero quadro' })), 8000)
    ferma()
    return { ok: r === giusta, nota: r === giusta ? 'giusto.' : `no: era :${giusta}:.` }
  },
  /** calcio: tira dove il portiere non c'è */
  async calcio(ctx) {
    const DIR = ['sinistra', 'centro', 'destra']
    const s = ctx.dì({ colore: 'blu', t: 'rigore', d: 'dove tiri? Il portiere si butta da una parte.' })
    const ferma = ctx.tempo(s, 8000)
    const r = await ctx.scegli(s, DIR.map((d) => ({ id: d, eti: d, stile: 'nero' })), 8000)
    ferma()
    if (r === null) return { ok: false, nota: 'non hai tirato.' }
    const portiere = ctx.caso(DIR)
    return { ok: r !== portiere, nota: r !== portiere ? `gol! Il portiere è andato a ${portiere}.` : `parato: il portiere era proprio a ${portiere}.` }
  },
  /** al contrario: la parola rovesciata */
  async contrario(ctx) {
    const p = ctx.caso(PAROLE).toLowerCase()
    const s = ctx.dì({ colore: 'blu', t: 'al contrario', d: `scrivi la parola giusta, questa è rovesciata: <b>${[...p].reverse().join('')}</b>. 12 secondi.` })
    return chiedi(ctx, s, p, 12000)
  },
  /** veloce: la parola compare dopo un'attesa a caso, riscrivila subito */
  async veloce(ctx) {
    const p = ctx.caso(PAROLE)
    const s = ctx.dì({ colore: 'blu', av: 'bot-pensa', t: 'pronti…', d: 'appena compare la parola, riscrivila.' })
    await ctx.inVista(s, ctx.tra(1200, 4500))
    ctx.aggiorna(s, { colore: 'ambra', av: 'bot-arrabbiato', t: 'VIA!', d: '' })
    suTela(s, p)
    const r = await chiedi(ctx, s, p, 10000)
    return r
  },
  /** conti: due numeri */
  async conti(ctx) {
    const a = ctx.tra(11, 99), b = ctx.tra(11, 99), op = ctx.caso(['+', '-', '×'])
    const ris = op === '+' ? a + b : op === '-' ? a - b : a * (b % 10 + 2)
    const s = ctx.dì({ colore: 'blu', t: 'conti', d: `quanto fa <b>${a} ${op} ${op === '×' ? b % 10 + 2 : b}</b>? 12 secondi.` })
    return chiedi(ctx, s, String(ris), 12000, { segnaposto: 'il risultato' })
  },
  /** ordine: l'ordinazione del cliente, premi i pulsanti nello stesso ordine */
  async ordine(ctx) {
    const voci = mescola(FOGLI_CHAT['chat-slot']).slice(0, 4), seq = mescola(voci).slice(0, 3)
    const s = ctx.dì({ colore: 'blu', t: 'l’ordinazione', html: `<p>il cliente vuole, in quest’ordine (3 secondi): ${seq.map((i) => ctx.icona(i, 'emo grande')).join(' ')}</p>` })
    await ctx.inVista(s, 3000)
    ctx.aggiorna(s, { colore: 'blu', t: 'l’ordinazione', d: 'premi le tre cose nello stesso ordine.' })
    const premute = []
    const ferma = ctx.tempo(s, 10000)
    const r = await ctx.scegli(s, mescola(voci).map((i) => ({ id: i, eti: `:${i}:`, stile: 'nero quadro' })), 10000, { onPremuto: (id, b) => { premute.push(id); b.classList.add('premuto'); return premute.length >= 3 ? 'fine' : 'continua' } })
    ferma()
    const ok = r !== null && premute.every((p, i) => p === seq[i])
    return { ok, nota: ok ? 'tutto giusto.' : r === null ? 'tempo scaduto.' : 'ordine sbagliato: il cliente se ne va.' }
  },
  /** strada: le svolte per arrivare alla consegna. Mentre le rifai, sotto compaiono quelle già fatte (1/4, 2/4…). */
  async strada(ctx) {
    const FR = ['sinistra', 'dritto', 'destra'], seq = Array.from({ length: 4 }, () => ctx.caso(FR))
    const s = ctx.dì({ colore: 'blu', t: 'la consegna', d: `la strada, 3 secondi: <b>${seq.join(' → ')}</b>` })
    await ctx.inVista(s, 3000)
    ctx.aggiorna(s, { colore: 'blu', t: 'la consegna', d: 'rifai le quattro svolte, in ordine.', html: '<p class="c-testo" data-fatte>fatte 0/4</p>' })
    const fatte = s.querySelector('[data-fatte]')
    const premute = []
    const ferma = ctx.tempo(s, 10000)
    const r = await ctx.scegli(s, FR.map((d) => ({ id: d, eti: d, stile: 'nero' })), 10000, {
      onPremuto: (id) => {
        premute.push(id)
        fatte.innerHTML = `fatte ${premute.length}/4: <b>${premute.join(' → ')}</b>`
        return premute.length >= 4 ? 'fine' : 'continua'
      },
    })
    ferma()
    const ok = r !== null && premute.every((p, i) => p === seq[i])
    return { ok, nota: ok ? 'consegnato.' : r === null ? 'tempo scaduto.' : `ti sei perso: era ${seq.join(' → ')}.` }
  },
  /** quiz: una domanda, quattro risposte. diff: 1-3; → anche { diff } */
  async quiz(ctx, diff = null) {
    const d = diff ?? ctx.caso([1, 1, 2, 2, 3])
    const [dom, risp, difficolta] = ctx.caso(QUIZ.filter((q) => q[2] === d))
    const giusta = risp[0]
    const s = ctx.dì({ colore: 'blu', t: `:quiz: quiz ${['', 'facile', 'medio', 'difficile'][difficolta]}`, d: dom })
    const ferma = ctx.tempo(s, 12000)
    const r = await ctx.scegli(s, mescola(risp).map((x) => ({ id: x, eti: x, stile: 'nero' })), 12000)
    ferma()
    return { ok: r === giusta, nota: r === giusta ? 'giusto.' : r === null ? `tempo scaduto: era «${giusta}».` : `no: era «${giusta}».`, diff: difficolta }
  },
}
