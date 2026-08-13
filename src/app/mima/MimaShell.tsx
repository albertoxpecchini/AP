import { useEffect, useState, type ReactNode } from "react";
import { SiteLink as Link } from "../site/nav";
import SiteFooter from "../site/SiteFooter";
import { IcArrowLeft } from "../site/homeIcons";
import { PageBackdrop } from "../site/homeFx";
import { TRIP_START, TRIP_END } from "./mimaData";

// ─────────────────────────────────────────────────────────────────────────────
// Il guscio condiviso delle pagine /mima. Prima ogni pagina si ricopiava nav,
// skiplink, effetto scroll e titolo del documento; ora che sopra la pagina c'è
// anche la barra-ticker (che deve essere identica ovunque, altrimenti il numero
// in cima cambia passando da /mima a /mima/veicoli) tanto vale tenere tutto
// qui.
//
// Registro: "terminale di viaggio". Le pagine non sono più articoli con
// sezioni distanziate ma una console — colonna di moduli + rail appiccicoso —
// costruita con gli stessi token .sb- del resto del sito: grigi neutri, un solo
// accento azzurro, niente secondo colore.
// ─────────────────────────────────────────────────────────────────────────────

/** La nav prende il bordo solo quando c'è del contenuto che le scorre sotto. */
export function useScrolled(threshold = 60) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

/** Conto alla rovescia al minuto: la partenza è fra settimane, non fra secondi. */
export function useCountdown() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  const diff = TRIP_START.getTime() - now;
  return {
    diff,
    started: diff <= 0,
    ended: now >= TRIP_END.getTime(),
    days: Math.max(0, Math.floor(diff / 86_400_000)),
    hours: Math.max(0, Math.floor((diff % 86_400_000) / 3_600_000)),
    minutes: Math.max(0, Math.floor((diff % 3_600_000) / 60_000)),
  };
}

function useDocTitle(title: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = title;
    return () => { document.title = prev; };
  }, [title]);
}

// ── Barra di stato ───────────────────────────────────────────────────────────
export interface Tick {
  k: string;
  v: string;
  /** Dato vivo (conto alla rovescia, meteo): si porta dietro il pallino azzurro. */
  live?: boolean;
}

export function Ticker({ items }: { items: Tick[] }) {
  return (
    <div className="sb-mima-ticker">
      <div className="sb-container sb-mima-ticker-inner" role="group" aria-label="Riepilogo del viaggio">
        {items.map((t) => (
          <span key={t.k} className="sb-mima-tick">
            {t.live && <i className="sb-mima-tick-dot" aria-hidden="true" />}
            <span className="sb-mima-tick-k">{t.k}</span>
            {/* I valori sono numeri e sigle: non vanno tradotti dal motore i18n
                che cammina sui nodi di testo (src/app/i18n/translateDom.ts). */}
            <span className="sb-mima-tick-v" data-no-i18n translate="no">{t.v}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Pagina ───────────────────────────────────────────────────────────────────
export function MimaPage({
  title,
  back,
  backLabel,
  ticker,
  children,
  overlay,
}: {
  title: string;
  back: string;
  backLabel: string;
  ticker: Tick[];
  children: ReactNode;
  /** Reso dopo il footer: lightbox e simili, che devono restare fuori dai
      pannelli (backdrop-filter fa da containing block ai position:fixed). */
  overlay?: ReactNode;
}) {
  const scrolled = useScrolled();
  useDocTitle(title);

  return (
    <div className="sb-home sb-home--fx mima-page">
      <PageBackdrop />
      <div className="skiplinks">
        <a className="visually-hidden-focusable" href="#main-content">Skip to main content</a>
      </div>

      <header className={`sb-nav ${scrolled ? "sb-nav--scrolled" : ""}`}>
        <div className="sb-container sb-nav-inner">
          <Link to="/" className="sb-nav-brand">
            <img src="/favicon.svg" alt="" width={28} height={28} />
            <span className="sb-nav-brand-name" translate="no">Alberto Pecchini</span>
            <span className="sb-mima-tagline">Piano vacanza · MiMa</span>
          </Link>
          <Link to={back} className="sb-btn sb-btn--sm sb-btn--secondary sb-mima-back">
            <IcArrowLeft size={15} /> {backLabel}
          </Link>
        </div>
      </header>

      <Ticker items={ticker} />

      <main id="main-content">{children}</main>

      <SiteFooter />
      {overlay}
    </div>
  );
}

// ── Modulo ───────────────────────────────────────────────────────────────────
// L'unità di cui è fatta la console: pannello di vetro + testata monospaziata.
// Sostituisce .sb-mima-sechead dentro la griglia (il sechead resta per le poche
// intestazioni di sezione vere e proprie, e per /mima/luoghi che lo usa ancora).
export function Mod({
  id,
  icon,
  title,
  meta,
  solid,
  span,
  children,
}: {
  id: string;
  icon?: ReactNode;
  title: string;
  meta?: ReactNode;
  /** Per i pannelli con mappa o canvas: niente vetro sopra una WebGL. */
  solid?: boolean;
  /** "full" occupa tutta la riga in una griglia a più colonne. */
  span?: "full";
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-h`}
      className={`sb-panel sb-mima-mod ${solid ? "sb-panel--solid" : ""} ${span === "full" ? "sb-mima-mod--full" : ""}`}
    >
      <div className="sb-panel-inner sb-mima-mod-inner">
        <div className="sb-mima-modhead">
          <h2 className="sb-mima-modtitle" id={`${id}-h`}>
            {icon && <span className="sb-mima-modicon" aria-hidden="true">{icon}</span>}
            <span>{title}</span>
          </h2>
          {meta && <span className="sb-mima-modmeta">{meta}</span>}
        </div>
        <div className="sb-mima-modbody">{children}</div>
      </div>
    </section>
  );
}

/** Il marcatore d'onestà: tutto ciò che non è certo se lo porta dietro. */
export function Tbd({ children = "da verificare" }: { children?: ReactNode }) {
  return <span className="sb-mima-tbd">{children}</span>;
}

/** Riga chiave/valore compatta. La spina dorsale delle schede tecniche. */
export function KV({ k, v, tbd }: { k: string; v: ReactNode; tbd?: boolean | string }) {
  return (
    <div className="sb-mima-kv-row">
      <span className="sb-mima-kv-k">{k}</span>
      <span className="sb-mima-kv-v">
        <span data-no-i18n translate="no">{v}</span>
        {tbd && <Tbd>{typeof tbd === "string" ? tbd : undefined}</Tbd>}
      </span>
    </div>
  );
}

/** Barra di avanzamento. Stessa grammatica delle barre punteggio di /veicoli. */
export function Meter({ pct, label, muted }: { pct: number; label?: ReactNode; muted?: boolean }) {
  const w = Math.max(0, Math.min(100, pct));
  return (
    <div className="sb-mima-meterrow">
      <div className={`sb-mima-meter ${muted ? "is-muted" : ""}`} role="presentation">
        <i style={{ width: `${w}%` }} />
      </div>
      {label != null && <span className="sb-mima-meterval" data-no-i18n translate="no">{label}</span>}
    </div>
  );
}
