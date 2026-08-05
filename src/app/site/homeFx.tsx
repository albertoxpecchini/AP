// ─────────────────────────────────────────────────────────────────────────────
// Effetti della home — il raccordo fra i componenti React Bits e questo sito.
//
// I componenti in components/reactbits/ sono volutamente ignoranti: non sanno
// niente di temi, di token o di preferenze dell'utente. Tutto quello che li
// lega a questo sito sta qui:
//
//  · il TEMA — i componenti che disegnano su canvas (Aurora) vogliono colori
//    veri, non var(--…): il WebGL non legge il CSS. Quindi le palette stanno
//    qui in chiaro, derivate dai token di home.css, e si riagganciano a
//    subscribeTheme(). Chi invece disegna in CSS (ShinyText) riceve
//    direttamente le var e non ha bisogno di nessuna sottoscrizione.
//  · il MOVIMENTO RIDOTTO — con prefers-reduced-motion attivo gli effetti non
//    si montano nemmeno. Non è una scelta di gusto: è una richiesta esplicita
//    dell'utente al sistema operativo, ed è la linea che il sito segue ovunque.
//    Lo stato di riposo di ciascuno sta in home.css.
//  · il CARICAMENTO — Aurora si porta dietro ogl (WebGL): entra da lazy(), così
//    finisce in un chunk suo e non pesa sul primo caricamento della pagina.
// ─────────────────────────────────────────────────────────────────────────────
import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import ClickSpark from "@/components/reactbits/ClickSpark";
import ShinyText from "@/components/reactbits/ShinyText";
import { currentTheme, subscribeTheme, type Theme } from "../theme/themeCore";

const Aurora = lazy(() => import("@/components/reactbits/Aurora"));

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

// ── Palette del fondale ──────────────────────────────────────────────────────
// Tre color-stop, da sinistra a destra. Il verde centrale è --sb-brand
// (hsl(153 60% 53%) → #3ECF8E); i due estremi sono la stessa tinta portata
// verso il fondo della pagina, così la banda si spegne ai lati invece di
// finire di netto. Se cambiano i token in home.css, vanno cambiati anche qui:
// il canvas non li può leggere.
const AURORA_STOPS: Record<Theme, string[]> = {
  light: ["#dff5ea", "#3ECF8E", "#dff5ea"],
  dark: ["#0d2a20", "#3ECF8E", "#0d2a20"],
};

/** Colore delle scintille. Anche questo deve essere un colore VERO: finisce in
 *  ctx.strokeStyle, e il canvas 2D non sa cosa farsene di una var() CSS — la
 *  scarterebbe in silenzio lasciando il nero di default. Sul chiaro serve il
 *  verde scuro (--sb-brand-text), o le scintille sparirebbero sul bianco. */
const SPARK: Record<Theme, string> = { light: "#0a854e", dark: "#3ECF8E" };

// ── ① Fondale della hero ─────────────────────────────────────────────────────

/**
 * Aurora dentro .sb-bg, SOTTO la griglia tecnica. La griglia sopra è quello che
 * tiene il fondale legato al resto del sito invece di farlo sembrare uno
 * sfondo incollato sotto.
 *
 * Con movimento ridotto non monta niente: resta il gradiente fermo che home.css
 * mette su .sb-aurora, che è lo stesso verde nella stessa posizione.
 */
export function AuroraBackdrop() {
  const reduced = useReducedMotion();
  const theme = useTheme();

  return (
    <div className="sb-aurora" aria-hidden="true">
      {reduced ? null : (
        <Suspense fallback={null}>
          <Aurora colorStops={AURORA_STOPS[theme]} amplitude={0.9} blend={0.6} speed={0.6} />
        </Suspense>
      )}
    </div>
  );
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
 * La banda di luce sulle due righe brand della home ("Designer & Front-end
 * Developer" nella hero, "Let's talk." nella CTA).
 *
 * I colori passano come var() dentro il gradiente — è legale, ed è il motivo
 * per cui qui non serve seguire il tema: le variabili cambiano da sole con
 * html.dark. Con movimento ridotto si rende il testo normale, senza gradiente.
 */
export function ShinyBrandline({
  text,
  className = "",
  delay = 2.2,
}: {
  text: string;
  className?: string;
  /** Pausa fra una passata e l'altra, in secondi. Il default è lungo apposta:
   *  una luce che ripassa di continuo su un titolo diventa un lampeggio. */
  delay?: number;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <span className={className}>{text}</span>;
  return (
    <ShinyText
      text={text}
      className={className}
      color="var(--sb-shine-base)"
      shineColor="var(--sb-shine-hi)"
      speed={3.4}
      delay={delay}
      spread={110}
    />
  );
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
