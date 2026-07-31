import { useEffect, useState } from "react";
import { SiteLink as Link } from "../site/nav";
import SiteFooter from "../site/SiteFooter";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BookText,
  Cat,
  Library,
  Feather,
  MapPin,
  CalendarDays,
  Baby,
  Footprints,
  Briefcase,
  Landmark,
  Users,
  Lock,
  Coins,
  Church,
  Home,
  Repeat,
  Eye,
  Sparkles,
  Quote,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// «Gente di Dublino» (Dubliners, James Joyce — 1914) — approfondimento in 3 minuti.
//
// Stessa impaginazione "dark premium" di /me-stesso (accento VIOLA al 100% su
// fondo scuro e superfici "vetro"): copertina, l'autore, il libro, i personaggi,
// la trama, il tema (banda scura) e perché conta, chiuso dalla celebre frase
// finale de «I morti». Le foto vivono in /images/dubliners/: se mancano, ogni
// cornice mostra un placeholder coerente con la palette.
// ─────────────────────────────────────────────────────────────────────────────

// Cornice foto con fallback elegante: se l'immagine manca, mostra un placeholder
// dark-premium con icona, senza spezzare il layout. La prop `focus` imposta
// l'object-position quando la foto viene ritagliata in cover.
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
    <figure className={`db-shot${portrait ? " db-shot--portrait" : ""}`}>
      {failed ? (
        <div className="db-shot-ph" role="img" aria-label={alt}>
          <span className="db-shot-ph-ic" aria-hidden="true">{icon}</span>
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
  { Icon: Feather, value: "1882 — 1941", label: "James Joyce, scrittore irlandese" },
  { Icon: CalendarDays, value: "1914", label: "L'anno in cui esce «Dubliners»" },
  { Icon: Library, value: "15 racconti", label: "Storie brevi e indipendenti" },
  { Icon: MapPin, value: "Dublino", label: "Una sola città, sempre lei" },
];

// Le quattro età della vita in cui Joyce ordina i racconti.
const STAGES = [
  { Icon: Baby, label: "Infanzia", note: "i primi racconti" },
  { Icon: Footprints, label: "Adolescenza", note: "il risveglio" },
  { Icon: Briefcase, label: "Maturità", note: "la vita adulta" },
  { Icon: Landmark, label: "Vita pubblica", note: "la città intera" },
];

// Chi popola le storie: gente comune, nessun eroe.
const PEOPLE = ["Bambini", "Ragazze", "Commessi", "Insegnanti", "Impiegati", "Donne sposate", "Uomini stanchi"];

// Cosa "succede": tre micro-trame che si spengono sul nascere.
const PLOTS = [
  { Icon: Eye, label: "Un ragazzo", note: "scopre il desiderio — e la vergogna" },
  { Icon: Footprints, label: "Una ragazza", note: "sogna di scappare di casa… e non parte" },
  { Icon: Repeat, label: "Un uomo", note: "è annoiato a morte dalla sua vita" },
];

// Il vero tema: tutti intrappolati, da quattro forze.
const TRAPS = [
  { Icon: Coins, title: "La povertà", desc: "Soldi che non bastano mai e lavori che non portano da nessuna parte." },
  { Icon: Church, title: "La religione", desc: "Il peso del cattolicesimo, il senso di colpa, il dovere." },
  { Icon: Home, title: "La famiglia", desc: "Case opprimenti — genitori e mariti che soffocano." },
  { Icon: Repeat, title: "La monotonia", desc: "Giornate tutte uguali, in una città che non cambia mai." },
];

export default function Dubliners() {
  useEffect(() => {
    const prev = document.title;
    document.title = "Gente di Dublino · James Joyce — in 3 minuti";
    return () => { document.title = prev; };
  }, []);

  return (
    <div className="it-page-wrapper db-page">
      {/* Header compatto: marchio del portfolio + ritorno alla home */}
      <header className="db-header">
        <div className="container">
          <div className="d-flex align-items-center justify-content-between py-3">
            <Link to="/" className="db-brand text-decoration-none d-inline-flex align-items-center">
              <span className="db-brand-mark" aria-hidden="true">
                <img src="/favicon.svg" alt="" width={40} height={40} />
              </span>
              <span className="db-brand-text">
                <span className="db-brand-title">Alberto Pecchini</span>
                <span className="db-brand-tagline">Designer &amp; Front-end Developer</span>
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
        <section className="db-hero">
          <div className="container">
            <div className="db-hero-grid">
              <div className="db-hero-text">
                <span className="db-hero-badge" aria-hidden="true">
                  <BookOpen size={44} strokeWidth={1.75} />
                </span>
                <p className="ap-kicker text-uppercase fw-semibold mb-3">Approfondimento · in 3 minuti</p>
                <h1 className="db-hero-title fw-bold">Gente di Dublino</h1>
                <span className="db-hero-rule" aria-hidden="true" />
                <p className="db-hero-lead">«Dubliners» — James Joyce, 1914</p>
                <p className="db-hero-school d-inline-flex align-items-center mb-0">
                  Quindici racconti da una città che non lascia andare nessuno.
                </p>
              </div>
              <div className="db-hero-aside">
                <Shot
                  src="/images/dubliners/copertina.jpg"
                  alt="Copertina di «Gente di Dublino» di James Joyce"
                  icon={<BookText size={64} strokeWidth={1.5} />}
                  portrait
                />
              </div>
            </div>
          </div>
        </section>

        {/* ② Chi è James Joyce */}
        <section className="py-5 my-lg-4 bg-white">
          <div className="container">
            <div className="mb-4">
              <p className="ap-kicker text-primary text-uppercase fw-semibold mb-3">01 — L'autore</p>
              <h2 className="display-5 fw-bold mb-2">Chi è James Joyce</h2>
              <p className="db-prose mb-0" style={{ maxWidth: "46rem" }}>
                Scrittore irlandese (<strong>1882 — 1941</strong>), tra i più importanti — e più
                <strong> difficili</strong> — del Novecento: ha scritto libri complicatissimi, che molti
                trovano quasi incomprensibili. <strong>Gente di Dublino</strong> è la sua opera più
                <strong> accessibile</strong>: la porta d'ingresso al suo mondo.
              </p>
            </div>
            <div className="db-about">
              <div className="db-facts">
                {FACTS.map(({ Icon, value, label }) => (
                  <div className="db-fact" key={value}>
                    <span className="db-fact-icon" aria-hidden="true"><Icon size={22} /></span>
                    <span className="db-fact-value">{value}</span>
                    <span className="db-fact-label">{label}</span>
                  </div>
                ))}
              </div>
              <Shot
                src="/images/dubliners/joyce.jpg"
                alt="Ritratto di James Joyce"
                caption="James Joyce (1882 — 1941)"
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
              <p className="ap-kicker text-primary text-uppercase fw-semibold mb-3">02 — Il libro</p>
              <h2 className="display-5 fw-bold mb-0">Che cos'è «Gente di Dublino»</h2>
            </div>
            <div className="db-story-row">
              <div className="db-story-text">
                <p className="db-prose db-prose--lead">
                  Non un romanzo, ma una <strong>raccolta di 15 storie brevi</strong>.
                </p>
                <p className="db-prose">
                  Non c'è una trama principale: ogni racconto è <strong>indipendente</strong> e si chiude in
                  poche pagine. Il filo che li tiene insieme è uno solo — tutti parlano di persone che vivono
                  a <strong>Dublino</strong>, la capitale d'Irlanda.
                </p>
                <p className="db-prose mb-0">
                  Joyce dispone i racconti come un viaggio nella vita: prima l'infanzia, poi l'adolescenza, la
                  maturità e infine la vita pubblica della città.
                </p>
                <div className="db-company">
                  <span className="db-company-ic" aria-hidden="true"><BookOpen size={24} /></span>
                  <span className="db-company-text">
                    <span className="db-company-name">Dubliners · 1914</span>
                    <span className="db-company-sub">15 racconti, una sola città</span>
                  </span>
                </div>
              </div>
              <div className="db-story-art">
                <Shot
                  src="/images/dubliners/dublino.jpg"
                  alt="Le strade di Dublino, dove sono ambientati i racconti"
                  caption="Dublino, l'unica protagonista"
                  icon={<MapPin size={56} strokeWidth={1.5} />}
                />
              </div>
            </div>

            {/* Le quattro età in cui sono ordinati i racconti */}
            <div className="db-roles">
              {STAGES.map(({ Icon, label, note }) => (
                <div className="db-role" key={label}>
                  <span className="db-role-ic" aria-hidden="true"><Icon size={22} /></span>
                  <span className="db-role-label">{label}</span>
                  <span className="db-role-note">{note}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ④ I personaggi */}
        <section className="py-5 my-lg-4 bg-white">
          <div className="container">
            <div className="mb-4">
              <p className="ap-kicker text-primary text-uppercase fw-semibold mb-3">03 — I personaggi</p>
              <h2 className="display-5 fw-bold mb-2">Gente comune, nessun eroe</h2>
              <p className="db-prose mb-0" style={{ maxWidth: "48rem" }}>
                Niente avventure spettacolari, niente eroi. I protagonisti sono persone
                <strong> normalissime</strong>: la gente che incroceresti per strada, presa nel mezzo di una
                giornata qualunque.
              </p>
            </div>
            <div className="db-chiprow">
              {PEOPLE.map((p) => (
                <span className="db-chip" key={p}><Users size={15} aria-hidden="true" /> {p}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ⑤ Cosa succede */}
        <section className="py-5 my-lg-4 bg-light">
          <div className="container">
            <div className="mb-4">
              <p className="ap-kicker text-primary text-uppercase fw-semibold mb-3">04 — La trama</p>
              <h2 className="display-5 fw-bold mb-2">Cosa succede? Quasi niente</h2>
              <p className="db-prose mb-0" style={{ maxWidth: "48rem" }}>
                E qui sta il punto. Non succede granché: le cose <strong>non cambiano</strong>, i personaggi
                restano fermi dove sono.
              </p>
            </div>
            <div className="db-roles db-roles--3">
              {PLOTS.map(({ Icon, label, note }) => (
                <div className="db-role" key={label}>
                  <span className="db-role-ic" aria-hidden="true"><Icon size={22} /></span>
                  <span className="db-role-label">{label}</span>
                  <span className="db-role-note">{note}</span>
                </div>
              ))}
            </div>
            <div className="db-callout">
              <span className="db-callout-ic" aria-hidden="true"><Sparkles size={22} /></span>
              <p className="mb-0">
                Ogni racconto sembra avviarsi verso un cambiamento — e poi si spegne. Joyce chiama questi
                attimi <strong>«epifanie»</strong>: un piccolo lampo in cui il personaggio capisce la propria
                condizione… ma non riesce comunque a cambiarla. <strong>Fine.</strong>
              </p>
            </div>
          </div>
        </section>

        {/* ⑥ Il vero tema — banda scura */}
        <section className="db-band">
          <div className="container">
            <p className="ap-kicker text-uppercase fw-semibold mb-3 db-band-kicker">05 — Il tema</p>
            <h2 className="display-5 fw-bold mb-3 text-white">Una parola: intrappolati</h2>
            <p className="db-band-lead">
              Sotto la superficie, tutti i personaggi hanno la stessa cosa in comune: sono
              <strong> prigionieri</strong>. Vorrebbero un'altra vita, ma qualcosa li trattiene — e nessuno
              riesce davvero a scappare o a cambiare.
            </p>
            <div className="db-percorso db-percorso--4">
              {TRAPS.map(({ Icon, title, desc }) => (
                <div className="db-percorso-card" key={title}>
                  <span className="db-percorso-ic" aria-hidden="true"><Icon size={26} /></span>
                  <h3 className="db-percorso-title">{title}</h3>
                  <p className="db-percorso-desc mb-0">{desc}</p>
                </div>
              ))}
            </div>
            <p className="db-band-foot">
              <Lock size={16} className="me-2" aria-hidden="true" />
              La parola che Joyce stesso usa per Dublino è una sola: <strong>«paralisi»</strong>.
            </p>
          </div>
        </section>

        {/* ⑦ Perché è importante */}
        <section className="py-5 my-lg-4 bg-white">
          <div className="container">
            <div className="db-story-row">
              <div className="db-story-art">
                <Shot
                  src="/images/dubliners/dublino-2.jpg"
                  alt="Una via di Dublino di inizio Novecento"
                  caption="La vera Dublino, con i nomi veri"
                  icon={<Landmark size={56} strokeWidth={1.5} />}
                />
              </div>
              <div className="db-story-text">
                <p className="ap-kicker text-primary text-uppercase fw-semibold mb-3">06 — Perché conta</p>
                <h2 className="display-5 fw-bold mb-3">Perché è un libro importante</h2>
                <p className="db-prose">
                  Joyce racconta tutto questo in modo <strong>realistico e crudo</strong>: senza moralismi,
                  senza dare lezioni, senza addolcire niente. Mostra la <strong>vera Dublino</strong> — con i
                  nomi veri delle strade, dei pub, dei quartieri — e lascia che siano i fatti a parlare.
                </p>
                <p className="db-prose mb-0">
                  È uno dei primi libri davvero <strong>moderni</strong> a fare così: guardare la gente comune
                  dritto in faccia, senza giudicarla. Per questo, più di un secolo dopo, parla ancora di noi.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ⑧ In una frase — banda di chiusura a gradiente */}
        <section className="db-future">
          <div className="container">
            <p className="ap-kicker text-uppercase fw-semibold mb-3 db-future-kicker">In sintesi</p>
            <h2 className="display-5 fw-bold mb-3 text-white">La cosa principale</h2>
            <p className="db-future-hl">
              Un libro sulla <strong>gente comune</strong> che soffre in silenzio, <strong>intrappolata</strong>
              in una città grigia.
            </p>
            <div className="db-future-chips">
              <span className="db-future-chip"><BookText size={15} aria-hidden="true" /> Realismo crudo</span>
              <span className="db-future-chip"><Eye size={15} aria-hidden="true" /> Nessun moralismo</span>
              <span className="db-future-chip"><MapPin size={15} aria-hidden="true" /> La vera Dublino</span>
            </div>
          </div>
        </section>

        {/* ⑨ Chiusura — la celebre frase finale de «I morti» */}
        <section className="db-thanks" aria-label="Citazione di chiusura">
          <img
            src="/images/dubliners/neve.jpg"
            alt=""
            aria-hidden="true"
            loading="lazy"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
          <div className="db-thanks-scrim" aria-hidden="true" />
          <div className="db-thanks-overlay">
            <div className="container">
              <Quote size={40} className="db-thanks-quote" aria-hidden="true" />
              <h2 className="db-thanks-title">
                La neve cadeva lieve su tutto il paese
                <span>su tutti i vivi e su tutti i morti.</span>
              </h2>
              <p className="db-thanks-sign">da «I morti» — l'ultimo dei quindici racconti</p>
            </div>
          </div>
        </section>

        {/* ⑩ Vai all'altro libro */}
        <section className="db-next">
          <div className="container">
            <Link to="/gattopardo" className="db-next-card">
              <span className="db-next-eyebrow">
                <Cat size={15} aria-hidden="true" /> Continua · l'altro approfondimento
              </span>
              <span className="db-next-row">
                <span className="db-next-ic" aria-hidden="true"><Cat size={28} /></span>
                <span className="db-next-text">
                  <span className="db-next-title">Il Gattopardo</span>
                  <span className="db-next-sub">
                    Tomasi di Lampedusa, 1958 — un principe siciliano guarda il suo mondo finire.
                  </span>
                </span>
                <ArrowRight size={24} className="db-next-arrow" aria-hidden="true" />
              </span>
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />

      <style>{`
        /* ─────────────────────────────────────────────────────────────────────
           Look "dark premium" · accento VIOLA al 100% (lo stesso di /me-stesso
           e del gioco Trivia). Sfondo scuro profondo, superfici "vetro" e neon
           viola.
           ───────────────────────────────────────────────────────────────────── */
        .db-page {
          --accent: #e95420;
          --accent-2: #dd4814;
          --accent-3: #f39a76;
          --accent-deep: #bc3d10;
          --ink: #f6a583;
          --glow: rgba(233, 84, 32, 0.45);
          --text: #f5f3f1;
          --sub: #b3aca6;
          --surface: rgba(255, 255, 255, 0.05);
          --surface-bd: rgba(255, 255, 255, 0.10);
          --vio-soft: rgba(233, 84, 32, 0.10);
          --vio-bd: rgba(233, 84, 32, 0.28);
          --panel: linear-gradient(160deg, #221a20 0%, #2a1e26 45%, #241c22 100%);
          min-height: 100vh;
          font-family: "Titillium Web", Geneva, Tahoma, sans-serif;
          color: var(--text);
          background:
            radial-gradient(120% 70% at 50% -10%, rgba(233, 84, 32, 0.16) 0%, transparent 55%),
            linear-gradient(180deg, #241c22 0%, #1b151a 100%);
        }
        .db-page .ap-kicker.text-primary { color: var(--ink) !important; }
        .db-page .bg-white { background: transparent !important; }
        .db-page .bg-light { background: rgba(255, 255, 255, 0.022) !important; }
        .db-page .display-5, .db-page .h3 { color: var(--text); }
        .db-page .btn-outline-light { border-color: rgba(255, 255, 255, 0.4); color: #ffffff; }
        .db-page .btn-outline-light:hover,
        .db-page .btn-outline-light:focus {
          background-color: var(--accent); border-color: var(--accent); color: #ffffff !important;
        }
        .db-page .ap-kicker { letter-spacing: 0.18em; font-size: 0.875rem; }

        /* Header — vetro scuro con filo viola */
        .db-header {
          background: rgba(28, 22, 27, 0.82); position: sticky; top: 0; z-index: 10;
          backdrop-filter: blur(14px) saturate(120%);
          -webkit-backdrop-filter: blur(14px) saturate(120%);
          border-bottom: 1px solid var(--surface-bd);
        }
        .db-brand-mark {
          display: inline-flex; align-items: center; justify-content: center;
          width: 40px; height: 40px; border-radius: 8px; overflow: hidden; margin-right: 12px;
          background: var(--vio-soft); border: 1px solid var(--vio-bd);
        }
        .db-brand-mark img { width: 100%; height: 100%; display: block; }
        .db-brand-text { display: inline-flex; flex-direction: column; line-height: 1.2; }
        .db-brand-title { color: #ffffff; font-weight: 700; font-size: 1.05rem; }
        .db-brand-tagline { color: var(--sub); font-size: 0.78rem; }
        @media (max-width: 575.98px) { .db-brand-tagline { display: none; } }

        /* Hero copertina — pannello scuro con aloni viola */
        .db-hero {
          position: relative; overflow: hidden;
          padding: clamp(3rem, 7vw, 5.5rem) 0;
          color: #ffffff;
          background:
            radial-gradient(90% 120% at 0% 0%, rgba(233, 84, 32, 0.22) 0%, transparent 55%),
            var(--panel);
          border-bottom: 1px solid var(--surface-bd);
        }
        .db-hero::before, .db-hero::after {
          content: ""; position: absolute; width: 55%; height: 75%; border-radius: 50%;
          filter: blur(60px); opacity: 0.45; pointer-events: none; z-index: 0;
        }
        .db-hero::before { background: #e95420; top: -30%; right: -10%; }
        .db-hero::after  { background: #bc3d10; bottom: -35%; left: -12%; opacity: 0.35; }
        .db-hero .container { position: relative; z-index: 1; }
        .db-hero-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: clamp(1.5rem, 4vw, 3.5rem);
          align-items: center;
        }
        .db-hero-badge {
          display: inline-flex; align-items: center; justify-content: center;
          width: 84px; height: 84px; border-radius: 20px;
          background: linear-gradient(140deg, var(--accent) 0%, var(--accent-deep) 130%);
          border: 1px solid rgba(255, 255, 255, 0.28);
          color: #ffffff; margin-bottom: 1.5rem;
          box-shadow: 0 14px 40px var(--glow), inset 0 1px 0 rgba(255, 255, 255, 0.25);
        }
        .db-hero-title {
          font-size: clamp(2.75rem, 7vw, 5rem);
          line-height: 1.02; letter-spacing: -0.02em; margin-bottom: 1.1rem; color: #ffffff;
        }
        .db-hero-rule {
          display: block; width: 64px; height: 4px; border-radius: 2px;
          background: var(--accent); box-shadow: 0 0 18px var(--glow); margin-bottom: 1.1rem;
        }
        .db-hero-lead {
          font-size: clamp(1.25rem, 2.6vw, 1.7rem);
          font-style: italic; font-weight: 600; color: #ffffff; margin-bottom: 0.85rem;
        }
        .db-hero-school { color: rgba(255, 255, 255, 0.78); font-size: 1.02rem; }
        @media (max-width: 767.98px) {
          .db-hero-grid { grid-template-columns: 1fr; }
          .db-hero-badge { width: 68px; height: 68px; border-radius: 16px; margin-bottom: 1.1rem; }
          .db-hero-badge svg { width: 36px; height: 36px; }
        }

        /* Cornici foto + placeholder (dark premium) */
        .db-shot {
          position: relative; margin: 0;
          border-radius: 18px; overflow: hidden;
          aspect-ratio: 3 / 2;
          border: 1px solid var(--surface-bd);
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.5);
          background: rgba(255, 255, 255, 0.04);
        }
        .db-shot--portrait { aspect-ratio: 4 / 5; }
        .db-shot img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 50%; display: block; }
        .db-shot-ph {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          background-image:
            radial-gradient(120% 120% at 30% 20%, rgba(233, 84, 32, 0.22), rgba(10, 12, 16, 0.2)),
            linear-gradient(135deg, #221a20 0%, #241c22 100%);
        }
        .db-shot-ph-ic { color: rgba(196, 165, 255, 0.6); }
        .db-shot figcaption {
          position: absolute; left: 0; right: 0; bottom: 0;
          padding: 1.8rem 0.95rem 0.7rem;
          font-size: 0.85rem; font-weight: 700; font-style: italic; color: #ffffff;
          background: linear-gradient(to top, rgba(7, 9, 16, 0.92), rgba(7, 9, 16, 0));
        }
        .db-hero-aside .db-shot { box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6); border-color: var(--vio-bd); }

        /* Fatti chiave */
        .db-about {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: clamp(1.5rem, 4vw, 3rem);
          align-items: center;
        }
        .db-facts { display: flex; flex-direction: column; gap: 1rem; }
        .db-fact {
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
        .db-fact-icon {
          grid-row: 1 / 3;
          display: inline-flex; align-items: center; justify-content: center;
          width: 56px; height: 56px; border-radius: 14px;
          background: var(--vio-soft); color: var(--ink); border: 1px solid var(--vio-bd);
        }
        .db-fact-value { font-size: 1.3rem; font-weight: 800; color: #ffffff; line-height: 1.1; }
        .db-fact-label { font-size: 0.9rem; color: var(--sub); }
        @media (max-width: 767.98px) { .db-about { grid-template-columns: 1fr; } }

        /* Righe narrate */
        .db-story-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: clamp(1.5rem, 4vw, 3rem);
          align-items: center;
        }
        .db-prose { font-size: 1.08rem; line-height: 1.75; color: var(--sub); }
        .db-prose strong { color: #ffffff; }
        .db-prose--lead { font-size: 1.2rem; font-weight: 700; color: #ffffff; }
        @media (max-width: 767.98px) {
          .db-story-row { grid-template-columns: 1fr; }
          .db-story-row .db-story-art { order: -1; }
        }

        /* Badge opera */
        .db-company {
          display: inline-flex; align-items: center; gap: 0.9rem;
          margin-top: 1.5rem; padding: 0.85rem 1.25rem;
          background: var(--surface);
          border: 1px solid var(--surface-bd);
          border-left: 4px solid var(--accent);
          border-radius: 12px;
        }
        .db-company-ic {
          display: inline-flex; align-items: center; justify-content: center;
          width: 46px; height: 46px; border-radius: 50%;
          background: var(--vio-soft); color: var(--ink);
        }
        .db-company-text { display: inline-flex; flex-direction: column; line-height: 1.25; }
        .db-company-name { font-weight: 800; color: #ffffff; font-size: 1.1rem; }
        .db-company-sub { font-size: 0.85rem; color: var(--sub); }

        /* Griglie a schede (età / micro-trame) */
        .db-roles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-top: 2.25rem; }
        .db-roles--3 { grid-template-columns: repeat(3, 1fr); }
        .db-role {
          display: flex; flex-direction: column; gap: 0.2rem;
          padding: 1.1rem 1.2rem; background: var(--surface);
          border: 1px solid var(--surface-bd); border-radius: 14px;
          transition: transform .15s, border-color .15s, box-shadow .15s;
        }
        .db-role:hover { transform: translateY(-3px); border-color: var(--vio-bd); box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45); }
        .db-role-ic {
          display: inline-flex; align-items: center; justify-content: center;
          width: 44px; height: 44px; border-radius: 12px;
          background: var(--vio-soft); color: var(--ink); margin-bottom: 0.4rem;
        }
        .db-role-label { font-weight: 800; color: #ffffff; }
        .db-role-note { font-size: 0.82rem; color: var(--sub); }
        @media (max-width: 767.98px) { .db-roles, .db-roles--3 { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 430px) { .db-roles, .db-roles--3 { grid-template-columns: 1fr; } }

        /* Banda — Il tema */
        .db-band {
          padding: clamp(3rem, 7vw, 5rem) 0;
          background:
            radial-gradient(100% 130% at 100% 0%, rgba(233, 84, 32, 0.18) 0%, transparent 55%),
            linear-gradient(160deg, #120c20 0%, #241c22 60%, #221a20 100%);
          border-top: 1px solid var(--surface-bd); border-bottom: 1px solid var(--surface-bd);
        }
        .db-band-kicker { color: var(--ink); letter-spacing: 0.18em; }
        .db-band-lead {
          color: rgba(255, 255, 255, 0.82);
          font-size: 1.15rem; line-height: 1.7; max-width: 52rem; margin-bottom: 2.5rem;
        }
        .db-band-lead strong { color: #ffffff; }
        .db-percorso { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; }
        .db-percorso--4 { grid-template-columns: repeat(4, 1fr); }
        .db-percorso-card {
          padding: 1.75rem 1.5rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--surface-bd);
          border-radius: 16px;
        }
        .db-percorso-ic {
          display: inline-flex; align-items: center; justify-content: center;
          width: 54px; height: 54px; border-radius: 14px;
          background: var(--vio-soft); color: var(--ink); border: 1px solid var(--vio-bd); margin-bottom: 1rem;
        }
        .db-percorso-title { color: #ffffff; font-weight: 700; font-size: 1.2rem; margin-bottom: 0.5rem; }
        .db-percorso-desc { color: rgba(255, 255, 255, 0.72); font-size: 0.98rem; line-height: 1.6; }
        .db-band-foot {
          display: flex; align-items: center; flex-wrap: wrap;
          margin-top: 2rem; margin-bottom: 0;
          color: rgba(255, 255, 255, 0.82); font-size: 1.05rem;
        }
        .db-band-foot strong { color: var(--ink); font-style: italic; }
        @media (max-width: 991.98px) { .db-percorso--4 { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 575.98px) { .db-percorso, .db-percorso--4 { grid-template-columns: 1fr; } }

        /* Chips (personaggi) */
        .db-chiprow { display: flex; flex-wrap: wrap; gap: 0.6rem; }
        .db-chip {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.5rem 1rem; border-radius: 999px;
          background: var(--vio-soft);
          border: 1px solid var(--vio-bd);
          font-weight: 700; font-size: 0.95rem; color: var(--ink);
        }

        /* Callout (epifania) */
        .db-callout {
          display: flex; gap: 1rem; align-items: flex-start;
          margin-top: 2rem; padding: 1.1rem 1.35rem;
          background: var(--vio-soft);
          border: 1px solid var(--vio-bd);
          border-left: 4px solid var(--accent); border-radius: 14px;
        }
        .db-callout-ic {
          flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center;
          width: 44px; height: 44px; border-radius: 50%;
          background: var(--vio-soft); color: var(--ink);
        }
        .db-callout p { font-size: 1rem; line-height: 1.65; color: var(--sub); }
        .db-callout strong { color: #ffffff; }

        /* In sintesi — banda viola profondo */
        .db-future {
          position: relative; overflow: hidden;
          padding: clamp(3rem, 7vw, 5rem) 0;
          color: #ffffff;
          background:
            radial-gradient(90% 120% at 0% 0%, rgba(233, 84, 32, 0.25) 0%, transparent 55%),
            linear-gradient(135deg, #2a1e26 0%, #322330 55%, #221a20 100%);
          border-top: 1px solid var(--surface-bd);
        }
        .db-future-kicker { color: var(--ink); letter-spacing: 0.18em; }
        .db-future-hl { font-size: 1.5rem; line-height: 1.5; margin-bottom: 1.5rem; color: rgba(255, 255, 255, 0.92); max-width: 50rem; }
        .db-future-hl strong { color: #ffffff; }
        .db-future-chips { display: flex; flex-wrap: wrap; gap: 0.6rem; }
        .db-future-chip {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.45rem 0.9rem; border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.28);
          font-weight: 700; font-size: 0.9rem; color: #ffffff;
        }

        /* Chiusura — banner con citazione */
        .db-thanks {
          position: relative; width: 100%; overflow: hidden;
          background-image: linear-gradient(135deg, #221a20 0%, #241c22 100%);
          min-height: clamp(20rem, 42vw, 34rem);
          display: flex; align-items: center;
        }
        .db-thanks img {
          position: absolute; inset: 0; z-index: 0;
          width: 100%; height: 100%; object-fit: cover; object-position: 50% 45%;
          image-orientation: from-image;
        }
        .db-thanks-scrim {
          position: absolute; inset: 0; z-index: 1;
          background-image: linear-gradient(120deg, rgba(7, 9, 16, 0.92) 0%, rgba(7, 9, 16, 0.6) 50%, rgba(20, 16, 40, 0.35) 100%);
        }
        .db-thanks-overlay { position: relative; z-index: 2; width: 100%; }
        .db-thanks-quote { color: var(--ink); opacity: 0.8; margin-bottom: 0.75rem; }
        .db-thanks-title {
          color: #ffffff; font-weight: 800; line-height: 1.1;
          font-size: clamp(1.9rem, 5vw, 3.4rem); letter-spacing: -0.01em; margin-bottom: 0.75rem;
          font-style: italic; max-width: 24ch;
        }
        .db-thanks-title span { display: block; font-size: clamp(1.1rem, 2.6vw, 1.8rem); font-weight: 600; color: rgba(255, 255, 255, 0.88); }
        .db-thanks-sign {
          color: rgba(255, 255, 255, 0.82);
          text-transform: uppercase; letter-spacing: 0.14em; font-weight: 600; font-size: 0.9rem; margin-bottom: 0;
        }

        /* Vai all'altro libro — CTA cross-link */
        .db-next { padding: clamp(2.5rem, 6vw, 4rem) 0; background: linear-gradient(180deg, #241c22 0%, #1b151a 100%); }
        .db-next-card {
          display: block; text-decoration: none;
          padding: clamp(1.5rem, 4vw, 2.25rem);
          background: var(--surface);
          border: 1px solid var(--vio-bd);
          border-radius: 20px;
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.4);
          transition: transform .18s, border-color .18s, box-shadow .18s, background .18s;
        }
        .db-next-card:hover, .db-next-card:focus-visible {
          transform: translateY(-4px);
          border-color: var(--accent);
          box-shadow: 0 24px 60px var(--glow);
          background: var(--vio-soft);
        }
        .db-next-eyebrow {
          display: inline-flex; align-items: center; gap: 0.45rem;
          text-transform: uppercase; letter-spacing: 0.16em; font-size: 0.78rem; font-weight: 700;
          color: var(--ink); margin-bottom: 1.1rem;
        }
        .db-next-row { display: flex; align-items: center; gap: 1.1rem; }
        .db-next-ic {
          flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center;
          width: 58px; height: 58px; border-radius: 16px;
          background: linear-gradient(140deg, var(--accent) 0%, var(--accent-deep) 130%);
          border: 1px solid rgba(255, 255, 255, 0.28);
          color: #ffffff; box-shadow: 0 10px 30px var(--glow);
        }
        .db-next-text { display: flex; flex-direction: column; min-width: 0; }
        .db-next-title { color: #ffffff; font-weight: 800; font-size: clamp(1.25rem, 3vw, 1.6rem); line-height: 1.15; }
        .db-next-sub { color: var(--sub); font-size: 0.95rem; line-height: 1.45; margin-top: 0.3rem; }
        .db-next-arrow { flex-shrink: 0; margin-left: auto; color: var(--ink); transition: transform .18s, color .18s; }
        .db-next-card:hover .db-next-arrow, .db-next-card:focus-visible .db-next-arrow { transform: translateX(5px); color: #ffffff; }
        @media (max-width: 575.98px) { .db-next-arrow { display: none; } }

        /* Footer */
        .db-footer { background-color: #1b151a; color: #ffffff; border-top: 1px solid var(--surface-bd); }
      `}</style>
    </div>
  );
}
