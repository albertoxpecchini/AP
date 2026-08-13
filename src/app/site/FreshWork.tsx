// ─────────────────────────────────────────────────────────────────────────────
// Banner «lavoro fresco» — rivaltasulmincio.it è tornato online.
//
// È una fascia TEMPORANEA in cima alla home: sta sotto la hero, prima della
// griglia prodotti, ed è la prima cosa che si incontra scendendo. Serve a dire
// una cosa sola — «questo sito è appena stato messo online, guardalo» — e a
// mostrarlo davvero, con il video del sito che scorre in loop dentro una
// finestra di browser.
//
// ── COME SI TOGLIE ──────────────────────────────────────────────────────────
// Metti SHOW a false qui sotto: la fascia sparisce e basta. Per rimuoverla del
// tutto: cancella questo file, `freshWork.css`, i tre file in `public/video/`
// e le due righe in App.tsx (l'import e <FreshWork />).
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";
import { IcArrowRight, IcExternal } from "./homeIcons";
import "./freshWork.css";

/** Interruttore unico della fascia. false = non viene renderizzata. */
const SHOW = true;

const SITE_URL = "https://rivaltasulmincio.it";
const POSTER = "/video/rivalta-sul-mincio.webp";

export default function FreshWork() {
  if (!SHOW) return null;
  return <FreshWorkBand />;
}

function FreshWorkBand() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const bandRef = useRef<HTMLElement>(null);
  // Chi ha chiesto meno movimento non si ritrova un video che parte da solo:
  // resta il fotogramma di copertina, con i comandi per farlo partire a mano.
  const [still, setStill] = useState(true);

  useEffect(() => {
    setStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Il video suona solo mentre lo si guarda. Fuori dalla finestra viene messo
  // in pausa: 50 secondi di 60fps che continuano a girare sotto altre dieci
  // sezioni sono lavoro puro per la GPU (e batteria) di chi sta leggendo il CV.
  useEffect(() => {
    if (still) return;
    const el = bandRef.current;
    const video = videoRef.current;
    if (!el || !video || typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // play() può essere rifiutata (autoplay negato, scheda in background):
          // è un caso previsto, resta il poster.
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [still]);

  return (
    <section ref={bandRef} className="sb-fresh" aria-labelledby="sb-fresh-title">
      <div className="sb-container sb-fresh-grid">
        <div className="sb-fresh-copy">
          <span className="sb-fresh-flag">
            <i className="sb-chip-dot sb-chip-dot--sm" aria-hidden="true" />
            Just shipped
          </span>

          <h2 id="sb-fresh-title" className="sb-fresh-title">
            <span translate="no">rivaltasulmincio.it</span> is back online
          </h2>

          <p className="sb-fresh-desc">
            The institutional and tourist site for the village on the Mincio — rebuilt
            and live again. <strong>Every figure about the village in one place</strong>:
            services, shops, schools, roads, green areas and events, with geodata from
            OpenStreetMap and the rest from official sources.
          </p>

          <div className="sb-fresh-actions">
            <a
              href={SITE_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="sb-btn sb-btn--primary"
            >
              <IcExternal size={16} /> Visit the site
            </a>
            <a href="#lavori" className="sb-link sb-fresh-more">
              How it's built <IcArrowRight size={15} />
            </a>
          </div>
        </div>

        {/* La finestra di browser: stessa barra a tre pallini dei pannelli di
            codice della home (.sb-codehead), con la pillola dell'indirizzo al
            posto del nome del file. Il video è una registrazione dello schermo,
            quindi la cornice del browser non è un vezzo — è il suo contesto. */}
        <div className="sb-fresh-frame">
          <div className="sb-panel">
            <div className="sb-panel-inner sb-panel--solid">
              <div className="sb-codehead sb-fresh-bar" data-no-i18n>
                <i /><i /><i />
                <span className="sb-fresh-url">{SITE_URL.replace("https://", "")}</span>
              </div>

              <video
                ref={videoRef}
                className="sb-fresh-video"
                poster={POSTER}
                width={1280}
                height={720}
                loop
                muted
                playsInline
                preload="metadata"
                controls={still}
                aria-label="Screen recording: a scroll through the rivaltasulmincio.it website"
              >
                {/* Solo H.264. Il VP9 di pari qualità era più PESANTE su questo
                    materiale — è una cattura dello schermo a 60fps, contenuto su
                    cui x264 è imbattibile — e l'MP4 lo leggono tutti: un secondo
                    file sarebbe stato peso in più per zero.

                    La registrazione dura 2 minuti, due volte e mezzo la prima, e
                    pesa uguale (3,9 MB): sta in un riquadro largo sui 650px,
                    cioè metà dei 1280 del file, e a quella scala la differenza
                    fra questa compressione e il master da 93 MB non si vede —
                    verificata sul fotogramma peggiore, la mappa coi pin. */}
                <source src="/video/rivalta-sul-mincio.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
