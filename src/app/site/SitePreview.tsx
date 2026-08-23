// ─────────────────────────────────────────────────────────────────────────────
// La finestra di browser delle schede «progetti in evidenza».
//
// Dentro ci va, in ordine di preferenza, quello che il progetto ha:
//   previewVideo  → una registrazione dello schermo che parte a vista
//   previewImg    → uno screenshot fermo
//   niente        → la cornice vuota col glifo del progetto
//
// L'ultimo caso non è un ripiego teorico: /instagram-preview.png non esiste
// ancora, e la home deve restare presentabile finché non viene prodotto. Vale
// anche per un file cancellato per sbaglio — `onError` porta allo stesso posto.
//
// Perché non riusare FreshWork.tsx, che questa finestra ce l'ha già: quel file
// è dichiaratamente temporaneo e il suo commento di testata spiega come
// cancellarlo (file, CSS, video, due righe in App.tsx). Appoggiarci sopra le
// schede in evidenza vorrebbe dire romperne il patto di rimozione. Qui se ne
// ricopia la disciplina, che è quella collaudata; il codice resta separato.
// ─────────────────────────────────────────────────────────────────────────────
import { memo, useEffect, useRef, useState } from "react";
import { ProjectIcon } from "./projects";

export interface SitePreviewProps {
  /** Indirizzo mostrato nella pillola della barra: si scrive senza schema. */
  label: string;
  video?: string;
  poster?: string;
  img?: string;
  /** La chiave `thumb` del progetto, per il glifo del ripiego. */
  thumb?: string;
  /** Testo alternativo dello screenshot o del video. */
  alt: string;
}

function SitePreviewBase({ label, video, poster, img, thumb, alt }: SitePreviewProps) {
  return (
    // --solid: dietro un video o uno screenshot non c'è niente da sfocare, e
    // un backdrop-filter lì è lavoro pagato a vuoto su ogni fotogramma.
    <div className="sb-panel sb-shotframe">
      <div className="sb-panel-inner sb-panel--solid sb-shotframe-inner">
        <div className="sb-codehead sb-shotframe-bar" data-no-i18n>
          <i /><i /><i />
          <span className="sb-shotframe-url" translate="no">{label}</span>
        </div>
        {video ? (
          <PreviewVideo src={video} poster={poster} alt={alt} />
        ) : img ? (
          <PreviewImage src={img} thumb={thumb} alt={alt} />
        ) : (
          <PreviewEmpty thumb={thumb} />
        )}
      </div>
    </div>
  );
}

export const SitePreview = memo(SitePreviewBase);
export default SitePreview;

// ── Il video ────────────────────────────────────────────────────────────────

function PreviewVideo({ src, poster, alt }: { src: string; poster?: string; alt: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  // Chi ha chiesto meno movimento non si ritrova un video che parte da solo:
  // resta il fotogramma di copertina, coi comandi per farlo partire a mano.
  const [still, setStill] = useState(true);

  useEffect(() => {
    setStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Suona solo mentre lo si guarda. Un video che continua a girare sotto altre
  // sei sezioni è lavoro puro per la GPU (e per la batteria) di chi sta
  // leggendo il curriculum più in basso.
  useEffect(() => {
    if (still) return;
    const el = wrapRef.current;
    const v = videoRef.current;
    if (!el || !v || typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      ([entry]) => {
        // play() può essere rifiutata (autoplay negato, scheda in secondo
        // piano): è un caso previsto, resta il poster.
        if (entry.isIntersecting) void v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [still]);

  return (
    <div ref={wrapRef} className="sb-shotframe-media">
      <video
        ref={videoRef}
        className="sb-shotframe-video"
        poster={poster}
        width={1280}
        height={720}
        loop
        muted
        playsInline
        preload="metadata"
        controls={still}
        aria-label={alt}
      >
        <source src={src} type="video/mp4" />
      </video>
    </div>
  );
}

// ── Lo screenshot ───────────────────────────────────────────────────────────

function PreviewImage({ src, thumb, alt }: { src: string; thumb?: string; alt: string }) {
  // Stesso ripiego silenzioso delle foto della bio: se il file non c'è, non si
  // mostra il rettangolo rotto del browser — si torna alla cornice col glifo.
  const [failed, setFailed] = useState(false);
  if (failed) return <PreviewEmpty thumb={thumb} />;
  return (
    <div className="sb-shotframe-media">
      <img
        className="sb-shotframe-img"
        src={src}
        alt={alt}
        width={1280}
        height={720}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

// ── Il ripiego ──────────────────────────────────────────────────────────────

function PreviewEmpty({ thumb }: { thumb?: string }) {
  return (
    <div className="sb-shotframe-media sb-shotframe-empty" aria-hidden="true">
      <ProjectIcon thumb={thumb} size={34} />
    </div>
  );
}
