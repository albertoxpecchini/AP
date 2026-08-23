// ─────────────────────────────────────────────────────────────────────────────
// I due aloni del fondale — mossi SENZA passare dalla cascata.
//
// ── Il baco che ha reso necessario questo file ───────────────────────────────
// Gli aloni sono .sb-home::before e ::after, e finché si muovevano scrivendo
// tre custom property su <html> (--sb-drift, --sb-px, --sb-py) il conto era
// questo, misurato su una build di produzione:
//
//     ricalcolo dello stile, per fotogramma          18,6 ms
//     con le stesse variabili scritte altrove         0,23 ms
//
// Ottantuno volte, e non è un dettaglio di implementazione: è TUTTO il budget
// di un fotogramma buttato prima di disegnare qualsiasi cosa. Il motivo è
// semplice e non si aggira con le microottimizzazioni — una custom property è
// EREDITATA, quindi cambiarne una sulla radice obbliga il motore a ricalcolare
// lo stile di ogni nodo che potrebbe leggerla, cioè il documento intero
// (2.845 nodi su questa home). Succedeva a ogni movimento del mouse e a ogni
// fotogramma di scroll, su ogni pagina del sito. Registrarle con @property non
// serve: provato, 18,6 → 16,4 ms.
//
// ── Come si muovono adesso ───────────────────────────────────────────────────
// Con le Web Animations, che sugli pseudo-elementi si possono usare
// (`pseudoElement: "::before"`) e che il compositore muove da sé senza toccare
// lo stile di nessuno. Tre animazioni per alone, tutte in PAUSA: non scorrono
// da sole, si SCORRE — si sposta il loro `currentTime`, che è l'equivalente di
// scrivere un numero, ma su un oggetto che non sta nella cascata.
//
// Tre e non una perché i movimenti sono tre e indipendenti (la deriva dello
// scroll, lo scostamento orizzontale verso il puntatore, quello verticale), e
// una sola animazione può essere scorsa lungo una traiettoria sola. Si sommano
// con `composite: "add"`, che su `translate` funziona: con la deriva a metà e
// il puntatore agli estremi, lo pseudo-elemento legge
// `translate: 4% calc(-4% + 70px)` — cioè i tre pezzi sommati, come faceva il
// calc() nel foglio di stile.
//
// Sopra ci gira ancora il respiro a keyframe (@keyframes sb-drift-a/b in
// home.css), che sta su `transform`: proprietà diversa da `translate`, quindi
// i due non si toccano — è la stessa separazione di prima, solo che adesso
// nessuno dei due passa per una variabile.
// ─────────────────────────────────────────────────────────────────────────────

/** Chi porta gli aloni: la radice di PAGINA, non le altre .sb-home.
 *  L'elenco delle esclusioni è lo stesso di home.css (blocco «Fondale
 *  continuo»): footer, barra di controllo, velo del cambio lingua e modali
 *  hanno la classe ma non gli pseudo-elementi. Se ne aggiungi una lì,
 *  aggiungila anche qui. */
const RADICE =
  ".sb-home:not(.sb-foot):not(.sb-ctl):not(.sb-lang-wipe):not(.sb-tv-modal):not(.sb-ig-tut):not(.apl-dialog):not(.apw-dialog)";

/** Durata di comodo delle tre animazioni. Non è un tempo: sono in pausa e non
 *  scorrono mai da sole. È solo il fondoscala su cui si legge la posizione —
 *  currentTime = valore × MILLE, con valore da 0 a 1. */
const MILLE = 1000;

type Terna = { deriva: Animation; px: Animation; py: Animation };

/** Le sei animazioni (tre per alone) e l'elemento a cui sono appese. */
type Aura = { su: HTMLElement; a: Terna; b: Terna };

/** Quanto si sposta ogni alone rispetto all'altro. Sono gli stessi numeri che
 *  stavano nei due `translate` di home.css: il secondo alone segue la stessa
 *  mano ma più piano e dalla parte opposta, ed è quello che dà profondità. */
function terna(su: HTMLElement, pseudo: string, deriva: number, verso: number, scarto: number): Terna {
  const paused = (kf: Keyframe[], composite: CompositeOperation) => {
    const an = su.animate(kf, { duration: MILLE, fill: "both", pseudoElement: pseudo, composite });
    an.pause();
    an.currentTime = 0;
    return an;
  };
  const s = scarto * verso;
  return {
    deriva: paused([{ translate: "0 0px" }, { translate: `0 ${deriva}px` }], "replace"),
    px: paused([{ translate: `${-s}% 0` }, { translate: `${s}% 0` }], "add"),
    py: paused([{ translate: `0 ${-s}%` }, { translate: `0 ${s}%` }], "add"),
  };
}

/** Apre (o riapre) le sei animazioni sulla radice di pagina corrente.
 *
 *  @param derivaPx  quanto slittano gli aloni fra cima e fondo della pagina
 *  @param scartoPc  di quanto si spostano dietro al puntatore, in percentuale
 */
export function apriAura(derivaPx: number, scartoPc: number): Aura | null {
  const su = document.querySelector<HTMLElement>(RADICE);
  if (!su || typeof su.animate !== "function") return null;
  try {
    return {
      su,
      a: terna(su, "::before", derivaPx, 1, scartoPc),
      // 0,7 sulla deriva e −0,6 sul puntatore: gli stessi coefficienti che
      // aveva il calc() del secondo alone.
      b: terna(su, "::after", derivaPx * 0.7, -0.6, scartoPc),
    };
  } catch {
    // Un browser senza animazioni sugli pseudo-elementi non è un guasto: gli
    // aloni restano dove li mette il foglio di stile, e il respiro a keyframe
    // continua per conto suo.
    return null;
  }
}

export function chiudiAura(aura: Aura | null) {
  if (!aura) return;
  for (const t of [aura.a, aura.b]) for (const an of [t.deriva, t.px, t.py]) an.cancel();
}

/** L'elemento è ancora quello giusto? Cambiando rotta la radice di pagina è un
 *  altro nodo, e le animazioni appese al vecchio se ne vanno con lui. */
export function auraViva(aura: Aura | null): boolean {
  return !!aura && aura.su.isConnected;
}

/** Sposta. I tre valori vanno da 0 a 1: 0,5 è il riposo per il puntatore, 0 è
 *  la cima della pagina per la deriva. */
export function muoviAura(aura: Aura | null, deriva: number, px: number, py: number) {
  if (!aura) return;
  for (const t of [aura.a, aura.b]) {
    t.deriva.currentTime = deriva * MILLE;
    t.px.currentTime = px * MILLE;
    t.py.currentTime = py * MILLE;
  }
}
