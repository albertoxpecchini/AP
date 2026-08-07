// ─────────────────────────────────────────────────────────────────────────────
// Monta i figli solo quando il riquadro si avvicina alla finestra.
//
// Serve a una cosa sola, ma quella cosa pesa: React.lazy NON è pigro rispetto
// allo SCROLL, è pigro rispetto al RENDER. Un <Suspense><Mappa /></Suspense>
// scritto in fondo alla pagina viene renderizzato insieme al resto, quindi il
// suo import() parte al primo frame — e maplibre-gl sono ~290 kB gzip che si
// scaricano mentre l'utente sta ancora leggendo il titolo, per una mappa che
// sta duemila pixel più in basso e che moltissimi non raggiungeranno mai.
//
// Con questo involucro l'import parte quando la mappa è a un margine di
// distanza dalla finestra: chi ci arriva la trova già pronta, chi non ci arriva
// non la scarica. Il margine è generoso apposta (500px ≈ mezza schermata di
// anticipo): il caricamento deve finire PRIMA che il riquadro entri in scena,
// altrimenti si è solo spostato il problema più in basso.
//
// Una volta montato non si smonta più: un componente che sparisce uscendo dalla
// finestra vuol dire perdere lo stato (la mappa tornerebbe al centro iniziale a
// ogni passata) e ricomprare il montaggio a ogni giro di scroll.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState, type ReactNode } from "react";

export default function WhenVisible({
  children,
  className,
  rootMargin = "500px",
}: {
  children: ReactNode;
  /** Va sull'involucro: questo componente PRENDE IL POSTO del contenitore. */
  className?: string;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (shown) return;
    const el = ref.current;
    if (!el) return;
    // Browser senza IntersectionObserver (o test): meglio il contenuto pesante
    // che nessun contenuto.
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [shown, rootMargin]);

  return (
    <div ref={ref} className={className}>
      {shown ? children : null}
    </div>
  );
}
