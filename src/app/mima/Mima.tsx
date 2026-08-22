import { lazy, useCallback, useEffect, useMemo, useState } from "react";
import { SiteLink as Link } from "../site/nav";
import SiteFooter from "../site/SiteFooter";
import { IcArrowLeft, IcClose, IcPin, IcClock, IcImage, IcChevronLeft, IcChevronRight } from "../site/homeIcons";
import { PageBackdrop } from "../site/homeFx";
import WhenVisible from "../site/WhenVisible";
import { lockBodyScroll, unlockBodyScroll } from "../utils/scrollLock";
import { ALBUM, CON_POSIZIONE, perGiornata, etichettaGiorno, type Foto } from "./foto";
import "../home.css";
import "./mima.css";

// ─────────────────────────────────────────────────────────────────────────────
// /mima — l'album di Milano Marittima, 13–17 agosto 2026 (Pekko, Jonny, Mok).
//
// Al posto del piano vacanza che stava qui prima — conto alla rovescia, meteo,
// spese divise — ci sono le foto, che è quello che di una vacanza resta.
//
// Due modi di guardarle, sugli stessi scatti: la MAPPA (dove) e la SCALETTA
// (quando). Nessuno dei due ordine è stato deciso a mano: vengono tutti e due
// dai metadati EXIF di ogni file — GPSLatitude/GPSLongitude per il punto,
// DateTimeOriginal per l'ora — che `npm run foto` legge e impacchetta in
// foto.json. Aggiungere foto vuol dire rilanciare il comando, non toccare
// questo file.
//
// Registro: la grammatica .sb- del resto del sito — fondale unico, pannelli di
// vetro smussati, un solo accento azzurro. Le foto sono l'unico colore della
// pagina, e tutto il resto sta indietro apposta.
// ─────────────────────────────────────────────────────────────────────────────

const MimaMappa = lazy(() => import("./MimaMappa"));

const GIORNATE = perGiornata(ALBUM.foto);

// Indice per id: il visore si sposta avanti e indietro sull'ordine cronologico
// completo, anche quando lo si è aperto cliccando un punto sulla mappa.
const INDICE = new Map(ALBUM.foto.map((f, i) => [f.id, i]));

function useScrolled(threshold = 60) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

// ── Il visore ────────────────────────────────────────────────────────────────
// Reso in fondo alla pagina, FUORI da ogni .sb-panel: i pannelli sono tagliati
// col clip-path, e un clip-path ritaglia tutto il sottoalbero — position:fixed
// compreso. Dentro a un pannello questo overlay verrebbe tosato ai bordi della
// card.
function Visore({
  i,
  onChiudi,
  onVai,
}: {
  i: number;
  onChiudi: () => void;
  onVai: (delta: number) => void;
}) {
  const f = ALBUM.foto[i];

  useEffect(() => {
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onChiudi();
      else if (e.key === "ArrowRight") onVai(1);
      else if (e.key === "ArrowLeft") onVai(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onChiudi, onVai]);

  if (!f) return null;

  return (
    <div
      className="sb-mima-visore"
      role="dialog"
      aria-modal="true"
      aria-label={`Foto ${i + 1} di ${ALBUM.totale}`}
      onClick={(e) => { if (e.target === e.currentTarget) onChiudi(); }}
    >
      <div className="sb-mima-visore-barra">
        <span className="sb-mima-visore-conta" data-no-i18n translate="no">
          {i + 1} / {ALBUM.totale}
        </span>
        <button type="button" className="sb-btn sb-btn--sm sb-btn--secondary" onClick={onChiudi}>
          <IcClose size={15} /> Chiudi
        </button>
      </div>

      <button
        type="button"
        className="sb-mima-visore-freccia sb-mima-visore-freccia--prima"
        onClick={() => onVai(-1)}
        aria-label="Foto precedente"
        disabled={i === 0}
      >
        <IcChevronLeft size={22} />
      </button>

      <figure className="sb-mima-visore-corpo">
        <img
          src={f.src}
          width={f.w}
          height={f.h}
          alt={f.luogo ? `Scatto a ${f.luogo}, ${etichettaGiorno(f.giorno)} alle ${f.ora}` : `Scatto del ${etichettaGiorno(f.giorno)} alle ${f.ora}`}
          decoding="async"
        />
        <figcaption className="sb-mima-visore-didascalia">
          <span className="sb-mima-visore-quando" data-no-i18n translate="no">
            {etichettaGiorno(f.giorno)} · {f.ora}
          </span>
          {f.luogo && (
            <span className="sb-mima-visore-dove">
              <IcPin size={13} /> <span data-no-i18n translate="no">{f.luogo}</span>
            </span>
          )}
          {f.posizioneStimata && (
            <span className="sb-mima-tbd">posizione dedotta da uno scatto vicino</span>
          )}
          {f.lat == null && <span className="sb-mima-tbd">senza posizione</span>}
        </figcaption>
      </figure>

      <button
        type="button"
        className="sb-mima-visore-freccia sb-mima-visore-freccia--dopo"
        onClick={() => onVai(1)}
        aria-label="Foto successiva"
        disabled={i === ALBUM.foto.length - 1}
      >
        <IcChevronRight size={22} />
      </button>
    </div>
  );
}

// ── Una miniatura ────────────────────────────────────────────────────────────
function Miniatura({ f, onApri }: { f: Foto; onApri: () => void }) {
  return (
    <button type="button" className="sb-mima-cella" onClick={onApri}>
      <img
        src={f.mini}
        // Le proporzioni vere di OGNI scatto: senza, seicento celle si
        // ridisegnano man mano che le immagini arrivano e la pagina balla
        // sotto le dita mentre si scorre.
        width={f.w}
        height={f.h}
        alt={f.luogo ? `${f.luogo}, ore ${f.ora}` : `Scatto delle ${f.ora}`}
        loading="lazy"
        decoding="async"
      />
      <span className="sb-mima-cella-ora" data-no-i18n translate="no">{f.ora}</span>
    </button>
  );
}

export default function Mima() {
  const scrolled = useScrolled();
  const [aperta, setAperta] = useState<number | null>(null);

  useEffect(() => {
    const prev = document.title;
    document.title = "MiMa · album — Alberto Pecchini";
    return () => { document.title = prev; };
  }, []);

  const apriPerId = useCallback((id: string) => {
    const i = INDICE.get(id);
    if (i != null) setAperta(i);
  }, []);

  const vai = useCallback((delta: number) => {
    setAperta((i) => {
      if (i == null) return i;
      const n = i + delta;
      return n >= 0 && n < ALBUM.foto.length ? n : i;
    });
  }, []);

  const cifre = useMemo(
    () => [
      { k: "scatti", v: String(ALBUM.totale) },
      { k: "giornate", v: String(ALBUM.giorni.length) },
      { k: "sulla mappa", v: String(ALBUM.conPosizione) },
    ],
    [],
  );

  return (
    <div className="sb-home sb-home--fx sb-mima" data-acc="rosa">
      <PageBackdrop />
      <div className="skiplinks">
        <a className="visually-hidden-focusable" href="#main-content">Skip to main content</a>
      </div>

      <header className={`sb-nav ${scrolled ? "sb-nav--scrolled" : ""}`}>
        <div className="sb-container sb-nav-inner">
          <Link to="/" className="sb-nav-brand">
            <img src="/favicon.svg" alt="" width={28} height={28} />
            <span className="sb-nav-brand-name" translate="no">Alberto Pecchini</span>
            <span className="sb-mima-tagline">Album · MiMa</span>
          </Link>
          <Link to="/" className="sb-btn sb-btn--sm sb-btn--secondary sb-mima-indietro">
            <IcArrowLeft size={15} /> Home
          </Link>
        </div>
      </header>

      <main id="main-content">
        {/* ── Apertura ─────────────────────────────────────────────────────── */}
        <section className="sb-container sb-mima-testata">
          <p className="sb-mima-kicker" data-no-i18n translate="no">13 – 17 agosto 2026</p>
          <h1 className="sb-mima-titolo">
            <span>Milano Marittima</span>
            <span className="sb-brandline">{ALBUM.totale} foto, nell'ordine in cui sono state scattate</span>
          </h1>
          <div className="sb-mima-copy">
            <p>
              Cinque giorni fra Cervia, Pinarella e Milano Marittima. Nessuna di queste foto è stata
              messa in ordine a mano: <strong>la posizione e l'ora arrivano dai metadati di ogni
              scatto</strong> — le coordinate GPS che la fotocamera scrive nel file, e l'istante in
              cui è stato premuto il pulsante.
            </p>
            <p>
              Sulla mappa ci sono {ALBUM.conPosizione} scatti su {ALBUM.totale}. Gli altri {ALBUM.senzaPosizione} sono
              qui sotto insieme agli altri, in ordine, ma senza un punto: sono passati da una chat, e
              per strada i metadati li hanno persi.
            </p>
          </div>
          <div className="sb-mima-cifre">
            {cifre.map((c) => (
              <div key={c.k} className="sb-mima-cifra">
                <span className="sb-mima-cifra-v" data-no-i18n translate="no">{c.v}</span>
                <span className="sb-mima-cifra-k">{c.k}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── La mappa ─────────────────────────────────────────────────────── */}
        <section className="sb-container sb-mima-sez" aria-labelledby="mappa-h">
          <div className="sb-mima-sechead">
            <h2 id="mappa-h">Dove</h2>
            <p>
              Ogni punto è uno scatto. I cerchi grossi sono gruppi: si aprono zoomando, e quando i
              punti si separano si clicca la foto.
            </p>
          </div>
          <div className="sb-panel sb-panel--solid sb-mima-mappa-lastra">
            <div className="sb-panel-inner">
              <WhenVisible className="sb-mima-mappa-box">
                <MimaMappa foto={CON_POSIZIONE} bounds={ALBUM.bounds} onApri={apriPerId} />
              </WhenVisible>
            </div>
          </div>
        </section>

        {/* ── La scaletta ──────────────────────────────────────────────────── */}
        <section className="sb-container sb-mima-sez" aria-labelledby="quando-h">
          <div className="sb-mima-sechead">
            <h2 id="quando-h">Quando</h2>
            <p>Dalla partenza al rientro, giornata per giornata.</p>
          </div>

          {GIORNATE.map((g, idx) => (
            <section key={g.data} className="sb-mima-giornata" aria-labelledby={`g-${g.data}`}>
              <div className="sb-mima-giornata-testa">
                <h3 id={`g-${g.data}`}>
                  <span className="sb-mima-giornata-n" data-no-i18n translate="no">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span data-no-i18n translate="no">{etichettaGiorno(g.data)}</span>
                </h3>
                <span className="sb-mima-giornata-conta" data-no-i18n translate="no">
                  <IcImage size={13} /> {g.foto.length}
                </span>
                <span className="sb-mima-giornata-arco" data-no-i18n translate="no">
                  <IcClock size={13} /> {g.foto[0].ora} – {g.foto[g.foto.length - 1].ora}
                </span>
              </div>
              <div className="sb-mima-griglia">
                {g.foto.map((f) => (
                  <Miniatura key={f.id} f={f} onApri={() => setAperta(INDICE.get(f.id)!)} />
                ))}
              </div>
            </section>
          ))}
        </section>
      </main>

      <SiteFooter />

      {aperta != null && (
        <Visore i={aperta} onChiudi={() => setAperta(null)} onVai={vai} />
      )}
    </div>
  );
}
