// ── Come parla la sala macchine ──────────────────────────────────────────────
//
// Gli stessi colori e le stesse etichette per tutti i pezzi del dev server:
// avvio, stato, log. Se «pronto» è verde in un posto e ciano in un altro,
// chi guarda smette di leggere i colori e li deve leggere tutti, ogni volta.
//
// Come in scripts/janitor/rapporto.mjs: i colori servono a chi ha uno schermo
// davanti. Quando l'uscita finisce in un file — e qui succede sempre, il
// supervisore copia tutto in .dev/log/ — le sequenze di escape diventano
// "[90m" sparsi in mezzo alle parole. Senza terminale dall'altra parte si
// scrive in chiaro, e nel file ci finisce comunque il testo ripulito (vedi
// senzaColori, che è l'unica cosa che scrive sul log).

const aColori = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR

const tinta = (codice) => (s) => (aColori ? `\x1b[${codice}m${s}\x1b[0m` : String(s))

export const C = {
  grigio: tinta(90),
  verde: tinta(32),
  giallo: tinta(33),
  rosso: tinta(31),
  ciano: tinta(36),
  forte: tinta(1),
}

// Toglie ogni sequenza ANSI: serve al log su file, dove i colori sono solo
// rumore, e a misurare la larghezza vera di una riga già colorata.
export const senzaColori = (s) => String(s).replace(/\x1b\[[0-9;]*m/g, '')

// I tre stati che sa raccontare questo sistema. Il pallino sta a sinistra
// sempre nella stessa colonna, così l'occhio scorre la colonna e non le parole.
export const OK = () => C.verde('●')
export const FORSE = () => C.giallo('●')
export const NO = () => C.rosso('●')

/** Riga di diagnosi: pallino, nome allineato, spiegazione in grigio. */
export function voce(pallino, nome, nota = '') {
  const larghezza = 22
  const spazio = ' '.repeat(Math.max(1, larghezza - nome.length))
  return `  ${pallino} ${nome}${spazio}${C.grigio(nota)}`
}

export function titolo(t) {
  console.log('\n' + C.forte(t))
  console.log(C.grigio('─'.repeat(Math.max(24, senzaColori(t).length))))
}

/** "3m 12s", "1h 04m" — durate lette a colpo d'occhio, non in millisecondi. */
export function durata(ms) {
  const s = Math.max(0, Math.round(ms / 1000))
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ${String(s % 60).padStart(2, '0')}s`
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`
}

/** Orario in HH:MM:SS, quello che va davanti a ogni riga di log. */
export function orario(d = new Date()) {
  return d.toTimeString().slice(0, 8)
}
