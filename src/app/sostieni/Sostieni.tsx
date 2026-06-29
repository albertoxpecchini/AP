import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Heart, Copy, Check, Send, Loader2, Crown, Mail, ArrowLeft,
  Landmark, Gift, MessageCircle,
} from "lucide-react";
import { EMAIL, WHATSAPP_HREF, WhatsAppIcon } from "../site/data";
import {
  submitDonatore, fetchDonatori, subscribeDonatori, donazioniConfigured,
  type DonatoreRow,
} from "./donazioniApi";

// ─────────────────────────────────────────────────────────────────────────────
// Sostieni / Donazioni — veste "finestre che galleggiano" su sfondo vivo.
// Tono sobrio e umile: niente configuratore (si dona via bonifico, dalla propria
// banca), solo i dati per il bonifico, la firma del libro e gli sponsor.
// Palette = stesse variabili della home (.hm-page); tema chiaro/scuro in fondo.
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
    <div className="sos-bankrow">
      <div className="sos-bankrow-text">
        <span className="sos-bankrow-label">{label}</span>
        <span className={`sos-bankrow-value${mono ? " sos-mono" : ""}`}>{value}</span>
      </div>
      <button type="button" className="sos-copy" onClick={copy} aria-label={`Copia ${label}`} title="Copia">
        {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
        <span>{copied ? "Copiato" : "Copia"}</span>
      </button>
    </div>
  );
}

// Finestra che galleggia: barra del titolo + corpo. `align` la sposta a sx/dx,
// `i` regola la fase del galleggiamento così non ondeggiano all'unisono.
function Win({
  title, children, align = "center", i = 0, tag,
}: {
  title: string;
  children: React.ReactNode;
  align?: "left" | "right" | "center" | "wide";
  i?: number;
  tag?: string;
}) {
  return (
    <section className={`sos-win sos-win--${align}`} style={{ animationDelay: `${i * -2.3}s` }}>
      <div className="sos-win-bar">
        <span className="sos-win-title">{title}</span>
        {tag && <span className="sos-win-tag">{tag}</span>}
        <span className="sos-win-ctrls" aria-hidden="true"><i /><i /><i /></span>
      </div>
      <div className="sos-win-body">{children}</div>
    </section>
  );
}

export default function Sostieni() {
  const [nome, setNome] = useState("");
  const [messaggio, setMessaggio] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const [spName, setSpName] = useState("");
  const [spLink, setSpLink] = useState("");
  const [spMsg, setSpMsg] = useState("");

  const [book, setBook] = useState<DonatoreRow[]>([]);
  const [loadingBook, setLoadingBook] = useState(true);

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
      alert("Non sono riuscito a registrare la firma. Riprova tra poco.");
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

  const proceedSponsor = async (channel: "whatsapp" | "email") => {
    if (!spName.trim()) {
      alert("Inserisci almeno il nome o il brand.");
      return;
    }
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
    if (channel === "whatsapp") {
      window.open(`${WHATSAPP_HREF}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent("Sponsor del sito (4,99€)")}&body=${encodeURIComponent(text)}`;
    }
  };

  return (
    <div className="it-page-wrapper sos-page">
      {/* ── Sfondo vivo: aurore + finestre fantasma che galleggiano ── */}
      <div className="sos-bg" aria-hidden="true">
        <span className="sos-aurora sos-aurora--1" />
        <span className="sos-aurora sos-aurora--2" />
        <span className="sos-aurora sos-aurora--3" />
        {[0, 1, 2, 3, 4].map((n) => (
          <span key={n} className={`sos-ghost sos-ghost--${n}`}>
            <span className="sos-ghost-bar"><i /><i /><i /></span>
          </span>
        ))}
      </div>

      {/* ── Header ── */}
      <header className="sos-hdr">
        <div className="sos-wrap sos-hdr-inner">
          <Link to="/" className="sos-back" aria-label="Torna alla home">
            <ArrowLeft size={18} aria-hidden="true" />
            <span>Home</span>
          </Link>
          <span className="sos-hdr-title"><Heart size={15} aria-hidden="true" /> Sostieni</span>
        </div>
      </header>

      <main className="sos-main">
        {/* ── Hero — sobrio ── */}
        <section className="sos-hero">
          <div className="sos-wrap">
            <p className="sos-hero-eyebrow">Una piccola pagina</p>
            <h1 className="sos-h1">Se ti va,<br />puoi sostenermi.</h1>
            <p className="sos-lead">
              Se qualcosa che ho fatto ti è stato utile e hai piacere di darmi una mano, puoi
              farlo con un bonifico — l'importo e la frequenza li decidi tu, dalla tua banca.
              Nessun obbligo, nessuna pressione. Grazie comunque per essere passato di qui.
            </p>
          </div>
        </section>

        <div className="sos-canvas">
          {/* ── Dati per il bonifico ── */}
          <Win title="Bonifico bancario" tag="Solo per bonifico" align="left" i={0}>
            <p className="sos-win-sub">
              Questi dati servono <strong>esclusivamente per il bonifico</strong>. Copia ciò che
              ti serve e procedi dalla tua banca, con l'importo che preferisci.
            </p>
            <div className="sos-bank">
              <CopyRow label="Beneficiario" value={BANK.beneficiario} />
              <CopyRow label="IBAN" value={BANK.iban} mono />
              <CopyRow label="BIC / SWIFT" value={BANK.bic} mono />
              <CopyRow label="Banca corrispondente (BIC)" value={BANK.bicCorrispondente} mono />
              <CopyRow label="Codice fiscale" value={BANK.cf} mono />
              <CopyRow label="Banca" value={BANK.banca} />
              <CopyRow label="Causale (facoltativa)" value={causale} />
            </div>
          </Win>

          {/* ── Firma il libro ── */}
          <Win title="Libro dei donatori" align="right" i={1}>
            <p className="sos-win-sub">
              Se vuoi lasciare un segno del tuo passaggio, firma qui. È facoltativo.
            </p>
            {done ? (
              <div className="sos-thanks">
                <Heart size={20} aria-hidden="true" />
                <div>
                  <strong>Grazie.</strong>
                  <p>La tua firma è nel libro.</p>
                </div>
              </div>
            ) : (
              <form className="sos-form" onSubmit={signBook}>
                <div className="sos-field">
                  <label htmlFor="sos-nome">Il tuo nome</label>
                  <input id="sos-nome" type="text" maxLength={40} placeholder="Es. Mario R."
                    value={nome} onChange={(e) => setNome(e.target.value)} required />
                </div>
                <div className="sos-field">
                  <label htmlFor="sos-msg">Due parole (facoltative)</label>
                  <textarea id="sos-msg" maxLength={280} rows={2} placeholder="Un saluto…"
                    value={messaggio} onChange={(e) => setMessaggio(e.target.value)} />
                </div>
                <button type="submit" className="sos-btn sos-btn--solid" disabled={!nome.trim() || sending}>
                  {sending ? <Loader2 size={17} className="sos-spin" aria-hidden="true" /> : <Send size={17} aria-hidden="true" />}
                  {sending ? "Firmo…" : "Firma il libro"}
                </button>
              </form>
            )}
          </Win>

          {/* ── Sponsor ── */}
          <Win title="Sponsor" tag="4,99€" align="left" i={2}>
            <p className="sos-win-sub">
              Se hai un progetto o un'attività, puoi comparire tra gli sponsor con un piccolo
              contributo. Lasciami i dati e ne parliamo con calma: ti scrivo io.
            </p>
            <div className="sos-form">
              <div className="sos-field">
                <label htmlFor="sos-spname">Nome / Brand</label>
                <input id="sos-spname" type="text" maxLength={40} placeholder="La tua attività"
                  value={spName} onChange={(e) => setSpName(e.target.value)} />
              </div>
              <div className="sos-field">
                <label htmlFor="sos-splink">Link (sito o social)</label>
                <input id="sos-splink" type="text" maxLength={200} placeholder="https://…"
                  value={spLink} onChange={(e) => setSpLink(e.target.value)} />
              </div>
              <div className="sos-field">
                <label htmlFor="sos-spmsg">Messaggio (facoltativo)</label>
                <textarea id="sos-spmsg" maxLength={280} rows={2} placeholder="Cosa vorresti promuovere?"
                  value={spMsg} onChange={(e) => setSpMsg(e.target.value)} />
              </div>
              <div className="sos-actions">
                <button type="button" className="sos-btn sos-btn--wa" onClick={() => proceedSponsor("whatsapp")}>
                  <WhatsAppIcon size={17} /> Scrivimi su WhatsApp
                </button>
                <button type="button" className="sos-btn sos-btn--ghost" onClick={() => proceedSponsor("email")}>
                  <Mail size={17} aria-hidden="true" /> Scrivimi via email
                </button>
              </div>
            </div>
          </Win>

          {/* ── Libro ── */}
          <Win title="Chi è passato di qui" align="wide" i={3}>
            {!donazioniConfigured && (
              <p className="sos-win-sub">
                Anteprima locale: le firme restano su questo dispositivo finché il backend non è collegato.
              </p>
            )}

            {sponsor.length > 0 && (
              <>
                <h3 className="sos-subhead"><Crown size={14} aria-hidden="true" /> Sponsor</h3>
                <div className="sos-sponsors">
                  {sponsor.map((s) => (
                    <div key={s.id ?? s.nome} className="sos-sponsor-chip">
                      <Crown size={13} aria-hidden="true" />
                      {s.link ? <a href={s.link} target="_blank" rel="noreferrer noopener">{s.nome}</a> : <span>{s.nome}</span>}
                    </div>
                  ))}
                </div>
              </>
            )}

            <h3 className="sos-subhead"><Gift size={14} aria-hidden="true" /> Donatori</h3>
            {loadingBook ? (
              <p className="sos-empty"><Loader2 size={15} className="sos-spin" aria-hidden="true" /> Carico…</p>
            ) : donatori.length === 0 ? (
              <p className="sos-empty">Ancora nessuna firma.</p>
            ) : (
              <ul className="sos-list">
                {donatori.map((d) => (
                  <li key={d.id ?? `${d.nome}-${d.created_at}`} className="sos-list-item">
                    <div className="sos-avatar" aria-hidden="true">{d.nome.charAt(0).toUpperCase()}</div>
                    <div className="sos-list-body">
                      <div className="sos-list-top">
                        <span className="sos-list-name">{d.nome}</span>
                        <span className="sos-list-time">{timeAgo(d.created_at)}</span>
                      </div>
                      {d.messaggio && <p className="sos-list-msg">“{d.messaggio}”</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Win>

          {/* ── Contatti ── */}
          <section className="sos-contact">
            <p>Per qualsiasi cosa, sono qui.</p>
            <div className="sos-actions sos-actions--center">
              <a className="sos-btn sos-btn--wa" href={WHATSAPP_HREF} target="_blank" rel="noreferrer noopener">
                <WhatsAppIcon size={17} /> WhatsApp
              </a>
              <a className="sos-btn sos-btn--ghost" href={`mailto:${EMAIL}`}>
                <Mail size={17} aria-hidden="true" /> Email
              </a>
            </div>
          </section>
        </div>
      </main>

      <footer className="sos-foot">
        <div className="sos-wrap sos-foot-inner">
          <MessageCircle size={14} aria-hidden="true" />
          <span>© {new Date().getFullYear()} Alberto Pecchini — grazie.</span>
        </div>
      </footer>

      <style>{`
        .sos-page {
          --accent: #8b7bff; --accent-deep: #5b4bd6;
          --ink: #c4a5ff; --glow: rgba(139, 123, 255, 0.45);
          --text: #e8eef4; --text-strong: #ffffff; --sub: #a7b2bd;
          --surface: rgba(255, 255, 255, 0.05);
          --surface-bd: rgba(255, 255, 255, 0.10);
          --vio-soft: rgba(139, 123, 255, 0.10);
          --vio-bd: rgba(139, 123, 255, 0.28);
          --field-bg: rgba(0, 0, 0, 0.25); --field-bd: rgba(255, 255, 255, 0.12);
          --win-bg: rgba(20, 24, 34, 0.62); --win-bar: rgba(255, 255, 255, 0.04);
          --card-shadow: rgba(0, 0, 0, 0.45);
          --gold: #f5b301; --gold-bd: rgba(245, 179, 1, 0.34); --gold-soft: rgba(245, 179, 1, 0.10);
          position: relative; min-height: 100vh; overflow-x: clip;
          font-family: "Titillium Web", Geneva, Tahoma, sans-serif;
          color: var(--text);
          background: linear-gradient(180deg, #0b0f14 0%, #090c10 100%);
          transition: background 0.4s ease, color 0.4s ease;
        }
        .sos-wrap { width: 100%; max-width: 920px; margin: 0 auto; padding-left: 1.4rem; padding-right: 1.4rem; }

        /* ── Sfondo vivo ── */
        .sos-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
        .sos-aurora { position: absolute; border-radius: 50%; filter: blur(90px); opacity: 0.5; will-change: transform; }
        .sos-aurora--1 { width: 46vw; height: 46vw; background: #6f5cff; top: -12vw; left: -8vw; animation: sos-drift1 26s ease-in-out infinite; }
        .sos-aurora--2 { width: 40vw; height: 40vw; background: #5b4bd6; bottom: -14vw; right: -10vw; opacity: 0.4; animation: sos-drift2 32s ease-in-out infinite; }
        .sos-aurora--3 { width: 30vw; height: 30vw; background: #9d7bff; top: 38%; left: 46%; opacity: 0.28; animation: sos-drift3 38s ease-in-out infinite; }
        @keyframes sos-drift1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(6vw, 5vw) scale(1.12); } }
        @keyframes sos-drift2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-5vw, -6vw) scale(1.1); } }
        @keyframes sos-drift3 { 0%,100% { transform: translate(-50%,-50%) scale(1); } 50% { transform: translate(-42%,-58%) scale(1.18); } }

        /* Finestre fantasma che galleggiano dietro al contenuto */
        .sos-ghost { position: absolute; border-radius: 14px; border: 1px solid var(--surface-bd); background: rgba(255,255,255,0.025); backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px); opacity: 0.5; will-change: transform; }
        .sos-ghost-bar { position: absolute; top: 8px; left: 10px; display: flex; gap: 5px; }
        .sos-ghost-bar i { width: 6px; height: 6px; border-radius: 50%; background: var(--surface-bd); display: block; }
        .sos-ghost--0 { width: 190px; height: 130px; top: 14%; left: 6%; animation: sos-float-a 17s ease-in-out infinite; }
        .sos-ghost--1 { width: 150px; height: 110px; top: 30%; right: 7%; animation: sos-float-b 21s ease-in-out infinite; }
        .sos-ghost--2 { width: 220px; height: 150px; top: 60%; left: 4%; animation: sos-float-b 24s ease-in-out infinite; }
        .sos-ghost--3 { width: 130px; height: 96px; top: 74%; right: 9%; animation: sos-float-a 19s ease-in-out infinite; }
        .sos-ghost--4 { width: 170px; height: 120px; top: 46%; left: 50%; animation: sos-float-a 27s ease-in-out infinite; opacity: 0.32; }
        @keyframes sos-float-a { 0%,100% { transform: translateY(0) rotate(-1.5deg); } 50% { transform: translateY(-26px) rotate(1.5deg); } }
        @keyframes sos-float-b { 0%,100% { transform: translateY(0) rotate(1.5deg); } 50% { transform: translateY(-22px) rotate(-2deg); } }

        /* ── Header ── */
        .sos-hdr { position: sticky; top: 0; z-index: 30; background: rgba(10, 13, 17, 0.7); backdrop-filter: blur(14px) saturate(140%); -webkit-backdrop-filter: blur(14px) saturate(140%); border-bottom: 1px solid var(--surface-bd); }
        .sos-hdr-inner { display: flex; align-items: center; justify-content: space-between; height: 62px; }
        .sos-back { display: inline-flex; align-items: center; gap: 0.4rem; color: var(--sub); text-decoration: none; font-weight: 700; font-size: 1rem; transition: color 0.15s; }
        .sos-back:hover { color: var(--text-strong); }
        .sos-hdr-title { display: inline-flex; align-items: center; gap: 0.4rem; color: var(--ink); font-weight: 800; }

        .sos-main { position: relative; z-index: 1; }

        /* ── Hero ── */
        .sos-hero { padding: clamp(3.5rem, 11vw, 8rem) 0 clamp(2.5rem, 7vw, 5rem); }
        .sos-hero-eyebrow { font-size: 0.9rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.22em; color: var(--ink); margin: 0 0 1.4rem; opacity: 0.85; }
        .sos-h1 { font-size: clamp(2.8rem, 9vw, 5.4rem); font-weight: 800; line-height: 1.02; letter-spacing: -0.03em; color: var(--text-strong); margin: 0 0 1.6rem; }
        .sos-lead { font-size: clamp(1.2rem, 2.2vw, 1.6rem); line-height: 1.62; color: var(--sub); margin: 0; max-width: 40rem; font-weight: 400; }

        /* ── Canvas con finestre sfalsate dx/sx ── */
        .sos-canvas { max-width: 1040px; margin: 0 auto; padding: 0 1.4rem clamp(3rem, 8vw, 6rem); display: flex; flex-direction: column; gap: clamp(2.4rem, 6vw, 4.5rem); }

        /* ── Finestra ── */
        .sos-win { position: relative; width: 100%; border-radius: 18px; border: 1px solid var(--surface-bd); background: var(--win-bg); backdrop-filter: blur(16px) saturate(140%); -webkit-backdrop-filter: blur(16px) saturate(140%); box-shadow: 0 28px 64px var(--card-shadow); overflow: hidden; animation: sos-bob 11s ease-in-out infinite; will-change: transform; }
        .sos-win--left  { max-width: 640px; margin-right: auto; }
        .sos-win--right { max-width: 600px; margin-left: auto; }
        .sos-win--center{ max-width: 640px; margin: 0 auto; }
        .sos-win--wide  { max-width: 880px; margin: 0 auto; }
        @keyframes sos-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }

        .sos-win-bar { display: flex; align-items: center; gap: 0.7rem; padding: 0.7rem 1.1rem; background: var(--win-bar); border-bottom: 1px solid var(--surface-bd); }
        .sos-win-title { font-weight: 800; color: var(--text-strong); font-size: 1.02rem; }
        .sos-win-tag { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink); background: var(--vio-soft); border: 1px solid var(--vio-bd); padding: 0.18rem 0.6rem; border-radius: 999px; }
        .sos-win-ctrls { margin-left: auto; display: flex; gap: 7px; }
        .sos-win-ctrls i { width: 11px; height: 11px; border-radius: 50%; background: var(--surface-bd); display: block; }
        .sos-win-body { padding: clamp(1.4rem, 3.5vw, 2.2rem); }
        .sos-win-sub { font-size: 1.08rem; line-height: 1.6; color: var(--sub); margin: 0 0 1.5rem; }
        .sos-win-sub strong { color: var(--text-strong); }

        /* Dati bonifico */
        .sos-bank { display: flex; flex-direction: column; gap: 0.6rem; }
        .sos-bankrow { display: flex; align-items: center; justify-content: space-between; gap: 0.9rem; background: var(--field-bg); border: 1px solid var(--surface-bd); border-radius: 13px; padding: 0.8rem 1rem; transition: border-color 0.15s; }
        .sos-bankrow:hover { border-color: var(--vio-bd); }
        .sos-bankrow-text { display: flex; flex-direction: column; gap: 0.2rem; min-width: 0; }
        .sos-bankrow-label { font-size: 0.74rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.07em; color: var(--ink); }
        .sos-bankrow-value { font-size: 1.05rem; color: var(--text-strong); font-weight: 600; word-break: break-word; }
        .sos-mono { font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; }
        .sos-copy { flex-shrink: 0; display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.5rem 0.85rem; border-radius: 10px; border: 1px solid var(--vio-bd); background: var(--vio-soft); color: var(--ink); font-weight: 700; font-size: 0.84rem; cursor: pointer; transition: all 0.15s; }
        .sos-copy:hover { color: var(--text-strong); border-color: var(--accent); }

        /* Form */
        .sos-form { display: flex; flex-direction: column; gap: 1rem; }
        .sos-field { display: flex; flex-direction: column; gap: 0.45rem; }
        .sos-field label { font-size: 0.92rem; font-weight: 700; color: var(--sub); }
        .sos-field input, .sos-field textarea { background: var(--field-bg); border: 1px solid var(--field-bd); border-radius: 12px; padding: 0.8rem 1rem; color: var(--text-strong); font-family: inherit; font-size: 1.08rem; outline: none; transition: border-color 0.15s, box-shadow 0.15s; resize: vertical; }
        .sos-field input:focus, .sos-field textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--vio-soft); }
        .sos-field input::placeholder, .sos-field textarea::placeholder { color: var(--sub); opacity: 0.65; }

        .sos-btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.85rem 1.5rem; border-radius: 12px; font-weight: 700; font-size: 1.02rem; border: 1.5px solid transparent; cursor: pointer; text-decoration: none; transition: transform 0.15s, box-shadow 0.15s, background 0.15s, border-color 0.15s, color 0.15s; }
        .sos-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .sos-btn--solid { background: linear-gradient(140deg, var(--accent) 0%, var(--accent-deep) 130%); color: #fff; box-shadow: 0 8px 22px var(--glow); align-self: flex-start; }
        .sos-btn--solid:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 12px 28px var(--glow); }
        .sos-btn--ghost { background: var(--vio-soft); color: var(--text); border-color: var(--vio-bd); }
        .sos-btn--ghost:hover { border-color: var(--accent); color: var(--text-strong); }
        .sos-btn--wa { background: #25d366; color: #06301a; box-shadow: 0 8px 22px rgba(37, 211, 102, 0.28); }
        .sos-btn--wa:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(37, 211, 102, 0.38); }
        .sos-actions { display: flex; flex-wrap: wrap; gap: 0.65rem; }
        .sos-actions .sos-btn { flex: 1 1 auto; }
        .sos-actions--center { justify-content: center; }

        .sos-thanks { display: flex; align-items: center; gap: 0.9rem; background: var(--vio-soft); border: 1px solid var(--vio-bd); border-radius: 14px; padding: 1.1rem 1.2rem; }
        .sos-thanks svg { color: var(--ink); flex-shrink: 0; }
        .sos-thanks strong { color: var(--text-strong); font-size: 1.15rem; }
        .sos-thanks p { margin: 0.2rem 0 0; color: var(--sub); font-size: 0.98rem; }

        /* Libro */
        .sos-subhead { display: flex; align-items: center; gap: 0.45rem; font-size: 0.82rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: var(--ink); margin: 1.6rem 0 0.8rem; }
        .sos-subhead:first-of-type { margin-top: 0.2rem; }
        .sos-sponsors { display: flex; flex-wrap: wrap; gap: 0.55rem; }
        .sos-sponsor-chip { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.5rem 0.95rem; border-radius: 999px; background: var(--gold-soft); border: 1px solid var(--gold-bd); font-weight: 700; font-size: 0.96rem; color: var(--text); }
        .sos-sponsor-chip svg { color: var(--gold); }
        .sos-sponsor-chip a { color: var(--text-strong); text-decoration: none; }
        .sos-sponsor-chip a:hover { text-decoration: underline; }

        .sos-empty { display: flex; align-items: center; gap: 0.5rem; color: var(--sub); font-size: 1.02rem; padding: 0.6rem 0; }
        .sos-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.65rem; }
        .sos-list-item { display: flex; gap: 0.85rem; background: var(--field-bg); border: 1px solid var(--surface-bd); border-radius: 14px; padding: 0.85rem 1rem; transition: border-color 0.15s; }
        .sos-list-item:hover { border-color: var(--vio-bd); }
        .sos-avatar { flex-shrink: 0; width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: linear-gradient(140deg, var(--accent) 0%, var(--accent-deep) 130%); color: #fff; font-weight: 800; font-size: 1.15rem; }
        .sos-list-body { min-width: 0; flex: 1; }
        .sos-list-top { display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem; }
        .sos-list-name { font-weight: 800; color: var(--text-strong); font-size: 1.05rem; }
        .sos-list-time { margin-left: auto; font-size: 0.82rem; color: var(--sub); }
        .sos-list-msg { margin: 0.4rem 0 0; color: var(--sub); font-size: 0.98rem; font-style: italic; }

        /* Contatti + footer */
        .sos-contact { text-align: center; padding: 1rem 0 0; }
        .sos-contact p { font-size: 1.1rem; color: var(--sub); margin: 0 0 1.1rem; }
        .sos-foot { position: relative; z-index: 1; border-top: 1px solid var(--surface-bd); padding: 1.6rem 0; margin-top: 2rem; }
        .sos-foot-inner { display: flex; align-items: center; justify-content: center; gap: 0.5rem; color: var(--sub); font-size: 0.92rem; }

        .sos-spin { animation: sos-spin 0.9s linear infinite; }
        @keyframes sos-spin { to { transform: rotate(360deg); } }

        @media (max-width: 600px) {
          .sos-win--left, .sos-win--right, .sos-win--center, .sos-win--wide { max-width: 100%; }
          .sos-bankrow { flex-direction: column; align-items: stretch; }
          .sos-copy { align-self: flex-end; }
          .sos-actions .sos-btn { flex: 1 1 100%; }
        }

        /* Rispetta chi preferisce meno movimento */
        @media (prefers-reduced-motion: reduce) {
          .sos-aurora, .sos-ghost, .sos-win, .sos-spin { animation: none !important; }
        }

        /* ═══ TEMA CHIARO ═══ */
        html[data-ap-theme="light"] .sos-page {
          --accent: #6d4bd6; --accent-deep: #4a2fb0;
          --ink: #5b34c9; --glow: rgba(109, 75, 214, 0.26);
          --text: #221838; --text-strong: #170d3a; --sub: #574a78;
          --surface: #ffffff; --surface-bd: rgba(109, 75, 214, 0.16);
          --vio-soft: rgba(109, 75, 214, 0.10); --vio-bd: rgba(109, 75, 214, 0.28);
          --field-bg: #f6f3fd; --field-bd: rgba(109, 75, 214, 0.20);
          --win-bg: rgba(255, 255, 255, 0.7); --win-bar: rgba(109, 75, 214, 0.05);
          --card-shadow: rgba(80, 60, 160, 0.14);
          --gold: #b9810a; --gold-bd: rgba(185, 129, 10, 0.32); --gold-soft: rgba(245, 179, 1, 0.14);
          background: linear-gradient(180deg, #ffffff 0%, #f5f2fd 100%);
        }
        html[data-ap-theme="light"] .sos-hdr { background: rgba(255, 255, 255, 0.82); }
        html[data-ap-theme="light"] .sos-aurora { opacity: 0.3; }
        html[data-ap-theme="light"] .sos-aurora--1 { background: #b3a4ff; }
        html[data-ap-theme="light"] .sos-aurora--2 { background: #c9bcff; }
        html[data-ap-theme="light"] .sos-aurora--3 { background: #d9ccff; }
        html[data-ap-theme="light"] .sos-ghost { background: rgba(109, 75, 214, 0.04); opacity: 0.6; }
      `}</style>
    </div>
  );
}
