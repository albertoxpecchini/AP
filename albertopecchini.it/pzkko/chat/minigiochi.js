// I minigiochi del turno di lavoro (comandi/lavoro.js). Le parole da riscrivere stanno su una tela (canvas), così non si
// copiano.
// (31.10) DAL 31.10 LI PREPARA E LI GIUDICA LA BANCA (giochi/chat-lavoro.mjs): la frase, le parole, i colori, la sequenza
// arrivano dalla banca quando apre il turno ('chat.turno'); qui si mostrano coi loro tempi e si raccoglie la risposta,
// che torna alla banca. Le risposte giuste non passano mai di qui prima della risposta. Ognuno: async (ctx, prova) →
// la risposta (testo, id, sequenza; null allo scadere). Il nastro parla da sé con la banca, un pezzo alla volta, e torna
// la sua ultima risposta.
import { COLORI, UFFICIO } from './testi.js'
import { icona } from './icone.js'

export const normalizza = (s) => String(s ?? '').normalize('NFC').toLowerCase().replace(/[’']/g, '\'').replace(/\s+/g, ' ').trim()
const mescola = (a) => [...a].sort(() => Math.random() - 0.5) // (solo l'ordine dei tasti sullo schermo)

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
/** Aspetta che si scriva la risposta entro ms (la barra del tempo parte quando la domanda si legge tutta). → testo o null */
async function chiedi(ctx, s, ms, { segnaposto = 'scrivi qui…' } = {}) {
  const ferma = ctx.tempo(s, ms)
  await ctx.inVista(s)
  const r = await ctx.scrivi(ms, { segnaposto })
  ferma()
  return r
}
/** I tasti in fila, premuti uno dopo l'altro fino a `quanti`: → la sequenza, o null allo scadere. */
async function sequenza(ctx, s, voci, quanti, ms, ogni = () => {}) {
  const premute = []
  const ferma = ctx.tempo(s, ms)
  const r = await ctx.scegli(s, voci, ms, { onPremuto: (id, b) => { premute.push(id); b.classList?.add('premuto'); ogni(premute); return premute.length >= quanti ? 'fine' : 'continua' } })
  ferma()
  return r === null ? null : premute
}

export const MINIGIOCHI = {
  /** riscrivi la frase (sta su tela) */
  async riscrivi(ctx, p) {
    const s = ctx.dì({ colore: 'blu', t: 'riscrivi la frase', d: 'esatta, in 15 secondi (niente copia e incolla: è un disegno).' })
    suTela(s, p.frase)
    return chiedi(ctx, s, p.ms)
  },
  /** l'anagramma */
  async anagramma(ctx, p) {
    const s = ctx.dì({ colore: 'blu', t: 'anagramma', d: `rimetti in ordine le lettere, in 15 secondi: <b>${p.lettere}</b>` })
    return chiedi(ctx, s, p.ms)
  },
  /** memoria: cinque parole per 4 secondi, poi in ordine */
  async memoria(ctx, p) {
    const s = ctx.dì({ colore: 'blu', t: 'memoria', d: `ricorda queste cinque, nell’ordine: <b>${p.parole.join(' · ')}</b>` })
    await ctx.inVista(s, p.mostra)
    ctx.aggiorna(s, { colore: 'blu', t: 'memoria', d: 'adesso scrivile tu, nell’ordine, separate da uno spazio. 20 secondi.' })
    const ferma = ctx.tempo(s, p.ms)
    const r = await ctx.scrivi(p.ms, { segnaposto: 'parola parola parola…' })
    ferma()
    return r
  },
  /** colori: quattro parole colorate, poi «di che colore era X?» */
  async colori(ctx, p) {
    const s = ctx.dì({ colore: 'blu', t: 'i colori', html: `<p>guarda bene, 4 secondi: ${p.parole.map((w, i) => `<b style="color:${p.colori[i][1]}">${w}</b>`).join(' · ')}</p>` })
    await ctx.inVista(s, p.mostra)
    ctx.aggiorna(s, { colore: 'blu', t: 'i colori', d: `di che colore era <b>${p.parole[p.k]}</b>?` })
    const ferma = ctx.tempo(s, p.ms)
    const r = await ctx.scegli(s, mescola(COLORI).map(([n]) => ({ id: n, eti: n, stile: 'nero' })), p.ms)
    ferma()
    return r
  },
  /** icona: una vista 2 secondi, poi scegli fra cinque */
  async icona(ctx, p) {
    const s = ctx.dì({ colore: 'blu', t: 'occhio', html: `<p>guarda, 2 secondi: ${ctx.icona(p.giusta, 'emo grande')}</p>` })
    await ctx.inVista(s, p.mostra)
    ctx.aggiorna(s, { colore: 'blu', t: 'occhio', d: 'qual era?' })
    const ferma = ctx.tempo(s, p.ms)
    const r = await ctx.scegli(s, p.scelte.map((i) => ({ id: i, eti: `:${i}:`, stile: 'nero quadro' })), p.ms)
    ferma()
    return r
  },
  /** calcio: tira dove il portiere non c'è (dove si butta lo decide la banca dopo il tiro) */
  async calcio(ctx, p) {
    const s = ctx.dì({ colore: 'blu', t: 'rigore', d: 'dove tiri? Il portiere si butta da una parte.' })
    const ferma = ctx.tempo(s, p.ms)
    const r = await ctx.scegli(s, ['sinistra', 'centro', 'destra'].map((d) => ({ id: d, eti: d, stile: 'nero' })), p.ms)
    ferma()
    return r
  },
  /** al contrario: la parola rovesciata */
  async contrario(ctx, p) {
    const s = ctx.dì({ colore: 'blu', t: 'al contrario', d: `scrivi la parola giusta, questa è rovesciata: <b>${p.rovescia}</b>. 12 secondi.` })
    return chiedi(ctx, s, p.ms)
  },
  /** veloce: la parola compare dopo un'attesa a caso, riscrivila subito */
  async veloce(ctx, p) {
    const s = ctx.dì({ colore: 'blu', av: 'bot-pensa', t: 'pronti…', d: 'appena compare la parola, riscrivila.' })
    await ctx.inVista(s, p.ritardo)
    ctx.aggiorna(s, { colore: 'ambra', av: 'bot-arrabbiato', t: 'VIA!', d: '' })
    suTela(s, p.parola)
    return chiedi(ctx, s, p.ms)
  },
  /** conti: due numeri */
  async conti(ctx, p) {
    const s = ctx.dì({ colore: 'blu', t: 'conti', d: `quanto fa <b>${p.testo}</b>? 12 secondi.` })
    return chiedi(ctx, s, p.ms, { segnaposto: 'il risultato' })
  },
  /** ordine: l'ordinazione del cliente, premi i pulsanti nello stesso ordine */
  async ordine(ctx, p) {
    const s = ctx.dì({ colore: 'blu', t: 'l’ordinazione', html: `<p>il cliente vuole, in quest’ordine (3 secondi): ${p.seq.map((i) => ctx.icona(i, 'emo grande')).join(' ')}</p>` })
    await ctx.inVista(s, p.mostra)
    ctx.aggiorna(s, { colore: 'blu', t: 'l’ordinazione', d: 'premi le tre cose nello stesso ordine.' })
    return sequenza(ctx, s, p.voci.map((i) => ({ id: i, eti: `:${i}:`, stile: 'nero quadro' })), p.seq.length, p.ms)
  },
  /** strada: le svolte per arrivare alla consegna. Mentre le rifai, sotto compaiono quelle già fatte (1/4, 2/4…). */
  async strada(ctx, p) {
    const s = ctx.dì({ colore: 'blu', t: 'la consegna', d: `la strada, 3 secondi: <b>${p.seq.join(' → ')}</b>` })
    await ctx.inVista(s, p.mostra)
    ctx.aggiorna(s, { colore: 'blu', t: 'la consegna', d: 'rifai le quattro svolte, in ordine.', html: '<p class="c-testo" data-fatte>fatte 0/4</p>' })
    const fatte = s.querySelector('[data-fatte]')
    return sequenza(ctx, s, ['sinistra', 'dritto', 'destra'].map((d) => ({ id: d, eti: d, stile: 'nero' })), p.seq.length, p.ms, (premute) => { fatte.innerHTML = `fatte ${premute.length}/4: <b>${premute.join(' → ')}</b>` })
  },
  /** quiz: una domanda, quattro risposte (la giusta la sa la banca) */
  async quiz(ctx, p) {
    const s = ctx.dì({ colore: 'blu', t: `:quiz: quiz ${['', 'facile', 'medio', 'difficile'][p.diff]}`, d: p.domanda })
    const ferma = ctx.tempo(s, p.ms)
    const r = await ctx.scegli(s, p.risposte.map((x) => ({ id: x, eti: x, stile: 'nero' })), p.ms)
    ferma()
    return r
  },
  /** nastro (26.10, lo spazzino di uffici): sul nastro passano 12 cose, una alla volta, un secondo ciascuna. Si tiene (→,
   *  trascinando a destra o in su, il tasto «tieni») o si butta (←, a sinistra o in giù, «butta»); chi non decide la butta.
   *  Si tengono al più TRE cose: dopo, le altre si guardano passare, anche se valgono di più.
   *  (31.10, Alberto: «decifra un wallet devi farlo se hai un wallet») I PEZZI LI DÀ LA BANCA, UNO ALLA VOLTA ('chat.nastro'):
   *  a fine finestra la decisione sul pezzo che passa va alla banca, e la risposta porta il pezzo dopo (mentre questo esce,
   *  260 ms: il ritmo è quello di prima). Quello che viene dopo qui non si sa mai prima. In tasca va quello che la banca dice
   *  tenuto; all'ultimo pezzo la banca chiude il turno. → la sua ultima risposta (il turno: paga, o presi) */
  async nastro(ctx, p) {
    const MAX = p.max, N = p.n, FINESTRA = p.finestra
    const s = ctx.dì({ colore: 'blu', t: ':sacco: il nastro dei cestini', d: 'tieni o butta, un secondo a pezzo. tre posti in tasca: una volta pieni, il resto lo guardi passare.' })
    const box = document.createElement('div')
    box.className = 'c-nastro'
    box.tabIndex = 0
    box.innerHTML = `<div class="c-nastro-tasche">${'<i></i>'.repeat(MAX)}</div><div class="c-nastro-nastro"><div class="c-nastro-pezzo"></div><i class="c-nastro-tempo"></i></div>
      <div class="c-nastro-tasti"><button type="button" class="c-b nero" data-v="butta">← butta</button><span class="c-nastro-conta">0/${N}</span><button type="button" class="c-b" data-v="tieni">tieni →</button></div>`
    s.appendChild(box)
    await ctx.inVista(s, 600)
    const pezzo = box.querySelector('.c-nastro-pezzo'), tempo = box.querySelector('.c-nastro-tempo'), tasche = [...box.querySelectorAll('.c-nastro-tasche i')], conta = box.querySelector('.c-nastro-conta')
    let tenuti = 0, scelta = null, sveglia = null
    const decidi = (v) => { if (scelta || !sveglia) return; if (v === 'tieni' && tenuti >= MAX) return; scelta = v; sveglia() }
    box.addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (b) decidi(b.dataset.v) })
    const tasto = (e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); decidi('tieni') } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); decidi('butta') } }
    document.addEventListener('keydown', tasto)
    let x0 = null, y0 = null
    box.addEventListener('pointerdown', (e) => { if (e.target.closest('button')) return; x0 = e.clientX; y0 = e.clientY })
    box.addEventListener('pointerup', (e) => {
      if (x0 === null) return
      const dx = e.clientX - x0, dy = e.clientY - y0
      x0 = null
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 28) return
      decidi(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'tieni' : 'butta') : dy < 0 ? 'tieni' : 'butta')
    })
    box.focus({ preventScroll: true })
    const aspetta = (ms) => new Promise((ok) => { const t = setTimeout(ok, ms); sveglia = () => { clearTimeout(t); ok() } })
    const dormi = (ms) => new Promise((ok) => setTimeout(ok, ms))
    // la decisione alla banca (se il pezzo dopo non è ancora arrivato, un attimo e si riprova: la rete può essere svelta)
    const manda = async (i, tieni) => { for (let k = 0; ; k++) { const r = await ctx.fai('chat.nastro', { i, tieni }); if (r.ok || !r.presto || k >= 5) return r; await dormi(150) } }
    let r = await ctx.fai('chat.nastro', {}) // il primo pezzo
    while (r.ok && !r.esito.fine) {
      const { i, id } = r.esito
      const x = UFFICIO.find((y) => y.id === id) ?? { id, nome: id, vale: 0 }
      const pieno = tenuti >= MAX
      box.classList.toggle('pieno', pieno)
      conta.textContent = `${i + 1}/${N}`
      pezzo.className = 'c-nastro-pezzo entra' + (x.sospetto ? ' sospetto' : '')
      pezzo.innerHTML = `${icona(x.id, 'emo')}<b>${x.nome.replace(/^(un’|un |una |uno |delle |degli |dei )/i, '')}</b>${x.sospetto ? '<small>⚠ roba che scotta</small>' : x.vale ? `<small>vale ${x.vale}</small>` : ''}`
      tempo.style.animation = 'none'; void tempo.offsetWidth; tempo.style.animation = `c-nastro-tempo ${FINESTRA}ms linear forwards`
      scelta = null
      await aspetta(FINESTRA)
      sveglia = null
      const tieni = !pieno && scelta === 'tieni'
      pezzo.className = 'c-nastro-pezzo ' + (tieni ? 'preso' : pieno ? 'passa' : 'via')
      ;[r] = await Promise.all([manda(i, tieni), dormi(260)])
      if (r.ok && r.esito.tenuto) { tasche[tenuti].innerHTML = icona(x.id, 'emo'); tasche[tenuti].classList.add('piena'); tenuti++ }
    }
    document.removeEventListener('keydown', tasto)
    box.classList.add('finito')
    pezzo.innerHTML = ''
    return r
  },

}
