import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { X, MousePointerClick, Check } from "lucide-react";

// ════════════════════════════════════════════════════════════════════════════
// HomeTour — tour guidato "a riflettore" sulla home di Trivia.
// ════════════════════════════════════════════════════════════════════════════
// Oscura tutta la pagina TRANNE il pulsante della funzione corrente (ritagliato
// con un alone luminoso) e mostra un popup a tema verde-viola con il testo che
// si SCRIVE in diretta (effetto macchina da scrivere). L'utente è OBBLIGATO a
// premere davvero il pulsante evidenziato per procedere (così scopre la
// funzione), ma può abbandonare il tour in qualsiasi momento ("Salta").
//
// I target sono individuati via attributo [data-tour="..."] nel DOM del menù.

export interface TourStep {
  selector: string;        // es. '[data-tour="leaderboard"]'
  title: string;
  body: string;
  // testo del micro-hint sopra il pulsante (default: "Tocca per provare")
  hint?: string;
  // se true, non serve cliccare il target: si avanza con "Avanti" (per l'ultimo)
  noClick?: boolean;
}

interface HomeTourProps {
  steps: TourStep[];
  onDone: () => void;
  // Chiamata ad ogni avanzamento/uscita: chiude eventuali modali aperte (così
  // non restano appese passando al passo successivo).
  onCloseModals?: () => void;
}

interface Rect { top: number; left: number; width: number; height: number; }

const PAD = 8; // alone attorno al target

export default function HomeTour({ steps, onDone, onCloseModals }: HomeTourProps) {
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [clicked, setClicked] = useState(false);   // ha premuto il target?
  const [exiting, setExiting] = useState(false);
  const targetRef = useRef<HTMLElement | null>(null);

  const step = steps[idx];
  const isLast = idx === steps.length - 1;

  const finish = useCallback(() => {
    onCloseModals?.();
    setExiting(true);
    setTimeout(onDone, 320);
  }, [onDone, onCloseModals]);

  const next = useCallback(() => {
    onCloseModals?.();                 // chiudi modali aperte prima di avanzare
    if (isLast) { finish(); return; }
    setClicked(false);
    setIdx(i => i + 1);
  }, [isLast, finish, onCloseModals]);

  // Trova il target del passo corrente e ne misura il rettangolo. Lo riallinea
  // a resize/scroll. Se sparisce (es. layout mobile), salta il passo.
  useLayoutEffect(() => {
    let raf = 0;
    const measure = () => {
      const el = document.querySelector<HTMLElement>(step.selector);
      targetRef.current = el;
      if (!el) { setRect(null); return; }
      const r = el.getBoundingClientRect();
      // se non è visibile (es. nascosto dal CSS responsive), prova il prossimo
      if (r.width === 0 || r.height === 0) { setRect(null); return; }
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    measure();
    const onScrollResize = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(measure); };
    window.addEventListener("resize", onScrollResize);
    window.addEventListener("scroll", onScrollResize, true);
    // ricontrolla a breve (font/layout che si assestano)
    const t = setTimeout(measure, 120);
    return () => {
      window.removeEventListener("resize", onScrollResize);
      window.removeEventListener("scroll", onScrollResize, true);
      cancelAnimationFrame(raf); clearTimeout(t);
    };
  }, [step.selector, idx]);

  // Se il target del passo corrente non esiste/è invisibile, salta automaticamente
  // (mantiene il tour coerente anche se una funzione non è in pagina).
  useEffect(() => {
    if (rect === null && targetRef.current === null) {
      const el = document.querySelector<HTMLElement>(step.selector);
      if (!el) {
        if (isLast) finish();
        else setIdx(i => i + 1);
      }
    }
  }, [rect, step.selector, isLast, finish]);

  // Intercetta il click sul target reale: lascia che la sua azione avvenga
  // (apre la modale), ma registra che l'utente ha interagito → sblocca "Avanti".
  useEffect(() => {
    const el = targetRef.current;
    if (!el || step.noClick) return;
    const onClick = () => setClicked(true);
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, [rect, idx, step.noClick]);

  // Tastiera: Esc abbandona.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") finish(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finish]);

  if (!step) return null;

  // ── Popup: posizionato accanto al target, lato scelto in base allo spazio ──
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const POP_W = Math.min(340, vw - 24);

  let popLeft = 0, popTop = 0, arrow: "left" | "right" | "top" | "bottom" = "left";
  if (rect) {
    const spaceRight = vw - (rect.left + rect.width);
    const spaceLeft = rect.left;
    if (spaceLeft > POP_W + 24) {
      // popup a SINISTRA del target (target è nel rail destro)
      popLeft = rect.left - POP_W - 18;
      popTop = Math.min(Math.max(rect.top + rect.height / 2 - 90, 12), vh - 220);
      arrow = "right";
    } else if (spaceRight > POP_W + 24) {
      popLeft = rect.left + rect.width + 18;
      popTop = Math.min(Math.max(rect.top + rect.height / 2 - 90, 12), vh - 220);
      arrow = "left";
    } else {
      // sopra o sotto
      popLeft = Math.min(Math.max(rect.left + rect.width / 2 - POP_W / 2, 12), vw - POP_W - 12);
      if (rect.top > vh / 2) { popTop = rect.top - 200; arrow = "bottom"; }
      else { popTop = rect.top + rect.height + 16; arrow = "top"; }
    }
  }

  // Quando l'utente ha cliccato un target che apre una modale (classifica,
  // pagella…), nascondiamo la maschera/popup del tour così la modale appena
  // aperta si vede pulita, e mostriamo solo una barra "Avanti" in basso.
  const modalOpen = clicked && !step.noClick;

  if (modalOpen) {
    return (
      <div className="tour-root" style={{ position: "fixed", inset: 0, zIndex: 350, pointerEvents: "none", opacity: exiting ? 0 : 1, transition: "opacity 0.3s ease" }}>
        <div className="tour-bar" style={{ pointerEvents: "auto" }}>
          <span className="tour-bar-txt"><Check size={16} /> {step.title} — guarda pure, poi continua</span>
          <div className="tour-bar-btns">
            <button type="button" className="tour-skip" onClick={finish}><X size={13} /> Salta</button>
            <button type="button" className="tour-next tour-next-on" onClick={next}>{isLast ? "Finisci" : "Avanti →"}</button>
          </div>
        </div>
        <style>{TOUR_CSS}</style>
      </div>
    );
  }

  return (
    <div
      className="tour-root"
      style={{ position: "fixed", inset: 0, zIndex: 350, opacity: exiting ? 0 : 1, transition: "opacity 0.3s ease", pointerEvents: "none" }}
    >
      {/* ── Maschera scura con "buco" sul target ──
          Il root NON intercetta i click (pointer-events:none): solo i pannelli
          scuri e il popup li intercettano. Così il "buco" sul target lascia
          passare il click al pulsante reale sottostante. Quattro pannelli scuri
          attorno al rettangolo del target → il target resta luminoso E cliccabile. */}
      {rect ? (
        <>
          {/* top */}
          <div className="tour-mask" style={{ top: 0, left: 0, width: "100%", height: Math.max(rect.top - PAD, 0) }} onClick={finish} />
          {/* bottom */}
          <div className="tour-mask" style={{ top: rect.top + rect.height + PAD, left: 0, width: "100%", height: Math.max(vh - (rect.top + rect.height + PAD), 0) }} onClick={finish} />
          {/* left */}
          <div className="tour-mask" style={{ top: Math.max(rect.top - PAD, 0), left: 0, width: Math.max(rect.left - PAD, 0), height: rect.height + PAD * 2 }} onClick={finish} />
          {/* right */}
          <div className="tour-mask" style={{ top: Math.max(rect.top - PAD, 0), left: rect.left + rect.width + PAD, width: Math.max(vw - (rect.left + rect.width + PAD), 0), height: rect.height + PAD * 2 }} onClick={finish} />
          {/* alone luminoso attorno al target (non intercetta i click) */}
          <div className="tour-halo" style={{
            top: rect.top - PAD, left: rect.left - PAD,
            width: rect.width + PAD * 2, height: rect.height + PAD * 2,
          }} />
          {/* dito/hint "tocca qui" appena sopra il target, se serve il click */}
          {!step.noClick && !clicked && (
            <div className="tour-hint" style={{ top: rect.top - 38, left: rect.left + rect.width / 2 }}>
              <MousePointerClick size={15} /> {step.hint ?? "Tocca per provare"}
            </div>
          )}
        </>
      ) : (
        // fallback: nessun target → schermo scuro intero
        <div className="tour-mask" style={{ inset: 0, width: "100%", height: "100%" }} onClick={finish} />
      )}

      {/* ── Popup verde-viola animato con testo a macchina da scrivere ── */}
      {rect && (
        <div
          key={idx}
          className={`tour-pop tour-arrow-${arrow}`}
          style={{ left: popLeft, top: popTop, width: POP_W }}
        >
          <div className="tour-pop-head">
            <span className="tour-pop-step">Tutorial · {idx + 1}/{steps.length}</span>
            <button type="button" className="tour-skip" onClick={finish}><X size={13} /> Salta</button>
          </div>
          <h3 className="tour-pop-title"><Typewriter text={step.title} speed={26} /></h3>
          <p className="tour-pop-body"><Typewriter text={step.body} speed={13} startDelay={step.title.length * 26 + 180} /></p>

          <div className="tour-pop-foot">
            {step.noClick ? (
              <button type="button" className="tour-next" onClick={next}>
                {isLast ? "Fine!" : "Avanti"}
              </button>
            ) : clicked ? (
              <button type="button" className="tour-next tour-next-on" onClick={next}>
                <Check size={16} /> {isLast ? "Finisci" : "Avanti"}
              </button>
            ) : (
              <span className="tour-waiting">
                <span className="tour-waiting-dot" /> Premi il pulsante evidenziato…
              </span>
            )}
          </div>
        </div>
      )}

      <style>{TOUR_CSS}</style>
    </div>
  );
}

const TOUR_CSS = `
        .tour-mask {
          position: fixed; background: rgba(9,18,13,0.74);
          backdrop-filter: blur(1.5px); cursor: pointer; pointer-events: auto;
          animation: tour-fade 0.3s ease both;
        }
        @keyframes tour-fade { from { opacity: 0; } to { opacity: 1; } }

        .tour-halo {
          position: fixed; border-radius: 14px; pointer-events: none;
          box-shadow: 0 0 0 2px #9b5cf6, 0 0 0 5px rgba(124,58,237,0.35),
                      0 0 32px 6px rgba(47,158,90,0.45);
          animation: tour-halo-pulse 1.8s ease-in-out infinite;
        }
        @keyframes tour-halo-pulse {
          0%,100% { box-shadow: 0 0 0 2px #9b5cf6, 0 0 0 5px rgba(124,58,237,0.30), 0 0 26px 5px rgba(47,158,90,0.4); }
          50%     { box-shadow: 0 0 0 2px #b794ff, 0 0 0 7px rgba(124,58,237,0.5), 0 0 40px 10px rgba(47,158,90,0.6); }
        }

        .tour-hint {
          position: fixed; transform: translate(-50%, -100%);
          display: inline-flex; align-items: center; gap: 5px;
          background: linear-gradient(100deg,#7c3aed,#2F9E5A);
          color: #fff; font-weight: 800; font-size: 0.72rem;
          padding: 5px 10px; border-radius: 999px; white-space: nowrap;
          box-shadow: 0 6px 18px rgba(91,33,182,0.45); pointer-events: none;
          font-family: "Titillium Web", sans-serif;
          animation: tour-hint-bob 1.1s ease-in-out infinite;
        }
        @keyframes tour-hint-bob {
          0%,100% { transform: translate(-50%, -100%); }
          50%     { transform: translate(-50%, calc(-100% - 5px)); }
        }

        .tour-pop {
          position: fixed; z-index: 351; pointer-events: auto;
          background: linear-gradient(160deg, #ffffff 0%, #ffffff 60%, #f3effc 100%);
          border: 1px solid rgba(124,58,237,0.22);
          border-radius: 16px; padding: 0.85rem 1rem 0.9rem;
          box-shadow: 0 20px 50px rgba(20,10,40,0.4);
          font-family: "Titillium Web", Geneva, Tahoma, sans-serif;
          animation: tour-pop-in 0.36s cubic-bezier(.34,1.56,.64,1) both;
        }
        .tour-pop::before {
          content: ""; position: absolute; width: 14px; height: 14px;
          background: #fff; border: 1px solid rgba(124,58,237,0.22);
          transform: rotate(45deg);
        }
        .tour-arrow-left::before  { left: -8px; top: 50%; margin-top: -7px; border-right: none; border-top: none; }
        .tour-arrow-right::before { right: -8px; top: 50%; margin-top: -7px; border-left: none; border-bottom: none; }
        .tour-arrow-top::before   { top: -8px; left: 50%; margin-left: -7px; border-right: none; border-bottom: none; }
        .tour-arrow-bottom::before{ bottom: -8px; left: 50%; margin-left: -7px; border-left: none; border-top: none; background: #f3effc; }
        @keyframes tour-pop-in {
          from { opacity: 0; transform: scale(0.9) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        .tour-pop-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.35rem; }
        .tour-pop-step {
          font-size: 0.62rem; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.1em;
          background: linear-gradient(100deg,#7c3aed,#2F9E5A);
          -webkit-background-clip: text; background-clip: text; color: transparent;
        }
        .tour-skip {
          display: inline-flex; align-items: center; gap: 3px;
          background: rgba(124,58,237,0.08); border: none; cursor: pointer;
          color: #6d28d9; font-weight: 800; font-size: 0.66rem;
          padding: 3px 7px; border-radius: 7px; font-family: inherit;
        }
        .tour-skip:hover { background: rgba(124,58,237,0.16); }

        .tour-pop-title {
          margin: 0 0 0.3rem; font-size: 1.08rem; font-weight: 900;
          color: #1a0b2e; line-height: 1.2; min-height: 1.3em;
        }
        .tour-pop-body {
          margin: 0 0 0.7rem; font-size: 0.85rem; line-height: 1.5;
          color: #4a3d63; min-height: 2.5em;
        }
        .tw-caret {
          display: inline-block; width: 2px; height: 1em; vertical-align: -0.15em;
          background: #7c3aed; margin-left: 1px; animation: tw-blink 0.7s step-end infinite;
        }
        @keyframes tw-blink { 50% { opacity: 0; } }

        .tour-pop-foot { display: flex; align-items: center; justify-content: flex-end; min-height: 36px; }
        .tour-next {
          display: inline-flex; align-items: center; gap: 6px;
          background: linear-gradient(100deg,#7c3aed,#6024c4); color: #fff;
          border: none; border-radius: 10px; cursor: pointer;
          font-weight: 800; font-size: 0.9rem; padding: 0.5rem 1.1rem;
          font-family: inherit; box-shadow: 0 5px 16px rgba(91,33,182,0.4);
          transition: transform .12s, filter .12s;
        }
        .tour-next:hover { transform: translateY(-1px); filter: brightness(1.07); }
        .tour-next-on { background: linear-gradient(100deg,#2F9E5A,#7c3aed); animation: tour-ready 1.4s ease-in-out infinite; }
        @keyframes tour-ready {
          0%,100% { box-shadow: 0 5px 16px rgba(47,158,90,0.4); }
          50%     { box-shadow: 0 6px 22px rgba(124,58,237,0.6); }
        }
        .tour-waiting {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: 0.78rem; font-weight: 700; color: #8a7aa8;
        }
        .tour-waiting-dot {
          width: 9px; height: 9px; border-radius: 50%;
          background: #7c3aed; animation: tour-dot 1s ease-in-out infinite;
        }
        @keyframes tour-dot { 0%,100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }

        /* Barra "Avanti" quando una modale è aperta sopra il tour. */
        .tour-bar {
          position: fixed; left: 50%; bottom: 22px; transform: translateX(-50%);
          display: flex; align-items: center; gap: 0.9rem;
          background: linear-gradient(100deg,#1a0b2e,#103820);
          border: 1px solid rgba(124,58,237,0.4);
          border-radius: 14px; padding: 0.6rem 0.7rem 0.6rem 1.1rem;
          box-shadow: 0 16px 40px rgba(0,0,0,0.5);
          font-family: "Titillium Web", sans-serif; max-width: calc(100vw - 24px);
          animation: tour-bar-in 0.4s cubic-bezier(.34,1.56,.64,1) both;
        }
        @keyframes tour-bar-in { from { opacity: 0; transform: translate(-50%, 16px); } to { opacity: 1; transform: translate(-50%, 0); } }
        .tour-bar-txt {
          display: inline-flex; align-items: center; gap: 7px;
          color: #d4e8dc; font-weight: 700; font-size: 0.82rem;
        }
        .tour-bar-txt svg { color: #6fd08a; flex-shrink: 0; }
        .tour-bar-btns { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }

        @media (prefers-reduced-motion: reduce) {
          .tour-halo, .tour-hint, .tour-next-on, .tour-waiting-dot { animation: none; }
        }
      `;

// Effetto macchina da scrivere: scrive `text` un carattere alla volta.
function Typewriter({ text, speed = 16, startDelay = 0 }: { text: string; speed?: number; startDelay?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const start = setTimeout(function tick() {
      i++;
      setN(i);
      if (i < text.length) timer = setTimeout(tick, speed);
    }, startDelay);
    return () => { clearTimeout(start); clearTimeout(timer); };
  }, [text, speed, startDelay]);
  const done = n >= text.length;
  return (
    <>
      {text.slice(0, n)}
      {!done && <span className="tw-caret" />}
    </>
  );
}
