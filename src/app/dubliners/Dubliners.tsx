import { useEffect, useState } from "react";
import { SiteLink as Link } from "../site/nav";
import SiteFooter from "../site/SiteFooter";
import { PageBackdrop } from "../site/homeFx";
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
import "../home.css";
import "../approfondimento.css";

// ─────────────────────────────────────────────────────────────────────────────
// «Gente di Dublino» (Dubliners, James Joyce — 1914) — approfondimento in 3 minuti.
//
// Copertina, l'autore, il libro, i personaggi, la trama, il tema e perché conta,
// chiuso dalla celebre frase finale de «I morti». Le foto vivono in
// /images/dubliners/: se mancano, ogni cornice mostra un placeholder coerente.
//
// Veste .sb- come il resto del sito (wrapper .sb-home): nav sottile, hero a due
// colonne, sezioni e card dai token --sb-*. Tema chiaro/scuro NATIVO — prima
// questa pagina era Bootstrap Italia con una palette arancio scritta a mano nel
// TSX, e il chiaro glielo cuciva addosso styles/theme-auto.css. Gli stili sono
// in approfondimento.css, condivisi con /gattopardo (stesso impianto).
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, []);

  useEffect(() => {
    const prev = document.title;
    document.title = "Gente di Dublino · James Joyce — in 3 minuti";
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
        <section className="sb-hero" aria-labelledby="db-hero-title">
          <div className="sb-container">
            <div className="sb-hero-grid sb-bk-hero-grid">
              <div>
                <span className="sb-bk-badge" aria-hidden="true">
                  <BookOpen size={40} strokeWidth={1.6} />
                </span>
                <p className="sb-bk-eyebrow">Approfondimento · in 3 minuti</p>
                <h1 className="sb-hero-title" id="db-hero-title">Gente di Dublino</h1>
                <span className="sb-bk-rule" aria-hidden="true" />
                <p className="sb-bk-lead">«Dubliners» — James Joyce, 1914</p>
                <p className="sb-bk-note">
                  Quindici racconti da una città che non lascia andare nessuno.
                </p>
              </div>
              <div>
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
        <section className="sb-section" aria-labelledby="db-autore-h">
          <div className="sb-container">
            <div className="sb-bk-sechead">
              <span className="sb-bk-overline">01 — L'autore</span>
              <h2 id="db-autore-h">Chi è James Joyce</h2>
              <p className="sb-bk-prose">
                Scrittore irlandese (<strong>1882 — 1941</strong>), tra i più importanti — e più
                <strong> difficili</strong> — del Novecento: ha scritto libri complicatissimi, che molti
                trovano quasi incomprensibili. <strong>Gente di Dublino</strong> è la sua opera più
                <strong> accessibile</strong>: la porta d'ingresso al suo mondo.
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
        <section className="sb-section" aria-labelledby="db-libro-h">
          <div className="sb-container">
            <div className="sb-bk-sechead">
              <span className="sb-bk-overline">02 — Il libro</span>
              <h2 id="db-libro-h">Che cos'è «Gente di Dublino»</h2>
            </div>
            <div className="sb-bk-story">
              <div>
                <p className="sb-bk-prose sb-bk-prose--lead">
                  Non un romanzo, ma una <strong>raccolta di 15 storie brevi</strong>.
                </p>
                <p className="sb-bk-prose">
                  Non c'è una trama principale: ogni racconto è <strong>indipendente</strong> e si chiude in
                  poche pagine. Il filo che li tiene insieme è uno solo — tutti parlano di persone che vivono
                  a <strong>Dublino</strong>, la capitale d'Irlanda.
                </p>
                <p className="sb-bk-prose">
                  Joyce dispone i racconti come un viaggio nella vita: prima l'infanzia, poi l'adolescenza, la
                  maturità e infine la vita pubblica della città.
                </p>
                <div className="sb-bk-tag">
                  <span className="sb-bk-tag-ic" aria-hidden="true"><BookOpen size={22} /></span>
                  <span className="sb-bk-tag-text">
                    <span className="sb-bk-tag-name">Dubliners · 1914</span>
                    <span className="sb-bk-tag-sub">15 racconti, una sola città</span>
                  </span>
                </div>
              </div>
              <div className="sb-bk-story-art">
                <Shot
                  src="/images/dubliners/dublino.jpg"
                  alt="Le strade di Dublino, dove sono ambientati i racconti"
                  caption="Dublino, l'unica protagonista"
                  icon={<MapPin size={56} strokeWidth={1.5} />}
                />
              </div>
            </div>

            {/* Le quattro età in cui sono ordinati i racconti */}
            <div className="sb-bk-roles sb-bk-roles--spaced">
              {STAGES.map(({ Icon, label, note }) => (
                <div className="sb-bk-role" key={label}>
                  <span className="sb-bk-role-ic" aria-hidden="true"><Icon size={20} /></span>
                  <span className="sb-bk-role-label">{label}</span>
                  <span className="sb-bk-role-note">{note}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ④ I personaggi */}
        <section className="sb-section" aria-labelledby="db-personaggi-h">
          <div className="sb-container">
            <div className="sb-bk-sechead">
              <span className="sb-bk-overline">03 — I personaggi</span>
              <h2 id="db-personaggi-h">Gente comune, nessun eroe</h2>
              <p className="sb-bk-prose">
                Niente avventure spettacolari, niente eroi. I protagonisti sono persone
                <strong> normalissime</strong>: la gente che incroceresti per strada, presa nel mezzo di una
                giornata qualunque.
              </p>
            </div>
            <div className="sb-bk-chiprow">
              {PEOPLE.map((p) => (
                <span className="sb-chip" key={p}><Users size={14} aria-hidden="true" /> {p}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ⑤ Cosa succede */}
        <section className="sb-section" aria-labelledby="db-trama-h">
          <div className="sb-container">
            <div className="sb-bk-sechead">
              <span className="sb-bk-overline">04 — La trama</span>
              <h2 id="db-trama-h">Cosa succede? Quasi niente</h2>
              <p className="sb-bk-prose">
                E qui sta il punto. Non succede granché: le cose <strong>non cambiano</strong>, i personaggi
                restano fermi dove sono.
              </p>
            </div>
            <div className="sb-bk-roles sb-bk-roles--3">
              {PLOTS.map(({ Icon, label, note }) => (
                <div className="sb-bk-role" key={label}>
                  <span className="sb-bk-role-ic" aria-hidden="true"><Icon size={20} /></span>
                  <span className="sb-bk-role-label">{label}</span>
                  <span className="sb-bk-role-note">{note}</span>
                </div>
              ))}
            </div>
            <div className="sb-bk-callout">
              <span className="sb-bk-callout-ic" aria-hidden="true"><Sparkles size={20} /></span>
              <p>
                Ogni racconto sembra avviarsi verso un cambiamento — e poi si spegne. Joyce chiama questi
                attimi <strong>«epifanie»</strong>: un piccolo lampo in cui il personaggio capisce la propria
                condizione… ma non riesce comunque a cambiarla. <strong>Fine.</strong>
              </p>
            </div>
          </div>
        </section>

        {/* ⑥ Il vero tema */}
        <section className="sb-section" aria-labelledby="db-tema-h">
          <div className="sb-container">
            <div className="sb-bk-sechead">
              <span className="sb-bk-overline">05 — Il tema</span>
              <h2 id="db-tema-h">Una parola: intrappolati</h2>
              <p className="sb-bk-prose">
                Sotto la superficie, tutti i personaggi hanno la stessa cosa in comune: sono
                <strong> prigionieri</strong>. Vorrebbero un'altra vita, ma qualcosa li trattiene — e nessuno
                riesce davvero a scappare o a cambiare.
              </p>
            </div>
            <div className="sb-bk-cards sb-bk-cards--4">
              {TRAPS.map(({ Icon, title, desc }) => (
                <article className="sb-panel sb-panel--hover" key={title}>
                  <div className="sb-panel-inner sb-bk-card">
                    <span className="sb-bk-card-ic" aria-hidden="true"><Icon size={24} /></span>
                    <h3 className="sb-bk-card-title">{title}</h3>
                    <p className="sb-bk-card-desc">{desc}</p>
                  </div>
                </article>
              ))}
            </div>
            <p className="sb-bk-footline">
              <Lock size={16} aria-hidden="true" />
              <span>La parola che Joyce stesso usa per Dublino è una sola: <strong>«paralisi»</strong>.</span>
            </p>
          </div>
        </section>

        {/* ⑦ Perché è importante */}
        <section className="sb-section" aria-labelledby="db-conta-h">
          <div className="sb-container">
            <div className="sb-bk-story">
              <div className="sb-bk-story-art">
                <Shot
                  src="/images/dubliners/dublino-2.jpg"
                  alt="Una via di Dublino di inizio Novecento"
                  caption="La vera Dublino, con i nomi veri"
                  icon={<Landmark size={56} strokeWidth={1.5} />}
                />
              </div>
              <div>
                <span className="sb-bk-overline">06 — Perché conta</span>
                <h2 className="sb-bk-h2" id="db-conta-h">Perché è un libro importante</h2>
                <p className="sb-bk-prose">
                  Joyce racconta tutto questo in modo <strong>realistico e crudo</strong>: senza moralismi,
                  senza dare lezioni, senza addolcire niente. Mostra la <strong>vera Dublino</strong> — con i
                  nomi veri delle strade, dei pub, dei quartieri — e lascia che siano i fatti a parlare.
                </p>
                <p className="sb-bk-prose">
                  È uno dei primi libri davvero <strong>moderni</strong> a fare così: guardare la gente comune
                  dritto in faccia, senza giudicarla. Per questo, più di un secolo dopo, parla ancora di noi.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ⑧ In una frase */}
        <section className="sb-section" aria-labelledby="db-sintesi-h">
          <div className="sb-container">
            <div className="sb-bk-sechead">
              <span className="sb-bk-overline">In sintesi</span>
              <h2 id="db-sintesi-h">La cosa principale</h2>
            </div>
            <p className="sb-bk-hl">
              Un libro sulla <strong>gente comune</strong> che soffre in silenzio, <strong>intrappolata</strong>
              in una città grigia.
            </p>
            <div className="sb-bk-chiprow">
              <span className="sb-chip"><BookText size={14} aria-hidden="true" /> Realismo crudo</span>
              <span className="sb-chip"><Eye size={14} aria-hidden="true" /> Nessun moralismo</span>
              <span className="sb-chip"><MapPin size={14} aria-hidden="true" /> La vera Dublino</span>
            </div>
          </div>
        </section>

        {/* ⑨ Chiusura — la celebre frase finale de «I morti» */}
        <section className="sb-bk-banner" aria-label="Citazione di chiusura">
          <img
            src="/images/dubliners/neve.jpg"
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
                La neve cadeva lieve su tutto il paese
                <span>su tutti i vivi e su tutti i morti.</span>
              </h2>
              <p className="sb-bk-banner-sign">da «I morti» — l'ultimo dei quindici racconti</p>
            </div>
          </div>
        </section>

        {/* ⑩ Vai all'altro libro */}
        <section className="sb-section">
          <div className="sb-container">
            <Link to="/gattopardo" className="sb-bk-next">
              <div className="sb-panel sb-panel--hover">
                <div className="sb-panel-inner sb-bk-next-in">
                  <span className="sb-bk-next-eyebrow">
                    <Cat size={14} aria-hidden="true" /> Continua · l'altro approfondimento
                  </span>
                  <span className="sb-bk-next-row">
                    <span className="sb-bk-next-ic" aria-hidden="true"><Cat size={26} /></span>
                    <span className="sb-bk-next-text">
                      <span className="sb-bk-next-title">Il Gattopardo</span>
                      <span className="sb-bk-next-sub">
                        Tomasi di Lampedusa, 1958 — un principe siciliano guarda il suo mondo finire.
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
