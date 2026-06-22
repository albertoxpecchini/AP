import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  GraduationCap,
  MapPin,
  Cake,
  CalendarDays,
  Waves,
  Ruler,
  DraftingCompass,
  Building2,
  Trophy,
  Users,
  Sparkles,
  Briefcase,
  HardHat,
  Quote,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// «Me stesso» — Presentazione personale di Federico Sgarbi (Esame di Stato 2026).
//
// Ricostruzione web fedele della presentazione (9 slide) col design system
// neroverde del portfolio, in stile /pcto: header sticky, hero a gradiente,
// sezioni con kicker numerato, righe narrate alternate, banda di chiusura e
// banner full-width. Le foto vivono in /images/me-stesso/ — se mancano, ogni
// cornice mostra un placeholder coerente con la palette (nessuna immagine rotta).
// ─────────────────────────────────────────────────────────────────────────────

// Cornice foto con fallback elegante: se l'immagine manca, mostra un
// placeholder neroverde con icona, senza spezzare il layout.
function Shot({
  src,
  alt,
  caption,
  icon,
  portrait = false,
}: {
  src: string;
  alt: string;
  caption?: string;
  icon: React.ReactNode;
  portrait?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <figure className={`ms-shot${portrait ? " ms-shot--portrait" : ""}`}>
      {failed ? (
        <div className="ms-shot-ph" role="img" aria-label={alt}>
          <span className="ms-shot-ph-ic" aria-hidden="true">{icon}</span>
        </div>
      ) : (
        <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
      )}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

const FACTS = [
  { Icon: Cake, value: "19 anni", label: "Nato il 3 gennaio 2007" },
  { Icon: MapPin, value: "Mantova", label: "Un piccolo paese: Stradella" },
  { Icon: CalendarDays, value: "5 anni", label: "di percorso, che oggi si concludono qui" },
];

const PERCORSO = [
  {
    Icon: Ruler,
    title: "Disegno e progetto",
    desc: "Ho imparato a progettare con metodo e precisione.",
  },
  {
    Icon: DraftingCompass,
    title: "Metodo e rigore",
    desc: "A ragionare per problemi e a risolverli un passo alla volta.",
  },
  {
    Icon: Building2,
    title: "Territorio",
    desc: "A leggere e interpretare il territorio e le costruzioni.",
  },
];

export default function MeStesso() {
  useEffect(() => {
    const prev = document.title;
    document.title = "Me stesso · Federico Sgarbi — Esame di Stato 2026";
    return () => { document.title = prev; };
  }, []);

  return (
    <div className="it-page-wrapper ms-page">
      {/* Header compatto: marchio del portfolio + ritorno alla home */}
      <header className="ms-header">
        <div className="container">
          <div className="d-flex align-items-center justify-content-between py-3">
            <Link to="/" className="ms-brand text-decoration-none d-inline-flex align-items-center">
              <span className="ms-brand-mark" aria-hidden="true">
                <img src="/favicon.svg" alt="" width={40} height={40} />
              </span>
              <span className="ms-brand-text">
                <span className="ms-brand-title">Alberto Pecchini</span>
                <span className="ms-brand-tagline">Designer &amp; Front-end Developer</span>
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
        <section className="ms-hero">
          <div className="container">
            <div className="ms-hero-grid">
              <div className="ms-hero-text">
                <span className="ms-hero-badge" aria-hidden="true">
                  <GraduationCap size={44} strokeWidth={1.75} />
                </span>
                <p className="ap-kicker text-uppercase fw-semibold mb-3">Esame di Stato 2026</p>
                <h1 className="ms-hero-title fw-bold">Federico Sgarbi</h1>
                <span className="ms-hero-rule" aria-hidden="true" />
                <p className="ms-hero-lead">Presentazione personale</p>
                <p className="ms-hero-school d-inline-flex align-items-center mb-0">
                  Istituto Tecnico «Carlo d'Arco» — Indirizzo Geometri
                </p>
              </div>
              <div className="ms-hero-aside">
                <Shot
                  src="/images/me-stesso/cover.jpg"
                  alt="Federico Sgarbi"
                  icon={<GraduationCap size={64} strokeWidth={1.5} />}
                  portrait
                />
              </div>
            </div>
          </div>
        </section>

        {/* ② Chi sono */}
        <section className="py-5 my-lg-4 bg-white">
          <div className="container">
            <div className="mb-4">
              <p className="ap-kicker text-primary text-uppercase fw-semibold mb-3">01 — Chi sono</p>
              <h2 className="display-5 fw-bold mb-0">Un po' di me</h2>
            </div>
            <div className="ms-about">
              <div className="ms-facts">
                {FACTS.map(({ Icon, value, label }) => (
                  <div className="ms-fact" key={value}>
                    <span className="ms-fact-icon" aria-hidden="true"><Icon size={22} /></span>
                    <span className="ms-fact-value">{value}</span>
                    <span className="ms-fact-label">{label}</span>
                  </div>
                ))}
              </div>
              <Shot
                src="/images/me-stesso/infanzia.jpg"
                alt="Federico da bambino"
                caption="Io, qualche anno fa"
                icon={<Cake size={56} strokeWidth={1.5} />}
              />
            </div>
          </div>
        </section>

        {/* ③ Le mie radici */}
        <section className="py-5 my-lg-4 bg-light">
          <div className="container">
            <div className="mb-4">
              <p className="ap-kicker text-primary text-uppercase fw-semibold mb-3">02 — Le mie radici</p>
              <h2 className="display-5 fw-bold mb-0">La mia famiglia e l'azienda</h2>
            </div>
            <div className="ms-story-row">
              <div className="ms-story-text">
                <p className="ms-prose">
                  La mia storia parte da <strong>Stradella</strong> e dalla mia famiglia, che qui ha
                  costruito qualcosa di cui sono molto orgoglioso: l'<strong>azienda di famiglia</strong>,
                  che si occupa di impianti idraulici.
                </p>
                <p className="ms-prose">
                  Crescere in una famiglia di imprenditori mi ha insegnato fin da piccolo il valore del
                  <strong> lavoro</strong>, del <strong>sacrificio</strong> e della <strong>costanza</strong>:
                  i risultati non arrivano per caso, ma si costruiscono giorno dopo giorno.
                </p>
                <div className="ms-company">
                  <span className="ms-company-ic" aria-hidden="true"><Waves size={24} /></span>
                  <span className="ms-company-text">
                    <span className="ms-company-name">Sgarbi Aldino S.r.l.</span>
                    <span className="ms-company-sub">Impianti idraulici</span>
                  </span>
                </div>
              </div>
              <div className="ms-story-art">
                <Shot
                  src="/images/me-stesso/azienda.jpg"
                  alt="La sede dell'azienda di famiglia a Stradella"
                  icon={<Waves size={56} strokeWidth={1.5} />}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ④ Il mio percorso — banda scura */}
        <section className="ms-band">
          <div className="container">
            <p className="ap-kicker text-uppercase fw-semibold mb-3 ms-band-kicker">03 — Il mio percorso</p>
            <h2 className="display-5 fw-bold mb-3 text-white">Perché ho scelto i Geometri</h2>
            <p className="ms-band-lead">
              L'azienda di famiglia è stata una delle motivazioni principali della mia scelta: un
              percorso concreto e tecnico, legato alle costruzioni, alla progettazione e al territorio —
              vicino al mondo che vedevo a casa.
            </p>
            <div className="ms-percorso">
              {PERCORSO.map(({ Icon, title, desc }) => (
                <div className="ms-percorso-card" key={title}>
                  <span className="ms-percorso-ic" aria-hidden="true"><Icon size={26} /></span>
                  <h3 className="ms-percorso-title">{title}</h3>
                  <p className="ms-percorso-desc mb-0">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ⑤ Le mie passioni */}
        <section className="py-5 my-lg-4 bg-white">
          <div className="container">
            <div className="mb-5">
              <p className="ap-kicker text-primary text-uppercase fw-semibold mb-3">04 — Le mie passioni</p>
              <h2 className="display-5 fw-bold mb-0">Ciò che mi muove</h2>
            </div>

            {/* Calcio */}
            <div className="ms-story-row mb-5">
              <div className="ms-story-art">
                <Shot
                  src="/images/me-stesso/calcio.jpg"
                  alt="Federico in campo durante una partita di calcio"
                  caption="7 anni in campo"
                  icon={<Trophy size={56} strokeWidth={1.5} />}
                />
              </div>
              <div className="ms-story-text">
                <h3 className="h3 fw-bold mb-3">La passione più grande: il calcio</h3>
                <p className="ms-prose ms-prose--lead">
                  Ho praticato calcio per sette anni e mi ha dato molto più di uno sport.
                </p>
                <p className="ms-prose">
                  Mi ha insegnato il valore del gruppo, il rispetto delle regole, la disciplina e
                  l'importanza di lottare fino alla fine, anche quando le cose non vanno come vorresti.
                </p>
                <p className="ms-prose mb-0">
                  Sono lezioni che non servono solo in campo, ma nella vita di tutti i giorni — e che
                  mi hanno aiutato anche nello studio.
                </p>
              </div>
            </div>

            {/* Stare in compagnia */}
            <div className="ms-friends mb-5">
              <div className="ms-friends-head">
                <span className="ms-pass-ic" aria-hidden="true"><Users size={24} /></span>
                <div>
                  <h3 className="h3 fw-bold mb-2">Stare in compagnia</h3>
                  <p className="ms-prose ms-prose--lead mb-0">
                    Una delle cose che mi rende più felice è stare con le persone a cui voglio bene.
                  </p>
                </div>
              </div>
              <p className="ms-prose ms-friends-copy">
                Gli amici sono una parte fondamentale della mia vita: con loro condivido i momenti belli,
                ma sono anche quelli su cui posso contare nei momenti difficili. È ciò che mi dà l'energia
                per affrontare tutto il resto.
              </p>
              <div className="ms-friends-grid">
                <Shot
                  src="/images/me-stesso/amici-1.jpg"
                  alt="Federico con gli amici a tavola"
                  icon={<Users size={48} strokeWidth={1.5} />}
                />
                <Shot
                  src="/images/me-stesso/amici-2.jpg"
                  alt="Federico con un amico allo stadio"
                  icon={<Users size={48} strokeWidth={1.5} />}
                />
              </div>
            </div>

            {/* Padel */}
            <div className="ms-story-row">
              <div className="ms-story-text">
                <h3 className="h3 fw-bold mb-3">Una nuova sfida: il padel</h3>
                <p className="ms-prose ms-prose--lead">
                  È la mia passione più recente: ho iniziato da poco, ma mi ha conquistato subito.
                </p>
                <p className="ms-prose">
                  Mi piace perché unisce la competizione al divertimento e allo stare insieme.
                </p>
                <p className="ms-prose mb-0">
                  E in fondo dice qualcosa di me: ho ancora tanta voglia di mettermi in gioco, di provare
                  cose nuove e di migliorarmi, senza accontentarmi.
                </p>
              </div>
              <div className="ms-story-art">
                <Shot
                  src="/images/me-stesso/padel.jpg"
                  alt="Federico gioca a padel in campo"
                  icon={<Sparkles size={56} strokeWidth={1.5} />}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ⑥ Il mio domani — banda di chiusura a gradiente */}
        <section className="ms-future">
          <div className="container">
            <div className="ms-future-grid">
              <div>
                <p className="ap-kicker text-uppercase fw-semibold mb-3 ms-future-kicker">05 — Il mio domani</p>
                <h2 className="display-5 fw-bold mb-3 text-white">Il mio futuro</h2>
                <p className="ms-future-hl">
                  Dopo la maturità ho le idee chiare: <strong>andrò a lavorare nell'azienda di famiglia.</strong>
                </p>
                <p className="ms-future-copy">
                  Voglio mettere in pratica ciò che ho studiato e dare il mio contributo a quello che la
                  mia famiglia ha costruito, portando avanti con impegno e responsabilità il lavoro di chi
                  mi ha preceduto.
                </p>
                <div className="ms-future-chips">
                  <span className="ms-future-chip"><Briefcase size={15} aria-hidden="true" /> Lavoro</span>
                  <span className="ms-future-chip"><HardHat size={15} aria-hidden="true" /> Responsabilità</span>
                  <span className="ms-future-chip"><Waves size={15} aria-hidden="true" /> Continuità</span>
                </div>
              </div>
              <div className="ms-future-art">
                <Shot
                  src="/images/me-stesso/azienda.jpg"
                  alt="L'azienda di famiglia, dove Federico costruirà il suo futuro"
                  caption="L'azienda di famiglia, dove costruirò il mio futuro"
                  icon={<Building2 size={56} strokeWidth={1.5} />}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ⑦ Grazie — banner full-width */}
        <section className="ms-thanks" aria-label="Grazie per l'attenzione">
          <img
            src="/images/me-stesso/grazie.jpg"
            alt=""
            aria-hidden="true"
            loading="lazy"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
          <div className="ms-thanks-scrim" aria-hidden="true" />
          <div className="ms-thanks-overlay">
            <div className="container">
              <Quote size={40} className="ms-thanks-quote" aria-hidden="true" />
              <h2 className="ms-thanks-title">Grazie<span> per l'attenzione</span></h2>
              <p className="ms-thanks-sign">Federico Sgarbi — Esame di Stato 2026</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="ms-footer">
        <div className="container">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 py-4">
            <span style={{ opacity: 0.8 }}>
              Presentazione di Federico Sgarbi · ricostruzione web di Alberto Pecchini
            </span>
            <Link to="/" className="text-white text-decoration-none d-inline-flex align-items-center">
              <ArrowLeft size={16} className="me-1" aria-hidden="true" /> Torna alla home
            </Link>
          </div>
        </div>
      </footer>

      <style>{`
        /* Palette neroverde — coerente con la home e con /pcto. */
        .ms-page {
          --bs-primary: #2F7D4A;
          --bs-primary-rgb: 47, 125, 74;
          min-height: 100vh;
          font-family: "Titillium Web", Geneva, Tahoma, sans-serif;
          background-color: #ffffff;
        }
        .ms-page .text-primary { color: #1F6B3D !important; }
        .ms-page .btn-outline-light:hover,
        .ms-page .btn-outline-light:focus { color: #1F6B3D !important; }
        .ap-kicker { letter-spacing: 0.18em; font-size: 0.875rem; }

        /* Header */
        .ms-header { background-color: #103820; position: sticky; top: 0; z-index: 10; }
        .ms-brand-mark {
          display: inline-flex; align-items: center; justify-content: center;
          width: 40px; height: 40px; border-radius: 8px; overflow: hidden; margin-right: 12px;
        }
        .ms-brand-mark img { width: 100%; height: 100%; display: block; }
        .ms-brand-text { display: inline-flex; flex-direction: column; line-height: 1.2; }
        .ms-brand-title { color: #ffffff; font-weight: 700; font-size: 1.05rem; }
        .ms-brand-tagline { color: rgba(255, 255, 255, 0.7); font-size: 0.78rem; }
        @media (max-width: 575.98px) { .ms-brand-tagline { display: none; } }

        /* Hero copertina */
        .ms-hero {
          padding: clamp(3rem, 7vw, 5.5rem) 0;
          color: #ffffff;
          background-image: linear-gradient(135deg, #103820 0%, #1F6B3D 58%, #2F7D4A 100%);
        }
        .ms-hero-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: clamp(1.5rem, 4vw, 3.5rem);
          align-items: center;
        }
        .ms-hero-badge {
          display: inline-flex; align-items: center; justify-content: center;
          width: 84px; height: 84px; border-radius: 20px;
          background: rgba(255, 255, 255, 0.14);
          border: 1px solid rgba(255, 255, 255, 0.32);
          color: #ffffff; margin-bottom: 1.5rem;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
        }
        .ms-hero-title {
          font-size: clamp(2.75rem, 7vw, 5rem);
          line-height: 1.02; letter-spacing: -0.02em; margin-bottom: 1.1rem;
        }
        .ms-hero-rule {
          display: block; width: 64px; height: 4px; border-radius: 2px;
          background: rgba(255, 255, 255, 0.6); margin-bottom: 1.1rem;
        }
        .ms-hero-lead {
          font-size: clamp(1.25rem, 2.6vw, 1.7rem);
          font-style: italic; font-weight: 600; color: #ffffff; margin-bottom: 0.85rem;
        }
        .ms-hero-school { color: rgba(255, 255, 255, 0.82); font-size: 1.02rem; }
        @media (max-width: 767.98px) {
          .ms-hero-grid { grid-template-columns: 1fr; }
          .ms-hero-badge { width: 68px; height: 68px; border-radius: 16px; margin-bottom: 1.1rem; }
          .ms-hero-badge svg { width: 36px; height: 36px; }
        }

        /* Cornici foto + placeholder */
        .ms-shot {
          position: relative; margin: 0;
          border-radius: 18px; overflow: hidden;
          aspect-ratio: 3 / 2;
          border: 1px solid rgba(47, 125, 74, 0.22);
          box-shadow: 0 12px 32px rgba(16, 56, 32, 0.12);
          background: #f0f4f1;
        }
        .ms-shot--portrait { aspect-ratio: 4 / 5; }
        .ms-shot img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .ms-shot-ph {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          background-image:
            radial-gradient(120% 120% at 30% 20%, rgba(47,125,74,0.18), rgba(16,56,32,0.06)),
            linear-gradient(135deg, #eef3ef 0%, #e2ece5 100%);
        }
        .ms-shot-ph-ic { color: rgba(31, 107, 61, 0.55); }
        .ms-shot figcaption {
          position: absolute; left: 0; right: 0; bottom: 0;
          padding: 1.8rem 0.95rem 0.7rem;
          font-size: 0.85rem; font-weight: 700; font-style: italic; color: #ffffff;
          background: linear-gradient(to top, rgba(16, 56, 32, 0.9), rgba(16, 56, 32, 0));
        }
        .ms-shot--portrait + .ms-shot,
        .ms-hero-aside .ms-shot { box-shadow: 0 18px 44px rgba(0, 0, 0, 0.28); }

        /* Chi sono */
        .ms-about {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: clamp(1.5rem, 4vw, 3rem);
          align-items: center;
        }
        .ms-facts { display: flex; flex-direction: column; gap: 1rem; }
        .ms-fact {
          display: grid;
          grid-template-columns: 56px 1fr;
          align-items: center;
          column-gap: 1rem;
          padding: 1rem 1.25rem;
          background: #ffffff;
          border: 1px solid rgba(47, 125, 74, 0.18);
          border-radius: 14px;
          box-shadow: 0 6px 18px rgba(16, 56, 32, 0.05);
        }
        .ms-fact-icon {
          grid-row: 1 / 3;
          display: inline-flex; align-items: center; justify-content: center;
          width: 56px; height: 56px; border-radius: 14px;
          background: rgba(47, 125, 74, 0.10); color: #1F6B3D;
        }
        .ms-fact-value { font-size: 1.3rem; font-weight: 800; color: #103820; line-height: 1.1; }
        .ms-fact-label { font-size: 0.9rem; color: #5a6f63; }
        @media (max-width: 767.98px) { .ms-about { grid-template-columns: 1fr; } }

        /* Righe narrate (radici / passioni) */
        .ms-story-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: clamp(1.5rem, 4vw, 3rem);
          align-items: center;
        }
        .ms-prose { font-size: 1.08rem; line-height: 1.75; color: #4a5d51; }
        .ms-prose strong { color: #103820; }
        .ms-prose--lead { font-size: 1.2rem; font-weight: 700; color: #103820; }
        @media (max-width: 767.98px) {
          .ms-story-row { grid-template-columns: 1fr; }
          .ms-story-row .ms-story-art { order: -1; }
        }

        /* Badge azienda */
        .ms-company {
          display: inline-flex; align-items: center; gap: 0.9rem;
          margin-top: 1.5rem; padding: 0.85rem 1.25rem;
          background: #ffffff;
          border: 1px solid rgba(47, 125, 74, 0.20);
          border-left: 4px solid #2F7D4A;
          border-radius: 12px;
        }
        .ms-company-ic {
          display: inline-flex; align-items: center; justify-content: center;
          width: 46px; height: 46px; border-radius: 50%;
          background: rgba(47, 125, 74, 0.12); color: #1F6B3D;
        }
        .ms-company-text { display: inline-flex; flex-direction: column; line-height: 1.25; }
        .ms-company-name { font-weight: 800; color: #103820; font-size: 1.1rem; }
        .ms-company-sub { font-size: 0.85rem; color: #6b8275; }

        /* Banda scura — Il mio percorso */
        .ms-band {
          padding: clamp(3rem, 7vw, 5rem) 0;
          background-image: linear-gradient(160deg, #0c2c19 0%, #103820 60%, #16482a 100%);
        }
        .ms-band-kicker { color: #7FC09A; letter-spacing: 0.18em; }
        .ms-band-lead {
          color: rgba(255, 255, 255, 0.86);
          font-size: 1.15rem; line-height: 1.7; max-width: 52rem; margin-bottom: 2.5rem;
        }
        .ms-percorso {
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem;
        }
        .ms-percorso-card {
          padding: 1.75rem 1.5rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 16px;
        }
        .ms-percorso-ic {
          display: inline-flex; align-items: center; justify-content: center;
          width: 54px; height: 54px; border-radius: 14px;
          background: rgba(127, 192, 154, 0.16); color: #9BD3B2; margin-bottom: 1rem;
        }
        .ms-percorso-title { color: #ffffff; font-weight: 700; font-size: 1.2rem; margin-bottom: 0.5rem; }
        .ms-percorso-desc { color: rgba(255, 255, 255, 0.78); font-size: 0.98rem; line-height: 1.6; }
        @media (max-width: 767.98px) { .ms-percorso { grid-template-columns: 1fr; } }

        /* Amici */
        .ms-friends-head { display: flex; align-items: flex-start; gap: 1rem; margin-bottom: 1rem; }
        .ms-pass-ic {
          flex-shrink: 0;
          display: inline-flex; align-items: center; justify-content: center;
          width: 52px; height: 52px; border-radius: 14px;
          background: rgba(47, 125, 74, 0.10); color: #1F6B3D;
        }
        .ms-friends-copy { max-width: 60rem; margin-bottom: 1.5rem; }
        .ms-friends-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }
        @media (max-width: 575.98px) { .ms-friends-grid { grid-template-columns: 1fr; } }

        /* Il mio domani */
        .ms-future {
          padding: clamp(3rem, 7vw, 5rem) 0;
          color: #ffffff;
          background-image: linear-gradient(135deg, #1F6B3D 0%, #2F7D4A 60%, #3F8F5A 100%);
        }
        .ms-future-grid {
          display: grid; grid-template-columns: 1.05fr 0.95fr;
          gap: clamp(1.5rem, 4vw, 3.5rem); align-items: center;
        }
        .ms-future-kicker { color: rgba(255, 255, 255, 0.92); letter-spacing: 0.18em; }
        .ms-future-hl { font-size: 1.4rem; line-height: 1.5; margin-bottom: 1.1rem; }
        .ms-future-hl strong { color: #ffffff; }
        .ms-future-copy { color: rgba(255, 255, 255, 0.9); font-size: 1.1rem; line-height: 1.7; margin-bottom: 1.5rem; }
        .ms-future-chips { display: flex; flex-wrap: wrap; gap: 0.6rem; }
        .ms-future-chip {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.45rem 0.9rem; border-radius: 999px;
          background: rgba(255, 255, 255, 0.16);
          border: 1px solid rgba(255, 255, 255, 0.3);
          font-weight: 700; font-size: 0.9rem; color: #ffffff;
        }
        @media (max-width: 767.98px) { .ms-future-grid { grid-template-columns: 1fr; } }

        /* Grazie — banner */
        .ms-thanks {
          position: relative; width: 100%; overflow: hidden;
          background-image: linear-gradient(135deg, #103820 0%, #1F6B3D 100%);
          min-height: clamp(20rem, 42vw, 34rem);
          display: flex; align-items: center;
        }
        .ms-thanks img {
          position: absolute; inset: 0; z-index: 0;
          width: 100%; height: 100%; object-fit: cover;
        }
        .ms-thanks-scrim {
          position: absolute; inset: 0; z-index: 1;
          background-image: linear-gradient(120deg, rgba(8, 28, 16, 0.86) 0%, rgba(8, 28, 16, 0.5) 50%, rgba(8, 28, 16, 0.2) 100%);
        }
        .ms-thanks-overlay { position: relative; z-index: 2; width: 100%; }
        .ms-thanks-quote { color: rgba(255, 255, 255, 0.55); margin-bottom: 0.75rem; }
        .ms-thanks-title {
          color: #ffffff; font-weight: 800; line-height: 1.02;
          font-size: clamp(3rem, 9vw, 6rem); letter-spacing: -0.02em; margin-bottom: 0.75rem;
        }
        .ms-thanks-title span { display: block; font-size: clamp(1.25rem, 3vw, 2rem); font-weight: 600; font-style: italic; color: rgba(255, 255, 255, 0.88); }
        .ms-thanks-sign {
          color: rgba(255, 255, 255, 0.82);
          text-transform: uppercase; letter-spacing: 0.14em; font-weight: 600; font-size: 0.9rem; margin-bottom: 0;
        }

        /* Footer */
        .ms-footer { background-color: #103820; color: #ffffff; }
      `}</style>
    </div>
  );
}
