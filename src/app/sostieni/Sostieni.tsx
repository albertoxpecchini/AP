import { useEffect, useState } from "react";
import { SiteLink as Link } from "../site/nav";
import {
  IcHeart, IcMail, IcArrowLeft, IcCheck, IcCopy, IcSend, IcLoader, IcCrown,
  IcGift, IcBook, IcAlert,
} from "../site/homeIcons";
import { EMAIL } from "../site/data";
import {
  submitDonatore, fetchDonatori, subscribeDonatori, donazioniConfigured,
  motivoRifiuto, type DonatoreRow,
} from "./donazioniApi";
import SiteFooter from "../site/SiteFooter";
import { PageBackdrop, SparkGroup } from "../site/homeFx";
import "../home.css";
import "./sostieni.css";

// ─────────────────────────────────────────────────────────────────────────────
// Sostieni / Donazioni — veste "piattaforma Supabase" della home (.sb-):
// nav sottile con briciola, hero sobrio, pannello dati-bonifico con righe
// copiabili, card-form per firma e sponsor, libro dei passaggi e CTA finale.
// Tono sobrio e umile: niente configuratore (si dona via bonifico, dalla
// propria banca), solo i dati per il bonifico, la firma del libro e gli sponsor.
// Tema chiaro/scuro nativo via token .sb- (vedi home.css + sostieni.css).
// ─────────────────────────────────────────────────────────────────────────────

const BANK = {
  beneficiario: "Alberto Pecchini",
  cf: "PCCLRT06H28E897M",
  iban: "IT81 F036 6901 6009 1991 7298 724",
  bic: "REVOITM2",
  bicCorrispondente: "CHASDEFX",
  banca: "Revolut Bank UAB — Via Dante 7, 20123 Milano (MI), Italy",
  email: EMAIL,
};

function timeAgo(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso).getTime();
  const s = Math.max(1, Math.floor((Date.now() - d) / 1000));
  if (s < 60) return "ora";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min fa`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h fa`;
  const g = Math.floor(h / 24);
  if (g < 30) return `${g} g fa`;
  return new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
}

// Riga copiabile per i dati del bonifico.
function CopyRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };
  return (
    <div className="sb-sos-row">
      <div className="sb-sos-rowtext">
        <span className="sb-sos-rowlabel">{label}</span>
        <span className={`sb-sos-rowvalue${mono ? " mono" : ""}`} translate="no">{value}</span>
      </div>
      <button
        type="button"
        className={`sb-btn sb-btn--sm sb-btn--secondary sb-sos-copy${copied ? " copied" : ""}`}
        onClick={copy}
        aria-label={`Copia ${label}`}
        title="Copia"
      >
        {copied ? <IcCheck size={14} /> : <IcCopy size={14} />}
        <span>{copied ? "Copiato" : "Copia"}</span>
      </button>
    </div>
  );
}

export default function Sostieni() {
  const [nome, setNome] = useState("");
  const [messaggio, setMessaggio] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  // Perché una firma è stata rifiutata (parolacce, link, campi vuoti). Il
  // filtro vero sta su /api/sponsor: questo lo anticipa e lo scrive sotto al
  // form, invece di aprire un alert() che non dice niente a nessuno.
  const [erroreFirma, setErroreFirma] = useState<string | null>(null);
  const [erroreSponsor, setErroreSponsor] = useState<string | null>(null);

  const [spName, setSpName] = useState("");
  const [spLink, setSpLink] = useState("");
  const [spMsg, setSpMsg] = useState("");

  const [book, setBook] = useState<DonatoreRow[]>([]);
  const [loadingBook, setLoadingBook] = useState(true);

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const prev = document.title;
    document.title = "Sostieni — Alberto Pecchini";
    return () => { document.title = prev; };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let alive = true;
    fetchDonatori()
      .then((rows) => { if (alive) setBook(rows); })
      .catch(() => {})
      .finally(() => { if (alive) setLoadingBook(false); });
    const unsub = subscribeDonatori((row) => {
      setBook((prev) => (prev.some((r) => r.id === row.id) ? prev : [row, ...prev]));
    });
    return () => { alive = false; unsub(); };
  }, []);

  const donatori = book.filter((r) => r.tipo === "donatore");
  const sponsor = book.filter((r) => r.tipo === "sponsor");
  const causale = `Donazione${nome.trim() ? ` — ${nome.trim()}` : ""}`;

  const signBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || sending) return;
    const motivo = motivoRifiuto(nome, messaggio);
    if (motivo) { setErroreFirma(motivo); return; }
    setErroreFirma(null);
    setSending(true);
    try {
      const saved = await submitDonatore({
        nome,
        tipo: "donatore",
        messaggio: messaggio.trim() || null,
      });
      setBook((prev) => (prev.some((r) => r.id === saved.id) ? prev : [saved, ...prev]));
      setDone(true);
      setMessaggio("");
      setTimeout(() => setDone(false), 4000);
    } catch (err) {
      console.error("[sostieni] firma fallita", err);
      // Se il server ha detto perché (filtro, rate-limit), si mostra la sua
      // frase: è già scritta per essere letta da chi ha compilato.
      const detto = err instanceof Error ? err.message : "";
      setErroreFirma(
        detto && !detto.startsWith("submitDonatore")
          ? detto
          : "Non sono riuscito a registrare la firma. Riprova tra poco.",
      );
    } finally {
      setSending(false);
    }
  };

  const sponsorMessage = () => {
    const lines = [
      "Ciao Alberto, mi piacerebbe comparire tra gli sponsor del sito (4,99€).",
      `• Nome / Brand: ${spName.trim() || "—"}`,
      `• Link: ${spLink.trim() || "—"}`,
    ];
    if (spMsg.trim()) lines.push(`• Messaggio: ${spMsg.trim()}`);
    return lines.join("\n");
  };

  const proceedSponsor = async () => {
    // Stesso filtro della firma: qui però il testo finisce anche dentro
    // un'email che parte a nome di chi compila, quindi si controlla PRIMA di
    // aprire il client di posta.
    const motivo = motivoRifiuto(spName, spMsg);
    if (motivo) { setErroreSponsor(motivo); return; }
    setErroreSponsor(null);
    try {
      const saved = await submitDonatore({
        nome: spName,
        tipo: "sponsor",
        importo: "4,99",
        messaggio: spMsg.trim() || null,
        link: spLink.trim() || null,
      });
      setBook((prev) => (prev.some((r) => r.id === saved.id) ? prev : [saved, ...prev]));
    } catch (err) {
      console.error("[sostieni] sponsor non registrato", err);
    }

    const text = sponsorMessage();
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent("Sponsor del sito (4,99€)")}&body=${encodeURIComponent(text)}`;
  };

  return (
    <div className="sb-home sb-home--fx sos-page" data-acc="rosso">
      <PageBackdrop />
      {/* Skiplink — requisito di accessibilità (come la home) */}
      <div className="skiplinks">
        <a className="visually-hidden-focusable" href="#main-content">Vai al contenuto principale</a>
      </div>

      {/* ── Nav sottile: briciola Home / Sostieni ── */}
      <header className={`sb-nav ${scrolled ? "sb-nav--scrolled" : ""}`}>
        <div className="sb-container sb-nav-inner">
          <Link to="/" className="sb-sos-back" aria-label="Torna alla home">
            <IcArrowLeft size={16} />
            <span>Home</span>
          </Link>
          <span className="sb-sos-crumb" aria-hidden="true">/</span>
          <span className="sb-sos-title"><IcHeart size={16} /> Sostieni</span>
          <div className="sb-nav-right">
            <a href={`mailto:${EMAIL}`} className="sb-btn sb-btn--sm sb-btn--secondary sb-btn--keep">
              <IcMail size={15} /> Email
            </a>
          </div>
        </div>
      </header>

      <main id="main-content">
        {/* ── Hero — sobrio ── */}
        <section className="sb-sos-hero">
          <div className="sb-container">
            <p className="sb-sos-eyebrow">Una piccola pagina</p>
            <h1 className="sb-sos-h1">Se ti va, puoi sostenermi.</h1>
            <p className="sb-sos-lead">
              Se qualcosa che ho fatto ti è stato utile e hai piacere di darmi una mano, puoi
              farlo con un bonifico — l'importo e la frequenza li decidi tu, dalla tua banca.
              Nessun obbligo, nessuna pressione. Grazie comunque per essere passato di qui.
            </p>
          </div>
        </section>

        {/* ── Dati per il bonifico ── */}
        <section className="sb-section" aria-label="Bonifico bancario">
          <div className="sb-container">
            <div className="sb-sos-grid">
              <div>
                <div className="sb-sos-headrow">
                  <h3 className="sb-stack-title">Bonifico bancario</h3>
                  <span className="sb-sos-tag">Solo per bonifico</span>
                </div>
                <p className="sb-sos-sub">
                  Questi dati servono esclusivamente per il bonifico. Copia ciò che ti serve
                  e procedi dalla tua banca, con l'importo che preferisci.
                </p>
              </div>

              <div className="sb-panel">
                <div className="sb-panel-inner">
                  <div className="sb-sos-bank">
                    <CopyRow label="Beneficiario" value={BANK.beneficiario} />
                    <CopyRow label="IBAN" value={BANK.iban} mono />
                    <CopyRow label="BIC / SWIFT" value={BANK.bic} mono />
                    <CopyRow label="Banca corrispondente (BIC)" value={BANK.bicCorrispondente} mono />
                    <CopyRow label="Codice fiscale" value={BANK.cf} mono />
                    <CopyRow label="Banca" value={BANK.banca} />
                    <CopyRow label="Causale (facoltativa)" value={causale} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Firma il libro + Sponsor ── */}
        <section className="sb-section" aria-label="Libro dei donatori">
          <div className="sb-container">
            <div className="sb-sos-cards">
              {/* Libro dei donatori */}
              <div className="sb-panel">
                <div className="sb-panel-inner sb-sos-card-inner">
                  <div className="sb-sos-card-title">
                    <IcBook size={18} />
                    <h3>Libro dei donatori</h3>
                  </div>
                  <p className="sb-sos-sub">
                    Se vuoi lasciare un segno del tuo passaggio, firma qui. È facoltativo.
                  </p>
                  {done ? (
                    <div className="sb-sos-thanks">
                      <IcHeart size={20} />
                      <div>
                        <strong>Grazie.</strong>
                        <p>La tua firma è nel libro.</p>
                      </div>
                    </div>
                  ) : (
                    <form className="sb-sos-form" onSubmit={signBook}>
                      <div className="sb-sos-field">
                        <label htmlFor="sos-nome">Il tuo nome</label>
                        <input id="sos-nome" type="text" maxLength={40} placeholder="Es. Mario R."
                          value={nome}
                          onChange={(e) => { setNome(e.target.value); setErroreFirma(null); }} required />
                      </div>
                      <div className="sb-sos-field">
                        <label htmlFor="sos-msg">Due parole (facoltative)</label>
                        <textarea id="sos-msg" maxLength={280} rows={2} placeholder="Un saluto…"
                          value={messaggio}
                          onChange={(e) => { setMessaggio(e.target.value); setErroreFirma(null); }} />
                      </div>
                      {erroreFirma && (
                        <p className="sb-sos-alert" role="alert">
                          <IcAlert size={16} />
                          <span>{erroreFirma}</span>
                        </p>
                      )}
                      <div className="sb-sos-actions">
                        <button type="submit" className="sb-btn sb-btn--primary" disabled={!nome.trim() || sending}>
                          {sending
                            ? <IcLoader size={15} className="sb-sos-spin" />
                            : <IcSend size={15} />}
                          {sending ? "Firmo…" : "Firma il libro"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* Sponsor */}
              <div className="sb-panel">
                <div className="sb-panel-inner sb-sos-card-inner">
                  <div className="sb-sos-card-title">
                    <IcCrown size={18} />
                    <h3>Sponsor</h3>
                    <span className="sb-sos-tag">4,99€</span>
                  </div>
                  <p className="sb-sos-sub">
                    Se hai un progetto o un'attività, puoi comparire tra gli sponsor con un piccolo
                    contributo. Lasciami i dati e ne parliamo con calma: ti scrivo io.
                  </p>
                  <div className="sb-sos-form">
                    <div className="sb-sos-field">
                      <label htmlFor="sos-spname">Nome / Brand</label>
                      <input id="sos-spname" type="text" maxLength={40} placeholder="La tua attività"
                        value={spName}
                        onChange={(e) => { setSpName(e.target.value); setErroreSponsor(null); }} />
                    </div>
                    <div className="sb-sos-field">
                      <label htmlFor="sos-splink">Link (sito o social)</label>
                      <input id="sos-splink" type="text" maxLength={200} placeholder="https://…"
                        value={spLink} onChange={(e) => setSpLink(e.target.value)} />
                    </div>
                    <div className="sb-sos-field">
                      <label htmlFor="sos-spmsg">Messaggio (facoltativo)</label>
                      <textarea id="sos-spmsg" maxLength={280} rows={2} placeholder="Cosa vorresti promuovere?"
                        value={spMsg}
                        onChange={(e) => { setSpMsg(e.target.value); setErroreSponsor(null); }} />
                    </div>
                    {erroreSponsor && (
                      <p className="sb-sos-alert" role="alert">
                        <IcAlert size={16} />
                        <span>{erroreSponsor}</span>
                      </p>
                    )}
                    <div className="sb-sos-actions">
                      <button type="button" className="sb-btn sb-btn--secondary" onClick={() => proceedSponsor()}>
                        <IcMail size={15} /> Scrivimi via email
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Libro: chi è passato di qui ── */}
        <section className="sb-section" aria-label="Chi è passato di qui">
          <div className="sb-container">
            <div className="sb-sechead">
              <h3>Chi è passato di qui</h3>
            </div>
            {!donazioniConfigured && (
              <p className="sb-sos-note">
                Anteprima locale: le firme restano su questo dispositivo finché il backend non è collegato.
              </p>
            )}

            {sponsor.length > 0 && (
              <>
                <h4 className="sb-sos-subhead"><IcCrown size={15} /> Sponsor</h4>
                <div className="sb-sos-sponsors">
                  {sponsor.map((s) => (
                    <span key={s.id ?? s.nome} className="sb-chip">
                      <IcCrown size={14} />
                      {s.link
                        ? <a href={s.link} target="_blank" rel="noreferrer noopener" translate="no">{s.nome}</a>
                        : <span translate="no">{s.nome}</span>}
                    </span>
                  ))}
                </div>
              </>
            )}

            <h4 className="sb-sos-subhead"><IcGift size={15} /> Donatori</h4>
            {loadingBook ? (
              <p className="sb-sos-empty"><IcLoader size={15} className="sb-sos-spin" /> Carico…</p>
            ) : donatori.length === 0 ? (
              <p className="sb-sos-empty">Ancora nessuna firma.</p>
            ) : (
              <ul className="sb-sos-list">
                {donatori.map((d) => (
                  <li key={d.id ?? `${d.nome}-${d.created_at}`}>
                    <div className="sb-panel">
                      <div className="sb-panel-inner sb-sos-item-inner">
                        <div className="sb-sos-avatar" aria-hidden="true" translate="no">{d.nome.charAt(0).toUpperCase()}</div>
                        <div className="sb-sos-item-body">
                          <div className="sb-sos-item-top">
                            <span className="sb-sos-item-name" translate="no">{d.nome}</span>
                            <span className="sb-sos-item-time">{timeAgo(d.created_at)}</span>
                          </div>
                          {d.messaggio && <p className="sb-sos-item-msg">“{d.messaggio}”</p>}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* ── CTA finale / contatti ── */}
        <section className="sb-section sb-cta">
          <div className="sb-container">
            <h2>Per qualsiasi cosa, sono qui.</h2>
            <SparkGroup className="sb-cta-actions">
              <a href={`mailto:${EMAIL}`} className="sb-btn sb-btn--primary">
                <IcMail size={16} /> Email
              </a>
            </SparkGroup>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
