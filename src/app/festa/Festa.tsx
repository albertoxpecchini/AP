import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapPin, Navigation, Gift, Pizza, PartyPopper, Send, Loader2,
  ArrowLeftRight, ListChecks, PenLine, CalendarHeart, Scissors,
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
  other?: { token: string; label: string }; // link all'altro giorno (se attivo)
}

// Invito del 27 revocato: resta attivo solo il link di domenica 28.
const DAYS: Record<string, DayCfg> = {
  "alb20-mtv74-28": {
    id: "28", token: "alb20-mtv74-28",
    weekday: "Domenica", weekdayShort: "dom", dayNum: "28", dateLabel: "28 giugno",
  },
};

// Lunedì 29 giugno 2026, 00:00 (Europe/Rome, CEST = +02:00): entrambi gli
// inviti restano attivi fino a fine domenica 28.
const DEADLINE = new Date("2026-06-29T00:00:00+02:00");

// Prenotazione pizze: le ordino al Pizzangolo (Rivalta sul Mincio) entro le
// 21:00 di sabato 27/06 (il giorno prima). Dopo, il campo "gusto" si blocca:
// la presenza resta comunque confermabile.
const PIZZA_DEADLINE = new Date("2026-06-27T21:00:00+02:00");
const PIZZA_DEADLINE_LABEL = "sabato 27 giugno, ore 21:00";

const ADDRESS = "Strada Vedusino, 4";
const GMAPS = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Strada Vedusino 4")}`;
const AMAPS = `https://maps.apple.com/?q=${encodeURIComponent("Strada Vedusino 4")}`;

const PRESENZA_BADGE: Record<Presenza, { emoji: string; short: string }> = {
  pomeriggio: { emoji: "🏊", short: "Pomeriggio" },
  sera:       { emoji: "🌙", short: "Anche sera" },
  no:         { emoji: "🙁", short: "Non viene" },
};

// ─── Icone che fluttuano sulla "scrivania" (dietro al cartoncino) ───────────
// Decorative: solo transform/opacity, aria-hidden, niente eventi puntatore.
const PROPS = [
  { e: "🎈", t: "6%",  l: "5%",  s: 2.4, d: 13, dl: 0   },
  { e: "🎉", t: "12%", l: "90%", s: 2.0, d: 16, dl: 1.5 },
  { e: "🍕", t: "34%", l: "3%",  s: 2.2, d: 15, dl: 0.6 },
  { e: "☀️", t: "26%", l: "93%", s: 2.6, d: 18, dl: 2.2 },
  { e: "💦", t: "55%", l: "6%",  s: 1.8, d: 12, dl: 1.0 },
  { e: "🩴", t: "62%", l: "92%", s: 2.0, d: 14, dl: 0.3 },
  { e: "🏊", t: "78%", l: "4%",  s: 2.3, d: 17, dl: 2.0 },
  { e: "🌙", t: "84%", l: "91%", s: 2.0, d: 15, dl: 0.9 },
  { e: "🎂", t: "46%", l: "95%", s: 2.1, d: 16, dl: 1.7 },
  { e: "✨", t: "92%", l: "48%", s: 1.7, d: 11, dl: 0.5 },
];

function DeskDecor() {
  return (
    <div className="festa-decor" aria-hidden="true">
      {PROPS.map((p, i) => (
        <span
          key={i}
          className="festa-prop"
          style={{
            top: p.t, left: p.l, fontSize: `${p.s}rem`,
            animationDuration: `${p.d}s`, animationDelay: `${p.dl}s`,
          }}
        >
          {p.e}
        </span>
      ))}
    </div>
  );
}

// ─── Coriandoli: scoppio al momento della conferma ──────────────────────────
const CONF_COLORS = ["#7c6cff", "#d8b86a", "#ff8fb3", "#5ad1c4", "#ffd24a", "#fff7e6"];
function Confetti() {
  const pieces = useMemo(
    () => Array.from({ length: 40 }, (_, i) => ({
      l: Math.random() * 100,
      d: 2.4 + Math.random() * 1.8,
      dl: Math.random() * 0.5,
      c: CONF_COLORS[i % CONF_COLORS.length],
      r: Math.random() * 360,
      w: 6 + Math.random() * 6,
      h: 9 + Math.random() * 8,
    })),
    [],
  );
  return (
    <div className="festa-confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            left: `${p.l}%`,
            width: `${p.w}px`, height: `${p.h}px`,
            background: p.c,
            animationDuration: `${p.d}s`, animationDelay: `${p.dl}s`,
            transform: `rotate(${p.r}deg)`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Medaglione (testa di sezione): anello dorato + emoji animata ───────────
function Medallion({ emoji, anim }: { emoji: string; anim: string }) {
  return (
    <span className="festa-medal" aria-hidden="true">
      <span className={`festa-medal-ico festa-anim-${anim}`}>{emoji}</span>
    </span>
  );
}

// ─── Schermata neutra (token errato o evento concluso) ──────────────────────
function FestaClosed({ expired }: { expired: boolean }) {
  return (
    <div className="festa-page festa-closed">
      <DeskDecor />
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

  // Mese e anno per il blocco data (derivati dal config: "28 giugno" → "giugno").
  const monthLabel = day.dateLabel.replace(day.dayNum, "").trim();
  const year = String(DEADLINE.getFullYear() - (DEADLINE.getMonth() === 0 ? 1 : 0));

  const presenzaOpts: { value: Presenza; emoji: string; label: string; hint: string }[] = [
    { value: "pomeriggio", emoji: "🏊", label: "Ci sono al pomeriggio", hint: `bagno in piscina · ${day.weekdayShort} ${day.dayNum}` },
    { value: "sera",       emoji: "🌙", label: "Resto anche alla sera",  hint: "pomeriggio + serata" },
    { value: "no",         emoji: "🙁", label: "Non riesco a venire",     hint: "sarai con noi col pensiero" },
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

  // Le pizze si ordinano in pizzeria entro le 21 di sabato 27: dopo, niente gusti.
  const pizzaOpen = Date.now() < PIZZA_DEADLINE.getTime();

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
      <DeskDecor />
      {sent && <Confetti />}

      <div className="festa-wrap">

        {/* ════════ INVITO (cartoncino principale) ════════ */}
        <article className="festa-paper">
          <div className="festa-paper-edge" aria-hidden="true" />

          {/* Francobollo decorativo nell'angolo */}
          <span className="festa-stamp" aria-hidden="true">
            <span className="festa-stamp-top">DOM · 28</span>
            <span className="festa-stamp-emoji">🎉</span>
            <span className="festa-stamp-bot">GIU 2026</span>
          </span>

          {/* Intestazione */}
          <header className="festa-head">
            <p className="festa-eyebrow">
              <span className="festa-flourish">❧</span>
              Sei invitato/a
              <span className="festa-flourish festa-flourish--flip">❧</span>
            </p>
            <h1 className="festa-title">La Festa<br />di Alberto</h1>
            <p className="festa-occasion">
              Per i miei <strong>20 anni</strong> &nbsp;·&nbsp; e la <strong>Maturità 74/100</strong>
            </p>
            <p className="festa-geom">Geom. Alberto Pecchini</p>

            <div className="festa-rule" aria-hidden="true">
              <span /><span className="festa-rule-dot">✦</span><span />
            </div>

            {/* Ceralacca */}
            <span className="festa-seal" aria-hidden="true">
              <span className="festa-seal-shine" />
              <span className="festa-seal-mono">AP</span>
            </span>
          </header>

          {/* Blocco DATA — il save-the-date */}
          <div className="festa-date">
            <span className="festa-date-corner tl" aria-hidden="true" />
            <span className="festa-date-corner tr" aria-hidden="true" />
            <span className="festa-date-corner bl" aria-hidden="true" />
            <span className="festa-date-corner br" aria-hidden="true" />
            <span className="festa-date-wd">{day.weekday}</span>
            <span className="festa-date-num">{day.dayNum}</span>
            <span className="festa-date-my">{monthLabel} {year}</span>
            <span className="festa-date-note">dal pomeriggio… fino a sera 🌙</span>
          </div>

          {/* Due giorni: solo se esiste un secondo invito attivo */}
          {day.other && (
            <div className="festa-cross">
              <ArrowLeftRight size={18} />
              <p>
                Non riesci? <a href={`/festa?k=${day.other.token}`}>Vieni {day.other.label} →</a>
                &nbsp;Puoi esserci anche <strong>entrambi i giorni</strong>: rispondi a tutti e due gli inviti. 💚
              </p>
            </div>
          )}

          {/* A colpo d'occhio — chiarezza immediata */}
          <div className="festa-glance">
            <div className="festa-glance-item">
              <span className="festa-glance-emoji">📅</span>
              <span className="festa-glance-k">Quando</span>
              <span className="festa-glance-v">{day.weekdayShort} {day.dayNum} {monthLabel}<br />dal pomeriggio</span>
            </div>
            <div className="festa-glance-item">
              <span className="festa-glance-emoji">📍</span>
              <span className="festa-glance-k">Dove</span>
              <span className="festa-glance-v">{ADDRESS}</span>
            </div>
            <div className="festa-glance-item">
              <span className="festa-glance-emoji">🍕</span>
              <span className="festa-glance-k">Cibo</span>
              <span className="festa-glance-v">Pizza offerta<br />niente regali</span>
            </div>
          </div>

          {/* Il programma — timeline chiara */}
          <section className="festa-block">
            <div className="festa-block-head">
              <Medallion emoji="🗓️" anim="bob" />
              <h2>Il programma</h2>
            </div>
            <div className="festa-timeline">
              <div className="festa-tl-row">
                <span className="festa-tl-time">Pomeriggio</span>
                <span className="festa-tl-line" aria-hidden="true"><i /></span>
                <div className="festa-tl-body">
                  <span className="festa-tl-emoji festa-anim-swim">🏊</span>
                  <div>
                    <p className="festa-tl-title">Si fa il bagno in piscina</p>
                    <p className="festa-tl-desc">Si parte nel pomeriggio: tuffi, sole e relax.</p>
                  </div>
                </div>
              </div>
              <div className="festa-tl-row">
                <span className="festa-tl-time">Sera</span>
                <span className="festa-tl-line" aria-hidden="true"><i /></span>
                <div className="festa-tl-body">
                  <span className="festa-tl-emoji festa-anim-bob">🌙</span>
                  <div>
                    <p className="festa-tl-title">Chi vuole resta alla sera</p>
                    <p className="festa-tl-desc">Niente fretta: si continua insieme anche dopo il tramonto.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Dove */}
          <section className="festa-block">
            <div className="festa-block-head">
              <Medallion emoji="📍" anim="drop" />
              <h2>Come arrivare</h2>
            </div>
            <p className="festa-address"><MapPin size={18} /> {ADDRESS}</p>
            <div className="festa-maps">
              <a className="festa-map-btn festa-map-btn--primary" href={GMAPS} target="_blank" rel="noreferrer">
                <Navigation size={17} /> Google Maps
              </a>
              <a className="festa-map-btn" href={AMAPS} target="_blank" rel="noreferrer">
                <MapPin size={17} /> Apple Maps
              </a>
            </div>
          </section>

          {/* Cosa portare */}
          <section className="festa-block">
            <div className="festa-block-head">
              <Medallion emoji="🎒" anim="wiggle" />
              <h2>Cosa portare</h2>
            </div>
            <div className="festa-bring">
              {[
                { e: "🩳", t: "Costume" },
                { e: "🩴", t: "Ciabatte" },
                { e: "👕", t: "Cambio vestiti" },
                { e: "🏖️", t: "Asciugamano" },
              ].map((x) => (
                <span key={x.t} className="festa-chip"><span className="festa-chip-e">{x.e}</span> {x.t}</span>
              ))}
            </div>
          </section>

          {/* Buono a sapersi */}
          <section className="festa-block">
            <div className="festa-block-head">
              <Medallion emoji="🍕" anim="spin" />
              <h2>Buono a sapersi</h2>
            </div>
            <ul className="festa-notes">
              <li>
                <Pizza size={18} className="festa-note-ic" />
                <span>
                  <strong>Pizza alla teglia dal Pizzangolo</strong> (Rivalta sul Mincio) — offre la casa! 🎉
                  Scrivi il tuo gusto nella cartolina qui sotto <strong>entro le 21 di sabato 27 giugno</strong>.
                </span>
              </li>
              <li>
                <Gift size={18} className="festa-note-ic" />
                <span><strong>Nessun regalo è richiesto</strong>: vieni e basta, è già il regalo più bello. 💚</span>
              </li>
            </ul>
          </section>
        </article>

        {/* ════════ CARTOLINA R.S.V.P. (risposta) ════════ */}
        <article className="festa-reply">
          <div className="festa-tear" aria-hidden="true">
            <Scissors size={15} />
            <span>stacca &amp; rispondi</span>
          </div>

          <div className="festa-reply-head">
            <p className="festa-rsvp-tag"><CalendarHeart size={15} /> R.S.V.P.</p>
            <h2 className="festa-reply-title">Ci sei {day.weekday.toLowerCase()} {day.dayNum}?</h2>
            <p className="festa-reply-sub">
              Fammelo sapere <strong>entro {day.weekday.toLowerCase()} {day.dateLabel}</strong>.
            </p>
          </div>

          {sent ? (
            <div className="festa-thanks">
              <div className="festa-thanks-emoji">🥳</div>
              <h3>Grazie, segnato!</h3>
              <p>Ci vediamo {day.weekday.toLowerCase()} {day.dayNum}. Trovi il tuo nome nella lista qui sotto.</p>
            </div>
          ) : (
            <>
              {/* Micro-istruzioni: 3 passi chiarissimi */}
              <ol className="festa-steps">
                <li><span>1</span> Scrivi il tuo nome</li>
                <li><span>2</span> Dimmi se vieni</li>
                <li><span>3</span> <em>(se vuoi)</em> il gusto della pizza</li>
              </ol>

              <form className="festa-form" onSubmit={handleSubmit}>
                <label className="festa-field">
                  <span className="festa-flabel"><PenLine size={15} /> Il tuo nome</span>
                  <input
                    className="festa-input"
                    type="text"
                    value={nome}
                    maxLength={40}
                    placeholder="Es. Marco"
                    onChange={(e) => setNome(e.target.value)}
                    required
                  />
                </label>

                <div className="festa-field">
                  <span className="festa-flabel"><ListChecks size={15} /> Ci sarai?</span>
                  <div className="festa-seg">
                    {presenzaOpts.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        className={`festa-seg-btn${presenza === o.value ? " is-active" : ""}`}
                        onClick={() => setPresenza(o.value)}
                      >
                        <span className="festa-seg-emoji">{o.emoji}</span>
                        <span className="festa-seg-txt">
                          <span className="festa-seg-main">{o.label}</span>
                          <span className="festa-seg-hint">{o.hint}</span>
                        </span>
                        <span className="festa-seg-check" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="festa-field">
                  <span className="festa-flabel"><Pizza size={15} /> Gusto pizza <em>(facoltativo)</em></span>
                  {pizzaOpen ? (
                    <>
                      <textarea
                        className="festa-input"
                        value={cibo}
                        maxLength={200}
                        rows={2}
                        placeholder="Es. margherita, patate, würstel, prosciutto…"
                        onChange={(e) => setCibo(e.target.value)}
                      />
                      <span className="festa-hint">
                        🍕 Prenoto i gusti al Pizzangolo (Rivalta) entro <strong>{PIZZA_DEADLINE_LABEL}</strong>.
                      </span>
                    </>
                  ) : (
                    <div className="festa-locked">
                      🔒 Prenotazione pizze chiusa (scadenza: {PIZZA_DEADLINE_LABEL}). Puoi comunque confermare la presenza.
                    </div>
                  )}
                </div>

                {error && <div className="festa-error">{error}</div>}

                <button className="festa-submit" type="submit" disabled={!canSend}>
                  {sending ? <><Loader2 size={18} className="festa-spin" /> Invio…</>
                           : <><Send size={18} /> Conferma la presenza</>}
                </button>
              </form>
            </>
          )}

          {/* Libro degli ospiti — lista live */}
          <div className="festa-guests">
            <div className="festa-guests-head">
              <PartyPopper size={16} />
              <span>Chi c'è {day.weekday.toLowerCase()} {day.dayNum}</span>
              <span className="festa-guests-count">{rows.length}</span>
              <span className="festa-live-dot" aria-hidden="true" />
            </div>
            {rows.length === 0 ? (
              <p className="festa-guests-empty">Ancora nessuno… sii il primo! 🎈</p>
            ) : (
              <ul className="festa-guests-list">
                {rows.map((r, i) => {
                  const b = PRESENZA_BADGE[r.presenza] ?? { emoji: "•", short: r.presenza };
                  return (
                    <li key={r.id ?? `${r.nome}-${i}`} className="festa-guest-row">
                      <span className="festa-guest-name">{r.nome}</span>
                      <span className={`festa-guest-badge p-${r.presenza}`}>{b.emoji} {b.short}</span>
                      {r.cibo ? <span className="festa-guest-food">🍽️ {r.cibo}</span> : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </article>

        <footer className="festa-foot">
          <span className="festa-foot-flourish" aria-hidden="true">✦ ✦ ✦</span>
          <p>Con affetto, ti aspetto.</p>
          <p className="festa-foot-sign">Alberto 💚</p>
        </footer>
      </div>
    </div>
  );
}

// Chiave per deduplicare (id se presente, altrimenti nome+timestamp).
function rowKey(r: PresenzaRow): string {
  return r.id != null ? `id:${r.id}` : `n:${r.nome}|${r.created_at ?? ""}`;
}
