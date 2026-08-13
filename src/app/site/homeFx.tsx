// ─────────────────────────────────────────────────────────────────────────────
// Effetti della home — il raccordo fra i componenti React Bits e questo sito.
//
// I componenti in components/reactbits/ sono volutamente ignoranti: non sanno
// niente di temi, di token o di preferenze dell'utente. Tutto quello che li
// lega a questo sito sta qui:
//
//  · il TEMA — chi disegna su canvas vuole colori veri, non var(--…): il canvas
//    non legge il CSS. Quindi la palette sta qui in chiaro, derivata dai token
//    di home.css, e si riaggancia a subscribeTheme().
//  · il MOVIMENTO RIDOTTO — con prefers-reduced-motion attivo gli effetti non
//    si montano nemmeno. Non è una scelta di gusto: è una richiesta esplicita
//    dell'utente al sistema operativo, ed è la linea che il sito segue ovunque.
//    Lo stato di riposo di ciascuno sta in home.css.
//
// Qui dentro sono passati due effetti che adesso non ci sono più, e vale la
// pena dire perché: erano gli ultimi due cicli che giravano senza che nessuno
// li avesse chiesti.
//
//  · AURORA — uno shader WebGL (ogl) con un rAF che faceva avanzare uTime per
//    sempre, montato su ogni pagina che usa PageBackdrop. Il gradiente fermo
//    che home.css teneva come ripiego per il movimento ridotto era già
//    indistinguibile a occhio dal primo fotogramma: adesso è la regola.
//  · SHINYTEXT — due rAF che facevano ripassare una banda di luce sulle
//    brandline ogni 3,4 secondi, per sempre. La luce c'è ancora, ma è la
//    stessa che il titolo della hero prende dal puntatore (--gloss-x): passa
//    quando passi tu. Vedi ShinyBrandline più sotto.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState, type ReactNode } from "react";
import ClickSpark from "@/components/reactbits/ClickSpark";
import { currentTheme, subscribeTheme, type Theme } from "../theme/themeCore";

// ── Preferenze dell'utente ───────────────────────────────────────────────────

/** true se l'utente ha chiesto meno movimento. Si aggiorna se cambia idea. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/** Il tema attivo, seguito nel tempo (stesso schema di subscribeLang). */
export function useTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(() => currentTheme());
  useEffect(() => subscribeTheme(setTheme), []);
  return theme;
}

/** Colore delle scintille. Deve essere un colore VERO: finisce in
 *  ctx.strokeStyle, e il canvas 2D non sa cosa farsene di una var() CSS — la
 *  scarterebbe in silenzio lasciando il nero di default. Sul chiaro serve il
 *  azzurro scuro (--sb-brand-text), o le scintille sparirebbero sul bianco. */
const SPARK: Record<Theme, string> = { light: "#0a6285", dark: "#00B3FA" };

// ── ① Fondale della hero ─────────────────────────────────────────────────────

/**
 * La banda di colore dentro .sb-bg, SOTTO la griglia tecnica. La griglia sopra
 * è quello che tiene il fondale legato al resto del sito invece di farlo
 * sembrare uno sfondo incollato sotto.
 *
 * È un div vuoto: il colore lo mette home.css (.sb-aurora) con un gradiente
 * fermo, e il movimento del fondale — quel poco che serve — arriva dai due
 * aloni di .sb-home, che seguono lo scroll e il puntatore. Resta un componente
 * e non una riga di JSX perché è montato da sei pagine diverse via
 * PageBackdrop, e il nome dice ancora cos'è.
 */
export function AuroraBackdrop() {
  return <div className="sb-aurora" aria-hidden="true" />;
}

/**
 * Il fondale per le pagine INTERNE.
 *
 * Sulla home il contenitore fisso .sb-bg esiste già (e contiene anche la
 * griglia tecnica), quindi lì basta <AuroraBackdrop /> da solo. Le altre pagine
 * non hanno nessun fondale: questo componente porta il contenitore, ma NON la
 * griglia — quella è decorazione della home, e copiarla ovunque cambierebbe
 * l'aspetto delle pagine molto più di quanto sia stato chiesto.
 *
 * Va usato insieme alla classe `sb-home--fx` sulla radice della pagina: è
 * quella che alza il <main> sopra al fondale (il fondale è fixed a z-index 0, e
 * un contenuto statico gli finirebbe sotto). Nav e footer sono già a posto —
 * .sb-nav è sticky a z-index 50 e .sb-home.sb-foot è già a z-index 1.
 */
export function PageBackdrop() {
  return (
    <div className="sb-bg" aria-hidden="true">
      <AuroraBackdrop />
    </div>
  );
}

// ── ② Le brandline ───────────────────────────────────────────────────────────

/**
 * La banda di luce sulle righe brand ("Surveyor & Website Developer" nella
 * hero, "Let's talk." nella CTA, e le brandline di archivio, /mima, /me-stesso).
 *
 * La luce non ripassa più da sola ogni 3,4 secondi con un requestAnimationFrame
 * per riga: è la stessa che il titolo della hero prende dal puntatore. La banda
 * sta dove sta il cursore nella finestra (--gloss-x, la scrive
 * site/GlassMotion.tsx) — attraversi la pagina e le righe si illuminano al tuo
 * passaggio, una dopo l'altra. Da fermo la luce è ferma anche lei, a metà riga.
 *
 * La firma è rimasta quella di prima, `delay` compreso ma inerte: quattro
 * pagine chiamano questo componente e non c'era motivo di farle cambiare tutte
 * per un parametro che non esiste più.
 */
export function ShinyBrandline({
  text,
  className = "",
}: {
  text: string;
  className?: string;
  /** @deprecated Non serve più: la luce non ripassa a tempo, la porti tu. */
  delay?: number;
}) {
  return <span className={`sb-shine ${className}`.trim()}>{text}</span>;
}

// ── ③ Scintille al click ─────────────────────────────────────────────────────

/** Avvolge un gruppo di bottoni. `className` tiene il layout flex di chi sta
 *  sotto: il wrapper originale di React Bits è w-full h-full e schiaccerebbe
 *  la riga. Con movimento ridotto restituisce i figli e basta. */
export function SparkGroup({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  const theme = useTheme();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <ClickSpark
      className={className}
      sparkColor={SPARK[theme]}
      sparkSize={9}
      sparkRadius={18}
      sparkCount={9}
      duration={420}
    >
      {children}
    </ClickSpark>
  );
}

// Il blocco dei clienti non sta più qui: era un nastro che scorreva (LogoLoop),
// adesso è una finestra di terminale fatta coi pezzi che il design system ha
// già — .sb-panel + .sb-codehead + .sb-term-line. Vive in App.tsx col resto
// del markup della home, perché non ha niente da orchestrare: nessun canvas,
// nessun colore da risolvere a runtime, nessun ciclo da fermare.
// components/reactbits/LogoLoop.tsx resta nel repo ma non è più usato.
