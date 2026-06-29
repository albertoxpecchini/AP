import { useEffect, useState } from "react";
import { Link } from "react-router";
import SiteFooter from "../site/SiteFooter";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BookText,
  Library,
  Feather,
  MapPin,
  CalendarDays,
  Cat,
  TrendingUp,
  Users,
  Flag,
  Swords,
  Crown,
  Landmark,
  Church,
  Heart,
  Sunset,
  Quote,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// «Il Gattopardo» (Giuseppe Tomasi di Lampedusa — 1958) — approfondimento in 3'.
//
// Stessa impaginazione "dark premium" di /me-stesso e /dubliners (accento VIOLA
// al 100% su fondo scuro e superfici "vetro"): copertina, l'autore, il romanzo,
// i personaggi, cosa succede, il tema (la celebre frase di Tancredi, banda
// scura), il finale, perché conta e chiusura con la frase del Principe sui
// Gattopardi e i Leoni. Le foto vivono in /images/gattopardo/: se mancano, ogni
// cornice mostra un placeholder coerente con la palette.
// ─────────────────────────────────────────────────────────────────────────────

// Cornice foto con fallback elegante: se l'immagine manca, mostra un placeholder
// dark-premium con icona, senza spezzare il layout.
function Shot({
  src,
  alt,
  caption,
  icon,
  portrait = false,
  focus,
}: {
  src: string;
  alt: string;
  caption?: string;
  icon: React.ReactNode;
  portrait?: boolean;
  focus?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <figure className={`gp-shot${portrait ? " gp-shot--portrait" : ""}`}>
      {failed ? (
        <div className="gp-shot-ph" role="img" aria-label={alt}>
          <span className="gp-shot-ph-ic" aria-hidden="true">{icon}</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          style={focus ? { objectPosition: focus } : undefined}
        />
      )}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

// Schede sintetiche dell'opera (copertina → fatti chiave).
const FACTS = [
  { Icon: Feather, value: "1896 — 1957", label: "Giuseppe Tomasi di Lampedusa, siciliano" },
  { Icon: CalendarDays, value: "1958", label: "Esce postumo, un anno dopo la morte" },
  { Icon: BookText, value: "Un solo romanzo", label: "La sua unica opera — questa" },
  { Icon: MapPin, value: "Sicilia, 1860", label: "L'anno dell'Unità d'Italia" },
];

// I tre fuochi del romanzo.
const PEOPLE = [
  { Icon: Cat, label: "Il Principe Fabrizio", note: "il «Gattopardo»: anziano e lucido, sa che la sua epoca finisce" },
  { Icon: TrendingUp, label: "Tancredi", note: "il nipote giovane e ambizioso, che si adatta ai nuovi tempi" },
  { Icon: Users, label: "I Salina", note: "moglie, figli, servi: tutta l'aristocrazia siciliana" },
];

// Cosa accade fuori dal palazzo: la Storia che travolge tutto.
const EVENTS = [
  { Icon: Flag, label: "1860", note: "l'Italia si unifica" },
  { Icon: Swords, label: "Garibaldi", note: "sbarca in Sicilia" },
  { Icon: Crown, label: "Il Re", note: "arriva Vittorio Emanuele II" },
  { Icon: Landmark, label: "Il feudo", note: "l'ordine antico crolla" },
];

// Perché, oltre un secolo dopo, conta ancora.
const WHY = ["Il Risorgimento visto dai perdenti", "Una prosa poetica e raffinata", "La Storia travolge tutti"];

export default function Gattopardo() {
  useEffect(() => {
    const prev = document.title;
    document.title = "Il Gattopardo · Tomasi di Lampedusa — in 3 minuti";
    return () => { document.title = prev; };
  }, []);

  return (
    <div className="it-page-wrapper gp-page">
      {/* Header compatto: marchio del portfolio + ritorno alla home */}
      <header className="gp-header">
        <div className="container">
          <div className="d-flex align-items-center justify-content-between py-3">
            <Link to="/" className="gp-brand text-decoration-none d-inline-flex align-items-center">
              <span className="gp-brand-mark" aria-hidden="true">
                <img src="/favicon.svg" alt="" width={40} height={40} />
              </span>
              <span className="gp-brand-text">
                <span className="gp-brand-title">Alberto Pecchini</span>
                <span className="gp-brand-tagline">Designer &amp; Front-end Developer</span>
              </span>
            </Link>
            <Link to="/" className="btn btn-outline-light btn-sm fw-semibold d-inline-flex align-items-center">
              <ArrowLeft size={16} className="me-1" aria-hidden="true" />
              <span>Torna alla home</span>
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content">
        {/* ① Copertina */}
        <section className="gp-hero">
          <div className="container">
            <div className="gp-hero-grid">
              <div className="gp-hero-text">
                <span className="gp-hero-badge" aria-hidden="true">
                  <BookOpen size={44} strokeWidth={1.75} />
                </span>
                <p className="ap-kicker text-uppercase fw-semibold mb-3">Approfondimento · in 3 minuti</p>
                <h1 className="gp-hero-title fw-bold">Il Gattopardo</h1>
                <span className="gp-hero-rule" aria-hidden="true" />
                <p className="gp-hero-lead">«Il Gattopardo» — Tomasi di Lampedusa, 1958</p>
                <p className="gp-hero-school d-inline-flex align-items-center mb-0">
                  Un principe siciliano guarda il suo mondo finire — e capisce che deve cambiare.
                </p>
              </div>
              <div className="gp-hero-aside">
                <Shot
                  src="/images/gattopardo/copertina.jpg"
                  alt="Copertina de «Il Gattopardo» di Tomasi di Lampedusa"
                  icon={<BookText size={64} strokeWidth={1.5} />}
                  portrait
                />
              </div>
            </div>
          </div>
        </section>

        {/* ② Chi è Tomasi di Lampedusa */}
        <section className="py-5 my-lg-4 bg-white">
          <div className="container">
            <div className="mb-4">
              <p className="ap-kicker text-primary text-uppercase fw-semibold mb-3">01 — L'autore</p>
              <h2 className="display-5 fw-bold mb-2">Chi è Tomasi di Lampedusa</h2>
              <p className="gp-prose mb-0" style={{ maxWidth: "46rem" }}>
                Scrittore siciliano (<strong>1896 — 1957</strong>). In tutta la vita ha scritto
                <strong> un solo romanzo</strong>: questo. È diventato famoso soltanto
                <strong> dopo la morte</strong>, quando il libro uscì postumo e divenne un classico.
              </p>
            </div>
            <div className="gp-about">
              <div className="gp-facts">
                {FACTS.map(({ Icon, value, label }) => (
                  <div className="gp-fact" key={value}>
                    <span className="gp-fact-icon" aria-hidden="true"><Icon size={22} /></span>
                    <span className="gp-fact-value">{value}</span>
                    <span className="gp-fact-label">{label}</span>
                  </div>
                ))}
              </div>
              <Shot
                src="/images/gattopardo/autore.jpg"
                alt="Ritratto di Giuseppe Tomasi di Lampedusa"
                caption="Giuseppe Tomasi di Lampedusa (1896 — 1957)"
                icon={<Feather size={56} strokeWidth={1.5} />}
                portrait
              />
            </div>
          </div>
        </section>

        {/* ③ Che cos'è il libro */}
        <section className="py-5 my-lg-4 bg-light">
          <div className="container">
            <div className="mb-4">
              <p className="ap-kicker text-primary text-uppercase fw-semibold mb-3">02 — Il romanzo</p>
              <h2 className="display-5 fw-bold mb-0">Che cos'è «Il Gattopardo»</h2>
            </div>
            <div className="gp-story-row">
              <div className="gp-story-text">
                <p className="gp-prose gp-prose--lead">
                  Un <strong>romanzo storico</strong> ambientato in Sicilia nel <strong>1860</strong>, quando
                  l'Italia si unisce.
                </p>
                <p className="gp-prose mb-0">
                  Racconta la storia di una <strong>famiglia nobile</strong> — i Salina — che vede il proprio
                  mondo andare in frantumi: un'intera epoca, quella feudale e aristocratica, che si avvia al
                  tramonto sotto i loro occhi.
                </p>
                <div className="gp-company">
                  <span className="gp-company-ic" aria-hidden="true"><BookOpen size={24} /></span>
                  <span className="gp-company-text">
                    <span className="gp-company-name">Il Gattopardo · 1958</span>
                    <span className="gp-company-sub">Romanzo storico · Sicilia, 1860</span>
                  </span>
                </div>
              </div>
              <div className="gp-story-art">
                <Shot
                  src="/images/gattopardo/sicilia.jpg"
                  alt="La Sicilia del romanzo: un palazzo nobiliare e il paesaggio assolato"
                  caption="La Sicilia dei Salina"
                  icon={<MapPin size={56} strokeWidth={1.5} />}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ④ I personaggi */}
        <section className="py-5 my-lg-4 bg-white">
          <div className="container">
            <div className="mb-4">
              <p className="ap-kicker text-primary text-uppercase fw-semibold mb-3">03 — I personaggi</p>
              <h2 className="display-5 fw-bold mb-2">Chi muove la storia</h2>
              <p className="gp-prose mb-0" style={{ maxWidth: "48rem" }}>
                Pochi protagonisti, ma chiarissimi: un patriarca che vede la fine, un giovane che cavalca il
                nuovo, e un'intera casata che gli ruota attorno.
              </p>
            </div>
            <div className="gp-roles gp-roles--3">
              {PEOPLE.map(({ Icon, label, note }) => (
                <div className="gp-role" key={label}>
                  <span className="gp-role-ic" aria-hidden="true"><Icon size={22} /></span>
                  <span className="gp-role-label">{label}</span>
                  <span className="gp-role-note">{note}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ⑤ Cosa succede */}
        <section className="py-5 my-lg-4 bg-light">
          <div className="container">
            <div className="mb-4">
              <p className="ap-kicker text-primary text-uppercase fw-semibold mb-3">04 — La trama</p>
              <h2 className="display-5 fw-bold mb-2">Cosa succede</h2>
              <p className="gp-prose mb-0" style={{ maxWidth: "48rem" }}>
                Fuori dal palazzo, la Storia corre: l'Italia si unifica, il vecchio ordine feudale crolla e i
                nobili perdono potere, soldi e influenza.
              </p>
            </div>
            <div className="gp-roles">
              {EVENTS.map(({ Icon, label, note }) => (
                <div className="gp-role" key={label}>
                  <span className="gp-role-ic" aria-hidden="true"><Icon size={22} /></span>
                  <span className="gp-role-label">{label}</span>
                  <span className="gp-role-note">{note}</span>
                </div>
              ))}
            </div>
            <div className="gp-callout">
              <span className="gp-callout-ic" aria-hidden="true"><Heart size={22} /></span>
              <p className="mb-0">
                Il Principe capisce che, per sopravvivere, la famiglia deve <strong>adattarsi</strong>: così
                Tancredi sposa <strong>Angelica</strong>, la bellissima figlia del sindaco — ricco, ma
                <strong> borghese</strong>. <Church size={15} aria-hidden="true" /> La Chiesa perde
                influenza, il denaro cambia mani: tutto si trasforma.
              </p>
            </div>
          </div>
        </section>

        {/* ⑥ Il vero tema — banda scura */}
        <section className="gp-band">
          <div className="container">
            <p className="ap-kicker text-uppercase fw-semibold mb-3 gp-band-kicker">05 — Il tema</p>
            <h2 className="display-5 fw-bold mb-4 text-white">Una frase che spiega tutto</h2>
            <blockquote className="gp-quote-hero">
              «Se vogliamo che tutto rimanga come è, bisogna che tutto cambi.»
              <span className="gp-quote-by">— Tancredi, al Principe</span>
            </blockquote>
            <p className="gp-band-lead mb-0">
              Il Principe sa di non poter fermare la Storia. La scelta è una sola: <strong>o ti adatti e
              sopravvivi, o muori</strong>. Non c'è una terza via — ed è proprio cambiando qualcosa che si
              riesce a conservare il resto.
            </p>
          </div>
        </section>

        {/* ⑦ Il finale */}
        <section className="py-5 my-lg-4 bg-white">
          <div className="container">
            <div className="gp-story-row">
              <div className="gp-story-art">
                <Shot
                  src="/images/gattopardo/finale.jpg"
                  alt="Un tramonto sulla Sicilia: la fine di un'epoca"
                  caption="La fine di un'epoca"
                  icon={<Sunset size={56} strokeWidth={1.5} />}
                />
              </div>
              <div className="gp-story-text">
                <p className="ap-kicker text-primary text-uppercase fw-semibold mb-3">Il finale</p>
                <h2 className="display-5 fw-bold mb-3">Come va a finire</h2>
                <p className="gp-prose gp-prose--lead">
                  Il Principe muore.
                </p>
                <p className="gp-prose mb-0">
                  La famiglia continua, ma <strong>non è più quella di prima</strong>. La Sicilia è ormai
                  trasformata: un mondo intero si è chiuso alle spalle dei Salina, per sempre.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ⑧ Perché è importante */}
        <section className="py-5 my-lg-4 bg-light">
          <div className="container">
            <div className="mb-4">
              <p className="ap-kicker text-primary text-uppercase fw-semibold mb-3">06 — Perché conta</p>
              <h2 className="display-5 fw-bold mb-2">Perché è un libro importante</h2>
              <p className="gp-prose" style={{ maxWidth: "48rem" }}>
                Racconta il <strong>Risorgimento</strong> da un punto di vista insolito: quello dei
                <strong> perdenti</strong>, l'aristocrazia che esce di scena. È scritto in modo
                <strong> bellissimo e poetico</strong>, con una prosa raffinata. E mostra una verità
                spietata: la <strong>Storia travolge tutti</strong>, anche i più intelligenti e consapevoli.
              </p>
            </div>
            <div className="gp-chiprow">
              {WHY.map((w) => (
                <span className="gp-chip" key={w}>{w}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ⑨ In sintesi — banda di chiusura a gradiente */}
        <section className="gp-future">
          <div className="container">
            <p className="ap-kicker text-uppercase fw-semibold mb-3 gp-future-kicker">In sintesi</p>
            <h2 className="display-5 fw-bold mb-3 text-white">La cosa principale</h2>
            <p className="gp-future-hl">
              Un <strong>aristocratico siciliano</strong> assiste al crollo del suo mondo (1860, l'Unità
              d'Italia) e capisce che deve <strong>accettare il cambiamento</strong> per non morire.
            </p>
            <div className="gp-future-chips">
              <span className="gp-future-chip"><Crown size={15} aria-hidden="true" /> L'aristocrazia al tramonto</span>
              <span className="gp-future-chip"><Flag size={15} aria-hidden="true" /> Il Risorgimento</span>
              <span className="gp-future-chip"><Feather size={15} aria-hidden="true" /> Prosa poetica</span>
            </div>
          </div>
        </section>

        {/* ⑩ Chiusura — la celebre frase del Principe */}
        <section className="gp-thanks" aria-label="Citazione di chiusura">
          <img
            src="/images/gattopardo/chiusura.jpg"
            alt=""
            aria-hidden="true"
            loading="lazy"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
          <div className="gp-thanks-scrim" aria-hidden="true" />
          <div className="gp-thanks-overlay">
            <div className="container">
              <Quote size={40} className="gp-thanks-quote" aria-hidden="true" />
              <h2 className="gp-thanks-title">
                Noi fummo i Gattopardi, i Leoni
                <span>quelli che ci sostituiranno saranno gli sciacalletti, le iene.</span>
              </h2>
              <p className="gp-thanks-sign">— il Principe Fabrizio Salina</p>
            </div>
          </div>
        </section>

        {/* ⑪ Vai all'altro libro */}
        <section className="gp-next">
          <div className="container">
            <Link to="/dubliners" className="gp-next-card">
              <span className="gp-next-eyebrow">
                <BookOpen size={15} aria-hidden="true" /> Continua · l'altro approfondimento
              </span>
              <span className="gp-next-row">
                <span className="gp-next-ic" aria-hidden="true"><BookOpen size={28} /></span>
                <span className="gp-next-text">
                  <span className="gp-next-title">Gente di Dublino</span>
                  <span className="gp-next-sub">
                    James Joyce, 1914 — quindici racconti da una città che non lascia andare nessuno.
                  </span>
                </span>
                <ArrowRight size={24} className="gp-next-arrow" aria-hidden="true" />
              </span>
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />

      <style>{`
        /* ─────────────────────────────────────────────────────────────────────
           Look "dark premium" · accento VIOLA al 100% (lo stesso di /me-stesso,
           /dubliners e del gioco Trivia). Sfondo scuro profondo, superfici
           "vetro" e neon viola.
           ───────────────────────────────────────────────────────────────────── */
        .gp-page {
          --accent: #8b7bff;
          --accent-2: #7c6cff;
          --accent-3: #9d8fff;
          --accent-deep: #5b4bd6;
          --ink: #c4a5ff;
          --glow: rgba(139, 123, 255, 0.45);
          --text: #e8eef4;
          --sub: #a7b2bd;
          --surface: rgba(255, 255, 255, 0.05);
          --surface-bd: rgba(255, 255, 255, 0.10);
          --vio-soft: rgba(139, 123, 255, 0.10);
          --vio-bd: rgba(139, 123, 255, 0.28);
          --panel: linear-gradient(160deg, #15101f 0%, #1a1430 45%, #0b0f14 100%);
          min-height: 100vh;
          font-family: "Titillium Web", Geneva, Tahoma, sans-serif;
          color: var(--text);
          background:
            radial-gradient(120% 70% at 50% -10%, rgba(139, 123, 255, 0.16) 0%, transparent 55%),
            linear-gradient(180deg, #0b0f14 0%, #090c10 100%);
        }
        .gp-page .ap-kicker.text-primary { color: var(--ink) !important; }
        .gp-page .bg-white { background: transparent !important; }
        .gp-page .bg-light { background: rgba(255, 255, 255, 0.022) !important; }
        .gp-page .display-5, .gp-page .h3 { color: var(--text); }
        .gp-page .btn-outline-light { border-color: rgba(255, 255, 255, 0.4); color: #ffffff; }
        .gp-page .btn-outline-light:hover,
        .gp-page .btn-outline-light:focus {
          background-color: var(--accent); border-color: var(--accent); color: #0a0d11 !important;
        }
        .gp-page .ap-kicker { letter-spacing: 0.18em; font-size: 0.875rem; }

        /* Header — vetro scuro con filo viola */
        .gp-header {
          background: rgba(10, 13, 17, 0.82); position: sticky; top: 0; z-index: 10;
          backdrop-filter: blur(14px) saturate(120%);
          -webkit-backdrop-filter: blur(14px) saturate(120%);
          border-bottom: 1px solid var(--surface-bd);
        }
        .gp-brand-mark {
          display: inline-flex; align-items: center; justify-content: center;
          width: 40px; height: 40px; border-radius: 8px; overflow: hidden; margin-right: 12px;
          background: var(--vio-soft); border: 1px solid var(--vio-bd);
        }
        .gp-brand-mark img { width: 100%; height: 100%; display: block; }
        .gp-brand-text { display: inline-flex; flex-direction: column; line-height: 1.2; }
        .gp-brand-title { color: #ffffff; font-weight: 700; font-size: 1.05rem; }
        .gp-brand-tagline { color: var(--sub); font-size: 0.78rem; }
        @media (max-width: 575.98px) { .gp-brand-tagline { display: none; } }

        /* Hero copertina — pannello scuro con aloni viola */
        .gp-hero {
          position: relative; overflow: hidden;
          padding: clamp(3rem, 7vw, 5.5rem) 0;
          color: #ffffff;
          background:
            radial-gradient(90% 120% at 0% 0%, rgba(139, 123, 255, 0.22) 0%, transparent 55%),
            var(--panel);
          border-bottom: 1px solid var(--surface-bd);
        }
        .gp-hero::before, .gp-hero::after {
          content: ""; position: absolute; width: 55%; height: 75%; border-radius: 50%;
          filter: blur(60px); opacity: 0.45; pointer-events: none; z-index: 0;
        }
        .gp-hero::before { background: #8b7bff; top: -30%; right: -10%; }
        .gp-hero::after  { background: #5b4bd6; bottom: -35%; left: -12%; opacity: 0.35; }
        .gp-hero .container { position: relative; z-index: 1; }
        .gp-hero-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: clamp(1.5rem, 4vw, 3.5rem);
          align-items: center;
        }
        .gp-hero-badge {
          display: inline-flex; align-items: center; justify-content: center;
          width: 84px; height: 84px; border-radius: 20px;
          background: linear-gradient(140deg, var(--accent) 0%, var(--accent-deep) 130%);
          border: 1px solid rgba(255, 255, 255, 0.28);
          color: #ffffff; margin-bottom: 1.5rem;
          box-shadow: 0 14px 40px var(--glow), inset 0 1px 0 rgba(255, 255, 255, 0.25);
        }
        .gp-hero-title {
          font-size: clamp(2.75rem, 7vw, 5rem);
          line-height: 1.02; letter-spacing: -0.02em; margin-bottom: 1.1rem; color: #ffffff;
        }
        .gp-hero-rule {
          display: block; width: 64px; height: 4px; border-radius: 2px;
          background: var(--accent); box-shadow: 0 0 18px var(--glow); margin-bottom: 1.1rem;
        }
        .gp-hero-lead {
          font-size: clamp(1.25rem, 2.6vw, 1.7rem);
          font-style: italic; font-weight: 600; color: #ffffff; margin-bottom: 0.85rem;
        }
        .gp-hero-school { color: rgba(255, 255, 255, 0.78); font-size: 1.02rem; }
        @media (max-width: 767.98px) {
          .gp-hero-grid { grid-template-columns: 1fr; }
          .gp-hero-badge { width: 68px; height: 68px; border-radius: 16px; margin-bottom: 1.1rem; }
          .gp-hero-badge svg { width: 36px; height: 36px; }
        }

        /* Cornici foto + placeholder (dark premium) */
        .gp-shot {
          position: relative; margin: 0;
          border-radius: 18px; overflow: hidden;
          aspect-ratio: 3 / 2;
          border: 1px solid var(--surface-bd);
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.5);
          background: rgba(255, 255, 255, 0.04);
        }
        .gp-shot--portrait { aspect-ratio: 4 / 5; }
        .gp-shot img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 50%; display: block; }
        .gp-shot-ph {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          background-image:
            radial-gradient(120% 120% at 30% 20%, rgba(139, 123, 255, 0.22), rgba(10, 12, 16, 0.2)),
            linear-gradient(135deg, #15101f 0%, #0b0f14 100%);
        }
        .gp-shot-ph-ic { color: rgba(196, 165, 255, 0.6); }
        .gp-shot figcaption {
          position: absolute; left: 0; right: 0; bottom: 0;
          padding: 1.8rem 0.95rem 0.7rem;
          font-size: 0.85rem; font-weight: 700; font-style: italic; color: #ffffff;
          background: linear-gradient(to top, rgba(7, 9, 16, 0.92), rgba(7, 9, 16, 0));
        }
        .gp-hero-aside .gp-shot { box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6); border-color: var(--vio-bd); }

        /* Fatti chiave */
        .gp-about {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: clamp(1.5rem, 4vw, 3rem);
          align-items: center;
        }
        .gp-facts { display: flex; flex-direction: column; gap: 1rem; }
        .gp-fact {
          display: grid;
          grid-template-columns: 56px 1fr;
          align-items: center;
          column-gap: 1rem;
          padding: 1rem 1.25rem;
          background: var(--surface);
          border: 1px solid var(--surface-bd);
          border-radius: 14px;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
        }
        .gp-fact-icon {
          grid-row: 1 / 3;
          display: inline-flex; align-items: center; justify-content: center;
          width: 56px; height: 56px; border-radius: 14px;
          background: var(--vio-soft); color: var(--ink); border: 1px solid var(--vio-bd);
        }
        .gp-fact-value { font-size: 1.3rem; font-weight: 800; color: #ffffff; line-height: 1.1; }
        .gp-fact-label { font-size: 0.9rem; color: var(--sub); }
        @media (max-width: 767.98px) { .gp-about { grid-template-columns: 1fr; } }

        /* Righe narrate */
        .gp-story-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: clamp(1.5rem, 4vw, 3rem);
          align-items: center;
        }
        .gp-prose { font-size: 1.08rem; line-height: 1.75; color: var(--sub); }
        .gp-prose strong { color: #ffffff; }
        .gp-prose--lead { font-size: 1.2rem; font-weight: 700; color: #ffffff; }
        @media (max-width: 767.98px) {
          .gp-story-row { grid-template-columns: 1fr; }
          .gp-story-row .gp-story-art { order: -1; }
        }

        /* Badge opera */
        .gp-company {
          display: inline-flex; align-items: center; gap: 0.9rem;
          margin-top: 1.5rem; padding: 0.85rem 1.25rem;
          background: var(--surface);
          border: 1px solid var(--surface-bd);
          border-left: 4px solid var(--accent);
          border-radius: 12px;
        }
        .gp-company-ic {
          display: inline-flex; align-items: center; justify-content: center;
          width: 46px; height: 46px; border-radius: 50%;
          background: var(--vio-soft); color: var(--ink);
        }
        .gp-company-text { display: inline-flex; flex-direction: column; line-height: 1.25; }
        .gp-company-name { font-weight: 800; color: #ffffff; font-size: 1.1rem; }
        .gp-company-sub { font-size: 0.85rem; color: var(--sub); }

        /* Griglie a schede (personaggi / eventi) */
        .gp-roles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-top: 0.5rem; }
        .gp-roles--3 { grid-template-columns: repeat(3, 1fr); }
        .gp-role {
          display: flex; flex-direction: column; gap: 0.2rem;
          padding: 1.1rem 1.2rem; background: var(--surface);
          border: 1px solid var(--surface-bd); border-radius: 14px;
          transition: transform .15s, border-color .15s, box-shadow .15s;
        }
        .gp-role:hover { transform: translateY(-3px); border-color: var(--vio-bd); box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45); }
        .gp-role-ic {
          display: inline-flex; align-items: center; justify-content: center;
          width: 44px; height: 44px; border-radius: 12px;
          background: var(--vio-soft); color: var(--ink); margin-bottom: 0.4rem;
        }
        .gp-role-label { font-weight: 800; color: #ffffff; }
        .gp-role-note { font-size: 0.82rem; color: var(--sub); line-height: 1.45; }
        @media (max-width: 767.98px) { .gp-roles, .gp-roles--3 { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 430px) { .gp-roles, .gp-roles--3 { grid-template-columns: 1fr; } }

        /* Banda — Il tema */
        .gp-band {
          padding: clamp(3rem, 7vw, 5rem) 0;
          background:
            radial-gradient(100% 130% at 100% 0%, rgba(139, 123, 255, 0.18) 0%, transparent 55%),
            linear-gradient(160deg, #120c20 0%, #0b0f14 60%, #15101f 100%);
          border-top: 1px solid var(--surface-bd); border-bottom: 1px solid var(--surface-bd);
        }
        .gp-band-kicker { color: var(--ink); letter-spacing: 0.18em; }
        .gp-band-lead {
          color: rgba(255, 255, 255, 0.82);
          font-size: 1.15rem; line-height: 1.7; max-width: 52rem;
        }
        .gp-band-lead strong { color: #ffffff; }
        .gp-quote-hero {
          position: relative; margin: 0 0 1.75rem; padding: 0.25rem 0 0.25rem 1.5rem;
          border-left: 4px solid var(--accent);
          font-size: clamp(1.5rem, 3.6vw, 2.4rem); line-height: 1.3;
          font-style: italic; font-weight: 700; color: #ffffff;
          text-shadow: 0 0 26px var(--glow); max-width: 40rem;
        }
        .gp-quote-by {
          display: block; margin-top: 0.85rem;
          font-size: 0.85rem; font-style: normal; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink);
        }

        /* Callout (l'adattamento) */
        .gp-callout {
          display: flex; gap: 1rem; align-items: flex-start;
          margin-top: 2rem; padding: 1.1rem 1.35rem;
          background: var(--vio-soft);
          border: 1px solid var(--vio-bd);
          border-left: 4px solid var(--accent); border-radius: 14px;
        }
        .gp-callout-ic {
          flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center;
          width: 44px; height: 44px; border-radius: 50%;
          background: var(--vio-soft); color: var(--ink);
        }
        .gp-callout p { font-size: 1rem; line-height: 1.65; color: var(--sub); }
        .gp-callout strong { color: #ffffff; }
        .gp-callout svg { vertical-align: -2px; color: var(--ink); }

        /* Chips (perché conta) */
        .gp-chiprow { display: flex; flex-wrap: wrap; gap: 0.6rem; }
        .gp-chip {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.5rem 1rem; border-radius: 999px;
          background: var(--vio-soft);
          border: 1px solid var(--vio-bd);
          font-weight: 700; font-size: 0.95rem; color: var(--ink);
        }

        /* In sintesi — banda viola profondo */
        .gp-future {
          position: relative; overflow: hidden;
          padding: clamp(3rem, 7vw, 5rem) 0;
          color: #ffffff;
          background:
            radial-gradient(90% 120% at 0% 0%, rgba(139, 123, 255, 0.25) 0%, transparent 55%),
            linear-gradient(135deg, #1a1430 0%, #211a3d 55%, #15101f 100%);
          border-top: 1px solid var(--surface-bd);
        }
        .gp-future-kicker { color: var(--ink); letter-spacing: 0.18em; }
        .gp-future-hl { font-size: 1.5rem; line-height: 1.5; margin-bottom: 1.5rem; color: rgba(255, 255, 255, 0.92); max-width: 50rem; }
        .gp-future-hl strong { color: #ffffff; }
        .gp-future-chips { display: flex; flex-wrap: wrap; gap: 0.6rem; }
        .gp-future-chip {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.45rem 0.9rem; border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.28);
          font-weight: 700; font-size: 0.9rem; color: #ffffff;
        }

        /* Chiusura — banner con citazione */
        .gp-thanks {
          position: relative; width: 100%; overflow: hidden;
          background-image: linear-gradient(135deg, #15101f 0%, #0b0f14 100%);
          min-height: clamp(20rem, 42vw, 34rem);
          display: flex; align-items: center;
        }
        .gp-thanks img {
          position: absolute; inset: 0; z-index: 0;
          width: 100%; height: 100%; object-fit: cover; object-position: 50% 45%;
          image-orientation: from-image;
        }
        .gp-thanks-scrim {
          position: absolute; inset: 0; z-index: 1;
          background-image: linear-gradient(120deg, rgba(7, 9, 16, 0.92) 0%, rgba(7, 9, 16, 0.6) 50%, rgba(20, 16, 40, 0.35) 100%);
        }
        .gp-thanks-overlay { position: relative; z-index: 2; width: 100%; }
        .gp-thanks-quote { color: var(--ink); opacity: 0.8; margin-bottom: 0.75rem; }
        .gp-thanks-title {
          color: #ffffff; font-weight: 800; line-height: 1.1;
          font-size: clamp(1.9rem, 5vw, 3.4rem); letter-spacing: -0.01em; margin-bottom: 0.75rem;
          font-style: italic; max-width: 26ch;
        }
        .gp-thanks-title span { display: block; font-size: clamp(1.1rem, 2.6vw, 1.8rem); font-weight: 600; color: rgba(255, 255, 255, 0.88); }
        .gp-thanks-sign {
          color: rgba(255, 255, 255, 0.82);
          text-transform: uppercase; letter-spacing: 0.14em; font-weight: 600; font-size: 0.9rem; margin-bottom: 0;
        }

        /* Vai all'altro libro — CTA cross-link */
        .gp-next { padding: clamp(2.5rem, 6vw, 4rem) 0; background: linear-gradient(180deg, #0b0f14 0%, #090c10 100%); }
        .gp-next-card {
          display: block; text-decoration: none;
          padding: clamp(1.5rem, 4vw, 2.25rem);
          background: var(--surface);
          border: 1px solid var(--vio-bd);
          border-radius: 20px;
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.4);
          transition: transform .18s, border-color .18s, box-shadow .18s, background .18s;
        }
        .gp-next-card:hover, .gp-next-card:focus-visible {
          transform: translateY(-4px);
          border-color: var(--accent);
          box-shadow: 0 24px 60px var(--glow);
          background: var(--vio-soft);
        }
        .gp-next-eyebrow {
          display: inline-flex; align-items: center; gap: 0.45rem;
          text-transform: uppercase; letter-spacing: 0.16em; font-size: 0.78rem; font-weight: 700;
          color: var(--ink); margin-bottom: 1.1rem;
        }
        .gp-next-row { display: flex; align-items: center; gap: 1.1rem; }
        .gp-next-ic {
          flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center;
          width: 58px; height: 58px; border-radius: 16px;
          background: linear-gradient(140deg, var(--accent) 0%, var(--accent-deep) 130%);
          border: 1px solid rgba(255, 255, 255, 0.28);
          color: #ffffff; box-shadow: 0 10px 30px var(--glow);
        }
        .gp-next-text { display: flex; flex-direction: column; min-width: 0; }
        .gp-next-title { color: #ffffff; font-weight: 800; font-size: clamp(1.25rem, 3vw, 1.6rem); line-height: 1.15; }
        .gp-next-sub { color: var(--sub); font-size: 0.95rem; line-height: 1.45; margin-top: 0.3rem; }
        .gp-next-arrow { flex-shrink: 0; margin-left: auto; color: var(--ink); transition: transform .18s, color .18s; }
        .gp-next-card:hover .gp-next-arrow, .gp-next-card:focus-visible .gp-next-arrow { transform: translateX(5px); color: #ffffff; }
        @media (max-width: 575.98px) { .gp-next-arrow { display: none; } }

        /* Footer */
        .gp-footer { background-color: #090c10; color: #ffffff; border-top: 1px solid var(--surface-bd); }
      `}</style>
    </div>
  );
}
