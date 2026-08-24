import { memo, useEffect, useMemo, useRef, useState } from "react";
import { SiteLink as Link } from "../site/nav";
import SiteFooter from "../site/SiteFooter";
import { PageBackdrop, useReducedMotion } from "../site/homeFx";
import { IcArrowLeft, IcTarget, IcTrend, IcClock, IcCalendar } from "../site/homeIcons";
import {
  ANCORA,
  ANNO_MS,
  DOPPIO,
  INIZIO,
  RITMI,
  R_STORICO,
  TASSI,
  TASSO_DEFAULT,
  dataCorta,
  dataLunga,
  euro,
  fra,
  linea,
  numero,
  ora,
  passo,
  percento,
  pezzi,
  quando,
  rovescio,
  traguardi,
  trascorso,
  valore,
} from "./soldi";
import "../home.css";
import "./soldi.css";

// ─────────────────────────────────────────────────────────────────────────────
// /soldi — il patrimonio che sale mentre lo si guarda.
//
// Un conto investimento a tasso fisso è l'unica cosa che si può disegnare in
// diretta senza chiedere niente a nessuno: non c'è un mercato da interrogare,
// c'è una formula. Da due rilevamenti veri — 145.000 € il 2 novembre 2023 e
// 154.470,94 € alle 11:41 del 24 agosto 2026 — esce tutto il resto: il valore
// di questo istante, quanto entra al secondo, quando si toccherà il doppio.
//
// I numeri e l'aritmetica stanno in soldi.ts. Qui c'è la forma, e una sola
// scelta tecnica che vale la pena spiegare: il contatore grande NON passa
// dallo stato di React. Sessanta re-render al secondo per far girare quattro
// cifre sarebbero sessanta riconciliazioni al secondo di una pagina intera;
// il testo si scrive nei nodi via ref, e React resta fermo. Il resto della
// pagina — i ritmi, i traguardi — si accontenta di un battito al secondo.
//
// Registro: la grammatica .sb- del sito, prefisso .sb-sol-. L'azzurro compare
// solo dove indica qualcosa: il valore vivo, la linea del grafico, il traguardo
// più vicino.
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

/**
 * Il battito lento: un `now` che avanza ogni `ms` e fa ri-renderare chi lo usa.
 * Serve ai pezzi che cambiano piano (i ritmi, il conto alla rovescia, la
 * posizione del punto sul grafico) e che non hanno alcun bisogno del
 * fotogramma. Si ferma quando la scheda è nascosta e riparte allineato al
 * tempo vero, non a dove era rimasto: il valore si ricalcola sempre da
 * `Date.now()`, quindi non esiste deriva da recuperare.
 */
function useBattito(ms: number) {
  const [t, setT] = useState(() => Date.now());
  useEffect(() => {
    let id = 0;
    const avvia = () => {
      clearInterval(id);
      if (document.hidden) return;
      setT(Date.now());
      id = window.setInterval(() => setT(Date.now()), ms);
    };
    avvia();
    document.addEventListener("visibilitychange", avvia);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", avvia);
    };
  }, [ms]);
  return t;
}

/**
 * Il battito veloce: chiama `cb(now)` a ogni fotogramma, senza toccare lo stato.
 *
 * Con `prefers-reduced-motion` scende a una volta al secondo — la pagina resta
 * viva (è tutto il suo contenuto) ma smette di far tremolare quattro cifre a
 * sessanta hertz, che è la parte del movimento di cui si può fare a meno. A
 * scheda nascosta non gira affatto: il browser sospenderebbe comunque il rAF,
 * ma l'intervallo del ripiego no, e continuerebbe a lavorare per nessuno.
 */
function useFotogramma(cb: (t: number) => void, lento: boolean) {
  const ref = useRef(cb);
  ref.current = cb;
  useEffect(() => {
    let raf = 0;
    let id = 0;
    const giro = () => {
      ref.current(Date.now());
      raf = requestAnimationFrame(giro);
    };
    const avvia = () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
      ref.current(Date.now());
      if (document.hidden) return;
      if (lento) id = window.setInterval(() => ref.current(Date.now()), 1000);
      else raf = requestAnimationFrame(giro);
    };
    avvia();
    document.addEventListener("visibilitychange", avvia);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
      document.removeEventListener("visibilitychange", avvia);
    };
  }, [lento]);
}

// ── Il contatore ─────────────────────────────────────────────────────────────

/**
 * Il numero grande. Tre nodi, tre ritmi di aggiornamento diversi:
 * gli euro cambiano ogni paio d'ore, i centesimi ogni dieci secondi circa, la
 * coda a ogni fotogramma. Si riscrive solo il nodo che è cambiato davvero —
 * `textContent` su un nodo di testo è economico, ma non gratis, e scriverne
 * tre quando ne basta uno è tre volte il lavoro per lo stesso risultato.
 */
function Contatore({ r, lento }: { r: number; lento: boolean }) {
  const interoRef = useRef<HTMLSpanElement>(null);
  const centRef = useRef<HTMLSpanElement>(null);
  const codaRef = useRef<HTMLSpanElement>(null);
  const prec = useRef({ intero: "", cent: "", coda: "" });

  useFotogramma((t) => {
    const p = pezzi(valore(t, r));
    if (p.intero !== prec.current.intero && interoRef.current) interoRef.current.textContent = p.intero;
    if (p.cent !== prec.current.cent && centRef.current) centRef.current.textContent = p.cent;
    if (p.coda !== prec.current.coda && codaRef.current) codaRef.current.textContent = p.coda;
    prec.current = p;
  }, lento);

  const iniziale = pezzi(valore(Date.now(), r));

  return (
    <p className="sb-sol-conta" data-no-i18n translate="no">
      <span className="sb-sol-conta-eu" aria-hidden="true">
        €
      </span>
      <span className="sb-sol-conta-int" ref={interoRef}>
        {iniziale.intero}
      </span>
      <span className="sb-sol-conta-vir" aria-hidden="true">
        ,
      </span>
      <span className="sb-sol-conta-cent" ref={centRef}>
        {iniziale.cent}
      </span>
      <span className="sb-sol-conta-coda" ref={codaRef}>
        {iniziale.coda}
      </span>
    </p>
  );
}

/**
 * «Da quando sei qui». Il pezzo più onesto della pagina: non racconta un
 * patrimonio, racconta quanto è lento — dopo un minuto di lettura sono sei
 * millesimi di euro. Che è esattamente il punto.
 */
function DaQuandoSeiQui({ r, lento }: { r: number; lento: boolean }) {
  const inizio = useRef(Date.now());
  const vRef = useRef<HTMLSpanElement>(null);
  const tRef = useRef<HTMLSpanElement>(null);
  const prec = useRef({ v: "", t: "" });

  useFotogramma((t) => {
    const guadagno = valore(t, r) - valore(inizio.current, r);
    const v = euro(guadagno, 6);
    const d = trascorso(t - inizio.current);
    if (v !== prec.current.v && vRef.current) vRef.current.textContent = v;
    if (d !== prec.current.t && tRef.current) tRef.current.textContent = d;
    prec.current = { v, t: d };
  }, lento);

  return (
    <div className="sb-panel sb-sol-sessione">
      <div className="sb-panel-inner">
        <p className="sb-sol-sessione-k">
          <IcClock size={13} /> Da quando hai aperto questa pagina
        </p>
        <p className="sb-sol-sessione-v" data-no-i18n translate="no">
          <span ref={vRef}>{euro(0, 6)}</span>
        </p>
        <p className="sb-sol-sessione-n">
          in <span ref={tRef} data-no-i18n translate="no">{trascorso(0)}</span> di lettura
        </p>
      </div>
    </div>
  );
}

// ── Il grafico ───────────────────────────────────────────────────────────────

const W = 1000;
const H = 360;
const MT = 26;
const MB = 30;

/**
 * Il tratto misurato e la proiezione, su un'unica linea.
 *
 * Due cose non ovvie sul disegno. ① Il grafico si allunga in orizzontale con la
 * finestra ma non in verticale: `preserveAspectRatio="none"` schiaccerebbe
 * anche i tratti e i pallini, quindi l'SVG disegna SOLO linee e aree — con
 * `vector-effect="non-scaling-stroke"` per lo spessore — e ogni etichetta, ogni
 * punto, è un elemento HTML in una lastra sopra, posizionato in percentuale
 * sulle stesse scale. Testo nitido a qualsiasi misura, niente cerchi ovali.
 * ② `stop-color="var(--sb-brand)"` come attributo XML non funziona: `var()` non
 * si risolve negli attributi di presentazione. I colori stanno tutti in
 * soldi.css, dove sono proprietà CSS vere e il tema scuro arriva da sé.
 */
const Grafico = memo(function Grafico({ r, adesso }: { r: number; adesso: number }) {
  const g = useMemo(() => {
    const t0 = INIZIO.t;
    const t1 = adesso + 4 * ANNO_MS;
    const vMin = 140_000;
    const vMax = Math.ceil(linea(t1, r) / 10_000) * 10_000;

    // Un margine ai lati: il primo pallino sta esattamente sul primo istante,
    // e senza margine metà pallino resterebbe fuori dalla lastra.
    const PL = 10;
    const PR = 10;
    const x = (t: number) => PL + ((t - t0) / (t1 - t0)) * (W - PL - PR);
    const y = (v: number) => MT + (1 - (v - vMin) / (vMax - vMin)) * (H - MT - MB);

    const campiona = (a: number, b: number, n: number) =>
      Array.from({ length: n + 1 }, (_, i) => {
        const t = a + ((b - a) * i) / n;
        return [x(t), y(linea(t, r))] as const;
      });
    const traccia = (pts: readonly (readonly [number, number])[]) =>
      pts.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(2)} ${py.toFixed(2)}`).join(" ");

    const passato = campiona(t0, adesso, 140);
    const futuro = campiona(adesso, t1, 140);

    const livelli: number[] = [];
    for (let v = vMin + 10_000; v <= vMax; v += 10_000) livelli.push(v);

    const anni: { a: number; t: number }[] = [];
    for (let a = new Date(t0).getFullYear() + 1; ; a++) {
      const t = new Date(a, 0, 1).getTime();
      if (t > t1) break;
      anni.push({ a, t });
    }

    return {
      dPassato: traccia(passato),
      dFuturo: traccia(futuro),
      dArea: `${traccia(passato)} L${x(adesso).toFixed(2)} ${H - MB} L${x(t0).toFixed(2)} ${H - MB} Z`,
      livelli: livelli.map((v) => ({ v, y: y(v) })),
      anni: anni.map((a) => ({ ...a, x: x(a.t) })),
      inizio: { x: x(t0), y: y(INIZIO.v) },
      ancora: { x: x(ANCORA.t), y: y(ANCORA.v) },
      punto: { x: x(adesso), y: y(linea(adesso, r)) },
      fine: { x: W, y: y(linea(t1, r)), v: linea(t1, r), t: t1 },
      // L'ancora e «adesso» stanno quasi nello stesso posto finché il
      // rilevamento è fresco: due pallini sovrapposti sono un pallino sporco.
      // Il marcatore del rilevamento compare solo quando si è staccato.
      mostraAncora: adesso - ANCORA.t > 20 * 86_400_000,
    };
  }, [r, adesso]);

  const px = (v: number) => `${(v / W) * 100}%`;
  const py = (v: number) => `${(v / H) * 100}%`;

  return (
    <div className="sb-sol-graf">
      <svg
        className="sb-sol-graf-svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id="sol-area" x1="0" y1="0" x2="0" y2="1">
            <stop className="sb-sol-stop-a" offset="0%" />
            <stop className="sb-sol-stop-b" offset="100%" />
          </linearGradient>
        </defs>

        {g.livelli.map((l) => (
          <line key={l.v} className="sb-sol-graf-rete" x1="0" y1={l.y} x2={W} y2={l.y} vectorEffect="non-scaling-stroke" />
        ))}
        {g.anni.map((a) => (
          <line key={a.a} className="sb-sol-graf-rete" x1={a.x} y1={MT} x2={a.x} y2={H - MB} vectorEffect="non-scaling-stroke" />
        ))}

        <path className="sb-sol-graf-area" d={g.dArea} fill="url(#sol-area)" />
        <line
          className="sb-sol-graf-ora"
          x1={g.punto.x}
          y1={MT}
          x2={g.punto.x}
          y2={H - MB}
          vectorEffect="non-scaling-stroke"
        />
        <path className="sb-sol-graf-futuro" d={g.dFuturo} vectorEffect="non-scaling-stroke" />
        <path className="sb-sol-graf-passato" d={g.dPassato} vectorEffect="non-scaling-stroke" />
      </svg>

      {/* La lastra delle annotazioni: HTML, quindi testo vero e pallini tondi. */}
      <div className="sb-sol-graf-note" aria-hidden="true">
        {g.livelli.map((l) => (
          <span key={l.v} className="sb-sol-graf-liv" style={{ top: py(l.y) }} data-no-i18n translate="no">
            {numero(l.v / 1000)}k
          </span>
        ))}
        {g.anni.map((a) => (
          <span key={a.a} className="sb-sol-graf-anno" style={{ left: px(a.x) }} data-no-i18n translate="no">
            {a.a}
          </span>
        ))}

        <span className="sb-sol-graf-perno" style={{ left: px(g.inizio.x), top: py(g.inizio.y) }} />
        {/* Il primo punto porta solo la cifra: in basso a sinistra lo spazio è
            quello che è, e la data schiacciata fra la linea che sale e le
            etichette degli anni finiva addosso all'una o alle altre. Sta per
            esteso poche righe più giù, nel riquadro dei due punti veri. */}
        <span className="sb-sol-graf-eti sb-sol-graf-eti--dx" style={{ left: px(g.inizio.x), top: py(g.inizio.y) }}>
          <b data-no-i18n translate="no">{euro(INIZIO.v, 0)}</b>
        </span>

        {g.mostraAncora && (
          <>
            <span className="sb-sol-graf-perno" style={{ left: px(g.ancora.x), top: py(g.ancora.y) }} />
            <span className="sb-sol-graf-eti sb-sol-graf-eti--sotto" style={{ left: px(g.ancora.x), top: py(g.ancora.y) }}>
              <b data-no-i18n translate="no">{euro(ANCORA.v)}</b>
              <i data-no-i18n translate="no">{dataCorta(ANCORA.t)}</i>
            </span>
          </>
        )}

        <span className="sb-sol-graf-vivo" style={{ left: px(g.punto.x), top: py(g.punto.y) }} />
        <span className="sb-sol-graf-eti sb-sol-graf-eti--vivo" style={{ left: px(g.punto.x), top: py(g.punto.y) }}>
          <b data-no-i18n translate="no">{euro(linea(adesso, r))}</b>
          <i>adesso</i>
        </span>

        <span className="sb-sol-graf-eti sb-sol-graf-eti--fine" style={{ top: py(g.fine.y) }}>
          <b data-no-i18n translate="no">{euro(g.fine.v, 0)}</b>
          <i data-no-i18n translate="no">{new Date(g.fine.t).getFullYear()}</i>
        </span>
      </div>

      <p className="sb-sol-graf-legenda">
        <span className="sb-sol-leg sb-sol-leg--pieno">rilevato</span>
        <span className="sb-sol-leg sb-sol-leg--tratto">proiezione al tasso scelto</span>
      </p>
    </div>
  );
});

// ── I traguardi ──────────────────────────────────────────────────────────────

function Traguardi({ r, adesso }: { r: number; adesso: number }) {
  const v = valore(adesso, r);
  const mete = traguardi(v);
  const prossima = mete[0];
  const tProssima = quando(prossima, r);
  const rov = rovescio(tProssima - adesso);

  return (
    <>
      <div className="sb-panel sb-sol-prossima">
        <div className="sb-panel-inner">
          <div className="sb-sol-prossima-sx">
            <p className="sb-sol-prossima-k">
              <IcTarget size={13} /> Il prossimo traguardo
            </p>
            <p className="sb-sol-prossima-v" data-no-i18n translate="no">
              {euro(prossima, 0)}
            </p>
            <p className="sb-sol-prossima-n">
              cioè il{" "}
              <strong data-no-i18n translate="no">{dataLunga(tProssima)}</strong> — mancano{" "}
              <strong data-no-i18n translate="no">{euro(prossima - v)}</strong>
            </p>
          </div>
          <div className="sb-sol-rov" data-no-i18n translate="no">
            {[
              { n: rov.gg, u: "gg" },
              { n: rov.hh, u: "h" },
              { n: rov.mm, u: "m" },
              { n: rov.ss, u: "s" },
            ].map((p) => (
              <span key={p.u} className="sb-sol-rov-p">
                <b>{String(p.n).padStart(2, "0")}</b>
                <i>{p.u}</i>
              </span>
            ))}
          </div>
        </div>
      </div>

      <ul className="sb-sol-mete">
        {mete.map((m) => {
          const t = quando(m, r);
          const avanti = Math.min(1, (v - INIZIO.v) / (m - INIZIO.v));
          return (
            <li key={m} className="sb-panel sb-panel--hover sb-sol-meta">
              <div className="sb-panel-inner">
                <div className="sb-sol-meta-riga">
                  <span className="sb-sol-meta-v" data-no-i18n translate="no">
                    {euro(m, 0)}
                  </span>
                  <span className="sb-sol-meta-q" data-no-i18n translate="no">
                    {new Date(t).getFullYear()}
                  </span>
                </div>
                <div className="sb-sol-barra" role="presentation">
                  <span style={{ width: `${(avanti * 100).toFixed(2)}%` }} />
                </div>
                <p className="sb-sol-meta-n">
                  {fra(t - adesso)}
                  {m === DOPPIO && <span className="sb-sol-meta-tag">il doppio del versato</span>}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

// ── La pagina ────────────────────────────────────────────────────────────────

export default function Soldi() {
  const scrolled = useScrolled();
  const lento = useReducedMotion();

  // Il battito al secondo muove ritmi e conto alla rovescia. Il grafico si
  // accontenta di mezzo minuto: alla sua scala, un secondo è un centesimo di
  // pixel — ridisegnarlo sessanta volte per non muoverlo sarebbe lavoro speso
  // per niente.
  const secondo = useBattito(1000);
  const mezzoMinuto = useBattito(30_000);

  const [tassoId, setTassoId] = useState<string>(() => {
    try {
      return localStorage.getItem("soldi-tasso") ?? TASSO_DEFAULT;
    } catch {
      return TASSO_DEFAULT;
    }
  });
  const tasso = TASSI.find((t) => t.id === tassoId) ?? TASSI[0];
  const r = tasso.r;

  const scegli = (id: string) => {
    setTassoId(id);
    try {
      localStorage.setItem("soldi-tasso", id);
    } catch {
      /* niente localStorage: la scelta vale per questa visita e basta */
    }
  };

  useEffect(() => {
    const prev = document.title;
    document.title = "Soldi — Alberto Pecchini";
    return () => {
      document.title = prev;
    };
  }, []);

  const v = valore(secondo, r);
  const guadagno = v - INIZIO.v;
  const giorni = Math.floor((secondo - INIZIO.t) / 86_400_000);

  return (
    <div className="sb-home sb-home--fx sb-sol" data-acc="verde">
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
            <span className="sb-sol-tagline">Soldi</span>
          </Link>
          <Link to="/" className="sb-btn sb-btn--sm sb-btn--secondary sb-sol-indietro">
            <IcArrowLeft size={15} /> Home
          </Link>
        </div>
      </header>

      <main id="main-content">
        {/* ── La testata ───────────────────────────────────────────────────── */}
        <section className="sb-container sb-sol-testata" aria-labelledby="sol-h1">
          <p className="sb-sol-kicker">
            <span className="sb-sol-vivo" aria-hidden="true" />
            in diretta — conto investimento a tasso fisso
          </p>

          <h1 id="sol-h1" className="sb-sol-titolo">
            <span>Il patrimonio</span>
            <span className="sb-brandline">sale mentre lo stai guardando</span>
          </h1>

          <Contatore r={r} lento={lento} />

          <p className="sb-sol-delta" data-no-i18n translate="no">
            <span className="sb-sol-delta-v">+{euro(guadagno)}</span>
            <span className="sb-sol-delta-p">+{percento(guadagno / INIZIO.v)}</span>
            <span className="sb-sol-delta-g">in {numero(giorni)} giorni</span>
          </p>

          <div className="sb-sol-copy">
            <p>
              Non c'è un mercato da interrogare: il capitale sta su un conto a{" "}
              <strong>tasso fisso</strong>, e un tasso fisso è l'unica cosa al mondo che si può
              disegnare al secondo senza chiedere niente a nessuno. Da due rilevamenti veri esce
              tutto quello che c'è in questa pagina — questo istante compreso.
            </p>
          </div>

          {/* ── L'ipotesi ─────────────────────────────────────────────────── */}
          <div className="sb-tabs sb-sol-tassi" role="tablist" aria-label="Ipotesi di rendimento">
            {TASSI.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={t.id === tassoId}
                className="sb-tab sb-sol-tasso"
                onClick={() => scegli(t.id)}
              >
                <b data-no-i18n translate="no">{t.breve}</b>
                <i>{t.titolo}</i>
              </button>
            ))}
          </div>
          <p className="sb-sol-tasso-nota" aria-live="polite">
            {tasso.nota}
          </p>
        </section>

        {/* ── I ritmi ──────────────────────────────────────────────────────── */}
        <section className="sb-container sb-sol-sez" aria-labelledby="sol-ritmo">
          <div className="sb-sol-sechead">
            <h2 id="sol-ritmo">
              <IcTrend size={17} /> A che velocità
            </h2>
            <p>
              Lo stesso numero letto a sette scale diverse. Al secondo è un decimo di millesimo di
              euro — impercettibile, e infatti nella coda del contatore qui sopra si vedono solo le
              ultime quattro cifre muoversi. All'anno diventa uno stipendio.
            </p>
          </div>
          <ul className="sb-sol-ritmi">
            {RITMI.map((p) => (
              <li key={p.k} className="sb-panel sb-panel--hover sb-sol-ritmo">
                <div className="sb-panel-inner">
                  <span className="sb-sol-ritmo-v" data-no-i18n translate="no">
                    {euro(passo(v, p.ms, r), p.dec)}
                  </span>
                  <span className="sb-sol-ritmo-k">{p.k}</span>
                </div>
              </li>
            ))}
            <li className="sb-sol-ritmo sb-sol-ritmo--sessione">
              <DaQuandoSeiQui r={r} lento={lento} />
            </li>
          </ul>
        </section>

        {/* ── La linea ─────────────────────────────────────────────────────── */}
        <section className="sb-container sb-sol-sez" aria-labelledby="sol-graf">
          <div className="sb-sol-sechead">
            <h2 id="sol-graf">
              <IcCalendar size={17} /> Da dove viene, dove va
            </h2>
            <p>
              Il tratto pieno passa per i due punti rilevati e non cambia mai: è quello che è
              successo. Il tratteggio è la proiezione all'ipotesi scelta sopra — cambiarla riscrive
              il futuro, mai il passato.
            </p>
          </div>
          <div className="sb-panel sb-sol-graf-lastra">
            <div className="sb-panel-inner">
              <Grafico r={r} adesso={mezzoMinuto} />
            </div>
          </div>
        </section>

        {/* ── I traguardi ──────────────────────────────────────────────────── */}
        <section className="sb-container sb-sol-sez" aria-labelledby="sol-mete">
          <div className="sb-sol-sechead">
            <h2 id="sol-mete">
              <IcTarget size={17} /> Quando si arriva
            </h2>
            <p>
              Ogni cifra tonda ha una data, e la data è un'inversione della stessa formula: quanto
              tempo serve perché il capitale di adesso, moltiplicato per sé stesso abbastanza volte,
              tocchi quel numero.
            </p>
          </div>
          <Traguardi r={r} adesso={secondo} />
        </section>

        {/* ── I conti ──────────────────────────────────────────────────────── */}
        <section className="sb-container sb-sol-sez" aria-labelledby="sol-conti">
          <div className="sb-sol-sechead">
            <h2 id="sol-conti">Come sono fatti questi numeri</h2>
            <p>
              Due rilevamenti, una formula, nessuna connessione. Tutto quello che la pagina sa è
              scritto qui.
            </p>
          </div>

          <div className="sb-sol-conti">
            <div className="sb-panel sb-sol-punti">
              <div className="sb-panel-inner">
                <h3>I due punti veri</h3>
                <dl>
                  <div>
                    <dt data-no-i18n translate="no">{dataLunga(INIZIO.t)}</dt>
                    <dd data-no-i18n translate="no">{euro(INIZIO.v)}</dd>
                  </div>
                  <div>
                    <dt data-no-i18n translate="no">
                      {dataLunga(ANCORA.t)}, ore {ora(ANCORA.t)}
                    </dt>
                    <dd data-no-i18n translate="no">{euro(ANCORA.v)}</dd>
                  </div>
                </dl>
                <p>
                  Fra i due ci sono{" "}
                  <strong data-no-i18n translate="no">
                    {numero(Math.round((ANCORA.t - INIZIO.t) / 86_400_000))} giorni
                  </strong>{" "}
                  e{" "}
                  <strong data-no-i18n translate="no">{euro(ANCORA.v - INIZIO.v)}</strong>: il tasso
                  che li unisce è{" "}
                  <strong data-no-i18n translate="no">{percento(R_STORICO)}</strong> l'anno. È
                  l'unica cifra della pagina che non è stata dichiarata da nessuno — è stata
                  misurata.
                </p>
              </div>
            </div>

            <div className="sb-panel sb-sol-fonte">
              <div className="sb-panel-inner">
                <h3>Quello che dice la compagnia</h3>
                <blockquote>
                  <p>
                    Confermo anche per quest'anno che il tasso retrocesso all'assicurato sarà circa
                    del 2,50/2,60 netto dal trattenuto Axa e lordo solo delle imposte su plusvalore
                    eventuali riscatti (dunque saremo intorno ad un 2,10 depurato da tutto). Ora
                    chiederò valori di riscatto precisi poi ve li comunicherò.
                  </p>
                </blockquote>
                <p>
                  Da qui vengono le tre ipotesi selezionabili. La pagina conta col{" "}
                  <strong data-no-i18n translate="no">2,10 %</strong> perché è l'unico numero della
                  frase che descrive soldi effettivamente in tasca.
                </p>
              </div>
            </div>

            <div className="sb-panel sb-sol-avviso">
              <div className="sb-panel-inner">
                <h3>Cosa questa pagina non è</h3>
                <p>
                  Non è il valore di riscatto della polizza, e non è un estratto conto: è
                  un'interpolazione a tasso costante fra due rilevamenti. Il tasso retrocesso cambia
                  di anno in anno, le imposte si applicano al momento del riscatto e non giorno per
                  giorno, e il conto vero non si muove al secondo — matura. Man mano che arrivano i
                  valori precisi, il secondo punto si aggiorna e tutta la pagina si riallinea da
                  sola.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
