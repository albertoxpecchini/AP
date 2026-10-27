// Due zaini dello stesso conto, uniti (26.10, Alberto: «dal telefono mi dà livello 1, dal pc 4: fai sti dati
// sincronizzati»). Lo zaino si salva intero, da più dispositivi; prima vinceva quello col `t` più recente, e un telefono
// rimasto indietro (lo zaino del server si chiedeva solo entrando nel conto, non aprendo la pagina), alla prima mossa
// cancellava i progressi fatti sul pc. Ora si uniscono: quello che cresce soltanto (l'esperienza, le statistiche, i giri
// ai giochi, i leggendari presi, le app installate, le side quest finite, il record del quiz, la serie più avanti) prende
// il meglio dei due; il resto (gli oggetti, le attese, gli effetti, il mestiere, le sfide del giorno…) viene da `base`,
// quello che vince: chi scrive avendo visto l'ultimo salvato. Lo usano chat/zaino.js nel browser e api/wallet.mjs.

const max = (a, b) => Math.max(Number(a) || 0, Number(b) || 0)
const perChiave = (a, b, f) => {
  const o = { ...(a ?? {}) }
  for (const [k, v] of Object.entries(b ?? {})) o[k] = k in o ? f(o[k], v) : v
  return o
}

/** `base` e `altro` uniti: il meglio dei due in quello che cresce soltanto, il resto da `base`. */
export function unisci(base, altro) {
  if (!altro) return base
  if (!base) return altro
  const z = JSON.parse(JSON.stringify(base))
  z.t = max(base.t, altro.t)
  z.xp = max(base.xp, altro.xp)
  z.stat = perChiave(base.stat, altro.stat, max)
  if (base.giochi || altro.giochi) z.giochi = perChiave(base.giochi, altro.giochi, (x, y) => (Array.isArray(x) && Array.isArray(y) ? x.map((n, i) => max(n, y[i])) : x))
  if (base.rari || altro.rari) z.rari = [...new Set([...(base.rari ?? []), ...(altro.rari ?? [])])]
  if (base.app || altro.app) z.app = perChiave(base.app, altro.app, max)
  if (base.serie || altro.serie) z.serie = perChiave(base.serie, altro.serie, (x, y) => ((y?.ultimo ?? 0) > (x?.ultimo ?? 0) ? y : x))
  if (base.quest || altro.quest) {
    const fatte = perChiave(base.quest?.fatte, altro.quest?.fatte, max)
    z.quest = { attive: Object.fromEntries(Object.entries(base.quest?.attive ?? {}).filter(([k]) => !fatte[k])), fatte }
  }
  if (z.quiz && altro.quiz) z.quiz.migliore = max(z.quiz.migliore, altro.quiz.migliore)
  return z
}

/** Lo stesso zaino? (le chiavi in un altro ordine contano uguale) */
export const uguali = (a, b) => canonico(a) === canonico(b)
const canonico = (x) => JSON.stringify(x, (k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map((c) => [c, v[c]])) : v))
