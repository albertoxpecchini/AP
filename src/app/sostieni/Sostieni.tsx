import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  Heart, Copy, Check, Send, Loader2, Crown, Mail, ArrowLeft,
  Landmark, Repeat, Gift, Sparkles, MessageCircle,
} from "lucide-react";
import { EMAIL, WHATSAPP_HREF, WhatsAppIcon } from "../site/data";
import {
  submitDonatore, fetchDonatori, subscribeDonatori, donazioniConfigured,
  type DonatoreRow, type Frequenza,
} from "./donazioniApi";

// ─────────────────────────────────────────────────────────────────────────────
// Sostieni / Donazioni — zona donazioni in stile "dark premium" (lo stesso della
// home, di /me-stesso, /trivia…): fondo scuro, superfici "vetro", accento viola.
// Tre modalità (una tantum / settimanale / mensile), importo libero, dati per il
// bonifico copiabili, libro dei donatori e sponsor live (Supabase) e flusso
// sponsor (€4,99) che prosegue su WhatsApp o email.
// Pagina autosufficiente: header/footer/stile inline qui dentro.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Dati per il bonifico ────────────────────────────────────────────────────
const BANK = {
  beneficiario: "Alberto Pecchini",
  cf: "PCCLRT06H28E897M",
  iban: "IT81 F036 6901 6009 1991 7298 724",
  bic: "REVOITM2",
  bicCorrispondente: "CHASDEFX",
  banca: "Revolut Bank UAB — Via Dante 7, 20123 Milano (MI), Italy",
  email: EMAIL,
};

const FREQS: { id: Frequenza; label: string; hint: string; emoji: string }[] = [
  { id: "tantum",      label: "Una tantum",  hint: "Un singolo contributo, quando vuoi tu.", emoji: "💖" },
  { id: "settimanale", label: "Settimanale", hint: "Un piccolo aiuto costante, ogni settimana.", emoji: "🗓️" },
  { id: "mensile",     label: "Mensile",     hint: "Un sostegno regolare, una volta al mese.", emoji: "📅" },
];

const PRESETS = ["5", "10", "25", "50"];

const freqLabel = (f: Frequenza) => FREQS.find((x) => x.id === f)!.label;

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
        {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
        <span>{copied ? "Copiato" : "Copia"}</span>
      </button>
    </div>
  );
}

export default function Sostieni() {
  const [freq, setFreq] = useState<Frequenza>("tantum");
  const [importo, setImporto] = useState("");

  // Firma del libro (donatore)
  const [nome, setNome] = useState("");
  const [messaggio, setMessaggio] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  // Sponsor (€4,99)
  const [spName, setSpName] = useState("");
  const [spLink, setSpLink] = useState("");
  const [spMsg, setSpMsg] = useState("");

  // Libro
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

  const causale = useMemo(() => {
    const who = nome.trim() || "il tuo nome";
    const imp = importo.trim() ? ` ${importo.trim()}€` : "";
    return `Donazione ${freqLabel(freq)}${imp} — ${who}`;
  }, [nome, importo, freq]);

  const donatori = book.filter((r) => r.tipo === "donatore");
  const sponsor = book.filter((r) => r.tipo === "sponsor");

  // ── Firma il libro come donatore ──
  const signBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || sending) return;
    setSending(true);
    try {
      const saved = await submitDonatore({
        nome,
        tipo: "donatore",
        frequenza: freq,
        importo: importo.trim() || null,
        messaggio: messaggio.trim() || null,
      });
      setBook((prev) => (prev.some((r) => r.id === saved.id) ? prev : [saved, ...prev]));
      setDone(true);
      setMessaggio("");
      setTimeout(() => setDone(false), 4000);
    } catch (err) {
      console.error("[sostieni] firma fallita", err);
      alert("Ops, non sono riuscito a registrare la firma. Riprova tra poco.");
    } finally {
      setSending(false);
    }
  };

  // ── Diventa sponsor (€4,99): registra nel libro + prosegue su WhatsApp/email ──
  const sponsorMessage = () => {
    const lines = [
      "Ciao Alberto! Vorrei diventare sponsor del tuo sito (€4,99).",
      `• Nome / Brand: ${spName.trim() || "—"}`,
      `• Link: ${spLink.trim() || "—"}`,
    ];
    if (spMsg.trim()) lines.push(`• Messaggio: ${spMsg.trim()}`);
    return lines.join("\n");
  };

  const proceedSponsor = async (channel: "whatsapp" | "email") => {
    if (!spName.trim()) {
      alert("Inserisci almeno il nome o il brand dello sponsor.");
      return;
    }
    // Registra subito lo sponsor nel libro (in attesa di conferma del pagamento).
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
      const subject = "Sponsor del sito (€4,99)";
      window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    }
  };

  return (
    <div className="it-page-wrapper sos-page">
      {/* ── Header ── */}
      <header className="sos-hdr">
        <div className="sos-wrap sos-hdr-inner">
          <Link to="/" className="sos-back" aria-label="Torna alla home">
            <ArrowLeft size={18} aria-hidden="true" />
            <span>Home</span>
          </Link>
          <span className="sos-hdr-title">
            <Heart size={16} aria-hidden="true" /> Sostieni
          </span>
        </div>
      </header>

      <main className="sos-wrap sos-main">
        {/* ── Hero ── */}
        <section className="sos-hero">
          <p className="sos-eyebrow"><Sparkles size={14} aria-hidden="true" /> Donazioni</p>
          <h1 className="sos-h1">Sostieni il mio lavoro 💜</h1>
          <p className="sos-lead">
            Ogni contributo — anche piccolo — mi aiuta a tenere online i giochi, i progetti e
            il sito, e a continuare a creare cose nuove. Scegli come donare: una volta, ogni
            settimana o ogni mese, con l'importo che preferisci. <strong>Chi dona finisce nel
            libro dei donatori e sponsor</strong> qui sotto. Grazie davvero! 🙏
          </p>
        </section>

        {/* ── Configuratore donazione ── */}
        <section className="sos-card sos-config">
          <h2 className="sos-card-title"><Repeat size={18} aria-hidden="true" /> Come vuoi donare?</h2>

          {/* Frequenza */}
          <div className="sos-seg" role="group" aria-label="Frequenza della donazione">
            {FREQS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`sos-seg-btn${freq === f.id ? " is-active" : ""}`}
                onClick={() => setFreq(f.id)}
                aria-pressed={freq === f.id}
              >
                <span className="sos-seg-emoji" aria-hidden="true">{f.emoji}</span>
                {f.label}
              </button>
            ))}
          </div>
          <p className="sos-freq-hint">{FREQS.find((f) => f.id === freq)!.hint}</p>

          {/* Importo libero */}
          <label className="sos-field-label" htmlFor="sos-importo">Importo (libero)</label>
          <div className="sos-amounts">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                className={`sos-amount${importo === p ? " is-active" : ""}`}
                onClick={() => setImporto(p)}
              >
                {p}€
              </button>
            ))}
            <div className="sos-amount-custom">
              <input
                id="sos-importo"
                type="number"
                min="1"
                inputMode="decimal"
                placeholder="Libero"
                value={importo}
                onChange={(e) => setImporto(e.target.value)}
                aria-label="Importo libero in euro"
              />
              <span aria-hidden="true">€</span>
            </div>
          </div>

          {freq !== "tantum" && (
            <p className="sos-note">
              💡 Per donare in modo <strong>{freqLabel(freq).toLowerCase()}</strong> imposta dalla tua
              banca un <strong>bonifico ricorrente</strong> (ordine permanente) con questa frequenza,
              usando i dati qui sotto.
            </p>
          )}
        </section>

        {/* ── Dati per il bonifico ── */}
        <section className="sos-card">
          <h2 className="sos-card-title"><Landmark size={18} aria-hidden="true" /> Dati per il bonifico</h2>
          <p className="sos-card-sub">Copia i dati e fai il bonifico dalla tua banca. Causale suggerita inclusa.</p>

          <div className="sos-bank">
            <CopyRow label="Beneficiario" value={BANK.beneficiario} />
            <CopyRow label="IBAN" value={BANK.iban} mono />
            <CopyRow label="BIC / SWIFT" value={BANK.bic} mono />
            <CopyRow label="Banca corrispondente (BIC)" value={BANK.bicCorrispondente} mono />
            <CopyRow label="Codice fiscale" value={BANK.cf} mono />
            <CopyRow label="Banca" value={BANK.banca} />
            <CopyRow label="Email" value={BANK.email} />
            <CopyRow label="Causale suggerita" value={causale} />
          </div>
        </section>

        {/* ── Firma il libro dei donatori ── */}
        <section className="sos-card">
          <h2 className="sos-card-title"><Gift size={18} aria-hidden="true" /> Firma il libro dei donatori</h2>
          <p className="sos-card-sub">
            Dopo aver donato (o anche solo per lasciare un saluto), firma qui: comparirai subito
            nel libro qui sotto. ✍️
          </p>

          {done ? (
            <div className="sos-thanks">
              <Heart size={22} aria-hidden="true" />
              <div>
                <strong>Grazie di cuore! 💜</strong>
                <p>La tua firma è nel libro dei donatori.</p>
              </div>
            </div>
          ) : (
            <form className="sos-form" onSubmit={signBook}>
              <div className="sos-field">
                <label htmlFor="sos-nome">Il tuo nome *</label>
                <input
                  id="sos-nome"
                  type="text"
                  maxLength={40}
                  placeholder="Es. Mario R."
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>
              <div className="sos-field">
                <label htmlFor="sos-msg">Messaggio (facoltativo)</label>
                <textarea
                  id="sos-msg"
                  maxLength={280}
                  rows={2}
                  placeholder="Un pensiero, un saluto…"
                  value={messaggio}
                  onChange={(e) => setMessaggio(e.target.value)}
                />
              </div>
              <button type="submit" className="sos-btn sos-btn--solid" disabled={!nome.trim() || sending}>
                {sending ? <Loader2 size={18} className="sos-spin" aria-hidden="true" /> : <Send size={18} aria-hidden="true" />}
                {sending ? "Firmo…" : "Firma il libro"}
              </button>
            </form>
          )}
        </section>

        {/* ── Diventa sponsor (€4,99) ── */}
        <section className="sos-card sos-sponsor-card">
          <span className="sos-badge"><Crown size={13} aria-hidden="true" /> Sponsor · €4,99</span>
          <h2 className="sos-card-title"><Crown size={18} aria-hidden="true" /> Diventa sponsor</h2>
          <p className="sos-card-sub">
            Con <strong>4,99€</strong> aggiungi il tuo nome o brand (con link) tra gli sponsor, in
            evidenza nel libro. Compila i dati e prosegui scrivendomi su WhatsApp o via email: ci
            mettiamo d'accordo lì in un attimo. 🚀
          </p>

          <div className="sos-form">
            <div className="sos-field">
              <label htmlFor="sos-spname">Nome / Brand *</label>
              <input
                id="sos-spname"
                type="text"
                maxLength={40}
                placeholder="Es. La tua azienda"
                value={spName}
                onChange={(e) => setSpName(e.target.value)}
                required
              />
            </div>
            <div className="sos-field">
              <label htmlFor="sos-splink">Link (sito o social)</label>
              <input
                id="sos-splink"
                type="text"
                maxLength={200}
                placeholder="https://…"
                value={spLink}
                onChange={(e) => setSpLink(e.target.value)}
              />
            </div>
            <div className="sos-field">
              <label htmlFor="sos-spmsg">Messaggio (facoltativo)</label>
              <textarea
                id="sos-spmsg"
                maxLength={280}
                rows={2}
                placeholder="Cosa vuoi promuovere?"
                value={spMsg}
                onChange={(e) => setSpMsg(e.target.value)}
              />
            </div>
            <div className="sos-sponsor-actions">
              <button type="button" className="sos-btn sos-btn--wa" onClick={() => proceedSponsor("whatsapp")}>
                <WhatsAppIcon size={18} /> Prosegui su WhatsApp
              </button>
              <button type="button" className="sos-btn sos-btn--ghost" onClick={() => proceedSponsor("email")}>
                <Mail size={18} aria-hidden="true" /> Prosegui via email
              </button>
            </div>
            <p className="sos-note">
              Proseguendo, ti aggiungo subito tra gli sponsor del libro (in attesa di conferma del
              pagamento di 4,99€).
            </p>
          </div>
        </section>

        {/* ── Libro dei donatori e sponsor ── */}
        <section className="sos-card">
          <h2 className="sos-card-title"><Heart size={18} aria-hidden="true" /> Libro dei donatori e sponsor</h2>

          {!donazioniConfigured && (
            <p className="sos-card-sub">
              ⚠️ Modalità anteprima locale: le firme restano su questo dispositivo finché il backend
              non è collegato.
            </p>
          )}

          {/* Sponsor in evidenza */}
          {sponsor.length > 0 && (
            <>
              <h3 className="sos-subhead"><Crown size={15} aria-hidden="true" /> Sponsor</h3>
              <div className="sos-sponsors">
                {sponsor.map((s) => (
                  <div key={s.id ?? s.nome} className="sos-sponsor-chip">
                    <Crown size={14} aria-hidden="true" />
                    {s.link ? (
                      <a href={s.link} target="_blank" rel="noreferrer noopener">{s.nome}</a>
                    ) : (
                      <span>{s.nome}</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Donatori */}
          <h3 className="sos-subhead"><Gift size={15} aria-hidden="true" /> Donatori</h3>
          {loadingBook ? (
            <p className="sos-empty"><Loader2 size={16} className="sos-spin" aria-hidden="true" /> Carico il libro…</p>
          ) : donatori.length === 0 ? (
            <p className="sos-empty">Ancora nessuna firma — potresti essere il primo! 🌟</p>
          ) : (
            <ul className="sos-list">
              {donatori.map((d) => (
                <li key={d.id ?? `${d.nome}-${d.created_at}`} className="sos-list-item">
                  <div className="sos-avatar" aria-hidden="true">{d.nome.charAt(0).toUpperCase()}</div>
                  <div className="sos-list-body">
                    <div className="sos-list-top">
                      <span className="sos-list-name">{d.nome}</span>
                      {d.frequenza && <span className="sos-tag">{freqLabel(d.frequenza)}</span>}
                      {d.importo && <span className="sos-tag sos-tag--amt">{d.importo}€</span>}
                      <span className="sos-list-time">{timeAgo(d.created_at)}</span>
                    </div>
                    {d.messaggio && <p className="sos-list-msg">“{d.messaggio}”</p>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── Contatti ── */}
        <section className="sos-contact">
          <p className="sos-card-sub">Hai domande o vuoi parlarne? Scrivimi pure.</p>
          <div className="sos-sponsor-actions">
            <a className="sos-btn sos-btn--wa" href={WHATSAPP_HREF} target="_blank" rel="noreferrer noopener">
              <WhatsAppIcon size={18} /> WhatsApp
            </a>
            <a className="sos-btn sos-btn--ghost" href={`mailto:${EMAIL}`}>
              <Mail size={18} aria-hidden="true" /> Email
            </a>
          </div>
        </section>
      </main>

      <footer className="sos-foot">
        <div className="sos-wrap">
          <MessageCircle size={15} aria-hidden="true" />
          <span>© {new Date().getFullYear()} Alberto Pecchini — Grazie per il sostegno 💜</span>
        </div>
      </footer>

      <style>{`
        .sos-page {
          --accent: #8b7bff; --accent-deep: #5b4bd6;
          --ink: #c4a5ff; --glow: rgba(139, 123, 255, 0.45);
          --text: #e8eef4; --sub: #a7b2bd;
          --surface: rgba(255, 255, 255, 0.05);
          --surface-bd: rgba(255, 255, 255, 0.10);
          --vio-soft: rgba(139, 123, 255, 0.10);
          --vio-bd: rgba(139, 123, 255, 0.28);
          --gold: #f5b301; --gold-bd: rgba(245, 179, 1, 0.34); --gold-soft: rgba(245, 179, 1, 0.10);
          min-height: 100vh;
          font-family: "Titillium Web", Geneva, Tahoma, sans-serif;
          color: var(--text);
          background:
            radial-gradient(120% 70% at 50% -10%, rgba(139, 123, 255, 0.16) 0%, transparent 55%),
            linear-gradient(180deg, #0b0f14 0%, #090c10 100%);
        }
        .sos-wrap { width: 100%; max-width: 760px; margin: 0 auto; padding-left: 1.1rem; padding-right: 1.1rem; }

        /* Header */
        .sos-hdr {
          position: sticky; top: 0; z-index: 30;
          background: rgba(10, 13, 17, 0.82);
          backdrop-filter: blur(14px) saturate(140%); -webkit-backdrop-filter: blur(14px) saturate(140%);
          border-bottom: 1px solid var(--surface-bd);
        }
        .sos-hdr-inner { display: flex; align-items: center; justify-content: space-between; height: 58px; }
        .sos-back { display: inline-flex; align-items: center; gap: 0.4rem; color: var(--sub); text-decoration: none; font-weight: 600; font-size: 0.95rem; }
        .sos-back:hover { color: #fff; }
        .sos-hdr-title { display: inline-flex; align-items: center; gap: 0.4rem; color: var(--ink); font-weight: 800; }

        .sos-main { padding: clamp(1.6rem, 4vw, 2.6rem) 1.1rem 3rem; display: flex; flex-direction: column; gap: 1.25rem; }

        /* Hero */
        .sos-hero { text-align: center; padding: 0.5rem 0 0.5rem; }
        .sos-eyebrow { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.85rem; border-radius: 999px; background: var(--vio-soft); border: 1px solid var(--vio-bd); color: var(--ink); font-weight: 800; font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.12em; margin: 0 0 0.9rem; }
        .sos-h1 { font-size: clamp(2rem, 6vw, 3rem); font-weight: 800; line-height: 1.05; color: #fff; margin: 0 0 0.9rem; letter-spacing: -0.02em; }
        .sos-lead { font-size: clamp(1rem, 1.6vw, 1.12rem); line-height: 1.65; color: var(--sub); margin: 0 auto; max-width: 44rem; }
        .sos-lead strong { color: var(--text); }

        /* Card */
        .sos-card {
          position: relative;
          background: var(--surface); border: 1px solid var(--surface-bd); border-radius: 20px;
          padding: clamp(1.2rem, 3vw, 1.8rem);
          box-shadow: 0 18px 44px rgba(0, 0, 0, 0.35);
        }
        .sos-card-title { display: flex; align-items: center; gap: 0.55rem; font-size: 1.2rem; font-weight: 800; color: #fff; margin: 0 0 0.5rem; }
        .sos-card-title svg { color: var(--ink); }
        .sos-card-sub { font-size: 0.95rem; line-height: 1.55; color: var(--sub); margin: 0 0 1.1rem; }
        .sos-card-sub strong { color: var(--text); }

        /* Segmented frequenza */
        .sos-seg { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; background: rgba(0,0,0,0.25); border: 1px solid var(--surface-bd); border-radius: 14px; padding: 0.35rem; }
        .sos-seg-btn { display: flex; flex-direction: column; align-items: center; gap: 0.2rem; padding: 0.6rem 0.4rem; border: 1px solid transparent; border-radius: 10px; background: transparent; color: var(--sub); font-weight: 700; font-size: 0.9rem; cursor: pointer; transition: all 0.15s; }
        .sos-seg-btn:hover { color: #fff; }
        .sos-seg-btn.is-active { background: linear-gradient(140deg, var(--accent) 0%, var(--accent-deep) 130%); color: #fff; box-shadow: 0 6px 18px var(--glow); }
        .sos-seg-emoji { font-size: 1.2rem; }
        .sos-freq-hint { font-size: 0.9rem; color: var(--sub); margin: 0.75rem 0 1.2rem; text-align: center; }

        .sos-field-label { display: block; font-size: 0.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink); margin: 0 0 0.6rem; }
        .sos-amounts { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .sos-amount { padding: 0.6rem 1.1rem; border-radius: 999px; border: 1.5px solid var(--vio-bd); background: var(--vio-soft); color: var(--text); font-weight: 700; cursor: pointer; transition: all 0.15s; }
        .sos-amount:hover { border-color: var(--accent); color: #fff; }
        .sos-amount.is-active { background: linear-gradient(140deg, var(--accent) 0%, var(--accent-deep) 130%); color: #fff; border-color: transparent; box-shadow: 0 6px 18px var(--glow); }
        .sos-amount-custom { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0 0.9rem; border-radius: 999px; border: 1.5px solid var(--surface-bd); background: rgba(0,0,0,0.25); }
        .sos-amount-custom input { width: 86px; background: transparent; border: none; outline: none; color: #fff; font-weight: 700; font-size: 1rem; padding: 0.55rem 0; }
        .sos-amount-custom span { color: var(--sub); font-weight: 700; }

        .sos-note { font-size: 0.88rem; line-height: 1.5; color: var(--sub); background: var(--vio-soft); border: 1px solid var(--vio-bd); border-radius: 12px; padding: 0.7rem 0.9rem; margin: 1.1rem 0 0; }
        .sos-note strong { color: var(--text); }

        /* Dati bonifico */
        .sos-bank { display: flex; flex-direction: column; gap: 0.55rem; }
        .sos-bankrow { display: flex; align-items: center; justify-content: space-between; gap: 0.8rem; background: rgba(0,0,0,0.22); border: 1px solid var(--surface-bd); border-radius: 12px; padding: 0.7rem 0.85rem; }
        .sos-bankrow-text { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
        .sos-bankrow-label { font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink); }
        .sos-bankrow-value { font-size: 0.98rem; color: #fff; font-weight: 600; word-break: break-word; }
        .sos-mono { font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; letter-spacing: 0.01em; }
        .sos-copy { flex-shrink: 0; display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.5rem 0.8rem; border-radius: 10px; border: 1px solid var(--vio-bd); background: var(--vio-soft); color: var(--ink); font-weight: 700; font-size: 0.82rem; cursor: pointer; transition: all 0.15s; }
        .sos-copy:hover { color: #fff; border-color: var(--accent); }

        /* Form */
        .sos-form { display: flex; flex-direction: column; gap: 0.85rem; }
        .sos-field { display: flex; flex-direction: column; gap: 0.4rem; }
        .sos-field label { font-size: 0.8rem; font-weight: 700; color: var(--sub); }
        .sos-field input, .sos-field textarea { background: rgba(0,0,0,0.25); border: 1px solid var(--surface-bd); border-radius: 12px; padding: 0.7rem 0.85rem; color: #fff; font-family: inherit; font-size: 1rem; outline: none; transition: border-color 0.15s, box-shadow 0.15s; resize: vertical; }
        .sos-field input:focus, .sos-field textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--vio-soft); }
        .sos-field input::placeholder, .sos-field textarea::placeholder { color: #6b7682; }

        .sos-btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.8rem 1.4rem; border-radius: 999px; font-weight: 800; font-size: 0.98rem; border: 1.5px solid transparent; cursor: pointer; text-decoration: none; transition: transform 0.15s, box-shadow 0.15s, background 0.15s, border-color 0.15s; }
        .sos-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .sos-btn--solid { background: linear-gradient(140deg, var(--accent) 0%, var(--accent-deep) 130%); color: #fff; box-shadow: 0 8px 22px var(--glow); }
        .sos-btn--solid:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 12px 28px var(--glow); }
        .sos-btn--ghost { background: var(--vio-soft); color: var(--text); border-color: var(--vio-bd); }
        .sos-btn--ghost:hover { border-color: var(--accent); color: #fff; }
        .sos-btn--wa { background: #25d366; color: #06301a; box-shadow: 0 8px 22px rgba(37, 211, 102, 0.3); }
        .sos-btn--wa:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(37, 211, 102, 0.4); }

        .sos-thanks { display: flex; align-items: center; gap: 0.9rem; background: var(--vio-soft); border: 1px solid var(--vio-bd); border-radius: 14px; padding: 1rem 1.1rem; }
        .sos-thanks svg { color: var(--ink); flex-shrink: 0; }
        .sos-thanks strong { color: #fff; font-size: 1.05rem; }
        .sos-thanks p { margin: 0.2rem 0 0; color: var(--sub); font-size: 0.92rem; }

        /* Sponsor card */
        .sos-sponsor-card { border-color: var(--gold-bd); background: linear-gradient(180deg, var(--gold-soft) 0%, rgba(255,255,255,0.02) 100%); }
        .sos-badge { position: absolute; top: -12px; right: 1.2rem; display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.35rem 0.8rem; border-radius: 999px; background: linear-gradient(140deg, var(--gold) 0%, #b97e05 130%); color: #1a1206; font-weight: 800; font-size: 0.74rem; box-shadow: 0 8px 20px rgba(245, 179, 1, 0.3); }
        .sos-sponsor-card .sos-card-title svg { color: var(--gold); }
        .sos-sponsor-actions { display: flex; flex-wrap: wrap; gap: 0.6rem; }
        .sos-sponsor-actions .sos-btn { flex: 1 1 auto; }

        /* Libro */
        .sos-subhead { display: flex; align-items: center; gap: 0.45rem; font-size: 0.82rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: var(--ink); margin: 1.3rem 0 0.7rem; }
        .sos-subhead:first-of-type { margin-top: 0.4rem; }
        .sos-sponsors { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .sos-sponsor-chip { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.45rem 0.85rem; border-radius: 999px; background: var(--gold-soft); border: 1px solid var(--gold-bd); font-weight: 700; font-size: 0.9rem; }
        .sos-sponsor-chip svg { color: var(--gold); }
        .sos-sponsor-chip a { color: #fff; text-decoration: none; }
        .sos-sponsor-chip a:hover { text-decoration: underline; }

        .sos-empty { display: flex; align-items: center; gap: 0.5rem; color: var(--sub); font-size: 0.95rem; padding: 0.6rem 0; }
        .sos-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.6rem; }
        .sos-list-item { display: flex; gap: 0.75rem; background: rgba(0,0,0,0.22); border: 1px solid var(--surface-bd); border-radius: 14px; padding: 0.75rem 0.85rem; }
        .sos-avatar { flex-shrink: 0; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: linear-gradient(140deg, var(--accent) 0%, var(--accent-deep) 130%); color: #fff; font-weight: 800; font-size: 1.05rem; }
        .sos-list-body { min-width: 0; flex: 1; }
        .sos-list-top { display: flex; align-items: center; flex-wrap: wrap; gap: 0.4rem; }
        .sos-list-name { font-weight: 800; color: #fff; }
        .sos-tag { font-size: 0.72rem; font-weight: 700; padding: 0.12rem 0.5rem; border-radius: 999px; background: var(--vio-soft); border: 1px solid var(--vio-bd); color: var(--ink); }
        .sos-tag--amt { background: rgba(245, 179, 1, 0.12); border-color: var(--gold-bd); color: var(--gold); }
        .sos-list-time { margin-left: auto; font-size: 0.78rem; color: var(--sub); }
        .sos-list-msg { margin: 0.35rem 0 0; color: var(--sub); font-size: 0.92rem; font-style: italic; }

        /* Contatti + footer */
        .sos-contact { text-align: center; padding: 0.5rem 0; }
        .sos-contact .sos-card-sub { margin-bottom: 0.9rem; }
        .sos-contact .sos-sponsor-actions { justify-content: center; }
        .sos-foot { border-top: 1px solid var(--surface-bd); padding: 1.4rem 0; }
        .sos-foot .sos-wrap { display: flex; align-items: center; justify-content: center; gap: 0.5rem; color: var(--sub); font-size: 0.88rem; }

        .sos-spin { animation: sos-spin 0.9s linear infinite; }
        @keyframes sos-spin { to { transform: rotate(360deg); } }

        @media (max-width: 520px) {
          .sos-bankrow { flex-direction: column; align-items: stretch; }
          .sos-copy { align-self: flex-end; }
          .sos-sponsor-actions .sos-btn { flex: 1 1 100%; }
        }
      `}</style>
    </div>
  );
}
