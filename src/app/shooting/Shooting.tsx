import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SiteLink as Link } from "../site/nav";
import SiteFooter from "../site/SiteFooter";
import {
  IcArrowLeft,
  IcClose,
  IcClock,
  IcImage,
  IcLock,
  IcChevronLeft,
  IcChevronRight,
  IcPin,
  IcCamera,
  IcAperture,
  IcDownload,
  IcExpand,
} from "../site/homeIcons";
import { PageBackdrop } from "../site/homeFx";
import { lockBodyScroll, unlockBodyScroll } from "../utils/scrollLock";
import {
  SESSIONI,
  useAlbumPrivato,
  arco,
  pesoUmano,
  type SessionePubblica,
  type SessionePrivata,
  type Scatto,
} from "./sessioni";
import "../home.css";
import "./shooting.css";

// ─────────────────────────────────────────────────────────────────────────────
// /shooting — i ritratti, e la riga di confine che li tiene in casa.
//
// La pagina è pubblica e racconta il lavoro: quando, dove, quanti scatti, con
// che macchina. Le foto no. Non perché siano nascoste dietro un controllo che
// si può aggirare: sul sito pubblicato le immagini non sono mai state caricate,
// e l'indirizzo da cui la galleria le chiede (/scatti-privati/…) esiste solo
// sotto `vite dev`. Vedi src/app/shooting/sessioni.ts e
// scripts/shooting-api-dev.mjs.
//
// Quindi questa stessa pagina, aperta da me in locale, ha in più le gallerie; e
// aperta da chiunque altro mostra le schede con il lucchetto. Non sono due
// pagine: è la stessa, con o senza il manifesto privato.
//
// Registro: la grammatica .sb- del resto del sito, e la disciplina di /mima —
// le uniche cose colorate sono le foto.
// ─────────────────────────────────────────────────────────────────────────────

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

// ── I dati tecnici di una sessione, in riga ──────────────────────────────────
function Ferri({ s }: { s: SessionePubblica }) {
  const diaframma = s.apertura
    ? s.apertura.min === s.apertura.max
      ? `f/${s.apertura.min.toFixed(1).replace(".", ",")}`
      : `f/${s.apertura.min.toFixed(1).replace(".", ",")} – ${s.apertura.max.toFixed(1).replace(".", ",")}`
    : null;

  const voci = [
    s.macchina,
    s.obiettivo,
    arco(s.focale, "mm"),
    diaframma,
    s.iso && (s.iso.min === s.iso.max ? `ISO ${s.iso.min}` : `ISO ${s.iso.min} – ${s.iso.max}`),
  ].filter(Boolean) as string[];

  return (
    <ul className="sb-sh-ferri" data-no-i18n translate="no">
      {voci.map((v) => (
        <li key={v}>{v}</li>
      ))}
    </ul>
  );
}

// ── Una miniatura ────────────────────────────────────────────────────────────
// Tre accorgimenti, e tutti e tre servono a non far ballare la pagina:
//
//  ① le proporzioni vere di OGNI scatto sono note prima che l'immagine arrivi
//     (vengono dal manifesto), quindi la cella ha già la sua altezza;
//  ② l'anteprima sfocata da 24 px sta nel manifesto ed è già a schermo
//     all'istante zero: nessuna cella grigia;
//  ③ la miniatura vera arriva pigra e ci si dissolve sopra.
function Cella({ f, onApri, indice }: { f: Scatto; onApri: () => void; indice: number }) {
  const [carica, setCarica] = useState(false);
  return (
    <button
      type="button"
      className={`sb-sh-cella${carica ? " is-carica" : ""}`}
      style={{
        aspectRatio: `${f.w} / ${f.h}`,
        backgroundImage: `url("${f.blur}")`,
      }}
      onClick={onApri}
      aria-label={`Apri lo scatto ${indice + 1}, ore ${f.ora}`}
    >
      <img
        src={f.mini}
        width={f.w}
        height={f.h}
        alt=""
        // Le prime file sono già a schermo: chiederle pigre vuol dire vederle
        // arrivare in ritardo apposta.
        loading={indice < 6 ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setCarica(true)}
      />
      <span className="sb-sh-cella-ora" data-no-i18n translate="no">
        {f.ora}
      </span>
    </button>
  );
}

// ── Il visore ────────────────────────────────────────────────────────────────
// Reso in fondo alla pagina, FUORI da ogni .sb-panel: i pannelli sono tagliati
// col clip-path, e un clip-path ritaglia tutto il sottoalbero — position:fixed
// compreso.
//
// La qualità piena funziona in due tempi, ed è il motivo per cui non si aspetta
// mai davanti a una foto: compare subito la versione da 1800 px (~150 kB, già
// in cache dalla griglia o quasi), e intanto parte in silenzio l'originale da
// 5184 px. Quando è pronto prende il suo posto senza un lampo — stessa
// inquadratura, stesso posto — e l'etichetta in basso dice che ora si sta
// guardando il file come esce dalla macchina.
function Visore({
  foto,
  i,
  titolo,
  onChiudi,
  onVai,
}: {
  foto: Scatto[];
  i: number;
  titolo: string;
  onChiudi: () => void;
  onVai: (delta: number) => void;
}) {
  const f = foto[i];
  const [pieno, setPieno] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [origine, setOrigine] = useState("50% 50%");
  const tocco = useRef<number | null>(null);

  useEffect(() => {
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, []);

  // Cambiata foto: si riparte dalla versione media, e lo zoom si azzera.
  useEffect(() => {
    setPieno(false);
    setZoom(false);
    if (!f) return;
    const img = new Image();
    img.onload = () => setPieno(true);
    img.src = f.originale;
    return () => {
      // Staccare i gestori evita che l'originale di una foto già lasciata
      // indietro arrivi e faccia scattare il cambio su quella sbagliata.
      img.onload = null;
    };
  }, [f?.id, f?.originale]);

  // Le due vicine, pronte prima che servano: premere ← o → non deve mai
  // mostrare un buco.
  useEffect(() => {
    for (const d of [1, -1]) {
      const v = foto[i + d];
      if (v) new Image().src = v.medio;
    }
  }, [foto, i]);

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

  const dati = [
    f.tempo,
    f.apertura && `f/${String(f.apertura).replace(".", ",")}`,
    f.iso && `ISO ${f.iso}`,
    f.focale && `${f.focale} mm`,
  ].filter(Boolean) as string[];

  return (
    <div
      className="sb-sh-visore"
      role="dialog"
      aria-modal="true"
      aria-label={`Scatto ${i + 1} di ${foto.length}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onChiudi();
      }}
      onTouchStart={(e) => {
        tocco.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const da = tocco.current;
        const a = e.changedTouches[0]?.clientX;
        tocco.current = null;
        if (da == null || a == null) return;
        if (Math.abs(a - da) > 50) onVai(a < da ? 1 : -1);
      }}
    >
      <div className="sb-sh-visore-barra">
        <span className="sb-sh-visore-chi" data-no-i18n translate="no">
          {titolo}
          <span className="sb-sh-visore-conta">
            {i + 1} / {foto.length}
          </span>
        </span>
        <div className="sb-sh-visore-comandi">
          <a
            className="sb-btn sb-btn--sm sb-btn--secondary"
            href={f.originale}
            download={f.nome}
            onClick={(e) => e.stopPropagation()}
          >
            <IcDownload size={15} /> <span data-no-i18n translate="no">{pesoUmano(f.peso)}</span>
          </a>
          <button type="button" className="sb-btn sb-btn--sm sb-btn--secondary" onClick={onChiudi}>
            <IcClose size={15} /> Chiudi
          </button>
        </div>
      </div>

      <button
        type="button"
        className="sb-sh-visore-freccia sb-sh-visore-freccia--prima"
        onClick={() => onVai(-1)}
        aria-label="Scatto precedente"
        disabled={i === 0}
      >
        <IcChevronLeft size={22} />
      </button>

      <figure className="sb-sh-visore-corpo">
        <div
          className={`sb-sh-visore-tela${zoom ? " is-zoom" : ""}`}
          style={{ aspectRatio: `${f.w} / ${f.h}` }}
          onClick={() => setZoom((z) => !z)}
          onMouseMove={(e) => {
            if (!zoom) return;
            const r = e.currentTarget.getBoundingClientRect();
            setOrigine(
              `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`,
            );
          }}
          role="button"
          tabIndex={-1}
          aria-label={zoom ? "Torna a schermo intero" : "Ingrandisci"}
        >
          <img
            // La sorgente cambia da sola quando l'originale è pronto. Il browser
            // non ricarica niente: l'ha appena scaricato lui, è in cache.
            src={pieno ? f.originale : f.medio}
            width={f.w}
            height={f.h}
            alt={`Ritratto delle ${f.ora}`}
            decoding="async"
            style={{ transformOrigin: origine }}
          />
        </div>

        <figcaption className="sb-sh-visore-didascalia">
          <span className="sb-sh-visore-ora" data-no-i18n translate="no">
            <IcClock size={13} /> {f.ora}
          </span>
          {dati.length > 0 && (
            <span className="sb-sh-visore-dati" data-no-i18n translate="no">
              {dati.join(" · ")}
            </span>
          )}
          <span className={`sb-sh-qualita${pieno ? " is-piena" : ""}`} data-no-i18n translate="no">
            {pieno ? `originale · ${f.wo}×${f.ho}` : "anteprima…"}
          </span>
          <span className="sb-sh-visore-zoom">
            <IcExpand size={13} /> {zoom ? "clic per rimpicciolire" : "clic per ingrandire"}
          </span>
        </figcaption>
      </figure>

      <button
        type="button"
        className="sb-sh-visore-freccia sb-sh-visore-freccia--dopo"
        onClick={() => onVai(1)}
        aria-label="Scatto successivo"
        disabled={i === foto.length - 1}
      >
        <IcChevronRight size={22} />
      </button>
    </div>
  );
}

// ── Una sessione ─────────────────────────────────────────────────────────────
// Stessa scheda in tutti e due i casi. Cambia cosa c'è sotto: il lucchetto —
// che è quello che vede chiunque — oppure la griglia.
function Sessione({
  s,
  privata,
  chiuso,
  onApri,
}: {
  s: SessionePubblica;
  privata?: SessionePrivata;
  chiuso: boolean;
  onApri: (i: number) => void;
}) {
  return (
    <section className="sb-sh-sessione" aria-labelledby={`sess-${s.id}`}>
      <div className="sb-panel sb-sh-scheda">
        <div className="sb-panel-inner sb-sh-scheda-inner">
          <div className="sb-sh-scheda-testa">
            <h2 id={`sess-${s.id}`}>
              <span data-no-i18n translate="no">{s.giorno}</span>
              {privata && (
                <span className="sb-sh-chi" data-no-i18n translate="no">
                  {privata.titolo}
                </span>
              )}
            </h2>
            <span className="sb-sh-conta" data-no-i18n translate="no">
              <IcImage size={13} /> {s.n}
            </span>
          </div>

          <div className="sb-sh-scheda-righe">
            {s.luogo && (
              <span className="sb-sh-riga">
                <IcPin size={14} /> <span data-no-i18n translate="no">{s.luogo}</span>
              </span>
            )}
            <span className="sb-sh-riga">
              <IcClock size={14} />{" "}
              <span data-no-i18n translate="no">
                {s.ora.da} – {s.ora.a}
              </span>
            </span>
          </div>

          <Ferri s={s} />

          {chiuso && (
            <p className="sb-sh-lucchetto">
              <IcLock size={14} />
              <span>
                Le foto di questa sessione restano private: sono ritratti, e non sono state
                pubblicate. Qui c'è quello che si può dire — quando, dove, quante.
              </span>
            </p>
          )}
          {privata?.nota && <p className="sb-sh-nota">{privata.nota}</p>}
        </div>
      </div>

      {privata && (
        <div className="sb-sh-griglia">
          {privata.foto.map((f, i) => (
            <Cella key={f.id} f={f} indice={i} onApri={() => onApri(i)} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function Shooting() {
  const scrolled = useScrolled();
  const album = useAlbumPrivato();
  const [aperta, setAperta] = useState<{ sessione: string; i: number } | null>(null);

  useEffect(() => {
    const prev = document.title;
    document.title = "Shooting — Alberto Pecchini";
    return () => {
      document.title = prev;
    };
  }, []);

  const privati = album.stato === "aperto" ? album.sessioni : null;
  const chiuso = album.stato === "chiuso" || album.stato === "manca";

  const sessioneAperta = aperta && privati ? privati.get(aperta.sessione) : null;

  const vai = useCallback(
    (delta: number) => {
      setAperta((a) => {
        if (!a || !privati) return a;
        const s = privati.get(a.sessione);
        if (!s) return a;
        const n = a.i + delta;
        return n >= 0 && n < s.foto.length ? { ...a, i: n } : a;
      });
    },
    [privati],
  );

  const cifre = useMemo(() => {
    const macchine = [...new Set(SESSIONI.sessioni.map((s) => s.macchina).filter(Boolean))];
    return [
      { k: "scatti scelti", v: String(SESSIONI.totale) },
      { k: SESSIONI.sessioni.length === 1 ? "sessione" : "sessioni", v: String(SESSIONI.sessioni.length) },
      { k: macchine.length === 1 ? "macchina" : "macchine", v: String(macchine.length) },
    ];
  }, []);

  return (
    <div className="sb-home sb-home--fx sb-sh">
      <PageBackdrop />
      <div className="skiplinks">
        <a className="visually-hidden-focusable" href="#main-content">
          Skip to main content
        </a>
      </div>

      <header className={`sb-nav ${scrolled ? "sb-nav--scrolled" : ""}`}>
        <div className="sb-container sb-nav-inner">
          <Link to="/" className="sb-nav-brand">
            <img src="/favicon.svg" alt="" width={28} height={28} />
            <span className="sb-nav-brand-name" translate="no">
              Alberto Pecchini
            </span>
            <span className="sb-sh-tagline">Shooting</span>
          </Link>
          <Link to="/" className="sb-btn sb-btn--sm sb-btn--secondary sb-sh-indietro">
            <IcArrowLeft size={15} /> Home
          </Link>
        </div>
      </header>

      <main id="main-content">
        {/* ── Apertura ─────────────────────────────────────────────────────── */}
        <section className="sb-container sb-sh-testata">
          <p className="sb-sh-kicker" data-no-i18n translate="no">
            Ritratti · da dilettante
          </p>
          <h1 className="sb-sh-titolo">
            <span>Shooting</span>
            <span className="sb-brandline">
              Faccio foto alle persone, e non è il mio mestiere
            </span>
          </h1>
          <div className="sb-sh-copy">
            <p>
              Una <strong>Canon EOS 4000D</strong> con l'obiettivo che c'era nella scatola, o
              l'<strong>iPhone 16 Pro</strong> quando la macchina è a casa. Imparo guardando cosa
              viene male: la luce sbagliata, la posa che irrigidisce, il mosso a 1/13 di secondo.
            </p>
            <p>
              <strong>Le foto delle persone non le pubblico.</strong> Di ogni sessione resta qui
              quello che si può dire — la data, il posto, quanti scatti, con che attrezzatura — e
              quei numeri vengono dai metadati dei file, non da me. L'album vero si apre solo dal
              computer su cui sono le foto.
            </p>
          </div>
          <div className="sb-sh-cifre">
            {cifre.map((c) => (
              <div key={c.k} className="sb-sh-cifra">
                <span className="sb-sh-cifra-v" data-no-i18n translate="no">
                  {c.v}
                </span>
                <span className="sb-sh-cifra-k">{c.k}</span>
              </div>
            ))}
          </div>

          <p className={`sb-sh-stato sb-sh-stato--${album.stato}`}>
            {album.stato === "aperto" && (
              <>
                <IcCamera size={14} /> Album aperto: sei sul computer di casa.
              </>
            )}
            {album.stato === "attesa" && (
              <>
                <IcAperture size={14} /> Cerco l'album…
              </>
            )}
            {album.stato === "manca" && (
              <>
                <IcAperture size={14} /> Sei in locale ma il manifesto non c'è: lancia{" "}
                <code data-no-i18n translate="no">npm run scatti</code>.
              </>
            )}
            {album.stato === "chiuso" && (
              <>
                <IcLock size={14} /> Gli scatti non sono su questo sito: non sono mai stati
                caricati.
              </>
            )}
          </p>
        </section>

        {/* ── Le sessioni ──────────────────────────────────────────────────── */}
        <section className="sb-container sb-sh-elenco" aria-label="Sessioni">
          {SESSIONI.sessioni.map((s) => (
            <Sessione
              key={s.id}
              s={s}
              privata={privati?.get(s.id)}
              chiuso={chiuso}
              onApri={(i) => setAperta({ sessione: s.id, i })}
            />
          ))}
        </section>
      </main>

      <SiteFooter />

      {sessioneAperta && aperta && (
        <Visore
          foto={sessioneAperta.foto}
          i={aperta.i}
          titolo={sessioneAperta.titolo}
          onChiudi={() => setAperta(null)}
          onVai={vai}
        />
      )}
    </div>
  );
}
