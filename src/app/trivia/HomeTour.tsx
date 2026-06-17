import { useState, useEffect, useRef, useCallback } from "react";
import { X, MousePointerClick, ArrowRight } from "lucide-react";

// ════════════════════════════════════════════════════════════════════════════
// HomeTour — tour guidato "a riflettore" sulla home di Trivia.
// ════════════════════════════════════════════════════════════════════════════
// Oscura tutta la pagina TRANNE il pulsante della funzione corrente (alone
// luminoso) e mostra un popup verde-viola con testo a macchina da scrivere.
//
// Due tipi di passo (`kind`):
//  • "modal" → l'utente DEVE aprire la funzione cliccando il pulsante reale; il
//    tour rileva l'apertura della modale, nasconde la maschera (così la scheda
//    si vede pulita) e avanza DA SOLO appena la modale viene chiusa (la sua ✕
//    funge da "Avanti").
//  • "info"  → nessuna azione: spotlight + popup con tasto "Avanti". Il click sul
//    pulsante reale è BLOCCATO (così "Come si gioca" non riapre se stesso in loop).
//
// Si può sempre abbandonare ("Salta" / Esc). I target sono [data-tour="..."].

export interface TourStep {
  selector: string;            // es. '[data-tour="leaderboard"]'
  title: string;
  body: string;
  kind: "modal" | "info";
  hint?: string;               // micro-hint sopra il pulsante (solo "modal")
  // selettore della modale che si apre cliccando (solo "modal"): quando appare
  // e poi sparisce, il tour avanza. Default: qualsiasi [role=dialog].
  modalSelector?: string;
}

interface HomeTourProps {
  steps: TourStep[];
  onDone: () => void;
  onCloseModals?: () => void;  // chiude eventuali modali rimaste aperte
}

interface Rect { top: number; left: number; width: number; height: number; }

const PAD = 8;

export default function HomeTour({ steps, onDone, onCloseModals }: HomeTourProps) {
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [modalShown, setModalShown] = useState(false);  // modale aperta (passo "modal")
  const [exiting, setExiting] = useState(false);

  const step = steps[idx];
  const isLast = idx === steps.length - 1;

  const finish = useCallback(() => {
    onCloseModals?.();
    setExiting(true);
    setTimeout(onDone, 260);
  }, [onDone, onCloseModals]);

  const next = useCallback(() => {
    onCloseModals?.();
    setModalShown(false);
    setIdx(i => (i >= steps.length - 1 ? i : i + 1));
    if (idx >= steps.length - 1) finish();
  }, [idx, steps.length, finish, onCloseModals]);

  // ── Misura il target del passo, con retry finché compare (max ~1.2s). Se non
  //    compare proprio, salta il passo invece di lasciare lo schermo nero. ──
  useEffect(() => {
    let raf = 0, tries = 0, alive = true;
    const tick = () => {
      if (!alive) return;
      // Possono esistere DUE match (markup mobile + desktop): scegli il primo
      // VISIBILE (rettangolo non nullo), così non misuriamo quello nascosto.
      const els = Array.from(document.querySelectorAll<HTMLElement>(step.selector));
      const el = els.find(e => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; }) ?? null;
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          // clampa il riquadro alla viewport: se il target è più alto/largo dello
          // schermo (es. una colonna che scrolla), il "buco" e il popup restano
          // comunque visibili e non finiscono fuori schermo.
          const vpH = window.innerHeight, vpW = window.innerWidth;
          const top = Math.max(r.top, 6);
          const left = Math.max(r.left, 6);
          const height = Math.min(r.bottom, vpH - 6) - top;
          const width = Math.min(r.right, vpW - 6) - left;
          setRect({ top, left, width: Math.max(width, 0), height: Math.max(height, 0) });
          raf = requestAnimationFrame(tick);   // continua a riallineare (scroll/anim)
          return;
        }
      }
      tries++;
      if (tries > 75) {                          // ~1.2s a 60fps: arrenditi e salta
        if (isLast) finish(); else next();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { alive = false; cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, step.selector]);

  // ── Passi "modal": clicca il target → si apre la modale → quando la chiudi
  //    (✕ / Esc / click fuori) il tour avanza. Rilevazione via osservazione DOM. ──
  useEffect(() => {
    if (step.kind !== "modal") return;
    const sel = step.modalSelector ?? '[role="dialog"]';
    let wasOpen = false;
    const check = () => {
      const open = !!document.querySelector(sel);
      if (open && !wasOpen) { wasOpen = true; setModalShown(true); }
      else if (!open && wasOpen) { wasOpen = false; next(); }   // chiusa → avanza
    };
    check();
    const id = window.setInterval(check, 60);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, step.kind, step.modalSelector]);

  // Esc abbandona.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !modalShown) finish(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finish, modalShown]);

  if (!step) return null;

  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const POP_W = Math.min(330, vw - 24);
  const POP_H = 188;

  // Posizione popup: a sinistra del target se c'è spazio (rail destro), altrimenti
  // destra, altrimenti sopra/sotto. Sempre dentro la viewport.
  let popLeft = 0, popTop = 0, arrow: "left" | "right" | "top" | "bottom" = "left";
  if (rect) {
    const clampTop = (t: number) => Math.min(Math.max(t, 12), vh - POP_H - 12);
    if (rect.left > POP_W + 26) {
      popLeft = rect.left - POP_W - 18; popTop = clampTop(rect.top + rect.height / 2 - POP_H / 2); arrow = "right";
    } else if (vw - (rect.left + rect.width) > POP_W + 26) {
      popLeft = rect.left + rect.width + 18; popTop = clampTop(rect.top + rect.height / 2 - POP_H / 2); arrow = "left";
    } else {
      popLeft = Math.min(Math.max(rect.left + rect.width / 2 - POP_W / 2, 12), vw - POP_W - 12);
      if (rect.top > vh / 2) { popTop = rect.top - POP_H - 16; arrow = "bottom"; }
      else { popTop = rect.top + rect.height + 16; arrow = "top"; }
    }
  }

  // ── Passo "modal" con scheda aperta: nascondi la maschera, mostra solo la
  //    barra-istruzione (la modale è già pulita sotto). ──
  if (step.kind === "modal" && modalShown) {
    return (
      <div className="tour-root" style={{ position: "fixed", inset: 0, zIndex: 1400, pointerEvents: "none", opacity: exiting ? 0 : 1 }}>
        <div className="tour-bar" style={{ pointerEvents: "auto" }}>
          <span className="tour-bar-txt"><MousePointerClick size={15} /> Chiudila con la ✕ per continuare il tour</span>
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
    <div className="tour-root" style={{ position: "fixed", inset: 0, zIndex: 1400, opacity: exiting ? 0 : 1, pointerEvents: "none" }}>
      {rect ? (
        <>
          {/* 4 pannelli scuri attorno al target (lo lasciano luminoso). Cliccare
              fuori NON chiude (evita uscite accidentali): solo "Salta"/Esc. */}
          <div className="tour-mask" style={{ top: 0, left: 0, width: "100%", height: Math.max(rect.top - PAD, 0) }} />
          <div className="tour-mask" style={{ top: rect.top + rect.height + PAD, left: 0, width: "100%", height: Math.max(vh - (rect.top + rect.height + PAD), 0) }} />
          <div className="tour-mask" style={{ top: Math.max(rect.top - PAD, 0), left: 0, width: Math.max(rect.left - PAD, 0), height: rect.height + PAD * 2 }} />
          <div className="tour-mask" style={{ top: Math.max(rect.top - PAD, 0), left: rect.left + rect.width + PAD, width: Math.max(vw - (rect.left + rect.width + PAD), 0), height: rect.height + PAD * 2 }} />
          <div className="tour-halo" style={{ top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }} />

          {step.kind === "modal" ? (
            // hint "tocca qui" sopra il pulsante (il click reale passa e apre la modale)
            <div className="tour-hint" style={{ top: rect.top - 36, left: rect.left + rect.width / 2 }}>
              <MousePointerClick size={15} /> {step.hint ?? "Aprila per provare"}
            </div>
          ) : (
            // INFO: scudo trasparente sopra il target → blocca il click (niente loop)
            <div className="tour-shield" style={{ top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }} />
          )}
        </>
      ) : (
        // nessun target ancora: velo leggero (transitorio, dura pochi frame)
        <div className="tour-mask" style={{ inset: 0, width: "100%", height: "100%" }} />
      )}

      {rect && (
        <div key={idx} className={`tour-pop tour-arrow-${arrow}`} style={{ left: popLeft, top: popTop, width: POP_W }}>
          <div className="tour-pop-head">
            <span className="tour-pop-step">Tour · {idx + 1}/{steps.length}</span>
            <button type="button" className="tour-skip" onClick={finish}><X size={13} /> Salta</button>
          </div>
          <h3 className="tour-pop-title"><Typewriter text={step.title} speed={16} /></h3>
          <p className="tour-pop-body"><Typewriter text={step.body} speed={9} startDelay={step.title.length * 16 + 120} /></p>
          <div className="tour-pop-foot">
            {step.kind === "info" ? (
              <button type="button" className="tour-next tour-next-on" onClick={next}>
                {isLast ? "Fine! 🎉" : <>Avanti <ArrowRight size={15} /></>}
              </button>
            ) : (
              <span className="tour-waiting"><span className="tour-waiting-dot" /> Premi il pulsante evidenziato</span>
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
    position: fixed; background: rgba(9,18,13,0.78);
    backdrop-filter: blur(2px); pointer-events: auto;
    animation: tour-fade 0.22s ease both;
  }
  @keyframes tour-fade { from { opacity: 0; } to { opacity: 1; } }

  .tour-halo {
    position: fixed; border-radius: 14px; pointer-events: none;
    box-shadow: 0 0 0 2px #9b5cf6, 0 0 0 5px rgba(124,58,237,0.35), 0 0 32px 6px rgba(47,158,90,0.45);
    animation: tour-halo-pulse 1.6s ease-in-out infinite;
  }
  @keyframes tour-halo-pulse {
    0%,100% { box-shadow: 0 0 0 2px #9b5cf6, 0 0 0 5px rgba(124,58,237,0.30), 0 0 26px 5px rgba(47,158,90,0.4); }
    50%     { box-shadow: 0 0 0 2px #b794ff, 0 0 0 7px rgba(124,58,237,0.5), 0 0 40px 10px rgba(47,158,90,0.6); }
  }
  /* scudo invisibile che intercetta il click sui passi "info" (niente loop) */
  .tour-shield { position: fixed; pointer-events: auto; cursor: default; border-radius: 14px; }

  .tour-hint {
    position: fixed; transform: translate(-50%, -100%);
    display: inline-flex; align-items: center; gap: 5px;
    background: linear-gradient(100deg,#7c3aed,#2F9E5A);
    color: #fff; font-weight: 800; font-size: 0.72rem;
    padding: 5px 10px; border-radius: 999px; white-space: nowrap;
    box-shadow: 0 6px 18px rgba(91,33,182,0.45); pointer-events: none;
    font-family: "Titillium Web", sans-serif;
    animation: tour-hint-bob 1s ease-in-out infinite;
  }
  @keyframes tour-hint-bob { 0%,100% { transform: translate(-50%,-100%); } 50% { transform: translate(-50%, calc(-100% - 5px)); } }

  .tour-pop {
    position: fixed; z-index: 1401; pointer-events: auto;
    background: linear-gradient(160deg,#fff 0%,#fff 60%,#f3effc 100%);
    border: 1px solid rgba(124,58,237,0.22);
    border-radius: 16px; padding: 0.8rem 1rem 0.85rem;
    box-shadow: 0 20px 50px rgba(20,10,40,0.4);
    font-family: "Titillium Web", Geneva, Tahoma, sans-serif;
    animation: tour-pop-in 0.28s cubic-bezier(.34,1.56,.64,1) both;
  }
  .tour-pop::before { content:""; position:absolute; width:14px; height:14px; background:#fff; border:1px solid rgba(124,58,237,0.22); transform:rotate(45deg); }
  .tour-arrow-left::before  { left:-8px; top:50%; margin-top:-7px; border-right:none; border-top:none; }
  .tour-arrow-right::before { right:-8px; top:50%; margin-top:-7px; border-left:none; border-bottom:none; }
  .tour-arrow-top::before   { top:-8px; left:50%; margin-left:-7px; border-right:none; border-bottom:none; }
  .tour-arrow-bottom::before{ bottom:-8px; left:50%; margin-left:-7px; border-left:none; border-top:none; background:#f3effc; }
  @keyframes tour-pop-in { from { opacity:0; transform:scale(0.92) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }

  .tour-pop-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:0.3rem; }
  .tour-pop-step { font-size:0.62rem; font-weight:800; text-transform:uppercase; letter-spacing:0.1em; background:linear-gradient(100deg,#7c3aed,#2F9E5A); -webkit-background-clip:text; background-clip:text; color:transparent; }
  .tour-skip { display:inline-flex; align-items:center; gap:3px; background:rgba(124,58,237,0.08); border:none; cursor:pointer; color:#6d28d9; font-weight:800; font-size:0.66rem; padding:3px 7px; border-radius:7px; font-family:inherit; }
  .tour-skip:hover { background:rgba(124,58,237,0.16); }
  .tour-pop-title { margin:0 0 0.28rem; font-size:1.06rem; font-weight:900; color:#1a0b2e; line-height:1.2; min-height:1.3em; }
  .tour-pop-body { margin:0 0 0.65rem; font-size:0.85rem; line-height:1.5; color:#4a3d63; min-height:2.5em; }
  .tw-caret { display:inline-block; width:2px; height:1em; vertical-align:-0.15em; background:#7c3aed; margin-left:1px; animation:tw-blink 0.6s step-end infinite; }
  @keyframes tw-blink { 50% { opacity:0; } }

  .tour-pop-foot { display:flex; align-items:center; justify-content:flex-end; min-height:34px; }
  .tour-next { display:inline-flex; align-items:center; gap:6px; background:linear-gradient(100deg,#7c3aed,#6024c4); color:#fff; border:none; border-radius:10px; cursor:pointer; font-weight:800; font-size:0.9rem; padding:0.5rem 1.1rem; font-family:inherit; box-shadow:0 5px 16px rgba(91,33,182,0.4); transition:transform .12s, filter .12s; }
  .tour-next:hover { transform:translateY(-1px); filter:brightness(1.08); }
  .tour-next:active { transform:scale(0.97); }
  .tour-next-on { background:linear-gradient(100deg,#2F9E5A,#7c3aed); animation:tour-ready 1.3s ease-in-out infinite; }
  @keyframes tour-ready { 0%,100% { box-shadow:0 5px 16px rgba(47,158,90,0.4); } 50% { box-shadow:0 6px 22px rgba(124,58,237,0.6); } }
  .tour-waiting { display:inline-flex; align-items:center; gap:7px; font-size:0.76rem; font-weight:700; color:#8a7aa8; }
  .tour-waiting-dot { width:9px; height:9px; border-radius:50%; background:#7c3aed; animation:tour-dot 0.9s ease-in-out infinite; }
  @keyframes tour-dot { 0%,100% { opacity:0.3; transform:scale(0.8); } 50% { opacity:1; transform:scale(1.2); } }

  .tour-bar {
    position: fixed; left: 50%; bottom: 22px; transform: translateX(-50%);
    display: flex; align-items: center; gap: 0.9rem;
    background: linear-gradient(100deg,#1a0b2e,#103820);
    border: 1px solid rgba(124,58,237,0.4);
    border-radius: 14px; padding: 0.6rem 0.7rem 0.6rem 1.1rem;
    box-shadow: 0 16px 40px rgba(0,0,0,0.5);
    font-family: "Titillium Web", sans-serif; max-width: calc(100vw - 24px);
    animation: tour-bar-in 0.32s cubic-bezier(.34,1.56,.64,1) both;
  }
  @keyframes tour-bar-in { from { opacity:0; transform:translate(-50%,16px); } to { opacity:1; transform:translate(-50%,0); } }
  .tour-bar-txt { display:inline-flex; align-items:center; gap:7px; color:#d4e8dc; font-weight:700; font-size:0.82rem; }
  .tour-bar-txt svg { color:#6fd08a; flex-shrink:0; }
  .tour-bar-btns { display:flex; align-items:center; gap:0.5rem; flex-shrink:0; }

  @media (prefers-reduced-motion: reduce) {
    .tour-halo, .tour-hint, .tour-next-on, .tour-waiting-dot { animation: none; }
  }
`;

// Macchina da scrivere: scrive `text` un carattere alla volta (a blocchi di 2
// per essere veloce ma fluida).
function Typewriter({ text, speed = 14, startDelay = 0 }: { text: string; speed?: number; startDelay?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const start = setTimeout(function tick() {
      i = Math.min(i + 2, text.length);
      setN(i);
      if (i < text.length) timer = setTimeout(tick, speed);
    }, startDelay);
    return () => { clearTimeout(start); clearTimeout(timer); };
  }, [text, speed, startDelay]);
  return (
    <>
      {text.slice(0, n)}
      {n < text.length && <span className="tw-caret" />}
    </>
  );
}
