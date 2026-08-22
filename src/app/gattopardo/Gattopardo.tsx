import { useEffect, useState } from "react";
import { SiteLink as Link } from "../site/nav";
import SiteFooter from "../site/SiteFooter";
import { PageBackdrop } from "../site/homeFx";
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
import "../home.css";
import "../approfondimento.css";

// ─────────────────────────────────────────────────────────────────────────────
// «Il Gattopardo» (Giuseppe Tomasi di Lampedusa — 1958) — approfondimento in 3'.
//
// Copertina, l'autore, il romanzo, i personaggi, cosa succede, il tema (la
// celebre frase di Tancredi), il finale, perché conta e chiusura con la frase
// del Principe sui Gattopardi e i Leoni. Le foto vivono in /images/gattopardo/:
// se mancano, ogni cornice mostra un placeholder coerente.
//
// Veste .sb- come il resto del sito (wrapper .sb-home): nav sottile, hero a due
// colonne, sezioni e card dai token --sb-*. Tema chiaro/scuro NATIVO — prima
// questa pagina era Bootstrap Italia con una palette arancio scritta a mano nel
// TSX, e il chiaro glielo cuciva addosso styles/theme-auto.css. Gli stili sono
// in approfondimento.css, condivisi con /dubliners (stesso impianto).
// ─────────────────────────────────────────────────────────────────────────────

// Cornice foto con fallback: se l'immagine manca mostra un placeholder, senza
// spezzare il layout. `focus` imposta l'object-position quando la foto è
// ritagliata in cover.
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
    <figure className={`sb-bk-shot${portrait ? " sb-bk-shot--portrait" : ""}`}>
      {failed ? (
        <div className="sb-bk-shot-ph" role="img" aria-label={alt}>
          <span className="sb-bk-shot-ph-ic" aria-hidden="true">{icon}</span>
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  useEffect(() => {
    const prev = document.title;
    document.title = "Il Gattopardo · Tomasi di Lampedusa — in 3 minuti";
    return () => { document.title = prev; };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="sb-home sb-home--fx sb-bk-page" data-acc="ambra">
      <PageBackdrop />
      <div className="skiplinks">
        <a className="visually-hidden-focusable" href="#main-content">Vai al contenuto principale</a>
      </div>

      {/* ── Nav sottile: brand + ritorno alla home ── */}
      <header className={`sb-nav ${scrolled ? "sb-nav--scrolled" : ""}`}>
        <div className="sb-container sb-nav-inner">
          <Link to="/" className="sb-nav-brand">
            <img src="/favicon.svg" alt="" width={28} height={28} />
            <span className="sb-nav-brand-name" translate="no">Alberto Pecchini</span>
            <span className="sb-bk-tagline">Approfondimento · in 3 minuti</span>
          </Link>
          <Link to="/" className="sb-btn sb-btn--sm sb-btn--secondary sb-bk-back">
            <ArrowLeft size={15} /> Torna alla home
          </Link>
        </div>
      </header>

      <main id="main-content">
        {/* ① Copertina */}
        <section className="sb-hero" aria-labelledby="gp-hero-title">
          <div className="sb-container">
            <div className="sb-hero-grid sb-bk-hero-grid">
              <div>
                <span className="sb-bk-badge" aria-hidden="true">
                  <BookOpen size={40} strokeWidth={1.6} />
                </span>
                <p className="sb-bk-eyebrow">Approfondimento · in 3 minuti</p>
                <h1 className="sb-hero-title" id="gp-hero-title">Il Gattopardo</h1>
                <span className="sb-bk-rule" aria-hidden="true" />
                <p className="sb-bk-lead">«Il Gattopardo» — Tomasi di Lampedusa, 1958</p>
                <p className="sb-bk-note">
                  Un principe siciliano guarda il suo mondo finire — e capisce che deve cambiare.
                </p>
              </div>
              <div>
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
        <section className="sb-section" aria-labelledby="gp-autore-h">
          <div className="sb-container">
            <div className="sb-bk-sechead">
              <span className="sb-bk-overline">01 — L'autore</span>
              <h2 id="gp-autore-h">Chi è Tomasi di Lampedusa</h2>
              <p className="sb-bk-prose">
                Scrittore siciliano (<strong>1896 — 1957</strong>). In tutta la vita ha scritto
                <strong> un solo romanzo</strong>: questo. È diventato famoso soltanto
                <strong> dopo la morte</strong>, quando il libro uscì postumo e divenne un classico.
              </p>
            </div>
            <div className="sb-bk-about">
              <div className="sb-bk-facts">
                {FACTS.map(({ Icon, value, label }) => (
                  <div className="sb-bk-fact" key={value}>
                    <span className="sb-bk-fact-ic" aria-hidden="true"><Icon size={22} /></span>
                    <span className="sb-bk-fact-value">{value}</span>
                    <span className="sb-bk-fact-label">{label}</span>
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
        <section className="sb-section" aria-labelledby="gp-romanzo-h">
          <div className="sb-container">
            <div className="sb-bk-sechead">
              <span className="sb-bk-overline">02 — Il romanzo</span>
              <h2 id="gp-romanzo-h">Che cos'è «Il Gattopardo»</h2>
            </div>
            <div className="sb-bk-story">
              <div>
                <p className="sb-bk-prose sb-bk-prose--lead">
                  Un <strong>romanzo storico</strong> ambientato in Sicilia nel <strong>1860</strong>, quando
                  l'Italia si unisce.
                </p>
                <p className="sb-bk-prose">
                  Racconta la storia di una <strong>famiglia nobile</strong> — i Salina — che vede il proprio
                  mondo andare in frantumi: un'intera epoca, quella feudale e aristocratica, che si avvia al
                  tramonto sotto i loro occhi.
                </p>
                <div className="sb-bk-tag">
                  <span className="sb-bk-tag-ic" aria-hidden="true"><Library size={22} /></span>
                  <span className="sb-bk-tag-text">
                    <span className="sb-bk-tag-name">Il Gattopardo · 1958</span>
                    <span className="sb-bk-tag-sub">Romanzo storico · Sicilia, 1860</span>
                  </span>
                </div>
              </div>
              <div className="sb-bk-story-art">
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
        <section className="sb-section" aria-labelledby="gp-personaggi-h">
          <div className="sb-container">
            <div className="sb-bk-sechead">
              <span className="sb-bk-overline">03 — I personaggi</span>
              <h2 id="gp-personaggi-h">Chi muove la storia</h2>
              <p className="sb-bk-prose">
                Pochi protagonisti, ma chiarissimi: un patriarca che vede la fine, un giovane che cavalca il
                nuovo, e un'intera casata che gli ruota attorno.
              </p>
            </div>
            <div className="sb-bk-roles sb-bk-roles--3">
              {PEOPLE.map(({ Icon, label, note }) => (
                <div className="sb-bk-role" key={label}>
                  <span className="sb-bk-role-ic" aria-hidden="true"><Icon size={20} /></span>
                  <span className="sb-bk-role-label">{label}</span>
                  <span className="sb-bk-role-note">{note}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ⑤ Cosa succede */}
        <section className="sb-section" aria-labelledby="gp-trama-h">
          <div className="sb-container">
            <div className="sb-bk-sechead">
              <span className="sb-bk-overline">04 — La trama</span>
              <h2 id="gp-trama-h">Cosa succede</h2>
              <p className="sb-bk-prose">
                Fuori dal palazzo, la Storia corre: l'Italia si unifica, il vecchio ordine feudale crolla e i
                nobili perdono potere, soldi e influenza.
              </p>
            </div>
            <div className="sb-bk-roles">
              {EVENTS.map(({ Icon, label, note }) => (
                <div className="sb-bk-role" key={label}>
                  <span className="sb-bk-role-ic" aria-hidden="true"><Icon size={20} /></span>
                  <span className="sb-bk-role-label">{label}</span>
                  <span className="sb-bk-role-note">{note}</span>
                </div>
              ))}
            </div>
            <div className="sb-bk-callout">
              <span className="sb-bk-callout-ic" aria-hidden="true"><Heart size={20} /></span>
              <p>
                Il Principe capisce che, per sopravvivere, la famiglia deve <strong>adattarsi</strong>: così
                Tancredi sposa <strong>Angelica</strong>, la bellissima figlia del sindaco — ricco, ma
                <strong> borghese</strong>. <Church size={15} aria-hidden="true" /> La Chiesa perde
                influenza, il denaro cambia mani: tutto si trasforma.
              </p>
            </div>
          </div>
        </section>

        {/* ⑥ Il vero tema — la frase di Tancredi */}
        <section className="sb-section" aria-labelledby="gp-tema-h">
          <div className="sb-container">
            <div className="sb-bk-sechead">
              <span className="sb-bk-overline">05 — Il tema</span>
              <h2 id="gp-tema-h">Una frase che spiega tutto</h2>
            </div>
            <blockquote className="sb-bk-quote">
              «Se vogliamo che tutto rimanga come è, bisogna che tutto cambi.»
              <span>— Tancredi, al Principe</span>
            </blockquote>
            <p className="sb-bk-prose sb-bk-prose--wide">
              Il Principe sa di non poter fermare la Storia. La scelta è una sola: <strong>o ti adatti e
              sopravvivi, o muori</strong>. Non c'è una terza via — ed è proprio cambiando qualcosa che si
              riesce a conservare il resto.
            </p>
          </div>
        </section>

        {/* ⑦ Il finale */}
        <section className="sb-section" aria-labelledby="gp-finale-h">
          <div className="sb-container">
            <div className="sb-bk-story">
              <div className="sb-bk-story-art">
                <Shot
                  src="/images/gattopardo/finale.jpg"
                  alt="Un tramonto sulla Sicilia: la fine di un'epoca"
                  caption="La fine di un'epoca"
                  icon={<Sunset size={56} strokeWidth={1.5} />}
                />
              </div>
              <div>
                <span className="sb-bk-overline">Il finale</span>
                <h2 className="sb-bk-h2" id="gp-finale-h">Come va a finire</h2>
                <p className="sb-bk-prose sb-bk-prose--lead">Il Principe muore.</p>
                <p className="sb-bk-prose">
                  La famiglia continua, ma <strong>non è più quella di prima</strong>. La Sicilia è ormai
                  trasformata: un mondo intero si è chiuso alle spalle dei Salina, per sempre.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ⑧ Perché è importante */}
        <section className="sb-section" aria-labelledby="gp-conta-h">
          <div className="sb-container">
            <div className="sb-bk-sechead">
              <span className="sb-bk-overline">06 — Perché conta</span>
              <h2 id="gp-conta-h">Perché è un libro importante</h2>
              <p className="sb-bk-prose">
                Racconta il <strong>Risorgimento</strong> da un punto di vista insolito: quello dei
                <strong> perdenti</strong>, l'aristocrazia che esce di scena. È scritto in modo
                <strong> bellissimo e poetico</strong>, con una prosa raffinata. E mostra una verità
                spietata: la <strong>Storia travolge tutti</strong>, anche i più intelligenti e consapevoli.
              </p>
            </div>
            <div className="sb-bk-chiprow">
              {WHY.map((w) => (
                <span className="sb-chip" key={w}>{w}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ⑨ In sintesi */}
        <section className="sb-section" aria-labelledby="gp-sintesi-h">
          <div className="sb-container">
            <div className="sb-bk-sechead">
              <span className="sb-bk-overline">In sintesi</span>
              <h2 id="gp-sintesi-h">La cosa principale</h2>
            </div>
            <p className="sb-bk-hl">
              Un <strong>aristocratico siciliano</strong> assiste al crollo del suo mondo (1860, l'Unità
              d'Italia) e capisce che deve <strong>accettare il cambiamento</strong> per non morire.
            </p>
            <div className="sb-bk-chiprow">
              <span className="sb-chip"><Crown size={14} aria-hidden="true" /> L'aristocrazia al tramonto</span>
              <span className="sb-chip"><Flag size={14} aria-hidden="true" /> Il Risorgimento</span>
              <span className="sb-chip"><Feather size={14} aria-hidden="true" /> Prosa poetica</span>
            </div>
          </div>
        </section>

        {/* ⑩ Chiusura — la celebre frase del Principe */}
        <section className="sb-bk-banner" aria-label="Citazione di chiusura">
          <img
            src="/images/gattopardo/chiusura.jpg"
            alt=""
            aria-hidden="true"
            loading="lazy"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
          <div className="sb-bk-banner-scrim" aria-hidden="true" />
          <div className="sb-bk-banner-in">
            <div className="sb-container">
              <Quote size={36} className="sb-bk-banner-q" aria-hidden="true" />
              <h2 className="sb-bk-banner-title">
                Noi fummo i Gattopardi, i Leoni
                <span>quelli che ci sostituiranno saranno gli sciacalletti, le iene.</span>
              </h2>
              <p className="sb-bk-banner-sign">— il Principe Fabrizio Salina</p>
            </div>
          </div>
        </section>

        {/* ⑪ Vai all'altro libro */}
        <section className="sb-section">
          <div className="sb-container">
            <Link to="/dubliners" className="sb-bk-next">
              <div className="sb-panel sb-panel--hover">
                <div className="sb-panel-inner sb-bk-next-in">
                  <span className="sb-bk-next-eyebrow">
                    <BookOpen size={14} aria-hidden="true" /> Continua · l'altro approfondimento
                  </span>
                  <span className="sb-bk-next-row">
                    <span className="sb-bk-next-ic" aria-hidden="true"><BookOpen size={26} /></span>
                    <span className="sb-bk-next-text">
                      <span className="sb-bk-next-title">Gente di Dublino</span>
                      <span className="sb-bk-next-sub">
                        James Joyce, 1914 — quindici racconti da una città che non lascia andare nessuno.
                      </span>
                    </span>
                    <ArrowRight size={22} className="sb-bk-next-arrow" aria-hidden="true" />
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
