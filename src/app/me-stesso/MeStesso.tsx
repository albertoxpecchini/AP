import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  GraduationCap,
  MapPin,
  CalendarDays,
  Sprout,
  Ruler,
  DraftingCompass,
  Building2,
  Code2,
  HeartHandshake,
  Users,
  Plane,
  Palette,
  Newspaper,
  Quote,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// «Me stesso» — Presentazione personale di Alberto Pecchini (Esame di Stato 2026).
//
// Stessa impaginazione della presentazione (9 sezioni) col design system
// neroverde del portfolio, in stile /pcto: hero copertina, chi sono, radici
// familiari (la cascina di Rivalta), percorso CAT, passioni (web, volontariato,
// viaggi), futuro e banner di chiusura. Le foto vivono in /images/me-stesso/ —
// se mancano, ogni cornice mostra un placeholder coerente con la palette.
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
  { Icon: MapPin, value: "Rivalta sul Mincio", label: "Comune di Rodigo, provincia di Mantova" },
  { Icon: GraduationCap, value: "Classe 5T", label: "Diploma CAT — Costruzioni, Ambiente e Territorio" },
  { Icon: CalendarDays, value: "5 anni", label: "di percorso, che oggi si concludono qui" },
];

const PERCORSO = [
  {
    Icon: Ruler,
    title: "Disegno e progetto",
    desc: "Progettare con metodo e precisione, dall'AutoCAD fino al dettaglio.",
  },
  {
    Icon: DraftingCompass,
    title: "Metodo e rigore",
    desc: "Ragionare per problemi e risolverli un passo alla volta — anche scrivendo codice.",
  },
  {
    Icon: Building2,
    title: "Territorio",
    desc: "Leggere e interpretare il territorio, il rilievo e le costruzioni.",
  },
];

export default function MeStesso() {
  useEffect(() => {
    const prev = document.title;
    document.title = "Me stesso · Alberto Pecchini — Esame di Stato 2026";
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
                <h1 className="ms-hero-title fw-bold">Alberto Pecchini</h1>
                <span className="ms-hero-rule" aria-hidden="true" />
                <p className="ms-hero-lead">Presentazione personale</p>
                <p className="ms-hero-school d-inline-flex align-items-center mb-0">
                  Istituto Tecnico Tecnologico «Carlo d'Arco» — Mantova · Indirizzo CAT
                </p>
              </div>
              <div className="ms-hero-aside">
                <Shot
                  src="/alberto-pecchini.jpg"
                  alt="Ritratto di Alberto Pecchini"
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
              <h2 className="display-5 fw-bold mb-2">Un po' di me</h2>
              <p className="ms-prose mb-0" style={{ maxWidth: "46rem" }}>
                Sono uno studente CAT all'ultimo anno e, fuori dai banchi,
                <strong> designer e sviluppatore front-end</strong>.
              </p>
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
                src="/images/me-stesso/rivalta.jpg"
                alt="Rivalta sul Mincio, dove sono cresciuto"
                caption="Tra Rivalta e Mantova"
                icon={<MapPin size={56} strokeWidth={1.5} />}
              />
            </div>
          </div>
        </section>

        {/* ③ Le mie radici */}
        <section className="py-5 my-lg-4 bg-light">
          <div className="container">
            <div className="mb-4">
              <p className="ap-kicker text-primary text-uppercase fw-semibold mb-3">02 — Le mie radici</p>
              <h2 className="display-5 fw-bold mb-0">La mia famiglia e la cascina</h2>
            </div>
            <div className="ms-story-row">
              <div className="ms-story-text">
                <p className="ms-prose">
                  La mia storia parte da <strong>Rivalta sul Mincio</strong> e dalla mia famiglia, che
                  qui porta avanti la <strong>cascina di famiglia</strong>: un'attività agricola fatta
                  di terra, stagioni e lavoro vero.
                </p>
                <p className="ms-prose">
                  Collaboro da sempre — curo e poto le piante, trasporto materiali sul trattore,
                  raccolgo il fieno e coordino le operazioni nei periodi più intensi. È qui che ho
                  imparato il valore del <strong>lavoro</strong>, della <strong>costanza</strong> e
                  della <strong>responsabilità</strong>: i risultati non arrivano per caso, ma si
                  costruiscono giorno dopo giorno.
                </p>
                <div className="ms-company">
                  <span className="ms-company-ic" aria-hidden="true"><Sprout size={24} /></span>
                  <span className="ms-company-text">
                    <span className="ms-company-name">Cascina di famiglia</span>
                    <span className="ms-company-sub">Rivalta sul Mincio</span>
                  </span>
                </div>
              </div>
              <div className="ms-story-art">
                <Shot
                  src="/images/me-stesso/cascina.jpg"
                  alt="La cascina di famiglia a Rivalta sul Mincio"
                  icon={<Sprout size={56} strokeWidth={1.5} />}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ④ Il mio percorso — banda scura */}
        <section className="ms-band">
          <div className="container">
            <p className="ap-kicker text-uppercase fw-semibold mb-3 ms-band-kicker">03 — Il mio percorso</p>
            <h2 className="display-5 fw-bold mb-3 text-white">Perché ho scelto il CAT</h2>
            <p className="ms-band-lead">
              Mi ha spinto la voglia di un percorso concreto e creativo insieme: disegnare, progettare,
              capire il territorio e le costruzioni. Ed è lo stesso disegno tecnico che, fuori dalla
              scuola, mi ha portato verso il <strong>web design</strong> e lo <strong>sviluppo</strong>.
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

            {/* Web design & sviluppo */}
            <div className="ms-story-row mb-5">
              <div className="ms-story-art">
                <Shot
                  src="/images/me-stesso/web.jpg"
                  alt="Alberto al lavoro su un progetto web"
                  caption="Designer & front-end developer"
                  icon={<Code2 size={56} strokeWidth={1.5} />}
                />
              </div>
              <div className="ms-story-text">
                <h3 className="h3 fw-bold mb-3">La passione più grande: creare per il web</h3>
                <p className="ms-prose ms-prose--lead">
                  Progetto e sviluppo siti web e web game: è ciò che mi definisce.
                </p>
                <p className="ms-prose">
                  Mi occupo di tutto, dall'idea al codice: ho realizzato siti veri — <strong>Cascina
                  Fontana</strong> e <strong>Rivalta sul Mincio</strong> — e una serie di web game
                  (Trivia, Mappa, Movimento, Angoli, Parole) curati nel design e nelle animazioni.
                </p>
                <p className="ms-prose mb-0">
                  Amo trasformare un'idea in qualcosa che si può toccare a schermo, iterarla e rifinirla
                  fino all'ultimo dettaglio.
                </p>
              </div>
            </div>

            {/* Volontariato / stare con gli altri */}
            <div className="ms-friends mb-5">
              <div className="ms-friends-head">
                <span className="ms-pass-ic" aria-hidden="true"><HeartHandshake size={24} /></span>
                <div>
                  <h3 className="h3 fw-bold mb-2">Stare con gli altri</h3>
                  <p className="ms-prose ms-prose--lead mb-0">
                    Una parte importante di me è il tempo passato con le persone.
                  </p>
                </div>
              </div>
              <p className="ms-prose ms-friends-copy">
                Ho fatto l'animatore al <strong>Grest parrocchiale</strong> di Rivalta per due estati e
                ho dato supporto al <strong>CRED</strong> di Rodigo: gestire gruppi di bambini, inventare
                giochi e attività, mediare ed esserci davvero. Mi dà energia e mi ha insegnato a lavorare
                in squadra.
              </p>
              <div className="ms-friends-grid">
                <Shot
                  src="/images/me-stesso/grest-1.jpg"
                  alt="Animazione al Grest con i bambini"
                  icon={<Users size={48} strokeWidth={1.5} />}
                />
                <Shot
                  src="/images/me-stesso/grest-2.jpg"
                  alt="Attività di gruppo durante il Grest"
                  icon={<HeartHandshake size={48} strokeWidth={1.5} />}
                />
              </div>
            </div>

            {/* Viaggi */}
            <div className="ms-story-row">
              <div className="ms-story-text">
                <h3 className="h3 fw-bold mb-3">Conoscere il mondo: i viaggi</h3>
                <p className="ms-prose ms-prose--lead">
                  Mi piace mettermi in gioco e scoprire posti nuovi.
                </p>
                <p className="ms-prose">
                  Un mese a <strong>Dublino</strong> per l'inglese (livello C1, esame IELTS), la
                  Normandia e <strong>Parigi</strong>, <strong>Edimburgo</strong> a Natale: viaggiare mi
                  apre la testa.
                </p>
                <p className="ms-prose mb-0">
                  E in fondo dice qualcosa di me: ho tanta voglia di provare cose nuove, di migliorarmi
                  e di non accontentarmi.
                </p>
              </div>
              <div className="ms-story-art">
                <Shot
                  src="/images/me-stesso/viaggi.jpg"
                  alt="Uno dei miei viaggi"
                  caption="Dublino · Parigi · Edimburgo"
                  icon={<Plane size={56} strokeWidth={1.5} />}
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
                  Dopo la maturità voglio continuare a crescere come <strong>designer e sviluppatore front-end.</strong>
                </p>
                <p className="ms-future-copy">
                  Trasformare idee in esperienze digitali curate è ciò che mi riesce meglio e mi
                  appassiona di più. E coltivo un sogno più grande: un giorno fondare la mia
                  <strong> testata giornalistica</strong>, andare sul campo e raccontare storie vere.
                </p>
                <div className="ms-future-chips">
                  <span className="ms-future-chip"><Palette size={15} aria-hidden="true" /> Design</span>
                  <span className="ms-future-chip"><Code2 size={15} aria-hidden="true" /> Sviluppo</span>
                  <span className="ms-future-chip"><Newspaper size={15} aria-hidden="true" /> Storie</span>
                </div>
              </div>
              <div className="ms-future-art">
                <Shot
                  src="/images/me-stesso/futuro.jpg"
                  alt="Le idee che voglio costruire"
                  caption="Le idee che voglio costruire"
                  icon={<Code2 size={56} strokeWidth={1.5} />}
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
              <p className="ms-thanks-sign">Alberto Pecchini — Esame di Stato 2026</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="ms-footer">
        <div className="container">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 py-4">
            <span style={{ opacity: 0.8 }}>
              Presentazione personale di Alberto Pecchini · Esame di Stato 2026
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

        /* Badge (cascina) */
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
        .ms-band-lead strong { color: #ffffff; }
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

        /* Stare con gli altri */
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
        .ms-future-copy strong { color: #ffffff; }
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
