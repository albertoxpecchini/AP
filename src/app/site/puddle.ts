// ─────────────────────────────────────────────────────────────────────────────
// Pozza d'acqua — i quadratini dei commit reagiscono al puntatore.
//
// Il muro dei commit era fermo, e per una buona ragione: prima un'onda di
// calore lo attraversava in continuazione, 119 celle in animazione perenne
// anche mentre si scorreva dall'altra parte della pagina. Questa è un'altra
// cosa. Non è un ciclo: esiste solo finché il puntatore è dentro la griglia,
// e quando esce si spegne del tutto in una transizione CSS.
//
// L'effetto ha tre strati, e sono tre perché nessuno dei tre da solo sembra
// acqua:
//  ① le celle vicine si gonfiano e schiariscono (--pd-d, 0→1 per cella) —
//    è l'acqua spostata dal dito;
//  ② anelli concentrici centrati sul puntatore (--pd-x/--pd-y sul
//    contenitore, gradiente fermo nel foglio di stile) — è il riverbero, ed è
//    quello che vende l'acqua, perché NON si muove insieme alle celle;
//  ③ al click parte un anello solo che si allarga e svanisce — la goccia.
//
// Costo: si legge la geometria una volta sola all'ingresso (offsetLeft/Top
// delle celle, che sono ferme), poi mai più — a ogni frame restano confronti
// di numeri e le sole scritture che cambiano davvero qualcosa.
// ─────────────────────────────────────────────────────────────────────────────

/** Raggio d'influenza, in multipli della diagonale di una cella. */
const REACH = 4.2;
/** Sotto questa differenza non si riscrive: il DOM non sente 0.02 di scala. */
const EPS = 0.02;

type Cell = { el: HTMLElement; x: number; y: number; d: number };

/**
 * Aggancia la pozza a un contenitore di quadratini. I figli diretti sono le
 * celle. Restituisce la funzione per staccare tutto.
 */
export function attachPuddle(root: HTMLElement): () => void {
  let cells: Cell[] = [];
  let frame = 0;
  let px = 0;
  let py = 0;

  // La geometria si misura all'ingresso e non al montaggio: al montaggio il
  // pannello può essere ancora largo zero (font non caricati, sezione appena
  // comparsa), e misurarlo lì darebbe una griglia tutta sovrapposta nel punto
  // (0,0). All'ingresso del puntatore l'elemento è per forza visibile.
  const measure = () => {
    const kids = Array.from(root.children) as HTMLElement[];
    cells = kids.map((el) => ({
      el,
      x: el.offsetLeft + el.offsetWidth / 2,
      y: el.offsetTop + el.offsetHeight / 2,
      d: 0,
    }));
    const first = kids[0];
    const reach = first ? Math.hypot(first.offsetWidth, first.offsetHeight) * REACH : 0;
    return reach || 1;
  };

  let reach = 1;

  const write = () => {
    frame = 0;
    root.style.setProperty("--pd-x", `${px}px`);
    root.style.setProperty("--pd-y", `${py}px`);
    for (const c of cells) {
      const dist = Math.hypot(c.x - px, c.y - py);
      // Spegnimento morbido ai bordi: al centro 1, al limite 0, e in mezzo una
      // curva — non una rampa dritta, che si legge come un cono e non come una
      // superficie d'acqua.
      const raw = dist >= reach ? 0 : (1 - dist / reach) ** 2;
      if (Math.abs(raw - c.d) < EPS) continue;
      c.d = raw;
      if (raw === 0) c.el.style.removeProperty("--pd-d");
      else c.el.style.setProperty("--pd-d", raw.toFixed(3));
    }
  };

  const onEnter = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    reach = measure();
    root.dataset.pdOn = "";
    onMove(e);
  };

  const onMove = (e: PointerEvent) => {
    if (!cells.length) return;
    const r = root.getBoundingClientRect();
    // Il rect si rilegge a ogni movimento e non si mette in cache: la pagina
    // può scorrere sotto un puntatore fermo, e una cache manderebbe la pozza
    // fuori registro senza che nessun evento se ne accorga.
    px = e.clientX - r.left;
    py = e.clientY - r.top;
    if (!frame) frame = requestAnimationFrame(write);
  };

  const onLeave = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    delete root.dataset.pdOn;
    for (const c of cells) {
      c.d = 0;
      c.el.style.removeProperty("--pd-d");
    }
  };

  // La goccia. Un elemento solo, che si toglie da sé a fine animazione: niente
  // timer da annullare se il componente sparisce mentre l'anello è per aria.
  const onDown = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    const r = root.getBoundingClientRect();
    const drop = document.createElement("i");
    drop.className = "sb-pd-drop";
    drop.style.left = `${e.clientX - r.left}px`;
    drop.style.top = `${e.clientY - r.top}px`;
    drop.addEventListener("animationend", () => drop.remove(), { once: true });
    root.appendChild(drop);
  };

  root.addEventListener("pointerenter", onEnter);
  root.addEventListener("pointermove", onMove, { passive: true });
  root.addEventListener("pointerleave", onLeave);
  root.addEventListener("pointerdown", onDown);

  return () => {
    onLeave();
    root.querySelectorAll(".sb-pd-drop").forEach((n) => n.remove());
    root.style.removeProperty("--pd-x");
    root.style.removeProperty("--pd-y");
    root.removeEventListener("pointerenter", onEnter);
    root.removeEventListener("pointermove", onMove);
    root.removeEventListener("pointerleave", onLeave);
    root.removeEventListener("pointerdown", onDown);
  };
}

/**
 * Aggancia la pozza a tutti i `[data-puddle]` presenti, e a quelli che
 * arrivano dopo (il grafico del footer nasce da una fetch). Da chiamare una
 * volta sola, dalla regia globale.
 */
export function attachPuddles(): () => void {
  const attached = new WeakMap<HTMLElement, () => void>();
  let pending = 0;

  const scan = () => {
    pending = 0;
    document.querySelectorAll<HTMLElement>("[data-puddle]").forEach((el) => {
      if (attached.has(el)) return;
      attached.set(el, attachPuddle(el));
    });
  };

  scan();
  // I contenitori che arrivano con la rete o col cambio rotta. subtree: true
  // ma senza attributi né testo: interessano solo gli elementi che compaiono.
  // Una raffica di mutazioni React vale una scansione sola, al frame dopo.
  const mo = new MutationObserver(() => {
    if (!pending) pending = requestAnimationFrame(scan);
  });
  mo.observe(document.body, { childList: true, subtree: true });

  return () => {
    mo.disconnect();
    if (pending) cancelAnimationFrame(pending);
    document.querySelectorAll<HTMLElement>("[data-puddle]").forEach((el) => attached.get(el)?.());
  };
}
