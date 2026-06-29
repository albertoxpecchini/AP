// ─────────────────────────────────────────────────────────────────────────────
// Motore di traduzione "al volo" del DOM — il cuore del multilingua universale.
//
// Idea: invece di toccare le ~20 pagine una per una, traduciamo direttamente il
// testo già renderizzato. Un MutationObserver segue ogni cambiamento del DOM
// (cambio pagina del router, contenuti lazy, ri-render di React) e ritraduce i
// nodi di testo (e alcuni attributi) usando il dizionario. Cambiare lingua
// ritraduce tutto, senza ricaricare la pagina.
//
// Robustezza (perché React e l'observer non litighino):
//  · Per ogni nodo teniamo l'ORIGINALE (testo sorgente così com'è scritto) e
//    l'ULTIMO valore che ABBIAMO scritto noi. Se il valore attuale ≠ "nostro",
//    vuol dire che React ha riscritto il nodo → quello diventa il nuovo
//    originale (gestisce i testi dinamici).
//  · Mentre scriviamo, l'observer è SCOLLEGATO: nessun loop infinito.
//  · Le chiavi del dizionario sono nella lingua sorgente; una volta tradotto, il
//    testo non è più una chiave, quindi non si ritraduce a vuoto.
//  · Tutto è raggruppato in un solo "passo" per frame (requestAnimationFrame).
// ─────────────────────────────────────────────────────────────────────────────

import { getLang, subscribeLang, type Lang } from "./langCore";
import { DICT, normalizeKey } from "./dictionary";

// Attributi tradotti, oltre al testo (tooltip, accessibilità, alt immagini).
const ATTRS = ["placeholder", "title", "aria-label", "alt"] as const;

// Elementi il cui contenuto NON va mai toccato.
const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "CODE", "PRE"]);

// Memoria per-nodo: testo originale + ultimo valore scritto da noi.
const origText = new WeakMap<Text, string>();
const lastText = new WeakMap<Text, string>();
// Per gli attributi: per elemento, una mappa attr → {orig, last}.
const attrMem = new WeakMap<Element, Map<string, { orig: string; last: string }>>();

let started = false;
let observer: MutationObserver | null = null;
let frame = 0;
const pending = new Set<Node>();

/** Traduce `original` (testo sorgente) nella lingua `lang`, preservando gli spazi ai bordi. */
function render(original: string, lang: Lang): string {
  const key = normalizeKey(original);
  if (!key) return original;
  const entry = DICT[key];
  if (!entry) return original;
  const t = entry[lang];
  if (t == null) return original; // nessuna traduzione → resta la sorgente
  const lead = original.match(/^\s*/)?.[0] ?? "";
  const trail = original.match(/\s*$/)?.[0] ?? "";
  return lead + t + trail;
}

/** Traduce un singolo nodo di testo per la lingua corrente. */
function applyTextNode(node: Text, lang: Lang): void {
  const v = node.nodeValue ?? "";
  const mine = lastText.get(node);

  if (mine !== undefined && mine === v) {
    // Valore scritto da noi e non toccato da React: ricalcola (la lingua può
    // essere cambiata) partendo dall'originale memorizzato.
    const o = origText.get(node) ?? v;
    const want = render(o, lang);
    if (want !== v) {
      node.nodeValue = want;
      lastText.set(node, want);
    }
    return;
  }

  // Primo incontro, oppure React ha riscritto il nodo → `v` è il nuovo originale.
  origText.set(node, v);
  const want = render(v, lang);
  if (want !== v) node.nodeValue = want;
  lastText.set(node, want);
}

/** Traduce gli attributi tradotti di un elemento per la lingua corrente. */
function applyAttrs(el: Element, lang: Lang): void {
  let mem: Map<string, { orig: string; last: string }> | undefined;
  for (const attr of ATTRS) {
    if (!el.hasAttribute(attr)) continue;
    const v = el.getAttribute(attr) ?? "";
    if (!v.trim()) continue;
    if (!mem) mem = attrMem.get(el);
    const rec = mem?.get(attr);

    if (rec && rec.last === v) {
      const want = render(rec.orig, lang);
      if (want !== v) {
        el.setAttribute(attr, want);
        rec.last = want;
      }
      continue;
    }
    // Primo incontro o valore cambiato da React.
    if (!mem) {
      mem = new Map();
      attrMem.set(el, mem);
    }
    const want = render(v, lang);
    if (want !== v) el.setAttribute(attr, want);
    mem.set(attr, { orig: v, last: want });
  }
}

/** Percorre un sotto-albero e traduce testo + attributi. */
function walk(root: Node, lang: Lang): void {
  // Se la radice è dentro una zona da saltare, lascia stare.
  if (root.nodeType === Node.ELEMENT_NODE && shouldSkip(root as Element)) return;

  if (root.nodeType === Node.TEXT_NODE) {
    applyTextNode(root as Text, lang);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
    return;
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode(n: Node) {
      if (n.nodeType === Node.ELEMENT_NODE) {
        return shouldSkip(n as Element) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
      return NodeFilter.FILTER_ACCEPT; // testo
    },
  });

  // La radice stessa, se elemento, va comunque considerata per gli attributi.
  if (root.nodeType === Node.ELEMENT_NODE) applyAttrs(root as Element, lang);

  let n = walker.nextNode();
  while (n) {
    if (n.nodeType === Node.TEXT_NODE) applyTextNode(n as Text, lang);
    else applyAttrs(n as Element, lang);
    n = walker.nextNode();
  }
}

function shouldSkip(el: Element): boolean {
  if (SKIP_TAGS.has(el.tagName)) return true;
  // Zona marcata "non tradurre" (es. il widget lingua stesso).
  if (el.closest("[data-no-i18n]")) return true;
  // Campi modificabili: non toccare il testo digitato dall'utente.
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

/** Esegue un passo di traduzione con l'observer scollegato (niente loop). */
function runPass(nodes: Iterable<Node> | "all"): void {
  const lang = getLang();
  observer?.disconnect();
  try {
    if (nodes === "all") {
      if (document.body) walk(document.body, lang);
    } else {
      for (const n of nodes) {
        if (n.isConnected) walk(n, lang);
      }
    }
  } finally {
    reconnect();
  }
}

function reconnect(): void {
  if (!observer || !document.body) return;
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: ATTRS as unknown as string[],
  });
}

function scheduleFlush(): void {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    if (pending.size === 0) return;
    const batch = Array.from(pending);
    pending.clear();
    runPass(batch);
  });
}

function onMutations(muts: MutationRecord[]): void {
  for (const m of muts) {
    if (m.type === "childList") {
      m.addedNodes.forEach((n) => {
        if (n.nodeType === Node.ELEMENT_NODE || n.nodeType === Node.TEXT_NODE) pending.add(n);
      });
    } else if (m.type === "characterData") {
      pending.add(m.target);
    } else if (m.type === "attributes") {
      pending.add(m.target);
    }
  }
  if (pending.size) scheduleFlush();
}

/**
 * Avvia il motore: primo passo su tutta la pagina + osservatore dei cambiamenti
 * + ritraduzione completa a ogni cambio lingua. Idempotente.
 */
export function startI18nEngine(): void {
  if (started || typeof window === "undefined") return;
  started = true;

  const boot = () => {
    runPass("all"); // traduce ciò che è già a schermo
    observer = new MutationObserver(onMutations);
    reconnect();
    subscribeLang(() => runPass("all")); // cambio lingua → ritraduce tutto
  };

  if (document.body) boot();
  else document.addEventListener("DOMContentLoaded", boot, { once: true });
}

/** Forza una ritraduzione completa (usata dal widget a metà animazione). */
export function retranslateAll(): void {
  if (started) runPass("all");
}
