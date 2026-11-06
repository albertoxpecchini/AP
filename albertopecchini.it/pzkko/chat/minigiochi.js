// I minigiochi del turno di lavoro (comandi/lavoro.js), RIFATTI DA CAPO il 6.11 per lo schermo del cercapersone zero.
// (6.11, Bighurra: «il lavoro è un po' buggato, non vedo cosa devo replicare»; Alberto: «rifarei da zero… aggiusta
// benissimo tutto ricreando».) Erano nati per la chat in HTML: un'immagine da ricordare, la frase disegnata su una tela, le
// parole colorate, una scatola col nastro dentro. Dal 31.10 la chat è solo quella a 8 bit di pzk os
// (telefono/zero/os/chat.js), che di una scheda disegna il testo e i tasti: l'icona da ricordare non c'era e i cinque tasti
// per rispondere erano cinque «?», l'ordinazione del barista era vuota, i colori su uno schermo a un bit non esistono, la
// frase su tela e il nastro non comparivano mai. E con «riduci animazioni» le cose da guardare duravano 150 ms.
//
// Le regole di adesso (valgono per ogni minigioco nuovo):
// - quello che c'è da guardare è TESTO, o le ICONE DELLA SCHEDA (il campo `icone`: pzk os le disegna a un bit, in un
//   riquadro), sempre col nome scritto accanto: se l'immagine tarda, il gioco si fa lo stesso;
// - ogni risposta si dà COI SEI TASTI o col clic: i pezzi (le parole, le lettere, le cifre) sono tasti da premere in ordine,
//   e sotto la domanda si legge quello che si è composto. Chi ha la tastiera vera può anche scrivere la risposta e Invio:
//   vale quella che arriva prima (componi, qui sotto);
// - i tempi da guardare sono tempi veri (aspetta): ctx.dormi è per le animazioni, e «riduci animazioni» lo taglia a 150 ms;
// - le prove le prepara e le giudica la banca (giochi/chat-lavoro.mjs, 'chat.turno'): la frase, le parole, la sequenza
//   arrivano da lei quando apre il turno, qui si mostrano e si raccoglie la risposta. Le risposte giuste non passano mai di
//   qui prima della risposta. Ognuno: async (ctx, prova) → la risposta (testo, id, lista; null allo scadere). Il nastro
//   parla da sé con la banca, un pezzo alla volta, e torna la sua ultima risposta.
// Il collaudo: node tools/pzkko/zero/prova.mjs --turni (tutti e tredici, con la banca vera in memoria, coi sei tasti).
import { COLORI, UFFICIO } from './testi.js'
import { FOGLI_CHAT } from './icone.js'

export const normalizza = (s) => String(s ?? '').normalize('NFC').toLowerCase().replace(/[’']/g, '\'').replace(/\s+/g, ' ').trim()
/** Mescola una copia (solo l'ordine dei tasti sullo schermo: il caso che conta è della banca). */
function mescola(a) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a }
/** Un tempo vero, da guardare o da rispettare con la banca (mai accorciato da «riduci animazioni»). */
export const aspetta = (ms) => new Promise((r) => setTimeout(r, ms))
/** Il nome di un'icona come si legge: «cassa-comune» → «cassa comune». */
const nomeDi = (id) => String(id).replaceAll('-', ' ')
const secondi = (ms) => Math.round(ms / 1000)

/** Le icone che un turno può mostrare (quelle da ricordare, la slot, la roba degli uffici): si chiedono prima che la banca
 *  apra il turno, così quando serve l'immagine c'è già. Non aspetta niente. */
export function prepara(ctx) {
  ctx.caricaIcone?.(['chat-attrezzi', 'chat-pesci', 'chat-animali', 'chat-slot'].flatMap((f) => FOGLI_CHAT[f]), 32)
  ctx.caricaIcone?.([...FOGLI_CHAT['chat-slot'], ...FOGLI_CHAT['chat-ufficio']], 16)
}

/**
 * LA RISPOSTA FATTA DI PEZZI. I tasti si premono in ordine e sotto la domanda si legge quello che si è composto («› la
 * nutria non…»). Un pezzo premuto si spegne (cornice a puntini) e la croce passa al prossimo; ⌫ rimette l'ultimo.
 *   pezzi: [{ v: il valore, eti: sul tasto, id: l'id del tasto (per le direzioni: sinistra, dritto, destra) }]
 *   fino: quanti ne servono (poi finisce da sé) · conferma: finisce col tasto ✓ · riusa: i tasti non si spengono (le
 *   cifre, le svolte) · cancella: c'è ⌫ · scritta: la tastiera vera può scrivere la risposta intera · come: i valori → il testo
 * → i valori premuti (una lista), il testo scritto (una stringa), o null allo scadere.
 */
async function componi(ctx, s, e, pezzi, ms, { fino = pezzi.length, conferma = false, riusa = false, cancella = true, scritta = false, come = (v) => v.join(' ') } = {}) {
  const messi = [] // i pezzi premuti (i loro posti), in ordine
  const valori = () => messi.map((i) => pezzi[i].v)
  const vista = () => ({ ...e, d: `${e.d}\n› <b>${come(valori()) || '…'}</b>` })
  const idDi = (i) => pezzi[i].id ?? `p${i}`
  ctx.aggiorna(s, vista())
  const ferma = ctx.tempo(s, ms)
  const tasti = [...pezzi.map((p, i) => ({ id: idDi(i), eti: p.eti ?? String(p.v), stile: 'nero' })), ...(cancella ? [{ id: 'via', eti: '⌫' }] : []), ...(conferma ? [{ id: 'fatto', eti: '✓' }] : [])]
  const premuti = ctx.scegli(s, tasti, ms, { onPremuto(id, b, riga) {
    if (id === 'fatto') return messi.length ? { v: valori() } : 'continua'
    if (id === 'via') {
      const i = messi.pop()
      const t = i !== undefined && !riusa ? riga.querySelector(`[data-id="${idDi(i)}"]`) : null
      if (t) { t.disabled = false; t.classList.remove('usato') }
    } else {
      messi.push(pezzi.findIndex((_, i) => idDi(i) === id))
      if (!riusa) { b.disabled = true; b.classList.add('usato') }
    }
    ctx.aggiorna(s, vista())
    return !conferma && messi.length >= fino ? { v: valori() } : 'continua'
  } })
  const scritto = scritta ? ctx.scrivi(ms, { segnaposto: 'o scrivila' }).then((t) => (t == null ? null : { t })) : new Promise(() => {})
  const r = await Promise.race([premuti, scritto])
  ferma()
  ctx.smetti(s) // (chi ha risposto in un modo spegne l'altro: i tasti, o la riga che aspettava)
  return r == null ? null : r.t ?? r.v
}
/** Una risposta che è un testo: i pezzi premuti, uniti (o la risposta scritta). → il testo o null */
async function testo(ctx, s, e, pezzi, ms, unisci, opz = {}) {
  const r = await componi(ctx, s, e, pezzi.map((v) => ({ v })), ms, { scritta: true, come: (v) => v.join(unisci), ...opz })
  return Array.isArray(r) ? r.join(unisci) : r
}

export const MINIGIOCHI = {
  /** riscrivi la frase: le sue parole, mescolate, da rimettere in fila */
  async riscrivi(ctx, p) {
    const e = { colore: 'blu', t: 'riscrivi la frase', d: `rimetti in fila le parole, in ${secondi(p.ms)} secondi:\n<b>${p.frase}</b>` }
    const s = ctx.dì(e)
    await ctx.inVista(s)
    return testo(ctx, s, e, mescola(p.frase.split(' ')), p.ms, ' ')
  },
  /** l'anagramma: le lettere nell'ordine giusto */
  async anagramma(ctx, p) {
    const e = { colore: 'blu', t: 'anagramma', d: `che parola è <b>${p.lettere}</b>? premi le lettere nell’ordine giusto. ${secondi(p.ms)} secondi.` }
    const s = ctx.dì(e)
    await ctx.inVista(s)
    return testo(ctx, s, e, [...p.lettere], p.ms, '')
  },
  /** memoria: cinque parole per 4 secondi, poi in ordine */
  async memoria(ctx, p) {
    const s = ctx.dì({ colore: 'blu', t: 'memoria', d: `ricorda queste cinque, nell’ordine (${secondi(p.mostra)} secondi):\n<b>${p.parole.join(' · ')}</b>` })
    await ctx.inVista(s)
    await aspetta(p.mostra)
    return testo(ctx, s, { colore: 'blu', t: 'memoria', d: `adesso premile nell’ordine di prima. ${secondi(p.ms)} secondi.` }, mescola(p.parole), p.ms, ' ')
  },
  /** colori: quattro parole, ognuna col suo colore (scritto: lo schermo è a un bit), poi «di che colore era X?» */
  async colori(ctx, p) {
    const s = ctx.dì({ colore: 'blu', t: 'i colori', d: `ricorda il colore di ogni parola (${secondi(p.mostra)} secondi):\n${p.parole.map((w, i) => `<b>${w}</b> → ${p.colori[i][0]}`).join('\n')}` })
    await ctx.inVista(s)
    await aspetta(p.mostra)
    ctx.aggiorna(s, { colore: 'blu', t: 'i colori', d: `di che colore era <b>${p.parole[p.k]}</b>?` })
    const ferma = ctx.tempo(s, p.ms)
    const r = await ctx.scegli(s, mescola(COLORI).map(([n]) => ({ id: n, eti: n, stile: 'nero' })), p.ms)
    ferma()
    return r
  },
  /** icona: una cosa vista 2 secondi (il disegno e il nome), poi quale era fra cinque */
  async icona(ctx, p) {
    const s = ctx.dì({ colore: 'blu', t: 'occhio', d: `guarda bene, ${secondi(p.mostra)} secondi: <b>${nomeDi(p.giusta)}</b>`, icone: [p.giusta], lato: 32 })
    await ctx.inVista(s)
    await aspetta(p.mostra)
    ctx.aggiorna(s, { colore: 'blu', t: 'occhio', d: 'qual era?' })
    const ferma = ctx.tempo(s, p.ms)
    const r = await ctx.scegli(s, p.scelte.map((i) => ({ id: i, eti: nomeDi(i), stile: 'nero' })), p.ms)
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
  /** al contrario: la parola rovesciata, le lettere si premono dall'ultima alla prima */
  async contrario(ctx, p) {
    const e = { colore: 'blu', t: 'al contrario', d: `questa parola è scritta al contrario: <b>${p.rovescia}</b>. Premi le lettere dall’ultima alla prima. ${secondi(p.ms)} secondi.` }
    const s = ctx.dì(e)
    await ctx.inVista(s)
    return testo(ctx, s, e, [...p.rovescia], p.ms, '')
  },
  /** veloce: la parola compare dopo un'attesa a caso, e diventa un tasto: si preme (o si riscrive) subito */
  async veloce(ctx, p) {
    const s = ctx.dì({ colore: 'blu', av: 'bot-pensa', t: 'pronti…', d: 'appena compare la parola, premila (o riscrivila).' })
    await ctx.inVista(s)
    await aspetta(p.ritardo)
    ctx.aggiorna(s, { colore: 'ambra', av: 'bot-arrabbiato', t: 'VIA!', d: `<b>${p.parola}</b>` })
    const ferma = ctx.tempo(s, p.ms)
    const r = await ctx.scrivi(p.ms, { segnaposto: p.parola })
    ferma()
    return r
  },
  /** conti: due numeri, il risultato a cifre (col meno davanti, se serve) e ✓ */
  async conti(ctx, p) {
    const e = { colore: 'blu', t: 'conti', d: `quanto fa <b>${p.testo}</b>? premi le cifre, poi ✓. ${secondi(p.ms)} secondi.` }
    const s = ctx.dì(e)
    await ctx.inVista(s)
    return testo(ctx, s, e, [...'0123456789-'], p.ms, '', { riusa: true, conferma: true })
  },
  /** ordine: l'ordinazione del cliente, le tre cose nello stesso ordine */
  async ordine(ctx, p) {
    const s = ctx.dì({ colore: 'blu', t: 'l’ordinazione', d: `il cliente vuole, in quest’ordine (${secondi(p.mostra)} secondi):\n<b>${p.seq.map(nomeDi).join(' → ')}</b>`, icone: p.seq })
    await ctx.inVista(s)
    await aspetta(p.mostra)
    return componi(ctx, s, { colore: 'blu', t: 'l’ordinazione', d: `premi le ${p.seq.length} cose nello stesso ordine.` }, p.voci.map((v) => ({ v, eti: nomeDi(v) })), p.ms, { fino: p.seq.length, come: (v) => v.map(nomeDi).join(' → ') })
  },
  /** strada: le svolte per arrivare alla consegna; le frecce premono subito la loro direzione (pzk os, scegli) */
  async strada(ctx, p) {
    const s = ctx.dì({ colore: 'blu', t: 'la consegna', d: `la strada, ${secondi(p.mostra)} secondi:\n<b>${p.seq.join(' → ')}</b>` })
    await ctx.inVista(s)
    await aspetta(p.mostra)
    return componi(ctx, s, { colore: 'blu', t: 'la consegna', d: `rifai le ${p.seq.length} svolte, in ordine.` }, ['sinistra', 'dritto', 'destra'].map((v) => ({ v, id: v })), p.ms, { fino: p.seq.length, riusa: true, cancella: false, come: (v) => v.join(' → ') })
  },
  /** quiz: una domanda, quattro risposte (la giusta la sa la banca) */
  async quiz(ctx, p) {
    const s = ctx.dì({ colore: 'blu', t: `:quiz: quiz ${['', 'facile', 'medio', 'difficile'][p.diff]}`, d: p.domanda })
    const ferma = ctx.tempo(s, p.ms)
    const r = await ctx.scegli(s, p.risposte.map((x) => ({ id: x, eti: x, stile: 'nero' })), p.ms)
    ferma()
    return r
  },
  /** nastro (26.10, lo spazzino di uffici): sul nastro passano 12 cose, una alla volta, un secondo ciascuna. → la tiene,
   *  ← la butta (le frecce premono subito; chi non decide la butta). In tasca ne stanno TRE: dopo, le altre si guardano
   *  passare, anche se valgono di più.
   *  (31.10, Alberto: «decifra un wallet devi farlo se hai un wallet») I PEZZI LI DÀ LA BANCA, UNO ALLA VOLTA ('chat.nastro'):
   *  la decisione sul pezzo che passa va alla banca, e la risposta porta il pezzo dopo; quello che viene dopo qui non si sa
   *  mai prima. In tasca va quello che la banca dice tenuto; all'ultimo pezzo la banca chiude il turno.
   *  (6.11) La scheda è una sola e cambia a ogni pezzo: il disegno, il nome, quanto vale, le tasche.
   *  → la sua ultima risposta (il turno: paga, o presi) */
  async nastro(ctx, p) {
    const MAX = p.max, N = p.n, FINESTRA = p.finestra
    const PASSO = 900 // (la banca dà il pezzo dopo solo quando questo è passato: 860 ms dal suo arrivo, giochi/chat-lavoro.mjs)
    const tasche = []
    const titolo = ':sacco: il nastro dei cestini'
    const inTasca = () => `in tasca ${tasche.length}/${MAX}${tasche.length ? ': ' + tasche.map((x) => nomeDi(x.id)).join(', ') : ''}`
    const s = ctx.dì({ colore: 'blu', t: titolo, d: `passano ${N} cose, un secondo l’una: → la tieni, ← la butti. In tasca ne stanno ${MAX}.` })
    await ctx.inVista(s)
    await aspetta(1500)
    // la decisione alla banca (se il pezzo dopo non è ancora arrivato, un attimo e si riprova: la rete può essere svelta)
    const manda = async (i, tieni) => { for (let k = 0; ; k++) { const r = await ctx.fai('chat.nastro', { i, tieni }); if (r.ok || !r.presto || k >= 5) return r; await aspetta(150) } }
    let r = await ctx.fai('chat.nastro', {}) // il primo pezzo
    while (r.ok && !r.esito.fine) {
      const { i, id } = r.esito, da = Date.now()
      const x = UFFICIO.find((y) => y.id === id) ?? { id, nome: id, vale: 0 }
      const pieno = tasche.length >= MAX
      const nome = x.nome.replace(/^(un’|un |una |uno |delle |degli |dei )/i, '')
      ctx.aggiorna(s, { colore: x.sospetto ? 'ambra' : 'blu', t: `${titolo} · ${i + 1}/${N}`, d: `<b>${nome}</b> · ${x.sospetto ? '⚠ roba che scotta' : `vale ${x.vale}`}${pieno ? ' · tasche piene' : ''}`, icone: [x.id], pie: inTasca(), senzaTasti: true })
      const ferma = ctx.tempo(s, FINESTRA)
      const v = pieno ? (await aspetta(FINESTRA), null) : await ctx.scegli(s, [{ id: 'sinistra', eti: 'butta', stile: 'nero' }, { id: 'destra', eti: 'tieni' }], FINESTRA)
      ferma()
      const manca = PASSO - (Date.now() - da)
      if (manca > 0) await aspetta(manca)
      r = await manda(i, v === 'destra')
      if (r.ok && r.esito.tenuto) tasche.push(x)
    }
    ctx.aggiorna(s, { colore: 'blu', t: titolo, d: r.ok ? 'il nastro è finito.' : 'il nastro si è fermato.', icone: tasche.map((x) => x.id), pie: inTasca(), senzaTasti: true })
    return r
  },
}
