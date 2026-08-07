// ─────────────────────────────────────────────────────────────────────────────
// SpotlightCard — React Bits (variante ts-tailwind), riscritto per questo sito.
// Origine: github.com/DavidHDev/react-bits · src/ts-tailwind/Components/SpotlightCard
//
// Un alone che segue il puntatore dentro la card. L'idea è la stessa
// dell'originale; l'implementazione no, per due ragioni concrete.
//
// ① L'originale disegna anche la CORNICE della card
//    (`rounded-3xl border border-neutral-800 bg-neutral-900 p-8`). Qui la
//    cornice esiste già ed è il pezzo forte del design system: il vetro di
//    .sb-panel col rim da 1px. Quindi questo componente non disegna niente di
//    suo — è un guscio trasparente attorno alla card, e mette solo l'alone.
//
// ② L'originale tiene la posizione del puntatore in useState e ricostruisce il
//    radial-gradient in un inline style: un render di React e un gradiente
//    nuovo a ogni movimento del mouse. È esattamente la cosa che era stata
//    TOLTA dalle card di questa home, e per cui era stata tolta — vedi il
//    commento in home.css sopra .sb-panel. Qui invece si scrivono due variabili
//    CSS (--spot-x, --spot-y) direttamente sul nodo, una volta per frame: il
//    gradiente sta nel foglio di stile e il browser lo ricompone senza
//    ricostruirlo, e React non rirenderizza mai.
//
// Anche l'accensione/spegnimento è in CSS (:hover / :focus-within in home.css):
// non serve nessuno stato React per una cosa che il foglio di stile sa già fare.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useRef } from 'react';

interface SpotlightCardProps extends React.PropsWithChildren {
  className?: string;
  /** Colore dell'alone. Accetta qualsiasi valore CSS: finisce in --spot-color. */
  spotlightColor?: string;
}

const SpotlightCard: React.FC<SpotlightCardProps> = ({ children, className = '', spotlightColor }) => {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const point = useRef({ x: 0, y: 0 });

  // Il puntatore si muove molto più spesso di quanto lo schermo si aggiorni:
  // accumulo l'ultima posizione e scrivo una volta sola per frame.
  //
  // La misura della card si prende UNA volta, entrando. Stava dentro il frame,
  // e la ragione era buona — la pagina scorre sotto un puntatore fermo e una
  // misura vecchia sbaglierebbe — ma il prezzo era peggiore del problema:
  // dentro il frame la lettura cade subito dopo le scritture di stile di GSAP
  // (tilt e rim, in site/GlassMotion.tsx), e ogni lettura in quel punto
  // costringe il browser a rifare il layout prima di rispondere. Su sette card
  // erano tre o quattro layout sincroni per frame.
  //
  // La misura si butta via allo scroll e al ridimensionamento, che sono gli
  // unici due casi in cui scade: il resto del tempo la card sta ferma.
  const rect = useRef<DOMRect | null>(null);

  const onPointerEnter = () => {
    rect.current = ref.current?.getBoundingClientRect() ?? null;
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    point.current = { x: e.clientX, y: e.clientY };
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const el = ref.current;
      if (!el) return;
      const r = (rect.current ??= el.getBoundingClientRect());
      el.style.setProperty('--spot-x', `${point.current.x - r.left}px`);
      el.style.setProperty('--spot-y', `${point.current.y - r.top}px`);
    });
  };

  useEffect(() => {
    // In cattura: su questo sito scorre <body>, non la finestra, e l'evento di
    // scroll di un elemento non risale fino a window.
    const stale = () => {
      rect.current = null;
    };
    document.addEventListener('scroll', stale, { passive: true, capture: true });
    window.addEventListener('resize', stale);
    return () => {
      document.removeEventListener('scroll', stale, { capture: true });
      window.removeEventListener('resize', stale);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`sb-spot ${className}`}
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      style={spotlightColor ? ({ '--spot-color': spotlightColor } as React.CSSProperties) : undefined}
    >
      {children}
      {/* Dopo i figli, non prima: così l'alone passa SOPRA il vetro invece di
          finirci dietro (il rim di .sb-panel è opaco e lo nasconderebbe). */}
      <span className="sb-spot-glow" aria-hidden="true" />
    </div>
  );
};

export default SpotlightCard;
