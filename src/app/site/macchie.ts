// ─────────────────────────────────────────────────────────────────────────────
// Le macchie del fondale — il colore che cambia mentre scorri.
//
// Tre strati di macchie sovrapposti, uno per «umore» cromatico, appoggiati ai
// bordi della finestra. Scendendo, l'umore cambia: il primo lascia il posto al
// secondo, il secondo al terzo. Non è una tinta che scorre — sono tre tavolozze
// che si danno il cambio, e il passaggio è una dissolvenza.
//
//   umore 0   cima      blu e viola
//   umore 1   metà      ambra e rosa
//   umore 2   fondo     verde e blu
//
// ── Perché non si scrive una variabile CSS ───────────────────────────────────
// Per la stessa ragione scritta per esteso in site/aura.ts, e vale la pena
// ripeterla perché è la trappola in cui è naturale cadere: una custom property
// è EREDITATA, quindi scriverne una sulla radice a ogni fotogramma di scroll
// obbliga il motore a ricalcolare lo stile di tutto il documento. Misurato su
// questa home: 18,6 ms per fotogramma contro 0,23 ms scrivendo fuori dalla
// cascata. Ottantuno volte, e sono ottantuno volte prima di disegnare
// qualunque cosa.
//
// Quindi anche qui si usano le Web Animations in PAUSA: tre animazioni di
// opacità, una per strato, che non scorrono da sole — si scorre. Si sposta il
// loro `currentTime`, che è come scrivere un numero, ma su un oggetto che
// nella cascata non c'è. L'opacità poi è una delle due proprietà che il
// compositore muove senza ridipingere niente, quindi il costo per fotogramma è
// quello di comporre tre strati già disegnati.
//
// ── Cosa NON sta qui ─────────────────────────────────────────────────────────
// Il movimento delle macchie. Quello è un loop puramente decorativo e vive in
// CSS (home.css, @keyframes sb-blob-a/b/c): gira per conto suo, il browser lo
// sospende da sé quando la scheda passa in secondo piano, e non ha bisogno di
// nessun cleanup. Qui c'è solo il COLORE, perché il colore dipende da dove sei
// nella pagina e quello lo sa soltanto chi ascolta lo scroll.
// ─────────────────────────────────────────────────────────────────────────────

/** Durata di comodo: le animazioni sono in pausa e non scorrono mai da sole.
 *  È solo il fondoscala su cui si legge la posizione — currentTime = valore ×
 *  MILLE, con valore da 0 a 1. Stessa convenzione di site/aura.ts. */
const MILLE = 1000;

type Macchie = { su: HTMLElement; strati: Animation[] };

/** La curva di un umore: quando è al massimo e quanto in fretta se ne va.
 *
 *  Le tre curve si sovrappongono a metà strada apposta — a scroll 0,25 il
 *  primo umore è ancora mezzo acceso e il secondo sta salendo, e quello che si
 *  vede è la MESCOLA dei due. Se si dessero il cambio netti, scendendo si
 *  vedrebbero tre schermate colorate invece di una tinta che vira. */
function curva(indice: number, quanti: number): Keyframe[] {
  const picco = indice / (quanti - 1);
  return [
    { opacity: 0, offset: 0 },
    { opacity: 0, offset: Math.max(0, picco - 0.42) },
    { opacity: 1, offset: picco },
    { opacity: 0, offset: Math.min(1, picco + 0.42) },
    { opacity: 0, offset: 1 },
    // I due estremi restano accesi: il primo umore parte già al massimo in
    // cima alla pagina e l'ultimo ci arriva in fondo, quindi le loro curve
    // vanno tagliate, non chiuse. Ci pensa il filtro qui sotto.
  ].filter((k, i, tutti) => {
    if (picco === 0 && i < 2) return false;
    if (picco === 1 && i > tutti.length - 3) return false;
    return true;
  });
}

/** Apre (o riapre) le animazioni degli umori sul fondale corrente. */
export function apriMacchie(): Macchie | null {
  const su = document.querySelector<HTMLElement>(".sb-blobs");
  if (!su) return null;
  const strati = Array.from(su.querySelectorAll<HTMLElement>(".sb-blobset"));
  if (!strati.length || typeof strati[0].animate !== "function") return null;
  try {
    return {
      su,
      strati: strati.map((el, i) => {
        const an = el.animate(curva(i, strati.length), { duration: MILLE, fill: "both" });
        an.pause();
        an.currentTime = 0;
        return an;
      }),
    };
  } catch {
    // Un browser che non sa animare qui non è un guasto: gli strati restano
    // all'opacità che gli dà il foglio di stile, e le macchie continuano a
    // muoversi. Si perde il cambio di colore, non il fondale.
    return null;
  }
}

export function chiudiMacchie(m: Macchie | null) {
  if (!m) return;
  for (const an of m.strati) an.cancel();
}

/** L'elemento è ancora quello giusto? Cambiando rotta il fondale è un altro
 *  nodo, e le animazioni appese al vecchio se ne vanno con lui. */
export function macchieVive(m: Macchie | null): boolean {
  return !!m && m.su.isConnected;
}

/** Sposta gli umori. `avanzamento` va da 0 (cima della pagina) a 1 (fondo). */
export function muoviMacchie(m: Macchie | null, avanzamento: number) {
  if (!m) return;
  for (const an of m.strati) an.currentTime = avanzamento * MILLE;
}
