import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapPin, CalendarDays, Gift, Utensils, PartyPopper, Send, Loader2,
  ArrowLeftRight,
} from "lucide-react";
import {
  submitPresenza, fetchPresenze, subscribePresenze,
  type PresenzaRow, type Presenza, type Giorno,
} from "./festaApi";
import "./festa.css";

// ─── Giorni della festa: due inviti separati, un link (token) ciascuno ──────
// Stesso evento, due date: chi vuole può esserci anche entrambi i giorni.
// Il giorno viaggia col record (colonna "giorno") così le adesioni restano
// separate e so a quale giorno si riferisce ogni risposta.
interface DayCfg {
  id: Giorno;
  token: string;
  weekday: string;     // "Sabato" / "Domenica"
  weekdayShort: string;// "sab" / "dom"
  dayNum: string;      // "27" / "28"
  dateLabel: string;   // "27 giugno"
  other: { token: string; label: string }; // link all'altro giorno
}

const DAYS: Record<string, DayCfg> = {
  "alb20-mtv74": {
    id: "27", token: "alb20-mtv74",
    weekday: "Sabato", weekdayShort: "sab", dayNum: "27", dateLabel: "27 giugno",
    other: { token: "alb20-mtv74-28", label: "domenica 28" },
  },
  "alb20-mtv74-28": {
    id: "28", token: "alb20-mtv74-28",
    weekday: "Domenica", weekdayShort: "dom", dayNum: "28", dateLabel: "28 giugno",
    other: { token: "alb20-mtv74", label: "sabato 27" },
  },
};

// Lunedì 29 giugno 2026, 00:00 (Europe/Rome, CEST = +02:00): entrambi gli
// inviti restano attivi fino a fine domenica 28.
const DEADLINE = new Date("2026-06-29T00:00:00+02:00");

const ADDRESS = "Strada Vedusino, 4";
const GMAPS = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Strada Vedusino 4")}`;
const AMAPS = `https://maps.apple.com/?q=${encodeURIComponent("Strada Vedusino 4")}`;

const PRESENZA_BADGE: Record<Presenza, { emoji: string; short: string }> = {
  pomeriggio: { emoji: "🏊", short: "Pomeriggio" },
  sera:       { emoji: "🌙", short: "Anche sera" },
  no:         { emoji: "🙁", short: "Non viene" },
};

// ─── Schermata neutra (token errato o evento concluso) ──────────────────────
function FestaClosed({ expired }: { expired: boolean }) {
  return (
    <div className="festa-page festa-closed">
      <div className="festa-closed-card">
        <div className="festa-closed-emoji">{expired ? "🎈" : "🔒"}</div>
        <h1>{expired ? "Evento concluso" : "Pagina non disponibile"}</h1>
        <p>
          {expired
            ? "Grazie a tutti! Questo invito non è più attivo."
            : "Il link non è valido o è scaduto."}
        </p>
      </div>
    </div>
  );
}

export default function Festa() {
  // Gate calcolato una volta sola al mount.
  const access = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const day = DAYS[params.get("k") ?? ""] ?? null;
    const expired = Date.now() >= DEADLINE.getTime();
    return { day, expired };
  }, []);

  if (!access.day) return <FestaClosed expired={false} />;
  if (access.expired) return <FestaClosed expired={true} />;

  return <FestaContent day={access.day} />;
}

function FestaContent({ day }: { day: DayCfg }) {
  const [nome, setNome] = useState("");
  const [presenza, setPresenza] = useState<Presenza | null>(null);
  const [cibo, setCibo] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<PresenzaRow[]>([]);

  const seen = useRef<Set<string>>(new Set());

  const presenzaOpts: { value: Presenza; emoji: string; label: string }[] = [
    { value: "pomeriggio", emoji: "🏊", label: `Ci sono al bagno (pom. ${day.weekdayShort} ${day.dayNum})` },
    { value: "sera",       emoji: "🌙", label: "Resto anche alla sera" },
    { value: "no",         emoji: "🙁", label: "Non riesco a venire" },
  ];

  // Carica le presenze del giorno + sottoscrizione realtime (filtrata).
  useEffect(() => {
    let alive = true;
    fetchPresenze(day.id).then((data) => {
      if (!alive) return;
      data.forEach((r) => seen.current.add(rowKey(r)));
      setRows(data);
    }).catch(() => {});

    const unsub = subscribePresenze((r) => {
      if (r.giorno !== day.id) return; // ignora l'altro giorno
      const k = rowKey(r);
      if (seen.current.has(k)) return;
      seen.current.add(k);
      setRows((prev) => [r, ...prev]);
    });
    return () => { alive = false; unsub(); };
  }, [day.id]);

  const canSend = nome.trim().length > 0 && presenza != null && !sending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend || !presenza) return;
    setSending(true);
    setError(null);
    try {
      const saved = await submitPresenza({ nome, presenza, cibo, giorno: day.id });
      // Mostra subito la propria riga (in caso il realtime tardasse).
      const k = rowKey(saved);
      if (!seen.current.has(k)) {
        seen.current.add(k);
        setRows((prev) => [saved, ...prev]);
      }
      // Notifica email (best-effort: non blocca l'esito).
      fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome.trim(), presenza, cibo: cibo.trim(), giorno: day.id }),
      }).catch(() => {});
      setSent(true);
    } catch (err: any) {
      setError("Ops, non sono riuscito a salvare. Riprova tra un attimo.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="festa-page">
      <div className="festa-wrap">

        {/* ── Hero ── */}
        <header className="festa-hero">
          <div className="festa-hero-badge">Sei invitato/a · {day.weekday} {day.dayNum} 🎉</div>
          <h1 className="festa-hero-title">Festa di Alberto</h1>
          <p className="festa-hero-sub">
            <strong>20 anni</strong> &nbsp;·&nbsp; Diploma di maturità <strong>74/100</strong>
          </p>
          <p className="festa-hero-geom">Geom. Alberto Pecchini</p>
        </header>

        {/* ── Due giorni: invito separato per ciascun giorno ── */}
        <section className="festa-card festa-cross">
          <div className="festa-card-head">
            <ArrowLeftRight size={20} /><h2>Due giorni di festa</h2>
          </div>
          <p className="festa-cross-text">
            Questo invito è per <strong>{day.weekday} {day.dateLabel}</strong>.
            Non riesci? <a className="festa-cross-link" href={`/festa?k=${day.other.token}`}>Vieni {day.other.label} →</a>
          </p>
          <p className="festa-cross-note">
            E ovviamente puoi esserci <strong>entrambi i giorni</strong>: in tal caso rispondi a tutti e due gli inviti. 💚
          </p>
        </section>

        {/* ── Dove ── */}
        <section className="festa-card">
          <div className="festa-card-head">
            <MapPin size={20} /><h2>Dove</h2>
          </div>
          <p className="festa-address">{ADDRESS}</p>
          <div className="festa-maps">
            <a className="btn btn-primary festa-btn" href={GMAPS} target="_blank" rel="noreferrer">
              Apri in Google Maps
            </a>
            <a className="btn btn-outline-primary festa-btn" href={AMAPS} target="_blank" rel="noreferrer">
              Apri in Apple Maps
            </a>
          </div>
        </section>

        {/* ── Quando ── */}
        <section className="festa-card">
          <div className="festa-card-head">
            <CalendarDays size={20} /><h2>Quando</h2>
          </div>
          <ul className="festa-list">
            <li><span className="festa-dot">🏊</span> <span><strong>{day.weekday} {day.dateLabel}, pomeriggio</strong> — si fa il bagno.</span></li>
            <li><span className="festa-dot">🌙</span> <span>Poi <strong>chi vuole resta alla sera</strong>.</span></li>
          </ul>
        </section>

        {/* ── Cibo + regali ── */}
        <section className="festa-card">
          <div className="festa-card-head">
            <Utensils size={20} /><h2>Cibo & regali</h2>
          </div>
          <ul className="festa-list">
            <li><span className="festa-dot">🍕</span> <span><strong>Prendo d'asporto quello che volete</strong> — scrivilo nel sondaggio qui sotto.</span></li>
            <li><span className="festa-dot">🎁</span> <span><strong>Nessun regalo è richiesto</strong>, non preoccupatevi.</span></li>
          </ul>
        </section>

        {/* ── Cosa portare ── */}
        <section className="festa-card">
          <div className="festa-card-head">
            <Gift size={20} /><h2>Cosa portare</h2>
          </div>
          <div className="festa-bring">
            {[
              { e: "🩳", t: "Costume" },
              { e: "🩴", t: "Ciabatte" },
              { e: "👕", t: "Cambio vestiti" },
              { e: "🏖️", t: "Asciugamano" },
            ].map((x) => (
              <span key={x.t} className="festa-chip">{x.e} {x.t}</span>
            ))}
          </div>
        </section>

        {/* ── Sondaggio presenze ── */}
        <section className="festa-card festa-poll">
          <div className="festa-card-head">
            <PartyPopper size={20} /><h2>Ci sei {day.weekday.toLowerCase()} {day.dayNum}? Fammelo sapere</h2>
          </div>

          {sent ? (
            <div className="festa-thanks">
              <div className="festa-thanks-emoji">🥳</div>
              <h3>Grazie, segnato!</h3>
              <p>Ci vediamo {day.weekday.toLowerCase()} {day.dayNum}. Sei nella lista qui sotto.</p>
            </div>
          ) : (
            <form className="festa-form" onSubmit={handleSubmit}>
              <label className="festa-field">
                <span className="festa-label">Il tuo nome</span>
                <input
                  className="form-control festa-input"
                  type="text"
                  value={nome}
                  maxLength={40}
                  placeholder="Es. Marco"
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </label>

              <div className="festa-field">
                <span className="festa-label">Ci sarai {day.weekday.toLowerCase()} {day.dayNum}?</span>
                <div className="festa-seg">
                  {presenzaOpts.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      className={`festa-seg-btn${presenza === o.value ? " is-active" : ""}`}
                      onClick={() => setPresenza(o.value)}
                    >
                      <span className="festa-seg-emoji">{o.emoji}</span>
                      <span>{o.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <label className="festa-field">
                <span className="festa-label">Cosa vuoi d'asporto? <em>(facoltativo)</em></span>
                <textarea
                  className="form-control festa-input"
                  value={cibo}
                  maxLength={200}
                  rows={2}
                  placeholder="Es. pizza margherita, sushi, kebab…"
                  onChange={(e) => setCibo(e.target.value)}
                />
              </label>

              {error && <div className="festa-error">{error}</div>}

              <button className="btn btn-primary festa-submit" type="submit" disabled={!canSend}>
                {sending ? <><Loader2 size={18} className="festa-spin" /> Invio…</>
                         : <><Send size={18} /> Conferma</>}
              </button>
            </form>
          )}

          {/* ── Lista live ── */}
          <div className="festa-live">
            <div className="festa-live-head">
              <span className="festa-live-dot" />
              <span>Chi c'è {day.weekday.toLowerCase()} {day.dayNum} ({rows.length})</span>
            </div>
            {rows.length === 0 ? (
              <p className="festa-live-empty">Ancora nessuno… sii il primo!</p>
            ) : (
              <ul className="festa-live-list">
                {rows.map((r, i) => {
                  const b = PRESENZA_BADGE[r.presenza] ?? { emoji: "•", short: r.presenza };
                  return (
                    <li key={r.id ?? `${r.nome}-${i}`} className="festa-live-row">
                      <span className="festa-live-name">{r.nome}</span>
                      <span className={`festa-live-badge p-${r.presenza}`}>{b.emoji} {b.short}</span>
                      {r.cibo ? <span className="festa-live-food">🍽️ {r.cibo}</span> : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <footer className="festa-foot">A presto! — Alberto 💚</footer>
      </div>
    </div>
  );
}

// Chiave per deduplicare (id se presente, altrimenti nome+timestamp).
function rowKey(r: PresenzaRow): string {
  return r.id != null ? `id:${r.id}` : `n:${r.nome}|${r.created_at ?? ""}`;
}
