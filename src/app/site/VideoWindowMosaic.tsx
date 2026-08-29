// ─────────────────────────────────────────────────────────────────────────────
// La finestra video sul piano di tessere.
//
// Una finestra di browser con dentro il video del sito, appoggiata su un campo
// di tessere della tinta da cui sbuca sui quattro lati. È lo stesso vocabolario
// delle cinque schede della griglia prodotti — tessere, una tinta sola —
// portato su un oggetto diverso.
//
// ── Perché un piano e non una cornice ───────────────────────────────────────
// Prima le tessere giravano intorno alla finestra e ci correva dentro una luce.
// Funzionava troppo: l'occhio finiva sul perimetro e l'anteprima — l'unica cosa
// che dimostra qualcosa — restava al centro senza che nessuno la guardasse. Il
// campo fa il contrario: dà alla finestra un pavimento su cui poggiare, si
// legge come mosaico, e sta zitto. È FERMO, e questo è il punto.
//
// ── Cosa fa, in tre pezzi ────────────────────────────────────────────────────
//   ① IL CAMPO. Una maglia di tessere a opacità sparse, più larga della
//      finestra, sfumata sui bordi da una maschera. Non si muove.
//   ② LA FINESTRA. È una lastra del sito (.sb-panel): stesso smusso a 45°,
//      stesso rim che segue il puntatore, stesso sheen delle altre schede. Ha
//      la barra con l'indirizzo vero e il caret che lampeggia, l'area 16:9 col
//      video (o lo screenshot, o il ripiego), e la banda di scansione — anche
//      lei tessellata — che l'attraversa una volta per giro.
//   ③ IL PIEDE. Due dati tecnici sul velo nero della targa mosaico, e quello di
//      sinistra GIRA: tre righe che si danno il cambio.
//
// ── Il video: l'unica cosa che si ferma, e perché ────────────────────────────
// Quel poco che è vivo lo è sempre — la scansione e il caret sono keyframe CSS,
// il browser le sospende da sé a scheda nascosta e non costano niente quando
// non si vedono. Il video no: un <video> che continua a girare sotto sei
// sezioni è lavoro vero per la GPU e per la batteria di chi sta leggendo il
// curriculum più in basso. Quindi parte quando entra a vista e si ferma quando
// esce, con un IntersectionObserver. È la stessa disciplina di
// site/SitePreview.tsx, da cui questo componente prende il posto nella sezione
// «progetti in evidenza».
//
// E chi ha chiesto meno movimento non si ritrova un video che parte da solo:
// resta il fotogramma di copertina, coi comandi per farlo partire a mano.
//
// Il vestito sta in site/videoWindow.css.
// ─────────────────────────────────────────────────────────────────────────────
import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ProjectIcon } from "./projects";
import "./videoWindow.css";

export interface VideoWindowMosaicProps {
  /** Il .mp4 dell'anteprima. Senza, si prova con `img`; senza nemmeno quello,
   *  resta il ripiego col glifo del progetto. */
  src?: string;
  /** Il fotogramma di copertina del video. */
  poster?: string;
  /** Lo screenshot fermo, quando il video non c'è. */
  img?: string;
  /** La chiave `thumb` del progetto, per il glifo del ripiego. */
  thumb?: string;
  /** L'indirizzo mostrato nella barra: si scrive senza schema. */
  url: string;
  /** Le righe del piede che si danno il cambio. La prima è quella che si vede
   *  da ferma, ed è quella che resta con prefers-reduced-motion. */
  lines: string[];
  /** Il dato fisso a destra nel piede — di solito il rapporto d'aspetto. */
  meta?: string;
  /** Testo alternativo del video o dello screenshot. */
  alt: string;
  /** Durata del giro della scansione, in secondi. */
  loop?: number;
  /** Di quanto parte sfasato il giro: due finestre affiancate che scansionano
   *  all'unisono sono una finestra sola grande. */
  phase?: number;
}

/* ── Il campo di tessere ─────────────────────────────────────────────────────
   Le opacità, una per tessera, in nove colonne. Sono scritte a mano e non
   generate: un Math.random() darebbe una maglia diversa a ogni ricarica e una
   grana casuale non è una grana disegnata — qui alcune tessere stanno vicine
   apposta e altre lasciano un vuoto apposta. È lo stesso criterio di
   MOSAIC_FIELD in site/homeLive.tsx, che è il modello di questa maglia; le
   misure no, quelle qui le detta la finestra.

   Sette colonne e non nove, che era il primo taglio: con nove la tessera veniva
   più stretta dello sbordo del campo, e quello che spuntava da sotto la
   finestra era una frangia di listelli invece di una maglia. Sette dà tessere
   larghe quasi quanto alte, che è la sola misura in cui un mosaico si legge
   come mosaico.

   Quaranta valori che riempiono sei righe da sette: le due tessere doppie
   (WIDE) valgono due colonne l'una, 38 + 4 = 42 = 7 × 6. I loro indici non sono
   liberi — una doppia che capita sull'ultima colonna verrebbe buttata a capo
   dalla griglia e lascerebbe un buco quadrato in fondo alla riga. */
const FIELD: number[] = [
  0.20, 0.07, 0.26, 0.11, 0.06, 0.22, 0.09,
  0.14, 0.05, 0.28, 0.08, 0.18, 0.06, 0.24,
  0.10, 0.07, 0.21, 0.13, 0.05, 0.17, 0.27,
  0.09, 0.06, 0.19, 0.12, 0.25, 0.07, 0.16,
  0.23, 0.05, 0.11, 0.08, 0.30, 0.14, 0.06,
  0.20, 0.09, 0.17, 0.05, 0.12,
];

/** Le due tessere larghe il doppio. */
const WIDE = new Set([9, 25]);

/** La tessera piena. Nelle schede della griglia prodotti ce n'è una sola accesa
 *  e si sposta di riquadro in riquadro; qui è ferma, e sta sul fianco destro
 *  nella metà bassa — cioè dove il campo sborda dalla finestra e si vede. È la
 *  firma del mosaico senza il movimento del mosaico. */
const LIT = 32;

/** Il movimento decorativo si accende solo se l'utente non l'ha disattivato. */
function motionOK() {
  return typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Quanto resta ferma una riga del piede prima di dare il cambio. */
const LINE_HOLD = 3800;

function Campo() {
  return (
    <div className="sb-vwm-field" aria-hidden="true">
      {FIELD.map((o, i) => (
        <span
          key={i}
          className={
            "sb-vwm-cell" +
            (WIDE.has(i) ? " sb-vwm-cell--wide" : "") +
            (i === LIT ? " sb-vwm-cell--lit" : "")
          }
          style={{ "--o": o } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

function VideoWindowMosaicBase({
  src,
  poster,
  img,
  thumb,
  url,
  lines,
  meta = "16 : 9",
  alt,
  loop = 11,
  phase = 0,
}: VideoWindowMosaicProps) {
  return (
    <div
      className="sb-vwm"
      style={
        {
          "--vwm-loop": `${loop}s`,
          // Lo sfasamento è un ritardo NEGATIVO: uno positivo terrebbe
          // l'animazione ferma all'inizio, uno negativo la fa partire a giro
          // già avviato — che è quello che serve.
          "--vwm-phase": `${-phase * loop}s`,
        } as React.CSSProperties
      }
    >
      <Campo />

      {/* La finestra È una lastra del sito: .sb-panel le dà lo smusso a 45° e
          il rim, .sb-panel--hover la fa entrare fra le cose che si inclinano
          sotto il puntatore (site/GlassMotion.tsx, TILTABLE) e le accende il
          riflesso al passaggio. --solid perché dietro non c'è niente da
          sfocare: sotto c'è un video, e va visto com'è. */}
      <div className="sb-vwm-win sb-panel sb-panel--hover">
        <div className="sb-panel-inner sb-panel--solid">
          <div className="sb-vwm-bar">
            <span className="sb-vwm-dots" aria-hidden="true">
              <i /><i /><i />
            </span>
            <span className="sb-vwm-url">
              <i className="sb-vwm-lock" aria-hidden="true" />
              <span className="sb-vwm-host" data-no-i18n translate="no">{url}</span>
              <i className="sb-vwm-caret" aria-hidden="true" />
            </span>
            <span className="sb-vwm-chrome" aria-hidden="true">
              <i /><i />
            </span>
          </div>

          <div className="sb-vwm-media">
            {src ? (
              <Filmato src={src} poster={poster} alt={alt} />
            ) : img ? (
              <Scatto src={img} thumb={thumb} alt={alt} />
            ) : (
              <Ripiego thumb={thumb} />
            )}
            <span className="sb-vwm-scan" aria-hidden="true" />
          </div>

          <div className="sb-vwm-foot">
            <PiedeVivo lines={lines} />
            <span className="sb-vwm-meta" data-no-i18n translate="no">
              {meta}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export const VideoWindowMosaic = memo(VideoWindowMosaicBase);
export default VideoWindowMosaic;

/* ── Il piede che gira ───────────────────────────────────────────────────────
   Stessa meccanica delle targhe delle schede mosaico (site/homeLive.tsx): una
   riga alla volta nel DOM, che entra da sotto ed esce da sopra, e una
   finestrella con l'overflow nascosto che la taglia. Nel DOM ce n'è sempre una
   sola — niente pile in position:absolute e niente turni da sincronizzare. */
function PiedeVivo({ lines }: { lines: string[] }) {
  const [i, setI] = useState(0);
  const rowRef = useRef<HTMLSpanElement>(null);
  const first = useRef(true);

  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row || lines.length < 2) return;
    // Con movimento ridotto il piede non gira: resta la prima riga, che è
    // quella scritta per stare ferma.
    if (!motionOK()) return;

    let alive = true;
    let timer = 0;

    if (first.current) first.current = false;
    else {
      gsap.fromTo(
        row,
        { yPercent: 110, autoAlpha: 0 },
        { yPercent: 0, autoAlpha: 1, duration: 0.4, ease: "power3.out" },
      );
    }

    timer = window.setTimeout(() => {
      if (!alive) return;
      gsap.to(row, {
        yPercent: -110,
        autoAlpha: 0,
        duration: 0.28,
        ease: "power2.in",
        onComplete: () => {
          if (alive) setI((v) => (v + 1) % lines.length);
        },
      });
    }, LINE_HOLD);

    return () => {
      alive = false;
      window.clearTimeout(timer);
      gsap.killTweensOf(row);
    };
  }, [i, lines]);

  return (
    <span className="sb-vwm-slot">
      <span className="sb-vwm-line" key={i} ref={rowRef}>
        {lines[i]}
      </span>
    </span>
  );
}

/* ── Il video ────────────────────────────────────────────────────────────── */

function Filmato({ src, poster, alt }: { src: string; poster?: string; alt: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [still, setStill] = useState(true);

  useEffect(() => {
    setStill(!motionOK());
  }, []);

  // Suona solo mentre lo si guarda. Vedi la nota in testa al file.
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
    <div ref={wrapRef} style={{ position: "absolute", inset: 0 }}>
      <video
        ref={videoRef}
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

/* ── Lo screenshot ───────────────────────────────────────────────────────── */

function Scatto({ src, thumb, alt }: { src: string; thumb?: string; alt: string }) {
  // Ripiego silenzioso: se il file non c'è non si mostra il rettangolo rotto
  // del browser, si torna alla cornice col glifo.
  const [failed, setFailed] = useState(false);
  if (failed) return <Ripiego thumb={thumb} />;
  return (
    <img
      src={src}
      alt={alt}
      width={1280}
      height={720}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}

/* ── Il ripiego ──────────────────────────────────────────────────────────── */

function Ripiego({ thumb }: { thumb?: string }) {
  return (
    <div className="sb-vwm-empty" aria-hidden="true">
      <span className="sb-vwm-empty-ring" />
      <ProjectIcon thumb={thumb} size={28} />
    </div>
  );
}
