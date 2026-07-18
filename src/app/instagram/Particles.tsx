import { useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Campo di particelle "vive" — canvas vanilla, zero librerie (CSP-safe).
// Soffici bagliori caldi che salgono lenti con un tocco di parallasse sul mouse,
// per dare vita alla pagina senza disturbare la lettura. Rispetta
// prefers-reduced-motion (niente moto) e si mette in pausa a scheda nascosta.
// I colori seguono il tema (arancio Yaru), leggibili su chiaro e scuro.
// ─────────────────────────────────────────────────────────────────────────────

type P = { x: number; y: number; r: number; vy: number; vx: number; a: number; hue: number };

export default function Particles() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    let parts: P[] = [];
    let raf = 0;
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };

    // Numero proporzionale all'area, con tetto per non pesare su mobile.
    const count = () => Math.min(46, Math.round((w * h) / 42000));

    const make = (): P => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 1 + Math.random() * 2.6,
      vy: -(0.05 + Math.random() * 0.18),          // salgono piano
      vx: (Math.random() - 0.5) * 0.12,
      a: 0.08 + Math.random() * 0.22,               // opacità soffusa
      hue: 18 + Math.random() * 14,                 // arancio caldo (18–32°)
    });

    const resize = () => {
      w = canvas.clientWidth; h = canvas.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      parts = Array.from({ length: count() }, make);
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      // Parallasse dolce: il campo scivola pochissimo verso il mouse.
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;
      const ox = (mouse.x - 0.5) * 22;
      const oy = (mouse.y - 0.5) * 22;

      for (const p of parts) {
        if (!reduce) {
          p.y += p.vy; p.x += p.vx;
          if (p.y < -8) { p.y = h + 8; p.x = Math.random() * w; }
          if (p.x < -8) p.x = w + 8; else if (p.x > w + 8) p.x = -8;
        }
        const g = ctx.createRadialGradient(p.x + ox, p.y + oy, 0, p.x + ox, p.y + oy, p.r * 4);
        g.addColorStop(0, `hsla(${p.hue}, 85%, 55%, ${p.a})`);
        g.addColorStop(1, "hsla(24, 85%, 55%, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x + ox, p.y + oy, p.r * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    const onMove = (e: MouseEvent) => {
      mouse.tx = e.clientX / window.innerWidth;
      mouse.ty = e.clientY / window.innerHeight;
    };
    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    if (reduce) draw(); // un solo frame statico
    else raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas ref={ref} className="ig-particles" aria-hidden="true" />;
}
